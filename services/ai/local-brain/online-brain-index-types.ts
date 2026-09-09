/**
 * 62L-ER13 — Online Brain Index (park-and-implement).
 *
 * One permission-aware online intelligence index so agents can search approved
 * public data, historical knowledge, authorized APIs, enterprise sources, and
 * research evidence through a unified retrieval layer.
 *
 * Core index structure:
 * Source → Document/Data Object → Chunk/Entity → Embedding/Index →
 * Knowledge Node → Citation → Agent Retrieval
 *
 * Permission-first flow (critical):
 * Agent query → identity → tenant → Universe → purpose → data class →
 * rights → eligible indexes → retrieval → citations
 *
 * Private enterprise data must never become part of the global public index.
 *
 * Scale honesty: “trillions of data” = long-range architecture target.
 * CORPUS_SIZE_ASSUMED_EQ_MEASURED = false — actual corpus size must always
 * be measured rather than assumed.
 *
 * Soft-wire when PRESENT: ER12–ER1, EQ16, EQ15, EQ14, EQ13, EQ12, EP15,
 * EM (#157). Presence ≠ VERIFIED. Absent → WAITING_DATA (not FAIL).
 *
 * SoT: GitHub #162 / 62L-ER family. GitLab mirror: needsAuth; no number invented.
 *
 * Honesty: DOCUMENTED ≠ IMPLEMENTED ≠ VERIFIED ≠ PRODUCTION AUTHORIZED.
 * L4_AUTONOMY_ENABLED=false. DB candidates NOT_APPLIED. tip-land=NO.
 * Next (report only): ER14 — Offline Brain Packager.
 */

import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

export const HONESTY_BANNER =
  'DOCUMENTED ≠ IMPLEMENTED ≠ VERIFIED ≠ PRODUCTION AUTHORIZED' as const;

export const GITHUB_SOT_ISSUE = 162 as const;
export const GITHUB_SOT_LABEL = '62L-ER13' as const;
export const GITHUB_SOT_FAMILY = '62L-ER' as const;
export const GITHUB_SOT_TITLE =
  '62L-ER13 Online Brain Index — permission-aware unified retrieval across approved public, historical, authorized API, enterprise, and research evidence sources with trust-annotated results' as const;

export const GITLAB_MIRROR_NOTE =
  'GitLab mirror: search attempted; MCP needsAuth / not resolved in this environment — no issue number invented.' as const;

export const ER13_DB_CANDIDATES_STATUS = 'NOT_APPLIED' as const;

export const NEXT_PHASE_TITLE =
  'ER14 — Offline Brain Packager — selected approved knowledge encrypted, versioned, compressed, packaged for ASUS/Windows and later phones/edge so XIV remains useful offline.' as const;

/**
 * Core index structure hops.
 */
export const ONLINE_BRAIN_INDEX_STRUCTURE = [
  'source',
  'document_data_object',
  'chunk_entity',
  'embedding_index',
  'knowledge_node',
  'citation',
  'agent_retrieval',
] as const;

export type OnlineBrainIndexStructureHop =
  (typeof ONLINE_BRAIN_INDEX_STRUCTURE)[number];

/**
 * Indexed object fields.
 */
export const INDEXED_OBJECT_FIELDS = [
  'objectId',
  'sourceProvider',
  'tenantUniverse',
  'dataClass',
  'rightsState',
  'provenance',
  'domain',
  'geography',
  'timeRange',
  'language',
  'freshness',
  'authorityLevel',
  'contradictionState',
  'embeddingIndexVersion',
  'retentionExpiry',
  'revocationState',
  'evidenceRefs',
] as const;

export type IndexedObjectField = (typeof INDEXED_OBJECT_FIELDS)[number];

/**
 * Search modes.
 */
export const SEARCH_MODES = [
  'lexical',
  'semantic_vector',
  'graph',
  'structured_database',
  'temporal',
  'geospatial',
  'source_specific',
  'evidence_filtered',
] as const;

