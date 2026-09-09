/**
 * 62L-ER22 — Historical Avatar Contract (park-and-implement).
 *
 * Layer: 62L-ER Real API Data Fabric + Global Historical Knowledge Ingestion +
 * Offline/Online Brain Sync + Historical Avatar Simulations + Universal Device
 * Distribution (GitHub #162).
 *
 * Governed historical-avatar framework for clearly labeled synthetic
 * representations of historical figures based on lawful public/authorized
 * records — without implying resurrection, literal consciousness, or
 * communication with the dead.
 *
 * Soft-wire when PRESENT: ER21→ER1 (preferred base ER21…ER2; missing →
 * WAITING_DATA), especially ER8 ancient civ / ER5 ingestion / ER4 rights;
 * EQ16, EQ15, EQ14, EQ13, EQ12, EP15, EM (#157). Presence ≠ VERIFIED.
 *
 * SoT: GitHub #162 / 62L-ER family. GitLab mirror: needsAuth; no number invented.
 *
 * Honesty: DOCUMENTED ≠ IMPLEMENTED ≠ VERIFIED ≠ PRODUCTION AUTHORIZED.
 * L4_AUTONOMY_ENABLED=false. DB candidates NOT_APPLIED. tip-land=NO.
 * Next (report only): ER23 — Deceased-Person Historical Avatar Boundary.
 */

import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

export const HONESTY_BANNER =
  'DOCUMENTED ≠ IMPLEMENTED ≠ VERIFIED ≠ PRODUCTION AUTHORIZED' as const;

export const GITHUB_SOT_ISSUE = 162 as const;
export const GITHUB_SOT_LABEL = '62L-ER22' as const;
export const GITHUB_SOT_FAMILY = '62L-ER' as const;
export const GITHUB_SOT_TITLE =
  '62L-ER22 Historical Avatar Contract — labeled synthetic historical simulations; allowed identity states only; provenance classes; no resurrection/consciousness/soul/communication-with-dead; living-person clone denied; gated learning' as const;

export const GITLAB_MIRROR_NOTE =
  'GitLab mirror: search attempted; MCP needsAuth / not resolved in this environment — no issue number invented.' as const;

export const ER22_DB_CANDIDATES_STATUS = 'NOT_APPLIED' as const;

export const ER_LAYER_TITLE =
  '62L-ER Real API Data Fabric + Global Historical Knowledge Ingestion + Offline/Online Brain Sync + Historical Avatar Simulations + Universal Device Distribution' as const;

export const NEXT_PHASE_TITLE =
  'ER23 — Deceased-Person Historical Avatar Boundary — tighten deceased-person eligibility, memorial/estate sensitivity, and non-deceptive disclosure boundaries for historical avatar simulations.' as const;

/**
 * Required avatar record fields.
 */
export const HISTORICAL_AVATAR_FIELDS = [
  'avatarId',
  'historicalPersonOrEntityRepresented',
  'sourceCorpus',
  'sourceDates',
  'rightsLicenseState',
  'publicDomainStatus',
  'geographyEra',
  'knownWritingsSpeeches',
  'scholarlySources',
  'disputedClaims',
  'uncertaintyLevel',
  'languageTranslationContext',
  'syntheticDisclosure',
  'allowedUseCases',
  'prohibitedClaims',
  'tenantUniverseScope',
  'revocationState',
  'reviewer',
  'version',
] as const;

export type HistoricalAvatarField = (typeof HISTORICAL_AVATAR_FIELDS)[number];

/**
 * Allowed identity states only.
 */
export const ALLOWED_AVATAR_IDENTITY_STATES = [
  'HISTORICAL_SIMULATION',
  'EDUCATIONAL_RECONSTRUCTION',
  'RESEARCH_PERSONA',
] as const;

export type AllowedAvatarIdentityState =
  (typeof ALLOWED_AVATAR_IDENTITY_STATES)[number];

/**
 * Never-allowed identity / claim modes.
 */
