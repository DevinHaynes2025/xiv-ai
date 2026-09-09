/**
 * 62L-ER5 — Global Historical Knowledge Ingestion Pipeline (park-and-implement).
 *
 * Layer: 62L-ER Real API Data Fabric + … (GitHub #162).
 *
 * Governed ingestion so approved historical and public knowledge can move into
 * the XIV brain with provenance, deduplication, classification, citation, and
 * review — never auto-promoted from discovery to “truth.”
 *
 * Core pipeline:
 * Retrieve → Normalize → Parse → Rights Check → Deduplicate → Classify →
 * Cite → Index → Review → Promote
 *
 * Promotion states:
 * DISCOVERED → RIGHTS_APPROVED → PARSED → NORMALIZED → DEDUPED →
 * REVIEW_REQUIRED → PROMOTED
 * Also: QUARANTINED | REJECTED | STALE
 *
 * Soft-wire when PRESENT: ER4, ER3, ER2, ER1, EQ16, EQ15, EQ13, EQ12, EP15,
 * EM (#157). EQ14 / ER3 / ER4 may be WAITING_DATA. Presence ≠ VERIFIED.
 *
 * SoT: GitHub #162 / 62L-ER family. GitLab mirror: needsAuth; no number invented.
 *
 * Honesty: DOCUMENTED ≠ IMPLEMENTED ≠ VERIFIED ≠ PRODUCTION AUTHORIZED.
 * L4_AUTONOMY_ENABLED=false. DB candidates NOT_APPLIED. tip-land=NO.
 * Next (report only): ER6 — Historical Business Case Atlas v2.
 */

import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

export const HONESTY_BANNER =
  'DOCUMENTED ≠ IMPLEMENTED ≠ VERIFIED ≠ PRODUCTION AUTHORIZED' as const;

export const GITHUB_SOT_ISSUE = 162 as const;
export const GITHUB_SOT_LABEL = '62L-ER5' as const;
export const GITHUB_SOT_FAMILY = '62L-ER' as const;
export const GITHUB_SOT_TITLE =
  '62L-ER5 Global Historical Knowledge Ingestion Pipeline — Retrieve→…→Promote; claim clustering; no auto-promote-to-truth; rights/quarantine gates' as const;

export const GITLAB_MIRROR_NOTE =
  'GitLab mirror: search attempted; MCP needsAuth / not resolved in this environment — no issue number invented.' as const;

export const ER5_DB_CANDIDATES_STATUS = 'NOT_APPLIED' as const;

export const ER_LAYER_TITLE =
  '62L-ER Real API Data Fabric + Global Historical Knowledge Ingestion + Offline/Online Brain Sync + Historical Avatar Simulations + Universal Device Distribution' as const;

export const NEXT_PHASE_TITLE =
  'ER6 — Historical Business Case Atlas v2 — organize lawful historical company, pricing, negotiation, logistics, manufacturing, finance, media, and government cases into structured decision lessons.' as const;

/**
 * Required promotion / job states.
 */
export const INGESTION_PROMOTION_STATES = [
  'DISCOVERED',
  'RIGHTS_APPROVED',
  'PARSED',
  'NORMALIZED',
  'DEDUPED',
  'REVIEW_REQUIRED',
  'PROMOTED',
  'QUARANTINED',
  'REJECTED',
  'STALE',
] as const;

export type IngestionPromotionState =
  (typeof INGESTION_PROMOTION_STATES)[number];

/**
 * Forward evidence ladder (promotion path).
 */
export const INGESTION_CORE_PROGRESSION = [
  'DISCOVERED',
  'RIGHTS_APPROVED',
  'PARSED',
  'NORMALIZED',
  'DEDUPED',
  'REVIEW_REQUIRED',
  'PROMOTED',
] as const;

export type IngestionCoreState =
  (typeof INGESTION_CORE_PROGRESSION)[number];

/**
 * Conceptual pipeline stages (Retrieve → … → Promote).
 */
export const INGESTION_PIPELINE_STAGES = [
  'Retrieve',
  'Normalize',
  'Parse',
  'Rights Check',
  'Deduplicate',
  'Classify',
  'Cite',
  'Index',
  'Review',
  'Promote',
] as const;

export type IngestionPipelineStage =
  (typeof INGESTION_PIPELINE_STAGES)[number];

