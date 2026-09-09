/**
 * 62L-EP4 — Proprietary-IP Firewall (park-and-implement).
 *
 * Strict IP/data-rights firewall so the Virtual Chip research brain can learn
 * aggressively from lawful sources without ingesting confidential designs,
 * leaked materials, stolen datasets, or restricted company information.
 *
 * Core rule: Source → Rights Check → Classification → Allow / Quarantine / Deny
 * → Research Use
 *
 * SoT: GitHub #160 / 62L-EP family (authoritative per founder). GitLab mirror:
 * not resolved in this environment (GitLab MCP needsAuth; no issue number invented).
 *
 * Soft-wire when PRESENT: EP2, EP1, EP3 (WAITING_DATA if absent), EM (#157).
 * Presence ≠ VERIFIED.
 *
 * Honesty: DOCUMENTED ≠ IMPLEMENTED ≠ VERIFIED ≠ PRODUCTION AUTHORIZED.
 * L4_AUTONOMY_ENABLED=false.
 * UNKNOWN_RIGHTS → QUARANTINED (not auto-accepted).
 * Customer A private knowledge ≠ global training corpus.
 * Neural memory: claim + citation + provenance + rights state + confidence +
 * context — not copied proprietary repos or restricted corpora.
 * Guardian/RLS/tenant/Universe isolation mandatory.
 * DB candidates NOT_APPLIED. tip-land=NO. No PR from this phase.
 * Next (report only): EP5 — Public Benchmark Memory.
 */

import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

export const HONESTY_BANNER =
  'DOCUMENTED ≠ IMPLEMENTED ≠ VERIFIED ≠ PRODUCTION AUTHORIZED' as const;

export const GITHUB_SOT_ISSUE = 160 as const;
export const GITHUB_SOT_LABEL = '62L-EP4' as const;
export const GITHUB_SOT_FAMILY = '62L-EP' as const;
export const GITHUB_SOT_TITLE =
  '62L-EP4 Proprietary-IP Firewall — strict IP/data-rights firewall for Virtual Chip research: Source → Rights Check → Classification → Allow/Quarantine/Deny → Research Use' as const;

export const GITLAB_MIRROR_NOTE =
  'GitLab mirror: search attempted; MCP needsAuth / not resolved in this environment — no issue number invented.' as const;

export const EP4_DB_CANDIDATES_STATUS = 'NOT_APPLIED' as const;

export const NEXT_PHASE_TITLE =
  'EP5 — Public Benchmark Memory — provenance-backed memory of lawful chip/runtime/model benchmarks; separate published benchmark evidence from XIV locally verified measurements.' as const;

/**
 * Core firewall flow:
 * Source → Rights Check → Classification → Allow / Quarantine / Deny → Research Use
 */
export const IP_FIREWALL_CORE_FLOW = [
  'source',
  'rights_check',
  'classification',
  'allow_quarantine_or_deny',
  'research_use',
] as const;

export type IpFirewallCoreFlowHop = (typeof IP_FIREWALL_CORE_FLOW)[number];

/**
 * Required source / rights states.
 */
export const SOURCE_RIGHTS_STATES = [
  'PUBLIC_DOMAIN',
  'OPEN_LICENSE',
  'VENDOR_PUBLIC_DOCUMENTATION',
  'PEER_REVIEWED',
  'LICENSED',
  'USER_AUTHORIZED',
  'CUSTOMER_AUTHORIZED',
  'PARTNER_AUTHORIZED',
  'UNKNOWN_RIGHTS',
  'RESTRICTED',
  'LEAKED_OR_STOLEN',
  'CONFIDENTIAL',
] as const;

export type SourceRightsState = (typeof SOURCE_RIGHTS_STATES)[number];

/** Categories that may enter promoted XIV knowledge when evidenced. */
export const PROMOTABLE_RIGHTS_STATES = [
  'PUBLIC_DOMAIN',
  'OPEN_LICENSE',
  'VENDOR_PUBLIC_DOCUMENTATION',
  'PEER_REVIEWED',
  'LICENSED',
  'USER_AUTHORIZED',
  'CUSTOMER_AUTHORIZED',
  'PARTNER_AUTHORIZED',
] as const;

export type PromotableRightsState = (typeof PROMOTABLE_RIGHTS_STATES)[number];

/** Categories that must never auto-promote. */
export const BLOCKED_RIGHTS_STATES = [
  'UNKNOWN_RIGHTS',
  'RESTRICTED',
  'LEAKED_OR_STOLEN',
  'CONFIDENTIAL',
] as const;

