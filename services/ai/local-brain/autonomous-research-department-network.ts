/**
 * 62L-CZ Autonomous Research Department Network —
 * Bounded, sandboxed research departments under the Intelligence Civilization Kernel.
 * Departments cannot self-grant production authority.
 */

import { readJsonFile, writeJsonFileAtomic, xivLocalPath } from './durable-json';
import {
  CZ_LOCKS,
  DEPARTMENT_SELF_GRANT_DENIED,
  HONESTY_BANNER,
  MAX_RESEARCH_DEPARTMENTS,
  type CzActor,
} from './intelligence-civilization-kernel-types';

export type ResearchDepartment = {
  id: string;
  name: string;
  orgId: string;
  tenantId: string;
  universeId: string;
  sandboxed: true;
  productionAuthority: false | true;
  permissionLevel: number;
  status: 'REGISTERED' | 'BOUNDED' | 'DENIED' | 'SANDBOXED';
  createdAt: string;
  updatedAt: string;
};

export type DepartmentResult = {
  accepted: boolean;
  reason: string;
  department?: ResearchDepartment;
  at: string;
};

type Store = { departments: ResearchDepartment[] };

function storePath(root: string) {
  return xivLocalPath(root, 'autonomous-research-department-network.json');
}

async function load(root: string): Promise<Store> {
  return readJsonFile<Store>(storePath(root), { departments: [] });
}

async function save(root: string, store: Store) {
  await writeJsonFileAtomic(storePath(root), store);
}

function id(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function researchDepartmentNetworkHonesty() {
  return {
    banner: HONESTY_BANNER,
    l4AutonomyEnabled: CZ_LOCKS.L4_AUTONOMY_ENABLED,
    departmentSelfGrantProductionAuthority: CZ_LOCKS.DEPARTMENT_SELF_GRANT_PRODUCTION_AUTHORITY,
    learningGrantsPermission: CZ_LOCKS.LEARNING_GRANTS_PERMISSION,
  };
}

export async function registerResearchDepartment(input: {
  name: string;
  orgId: string;
  tenantId: string;
  universeId: string;
  root: string;
  actor: CzActor;
}): Promise<DepartmentResult> {
  const store = await load(input.root);
  const now = new Date().toISOString();
  if (store.departments.length >= MAX_RESEARCH_DEPARTMENTS) {
    return {
      accepted: false,
      reason: 'MAX_RESEARCH_DEPARTMENTS_BOUNDED',
      at: now,
    };
  }
  const department: ResearchDepartment = {
    id: id('rdept'),
    name: input.name.trim(),
    orgId: input.orgId,
    tenantId: input.tenantId,
    universeId: input.universeId,
    sandboxed: true,
    productionAuthority: false,
    permissionLevel: Math.min(input.actor.permissionLevel, 1),
    status: 'SANDBOXED',
    createdAt: now,
    updatedAt: now,
  };
  store.departments.push(department);
  await save(input.root, store);
  return {
    accepted: true,
    reason: 'RESEARCH_DEPARTMENT_REGISTERED_SANDBOXED',
    department,
    at: now,
  };
}

/**
 * A department (or department_agent) attempting to self-grant production
 * authority is always DENIED. Only an external CEO/human operator with
 * authorityLevel > 0 could ever grant — and even then CZ_LOCKS keep
 * PRODUCTION_AUTHORIZATION false at kernel level.
 */
export async function requestDepartmentProductionAuthority(input: {
  departmentId: string;
  selfGrant: boolean;
  root: string;
  actor: CzActor;
}): Promise<DepartmentResult> {
  const store = await load(input.root);
  const now = new Date().toISOString();
  const department = store.departments.find((d) => d.id === input.departmentId);
  if (!department) {
    return { accepted: false, reason: 'DEPARTMENT_NOT_FOUND', at: now };
  }

  const isDepartmentActor =
    input.actor.kind === 'department_agent' ||
    input.actor.kind === 'ordinary_agent' ||
    input.actor.kind === 'impersonator' ||
    input.selfGrant === true;

  if (isDepartmentActor || CZ_LOCKS.DEPARTMENT_SELF_GRANT_PRODUCTION_AUTHORITY === false) {
    if (
      input.selfGrant ||
      input.actor.kind === 'department_agent' ||
      input.actor.kind === 'ordinary_agent' ||
      input.actor.kind === 'impersonator' ||
      input.actor.authorityLevel <= 0
    ) {
      department.productionAuthority = false;
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
  }

  // Even privileged grant path remains sandboxed: production stays false under kernel locks.
  department.productionAuthority = false;
  department.status = 'BOUNDED';
  department.updatedAt = now;
  await save(input.root, store);
  return {
    accepted: false,
    reason: DEPARTMENT_SELF_GRANT_DENIED,
    department,
    at: now,
  };
}
