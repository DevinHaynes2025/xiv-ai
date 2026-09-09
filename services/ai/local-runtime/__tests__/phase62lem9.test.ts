/**
 * 62L-EM9 — Compute Resource Market Simulator acceptance tests.
 *
 * Simulation ≠ execute. UNKNOWN pricing honesty. NOT_TESTED research≠production.
 * Locality preference. Classical baseline for quantum-inspired hook.
 */

import test from 'node:test';
import assert from 'node:assert/strict';

import {
  assertEm9LocksIntact,
  EM9_LOCKS,
  EM9_DB_CANDIDATES_STATUS,
  EM9_HONESTY_BANNER,
  EM9_CORE_FLOW,
  NEXT_PHASE_EM10,
} from '../em9-honesty';
import { probeEm9SoftWires } from '../em9-soft-wire';
import {
  assertSimulationDoesNotExecute,
  classicalTradeoffScore,
  simulateComputeResourceMarket,
  runQuantumInspiredHook,
  type MarketCandidate,
} from '../compute-resource-market-simulator';
import {
  buildComputeNode,
  createComponentCapability,
  type ComputeNode,
  type MeasuredEvidence,
} from '../universal-compute-registry';

const NOW = '2026-09-09T14:00:00.000Z';
const FRESH = '2026-09-09T13:59:30.000Z';

function measured(
  kind: MeasuredEvidence['kind'],
  metric: string,
  value: number,
  unit: string,
  evidenceId?: string,
): MeasuredEvidence {
  return {
    kind,
    metric,
    value,
    unit,
    recordedAt: FRESH,
    evidenceId: evidenceId ?? `${kind}-${metric}-${value}`,
  };
}

function asusLocal(overrides: Partial<Parameters<typeof buildComputeNode>[0]> = {}): ComputeNode {
  return buildComputeNode({
    nodeId: 'asus-local-amd',
    owner: 'founder',
    tenantId: 'tenant-a',
    universeScope: 'universe-a',
    deviceType: 'heterogeneous',
    vendor: 'AMD',
    cpu: createComponentCapability({
      name: 'ASUS AMD CPU',
      vendor: 'AMD',
      verificationState: 'VERIFIED',
      measuredEvidence: [measured('benchmark', 'cpu_score', 120, 'idx')],
    }),
    gpu: createComponentCapability({
      name: 'AMD GPU',
      vendor: 'AMD',
      verificationState: 'VERIFIED',
      memoryBytes: 8 * 1024 ** 3,
      measuredEvidence: [measured('bounded_inference', 'tokens_per_sec', 35, 'tps')],
    }),
    npu: createComponentCapability({
      name: 'AMD NPU',
      vendor: 'AMD',
      verificationState: 'SUPPORTED',
      measuredEvidence: [measured('benchmark', 'npu_ops', 10, 'tops')],
    }),
    ramBytes: 32 * 1024 ** 3,
    executionProviders: ['CPUExecutionProvider', 'DmlExecutionProvider'],
    placement: 'local',
    privacyClass: 'private',
    latencyEvidence: [measured('latency', 'p50', 18, 'ms', 'lat-asus')],
    energyProxy: measured('energy', 'watts', 45, 'W', 'energy-asus'),
    costModel: {
      measured: [measured('cost', 'usd_per_hour', 0.02, 'USD/h', 'cost-asus')],
    },
    verificationState: 'VERIFIED',
    revocationState: 'ACTIVE',
    heartbeat: { observedAt: FRESH, running: true },
    now: NOW,
    ...overrides,
  });
}

function nvidiaWorkstation(
  overrides: Partial<Parameters<typeof buildComputeNode>[0]> = {},
): ComputeNode {
  return buildComputeNode({
    nodeId: 'nvidia-ws-1',
    owner: 'founder',
    tenantId: 'tenant-a',
    universeScope: 'universe-a',
    deviceType: 'gpu',
    vendor: 'NVIDIA',
    cpu: createComponentCapability({
      name: 'WS CPU',
      vendor: 'OTHER',
      verificationState: 'VERIFIED',
      measuredEvidence: [measured('benchmark', 'cpu_score', 140, 'idx')],
    }),
    gpu: createComponentCapability({
      name: 'NVIDIA GPU',
      vendor: 'NVIDIA',
      verificationState: 'VERIFIED',
      memoryBytes: 24 * 1024 ** 3,
      measuredEvidence: [measured('bounded_inference', 'tokens_per_sec', 80, 'tps')],
    }),
    ramBytes: 64 * 1024 ** 3,
    executionProviders: ['CUDAExecutionProvider'],
    placement: 'local',
    privacyClass: 'private',
    latencyEvidence: [measured('latency', 'p50', 12, 'ms', 'lat-nv')],
    energyProxy: measured('energy', 'watts', 220, 'W', 'energy-nv'),
    costModel: {
      measured: [measured('cost', 'usd_per_hour', 0.08, 'USD/h', 'cost-nv')],
    },
    verificationState: 'VERIFIED',
    revocationState: 'ACTIVE',
    heartbeat: { observedAt: FRESH, running: true },
    now: NOW,
    ...overrides,
  });
}

