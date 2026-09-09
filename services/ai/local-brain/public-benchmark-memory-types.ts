/**
 * 62L-EP5 — Public Benchmark Memory (park-and-implement).
 *
 * Provenance-backed benchmark memory so agents can compare CPUs, GPUs, NPUs,
 * runtimes, models, and workloads without mixing published claims with XIV’s
 * own measured evidence.
 *
 * Critical rule: Published benchmark ≠ XIV verification.
 * VENDOR_PUBLISHED remains distinct from XIV_LOCAL_MEASURED.
 *
 * SoT: GitHub #160 / 62L-EP family (authoritative per founder). GitLab mirror:
 * not resolved in this environment (GitLab MCP needsAuth; no issue number invented).
 *
 * Soft-wire when PRESENT: EP4, EP2, EP1, EM (#157). Presence ≠ VERIFIED.
 *
 * Honesty: DOCUMENTED ≠ IMPLEMENTED ≠ VERIFIED ≠ PRODUCTION AUTHORIZED.
 * L4_AUTONOMY_ENABLED=false.
 * Lawful public/licensed/authorized benchmarks only.
 * No copy of private benchmark DBs / confidential customer results across tenants.
 * No benchmark may justify overclocking, thermal bypass, firmware modification,
 * or unsafe hardware tuning.
 * Stale evidence decays (STALE) instead of remaining permanently trusted.
 * DB candidates NOT_APPLIED. tip-land=NO. No PR from this phase.
 * Next (report only): EP6 — Local Hardware Truth Probe v2.
 */

import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

export const HONESTY_BANNER =
  'DOCUMENTED ≠ IMPLEMENTED ≠ VERIFIED ≠ PRODUCTION AUTHORIZED' as const;

export const GITHUB_SOT_ISSUE = 160 as const;
export const GITHUB_SOT_LABEL = '62L-EP5' as const;
export const GITHUB_SOT_FAMILY = '62L-EP' as const;
export const GITHUB_SOT_TITLE =
  '62L-EP5 Public Benchmark Memory — provenance-backed benchmark memory separating published claims from XIV locally measured evidence (Published ≠ XIV verification)' as const;

export const GITLAB_MIRROR_NOTE =
  'GitLab mirror: search attempted; MCP needsAuth / not resolved in this environment — no issue number invented.' as const;

export const EP5_DB_CANDIDATES_STATUS = 'NOT_APPLIED' as const;

export const NEXT_PHASE_TITLE =
  'EP6 — Local Hardware Truth Probe v2 — connect benchmark memory to read-only ASUS CPU/GPU/NPU detection and create the first machine-specific evidence profile for the local XIV node.' as const;

/**
 * Required evidence classes — Published ≠ XIV verification.
 */
export const BENCHMARK_EVIDENCE_CLASSES = [
  'VENDOR_PUBLISHED',
  'INDEPENDENT_PUBLIC',
  'PEER_REVIEWED',
  'XIV_LOCAL_MEASURED',
  'CUSTOMER_AUTHORIZED_MEASURED',
  'SIMULATED',
  'UNKNOWN',
] as const;

export type BenchmarkEvidenceClass =
  (typeof BENCHMARK_EVIDENCE_CLASSES)[number];

/**
 * Benchmark record fields.
 */
export const BENCHMARK_RECORD_FIELDS = [
  'benchmarkId',
  'vendor',
  'deviceChip',
  'deviceType',
  'architectureGeneration',
  'runtimeProvider',
  'driverRuntimeVersion',
  'modelWorkload',
  'precision',
  'batchSize',
  'datasetInput',
  'latency',
  'throughput',
  'memoryUsage',
  'powerEnergyProxy',
  'benchmarkMethodology',
  'source',
  'sourceDate',
  'rightsLicenseState',
  'environment',
  'reproducibilityNotes',
  'confidence',
  'evidenceClass',
] as const;

export type BenchmarkRecordField = (typeof BENCHMARK_RECORD_FIELDS)[number];

