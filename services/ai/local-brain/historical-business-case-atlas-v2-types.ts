/**
 * 62L-ER6 — Historical Business Case Atlas v2 (park-and-implement).
 *
 * Layer: 62L-ER (GitHub #162).
 *
 * Structured historical business-case atlas so agents learn from real company
 * decisions, negotiations, failures, turnarounds, pricing, logistics,
 * technology shifts, and government/industry contracts — without treating
 * history as deterministic proof.
 *
 * Core flow:
 * Historical source → case reconstruction → evidence review → structured
 * decision object → reusable lesson → neural graph
 *
 * Decision-learning lock: historical analogy labeled SIMILAR_CASE, never
 * PROVEN_CAUSE. Every recommendation must still account for current data,
 * market conditions, laws, technology, and customer context.
 *
 * Soft-wire when PRESENT: ER5, ER2, ER1, EQ16, EQ15, EQ13, EQ12, EP15, EM (#157).
 * ER4 / ER3 / EQ14 may be WAITING_DATA. Presence ≠ VERIFIED.
 *
 * SoT: GitHub #162 / 62L-ER family. GitLab mirror: needsAuth; no number invented.
 *
 * Honesty: DOCUMENTED ≠ IMPLEMENTED ≠ VERIFIED ≠ PRODUCTION AUTHORIZED.
 * L4_AUTONOMY_ENABLED=false. DB candidates NOT_APPLIED. tip-land=NO.
 * Next (report only): ER7 — Historical Science & Engineering Atlas.
 */

import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

export const HONESTY_BANNER =
  'DOCUMENTED ≠ IMPLEMENTED ≠ VERIFIED ≠ PRODUCTION AUTHORIZED' as const;

export const GITHUB_SOT_ISSUE = 162 as const;
export const GITHUB_SOT_LABEL = '62L-ER6' as const;
export const GITHUB_SOT_FAMILY = '62L-ER' as const;
export const GITHUB_SOT_TITLE =
  '62L-ER6 Historical Business Case Atlas v2 — SIMILAR_CASE≠PROVEN_CAUSE; structured cases → lessons → neural graph' as const;

export const GITLAB_MIRROR_NOTE =
  'GitLab mirror: search attempted; MCP needsAuth / not resolved in this environment — no issue number invented.' as const;

export const ER6_DB_CANDIDATES_STATUS = 'NOT_APPLIED' as const;

export const ER_LAYER_TITLE =
  '62L-ER Real API Data Fabric + Global Historical Knowledge Ingestion + Offline/Online Brain Sync + Historical Avatar Simulations + Universal Device Distribution' as const;

export const NEXT_PHASE_TITLE =
  'ER7 — Historical Science & Engineering Atlas — computing, physics, quantum information, transportation, infrastructure, telecom, aerospace, and semiconductor history into the research brain.' as const;

/**
 * Structured historical business-case fields.
 */
export const HISTORICAL_BUSINESS_CASE_FIELDS = [
  'caseId',
  'organization',
  'company',
  'industry',
  'geography',
  'timePeriod',
  'problem',
  'decision',
  'constraints',
  'stakeholders',
  'pricingContractContext',
  'supplyChainLogisticsContext',
  'technologyContext',
  'outcome',
  'unintendedConsequences',
  'lessons',
  'sourceSet',
  'evidenceClass',
  'confidence',
  'contradictionState',
] as const;

export type HistoricalBusinessCaseField =
  (typeof HISTORICAL_BUSINESS_CASE_FIELDS)[number];

/**
 * Priority domains for the atlas.
 */
export const HISTORICAL_BUSINESS_CASE_DOMAINS = [
  'logistics_and_freight',
  'manufacturing',
  'retail_e_commerce',
  'semiconductors_chips',
  'telecom_satellite',
  'banking_finance',
  'insurance',
  'media_broadcasting',
  'software_saas',
  'enterprise_procurement',
  'government_contracting',
  'pricing_strategy',
  'mergers_partnerships',
  'negotiations',
  'turnarounds_failures',
  'international_expansion',
  'supply_chain_disruptions',
] as const;

export type HistoricalBusinessCaseDomain =
  (typeof HISTORICAL_BUSINESS_CASE_DOMAINS)[number];

