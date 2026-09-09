/**
 * 62L-EQ12 — Cross-Architecture Benchmark Matrix (park-and-implement).
 *
 * Same workload tested across verified architectures so the Virtual Chip brain
 * can compare ARM, x86, GPU, NPU, edge, and authorized cloud paths using
 * evidence instead of assumptions.
 *
 * Core comparison:
 * Same workload + same model + same input → ARM CPU / x86 CPU / AMD GPU/NPU /
 * NVIDIA GPU / Intel GPU/NPU / edge-cloud candidate → normalized comparison
 *
 * Comparable only when model+precision+batch+input+runtime class+test method
 * match closely enough; otherwise NOT_COMPARABLE.
 *
 * Fastest ≠ always best (NPU/GPU/CPU/edge/cloud win for different constraints).
 * No benchmark is PASS until actually run. Vendor numbers ≠ XIV-measured.
 *
 * Soft-wire when PRESENT: EQ11, EQ8, EQ6, EP14, EP12, EM (#157). Presence ≠ VERIFIED.
 *
 * SoT: GitHub #161 / 62L-EQ family. GitLab mirror: needsAuth; no number invented.
 *
 * Honesty: DOCUMENTED ≠ IMPLEMENTED ≠ VERIFIED ≠ PRODUCTION AUTHORIZED.
 * L4_AUTONOMY_ENABLED=false. Guardian/RLS/tenant/Universe unchanged.
 * DB candidates NOT_APPLIED. tip-land=NO.
 * Next (report only): EQ13 — Architecture Return Receipt.
 */

import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

export const HONESTY_BANNER =
  'DOCUMENTED ≠ IMPLEMENTED ≠ VERIFIED ≠ PRODUCTION AUTHORIZED' as const;

export const GITHUB_SOT_ISSUE = 161 as const;
export const GITHUB_SOT_LABEL = '62L-EQ12' as const;
export const GITHUB_SOT_FAMILY = '62L-EQ' as const;
export const GITHUB_SOT_TITLE =
  '62L-EQ12 Cross-Architecture Benchmark Matrix — same workload across verified paths; NOT_COMPARABLE unless matched; fastest≠always best; vendor≠XIV-measured' as const;

export const GITLAB_MIRROR_NOTE =
  'GitLab mirror: search attempted; MCP needsAuth / not resolved in this environment — no issue number invented.' as const;

export const EQ12_DB_CANDIDATES_STATUS = 'NOT_APPLIED' as const;

export const NEXT_PHASE_TITLE =
  'EQ13 — Architecture Return Receipt — each benchmark/execution returns proof of the actual architecture, runtime, fallback path, and measured outcome to XIV Home Base.' as const;

/**
 * Benchmark row required fields.
 */
export const BENCHMARK_ROW_FIELDS = [
  'benchmarkId',
  'workloadId',
  'modelVersion',
  'inputProfile',
  'architecture',
  'device',
  'runtimeProvider',
  'precision',
  'batchSize',
  'latency',
  'throughput',
  'memoryUsage',
  'energyProxy',
  'costProxy',
  'reliability',
  'fallbackUsed',
  'environmentVersionFingerprint',
  'evidenceState',
  'timestamp',
] as const;

export type BenchmarkRowField = (typeof BENCHMARK_ROW_FIELDS)[number];

/**
 * Comparison path candidates.
 */
export const COMPARISON_PATH_CANDIDATES = [
  'arm_cpu',
  'x86_cpu',
  'amd_gpu_npu',
  'nvidia_gpu',
  'intel_gpu_npu',
  'edge_cloud_candidate',
] as const;

export type ComparisonPathCandidate =
  (typeof COMPARISON_PATH_CANDIDATES)[number];

/**
 * Comparability keys that must match closely.
 */
export const COMPARABILITY_KEYS = [
  'model',
  'precision',
  'batch',
  'input',
  'runtime_class',
  'test_method',
] as const;

/**
 * Required result states.
 */
export const BENCHMARK_RESULT_STATES = [
  'BASELINE',
  'BEST_LATENCY',
  'BEST_THROUGHPUT',
  'BEST_COST',
  'BEST_ENERGY_PROXY',
  'BEST_LOCALITY',
  'REGRESSED',
  'STALE',
  'NOT_COMPARABLE',
] as const;

export type BenchmarkResultState = (typeof BENCHMARK_RESULT_STATES)[number];

/**
 * Evidence / run states for matrix rows.
 */
export const BENCHMARK_EVIDENCE_STATES = [
  'DOCUMENTED',
  'PLANNED',
  'RUNNING',
  'MEASURED',
  'PASS',
  'FAIL',
  'VENDOR_PUBLISHED_SEPARATE',
  'NOT_RUN',
  'STALE',
] as const;

