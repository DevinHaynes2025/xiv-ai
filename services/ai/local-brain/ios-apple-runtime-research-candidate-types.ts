/**
 * 62L-ER31 — iOS / Apple Runtime Research Candidate (park-and-implement).
 *
 * Layer: 62L-ER Real API Data Fabric + Global Historical Knowledge Ingestion +
 * Offline/Online Brain Sync + Historical Avatar Simulations + Universal Device
 * Distribution (GitHub #162).
 *
 * Governed Apple runtime research path to evaluate iPhone, iPad, and Apple
 * Silicon devices for local inference, offline search, lightweight agents, and
 * secure sync without bypassing Apple platform rules.
 *
 * Core architecture:
 * iOS/iPadOS/macOS app → device capability profile → Apple Silicon / Neural
 * Engine candidate → Core ML-compatible model path → local knowledge packs →
 * resource governor → encrypted storage → Home Base sync
 *
 * Apple accelerator truth:
 * Neural Engine in public docs ≠ verified. Verification requires:
 * compatible model → actual local load → actual device execution → valid
 * output → performance receipt. Silent CPU/GPU fallback must be recorded.
 *
 * Soft-wire when PRESENT: ER30, ER29, ER28, EQ7. Presence ≠ VERIFIED.
 * Absent → WAITING_DATA (not FAIL).
 *
 * SoT: GitHub #162 / 62L-ER family. GitLab mirror: needsAuth; no number invented.
 *
 * Honesty: DOCUMENTED ≠ IMPLEMENTED ≠ VERIFIED ≠ PRODUCTION AUTHORIZED.
 * L4_AUTONOMY_ENABLED=false. Guardian/RLS/tenant/Universe unchanged.
 * DB candidates NOT_APPLIED. tip-land=NO.
 * Next (report only): ER32 — Edge / Vehicle Runtime Candidate.
 */

import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

export const HONESTY_BANNER =
  'DOCUMENTED ≠ IMPLEMENTED ≠ VERIFIED ≠ PRODUCTION AUTHORIZED' as const;

export const GITHUB_SOT_ISSUE = 162 as const;
export const GITHUB_SOT_LABEL = '62L-ER31' as const;
export const GITHUB_SOT_FAMILY = '62L-ER' as const;
export const GITHUB_SOT_TITLE =
  '62L-ER31 iOS / Apple Runtime Research Candidate — governed iPhone/iPad/Apple Silicon local inference research; Neural Engine docs ≠ verified; no jailbreak/private-API bypass' as const;

export const GITLAB_MIRROR_NOTE =
  'GitLab mirror: search attempted; MCP needsAuth / not resolved in this environment — no issue number invented.' as const;

export const ER31_DB_CANDIDATES_STATUS = 'NOT_APPLIED' as const;

export const ER_LAYER_TITLE =
  '62L-ER Real API Data Fabric + Global Historical Knowledge Ingestion + Offline/Online Brain Sync + Historical Avatar Simulations + Universal Device Distribution' as const;

export const NEXT_PHASE_TITLE =
  'ER32 — Edge / Vehicle Runtime Candidate — governed edge and vehicle runtime research path for local inference under platform and safety constraints.' as const;

/**
 * Core architecture hops.
 */
export const APPLE_RUNTIME_ARCHITECTURE = [
  'ios_ipados_macos_app',
  'device_capability_profile',
  'apple_silicon_neural_engine_candidate',
  'core_ml_compatible_model_path',
  'local_knowledge_packs',
  'resource_governor',
  'encrypted_storage',
  'home_base_sync',
] as const;

/**
 * Apple runtime profile fields.
 */
export const APPLE_RUNTIME_PROFILE_FIELDS = [
  'packageId',
  'osName',
  'osVersion',
  'deviceFamily',
  'appleChipGeneration',
  'cpuCapabilityState',
  'gpuCapabilityState',
  'neuralEngineCapabilityState',
  'supportedModelRuntimeFormats',
  'memoryLimitMb',
  'storageLimitMb',
  'batteryState',
  'thermalState',
  'permissions',
  'localOfflineFeatures',
  'packageVersion',
  'signatureVersion',
  'benchmarkRefs',
  'verificationState',
] as const;

