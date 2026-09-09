/**
 * 62L-DA Autonomous Department Operating System —
 * Bounded department OS instances with exact agent/workcell state tracking.
 * Departments cannot self-grant production authority.
 * RUNNING_VERIFIED only with heartbeat + runtime evidence on powered nodes.
 * Logical population ≠ RUNNING_VERIFIED.
 */

import { readJsonFile, writeJsonFileAtomic, xivLocalPath } from './durable-json';
import {
  DA_LOCKS,
  DEPARTMENT_SELF_GRANT_DENIED,
  HEARTBEAT_TTL_MS,
  HONESTY_BANNER,
  LOGICAL_NOT_RUNNING_VERIFIED,
  MAX_DEPARTMENTS,
  MAX_WORKCELLS,
  NO_HEARTBEAT_NOT_RUNNING_VERIFIED,
  NO_POWERED_NODE_WAITING_OR_STOPPED,
  type DaActor,
  type WorkcellStatus,
} from './superbrain-runtime-kernel-types';

export type DepartmentOs = {
  id: string;
  name: string;
  orgId: string;
  tenantId: string;
  universeId: string;
  sandboxed: true;
  productionAuthority: false;
  status: 'BOUNDED' | 'SANDBOXED' | 'REGISTERED' | 'DENIED';
  createdAt: string;
  updatedAt: string;
};

export type Workcell = {
  id: string;
  departmentId: string;
  name: string;
  populationMode: 'logical' | 'materialized';
  authorizedNodePowered: boolean;
  lastHeartbeatAt: string | null;
  runtimeEvidence: string | null;
  status: WorkcellStatus;
  createdAt: string;
  updatedAt: string;
};

export type DepartmentResult = {
  accepted: boolean;
  reason: string;
  department?: DepartmentOs;
  workcell?: Workcell;
  at: string;
};

type Store = { departments: DepartmentOs[]; workcells: Workcell[] };

function storePath(root: string) {
  return xivLocalPath(root, 'autonomous-department-operating-system.json');
}

async function load(root: string): Promise<Store> {
  return readJsonFile<Store>(storePath(root), { departments: [], workcells: [] });
}

async function save(root: string, store: Store) {
  await writeJsonFileAtomic(storePath(root), store);
}

