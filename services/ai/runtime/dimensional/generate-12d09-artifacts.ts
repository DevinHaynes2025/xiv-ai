/**
 * Emit artifacts/12d09 offline snapshot fixture (optional local browse).
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  addCompany,
  addEconomicSignal,
  addSparseSimulationPathway,
  buildArchitectureReaderConsumer,
  buildArchitectureReaderSummary,
  buildOfflineSnapshotFromConsumer,
  createFounderTwinRoster,
  createSimulatedUniverse,
  createSpatialCoordinate,
  planRosterDutyCycle,
  registerTwinReplica,
  serializeOfflineSnapshotFixture,
} from './index';
import {
  buildCouncilQueueUxSummary,
  generateBatch,
  reprioritizeStoryQueue,
} from '../storyfactory';

const here = dirname(fileURLToPath(import.meta.url));
const outDir = join(here, '..', '..', '..', '..', 'artifacts', '12d09');
mkdirSync(outDir, { recursive: true });

let universe = createSimulatedUniverse({
  universeId: 'demo-offline',
  tenantId: 'xiv',
  label: '12D-09 offline snapshot demo',
});
universe = addCompany(universe, {
  companyId: 'co-1',
  name: 'Cache Mill',
  sector: 'ops',
  tenantId: 'xiv',
  location: createSpatialCoordinate({ lon: -87.6, lat: 41.8 }),
  memoryHeat: 'hot',
});
universe = addEconomicSignal(universe, {
  signalId: 'sig-1',
  metric: 'reliability',
  value: 0.91,
  unit: 'ratio',
  stance: 'OBSERVED',
});

const archSummary = buildArchitectureReaderSummary({ universe });
const batch = generateBatch(6, 9);
const queue = reprioritizeStoryQueue({
  stories: batch.stories,
  availability: [
    { agent: 'LOCAL_RULES', online: true, local: true, canNetwork: false, maxConcurrent: 10 },
    { agent: 'GROK', online: false, local: false, canNetwork: true, maxConcurrent: 3 },
  ],
});
const councilSummary = buildCouncilQueueUxSummary({ queue, stories: batch.stories });

let roster = createFounderTwinRoster({ tenantId: 'xiv', cycleId: 'cycle-12d09-demo' });
roster = registerTwinReplica(roster, {
  replicaId: 'twin-demo',
  kind: 'DIGITAL_TWIN',
  dutyCycle: 0.2,
  energyUsedThisCycle: 25,
  activeShardCount: 2,
});
roster = addSparseSimulationPathway(roster);
const dutyPlan = planRosterDutyCycle(roster);

const bundle = buildArchitectureReaderConsumer({
  architectureSummary: archSummary,
  councilSummary,
  roster,
  dutyPlan,
});

const snap = buildOfflineSnapshotFromConsumer(bundle, {
  snapshotId: 'demo-offline-1',
  tenantId: 'xiv',
  operator: 'generate-12d09-artifacts',
});

writeFileSync(join(outDir, 'offline-snapshot-fixture.json'), serializeOfflineSnapshotFixture(snap), 'utf8');
writeFileSync(
  join(outDir, 'offline-snapshot-preview.md'),
  [
    '# XIV 12D-09 Offline Snapshot Preview',
    '',
    snap.ethicsNotice,
    '',
    '- snapshotId: `' + snap.snapshotId + '`',
    '- syncStatus: **' + snap.syncStatus + '**',
    '- contentChecksum: `' + snap.contentChecksum + '`',
    '- liveCloudSyncClaimed: false',
    '- dutyCycleAware: ' + String(snap.dutyCycleAware),
    '- atomicCellChecksum: `' + (snap.atomicCell?.checksum ?? 'n/a') + '`',
    '',
  ].join('\n'),
  'utf8',
);

console.log('Wrote artifacts/12d09 offline snapshot fixture + preview');
