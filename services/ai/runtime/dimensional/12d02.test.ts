import assert from 'node:assert/strict';
import {
  ATOMIC_SCALE_STORAGE_CLAIM,
  BIOLOGICAL_DNA_CLONING_CAPABILITY,
  CURRENT_DIMENSIONAL_MILESTONE,
  DATAGENE_SCHEMA_VERSION,
  DEFAULT_QPU_STATUS,
  DIMENSION_LADDER,
  PHYSICAL_PORTAL_CAPABILITY,
  PRODUCTION_DIMENSIONAL_FABRIC_ENABLED,
  RESEARCH_DIMENSION_CEILING,
  SHARD_COMPRESSED_CAPS,
  asPathwayEdges,
  assertDeviceDoesNotHoldGlobalBrain,
  bridgeHistoricalRef,
  bridgeHistoricalRefs,
  createDataGene,
  createDimensionLadderBenchmarks,
  createLocalQuantumSimulator,
  createMemoryShard,
  createWaitingQpuAdapter,
  evidenceScoreForRef,
  findPathway,
  isomorphicContentHash,
  runDimensionBenchmarks,
} from './index';

assert.equal(CURRENT_DIMENSIONAL_MILESTONE, 12);
assert.equal(RESEARCH_DIMENSION_CEILING, 100);
assert.equal(PRODUCTION_DIMENSIONAL_FABRIC_ENABLED, false);
assert.equal(PHYSICAL_PORTAL_CAPABILITY, false);
assert.equal(ATOMIC_SCALE_STORAGE_CLAIM, false);
assert.equal(BIOLOGICAL_DNA_CLONING_CAPABILITY, false);

// --- DataGene ---
const geneA = createDataGene({
  id: 'kg-unit-1',
  body: { topic: 'silk-road-trade', year: -200 },
  provenance: ['historical:authorized-demo'],
  createdAt: '2026-09-09T00:00:00.000Z',
});
const geneB = createDataGene({
  id: 'kg-unit-1',
  body: { year: -200, topic: 'silk-road-trade' },
  provenance: ['historical:authorized-demo'],
  createdAt: '2026-09-09T00:00:00.000Z',
});
assert.equal(geneA.schemaVersion, DATAGENE_SCHEMA_VERSION);
assert.equal(geneA.contentHash, geneB.contentHash);
assert.ok(geneA.contentHash.startsWith('dg1:'));
assert.ok(geneA.provenance.includes('analogy:data-gene-not-biological-dna'));
assert.notEqual(isomorphicContentHash('a'), isomorphicContentHash('b'));

// --- Memory shards ---
const phoneShard = createMemoryShard({
  shardId: 'phone-pocket-1',
  tier: 'device',
  kind: 'compressed-knowledge',
  contentHashes: [geneA.contentHash],
  offlineAllowed: true,
});
assert.equal(phoneShard.holdsGlobalBrain, false);
assert.ok(phoneShard.compressedByteCap <= SHARD_COMPRESSED_CAPS.device);
assertDeviceDoesNotHoldGlobalBrain(phoneShard);
assert.throws(
  () =>
    createMemoryShard({
      shardId: 'overflow',
      tier: 'device',
      kind: 'index',
      compressedByteCap: SHARD_COMPRESSED_CAPS.device + 1,
    }),
  RangeError,
);

const globalShard = createMemoryShard({
  shardId: 'global-fed-1',
  tier: 'global',
  kind: 'index',
});
assert.equal(globalShard.holdsGlobalBrain, false);

// --- Historical bridge ---
const observed = bridgeHistoricalRef({
  refId: 'doc-primary',
  relatedRefId: 'fact-normalized',
  stance: 'OBSERVED',
  rawEvidence: 0.95,
});
assert.equal(observed.stance, 'OBSERVED');
assert.equal(observed.autoVerified, false);
assert.ok(observed.evidenceScore >= 0.85);

const ancient = bridgeHistoricalRef({
  refId: 'ancient-tablet',
  relatedRefId: 'trade-route-hypothesis',
  stance: 'HYPOTHESIS',
  ancientSource: true,
  rawEvidence: 0.99,
});
assert.equal(ancient.autoVerified, false);
assert.ok(ancient.evidenceScore <= 0.4);
assert.equal(evidenceScoreForRef({ refId: 'x', stance: 'SIMULATION', rawEvidence: 1 }), 0.35);

const bridged = bridgeHistoricalRefs([
  {
    refId: 'ancient-source',
    relatedRefId: 'normalized-fact',
    stance: 'OBSERVED',
    ancientSource: true,
    curatorVerified: true,
    weight: 2,
    rawEvidence: 0.9,
  },
  {
    refId: 'normalized-fact',
    relatedRefId: 'business-hypothesis',
    stance: 'HYPOTHESIS',
    weight: 3,
    rawEvidence: 0.45,
  },
]);
const edges = asPathwayEdges(bridged);
const pathway = findPathway(edges, 'ancient-source', 'business-hypothesis', 0.3);
assert.ok(pathway);
assert.deepEqual(pathway?.path, ['ancient-source', 'normalized-fact', 'business-hypothesis']);

// --- Benchmarks ---
assert.deepEqual([...DIMENSION_LADDER], [3, 6, 12, 24, 50, 100]);
const stubs = createDimensionLadderBenchmarks();
assert.equal(stubs.length, 6);
for (const stub of stubs) {
  assert.equal(stub.status, 'NOT_RUN');
  assert.equal(stub.executedAt, null);
  assert.equal(stub.metrics.latencyMs, null);
}
const stillNotRun = runDimensionBenchmarks({ dimensions: [12, 100] });
assert.ok(stillNotRun.every((r) => r.status === 'NOT_RUN'));

// --- Quantum simulator ---
assert.equal(DEFAULT_QPU_STATUS, 'WAITING_PROVIDER');
const sim = createLocalQuantumSimulator(8);
const simResult = sim.submit({
  circuitId: 'bell-stub',
  qubitCount: 2,
  depth: 2,
  gates: ['H', 'CNOT'],
});
assert.equal(simResult.backend, 'local-simulator');
assert.equal(simResult.liveQpu, false);
assert.equal(simResult.status, 'COMPLETED');
assert.ok(simResult.samples);

const qpu = createWaitingQpuAdapter('example-cloud-qpu');
const qpuResult = qpu.submit({
  circuitId: 'qpu-attempt',
  qubitCount: 4,
  depth: 10,
  gates: ['H'],
});
assert.equal(qpuResult.providerStatus, 'WAITING_PROVIDER');
assert.equal(qpuResult.liveQpu, false);
assert.equal(qpuResult.status, 'REJECTED');
assert.equal(qpuResult.samples, null);

console.log('XIV 12D-02 atomic knowledge + historical memory fabric contracts hold (research-only, L4=false).');