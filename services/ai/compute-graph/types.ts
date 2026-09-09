/**
 * 62L-ES-HC3 — Cross-Vendor Chip Path Graph + Hardware Truth Matrix +
 * Bottleneck Evidence Routing (park-and-implement).
 *
 * Track: 62L-ES Hybrid Compute Superbrain (GitHub #165 / #164 family) —
 * DISTINCT from productization 62L-ES ES3 (must NOT overwrite test:62les3).
 * Prefer HC-track names: compute-graph/*, phase62leshc3, test:62leshc3,
 * 62L_ES_HC3_CROSS_VENDOR_CHIP_PATH_GRAPH_REPORT.md.
 *
 * SoT: GitHub #165. gh issue view may be unresolved (403/404); founder brief
 * is authoritative for this phase. GitLab mirror: needsAuth; no number invented.
 *
 * Soft-wire when PRESENT (existsSync): HC1 Hybrid Compute Home Base, HC2 Chip
 * Bottleneck Analyzer, ER34 capability manifests, Global Operations Brain.
 * Presence ≠ VERIFIED. Absent → WAITING_DATA (not FAIL).
 *
 * Honesty: DOCUMENTED ≠ IMPLEMENTED ≠ VERIFIED ≠ PRODUCTION AUTHORIZED.
 * Truth ladder (no skip): DOCUMENTED → DETECTED → SUPPORTED → VERIFIED.
 * L4_AUTONOMY_ENABLED=false. No silicon-modify claims. tip-land=NO. No PR.
 * AMD GPU verification remains NO / NOT_TESTED unless fresh evidence exists.
 * Next (docs only): ES4 — AMD Software Acceleration Layer.
 */

import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

export const HONESTY_BANNER =
  'DOCUMENTED ≠ IMPLEMENTED ≠ VERIFIED ≠ PRODUCTION AUTHORIZED' as const;

export const GITHUB_SOT_ISSUE = 165 as const;
export const GITHUB_SOT_LABEL = '62L-ES-HC3' as const;
export const GITHUB_SOT_FAMILY = '62L-ES-HC' as const;
export const GITHUB_SOT_TRACK =
  '62L-ES Hybrid Compute Superbrain (GitHub #164/#165)' as const;
export const GITHUB_SOT_TITLE =
  '62L-ES-HC3 Cross-Vendor Chip Path Graph — Hardware Truth Matrix + path graph + bottleneck evidence routing; DOCUMENTED→DETECTED→SUPPORTED→VERIFIED no-skip; fallback≠VERIFIED; stale demotes VERIFIED; AMD GPU NOT_TESTED unless evidence; L4=false' as const;

export const PRODUCTIZATION_ES_COLLISION_NOTE =
  'Distinct from productization 62L-ES ES3. HC3 uses compute-graph / phase62leshc3 / test:62leshc3 and must not overwrite test:62les3.' as const;

export const GITHUB_SOT_ACCESS_NOTE =
  'gh issue view 165 unresolved in this agent environment (403/404); founder brief + #165 retained as SoT.' as const;

export const GITLAB_MIRROR_NOTE =
  'GitLab mirror: search attempted; MCP needsAuth / not resolved — no issue number invented.' as const;

export const HC3_DB_CANDIDATES_STATUS = 'NOT_APPLIED' as const;

export const NEXT_PHASE_TITLE =
  'ES4 — AMD Software Acceleration Layer — proprietary scheduling/batching/caching/quantization/model-selection/fallback intelligence for better use of verified AMD CPU/GPU/NPU hardware (still evidence-gated).' as const;

/** Ordered advancement ladder — never skip. */
export const TRUTH_LADDER = [
  'DOCUMENTED',
  'DETECTED',
  'SUPPORTED',
  'VERIFIED',
] as const;

export type TruthLadderState = (typeof TRUTH_LADDER)[number];

/** Honesty / availability states adjacent to the ladder. */
export const HONESTY_STATES = [
  'NOT_TESTED',
  'DEGRADED',
  'WAITING_NODE',
  'WAITING_DATA',
  'UNAVAILABLE',
  'STALE',
  'REVOKED',
  'REVALIDATION_REQUIRED',
] as const;

