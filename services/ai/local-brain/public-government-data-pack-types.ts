/**
 * 62L-ER11 — Public Government Data Pack (park-and-implement).
 *
 * Layer: 62L-ER Real API Data Fabric + Global Historical Knowledge Ingestion +
 * Offline/Online Brain Sync + Historical Avatar Simulations + Universal Device
 * Distribution (GitHub #162).
 *
 * Governed public-government-data layer so agents use official procurement,
 * economic, census, transportation, infrastructure, weather/climate, spending,
 * and agency data for government contracting, logistics, forecasting, and
 * historical analysis.
 *
 * Core flow:
 * Official source → provenance/rights gate → normalize → dedupe → index →
 * Government Knowledge Graph → agent analysis
 *
 * Critical rule: historical spending/awards must NEVER be interpreted as
 * guaranteed future buying behavior.
 *
 * Soft-wire when PRESENT: ER10–ER1, EQ16, EQ15, EQ14, EQ13, EQ12, EP15, EM (#157).
 * Absent → WAITING_DATA (not FAIL). Presence ≠ VERIFIED.
 *
 * SoT: GitHub #162 / 62L-ER family. GitLab mirror: needsAuth; no number invented.
 *
 * Honesty: DOCUMENTED ≠ IMPLEMENTED ≠ VERIFIED ≠ PRODUCTION AUTHORIZED.
 * L4_AUTONOMY_ENABLED=false. DB candidates NOT_APPLIED. tip-land=NO.
 * Next (report only): ER12 — Live Data Connector Gate.
 */

import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

export const HONESTY_BANNER =
  'DOCUMENTED ≠ IMPLEMENTED ≠ VERIFIED ≠ PRODUCTION AUTHORIZED' as const;

export const GITHUB_SOT_ISSUE = 162 as const;
export const GITHUB_SOT_LABEL = '62L-ER11' as const;
export const GITHUB_SOT_FAMILY = '62L-ER' as const;
export const GITHUB_SOT_TITLE =
  '62L-ER11 Public Government Data Pack — official gov data with provenance/rights; truth states; advisory capture/logistics; historical≠future buying' as const;

export const GITLAB_MIRROR_NOTE =
  'GitLab mirror: search attempted; MCP needsAuth / not resolved in this environment — no issue number invented.' as const;

export const ER11_DB_CANDIDATES_STATUS = 'NOT_APPLIED' as const;

export const ER_LAYER_TITLE =
  '62L-ER Real API Data Fabric + Global Historical Knowledge Ingestion + Offline/Online Brain Sync + Historical Avatar Simulations + Universal Device Distribution' as const;

export const NEXT_PHASE_TITLE =
  'ER12 — Live Data Connector Gate — decide whether a feed is truly live and authorized before any agent can use it for real-time decisions.' as const;

/**
 * Priority source categories.
 */
export const GOV_DATA_PRIORITY_CATEGORIES = [
  'procurement_opportunities_and_awards',
  'federal_state_local_spending',
  'census_and_demographics',
  'economic_indicators',
  'trade_import_export',
  'transportation_and_freight',
  'ports_rail_roads_aviation',
  'infrastructure',
  'weather_climate',
  'energy',
  'labor_workforce',
  'agency_missions_programs',
  'grants_research_programs',
  'public_safety_disaster_logistics',
] as const;

export type GovDataPriorityCategory =
  (typeof GOV_DATA_PRIORITY_CATEGORIES)[number];

/**
 * Government source record fields.
 */
export const GOV_SOURCE_RECORD_FIELDS = [
  'governmentSourceId',
  'agencyAuthority',
  'datasetApi',
  'jurisdiction',
  'publicationUpdateDate',
  'geographicScope',
  'timeRange',
  'schema',
  'accessMethod',
  'licensePublicUseTerms',
  'freshness',
  'dataQualityNotes',
  'authoritativeSourceLevel',
  'ingestionState',
  'evidenceRefs',
] as const;

export type GovSourceRecordField = (typeof GOV_SOURCE_RECORD_FIELDS)[number];

/**
 * Core flow hops.
 */
export const GOV_DATA_CORE_FLOW = [
  'official_source',
  'provenance_rights_gate',
  'normalize',
  'dedupe',
  'index',
  'government_knowledge_graph',
  'agent_analysis',
] as const;

export type GovDataCoreFlowHop = (typeof GOV_DATA_CORE_FLOW)[number];

