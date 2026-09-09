/**
 * 62L-CV Agent Research Workforce Federation —
 * Federated research workforce with truthful census states.
 * RUNNING_VERIFIED only with fresh heartbeat + runtime evidence.
 * Census cannot invent live agents.
 */

import { readJsonFile, writeJsonFileAtomic, xivLocalPath } from './durable-json';
import {
  CENSUS_INVENT_LIVE_DENIED,
  CV_LOCKS,
  HEARTBEAT_TTL_MS,
  HONESTY_BANNER,
  MAX_FEDERATED_WORKCELLS,
  NO_HEARTBEAT_NOT_RUNNING_VERIFIED,
  type CvActor,
  type WorkcellCensusStatus,
} from './distributed-intelligence-laboratory-os-types';

export type FederatedWorkcell = {
  id: string;
  name: string;
  orgId: string;
  tenantId: string;
  status: WorkcellCensusStatus;
  lastHeartbeatAt: string | null;
  runtimeEvidence: string | null;
  permissionLevel: number;
  invented: false;
  createdAt: string;
  updatedAt: string;
};

export type WorkforceResult = {
  accepted: boolean;
  reason: string;
  workcell?: FederatedWorkcell;
  at: string;
};

type Store = { workcells: FederatedWorkcell[] };

function storePath(root: string) {
  return xivLocalPath(root, 'agent-research-workforce-federation.json');
}

async function load(root: string): Promise<Store> {
  return readJsonFile<Store>(storePath(root), { workcells: [] });
}

async function save(root: string, store: Store) {
  await writeJsonFileAtomic(storePath(root), store);
}

function id(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function workforceFederationHonesty() {
  return {
    banner: HONESTY_BANNER,
    l4AutonomyEnabled: CV_LOCKS.L4_AUTONOMY_ENABLED,
    runningVerifiedWithoutHeartbeat: CV_LOCKS.RUNNING_VERIFIED_WITHOUT_HEARTBEAT,
    censusCanInventLiveAgents: CV_LOCKS.CENSUS_CAN_INVENT_LIVE_AGENTS,
  };
}

export async function registerFederatedWorkcell(input: {
  name: string;
  orgId: string;
  tenantId: string;
  root: string;
  actor: CvActor;
}): Promise<WorkforceResult> {
  const store = await load(input.root);
  if (store.workcells.length >= MAX_FEDERATED_WORKCELLS) {
    return {
      accepted: false,
      reason: 'MAX_FEDERATED_WORKCELLS_BOUNDED',
      at: new Date().toISOString(),
    };
  }
  const now = new Date().toISOString();
  const workcell: FederatedWorkcell = {
    id: id('fwc'),
    name: input.name.trim() || 'unnamed-workcell',
    orgId: input.orgId,
    tenantId: input.tenantId,
    status: 'REGISTERED',
    lastHeartbeatAt: null,
    runtimeEvidence: null,
    permissionLevel: Math.max(0, input.actor.permissionLevel),
    invented: false,
    createdAt: now,
    updatedAt: now,
  };
  store.workcells.push(workcell);
  await save(input.root, store);
  return { accepted: true, reason: 'WORKCELL_REGISTERED', workcell, at: now };
}

export async function recordWorkcellHeartbeat(input: {
  workcellId: string;
  runtimeEvidence: string;
  root: string;
  actor: CvActor;
}): Promise<WorkforceResult> {
  void input.actor;
  const store = await load(input.root);
  const workcell = store.workcells.find((w) => w.id === input.workcellId);
  const now = new Date().toISOString();
  if (!workcell) {
    return { accepted: false, reason: 'WORKCELL_NOT_FOUND', at: now };
  }
  if (!input.runtimeEvidence?.trim()) {
    return {
      accepted: false,
      reason: NO_HEARTBEAT_NOT_RUNNING_VERIFIED,
      workcell,
      at: now,
    };
  }
  workcell.lastHeartbeatAt = now;
  workcell.runtimeEvidence = input.runtimeEvidence.trim();
  workcell.status = 'RUNNING_VERIFIED';
  workcell.updatedAt = now;
  await save(input.root, store);
  return { accepted: true, reason: 'HEARTBEAT_RECORDED_RUNNING_VERIFIED', workcell, at: now };
}

/** Claim RUNNING_VERIFIED without fresh heartbeat/runtime evidence → DENIED. */
export async function claimWorkcellRunningVerified(input: {
  workcellId: string;
  root: string;
  actor: CvActor;
  nowMs?: number;
}): Promise<WorkforceResult> {
  void input.actor;
  const store = await load(input.root);
  const workcell = store.workcells.find((w) => w.id === input.workcellId);
  const now = new Date().toISOString();
  if (!workcell) {
    return { accepted: false, reason: 'WORKCELL_NOT_FOUND', at: now };
  }

  const hasEvidence = Boolean(workcell.lastHeartbeatAt && workcell.runtimeEvidence);
  if (!hasEvidence) {
    workcell.status = 'REGISTERED';
    workcell.updatedAt = now;
    await save(input.root, store);
    return {
      accepted: false,
      reason: NO_HEARTBEAT_NOT_RUNNING_VERIFIED,
      workcell,
      at: now,
    };
  }

  const hbMs = Date.parse(workcell.lastHeartbeatAt!);
  const clock = input.nowMs ?? Date.now();
  if (!Number.isFinite(hbMs) || clock - hbMs > HEARTBEAT_TTL_MS) {
    workcell.status = 'HEARTBEAT_STALE';
    workcell.updatedAt = now;
    await save(input.root, store);
    return {
      accepted: false,
      reason: NO_HEARTBEAT_NOT_RUNNING_VERIFIED,
      workcell,
      at: now,
    };
  }

  workcell.status = 'RUNNING_VERIFIED';
  workcell.updatedAt = now;
  await save(input.root, store);
  return {
    accepted: true,
    reason: 'RUNNING_VERIFIED_WITH_HEARTBEAT_EVIDENCE',
    workcell,
    at: now,
  };
}

/**
 * Attempt to invent a live agent in the census without prior registration.
 * Always DENIED — census cannot invent live agents.
 */
export async function inventLiveAgentInCensus(input: {
  inventedName: string;
  root: string;
  actor: CvActor;
}): Promise<WorkforceResult> {
  void input;
  return {
    accepted: false,
    reason: CENSUS_INVENT_LIVE_DENIED,
    at: new Date().toISOString(),
  };
}

export async function censusSnapshot(input: {
  root: string;
  nowMs?: number;
}): Promise<{
  total: number;
  runningVerified: number;
  registered: number;
  stale: number;
  workcells: FederatedWorkcell[];
}> {
  const store = await load(input.root);
  const clock = input.nowMs ?? Date.now();
  let runningVerified = 0;
  let registered = 0;
  let stale = 0;
  for (const w of store.workcells) {
    if (
      w.status === 'RUNNING_VERIFIED' &&
      w.lastHeartbeatAt &&
      w.runtimeEvidence &&
      Number.isFinite(Date.parse(w.lastHeartbeatAt)) &&
      clock - Date.parse(w.lastHeartbeatAt) <= HEARTBEAT_TTL_MS
    ) {
      runningVerified += 1;
    } else if (w.status === 'HEARTBEAT_STALE') {
      stale += 1;
    } else {
      registered += 1;
    }
  }
  return {
    total: store.workcells.length,
    runningVerified,
    registered,
    stale,
    workcells: store.workcells,
  };
}
