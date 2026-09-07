export type LearningState =
  | 'unmeasured'
  | 'measuring'
  | 'successful'
  | 'partially_successful'
  | 'unsuccessful'
  | 'inconclusive';

export type LearningContext = {
  problem: string;
  recommendationId: string;
  decision: 'approved' | 'denied' | 'deferred' | 'not_taken';
  expectedOutcome: string;
  actualOutcome: string | null;
  lessons: readonly string[];
  mutatesModel: false;
  mutatesAgentCode: false;
};
