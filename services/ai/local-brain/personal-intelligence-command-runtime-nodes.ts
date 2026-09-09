/**
 * 62L-DJ Command OS runtime node / heartbeat truth —
 * Fabricated RUNNING_VERIFIED without heartbeat is DENIED.
 */

import { readJsonFile, writeJsonFileAtomic, xivLocalPath } from './durable-json';
import {
  DJ_LOCKS,
  FABRICATED_RUNNING_VERIFIED_DENIED,
  HEARTBEAT_TTL_MS,
  HONESTY_BANNER,
  type DjActor,
  type RuntimeNodeStatus,
} from './personal-intelligence-command-os-types';

export type CommandRuntimeNode = {
  id: string;
  osId: string;
  name: string;
  status: RuntimeNodeStatus;
  lastHeartbeatAt: string | null;
  runtimeEvidence: string | null;
  logical: true;
  createdAt: string;
  updatedAt: string;
};

type Store = { nodes: CommandRuntimeNode[] };

function storePath(root: string) {
  return xivLocalPath(root, 'personal-intelligence-command-runtime-nodes.json');
}

async function load(root: string): Promise<Store> {
  return readJsonFile<Store>(storePath(root), { nodes: [] });
}

async function save(root: string, store: Store) {
  await writeJsonFileAtomic(storePath(root), store);
}

function id(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

function heartbeatFresh(at: string | null, nowMs = Date.now()): boolean {
  if (!at) return false;
  const ts = Date.parse(at);
  if (!Number.isFinite(ts)) return false;
  return nowMs - ts <= HEARTBEAT_TTL_MS;
}

export function commandRuntimeNodeHonesty() {
  return {
    banner: HONESTY_BANNER,
    runningVerifiedWithoutHeartbeat: DJ_LOCKS.RUNNING_VERIFIED_WITHOUT_HEARTBEAT,
    fabricatedRuntimeState: DJ_LOCKS.FABRICATED_RUNTIME_STATE,
    logicalAutoRunningVerified: DJ_LOCKS.LOGICAL_AUTO_RUNNING_VERIFIED,
  };
}

export async function registerCommandRuntimeNode(input: {
  osId: string;
  name: string;
  root: string;
  actor: DjActor;
}): Promise<{ accepted: boolean; reason: string; node?: CommandRuntimeNode; at: string }> {
  void input.actor;
  const store = await load(input.root);
  const now = new Date().toISOString();
  const node: CommandRuntimeNode = {
    id: id('djnode'),
    osId: input.osId,
    name: input.name.trim() || 'unnamed-node',
    status: 'LOGICAL',
    lastHeartbeatAt: null,
    runtimeEvidence: null,
    logical: true,
    createdAt: now,
    updatedAt: now,
  };
  store.nodes.push(node);
  await save(input.root, store);
  return { accepted: true, reason: 'RUNTIME_NODE_REGISTERED_LOGICAL', node, at: now };
}

export async function recordCommandNodeHeartbeat(input: {
  nodeId: string;
  runtimeEvidence: string;
  root: string;
  actor: DjActor;
}): Promise<{ accepted: boolean; reason: string; node?: CommandRuntimeNode; at: string }> {
  void input.actor;
  const store = await load(input.root);
  const now = new Date().toISOString();
  const node = store.nodes.find((n) => n.id === input.nodeId);
  if (!node) return { accepted: false, reason: 'RUNTIME_NODE_NOT_FOUND', at: now };
  node.lastHeartbeatAt = now;
  node.runtimeEvidence = input.runtimeEvidence.trim() || null;
  node.status = 'REGISTERED';
  node.updatedAt = now;
  await save(input.root, store);
  return { accepted: true, reason: 'HEARTBEAT_RECORDED', node, at: now };
}

export async function claimCommandNodeRunningVerified(input: {
  nodeId: string;
  fabricateWithoutHeartbeat?: boolean;
  root: string;
  actor: DjActor;
}): Promise<{ accepted: boolean; reason: string; node?: CommandRuntimeNode; at: string }> {
  void input.actor;
  const store = await load(input.root);
  const now = new Date().toISOString();
  const node = store.nodes.find((n) => n.id === input.nodeId);
  if (!node) return { accepted: false, reason: 'RUNTIME_NODE_NOT_FOUND', at: now };

  if (input.fabricateWithoutHeartbeat === true) {
    node.status = 'DENIED';
    node.updatedAt = now;
    await save(input.root, store);
    return {
      accepted: false,
      reason: FABRICATED_RUNNING_VERIFIED_DENIED,
      node,
      at: now,
    };
  }

  const fresh = heartbeatFresh(node.lastHeartbeatAt);
  const hasEvidence = Boolean(node.runtimeEvidence && node.runtimeEvidence.length > 0);
  if (!fresh || !hasEvidence) {
    node.status = 'DENIED';
    node.updatedAt = now;
    await save(input.root, store);
    return {
      accepted: false,
      reason: FABRICATED_RUNNING_VERIFIED_DENIED,
      node,
      at: now,
    };
  }

  node.status = 'RUNNING_VERIFIED';
  node.updatedAt = now;
  await save(input.root, store);
  return { accepted: true, reason: 'RUNNING_VERIFIED_WITH_HEARTBEAT_EVIDENCE', node, at: now };
}

export function commandNodeSurfaceStatus(node: CommandRuntimeNode, nowMs = Date.now()): RuntimeNodeStatus {
  if (node.status === 'DENIED') return 'DENIED';
  if (node.status === 'RUNNING_VERIFIED') {
    if (!heartbeatFresh(node.lastHeartbeatAt, nowMs) || !node.runtimeEvidence) {
      return 'HEARTBEAT_STALE';
    }
    return 'RUNNING_VERIFIED';
  }
  if (!node.lastHeartbeatAt) return 'LOGICAL';
  if (!heartbeatFresh(node.lastHeartbeatAt, nowMs)) return 'HEARTBEAT_STALE';
  return node.status;
}
