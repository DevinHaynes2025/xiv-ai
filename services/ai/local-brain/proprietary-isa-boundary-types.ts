/**
 * 62L-EQ4 — Proprietary ISA Boundary (park-and-implement).
 *
 * Hard boundary between public/open architecture knowledge and proprietary
 * implementation IP so agents can learn aggressively without ingesting
 * confidential microarchitecture, firmware, or restricted vendor designs.
 *
 * Core flow: Source → rights/provenance check → classification →
 * ALLOW / QUARANTINE / DENY → knowledge graph.
 * UNKNOWN_RIGHTS → QUARANTINE (not automatic ingestion).
 *
 * May learn: instruction semantics → compiler behavior → workload mapping →
 * benchmark behavior.
 * Must not learn: confidential implementation internals → copied proprietary design.
 *
 * Tenant: org-authorized private docs stay in that Universe — not global KB.
 *
 * Soft-wire when PRESENT: EQ3, EQ2, EQ1, EP16, EM (#157). Presence ≠ VERIFIED.
 *
 * SoT: GitHub #161 / 62L-EQ family. GitLab mirror: needsAuth; no number invented.
 *
 * Honesty: DOCUMENTED ≠ IMPLEMENTED ≠ VERIFIED ≠ PRODUCTION AUTHORIZED.
 * L4_AUTONOMY_ENABLED=false. Guardian/RLS/tenant/Universe unchanged.
 * DB candidates NOT_APPLIED. tip-land=NO.
 * Next (report only): EQ5 — Compiler/IR Translation Layer.
 */

import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

export const HONESTY_BANNER =
  'DOCUMENTED ≠ IMPLEMENTED ≠ VERIFIED ≠ PRODUCTION AUTHORIZED' as const;

export const GITHUB_SOT_ISSUE = 161 as const;
export const GITHUB_SOT_LABEL = '62L-EQ4' as const;
export const GITHUB_SOT_FAMILY = '62L-EQ' as const;
export const GITHUB_SOT_TITLE =
  '62L-EQ4 Proprietary ISA Boundary — hard boundary public/open architecture knowledge vs proprietary implementation IP; UNKNOWN_RIGHTS→QUARANTINE; tenant-private docs not global KB' as const;

export const GITLAB_MIRROR_NOTE =
  'GitLab mirror: search attempted; MCP needsAuth / not resolved in this environment — no issue number invented.' as const;

export const EQ4_DB_CANDIDATES_STATUS = 'NOT_APPLIED' as const;

export const NEXT_PHASE_TITLE =
  'EQ5 — Compiler/IR Translation Layer — map device-neutral workloads through compiler/intermediate-representation abstractions instead of tying intelligence directly to a specific ISA.' as const;

/**
 * Allowed research sources.
 */
export const ALLOWED_RESEARCH_SOURCES = [
  'public_isa_specifications',
  'vendor_public_architecture_manuals',
  'open_standards',
  'public_compiler_runtime_documentation',
  'open_source_toolchains',
  'peer_reviewed_papers',
  'licensed_technical_material',
  'xiv_owned_benchmark_results',
] as const;

/**
 * Blocked or quarantined material categories.
 */
export const BLOCKED_OR_QUARANTINED_MATERIAL = [
  'private_rtl',
  'confidential_microarchitecture_diagrams',
  'firmware_signing_keys',
  'unreleased_roadmaps',
  'leaked_source_code',
  'private_instruction_extensions',
  'trade_secrets',
  'stolen_benchmark_databases',
  'confidential_manufacturing_data',
  'reverse_engineered_restricted_implementation_details',
] as const;

/**
 * Required source / rights states.
 */
export const SOURCE_RIGHTS_STATES = [
  'PUBLIC_OPEN',
  'PUBLIC_VENDOR_DOC',
  'LICENSED',
  'AUTHORIZED_PRIVATE',
  'UNKNOWN_RIGHTS',
  'RESTRICTED',
  'CONFIDENTIAL',
  'LEAKED_OR_STOLEN',
] as const;

export type SourceRightsState = (typeof SOURCE_RIGHTS_STATES)[number];

/**
 * Classification outcomes after rights/provenance check.
 */
export const RIGHTS_CLASSIFICATION_OUTCOMES = [
  'ALLOW',
  'QUARANTINE',
  'DENY',
] as const;

export type RightsClassificationOutcome =
  (typeof RIGHTS_CLASSIFICATION_OUTCOMES)[number];

