/**
 * 62L-EX10 — Contradiction records for conflicting comparison claims.
 */

import type { ContradictionRecord } from './types.ts';

const store: ContradictionRecord[] = [];

function nowIso(): string {
  return new Date().toISOString();
}

export function createContradictionRecord(input: {
  contradictionId: string;
  comparisonId: string;
  kind: string;
  leftClaim: string;
  rightClaim: string;
  reasons: string[];
}): ContradictionRecord {
  const record: ContradictionRecord = {
    contradictionId: input.contradictionId,
    comparisonId: input.comparisonId,
    kind: input.kind,
    leftClaim: input.leftClaim,
    rightClaim: input.rightClaim,
    reasons: [...input.reasons],
    createdAt: nowIso(),
  };
  store.push(record);
  return record;
}

export function listContradictionRecords(
  comparisonId?: string,
): ContradictionRecord[] {
  if (!comparisonId) return [...store];
  return store.filter((r) => r.comparisonId === comparisonId);
}

export function clearContradictionStoreForTests(): void {
  store.length = 0;
}

/**
 * Detect contradictions between a prior winner claim and a new gate outcome.
 */
export function detectAndRecordContradiction(input: {
  contradictionId: string;
  comparisonId: string;
  priorClaim: string;
  newClaim: string;
}): ContradictionRecord | null {
  if (input.priorClaim === input.newClaim) return null;
  if (
    (input.priorClaim === 'CANDIDATE_BETTER' &&
      input.newClaim === 'BASELINE_BETTER') ||
    (input.priorClaim === 'BASELINE_BETTER' &&
      input.newClaim === 'CANDIDATE_BETTER') ||
    (input.priorClaim.includes('BETTER') &&
      input.newClaim === 'NOT_COMPARABLE') ||
    (input.priorClaim === 'COMPARABLE' &&
      input.newClaim === 'NOT_COMPARABLE')
  ) {
    return createContradictionRecord({
      contradictionId: input.contradictionId,
      comparisonId: input.comparisonId,
      kind: 'WINNER_OR_COMPARABILITY_CONFLICT',
      leftClaim: input.priorClaim,
      rightClaim: input.newClaim,
      reasons: ['CONTRADICTORY_COMPARISON_CLAIMS'],
    });
  }
  return createContradictionRecord({
    contradictionId: input.contradictionId,
    comparisonId: input.comparisonId,
    kind: 'CLAIM_DIVERGENCE',
    leftClaim: input.priorClaim,
    rightClaim: input.newClaim,
    reasons: ['DIVERGENT_CLAIMS_RECORDED'],
  });
}
