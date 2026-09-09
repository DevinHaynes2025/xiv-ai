import type { DataScope } from '../context/adapters/scope';
import type { DataClassification } from '../universe/types';

export type IntelligenceStance = 'observed' | 'inferred' | 'projected' | 'hypothesized' | 'recommended';

export type IntelligenceLoopStage =
  | 'sense'
  | 'understand'
  | 'predict'
  | 'decide'
  | 'act'
  | 'measure'
  | 'learn';

export type IntelligenceProvenance = {
  source: string;
  sourceId: string;
  retrievedAt: string;
  freshness: 'fresh' | 'aging' | 'stale' | 'unknown' | 'not_configured';
  scope: DataScope;
  classification: DataClassification;
  confidence: 'low' | 'medium' | 'high' | 'not_measured';
  organizationId: string | null;
  universeId: string | null;
  stance: IntelligenceStance;
};

export type IntelligenceSignal = IntelligenceProvenance & {
  signalId: string;
  label: string;
};

export type IntelligenceObservation = IntelligenceProvenance & {
  observationId: string;
  summary: string;
};

export type IntelligenceFinding = IntelligenceProvenance & {
  findingId: string;
  claim: string;
};

export type Recommendation = IntelligenceProvenance & {
  recommendationId: string;
  action: string;
};

export type DecisionRecord = {
  decisionId: string;
  recommendationId: string;
  decidedBy: string;
  decision: 'approved' | 'denied' | 'deferred';
  createdAt: string;
};

export type ExecutionRecord = {
  executionId: string;
  decisionId: string;
  authorized: boolean;
  actionTaken: string | null;
  createdAt: string;
};

export type FeedbackCycle = {
  cycleId: string;
  stages: readonly IntelligenceLoopStage[];
  outcomeId: string | null;
  lessonId: string | null;
};