export type BenchmarkEvidenceState =
  (typeof BENCHMARK_EVIDENCE_STATES)[number];

/**
 * Core comparison flow.
 */
export const BENCHMARK_MATRIX_CORE_FLOW = [
  'same_workload_model_input',
  'arm_cpu',
  'x86_cpu',
  'amd_gpu_npu',
  'nvidia_gpu',
  'intel_gpu_npu',
  'edge_cloud_candidate',
  'normalized_comparison',
] as const;

/**
 * Scheduler feedback pathway.
 */
export const SCHEDULER_FEEDBACK_PATH = [
  'workload',
  'architecture',
  'device',
  'measured_result',
] as const;

/**
 * Route-win examples (fastest ≠ always best).
 */
export const ROUTE_WIN_EXAMPLES = Object.freeze({
  npu: 'low_power_local_inference',
  gpu: 'throughput',
  cpu: 'startup_time_or_small_jobs',
  edge: 'privacy_locality',
  cloud: 'scale_when_authorized_and_economically_justified',
  fastestIsAlwaysBest: false as const,
});

/**
 * Truth / governance denies.
 */
export const EQ12_TRUTH_DENIES = [
  'pass_without_actual_run',
  'equate_vendor_numbers_with_xiv_measured',
  'overclocking',
  'firmware_changes',
  'privilege_escalation',
  'automatic_cloud_purchasing',
  'cross_tenant_data_movement',
  'assume_fastest_always_best',
] as const;

export const CROSS_ARCHITECTURE_BENCHMARK_MATRIX_CYCLE = [
  'honesty_locks',
  'cross_architecture_benchmark_matrix_bootstrap',
  // A — Structure
  'benchmark_row_fields_encoded',
  'comparison_paths_encoded',
  'comparability_keys_encoded',
  'result_states_encoded',
  'scheduler_feedback_path_encoded',
  // B — Truth
  'comparable_only_when_keys_match',
  'fastest_neq_always_best',
  'vendor_numbers_neq_xiv_measured',
  'pass_only_when_actually_run',
  // C — Denies
  'deny_pass_without_actual_run',
  'deny_equate_vendor_with_xiv_measured',
  'deny_assume_fastest_always_best',
  'deny_overclocking',
  'deny_firmware_changes',
  'deny_privilege_escalation',
  'deny_automatic_cloud_purchasing',
  'deny_cross_tenant_data_movement',
  // D — Autonomy
  'guardian_rls_tenant_universe_isolation',
  'recommend_neq_act',
  'l4_autonomy_false',
  // E — Soft-wires
  'eq11_soft_wire',
  'eq8_soft_wire',
  'eq6_soft_wire',
  'ep14_soft_wire',
  'ep12_soft_wire',
  'em157_soft_wire',
  'db_candidates_not_applied',
  'evidence',
] as const;

export type Eq12Hop = (typeof CROSS_ARCHITECTURE_BENCHMARK_MATRIX_CYCLE)[number];

export type Eq12EvidenceState =
  | 'PASS'
  | 'FAIL'
  | 'UNAVAILABLE'
  | 'DENIED'
  | 'REJECTED'
  | 'CANDIDATE'
  | 'DOCUMENTED'
  | 'IMPLEMENTED'
  | 'AVAILABLE'
  | 'VERIFIED'
  | 'PRODUCTION_AUTHORIZED'
  | 'RECOMMENDATION_ONLY'
  | 'PLAN_ONLY'
  | 'BOUNDED'
  | 'NOT_APPLIED'
  | 'NOT_TESTED'
  | 'NOT_AVAILABLE'
  | 'NOT_VERIFIED'
  | 'WAITING_DATA'
  | 'ADVISORY_ONLY'
  | 'REGISTERED'
  | 'HUMAN_APPROVAL_REQUIRED'
  | 'UNVERIFIED'
  | 'PARTIAL'
  | 'DEGRADED'
  | 'STALE'
  | 'UNKNOWN'
  | 'MEASURED'
  | 'NOT_COMPARABLE'
  | 'BASELINE';

export type Eq12HopRecord = {
  hop: Eq12Hop;
  state: Eq12EvidenceState;
  summary: string;
  at: string;
};

export type Eq12ActorKind =
  | 'benchmark_matrix_runner'
  | 'scheduler_feedback'
  | 'proposal'
  | 'human_approver'
  | 'founder'
  | 'guardian'
  | 'home_base'
  | 'tenant_admin';

