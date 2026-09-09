/**
 * 62L-ER3 — Public Data Source Registry (park-and-implement).
 *
 * Governed registry of lawful public/open/licensed datasets so research agents
 * can expand the XIV brain with real historical, scientific, business,
 * geospatial, economic, logistics, and technical knowledge while preserving
 * provenance and usage rights.
 *
 * Historical brain rule: no orphan facts — retain
 * source → date → geography → context → claim → confidence → contradiction state.
 *
 * UNKNOWN_RIGHTS stays quarantined (not global brain).
 * Soft-wire when PRESENT: EP4, EP5, EP10, EM (#157). Presence ≠ VERIFIED.
 *
 * SoT: GitHub 62L-ER family — issue number not resolved via `gh` in this
 * environment (letter-order after EP #160 would be #161; not invented as
 * confirmed SoT — founder may supply). GitLab mirror: needsAuth; no number invented.
 *
 * Honesty: DOCUMENTED ≠ IMPLEMENTED ≠ VERIFIED ≠ PRODUCTION AUTHORIZED.
 * L4_AUTONOMY_ENABLED=false. DB candidates NOT_APPLIED. tip-land=NO.
 * Next (report only): ER4 — Rights & Provenance Gate.
 */

import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

export const HONESTY_BANNER =
  'DOCUMENTED ≠ IMPLEMENTED ≠ VERIFIED ≠ PRODUCTION AUTHORIZED' as const;

/** Provisional letter-order candidate after EP #160; gh unresolved — not confirmed founder SoT. */
export const GITHUB_SOT_ISSUE_PROVISIONAL = 161 as const;
export const GITHUB_SOT_ISSUE_STATUS =
  'UNRESOLVED_IN_ENVIRONMENT' as const;
export const GITHUB_SOT_LABEL = '62L-ER3' as const;
export const GITHUB_SOT_FAMILY = '62L-ER' as const;
export const GITHUB_SOT_TITLE =
  '62L-ER3 Public Data Source Registry — governed lawful public/open/licensed dataset registry with provenance, rights states, and historical brain chain (no orphan facts)' as const;

export const GITLAB_MIRROR_NOTE =
  'GitLab mirror: search attempted; MCP needsAuth / not resolved in this environment — no issue number invented.' as const;

export const GITHUB_SOT_NOTE =
  'GitHub SoT: 62L-ER family; `gh issue view` for provisional #161 unresolved in this environment — no confirmed issue number invented; founder may supply authoritative SoT issue.' as const;

export const ER3_DB_CANDIDATES_STATUS = 'NOT_APPLIED' as const;

export const NEXT_PHASE_TITLE =
  'ER4 — Rights & Provenance Gate — decide whether a discovered dataset or API result is legally and technically eligible to enter XIV’s online or offline brain.' as const;

/**
 * Core flow:
 * Discover source → rights/provenance review → schema/quality check → approve →
 * ingest/index → cite → monitor freshness
 */
export const PUBLIC_DATA_SOURCE_CORE_FLOW = [
  'discover_source',
  'rights_provenance_review',
  'schema_quality_check',
  'approve',
  'ingest_index',
  'cite',
  'monitor_freshness',
] as const;

export type PublicDataSourceCoreFlowHop =
  (typeof PUBLIC_DATA_SOURCE_CORE_FLOW)[number];

/**
 * Data source tracking fields.
 */
export const DATA_SOURCE_RECORD_FIELDS = [
  'sourceId',
  'sourceProvider',
  'datasetTitle',
  'domain',
  'geography',
  'timeRange',
  'language',
  'accessMethod',
  'apiDownloadEndpoint',
  'licenseRightsState',
  'updateFrequency',
  'freshness',
  'schemaFormat',
  'estimatedSize',
  'dataQuality',
  'allowedUses',
  'retentionRestrictions',
  'provenance',
  'ingestionState',
  'reviewer',
  'evidenceRefs',
] as const;

export type DataSourceRecordField =
  (typeof DATA_SOURCE_RECORD_FIELDS)[number];

/**
 * Required source states.
 */
export const DATA_SOURCE_STATES = [
  'DISCOVERED',
  'RIGHTS_REVIEW',
  'APPROVED',
  'INGESTION_READY',
  'INGESTED',
  'STALE',
  'RESTRICTED',
  'DENIED',
] as const;

export type DataSourceState = (typeof DATA_SOURCE_STATES)[number];

/**
 * Priority dataset categories.
 */
