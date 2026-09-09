/**
 * 62L-EW6 — Cross-Chip Capability Graph v2 required honesty tests.
 * Script: npm run test:62lew6
 *
 * 1. DOCUMENTED cannot satisfy VERIFIED
 * 2. DETECTED cannot satisfy VERIFIED
 * 3. VERIFIED CPU route can be selected
 * 4. NOT_TESTED GPU/NPU excluded when verification required
 * 5. fallback records requested vs actual
 * 6. stale benchmark lowers eligibility
 * 7. cross-tenant graph access denied
 * 8. cross-Universe graph access denied
 * 9. proprietary/restricted evidence rejected
 * 10. L4 remains false
 */

import assert from 'node:assert/strict';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';

import {
  EW6_LOCKS,
  NEXT_STORY_TITLE,
  applyEvidence,
  applyNeuralPathwayUpdate,
  assertEw6LocksIntact,
  createCapabilityGraph,
  createEvidenceStore,
  demoteIfStale,
  detectedSatisfiesVerified,
  deviceNodeId,
  documentedSatisfiesVerified,
  ew6SoftWireSnapshot,
  recordFallbackReceipt,
  routeCapabilities,
  runCrossChipCapabilityGraphCycle,
  satisfiesMinimumState,
  selectBestPath,
  type TenantScope,
} from './index.ts';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '../../../..');

const scopeA: TenantScope = {
  orgId: 'org-a',
  tenantId: 'tenant-a',
  universeId: 'uni-a',
};

const scopeB: TenantScope = {
  orgId: 'org-b',
  tenantId: 'tenant-b',
  universeId: 'uni-b',
};

const scopeAUniB: TenantScope = {
  orgId: 'org-a',
  tenantId: 'tenant-a',
  universeId: 'uni-b',
};

test('SoT EW6 / #169; next EW7 AMD Local Communication Adapter; locks', () => {
  assert.equal(assertEw6LocksIntact(), true);
  assert.match(NEXT_STORY_TITLE, /EW7/);
  assert.match(NEXT_STORY_TITLE, /AMD Local Communication Adapter/);
  assert.equal(EW6_LOCKS.SEPARATE_VENDOR_BRAINS, false);
  assert.equal(EW6_LOCKS.SECOND_ORCHESTRATION_FRAMEWORK, false);
});

test('1) DOCUMENTED cannot satisfy VERIFIED', () => {
  assert.equal(documentedSatisfiesVerified('DOCUMENTED'), false);
  assert.equal(satisfiesMinimumState('DOCUMENTED', 'VERIFIED'), false);
  assert.equal(EW6_LOCKS.DOCUMENTED_EQ_VERIFIED, false);

  const graph = createCapabilityGraph();
  graph.seedSharedSkeleton(scopeA);
  const cpuId = deviceNodeId(scopeA, 'amd-cpu-candidate');
  graph.updateNodeEvidence(cpuId, scopeA, { evidenceState: 'DOCUMENTED' });

  const routed = routeCapabilities(graph, {
    requestId: 'req-doc',
    workloadId: 'wl-doc',
    workloadLabel: 'doc workload',
    minimumState: 'VERIFIED',
    localOnly: true,
    onnxCompatible: true,
    privacy: 'TENANT_PRIVATE',
    preferredAcceleratorClasses: ['CPU'],
    scope: scopeA,
  });
  assert.equal(routed.eligible.length, 0);
  assert.ok(
    routed.excluded.some((e) =>
      e.reason.includes('VERIFIED_REQUIRED_EXCLUDES_DOCUMENTED'),
    ),
  );
});

test('2) DETECTED cannot satisfy VERIFIED', () => {
  assert.equal(detectedSatisfiesVerified('DETECTED'), false);
  assert.equal(satisfiesMinimumState('DETECTED', 'VERIFIED'), false);
  assert.equal(EW6_LOCKS.DETECTED_EQ_VERIFIED, false);

  const graph = createCapabilityGraph();
  graph.seedSharedSkeleton(scopeA);
  const cpuId = deviceNodeId(scopeA, 'intel-cpu-candidate');
  graph.updateNodeEvidence(cpuId, scopeA, { evidenceState: 'DETECTED' });

  const routed = routeCapabilities(graph, {
    requestId: 'req-det',
    workloadId: 'wl-det',
    workloadLabel: 'detected workload',
    minimumState: 'VERIFIED',
    preferredAcceleratorClasses: ['CPU'],
    scope: scopeA,
  });
  assert.equal(
    routed.eligible.every((p) => p.evidenceState === 'VERIFIED'),
    true,
  );
  assert.ok(
    routed.excluded.some((e) =>
      e.reason.includes('VERIFIED_REQUIRED_EXCLUDES_DETECTED'),
    ),
  );
});

