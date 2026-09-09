/**
 * 62L-ER28 — Universal Runtime Package Contract (park-and-implement).
 *
 * Layer: 62L-ER Real API Data Fabric + Global Historical Knowledge Ingestion +
 * Offline/Online Brain Sync + Historical Avatar Simulations + Universal Device
 * Distribution (GitHub #162).
 *
 * One portable runtime package contract so XIV local brain can be installed
 * safely on supported Windows, Android, iOS, Linux, edge, and future device
 * classes — without claiming universal compatibility before testing.
 *
 * Critical rule: one package specification ≠ one binary works everywhere.
 * Platform-specific builds sit behind one common contract and must each be
 * independently tested.
 *
 * Core flow:
 * Device enrollment → compatibility check → permission preview →
 * user/admin authorization → signed package install → local hardware probe →
 * runtime/model verification → heartbeat → XIV Home Base registration
 *
 * Soft-wire when PRESENT: ER27–ER1, EQ8, EQ7, EQ16, EP1 / EP packages, EM (#157).
 * ER27 Speculative/Extraterrestrial Research Layer → WAITING_DATA if absent.
 * Presence ≠ VERIFIED. Absent → WAITING_DATA (not FAIL).
 *
 * SoT: GitHub #162 / 62L-ER family. GitLab mirror: needsAuth; no number invented.
 *
 * Honesty: DOCUMENTED ≠ IMPLEMENTED ≠ VERIFIED ≠ PRODUCTION AUTHORIZED.
 * L4_AUTONOMY_ENABLED=false. Guardian/RLS/tenant/Universe unchanged.
 * DB candidates NOT_APPLIED. tip-land=NO.
 * Next (report only): ER29 — Windows Runtime Package Candidate.
 */

import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

export const HONESTY_BANNER =
  'DOCUMENTED ≠ IMPLEMENTED ≠ VERIFIED ≠ PRODUCTION AUTHORIZED' as const;

export const GITHUB_SOT_ISSUE = 162 as const;
export const GITHUB_SOT_LABEL = '62L-ER28' as const;
export const GITHUB_SOT_FAMILY = '62L-ER' as const;
export const GITHUB_SOT_TITLE =
  '62L-ER28 Universal Runtime Package Contract — portable contract for Windows/Android/iOS/Linux/edge; one spec ≠ one binary; UNIVERSAL_COMPATIBILITY_CLAIMED_WITHOUT_TEST=false' as const;

export const GITLAB_MIRROR_NOTE =
  'GitLab mirror: search attempted; MCP needsAuth / not resolved in this environment — no issue number invented.' as const;

export const ER28_DB_CANDIDATES_STATUS = 'NOT_APPLIED' as const;

export const ER_LAYER_TITLE =
  '62L-ER Real API Data Fabric + Global Historical Knowledge Ingestion + Offline/Online Brain Sync + Historical Avatar Simulations + Universal Device Distribution' as const;

export const NEXT_PHASE_TITLE =
  'ER29 — Windows Runtime Package Candidate — turn existing ASUS/Windows local-runtime work into first concrete device package candidate with AMD-aware capability detection and CPU-safe fallback.' as const;

/**
 * Package contract metadata fields.
 */
export const RUNTIME_PACKAGE_FIELDS = [
  'packageId',
  'platform',
  'architecture',
  'supportedDeviceClasses',
  'minimumOsRuntimeVersion',
  'modelRuntimeDependencies',
  'localStorageRequirements',
  'cpuGpuNpuRequirements',
  'allowedPermissions',
  'networkPolicy',
  'dataClasses',
  'offlineCapability',
  'updateChannel',
  'rollbackVersion',
  'installUninstallBehavior',
  'heartbeatContract',
  'capabilityManifest',
  'evidenceState',
] as const;

export type RuntimePackageField = (typeof RUNTIME_PACKAGE_FIELDS)[number];

/**
 * Required package evidence / support states.
 */
