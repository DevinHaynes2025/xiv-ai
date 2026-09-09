/**
 * 62L-EW8 — NVIDIA Adapter Candidate tests (16 required cases).
 *
 * Script: npm run test:62lew8
 */

import assert from 'node:assert/strict';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';

import {
  EW8_LOCKS,
  GITHUB_SOT_ISSUE,
  GITHUB_SOT_LABEL,
  NEXT_STORY_TITLE,
  FOLLOWING_STORY_TITLE,
  assertEw8LocksIntact,
  ew8SoftWireSnapshot,
  nvidiaEnvironmentHonesty,
  softWireHopState,
  type TenantScope,
} from './ew8-types.ts';

import {
  attemptAssumeCudaFromGpuDetection,
  attemptAssumeTensorRtFromCuda,
  defaultNvidiaCapabilitySnapshot,
  detectedGpuOnly,
  documentedGpuOnly,
  layerSatisfiesMinimum,
  markCudaMissing,
  markTensorRtMissing,
  rejectStaleVerified,
  setLayerState,
} from './nvidia-capabilities.ts';

import {
  attemptAutoInstallRuntime,
  evaluateModelLoadVerification,
  resolveRuntimeCandidateStatus,
} from './nvidia-runtime.ts';

import {
  compareCrossVendor,
  createBenchmarkLedger,
  buildBenchmarkFromExecution,
} from './nvidia-benchmark.ts';

import {
  attemptCloudPurchase,
  createComputeEnvelope,
  defaultGpuPressure,
  evaluateGpuResourceGovernor,
  probeGuardianRlsUnchanged,
  runNvidiaAdapter,
  validateComputeEnvelope,
} from './nvidia-adapter.ts';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '../../../..');

const scope: TenantScope = {
  orgId: 'org-ew8',
  tenantId: 'ten-ew8',
  universeId: 'uni-ew8',
};

function baseEnvelope(
  overrides: Partial<ReturnType<typeof createComputeEnvelope>> = {},
) {
  const future = new Date(Date.now() + 60_000).toISOString();
  return createComputeEnvelope({
    requestId: 'req-1',
    missionId: 'mis-1',
    taskId: 'task-1',
    agentId: 'agent-1',
    tenantId: scope.tenantId,
    universeId: scope.universeId,
    orgId: scope.orgId,
    modelId: 'model-x',
    workloadId: 'wl-1',
    workloadGenomeHash: 'genome-abc',
    inputDataClass: 'TENANT_PRIVATE',
    preferredDevice: 'NVIDIA_GPU',
    minimumVerificationState: 'VERIFIED',
    privacyMode: 'TENANT_PRIVATE',
    maxMemoryMb: 2048,
    estimatedVramMb: 2048,
    maxRuntimeMs: 30_000,
    computeBudget: 10,
    fallbackPolicy: 'CPU_SAFE',
    returnPath: 'xiv-home-base',
    expiresAt: future,
    placement: 'LOCAL',
    batchSize: 1,
    ...overrides,
  });
}

test('SoT EW8 / #169; next EW9 then EW10 docs-only', () => {
  assert.equal(GITHUB_SOT_LABEL, '62L-EW8');
  assert.equal(GITHUB_SOT_ISSUE, 169);
  assert.match(NEXT_STORY_TITLE, /EW9/);
  assert.match(NEXT_STORY_TITLE, /Intel/);
  assert.match(FOLLOWING_STORY_TITLE, /EW10/);
  assert.match(FOLLOWING_STORY_TITLE, /ARM|Apple|Qualcomm/);
});

test('1. DOCUMENTED NVIDIA GPU cannot satisfy VERIFIED', () => {
  const snap = documentedGpuOnly('RTX-DOCUMENTED');
  assert.equal(snap.layers.NVIDIA_GPU.state, 'DOCUMENTED');
  assert.equal(layerSatisfiesMinimum(snap, 'NVIDIA_GPU', 'VERIFIED'), false);

  const result = runNvidiaAdapter({
    envelope: baseEnvelope({ preferredDevice: 'NVIDIA_GPU' }),
    expectedScope: scope,
    capability: snap,
    repoRoot,
  });
  assert.equal(result.verificationEligible, false);
  assert.ok(
    result.denied || result.receipt?.fallbackUsed === true,
    'documented GPU must not verify NVIDIA path',
  );
  assert.notEqual(result.receipt?.nvidiaGpuTruth, 'VERIFIED');
});

