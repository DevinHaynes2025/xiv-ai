/**
 * 12D-09 — Offline Command Center snapshot cache + sync-status honesty.
 * Consumes 12D-08 mobileReady / CommandCenterConsumerBundle payloads.
 * In-memory cache + optional disk fixture (string serialize/parse; isomorphic core).
 * Sync-status: FRESH | STALE | WAITING_SYNC | CONFLICT — never fabricate live cloud sync.
 *
 * Guardrails: readOnly; productionAutoApply false; Twin ethics; duty-cycle aware.
 * Atomic Data Cells = software knowledge records (not literal atom DBs).
 * Quantum entanglement = simulated pathway correlation only.
 */
import { isomorphicContentHash } from './datagene';
import { PRODUCTION_DIMENSIONAL_FABRIC_ENABLED } from './fabric';
import {
  assertEthicsSafeCopy,
  BUSINESS_BAR_METRICS,
  HIGH_AUTONOMY_TARGETS,
  UNIVERSES_ARE_SIMULATION_LAYERS_ONLY,
  VALUATION_THEATER_ALLOWED,
} from './universe-ethics';
import {
  FOUNDER_TWIN_MAX_DUTY_CYCLE,
  FOUNDER_TWIN_REPLICA_HARD_CAP,
} from './founder-twin-roster';
import type {
  CommandCenterConsumerBundle,
  MobileReadyConsumerPayload,
} from './architecture-reader-consumer';
import {
  ATOMIC_DATA_CELL_GUARDRAILS,
  buildAtomicDataCell,
  type AtomicDataCell,
} from './atomic-data-cell';

export const OFFLINE_SNAPSHOT_SCHEMA_VERSION = '12d09.1' as const;

/** Default freshness window (ms) before a local snapshot becomes STALE. */
export const DEFAULT_SNAPSHOT_FRESHNESS_MS = 15 * 60 * 1000;

export const OFFLINE_SNAPSHOT_GUARDRAILS = {
  readOnly: true as const,
  productionAutoApply: false as const,
  productionAutoMerge: false as const,
  productionAutoDeploy: false as const,
  destructiveDbAutoApply: false as const,
  crossTenantDataCopyAllowed: false as const,
  L4_PRODUCTION_ENABLED: false as const,
  PRODUCTION_DIMENSIONAL_FABRIC_ENABLED,
  /** Never claim live cloud sync succeeded from offline cache alone. */
  liveCloudSyncFabricationAllowed: false as const,
  cloudAgentsDefaultWaitingIfUnbound: true as const,
  VALUATION_THEATER_ALLOWED,
  UNIVERSES_ARE_SIMULATION_LAYERS_ONLY,
  bioCloningAllowed: false as const,
  alwaysOnInfiniteClonesAllowed: false as const,
  wormholesAreSparseSimulationPathwaysOnly: true as const,
  quantumEntanglementIsSimulatedCorrelationOnly: true as const,
  atomDbClaimAllowed: false as const,
  /** ChatGPT / Twin checkpoint = read/review only — never Policy Gate bypass. */
  checkpointIsReadReviewOnly: true as const,
  policyGateBypassAllowed: false as const,
  /** High-autonomy surfaces only. */
  highAutonomyTargets: HIGH_AUTONOMY_TARGETS,
  businessBarMetrics: BUSINESS_BAR_METRICS,
  replicaHardCap: FOUNDER_TWIN_REPLICA_HARD_CAP,
  maxDutyCycle: FOUNDER_TWIN_MAX_DUTY_CYCLE,
  nextTicket: '12D-10' as const,
} as const;

export type OfflineSyncStatus = 'FRESH' | 'STALE' | 'WAITING_SYNC' | 'CONFLICT';

export type SnapshotProvenance = {
  source: string;
  capturedAt: string;
  operator?: string;
  consumerTitle?: string;
};

