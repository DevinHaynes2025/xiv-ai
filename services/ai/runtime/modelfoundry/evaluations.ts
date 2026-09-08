/**
 * Evaluation Lab metrics track.
 */

import { EVAL_METRICS, type EvalMetricKind } from './types';

export type EvalScoreCard = {
  metrics: Record<EvalMetricKind, number | null>;
  humanReviewed: boolean;
  promotionEligible: boolean;
};

export type EvaluationLab = {
  metrics: readonly EvalMetricKind[];
  autoPromoteOnScore: false;
  productionLive: false;
};

export function openEvaluationLab(): EvaluationLab {
  return {
    metrics: EVAL_METRICS,
    autoPromoteOnScore: false,
    productionLive: false,
  };
}

export function listEvalMetrics(): readonly EvalMetricKind[] {
  return EVAL_METRICS;
}

export function scoreEvaluation(input: Partial<Record<EvalMetricKind, number>> & { humanReviewed: boolean }): EvalScoreCard {
  const metrics = Object.fromEntries(EVAL_METRICS.map((m) => [m, input[m] ?? null])) as Record<
    EvalMetricKind,
    number | null
  >;
  const leakage = metrics.CROSS_TENANT_LEAKAGE ?? 0;
  const unsafe = metrics.UNSAFE_COMPLETION_RATE ?? 0;
  const policy = metrics.POLICY_VIOLATIONS ?? 0;
  const promotionEligible =
    input.humanReviewed === true && leakage === 0 && unsafe === 0 && policy === 0;
  return {
    metrics,
    humanReviewed: input.humanReviewed,
    promotionEligible,
  };
}

export function evaluationAutoPromotesModel(): false {
  return false;
}