test('2. DETECTED GPU cannot satisfy VERIFIED', () => {
  const snap = detectedGpuOnly('RTX-DETECTED', 'probe:pci');
  assert.equal(snap.layers.NVIDIA_GPU.state, 'DETECTED');
  assert.equal(layerSatisfiesMinimum(snap, 'NVIDIA_GPU', 'VERIFIED'), false);
  assert.equal(attemptAssumeCudaFromGpuDetection().denied, true);

  const result = runNvidiaAdapter({
    envelope: baseEnvelope(),
    expectedScope: scope,
    capability: snap,
    repoRoot,
  });
  assert.equal(result.verificationEligible, false);
  assert.notEqual(result.capability.layers.CUDA_RUNTIME.state, 'VERIFIED');
});

test('3. CUDA missing → unavailable/not configured', () => {
  let snap = defaultNvidiaCapabilitySnapshot();
  snap = markCudaMissing(snap);
  assert.equal(snap.layers.CUDA_RUNTIME.state, 'NOT_CONFIGURED');
  const status = resolveRuntimeCandidateStatus('cuda', snap);
  assert.equal(status.status, 'NOT_CONFIGURED');
  assert.equal(attemptAutoInstallRuntime().denied, true);
});

test('4. TensorRT missing → unavailable/not configured', () => {
  let snap = defaultNvidiaCapabilitySnapshot();
  snap = markTensorRtMissing(snap);
  assert.equal(snap.layers.TENSORRT.state, 'NOT_CONFIGURED');
  assert.equal(attemptAssumeTensorRtFromCuda().denied, true);
  const status = resolveRuntimeCandidateStatus('tensorrt', snap);
  assert.equal(status.status, 'NOT_CONFIGURED');
});

test('5. verified NVIDIA path eligible (evidence-injected, not fabricated env)', () => {
  let snap = detectedGpuOnly('RTX-TEST', 'sim:gpu');
  snap = setLayerState(snap, 'NVIDIA_GPU', 'VERIFIED', ['sim:full'], [
    'Test-injected VERIFIED evidence only.',
  ]);
  snap = setLayerState(snap, 'CUDA_RUNTIME', 'VERIFIED', ['sim:cuda'], []);
  snap = setLayerState(snap, 'MODEL_COMPATIBILITY', 'VERIFIED', ['sim:model'], []);

  const result = runNvidiaAdapter({
    envelope: baseEnvelope({ fallbackPolicy: 'NONE' }),
    expectedScope: scope,
    capability: snap,
    pressure: defaultGpuPressure({ vramMbAvailable: 16000 }),
    simulate: {
      nvidiaPathFullyVerified: true,
      gpuDetectedExact: true,
      runtimeInitialized: true,
      modelLoaded: true,
      inferenceCompleted: true,
      outputValidated: true,
    },
    repoRoot,
  });
  assert.equal(result.denied, false);
  assert.equal(result.verificationEligible, true);
  assert.equal(result.receipt?.requestedDeviceVerified, true);
  assert.equal(result.receipt?.fallbackUsed, false);
  assert.equal(result.receipt?.actualDevice, 'NVIDIA_GPU');
});

test('6. GPU→CPU fallback recorded truthfully', () => {
  const snap = detectedGpuOnly('RTX-FALLBACK', 'probe:1');
  const result = runNvidiaAdapter({
    envelope: baseEnvelope({
      preferredDevice: 'NVIDIA_GPU',
      fallbackPolicy: 'CPU_SAFE',
      minimumVerificationState: 'DETECTED',
    }),
    expectedScope: scope,
    capability: markCudaMissing(snap),
    simulate: { forceFallbackToCpu: true },
    repoRoot,
  });
  assert.equal(result.receipt?.fallbackUsed, true);
  assert.ok(
    result.receipt?.actualDevice === 'CPU' ||
      result.receipt?.actualDevice === 'CPU_ONNX',
  );
  assert.equal(result.receipt?.requestedDevice, 'NVIDIA_GPU');
  assert.equal(result.receipt?.requestedDeviceVerified, false);
  assert.ok(
    result.receipt?.nvidiaGpuTruth === 'NOT_TESTED' ||
      result.receipt?.nvidiaGpuTruth === 'DEGRADED',
  );
  assert.equal(result.receipt?.tensorRtTruth, 'NOT_TESTED');
  assert.equal(result.receipt?.resultState, 'PASS');
});

