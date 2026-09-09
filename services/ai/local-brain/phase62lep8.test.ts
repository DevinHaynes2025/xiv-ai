/**
 * 62L-EP8 — NVIDIA Adapter Research Path denial + honesty tests.
 *
 * Script: npm run test:62lep8
 */

import assert from 'node:assert/strict';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';

import {
  EP8_DB_CANDIDATES_STATUS,
  EP8_LOCKS,
  EP8_MAY,
  EP8_MUST_NOT,
  GITHUB_SOT_ISSUE,
  GITHUB_SOT_LABEL,
  GITHUB_SOT_TITLE,
  GITLAB_MIRROR_NOTE,
  HONESTY_BANNER,
  NEXT_PHASE_TITLE,
  NVIDIA_ADAPTER_AGENT_BOUNDS,
  NVIDIA_ADAPTER_CORE_FLOW,
  NVIDIA_ADAPTER_FIELDS,
  NVIDIA_ADAPTER_MUST_NOT,
  NVIDIA_ADAPTER_RESEARCH_CYCLE,
  NVIDIA_ADAPTER_STATES,
  NVIDIA_EXECUTION_DEVICES,
  NVIDIA_FAILURE_CLASSES,
  NVIDIA_VERIFIED_PRECONDITIONS,
  assertEp8LocksIntact,
  ep8SoftWireSnapshot,
  isSilentCpuFallback,
  type Ep8Actor,
} from './nvidia-adapter-research-path-types.ts';

import {
  allVerifiedPreconditionsMet,
  attemptAlterBiosFirmware,
  attemptAssumeCudaFromGpuDetection,
  attemptAssumeTensorRtFromGpuDetection,
  attemptAutoCloudGpuProvisioning,
  attemptAutoInstallCudaTensorRtDrivers,
  attemptClaimDistributedVerifiedWithoutMeasurement,
  attemptClaimMultiGpuVerifiedWithoutMeasurement,
  attemptClaimVerifiedOnSilentCpuFallback,
  attemptMainMerge,
  attemptOverclock,
  attemptPermissionExpansion,
  attemptPrivateTenantDataLeaveUniverse,
  attemptPrivilegeEscalation,
  attemptProductionDeploy,
  attemptPromoteToVerified,
  attemptRecommendAsAct,
  attemptThermalLimitBypass,
  bootstrapNvidiaAdapterResearchPath,
  fullVerifiedPreconditions,
  probeGuardianRlsTenantUniverseIsolation,
  registerNvidiaAdapter,
  requireHumanApproval,
  returnReceiptToHomeBase,
  runBoundedInference,
  runNvidiaAdapterResearchCycle,
} from './nvidia-adapter-research-path-runtime.ts';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '../../..');

const agent: Ep8Actor = {
  kind: 'nvidia_adapter',
  id: 'nv-1',
  orgId: 'org-ep8',
  tenantId: 'ten-ep8',
  universeId: 'uni-ep8',
  permissions: ['draft'],
};

const human: Ep8Actor = {
  kind: 'human_approver',
  id: 'human-1',
  orgId: 'org-ep8',
  tenantId: 'ten-ep8',
  universeId: 'uni-ep8',
  permissions: ['approve_consequential'],
};

test('SoT label EP8 / #160; GitLab mirror not invented; next EP9', () => {
  assert.equal(GITHUB_SOT_LABEL, '62L-EP8');
  assert.equal(GITHUB_SOT_ISSUE, 160);
  assert.match(GITHUB_SOT_TITLE, /NVIDIA Adapter Research Path/);
  assert.match(GITLAB_MIRROR_NOTE, /no issue number invented/i);
  assert.match(NEXT_PHASE_TITLE, /EP9/);
  assert.match(NEXT_PHASE_TITLE, /Intel Adapter Research Path/);
});

test('honesty locks: L4 false; GPU≠CUDA/TensorRT; DB NOT_APPLIED', () => {
  assert.equal(assertEp8LocksIntact(), true);
  assert.equal(EP8_LOCKS.L4_AUTONOMY_ENABLED, false);
  assert.equal(EP8_DB_CANDIDATES_STATUS, 'NOT_APPLIED');
  assert.equal(EP8_LOCKS.GPU_DETECTION_EQ_CUDA_USABLE, false);
  assert.equal(EP8_LOCKS.GPU_DETECTION_EQ_TENSORRT_USABLE, false);
  assert.equal(EP8_LOCKS.SILENT_CPU_FALLBACK_EQ_VERIFIED, false);
  assert.equal(EP8_LOCKS.AUTOMATIC_CLOUD_GPU_PROVISIONING, false);
  assert.equal(EP8_LOCKS.TIP_LAND, false);
  assert.match(HONESTY_BANNER, /DOCUMENTED/);
  assert.equal(
    NVIDIA_ADAPTER_AGENT_BOUNDS.mayClaimVerifiedOnSilentCpuFallback,
    false,
  );
});

