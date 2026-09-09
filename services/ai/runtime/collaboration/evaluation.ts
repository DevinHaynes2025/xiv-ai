import type { CollaborationEvaluation, CollaborationResult } from './types';

export function evaluateCollaboration(result: CollaborationResult): CollaborationEvaluation {
  const denied = result.contributions.some((item) => item.status === 'denied');
  return {
    sessionId: result.session.sessionId,
    grounding: 'not_measured',
    policyCompliance: denied || !result.allowed ? 'fail' : 'pass',
    provenanceCoverage: 'not_measured',
    unsupportedClaims: 'not_measured',
    toolCorrectness: 'not_measured',
    handoffEfficiency: 'not_measured',
    latencyMs: 'not_measured',
    costUnits: result.session.budget.costUnitsUsed,
    humanOverride: 'not_measured',
    outcomeAccuracy: 'not_measured',
    hopCount: result.session.budget.hopsUsed,
  };
}