/**
 * Government-contract use chain (advisory only).
 */
export const GOV_CONTRACT_USE_CHAIN = [
  'opportunity_discovery',
  'agency_history',
  'procurement_patterns',
  'public_award_context',
  'logistics_requirements',
  'market_sizing',
  'capture_strategy',
  'pricing_assumptions',
  'proposal_evidence',
] as const;

export type GovContractUseChainHop = (typeof GOV_CONTRACT_USE_CHAIN)[number];

/**
 * Logistics uses (MAY).
 */
export const GOV_LOGISTICS_USES = [
  'freight_flows',
  'infrastructure_constraints',
  'disaster_response_networks',
  'regional_supplier_exposure',
  'public_fleet_operations',
  'warehouse_location_scenarios',
  'economic_demand_patterns',
  'transportation_bottlenecks',
] as const;

export type GovLogisticsUse = (typeof GOV_LOGISTICS_USES)[number];

/**
 * Data truth states — never claim real-time unless source supports it AND
 * connection is verified.
 */
export const GOV_DATA_TRUTH_STATES = [
  'OFFICIAL_CURRENT',
  'OFFICIAL_HISTORICAL',
  'DELAYED',
  'STALE',
  'INCOMPLETE',
  'UNKNOWN',
] as const;

export type GovDataTruthState = (typeof GOV_DATA_TRUTH_STATES)[number];

/**
 * Ingestion states for registered official sources.
 */
export const GOV_INGESTION_STATES = [
  'DISCOVERED',
  'RIGHTS_REVIEW',
  'APPROVED',
  'NORMALIZED',
  'DEDUPED',
  'INDEXED',
  'GRAPHED',
  'QUARANTINED',
  'DENIED',
] as const;

export type GovIngestionState = (typeof GOV_INGESTION_STATES)[number];

/**
 * Authoritative source levels.
 */
export const GOV_AUTHORITATIVE_LEVELS = [
  'PRIMARY_OFFICIAL',
  'OFFICIAL_AGGREGATOR',
  'SECONDARY_PUBLIC',
  'UNKNOWN',
] as const;

export type GovAuthoritativeLevel = (typeof GOV_AUTHORITATIVE_LEVELS)[number];

/**
 * Critical rule: historical awards ≠ guaranteed future buying.
 */
export const GOV_HISTORICAL_BUYING_RULE = Object.freeze({
  historicalSpendingIsGuaranteedFutureBuying: false as const,
  historicalAwardsAreGuaranteedFutureBuying: false as const,
  analysesAreAdvisoryOnly: true as const,
  mayClaimRealTimeWithoutVerifiedLiveConnection: false as const,
});

/**
 * Safety / governance boundary.
 */
export const GOV_DATA_BOUNDARY = Object.freeze({
  mayAssumeClassifiedOrNonPublicGovData: false as const,
  mayBypassRestrictedPortals: false as const,
  mayFabricateAgencyRelationship: false as const,
  mayMakeUnsupportedEligibilityOrAwardClaims: false as const,
  mayCrossTenantPoolPrivateContractData: false as const,
  mayTreatHistoricalAwardsAsGuaranteedFutureBuying: false as const,
  mayClaimRealTimeWithoutVerifiedLiveConnection: false as const,
  mayBypassGuardianRls: false as const,
  mayExpandTenantUniverseAccess: false as const,
  mayPersistHiddenChainOfThought: false as const,
  mayAutoDeployChanges: false as const,
});

export type GovernmentSourceRecord = {
  governmentSourceId: string;
  agencyAuthority: string;
  datasetApi: string;
  jurisdiction: string;
  publicationUpdateDate: string;
  geographicScope: string;
  timeRange: string;
  schema: string;
  accessMethod: string;
  licensePublicUseTerms: string;
  freshness: string;
  dataQualityNotes: string;
  authoritativeSourceLevel: GovAuthoritativeLevel;
  ingestionState: GovIngestionState;
  truthState: GovDataTruthState;
  category: GovDataPriorityCategory;
  evidenceRefs: readonly string[];
  orgId: string;
  tenantId: string;
  universeId: string;
  classifiedOrNonPublicAssumed: false;
  liveRealtimeClaimed: false;
  liveConnectionVerified: boolean;
  secretOrRestrictedPortalBypassed: false;
};