/**
 * Normalization dimensions required for comparable comparisons.
 */
export const BENCHMARK_NORMALIZATION_DIMENSIONS = [
  'exact_hardware',
  'model_version',
  'input_size',
  'precision',
  'runtime',
  'batch_size',
  'thermal_power_conditions',
  'software_version',
  'peak_theoretical_vs_end_to_end_measured',
] as const;

export type BenchmarkNormalizationDimension =
  (typeof BENCHMARK_NORMALIZATION_DIMENSIONS)[number];

export const COMPARABILITY_STATES = [
  'COMPARABLE',
  'NOT_COMPARABLE',
  'PARTIALLY_COMPARABLE',
] as const;

export type ComparabilityState = (typeof COMPARABILITY_STATES)[number];

/**
 * Regression memory outcomes after driver/runtime/model updates.
 */
export const BENCHMARK_REGRESSION_OUTCOMES = [
  'PASS',
  'REGRESSED',
  'IMPROVED',
  'STALE',
] as const;

export type BenchmarkRegressionOutcome =
  (typeof BENCHMARK_REGRESSION_OUTCOMES)[number];

/**
 * Prefer recent, comparable, locally measured evidence when available.
 */
export const SCHEDULER_PREFERENCE_ORDER = [
  'xiv_local_measured_recent_comparable',
  'customer_authorized_measured_recent_comparable',
  'peer_reviewed_comparable',
  'independent_public_comparable',
  'vendor_published_comparable',
  'simulated_or_unknown',
] as const;

/**
 * Agent question surfaces (advisory).
 */
export const BENCHMARK_AGENT_QUESTIONS = [
  'which_verified_device_is_best_for_this_workload',
  'is_gpu_actually_faster_than_cpu_here',
  'is_npu_more_efficient_for_this_local_task',
  'which_runtime_regressed',
  'does_quantization_improve_latency_enough_to_justify_accuracy_loss',
  'which_route_provides_best_cost_privacy_performance_tradeoff',
] as const;

export const PUBLIC_BENCHMARK_MEMORY_CYCLE = [
  'honesty_locks',
  'benchmark_memory_bootstrap',
  // A — Structure
  'evidence_classes_encoded',
  'benchmark_record_fields_encoded',
  'normalization_dimensions_encoded',
  'comparability_states_encoded',
  'regression_outcomes_encoded',
  'scheduler_preference_order_encoded',
  'agent_questions_encoded',
  // B — Truth boundaries
  'published_neq_xiv_verification',
  'vendor_published_distinct_from_xiv_local_measured',
  'prefer_local_measured_when_available',
  'naive_comparison_marked_not_comparable',
  'stale_evidence_decays',
  // C — Safety / IP
  'lawful_benchmarks_only',
  'no_private_benchmark_db_cross_tenant_copy',
  'no_benchmark_justifies_overclock_thermal_bypass_firmware',
  'guardian_rls_tenant_universe_isolation',
  'recommend_neq_act',
  'l4_autonomy_false',
  // D — Soft-wires
  'ep4_soft_wire',
  'ep2_soft_wire',
  'ep1_soft_wire',
  'em157_soft_wire',
  'db_candidates_not_applied',
  'evidence',
] as const;

export type Ep5Hop = (typeof PUBLIC_BENCHMARK_MEMORY_CYCLE)[number];

export type Ep5EvidenceState =
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
  | 'NOT_COMPARABLE'
  | 'STALE'
  | 'REGRESSED'
  | 'IMPROVED'
  | 'UNKNOWN';

export type Ep5HopRecord = {
  hop: Ep5Hop;
  state: Ep5EvidenceState;
  summary: string;
  at: string;
};

export type Ep5ActorKind =
  | 'benchmark_architect'
  | 'benchmark_agent'
  | 'scheduler_research'
  | 'regression_monitor'
  | 'proposal'
  | 'human_approver'
  | 'founder'
  | 'guardian'
  | 'home_base';