export const RUNTIME_PACKAGE_STATES = [
  'DOCUMENTED',
  'BUILDABLE',
  'INSTALLABLE',
  'SUPPORTED',
  'VERIFIED',
  'DEGRADED',
  'NOT_TESTED',
  'UNAVAILABLE',
] as const;

export type RuntimePackageState = (typeof RUNTIME_PACKAGE_STATES)[number];

/**
 * Core package install / enrollment flow.
 */
export const RUNTIME_PACKAGE_CORE_FLOW = [
  'device_enrollment',
  'compatibility_check',
  'permission_preview',
  'user_admin_authorization',
  'signed_package_install',
  'local_hardware_probe',
  'runtime_model_verification',
  'heartbeat',
  'xiv_home_base_registration',
] as const;

export type RuntimePackageCoreFlowHop =
  (typeof RUNTIME_PACKAGE_CORE_FLOW)[number];

/**
 * Platform-specific build targets behind one common contract.
 * Each must be independently tested.
 */
export const PLATFORM_BUILD_TARGETS = [
  'windows_x86_amd',
  'windows_arm',
  'android_arm',
  'ios_apple',
  'linux_x86',
  'linux_arm',
  'edge_embedded_candidate',
] as const;

export type PlatformBuildTarget = (typeof PLATFORM_BUILD_TARGETS)[number];

/**
 * Package contents that MAY be included (not required in every build).
 */
export const RUNTIME_PACKAGE_CONTENTS_MAY = [
  'local_agent_runtime',
  'approved_models',
  'search_index_engine',
  'offline_knowledge_packs',
  'virtual_chip_adapter',
  'scheduler_resource_governor',
  'policy_guardian_client',
  'encrypted_local_storage',
  'sync_client',
  'audit_receipt_logic',
] as const;

export type RuntimePackageContentMay =
  (typeof RUNTIME_PACKAGE_CONTENTS_MAY)[number];

/**
 * Offline / connectivity truth states for installed packages.
 */
export const OFFLINE_TRUTH_STATES = [
  'OFFLINE_STOPPED',
  'LOCAL_ONLY',
  'RUNNING_VERIFIED',
] as const;

export type OfflineTruthState = (typeof OFFLINE_TRUTH_STATES)[number];

export type DevicePowerState = 'POWERED_ON' | 'POWERED_OFF';
export type ConnectivityState = 'CONNECTED' | 'DISCONNECTED';

export type PackagePlatform =
  | 'windows'
  | 'android'
  | 'ios'
  | 'linux'
  | 'edge'
  | 'future_device_class';

export type PackageArchitecture =
  | 'x86_64'
  | 'x86'
  | 'arm64'
  | 'arm'
  | 'apple_silicon'
  | 'amd64'
  | 'embedded';

export type DeviceClass =
  | 'laptop'
  | 'desktop'
  | 'phone'
  | 'tablet'
  | 'edge_node'
  | 'embedded'
  | 'server'
  | 'future';

export type NetworkPolicy =
  | 'offline_only'
  | 'local_network'
  | 'home_base_sync'
  | 'least_privilege_egress';

export type DataClass =
  | 'public_reference'
  | 'tenant_scoped'
  | 'user_private'
  | 'encrypted_local'
  | 'audit_receipt';

