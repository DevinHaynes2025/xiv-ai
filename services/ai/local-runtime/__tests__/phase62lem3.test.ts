/**
 * 62L-EM3 — Universal Compute Registry denial + selection tests.
 */

import test from 'node:test';
import assert from 'node:assert/strict';

import {
  assertEm3LocksIntact,
  EM3_LOCKS,
  EM3_DB_CANDIDATES_STATUS,
  EM3_HONESTY_BANNER,
} from '../em3-honesty';
import { probeEm3SoftWires } from '../em3-soft-wire';
import {
  buildComputeNode,
  createComponentCapability,
  createUniversalComputeRegistry,
  evaluateNodeEligibility,
  selectComputeNode,
  vendorEvidenceModel,
  verifyAcceleratorComponent,
  type ComputeNode,
  type ComputeTaskRequest,
  type MeasuredEvidence,
} from '../universal-compute-registry';

const NOW = '2026-09-09T13:54:00.000Z';
const FRESH = '2026-09-09T13:53:30.000Z';
const STALE = '2026-09-09T13:50:00.000Z';

function measured(
  kind: MeasuredEvidence['kind'],
  metric: string,
  value: number,
  unit: string,
): MeasuredEvidence {
  return {
    kind,
    metric,
    value,
    unit,
    recordedAt: FRESH,
    evidenceId: `${kind}-${metric}`,
  };
}

function baseLocalNode(
  overrides: Partial<Parameters<typeof buildComputeNode>[0]> = {},
): ComputeNode {
  return buildComputeNode({
    nodeId: 'node-local-1',
    owner: 'founder',
    tenantId: 'tenant-a',
    universeScope: 'universe-a',
    deviceType: 'heterogeneous',
    vendor: 'AMD',
    cpu: createComponentCapability({
      name: 'AMD CPU',
      vendor: 'AMD',
      verificationState: 'VERIFIED',
      measuredEvidence: [measured('benchmark', 'cpu_score', 100, 'idx')],
    }),
    executionProviders: ['CPUExecutionProvider'],
    placement: 'local',
    privacyClass: 'private',
    latencyEvidence: [measured('latency', 'p50', 12, 'ms')],
    energyProxy: null,
    verificationState: 'VERIFIED',
    revocationState: 'ACTIVE',
    heartbeat: { observedAt: FRESH, running: true },
    now: NOW,
    ...overrides,
  });
}

function privateTask(
  overrides: Partial<ComputeTaskRequest> = {},
): ComputeTaskRequest {
  return {
    taskId: 'task-1',
    requestingTenantId: 'tenant-a',
    requestingUniverseScope: 'universe-a',
    privacyClass: 'private',
    preferLocal: true,
    now: NOW,
    ...overrides,
  };
}

test('EM3 honesty locks intact; L4 false; DETECTED≠usable', () => {
  assert.equal(assertEm3LocksIntact(), true);
  assert.equal(EM3_LOCKS.L4_AUTONOMY_ENABLED, false);
  assert.equal(EM3_LOCKS.DETECTED_EQ_USABLE, false);
  assert.equal(EM3_LOCKS.ASSUME_HARDWARE_USABLE_FROM_DETECTED_ALONE, false);
  assert.equal(EM3_DB_CANDIDATES_STATUS, 'NOT_APPLIED');
  assert.match(EM3_HONESTY_BANNER, /DOCUMENTED/);
});

test('soft-wire EL5–EL9 + EM presence; DETECTED≠VERIFIED; silent fallback≠verify', () => {
  const probe = probeEm3SoftWires();
  assert.equal(probe.el5GpuModule, 'PRESENT');
  assert.equal(probe.el6NpuModule, 'PRESENT');
  assert.equal(probe.el7InferenceAdapter, 'PRESENT');
  assert.equal(probe.el8ModelLoadEvidence, 'PRESENT');
  assert.equal(probe.el9ResourceGovernor, 'PRESENT');
  assert.equal(probe.emHonesty, 'PRESENT');
  assert.equal(probe.capabilityTruth, 'PRESENT');
  assert.equal(probe.detectedEqualsVerified, false);
  assert.equal(probe.silentFallbackEqualsAcceleratorVerified, false);
  assert.equal(probe.l4AutonomyEnabled, false);
  assert.equal(probe.guardianRlsTenantBoundariesIntact, true);
});

test('same evidence model for AMD/NVIDIA/Intel/Apple/other', () => {
  for (const vendor of ['AMD', 'NVIDIA', 'INTEL', 'APPLE', 'OTHER', 'UNKNOWN'] as const) {
    assert.equal(vendorEvidenceModel(vendor), 'UNIVERSAL_SAME_FOR_ALL_VENDORS');
  }
});

