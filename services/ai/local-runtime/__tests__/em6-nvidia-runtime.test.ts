/**
 * 62L-EM6 — NVIDIA Runtime Candidate Path unit tests.
 *
 * Fixtures prove classification / deny / honesty rules only.
 * They do NOT claim NVIDIA GPU VERIFIED or live CUDA/TensorRT evidence.
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import {
  advanceCapabilityState,
  CAPABILITY_TRUTH_PROGRESSION,
  isDetectedEqualVerified,
} from '../capability-truth';
import {
  NVIDIA_RUNTIME_PATH_CANDIDATES,
  admitNvidiaUnderResourceGovernor,
  assessMultiGpuRouting,
  attemptNvidiaOrFallbackCpu,
  classifyNvidiaGpuCandidate,
  classifyNvidiaGpusFromSnapshot,
  denyNvidiaInstallOrPrivilegedAction,
  gateCloudNvidiaAccess,
  gatePrivateTenantCrossNodeMove,
  recordCpuFallbackReceipt,
  refuseNvidiaAutoVerify,
  resolveNvidiaExecutionState,
  routeWithNvidiaCandidatePolicy,
} from '../nvidia-runtime-adapter';
import {
  EM6_HONESTY_BANNER,
  EM6_INTEGRATION_STATUS,
  EM6_LOCKS,
  EM6_NOT_TESTED_CLAIMS,
  assertEm6LocksIntact,
} from '../em6-honesty';
import {
  EM6_CROSS_VENDOR_BENCHMARK_CONTRACT,
  describeEm6BenchmarkContract,
  isEm6BenchmarkSuiteMeasured,
} from '../em6-cross-vendor-benchmark-contract';
import { probeEm6SoftWires } from '../em6-soft-wire';
import { simulateHardwareProbe } from '../hardware-probe';
import { routeWorkload } from '../workload-router';
import { canAutoExecute, requiresHumanApproval, authorizeTool } from '../../policies';
import { getAgentTool } from '../../tools';
import type { HardwareSnapshot } from '../types';

const NVIDIA_FIXTURE = {
  Name: 'NVIDIA GeForce RTX Fixture',
  AdapterCompatibility: 'NVIDIA',
  DriverVersion: '560.0.fixture',
};

function snapshotWithDetectedNvidia(): HardwareSnapshot {
  return simulateHardwareProbe({
    displayAdapters: [NVIDIA_FIXTURE],
    npuDevices: [],
  });
}

test('EM6 honesty banner and integration status are INTEGRATION_CANDIDATE', () => {
  assert.match(EM6_HONESTY_BANNER, /DOCUMENTED/);
  assert.equal(EM6_INTEGRATION_STATUS, 'INTEGRATION_CANDIDATE');
  assert.equal(assertEm6LocksIntact(), true);
});

test('truth progression UNKNOWN → DETECTED → SUPPORTED → VERIFIED; deny DETECTED→VERIFIED skip', () => {
  assert.deepEqual([...CAPABILITY_TRUTH_PROGRESSION], [
    'UNKNOWN',
    'DETECTED',
    'SUPPORTED',
    'VERIFIED',
  ]);
  const skip = advanceCapabilityState('DETECTED', 'VERIFIED');
  assert.equal(skip.allowed, false);
  assert.ok(skip.skippedSteps.includes('SUPPORTED'));
  assert.equal(isDetectedEqualVerified(), false);
});

test('detecting NVIDIA GPU ≠ proving CUDA or TensorRT works', () => {
  const candidate = classifyNvidiaGpuCandidate({
    name: 'NVIDIA GeForce RTX Fixture',
    vendor: 'NVIDIA',
    driverObserved: true,
  });
  assert.ok(candidate);
  assert.equal(candidate!.hardwareState, 'DETECTED');
  assert.equal(candidate!.tracking.cudaState, 'UNKNOWN');
  assert.equal(candidate!.tracking.tensorRtState, 'UNKNOWN');
  assert.equal(candidate!.tracking.tensorRtLlmState, 'UNKNOWN');
  assert.equal(candidate!.detectedEqualsCudaWorks, false);
  assert.equal(candidate!.detectedEqualsTensorRtWorks, false);
  assert.equal(candidate!.integrationStatus, 'INTEGRATION_CANDIDATE');
  assert.equal(EM6_LOCKS.NVIDIA_DETECTED_EQ_CUDA_WORKS, false);
  assert.equal(EM6_LOCKS.NVIDIA_DETECTED_EQ_TENSORRT_WORKS, false);
});

test('adapter tracking fields present on candidate', () => {
  const c = classifyNvidiaGpuCandidate({
    name: 'NVIDIA RTX A4000',
    deviceId: 'dev-a4000',
    vramBytes: 16 * 1024 * 1024 * 1024,
  })!;
  assert.equal(c.tracking.deviceId, 'dev-a4000');
  assert.equal(c.tracking.gpuModel, 'NVIDIA RTX A4000');
  assert.equal(c.tracking.vramBytes, 16 * 1024 * 1024 * 1024);
  assert.ok(c.tracking.driverState);
  assert.ok(c.tracking.cudaState);
  assert.ok(c.tracking.tensorRtState);
  assert.ok(c.tracking.onnxCompatibility);
  assert.ok(Array.isArray(c.tracking.supportedPrecisionModes));
  assert.ok(c.tracking.modelCompatibility);
  assert.ok(Array.isArray(c.tracking.benchmarkEvidence));
  assert.ok(c.tracking.thermalResourceState);
  assert.equal(c.tracking.lastVerificationTimestamp, null);
  assert.equal(c.tracking.fallbackRoute, 'cpu');
});

test('runtime path candidates are CANDIDATE / not proven', () => {
  const ids = NVIDIA_RUNTIME_PATH_CANDIDATES.map((p) => p.id).sort();
  assert.ok(ids.includes('cuda'));
  assert.ok(ids.includes('tensorrt'));
  assert.ok(ids.includes('tensorrt-llm'));
  for (const path of NVIDIA_RUNTIME_PATH_CANDIDATES) {
    assert.equal(path.status, 'CANDIDATE');
    assert.equal(path.proven, false);
  }
});

test('refuse auto-verify from DETECTED; execution stays NOT_TESTED without bounded inference', () => {
  const c = classifyNvidiaGpuCandidate({ name: 'NVIDIA GeForce RTX 4090' })!;
  const refused = refuseNvidiaAutoVerify(c);
  assert.equal(refused.allowed, false);
  assert.equal(refused.claimedVerified, false);
  assert.equal(c.executionState, 'NOT_TESTED');

  const unresolved = resolveNvidiaExecutionState({
    hardwareState: 'DETECTED',
    evidence: {
      requestedPath: 'cuda',
      actualPath: null,
      boundedInferenceCompleted: false,
    },
  });
  assert.equal(unresolved.executionState, 'NOT_TESTED');
  assert.equal(unresolved.nvidiaVerifiedClaimed, false);
});

test('VERIFIED requires bounded inference on the *requested* NVIDIA path', () => {
  // Success on DETECTED → SUPPORTED only (no auto VERIFIED).
  const supported = resolveNvidiaExecutionState({
    hardwareState: 'DETECTED',
    evidence: {
      requestedPath: 'cuda',
      actualPath: 'cuda',
      boundedInferenceCompleted: true,
      inferenceSucceeded: true,
      modelId: 'tiny-fixture',
    },
  });
  assert.equal(supported.executionState, 'SUPPORTED');
  assert.equal(supported.nvidiaVerifiedClaimed, false);

  // From SUPPORTED + matching requested path → may VERIFIED.
  const verified = resolveNvidiaExecutionState({
    hardwareState: 'SUPPORTED',
    evidence: {
      requestedPath: 'tensorrt',
      actualPath: 'tensorrt',
      boundedInferenceCompleted: true,
      inferenceSucceeded: true,
    },
  });
  assert.equal(verified.executionState, 'VERIFIED');
  assert.equal(verified.nvidiaVerifiedClaimed, true);

  // Mismatched actual path cannot VERIFIED.
  const mismatch = resolveNvidiaExecutionState({
    hardwareState: 'SUPPORTED',
    evidence: {
      requestedPath: 'tensorrt',
      actualPath: 'cuda',
      boundedInferenceCompleted: true,
      inferenceSucceeded: true,
    },
  });
  assert.equal(mismatch.executionState, 'NOT_TESTED');
  assert.equal(mismatch.nvidiaVerifiedClaimed, false);
});

test('CPU fallback recorded explicitly; cannot verify the GPU', () => {
  const resolved = resolveNvidiaExecutionState({
    hardwareState: 'SUPPORTED',
    evidence: {
      requestedPath: 'cuda',
      actualPath: 'cpu',
      boundedInferenceCompleted: true,
      inferenceSucceeded: true,
    },
  });
  assert.equal(resolved.cpuFallbackRecorded, true);
  assert.equal(resolved.nvidiaVerifiedClaimed, false);
  assert.equal(resolved.executionState, 'NOT_TESTED');
  assert.match(resolved.reason, /CPU_FALLBACK/);

  const outcome = attemptNvidiaOrFallbackCpu({
    preferNvidia: true,
    hardwareState: 'DETECTED',
    executionState: 'NOT_TESTED',
    requestedPath: 'cuda',
    actualPath: 'cpu',
    boundedInferenceCompleted: true,
    inferenceSucceeded: true,
  });
  assert.equal(outcome.fallbackToCpu, true);
  assert.equal(outcome.fallbackRecordedExplicitly, true);
  assert.equal(outcome.nvidiaVerified, false);
  assert.equal(outcome.compute, 'cpu');

  const receipt = recordCpuFallbackReceipt({
    modelId: 'tiny',
    reason: 'NVIDIA_PATH_NOT_VERIFIED',
  });
  assert.equal(receipt.fallbackRoute, 'cpu');
  assert.equal(receipt.nvidiaVerified, false);
});

test('install / privileged config actions are denied', () => {
  for (const action of [
    'install_cuda',
    'install_driver',
    'install_tensorrt',
    'install_system_package',
    'overclock',
    'bios_change',
    'thermal_limit_bypass',
    'privileged_config_change',
  ] as const) {
    const denied = denyNvidiaInstallOrPrivilegedAction(action);
    assert.equal(denied.allowed, false);
    assert.equal(denied.l4AutonomyEnabled, false);
    assert.ok(denied.reason.startsWith('EM6_DENY_'));
  }
});

test('multi-GPU routing remains NOT_TESTED until measured', () => {
  const candidates = [
    classifyNvidiaGpuCandidate({ name: 'NVIDIA RTX 0', deviceId: 'g0' })!,
    classifyNvidiaGpuCandidate({ name: 'NVIDIA RTX 1', deviceId: 'g1' })!,
  ];
  const assessment = assessMultiGpuRouting(candidates);
  assert.equal(assessment.deviceCount, 2);
  assert.equal(assessment.routingState, 'NOT_TESTED');
  assert.equal(assessment.assumedVerified, false);
  assert.equal(candidates[0]!.multiGpuRoutingState, 'NOT_TESTED');
});

test('cloud NVIDIA requires authorization + spend controls; no auto-purchase', () => {
  const deniedPurchase = gateCloudNvidiaAccess({
    providerId: 'acme-gpu-cloud',
    explicitlyAuthorized: true,
    spendControlsPresent: true,
    autoPurchaseRequested: true,
  });
  assert.equal(deniedPurchase.allowed, false);
  assert.ok(deniedPurchase.reasons.includes('EM6_DENY_CLOUD_NVIDIA_AUTO_PURCHASE'));
  assert.equal(deniedPurchase.autoPurchaseForbidden, true);

  const deniedAuth = gateCloudNvidiaAccess({
    providerId: 'acme-gpu-cloud',
    explicitlyAuthorized: false,
    spendControlsPresent: true,
  });
  assert.equal(deniedAuth.allowed, false);

  const deniedSpend = gateCloudNvidiaAccess({
    providerId: 'acme-gpu-cloud',
    explicitlyAuthorized: true,
    spendControlsPresent: false,
  });
  assert.equal(deniedSpend.allowed, false);

  const allowed = gateCloudNvidiaAccess({
    providerId: 'acme-gpu-cloud',
    explicitlyAuthorized: true,
    spendControlsPresent: true,
    autoPurchaseRequested: false,
  });
  assert.equal(allowed.allowed, true);
});

test('private/tenant data cannot move cross-node without explicit authorization', () => {
  const denied = gatePrivateTenantCrossNodeMove({
    privacyClass: 'private',
    sourceNodeId: 'node-a',
    destinationNodeId: 'node-b',
    explicitlyAuthorized: false,
  });
  assert.equal(denied.allowed, false);

  const ok = gatePrivateTenantCrossNodeMove({
    privacyClass: 'tenant',
    sourceNodeId: 'node-a',
    destinationNodeId: 'node-b',
    explicitlyAuthorized: true,
  });
  assert.equal(ok.allowed, true);
});

test('EL9 soft resource governor limits VRAM, concurrency, runtime, queue, duration', () => {
  const over = admitNvidiaUnderResourceGovernor({
    estimatedVramBytes: 64 * 1024 * 1024 * 1024,
    concurrency: 8,
    estimatedRuntimeMs: 999_999,
    queueDepth: 100,
    taskDurationMs: 999_999,
  });
  assert.equal(over.allowed, false);
  assert.ok(over.reasons.includes('EM6_EL9_VRAM_CEILING'));
  assert.ok(over.reasons.includes('EM6_EL9_CONCURRENCY_CEILING'));

  const ok = admitNvidiaUnderResourceGovernor({
    estimatedVramBytes: 1 * 1024 * 1024 * 1024,
    concurrency: 1,
    estimatedRuntimeMs: 1_000,
    queueDepth: 1,
    taskDurationMs: 5_000,
  });
  assert.equal(ok.allowed, true);
});

test('CPU remains default route when NVIDIA is only DETECTED', () => {
  const snap = snapshotWithDetectedNvidia();
  assert.equal(snap.gpus[0]?.vendor, 'NVIDIA');
  assert.equal(snap.gpus[0]?.state, 'DETECTED');
  const decision = routeWorkload(snap, { preferLocal: true });
  assert.equal(decision.compute, 'cpu');
  const withPolicy = routeWithNvidiaCandidatePolicy(snap);
  assert.equal(withPolicy.compute, 'cpu');
  assert.equal(withPolicy.nvidiaCandidates.length, 1);
  assert.equal(withPolicy.nvidiaCandidates[0]!.integrationStatus, 'INTEGRATION_CANDIDATE');
});

test('snapshot classifier ignores non-NVIDIA adapters', () => {
  const snap = simulateHardwareProbe({
    displayAdapters: [
      {
        Name: 'AMD Radeon Graphics',
        AdapterCompatibility: 'Advanced Micro Devices, Inc.',
      },
      NVIDIA_FIXTURE,
    ],
  });
  const nvidia = classifyNvidiaGpusFromSnapshot(snap);
  assert.equal(nvidia.length, 1);
  assert.equal(nvidia[0]!.vendor, 'NVIDIA');
});

test('cross-vendor benchmark contract is CONTRACT_ONLY / NOT_TESTED', () => {
  const contract = describeEm6BenchmarkContract();
  assert.equal(contract.status, 'CONTRACT_ONLY');
  assert.equal(contract.measurementState, 'NOT_TESTED');
  assert.equal(contract.liveMultiVendorHardwareRequiredForEm6, false);
  assert.equal(isEm6BenchmarkSuiteMeasured(), false);
  assert.deepEqual([...EM6_CROSS_VENDOR_BENCHMARK_CONTRACT.orderedTargets], [
    'cpu',
    'amd_gpu',
    'amd_npu',
    'nvidia_gpu',
  ]);
  assert.ok(EM6_NOT_TESTED_CLAIMS.includes('cross_vendor_cpu_amd_nvidia_benchmark_suite_measured'));
});

test('soft-wire EM4/EL8/EM5/EL9 presence probe; L4 false; Guardian intact', () => {
  const probe = probeEm6SoftWires();
  assert.equal(probe.l4AutonomyEnabled, false);
  assert.equal(probe.detectedEqualsVerified, false);
  assert.equal(probe.silentFallbackEqualsNvidiaVerified, false);
  assert.equal(probe.cpuFallbackEqualsNvidiaVerified, false);
  assert.equal(probe.guardianRlsTenantBoundariesIntact, true);
  assert.equal(probe.universeBoundariesIntact, true);
  assert.equal(probe.el8ModelLoadEvidence, 'PRESENT');
  assert.equal(probe.el9ResourceGovernor, 'PRESENT');
  assert.equal(probe.nvidiaAdapter, 'PRESENT');
  // EM5 soft-wires via existing onnx-windows-ml-adapter when EM5 module absent.
  assert.equal(probe.em5AmdWindowsMlCandidate, 'PRESENT');
  assert.equal(probe.locks.em6.L4_AUTONOMY_ENABLED, false);
  assert.equal(probe.locks.el9.L4_AUTONOMY_ENABLED, false);
});

test('Guardian/policy soft-wire unchanged — high-risk blocked; canAutoExecute false', () => {
  const high = authorizeTool({
    agentType: 'executive_agent',
    toolId: 'move_money',
  });
  assert.equal(high.allowed, false);
  assert.equal(high.reason, 'policy_high_risk_blocked');
  const mediumTool = getAgentTool('draft_community_intro');
  assert.equal(requiresHumanApproval(mediumTool), true);
  assert.equal(canAutoExecute(mediumTool), false);
});

test('L4_AUTONOMY_ENABLED=false; unit fixtures do not claim NVIDIA VERIFIED', () => {
  assert.equal(EM6_LOCKS.L4_AUTONOMY_ENABLED, false);
  const snap = snapshotWithDetectedNvidia();
  for (const gpu of snap.gpus) {
    assert.notEqual(gpu.state, 'VERIFIED');
  }
  const c = classifyNvidiaGpusFromSnapshot(snap)[0]!;
  assert.notEqual(c.hardwareState, 'VERIFIED');
  assert.notEqual(c.executionState, 'VERIFIED');
  assert.equal(c.integrationStatus, 'INTEGRATION_CANDIDATE');
});
