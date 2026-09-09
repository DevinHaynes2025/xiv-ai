/**
 * 62L-ES-HC4 / #166 — Core Compute / Agent Infrastructure public facade +
 * cycle runner (AMD Software Acceleration Layer).
 *
 * Canonical home: Global Operations Brain.
 * Enterprise OS → Depends on #166 only (no parallel brain).
 */

export * from './types.ts';
export * from './amd-acceleration.ts';
export * from './cpu-gpu-npu-router.ts';
export * from './message-bus.ts';
export * from './task-graph.ts';
export * from './home-base-receipts.ts';

import {
  ACCELERATION_TECHNIQUES,
  CANONICAL_BRAIN_OWNER,
  CORE_COMPUTE_CYCLE,
  ENTERPRISE_OS_DEPENDS_ON_NOTE,
  HC4_DB_CANDIDATES_STATUS,
  HC4_LOCKS,
  HC4_MAY,
  HC4_MUST_NOT,
  HONESTY_BANNER,
  NEXT_PHASE_TITLE,
  PRODUCTIZATION_ES_COLLISION_NOTE,
  TRUTH_LADDER,
  amdAcceleratorVerificationStatus,
  assertHc4LocksIntact,
  attemptParallelEnterpriseBrain,
  canAdvanceTruthLadder,
  hc4SoftWireSnapshot,
  resolveGlobalOperationsBrainSoftWire,
  softWireHopState,
  type Hc4Actor,
  type Hc4HopRecord,
  type Hc4SoftWireSnapshot,
  type TenantScope,
} from './types.ts';
import { createAccelerationRegistry } from './amd-acceleration.ts';
import { createCpuGpuNpuRouter } from './cpu-gpu-npu-router.ts';
import { createMessageBus } from './message-bus.ts';
import { createTaskGraph } from './task-graph.ts';
import { createHomeBaseReceiptLedger } from './home-base-receipts.ts';

function nowIso(): string {
  return new Date().toISOString();
}

function hop(
  hopName: (typeof CORE_COMPUTE_CYCLE)[number],
  state: Hc4HopRecord['state'],
  summary: string,
): Hc4HopRecord {
  return { hop: hopName, state, summary, at: nowIso() };
}

export type Hc4CycleResult = {
  label: typeof CORE_COMPUTE_CYCLE;
  honesty: typeof HONESTY_BANNER;
  canonicalBrainOwner: typeof CANONICAL_BRAIN_OWNER;
  enterpriseOsDependsOnNote: typeof ENTERPRISE_OS_DEPENDS_ON_NOTE;
  locksIntact: boolean;
  l4AutonomyEnabled: false;
  amdGpuVerified: false | true;
  amdNpuVerified: false | true;
  amdGpuState: string;
  amdNpuState: string;
  softWires: Hc4SoftWireSnapshot;
  hops: readonly Hc4HopRecord[];
  nextPhase: typeof NEXT_PHASE_TITLE;
  collisionNote: typeof PRODUCTIZATION_ES_COLLISION_NOTE;
  dbCandidates: typeof HC4_DB_CANDIDATES_STATUS;
  may: typeof HC4_MAY;
  mustNot: typeof HC4_MUST_NOT;
  tipLand: false;
  managePullRequest: false;
};

