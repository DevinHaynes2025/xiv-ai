/**
 * Offline-first sync journal + conflict reconciliation stubs for Database City.
 * Local-safe software contracts only ? no autonomous production DML.
 */

import type { BrainTier } from './database-city';
import { DATABASE_CITY_GUARDRAILS } from './database-city';

export type SyncOpKind = 'UPSERT' | 'DELETE' | 'PROMOTE_HEAT' | 'DEMOTE_HEAT' | 'LINK' | 'UNLINK';

export type SyncJournalEntry = {
  entryId: string;
  op: SyncOpKind;
  entityId: string;
  contentHash: string;
  sourceTier: BrainTier;
  targetTier: BrainTier;
  createdAt: string;
  applied: boolean;
  /** Offline-first: entries may be created while disconnected. */
  offlineOrigin: boolean;
};

export type ConflictStrategy = 'SOURCE_WINS' | 'TARGET_WINS' | 'MANUAL' | 'MERGE_STUB';

export type SyncConflict = {
  conflictId: string;
  entityId: string;
  localHash: string;
  remoteHash: string;
  strategy: ConflictStrategy;
  resolved: false;
  notes: string;
};

export type ReconciliationResult = {
  applied: SyncJournalEntry[];
  conflicts: SyncConflict[];
  productionMutation: false;
};

export function appendSyncEntry(input: {
  entryId: string;
  op: SyncOpKind;
  entityId: string;
  contentHash: string;
  sourceTier: BrainTier;
  targetTier: BrainTier;
  createdAt?: string;
  offlineOrigin?: boolean;
}): SyncJournalEntry {
  if (!input.entryId || !input.entityId || !input.contentHash) {
    throw new TypeError('entryId, entityId, and contentHash are required');
  }
  if (DATABASE_CITY_GUARDRAILS.autonomousProductionDML) {
    throw new Error('autonomousProductionDML must remain false');
  }
  return {
    entryId: input.entryId,
    op: input.op,
    entityId: input.entityId,
    contentHash: input.contentHash,
    sourceTier: input.sourceTier,
    targetTier: input.targetTier,
    createdAt: input.createdAt ?? new Date().toISOString(),
    applied: false,
    offlineOrigin: input.offlineOrigin ?? true,
  };
}

/**
 * Stub reconciler: matching hashes apply; divergent hashes become MANUAL conflicts.
 * Never mutates production ? returns productionMutation: false always.
 */
export function reconcileJournal(
  local: readonly SyncJournalEntry[],
  remote: readonly SyncJournalEntry[],
): ReconciliationResult {
  const remoteByEntity = new Map<string, SyncJournalEntry>();
  for (const entry of remote) remoteByEntity.set(entry.entityId, entry);

  const applied: SyncJournalEntry[] = [];
  const conflicts: SyncConflict[] = [];

  for (const entry of local) {
    const peer = remoteByEntity.get(entry.entityId);
    if (!peer) {
      applied.push({ ...entry, applied: true });
      continue;
    }
    if (peer.contentHash === entry.contentHash) {
      applied.push({ ...entry, applied: true });
      continue;
    }
    conflicts.push({
      conflictId: `conflict:${entry.entryId}:${peer.entryId}`,
      entityId: entry.entityId,
      localHash: entry.contentHash,
      remoteHash: peer.contentHash,
      strategy: 'MANUAL',
      resolved: false,
      notes: 'divergent offline edits ? human/curator reconciliation required; stub only',
    });
  }

  return { applied, conflicts, productionMutation: false };
}