export type BlockedRightsState = (typeof BLOCKED_RIGHTS_STATES)[number];

export const FIREWALL_DECISIONS = [
  'ALLOW',
  'QUARANTINE',
  'DENY',
] as const;

export type FirewallDecision = (typeof FIREWALL_DECISIONS)[number];

/**
 * Sensitivity materials the firewall should detect and block.
 */
export const BLOCKED_SENSITIVITY_MATERIALS = [
  'private_schematics',
  'confidential_chip_roadmaps',
  'firmware_signing_keys',
  'proprietary_source_code',
  'internal_benchmarks',
  'leaked_datasets',
  'employee_only_documents',
  'trade_secrets',
  'credentials_tokens',
  'restricted_manufacturing_details',
  'private_customer_company_data_without_authorization',
] as const;

export type BlockedSensitivityMaterial =
  (typeof BLOCKED_SENSITIVITY_MATERIALS)[number];

/**
 * Required research promotion workflow:
 * Research Agent finds source → provenance scan → rights/license check →
 * sensitivity classification → security review → knowledge candidate →
 * reviewer approval → graph promotion
 */
export const IP_FIREWALL_PROMOTION_WORKFLOW = [
  'research_agent_finds_source',
  'provenance_scan',
  'rights_license_check',
  'sensitivity_classification',
  'security_review',
  'knowledge_candidate',
  'reviewer_approval',
  'graph_promotion',
] as const;

export type IpFirewallPromotionHop =
  (typeof IP_FIREWALL_PROMOTION_WORKFLOW)[number];

/**
 * Neural memory fields stored (not copied proprietary repos).
 */
export const NEURAL_MEMORY_FIELDS = [
  'claim',
  'citation',
  'provenance',
  'rightsState',
  'confidence',
  'context',
] as const;

export type NeuralMemoryField = (typeof NEURAL_MEMORY_FIELDS)[number];

/**
 * Audit fields for every promoted research node.
 */
export const PROMOTED_NODE_AUDIT_FIELDS = [
  'sourceId',
  'rightsState',
  'ingestedBy',
  'reviewedBy',
  'purpose',
  'tenantUniverse',
  'timestamp',
  'retention',
  'revocationPath',
] as const;

export type PromotedNodeAuditField =
  (typeof PROMOTED_NODE_AUDIT_FIELDS)[number];

/**
 * Agent must-not safeguards.
 */
export const AGENT_MUST_NOT_SAFEGUARDS = [
  'bypass_paywalls_access_controls',
  'harvest_credentials',
  'scrape_private_systems',
  'use_leaked_repositories',
  'clone_proprietary_databases',
  'share_private_customer_information_across_tenants',
  'reinterpret_research_as_permission_to_copy_protected_assets',
] as const;

export const PROPRIETARY_IP_FIREWALL_CYCLE = [
  'honesty_locks',
  'ip_firewall_bootstrap',
  // A — Structure
  'core_flow_encoded',
  'source_rights_states_encoded',
  'promotable_vs_blocked_rights_encoded',
  'blocked_sensitivity_materials_encoded',
  'promotion_workflow_encoded',
  'neural_memory_fields_encoded',
  'promoted_node_audit_fields_encoded',
  // B — Core decisions
  'unknown_rights_quarantined',
  'restricted_leaked_confidential_denied',
  'only_authorized_categories_promotable',
  'organization_boundary_private_neq_global',
  // C — Agent / audit / revocation
  'agent_safeguards_encoded',
  'no_agent_bypass_paywall',
  'no_harvest_credentials',
  'no_cross_tenant_private_share',
  'revocation_identifies_dependents',
  'neural_memory_neq_copied_proprietary_repos',
  'guardian_rls_tenant_universe_isolation',
  'recommend_neq_act',
  'l4_autonomy_false',
  // D — Soft-wires
  'ep2_soft_wire',
  'ep1_soft_wire',
  'ep3_soft_wire',
  'em157_soft_wire',
  'db_candidates_not_applied',
  'evidence',
] as const;

export type Ep4Hop = (typeof PROPRIETARY_IP_FIREWALL_CYCLE)[number];

export type Ep4EvidenceState =
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
  | 'QUARANTINED'
  | 'ALLOWED'
  | 'UNKNOWN';

export type Ep4HopRecord = {
  hop: Ep4Hop;
  state: Ep4EvidenceState;
  summary: string;
  at: string;
};

export type Ep4ActorKind =
  | 'research_agent'
  | 'provenance_scanner'
  | 'rights_classifier'
  | 'security_reviewer'
  | 'knowledge_steward'
  | 'proposal'
  | 'human_approver'
  | 'founder'
  | 'guardian'
  | 'home_base';