export type Eq12Actor = {
  kind: Eq12ActorKind;
  id: string;
  orgId: string;
  tenantId: string;
  universeId: string;
  permissions: readonly string[];
};

export const EQ12_LOCKS = Object.freeze({
  L4_AUTONOMY_ENABLED: false as const,
  TIP_LAND: false as const,
  PRODUCTION_AUTHORIZATION: false as const,
  PRODUCTION_WRITE: false as const,
  DB_CANDIDATES_APPLIED: false as const,
  FULL_PRODUCTION_BENCHMARK_MATRIX_SHIPPED: false as const,
  MANAGE_PULL_REQUEST: false as const,

  // Truth
  PASS_WITHOUT_ACTUAL_RUN: false as const,
  VENDOR_NUMBERS_EQ_XIV_MEASURED: false as const,
  FASTEST_ALWAYS_BEST: false as const,
  FORCE_COMPARE_WHEN_NOT_COMPARABLE: false as const,

  // Governance
  OVERCLOCKING: false as const,
  FIRMWARE_CHANGES: false as const,
  PRIVILEGE_ESCALATION: false as const,
  AUTOMATIC_CLOUD_PURCHASING: false as const,
  CROSS_TENANT_DATA_MOVEMENT: false as const,

  // Autonomy
  AGENT_AUTO_AUTHORITY: false as const,
  RECOMMEND_EQ_ACT: false as const,
  RECOMMEND_EQ_AUTHORIZE: false as const,
  HIDDEN_CHAIN_OF_THOUGHT_IN_EQ12: false as const,

  // Isolation
  BYPASS_GUARDIAN_RLS_TENANT_UNIVERSE: false as const,
  GUARDIAN_RLS_TENANT_UNIVERSE_ISOLATION_UNCHANGED: true as const,
  HUMAN_APPROVAL_BOUNDARIES_UNCHANGED: true as const,

  // Honesty ladder
  DOCUMENTED_EQ_IMPLEMENTED: false as const,
  IMPLEMENTED_EQ_VERIFIED: false as const,
  VERIFIED_EQ_PRODUCTION_AUTHORIZED: false as const,

  HUMAN_APPROVAL_REQUIRED_BEFORE_CONSEQUENTIAL_ACTIONS: true as const,
});

export const EQ12_AGENT_BOUNDS = Object.freeze({
  mayEmitBenchmarkRows: true as const,
  mayClassifyComparableVsNotComparable: true as const,
  mayTagBestLatencyThroughputCostEnergyLocality: true as const,
  mayFeedSchedulerWithMeasuredResults: true as const,
  mayKeepVendorNumbersSeparate: true as const,
  mayReturnEvidenceToHomeBase: true as const,
  automaticAuthority: false as const,
  mayPassWithoutActualRun: false as const,
  mayEquateVendorWithXivMeasured: false as const,
  mayAssumeFastestAlwaysBest: false as const,
  mayForceCompareWhenNotComparable: false as const,
  mayOverclock: false as const,
  mayChangeFirmware: false as const,
  mayEscalatePrivilege: false as const,
  mayAutomaticCloudPurchase: false as const,
  mayMoveCrossTenantData: false as const,
  mayIncludeHiddenChainOfThought: false as const,
  mayRecommendOnly: true as const,
});

export const EQ12_MAY = Object.freeze([
  'run_same_workload_across_verified_architecture_paths',
  'require_comparability_keys_before_normalized_comparison',
  'tag_best_latency_throughput_cost_energy_locality_without_fastest_always_best',
  'feed_measured_results_into_hardware_neutral_scheduler',
  'keep_vendor_published_numbers_separate_from_xiv_measured',
  'mark_pass_only_after_actual_run',
] as const);

export const EQ12_MUST_NOT = Object.freeze([
  'pass_benchmark_without_actually_running_it',
  'equate_vendor_published_numbers_with_xiv_measured_results',
  'assume_fastest_device_is_always_best_route',
  'force_compare_when_not_comparable',
  'overclock_change_firmware_or_escalate_privilege',
  'automatic_cloud_purchase_or_cross_tenant_data_movement',
  'store_hidden_chain_of_thought',
  'bypass_guardian_rls_tenant_universe',
  'treat_recommend_as_act',
  'grant_agents_automatic_authority',
] as const);

export type SoftWirePresence = {
  present: boolean;
  pathChecked: string;
  note: string;
};

