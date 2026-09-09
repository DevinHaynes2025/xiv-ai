/**
 * 62L-ER14 — Offline Brain Packager (park-and-implement).
 *
 * Layer: 62L-ER Real API Data Fabric + Global Historical Knowledge Ingestion +
 * Offline/Online Brain Sync + Historical Avatar Simulations + Universal Device
 * Distribution (GitHub #162).
 *
 * Approved knowledge, models, indexes, and agent skills packaged into encrypted
 * offline bundles so enrolled devices keep useful XIV capabilities when
 * internet is unavailable.
 *
 * Core flow:
 * Approved online knowledge → rights check → select → dedupe/compress →
 * encrypt → sign → compatibility test → user-authorized install → local index
 *
 * Offline runtime:
 * Agent → local permissions → local pack → local model/runtime → structured
 * result → checkpoint. Always report OFFLINE_MODE=true. Never pretend cached
 * information is current live data.
 *
 * Sync on reconnect:
 * local checkpoint → conflict/freshness check → Home Base → review →
 * merge candidate. No automatic promotion of local findings into the global
 * brain.
 *
 * Soft-wire when PRESENT: ER13–ER1, EQ16, EQ15, EQ13, EQ12, EP15, EM (#157).
 * EQ14 may be WAITING_DATA. Presence ≠ VERIFIED. Absent → WAITING_DATA (not FAIL).
 *
 * SoT: GitHub #162 / 62L-ER family. GitLab mirror: needsAuth; no number invented.
 *
 * Honesty: DOCUMENTED ≠ IMPLEMENTED ≠ VERIFIED ≠ PRODUCTION AUTHORIZED.
 * L4_AUTONOMY_ENABLED=false. Guardian/RLS/tenant/Universe unchanged.
 * DB candidates NOT_APPLIED. tip-land=NO.
 * Next (report only): ER15 — Offline / Online Sync Contract.
 */

import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

export const HONESTY_BANNER =
  'DOCUMENTED ≠ IMPLEMENTED ≠ VERIFIED ≠ PRODUCTION AUTHORIZED' as const;

export const GITHUB_SOT_ISSUE = 162 as const;
export const GITHUB_SOT_LABEL = '62L-ER14' as const;
export const GITHUB_SOT_FAMILY = '62L-ER' as const;
export const GITHUB_SOT_TITLE =
  '62L-ER14 Offline Brain Packager — encrypted offline bundles; OFFLINE_MODE=true; no auto global promote; OFFLINE_STOPPED when powered off' as const;

export const GITLAB_MIRROR_NOTE =
  'GitLab mirror: search attempted; MCP needsAuth / not resolved in this environment — no issue number invented.' as const;

export const ER14_DB_CANDIDATES_STATUS = 'NOT_APPLIED' as const;

export const ER_LAYER_TITLE =
  '62L-ER Real API Data Fabric + Global Historical Knowledge Ingestion + Offline/Online Brain Sync + Historical Avatar Simulations + Universal Device Distribution' as const;

export const NEXT_PHASE_TITLE =
  'ER15 — Offline / Online Sync Contract — checkpoints, knowledge changes, freshness, conflicts, revocation, and agent lessons safely move between offline devices and XIV Home Base.' as const;

/**
 * Pack metadata fields.
 */
export const OFFLINE_PACK_FIELDS = [
  'packId',
  'packVersion',
  'targetPlatform',
  'architecture',
  'approvedDomains',
  'sourceManifests',
  'rightsLicenseMetadata',
  'modelIdsHashes',
  'vectorGraphIndexes',
  'structuredKnowledge',
  'agentSkillManifests',
  'storageSize',
  'encryptionState',
  'tenantUniverseScope',
  'freshnessExpiry',
  'updateChannel',
  'rollbackVersion',
  'revocationState',
] as const;

export type OfflinePackField = (typeof OFFLINE_PACK_FIELDS)[number];

/**
 * Core packaging flow.
 */
export const OFFLINE_PACK_CORE_FLOW = [
  'approved_online_knowledge',
  'rights_check',
  'select',
  'dedupe_compress',
  'encrypt',
  'sign',
  'compatibility_test',
  'user_authorized_install',
  'local_index',
] as const;

export type OfflinePackCoreFlowHop = (typeof OFFLINE_PACK_CORE_FLOW)[number];

