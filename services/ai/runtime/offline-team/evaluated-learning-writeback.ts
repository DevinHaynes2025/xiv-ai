export type LearningWritebackDecision = 'PROMOTE_LOCAL' | 'SHARE_MINIMIZED' | 'REVIEW' | 'REJECT';

export interface LearningCandidate {
  id: string;
  tenantId: string;
  contentHash: string;
  evidenceRefs: string[];
  evaluationScore: number;
  approved: boolean;
  classification: 'PUBLIC' | 'INTERNAL' | 'CONFIDENTIAL' | 'TOP_SECRET';
  minimizedForSharing: boolean;
}

export function decideLearningWriteback(candidate: LearningCandidate): LearningWritebackDecision {
  if (!candidate.approved || candidate.evidenceRefs.length === 0 || candidate.evaluationScore < 0.85) return 'REVIEW';
  if (candidate.classification === 'TOP_SECRET') return 'PROMOTE_LOCAL';
  if (candidate.classification === 'CONFIDENTIAL' && !candidate.minimizedForSharing) return 'PROMOTE_LOCAL';
  if (candidate.minimizedForSharing) return 'SHARE_MINIMIZED';
  return 'PROMOTE_LOCAL';
}

export const evaluatedLearningWritebackPolicy = {
  silentWeightMutationAllowed: false,
  productionCodeSelfRewriteAllowed: false,
  ragMemoryEvaluationDefault: true,
  humanApprovalRequired: true,
};
