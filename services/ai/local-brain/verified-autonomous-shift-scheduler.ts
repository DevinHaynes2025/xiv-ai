/**
 * 62L-DN Verified Autonomous Shift Scheduler —
 * Bounded offline/online agent shifts with evidence-based verification.
 * No powered node → WAITING_NODE or OFFLINE_STOPPED.
 * Stale heartbeat → not RUNNING_VERIFIED.
 * Learning ≠ permission.
 */

import { readJsonFile, writeJsonFileAtomic, xivLocalPath } from './durable-json';
import {
  DN_LOCKS,
  HEARTBEAT_TTL_MS,
  HONESTY_BANNER,
  MAX_NEW_SHIFTS_PER_CYCLE,
  MAX_SHIFT_SLOTS,
  NO_POWERED_NODE_WAITING_OR_STOPPED,
  STALE_HEARTBEAT_NOT_RUNNING_VERIFIED,
  type DnActor,
  type ShiftAgentStatus,
} from './universal-agent-runtime-os-types';

export type ShiftScheduler = {
  id: string;
  orgId: string;
  tenantId: string;
  universeId: string;
  shiftsBounded: true;
  learningEqPermission: false;
  createdAt: string;
};

export type ShiftNode = {
  id: string;
  schedulerId: string;
  name: string;
  powered: boolean;
  authorized: boolean;
  lastHeartbeatAt: string | null;
  runtimeEvidence: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ShiftSlot = {
  id: string;
  schedulerId: string;
  name: string;
  mode: 'offline' | 'online' | 'hybrid';
  nodeId: string | null;
  status: ShiftAgentStatus;
  lastHeartbeatAt: string | null;
  runtimeEvidence: string | null;
  bounded: true;
  createdAt: string;
  updatedAt: string;
};

type Store = {
  schedulers: ShiftScheduler[];
  nodes: ShiftNode[];
  slots: ShiftSlot[];
  createdThisCycle: number;
};

function storePath(root: string) {
  return xivLocalPath(root, 'verified-autonomous-shift-scheduler.json');
}

async function load(root: string): Promise<Store> {
  return readJsonFile<Store>(storePath(root), {
    schedulers: [],
    nodes: [],
    slots: [],
    createdThisCycle: 0,
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

export function verifiedAutonomousShiftSchedulerHonesty() {
  return {
    banner: HONESTY_BANNER,
    logicalAgentEqRunningVerified: DN_LOCKS.LOGICAL_AGENT_EQ_RUNNING_VERIFIED,
    runningVerifiedWithoutHeartbeat: DN_LOCKS.RUNNING_VERIFIED_WITHOUT_HEARTBEAT,
    staleHeartbeatNotRunningVerified: DN_LOCKS.STALE_HEARTBEAT_NOT_RUNNING_VERIFIED,
    noPoweredNodeYieldsWaitingOrStopped: DN_LOCKS.NO_POWERED_NODE_YIELDS_WAITING_OR_STOPPED,
    shiftsBounded: DN_LOCKS.SHIFTS_BOUNDED,
    learningEqPermission: DN_LOCKS.LEARNING_EQ_PERMISSION,
  };
}

export async function bootstrapVerifiedAutonomousShiftScheduler(input: {
  orgId: string;
  tenantId: string;
  universeId: string;
  root: string;
  actor: DnActor;
}): Promise<ShiftScheduler> {
  void input.actor;
  const store = await load(input.root);
  const existing = store.schedulers.find(
    (s) =>
      s.orgId === input.orgId &&
      s.tenantId === input.tenantId &&
      s.universeId === input.universeId,
  );
  if (existing) return existing;
  const scheduler: ShiftScheduler = {
    id: id('dnshift'),
    orgId: input.orgId,
    tenantId: input.tenantId,
    universeId: input.universeId,
    shiftsBounded: true,
    learningEqPermission: false,
    createdAt: new Date().toISOString(),
  };
  store.schedulers.push(scheduler);
  store.createdThisCycle = 0;
  await save(input.root, store);
  return scheduler;
}

export async function registerShiftNode(input: {
  schedulerId: string;
  name: string;
  powered?: boolean;
  authorized?: boolean;
  root: string;
  actor: DnActor;
}): Promise<{ accepted: boolean; reason: string; node?: ShiftNode }> {
  void input.actor;
  const store = await load(input.root);
  const scheduler = store.schedulers.find((s) => s.id === input.schedulerId);
  if (!scheduler) return { accepted: false, reason: 'SHIFT_SCHEDULER_NOT_FOUND' };
  const now = new Date().toISOString();
  const node: ShiftNode = {
    id: id('dnnode'),
    schedulerId: input.schedulerId,
    name: input.name,
    powered: input.powered === true,
    authorized: input.authorized === true,
    lastHeartbeatAt: null,
    runtimeEvidence: null,
    createdAt: now,
    updatedAt: now,
  };
  store.nodes.push(node);
  await save(input.root, store);
  return { accepted: true, reason: 'SHIFT_NODE_REGISTERED', node };
}

export async function scheduleBoundedShift(input: {
  schedulerId: string;
  name: string;
  mode?: ShiftSlot['mode'];
  nodeId?: string;
  root: string;
  actor: DnActor;
}): Promise<{ accepted: boolean; reason: string; slot?: ShiftSlot }> {
  void input.actor;
  const store = await load(input.root);
  const scheduler = store.schedulers.find((s) => s.id === input.schedulerId);
  if (!scheduler) return { accepted: false, reason: 'SHIFT_SCHEDULER_NOT_FOUND' };
  if (store.slots.length >= MAX_SHIFT_SLOTS) {
    return { accepted: false, reason: 'MAX_SHIFT_SLOTS_REACHED' };
  }
  if (store.createdThisCycle >= MAX_NEW_SHIFTS_PER_CYCLE) {
    return { accepted: false, reason: 'MAX_NEW_SHIFTS_PER_CYCLE_REACHED' };
  }

  const now = new Date().toISOString();
  let status: ShiftAgentStatus = 'BOUNDED_SHIFT';
  let reason = 'BOUNDED_SHIFT_SCHEDULED_AWAITING_VERIFICATION';
  let nodeId: string | null = input.nodeId ?? null;

  if (!nodeId) {
    const powered = store.nodes.find(
      (n) => n.schedulerId === input.schedulerId && n.powered && n.authorized,
    );
    if (!powered) {
      status = 'WAITING_NODE';
      reason = NO_POWERED_NODE_WAITING_OR_STOPPED;
      const slot: ShiftSlot = {
        id: id('dnslot'),
        schedulerId: input.schedulerId,
        name: input.name,
        mode: input.mode ?? 'offline',
        nodeId: null,
        status,
        lastHeartbeatAt: null,
        runtimeEvidence: null,
        bounded: true,
        createdAt: now,
        updatedAt: now,
      };
      store.slots.push(slot);
      store.createdThisCycle += 1;
      await save(input.root, store);
      return { accepted: false, reason, slot };
    }
    nodeId = powered.id;
  }

  const node = store.nodes.find((n) => n.id === nodeId);
  if (!node || !node.powered || !node.authorized) {
    status = 'OFFLINE_STOPPED';
    reason = NO_POWERED_NODE_WAITING_OR_STOPPED;
    const slot: ShiftSlot = {
      id: id('dnslot'),
      schedulerId: input.schedulerId,
      name: input.name,
      mode: input.mode ?? 'offline',
      nodeId: nodeId,
      status,
      lastHeartbeatAt: null,
      runtimeEvidence: null,
      bounded: true,
      createdAt: now,
      updatedAt: now,
    };
    store.slots.push(slot);
    store.createdThisCycle += 1;
    await save(input.root, store);
    return { accepted: false, reason, slot };
  }

  const slot: ShiftSlot = {
    id: id('dnslot'),
    schedulerId: input.schedulerId,
    name: input.name,
    mode: input.mode ?? 'hybrid',
    nodeId,
    status,
    lastHeartbeatAt: null,
    runtimeEvidence: null,
    bounded: true,
    createdAt: now,
    updatedAt: now,
  };
  store.slots.push(slot);
  store.createdThisCycle += 1;
  await save(input.root, store);
  return { accepted: true, reason, slot };
}

export async function recordShiftHeartbeat(input: {
  nodeId: string;
  runtimeEvidence: string;
  root: string;
  actor: DnActor;
  at?: string;
}): Promise<{ accepted: boolean; reason: string; node?: ShiftNode }> {
  void input.actor;
  const store = await load(input.root);
  const node = store.nodes.find((n) => n.id === input.nodeId);
  if (!node) return { accepted: false, reason: 'SHIFT_NODE_NOT_FOUND' };
  const now = input.at ?? new Date().toISOString();
  node.lastHeartbeatAt = now;
  node.runtimeEvidence = input.runtimeEvidence;
  node.updatedAt = now;
  await save(input.root, store);
  return { accepted: true, reason: 'SHIFT_HEARTBEAT_RECORDED', node };
}

export async function claimShiftRunningVerified(input: {
  slotId: string;
  nodeId?: string;
  fabricateWithoutHeartbeat?: boolean;
  forceStale?: boolean;
  root: string;
  actor: DnActor;
  nowMs?: number;
}): Promise<{ accepted: boolean; reason: string; slot?: ShiftSlot }> {
  void input.actor;
  const store = await load(input.root);
  const slot = store.slots.find((s) => s.id === input.slotId);
  if (!slot) return { accepted: false, reason: 'SHIFT_SLOT_NOT_FOUND' };
  const nowMs = input.nowMs ?? Date.now();
  const now = new Date(nowMs).toISOString();

  if (input.fabricateWithoutHeartbeat === true) {
    slot.status = 'LOGICAL';
    slot.updatedAt = now;
    await save(input.root, store);
    return {
      accepted: false,
      reason: 'LOGICAL_OR_FABRICATED_NOT_RUNNING_VERIFIED',
      slot,
    };
  }

  const nodeId = input.nodeId ?? slot.nodeId;
  if (!nodeId) {
    slot.status = 'WAITING_NODE';
    slot.updatedAt = now;
    await save(input.root, store);
    return { accepted: false, reason: NO_POWERED_NODE_WAITING_OR_STOPPED, slot };
  }

  const node = store.nodes.find((n) => n.id === nodeId);
  if (!node || !node.powered || !node.authorized) {
    slot.status = 'OFFLINE_STOPPED';
    slot.nodeId = nodeId;
    slot.updatedAt = now;
    await save(input.root, store);
    return { accepted: false, reason: NO_POWERED_NODE_WAITING_OR_STOPPED, slot };
  }

  const hbAt = node.lastHeartbeatAt;
  const fresh = input.forceStale === true ? false : heartbeatFresh(hbAt, nowMs);
  if (!fresh || !node.runtimeEvidence) {
    slot.status = 'HEARTBEAT_STALE';
    slot.nodeId = nodeId;
    slot.lastHeartbeatAt = hbAt;
    slot.runtimeEvidence = node.runtimeEvidence;
    slot.updatedAt = now;
    await save(input.root, store);
    return { accepted: false, reason: STALE_HEARTBEAT_NOT_RUNNING_VERIFIED, slot };
  }

  slot.status = 'RUNNING_VERIFIED';
  slot.nodeId = nodeId;
  slot.lastHeartbeatAt = hbAt;
  slot.runtimeEvidence = node.runtimeEvidence;
  slot.updatedAt = now;
  await save(input.root, store);
  return {
    accepted: true,
    reason: 'RUNNING_VERIFIED_WITH_FRESH_HEARTBEAT_AND_POWERED_NODE',
    slot,
  };
}
