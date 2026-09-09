/**
 * 62L-ER8 — Ancient Civilizations Knowledge Pack (park-and-implement).
 *
 * Layer: 62L-ER Real API Data Fabric + Global Historical Knowledge Ingestion +
 * Offline/Online Brain Sync + Historical Avatar Simulations + Universal Device
 * Distribution (GitHub #162).
 *
 * Provenance-aware ancient-civilizations knowledge layer so agents study
 * governance, trade, engineering, mathematics, navigation, medicine,
 * agriculture, philosophy, logistics, and social organization without
 * flattening cultures or confusing historical belief with modern evidence.
 *
 * Neural pathway (analogy/inspiration, NOT proof):
 * Historical system → principle → modern analogue → hypothesis → simulation →
 * measured result
 *
 * Soft-wire when PRESENT: ER7–ER1, EQ16, EQ15, EQ14, EQ13, EQ12, EP15, EM (#157).
 * Absent → WAITING_DATA (not FAIL). Presence ≠ VERIFIED.
 *
 * SoT: GitHub #162 / 62L-ER family. GitLab mirror: needsAuth; no number invented.
 *
 * Honesty: DOCUMENTED ≠ IMPLEMENTED ≠ VERIFIED ≠ PRODUCTION AUTHORIZED.
 * L4_AUTONOMY_ENABLED=false. DB candidates NOT_APPLIED. tip-land=NO.
 * Next (report only): ER9 — Public Law & Policy Knowledge Pack.
 */

import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

export const HONESTY_BANNER =
  'DOCUMENTED ≠ IMPLEMENTED ≠ VERIFIED ≠ PRODUCTION AUTHORIZED' as const;

export const GITHUB_SOT_ISSUE = 162 as const;
export const GITHUB_SOT_LABEL = '62L-ER8' as const;
export const GITHUB_SOT_FAMILY = '62L-ER' as const;
export const GITHUB_SOT_TITLE =
  '62L-ER8 Ancient Civilizations Knowledge Pack — provenance-aware civilization nodes; evidence classes; analogy≠proof; cultural safeguards; rights boundary' as const;

export const GITLAB_MIRROR_NOTE =
  'GitLab mirror: search attempted; MCP needsAuth / not resolved in this environment — no issue number invented.' as const;

export const ER8_DB_CANDIDATES_STATUS = 'NOT_APPLIED' as const;

export const ER_LAYER_TITLE =
  '62L-ER Real API Data Fabric + Global Historical Knowledge Ingestion + Offline/Online Brain Sync + Historical Avatar Simulations + Universal Device Distribution' as const;

export const NEXT_PHASE_TITLE =
  'ER9 — Public Law & Policy Knowledge Pack — current official laws, regulations, procurement rules, standards, and policy guidance with effective dates, jurisdiction, and version control.' as const;

/**
 * Initial civilization / knowledge-tradition coverage.
 */
export const ANCIENT_CIVILIZATION_COVERAGE = [
  'ancient_egypt',
  'nubia_kush_and_broader_african_civilizations',
  'mesopotamia',
  'india',
  'china',
  'mesoamerica_and_andean_civilizations',
  'greece_and_rome',
  'indigenous_knowledge_traditions',
  'islamic_golden_age_and_connected_knowledge_networks',
  'diaspora_trade_route_knowledge_systems',
] as const;

export type AncientCivilizationCoverage =
  (typeof ANCIENT_CIVILIZATION_COVERAGE)[number];

/**
 * Knowledge node fields (required context preserved).
 */
export const ANCIENT_CIV_NODE_FIELDS = [
  'civilizationId',
  'regionGeography',
  'era',
  'languageScript',
  'sourceType',
  'authorAttribution',
  'translationSource',
  'domain',
  'claimOrPractice',
  'historicalContext',
  'evidenceClass',
  'confidence',
  'scholarlyDisagreement',
  'culturalSensitivityNotes',
  'sourceRefs',
  'rightsState',
] as const;

export type AncientCivNodeField = (typeof ANCIENT_CIV_NODE_FIELDS)[number];

/**
 * Required evidence classes.
 */
export const ANCIENT_CIV_EVIDENCE_CLASSES = [
  'PRIMARY_HISTORICAL_SOURCE',
  'ARCHAEOLOGICAL_EVIDENCE',
  'SCHOLARLY_INTERPRETATION',
  'CULTURAL_TRADITION',
  'DISPUTED',
  'SPECULATIVE',
] as const;

export type AncientCivEvidenceClass =
  (typeof ANCIENT_CIV_EVIDENCE_CLASSES)[number];

/**
 * Knowledge domains.
 */