/**
 * Core rights gate flow.
 */
export const PROPRIETARY_ISA_BOUNDARY_FLOW = [
  'source',
  'rights_provenance_check',
  'classification',
  'allow_quarantine_or_deny',
  'knowledge_graph',
] as const;

/**
 * Architecture learning rule — allowed vs blocked learning targets.
 */
export const ALLOWED_LEARNING_TARGETS = [
  'instruction_semantics',
  'compiler_behavior',
  'workload_mapping',
  'benchmark_behavior',
] as const;

export const BLOCKED_LEARNING_TARGETS = [
  'confidential_implementation_internals',
  'copied_proprietary_design',
] as const;

/**
 * Audit fields for each architecture knowledge node.
 */
export const ARCHITECTURE_KNOWLEDGE_AUDIT_FIELDS = [
  'sourceId',
  'rightsState',
  'architectureFeature',
  'claim',
  'tenantId',
  'universeId',
  'purpose',
  'reviewer',
  'timestamp',
  'revocationPath',
] as const;

export type ArchitectureKnowledgeAuditField =
  (typeof ARCHITECTURE_KNOWLEDGE_AUDIT_FIELDS)[number];

export const PROPRIETARY_ISA_BOUNDARY_CYCLE = [
  'honesty_locks',
  'proprietary_isa_boundary_bootstrap',
  // A — Structure
  'allowed_sources_encoded',
  'blocked_material_encoded',
  'rights_states_encoded',
  'classification_outcomes_encoded',
  'core_flow_encoded',
  'audit_fields_encoded',
  // B — Truth
  'unknown_rights_quarantines_not_auto_ingest',
  'allowed_learning_not_proprietary_copy',
  'tenant_private_not_global_kb',
  // C — Denies
  'deny_private_rtl',
  'deny_confidential_microarchitecture',
  'deny_firmware_signing_keys',
  'deny_leaked_or_stolen',
  'deny_trade_secrets',
  'deny_promote_quarantine_to_global',
  // D — Autonomy
  'guardian_rls_tenant_universe_isolation',
  'recommend_neq_act',
  'l4_autonomy_false',
  // E — Soft-wires
  'eq3_soft_wire',
  'eq2_soft_wire',
  'eq1_soft_wire',
  'ep16_soft_wire',
  'em157_soft_wire',
  'db_candidates_not_applied',
  'evidence',
] as const;

export type Eq4Hop = (typeof PROPRIETARY_ISA_BOUNDARY_CYCLE)[number];

export type Eq4EvidenceState =
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
  | 'ALLOW'
  | 'QUARANTINE'
  | 'DENY';

export type Eq4HopRecord = {
  hop: Eq4Hop;
  state: Eq4EvidenceState;
  summary: string;
  at: string;
};

export type Eq4ActorKind =
  | 'rights_gate'
  | 'architecture_learner'
  | 'proposal'
  | 'human_approver'
  | 'founder'
  | 'guardian'
  | 'home_base'
  | 'tenant_admin';

export type Eq4Actor = {
  kind: Eq4ActorKind;
  id: string;
  orgId: string;
  tenantId: string;
  universeId: string;
  permissions: readonly string[];
};