export type HonestyState = (typeof HONESTY_STATES)[number];

export type HardwareTruthState = TruthLadderState | HonestyState;

export const CHIP_VENDORS = [
  'AMD',
  'NVIDIA',
  'INTEL',
  'ARM',
  'RISC_V',
  'APPLE',
  'QUALCOMM',
  'FUTURE_ACCELERATOR',
] as const;

export type ChipVendor = (typeof CHIP_VENDORS)[number];

export const ACCELERATOR_CLASSES = [
  'CPU',
  'GPU',
  'NPU',
  'OTHER_ACCELERATOR',
] as const;

export type AcceleratorClass = (typeof ACCELERATOR_CLASSES)[number];

export const PATH_EDGE_KINDS = [
  'architecture',
  'runtime',
  'bottleneck',
  'evidence',
  'eligibility',
  'fallback',
] as const;

export type PathEdgeKind = (typeof PATH_EDGE_KINDS)[number];

/** HC2 bottleneck classes (mirrored for routing when HC2 present). */
export const BOTTLENECK_CLASSES = [
  'COMPUTE_BOUND',
  'MEMORY_BOUND',
  'I_O_BOUND',
  'NETWORK_BOUND',
  'RUNTIME_BOUND',
  'MODEL_COMPATIBILITY_BOUND',
  'QUEUE_BOUND',
  'THERMAL_RESOURCE_BOUND',
  'DATA_TRANSFER_BOUND',
  'UNKNOWN',
] as const;

export type BottleneckClass = (typeof BOTTLENECK_CLASSES)[number];

export const CHIP_PATH_GRAPH_CYCLE = [
  'honesty_locks',
  'cross_vendor_chip_path_graph_bootstrap',
  'truth_ladder_encoded',
  'hardware_truth_matrix_encoded',
  'vendors_encoded',
  'path_graph_workload_runtime_chip_eligibility',
  'bottleneck_evidence_routing',
  'deny_truth_ladder_skip',
  'stale_evidence_demotes_verified',
  'fallback_neq_accelerator_verified',
  'tenant_universe_isolation',
  'amd_gpu_not_falsely_verified',
  'l4_autonomy_false',
  'no_silicon_modify',
  'hc1_soft_wire',
  'hc2_soft_wire',
  'er34_soft_wire',
  'global_operations_brain_soft_wire',
  'db_candidates_not_applied',
  'evidence',
] as const;

export type Hc3Hop = (typeof CHIP_PATH_GRAPH_CYCLE)[number];

export type Hc3EvidenceState =
  | 'PASS'
  | 'FAIL'
  | 'DENIED'
  | 'WAITING_DATA'
  | 'NOT_TESTED'
  | 'NOT_APPLIED'
  | 'STALE'
  | 'REVALIDATION_REQUIRED'
  | HardwareTruthState;

export type Hc3HopRecord = {
  hop: Hc3Hop;
  state: Hc3EvidenceState;
  summary: string;
  at: string;
};

export type Hc3ActorKind =
  | 'path_graph'
  | 'truth_matrix'
  | 'scheduler'
  | 'proposal'
  | 'human_approver'
  | 'founder'
  | 'guardian'
  | 'operations_brain';

export type Hc3Actor = {
  kind: Hc3ActorKind;
  id: string;
  orgId: string;
  tenantId: string;
  universeId: string;
  permissions: readonly string[];
};

export type SoftWirePresence = {
  present: boolean;
  pathChecked: string;
  note: string;
};

export type Hc3SoftWireSnapshot = {
  hc1HybridComputeHomeBase: SoftWirePresence;
  hc2ChipBottleneckAnalyzer: SoftWirePresence;
  er34CapabilityManifest: SoftWirePresence;
  globalOperationsBrain: SoftWirePresence;
  hc1Report: SoftWirePresence;
  hc2Report: SoftWirePresence;
};