test('3) VERIFIED CPU route can be selected', () => {
  const graph = createCapabilityGraph();
  graph.seedSharedSkeleton(scopeA);
  const cpuId = deviceNodeId(scopeA, 'amd-cpu-candidate');
  const store = createEvidenceStore();
  const applied = applyEvidence(graph, store, {
    evidenceId: 'ev-cpu-runtime',
    evidenceClass: 'BOUNDED_RUNTIME_TEST',
    targetNodeId: cpuId,
    kind: 'bounded_runtime_test',
    fresh: true,
    staleAfterMs: 86_400_000,
    recordedAt: new Date().toISOString(),
    scope: scopeA,
    notes: 'bounded CPU runtime evidence',
    benchmarkRef: 'bench-cpu-1',
  });
  assert.equal(applied.ok, true);
  if (applied.ok) {
    assert.equal(applied.appliedState, 'VERIFIED');
  }

  // Also mark a matching runtime DOCUMENTED→ usable
  const routed = routeCapabilities(graph, {
    requestId: 'req-cpu-verified',
    workloadId: 'wl-cpu',
    workloadLabel: 'verified cpu workload',
    minimumState: 'VERIFIED',
    localOnly: true,
    onnxCompatible: true,
    memoryRequiredMb: 1024,
    privacy: 'TENANT_PRIVATE',
    preferredAcceleratorClasses: ['CPU'],
    scope: scopeA,
  });
  const best = selectBestPath(routed);
  assert.ok(best);
  assert.equal(best!.evidenceState, 'VERIFIED');
  assert.equal(best!.acceleratorClass, 'CPU');
  assert.ok(best!.reasons.includes('RUNTIME_EVIDENCE_VERIFIED'));
});

test('4) NOT_TESTED GPU/NPU excluded when verification required', () => {
  const graph = createCapabilityGraph();
  graph.seedSharedSkeleton(scopeA);

  // Ensure AMD GPU/NPU remain NOT_TESTED (honest default).
  const gpuId = deviceNodeId(scopeA, 'amd-gpu-candidate');
  const npuId = deviceNodeId(scopeA, 'amd-npu-candidate');
  const gpu = graph.getNode(gpuId, scopeA);
  const npu = graph.getNode(npuId, scopeA);
  assert.equal(gpu.ok, true);
  assert.equal(npu.ok, true);
  if (gpu.ok) assert.equal(gpu.value.evidenceState, 'NOT_TESTED');
  if (npu.ok) assert.equal(npu.value.evidenceState, 'NOT_TESTED');

  const routed = routeCapabilities(graph, {
    requestId: 'req-accel',
    workloadId: 'wl-accel',
    workloadLabel: 'accel workload',
    minimumState: 'VERIFIED',
    preferredAcceleratorClasses: ['GPU', 'NPU'],
    scope: scopeA,
  });
  assert.equal(routed.eligible.length, 0);
  assert.ok(
    routed.excluded.some(
      (e) =>
        e.deviceNodeId === gpuId &&
        e.reason.includes('VERIFIED_REQUIRED_EXCLUDES_NOT_TESTED'),
    ),
  );
  assert.ok(
    routed.excluded.some(
      (e) =>
        e.deviceNodeId === npuId &&
        e.reason.includes('VERIFIED_REQUIRED_EXCLUDES_NOT_TESTED'),
    ),
  );
});

