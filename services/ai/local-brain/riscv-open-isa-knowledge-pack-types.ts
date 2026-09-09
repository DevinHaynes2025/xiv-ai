/**
 * 62L-EQ3 — RISC-V Open ISA Knowledge Pack (park-and-implement).
 *
 * Provenance-backed RISC-V knowledge pack so agents reason over the open ISA,
 * extensions, privilege model, vector capabilities, and software ecosystem
 * while keeping implementation claims tied to real tested hardware.
 *
 * Critical distinction:
 *   RISC-V extension ratified/documented ≠ particular device supports it
 *   ≠ XIV has verified inference performance on it.
 * Hardware ladder: DOCUMENTED → DETECTED → SUPPORTED → VERIFIED (evidence-based).
 *
 * Neural pathway: RISC-V extension → compiler/toolchain → workload capability →
 * device → benchmark → lesson → joins ARM/x86/GPU/NPU routes in Virtual Chip brain.
 *
 * Boundary: even with open ISA — no third-party proprietary RTL, confidential
 * chip designs, firmware, private extensions, or restricted implementation data.
 *
 * Soft-wire when PRESENT: EQ2, EQ1, EP18, EP12, EM (#157). Presence ≠ VERIFIED.
 *
 * SoT: GitHub #161 / 62L-EQ family. GitLab mirror: needsAuth; no number invented.
 *
 * Honesty: DOCUMENTED ≠ IMPLEMENTED ≠ VERIFIED ≠ PRODUCTION AUTHORIZED.
 * L4_AUTONOMY_ENABLED=false. Guardian/RLS/tenant/Universe unchanged.
 * DB candidates NOT_APPLIED. tip-land=NO.
 * Next (report only): EQ4 — Proprietary ISA Boundary.
 */

import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

export const HONESTY_BANNER =
  'DOCUMENTED ≠ IMPLEMENTED ≠ VERIFIED ≠ PRODUCTION AUTHORIZED' as const;

export const GITHUB_SOT_ISSUE = 161 as const;
export const GITHUB_SOT_LABEL = '62L-EQ3' as const;
export const GITHUB_SOT_FAMILY = '62L-EQ' as const;
export const GITHUB_SOT_TITLE =
  '62L-EQ3 RISC-V Open ISA Knowledge Pack — provenance-backed open ISA/extensions with ratification state; ratified≠device support≠verified inference; hardware evidence ladder DOCUMENTED→DETECTED→SUPPORTED→VERIFIED' as const;

export const GITLAB_MIRROR_NOTE =
  'GitLab mirror: search attempted; MCP needsAuth / not resolved in this environment — no issue number invented.' as const;

export const EQ3_DB_CANDIDATES_STATUS = 'NOT_APPLIED' as const;

export const NEXT_PHASE_TITLE =
  'EQ4 — Proprietary ISA Boundary — formalize what agents may learn from public/open architecture documentation versus what must be blocked as confidential or restricted implementation IP.' as const;

/**
 * Domains modeled by the RISC-V knowledge pack.
 */
export const RISCV_KNOWLEDGE_DOMAINS = [
  'base_isas',
  'integer_extensions',
  'floating_point_extensions',
  'vector_extensions',
  'atomics',
  'bit_manipulation_extensions',
  'cryptographic_extensions',
  'privilege_architecture',
  'memory_model_concepts',
  'hypervisor_virtualization_features',
  'compiler_toolchain_support',
  'operating_system_runtime_support',
  'ai_ml_accelerator_extensions',
  'source_spec_version_ratification_state',
] as const;

/**
 * Knowledge node fields.
 */
export const RISCV_KNOWLEDGE_NODE_FIELDS = [
  'specVersion',
  'extensionId',
  'ratificationState',
  'instructionClass',
  'workloadRelevance',
  'compilerSupport',
  'runtimeSupport',
  'hardwareEvidence',
  'sourceRef',
  'sourceDate',
  'confidence',
] as const;

export type RiscvKnowledgeNodeField =
  (typeof RISCV_KNOWLEDGE_NODE_FIELDS)[number];

/**
 * Ratification / documentation state for extensions.
 */
