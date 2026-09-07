/**
 * Multi-agent research + verification fabric foundations.
 * Contradiction Agent tries to disprove other agents. Inference cannot become fact automatically.
 */
export const RESEARCH_AGENT_ROLES = [
  'Discovery',
  'Filings',
  'Financial Analysis',
  'Risk',
  'Market',
  'Macro',
  'News/Event',
  'Industry',
  'Startup',
  'Verification',
  'Contradiction',
  'Provenance',
  'Story',
  'Opportunity',
  'Translation',
] as const;
export type ResearchAgentRole = (typeof RESEARCH_AGENT_ROLES)[number];

export type ResearchClaimStatus =
  | 'SUPPORTED'
  | 'PARTIALLY_SUPPORTED'
  | 'CONTRADICTED'
  | 'INSUFFICIENT_EVIDENCE'
  | 'STALE'
  | 'UNVERIFIED';

export type ResearchStance = 'FACT' | 'INFERENCE' | 'FORECAST' | 'OPINION' | 'RESEARCH';

export type ResearchEvidence = {
  evidenceId: string;
  sourceId: string;
  retrievedAt: string;
  summary: string;
};

export type ResearchClaim = {
  claimId: string;
  subject: string;
  period: string | null;
  stance: ResearchStance;
  value: string;
  status: ResearchClaimStatus;
  evidence: readonly ResearchEvidence[];
};

export type ResearchTask = { taskId: string; role: ResearchAgentRole; subject: string };
export type ResearchChallenge = { claimId: string; reason: string };
export type ResearchContradiction = { status: ResearchClaimStatus; reason: string; claimIds: readonly string[] };
export type ResearchConsensus = { reached: boolean; reason: string };
export type ResearchFinding = { findingId: string; summary: string; stance: ResearchStance };
export type ResearchPacket = { packetId: string; claims: readonly ResearchClaim[]; contradictions: readonly ResearchContradiction[] };
export type ResearchDecisionBoundary = { automaticFactPromotion: false; humanRequired: true };

export type VerificationPacket = ResearchPacket;
export type VerificationClaim = ResearchClaim;
export type VerificationEvidence = ResearchEvidence;
export type VerificationSource = { sourceId: string; authority: 'primary' | 'secondary' | 'unknown' };
export type VerificationConflict = ResearchContradiction;
export type VerificationScore = { value: number; explanation: string; certainty: false; universalTruth: false };
export type VerificationStatus = ResearchClaimStatus;
export type VerificationReason = string;

export function contradictionAgentChallenge(a: ResearchClaim, b: ResearchClaim): ResearchContradiction {
  if (a.subject === b.subject && a.period && b.period && a.period !== b.period && a.value !== b.value) {
    return { status: 'STALE', reason: 'Reporting periods do not match. Period mismatch is not silently reconciled.', claimIds: [a.claimId, b.claimId] };
  }
  if (a.subject === b.subject && a.stance === 'FACT' && b.stance === 'FACT' && a.value !== b.value) {
    return { status: 'CONTRADICTED', reason: 'Conflicting factual claims. Contradiction Agent refuses the exciting narrative.', claimIds: [a.claimId, b.claimId] };
  }
  if (a.stance === 'FORECAST' && b.stance === 'FACT') {
    return { status: 'UNVERIFIED', reason: 'Forecast/fact confusion. Forecast remains separate from fact.', claimIds: [a.claimId, b.claimId] };
  }
  if (a.evidence.length === 0 || b.evidence.length === 0) {
    return { status: 'INSUFFICIENT_EVIDENCE', reason: 'At least one claim lacks evidence.', claimIds: [a.claimId, b.claimId] };
  }
  return { status: 'PARTIALLY_SUPPORTED', reason: 'No hard contradiction detected. Consensus is not automatic.', claimIds: [a.claimId, b.claimId] };
}

export function promoteClaimToVerified(claim: ResearchClaim) {
  if (claim.status === 'UNVERIFIED' || claim.status === 'INSUFFICIENT_EVIDENCE' || claim.status === 'CONTRADICTED') {
    return { allowed: false as const, reason: 'Unverified claims cannot become verified facts automatically.' };
  }
  if (claim.stance !== 'FACT' || claim.evidence.length === 0) {
    return { allowed: false as const, reason: 'Inference/forecast cannot be promoted to a verified fact.' };
  }
  if (claim.status !== 'SUPPORTED') {
    return { allowed: false as const, reason: 'Only independently supported facts may be labeled verified.' };
  }
  return { allowed: true as const, status: 'SUPPORTED' as const };
}

export function forecastRemainsSeparateFromFact(stance: ResearchStance) {
  return stance !== 'FACT';
}

export function verifiedIntelligenceRequiresProvenance(input: { sourceId?: string | null; status: ResearchClaimStatus }) {
  if (input.status === 'SUPPORTED' && !input.sourceId) {
    return { allowed: false as const, reason: 'Provenance is required for verified intelligence.' };
  }
  return { allowed: true as const };
}

export function explainableVerificationScore(input: { agreement: number; freshness: number; provenanceComplete: boolean }) {
  const value = Math.min(100, Math.max(0, Math.round(input.agreement * 0.6 + input.freshness * 0.4)));
  return {
    value,
    explanation: `Explainable composite of agreement and freshness. Provenance complete=${input.provenanceComplete}. Not certainty.`,
    certainty: false as const,
    universalTruth: false as const,
  };
}

export function researchDecisionBoundary(): ResearchDecisionBoundary {
  return { automaticFactPromotion: false, humanRequired: true };
}
