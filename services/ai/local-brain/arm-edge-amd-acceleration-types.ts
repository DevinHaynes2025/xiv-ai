/**
 * 62L-EQ7 — ARM Edge/Phone Runtime Research + AMD XIV Acceleration Layer
 * (park-and-implement).
 *
 * Research ARM phone/edge runtimes and extend XIV’s proprietary software
 * acceleration layer for verified AMD hardware so the Virtual Chip brain can
 * improve workload placement across phones, laptops, edge nodes, and
 * heterogeneous devices without modifying vendor silicon.
 *
 * AMD path (software-level only):
 * XIV task → workload profile → AMD runtime selection → model/precision →
 * batching/cache/queue → benchmark → adaptive policy
 *
 * Goal: better use of AMD hardware — not claiming physical transistor modification.
 * Improvement claims require comparable run benchmarks (baseline vs XIV policy).
 *
 * Mobile/edge: explicit enrollment + supported permissions only.
 * No covert install, battery abuse, hidden telemetry, unrestricted user data.
 *
 * Soft-wire when PRESENT: EQ6, EQ5, EQ2, EP16, EM (#157). Presence ≠ VERIFIED.
 *
 * SoT: GitHub #161 / 62L-EQ family. GitLab mirror: needsAuth; no number invented.
 *
 * Honesty: DOCUMENTED ≠ IMPLEMENTED ≠ VERIFIED ≠ PRODUCTION AUTHORIZED.
 * L4_AUTONOMY_ENABLED=false. Guardian/RLS/tenant/Universe unchanged.
 * DB candidates NOT_APPLIED. tip-land=NO.
 * Next (report only): EQ8 — ARM Server / Cloud Runtime Research.
 */

import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

export const HONESTY_BANNER =
  'DOCUMENTED ≠ IMPLEMENTED ≠ VERIFIED ≠ PRODUCTION AUTHORIZED' as const;

export const GITHUB_SOT_ISSUE = 161 as const;
export const GITHUB_SOT_LABEL = '62L-EQ7' as const;
export const GITHUB_SOT_FAMILY = '62L-EQ' as const;
export const GITHUB_SOT_TITLE =
  '62L-EQ7 ARM Edge/Phone Runtime Research + AMD XIV Acceleration Layer — software-level AMD routing; phone/edge enrollment; improvement claims need comparable benchmarks' as const;

export const GITLAB_MIRROR_NOTE =
  'GitLab mirror: search attempted; MCP needsAuth / not resolved in this environment — no issue number invented.' as const;

export const EQ7_DB_CANDIDATES_STATUS = 'NOT_APPLIED' as const;

export const NEXT_PHASE_TITLE =
  'EQ8 — ARM Server / Cloud Runtime Research — map ARM server economics, cloud/edge workloads, and cross-architecture performance into the Virtual Chip scheduler.' as const;

/**
 * ARM edge/phone research map dimensions.
 */
export const ARM_EDGE_PHONE_RESEARCH_DIMENSIONS = [
  'android_arm_device_classes',
  'aarch64_runtime_support',
  'mobile_npus_gpus',
  'onnx_mobile_inference_options',
  'memory_constraints',
  'battery_thermal_constraints',
  'local_offline_model_limits',
  'latency_energy_tradeoffs',
  'app_sandbox_boundaries',
  'benchmark_evidence',
] as const;

/**
 * AMD XIV software acceleration pipeline.
 */
export const AMD_XIV_ACCELERATION_PIPELINE = [
  'xiv_task',
  'workload_profile',
  'amd_runtime_selection',
  'model_precision_choice',
  'batching_cache_queue_strategy',
  'benchmark',
  'adaptive_policy',
] as const;

/**
 * Candidate XIV proprietary software improvements (not silicon mods).
 */
export const XIV_PROPRIETARY_SOFTWARE_IMPROVEMENTS = [
  'amd_cpu_gpu_npu_workload_routing',
  'dynamic_model_selection',
  'quantization_selection',
  'adaptive_batching',
  'memory_aware_scheduling',
  'cache_reuse',
  'latency_aware_queues',
  'local_offline_preference',
  'cpu_gpu_npu_fallback',
  'benchmark_driven_routing',
  'agent_workload_consolidation',
] as const;