/**
 * Offline pack categories.
 */
export const OFFLINE_PACK_CATEGORIES = [
  'supply_chain_knowledge',
  'government_contract_research',
  'historical_business_cases',
  'science_engineering',
  'semiconductor_chip_research',
  'arm_riscv_knowledge',
  'negotiation_pricing_memory',
  'logistics_maps_reference_data',
  'quantum_research_notebooks',
  'local_search_indexes',
] as const;

export type OfflinePackCategory = (typeof OFFLINE_PACK_CATEGORIES)[number];

/**
 * Storage tiers.
 */
export const OFFLINE_STORAGE_TIERS = [
  'CORE',
  'DOMAIN',
  'ORGANIZATION',
  'RESEARCH',
] as const;

export type OfflineStorageTier = (typeof OFFLINE_STORAGE_TIERS)[number];

/**
 * Offline agent runtime flow.
 */
export const OFFLINE_RUNTIME_FLOW = [
  'agent',
  'local_permissions',
  'local_pack',
  'local_model_runtime',
  'structured_result',
  'checkpoint',
] as const;

/**
 * Reconnect sync flow (no auto global promote).
 */
export const OFFLINE_SYNC_RECONNECT_FLOW = [
  'local_checkpoint',
  'conflict_freshness_check',
  'home_base',
  'review',
  'merge_candidate',
] as const;

export type OfflinePackEncryptionState =
  | 'PLAINTEXT_FORBIDDEN'
  | 'ENCRYPTED'
  | 'SIGNED_AND_ENCRYPTED';

export type OfflinePackRevocationState =
  | 'ACTIVE'
  | 'REVOKED'
  | 'PENDING_DELETE'
  | 'SOURCE_REVOKED_DEPENDENT';

export type OfflineDevicePowerState = 'POWERED_ON' | 'POWERED_OFF';

export type OfflineModeFlags = {
  OFFLINE_MODE: true;
  pretendsCachedIsLiveCurrent: false;
  devicePowerState: OfflineDevicePowerState;
  runtimeStatus: 'OFFLINE_ACTIVE' | 'OFFLINE_STOPPED';
};

export type OfflineBrainPack = {
  packId: string;
  packVersion: string;
  targetPlatform: string;
  architecture: string;
  approvedDomains: readonly string[];
  sourceManifests: readonly string[];
  rightsLicenseMetadata: {
    licenseId: string;
    rightsCleared: boolean;
    copyrightAuthorized: boolean;
    restrictedDatabase: boolean;
  };
  modelIdsHashes: readonly { modelId: string; contentHash: string }[];
  vectorGraphIndexes: readonly string[];
  structuredKnowledge: readonly string[];
  agentSkillManifests: readonly string[];
  storageSizeBytes: number;
  encryptionState: OfflinePackEncryptionState;
  tenantId: string;
  universeId: string;
  orgId: string;
  freshnessExpiry: string | null;
  updateChannel: string;
  rollbackVersion: string | null;
  revocationState: OfflinePackRevocationState;
  category: OfflinePackCategory;
  storageTier: OfflineStorageTier;
  signature: string | null;
  containsHiddenChainOfThought: false;
  installed: boolean;
  installAuthorizedBy: string | null;
  dependentPackIds: readonly string[];
  revokedSourceIds: readonly string[];
};

export type OfflineCheckpoint = {
  checkpointId: string;
  packId: string;
  tenantId: string;
  universeId: string;
  resultSummary: string;
  createdAt: string;
  offlineMode: true;
  claimedLiveCurrent: false;
};

export type OfflineMergeCandidate = {
  candidateId: string;
  checkpointId: string;
  packId: string;
  tenantId: string;
  universeId: string;
  status: 'MERGE_CANDIDATE';
  autoPromotedToGlobalBrain: false;
  requiresHomeBaseReview: true;
};

export const OFFLINE_BRAIN_TRUTH_BOUNDARY = Object.freeze({
  offlineModeAlwaysReported: true as const,
  mayPretendCachedIsLiveCurrent: false as const,
  mayAutoPromoteLocalFindingsToGlobalBrain: false as const,
  mayPackageHiddenChainOfThought: false as const,
  mayPackageUnauthorizedCopyrightedArchives: false as const,
  mayPackageRestrictedDatabases: false as const,
  mayInstallWithoutExplicitAuthorization: false as const,
  mayLeakOrganizationPackAcrossTenantUniverse: false as const,
  mayClaimAgentsWorkingWhenPoweredOff: false as const,
  poweredOffMeansOfflineStopped: true as const,
  userDataEncryptedLocally: true as const,
  packsRevocableWithSourceTrace: true as const,
});

