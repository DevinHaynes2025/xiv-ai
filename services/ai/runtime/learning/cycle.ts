/**
 * Governed continuous-learning contracts. No uncontrolled model self-modification.
 */
export const LEARNING_LIFECYCLE = [
  'observe',
  'understand',
  'hypothesize',
  'predict',
  'recommend',
  'human_or_policy_decision',
  'action',
  'measure_outcome',
  'evaluate',
  'store_lesson',
  'improve_future_retrieval',
] as const;

export type LearningLifecycleStep = (typeof LEARNING_LIFECYCLE)[number];

export type LearningScope = {
  organizationId: string | null;
  universeId: string | null;
  brain: 'personal' | 'company' | 'global';
};

export type LearningConfidence = 'low' | 'medium' | 'high' | 'unknown';

export type LearningEvidence = {
  evidenceId: string;
  summary: string;
  sourceId: string | null;
};

export type AgentObservation = {
  observationId: string;
  summary: string;
  evidence: readonly LearningEvidence[];
  scope: LearningScope;
  createdAt: string;
};

export type AgentHypothesis = {
  hypothesisId: string;
  statement: string;
  stance: 'hypothesized';
};

export type AgentPrediction = {
  predictionId: string;
  statement: string;
  stance: 'forecast';
  confidence: LearningConfidence;
  evidence: readonly LearningEvidence[];
};

export type AgentRecommendation = {
  recommendationId: string;
  statement: string;
  stance: 'recommended';
};

export type HumanDecision = {
  decisionId: string;
  verdict: 'approved' | 'denied' | 'deferred' | 'not_taken';
  actorUserId: string | null;
};

export type AgentAction = {
  actionId: string;
  executed: false;
  reason: string;
};

export type ObservedOutcome = {
  outcomeId: string;
  summary: string | null;
  fabricatedSuccess: false;
};

export type OutcomeEvaluation = {
  evaluationId: string;
  result: 'unmeasured' | 'successful' | 'unsuccessful' | 'inconclusive';
};

export type LearningLesson = {
  lessonId: string;
  evidence: readonly LearningEvidence[];
  provenance: { sourceId: string | null };
  confidence: LearningConfidence;
  scope: LearningScope;
  modelVersion: string | null;
  outcome: string | null;
  timestamp: string;
  mutatesPolicy: false;
  mutatesAuthority: false;
  mutatesModel: false;
};

export function learningMayMutateAgentAuthority() {
  return false;
}

export function learningMayRewriteSecurityPolicy() {
  return false;
}

export function createLearningLesson(input: {
  evidence: readonly LearningEvidence[];
  scope: LearningScope;
  timestamp: string;
  outcome?: string | null;
  modelVersion?: string | null;
  confidence?: LearningConfidence;
}): LearningLesson | { allowed: false; reason: string } {
  if (input.evidence.length === 0) {
    return { allowed: false, reason: 'Lessons require evidence.' };
  }
  return {
    lessonId: `lesson_${input.timestamp}`,
    evidence: input.evidence,
    provenance: { sourceId: input.evidence[0]?.sourceId ?? null },
    confidence: input.confidence ?? 'unknown',
    scope: input.scope,
    modelVersion: input.modelVersion ?? null,
    outcome: input.outcome ?? null,
    timestamp: input.timestamp,
    mutatesPolicy: false,
    mutatesAuthority: false,
    mutatesModel: false,
  };
}
