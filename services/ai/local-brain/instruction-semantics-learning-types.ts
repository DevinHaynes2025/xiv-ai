/**
 * 62L-EQ10 — Instruction-Semantics Learning (park-and-implement).
 *
 * Agents learn from public ISA semantics and compiler behavior so the Virtual
 * Chip brain can better map workloads to architectures without copying
 * proprietary microarchitecture.
 *
 * Key object is not “copy this instruction set.” It is:
 * operation need → architecture capability → runtime support → measured outcome
 *
 * Neural pathway:
 * Workload → operation class → compiler/IR → architecture feature → runtime →
 * device → benchmark → lesson
 *
 * Measured success strengthens the path; regression or stale evidence weakens it.
 * No generated architecture claim becomes VERIFIED without actual runtime evidence.
 *
 * Soft-wire when PRESENT: EQ9, EQ5, EQ4, EQ3, EQ2, EQ1, EM (#157). Presence ≠ VERIFIED.
 *
 * SoT: GitHub #161 / 62L-EQ family. GitLab mirror: needsAuth; no number invented.
 *
 * Honesty: DOCUMENTED ≠ IMPLEMENTED ≠ VERIFIED ≠ PRODUCTION AUTHORIZED.
 * L4_AUTONOMY_ENABLED=false. Guardian/RLS/tenant/Universe unchanged.
 * DB candidates NOT_APPLIED. tip-land=NO.
 * Next (report only): EQ11 — Device-Neutral Workload Genome.
 */

import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

export const HONESTY_BANNER =
  'DOCUMENTED ≠ IMPLEMENTED ≠ VERIFIED ≠ PRODUCTION AUTHORIZED' as const;

export const GITHUB_SOT_ISSUE = 161 as const;
export const GITHUB_SOT_LABEL = '62L-EQ10' as const;
export const GITHUB_SOT_FAMILY = '62L-EQ' as const;
export const GITHUB_SOT_TITLE =
  '62L-EQ10 Instruction-Semantics Learning — public ISA/compiler semantics→workload mapping; operation need≠ISA copy; VERIFIED needs runtime evidence' as const;

export const GITLAB_MIRROR_NOTE =
  'GitLab mirror: search attempted; MCP needsAuth / not resolved in this environment — no issue number invented.' as const;

export const EQ10_DB_CANDIDATES_STATUS = 'NOT_APPLIED' as const;

export const NEXT_PHASE_TITLE =
  'EQ11 — Device-Neutral Workload Genome — define reusable workload primitives (attention, matmul, search, graph traversal, simulation, encoding, optimization) so every architecture can be compared against the same computational needs.' as const;

/**
 * Learning focus dimensions (public semantics / compiler behavior).
 */
export const INSTRUCTION_SEMANTICS_LEARNING_FOCI = [
  'arithmetic_vector_instruction_classes',
  'memory_access_patterns',
  'atomics_synchronization',
  'branch_control_flow',
  'simd_vector_behavior',
  'matrix_tensor_relevant_operations',
  'compiler_lowering_patterns',
  'runtime_operator_mappings',
  'precision_support',
  'memory_model_constraints',
  'portability_limits',
] as const;

/**
 * Core learning flow.
 */
export const INSTRUCTION_SEMANTICS_CORE_FLOW = [
  'public_isa_runtime_docs',
  'semantic_classes',
  'workload_requirements',
  'compiler_ir_mapping',
  'device_candidates',
  'benchmarks',
  'structured_lesson',
] as const;

/**
 * Key mapping object (not ISA copy).
 */
export const OPERATION_NEED_MAPPING = [
  'operation_need',
  'architecture_capability',
  'runtime_support',
  'measured_outcome',
] as const;

/**
 * Neural pathway structure.
 */
export const SEMANTICS_NEURAL_PATHWAY = [
  'workload',
  'operation_class',
  'compiler_ir',
  'architecture_feature',
  'runtime',
  'device',
  'benchmark',
  'lesson',
] as const;

/**
 * Evidence / pathway strength states.
 */
export const SEMANTICS_PATH_STATES = [
  'DOCUMENTED',
  'CANDIDATE',
  'SUPPORTED',
  'VERIFIED',
  'WEAKENED',
  'STALE',
  'REGRESSED',
  'NOT_TESTED',
] as const;

