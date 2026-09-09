/**
 * 62L-EQ1 — Cross-Architecture Contract (park-and-implement).
 *
 * Universal object that lets XIV reason consistently across ARM, x86,
 * RISC-V, GPU, NPU, edge, cloud, and future QPU hardware — without claiming
 * silicon ownership or unsafe device control.
 *
 * Neural pathway bridge:
 * Agent mission → workload genome → algorithm → compiler/IR → architecture →
 * runtime → CPU/GPU/NPU/QPU candidate → benchmark → evidence → lesson →
 * XIV Home Base.
 *
 * Soft-wire when PRESENT: EP18, EP17, EP12, EP1, EM (#157). Presence ≠ VERIFIED.
 *
 * SoT: GitHub #161 / 62L-EQ family (founder-queued). GitLab mirror: needsAuth;
 * no issue number invented. Note: `gh issue view 161` may be unresolved in
 * this agent environment; issue number retained from founder SoT statement.
 *
 * Honesty: DOCUMENTED ≠ IMPLEMENTED ≠ VERIFIED ≠ PRODUCTION AUTHORIZED.
 * Public ISA research ≠ verified execution. Translation ≠ physical QPU.
 * L4_AUTONOMY_ENABLED=false. Guardian/RLS/tenant/Universe unchanged.
 * DB candidates NOT_APPLIED. tip-land=NO.
 * Next (report only): EQ2 — ARM/AArch64 Public Architecture Research Path.
 */

import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

export const HONESTY_BANNER =
  'DOCUMENTED ≠ IMPLEMENTED ≠ VERIFIED ≠ PRODUCTION AUTHORIZED' as const;

export const GITHUB_SOT_ISSUE = 161 as const;
export const GITHUB_SOT_LABEL = '62L-EQ1' as const;
export const GITHUB_SOT_FAMILY = '62L-EQ' as const;
export const GITHUB_SOT_TITLE =
  '62L-EQ1 Cross-Architecture Contract — universal object for consistent reasoning across ARM/AArch64, x86, RISC-V, GPU, NPU, edge, cloud, and future QPU paths (software abstraction; public-ISA research ≠ verified execution)' as const;

export const GITLAB_MIRROR_NOTE =
  'GitLab mirror: search attempted; MCP needsAuth / not resolved in this environment — no issue number invented.' as const;

export const EQ1_DB_CANDIDATES_STATUS = 'NOT_APPLIED' as const;

export const NEXT_PHASE_TITLE =
  'EQ2 — ARM/AArch64 Public Architecture Research Path — study documented AArch64 instruction semantics and software behavior for phone/edge/server research without claiming silicon control.' as const;

/**
 * Architectures the contract may address (capability mapping only).
 */
export const ARCHITECTURE_FAMILIES = [
  'arm_aarch64',
  'x86_64',
  'riscv',
  'gpu',
  'npu',
  'edge',
  'cloud',
  'qpu_path',
] as const;

export type ArchitectureFamily = (typeof ARCHITECTURE_FAMILIES)[number];

/**
 * Compatibility / policy states for a contract binding.
 */
export const CROSS_ARCH_POLICY_STATES = [
  'COMPATIBLE',
  'PARTIAL',
  'TRANSLATION_REQUIRED',
  'UNSUPPORTED',
  'RESEARCH_ONLY',
  'WAITING_PUBLIC_SPEC',
] as const;

export type CrossArchPolicyState = (typeof CROSS_ARCH_POLICY_STATES)[number];

/**
 * Universal contract object fields.
 */
export const CROSS_ARCH_CONTRACT_FIELDS = [
  'contractId',
  'architectureFamily',
  'isaProfile',
  'extensionSet',
  'abiRuntime',
  'compilerIrTarget',
  'workloadGenomeRef',
  'algorithmRef',
  'runtimeProvider',
  'deviceClassCandidate',
  'translationMode',
  'verificationState',
  'publicSpecRefs',
  'benchmarkRef',
  'evidenceRefs',
  'lessonRefs',
  'homeBaseEnvelopeId',
] as const;

