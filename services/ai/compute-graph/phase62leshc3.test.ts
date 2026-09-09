/**
 * 62L-ES-HC3 — Cross-Vendor Chip Path Graph denial + honesty tests.
 *
 * Script: npm run test:62leshc3
 * Distinct from productization test:62les3.
 */

import assert from 'node:assert/strict';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';

import {
  BOTTLENECK_CLASSES,
  CHIP_VENDORS,
  GITHUB_SOT_ISSUE,
  GITHUB_SOT_LABEL,
  HC3_LOCKS,
  HONESTY_BANNER,
  NEXT_PHASE_TITLE,
  PRODUCTIZATION_ES_COLLISION_NOTE,
  TRUTH_LADDER,
  amdGpuVerificationStatus,
  applyStaleEvidenceDemotion,
  assertHc3LocksIntact,
  blockVerifiedIfEvidenceStale,
  canAdvanceTruthLadder,
  createChipPathGraph,
  createEvidenceStore,
  createHardwareTruthMatrix,
  hc3SoftWireSnapshot,
  recordEvidence,
  routeBottleneckEvidence,
  runCrossVendorChipPathGraphCycle,
  type TenantScope,
} from './index.ts';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '../../..');

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

test('SoT HC3 / #165; productization ES3 collision note; next ES4 AMD layer', () => {
  assert.equal(GITHUB_SOT_LABEL, '62L-ES-HC3');
  assert.equal(GITHUB_SOT_ISSUE, 165);
  assert.match(PRODUCTIZATION_ES_COLLISION_NOTE, /test:62les3/);
  assert.match(NEXT_PHASE_TITLE, /ES4/);
  assert.match(NEXT_PHASE_TITLE, /AMD Software Acceleration/);
  assert.equal(HONESTY_BANNER.includes('DOCUMENTED'), true);
});

test('locks intact; L4 false; no silicon modify; no fabricate AMD GPU VERIFIED', () => {
  assert.equal(assertHc3LocksIntact(), true);
  assert.equal(HC3_LOCKS.L4_AUTONOMY_ENABLED, false);
  assert.equal(HC3_LOCKS.MAY_PHYSICALLY_MODIFY_SILICON, false);
  assert.equal(HC3_LOCKS.FABRICATE_AMD_GPU_VERIFIED, false);
  assert.equal(HC3_LOCKS.TIP_LAND, false);
  assert.equal(HC3_LOCKS.MANAGE_PULL_REQUEST, false);
});

test('1) Truth-state transitions — DOCUMENTED→VERIFIED skip denied', () => {
  assert.deepEqual([...TRUTH_LADDER], [
    'DOCUMENTED',
    'DETECTED',
    'SUPPORTED',
    'VERIFIED',
  ]);
  assert.equal(canAdvanceTruthLadder('DOCUMENTED', 'VERIFIED'), false);
  assert.equal(canAdvanceTruthLadder('DOCUMENTED', 'DETECTED'), true);
  assert.equal(canAdvanceTruthLadder('DETECTED', 'SUPPORTED'), true);
  assert.equal(canAdvanceTruthLadder('SUPPORTED', 'VERIFIED'), true);
  assert.equal(canAdvanceTruthLadder('DETECTED', 'VERIFIED'), false);

  const matrix = createHardwareTruthMatrix();
  const entry = matrix.register({
    entryId: 'nv-gpu-1',
    vendor: 'NVIDIA',
    deviceId: 'dev-nv-1',
    deviceLabel: 'NVIDIA GPU skeleton',
    acceleratorClass: 'GPU',
    architecture: 'common',
    initialState: 'DOCUMENTED',
    scope: scopeA,
  });
  const skip = matrix.advance({
    entryId: entry.entryId,
    to: 'VERIFIED',
    evidenceId: 'ev-skip',
    scope: scopeA,
    boundedRunSucceeded: true,
  });
  assert.equal(skip.ok, false);
  if (!skip.ok) {
    assert.match(skip.reason, /TRUTH_LADDER_SKIP_DENIED/);
  }

  const step1 = matrix.advance({
    entryId: entry.entryId,
    to: 'DETECTED',
    evidenceId: 'ev-1',
    scope: scopeA,
  });
  assert.equal(step1.ok, true);
});

