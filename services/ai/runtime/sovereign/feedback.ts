import type { FeedbackLoopStep } from './types';

export const FEEDBACK_LOOP: readonly FeedbackLoopStep[] = [
  'OBSERVE',
  'UNDERSTAND',
  'VERIFY',
  'DECIDE_RECOMMEND',
  'ACT',
  'MEASURE',
  'COMPARE_EXPECTED_VS_ACTUAL',
  'LESSON',
  'EVALUATION',
  'IMPROVEMENT_PROPOSAL',
];

export type ObservedOutcome = { text: string; measured: true };
export type ExpectedOutcome = { text: string; certainty: false };
export type Lesson = { text: string; rewritesProduction: false };
export type ImprovementProposal = { text: string; productionApplied: false };

export function feedbackLoopSilentlyRewritesProduction(): false {
  return false;
}
