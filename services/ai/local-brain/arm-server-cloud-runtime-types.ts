/**
 * 62L-EQ8 — ARM Server / Cloud Runtime Research (park-and-implement).
 *
 * Understand ARM server and cloud runtime capabilities so the Virtual Chip
 * scheduler can compare ARM-based infrastructure against x86, GPU, NPU, edge,
 * and other verified compute options.
 *
 * Core flow:
 * Workload → capability requirements → ARM server candidates →
 * benchmark/cost comparison → scheduler recommendation → authorized execution
 *
 * Cloud truth: provider in registry = DOCUMENTED until account/region/runtime/
 * quotas/workload actually tested. No autonomous provision/scale/purchase.
 *
 * Soft-wire when PRESENT: EQ7, EQ6, EQ5, EQ2, EQ1, EM (#157). Presence ≠ VERIFIED.
 *
 * SoT: GitHub #161 / 62L-EQ family. GitLab mirror: needsAuth; no number invented.
 *
 * Honesty: DOCUMENTED ≠ IMPLEMENTED ≠ VERIFIED ≠ PRODUCTION AUTHORIZED.
 * L4_AUTONOMY_ENABLED=false. Guardian/RLS/tenant/Universe unchanged.
 * DB candidates NOT_APPLIED. tip-land=NO.
 * Next (report only): EQ9 — RISC-V Accelerator Research.
 */

import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

export const HONESTY_BANNER =
  'DOCUMENTED ≠ IMPLEMENTED ≠ VERIFIED ≠ PRODUCTION AUTHORIZED' as const;

export const GITHUB_SOT_ISSUE = 161 as const;
export const GITHUB_SOT_LABEL = '62L-EQ8' as const;
export const GITHUB_SOT_FAMILY = '62L-EQ' as const;
export const GITHUB_SOT_TITLE =
  '62L-EQ8 ARM Server/Cloud Runtime Research — compare ARM vs x86/GPU/edge; cloud registry=DOCUMENTED until tested; no autonomous provision' as const;

export const GITLAB_MIRROR_NOTE =
  'GitLab mirror: search attempted; MCP needsAuth / not resolved in this environment — no issue number invented.' as const;

export const EQ8_DB_CANDIDATES_STATUS = 'NOT_APPLIED' as const;

export const NEXT_PHASE_TITLE =
  'EQ9 — RISC-V Accelerator Research — study open RISC-V vector/AI/embedded accelerator ecosystems and map them into the same device-neutral compute graph.' as const;

/**
 * Research pack tracking dimensions.
 */
export const ARM_SERVER_CLOUD_RESEARCH_DIMENSIONS = [
  'arm_server_families',
  'core_count_memory_topology',
  'virtualization_container_support',
  'linux_runtime_compatibility',
  'compiler_toolchain_support',
  'inference_runtime_support',
  'cloud_availability',
  'storage_network_characteristics',
  'measured_latency_throughput',
  'cost_per_workload',
  'energy_proxy',
  'reliability',
  'region_data_locality_constraints',
  'benchmark_freshness',
] as const;

/**
 * Core scheduler research flow.
 */
export const ARM_SERVER_CLOUD_CORE_FLOW = [
  'workload',
  'capability_requirements',
  'arm_server_candidates',
  'benchmark_cost_comparison',
  'scheduler_recommendation',
  'authorized_execution',
] as const;

/**
 * Comparison matrix candidate classes (same metrics).
 */
export const COMPARISON_CANDIDATE_CLASSES = [
  'arm_cpu_server',
  'x86_cpu_server',
  'gpu_server',
  'local_asus_node',
  'edge_node',
  'authorized_cloud_accelerator',
] as const;

export type ComparisonCandidateClass =
  (typeof COMPARISON_CANDIDATE_CLASSES)[number];

/**
 * Shared comparison metrics.
 */
export const COMPARISON_METRICS = [
  'latency',
  'throughput',
  'memory',
  'cost',
  'energy_proxy',
  'reliability',
  'privacy_locality',
  'scaling_behavior',
] as const;

export type ComparisonMetric = (typeof COMPARISON_METRICS)[number];

/**
 * Cloud / research evidence states.
 */
export const ARM_SERVER_CLOUD_EVIDENCE_STATES = [
  'DOCUMENTED',
  'DETECTED',
  'SUPPORTED',
  'VERIFIED',
  'PARTIAL',
  'STALE',
  'NOT_TESTED',
  'UNAVAILABLE',
  'RECOMMENDATION_ONLY',
] as const;