test('2) Stale evidence demotes/blocks VERIFIED claims', () => {
  const matrix = createHardwareTruthMatrix();
  matrix.register({
    entryId: 'intel-cpu-1',
    vendor: 'INTEL',
    deviceId: 'cpu-1',
    deviceLabel: 'Intel CPU',
    acceleratorClass: 'CPU',
    architecture: 'x86_64',
    initialState: 'SUPPORTED',
    scope: scopeA,
  });
  const verified = matrix.advance({
    entryId: 'intel-cpu-1',
    to: 'VERIFIED',
    evidenceId: 'ev-fresh',
    scope: scopeA,
    boundedRunSucceeded: true,
  });
  assert.equal(verified.ok, true);

  const store = createEvidenceStore();
  const staleEv = recordEvidence(store, {
    evidenceId: 'ev-old',
    matrixEntryId: 'intel-cpu-1',
    kind: 'bounded_inference',
    fresh: true,
    staleAfterMs: 1,
    recordedAt: new Date(Date.now() - 60_000).toISOString(),
    scope: scopeA,
    notes: 'expired',
  });

  const blocked = blockVerifiedIfEvidenceStale({
    currentState: 'VERIFIED',
    evidence: staleEv,
  });
  assert.equal(blocked.allowed, false);
  assert.match(blocked.reason, /STALE/);

  const demotion = applyStaleEvidenceDemotion({
    matrix,
    entryId: 'intel-cpu-1',
    scope: scopeA,
    evidence: staleEv,
  });
  assert.equal(demotion.demoted, true);
  assert.equal(demotion.previousState, 'VERIFIED');
  assert.ok(
    demotion.nextState === 'STALE' ||
      demotion.nextState === 'REVALIDATION_REQUIRED',
  );

  const reVerify = matrix.advance({
    entryId: 'intel-cpu-1',
    to: 'VERIFIED',
    evidenceId: 'ev-again',
    scope: scopeA,
    boundedRunSucceeded: true,
  });
  assert.equal(reVerify.ok, false);
});

test('3) CPU/GPU/NPU fallback does not mislabel accelerator as VERIFIED', () => {
  const matrix = createHardwareTruthMatrix();
  const gpu = matrix.register({
    entryId: 'amd-gpu-target',
    vendor: 'AMD',
    deviceId: 'amd-gpu',
    deviceLabel: 'AMD GPU',
    acceleratorClass: 'GPU',
    architecture: 'rdna',
    initialState: 'NOT_TESTED',
    scope: scopeA,
  });
  const cpuFallback = matrix.register({
    entryId: 'amd-cpu-fallback',
    vendor: 'AMD',
    deviceId: 'amd-cpu',
    deviceLabel: 'AMD CPU fallback',
    acceleratorClass: 'CPU',
    architecture: 'zen',
    initialState: 'SUPPORTED',
    isFallbackPath: true,
    fallbackOf: gpu.entryId,
    scope: scopeA,
  });

  const graph = createChipPathGraph();
  const path = graph.buildPath({
    pathId: 'path-fallback-1',
    workloadId: 'wl-infer',
    workloadLabel: 'inference',
    runtimeId: 'onnx',
    runtimeLabel: 'ONNX Runtime',
    matrixEntry: gpu,
    preferFallback: true,
    fallbackMatrixEntry: cpuFallback,
    scope: scopeA,
  });

  assert.equal(path.usesFallback, true);
  assert.equal(path.acceleratorVerified, false);
  assert.equal(path.eligibility, 'FALLBACK_ONLY');

  const claimVerifiedOnFallback = matrix.advance({
    entryId: cpuFallback.entryId,
    to: 'VERIFIED',
    evidenceId: 'ev-fb',
    scope: scopeA,
    boundedRunSucceeded: true,
  });
  // Fallback entry cannot jump SUPPORTED→ via claiming as accelerator VERIFIED
  // when marked isFallbackPath — denied at VERIFIED.
  assert.equal(claimVerifiedOnFallback.ok, false);
  if (!claimVerifiedOnFallback.ok) {
    assert.match(
      claimVerifiedOnFallback.reason,
      /FALLBACK_PATH_CANNOT_CLAIM_ACCELERATOR_VERIFIED/,
    );
  }
});

