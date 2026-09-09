/**
 * 62L-EQ9 — RISC-V Accelerator Research (park-and-implement).
 *
 * Dedicated RISC-V accelerator research layer so the Virtual Chip brain can
 * study open vector, embedded, AI/ML, and custom-extension ecosystems and
 * compare them against ARM, x86, GPU, and NPU paths.
 *
 * Core graph:
 * RISC-V ISA → Extension → Toolchain → Runtime → Device → Workload →
 * Benchmark → Outcome
 *
 * Verification ladder:
 * DOCUMENTED (extension) → DETECTED (chip exposes) → SUPPORTED (runtime/model)
 * → VERIFIED (successful bounded execution only)
 *
 * Open ISA: learn from published specs/open implementations; respect licenses.
 * Goal: XIV workload intelligence → portable runtime mapping → evidence-based
 * scheduler — not copying another vendor’s chip.
 *
 * Soft-wire when PRESENT: EQ8, EQ3, EQ6, EQ5, EQ1, EM (#157). Presence ≠ VERIFIED.
 *
 * SoT: GitHub #161 / 62L-EQ family. GitLab mirror: needsAuth; no number invented.
 *
 * Honesty: DOCUMENTED ≠ IMPLEMENTED ≠ VERIFIED ≠ PRODUCTION AUTHORIZED.
 * L4_AUTONOMY_ENABLED=false. Guardian/RLS/tenant/Universe unchanged.
 * DB candidates NOT_APPLIED. tip-land=NO.
 * Next (report only): EQ10 — Instruction-Semantics Learning.
 */

import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

export const HONESTY_BANNER =
  'DOCUMENTED ≠ IMPLEMENTED ≠ VERIFIED ≠ PRODUCTION AUTHORIZED' as const;

export const GITHUB_SOT_ISSUE = 161 as const;
export const GITHUB_SOT_LABEL = '62L-EQ9' as const;
export const GITHUB_SOT_FAMILY = '62L-EQ' as const;
export const GITHUB_SOT_TITLE =
  '62L-EQ9 RISC-V Accelerator Research — open vector/AI/embedded ecosystems; DOCUMENTED→DETECTED→SUPPORTED→VERIFIED; no proprietary RTL copy' as const;

export const GITLAB_MIRROR_NOTE =
  'GitLab mirror: search attempted; MCP needsAuth / not resolved in this environment — no issue number invented.' as const;

export const EQ9_DB_CANDIDATES_STATUS = 'NOT_APPLIED' as const;

export const NEXT_PHASE_TITLE =
  'EQ10 — Instruction-Semantics Learning — learn from public ARM/RISC-V/x86/compiler semantics to improve workload placement and runtime decisions without duplicating proprietary microarchitecture.' as const;

/**
 * Research pack tracking dimensions.
 */
export const RISCV_ACCELERATOR_RESEARCH_DIMENSIONS = [
  'riscv_base_isa_version',
  'vector_extension_support',
  'matrix_ai_oriented_extensions_public',
  'embedded_edge_implementations',
  'accelerator_coproc_architecture',
  'compiler_toolchain_support',
  'linux_rtos_runtime_support',
  'onnx_ml_framework_compatibility',
  'model_operator_coverage',
  'memory_limits',
  'power_energy_characteristics',
  'public_benchmark_evidence',
  'device_availability',
  'verification_state',
] as const;

/**
 * Core research graph pathway.
 */
export const RISCV_ACCELERATOR_CORE_GRAPH = [
  'riscv_isa',
  'extension',
  'toolchain',
  'runtime',
  'device',
  'workload',
  'benchmark',
  'outcome',
] as const;

/**
 * Research focus domains where RISC-V may be strong.
 */
export const RISCV_RESEARCH_FOCUS_DOMAINS = [
  'low_power_edge_ai',
  'industrial_systems',
  'embedded_control',
  'sensor_processing',
  'vector_workloads',
  'custom_accelerators',
  'robotics',
  'telecom_edge_devices',
  'smart_logistics_hardware',
  'future_xiv_compatible_compute_appliances',
] as const;

/**
 * Comparison peer paths (device-neutral).
 */
export const COMPARISON_PEER_PATHS = [
  'arm',
  'x86',
  'gpu',
  'npu',
] as const;

/**
 * Verification ladder states.
 */
export const RISCV_ACCELERATOR_VERIFICATION_STATES = [
  'DOCUMENTED',
  'DETECTED',
  'SUPPORTED',
  'VERIFIED',
  'PARTIAL',
  'NOT_TESTED',
  'UNAVAILABLE',
] as const;

export type RiscvAcceleratorVerificationState =
  (typeof RISCV_ACCELERATOR_VERIFICATION_STATES)[number];

/**
 * Ladder order for evidence-based advance.
 */
