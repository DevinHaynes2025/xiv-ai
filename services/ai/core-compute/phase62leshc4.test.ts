/**
 * 62L-ES-HC4 / #166 — Core Compute / Agent Infrastructure denial + honesty tests.
 *
 * Script: npm run test:62leshc4
 * Canonical home: Global Operations Brain.
 * Distinct from productization test:62les4.
 */

import assert from 'node:assert/strict';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';

import {
  ACCELERATION_TECHNIQUES,
  CANONICAL_BRAIN_OWNER,
  ENTERPRISE_OS_DEPENDS_ON_NOTE,
  GITHUB_SOT_ISSUE,
  GITHUB_SOT_LABEL,
  HC4_LOCKS,
  HONESTY_BANNER,
  NEXT_PHASE_TITLE,
  PRODUCTIZATION_ES_COLLISION_NOTE,
  TRUTH_LADDER,
  advanceRouteTruth,
  advanceTechniqueEligibility,
  amdAcceleratorVerificationStatus,
  assertHc4LocksIntact,
  attemptParallelEnterpriseBrain,
  canAdvanceTruthLadder,
  createAccelerationRegistry,
  createCpuGpuNpuRouter,
  createHomeBaseReceiptLedger,
  createMessageBus,
  createTaskGraph,
  denySiliconModificationClaim,
  hc4SoftWireSnapshot,
  runCoreComputeAgentInfraCycle,
  type Hc4Actor,
  type TenantScope,
} from './index.ts';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '../../..');

const scopeA: TenantScope = {
  orgId: 'org-a',
  tenantId: 'tenant-a',
  universeId: 'uni-a',
};

const scopeB: TenantScope = {
  orgId: 'org-b',
  tenantId: 'tenant-b',
  universeId: 'uni-b',
};

const actorA: Hc4Actor = {
  kind: 'acceleration_layer',
  id: 'hc4-actor-a',
  orgId: scopeA.orgId,
  tenantId: scopeA.tenantId,
  universeId: scopeA.universeId,
  permissions: ['draft'],
};

const actorB: Hc4Actor = {
  kind: 'enterprise_os_consumer',
  id: 'enterprise-consumer-b',
  orgId: scopeB.orgId,
  tenantId: scopeB.tenantId,
  universeId: scopeB.universeId,
  permissions: ['draft'],
};