export type CrossArchContractField =
  (typeof CROSS_ARCH_CONTRACT_FIELDS)[number];

/**
 * Neural pathway hops (Agent mission → … → Home Base).
 */
export const NEURAL_COMPUTE_PATHWAY = [
  'agent_mission',
  'workload_genome',
  'algorithm',
  'compiler_ir',
  'architecture',
  'runtime',
  'cpu_gpu_npu_qpu_candidate',
  'benchmark',
  'evidence',
  'lesson',
  'xiv_home_base',
] as const;

/**
 * Translation modes (software-layer only).
 */
export const TRANSLATION_MODES = [
  'native',
  'ir_lower',
  'runtime_shim',
  'emulated_research',
  'unsupported',
] as const;

export type TranslationMode = (typeof TRANSLATION_MODES)[number];

/**
 * Verification ladder for architecture bindings.
 */
export const ARCH_VERIFICATION_STATES = [
  'DOCUMENTED',
  'RESEARCH_ONLY',
  'IMPLEMENTED',
  'NOT_TESTED',
  'VERIFIED',
  'PRODUCTION_AUTHORIZED',
] as const;

export type ArchVerificationState =
  (typeof ARCH_VERIFICATION_STATES)[number];

export const CROSS_ARCHITECTURE_CONTRACT_CYCLE = [
  'honesty_locks',
  'cross_architecture_contract_bootstrap',
  // A — Structure
  'architecture_families_encoded',
  'contract_fields_encoded',
  'policy_states_encoded',
  'neural_pathway_encoded',
  'translation_modes_encoded',
  // B — Truth
  'universal_object_binds_architectures',
  'public_isa_research_neq_verified_execution',
  'translation_is_software_abstraction',
  'qpu_path_remains_research_without_physical_evidence',
  'arm_riscv_x86_gpu_npu_edge_cloud_addressable',
  // C — Denies
  'deny_silicon_modification_claims',
  'deny_autonomous_device_control',
  'deny_verified_without_evidence',
  'deny_production_authorize_from_research_only',
  // D — Autonomy
  'guardian_rls_tenant_universe_isolation',
  'recommend_neq_act',
  'l4_autonomy_false',
  // E — Soft-wires
  'ep18_soft_wire',
  'ep17_soft_wire',
  'ep12_soft_wire',
  'ep1_soft_wire',
  'em157_soft_wire',
  'db_candidates_not_applied',
  'evidence',
] as const;

export type Eq1Hop = (typeof CROSS_ARCHITECTURE_CONTRACT_CYCLE)[number];

export type Eq1EvidenceState =
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
  | 'COMPATIBLE'
  | 'TRANSLATION_REQUIRED'
  | 'UNSUPPORTED'
  | 'RESEARCH_ONLY'
  | 'WAITING_PUBLIC_SPEC';

export type Eq1HopRecord = {
  hop: Eq1Hop;
  state: Eq1EvidenceState;
  summary: string;
  at: string;
};

export type Eq1ActorKind =
  | 'cross_arch_contract'
  | 'compiler_runtime'
  | 'scheduler'
  | 'proposal'
  | 'human_approver'
  | 'founder'
  | 'guardian'
  | 'home_base';

export type Eq1Actor = {
  kind: Eq1ActorKind;
  id: string;
  orgId: string;
  tenantId: string;
  universeId: string;
  permissions: readonly string[];
};