export const VERIFICATION_LADDER_ORDER = [
  'DOCUMENTED',
  'DETECTED',
  'SUPPORTED',
  'VERIFIED',
] as const;

/**
 * Proprietary boundary blocks (even with open base ISA).
 */
export const RISCV_PROPRIETARY_BOUNDARY_BLOCKS = [
  'proprietary_rtl_copy',
  'private_extensions',
  'firmware_ingestion',
  'confidential_implementation_details',
] as const;

/**
 * Governance denies.
 */
export const EQ9_GOVERNANCE_DENIES = [
  'firmware_modification',
  'hardware_reprogramming',
  'unsafe_physical_control',
  'production_deployment',
  'permission_expansion',
] as const;

/**
 * Open-ISA learning intent (not chip copy).
 */
export const OPEN_ISA_LEARNING_GOAL = [
  'xiv_workload_intelligence',
  'portable_runtime_mapping',
  'evidence_based_scheduler',
] as const;

export const RISCV_ACCELERATOR_RESEARCH_CYCLE = [
  'honesty_locks',
  'riscv_accelerator_research_bootstrap',
  // A — Structure
  'research_dimensions_encoded',
  'core_graph_encoded',
  'focus_domains_encoded',
  'verification_ladder_encoded',
  'open_isa_learning_goal_encoded',
  // B — Truth
  'documented_neq_detected',
  'detected_neq_supported',
  'supported_neq_verified_without_execution',
  'open_isa_learn_not_chip_copy',
  // C — Denies
  'deny_skip_verification_ladder',
  'deny_verified_without_bounded_execution',
  'deny_proprietary_rtl_copy',
  'deny_private_extensions',
  'deny_firmware_ingestion',
  'deny_confidential_implementation_details',
  'deny_firmware_modification',
  'deny_hardware_reprogramming',
  'deny_unsafe_physical_control',
  'deny_production_deployment',
  'deny_permission_expansion',
  // D — Autonomy
  'guardian_rls_tenant_universe_isolation',
  'recommend_neq_act',
  'l4_autonomy_false',
  // E — Soft-wires
  'eq8_soft_wire',
  'eq3_soft_wire',
  'eq6_soft_wire',
  'eq5_soft_wire',
  'eq1_soft_wire',
  'em157_soft_wire',
  'db_candidates_not_applied',
  'evidence',
] as const;

export type Eq9Hop = (typeof RISCV_ACCELERATOR_RESEARCH_CYCLE)[number];

export type Eq9EvidenceState =
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
  | 'DETECTED'
  | 'SUPPORTED';

export type Eq9HopRecord = {
  hop: Eq9Hop;
  state: Eq9EvidenceState;
  summary: string;
  at: string;
};

export type Eq9ActorKind =
  | 'riscv_accelerator_researcher'
  | 'extension_curator'
  | 'scheduler_advisor'
  | 'proposal'
  | 'human_approver'
  | 'founder'
  | 'guardian'
  | 'home_base'
  | 'tenant_admin';

export type Eq9Actor = {
  kind: Eq9ActorKind;
  id: string;
  orgId: string;
  tenantId: string;
  universeId: string;
  permissions: readonly string[];
};