export type AppleRuntimeProfileField =
  (typeof APPLE_RUNTIME_PROFILE_FIELDS)[number];

/**
 * Required capability / verification states.
 */
export const APPLE_RUNTIME_STATES = [
  'DOCUMENTED',
  'DETECTED',
  'SUPPORTED',
  'VERIFIED',
  'NOT_TESTED',
  'DEGRADED',
  'UNAVAILABLE',
] as const;

export type AppleRuntimeState = (typeof APPLE_RUNTIME_STATES)[number];

export type AppleDeviceFamily = 'iphone' | 'ipad' | 'mac_apple_silicon' | 'other_apple';

export type AppleOsName = 'iOS' | 'iPadOS' | 'macOS';

/**
 * First candidate workloads (MAY).
 */
export const APPLE_FIRST_CANDIDATE_WORKLOADS = [
  'embeddings',
  'local_semantic_search',
  'classification',
  'summarization',
  'lightweight_multimodal_inference',
  'personal_knowledge_retrieval',
  'offline_business_briefs',
  'agent_checkpoints',
] as const;

export type AppleFirstCandidateWorkload =
  (typeof APPLE_FIRST_CANDIDATE_WORKLOADS)[number];

/**
 * Heavy workloads route elsewhere unless device proven suitable.
 */
export const APPLE_HEAVY_WORKLOADS_ROUTE_ELSEWHERE = [
  'heavy_training',
  'large_simulations',
] as const;

/**
 * Neural Engine verification chain (all required for VERIFIED).
 */
export const NEURAL_ENGINE_VERIFICATION_CHAIN = [
  'compatible_model',
  'actual_local_load',
  'actual_device_execution',
  'valid_output',
  'performance_receipt',
] as const;

export type NeuralEngineVerificationHop =
  (typeof NEURAL_ENGINE_VERIFICATION_CHAIN)[number];

/**
 * Supported model / runtime formats (research candidates).
 */
export const APPLE_MODEL_RUNTIME_FORMATS = [
  'core_ml',
  'ml_program',
  'ane_compatible',
  'cpu_fallback',
  'gpu_fallback',
] as const;

/**
 * Privacy model.
 */
export const APPLE_PRIVACY_MODEL = Object.freeze({
  personalPrivateWorkloadOnDeviceWhenVerified: true as const,
  honorAppSandboxing: true as const,
  honorConsent: true as const,
  honorSystemPermissions: true as const,
  honorPlatformDistributionRules: true as const,
});

/**
 * Offline brain freshness rule.
 */
export const APPLE_OFFLINE_FRESHNESS_RULE = Object.freeze({
  approvedEncryptedPacksUsefulWithoutConnectivity: true as const,
  cachedDataRetainsTrueFreshness: true as const,
  denyStaleAsCurrent: true as const,
});

export const IOS_APPLE_RUNTIME_RESEARCH_CYCLE = [
  'honesty_locks',
  'ios_apple_runtime_research_bootstrap',
  // A — Structure
  'architecture_encoded',
  'profile_fields_encoded',
  'runtime_states_encoded',
  'first_candidate_workloads_encoded',
  'neural_engine_verification_chain_encoded',
  'privacy_model_encoded',
  'offline_freshness_rule_encoded',
  // B — Truth
  'neural_engine_docs_neq_verified',
  'verify_only_after_full_chain',
  'silent_cpu_gpu_fallback_recorded',
  'heavy_workloads_route_elsewhere_unless_proven',
  'offline_freshness_retention',
  // C — Denies
  'deny_jailbreak_root_assumptions',
  'deny_private_api_exploitation',
  'deny_os_security_bypass',
  'deny_covert_camera_microphone_location',
  'deny_unauthorized_persistent_background',
  'deny_cross_tenant_private_data_pooling',
  'deny_unsigned_unversioned_updates',
  'deny_stale_as_current',
  'deny_neural_engine_verified_from_docs_only',
  'deny_hidden_chain_of_thought',
  // D — Autonomy
  'guardian_rls_tenant_universe_isolation',
  'recommend_neq_act',
  'l4_autonomy_false',
  // E — Soft-wires
  'er30_soft_wire',
  'er29_soft_wire',
  'er28_soft_wire',
  'eq7_soft_wire',
  'db_candidates_not_applied',
  'evidence',
] as const;