export type Ep4Actor = {
  kind: Ep4ActorKind;
  id: string;
  orgId: string;
  tenantId: string;
  universeId: string;
  permissions: readonly string[];
};

export const EP4_LOCKS = Object.freeze({
  L4_AUTONOMY_ENABLED: false as const,
  TIP_LAND: false as const,
  PRODUCTION_AUTHORIZATION: false as const,
  PRODUCTION_WRITE: false as const,
  DB_CANDIDATES_APPLIED: false as const,
  FULL_PRODUCTION_IP_FIREWALL_SHIPPED: false as const,
  MANAGE_PULL_REQUEST: false as const,

  // Rights honesty
  UNKNOWN_RIGHTS_AUTO_ACCEPT: false as const,
  RESTRICTED_AUTO_PROMOTE: false as const,
  LEAKED_OR_STOLEN_AUTO_PROMOTE: false as const,
  CONFIDENTIAL_AUTO_PROMOTE: false as const,
  PRIVATE_CUSTOMER_EQ_GLOBAL_CORPUS: false as const,

  // Blocked materials
  INGEST_PRIVATE_SCHEMATICS: false as const,
  INGEST_CONFIDENTIAL_CHIP_ROADMAPS: false as const,
  INGEST_FIRMWARE_SIGNING_KEYS: false as const,
  INGEST_PROPRIETARY_SOURCE_CODE: false as const,
  INGEST_INTERNAL_BENCHMARKS: false as const,
  INGEST_LEAKED_DATASETS: false as const,
  INGEST_EMPLOYEE_ONLY_DOCUMENTS: false as const,
  INGEST_TRADE_SECRETS: false as const,
  INGEST_CREDENTIALS_TOKENS: false as const,
  INGEST_RESTRICTED_MANUFACTURING_DETAILS: false as const,
  INGEST_PRIVATE_CUSTOMER_DATA_WITHOUT_AUTH: false as const,

  // Agent safeguards
  BYPASS_PAYWALLS_ACCESS_CONTROLS: false as const,
  HARVEST_CREDENTIALS: false as const,
  SCRAPE_PRIVATE_SYSTEMS: false as const,
  USE_LEAKED_REPOSITORIES: false as const,
  CLONE_PROPRIETARY_DATABASES: false as const,
  SHARE_PRIVATE_CUSTOMER_INFO_ACROSS_TENANTS: false as const,
  RESEARCH_EQ_COPY_PROTECTED_ASSETS: false as const,

  // Neural memory
  COPY_PROPRIETARY_REPOSITORIES_INTO_MEMORY: false as const,
  STORE_ENTIRE_RESTRICTED_CORPORA: false as const,

  // Autonomy
  AGENT_AUTO_AUTHORITY: false as const,
  AUTO_GRAPH_PROMOTION_WITHOUT_REVIEW: false as const,

  // Recommend ≠ act
  RECOMMEND_EQ_ACT: false as const,
  RECOMMEND_EQ_INGEST: false as const,
  RECOMMEND_EQ_PROMOTE: false as const,

  // Isolation
  BYPASS_GUARDIAN_RLS_TENANT_UNIVERSE: false as const,
  GUARDIAN_RLS_TENANT_UNIVERSE_ISOLATION_UNCHANGED: true as const,

  // Honesty ladder
  DOCUMENTED_EQ_IMPLEMENTED: false as const,
  IMPLEMENTED_EQ_VERIFIED: false as const,
  VERIFIED_EQ_PRODUCTION_AUTHORIZED: false as const,

  HUMAN_APPROVAL_REQUIRED_BEFORE_GRAPH_PROMOTION: true as const,
  REVOCATION_MUST_IDENTIFY_DEPENDENTS: true as const,
});

export const IP_FIREWALL_AGENT_BOUNDS = Object.freeze({
  mayReturnEvidenceToHomeBase: true as const,
  automaticAuthority: false as const,
  mayAutoAcceptUnknownRights: false as const,
  mayBypassPaywalls: false as const,
  mayHarvestCredentials: false as const,
  maySharePrivateAcrossTenants: false as const,
  mayCopyProprietaryReposIntoMemory: false as const,
  mayRecommendOnly: true as const,
});

export const EP4_MAY = Object.freeze([
  'classify_source_rights_states',
  'run_provenance_and_rights_checks',
  'quarantine_unknown_rights',
  'deny_restricted_leaked_confidential',
  'prepare_knowledge_candidates',
  'require_reviewer_approval_before_promotion',
  'store_structured_neural_memory_fields',
  'record_promoted_node_audit_fields',
  'identify_dependents_on_revocation',
  'return_agent_evidence_to_home_base',
] as const);