export type ArmServerCloudEvidenceState =
  (typeof ARM_SERVER_CLOUD_EVIDENCE_STATES)[number];

/**
 * Cloud truth boundary — registry appearance ≠ tested.
 */
export const CLOUD_TRUTH_BOUNDARY = Object.freeze({
  registryAppearanceMeans: 'DOCUMENTED' as const,
  requiresAccountTested: true as const,
  requiresRegionTested: true as const,
  requiresRuntimeTested: true as const,
  requiresQuotasTested: true as const,
  requiresWorkloadTested: true as const,
  autonomousProvisioning: false as const,
  autonomousScaling: false as const,
  autonomousPurchasing: false as const,
});

/**
 * XIV proprietary economics brain path (XIV-owned intelligence).
 */
export const XIV_ECONOMICS_BRAIN_PATH = [
  'workload_profile',
  'best_architecture',
  'best_runtime',
  'best_placement',
  'evidence_backed_route',
] as const;

/**
 * Security denies.
 */
export const EQ8_SECURITY_DENIES = [
  'cross_tenant_data_pooling',
  'unrestricted_cloud_movement',
  'credential_harvesting',
  'hidden_resource_creation',
  'production_deployment_without_human_authorization',
] as const;

export const ARM_SERVER_CLOUD_RUNTIME_CYCLE = [
  'honesty_locks',
  'arm_server_cloud_runtime_bootstrap',
  // A — Structure
  'research_dimensions_encoded',
  'core_flow_encoded',
  'comparison_matrix_encoded',
  'comparison_metrics_encoded',
  'cloud_truth_boundary_encoded',
  'economics_brain_path_encoded',
  // B — Truth
  'cloud_registry_eq_documented_until_tested',
  'recommendation_neq_authorized_execution',
  'xiv_owned_economics_intelligence',
  // C — Denies
  'deny_autonomous_provisioning',
  'deny_autonomous_scaling',
  'deny_autonomous_purchasing',
  'deny_equate_registry_with_verified',
  'deny_cross_tenant_data_pooling',
  'deny_unrestricted_cloud_movement',
  'deny_credential_harvesting',
  'deny_hidden_resource_creation',
  'deny_production_without_human_auth',
  // D — Autonomy
  'guardian_rls_tenant_universe_isolation',
  'recommend_neq_act',
  'l4_autonomy_false',
  // E — Soft-wires
  'eq7_soft_wire',
  'eq6_soft_wire',
  'eq5_soft_wire',
  'eq2_soft_wire',
  'eq1_soft_wire',
  'em157_soft_wire',
  'db_candidates_not_applied',
  'evidence',
] as const;

export type Eq8Hop = (typeof ARM_SERVER_CLOUD_RUNTIME_CYCLE)[number];

export type Eq8EvidenceState =
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
  | 'DETECTED'
  | 'SUPPORTED';

export type Eq8HopRecord = {
  hop: Eq8Hop;
  state: Eq8EvidenceState;
  summary: string;
  at: string;
};

export type Eq8ActorKind =
  | 'arm_server_researcher'
  | 'cloud_registry_curator'
  | 'scheduler_advisor'
  | 'proposal'
  | 'human_approver'
  | 'founder'
  | 'guardian'
  | 'home_base'
  | 'tenant_admin';

export type Eq8Actor = {
  kind: Eq8ActorKind;
  id: string;
  orgId: string;
  tenantId: string;
  universeId: string;
  permissions: readonly string[];
};

