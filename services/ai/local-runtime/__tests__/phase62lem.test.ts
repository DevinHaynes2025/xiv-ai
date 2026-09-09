import test from 'node:test';
import assert from 'node:assert/strict';
import type { HardwareSnapshot } from '../types';
import {
  assertEmLocksIntact,
  emHonestySnapshot,
  EM_LOCKS,
  EM_DB_CANDIDATES_STATUS,
} from '../honesty';
import { verifyLocalModel, defaultModelVerificationState } from '../model-verification';
import {
  evaluateOnnxWindowsMlAdapter,
  defaultOnnxAdapterStatus,
} from '../onnx-windows-ml-adapter';
import {
  runAmdAcceleratorBenchmark,
  routeAfterAcceleratorBenchmark,
} from '../amd-accelerator-benchmark';
import { createHeartbeatApi } from '../heartbeat-api';
import {
  runClassicalQuantBenchmarkSuite,
  denyQuantumAdvantageClaim,
} from '../classical-quant-benchmark';

const snapshot: HardwareSnapshot = {
  capturedAt: '2026-09-09T13:30:00.000Z',
  platform: 'win32',
  release: 'test',
  arch: 'x64',
  totalMemoryBytes: 16_000,
  freeMemoryBytes: 8_000,
  cpu: { kind: 'cpu', name: 'AMD Test CPU', vendor: 'AMD', state: 'DETECTED', evidence: [] },
  gpus: [{ kind: 'gpu', name: 'AMD Test GPU', vendor: 'AMD', state: 'DETECTED', evidence: [] }],
  npus: [],
  notes: [],
};

test('EM honesty locks remain intact', () => {
  assert.equal(assertEmLocksIntact(), true);
  assert.equal(EM_LOCKS.L4_AUTONOMY_ENABLED, false);
  assert.equal(EM_DB_CANDIDATES_STATUS, 'NOT_APPLIED');
  const snap = emHonestySnapshot();
  assert.equal(snap.elLocalRuntimePresent, true);
  assert.match(snap.banner, /DOCUMENTED/);
});

test('A: model verification defaults to NOT_TESTED; fake claim denied', () => {
  const def = defaultModelVerificationState('demo');
  assert.equal(def.state, 'NOT_TESTED');
  assert.equal(def.modelLoadVerified, false);

  const denied = verifyLocalModel({
    modelId: 'demo',
    claimVerifiedWithoutEvidence: true,
  });
  assert.equal(denied.modelLoadVerified, false);
  assert.equal(denied.state, 'NOT_TESTED');

  const verified = verifyLocalModel({
    modelId: 'demo',
    configured: true,
    loadSucceeded: true,
    inferenceSucceeded: true,
    evidence: ['load_ok', 'infer_ok_latency_12ms'],
  });
  assert.equal(verified.state, 'VERIFIED');
  assert.equal(verified.modelLoadVerified, true);
});

test('B: ONNX/Windows ML adapter unproven stays NOT_TESTED; fake success denied', () => {
  const def = defaultOnnxAdapterStatus();
  assert.equal(def.inferenceVerified, false);
  assert.ok(def.overallState === 'NOT_TESTED' || def.overallState === 'UNKNOWN');

  const fake = evaluateOnnxWindowsMlAdapter({ claimSuccessfulInferenceWithoutRun: true });
  assert.equal(fake.fakeSuccessDenied, true);
  assert.equal(fake.inferenceVerified, false);

  const supported = evaluateOnnxWindowsMlAdapter({
    windowsMlAvailable: true,
    onnxRuntimeInstalled: true,
    amdExecutionProviderConfigured: true,
  });
  assert.equal(supported.overallState, 'SUPPORTED');
  assert.equal(supported.inferenceVerified, false);
});

test('C: AMD accelerator VERIFIED only after measured benchmark; CPU fallback always', () => {
  const detectedOnly = runAmdAcceleratorBenchmark({ target: 'gpu', detected: true });
  assert.equal(detectedOnly.state, 'DETECTED');
  assert.equal(detectedOnly.verified, false);
  assert.equal(detectedOnly.cpuFallbackAvailable, true);

  const denied = runAmdAcceleratorBenchmark({
    target: 'npu',
    detected: true,
    claimVerifiedWithoutBenchmark: true,
  });
  assert.equal(denied.verified, false);

  const cpu = runAmdAcceleratorBenchmark({ target: 'cpu' });
  assert.equal(cpu.verified, true);

  const routed = routeAfterAcceleratorBenchmark(snapshot, [detectedOnly, cpu]);
  assert.equal(routed.decision.compute, 'cpu');
  assert.equal(routed.cpuFallbackAlwaysAvailable, true);

  const verifiedGpu = runAmdAcceleratorBenchmark({
    target: 'gpu',
    detected: true,
    supported: true,
    inferenceBenchmarkSucceeded: true,
    metrics: { latencyMs: 12, throughputOps: 100 },
  });
  assert.equal(verifiedGpu.state, 'VERIFIED');
  const routedVerified = routeAfterAcceleratorBenchmark(snapshot, [verifiedGpu]);
  assert.equal(routedVerified.decision.compute, 'gpu');
});

test('D: heartbeat API maps missing/stale to WAITING_NODE/STALE; fresh running is RUNNING_VERIFIED', () => {
  const api = createHeartbeatApi(120_000);
  const now = new Date('2026-09-09T13:30:00.000Z');

  const missing = api.getHeartbeat('asus-local', now);
  assert.equal(missing.heartbeat.state, 'WAITING_NODE');
  assert.equal(missing.agentsMayClaimWorking, false);
  assert.equal(missing.offlinePolicy.agentsWorkingWhileNodeOff, false);

  api.postHeartbeat(
    { nodeId: 'asus-local', observedAt: '2026-09-09T13:29:30.000Z', running: true, sequence: 1 },
    now,
  );
  const fresh = api.getHeartbeat('asus-local', now);
  assert.equal(fresh.heartbeat.state, 'RUNNING_VERIFIED');
  assert.equal(fresh.agentsMayClaimWorking, true);

  const staleNow = new Date('2026-09-09T13:40:00.000Z');
  const stale = api.getHeartbeat('asus-local', staleNow);
  assert.equal(stale.heartbeat.state, 'STALE');
  assert.equal(stale.agentsMayClaimWorking, false);

  api.postHeartbeat(
    { nodeId: 'asus-local', observedAt: '2026-09-09T13:39:50.000Z', running: false, sequence: 2 },
    staleNow,
  );
  const stopped = api.getHeartbeat('asus-local', staleNow);
  assert.equal(stopped.heartbeat.state, 'OFFLINE_STOPPED');
});

test('E: classical quant suite passes and never claims quantum advantage', () => {
  const suite = runClassicalQuantBenchmarkSuite();
  assert.equal(suite.allPassed, true);
  assert.equal(suite.quantumAdvantageClaimed, false);
  assert.equal(suite.locks.QUANTUM_ADVANTAGE_WITHOUT_CLASSICAL_BASELINE, false);
  const denial = denyQuantumAdvantageClaim(suite);
  assert.equal(denial.allowed, false);
  assert.ok(suite.results.length >= 6);
});
