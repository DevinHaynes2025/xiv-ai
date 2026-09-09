/**
 * 62L-ER18 — Research Review Board (park-and-implement).
 *
 * Layer: 62L-ER Real API Data Fabric + Global Historical Knowledge Ingestion +
 * Offline/Online Brain Sync + Historical Avatar Simulations + Universal Device
 * Distribution (GitHub #162).
 *
 * Governed Research Review Board so no research finding, historical claim,
 * benchmark, algorithm, skill, or knowledge node enters the permanent brain
 * without evidence, rights, contradiction, and quality review.
 *
 * Soft-wire strongly when present: ER17 Autonomous Research Swarm, ER16
 * Learning Return Receipt. Soft-wire ER15→ER1, EQ16–EQ12, EP15, EM (#157).
 * Presence ≠ VERIFIED. Absent → WAITING_DATA (not FAIL).
 *
 * SoT: GitHub #162 / 62L-ER family. GitLab mirror: needsAuth; no number invented.
 *
 * Honesty: DOCUMENTED ≠ IMPLEMENTED ≠ VERIFIED ≠ PRODUCTION AUTHORIZED.
 * L4_AUTONOMY_ENABLED=false. DB candidates NOT_APPLIED. tip-land=NO.
 * Next (report only): ER19 — Knowledge Deduplication Graph.
 */

import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

export const HONESTY_BANNER =
  'DOCUMENTED ≠ IMPLEMENTED ≠ VERIFIED ≠ PRODUCTION AUTHORIZED' as const;

export const GITHUB_SOT_ISSUE = 162 as const;
export const GITHUB_SOT_LABEL = '62L-ER18' as const;
export const GITHUB_SOT_FAMILY = '62L-ER' as const;
export const GITHUB_SOT_TITLE =
  '62L-ER18 Research Review Board — multi-role evidence/rights/contradiction/quality review; no self-approval; quantum classification enforcement; belief≠fact; unclear-rights quarantine; promote only after board decision' as const;

export const GITLAB_MIRROR_NOTE =
  'GitLab mirror: search attempted; MCP needsAuth / not resolved in this environment — no issue number invented.' as const;

export const ER18_DB_CANDIDATES_STATUS = 'NOT_APPLIED' as const;

export const ER_LAYER_TITLE =
  '62L-ER Real API Data Fabric + Global Historical Knowledge Ingestion + Offline/Online Brain Sync + Historical Avatar Simulations + Universal Device Distribution' as const;

export const NEXT_PHASE_TITLE =
  'ER19 — Knowledge Deduplication Graph — detect duplicate, near-duplicate, and contradictory knowledge nodes across tenants/Universes before permanent brain promotion.' as const;

/**
 * Evaluator roles (exact board seats).
 */
export const RESEARCH_REVIEW_EVALUATOR_ROLES = [
  'Provenance Reviewer',
  'Data Rights Reviewer',
  'Technical Evidence Reviewer',
  'Historical Context Reviewer',
  'Cultural Context Reviewer',
  'Benchmark/Reproducibility Reviewer',
  'Security/Privacy Reviewer',
  'Quantum Evidence Reviewer',
  'Domain Specialist Reviewer',
  'Human Escalation Gate',
] as const;

export type ResearchReviewEvaluatorRole =
  (typeof RESEARCH_REVIEW_EVALUATOR_ROLES)[number];

/**
 * Review fields required on every board packet.
 */
export const RESEARCH_REVIEW_FIELDS = [
  'reviewId',
  'artifactId',
  'sourceRefs',
  'rightsState',
  'evidenceClass',
  'confidence',
  'contradictions',
  'reproducibilityState',
  'freshness',
  'tenantUniverse',
  'reviewers',
  'decision',
  'conditions',
  'expiryRecheckDate',
] as const;

export type ResearchReviewField = (typeof RESEARCH_REVIEW_FIELDS)[number];

/**
 * Required board decisions.
 */
export const RESEARCH_REVIEW_DECISIONS = [
  'APPROVED',
  'APPROVED_WITH_LIMITS',
  'REVIEW_REQUIRED',
  'QUARANTINED',
  'REJECTED',
  'STALE',
] as const;

export type ResearchReviewDecision =
  (typeof RESEARCH_REVIEW_DECISIONS)[number];

/**
 * Promotion flow (exact order).
 */
export const RESEARCH_PROMOTION_FLOW = [
  'research_artifact',
  'rights_review',
  'provenance_review',
  'technical_domain_review',
  'contradiction_check',
  'security_privacy_review',
  'promotion_decision',
  'neural_knowledge_graph',
] as const;

