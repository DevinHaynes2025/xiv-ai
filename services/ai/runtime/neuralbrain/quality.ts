/**
 * Knowledge quality promotions — AI agreement ≠ VERIFIED; evidence promotes.
 */

import type { KnowledgeQualityState } from './types';
import type { KnowledgeNode } from './brain';

export type QualityPromotionRequest = {
  node: KnowledgeNode;
  agentAgreementCount: number;
  evidenceCount: number;
  humanVerified: boolean;
  contradicted: boolean;
  stale: boolean;
  retracted: boolean;
};

export type QualityPromotionResult = {
  from: KnowledgeQualityState;
  to: KnowledgeQualityState;
  reason: string;
};

export function aiAgreementEqualsVerified(): false {
  return false;
}

export function evidencePromotesQuality(): true {
  return true;
}

export function promoteKnowledgeQuality(req: QualityPromotionRequest): QualityPromotionResult {
  const from = req.node.quality;
  if (req.retracted) {
    return { from, to: 'RETRACTED', reason: 'retracted' };
  }
  if (req.stale) {
    return { from, to: 'STALE', reason: 'stale' };
  }
  if (req.contradicted) {
    return { from, to: 'CONTRADICTED', reason: 'contradiction_detected' };
  }
  // Multiple AI agents agreeing ≠ VERIFIED
  if (req.agentAgreementCount >= 2 && req.evidenceCount === 0 && !req.humanVerified) {
    return { from, to: 'UNVERIFIED', reason: 'ai_agreement_is_not_verification' };
  }
  if (req.humanVerified && req.evidenceCount > 0) {
    return { from, to: 'VERIFIED', reason: 'human_verified_with_evidence' };
  }
  if (req.evidenceCount > 0 && from === 'OBSERVED') {
    return { from, to: 'SUPPORTED', reason: 'evidence_supports_claim' };
  }
  if (req.evidenceCount > 0 && from === 'UNVERIFIED') {
    return { from, to: 'SUPPORTED', reason: 'evidence_supports_claim' };
  }
  if (req.evidenceCount === 0 && (from === 'OBSERVED' || from === 'UNVERIFIED')) {
    return { from, to: 'REVIEW_REQUIRED', reason: 'insufficient_evidence' };
  }
  return { from, to: from, reason: 'no_quality_change' };
}

export function markObserved(node: KnowledgeNode): KnowledgeNode {
  return { ...node, quality: 'OBSERVED' };
}

export function markUnverified(node: KnowledgeNode): KnowledgeNode {
  return { ...node, quality: 'UNVERIFIED' };
}
