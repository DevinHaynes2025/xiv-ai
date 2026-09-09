/**
 * 62L-EM5 — AMD Windows ML Adapter Path tests.
 *
 * Fixtures enforce rule gates only — never fake live ASUS verification.
 * Default remains NOT_TESTED / UNAVAILABLE without measured evidence.
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import {
  EM5_CORE_FLOW,
  EM5_LOCKS,
  EM5_NOT_TESTED_CLAIMS,
  assertEm5LocksIntact,
  NEXT_PHASE_EM6,
} from '../em5-honesty';
import { probeEm5SoftWires } from '../em5-soft-wire';
import {
  applyAmdProviderVerificationGate,
  defaultAmdWindowsMlAdapter,
  em5AdapterHonesty,
  runAmdWindowsMlAdapterPath,
  type Em5EnvelopeRequest,
} from '../amd-windows-ml-adapter-path';

function baseRequest(overrides: Partial<Em5EnvelopeRequest> = {}): Em5EnvelopeRequest {
  return {
    requestId: 'req-em5-1',
    agentId: 'agent-1',
    homeUniverseId: 'universe-home',
    tenantId: 'tenant-a',
    purpose: 'local-inference',
    modelId: 'tiny-onnx-fixture',
    modelVersionOrHash: 'sha256:fixture',
    requestedDevice: 'auto',
    authorized: true,
    authVerified: true,
    guardianAllow: true,
    rlsTenantInScope: true,
    universeBoundaryOk: true,
    returnPath: 'xiv-home-base',
    ...overrides,
  };
}

test('EM5 locks intact: L4=false, DETECTED/SUPPORTED≠VERIFIED, no driver/BIOS/cloud', () => {
  assert.equal(assertEm5LocksIntact(), true);
  assert.equal(EM5_LOCKS.L4_AUTONOMY_ENABLED, false);
  assert.equal(EM5_LOCKS.DETECTED_OR_SUPPORTED_EQ_VERIFIED_INFERENCE_HARDWARE, false);
  assert.equal(EM5_LOCKS.SILENT_FALLBACK_EQ_ACCELERATOR_VERIFIED, false);
  assert.equal(EM5_LOCKS.DRIVER_INSTALL_FORBIDDEN, true);
  assert.equal(EM5_LOCKS.BIOS_OVERCLOCK_FORBIDDEN, true);
  assert.equal(EM5_LOCKS.AUTOMATIC_MODEL_DOWNLOAD_FORBIDDEN, true);
  assert.equal(EM5_LOCKS.CLOUD_ESCALATION_FORBIDDEN, true);
  assert.equal(EM5_LOCKS.MANAGE_PULL_REQUEST, false);
  assert.match(NEXT_PHASE_EM6, /EM6/);
});

test('core flow encodes envelope → policy → registry → adapter → EP → receipt → home', () => {
  assert.deepEqual([...EM5_CORE_FLOW], [
    'AGENT_COMPUTE_ENVELOPE',
    'POLICY_GATE',
    'UNIVERSAL_COMPUTE_REGISTRY',
    'AMD_WINDOWS_ML_ADAPTER',
    'ACTUAL_EXECUTION_PROVIDER',
    'RETURN_RECEIPT',
    'XIV_HOME_BASE',
  ]);
});

test('default adapter: CPU DETECTED; GPU/NPU/WindowsML/ORT NOT_TESTED; no AMD VERIFIED claim', () => {
  const adapter = defaultAmdWindowsMlAdapter();
  assert.equal(adapter.cpuState, 'DETECTED');
  assert.equal(adapter.gpuState, 'NOT_TESTED');
  assert.equal(adapter.npuState, 'NOT_TESTED');
  assert.equal(adapter.windowsMlState, 'NOT_TESTED');
  assert.equal(adapter.onnxRuntimeState, 'NOT_TESTED');
  assert.equal(adapter.lastVerifiedAt, null);
  assert.equal(adapter.benchmarkEvidence.length, 0);
  assert.equal(adapter.fallbackPolicy.allowCpuFallback, true);
  assert.equal(adapter.fallbackPolicy.silentFallbackVerifiesAccelerator, false);
  assert.equal(adapter.fallbackPolicy.allowCloudEscalation, false);

  const honesty = em5AdapterHonesty();
  assert.equal(honesty.amdVerifiedClaimedWithoutEvidence, false);
  assert.equal(honesty.defaultGpuState, 'NOT_TESTED');
});

test('soft-wire probes EL7/EL8/EL9/EM ONNX + optional EM3/EM4 presence', () => {
  const probe = probeEm5SoftWires();
  assert.equal(probe.el7InferenceAdapter, 'PRESENT');
  assert.equal(probe.el8ModelLoadEvidence, 'PRESENT');
  assert.equal(probe.el9ResourceGovernor, 'PRESENT');
  assert.equal(probe.emOnnxWindowsMlAdapter, 'PRESENT');
  assert.equal(probe.el5GpuModule, 'PRESENT');
  assert.equal(probe.el6NpuModule, 'PRESENT');
  assert.equal(probe.detectedEqualsVerified, false);
  assert.equal(probe.l4AutonomyEnabled, false);
  assert.equal(probe.guardianRlsTenantBoundariesIntact, true);
  // EM3/EM4 may be PRESENT or ABSENT depending on sibling park-and-implement landing.
  assert.ok(probe.em3RegistryTypes === 'PRESENT' || probe.em3RegistryTypes === 'ABSENT');
  assert.ok(probe.em4EnvelopeTypes === 'PRESENT' || probe.em4EnvelopeTypes === 'ABSENT');
});

test('CPU is safe default; default run returns UNAVAILABLE without measured evidence', () => {
  const result = runAmdWindowsMlAdapterPath({ request: baseRequest() });
  assert.equal(result.receipt.actualProvider, 'cpu');
  assert.equal(result.receipt.actualDevice, 'cpu');
  assert.equal(result.receipt.status, 'UNAVAILABLE');
  assert.equal(result.receipt.acceleratorVerified, false);
  assert.equal(result.receipt.l4AutonomyEnabled, false);
  assert.ok(result.receipt.latencyMs !== undefined);
  assert.equal(result.adapter.gpuState, 'NOT_TESTED');
  assert.equal(result.adapter.npuState, 'NOT_TESTED');
  for (const claim of EM5_NOT_TESTED_CLAIMS) {
    assert.ok(result.receipt.notes.some((n) => n.includes(claim)));
  }
});

test('DETECTED GPU ≠ VERIFIED; GPU request falls back to CPU with explicit receipt flag', () => {
  const adapter = defaultAmdWindowsMlAdapter({ gpuState: 'DETECTED' });
  const result = runAmdWindowsMlAdapterPath({
    request: baseRequest({ requestedDevice: 'gpu' }),
    adapter,
  });
  assert.equal(result.receipt.status, 'FALLBACK_CPU');
  assert.equal(result.receipt.fallbackUsed, true);
  assert.equal(result.receipt.silentFallbackDetected, true);
  assert.equal(result.receipt.acceleratorVerified, false);
  assert.equal(result.receipt.actualDevice, 'cpu');
  assert.equal(result.receipt.failureState, 'ACCELERATOR_NOT_VERIFIED');
  assert.equal(result.adapter.gpuState, 'DETECTED');
});

test('SUPPORTED NPU ≠ VERIFIED; NPU request records explicit CPU fallback', () => {
  const adapter = defaultAmdWindowsMlAdapter({ npuState: 'SUPPORTED' });
  const result = runAmdWindowsMlAdapterPath({
    request: baseRequest({ requestedDevice: 'npu' }),
    adapter,
  });
  assert.equal(result.receipt.fallbackUsed, true);
  assert.equal(result.receipt.acceleratorVerified, false);
  assert.equal(result.receipt.status, 'FALLBACK_CPU');
  assert.equal(result.adapter.npuState, 'SUPPORTED');
});

test('verification gate denies fake VERIFIED without exact-EP inference', () => {
  const adapter = defaultAmdWindowsMlAdapter({ gpuState: 'DETECTED' });
  const gate = applyAmdProviderVerificationGate({
    adapter,
    providerId: 'amd-gpu',
    priorState: 'DETECTED',
    fixture: null,
    claimVerifiedWithoutExactEpInference: true,
  });
  assert.equal(gate.verified, false);
  assert.equal(gate.denied, true);
  assert.equal(gate.resultingState, 'DETECTED');

  const run = runAmdWindowsMlAdapterPath({
    request: baseRequest({ requestedDevice: 'gpu' }),
    adapter,
    claimVerifiedWithoutExactEpInference: true,
  });
  assert.equal(run.receipt.status, 'DENIED');
  assert.equal(run.receipt.failureState, 'ACCELERATOR_NOT_VERIFIED');
});

test('AMD GPU VERIFIED only after fixture exact-EP bounded inference', () => {
  const adapter = defaultAmdWindowsMlAdapter({
    gpuState: 'SUPPORTED',
    windowsMlState: 'SUPPORTED',
    onnxRuntimeState: 'SUPPORTED',
  });
  const result = runAmdWindowsMlAdapterPath({
    request: baseRequest({
      requestedDevice: 'gpu',
      compatibleProviders: ['amd-gpu', 'cpu'],
    }),
    adapter,
    measuredEvidenceFixture: {
      providerId: 'amd-gpu',
      providerState: 'VERIFIED',
      boundedInferenceSucceeded: true,
      modelLoadCompleted: true,
      latencyMs: 42,
      modelVersionOrHash: 'sha256:gpu-ok',
      output: { tokens: 3 },
      resourceEvidence: { memoryMbObserved: 512, notes: ['gpu-fixture'] },
    },
  });
  assert.equal(result.receipt.status, 'OK');
  assert.equal(result.receipt.actualProvider, 'amd-gpu');
  assert.equal(result.receipt.actualDevice, 'gpu');
  assert.equal(result.receipt.latencyMs, 42);
  assert.equal(result.receipt.modelVersionOrHash, 'sha256:gpu-ok');
  assert.equal(result.receipt.acceleratorVerified, true);
  assert.equal(result.receipt.fallbackUsed, false);
  assert.equal(result.adapter.gpuState, 'VERIFIED');
  assert.ok(result.adapter.benchmarkEvidence.length >= 1);
  assert.ok(result.adapter.lastVerifiedAt);
  assert.equal(result.receipt.resourceEvidence.memoryMbObserved, 512);
});

test('AMD NPU VERIFIED fixture path returns runtime/provider + resource evidence', () => {
  const adapter = defaultAmdWindowsMlAdapter({ npuState: 'SUPPORTED' });
  const result = runAmdWindowsMlAdapterPath({
    request: baseRequest({
      requestedDevice: 'npu',
      compatibleProviders: ['amd-npu'],
    }),
    adapter,
    measuredEvidenceFixture: {
      providerId: 'amd-npu',
      providerState: 'VERIFIED',
      boundedInferenceSucceeded: true,
      modelLoadCompleted: true,
      latencyMs: 17,
      modelVersionOrHash: 'sha256:npu-ok',
    },
  });
  assert.equal(result.receipt.status, 'OK');
  assert.equal(result.receipt.actualProvider, 'amd-npu');
  assert.equal(result.receipt.latencyMs, 17);
  assert.match(result.receipt.runtimeProvider, /amd-npu/);
  assert.equal(result.adapter.npuState, 'VERIFIED');
});

test('model/provider incompatibility denied before execution', () => {
  const adapter = defaultAmdWindowsMlAdapter({ gpuState: 'VERIFIED' });
  const result = runAmdWindowsMlAdapterPath({
    request: baseRequest({
      requestedDevice: 'gpu',
      compatibleProviders: ['amd-npu'], // not gpu, not cpu
    }),
    adapter,
    measuredEvidenceFixture: {
      providerId: 'amd-gpu',
      providerState: 'VERIFIED',
      boundedInferenceSucceeded: true,
      modelLoadCompleted: true,
      latencyMs: 10,
      modelVersionOrHash: 'sha256:x',
    },
  });
  assert.equal(result.receipt.status, 'DENIED');
  assert.equal(result.receipt.failureState, 'MODEL_PROVIDER_INCOMPATIBLE');
});

test('failed accelerator execution falls back only according to policy', () => {
  const allow = defaultAmdWindowsMlAdapter({
    gpuState: 'SUPPORTED',
    fallbackPolicy: {
      allowCpuFallback: true,
      allowAcceleratorFailToCpu: true,
      silentFallbackVerifiesAccelerator: false,
      allowCloudEscalation: false,
    },
  });
  const allowed = runAmdWindowsMlAdapterPath({
    request: baseRequest({
      requestedDevice: 'gpu',
      compatibleProviders: ['amd-gpu', 'cpu'],
    }),
    adapter: allow,
    measuredEvidenceFixture: {
      providerId: 'amd-gpu',
      providerState: 'VERIFIED',
      boundedInferenceSucceeded: true,
      modelLoadCompleted: true,
      latencyMs: 9,
      modelVersionOrHash: 'sha256:fail',
      acceleratorExecutionFailed: true,
    },
  });
  assert.equal(allowed.receipt.status, 'FALLBACK_CPU');
  assert.equal(allowed.receipt.fallbackUsed, true);
  assert.equal(allowed.receipt.acceleratorVerified, false);
  assert.equal(allowed.receipt.failureState, 'ACCELERATOR_EXECUTION_FAILED');

  const denyPolicy = defaultAmdWindowsMlAdapter({
    gpuState: 'SUPPORTED',
    fallbackPolicy: {
      allowCpuFallback: true,
      allowAcceleratorFailToCpu: false,
      silentFallbackVerifiesAccelerator: false,
      allowCloudEscalation: false,
    },
  });
  const denied = runAmdWindowsMlAdapterPath({
    request: baseRequest({
      requestedDevice: 'gpu',
      compatibleProviders: ['amd-gpu', 'cpu'],
    }),
    adapter: denyPolicy,
    measuredEvidenceFixture: {
      providerId: 'amd-gpu',
      providerState: 'VERIFIED',
      boundedInferenceSucceeded: true,
      modelLoadCompleted: true,
      latencyMs: 9,
      modelVersionOrHash: 'sha256:fail2',
      acceleratorExecutionFailed: true,
    },
  });
  assert.equal(denied.receipt.status, 'DENIED');
  assert.equal(denied.receipt.failureState, 'FALLBACK_POLICY_DENIED');
});

test('policy denies: auth / Guardian / RLS / Universe / auto-download / cloud / BIOS', () => {
  const noAuth = runAmdWindowsMlAdapterPath({
    request: baseRequest({ authVerified: false }),
  });
  assert.equal(noAuth.receipt.status, 'DENIED');
  assert.equal(noAuth.receipt.failureState, 'AUTH_REQUIRED');

  const noGuardian = runAmdWindowsMlAdapterPath({
    request: baseRequest({ guardianAllow: false }),
  });
  assert.equal(noGuardian.receipt.failureState, 'GUARDIAN_DENIED');

  const download = runAmdWindowsMlAdapterPath({
    request: baseRequest({ authorizeModelDownload: true }),
  });
  assert.equal(download.receipt.failureState, 'AUTO_DOWNLOAD_DENIED');

  const cloud = runAmdWindowsMlAdapterPath({
    request: baseRequest({ authorizeCloudEscalation: true }),
  });
  assert.equal(cloud.receipt.failureState, 'CLOUD_ESCALATION_DENIED');

  const bios = runAmdWindowsMlAdapterPath({
    request: baseRequest({ authorizeBiosOrOverclock: true }),
  });
  assert.equal(bios.receipt.failureState, 'DRIVER_BIOS_DENIED');

  const priv = runAmdWindowsMlAdapterPath({
    request: baseRequest({ authorizePrivilegeEscalation: true }),
  });
  assert.equal(priv.receipt.failureState, 'PRIVILEGE_ESCALATION_DENIED');

  const persist = runAmdWindowsMlAdapterPath({
    request: baseRequest({ authorizeHiddenPersistence: true }),
  });
  assert.equal(persist.receipt.failureState, 'HIDDEN_PERSISTENCE_DENIED');
});

test('receipt always carries latency/device/runtime/model hash/resource/failure fields', () => {
  const result = runAmdWindowsMlAdapterPath({
    request: baseRequest({ requestedDevice: 'cpu' }),
    measuredEvidenceFixture: {
      providerId: 'cpu',
      providerState: 'VERIFIED',
      boundedInferenceSucceeded: true,
      modelLoadCompleted: true,
      latencyMs: 11,
      modelVersionOrHash: 'sha256:cpu',
      resourceEvidence: { cpuPercentObserved: 12, memoryMbObserved: 256 },
    },
  });
  assert.equal(result.receipt.status, 'OK');
  assert.equal(result.receipt.latencyMs, 11);
  assert.equal(result.receipt.actualDevice, 'cpu');
  assert.ok(result.receipt.runtimeProvider.length > 0);
  assert.equal(result.receipt.modelVersionOrHash, 'sha256:cpu');
  assert.equal(result.receipt.resourceEvidence.memoryMbObserved, 256);
  assert.equal(result.receipt.failureState, null);
  assert.equal(result.receipt.homeUniverseId, 'universe-home');
  assert.equal(result.receipt.tenantId, 'tenant-a');
});

test('tracking fields present on adapter record', () => {
  const a = defaultAmdWindowsMlAdapter({
    supportedModels: ['tiny-onnx-fixture'],
    deviceId: 'dev-1',
  });
  assert.ok(a.adapterId);
  assert.ok(a.runtimeVersion);
  assert.ok('windowsMlState' in a);
  assert.ok('onnxRuntimeState' in a);
  assert.ok('deviceId' in a);
  assert.ok('cpuState' in a);
  assert.ok('gpuState' in a);
  assert.ok('npuState' in a);
  assert.ok('supportedModels' in a);
  assert.ok('lastVerifiedAt' in a);
  assert.ok('benchmarkEvidence' in a);
  assert.ok('fallbackPolicy' in a);
  assert.ok('resourceLimits' in a);
});