export type GovernmentKnowledgeGraphNode = {
  nodeId: string;
  governmentSourceId: string;
  category: GovDataPriorityCategory;
  normalizedKey: string;
  indexed: true;
  truthState: GovDataTruthState;
  evidenceRefs: readonly string[];
  orgId: string;
  tenantId: string;
  universeId: string;
};

export type AdvisoryCaptureAnalysis = {
  analysisId: string;
  chain: typeof GOV_CONTRACT_USE_CHAIN;
  governmentSourceIds: readonly string[];
  advisoryOnly: true;
  historicalAsGuaranteedFutureBuying: false;
  unsupportedAwardClaim: false;
  fabricatedAgencyRelationship: false;
  summary: string;
  evidenceRefs: readonly string[];
};

export type AdvisoryLogisticsAnalysis = {
  analysisId: string;
  uses: readonly GovLogisticsUse[];
  governmentSourceIds: readonly string[];
  advisoryOnly: true;
  summary: string;
  evidenceRefs: readonly string[];
};

export const PUBLIC_GOVERNMENT_DATA_PACK_CYCLE = [
  'honesty_locks',
  'public_government_data_pack_bootstrap',
  // A — Structure
  'priority_categories_encoded',
  'source_fields_encoded',
  'core_flow_encoded',
  'contract_use_chain_encoded',
  'logistics_uses_encoded',
  'truth_states_encoded',
  'gov_data_boundary_encoded',
  // B — Truth
  'register_official_source_after_rights',
  'normalize_dedupe_index_into_gov_kg',
  'classify_truth_state_no_realtime_without_verified',
  'advisory_capture_and_logistics_analyses',
  // C — Denies
  'deny_classified_non_public_assumptions',
  'deny_restricted_portal_bypass',
  'deny_fabricated_agency_relationship',
  'deny_unsupported_eligibility_award_claims',
  'deny_cross_tenant_private_contract_pooling',
  'deny_historical_as_future_buying_guarantee',
  'deny_realtime_without_verified_live_connection',
  // D — Autonomy
  'guardian_rls_tenant_universe_isolation',
  'recommend_neq_act',
  'l4_autonomy_false',
  // E — Soft-wires
  'er_layer_context_documented',
  'er10_soft_wire',
  'er9_soft_wire',
  'er8_soft_wire',
  'er7_soft_wire',
  'er6_soft_wire',
  'er5_soft_wire',
  'er4_soft_wire',
  'er3_soft_wire',
  'er2_soft_wire',
  'er1_soft_wire',
  'eq16_soft_wire',
  'eq15_soft_wire',
  'eq14_soft_wire',
  'eq13_soft_wire',
  'eq12_soft_wire',
  'ep15_soft_wire',
  'em157_soft_wire',
  'db_candidates_not_applied',
  'evidence',
] as const;

export type Er11Hop = (typeof PUBLIC_GOVERNMENT_DATA_PACK_CYCLE)[number];

export type Er11EvidenceState =
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
  | 'OFFICIAL_CURRENT'
  | 'OFFICIAL_HISTORICAL'
  | 'DELAYED'
  | 'INCOMPLETE';

export type Er11HopRecord = {
  hop: Er11Hop;
  state: Er11EvidenceState;
  summary: string;
  at: string;
};

export type Er11ActorKind =
  | 'gov_data_pack'
  | 'procurement_research_agent'
  | 'logistics_research_agent'
  | 'proposal'
  | 'human_approver'
  | 'founder'
  | 'guardian'
  | 'home_base'
  | 'tenant_admin';

export type Er11Actor = {
  kind: Er11ActorKind;
  id: string;
  orgId: string;
  tenantId: string;
  universeId: string;
  permissions: readonly string[];
};