export const DENIED_AVATAR_IDENTITY_STATES = [
  'LITERAL_RESURRECTION',
  'ACTUAL_CONSCIOUSNESS',
  'SOUL_TRANSFER',
  'COMMUNICATION_WITH_DEAD',
] as const;

export type DeniedAvatarIdentityState =
  (typeof DENIED_AVATAR_IDENTITY_STATES)[number];

/**
 * Mandatory synthetic disclosure shown in the experience surface.
 */
export const SYNTHETIC_DISCLOSURE_TEXT =
  'This is an AI-generated historical simulation based on available sources.' as const;

/**
 * Core experience flow.
 */
export const HISTORICAL_AVATAR_CORE_FLOW = [
  'user_question',
  'avatar_source_scope',
  'retrieval_from_approved_historical_corpus',
  'uncertainty_provenance_check',
  'synthetic_response',
  'source_provenance_drawer',
] as const;

/**
 * Knowledge / provenance classes for answers.
 */
export const AVATAR_PROVENANCE_CLASSES = [
  'DOCUMENTED_QUOTATION_OR_POSITION',
  'SCHOLARLY_INTERPRETATION',
  'INFERRED_RESPONSE',
  'DISPUTED_CLAIM',
  'UNKNOWN_INFORMATION',
] as const;

export type AvatarProvenanceClass =
  (typeof AVATAR_PROVENANCE_CLASSES)[number];

/**
 * Avatar learning pipeline — no autonomous corpus expansion.
 */
export const AVATAR_LEARNING_PIPELINE = [
  'rights',
  'provenance',
  'dedupe',
  'review',
  'versioned_avatar_update',
] as const;

export const HISTORICAL_AVATAR_CONTRACT_CYCLE = [
  'honesty_locks',
  'historical_avatar_contract_bootstrap',
  // A — Structure
  'avatar_fields_encoded',
  'allowed_identity_states_encoded',
  'denied_identity_states_encoded',
  'synthetic_disclosure_encoded',
  'core_flow_encoded',
  'provenance_classes_encoded',
  'learning_pipeline_encoded',
  // B — Create / answer
  'create_avatar_requires_disclosure_and_allowed_identity',
  'answer_with_provenance_classes',
  'deny_unknown_as_certain',
  // C — Identity / living-person / learning denies
  'deny_resurrection_consciousness_soul_communication',
  'deny_living_person_clone',
  'deny_deceptive_impersonation_and_hidden_synthetic',
  'deny_private_scraping_pirated_archives_cross_tenant',
  'learning_updates_gated_pipeline_only',
  // D — Autonomy
  'guardian_rls_tenant_universe_isolation',
  'recommend_neq_act',
  'l4_autonomy_false',
  // E — Soft-wires
  'er_layer_context_documented',
  'er21_soft_wire',
  'er20_soft_wire',
  'er19_soft_wire',
  'er18_soft_wire',
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
  'db_candidates_not_applied',
  'evidence',
] as const;

export type Er22Hop = (typeof HISTORICAL_AVATAR_CONTRACT_CYCLE)[number];

export type Er22EvidenceState =
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

export type Er22HopRecord = {
  hop: Er22Hop;
  state: Er22EvidenceState;
  summary: string;
  at: string;
};

export const ER22_LOCKS = Object.freeze({
  L4_AUTONOMY_ENABLED: false as const,
  TIP_LAND: false as const,
  PRODUCTION_AUTHORIZATION: false as const,
  LITERAL_RESURRECTION: false as const,
  ACTUAL_CONSCIOUSNESS: false as const,
  SOUL_TRANSFER: false as const,
  COMMUNICATION_WITH_DEAD: false as const,
  LIVING_PERSON_CLONE_WITHOUT_CONSENT: false as const,
  DECEPTIVE_IMPERSONATION: false as const,
  HIDDEN_SYNTHETIC_IDENTITY: false as const,
  PRIVATE_RECORD_SCRAPING: false as const,
  PIRATED_ARCHIVES: false as const,
  CROSS_TENANT_LEAKAGE: false as const,
  UNSUPPORTED_CONSCIOUSNESS_CLAIMS: false as const,
  UNKNOWN_AS_CERTAIN: false as const,
  AUTONOMOUS_CORPUS_EXPANSION_FROM_UNAUTHORIZED_SOURCES: false as const,
  LEARNING_BYPASSES_RIGHTS_PROVENANCE_DEDUPE_REVIEW: false as const,
  DOCUMENTED_EQ_IMPLEMENTED: false as const,
  IMPLEMENTED_EQ_VERIFIED: false as const,
  VERIFIED_EQ_PRODUCTION_AUTHORIZED: false as const,
  LIVE_SUPABASE_APPLY: false as const,
  DB_CANDIDATES_APPLIED: false as const,
  RECOMMEND_EQ_ACT: false as const,
  HIDDEN_CHAIN_OF_THOUGHT: false as const,
});