export type SearchMode = (typeof SEARCH_MODES)[number];

/**
 * Permission-first retrieval flow.
 */
export const PERMISSION_FIRST_FLOW = [
  'agent_query',
  'identity',
  'tenant',
  'universe',
  'purpose',
  'data_class',
  'rights',
  'eligible_indexes',
  'retrieval',
  'citations',
] as const;

export type PermissionFirstFlowHop = (typeof PERMISSION_FIRST_FLOW)[number];

/**
 * Result trust layer labels — every result exposes these dimensions.
 */
export const RESULT_TRUST_LAYER_FIELDS = [
  'source',
  'date',
  'freshness',
  'rights',
  'confidence',
  'evidenceClass',
  'contradictions',
] as const;

export type ResultTrustLayerField =
  (typeof RESULT_TRUST_LAYER_FIELDS)[number];

/**
 * Evidence class labels agents must distinguish.
 */
export const EVIDENCE_CLASS_LABELS = [
  'CURRENT_OFFICIAL',
  'HISTORICAL',
  'LIVE_VERIFIED',
  'SCHOLARLY_INTERPRETATION',
  'SPECULATIVE',
] as const;

export type EvidenceClassLabel = (typeof EVIDENCE_CLASS_LABELS)[number];

/**
 * Home Base integration loop.
 */
export const HOME_BASE_INTEGRATION_LOOP = [
  'question',
  'online_brain',
  'evidence_bundle',
  'specialist_agents',
  'analysis_simulation',
  'decision_object',
  'xiv_home_base',
] as const;

export type HomeBaseIntegrationLoopHop =
  (typeof HOME_BASE_INTEGRATION_LOOP)[number];

/**
 * Scale architecture targets (not measured corpus claims).
 */
export const SCALE_ARCHITECTURE_TARGETS = [
  'partitioning',
  'metadata_catalogs',
  'deduplication',
  'lifecycle_policies',
  'vector_graph_indexing',
  'hot_warm_cold_storage',
  'caching',
  'provenance',
] as const;

export type ScaleArchitectureTarget =
  (typeof SCALE_ARCHITECTURE_TARGETS)[number];

/**
 * Data class for index eligibility.
 */
export const INDEX_DATA_CLASSES = [
  'PUBLIC_APPROVED',
  'HISTORICAL_KNOWLEDGE',
  'AUTHORIZED_API',
  'ENTERPRISE_PRIVATE',
  'RESEARCH_EVIDENCE',
  'SECRET',
  'UNKNOWN',
] as const;

export type IndexDataClass = (typeof INDEX_DATA_CLASSES)[number];

/**
 * Rights state for indexed objects.
 */
export const INDEX_RIGHTS_STATES = [
  'PUBLIC_INDEX_ELIGIBLE',
  'TENANT_SCOPED',
  'ENTERPRISE_PRIVATE',
  'REVOKED',
  'UNKNOWN_RIGHTS',
  'SECRET',
] as const;

export type IndexRightsState = (typeof INDEX_RIGHTS_STATES)[number];

/**
 * Index scopes — private enterprise never pools into global public.
 */
export const INDEX_SCOPES = [
  'GLOBAL_PUBLIC',
  'TENANT_PRIVATE',
  'ENTERPRISE_PRIVATE',
  'QUARANTINE',
] as const;

export type IndexScope = (typeof INDEX_SCOPES)[number];

/**
 * Forbidden index / retrieval surfaces.
 */
export const ONLINE_BRAIN_MUST_NOT = [
  'unauthorized_scraping',
  'private_data_pooling_into_public_index',
  'permission_bypass',
  'secret_indexing',
  'hidden_chain_of_thought_storage',
  'corpus_size_assumed_without_measurement',
  'claim_trillion_corpus_without_measurement',
  'bypass_guardian_rls_tenant_universe',
] as const;