export const ER11_LOCKS = Object.freeze({
  L4_AUTONOMY_ENABLED: false as const,
  TIP_LAND: false as const,
  PRODUCTION_AUTHORIZATION: false as const,
  PRODUCTION_WRITE: false as const,
  DB_CANDIDATES_APPLIED: false as const,
  FULL_PRODUCTION_PUBLIC_GOVERNMENT_DATA_PACK_SHIPPED: false as const,
  MANAGE_PULL_REQUEST: false as const,

  // Safety / governance
  CLASSIFIED_OR_NON_PUBLIC_GOV_DATA_ASSUMPTIONS: false as const,
  BYPASS_RESTRICTED_PORTALS: false as const,
  FABRICATE_AGENCY_RELATIONSHIP: false as const,
  UNSUPPORTED_ELIGIBILITY_OR_AWARD_CLAIMS: false as const,
  CROSS_TENANT_POOL_PRIVATE_CONTRACT_DATA: false as const,
  HISTORICAL_AWARDS_AS_GUARANTEED_FUTURE_BUYING: false as const,
  CLAIM_REALTIME_WITHOUT_VERIFIED_LIVE_CONNECTION: false as const,

  // Autonomy / isolation
  AGENT_AUTO_AUTHORITY: false as const,
  RECOMMEND_EQ_ACT: false as const,
  RECOMMEND_EQ_AUTHORIZE: false as const,
  HIDDEN_CHAIN_OF_THOUGHT_IN_GOV_DATA_PACK: false as const,
  BYPASS_GUARDIAN_RLS: false as const,
  EXPAND_TENANT_UNIVERSE_ACCESS: false as const,
  BYPASS_GUARDIAN_RLS_TENANT_UNIVERSE: false as const,
  GUARDIAN_RLS_TENANT_UNIVERSE_ISOLATION_UNCHANGED: true as const,
  HUMAN_APPROVAL_BOUNDARIES_UNCHANGED: true as const,
  PERSIST_HIDDEN_CHAIN_OF_THOUGHT: false as const,
  AUTO_DEPLOY_CHANGES: false as const,

  // Honesty ladder
  DOCUMENTED_EQ_IMPLEMENTED: false as const,
  IMPLEMENTED_EQ_VERIFIED: false as const,
  VERIFIED_EQ_PRODUCTION_AUTHORIZED: false as const,
  HUMAN_APPROVAL_REQUIRED_BEFORE_CONSEQUENTIAL_ACTIONS: true as const,
});

export const ER11_AGENT_BOUNDS = Object.freeze({
  mayRegisterOfficialPublicSourcesAfterRightsGate: true as const,
  mayNormalizeDedupeIndexIntoGovKnowledgeGraph: true as const,
  mayClassifyTruthStates: true as const,
  mayBuildAdvisoryCaptureAnalyses: true as const,
  mayBuildAdvisoryLogisticsAnalyses: true as const,
  mayReturnEvidenceToHomeBase: true as const,
  mayRecommendOnly: true as const,
  automaticAuthority: false as const,
  mayAssumeClassifiedOrNonPublicGovData: false as const,
  mayBypassRestrictedPortals: false as const,
  mayFabricateAgencyRelationship: false as const,
  mayMakeUnsupportedEligibilityOrAwardClaims: false as const,
  mayCrossTenantPoolPrivateContractData: false as const,
  mayTreatHistoricalAwardsAsGuaranteedFutureBuying: false as const,
  mayClaimRealTimeWithoutVerifiedLiveConnection: false as const,
  mayIncludeHiddenChainOfThought: false as const,
  mayBypassGuardianRls: false as const,
  mayExpandTenantUniverseAccess: false as const,
  mayAutoDeployChanges: false as const,
});

export const ER11_MAY = Object.freeze([
  'register_official_public_government_sources_after_provenance_rights_gate',
  'normalize_dedupe_index_into_government_knowledge_graph',
  'classify_truth_states_never_realtime_without_verified_live_connection',
  'build_advisory_capture_analyses_along_contract_use_chain',
  'build_advisory_logistics_analyses_for_freight_infra_disaster_demand',
] as const);

export const ER11_MUST_NOT = Object.freeze([
  'assume_classified_or_non_public_government_data',
  'bypass_restricted_portals',
  'fabricate_agency_relationship',
  'make_unsupported_eligibility_or_award_claims',
  'cross_tenant_pool_private_contract_data',
  'treat_historical_awards_as_guaranteed_future_buying',
  'claim_realtime_without_verified_live_connection',
  'bypass_guardian_rls_or_expand_tenant_universe_access',
  'persist_hidden_chain_of_thought',
  'auto_deploy_changes',
  'treat_recommend_as_act',
  'grant_agents_automatic_authority',
] as const);

export type SoftWirePresence = {
  present: boolean;
  pathChecked: string;
  note: string;
};