test('7. stale GPU/runtime evidence rejected', () => {
  let snap = detectedGpuOnly('RTX-STALE', 'old');
  snap = setLayerState(snap, 'NVIDIA_GPU', 'VERIFIED', ['old'], []);
  // Force stale by backdating observedAt via reject after mutating staleAfterMs
  const layer = snap.layers.NVIDIA_GPU;
  const staleSnap = {
    ...snap,
    layers: {
      ...snap.layers,
      NVIDIA_GPU: {
        ...layer,
        observedAt: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
        staleAfterMs: 1000,
      },
    },
  };
  const rejected = rejectStaleVerified(staleSnap);
  assert.equal(rejected.layers.NVIDIA_GPU.state, 'STALE');

  const result = runNvidiaAdapter({
    envelope: baseEnvelope(),
    expectedScope: scope,
    capability: rejected,
    repoRoot,
  });
  assert.equal(result.denied, true);
  assert.equal(result.failureClass, 'STALE_EVIDENCE');
});

test('8. insufficient VRAM → queue/fallback/deny', () => {
  const envelope = baseEnvelope({
    estimatedVramMb: 24000,
    fallbackPolicy: 'DENY_IF_UNAVAILABLE',
    minimumVerificationState: 'DETECTED',
  });
  const govDeny = evaluateGpuResourceGovernor({
    envelope,
    pressure: defaultGpuPressure({ vramMbAvailable: 4096 }),
    repoRoot,
  });
  assert.equal(govDeny.result, 'DENY');

  const govFallback = evaluateGpuResourceGovernor({
    envelope: { ...envelope, fallbackPolicy: 'CPU_SAFE' },
    pressure: defaultGpuPressure({ vramMbAvailable: 4096 }),
    repoRoot,
  });
  assert.ok(
    govFallback.result === 'FALLBACK' || govFallback.fallbackSuggested,
  );

  const govQueue = evaluateGpuResourceGovernor({
    envelope: { ...envelope, fallbackPolicy: 'QUEUE_THEN_CPU' },
    pressure: defaultGpuPressure({
      vramMbAvailable: 4096,
      queueDepth: 0,
      maxQueueDepth: 8,
    }),
    repoRoot,
  });
  assert.ok(govQueue.result === 'QUEUE' || govQueue.fallbackSuggested);
});

test('9. expired task denied', () => {
  const past = new Date(Date.now() - 1000).toISOString();
  const v = validateComputeEnvelope(baseEnvelope({ expiresAt: past }), {
    expectedScope: scope,
  });
  assert.equal(v.ok, false);
  if (!v.ok) assert.equal(v.failureClass, 'EXPIRED');
});

test('10. tenant mismatch denied', () => {
  const v = validateComputeEnvelope(baseEnvelope({ tenantId: 'other-tenant' }), {
    expectedScope: scope,
  });
  assert.equal(v.ok, false);
  if (!v.ok) assert.equal(v.failureClass, 'TENANT_MISMATCH');
});

test('11. universe mismatch denied', () => {
  const v = validateComputeEnvelope(
    baseEnvelope({ universeId: 'other-universe' }),
    { expectedScope: scope },
  );
  assert.equal(v.ok, false);
  if (!v.ok) assert.equal(v.failureClass, 'UNIVERSE_MISMATCH');
});

test('12. unauthorized cloud NVIDIA denied', () => {
  const v = validateComputeEnvelope(
    baseEnvelope({
      placement: 'AUTHORIZED_CLOUD_NVIDIA',
      cloudProviderAuthorized: false,
      cloudCredentialsValid: true,
      cloudRegionAllowed: true,
      cloudDataMovementAllowed: true,
      cloudCostCeilingApproved: true,
      cloudRuntimeVerified: true,
    }),
    { expectedScope: scope },
  );
  assert.equal(v.ok, false);
  if (!v.ok) assert.equal(v.failureClass, 'UNAUTHORIZED_CLOUD_NVIDIA');
});

test('13. cloud purchase never automatic', () => {
  assert.equal(attemptCloudPurchase().denied, true);
  assert.equal(EW8_LOCKS.MAY_BUY_CLOUD, false);
  assert.equal(EW8_LOCKS.MAY_AUTONOMOUS_CLOUD_RENTAL, false);
  const v = validateComputeEnvelope(
    baseEnvelope({ attemptCloudPurchase: true }),
    { expectedScope: scope },
  );
  assert.equal(v.ok, false);
  if (!v.ok) assert.equal(v.failureClass, 'CLOUD_PURCHASE_FORBIDDEN');
});