export const EQ8_LOCKS = Object.freeze({
  L4_AUTONOMY_ENABLED: false as const,
  TIP_LAND: false as const,
  PRODUCTION_AUTHORIZATION: false as const,
  PRODUCTION_WRITE: false as const,
  DB_CANDIDATES_APPLIED: false as const,
  FULL_PRODUCTION_ARM_SERVER_CLOUD_SHIPPED: false as const,
  MANAGE_PULL_REQUEST: false as const,

  // Cloud truth
  CLOUD_REGISTRY_EQ_VERIFIED: false as const,
  AUTONOMOUS_PROVISIONING: false as const,
  AUTONOMOUS_SCALING: false as const,
  AUTONOMOUS_PURCHASING: false as const,
  RECOMMENDATION_EQ_AUTHORIZED_EXECUTION: false as const,

  // Security
  CROSS_TENANT_DATA_POOLING: false as const,
  UNRESTRICTED_CLOUD_MOVEMENT: false as const,
  CREDENTIAL_HARVESTING: false as const,
  HIDDEN_RESOURCE_CREATION: false as const,
  PRODUCTION_DEPLOYMENT_WITHOUT_HUMAN_AUTHORIZATION: false as const,

  // Autonomy
  AGENT_AUTO_AUTHORITY: false as const,
  RECOMMEND_EQ_ACT: false as const,
  RECOMMEND_EQ_AUTHORIZE: false as const,
  HIDDEN_CHAIN_OF_THOUGHT_IN_EQ8: false as const,

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

export const EQ8_AGENT_BOUNDS = Object.freeze({
  mayResearchArmServerCloudCapabilities: true as const,
  mayBuildComparisonMatrix: true as const,
  mayEmitSchedulerRecommendations: true as const,
  mayRecordXivEconomicsBrainRoutes: true as const,
  mayReturnEvidenceToHomeBase: true as const,
  automaticAuthority: false as const,
  mayEquateCloudRegistryWithVerified: false as const,
  mayAutonomousProvision: false as const,
  mayAutonomousScale: false as const,
  mayAutonomousPurchase: false as const,
  mayTreatRecommendationAsAuthorizedExecution: false as const,
  mayPoolCrossTenantData: false as const,
  mayUnrestrictedCloudMove: false as const,
  mayHarvestCredentials: false as const,
  mayCreateHiddenResources: false as const,
  mayDeployProductionWithoutHumanAuth: false as const,
  mayIncludeHiddenChainOfThought: false as const,
  mayRecommendOnly: true as const,
});

export const EQ8_MAY = Object.freeze([
  'track_arm_server_cloud_research_dimensions',
  'compare_arm_x86_gpu_asus_edge_cloud_on_shared_metrics',
  'keep_cloud_registry_documented_until_actually_tested',
  'emit_scheduler_recommendations_not_auto_execution',
  'build_xiv_owned_cross_architecture_economics_brain',
  'require_human_authorization_before_execution',
] as const);

export const EQ8_MUST_NOT = Object.freeze([
  'equate_cloud_registry_appearance_with_verified',
  'autonomously_provision_scale_or_purchase',
  'treat_recommendation_as_authorized_execution',
  'pool_cross_tenant_data_or_unrestricted_cloud_move',
  'harvest_credentials_or_create_hidden_resources',
  'deploy_production_without_human_authorization',
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

export type Eq8SoftWireSnapshot = {
  eq7ArmEdgeAmdAcceleration: SoftWirePresence;
  eq7Report: SoftWirePresence;
  eq6ArchitectureCapabilityGraph: SoftWirePresence;
  eq6Report: SoftWirePresence;
  eq5CompilerIrTranslationLayer: SoftWirePresence;
  eq5Report: SoftWirePresence;
  eq2ArmArchitectureKnowledgePack: SoftWirePresence;
  eq2Report: SoftWirePresence;
  eq1CrossArchitectureContract: SoftWirePresence;
  eq1Report: SoftWirePresence;
  em157HomeBase: SoftWirePresence;
};

export function assertEq8LocksIntact(): boolean {
  return (
    EQ8_LOCKS.L4_AUTONOMY_ENABLED === false &&
    EQ8_LOCKS.CLOUD_REGISTRY_EQ_VERIFIED === false &&
    EQ8_LOCKS.AUTONOMOUS_PROVISIONING === false &&
    EQ8_LOCKS.AUTONOMOUS_SCALING === false &&
    EQ8_LOCKS.AUTONOMOUS_PURCHASING === false &&
    EQ8_LOCKS.RECOMMENDATION_EQ_AUTHORIZED_EXECUTION === false &&
    EQ8_LOCKS.CROSS_TENANT_DATA_POOLING === false &&
    EQ8_LOCKS.UNRESTRICTED_CLOUD_MOVEMENT === false &&
    EQ8_LOCKS.CREDENTIAL_HARVESTING === false &&
    EQ8_LOCKS.HIDDEN_RESOURCE_CREATION === false &&
    EQ8_LOCKS.PRODUCTION_DEPLOYMENT_WITHOUT_HUMAN_AUTHORIZATION === false &&
    EQ8_LOCKS.AGENT_AUTO_AUTHORITY === false &&
    EQ8_LOCKS.RECOMMEND_EQ_ACT === false &&
    EQ8_LOCKS.RECOMMEND_EQ_AUTHORIZE === false &&
    EQ8_LOCKS.HIDDEN_CHAIN_OF_THOUGHT_IN_EQ8 === false &&
    EQ8_LOCKS.BYPASS_GUARDIAN_RLS_TENANT_UNIVERSE === false &&
    EQ8_LOCKS.GUARDIAN_RLS_TENANT_UNIVERSE_ISOLATION_UNCHANGED === true &&
    EQ8_LOCKS.HUMAN_APPROVAL_BOUNDARIES_UNCHANGED === true &&
    EQ8_LOCKS.DOCUMENTED_EQ_IMPLEMENTED === false &&
    EQ8_LOCKS.IMPLEMENTED_EQ_VERIFIED === false &&
    EQ8_LOCKS.VERIFIED_EQ_PRODUCTION_AUTHORIZED === false &&
    EQ8_LOCKS.HUMAN_APPROVAL_REQUIRED_BEFORE_CONSEQUENTIAL_ACTIONS === true &&
    EQ8_LOCKS.TIP_LAND === false &&
    EQ8_LOCKS.PRODUCTION_AUTHORIZATION === false &&
    EQ8_LOCKS.DB_CANDIDATES_APPLIED === false &&
    EQ8_LOCKS.FULL_PRODUCTION_ARM_SERVER_CLOUD_SHIPPED === false &&
    EQ8_LOCKS.MANAGE_PULL_REQUEST === false &&
    CLOUD_TRUTH_BOUNDARY.autonomousProvisioning === false &&
    CLOUD_TRUTH_BOUNDARY.autonomousScaling === false &&
    CLOUD_TRUTH_BOUNDARY.autonomousPurchasing === false &&
    CLOUD_TRUTH_BOUNDARY.registryAppearanceMeans === 'DOCUMENTED' &&
    EQ8_AGENT_BOUNDS.automaticAuthority === false &&
    EQ8_AGENT_BOUNDS.mayEquateCloudRegistryWithVerified === false &&
    EQ8_AGENT_BOUNDS.mayAutonomousProvision === false &&
    EQ8_AGENT_BOUNDS.mayAutonomousScale === false &&
    EQ8_AGENT_BOUNDS.mayAutonomousPurchase === false &&
    EQ8_AGENT_BOUNDS.mayTreatRecommendationAsAuthorizedExecution === false &&
    EQ8_AGENT_BOUNDS.mayPoolCrossTenantData === false &&
    EQ8_AGENT_BOUNDS.mayUnrestrictedCloudMove === false &&
    EQ8_AGENT_BOUNDS.mayHarvestCredentials === false &&
    EQ8_AGENT_BOUNDS.mayCreateHiddenResources === false &&
    EQ8_AGENT_BOUNDS.mayDeployProductionWithoutHumanAuth === false &&
    EQ8_AGENT_BOUNDS.mayIncludeHiddenChainOfThought === false
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

export function eq8SoftWireSnapshot(repoRoot?: string): Eq8SoftWireSnapshot {
  const root =
    repoRoot ?? join(dirname(fileURLToPath(import.meta.url)), '../../..');

  return {
    eq7ArmEdgeAmdAcceleration: softWireFile(
      './arm-edge-amd-acceleration-types.ts',
      'EQ7 ARM Edge/Phone + AMD Acceleration PRESENT (soft-wire).',
      'EQ7 ARM Edge/Phone + AMD Acceleration absent — soft-wire WAITING_DATA.',
    ),
    eq7Report: softWireRepoRelative(
      root,
      'docs/operations/62L_EQ7_ARM_EDGE_AMD_ACCELERATION_REPORT.md',
      'EQ7 report PRESENT.',
      'EQ7 report absent — soft-wire WAITING_DATA.',
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

export function isHumanApprover(actor: Eq8Actor): boolean {
  return (
    actor.kind === 'human_approver' ||
    actor.kind === 'founder' ||
    actor.kind === 'tenant_admin'
  );
}

export function isEq8Agent(actor: Eq8Actor): boolean {
  const agents: readonly Eq8ActorKind[] = [
    'arm_server_researcher',
    'cloud_registry_curator',
    'scheduler_advisor',
    'proposal',
  ];
  return agents.includes(actor.kind);
}

/**
 * Cloud provider in registry is DOCUMENTED until fully tested.
 */
export function cloudRegistryImpliesVerified(): false {
  return false;
}

/**
 * VERIFIED cloud entry requires account, region, runtime, quotas, workload tested.
 */
export function canMarkCloudVerified(input: {
  accountTested: boolean;
  regionTested: boolean;
  runtimeTested: boolean;
  quotasTested: boolean;
  workloadTested: boolean;
}): boolean {
  return (
    input.accountTested &&
    input.regionTested &&
    input.runtimeTested &&
    input.quotasTested &&
    input.workloadTested
  );
}

/**
 * Recommendation is not authorized execution.
 */
export function recommendationImpliesAuthorizedExecution(): false {
  return false;
}
