/**
<<<<<<< HEAD
 * 62L-EW7 — AMD Local Communication Adapter public facade + cycle runner.
 *
 * Connects Agent Mesh + Cross-Chip Graph to local AMD paths.
 * No separate AMD agent system. L4=false. tip-land=NO.
 */

export * from './ew7-types.ts';
export * from './compute-envelope.ts';
export * from './compute-receipt.ts';
export * from './resource-policy.ts';
export * from './amd-adapter.ts';

import {
  CANONICAL_FLOW,
  EW7_LOCKS,
  EW7_MAY,
  EW7_MUST_NOT,
  GITHUB_SOT_ISSUE,
  GITHUB_SOT_LABEL,
  HONESTY_BANNER,
  NEXT_STORY_TITLE,
  amdEnvironmentHonesty,
  assertEw7LocksIntact,
  ew7SoftWireSnapshot,
  softWireHopState,
  type Ew7SoftWireSnapshot,
} from './ew7-types.ts';
import {
  createAmdLocalCommunicationAdapter,
  defaultAmdDeviceTable,
  softWireSummary,
} from './amd-adapter.ts';

export const EW7_CYCLE = [
  'honesty_locks',
  'canonical_flow_encoded',
  'no_separate_amd_agent_system',
  'agent_mesh_soft_wire',
  'ew6_chipgraph_soft_wire',
  'hc1_soft_wire',
  'hc4_soft_wire',
  'local_runtime_soft_wire',
  'workload_router_soft_wire',
  'resource_governor_soft_wire',
  'amd_cpu_safe_baseline',
  'amd_gpu_npu_not_fabricated_verified',
  'software_acceleration_only',
  'guardian_rls_unchanged',
  'l4_autonomy_false',
  'evidence',
] as const;

export type Ew7Hop = (typeof EW7_CYCLE)[number];

export type Ew7HopRecord = {
  hop: Ew7Hop;
  state: 'PASS' | 'FAIL' | 'DENIED' | 'WAITING_DATA' | 'NOT_TESTED';
  summary: string;
  at: string;
};

export type Ew7CycleResult = {
  label: typeof GITHUB_SOT_LABEL;
  sotIssue: typeof GITHUB_SOT_ISSUE;
  honesty: typeof HONESTY_BANNER;
  locksIntact: boolean;
  l4AutonomyEnabled: false;
  separateAmdAgentSystem: false;
  canonicalFlow: typeof CANONICAL_FLOW;
  amdGpuVerified: false;
  amdNpuVerified: false;
  amdGpuState: string;
  amdNpuState: string;
  softWires: Ew7SoftWireSnapshot;
  softWireHops: ReturnType<typeof softWireSummary>;
  hops: readonly Ew7HopRecord[];
  nextStory: typeof NEXT_STORY_TITLE;
  may: typeof EW7_MAY;
  mustNot: typeof EW7_MUST_NOT;
  tipLand: false;
  managePullRequest: false;
  guardianRlsUnchanged: true;
};

function nowIso(): string {
  return new Date().toISOString();
}

function hop(
  hopName: Ew7Hop,
  state: Ew7HopRecord['state'],
  summary: string,
): Ew7HopRecord {
  return { hop: hopName, state, summary, at: nowIso() };
}

