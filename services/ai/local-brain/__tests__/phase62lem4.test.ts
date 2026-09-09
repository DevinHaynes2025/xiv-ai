/**
 * 62L-EM4 — CPU/GPU/NPU Message Envelope tests.
 *
 * MUST execute via `npm run test:62lem4`. Covers signed contracts,
 * silent-fallback honesty, and all safety denies.
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import {
  EM4_CORE_FLOW,
  EM4_LOCKS,
  EM4_HONESTY_BANNER,
  NEXT_PHASE_EM5,
  applySilentFallbackHonesty,
  assertEm4LocksIntact,
  assertEm4RequestSchema,
  buildExecutionReceipt,
  detectSilentDeviceFallback,
  em4SoftWireSnapshot,
  evaluatePolicyGate,
  runComputeMessageEnvelope,
  selectRegistryDevice,
  signComputeRequest,
  signReturnReceipt,
  verifyComputeRequest,
  verifyReturnReceipt,
  type AgentComputeGrant,
  type ComputeMessageRequest,
  type RegistryDeviceRecord,
} from '../em4-message-envelope.ts';

const SECRET = 'em4-test-secret';

function baseRequest(
  overrides: Partial<ComputeMessageRequest> = {},
): ComputeMessageRequest {
  return {
    requestId: 'req-1',
    agentId: 'agent-1',
    parentTaskId: 'task-parent',
    homeUniverseId: 'universe-a',
    tenantId: 'tenant-a',
    purpose: 'bounded-inference',
    modelId: 'tiny-local',
    inputDataClass: 'internal',
    requestedDevice: 'CPU',
    minimumVerificationState: 'SUPPORTED',
    maxRuntimeMs: 5_000,
    maxMemoryMb: 512,
    maxConcurrency: 2,
    privacyMode: 'local_only',
    networkPolicy: 'deny_all',
    expiry: '2099-01-01T00:00:00.000Z',
    returnPath: 'xiv://home-base/agent-1',
    ...overrides,
  };
}

function baseGrant(overrides: Partial<AgentComputeGrant> = {}): AgentComputeGrant {
  return {
    agentId: 'agent-1',
    parentAgentId: null,
    homeUniverseId: 'universe-a',
    tenantId: 'tenant-a',
    allowedDevices: ['CPU', 'GPU', 'NPU'],
    allowedModels: ['tiny-local'],
    allowedDataClasses: ['public', 'internal'],
    allowedNetworkPolicies: ['deny_all', 'local_loopback'],
    maxRuntimeMs: 10_000,
    maxMemoryMb: 1024,
    maxConcurrency: 4,
    privacyMode: 'local_only',
    highConsequence: false,
    allowCrossTenant: false,
    allowCrossUniverse: false,
    parentGrant: null,
    ...overrides,
  };
}

const registry: RegistryDeviceRecord[] = [
  {
    deviceId: 'cpu-0',
    deviceKind: 'CPU',
    verificationState: 'VERIFIED',
    providerRuntime: 'cpu-ep',
    modelVersionHash: 'sha256:cpu-model',
    present: true,
  },
  {
    deviceId: 'gpu-0',
    deviceKind: 'GPU',
    verificationState: 'SUPPORTED',
    providerRuntime: 'dml-ep',
    modelVersionHash: 'sha256:gpu-model',
    present: true,
  },
  {
    deviceId: 'npu-0',
    deviceKind: 'NPU',
    verificationState: 'SUPPORTED',
    providerRuntime: 'vitis-ep',
    modelVersionHash: 'sha256:npu-model',
    present: true,
  },
];

test('EM4 locks: L4 false; no cloud purchase / provisioning / driver-BIOS; CPU≠accelerator verify', () => {
  assert.equal(assertEm4LocksIntact(), true);
  assert.equal(EM4_LOCKS.L4_AUTONOMY_ENABLED, false);
  assert.equal(EM4_LOCKS.AUTOMATIC_CLOUD_PURCHASE, false);
  assert.equal(EM4_LOCKS.HARDWARE_PROVISIONING, false);
  assert.equal(EM4_LOCKS.DRIVER_BIOS_SECURITY_CONFIG_CHANGES, false);
  assert.equal(EM4_LOCKS.CPU_SUCCESS_VERIFIES_REQUESTED_ACCELERATOR, false);
  assert.equal(EM4_LOCKS.SILENT_FALLBACK_WITHOUT_RECEIPT_FLAG, false);
  assert.equal(EM4_LOCKS.MANAGE_PULL_REQUEST, false);
  assert.match(EM4_HONESTY_BANNER, /DOCUMENTED/);
  assert.ok(EM4_CORE_FLOW.includes('SIGNED_RETURN_RECEIPT'));
  assert.match(NEXT_PHASE_EM5, /EM5/);
});

test('request schema requires all EM4 fields', () => {
  const bad = baseRequest({ requestId: '' });
  const issues = assertEm4RequestSchema(bad);
  assert.ok(issues.some((r) => r.includes('requestId')));
});

test('sign + verify compute request and return receipt', () => {
  const signed = signComputeRequest(baseRequest(), SECRET);
  assert.equal(verifyComputeRequest(signed, SECRET), true);
  assert.equal(verifyComputeRequest(signed, 'wrong'), false);

  const receipt = buildExecutionReceipt({
    request: baseRequest(),
    attempt: {
      actualExecutionDevice: 'CPU',
      deviceId: 'cpu-0',
      providerRuntime: 'cpu-ep',
      modelVersionHash: 'sha256:x',
      startedAt: '2026-09-09T00:00:00.000Z',
      completedAt: '2026-09-09T00:00:01.000Z',
      latencyMs: 1000,
      resourceEvidence: {
        cpuPercentObserved: 5,
        memoryMbObserved: 100,
        concurrencyObserved: 1,
        governorState: 'NORMAL',
        notes: [],
      },
      executionSucceeded: true,
      evidenceRefs: ['e1'],
    },
  });
  const signedReceipt = signReturnReceipt(receipt, SECRET);
  assert.equal(verifyReturnReceipt(signedReceipt, SECRET), true);
});

test('HARD RULE: GPU→CPU silent fallback sets fallbackUsed + actualExecutionDevice=CPU; acceleratorVerified=false', () => {
  const honesty = applySilentFallbackHonesty({
    requestedDevice: 'GPU',
    actualExecutionDevice: 'CPU',
    executionSucceeded: true,
  });
  assert.equal(detectSilentDeviceFallback('GPU', 'CPU'), true);
  assert.equal(honesty.fallbackUsed, true);
  assert.equal(honesty.acceleratorVerified, false);
  assert.equal(honesty.failureClass, 'SILENT_FALLBACK_TO_CPU');
  assert.equal(honesty.resultState, 'FALLBACK_CPU');

  const receipt = buildExecutionReceipt({
    request: baseRequest({ requestedDevice: 'GPU' }),
    attempt: {
      actualExecutionDevice: 'CPU',
      deviceId: 'cpu-fallback',
      providerRuntime: 'cpu-ep',
      modelVersionHash: 'sha256:fb',
      startedAt: '2026-09-09T00:00:00.000Z',
      completedAt: '2026-09-09T00:00:00.050Z',
      latencyMs: 50,
      resourceEvidence: {
        cpuPercentObserved: 40,
        memoryMbObserved: 200,
        concurrencyObserved: 1,
        governorState: 'NORMAL',
        notes: ['silent fallback'],
      },
      executionSucceeded: true,
      evidenceRefs: ['sf'],
    },
  });
  assert.equal(receipt.fallbackUsed, true);
  assert.equal(receipt.actualExecutionDevice, 'CPU');
  assert.equal(receipt.requestedDevice, 'GPU');
  assert.equal(receipt.acceleratorVerified, false);
  assert.equal(receipt.failureClass, 'SILENT_FALLBACK_TO_CPU');
  assert.equal(receipt.resultState, 'FALLBACK_CPU');
});

test('HARD RULE: NPU→CPU silent fallback honesty in full pipeline', () => {
  const signed = signComputeRequest(
    baseRequest({ requestedDevice: 'NPU', minimumVerificationState: 'SUPPORTED' }),
    SECRET,
  );
  const result = runComputeMessageEnvelope(signed, {
    secret: SECRET,
    grant: baseGrant(),
    registry,
    governorObservation: { memoryMbAvailable: 2048, concurrencyInUse: 0 },
    forceSilentCpuFallback: true,
  });
  assert.ok(result.receipt);
  assert.equal(result.receipt!.payload.fallbackUsed, true);
  assert.equal(result.receipt!.payload.actualExecutionDevice, 'CPU');
  assert.equal(result.receipt!.payload.acceleratorVerified, false);
  assert.equal(result.receipt!.payload.failureClass, 'SILENT_FALLBACK_TO_CPU');
  assert.equal(verifyReturnReceipt(result.receipt!, SECRET), true);
});

test('CPU success cannot verify requested GPU accelerator', () => {
  assert.equal(EM4_LOCKS.CPU_SUCCESS_VERIFIES_REQUESTED_ACCELERATOR, false);
  const honesty = applySilentFallbackHonesty({
    requestedDevice: 'GPU',
    actualExecutionDevice: 'CPU',
    executionSucceeded: true,
  });
  assert.equal(honesty.acceleratorVerified, false);
});

test('GPU success on GPU may mark acceleratorVerified', () => {
  const honesty = applySilentFallbackHonesty({
    requestedDevice: 'GPU',
    actualExecutionDevice: 'GPU',
    executionSucceeded: true,
  });
  assert.equal(honesty.fallbackUsed, false);
  assert.equal(honesty.acceleratorVerified, true);
  assert.equal(honesty.resultState, 'SUCCEEDED');
});

test('safety: expired requests rejected', () => {
  const policy = evaluatePolicyGate(
    baseRequest({ expiry: '2020-01-01T00:00:00.000Z' }),
    baseGrant(),
    { now: new Date('2026-09-09T00:00:00.000Z') },
  );
  assert.equal(policy.allowed, false);
  if (!policy.allowed) assert.equal(policy.denialCode, 'EXPIRED');
});

test('safety: request exceeding agent compute budget denied', () => {
  const policy = evaluatePolicyGate(
    baseRequest({ maxRuntimeMs: 99_999, maxMemoryMb: 50_000 }),
    baseGrant({ maxRuntimeMs: 10_000, maxMemoryMb: 1024 }),
  );
  assert.equal(policy.allowed, false);
  if (!policy.allowed) assert.equal(policy.denialCode, 'BUDGET_EXCEEDED');
});

test('safety: cross-tenant movement denied without explicit policy', () => {
  const policy = evaluatePolicyGate(
    baseRequest({ tenantId: 'tenant-b' }),
    baseGrant({ tenantId: 'tenant-a', allowCrossTenant: false }),
  );
  assert.equal(policy.allowed, false);
  if (!policy.allowed) assert.equal(policy.denialCode, 'CROSS_TENANT_DENIED');
});

test('safety: cross-Universe movement denied without explicit policy', () => {
  const policy = evaluatePolicyGate(
    baseRequest({ homeUniverseId: 'universe-b' }),
    baseGrant({ homeUniverseId: 'universe-a', allowCrossUniverse: false }),
  );
  assert.equal(policy.allowed, false);
  if (!policy.allowed) assert.equal(policy.denialCode, 'CROSS_UNIVERSE_DENIED');
});

test('safety: child agents cannot widen device/model/data/network permissions', () => {
  const parent = baseGrant({
    agentId: 'parent',
    allowedDevices: ['CPU'],
    allowedModels: ['tiny-local'],
    allowedDataClasses: ['public'],
    allowedNetworkPolicies: ['deny_all'],
    maxRuntimeMs: 5_000,
  });
  const child = baseGrant({
    agentId: 'child',
    parentAgentId: 'parent',
    allowedDevices: ['CPU', 'GPU'],
    allowedModels: ['tiny-local', 'bigger'],
    allowedDataClasses: ['public', 'confidential'],
    allowedNetworkPolicies: ['deny_all', 'tenant_private'],
    maxRuntimeMs: 50_000,
    parentGrant: parent,
  });
  const policy = evaluatePolicyGate(
    baseRequest({ agentId: 'child', requestedDevice: 'CPU' }),
    child,
  );
  assert.equal(policy.allowed, false);
  if (!policy.allowed) {
    assert.equal(policy.denialCode, 'CHILD_PERMISSION_WIDEN_DENIED');
    assert.ok(policy.reasons.some((r) => /device/i.test(r)));
  }
});

test('safety: high-consequence tasks return recommendations only', () => {
  const signed = signComputeRequest(baseRequest(), SECRET);
  const result = runComputeMessageEnvelope(signed, {
    secret: SECRET,
    grant: baseGrant({ highConsequence: true }),
    registry,
    governorObservation: { memoryMbAvailable: 2048, concurrencyInUse: 0 },
  });
  assert.ok(result.receipt);
  assert.equal(result.receipt!.payload.resultState, 'RECOMMENDATION_ONLY');
  assert.equal(
    result.receipt!.payload.failureClass,
    'HIGH_CONSEQUENCE_RECOMMENDATION_ONLY',
  );
  assert.equal(result.receipt!.payload.highConsequenceRecommendationOnly, true);
});

test('safety: automatic cloud purchasing denied', () => {
  const signed = signComputeRequest(baseRequest(), SECRET);
  const result = runComputeMessageEnvelope(signed, {
    secret: SECRET,
    grant: baseGrant(),
    registry,
    governorObservation: { memoryMbAvailable: 2048, concurrencyInUse: 0 },
    attemptsCloudPurchase: true,
  });
  assert.equal(result.receipt!.payload.failureClass, 'CLOUD_PURCHASE_DENIED');
  assert.equal(result.receipt!.payload.resultState, 'DENIED');
});

test('safety: hardware provisioning denied', () => {
  const signed = signComputeRequest(baseRequest(), SECRET);
  const result = runComputeMessageEnvelope(signed, {
    secret: SECRET,
    grant: baseGrant(),
    registry,
    governorObservation: { memoryMbAvailable: 2048, concurrencyInUse: 0 },
    attemptsHardwareProvisioning: true,
  });
  assert.equal(result.receipt!.payload.failureClass, 'HARDWARE_PROVISIONING_DENIED');
});

test('safety: driver/BIOS/security configuration changes denied', () => {
  const signed = signComputeRequest(baseRequest(), SECRET);
  const result = runComputeMessageEnvelope(signed, {
    secret: SECRET,
    grant: baseGrant(),
    registry,
    governorObservation: { memoryMbAvailable: 2048, concurrencyInUse: 0 },
    attemptsDriverBiosSecurityConfig: true,
  });
  assert.equal(result.receipt!.payload.failureClass, 'DRIVER_BIOS_CONFIG_DENIED');
});

test('pipeline happy path: CPU request → signed success receipt to home base returnPath', () => {
  const signed = signComputeRequest(baseRequest({ requestedDevice: 'CPU' }), SECRET);
  const result = runComputeMessageEnvelope(signed, {
    secret: SECRET,
    grant: baseGrant(),
    registry,
    governorObservation: { memoryMbAvailable: 2048, concurrencyInUse: 0 },
  });
  assert.equal(result.policy.allowed, true);
  assert.ok(result.receipt);
  assert.equal(result.receipt!.payload.resultState, 'SUCCEEDED');
  assert.equal(result.receipt!.payload.fallbackUsed, false);
  assert.equal(result.receipt!.payload.actualExecutionDevice, 'CPU');
  assert.equal(result.receipt!.payload.returnPath, 'xiv://home-base/agent-1');
  assert.equal(verifyReturnReceipt(result.receipt!, SECRET), true);
});

test('registry miss / device not verified deny', () => {
  const signed = signComputeRequest(
    baseRequest({ requestedDevice: 'GPU', minimumVerificationState: 'VERIFIED' }),
    SECRET,
  );
  const result = runComputeMessageEnvelope(signed, {
    secret: SECRET,
    grant: baseGrant(),
    registry,
    governorObservation: { memoryMbAvailable: 2048, concurrencyInUse: 0 },
  });
  assert.equal(result.receipt!.payload.failureClass, 'DEVICE_NOT_VERIFIED');

  const empty = selectRegistryDevice(baseRequest({ requestedDevice: 'GPU' }), []);
  assert.equal(empty.denialCode, 'REGISTRY_MISS');
});

test('governor deny soft-wire path', () => {
  const signed = signComputeRequest(baseRequest(), SECRET);
  const result = runComputeMessageEnvelope(signed, {
    secret: SECRET,
    grant: baseGrant(),
    registry,
    governorObservation: {
      memoryMbAvailable: 2048,
      concurrencyInUse: 0,
      deny: true,
      governorState: 'DENIED',
    },
  });
  assert.equal(result.receipt!.payload.failureClass, 'GOVERNOR_DENIED');
});

test('invalid signature denied', () => {
  const signed = signComputeRequest(baseRequest(), SECRET);
  signed.signature = 'deadbeef';
  const result = runComputeMessageEnvelope(signed, {
    secret: SECRET,
    grant: baseGrant(),
    registry,
    governorObservation: { memoryMbAvailable: 2048, concurrencyInUse: 0 },
  });
  assert.equal(result.receipt!.payload.failureClass, 'SIGNATURE_INVALID');
});

test('soft-wire: EM1 home base + EM3 registry + EL9 governor + EL7 adapter + EL8 silent-fallback present', () => {
  const snap = em4SoftWireSnapshot();
  assert.equal(snap.em1HomeBasePresent, true);
  assert.equal(snap.em3RegistryPresent, true);
  assert.equal(snap.el9GovernorPresent, true);
  assert.equal(snap.el7AdapterPresent, true);
  assert.equal(snap.el8SilentFallbackPresent, true);
  assert.match(snap.note, /Presence soft-wire/);
});
