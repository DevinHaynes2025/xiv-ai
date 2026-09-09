import { decisionGate, type ConsequenceClass } from './decision-gate';
import {
  AGENT_MAY_NOT_SELF_GRANT,
  HUMAN_GATE_BLOCKS_CONSEQUENTIAL,
  type ConsequentialAction,
  type OpsDepartment,
} from './enterprise-ops-types';
import type { PlanOption, RiskRegister } from './enterprise-ops-planning';

export type DecisionPrincipal =
  | 'agent_planner'
  | 'department_owner'
  | 'finance_controller'
  | 'cio'
  | 'chro'
  | 'ciso'
  | 'ceo'
  | 'founder';

export type DecisionRightAction = 'plan' | 'recommend' | ConsequentialAction;

export type DecisionRight = {
  principal: DecisionPrincipal;
  action: DecisionRightAction;
  agentMayExecute: boolean;
  humanRequired: boolean;
  requiredApprover: DecisionPrincipal | null;
  reason: string;
};

const HUMAN_OWNED: DecisionRightAction[] = [
  'spend',
  'deploy',
  'contact_customer',
  'change_production',
  'change_permissions',
];

const APPROVER: Record<DecisionRightAction, DecisionPrincipal> = {
  plan: 'department_owner',
  recommend: 'department_owner',
  spend: 'finance_controller',
  deploy: 'cio',
  contact_customer: 'department_owner',
  change_production: 'cio',
  change_permissions: 'ceo',
};

export function lookupDecisionRight(input: {
  principal: DecisionPrincipal;
  action: DecisionRightAction;
  department?: OpsDepartment;
}): DecisionRight {
  const humanOwned = HUMAN_OWNED.includes(input.action);
  const agent = input.principal === 'agent_planner';
  if (agent && humanOwned) {
    return {
      principal: input.principal,
      action: input.action,
      agentMayExecute: false,
      humanRequired: true,
      requiredApprover: APPROVER[input.action],
      reason: `${input.action} is a consequential human-owned decision. Agents may only plan or recommend.`,
    };
  }
  if (agent && (input.action === 'plan' || input.action === 'recommend')) {
    return {
      principal: input.principal,
      action: input.action,
      agentMayExecute: true,
      humanRequired: false,
      requiredApprover: null,
      reason: 'Agents may plan and recommend. They do not own consequential decisions.',
    };
  }
  return {
    principal: input.principal,
    action: input.action,
    agentMayExecute: false,
    humanRequired: humanOwned,
    requiredApprover: humanOwned ? APPROVER[input.action] : null,
    reason: humanOwned
      ? `Human principal ${input.principal} still requires an explicit execution grant; a plan approval is not that grant.`
      : 'Non-consequential planning is allowed.',
  };
}

export function agentSelfGrantDecisionRight(): { granted: false; reason: typeof AGENT_MAY_NOT_SELF_GRANT } {
  return { granted: false, reason: AGENT_MAY_NOT_SELF_GRANT };
}

export function decisionRightsMatrix() {
  const principals: DecisionPrincipal[] = [
    'agent_planner',
    'department_owner',
    'finance_controller',
    'cio',
    'chro',
    'ciso',
    'ceo',
    'founder',
  ];
  const actions: DecisionRightAction[] = [
    'plan',
    'recommend',
    'spend',
    'deploy',
    'contact_customer',
    'change_production',
    'change_permissions',
  ];
  return principals.flatMap((principal) => actions.map((action) => lookupDecisionRight({ principal, action })));
}

export type DecisionPacket = {
  id: string;
  tenantId: string;
  universeId: string;
  enterpriseId: string;
  need: string;
  options: PlanOption[];
  selectedOptionId: string | null;
  risks: RiskRegister;
  evidenceRefs: string[];
  sealedRedacted: true;
  humanApprovalRequired: true;
  approved: boolean;
  executionAuthority: false;
  spendingAuthorized: false;
  deployAuthorized: false;
  customerContactAuthorized: false;
  productionChangeAuthorized: false;
};

