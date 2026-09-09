/**
 * 62L-DL Verified Always-On Agent Shift Network —
 * Evidence-based always-on shifts extending DK offline proof harness.
 * No powered node → WAITING_NODE / OFFLINE_STOPPED.
 * Stale heartbeat → not RUNNING_VERIFIED.
 */

import { readJsonFile, writeJsonFileAtomic, xivLocalPath } from './durable-json';
import {
  DL_LOCKS,
  HEARTBEAT_TTL_MS,
  HONESTY_BANNER,
  MAX_AGENT_SHIFTS,
  NO_POWERED_NODE_WAITING_OR_STOPPED,
  STALE_HEARTBEAT_NOT_RUNNING_VERIFIED,
  type AgentShiftStatus,
  type DlActor,
} from './neural-transportation-os-types';

export type VerifiedAlwaysOnAgentShiftNetwork = {
  id: string;
  orgId: string;
  tenantId: string;
  universeId: string;
  fake247RunningWithoutNode: false;
  createdAt: string;
};

export type ShiftPoweredNode = {
  id: string;
  networkId: string;
  name: string;
  powered: boolean;
  authorized: boolean;
  lastHeartbeatAt: string | null;
  runtimeEvidence: string | null;
  createdAt: string;
  updatedAt: string;
};

export type AgentShift = {
  id: string;
  networkId: string;
  name: string;
  nodeId: string | null;
  status: AgentShiftStatus;
  lastHeartbeatAt: string | null;
  runtimeEvidence: string | null;
  createdAt: string;
  updatedAt: string;
};

type Store = {
  networks: VerifiedAlwaysOnAgentShiftNetwork[];
  nodes: ShiftPoweredNode[];
  shifts: AgentShift[];
};

function storePath(root: string) {
  return xivLocalPath(root, 'verified-always-on-agent-shift-network.json');
}

