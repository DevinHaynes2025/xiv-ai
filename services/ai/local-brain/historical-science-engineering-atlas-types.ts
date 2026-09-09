/**
 * 62L-ER7 — Historical Science & Engineering Atlas (park-and-implement).
 *
 * Layer: 62L-ER Real API Data Fabric + Global Historical Knowledge Ingestion +
 * Offline/Online Brain Sync + Historical Avatar Simulations + Universal Device
 * Distribution (GitHub #162).
 *
 * Structured science-and-engineering history atlas so agents learn how computing,
 * physics, quantum information, transportation, telecom, aerospace,
 * infrastructure, and semiconductor systems evolved over time.
 *
 * Critical rule: Historical knowledge can inspire new hypotheses, but cannot
 * automatically become production truth.
 *
 * Quantum boundary classifications (locks): ESTABLISHED_PHYSICS |
 * THEORETICAL_MODEL | SIMULATED | QUANTUM_INSPIRED | PHYSICAL_QPU_VERIFIED.
 * Deny unsupported quantum-advantage / FTL / gravity-defiance / ET claims.
 *
 * Rights: lawful public-domain, open, licensed, or authorized sources only.
 * Structured facts/summaries/citations/relationships — NOT pirated books,
 * papers, documentaries, or restricted archives.
 *
 * Soft-wire when PRESENT: ER6, ER5, ER4, ER3 (WAITING_DATA ok), ER2, ER1,
 * EQ16, EQ15, EQ14 (WAITING_DATA ok), EQ13, EQ12, EP15, EM (#157).
 * Presence ≠ VERIFIED. Absent → WAITING_DATA (not FAIL).
 *
 * SoT: GitHub #162 / 62L-ER family. GitLab mirror: needsAuth; no number invented.
 *
 * Honesty: DOCUMENTED ≠ IMPLEMENTED ≠ VERIFIED ≠ PRODUCTION AUTHORIZED.
 * L4_AUTONOMY_ENABLED=false. DB candidates NOT_APPLIED. tip-land=NO.
 * Next (report only): ER8 — Ancient Civilizations Knowledge Pack.
 */

import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

export const HONESTY_BANNER =
  'DOCUMENTED ≠ IMPLEMENTED ≠ VERIFIED ≠ PRODUCTION AUTHORIZED' as const;

export const GITHUB_SOT_ISSUE = 162 as const;
export const GITHUB_SOT_LABEL = '62L-ER7' as const;
export const GITHUB_SOT_FAMILY = '62L-ER' as const;
export const GITHUB_SOT_TITLE =
  '62L-ER7 Historical Science & Engineering Atlas — structured S&E history nodes; history≠production truth; quantum classification locks; lawful sources only' as const;

export const GITLAB_MIRROR_NOTE =
  'GitLab mirror: search attempted; MCP needsAuth / not resolved in this environment — no issue number invented.' as const;

export const ER7_DB_CANDIDATES_STATUS = 'NOT_APPLIED' as const;

export const ER_LAYER_TITLE =
  '62L-ER Real API Data Fabric + Global Historical Knowledge Ingestion + Offline/Online Brain Sync + Historical Avatar Simulations + Universal Device Distribution' as const;

export const NEXT_PHASE_TITLE =
  'ER8 — Ancient Civilizations Knowledge Pack — provenance-aware global historical layer across Egypt, Africa, Mesopotamia, India, China, the Americas, Europe, Indigenous traditions, and diaspora knowledge systems.' as const;

/**
 * Core science & engineering history domains.
 */
export const SCIENCE_ENGINEERING_DOMAINS = [
  'classical_physics',
  'quantum_physics_quantum_information',
  'mathematics',
  'computing_history',
  'semiconductor_history',
  'cpu_gpu_npu_evolution',
  'networking_and_internet_history',
  'telecom_and_radio',
  'satellites_and_aerospace',
  'transportation_systems',
  'logistics_engineering',
  'electrical_engineering',
  'manufacturing',
  'energy_systems',
  'databases_and_distributed_systems',
] as const;