test('core flow + fields + states + preconditions encoded', () => {
  assert.deepEqual([...NVIDIA_ADAPTER_CORE_FLOW], [
    'agent_task',
    'virtual_chip_registry',
    'nvidia_adapter',
    'runtime_provider_check',
    'bounded_inference',
    'return_receipt',
    'benchmark_memory',
    'xiv_home_base',
  ]);
  assert.equal(NVIDIA_ADAPTER_FIELDS.length, 18);
  assert.ok(NVIDIA_ADAPTER_FIELDS.includes('adapterId'));
  assert.ok(NVIDIA_ADAPTER_FIELDS.includes('cudaState'));
  assert.ok(NVIDIA_ADAPTER_FIELDS.includes('tensorRtState'));
  assert.ok(NVIDIA_ADAPTER_FIELDS.includes('fallbackRoute'));

  assert.deepEqual([...NVIDIA_ADAPTER_STATES], [
    'UNKNOWN',
    'DETECTED',
    'SUPPORTED',
    'VERIFIED',
    'NOT_TESTED',
    'DEGRADED',
    'UNAVAILABLE',
  ]);
  assert.deepEqual([...NVIDIA_EXECUTION_DEVICES], [
    'NVIDIA_GPU',
    'CPU',
    'unknown',
  ]);
  assert.equal(NVIDIA_VERIFIED_PRECONDITIONS.length, 8);
  assert.ok(NVIDIA_FAILURE_CLASSES.includes('silent_cpu_fallback'));
  assert.ok(
    NVIDIA_ADAPTER_MUST_NOT.includes(
      'automatically_install_cuda_tensorrt_or_drivers',
    ),
  );
  assert.ok(EP8_MAY.length > 0);
  assert.ok(EP8_MUST_NOT.includes('assume_cuda_from_gpu_detection'));
});

test('GPU detection ≠ CUDA/TensorRT usable', () => {
  assert.equal(attemptAssumeCudaFromGpuDetection().state, 'DENIED');
  assert.equal(attemptAssumeTensorRtFromGpuDetection().state, 'DENIED');

  const assume = registerNvidiaAdapter({
    actor: agent,
    adapterId: 'bad-cuda',
    nvidiaGpuModel: 'GPU',
    vram: '8GB',
    driverState: 'DETECTED',
    cudaState: 'UNKNOWN',
    tensorRtState: 'UNKNOWN',
    onnxCompatibility: 'UNKNOWN',
    supportedPrecisions: 'fp16',
    modelCompatibility: 'unknown',
    requestedDevice: 'NVIDIA_GPU',
    actualExecutionDevice: 'NVIDIA_GPU',
    attemptAssumeCudaFromDetection: true,
  });
  assert.equal('denied' in assume && assume.state, 'DENIED');
});

