/**
 * 62L-EL6 — AMD NPU capability candidate denial + honesty tests.
 *
 * Encodes: AMD CPU ≠ NPU; no skip to VERIFIED; safe degrade; evidence fields;
 * presence probe starts NOT_TESTED; fixtures may simulate DETECTED never auto-VERIFIED.
 */

import test from 'node:test';
import assert from 'node:assert/strict';

import {
  advanceCapabilityState,
  CAPABILITY_TRUTH_PROGRESSION,
  isDetectedEqualVerified,
} from '../capability-truth';
import {
  AMD_NPU_RUNTIME_PATH_CANDIDATES,
  EL6_LOCKS,
  attemptNpuOrDegrade,
  classifyAmdNpuCandidate,
  classifyAmdNpusFromSnapshot,
  initialNpuCapabilityPosture,
  refuseAmdCpuAsNpuInference,
  refuseAmdNpuAutoVerify,
  resolveNpuExecutionState,
  routeWithAmdNpuCandidatePolicy,
} from '../amd-npu-capability';
import { probeNpuPresence } from '../npu-presence-probe';
import {
  npuEvidenceFieldsPresent,
  recordNpuCapabilityBenchmark,
} from '../npu-benchmark';
import { probeEl6SoftWires } from '../soft-wire-el6';
import type { HardwareSnapshot } from '../types';

const amdCpuOnlySnapshot: HardwareSnapshot = {
  capturedAt: '2026-09-09T13:30:00.000Z',
  platform: 'linux',
  release: 'test',
  arch: 'x64',
  totalMemoryBytes: 32_000_000_000,
  freeMemoryBytes: 16_000_000_000,
  cpu: {
    kind: 'cpu',
    name: 'AMD Ryzen AI 9 HX 370 w/ Radeon 890M',
    vendor: 'AMD',
    state: 'DETECTED',
    evidence: ['fixture cpu'],
  },
  gpus: [
    {
      kind: 'gpu',
      name: 'AMD Radeon 890M',
      vendor: 'AMD',
      state: 'DETECTED',
      evidence: ['fixture gpu'],
    },
  ],
  npus: [],
  notes: [],
};

test('EL6 locks keep L4 false and forbid privileged/cloud side effects', () => {
  assert.equal(EL6_LOCKS.L4_AUTONOMY_ENABLED, false);
  assert.equal(EL6_LOCKS.DRIVER_INSTALL_FORBIDDEN, true);
  assert.equal(EL6_LOCKS.BIOS_CHANGE_FORBIDDEN, true);
  assert.equal(EL6_LOCKS.PERMISSION_ELEVATION_FORBIDDEN, true);
  assert.equal(EL6_LOCKS.POWER_PLAN_CHANGE_FORBIDDEN, true);
  assert.equal(EL6_LOCKS.HIDDEN_PERSISTENCE_FORBIDDEN, true);
  assert.equal(EL6_LOCKS.CLOUD_PROVISIONING_FORBIDDEN, true);
  assert.equal(EL6_LOCKS.EXTERNAL_MODEL_ROUTING_FORBIDDEN, true);
  assert.equal(EL6_LOCKS.GUARDIAN_RLS_TENANT_BOUNDARIES_INTACT, true);
  assert.equal(EL6_LOCKS.HUMAN_APPROVAL_REQUIRED_INTACT, true);
  assert.equal(EL6_LOCKS.AMD_CPU_DOES_NOT_IMPLY_NPU, true);
  assert.equal(EL6_LOCKS.DETECTED_EQ_VERIFIED, false);
});