export type ResearchPromotionFlowStep =
  (typeof RESEARCH_PROMOTION_FLOW)[number];

/**
 * Quantum review states (exact).
 * PHYSICAL_QPU_VERIFIED is strongest; THEORETICAL is weakest.
 * Reviewer blocks stronger language when evidence does not support it.
 */
export const QUANTUM_REVIEW_STATES = [
  'THEORETICAL',
  'SIMULATED',
  'QUANTUM_INSPIRED',
  'PHYSICAL_QPU_VERIFIED',
] as const;

export type QuantumReviewState = (typeof QUANTUM_REVIEW_STATES)[number];

export function quantumReviewStateRank(state: QuantumReviewState): number {
  return QUANTUM_REVIEW_STATES.indexOf(state);
}

/**
 * Historical/cultural context fields that must be preserved.
 */
export const HISTORICAL_CULTURAL_PRESERVE_FIELDS = [
  'geography',
  'era',
  'originalSource',
  'translationContext',
  'scholarlyDisagreement',
  'culturalAttribution',
] as const;

export type HistoricalCulturalPreserveField =
  (typeof HISTORICAL_CULTURAL_PRESERVE_FIELDS)[number];

/**
 * Technical review checklist.
 */
export const TECHNICAL_REVIEW_CHECKS = [
  'common_dataset',
  'baseline_comparison',
  'reproducibility',
  'hardware_runtime_versions',
  'measurement_method',
  'statistical_uncertainty',
  'regression_risk',
] as const;

export type TechnicalReviewCheck = (typeof TECHNICAL_REVIEW_CHECKS)[number];

export const RIGHTS_STATES = [
  'PUBLIC_DOMAIN',
  'OPEN_LICENSE',
  'LICENSED',
  'AUTHORIZED',
  'PRIVATE_ORG_TENANT',
  'UNCLEAR',
  'RESTRICTED',
  'REVOKED',
  'LEAKED',
  'STOLEN',
] as const;

export type RightsState = (typeof RIGHTS_STATES)[number];

/** Rights states that cannot promote to permanent brain. */
export const NON_PROMOTABLE_RIGHTS_STATES = [
  'UNCLEAR',
  'RESTRICTED',
  'REVOKED',
  'LEAKED',
  'STOLEN',
] as const;

export type NonPromotableRightsState =
  (typeof NON_PROMOTABLE_RIGHTS_STATES)[number];

export const EVIDENCE_CLASSES = [
  'PRIMARY_SOURCE',
  'MEASURED_RESULT',
  'REPRODUCIBLE_BENCHMARK',
  'SCHOLARLY_INTERPRETATION',
  'HISTORICAL_CLAIM',
  'CULTURAL_TRADITION',
  'THEORETICAL_MODEL',
  'DISPUTED',
  'SPECULATIVE',
] as const;

export type EvidenceClass = (typeof EVIDENCE_CLASSES)[number];

export const REPRODUCIBILITY_STATES = [
  'REPRODUCED',
  'REPRODUCIBLE_WITH_ARTIFACTS',
  'PARTIALLY_REPRODUCIBLE',
  'NOT_REPRODUCED',
  'UNKNOWN',
] as const;

export type ReproducibilityState = (typeof REPRODUCIBILITY_STATES)[number];

export const FRESHNESS_STATES = [
  'CURRENT',
  'STALE',
  'UNKNOWN',
  'EXPIRED',
] as const;

export type FreshnessState = (typeof FRESHNESS_STATES)[number];

export const RESEARCH_REVIEW_BOARD_CYCLE = [
  'honesty_locks',
  'research_review_board_bootstrap',
  'evaluator_roles_encoded',
  'review_fields_encoded',
  'decisions_encoded',
  'promotion_flow_encoded',
  'quantum_states_encoded',
  'historical_cultural_preserve_encoded',
  'technical_checks_encoded',
  'submit_artifact',
  'rights_review',
  'provenance_review',
  'technical_domain_review',
  'historical_cultural_review',
  'quantum_evidence_review',
  'contradiction_check',
  'security_privacy_review',
  'deny_self_approval',
  'board_decision',
  'promotion_gate',
  'neural_knowledge_graph_attach',
  'er17_soft_wire',
  'er16_soft_wire',
  'er15_soft_wire',
  'er14_soft_wire',
  'er13_soft_wire',
  'er12_soft_wire',
  'er11_soft_wire',
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
  'cycle_complete',
] as const;

export type Er18Hop = (typeof RESEARCH_REVIEW_BOARD_CYCLE)[number];

