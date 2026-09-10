/**
 * 12D-09 — Offline Command Center snapshot cache + sync-status + Atomic Data Cell stubs.
 * Twin gate: claim bans hard; LOCAL|CLOUD_SANDBOX only; checkpoint read/review only;
 * Ledger append-only / no Policy Gate bypass (wired in 12D-11);
 * Atomic Data Cells = software records; business bar metrics.
 */
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, rmSync, writeFileSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  ARCH_READER_CONSUMER_GUARDRAILS,
  ATOMIC_DATA_CELL_GUARDRAILS,
  BUSINESS_BAR_METRICS,
  DEFAULT_SNAPSHOT_FRESHNESS_MS,
  FOUNDER_TWIN_MAX_DUTY_CYCLE,
  FOUNDER_TWIN_REPLICA_HARD_CAP,
  HIGH_AUTONOMY_TARGETS,
  OFFLINE_SNAPSHOT_GUARDRAILS,
  UNIVERSE_KERNEL_GUARDRAILS,
  VALUATION_THEATER_ALLOWED,
  OfflineSnapshotCache,
  addCompany,
  addEconomicSignal,
  addSparseSimulationPathway,
  assertEthicsSafeCopy,
  buildArchitectureReaderConsumer,
  buildArchitectureReaderSummary,
  buildArchitectureReaderView,
  buildAtomicDataCell,
  buildOfflineCommandCenterSnapshot,
  buildOfflineSnapshotFromConsumer,
  createFounderTwinRoster,
  createSimulatedUniverse,
  createSpatialCoordinate,
  evaluateOfflineSyncStatus,
  parseOfflineSnapshotFixture,
  planRosterDutyCycle,
  registerTwinReplica,
  serializeOfflineSnapshotFixture,
  verifyAtomicDataCellChecksum,
} from './index';
import {
  buildCouncilQueueUxSummary,
  buildCouncilQueueUxView,
  generateBatch,
  reprioritizeStoryQueue,
} from '../storyfactory';

// --- Twin / Founder gate asserts (hard) ---
assert.equal(UNIVERSE_KERNEL_GUARDRAILS.L4_PRODUCTION_ENABLED, false);
assert.equal(VALUATION_THEATER_ALLOWED, false);
assert.equal(OFFLINE_SNAPSHOT_GUARDRAILS.readOnly, true);
assert.equal(OFFLINE_SNAPSHOT_GUARDRAILS.productionAutoApply, false);
assert.equal(OFFLINE_SNAPSHOT_GUARDRAILS.productionAutoMerge, false);
assert.equal(OFFLINE_SNAPSHOT_GUARDRAILS.productionAutoDeploy, false);
assert.equal(OFFLINE_SNAPSHOT_GUARDRAILS.liveCloudSyncFabricationAllowed, false);
assert.equal(OFFLINE_SNAPSHOT_GUARDRAILS.policyGateBypassAllowed, false);
assert.equal(OFFLINE_SNAPSHOT_GUARDRAILS.checkpointIsReadReviewOnly, true);
assert.equal(OFFLINE_SNAPSHOT_GUARDRAILS.atomDbClaimAllowed, false);
assert.equal(OFFLINE_SNAPSHOT_GUARDRAILS.bioCloningAllowed, false);
assert.equal(OFFLINE_SNAPSHOT_GUARDRAILS.quantumEntanglementIsSimulatedCorrelationOnly, true);
assert.equal(OFFLINE_SNAPSHOT_GUARDRAILS.wormholesAreSparseSimulationPathwaysOnly, true);
assert.deepEqual([...OFFLINE_SNAPSHOT_GUARDRAILS.highAutonomyTargets], ['LOCAL', 'CLOUD_SANDBOX']);
assert.deepEqual([...HIGH_AUTONOMY_TARGETS], ['LOCAL', 'CLOUD_SANDBOX']);
assert.ok(BUSINESS_BAR_METRICS.includes('adoption'));
assert.ok(BUSINESS_BAR_METRICS.includes('reliability'));
assert.ok(BUSINESS_BAR_METRICS.includes('security'));
assert.ok(BUSINESS_BAR_METRICS.includes('unit_economics'));
assert.ok(BUSINESS_BAR_METRICS.includes('customer_value'));
assert.equal(ATOMIC_DATA_CELL_GUARDRAILS.literalAtomicPhysicsStorage, false);
assert.equal(ATOMIC_DATA_CELL_GUARDRAILS.atomDbClaimAllowed, false);
assert.equal(ATOMIC_DATA_CELL_GUARDRAILS.agentCheckpointLedgerWire, 'WIRED');
assert.equal(ATOMIC_DATA_CELL_GUARDRAILS.ticketFollowUp, '12D-11');
assert.equal(ARCH_READER_CONSUMER_GUARDRAILS.readOnly, true);
assert.equal(OFFLINE_SNAPSHOT_GUARDRAILS.replicaHardCap, 64);
assert.equal(OFFLINE_SNAPSHOT_GUARDRAILS.maxDutyCycle, 0.25);
assert.equal(FOUNDER_TWIN_REPLICA_HARD_CAP, 64);
assert.equal(FOUNDER_TWIN_MAX_DUTY_CYCLE, 0.25);