/**
 * Core atlas flow hops.
 */
export const HISTORICAL_BUSINESS_CASE_CORE_FLOW = [
  'historical_source',
  'case_reconstruction',
  'evidence_review',
  'structured_decision_object',
  'reusable_lesson',
  'neural_graph',
] as const;

export type HistoricalBusinessCaseCoreFlowHop =
  (typeof HISTORICAL_BUSINESS_CASE_CORE_FLOW)[number];

/**
 * Decision-learning labels — analogy only, never causal proof.
 */
export const DECISION_LEARNING_LABELS = [
  'SIMILAR_CASE',
  'PROVEN_CAUSE',
] as const;

export type DecisionLearningLabel =
  (typeof DECISION_LEARNING_LABELS)[number];

export const ALLOWED_ANALOGY_LABEL = 'SIMILAR_CASE' as const;
export const FORBIDDEN_ANALOGY_LABEL = 'PROVEN_CAUSE' as const;

/**
 * Neural pathway for historical → current decision candidates.
 */
export const HISTORICAL_CASE_NEURAL_PATHWAY = [
  'historical_case',
  'problem_pattern',
  'decision_pattern',
  'outcome',
  'lesson',
  'current_decision_candidate',
] as const;

export type HistoricalCaseNeuralPathwayHop =
  (typeof HISTORICAL_CASE_NEURAL_PATHWAY)[number];

/**
 * Lesson transfer quality outcomes for strengthen/weaken.
 */
export const LESSON_TRANSFER_QUALITIES = [
  'successful_reuse',
  'poor_transfer',
] as const;

export type LessonTransferQuality =
  (typeof LESSON_TRANSFER_QUALITIES)[number];

/**
 * Evidence / contradiction classes for reconstructed cases.
 */
export const EVIDENCE_CLASSES = [
  'PRIMARY_PUBLIC',
  'SECONDARY_SUMMARY',
  'CITED_METADATA',
  'STRUCTURED_FACT',
  'ADVISORY_ONLY',
] as const;

export type EvidenceClass = (typeof EVIDENCE_CLASSES)[number];

export const CONTRADICTION_STATES = [
  'NONE',
  'NOTED',
  'UNRESOLVED',
  'RESOLVED_WITH_CONTEXT',
] as const;

export type ContradictionState = (typeof CONTRADICTION_STATES)[number];

/**
 * IP / copyright ingest boundary — structured summaries only.
 */
export const IP_COPYRIGHT_BOUNDARY = Object.freeze({
  mayStoreStructuredSummaries: true as const,
  mayStoreFactsMetadataCitationsLessons: true as const,
  mayStorePiratedCasebooks: false as const,
  mayStoreFullCopyrightedArticles: false as const,
  mayStoreDocumentariesAsCorpus: false as const,
  mayStoreProprietaryConsultingReports: false as const,
  historicalAnalogyLabel: ALLOWED_ANALOGY_LABEL,
  mayLabelProvenCause: false as const,
});

/**
 * Recommendation must still account for live context.
 */
export const CURRENT_CONTEXT_REQUIREMENTS = [
  'current_data',
  'market_conditions',
  'laws',
  'technology',
  'customer_context',
] as const;

export type CurrentContextRequirement =
  (typeof CURRENT_CONTEXT_REQUIREMENTS)[number];

/**
 * Agent query capabilities (MAY / example APIs — not production authority).
 */
export const ER6_MAY_QUERY_APIS = Object.freeze([
  'query_similar_bottleneck_cases',
  'query_multi_year_contract_structures_historically',
  'query_pricing_strategies_that_failed',
  'query_negotiation_concessions_with_long_term_problems',
  'query_logistics_recovery_from_disruptions',
  'query_technology_transitions_creating_durable_advantage',
  'query_government_contract_patterns_overruns_vs_success',
] as const);

export type Er6MayQueryApi = (typeof ER6_MAY_QUERY_APIS)[number];

