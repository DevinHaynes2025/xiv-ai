/**
 * 62L-EQ2 — ARM Architecture Knowledge Pack (park-and-implement).
 *
 * Provenance-backed ARM knowledge pack so agents understand documented
 * ARM/AArch64 instruction semantics, vector/SIMD, memory behavior, security
 * features, and toolchains without cloning proprietary microarchitecture.
 *
 * Neural pathway: ARM feature → compiler/runtime → workload capability →
 * device candidate → benchmark → result.
 * Only actual measured results may strengthen the final device-performance edge.
 *
 * IP boundary: public ARM documentation + supported toolchains only.
 * No confidential CPU-core internals, private RTL, firmware keys, proprietary
 * vendor implementation details, leaked roadmaps, or trade secrets.
 *
 * Soft-wire when PRESENT: EQ1, EP18, EP13, EP12, EM (#157). Presence ≠ VERIFIED.
 *
 * SoT: GitHub #161 / 62L-EQ family. GitLab mirror: needsAuth; no number invented.
 *
 * Honesty: DOCUMENTED ≠ IMPLEMENTED ≠ VERIFIED ≠ PRODUCTION AUTHORIZED.
 * Architecture support ≠ actual device verification.
 * L4_AUTONOMY_ENABLED=false. Guardian/RLS/tenant/Universe unchanged.
 * DB candidates NOT_APPLIED. tip-land=NO.
 * Next (report only): EQ3 — RISC-V Open ISA Knowledge Pack.
 */

import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

export const HONESTY_BANNER =
  'DOCUMENTED ≠ IMPLEMENTED ≠ VERIFIED ≠ PRODUCTION AUTHORIZED' as const;

export const GITHUB_SOT_ISSUE = 161 as const;
export const GITHUB_SOT_LABEL = '62L-EQ2' as const;
export const GITHUB_SOT_FAMILY = '62L-EQ' as const;
export const GITHUB_SOT_TITLE =
  '62L-EQ2 ARM Architecture Knowledge Pack — provenance-backed AArch64/ARM public semantics, SIMD/vector, memory, security, toolchain knowledge; support≠device verification; measured results only strengthen performance edges' as const;

export const GITLAB_MIRROR_NOTE =
  'GitLab mirror: search attempted; MCP needsAuth / not resolved in this environment — no issue number invented.' as const;

export const EQ2_DB_CANDIDATES_STATUS = 'NOT_APPLIED' as const;

export const NEXT_PHASE_TITLE =
  'EQ3 — RISC-V Open ISA Knowledge Pack — map openly specified base instructions/extensions into the same cross-architecture workload graph.' as const;

/**
 * Domains modeled by the ARM knowledge pack.
 */
export const ARM_KNOWLEDGE_DOMAINS = [
  'aarch64_architecture_versions',
  'general_purpose_instruction_families',
  'simd_vector_capabilities',
  'memory_ordering_model_concepts',
  'atomic_operations',
  'privilege_security_concepts',
  'exception_system_behavior',
  'compiler_toolchain_support',
  'mobile_edge_server_runtime_compatibility',
  'public_performance_efficiency_evidence',
  'source_version_date',
] as const;

/**
 * Knowledge node fields.
 */
export const ARM_KNOWLEDGE_NODE_FIELDS = [
  'architectureVersion',
  'featureExtension',
  'instructionSemanticClass',
  'compilerSupport',
  'runtimeSupport',
  'workloadRelevance',
  'source',
  'sourceDate',
  'rightsState',
  'evidenceClass',
  'confidence',
] as const;

export type ArmKnowledgeNodeField =
  (typeof ARM_KNOWLEDGE_NODE_FIELDS)[number];

/**
 * Rights / provenance states for knowledge sources.
 */
export const ARM_RIGHTS_STATES = [
  'PUBLIC_DOCUMENTATION',
  'OPEN_TOOLCHAIN',
  'XIV_OWNED_MEASUREMENT',
  'RESTRICTED_DENIED',
] as const;

export type ArmRightsState = (typeof ARM_RIGHTS_STATES)[number];

