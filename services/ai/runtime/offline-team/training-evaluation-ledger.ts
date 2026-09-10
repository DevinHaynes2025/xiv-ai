export interface TrainingEvaluation {
  evaluationId: string;
  runId: string;
  agentRole: string;
  skill: string;
  score: number;
  evidenceRefs: readonly string[];
  lesson: string;
  createdAt: string;
}

export interface TrainingLedgerSnapshot {
  evaluations: readonly TrainingEvaluation[];
  averageScore: number;
  bestSkills: readonly string[];
  weakestSkills: readonly string[];
  mutatesModelWeights: false;
}

export const TRAINING_LEDGER_GUARDRAILS = {
  maxEvaluations: 10000,
  minScore: 0,
  maxScore: 1,
  evidenceRequired: true,
  mutatesModelWeights: false,
  rewritesAgentCode: false,
} as const;

export function buildTrainingLedger(evaluations: readonly TrainingEvaluation[]): TrainingLedgerSnapshot {
  const valid = evaluations
    .filter((item) => item.score >= TRAINING_LEDGER_GUARDRAILS.minScore && item.score <= TRAINING_LEDGER_GUARDRAILS.maxScore)
    .filter((item) => item.evidenceRefs.length > 0)
    .slice(-TRAINING_LEDGER_GUARDRAILS.maxEvaluations);
  const averageScore = valid.length === 0 ? 0 : valid.reduce((sum, item) => sum + item.score, 0) / valid.length;
  const ranked = [...valid].sort((a, b) => b.score - a.score);
  return Object.freeze({
    evaluations: Object.freeze(valid),
    averageScore,
    bestSkills: Object.freeze([...new Set(ranked.slice(0, 5).map((item) => item.skill))]),
    weakestSkills: Object.freeze([...new Set(ranked.slice(-5).map((item) => item.skill))]),
    mutatesModelWeights: false,
  });
}