export const DATA_SOURCE_PRIORITY_CATEGORIES = [
  'government_open_data',
  'procurement_and_public_awards',
  'census_demographics',
  'economics_and_trade',
  'transportation_logistics',
  'ports_roads_transit',
  'weather_climate',
  'geospatial_maps',
  'standards_specifications',
  'scientific_research',
  'semiconductor_history',
  'public_company_business_history',
  'historical_archives',
  'laws_regulations',
  'energy_infrastructure',
  'telecom_satellite_public_data',
] as const;

export type DataSourcePriorityCategory =
  (typeof DATA_SOURCE_PRIORITY_CATEGORIES)[number];

/**
 * Historical brain chain — no orphan facts.
 */
export const HISTORICAL_BRAIN_CHAIN = [
  'source',
  'date',
  'geography',
  'context',
  'claim',
  'confidence',
  'contradiction_state',
] as const;

export type HistoricalBrainChainField =
  (typeof HISTORICAL_BRAIN_CHAIN)[number];

/**
 * Offline knowledge pack preconditions.
 */
export const OFFLINE_KNOWLEDGE_PACK_PRECONDITIONS = [
  'licensing_permits_local_use',
  'size_storage_limits_fit',
  'version_recorded',
  'expiration_update_rules_exist',
  'tenant_device_scope_explicit',
] as const;

export type OfflineKnowledgePackPrecondition =
  (typeof OFFLINE_KNOWLEDGE_PACK_PRECONDITIONS)[number];

/**
 * Forbidden ingest materials / actions.
 */
export const DATA_SOURCE_MUST_NOT = [
  'leaked_datasets',
  'private_databases',
  'paywall_bypass',
  'restricted_archives',
  'stolen_records',
  'private_gps_histories',
  'confidential_company_data',
  'provider_data_outside_allowed_terms',
  'unknown_rights_into_global_brain',
  'orphan_facts_without_historical_chain',
] as const;

export const PUBLIC_DATA_SOURCE_REGISTRY_CYCLE = [
  'honesty_locks',
  'public_data_source_registry_bootstrap',
  // A — Structure
  'core_flow_encoded',
  'record_fields_encoded',
  'source_states_encoded',
  'priority_categories_encoded',
  'historical_brain_chain_encoded',
  'offline_pack_preconditions_encoded',
  'must_not_encoded',
  // B — Truth / rights
  'no_orphan_facts',
  'historical_chain_required',
  'unknown_rights_quarantined',
  'distinguish_historical_from_current',
  'offline_pack_requires_all_preconditions',
  // C — Safety
  'no_leaked_or_stolen_datasets',
  'no_paywall_bypass',
  'no_private_gps_or_confidential_company_data',
  'no_provider_data_outside_allowed_terms',
  'guardian_rls_tenant_universe_isolation',
  'recommend_neq_act',
  'l4_autonomy_false',
  // D — Soft-wires
  'ep4_soft_wire',
  'ep5_soft_wire',
  'ep10_soft_wire',
  'em157_soft_wire',
  'db_candidates_not_applied',
  'evidence',
] as const;

export type Er3Hop = (typeof PUBLIC_DATA_SOURCE_REGISTRY_CYCLE)[number];

export type Er3EvidenceState =
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
  | 'DISCOVERED'
  | 'APPROVED'
  | 'INGESTED'
  | 'STALE'
  | 'RESTRICTED'
  | 'UNKNOWN';

export type Er3HopRecord = {
  hop: Er3Hop;
  state: Er3EvidenceState;
  summary: string;
  at: string;
};

export type Er3ActorKind =
  | 'data_source_registry'
  | 'research_agent'
  | 'rights_reviewer'
  | 'ingestion_agent'
  | 'proposal'
  | 'human_approver'
  | 'founder'
  | 'guardian'
  | 'home_base';

export type Er3Actor = {
  kind: Er3ActorKind;
  id: string;
  orgId: string;
  tenantId: string;
  universeId: string;
  permissions: readonly string[];
};