/**
 * Evidence class for knowledge nodes (knowledge vs measured).
 */
export const ARM_EVIDENCE_CLASSES = [
  'DOCUMENTED',
  'TOOLCHAIN_SUPPORTED',
  'RESEARCH_ONLY',
  'MEASURED',
  'NOT_TESTED',
  'DENIED_IP',
] as const;

export type ArmEvidenceClass = (typeof ARM_EVIDENCE_CLASSES)[number];

/**
 * Neural pathway for ARM knowledge → device performance.
 */
export const ARM_NEURAL_PATHWAY = [
  'arm_feature',
  'compiler_runtime',
  'workload_capability',
  'device_candidate',
  'benchmark',
  'result',
] as const;

/**
 * Workload relevance tags (aligns with EQ1 capabilities).
 */
export const ARM_WORKLOAD_RELEVANCE = [
  'local_ai_inference',
  'matrix_multiply',
  'attention',
  'vector_operations',
  'portable_runtime',
  'phone_edge_candidate',
  'server_candidate',
  'prefer_npu_gpu_over_cpu',
] as const;

export type ArmWorkloadRelevance = (typeof ARM_WORKLOAD_RELEVANCE)[number];

export const ARM_ARCHITECTURE_KNOWLEDGE_PACK_CYCLE = [
  'honesty_locks',
  'arm_architecture_knowledge_pack_bootstrap',
  // A — Structure
  'knowledge_domains_encoded',
  'knowledge_node_fields_encoded',
  'rights_states_encoded',
  'evidence_classes_encoded',
  'neural_pathway_encoded',
  // B — Truth
  'architecture_support_neq_device_verification',
  'only_measured_results_strengthen_device_performance_edge',
  'public_docs_enable_research_answers',
  // C — IP denies
  'deny_confidential_cpu_core_internals',
  'deny_private_rtl',
  'deny_firmware_keys',
  'deny_proprietary_vendor_implementation_details',
  'deny_leaked_roadmaps',
  'deny_trade_secrets',
  // D — Autonomy
  'guardian_rls_tenant_universe_isolation',
  'recommend_neq_act',
  'l4_autonomy_false',
  // E — Soft-wires
  'eq1_soft_wire',
  'ep18_soft_wire',
  'ep13_soft_wire',
  'ep12_soft_wire',
  'em157_soft_wire',
  'db_candidates_not_applied',
  'evidence',
] as const;

export type Eq2Hop = (typeof ARM_ARCHITECTURE_KNOWLEDGE_PACK_CYCLE)[number];

export type Eq2EvidenceState =
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
  | 'TOOLCHAIN_SUPPORTED'
  | 'RESEARCH_ONLY'
  | 'MEASURED'
  | 'DENIED_IP';

export type Eq2HopRecord = {
  hop: Eq2Hop;
  state: Eq2EvidenceState;
  summary: string;
  at: string;
};

export type Eq2ActorKind =
  | 'arm_research_agent'
  | 'knowledge_pack'
  | 'scheduler'
  | 'proposal'
  | 'human_approver'
  | 'founder'
  | 'guardian'
  | 'home_base';

export type Eq2Actor = {
  kind: Eq2ActorKind;
  id: string;
  orgId: string;
  tenantId: string;
  universeId: string;
  permissions: readonly string[];
};