export type Ep5Actor = {
  kind: Ep5ActorKind;
  id: string;
  orgId: string;
  tenantId: string;
  universeId: string;
  permissions: readonly string[];
};

export const EP5_LOCKS = Object.freeze({
  L4_AUTONOMY_ENABLED: false as const,
  TIP_LAND: false as const,
  PRODUCTION_AUTHORIZATION: false as const,
  PRODUCTION_WRITE: false as const,
  DB_CANDIDATES_APPLIED: false as const,
  FULL_PRODUCTION_BENCHMARK_MEMORY_SHIPPED: false as const,
  MANAGE_PULL_REQUEST: false as const,

  // Published ≠ XIV verification
  PUBLISHED_EQ_XIV_VERIFICATION: false as const,
  VENDOR_PUBLISHED_EQ_XIV_LOCAL_MEASURED: false as const,
  SIMULATED_EQ_XIV_LOCAL_MEASURED: false as const,
  UNKNOWN_EQ_VERIFIED: false as const,

  // Comparison honesty
  NAIVE_COMPARISON_EQ_COMPARABLE: false as const,
  STALE_EQ_PERMANENTLY_TRUSTED: false as const,

  // IP / safety
  COPY_PRIVATE_BENCHMARK_DB_ACROSS_TENANTS: false as const,
  COPY_CONFIDENTIAL_CUSTOMER_RESULTS_ACROSS_TENANTS: false as const,
  BENCHMARK_JUSTIFIES_OVERCLOCKING: false as const,
  BENCHMARK_JUSTIFIES_THERMAL_BYPASS: false as const,
  BENCHMARK_JUSTIFIES_FIRMWARE_MODIFICATION: false as const,
  BENCHMARK_JUSTIFIES_UNSAFE_HARDWARE_TUNING: false as const,

  // Autonomy
  AGENT_AUTO_AUTHORITY: false as const,
  AUTO_SCHEDULE_WITHOUT_COMPARABILITY_CHECK: false as const,

  // Recommend ≠ act
  RECOMMEND_EQ_ACT: false as const,
  RECOMMEND_EQ_OVERCLOCK: false as const,
  RECOMMEND_EQ_DEPLOY: false as const,

  // Isolation
  BYPASS_GUARDIAN_RLS_TENANT_UNIVERSE: false as const,
  GUARDIAN_RLS_TENANT_UNIVERSE_ISOLATION_UNCHANGED: true as const,

  // Honesty ladder
  DOCUMENTED_EQ_IMPLEMENTED: false as const,
  IMPLEMENTED_EQ_VERIFIED: false as const,
  VERIFIED_EQ_PRODUCTION_AUTHORIZED: false as const,

  HUMAN_APPROVAL_REQUIRED_BEFORE_CONSEQUENTIAL_ACTIONS: true as const,
});

export const BENCHMARK_MEMORY_AGENT_BOUNDS = Object.freeze({
  mayReturnEvidenceToHomeBase: true as const,
  automaticAuthority: false as const,
  mayEquatePublishedWithXivMeasured: false as const,
  mayCopyPrivateBenchmarksAcrossTenants: false as const,
  mayJustifyUnsafeHardwareTuning: false as const,
  mayRecommendOnly: true as const,
});

export const EP5_MAY = Object.freeze([
  'register_benchmark_records',
  'label_evidence_classes',
  'normalize_benchmark_dimensions',
  'mark_not_comparable_when_naive',
  'prefer_local_measured_for_scheduler',
  'record_regression_outcomes',
  'decay_stale_benchmark_evidence',
  'answer_benchmark_questions_advisably',
  'return_agent_evidence_to_home_base',
] as const);

