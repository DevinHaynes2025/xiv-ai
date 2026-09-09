/**
 * 62L-ES-HC4 / GitHub #166 — Core Compute / Agent Infrastructure
 * (AMD Software Acceleration Layer + CPU/GPU/NPU routing + message bus +
 * task graph + Home Base receipts).
 *
 * Canonical ownership: **Global Operations Brain** (shared core: agents,
 * Home Base, CPU/GPU/NPU, hybrid cloud, orchestration, neural pathways,
 * security, compute graph).
 *
 * Enterprise OS may *reference / depend on* #166 — MUST NOT copy into a
 * second enterprise-only brain. Engineering civilization / mobile-product
 * are not this story’s primary home.
 *
 * Soft-wire when PRESENT (existsSync): HC1 Hybrid Compute Home Base, HC2
 * Chip Bottleneck Analyzer, HC3/`services/ai/compute-graph`, Global Ops Brain.
 * Presence ≠ VERIFIED. Absent → WAITING_DATA (not FAIL).
 *
 * Honesty: DOCUMENTED ≠ IMPLEMENTED ≠ VERIFIED ≠ PRODUCTION AUTHORIZED.
 * Truth ladder (no skip): DOCUMENTED → DETECTED → SUPPORTED → VERIFIED.
 * L4_AUTONOMY_ENABLED=false. Acceleration ≠ silicon modification.
 * AMD GPU/NPU remain NOT_TESTED / NO for VERIFIED without real evidence.
 * tip-land=NO. No PR. No auto cloud purchase. No cross-tenant pooling.
 *
 * Next (docs only): Enterprise OS consumer of #166 (depends-on only) —
 * or founder queue after AMD acceleration.
 */

import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

export const HONESTY_BANNER =
  'DOCUMENTED ≠ IMPLEMENTED ≠ VERIFIED ≠ PRODUCTION AUTHORIZED' as const;

export const GITHUB_SOT_ISSUE = 166 as const;
export const GITHUB_SOT_LABEL = '62L-ES-HC4' as const;
export const GITHUB_SOT_FAMILY = '62L-ES-HC' as const;
export const GITHUB_SOT_TRACK =
  'Global Operations Brain → #166 Core Compute/Agent Infrastructure (HC4 AMD Software Acceleration Layer)' as const;
export const GITHUB_SOT_TITLE =
  '62L-ES-HC4 AMD Software Acceleration Layer + #166 Core Compute/Agent Infrastructure — scheduling/batching/caching/quantization/model-selection/fallback over verified hardware only; CPU/GPU/NPU truth ladder; message bus; task graph; Home Base receipts; L4=false' as const;

export const CANONICAL_BRAIN_OWNER = 'Global Operations Brain' as const;

export const ENTERPRISE_OS_DEPENDS_ON_NOTE =
  'Enterprise OS → Depends on #166 (enterprise-specific usage only). MUST NOT build a parallel AMD / enterprise / mobile / government brain. Reference/dependency lock only.' as const;

export const PRODUCTIZATION_ES_COLLISION_NOTE =
  'Distinct from productization 62L-ES ES4 Prototype Scope. HC4 uses core-compute / phase62leshc4 / test:62leshc4 and must not overwrite test:62les4.' as const;

export const GITHUB_SOT_ACCESS_NOTE =
  'gh issue view 166 unresolved in this agent environment (403/404); founder brief + #166 retained as SoT. Prior family: #164 HC1/HC2, #165 HC3.' as const;

export const GITLAB_MIRROR_NOTE =
  'GitLab mirror: MCP needsAuth / not resolved — no issue number invented.' as const;

export const HC4_DB_CANDIDATES_STATUS = 'NOT_APPLIED' as const;

export const NEXT_PHASE_TITLE =
  'Enterprise OS consumer of #166 (depends-on / reference only — no parallel brain) — or founder queue item after AMD Software Acceleration Layer.' as const;

