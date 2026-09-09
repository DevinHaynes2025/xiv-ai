/**
 * 62L-ER30 — Android / ARM Runtime Package Candidate (park-and-implement).
 *
 * Layer: 62L-ER Real API Data Fabric + Global Historical Knowledge Ingestion +
 * Offline/Online Brain Sync + Historical Avatar Simulations + Universal Device
 * Distribution (GitHub #162).
 *
 * Governed Android/ARM runtime package so supported phones/tablets run a
 * bounded local XIV brain with offline search, lightweight agents, approved
 * models, and Home Base sync.
 *
 * Core package chain:
 * Android App → device capability probe → ARM/SoC profile →
 * CPU/GPU/NPU candidate registry → local model runtime → offline knowledge packs →
 * mobile agent scheduler → battery/resource governor → encrypted storage →
 * sync client → XIV Home Base
 *
 * Soft-wire when PRESENT: ER29–ER28 (WAITING_DATA if absent), ER14 Offline Brain
 * Packager, EQ7 ARM Edge/AMD Acceleration, earlier ER/EQ/EP/EM tips.
 * Presence ≠ VERIFIED. Absent → WAITING_DATA (not FAIL).
 *
 * SoT: GitHub #162 / 62L-ER family. GitLab mirror: needsAuth; no number invented.
 *
 * Honesty: DOCUMENTED ≠ IMPLEMENTED ≠ VERIFIED ≠ PRODUCTION AUTHORIZED.
 * L4_AUTONOMY_ENABLED=false. Guardian/RLS/tenant/Universe unchanged.
 * DB candidates NOT_APPLIED. tip-land=NO.
 * Next (report only): ER31 — iOS / Apple Runtime Research Candidate.
 */

import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

export const HONESTY_BANNER =
  'DOCUMENTED ≠ IMPLEMENTED ≠ VERIFIED ≠ PRODUCTION AUTHORIZED' as const;

export const GITHUB_SOT_ISSUE = 162 as const;
export const GITHUB_SOT_LABEL = '62L-ER30' as const;
export const GITHUB_SOT_FAMILY = '62L-ER' as const;
export const GITHUB_SOT_TITLE =
  '62L-ER30 Android / ARM Runtime Package Candidate — device probe; SoC≠accelerator; battery governor; encrypted offline packs; no telemetry-as-access; L4=false' as const;

export const GITLAB_MIRROR_NOTE =
  'GitLab mirror: search attempted; MCP needsAuth / not resolved in this environment — no issue number invented.' as const;

export const ER30_DB_CANDIDATES_STATUS = 'NOT_APPLIED' as const;

export const ER_LAYER_TITLE =
  '62L-ER Real API Data Fabric + Global Historical Knowledge Ingestion + Offline/Online Brain Sync + Historical Avatar Simulations + Universal Device Distribution' as const;

export const NEXT_PHASE_TITLE =
  'ER31 — iOS / Apple Runtime Research Candidate — map Apple Silicon / iOS sandbox, Neural Engine boundaries, and offline brain packaging for iPhone/iPad enrollment.' as const;

/**
 * Package tracking fields.
 */
export const ANDROID_ARM_PACKAGE_FIELDS = [
  'packageId',
  'androidVersion',
  'deviceModel',
  'armArchitecture',
  'socVendor',
  'cpuGpuNpuState',
  'supportedRuntimes',
  'modelCompatibility',
  'availableRamStorage',
  'batteryThermalState',
  'networkState',
  'permissions',
  'packageVersion',
  'signatureHash',
  'rollbackState',
  'benchmarkEvidence',
] as const;

export type AndroidArmPackageField =
  (typeof ANDROID_ARM_PACKAGE_FIELDS)[number];

/**
 * Required capability states.
 */
export const ANDROID_ARM_CAPABILITY_STATES = [
  'DOCUMENTED',
  'DETECTED',
  'SUPPORTED',
  'VERIFIED',
  'NOT_TESTED',
  'DEGRADED',
  'UNAVAILABLE',
] as const;

export type AndroidArmCapabilityState =
  (typeof ANDROID_ARM_CAPABILITY_STATES)[number];

/**
 * Core package chain hops.
 */