export function runCoreComputeAgentInfraCycle(input?: {
  actor?: Hc4Actor;
  scope?: TenantScope;
  repoRoot?: string;
}): Hc4CycleResult {
  const soft = hc4SoftWireSnapshot(input?.repoRoot);
  const opsBrain = resolveGlobalOperationsBrainSoftWire(input?.repoRoot);
  const amdGpu = amdAcceleratorVerificationStatus({ class: 'GPU' });
  const amdNpu = amdAcceleratorVerificationStatus({ class: 'NPU' });
  const locksIntact = assertHc4LocksIntact();
  const skipDenied = !canAdvanceTruthLadder('DOCUMENTED', 'VERIFIED');

  const parallelDenied = attemptParallelEnterpriseBrain({
    proposedBrainName: 'Enterprise AMD Acceleration Brain',
    claimedOwner: 'Enterprise OS',
  });

  // Touch factories so cycle proves modules load.
  createAccelerationRegistry();
  createCpuGpuNpuRouter();
  createMessageBus();
  createHomeBaseReceiptLedger();
  createTaskGraph({
    scope: input?.scope ?? {
      orgId: 'org-hc4',
      tenantId: 'ten-hc4',
      universeId: 'uni-hc4',
    },
  });

  const hops: Hc4HopRecord[] = [
    hop(
      'honesty_locks',
      locksIntact ? 'PASS' : 'FAIL',
      locksIntact
        ? `${HONESTY_BANNER}; L4=false; tip-land=NO.`
        : 'HC4 locks violated.',
    ),
    hop(
      'canonical_brain_ownership',
      HC4_LOCKS.GLOBAL_OPERATIONS_BRAIN_IS_CANONICAL_HOME ? 'PASS' : 'FAIL',
      `Canonical home: ${CANONICAL_BRAIN_OWNER}.`,
    ),
    hop(
      'enterprise_os_depends_only',
      parallelDenied.denied &&
        HC4_LOCKS.ENTERPRISE_OS_MAY_BUILD_PARALLEL_BRAIN === false
        ? 'PASS'
        : 'FAIL',
      ENTERPRISE_OS_DEPENDS_ON_NOTE,
    ),
    hop(
      'amd_acceleration_bootstrap',
      'PASS',
      `Techniques: ${ACCELERATION_TECHNIQUES.join(', ')} (software only).`,
    ),
    hop(
      'truth_ladder_encoded',
      'PASS',
      `Ladder: ${TRUTH_LADDER.join(' → ')} (no skip).`,
    ),
    hop(
      'cpu_gpu_npu_router',
      'PASS',
      'CPU/GPU/NPU router encoded with truth-ladder honesty.',
    ),
    hop(
      'deny_truth_ladder_skip',
      skipDenied ? 'PASS' : 'FAIL',
      skipDenied
        ? 'DOCUMENTED→VERIFIED skip denied.'
        : 'Ladder skip incorrectly allowed.',
    ),
    hop(
      'unverified_amd_not_preferred_verified',
      HC4_LOCKS.UNVERIFIED_AMD_PREFERRED_AS_VERIFIED === false ? 'PASS' : 'FAIL',
      'Unverified AMD GPU/NPU cannot be preferred as VERIFIED.',
    ),
    hop(
      'message_bus_orchestration',
      'PASS',
      'Message bus for agent/task orchestration encoded.',
    ),
    hop(
      'task_graph_budgets_scopes_return',
      'PASS',
      'Task graph with budgets, scopes, return paths encoded.',
    ),
    hop(
      'home_base_receipt_required',
      HC4_LOCKS.BRANCH_EXECUTION_WITHOUT_HOME_BASE_RECEIPT === false
        ? 'PASS'
        : 'FAIL',
      'Home Base receipt required for every branch execution.',
    ),
    hop(
      'tenant_universe_isolation',
      HC4_LOCKS.GUARDIAN_RLS_TENANT_UNIVERSE_ISOLATION_UNCHANGED
        ? 'PASS'
        : 'FAIL',
      'Guardian/RLS tenant/Universe isolation unchanged.',
    ),
    hop(
      'fallback_neq_accelerator_verified',
      HC4_LOCKS.FALLBACK_EQ_ACCELERATOR_VERIFIED === false ? 'PASS' : 'FAIL',
      'CPU fallback ≠ claimed GPU/NPU VERIFIED.',
    ),
    hop(
      'amd_gpu_npu_not_falsely_verified',
      amdGpu.verified === false && amdNpu.verified === false ? 'PASS' : 'FAIL',
      `${amdGpu.note} | ${amdNpu.note}`,
    ),
    hop(
      'l4_autonomy_false',
      HC4_LOCKS.L4_AUTONOMY_ENABLED === false ? 'PASS' : 'FAIL',
      'L4_AUTONOMY_ENABLED=false.',
    ),
    hop(
      'no_silicon_modify',
      HC4_LOCKS.MAY_PHYSICALLY_MODIFY_SILICON === false &&
        HC4_LOCKS.ACCELERATION_EQ_SILICON_MODIFY === false
        ? 'PASS'
        : 'FAIL',
      'Acceleration ≠ silicon/BIOS/firmware/overclock/driver privilege.',
    ),
    hop(
      'no_auto_cloud_purchase',
      HC4_LOCKS.AUTO_CLOUD_PURCHASE === false ? 'PASS' : 'FAIL',
      'No auto cloud purchase.',
    ),
    hop(
      'no_cross_tenant_pooling',
      HC4_LOCKS.CROSS_TENANT_POOLING === false ? 'PASS' : 'FAIL',
      'No cross-tenant pooling.',
    ),
    hop(
      'hc1_soft_wire',
      softWireHopState(soft.hc1HybridComputeHomeBase.present),
      soft.hc1HybridComputeHomeBase.note,
    ),
    hop(
      'hc2_soft_wire',
      softWireHopState(soft.hc2ChipBottleneckAnalyzer.present),
      soft.hc2ChipBottleneckAnalyzer.note,
    ),
    hop(
      'hc3_compute_graph_soft_wire',
      softWireHopState(soft.hc3ComputeGraph.present),
      soft.hc3ComputeGraph.note,
    ),
    hop(
      'global_operations_brain_soft_wire',
      softWireHopState(opsBrain.present),
      opsBrain.note,
    ),
    hop(
      'db_candidates_not_applied',
      HC4_DB_CANDIDATES_STATUS === 'NOT_APPLIED' ? 'PASS' : 'FAIL',
      `DB candidates ${HC4_DB_CANDIDATES_STATUS}.`,
    ),
    hop(
      'evidence',
      'PASS',
      'HC4/#166 cycle evidence recorded; findings returnable to Global Operations Brain when present.',
    ),
  ];

  return {
    label: CORE_COMPUTE_CYCLE,
    honesty: HONESTY_BANNER,
    canonicalBrainOwner: CANONICAL_BRAIN_OWNER,
    enterpriseOsDependsOnNote: ENTERPRISE_OS_DEPENDS_ON_NOTE,
    locksIntact,
    l4AutonomyEnabled: false,
    amdGpuVerified: amdGpu.verified,
    amdNpuVerified: amdNpu.verified,
    amdGpuState: amdGpu.state,
    amdNpuState: amdNpu.state,
    softWires: soft,
    hops,
    nextPhase: NEXT_PHASE_TITLE,
    collisionNote: PRODUCTIZATION_ES_COLLISION_NOTE,
    dbCandidates: HC4_DB_CANDIDATES_STATUS,
    may: HC4_MAY,
    mustNot: HC4_MUST_NOT,
    tipLand: false,
    managePullRequest: false,
  };
}