function authorizedEdge(
  overrides: Partial<Parameters<typeof buildComputeNode>[0]> = {},
): ComputeNode {
  return buildComputeNode({
    nodeId: 'edge-auth-1',
    owner: 'org',
    tenantId: 'tenant-a',
    universeScope: 'universe-a',
    deviceType: 'edge',
    vendor: 'OTHER',
    cpu: createComponentCapability({
      verificationState: 'VERIFIED',
      measuredEvidence: [measured('benchmark', 'cpu_score', 90, 'idx')],
    }),
    executionProviders: ['CPUExecutionProvider'],
    placement: 'edge',
    privacyClass: 'tenant',
    latencyEvidence: [measured('latency', 'p50', 40, 'ms', 'lat-edge')],
    costModel: {
      measured: [measured('cost', 'usd_per_hour', 0.15, 'USD/h', 'cost-edge')],
    },
    energyProxy: null,
    verificationState: 'VERIFIED',
    revocationState: 'ACTIVE',
    heartbeat: { observedAt: FRESH, running: true },
    now: NOW,
    ...overrides,
  });
}

function authorizedCloudUnknownPrice(
  overrides: Partial<Parameters<typeof buildComputeNode>[0]> = {},
): ComputeNode {
  return buildComputeNode({
    nodeId: 'cloud-gpu-auth',
    owner: 'cloud-provider',
    tenantId: 'tenant-a',
    universeScope: 'universe-a',
    deviceType: 'cloud_instance',
    vendor: 'NVIDIA',
    gpu: createComponentCapability({
      name: 'Cloud GPU',
      vendor: 'NVIDIA',
      verificationState: 'VERIFIED',
      measuredEvidence: [measured('bounded_inference', 'tokens_per_sec', 100, 'tps')],
    }),
    cpu: createComponentCapability({
      verificationState: 'VERIFIED',
      measuredEvidence: [measured('benchmark', 'cpu_score', 100, 'idx')],
    }),
    executionProviders: ['CUDAExecutionProvider'],
    placement: 'cloud',
    privacyClass: 'public_cloud',
    latencyEvidence: [],
    energyProxy: null,
    costModel: {
      // Catalog claim only — must NOT be used as estimate.
      claimedCostPerHourUsd: 2.5,
      measured: [],
    },
    cloudAuthorization: {
      explicitlyAuthorized: true,
      authorizedBy: 'founder',
      authorizedAt: FRESH,
    },
    verificationState: 'VERIFIED',
    revocationState: 'ACTIVE',
    heartbeat: { observedAt: FRESH, running: true },
    now: NOW,
    ...overrides,
  });
}

function notTestedResearchNode(): ComputeNode {
  return buildComputeNode({
    nodeId: 'research-npu-untested',
    owner: 'lab',
    tenantId: 'tenant-a',
    universeScope: 'universe-a',
    deviceType: 'npu',
    vendor: 'INTEL',
    npu: createComponentCapability({
      name: 'Intel NPU',
      vendor: 'INTEL',
      verificationState: 'NOT_TESTED',
    }),
    executionProviders: ['OpenVINOExecutionProvider'],
    placement: 'local',
    privacyClass: 'private',
    latencyEvidence: [],
    energyProxy: null,
    verificationState: 'NOT_TESTED',
    revocationState: 'ACTIVE',
    heartbeat: { observedAt: FRESH, running: true },
    now: NOW,
  });
}

function privateTask(
  overrides: Partial<Parameters<typeof simulateComputeResourceMarket>[1]['task']> = {},
) {
  return {
    taskId: 'task-em9-1',
    requestingTenantId: 'tenant-a',
    requestingUniverseScope: 'universe-a',
    privacyClass: 'private' as const,
    preferLocal: true,
    allowCloud: false,
    allowEdge: true,
    now: NOW,
    ...overrides,
  };
}

