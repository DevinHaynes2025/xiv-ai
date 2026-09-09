/**
 * XIV Network. Professional business networking — not a LinkedIn clone.
 * Recommendations require reasons/evidence. No sensitive-trait inference.
 */
export type ProfessionalProfile = {
  professionalId: string;
  legalName: string;
  title: string | null;
  organizationId: string | null;
};

export type CompanyProfile = {
  organizationId: string;
  legalName: string;
  industry: string | null;
};

export type ProfessionalConnection = {
  connectionId: string;
  fromId: string;
  toId: string;
  state: 'requested' | 'accepted' | 'declined';
};

export type ConnectionRequest = { requestId: string; fromId: string; toId: string };
export type BusinessIntroduction = { introductionId: string; introducerId: string; fromId: string; toId: string };
export type NetworkCircle = { circleId: string; name: string; organizationId: string | null };
export type IndustryCommunity = { communityId: string; industry: string; name: string };
export type ProfessionalInterest = { interestId: string; label: string; declared: true };
export type BusinessOpportunity = { opportunityId: string; title: string; evidenceId: string | null };
export type CollaborationRequest = { requestId: string; fromId: string; toOrganizationId: string };
export type NetworkingEvidence = { evidenceId: string; reason: string; sourceId: string | null };
export type NetworkingRecommendation = {
  recommendationId: string;
  subjectId: string;
  evidence: readonly NetworkingEvidence[];
  sensitiveTraitInferred: false;
};

export function createNetworkingRecommendation(input: {
  recommendationId: string;
  subjectId: string;
  evidence: readonly NetworkingEvidence[];
}): NetworkingRecommendation | { allowed: false; reason: string } {
  if (input.evidence.length === 0) {
    return { allowed: false, reason: 'Networking recommendations must preserve reasons/evidence.' };
  }
  return {
    recommendationId: input.recommendationId,
    subjectId: input.subjectId,
    evidence: input.evidence,
    sensitiveTraitInferred: false,
  };
}

export function inferSensitiveTraitDenied() {
  return { allowed: false as const, reason: 'Do not infer sensitive personal traits for networking.' };
}