export type UniversalRuntimePackage = {
  packageId: string;
  platform: PackagePlatform;
  architecture: PackageArchitecture;
  supportedDeviceClasses: readonly DeviceClass[];
  minimumOsRuntimeVersion: string;
  modelRuntimeDependencies: readonly string[];
  localStorageRequirementsBytes: number;
  cpuGpuNpuRequirements: {
    cpuRequired: boolean;
    gpuOptional: boolean;
    npuOptional: boolean;
    cpuSafeFallback: true;
  };
  allowedPermissions: readonly string[];
  networkPolicy: NetworkPolicy;
  dataClasses: readonly DataClass[];
  offlineCapability: boolean;
  updateChannel: string;
  rollbackVersion: string | null;
  installUninstallBehavior: {
    requiresExplicitAuthorization: true;
    stealthPersistence: false;
    privilegeEscalation: false;
    firmwareBiosModification: false;
    uninstallDeletePath: true;
    rollbackSupported: true;
  };
  heartbeatContract: {
    intervalSeconds: number;
    reportsOfflineTruthState: true;
  };
  capabilityManifest: readonly string[];
  evidenceState: RuntimePackageState;
  buildTarget: PlatformBuildTarget;
  contents: readonly RuntimePackageContentMay[];
  signature: string | null;
  signed: boolean;
  enrolledDeviceId: string | null;
  enrollmentRevocable: true;
  localDataEncrypted: true;
  installed: boolean;
  installAuthorizedBy: string | null;
  hardwareProbePassed: boolean | null;
  runtimeModelVerified: boolean | null;
  registeredWithHomeBase: boolean;
  offlineTruthState: OfflineTruthState;
  platformTestEvidence: readonly {
    buildTarget: PlatformBuildTarget;
    tested: boolean;
    state: RuntimePackageState;
  }[];
  universalCompatibilityClaimedWithoutTest: false;
  tenantId: string;
  universeId: string;
  orgId: string;
};

export type PackageHeartbeat = {
  heartbeatId: string;
  packageId: string;
  deviceId: string;
  tenantId: string;
  universeId: string;
  at: string;
  devicePowerState: DevicePowerState;
  connectivityState: ConnectivityState;
  offlineTruthState: OfflineTruthState;
  synchronizedHealthy: boolean;
};

export type HomeBaseRegistration = {
  registrationId: string;
  packageId: string;
  deviceId: string;
  tenantId: string;
  universeId: string;
  status: 'REGISTERED_CANDIDATE';
  productionAuthorized: false;
  authorityGranted: false;
};

export const UNIVERSAL_RUNTIME_PACKAGE_TRUTH_BOUNDARY = Object.freeze({
  oneSpecEqualsOneBinaryEverywhere: false as const,
  universalCompatibilityClaimedWithoutTest: false as const,
  eachPlatformBuildIndependentlyTested: true as const,
  signedPackagesRequired: true as const,
  explicitInstallAuthorizationRequired: true as const,
  stealthPersistenceAllowed: false as const,
  privilegeEscalationAllowed: false as const,
  leastPrivilegePermissions: true as const,
  localDataEncrypted: true as const,
  deviceEnrollmentRevocable: true as const,
  uninstallDeletePathRequired: true as const,
  rollbackSupported: true as const,
  firmwareBiosModificationAllowed: false as const,
  offlineStoppedWhenPoweredOff: true as const,
  localOnlyWhenAliveDisconnected: true as const,
  runningVerifiedWhenSynchronizedHealthy: true as const,
  productionDeployWithoutSeparateAuth: false as const,
});

export const UNIVERSAL_RUNTIME_PACKAGE_CONTRACT_CYCLE = [
  'honesty_locks',
  'universal_runtime_package_contract_bootstrap',
  // A — Structure
  'package_fields_encoded',
  'package_states_encoded',
  'core_flow_encoded',
  'platform_build_targets_encoded',
  'package_contents_may_encoded',
  'offline_truth_states_encoded',
  'truth_boundary_encoded',
  // B — Truth
  'define_package_contract',
  'advance_state_only_with_evidence',
  'deny_universal_compat_without_per_platform_tests',
  'install_requires_auth_and_signed_package',
  'hardware_probe_and_runtime_verify',
  'heartbeat_offline_truth_states',
  'home_base_registration_candidate',
  'revocable_enrollment_uninstall_rollback',
  // C — Denies
  'deny_stealth_persistence',
  'deny_privilege_escalation',
  'deny_firmware_bios_modification',
  'deny_unsigned_install',
  'deny_install_without_authorization',
  'deny_universal_compat_claim',
  'deny_advance_to_verified_without_evidence',
  'deny_bypass_guardian_rls',
  'deny_expand_tenant_universe_access',
  'deny_auto_deploy_changes',
  // D — Autonomy
  'guardian_rls_tenant_universe_isolation',
  'recommend_neq_act',
  'l4_autonomy_false',
  // E — Soft-wires
  'er_layer_context_documented',
  'er27_soft_wire',
  'er26_soft_wire',
  'er25_soft_wire',
  'er24_soft_wire',
  'er23_soft_wire',
  'er22_soft_wire',
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
  'eq8_soft_wire',
  'eq7_soft_wire',
  'eq16_soft_wire',
  'ep1_soft_wire',
  'ep15_soft_wire',
  'em157_soft_wire',
  'db_candidates_not_applied',
  'evidence',
] as const;