function id(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function autonomousDepartmentOsHonesty() {
  return {
    banner: HONESTY_BANNER,
    l4AutonomyEnabled: DA_LOCKS.L4_AUTONOMY_ENABLED,
    departmentSelfGrantProductionAuthority:
      DA_LOCKS.DEPARTMENT_SELF_GRANT_PRODUCTION_AUTHORITY,
    logicalEqRunningVerified: DA_LOCKS.LOGICAL_EQ_RUNNING_VERIFIED,
    runningVerifiedWithoutHeartbeat: DA_LOCKS.RUNNING_VERIFIED_WITHOUT_HEARTBEAT,
  };
}

export async function registerDepartmentOs(input: {
  name: string;
  orgId: string;
  tenantId: string;
  universeId: string;
  root: string;
  actor: DaActor;
}): Promise<DepartmentResult> {
  void input.actor;
  const store = await load(input.root);
  const now = new Date().toISOString();
  if (store.departments.length >= MAX_DEPARTMENTS) {
    return { accepted: false, reason: 'MAX_DEPARTMENTS_BOUNDED', at: now };
  }
  const department: DepartmentOs = {
    id: id('ados'),
    name: input.name.trim() || 'unnamed-dept',
    orgId: input.orgId,
    tenantId: input.tenantId,
    universeId: input.universeId,
    sandboxed: true,
    productionAuthority: false,
    status: 'BOUNDED',
    createdAt: now,
    updatedAt: now,
  };
  store.departments.push(department);
  await save(input.root, store);
  return {
    accepted: true,
    reason: 'DEPARTMENT_OS_REGISTERED_BOUNDED',
    department,
    at: now,
  };
}

export async function requestDepartmentProductionAuthority(input: {
  departmentId: string;
  selfGrant: boolean;
  root: string;
  actor: DaActor;
}): Promise<DepartmentResult> {
  const store = await load(input.root);
  const now = new Date().toISOString();
  const department = store.departments.find((d) => d.id === input.departmentId);
  if (!department) {
    return { accepted: false, reason: 'DEPARTMENT_NOT_FOUND', at: now };
  }
  const isDeptActor =
    input.actor.kind === 'department_agent' ||
    input.actor.kind === 'ordinary_agent' ||
    input.actor.kind === 'impersonator' ||
    input.selfGrant === true;
  if (isDeptActor || DA_LOCKS.DEPARTMENT_SELF_GRANT_PRODUCTION_AUTHORITY === false) {
    department.status = 'DENIED';
    department.updatedAt = now;
    await save(input.root, store);
    return {
      accepted: false,
      reason: DEPARTMENT_SELF_GRANT_DENIED,
      department,
      at: now,
    };
  }
  return {
    accepted: false,
    reason: DEPARTMENT_SELF_GRANT_DENIED,
    department,
    at: now,
  };
}

export async function registerWorkcell(input: {
  departmentId: string;
  name: string;
  populationMode?: 'logical' | 'materialized';
  authorizedNodePowered?: boolean;
  root: string;
  actor: DaActor;
}): Promise<DepartmentResult> {
  void input.actor;
  const store = await load(input.root);
  const now = new Date().toISOString();
  const department = store.departments.find((d) => d.id === input.departmentId);
  if (!department) {
    return { accepted: false, reason: 'DEPARTMENT_NOT_FOUND', at: now };
  }
  if (store.workcells.length >= MAX_WORKCELLS) {
    return { accepted: false, reason: 'MAX_WORKCELLS_BOUNDED', at: now };
  }
  const mode = input.populationMode ?? 'logical';
  const powered = input.authorizedNodePowered === true;
  let status: WorkcellStatus = 'LOGICAL';
  if (mode === 'logical') status = 'LOGICAL';
  else if (!powered) status = 'WAITING_NODE';
  else status = 'MATERIALIZED';

  const workcell: Workcell = {
    id: id('wc'),
    departmentId: input.departmentId,
    name: input.name.trim() || 'workcell',
    populationMode: mode,
    authorizedNodePowered: powered,
    lastHeartbeatAt: null,
    runtimeEvidence: null,
    status,
    createdAt: now,
    updatedAt: now,
  };
  store.workcells.push(workcell);
  await save(input.root, store);
  return {
    accepted: true,
    reason:
      mode === 'logical'
        ? LOGICAL_NOT_RUNNING_VERIFIED
        : powered
          ? 'WORKCELL_MATERIALIZED_REGISTERED'
          : NO_POWERED_NODE_WAITING_OR_STOPPED,
    workcell,
    at: now,
  };
}

export async function setWorkcellNodePower(input: {
  workcellId: string;
  poweredOn: boolean;
  stopMode?: 'WAITING_NODE' | 'OFFLINE_STOPPED';
  root: string;
  actor: DaActor;
}): Promise<DepartmentResult> {
  void input.actor;
  const store = await load(input.root);
  const now = new Date().toISOString();
  const workcell = store.workcells.find((w) => w.id === input.workcellId);
  if (!workcell) {
    return { accepted: false, reason: 'WORKCELL_NOT_FOUND', at: now };
  }
  workcell.authorizedNodePowered = input.poweredOn;
  workcell.updatedAt = now;
  if (!input.poweredOn) {
    workcell.status = input.stopMode ?? 'WAITING_NODE';
    workcell.lastHeartbeatAt = null;
    workcell.runtimeEvidence = null;
  } else if (workcell.populationMode === 'logical') {
    workcell.status = 'LOGICAL';
  } else {
    workcell.status = 'MATERIALIZED';
  }
  await save(input.root, store);
  return {
    accepted: true,
    reason: input.poweredOn
      ? 'WORKCELL_NODE_POWERED'
      : NO_POWERED_NODE_WAITING_OR_STOPPED,
    workcell,
    at: now,
  };
}

export async function recordWorkcellHeartbeat(input: {
  workcellId: string;
  runtimeEvidence: string;
  root: string;
  actor: DaActor;
}): Promise<DepartmentResult> {
  void input.actor;
  const store = await load(input.root);
  const now = new Date().toISOString();
  const workcell = store.workcells.find((w) => w.id === input.workcellId);
  if (!workcell) {
    return { accepted: false, reason: 'WORKCELL_NOT_FOUND', at: now };
  }
  if (workcell.populationMode === 'logical') {
    return {
      accepted: false,
      reason: LOGICAL_NOT_RUNNING_VERIFIED,
      workcell,
      at: now,
    };
  }
  if (!workcell.authorizedNodePowered) {
    workcell.status = 'WAITING_NODE';
    workcell.updatedAt = now;
    await save(input.root, store);
    return {
      accepted: false,
      reason: NO_POWERED_NODE_WAITING_OR_STOPPED,
      workcell,
      at: now,
    };
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
  return {
    accepted: true,
    reason: 'WORKCELL_RUNNING_VERIFIED_WITH_HEARTBEAT',
    workcell,
    at: now,
  };
}

export async function claimWorkcellRunningVerified(input: {
  workcellId: string;
  root: string;
  actor: DaActor;
}): Promise<DepartmentResult> {
  void input.actor;
  const store = await load(input.root);
  const now = new Date().toISOString();
  const workcell = store.workcells.find((w) => w.id === input.workcellId);
  if (!workcell) {
    return { accepted: false, reason: 'WORKCELL_NOT_FOUND', at: now };
  }
  if (workcell.populationMode === 'logical') {
    return {
      accepted: false,
      reason: LOGICAL_NOT_RUNNING_VERIFIED,
      workcell,
      at: now,
    };
  }
  if (!workcell.authorizedNodePowered) {
    if (workcell.status !== 'OFFLINE_STOPPED') {
      workcell.status = 'WAITING_NODE';
      workcell.updatedAt = now;
      await save(input.root, store);
    }
    return {
      accepted: false,
      reason: NO_POWERED_NODE_WAITING_OR_STOPPED,
      workcell,
      at: now,
    };
  }
  if (!workcell.lastHeartbeatAt || !workcell.runtimeEvidence) {
    workcell.status = workcell.status === 'RUNNING_VERIFIED' ? 'HEARTBEAT_STALE' : 'MATERIALIZED';
    workcell.updatedAt = now;
    await save(input.root, store);
    return {
      accepted: false,
      reason: NO_HEARTBEAT_NOT_RUNNING_VERIFIED,
      workcell,
      at: now,
    };
  }
  const age = Date.now() - Date.parse(workcell.lastHeartbeatAt);
  if (!Number.isFinite(age) || age > HEARTBEAT_TTL_MS) {
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
    reason: 'WORKCELL_RUNNING_VERIFIED',
    workcell,
    at: now,
  };
}
