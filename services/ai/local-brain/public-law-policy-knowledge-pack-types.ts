/**
 * 62L-ER9 — Public Law & Policy Knowledge Pack (park-and-implement).
 *
 * Layer: 62L-ER Real API Data Fabric + Global Historical Knowledge Ingestion +
 * Offline/Online Brain Sync + Historical Avatar Simulations + Universal Device
 * Distribution (GitHub #162).
 *
 * Versioned public law and policy knowledge layer so agents reason over current
 * regulations, procurement rules, standards, and official guidance without
 * treating stale legal information as current.
 *
 * Core flow:
 * Official source → parse → effective-date check → jurisdiction mapping →
 * applicability → citation → review → knowledge graph
 *
 * Freshness rule (critical): if agent cannot confirm current effective version:
 * LEGAL_STATE = UNKNOWN / STALE — not “current.”
 *
 * Soft-wire when PRESENT: ER8–ER1, EQ16, EQ15, EQ14 (WAITING_DATA ok), EQ13,
 * EQ12, EP15, EM (#157). Presence ≠ VERIFIED. Absent → WAITING_DATA (not FAIL).
 *
 * SoT: GitHub #162 / 62L-ER family. GitLab mirror: needsAuth; no number invented.
 *
 * Honesty: DOCUMENTED ≠ IMPLEMENTED ≠ VERIFIED ≠ PRODUCTION AUTHORIZED.
 * L4_AUTONOMY_ENABLED=false. DB candidates NOT_APPLIED. tip-land=NO.
 * Next (report only): ER10 — Public Geospatial / Mobility Pack.
 */

import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

export const HONESTY_BANNER =
  'DOCUMENTED ≠ IMPLEMENTED ≠ VERIFIED ≠ PRODUCTION AUTHORIZED' as const;

export const GITHUB_SOT_ISSUE = 162 as const;
export const GITHUB_SOT_LABEL = '62L-ER9' as const;
export const GITHUB_SOT_FAMILY = '62L-ER' as const;
export const GITHUB_SOT_TITLE =
  '62L-ER9 Public Law & Policy Knowledge Pack — versioned official law/policy nodes; freshness UNKNOWN/STALE≠current; advisory compliance matrices; counsel review; no binding legal conclusions/certify/filings/licensed representation' as const;

export const GITLAB_MIRROR_NOTE =
  'GitLab mirror: search attempted; MCP needsAuth / not resolved in this environment — no issue number invented.' as const;

export const ER9_DB_CANDIDATES_STATUS = 'NOT_APPLIED' as const;

export const ER_LAYER_TITLE =
  '62L-ER Real API Data Fabric + Global Historical Knowledge Ingestion + Offline/Online Brain Sync + Historical Avatar Simulations + Universal Device Distribution' as const;

export const NEXT_PHASE_TITLE =
  'ER10 — Public Geospatial / Mobility Pack — lawful open/licensed maps, roads, transit, infrastructure, traffic, and logistics data while keeping precise private location data opt-in and protected.' as const;

/**
 * Required legal/policy freshness / publication states.
 */
export const LEGAL_POLICY_STATES = [
  'CURRENT_OFFICIAL',
  'SUPERSEDED',
  'PROPOSED',
  'GUIDANCE',
  'INTERPRETATION',
  'UNKNOWN',
] as const;

export type LegalPolicyState = (typeof LEGAL_POLICY_STATES)[number];

/**
 * Freshness outcome when effective version cannot be confirmed.
 * UNKNOWN / STALE — never treated as “current.”
 */
export const LEGAL_FRESHNESS_OUTCOMES = [
  'CURRENT',
  'STALE',
  'UNKNOWN',
  'SUPERSEDED',
] as const;

export type LegalFreshnessOutcome = (typeof LEGAL_FRESHNESS_OUTCOMES)[number];

/**
 * Legal/policy node fields.
 */
export const LEGAL_POLICY_NODE_FIELDS = [
  'policyId',
  'jurisdiction',
  'agencyAuthority',
  'lawRegulationStandardName',
  'citationIdentifier',
  'effectiveDate',
  'revisionVersion',
  'sourceUrlReference',
  'applicability',
  'affectedIndustries',
  'obligations',
  'exceptionsExemptions',
  'enforcementAuthority',
  'supersededBy',
  'confidence',
  'freshnessState',
  'reviewer',
] as const;