export type SemanticsPathState = (typeof SEMANTICS_PATH_STATES)[number];

/**
 * Allowed learning sources.
 */
export const ALLOWED_SEMANTICS_SOURCES = [
  'public_open_specifications',
  'documented_compiler_behavior',
  'open_source_toolchains',
  'lawful_benchmarks',
] as const;

/**
 * Blocked reconstruction / clone targets.
 */
export const BLOCKED_SEMANTICS_TARGETS = [
  'confidential_microarchitecture',
  'proprietary_rtl',
  'unreleased_instructions',
  'private_firmware',
  'trade_secret_implementation_details',
] as const;

/**
 * Attention workload example operation needs.
 */
export const ATTENTION_OPERATION_NEEDS = [
  'matrix_vector_operations',
  'efficient_memory_movement',
  'supported_precision',
  'adequate_memory_bandwidth',
  'compatible_runtime_kernels',
] as const;

/**
 * Peer architecture routes for evidence comparison.
 */
export const COMPARISON_ARCHITECTURE_ROUTES = [
  'arm',
  'x86',
  'gpu',
  'npu',
] as const;

export const INSTRUCTION_SEMANTICS_LEARNING_CYCLE = [
  'honesty_locks',
  'instruction_semantics_learning_bootstrap',
  // A — Structure
  'learning_foci_encoded',
  'core_flow_encoded',
  'operation_need_mapping_encoded',
  'neural_pathway_encoded',
  'allowed_sources_encoded',
  // B — Truth
  'operation_need_neq_isa_copy',
  'measured_success_strengthens_path',
  'regression_stale_weakens_path',
  'generated_claim_neq_verified_without_runtime',
  // C — Denies
  'deny_copy_instruction_set',
  'deny_confidential_microarchitecture',
  'deny_proprietary_rtl',
  'deny_unreleased_instructions',
  'deny_private_firmware',
  'deny_trade_secret_details',
  'deny_verified_without_runtime_evidence',
  // D — Autonomy
  'guardian_rls_tenant_universe_isolation',
  'recommend_neq_act',
  'l4_autonomy_false',
  // E — Soft-wires
  'eq9_soft_wire',
  'eq5_soft_wire',
  'eq4_soft_wire',
  'eq3_soft_wire',
  'eq2_soft_wire',
  'eq1_soft_wire',
  'em157_soft_wire',
  'db_candidates_not_applied',
  'evidence',
] as const;

export type Eq10Hop = (typeof INSTRUCTION_SEMANTICS_LEARNING_CYCLE)[number];

export type Eq10EvidenceState =
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
  | 'SUPPORTED'
  | 'WEAKENED'
  | 'REGRESSED';

export type Eq10HopRecord = {
  hop: Eq10Hop;
  state: Eq10EvidenceState;
  summary: string;
  at: string;
};

export type Eq10ActorKind =
  | 'semantics_learner'
  | 'compiler_mapper'
  | 'scheduler_advisor'
  | 'proposal'
  | 'human_approver'
  | 'founder'
  | 'guardian'
  | 'home_base'
  | 'tenant_admin';

export type Eq10Actor = {
  kind: Eq10ActorKind;
  id: string;
  orgId: string;
  tenantId: string;
  universeId: string;
  permissions: readonly string[];
};

