/**
 * 62L-CY Persistent Agent Research Societies —
 * Bounded research societies with heartbeat truth.
 * Logical population counts are NOT auto RUNNING_VERIFIED.
 * Missing heartbeat → not RUNNING_VERIFIED.
 * No powered authorized node → WAITING_NODE or OFFLINE_STOPPED.
 */

import { readJsonFile, writeJsonFileAtomic, xivLocalPath } from './durable-json';
import {
  CY_LOCKS,
  HEARTBEAT_TTL_MS,
  HONESTY_BANNER,
  LOGICAL_POPULATION_NOT_RUNNING_VERIFIED,
  MAX_LOGICAL_POPULATIONS,
  MAX_SOCIETIES,
  NO_HEARTBEAT_NOT_RUNNING_VERIFIED,
  NO_POWERED_NODE_WAITING_OR_STOPPED,
  type CyActor,
  type SocietyStatus,
} from './knowledge-colony-operating-system-types';

export type ResearchSociety = {
  id: string;
  name: string;
  orgId: string;
  tenantId: string;
  universeId: string;
  status: SocietyStatus;
  logicalPopulation: number;
  materializedWorkers: number;
  runningVerifiedWorkers: number;
  authorizedNodePowered: boolean;
  lastHeartbeatAt: string | null;
  runtimeEvidence: string | null;
  createdAt: string;
  updatedAt: string;
};

export type SocietyResult = {
  accepted: boolean;
  reason: string;
  society?: ResearchSociety;
  at: string;
};

export type SocietyCensus = {
  logicalPopulation: number;
  materializedWorkers: number;
  runningVerifiedWorkers: number;
  societies: number;
  autoRunningVerifiedFromLogical: false;
  reason: string;
};

type Store = { societies: ResearchSociety[] };

function storePath(root: string) {
  return xivLocalPath(root, 'persistent-agent-research-societies.json');
}

async function load(root: string): Promise<Store> {
  return readJsonFile<Store>(storePath(root), { societies: [] });
}

async function save(root: string, store: Store) {
  await writeJsonFileAtomic(storePath(root), store);
}

