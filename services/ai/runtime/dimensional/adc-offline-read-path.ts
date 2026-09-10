/**
 * 12D-13 — Atomic Data Cell offline snapshot READ path (Data City residual).
 * LOCAL / OFFLINE_PREFER_LOCAL ONLY — never CLOUD_SANDBOX / PRODUCTION execution.
 * device → local_shard only (sparse stub; no regional/global fan-out).
 * HOT cell hydrate from SQLITE / OBJECT_STORE cache.
 * WAITING_SYNC when unbound. No DDL / no PRODUCTION / no fake VERIFIED accelerators.
 * Policy Gate aligned.
 */
import { isomorphicContentHash } from './datagene';
import {
  assertEthicsSafeCopy,
  BUSINESS_BAR_METRICS,
  HIGH_AUTONOMY_TARGETS,
  UNIVERSES_ARE_SIMULATION_LAYERS_ONLY,
  VALUATION_THEATER_ALLOWED,
} from './universe-ethics';
import { BUILDER_GUARDRAILS } from '../builder/policy';
import { OFFLINE_PREFER_LOCAL } from './ollama-local-writer';
import {
  ATOMIC_DATA_CELL_GUARDRAILS,
  buildAtomicDataCell,
  verifyAtomicDataCellChecksum,
  type AtomicDataCell,
} from './atomic-data-cell';
import {
  createCityNode,
  createDefaultDatabaseCity,
  type BrainTier,
  type DatabaseCityNode,
  type DbEngineKind,
  type MemoryHeatTier,
  type SiliconCapabilityClaim,
} from './database-city';
import type { OfflineSyncStatus } from './offline-snapshot-cache';

export const ADC_OFFLINE_READ_SCHEMA_VERSION = '12d13.1' as const;

/** Locked Data City contract: LOCAL only — never CLOUD_SANDBOX / PRODUCTION. */
export const ADC_OFFLINE_READ_SAFE_ENVIRONMENTS = ['LOCAL'] as const;

export type AdcOfflineCacheBackend = 'SQLITE' | 'OBJECT_STORE';

export type AdcCacheOutcome = 'HIT' | 'MISS';

export const ADC_OFFLINE_READ_GUARDRAILS = {
  readOnly: true as const,
  OFFLINE_PREFER_LOCAL: true as const,
  preferredExecution: 'LOCAL' as const,
  /** Locked: never CLOUD_SANDBOX for this residual path. */
  cloudSandboxAllowed: false as const,
  productionAllowed: false as const,
  productionAutoApply: false as const,
  productionAutoMerge: false as const,
  productionAutoDeploy: false as const,
  autonomousProductionDDL: false as const,
  autonomousProductionDML: false as const,
  destructiveDbAutoApply: false as const,
  L4_PRODUCTION_ENABLED: false as const,
  liveCloudSyncClaimed: false as const,
  liveCloudSyncFabricationAllowed: false as const,
  policyGateBypassAllowed: false as const,
  noDdl: true as const,
  noDml: true as const,
  noDeploy: true as const,
  sparseRouteOnly: true as const,
  regionalGlobalFanOutAllowed: false as const,
  /** Accelerators remain UNVERIFIED only — never fake VERIFIED GPU/NPU/QPU. */
  acceleratorVerifiedAllowed: false as const,
  fakeVerifiedAcceleratorAllowed: false as const,
  hotHydrateBackends: Object.freeze(['SQLITE', 'OBJECT_STORE'] as AdcOfflineCacheBackend[]),
  routeTiersAllowed: Object.freeze(['device', 'local_shard'] as BrainTier[]),
  highAutonomyTargets: HIGH_AUTONOMY_TARGETS,
  /** Execution allow-list stricter than HIGH_AUTONOMY_TARGETS for this ticket. */
  executionAllowList: Object.freeze(['LOCAL'] as const),
  businessBarMetrics: BUSINESS_BAR_METRICS,
  VALUATION_THEATER_ALLOWED,
  UNIVERSES_ARE_SIMULATION_LAYERS_ONLY,
  atomDbClaimAllowed: false as const,
  checkpointIsReadReviewOnly: true as const,
  ticket: '12D-13' as const,
} as const;

