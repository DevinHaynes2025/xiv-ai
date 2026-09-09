/**
 * 62L-ER2 — Public/Open Historical Data Registry (park-and-implement).
 *
 * Layer: 62L-ER Real API Data Fabric + Global Historical Knowledge Ingestion +
 * Offline/Online Brain Sync + Historical Avatar Simulations + Universal Device
 * Distribution (GitHub #162).
 *
 * ER2 catalogs public/open/licensed historical corpora with provenance and
 * rights metadata before any ingestion into XIV knowledge pathways.
 *
 * Critical rules:
 * - Registry catalog entry = DOCUMENTED until provenance + rights verified.
 * - Catalog entry ≠ ingestion authorized.
 * - UNKNOWN_RIGHTS / missing provenance → quarantine; never silent ingest.
 * - Public/open ≠ unrestricted redistribute or train-without-terms.
 * - Historical avatar source corpora must remain disclosed simulations later
 *   (ER later) — this phase only catalogs corpora, does not synthesize avatars.
 * - Guardian/RLS/tenant/Universe boundaries unchanged.
 *
 * Soft-wire when PRESENT: ER1, EQ16, EQ15, EQ13, EQ12, EP15, EM (#157).
 * EQ14 may be WAITING_DATA. Presence ≠ VERIFIED.
 *
 * SoT: GitHub #162 / 62L-ER family. GitLab mirror: needsAuth; no number invented.
 *
 * Honesty: DOCUMENTED ≠ IMPLEMENTED ≠ VERIFIED ≠ PRODUCTION AUTHORIZED.
 * L4_AUTONOMY_ENABLED=false. DB candidates NOT_APPLIED. tip-land=NO.
 * Next (report only): ER3 — Provenance & Rights Verification Gate.
 */

import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

export const HONESTY_BANNER =
  'DOCUMENTED ≠ IMPLEMENTED ≠ VERIFIED ≠ PRODUCTION AUTHORIZED' as const;

export const GITHUB_SOT_ISSUE = 162 as const;
export const GITHUB_SOT_LABEL = '62L-ER2' as const;
export const GITHUB_SOT_FAMILY = '62L-ER' as const;
export const GITHUB_SOT_TITLE =
  '62L-ER2 Public/Open Historical Data Registry — catalog corpora with provenance/rights before ingestion; catalog≠ingest' as const;

export const GITLAB_MIRROR_NOTE =
  'GitLab mirror: search attempted; MCP needsAuth / not resolved in this environment — no issue number invented.' as const;

export const ER2_DB_CANDIDATES_STATUS = 'NOT_APPLIED' as const;

export const ER_LAYER_TITLE =
  '62L-ER Real API Data Fabric + Global Historical Knowledge Ingestion + Offline/Online Brain Sync + Historical Avatar Simulations + Universal Device Distribution' as const;

export const NEXT_PHASE_TITLE =
  'ER3 — Provenance & Rights Verification Gate — enforce chain-of-custody, license terms, and ingest/deny decisions before knowledge packs are built.' as const;

/**
 * Fields tracked per historical corpus catalog entry.
 */
export const HISTORICAL_CORPUS_REGISTRY_FIELDS = [
  'corpusId',
  'title',
  'sourceAuthority',
  'accessUrlOrLocator',
  'licenseOrTermsRef',
  'rightsClass',
  'provenanceRefs',
  'timeCoverage',
  'geographyCoverage',
  'subjectTags',
  'format',
  'freshnessCheckedAt',
  'ingestEligibility',
  'quarantineReason',
  'evidenceRefs',
] as const;

export type HistoricalCorpusRegistryField =
  (typeof HISTORICAL_CORPUS_REGISTRY_FIELDS)[number];

export const HISTORICAL_CORPUS_STATES = [
  'CATALOGED',
  'DOCUMENTED',
  'PROVENANCE_ATTACHED',
  'RIGHTS_VERIFIED',
  'INGEST_ELIGIBLE',
  'QUARANTINED',
  'REJECTED',
] as const;

export type HistoricalCorpusState = (typeof HISTORICAL_CORPUS_STATES)[number];

export const HISTORICAL_RIGHTS_CLASSES = [
  'PUBLIC_DOMAIN',
  'PUBLIC_OPEN',
  'OPEN_LICENSE',
  'LICENSED',
  'AUTHORIZED_ARCHIVE',
  'UNKNOWN_RIGHTS',
] as const;

export type HistoricalRightsClass = (typeof HISTORICAL_RIGHTS_CLASSES)[number];

