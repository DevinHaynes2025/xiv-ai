import assert from 'node:assert/strict';
import {
  ATOMIC_SCALE_STORAGE_CLAIM,
  BIOLOGICAL_DNA_CLONING_CAPABILITY,
  CURRENT_DIMENSIONAL_MILESTONE,
  PHYSICAL_PORTAL_CAPABILITY,
  PRODUCTION_DIMENSIONAL_FABRIC_ENABLED,
  RESEARCH_DIMENSION_CEILING,
  bridgeHistoricalRef,
  createDataGene,
  createDimensionLadderBenchmarks,
  createLocalQuantumSimulator,
  createMemoryShard,
  createPoint,
  createWaitingQpuAdapter,
  findPathway,
  projectPoint,
  routeWorkload,
} from './index';

assert.equal(CURRENT_DIMENSIONAL_MILESTONE, 12);
assert.equal(RESEARCH_DIMENSION_CEILING, 100);
assert.equal(PRODUCTION_DIMENSIONAL_FABRIC_ENABLED, false);
assert.equal(PHYSICAL_PORTAL_CAPABILITY, false);
assert.equal(ATOMIC_SCALE_STORAGE_CLAIM, false);
assert.equal(BIOLOGICAL_DNA_CLONING_CAPABILITY, false);

const point12 = createPoint(Array.from({ length: 12 }, (_, index) => index));
assert.equal(point12.dimensions, 12);
assert.equal(projectPoint(point12, 6).coordinates.length, 6);
assert.equal(projectPoint(point12, 20).coordinates.length, 20);
assert.throws(() => createPoint([]), RangeError);
assert.throws(() => createPoint(Array(101).fill(0)), RangeError);

const route = routeWorkload(
  {
    id: 'scenario-12d',
    dimensions: 12,
    operation: 'simulate',
    offlineAllowed: true,
    sensitivity: 'internal',
  },
  [
    {
      deviceId: 'verified-edge-1',
      silicon: 'generic',
      backends: ['cpu'],
      maxLogicalDimensions: 12,
      offlineReady: true,
      verified: true,
    },
  ],
);
assert.equal(route?.deviceId, 'verified-edge-1');
assert.equal(route?.productionAuthorized, false);

assert.equal(
  routeWorkload(
    {
      id: 'qpu-research',
      dimensions: 12,
      operation: 'optimize',
      requiredBackend: 'qpu',
      offlineAllowed: false,
      sensitivity: 'internal',
    },
    [{
      deviceId: 'unverified-qpu',
      silicon: 'generic',
      backends: ['qpu'],
      maxLogicalDimensions: 100,
      offlineReady: false,
      verified: false,
    }],
  ),
  null,
);

const pathway = findPathway([
  { from: 'ancient-source', to: 'normalized-fact', weight: 2, evidenceScore: 0.9 },
  { from: 'normalized-fact', to: 'business-hypothesis', weight: 3, evidenceScore: 0.8 },
  { from: 'ancient-source', to: 'unsupported-leap', weight: 0.1, evidenceScore: 0.1 },
], 'ancient-source', 'business-hypothesis', 0.5);
assert.deepEqual(pathway?.path, ['ancient-source', 'normalized-fact', 'business-hypothesis']);
assert.equal(pathway?.totalWeight, 5);
assert.equal(pathway?.minimumEvidence, 0.8);

// 12D-02 smoke: exports resolve; production/honesty flags unchanged
assert.ok(createDataGene({ id: 'smoke', body: { ok: true } }).contentHash.startsWith('dg1:'));
assert.equal(createMemoryShard({ shardId: 'd1', tier: 'device', kind: 'index' }).holdsGlobalBrain, false);
assert.equal(bridgeHistoricalRef({ refId: 'a', stance: 'SIMULATION' }).autoVerified, false);
assert.ok(createDimensionLadderBenchmarks().every((b) => b.status === 'NOT_RUN'));
assert.equal(createLocalQuantumSimulator().providerStatus, 'AVAILABLE_SIMULATOR');
assert.equal(createWaitingQpuAdapter().providerStatus, 'WAITING_PROVIDER');

console.log('XIV 12D dimensional intelligence fabric contracts hold (research-only).');