test('EM9 honesty locks intact; L4 false; simulation≠execute', () => {
  assert.equal(assertEm9LocksIntact(), true);
  assert.equal(EM9_LOCKS.L4_AUTONOMY_ENABLED, false);
  assert.equal(EM9_LOCKS.SIMULATION_EXECUTES_WORKLOAD, false);
  assert.equal(EM9_LOCKS.RECOMMEND_EQUALS_EXECUTE, false);
  assert.equal(EM9_LOCKS.FABRICATE_CLOUD_PRICES, false);
  assert.equal(EM9_LOCKS.AUTONOMOUS_PURCHASING, false);
  assert.equal(EM9_LOCKS.AUTONOMOUS_PROVISIONING, false);
  assert.equal(EM9_LOCKS.CHEAPEST_AUTOMATICALLY_BEST, false);
  assert.equal(EM9_LOCKS.NOT_TESTED_RECOMMENDABLE_AS_VERIFIED_PRODUCTION, false);
  assert.equal(EM9_LOCKS.QUANTUM_ADVANTAGE_CLAIMED, false);
  assert.equal(EM9_DB_CANDIDATES_STATUS, 'NOT_APPLIED');
  assert.match(EM9_HONESTY_BANNER, /DOCUMENTED/);
  assert.ok(EM9_CORE_FLOW.includes('SIMULATE_CANDIDATE_ROUTES'));
  assert.ok(EM9_CORE_FLOW.includes('EXECUTE_SEPARATELY'));
  assert.match(NEXT_PHASE_EM10, /EM10/);
});

test('soft-wire EM3 registry + EL9 governor present; EM7/EM8 honest ABSENT-or-PRESENT', () => {
  const probe = probeEm9SoftWires();
  assert.equal(probe.em3Registry, 'PRESENT');
  assert.equal(probe.em3Honesty, 'PRESENT');
  assert.equal(probe.el9ResourceGovernor, 'PRESENT');
  assert.equal(probe.classicalQuantBaseline, 'PRESENT');
  assert.ok(probe.em7Router === 'PRESENT' || probe.em7Router === 'ABSENT');
  assert.ok(probe.em8Receipts === 'PRESENT' || probe.em8Receipts === 'ABSENT');
  assert.equal(probe.simulationExecutesWorkload, false);
  assert.equal(probe.l4AutonomyEnabled, false);
  assert.equal(probe.fabricateCloudPrices, false);
  assert.equal(probe.autonomousPurchasing, false);
  assert.equal(probe.guardianRlsTenantBoundariesIntact, true);
  assert.equal(probe.universeBoundariesIntact, true);
});

test('simulation does not execute workload; recommend ≠ execute', () => {
  const result = simulateComputeResourceMarket(
    [asusLocal(), nvidiaWorkstation(), authorizedEdge()],
    { task: privateTask(), consequential: true, now: NOW },
  );
  assert.equal(result.executedWorkload, false);
  assert.equal(result.purchasedOrProvisioned, false);
  assert.equal(result.gate.recommendEqualsExecute, false);
  assert.equal(result.gate.status, 'PENDING_HUMAN_OR_POLICY');
  assert.equal(assertSimulationDoesNotExecute(result), true);
  assert.ok(result.recommended);
  assert.equal(result.recommended?.verificationState, 'VERIFIED');
});

test('UNKNOWN when cloud pricing/capacity unavailable — never fabricate', () => {
  const cloud = authorizedCloudUnknownPrice();
  const result = simulateComputeResourceMarket([cloud], {
    task: privateTask({
      privacyClass: 'public_cloud',
      preferLocal: false,
      allowCloud: true,
    }),
    now: NOW,
  });
  const cand =
    result.productionCandidates.find((c) => c.nodeId === 'cloud-gpu-auth') ??
    result.researchCandidates.find((c) => c.nodeId === 'cloud-gpu-auth');
  assert.ok(cand);
  assert.equal(cand!.estimatedCost, 'UNKNOWN');
  assert.equal(cand!.measuredCapacity, 'UNKNOWN');
  assert.equal(cand!.estimatedLatency, 'UNKNOWN');
  assert.equal(result.fabricatedPrices, false);
  assert.equal(result.fabricatedCapacity, false);
  // Catalog claim must not leak into estimate.
  assert.notEqual(cand!.estimatedCost, 2.5);
});