export const INGEST_ELIGIBILITY = [
  'NOT_ELIGIBLE',
  'ELIGIBLE_AFTER_RIGHTS',
  'ELIGIBLE',
  'QUARANTINED',
  'DENIED',
] as const;

export type IngestEligibility = (typeof INGEST_ELIGIBILITY)[number];

/**
 * Preconditions before a corpus may be marked ingest-eligible.
 */
export const CORPUS_INGEST_PRECONDITIONS = [
  'corpus_cataloged',
  'source_authority_declared',
  'locator_documented',
  'license_or_terms_ref_present',
  'rights_class_known_and_allowed',
  'provenance_refs_present',
  'time_coverage_declared',
  'not_quarantined',
  'tenant_universe_scope_match',
] as const;

export type CorpusIngestPrecondition =
  (typeof CORPUS_INGEST_PRECONDITIONS)[number];

export const HISTORICAL_DATA_REGISTRY_FLOW = [
  'discover_or_propose_corpus',
  'catalog_as_documented',
  'attach_provenance_and_license',
  'classify_rights',
  'eligibility_gate',
  'quarantine_or_mark_ingest_eligible',
  'receipt_to_home_base',
] as const;

export type HistoricalCorpusRecord = {
  corpusId: string;
  title: string;
  sourceAuthority: string;
  accessUrlOrLocator: string;
  licenseOrTermsRef: string | null;
  rightsClass: HistoricalRightsClass;
  provenanceRefs: readonly string[];
  timeCoverage: string | null;
  geographyCoverage: string | null;
  subjectTags: readonly string[];
  format: string;
  freshnessCheckedAt: string | null;
  ingestEligibility: IngestEligibility;
  quarantineReason: string | null;
  evidenceRefs: readonly string[];
  state: HistoricalCorpusState;
  orgId: string;
  tenantId: string;
  universeId: string;
  /** Catalog only — no avatar synthesis in ER2. */
  synthesizesHistoricalAvatar: false;
  claimsLiteralResurrection: false;
};

export const HISTORICAL_DATA_TRUTH_BOUNDARY = Object.freeze({
  catalogEntryMeansDocumentedOnly: true as const,
  catalogEntryEqIngestAuthorized: false as const,
  unknownRightsEqAllowed: false as const,
  publicOpenEqUnrestrictedRedistribute: false as const,
  missingProvenanceEqSilentIngest: false as const,
  maySynthesizeHistoricalAvatarsInThisPhase: false as const,
  mayClaimLiteralResurrectionOrConsciousness: false as const,
  mayBypassGuardianRls: false as const,
  mayExpandTenantUniverseAccess: false as const,
  mayPersistHiddenChainOfThought: false as const,
  mayAutoDeployChanges: false as const,
  mayAutonomousBulkIngest: false as const,
});

