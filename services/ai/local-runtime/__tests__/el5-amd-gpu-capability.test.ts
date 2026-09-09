/**
 * 62L-EL5 — AMD GPU capability candidate unit tests.
 *
 * Fixtures prove classification rules only. They do NOT claim ASUS GPU VERIFIED.
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import {
  advanceCapabilityState,
  CAPABILITY_TRUTH_PROGRESSION,
  isDetectedEqualVerified,
  skippedPromotionSteps,
  statesAreDistinct,
} from '../capability-truth';
import {
  AMD_GPU_RUNTIME_PATH_CANDIDATES,
  EL5_LOCKS,
  attemptGpuOrFallbackCpu,
  classifyAmdGpuCandidate,
  classifyAmdGpusFromSnapshot,
  refuseAmdGpuAutoVerify,
  resolveGpuExecutionState,
  routeWithAmdGpuCandidatePolicy,
} from '../amd-gpu-capability';
import { recordCpuFallbackBenchmark, recordGpuCapabilityBenchmark } from '../benchmark';
import { probeHardware, simulateHardwareProbe } from '../hardware-probe';
import { routeAfterGpuFailure, routeWorkload } from '../workload-router';
import { EL_CAPABILITY_TRUTH_STATES, type HardwareSnapshot } from '../types';
import { canAutoExecute, requiresHumanApproval, authorizeTool } from '../../policies';
import { getAgentTool } from '../../tools';

const ASUS_RADEON_FIXTURE = {
  Name: 'AMD Radeon Graphics',
  AdapterCompatibility: 'Advanced Micro Devices, Inc.',
  DriverVersion: '31.0.fixture',
};

function snapshotWithDetectedAmdGpu(): HardwareSnapshot {
  return simulateHardwareProbe({
    displayAdapters: [ASUS_RADEON_FIXTURE],
    npuDevices: [],
  });
}

test('EL truth set preserves UNKNOWN/DETECTED/SUPPORTED/VERIFIED/DEGRADED/UNAVAILABLE/NOT_TESTED', () => {
  for (const state of [
    'UNKNOWN',
    'DETECTED',
    'SUPPORTED',
    'VERIFIED',
    'DEGRADED',
    'UNAVAILABLE',
    'NOT_TESTED',
  ] as const) {
    assert.ok(EL_CAPABILITY_TRUTH_STATES.includes(state));
  }
});

test('DETECTED is not equal to VERIFIED', () => {
  assert.equal(isDetectedEqualVerified(), false);
  assert.equal(statesAreDistinct('DETECTED', 'VERIFIED'), true);
  assert.notEqual('DETECTED', 'VERIFIED');
});

test('truth progression encodes UNKNOWN → DETECTED → SUPPORTED → VERIFIED', () => {
  assert.deepEqual([...CAPABILITY_TRUTH_PROGRESSION], [
    'UNKNOWN',
    'DETECTED',
    'SUPPORTED',
    'VERIFIED',
  ]);
});

test('deny skip: DETECTED cannot jump to VERIFIED', () => {
  const result = advanceCapabilityState('DETECTED', 'VERIFIED');
  assert.equal(result.allowed, false);
  assert.equal(result.resultingState, 'DETECTED');
  assert.ok(result.skippedSteps.includes('SUPPORTED'));
  assert.match(result.reason, /DENY_SKIP/);
});

test('deny skip: UNKNOWN cannot jump to VERIFIED', () => {
  const result = advanceCapabilityState('UNKNOWN', 'VERIFIED');
  assert.equal(result.allowed, false);
  assert.deepEqual(skippedPromotionSteps('UNKNOWN', 'VERIFIED'), ['DETECTED', 'SUPPORTED']);
});

test('adjacent promotions are allowed; DETECTED → SUPPORTED ok', () => {
  const result = advanceCapabilityState('DETECTED', 'SUPPORTED');
  assert.equal(result.allowed, true);
  assert.equal(result.resultingState, 'SUPPORTED');
});

test('AC1: read-only probe + non-Windows stub/simulator detects AMD GPU name/vendor', () => {
  const snap = simulateHardwareProbe({ displayAdapters: [ASUS_RADEON_FIXTURE] });
  assert.equal(snap.gpus.length, 1);
  assert.equal(snap.gpus[0]?.vendor, 'AMD');
  assert.match(snap.gpus[0]?.name ?? '', /Radeon/i);
  assert.equal(snap.gpus[0]?.state, 'DETECTED');
  assert.ok(snap.notes.some((n) => /read-only/i.test(n)));
  assert.ok(snap.notes.some((n) => /stub\/simulator/i.test(n)));

  // Live probe without inventory on non-Windows stays empty (safe CI contract).
  if (process.platform !== 'win32') {
    const live = probeHardware();
    assert.equal(live.gpus.length, 0);
    assert.ok(live.notes.some((n) => /non-Windows/i.test(n)));
  }
});

test('AC2: AMD hardware classified initially as DETECTED, never automatically VERIFIED', () => {
  const candidate = classifyAmdGpuCandidate({
    name: 'AMD Radeon Graphics',
    vendor: 'AMD',
  });
  assert.ok(candidate);
  assert.equal(candidate!.hardwareState, 'DETECTED');
  assert.notEqual(candidate!.hardwareState, 'VERIFIED');
  const refused = refuseAmdGpuAutoVerify(candidate!);
  assert.equal(refused.allowed, false);
  assert.equal(refused.claimedVerified, false);
});

test('AC3: candidate runtime paths include Windows ML / ONNX Runtime as candidates not proven', () => {
  const ids = AMD_GPU_RUNTIME_PATH_CANDIDATES.map((p) => p.id).sort();
  assert.deepEqual(ids, ['onnx-runtime', 'windows-ml']);
  for (const path of AMD_GPU_RUNTIME_PATH_CANDIDATES) {
    assert.equal(path.status, 'CANDIDATE');
    assert.equal(path.proven, false);
  }
  const candidate = classifyAmdGpuCandidate({ name: 'AMD Radeon RX Fixture' });
  assert.equal(candidate!.runtimePaths.every((p) => p.proven === false), true);
});

test('AC4/AC9: privacy read-only locks — no personal files/credentials/browser/unrelated process; no config/driver/elevation/cloud', () => {
  assert.equal(EL5_LOCKS.PERSONAL_FILE_ACCESS_FORBIDDEN, true);
  assert.equal(EL5_LOCKS.CREDENTIAL_ACCESS_FORBIDDEN, true);
  assert.equal(EL5_LOCKS.BROWSER_DATA_ACCESS_FORBIDDEN, true);
  assert.equal(EL5_LOCKS.UNRELATED_PROCESS_ACCESS_FORBIDDEN, true);
  assert.equal(EL5_LOCKS.DRIVER_INSTALL_FORBIDDEN, true);
  assert.equal(EL5_LOCKS.PERMISSION_ELEVATION_FORBIDDEN, true);
  assert.equal(EL5_LOCKS.CLOUD_PURCHASE_FORBIDDEN, true);
  assert.equal(EL5_LOCKS.SYSTEM_CONFIG_CHANGE_FORBIDDEN, true);
  const candidate = classifyAmdGpuCandidate({ name: 'AMD Radeon Graphics' })!;
  assert.equal(candidate.privacyReadOnly, true);
  assert.equal(candidate.systemConfigChanged, false);
});

test('AC5: CPU remains the default fallback when GPU is only DETECTED', () => {
  const snap = snapshotWithDetectedAmdGpu();
  const decision = routeWorkload(snap, { preferLocal: true });
  assert.equal(decision.compute, 'cpu');
  assert.notEqual(decision.capabilityState, 'VERIFIED');
  const withPolicy = routeWithAmdGpuCandidatePolicy(snap);
  assert.equal(withPolicy.compute, 'cpu');
  assert.equal(withPolicy.amdCandidates.length, 1);
});

test('AC6: GPU execution stays NOT_TESTED until bounded inference', () => {
  const candidate = classifyAmdGpuCandidate({ name: 'AMD Radeon Graphics' })!;
  assert.equal(candidate.executionState, 'NOT_TESTED');
  const unresolved = resolveGpuExecutionState({
    boundedInferenceCompleted: false,
    hardwareState: 'DETECTED',
  });
  assert.equal(unresolved.executionState, 'NOT_TESTED');
  const bench = recordGpuCapabilityBenchmark({
    model: 'fixture-model',
    provider: 'onnx-runtime',
    hardwareState: 'DETECTED',
    boundedInferenceCompleted: false,
  });
  assert.equal(bench.executionState, 'NOT_TESTED');
  assert.equal(bench.boundedInferenceCompleted, false);
});

test('AC7: benchmark records model, provider, latency, memory/resource, timestamp, errors', () => {
  const bench = recordGpuCapabilityBenchmark({
    model: 'tiny-fixture-onnx',
    provider: 'windows-ml',
    latencyMs: 12.5,
    memoryBytes: 1024,
    resourceNotes: 'rss-fixture',
    errors: ['none'],
    timestamp: '2026-09-09T13:00:00.000Z',
    boundedInferenceCompleted: false,
  });
  assert.equal(bench.model, 'tiny-fixture-onnx');
  assert.equal(bench.provider, 'windows-ml');
  assert.equal(bench.latencyMs, 12.5);
  assert.equal(bench.memoryBytes, 1024);
  assert.equal(bench.resourceNotes, 'rss-fixture');
  assert.equal(bench.timestamp, '2026-09-09T13:00:00.000Z');
  assert.ok(bench.errors.includes('none'));
  assert.ok(bench.errors.includes('BOUNDED_INFERENCE_NOT_RUN'));
  assert.equal(bench.executionState, 'NOT_TESTED');
});

test('AC8: failed or unsupported GPU execution falls back safely to CPU', () => {
  const snap = snapshotWithDetectedAmdGpu();
  const outcome = attemptGpuOrFallbackCpu({
    preferGpu: true,
    gpuHardwareState: 'DETECTED',
    gpuExecutionState: 'NOT_TESTED',
    inferenceSucceeded: false,
    error: 'EP_NOT_AVAILABLE',
  });
  assert.equal(outcome.compute, 'cpu');
  assert.equal(outcome.fallbackToCpu, true);

  const routed = routeAfterGpuFailure(snap, 'EP_NOT_AVAILABLE');
  assert.equal(routed.compute, 'cpu');
  assert.equal(routed.fallbackToCpu, true);

  const cpuBench = recordCpuFallbackBenchmark({
    model: 'tiny-fixture-onnx',
    latencyMs: 8,
    memoryBytes: 512,
    errors: ['EP_NOT_AVAILABLE'],
  });
  assert.equal(cpuBench.provider, 'cpu-fallback');
  assert.equal(cpuBench.executionState, 'NOT_TESTED');
});

test('AC10: Guardian/policy soft-wire unchanged — high-risk blocked; consequential approval required; canAutoExecute false', () => {
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

test('AC11: L4_AUTONOMY_ENABLED=false', () => {
  assert.equal(EL5_LOCKS.L4_AUTONOMY_ENABLED, false);
  const bench = recordGpuCapabilityBenchmark({
    model: 'x',
    provider: 'onnx-runtime',
  });
  assert.equal(bench.l4AutonomyEnabled, false);
});

test('bounded inference success from DETECTED yields SUPPORTED path evidence, not auto VERIFIED', () => {
  const resolved = resolveGpuExecutionState({
    boundedInferenceCompleted: true,
    inferenceSucceeded: true,
    hardwareState: 'DETECTED',
  });
  assert.equal(resolved.executionState, 'SUPPORTED');
  assert.notEqual(resolved.executionState, 'VERIFIED');
  const candidates = classifyAmdGpusFromSnapshot(snapshotWithDetectedAmdGpu());
  assert.equal(candidates[0]?.hardwareState, 'DETECTED');
});

test('unit fixtures do not claim ASUS GPU VERIFIED', () => {
  const snap = snapshotWithDetectedAmdGpu();
  for (const gpu of snap.gpus) {
    assert.notEqual(gpu.state, 'VERIFIED');
  }
  const bench = recordGpuCapabilityBenchmark({
    model: 'asus-fixture',
    provider: 'onnx-runtime',
    boundedInferenceCompleted: false,
  });
  assert.notEqual(bench.executionState, 'VERIFIED');
});
