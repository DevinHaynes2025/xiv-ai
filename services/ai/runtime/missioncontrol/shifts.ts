/**
 * Shift domain + initial XIV shifts + follow-the-sun orchestration.
 * Computational zones — do NOT imply human employees in those regions.
 * Flow: SHIFT A → WORK → CHECKPOINT → DEBRIEF → HANDOFF → SHIFT B VERIFY → LOAD → CONTINUE
 */

import type {
  AgentShiftAssignment,
  AgentShiftDefinition,
  AgentShiftHandoff,
  AgentShiftInstance,
  AgentShiftMission,
  AgentShiftReport,
  FollowTheSunZone,
  PriorityClass,
  ShiftTemplateId,
} from './types';
import { SHIFT_TEMPLATE_IDS } from './types';

const BASE_DEF = {
  handoffPolicy: 'CHECKPOINT_DEBRIEF_REQUIRED' as const,
  enabled: true,
  continuousAutonomy: false as const,
  productionLive: false as const,
  l4Enabled: false as const,
  toolRequirements: [] as const,
  dataScopes: ['tenant_authorized'] as const,
};

export const XIV_SHIFT_DEFINITIONS: readonly AgentShiftDefinition[] = [
  {
    id: 'ENGINEERING_SHIFT',
    name: 'Engineering Shift',
    department: 'ENGINEERING',
    schedule: 'AMERICAS',
    missionTypes: ['IMPLEMENT', 'REFACTOR', 'REVIEW'],
    agentRequirements: ['engineering'],
    budgetCeiling: 40,
    authorityCeiling: 'L2',
    concurrencyLimit: 6,
    ...BASE_DEF,
  },
  {
    id: 'RESEARCH_SHIFT',
    name: 'Research Shift',
    department: 'RESEARCH',
    schedule: 'EUROPE_AFRICA',
    missionTypes: ['RESEARCH', 'SYNTHESIS'],
    agentRequirements: ['research'],
    budgetCeiling: 30,
    authorityCeiling: 'L1',
    concurrencyLimit: 6,
    ...BASE_DEF,
  },
  {
    id: 'QA_SHIFT',
    name: 'QA Shift',
    department: 'QA',
    schedule: 'ASIA_PACIFIC',
    missionTypes: ['TEST', 'REGRESSION'],
    agentRequirements: ['qa'],
    budgetCeiling: 25,
    authorityCeiling: 'L1',
    concurrencyLimit: 8,
    ...BASE_DEF,
  },
  {
    id: 'SECURITY_SHIFT',
    name: 'Security Shift',
    department: 'SECURITY',
    schedule: 'NIGHT',
    missionTypes: ['SECURITY_REVIEW', 'THREAT_SCAN'],
    agentRequirements: ['security'],
    budgetCeiling: 35,
    authorityCeiling: 'L2',
    concurrencyLimit: 4,
    ...BASE_DEF,
  },
  {
    id: 'DATABASE_SHIFT',
    name: 'Database Shift',
    department: 'DATABASE',
    schedule: 'NIGHT',
    missionTypes: ['DB_INSPECT', 'MIGRATION_PROPOSAL'],
    agentRequirements: ['database'],
    budgetCeiling: 20,
    authorityCeiling: 'L1',
    concurrencyLimit: 3,
    ...BASE_DEF,
  },
  {
    id: 'KNOWLEDGE_SHIFT',
    name: 'Knowledge Shift',
    department: 'KNOWLEDGE',
    schedule: 'EUROPE_AFRICA',
    missionTypes: ['KNOWLEDGE_REPAIR', 'PROVENANCE'],
    agentRequirements: ['knowledge'],
    budgetCeiling: 20,
    authorityCeiling: 'L1',
    concurrencyLimit: 4,
    ...BASE_DEF,
  },
  {
    id: 'RELIABILITY_SHIFT',
    name: 'Reliability Shift',
    department: 'CLOUD_DEVOPS',
    schedule: 'NIGHT',
    missionTypes: ['RELIABILITY', 'RECOVERY'],
    agentRequirements: ['reliability'],
    budgetCeiling: 25,
    authorityCeiling: 'L2',
    concurrencyLimit: 3,
    ...BASE_DEF,
  },
  {
    id: 'PRODUCT_SHIFT',
    name: 'Product Shift',
    department: 'PRODUCT',
    schedule: 'AMERICAS',
    missionTypes: ['STORY_GEN', 'FEEDBACK_ANALYSIS'],
    agentRequirements: ['product'],
    budgetCeiling: 20,
    authorityCeiling: 'L1',
    concurrencyLimit: 4,
    ...BASE_DEF,
  },
  {
    id: 'SUPPLY_CHAIN_SHIFT',
    name: 'Supply Chain Shift',
    department: 'SUPPLY_CHAIN',
    schedule: 'ASIA_PACIFIC',
    missionTypes: ['SUPPLY_ANALYSIS'],
    agentRequirements: ['supply_chain'],
    budgetCeiling: 25,
    authorityCeiling: 'L1',
    concurrencyLimit: 4,
    ...BASE_DEF,
  },
  {
    id: 'SALES_RESEARCH_SHIFT',
    name: 'Sales Research Shift',
    department: 'SALES',
    schedule: 'AMERICAS',
    missionTypes: ['SALES_INTEL'],
    agentRequirements: ['sales'],
    budgetCeiling: 15,
    authorityCeiling: 'L1',
    concurrencyLimit: 3,
    ...BASE_DEF,
  },
  {
    id: 'FOUNDER_BRIEF_SHIFT',
    name: 'Founder Brief Shift',
    department: 'EXECUTIVE',
    schedule: 'NIGHT',
    missionTypes: ['FOUNDER_BRIEF'],
    agentRequirements: ['founder_brief'],
    budgetCeiling: 10,
    authorityCeiling: 'L0',
    concurrencyLimit: 1,
    ...BASE_DEF,
  },
];