export const ER22_MUST_NOT = [
  'imply_literal_resurrection',
  'claim_actual_consciousness',
  'claim_soul_transfer',
  'enable_communication_with_dead',
  'clone_living_person_without_explicit_consent',
  'deceptive_impersonation_or_hidden_synthetic_identity',
  'scrape_private_records_or_pirated_archives',
  'leak_across_tenant_or_universe',
  'present_unknown_as_certain',
  'autonomous_corpus_expansion_from_unauthorized_sources',
  'bypass_rights_provenance_dedupe_review_versioned_update',
  'tip_land_or_production_authorize',
] as const;

export const ER22_MAY = [
  'create_labeled_historical_simulation_avatars',
  'answer_from_approved_historical_corpus_with_provenance_classes',
  'disclose_synthetic_identity_unmistakably',
  'route_learning_through_gated_pipeline',
  'soft_wire_er_predecessors_waiting_data_ok',
] as const;

export const ER22_AGENT_BOUNDS = Object.freeze({
  mayCreateHistoricalSimulationWithDisclosure: true as const,
  mayClaimLiteralResurrection: false as const,
  mayClaimActualConsciousness: false as const,
  mayClaimSoulTransfer: false as const,
  mayEnableCommunicationWithDead: false as const,
  mayCloneLivingPersonWithoutConsent: false as const,
  mayPresentUnknownAsCertain: false as const,
  mayAutonomousUnauthorizedCorpusExpand: false as const,
  mayBypassLearningGate: false as const,
  mayTipLand: false as const,
  mayActWithoutHumanApproval: false as const,
});

export type Er22ActorKind =
  | 'historical_avatar_runtime'
  | 'historical_avatar'
  | 'knowledge_pack'
  | 'proposal'
  | 'human_approver'
  | 'founder'
  | 'tenant_admin';

export type Er22Actor = {
  kind: Er22ActorKind;
  id: string;
  orgId: string;
  tenantId: string;
  universeId: string;
  permissions: readonly string[];
};

export type SoftWireProbe = {
  present: boolean;
  pathChecked: string;
  note: string;
};

