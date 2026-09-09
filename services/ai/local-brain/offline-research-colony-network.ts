/**
 * 62L-CX Offline Research Colony Network —
 * Persistent research colonies with truthful heartbeat status.
 * No powered authorized node → WAITING_NODE or OFFLINE_STOPPED (CW realism).
 * RUNNING_VERIFIED only with fresh heartbeat + runtime evidence.
 */

import { readJsonFile, writeJsonFileAtomic, xivLocalPath } from './durable-json';
import {
  ALL_NODES_OFFLINE_WAITING_OR_STOPPED,
  CX_LOCKS,
  HEARTBEAT_TTL_MS,
  HONESTY_BANNER,
  MAX_COLONIES,
  NO_HEARTBEAT_NOT_RUNNING_VERIFIED,
  type ColonyStatus,
  type CxActor,
} from './persistent-knowledge-civilization-types';

export type ResearchColony = {
  id: string;
  name: string;
  orgId: string;
  tenantId: string;
  universeId: string;
  status: ColonyStatus;
  authorizedNodePowered: boolean;
  lastHeartbeatAt: string | null;
  runtimeEvidence: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ColonyResult = {
  accepted: boolean;
  reason: string;
  colony?: ResearchColony;
  networkStatus?: ColonyStatus;
  at: string;
};

type Store = { colonies: ResearchColony[] };

function storePath(root: string) {
  return xivLocalPath(root, 'offline-research-colony-network.json');
}

async function load(root: string): Promise<Store> {
  return readJsonFile<Store>(storePath(root), { colonies: [] });
}

async function save(root: string, store: Store) {
  await writeJsonFileAtomic(storePath(root), store);
}

function id(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function offlineColonyNetworkHonesty() {
  return {
    banner: HONESTY_BANNER,
    l4AutonomyEnabled: CX_LOCKS.L4_AUTONOMY_ENABLED,
    runningVerifiedWithoutHeartbeat: CX_LOCKS.RUNNING_VERIFIED_WITHOUT_HEARTBEAT,
    offlineDevicesPretendRunning: CX_LOCKS.OFFLINE_DEVICES_PRETEND_RUNNING,
  };
}

export async function registerResearchColony(input: {
  name: string;
  orgId: string;
  tenantId: string;
  universeId: string;
  authorizedNodePowered?: boolean;
  root: string;
  actor: CxActor;
}): Promise<ColonyResult> {
  void input.actor;
  const store = await load(input.root);
  if (store.colonies.length >= MAX_COLONIES) {
    return {
      accepted: false,
      reason: 'MAX_COLONIES_BOUNDED',
      at: new Date().toISOString(),
    };
  }
  const now = new Date().toISOString();
  const powered = input.authorizedNodePowered === true;
  const colony: ResearchColony = {
    id: id('orc'),
    name: input.name.trim() || 'unnamed-colony',
    orgId: input.orgId,
    tenantId: input.tenantId,
    universeId: input.universeId,
    status: powered ? 'REGISTERED' : 'WAITING_NODE',
    authorizedNodePowered: powered,
    lastHeartbeatAt: null,
    runtimeEvidence: null,
    createdAt: now,
    updatedAt: now,
  };
  store.colonies.push(colony);
  await save(input.root, store);
  return {
    accepted: true,
    reason: powered ? 'COLONY_REGISTERED' : ALL_NODES_OFFLINE_WAITING_OR_STOPPED,
    colony,
    at: now,
  };
}

export async function setAuthorizedNodesPowered(input: {
  powered: boolean;
  root: string;
  actor: CxActor;
}): Promise<ColonyResult> {
  void input.actor;
  const store = await load(input.root);
  const now = new Date().toISOString();
  if (store.colonies.length === 0) {
    return {
      accepted: true,
      reason: input.powered
        ? 'NO_COLONIES_REGISTERED'
        : ALL_NODES_OFFLINE_WAITING_OR_STOPPED,
      networkStatus: input.powered ? 'UNKNOWN' : 'WAITING_NODE',
      at: now,
    };
  }
  for (const colony of store.colonies) {
    colony.authorizedNodePowered = input.powered;
    colony.updatedAt = now;
    if (!input.powered) {
      colony.status = 'OFFLINE_STOPPED';
      colony.lastHeartbeatAt = null;
      colony.runtimeEvidence = null;
    } else if (colony.status === 'OFFLINE_STOPPED' || colony.status === 'WAITING_NODE') {
      colony.status = 'REGISTERED';
    }
  }
  await save(input.root, store);
  return {
    accepted: true,
    reason: input.powered
      ? 'AUTHORIZED_NODES_POWERED'
      : ALL_NODES_OFFLINE_WAITING_OR_STOPPED,
    networkStatus: input.powered ? 'REGISTERED' : 'OFFLINE_STOPPED',
    colony: store.colonies[0],
    at: now,
  };
}

export async function evaluateOfflineColonyNetwork(input: {
  root: string;
  actor: CxActor;
}): Promise<ColonyResult> {
  void input.actor;
  const store = await load(input.root);
  const now = new Date().toISOString();
  const anyPowered = store.colonies.some((c) => c.authorizedNodePowered);
  if (store.colonies.length === 0 || !anyPowered) {
    return {
      accepted: false,
      reason: ALL_NODES_OFFLINE_WAITING_OR_STOPPED,
      networkStatus: store.colonies.length === 0 ? 'WAITING_NODE' : 'OFFLINE_STOPPED',
      colony: store.colonies[0],
      at: now,
    };
  }
  return {
    accepted: true,
    reason: 'AUTHORIZED_NODE_POWERED',
    networkStatus: 'REGISTERED',
    colony: store.colonies.find((c) => c.authorizedNodePowered),
    at: now,
  };
}

export async function recordColonyHeartbeat(input: {
  colonyId: string;
  runtimeEvidence: string;
  root: string;
  actor: CxActor;
}): Promise<ColonyResult> {
  void input.actor;
  const store = await load(input.root);
  const colony = store.colonies.find((c) => c.id === input.colonyId);
  const now = new Date().toISOString();
  if (!colony) {
    return { accepted: false, reason: 'COLONY_NOT_FOUND', at: now };
  }
  if (!colony.authorizedNodePowered) {
    colony.status = 'OFFLINE_STOPPED';
    colony.updatedAt = now;
    await save(input.root, store);
    return {
      accepted: false,
      reason: ALL_NODES_OFFLINE_WAITING_OR_STOPPED,
      colony,
      networkStatus: 'OFFLINE_STOPPED',
      at: now,
    };
  }
  if (!input.runtimeEvidence?.trim()) {
    return {
      accepted: false,
      reason: NO_HEARTBEAT_NOT_RUNNING_VERIFIED,
      colony,
      at: now,
    };
  }
  colony.lastHeartbeatAt = now;
  colony.runtimeEvidence = input.runtimeEvidence.trim();
  colony.status = 'RUNNING_VERIFIED';
  colony.updatedAt = now;
  await save(input.root, store);
  return {
    accepted: true,
    reason: 'COLONY_HEARTBEAT_RECORDED_RUNNING_VERIFIED',
    colony,
    at: now,
  };
}

export async function claimColonyRunningVerified(input: {
  colonyId: string;
  root: string;
  actor: CxActor;
}): Promise<ColonyResult> {
  void input.actor;
  const store = await load(input.root);
  const colony = store.colonies.find((c) => c.id === input.colonyId);
  const now = new Date().toISOString();
  if (!colony) {
    return { accepted: false, reason: 'COLONY_NOT_FOUND', at: now };
  }
  if (!colony.authorizedNodePowered) {
    colony.status =
      colony.status === 'OFFLINE_STOPPED' ? 'OFFLINE_STOPPED' : 'WAITING_NODE';
    colony.updatedAt = now;
    await save(input.root, store);
    return {
      accepted: false,
      reason: ALL_NODES_OFFLINE_WAITING_OR_STOPPED,
      colony,
      networkStatus: colony.status,
      at: now,
    };
  }
  if (!colony.lastHeartbeatAt || !colony.runtimeEvidence) {
    return {
      accepted: false,
      reason: NO_HEARTBEAT_NOT_RUNNING_VERIFIED,
      colony,
      at: now,
    };
  }
  const age = Date.now() - Date.parse(colony.lastHeartbeatAt);
  if (Number.isNaN(age) || age > HEARTBEAT_TTL_MS) {
    colony.status = 'HEARTBEAT_STALE';
    colony.updatedAt = now;
    await save(input.root, store);
    return {
      accepted: false,
      reason: NO_HEARTBEAT_NOT_RUNNING_VERIFIED,
      colony,
      at: now,
    };
  }
  colony.status = 'RUNNING_VERIFIED';
  colony.updatedAt = now;
  await save(input.root, store);
  return {
    accepted: true,
    reason: 'COLONY_RUNNING_VERIFIED',
    colony,
    at: now,
  };
}