export const ANDROID_ARM_PACKAGE_CHAIN = [
  'android_app',
  'device_capability_probe',
  'arm_soc_profile',
  'cpu_gpu_npu_candidate_registry',
  'local_model_runtime',
  'offline_knowledge_packs',
  'mobile_agent_scheduler',
  'battery_resource_governor',
  'encrypted_storage',
  'sync_client',
  'xiv_home_base',
] as const;

export type AndroidArmPackageChainHop =
  (typeof ANDROID_ARM_PACKAGE_CHAIN)[number];

/**
 * Mobile-first workload limits (MAY).
 */
export const MOBILE_FIRST_WORKLOADS_MAY = [
  'local_semantic_search',
  'embeddings',
  'document_summarization',
  'lightweight_classification',
  'offline_knowledge_retrieval',
  'task_planning',
  'agent_checkpoints',
  'simple_optimization_simulation',
  'encrypted_personal_business_knowledge_access',
] as const;

export type MobileFirstWorkloadMay =
  (typeof MOBILE_FIRST_WORKLOADS_MAY)[number];

/**
 * Workloads that remain on verified compute nodes (MUST NOT on-device).
 */
export const MOBILE_MUST_NOT_ON_DEVICE = [
  'large_training',
  'massive_simulation',
  'heavy_research',
] as const;

/**
 * Offline brain pack categories (encrypted, versioned, rights-aware, revocable).
 */
export const OFFLINE_BRAIN_PACK_KINDS = [
  'CORE',
  'BUSINESS',
  'SUPPLY_CHAIN',
  'GOVERNMENT',
  'HISTORICAL',
  'CHIP_RESEARCH',
] as const;

export type OfflineBrainPackKind = (typeof OFFLINE_BRAIN_PACK_KINDS)[number];

/**
 * Battery / resource governor inputs.
 */
export const BATTERY_GOVERNOR_INPUTS = [
  'battery_level',
  'charging_state',
  'thermal_pressure',
  'foreground_background',
  'ram',
  'storage',
  'network_type',
  'user_defined_compute_limits',
] as const;

export type BatteryGovernorInput = (typeof BATTERY_GOVERNOR_INPUTS)[number];

export type BatteryGovernorAction =
  | 'ALLOW_BOUNDED'
  | 'PAUSE_RESEARCH_AGENTS'
  | 'THROTTLE'
  | 'DEFER_SYNC';

export type SocVendor =
  | 'QUALCOMM'
  | 'MEDIATEK'
  | 'SAMSUNG'
  | 'GOOGLE'
  | 'OTHER'
  | 'UNKNOWN';

export type ArmArchitecture = 'arm64-v8a' | 'armeabi-v7a' | 'UNKNOWN';

export type AcceleratorKind = 'CPU' | 'GPU' | 'NPU';

export type AcceleratorCandidate = {
  kind: AcceleratorKind;
  vendorClaim: SocVendor;
  detected: boolean;
  runtimeCompatible: boolean;
  modelLoaded: boolean;
  boundedInferenceCompleted: boolean;
  receiptId: string | null;
  capabilityState: AndroidArmCapabilityState;
};

/**
 * NPU/GPU truth chain: detect → runtime compatibility → model load →
 * bounded inference → receipt → VERIFIED. Seeing SoC ≠ accelerator support.
 */
export const NPU_VERIFY_CHAIN = [
  'detect',
  'runtime_compatibility',
  'model_load',
  'bounded_inference',
  'receipt',
  'verified',
] as const;

export type NpuVerifyChainHop = (typeof NPU_VERIFY_CHAIN)[number];

export type TelemetryKind =
  | 'GPS'
  | 'CAMERA'
  | 'CONTACTS'
  | 'DRIVING_HISTORY'
  | 'PERSONAL_TELEMETRY';

export type OfflineMobilePack = {
  packId: string;
  kind: OfflineBrainPackKind;
  version: string;
  encrypted: true;
  rightsAware: true;
  revocable: true;
  revocationState: 'ACTIVE' | 'REVOKED' | 'PENDING_DELETE';
  tenantId: string;
  universeId: string;
  contentHash: string;
};