export function listShiftDefinitions(): readonly AgentShiftDefinition[] {
  return XIV_SHIFT_DEFINITIONS;
}

export function getShiftDefinition(id: ShiftTemplateId): AgentShiftDefinition {
  const found = XIV_SHIFT_DEFINITIONS.find((d) => d.id === id);
  if (!found) throw new Error(`unknown shift template: ${id}`);
  return found;
}

export function listShiftTemplateIds(): readonly ShiftTemplateId[] {
  return SHIFT_TEMPLATE_IDS;
}

export function openShiftInstance(input: {
  instanceId: string;
  definitionId: ShiftTemplateId;
  tenantId: string;
  universeId: string;
  zone: FollowTheSunZone;
  nowIso: string;
}): AgentShiftInstance {
  const def = getShiftDefinition(input.definitionId);
  return {
    instanceId: input.instanceId,
    definitionId: def.id,
    tenantId: input.tenantId,
    universeId: input.universeId,
    zone: input.zone,
    startedAt: input.nowIso,
    endsAt: null,
    status: 'ACTIVE',
    continuousAutonomy: false,
    productionLive: false,
  };
}

export function assignAgentToShift(input: {
  assignmentId: string;
  instanceId: string;
  agentDirectoryId: string;
  role: string;
  tenantId: string;
  universeId: string;
}): AgentShiftAssignment {
  return {
    assignmentId: input.assignmentId,
    instanceId: input.instanceId,
    agentDirectoryId: input.agentDirectoryId,
    role: input.role,
    tenantId: input.tenantId,
    universeId: input.universeId,
    permissions: [],
    defaultPermissions: 'NONE',
  };
}

export function attachMissionToShift(input: {
  shiftMissionId: string;
  instanceId: string;
  missionId: string;
  priority: PriorityClass;
  tenantId: string;
  universeId: string;
}): AgentShiftMission {
  return {
    shiftMissionId: input.shiftMissionId,
    instanceId: input.instanceId,
    missionId: input.missionId,
    priority: input.priority,
    tenantId: input.tenantId,
    universeId: input.universeId,
  };
}