export const ONLINE_BRAIN_INDEX_CYCLE = [
  'honesty_locks',
  'online_brain_index_bootstrap',
  // A — Structure
  'index_structure_encoded',
  'indexed_object_fields_encoded',
  'search_modes_encoded',
  'permission_first_flow_encoded',
  'trust_layer_encoded',
  'evidence_labels_encoded',
  'home_base_loop_encoded',
  'scale_honesty_encoded',
  'must_not_encoded',
  // B — Runtime truth
  'register_indexed_object',
  'permission_first_retrieval',
  'deny_private_into_public_index',
  'search_mode_dispatch_trust_annotated',
  'evidence_labels_distinguished',
  'measured_corpus_size_only',
  // C — Safety
  'no_unauthorized_scraping',
  'no_private_pooling',
  'no_permission_bypass',
  'no_secret_indexing',
  'no_hidden_cot_storage',
  'guardian_rls_tenant_universe_isolation',
  'l4_autonomy_false',
  'no_tip_land',
  // D — Soft-wires
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
  'db_candidates_not_applied',
  'evidence',
] as const;

export type Er13Hop = (typeof ONLINE_BRAIN_INDEX_CYCLE)[number];

export type Er13EvidenceState =
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
  | 'UNKNOWN';

export type Er13HopRecord = {
  hop: Er13Hop;
  state: Er13EvidenceState;
  summary: string;
  at: string;
};

export type Er13ActorKind =
  | 'online_brain_index'
  | 'retrieval_agent'
  | 'research_agent'
  | 'specialist_agent'
  | 'proposal'
  | 'human_approver'
  | 'founder'
  | 'guardian'
  | 'home_base';

export type Er13Actor = {
  kind: Er13ActorKind;
  id: string;
  orgId: string;
  tenantId: string;
  universeId: string;
  permissions: readonly string[];
};