test('4) Tenant isolation — no cross-tenant path reuse', () => {
  const matrix = createHardwareTruthMatrix();
  const entryA = matrix.register({
    entryId: 'arm-npu-a',
    vendor: 'ARM',
    deviceId: 'npu-a',
    deviceLabel: 'ARM NPU A',
    acceleratorClass: 'NPU',
    architecture: 'ethos',
    initialState: 'SUPPORTED',
    scope: scopeA,
  });

  const graph = createChipPathGraph();
  graph.buildPath({
    pathId: 'path-tenant-a',
    workloadId: 'wl-a',
    workloadLabel: 'workload A',
    runtimeId: 'tflite',
    runtimeLabel: 'TFLite',
    matrixEntry: entryA,
    scope: scopeA,
  });

  assert.equal(graph.getPath('path-tenant-a', scopeA)?.pathId, 'path-tenant-a');
  assert.equal(graph.getPath('path-tenant-a', scopeB), null);
  assert.equal(matrix.get('arm-npu-a', scopeB), null);
  assert.equal(graph.queryPaths(scopeB).length, 0);
  assert.equal(graph.queryPaths(scopeA).length, 1);

  const reuse = graph.attemptCrossTenantPathReuse({
    pathId: 'path-tenant-a',
    fromScope: scopeA,
    toScope: scopeB,
  });
  assert.equal(reuse.denied, true);
  assert.match(reuse.reason, /CROSS_TENANT/);
  assert.equal(reuse.path, null);
});

test('5) L4 false; AMD GPU not falsely VERIFIED', () => {
  assert.equal(HC3_LOCKS.L4_AUTONOMY_ENABLED, false);
  const status = amdGpuVerificationStatus();
  assert.equal(status.verified, false);
  assert.equal(status.state, 'NOT_TESTED');
  assert.equal(status.claimAllowed, false);

  const matrix = createHardwareTruthMatrix();
  const amdGpu = matrix.register({
    entryId: 'amd-gpu-env',
    vendor: 'AMD',
    deviceId: 'radeon',
    deviceLabel: 'AMD Radeon',
    acceleratorClass: 'GPU',
    architecture: 'rdna',
    initialState: 'VERIFIED', // attempt fabricate at register
    scope: scopeA,
  });
  assert.notEqual(amdGpu.truthState, 'VERIFIED');
  assert.equal(amdGpu.truthState, 'NOT_TESTED');

  // Climb to SUPPORTED then attempt VERIFIED — environment has no AMD GPU evidence.
  matrix.markHonestyState('amd-gpu-env', scopeA, 'SUPPORTED');
  const attempt = matrix.advance({
    entryId: 'amd-gpu-env',
    to: 'VERIFIED',
    evidenceId: 'ev-fake',
    scope: scopeA,
    boundedRunSucceeded: true,
    // amdGpuEnvironmentEvidence omitted / false → must deny
  });
  assert.equal(attempt.ok, false);
  if (!attempt.ok) {
    assert.match(attempt.reason, /AMD_GPU_VERIFICATION_NO/);
  }

  const cycle = runCrossVendorChipPathGraphCycle({ repoRoot });
  assert.equal(cycle.l4AutonomyEnabled, false);
  assert.equal(cycle.amdGpuVerified, false);
  assert.equal(cycle.amdGpuState, 'NOT_TESTED');
});