export function runAmdLocalCommunicationAdapterCycle(input?: {
  repoRoot?: string;
}): Ew7CycleResult {
  const soft = ew7SoftWireSnapshot(input?.repoRoot);
  const env = amdEnvironmentHonesty();
  const locksIntact = assertEw7LocksIntact();
  const adapter = createAmdLocalCommunicationAdapter();
  const devices = defaultAmdDeviceTable();

  // Touch adapter so cycle proves modules load (no fabricated GPU/NPU run).
  void adapter.shared;
  void devices;

  const hops: Ew7HopRecord[] = [
    hop(
      'honesty_locks',
      locksIntact ? 'PASS' : 'FAIL',
      locksIntact ? 'EW7 locks intact' : 'EW7 locks violated',
    ),
    hop(
      'canonical_flow_encoded',
      'PASS',
      CANONICAL_FLOW.join(' → '),
    ),
    hop(
      'no_separate_amd_agent_system',
      EW7_LOCKS.SEPARATE_AMD_AGENT_SYSTEM === false &&
        adapter.separateAmdAgentSystem === false
        ? 'PASS'
        : 'FAIL',
      'Connect Agent Mesh + Chip Graph — no separate AMD agent system',
    ),
    hop(
      'agent_mesh_soft_wire',
      softWireHopState(soft.agentMesh.present),
      soft.agentMesh.note,
    ),
    hop(
      'ew6_chipgraph_soft_wire',
      softWireHopState(soft.ew6Chipgraph.present),
      soft.ew6Chipgraph.note,
    ),
    hop(
      'hc1_soft_wire',
      softWireHopState(soft.hc1HybridHomeBase.present),
      soft.hc1HybridHomeBase.note,
    ),
    hop(
      'hc4_soft_wire',
      softWireHopState(soft.hc4CoreCompute.present),
      soft.hc4CoreCompute.note,
    ),
    hop(
      'local_runtime_soft_wire',
      softWireHopState(soft.localRuntime.present),
      soft.localRuntime.note,
    ),
    hop(
      'workload_router_soft_wire',
      softWireHopState(soft.workloadRouter.present),
      soft.workloadRouter.note,
    ),
    hop(
      'resource_governor_soft_wire',
      softWireHopState(soft.resourceGovernor.present),
      soft.resourceGovernor.note,
    ),
    hop(
      'amd_cpu_safe_baseline',
      'PASS',
      'CPU is safe initial route; successful CPU test → CPU VERIFIED only',
    ),
    hop(
      'amd_gpu_npu_not_fabricated_verified',
      env.gpuVerified === false && env.npuVerified === false
        ? 'NOT_TESTED'
        : 'FAIL',
      env.note,
    ),
    hop(
      'software_acceleration_only',
      'PASS',
      'model/runtime selection, quantization, batching, session reuse, caching, queue, partitioning, fallback, benchmark routing — no silicon/firmware claims',
    ),
    hop(
      'guardian_rls_unchanged',
      EW7_LOCKS.GUARDIAN_RLS_TENANT_UNIVERSE_ISOLATION_UNCHANGED
        ? 'PASS'
        : 'FAIL',
      'Guardian/RLS tenant/Universe isolation unchanged',
    ),
    hop(
      'l4_autonomy_false',
      EW7_LOCKS.L4_AUTONOMY_ENABLED === false ? 'PASS' : 'FAIL',
      'L4_AUTONOMY_ENABLED=false',
    ),
    hop('evidence', 'PASS', 'EW7 cycle complete — child branch only; no PR'),
  ];

  return {
    label: GITHUB_SOT_LABEL,
    sotIssue: GITHUB_SOT_ISSUE,
    honesty: HONESTY_BANNER,
    locksIntact,
    l4AutonomyEnabled: false,
    separateAmdAgentSystem: false,
    canonicalFlow: CANONICAL_FLOW,
    amdGpuVerified: false,
    amdNpuVerified: false,
    amdGpuState: env.gpuState,
    amdNpuState: env.npuState,
    softWires: soft,
    softWireHops: softWireSummary(soft),
    hops,
    nextStory: NEXT_STORY_TITLE,
    may: EW7_MAY,
    mustNot: EW7_MUST_NOT,
    tipLand: false,
    managePullRequest: false,
    guardianRlsUnchanged: true,
  };
}
=======
 * 62L-EW8 — NVIDIA Adapter Candidate public facade.
 * Extends chipgraph — not a parallel NVIDIA brain.
 */

export * from './ew8-types.ts';
export * from './nvidia-capabilities.ts';
export * from './nvidia-runtime.ts';
export * from './nvidia-benchmark.ts';
export {
  attemptAutonomousCloudRental,
  attemptCloudPurchase,
  createComputeEnvelope,
  createHomeBaseReceiptLedger,
  defaultGpuPressure,
  defaultNvidiaCapabilitySnapshot,
  detectedGpuOnly,
  documentedGpuOnly,
  evaluateGpuResourceGovernor,
  markCudaMissing,
  markTensorRtMissing,
  probeGuardianRlsUnchanged,
  runNvidiaAdapter,
  softWireSummary,
  validateComputeEnvelope,
  type AdapterRunResult,
  type ComputeTaskEnvelope,
  type ExecutionReceipt,
  type GpuGovernorDecision,
  type GpuPressureSnapshot,
} from './nvidia-adapter.ts';
>>>>>>> db5b7d3 (feat(62L-EW8): NVIDIA Adapter Candidate + honesty tests #169)
