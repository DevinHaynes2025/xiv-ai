/**
 * 62L-EQ5 — Compiler / IR Translation Layer (park-and-implement).
 *
 * Device-neutral compiler/intermediate-representation layer so agent workloads
 * can be expressed once and mapped safely across ARM, x86, RISC-V, GPU, NPU,
 * edge, cloud, and future QPU targets.
 *
 * Core abstraction:
 * Agent Mission → Workload Genome → Intermediate Representation →
 * Compiler/Runtime Mapping → Verified Hardware → Execution → Return Receipt
 *
 * Critical rule: Successful compilation ≠ successful execution.
 * VERIFIED only after: translation → load → execution → valid output → receipt
 * on the actual target.
 *
 * Soft-wire when PRESENT: EQ4, EQ3, EQ2, EQ1, EP12, EM (#157). Presence ≠ VERIFIED.
 *
 * SoT: GitHub #161 / 62L-EQ family. GitLab mirror: needsAuth; no number invented.
 *
 * Honesty: DOCUMENTED ≠ IMPLEMENTED ≠ VERIFIED ≠ PRODUCTION AUTHORIZED.
 * L4_AUTONOMY_ENABLED=false. Guardian/RLS/tenant/Universe unchanged.
 * DB candidates NOT_APPLIED. tip-land=NO.
 * Next (report only): EQ6 — Architecture Capability Graph.
 */

import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

export const HONESTY_BANNER =
  'DOCUMENTED ≠ IMPLEMENTED ≠ VERIFIED ≠ PRODUCTION AUTHORIZED' as const;

export const GITHUB_SOT_ISSUE = 161 as const;
export const GITHUB_SOT_LABEL = '62L-EQ5' as const;
export const GITHUB_SOT_FAMILY = '62L-EQ' as const;
export const GITHUB_SOT_TITLE =
  '62L-EQ5 Compiler/IR Translation Layer — device-neutral IR; compile≠execute; VERIFIED only after translation→load→execution→valid output→receipt on actual target' as const;

export const GITLAB_MIRROR_NOTE =
  'GitLab mirror: search attempted; MCP needsAuth / not resolved in this environment — no issue number invented.' as const;

export const EQ5_DB_CANDIDATES_STATUS = 'NOT_APPLIED' as const;

export const NEXT_PHASE_TITLE =
  'EQ6 — Architecture Capability Graph — link architectures, extensions, runtimes, models, benchmarks, and workloads into one evidence-backed cross-platform compute map.' as const;

/**
 * Core abstraction pipeline.
 */
export const COMPILER_IR_CORE_ABSTRACTION = [
  'agent_mission',
  'workload_genome',
  'intermediate_representation',
  'compiler_runtime_mapping',
  'verified_hardware',
  'execution',
  'return_receipt',
] as const;

/**
 * Candidate IR / runtime concept families (documented concepts, not shipped compilers).
 */
export const CANDIDATE_IR_RUNTIME_CONCEPTS = [
  'onnx_graphs',
  'mlir_style_operation_graphs',
  'llvm_ir_concepts',
  'graph_dataflow_representations',
  'tensor_operator_dags',
  'portable_kernel_descriptions',
  'scheduling_metadata',
] as const;

/**
 * Target architecture / platform families (capability-based, not brand-first).
 */
export const TARGET_ARCHITECTURE_FAMILIES = [
  'arm',
  'x86',
  'riscv',
  'gpu',
  'npu',
  'edge',
  'cloud',
  'qpu_future',
] as const;

/**
 * Required compatibility / evidence states for translation records.
 */
export const TRANSLATION_COMPATIBILITY_STATES = [
  'PARSEABLE',
  'TRANSLATABLE',
  'SUPPORTED',
  'VERIFIED',
  'PARTIAL',
  'NOT_SUPPORTED',
  'NOT_TESTED',
] as const;

export type TranslationCompatibilityState =
  (typeof TRANSLATION_COMPATIBILITY_STATES)[number];

/**
 * VERIFIED route requires this full chain on the actual target.
 */
export const VERIFIED_ROUTE_CHAIN = [
  'translation',
  'load',
  'execution',
  'valid_output',
  'receipt',
] as const;

/**
 * Translation record required fields.
 */
export const TRANSLATION_RECORD_FIELDS = [
  'translationId',
  'sourceWorkload',
  'sourceModelGraph',
  'targetArchitecture',
  'targetRuntime',
  'compilerToolchain',
  'supportedOperations',
  'unsupportedOperations',
  'precision',
  'memoryRequirements',
  'fallbackPath',
  'optimizationPasses',
  'compatibilityState',
  'benchmarkRefs',
  'evidenceState',
] as const;

