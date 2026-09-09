/**
 * 62L-EQ1 — Cross-Architecture Contract (park-and-implement).
 *
 * One universal architecture contract so agents reason consistently across
 * ARM, x86, RISC-V, GPUs, NPUs, edge devices, cloud accelerators, and future
 * QPU providers without hard-coding vendor-specific assumptions.
 *
 * Core rule: Architecture knowledge and machine verification are separate.
 * Example: ARM AArch64 semantics → DOCUMENTED does NOT mean
 * this phone runs XIV inference → VERIFIED.
 *
 * Work is described as capabilities (matrix multiply, attention, …), then
 * mapped to compatible architectures/runtimes.
 *
 * Flow: Agent task → Workload Genome → Cross-Architecture Contract →
 * Runtime/Compiler candidate → Verified device → Execution → Return receipt →
 * XIV Home Base.
 *
 * Safety/IP: No proprietary ISA cloning; no restricted RTL/firmware ingestion;
 * no confidential microarchitecture reverse engineering. Public specs, open
 * standards, documented toolchains, XIV-owned measurements only.
 *
 * Soft-wire when PRESENT: EP18, EP17, EP13, EP12, EP1, EM (#157).
 * Presence ≠ VERIFIED.
 *
 * SoT: GitHub #161 / 62L-EQ family. GitLab mirror: needsAuth; no number invented.
 *
 * Honesty: DOCUMENTED ≠ IMPLEMENTED ≠ VERIFIED ≠ PRODUCTION AUTHORIZED.
 * L4_AUTONOMY_ENABLED=false. Guardian/RLS/tenant/Universe unchanged.
 * DB candidates NOT_APPLIED. tip-land=NO.
 * Next (report only): EQ2 — ARM Architecture Knowledge Pack.
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
  '62L-EQ1 Cross-Architecture Contract — universal architecture records + capability-based workload mapping across ARM/x86/RISC-V/GPU/NPU/edge/cloud/QPU; architecture knowledge ≠ machine verification; public specs only' as const;

export const GITLAB_MIRROR_NOTE =
  'GitLab mirror: search attempted; MCP needsAuth / not resolved in this environment — no issue number invented.' as const;

export const EQ1_DB_CANDIDATES_STATUS = 'NOT_APPLIED' as const;

export const NEXT_PHASE_TITLE =
  'EQ2 — ARM Architecture Knowledge Pack — structure public AArch64/ARM instruction semantics, vector/SIMD, memory model, security, and toolchain knowledge into the cross-architecture graph.' as const;

/**
 * Architecture record fields (universal contract object).
 */
export const ARCHITECTURE_RECORD_FIELDS = [
  'architectureId',
  'vendor',
  'isaFamily',
  'architectureVersion',
  'deviceClass',
  'extensions',
  'runtime',
  'compilerToolchain',
  'modelFormats',
  'supportedPrecisions',
  'memoryModel',
  'vectorSimdCapabilities',
  'securityFeatures',
  'operatingSystems',
  'benchmarkRefs',
  'evidenceState',
  'sourceRefs',
  'lastVerifiedAt',
] as const;

export type ArchitectureRecordField =
  (typeof ARCHITECTURE_RECORD_FIELDS)[number];

/**
 * Required evidence states.
 */
export const ARCHITECTURE_EVIDENCE_STATES = [
  'DOCUMENTED',
  'DETECTED',
  'SUPPORTED',
  'VERIFIED',
  'NOT_TESTED',
  'DEGRADED',
  'UNAVAILABLE',
] as const;

export type ArchitectureEvidenceState =
  (typeof ARCHITECTURE_EVIDENCE_STATES)[number];

/**
 * ISA / platform families (no vendor hard-coding required for capability match).
 */
export const ISA_FAMILIES = [
  'arm_aarch64',
  'x86_64',
  'riscv',
  'gpu',
  'npu',
  'edge',
  'cloud_accelerator',
  'qpu_path',
] as const;

export type IsaFamily = (typeof ISA_FAMILIES)[number];

/**
 * Workload capabilities (brand-neutral).
 */