export type AndroidArmRuntimePackage = {
  packageId: string;
  androidVersion: string;
  deviceModel: string;
  armArchitecture: ArmArchitecture;
  socVendor: SocVendor;
  cpuGpuNpuState: {
    cpu: AcceleratorCandidate;
    gpu: AcceleratorCandidate;
    npu: AcceleratorCandidate;
  };
  supportedRuntimes: readonly string[];
  modelCompatibility: readonly string[];
  availableRamMb: number;
  availableStorageMb: number;
  batteryLevelPercent: number;
  charging: boolean;
  thermalPressure: 'NOMINAL' | 'ELEVATED' | 'CRITICAL';
  networkState: 'WIFI' | 'CELLULAR' | 'OFFLINE' | 'UNKNOWN';
  permissions: readonly string[];
  packageVersion: string;
  signatureHash: string;
  rollbackState: 'NONE' | 'AVAILABLE' | 'ROLLED_BACK';
  benchmarkEvidence: readonly string[];
  capabilityState: AndroidArmCapabilityState;
  socSeenIsNotAcceleratorVerified: true;
  rootRequired: false;
  l4AutonomyEnabled: false;
  uninstallRevokePathExplicit: true;
};

export type BatteryGovernorDecision = {
  batteryLevelPercent: number;
  charging: boolean;
  thermalPressure: 'NOMINAL' | 'ELEVATED' | 'CRITICAL';
  foreground: boolean;
  action: BatteryGovernorAction;
  researchAgentsPaused: boolean;
  reason: string;
};

export type NpuVerificationResult = {
  vendorClaim: SocVendor;
  chainCompleted: readonly NpuVerifyChainHop[];
  capabilityState: AndroidArmCapabilityState;
  receiptId: string | null;
  autoVerifiedFromSocSighting: false;
};

export const ANDROID_ARM_TRUTH_BOUNDARY = Object.freeze({
  socSightingIsNotAcceleratorSupport: true as const,
  npuVerifyRequiresDetectLoadInferenceReceipt: true as const,
  batteryLowPausesResearchAgents: true as const,
  basicAccessCannotRequirePersonalTelemetry: true as const,
  offlinePacksEncryptedVersionedRightsAwareRevocable: true as const,
  androidSandboxRespected: true as const,
  rootRequired: false as const,
  mayUseHiddenAccessibilityAbuse: false as const,
  mayCovertBackgroundRecord: false as const,
  mayScrapePrivateFiles: false as const,
  mayPoolCrossTenantData: false as const,
  uninstallRevokePathExplicit: true as const,
  l4AutonomyEnabled: false as const,
  mayTipLand: false as const,
  mayPackageHiddenChainOfThought: false as const,
  largeTrainingRemainsOnVerifiedComputeNodes: true as const,
});

export const ANDROID_ARM_RUNTIME_PACKAGE_CYCLE = [
  'honesty_locks',
  'android_arm_runtime_package_bootstrap',
  // A — Structure
  'package_fields_encoded',
  'capability_states_encoded',
  'package_chain_encoded',
  'mobile_workloads_encoded',
  'offline_pack_kinds_encoded',
  'battery_governor_inputs_encoded',
  'npu_verify_chain_encoded',
  'truth_boundary_encoded',
  // B — Truth
  'create_android_package_candidate',
  'probe_soc_without_auto_verify',
  'battery_low_pauses_research',
  'deny_telemetry_as_access_requirement',
  'npu_verify_after_detect_load_inference_receipt',
  'offline_packs_encrypted_revocable',
  'deny_root_requirement',
  'deny_covert_recording',
  'deny_private_file_scrape',
  // C — Denies
  'deny_hidden_accessibility_abuse',
  'deny_cross_tenant_data_pooling',
  'deny_large_training_on_device',
  'deny_auto_verify_from_soc_sighting',
  'deny_bypass_guardian_rls',
  'deny_expand_tenant_universe_access',
  'deny_auto_deploy_changes',
  'deny_hidden_chain_of_thought',
  // D — Autonomy
  'guardian_rls_tenant_universe_isolation',
  'recommend_neq_act',
  'l4_autonomy_false',
  'explicit_uninstall_revoke_path',
  // E — Soft-wires
  'er_layer_context_documented',
  'er29_soft_wire',
  'er28_soft_wire',
  'er14_soft_wire',
  'er2_soft_wire',
  'er1_soft_wire',
  'eq7_soft_wire',
  'eq2_soft_wire',
  'em157_soft_wire',
  'db_candidates_not_applied',
  'evidence',
] as const;

export type Er30Hop = (typeof ANDROID_ARM_RUNTIME_PACKAGE_CYCLE)[number];

export type Er30EvidenceState =
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
  | 'DETECTED'
  | 'SUPPORTED';