// --- Fixture universe + 12D-08 consumer ---
let universe = createSimulatedUniverse({
  universeId: 'off-sim',
  tenantId: 'xiv',
  label: 'Offline snapshot SIMULATION layer',
});
universe = addCompany(universe, {
  companyId: 'co-off',
  name: 'Offline Mill',
  sector: 'ops',
  tenantId: 'xiv',
  location: createSpatialCoordinate({ lon: -87.6, lat: 41.8 }),
  memoryHeat: 'hot',
});
universe = addEconomicSignal(universe, {
  signalId: 'sig-off',
  metric: 'reliability',
  value: 0.9,
  unit: 'ratio',
  stance: 'OBSERVED',
});

const archSummary = buildArchitectureReaderSummary({ universe });
const archView = buildArchitectureReaderView(archSummary);

const batch = generateBatch(5, 13);
const queue = reprioritizeStoryQueue({
  stories: batch.stories,
  availability: [
    { agent: 'LOCAL_RULES', online: true, local: true, canNetwork: false, maxConcurrent: 10 },
    { agent: 'OLLAMA', online: false, local: true, canNetwork: false, maxConcurrent: 5 },
    { agent: 'GROK', online: false, local: false, canNetwork: true, maxConcurrent: 3 },
  ],
});
const councilSummary = buildCouncilQueueUxSummary({ queue, stories: batch.stories });
const councilView = buildCouncilQueueUxView(councilSummary);

let roster = createFounderTwinRoster({ tenantId: 'xiv', cycleId: 'cycle-12d09' });
roster = registerTwinReplica(roster, {
  replicaId: 'twin-off-a',
  kind: 'DIGITAL_TWIN',
  dutyCycle: 0.25,
  energyUsedThisCycle: 30,
  activeShardCount: 3,
});
roster = addSparseSimulationPathway(roster);
const dutyPlan = planRosterDutyCycle(roster);
assert.equal(dutyPlan.maxDutyCycle, 0.25);

const bundle = buildArchitectureReaderConsumer({
  architectureView: archView,
  councilView,
  roster,
  dutyPlan,
});
assert.ok(bundle.mobileReady.architectureCard);
assert.ok(bundle.mobileReady.dutyCycleStatus);

// --- Sync status honesty matrix ---
const now = Date.parse('2026-09-10T04:00:00.000Z');
const freshCaptured = '2026-09-10T03:50:00.000Z';
const staleCaptured = '2026-09-10T02:00:00.000Z';

const waiting = evaluateOfflineSyncStatus({
  contentChecksum: 'dg1:abc',
  capturedAt: freshCaptured,
  nowMs: now,
  expectedRemoteChecksum: null,
});
assert.equal(waiting.status, 'WAITING_SYNC');
assert.equal(waiting.liveCloudSyncClaimed, false);
assert.equal(waiting.productionMutation, false);

const conflict = evaluateOfflineSyncStatus({
  contentChecksum: 'dg1:local',
  capturedAt: freshCaptured,
  nowMs: now,
  expectedRemoteChecksum: 'dg1:remote',
});
assert.equal(conflict.status, 'CONFLICT');
assert.equal(conflict.liveCloudSyncClaimed, false);

const stale = evaluateOfflineSyncStatus({
  contentChecksum: 'dg1:same',
  capturedAt: staleCaptured,
  nowMs: now,
  freshnessWindowMs: DEFAULT_SNAPSHOT_FRESHNESS_MS,
  expectedRemoteChecksum: 'dg1:same',
});
assert.equal(stale.status, 'STALE');

const fresh = evaluateOfflineSyncStatus({
  contentChecksum: 'dg1:same',
  capturedAt: freshCaptured,
  nowMs: now,
  freshnessWindowMs: DEFAULT_SNAPSHOT_FRESHNESS_MS,
  expectedRemoteChecksum: 'dg1:same',
});
assert.equal(fresh.status, 'FRESH');
assert.equal(fresh.liveCloudSyncClaimed, false);