/**
 * Evidence fields for every claimed improvement.
 */
export const IMPROVEMENT_EVIDENCE_FIELDS = [
  'baseline',
  'xivPolicyVersion',
  'deviceRuntime',
  'modelWorkload',
  'latency',
  'throughput',
  'memory',
  'energyProxy',
  'quality',
  'result',
] as const;

export type ImprovementEvidenceField =
  (typeof IMPROVEMENT_EVIDENCE_FIELDS)[number];

/**
 * Evidence / claim states for ARM research + AMD acceleration.
 */
export const EQ7_EVIDENCE_CLAIM_STATES = [
  'DOCUMENTED',
  'CANDIDATE',
  'BENCHMARKED',
  'VERIFIED_IMPROVEMENT',
  'NO_IMPROVEMENT',
  'REGRESSED',
  'NOT_TESTED',
  'ENROLLED',
  'NOT_ENROLLED',
] as const;

export type Eq7EvidenceClaimState =
  (typeof EQ7_EVIDENCE_CLAIM_STATES)[number];

/**
 * Mobile/edge enrollment rule.
 */
export const MOBILE_EDGE_ENROLLMENT_RULE = Object.freeze({
  requiresExplicitEnrollment: true as const,
  requiresSupportedPlatformPermissions: true as const,
  covertBackgroundInstallation: false as const,
  batteryAbuse: false as const,
  hiddenTelemetry: false as const,
  unrestrictedUserDataAccess: false as const,
});

/**
 * Governance denies.
 */
export const EQ7_GOVERNANCE_DENIES = [
  'firmware_bios_modification',
  'overclocking',
  'driver_replacement',
  'proprietary_amd_ip_copying',
  'permission_expansion',
  'production_changes',
  'physical_transistor_architecture_modification_claim',
] as const;

export const ARM_EDGE_AMD_ACCELERATION_CYCLE = [
  'honesty_locks',
  'arm_edge_amd_acceleration_bootstrap',
  // A — Structure
  'arm_research_dimensions_encoded',
  'amd_acceleration_pipeline_encoded',
  'xiv_software_improvements_encoded',
  'improvement_evidence_fields_encoded',
  'enrollment_rule_encoded',
  // B — Truth
  'software_accel_not_silicon_mod',
  'improvement_requires_comparable_benchmark',
  'mobile_edge_explicit_enrollment_only',
  // C — Denies
  'deny_claim_physical_transistor_mod',
  'deny_improvement_without_comparable_benchmark',
  'deny_covert_phone_enrollment',
  'deny_battery_abuse',
  'deny_hidden_telemetry',
  'deny_unrestricted_user_data',
  'deny_firmware_bios_mod',
  'deny_overclocking',
  'deny_driver_replacement',
  'deny_proprietary_amd_ip_copy',
  'deny_permission_expansion',
  'deny_production_changes',
  // D — Autonomy
  'guardian_rls_tenant_universe_isolation',
  'recommend_neq_act',
  'l4_autonomy_false',
  // E — Soft-wires
  'eq6_soft_wire',
  'eq5_soft_wire',
  'eq2_soft_wire',
  'ep16_soft_wire',
  'em157_soft_wire',
  'db_candidates_not_applied',
  'evidence',
] as const;

export type Eq7Hop = (typeof ARM_EDGE_AMD_ACCELERATION_CYCLE)[number];

export type Eq7EvidenceState =
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
  | 'UNKNOWN'
  | 'BENCHMARKED'
  | 'VERIFIED_IMPROVEMENT'
  | 'ENROLLED'
  | 'NOT_ENROLLED';

export type Eq7HopRecord = {
  hop: Eq7Hop;
  state: Eq7EvidenceState;
  summary: string;
  at: string;
};

export type Eq7ActorKind =
  | 'arm_edge_researcher'
  | 'amd_accel_policy'
  | 'mobile_enrollment'
  | 'proposal'
  | 'human_approver'
  | 'founder'
  | 'guardian'
  | 'home_base'
  | 'tenant_admin';

export type Eq7Actor = {
  kind: Eq7ActorKind;
  id: string;
  orgId: string;
  tenantId: string;
  universeId: string;
  permissions: readonly string[];
};

