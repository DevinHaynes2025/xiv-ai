export type KnowledgeDomain = 'HISTORY' | 'CULTURE' | 'SCIENCE' | 'ART' | 'LANGUAGE' | 'BELIEF' | 'BIOGRAPHY';

export interface HumanityKnowledgeNode {
  id: string;
  domain: KnowledgeDomain;
  subject: string;
  sourceRefs: string[];
  communityContext?: string;
  confidence: number;
  classification: 'PUBLIC' | 'INTERNAL';
  claimType: 'DOCUMENTED' | 'TRADITION' | 'BELIEF' | 'HYPOTHESIS';
}

export function isSourceBacked(node: HumanityKnowledgeNode): boolean {
  return node.sourceRefs.length > 0 && node.confidence >= 0.6;
}

export const humanityGenomePolicy = {
  biologicalOwnershipClaim: false,
  soulCaptureClaim: false,
  literalDivineOrExtraterrestrialClaimWithoutEvidence: false,
  respectfulPluralContextRequired: true,
  historicalProfilesMustBeSourceBacked: true,
};
