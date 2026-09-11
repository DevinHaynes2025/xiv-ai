export type PathwayRelation = 'SUPPORTS' | 'CONTRADICTS' | 'PRECEDES' | 'RELATED' | 'CAUSE_CANDIDATE';

export interface NeuralPathwayEdge {
  tenantId: string;
  fromNode: string;
  toNode: string;
  relation: PathwayRelation;
  evidenceRefs: string[];
  confidence: number;
  approved: boolean;
  source: 'LOCAL_MEMORY' | 'CASE_STUDY' | 'HISTORICAL_ARCHIVE' | 'APPROVED_EXTERNAL';
}

export function canActivatePathway(edge: NeuralPathwayEdge): boolean {
  if (!edge.tenantId || !edge.fromNode || !edge.toNode) return false;
  if (edge.evidenceRefs.length === 0) return false;
  if (edge.confidence < 0 || edge.confidence > 1) return false;
  return edge.approved && edge.confidence >= 0.6;
}

export const NEURAL_PATHWAY_GUARDRAILS = {
  edgeIsFact: false,
  correlationIsCausation: false,
  causeCandidateNeedsReview: true,
  crossTenantEdgesAllowed: false,
  quantumMode: 'SIMULATOR_OR_VERIFIED_ADAPTER_ONLY',
} as const;