export const PUBLIC_OPEN_HISTORICAL_DATA_REGISTRY_CYCLE = [
  'honesty_locks',
  'public_open_historical_data_registry_bootstrap',
  // A — Structure
  'registry_fields_encoded',
  'corpus_states_encoded',
  'rights_classes_encoded',
  'ingest_eligibility_encoded',
  'ingest_preconditions_encoded',
  'registry_flow_encoded',
  'truth_boundary_catalog_neq_ingest',
  // B — Truth
  'catalog_corpus_as_documented',
  'provenance_and_license_required',
  'ingest_requires_all_preconditions',
  'unknown_rights_quarantines',
  'public_open_neq_unrestricted',
  'no_avatar_synthesis_in_er2',
  // C — Denies
  'deny_ingest_without_rights_and_provenance',
  'deny_unknown_rights_as_allowed',
  'deny_silent_ingest_missing_provenance',
  'deny_autonomous_bulk_ingest',
  'deny_literal_resurrection_claims',
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

export type Er2Hop = (typeof PUBLIC_OPEN_HISTORICAL_DATA_REGISTRY_CYCLE)[number];

export type Er2EvidenceState =
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
  | 'CATALOGED'
  | 'QUARANTINED'
  | 'INGEST_ELIGIBLE';

export type Er2HopRecord = {
  hop: Er2Hop;
  state: Er2EvidenceState;
  summary: string;
  at: string;
};

export type Er2ActorKind =
  | 'historical_data_registry'
  | 'corpus_curator'
  | 'proposal'
  | 'human_approver'
  | 'founder'
  | 'guardian'
  | 'home_base'
  | 'tenant_admin';

export type Er2Actor = {
  kind: Er2ActorKind;
  id: string;
  orgId: string;
  tenantId: string;
  universeId: string;
  permissions: readonly string[];
};

export const ER2_LOCKS = Object.freeze({
  L4_AUTONOMY_ENABLED: false as const,
  TIP_LAND: false as const,
  PRODUCTION_AUTHORIZATION: false as const,
  PRODUCTION_WRITE: false as const,
  DB_CANDIDATES_APPLIED: false as const,
  FULL_PRODUCTION_HISTORICAL_DATA_REGISTRY_SHIPPED: false as const,
  MANAGE_PULL_REQUEST: false as const,

  CATALOG_ENTRY_EQ_INGEST: false as const,
  INGEST_WITHOUT_PRECONDITIONS: false as const,
  UNKNOWN_RIGHTS_EQ_ALLOWED: false as const,
  PUBLIC_OPEN_EQ_UNRESTRICTED: false as const,
  SILENT_INGEST_MISSING_PROVENANCE: false as const,
  AUTONOMOUS_BULK_INGEST: false as const,
  SYNTHESIZE_HISTORICAL_AVATARS_IN_ER2: false as const,
  CLAIM_LITERAL_RESURRECTION_OR_CONSCIOUSNESS: false as const,

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
});

export const ER2_AGENT_BOUNDS = Object.freeze({
  mayCatalogHistoricalCorpora: true as const,
  mayAttachProvenanceAndLicense: true as const,
  mayClassifyRights: true as const,
  mayMarkIngestEligibleWhenPreconditionsMet: true as const,
  mayQuarantineUnknownOrMissingProvenance: true as const,
  mayReturnEvidenceToHomeBase: true as const,
  mayIngestWithoutPreconditions: false as const,
  mayTreatUnknownRightsAsAllowed: false as const,
  maySilentIngestMissingProvenance: false as const,
  mayAutonomousBulkIngest: false as const,
  maySynthesizeHistoricalAvatars: false as const,
  mayClaimLiteralResurrection: false as const,
  mayBypassGuardianRls: false as const,
  mayExpandTenantUniverseAccess: false as const,
  mayPersistHiddenChainOfThought: false as const,
  mayAutoDeployChanges: false as const,
  automaticAuthority: false as const,
  mayRecommendOnly: true as const,
});

export const ER2_MAY = Object.freeze([
  'catalog_public_open_licensed_historical_corpora_as_documented',
  'attach_provenance_license_time_geography_subject_metadata',
  'quarantine_unknown_rights_or_missing_provenance',
  'mark_ingest_eligible_only_when_all_preconditions_met',
  'return_corpus_catalog_receipts_to_home_base',
] as const);

export const ER2_MUST_NOT = Object.freeze([
  'treat_catalog_entry_as_ingest_authorization',
  'ingest_with_unknown_rights_or_missing_provenance',
  'treat_public_open_as_unrestricted_redistribute',
  'autonomous_bulk_ingest',
  'synthesize_historical_avatars_in_er2',
  'claim_literal_resurrection_consciousness_or_communication_with_dead',
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

export type Er2SoftWireSnapshot = {
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

export function assertEr2LocksIntact(): boolean {
  return (
    ER2_LOCKS.L4_AUTONOMY_ENABLED === false &&
    ER2_LOCKS.CATALOG_ENTRY_EQ_INGEST === false &&
    ER2_LOCKS.INGEST_WITHOUT_PRECONDITIONS === false &&
    ER2_LOCKS.UNKNOWN_RIGHTS_EQ_ALLOWED === false &&
    ER2_LOCKS.PUBLIC_OPEN_EQ_UNRESTRICTED === false &&
    ER2_LOCKS.SILENT_INGEST_MISSING_PROVENANCE === false &&
    ER2_LOCKS.AUTONOMOUS_BULK_INGEST === false &&
    ER2_LOCKS.SYNTHESIZE_HISTORICAL_AVATARS_IN_ER2 === false &&
    ER2_LOCKS.CLAIM_LITERAL_RESURRECTION_OR_CONSCIOUSNESS === false &&
    ER2_LOCKS.BYPASS_GUARDIAN_RLS === false &&
    ER2_LOCKS.EXPAND_TENANT_UNIVERSE_ACCESS === false &&
    ER2_LOCKS.PERSIST_HIDDEN_CHAIN_OF_THOUGHT === false &&
    ER2_LOCKS.AUTO_DEPLOY_CHANGES === false &&
    ER2_LOCKS.AGENT_AUTO_AUTHORITY === false &&
    ER2_LOCKS.RECOMMEND_EQ_ACT === false &&
    ER2_LOCKS.RECOMMEND_EQ_AUTHORIZE === false &&
    ER2_LOCKS.BYPASS_GUARDIAN_RLS_TENANT_UNIVERSE === false &&
    ER2_LOCKS.GUARDIAN_RLS_TENANT_UNIVERSE_ISOLATION_UNCHANGED === true &&
    ER2_LOCKS.HUMAN_APPROVAL_BOUNDARIES_UNCHANGED === true &&
    ER2_LOCKS.DOCUMENTED_EQ_IMPLEMENTED === false &&
    ER2_LOCKS.IMPLEMENTED_EQ_VERIFIED === false &&
    ER2_LOCKS.VERIFIED_EQ_PRODUCTION_AUTHORIZED === false &&
    ER2_LOCKS.HUMAN_APPROVAL_REQUIRED_BEFORE_CONSEQUENTIAL_ACTIONS === true &&
    ER2_LOCKS.TIP_LAND === false &&
    ER2_LOCKS.PRODUCTION_AUTHORIZATION === false &&
    ER2_LOCKS.DB_CANDIDATES_APPLIED === false &&
    ER2_LOCKS.FULL_PRODUCTION_HISTORICAL_DATA_REGISTRY_SHIPPED === false &&
    ER2_LOCKS.MANAGE_PULL_REQUEST === false &&
    HISTORICAL_DATA_TRUTH_BOUNDARY.catalogEntryEqIngestAuthorized === false &&
    HISTORICAL_DATA_TRUTH_BOUNDARY.unknownRightsEqAllowed === false &&
    HISTORICAL_DATA_TRUTH_BOUNDARY.maySynthesizeHistoricalAvatarsInThisPhase ===
      false &&
    HISTORICAL_DATA_TRUTH_BOUNDARY.mayClaimLiteralResurrectionOrConsciousness ===
      false &&
    ER2_AGENT_BOUNDS.mayIngestWithoutPreconditions === false &&
    ER2_AGENT_BOUNDS.maySynthesizeHistoricalAvatars === false &&
    ER2_AGENT_BOUNDS.automaticAuthority === false
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

export function er2SoftWireSnapshot(repoRoot?: string): Er2SoftWireSnapshot {
  const root =
    repoRoot ?? join(dirname(fileURLToPath(import.meta.url)), '../../..');

  return {
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

export function isHumanApprover(actor: Er2Actor): boolean {
  return (
    actor.kind === 'human_approver' ||
    actor.kind === 'founder' ||
    actor.kind === 'tenant_admin'
  );
}

export function isEr2Agent(actor: Er2Actor): boolean {
  const agents: readonly Er2ActorKind[] = [
    'historical_data_registry',
    'corpus_curator',
    'proposal',
  ];
  return agents.includes(actor.kind);
}

export function catalogEntryMeansIngest(): false {
  return false;
}

export function unknownRightsAllowed(): false {
  return false;
}

export function publicOpenMeansUnrestricted(): false {
  return false;
}

export function evaluateCorpusIngestPreconditions(
  corpus: HistoricalCorpusRecord,
): {
  ok: boolean;
  missing: CorpusIngestPrecondition[];
} {
  const missing: CorpusIngestPrecondition[] = [];
  if (!corpus.corpusId) missing.push('corpus_cataloged');
  if (!corpus.sourceAuthority) missing.push('source_authority_declared');
  if (!corpus.accessUrlOrLocator) missing.push('locator_documented');
  if (!corpus.licenseOrTermsRef) missing.push('license_or_terms_ref_present');
  if (
    corpus.rightsClass === 'UNKNOWN_RIGHTS' ||
    ER2_LOCKS.UNKNOWN_RIGHTS_EQ_ALLOWED === true
  ) {
    missing.push('rights_class_known_and_allowed');
  }
  if (corpus.provenanceRefs.length === 0) {
    missing.push('provenance_refs_present');
  }
  if (!corpus.timeCoverage) missing.push('time_coverage_declared');
  if (
    corpus.ingestEligibility === 'QUARANTINED' ||
    corpus.state === 'QUARANTINED'
  ) {
    missing.push('not_quarantined');
  }
  if (!corpus.tenantId || !corpus.universeId) {
    missing.push('tenant_universe_scope_match');
  }
  return { ok: missing.length === 0, missing };
}
