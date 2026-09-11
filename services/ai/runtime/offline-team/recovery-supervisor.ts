export type RecoveryDecision = 'RESUME_FROM_CHECKPOINT' | 'RETRY_SANDBOX' | 'PAUSE_FOR_REVIEW' | 'ABORT';

export interface RecoveryContext {
  tenantId: string;
  jobId: string;
  checkpointAvailable: boolean;
  attempts: number;
  maxAttempts: number;
  classification: 'PUBLIC' | 'INTERNAL' | 'CONFIDENTIAL' | 'TOP_SECRET';
  evidenceRefs: string[];
}

export function decideRecovery(ctx: RecoveryContext): RecoveryDecision {
  if (ctx.classification === 'TOP_SECRET' && ctx.evidenceRefs.length === 0) return 'PAUSE_FOR_REVIEW';
  if (ctx.checkpointAvailable) return 'RESUME_FROM_CHECKPOINT';
  if (ctx.attempts < ctx.maxAttempts) return 'RETRY_SANDBOX';
  return 'ABORT';
}

export const RECOVERY_SUPERVISOR_POLICY = {
  failFast: true,
  rollbackToKnownGoodCheckpoint: true,
  learnOnlyAfterEvaluation: true,
  productionMutationAllowed: false,
  humanReviewForConsequentialChanges: true,
} as const;