export const HISTORICAL_BUSINESS_CASE_TRUTH_BOUNDARY = Object.freeze({
  similarCaseEqProvenCause: false as const,
  mayLabelAnalogyAsProvenCause: false as const,
  mayIgnoreCurrentContextWhenRecommending: false as const,
  mayIngestPiratedCasebooks: false as const,
  mayIngestFullCopyrightedArticles: false as const,
  mayIngestProprietaryConsultingReports: false as const,
  mayCrossTenantReuse: false as const,
  mayBypassGuardianRls: false as const,
  mayExpandTenantUniverseAccess: false as const,
  mayPersistHiddenChainOfThought: false as const,
  mayAutoDeployChanges: false as const,
  documentedEqVerified: false as const,
  presenceEqVerified: false as const,
});

export type HistoricalBusinessCaseRecord = {
  caseId: string;
  organization: string;
  company: string;
  industry: string;
  geography: string;
  timePeriod: string;
  problem: string;
  decision: string;
  constraints: readonly string[];
  stakeholders: readonly string[];
  pricingContractContext: string;
  supplyChainLogisticsContext: string;
  technologyContext: string;
  outcome: string;
  unintendedConsequences: readonly string[];
  lessons: readonly string[];
  sourceSet: readonly string[];
  evidenceClass: EvidenceClass;
  confidence: number;
  contradictionState: ContradictionState;
  domains: readonly HistoricalBusinessCaseDomain[];
  orgId: string;
  tenantId: string;
  universeId: string;
  analogyLabel: typeof ALLOWED_ANALOGY_LABEL;
  reconstructed: boolean;
  evidenceReviewed: boolean;
  fullCopyrightedCorpusPresent: false;
  piratedCasebookPresent: false;
};

export type StructuredDecisionObject = {
  decisionObjectId: string;
  caseId: string;
  problemPattern: string;
  decisionPattern: string;
  outcomeSummary: string;
  analogyLabel: typeof ALLOWED_ANALOGY_LABEL;
  currentContextAccounted: readonly CurrentContextRequirement[];
  domains: readonly HistoricalBusinessCaseDomain[];
  confidence: number;
};

export type ReusableLesson = {
  lessonId: string;
  caseId: string;
  decisionObjectId: string;
  statement: string;
  strength: number;
  transferCount: number;
  successfulReuseCount: number;
  poorTransferCount: number;
  analogyLabel: typeof ALLOWED_ANALOGY_LABEL;
};

export type NeuralGraphEdge = {
  from: HistoricalCaseNeuralPathwayHop;
  to: HistoricalCaseNeuralPathwayHop;
  caseId: string;
  lessonId: string | null;
  weight: number;
};