export type Er31Hop = (typeof IOS_APPLE_RUNTIME_RESEARCH_CYCLE)[number];

export type Er31EvidenceState =
  | 'PASS'
  | 'FAIL'
  | 'UNAVAILABLE'
  | 'DENIED'
  | 'REJECTED'
  | 'CANDIDATE'
  | 'DOCUMENTED'
  | 'DETECTED'
  | 'SUPPORTED'
  | 'IMPLEMENTED'
  | 'AVAILABLE'
  | 'VERIFIED'
  | 'NOT_TESTED'
  | 'DEGRADED'
  | 'PRODUCTION_AUTHORIZED'
  | 'RECOMMENDATION_ONLY'
  | 'PLAN_ONLY'
  | 'BOUNDED'
  | 'NOT_APPLIED'
  | 'NOT_AVAILABLE'
  | 'NOT_VERIFIED'
  | 'WAITING_DATA'
  | 'ADVISORY_ONLY'
  | 'REGISTERED'
  | 'HUMAN_APPROVAL_REQUIRED'
  | 'UNVERIFIED'
  | 'PARTIAL'
  | 'UNKNOWN';

export type Er31HopRecord = {
  hop: Er31Hop;
  state: Er31EvidenceState;
  summary: string;
  at: string;
};

export type Er31ActorKind =
  | 'apple_runtime_researcher'
  | 'device_profiler'
  | 'neural_engine_verifier'
  | 'offline_pack_consumer'
  | 'proposal'
  | 'human_approver'
  | 'founder'
  | 'guardian'
  | 'home_base'
  | 'tenant_admin';

export type Er31Actor = {
  kind: Er31ActorKind;
  id: string;
  orgId: string;
  tenantId: string;
  universeId: string;
  permissions: readonly string[];
};

export const ER31_LOCKS = Object.freeze({
  L4_AUTONOMY_ENABLED: false as const,
  TIP_LAND: false as const,
  PRODUCTION_AUTHORIZATION: false as const,
  PRODUCTION_WRITE: false as const,
  DB_CANDIDATES_APPLIED: false as const,
  FULL_PRODUCTION_IOS_APPLE_RUNTIME_SHIPPED: false as const,
  MANAGE_PULL_REQUEST: false as const,

  // Apple platform security
  JAILBREAK_ROOT_ASSUMPTIONS: false as const,
  PRIVATE_API_EXPLOITATION: false as const,
  OS_SECURITY_BYPASS: false as const,
  COVERT_CAMERA_MICROPHONE_LOCATION_COLLECTION: false as const,
  UNAUTHORIZED_PERSISTENT_BACKGROUND_EXECUTION: false as const,
  CROSS_TENANT_PRIVATE_DATA_POOLING: false as const,
  UNSIGNED_UNVERSIONED_UPDATES: false as const,
  HIDDEN_CHAIN_OF_THOUGHT_IN_ER31: false as const,

  // Accelerator honesty
  NEURAL_ENGINE_DOCS_EQ_VERIFIED: false as const,
  VERIFY_WITHOUT_FULL_CHAIN: false as const,
  SILENT_CPU_GPU_FALLBACK_UNRECORDED: false as const,
  STALE_AS_CURRENT: false as const,
  HEAVY_TRAINING_ON_UNPROVEN_DEVICE: false as const,

  // Autonomy
  AGENT_AUTO_AUTHORITY: false as const,
  RECOMMEND_EQ_ACT: false as const,
  RECOMMEND_EQ_AUTHORIZE: false as const,

  // Isolation
  BYPASS_GUARDIAN_RLS_TENANT_UNIVERSE: false as const,
  GUARDIAN_RLS_TENANT_UNIVERSE_ISOLATION_UNCHANGED: true as const,
  HUMAN_APPROVAL_BOUNDARIES_UNCHANGED: true as const,

  // Honesty ladder
  DOCUMENTED_EQ_IMPLEMENTED: false as const,
  IMPLEMENTED_EQ_VERIFIED: false as const,
  VERIFIED_EQ_PRODUCTION_AUTHORIZED: false as const,

  HUMAN_APPROVAL_REQUIRED_BEFORE_CONSEQUENTIAL_ACTIONS: true as const,
  SIGNED_VERSIONED_UPDATES_AND_REVOCATION: true as const,
});