export type AdcSparseRouteStub = {
  fromTier: 'device';
  toTier: 'local_shard';
  path: readonly string[];
  tiers: readonly ['device', 'local_shard'];
  sparse: true;
  fanOutRegional: false;
  fanOutGlobal: false;
  productionAuthorized: false;
  preferredExecution: 'LOCAL';
  OFFLINE_PREFER_LOCAL: true;
};

export type AdcOfflineCacheReceipt = {
  outcome: AdcCacheOutcome;
  cellId: string;
  backend: AdcOfflineCacheBackend;
  heat: MemoryHeatTier;
  syncStatus: OfflineSyncStatus;
  liveCloudSyncClaimed: false;
  unbound: boolean;
  contentChecksum: string | null;
  notes: string;
  readOnly: true;
  productionAutoApply: false;
  schemaVersion: typeof ADC_OFFLINE_READ_SCHEMA_VERSION;
};

export type AdcOfflineReadResult = {
  schemaVersion: typeof ADC_OFFLINE_READ_SCHEMA_VERSION;
  cell: AtomicDataCell | null;
  heat: 'hot';
  backend: AdcOfflineCacheBackend;
  route: AdcSparseRouteStub;
  receipt: AdcOfflineCacheReceipt;
  syncStatus: OfflineSyncStatus;
  liveCloudSyncClaimed: false;
  preferredExecution: 'LOCAL';
  OFFLINE_PREFER_LOCAL: true;
  readOnly: true;
  productionAutoApply: false;
  accelerators: readonly SiliconCapabilityClaim[];
  guardrails: typeof ADC_OFFLINE_READ_GUARDRAILS;
  ethicsNotice: string;
};

export type AdcOfflineCacheEntry = {
  cell: AtomicDataCell;
  backend: AdcOfflineCacheBackend;
  heat: 'hot';
  storedAt: string;
  deviceId: string;
  shardNodeId: string;
};

function assertAdcOfflineReadGuardrails(): void {
  const g = ADC_OFFLINE_READ_GUARDRAILS;
  if (!g.readOnly) throw new Error('readOnly must remain true');
  if (!g.OFFLINE_PREFER_LOCAL || !OFFLINE_PREFER_LOCAL) {
    throw new Error('OFFLINE_PREFER_LOCAL must remain true');
  }
  if (g.preferredExecution !== 'LOCAL') throw new Error('preferredExecution must remain LOCAL');
  if (g.cloudSandboxAllowed) throw new Error('cloudSandboxAllowed must remain false — LOCAL only');
  if (g.productionAllowed) throw new Error('productionAllowed must remain false');
  if (g.productionAutoApply || g.productionAutoMerge || g.productionAutoDeploy) {
    throw new Error('productionAuto* must remain false');
  }
  if (g.autonomousProductionDDL || g.autonomousProductionDML || BUILDER_GUARDRAILS.autonomousProductionDDL || BUILDER_GUARDRAILS.autonomousProductionDML) {
    throw new Error('autonomousProductionDDL/DML must remain false');
  }
  if (g.destructiveDbAutoApply) throw new Error('destructiveDbAutoApply must remain false');
  if (g.L4_PRODUCTION_ENABLED) throw new Error('L4_PRODUCTION_ENABLED must remain false');
  if (g.liveCloudSyncClaimed || g.liveCloudSyncFabricationAllowed) {
    throw new Error('liveCloudSyncClaimed/fabrication must remain false');
  }
  if (g.policyGateBypassAllowed) throw new Error('policyGateBypassAllowed must remain false');
  if (!g.noDdl || !g.noDml || !g.noDeploy) throw new Error('noDdl/noDml/noDeploy must remain true');
  if (!g.sparseRouteOnly || g.regionalGlobalFanOutAllowed) {
    throw new Error('sparse local route only — regional/global fan-out forbidden');
  }
  if (g.acceleratorVerifiedAllowed || g.fakeVerifiedAcceleratorAllowed) {
    throw new Error('accelerators must remain UNVERIFIED — never fake VERIFIED');
  }
  if (ATOMIC_DATA_CELL_GUARDRAILS.atomDbClaimAllowed || g.atomDbClaimAllowed) {
    throw new Error('atomDbClaimAllowed must remain false');
  }
  if (VALUATION_THEATER_ALLOWED) throw new Error('VALUATION_THEATER_ALLOWED must remain false');
  if (![...g.executionAllowList].every((e) => e === 'LOCAL') || g.executionAllowList.length !== 1) {
    throw new Error('executionAllowList must be LOCAL only');
  }
  for (const backend of g.hotHydrateBackends) {
    if (backend !== 'SQLITE' && backend !== 'OBJECT_STORE') {
      throw new Error('hot hydrate backends must be SQLITE|OBJECT_STORE only');
    }
  }
}

