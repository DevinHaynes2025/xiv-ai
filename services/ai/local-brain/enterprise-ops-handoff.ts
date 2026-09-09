import {
  CONSEQUENTIAL_ACTIONS,
  HANDOFF_NOT_EXECUTION_AUTHORITY,
  type ConsequentialAction,
} from './enterprise-ops-types';
import type { DecisionPacket } from './enterprise-ops-decisions';

export type HandoffPackage = {
  id: string;
  packetId: string;
  tenantId: string;
  universeId: string;
  enterpriseId: string;
  humanApprovedPlan: boolean;
  packageCreated: true;
  executionAuthority: false;
  spendingAuthorized: false;
  deployAuthorized: false;
  customerContactAuthorized: false;
  productionChangeAuthorized: false;
  permissionChangeAuthorized: false;
  requestedActions: ConsequentialAction[];
  createdAt: string;
};

export function createApprovedActionHandoff(input: {
  id: string;
  packet: DecisionPacket;
  requestedActions?: ConsequentialAction[];
}): { accepted: false; reason: string } | { accepted: true; package: HandoffPackage } {
  if (!input.packet.approved) {
    return { accepted: false, reason: 'HANDOFF_REQUIRES_HUMAN_APPROVED_PLAN' };
  }
  return {
    accepted: true,
    package: {
      id: input.id,
      packetId: input.packet.id,
      tenantId: input.packet.tenantId,
      universeId: input.packet.universeId,
      enterpriseId: input.packet.enterpriseId,
      humanApprovedPlan: true,
      packageCreated: true,
      executionAuthority: false,
      spendingAuthorized: false,
      deployAuthorized: false,
      customerContactAuthorized: false,
      productionChangeAuthorized: false,
      permissionChangeAuthorized: false,
      requestedActions: [...(input.requestedActions ?? [])],
      createdAt: new Date().toISOString(),
    },
  };
}

export type ConsequentialAttempt = {
  action: ConsequentialAction;
  authorized: false;
  executed: false;
  reason: typeof HANDOFF_NOT_EXECUTION_AUTHORITY;
  packageId: string;
  humanApprovedPlan: boolean;
};

export function attemptConsequentialAction(pkg: HandoffPackage, action: ConsequentialAction): ConsequentialAttempt {
  return {
    action,
    authorized: false,
    executed: false,
    reason: HANDOFF_NOT_EXECUTION_AUTHORITY,
    packageId: pkg.id,
    humanApprovedPlan: pkg.humanApprovedPlan,
  };
}

export function provePackageIsNotExecutionAuthority(pkg: HandoffPackage) {
  const attempts = CONSEQUENTIAL_ACTIONS.map((action) => attemptConsequentialAction(pkg, action));
  return {
    packageCreated: pkg.packageCreated,
    humanApprovedPlan: pkg.humanApprovedPlan,
    executionAuthority: pkg.executionAuthority,
    allDenied: attempts.every((item) => item.authorized === false && item.executed === false),
    attempts,
  };
}

export function authorizedExecutionFromPackage(pkg: HandoffPackage) {
  const proof = provePackageIsNotExecutionAuthority(pkg);
  return {
    hop: 'authorized_execution' as const,
    state: 'DENIED' as const,
    executed: false as const,
    executionAuthority: false as const,
    reason: HANDOFF_NOT_EXECUTION_AUTHORITY,
    proof,
  };
}