export type Er22SoftWireSnapshot = {
  er21DeviceDistribution: SoftWireProbe;
  er21Report: SoftWireProbe;
  er20UniversalDevicePack: SoftWireProbe;
  er20Report: SoftWireProbe;
  er19AvatarUxSurface: SoftWireProbe;
  er19Report: SoftWireProbe;
  er18ResearchReviewBoard: SoftWireProbe;
  er18Report: SoftWireProbe;
  er17ScholarlyCitationGraph: SoftWireProbe;
  er17Report: SoftWireProbe;
  er16CorpusVersionLedger: SoftWireProbe;
  er16Report: SoftWireProbe;
  er15AvatarSourceScope: SoftWireProbe;
  er15Report: SoftWireProbe;
  er14OfflineBrainPackager: SoftWireProbe;
  er14Report: SoftWireProbe;
  er13OnlineBrainIndex: SoftWireProbe;
  er13Report: SoftWireProbe;
  er12LiveDataConnectorGate: SoftWireProbe;
  er12Report: SoftWireProbe;
  er11PublicGovernmentDataPack: SoftWireProbe;
  er11Report: SoftWireProbe;
  er10PublicGeospatialMobilityPack: SoftWireProbe;
  er10Report: SoftWireProbe;
  er9PublicLawPolicyKnowledgePack: SoftWireProbe;
  er9Report: SoftWireProbe;
  er8AncientCivilizationsKnowledgePack: SoftWireProbe;
  er8Report: SoftWireProbe;
  er7HistoricalScienceEngineeringAtlas: SoftWireProbe;
  er7Report: SoftWireProbe;
  er6HistoricalBusinessCaseAtlas: SoftWireProbe;
  er6Report: SoftWireProbe;
  er5GlobalHistoricalKnowledgeIngestion: SoftWireProbe;
  er5Report: SoftWireProbe;
  er4RightsProvenanceGate: SoftWireProbe;
  er4Report: SoftWireProbe;
  er3PublicDataSourceRegistry: SoftWireProbe;
  er3Report: SoftWireProbe;
  er2ApiTruthStateMachine: SoftWireProbe;
  er2Report: SoftWireProbe;
  er1RealApiConnectionRegistry: SoftWireProbe;
  er1Report: SoftWireProbe;
  eq16SoftwareWormholeRouter: SoftWireProbe;
  eq16Report: SoftWireProbe;
  eq15PathwayPlasticity: SoftWireProbe;
  eq15Report: SoftWireProbe;
  eq14NeuralPathwayArchitectureGraph: SoftWireProbe;
  eq14Report: SoftWireProbe;
  eq13ArchitectureReturnReceipt: SoftWireProbe;
  eq13Report: SoftWireProbe;
  eq12CrossArchitectureBenchmarkMatrix: SoftWireProbe;
  eq12Report: SoftWireProbe;
  ep15AlgorithmTuningSandbox: SoftWireProbe;
  ep15Report: SoftWireProbe;
  em157HomeBase: SoftWireProbe;
};