test('SoT HC4 / #166; Global Ops Brain canonical; productization ES4 collision; next Enterprise OS depends-on', () => {
  assert.equal(GITHUB_SOT_LABEL, '62L-ES-HC4');
  assert.equal(GITHUB_SOT_ISSUE, 166);
  assert.equal(CANONICAL_BRAIN_OWNER, 'Global Operations Brain');
  assert.match(ENTERPRISE_OS_DEPENDS_ON_NOTE, /Depends on #166/);
  assert.match(PRODUCTIZATION_ES_COLLISION_NOTE, /test:62les4/);
  assert.match(NEXT_PHASE_TITLE, /Enterprise OS/);
  assert.equal(HONESTY_BANNER.includes('DOCUMENTED'), true);
  assert.deepEqual([...ACCELERATION_TECHNIQUES], [
    'scheduling',
    'batching',
    'caching',
    'quantization',
    'model_selection',
    'fallback',
  ]);
});

test('locks intact; L4 false; no silicon modify; no parallel enterprise brain; no fabricate AMD VERIFIED', () => {
  assert.equal(assertHc4LocksIntact(), true);
  assert.equal(HC4_LOCKS.L4_AUTONOMY_ENABLED, false);
  assert.equal(HC4_LOCKS.MAY_PHYSICALLY_MODIFY_SILICON, false);
  assert.equal(HC4_LOCKS.FABRICATE_AMD_GPU_VERIFIED, false);
  assert.equal(HC4_LOCKS.FABRICATE_AMD_NPU_VERIFIED, false);
  assert.equal(HC4_LOCKS.ENTERPRISE_OS_MAY_BUILD_PARALLEL_BRAIN, false);
  assert.equal(HC4_LOCKS.GLOBAL_OPERATIONS_BRAIN_IS_CANONICAL_HOME, true);
  assert.equal(HC4_LOCKS.TIP_LAND, false);
  assert.equal(HC4_LOCKS.MANAGE_PULL_REQUEST, false);
  assert.equal(HC4_LOCKS.AUTO_CLOUD_PURCHASE, false);
  assert.equal(HC4_LOCKS.CROSS_TENANT_POOLING, false);
});

test('1) Truth ladder skip denied — DOCUMENTED→VERIFIED', () => {
  assert.deepEqual([...TRUTH_LADDER], [
    'DOCUMENTED',
    'DETECTED',
    'SUPPORTED',
    'VERIFIED',
  ]);
  assert.equal(canAdvanceTruthLadder('DOCUMENTED', 'VERIFIED'), false);
  assert.equal(canAdvanceTruthLadder('DOCUMENTED', 'DETECTED'), true);
  assert.equal(canAdvanceTruthLadder('DETECTED', 'SUPPORTED'), true);
  assert.equal(canAdvanceTruthLadder('SUPPORTED', 'VERIFIED'), true);
  assert.equal(canAdvanceTruthLadder('DETECTED', 'VERIFIED'), false);

  const skip = advanceTechniqueEligibility({
    from: 'DOCUMENTED',
    to: 'VERIFIED',
  });
  assert.equal(skip.ok, false);
  if (!skip.ok) {
    assert.match(skip.reason, /TRUTH_LADDER_SKIP_DENIED/);
  }

  const routeSkip = advanceRouteTruth({
    from: 'DOCUMENTED',
    to: 'VERIFIED',
  });
  assert.equal(routeSkip.ok, false);
});

test('2) Unverified AMD GPU path cannot be preferred as VERIFIED', () => {
  const accel = createAccelerationRegistry();
  const denied = accel.propose({
    planId: 'amd-gpu-prefer',
    vendor: 'AMD',
    techniques: ['scheduling', 'batching'],
    hardwareTruthState: 'NOT_TESTED',
    preferAsVerified: true,
    scope: scopeA,
  });
  assert.equal(denied.allowed, false);
  if (!denied.allowed) {
    assert.match(denied.reason, /UNVERIFIED_AMD_CANNOT_BE_PREFERRED_AS_VERIFIED/);
    assert.equal(denied.claimVerified, false);
  }

  const router = createCpuGpuNpuRouter();
  router.register({
    routeId: 'amd-gpu-1',
    vendor: 'AMD',
    acceleratorClass: 'GPU',
    truthState: 'NOT_TESTED',
    isFallback: false,
    scope: scopeA,
  });
  router.register({
    routeId: 'cpu-1',
    vendor: 'AMD',
    acceleratorClass: 'CPU',
    truthState: 'SUPPORTED',
    isFallback: true,
    scope: scopeA,
  });

  const noFallback = router.select({
    scope: scopeA,
    preferVendor: 'AMD',
    preferClass: 'GPU',
    allowFallbackToCpu: false,
  });
  assert.equal(noFallback.selected, false);
  if (!noFallback.selected) {
    assert.match(
      noFallback.reason,
      /UNVERIFIED_AMD_GPU_CANNOT_BE_PREFERRED_AS_VERIFIED/,
    );
    assert.equal(noFallback.claimedAcceleratorVerified, false);
  }

  // Fabricated VERIFIED at register demotes to NOT_TESTED.
  const demoted = router.register({
    routeId: 'amd-gpu-fake',
    vendor: 'AMD',
    acceleratorClass: 'GPU',
    truthState: 'VERIFIED',
    isFallback: false,
    scope: scopeA,
  });
  assert.equal('truthState' in demoted && demoted.truthState, 'NOT_TESTED');

  const status = amdAcceleratorVerificationStatus({ class: 'GPU' });
  assert.equal(status.verified, false);
  assert.equal(status.state, 'NOT_TESTED');
});

test('3) Message bus + task graph return path + Home Base receipt required', () => {
  const bus = createMessageBus();
  const published = bus.publish({
    actor: actorA,
    kind: 'task_dispatch',
    topic: 'core-compute/tasks',
    payload: { task: 'accel-plan-1' },
  });
  assert.equal(published.published, true);

  const graph = createTaskGraph({ graphId: 'g-1', scope: scopeA });
  const node = graph.addNode({
    nodeId: 'n1',
    label: 'accelerate',
    budget: { maxCpuMs: 1000, maxMemoryMb: 512, maxFanout: 2 },
    returnPath: 'home-base://return/g-1/n1',
  });
  assert.ok(node && !('denied' in node));

  const withoutReceipt = graph.executeBranch({
    nodeId: 'n1',
    actor: actorA,
    receiptId: null,
  });
  assert.equal(withoutReceipt.executed, false);
  if (!withoutReceipt.executed) {
    assert.match(
      withoutReceipt.reason,
      /HOME_BASE_RECEIPT_REQUIRED_FOR_BRANCH_EXECUTION/,
    );
  }

  const ledger = createHomeBaseReceiptLedger();
  const issued = ledger.issue({
    actor: actorA,
    graphId: 'g-1',
    nodeId: 'n1',
    branchId: 'branch-1',
    vendor: 'AMD',
    acceleratorClass: 'CPU',
    truthStateClaimed: 'SUPPORTED',
    usedFallback: true,
    claimedAcceleratorVerified: false,
    summary: 'CPU fallback branch with honest receipt.',
  });
  assert.equal(issued.issued, true);
  if (!issued.issued) throw new Error('expected receipt');

  // Fallback claiming accelerator VERIFIED on receipt → denied.
  const badReceipt = ledger.issue({
    actor: actorA,
    graphId: 'g-1',
    nodeId: 'n1',
    branchId: 'branch-bad',
    vendor: 'AMD',
    acceleratorClass: 'GPU',
    truthStateClaimed: 'VERIFIED',
    usedFallback: true,
    claimedAcceleratorVerified: true,
    summary: 'illegal fallback verified claim',
  });
  assert.equal(badReceipt.issued, false);

  const withReceipt = graph.executeBranch({
    nodeId: 'n1',
    actor: actorA,
    receiptId: issued.receipt.receiptId,
  });
  assert.equal(withReceipt.executed, true);
  if (withReceipt.executed) {
    assert.equal(withReceipt.returnPath, 'home-base://return/g-1/n1');
    assert.equal(withReceipt.node.receiptId, issued.receipt.receiptId);
  }

  assert.equal(graph.getReturnPath('n1'), 'home-base://return/g-1/n1');

  // Router fallback honesty
  const router = createCpuGpuNpuRouter();
  router.register({
    routeId: 'cpu-fb',
    vendor: 'AMD',
    acceleratorClass: 'CPU',
    truthState: 'SUPPORTED',
    isFallback: true,
    scope: scopeA,
  });
  const fb = router.select({
    scope: scopeA,
    preferVendor: 'AMD',
    preferClass: 'GPU',
    allowFallbackToCpu: true,
  });
  assert.equal(fb.selected, true);
  if (fb.selected) {
    assert.equal(fb.claimedAcceleratorVerified, false);
    assert.match(fb.note, /fallback ≠ claimed GPU\/NPU VERIFIED/i);
  }
});

test('4) Tenant isolation — message bus and task graph', () => {
  const bus = createMessageBus();
  bus.publish({
    actor: actorA,
    kind: 'heartbeat',
    topic: 'core-compute/hb',
    payload: { ping: 1 },
  });

  const forA = bus.subscribe({ actor: actorA, topic: 'core-compute/hb' });
  const forB = bus.subscribe({ actor: actorB, topic: 'core-compute/hb' });
  assert.equal(forA.length, 1);
  assert.equal(forB.length, 0);

  const cross = bus.attemptCrossTenantRead({
    actor: actorB,
    foreignScope: scopeA,
    topic: 'core-compute/hb',
  });
  assert.equal(cross.denied, true);
  assert.match(cross.reason, /TENANT_UNIVERSE_ISOLATION/);

  const graph = createTaskGraph({ graphId: 'g-iso', scope: scopeA });
  graph.addNode({
    nodeId: 'n-iso',
    label: 'iso',
    budget: { maxCpuMs: 100, maxMemoryMb: 64, maxFanout: 1 },
    returnPath: 'home-base://return/iso',
  });
  const ledger = createHomeBaseReceiptLedger();
  const rcpt = ledger.issue({
    actor: actorA,
    graphId: 'g-iso',
    nodeId: 'n-iso',
    branchId: 'b1',
    vendor: 'INTEL',
    acceleratorClass: 'CPU',
    truthStateClaimed: 'SUPPORTED',
    usedFallback: false,
    claimedAcceleratorVerified: false,
    summary: 'iso',
  });
  assert.ok(rcpt.issued);
  if (!rcpt.issued) throw new Error('receipt');

  const foreignExec = graph.executeBranch({
    nodeId: 'n-iso',
    actor: actorB,
    receiptId: rcpt.receipt.receiptId,
  });
  assert.equal(foreignExec.executed, false);
  if (!foreignExec.executed) {
    assert.match(foreignExec.reason, /TENANT_UNIVERSE_ISOLATION/);
  }

  assert.equal(graph.list(scopeB).length, 0);
  assert.equal(graph.list(scopeA).length, 1);
});

test('5) Enterprise OS cannot get a parallel brain — GOB canonical lock', () => {
  assert.equal(HC4_LOCKS.ENTERPRISE_OS_MAY_BUILD_PARALLEL_BRAIN, false);
  assert.equal(HC4_LOCKS.ENTERPRISE_OS_DEPENDS_ON_166_ONLY, true);
  assert.equal(
    HC4_LOCKS.ALLOW_FRAGMENT_AMD_ENTERPRISE_MOBILE_GOVERNMENT_BRAINS,
    false,
  );

  const attempt = attemptParallelEnterpriseBrain({
    proposedBrainName: 'Enterprise-Only AMD Brain',
    claimedOwner: 'Enterprise OS',
  });
  assert.equal(attempt.denied, true);
  assert.equal(attempt.canonicalOwner, 'Global Operations Brain');
  assert.equal(attempt.enterpriseOsDependsOn166Only, true);
  assert.match(attempt.reason, /parallel/i);

  const silicon = denySiliconModificationClaim(
    'physically modify silicon via BIOS overclock firmware',
  );
  assert.equal(silicon.allowed, false);
  assert.match(silicon.reason, /SILICON_MODIFY/i);
});

test('6) L4 false; AMD GPU/NPU not falsely VERIFIED; soft-wires WAITING_DATA|PASS', () => {
  assert.equal(HC4_LOCKS.L4_AUTONOMY_ENABLED, false);

  const gpu = amdAcceleratorVerificationStatus({ class: 'GPU' });
  const npu = amdAcceleratorVerificationStatus({ class: 'NPU' });
  assert.equal(gpu.verified, false);
  assert.equal(npu.verified, false);
  assert.equal(gpu.state, 'NOT_TESTED');
  assert.equal(npu.state, 'NOT_TESTED');

  const soft = hc4SoftWireSnapshot(repoRoot);
  // Soft-wires: present → PASS path; absent → WAITING_DATA (never FAIL).
  for (const wire of [
    soft.hc1HybridComputeHomeBase,
    soft.hc2ChipBottleneckAnalyzer,
    soft.hc3ComputeGraph,
    soft.globalOperationsBrain,
  ]) {
    assert.equal(typeof wire.present, 'boolean');
    assert.ok(wire.pathChecked.length > 0);
    assert.ok(wire.note.length > 0);
  }

  const cycle = runCoreComputeAgentInfraCycle({
    actor: actorA,
    scope: scopeA,
    repoRoot,
  });
  assert.equal(cycle.locksIntact, true);
  assert.equal(cycle.l4AutonomyEnabled, false);
  assert.equal(cycle.amdGpuVerified, false);
  assert.equal(cycle.amdNpuVerified, false);
  assert.equal(cycle.tipLand, false);
  assert.equal(cycle.managePullRequest, false);
  assert.equal(cycle.canonicalBrainOwner, 'Global Operations Brain');

  const byHop = Object.fromEntries(cycle.hops.map((h) => [h.hop, h]));
  assert.equal(byHop.deny_truth_ladder_skip.state, 'PASS');
  assert.equal(byHop.unverified_amd_not_preferred_verified.state, 'PASS');
  assert.equal(byHop.home_base_receipt_required.state, 'PASS');
  assert.equal(byHop.tenant_universe_isolation.state, 'PASS');
  assert.equal(byHop.enterprise_os_depends_only.state, 'PASS');
  assert.equal(byHop.l4_autonomy_false.state, 'PASS');
  assert.equal(byHop.amd_gpu_npu_not_falsely_verified.state, 'PASS');
  assert.ok(
    byHop.hc1_soft_wire.state === 'PASS' ||
      byHop.hc1_soft_wire.state === 'WAITING_DATA',
  );
  assert.ok(
    byHop.hc2_soft_wire.state === 'PASS' ||
      byHop.hc2_soft_wire.state === 'WAITING_DATA',
  );
  assert.ok(
    byHop.hc3_compute_graph_soft_wire.state === 'PASS' ||
      byHop.hc3_compute_graph_soft_wire.state === 'WAITING_DATA',
  );
  assert.ok(
    byHop.global_operations_brain_soft_wire.state === 'PASS' ||
      byHop.global_operations_brain_soft_wire.state === 'WAITING_DATA',
  );
  // Soft-wires must never FAIL when absent.
  assert.notEqual(byHop.hc1_soft_wire.state, 'FAIL');
  assert.notEqual(byHop.hc2_soft_wire.state, 'FAIL');
  assert.notEqual(byHop.hc3_compute_graph_soft_wire.state, 'FAIL');
  assert.notEqual(byHop.global_operations_brain_soft_wire.state, 'FAIL');
});