export const EP5_MUST_NOT = Object.freeze([
  'equate_published_with_xiv_verification',
  'equate_vendor_published_with_xiv_local_measured',
  'treat_naive_comparison_as_comparable',
  'keep_stale_evidence_permanently_trusted',
  'copy_private_benchmark_db_across_tenants',
  'copy_confidential_customer_results_across_tenants',
  'justify_overclocking_via_benchmark',
  'justify_thermal_bypass_via_benchmark',
  'justify_firmware_modification_via_benchmark',
  'justify_unsafe_hardware_tuning_via_benchmark',
  'bypass_guardian_rls_tenant_universe',
  'treat_recommend_as_act',
  'grant_agents_automatic_authority',
] as const);

export type SoftWirePresence = {
  present: boolean;
  pathChecked: string;
  note: string;
};

export type Ep5SoftWireSnapshot = {
  ep4IpFirewall: SoftWirePresence;
  ep4Report: SoftWirePresence;
  ep2CapabilityGraph: SoftWirePresence;
  ep2Report: SoftWirePresence;
  ep1VirtualChipContract: SoftWirePresence;
  ep1Report: SoftWirePresence;
  em157HomeBase: SoftWirePresence;
};

export function assertEp5LocksIntact(): boolean {
  return (
    EP5_LOCKS.L4_AUTONOMY_ENABLED === false &&
    EP5_LOCKS.PUBLISHED_EQ_XIV_VERIFICATION === false &&
    EP5_LOCKS.VENDOR_PUBLISHED_EQ_XIV_LOCAL_MEASURED === false &&
    EP5_LOCKS.SIMULATED_EQ_XIV_LOCAL_MEASURED === false &&
    EP5_LOCKS.UNKNOWN_EQ_VERIFIED === false &&
    EP5_LOCKS.NAIVE_COMPARISON_EQ_COMPARABLE === false &&
    EP5_LOCKS.STALE_EQ_PERMANENTLY_TRUSTED === false &&
    EP5_LOCKS.COPY_PRIVATE_BENCHMARK_DB_ACROSS_TENANTS === false &&
    EP5_LOCKS.COPY_CONFIDENTIAL_CUSTOMER_RESULTS_ACROSS_TENANTS === false &&
    EP5_LOCKS.BENCHMARK_JUSTIFIES_OVERCLOCKING === false &&
    EP5_LOCKS.BENCHMARK_JUSTIFIES_THERMAL_BYPASS === false &&
    EP5_LOCKS.BENCHMARK_JUSTIFIES_FIRMWARE_MODIFICATION === false &&
    EP5_LOCKS.BENCHMARK_JUSTIFIES_UNSAFE_HARDWARE_TUNING === false &&
    EP5_LOCKS.AGENT_AUTO_AUTHORITY === false &&
    EP5_LOCKS.AUTO_SCHEDULE_WITHOUT_COMPARABILITY_CHECK === false &&
    EP5_LOCKS.RECOMMEND_EQ_ACT === false &&
    EP5_LOCKS.RECOMMEND_EQ_OVERCLOCK === false &&
    EP5_LOCKS.RECOMMEND_EQ_DEPLOY === false &&
    EP5_LOCKS.BYPASS_GUARDIAN_RLS_TENANT_UNIVERSE === false &&
    EP5_LOCKS.GUARDIAN_RLS_TENANT_UNIVERSE_ISOLATION_UNCHANGED === true &&
    EP5_LOCKS.DOCUMENTED_EQ_IMPLEMENTED === false &&
    EP5_LOCKS.IMPLEMENTED_EQ_VERIFIED === false &&
    EP5_LOCKS.VERIFIED_EQ_PRODUCTION_AUTHORIZED === false &&
    EP5_LOCKS.HUMAN_APPROVAL_REQUIRED_BEFORE_CONSEQUENTIAL_ACTIONS === true &&
    EP5_LOCKS.TIP_LAND === false &&
    EP5_LOCKS.PRODUCTION_AUTHORIZATION === false &&
    EP5_LOCKS.DB_CANDIDATES_APPLIED === false &&
    EP5_LOCKS.FULL_PRODUCTION_BENCHMARK_MEMORY_SHIPPED === false &&
    EP5_LOCKS.MANAGE_PULL_REQUEST === false &&
    BENCHMARK_MEMORY_AGENT_BOUNDS.automaticAuthority === false &&
    BENCHMARK_MEMORY_AGENT_BOUNDS.mayEquatePublishedWithXivMeasured === false &&
    BENCHMARK_MEMORY_AGENT_BOUNDS.mayCopyPrivateBenchmarksAcrossTenants ===
      false &&
    BENCHMARK_MEMORY_AGENT_BOUNDS.mayJustifyUnsafeHardwareTuning === false
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

export function ep5SoftWireSnapshot(repoRoot?: string): Ep5SoftWireSnapshot {
  const root =
    repoRoot ?? join(dirname(fileURLToPath(import.meta.url)), '../../..');

  return {
    ep4IpFirewall: softWireFile(
      './proprietary-ip-firewall-types.ts',
      'EP4 Proprietary-IP Firewall PRESENT (soft-wire).',
      'EP4 Proprietary-IP Firewall absent — soft-wire WAITING_DATA.',
    ),
    ep4Report: softWireRepoRelative(
      root,
      'docs/operations/62L_EP4_PROPRIETARY_IP_FIREWALL_REPORT.md',
      'EP4 report PRESENT.',
      'EP4 report absent — soft-wire WAITING_DATA.',
    ),
    ep2CapabilityGraph: softWireFile(
      './cross-vendor-capability-graph-types.ts',
      'EP2 Cross-Vendor Capability Graph PRESENT (soft-wire).',
      'EP2 Cross-Vendor Capability Graph absent — soft-wire WAITING_DATA.',
    ),
    ep2Report: softWireRepoRelative(
      root,
      'docs/operations/62L_EP2_CROSS_VENDOR_CAPABILITY_GRAPH_REPORT.md',
      'EP2 report PRESENT.',
      'EP2 report absent — soft-wire WAITING_DATA.',
    ),
    ep1VirtualChipContract: softWireFile(
      './virtual-chip-contract-types.ts',
      'EP1 Virtual Chip Contract PRESENT (soft-wire).',
      'EP1 Virtual Chip Contract absent — soft-wire WAITING_DATA.',
    ),
    ep1Report: softWireRepoRelative(
      root,
      'docs/operations/62L_EP1_VIRTUAL_CHIP_CONTRACT_REPORT.md',
      'EP1 report PRESENT.',
      'EP1 report absent — soft-wire WAITING_DATA.',
    ),
    em157HomeBase: softWireFile(
      './agent-compute-home-base-types.ts',
      'EM (#157) Agent Compute Home Base PRESENT (soft-wire).',
      'EM (#157) Agent Compute Home Base absent — soft-wire WAITING_DATA.',
    ),
  };
}

export function isHumanApprover(actor: Ep5Actor): boolean {
  return actor.kind === 'human_approver' || actor.kind === 'founder';
}

export function isBenchmarkMemoryAgent(actor: Ep5Actor): boolean {
  const agents: readonly Ep5ActorKind[] = [
    'benchmark_architect',
    'benchmark_agent',
    'scheduler_research',
    'regression_monitor',
    'proposal',
  ];
  return agents.includes(actor.kind);
}

/**
 * Prefer recent comparable XIV_LOCAL_MEASURED over published claims.
 */
export function schedulerPreferenceRank(
  evidenceClass: BenchmarkEvidenceClass,
  opts?: { recent?: boolean; comparable?: boolean },
): number {
  if (!opts?.comparable) return 99;
  if (evidenceClass === 'XIV_LOCAL_MEASURED' && opts.recent) return 0;
  if (evidenceClass === 'CUSTOMER_AUTHORIZED_MEASURED' && opts.recent) return 1;
  if (evidenceClass === 'PEER_REVIEWED') return 2;
  if (evidenceClass === 'INDEPENDENT_PUBLIC') return 3;
  if (evidenceClass === 'VENDOR_PUBLISHED') return 4;
  return 5;
}