export const EQ2_LOCKS = Object.freeze({
  L4_AUTONOMY_ENABLED: false as const,
  TIP_LAND: false as const,
  PRODUCTION_AUTHORIZATION: false as const,
  PRODUCTION_WRITE: false as const,
  DB_CANDIDATES_APPLIED: false as const,
  FULL_PRODUCTION_ARM_PACK_SHIPPED: false as const,
  MANAGE_PULL_REQUEST: false as const,

  // Truth
  ARCHITECTURE_SUPPORT_EQ_DEVICE_VERIFICATION: false as const,
  UNMEASURED_STRENGTHENS_DEVICE_PERFORMANCE_EDGE: false as const,
  DOCUMENTED_EQ_PHONE_INFERENCE_VERIFIED: false as const,

  // IP boundary
  CONFIDENTIAL_CPU_CORE_INTERNALS: false as const,
  PRIVATE_RTL_INGESTION: false as const,
  FIRMWARE_KEYS_INGESTION: false as const,
  PROPRIETARY_VENDOR_IMPLEMENTATION_DETAILS: false as const,
  LEAKED_ROADMAPS: false as const,
  TRADE_SECRETS: false as const,
  CLONING_ARM_SILICON: false as const,

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

export const ARM_KNOWLEDGE_AGENT_BOUNDS = Object.freeze({
  mayStudyPublicArmDocumentation: true as const,
  mayRecordToolchainSupport: true as const,
  mayAnswerResearchQuestionsFromPublicNodes: true as const,
  mayStrengthenEdgesWithMeasuredResultsOnly: true as const,
  mayReturnEvidenceToHomeBase: true as const,
  automaticAuthority: false as const,
  mayEquateSupportWithDeviceVerification: false as const,
  mayStrengthenEdgesWithoutMeasurement: false as const,
  mayIngestConfidentialCpuCoreInternals: false as const,
  mayIngestPrivateRtl: false as const,
  mayIngestFirmwareKeys: false as const,
  mayIngestProprietaryVendorImplementationDetails: false as const,
  mayIngestLeakedRoadmaps: false as const,
  mayIngestTradeSecrets: false as const,
  mayCloneArmSilicon: false as const,
  mayIncludeHiddenChainOfThought: false as const,
  mayRecommendOnly: true as const,
});

export const EQ2_MAY = Object.freeze([
  'model_public_aarch64_arm_knowledge_nodes_with_provenance',
  'answer_research_questions_from_documented_capabilities',
  'separate_architecture_support_from_device_verification',
  'strengthen_device_performance_edges_only_with_measured_results',
  'prefer_npu_gpu_guidance_when_cpu_is_suboptimal_as_advisory',
] as const);

export const EQ2_MUST_NOT = Object.freeze([
  'equate_architecture_support_with_device_verification',
  'strengthen_device_performance_edge_without_measurement',
  'ingest_confidential_cpu_core_internals',
  'ingest_private_rtl',
  'ingest_firmware_keys',
  'ingest_proprietary_vendor_implementation_details',
  'ingest_leaked_roadmaps',
  'ingest_trade_secrets',
  'clone_arm_silicon',
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

export type Eq2SoftWireSnapshot = {
  eq1CrossArchitectureContract: SoftWirePresence;
  eq1Report: SoftWirePresence;
  ep18QuantumInspiredComputeLab: SoftWirePresence;
  ep18Report: SoftWirePresence;
  ep13RuntimeReturnReceipt: SoftWirePresence;
  ep13Report: SoftWirePresence;
  ep12Scheduler: SoftWirePresence;
  ep12Report: SoftWirePresence;
  em157HomeBase: SoftWirePresence;
};

export function assertEq2LocksIntact(): boolean {
  return (
    EQ2_LOCKS.L4_AUTONOMY_ENABLED === false &&
    EQ2_LOCKS.ARCHITECTURE_SUPPORT_EQ_DEVICE_VERIFICATION === false &&
    EQ2_LOCKS.UNMEASURED_STRENGTHENS_DEVICE_PERFORMANCE_EDGE === false &&
    EQ2_LOCKS.DOCUMENTED_EQ_PHONE_INFERENCE_VERIFIED === false &&
    EQ2_LOCKS.CONFIDENTIAL_CPU_CORE_INTERNALS === false &&
    EQ2_LOCKS.PRIVATE_RTL_INGESTION === false &&
    EQ2_LOCKS.FIRMWARE_KEYS_INGESTION === false &&
    EQ2_LOCKS.PROPRIETARY_VENDOR_IMPLEMENTATION_DETAILS === false &&
    EQ2_LOCKS.LEAKED_ROADMAPS === false &&
    EQ2_LOCKS.TRADE_SECRETS === false &&
    EQ2_LOCKS.CLONING_ARM_SILICON === false &&
    EQ2_LOCKS.AGENT_AUTO_AUTHORITY === false &&
    EQ2_LOCKS.RECOMMEND_EQ_ACT === false &&
    EQ2_LOCKS.RECOMMEND_EQ_AUTHORIZE === false &&
    EQ2_LOCKS.HIDDEN_CHAIN_OF_THOUGHT_IN_KNOWLEDGE_PACK === false &&
    EQ2_LOCKS.BYPASS_GUARDIAN_RLS_TENANT_UNIVERSE === false &&
    EQ2_LOCKS.GUARDIAN_RLS_TENANT_UNIVERSE_ISOLATION_UNCHANGED === true &&
    EQ2_LOCKS.HUMAN_APPROVAL_BOUNDARIES_UNCHANGED === true &&
    EQ2_LOCKS.DOCUMENTED_EQ_IMPLEMENTED === false &&
    EQ2_LOCKS.IMPLEMENTED_EQ_VERIFIED === false &&
    EQ2_LOCKS.VERIFIED_EQ_PRODUCTION_AUTHORIZED === false &&
    EQ2_LOCKS.HUMAN_APPROVAL_REQUIRED_BEFORE_CONSEQUENTIAL_ACTIONS === true &&
    EQ2_LOCKS.TIP_LAND === false &&
    EQ2_LOCKS.PRODUCTION_AUTHORIZATION === false &&
    EQ2_LOCKS.DB_CANDIDATES_APPLIED === false &&
    EQ2_LOCKS.FULL_PRODUCTION_ARM_PACK_SHIPPED === false &&
    EQ2_LOCKS.MANAGE_PULL_REQUEST === false &&
    ARM_KNOWLEDGE_AGENT_BOUNDS.automaticAuthority === false &&
    ARM_KNOWLEDGE_AGENT_BOUNDS.mayEquateSupportWithDeviceVerification ===
      false &&
    ARM_KNOWLEDGE_AGENT_BOUNDS.mayStrengthenEdgesWithoutMeasurement === false &&
    ARM_KNOWLEDGE_AGENT_BOUNDS.mayIngestConfidentialCpuCoreInternals ===
      false &&
    ARM_KNOWLEDGE_AGENT_BOUNDS.mayIngestPrivateRtl === false &&
    ARM_KNOWLEDGE_AGENT_BOUNDS.mayIngestFirmwareKeys === false &&
    ARM_KNOWLEDGE_AGENT_BOUNDS.mayIngestProprietaryVendorImplementationDetails ===
      false &&
    ARM_KNOWLEDGE_AGENT_BOUNDS.mayIngestLeakedRoadmaps === false &&
    ARM_KNOWLEDGE_AGENT_BOUNDS.mayIngestTradeSecrets === false &&
    ARM_KNOWLEDGE_AGENT_BOUNDS.mayCloneArmSilicon === false &&
    ARM_KNOWLEDGE_AGENT_BOUNDS.mayIncludeHiddenChainOfThought === false
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

export function eq2SoftWireSnapshot(repoRoot?: string): Eq2SoftWireSnapshot {
  const root =
    repoRoot ?? join(dirname(fileURLToPath(import.meta.url)), '../../..');

  return {
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
    em157HomeBase: softWireFile(
      './agent-compute-home-base-types.ts',
      'EM (#157) Agent Compute Home Base PRESENT (soft-wire).',
      'EM (#157) Agent Compute Home Base absent — soft-wire WAITING_DATA.',
    ),
  };
}

export function isHumanApprover(actor: Eq2Actor): boolean {
  return actor.kind === 'human_approver' || actor.kind === 'founder';
}

export function isArmKnowledgeAgent(actor: Eq2Actor): boolean {
  const agents: readonly Eq2ActorKind[] = [
    'arm_research_agent',
    'knowledge_pack',
    'scheduler',
    'proposal',
  ];
  return agents.includes(actor.kind);
}

/**
 * Documented architecture support never implies device verification.
 */
export function architectureSupportImpliesDeviceVerification(): boolean {
  return false;
}