export const EQ1_LOCKS = Object.freeze({
  L4_AUTONOMY_ENABLED: false as const,
  TIP_LAND: false as const,
  PRODUCTION_AUTHORIZATION: false as const,
  PRODUCTION_WRITE: false as const,
  DB_CANDIDATES_APPLIED: false as const,
  FULL_PRODUCTION_CROSS_ARCH_SHIPPED: false as const,
  MANAGE_PULL_REQUEST: false as const,

  // Truth
  PUBLIC_ISA_RESEARCH_EQ_VERIFIED_EXECUTION: false as const,
  TRANSLATION_EQ_SILICON_MODIFICATION: false as const,
  QPU_PATH_IMPLIED_PHYSICAL_WITHOUT_EVIDENCE: false as const,
  RESEARCH_ONLY_EQ_PRODUCTION_AUTHORIZED: false as const,
  DOCUMENTED_EQ_VERIFIED: false as const,
  SILICON_MODIFICATION_CLAIMS: false as const,
  AUTONOMOUS_DEVICE_CONTROL: false as const,
  UNVERIFIED_MARKED_VERIFIED: false as const,

  // Autonomy
  AGENT_AUTO_AUTHORITY: false as const,
  RECOMMEND_EQ_ACT: false as const,
  RECOMMEND_EQ_AUTHORIZE: false as const,
  HIDDEN_CHAIN_OF_THOUGHT_IN_CONTRACT: false as const,

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

export const CROSS_ARCH_AGENT_BOUNDS = Object.freeze({
  mayEmitCrossArchContracts: true as const,
  mayClassifyCompatibility: true as const,
  mayRecommendTranslationModes: true as const,
  mayReturnEvidenceToHomeBase: true as const,
  automaticAuthority: false as const,
  mayClaimPublicResearchAsVerified: false as const,
  mayClaimSiliconModification: false as const,
  mayAutonomouslyControlDevices: false as const,
  mayMarkUnverifiedAsVerified: false as const,
  mayPromoteResearchOnlyToProduction: false as const,
  mayImplyQpuPhysicalWithoutEvidence: false as const,
  mayIncludeHiddenChainOfThought: false as const,
  mayRecommendOnly: true as const,
});

export const EQ1_MAY = Object.freeze([
  'emit_universal_cross_architecture_contracts',
  'bind_arm_x86_riscv_gpu_npu_edge_cloud_qpu_path_candidates',
  'classify_compatibility_and_translation_modes',
  'record_public_spec_refs_without_claiming_verified_execution',
  'feed_neural_pathway_to_home_base_as_advisory',
] as const);

export const EQ1_MUST_NOT = Object.freeze([
  'equate_public_isa_research_with_verified_execution',
  'claim_silicon_modification',
  'autonomously_control_devices',
  'mark_unverified_as_verified',
  'promote_research_only_to_production_authorized',
  'imply_qpu_path_is_physical_without_evidence',
  'treat_translation_as_silicon_change',
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

export type Eq1SoftWireSnapshot = {
  ep18QuantumInspiredComputeLab: SoftWirePresence;
  ep18Report: SoftWirePresence;
  ep17ClassicalQuantBaselineLab: SoftWirePresence;
  ep17Report: SoftWirePresence;
  ep12Scheduler: SoftWirePresence;
  ep12Report: SoftWirePresence;
  ep1VirtualChipContract: SoftWirePresence;
  ep1Report: SoftWirePresence;
  em157HomeBase: SoftWirePresence;
};

export function assertEq1LocksIntact(): boolean {
  return (
    EQ1_LOCKS.L4_AUTONOMY_ENABLED === false &&
    EQ1_LOCKS.PUBLIC_ISA_RESEARCH_EQ_VERIFIED_EXECUTION === false &&
    EQ1_LOCKS.TRANSLATION_EQ_SILICON_MODIFICATION === false &&
    EQ1_LOCKS.QPU_PATH_IMPLIED_PHYSICAL_WITHOUT_EVIDENCE === false &&
    EQ1_LOCKS.RESEARCH_ONLY_EQ_PRODUCTION_AUTHORIZED === false &&
    EQ1_LOCKS.DOCUMENTED_EQ_VERIFIED === false &&
    EQ1_LOCKS.SILICON_MODIFICATION_CLAIMS === false &&
    EQ1_LOCKS.AUTONOMOUS_DEVICE_CONTROL === false &&
    EQ1_LOCKS.UNVERIFIED_MARKED_VERIFIED === false &&
    EQ1_LOCKS.AGENT_AUTO_AUTHORITY === false &&
    EQ1_LOCKS.RECOMMEND_EQ_ACT === false &&
    EQ1_LOCKS.RECOMMEND_EQ_AUTHORIZE === false &&
    EQ1_LOCKS.HIDDEN_CHAIN_OF_THOUGHT_IN_CONTRACT === false &&
    EQ1_LOCKS.BYPASS_GUARDIAN_RLS_TENANT_UNIVERSE === false &&
    EQ1_LOCKS.GUARDIAN_RLS_TENANT_UNIVERSE_ISOLATION_UNCHANGED === true &&
    EQ1_LOCKS.HUMAN_APPROVAL_BOUNDARIES_UNCHANGED === true &&
    EQ1_LOCKS.DOCUMENTED_EQ_IMPLEMENTED === false &&
    EQ1_LOCKS.IMPLEMENTED_EQ_VERIFIED === false &&
    EQ1_LOCKS.VERIFIED_EQ_PRODUCTION_AUTHORIZED === false &&
    EQ1_LOCKS.HUMAN_APPROVAL_REQUIRED_BEFORE_CONSEQUENTIAL_ACTIONS === true &&
    EQ1_LOCKS.TIP_LAND === false &&
    EQ1_LOCKS.PRODUCTION_AUTHORIZATION === false &&
    EQ1_LOCKS.DB_CANDIDATES_APPLIED === false &&
    EQ1_LOCKS.FULL_PRODUCTION_CROSS_ARCH_SHIPPED === false &&
    EQ1_LOCKS.MANAGE_PULL_REQUEST === false &&
    CROSS_ARCH_AGENT_BOUNDS.automaticAuthority === false &&
    CROSS_ARCH_AGENT_BOUNDS.mayClaimPublicResearchAsVerified === false &&
    CROSS_ARCH_AGENT_BOUNDS.mayClaimSiliconModification === false &&
    CROSS_ARCH_AGENT_BOUNDS.mayAutonomouslyControlDevices === false &&
    CROSS_ARCH_AGENT_BOUNDS.mayMarkUnverifiedAsVerified === false &&
    CROSS_ARCH_AGENT_BOUNDS.mayPromoteResearchOnlyToProduction === false &&
    CROSS_ARCH_AGENT_BOUNDS.mayImplyQpuPhysicalWithoutEvidence === false &&
    CROSS_ARCH_AGENT_BOUNDS.mayIncludeHiddenChainOfThought === false
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

export function eq1SoftWireSnapshot(repoRoot?: string): Eq1SoftWireSnapshot {
  const root =
    repoRoot ?? join(dirname(fileURLToPath(import.meta.url)), '../../..');

  return {
    ep18QuantumInspiredComputeLab: softWireFile(
      './quantum-inspired-compute-lab-types.ts',
      'EP18 Quantum-Inspired Compute Lab PRESENT (soft-wire).',
      'EP18 Quantum-Inspired Compute Lab absent — soft-wire WAITING_DATA.',
    ),
    ep18Report: softWireRepoRelative(
      root,
      'docs/operations/62L_EP18_QUANTUM_INSPIRED_COMPUTE_LAB_REPORT.md',
      'EP18 report PRESENT.',
      'EP18 report absent — soft-wire WAITING_DATA.',
    ),
    ep17ClassicalQuantBaselineLab: softWireFile(
      './classical-quant-baseline-lab-types.ts',
      'EP17 Classical Quant Baseline Lab PRESENT (soft-wire).',
      'EP17 Classical Quant Baseline Lab absent — soft-wire WAITING_DATA.',
    ),
    ep17Report: softWireRepoRelative(
      root,
      'docs/operations/62L_EP17_CLASSICAL_QUANT_BASELINE_LAB_REPORT.md',
      'EP17 report PRESENT.',
      'EP17 report absent — soft-wire WAITING_DATA.',
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

export function isHumanApprover(actor: Eq1Actor): boolean {
  return actor.kind === 'human_approver' || actor.kind === 'founder';
}

export function isCrossArchAgent(actor: Eq1Actor): boolean {
  const agents: readonly Eq1ActorKind[] = [
    'cross_arch_contract',
    'compiler_runtime',
    'scheduler',
    'proposal',
  ];
  return agents.includes(actor.kind);
}