export type TranslationRecordField =
  (typeof TRANSLATION_RECORD_FIELDS)[number];

/**
 * Sandboxed software-level optimization experiments (allowed).
 */
export const ALLOWED_SANDBOX_OPTIMIZATIONS = [
  'graph_fusion',
  'operator_placement',
  'quantization',
  'batching',
  'memory_planning',
  'cache_strategy',
  'device_partitioning',
] as const;

/**
 * Optimization / safety boundary denies.
 */
export const BLOCKED_OPTIMIZATION_ACTIONS = [
  'proprietary_compiler_cloning',
  'isa_reverse_engineering',
  'firmware_changes',
  'unsafe_hardware_tuning',
] as const;

/**
 * Scheduler capability-first mapping path (not vendor-chip-first).
 */
export const SCHEDULER_CAPABILITY_MAPPING = [
  'attention_workload',
  'tensor_vector_requirements',
  'compatible_runtime',
  'eligible_devices',
  'measured_benchmark',
  'best_verified_route',
] as const;

/**
 * Quantum / QPU IR typing — simulated ≠ physical QPU claim.
 */
export const QUANTUM_IR_KINDS = [
  'quantum_inspired_experiment_ir',
  'simulated_circuit_ir',
  'physical_qpu_ir',
] as const;

export type QuantumIrKind = (typeof QUANTUM_IR_KINDS)[number];

export const COMPILER_IR_TRANSLATION_CYCLE = [
  'honesty_locks',
  'compiler_ir_translation_bootstrap',
  // A — Structure
  'core_abstraction_encoded',
  'candidate_ir_concepts_encoded',
  'translation_record_fields_encoded',
  'compatibility_states_encoded',
  'verified_route_chain_encoded',
  'scheduler_capability_mapping_encoded',
  // B — Truth
  'compile_neq_execute',
  'verified_requires_full_chain_on_target',
  'capability_question_not_vendor_chip',
  'simulated_circuit_neq_physical_qpu',
  // C — Denies
  'deny_equate_compile_with_execute',
  'deny_jump_to_verified_without_receipt',
  'deny_proprietary_compiler_cloning',
  'deny_isa_reverse_engineering',
  'deny_firmware_changes',
  'deny_unsafe_hardware_tuning',
  'deny_silent_simulated_to_physical_qpu',
  // D — Autonomy
  'guardian_rls_tenant_universe_isolation',
  'recommend_neq_act',
  'l4_autonomy_false',
  // E — Soft-wires
  'eq4_soft_wire',
  'eq3_soft_wire',
  'eq2_soft_wire',
  'eq1_soft_wire',
  'ep12_soft_wire',
  'em157_soft_wire',
  'db_candidates_not_applied',
  'evidence',
] as const;

export type Eq5Hop = (typeof COMPILER_IR_TRANSLATION_CYCLE)[number];

export type Eq5EvidenceState =
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
  | 'PARSEABLE'
  | 'TRANSLATABLE'
  | 'SUPPORTED'
  | 'NOT_SUPPORTED';

export type Eq5HopRecord = {
  hop: Eq5Hop;
  state: Eq5EvidenceState;
  summary: string;
  at: string;
};

export type Eq5ActorKind =
  | 'ir_translator'
  | 'compiler_mapper'
  | 'scheduler_advisor'
  | 'proposal'
  | 'human_approver'
  | 'founder'
  | 'guardian'
  | 'home_base'
  | 'tenant_admin';

export type Eq5Actor = {
  kind: Eq5ActorKind;
  id: string;
  orgId: string;
  tenantId: string;
  universeId: string;
  permissions: readonly string[];
};

