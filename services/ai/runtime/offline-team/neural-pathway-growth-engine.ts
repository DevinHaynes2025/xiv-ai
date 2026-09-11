export type PathwayStatus = 'CANDIDATE' | 'APPROVED' | 'ACTIVE' | 'DEGRADED' | 'ROLLED_BACK';
export type PathwayDomain = 'GENERAL' | 'CODE' | 'ARCHITECTURE' | 'SECURITY' | 'MEMORY' | 'OPERATIONS';

export interface NeuralPathwayCandidate {
  pathwayId: string;
  tenantId: string;
  domain: PathwayDomain;
  version: number;
  parentPathwayId?: string;
  confidence: number;
  evaluationScore: number;
  evidenceRefs: readonly string[];
  reviewRefs: readonly string[];
  humanApproved: boolean;
  rollbackRef?: string;
  modelWeightMutation: false;
  productionMutation: false;
}

export interface NeuralPathwayState extends NeuralPathwayCandidate {
  status: PathwayStatus;
  activatedAt?: string;
  supersedes?: string;
}

export const NEURAL_PATHWAY_GROWTH_GUARDRAILS = {
  minimumEvaluationScore: 0.92,
  minimumConfidence: 0.75,
  minimumIndependentReviews: 2,
  maxActivePathwaysPerDomain: 32,
  modelWeightMutationAllowed: false,
  autonomousProductionRewriteAllowed: false,
  humanApprovalRequired: true,
  rollbackRequiredForActivation: true,
} as const;

export function evaluatePathwayCandidate(candidate: NeuralPathwayCandidate): { eligible: boolean; reasons: readonly string[] } {
  const reasons: string[] = [];
  if (!candidate.pathwayId || !candidate.tenantId) reasons.push('pathway identity required');
  if (!Number.isInteger(candidate.version) || candidate.version < 1) reasons.push('version must be >= 1');
  if (candidate.evaluationScore < NEURAL_PATHWAY_GROWTH_GUARDRAILS.minimumEvaluationScore) reasons.push('evaluation below threshold');
  if (candidate.confidence < NEURAL_PATHWAY_GROWTH_GUARDRAILS.minimumConfidence) reasons.push('confidence below threshold');
  if (candidate.evidenceRefs.length === 0) reasons.push('evidence required');
  if (new Set(candidate.reviewRefs).size < NEURAL_PATHWAY_GROWTH_GUARDRAILS.minimumIndependentReviews) reasons.push('independent reviews required');
  if (!candidate.humanApproved) reasons.push('human approval required');
  if (!candidate.rollbackRef) reasons.push('rollback reference required');
  if (candidate.modelWeightMutation) reasons.push('model weight mutation forbidden');
  if (candidate.productionMutation) reasons.push('production mutation forbidden');
  return Object.freeze({ eligible: reasons.length === 0, reasons: Object.freeze(reasons) });
}

export function activatePathway(candidate: NeuralPathwayCandidate, activatedAt: string): NeuralPathwayState {
  const evaluation = evaluatePathwayCandidate(candidate);
  if (!evaluation.eligible) throw new Error(`pathway not eligible: ${evaluation.reasons.join(', ')}`);
  if (!activatedAt) throw new Error('activatedAt required');
  return Object.freeze({ ...candidate, status: 'ACTIVE' as const, activatedAt, supersedes: candidate.parentPathwayId });
}

export function applyConfidenceDecay(pathway: NeuralPathwayState, decay: number): NeuralPathwayState {
  if (!Number.isFinite(decay) || decay < 0 || decay > 1) throw new Error('decay must be between 0 and 1');
  const confidence = Math.max(0, pathway.confidence * (1 - decay));
  const status: PathwayStatus = confidence < NEURAL_PATHWAY_GROWTH_GUARDRAILS.minimumConfidence ? 'DEGRADED' : pathway.status;
  return Object.freeze({ ...pathway, confidence, status });
}

export function rollbackPathway(pathway: NeuralPathwayState, rollbackRef: string): NeuralPathwayState {
  if (!rollbackRef) throw new Error('rollbackRef required');
  return Object.freeze({ ...pathway, rollbackRef, status: 'ROLLED_BACK' as const });
}

export function selectPreferredPathway(pathways: readonly NeuralPathwayState[], domain: PathwayDomain): NeuralPathwayState | undefined {
  return [...pathways]
    .filter((pathway) => pathway.domain === domain && pathway.status === 'ACTIVE')
    .sort((a, b) => (b.evaluationScore + b.confidence) - (a.evaluationScore + a.confidence))[0];
}