export type Er30HopRecord = {
  hop: Er30Hop;
  state: Er30EvidenceState;
  summary: string;
  at: string;
};

export type Er30ActorKind =
  | 'android_arm_runtime_packager'
  | 'mobile_agent'
  | 'device_probe'
  | 'proposal'
  | 'human_approver'
  | 'founder'
  | 'guardian'
  | 'home_base'
  | 'tenant_admin';

export type Er30Actor = {
  kind: Er30ActorKind;
  id: string;
  orgId: string;
  tenantId: string;
  universeId: string;
  permissions: readonly string[];
};

export const ER30_LOCKS = Object.freeze({
  L4_AUTONOMY_ENABLED: false as const,
  TIP_LAND: false as const,
  PRODUCTION_AUTHORIZATION: false as const,
  PRODUCTION_WRITE: false as const,
  DB_CANDIDATES_APPLIED: false as const,
  FULL_PRODUCTION_ANDROID_ARM_RUNTIME_PACKAGE_SHIPPED: false as const,
  MANAGE_PULL_REQUEST: false as const,

  SOC_SIGHTING_AUTO_VERIFIES_ACCELERATOR: false as const,
  NPU_VERIFY_WITHOUT_DETECT_LOAD_INFERENCE_RECEIPT: false as const,
  BATTERY_LOW_CONSUME_AGGRESSIVELY: false as const,
  TELEMETRY_REQUIRED_FOR_BASIC_ACCESS: false as const,
  ROOT_REQUIRED: false as const,
  HIDDEN_ACCESSIBILITY_ABUSE: false as const,
  COVERT_BACKGROUND_RECORDING: false as const,
  PRIVATE_FILE_SCRAPE: false as const,
  CROSS_TENANT_DATA_POOLING: false as const,
  LARGE_TRAINING_ON_DEVICE: false as const,
  PACKAGE_HIDDEN_CHAIN_OF_THOUGHT: false as const,
  OFFLINE_PACKS_PLAINTEXT: false as const,

  ANDROID_SANDBOX_RESPECTED: true as const,
  OFFLINE_PACKS_ENCRYPTED_REVOCABLE: true as const,
  UNINSTALL_REVOKE_PATH_EXPLICIT: true as const,
  BATTERY_LOW_PAUSES_RESEARCH: true as const,

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

export const ER30_AGENT_BOUNDS = Object.freeze({
  mayCreateAndroidPackageCandidate: true as const,
  mayProbeDeviceCapabilityWithoutAutoVerify: true as const,
  mayRegisterCpuGpuNpuCandidates: true as const,
  mayRunBoundedMobileWorkloads: true as const,
  mayGovernBatteryAndResources: true as const,
  mayInstallEncryptedOfflinePacks: true as const,
  maySyncToHomeBaseWithReview: true as const,
  mayAutoVerifyAcceleratorFromSocSighting: false as const,
  mayRequireTelemetryForBasicAccess: false as const,
  mayRequireRoot: false as const,
  mayCovertRecordOrScrapePrivateFiles: false as const,
  mayPoolCrossTenantData: false as const,
  mayRunLargeTrainingOnDevice: false as const,
  mayBypassGuardianRls: false as const,
  mayExpandTenantUniverseAccess: false as const,
  mayAutoDeployChanges: false as const,
  automaticAuthority: false as const,
  mayRecommendOnly: true as const,
});

export const ER30_MAY = Object.freeze([
  'create_android_arm_runtime_package_candidate_after_device_probe',
  'probe_soc_and_register_cpu_gpu_npu_candidates_without_auto_verify',
  'verify_npu_only_after_detect_runtime_model_load_bounded_inference_receipt',
  'pause_research_agents_when_battery_low',
  'serve_mobile_first_bounded_workloads_offline',
  'install_encrypted_versioned_rights_aware_revocable_offline_brain_packs',
  'sync_to_xiv_home_base_with_explicit_uninstall_revoke_path',
] as const);

export const ER30_MUST_NOT = Object.freeze([
  'treat_soc_sighting_as_accelerator_verified',
  'auto_verify_npu_without_detect_load_inference_receipt',
  'consume_aggressively_when_battery_low',
  'require_gps_camera_contacts_driving_history_for_basic_xiv_access',
  'require_root_or_hidden_accessibility_abuse',
  'covert_background_record_or_scrape_private_files',
  'pool_cross_tenant_data',
  'run_large_training_or_massive_simulation_on_device',
  'package_hidden_chain_of_thought',
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

export type Er30SoftWireSnapshot = {
  er29IosPrepStub: SoftWirePresence;
  er29Report: SoftWirePresence;
  er28PriorMobileStub: SoftWirePresence;
  er28Report: SoftWirePresence;
  er14OfflineBrainPackager: SoftWirePresence;
  er14Report: SoftWirePresence;
  er2ApiTruthStateMachine: SoftWirePresence;
  er2Report: SoftWirePresence;
  er1RealApiConnectionRegistry: SoftWirePresence;
  er1Report: SoftWirePresence;
  eq7ArmEdgeAmdAcceleration: SoftWirePresence;
  eq7Report: SoftWirePresence;
  eq2ArmArchitectureKnowledgePack: SoftWirePresence;
  eq2Report: SoftWirePresence;
  em157HomeBase: SoftWirePresence;
};

export function assertEr30LocksIntact(): boolean {
  return (
    ER30_LOCKS.L4_AUTONOMY_ENABLED === false &&
    ER30_LOCKS.SOC_SIGHTING_AUTO_VERIFIES_ACCELERATOR === false &&
    ER30_LOCKS.NPU_VERIFY_WITHOUT_DETECT_LOAD_INFERENCE_RECEIPT === false &&
    ER30_LOCKS.BATTERY_LOW_CONSUME_AGGRESSIVELY === false &&
    ER30_LOCKS.TELEMETRY_REQUIRED_FOR_BASIC_ACCESS === false &&
    ER30_LOCKS.ROOT_REQUIRED === false &&
    ER30_LOCKS.HIDDEN_ACCESSIBILITY_ABUSE === false &&
    ER30_LOCKS.COVERT_BACKGROUND_RECORDING === false &&
    ER30_LOCKS.PRIVATE_FILE_SCRAPE === false &&
    ER30_LOCKS.CROSS_TENANT_DATA_POOLING === false &&
    ER30_LOCKS.LARGE_TRAINING_ON_DEVICE === false &&
    ER30_LOCKS.PACKAGE_HIDDEN_CHAIN_OF_THOUGHT === false &&
    ER30_LOCKS.OFFLINE_PACKS_PLAINTEXT === false &&
    ER30_LOCKS.ANDROID_SANDBOX_RESPECTED === true &&
    ER30_LOCKS.OFFLINE_PACKS_ENCRYPTED_REVOCABLE === true &&
    ER30_LOCKS.UNINSTALL_REVOKE_PATH_EXPLICIT === true &&
    ER30_LOCKS.BATTERY_LOW_PAUSES_RESEARCH === true &&
    ER30_LOCKS.BYPASS_GUARDIAN_RLS === false &&
    ER30_LOCKS.EXPAND_TENANT_UNIVERSE_ACCESS === false &&
    ER30_LOCKS.AUTO_DEPLOY_CHANGES === false &&
    ER30_LOCKS.AGENT_AUTO_AUTHORITY === false &&
    ER30_LOCKS.RECOMMEND_EQ_ACT === false &&
    ER30_LOCKS.RECOMMEND_EQ_AUTHORIZE === false &&
    ER30_LOCKS.BYPASS_GUARDIAN_RLS_TENANT_UNIVERSE === false &&
    ER30_LOCKS.GUARDIAN_RLS_TENANT_UNIVERSE_ISOLATION_UNCHANGED === true &&
    ER30_LOCKS.HUMAN_APPROVAL_BOUNDARIES_UNCHANGED === true &&
    ER30_LOCKS.DOCUMENTED_EQ_IMPLEMENTED === false &&
    ER30_LOCKS.IMPLEMENTED_EQ_VERIFIED === false &&
    ER30_LOCKS.VERIFIED_EQ_PRODUCTION_AUTHORIZED === false &&
    ER30_LOCKS.HUMAN_APPROVAL_REQUIRED_BEFORE_CONSEQUENTIAL_ACTIONS === true &&
    ER30_LOCKS.TIP_LAND === false &&
    ER30_LOCKS.PRODUCTION_AUTHORIZATION === false &&
    ER30_LOCKS.DB_CANDIDATES_APPLIED === false &&
    ER30_LOCKS.FULL_PRODUCTION_ANDROID_ARM_RUNTIME_PACKAGE_SHIPPED === false &&
    ER30_LOCKS.MANAGE_PULL_REQUEST === false &&
    ANDROID_ARM_TRUTH_BOUNDARY.socSightingIsNotAcceleratorSupport === true &&
    ANDROID_ARM_TRUTH_BOUNDARY.npuVerifyRequiresDetectLoadInferenceReceipt ===
      true &&
    ANDROID_ARM_TRUTH_BOUNDARY.batteryLowPausesResearchAgents === true &&
    ANDROID_ARM_TRUTH_BOUNDARY.basicAccessCannotRequirePersonalTelemetry ===
      true &&
    ANDROID_ARM_TRUTH_BOUNDARY.rootRequired === false &&
    ANDROID_ARM_TRUTH_BOUNDARY.l4AutonomyEnabled === false &&
    ANDROID_ARM_TRUTH_BOUNDARY.mayTipLand === false
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

export function er30SoftWireSnapshot(repoRoot?: string): Er30SoftWireSnapshot {
  const root =
    repoRoot ?? join(dirname(fileURLToPath(import.meta.url)), '../../..');

  return {
    // ER29 / ER28 not yet tip-landed — expect WAITING_DATA until present.
    er29IosPrepStub: softWireFile(
      './ios-apple-runtime-research-types.ts',
      'ER29 predecessor / iOS prep stub PRESENT (soft-wire).',
      'ER29 predecessor absent — soft-wire WAITING_DATA.',
    ),
    er29Report: softWireRepoRelative(
      root,
      'docs/operations/62L_ER29_IOS_APPLE_RUNTIME_RESEARCH_REPORT.md',
      'ER29 report PRESENT.',
      'ER29 report absent — soft-wire WAITING_DATA.',
    ),
    er28PriorMobileStub: softWireFile(
      './mobile-runtime-prep-types.ts',
      'ER28 mobile runtime prep PRESENT (soft-wire).',
      'ER28 mobile runtime prep absent — soft-wire WAITING_DATA.',
    ),
    er28Report: softWireRepoRelative(
      root,
      'docs/operations/62L_ER28_MOBILE_RUNTIME_PREP_REPORT.md',
      'ER28 report PRESENT.',
      'ER28 report absent — soft-wire WAITING_DATA.',
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
    eq2ArmArchitectureKnowledgePack: softWireFile(
      './arm-architecture-knowledge-pack-types.ts',
      'EQ2 ARM Architecture Knowledge Pack PRESENT (soft-wire).',
      'EQ2 ARM Architecture Knowledge Pack absent — soft-wire WAITING_DATA.',
    ),
    eq2Report: softWireRepoRelative(
      root,
      'docs/operations/62L_EQ2_ARM_ARCHITECTURE_KNOWLEDGE_PACK_REPORT.md',
      'EQ2 report PRESENT.',
      'EQ2 report absent — soft-wire WAITING_DATA.',
    ),
    em157HomeBase: softWireFile(
      './agent-compute-home-base-types.ts',
      'EM (#157) Agent Compute Home Base PRESENT (soft-wire).',
      'EM (#157) Agent Compute Home Base absent — soft-wire WAITING_DATA.',
    ),
  };
}

export function softWireHopState(present: boolean): Er30EvidenceState {
  return present ? 'PASS' : 'WAITING_DATA';
}

export function isEr30Agent(actor: Er30Actor): boolean {
  return (
    actor.kind === 'android_arm_runtime_packager' ||
    actor.kind === 'mobile_agent' ||
    actor.kind === 'device_probe'
  );
}

export function isHumanApprover(actor: Er30Actor): boolean {
  return (
    actor.kind === 'human_approver' ||
    actor.kind === 'founder' ||
    actor.kind === 'tenant_admin'
  );
}

export function socSightingIsNotAcceleratorSupport(): boolean {
  return ANDROID_ARM_TRUTH_BOUNDARY.socSightingIsNotAcceleratorSupport;
}

export function batteryLowPausesResearchAgents(): boolean {
  return ANDROID_ARM_TRUTH_BOUNDARY.batteryLowPausesResearchAgents;
}

export function basicAccessCannotRequirePersonalTelemetry(): boolean {
  return ANDROID_ARM_TRUTH_BOUNDARY.basicAccessCannotRequirePersonalTelemetry;
}
