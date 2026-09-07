import { boundedAutonomyEnabled } from '../authority';

export type GlobalOperationsBrain = {
  autonomousEnterpriseManagement: false;
  l4Enabled: false;
};

export type OperationsContext = {
  tenantId: string;
  universeId: string;
  identityId: string;
  deviceId: string;
};

export type OperationalObjective = { objectiveId: string; text: string };
export type OperationalSignal = { signalId: string; text: string };
export type OperationalProblem = { problemId: string; text: string };
export type OperationalHypothesis = { hypothesisId: string; verified: false };
export type OperationalDecision = { decisionId: string; approved: boolean; evidenceRef?: string };
export type OperationalRecommendation = { recommendationId: string; evidenceRequired: true };
export type OperationalAction = { actionId: string; decisionId: string; approvalRecorded: boolean };
export type OperationalOutcome = { outcomeId: string; decisionId: string; evidenceRef: string };
export type OperationalLesson = { lessonId: string; rewritesSecurityPolicy: false };
export type OperationalRisk = { riskId: string; level: 'low' | 'medium' | 'high' };
export type OperationalConstraint = { constraintId: string };
export type OperationalEvidence = { evidenceId: string; source: string };
export type OperationalTimeline = { events: readonly string[] };

export function openGlobalOperationsBrain(): GlobalOperationsBrain {
  void boundedAutonomyEnabled();
  return { autonomousEnterpriseManagement: false, l4Enabled: false };
}

export function autonomousEnterpriseManagementEnabled(): false {
  return false;
}

export function recordOperationalAction(input: {
  decisionId: string;
  requiresApproval: boolean;
  approved: boolean;
  evidenceRef?: string;
}) {
  if (input.requiresApproval && input.approved !== true) {
    return { allowed: false as const, reason: 'action_records_approval_where_required' };
  }
  return {
    allowed: true as const,
    action: {
      actionId: `action:${input.decisionId}`,
      decisionId: input.decisionId,
      approvalRecorded: input.requiresApproval ? input.approved : true,
    } satisfies OperationalAction,
  };
}

export function linkOutcome(input: { decisionId: string; evidenceRef?: string }) {
  if (!input.evidenceRef) {
    return { allowed: false as const, reason: 'outcome_requires_decision_and_evidence' };
  }
  return {
    allowed: true as const,
    outcome: {
      outcomeId: `outcome:${input.decisionId}`,
      decisionId: input.decisionId,
      evidenceRef: input.evidenceRef,
    } satisfies OperationalOutcome,
  };
}

export function decisionGraphRetainsProvenance(input: { identity?: string; evidence?: string }): boolean {
  return Boolean(input.identity && input.evidence);
}