export const ANCIENT_CIV_KNOWLEDGE_DOMAINS = [
  'trade_and_supply_routes',
  'state_administration',
  'taxation_accounting',
  'construction_and_infrastructure',
  'agriculture_irrigation',
  'navigation',
  'astronomy',
  'mathematics',
  'metallurgy',
  'medicine_history',
  'philosophy_ethics',
  'military_logistics',
  'legal_traditions',
  'market_systems',
  'communication_networks',
] as const;

export type AncientCivKnowledgeDomain =
  (typeof ANCIENT_CIV_KNOWLEDGE_DOMAINS)[number];

/**
 * Neural pathway — labeled analogy/inspiration, not proof.
 */
export const ANCIENT_CIV_NEURAL_PATHWAY = [
  'historical_system',
  'principle',
  'modern_analogue',
  'hypothesis',
  'simulation',
  'measured_result',
] as const;

export const ANCIENT_CIV_PATHWAY_LABEL =
  'analogy_inspiration_not_proof' as const;

/**
 * Rights states — public-domain / open / licensed / authorized only.
 */
export const ANCIENT_CIV_RIGHTS_STATES = [
  'PUBLIC_DOMAIN',
  'OPEN',
  'LICENSED',
  'AUTHORIZED_HISTORICAL',
  'RESTRICTED_DENIED',
] as const;

export type AncientCivRightsState = (typeof ANCIENT_CIV_RIGHTS_STATES)[number];

/**
 * Cultural safeguard locks (tested).
 */
export const ANCIENT_CIV_CULTURAL_SAFEGUARDS = Object.freeze({
  noMonolithicAfricanKnowledge: true as const,
  noMonolithicChineseKnowledge: true as const,
  noMonolithicIndigenousKnowledge: true as const,
  preserveRegionPeriodSourceTranslationContext: true as const,
  distinguishDocumentedPracticeFromLegendOrLaterInterpretation: true as const,
  noSpiritualBeliefAsHiddenSystemPolicy: true as const,
  noUnsupportedLostAdvancedTechnologyClaims: true as const,
});