export type OfflineCommandCenterSnapshot = {
  snapshotId: string;
  tenantId: string;
  schemaVersion: typeof OFFLINE_SNAPSHOT_SCHEMA_VERSION;
  contentChecksum: string;
  provenance: SnapshotProvenance;
  mobileReady: MobileReadyConsumerPayload;
  /** Duty-cycle summary from mobileReady when present. */
  dutyCycleAware: boolean;
  syncStatus: OfflineSyncStatus;
  /** Honesty: offline cache never asserts live cloud sync. */
  liveCloudSyncClaimed: false;
  expectedRemoteChecksum: string | null;
  freshnessWindowMs: number;
  ageMs: number;
  readOnly: true;
  productionAutoApply: false;
  layerKind: 'SIMULATION';
  ethicsNotice: string;
  /** Optional Atomic Data Cell wrapping the snapshot body (software record). */
  atomicCell: AtomicDataCell | null;
  guardrails: typeof OFFLINE_SNAPSHOT_GUARDRAILS;
};

export type SyncStatusEvaluation = {
  status: OfflineSyncStatus;
  notes: string;
  localChecksum: string;
  expectedRemoteChecksum: string | null;
  ageMs: number;
  liveCloudSyncClaimed: false;
  productionMutation: false;
};

function assertOfflineGuardrails(): void {
  if (!OFFLINE_SNAPSHOT_GUARDRAILS.readOnly) {
    throw new Error('readOnly must remain true');
  }
  if (OFFLINE_SNAPSHOT_GUARDRAILS.productionAutoApply) {
    throw new Error('productionAutoApply must remain false');
  }
  if (OFFLINE_SNAPSHOT_GUARDRAILS.productionAutoMerge) {
    throw new Error('productionAutoMerge must remain false');
  }
  if (OFFLINE_SNAPSHOT_GUARDRAILS.productionAutoDeploy) {
    throw new Error('productionAutoDeploy must remain false');
  }
  if (OFFLINE_SNAPSHOT_GUARDRAILS.L4_PRODUCTION_ENABLED) {
    throw new Error('L4_PRODUCTION_ENABLED must remain false');
  }
  if (OFFLINE_SNAPSHOT_GUARDRAILS.PRODUCTION_DIMENSIONAL_FABRIC_ENABLED) {
    throw new Error('PRODUCTION_DIMENSIONAL_FABRIC_ENABLED must remain false');
  }
  if (OFFLINE_SNAPSHOT_GUARDRAILS.destructiveDbAutoApply) {
    throw new Error('destructiveDbAutoApply must remain false');
  }
  if (OFFLINE_SNAPSHOT_GUARDRAILS.liveCloudSyncFabricationAllowed) {
    throw new Error('liveCloudSyncFabricationAllowed must remain false');
  }
  if (OFFLINE_SNAPSHOT_GUARDRAILS.policyGateBypassAllowed) {
    throw new Error('policyGateBypassAllowed must remain false');
  }
  if (!OFFLINE_SNAPSHOT_GUARDRAILS.checkpointIsReadReviewOnly) {
    throw new Error('checkpointIsReadReviewOnly must remain true');
  }
  if (OFFLINE_SNAPSHOT_GUARDRAILS.bioCloningAllowed) {
    throw new Error('bioCloningAllowed must remain false');
  }
  if (OFFLINE_SNAPSHOT_GUARDRAILS.atomDbClaimAllowed) {
    throw new Error('atomDbClaimAllowed must remain false');
  }
  if (!OFFLINE_SNAPSHOT_GUARDRAILS.quantumEntanglementIsSimulatedCorrelationOnly) {
    throw new Error('quantum entanglement must remain simulated pathway correlation only');
  }
  if (!ATOMIC_DATA_CELL_GUARDRAILS.quantumEntanglementIsSimulatedCorrelationOnly) {
    throw new Error('atomic data cell quantum gate failed');
  }
  const targets = OFFLINE_SNAPSHOT_GUARDRAILS.highAutonomyTargets;
  if (!targets.includes('LOCAL') || !targets.includes('CLOUD_SANDBOX') || targets.length !== 2) {
    throw new Error('highAutonomyTargets must be LOCAL|CLOUD_SANDBOX only');
  }
}

function mobileReadyCanonical(mobileReady: MobileReadyConsumerPayload): string {
  return JSON.stringify({
    architectureCard: mobileReady.architectureCard,
    councilTop: mobileReady.councilTop,
    councilProviderHonesty: mobileReady.councilProviderHonesty,
    dutyCycleStatus: mobileReady.dutyCycleStatus,
    banners: mobileReady.banners,
  });
}

