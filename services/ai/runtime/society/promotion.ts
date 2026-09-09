import type { KnowledgePromotionState } from './types';

export type KnowledgeEvidence = { source: string; retrievedAt: string; reference: string };
export type KnowledgeClaim = { text: string; state: KnowledgePromotionState };
export type KnowledgeContradiction = { visible: true };
export type KnowledgeReview = { humanRequired: boolean };
export type KnowledgeCandidate = {
  candidateId: string;
  claim: KnowledgeClaim;
  evidence: KnowledgeEvidence | null;
  agreementOnly: boolean;
};

export function promoteKnowledge(input: {
  text: string;
  evidence?: KnowledgeEvidence | null;
  aiAgreementOnly?: boolean;
}): KnowledgeCandidate | { allowed: false; reason: string; state: KnowledgePromotionState } {
  if (input.aiAgreementOnly) {
    return { allowed: false, reason: 'ai_agreement_cannot_produce_verified', state: 'REVIEW_REQUIRED' };
  }
  if (!input.evidence?.source || !input.evidence.retrievedAt || !input.evidence.reference) {
    return { allowed: false, reason: 'knowledge_promotion_requires_evidence', state: 'UNVERIFIED' };
  }
  return {
    candidateId: `know:${input.text}`,
    claim: { text: input.text, state: 'SUPPORTED' },
    evidence: input.evidence,
    agreementOnly: false,
  };
}