export const HC3_LOCKS = Object.freeze({
  L4_AUTONOMY_ENABLED: false as const,
  TIP_LAND: false as const,
  PRODUCTION_AUTHORIZATION: false as const,
  PRODUCTION_WRITE: false as const,
  DB_CANDIDATES_APPLIED: false as const,
  MANAGE_PULL_REQUEST: false as const,
  FULL_PRODUCTION_PATH_GRAPH_SHIPPED: false as const,

  // Ladder honesty
  TRUTH_LADDER_SKIP_ALLOWED: false as const,
  DOCUMENTED_TO_VERIFIED_JUMP_ALLOWED: false as const,
  DETECTED_EQ_VERIFIED: false as const,
  SUPPORTED_EQ_VERIFIED: false as const,
  NOT_TESTED_EQ_VERIFIED: false as const,
  PRESENCE_EQ_VERIFIED: false as const,
  FALLBACK_EQ_ACCELERATOR_VERIFIED: false as const,
  STALE_EVIDENCE_KEEPS_VERIFIED: false as const,
  FABRICATE_AMD_GPU_VERIFIED: false as const,

  // Silicon
  MAY_PHYSICALLY_MODIFY_SILICON: false as const,

  // Isolation / autonomy
  BYPASS_GUARDIAN_RLS_TENANT_UNIVERSE: false as const,
  GUARDIAN_RLS_TENANT_UNIVERSE_ISOLATION_UNCHANGED: true as const,
  AGENT_AUTO_AUTHORITY: false as const,
  RECOMMEND_EQ_ACT: false as const,

  DOCUMENTED_EQ_IMPLEMENTED: false as const,
  IMPLEMENTED_EQ_VERIFIED: false as const,
  VERIFIED_EQ_PRODUCTION_AUTHORIZED: false as const,

  HUMAN_APPROVAL_REQUIRED_BEFORE_CONSEQUENTIAL_ACTIONS: true as const,
});

export const HC3_MAY = Object.freeze([
  'encode_cross_vendor_hardware_truth_matrix',
  'build_workload_runtime_chip_eligibility_paths',
  'route_bottleneck_evidence_to_hc2_classes',
  'advance_truth_ladder_one_step_with_evidence',
  'demote_verified_on_stale_evidence',
  'label_fallback_paths_without_claiming_accelerator_verified',
  'soft_wire_hc1_hc2_er34_ops_brain_when_present',
  'isolate_graph_queries_by_tenant_universe',
] as const);

export const HC3_MUST_NOT = Object.freeze([
  'skip_truth_ladder_steps',
  'jump_documented_to_verified',
  'treat_fallback_as_accelerator_verified',
  'keep_verified_when_evidence_stale',
  'fabricate_amd_gpu_verified_without_evidence',
  'physically_modify_silicon',
  'reuse_paths_across_tenants_or_universes',
  'enable_l4_autonomy',
  'tip_land_or_open_pr',
] as const);

export function assertHc3LocksIntact(): boolean {
  return (
    HC3_LOCKS.L4_AUTONOMY_ENABLED === false &&
    HC3_LOCKS.TRUTH_LADDER_SKIP_ALLOWED === false &&
    HC3_LOCKS.DOCUMENTED_TO_VERIFIED_JUMP_ALLOWED === false &&
    HC3_LOCKS.DETECTED_EQ_VERIFIED === false &&
    HC3_LOCKS.SUPPORTED_EQ_VERIFIED === false &&
    HC3_LOCKS.NOT_TESTED_EQ_VERIFIED === false &&
    HC3_LOCKS.PRESENCE_EQ_VERIFIED === false &&
    HC3_LOCKS.FALLBACK_EQ_ACCELERATOR_VERIFIED === false &&
    HC3_LOCKS.STALE_EVIDENCE_KEEPS_VERIFIED === false &&
    HC3_LOCKS.FABRICATE_AMD_GPU_VERIFIED === false &&
    HC3_LOCKS.MAY_PHYSICALLY_MODIFY_SILICON === false &&
    HC3_LOCKS.BYPASS_GUARDIAN_RLS_TENANT_UNIVERSE === false &&
    HC3_LOCKS.GUARDIAN_RLS_TENANT_UNIVERSE_ISOLATION_UNCHANGED === true &&
    HC3_LOCKS.AGENT_AUTO_AUTHORITY === false &&
    HC3_LOCKS.RECOMMEND_EQ_ACT === false &&
    HC3_LOCKS.TIP_LAND === false &&
    HC3_LOCKS.PRODUCTION_AUTHORIZATION === false &&
    HC3_LOCKS.DB_CANDIDATES_APPLIED === false &&
    HC3_LOCKS.MANAGE_PULL_REQUEST === false &&
    HC3_LOCKS.FULL_PRODUCTION_PATH_GRAPH_SHIPPED === false &&
    HC3_LOCKS.HUMAN_APPROVAL_REQUIRED_BEFORE_CONSEQUENTIAL_ACTIONS === true
  );
}

