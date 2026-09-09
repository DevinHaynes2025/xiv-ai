/**
 * 62L-EL7 — Windows local runtime adapter tests.
 * No unrun test is a PASS. VERIFIED requires measured-evidence fixture boundary.
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import {
  el7AdapterHonesty,
  labelExecutionMode,
  runLocalInference,
  type LocalInferenceRequest,
} from '../inference-adapter';
import { defaultExecutionProviderRegistry } from '../execution-providers';
import { EL7_LOCKS } from '../el7-locks';
import { checkLocalInferencePolicy } from '../inference-policy';
import type { ExecutionProviderRecord } from '../execution-providers';

function baseAuthorized(overrides: Partial<LocalInferenceRequest> = {}): LocalInferenceRequest {
  return {
    taskId: 'task-el7-1',
    modelId: 'local-model-demo',
    modelVersion: '0.0.0-not-loaded',
    tenantId: 'tenant-demo',
    universeScope: 'universe-demo',
    dataClass: 'internal',
    preferredDevice: 'auto',
    maxMemoryMb: 512,
    authorized: true,
    authVerified: true,
    guardianAllow: true,
    rlsTenantInScope: true,
    universeBoundaryOk: true,
    authorizeModelDownload: false,
    authorizeDriverOrRuntimeInstall: false,
    ...overrides,
  };
}

test('EL7 locks: L4 autonomy off; no auto download/install; no boundary bypass', () => {
  const honesty = el7AdapterHonesty();
  assert.equal(honesty.locks.L4_AUTONOMY_ENABLED, false);
  assert.equal(honesty.autoDownload, false);
  assert.equal(honesty.autoInstall, false);
  assert.equal(honesty.unitTestAutoVerified, false);
  assert.equal(honesty.defaultGpuState, 'NOT_TESTED');
  assert.equal(honesty.defaultNpuState, 'NOT_TESTED');
  assert.equal(EL7_LOCKS.AUTH_BYPASS, false);
  assert.equal(EL7_LOCKS.GUARDIAN_BYPASS, false);
  assert.equal(EL7_LOCKS.RLS_BYPASS, false);
  assert.equal(EL7_LOCKS.TENANT_BYPASS, false);
  assert.equal(EL7_LOCKS.UNIVERSE_BYPASS, false);
});

test('policy soft-wire denies missing auth/Guardian/RLS/Universe', () => {
  const denied = checkLocalInferencePolicy({
    taskId: 't1',
    modelId: 'm1',
  });
  assert.equal(denied.allowed, false);
  assert.equal(denied.failureClass, 'AUTH_REQUIRED');
  assert.equal(denied.softWire.canAutoExecute, false);
  assert.equal(denied.softWire.authBypass, false);
});

test('auto model download is denied', () => {
  const result = runLocalInference(
    baseAuthorized({ authorizeModelDownload: true }),
  );
  assert.equal(result.status, 'DENIED');
  assert.equal(result.failureClass, 'AUTO_DOWNLOAD_DENIED');
  assert.equal(result.modelLoaded, false);
  assert.equal(result.output, null);
});

test('auto driver/runtime install is denied', () => {
  const result = runLocalInference(
    baseAuthorized({ authorizeDriverOrRuntimeInstall: true }),
  );
  assert.equal(result.status, 'DENIED');
  assert.equal(result.failureClass, 'AUTO_INSTALL_DENIED');
});

test('default registry keeps GPU/NPU NOT_TESTED and returns UNAVAILABLE', () => {
  const registry = defaultExecutionProviderRegistry();
  const gpu = registry.find((p) => p.id === 'amd-gpu');
  const npu = registry.find((p) => p.id === 'amd-npu');
  assert.equal(gpu?.state, 'NOT_TESTED');
  assert.equal(npu?.state, 'NOT_TESTED');

  const result = runLocalInference(baseAuthorized({ preferredDevice: 'gpu' }));
  assert.equal(result.status, 'UNAVAILABLE');
  assert.ok(result.failureClass === 'NOT_TESTED' || result.failureClass === 'MODEL_NOT_LOADED');
  assert.equal(result.modelLoaded, false);
  assert.equal(result.output, null);
  assert.equal(result.executionMode, 'LOCAL');
  assert.notEqual(result.truthState, 'VERIFIED');
  assert.ok(result.evidence.notes.some((n) => n.includes('UNAVAILABLE') || n.includes('NOT_TESTED') || n.includes('CPU_SAFE')));
});

test('resource governor rejects over-limit workloads', () => {
  const result = runLocalInference(
    baseAuthorized({
      concurrentTasks: 99,
      estimatedMemoryBytes: 99 * 1024 * 1024 * 1024,
      resourceBudget: { maxConcurrentTasks: 2, maxMemoryBytes: 1024 },
    }),
  );
  assert.equal(result.status, 'REJECTED');
  assert.equal(result.failureClass, 'GOVERNOR_REJECTED');
});

test('stale heartbeat yields UNAVAILABLE (not pretend success)', () => {
  const result = runLocalInference(
    baseAuthorized({
      heartbeat: {
        nodeId: 'asus-local',
        observedAt: '2020-01-01T00:00:00.000Z',
        running: true,
      },
    }),
  );
  assert.equal(result.status, 'UNAVAILABLE');
  assert.equal(result.heartbeat?.state, 'STALE');
  assert.equal(result.modelLoaded, false);
});

test('VERIFIED skip denied without measuredEvidencePresent', () => {
  const fakeVerified: ExecutionProviderRecord[] = [
    {
      id: 'amd-gpu',
      device: 'gpu',
      state: 'VERIFIED',
      label: 'fake',
      evidence: ['unit test must not skip'],
      measuredEvidencePresent: false,
    },
    ...defaultExecutionProviderRegistry().filter((p) => p.id !== 'amd-gpu'),
  ];

  const result = runLocalInference(
    baseAuthorized({
      preferredDevice: 'gpu',
      providerRegistry: fakeVerified,
      measuredEvidenceFixture: {
        modelLoadCompleted: true,
        boundedInferenceSucceeded: true,
        providerId: 'amd-gpu',
        providerState: 'VERIFIED',
        latencyMs: 12,
      },
    }),
  );

  assert.notEqual(result.status, 'OK');
  assert.notEqual(result.truthState, 'VERIFIED');
  assert.equal(result.modelLoaded, false);
  assert.ok(
    result.evidence.notes.some((n) => n.includes('VERIFIED_SKIP_DENIED')) ||
      result.status === 'UNAVAILABLE',
  );
});

test('measured-evidence fixture boundary may succeed only when registry is VERIFIED+measured', () => {
  const verifiedCpu: ExecutionProviderRecord[] = defaultExecutionProviderRegistry().map((p) =>
    p.id === 'cpu'
      ? {
          ...p,
          state: 'VERIFIED' as const,
          measuredEvidencePresent: true,
          evidence: ['fixture-bounded measured CPU load+inference'],
        }
      : p,
  );

  const result = runLocalInference(
    baseAuthorized({
      preferredDevice: 'cpu',
      providerRegistry: verifiedCpu,
      measuredEvidenceFixture: {
        modelLoadCompleted: true,
        boundedInferenceSucceeded: true,
        providerId: 'cpu',
        providerState: 'VERIFIED',
        latencyMs: 42,
        output: { token: 'fixture-ok' },
        evidenceNotes: ['EL7 fixture boundary — not production authorization'],
      },
    }),
  );

  assert.equal(result.status, 'OK');
  assert.equal(result.truthState, 'VERIFIED');
  assert.equal(result.provider, 'cpu');
  assert.equal(result.device, 'cpu');
  assert.equal(result.executionMode, 'LOCAL');
  assert.equal(result.modelLoaded, true);
  assert.equal(result.latencyMs, 42);
  assert.equal(result.evidence.measuredEvidencePresent, true);
  assert.equal(result.evidence.executionProvider, 'cpu');
  assert.ok(result.evidence.startTime);
  assert.ok(result.evidence.endTime);
});

test('truthful LOCAL/HYBRID/CLOUD labeling', () => {
  assert.equal(
    labelExecutionMode({ localAttempted: true, localSucceeded: true }),
    'LOCAL',
  );
  assert.equal(
    labelExecutionMode({ localAttempted: true, localSucceeded: false, claimed: 'CLOUD' }),
    'CLOUD',
  );
  assert.equal(
    labelExecutionMode({ localAttempted: true, localSucceeded: false, claimed: 'HYBRID' }),
    'HYBRID',
  );

  const cloudClaim = runLocalInference(
    baseAuthorized({ claimedExecutionMode: 'CLOUD' }),
  );
  assert.equal(cloudClaim.status, 'UNAVAILABLE');
  assert.equal(cloudClaim.executionMode, 'CLOUD');
  assert.equal(cloudClaim.modelLoaded, false);
});

test('evidence records model id/version, provider, times, latency, status, failure class', () => {
  const result = runLocalInference(baseAuthorized({ modelVersion: 'v-test-1' }));
  assert.equal(result.evidence.modelId, 'local-model-demo');
  assert.equal(result.evidence.modelVersion, 'v-test-1');
  assert.ok(result.evidence.executionProvider);
  assert.ok(result.evidence.startTime);
  assert.ok(result.evidence.endTime);
  assert.equal(typeof result.evidence.latencyMs, 'number');
  assert.ok(['OK', 'UNAVAILABLE', 'DENIED', 'REJECTED'].includes(result.evidence.status));
  assert.ok(result.evidence.failureClass === null || typeof result.evidence.failureClass === 'string');
  assert.equal(result.evidence.l4AutonomyEnabled, false);
});