/** Ordered advancement ladder — never skip. */
export const TRUTH_LADDER = [
  'DOCUMENTED',
  'DETECTED',
  'SUPPORTED',
  'VERIFIED',
] as const;

export type TruthLadderState = (typeof TRUTH_LADDER)[number];

export const HONESTY_STATES = [
  'NOT_TESTED',
  'DEGRADED',
  'WAITING_NODE',
  'WAITING_DATA',
  'UNAVAILABLE',
  'STALE',
  'REVOKED',
  'REVALIDATION_REQUIRED',
  'FALLBACK_ONLY',
] as const;

export type HonestyState = (typeof HONESTY_STATES)[number];

export type HardwareTruthState = TruthLadderState | HonestyState;

export const ACCELERATOR_CLASSES = ['CPU', 'GPU', 'NPU'] as const;
export type AcceleratorClass = (typeof ACCELERATOR_CLASSES)[number];

export const CHIP_VENDORS = [
  'AMD',
  'NVIDIA',
  'INTEL',
  'ARM',
  'APPLE',
  'QUALCOMM',
  'OTHER',
] as const;
export type ChipVendor = (typeof CHIP_VENDORS)[number];

/** Software acceleration techniques (never silicon/firmware). */
export const ACCELERATION_TECHNIQUES = [
  'scheduling',
  'batching',
  'caching',
  'quantization',
  'model_selection',
  'fallback',
] as const;
export type AccelerationTechnique = (typeof ACCELERATION_TECHNIQUES)[number];

export const CORE_COMPUTE_CYCLE = [
  'honesty_locks',
  'canonical_brain_ownership',
  'enterprise_os_depends_only',
  'amd_acceleration_bootstrap',
  'truth_ladder_encoded',
  'cpu_gpu_npu_router',
  'deny_truth_ladder_skip',
  'unverified_amd_not_preferred_verified',
  'message_bus_orchestration',
  'task_graph_budgets_scopes_return',
  'home_base_receipt_required',
  'tenant_universe_isolation',
  'fallback_neq_accelerator_verified',
  'amd_gpu_npu_not_falsely_verified',
  'l4_autonomy_false',
  'no_silicon_modify',
  'no_auto_cloud_purchase',
  'no_cross_tenant_pooling',
  'hc1_soft_wire',
  'hc2_soft_wire',
  'hc3_compute_graph_soft_wire',
  'global_operations_brain_soft_wire',
  'db_candidates_not_applied',
  'evidence',
] as const;

export type Hc4Hop = (typeof CORE_COMPUTE_CYCLE)[number];

export type Hc4EvidenceState =
  | 'PASS'
  | 'FAIL'
  | 'DENIED'
  | 'WAITING_DATA'
  | 'NOT_TESTED'
  | 'NOT_APPLIED'
  | HardwareTruthState;

export type Hc4HopRecord = {
  hop: Hc4Hop;
  state: Hc4EvidenceState;
  summary: string;
  at: string;
};

export type Hc4ActorKind =
  | 'acceleration_layer'
  | 'router'
  | 'message_bus'
  | 'task_graph'
  | 'home_base'
  | 'proposal'
  | 'human_approver'
  | 'founder'
  | 'guardian'
  | 'operations_brain'
  | 'enterprise_os_consumer';

