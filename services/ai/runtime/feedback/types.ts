export type FeedbackStage =
  | 'observation'
  | 'recommendation'
  | 'decision'
  | 'action'
  | 'outcome'
  | 'evaluation'
  | 'lesson';

export type SuccessState = 'improved' | 'unchanged' | 'regressed' | 'unknown' | 'not_measured';

export type OutcomeRecord = {
  outcomeId: string;
  organizationId: string | null;
  universeId: string | null;
  problem: string;
  recommendationId: string;
  decision: 'approved' | 'denied' | 'deferred' | 'not_taken';
  actionTaken: string | null;
  expectedOutcome: string;
  actualOutcome: string | null;
  measurementWindow: string | null;
  confidenceBefore: 'low' | 'medium' | 'high';
  confidenceAfter: 'low' | 'medium' | 'high' | 'not_measured';
  successState: SuccessState;
  evidence: readonly string[];
  createdAt: string;
  evaluatedAt: string | null;
  prototype: boolean;
  live: false;
};

export type LessonRecord = {
  lessonId: string;
  outcomeId: string;
  summary: string;
  improvesFutureContext: true;
  retrainsModel: false;
  mutatesAgentCode: false;
  createdAt: string;
};
