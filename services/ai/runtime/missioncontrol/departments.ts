/**
 * Department model + Agent Managers (may / may NOT lists).
 * MANAGER ≠ AUTHORIZATION. MORE AGENTS ≠ MORE AUTHORITY.
 */

import type {
  AgentDepartment,
  AgentManager,
  AgentManagerCapabilities,
  DepartmentBudget,
  DepartmentHealth,
  DepartmentId,
  DepartmentMission,
  DepartmentPolicy,
  DepartmentReport,
} from './types';
import { INITIAL_DEPARTMENTS } from './types';

export const MANAGER_CAPABILITIES: AgentManagerCapabilities = {
  mayInspectQueue: true,
  mayAssignMissions: true,
  mayFormTaskForces: true,
  mayRequestSpecialists: true,
  mayPauseWork: true,
  mayHandoffWork: true,
  mayRequestReview: true,
  mayEscalateBlockers: true,
  mayGrantPermissions: false,
  mayIncreaseAuthority: false,
  mayDisableGuardian: false,
  mayModifyOwnership: false,
  mayOverrideSecurity: false,
  mayApproveOwnProhibited: false,
};

export function listDepartments(): readonly DepartmentId[] {
  return INITIAL_DEPARTMENTS;
}

export function openDepartment(input: {
  departmentId: DepartmentId;
  tenantId: string;
  universeId: string;
  budgetCeiling?: number;
}): AgentDepartment {
  return {
    departmentId: input.departmentId,
    name: input.departmentId.replace(/_/g, ' '),
    tenantId: input.tenantId,
    universeId: input.universeId,
    authorityCeiling: 'L2',
    budgetCeiling: input.budgetCeiling ?? 50,
    defaultPermissions: 'NONE',
    l4Enabled: false,
    productionLive: false,
  };
}

export function departmentPolicy(departmentId: DepartmentId): DepartmentPolicy {
  return {
    departmentId,
    maySelfGrantPermissions: false,
    mayDisableGuardian: false,
    mayApproveOwnProhibited: false,
    maySilentProductionDeploy: false,
  };
}

export function openDepartmentBudget(input: {
  departmentId: DepartmentId;
  tenantId: string;
  universeId: string;
  ceiling: number;
}): DepartmentBudget {
  return {
    departmentId: input.departmentId,
    tenantId: input.tenantId,
    universeId: input.universeId,
    ceiling: input.ceiling,
    spent: 0,
    selfExpandable: false,
  };
}

export function attachDepartmentMission(input: {
  departmentMissionId: string;
  departmentId: DepartmentId;
  missionId: string;
  tenantId: string;
  universeId: string;
}): DepartmentMission {
  return { ...input };
}

export function departmentHealth(input: {
  departmentId: DepartmentId;
  activeMissions: number;
  blockers?: readonly string[];
}): DepartmentHealth {
  const blockers = input.blockers ?? [];
  return {
    departmentId: input.departmentId,
    status: blockers.length > 0 ? 'BLOCKED' : input.activeMissions > 20 ? 'DEGRADED' : 'HEALTHY',
    activeMissions: input.activeMissions,
    blockers,
  };
}

export function departmentReport(input: {
  departmentId: DepartmentId;
  summary: string;
  findings?: readonly string[];
  decisionsRequiringHuman?: readonly string[];
}): DepartmentReport {
  return {
    departmentId: input.departmentId,
    summary: input.summary,
    findings: input.findings ?? [],
    decisionsRequiringHuman: input.decisionsRequiringHuman ?? [],
  };
}

export function openAgentManager(input: {
  managerId: string;
  departmentId: DepartmentId;
  tenantId: string;
  universeId: string;
}): AgentManager {
  return {
    managerId: input.managerId,
    departmentId: input.departmentId,
    tenantId: input.tenantId,
    universeId: input.universeId,
    capabilities: MANAGER_CAPABILITIES,
    permissions: [],
    defaultPermissions: 'NONE',
    l4Enabled: false,
    isAuthorizationAuthority: false,
  };
}

export function managerMay(action: keyof AgentManagerCapabilities, manager: AgentManager = openAgentManager({
  managerId: '_probe',
  departmentId: 'ENGINEERING',
  tenantId: 't',
  universeId: 'u',
})): boolean {
  return manager.capabilities[action];
}

export function managerAttemptGrantPermissions(_manager: AgentManager): {
  ok: false;
  reason: string;
  audited: true;
} {
  return { ok: false, reason: 'manager may NOT grant permissions', audited: true };
}

export function managerAttemptIncreaseAuthority(_manager: AgentManager): {
  ok: false;
  reason: string;
  audited: true;
} {
  return { ok: false, reason: 'manager may NOT increase authority', audited: true };
}

export function managerAttemptDisableGuardian(_manager: AgentManager): {
  ok: false;
  reason: string;
  audited: true;
} {
  return { ok: false, reason: 'manager may NOT disable Guardian', audited: true };
}

export function managerIsAuthorizationAuthority(_manager: AgentManager): false {
  return false;
}

export function moreAgentsMeansMoreAuthority(): false {
  return false;
}