export type ScienceEngineeringDomain =
  (typeof SCIENCE_ENGINEERING_DOMAINS)[number];

/**
 * Knowledge node fields (structured atlas record).
 */
export const SCIENCE_ENGINEERING_NODE_FIELDS = [
  'topicId',
  'fieldDomain',
  'discoveryInvention',
  'peopleOrganizations',
  'dateEra',
  'geography',
  'prerequisiteConcepts',
  'engineeringProblem',
  'methodTechnology',
  'measurableOutcome',
  'limitations',
  'laterDevelopments',
  'sourceSet',
  'evidenceClass',
  'confidence',
  'contradictionState',
] as const;

export type ScienceEngineeringNodeField =
  (typeof SCIENCE_ENGINEERING_NODE_FIELDS)[number];

/**
 * Required evidence classes.
 */
export const SCIENCE_ENGINEERING_EVIDENCE_CLASSES = [
  'ESTABLISHED',
  'PEER_REVIEWED',
  'HISTORICAL_RECORD',
  'SCHOLARLY_INTERPRETATION',
  'SUPPORTED_HYPOTHESIS',
  'DISPUTED',
  'SPECULATIVE',
] as const;

export type ScienceEngineeringEvidenceClass =
  (typeof SCIENCE_ENGINEERING_EVIDENCE_CLASSES)[number];

/**
 * Explicit quantum content classifications (locks).
 */
export const QUANTUM_CONTENT_CLASSIFICATIONS = [
  'ESTABLISHED_PHYSICS',
  'THEORETICAL_MODEL',
  'SIMULATED',
  'QUANTUM_INSPIRED',
  'PHYSICAL_QPU_VERIFIED',
] as const;

export type QuantumContentClassification =
  (typeof QUANTUM_CONTENT_CLASSIFICATIONS)[number];

/**
 * XIV neural connection pathway for historical S&E learning.
 * Historical discovery → engineering principle → modern architecture →
 * candidate algorithm → simulation → benchmark → lesson
 */
export const SCIENCE_ENGINEERING_NEURAL_PATHWAY = [
  'historical_discovery',
  'engineering_principle',
  'modern_architecture',
  'candidate_algorithm',
  'simulation',
  'benchmark',
  'lesson',
] as const;

export type ScienceEngineeringNeuralPathwayHop =
  (typeof SCIENCE_ENGINEERING_NEURAL_PATHWAY)[number];

/**
 * Lawful source / rights states for atlas ingest.
 */
export const SCIENCE_ENGINEERING_RIGHTS_STATES = [
  'PUBLIC_DOMAIN',
  'OPEN',
  'LICENSED',
  'AUTHORIZED',
  'RESTRICTED_DENIED',
  'PIRATED_DENIED',
] as const;

export type ScienceEngineeringRightsState =
  (typeof SCIENCE_ENGINEERING_RIGHTS_STATES)[number];

export const CONTRADICTION_STATES = [
  'NONE',
  'NOTED',
  'UNRESOLVED',
  'RESOLVED_WITH_SOURCES',
] as const;

export type ContradictionState = (typeof CONTRADICTION_STATES)[number];

/**
 * Agent query helper intents (MAY).
 */
export const SCIENCE_ENGINEERING_QUERY_HELPERS = [
  'past_hardware_bottlenecks_resembling_today',
  'coevolution_memory_packaging_networking_compute',
  'mathematical_methods_preceding_modern_optimization',
  'distributed_systems_earlier_scale_reliability',
  'quantum_ideas_experimentally_established_vs_theoretical',
  'aerospace_telecom_edge_satellite_architectures',
] as const;

export type ScienceEngineeringQueryHelper =
  (typeof SCIENCE_ENGINEERING_QUERY_HELPERS)[number];

