export type RefinementStage = 'OBSERVE' | 'PROPOSE' | 'EVALUATE' | 'APPROVE' | 'PROMOTE' | 'ROLLBACK';

export interface RefinementCandidate {
  id: string;
  tenantId: string;
  stage: RefinementStage;
  sourceRefs: string[];
  evaluationScore: number;
  humanApproved: boolean;
  changesModelWeights: boolean;
  changesProductionCode: boolean;
}

export function canPromote(candidate: RefinementCandidate): boolean {
  return candidate.sourceRefs.length > 0 &&
    candidate.evaluationScore >= 0.85 &&
    candidate.humanApproved &&
    !candidate.changesModelWeights &&
    !candidate.changesProductionCode;
}

export const refinementPolicy = {
  defaultLearning: 'RAG_MEMORY_EVAL',
  silentWeightMutationAllowed: false,
  uncontrolledSelfRewriteAllowed: false,
  rollbackRequired: true,
  offlineSupported: true,
};