/**
 * Job tracking fields.
 */
export const INGESTION_JOB_FIELDS = [
  'ingestionId',
  'sourceId',
  'sourceType',
  'domain',
  'geography',
  'eraTimeRange',
  'language',
  'licenseRightsState',
  'parserVersion',
  'transformationHistory',
  'entityLinks',
  'duplicateMatches',
  'contradictionFlags',
  'confidence',
  'reviewer',
  'promotionState',
  'evidenceRefs',
] as const;

export type IngestionJobField = (typeof INGESTION_JOB_FIELDS)[number];

/**
 * Evidence classes — kept separate (never conflated).
 */
export const EVIDENCE_CLASSES = [
  'primary_evidence',
  'later_interpretation',
  'disputed_claim',
  'cultural_belief',
  'modern_scientific_consensus',
  'speculation',
] as const;

export type EvidenceClass = (typeof EVIDENCE_CLASSES)[number];

/**
 * Promoted claim structure fields.
 */
export const PROMOTED_CLAIM_FIELDS = [
  'source',
  'authorOrganization',
  'dateEra',
  'geography',
  'context',
  'claim',
  'evidenceClass',
  'confidence',
] as const;

export type PromotedClaimField = (typeof PROMOTED_CLAIM_FIELDS)[number];

/**
 * Documented brain expansion destinations after PROMOTED (not auto-wired).
 */
export const BRAIN_EXPANSION_TARGETS = [
  'Historical Business Atlas',
  'Science/Engineering Atlas',
  'Government Contract intelligence',
  'Semiconductor/Chip brain',
  'Logistics/Supply Chain brain',
  'Negotiation memory',
  'Quantum research',
  'Offline knowledge packs',
  'Search and retrieval',
  'Neural pathway graphs',
] as const;

export type BrainExpansionTarget = (typeof BRAIN_EXPANSION_TARGETS)[number];

export type LicenseRightsState =
  | 'UNKNOWN'
  | 'APPROVED_PUBLIC'
  | 'APPROVED_LICENSED'
  | 'RESTRICTED'
  | 'PIRATED_SUSPECT'
  | 'LEAKED_SUSPECT'
  | 'PRIVATE_TENANT'
  | 'DENIED';

export type IngestionSourceType =
  | 'public_archive'
  | 'government_open'
  | 'licensed_corpus'
  | 'scientific_publication'
  | 'historical_document'
  | 'api_feed'
  | 'other';

export type ClaimNode = {
  claimId: string;
  claimText: string;
  normalizedKey: string;
  evidenceClass: EvidenceClass;
  confidence: number;
  sourceIds: readonly string[];
  contradictionFlags: readonly string[];
  orgId: string;
  tenantId: string;
  universeId: string;
};

export type PromotedClaim = {
  claimId: string;
  source: string;
  authorOrganization: string;
  dateEra: string;
  geography: string;
  context: string;
  claim: string;
  evidenceClass: EvidenceClass;
  confidence: number;
  brainDestinations: readonly BrainExpansionTarget[];
  promotedAt: string;
  reviewerId: string;
};

export type IngestionJob = {
  ingestionId: string;
  sourceId: string;
  sourceType: IngestionSourceType;
  domain: string;
  geography: string;
  eraTimeRange: string;
  language: string;
  licenseRightsState: LicenseRightsState;
  parserVersion: string | null;
  transformationHistory: readonly string[];
  entityLinks: readonly string[];
  duplicateMatches: readonly string[];
  contradictionFlags: readonly string[];
  confidence: number | null;
  reviewer: string | null;
  promotionState: IngestionPromotionState;
  evidenceRefs: readonly string[];
  evidenceClass: EvidenceClass | null;
  citationRefs: readonly string[];
  indexKeys: readonly string[];
  claimClusterId: string | null;
  orgId: string;
  tenantId: string;
  universeId: string;
  piratedFullWork: false;
  leakedDatabase: false;
  crossTenantPooled: false;
  autoPromotedToTruth: false;
  hiddenChainOfThoughtStored: false;
};