export const ER31_AGENT_BOUNDS = Object.freeze({
  mayCreateAppleRuntimeProfiles: true as const,
  mayResearchCoreMlCompatiblePaths: true as const,
  mayRecordNeuralEngineVerificationChain: true as const,
  mayRecordSilentCpuGpuFallback: true as const,
  mayConsumeApprovedEncryptedOfflinePacks: true as const,
  mayReturnEvidenceToHomeBase: true as const,
  automaticAuthority: false as const,
  mayAssumeJailbreakOrRoot: false as const,
  mayExploitPrivateApis: false as const,
  mayBypassOsSecurity: false as const,
  mayCovertlyCollectCameraMicLocation: false as const,
  mayRunUnauthorizedPersistentBackground: false as const,
  mayPoolCrossTenantPrivateData: false as const,
  mayShipUnsignedUnversionedUpdates: false as const,
  mayClaimNeuralEngineVerifiedFromDocsOnly: false as const,
  mayPretendStaleIsCurrent: false as const,
  mayRunHeavyTrainingOnUnprovenDevice: false as const,
  mayIncludeHiddenChainOfThought: false as const,
  mayRecommendOnly: true as const,
});

export const ER31_MAY = Object.freeze([
  'create_apple_device_capability_profiles',
  'research_core_ml_compatible_model_paths',
  'verify_neural_engine_only_after_full_execution_chain',
  'record_silent_cpu_gpu_fallback',
  'run_first_candidate_workloads_when_supported',
  'use_approved_encrypted_offline_packs_with_true_freshness',
  'sync_evidence_to_home_base_under_guardian_rls',
] as const);

export const ER31_MUST_NOT = Object.freeze([
  'assume_jailbreak_or_root',
  'exploit_private_apis_or_bypass_os_security',
  'covertly_collect_camera_microphone_or_location',
  'run_unauthorized_persistent_background_execution',
  'pool_cross_tenant_private_data',
  'ship_unsigned_or_unversioned_updates_without_revocation',
  'claim_neural_engine_verified_from_public_docs_alone',
  'pretend_stale_cached_data_is_current',
  'route_heavy_training_to_unproven_apple_devices',
  'store_hidden_chain_of_thought',
  'bypass_guardian_rls_tenant_universe',
  'treat_recommend_as_act',
  'grant_agents_automatic_authority',
] as const);

export type SoftWirePresence = {
  present: boolean;
  pathChecked: string;
  note: string;
};

export type Er31SoftWireSnapshot = {
  er30AndroidArmRuntimePackage: SoftWirePresence;
  er30Report: SoftWirePresence;
  er29WindowsRuntimePackageCandidate: SoftWirePresence;
  er29Report: SoftWirePresence;
  er28UniversalRuntimePackageContract: SoftWirePresence;
  er28Report: SoftWirePresence;
  eq7ArmEdgeAmdAcceleration: SoftWirePresence;
  eq7Report: SoftWirePresence;
};