export const EP4_MUST_NOT = Object.freeze([
  'auto_accept_unknown_rights',
  'auto_promote_restricted_leaked_confidential',
  'treat_customer_private_as_global_corpus',
  'ingest_blocked_sensitivity_materials',
  'bypass_paywalls_access_controls',
  'harvest_credentials',
  'scrape_private_systems',
  'use_leaked_repositories',
  'clone_proprietary_databases',
  'share_private_customer_information_across_tenants',
  'reinterpret_research_as_copy_permission',
  'copy_proprietary_repositories_into_memory',
  'auto_graph_promotion_without_review',
  'bypass_guardian_rls_tenant_universe',
  'treat_recommend_as_act',
  'grant_agents_automatic_authority',
] as const);

export type SoftWirePresence = {
  present: boolean;
  pathChecked: string;
  note: string;
};

export type Ep4SoftWireSnapshot = {
  ep2CapabilityGraph: SoftWirePresence;
  ep2Report: SoftWirePresence;
  ep1VirtualChipContract: SoftWirePresence;
  ep1Report: SoftWirePresence;
  ep3ChipResearchAgentTeam: SoftWirePresence;
  ep3Report: SoftWirePresence;
  em157HomeBase: SoftWirePresence;
};

export function assertEp4LocksIntact(): boolean {
  return (
    EP4_LOCKS.L4_AUTONOMY_ENABLED === false &&
    EP4_LOCKS.UNKNOWN_RIGHTS_AUTO_ACCEPT === false &&
    EP4_LOCKS.RESTRICTED_AUTO_PROMOTE === false &&
    EP4_LOCKS.LEAKED_OR_STOLEN_AUTO_PROMOTE === false &&
    EP4_LOCKS.CONFIDENTIAL_AUTO_PROMOTE === false &&
    EP4_LOCKS.PRIVATE_CUSTOMER_EQ_GLOBAL_CORPUS === false &&
    EP4_LOCKS.INGEST_PRIVATE_SCHEMATICS === false &&
    EP4_LOCKS.INGEST_CONFIDENTIAL_CHIP_ROADMAPS === false &&
    EP4_LOCKS.INGEST_FIRMWARE_SIGNING_KEYS === false &&
    EP4_LOCKS.INGEST_PROPRIETARY_SOURCE_CODE === false &&
    EP4_LOCKS.INGEST_INTERNAL_BENCHMARKS === false &&
    EP4_LOCKS.INGEST_LEAKED_DATASETS === false &&
    EP4_LOCKS.INGEST_EMPLOYEE_ONLY_DOCUMENTS === false &&
    EP4_LOCKS.INGEST_TRADE_SECRETS === false &&
    EP4_LOCKS.INGEST_CREDENTIALS_TOKENS === false &&
    EP4_LOCKS.INGEST_RESTRICTED_MANUFACTURING_DETAILS === false &&
    EP4_LOCKS.INGEST_PRIVATE_CUSTOMER_DATA_WITHOUT_AUTH === false &&
    EP4_LOCKS.BYPASS_PAYWALLS_ACCESS_CONTROLS === false &&
    EP4_LOCKS.HARVEST_CREDENTIALS === false &&
    EP4_LOCKS.SCRAPE_PRIVATE_SYSTEMS === false &&
    EP4_LOCKS.USE_LEAKED_REPOSITORIES === false &&
    EP4_LOCKS.CLONE_PROPRIETARY_DATABASES === false &&
    EP4_LOCKS.SHARE_PRIVATE_CUSTOMER_INFO_ACROSS_TENANTS === false &&
    EP4_LOCKS.RESEARCH_EQ_COPY_PROTECTED_ASSETS === false &&
    EP4_LOCKS.COPY_PROPRIETARY_REPOSITORIES_INTO_MEMORY === false &&
    EP4_LOCKS.STORE_ENTIRE_RESTRICTED_CORPORA === false &&
    EP4_LOCKS.AGENT_AUTO_AUTHORITY === false &&
    EP4_LOCKS.AUTO_GRAPH_PROMOTION_WITHOUT_REVIEW === false &&
    EP4_LOCKS.RECOMMEND_EQ_ACT === false &&
    EP4_LOCKS.RECOMMEND_EQ_INGEST === false &&
    EP4_LOCKS.RECOMMEND_EQ_PROMOTE === false &&
    EP4_LOCKS.BYPASS_GUARDIAN_RLS_TENANT_UNIVERSE === false &&
    EP4_LOCKS.GUARDIAN_RLS_TENANT_UNIVERSE_ISOLATION_UNCHANGED === true &&
    EP4_LOCKS.DOCUMENTED_EQ_IMPLEMENTED === false &&
    EP4_LOCKS.IMPLEMENTED_EQ_VERIFIED === false &&
    EP4_LOCKS.VERIFIED_EQ_PRODUCTION_AUTHORIZED === false &&
    EP4_LOCKS.HUMAN_APPROVAL_REQUIRED_BEFORE_GRAPH_PROMOTION === true &&
    EP4_LOCKS.REVOCATION_MUST_IDENTIFY_DEPENDENTS === true &&
    EP4_LOCKS.TIP_LAND === false &&
    EP4_LOCKS.PRODUCTION_AUTHORIZATION === false &&
    EP4_LOCKS.DB_CANDIDATES_APPLIED === false &&
    EP4_LOCKS.FULL_PRODUCTION_IP_FIREWALL_SHIPPED === false &&
    EP4_LOCKS.MANAGE_PULL_REQUEST === false &&
    IP_FIREWALL_AGENT_BOUNDS.automaticAuthority === false &&
    IP_FIREWALL_AGENT_BOUNDS.mayAutoAcceptUnknownRights === false &&
    IP_FIREWALL_AGENT_BOUNDS.mayBypassPaywalls === false &&
    IP_FIREWALL_AGENT_BOUNDS.mayHarvestCredentials === false &&
    IP_FIREWALL_AGENT_BOUNDS.maySharePrivateAcrossTenants === false &&
    IP_FIREWALL_AGENT_BOUNDS.mayCopyProprietaryReposIntoMemory === false
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

export function ep4SoftWireSnapshot(repoRoot?: string): Ep4SoftWireSnapshot {
  const root =
    repoRoot ?? join(dirname(fileURLToPath(import.meta.url)), '../../..');

  return {
    ep2CapabilityGraph: softWireFile(
      './cross-vendor-capability-graph-types.ts',
      'EP2 Cross-Vendor Capability Graph PRESENT (soft-wire).',
      'EP2 Cross-Vendor Capability Graph absent — soft-wire WAITING_DATA.',
    ),
    ep2Report: softWireRepoRelative(
      root,
      'docs/operations/62L_EP2_CROSS_VENDOR_CAPABILITY_GRAPH_REPORT.md',
      'EP2 report PRESENT.',
      'EP2 report absent — soft-wire WAITING_DATA.',
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
    ep3ChipResearchAgentTeam: softWireFile(
      './chip-research-agent-team-types.ts',
      'EP3 Chip Research Agent Team PRESENT (soft-wire).',
      'EP3 Chip Research Agent Team absent on this tip — soft-wire WAITING_DATA (EP4 branched from EP2).',
    ),
    ep3Report: softWireRepoRelative(
      root,
      'docs/operations/62L_EP3_CHIP_RESEARCH_AGENT_TEAM_REPORT.md',
      'EP3 report PRESENT.',
      'EP3 report absent — soft-wire WAITING_DATA.',
    ),
    em157HomeBase: softWireFile(
      './agent-compute-home-base-types.ts',
      'EM (#157) Agent Compute Home Base PRESENT (soft-wire).',
      'EM (#157) Agent Compute Home Base absent — soft-wire WAITING_DATA.',
    ),
  };
}

export function isHumanApprover(actor: Ep4Actor): boolean {
  return actor.kind === 'human_approver' || actor.kind === 'founder';
}

export function isIpFirewallAgent(actor: Ep4Actor): boolean {
  const agents: readonly Ep4ActorKind[] = [
    'research_agent',
    'provenance_scanner',
    'rights_classifier',
    'security_reviewer',
    'knowledge_steward',
    'proposal',
  ];
  return agents.includes(actor.kind);
}

export function isPromotableRightsState(
  state: SourceRightsState,
): state is PromotableRightsState {
  return (PROMOTABLE_RIGHTS_STATES as readonly string[]).includes(state);
}

export function decideFirewallAction(
  rightsState: SourceRightsState,
): FirewallDecision {
  if (rightsState === 'UNKNOWN_RIGHTS') return 'QUARANTINE';
  if (
    rightsState === 'RESTRICTED' ||
    rightsState === 'LEAKED_OR_STOLEN' ||
    rightsState === 'CONFIDENTIAL'
  ) {
    return 'DENY';
  }
  if (isPromotableRightsState(rightsState)) return 'ALLOW';
  return 'QUARANTINE';
}