export const INGESTION_BOUNDARY = Object.freeze({
  mayBypassRightsCheck: false as const,
  mayIngestPiratedFullWorks: false as const,
  mayIngestPrivateOrLeakedDatabases: false as const,
  mayCrossTenantPrivateDataPooling: false as const,
  mayAutoPromoteDiscoveryToTruth: false as const,
  mayPersistHiddenChainOfThought: false as const,
  maySkipReviewBeforePromote: false as const,
  mayTreatDisputedAsConsensus: false as const,
  mayCreateFiftyIndependentFactsForSameClaim: false as const,
  mayBypassGuardianRls: false as const,
  mayExpandTenantUniverseAccess: false as const,
  mayAutoDeployChanges: false as const,
  promotedRequiresReviewGate: true as const,
  claimClusteringRequired: true as const,
});

export const GLOBAL_HISTORICAL_KNOWLEDGE_INGESTION_CYCLE = [
  'honesty_locks',
  'ingestion_pipeline_bootstrap',
  // A — Structure
  'promotion_states_encoded',
  'core_progression_encoded',
  'pipeline_stages_encoded',
  'job_fields_encoded',
  'evidence_classes_encoded',
  'claim_structure_encoded',
  'brain_targets_encoded',
  'ingestion_boundary_encoded',
  // B — Truth / pipeline
  'create_discovered_job',
  'rights_check_gate',
  'advance_with_evidence',
  'dedupe_cluster_claims',
  'classify_evidence_class',
  'cite_and_index',
  'review_gate_before_promote',
  'promote_after_review',
  'quarantine_reject_stale',
  // C — Denies
  'deny_rights_bypass',
  'deny_pirated_full_works',
  'deny_private_leaked_databases',
  'deny_cross_tenant_private_pooling',
  'deny_auto_promote_discovery_to_truth',
  'deny_hidden_chain_of_thought',
  'deny_bypass_guardian_rls',
  'deny_expand_tenant_universe_access',
  'deny_auto_deploy_changes',
  // D — Autonomy
  'guardian_rls_tenant_universe_isolation',
  'recommend_neq_act',
  'l4_autonomy_false',
  // E — Soft-wires
  'er_layer_context_documented',
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

export type Er5Hop = (typeof GLOBAL_HISTORICAL_KNOWLEDGE_INGESTION_CYCLE)[number];

export type Er5EvidenceState =
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
  | 'DISCOVERED'
  | 'RIGHTS_APPROVED'
  | 'PARSED'
  | 'NORMALIZED'
  | 'DEDUPED'
  | 'REVIEW_REQUIRED'
  | 'PROMOTED'
  | 'QUARANTINED';

export type Er5HopRecord = {
  hop: Er5Hop;
  state: Er5EvidenceState;
  summary: string;
  at: string;
};

export type Er5ActorKind =
  | 'ingestion_pipeline'
  | 'ingestion_operator'
  | 'knowledge_curator'
  | 'proposal'
  | 'human_approver'
  | 'founder'
  | 'guardian'
  | 'home_base'
  | 'tenant_admin'
  | 'reviewer';

export type Er5Actor = {
  kind: Er5ActorKind;
  id: string;
  orgId: string;
  tenantId: string;
  universeId: string;
  permissions: readonly string[];
};

export const ER5_LOCKS = Object.freeze({
  L4_AUTONOMY_ENABLED: false as const,
  TIP_LAND: false as const,
  PRODUCTION_AUTHORIZATION: false as const,
  PRODUCTION_WRITE: false as const,
  DB_CANDIDATES_APPLIED: false as const,
  FULL_PRODUCTION_INGESTION_PIPELINE_SHIPPED: false as const,
  MANAGE_PULL_REQUEST: false as const,

  RIGHTS_BYPASS: false as const,
  PIRATED_FULL_WORKS: false as const,
  PRIVATE_OR_LEAKED_DATABASES: false as const,
  CROSS_TENANT_PRIVATE_DATA_POOLING: false as const,
  AUTO_PROMOTE_DISCOVERY_TO_TRUTH: false as const,
  PERSIST_HIDDEN_CHAIN_OF_THOUGHT: false as const,
  SKIP_REVIEW_BEFORE_PROMOTE: false as const,
  TREAT_DISPUTED_AS_CONSENSUS: false as const,
  CREATE_INDEPENDENT_FACTS_FOR_SAME_CLAIM: false as const,

  BYPASS_GUARDIAN_RLS: false as const,
  EXPAND_TENANT_UNIVERSE_ACCESS: false as const,
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
});

export const ER5_AGENT_BOUNDS = Object.freeze({
  mayCreateDiscoveredJobs: true as const,
  mayAdvanceWithEvidence: true as const,
  mayRightsCheckGate: true as const,
  mayDedupeClusterClaims: true as const,
  mayClassifyEvidenceClass: true as const,
  mayCiteAndIndex: true as const,
  mayQuarantineRejectStale: true as const,
  mayReturnEvidenceToHomeBase: true as const,
  mayBypassRightsCheck: false as const,
  mayIngestPiratedFullWorks: false as const,
  mayIngestPrivateOrLeakedDatabases: false as const,
  mayCrossTenantPrivateDataPooling: false as const,
  mayAutoPromoteDiscoveryToTruth: false as const,
  mayPersistHiddenChainOfThought: false as const,
  maySkipReviewBeforePromote: false as const,
  mayBypassGuardianRls: false as const,
  mayExpandTenantUniverseAccess: false as const,
  mayAutoDeployChanges: false as const,
  automaticAuthority: false as const,
  mayRecommendOnly: true as const,
});

export const ER5_MAY = Object.freeze([
  'create_ingestion_jobs_in_discovered_state',
  'advance_pipeline_stages_only_with_supporting_evidence',
  'rights_check_before_rights_approved',
  'cluster_duplicate_claims_into_one_node_with_multi_source',
  'classify_and_separate_evidence_classes',
  'cite_and_index_before_review',
  'promote_only_after_human_review_gate',
  'quarantine_reject_or_mark_stale_with_evidence',
  'document_brain_expansion_targets_after_promoted',
] as const);

export const ER5_MUST_NOT = Object.freeze([
  'bypass_rights_check',
  'ingest_pirated_full_works',
  'ingest_private_or_leaked_databases',
  'cross_tenant_private_data_pooling',
  'auto_promote_from_source_discovery_to_truth',
  'persist_hidden_chain_of_thought',
  'skip_review_before_promote',
  'treat_disputed_claims_as_scientific_consensus',
  'create_fifty_independent_facts_for_same_claim',
  'bypass_guardian_rls_or_expand_tenant_universe_access',
  'auto_deploy_changes',
  'treat_recommend_as_act',
  'grant_agents_automatic_authority',
] as const);

export type SoftWirePresence = {
  present: boolean;
  pathChecked: string;
  note: string;
};

export type Er5SoftWireSnapshot = {
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

export function assertEr5LocksIntact(): boolean {
  return (
    ER5_LOCKS.L4_AUTONOMY_ENABLED === false &&
    ER5_LOCKS.RIGHTS_BYPASS === false &&
    ER5_LOCKS.PIRATED_FULL_WORKS === false &&
    ER5_LOCKS.PRIVATE_OR_LEAKED_DATABASES === false &&
    ER5_LOCKS.CROSS_TENANT_PRIVATE_DATA_POOLING === false &&
    ER5_LOCKS.AUTO_PROMOTE_DISCOVERY_TO_TRUTH === false &&
    ER5_LOCKS.PERSIST_HIDDEN_CHAIN_OF_THOUGHT === false &&
    ER5_LOCKS.SKIP_REVIEW_BEFORE_PROMOTE === false &&
    ER5_LOCKS.TREAT_DISPUTED_AS_CONSENSUS === false &&
    ER5_LOCKS.CREATE_INDEPENDENT_FACTS_FOR_SAME_CLAIM === false &&
    ER5_LOCKS.BYPASS_GUARDIAN_RLS === false &&
    ER5_LOCKS.EXPAND_TENANT_UNIVERSE_ACCESS === false &&
    ER5_LOCKS.AUTO_DEPLOY_CHANGES === false &&
    ER5_LOCKS.AGENT_AUTO_AUTHORITY === false &&
    ER5_LOCKS.RECOMMEND_EQ_ACT === false &&
    ER5_LOCKS.RECOMMEND_EQ_AUTHORIZE === false &&
    ER5_LOCKS.BYPASS_GUARDIAN_RLS_TENANT_UNIVERSE === false &&
    ER5_LOCKS.GUARDIAN_RLS_TENANT_UNIVERSE_ISOLATION_UNCHANGED === true &&
    ER5_LOCKS.HUMAN_APPROVAL_BOUNDARIES_UNCHANGED === true &&
    ER5_LOCKS.DOCUMENTED_EQ_IMPLEMENTED === false &&
    ER5_LOCKS.IMPLEMENTED_EQ_VERIFIED === false &&
    ER5_LOCKS.VERIFIED_EQ_PRODUCTION_AUTHORIZED === false &&
    ER5_LOCKS.HUMAN_APPROVAL_REQUIRED_BEFORE_CONSEQUENTIAL_ACTIONS === true &&
    ER5_LOCKS.TIP_LAND === false &&
    ER5_LOCKS.PRODUCTION_AUTHORIZATION === false &&
    ER5_LOCKS.DB_CANDIDATES_APPLIED === false &&
    ER5_LOCKS.FULL_PRODUCTION_INGESTION_PIPELINE_SHIPPED === false &&
    ER5_LOCKS.MANAGE_PULL_REQUEST === false &&
    INGESTION_BOUNDARY.mayBypassRightsCheck === false &&
    INGESTION_BOUNDARY.mayAutoPromoteDiscoveryToTruth === false &&
    INGESTION_BOUNDARY.promotedRequiresReviewGate === true &&
    INGESTION_BOUNDARY.claimClusteringRequired === true &&
    ER5_AGENT_BOUNDS.mayBypassRightsCheck === false &&
    ER5_AGENT_BOUNDS.mayAutoPromoteDiscoveryToTruth === false &&
    ER5_AGENT_BOUNDS.automaticAuthority === false
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

/**
 * Soft-wire ER4: PRESENT if types and/or runtime exist; else WAITING_DATA.
 * Presence ≠ VERIFIED.
 */
export function er5SoftWireSnapshot(repoRoot?: string): Er5SoftWireSnapshot {
  const root =
    repoRoot ?? join(dirname(fileURLToPath(import.meta.url)), '../../..');

  const er4Types = softWireFile(
    './rights-provenance-gate-types.ts',
    'ER4 Rights & Provenance Gate types PRESENT (soft-wire).',
    'ER4 Rights & Provenance Gate types absent — soft-wire WAITING_DATA.',
  );
  const er4Runtime = softWireFile(
    './rights-provenance-gate-runtime.ts',
    'ER4 Rights & Provenance Gate runtime PRESENT (soft-wire).',
    'ER4 Rights & Provenance Gate runtime absent — soft-wire WAITING_DATA.',
  );
  const er4Present = er4Types.present || er4Runtime.present;

  return {
    er4RightsProvenanceGate: {
      present: er4Present,
      pathChecked: er4Types.pathChecked,
      note: er4Present
        ? 'ER4 Rights & Provenance Gate PRESENT (types and/or runtime soft-wire; presence ≠ VERIFIED).'
        : 'ER4 Rights & Provenance Gate absent — soft-wire WAITING_DATA.',
    },
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

export function isHumanApprover(actor: Er5Actor): boolean {
  return (
    actor.kind === 'human_approver' ||
    actor.kind === 'founder' ||
    actor.kind === 'tenant_admin' ||
    actor.kind === 'reviewer'
  );
}

export function isEr5Agent(actor: Er5Actor): boolean {
  const agents: readonly Er5ActorKind[] = [
    'ingestion_pipeline',
    'ingestion_operator',
    'knowledge_curator',
    'proposal',
  ];
  return agents.includes(actor.kind);
}

export function nextCoreState(
  current: IngestionPromotionState,
): IngestionCoreState | null {
  const idx = (INGESTION_CORE_PROGRESSION as readonly string[]).indexOf(
    current,
  );
  if (idx < 0 || idx >= INGESTION_CORE_PROGRESSION.length - 1) return null;
  return INGESTION_CORE_PROGRESSION[idx + 1]!;
}

export function isCoreProgressionStep(
  from: IngestionPromotionState,
  to: IngestionPromotionState,
): boolean {
  const fromIdx = (INGESTION_CORE_PROGRESSION as readonly string[]).indexOf(
    from,
  );
  const toIdx = (INGESTION_CORE_PROGRESSION as readonly string[]).indexOf(to);
  return fromIdx >= 0 && toIdx === fromIdx + 1;
}

export function normalizeClaimKey(claimText: string): string {
  return claimText
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function rightsStateAllowsApproval(
  state: LicenseRightsState,
): boolean {
  return state === 'APPROVED_PUBLIC' || state === 'APPROVED_LICENSED';
}
