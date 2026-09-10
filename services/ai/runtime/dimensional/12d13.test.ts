/**
 * 12D-13 — Atomic Data Cell offline snapshot READ path (Data City residual).
 * LOCAL / OFFLINE_PREFER_LOCAL only; device→local_shard; HOT SQLITE/OBJECT_STORE;
 * sparse stub; WAITING_SYNC unbound; no DDL; accelerators UNVERIFIED; Policy Gate.
 */
import assert from 'node:assert/strict';
import {
  ADC_OFFLINE_READ_GUARDRAILS,
  ADC_OFFLINE_READ_SAFE_ENVIRONMENTS,
  ADC_OFFLINE_READ_SCHEMA_VERSION,
  ATOMIC_DATA_CELL_GUARDRAILS,
  HIGH_AUTONOMY_TARGETS,
  OFFLINE_PREFER_LOCAL,
  VALUATION_THEATER_ALLOWED,
  AdcOfflineSnapshotCache,
  adcOfflineAcceleratorClaims,
  applyAdcOfflineProductionDdl,
  assertAdcAcceleratorsUnverifiedExceptCpu,
  assertEngineAllowedForHotHydrate,
  buildAndSeedHotAdc,
  buildSparseDeviceToLocalShardRoute,
  bypassPolicyGateViaAdcOfflineRead,
  createDefaultDatabaseCity,
  defaultCityForAdcOfflineRead,
  dumpAdcOfflineReadGuardrails,
  evidenceHashAdcOfflineRead,
  fanOutAdcOfflineRegionalGlobal,
  readAtomicDataCellOffline,
  verifyAtomicDataCellChecksum,
} from './index';
import { BUILDER_GUARDRAILS as POLICY_BUILDER_GUARDRAILS } from '../builder/policy';

// --- Locked Data City contract ---
assert.equal(ADC_OFFLINE_READ_GUARDRAILS.readOnly, true);
assert.equal(ADC_OFFLINE_READ_GUARDRAILS.OFFLINE_PREFER_LOCAL, true);
assert.equal(OFFLINE_PREFER_LOCAL, true);
assert.equal(ADC_OFFLINE_READ_GUARDRAILS.preferredExecution, 'LOCAL');
assert.deepEqual([...ADC_OFFLINE_READ_SAFE_ENVIRONMENTS], ['LOCAL']);
assert.deepEqual([...ADC_OFFLINE_READ_GUARDRAILS.executionAllowList], ['LOCAL']);
assert.equal(ADC_OFFLINE_READ_GUARDRAILS.cloudSandboxAllowed, false);
assert.equal(ADC_OFFLINE_READ_GUARDRAILS.productionAllowed, false);
assert.equal(ADC_OFFLINE_READ_GUARDRAILS.productionAutoApply, false);
assert.equal(ADC_OFFLINE_READ_GUARDRAILS.productionAutoMerge, false);
assert.equal(ADC_OFFLINE_READ_GUARDRAILS.productionAutoDeploy, false);
assert.equal(ADC_OFFLINE_READ_GUARDRAILS.autonomousProductionDDL, false);
assert.equal(ADC_OFFLINE_READ_GUARDRAILS.autonomousProductionDML, false);
assert.equal(ADC_OFFLINE_READ_GUARDRAILS.destructiveDbAutoApply, false);
assert.equal(ADC_OFFLINE_READ_GUARDRAILS.L4_PRODUCTION_ENABLED, false);
assert.equal(ADC_OFFLINE_READ_GUARDRAILS.liveCloudSyncClaimed, false);
assert.equal(ADC_OFFLINE_READ_GUARDRAILS.liveCloudSyncFabricationAllowed, false);
assert.equal(ADC_OFFLINE_READ_GUARDRAILS.policyGateBypassAllowed, false);
assert.equal(ADC_OFFLINE_READ_GUARDRAILS.noDdl, true);
assert.equal(ADC_OFFLINE_READ_GUARDRAILS.noDml, true);
assert.equal(ADC_OFFLINE_READ_GUARDRAILS.noDeploy, true);
assert.equal(ADC_OFFLINE_READ_GUARDRAILS.sparseRouteOnly, true);
assert.equal(ADC_OFFLINE_READ_GUARDRAILS.regionalGlobalFanOutAllowed, false);
assert.equal(ADC_OFFLINE_READ_GUARDRAILS.acceleratorVerifiedAllowed, false);
assert.equal(ADC_OFFLINE_READ_GUARDRAILS.fakeVerifiedAcceleratorAllowed, false);
assert.deepEqual([...ADC_OFFLINE_READ_GUARDRAILS.hotHydrateBackends], ['SQLITE', 'OBJECT_STORE']);
assert.deepEqual([...ADC_OFFLINE_READ_GUARDRAILS.routeTiersAllowed], ['device', 'local_shard']);
assert.equal(ADC_OFFLINE_READ_GUARDRAILS.ticket, '12D-13');
assert.equal(ADC_OFFLINE_READ_SCHEMA_VERSION, '12d13.1');
assert.equal(ADC_OFFLINE_READ_GUARDRAILS.atomDbClaimAllowed, false);
assert.equal(VALUATION_THEATER_ALLOWED, false);
assert.equal(POLICY_BUILDER_GUARDRAILS.autonomousProductionDDL, false);
assert.equal(POLICY_BUILDER_GUARDRAILS.autonomousProductionDML, false);
assert.deepEqual([...HIGH_AUTONOMY_TARGETS], ['LOCAL', 'CLOUD_SANDBOX']);
assert.equal(ATOMIC_DATA_CELL_GUARDRAILS.adcOfflineReadPathWire, 'WIRED');
assert.equal(ATOMIC_DATA_CELL_GUARDRAILS.ticketFollowUp, '12D-13');
assert.equal(ATOMIC_DATA_CELL_GUARDRAILS.atomDbClaimAllowed, false);

