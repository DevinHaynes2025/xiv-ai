/**
 * Evidence handling for the Hardware Truth Matrix / path graph.
 * Stale evidence invalidates VERIFIED → STALE / REVALIDATION_REQUIRED.
 */

import { HC3_LOCKS, type HardwareTruthState, type TenantScope } from './types.ts';
import type { HardwareMatrixEntry, HardwareTruthMatrix } from './registry.ts';

export type EvidenceRecord = {
  evidenceId: string;
  matrixEntryId: string;
  kind:
    | 'documentation'
    | 'detection'
    | 'runtime_support'
    | 'bounded_inference'
    | 'benchmark'
    | 'heartbeat'
    | 'revocation';
  fresh: boolean;
  staleAfterMs: number;
  recordedAt: string;
  scope: TenantScope;
  notes: string;
};

export type EvidenceStore = {
  records: Map<string, EvidenceRecord>;
};

export function createEvidenceStore(): EvidenceStore {
  return { records: new Map() };
}

export function recordEvidence(
  store: EvidenceStore,
  record: EvidenceRecord,
): EvidenceRecord {
  store.records.set(record.evidenceId, record);
  return record;
}

export function isEvidenceStale(
  record: EvidenceRecord,
  nowMs: number = Date.now(),
): boolean {
  if (!record.fresh) return true;
  const recorded = Date.parse(record.recordedAt);
  if (Number.isNaN(recorded)) return true;
  return nowMs - recorded > record.staleAfterMs;
}

export type StaleDemotionResult = {
  entryId: string;
  previousState: HardwareTruthState;
  nextState: HardwareTruthState;
  demoted: boolean;
  reason: string;
  entry: HardwareMatrixEntry | null;
};

/**
 * Stale evidence demotes/blocks VERIFIED claims.
 * VERIFIED → STALE (and REVALIDATION_REQUIRED marker via honesty state).
 */
export function applyStaleEvidenceDemotion(input: {
  matrix: HardwareTruthMatrix;
  entryId: string;
  scope: TenantScope;
  evidence: EvidenceRecord;
  nowMs?: number;
}): StaleDemotionResult {
  const entry = input.matrix.get(input.entryId, input.scope);
  if (!entry) {
    return {
      entryId: input.entryId,
      previousState: 'UNAVAILABLE',
      nextState: 'UNAVAILABLE',
      demoted: false,
      reason: 'ENTRY_NOT_FOUND_OR_CROSS_TENANT',
      entry: null,
    };
  }

  const stale = isEvidenceStale(input.evidence, input.nowMs);
  if (!stale) {
    return {
      entryId: entry.entryId,
      previousState: entry.truthState,
      nextState: entry.truthState,
      demoted: false,
      reason: 'EVIDENCE_FRESH',
      entry,
    };
  }

  if (HC3_LOCKS.STALE_EVIDENCE_KEEPS_VERIFIED) {
    return {
      entryId: entry.entryId,
      previousState: entry.truthState,
      nextState: entry.truthState,
      demoted: false,
      reason: 'LOCK_VIOLATION_STALE_KEEPS_VERIFIED_MUST_BE_FALSE',
      entry,
    };
  }

  if (entry.truthState === 'VERIFIED') {
    const demoted = input.matrix.markHonestyState(
      entry.entryId,
      input.scope,
      'STALE',
    );
    // Second marker for ops: revalidation required after stale VERIFIED.
    const withReval = demoted
      ? input.matrix.markHonestyState(
          entry.entryId,
          input.scope,
          'REVALIDATION_REQUIRED',
        )
      : null;
    return {
      entryId: entry.entryId,
      previousState: 'VERIFIED',
      nextState: withReval?.truthState ?? 'STALE',
      demoted: true,
      reason: 'STALE_EVIDENCE_INVALIDATES_VERIFIED',
      entry: withReval,
    };
  }

  const marked = input.matrix.markHonestyState(
    entry.entryId,
    input.scope,
    'STALE',
  );
  return {
    entryId: entry.entryId,
    previousState: entry.truthState,
    nextState: marked?.truthState ?? 'STALE',
    demoted: entry.truthState !== 'STALE',
    reason: 'STALE_EVIDENCE_MARKED',
    entry: marked,
  };
}

/**
 * Block a VERIFIED claim when backing evidence is already stale.
 */
export function blockVerifiedIfEvidenceStale(input: {
  currentState: HardwareTruthState;
  evidence: EvidenceRecord;
  nowMs?: number;
}): { allowed: boolean; reason: string; requiredState?: HardwareTruthState } {
  if (isEvidenceStale(input.evidence, input.nowMs)) {
    return {
      allowed: false,
      reason: 'STALE_EVIDENCE_BLOCKS_VERIFIED_CLAIM',
      requiredState: 'REVALIDATION_REQUIRED',
    };
  }
  if (input.currentState === 'STALE' || input.currentState === 'REVALIDATION_REQUIRED') {
    return {
      allowed: false,
      reason: 'ENTRY_ALREADY_STALE_OR_REVALIDATION_REQUIRED',
      requiredState: 'REVALIDATION_REQUIRED',
    };
  }
  return { allowed: true, reason: 'EVIDENCE_FRESH' };
}