export const EQ7_LOCKS = Object.freeze({
  L4_AUTONOMY_ENABLED: false as const,
  TIP_LAND: false as const,
  PRODUCTION_AUTHORIZATION: false as const,
  PRODUCTION_WRITE: false as const,
  DB_CANDIDATES_APPLIED: false as const,
  FULL_PRODUCTION_ARM_EDGE_AMD_ACCEL_SHIPPED: false as const,
  MANAGE_PULL_REQUEST: false as const,

  // Core truth
  CLAIM_PHYSICAL_TRANSISTOR_MOD: false as const,
  IMPROVEMENT_WITHOUT_COMPARABLE_BENCHMARK: false as const,
  DOCUMENTED_EQ_VERIFIED_IMPROVEMENT: false as const,

  // Mobile / edge
  COVERT_BACKGROUND_INSTALLATION: false as const,
  BATTERY_ABUSE: false as const,
  HIDDEN_TELEMETRY: false as const,
  UNRESTRICTED_USER_DATA_ACCESS: false as const,
  ENROLL_WITHOUT_EXPLICIT_CONSENT: false as const,
  ENROLL_WITHOUT_SUPPORTED_PERMISSIONS: false as const,

  // Governance
  FIRMWARE_BIOS_MODIFICATION: false as const,
  OVERCLOCKING: false as const,
  DRIVER_REPLACEMENT: false as const,
  PROPRIETARY_AMD_IP_COPYING: false as const,
  PERMISSION_EXPANSION: false as const,
  PRODUCTION_CHANGES: false as const,

  // Autonomy
  AGENT_AUTO_AUTHORITY: false as const,
  RECOMMEND_EQ_ACT: false as const,
  RECOMMEND_EQ_AUTHORIZE: false as const,
  HIDDEN_CHAIN_OF_THOUGHT_IN_EQ7: false as const,

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

export const EQ7_AGENT_BOUNDS = Object.freeze({
  mayResearchArmEdgePhoneRuntimes: true as const,
  mayProposeAmdSoftwareAccelerationPolicies: true as const,
  mayRecordComparableBenchmarks: true as const,
  mayEnrollDevicesWithExplicitConsent: true as const,
  mayReturnEvidenceToHomeBase: true as const,
  automaticAuthority: false as const,
  mayClaimPhysicalTransistorMod: false as const,
  mayClaimImprovementWithoutComparableBenchmark: false as const,
  mayCovertInstallOnPhones: false as const,
  mayAbuseBattery: false as const,
  mayHideTelemetry: false as const,
  mayUnrestrictedUserDataAccess: false as const,
  mayModifyFirmwareBios: false as const,
  mayOverclock: false as const,
  mayReplaceDrivers: false as const,
  mayCopyProprietaryAmdIp: false as const,
  mayExpandPermissions: false as const,
  mayMakeProductionChanges: false as const,
  mayIncludeHiddenChainOfThought: false as const,
  mayRecommendOnly: true as const,
});

export const EQ7_MAY = Object.freeze([
  'map_arm_edge_phone_runtime_dimensions',
  'propose_amd_software_level_routing_and_policies',
  'require_comparable_benchmarks_for_improvement_claims',
  'enroll_phones_edge_only_with_explicit_consent_and_permissions',
  'prefer_local_offline_and_cpu_gpu_npu_fallback',
  'keep_silicon_unmodified_software_acceleration_only',
] as const);

export const EQ7_MUST_NOT = Object.freeze([
  'claim_physical_amd_transistor_architecture_modification',
  'call_improvement_without_actually_run_comparable_benchmark',
  'covert_background_install_or_battery_abuse_or_hidden_telemetry',
  'unrestricted_access_to_user_data',
  'modify_firmware_bios_overclock_or_replace_drivers',
  'copy_proprietary_amd_ip_or_expand_permissions',
  'make_production_changes',
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

export type Eq7SoftWireSnapshot = {
  eq6ArchitectureCapabilityGraph: SoftWirePresence;
  eq6Report: SoftWirePresence;
  eq5CompilerIrTranslationLayer: SoftWirePresence;
  eq5Report: SoftWirePresence;
  eq2ArmArchitectureKnowledgePack: SoftWirePresence;
  eq2Report: SoftWirePresence;
  ep16NoOverclockBiosRule: SoftWirePresence;
  ep16Report: SoftWirePresence;
  em157HomeBase: SoftWirePresence;
};

export function assertEq7LocksIntact(): boolean {
  return (
    EQ7_LOCKS.L4_AUTONOMY_ENABLED === false &&
    EQ7_LOCKS.CLAIM_PHYSICAL_TRANSISTOR_MOD === false &&
    EQ7_LOCKS.IMPROVEMENT_WITHOUT_COMPARABLE_BENCHMARK === false &&
    EQ7_LOCKS.DOCUMENTED_EQ_VERIFIED_IMPROVEMENT === false &&
    EQ7_LOCKS.COVERT_BACKGROUND_INSTALLATION === false &&
    EQ7_LOCKS.BATTERY_ABUSE === false &&
    EQ7_LOCKS.HIDDEN_TELEMETRY === false &&
    EQ7_LOCKS.UNRESTRICTED_USER_DATA_ACCESS === false &&
    EQ7_LOCKS.ENROLL_WITHOUT_EXPLICIT_CONSENT === false &&
    EQ7_LOCKS.ENROLL_WITHOUT_SUPPORTED_PERMISSIONS === false &&
    EQ7_LOCKS.FIRMWARE_BIOS_MODIFICATION === false &&
    EQ7_LOCKS.OVERCLOCKING === false &&
    EQ7_LOCKS.DRIVER_REPLACEMENT === false &&
    EQ7_LOCKS.PROPRIETARY_AMD_IP_COPYING === false &&
    EQ7_LOCKS.PERMISSION_EXPANSION === false &&
    EQ7_LOCKS.PRODUCTION_CHANGES === false &&
    EQ7_LOCKS.AGENT_AUTO_AUTHORITY === false &&
    EQ7_LOCKS.RECOMMEND_EQ_ACT === false &&
    EQ7_LOCKS.RECOMMEND_EQ_AUTHORIZE === false &&
    EQ7_LOCKS.HIDDEN_CHAIN_OF_THOUGHT_IN_EQ7 === false &&
    EQ7_LOCKS.BYPASS_GUARDIAN_RLS_TENANT_UNIVERSE === false &&
    EQ7_LOCKS.GUARDIAN_RLS_TENANT_UNIVERSE_ISOLATION_UNCHANGED === true &&
    EQ7_LOCKS.HUMAN_APPROVAL_BOUNDARIES_UNCHANGED === true &&
    EQ7_LOCKS.DOCUMENTED_EQ_IMPLEMENTED === false &&
    EQ7_LOCKS.IMPLEMENTED_EQ_VERIFIED === false &&
    EQ7_LOCKS.VERIFIED_EQ_PRODUCTION_AUTHORIZED === false &&
    EQ7_LOCKS.HUMAN_APPROVAL_REQUIRED_BEFORE_CONSEQUENTIAL_ACTIONS === true &&
    EQ7_LOCKS.TIP_LAND === false &&
    EQ7_LOCKS.PRODUCTION_AUTHORIZATION === false &&
    EQ7_LOCKS.DB_CANDIDATES_APPLIED === false &&
    EQ7_LOCKS.FULL_PRODUCTION_ARM_EDGE_AMD_ACCEL_SHIPPED === false &&
    EQ7_LOCKS.MANAGE_PULL_REQUEST === false &&
    MOBILE_EDGE_ENROLLMENT_RULE.covertBackgroundInstallation === false &&
    MOBILE_EDGE_ENROLLMENT_RULE.batteryAbuse === false &&
    MOBILE_EDGE_ENROLLMENT_RULE.hiddenTelemetry === false &&
    MOBILE_EDGE_ENROLLMENT_RULE.unrestrictedUserDataAccess === false &&
    EQ7_AGENT_BOUNDS.automaticAuthority === false &&
    EQ7_AGENT_BOUNDS.mayClaimPhysicalTransistorMod === false &&
    EQ7_AGENT_BOUNDS.mayClaimImprovementWithoutComparableBenchmark ===
      false &&
    EQ7_AGENT_BOUNDS.mayCovertInstallOnPhones === false &&
    EQ7_AGENT_BOUNDS.mayAbuseBattery === false &&
    EQ7_AGENT_BOUNDS.mayHideTelemetry === false &&
    EQ7_AGENT_BOUNDS.mayUnrestrictedUserDataAccess === false &&
    EQ7_AGENT_BOUNDS.mayModifyFirmwareBios === false &&
    EQ7_AGENT_BOUNDS.mayOverclock === false &&
    EQ7_AGENT_BOUNDS.mayReplaceDrivers === false &&
    EQ7_AGENT_BOUNDS.mayCopyProprietaryAmdIp === false &&
    EQ7_AGENT_BOUNDS.mayExpandPermissions === false &&
    EQ7_AGENT_BOUNDS.mayMakeProductionChanges === false &&
    EQ7_AGENT_BOUNDS.mayIncludeHiddenChainOfThought === false
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

export function eq7SoftWireSnapshot(repoRoot?: string): Eq7SoftWireSnapshot {
  const root =
    repoRoot ?? join(dirname(fileURLToPath(import.meta.url)), '../../..');

  return {
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
    eq5CompilerIrTranslationLayer: softWireFile(
      './compiler-ir-translation-layer-types.ts',
      'EQ5 Compiler/IR Translation Layer PRESENT (soft-wire).',
      'EQ5 Compiler/IR Translation Layer absent — soft-wire WAITING_DATA.',
    ),
    eq5Report: softWireRepoRelative(
      root,
      'docs/operations/62L_EQ5_COMPILER_IR_TRANSLATION_LAYER_REPORT.md',
      'EQ5 report PRESENT.',
      'EQ5 report absent — soft-wire WAITING_DATA.',
    ),
    eq2ArmArchitectureKnowledgePack: softWireFile(
      './arm-architecture-knowledge-pack-types.ts',
      'EQ2 ARM Architecture Knowledge Pack PRESENT (soft-wire).',
      'EQ2 ARM Architecture Knowledge Pack absent — soft-wire WAITING_DATA.',
    ),
    eq2Report: softWireRepoRelative(
      root,
      'docs/operations/62L_EQ2_ARM_ARCHITECTURE_KNOWLEDGE_PACK_REPORT.md',
      'EQ2 report PRESENT.',
      'EQ2 report absent — soft-wire WAITING_DATA.',
    ),
    ep16NoOverclockBiosRule: softWireFile(
      './no-overclock-bios-rule-types.ts',
      'EP16 No Overclock / BIOS Rule PRESENT (soft-wire).',
      'EP16 No Overclock / BIOS Rule absent — soft-wire WAITING_DATA.',
    ),
    ep16Report: softWireRepoRelative(
      root,
      'docs/operations/62L_EP16_NO_OVERCLOCK_BIOS_RULE_REPORT.md',
      'EP16 report PRESENT.',
      'EP16 report absent — soft-wire WAITING_DATA.',
    ),
    em157HomeBase: softWireFile(
      './agent-compute-home-base-types.ts',
      'EM (#157) Agent Compute Home Base PRESENT (soft-wire).',
      'EM (#157) Agent Compute Home Base absent — soft-wire WAITING_DATA.',
    ),
  };
}

export function isHumanApprover(actor: Eq7Actor): boolean {
  return (
    actor.kind === 'human_approver' ||
    actor.kind === 'founder' ||
    actor.kind === 'tenant_admin'
  );
}

export function isEq7Agent(actor: Eq7Actor): boolean {
  const agents: readonly Eq7ActorKind[] = [
    'arm_edge_researcher',
    'amd_accel_policy',
    'mobile_enrollment',
    'proposal',
  ];
  return agents.includes(actor.kind);
}

/**
 * Software acceleration does not equal physical silicon modification.
 */
export function softwareAccelImpliesSiliconMod(): false {
  return false;
}

/**
 * Improvement claim requires actually-run comparable benchmark.
 */
export function canClaimVerifiedImprovement(input: {
  baselineRun: boolean;
  xivPolicyRun: boolean;
  comparableWorkload: boolean;
  comparableDeviceRuntime: boolean;
  metricsRecorded: boolean;
}): boolean {
  return (
    input.baselineRun &&
    input.xivPolicyRun &&
    input.comparableWorkload &&
    input.comparableDeviceRuntime &&
    input.metricsRecorded
  );
}