test('cross-vendor skeleton + bottleneck routing soft-wires HC2', () => {
  assert.ok(CHIP_VENDORS.includes('AMD'));
  assert.ok(CHIP_VENDORS.includes('RISC_V'));
  assert.ok(CHIP_VENDORS.includes('APPLE'));
  assert.ok(CHIP_VENDORS.includes('QUALCOMM'));
  assert.ok(BOTTLENECK_CLASSES.includes('COMPUTE_BOUND'));
  assert.ok(BOTTLENECK_CLASSES.includes('DATA_TRANSFER_BOUND'));

  const matrix = createHardwareTruthMatrix();
  const seeded = matrix.seedDefaultCrossVendorSkeleton(scopeA);
  assert.ok(seeded.length >= CHIP_VENDORS.length);
  const amdGpu = seeded.find(
    (e) => e.vendor === 'AMD' && e.acceleratorClass === 'GPU',
  );
  assert.ok(amdGpu);
  assert.equal(amdGpu?.truthState, 'NOT_TESTED');

  const graph = createChipPathGraph();
  const path = graph.buildPath({
    pathId: 'path-bn',
    workloadId: 'wl-bn',
    workloadLabel: 'transfer-heavy',
    runtimeId: 'ort',
    runtimeLabel: 'ORT',
    matrixEntry: amdGpu!,
    preferFallback: true,
    fallbackMatrixEntry: seeded.find(
      (e) => e.vendor === 'AMD' && e.acceleratorClass === 'CPU',
    ),
    scope: scopeA,
  });

  const link = routeBottleneckEvidence({
    linkId: 'bn-1',
    path,
    matrixEntry: amdGpu!,
    bottleneckClass: 'DATA_TRANSFER_BOUND',
    evidenceRefs: ['metric-transfer-ms'],
    scope: scopeA,
    repoRoot,
  });
  assert.equal(link.bottleneckClass, 'DATA_TRANSFER_BOUND');
  assert.match(link.recommendation, /fallback/i);
  assert.match(link.recommendation, /DATA_TRANSFER_BOUND/);

  const soft = hc3SoftWireSnapshot(repoRoot);
  // Presence ≠ VERIFIED; absent → WAITING_DATA (not FAIL) — hop mapping in cycle.
  assert.equal(typeof soft.hc1HybridComputeHomeBase.present, 'boolean');
  assert.equal(typeof soft.hc2ChipBottleneckAnalyzer.present, 'boolean');
  assert.equal(typeof soft.er34CapabilityManifest.present, 'boolean');
});

test('cycle runner: soft-wires WAITING_DATA|PASS; AMD GPU not verified', () => {
  const cycle = runCrossVendorChipPathGraphCycle({ repoRoot });
  assert.equal(cycle.locksIntact, true);
  assert.equal(cycle.amdGpuVerified, false);
  assert.equal(cycle.tipLand, false);
  assert.equal(cycle.managePullRequest, false);

  const byHop = Object.fromEntries(cycle.hops.map((h) => [h.hop, h]));
  assert.ok(
    byHop.hc1_soft_wire.state === 'PASS' ||
      byHop.hc1_soft_wire.state === 'WAITING_DATA',
  );
  assert.ok(
    byHop.hc2_soft_wire.state === 'PASS' ||
      byHop.hc2_soft_wire.state === 'WAITING_DATA',
  );
  assert.ok(
    byHop.er34_soft_wire.state === 'PASS' ||
      byHop.er34_soft_wire.state === 'WAITING_DATA',
  );
  assert.ok(
    byHop.global_operations_brain_soft_wire.state === 'PASS' ||
      byHop.global_operations_brain_soft_wire.state === 'WAITING_DATA',
  );
  assert.notEqual(byHop.hc1_soft_wire.state, 'FAIL');
  assert.equal(byHop.deny_truth_ladder_skip.state, 'PASS');
  assert.equal(byHop.amd_gpu_not_falsely_verified.state, 'PASS');
  assert.equal(byHop.l4_autonomy_false.state, 'PASS');
});