export type Eq12SoftWireSnapshot = {
  eq11DeviceNeutralWorkloadGenome: SoftWirePresence;
  eq11Report: SoftWirePresence;
  eq8ArmServerCloudRuntime: SoftWirePresence;
  eq8Report: SoftWirePresence;
  eq6ArchitectureCapabilityGraph: SoftWirePresence;
  eq6Report: SoftWirePresence;
  ep14AdaptiveBenchmarkLedger: SoftWirePresence;
  ep14Report: SoftWirePresence;
  ep12HardwareNeutralScheduler: SoftWirePresence;
  ep12Report: SoftWirePresence;
  em157HomeBase: SoftWirePresence;
};

export function assertEq12LocksIntact(): boolean {
  return (
    EQ12_LOCKS.L4_AUTONOMY_ENABLED === false &&
    EQ12_LOCKS.PASS_WITHOUT_ACTUAL_RUN === false &&
    EQ12_LOCKS.VENDOR_NUMBERS_EQ_XIV_MEASURED === false &&
    EQ12_LOCKS.FASTEST_ALWAYS_BEST === false &&
    EQ12_LOCKS.FORCE_COMPARE_WHEN_NOT_COMPARABLE === false &&
    EQ12_LOCKS.OVERCLOCKING === false &&
    EQ12_LOCKS.FIRMWARE_CHANGES === false &&
    EQ12_LOCKS.PRIVILEGE_ESCALATION === false &&
    EQ12_LOCKS.AUTOMATIC_CLOUD_PURCHASING === false &&
    EQ12_LOCKS.CROSS_TENANT_DATA_MOVEMENT === false &&
    EQ12_LOCKS.AGENT_AUTO_AUTHORITY === false &&
    EQ12_LOCKS.RECOMMEND_EQ_ACT === false &&
    EQ12_LOCKS.RECOMMEND_EQ_AUTHORIZE === false &&
    EQ12_LOCKS.HIDDEN_CHAIN_OF_THOUGHT_IN_EQ12 === false &&
    EQ12_LOCKS.BYPASS_GUARDIAN_RLS_TENANT_UNIVERSE === false &&
    EQ12_LOCKS.GUARDIAN_RLS_TENANT_UNIVERSE_ISOLATION_UNCHANGED === true &&
    EQ12_LOCKS.HUMAN_APPROVAL_BOUNDARIES_UNCHANGED === true &&
    EQ12_LOCKS.DOCUMENTED_EQ_IMPLEMENTED === false &&
    EQ12_LOCKS.IMPLEMENTED_EQ_VERIFIED === false &&
    EQ12_LOCKS.VERIFIED_EQ_PRODUCTION_AUTHORIZED === false &&
    EQ12_LOCKS.HUMAN_APPROVAL_REQUIRED_BEFORE_CONSEQUENTIAL_ACTIONS === true &&
    EQ12_LOCKS.TIP_LAND === false &&
    EQ12_LOCKS.PRODUCTION_AUTHORIZATION === false &&
    EQ12_LOCKS.DB_CANDIDATES_APPLIED === false &&
    EQ12_LOCKS.FULL_PRODUCTION_BENCHMARK_MATRIX_SHIPPED === false &&
    EQ12_LOCKS.MANAGE_PULL_REQUEST === false &&
    ROUTE_WIN_EXAMPLES.fastestIsAlwaysBest === false &&
    EQ12_AGENT_BOUNDS.automaticAuthority === false &&
    EQ12_AGENT_BOUNDS.mayPassWithoutActualRun === false &&
    EQ12_AGENT_BOUNDS.mayEquateVendorWithXivMeasured === false &&
    EQ12_AGENT_BOUNDS.mayAssumeFastestAlwaysBest === false &&
    EQ12_AGENT_BOUNDS.mayForceCompareWhenNotComparable === false &&
    EQ12_AGENT_BOUNDS.mayOverclock === false &&
    EQ12_AGENT_BOUNDS.mayChangeFirmware === false &&
    EQ12_AGENT_BOUNDS.mayEscalatePrivilege === false &&
    EQ12_AGENT_BOUNDS.mayAutomaticCloudPurchase === false &&
    EQ12_AGENT_BOUNDS.mayMoveCrossTenantData === false &&
    EQ12_AGENT_BOUNDS.mayIncludeHiddenChainOfThought === false
  );
}

function softWireFile(
  relFromLocalBrain: string,
  notePresent: string,
  noteAbsent: string,
): SoftWirePresence {
  const pathChecked = join(
    dirname(fileURLToPath(import.meta.url)),
    relFromLocalBrain,
  );
  const present = existsSync(pathChecked);
  return {
    present,
    pathChecked,
    note: present ? notePresent : noteAbsent,
  };
}

function softWireRepoRelative(
  repoRoot: string,
  rel: string,
  notePresent: string,
  noteAbsent: string,
): SoftWirePresence {
  const pathChecked = join(repoRoot, rel);
  const present = existsSync(pathChecked);
  return {
    present,
    pathChecked,
    note: present ? notePresent : noteAbsent,
  };
}