export const ER3_LOCKS = Object.freeze({
  L4_AUTONOMY_ENABLED: false as const,
  TIP_LAND: false as const,
  PRODUCTION_AUTHORIZATION: false as const,
  PRODUCTION_WRITE: false as const,
  DB_CANDIDATES_APPLIED: false as const,
  FULL_PRODUCTION_PUBLIC_DATA_REGISTRY_SHIPPED: false as const,
  MANAGE_PULL_REQUEST: false as const,

  // Rights / ingest
  UNKNOWN_RIGHTS_INTO_GLOBAL_BRAIN: false as const,
  ORPHAN_FACTS_ALLOWED: false as const,
  LEAKED_DATASETS_ALLOWED: false as const,
  PRIVATE_DATABASES_ALLOWED: false as const,
  PAYWALL_BYPASS_ALLOWED: false as const,
  RESTRICTED_ARCHIVES_ALLOWED: false as const,
  STOLEN_RECORDS_ALLOWED: false as const,
  PRIVATE_GPS_HISTORIES_ALLOWED: false as const,
  CONFIDENTIAL_COMPANY_DATA_ALLOWED: false as const,
  PROVIDER_DATA_OUTSIDE_ALLOWED_TERMS: false as const,

  // Offline packs
  OFFLINE_PACK_WITHOUT_PRECONDITIONS: false as const,

  // Autonomy
  AGENT_AUTO_AUTHORITY: false as const,
  RECOMMEND_EQ_ACT: false as const,
  RECOMMEND_EQ_INGEST: false as const,

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

export const DATA_SOURCE_AGENT_BOUNDS = Object.freeze({
  mayDiscoverLawfulPublicSources: true as const,
  mayProposeRightsReview: true as const,
  mayCiteWithProvenance: true as const,
  mayReturnEvidenceToHomeBase: true as const,
  automaticAuthority: false as const,
  mayIngestUnknownRights: false as const,
  mayIngestOrphanFacts: false as const,
  mayBypassPaywall: false as const,
  mayIngestLeakedOrStolen: false as const,
  mayRecommendOnly: true as const,
});

export const ER3_MAY = Object.freeze([
  'discover_lawful_public_open_licensed_sources',
  'track_source_fields_and_states',
  'require_historical_brain_chain',
  'quarantine_unknown_rights',
  'approve_after_rights_and_quality_review',
  'monitor_freshness_and_mark_stale',
  'prepare_offline_packs_when_preconditions_met',
  'return_registry_evidence_to_home_base',
] as const);

export const ER3_MUST_NOT = Object.freeze([
  ...DATA_SOURCE_MUST_NOT,
  'bypass_rights_provenance_review',
  'ingest_without_historical_brain_chain',
  'build_offline_pack_without_preconditions',
  'bypass_guardian_rls_tenant_universe',
  'treat_recommend_as_act',
  'grant_agents_automatic_authority',
] as const);

export type SoftWirePresence = {
  present: boolean;
  pathChecked: string;
  note: string;
};

export type Er3SoftWireSnapshot = {
  ep4IpFirewall: SoftWirePresence;
  ep4Report: SoftWirePresence;
  ep5BenchmarkMemory: SoftWirePresence;
  ep5Report: SoftWirePresence;
  ep10OtherAcceleratorRegistry: SoftWirePresence;
  ep10Report: SoftWirePresence;
  em157HomeBase: SoftWirePresence;
};

export function assertEr3LocksIntact(): boolean {
  return (
    ER3_LOCKS.L4_AUTONOMY_ENABLED === false &&
    ER3_LOCKS.UNKNOWN_RIGHTS_INTO_GLOBAL_BRAIN === false &&
    ER3_LOCKS.ORPHAN_FACTS_ALLOWED === false &&
    ER3_LOCKS.LEAKED_DATASETS_ALLOWED === false &&
    ER3_LOCKS.PRIVATE_DATABASES_ALLOWED === false &&
    ER3_LOCKS.PAYWALL_BYPASS_ALLOWED === false &&
    ER3_LOCKS.RESTRICTED_ARCHIVES_ALLOWED === false &&
    ER3_LOCKS.STOLEN_RECORDS_ALLOWED === false &&
    ER3_LOCKS.PRIVATE_GPS_HISTORIES_ALLOWED === false &&
    ER3_LOCKS.CONFIDENTIAL_COMPANY_DATA_ALLOWED === false &&
    ER3_LOCKS.PROVIDER_DATA_OUTSIDE_ALLOWED_TERMS === false &&
    ER3_LOCKS.OFFLINE_PACK_WITHOUT_PRECONDITIONS === false &&
    ER3_LOCKS.AGENT_AUTO_AUTHORITY === false &&
    ER3_LOCKS.RECOMMEND_EQ_ACT === false &&
    ER3_LOCKS.RECOMMEND_EQ_INGEST === false &&
    ER3_LOCKS.BYPASS_GUARDIAN_RLS_TENANT_UNIVERSE === false &&
    ER3_LOCKS.GUARDIAN_RLS_TENANT_UNIVERSE_ISOLATION_UNCHANGED === true &&
    ER3_LOCKS.HUMAN_APPROVAL_BOUNDARIES_UNCHANGED === true &&
    ER3_LOCKS.DOCUMENTED_EQ_IMPLEMENTED === false &&
    ER3_LOCKS.IMPLEMENTED_EQ_VERIFIED === false &&
    ER3_LOCKS.VERIFIED_EQ_PRODUCTION_AUTHORIZED === false &&
    ER3_LOCKS.HUMAN_APPROVAL_REQUIRED_BEFORE_CONSEQUENTIAL_ACTIONS === true &&
    ER3_LOCKS.TIP_LAND === false &&
    ER3_LOCKS.PRODUCTION_AUTHORIZATION === false &&
    ER3_LOCKS.DB_CANDIDATES_APPLIED === false &&
    ER3_LOCKS.FULL_PRODUCTION_PUBLIC_DATA_REGISTRY_SHIPPED === false &&
    ER3_LOCKS.MANAGE_PULL_REQUEST === false &&
    DATA_SOURCE_AGENT_BOUNDS.automaticAuthority === false &&
    DATA_SOURCE_AGENT_BOUNDS.mayIngestUnknownRights === false &&
    DATA_SOURCE_AGENT_BOUNDS.mayIngestOrphanFacts === false &&
    DATA_SOURCE_AGENT_BOUNDS.mayBypassPaywall === false &&
    DATA_SOURCE_AGENT_BOUNDS.mayIngestLeakedOrStolen === false
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

export function er3SoftWireSnapshot(repoRoot?: string): Er3SoftWireSnapshot {
  const root =
    repoRoot ?? join(dirname(fileURLToPath(import.meta.url)), '../../..');

  return {
    ep4IpFirewall: softWireFile(
      './proprietary-ip-firewall-types.ts',
      'EP4 Proprietary-IP Firewall PRESENT (soft-wire).',
      'EP4 Proprietary-IP Firewall absent — soft-wire WAITING_DATA.',
    ),
    ep4Report: softWireRepoRelative(
      root,
      'docs/operations/62L_EP4_PROPRIETARY_IP_FIREWALL_REPORT.md',
      'EP4 report PRESENT.',
      'EP4 report absent — soft-wire WAITING_DATA.',
    ),
    ep5BenchmarkMemory: softWireFile(
      './public-benchmark-memory-types.ts',
      'EP5 Public Benchmark Memory PRESENT (soft-wire).',
      'EP5 Public Benchmark Memory absent — soft-wire WAITING_DATA.',
    ),
    ep5Report: softWireRepoRelative(
      root,
      'docs/operations/62L_EP5_PUBLIC_BENCHMARK_MEMORY_REPORT.md',
      'EP5 report PRESENT.',
      'EP5 report absent — soft-wire WAITING_DATA.',
    ),
    ep10OtherAcceleratorRegistry: softWireFile(
      './other-accelerator-registry-types.ts',
      'EP10 Other Accelerator Registry PRESENT (soft-wire).',
      'EP10 Other Accelerator Registry absent — soft-wire WAITING_DATA.',
    ),
    ep10Report: softWireRepoRelative(
      root,
      'docs/operations/62L_EP10_OTHER_ACCELERATOR_REGISTRY_REPORT.md',
      'EP10 report PRESENT.',
      'EP10 report absent — soft-wire WAITING_DATA.',
    ),
    em157HomeBase: softWireFile(
      './agent-compute-home-base-types.ts',
      'EM (#157) Agent Compute Home Base PRESENT (soft-wire).',
      'EM (#157) Agent Compute Home Base absent — soft-wire WAITING_DATA.',
    ),
  };
}

export function isHumanApprover(actor: Er3Actor): boolean {
  return actor.kind === 'human_approver' || actor.kind === 'founder';
}

export function isDataSourceAgent(actor: Er3Actor): boolean {
  const agents: readonly Er3ActorKind[] = [
    'data_source_registry',
    'research_agent',
    'rights_reviewer',
    'ingestion_agent',
    'proposal',
  ];
  return agents.includes(actor.kind);
}

export type LicenseRightsState =
  | 'PUBLIC_DOMAIN'
  | 'OPEN_LICENSE'
  | 'LICENSED'
  | 'GOVERNMENT_OPEN'
  | 'UNKNOWN_RIGHTS'
  | 'RESTRICTED'
  | 'LEAKED_OR_STOLEN'
  | 'CONFIDENTIAL';

export function isUnknownRights(state: LicenseRightsState): boolean {
  return state === 'UNKNOWN_RIGHTS';
}

export function isForbiddenRights(state: LicenseRightsState): boolean {
  return (
    state === 'LEAKED_OR_STOLEN' ||
    state === 'CONFIDENTIAL' ||
    state === 'RESTRICTED'
  );
}