/** Guardrail dump for evidence / Policy Gate alignment. */
export function dumpAdcOfflineReadGuardrails(): Readonly<Record<string, unknown>> {
  assertAdcOfflineReadGuardrails();
  return Object.freeze({
    ticket: ADC_OFFLINE_READ_GUARDRAILS.ticket,
    schemaVersion: ADC_OFFLINE_READ_SCHEMA_VERSION,
    readOnly: true,
    OFFLINE_PREFER_LOCAL: true,
    preferredExecution: 'LOCAL',
    safeEnvironments: [...ADC_OFFLINE_READ_SAFE_ENVIRONMENTS],
    cloudSandboxAllowed: false,
    productionAllowed: false,
    productionAutoApply: false,
    productionAutoMerge: false,
    productionAutoDeploy: false,
    autonomousProductionDDL: false,
    autonomousProductionDML: false,
    destructiveDbAutoApply: false,
    L4_PRODUCTION_ENABLED: false,
    liveCloudSyncClaimed: false,
    liveCloudSyncFabricationAllowed: false,
    policyGateBypassAllowed: false,
    noDdl: true,
    noDml: true,
    noDeploy: true,
    sparseRouteOnly: true,
    regionalGlobalFanOutAllowed: false,
    acceleratorVerifiedAllowed: false,
    hotHydrateBackends: [...ADC_OFFLINE_READ_GUARDRAILS.hotHydrateBackends],
    routeTiersAllowed: [...ADC_OFFLINE_READ_GUARDRAILS.routeTiersAllowed],
    atomDbClaimAllowed: false,
    VALUATION_THEATER_ALLOWED: false,
    UNIVERSES_ARE_SIMULATION_LAYERS_ONLY: true,
  });
}

/**
 * Sparse device → local_shard route stub. Rejects regional/global fan-out.
 */
export function buildSparseDeviceToLocalShardRoute(
  nodes?: readonly DatabaseCityNode[],
  seed = 'xiv-12d13',
): AdcSparseRouteStub {
  assertAdcOfflineReadGuardrails();
  const city = nodes ?? [
    createCityNode({ nodeId: seed + ':device', tier: 'device', engine: 'SQLITE', memoryHeat: 'hot' }),
    createCityNode({ nodeId: seed + ':local_shard', tier: 'local_shard', engine: 'SQLITE', memoryHeat: 'hot' }),
  ];
  const device = city.find((n) => n.tier === 'device');
  const shard = city.find((n) => n.tier === 'local_shard');
  if (!device || !shard) {
    throw new Error('sparse ADC offline route requires device + local_shard nodes');
  }
  // Honesty: ignore company/regional/global even if present in city ladder.
  return {
    fromTier: 'device',
    toTier: 'local_shard',
    path: Object.freeze([device.nodeId, shard.nodeId]),
    tiers: Object.freeze(['device', 'local_shard'] as const),
    sparse: true,
    fanOutRegional: false,
    fanOutGlobal: false,
    productionAuthorized: false,
    preferredExecution: 'LOCAL',
    OFFLINE_PREFER_LOCAL: true,
  };
}

