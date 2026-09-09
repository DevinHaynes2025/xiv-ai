import { planDemandAgents } from './demand-agent-planner';
import { twinAct, type FounderDigitalTwin } from './founder-digital-twin';
import type { MeshAgentRole } from './agent-mesh';
import type { ConsequenceClass } from './decision-gate';

export const FOUNDER_DELEGATE_DEPARTMENTS = [
  'rd',
  'engineering',
  'marketing',
  'finance',
  'supply_chain',
  'operations',
  'legal_research',
  'people',
] as const;

export type FounderDelegateDepartment = (typeof FOUNDER_DELEGATE_DEPARTMENTS)[number];

const DEPARTMENT_ROLES: Record<FounderDelegateDepartment, MeshAgentRole[]> = {
  rd: ['researcher', 'architect', 'knowledge_curator'],
  engineering: ['architect', 'coder', 'tester', 'security'],
  marketing: ['business_analyst', 'culture_historian', 'skeptic'],
  finance: ['finance_analyst', 'evidence_verifier', 'skeptic'],
  supply_chain: ['supply_chain_analyst', 'operations_analyst', 'evidence_verifier'],
  operations: ['operations_analyst', 'workflow_planner', 'executive_secretary'],
  legal_research: ['evidence_verifier', 'skeptic', 'decision_strategist'],
  people: ['business_analyst', 'workflow_planner', 'executive_synthesizer'],
};

export type VirtualFounderDelegate = {
  department: FounderDelegateDepartment;
  twinId: string;
  tenantId: string;
  universeId: string;
  roles: MeshAgentRole[];
  canHireOrFire: false;
  canSpendMoney: false;
  canSignContracts: false;
  productionAuthorization: false;
};

export function planVirtualFounderDelegates(input: {
  twin: FounderDigitalTwin;
  departments: FounderDelegateDepartment[];
  consequence?: ConsequenceClass;
  approved?: boolean;
  taskId?: string;
}) {
  const unique = [...new Set(input.departments)];
  const forbidden = twinAct({
    twin: input.twin,
    action: `Activate virtual founder delegates for ${unique.join(',')}`,
    kind: 'route',
  });
  if (!forbidden.allowed) {
    return {
      status: 'DENIED' as const,
      delegates: [] as VirtualFounderDelegate[],
      recruitment: { status: 'NOT_APPROVED' as const, agents: [], productionAuthorization: false as const },
      reason: forbidden.reason,
      productionAuthorization: false as const,
    };
  }

  const delegates: VirtualFounderDelegate[] = unique.map((department) => ({
    department,
    twinId: input.twin.id,
    tenantId: input.twin.tenantId,
    universeId: input.twin.universeId,
    roles: DEPARTMENT_ROLES[department],
    canHireOrFire: false,
    canSpendMoney: false,
    canSignContracts: false,
    productionAuthorization: false,
  }));

  const roles = [...new Set(delegates.flatMap((delegate) => delegate.roles))].slice(0, 6);
  const recruitment = planDemandAgents({
    tenantId: input.twin.tenantId,
    universeId: input.twin.universeId,
    taskId: input.taskId ?? `delegates_${input.twin.id}`,
    requestedRoles: roles,
    consequence: input.consequence ?? 'LOW',
    approved: input.approved ?? true,
  });

  return {
    status: recruitment.status,
    delegates,
    recruitment,
    reason: 'Virtual delegates are simulated department personas. They cannot hire, fire, spend, or sign.',
    productionAuthorization: false as const,
  };
}

export function delegateCannot(action: 'hire' | 'fire' | 'spend_money' | 'sign_contract') {
  return {
    allowed: false as const,
    action,
    reason: `Virtual founder delegates cannot ${action.replaceAll('_', ' ')}. Real founder remains authority.`,
    productionAuthorization: false as const,
  };
}
