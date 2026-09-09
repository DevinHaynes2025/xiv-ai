/**
 * 62L-EX11 — Evidence review board.
 * Structured rationale only — never persists chain-of-thought transcripts.
 */

import { createHash } from 'node:crypto';

import { hashReview } from './evidence-integrity.ts';
import type {
  EvidenceDenial,
  EvidenceReviewRecord,
  ReviewState,
} from './evidence-types.ts';

export type ReviewBoard = {
  submit(input: {
    evidenceId: string;
    tenantId: string;
    universeId: string;
    reviewerId: string;
    decision: EvidenceReviewRecord['decision'];
    rationaleSummary: string;
    cotTranscript?: string | null;
    createdAt?: string;
  }):
    | { ok: true; review: EvidenceReviewRecord; nextReviewState: ReviewState }
    | EvidenceDenial;
  list(scope: { tenantId: string; universeId: string }): readonly EvidenceReviewRecord[];
  forEvidence(
    evidenceId: string,
    scope: { tenantId: string; universeId: string },
  ): readonly EvidenceReviewRecord[];
};

function decisionToReviewState(
  decision: EvidenceReviewRecord['decision'],
): ReviewState {
  switch (decision) {
    case 'APPROVED':
      return 'APPROVED';
    case 'REJECTED':
      return 'REJECTED';
    case 'QUARANTINED':
      return 'QUARANTINED';
    case 'NEEDS_MORE_DATA':
      return 'IN_REVIEW';
  }
}

export function createEvidenceReviewBoard(): ReviewBoard {
  const byId = new Map<string, EvidenceReviewRecord>();

  return {
    submit(input) {
      if (input.cotTranscript !== undefined && input.cotTranscript !== null) {
        return {
          ok: false,
          denied: true,
          reason: 'HIDDEN_COT_PERSISTENCE_FORBIDDEN',
          disposition: 'DENIED',
        };
      }
      if (!input.rationaleSummary || input.rationaleSummary.trim().length === 0) {
        return {
          ok: false,
          denied: true,
          reason: 'REVIEW_RATIONALE_REQUIRED',
          disposition: 'DENIED',
        };
      }
      const createdAt = input.createdAt ?? new Date().toISOString();
      const reviewId = `rev-${createHash('sha256')
        .update([input.evidenceId, input.reviewerId, createdAt, input.decision].join('|'))
        .digest('hex')
        .slice(0, 20)}`;
      const integrityHash = hashReview({
        reviewId,
        evidenceId: input.evidenceId,
        tenantId: input.tenantId,
        universeId: input.universeId,
        reviewerId: input.reviewerId,
        decision: input.decision,
        rationaleSummary: input.rationaleSummary,
        createdAt,
      });
      const review: EvidenceReviewRecord = {
        reviewId,
        evidenceId: input.evidenceId,
        tenantId: input.tenantId,
        universeId: input.universeId,
        reviewerId: input.reviewerId,
        decision: input.decision,
        rationaleSummary: input.rationaleSummary,
        cotTranscript: null,
        createdAt,
        integrityHash,
      };
      byId.set(reviewId, review);
      return {
        ok: true,
        review,
        nextReviewState: decisionToReviewState(input.decision),
      };
    },
    list(scope) {
      return [...byId.values()].filter(
        (r) => r.tenantId === scope.tenantId && r.universeId === scope.universeId,
      );
    },
    forEvidence(evidenceId, scope) {
      return this.list(scope).filter((r) => r.evidenceId === evidenceId);
    },
  };
}