export type Er11SoftWireSnapshot = {
  er10PublicGeospatialMobilityPack: SoftWirePresence;
  er10Report: SoftWirePresence;
  er9PublicLawPolicyKnowledgePack: SoftWirePresence;
  er9Report: SoftWirePresence;
  er8AncientCivilizationsKnowledgePack: SoftWirePresence;
  er8Report: SoftWirePresence;
  er7HistoricalScienceEngineeringAtlas: SoftWirePresence;
  er7Report: SoftWirePresence;
  er6HistoricalBusinessCaseAtlasV2: SoftWirePresence;
  er6Report: SoftWirePresence;
  er5GlobalHistoricalKnowledgeIngestion: SoftWirePresence;
  er5Report: SoftWirePresence;
  er4RightsProvenanceGate: SoftWirePresence;
  er4Report: SoftWirePresence;
  er3PublicDataSourceRegistry: SoftWirePresence;
  er3Report: SoftWirePresence;
  er2ApiTruthStateMachine: SoftWirePresence;
  er2Report: SoftWirePresence;
  er1RealApiConnectionRegistry: SoftWirePresence;
  er1Report: SoftWirePresence;
  eq16SoftwareWormholeRouter: SoftWirePresence;
  eq16Report: SoftWirePresence;
  eq15PathwayPlasticity: SoftWirePresence;
  eq15Report: SoftWirePresence;
  eq14NeuralPathwayArchitectureGraph: SoftWirePresence;
  eq14Report: SoftWirePresence;
  eq13ArchitectureReturnReceipt: SoftWirePresence;
  eq13Report: SoftWirePresence;
  eq12CrossArchitectureBenchmarkMatrix: SoftWirePresence;
  eq12Report: SoftWirePresence;
  ep15AlgorithmTuningSandbox: SoftWirePresence;
  ep15Report: SoftWirePresence;
  em157HomeBase: SoftWirePresence;
};