function softWireFile(
  fromDir: string,
  rel: string,
  notePresent: string,
  noteAbsent: string,
): SoftWirePresence {
  const pathChecked = join(fromDir, rel);
  const present = existsSync(pathChecked);
  return {
    present,
    pathChecked,
    note: present ? notePresent : noteAbsent,
  };
}

function softWireAbsolute(
  pathChecked: string,
  notePresent: string,
  noteAbsent: string,
): SoftWirePresence {
  const present = existsSync(pathChecked);
  return {
    present,
    pathChecked,
    note: present ? notePresent : noteAbsent,
  };
}

/**
 * Soft-wire presence probe. Presence ≠ VERIFIED.
 * Absent → WAITING_DATA (caller maps via softWireHopState).
 */
export function hc3SoftWireSnapshot(repoRoot?: string): Hc3SoftWireSnapshot {
  const here = dirname(fileURLToPath(import.meta.url));
  const root = repoRoot ?? join(here, '../../..');
  const localBrain = join(here, '../local-brain');

  return {
    hc1HybridComputeHomeBase: softWireFile(
      localBrain,
      'hybrid-compute-home-base-types.ts',
      'HC1 Hybrid Compute Home Base PRESENT (soft-wire). Presence≠VERIFIED.',
      'HC1 Hybrid Compute Home Base absent — soft-wire WAITING_DATA.',
    ),
    hc2ChipBottleneckAnalyzer: softWireFile(
      localBrain,
      'chip-bottleneck-analyzer-types.ts',
      'HC2 Chip Bottleneck Analyzer PRESENT (soft-wire). Presence≠VERIFIED.',
      'HC2 Chip Bottleneck Analyzer absent — soft-wire WAITING_DATA.',
    ),
    er34CapabilityManifest: softWireFile(
      localBrain,
      'capability-manifest-types.ts',
      'ER34 Capability Manifest PRESENT (soft-wire). Presence≠VERIFIED.',
      'ER34 Capability Manifest absent — soft-wire WAITING_DATA.',
    ),
    globalOperationsBrain: resolveGlobalOperationsBrainSoftWire(root),
    hc1Report: softWireAbsolute(
      join(root, 'docs/operations/62L_ES_HC1_HYBRID_COMPUTE_HOME_BASE_REPORT.md'),
      'HC1 report PRESENT.',
      'HC1 report absent — soft-wire WAITING_DATA.',
    ),
    hc2Report: softWireAbsolute(
      join(
        root,
        'docs/operations/62L_ES_HC2_CHIP_BOTTLENECK_ANALYZER_REPORT.md',
      ),
      'HC2 report PRESENT.',
      'HC2 report absent — soft-wire WAITING_DATA.',
    ),
  };
}

/** Prefer primary path; if absent, still expose park path for ops brain soft-wire. */
export function resolveGlobalOperationsBrainSoftWire(
  repoRoot?: string,
): SoftWirePresence {
  const here = dirname(fileURLToPath(import.meta.url));
  const root = repoRoot ?? join(here, '../../..');
  const primary = join(
    root,
    'services/ai/local-brain/global-operations-brain-types.ts',
  );
  if (existsSync(primary)) {
    return {
      present: true,
      pathChecked: primary,
      note: 'Global Operations Brain PRESENT (soft-wire). Findings returnable to Operations Brain.',
    };
  }
  const park = join(
    root,
    '.wt-dh-final/services/ai/local-brain/global-operations-brain-types.ts',
  );
  if (existsSync(park)) {
    return {
      present: true,
      pathChecked: park,
      note: 'Global Operations Brain park PRESENT (soft-wire). Findings returnable when park lands in services/ai.',
    };
  }
  return {
    present: false,
    pathChecked: primary,
    note: 'Global Operations Brain absent — WAITING_DATA (not FAIL). Findings returnable when module lands.',
  };
}

