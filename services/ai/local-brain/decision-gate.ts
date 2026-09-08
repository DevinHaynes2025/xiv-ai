export type ConsequenceClass = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type DecisionRequest = {
  id: string;
  action: string;
  consequence: ConsequenceClass;
  production: boolean;
  financialCommitment: boolean;
  legalCommitment: boolean;
  permissionChange: boolean;
  externalPublication: boolean;
};

export type DecisionGateResult = {
  executableByAgent: boolean;
  humanApprovalRequired: boolean;
  reason: string;
};

export function decisionGate(request: DecisionRequest): DecisionGateResult {
  if (
    request.production ||
    request.financialCommitment ||
    request.legalCommitment ||
    request.permissionChange ||
    request.externalPublication ||
    request.consequence === 'HIGH' ||
    request.consequence === 'CRITICAL'
  ) {
    return {
      executableByAgent: false,
      humanApprovalRequired: true,
      reason: 'Consequential action is recommendation-only until explicit human authorization.',
    };
  }

  return {
    executableByAgent: true,
    humanApprovalRequired: request.consequence === 'MEDIUM',
    reason:
      request.consequence === 'MEDIUM'
        ? 'Medium-consequence work may be prepared locally but requires approval before external effect.'
        : 'Low-consequence sandbox work is eligible for bounded execution.',
  };
}