export const EQ10_LOCKS = Object.freeze({
  L4_AUTONOMY_ENABLED: false as const,
  TIP_LAND: false as const,
  PRODUCTION_AUTHORIZATION: false as const,
  PRODUCTION_WRITE: false as const,
  DB_CANDIDATES_APPLIED: false as const,
  FULL_PRODUCTION_INSTRUCTION_SEMANTICS_LEARNING_SHIPPED: false as const,
  MANAGE_PULL_REQUEST: false as const,

  // Core truth
  OPERATION_NEED_EQ_ISA_COPY: false as const,
  GENERATED_CLAIM_EQ_VERIFIED: false as const,
  VERIFIED_WITHOUT_RUNTIME_EVIDENCE: false as const,

  // Boundaries
  CONFIDENTIAL_MICROARCHITECTURE: false as const,
  PROPRIETARY_RTL: false as const,
  UNRELEASED_INSTRUCTIONS: false as const,
  PRIVATE_FIRMWARE: false as const,
  TRADE_SECRET_IMPLEMENTATION_DETAILS: false as const,

  // Autonomy
  AGENT_AUTO_AUTHORITY: false as const,
  RECOMMEND_EQ_ACT: false as const,
  RECOMMEND_EQ_AUTHORIZE: false as const,
  HIDDEN_CHAIN_OF_THOUGHT_IN_EQ10: false as const,

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

export const EQ10_AGENT_BOUNDS = Object.freeze({
  mayLearnFromPublicIsaAndCompilerSemantics: true as const,
  mayMapOperationNeedsToCapabilities: true as const,
  mayStrengthenPathsWithMeasuredSuccess: true as const,
  mayWeakenPathsOnRegressionOrStale: true as const,
  mayCompareVerifiedArchitectureRoutes: true as const,
  mayReturnEvidenceToHomeBase: true as const,
  automaticAuthority: false as const,
  mayCopyInstructionSet: false as const,
  mayReconstructConfidentialMicroarchitecture: false as const,
  mayCloneProprietaryRtl: false as const,
  mayUseUnreleasedInstructions: false as const,
  mayIngestPrivateFirmware: false as const,
  mayIngestTradeSecretDetails: false as const,
  mayMarkVerifiedWithoutRuntimeEvidence: false as const,
  mayIncludeHiddenChainOfThought: false as const,
  mayRecommendOnly: true as const,
});

export const EQ10_MAY = Object.freeze([
  'learn_public_isa_semantics_and_compiler_behavior',
  'map_operation_need_to_capability_runtime_and_measured_outcome',
  'strengthen_neural_paths_on_measured_success',
  'weaken_paths_on_regression_or_stale_evidence',
  'compare_verified_arm_x86_gpu_npu_routes_for_workloads',
  'keep_proprietary_microarchitecture_out_of_learning',
] as const);

export const EQ10_MUST_NOT = Object.freeze([
  'copy_or_clone_instruction_sets_as_the_learning_object',
  'reconstruct_confidential_microarchitecture_or_proprietary_rtl',
  'use_unreleased_instructions_or_private_firmware',
  'ingest_trade_secret_implementation_details',
  'mark_generated_architecture_claims_verified_without_runtime_evidence',
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

export type Eq10SoftWireSnapshot = {
  eq9RiscvAcceleratorResearch: SoftWirePresence;
  eq9Report: SoftWirePresence;
  eq5CompilerIrTranslationLayer: SoftWirePresence;
  eq5Report: SoftWirePresence;
  eq4ProprietaryIsaBoundary: SoftWirePresence;
  eq4Report: SoftWirePresence;
  eq3RiscvOpenIsaKnowledgePack: SoftWirePresence;
  eq3Report: SoftWirePresence;
  eq2ArmArchitectureKnowledgePack: SoftWirePresence;
  eq2Report: SoftWirePresence;
  eq1CrossArchitectureContract: SoftWirePresence;
  eq1Report: SoftWirePresence;
  em157HomeBase: SoftWirePresence;
};

export function assertEq10LocksIntact(): boolean {
  return (
    EQ10_LOCKS.L4_AUTONOMY_ENABLED === false &&
    EQ10_LOCKS.OPERATION_NEED_EQ_ISA_COPY === false &&
    EQ10_LOCKS.GENERATED_CLAIM_EQ_VERIFIED === false &&
    EQ10_LOCKS.VERIFIED_WITHOUT_RUNTIME_EVIDENCE === false &&
    EQ10_LOCKS.CONFIDENTIAL_MICROARCHITECTURE === false &&
    EQ10_LOCKS.PROPRIETARY_RTL === false &&
    EQ10_LOCKS.UNRELEASED_INSTRUCTIONS === false &&
    EQ10_LOCKS.PRIVATE_FIRMWARE === false &&
    EQ10_LOCKS.TRADE_SECRET_IMPLEMENTATION_DETAILS === false &&
    EQ10_LOCKS.AGENT_AUTO_AUTHORITY === false &&
    EQ10_LOCKS.RECOMMEND_EQ_ACT === false &&
    EQ10_LOCKS.RECOMMEND_EQ_AUTHORIZE === false &&
    EQ10_LOCKS.HIDDEN_CHAIN_OF_THOUGHT_IN_EQ10 === false &&
    EQ10_LOCKS.BYPASS_GUARDIAN_RLS_TENANT_UNIVERSE === false &&
    EQ10_LOCKS.GUARDIAN_RLS_TENANT_UNIVERSE_ISOLATION_UNCHANGED === true &&
    EQ10_LOCKS.HUMAN_APPROVAL_BOUNDARIES_UNCHANGED === true &&
    EQ10_LOCKS.DOCUMENTED_EQ_IMPLEMENTED === false &&
    EQ10_LOCKS.IMPLEMENTED_EQ_VERIFIED === false &&
    EQ10_LOCKS.VERIFIED_EQ_PRODUCTION_AUTHORIZED === false &&
    EQ10_LOCKS.HUMAN_APPROVAL_REQUIRED_BEFORE_CONSEQUENTIAL_ACTIONS === true &&
    EQ10_LOCKS.TIP_LAND === false &&
    EQ10_LOCKS.PRODUCTION_AUTHORIZATION === false &&
    EQ10_LOCKS.DB_CANDIDATES_APPLIED === false &&
    EQ10_LOCKS.FULL_PRODUCTION_INSTRUCTION_SEMANTICS_LEARNING_SHIPPED ===
      false &&
    EQ10_LOCKS.MANAGE_PULL_REQUEST === false &&
    EQ10_AGENT_BOUNDS.automaticAuthority === false &&
    EQ10_AGENT_BOUNDS.mayCopyInstructionSet === false &&
    EQ10_AGENT_BOUNDS.mayReconstructConfidentialMicroarchitecture === false &&
    EQ10_AGENT_BOUNDS.mayCloneProprietaryRtl === false &&
    EQ10_AGENT_BOUNDS.mayUseUnreleasedInstructions === false &&
    EQ10_AGENT_BOUNDS.mayIngestPrivateFirmware === false &&
    EQ10_AGENT_BOUNDS.mayIngestTradeSecretDetails === false &&
    EQ10_AGENT_BOUNDS.mayMarkVerifiedWithoutRuntimeEvidence === false &&
    EQ10_AGENT_BOUNDS.mayIncludeHiddenChainOfThought === false
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

export function eq10SoftWireSnapshot(repoRoot?: string): Eq10SoftWireSnapshot {
  const root =
    repoRoot ?? join(dirname(fileURLToPath(import.meta.url)), '../../..');

  return {
    eq9RiscvAcceleratorResearch: softWireFile(
      './riscv-accelerator-research-types.ts',
      'EQ9 RISC-V Accelerator Research PRESENT (soft-wire).',
      'EQ9 RISC-V Accelerator Research absent — soft-wire WAITING_DATA.',
    ),
    eq9Report: softWireRepoRelative(
      root,
      'docs/operations/62L_EQ9_RISCV_ACCELERATOR_RESEARCH_REPORT.md',
      'EQ9 report PRESENT.',
      'EQ9 report absent — soft-wire WAITING_DATA.',
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
    eq4ProprietaryIsaBoundary: softWireFile(
      './proprietary-isa-boundary-types.ts',
      'EQ4 Proprietary ISA Boundary PRESENT (soft-wire).',
      'EQ4 Proprietary ISA Boundary absent — soft-wire WAITING_DATA.',
    ),
    eq4Report: softWireRepoRelative(
      root,
      'docs/operations/62L_EQ4_PROPRIETARY_ISA_BOUNDARY_REPORT.md',
      'EQ4 report PRESENT.',
      'EQ4 report absent — soft-wire WAITING_DATA.',
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

export function isHumanApprover(actor: Eq10Actor): boolean {
  return (
    actor.kind === 'human_approver' ||
    actor.kind === 'founder' ||
    actor.kind === 'tenant_admin'
  );
}

export function isEq10Agent(actor: Eq10Actor): boolean {
  const agents: readonly Eq10ActorKind[] = [
    'semantics_learner',
    'compiler_mapper',
    'scheduler_advisor',
    'proposal',
  ];
  return agents.includes(actor.kind);
}

/**
 * Learning object is operation need mapping — not ISA copy.
 */
export function operationNeedImpliesIsaCopy(): false {
  return false;
}

/**
 * Generated architecture claims are not VERIFIED without runtime evidence.
 */
export function canMarkPathVerified(input: {
  hasActualRuntimeEvidence: boolean;
  evidenceRefs: readonly string[];
}): boolean {
  return input.hasActualRuntimeEvidence && input.evidenceRefs.length > 0;
}