export function eq12SoftWireSnapshot(repoRoot?: string): Eq12SoftWireSnapshot {
  const root =
    repoRoot ?? join(dirname(fileURLToPath(import.meta.url)), '../../..');

  return {
    eq11DeviceNeutralWorkloadGenome: softWireFile(
      './device-neutral-workload-genome-types.ts',
      'EQ11 Device-Neutral Workload Genome PRESENT (soft-wire).',
      'EQ11 Device-Neutral Workload Genome absent — soft-wire WAITING_DATA.',
    ),
    eq11Report: softWireRepoRelative(
      root,
      'docs/operations/62L_EQ11_DEVICE_NEUTRAL_WORKLOAD_GENOME_REPORT.md',
      'EQ11 report PRESENT.',
      'EQ11 report absent — soft-wire WAITING_DATA.',
    ),
    eq8ArmServerCloudRuntime: softWireFile(
      './arm-server-cloud-runtime-types.ts',
      'EQ8 ARM Server/Cloud Runtime Research PRESENT (soft-wire).',
      'EQ8 ARM Server/Cloud Runtime Research absent — soft-wire WAITING_DATA.',
    ),
    eq8Report: softWireRepoRelative(
      root,
      'docs/operations/62L_EQ8_ARM_SERVER_CLOUD_RUNTIME_REPORT.md',
      'EQ8 report PRESENT.',
      'EQ8 report absent — soft-wire WAITING_DATA.',
    ),
    eq6ArchitectureCapabilityGraph: softWireFile(
      './architecture-capability-graph-types.ts',
      'EQ6 Architecture Capability Graph PRESENT (soft-wire).',
      'EQ6 Architecture Capability Graph absent — soft-wire WAITING_DATA.',
    ),
    eq6Report: softWireRepoRelative(
      root,
      'docs/operations/62L_EQ6_ARCHITECTURE_CAPABILITY_GRAPH_REPORT.md',
      'EQ6 report PRESENT.',
      'EQ6 report absent — soft-wire WAITING_DATA.',
    ),
    ep14AdaptiveBenchmarkLedger: softWireFile(
      './adaptive-benchmark-ledger-types.ts',
      'EP14 Adaptive Benchmark Ledger PRESENT (soft-wire).',
      'EP14 Adaptive Benchmark Ledger absent — soft-wire WAITING_DATA.',
    ),
    ep14Report: softWireRepoRelative(
      root,
      'docs/operations/62L_EP14_ADAPTIVE_BENCHMARK_LEDGER_REPORT.md',
      'EP14 report PRESENT.',
      'EP14 report absent — soft-wire WAITING_DATA.',
    ),
    ep12HardwareNeutralScheduler: softWireFile(
      './hardware-neutral-scheduler-types.ts',
      'EP12 Hardware-Neutral Scheduler PRESENT (soft-wire).',
      'EP12 Hardware-Neutral Scheduler absent — soft-wire WAITING_DATA.',
    ),
    ep12Report: softWireRepoRelative(
      root,
      'docs/operations/62L_EP12_HARDWARE_NEUTRAL_SCHEDULER_REPORT.md',
      'EP12 report PRESENT.',
      'EP12 report absent — soft-wire WAITING_DATA.',
    ),
    em157HomeBase: softWireFile(
      './agent-compute-home-base-types.ts',
      'EM (#157) Agent Compute Home Base PRESENT (soft-wire).',
      'EM (#157) Agent Compute Home Base absent — soft-wire WAITING_DATA.',
    ),
  };
}

export function isHumanApprover(actor: Eq12Actor): boolean {
  return (
    actor.kind === 'human_approver' ||
    actor.kind === 'founder' ||
    actor.kind === 'tenant_admin'
  );
}

export function isEq12Agent(actor: Eq12Actor): boolean {
  const agents: readonly Eq12ActorKind[] = [
    'benchmark_matrix_runner',
    'scheduler_feedback',
    'proposal',
  ];
  return agents.includes(actor.kind);
}

/**
 * Fastest device is not always the best route.
 */
export function fastestImpliesAlwaysBest(): false {
  return false;
}

/**
 * Vendor published numbers are not XIV-measured results.
 */
export function vendorNumbersImpliesXivMeasured(): false {
  return false;
}

/**
 * PASS only after actual run.
 */
export function canMarkPass(input: {
  actuallyRun: boolean;
  measuredMetricsPresent: boolean;
}): boolean {
  return input.actuallyRun && input.measuredMetricsPresent;
}