test('CPU fallback receipt fields; GPU remains unverified', () => {
  assert.equal(
    isSilentCpuFallback({
      requestedDevice: 'NVIDIA_GPU',
      actualDevice: 'CPU',
    }),
    true,
  );

  const adapter = registerNvidiaAdapter({
    actor: agent,
    adapterId: 'a1',
    nvidiaGpuModel: 'NVIDIA GPU',
    vram: '8GB',
    driverState: 'DETECTED',
    cudaState: 'AVAILABLE',
    tensorRtState: 'NOT_TESTED',
    onnxCompatibility: 'COMPATIBLE',
    supportedPrecisions: 'fp16',
    modelCompatibility: 'candidate',
    requestedDevice: 'NVIDIA_GPU',
    actualExecutionDevice: 'CPU',
  });
  assert.ok(!('denied' in adapter));
  assert.equal(adapter.silentCpuFallback, true);
  assert.equal(adapter.gpuVerified, false);
  assert.equal(adapter.multiGpuState, 'NOT_TESTED');
  assert.equal(adapter.distributedInferenceState, 'NOT_TESTED');

  const receipt = runBoundedInference({
    actor: agent,
    adapter,
    receiptId: 'r1',
    requestedDevice: 'NVIDIA_GPU',
    actualDevice: 'CPU',
    latency: '15ms',
    throughput: '50',
    memoryUsage: 'cpu',
    benchmarkReference: 'bm-1',
    modelLoadSucceeded: true,
    inferenceSucceeded: true,
    executionDeviceConfirmed: true,
    cpuFallbackTestedSeparately: true,
  });
  assert.ok(!('denied' in receipt));
  assert.equal(receipt.requestedDevice, 'NVIDIA_GPU');
  assert.equal(receipt.actualDevice, 'CPU');
  assert.equal(receipt.fallbackUsed, true);
  assert.equal(receipt.gpuRemainsUnverified, true);
  assert.equal(receipt.state, 'NOT_TESTED');
  assert.equal(attemptClaimVerifiedOnSilentCpuFallback().state, 'DENIED');

  const claim = runBoundedInference({
    actor: agent,
    adapter,
    receiptId: 'r-claim',
    requestedDevice: 'NVIDIA_GPU',
    actualDevice: 'CPU',
    latency: '15ms',
    throughput: '50',
    memoryUsage: 'cpu',
    benchmarkReference: 'bm-1',
    modelLoadSucceeded: true,
    inferenceSucceeded: true,
    executionDeviceConfirmed: true,
    cpuFallbackTestedSeparately: true,
    attemptClaimVerifiedOnSilentFallback: true,
  });
  assert.equal('denied' in claim && claim.state, 'DENIED');

  const promote = attemptPromoteToVerified({
    receipt,
    preconditions: fullVerifiedPreconditions(),
  });
  assert.equal('denied' in promote && promote.state, 'DENIED');
});

test('VERIFIED requires bounded load + inference on NVIDIA_GPU path', () => {
  const adapter = registerNvidiaAdapter({
    actor: agent,
    adapterId: 'a2',
    nvidiaGpuModel: 'NVIDIA GPU',
    vram: '8GB',
    driverState: 'OK',
    cudaState: 'AVAILABLE',
    tensorRtState: 'NOT_TESTED',
    onnxCompatibility: 'COMPATIBLE',
    supportedPrecisions: 'fp16,fp32',
    modelCompatibility: 'ok',
    requestedDevice: 'NVIDIA_GPU',
    actualExecutionDevice: 'NVIDIA_GPU',
    state: 'SUPPORTED',
  });
  assert.ok(!('denied' in adapter));

  const incomplete = runBoundedInference({
    actor: agent,
    adapter,
    receiptId: 'r-inc',
    requestedDevice: 'NVIDIA_GPU',
    actualDevice: 'NVIDIA_GPU',
    latency: '3ms',
    throughput: '300',
    memoryUsage: '2GB',
    benchmarkReference: '',
    modelLoadSucceeded: true,
    inferenceSucceeded: true,
    executionDeviceConfirmed: true,
    cpuFallbackTestedSeparately: false,
    attemptVerifyWithoutPreconditions: true,
  });
  assert.equal('denied' in incomplete && incomplete.state, 'DENIED');

  const verified = runBoundedInference({
    actor: agent,
    adapter,
    receiptId: 'r-ok',
    requestedDevice: 'NVIDIA_GPU',
    actualDevice: 'NVIDIA_GPU',
    latency: '3ms',
    throughput: '300',
    memoryUsage: '2GB',
    benchmarkReference: 'bm-gpu-1',
    modelLoadSucceeded: true,
    inferenceSucceeded: true,
    executionDeviceConfirmed: true,
    cpuFallbackTestedSeparately: true,
  });
  assert.ok(!('denied' in verified));
  assert.equal(verified.state, 'VERIFIED');
  assert.equal(
    verified.preconditionsMet.length,
    NVIDIA_VERIFIED_PRECONDITIONS.length,
  );
  assert.equal(allVerifiedPreconditionsMet(fullVerifiedPreconditions()), true);

  const promoted = attemptPromoteToVerified({
    receipt: verified,
    preconditions: fullVerifiedPreconditions(),
  });
  assert.ok(!('denied' in promoted));
  assert.equal(promoted.gpuVerified, true);
});