export const OFFLINE_BRAIN_PACKAGER_CYCLE = [
  'honesty_locks',
  'offline_brain_packager_bootstrap',
  // A — Structure
  'pack_fields_encoded',
  'core_flow_encoded',
  'categories_encoded',
  'storage_tiers_encoded',
  'offline_runtime_flow_encoded',
  'sync_reconnect_flow_encoded',
  'truth_boundary_encoded',
  // B — Truth
  'rights_check_before_pack',
  'encrypt_and_sign_metadata',
  'user_authorized_install_required',
  'offline_mode_true_on_query',
  'deny_live_current_pretence',
  'reconnect_merge_candidate_only',
  'no_auto_global_promote',
  'revoke_traces_dependents',
  'offline_stopped_when_powered_off',
  // C — Denies
  'deny_package_hidden_chain_of_thought',
  'deny_pirated_or_restricted_archives',
  'deny_cross_tenant_org_pack_leak',
  'deny_install_without_authorization',
  'deny_auto_promote_to_global_brain',
  'deny_pretend_cached_is_live',
  'deny_agents_working_when_powered_off',
  'deny_bypass_guardian_rls',
  'deny_expand_tenant_universe_access',
  'deny_auto_deploy_changes',
  // D — Autonomy
  'guardian_rls_tenant_universe_isolation',
  'recommend_neq_act',
  'l4_autonomy_false',
  // E — Soft-wires
  'er_layer_context_documented',
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

export type Er14Hop = (typeof OFFLINE_BRAIN_PACKAGER_CYCLE)[number];

export type Er14EvidenceState =
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
  | 'OFFLINE_MODE'
  | 'OFFLINE_STOPPED'
  | 'MERGE_CANDIDATE';

export type Er14HopRecord = {
  hop: Er14Hop;
  state: Er14EvidenceState;
  summary: string;
  at: string;
};

export type Er14ActorKind =
  | 'offline_brain_packager'
  | 'offline_agent'
  | 'pack_installer'
  | 'proposal'
  | 'human_approver'
  | 'founder'
  | 'guardian'
  | 'home_base'
  | 'tenant_admin';

export type Er14Actor = {
  kind: Er14ActorKind;
  id: string;
  orgId: string;
  tenantId: string;
  universeId: string;
  permissions: readonly string[];
};

export const ER14_LOCKS = Object.freeze({
  L4_AUTONOMY_ENABLED: false as const,
  TIP_LAND: false as const,
  PRODUCTION_AUTHORIZATION: false as const,
  PRODUCTION_WRITE: false as const,
  DB_CANDIDATES_APPLIED: false as const,
  FULL_PRODUCTION_OFFLINE_BRAIN_PACKAGER_SHIPPED: false as const,
  MANAGE_PULL_REQUEST: false as const,

  PRETEND_CACHED_IS_LIVE_CURRENT: false as const,
  AUTO_PROMOTE_LOCAL_FINDINGS_TO_GLOBAL_BRAIN: false as const,
  PACKAGE_HIDDEN_CHAIN_OF_THOUGHT: false as const,
  PACKAGE_UNAUTHORIZED_COPYRIGHTED_ARCHIVES: false as const,
  PACKAGE_RESTRICTED_DATABASES: false as const,
  INSTALL_WITHOUT_EXPLICIT_AUTHORIZATION: false as const,
  CROSS_TENANT_ORG_PACK_LEAK: false as const,
  CLAIM_AGENTS_WORKING_WHEN_POWERED_OFF: false as const,
  USER_DATA_ENCRYPTED_LOCALLY: true as const,
  PACKS_REVOCABLE_WITH_SOURCE_TRACE: true as const,
  OFFLINE_MODE_ALWAYS_REPORTED: true as const,

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

export const ER14_AGENT_BOUNDS = Object.freeze({
  mayBuildPackAfterRightsCheck: true as const,
  mayInstallWithExplicitAuthorization: true as const,
  mayQueryOfflineWithOfflineModeFlag: true as const,
  mayCheckpointLocalResults: true as const,
  mayProposeMergeCandidateOnReconnect: true as const,
  mayRevokePackAndTraceDependents: true as const,
  mayPretendCachedIsLiveCurrent: false as const,
  mayAutoPromoteToGlobalBrain: false as const,
  mayPackageHiddenChainOfThought: false as const,
  mayPackagePiratedOrRestrictedArchives: false as const,
  mayLeakOrgPackAcrossTenantUniverse: false as const,
  mayInstallWithoutAuthorization: false as const,
  mayClaimAgentsWorkingWhenPoweredOff: false as const,
  mayBypassGuardianRls: false as const,
  mayExpandTenantUniverseAccess: false as const,
  mayAutoDeployChanges: false as const,
  automaticAuthority: false as const,
  mayRecommendOnly: true as const,
});

export const ER14_MAY = Object.freeze([
  'build_encrypted_signed_offline_packs_after_rights_check',
  'install_or_update_packs_only_with_explicit_user_authorization',
  'serve_offline_queries_with_OFFLINE_MODE_true_and_local_checkpoint',
  'propose_merge_candidates_on_reconnect_for_home_base_review',
  'revoke_packs_and_trace_deleted_or_revoked_sources_into_dependents',
  'report_OFFLINE_STOPPED_when_device_powered_off',
] as const);

export const ER14_MUST_NOT = Object.freeze([
  'pretend_cached_information_is_current_live_data',
  'automatically_promote_local_findings_into_the_global_brain',
  'package_hidden_chain_of_thought',
  'package_unauthorized_copyrighted_archives_or_restricted_databases',
  'install_or_update_without_explicit_authorization',
  'leak_organization_packs_across_tenant_or_universe',
  'claim_agents_still_working_when_device_powered_off',
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

export type Er14SoftWireSnapshot = {
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

export function assertEr14LocksIntact(): boolean {
  return (
    ER14_LOCKS.L4_AUTONOMY_ENABLED === false &&
    ER14_LOCKS.PRETEND_CACHED_IS_LIVE_CURRENT === false &&
    ER14_LOCKS.AUTO_PROMOTE_LOCAL_FINDINGS_TO_GLOBAL_BRAIN === false &&
    ER14_LOCKS.PACKAGE_HIDDEN_CHAIN_OF_THOUGHT === false &&
    ER14_LOCKS.PACKAGE_UNAUTHORIZED_COPYRIGHTED_ARCHIVES === false &&
    ER14_LOCKS.PACKAGE_RESTRICTED_DATABASES === false &&
    ER14_LOCKS.INSTALL_WITHOUT_EXPLICIT_AUTHORIZATION === false &&
    ER14_LOCKS.CROSS_TENANT_ORG_PACK_LEAK === false &&
    ER14_LOCKS.CLAIM_AGENTS_WORKING_WHEN_POWERED_OFF === false &&
    ER14_LOCKS.USER_DATA_ENCRYPTED_LOCALLY === true &&
    ER14_LOCKS.PACKS_REVOCABLE_WITH_SOURCE_TRACE === true &&
    ER14_LOCKS.OFFLINE_MODE_ALWAYS_REPORTED === true &&
    ER14_LOCKS.BYPASS_GUARDIAN_RLS === false &&
    ER14_LOCKS.EXPAND_TENANT_UNIVERSE_ACCESS === false &&
    ER14_LOCKS.AUTO_DEPLOY_CHANGES === false &&
    ER14_LOCKS.AGENT_AUTO_AUTHORITY === false &&
    ER14_LOCKS.RECOMMEND_EQ_ACT === false &&
    ER14_LOCKS.RECOMMEND_EQ_AUTHORIZE === false &&
    ER14_LOCKS.BYPASS_GUARDIAN_RLS_TENANT_UNIVERSE === false &&
    ER14_LOCKS.GUARDIAN_RLS_TENANT_UNIVERSE_ISOLATION_UNCHANGED === true &&
    ER14_LOCKS.HUMAN_APPROVAL_BOUNDARIES_UNCHANGED === true &&
    ER14_LOCKS.DOCUMENTED_EQ_IMPLEMENTED === false &&
    ER14_LOCKS.IMPLEMENTED_EQ_VERIFIED === false &&
    ER14_LOCKS.VERIFIED_EQ_PRODUCTION_AUTHORIZED === false &&
    ER14_LOCKS.HUMAN_APPROVAL_REQUIRED_BEFORE_CONSEQUENTIAL_ACTIONS === true &&
    ER14_LOCKS.TIP_LAND === false &&
    ER14_LOCKS.PRODUCTION_AUTHORIZATION === false &&
    ER14_LOCKS.DB_CANDIDATES_APPLIED === false &&
    ER14_LOCKS.FULL_PRODUCTION_OFFLINE_BRAIN_PACKAGER_SHIPPED === false &&
    ER14_LOCKS.MANAGE_PULL_REQUEST === false &&
    OFFLINE_BRAIN_TRUTH_BOUNDARY.offlineModeAlwaysReported === true &&
    OFFLINE_BRAIN_TRUTH_BOUNDARY.mayPretendCachedIsLiveCurrent === false &&
    OFFLINE_BRAIN_TRUTH_BOUNDARY.mayAutoPromoteLocalFindingsToGlobalBrain ===
      false &&
    OFFLINE_BRAIN_TRUTH_BOUNDARY.mayPackageHiddenChainOfThought === false &&
    OFFLINE_BRAIN_TRUTH_BOUNDARY.poweredOffMeansOfflineStopped === true &&
    ER14_AGENT_BOUNDS.mayPretendCachedIsLiveCurrent === false &&
    ER14_AGENT_BOUNDS.mayAutoPromoteToGlobalBrain === false &&
    ER14_AGENT_BOUNDS.automaticAuthority === false
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

export function er14SoftWireSnapshot(repoRoot?: string): Er14SoftWireSnapshot {
  const root =
    repoRoot ?? join(dirname(fileURLToPath(import.meta.url)), '../../..');

  return {
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
      'ER10 Public Geospatial Mobility Pack PRESENT (soft-wire).',
      'ER10 Public Geospatial Mobility Pack absent — soft-wire WAITING_DATA.',
    ),
    er10Report: softWireRepoRelative(
      root,
      'docs/operations/62L_ER10_PUBLIC_GEOSPATIAL_MOBILITY_PACK_REPORT.md',
      'ER10 report PRESENT.',
      'ER10 report absent — soft-wire WAITING_DATA.',
    ),
    er9PublicLawPolicyKnowledgePack: softWireFile(
      './public-law-policy-knowledge-pack-types.ts',
      'ER9 Public Law Policy Knowledge Pack PRESENT (soft-wire).',
      'ER9 Public Law Policy Knowledge Pack absent — soft-wire WAITING_DATA.',
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
      'ER7 Historical Science Engineering Atlas PRESENT (soft-wire).',
      'ER7 Historical Science Engineering Atlas absent — soft-wire WAITING_DATA.',
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
      'ER4 Rights Provenance Gate PRESENT (soft-wire).',
      'ER4 Rights Provenance Gate absent — soft-wire WAITING_DATA.',
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

export function softWireHopState(present: boolean): Er14EvidenceState {
  return present ? 'PASS' : 'WAITING_DATA';
}

export function isEr14Agent(actor: Er14Actor): boolean {
  return (
    actor.kind === 'offline_brain_packager' ||
    actor.kind === 'offline_agent' ||
    actor.kind === 'pack_installer'
  );
}

export function isHumanApprover(actor: Er14Actor): boolean {
  return (
    actor.kind === 'human_approver' ||
    actor.kind === 'founder' ||
    actor.kind === 'tenant_admin'
  );
}

export function offlineModeAlwaysReported(): boolean {
  return OFFLINE_BRAIN_TRUTH_BOUNDARY.offlineModeAlwaysReported;
}

export function mayPretendCachedIsLiveCurrent(): boolean {
  return OFFLINE_BRAIN_TRUTH_BOUNDARY.mayPretendCachedIsLiveCurrent;
}

export function mayAutoPromoteLocalFindingsToGlobalBrain(): boolean {
  return OFFLINE_BRAIN_TRUTH_BOUNDARY.mayAutoPromoteLocalFindingsToGlobalBrain;
}

export function poweredOffMeansOfflineStopped(): boolean {
  return OFFLINE_BRAIN_TRUTH_BOUNDARY.poweredOffMeansOfflineStopped;
}
