export type GrowthDecision = 'REJECT' | 'SANDBOX' | 'REVIEW' | 'APPROVE_SHARED_MEMORY';

export interface BrainGrowthCandidate {
  candidateId: string;
  capability: string;
  sourceRefs: string[];
  evalScore: number;
  securityPassed: boolean;
  privacyPassed: boolean;
  humanApproved: boolean;
  modelWeightMutationRequested: boolean;
}

export function evaluateBrainGrowth(candidate: BrainGrowthCandidate): GrowthDecision {
  if (candidate.modelWeightMutationRequested) return 'REJECT';
  if (!candidate.securityPassed || !candidate.privacyPassed) return 'REJECT';
  if (candidate.sourceRefs.length === 0 || candidate.evalScore < 0.8) return 'SANDBOX';
  if (!candidate.humanApproved || candidate.evalScore < 0.9) return 'REVIEW';
  return 'APPROVE_SHARED_MEMORY';
}

export const LOCAL_BRAIN_GROWTH_POLICY = {
  learningModes: ['RAG','MEMORY','EVALUATION','PROMPT_SPECIALIZATION'],
  uncontrolledSelfRewrite: false,
  productionMutationAllowed: false,
  sharedMemoryRequiresEvidence: true,
  rollbackRequired: true,
} as const;