const dump = dumpAdcOfflineReadGuardrails();
assert.equal(dump.productionAutoApply, false);
assert.equal(dump.productionAutoMerge, false);
assert.equal(dump.productionAutoDeploy, false);
assert.equal(dump.autonomousProductionDDL, false);
assert.equal(dump.autonomousProductionDML, false);
assert.equal(dump.L4_PRODUCTION_ENABLED, false);
assert.equal(dump.liveCloudSyncClaimed, false);
assert.equal(dump.cloudSandboxAllowed, false);
assert.equal(dump.acceleratorVerifiedAllowed, false);
assert.deepEqual(dump.safeEnvironments, ['LOCAL']);

// --- Sparse device→local_shard (ignore regional/global in full city) ---
const city = defaultCityForAdcOfflineRead();
assert.ok(city.some((n) => n.tier === 'regional_brain'));
assert.ok(city.some((n) => n.tier === 'global_brain'));
const route = buildSparseDeviceToLocalShardRoute(city);
assert.deepEqual([...route.tiers], ['device', 'local_shard']);
assert.equal(route.sparse, true);
assert.equal(route.fanOutRegional, false);
assert.equal(route.fanOutGlobal, false);
assert.equal(route.productionAuthorized, false);
assert.equal(route.preferredExecution, 'LOCAL');
assert.equal(route.path.length, 2);

assert.throws(() => fanOutAdcOfflineRegionalGlobal(['regional_brain', 'global_brain']), /fan-out/);
assert.throws(() => applyAdcOfflineProductionDdl(), /DDL/);
assert.throws(() => bypassPolicyGateViaAdcOfflineRead(), /Policy Gate/);

const accel = adcOfflineAcceleratorClaims();
assertAdcAcceleratorsUnverifiedExceptCpu(accel);
assert.equal(accel.find((c) => c.backend === 'cpu')?.status, 'VERIFIED');
assert.equal(accel.find((c) => c.backend === 'gpu')?.status, 'WAITING');
assert.equal(accel.find((c) => c.backend === 'npu')?.status, 'WAITING');
assert.equal(accel.find((c) => c.backend === 'qpu')?.status, 'WAITING');
assert.throws(
  () =>
    assertAdcAcceleratorsUnverifiedExceptCpu([
      { backend: 'gpu', status: 'VERIFIED', notes: 'fake' },
    ]),
  /UNVERIFIED/,
);

assertEngineAllowedForHotHydrate('SQLITE');
assertEngineAllowedForHotHydrate('OBJECT_STORE');
assert.throws(() => assertEngineAllowedForHotHydrate('POSTGRES'), /HOT hydrate/);

// --- Cache MISS → WAITING_SYNC ---
const cache = new AdcOfflineSnapshotCache();
const miss = readAtomicDataCellOffline({
  cellId: 'adc:missing',
  deviceId: 'pocket-1',
  tenantId: 'xiv',
  cache,
  backend: 'SQLITE',
});
assert.equal(miss.receipt.outcome, 'MISS');
assert.equal(miss.syncStatus, 'WAITING_SYNC');
assert.equal(miss.cell, null);
assert.equal(miss.liveCloudSyncClaimed, false);
assert.equal(miss.heat, 'hot');
assert.equal(miss.preferredExecution, 'LOCAL');
assert.equal(miss.OFFLINE_PREFER_LOCAL, true);
assert.equal(miss.receipt.unbound, true);
assert.deepEqual([...miss.route.tiers], ['device', 'local_shard']);