/** Explicit ban: regional/global fan-out is not part of 12D-13 residual. */
export function fanOutAdcOfflineRegionalGlobal(_tiers: BrainTier[]): never {
  assertAdcOfflineReadGuardrails();
  throw new Error('12D-13 ADC offline read path forbids regional/global fan-out (sparse device→local_shard only)');
}

/** Explicit ban: no production DDL from offline ADC read path. */
export function applyAdcOfflineProductionDdl(): never {
  assertAdcOfflineReadGuardrails();
  throw new Error('12D-13 ADC offline read path forbids production DDL');
}

/** Explicit ban: Policy Gate bypass. */
export function bypassPolicyGateViaAdcOfflineRead(): never {
  assertAdcOfflineReadGuardrails();
  throw new Error('12D-13 ADC offline read path NEVER bypasses Policy Gate');
}

/** Accelerators for this path: CPU may be VERIFIED; GPU/NPU/QPU stay UNVERIFIED (WAITING). */
export function adcOfflineAcceleratorClaims(): SiliconCapabilityClaim[] {
  assertAdcOfflineReadGuardrails();
  return [
    { backend: 'cpu', status: 'VERIFIED', notes: 'CPU-first LOCAL offline ADC read; research only' },
    { backend: 'gpu', status: 'WAITING', notes: 'UNVERIFIED — never fake VERIFIED GPU' },
    { backend: 'npu', status: 'WAITING', notes: 'UNVERIFIED — never fake VERIFIED NPU' },
    { backend: 'qpu', status: 'WAITING', notes: 'UNVERIFIED — never fake VERIFIED QPU' },
  ];
}

export function assertAdcAcceleratorsUnverifiedExceptCpu(claims: readonly SiliconCapabilityClaim[]): void {
  for (const claim of claims) {
    if (claim.backend !== 'cpu' && claim.status === 'VERIFIED') {
      throw new Error(claim.backend + ' must remain UNVERIFIED on 12D-13 ADC offline read path');
    }
  }
}

/**
 * In-memory LOCAL cache simulating SQLITE / OBJECT_STORE hot hydrate.
 * No production DDL — software contract + fixture only.
 */
export class AdcOfflineSnapshotCache {
  private readonly store = new Map<string, AdcOfflineCacheEntry>();

  put(entry: AdcOfflineCacheEntry): AdcOfflineCacheReceipt {
    assertAdcOfflineReadGuardrails();
    if (entry.heat !== 'hot') throw new Error('12D-13 hydrate requires HOT cells');
    if (entry.backend !== 'SQLITE' && entry.backend !== 'OBJECT_STORE') {
      throw new Error('backend must be SQLITE|OBJECT_STORE');
    }
    if (!verifyAtomicDataCellChecksum(entry.cell)) {
      throw new Error('refusing to cache ADC with invalid checksum');
    }
    if (!entry.cell.replication.offlineEligible) {
      throw new Error('cell must be offlineEligible for ADC offline cache');
    }
    this.store.set(entry.cell.cellId, {
      ...entry,
      heat: 'hot',
    });
    return {
      outcome: 'HIT',
      cellId: entry.cell.cellId,
      backend: entry.backend,
      heat: 'hot',
      syncStatus: 'FRESH',
      liveCloudSyncClaimed: false,
      unbound: false,
      contentChecksum: entry.cell.checksum,
      notes: 'put into LOCAL ' + entry.backend + ' HOT cache (fixture; no DDL)',
      readOnly: true,
      productionAutoApply: false,
      schemaVersion: ADC_OFFLINE_READ_SCHEMA_VERSION,
    };
  }

  get(cellId: string): AdcOfflineCacheEntry | null {
    return this.store.get(cellId) ?? null;
  }

  size(): number {
    return this.store.size;
  }

  clear(): void {
    this.store.clear();
  }

  list(): AdcOfflineCacheEntry[] {
    return [...this.store.values()];
  }
}

export type ReadAdcOfflineInput = {
  cellId: string;
  deviceId: string;
  tenantId: string;
  cache: AdcOfflineSnapshotCache;
  backend?: AdcOfflineCacheBackend;
  /** When true / unbound remote binding → WAITING_SYNC honesty. */
  unbound?: boolean;
  expectedRemoteChecksum?: string | null;
  cityNodes?: readonly DatabaseCityNode[];
  seed?: string;
};