export type LegalPolicyNodeField =
  (typeof LEGAL_POLICY_NODE_FIELDS)[number];

/**
 * Priority domains (encode).
 */
export const LEGAL_POLICY_PRIORITY_DOMAINS = [
  'federal_state_local_procurement',
  'far_and_agency_supplements',
  'privacy_data_protection',
  'cybersecurity_requirements',
  'ai_governance',
  'financial_services_regulation',
  'insurance_regulation',
  'telecom_satellite_rules',
  'transportation_vehicle_rules',
  'export_controls',
  'semiconductor_technology_policy',
  'labor_employment_rules',
  'accessibility_standards',
  'records_retention',
  'government_contracting_compliance',
] as const;

export type LegalPolicyPriorityDomain =
  (typeof LEGAL_POLICY_PRIORITY_DOMAINS)[number];

/**
 * Core flow: official source → knowledge graph.
 */
export const LEGAL_POLICY_CORE_FLOW = [
  'official_source',
  'parse',
  'effective_date_check',
  'jurisdiction_mapping',
  'applicability',
  'citation',
  'review',
  'knowledge_graph',
] as const;

export type LegalPolicyCoreFlowStep =
  (typeof LEGAL_POLICY_CORE_FLOW)[number];

/**
 * Government-contract integration flow.
 */
export const GOV_CONTRACT_INTEGRATION_FLOW = [
  'solicitation',
  'far_agency_rules',
  'compliance_matrix',
  'evidence_vault',
  'proposal',
  'human_review',
] as const;

export type GovContractIntegrationStep =
  (typeof GOV_CONTRACT_INTEGRATION_FLOW)[number];

/**
 * Freshness rule: unclear effective version → UNKNOWN/STALE, not current.
 */
export const LEGAL_FRESHNESS_RULE = Object.freeze({
  unclearEffectiveVersionImpliesNotCurrent: true as const,
  unclearMapsTo: ['UNKNOWN', 'STALE'] as const,
  mayLabelUnclearAsCurrent: false as const,
  mayTreatStaleAsCurrentOfficial: false as const,
  legalStateWhenUnconfirmed: 'UNKNOWN' as const,
});

export const LEGAL_POLICY_BOUNDARY = Object.freeze({
  mayAutonomouslyMakeBindingLegalConclusions: false as const,
  mayCertifyCompliance: false as const,
  maySubmitFilings: false as const,
  mayRepresentXivAsLicensedCertifiedWhenNot: false as const,
  mayUnauthorizedLegalDatabaseScraping: false as const,
  mayIngestConfidentialClientMattersAcrossTenants: false as const,
  mayLegalFilingOrCertificationWithoutExplicitAuthorization: false as const,
  mayTreatUnclearFreshnessAsCurrent: false as const,
  mayBypassGuardianRls: false as const,
  mayExpandTenantUniverseAccess: false as const,
  mayPersistHiddenChainOfThought: false as const,
  mayAutoDeployChanges: false as const,
  complianceMatrixIsAdvisoryOnly: true as const,
  counselReviewFlagRequiredForBindingUse: true as const,
});