export function buildDecisionPacket(input: {
  id: string;
  tenantId: string;
  universeId: string;
  enterpriseId: string;
  need: string;
  options: PlanOption[];
  selectedOptionId: string | null;
  risks: RiskRegister;
  evidenceRefs: string[];
  consequence?: ConsequenceClass;
  production?: boolean;
}): DecisionPacket {
  const gate = decisionGate({
    id: input.id,
    action: 'enterprise_ops_plan',
    consequence: input.consequence ?? 'HIGH',
    production: input.production ?? false,
    financialCommitment: false,
    legalCommitment: false,
    permissionChange: false,
    externalPublication: false,
  });
  return {
    id: input.id,
    tenantId: input.tenantId,
    universeId: input.universeId,
    enterpriseId: input.enterpriseId,
    need: input.need,
    options: input.options,
    selectedOptionId: input.selectedOptionId,
    risks: input.risks,
    evidenceRefs: [...input.evidenceRefs],
    sealedRedacted: true,
    humanApprovalRequired: true,
    approved: false,
    executionAuthority: false,
    spendingAuthorized: false,
    deployAuthorized: false,
    customerContactAuthorized: false,
    productionChangeAuthorized: false,
    ...(gate.humanApprovalRequired ? {} : {}),
  };
}

export type ExecutiveQueueItem = {
  packetId: string;
  queuedAt: string;
  status: 'queued' | 'approved_plan' | 'rejected' | 'expired';
  executionAuthority: false;
};

export type ExecutiveQueue = {
  tenantId: string;
  universeId: string;
  items: ExecutiveQueueItem[];
};

export function enqueueExecutiveDecision(queue: ExecutiveQueue, packet: DecisionPacket): ExecutiveQueue {
  if (queue.items.some((item) => item.packetId === packet.id)) return queue;
  return {
    ...queue,
    items: [
      ...queue.items,
      {
        packetId: packet.id,
        queuedAt: new Date().toISOString(),
        status: 'queued',
        executionAuthority: false,
      },
    ],
  };
}

export function humanDecide(input: {
  packet: DecisionPacket;
  queue: ExecutiveQueue;
  principal: DecisionPrincipal;
  approve: boolean;
  impersonateFounder?: boolean;
}): {
  packet: DecisionPacket;
  queue: ExecutiveQueue;
  accepted: boolean;
  executionAuthority: false;
  reason: string;
} {
  if (input.impersonateFounder && input.principal !== 'founder') {
    return {
      packet: input.packet,
      queue: input.queue,
      accepted: false,
      executionAuthority: false,
      reason: 'FOUNDER_IMPERSONATION_DENIED',
    };
  }
  if (input.principal === 'agent_planner') {
    return {
      packet: input.packet,
      queue: input.queue,
      accepted: false,
      executionAuthority: false,
      reason: HUMAN_GATE_BLOCKS_CONSEQUENTIAL,
    };
  }
  const packet: DecisionPacket = {
    ...input.packet,
    approved: input.approve,
    executionAuthority: false,
    spendingAuthorized: false,
    deployAuthorized: false,
    customerContactAuthorized: false,
    productionChangeAuthorized: false,
  };
  const queue: ExecutiveQueue = {
    ...input.queue,
    items: input.queue.items.map((item) =>
      item.packetId === packet.id
        ? {
            ...item,
            status: input.approve ? 'approved_plan' : 'rejected',
            executionAuthority: false as const,
          }
        : item,
    ),
  };
  return {
    packet,
    queue,
    accepted: true,
    executionAuthority: false,
    reason: input.approve
      ? 'Human approved the plan packet. Approval of a plan is not execution authority.'
      : 'Human rejected the plan packet.',
  };
}

export function humanGateConsequential(input: {
  action: ConsequentialAction;
  consequence: ConsequenceClass;
  production: boolean;
  financialCommitment?: boolean;
}) {
  const gate = decisionGate({
    id: `gate_${input.action}`,
    action: input.action,
    consequence: input.consequence,
    production: input.production,
    financialCommitment: input.financialCommitment ?? input.action === 'spend',
    legalCommitment: input.action === 'contact_customer',
    permissionChange: input.action === 'change_permissions',
    externalPublication: input.action === 'contact_customer',
  });
  return {
    ...gate,
    executableByAgent: false as const,
    humanApprovalRequired: true as const,
    reason: gate.humanApprovalRequired ? gate.reason : HUMAN_GATE_BLOCKS_CONSEQUENTIAL,
    executed: false as const,
  };
}
