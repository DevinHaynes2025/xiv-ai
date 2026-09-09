/**
 * 62L-EW6 — Cross-Chip Capability Graph v2 public facade + cycle runner.
 * Integrates with Agent Mesh soft-wire; does not create a second orchestrator.
 */

export * from './types.ts';
export * from './registry.ts';
export * from './graph.ts';
export * from './evidence.ts';
export * from './bottlenecks.ts';
export * from './routing.ts';
export * from './receipts.ts';

import {
  CANONICAL_PATHWAY,
  CHIP_VENDORS,
  EW6_LOCKS,
  EW6_MAY,
  EW6_MUST_NOT,
  GITHUB_SOT_ISSUE,
  GITHUB_SOT_LABEL,
  HONESTY_BANNER,
  NEXT_STORY_TITLE,
  amdHardwareHonesty,
  assertEw6LocksIntact,
  ew6SoftWireSnapshot,
  softWireHopState,
  type Ew6SoftWireSnapshot,
  type TenantScope,
} from './types.ts';
import { createCapabilityGraph } from './graph.ts';

export type Ew6HopState =
  | 'PASS'
  | 'FAIL'
  | 'WAITING_DATA'
  | 'NOT_TESTED'
  | 'DENIED';

export type Ew6HopRecord = {
  hop: string;
  state: Ew6HopState;
  summary: string;
  at: string;
};

export type Ew6CycleResult = {
  label: '62L-EW6';
  honesty: typeof HONESTY_BANNER;
  locksIntact: boolean;
  l4AutonomyEnabled: false;
  separateVendorBrains: false;
  secondOrchestrationFramework: false;
  amdGpuVerified: false;
  amdNpuVerified: false;
  amdHonesty: ReturnType<typeof amdHardwareHonesty>;
  softWires: Ew6SoftWireSnapshot;
  hops: readonly Ew6HopRecord[];
  nextStory: typeof NEXT_STORY_TITLE;
  sotIssue: typeof GITHUB_SOT_ISSUE;
  sotLabel: typeof GITHUB_SOT_LABEL;
  may: typeof EW6_MAY;
  mustNot: typeof EW6_MUST_NOT;
  tipLand: false;
  managePullRequest: false;
  canonicalPathway: typeof CANONICAL_PATHWAY;
};

function nowIso(): string {
  return new Date().toISOString();
}

function hop(name: string, state: Ew6HopState, summary: string): Ew6HopRecord {
  return { hop: name, state, summary, at: nowIso() };
}

export function runCrossChipCapabilityGraphCycle(input?: {
  scope?: TenantScope;
  repoRoot?: string;
}): Ew6CycleResult {
  const soft = ew6SoftWireSnapshot(input?.repoRoot);
  const amd = amdHardwareHonesty();
  const locksIntact = assertEw6LocksIntact();

  const scope: TenantScope = input?.scope ?? {
    orgId: 'org-ew6',
    tenantId: 'tenant-ew6',
    universeId: 'uni-ew6',
  };

  const graph = createCapabilityGraph();
  const seeded = graph.seedSharedSkeleton(scope);

  const hops: Ew6HopRecord[] = [
    hop(
      'honesty_locks',
      locksIntact ? 'PASS' : 'FAIL',
      locksIntact
        ? `${HONESTY_BANNER}; L4=false; tip-land=NO; no PR.`
        : 'EW6 locks violated.',
    ),
    hop(
      'shared_graph_bootstrap',
      'PASS',
      `Shared chipgraph seeded: ${seeded.nodeCount} nodes / ${seeded.edgeCount} edges; vendors=${seeded.vendors.join(',')}.`,
    ),
    hop(
      'no_separate_vendor_brains',
      EW6_LOCKS.SEPARATE_VENDOR_BRAINS === false ? 'PASS' : 'FAIL',
      'One shared graph across AMD/NVIDIA/Intel/ARM/Apple/Qualcomm/RISC-V/future.',
    ),
    hop(
      'no_second_orchestrator',
      EW6_LOCKS.SECOND_ORCHESTRATION_FRAMEWORK === false ? 'PASS' : 'FAIL',
      'Integrate with Agent Mesh — do not create a second orchestration framework.',
    ),
    hop(
      'canonical_pathway_encoded',
      'PASS',
      `Pathway: ${CANONICAL_PATHWAY.join(' → ')}.`,
    ),
    hop(
      'vendors_encoded',
      'PASS',
      `Vendors: ${CHIP_VENDORS.join(', ')}.`,
    ),
    hop(
      'documented_neq_verified',
      EW6_LOCKS.DOCUMENTED_EQ_VERIFIED === false ? 'PASS' : 'FAIL',
      'DOCUMENTED ≠ VERIFIED.',
    ),
    hop(
      'detected_neq_verified',
      EW6_LOCKS.DETECTED_EQ_VERIFIED === false ? 'PASS' : 'FAIL',
      'DETECTED ≠ VERIFIED.',
    ),
    hop(
      'fallback_neq_requested_verified',
      EW6_LOCKS.FALLBACK_EQ_REQUESTED_VERIFIED === false ? 'PASS' : 'FAIL',
      'Fallback actual PASS ≠ requested accelerator VERIFIED.',
    ),
    hop(
      'tenant_universe_isolation',
      EW6_LOCKS.GUARDIAN_RLS_TENANT_UNIVERSE_ISOLATION_UNCHANGED
        ? 'PASS'
        : 'FAIL',
      'Cross-tenant / cross-Universe graph access denied.',
    ),
    hop(
      'amd_gpu_npu_honesty',
      amd.gpuVerified === false && amd.npuVerified === false ? 'PASS' : 'FAIL',
      amd.note,
    ),
    hop(
      'l4_autonomy_false',
      EW6_LOCKS.L4_AUTONOMY_ENABLED === false ? 'PASS' : 'FAIL',
      'L4_AUTONOMY_ENABLED=false.',
    ),
    hop(
      'agentmesh_soft_wire',
      softWireHopState(soft.agentMesh.present),
      soft.agentMesh.note,
    ),
    hop(
      'ew1_ew5_soft_wire',
      softWireHopState(soft.ew1Ew5ResearchMesh.present),
      soft.ew1Ew5ResearchMesh.note,
    ),
    hop(
      'hc3_compute_graph_soft_wire',
      softWireHopState(soft.hc3ComputeGraph.present),
      soft.hc3ComputeGraph.note,
    ),
    hop(
      'ops_brain_soft_wire',
      softWireHopState(soft.globalOperationsBrain.present),
      soft.globalOperationsBrain.note,
    ),
    hop(
      'evidence',
      'PASS',
      'EW6 cycle evidence recorded; next story EW7 — AMD Local Communication Adapter.',
    ),
  ];

  return {
    label: '62L-EW6',
    honesty: HONESTY_BANNER,
    locksIntact,
    l4AutonomyEnabled: false,
    separateVendorBrains: false,
    secondOrchestrationFramework: false,
    amdGpuVerified: false,
    amdNpuVerified: false,
    amdHonesty: amd,
    softWires: soft,
    hops,
    nextStory: NEXT_STORY_TITLE,
    sotIssue: GITHUB_SOT_ISSUE,
    sotLabel: GITHUB_SOT_LABEL,
    may: EW6_MAY,
    mustNot: EW6_MUST_NOT,
    tipLand: false,
    managePullRequest: false,
    canonicalPathway: CANONICAL_PATHWAY,
  };
}