export function assertEr31LocksIntact(): boolean {
  return (
    ER31_LOCKS.L4_AUTONOMY_ENABLED === false &&
    ER31_LOCKS.JAILBREAK_ROOT_ASSUMPTIONS === false &&
    ER31_LOCKS.PRIVATE_API_EXPLOITATION === false &&
    ER31_LOCKS.OS_SECURITY_BYPASS === false &&
    ER31_LOCKS.COVERT_CAMERA_MICROPHONE_LOCATION_COLLECTION === false &&
    ER31_LOCKS.UNAUTHORIZED_PERSISTENT_BACKGROUND_EXECUTION === false &&
    ER31_LOCKS.CROSS_TENANT_PRIVATE_DATA_POOLING === false &&
    ER31_LOCKS.UNSIGNED_UNVERSIONED_UPDATES === false &&
    ER31_LOCKS.HIDDEN_CHAIN_OF_THOUGHT_IN_ER31 === false &&
    ER31_LOCKS.NEURAL_ENGINE_DOCS_EQ_VERIFIED === false &&
    ER31_LOCKS.VERIFY_WITHOUT_FULL_CHAIN === false &&
    ER31_LOCKS.SILENT_CPU_GPU_FALLBACK_UNRECORDED === false &&
    ER31_LOCKS.STALE_AS_CURRENT === false &&
    ER31_LOCKS.HEAVY_TRAINING_ON_UNPROVEN_DEVICE === false &&
    ER31_LOCKS.AGENT_AUTO_AUTHORITY === false &&
    ER31_LOCKS.RECOMMEND_EQ_ACT === false &&
    ER31_LOCKS.RECOMMEND_EQ_AUTHORIZE === false &&
    ER31_LOCKS.BYPASS_GUARDIAN_RLS_TENANT_UNIVERSE === false &&
    ER31_LOCKS.GUARDIAN_RLS_TENANT_UNIVERSE_ISOLATION_UNCHANGED === true &&
    ER31_LOCKS.HUMAN_APPROVAL_BOUNDARIES_UNCHANGED === true &&
    ER31_LOCKS.DOCUMENTED_EQ_IMPLEMENTED === false &&
    ER31_LOCKS.IMPLEMENTED_EQ_VERIFIED === false &&
    ER31_LOCKS.VERIFIED_EQ_PRODUCTION_AUTHORIZED === false &&
    ER31_LOCKS.HUMAN_APPROVAL_REQUIRED_BEFORE_CONSEQUENTIAL_ACTIONS === true &&
    ER31_LOCKS.SIGNED_VERSIONED_UPDATES_AND_REVOCATION === true &&
    ER31_LOCKS.TIP_LAND === false &&
    ER31_LOCKS.PRODUCTION_AUTHORIZATION === false &&
    ER31_LOCKS.DB_CANDIDATES_APPLIED === false &&
    ER31_LOCKS.FULL_PRODUCTION_IOS_APPLE_RUNTIME_SHIPPED === false &&
    ER31_LOCKS.MANAGE_PULL_REQUEST === false &&
    APPLE_PRIVACY_MODEL.honorAppSandboxing === true &&
    APPLE_OFFLINE_FRESHNESS_RULE.denyStaleAsCurrent === true &&
    ER31_AGENT_BOUNDS.automaticAuthority === false &&
    ER31_AGENT_BOUNDS.mayAssumeJailbreakOrRoot === false &&
    ER31_AGENT_BOUNDS.mayExploitPrivateApis === false &&
    ER31_AGENT_BOUNDS.mayClaimNeuralEngineVerifiedFromDocsOnly === false &&
    ER31_AGENT_BOUNDS.mayPretendStaleIsCurrent === false &&
    ER31_AGENT_BOUNDS.mayIncludeHiddenChainOfThought === false
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

export function er31SoftWireSnapshot(repoRoot?: string): Er31SoftWireSnapshot {
  const root =
    repoRoot ?? join(dirname(fileURLToPath(import.meta.url)), '../../..');

  return {
    er30AndroidArmRuntimePackage: softWireFile(
      './android-arm-runtime-package-types.ts',
      'ER30 Android ARM Runtime Package PRESENT (soft-wire).',
      'ER30 Android ARM Runtime Package absent — soft-wire WAITING_DATA.',
    ),
    er30Report: softWireRepoRelative(
      root,
      'docs/operations/62L_ER30_ANDROID_ARM_RUNTIME_PACKAGE_REPORT.md',
      'ER30 report PRESENT.',
      'ER30 report absent — soft-wire WAITING_DATA.',
    ),
    er29WindowsRuntimePackageCandidate: softWireFile(
      './windows-runtime-package-candidate-types.ts',
      'ER29 Windows Runtime Package Candidate PRESENT (soft-wire).',
      'ER29 Windows Runtime Package Candidate absent — soft-wire WAITING_DATA.',
    ),
    er29Report: softWireRepoRelative(
      root,
      'docs/operations/62L_ER29_WINDOWS_RUNTIME_PACKAGE_CANDIDATE_REPORT.md',
      'ER29 report PRESENT.',
      'ER29 report absent — soft-wire WAITING_DATA.',
    ),
    er28UniversalRuntimePackageContract: softWireFile(
      './universal-runtime-package-contract-types.ts',
      'ER28 Universal Runtime Package Contract PRESENT (soft-wire).',
      'ER28 Universal Runtime Package Contract absent — soft-wire WAITING_DATA.',
    ),
    er28Report: softWireRepoRelative(
      root,
      'docs/operations/62L_ER28_UNIVERSAL_RUNTIME_PACKAGE_CONTRACT_REPORT.md',
      'ER28 report PRESENT.',
      'ER28 report absent — soft-wire WAITING_DATA.',
    ),
    eq7ArmEdgeAmdAcceleration: softWireFile(
      './arm-edge-amd-acceleration-types.ts',
      'EQ7 ARM Edge/Phone + AMD Acceleration PRESENT (soft-wire).',
      'EQ7 ARM Edge/Phone + AMD Acceleration absent — soft-wire WAITING_DATA.',
    ),
    eq7Report: softWireRepoRelative(
      root,
      'docs/operations/62L_EQ7_ARM_EDGE_AMD_ACCELERATION_REPORT.md',
      'EQ7 report PRESENT.',
      'EQ7 report absent — soft-wire WAITING_DATA.',
    ),
  };
}

export function isHumanApprover(actor: Er31Actor): boolean {
  return (
    actor.kind === 'human_approver' ||
    actor.kind === 'founder' ||
    actor.kind === 'tenant_admin'
  );
}

export function isEr31Agent(actor: Er31Actor): boolean {
  const agents: readonly Er31ActorKind[] = [
    'apple_runtime_researcher',
    'device_profiler',
    'neural_engine_verifier',
    'offline_pack_consumer',
    'proposal',
  ];
  return agents.includes(actor.kind);
}

/**
 * Public docs mentioning Neural Engine do not equal VERIFIED.
 */
export function neuralEngineDocsImplyVerified(): false {
  return false;
}

/**
 * Neural Engine VERIFIED only after the full chain completes.
 */
export function canClaimNeuralEngineVerified(input: {
  compatibleModel: boolean;
  actualLocalLoad: boolean;
  actualDeviceExecution: boolean;
  validOutput: boolean;
  performanceReceipt: boolean;
  claimedFromPublicDocsOnly?: boolean;
}): boolean {
  if (input.claimedFromPublicDocsOnly) return false;
  return (
    input.compatibleModel &&
    input.actualLocalLoad &&
    input.actualDeviceExecution &&
    input.validOutput &&
    input.performanceReceipt
  );
}

/**
 * Cached offline data must retain true freshness — never stale-as-current.
 */
export function mayTreatStaleAsCurrent(): false {
  return false;
}