export function assertEr11LocksIntact(): boolean {
  return (
    ER11_LOCKS.L4_AUTONOMY_ENABLED === false &&
    ER11_LOCKS.CLASSIFIED_OR_NON_PUBLIC_GOV_DATA_ASSUMPTIONS === false &&
    ER11_LOCKS.BYPASS_RESTRICTED_PORTALS === false &&
    ER11_LOCKS.FABRICATE_AGENCY_RELATIONSHIP === false &&
    ER11_LOCKS.UNSUPPORTED_ELIGIBILITY_OR_AWARD_CLAIMS === false &&
    ER11_LOCKS.CROSS_TENANT_POOL_PRIVATE_CONTRACT_DATA === false &&
    ER11_LOCKS.HISTORICAL_AWARDS_AS_GUARANTEED_FUTURE_BUYING === false &&
    ER11_LOCKS.CLAIM_REALTIME_WITHOUT_VERIFIED_LIVE_CONNECTION === false &&
    ER11_LOCKS.AGENT_AUTO_AUTHORITY === false &&
    ER11_LOCKS.RECOMMEND_EQ_ACT === false &&
    ER11_LOCKS.RECOMMEND_EQ_AUTHORIZE === false &&
    ER11_LOCKS.HIDDEN_CHAIN_OF_THOUGHT_IN_GOV_DATA_PACK === false &&
    ER11_LOCKS.BYPASS_GUARDIAN_RLS === false &&
    ER11_LOCKS.EXPAND_TENANT_UNIVERSE_ACCESS === false &&
    ER11_LOCKS.BYPASS_GUARDIAN_RLS_TENANT_UNIVERSE === false &&
    ER11_LOCKS.GUARDIAN_RLS_TENANT_UNIVERSE_ISOLATION_UNCHANGED === true &&
    ER11_LOCKS.HUMAN_APPROVAL_BOUNDARIES_UNCHANGED === true &&
    ER11_LOCKS.PERSIST_HIDDEN_CHAIN_OF_THOUGHT === false &&
    ER11_LOCKS.AUTO_DEPLOY_CHANGES === false &&
    ER11_LOCKS.DOCUMENTED_EQ_IMPLEMENTED === false &&
    ER11_LOCKS.IMPLEMENTED_EQ_VERIFIED === false &&
    ER11_LOCKS.VERIFIED_EQ_PRODUCTION_AUTHORIZED === false &&
    ER11_LOCKS.HUMAN_APPROVAL_REQUIRED_BEFORE_CONSEQUENTIAL_ACTIONS === true &&
    ER11_LOCKS.TIP_LAND === false &&
    ER11_LOCKS.PRODUCTION_AUTHORIZATION === false &&
    ER11_LOCKS.DB_CANDIDATES_APPLIED === false &&
    ER11_LOCKS.FULL_PRODUCTION_PUBLIC_GOVERNMENT_DATA_PACK_SHIPPED === false &&
    ER11_LOCKS.MANAGE_PULL_REQUEST === false &&
    GOV_HISTORICAL_BUYING_RULE.historicalSpendingIsGuaranteedFutureBuying ===
      false &&
    GOV_HISTORICAL_BUYING_RULE.historicalAwardsAreGuaranteedFutureBuying ===
      false &&
    GOV_HISTORICAL_BUYING_RULE.analysesAreAdvisoryOnly === true &&
    GOV_HISTORICAL_BUYING_RULE.mayClaimRealTimeWithoutVerifiedLiveConnection ===
      false &&
    GOV_DATA_BOUNDARY.mayAssumeClassifiedOrNonPublicGovData === false &&
    GOV_DATA_BOUNDARY.mayBypassRestrictedPortals === false &&
    GOV_DATA_BOUNDARY.mayFabricateAgencyRelationship === false &&
    GOV_DATA_BOUNDARY.mayMakeUnsupportedEligibilityOrAwardClaims === false &&
    GOV_DATA_BOUNDARY.mayCrossTenantPoolPrivateContractData === false &&
    GOV_DATA_BOUNDARY.mayTreatHistoricalAwardsAsGuaranteedFutureBuying ===
      false &&
    GOV_DATA_BOUNDARY.mayClaimRealTimeWithoutVerifiedLiveConnection === false &&
    ER11_AGENT_BOUNDS.automaticAuthority === false &&
    ER11_AGENT_BOUNDS.mayAssumeClassifiedOrNonPublicGovData === false &&
    ER11_AGENT_BOUNDS.mayTreatHistoricalAwardsAsGuaranteedFutureBuying ===
      false &&
    ER11_AGENT_BOUNDS.mayClaimRealTimeWithoutVerifiedLiveConnection === false
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

export function er11SoftWireSnapshot(repoRoot?: string): Er11SoftWireSnapshot {
  const root =
    repoRoot ?? join(dirname(fileURLToPath(import.meta.url)), '../../..');

  return {
    er10PublicGeospatialMobilityPack: softWireFile(
      './public-geospatial-mobility-pack-types.ts',
      'ER10 Public Geospatial & Mobility Pack PRESENT (soft-wire).',
      'ER10 Public Geospatial & Mobility Pack absent — soft-wire WAITING_DATA.',
    ),
    er10Report: softWireRepoRelative(
      root,
      'docs/operations/62L_ER10_PUBLIC_GEOSPATIAL_MOBILITY_PACK_REPORT.md',
      'ER10 report PRESENT.',
      'ER10 report absent — soft-wire WAITING_DATA.',
    ),
    er9PublicLawPolicyKnowledgePack: softWireFile(
      './public-law-policy-knowledge-pack-types.ts',
      'ER9 Public Law & Policy Knowledge Pack PRESENT (soft-wire).',
      'ER9 Public Law & Policy Knowledge Pack absent — soft-wire WAITING_DATA.',
    ),
    er9Report: softWireRepoRelative(
      root,
      'docs/operations/62L_ER9_PUBLIC_LAW_POLICY_KNOWLEDGE_PACK_REPORT.md',
      'ER9 report PRESENT.',
      'ER9 report absent — soft-wire WAITING_DATA.',
    ),
    er8AncientCivilizationsKnowledgePack: softWireFile(
      './ancient-civilizations-knowledge-pack-types.ts',
      'ER8 Ancient Civilizations Knowledge Pack PRESENT (soft-wire).',
      'ER8 Ancient Civilizations Knowledge Pack absent — soft-wire WAITING_DATA.',
    ),
    er8Report: softWireRepoRelative(
      root,
      'docs/operations/62L_ER8_ANCIENT_CIVILIZATIONS_KNOWLEDGE_PACK_REPORT.md',
      'ER8 report PRESENT.',
      'ER8 report absent — soft-wire WAITING_DATA.',
    ),
    er7HistoricalScienceEngineeringAtlas: softWireFile(
      './historical-science-engineering-atlas-types.ts',
      'ER7 Historical Science & Engineering Atlas PRESENT (soft-wire).',
      'ER7 Historical Science & Engineering Atlas absent — soft-wire WAITING_DATA.',
    ),
    er7Report: softWireRepoRelative(
      root,
      'docs/operations/62L_ER7_HISTORICAL_SCIENCE_ENGINEERING_ATLAS_REPORT.md',
      'ER7 report PRESENT.',
      'ER7 report absent — soft-wire WAITING_DATA.',
    ),
    er6HistoricalBusinessCaseAtlasV2: softWireFile(
      './historical-business-case-atlas-v2-types.ts',
      'ER6 Historical Business Case Atlas v2 PRESENT (soft-wire).',
      'ER6 Historical Business Case Atlas v2 absent — soft-wire WAITING_DATA.',
    ),
    er6Report: softWireRepoRelative(
      root,
      'docs/operations/62L_ER6_HISTORICAL_BUSINESS_CASE_ATLAS_V2_REPORT.md',
      'ER6 report PRESENT.',
      'ER6 report absent — soft-wire WAITING_DATA.',
    ),
    er5GlobalHistoricalKnowledgeIngestion: softWireFile(
      './global-historical-knowledge-ingestion-types.ts',
      'ER5 Global Historical Knowledge Ingestion PRESENT (soft-wire).',
      'ER5 Global Historical Knowledge Ingestion absent — soft-wire WAITING_DATA.',
    ),
    er5Report: softWireRepoRelative(
      root,
      'docs/operations/62L_ER5_GLOBAL_HISTORICAL_KNOWLEDGE_INGESTION_REPORT.md',
      'ER5 report PRESENT.',
      'ER5 report absent — soft-wire WAITING_DATA.',
    ),
    er4RightsProvenanceGate: softWireFile(
      './rights-provenance-gate-types.ts',
      'ER4 Rights & Provenance Gate PRESENT (soft-wire).',
      'ER4 Rights & Provenance Gate absent — soft-wire WAITING_DATA.',
    ),
    er4Report: softWireRepoRelative(
      root,
      'docs/operations/62L_ER4_RIGHTS_PROVENANCE_GATE_REPORT.md',
      'ER4 report PRESENT.',
      'ER4 report absent — soft-wire WAITING_DATA.',
    ),
    er3PublicDataSourceRegistry: softWireFile(
      './public-data-source-registry-types.ts',
      'ER3 Public Data Source Registry PRESENT (soft-wire).',
      'ER3 Public Data Source Registry absent — soft-wire WAITING_DATA.',
    ),
    er3Report: softWireRepoRelative(
      root,
      'docs/operations/62L_ER3_PUBLIC_DATA_SOURCE_REGISTRY_REPORT.md',
      'ER3 report PRESENT.',
      'ER3 report absent — soft-wire WAITING_DATA.',
    ),
    er2ApiTruthStateMachine: softWireFile(
      './api-truth-state-machine-types.ts',
      'ER2 API Truth State Machine PRESENT (soft-wire).',
      'ER2 API Truth State Machine absent — soft-wire WAITING_DATA.',
    ),
    er2Report: softWireRepoRelative(
      root,
      'docs/operations/62L_ER2_API_TRUTH_STATE_MACHINE_REPORT.md',
      'ER2 report PRESENT.',
      'ER2 report absent — soft-wire WAITING_DATA.',
    ),
    er1RealApiConnectionRegistry: softWireFile(
      './real-api-connection-registry-types.ts',
      'ER1 Real API Connection Registry PRESENT (soft-wire).',
      'ER1 Real API Connection Registry absent — soft-wire WAITING_DATA.',
    ),
    er1Report: softWireRepoRelative(
      root,
      'docs/operations/62L_ER1_REAL_API_CONNECTION_REGISTRY_REPORT.md',
      'ER1 report PRESENT.',
      'ER1 report absent — soft-wire WAITING_DATA.',
    ),
    eq16SoftwareWormholeRouter: softWireFile(
      './software-wormhole-router-types.ts',
      'EQ16 Software Wormhole Router PRESENT (soft-wire).',
      'EQ16 Software Wormhole Router absent — soft-wire WAITING_DATA.',
    ),
    eq16Report: softWireRepoRelative(
      root,
      'docs/operations/62L_EQ16_SOFTWARE_WORMHOLE_ROUTER_REPORT.md',
      'EQ16 report PRESENT.',
      'EQ16 report absent — soft-wire WAITING_DATA.',
    ),
    eq15PathwayPlasticity: softWireFile(
      './pathway-plasticity-types.ts',
      'EQ15 Pathway Plasticity PRESENT (soft-wire).',
      'EQ15 Pathway Plasticity absent — soft-wire WAITING_DATA.',
    ),
    eq15Report: softWireRepoRelative(
      root,
      'docs/operations/62L_EQ15_PATHWAY_PLASTICITY_REPORT.md',
      'EQ15 report PRESENT.',
      'EQ15 report absent — soft-wire WAITING_DATA.',
    ),
    eq14NeuralPathwayArchitectureGraph: softWireFile(
      './neural-pathway-architecture-graph-types.ts',
      'EQ14 Neural Pathway Architecture Graph PRESENT (soft-wire).',
      'EQ14 Neural Pathway Architecture Graph absent — soft-wire WAITING_DATA.',
    ),
    eq14Report: softWireRepoRelative(
      root,
      'docs/operations/62L_EQ14_NEURAL_PATHWAY_ARCHITECTURE_GRAPH_REPORT.md',
      'EQ14 report PRESENT.',
      'EQ14 report absent — soft-wire WAITING_DATA.',
    ),
    eq13ArchitectureReturnReceipt: softWireFile(
      './architecture-return-receipt-types.ts',
      'EQ13 Architecture Return Receipt PRESENT (soft-wire).',
      'EQ13 Architecture Return Receipt absent — soft-wire WAITING_DATA.',
    ),
    eq13Report: softWireRepoRelative(
      root,
      'docs/operations/62L_EQ13_ARCHITECTURE_RETURN_RECEIPT_REPORT.md',
      'EQ13 report PRESENT.',
      'EQ13 report absent — soft-wire WAITING_DATA.',
    ),
    eq12CrossArchitectureBenchmarkMatrix: softWireFile(
      './cross-architecture-benchmark-matrix-types.ts',
      'EQ12 Cross-Architecture Benchmark Matrix PRESENT (soft-wire).',
      'EQ12 Cross-Architecture Benchmark Matrix absent — soft-wire WAITING_DATA.',
    ),
    eq12Report: softWireRepoRelative(
      root,
      'docs/operations/62L_EQ12_CROSS_ARCHITECTURE_BENCHMARK_MATRIX_REPORT.md',
      'EQ12 report PRESENT.',
      'EQ12 report absent — soft-wire WAITING_DATA.',
    ),
    ep15AlgorithmTuningSandbox: softWireFile(
      './algorithm-tuning-sandbox-types.ts',
      'EP15 Algorithm Tuning Sandbox PRESENT (soft-wire).',
      'EP15 Algorithm Tuning Sandbox absent — soft-wire WAITING_DATA.',
    ),
    ep15Report: softWireRepoRelative(
      root,
      'docs/operations/62L_EP15_ALGORITHM_TUNING_SANDBOX_REPORT.md',
      'EP15 report PRESENT.',
      'EP15 report absent — soft-wire WAITING_DATA.',
    ),
    em157HomeBase: softWireFile(
      './agent-compute-home-base-types.ts',
      'EM (#157) Agent Compute Home Base PRESENT (soft-wire).',
      'EM (#157) Agent Compute Home Base absent — soft-wire WAITING_DATA.',
    ),
  };
}

export function isHumanApprover(actor: Er11Actor): boolean {
  return (
    actor.kind === 'human_approver' ||
    actor.kind === 'founder' ||
    actor.kind === 'tenant_admin'
  );
}

export function isEr11Agent(actor: Er11Actor): boolean {
  const agents: readonly Er11ActorKind[] = [
    'gov_data_pack',
    'procurement_research_agent',
    'logistics_research_agent',
    'proposal',
  ];
  return agents.includes(actor.kind);
}

/** Historical awards are never guaranteed future buying. */
export function historicalAwardsGuaranteeFutureBuying(): boolean {
  return false;
}

/**
 * Real-time may only be claimed when the source itself supports it and a live
 * connection has been verified. Otherwise never label as live/real-time.
 */
export function mayClaimRealtime(input: {
  sourceSupportsRealtime: boolean;
  liveConnectionVerified: boolean;
}): boolean {
  return input.sourceSupportsRealtime && input.liveConnectionVerified;
}

export function softWireHopState(present: boolean): Er11EvidenceState {
  return present ? 'PASS' : 'WAITING_DATA';
}
