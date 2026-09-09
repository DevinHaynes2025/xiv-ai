/**
 * 62L-EQ11 — Device-Neutral Workload Genome (park-and-implement).
 *
 * Every compute task described as reusable workload primitives so the Virtual
 * Chip brain can compare architectures by what the workload needs instead of
 * by vendor name.
 *
 * Core flow:
 * Agent task → Workload Genome → capability requirements → eligible
 * runtimes/devices → benchmark comparison → scheduler decision
 *
 * Proprietary XIV value:
 * task meaning → computational structure → architecture fit → measured
 * performance → learned routing policy
 *
 * Neural pathway:
 * Business problem → algorithm → workload primitives → runtime → architecture →
 * device → benchmark → outcome
 * Only measured results strengthen the pathway.
 *
 * Soft-wire when PRESENT: EQ10, EQ8, EQ6, EQ5, EQ1, EM (#157). Presence ≠ VERIFIED.
 *
 * SoT: GitHub #161 / 62L-EQ family. GitLab mirror: needsAuth; no number invented.
 *
 * Honesty: DOCUMENTED ≠ IMPLEMENTED ≠ VERIFIED ≠ PRODUCTION AUTHORIZED.
 * L4_AUTONOMY_ENABLED=false. Guardian/RLS/tenant/Universe unchanged.
 * DB candidates NOT_APPLIED. tip-land=NO.
 * Next (report only): EQ12 — Cross-Architecture Benchmark Matrix.
 */

import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

export const HONESTY_BANNER =
  'DOCUMENTED ≠ IMPLEMENTED ≠ VERIFIED ≠ PRODUCTION AUTHORIZED' as const;

export const GITHUB_SOT_ISSUE = 161 as const;
export const GITHUB_SOT_LABEL = '62L-EQ11' as const;
export const GITHUB_SOT_FAMILY = '62L-EQ' as const;
export const GITHUB_SOT_TITLE =
  '62L-EQ11 Device-Neutral Workload Genome — reusable primitives; compare by needs not vendor; only measured results strengthen pathway' as const;

export const GITLAB_MIRROR_NOTE =
  'GitLab mirror: search attempted; MCP needsAuth / not resolved in this environment — no issue number invented.' as const;

export const EQ11_DB_CANDIDATES_STATUS = 'NOT_APPLIED' as const;

export const NEXT_PHASE_TITLE =
  'EQ12 — Cross-Architecture Benchmark Matrix — run the same workload/model/input across verified ARM, x86, GPU, NPU, and edge paths and record which route actually performs best.' as const;

/**
 * Initial workload primitives.
 */
export const WORKLOAD_PRIMITIVES = [
  'matrix_multiplication',
  'convolution',
  'attention',
  'embedding_generation',
  'vector_search',
  'graph_traversal',
  'sorting_filtering',
  'compression_encoding',
  'cryptographic_operations',
  'simulation',
  'optimization',
  'monte_carlo',
  'time_series_forecasting',
  'routing',
  'scheduling',
  'database_query',
  'etl_transformation',
  'multimodal_preprocessing',
  'speech_audio_inference',
  'vision_inference',
] as const;

export type WorkloadPrimitive = (typeof WORKLOAD_PRIMITIVES)[number];

/**
 * Genome record required fields.
 */
export const WORKLOAD_GENOME_FIELDS = [
  'workloadId',
  'operationFamily',
  'inputOutputShape',
  'computeIntensity',
  'memoryIntensity',
  'bandwidthNeeds',
  'latencySensitivity',
  'throughputPriority',
  'precisionRequirements',
  'parallelismProfile',
  'localityPrivacyRequirements',
  'modelRuntimeDependencies',
  'acceleratorRequirements',
  'fallbackOptions',
  'benchmarkSuite',
  'evidenceState',
] as const;

export type WorkloadGenomeField = (typeof WORKLOAD_GENOME_FIELDS)[number];

/**
 * Core genome → scheduler flow.
 */
export const WORKLOAD_GENOME_CORE_FLOW = [
  'agent_task',
  'workload_genome',
  'capability_requirements',
  'eligible_runtimes_devices',
  'benchmark_comparison',
  'scheduler_decision',
] as const;

/**
 * Proprietary XIV value chain.
 */
export const XIV_WORKLOAD_INTELLIGENCE_CHAIN = [
  'task_meaning',
  'computational_structure',
  'architecture_fit',
  'measured_performance',
  'learned_routing_policy',
] as const;

/**
 * Neural pathway.
 */
export const WORKLOAD_GENOME_NEURAL_PATHWAY = [
  'business_problem',
  'algorithm',
  'workload_primitives',
  'runtime',
  'architecture',
  'device',
  'benchmark',
  'outcome',
] as const;