export const ANCIENT_CIVILIZATIONS_KNOWLEDGE_PACK_CYCLE = [
  'honesty_locks',
  'ancient_civilizations_knowledge_pack_bootstrap',
  // A — Structure
  'coverage_encoded',
  'knowledge_node_fields_encoded',
  'evidence_classes_encoded',
  'knowledge_domains_encoded',
  'neural_pathway_encoded',
  'rights_states_encoded',
  'cultural_safeguards_encoded',
  // B — Truth
  'register_node_requires_region_era_translation',
  'attach_evidence_class',
  'analogy_pathway_inspiration_not_proof',
  // C — Cultural / rights denies
  'deny_monolithic_african_chinese_indigenous_flattening',
  'deny_belief_to_hidden_system_policy',
  'deny_lost_advanced_technology_claims',
  'deny_pirated_ingest',
  'deny_flatten_cultures',
  // D — Autonomy
  'guardian_rls_tenant_universe_isolation',
  'recommend_neq_act',
  'l4_autonomy_false',
  // E — Soft-wires
  'er_layer_context_documented',
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

export type Er8Hop = (typeof ANCIENT_CIVILIZATIONS_KNOWLEDGE_PACK_CYCLE)[number];

export type Er8EvidenceState =
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
  | 'UNKNOWN';

export type Er8HopRecord = {
  hop: Er8Hop;
  state: Er8EvidenceState;
  summary: string;
  at: string;
};

export type Er8ActorKind =
  | 'ancient_civ_research_agent'
  | 'knowledge_pack'
  | 'historical_avatar'
  | 'proposal'
  | 'human_approver'
  | 'founder'
  | 'guardian'
  | 'home_base'
  | 'tenant_admin';

export type Er8Actor = {
  kind: Er8ActorKind;
  id: string;
  orgId: string;
  tenantId: string;
  universeId: string;
  permissions: readonly string[];
};

export const ER8_LOCKS = Object.freeze({
  L4_AUTONOMY_ENABLED: false as const,
  TIP_LAND: false as const,
  PRODUCTION_AUTHORIZATION: false as const,
  PRODUCTION_WRITE: false as const,
  DB_CANDIDATES_APPLIED: false as const,
  FULL_PRODUCTION_ANCIENT_CIV_PACK_SHIPPED: false as const,
  MANAGE_PULL_REQUEST: false as const,

  // Cultural safeguards
  MONOLITHIC_AFRICAN_KNOWLEDGE: false as const,
  MONOLITHIC_CHINESE_KNOWLEDGE: false as const,
  MONOLITHIC_INDIGENOUS_KNOWLEDGE: false as const,
  DROP_REGION_PERIOD_SOURCE_TRANSLATION_CONTEXT: false as const,
  CONFLATE_DOCUMENTED_PRACTICE_WITH_LEGEND: false as const,
  SPIRITUAL_BELIEF_AS_HIDDEN_SYSTEM_POLICY: false as const,
  UNSUPPORTED_LOST_ADVANCED_TECHNOLOGY_CLAIMS: false as const,
  ANALOGY_EQ_PROOF: false as const,

  // Rights
  PIRATED_BOOKS_DOCUMENTARIES_ARCHIVES: false as const,
  PRIVATE_COLLECTION_INGEST_WITHOUT_AUTHORIZATION: false as const,
  RESTRICTED_RIGHTS_INGEST: false as const,

  // Autonomy / isolation
  AGENT_AUTO_AUTHORITY: false as const,
  RECOMMEND_EQ_ACT: false as const,
  RECOMMEND_EQ_AUTHORIZE: false as const,
  HIDDEN_CHAIN_OF_THOUGHT_IN_KNOWLEDGE_PACK: false as const,
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

export const ER8_AGENT_BOUNDS = Object.freeze({
  mayRegisterCivilizationNodesWithContext: true as const,
  mayAttachEvidenceClasses: true as const,
  mayBuildAnalogyPathwaysLabeledInspirationNotProof: true as const,
  mayReturnEvidenceToHomeBase: true as const,
  mayRecommendOnly: true as const,
  automaticAuthority: false as const,
  mayFlattenAfricanChineseIndigenousAsMonolith: false as const,
  mayDropRegionPeriodSourceTranslationContext: false as const,
  mayConflateDocumentedPracticeWithLegend: false as const,
  mayConvertBeliefToHiddenSystemPolicy: false as const,
  mayClaimUnsupportedLostAdvancedTechnology: false as const,
  mayTreatAnalogyAsProof: false as const,
  mayIngestPiratedMaterial: false as const,
  mayIngestPrivateCollectionsWithoutAuthorization: false as const,
  mayIncludeHiddenChainOfThought: false as const,
  mayBypassGuardianRls: false as const,
  mayExpandTenantUniverseAccess: false as const,
  mayAutoDeployChanges: false as const,
});

export const ER8_MAY = Object.freeze([
  'register_provenance_aware_civilization_nodes_with_region_era_translation',
  'attach_required_evidence_classes_and_domains',
  'build_neural_pathways_labeled_analogy_inspiration_not_proof',
  'preserve_scholarly_disagreement_and_cultural_sensitivity_notes',
  'ingest_only_public_domain_open_licensed_or_authorized_historical_material',
] as const);

export const ER8_MUST_NOT = Object.freeze([
  'treat_african_chinese_or_indigenous_knowledge_as_one_monolithic_system',
  'drop_region_period_source_or_translation_context',
  'conflate_documented_practice_with_legend_or_later_interpretation',
  'convert_spiritual_or_cultural_beliefs_into_hidden_system_policy',
  'make_unsupported_claims_of_lost_advanced_technology',
  'treat_analogy_or_inspiration_as_proof',
  'ingest_pirated_books_documentaries_archives_or_private_collections',
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

export type Er8SoftWireSnapshot = {
  er7HistoricalScienceEngineeringAtlas: SoftWirePresence;
  er7Report: SoftWirePresence;
  er6HistoricalBusinessCaseAtlas: SoftWirePresence;
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

export function assertEr8LocksIntact(): boolean {
  return (
    ER8_LOCKS.L4_AUTONOMY_ENABLED === false &&
    ER8_LOCKS.MONOLITHIC_AFRICAN_KNOWLEDGE === false &&
    ER8_LOCKS.MONOLITHIC_CHINESE_KNOWLEDGE === false &&
    ER8_LOCKS.MONOLITHIC_INDIGENOUS_KNOWLEDGE === false &&
    ER8_LOCKS.DROP_REGION_PERIOD_SOURCE_TRANSLATION_CONTEXT === false &&
    ER8_LOCKS.CONFLATE_DOCUMENTED_PRACTICE_WITH_LEGEND === false &&
    ER8_LOCKS.SPIRITUAL_BELIEF_AS_HIDDEN_SYSTEM_POLICY === false &&
    ER8_LOCKS.UNSUPPORTED_LOST_ADVANCED_TECHNOLOGY_CLAIMS === false &&
    ER8_LOCKS.ANALOGY_EQ_PROOF === false &&
    ER8_LOCKS.PIRATED_BOOKS_DOCUMENTARIES_ARCHIVES === false &&
    ER8_LOCKS.PRIVATE_COLLECTION_INGEST_WITHOUT_AUTHORIZATION === false &&
    ER8_LOCKS.RESTRICTED_RIGHTS_INGEST === false &&
    ER8_LOCKS.AGENT_AUTO_AUTHORITY === false &&
    ER8_LOCKS.RECOMMEND_EQ_ACT === false &&
    ER8_LOCKS.RECOMMEND_EQ_AUTHORIZE === false &&
    ER8_LOCKS.HIDDEN_CHAIN_OF_THOUGHT_IN_KNOWLEDGE_PACK === false &&
    ER8_LOCKS.BYPASS_GUARDIAN_RLS === false &&
    ER8_LOCKS.EXPAND_TENANT_UNIVERSE_ACCESS === false &&
    ER8_LOCKS.BYPASS_GUARDIAN_RLS_TENANT_UNIVERSE === false &&
    ER8_LOCKS.GUARDIAN_RLS_TENANT_UNIVERSE_ISOLATION_UNCHANGED === true &&
    ER8_LOCKS.HUMAN_APPROVAL_BOUNDARIES_UNCHANGED === true &&
    ER8_LOCKS.PERSIST_HIDDEN_CHAIN_OF_THOUGHT === false &&
    ER8_LOCKS.AUTO_DEPLOY_CHANGES === false &&
    ER8_LOCKS.DOCUMENTED_EQ_IMPLEMENTED === false &&
    ER8_LOCKS.IMPLEMENTED_EQ_VERIFIED === false &&
    ER8_LOCKS.VERIFIED_EQ_PRODUCTION_AUTHORIZED === false &&
    ER8_LOCKS.HUMAN_APPROVAL_REQUIRED_BEFORE_CONSEQUENTIAL_ACTIONS === true &&
    ER8_LOCKS.TIP_LAND === false &&
    ER8_LOCKS.PRODUCTION_AUTHORIZATION === false &&
    ER8_LOCKS.DB_CANDIDATES_APPLIED === false &&
    ER8_LOCKS.FULL_PRODUCTION_ANCIENT_CIV_PACK_SHIPPED === false &&
    ER8_LOCKS.MANAGE_PULL_REQUEST === false &&
    ANCIENT_CIV_CULTURAL_SAFEGUARDS.noMonolithicAfricanKnowledge === true &&
    ANCIENT_CIV_CULTURAL_SAFEGUARDS.noMonolithicChineseKnowledge === true &&
    ANCIENT_CIV_CULTURAL_SAFEGUARDS.noMonolithicIndigenousKnowledge === true &&
    ANCIENT_CIV_CULTURAL_SAFEGUARDS.preserveRegionPeriodSourceTranslationContext ===
      true &&
    ANCIENT_CIV_CULTURAL_SAFEGUARDS.distinguishDocumentedPracticeFromLegendOrLaterInterpretation ===
      true &&
    ANCIENT_CIV_CULTURAL_SAFEGUARDS.noSpiritualBeliefAsHiddenSystemPolicy ===
      true &&
    ANCIENT_CIV_CULTURAL_SAFEGUARDS.noUnsupportedLostAdvancedTechnologyClaims ===
      true &&
    ER8_AGENT_BOUNDS.automaticAuthority === false &&
    ER8_AGENT_BOUNDS.mayFlattenAfricanChineseIndigenousAsMonolith === false &&
    ER8_AGENT_BOUNDS.mayTreatAnalogyAsProof === false &&
    ER8_AGENT_BOUNDS.mayIngestPiratedMaterial === false &&
    ER8_AGENT_BOUNDS.mayConvertBeliefToHiddenSystemPolicy === false &&
    ER8_AGENT_BOUNDS.mayClaimUnsupportedLostAdvancedTechnology === false
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

export function er8SoftWireSnapshot(repoRoot?: string): Er8SoftWireSnapshot {
  const root =
    repoRoot ?? join(dirname(fileURLToPath(import.meta.url)), '../../..');

  return {
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
    er6HistoricalBusinessCaseAtlas: softWireFile(
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

export function isHumanApprover(actor: Er8Actor): boolean {
  return (
    actor.kind === 'human_approver' ||
    actor.kind === 'founder' ||
    actor.kind === 'tenant_admin'
  );
}

export function isEr8Agent(actor: Er8Actor): boolean {
  const agents: readonly Er8ActorKind[] = [
    'ancient_civ_research_agent',
    'knowledge_pack',
    'historical_avatar',
    'proposal',
  ];
  return agents.includes(actor.kind);
}

/** Analogy pathway is inspiration, never proof. */
export function analogyIsProof(): boolean {
  return false;
}

export function softWireHopState(present: boolean): Er8EvidenceState {
  return present ? 'PASS' : 'WAITING_DATA';
}