export const EQ4_LOCKS = Object.freeze({
  L4_AUTONOMY_ENABLED: false as const,
  TIP_LAND: false as const,
  PRODUCTION_AUTHORIZATION: false as const,
  PRODUCTION_WRITE: false as const,
  DB_CANDIDATES_APPLIED: false as const,
  FULL_PRODUCTION_ISA_BOUNDARY_SHIPPED: false as const,
  MANAGE_PULL_REQUEST: false as const,

  // Core rules
  UNKNOWN_RIGHTS_AUTO_INGEST: false as const,
  TENANT_PRIVATE_EQ_GLOBAL_KB: false as const,
  LEARN_CONFIDENTIAL_IMPLEMENTATION_INTERNALS: false as const,
  COPY_PROPRIETARY_DESIGN: false as const,
  PROMOTE_QUARANTINE_TO_GLOBAL: false as const,

  // Blocked material
  PRIVATE_RTL_INGESTION: false as const,
  CONFIDENTIAL_MICROARCHITECTURE_INGESTION: false as const,
  FIRMWARE_SIGNING_KEYS_INGESTION: false as const,
  UNRELEASED_ROADMAPS_INGESTION: false as const,
  LEAKED_SOURCE_INGESTION: false as const,
  PRIVATE_INSTRUCTION_EXTENSIONS_INGESTION: false as const,
  TRADE_SECRETS_INGESTION: false as const,
  STOLEN_BENCHMARK_DATABASES_INGESTION: false as const,
  CONFIDENTIAL_MANUFACTURING_DATA_INGESTION: false as const,
  REVERSE_ENGINEERED_RESTRICTED_DETAILS_INGESTION: false as const,

  // Autonomy
  AGENT_AUTO_AUTHORITY: false as const,
  RECOMMEND_EQ_ACT: false as const,
  RECOMMEND_EQ_AUTHORIZE: false as const,
  HIDDEN_CHAIN_OF_THOUGHT_IN_RIGHTS_GATE: false as const,

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

export const RIGHTS_GATE_AGENT_BOUNDS = Object.freeze({
  mayClassifySources: true as const,
  mayAllowPublicAndLicensedSources: true as const,
  mayQuarantineUnknownRights: true as const,
  mayScopeAuthorizedPrivateToTenantUniverse: true as const,
  mayReturnEvidenceToHomeBase: true as const,
  automaticAuthority: false as const,
  mayAutoIngestUnknownRights: false as const,
  mayPromoteTenantPrivateToGlobalKb: false as const,
  mayLearnConfidentialImplementationInternals: false as const,
  mayCopyProprietaryDesign: false as const,
  mayPromoteQuarantineToGlobal: false as const,
  mayIngestBlockedMaterial: false as const,
  mayIncludeHiddenChainOfThought: false as const,
  mayRecommendOnly: true as const,
});

export const EQ4_MAY = Object.freeze([
  'allow_public_open_vendor_doc_licensed_and_xiv_benchmark_sources',
  'quarantine_unknown_rights_instead_of_auto_ingest',
  'deny_restricted_confidential_and_leaked_or_stolen',
  'scope_authorized_private_to_tenant_universe_only',
  'retain_audit_fields_with_revocation_path',
  'learn_semantics_compiler_workload_benchmark_not_proprietary_internals',
] as const);

export const EQ4_MUST_NOT = Object.freeze([
  'auto_ingest_unknown_rights',
  'promote_tenant_private_to_global_knowledge_base',
  'ingest_private_rtl_or_confidential_microarchitecture',
  'ingest_firmware_keys_leaked_code_or_trade_secrets',
  'copy_proprietary_design',
  'promote_quarantine_to_global',
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

export type Eq4SoftWireSnapshot = {
  eq3RiscvOpenIsaKnowledgePack: SoftWirePresence;
  eq3Report: SoftWirePresence;
  eq2ArmArchitectureKnowledgePack: SoftWirePresence;
  eq2Report: SoftWirePresence;
  eq1CrossArchitectureContract: SoftWirePresence;
  eq1Report: SoftWirePresence;
  ep16NoOverclockBiosRule: SoftWirePresence;
  ep16Report: SoftWirePresence;
  em157HomeBase: SoftWirePresence;
};

export function assertEq4LocksIntact(): boolean {
  return (
    EQ4_LOCKS.L4_AUTONOMY_ENABLED === false &&
    EQ4_LOCKS.UNKNOWN_RIGHTS_AUTO_INGEST === false &&
    EQ4_LOCKS.TENANT_PRIVATE_EQ_GLOBAL_KB === false &&
    EQ4_LOCKS.LEARN_CONFIDENTIAL_IMPLEMENTATION_INTERNALS === false &&
    EQ4_LOCKS.COPY_PROPRIETARY_DESIGN === false &&
    EQ4_LOCKS.PROMOTE_QUARANTINE_TO_GLOBAL === false &&
    EQ4_LOCKS.PRIVATE_RTL_INGESTION === false &&
    EQ4_LOCKS.CONFIDENTIAL_MICROARCHITECTURE_INGESTION === false &&
    EQ4_LOCKS.FIRMWARE_SIGNING_KEYS_INGESTION === false &&
    EQ4_LOCKS.UNRELEASED_ROADMAPS_INGESTION === false &&
    EQ4_LOCKS.LEAKED_SOURCE_INGESTION === false &&
    EQ4_LOCKS.PRIVATE_INSTRUCTION_EXTENSIONS_INGESTION === false &&
    EQ4_LOCKS.TRADE_SECRETS_INGESTION === false &&
    EQ4_LOCKS.STOLEN_BENCHMARK_DATABASES_INGESTION === false &&
    EQ4_LOCKS.CONFIDENTIAL_MANUFACTURING_DATA_INGESTION === false &&
    EQ4_LOCKS.REVERSE_ENGINEERED_RESTRICTED_DETAILS_INGESTION === false &&
    EQ4_LOCKS.AGENT_AUTO_AUTHORITY === false &&
    EQ4_LOCKS.RECOMMEND_EQ_ACT === false &&
    EQ4_LOCKS.RECOMMEND_EQ_AUTHORIZE === false &&
    EQ4_LOCKS.HIDDEN_CHAIN_OF_THOUGHT_IN_RIGHTS_GATE === false &&
    EQ4_LOCKS.BYPASS_GUARDIAN_RLS_TENANT_UNIVERSE === false &&
    EQ4_LOCKS.GUARDIAN_RLS_TENANT_UNIVERSE_ISOLATION_UNCHANGED === true &&
    EQ4_LOCKS.HUMAN_APPROVAL_BOUNDARIES_UNCHANGED === true &&
    EQ4_LOCKS.DOCUMENTED_EQ_IMPLEMENTED === false &&
    EQ4_LOCKS.IMPLEMENTED_EQ_VERIFIED === false &&
    EQ4_LOCKS.VERIFIED_EQ_PRODUCTION_AUTHORIZED === false &&
    EQ4_LOCKS.HUMAN_APPROVAL_REQUIRED_BEFORE_CONSEQUENTIAL_ACTIONS === true &&
    EQ4_LOCKS.TIP_LAND === false &&
    EQ4_LOCKS.PRODUCTION_AUTHORIZATION === false &&
    EQ4_LOCKS.DB_CANDIDATES_APPLIED === false &&
    EQ4_LOCKS.FULL_PRODUCTION_ISA_BOUNDARY_SHIPPED === false &&
    EQ4_LOCKS.MANAGE_PULL_REQUEST === false &&
    RIGHTS_GATE_AGENT_BOUNDS.automaticAuthority === false &&
    RIGHTS_GATE_AGENT_BOUNDS.mayAutoIngestUnknownRights === false &&
    RIGHTS_GATE_AGENT_BOUNDS.mayPromoteTenantPrivateToGlobalKb === false &&
    RIGHTS_GATE_AGENT_BOUNDS.mayLearnConfidentialImplementationInternals ===
      false &&
    RIGHTS_GATE_AGENT_BOUNDS.mayCopyProprietaryDesign === false &&
    RIGHTS_GATE_AGENT_BOUNDS.mayPromoteQuarantineToGlobal === false &&
    RIGHTS_GATE_AGENT_BOUNDS.mayIngestBlockedMaterial === false &&
    RIGHTS_GATE_AGENT_BOUNDS.mayIncludeHiddenChainOfThought === false
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

export function eq4SoftWireSnapshot(repoRoot?: string): Eq4SoftWireSnapshot {
  const root =
    repoRoot ?? join(dirname(fileURLToPath(import.meta.url)), '../../..');

  return {
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

export function isHumanApprover(actor: Eq4Actor): boolean {
  return (
    actor.kind === 'human_approver' ||
    actor.kind === 'founder' ||
    actor.kind === 'tenant_admin'
  );
}

export function isRightsGateAgent(actor: Eq4Actor): boolean {
  const agents: readonly Eq4ActorKind[] = [
    'rights_gate',
    'architecture_learner',
    'proposal',
  ];
  return agents.includes(actor.kind);
}

/**
 * Map rights state to classification outcome.
 */
export function classifyRightsState(
  rightsState: SourceRightsState,
): RightsClassificationOutcome {
  switch (rightsState) {
    case 'PUBLIC_OPEN':
    case 'PUBLIC_VENDOR_DOC':
    case 'LICENSED':
      return 'ALLOW';
    case 'AUTHORIZED_PRIVATE':
      // Allowed only in tenant/Universe scope — classification is ALLOW scoped
      return 'ALLOW';
    case 'UNKNOWN_RIGHTS':
      return 'QUARANTINE';
    case 'RESTRICTED':
    case 'CONFIDENTIAL':
    case 'LEAKED_OR_STOLEN':
      return 'DENY';
    default: {
      const _exhaustive: never = rightsState;
      void _exhaustive;
      return 'QUARANTINE';
    }
  }
}