/**
 * HOT hydrate ADC from LOCAL SQLITE/OBJECT_STORE cache along sparse device→local_shard route.
 * MISS or unbound → WAITING_SYNC; never fabricates live cloud sync or VERIFIED accelerators.
 */
export function readAtomicDataCellOffline(input: ReadAdcOfflineInput): AdcOfflineReadResult {
  assertAdcOfflineReadGuardrails();
  if (!input.cellId || !input.deviceId || !input.tenantId) {
    throw new TypeError('cellId, deviceId, and tenantId are required');
  }
  const backend: AdcOfflineCacheBackend = input.backend ?? 'SQLITE';
  if (backend !== 'SQLITE' && backend !== 'OBJECT_STORE') {
    throw new Error('backend must be SQLITE|OBJECT_STORE');
  }
  const route = buildSparseDeviceToLocalShardRoute(input.cityNodes, input.seed ?? 'xiv-12d13');
  const accelerators = adcOfflineAcceleratorClaims();
  assertAdcAcceleratorsUnverifiedExceptCpu(accelerators);

  const ethicsNotice =
    '12D-13 ADC offline snapshot READ path is LOCAL / OFFLINE_PREFER_LOCAL only. ' +
    'device→local_shard sparse stub (no regional/global fan-out). HOT hydrate from SQLITE|OBJECT_STORE cache. ' +
    'WAITING_SYNC when unbound. No DDL/DML/deploy. productionAuto*/L4/liveCloudSyncClaimed=false. ' +
    'Accelerators UNVERIFIED except CPU. Policy Gate intact. Atomic Data Cells = software records only.';
  assertEthicsSafeCopy(ethicsNotice, '12d13 adc offline read ethicsNotice');

  const unbound = input.unbound === true || input.expectedRemoteChecksum == null;
  const hit = input.cache.get(input.cellId);

  if (!hit) {
    const receipt: AdcOfflineCacheReceipt = {
      outcome: 'MISS',
      cellId: input.cellId,
      backend,
      heat: 'hot',
      syncStatus: 'WAITING_SYNC',
      liveCloudSyncClaimed: false,
      unbound: true,
      contentChecksum: null,
      notes: 'cache MISS — WAITING_SYNC; no live cloud sync claimed; sparse local path only',
      readOnly: true,
      productionAutoApply: false,
      schemaVersion: ADC_OFFLINE_READ_SCHEMA_VERSION,
    };
    return {
      schemaVersion: ADC_OFFLINE_READ_SCHEMA_VERSION,
      cell: null,
      heat: 'hot',
      backend,
      route,
      receipt,
      syncStatus: 'WAITING_SYNC',
      liveCloudSyncClaimed: false,
      preferredExecution: 'LOCAL',
      OFFLINE_PREFER_LOCAL: true,
      readOnly: true,
      productionAutoApply: false,
      accelerators: Object.freeze(accelerators),
      guardrails: ADC_OFFLINE_READ_GUARDRAILS,
      ethicsNotice,
    };
  }

  if (hit.cell.tenantId !== input.tenantId) {
    throw new Error('cross-tenant ADC offline read forbidden');
  }
  if (!verifyAtomicDataCellChecksum(hit.cell)) {
    throw new Error('cached ADC checksum failed verification');
  }

  let syncStatus: OfflineSyncStatus = 'FRESH';
  let notes = 'cache HIT — HOT hydrate from LOCAL ' + hit.backend;
  if (unbound) {
    syncStatus = 'WAITING_SYNC';
    notes = 'cache HIT but unbound remote — WAITING_SYNC honesty; liveCloudSyncClaimed=false';
  } else if (input.expectedRemoteChecksum && input.expectedRemoteChecksum !== hit.cell.checksum) {
    syncStatus = 'CONFLICT';
    notes = 'cache HIT but checksum diverges from expected remote — CONFLICT; no silent overwrite';
  }

  const receipt: AdcOfflineCacheReceipt = {
    outcome: 'HIT',
    cellId: hit.cell.cellId,
    backend: hit.backend,
    heat: 'hot',
    syncStatus,
    liveCloudSyncClaimed: false,
    unbound,
    contentChecksum: hit.cell.checksum,
    notes,
    readOnly: true,
    productionAutoApply: false,
    schemaVersion: ADC_OFFLINE_READ_SCHEMA_VERSION,
  };

  return {
    schemaVersion: ADC_OFFLINE_READ_SCHEMA_VERSION,
    cell: hit.cell,
    heat: 'hot',
    backend: hit.backend,
    route,
    receipt,
    syncStatus,
    liveCloudSyncClaimed: false,
    preferredExecution: 'LOCAL',
    OFFLINE_PREFER_LOCAL: true,
    readOnly: true,
    productionAutoApply: false,
    accelerators: Object.freeze(accelerators),
    guardrails: ADC_OFFLINE_READ_GUARDRAILS,
    ethicsNotice,
  };
}