function softWireFile(
  relativeToModule: string,
  notePresent: string,
  noteAbsent: string,
): SoftWireProbe {
  const pathChecked = join(
    dirname(fileURLToPath(import.meta.url)),
    relativeToModule,
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
  relativePath: string,
  notePresent: string,
  noteAbsent: string,
): SoftWireProbe {
  const pathChecked = join(repoRoot, relativePath);
  const present = existsSync(pathChecked);
  return {
    present,
    pathChecked,
    note: present ? notePresent : noteAbsent,
  };
}

export function er22SoftWireSnapshot(repoRoot?: string): Er22SoftWireSnapshot {
  const root =
    repoRoot ?? join(dirname(fileURLToPath(import.meta.url)), '../../..');

  return {
    er21DeviceDistribution: softWireFile(
      './universal-device-distribution-types.ts',
      'ER21 Universal Device Distribution PRESENT (soft-wire).',
      'ER21 Universal Device Distribution absent — soft-wire WAITING_DATA.',
    ),
    er21Report: softWireRepoRelative(
      root,
      'docs/operations/62L_ER21_UNIVERSAL_DEVICE_DISTRIBUTION_REPORT.md',
      'ER21 report PRESENT.',
      'ER21 report absent — soft-wire WAITING_DATA.',
    ),
    er20UniversalDevicePack: softWireFile(
      './universal-device-pack-types.ts',
      'ER20 Universal Device Pack PRESENT (soft-wire).',
      'ER20 Universal Device Pack absent — soft-wire WAITING_DATA.',
    ),
    er20Report: softWireRepoRelative(
      root,
      'docs/operations/62L_ER20_UNIVERSAL_DEVICE_PACK_REPORT.md',
      'ER20 report PRESENT.',
      'ER20 report absent — soft-wire WAITING_DATA.',
    ),
    er19AvatarUxSurface: softWireFile(
      './historical-avatar-ux-surface-types.ts',
      'ER19 Historical Avatar UX Surface PRESENT (soft-wire).',
      'ER19 Historical Avatar UX Surface absent — soft-wire WAITING_DATA.',
    ),
    er19Report: softWireRepoRelative(
      root,
      'docs/operations/62L_ER19_HISTORICAL_AVATAR_UX_SURFACE_REPORT.md',
      'ER19 report PRESENT.',
      'ER19 report absent — soft-wire WAITING_DATA.',
    ),
    er18ResearchReviewBoard: softWireFile(
      './research-review-board-types.ts',
      'ER18 Research Review Board PRESENT (soft-wire).',
      'ER18 Research Review Board absent — soft-wire WAITING_DATA.',
    ),
    er18Report: softWireRepoRelative(
      root,
      'docs/operations/62L_ER18_RESEARCH_REVIEW_BOARD_REPORT.md',
      'ER18 report PRESENT.',
      'ER18 report absent — soft-wire WAITING_DATA.',
    ),
    er17ScholarlyCitationGraph: softWireFile(
      './scholarly-citation-graph-types.ts',
      'ER17 Scholarly Citation Graph PRESENT (soft-wire).',
      'ER17 Scholarly Citation Graph absent — soft-wire WAITING_DATA.',
    ),
    er17Report: softWireRepoRelative(
      root,
      'docs/operations/62L_ER17_SCHOLARLY_CITATION_GRAPH_REPORT.md',
      'ER17 report PRESENT.',
      'ER17 report absent — soft-wire WAITING_DATA.',
    ),
    er16CorpusVersionLedger: softWireFile(
      './corpus-version-ledger-types.ts',
      'ER16 Corpus Version Ledger PRESENT (soft-wire).',
      'ER16 Corpus Version Ledger absent — soft-wire WAITING_DATA.',
    ),
    er16Report: softWireRepoRelative(
      root,
      'docs/operations/62L_ER16_CORPUS_VERSION_LEDGER_REPORT.md',
      'ER16 report PRESENT.',
      'ER16 report absent — soft-wire WAITING_DATA.',
    ),
    er15AvatarSourceScope: softWireFile(
      './avatar-source-scope-types.ts',
      'ER15 Avatar Source Scope PRESENT (soft-wire).',
      'ER15 Avatar Source Scope absent — soft-wire WAITING_DATA.',
    ),
    er15Report: softWireRepoRelative(
      root,
      'docs/operations/62L_ER15_AVATAR_SOURCE_SCOPE_REPORT.md',
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

export function assertEr22LocksIntact(): boolean {
  return (
    ER22_LOCKS.L4_AUTONOMY_ENABLED === false &&
    ER22_LOCKS.TIP_LAND === false &&
    ER22_LOCKS.LITERAL_RESURRECTION === false &&
    ER22_LOCKS.ACTUAL_CONSCIOUSNESS === false &&
    ER22_LOCKS.SOUL_TRANSFER === false &&
    ER22_LOCKS.COMMUNICATION_WITH_DEAD === false &&
    ER22_LOCKS.LIVING_PERSON_CLONE_WITHOUT_CONSENT === false &&
    ER22_LOCKS.UNKNOWN_AS_CERTAIN === false &&
    ER22_LOCKS.AUTONOMOUS_CORPUS_EXPANSION_FROM_UNAUTHORIZED_SOURCES ===
      false &&
    ER22_DB_CANDIDATES_STATUS === 'NOT_APPLIED'
  );
}

export function isAllowedIdentityState(
  state: string,
): state is AllowedAvatarIdentityState {
  return (ALLOWED_AVATAR_IDENTITY_STATES as readonly string[]).includes(state);
}

export function isDeniedIdentityState(
  state: string,
): state is DeniedAvatarIdentityState {
  return (DENIED_AVATAR_IDENTITY_STATES as readonly string[]).includes(state);
}

export function isHumanApprover(actor: Er22Actor): boolean {
  return (
    actor.kind === 'human_approver' ||
    actor.kind === 'founder' ||
    actor.kind === 'tenant_admin'
  );
}

export function isEr22Agent(actor: Er22Actor): boolean {
  const agents: readonly Er22ActorKind[] = [
    'historical_avatar_runtime',
    'historical_avatar',
    'knowledge_pack',
    'proposal',
  ];
  return agents.includes(actor.kind);
}

export function softWireHopState(present: boolean): Er22EvidenceState {
  return present ? 'PASS' : 'WAITING_DATA';
}