test('local/private workloads prefer locality over cheaper remote', () => {
  const cheapCloud = authorizedCloudUnknownPrice({
    nodeId: 'cloud-cheap-measured',
    costModel: {
      measured: [measured('cost', 'usd_per_hour', 0.001, 'USD/h', 'cost-cloud-cheap')],
    },
    latencyEvidence: [measured('latency', 'p50', 5, 'ms', 'lat-cloud')],
  });
  const local = asusLocal();
  const result = simulateComputeResourceMarket([cheapCloud, local], {
    task: privateTask({ allowCloud: false }),
    now: NOW,
  });
  assert.equal(result.localityPreferenceApplied, true);
  assert.equal(result.recommended?.nodeId, 'asus-local-amd');
  assert.equal(result.cheapestNodeId, 'cloud-cheap-measured');
  assert.equal(result.cheapestIsRecommended, false);
  assert.equal(EM9_LOCKS.CHEAPEST_AUTOMATICALLY_BEST, false);
});

test('cheapest verified local is not auto-best when privacy/reliability dominate', () => {
  const cheapButWeaker = asusLocal({
    nodeId: 'local-cheap-weak',
    costModel: {
      measured: [measured('cost', 'usd_per_hour', 0.001, 'USD/h', 'cost-weak')],
    },
    latencyEvidence: [measured('latency', 'p50', 80, 'ms', 'lat-weak')],
    energyProxy: measured('energy', 'watts', 90, 'W', 'energy-weak'),
  });
  const stronger = nvidiaWorkstation();
  // Both local/private — classical score should prefer reliability/latency balance,
  // and cheapest flag must remain independent of recommendation.
  const result = simulateComputeResourceMarket([cheapButWeaker, stronger], {
    task: privateTask(),
    historicalBenchmarks: [
      {
        nodeId: 'nvidia-ws-1',
        metric: 'reliability_success_rate',
        value: 0.99,
        unit: 'ratio',
        recordedAt: FRESH,
        evidenceId: 'rel-nv',
      },
      {
        nodeId: 'local-cheap-weak',
        metric: 'reliability_success_rate',
        value: 0.55,
        unit: 'ratio',
        recordedAt: FRESH,
        evidenceId: 'rel-weak',
      },
    ],
    now: NOW,
  });
  assert.equal(result.cheapestNodeId, 'local-cheap-weak');
  assert.ok(result.recommended);
  // Privacy/correctness/reliability-first: stronger reliability should win classical score.
  assert.equal(result.recommended?.nodeId, 'nvidia-ws-1');
  assert.equal(result.cheapestIsRecommended, false);
});

test('NOT_TESTED may appear as research candidate but cannot be production recommended', () => {
  const result = simulateComputeResourceMarket(
    [notTestedResearchNode(), asusLocal()],
    { task: privateTask(), now: NOW },
  );
  const research = result.researchCandidates.find(
    (c) => c.nodeId === 'research-npu-untested',
  );
  assert.ok(research);
  assert.equal(research!.lane, 'research');
  assert.equal(research!.verificationState, 'NOT_TESTED');
  assert.notEqual(result.recommended?.nodeId, 'research-npu-untested');
  assert.equal(result.recommended?.lane, 'production_eligible');
  assert.ok(
    !result.rankedProduction.some(
      (c) => c.nodeId === 'research-npu-untested' && c.lane === 'production_eligible',
    ),
  );
});

test('historical benchmarks without timestamps are rejected', () => {
  const result = simulateComputeResourceMarket([asusLocal()], {
    task: privateTask(),
    historicalBenchmarks: [
      {
        nodeId: 'asus-local-amd',
        metric: 'latency_p50',
        value: 9,
        unit: 'ms',
        recordedAt: '',
        evidenceId: 'bad-hist',
      },
      {
        nodeId: 'asus-local-amd',
        metric: 'reliability_success_rate',
        value: 0.97,
        unit: 'ratio',
        recordedAt: FRESH,
        evidenceId: 'good-hist',
      },
    ],
    now: NOW,
  });
  assert.ok(result.rejectedBenchmarks.some((r) => r.evidenceId === 'bad-hist'));
  assert.ok(result.recommended?.evidenceRefs.includes('good-hist'));
});

test('Guardian/RLS/tenant/Universe boundaries enforced — cross-tenant skipped', () => {
  const foreign = asusLocal({
    nodeId: 'foreign-node',
    tenantId: 'tenant-b',
    universeScope: 'universe-b',
  });
  const result = simulateComputeResourceMarket([foreign, asusLocal()], {
    task: privateTask(),
    now: NOW,
  });
  assert.ok(!result.productionCandidates.some((c) => c.nodeId === 'foreign-node'));
  assert.ok(!result.researchCandidates.some((c) => c.nodeId === 'foreign-node'));
  assert.equal(result.recommended?.nodeId, 'asus-local-amd');
});