test('truth progression is UNKNOWN → DETECTED → SUPPORTED → VERIFIED with no skip', () => {
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

test('initial NPU posture is NOT_TESTED / not VERIFIED', () => {
  const posture = initialNpuCapabilityPosture();
  assert.equal(posture.hardwareState, 'NOT_TESTED');
  assert.equal(posture.executionState, 'NOT_TESTED');
  assert.equal(posture.verified, false);
});

test('AMD CPU / Ryzen brand alone is NOT NPU_DETECTED', () => {
  const denied = refuseAmdCpuAsNpuInference({
    amdCpuPresent: true,
    ryzenBrandedSystem: true,
    npuDeviceEvidencePresent: false,
  });
  assert.equal(denied.npuDetected, false);
  assert.match(denied.reason, /AMD_CPU_OR_RYZEN_BRAND/);

  const fromSnapshot = classifyAmdNpusFromSnapshot(amdCpuOnlySnapshot);
  assert.equal(fromSnapshot.length, 0);

  const withoutEvidence = classifyAmdNpuCandidate({
    name: 'AMD Ryzen AI 9 HX 370',
    vendor: 'AMD',
    deviceEvidencePresent: false,
    amdCpuPresent: true,
    ryzenBrandedSystem: true,
  });
  assert.equal(withoutEvidence, null);
});

test('NPU DETECTED only with device evidence; execution stays NOT_TESTED', () => {
  const candidate = classifyAmdNpuCandidate({
    name: 'AMD IPU Device (NPU)',
    vendor: 'AMD',
    deviceEvidencePresent: true,
    evidence: ['fixture: windows-pnp FriendlyName AMD IPU Device (NPU)'],
    amdCpuPresent: true,
  });
  assert.ok(candidate);
  assert.equal(candidate!.hardwareState, 'DETECTED');
  assert.equal(candidate!.executionState, 'NOT_TESTED');
  assert.equal(candidate!.detectedEqualsVerified, false);
  assert.equal(candidate!.inferredFromAmdCpuAlone, false);
  assert.equal(candidate!.l4AutonomyEnabled, false);
});

test('runtime path candidates are recorded as candidates, not proven', () => {
  assert.ok(AMD_NPU_RUNTIME_PATH_CANDIDATES.length >= 2);
  for (const path of AMD_NPU_RUNTIME_PATH_CANDIDATES) {
    assert.equal(path.status, 'CANDIDATE');
    assert.equal(path.proven, false);
    assert.ok(path.executionProviderHint.length > 0);
  }
});

test('refuse auto-verify: DETECTED NPU never becomes VERIFIED by classification', () => {
  const candidate = classifyAmdNpuCandidate({
    name: 'AMD Ryzen AI NPU',
    vendor: 'AMD',
    deviceEvidencePresent: true,
    evidence: ['fixture npu'],
  });
  assert.ok(candidate);
  const refuse = refuseAmdNpuAutoVerify(candidate!);
  assert.equal(refuse.allowed, false);
  assert.equal(refuse.claimedVerified, false);
  assert.equal(refuse.resultingState, 'DETECTED');
});

test('bounded inference required before VERIFIED; DETECTED success yields SUPPORTED only', () => {
  const notRun = resolveNpuExecutionState({
    boundedInferenceCompleted: false,
    modelLoaded: false,
    hardwareState: 'DETECTED',
  });
  assert.equal(notRun.executionState, 'NOT_TESTED');
  assert.equal(notRun.claimedVerified, false);

  const firstSuccess = resolveNpuExecutionState({
    boundedInferenceCompleted: true,
    modelLoaded: true,
    inferenceSucceeded: true,
    hardwareState: 'DETECTED',
  });
  assert.equal(firstSuccess.executionState, 'SUPPORTED');
  assert.equal(firstSuccess.claimedVerified, false);

  const verified = resolveNpuExecutionState({
    boundedInferenceCompleted: true,
    modelLoaded: true,
    inferenceSucceeded: true,
    hardwareState: 'SUPPORTED',
  });
  assert.equal(verified.executionState, 'VERIFIED');
  assert.equal(verified.claimedVerified, true);
});

test('NPU failure degrades to VERIFIED GPU when available, else CPU', () => {
  const toGpu = attemptNpuOrDegrade({
    preferNpu: true,
    npuHardwareState: 'DETECTED',
    npuExecutionState: 'NOT_TESTED',
    inferenceSucceeded: false,
    error: 'npu ep missing',
    gpuHardwareState: 'VERIFIED',
    gpuExecutionState: 'VERIFIED',
  });
  assert.equal(toGpu.compute, 'gpu');
  assert.equal(toGpu.fallbackFromNpu, true);
  assert.equal(toGpu.npuVerifiedClaimed, false);
  assert.match(toGpu.reason, /VERIFIED_GPU/);

  const toCpu = attemptNpuOrDegrade({
    preferNpu: true,
    npuHardwareState: 'DETECTED',
    npuExecutionState: 'NOT_TESTED',
    inferenceSucceeded: false,
    gpuHardwareState: 'DETECTED',
    gpuExecutionState: 'NOT_TESTED',
  });
  assert.equal(toCpu.compute, 'cpu');
  assert.equal(toCpu.fallbackFromNpu, true);
  assert.equal(toCpu.npuVerifiedClaimed, false);
  assert.match(toCpu.reason, /CPU/);
});

test('benchmark evidence captures latency, model, EP, timestamp, errors, resources', () => {
  const record = recordNpuCapabilityBenchmark({
    model: 'tiny-local-fixture.onnx',
    executionProvider: 'CPUExecutionProvider',
    executionProviderPathId: 'onnx-runtime-npu-ep',
    latencyMs: 12.5,
    memoryBytes: 4_096_000,
    resourceNotes: 'rss~4MB fixture',
    errors: [],
    boundedInferenceCompleted: false,
    modelLoaded: false,
    timestamp: '2026-09-09T13:30:00.000Z',
  });

  const fields = npuEvidenceFieldsPresent(record);
  assert.equal(fields.ok, true);
  assert.equal(record.latencyMs, 12.5);
  assert.equal(record.model, 'tiny-local-fixture.onnx');
  assert.equal(record.executionProvider, 'CPUExecutionProvider');
  assert.equal(record.timestamp, '2026-09-09T13:30:00.000Z');
  assert.ok(record.errors.includes('BOUNDED_INFERENCE_NOT_RUN'));
  assert.equal(record.executionState, 'NOT_TESTED');
  assert.equal(record.claimedVerified, false);
  assert.equal(record.l4AutonomyEnabled, false);
  assert.equal(record.driverInstalled, false);
  assert.equal(record.biosChanged, false);
  assert.equal(record.cloudProvisioning, false);
  assert.equal(record.externalModelRouting, false);
});

test('fixture may simulate DETECTED evidence but never auto-VERIFIED on presence probe', () => {
  const probe = probeNpuPresence({
    forceStub: true,
    baseSnapshot: amdCpuOnlySnapshot,
    fixtureDevices: [
      {
        name: 'AMD IPU Device (NPU)',
        vendor: 'AMD',
        interface: 'stub-simulator',
        rawLabel: 'AMD IPU Device (NPU)',
        status: 'OK',
      },
    ],
  });

  assert.equal(probe.readOnly, true);
  assert.equal(probe.npuDetected, true);
  assert.equal(probe.npuVerified, false);
  assert.equal(probe.inferredFromAmdCpuAlone, false);
  assert.equal(probe.npus[0]?.state, 'DETECTED');
  assert.notEqual(probe.npus[0]?.state, 'VERIFIED');
});

test('non-Windows stub without fixtures stays non-DETECTED even with AMD Ryzen CPU', () => {
  const probe = probeNpuPresence({
    forceStub: true,
    baseSnapshot: amdCpuOnlySnapshot,
  });
  assert.equal(probe.interfaceUsed, 'stub-simulator');
  assert.equal(probe.npuDetected, false);
  assert.equal(probe.npuVerified, false);
  assert.equal(probe.amdCpuPresent, true);
  assert.equal(probe.ryzenBrandedSystem, true);
  assert.equal(probe.initialPosture.hardwareState, 'NOT_TESTED');
});

test('router soft-wire: DETECTED NPU never wins over CPU; EL5 GPU candidates soft-wired', () => {
  const withDetectedNpu: HardwareSnapshot = {
    ...amdCpuOnlySnapshot,
    npus: [
      {
        kind: 'npu',
        name: 'AMD IPU Device (NPU)',
        vendor: 'AMD',
        state: 'DETECTED',
        evidence: ['fixture'],
      },
    ],
  };
  const decision = routeWithAmdNpuCandidatePolicy(withDetectedNpu);
  assert.equal(decision.compute, 'cpu');
  assert.equal(decision.amdNpuCandidates.length, 1);
  assert.ok(decision.amdGpuCandidates.length >= 1);
  assert.equal(decision.amdNpuCandidates[0]?.hardwareState, 'DETECTED');
});

test('EL5 GPU soft-wire modules are PRESENT', () => {
  const soft = probeEl6SoftWires();
  assert.equal(soft.el5GpuModule, 'PRESENT');
  assert.equal(soft.el5BenchmarkModule, 'PRESENT');
  assert.equal(soft.el5EmHonestyModule, 'PRESENT');
  assert.equal(soft.el6NpuModule, 'PRESENT');
  assert.equal(soft.capabilityTruthModule, 'PRESENT');
  assert.equal(soft.npuPresenceProbeModule, 'PRESENT');
  assert.equal(soft.npuBenchmarkModule, 'PRESENT');
  assert.equal(soft.l4AutonomyEnabled, false);
  assert.equal(soft.cloudProvisioningForbidden, true);
  assert.equal(soft.externalModelRoutingForbidden, true);
});