/** Follow-the-sun zones describe workload scheduling — not human staffing. */
export function followTheSunZones(): readonly FollowTheSunZone[] {
  return ['AMERICAS', 'EUROPE_AFRICA', 'ASIA_PACIFIC', 'NIGHT'];
}

export function followTheSunImpliesHumanEmployees(): false {
  return false;
}

export function followTheSunMeans247Live(): false {
  return false;
}

export function shiftCadence(): readonly string[] {
  return ['WORK', 'CHECKPOINT', 'DEBRIEF', 'HANDOFF', 'VERIFY', 'LOAD', 'CONTINUE'];
}

export function createShiftHandoff(input: {
  handoffId: string;
  fromInstanceId: string;
  toInstanceId: string;
  missionId: string;
  objective: string;
  completedWork: readonly string[];
  remainingWork: readonly string[];
  checkpointId: string | null;
  repositoryStateRef?: string | null;
  databaseStateRef?: string | null;
  tests?: readonly string[];
  failures?: readonly string[];
  evidenceRefs?: readonly string[];
  contradictions?: readonly string[];
  unknowns?: readonly string[];
  nextRecommendedAction: string;
  nowIso: string;
}): AgentShiftHandoff {
  return {
    handoffId: input.handoffId,
    fromInstanceId: input.fromInstanceId,
    toInstanceId: input.toInstanceId,
    missionId: input.missionId,
    objective: input.objective,
    completedWork: input.completedWork,
    remainingWork: input.remainingWork,
    checkpointId: input.checkpointId,
    repositoryStateRef: input.repositoryStateRef ?? null,
    databaseStateRef: input.databaseStateRef ?? null,
    tests: input.tests ?? [],
    failures: input.failures ?? [],
    evidenceRefs: input.evidenceRefs ?? [],
    contradictions: input.contradictions ?? [],
    unknowns: input.unknowns ?? [],
    nextRecommendedAction: input.nextRecommendedAction,
    transfersPermissions: false,
    transfersAuthority: false,
    sameTenantRequired: true,
    sameUniverseRequired: true,
    createdAt: input.nowIso,
  };
}

export function evaluateShiftHandoff(input: {
  handoff: AgentShiftHandoff;
  fromTenantId: string;
  toTenantId: string;
  fromUniverseId: string;
  toUniverseId: string;
}): { ok: true } | { ok: false; reason: string; audited: true } {
  if (input.fromTenantId !== input.toTenantId) {
    return { ok: false, reason: 'cross-tenant shift handoff denied', audited: true };
  }
  if (input.fromUniverseId !== input.toUniverseId) {
    return { ok: false, reason: 'cross-universe shift handoff denied', audited: true };
  }
  if (!input.handoff.checkpointId && input.handoff.remainingWork.length > 0) {
    return { ok: false, reason: 'checkpoint required before handoff with remaining work', audited: true };
  }
  return { ok: true };
}

export function shiftHandoffTransfersPermissions(_h: AgentShiftHandoff): false {
  return false;
}

export function shiftHandoffTransfersAuthority(_h: AgentShiftHandoff): false {
  return false;
}

export function createShiftReport(input: {
  reportId: string;
  instanceId: string;
  tenantId: string;
  universeId: string;
  missionsCompleted: number;
  missionsFailed: number;
  blockers: readonly string[];
  costSpent: number;
  nowIso: string;
}): AgentShiftReport {
  return {
    reportId: input.reportId,
    instanceId: input.instanceId,
    tenantId: input.tenantId,
    universeId: input.universeId,
    missionsCompleted: input.missionsCompleted,
    missionsFailed: input.missionsFailed,
    blockers: input.blockers,
    costSpent: input.costSpent,
    productionLive: false,
    createdAt: input.nowIso,
  };
}
