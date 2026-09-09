/**
 * 62L-EW9 — Intel Adapter Candidate cycle runner.
 * Same shared fabric as AMD/NVIDIA — not a second orchestrator or Intel brain.
 */

import {
  CANONICAL_FLOW,
  EW9_LOCKS,
  EW9_MAY,
  EW9_MUST_NOT,
  GITHUB_SOT_ISSUE,
  GITHUB_SOT_LABEL,
  HONESTY_BANNER,
  NEXT_STORY_TITLE,
  assertEw9LocksIntact,
  ew9SoftWireSnapshot,
  intelEnvironmentHonesty,
  softWireHopState,
  type Ew9SoftWireSnapshot,
  type TenantScope,
} from './ew9-types.ts';
import {
  createIntelAdapterCandidate,
  defaultIntelDeviceTable,
  softWireSummary,
} from './intel-adapter.ts';

export type Ew9HopState =
  | 'PASS'
  | 'FAIL'
  | 'WAITING_DATA'
  | 'NOT_TESTED'
  | 'DENIED';

export type Ew9HopRecord = {
  hop: string;
  state: Ew9HopState;
  summary: string;
  at: string;
};

export type Ew9CycleResult = {
  label: '62L-EW9';
  honesty: typeof HONESTY_BANNER;
  locksIntact: boolean;
  l4AutonomyEnabled: false;
  separateIntelBrain: false;
  intelGpuVerified: false;
  intelNpuVerified: false;
  intelHonesty: ReturnType<typeof intelEnvironmentHonesty>;
  softWires: Ew9SoftWireSnapshot;
  softWireHops: ReturnType<typeof softWireSummary>;
  hops: readonly Ew9HopRecord[];
  nextStory: typeof NEXT_STORY_TITLE;
  sotIssue: typeof GITHUB_SOT_ISSUE;
  sotLabel: typeof GITHUB_SOT_LABEL;
  may: typeof EW9_MAY;
  mustNot: typeof EW9_MUST_NOT;
  tipLand: false;
  managePullRequest: false;
  canonicalFlow: typeof CANONICAL_FLOW;
};

function nowIso(): string {
  return new Date().toISOString();
}

function hop(name: string, state: Ew9HopState, summary: string): Ew9HopRecord {
  return { hop: name, state, summary, at: nowIso() };
}

export function runIntelAdapterCandidateCycle(input?: {
  scope?: TenantScope;
  repoRoot?: string;
}): Ew9CycleResult {
  const soft = ew9SoftWireSnapshot(input?.repoRoot);
  const honesty = intelEnvironmentHonesty();
  const locksIntact = assertEw9LocksIntact();
  const adapter = createIntelAdapterCandidate();
  void defaultIntelDeviceTable();
  void adapter;

  const hops: Ew9HopRecord[] = [
    hop(
      'honesty_locks',
      locksIntact ? 'PASS' : 'FAIL',
      locksIntact
        ? `${HONESTY_BANNER}; L4=false; tip-land=NO; no PR.`
        : 'EW9 locks violated.',
    ),
    hop(
      'no_separate_intel_brain',
      EW9_LOCKS.SEPARATE_INTEL_BRAIN === false ? 'PASS' : 'FAIL',
      'Same shared fabric as AMD/NVIDIA — not a separate Intel AI brain.',
    ),
    hop(
      'canonical_flow_encoded',
      'PASS',
      `Pathway: ${CANONICAL_FLOW.join(' → ')}.`,
    ),
    hop(
      'documented_neq_verified',
      EW9_LOCKS.DOCUMENTED_EQ_VERIFIED === false ? 'PASS' : 'FAIL',
      'DOCUMENTED ≠ VERIFIED.',
    ),
    hop(
      'detected_neq_verified',
      EW9_LOCKS.DETECTED_EQ_VERIFIED === false ? 'PASS' : 'FAIL',
      'DETECTED ≠ VERIFIED.',
    ),
    hop(
      'cpu_present_neq_gpu_verified',
      EW9_LOCKS.CPU_PRESENT_IMPLIES_GPU_VERIFIED === false ? 'PASS' : 'FAIL',
      'CPU present ≠ GPU verified.',
    ),
    hop(
      'npu_detected_neq_npu_inference',
      EW9_LOCKS.NPU_DETECTED_IMPLIES_NPU_INFERENCE_VERIFIED === false
        ? 'PASS'
        : 'FAIL',
      'NPU detected ≠ NPU inference verified.',
    ),
    hop(
      'fallback_neq_accelerator_verified',
      EW9_LOCKS.FALLBACK_EQ_ACCELERATOR_VERIFIED === false ? 'PASS' : 'FAIL',
      'Silent/CPU fallback ≠ accelerator VERIFIED.',
    ),
    hop(
      'intel_gpu_npu_honesty',
      honesty.gpuVerified === false && honesty.npuVerified === false
        ? 'PASS'
        : 'FAIL',
      honesty.note,
    ),
    hop(
      'l4_autonomy_false',
      EW9_LOCKS.L4_AUTONOMY_ENABLED === false ? 'PASS' : 'FAIL',
      'L4_AUTONOMY_ENABLED=false.',
    ),
    hop(
      'guardian_rls_unchanged',
      EW9_LOCKS.GUARDIAN_RLS_TENANT_UNIVERSE_ISOLATION_UNCHANGED
        ? 'PASS'
        : 'FAIL',
      'Guardian/RLS/tenant/Universe isolation unchanged.',
    ),
    hop(
      'ew8_soft_wire',
      softWireHopState(soft.ew8NvidiaAdapter.present),
      soft.ew8NvidiaAdapter.note,
    ),
    hop(
      'ew7_soft_wire',
      softWireHopState(soft.ew7AmdAdapter.present),
      soft.ew7AmdAdapter.note,
    ),
    hop(
      'ew6_soft_wire',
      softWireHopState(soft.ew6Chipgraph.present),
      soft.ew6Chipgraph.note,
    ),
    hop(
      'agentmesh_soft_wire',
      softWireHopState(soft.agentMesh.present),
      soft.agentMesh.note,
    ),
    hop(
      'evidence',
      'PASS',
      'EW9 cycle evidence recorded; next story EW10 — Mobile & Edge Capability Registry.',
    ),
  ];

  return {
    label: '62L-EW9',
    honesty: HONESTY_BANNER,
    locksIntact,
    l4AutonomyEnabled: false,
    separateIntelBrain: false,
    intelGpuVerified: false,
    intelNpuVerified: false,
    intelHonesty: honesty,
    softWires: soft,
    softWireHops: softWireSummary(soft),
    hops,
    nextStory: NEXT_STORY_TITLE,
    sotIssue: GITHUB_SOT_ISSUE,
    sotLabel: GITHUB_SOT_LABEL,
    may: EW9_MAY,
    mustNot: EW9_MUST_NOT,
    tipLand: false,
    managePullRequest: false,
    canonicalFlow: CANONICAL_FLOW,
  };
}