test('safety denies: install/overclock/cloud/multi-GPU/tenant/deploy', () => {
  assert.equal(attemptAutoInstallCudaTensorRtDrivers().state, 'DENIED');
  assert.equal(attemptOverclock().state, 'DENIED');
  assert.equal(attemptThermalLimitBypass().state, 'DENIED');
  assert.equal(attemptAlterBiosFirmware().state, 'DENIED');
  assert.equal(attemptPrivilegeEscalation().state, 'DENIED');
  assert.equal(attemptAutoCloudGpuProvisioning().state, 'DENIED');
  assert.equal(attemptPrivateTenantDataLeaveUniverse().state, 'DENIED');
  assert.equal(
    attemptClaimMultiGpuVerifiedWithoutMeasurement().state,
    'DENIED',
  );
  assert.equal(
    attemptClaimDistributedVerifiedWithoutMeasurement().state,
    'DENIED',
  );
  assert.equal(attemptProductionDeploy().state, 'DENIED');
  assert.equal(attemptMainMerge().state, 'DENIED');
  assert.equal(attemptPermissionExpansion().state, 'DENIED');
  assert.equal(attemptRecommendAsAct().state, 'DENIED');
});

test('receipt to home base; guardian + human-approval unchanged', () => {
  const adapter = registerNvidiaAdapter({
    actor: agent,
    adapterId: 'a3',
    nvidiaGpuModel: 'NVIDIA GPU',
    vram: '8GB',
    driverState: 'OK',
    cudaState: 'AVAILABLE',
    tensorRtState: 'NOT_TESTED',
    onnxCompatibility: 'COMPATIBLE',
    supportedPrecisions: 'fp16',
    modelCompatibility: 'ok',
    requestedDevice: 'NVIDIA_GPU',
    actualExecutionDevice: 'NVIDIA_GPU',
  });
  assert.ok(!('denied' in adapter));
  const receipt = runBoundedInference({
    actor: agent,
    adapter,
    receiptId: 'r-home',
    requestedDevice: 'NVIDIA_GPU',
    actualDevice: 'NVIDIA_GPU',
    latency: '3ms',
    throughput: '300',
    memoryUsage: '2GB',
    benchmarkReference: 'bm-1',
    modelLoadSucceeded: true,
    inferenceSucceeded: true,
    executionDeviceConfirmed: true,
    cpuFallbackTestedSeparately: true,
  });
  assert.ok(!('denied' in receipt));
  const home = returnReceiptToHomeBase({ receipt, actor: agent });
  assert.ok(!('denied' in home));
  assert.equal(home.authorityGranted, false);
  assert.equal(home.flow[2], 'nvidia_adapter');

  const gate = requireHumanApproval({
    approvalId: 'a1',
    actor: human,
    action: 'approve_consequential',
  });
  assert.ok(!('denied' in gate));
  const g = probeGuardianRlsTenantUniverseIsolation();
  assert.equal(g.state, 'PASS');
  assert.equal(g.humanApprovalUnchanged, true);
});

test('soft-wire EP7/EP6/EP5/EP1 present; cycle hops complete', () => {
  const boot = bootstrapNvidiaAdapterResearchPath(repoRoot);
  assert.equal(boot.locksIntact, true);
  assert.equal(boot.fields.length, 18);
  assert.equal(boot.dbCandidates, 'NOT_APPLIED');

  const soft = ep8SoftWireSnapshot(repoRoot);
  assert.equal(soft.ep7AmdAdapter.present, true);
  assert.equal(soft.ep6HardwareTruthProbe.present, true);
  assert.equal(soft.ep5BenchmarkMemory.present, true);
  assert.equal(soft.ep1VirtualChipContract.present, true);

  const cycle = runNvidiaAdapterResearchCycle({
    actor: agent,
    human,
    repoRoot,
  });
  assert.equal(cycle.hops.length, NVIDIA_ADAPTER_RESEARCH_CYCLE.length);
  const hopNames = cycle.hops.map((h) => h.hop);
  for (const expected of NVIDIA_ADAPTER_RESEARCH_CYCLE) {
    assert.ok(hopNames.includes(expected), `missing hop ${expected}`);
  }
  const realFails = cycle.hops.filter((h) => h.state === 'FAIL');
  assert.equal(realFails.length, 0, JSON.stringify(realFails));
  assert.ok(!('denied' in cycle.adapter));
  assert.ok(!('denied' in cycle.receiptFallback));
  assert.equal(cycle.receiptFallback.fallbackUsed, true);
  assert.equal(cycle.receiptFallback.actualDevice, 'CPU');
  assert.ok(!('denied' in cycle.receiptVerified));
  assert.equal(cycle.receiptVerified.state, 'VERIFIED');
});