test('14. multi-GPU remains NOT_TESTED unless evidence', () => {
  const honesty = nvidiaEnvironmentHonesty();
  assert.equal(honesty.multiGpuState, 'MULTI_GPU_NOT_TESTED');

  const verification = evaluateModelLoadVerification({
    snapshot: defaultNvidiaCapabilitySnapshot(),
    runtimeId: 'cuda',
    gpuDetectedExact: true,
    runtimeInitialized: true,
    modelLoaded: true,
    modelVersion: 'v1',
    inferenceCompleted: true,
    actualDeviceConfirmed: 'NVIDIA_GPU',
    requestedDevice: 'NVIDIA_GPU',
    outputValidated: true,
    receiptGenerated: true,
    benchmarkRetained: true,
    silentCpuFallback: false,
    multiGpuMeasured: false,
  });
  assert.ok(
    verification.multiGpuState === 'MULTI_GPU_NOT_TESTED' ||
      verification.multiGpuState === 'SINGLE_GPU_VERIFIED',
  );
  assert.notEqual(verification.multiGpuState, 'MULTI_GPU_VERIFIED');
});

test('15. L4 false', () => {
  assert.equal(EW8_LOCKS.L4_AUTONOMY_ENABLED, false);
  assert.equal(assertEw8LocksIntact(), true);
  const result = runNvidiaAdapter({
    envelope: baseEnvelope({ fallbackPolicy: 'CPU_SAFE' }),
    expectedScope: scope,
    repoRoot,
  });
  assert.equal(result.l4AutonomyEnabled, false);
});

test('16. Guardian/RLS unchanged', () => {
  const g = probeGuardianRlsUnchanged();
  assert.equal(g.unchanged, true);
  assert.equal(g.bypass, false);
  assert.equal(
    EW8_LOCKS.GUARDIAN_RLS_TENANT_UNIVERSE_ISOLATION_UNCHANGED,
    true,
  );
  assert.equal(EW8_LOCKS.BYPASS_GUARDIAN_RLS_TENANT_UNIVERSE, false);
  const result = runNvidiaAdapter({
    envelope: baseEnvelope({ fallbackPolicy: 'CPU_SAFE' }),
    expectedScope: scope,
    repoRoot,
  });
  assert.equal(result.guardianRlsUnchanged, true);
});

test('soft-wire EW7/EW6: presence≠VERIFIED; absent→WAITING_DATA', () => {
  const soft = ew8SoftWireSnapshot(repoRoot);
  // Sibling .wt-ew7 may be PRESENT in this agent host — still ≠ VERIFIED.
  assert.equal(typeof soft.ew7AmdAdapter.present, 'boolean');
  assert.equal(softWireHopState(false), 'WAITING_DATA');
  assert.equal(softWireHopState(true), 'PASS');
  assert.match(soft.ew7AmdAdapter.note, /PRESENT|WAITING_DATA/);
  assert.match(soft.ew6Chipgraph.note, /PRESENT|WAITING_DATA/);
});

test('cross-vendor compare: material difference → NOT_COMPARABLE', () => {
  const ledger = createBenchmarkLedger();
  const left = buildBenchmarkFromExecution({
    benchmarkId: 'b1',
    workloadId: 'wl',
    workloadGenomeHash: 'g1',
    device: 'NVIDIA_GPU',
    runtimeProvider: 'CUDA',
    modelId: 'm',
    modelVersion: '1',
    precision: 'fp16',
    batchSize: 1,
    latencyMs: 10,
    throughputItemsPerSec: null,
    vramMbPeak: 1000,
    resultState: 'PASS',
    fallbackUsed: false,
    evidenceRefs: [],
    tenantId: scope.tenantId,
    universeId: scope.universeId,
  });
  const right = {
    ...left,
    benchmarkId: 'b2',
    device: 'CPU' as const,
    vendor: 'CPU' as const,
    precision: 'fp32',
    latencyMs: 50,
  };
  ledger.retain(left);
  ledger.retain(right);
  const cmp = compareCrossVendor({ left, right });
  assert.equal(cmp.comparable, false);
  if (!cmp.comparable) assert.equal(cmp.failureClass, 'NOT_COMPARABLE');

  const pathway = ledger.updatePathway('nvidia:test', 1, 0.2);
  assert.ok(!('denied' in pathway));
  if (!('denied' in pathway)) {
    assert.equal(pathway.permissionsUnchanged, true);
  }
});

test('environment honesty: NVIDIA NOT_TESTED — VERIFIED not fabricated', () => {
  const h = nvidiaEnvironmentHonesty();
  assert.equal(h.gpuVerified, false);
  assert.equal(h.cudaVerified, false);
  assert.equal(h.tensorRtVerified, false);
  assert.ok(
    h.gpuState === 'NOT_TESTED' || h.gpuState === 'NOT_CONFIGURED',
  );
});