export type Hc4Actor = {
  kind: Hc4ActorKind;
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

export type Hc4SoftWireSnapshot = {
  hc1HybridComputeHomeBase: SoftWirePresence;
  hc2ChipBottleneckAnalyzer: SoftWirePresence;
  hc3ComputeGraph: SoftWirePresence;
  globalOperationsBrain: SoftWirePresence;
  hc1Report: SoftWirePresence;
  hc2Report: SoftWirePresence;
  hc3Report: SoftWirePresence;
};

export const HC4_LOCKS = Object.freeze({
  L4_AUTONOMY_ENABLED: false as const,
  TIP_LAND: false as const,
  PRODUCTION_AUTHORIZATION: false as const,
  PRODUCTION_WRITE: false as const,
  DB_CANDIDATES_APPLIED: false as const,
  MANAGE_PULL_REQUEST: false as const,
  FULL_PRODUCTION_ACCELERATION_SHIPPED: false as const,

  // Ladder honesty
  TRUTH_LADDER_SKIP_ALLOWED: false as const,
  DOCUMENTED_TO_VERIFIED_JUMP_ALLOWED: false as const,
  DETECTED_EQ_VERIFIED: false as const,
  SUPPORTED_EQ_VERIFIED: false as const,
  NOT_TESTED_EQ_VERIFIED: false as const,
  PRESENCE_EQ_VERIFIED: false as const,
  FALLBACK_EQ_ACCELERATOR_VERIFIED: false as const,
  UNVERIFIED_AMD_PREFERRED_AS_VERIFIED: false as const,
  FABRICATE_AMD_GPU_VERIFIED: false as const,
  FABRICATE_AMD_NPU_VERIFIED: false as const,

  // Silicon / privilege
  MAY_PHYSICALLY_MODIFY_SILICON: false as const,
  MAY_MODIFY_BIOS_FIRMWARE: false as const,
  MAY_OVERCLOCK: false as const,
  MAY_ESCALATE_DRIVER_PRIVILEGE: false as const,
  ACCELERATION_EQ_SILICON_MODIFY: false as const,

  // Cloud / pooling
  AUTO_CLOUD_PURCHASE: false as const,
  CROSS_TENANT_POOLING: false as const,

  // Isolation / autonomy
  BYPASS_GUARDIAN_RLS_TENANT_UNIVERSE: false as const,
  GUARDIAN_RLS_TENANT_UNIVERSE_ISOLATION_UNCHANGED: true as const,
  AGENT_AUTO_AUTHORITY: false as const,
  RECOMMEND_EQ_ACT: false as const,

  // Brain taxonomy — Global Ops Brain is canonical; no parallel enterprise brain
  GLOBAL_OPERATIONS_BRAIN_IS_CANONICAL_HOME: true as const,
  ENTERPRISE_OS_MAY_BUILD_PARALLEL_BRAIN: false as const,
  ENTERPRISE_OS_DEPENDS_ON_166_ONLY: true as const,
  ALLOW_FRAGMENT_AMD_ENTERPRISE_MOBILE_GOVERNMENT_BRAINS: false as const,

  DOCUMENTED_EQ_IMPLEMENTED: false as const,
  IMPLEMENTED_EQ_VERIFIED: false as const,
  VERIFIED_EQ_PRODUCTION_AUTHORIZED: false as const,

  // Receipts
  BRANCH_EXECUTION_WITHOUT_HOME_BASE_RECEIPT: false as const,

  HUMAN_APPROVAL_REQUIRED_BEFORE_CONSEQUENTIAL_ACTIONS: true as const,
});

export const HC4_MAY = Object.freeze([
  'schedule_batch_cache_quantize_select_fallback_on_verified_hardware',
  'route_cpu_gpu_npu_with_truth_ladder',
  'orchestrate_agents_via_message_bus',
  'build_task_graphs_with_budgets_scopes_return_paths',
  'emit_home_base_receipt_per_branch_execution',
  'prefer_amd_optimization_candidates_when_honest',
  'apply_same_honesty_to_nvidia_intel_arm',
  'soft_wire_hc1_hc2_hc3_ops_brain_when_present',
  'isolate_by_tenant_universe_guardian_rls',
  'enterprise_os_reference_depend_on_166',
] as const);

export const HC4_MUST_NOT = Object.freeze([
  'skip_truth_ladder_steps',
  'jump_documented_to_verified',
  'prefer_unverified_amd_gpu_as_verified',
  'claim_amd_gpu_npu_verified_without_evidence',
  'treat_fallback_cpu_as_gpu_npu_verified',
  'physically_modify_silicon_bios_firmware_overclock',
  'auto_purchase_cloud_or_pool_cross_tenant',
  'execute_branch_without_home_base_receipt',
  'build_parallel_enterprise_amd_mobile_government_brain',
  'enable_l4_autonomy',
  'tip_land_or_open_pr',
] as const);

export function assertHc4LocksIntact(): boolean {
  return (
    HC4_LOCKS.L4_AUTONOMY_ENABLED === false &&
    HC4_LOCKS.TRUTH_LADDER_SKIP_ALLOWED === false &&
    HC4_LOCKS.DOCUMENTED_TO_VERIFIED_JUMP_ALLOWED === false &&
    HC4_LOCKS.DETECTED_EQ_VERIFIED === false &&
    HC4_LOCKS.SUPPORTED_EQ_VERIFIED === false &&
    HC4_LOCKS.NOT_TESTED_EQ_VERIFIED === false &&
    HC4_LOCKS.PRESENCE_EQ_VERIFIED === false &&
    HC4_LOCKS.FALLBACK_EQ_ACCELERATOR_VERIFIED === false &&
    HC4_LOCKS.UNVERIFIED_AMD_PREFERRED_AS_VERIFIED === false &&
    HC4_LOCKS.FABRICATE_AMD_GPU_VERIFIED === false &&
    HC4_LOCKS.FABRICATE_AMD_NPU_VERIFIED === false &&
    HC4_LOCKS.MAY_PHYSICALLY_MODIFY_SILICON === false &&
    HC4_LOCKS.MAY_MODIFY_BIOS_FIRMWARE === false &&
    HC4_LOCKS.MAY_OVERCLOCK === false &&
    HC4_LOCKS.MAY_ESCALATE_DRIVER_PRIVILEGE === false &&
    HC4_LOCKS.ACCELERATION_EQ_SILICON_MODIFY === false &&
    HC4_LOCKS.AUTO_CLOUD_PURCHASE === false &&
    HC4_LOCKS.CROSS_TENANT_POOLING === false &&
    HC4_LOCKS.BYPASS_GUARDIAN_RLS_TENANT_UNIVERSE === false &&
    HC4_LOCKS.GUARDIAN_RLS_TENANT_UNIVERSE_ISOLATION_UNCHANGED === true &&
    HC4_LOCKS.GLOBAL_OPERATIONS_BRAIN_IS_CANONICAL_HOME === true &&
    HC4_LOCKS.ENTERPRISE_OS_MAY_BUILD_PARALLEL_BRAIN === false &&
    HC4_LOCKS.ENTERPRISE_OS_DEPENDS_ON_166_ONLY === true &&
    HC4_LOCKS.ALLOW_FRAGMENT_AMD_ENTERPRISE_MOBILE_GOVERNMENT_BRAINS ===
      false &&
    HC4_LOCKS.BRANCH_EXECUTION_WITHOUT_HOME_BASE_RECEIPT === false &&
    HC4_LOCKS.AGENT_AUTO_AUTHORITY === false &&
    HC4_LOCKS.RECOMMEND_EQ_ACT === false &&
    HC4_LOCKS.TIP_LAND === false &&
    HC4_LOCKS.PRODUCTION_AUTHORIZATION === false &&
    HC4_LOCKS.DB_CANDIDATES_APPLIED === false &&
    HC4_LOCKS.MANAGE_PULL_REQUEST === false &&
    HC4_LOCKS.FULL_PRODUCTION_ACCELERATION_SHIPPED === false &&
    HC4_LOCKS.HUMAN_APPROVAL_REQUIRED_BEFORE_CONSEQUENTIAL_ACTIONS === true
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
export function hc4SoftWireSnapshot(repoRoot?: string): Hc4SoftWireSnapshot {
  const here = dirname(fileURLToPath(import.meta.url));
  const root = repoRoot ?? join(here, '../../..');
  const localBrain = join(here, '../local-brain');
  const computeGraph = join(here, '../compute-graph');

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
    hc3ComputeGraph: softWireFile(
      computeGraph,
      'types.ts',
      'HC3 compute-graph PRESENT (soft-wire). Presence≠VERIFIED.',
      'HC3 compute-graph absent — soft-wire WAITING_DATA.',
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
    hc3Report: softWireAbsolute(
      join(
        root,
        'docs/operations/62L_ES_HC3_CROSS_VENDOR_CHIP_PATH_GRAPH_REPORT.md',
      ),
      'HC3 report PRESENT.',
      'HC3 report absent — soft-wire WAITING_DATA.',
    ),
  };
}

/** Prefer primary path; park path still counts as soft-wire presence. */
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
      note: 'Global Operations Brain PRESENT (soft-wire). #166 findings returnable to Operations Brain.',
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
  if (HC4_LOCKS.TRUTH_LADDER_SKIP_ALLOWED) return false;
  if (from === to) return true;

  const fromIdx = TRUTH_LADDER.indexOf(from as TruthLadderState);
  const toIdx = TRUTH_LADDER.indexOf(to as TruthLadderState);
  if (fromIdx < 0 || toIdx < 0) return false;

  if (from === 'DOCUMENTED' && to === 'VERIFIED') {
    return HC4_LOCKS.DOCUMENTED_TO_VERIFIED_JUMP_ALLOWED;
  }

  return toIdx === fromIdx + 1;
}

export function isHumanApprover(actor: Hc4Actor): boolean {
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
 * Deny attempt to register a parallel enterprise/AMD/mobile/government brain.
 * Global Operations Brain remains the sole canonical home for #166.
 */
export function attemptParallelEnterpriseBrain(input: {
  proposedBrainName: string;
  claimedOwner: string;
}): {
  denied: true;
  state: 'DENIED';
  reason: string;
  canonicalOwner: typeof CANONICAL_BRAIN_OWNER;
  enterpriseOsDependsOn166Only: true;
} {
  void input;
  return {
    denied: true,
    state: 'DENIED',
    reason:
      'ENTERPRISE_OS_MAY_BUILD_PARALLEL_BRAIN=false; Global Operations Brain is canonical home for #166. Enterprise OS depends-on only.',
    canonicalOwner: CANONICAL_BRAIN_OWNER,
    enterpriseOsDependsOn166Only: true,
  };
}

export function probeAmdGpuEnvironmentEvidence(): boolean {
  // Honest default for cloud/agent VMs: no AMD GPU verification evidence.
  return false;
}

export function probeAmdNpuEnvironmentEvidence(): boolean {
  return false;
}

export function amdAcceleratorVerificationStatus(input?: {
  class: 'GPU' | 'NPU';
  freshEvidencePresent?: boolean;
  boundedInferenceSucceeded?: boolean;
  environmentEvidence?: boolean;
}): {
  state: HardwareTruthState;
  verified: false | true;
  claimAllowed: boolean;
  note: string;
} {
  const cls = input?.class ?? 'GPU';
  if (
    (cls === 'GPU' && HC4_LOCKS.FABRICATE_AMD_GPU_VERIFIED) ||
    (cls === 'NPU' && HC4_LOCKS.FABRICATE_AMD_NPU_VERIFIED)
  ) {
    return {
      state: 'NOT_TESTED',
      verified: false,
      claimAllowed: false,
      note: `Lock FABRICATE_AMD_${cls}_VERIFIED must remain false.`,
    };
  }
  const envEvidence =
    input?.environmentEvidence ??
    (cls === 'GPU'
      ? probeAmdGpuEnvironmentEvidence()
      : probeAmdNpuEnvironmentEvidence());
  if (
    envEvidence &&
    input?.freshEvidencePresent &&
    input?.boundedInferenceSucceeded
  ) {
    return {
      state: 'VERIFIED',
      verified: true,
      claimAllowed: true,
      note: `AMD ${cls} VERIFIED only with fresh bounded-inference evidence on a real node.`,
    };
  }
  return {
    state: 'NOT_TESTED',
    verified: false,
    claimAllowed: false,
    note: `AMD ${cls} verification NO / NOT_TESTED — no fresh evidence in this environment.`,
  };
}