export const PUBLIC_LAW_POLICY_KNOWLEDGE_PACK_CYCLE = [
  'honesty_locks',
  'public_law_policy_knowledge_pack_bootstrap',
  // A — Structure
  'legal_policy_states_encoded',
  'legal_policy_node_fields_encoded',
  'priority_domains_encoded',
  'core_flow_encoded',
  'gov_contract_integration_encoded',
  'freshness_rule_encoded',
  'legal_policy_boundary_encoded',
  // B — Truth / flow
  'register_policy_node',
  'effective_date_freshness_check',
  'unclear_freshness_unknown_stale_not_current',
  'version_compare',
  'compliance_matrix_advisory',
  'counsel_review_flag',
  'gov_contract_flow',
  // C — Denies
  'deny_binding_legal_conclusions',
  'deny_certify_compliance',
  'deny_submit_filings',
  'deny_licensed_representation_when_not',
  'deny_unauthorized_legal_database_scraping',
  'deny_cross_tenant_confidential_client_matters',
  'deny_filing_certification_without_authorization',
  'deny_treat_unclear_as_current',
  'deny_bypass_guardian_rls',
  'deny_expand_tenant_universe_access',
  'deny_persist_hidden_chain_of_thought',
  'deny_auto_deploy_changes',
  // D — Autonomy
  'guardian_rls_tenant_universe_isolation',
  'recommend_neq_act',
  'l4_autonomy_false',
  // E — Soft-wires
  'er_layer_context_documented',
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

export type Er9Hop = (typeof PUBLIC_LAW_POLICY_KNOWLEDGE_PACK_CYCLE)[number];

export type Er9EvidenceState =
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
  | 'CURRENT_OFFICIAL'
  | 'SUPERSEDED'
  | 'PROPOSED'
  | 'GUIDANCE'
  | 'INTERPRETATION';

export type Er9HopRecord = {
  hop: Er9Hop;
  state: Er9EvidenceState;
  summary: string;
  at: string;
};

export type Er9ActorKind =
  | 'public_law_policy_knowledge_pack'
  | 'policy_research_agent'
  | 'compliance_matrix_builder'
  | 'proposal'
  | 'human_approver'
  | 'counsel_reviewer'
  | 'founder'
  | 'guardian'
  | 'home_base'
  | 'tenant_admin';

export type Er9Actor = {
  kind: Er9ActorKind;
  id: string;
  orgId: string;
  tenantId: string;
  universeId: string;
  permissions: readonly string[];
};

export const ER9_LOCKS = Object.freeze({
  L4_AUTONOMY_ENABLED: false as const,
  TIP_LAND: false as const,
  PRODUCTION_AUTHORIZATION: false as const,
  PRODUCTION_WRITE: false as const,
  DB_CANDIDATES_APPLIED: false as const,
  FULL_PRODUCTION_PUBLIC_LAW_POLICY_KNOWLEDGE_PACK_SHIPPED: false as const,
  MANAGE_PULL_REQUEST: false as const,

  BINDING_LEGAL_CONCLUSIONS: false as const,
  CERTIFY_COMPLIANCE: false as const,
  SUBMIT_FILINGS: false as const,
  REPRESENT_XIV_AS_LICENSED_CERTIFIED_WHEN_NOT: false as const,
  UNAUTHORIZED_LEGAL_DATABASE_SCRAPING: false as const,
  CONFIDENTIAL_CLIENT_MATTER_INGESTION_ACROSS_TENANTS: false as const,
  LEGAL_FILING_OR_CERTIFICATION_WITHOUT_EXPLICIT_AUTHORIZATION: false as const,
  TREAT_UNCLEAR_FRESHNESS_AS_CURRENT: false as const,
  TREAT_STALE_AS_CURRENT_OFFICIAL: false as const,

  BYPASS_GUARDIAN_RLS: false as const,
  EXPAND_TENANT_UNIVERSE_ACCESS: false as const,
  PERSIST_HIDDEN_CHAIN_OF_THOUGHT: false as const,
  AUTO_DEPLOY_CHANGES: false as const,
  AGENT_AUTO_AUTHORITY: false as const,
  RECOMMEND_EQ_ACT: false as const,
  RECOMMEND_EQ_AUTHORIZE: false as const,
  BYPASS_GUARDIAN_RLS_TENANT_UNIVERSE: false as const,
  GUARDIAN_RLS_TENANT_UNIVERSE_ISOLATION_UNCHANGED: true as const,
  HUMAN_APPROVAL_BOUNDARIES_UNCHANGED: true as const,

  DOCUMENTED_EQ_IMPLEMENTED: false as const,
  IMPLEMENTED_EQ_VERIFIED: false as const,
  VERIFIED_EQ_PRODUCTION_AUTHORIZED: false as const,
  HUMAN_APPROVAL_REQUIRED_BEFORE_CONSEQUENTIAL_ACTIONS: true as const,
  COMPLIANCE_MATRIX_ADVISORY_ONLY: true as const,
  COUNSEL_REVIEW_FLAG_FOR_BINDING_USE: true as const,
});

export const ER9_AGENT_BOUNDS = Object.freeze({
  mayRetrieveCurrentOfficialText: true as const,
  maySummarizeRequirements: true as const,
  mayCompareVersions: true as const,
  mayBuildAdvisoryComplianceMatrices: true as const,
  mayFlagObligationsAndUncertainties: true as const,
  mayIdentifyWhereCounselShouldReview: true as const,
  mayAutonomouslyMakeBindingLegalConclusions: false as const,
  mayCertifyCompliance: false as const,
  maySubmitFilings: false as const,
  mayRepresentXivAsLicensedCertifiedWhenNot: false as const,
  mayUnauthorizedLegalDatabaseScraping: false as const,
  mayIngestConfidentialClientMattersAcrossTenants: false as const,
  mayTreatUnclearFreshnessAsCurrent: false as const,
  mayBypassGuardianRls: false as const,
  mayExpandTenantUniverseAccess: false as const,
  mayPersistHiddenChainOfThought: false as const,
  mayAutoDeployChanges: false as const,
  automaticAuthority: false as const,
  mayRecommendOnly: true as const,
});

export const ER9_MAY = Object.freeze([
  'retrieve_current_official_text',
  'summarize_requirements',
  'compare_versions',
  'build_advisory_compliance_matrices',
  'flag_obligations_and_uncertainties',
  'identify_where_counsel_or_qualified_professional_should_review',
] as const);

export const ER9_MUST_NOT = Object.freeze([
  'autonomously_make_binding_legal_conclusions',
  'certify_compliance',
  'submit_filings',
  'represent_xiv_as_licensed_or_certified_when_it_is_not',
  'unauthorized_legal_database_scraping',
  'ingest_confidential_client_matters_across_tenants',
  'legal_filing_or_certification_without_explicit_authorization',
  'treat_unclear_or_stale_legal_information_as_current',
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

export type Er9SoftWireSnapshot = {
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

export function assertEr9LocksIntact(): boolean {
  return (
    ER9_LOCKS.L4_AUTONOMY_ENABLED === false &&
    ER9_LOCKS.BINDING_LEGAL_CONCLUSIONS === false &&
    ER9_LOCKS.CERTIFY_COMPLIANCE === false &&
    ER9_LOCKS.SUBMIT_FILINGS === false &&
    ER9_LOCKS.REPRESENT_XIV_AS_LICENSED_CERTIFIED_WHEN_NOT === false &&
    ER9_LOCKS.UNAUTHORIZED_LEGAL_DATABASE_SCRAPING === false &&
    ER9_LOCKS.CONFIDENTIAL_CLIENT_MATTER_INGESTION_ACROSS_TENANTS === false &&
    ER9_LOCKS.LEGAL_FILING_OR_CERTIFICATION_WITHOUT_EXPLICIT_AUTHORIZATION ===
      false &&
    ER9_LOCKS.TREAT_UNCLEAR_FRESHNESS_AS_CURRENT === false &&
    ER9_LOCKS.TREAT_STALE_AS_CURRENT_OFFICIAL === false &&
    ER9_LOCKS.BYPASS_GUARDIAN_RLS === false &&
    ER9_LOCKS.EXPAND_TENANT_UNIVERSE_ACCESS === false &&
    ER9_LOCKS.PERSIST_HIDDEN_CHAIN_OF_THOUGHT === false &&
    ER9_LOCKS.AUTO_DEPLOY_CHANGES === false &&
    ER9_LOCKS.AGENT_AUTO_AUTHORITY === false &&
    ER9_LOCKS.RECOMMEND_EQ_ACT === false &&
    ER9_LOCKS.RECOMMEND_EQ_AUTHORIZE === false &&
    ER9_LOCKS.BYPASS_GUARDIAN_RLS_TENANT_UNIVERSE === false &&
    ER9_LOCKS.GUARDIAN_RLS_TENANT_UNIVERSE_ISOLATION_UNCHANGED === true &&
    ER9_LOCKS.HUMAN_APPROVAL_BOUNDARIES_UNCHANGED === true &&
    ER9_LOCKS.DOCUMENTED_EQ_IMPLEMENTED === false &&
    ER9_LOCKS.IMPLEMENTED_EQ_VERIFIED === false &&
    ER9_LOCKS.VERIFIED_EQ_PRODUCTION_AUTHORIZED === false &&
    ER9_LOCKS.HUMAN_APPROVAL_REQUIRED_BEFORE_CONSEQUENTIAL_ACTIONS === true &&
    ER9_LOCKS.COMPLIANCE_MATRIX_ADVISORY_ONLY === true &&
    ER9_LOCKS.COUNSEL_REVIEW_FLAG_FOR_BINDING_USE === true &&
    ER9_LOCKS.TIP_LAND === false &&
    ER9_LOCKS.PRODUCTION_AUTHORIZATION === false &&
    ER9_LOCKS.DB_CANDIDATES_APPLIED === false &&
    ER9_LOCKS.FULL_PRODUCTION_PUBLIC_LAW_POLICY_KNOWLEDGE_PACK_SHIPPED ===
      false &&
    ER9_LOCKS.MANAGE_PULL_REQUEST === false &&
    LEGAL_POLICY_BOUNDARY.mayAutonomouslyMakeBindingLegalConclusions ===
      false &&
    LEGAL_POLICY_BOUNDARY.mayCertifyCompliance === false &&
    LEGAL_POLICY_BOUNDARY.maySubmitFilings === false &&
    LEGAL_POLICY_BOUNDARY.mayTreatUnclearFreshnessAsCurrent === false &&
    LEGAL_FRESHNESS_RULE.mayLabelUnclearAsCurrent === false &&
    ER9_AGENT_BOUNDS.mayAutonomouslyMakeBindingLegalConclusions === false &&
    ER9_AGENT_BOUNDS.mayCertifyCompliance === false &&
    ER9_AGENT_BOUNDS.automaticAuthority === false
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

export function er9SoftWireSnapshot(repoRoot?: string): Er9SoftWireSnapshot {
  const root =
    repoRoot ?? join(dirname(fileURLToPath(import.meta.url)), '../../..');

  return {
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

export function isHumanApprover(actor: Er9Actor): boolean {
  return (
    actor.kind === 'human_approver' ||
    actor.kind === 'counsel_reviewer' ||
    actor.kind === 'founder' ||
    actor.kind === 'tenant_admin'
  );
}

export function isEr9Agent(actor: Er9Actor): boolean {
  const agents: readonly Er9ActorKind[] = [
    'public_law_policy_knowledge_pack',
    'policy_research_agent',
    'compliance_matrix_builder',
    'proposal',
  ];
  return agents.includes(actor.kind);
}

/**
 * Freshness mapping: when current effective version cannot be confirmed,
 * LEGAL_STATE is UNKNOWN or STALE — never CURRENT_OFFICIAL / “current.”
 */
export function freshnessWhenEffectiveVersionUnconfirmed(input: {
  evidenceOfSupersession?: boolean;
  knownStale?: boolean;
}): Exclude<LegalFreshnessOutcome, 'CURRENT'> {
  if (input.evidenceOfSupersession) return 'SUPERSEDED';
  if (input.knownStale) return 'STALE';
  return 'UNKNOWN';
}

export function legalStateFromFreshness(
  freshness: LegalFreshnessOutcome,
): LegalPolicyState {
  switch (freshness) {
    case 'CURRENT':
      return 'CURRENT_OFFICIAL';
    case 'SUPERSEDED':
      return 'SUPERSEDED';
    case 'STALE':
    case 'UNKNOWN':
      return 'UNKNOWN';
    default:
      return 'UNKNOWN';
  }
}

export function mayTreatAsCurrentOfficial(
  state: LegalPolicyState,
  freshnessConfirmed: boolean,
): boolean {
  return (
    state === 'CURRENT_OFFICIAL' &&
    freshnessConfirmed === true &&
    LEGAL_FRESHNESS_RULE.mayLabelUnclearAsCurrent === false
  );
}