/**
 * Evaluate sync honesty for a cached snapshot vs optional expected remote checksum.
 * Missing expected → WAITING_SYNC; mismatch → CONFLICT; age over window → STALE; else FRESH.
 * Never sets liveCloudSyncClaimed.
 */
export function evaluateOfflineSyncStatus(input: {
  contentChecksum: string;
  capturedAt: string;
  nowMs?: number;
  freshnessWindowMs?: number;
  expectedRemoteChecksum?: string | null;
}): SyncStatusEvaluation {
  assertOfflineGuardrails();
  const freshnessWindowMs = input.freshnessWindowMs ?? DEFAULT_SNAPSHOT_FRESHNESS_MS;
  const nowMs = input.nowMs ?? Date.now();
  const capturedMs = Date.parse(input.capturedAt);
  const ageMs = Number.isFinite(capturedMs) ? Math.max(0, nowMs - capturedMs) : Number.POSITIVE_INFINITY;
  const expected = input.expectedRemoteChecksum ?? null;

  if (expected === null) {
    return {
      status: 'WAITING_SYNC',
      notes: 'expected remote checksum unavailable — WAITING_SYNC honesty; no live cloud sync claimed',
      localChecksum: input.contentChecksum,
      expectedRemoteChecksum: null,
      ageMs: Number.isFinite(ageMs) ? ageMs : -1,
      liveCloudSyncClaimed: false,
      productionMutation: false,
    };
  }
  if (expected !== input.contentChecksum) {
    return {
      status: 'CONFLICT',
      notes: 'local checksum diverges from expected remote — CONFLICT; manual reconcile; no silent overwrite',
      localChecksum: input.contentChecksum,
      expectedRemoteChecksum: expected,
      ageMs: Number.isFinite(ageMs) ? ageMs : -1,
      liveCloudSyncClaimed: false,
      productionMutation: false,
    };
  }
  if (ageMs > freshnessWindowMs) {
    return {
      status: 'STALE',
      notes: 'checksum matches expected but snapshot age exceeds freshness window — STALE',
      localChecksum: input.contentChecksum,
      expectedRemoteChecksum: expected,
      ageMs,
      liveCloudSyncClaimed: false,
      productionMutation: false,
    };
  }
  return {
    status: 'FRESH',
    notes: 'checksum matches expected and within freshness window — FRESH (local honesty only; not live cloud proof)',
    localChecksum: input.contentChecksum,
    expectedRemoteChecksum: expected,
    ageMs,
    liveCloudSyncClaimed: false,
    productionMutation: false,
  };
}

export type BuildOfflineSnapshotInput = {
  snapshotId: string;
  tenantId: string;
  mobileReady: MobileReadyConsumerPayload;
  provenance?: Partial<SnapshotProvenance>;
  expectedRemoteChecksum?: string | null;
  freshnessWindowMs?: number;
  nowMs?: number;
  wrapAtomicCell?: boolean;
  consumerTitle?: string;
};

/**
 * Build a checksummed offline Command Center snapshot from a 12D-08 mobileReady payload.
 */