test('DETECTED hardware is not automatically usable', () => {
  const detected = baseLocalNode({
    verificationState: 'DETECTED',
    gpu: createComponentCapability({
      name: 'GPU',
      vendor: 'NVIDIA',
      verificationState: 'DETECTED',
    }),
  });
  const result = evaluateNodeEligibility(detected, privateTask());
  assert.equal(result.eligible, false);
  assert.equal(result.usableFromDetectedAlone, false);
  assert.ok(result.denialCodes.includes('DETECTED_NOT_USABLE'));
});

test('GPU/NPU VERIFIED requires bounded inference or benchmark evidence', () => {
  const fake = verifyAcceleratorComponent(
    createComponentCapability({
      name: 'NPU',
      vendor: 'INTEL',
      verificationState: 'DETECTED',
    }),
    { claimVerifiedWithoutEvidence: true },
  );
  assert.notEqual(fake.verificationState, 'VERIFIED');

  const verified = verifyAcceleratorComponent(
    createComponentCapability({
      name: 'GPU',
      vendor: 'APPLE',
      verificationState: 'SUPPORTED',
    }),
    {
      measuredEvidence: [measured('bounded_inference', 'tokens_per_sec', 40, 'tps')],
    },
  );
  assert.equal(verified.verificationState, 'VERIFIED');
  assert.ok(verified.measuredEvidence.length > 0);

  const nodeMissingEvidence = baseLocalNode({
    gpu: createComponentCapability({
      name: 'GPU',
      vendor: 'AMD',
      verificationState: 'VERIFIED',
      measuredEvidence: [],
      evidence: ['claimed_fast'],
    }),
  });
  const denied = evaluateNodeEligibility(
    nodeMissingEvidence,
    privateTask({ requireVerifiedAccelerator: true, requireAccelerator: 'gpu' }),
  );
  assert.equal(denied.eligible, false);
  assert.ok(denied.denialCodes.includes('ACCELERATOR_MISSING_BOUNDED_EVIDENCE'));
});

test('cloud nodes require explicit authorization; cannot auto-purchase', () => {
  const cloud = baseLocalNode({
    nodeId: 'cloud-1',
    placement: 'cloud',
    privacyClass: 'public_cloud',
    deviceType: 'cloud_instance',
    vendor: 'OTHER',
    cloudAuthorization: { explicitlyAuthorized: false },
  });
  const task = privateTask({
    privacyClass: 'public_cloud',
    allowCloud: true,
    preferLocal: false,
  });
  const denied = evaluateNodeEligibility(cloud, task);
  assert.equal(denied.eligible, false);
  assert.ok(denied.denialCodes.includes('CLOUD_NOT_AUTHORIZED'));

  const authorized = baseLocalNode({
    nodeId: 'cloud-2',
    placement: 'cloud',
    privacyClass: 'public_cloud',
    deviceType: 'cloud_instance',
    vendor: 'OTHER',
    cloudAuthorization: {
      explicitlyAuthorized: true,
      authorizedBy: 'founder',
      authorizedAt: FRESH,
    },
  });
  assert.equal(authorized.cloudAuthorization?.capacityPurchaseAllowed, false);
  assert.equal(authorized.costModel.autoPurchaseEnabled, false);
  const ok = evaluateNodeEligibility(authorized, task);
  assert.equal(ok.eligible, true);
});

test('local/private workloads prefer compatible local compute', () => {
  const local = baseLocalNode({ nodeId: 'local-ok' });
  const edge = baseLocalNode({
    nodeId: 'edge-ok',
    placement: 'edge',
    privacyClass: 'tenant',
  });
  const cloud = baseLocalNode({
    nodeId: 'cloud-auth',
    placement: 'cloud',
    privacyClass: 'public_cloud',
    cloudAuthorization: {
      explicitlyAuthorized: true,
      authorizedBy: 'founder',
      authorizedAt: FRESH,
    },
  });
  const selection = selectComputeNode(
    [cloud, edge, local],
    privateTask({ privacyClass: 'private', preferLocal: true }),
  );
  assert.equal(selection.preferLocalApplied, true);
  assert.equal(selection.cloudAutoPurchase, false);
  assert.equal(selection.selected?.nodeId, 'local-ok');
  assert.ok(!selection.eligibleNodeIds.includes('cloud-auth'));
});

test('cross-tenant compute/data use is deny-by-default', () => {
  const node = baseLocalNode({ tenantId: 'tenant-b' });
  const result = evaluateNodeEligibility(node, privateTask({ requestingTenantId: 'tenant-a' }));
  assert.equal(result.eligible, false);
  assert.ok(result.denialCodes.includes('CROSS_TENANT_DENIED'));
});

