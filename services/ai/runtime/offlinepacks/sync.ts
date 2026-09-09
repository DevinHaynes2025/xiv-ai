/**
 * 62L-EX14 — Delta updates + revocation-first sync.
 * REVOKED excluded from retrieval; audit history kept.
 */

import { nowIso, type OfflineResearchPack } from './types.ts';
import { bumpPackVersion, markPackStale, type PackBuildStore } from './pack-builder.ts';
import { excludeRevokedFromIndex, type IndexStore } from './indexer.ts';

export type SyncAuditEntry = {
  at: string;
  kind: 'DELTA' | 'REVOKE' | 'STALE' | 'REBUILD';
  packId: string;
  detail: string;
};

export type SyncStore = {
  auditHistory: SyncAuditEntry[];
};

export function createSyncStore(): SyncStore {
  return { auditHistory: [] };
}

/** Revocation-first: apply revocations before any delta merge. */
export function revokeSourceFromPack(input: {
  buildStore: PackBuildStore;
  indexStore: IndexStore;
  syncStore: SyncStore;
  packId: string;
  sourceId: string;
}): OfflineResearchPack | null {
  const pack = input.buildStore.packs.get(input.packId);
  if (!pack) return null;

  const revokedSourceIds = Array.from(new Set([...pack.revokedSourceIds, input.sourceId]));
  const records = input.buildStore.records.get(input.packId) ?? [];
  excludeRevokedFromIndex(input.indexStore, input.packId, revokedSourceIds, records);

  const next: OfflineResearchPack = {
    ...pack,
    revokedSourceIds,
    updatedAt: nowIso(),
  };
  input.buildStore.packs.set(input.packId, next);
  input.buildStore.audit.push(`AUDIT: revoked source ${input.sourceId} from pack ${input.packId}`);
  input.syncStore.auditHistory.push({
    at: nowIso(),
    kind: 'REVOKE',
    packId: input.packId,
    detail: `source ${input.sourceId} REVOKED — excluded from retrieval; history retained`,
  });
  return next;
}

export function revokeEntirePack(input: {
  buildStore: PackBuildStore;
  syncStore: SyncStore;
  packId: string;
  reason: string;
}): OfflineResearchPack | null {
  const pack = input.buildStore.packs.get(input.packId);
  if (!pack) return null;
  const next: OfflineResearchPack = {
    ...pack,
    status: 'REVOKED',
    buildState: 'REVOKED',
    freshnessState: 'REVOKED',
    verificationState: 'FAILED',
    encryptionState: 'REVOKED_WIPED',
    updatedAt: nowIso(),
  };
  input.buildStore.packs.set(input.packId, next);
  input.syncStore.auditHistory.push({
    at: nowIso(),
    kind: 'REVOKE',
    packId: input.packId,
    detail: input.reason,
  });
  return next;
}

/** When online later — delta update creates new pack version (no silent overwrite of truth). */
export function applyDeltaUpdate(input: {
  buildStore: PackBuildStore;
  syncStore: SyncStore;
  packId: string;
  reason: string;
}): OfflineResearchPack | null {
  const next = bumpPackVersion(input.buildStore, input.packId, input.reason);
  if (!next) return null;
  input.syncStore.auditHistory.push({
    at: nowIso(),
    kind: 'DELTA',
    packId: input.packId,
    detail: `delta → version ${next.packVersion}`,
  });
  return next;
}

export function markStaleOnSkew(input: {
  buildStore: PackBuildStore;
  syncStore: SyncStore;
  packId: string;
}): OfflineResearchPack | null {
  const next = markPackStale(input.buildStore, input.packId);
  if (!next) return null;
  input.syncStore.auditHistory.push({
    at: nowIso(),
    kind: 'STALE',
    packId: input.packId,
    detail: 'pack freshness skew → PACK_STALE',
  });
  return next;
}