export function buildOfflineCommandCenterSnapshot(
  input: BuildOfflineSnapshotInput,
): OfflineCommandCenterSnapshot {
  assertOfflineGuardrails();
  if (!input.snapshotId || !input.tenantId) {
    throw new TypeError('snapshotId and tenantId are required');
  }
  const capturedAt = input.provenance?.capturedAt ?? new Date((input.nowMs ?? Date.now())).toISOString();
  const provenance: SnapshotProvenance = {
    source: input.provenance?.source ?? 'architecture-reader-consumer',
    capturedAt,
    operator: input.provenance?.operator,
    consumerTitle: input.provenance?.consumerTitle ?? input.consumerTitle,
  };
  const contentChecksum = isomorphicContentHash(mobileReadyCanonical(input.mobileReady));
  const freshnessWindowMs = input.freshnessWindowMs ?? DEFAULT_SNAPSHOT_FRESHNESS_MS;
  const evalResult = evaluateOfflineSyncStatus({
    contentChecksum,
    capturedAt,
    nowMs: input.nowMs,
    freshnessWindowMs,
    expectedRemoteChecksum: input.expectedRemoteChecksum ?? null,
  });

  const ethicsNotice =
    'Offline Command Center snapshot is READ ONLY over SIMULATION layers. Sync-status is local honesty only (FRESH|STALE|WAITING_SYNC|CONFLICT). Never fabricates live cloud sync. Twin CAP ' +
    String(FOUNDER_TWIN_REPLICA_HARD_CAP) +
    ', maxDuty ' +
    String(FOUNDER_TWIN_MAX_DUTY_CYCLE) +
    '. Atomic Data Cells = software knowledge records only (naming ALIGN; no physics-scale storage claims). Checkpoint = read/review only — no Policy Gate bypass. High-autonomy: LOCAL|CLOUD_SANDBOX only.';
  assertEthicsSafeCopy(ethicsNotice, '12d09 offline snapshot ethicsNotice');

  const dutyCycleAware = input.mobileReady.dutyCycleStatus != null;
  if (dutyCycleAware && input.mobileReady.dutyCycleStatus) {
    const d = input.mobileReady.dutyCycleStatus;
    if (d.hardCap > FOUNDER_TWIN_REPLICA_HARD_CAP) {
      throw new Error('dutyCycleStatus.hardCap exceeds FOUNDER_TWIN_REPLICA_HARD_CAP');
    }
    if (d.maxDutyCycle > FOUNDER_TWIN_MAX_DUTY_CYCLE) {
      throw new Error('dutyCycleStatus.maxDutyCycle exceeds FOUNDER_TWIN_MAX_DUTY_CYCLE');
    }
    if (d.bioCloningAllowed) {
      throw new Error('dutyCycleStatus.bioCloningAllowed must be false');
    }
  }

  const atomicCell =
    input.wrapAtomicCell === false
      ? null
      : buildAtomicDataCell({
          cellId: 'adc:' + input.snapshotId,
          tenantId: input.tenantId,
          body: {
            kind: 'offline_command_center_snapshot',
            snapshotId: input.snapshotId,
            contentChecksum,
            syncStatus: evalResult.status,
          },
          provenance: ['12d09:offline-snapshot-cache', provenance.source],
          timestamp: capturedAt,
          confidence: evalResult.status === 'FRESH' ? 0.85 : evalResult.status === 'STALE' ? 0.55 : 0.4,
          graphLinks: [],
          replication: { offlineEligible: true, maxReplicas: 64 },
        });

  return {
    snapshotId: input.snapshotId,
    tenantId: input.tenantId,
    schemaVersion: OFFLINE_SNAPSHOT_SCHEMA_VERSION,
    contentChecksum,
    provenance,
    mobileReady: input.mobileReady,
    dutyCycleAware,
    syncStatus: evalResult.status,
    liveCloudSyncClaimed: false,
    expectedRemoteChecksum: evalResult.expectedRemoteChecksum,
    freshnessWindowMs,
    ageMs: evalResult.ageMs,
    readOnly: true,
    productionAutoApply: false,
    layerKind: 'SIMULATION',
    ethicsNotice,
    atomicCell,
    guardrails: OFFLINE_SNAPSHOT_GUARDRAILS,
  };
}

/** Convenience: snapshot from a full 12D-08 consumer bundle. */
export function buildOfflineSnapshotFromConsumer(
  bundle: CommandCenterConsumerBundle,
  input: {
    snapshotId: string;
    tenantId: string;
    expectedRemoteChecksum?: string | null;
    freshnessWindowMs?: number;
    nowMs?: number;
    operator?: string;
  },
): OfflineCommandCenterSnapshot {
  return buildOfflineCommandCenterSnapshot({
    snapshotId: input.snapshotId,
    tenantId: input.tenantId,
    mobileReady: bundle.mobileReady,
    consumerTitle: bundle.title,
    expectedRemoteChecksum: input.expectedRemoteChecksum,
    freshnessWindowMs: input.freshnessWindowMs,
    nowMs: input.nowMs,
    provenance: {
      source: 'architecture-reader-consumer',
      operator: input.operator,
      consumerTitle: bundle.title,
    },
  });
}

