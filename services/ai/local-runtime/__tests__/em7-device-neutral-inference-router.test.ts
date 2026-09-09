/**
 * 62L-EM7 — Device-Neutral Inference Router acceptance tests.
 *
 * These tests MUST execute. Safeguard denies and priority scoring must PASS here.
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import {
  EM7_CORE_FLOW,
  EM7_LOCKS,
  EM7_PRIORITY_BANDS,
  NEXT_PHASE_EM8,
  assertEm7LocksIntact,
  assignPriorityBand,
  createLocalCpuCandidate,
  probeEm7SoftWires,
  routeInferenceRequest,
  scoreEligibleRoute,
  type Em7InferenceRequest,
  type Em7RouteCandidate,
} from '../device-neutral-inference-router';

const TENANT = 'tenant-a';
const UNIVERSE = 'universe-a';

function baseRequest(
  overrides: Partial<Em7InferenceRequest> = {},
): Em7InferenceRequest {
  return {
    requestId: 'req-1',
    agentId: 'agent-1',
    tenantId: TENANT,
    universeScope: UNIVERSE,
    modelId: 'local-demo',
    dataClass: 'internal',
    privacyRequirement: 'local_only',
    requireVerifiedExecution: true,
    allowEdge: true,
    allowCloud: false,
    allowFallback: true,
    consequential: false,
    humanApproved: false,
    policyAllowed: true,
    governorAllowed: true,
    ...overrides,
  };
}

function localNpu(overrides: Partial<Em7RouteCandidate> = {}): Em7RouteCandidate {
  return createLocalCpuCandidate({
    nodeId: 'node-npu',
    tenantId: TENANT,
    universeScope: UNIVERSE,
    device: 'NPU',
    vendor: 'AMD',
    runtimeProvider: 'amd-npu-candidate',
    verificationState: 'VERIFIED',
    measuredLatencyMs: 40,
    availableVramBytes: 2 * 1024 * 1024 * 1024,
    evidenceRefs: ['npu-benchmark-1'],
    ...overrides,
  });
}

function localGpu(overrides: Partial<Em7RouteCandidate> = {}): Em7RouteCandidate {
  return createLocalCpuCandidate({
    nodeId: 'node-gpu',
    tenantId: TENANT,
    universeScope: UNIVERSE,
    device: 'GPU',
    vendor: 'NVIDIA',
    runtimeProvider: 'nvidia-cuda-candidate',
    verificationState: 'VERIFIED',
    measuredLatencyMs: 35,
    availableVramBytes: 8 * 1024 * 1024 * 1024,
    evidenceRefs: ['gpu-benchmark-1'],
    ...overrides,
  });
}

function localCpu(overrides: Partial<Em7RouteCandidate> = {}): Em7RouteCandidate {
  return createLocalCpuCandidate({
    nodeId: 'node-cpu',
    tenantId: TENANT,
    universeScope: UNIVERSE,
    device: 'CPU',
    vendor: 'AMD',
    runtimeProvider: 'cpu-local',
    verificationState: 'VERIFIED',
    measuredLatencyMs: 120,
    evidenceRefs: ['cpu-ok'],
    ...overrides,
  });
}

function edgeNode(overrides: Partial<Em7RouteCandidate> = {}): Em7RouteCandidate {
  return createLocalCpuCandidate({
    nodeId: 'node-edge',
    tenantId: TENANT,
    universeScope: UNIVERSE,
    device: 'EDGE',
    placement: 'edge',
    vendor: 'OTHER',
    runtimeProvider: 'edge-runtime',
    verificationState: 'VERIFIED',
    measuredLatencyMs: 80,
    privacyClass: 'tenant_private',
    ...overrides,
  });
}

function cloudNode(overrides: Partial<Em7RouteCandidate> = {}): Em7RouteCandidate {
  return createLocalCpuCandidate({
    nodeId: 'node-cloud',
    tenantId: TENANT,
    universeScope: UNIVERSE,
    device: 'CLOUD',
    placement: 'cloud',
    vendor: 'MULTI',
    runtimeProvider: 'authorized-cloud',
    verificationState: 'VERIFIED',
    measuredLatencyMs: 200,
    measuredCostUsd: 1.5,
    cloudExplicitlyAuthorized: true,
    privacyClass: 'cloud_allowed_explicit',
    ...overrides,
  });
}

test('EM7 locks intact: L4 off, no silent privacy downgrade, no auto purchase, no cross-tenant', () => {
  assert.equal(assertEm7LocksIntact(), true);
  assert.equal(EM7_LOCKS.L4_AUTONOMY_ENABLED, false);
  assert.equal(EM7_LOCKS.SILENT_PRIVACY_DOWNGRADE, false);
  assert.equal(EM7_LOCKS.AUTOMATIC_CAPACITY_PURCHASE, false);
  assert.equal(EM7_LOCKS.CROSS_TENANT_DATA_MOVE_FOR_FASTER_COMPUTE, false);
  assert.equal(EM7_LOCKS.CLOUD_SPILLOVER_WITHOUT_EXPLICIT_AUTHORIZATION, false);
  assert.equal(EM7_LOCKS.CONSEQUENTIAL_AUTO_EXECUTE, false);
  assert.equal(EM7_LOCKS.MANAGE_PULL_REQUEST, false);
  assert.equal(EM7_LOCKS.TIP_LAND, false);
});

test('EM7 core flow and priority bands are ordered privacy-first', () => {
  assert.deepEqual([...EM7_CORE_FLOW], [
    'AGENT_REQUEST',
    'POLICY',
    'DATA_CLASSIFICATION',
    'MODEL_COMPATIBILITY',
    'COMPUTE_REGISTRY',
    'RESOURCE_GOVERNOR',
    'ROUTE_SCORING',
    'EXECUTE',
    'RETURN_RECEIPT',
    'XIV_HOME_BASE',
  ]);
  assert.deepEqual([...EM7_PRIORITY_BANDS], [
    'LOCAL_VERIFIED_NPU_GPU',
    'LOCAL_VERIFIED_CPU',
    'AUTHORIZED_EDGE',
    'AUTHORIZED_CLOUD',
  ]);
  assert.match(NEXT_PHASE_EM8, /EM8/);
});

test('soft-wire probes EM3/EM5/EM6/EL9/EM1 without claiming VERIFIED', () => {
  const probe = probeEm7SoftWires();
  assert.equal(probe.el9ResourceGovernor, 'PRESENT');
  assert.equal(probe.l4AutonomyEnabled, false);
  assert.equal(probe.silentPrivacyDowngrade, false);
  assert.equal(probe.automaticCapacityPurchase, false);
  assert.equal(probe.detectedEqualsVerified, false);
  assert.equal(probe.locks.em7.L4_AUTONOMY_ENABLED, false);
  assert.match(probe.note, /Presence soft-wire/);
  // EM3/EM4/EM5/EM6/EM1 may be PRESENT or ABSENT depending on parallel park-and-implement.
  for (const key of [
    'em3Registry',
    'em4Envelope',
    'em5AmdWindowsMl',
    'em6NvidiaRuntime',
    'em1HomeBase',
  ] as const) {
    assert.ok(probe[key] === 'PRESENT' || probe[key] === 'ABSENT');
  }
});

test('NOT_TESTED / UNAVAILABLE / stale nodes denied when verified execution required', () => {
  const req = baseRequest({ requireVerifiedExecution: true });
  const notTested = scoreEligibleRoute(
    req,
    localGpu({ verificationState: 'NOT_TESTED', nodeId: 'nt' }),
  );
  assert.equal(notTested.eligible, false);
  assert.ok(notTested.denialCodes.includes('NOT_TESTED_WHEN_VERIFIED_REQUIRED'));

  const unavailable = scoreEligibleRoute(
    req,
    localGpu({ verificationState: 'UNAVAILABLE', nodeId: 'un' }),
  );
  assert.equal(unavailable.eligible, false);
  assert.ok(unavailable.denialCodes.includes('UNAVAILABLE_WHEN_VERIFIED_REQUIRED'));

  const stale = scoreEligibleRoute(
    req,
    localGpu({ heartbeatState: 'STALE', nodeId: 'stale' }),
  );
  assert.equal(stale.eligible, false);
  assert.ok(stale.denialCodes.includes('STALE_OR_WAITING_HEARTBEAT'));

  const decision = routeInferenceRequest(req, [
    localGpu({ verificationState: 'NOT_TESTED' }),
    localGpu({ verificationState: 'UNAVAILABLE', nodeId: 'un2' }),
    localGpu({ heartbeatState: 'WAITING_NODE', nodeId: 'wait' }),
  ]);
  assert.equal(decision.allowed, false);
  assert.equal(decision.selectedNode, null);
  assert.ok(decision.reasonCodes.includes('NO_ELIGIBLE_ROUTE'));
});

test('no cross-tenant data movement to gain faster compute', () => {
  const req = baseRequest({ privacyRequirement: 'local_only' });
  const foreignFast = localGpu({
    nodeId: 'foreign-fast',
    tenantId: 'other-tenant',
    measuredLatencyMs: 5,
  });
  const localSlow = localCpu({ measuredLatencyMs: 200 });
  const decision = routeInferenceRequest(req, [foreignFast, localSlow]);
  assert.equal(decision.allowed, true);
  assert.equal(decision.selectedNode, 'node-cpu');
  assert.ok(
    decision.deniedCandidates.some(
      (d) =>
        d.nodeId === 'foreign-fast' && d.denialCodes.includes('CROSS_TENANT_DENIED'),
    ),
  );
});

test('no cloud spillover without explicit authorization; no auto capacity purchase', () => {
  const req = baseRequest({
    privacyRequirement: 'cloud_allowed_explicit',
    allowCloud: true,
  });
  const unauthorizedCloud = cloudNode({
    nodeId: 'cloud-unauth',
    cloudExplicitlyAuthorized: false,
  });
  const decision = routeInferenceRequest(req, [unauthorizedCloud, localCpu()]);
  assert.equal(decision.allowed, true);
  assert.equal(decision.selectedNode, 'node-cpu');
  assert.ok(
    decision.deniedCandidates.some((d) =>
      d.denialCodes.includes('CLOUD_WITHOUT_AUTHORIZATION'),
    ),
  );

  const purchaseDenied = routeInferenceRequest(
    baseRequest({
      privacyRequirement: 'cloud_allowed_explicit',
      allowCloud: true,
      attemptAutoCapacityPurchase: true,
    }),
    [cloudNode()],
  );
  assert.equal(purchaseDenied.allowed, false);
  assert.ok(purchaseDenied.reasonCodes.includes('CLOUD_AUTO_PURCHASE_DENIED'));
  assert.equal(purchaseDenied.automaticCapacityPurchase, false);
});

test('accelerator failure → fallback visible in receipt (EM4 soft-wire)', () => {
  const decision = routeInferenceRequest(
    baseRequest({ acceleratorFailed: true, allowFallback: true }),
    [localNpu(), localGpu(), localCpu()],
  );
  assert.equal(decision.allowed, true);
  assert.equal(decision.selectedDevice, 'CPU');
  assert.equal(decision.fallbackPlan.visibleInReceipt, true);
  assert.equal(decision.fallbackPlan.doesNotVerifyFailedAccelerator, true);
  assert.ok(decision.reasonCodes.includes('ACCELERATOR_FALLBACK_VISIBLE'));
  assert.ok(decision.reasonCodes.includes('CPU_FALLBACK_PLAN'));
});

test('router cannot silently downgrade privacy requirements', () => {
  const silent = routeInferenceRequest(
    baseRequest({
      privacyRequirement: 'local_only',
      attemptSilentPrivacyDowngrade: true,
      allowCloud: true,
    }),
    [cloudNode(), localCpu()],
  );
  assert.equal(silent.allowed, false);
  assert.ok(silent.reasonCodes.includes('PRIVACY_DOWNGRADE_DENIED'));
  assert.equal(silent.silentPrivacyDowngrade, false);

  const cloudVsLocalOnly = routeInferenceRequest(
    baseRequest({ privacyRequirement: 'local_only', allowCloud: true }),
    [cloudNode({ measuredLatencyMs: 1 }), localCpu({ measuredLatencyMs: 300 })],
  );
  assert.equal(cloudVsLocalOnly.allowed, true);
  assert.equal(cloudVsLocalOnly.selectedNode, 'node-cpu');
  assert.equal(cloudVsLocalOnly.privacyState, 'LOCAL');
  assert.ok(cloudVsLocalOnly.reasonCodes.includes('PRIVACY_REQUIREMENT_PRESERVED'));
});

test('consequential tasks remain approval-gated regardless of compute path', () => {
  const denied = routeInferenceRequest(
    baseRequest({ consequential: true, humanApproved: false }),
    [localNpu(), localCpu()],
  );
  assert.equal(denied.allowed, false);
  assert.ok(denied.reasonCodes.includes('CONSEQUENTIAL_APPROVAL_REQUIRED'));

  const approved = routeInferenceRequest(
    baseRequest({ consequential: true, humanApproved: true }),
    [localNpu(), localCpu()],
  );
  assert.equal(approved.allowed, true);
  assert.equal(approved.selectedDevice, 'NPU');
});

test('priority: LOCAL VERIFIED NPU/GPU → LOCAL VERIFIED CPU → AUTHORIZED EDGE → AUTHORIZED CLOUD', () => {
  assert.equal(assignPriorityBand(localNpu()), 'LOCAL_VERIFIED_NPU_GPU');
  assert.equal(assignPriorityBand(localGpu()), 'LOCAL_VERIFIED_NPU_GPU');
  assert.equal(assignPriorityBand(localCpu()), 'LOCAL_VERIFIED_CPU');
  assert.equal(assignPriorityBand(edgeNode()), 'AUTHORIZED_EDGE');
  assert.equal(assignPriorityBand(cloudNode()), 'AUTHORIZED_CLOUD');

  const decision = routeInferenceRequest(
    baseRequest({
      privacyRequirement: 'hybrid_authorized',
      allowEdge: true,
      allowCloud: true,
    }),
    [
      cloudNode({ measuredLatencyMs: 1, measuredCostUsd: 0.01 }),
      edgeNode({ measuredLatencyMs: 2 }),
      localCpu({ measuredLatencyMs: 500 }),
      localNpu({ measuredLatencyMs: 400 }),
    ],
  );
  assert.equal(decision.allowed, true);
  assert.equal(decision.selectedNode, 'node-npu');
  assert.equal(decision.priorityBand, 'LOCAL_VERIFIED_NPU_GPU');
  assert.ok(decision.reasonCodes.includes('SELECTED_LOCAL_VERIFIED_NPU_GPU'));

  const cpuOverEdge = routeInferenceRequest(
    baseRequest({
      privacyRequirement: 'tenant_private',
      allowEdge: true,
      allowCloud: false,
    }),
    [edgeNode({ measuredLatencyMs: 1 }), localCpu({ measuredLatencyMs: 400 })],
  );
  assert.equal(cpuOverEdge.selectedNode, 'node-cpu');
  assert.equal(cpuOverEdge.priorityBand, 'LOCAL_VERIFIED_CPU');
});

test('vendor-neutral: AMD NPU and NVIDIA GPU compete by evidence, not hard-coded path', () => {
  const amdWins = routeInferenceRequest(baseRequest(), [
    localNpu({ measuredLatencyMs: 20, reliabilityScore: 0.99 }),
    localGpu({ measuredLatencyMs: 90, reliabilityScore: 0.7 }),
    localCpu(),
  ]);
  assert.equal(amdWins.selectedDevice, 'NPU');
  assert.equal(amdWins.vendorNeutral, true);
  assert.ok(amdWins.reasonCodes.includes('VENDOR_NEUTRAL_SELECTION'));

  const nvidiaWins = routeInferenceRequest(baseRequest(), [
    localNpu({ measuredLatencyMs: 90, reliabilityScore: 0.7 }),
    localGpu({ measuredLatencyMs: 15, reliabilityScore: 0.99 }),
    localCpu(),
  ]);
  assert.equal(nvidiaWins.selectedDevice, 'GPU');
  assert.equal(nvidiaWins.runtimeProvider, 'nvidia-cuda-candidate');
});

test('routing decision returns required fields; Home Base acceptance pending EM8', () => {
  const decision = routeInferenceRequest(baseRequest(), [localCpu(), localNpu()]);
  assert.equal(decision.allowed, true);
  assert.ok(typeof decision.selectedNode === 'string');
  assert.ok(decision.selectedDevice === 'NPU' || decision.selectedDevice === 'GPU');
  assert.ok(typeof decision.runtimeProvider === 'string');
  assert.ok(Array.isArray(decision.reasonCodes) && decision.reasonCodes.length > 0);
  assert.ok(
    decision.estimatedLatency === null || typeof decision.estimatedLatency === 'number',
  );
  assert.ok(
    decision.estimatedCost === null || typeof decision.estimatedCost === 'number',
  );
  assert.ok(typeof decision.privacyState === 'string');
  assert.ok(decision.fallbackPlan.visibleInReceipt === true);
  assert.ok(Array.isArray(decision.evidenceRefs));
  assert.equal(decision.l4AutonomyEnabled, false);
  assert.equal(decision.homeBaseReturn, 'PENDING_EM8_RECEIPT');
  assert.match(decision.nextPhase, /EM8/);
  assert.deepEqual([...decision.coreFlow], [...EM7_CORE_FLOW]);
});
