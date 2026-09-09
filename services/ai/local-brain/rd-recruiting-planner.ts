import { planDemandAgents } from './demand-agent-planner';
import { delegateCannot, type FounderDelegateDepartment } from './founder-delegates';
import type { ConsequenceClass } from './decision-gate';
import type { MeshAgentRole } from './agent-mesh';

export type RdRecruitingPlan = {
  status: 'PLANNED' | 'NOT_APPROVED' | 'HUMAN_APPROVAL_REQUIRED' | 'DENIED';
  department: 'rd';
  requestedRoles: MeshAgentRole[];
  hired: false;
  fired: false;
  realEmploymentChange: false;
  productionAuthorization: false;
  reason: string;
};

export function planRdRecruiting(input: {
  tenantId: string;
  universeId: string;
  taskId: string;
  focus: string;
  consequence?: ConsequenceClass;
  approved?: boolean;
  attemptHire?: boolean;
  attemptFire?: boolean;
}): RdRecruitingPlan {
  if (input.attemptHire) {
    const denied = delegateCannot('hire');
    return {
      status: 'DENIED',
      department: 'rd',
      requestedRoles: [],
      hired: false,
      fired: false,
      realEmploymentChange: false,
      productionAuthorization: false,
      reason: denied.reason,
    };
  }
  if (input.attemptFire) {
    const denied = delegateCannot('fire');
    return {
      status: 'DENIED',
      department: 'rd',
      requestedRoles: [],
      hired: false,
      fired: false,
      realEmploymentChange: false,
      productionAuthorization: false,
      reason: denied.reason,
    };
  }

  const requestedRoles: MeshAgentRole[] = ['researcher', 'architect', 'knowledge_curator'];
  const recruitment = planDemandAgents({
    tenantId: input.tenantId,
    universeId: input.universeId,
    taskId: input.taskId,
    requestedRoles,
    consequence: input.consequence ?? 'LOW',
    approved: input.approved ?? true,
  });

  return {
    status: recruitment.status,
    department: 'rd',
    requestedRoles,
    hired: false,
    fired: false,
    realEmploymentChange: false,
    productionAuthorization: false,
    reason: `R&D recruiting plan for "${input.focus}" is demand-based template recruitment only. No real hire/fire.`,
  };
}

export function recruitingDepartment(): FounderDelegateDepartment {
  return 'rd';
}