/**
 * Evidence states for genome records / pathway strength.
 */
export const WORKLOAD_GENOME_EVIDENCE_STATES = [
  'DOCUMENTED',
  'CANDIDATE',
  'SUPPORTED',
  'VERIFIED',
  'PARTIAL',
  'STALE',
  'NOT_TESTED',
  'UNAVAILABLE',
] as const;

export type WorkloadGenomeEvidenceState =
  (typeof WORKLOAD_GENOME_EVIDENCE_STATES)[number];

/**
 * Comparison route classes (needs-based, not vendor-first).
 */
export const ELIGIBLE_ROUTE_CLASSES = [
  'cpu',
  'gpu',
  'npu',
  'edge',
  'cloud',
] as const;

export type EligibleRouteClass = (typeof ELIGIBLE_ROUTE_CLASSES)[number];

/**
 * Vector-search example profile attributes from the story.
 */
export const VECTOR_SEARCH_EXAMPLE_PROFILE = Object.freeze({
  memoryHeavy: true as const,
  latencySensitive: true as const,
  moderateParallelism: true as const,
  localOnly: true as const,
  requiresEmbeddingIndexRuntime: true as const,
  assumeGpuAlwaysBest: false as const,
});

/**
 * Safety boundary denies.
 */
export const EQ11_SAFETY_DENIES = [
  'infer_device_capability_beyond_evidence',
  'proprietary_isa_cloning',
  'firmware_modification',
  'unsafe_hardware_tuning',
  'automatic_cloud_purchasing',
  'permission_expansion',
] as const;

export const DEVICE_NEUTRAL_WORKLOAD_GENOME_CYCLE = [
  'honesty_locks',
  'device_neutral_workload_genome_bootstrap',
  // A — Structure
  'workload_primitives_encoded',
  'genome_fields_encoded',
  'core_flow_encoded',
  'xiv_intelligence_chain_encoded',
  'neural_pathway_encoded',
  // B — Truth
  'compare_by_needs_not_vendor',
  'only_measured_strengthens_pathway',
  'no_assume_gpu_always_best',
  // C — Denies
  'deny_infer_beyond_evidence',
  'deny_proprietary_isa_cloning',
  'deny_firmware_modification',
  'deny_unsafe_hardware_tuning',
  'deny_automatic_cloud_purchasing',
  'deny_permission_expansion',
  'deny_strengthen_without_measurement',
  // D — Autonomy
  'guardian_rls_tenant_universe_isolation',
  'recommend_neq_act',
  'l4_autonomy_false',
  // E — Soft-wires
  'eq10_soft_wire',
  'eq8_soft_wire',
  'eq6_soft_wire',
  'eq5_soft_wire',
  'eq1_soft_wire',
  'em157_soft_wire',
  'db_candidates_not_applied',
  'evidence',
] as const;

export type Eq11Hop = (typeof DEVICE_NEUTRAL_WORKLOAD_GENOME_CYCLE)[number];

export type Eq11EvidenceState =
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
  | 'SUPPORTED';

export type Eq11HopRecord = {
  hop: Eq11Hop;
  state: Eq11EvidenceState;
  summary: string;
  at: string;
};

export type Eq11ActorKind =
  | 'workload_genome_curator'
  | 'scheduler_advisor'
  | 'benchmark_ingest'
  | 'proposal'
  | 'human_approver'
  | 'founder'
  | 'guardian'
  | 'home_base'
  | 'tenant_admin';

export type Eq11Actor = {
  kind: Eq11ActorKind;
  id: string;
  orgId: string;
  tenantId: string;
  universeId: string;
  permissions: readonly string[];
};