async function load(root: string): Promise<Store> {
  return readJsonFile<Store>(storePath(root), {
    networks: [],
    nodes: [],
    shifts: [],
  });
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

export function verifiedAlwaysOnAgentShiftNetworkHonesty() {
  return {
    banner: HONESTY_BANNER,
    fake247RunningWithoutNode: DL_LOCKS.FAKE_247_RUNNING_WITHOUT_NODE,
    runningVerifiedRequiresPoweredAuthorizedNode:
      DL_LOCKS.RUNNING_VERIFIED_REQUIRES_POWERED_AUTHORIZED_NODE,
    runningVerifiedRequiresFreshHeartbeat:
      DL_LOCKS.RUNNING_VERIFIED_REQUIRES_FRESH_HEARTBEAT,
    staleHeartbeatEqRunningVerified: DL_LOCKS.STALE_HEARTBEAT_EQ_RUNNING_VERIFIED,
    noPoweredNodeYieldsWaitingOrStopped: DL_LOCKS.NO_POWERED_NODE_YIELDS_WAITING_OR_STOPPED,
  };
}

export async function bootstrapVerifiedAlwaysOnAgentShiftNetwork(input: {
  orgId: string;
  tenantId: string;
  universeId: string;
  root: string;
  actor: DlActor;
}): Promise<VerifiedAlwaysOnAgentShiftNetwork> {
  void input.actor;
  const store = await load(input.root);
  const existing = store.networks.find(
    (n) =>
      n.orgId === input.orgId &&
      n.tenantId === input.tenantId &&
      n.universeId === input.universeId,
  );
  if (existing) return existing;
  const network: VerifiedAlwaysOnAgentShiftNetwork = {
    id: id('dlshiftnet'),
    orgId: input.orgId,
    tenantId: input.tenantId,
    universeId: input.universeId,
    fake247RunningWithoutNode: false,
    createdAt: new Date().toISOString(),
  };
  store.networks.push(network);
  await save(input.root, store);
  return network;
}

export async function registerShiftPoweredNode(input: {
  networkId: string;
  name: string;
  powered: boolean;
  authorized: boolean;
  root: string;
  actor: DlActor;
}): Promise<{ accepted: boolean; reason: string; node?: ShiftPoweredNode; at: string }> {
  void input.actor;
  const store = await load(input.root);
  const now = new Date().toISOString();
  const network = store.networks.find((n) => n.id === input.networkId);
  if (!network) return { accepted: false, reason: 'NETWORK_NOT_FOUND', at: now };

  const node: ShiftPoweredNode = {
    id: id('dlnode'),
    networkId: input.networkId,
    name: input.name.trim() || 'unnamed-node',
    powered: input.powered === true,
    authorized: input.authorized === true,
    lastHeartbeatAt: null,
    runtimeEvidence: null,
    createdAt: now,
    updatedAt: now,
  };
  store.nodes.push(node);
  await save(input.root, store);
  return { accepted: true, reason: 'SHIFT_POWERED_NODE_REGISTERED', node, at: now };
}

export async function registerAgentShift(input: {
  networkId: string;
  name: string;
  root: string;
  actor: DlActor;
}): Promise<{ accepted: boolean; reason: string; shift?: AgentShift; at: string }> {
  void input.actor;
  const store = await load(input.root);
  const now = new Date().toISOString();
  const network = store.networks.find((n) => n.id === input.networkId);
  if (!network) return { accepted: false, reason: 'NETWORK_NOT_FOUND', at: now };
  if (store.shifts.length >= MAX_AGENT_SHIFTS) {
    return { accepted: false, reason: 'MAX_AGENT_SHIFTS_REACHED', at: now };
  }

  const shift: AgentShift = {
    id: id('dlshift'),
    networkId: input.networkId,
    name: input.name.trim() || 'unnamed-shift',
    nodeId: null,
    status: 'REGISTERED',
    lastHeartbeatAt: null,
    runtimeEvidence: null,
    createdAt: now,
    updatedAt: now,
  };
  store.shifts.push(shift);
  await save(input.root, store);
  return { accepted: true, reason: 'AGENT_SHIFT_REGISTERED', shift, at: now };
}

export async function recordShiftNodeHeartbeat(input: {
  nodeId: string;
  runtimeEvidence: string;
  at?: string;
  root: string;
  actor: DlActor;
}): Promise<{ accepted: boolean; reason: string; node?: ShiftPoweredNode; at: string }> {
  void input.actor;
  const store = await load(input.root);
  const now = new Date().toISOString();
  const node = store.nodes.find((n) => n.id === input.nodeId);
  if (!node) return { accepted: false, reason: 'NODE_NOT_FOUND', at: now };
  node.lastHeartbeatAt = input.at ?? now;
  node.runtimeEvidence = input.runtimeEvidence.trim() || null;
  node.updatedAt = now;
  await save(input.root, store);
  return { accepted: true, reason: 'SHIFT_NODE_HEARTBEAT_RECORDED', node, at: now };
}

export async function claimShiftRunningVerified(input: {
  shiftId: string;
  nodeId?: string | null;
  nowMs?: number;
  root: string;
  actor: DlActor;
}): Promise<{ accepted: boolean; reason: string; shift?: AgentShift; at: string }> {
  void input.actor;
  const store = await load(input.root);
  const now = new Date().toISOString();
  const nowMs = input.nowMs ?? Date.now();
  const shift = store.shifts.find((s) => s.id === input.shiftId);
  if (!shift) return { accepted: false, reason: 'SHIFT_NOT_FOUND', at: now };

  if (!input.nodeId) {
    shift.status = 'WAITING_NODE';
    shift.updatedAt = now;
    await save(input.root, store);
    return {
      accepted: false,
      reason: NO_POWERED_NODE_WAITING_OR_STOPPED,
      shift,
      at: now,
    };
  }

  const node = store.nodes.find((n) => n.id === input.nodeId);
  if (!node || !node.powered || !node.authorized) {
    shift.status = node?.powered === false ? 'OFFLINE_STOPPED' : 'WAITING_NODE';
    shift.nodeId = input.nodeId;
    shift.updatedAt = now;
    await save(input.root, store);
    return {
      accepted: false,
      reason: NO_POWERED_NODE_WAITING_OR_STOPPED,
      shift,
      at: now,
    };
  }

  const fresh = heartbeatFresh(node.lastHeartbeatAt, nowMs);
  const hasEvidence = Boolean(node.runtimeEvidence && node.runtimeEvidence.length > 0);
  if (!fresh || !hasEvidence) {
    shift.status = 'HEARTBEAT_STALE';
    shift.nodeId = node.id;
    shift.lastHeartbeatAt = node.lastHeartbeatAt;
    shift.runtimeEvidence = node.runtimeEvidence;
    shift.updatedAt = now;
    await save(input.root, store);
    return {
      accepted: false,
      reason: STALE_HEARTBEAT_NOT_RUNNING_VERIFIED,
      shift,
      at: now,
    };
  }

  shift.status = 'RUNNING_VERIFIED';
  shift.nodeId = node.id;
  shift.lastHeartbeatAt = node.lastHeartbeatAt;
  shift.runtimeEvidence = node.runtimeEvidence;
  shift.updatedAt = now;
  await save(input.root, store);
  return {
    accepted: true,
    reason: 'RUNNING_VERIFIED_ON_POWERED_AUTHORIZED_NODE_WITH_FRESH_HEARTBEAT',
    shift,
    at: now,
  };
}

export async function scheduleAlwaysOnShiftWithoutPoweredNode(input: {
  shiftId: string;
  preferStopped?: boolean;
  root: string;
  actor: DlActor;
}): Promise<{ accepted: boolean; reason: string; shift?: AgentShift; at: string }> {
  void input.actor;
  const store = await load(input.root);
  const now = new Date().toISOString();
  const shift = store.shifts.find((s) => s.id === input.shiftId);
  if (!shift) return { accepted: false, reason: 'SHIFT_NOT_FOUND', at: now };

  const powered = store.nodes.find(
    (n) => n.networkId === shift.networkId && n.powered && n.authorized,
  );
  if (!powered) {
    shift.status = input.preferStopped ? 'OFFLINE_STOPPED' : 'WAITING_NODE';
    shift.updatedAt = now;
    await save(input.root, store);
    return {
      accepted: false,
      reason: NO_POWERED_NODE_WAITING_OR_STOPPED,
      shift,
      at: now,
    };
  }

  return {
    accepted: false,
    reason: 'USE_CLAIM_SHIFT_RUNNING_VERIFIED_WITH_FRESH_HEARTBEAT',
    shift,
    at: now,
  };
}
