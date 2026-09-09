import type { ClaimKind, XacpEvidenceRef } from './types';

// The sentence an XIV agent is expected to be able to say. It is a constant so
// that every surface says it identically and tests can assert on it.
export const HUMAN_JUDGMENT_REQUIRED = 'Evidence is insufficient. Human judgment is required.';

// What a claim is worth when an agent stacks reasoning on top of it. A human
// fact outranks an agent inference; a prediction is nearly worthless on its own.
const CLAIM_WEIGHT: Record<ClaimKind, number> = {
  human_fact: 1,
  external_source: 0.7,
  historical_evidence: 0.6,
  agent_inference: 0.4,
  human_opinion: 0.35,
  prediction: 0.25,
  unknown: 0,
};

// Claim kinds that can carry a decision on their own. Anything else is context.
const GROUNDING_CLAIMS = new Set<ClaimKind>(['human_fact', 'external_source', 'historical_evidence']);

export const DEFAULT_EVIDENCE_THRESHOLD = 0.6;

export type EvidenceAssessment = {
  sufficient: boolean;
  humanJudgmentRequired: boolean;
  statement: string;
  weightedConfidence: number;
  groundingClaims: number;
  unknownClaims: string[];
  claimBreakdown: Record<ClaimKind, number>;
};

export function claimWeight(kind: ClaimKind) {
  return CLAIM_WEIGHT[kind];
}

export function assessEvidence(
  evidence: readonly XacpEvidenceRef[],
  options?: { threshold?: number; requireGrounding?: boolean },
): EvidenceAssessment {
  const threshold = options?.threshold ?? DEFAULT_EVIDENCE_THRESHOLD;
  const requireGrounding = options?.requireGrounding ?? true;

  const claimBreakdown = Object.keys(CLAIM_WEIGHT).reduce((acc, key) => {
    acc[key as ClaimKind] = 0;
    return acc;
  }, {} as Record<ClaimKind, number>);

  let weightSum = 0;
  let weightedTotal = 0;
  let groundingClaims = 0;
  const unknownClaims: string[] = [];

  for (const item of evidence) {
    claimBreakdown[item.claimKind] += 1;
    const weight = CLAIM_WEIGHT[item.claimKind];
    weightSum += weight;
    weightedTotal += weight * clampConfidence(item.confidence);
    if (GROUNDING_CLAIMS.has(item.claimKind)) groundingClaims += 1;
    if (item.claimKind === 'unknown') unknownClaims.push(item.label);
  }

  const weightedConfidence = weightSum > 0 ? weightedTotal / weightSum : 0;
  const grounded = requireGrounding ? groundingClaims > 0 : true;
  const sufficient = evidence.length > 0 && grounded && weightedConfidence >= threshold;

  return {
    sufficient,
    humanJudgmentRequired: !sufficient,
    statement: sufficient
      ? `Evidence is sufficient at ${weightedConfidence.toFixed(2)} weighted confidence.`
      : HUMAN_JUDGMENT_REQUIRED,
    weightedConfidence,
    groundingClaims,
    unknownClaims,
    claimBreakdown,
  };
}

function clampConfidence(value: number) {
  if (!Number.isFinite(value)) return 0;
  if (value < 0) return 0;
  if (value > 1) return 1;
  return value;
}

export function evidenceRef(input: {
  label: string;
  claimKind: ClaimKind;
  confidence: number;
  knowledgeSourceId?: string | null;
}): XacpEvidenceRef {
  return {
    label: input.label,
    claimKind: input.claimKind,
    confidence: clampConfidence(input.confidence),
    knowledgeSourceId: input.knowledgeSourceId ?? null,
  };
}
