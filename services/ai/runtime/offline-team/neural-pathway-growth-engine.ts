export type PathwayStatus = 'CANDIDATE' | 'APPROVED' | 'ACTIVE' | 'DEGRADED' | 'ROLLED_BACK';
export type PathwayDomain = 'GENERAL' | 'CODE' | 'ARCHITECTURE' | 'SECURITY' | 'MEMORY' | 'OPERATIONS';
export interface NeuralPathwayCandidate {
  pathwayId: string; tenantId: string; domain: PathwayDomain; version: number;
  parentPathwayId?: string; confidence: number; evaluationScore: number;
  evidenceRefs: readonly string[]; reviewRefs: readonly string[]; humanApproved: boolean;
  rollbackRef?: string; modelWeightMutation: false; productionMutation: false;
}
export interface NeuralPathwayState extends NeuralPathwayCandidate {
  status: PathwayStatus; activatedAt?: string; supersedes?: string;
}
export const NEURAL_PATHWAY_GROWTH_GUARDRAILS = {
  minimumEvaluationScore: 0.92, minimumConfidence: 0.75, minimumIndependentReviews: 2,
  maxActivePathwaysPerDomain: 32, modelWeightMutationAllowed: false,
  autonomousProductionRewriteAllowed: false, humanApprovalRequired: true, rollbackRequiredForActivation: true,
} as const;
const nonblank = (v: unknown): v is string => typeof v === 'string' && v.trim().length > 0;
const unitScore = (v: number): boolean => Number.isFinite(v) && v >= 0 && v <= 1;
const refs = (v: readonly string[]): boolean => Array.isArray(v) && v.length > 0 && v.every(nonblank);
export function evaluatePathwayCandidate(candidate: NeuralPathwayCandidate): { eligible: boolean; reasons: readonly string[] } {
  const reasons: string[] = [];
  if (![candidate.pathwayId, candidate.tenantId].every(nonblank)) reasons.push('pathway identity required');
  if (!['GENERAL', 'CODE', 'ARCHITECTURE', 'SECURITY', 'MEMORY', 'OPERATIONS'].includes(candidate.domain)) reasons.push('unknown domain');
  if (!Number.isSafeInteger(candidate.version) || candidate.version < 1) reasons.push('version must be >= 1');
  if (!unitScore(candidate.evaluationScore) || candidate.evaluationScore < NEURAL_PATHWAY_GROWTH_GUARDRAILS.minimumEvaluationScore) reasons.push('evaluation must be finite, in [0,1], and above threshold');
  if (!unitScore(candidate.confidence) || candidate.confidence < NEURAL_PATHWAY_GROWTH_GUARDRAILS.minimumConfidence) reasons.push('confidence must be finite, in [0,1], and above threshold');
  if (!refs(candidate.evidenceRefs)) reasons.push('evidence required');
  if (!refs(candidate.reviewRefs) || new Set(candidate.reviewRefs.map(r => r.trim())).size < NEURAL_PATHWAY_GROWTH_GUARDRAILS.minimumIndependentReviews) reasons.push('distinct nonempty reviews required');
  if (candidate.humanApproved !== true) reasons.push('human approval required');
  if (!nonblank(candidate.rollbackRef)) reasons.push('rollback reference required');
  if (candidate.modelWeightMutation !== false) reasons.push('model weight mutation forbidden');
  if (candidate.productionMutation !== false) reasons.push('production mutation forbidden');
  return Object.freeze({ eligible: reasons.length === 0, reasons: Object.freeze(reasons) });
}
export function activatePathway(candidate: NeuralPathwayCandidate, activatedAt: string): NeuralPathwayState {
  const evaluation = evaluatePathwayCandidate(candidate);
  if (!evaluation.eligible) throw new Error(`pathway not eligible: ${evaluation.reasons.join(', ')}`);
  if (!Number.isFinite(Date.parse(activatedAt))) throw new Error('valid activatedAt required');
  return Object.freeze({ ...candidate, evidenceRefs: Object.freeze([...candidate.evidenceRefs]), reviewRefs: Object.freeze([...candidate.reviewRefs]), status: 'ACTIVE' as const, activatedAt, supersedes: candidate.parentPathwayId });
}
export function applyConfidenceDecay(pathway: NeuralPathwayState, decay: number): NeuralPathwayState {
  if (!unitScore(decay) || !unitScore(pathway.confidence)) throw new Error('confidence and decay must be finite and between 0 and 1');
  const confidence = Math.max(0, pathway.confidence * (1 - decay));
  const status: PathwayStatus = pathway.status === 'ROLLED_BACK' ? 'ROLLED_BACK' : confidence < NEURAL_PATHWAY_GROWTH_GUARDRAILS.minimumConfidence ? 'DEGRADED' : pathway.status;
  return Object.freeze({ ...pathway, confidence, status });
}
export function rollbackPathway(pathway: NeuralPathwayState, rollbackRef: string): NeuralPathwayState {
  if (!nonblank(rollbackRef)) throw new Error('rollbackRef required');
  return Object.freeze({ ...pathway, rollbackRef, status: 'ROLLED_BACK' as const });
}
export function selectPreferredPathway(pathways: readonly NeuralPathwayState[], domain: PathwayDomain, tenantId?: string): NeuralPathwayState | undefined {
  const tenants = new Set(pathways.map(p => p.tenantId));
  if (tenantId === undefined && tenants.size > 1) throw new Error('tenantId required for mixed-tenant pathway selection');
  return [...pathways].filter(p => p.domain === domain && p.status === 'ACTIVE' && (tenantId === undefined || p.tenantId === tenantId) && evaluatePathwayCandidate(p).eligible)
    .sort((a, b) => (b.evaluationScore + b.confidence) - (a.evaluationScore + a.confidence))[0];
}