function id(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function researchSocietiesHonesty() {
  return {
    banner: HONESTY_BANNER,
    l4AutonomyEnabled: CY_LOCKS.L4_AUTONOMY_ENABLED,
    runningVerifiedWithoutHeartbeat: CY_LOCKS.RUNNING_VERIFIED_WITHOUT_HEARTBEAT,
    logicalPopulationAutoRunningVerified:
      CY_LOCKS.LOGICAL_POPULATION_AUTO_RUNNING_VERIFIED,
    offlineDevicesPretendRunning: CY_LOCKS.OFFLINE_DEVICES_PRETEND_RUNNING,
  };
}

export async function registerResearchSociety(input: {
  name: string;
  orgId: string;
  tenantId: string;
  universeId: string;
  logicalPopulation?: number;
  authorizedNodePowered?: boolean;
  root: string;
  actor: CyActor;
}): Promise<SocietyResult> {
  void input.actor;
  const store = await load(input.root);
  if (store.societies.length >= MAX_SOCIETIES) {
    return {
      accepted: false,
      reason: 'MAX_SOCIETIES_BOUNDED',
      at: new Date().toISOString(),
    };
  }
  const logical = Math.max(0, Math.min(input.logicalPopulation ?? 0, MAX_LOGICAL_POPULATIONS));
  const powered = input.authorizedNodePowered === true;
  const now = new Date().toISOString();
  const society: ResearchSociety = {
    id: id('pars'),
    name: input.name.trim() || 'unnamed-society',
    orgId: input.orgId,
    tenantId: input.tenantId,
    universeId: input.universeId,
    status: powered ? 'LOGICAL' : 'WAITING_NODE',
    logicalPopulation: logical,
    materializedWorkers: 0,
    runningVerifiedWorkers: 0,
    authorizedNodePowered: powered,
    lastHeartbeatAt: null,
    runtimeEvidence: null,
    createdAt: now,
    updatedAt: now,
  };
  store.societies.push(society);
  await save(input.root, store);
  return {
    accepted: true,
    reason: powered
      ? LOGICAL_POPULATION_NOT_RUNNING_VERIFIED
      : NO_POWERED_NODE_WAITING_OR_STOPPED,
    society,
    at: now,
  };
}

export async function materializeSocietyWorkers(input: {
  societyId: string;
  count: number;
  root: string;
  actor: CyActor;
}): Promise<SocietyResult> {
  void input.actor;
  const store = await load(input.root);
  const society = store.societies.find((s) => s.id === input.societyId);
  const now = new Date().toISOString();
  if (!society) {
    return { accepted: false, reason: 'SOCIETY_NOT_FOUND', at: now };
  }
  if (!society.authorizedNodePowered) {
    society.status = 'WAITING_NODE';
    society.updatedAt = now;
    await save(input.root, store);
    return {
      accepted: false,
      reason: NO_POWERED_NODE_WAITING_OR_STOPPED,
      society,
      at: now,
    };
  }
  const count = Math.max(0, Math.min(input.count, society.logicalPopulation));
  society.materializedWorkers = count;
  society.status = count > 0 ? 'MATERIALIZED' : 'LOGICAL';
  society.runningVerifiedWorkers = 0;
  society.updatedAt = now;
  await save(input.root, store);
  return {
    accepted: true,
    reason: LOGICAL_POPULATION_NOT_RUNNING_VERIFIED,
    society,
    at: now,
  };
}

export async function setSocietyNodePower(input: {
  societyId: string;
  powered: boolean;
  stopMode?: 'WAITING_NODE' | 'OFFLINE_STOPPED';
  root: string;
  actor: CyActor;
}): Promise<SocietyResult> {
  void input.actor;
  const store = await load(input.root);
  const society = store.societies.find((s) => s.id === input.societyId);
  const now = new Date().toISOString();
  if (!society) {
    return { accepted: false, reason: 'SOCIETY_NOT_FOUND', at: now };
  }
  society.authorizedNodePowered = input.powered;
  society.updatedAt = now;
  if (!input.powered) {
    society.status = input.stopMode === 'OFFLINE_STOPPED' ? 'OFFLINE_STOPPED' : 'WAITING_NODE';
    society.lastHeartbeatAt = null;
    society.runtimeEvidence = null;
    society.runningVerifiedWorkers = 0;
  } else if (
    society.status === 'WAITING_NODE' ||
    society.status === 'OFFLINE_STOPPED'
  ) {
    society.status =
      society.materializedWorkers > 0
        ? 'MATERIALIZED'
        : society.logicalPopulation > 0
          ? 'LOGICAL'
          : 'REGISTERED';
  }
  await save(input.root, store);
  return {
    accepted: true,
    reason: input.powered
      ? 'AUTHORIZED_NODE_POWERED'
      : NO_POWERED_NODE_WAITING_OR_STOPPED,
    society,
    at: now,
  };
}

export async function recordSocietyHeartbeat(input: {
  societyId: string;
  runtimeEvidence: string;
  root: string;
  actor: CyActor;
}): Promise<SocietyResult> {
  void input.actor;
  const store = await load(input.root);
  const society = store.societies.find((s) => s.id === input.societyId);
  const now = new Date().toISOString();
  if (!society) {
    return { accepted: false, reason: 'SOCIETY_NOT_FOUND', at: now };
  }
  if (!society.authorizedNodePowered) {
    society.status = 'WAITING_NODE';
    society.updatedAt = now;
    await save(input.root, store);
    return {
      accepted: false,
      reason: NO_POWERED_NODE_WAITING_OR_STOPPED,
      society,
      at: now,
    };
  }
  const evidence = input.runtimeEvidence.trim();
  if (!evidence) {
    return {
      accepted: false,
      reason: NO_HEARTBEAT_NOT_RUNNING_VERIFIED,
      society,
      at: now,
    };
  }
  society.lastHeartbeatAt = now;
  society.runtimeEvidence = evidence;
  society.runningVerifiedWorkers = Math.min(
    society.materializedWorkers,
    Math.max(1, society.materializedWorkers),
  );
  society.status = 'RUNNING_VERIFIED';
  society.updatedAt = now;
  await save(input.root, store);
  return {
    accepted: true,
    reason: 'SOCIETY_HEARTBEAT_RECORDED_RUNNING_VERIFIED',
    society,
    at: now,
  };
}

export async function claimSocietyRunningVerified(input: {
  societyId: string;
  root: string;
  actor: CyActor;
}): Promise<SocietyResult> {
  void input.actor;
  const store = await load(input.root);
  const society = store.societies.find((s) => s.id === input.societyId);
  const now = new Date().toISOString();
  if (!society) {
    return { accepted: false, reason: 'SOCIETY_NOT_FOUND', at: now };
  }
  if (!society.authorizedNodePowered) {
    society.status =
      society.status === 'OFFLINE_STOPPED' ? 'OFFLINE_STOPPED' : 'WAITING_NODE';
    society.runningVerifiedWorkers = 0;
    society.updatedAt = now;
    await save(input.root, store);
    return {
      accepted: false,
      reason: NO_POWERED_NODE_WAITING_OR_STOPPED,
      society,
      at: now,
    };
  }
  if (!society.lastHeartbeatAt || !society.runtimeEvidence) {
    if (society.status === 'RUNNING_VERIFIED') society.status = 'HEARTBEAT_STALE';
    society.runningVerifiedWorkers = 0;
    society.updatedAt = now;
    await save(input.root, store);
    return {
      accepted: false,
      reason: NO_HEARTBEAT_NOT_RUNNING_VERIFIED,
      society,
      at: now,
    };
  }
  const age = Date.now() - Date.parse(society.lastHeartbeatAt);
  if (Number.isNaN(age) || age > HEARTBEAT_TTL_MS) {
    society.status = 'HEARTBEAT_STALE';
    society.runningVerifiedWorkers = 0;
    society.updatedAt = now;
    await save(input.root, store);
    return {
      accepted: false,
      reason: NO_HEARTBEAT_NOT_RUNNING_VERIFIED,
      society,
      at: now,
    };
  }
  society.status = 'RUNNING_VERIFIED';
  society.updatedAt = now;
  await save(input.root, store);
  return {
    accepted: true,
    reason: 'SOCIETY_RUNNING_VERIFIED_WITH_HEARTBEAT',
    society,
    at: now,
  };
}

export async function societyCensus(input: {
  root: string;
  actor: CyActor;
}): Promise<SocietyCensus> {
  void input.actor;
  const store = await load(input.root);
  const logicalPopulation = store.societies.reduce(
    (n, s) => n + s.logicalPopulation,
    0,
  );
  const materializedWorkers = store.societies.reduce(
    (n, s) => n + s.materializedWorkers,
    0,
  );
  const runningVerifiedWorkers = store.societies.reduce(
    (n, s) => n + (s.status === 'RUNNING_VERIFIED' ? s.runningVerifiedWorkers : 0),
    0,
  );
  return {
    logicalPopulation,
    materializedWorkers,
    runningVerifiedWorkers,
    societies: store.societies.length,
    autoRunningVerifiedFromLogical: false,
    reason: LOGICAL_POPULATION_NOT_RUNNING_VERIFIED,
  };
}