export type Er18EvidenceState =
  | 'PASS'
  | 'FAIL'
  | 'DENIED'
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
  | 'UNKNOWN'
  | 'QUARANTINED'
  | 'APPROVED'
  | 'APPROVED_WITH_LIMITS'
  | 'REVIEW_REQUIRED'
  | 'REJECTED'
  | 'STALE';

export type Er18HopRecord = {
  hop: Er18Hop;
  state: Er18EvidenceState;
  summary: string;
  at: string;
};

export type Er18ActorKind =
  | 'research_agent'
  | 'provenance_reviewer'
  | 'data_rights_reviewer'
  | 'technical_evidence_reviewer'
  | 'historical_context_reviewer'
  | 'cultural_context_reviewer'
  | 'benchmark_reproducibility_reviewer'
  | 'security_privacy_reviewer'
  | 'quantum_evidence_reviewer'
  | 'domain_specialist_reviewer'
  | 'human_escalation_gate'
  | 'human_approver'
  | 'founder'
  | 'guardian'
  | 'home_base'
  | 'tenant_admin';

export type Er18Actor = {
  kind: Er18ActorKind;
  id: string;
  orgId: string;
  tenantId: string;
  universeId: string;
  permissions: readonly string[];
};

export const ER18_LOCKS = Object.freeze({
  L4_AUTONOMY_ENABLED: false as const,
  TIP_LAND: false as const,
  PRODUCTION_AUTHORIZATION: false as const,
  PRODUCTION_WRITE: false as const,
  DB_CANDIDATES_APPLIED: false as const,
  FULL_PRODUCTION_RESEARCH_REVIEW_BOARD_SHIPPED: false as const,
  MANAGE_PULL_REQUEST: false as const,

  SELF_APPROVAL: false as const,
  BELIEF_EQ_SCIENTIFIC_FACT: false as const,
  STRONGER_QUANTUM_LANGUAGE_WITHOUT_EVIDENCE: false as const,
  PROMOTE_UNCLEAR_RIGHTS: false as const,
  PROMOTE_LEAKED_STOLEN_RESTRICTED_REVOKED: false as const,
  CROSS_TENANT_PRIVATE_ORG_LEAK: false as const,
  HIDDEN_CHAIN_OF_THOUGHT: false as const,

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

export const ER18_AGENT_BOUNDS = Object.freeze({
  maySubmitResearchArtifacts: true as const,
  mayServeAsSingleRoleReviewer: true as const,
  mayApproveOwnResearch: false as const,
  mayPromoteWithoutBoardDecision: false as const,
  mayLabelBeliefAsScientificFact: false as const,
  mayClaimStrongerQuantumStateThanEvidence: false as const,
  mayPromoteUnclearOrIllicitRights: false as const,
  mayLeakPrivateOrgFindingsAcrossTenants: false as const,
  mayPersistHiddenChainOfThought: false as const,
  mayBypassGuardianRls: false as const,
  mayExpandTenantUniverseAccess: false as const,
  mayAutoDeployChanges: false as const,
  automaticAuthority: false as const,
  recommendEqAct: false as const,
  recommendEqAuthorize: false as const,
});

export const ER18_MAY = [
  'submit_research_artifact_for_board_review',
  'run_multi_role_review_packet',
  'quarantine_unclear_or_illicit_rights',
  'enforce_quantum_classification_ceiling',
  'block_belief_to_fact_promotion',
  'attach_approved_node_to_neural_knowledge_graph_after_board_decision',
  'escalate_to_human_gate',
] as const;

export const ER18_MUST_NOT = [
  'approve_own_research',
  'promote_without_board_decision',
  'label_historical_belief_as_scientific_fact',
  'use_stronger_quantum_language_than_evidence_supports',
  'promote_leaked_stolen_restricted_revoked_or_unclear_rights',
  'leak_private_org_findings_across_tenant_universe',
  'persist_hidden_chain_of_thought',
  'bypass_guardian_rls',
  'tip_land_or_open_pr',
  'enable_l4_autonomy',
] as const;

export type SoftWirePresence = {
  present: boolean;
  pathChecked: string;
  note: string;
};

export type Er18SoftWireSnapshot = {
  /** Strong soft-wire when present. */
  er17AutonomousResearchSwarm: SoftWirePresence;
  er17Report: SoftWirePresence;
  /** Strong soft-wire when present. */
  er16LearningReturnReceipt: SoftWirePresence;
  er16Report: SoftWirePresence;
  er15OnlineOfflineSyncContract: SoftWirePresence;
  er15Report: SoftWirePresence;
  er14OfflineBrainPackager: SoftWirePresence;
  er14Report: SoftWirePresence;
  er13OnlineBrainIndex: SoftWirePresence;
  er13Report: SoftWirePresence;
  er12LiveDataConnectorGate: SoftWirePresence;
  er12Report: SoftWirePresence;
  er11PublicGovernmentDataPack: SoftWirePresence;
  er11Report: SoftWirePresence;
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

export function assertEr18LocksIntact(): boolean {
  return (
    ER18_LOCKS.L4_AUTONOMY_ENABLED === false &&
    ER18_LOCKS.SELF_APPROVAL === false &&
    ER18_LOCKS.BELIEF_EQ_SCIENTIFIC_FACT === false &&
    ER18_LOCKS.STRONGER_QUANTUM_LANGUAGE_WITHOUT_EVIDENCE === false &&
    ER18_LOCKS.PROMOTE_UNCLEAR_RIGHTS === false &&
    ER18_LOCKS.PROMOTE_LEAKED_STOLEN_RESTRICTED_REVOKED === false &&
    ER18_LOCKS.CROSS_TENANT_PRIVATE_ORG_LEAK === false &&
    ER18_LOCKS.HIDDEN_CHAIN_OF_THOUGHT === false &&
    ER18_LOCKS.BYPASS_GUARDIAN_RLS === false &&
    ER18_LOCKS.EXPAND_TENANT_UNIVERSE_ACCESS === false &&
    ER18_LOCKS.PERSIST_HIDDEN_CHAIN_OF_THOUGHT === false &&
    ER18_LOCKS.AUTO_DEPLOY_CHANGES === false &&
    ER18_LOCKS.AGENT_AUTO_AUTHORITY === false &&
    ER18_LOCKS.RECOMMEND_EQ_ACT === false &&
    ER18_LOCKS.RECOMMEND_EQ_AUTHORIZE === false &&
    ER18_LOCKS.BYPASS_GUARDIAN_RLS_TENANT_UNIVERSE === false &&
    ER18_LOCKS.GUARDIAN_RLS_TENANT_UNIVERSE_ISOLATION_UNCHANGED === true &&
    ER18_LOCKS.HUMAN_APPROVAL_BOUNDARIES_UNCHANGED === true &&
    ER18_LOCKS.DOCUMENTED_EQ_IMPLEMENTED === false &&
    ER18_LOCKS.IMPLEMENTED_EQ_VERIFIED === false &&
    ER18_LOCKS.VERIFIED_EQ_PRODUCTION_AUTHORIZED === false &&
    ER18_LOCKS.HUMAN_APPROVAL_REQUIRED_BEFORE_CONSEQUENTIAL_ACTIONS === true &&
    ER18_LOCKS.PRESENCE_EQ_VERIFIED === false &&
    ER18_LOCKS.TIP_LAND === false &&
    ER18_LOCKS.PRODUCTION_AUTHORIZATION === false &&
    ER18_LOCKS.DB_CANDIDATES_APPLIED === false &&
    ER18_LOCKS.FULL_PRODUCTION_RESEARCH_REVIEW_BOARD_SHIPPED === false &&
    ER18_LOCKS.MANAGE_PULL_REQUEST === false &&
    ER18_AGENT_BOUNDS.mayApproveOwnResearch === false &&
    ER18_AGENT_BOUNDS.mayPromoteWithoutBoardDecision === false &&
    ER18_AGENT_BOUNDS.mayLabelBeliefAsScientificFact === false &&
    ER18_AGENT_BOUNDS.automaticAuthority === false
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

export function er18SoftWireSnapshot(repoRoot?: string): Er18SoftWireSnapshot {
  const root =
    repoRoot ?? join(dirname(fileURLToPath(import.meta.url)), '../../..');

  return {
    er17AutonomousResearchSwarm: softWireFile(
      './autonomous-research-swarm-types.ts',
      'ER17 Autonomous Research Swarm PRESENT (strong soft-wire).',
      'ER17 Autonomous Research Swarm absent — soft-wire WAITING_DATA.',
    ),
    er17Report: softWireRepoRelative(
      root,
      'docs/operations/62L_ER17_AUTONOMOUS_RESEARCH_SWARM_REPORT.md',
      'ER17 report PRESENT (strong soft-wire).',
      'ER17 report absent — soft-wire WAITING_DATA.',
    ),
    er16LearningReturnReceipt: softWireFile(
      './learning-return-receipt-types.ts',
      'ER16 Learning Return Receipt PRESENT (strong soft-wire).',
      'ER16 Learning Return Receipt absent — soft-wire WAITING_DATA.',
    ),
    er16Report: softWireRepoRelative(
      root,
      'docs/operations/62L_ER16_LEARNING_RETURN_RECEIPT_REPORT.md',
      'ER16 report PRESENT (strong soft-wire).',
      'ER16 report absent — soft-wire WAITING_DATA.',
    ),
    er15OnlineOfflineSyncContract: softWireFile(
      './online-offline-sync-contract-types.ts',
      'ER15 Online/Offline Sync Contract PRESENT (soft-wire).',
      'ER15 Online/Offline Sync Contract absent — soft-wire WAITING_DATA.',
    ),
    er15Report: softWireRepoRelative(
      root,
      'docs/operations/62L_ER15_ONLINE_OFFLINE_SYNC_CONTRACT_REPORT.md',
      'ER15 report PRESENT.',
      'ER15 report absent — soft-wire WAITING_DATA.',
    ),
    er14OfflineBrainPackager: softWireFile(
      './offline-brain-packager-types.ts',
      'ER14 Offline Brain Packager PRESENT (soft-wire).',
      'ER14 Offline Brain Packager absent — soft-wire WAITING_DATA.',
    ),
    er14Report: softWireRepoRelative(
      root,
      'docs/operations/62L_ER14_OFFLINE_BRAIN_PACKAGER_REPORT.md',
      'ER14 report PRESENT.',
      'ER14 report absent — soft-wire WAITING_DATA.',
    ),
    er13OnlineBrainIndex: softWireFile(
      './online-brain-index-types.ts',
      'ER13 Online Brain Index PRESENT (soft-wire).',
      'ER13 Online Brain Index absent — soft-wire WAITING_DATA.',
    ),
    er13Report: softWireRepoRelative(
      root,
      'docs/operations/62L_ER13_ONLINE_BRAIN_INDEX_REPORT.md',
      'ER13 report PRESENT.',
      'ER13 report absent — soft-wire WAITING_DATA.',
    ),
    er12LiveDataConnectorGate: softWireFile(
      './live-data-connector-gate-types.ts',
      'ER12 Live Data Connector Gate PRESENT (soft-wire).',
      'ER12 Live Data Connector Gate absent — soft-wire WAITING_DATA.',
    ),
    er12Report: softWireRepoRelative(
      root,
      'docs/operations/62L_ER12_LIVE_DATA_CONNECTOR_GATE_REPORT.md',
      'ER12 report PRESENT.',
      'ER12 report absent — soft-wire WAITING_DATA.',
    ),
    er11PublicGovernmentDataPack: softWireFile(
      './public-government-data-pack-types.ts',
      'ER11 Public Government Data Pack PRESENT (soft-wire).',
      'ER11 Public Government Data Pack absent — soft-wire WAITING_DATA.',
    ),
    er11Report: softWireRepoRelative(
      root,
      'docs/operations/62L_ER11_PUBLIC_GOVERNMENT_DATA_PACK_REPORT.md',
      'ER11 report PRESENT.',
      'ER11 report absent — soft-wire WAITING_DATA.',
    ),
    er10PublicGeospatialMobilityPack: softWireFile(
      './public-geospatial-mobility-pack-types.ts',
      'ER10 Public Geospatial / Mobility Pack PRESENT (soft-wire).',
      'ER10 Public Geospatial / Mobility Pack absent — soft-wire WAITING_DATA.',
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

export function softWireHopState(present: boolean): Er18EvidenceState {
  return present ? 'PASS' : 'WAITING_DATA';
}

export function isHumanEscalationGate(actor: Er18Actor): boolean {
  return (
    actor.kind === 'human_escalation_gate' ||
    actor.kind === 'human_approver' ||
    actor.kind === 'founder' ||
    actor.kind === 'tenant_admin'
  );
}

export function isResearchSubmitter(actor: Er18Actor): boolean {
  return actor.kind === 'research_agent';
}

export function isBoardReviewer(actor: Er18Actor): boolean {
  const reviewers: readonly Er18ActorKind[] = [
    'provenance_reviewer',
    'data_rights_reviewer',
    'technical_evidence_reviewer',
    'historical_context_reviewer',
    'cultural_context_reviewer',
    'benchmark_reproducibility_reviewer',
    'security_privacy_reviewer',
    'quantum_evidence_reviewer',
    'domain_specialist_reviewer',
    'human_escalation_gate',
  ];
  return reviewers.includes(actor.kind);
}

export function isNonPromotableRights(rights: RightsState): boolean {
  return (NON_PROMOTABLE_RIGHTS_STATES as readonly string[]).includes(rights);
}