test('5) fallback records requested vs actual', () => {
  const graph = createCapabilityGraph();
  graph.seedSharedSkeleton(scopeA);
  const npuId = deviceNodeId(scopeA, 'amd-npu-candidate');
  const cpuId = deviceNodeId(scopeA, 'amd-cpu-candidate');

  // CPU may be advanced to VERIFIED / PASS independently.
  graph.updateNodeEvidence(cpuId, scopeA, {
    evidenceState: 'VERIFIED',
    confidence: 0.9,
    lastVerifiedAt: new Date().toISOString(),
  });

  const receipt = recordFallbackReceipt({
    graph,
    receiptId: 'fb-amd-npu-to-cpu',
    requestedDeviceNodeId: npuId,
    actualDeviceNodeId: cpuId,
    actualOutcome: 'PASS',
    scope: scopeA,
    notes: 'requested=AMD_NPU actual=CPU',
  });
  assert.equal('ok' in receipt && receipt.ok === false, false);
  if (!('ok' in receipt)) {
    assert.equal(receipt.fallbackUsed, true);
    assert.equal(receipt.actualOutcome, 'PASS');
    assert.equal(receipt.requestedRemainsUnverified, true);
    assert.equal(receipt.requestedState, 'NOT_TESTED');
    assert.equal(receipt.actualState, 'VERIFIED');
    assert.match(receipt.requestedLabel, /NPU/i);
    assert.match(receipt.actualLabel, /CPU/i);
  }

  const npuAfter = graph.getNode(npuId, scopeA);
  assert.equal(npuAfter.ok, true);
  if (npuAfter.ok) {
    assert.notEqual(npuAfter.value.evidenceState, 'VERIFIED');
    assert.equal(npuAfter.value.evidenceState, 'NOT_TESTED');
  }
});

test('6) stale benchmark lowers eligibility', () => {
  const graph = createCapabilityGraph();
  graph.seedSharedSkeleton(scopeA);
  const cpuId = deviceNodeId(scopeA, 'amd-cpu-candidate');
  graph.updateNodeEvidence(cpuId, scopeA, {
    evidenceState: 'VERIFIED',
    confidence: 0.95,
    freshness: 1,
    lastVerifiedAt: new Date(Date.now() - 120_000).toISOString(),
    benchmarkRefs: ['bench-old'],
  });

  const staleEvidence = {
    evidenceId: 'ev-stale-bench',
    evidenceClass: 'BENCHMARK_RECEIPT' as const,
    targetNodeId: cpuId,
    kind: 'benchmark' as const,
    fresh: true,
    staleAfterMs: 1,
    recordedAt: new Date(Date.now() - 60_000).toISOString(),
    scope: scopeA,
    notes: 'expired benchmark',
    benchmarkRef: 'bench-old',
  };

  const demotion = demoteIfStale({
    graph,
    nodeId: cpuId,
    scope: scopeA,
    evidence: staleEvidence,
  });
  assert.equal(demotion.demoted, true);
  assert.equal(demotion.previousState, 'VERIFIED');
  assert.equal(demotion.nextState, 'STALE');

  const routed = routeCapabilities(graph, {
    requestId: 'req-stale',
    workloadId: 'wl-stale',
    workloadLabel: 'stale workload',
    minimumState: 'VERIFIED',
    preferredAcceleratorClasses: ['CPU'],
    scope: scopeA,
  });
  assert.ok(
    routed.excluded.some(
      (e) =>
        e.deviceNodeId === cpuId &&
        e.reason.includes('STALE_BENCHMARK_LOWERS_ELIGIBILITY'),
    ),
  );
  assert.equal(
    routed.eligible.some((p) => p.deviceNodeId === cpuId),
    false,
  );
});

test('7) cross-tenant graph access denied', () => {
  const graph = createCapabilityGraph();
  graph.seedSharedSkeleton(scopeA);
  const cpuId = deviceNodeId(scopeA, 'amd-cpu-candidate');

  const denied = graph.getNode(cpuId, scopeB);
  assert.equal(denied.ok, false);
  if (!denied.ok) {
    assert.equal(denied.reason, 'CROSS_TENANT_DENIED');
  }

  const across = graph.readNodeAcrossScope(cpuId, scopeA, scopeB);
  assert.equal(across.ok, false);
  if (!across.ok) {
    assert.equal(across.reason, 'CROSS_TENANT_DENIED');
  }
  assert.equal(EW6_LOCKS.CROSS_TENANT_GRAPH_ACCESS, false);
});

test('8) cross-Universe graph access denied', () => {
  const graph = createCapabilityGraph();
  graph.seedSharedSkeleton(scopeA);
  const cpuId = deviceNodeId(scopeA, 'amd-cpu-candidate');

  const denied = graph.getNode(cpuId, scopeAUniB);
  assert.equal(denied.ok, false);
  if (!denied.ok) {
    assert.equal(denied.reason, 'CROSS_UNIVERSE_DENIED');
  }
  assert.equal(EW6_LOCKS.CROSS_UNIVERSE_GRAPH_ACCESS, false);
});