export const RISCV_RATIFICATION_STATES = [
  'RATIFIED',
  'FROZEN',
  'DRAFT',
  'RESEARCH_ONLY',
  'NOT_APPLICABLE',
] as const;

export type RiscvRatificationState =
  (typeof RISCV_RATIFICATION_STATES)[number];

/**
 * Hardware evidence ladder (device claims).
 */
export const RISCV_HARDWARE_EVIDENCE_STATES = [
  'DOCUMENTED',
  'DETECTED',
  'SUPPORTED',
  'VERIFIED',
  'NOT_TESTED',
  'UNAVAILABLE',
] as const;

export type RiscvHardwareEvidenceState =
  (typeof RISCV_HARDWARE_EVIDENCE_STATES)[number];

/**
 * Neural pathway for RISC-V knowledge → lessons.
 */
export const RISCV_NEURAL_PATHWAY = [
  'riscv_extension',
  'compiler_toolchain',
  'workload_capability',
  'device',
  'benchmark',
  'lesson',
] as const;

/**
 * Workload / research relevance tags.
 */
export const RISCV_WORKLOAD_RELEVANCE = [
  'edge_ai',
  'embedded_systems',
  'vector_workloads',
  'matrix_operations',
  'control_systems',
  'low_power_compute',
  'secure_execution',
  'custom_accelerators',
  'heterogeneous_computing',
  'local_ai_inference',
] as const;

export type RiscvWorkloadRelevance =
  (typeof RISCV_WORKLOAD_RELEVANCE)[number];

export const RISCV_OPEN_ISA_KNOWLEDGE_PACK_CYCLE = [
  'honesty_locks',
  'riscv_open_isa_knowledge_pack_bootstrap',
  // A — Structure
  'knowledge_domains_encoded',
  'knowledge_node_fields_encoded',
  'ratification_states_encoded',
  'hardware_evidence_ladder_encoded',
  'neural_pathway_encoded',
  // B — Truth
  'ratified_neq_device_supports',
  'ratified_neq_xiv_verified_inference',
  'hardware_ladder_evidence_based',
  'open_isa_enables_research_without_confidential_internals',
  // C — Boundary denies
  'deny_proprietary_rtl_copy',
  'deny_confidential_chip_designs',
  'deny_firmware_ingestion',
  'deny_private_extensions',
  'deny_restricted_implementation_data',
  // D — Autonomy
  'guardian_rls_tenant_universe_isolation',
  'recommend_neq_act',
  'l4_autonomy_false',
  // E — Soft-wires
  'eq2_soft_wire',
  'eq1_soft_wire',
  'ep18_soft_wire',
  'ep12_soft_wire',
  'em157_soft_wire',
  'db_candidates_not_applied',
  'evidence',
] as const;

export type Eq3Hop = (typeof RISCV_OPEN_ISA_KNOWLEDGE_PACK_CYCLE)[number];

export type Eq3EvidenceState =
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
  | 'SUPPORTED'
  | 'RATIFIED'
  | 'FROZEN'
  | 'DRAFT'
  | 'RESEARCH_ONLY';

export type Eq3HopRecord = {
  hop: Eq3Hop;
  state: Eq3EvidenceState;
  summary: string;
  at: string;
};

export type Eq3ActorKind =
  | 'riscv_research_agent'
  | 'knowledge_pack'
  | 'scheduler'
  | 'proposal'
  | 'human_approver'
  | 'founder'
  | 'guardian'
  | 'home_base';

export type Eq3Actor = {
  kind: Eq3ActorKind;
  id: string;
  orgId: string;
  tenantId: string;
  universeId: string;
  permissions: readonly string[];
};