export const EQ9_LOCKS = Object.freeze({
  L4_AUTONOMY_ENABLED: false as const,
  TIP_LAND: false as const,
  PRODUCTION_AUTHORIZATION: false as const,
  PRODUCTION_WRITE: false as const,
  DB_CANDIDATES_APPLIED: false as const,
  FULL_PRODUCTION_RISCV_ACCELERATOR_RESEARCH_SHIPPED: false as const,
  MANAGE_PULL_REQUEST: false as const,

  // Verification honesty
  DOCUMENTED_EQ_DETECTED: false as const,
  DETECTED_EQ_SUPPORTED: false as const,
  SUPPORTED_EQ_VERIFIED: false as const,
  SKIP_VERIFICATION_LADDER: false as const,
  VERIFIED_WITHOUT_BOUNDED_EXECUTION: false as const,
  OPEN_ISA_EQ_CHIP_COPY: false as const,

  // Proprietary boundary
  PROPRIETARY_RTL_COPY: false as const,
  PRIVATE_EXTENSIONS: false as const,
  FIRMWARE_INGESTION: false as const,
  CONFIDENTIAL_IMPLEMENTATION_DETAILS: false as const,

  // Governance
  FIRMWARE_MODIFICATION: false as const,
  HARDWARE_REPROGRAMMING: false as const,
  UNSAFE_PHYSICAL_CONTROL: false as const,
  PRODUCTION_DEPLOYMENT: false as const,
  PERMISSION_EXPANSION: false as const,

  // Autonomy
  AGENT_AUTO_AUTHORITY: false as const,
  RECOMMEND_EQ_ACT: false as const,
  RECOMMEND_EQ_AUTHORIZE: false as const,
  HIDDEN_CHAIN_OF_THOUGHT_IN_EQ9: false as const,

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

export const EQ9_AGENT_BOUNDS = Object.freeze({
  mayResearchPublicRiscvAcceleratorEcosystems: true as const,
  mayAdvanceVerificationLadderWithEvidence: true as const,
  mayCompareAgainstArmX86GpuNpu: true as const,
  mayBuildWorkloadIntelligenceMapping: true as const,
  mayReturnEvidenceToHomeBase: true as const,
  automaticAuthority: false as const,
  maySkipVerificationLadder: false as const,
  mayMarkVerifiedWithoutBoundedExecution: false as const,
  mayEquateOpenIsaWithChipCopy: false as const,
  mayCopyProprietaryRtl: false as const,
  mayIngestPrivateExtensions: false as const,
  mayIngestFirmware: false as const,
  mayIngestConfidentialImplementationDetails: false as const,
  mayModifyFirmware: false as const,
  mayReprogramHardware: false as const,
  mayUnsafePhysicalControl: false as const,
  mayDeployProduction: false as const,
  mayExpandPermissions: false as const,
  mayIncludeHiddenChainOfThought: false as const,
  mayRecommendOnly: true as const,
});

export const EQ9_MAY = Object.freeze([
  'study_open_vector_embedded_ai_custom_extension_ecosystems',
  'advance_documented_detected_supported_verified_with_evidence',
  'compare_riscv_accelerator_paths_to_arm_x86_gpu_npu',
  'build_xiv_workload_intelligence_and_portable_runtime_mapping',
  'learn_from_public_specs_respecting_third_party_licenses',
  'keep_proprietary_rtl_and_private_extensions_out',
] as const);

export const EQ9_MUST_NOT = Object.freeze([
  'skip_verification_ladder_or_verify_without_bounded_execution',
  'equate_open_isa_learning_with_copying_vendor_chips',
  'copy_proprietary_rtl_private_extensions_or_firmware',
  'ingest_confidential_implementation_details',
  'modify_firmware_reprogram_hardware_or_unsafe_physical_control',
  'deploy_production_or_expand_permissions',
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

export type Eq9SoftWireSnapshot = {
  eq8ArmServerCloudRuntime: SoftWirePresence;
  eq8Report: SoftWirePresence;
  eq3RiscvOpenIsaKnowledgePack: SoftWirePresence;
  eq3Report: SoftWirePresence;
  eq6ArchitectureCapabilityGraph: SoftWirePresence;
  eq6Report: SoftWirePresence;
  eq5CompilerIrTranslationLayer: SoftWirePresence;
  eq5Report: SoftWirePresence;
  eq1CrossArchitectureContract: SoftWirePresence;
  eq1Report: SoftWirePresence;
  em157HomeBase: SoftWirePresence;
};

export function assertEq9LocksIntact(): boolean {
  return (
    EQ9_LOCKS.L4_AUTONOMY_ENABLED === false &&
    EQ9_LOCKS.DOCUMENTED_EQ_DETECTED === false &&
    EQ9_LOCKS.DETECTED_EQ_SUPPORTED === false &&
    EQ9_LOCKS.SUPPORTED_EQ_VERIFIED === false &&
    EQ9_LOCKS.SKIP_VERIFICATION_LADDER === false &&
    EQ9_LOCKS.VERIFIED_WITHOUT_BOUNDED_EXECUTION === false &&
    EQ9_LOCKS.OPEN_ISA_EQ_CHIP_COPY === false &&
    EQ9_LOCKS.PROPRIETARY_RTL_COPY === false &&
    EQ9_LOCKS.PRIVATE_EXTENSIONS === false &&
    EQ9_LOCKS.FIRMWARE_INGESTION === false &&
    EQ9_LOCKS.CONFIDENTIAL_IMPLEMENTATION_DETAILS === false &&
    EQ9_LOCKS.FIRMWARE_MODIFICATION === false &&
    EQ9_LOCKS.HARDWARE_REPROGRAMMING === false &&
    EQ9_LOCKS.UNSAFE_PHYSICAL_CONTROL === false &&
    EQ9_LOCKS.PRODUCTION_DEPLOYMENT === false &&
    EQ9_LOCKS.PERMISSION_EXPANSION === false &&
    EQ9_LOCKS.AGENT_AUTO_AUTHORITY === false &&
    EQ9_LOCKS.RECOMMEND_EQ_ACT === false &&
    EQ9_LOCKS.RECOMMEND_EQ_AUTHORIZE === false &&
    EQ9_LOCKS.HIDDEN_CHAIN_OF_THOUGHT_IN_EQ9 === false &&
    EQ9_LOCKS.BYPASS_GUARDIAN_RLS_TENANT_UNIVERSE === false &&
    EQ9_LOCKS.GUARDIAN_RLS_TENANT_UNIVERSE_ISOLATION_UNCHANGED === true &&
    EQ9_LOCKS.HUMAN_APPROVAL_BOUNDARIES_UNCHANGED === true &&
    EQ9_LOCKS.DOCUMENTED_EQ_IMPLEMENTED === false &&
    EQ9_LOCKS.IMPLEMENTED_EQ_VERIFIED === false &&
    EQ9_LOCKS.VERIFIED_EQ_PRODUCTION_AUTHORIZED === false &&
    EQ9_LOCKS.HUMAN_APPROVAL_REQUIRED_BEFORE_CONSEQUENTIAL_ACTIONS === true &&
    EQ9_LOCKS.TIP_LAND === false &&
    EQ9_LOCKS.PRODUCTION_AUTHORIZATION === false &&
    EQ9_LOCKS.DB_CANDIDATES_APPLIED === false &&
    EQ9_LOCKS.FULL_PRODUCTION_RISCV_ACCELERATOR_RESEARCH_SHIPPED === false &&
    EQ9_LOCKS.MANAGE_PULL_REQUEST === false &&
    EQ9_AGENT_BOUNDS.automaticAuthority === false &&
    EQ9_AGENT_BOUNDS.maySkipVerificationLadder === false &&
    EQ9_AGENT_BOUNDS.mayMarkVerifiedWithoutBoundedExecution === false &&
    EQ9_AGENT_BOUNDS.mayEquateOpenIsaWithChipCopy === false &&
    EQ9_AGENT_BOUNDS.mayCopyProprietaryRtl === false &&
    EQ9_AGENT_BOUNDS.mayIngestPrivateExtensions === false &&
    EQ9_AGENT_BOUNDS.mayIngestFirmware === false &&
    EQ9_AGENT_BOUNDS.mayIngestConfidentialImplementationDetails === false &&
    EQ9_AGENT_BOUNDS.mayModifyFirmware === false &&
    EQ9_AGENT_BOUNDS.mayReprogramHardware === false &&
    EQ9_AGENT_BOUNDS.mayUnsafePhysicalControl === false &&
    EQ9_AGENT_BOUNDS.mayDeployProduction === false &&
    EQ9_AGENT_BOUNDS.mayExpandPermissions === false &&
    EQ9_AGENT_BOUNDS.mayIncludeHiddenChainOfThought === false
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

export function eq9SoftWireSnapshot(repoRoot?: string): Eq9SoftWireSnapshot {
  const root =
    repoRoot ?? join(dirname(fileURLToPath(import.meta.url)), '../../..');

  return {
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
    eq3RiscvOpenIsaKnowledgePack: softWireFile(
      './riscv-open-isa-knowledge-pack-types.ts',
      'EQ3 RISC-V Open ISA Knowledge Pack PRESENT (soft-wire).',
      'EQ3 RISC-V Open ISA Knowledge Pack absent — soft-wire WAITING_DATA.',
    ),
    eq3Report: softWireRepoRelative(
      root,
      'docs/operations/62L_EQ3_RISCV_OPEN_ISA_KNOWLEDGE_PACK_REPORT.md',
      'EQ3 report PRESENT.',
      'EQ3 report absent — soft-wire WAITING_DATA.',
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

export function isHumanApprover(actor: Eq9Actor): boolean {
  return (
    actor.kind === 'human_approver' ||
    actor.kind === 'founder' ||
    actor.kind === 'tenant_admin'
  );
}

export function isEq9Agent(actor: Eq9Actor): boolean {
  const agents: readonly Eq9ActorKind[] = [
    'riscv_accelerator_researcher',
    'extension_curator',
    'scheduler_advisor',
    'proposal',
  ];
  return agents.includes(actor.kind);
}

export function verificationLadderRank(
  state: RiscvAcceleratorVerificationState,
): number {
  const idx = (VERIFICATION_LADDER_ORDER as readonly string[]).indexOf(state);
  return idx;
}

/**
 * Open ISA learning does not equal copying a vendor chip.
 */
export function openIsaImpliesChipCopy(): false {
  return false;
}

/**
 * VERIFIED requires successful bounded execution evidence.
 */
export function canMarkVerified(input: {
  from: RiscvAcceleratorVerificationState;
  boundedExecutionSucceeded: boolean;
  evidenceRefs: readonly string[];
}): boolean {
  if (input.from !== 'SUPPORTED' && input.from !== 'PARTIAL') return false;
  if (!input.boundedExecutionSucceeded) return false;
  if (input.evidenceRefs.length === 0) return false;
  return true;
}