export function softWireHopState(present: boolean): 'PASS' | 'WAITING_DATA' {
  return present ? 'PASS' : 'WAITING_DATA';
}

export function truthLadderIndex(state: TruthLadderState): number {
  return TRUTH_LADDER.indexOf(state);
}

/**
 * Allowed next ladder step only (from → to+1). Same-state allowed.
 * Never DOCUMENTED→VERIFIED or any skip.
 */
export function canAdvanceTruthLadder(
  from: HardwareTruthState,
  to: HardwareTruthState,
): boolean {
  if (HC3_LOCKS.TRUTH_LADDER_SKIP_ALLOWED) return false;
  if (from === to) return true;

  const fromIdx = TRUTH_LADDER.indexOf(from as TruthLadderState);
  const toIdx = TRUTH_LADDER.indexOf(to as TruthLadderState);
  if (fromIdx < 0 || toIdx < 0) return false;

  // Explicit ban: DOCUMENTED → VERIFIED
  if (from === 'DOCUMENTED' && to === 'VERIFIED') {
    return HC3_LOCKS.DOCUMENTED_TO_VERIFIED_JUMP_ALLOWED;
  }

  return toIdx === fromIdx + 1;
}

export function isHumanApprover(actor: Hc3Actor): boolean {
  return actor.kind === 'human_approver' || actor.kind === 'founder';
}

export type TenantScope = {
  orgId: string;
  tenantId: string;
  universeId: string;
};

export function scopesMatch(a: TenantScope, b: TenantScope): boolean {
  return (
    a.orgId === b.orgId &&
    a.tenantId === b.tenantId &&
    a.universeId === b.universeId
  );
}

/**
 * Environment honesty for AMD GPU — no fabrications.
 * Without fresh local evidence, AMD GPU stays NOT_TESTED / verification NO.
 */
/**
 * Probe whether this environment has actual AMD GPU evidence.
 * Defaults to false — never invent /dev/kfd or ROCm presence.
 */
export function probeAmdGpuEnvironmentEvidence(): boolean {
  // Honest default for cloud/agent VMs: no AMD GPU verification evidence.
  // Callers may only override via explicit evidence payload, never by silence.
  return false;
}

export function amdGpuVerificationStatus(input?: {
  /** Must be true only when real node evidence exists (not fabricated). */
  freshEvidencePresent?: boolean;
  boundedInferenceSucceeded?: boolean;
  /** Explicit override after real probe — defaults to environment probe (false). */
  environmentEvidence?: boolean;
}): {
  state: HardwareTruthState;
  verified: false | true;
  claimAllowed: boolean;
  note: string;
} {
  if (HC3_LOCKS.FABRICATE_AMD_GPU_VERIFIED) {
    return {
      state: 'NOT_TESTED',
      verified: false,
      claimAllowed: false,
      note: 'Lock FABRICATE_AMD_GPU_VERIFIED must remain false.',
    };
  }
  const envEvidence =
    input?.environmentEvidence ?? probeAmdGpuEnvironmentEvidence();
  if (
    envEvidence &&
    input?.freshEvidencePresent &&
    input?.boundedInferenceSucceeded
  ) {
    return {
      state: 'VERIFIED',
      verified: true,
      claimAllowed: true,
      note: 'AMD GPU VERIFIED only with fresh bounded-inference evidence on a real node.',
    };
  }
  return {
    state: 'NOT_TESTED',
    verified: false,
    claimAllowed: false,
    note: 'AMD GPU verification NO / NOT_TESTED — no fresh evidence in this environment.',
  };
}