export const EQ5_LOCKS = Object.freeze({
  L4_AUTONOMY_ENABLED: false as const,
  TIP_LAND: false as const,
  PRODUCTION_AUTHORIZATION: false as const,
  PRODUCTION_WRITE: false as const,
  DB_CANDIDATES_APPLIED: false as const,
  FULL_PRODUCTION_COMPILER_IR_SHIPPED: false as const,
  MANAGE_PULL_REQUEST: false as const,

  // Critical rules
  COMPILE_EQ_EXECUTE: false as const,
  VERIFIED_WITHOUT_FULL_CHAIN: false as const,
  VERIFIED_WITHOUT_ACTUAL_TARGET: false as const,
  VENDOR_CHIP_FIRST_SCHEDULING: false as const,

  // Optimization boundary
  PROPRIETARY_COMPILER_CLONING: false as const,
  ISA_REVERSE_ENGINEERING: false as const,
  FIRMWARE_CHANGES: false as const,
  UNSAFE_HARDWARE_TUNING: false as const,
  OPTIMIZATION_OUTSIDE_SANDBOX: false as const,

  // Quantum
  SIMULATED_CIRCUIT_EQ_PHYSICAL_QPU: false as const,
  SILENT_SIMULATED_TO_PHYSICAL_QPU_CLAIM: false as const,

  // Autonomy
  AGENT_AUTO_AUTHORITY: false as const,
  RECOMMEND_EQ_ACT: false as const,
  RECOMMEND_EQ_AUTHORIZE: false as const,
  HIDDEN_CHAIN_OF_THOUGHT_IN_IR_LAYER: false as const,

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

export const IR_TRANSLATION_AGENT_BOUNDS = Object.freeze({
  mayEmitTranslationRecords: true as const,
  mayMapCapabilityRequirements: true as const,
  mayExperimentSandboxOptimizations: true as const,
  mayRecordPartialAndNotSupported: true as const,
  mayReturnEvidenceToHomeBase: true as const,
  mayTypeQuantumIrSeparately: true as const,
  automaticAuthority: false as const,
  mayEquateCompileWithExecute: false as const,
  mayJumpToVerifiedWithoutReceipt: false as const,
  mayScheduleVendorChipFirst: false as const,
  mayCloneProprietaryCompiler: false as const,
  mayReverseEngineerIsa: false as const,
  mayChangeFirmware: false as const,
  mayUnsafeHardwareTune: false as const,
  mayClaimSimulatedAsPhysicalQpu: false as const,
  mayIncludeHiddenChainOfThought: false as const,
  mayRecommendOnly: true as const,
});

export const EQ5_MAY = Object.freeze([
  'express_workload_once_via_device_neutral_ir',
  'ask_capability_requirements_not_vendor_chip',
  'map_attention_to_tensor_runtime_device_benchmark_route',
  'sandbox_graph_fusion_quantization_batching_memory_planning',
  'type_quantum_inspired_and_qpu_ir_separately',
  'require_full_chain_before_verified',
] as const);

export const EQ5_MUST_NOT = Object.freeze([
  'equate_successful_compilation_with_successful_execution',
  'mark_verified_without_load_execution_output_receipt_on_target',
  'clone_proprietary_compilers',
  'reverse_engineer_isa',
  'change_firmware_or_unsafe_hardware_tune',
  'silently_promote_simulated_circuit_to_physical_qpu',
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

export type Eq5SoftWireSnapshot = {
  eq4ProprietaryIsaBoundary: SoftWirePresence;
  eq4Report: SoftWirePresence;
  eq3RiscvOpenIsaKnowledgePack: SoftWirePresence;
  eq3Report: SoftWirePresence;
  eq2ArmArchitectureKnowledgePack: SoftWirePresence;
  eq2Report: SoftWirePresence;
  eq1CrossArchitectureContract: SoftWirePresence;
  eq1Report: SoftWirePresence;
  ep12Scheduler: SoftWirePresence;
  ep12Report: SoftWirePresence;
  em157HomeBase: SoftWirePresence;
};

export function assertEq5LocksIntact(): boolean {
  return (
    EQ5_LOCKS.L4_AUTONOMY_ENABLED === false &&
    EQ5_LOCKS.COMPILE_EQ_EXECUTE === false &&
    EQ5_LOCKS.VERIFIED_WITHOUT_FULL_CHAIN === false &&
    EQ5_LOCKS.VERIFIED_WITHOUT_ACTUAL_TARGET === false &&
    EQ5_LOCKS.VENDOR_CHIP_FIRST_SCHEDULING === false &&
    EQ5_LOCKS.PROPRIETARY_COMPILER_CLONING === false &&
    EQ5_LOCKS.ISA_REVERSE_ENGINEERING === false &&
    EQ5_LOCKS.FIRMWARE_CHANGES === false &&
    EQ5_LOCKS.UNSAFE_HARDWARE_TUNING === false &&
    EQ5_LOCKS.OPTIMIZATION_OUTSIDE_SANDBOX === false &&
    EQ5_LOCKS.SIMULATED_CIRCUIT_EQ_PHYSICAL_QPU === false &&
    EQ5_LOCKS.SILENT_SIMULATED_TO_PHYSICAL_QPU_CLAIM === false &&
    EQ5_LOCKS.AGENT_AUTO_AUTHORITY === false &&
    EQ5_LOCKS.RECOMMEND_EQ_ACT === false &&
    EQ5_LOCKS.RECOMMEND_EQ_AUTHORIZE === false &&
    EQ5_LOCKS.HIDDEN_CHAIN_OF_THOUGHT_IN_IR_LAYER === false &&
    EQ5_LOCKS.BYPASS_GUARDIAN_RLS_TENANT_UNIVERSE === false &&
    EQ5_LOCKS.GUARDIAN_RLS_TENANT_UNIVERSE_ISOLATION_UNCHANGED === true &&
    EQ5_LOCKS.HUMAN_APPROVAL_BOUNDARIES_UNCHANGED === true &&
    EQ5_LOCKS.DOCUMENTED_EQ_IMPLEMENTED === false &&
    EQ5_LOCKS.IMPLEMENTED_EQ_VERIFIED === false &&
    EQ5_LOCKS.VERIFIED_EQ_PRODUCTION_AUTHORIZED === false &&
    EQ5_LOCKS.HUMAN_APPROVAL_REQUIRED_BEFORE_CONSEQUENTIAL_ACTIONS === true &&
    EQ5_LOCKS.TIP_LAND === false &&
    EQ5_LOCKS.PRODUCTION_AUTHORIZATION === false &&
    EQ5_LOCKS.DB_CANDIDATES_APPLIED === false &&
    EQ5_LOCKS.FULL_PRODUCTION_COMPILER_IR_SHIPPED === false &&
    EQ5_LOCKS.MANAGE_PULL_REQUEST === false &&
    IR_TRANSLATION_AGENT_BOUNDS.automaticAuthority === false &&
    IR_TRANSLATION_AGENT_BOUNDS.mayEquateCompileWithExecute === false &&
    IR_TRANSLATION_AGENT_BOUNDS.mayJumpToVerifiedWithoutReceipt === false &&
    IR_TRANSLATION_AGENT_BOUNDS.mayScheduleVendorChipFirst === false &&
    IR_TRANSLATION_AGENT_BOUNDS.mayCloneProprietaryCompiler === false &&
    IR_TRANSLATION_AGENT_BOUNDS.mayReverseEngineerIsa === false &&
    IR_TRANSLATION_AGENT_BOUNDS.mayChangeFirmware === false &&
    IR_TRANSLATION_AGENT_BOUNDS.mayUnsafeHardwareTune === false &&
    IR_TRANSLATION_AGENT_BOUNDS.mayClaimSimulatedAsPhysicalQpu === false &&
    IR_TRANSLATION_AGENT_BOUNDS.mayIncludeHiddenChainOfThought === false
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

export function eq5SoftWireSnapshot(repoRoot?: string): Eq5SoftWireSnapshot {
  const root =
    repoRoot ?? join(dirname(fileURLToPath(import.meta.url)), '../../..');

  return {
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
    ep12Scheduler: softWireFile(
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

export function isHumanApprover(actor: Eq5Actor): boolean {
  return (
    actor.kind === 'human_approver' ||
    actor.kind === 'founder' ||
    actor.kind === 'tenant_admin'
  );
}

export function isIrTranslationAgent(actor: Eq5Actor): boolean {
  const agents: readonly Eq5ActorKind[] = [
    'ir_translator',
    'compiler_mapper',
    'scheduler_advisor',
    'proposal',
  ];
  return agents.includes(actor.kind);
}

/**
 * Successful compilation does not equal successful execution.
 */
export function compileImpliesExecute(): false {
  return false;
}

/**
 * VERIFIED only when full chain completed on actual target.
 */
export function canMarkVerified(input: {
  translationDone: boolean;
  loadDone: boolean;
  executionDone: boolean;
  validOutput: boolean;
  receiptDone: boolean;
  onActualTarget: boolean;
}): boolean {
  return (
    input.translationDone &&
    input.loadDone &&
    input.executionDone &&
    input.validOutput &&
    input.receiptDone &&
    input.onActualTarget
  );
}

/**
 * Simulated circuit cannot silently become a physical-QPU claim.
 */
export function simulatedImpliesPhysicalQpu(): false {
  return false;
}

export function quantumIrAllowsSilentPromotion(
  from: QuantumIrKind,
  to: QuantumIrKind,
): boolean {
  if (from === 'simulated_circuit_ir' && to === 'physical_qpu_ir') {
    return false;
  }
  if (from === 'quantum_inspired_experiment_ir' && to === 'physical_qpu_ir') {
    return false;
  }
  return from === to;
}