test('no autonomous purchasing or provisioning from simulation', () => {
  const result = simulateComputeResourceMarket([authorizedCloudUnknownPrice()], {
    task: privateTask({
      privacyClass: 'public_cloud',
      preferLocal: false,
      allowCloud: true,
    }),
    consequential: true,
    now: NOW,
  });
  assert.equal(result.purchasedOrProvisioned, false);
  assert.equal(EM9_LOCKS.AUTONOMOUS_PURCHASING, false);
  assert.equal(EM9_LOCKS.AUTONOMOUS_PROVISIONING, false);
  assert.equal(EM9_LOCKS.AUTOMATIC_CAPACITY_PURCHASE, false);
  assert.equal(result.gate.required, true);
});

test('quantum-inspired hook compares against classical baseline without advantage claim', () => {
  const local = asusLocal();
  const edge = authorizedEdge();
  const sim = simulateComputeResourceMarket([local, edge], {
    task: privateTask({ allowEdge: true }),
    enableQuantumInspiredHook: true,
    now: NOW,
  });
  assert.equal(sim.quantumHook.attempted, true);
  assert.equal(sim.quantumHook.classicalBaselinePassed, true);
  assert.equal(sim.quantumHook.quantumAdvantageClaimed, false);
  assert.equal(sim.quantumHook.matchesClassicalTop, true);
  assert.match(sim.quantumHook.reason, /no quantum advantage/i);

  const ranked: MarketCandidate[] = sim.rankedProduction;
  const hook = runQuantumInspiredHook(ranked, true);
  assert.equal(hook.quantumAdvantageClaimed, false);
  assert.equal(hook.classicalTopNodeId, ranked[0]?.nodeId ?? null);
});

test('candidate return fields present for production recommend', () => {
  const result = simulateComputeResourceMarket([asusLocal(), nvidiaWorkstation()], {
    task: privateTask(),
    queueHints: { 'asus-local-amd': 1 },
    now: NOW,
  });
  const c = result.recommended;
  assert.ok(c);
  assert.equal(typeof c!.nodeId, 'string');
  assert.ok(c!.device);
  assert.equal(typeof c!.verificationState, 'string');
  assert.ok(c!.estimatedLatency === 'UNKNOWN' || typeof c!.estimatedLatency === 'number');
  assert.ok(c!.estimatedCost === 'UNKNOWN' || typeof c!.estimatedCost === 'number');
  assert.equal(typeof c!.privacyScore, 'number');
  assert.equal(typeof c!.reliabilityScore, 'number');
  assert.ok(c!.energyProxy === 'UNKNOWN' || typeof c!.energyProxy === 'number');
  assert.ok(c!.queueEstimate === 'UNKNOWN' || typeof c!.queueEstimate === 'number');
  assert.equal(typeof c!.confidence, 'number');
  assert.ok(Array.isArray(c!.evidenceRefs));
  assert.equal(result.compareDimensions.length, 13);
});

test('classical tradeoff score prefers privacy/reliability over raw cost', () => {
  const privateLocal: MarketCandidate = {
    nodeId: 'a',
    device: {
      placement: 'local',
      vendor: 'AMD',
      deviceType: 'heterogeneous',
      cpuPresent: true,
      gpuPresent: true,
      npuPresent: true,
      label: 'local',
    },
    verificationState: 'VERIFIED',
    estimatedLatency: 20,
    estimatedCost: 1.0,
    privacyScore: 1,
    reliabilityScore: 0.95,
    energyProxy: 40,
    queueEstimate: 0,
    confidence: 0.9,
    evidenceRefs: [],
    lane: 'production_eligible',
    localityFit: 1,
    networkDependence: 0.05,
    dataEgressImpact: 0,
    fallbackQuality: 0.9,
    classicalScore: 0,
    measuredCapacity: 1,
    denialCodes: [],
    reasons: [],
  };
  const cheapCloud: MarketCandidate = {
    ...privateLocal,
    nodeId: 'b',
    device: { ...privateLocal.device, placement: 'cloud', label: 'cloud' },
    estimatedCost: 0.01,
    privacyScore: 0.15,
    reliabilityScore: 0.5,
    localityFit: 0.2,
    networkDependence: 0.9,
    dataEgressImpact: 'UNKNOWN',
  };
  assert.ok(classicalTradeoffScore(privateLocal) > classicalTradeoffScore(cheapCloud));
});
