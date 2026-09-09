import type { MeshAgentRole } from './agent-mesh';
import { planDemandAgents } from './demand-agent-planner';
import { reapExpiredAgents, type AgentInstance } from './agent-population';
import { recruitmentAllowed, type ResourceLedger } from './resource-governance';

export const EXECUTIVE_SPECIALIST_ROLES: readonly MeshAgentRole[] = [
  'executive_synthesizer',
  'decision_strategist',
  'researcher',
  'skeptic',
  'evidence_verifier',
  'security',
  'business_analyst',
  'finance_analyst',
] as const;

export type SpecialistRecruitmentResult = {
  status: 'PLANNED' | 'HALTED_DEBRIEF' | 'NOT_APPROVED' | 'HUMAN_APPROVAL_REQUIRED' | 'BUDGET_EXHAUSTED';
  agents: AgentInstance[];
  canRecursivelyReproduce: false;
  canGrantPermissions: false;
  canOverrideGuardian: false;
  canDeployProduction: false;
  canPurchase: false;
  canSign: false;
  claimsToBeFounder: false;
  productionAuthorization: false;
  reason: string;
};

export function recruitExecutiveSpecialists(input: {
  tenantId: string;
  universeId: string;
  taskId: string;
  roles?: MeshAgentRole[];
  consequence?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  approved?: boolean;
  ledger?: ResourceLedger;
}): SpecialistRecruitmentResult {
  if (!input.tenantId || !input.universeId) throw new Error('TENANT_AND_UNIVERSE_REQUIRED');
  reapExpiredAgents();
  const locks = {
    canRecursivelyReproduce: false as const,
    canGrantPermissions: false as const,
    canOverrideGuardian: false as const,
    canDeployProduction: false as const,
    canPurchase: false as const,
    canSign: false as const,
    claimsToBeFounder: false as const,
    productionAuthorization: false as const,
  };
  if (input.ledger && !recruitmentAllowed(input.ledger)) {
    return {
      status: 'HALTED_DEBRIEF',
      agents: [],
      ...locks,
      reason: 'Recruitment and routing are halted during debrief/rest.',
    };
  }
  const planned = planDemandAgents({
    tenantId: input.tenantId,
    universeId: input.universeId,
    taskId: input.taskId,
    requestedRoles: (input.roles ?? [...EXECUTIVE_SPECIALIST_ROLES]).slice(0, 6),
    consequence: input.consequence ?? 'LOW',
    approved: input.approved !== false,
  });
  if (planned.status === 'HUMAN_APPROVAL_REQUIRED') {
    return { status: 'HUMAN_APPROVAL_REQUIRED', agents: [], ...locks, reason: 'HIGH/CRITICAL specialist recruitment requires a human gate.' };
  }
  if (planned.status === 'NOT_APPROVED') {
    return { status: 'NOT_APPROVED', agents: [], ...locks, reason: 'Unapproved demand does not spawn specialists.' };
  }
  const agents: AgentInstance[] = [];
  for (const item of planned.agents) {
    if (!('instance' in item) || !item.instance) continue;
    if (item.instance.canCreateAgents !== false || item.instance.canExpandPermissions !== false) continue;
    agents.push(item.instance);
  }
  if (input.ledger && agents.length + input.ledger.used.agents > input.ledger.budget.maxAgents) {
    return { status: 'BUDGET_EXHAUSTED', agents: [], ...locks, reason: 'Agent budget reached; no additional specialists spawned.' };
  }
  return {
    status: 'PLANNED',
    agents,
    ...locks,
    reason: 'Demand-based template recruitment with TTL/budget/Universe. Not self-replication.',
  };
}