test('cross-universe scope denied (Guardian/Universe boundaries)', () => {
  const node = baseLocalNode({ universeScope: 'universe-b' });
  const result = evaluateNodeEligibility(
    node,
    privateTask({ requestingUniverseScope: 'universe-a' }),
  );
  assert.equal(result.eligible, false);
  assert.ok(result.denialCodes.includes('CROSS_UNIVERSE_DENIED'));
});

test('stale heartbeat removes node from RUNNING_VERIFIED eligibility', () => {
  const node = baseLocalNode({
    heartbeat: { observedAt: STALE, running: true, staleAfterMs: 120_000 },
  });
  const result = evaluateNodeEligibility(node, privateTask({ now: NOW }));
  assert.equal(result.eligible, false);
  assert.ok(result.denialCodes.includes('STALE_OR_WAITING_HEARTBEAT'));
  assert.equal(node.heartbeat.classifiedState === 'STALE' || result.denialCodes.length > 0, true);
});

test('revoked devices immediately ineligible for new tasks', () => {
  const registry = createUniversalComputeRegistry();
  registry.upsert({
    ...baseLocalNode(),
    now: NOW,
  });
  registry.revoke('node-local-1', NOW);
  const result = registry.evaluate('node-local-1', privateTask());
  assert.equal(result.eligible, false);
  assert.ok(result.denialCodes.includes('REVOKED'));
});

test('performance and cost claims require measured evidence', () => {
  const node = baseLocalNode({
    costModel: {
      claimedCostPerHourUsd: 1.5,
      measured: [],
      authorizedPurchase: false,
      autoPurchaseEnabled: false,
    },
    latencyEvidence: [],
    gpu: createComponentCapability({
      verificationState: 'SUPPORTED',
      evidence: ['fast_perf_claim'],
    }),
  });
  // Force VERIFIED node-level with perf claim strings for gate
  const claimed = {
    ...node,
    verificationState: 'VERIFIED' as const,
    cpu: createComponentCapability({
      verificationState: 'VERIFIED',
      evidence: ['fast_latency_claim'],
      measuredEvidence: [],
    }),
  };
  const result = evaluateNodeEligibility(
    claimed,
    privateTask({ requireMeasuredPerfOrCostClaims: true }),
  );
  assert.equal(result.eligible, false);
  assert.ok(result.denialCodes.includes('COST_CLAIM_WITHOUT_EVIDENCE'));
  assert.ok(result.denialCodes.includes('PERFORMANCE_CLAIM_WITHOUT_EVIDENCE'));
});

test('registry select: verified local with fresh heartbeat succeeds', () => {
  const registry = createUniversalComputeRegistry();
  registry.upsert({
    nodeId: 'asus-1',
    owner: 'founder',
    tenantId: 'tenant-a',
    universeScope: 'universe-a',
    deviceType: 'heterogeneous',
    vendor: 'AMD',
    cpu: createComponentCapability({
      vendor: 'AMD',
      verificationState: 'VERIFIED',
      measuredEvidence: [measured('benchmark', 'cpu', 1, 'idx')],
    }),
    gpu: createComponentCapability({
      vendor: 'AMD',
      verificationState: 'VERIFIED',
      measuredEvidence: [measured('bounded_inference', 'tps', 20, 'tps')],
    }),
    executionProviders: ['CPUExecutionProvider', 'DmlExecutionProvider'],
    placement: 'local',
    privacyClass: 'private',
    latencyEvidence: [measured('latency', 'p50', 10, 'ms')],
    energyProxy: measured('energy', 'proxy_watts', 45, 'W'),
    verificationState: 'VERIFIED',
    revocationState: 'ACTIVE',
    heartbeat: { observedAt: FRESH, running: true },
    now: NOW,
  });
  const selection = registry.select(
    privateTask({ requireVerifiedAccelerator: true, requireAccelerator: 'gpu' }),
  );
  assert.equal(selection.selected?.nodeId, 'asus-1');
  assert.equal(selection.l4AutonomyEnabled, false);
});

test('DETECTED accelerator alone never selected for verified accelerator task (any vendor)', () => {
  const vendors = ['AMD', 'NVIDIA', 'INTEL', 'APPLE'] as const;
  for (const vendor of vendors) {
    const node = baseLocalNode({
      nodeId: `det-${vendor}`,
      vendor,
      gpu: createComponentCapability({
        vendor,
        verificationState: 'DETECTED',
      }),
      npu: createComponentCapability({
        vendor,
        verificationState: 'DETECTED',
      }),
    });
    const result = evaluateNodeEligibility(
      node,
      privateTask({ requireVerifiedAccelerator: true, requireAccelerator: 'any' }),
    );
    assert.equal(result.eligible, false, vendor);
    assert.ok(result.denialCodes.includes('ACCELERATOR_NOT_VERIFIED'), vendor);
    assert.equal(result.vendorEvidenceModel, 'UNIVERSAL_SAME_FOR_ALL_VENDORS');
  }
});