test('9) proprietary/restricted evidence rejected', () => {
  const graph = createCapabilityGraph();
  graph.seedSharedSkeleton(scopeA);
  const store = createEvidenceStore();
  const cpuId = deviceNodeId(scopeA, 'amd-cpu-candidate');

  for (const cls of [
    'VENDOR_RTL',
    'VENDOR_FIRMWARE',
    'CONFIDENTIAL_MICROARCHITECTURE',
    'LEAKED_SOURCE',
    'RESTRICTED_ISA_EXTENSION',
    'TRADE_SECRET',
  ] as const) {
    const result = applyEvidence(graph, store, {
      evidenceId: `ev-bad-${cls}`,
      evidenceClass: cls,
      targetNodeId: cpuId,
      kind: 'documentation',
      fresh: true,
      staleAfterMs: 86_400_000,
      recordedAt: new Date().toISOString(),
      scope: scopeA,
      notes: 'must reject',
    });
    assert.equal(result.ok, false);
    if (!result.ok) {
      assert.equal(result.reason, 'PROPRIETARY_RESTRICTED_EVIDENCE');
    }
  }
  assert.equal(EW6_LOCKS.MAY_COPY_VENDOR_RTL_FIRMWARE, false);
});

test('10) L4 remains false', () => {
  assert.equal(EW6_LOCKS.L4_AUTONOMY_ENABLED, false);
  const cycle = runCrossChipCapabilityGraphCycle({ repoRoot });
  assert.equal(cycle.l4AutonomyEnabled, false);
  assert.equal(cycle.locksIntact, true);
  assert.equal(cycle.amdGpuVerified, false);
  assert.equal(cycle.amdNpuVerified, false);
  assert.equal(cycle.separateVendorBrains, false);
  assert.equal(cycle.secondOrchestrationFramework, false);
  assert.equal(cycle.tipLand, false);
  assert.equal(cycle.managePullRequest, false);
  assert.match(cycle.nextStory, /EW7/);

  const soft = ew6SoftWireSnapshot(repoRoot);
  assert.equal(soft.agentMesh.present, true);
  // HC3 compute-graph may be absent on xiv-v2 tip → WAITING_DATA, not FAIL.
  const hc3Hop = cycle.hops.find((h) => h.hop === 'hc3_compute_graph_soft_wire');
  assert.ok(hc3Hop);
  assert.ok(
    hc3Hop!.state === 'PASS' || hc3Hop!.state === 'WAITING_DATA',
    `hc3 soft-wire must be PASS or WAITING_DATA, got ${hc3Hop!.state}`,
  );
  const l4Hop = cycle.hops.find((h) => h.hop === 'l4_autonomy_false');
  assert.equal(l4Hop?.state, 'PASS');
});

test('neural pathways strengthen/weaken without changing authority', () => {
  const graph = createCapabilityGraph();
  graph.seedSharedSkeleton(scopeA);
  const cpuId = deviceNodeId(scopeA, 'amd-cpu-candidate');
  const before = graph.getNode(cpuId, scopeA);
  assert.equal(before.ok, true);
  if (!before.ok) return;

  const up = applyNeuralPathwayUpdate({
    graph,
    deviceNodeId: cpuId,
    scope: scopeA,
    outcome: 'SUCCESS_MEASURED',
  });
  assert.equal('ok' in up && up.ok === false, false);
  if (!('ok' in up)) {
    assert.ok(up.nextWeight > up.previousWeight);
    assert.equal(up.permissionsChanged, false);
    assert.equal(up.guardianChanged, false);
    assert.equal(up.rlsChanged, false);
    assert.equal(up.tenantUniverseAccessChanged, false);
    assert.equal(up.productionContractPaymentAuthorityChanged, false);
  }

  const down = applyNeuralPathwayUpdate({
    graph,
    deviceNodeId: cpuId,
    scope: scopeA,
    outcome: 'STALE',
  });
  assert.equal('ok' in down && down.ok === false, false);
  if (!('ok' in down)) {
    assert.ok(down.nextWeight < down.previousWeight);
  }
});