/** Isomorphic disk-fixture serialize (caller writes bytes). */
export function serializeOfflineSnapshotFixture(snapshot: OfflineCommandCenterSnapshot): string {
  assertOfflineGuardrails();
  const json = JSON.stringify(
    {
      schemaVersion: snapshot.schemaVersion,
      snapshotId: snapshot.snapshotId,
      tenantId: snapshot.tenantId,
      contentChecksum: snapshot.contentChecksum,
      provenance: snapshot.provenance,
      mobileReady: snapshot.mobileReady,
      syncStatus: snapshot.syncStatus,
      liveCloudSyncClaimed: false as const,
      expectedRemoteChecksum: snapshot.expectedRemoteChecksum,
      freshnessWindowMs: snapshot.freshnessWindowMs,
      readOnly: true as const,
      productionAutoApply: false as const,
      layerKind: 'SIMULATION' as const,
      ethicsNotice: snapshot.ethicsNotice,
      atomicCellChecksum: snapshot.atomicCell?.checksum ?? null,
      guardrails: {
        liveCloudSyncFabricationAllowed: false,
        policyGateBypassAllowed: false,
        checkpointIsReadReviewOnly: true,
        atomDbClaimAllowed: false,
        highAutonomyTargets: ['LOCAL', 'CLOUD_SANDBOX'],
      },
    },
    null,
    2,
  );
  assertEthicsSafeCopy(json, '12d09 offline snapshot fixture');
  return json;
}

/** Parse fixture JSON back into mobileReady + metadata; rebuilds a live snapshot evaluation. */
export function parseOfflineSnapshotFixture(
  json: string,
  opts?: { nowMs?: number; expectedRemoteChecksum?: string | null },
): OfflineCommandCenterSnapshot {
  assertOfflineGuardrails();
  const raw = JSON.parse(json) as {
    snapshotId: string;
    tenantId: string;
    mobileReady: MobileReadyConsumerPayload;
    provenance?: SnapshotProvenance;
    expectedRemoteChecksum?: string | null;
    freshnessWindowMs?: number;
  };
  return buildOfflineCommandCenterSnapshot({
    snapshotId: raw.snapshotId,
    tenantId: raw.tenantId,
    mobileReady: raw.mobileReady,
    provenance: raw.provenance,
    expectedRemoteChecksum:
      opts?.expectedRemoteChecksum !== undefined
        ? opts.expectedRemoteChecksum
        : (raw.expectedRemoteChecksum ?? null),
    freshnessWindowMs: raw.freshnessWindowMs,
    nowMs: opts?.nowMs,
  });
}

/**
 * In-memory offline snapshot cache (isomorphic). Optional disk is via serialize/parse only.
 */
export class OfflineSnapshotCache {
  private readonly store = new Map<string, OfflineCommandCenterSnapshot>();

  put(snapshot: OfflineCommandCenterSnapshot): void {
    assertOfflineGuardrails();
    if (snapshot.liveCloudSyncClaimed) {
      throw new Error('liveCloudSyncClaimed must remain false');
    }
    if (!snapshot.readOnly || snapshot.productionAutoApply) {
      throw new Error('cached snapshots must remain read-only with productionAutoApply false');
    }
    this.store.set(snapshot.snapshotId, snapshot);
  }

  get(snapshotId: string): OfflineCommandCenterSnapshot | null {
    return this.store.get(snapshotId) ?? null;
  }

  list(): OfflineCommandCenterSnapshot[] {
    return [...this.store.values()];
  }

  clear(): void {
    this.store.clear();
  }

  size(): number {
    return this.store.size;
  }

  /** Re-evaluate sync status for a cached entry (age / expected remote may change). */
  refreshSyncStatus(
    snapshotId: string,
    opts?: { nowMs?: number; expectedRemoteChecksum?: string | null; freshnessWindowMs?: number },
  ): OfflineCommandCenterSnapshot | null {
    const existing = this.store.get(snapshotId);
    if (!existing) return null;
    const next = buildOfflineCommandCenterSnapshot({
      snapshotId: existing.snapshotId,
      tenantId: existing.tenantId,
      mobileReady: existing.mobileReady,
      provenance: existing.provenance,
      expectedRemoteChecksum:
        opts?.expectedRemoteChecksum !== undefined
          ? opts.expectedRemoteChecksum
          : existing.expectedRemoteChecksum,
      freshnessWindowMs: opts?.freshnessWindowMs ?? existing.freshnessWindowMs,
      nowMs: opts?.nowMs,
      wrapAtomicCell: existing.atomicCell != null,
      consumerTitle: existing.provenance.consumerTitle,
    });
    this.store.set(snapshotId, next);
    return next;
  }
}