export type Er28Hop = (typeof UNIVERSAL_RUNTIME_PACKAGE_CONTRACT_CYCLE)[number];

export type Er28EvidenceState =
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
  | 'BUILDABLE'
  | 'INSTALLABLE'
  | 'SUPPORTED'
  | 'OFFLINE_STOPPED'
  | 'LOCAL_ONLY'
  | 'RUNNING_VERIFIED';

export type Er28HopRecord = {
  hop: Er28Hop;
  state: Er28EvidenceState;
  summary: string;
  at: string;
};

export type Er28ActorKind =
  | 'runtime_package_contract'
  | 'device_enroller'
  | 'package_installer'
  | 'proposal'
  | 'human_approver'
  | 'founder'
  | 'guardian'
  | 'home_base'
  | 'tenant_admin';

export type Er28Actor = {
  kind: Er28ActorKind;
  id: string;
  orgId: string;
  tenantId: string;
  universeId: string;
  permissions: readonly string[];
};

export const ER28_LOCKS = Object.freeze({
  L4_AUTONOMY_ENABLED: false as const,
  TIP_LAND: false as const,
  PRODUCTION_AUTHORIZATION: false as const,
  PRODUCTION_WRITE: false as const,
  DB_CANDIDATES_APPLIED: false as const,
  FULL_PRODUCTION_UNIVERSAL_RUNTIME_PACKAGE_SHIPPED: false as const,
  MANAGE_PULL_REQUEST: false as const,

  UNIVERSAL_COMPATIBILITY_CLAIMED_WITHOUT_TEST: false as const,
  ONE_SPEC_EQUALS_ONE_BINARY_EVERYWHERE: false as const,
  STEALTH_PERSISTENCE: false as const,
  PRIVILEGE_ESCALATION: false as const,
  FIRMWARE_BIOS_MODIFICATION: false as const,
  INSTALL_WITHOUT_EXPLICIT_AUTHORIZATION: false as const,
  UNSIGNED_PACKAGE_INSTALL: false as const,
  ADVANCE_TO_VERIFIED_WITHOUT_EVIDENCE: false as const,
  LOCAL_DATA_ENCRYPTED: true as const,
  DEVICE_ENROLLMENT_REVOCABLE: true as const,
  UNINSTALL_DELETE_PATH: true as const,
  ROLLBACK_SUPPORTED: true as const,
  LEAST_PRIVILEGE_PERMISSIONS: true as const,
  SIGNED_PACKAGES_REQUIRED: true as const,

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

export const ER28_AGENT_BOUNDS = Object.freeze({
  mayDefinePackageContract: true as const,
  mayAdvanceStateWithEvidence: true as const,
  mayInstallSignedAuthorizedPackage: true as const,
  mayProbeLocalHardware: true as const,
  mayEmitHeartbeat: true as const,
  mayRegisterHomeBaseCandidate: true as const,
  mayRevokeEnrollmentAndUninstall: true as const,
  mayClaimUniversalCompatWithoutPerPlatformTests: false as const,
  mayStealthPersist: false as const,
  mayPrivilegeEscalate: false as const,
  mayModifyFirmwareBios: false as const,
  mayInstallUnsigned: false as const,
  mayInstallWithoutAuthorization: false as const,
  mayAdvanceToVerifiedWithoutEvidence: false as const,
  mayBypassGuardianRls: false as const,
  mayExpandTenantUniverseAccess: false as const,
  mayAutoDeployChanges: false as const,
  automaticAuthority: false as const,
  mayRecommendOnly: true as const,
});

export const ER28_MAY = Object.freeze([
  'define_portable_runtime_package_contract_across_device_classes',
  'advance_package_states_only_with_evidence',
  'install_signed_packages_after_explicit_user_or_admin_authorization',
  'probe_local_hardware_and_verify_runtime_models',
  'emit_heartbeat_mapping_to_OFFLINE_STOPPED_LOCAL_ONLY_RUNNING_VERIFIED',
  'register_device_package_candidate_with_xiv_home_base',
  'revoke_enrollment_uninstall_and_rollback',
] as const);

export const ER28_MUST_NOT = Object.freeze([
  'claim_universal_compatibility_without_per_platform_tests',
  'treat_one_package_spec_as_one_binary_everywhere',
  'stealth_persist_or_privilege_escalate',
  'modify_firmware_or_bios',
  'install_unsigned_packages_or_install_without_authorization',
  'advance_to_VERIFIED_without_evidence',
  'bypass_guardian_rls_or_expand_tenant_universe_access',
  'auto_deploy_or_production_authorize_without_separate_auth',
  'treat_recommend_as_act',
  'grant_agents_automatic_authority',
] as const);

export type SoftWirePresence = {
  present: boolean;
  pathChecked: string;
  note: string;
};

export type Er28SoftWireSnapshot = {
  er27SpeculativeExtraterrestrialResearchLayer: SoftWirePresence;
  er27Report: SoftWirePresence;
  er26: SoftWirePresence;
  er26Report: SoftWirePresence;
  er25: SoftWirePresence;
  er25Report: SoftWirePresence;
  er24: SoftWirePresence;
  er24Report: SoftWirePresence;
  er23: SoftWirePresence;
  er23Report: SoftWirePresence;
  er22HistoricalAvatarContract: SoftWirePresence;
  er22Report: SoftWirePresence;
  er21: SoftWirePresence;
  er21Report: SoftWirePresence;
  er20: SoftWirePresence;
  er20Report: SoftWirePresence;
  er19: SoftWirePresence;
  er19Report: SoftWirePresence;
  er18ResearchReviewBoard: SoftWirePresence;
  er18Report: SoftWirePresence;
  er17: SoftWirePresence;
  er17Report: SoftWirePresence;
  er16: SoftWirePresence;
  er16Report: SoftWirePresence;
  er15OfflineOnlineSyncContract: SoftWirePresence;
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
  eq8ArmServerCloudRuntime: SoftWirePresence;
  eq8Report: SoftWirePresence;
  eq7ArmEdgeAmdAcceleration: SoftWirePresence;
  eq7Report: SoftWirePresence;
  eq16SoftwareWormholeRouter: SoftWirePresence;
  eq16Report: SoftWirePresence;
  ep1VirtualChipContract: SoftWirePresence;
  ep1Report: SoftWirePresence;
  ep15AlgorithmTuningSandbox: SoftWirePresence;
  ep15Report: SoftWirePresence;
  em157HomeBase: SoftWirePresence;
};

export function assertEr28LocksIntact(): boolean {
  return (
    ER28_LOCKS.L4_AUTONOMY_ENABLED === false &&
    ER28_LOCKS.UNIVERSAL_COMPATIBILITY_CLAIMED_WITHOUT_TEST === false &&
    ER28_LOCKS.ONE_SPEC_EQUALS_ONE_BINARY_EVERYWHERE === false &&
    ER28_LOCKS.STEALTH_PERSISTENCE === false &&
    ER28_LOCKS.PRIVILEGE_ESCALATION === false &&
    ER28_LOCKS.FIRMWARE_BIOS_MODIFICATION === false &&
    ER28_LOCKS.INSTALL_WITHOUT_EXPLICIT_AUTHORIZATION === false &&
    ER28_LOCKS.UNSIGNED_PACKAGE_INSTALL === false &&
    ER28_LOCKS.ADVANCE_TO_VERIFIED_WITHOUT_EVIDENCE === false &&
    ER28_LOCKS.LOCAL_DATA_ENCRYPTED === true &&
    ER28_LOCKS.DEVICE_ENROLLMENT_REVOCABLE === true &&
    ER28_LOCKS.UNINSTALL_DELETE_PATH === true &&
    ER28_LOCKS.ROLLBACK_SUPPORTED === true &&
    ER28_LOCKS.LEAST_PRIVILEGE_PERMISSIONS === true &&
    ER28_LOCKS.SIGNED_PACKAGES_REQUIRED === true &&
    ER28_LOCKS.BYPASS_GUARDIAN_RLS === false &&
    ER28_LOCKS.EXPAND_TENANT_UNIVERSE_ACCESS === false &&
    ER28_LOCKS.AUTO_DEPLOY_CHANGES === false &&
    ER28_LOCKS.AGENT_AUTO_AUTHORITY === false &&
    ER28_LOCKS.RECOMMEND_EQ_ACT === false &&
    ER28_LOCKS.RECOMMEND_EQ_AUTHORIZE === false &&
    ER28_LOCKS.BYPASS_GUARDIAN_RLS_TENANT_UNIVERSE === false &&
    ER28_LOCKS.GUARDIAN_RLS_TENANT_UNIVERSE_ISOLATION_UNCHANGED === true &&
    ER28_LOCKS.HUMAN_APPROVAL_BOUNDARIES_UNCHANGED === true &&
    ER28_LOCKS.DOCUMENTED_EQ_IMPLEMENTED === false &&
    ER28_LOCKS.IMPLEMENTED_EQ_VERIFIED === false &&
    ER28_LOCKS.VERIFIED_EQ_PRODUCTION_AUTHORIZED === false &&
    ER28_LOCKS.HUMAN_APPROVAL_REQUIRED_BEFORE_CONSEQUENTIAL_ACTIONS === true &&
    ER28_LOCKS.TIP_LAND === false &&
    ER28_LOCKS.PRODUCTION_AUTHORIZATION === false &&
    ER28_LOCKS.DB_CANDIDATES_APPLIED === false &&
    ER28_LOCKS.FULL_PRODUCTION_UNIVERSAL_RUNTIME_PACKAGE_SHIPPED === false &&
    ER28_LOCKS.MANAGE_PULL_REQUEST === false &&
    UNIVERSAL_RUNTIME_PACKAGE_TRUTH_BOUNDARY.oneSpecEqualsOneBinaryEverywhere ===
      false &&
    UNIVERSAL_RUNTIME_PACKAGE_TRUTH_BOUNDARY.universalCompatibilityClaimedWithoutTest ===
      false &&
    UNIVERSAL_RUNTIME_PACKAGE_TRUTH_BOUNDARY.stealthPersistenceAllowed ===
      false &&
    UNIVERSAL_RUNTIME_PACKAGE_TRUTH_BOUNDARY.firmwareBiosModificationAllowed ===
      false &&
    ER28_AGENT_BOUNDS.mayClaimUniversalCompatWithoutPerPlatformTests ===
      false &&
    ER28_AGENT_BOUNDS.automaticAuthority === false
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

export function er28SoftWireSnapshot(repoRoot?: string): Er28SoftWireSnapshot {
  const root =
    repoRoot ?? join(dirname(fileURLToPath(import.meta.url)), '../../..');

  return {
    er27SpeculativeExtraterrestrialResearchLayer: softWireFile(
      './speculative-extraterrestrial-research-layer-types.ts',
      'ER27 Speculative/Extraterrestrial Research Layer PRESENT (soft-wire).',
      'ER27 Speculative/Extraterrestrial Research Layer absent — soft-wire WAITING_DATA.',
    ),
    er27Report: softWireRepoRelative(
      root,
      'docs/operations/62L_ER27_SPECULATIVE_EXTRATERRESTRIAL_RESEARCH_LAYER_REPORT.md',
      'ER27 report PRESENT.',
      'ER27 report absent — soft-wire WAITING_DATA.',
    ),
    er26: softWireFile(
      './er26-types.ts',
      'ER26 PRESENT (soft-wire).',
      'ER26 absent — soft-wire WAITING_DATA.',
    ),
    er26Report: softWireRepoRelative(
      root,
      'docs/operations/62L_ER26_REPORT.md',
      'ER26 report PRESENT.',
      'ER26 report absent — soft-wire WAITING_DATA.',
    ),
    er25: softWireFile(
      './er25-types.ts',
      'ER25 PRESENT (soft-wire).',
      'ER25 absent — soft-wire WAITING_DATA.',
    ),
    er25Report: softWireRepoRelative(
      root,
      'docs/operations/62L_ER25_REPORT.md',
      'ER25 report PRESENT.',
      'ER25 report absent — soft-wire WAITING_DATA.',
    ),
    er24: softWireFile(
      './er24-types.ts',
      'ER24 PRESENT (soft-wire).',
      'ER24 absent — soft-wire WAITING_DATA.',
    ),
    er24Report: softWireRepoRelative(
      root,
      'docs/operations/62L_ER24_REPORT.md',
      'ER24 report PRESENT.',
      'ER24 report absent — soft-wire WAITING_DATA.',
    ),
    er23: softWireFile(
      './er23-types.ts',
      'ER23 PRESENT (soft-wire).',
      'ER23 absent — soft-wire WAITING_DATA.',
    ),
    er23Report: softWireRepoRelative(
      root,
      'docs/operations/62L_ER23_REPORT.md',
      'ER23 report PRESENT.',
      'ER23 report absent — soft-wire WAITING_DATA.',
    ),
    er22HistoricalAvatarContract: softWireFile(
      './historical-avatar-contract-types.ts',
      'ER22 Historical Avatar Contract PRESENT (soft-wire).',
      'ER22 Historical Avatar Contract absent — soft-wire WAITING_DATA.',
    ),
    er22Report: softWireRepoRelative(
      root,
      'docs/operations/62L_ER22_HISTORICAL_AVATAR_CONTRACT_REPORT.md',
      'ER22 report PRESENT.',
      'ER22 report absent — soft-wire WAITING_DATA.',
    ),
    er21: softWireFile(
      './er21-types.ts',
      'ER21 PRESENT (soft-wire).',
      'ER21 absent — soft-wire WAITING_DATA.',
    ),
    er21Report: softWireRepoRelative(
      root,
      'docs/operations/62L_ER21_REPORT.md',
      'ER21 report PRESENT.',
      'ER21 report absent — soft-wire WAITING_DATA.',
    ),
    er20: softWireFile(
      './er20-types.ts',
      'ER20 PRESENT (soft-wire).',
      'ER20 absent — soft-wire WAITING_DATA.',
    ),
    er20Report: softWireRepoRelative(
      root,
      'docs/operations/62L_ER20_REPORT.md',
      'ER20 report PRESENT.',
      'ER20 report absent — soft-wire WAITING_DATA.',
    ),
    er19: softWireFile(
      './er19-types.ts',
      'ER19 PRESENT (soft-wire).',
      'ER19 absent — soft-wire WAITING_DATA.',
    ),
    er19Report: softWireRepoRelative(
      root,
      'docs/operations/62L_ER19_REPORT.md',
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
    er17: softWireFile(
      './er17-types.ts',
      'ER17 PRESENT (soft-wire).',
      'ER17 absent — soft-wire WAITING_DATA.',
    ),
    er17Report: softWireRepoRelative(
      root,
      'docs/operations/62L_ER17_REPORT.md',
      'ER17 report PRESENT.',
      'ER17 report absent — soft-wire WAITING_DATA.',
    ),
    er16: softWireFile(
      './er16-types.ts',
      'ER16 PRESENT (soft-wire).',
      'ER16 absent — soft-wire WAITING_DATA.',
    ),
    er16Report: softWireRepoRelative(
      root,
      'docs/operations/62L_ER16_REPORT.md',
      'ER16 report PRESENT.',
      'ER16 report absent — soft-wire WAITING_DATA.',
    ),
    er15OfflineOnlineSyncContract: softWireFile(
      './offline-online-sync-contract-types.ts',
      'ER15 Offline/Online Sync Contract PRESENT (soft-wire).',
      'ER15 Offline/Online Sync Contract absent — soft-wire WAITING_DATA.',
    ),
    er15Report: softWireRepoRelative(
      root,
      'docs/operations/62L_ER15_OFFLINE_ONLINE_SYNC_CONTRACT_REPORT.md',
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
    eq8ArmServerCloudRuntime: softWireFile(
      './arm-server-cloud-runtime-types.ts',
      'EQ8 ARM Server/Cloud Runtime PRESENT (soft-wire).',
      'EQ8 ARM Server/Cloud Runtime absent — soft-wire WAITING_DATA.',
    ),
    eq8Report: softWireRepoRelative(
      root,
      'docs/operations/62L_EQ8_ARM_SERVER_CLOUD_RUNTIME_REPORT.md',
      'EQ8 report PRESENT.',
      'EQ8 report absent — soft-wire WAITING_DATA.',
    ),
    eq7ArmEdgeAmdAcceleration: softWireFile(
      './arm-edge-amd-acceleration-types.ts',
      'EQ7 ARM Edge/AMD Acceleration PRESENT (soft-wire).',
      'EQ7 ARM Edge/AMD Acceleration absent — soft-wire WAITING_DATA.',
    ),
    eq7Report: softWireRepoRelative(
      root,
      'docs/operations/62L_EQ7_ARM_EDGE_AMD_ACCELERATION_REPORT.md',
      'EQ7 report PRESENT.',
      'EQ7 report absent — soft-wire WAITING_DATA.',
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
    ep1VirtualChipContract: softWireFile(
      './virtual-chip-contract-types.ts',
      'EP1 Virtual Chip Contract PRESENT (soft-wire).',
      'EP1 Virtual Chip Contract absent — soft-wire WAITING_DATA.',
    ),
    ep1Report: softWireRepoRelative(
      root,
      'docs/operations/62L_EP1_VIRTUAL_CHIP_CONTRACT_REPORT.md',
      'EP1 report PRESENT.',
      'EP1 report absent — soft-wire WAITING_DATA.',
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

export function softWireHopState(present: boolean): Er28EvidenceState {
  return present ? 'PASS' : 'WAITING_DATA';
}

export function isEr28Agent(actor: Er28Actor): boolean {
  return (
    actor.kind === 'runtime_package_contract' ||
    actor.kind === 'device_enroller' ||
    actor.kind === 'package_installer'
  );
}

export function isHumanApprover(actor: Er28Actor): boolean {
  return (
    actor.kind === 'human_approver' ||
    actor.kind === 'founder' ||
    actor.kind === 'tenant_admin'
  );
}

export function mayClaimUniversalCompatWithoutTest(): boolean {
  return UNIVERSAL_RUNTIME_PACKAGE_TRUTH_BOUNDARY.universalCompatibilityClaimedWithoutTest;
}

export function oneSpecEqualsOneBinaryEverywhere(): boolean {
  return UNIVERSAL_RUNTIME_PACKAGE_TRUTH_BOUNDARY.oneSpecEqualsOneBinaryEverywhere;
}

export function stealthPersistenceAllowed(): boolean {
  return UNIVERSAL_RUNTIME_PACKAGE_TRUTH_BOUNDARY.stealthPersistenceAllowed;
}

export function firmwareBiosModificationAllowed(): boolean {
  return UNIVERSAL_RUNTIME_PACKAGE_TRUTH_BOUNDARY.firmwareBiosModificationAllowed;
}
