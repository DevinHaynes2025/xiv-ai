/**
 * 62L-DR Neural Node Expansion — sparse logical enterprise routing nodes.
 * RUNNING_VERIFIED requires fresh heartbeat evidence; logical ≠ running.
 */

import { readJsonFile, writeJsonFileAtomic, xivLocalPath } from './durable-json';
import {
  DR_LOCKS,
  HEARTBEAT_FRESH_MS,
  HONESTY_BANNER,
  MAX_NEURAL_NODES_MATERIALIZED,
  NO_HEARTBEAT_NOT_RUNNING_VERIFIED,
  type DrActor,
  type DrEvidenceState,
} from './enterprise-nervous-revenue-command-types';

export type EnterpriseNeuralNode = {
  id: string;
  label: string;
  routeKind: 'revenue' | 'executive' | 'negotiation' | 'ops' | 'security' | 'legal';
  materialized: boolean;
  logical: true;
  status: DrEvidenceState;
  lastHeartbeatAt: string | null;
  createdAt: string;
};

type Store = { nodes: EnterpriseNeuralNode[] };

function storePath(root: string) {
  return xivLocalPath(root, 'enterprise-neural-node-expansion.json');
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
  const t = Date.parse(at);
  if (Number.isNaN(t)) return false;
  return nowMs - t <= HEARTBEAT_FRESH_MS;
}

export function enterpriseNeuralNodeExpansionHonesty() {
  return {
    banner: HONESTY_BANNER,
    logicalEqRunningVerified: DR_LOCKS.LOGICAL_NODE_EQ_RUNNING_VERIFIED,
    runningVerifiedWithoutHeartbeat: DR_LOCKS.RUNNING_VERIFIED_WITHOUT_HEARTBEAT,
    maxMaterialized: MAX_NEURAL_NODES_MATERIALIZED,
    sparse: true as const,
  };
}

export async function expandEnterpriseNeuralNode(input: {
  label: string;
  routeKind: EnterpriseNeuralNode['routeKind'];
  materialize?: boolean;
  root: string;
  actor: DrActor;
}): Promise<{ node: EnterpriseNeuralNode; reason?: string }> {
  const store = await load(input.root);
  void input.actor;
  const materializedCount = store.nodes.filter((n) => n.materialized).length;
  const wantMaterialize = Boolean(input.materialize);
  const canMaterialize =
    wantMaterialize && materializedCount < MAX_NEURAL_NODES_MATERIALIZED;

  const node: EnterpriseNeuralNode = {
    id: id('enn'),
    label: input.label,
    routeKind: input.routeKind,
    materialized: canMaterialize,
    logical: true,
    status: 'LOGICAL',
    lastHeartbeatAt: null,
    createdAt: new Date().toISOString(),
  };
  store.nodes.push(node);
  await save(input.root, store);
  return {
    node,
    reason: wantMaterialize && !canMaterialize ? 'MATERIALIZE_BOUND_REACHED' : undefined,
  };
}

export async function pulseNeuralNodeHeartbeat(input: {
  nodeId: string;
  root: string;
  actor: DrActor;
}): Promise<EnterpriseNeuralNode | null> {
  const store = await load(input.root);
  void input.actor;
  const node = store.nodes.find((n) => n.id === input.nodeId);
  if (!node) return null;
  node.lastHeartbeatAt = new Date().toISOString();
  if (node.materialized && heartbeatFresh(node.lastHeartbeatAt)) {
    node.status = 'RUNNING_VERIFIED';
  } else {
    node.status = 'LOGICAL';
  }
  await save(input.root, store);
  return node;
}

export async function verifyNeuralNodeRunning(input: {
  nodeId: string;
  root: string;
  actor: DrActor;
}): Promise<{
  status: DrEvidenceState;
  reason: string;
  node: EnterpriseNeuralNode | null;
}> {
  const store = await load(input.root);
  void input.actor;
  const node = store.nodes.find((n) => n.id === input.nodeId) ?? null;
  if (!node) {
    return { status: 'UNAVAILABLE', reason: 'NODE_NOT_FOUND', node: null };
  }
  if (!node.lastHeartbeatAt || !heartbeatFresh(node.lastHeartbeatAt)) {
    node.status = node.materialized ? 'STALE' : 'LOGICAL';
    await save(input.root, store);
    return {
      status: node.status,
      reason: NO_HEARTBEAT_NOT_RUNNING_VERIFIED,
      node,
    };
  }
  if (!node.materialized) {
    return {
      status: 'LOGICAL',
      reason: NO_HEARTBEAT_NOT_RUNNING_VERIFIED,
      node,
    };
  }
  node.status = 'RUNNING_VERIFIED';
  await save(input.root, store);
  return { status: 'RUNNING_VERIFIED', reason: 'FRESH_HEARTBEAT_EVIDENCE', node };
}