/** Seed a HOT ADC into the LOCAL cache (fixture put; not production DML). */
export function seedHotAdcOfflineCache(input: {
  cache: AdcOfflineSnapshotCache;
  cell: AtomicDataCell;
  deviceId: string;
  backend?: AdcOfflineCacheBackend;
  shardNodeId?: string;
  storedAt?: string;
}): AdcOfflineCacheReceipt {
  assertAdcOfflineReadGuardrails();
  return input.cache.put({
    cell: input.cell,
    backend: input.backend ?? 'SQLITE',
    heat: 'hot',
    storedAt: input.storedAt ?? new Date().toISOString(),
    deviceId: input.deviceId,
    shardNodeId: input.shardNodeId ?? 'xiv-12d13:local_shard',
  });
}

/** Convenience: build + seed a software ADC for offline HOT read tests. */
export function buildAndSeedHotAdc(input: {
  cache: AdcOfflineSnapshotCache;
  cellId: string;
  tenantId: string;
  deviceId: string;
  body?: unknown;
  backend?: AdcOfflineCacheBackend;
}): { cell: AtomicDataCell; receipt: AdcOfflineCacheReceipt } {
  const cell = buildAtomicDataCell({
    cellId: input.cellId,
    tenantId: input.tenantId,
    body: input.body ?? { kind: 'adc_offline_snapshot', ticket: '12D-13' },
    provenance: ['12d13:adc-offline-read-path', 'local:' + input.deviceId],
    confidence: 0.8,
    replication: { offlineEligible: true, maxReplicas: 64 },
  });
  const receipt = seedHotAdcOfflineCache({
    cache: input.cache,
    cell,
    deviceId: input.deviceId,
    backend: input.backend ?? 'SQLITE',
  });
  return { cell, receipt };
}

/** Evidence helper: content hash over guardrail dump + optional receipts. */
export function evidenceHashAdcOfflineRead(parts: {
  tipSha?: string;
  receipts?: readonly AdcOfflineCacheReceipt[];
  testsPassed?: readonly string[];
}): string {
  assertAdcOfflineReadGuardrails();
  return isomorphicContentHash(
    JSON.stringify({
      schemaVersion: ADC_OFFLINE_READ_SCHEMA_VERSION,
      guardrails: dumpAdcOfflineReadGuardrails(),
      tipSha: parts.tipSha ?? null,
      receipts: parts.receipts ?? [],
      testsPassed: parts.testsPassed ?? [],
      liveCloudSyncClaimed: false,
      productionAutoApply: false,
    }),
  );
}

/** Default city ladder is available for honesty checks; route still clips to device→local_shard. */
export function defaultCityForAdcOfflineRead(seed = 'xiv-12d13'): DatabaseCityNode[] {
  return createDefaultDatabaseCity(seed);
}

export function assertEngineAllowedForHotHydrate(engine: DbEngineKind): void {
  if (engine !== 'SQLITE' && engine !== 'OBJECT_STORE') {
    throw new Error('HOT hydrate engines must be SQLITE|OBJECT_STORE for 12D-13');
  }
}
