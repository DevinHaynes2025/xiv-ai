import { appendLearning, searchLearning } from './learning-ledger';
import { BJ_LOCKS } from './global-operations-brain-types';

/**
 * Decision-to-outcome learning — measured; no authority escalation.
 * Learning ≠ permission grant.
 */

export type DecisionOutcomeRecord = {
  tenantId: string;
  universeId: string;
  decisionId: string;
  optionId: string | null;
  outcomeSummary: string;
  evidenceRefs: string[];
  measuredScore?: number; // 0..1 calibration / reliability
  attemptPermissionEscalation?: boolean;
  root?: string;
};

export type DecisionOutcomeLearningResult = {
  accepted: boolean;
  reason: string;
  learningId: string | null;
  permissionEscalated: false;
  productionChange: false;
  learningIsPermissionGrant: false;
  productionAuthorization: false;
};

export async function recordDecisionOutcome(input: DecisionOutcomeRecord): Promise<DecisionOutcomeLearningResult> {
  if (!input.tenantId || !input.universeId) {
    return {
      accepted: false,
      reason: 'TENANT_AND_UNIVERSE_REQUIRED',
      learningId: null,
      permissionEscalated: false,
      productionChange: false,
      learningIsPermissionGrant: false,
      productionAuthorization: false,
    };
  }

  if (input.attemptPermissionEscalation) {
    return {
      accepted: false,
      reason: 'LEARNING_IS_NOT_PERMISSION_GRANT — authority escalation denied.',
      learningId: null,
      permissionEscalated: false,
      productionChange: false,
      learningIsPermissionGrant: false,
      productionAuthorization: false,
    };
  }

  const entry = await appendLearning(
    {
      domain: 'executive_decision_outcome',
      subject: `${input.decisionId}:${input.optionId ?? 'none'}`,
      claimState: 'MODEL_INFERENCE',
      summary: input.outcomeSummary,
      sourceRefs: [`tenant:${input.tenantId}`, `universe:${input.universeId}`],
      evidence: input.evidenceRefs,
      confidence: input.measuredScore,
      taskId: input.decisionId,
    },
    input.root,
  );

  return {
    accepted: true,
    reason: 'OUTCOME_RECORDED_MEASURED_NO_AUTHORITY_ESCALATION',
    learningId: entry.id,
    permissionEscalated: false,
    productionChange: false,
    learningIsPermissionGrant: false,
    productionAuthorization: false,
  };
}

export async function recallDecisionOutcomes(query: string, root?: string) {
  const hits = await searchLearning(query, root);
  return hits
    .filter((h) => h.domain === 'executive_decision_outcome')
    .map((h) => ({
      ...h,
      permissionChange: false as const,
      productionChange: false as const,
      learningIsPermissionGrant: false as const,
    }));
}

export function decisionOutcomeHonesty() {
  return {
    locks: BJ_LOCKS,
    learningIsPermissionGrant: BJ_LOCKS.LEARNING_IS_PERMISSION_GRANT,
    productionAuthorization: false as const,
    l4AutonomyEnabled: false as const,
  };
}