export const EQ3_LOCKS = Object.freeze({
  L4_AUTONOMY_ENABLED: false as const,
  TIP_LAND: false as const,
  PRODUCTION_AUTHORIZATION: false as const,
  PRODUCTION_WRITE: false as const,
  DB_CANDIDATES_APPLIED: false as const,
  FULL_PRODUCTION_RISCV_PACK_SHIPPED: false as const,
  MANAGE_PULL_REQUEST: false as const,

  // Truth distinctions
  RATIFIED_EQ_DEVICE_SUPPORTS: false as const,
  RATIFIED_EQ_XIV_VERIFIED_INFERENCE: false as const,
  DOCUMENTED_EQ_VERIFIED: false as const,
  SKIP_HARDWARE_EVIDENCE_LADDER: false as const,

  // Boundary
  PROPRIETARY_RTL_COPY: false as const,
  CONFIDENTIAL_CHIP_DESIGNS: false as const,
  FIRMWARE_INGESTION: false as const,
  PRIVATE_EXTENSIONS: false as const,
  RESTRICTED_IMPLEMENTATION_DATA: false as const,

  // Autonomy
  AGENT_AUTO_AUTHORITY: false as const,
  RECOMMEND_EQ_ACT: false as const,
  RECOMMEND_EQ_AUTHORIZE: false as const,
  HIDDEN_CHAIN_OF_THOUGHT_IN_KNOWLEDGE_PACK: false as const,

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

export const RISCV_KNOWLEDGE_AGENT_BOUNDS = Object.freeze({
  mayStudyOpenIsaSpecs: true as const,
  mayRecordRatificationAndToolchainSupport: true as const,
  mayMapExtensionsToWorkloadGenome: true as const,
  mayAdvanceHardwareEvidenceOnlyWithEvidence: true as const,
  mayReturnEvidenceToHomeBase: true as const,
  automaticAuthority: false as const,
  mayEquateRatifiedWithDeviceSupport: false as const,
  mayEquateRatifiedWithXivVerifiedInference: false as const,
  maySkipHardwareEvidenceLadder: false as const,
  mayCopyProprietaryRtl: false as const,
  mayIngestConfidentialChipDesigns: false as const,
  mayIngestFirmware: false as const,
  mayIngestPrivateExtensions: false as const,
  mayIngestRestrictedImplementationData: false as const,
  mayIncludeHiddenChainOfThought: false as const,
  mayRecommendOnly: true as const,
});

export const EQ3_MAY = Object.freeze([
  'model_open_riscv_isa_and_extensions_with_provenance',
  'record_ratification_state_separately_from_device_evidence',
  'map_extensions_into_cross_architecture_workload_graph',
  'advance_hardware_evidence_only_along_documented_ladder',
  'use_open_isa_as_research_foundation_without_confidential_internals',
] as const);

export const EQ3_MUST_NOT = Object.freeze([
  'equate_ratified_extension_with_device_support',
  'equate_ratified_extension_with_xiv_verified_inference',
  'skip_hardware_evidence_ladder',
  'copy_proprietary_rtl',
  'ingest_confidential_chip_designs',
  'ingest_firmware',
  'ingest_private_extensions',
  'ingest_restricted_implementation_data',
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

export type Eq3SoftWireSnapshot = {
  eq2ArmArchitectureKnowledgePack: SoftWirePresence;
  eq2Report: SoftWirePresence;
  eq1CrossArchitectureContract: SoftWirePresence;
  eq1Report: SoftWirePresence;
  ep18QuantumInspiredComputeLab: SoftWirePresence;
  ep18Report: SoftWirePresence;
  ep12Scheduler: SoftWirePresence;
  ep12Report: SoftWirePresence;
  em157HomeBase: SoftWirePresence;
};

export function assertEq3LocksIntact(): boolean {
  return (
    EQ3_LOCKS.L4_AUTONOMY_ENABLED === false &&
    EQ3_LOCKS.RATIFIED_EQ_DEVICE_SUPPORTS === false &&
    EQ3_LOCKS.RATIFIED_EQ_XIV_VERIFIED_INFERENCE === false &&
    EQ3_LOCKS.DOCUMENTED_EQ_VERIFIED === false &&
    EQ3_LOCKS.SKIP_HARDWARE_EVIDENCE_LADDER === false &&
    EQ3_LOCKS.PROPRIETARY_RTL_COPY === false &&
    EQ3_LOCKS.CONFIDENTIAL_CHIP_DESIGNS === false &&
    EQ3_LOCKS.FIRMWARE_INGESTION === false &&
    EQ3_LOCKS.PRIVATE_EXTENSIONS === false &&
    EQ3_LOCKS.RESTRICTED_IMPLEMENTATION_DATA === false &&
    EQ3_LOCKS.AGENT_AUTO_AUTHORITY === false &&
    EQ3_LOCKS.RECOMMEND_EQ_ACT === false &&
    EQ3_LOCKS.RECOMMEND_EQ_AUTHORIZE === false &&
    EQ3_LOCKS.HIDDEN_CHAIN_OF_THOUGHT_IN_KNOWLEDGE_PACK === false &&
    EQ3_LOCKS.BYPASS_GUARDIAN_RLS_TENANT_UNIVERSE === false &&
    EQ3_LOCKS.GUARDIAN_RLS_TENANT_UNIVERSE_ISOLATION_UNCHANGED === true &&
    EQ3_LOCKS.HUMAN_APPROVAL_BOUNDARIES_UNCHANGED === true &&
    EQ3_LOCKS.DOCUMENTED_EQ_IMPLEMENTED === false &&
    EQ3_LOCKS.IMPLEMENTED_EQ_VERIFIED === false &&
    EQ3_LOCKS.VERIFIED_EQ_PRODUCTION_AUTHORIZED === false &&
    EQ3_LOCKS.HUMAN_APPROVAL_REQUIRED_BEFORE_CONSEQUENTIAL_ACTIONS === true &&
    EQ3_LOCKS.TIP_LAND === false &&
    EQ3_LOCKS.PRODUCTION_AUTHORIZATION === false &&
    EQ3_LOCKS.DB_CANDIDATES_APPLIED === false &&
    EQ3_LOCKS.FULL_PRODUCTION_RISCV_PACK_SHIPPED === false &&
    EQ3_LOCKS.MANAGE_PULL_REQUEST === false &&
    RISCV_KNOWLEDGE_AGENT_BOUNDS.automaticAuthority === false &&
    RISCV_KNOWLEDGE_AGENT_BOUNDS.mayEquateRatifiedWithDeviceSupport === false &&
    RISCV_KNOWLEDGE_AGENT_BOUNDS.mayEquateRatifiedWithXivVerifiedInference ===
      false &&
    RISCV_KNOWLEDGE_AGENT_BOUNDS.maySkipHardwareEvidenceLadder === false &&
    RISCV_KNOWLEDGE_AGENT_BOUNDS.mayCopyProprietaryRtl === false &&
    RISCV_KNOWLEDGE_AGENT_BOUNDS.mayIngestConfidentialChipDesigns === false &&
    RISCV_KNOWLEDGE_AGENT_BOUNDS.mayIngestFirmware === false &&
    RISCV_KNOWLEDGE_AGENT_BOUNDS.mayIngestPrivateExtensions === false &&
    RISCV_KNOWLEDGE_AGENT_BOUNDS.mayIngestRestrictedImplementationData ===
      false &&
    RISCV_KNOWLEDGE_AGENT_BOUNDS.mayIncludeHiddenChainOfThought === false
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

export function eq3SoftWireSnapshot(repoRoot?: string): Eq3SoftWireSnapshot {
  const root =
    repoRoot ?? join(dirname(fileURLToPath(import.meta.url)), '../../..');

  return {
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

export function isHumanApprover(actor: Eq3Actor): boolean {
  return actor.kind === 'human_approver' || actor.kind === 'founder';
}

export function isRiscvKnowledgeAgent(actor: Eq3Actor): boolean {
  const agents: readonly Eq3ActorKind[] = [
    'riscv_research_agent',
    'knowledge_pack',
    'scheduler',
    'proposal',
  ];
  return agents.includes(actor.kind);
}

/**
 * Ratified/documented extension never implies device support or verified inference.
 */
export function ratifiedImpliesDeviceSupport(): boolean {
  return false;
}

export function ratifiedImpliesXivVerifiedInference(): boolean {
  return false;
}

/**
 * Ordered hardware evidence ladder.
 */
export const HARDWARE_EVIDENCE_LADDER_ORDER: readonly RiscvHardwareEvidenceState[] =
  ['DOCUMENTED', 'DETECTED', 'SUPPORTED', 'VERIFIED'] as const;

export function hardwareEvidenceRank(
  state: RiscvHardwareEvidenceState,
): number {
  const idx = HARDWARE_EVIDENCE_LADDER_ORDER.indexOf(
    state as (typeof HARDWARE_EVIDENCE_LADDER_ORDER)[number],
  );
  return idx;
}