export const ER13_LOCKS = Object.freeze({
  L4_AUTONOMY_ENABLED: false as const,
  TIP_LAND: false as const,
  PRODUCTION_AUTHORIZATION: false as const,
  PRODUCTION_WRITE: false as const,
  DB_CANDIDATES_APPLIED: false as const,
  FULL_PRODUCTION_ONLINE_BRAIN_INDEX_SHIPPED: false as const,
  MANAGE_PULL_REQUEST: false as const,

  // Scale honesty
  CORPUS_SIZE_ASSUMED_EQ_MEASURED: false as const,
  CLAIM_TRILLION_CORPUS_WITHOUT_MEASUREMENT: false as const,
  TRILLIONS_ARE_LONG_RANGE_ARCHITECTURE_TARGET_ONLY: true as const,

  // Security
  UNAUTHORIZED_SCRAPING_ALLOWED: false as const,
  PRIVATE_DATA_POOLING_INTO_PUBLIC_INDEX: false as const,
  PERMISSION_BYPASS_ALLOWED: false as const,
  SECRET_INDEXING_ALLOWED: false as const,
  HIDDEN_CHAIN_OF_THOUGHT_STORAGE: false as const,

  // Autonomy
  AGENT_AUTO_AUTHORITY: false as const,
  RECOMMEND_EQ_ACT: false as const,
  RECOMMEND_EQ_RETRIEVE: false as const,

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

export const ONLINE_BRAIN_AGENT_BOUNDS = Object.freeze({
  mayQueryEligibleIndexes: true as const,
  mayReturnTrustAnnotatedResults: true as const,
  mayReturnEvidenceBundleToHomeBase: true as const,
  mayDistinguishEvidenceLabels: true as const,
  automaticAuthority: false as const,
  mayUnauthorizedScrape: false as const,
  mayPoolPrivateIntoPublicIndex: false as const,
  mayBypassPermissionFlow: false as const,
  mayIndexSecrets: false as const,
  mayPersistHiddenChainOfThought: false as const,
  mayAssumeCorpusSize: false as const,
  mayRecommendOnly: true as const,
});

export const ER13_MAY = Object.freeze([
  'register_indexed_objects_with_tenant_universe_rights',
  'permission_first_retrieval_filter',
  'dispatch_search_modes_with_trust_annotations',
  'distinguish_evidence_class_labels',
  'return_evidence_bundle_to_home_base',
  'measure_corpus_size_not_assume',
  'partition_and_lifecycle_architecture_targets',
] as const);

export const ER13_MUST_NOT = Object.freeze([
  ...ONLINE_BRAIN_MUST_NOT,
  'treat_recommend_as_act',
  'grant_agents_automatic_authority',
  'tip_land_onto_xiv_v2_or_main',
] as const);

export type SoftWirePresence = {
  present: boolean;
  pathChecked: string;
  note: string;
};

export type Er13SoftWireSnapshot = {
  er12LiveDataConnectorGate: SoftWirePresence;
  er11ApprovedPublicDataConnectors: SoftWirePresence;
  er10EnterpriseApiAdapters: SoftWirePresence;
  er9ResearchEvidenceConnectors: SoftWirePresence;
  er8HistoricalKnowledgeConnectors: SoftWirePresence;
  er7AuthorizedApiConnectors: SoftWirePresence;
  er6PublicDataConnectors: SoftWirePresence;
  er5ConnectorRegistry: SoftWirePresence;
  er4RightsProvenanceGate: SoftWirePresence;
  er3PublicDataSourceRegistry: SoftWirePresence;
  er2ApiTruthStateMachine: SoftWirePresence;
  er1RealApiConnectionRegistry: SoftWirePresence;
  eq16SoftwareWormholeRouter: SoftWirePresence;
  eq15PathwayPlasticity: SoftWirePresence;
  eq14NeuralPathwayArchitectureGraph: SoftWirePresence;
  eq13ArchitectureReturnReceipt: SoftWirePresence;
  eq12CrossArchitectureBenchmarkMatrix: SoftWirePresence;
  ep15AlgorithmTuningSandbox: SoftWirePresence;
  em157HomeBase: SoftWirePresence;
};

export function assertEr13LocksIntact(): boolean {
  return (
    ER13_LOCKS.L4_AUTONOMY_ENABLED === false &&
    ER13_LOCKS.CORPUS_SIZE_ASSUMED_EQ_MEASURED === false &&
    ER13_LOCKS.CLAIM_TRILLION_CORPUS_WITHOUT_MEASUREMENT === false &&
    ER13_LOCKS.TRILLIONS_ARE_LONG_RANGE_ARCHITECTURE_TARGET_ONLY === true &&
    ER13_LOCKS.UNAUTHORIZED_SCRAPING_ALLOWED === false &&
    ER13_LOCKS.PRIVATE_DATA_POOLING_INTO_PUBLIC_INDEX === false &&
    ER13_LOCKS.PERMISSION_BYPASS_ALLOWED === false &&
    ER13_LOCKS.SECRET_INDEXING_ALLOWED === false &&
    ER13_LOCKS.HIDDEN_CHAIN_OF_THOUGHT_STORAGE === false &&
    ER13_LOCKS.AGENT_AUTO_AUTHORITY === false &&
    ER13_LOCKS.RECOMMEND_EQ_ACT === false &&
    ER13_LOCKS.RECOMMEND_EQ_RETRIEVE === false &&
    ER13_LOCKS.BYPASS_GUARDIAN_RLS_TENANT_UNIVERSE === false &&
    ER13_LOCKS.GUARDIAN_RLS_TENANT_UNIVERSE_ISOLATION_UNCHANGED === true &&
    ER13_LOCKS.HUMAN_APPROVAL_BOUNDARIES_UNCHANGED === true &&
    ER13_LOCKS.DOCUMENTED_EQ_IMPLEMENTED === false &&
    ER13_LOCKS.IMPLEMENTED_EQ_VERIFIED === false &&
    ER13_LOCKS.VERIFIED_EQ_PRODUCTION_AUTHORIZED === false &&
    ER13_LOCKS.HUMAN_APPROVAL_REQUIRED_BEFORE_CONSEQUENTIAL_ACTIONS === true &&
    ER13_LOCKS.TIP_LAND === false &&
    ER13_LOCKS.PRODUCTION_AUTHORIZATION === false &&
    ER13_LOCKS.DB_CANDIDATES_APPLIED === false &&
    ER13_LOCKS.FULL_PRODUCTION_ONLINE_BRAIN_INDEX_SHIPPED === false &&
    ER13_LOCKS.MANAGE_PULL_REQUEST === false &&
    ONLINE_BRAIN_AGENT_BOUNDS.automaticAuthority === false &&
    ONLINE_BRAIN_AGENT_BOUNDS.mayUnauthorizedScrape === false &&
    ONLINE_BRAIN_AGENT_BOUNDS.mayPoolPrivateIntoPublicIndex === false &&
    ONLINE_BRAIN_AGENT_BOUNDS.mayBypassPermissionFlow === false &&
    ONLINE_BRAIN_AGENT_BOUNDS.mayIndexSecrets === false &&
    ONLINE_BRAIN_AGENT_BOUNDS.mayPersistHiddenChainOfThought === false &&
    ONLINE_BRAIN_AGENT_BOUNDS.mayAssumeCorpusSize === false
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

export function er13SoftWireSnapshot(_repoRoot?: string): Er13SoftWireSnapshot {
  void _repoRoot;
  return {
    er12LiveDataConnectorGate: softWireFile(
      './live-data-connector-gate-types.ts',
      'ER12 Live Data Connector Gate PRESENT (soft-wire).',
      'ER12 Live Data Connector Gate absent — soft-wire WAITING_DATA.',
    ),
    er11ApprovedPublicDataConnectors: softWireFile(
      './approved-public-data-connectors-types.ts',
      'ER11 Approved Public Data Connectors PRESENT (soft-wire).',
      'ER11 Approved Public Data Connectors absent — soft-wire WAITING_DATA.',
    ),
    er10EnterpriseApiAdapters: softWireFile(
      './enterprise-api-adapters-types.ts',
      'ER10 Enterprise API Adapters PRESENT (soft-wire).',
      'ER10 Enterprise API Adapters absent — soft-wire WAITING_DATA.',
    ),
    er9ResearchEvidenceConnectors: softWireFile(
      './research-evidence-connectors-types.ts',
      'ER9 Research Evidence Connectors PRESENT (soft-wire).',
      'ER9 Research Evidence Connectors absent — soft-wire WAITING_DATA.',
    ),
    er8HistoricalKnowledgeConnectors: softWireFile(
      './historical-knowledge-connectors-types.ts',
      'ER8 Historical Knowledge Connectors PRESENT (soft-wire).',
      'ER8 Historical Knowledge Connectors absent — soft-wire WAITING_DATA.',
    ),
    er7AuthorizedApiConnectors: softWireFile(
      './authorized-api-connectors-types.ts',
      'ER7 Authorized API Connectors PRESENT (soft-wire).',
      'ER7 Authorized API Connectors absent — soft-wire WAITING_DATA.',
    ),
    er6PublicDataConnectors: softWireFile(
      './public-data-connectors-types.ts',
      'ER6 Public Data Connectors PRESENT (soft-wire).',
      'ER6 Public Data Connectors absent — soft-wire WAITING_DATA.',
    ),
    er5ConnectorRegistry: softWireFile(
      './connector-registry-types.ts',
      'ER5 Connector Registry PRESENT (soft-wire).',
      'ER5 Connector Registry absent — soft-wire WAITING_DATA.',
    ),
    er4RightsProvenanceGate: softWireFile(
      './rights-provenance-gate-types.ts',
      'ER4 Rights & Provenance Gate PRESENT (soft-wire).',
      'ER4 Rights & Provenance Gate absent — soft-wire WAITING_DATA.',
    ),
    er3PublicDataSourceRegistry: softWireFile(
      './public-data-source-registry-types.ts',
      'ER3 Public Data Source Registry PRESENT (soft-wire).',
      'ER3 Public Data Source Registry absent — soft-wire WAITING_DATA.',
    ),
    er2ApiTruthStateMachine: softWireFile(
      './api-truth-state-machine-types.ts',
      'ER2 API Truth State Machine PRESENT (soft-wire).',
      'ER2 API Truth State Machine absent — soft-wire WAITING_DATA.',
    ),
    er1RealApiConnectionRegistry: softWireFile(
      './real-api-connection-registry-types.ts',
      'ER1 Real API Connection Registry PRESENT (soft-wire).',
      'ER1 Real API Connection Registry absent — soft-wire WAITING_DATA.',
    ),
    eq16SoftwareWormholeRouter: softWireFile(
      './software-wormhole-router-types.ts',
      'EQ16 Software Wormhole Router PRESENT (soft-wire).',
      'EQ16 Software Wormhole Router absent — soft-wire WAITING_DATA.',
    ),
    eq15PathwayPlasticity: softWireFile(
      './pathway-plasticity-types.ts',
      'EQ15 Pathway Plasticity PRESENT (soft-wire).',
      'EQ15 Pathway Plasticity absent — soft-wire WAITING_DATA.',
    ),
    eq14NeuralPathwayArchitectureGraph: softWireFile(
      './neural-pathway-architecture-graph-types.ts',
      'EQ14 Neural Pathway Architecture Graph PRESENT (soft-wire).',
      'EQ14 Neural Pathway Architecture Graph absent — soft-wire WAITING_DATA.',
    ),
    eq13ArchitectureReturnReceipt: softWireFile(
      './architecture-return-receipt-types.ts',
      'EQ13 Architecture Return Receipt PRESENT (soft-wire).',
      'EQ13 Architecture Return Receipt absent — soft-wire WAITING_DATA.',
    ),
    eq12CrossArchitectureBenchmarkMatrix: softWireFile(
      './cross-architecture-benchmark-matrix-types.ts',
      'EQ12 Cross-Architecture Benchmark Matrix PRESENT (soft-wire).',
      'EQ12 Cross-Architecture Benchmark Matrix absent — soft-wire WAITING_DATA.',
    ),
    ep15AlgorithmTuningSandbox: softWireFile(
      './algorithm-tuning-sandbox-types.ts',
      'EP15 Algorithm Tuning Sandbox PRESENT (soft-wire).',
      'EP15 Algorithm Tuning Sandbox absent — soft-wire WAITING_DATA.',
    ),
    em157HomeBase: softWireFile(
      './agent-compute-home-base-types.ts',
      'EM (#157) Agent Compute Home Base PRESENT (soft-wire).',
      'EM (#157) Agent Compute Home Base absent — soft-wire WAITING_DATA.',
    ),
  };
}

export function softWireState(presence: SoftWirePresence): Er13EvidenceState {
  return presence.present ? 'PASS' : 'WAITING_DATA';
}

export function isHumanApprover(actor: Er13Actor): boolean {
  return actor.kind === 'human_approver' || actor.kind === 'founder';
}

export function isOnlineBrainAgent(actor: Er13Actor): boolean {
  const agents: readonly Er13ActorKind[] = [
    'online_brain_index',
    'retrieval_agent',
    'research_agent',
    'specialist_agent',
    'proposal',
  ];
  return agents.includes(actor.kind);
}

export function isPublicIndexEligible(
  dataClass: IndexDataClass,
  rightsState: IndexRightsState,
): boolean {
  if (
    dataClass === 'ENTERPRISE_PRIVATE' ||
    dataClass === 'SECRET' ||
    dataClass === 'UNKNOWN'
  ) {
    return false;
  }
  if (
    rightsState === 'ENTERPRISE_PRIVATE' ||
    rightsState === 'SECRET' ||
    rightsState === 'REVOKED' ||
    rightsState === 'UNKNOWN_RIGHTS'
  ) {
    return false;
  }
  return rightsState === 'PUBLIC_INDEX_ELIGIBLE';
}
