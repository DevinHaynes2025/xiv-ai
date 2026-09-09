/**
 * 62L-EL8 — Model-load evidence + verification graduation tests.
 *
 * Covers: progression no-skip, silent-fallback accelerator deny,
 * and each remain-NOT_TESTED / DEGRADED / UNAVAILABLE case.
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import {
  VERIFICATION_PROGRESSION,
  createEmptyEvidence,
  detectSilentFallback,
  resolveAcceleratorVerification,
} from '../model-load-evidence';
import {
  advanceVerificationStage,
  buildSuccessfulEvidence,
  deriveStageFromEvidence,
  runVerificationGate,
  skippedGraduationStages,
} from '../verification-graduation';
import { createEvidenceLedger, findEvidenceByRef } from '../evidence-ledger';
import { EL8_LOCKS, assertEl8LocksIntact } from '../el8-honesty';
import { softWireRunLocalInference } from '../el7-soft-wire';
import { routeWorkload } from '../workload-router';
import { evaluateResourceRequest } from '../resource-governor';
import { classifyHeartbeat } from '../runtime-state';
import type { HardwareSnapshot } from '../types';

const snapshot: HardwareSnapshot = {
  capturedAt: '2026-09-09T13:30:00.000Z',
  platform: 'win32',
  release: 'test',
  arch: 'x64',
  totalMemoryBytes: 16_000,
  freeMemoryBytes: 8_000,
  cpu: { kind: 'cpu', name: 'AMD Test CPU', vendor: 'AMD', state: 'DETECTED', evidence: [] },
  gpus: [{ kind: 'gpu', name: 'AMD Test GPU', vendor: 'AMD', state: 'DETECTED', evidence: [] }],
  npus: [{ kind: 'npu', name: 'AMD Test NPU', vendor: 'AMD', state: 'DETECTED', evidence: [] }],
  notes: [],
};

test('EL8 locks: L4_AUTONOMY_ENABLED=false and silent-fallback ≠ accelerator VERIFIED', () => {
  assert.equal(assertEl8LocksIntact(), true);
  assert.equal(EL8_LOCKS.L4_AUTONOMY_ENABLED, false);
  assert.equal(EL8_LOCKS.SILENT_FALLBACK_EQ_ACCELERATOR_VERIFIED, false);
  assert.equal(EL8_LOCKS.UNRUN_TEST_EQ_PASS, false);
  assert.equal(EL8_LOCKS.GUARDIAN_RLS_TENANT_BOUNDARIES_INTACT, true);
  assert.equal(EL8_LOCKS.HUMAN_APPROVAL_REQUIRED_INTACT, true);
});

test('verification progression encodes AVAILABLE → … → VERIFIED', () => {
  assert.deepEqual([...VERIFICATION_PROGRESSION], [
    'AVAILABLE',
    'CONFIGURED',
    'SUPPORTED',
    'MODEL_LOADED',
    'INFERENCE_PASSED',
    'VERIFIED',
  ]);
});

test('deny skip: CONFIGURED cannot jump to VERIFIED', () => {
  const result = advanceVerificationStage('CONFIGURED', 'VERIFIED');
  assert.equal(result.allowed, false);
  assert.equal(result.resultingStage, 'CONFIGURED');
  assert.ok(result.skippedStages.includes('SUPPORTED'));
  assert.ok(result.skippedStages.includes('MODEL_LOADED'));
  assert.ok(result.skippedStages.includes('INFERENCE_PASSED'));
  assert.match(result.reason, /DENY_SKIP/);
});

test('deny skip: SUPPORTED cannot jump to INFERENCE_PASSED', () => {
  const skipped = skippedGraduationStages('SUPPORTED', 'INFERENCE_PASSED');
  assert.deepEqual(skipped, ['MODEL_LOADED']);
  const result = advanceVerificationStage('SUPPORTED', 'INFERENCE_PASSED');
  assert.equal(result.allowed, false);
});

test('adjacent promotion ALLOWED along the chain', () => {
  const steps = [
    ['AVAILABLE', 'CONFIGURED'],
    ['CONFIGURED', 'SUPPORTED'],
    ['SUPPORTED', 'MODEL_LOADED'],
    ['MODEL_LOADED', 'INFERENCE_PASSED'],
    ['INFERENCE_PASSED', 'VERIFIED'],
  ] as const;
  for (const [from, to] of steps) {
    const result = advanceVerificationStage(from, to);
    assert.equal(result.allowed, true, `${from}→${to}`);
    assert.equal(result.resultingStage, to);
  }
});

test('claim VERIFIED without evidence is denied', () => {
  const evidence = createEmptyEvidence({
    modelId: 'tiny-fixture',
    requestedProvider: 'CPU',
  });
  const gate = runVerificationGate({
    evidence,
    claimVerifiedWithoutEvidence: true,
  });
  assert.equal(gate.verified, false);
  assert.equal(gate.failureClass, 'CLAIM_WITHOUT_EVIDENCE');
  assert.notEqual(gate.stage, 'VERIFIED');
});

test('model file missing → not VERIFIED (UNAVAILABLE/NOT_TESTED posture)', () => {
  const evidence = buildSuccessfulEvidence({
    modelId: 'missing-model',
    modelFilePresent: false,
    combinationRan: false,
    sessionInitialized: false,
    inferenceOutput: null,
    outputValid: null,
    failureClass: 'MODEL_FILE_MISSING',
  });
  const gate = runVerificationGate({ evidence, ledger: createEvidenceLedger() });
  assert.equal(gate.verified, false);
  assert.equal(gate.failureClass, 'MODEL_FILE_MISSING');
  assert.equal(gate.stage, 'AVAILABLE');
});

test('provider cannot initialize → not VERIFIED (DEGRADED/UNAVAILABLE)', () => {
  const evidence = buildSuccessfulEvidence({
    modelId: 'bad-ep',
    providerInitialized: false,
    combinationRan: false,
    sessionInitialized: false,
    inferenceOutput: null,
    outputValid: null,
    failureClass: 'PROVIDER_INIT_FAILED',
  });
  const gate = runVerificationGate({ evidence, ledger: createEvidenceLedger() });
  assert.equal(gate.verified, false);
  assert.equal(gate.failureClass, 'PROVIDER_INIT_FAILED');
  assert.ok(['AVAILABLE', 'CONFIGURED', 'SUPPORTED'].includes(gate.stage));
});

test('silent fallback GPU→CPU: CPU may verify fallback; accelerator never VERIFIED', () => {
  const evidence = buildSuccessfulEvidence({
    modelId: 'amd-gpu-model',
    requestedProvider: 'GPU',
    actualProvider: 'CPU',
    failureClass: 'NONE',
  });
  assert.equal(detectSilentFallback(evidence), true);

  const ledger = createEvidenceLedger('silent-fallback');
  const gate = runVerificationGate({
    evidence,
    ledger,
    deviceDetected: true,
    deviceSupported: true,
  });

  assert.equal(gate.accelerator.silentFallbackDetected, true);
  assert.notEqual(gate.accelerator.acceleratorState, 'VERIFIED');
  assert.ok(['NOT_TESTED', 'DETECTED', 'SUPPORTED'].includes(gate.accelerator.acceleratorState));
  assert.equal(gate.verified, false);
  assert.equal(gate.failureClass, 'SILENT_FALLBACK_TO_CPU');
  // CPU fallback may be independently VERIFIED
  assert.equal(gate.accelerator.cpuFallbackState, 'VERIFIED');
  assert.ok(gate.evidence.evidenceRef);
  assert.ok(findEvidenceByRef(ledger, gate.evidence.evidenceRef!));
});

test('silent fallback NPU→CPU: accelerator remains unverified', () => {
  const outcome = resolveAcceleratorVerification(
    buildSuccessfulEvidence({
      modelId: 'npu-model',
      requestedProvider: 'NPU',
      actualProvider: 'CPU',
    }),
    { deviceDetected: true, deviceSupported: false },
  );
  assert.equal(outcome.silentFallbackDetected, true);
  assert.equal(outcome.acceleratorState, 'DETECTED');
  assert.notEqual(outcome.acceleratorState, 'VERIFIED');
});

test('inference timeout → not VERIFIED', () => {
  const evidence = buildSuccessfulEvidence({
    modelId: 'slow-model',
    inferenceTimedOut: true,
    inferenceOutput: null,
    outputValid: null,
    latencyMs: null,
    failureClass: 'INFERENCE_TIMEOUT',
  });
  const gate = runVerificationGate({ evidence, ledger: createEvidenceLedger() });
  assert.equal(gate.verified, false);
  assert.equal(gate.failureClass, 'INFERENCE_TIMEOUT');
  assert.ok(gate.stage === 'MODEL_LOADED' || gate.stage === 'SUPPORTED');
});

test('invalid output → not VERIFIED', () => {
  const evidence = buildSuccessfulEvidence({
    modelId: 'bad-out',
    outputValid: false,
    inferenceOutput: '',
    failureClass: 'OUTPUT_INVALID',
  });
  const gate = runVerificationGate({ evidence, ledger: createEvidenceLedger() });
  assert.equal(gate.verified, false);
  assert.equal(gate.failureClass, 'OUTPUT_INVALID');
  assert.notEqual(gate.stage, 'VERIFIED');
});

test('resource ceilings exceeded → not VERIFIED (DEGRADED)', () => {
  const evidence = buildSuccessfulEvidence({
    modelId: 'heavy',
    resourceCeilingsOk: false,
    failureClass: 'RESOURCE_CEILING_EXCEEDED',
  });
  const gate = runVerificationGate({ evidence, ledger: createEvidenceLedger() });
  assert.equal(gate.verified, false);
  assert.equal(gate.failureClass, 'RESOURCE_CEILING_EXCEEDED');
});

test('stale runtime evidence → not VERIFIED', () => {
  const evidence = buildSuccessfulEvidence({
    modelId: 'stale',
    evidenceFresh: false,
    failureClass: 'EVIDENCE_STALE',
  });
  const gate = runVerificationGate({ evidence, ledger: createEvidenceLedger() });
  assert.equal(gate.verified, false);
  assert.equal(gate.failureClass, 'EVIDENCE_STALE');
});

test('combination not run → NOT_TESTED posture (not VERIFIED)', () => {
  const evidence = createEmptyEvidence({
    modelId: 'never-ran',
    modelVersionOrHash: 'v0',
    requestedProvider: 'GPU',
    modelFilePresent: true,
    providerInitialized: true,
    deviceTruthState: 'DETECTED',
    combinationRan: false,
    failureClass: 'COMBINATION_NOT_RUN',
  });
  const derived = deriveStageFromEvidence(evidence);
  assert.equal(derived.failureClass, 'COMBINATION_NOT_RUN');
  assert.notEqual(derived.stage, 'VERIFIED');
  const gate = runVerificationGate({ evidence, ledger: createEvidenceLedger() });
  assert.equal(gate.verified, false);
});

test('full CPU evidence + ledger → VERIFIED', () => {
  const ledger = createEvidenceLedger('cpu-ok');
  const evidence = buildSuccessfulEvidence({
    modelId: 'cpu-tiny',
    requestedProvider: 'CPU',
    actualProvider: 'CPU',
  });
  const gate = runVerificationGate({ evidence, ledger });
  assert.equal(gate.stage, 'VERIFIED');
  assert.equal(gate.verified, true);
  assert.equal(gate.failureClass, 'NONE');
  assert.equal(gate.modelLoadVerified, true);
  assert.equal(gate.inferencePassed, true);
  assert.ok(gate.evidence.evidenceRef);
  assert.equal(gate.locks.L4_AUTONOMY_ENABLED, false);
});

test('full GPU-on-GPU evidence + ledger → accelerator VERIFIED', () => {
  const ledger = createEvidenceLedger('gpu-ok');
  const evidence = buildSuccessfulEvidence({
    modelId: 'gpu-tiny',
    requestedProvider: 'GPU',
    actualProvider: 'GPU',
  });
  const gate = runVerificationGate({
    evidence,
    ledger,
    deviceDetected: true,
    deviceSupported: true,
  });
  assert.equal(gate.verified, true);
  assert.equal(gate.accelerator.silentFallbackDetected, false);
  assert.equal(gate.accelerator.acceleratorState, 'VERIFIED');
});

test('evidence schema represents all required fields', () => {
  const evidence = buildSuccessfulEvidence({ modelId: 'schema-check' });
  const requiredKeys = [
    'modelId',
    'modelVersionOrHash',
    'requestedProvider',
    'actualProvider',
    'deviceTruthState',
    'loadStartedAt',
    'loadEndedAt',
    'sessionInitialized',
    'boundedTestInput',
    'inferenceOutput',
    'latencyMs',
    'memoryObservations',
    'failureClass',
    'softwareRuntimeVersions',
    'machineRuntimeTimestamp',
    'evidenceRef',
  ] as const;
  for (const key of requiredKeys) {
    assert.ok(key in evidence, `missing ${key}`);
  }
});

test('EL7 runLocalInference soft-wire binds when inference-adapter present', () => {
  const soft = softWireRunLocalInference();
  assert.equal(soft.present, true);
  assert.equal(soft.callable, true);
  assert.match(soft.modulePathChecked, /inference-adapter\.ts$/);
  assert.match(soft.note, /soft-wired/i);
});

test('local-runtime regression: router still CPU-first for DETECTED GPU', () => {
  const decision = routeWorkload(snapshot, { preferLocal: true });
  assert.equal(decision.compute, 'cpu');
});

test('local-runtime regression: resource governor rejects over-ceiling', () => {
  const result = evaluateResourceRequest(
    { concurrentTasks: 9, estimatedMemoryBytes: 9_000 },
    { maxConcurrentTasks: 4, maxMemoryBytes: 8_000 },
  );
  assert.equal(result.allowed, false);
});

test('local-runtime regression: stale heartbeat is not RUNNING_VERIFIED', () => {
  const now = new Date('2026-09-09T13:30:00.000Z');
  const result = classifyHeartbeat(
    { nodeId: 'asus-local', observedAt: '2026-09-09T13:20:00.000Z', running: true },
    now,
  );
  assert.equal(result.state, 'STALE');
});