export const EQ11_LOCKS = Object.freeze({
  L4_AUTONOMY_ENABLED: false as const,
  TIP_LAND: false as const,
  PRODUCTION_AUTHORIZATION: false as const,
  PRODUCTION_WRITE: false as const,
  DB_CANDIDATES_APPLIED: false as const,
  FULL_PRODUCTION_WORKLOAD_GENOME_SHIPPED: false as const,
  MANAGE_PULL_REQUEST: false as const,

  // Core truth
  VENDOR_NAME_FIRST_SCHEDULING: false as const,
  ASSUME_GPU_ALWAYS_BEST: false as const,
  STRENGTHEN_WITHOUT_MEASUREMENT: false as const,
  INFER_DEVICE_CAPABILITY_BEYOND_EVIDENCE: false as const,

  // Safety
  PROPRIETARY_ISA_CLONING: false as const,
  FIRMWARE_MODIFICATION: false as const,
  UNSAFE_HARDWARE_TUNING: false as const,
  AUTOMATIC_CLOUD_PURCHASING: false as const,
  PERMISSION_EXPANSION: false as const,

  // Autonomy
  AGENT_AUTO_AUTHORITY: false as const,
  RECOMMEND_EQ_ACT: false as const,
  RECOMMEND_EQ_AUTHORIZE: false as const,
  HIDDEN_CHAIN_OF_THOUGHT_IN_EQ11: false as const,

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

export const EQ11_AGENT_BOUNDS = Object.freeze({
  mayEmitWorkloadGenomeRecords: true as const,
  mayDeriveCapabilityRequirementsFromGenome: true as const,
  mayCompareEligibleRoutesByNeeds: true as const,
  mayStrengthenPathwayWithMeasuredResults: true as const,
  mayReturnEvidenceToHomeBase: true as const,
  automaticAuthority: false as const,
  mayScheduleByVendorNameFirst: false as const,
  mayAssumeGpuAlwaysBest: false as const,
  mayStrengthenWithoutMeasurement: false as const,
  mayInferDeviceCapabilityBeyondEvidence: false as const,
  mayCloneProprietaryIsa: false as const,
  mayModifyFirmware: false as const,
  mayUnsafeHardwareTune: false as const,
  mayAutomaticCloudPurchase: false as const,
  mayExpandPermissions: false as const,
  mayIncludeHiddenChainOfThought: false as const,
  mayRecommendOnly: true as const,
});

export const EQ11_MAY = Object.freeze([
  'describe_tasks_as_reusable_workload_primitives',
  'compare_architectures_by_workload_needs_not_vendor_name',
  'capture_task_meaning_to_learned_routing_policy',
  'strengthen_pathway_only_with_measured_results',
  'profile_vector_search_without_assuming_gpu_best',
  'keep_device_capabilities_within_evidence',
] as const);

export const EQ11_MUST_NOT = Object.freeze([
  'schedule_by_vendor_name_instead_of_workload_needs',
  'assume_gpu_is_always_best',
  'strengthen_pathway_without_measured_results',
  'infer_device_capability_beyond_evidence',
  'clone_proprietary_isa_or_modify_firmware',
  'unsafe_hardware_tune_or_automatic_cloud_purchase',
  'expand_permissions',
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

export type Eq11SoftWireSnapshot = {
  eq10InstructionSemanticsLearning: SoftWirePresence;
  eq10Report: SoftWirePresence;
  eq8ArmServerCloudRuntime: SoftWirePresence;
  eq8Report: SoftWirePresence;
  eq6ArchitectureCapabilityGraph: SoftWirePresence;
  eq6Report: SoftWirePresence;
  eq5CompilerIrTranslationLayer: SoftWirePresence;
  eq5Report: SoftWirePresence;
  eq1CrossArchitectureContract: SoftWirePresence;
  eq1Report: SoftWirePresence;
  em157HomeBase: SoftWirePresence;
};

export function assertEq11LocksIntact(): boolean {
  return (
    EQ11_LOCKS.L4_AUTONOMY_ENABLED === false &&
    EQ11_LOCKS.VENDOR_NAME_FIRST_SCHEDULING === false &&
    EQ11_LOCKS.ASSUME_GPU_ALWAYS_BEST === false &&
    EQ11_LOCKS.STRENGTHEN_WITHOUT_MEASUREMENT === false &&
    EQ11_LOCKS.INFER_DEVICE_CAPABILITY_BEYOND_EVIDENCE === false &&
    EQ11_LOCKS.PROPRIETARY_ISA_CLONING === false &&
    EQ11_LOCKS.FIRMWARE_MODIFICATION === false &&
    EQ11_LOCKS.UNSAFE_HARDWARE_TUNING === false &&
    EQ11_LOCKS.AUTOMATIC_CLOUD_PURCHASING === false &&
    EQ11_LOCKS.PERMISSION_EXPANSION === false &&
    EQ11_LOCKS.AGENT_AUTO_AUTHORITY === false &&
    EQ11_LOCKS.RECOMMEND_EQ_ACT === false &&
    EQ11_LOCKS.RECOMMEND_EQ_AUTHORIZE === false &&
    EQ11_LOCKS.HIDDEN_CHAIN_OF_THOUGHT_IN_EQ11 === false &&
    EQ11_LOCKS.BYPASS_GUARDIAN_RLS_TENANT_UNIVERSE === false &&
    EQ11_LOCKS.GUARDIAN_RLS_TENANT_UNIVERSE_ISOLATION_UNCHANGED === true &&
    EQ11_LOCKS.HUMAN_APPROVAL_BOUNDARIES_UNCHANGED === true &&
    EQ11_LOCKS.DOCUMENTED_EQ_IMPLEMENTED === false &&
    EQ11_LOCKS.IMPLEMENTED_EQ_VERIFIED === false &&
    EQ11_LOCKS.VERIFIED_EQ_PRODUCTION_AUTHORIZED === false &&
    EQ11_LOCKS.HUMAN_APPROVAL_REQUIRED_BEFORE_CONSEQUENTIAL_ACTIONS === true &&
    EQ11_LOCKS.TIP_LAND === false &&
    EQ11_LOCKS.PRODUCTION_AUTHORIZATION === false &&
    EQ11_LOCKS.DB_CANDIDATES_APPLIED === false &&
    EQ11_LOCKS.FULL_PRODUCTION_WORKLOAD_GENOME_SHIPPED === false &&
    EQ11_LOCKS.MANAGE_PULL_REQUEST === false &&
    VECTOR_SEARCH_EXAMPLE_PROFILE.assumeGpuAlwaysBest === false &&
    EQ11_AGENT_BOUNDS.automaticAuthority === false &&
    EQ11_AGENT_BOUNDS.mayScheduleByVendorNameFirst === false &&
    EQ11_AGENT_BOUNDS.mayAssumeGpuAlwaysBest === false &&
    EQ11_AGENT_BOUNDS.mayStrengthenWithoutMeasurement === false &&
    EQ11_AGENT_BOUNDS.mayInferDeviceCapabilityBeyondEvidence === false &&
    EQ11_AGENT_BOUNDS.mayCloneProprietaryIsa === false &&
    EQ11_AGENT_BOUNDS.mayModifyFirmware === false &&
    EQ11_AGENT_BOUNDS.mayUnsafeHardwareTune === false &&
    EQ11_AGENT_BOUNDS.mayAutomaticCloudPurchase === false &&
    EQ11_AGENT_BOUNDS.mayExpandPermissions === false &&
    EQ11_AGENT_BOUNDS.mayIncludeHiddenChainOfThought === false
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

export function eq11SoftWireSnapshot(repoRoot?: string): Eq11SoftWireSnapshot {
  const root =
    repoRoot ?? join(dirname(fileURLToPath(import.meta.url)), '../../..');

  return {
    eq10InstructionSemanticsLearning: softWireFile(
      './instruction-semantics-learning-types.ts',
      'EQ10 Instruction-Semantics Learning PRESENT (soft-wire).',
      'EQ10 Instruction-Semantics Learning absent — soft-wire WAITING_DATA.',
    ),
    eq10Report: softWireRepoRelative(
      root,
      'docs/operations/62L_EQ10_INSTRUCTION_SEMANTICS_LEARNING_REPORT.md',
      'EQ10 report PRESENT.',
      'EQ10 report absent — soft-wire WAITING_DATA.',
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
    eq1CrossArchitectureContract: softWireFile(
      './cross-architecture-contract-types.ts',
      'EQ1 Cross-Architecture Contract PRESENT (soft-wire).',
      'EQ1 Cross-Architecture Contract absent — soft-wire WAITING_DATA.',
    ),
    eq1Report: softWireRepoRelative(
      root,
      'docs/operations/62L_EQ1_CROSS_ARCHITECTURE_CONTRACT_REPORT.md',
      'EQ1 report PRESENT.',
      'EQ1 report absent — soft-wire WAITING_DATA.',
    ),
    em157HomeBase: softWireFile(
      './agent-compute-home-base-types.ts',
      'EM (#157) Agent Compute Home Base PRESENT (soft-wire).',
      'EM (#157) Agent Compute Home Base absent — soft-wire WAITING_DATA.',
    ),
  };
}

export function isHumanApprover(actor: Eq11Actor): boolean {
  return (
    actor.kind === 'human_approver' ||
    actor.kind === 'founder' ||
    actor.kind === 'tenant_admin'
  );
}

export function isEq11Agent(actor: Eq11Actor): boolean {
  const agents: readonly Eq11ActorKind[] = [
    'workload_genome_curator',
    'scheduler_advisor',
    'benchmark_ingest',
    'proposal',
  ];
  return agents.includes(actor.kind);
}

/**
 * Vendor-name-first scheduling is denied; needs-first required.
 */
export function vendorNameFirstScheduling(): false {
  return false;
}

/**
 * GPU is not assumed always best.
 */
export function assumeGpuAlwaysBest(): false {
  return false;
}

/**
 * Pathway strengthens only with measured results.
 */
export function canStrengthenPathway(input: {
  measuredResults: boolean;
  evidenceRefs: readonly string[];
}): boolean {
  return input.measuredResults && input.evidenceRefs.length > 0;
}
