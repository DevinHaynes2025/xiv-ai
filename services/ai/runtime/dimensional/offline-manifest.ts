/**
 * Checksummed offline shard manifests + reconciliation protocol stub.
 * Honesty: CONFLICT | WAITING_SYNC | IN_SYNC — never silent overwrite.
 */
import { isomorphicContentHash } from './datagene';
import type { MemoryHeatTier } from './database-city';
import type { PocketMetaRow } from './sqlite-shard-fixture';
import { UNIVERSE_KERNEL_GUARDRAILS } from './universe-ethics';

export type ManifestProvenance = {
  source: string;
  capturedAt: string;
  operator?: string;
};

export type OfflineShardManifest = {
  manifestId: string;
  shardId: string;
  tenantId: string;
  contentHash: string;
  provenance: ManifestProvenance;
  heatTier: MemoryHeatTier;
  residency: string;
  entityIds: readonly string[];
  productionMutation: false;
};

export type ManifestReconcileStatus = 'IN_SYNC' | 'CONFLICT' | 'WAITING_SYNC';

export type ManifestReconcileResult = {
  status: ManifestReconcileStatus;
  localHash: string;
  expectedHash: string | null;
  notes: string;
  productionMutation: false;
};

export function buildOfflineManifest(input: {
  manifestId: string;
  shardId: string;
  tenantId: string;
  rows: readonly PocketMetaRow[];
  heatTier: MemoryHeatTier;
  residency: string;
  provenance: ManifestProvenance;
}): OfflineShardManifest {
  if (UNIVERSE_KERNEL_GUARDRAILS.autonomousProductionDML) {
    throw new Error('autonomousProductionDML must remain false');
  }
  if (!input.manifestId || !input.shardId || !input.tenantId) {
    throw new TypeError('manifestId, shardId, and tenantId are required');
  }
  const entityIds = Object.freeze(input.rows.map((r) => r.entityId).sort());
  const contentHash = isomorphicContentHash(
    JSON.stringify({
      shardId: input.shardId,
      tenantId: input.tenantId,
      heatTier: input.heatTier,
      residency: input.residency,
      entities: input.rows
        .map((r) => ({ id: r.entityId, hash: r.contentHash, heat: r.heatTier }))
        .sort((a, b) => a.id.localeCompare(b.id)),
    }),
  );
  return {
    manifestId: input.manifestId,
    shardId: input.shardId,
    tenantId: input.tenantId,
    contentHash,
    provenance: input.provenance,
    heatTier: input.heatTier,
    residency: input.residency,
    entityIds,
    productionMutation: false,
  };
}

/**
 * Compare local manifest vs company/regional expected.
 * Missing expected → WAITING_SYNC; hash mismatch → CONFLICT; match → IN_SYNC.
 */
export function reconcileOfflineManifest(
  local: OfflineShardManifest,
  expected: OfflineShardManifest | null,
): ManifestReconcileResult {
  if (!expected) {
    return {
      status: 'WAITING_SYNC',
      localHash: local.contentHash,
      expectedHash: null,
      notes: 'company/regional expected manifest unavailable — WAITING_SYNC honesty',
      productionMutation: false,
    };
  }
  if (local.tenantId !== expected.tenantId) {
    return {
      status: 'CONFLICT',
      localHash: local.contentHash,
      expectedHash: expected.contentHash,
      notes: 'cross-tenant manifest compare blocked — CONFLICT',
      productionMutation: false,
    };
  }
  if (local.contentHash === expected.contentHash) {
    return {
      status: 'IN_SYNC',
      localHash: local.contentHash,
      expectedHash: expected.contentHash,
      notes: 'local matches expected checksum',
      productionMutation: false,
    };
  }
  return {
    status: 'CONFLICT',
    localHash: local.contentHash,
    expectedHash: expected.contentHash,
    notes: 'checksum divergence — MANUAL reconcile required; stub only',
    productionMutation: false,
  };
}