export const HISTORICAL_BUSINESS_CASE_ATLAS_CYCLE = [
  'honesty_locks',
  'historical_business_case_atlas_bootstrap',
  // A — Structure
  'case_fields_encoded',
  'priority_domains_encoded',
  'core_flow_encoded',
  'decision_learning_lock_encoded',
  'neural_pathway_encoded',
  'ip_copyright_boundary_encoded',
  'may_query_apis_encoded',
  // B — Flow
  'reconstruct_case',
  'evidence_review',
  'build_decision_object',
  'attach_reusable_lesson',
  'query_similar_cases_similar_case_only',
  'strengthen_lesson_on_successful_reuse',
  'weaken_lesson_on_poor_transfer',
  // C — Denies
  'deny_proven_cause_label',
  'deny_pirated_casebooks',
  'deny_full_copyrighted_ingest',
  'deny_proprietary_consulting_reports',
  'deny_ignore_current_context',
  'deny_cross_tenant_reuse',
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

export type Er6Hop = (typeof HISTORICAL_BUSINESS_CASE_ATLAS_CYCLE)[number];

export type Er6EvidenceState =
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
  | 'UNKNOWN';

export type Er6HopRecord = {
  hop: Er6Hop;
  state: Er6EvidenceState;
  summary: string;
  at: string;
};

export type Er6ActorKind =
  | 'historical_business_case_atlas'
  | 'case_reconstructer'
  | 'evidence_reviewer'
  | 'lesson_learner'
  | 'proposal'
  | 'human_approver'
  | 'founder'
  | 'guardian'
  | 'home_base'
  | 'tenant_admin';

export type Er6Actor = {
  kind: Er6ActorKind;
  id: string;
  orgId: string;
  tenantId: string;
  universeId: string;
  permissions: readonly string[];
};

export const ER6_LOCKS = Object.freeze({
  L4_AUTONOMY_ENABLED: false as const,
  TIP_LAND: false as const,
  PRODUCTION_AUTHORIZATION: false as const,
  PRODUCTION_WRITE: false as const,
  DB_CANDIDATES_APPLIED: false as const,
  FULL_PRODUCTION_HISTORICAL_BUSINESS_CASE_ATLAS_SHIPPED: false as const,
  MANAGE_PULL_REQUEST: false as const,

  SIMILAR_CASE_EQ_PROVEN_CAUSE: false as const,
  MAY_LABEL_ANALOGY_AS_PROVEN_CAUSE: false as const,
  MAY_IGNORE_CURRENT_CONTEXT: false as const,
  PIRATED_CASEBOOKS: false as const,
  FULL_COPYRIGHTED_ARTICLES: false as const,
  DOCUMENTARIES_AS_CORPUS: false as const,
  PROPRIETARY_CONSULTING_REPORTS: false as const,
  CROSS_TENANT_REUSE: false as const,

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
  PRESENCE_EQ_VERIFIED: false as const,
});

export const ER6_AGENT_BOUNDS = Object.freeze({
  mayReconstructCasesFromLawfulSummaries: true as const,
  mayReviewEvidence: true as const,
  mayBuildStructuredDecisionObjects: true as const,
  mayAttachReusableLessons: true as const,
  mayQuerySimilarCasesAsSimilarCase: true as const,
  mayStrengthenLessonOnSuccessfulReuse: true as const,
  mayWeakenLessonOnPoorTransfer: true as const,
  mayLabelAnalogyAsProvenCause: false as const,
  mayIngestPiratedCasebooks: false as const,
  mayIngestFullCopyrightedArticles: false as const,
  mayIngestProprietaryConsultingReports: false as const,
  mayIgnoreCurrentContext: false as const,
  mayCrossTenantReuse: false as const,
  mayBypassGuardianRls: false as const,
  mayExpandTenantUniverseAccess: false as const,
  mayPersistHiddenChainOfThought: false as const,
  mayAutoDeployChanges: false as const,
  automaticAuthority: false as const,
  mayRecommendOnly: true as const,
});

export const ER6_MAY = Object.freeze([
  'reconstruct_historical_business_cases_from_lawful_structured_summaries',
  'review_evidence_and_record_contradiction_state',
  'build_structured_decision_objects_labeled_similar_case',
  'attach_reusable_lessons_to_neural_pathway',
  'query_similar_bottleneck_and_contract_pricing_negotiation_logistics_tech_gov_cases',
  'strengthen_lessons_on_successful_reuse',
  'weaken_lessons_on_poor_transfer',
  ...ER6_MAY_QUERY_APIS,
] as const);

export const ER6_MUST_NOT = Object.freeze([
  'label_historical_analogy_as_proven_cause',
  'treat_similar_case_as_deterministic_proof',
  'recommend_without_accounting_for_current_data_market_laws_tech_customer_context',
  'ingest_pirated_casebooks',
  'ingest_full_copyrighted_articles_or_documentaries_as_corpus',
  'ingest_proprietary_consulting_reports',
  'cross_tenant_reuse_of_cases',
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

export type Er6SoftWireSnapshot = {
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

export function assertEr6LocksIntact(): boolean {
  return (
    ER6_LOCKS.L4_AUTONOMY_ENABLED === false &&
    ER6_LOCKS.SIMILAR_CASE_EQ_PROVEN_CAUSE === false &&
    ER6_LOCKS.MAY_LABEL_ANALOGY_AS_PROVEN_CAUSE === false &&
    ER6_LOCKS.MAY_IGNORE_CURRENT_CONTEXT === false &&
    ER6_LOCKS.PIRATED_CASEBOOKS === false &&
    ER6_LOCKS.FULL_COPYRIGHTED_ARTICLES === false &&
    ER6_LOCKS.DOCUMENTARIES_AS_CORPUS === false &&
    ER6_LOCKS.PROPRIETARY_CONSULTING_REPORTS === false &&
    ER6_LOCKS.CROSS_TENANT_REUSE === false &&
    ER6_LOCKS.BYPASS_GUARDIAN_RLS === false &&
    ER6_LOCKS.EXPAND_TENANT_UNIVERSE_ACCESS === false &&
    ER6_LOCKS.PERSIST_HIDDEN_CHAIN_OF_THOUGHT === false &&
    ER6_LOCKS.AUTO_DEPLOY_CHANGES === false &&
    ER6_LOCKS.AGENT_AUTO_AUTHORITY === false &&
    ER6_LOCKS.RECOMMEND_EQ_ACT === false &&
    ER6_LOCKS.RECOMMEND_EQ_AUTHORIZE === false &&
    ER6_LOCKS.BYPASS_GUARDIAN_RLS_TENANT_UNIVERSE === false &&
    ER6_LOCKS.GUARDIAN_RLS_TENANT_UNIVERSE_ISOLATION_UNCHANGED === true &&
    ER6_LOCKS.HUMAN_APPROVAL_BOUNDARIES_UNCHANGED === true &&
    ER6_LOCKS.DOCUMENTED_EQ_IMPLEMENTED === false &&
    ER6_LOCKS.IMPLEMENTED_EQ_VERIFIED === false &&
    ER6_LOCKS.VERIFIED_EQ_PRODUCTION_AUTHORIZED === false &&
    ER6_LOCKS.HUMAN_APPROVAL_REQUIRED_BEFORE_CONSEQUENTIAL_ACTIONS === true &&
    ER6_LOCKS.PRESENCE_EQ_VERIFIED === false &&
    ER6_LOCKS.TIP_LAND === false &&
    ER6_LOCKS.PRODUCTION_AUTHORIZATION === false &&
    ER6_LOCKS.DB_CANDIDATES_APPLIED === false &&
    ER6_LOCKS.FULL_PRODUCTION_HISTORICAL_BUSINESS_CASE_ATLAS_SHIPPED ===
      false &&
    ER6_LOCKS.MANAGE_PULL_REQUEST === false &&
    HISTORICAL_BUSINESS_CASE_TRUTH_BOUNDARY.similarCaseEqProvenCause ===
      false &&
    HISTORICAL_BUSINESS_CASE_TRUTH_BOUNDARY.mayLabelAnalogyAsProvenCause ===
      false &&
    IP_COPYRIGHT_BOUNDARY.mayLabelProvenCause === false &&
    IP_COPYRIGHT_BOUNDARY.mayStorePiratedCasebooks === false &&
    ER6_AGENT_BOUNDS.mayLabelAnalogyAsProvenCause === false &&
    ER6_AGENT_BOUNDS.automaticAuthority === false &&
    ALLOWED_ANALOGY_LABEL === 'SIMILAR_CASE' &&
    FORBIDDEN_ANALOGY_LABEL === 'PROVEN_CAUSE'
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

export function er6SoftWireSnapshot(repoRoot?: string): Er6SoftWireSnapshot {
  const root =
    repoRoot ?? join(dirname(fileURLToPath(import.meta.url)), '../../..');

  return {
    er5GlobalHistoricalKnowledgeIngestion: softWireFile(
      './global-historical-knowledge-ingestion-types.ts',
      'ER5 Global Historical Knowledge Ingestion PRESENT (soft-wire).',
      'ER5 Global Historical Knowledge Ingestion absent — soft-wire WAITING_DATA.',
    ),
    er5Report: softWireRepoRelative(
      root,
      'docs/operations/62L_ER5_GLOBAL_HISTORICAL_KNOWLEDGE_INGESTION_PIPELINE_REPORT.md',
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

export function isHumanApprover(actor: Er6Actor): boolean {
  return (
    actor.kind === 'human_approver' ||
    actor.kind === 'founder' ||
    actor.kind === 'tenant_admin'
  );
}

export function isEr6Agent(actor: Er6Actor): boolean {
  const agents: readonly Er6ActorKind[] = [
    'historical_business_case_atlas',
    'case_reconstructer',
    'evidence_reviewer',
    'lesson_learner',
    'proposal',
  ];
  return agents.includes(actor.kind);
}

export function softWireHopState(present: boolean): Er6EvidenceState {
  return present ? 'PASS' : 'WAITING_DATA';
}