// --- Build snapshot from consumer (WAITING_SYNC when no expected) ---
const snapWaiting = buildOfflineSnapshotFromConsumer(bundle, {
  snapshotId: 'snap-off-1',
  tenantId: 'xiv',
  nowMs: now,
  operator: '12d09-test',
});
assert.equal(snapWaiting.syncStatus, 'WAITING_SYNC');
assert.equal(snapWaiting.liveCloudSyncClaimed, false);
assert.equal(snapWaiting.readOnly, true);
assert.equal(snapWaiting.productionAutoApply, false);
assert.equal(snapWaiting.layerKind, 'SIMULATION');
assert.equal(snapWaiting.dutyCycleAware, true);
assert.ok(snapWaiting.contentChecksum.startsWith('dg1:'));
assert.ok(snapWaiting.atomicCell);
assert.equal(snapWaiting.atomicCell?.layerKind, 'SIMULATION');
assert.equal(snapWaiting.atomicCell?.replication.liveCloudSyncRequired, false);
assert.equal(snapWaiting.atomicCell?.replication.crossTenantCopyAllowed, false);
assert.ok(verifyAtomicDataCellChecksum(snapWaiting.atomicCell!));
assertEthicsSafeCopy(snapWaiting.ethicsNotice, '12d09 ethics');
assert.doesNotMatch(snapWaiting.ethicsNotice, /physical portal|valuation theater|quantum advantage/i);
assert.match(snapWaiting.ethicsNotice, /software knowledge records|naming ALIGN/i);
assert.match(snapWaiting.ethicsNotice, /LOCAL\|CLOUD_SANDBOX|LOCAL|CLOUD_SANDBOX/);

const snapFresh = buildOfflineCommandCenterSnapshot({
  snapshotId: 'snap-off-2',
  tenantId: 'xiv',
  mobileReady: bundle.mobileReady,
  nowMs: now,
  provenance: { capturedAt: freshCaptured, source: 'architecture-reader-consumer' },
  expectedRemoteChecksum: snapWaiting.contentChecksum,
});
assert.equal(snapFresh.syncStatus, 'FRESH');
assert.equal(snapFresh.liveCloudSyncClaimed, false);

const snapConflict = buildOfflineCommandCenterSnapshot({
  snapshotId: 'snap-off-3',
  tenantId: 'xiv',
  mobileReady: bundle.mobileReady,
  nowMs: now,
  provenance: { capturedAt: freshCaptured, source: 'architecture-reader-consumer' },
  expectedRemoteChecksum: 'dg1:other',
});
assert.equal(snapConflict.syncStatus, 'CONFLICT');

const snapStale = buildOfflineCommandCenterSnapshot({
  snapshotId: 'snap-off-4',
  tenantId: 'xiv',
  mobileReady: bundle.mobileReady,
  nowMs: now,
  provenance: { capturedAt: staleCaptured, source: 'architecture-reader-consumer' },
  expectedRemoteChecksum: snapWaiting.contentChecksum,
});
assert.equal(snapStale.syncStatus, 'STALE');

// --- In-memory cache ---
const cache = new OfflineSnapshotCache();
cache.put(snapWaiting);
cache.put(snapFresh);
assert.equal(cache.size(), 2);
assert.equal(cache.get('snap-off-1')?.syncStatus, 'WAITING_SYNC');
const refreshed = cache.refreshSyncStatus('snap-off-1', {
  nowMs: now,
  expectedRemoteChecksum: snapWaiting.contentChecksum,
});
assert.equal(refreshed?.syncStatus, 'FRESH');
assert.equal(refreshed?.liveCloudSyncClaimed, false);

// --- Optional disk fixture ---
const fixtureJson = serializeOfflineSnapshotFixture(snapFresh);
assert.match(fixtureJson, /"liveCloudSyncClaimed": false/);
assert.match(fixtureJson, /"productionAutoApply": false/);
assert.match(fixtureJson, /LOCAL/);
const outDir = mkdtempSync(join(tmpdir(), 'xiv-12d09-'));
try {
  mkdirSync(outDir, { recursive: true });
  const path = join(outDir, 'offline-snapshot-fixture.json');
  writeFileSync(path, fixtureJson, 'utf8');
  const round = parseOfflineSnapshotFixture(readFileSync(path, 'utf8'), {
    nowMs: now,
    expectedRemoteChecksum: snapWaiting.contentChecksum,
  });
  assert.equal(round.syncStatus, 'FRESH');
  assert.equal(round.contentChecksum, snapFresh.contentChecksum);
  assert.equal(round.liveCloudSyncClaimed, false);
} finally {
  rmSync(outDir, { recursive: true, force: true });
}

// --- Atomic Data Cell standalone ---
const cell = buildAtomicDataCell({
  cellId: 'adc:demo',
  tenantId: 'xiv',
  body: { note: 'software knowledge record' },
  confidence: 0.7,
  graphLinks: [{ rel: 'correlates', targetCellId: 'adc:peer', correlationWeight: 0.2 }],
});
assert.equal(cell.readOnly, true);
assert.equal(cell.productionAutoApply, false);
assert.ok(verifyAtomicDataCellChecksum(cell));
assert.throws(
  () =>
    buildAtomicDataCell({
      cellId: 'adc:bad',
      tenantId: 'xiv',
      body: {},
      replication: { maxReplicas: 99 },
    }),
  /maxReplicas/,
);

console.log(
  'XIV 12D-09 offline snapshot cache contracts hold (FRESH|STALE|WAITING_SYNC|CONFLICT, no live cloud fabrication, Twin gates, Atomic Data Cells software-only).',
);
