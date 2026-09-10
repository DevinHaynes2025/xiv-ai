export type GrowthSource = 'CASE_STUDY' | 'HISTORICAL_TECH' | 'APPROVED_MEETING' | 'EVALUATION';

export interface GrowthCandidate {
  candidateId: string;
  tenantId: string;
  source: GrowthSource;
  fromNode: string;
  toNode: string;
  relation: 'SUPPORTS' | 'CONTRADICTS' | 'PRECEDES' | 'CAUSE_CANDIDATE' | 'IMPROVES' | 'DEPENDS_ON';
  evidenceRefs: string[];
  confidence: number;
  approved: boolean;
}

export interface GrowthPlan {
  accepted: GrowthCandidate[];
  rejected: GrowthCandidate[];
  maxNewEdges: number;
}

export function scheduleNeuralGrowth(candidates: GrowthCandidate[], maxNewEdges = 64): GrowthPlan {
  const accepted = candidates
    .filter(c => c.tenantId && c.evidenceRefs.length > 0 && c.approved && c.confidence >= 0.7)
    .slice(0, maxNewEdges);
  const acceptedIds = new Set(accepted.map(c => c.candidateId));
  return { accepted, rejected: candidates.filter(c => !acceptedIds.has(c.candidateId)), maxNewEdges };
}

export const NEURAL_GROWTH_GUARDRAILS = {
  evidenceRequired: true,
  approvalRequired: true,
  minimumConfidence: 0.7,
  graphEdgeIsNotFact: true,
  silentModelWeightMutationAllowed: false,
  productionMutationAllowed: false,
};