export const HISTORICAL_SCIENCE_ENGINEERING_ATLAS_CYCLE = [
  'honesty_locks',
  'historical_science_engineering_atlas_bootstrap',
  // A — Structure
  'domains_encoded',
  'knowledge_node_fields_encoded',
  'evidence_classes_encoded',
  'quantum_classifications_encoded',
  'neural_pathway_encoded',
  'rights_states_encoded',
  'query_helpers_encoded',
  // B — Truth
  'history_neq_production_truth',
  'inspire_hypothesis_not_auto_promote',
  'quantum_content_must_classify',
  'quantum_advantage_requires_verification',
  'lawful_sources_only',
  // C — Denies
  'deny_unverified_quantum_advantage',
  'deny_faster_than_light_networking',
  'deny_gravity_defiance',
  'deny_extraterrestrial_technology',
  'deny_pirated_books_papers_documentaries',
  'deny_restricted_archives',
  'deny_auto_promote_history_to_production_truth',
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

export type Er7Hop = (typeof HISTORICAL_SCIENCE_ENGINEERING_ATLAS_CYCLE)[number];

export type Er7EvidenceState =
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
  | 'HYPOTHESIS_ONLY'
  | 'QUARANTINED';

export type Er7HopRecord = {
  hop: Er7Hop;
  state: Er7EvidenceState;
  summary: string;
  at: string;
};

export type Er7ActorKind =
  | 'science_engineering_atlas'
  | 'historical_research_agent'
  | 'knowledge_ingest'
  | 'proposal'
  | 'human_approver'
  | 'founder'
  | 'guardian'
  | 'home_base'
  | 'tenant_admin';

export type Er7Actor = {
  kind: Er7ActorKind;
  id: string;
  orgId: string;
  tenantId: string;
  universeId: string;
  permissions: readonly string[];
};

export const ER7_LOCKS = Object.freeze({
  L4_AUTONOMY_ENABLED: false as const,
  TIP_LAND: false as const,
  PRODUCTION_AUTHORIZATION: false as const,
  PRODUCTION_WRITE: false as const,
  DB_CANDIDATES_APPLIED: false as const,
  FULL_PRODUCTION_SCIENCE_ENGINEERING_ATLAS_SHIPPED: false as const,
  MANAGE_PULL_REQUEST: false as const,

  // Critical: history ≠ production truth
  HISTORY_AUTO_BECOMES_PRODUCTION_TRUTH: false as const,
  INSPIRED_HYPOTHESIS_EQ_PRODUCTION_TRUTH: false as const,
  AUTO_PROMOTE_HISTORY_TO_PRODUCTION: false as const,

  // Quantum claim denies
  UNVERIFIED_QUANTUM_ADVANTAGE_CLAIM: false as const,
  FASTER_THAN_LIGHT_NETWORKING_CLAIM: false as const,
  GRAVITY_DEFIANCE_CLAIM: false as const,
  EXTRATERRESTRIAL_TECHNOLOGY_CLAIM: false as const,
  QUANTUM_WITHOUT_EXPLICIT_CLASSIFICATION: false as const,

  // Rights / piracy
  PIRATED_BOOKS_PAPERS_DOCUMENTARIES: false as const,
  RESTRICTED_ARCHIVES_INGEST: false as const,
  UNLAWFUL_SOURCE_INGEST: false as const,

  // Autonomy / isolation
  AGENT_AUTO_AUTHORITY: false as const,
  RECOMMEND_EQ_ACT: false as const,
  RECOMMEND_EQ_AUTHORIZE: false as const,
  RECOMMEND_EQ_PROMOTE_TO_PRODUCTION: false as const,
  BYPASS_GUARDIAN_RLS: false as const,
  EXPAND_TENANT_UNIVERSE_ACCESS: false as const,
  PERSIST_HIDDEN_CHAIN_OF_THOUGHT: false as const,
  AUTO_DEPLOY_CHANGES: false as const,
  BYPASS_GUARDIAN_RLS_TENANT_UNIVERSE: false as const,
  GUARDIAN_RLS_TENANT_UNIVERSE_ISOLATION_UNCHANGED: true as const,
  HUMAN_APPROVAL_BOUNDARIES_UNCHANGED: true as const,

  // Honesty ladder
  DOCUMENTED_EQ_IMPLEMENTED: false as const,
  IMPLEMENTED_EQ_VERIFIED: false as const,
  VERIFIED_EQ_PRODUCTION_AUTHORIZED: false as const,
  HUMAN_APPROVAL_REQUIRED_BEFORE_CONSEQUENTIAL_ACTIONS: true as const,
});

export const ER7_AGENT_BOUNDS = Object.freeze({
  mayCreateRegisterKnowledgeNodes: true as const,
  mayAttachEvidenceClass: true as const,
  mayClassifyQuantumContent: true as const,
  mayLinkNeuralPathwayHops: true as const,
  mayInspireHypothesisNotAutoPromote: true as const,
  mayQueryPastHardwareBottlenecks: true as const,
  mayQueryCoevolutionMemoryPackagingNetworkingCompute: true as const,
  mayQueryMathMethodsPrecedingOptimization: true as const,
  mayQueryDistributedSystemsScaleReliability: true as const,
  mayQueryQuantumEstablishedVsTheoretical: true as const,
  mayQueryAerospaceTelecomEdgeSatellite: true as const,
  mayReturnEvidenceToHomeBase: true as const,
  mayAutoPromoteHistoryToProductionTruth: false as const,
  mayClaimUnverifiedQuantumAdvantage: false as const,
  mayClaimFasterThanLightNetworking: false as const,
  mayClaimGravityDefiance: false as const,
  mayClaimExtraterrestrialTechnology: false as const,
  mayIngestPiratedSources: false as const,
  mayIngestRestrictedArchives: false as const,
  mayBypassGuardianRls: false as const,
  mayExpandTenantUniverseAccess: false as const,
  mayPersistHiddenChainOfThought: false as const,
  mayAutoDeployChanges: false as const,
  automaticAuthority: false as const,
  mayRecommendOnly: true as const,
});

export const ER7_MAY = Object.freeze([
  'create_and_register_structured_science_engineering_knowledge_nodes',
  'attach_required_evidence_classes',
  'classify_quantum_content_explicitly',
  'link_neural_pathway_hops_discovery_to_lesson',
  'inspire_hypotheses_from_history_without_auto_promotion',
  'query_past_hardware_bottlenecks_resembling_today',
  'query_coevolution_of_memory_packaging_networking_compute',
  'query_mathematical_methods_preceding_modern_optimization',
  'query_distributed_systems_solving_earlier_scale_reliability',
  'query_quantum_ideas_experimentally_established_vs_theoretical',
  'query_aerospace_telecom_techniques_for_edge_satellite_architectures',
] as const);

export const ER7_MUST_NOT = Object.freeze([
  'treat_historical_knowledge_as_automatic_production_truth',
  'auto_promote_inspired_hypothesis_to_production',
  'claim_quantum_advantage_without_verification',
  'claim_faster_than_light_networking',
  'claim_gravity_defiance',
  'claim_extraterrestrial_technology',
  'store_quantum_content_without_explicit_classification',
  'ingest_pirated_books_papers_documentaries',
  'ingest_restricted_archives',
  'bypass_guardian_rls_or_expand_tenant_universe_access',
  'persist_hidden_chain_of_thought',
  'auto_deploy_changes',
  'treat_recommend_as_act',
  'grant_agents_automatic_authority',
] as const);

export const HISTORY_PRODUCTION_TRUTH_BOUNDARY = Object.freeze({
  historicalKnowledgeMayInspireHypotheses: true as const,
  historicalKnowledgeAutomaticallyBecomesProductionTruth: false as const,
  inspiredHypothesisEqProductionTruth: false as const,
  mayAutoPromoteHistoryToProduction: false as const,
  productionTruthRequiresSeparateVerificationPath: true as const,
});

export const QUANTUM_CLAIM_BOUNDARY = Object.freeze({
  mustClassifyQuantumContent: true as const,
  mayClaimUnverifiedQuantumAdvantage: false as const,
  mayClaimFasterThanLightNetworking: false as const,
  mayClaimGravityDefiance: false as const,
  mayClaimExtraterrestrialTechnology: false as const,
  physicalQpuVerifiedRequiresEvidence: true as const,
});

export type SoftWirePresence = {
  present: boolean;
  pathChecked: string;
  note: string;
};

export type Er7SoftWireSnapshot = {
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

export function assertEr7LocksIntact(): boolean {
  return (
    ER7_LOCKS.L4_AUTONOMY_ENABLED === false &&
    ER7_LOCKS.HISTORY_AUTO_BECOMES_PRODUCTION_TRUTH === false &&
    ER7_LOCKS.INSPIRED_HYPOTHESIS_EQ_PRODUCTION_TRUTH === false &&
    ER7_LOCKS.AUTO_PROMOTE_HISTORY_TO_PRODUCTION === false &&
    ER7_LOCKS.UNVERIFIED_QUANTUM_ADVANTAGE_CLAIM === false &&
    ER7_LOCKS.FASTER_THAN_LIGHT_NETWORKING_CLAIM === false &&
    ER7_LOCKS.GRAVITY_DEFIANCE_CLAIM === false &&
    ER7_LOCKS.EXTRATERRESTRIAL_TECHNOLOGY_CLAIM === false &&
    ER7_LOCKS.QUANTUM_WITHOUT_EXPLICIT_CLASSIFICATION === false &&
    ER7_LOCKS.PIRATED_BOOKS_PAPERS_DOCUMENTARIES === false &&
    ER7_LOCKS.RESTRICTED_ARCHIVES_INGEST === false &&
    ER7_LOCKS.UNLAWFUL_SOURCE_INGEST === false &&
    ER7_LOCKS.AGENT_AUTO_AUTHORITY === false &&
    ER7_LOCKS.RECOMMEND_EQ_ACT === false &&
    ER7_LOCKS.RECOMMEND_EQ_AUTHORIZE === false &&
    ER7_LOCKS.RECOMMEND_EQ_PROMOTE_TO_PRODUCTION === false &&
    ER7_LOCKS.BYPASS_GUARDIAN_RLS === false &&
    ER7_LOCKS.EXPAND_TENANT_UNIVERSE_ACCESS === false &&
    ER7_LOCKS.PERSIST_HIDDEN_CHAIN_OF_THOUGHT === false &&
    ER7_LOCKS.AUTO_DEPLOY_CHANGES === false &&
    ER7_LOCKS.BYPASS_GUARDIAN_RLS_TENANT_UNIVERSE === false &&
    ER7_LOCKS.GUARDIAN_RLS_TENANT_UNIVERSE_ISOLATION_UNCHANGED === true &&
    ER7_LOCKS.HUMAN_APPROVAL_BOUNDARIES_UNCHANGED === true &&
    ER7_LOCKS.DOCUMENTED_EQ_IMPLEMENTED === false &&
    ER7_LOCKS.IMPLEMENTED_EQ_VERIFIED === false &&
    ER7_LOCKS.VERIFIED_EQ_PRODUCTION_AUTHORIZED === false &&
    ER7_LOCKS.HUMAN_APPROVAL_REQUIRED_BEFORE_CONSEQUENTIAL_ACTIONS === true &&
    ER7_LOCKS.TIP_LAND === false &&
    ER7_LOCKS.PRODUCTION_AUTHORIZATION === false &&
    ER7_LOCKS.DB_CANDIDATES_APPLIED === false &&
    ER7_LOCKS.FULL_PRODUCTION_SCIENCE_ENGINEERING_ATLAS_SHIPPED === false &&
    ER7_LOCKS.MANAGE_PULL_REQUEST === false &&
    HISTORY_PRODUCTION_TRUTH_BOUNDARY.historicalKnowledgeAutomaticallyBecomesProductionTruth ===
      false &&
    QUANTUM_CLAIM_BOUNDARY.mayClaimUnverifiedQuantumAdvantage === false &&
    QUANTUM_CLAIM_BOUNDARY.mayClaimFasterThanLightNetworking === false &&
    QUANTUM_CLAIM_BOUNDARY.mayClaimGravityDefiance === false &&
    QUANTUM_CLAIM_BOUNDARY.mayClaimExtraterrestrialTechnology === false &&
    ER7_AGENT_BOUNDS.mayAutoPromoteHistoryToProductionTruth === false &&
    ER7_AGENT_BOUNDS.automaticAuthority === false
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

/** Soft-wire: first matching types file wins (PRESENT); else WAITING_DATA. */
function softWireAnyFile(
  rels: readonly string[],
  notePresent: string,
  noteAbsent: string,
): SoftWirePresence {
  const base = dirname(fileURLToPath(import.meta.url));
  for (const rel of rels) {
    const pathChecked = join(base, rel);
    if (existsSync(pathChecked)) {
      return { present: true, pathChecked, note: notePresent };
    }
  }
  const pathChecked = join(base, rels[0]!);
  return { present: false, pathChecked, note: noteAbsent };
}

function softWireAnyRepoRelative(
  repoRoot: string,
  rels: readonly string[],
  notePresent: string,
  noteAbsent: string,
): SoftWirePresence {
  for (const rel of rels) {
    const pathChecked = join(repoRoot, rel);
    if (existsSync(pathChecked)) {
      return { present: true, pathChecked, note: notePresent };
    }
  }
  return {
    present: false,
    pathChecked: join(repoRoot, rels[0]!),
    note: noteAbsent,
  };
}

export function er7SoftWireSnapshot(repoRoot?: string): Er7SoftWireSnapshot {
  const root =
    repoRoot ?? join(dirname(fileURLToPath(import.meta.url)), '../../..');

  return {
    er6HistoricalBusinessCaseAtlas: softWireAnyFile(
      [
        './historical-business-case-atlas-types.ts',
        './historical-business-case-atlas-v2-types.ts',
      ],
      'ER6 Historical Business Case Atlas PRESENT (soft-wire).',
      'ER6 Historical Business Case Atlas absent — soft-wire WAITING_DATA.',
    ),
    er6Report: softWireAnyRepoRelative(
      root,
      [
        'docs/operations/62L_ER6_HISTORICAL_BUSINESS_CASE_ATLAS_REPORT.md',
        'docs/operations/62L_ER6_HISTORICAL_BUSINESS_CASE_ATLAS_V2_REPORT.md',
      ],
      'ER6 report PRESENT.',
      'ER6 report absent — soft-wire WAITING_DATA.',
    ),
    er5GlobalHistoricalKnowledgeIngestion: softWireFile(
      './global-historical-knowledge-ingestion-types.ts',
      'ER5 Global Historical Knowledge Ingestion PRESENT (soft-wire).',
      'ER5 Global Historical Knowledge Ingestion absent — soft-wire WAITING_DATA.',
    ),
    er5Report: softWireAnyRepoRelative(
      root,
      [
        'docs/operations/62L_ER5_GLOBAL_HISTORICAL_KNOWLEDGE_INGESTION_PIPELINE_REPORT.md',
        'docs/operations/62L_ER5_GLOBAL_HISTORICAL_KNOWLEDGE_INGESTION_REPORT.md',
      ],
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

export function isHumanApprover(actor: Er7Actor): boolean {
  return (
    actor.kind === 'human_approver' ||
    actor.kind === 'founder' ||
    actor.kind === 'tenant_admin'
  );
}

export function isEr7Agent(actor: Er7Actor): boolean {
  const agents: readonly Er7ActorKind[] = [
    'science_engineering_atlas',
    'historical_research_agent',
    'knowledge_ingest',
    'proposal',
  ];
  return agents.includes(actor.kind);
}

export function historyImpliesProductionTruth(): boolean {
  return (
    ER7_LOCKS.HISTORY_AUTO_BECOMES_PRODUCTION_TRUTH === true ||
    HISTORY_PRODUCTION_TRUTH_BOUNDARY.historicalKnowledgeAutomaticallyBecomesProductionTruth ===
      true
  );
}

export function softWireHopState(present: boolean): Er7EvidenceState {
  // Presence ≠ VERIFIED; absent → WAITING_DATA (not FAIL).
  return present ? 'PASS' : 'WAITING_DATA';
}