export const WORKLOAD_CAPABILITIES = [
  'matrix_multiply',
  'vector_operations',
  'attention',
  'graph_search',
  'compression',
  'encryption',
  'simulation',
  'optimization',
] as const;

export type WorkloadCapability = (typeof WORKLOAD_CAPABILITIES)[number];

/**
 * Cross-architecture flow.
 */
export const CROSS_ARCHITECTURE_FLOW = [
  'agent_task',
  'workload_genome',
  'cross_architecture_contract',
  'runtime_compiler_candidate',
  'verified_device',
  'execution',
  'return_receipt',
  'xiv_home_base',
] as const;

/**
 * Safety / IP boundaries.
 */
export const SAFETY_IP_BOUNDARIES = [
  'no_proprietary_isa_cloning',
  'no_restricted_rtl_firmware_ingestion',
  'no_confidential_microarchitecture_reverse_engineering',
  'public_specifications_only',
  'open_standards_only',
  'documented_toolchains_only',
  'xiv_owned_measurements_only',
] as const;

export const CROSS_ARCHITECTURE_CONTRACT_CYCLE = [
  'honesty_locks',
  'cross_architecture_contract_bootstrap',
  // A — Structure
  'architecture_record_fields_encoded',
  'evidence_states_encoded',
  'isa_families_encoded',
  'workload_capabilities_encoded',
  'cross_architecture_flow_encoded',
  'safety_ip_boundaries_encoded',
  // B — Truth
  'architecture_knowledge_neq_machine_verification',
  'documented_aarch64_neq_phone_inference_verified',
  'capability_based_mapping_not_brand_hardcoding',
  // C — Safety/IP denies
  'deny_proprietary_isa_cloning',
  'deny_restricted_rtl_firmware_ingestion',
  'deny_confidential_microarchitecture_re',
  'deny_verified_without_machine_evidence',
  // D — Autonomy
  'guardian_rls_tenant_universe_isolation',
  'recommend_neq_act',
  'l4_autonomy_false',
  // E — Soft-wires
  'ep18_soft_wire',
  'ep17_soft_wire',
  'ep13_soft_wire',
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
  | 'DETECTED'
  | 'SUPPORTED';

export type Eq1HopRecord = {
  hop: Eq1Hop;
  state: Eq1EvidenceState;
  summary: string;
  at: string;
};

export type Eq1ActorKind =
  | 'cross_arch_contract'
  | 'workload_mapper'
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

  // Core truth
  ARCHITECTURE_KNOWLEDGE_EQ_MACHINE_VERIFICATION: false as const,
  DOCUMENTED_AARCH64_EQ_PHONE_INFERENCE_VERIFIED: false as const,
  BRAND_HARDCODING_REQUIRED_FOR_MAPPING: false as const,

  // Safety / IP
  PROPRIETARY_ISA_CLONING: false as const,
  RESTRICTED_RTL_FIRMWARE_INGESTION: false as const,
  CONFIDENTIAL_MICROARCHITECTURE_REVERSE_ENGINEERING: false as const,
  NON_PUBLIC_SPEC_AS_SOURCE_OF_TRUTH: false as const,

  // Evidence integrity
  VERIFIED_WITHOUT_MACHINE_EVIDENCE: false as const,
  NOT_TESTED_EQ_VERIFIED: false as const,

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
  mayEmitArchitectureRecords: true as const,
  mayMapCapabilitiesToArchitectures: true as const,
  mayUsePublicSpecsAndXivMeasurements: true as const,
  mayReturnEvidenceToHomeBase: true as const,
  automaticAuthority: false as const,
  mayEquateKnowledgeWithMachineVerification: false as const,
  mayCloneProprietaryIsa: false as const,
  mayIngestRestrictedRtlOrFirmware: false as const,
  mayReverseEngineerConfidentialMicroarchitecture: false as const,
  mayMarkVerifiedWithoutMachineEvidence: false as const,
  mayTreatNotTestedAsVerified: false as const,
  mayHardCodeVendorAssumptions: false as const,
  mayIncludeHiddenChainOfThought: false as const,
  mayRecommendOnly: true as const,
});

