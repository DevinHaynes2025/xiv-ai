/**
 * Neural feedback loops. Lessons propose; they never rewrite security policy.
 */

export type FeedbackStep =
  | 'OBSERVE'
  | 'UNDERSTAND'
  | 'VERIFY'
  | 'RECOMMEND'
  | 'ACT'
  | 'MEASURE'
  | 'COMPARE'
  | 'LESSON'
  | 'PROPOSAL';

export type NeuralLesson = {
  lessonId: string;
  rewritesSecurityPolicy: false;
  rewritesProduction: false;
  autoApplied: false;
};

export type ImprovementProposal = {
  proposalId: string;
  productionApplied: false;
  requiresHumanApproval: true;
};

export const NEURAL_FEEDBACK_LOOP: readonly FeedbackStep[] = [
  'OBSERVE',
  'UNDERSTAND',
  'VERIFY',
  'RECOMMEND',
  'ACT',
  'MEASURE',
  'COMPARE',
  'LESSON',
  'PROPOSAL',
] as const;

export function recordNeuralLesson(input: { summary: string }): NeuralLesson {
  return {
    lessonId: `lesson:${input.summary.slice(0, 24) || 'anonymous'}`,
    rewritesSecurityPolicy: false,
    rewritesProduction: false,
    autoApplied: false,
  };
}

export function proposeImprovement(input: { lessonId: string }): ImprovementProposal {
  return {
    proposalId: `improve:${input.lessonId}`,
    productionApplied: false,
    requiresHumanApproval: true,
  };
}

export function feedbackRewritesSecurityPolicy(): false {
  return false;
}

export function applyFeedbackAsSecurityRewrite() {
  return {
    allowed: false as const,
    reason: 'feedback_cannot_rewrite_security_policy',
  };
}