// --- Seed HOT + HIT (SQLITE) ---
const { cell, receipt: putReceipt } = buildAndSeedHotAdc({
  cache,
  cellId: 'adc:hot-1',
  tenantId: 'xiv',
  deviceId: 'pocket-1',
  backend: 'SQLITE',
  body: { kind: 'offline_snapshot', payload: 'lane-12d13' },
});
assert.equal(putReceipt.outcome, 'HIT');
assert.equal(putReceipt.heat, 'hot');
assert.equal(putReceipt.backend, 'SQLITE');
assert.ok(verifyAtomicDataCellChecksum(cell));
assert.equal(cache.size(), 1);

const hitBound = readAtomicDataCellOffline({
  cellId: 'adc:hot-1',
  deviceId: 'pocket-1',
  tenantId: 'xiv',
  cache,
  backend: 'SQLITE',
  unbound: false,
  expectedRemoteChecksum: cell.checksum,
});
assert.equal(hitBound.receipt.outcome, 'HIT');
assert.equal(hitBound.syncStatus, 'FRESH');
assert.equal(hitBound.cell?.cellId, 'adc:hot-1');
assert.equal(hitBound.liveCloudSyncClaimed, false);
assert.equal(hitBound.heat, 'hot');
assert.equal(hitBound.backend, 'SQLITE');

// HIT but unbound → WAITING_SYNC
const hitUnbound = readAtomicDataCellOffline({
  cellId: 'adc:hot-1',
  deviceId: 'pocket-1',
  tenantId: 'xiv',
  cache,
  unbound: true,
});
assert.equal(hitUnbound.receipt.outcome, 'HIT');
assert.equal(hitUnbound.syncStatus, 'WAITING_SYNC');
assert.equal(hitUnbound.receipt.unbound, true);
assert.equal(hitUnbound.liveCloudSyncClaimed, false);

// default unbound when expectedRemoteChecksum omitted
const hitDefaultUnbound = readAtomicDataCellOffline({
  cellId: 'adc:hot-1',
  deviceId: 'pocket-1',
  tenantId: 'xiv',
  cache,
});
assert.equal(hitDefaultUnbound.syncStatus, 'WAITING_SYNC');

// CONFLICT when expected diverges
const conflict = readAtomicDataCellOffline({
  cellId: 'adc:hot-1',
  deviceId: 'pocket-1',
  tenantId: 'xiv',
  cache,
  unbound: false,
  expectedRemoteChecksum: 'not-the-checksum',
});
assert.equal(conflict.syncStatus, 'CONFLICT');
assert.equal(conflict.liveCloudSyncClaimed, false);

// OBJECT_STORE backend path
const cache2 = new AdcOfflineSnapshotCache();
const seededObj = buildAndSeedHotAdc({
  cache: cache2,
  cellId: 'adc:obj-1',
  tenantId: 'xiv',
  deviceId: 'pocket-2',
  backend: 'OBJECT_STORE',
});
assert.equal(seededObj.receipt.backend, 'OBJECT_STORE');
const objHit = readAtomicDataCellOffline({
  cellId: 'adc:obj-1',
  deviceId: 'pocket-2',
  tenantId: 'xiv',
  cache: cache2,
  backend: 'OBJECT_STORE',
  unbound: false,
  expectedRemoteChecksum: seededObj.cell.checksum,
});
assert.equal(objHit.backend, 'OBJECT_STORE');
assert.equal(objHit.receipt.outcome, 'HIT');
assert.equal(objHit.syncStatus, 'FRESH');

// Cross-tenant forbidden
assert.throws(
  () =>
    readAtomicDataCellOffline({
      cellId: 'adc:hot-1',
      deviceId: 'pocket-1',
      tenantId: 'other-tenant',
      cache,
      unbound: false,
      expectedRemoteChecksum: cell.checksum,
    }),
  /cross-tenant/,
);

// Evidence hash over tip + receipts
const tipSha = 'PENDING_COMMIT';
const evidence = evidenceHashAdcOfflineRead({
  tipSha,
  receipts: [miss.receipt, hitBound.receipt, hitUnbound.receipt],
  testsPassed: ['12d13.test.ts'],
});
assert.equal(typeof evidence, 'string');
assert.ok(evidence.length >= 16);

// Full city still clips route
const full = createDefaultDatabaseCity('clip');
const clipped = buildSparseDeviceToLocalShardRoute(full, 'clip');
assert.ok(!clipped.path.some((p) => p.includes('regional') || p.includes('global') || p.includes('company')));

console.log('12d13.test.ts: OK');
console.log(
  JSON.stringify({
    tipShaPlaceholder: tipSha,
    cacheHit: hitBound.receipt.outcome,
    cacheMiss: miss.receipt.outcome,
    unboundWaiting: hitUnbound.syncStatus,
    evidence,
    guardrailDumpKeys: Object.keys(dump).sort(),
  }),
);