export const EQ1_MAY = Object.freeze([
  'emit_universal_architecture_records',
  'separate_architecture_knowledge_from_machine_verification',
  'map_workload_capabilities_to_compatible_architectures',
  'use_public_specs_open_standards_documented_toolchains_xiv_measurements',
  'feed_cross_architecture_flow_to_home_base_as_advisory',
] as const);

export const EQ1_MUST_NOT = Object.freeze([
  'equate_documented_semantics_with_verified_machine_execution',
  'hard_code_vendor_specific_assumptions',
  'clone_proprietary_isa',
  'ingest_restricted_rtl_or_firmware',
  'reverse_engineer_confidential_microarchitecture',
  'mark_verified_without_machine_evidence',
  'treat_not_tested_as_verified',
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
  ep13RuntimeReturnReceipt: SoftWirePresence;
  ep13Report: SoftWirePresence;
  ep12Scheduler: SoftWirePresence;
  ep12Report: SoftWirePresence;
  ep1VirtualChipContract: SoftWirePresence;
  ep1Report: SoftWirePresence;
  em157HomeBase: SoftWirePresence;
};

export function assertEq1LocksIntact(): boolean {
  return (
    EQ1_LOCKS.L4_AUTONOMY_ENABLED === false &&
    EQ1_LOCKS.ARCHITECTURE_KNOWLEDGE_EQ_MACHINE_VERIFICATION === false &&
    EQ1_LOCKS.DOCUMENTED_AARCH64_EQ_PHONE_INFERENCE_VERIFIED === false &&
    EQ1_LOCKS.BRAND_HARDCODING_REQUIRED_FOR_MAPPING === false &&
    EQ1_LOCKS.PROPRIETARY_ISA_CLONING === false &&
    EQ1_LOCKS.RESTRICTED_RTL_FIRMWARE_INGESTION === false &&
    EQ1_LOCKS.CONFIDENTIAL_MICROARCHITECTURE_REVERSE_ENGINEERING === false &&
    EQ1_LOCKS.NON_PUBLIC_SPEC_AS_SOURCE_OF_TRUTH === false &&
    EQ1_LOCKS.VERIFIED_WITHOUT_MACHINE_EVIDENCE === false &&
    EQ1_LOCKS.NOT_TESTED_EQ_VERIFIED === false &&
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
    CROSS_ARCH_AGENT_BOUNDS.mayEquateKnowledgeWithMachineVerification ===
      false &&
    CROSS_ARCH_AGENT_BOUNDS.mayCloneProprietaryIsa === false &&
    CROSS_ARCH_AGENT_BOUNDS.mayIngestRestrictedRtlOrFirmware === false &&
    CROSS_ARCH_AGENT_BOUNDS.mayReverseEngineerConfidentialMicroarchitecture ===
      false &&
    CROSS_ARCH_AGENT_BOUNDS.mayMarkVerifiedWithoutMachineEvidence === false &&
    CROSS_ARCH_AGENT_BOUNDS.mayTreatNotTestedAsVerified === false &&
    CROSS_ARCH_AGENT_BOUNDS.mayHardCodeVendorAssumptions === false &&
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
    ep13RuntimeReturnReceipt: softWireFile(
      './runtime-return-receipt-types.ts',
      'EP13 Runtime Return Receipt PRESENT (soft-wire).',
      'EP13 Runtime Return Receipt absent — soft-wire WAITING_DATA.',
    ),
    ep13Report: softWireRepoRelative(
      root,
      'docs/operations/62L_EP13_RUNTIME_RETURN_RECEIPT_REPORT.md',
      'EP13 report PRESENT.',
      'EP13 report absent — soft-wire WAITING_DATA.',
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
    'workload_mapper',
    'scheduler',
    'proposal',
  ];
  return agents.includes(actor.kind);
}

/**
 * DOCUMENTED architecture knowledge never implies machine VERIFIED.
 */
export function architectureKnowledgeImpliesMachineVerified(
  evidenceState: ArchitectureEvidenceState,
): boolean {
  void evidenceState;
  return false;
}
