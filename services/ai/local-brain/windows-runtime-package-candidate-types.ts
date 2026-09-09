/**
 * 62L-ER29 — Windows Runtime Package Candidate (park-and-implement).
 *
 * Layer: 62L-ER Real API Data Fabric + Global Historical Knowledge Ingestion +
 * Offline/Online Brain Sync + Historical Avatar Simulations + Universal Device
 * Distribution (GitHub #162).
 *
 * ASUS/Windows becomes the first concrete local-runtime package candidate
 * proving installation, hardware detection, local inference, offline search,
 * agent heartbeat, and safe sync on one real device class before expanding
 * broadly.
 *
 * Core package chain:
 * Windows Runtime → hardware truth probe → AMD-aware Virtual Chip adapter →
 * CPU-safe fallback → local model runtime → offline brain packs →
 * agent scheduler → resource governor → audit/receipts → Home Base sync
 *
 * ASUS-specific truth: discover actual machine configuration — do NOT assume
 * AMD CPU / Radeon GPU / Ryzen AI NPU exist or work. Machine profile determines
 * capability. No accelerator state becomes verified automatically.
 *
 * Soft-wire when PRESENT: ER28 Universal Runtime Package Contract (strong),
 * EQ7 ARM edge/AMD accel, ASUS/Windows local-runtime (EL7/EL probe/ONNX),
 * EP6 hardware truth probe, Virtual Chip, AMD adapter, ER14 offline packs,
 * EL9 governor, EM Home Base. Presence ≠ VERIFIED. Absent → WAITING_DATA.
 *
 * SoT: GitHub #162 / 62L-ER family. GitLab mirror: needsAuth; no number invented.
 *
 * Honesty: DOCUMENTED ≠ IMPLEMENTED ≠ VERIFIED ≠ PRODUCTION AUTHORIZED.
 * L4_AUTONOMY_ENABLED=false. Guardian/RLS/tenant/Universe unchanged.
 * DB candidates NOT_APPLIED. tip-land=NO.
 * Next (report only): ER30 — Android / ARM Runtime Package Candidate.
 */

import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

export const HONESTY_BANNER =
  'DOCUMENTED ≠ IMPLEMENTED ≠ VERIFIED ≠ PRODUCTION AUTHORIZED' as const;

export const GITHUB_SOT_ISSUE = 162 as const;
export const GITHUB_SOT_LABEL = '62L-ER29' as const;
export const GITHUB_SOT_FAMILY = '62L-ER' as const;
export const GITHUB_SOT_TITLE =
  '62L-ER29 Windows Runtime Package Candidate — ASUS/Windows first local-runtime package; install + probe + CPU inference + offline + sync; no auto GPU/NPU VERIFIED' as const;

export const GITLAB_MIRROR_NOTE =
  'GitLab mirror: search attempted; MCP needsAuth / not resolved in this environment — no issue number invented.' as const;

export const ER29_DB_CANDIDATES_STATUS = 'NOT_APPLIED' as const;

export const ER_LAYER_TITLE =
  '62L-ER Real API Data Fabric + Global Historical Knowledge Ingestion + Offline/Online Brain Sync + Historical Avatar Simulations + Universal Device Distribution' as const;

export const NEXT_PHASE_TITLE =
  'ER30 — Android / ARM Runtime Package Candidate — first concrete ARM/Android local-runtime package proving install, hardware probe, local inference, offline features, and safe Home Base sync on one device class.' as const;

/**
 * Build record fields for a Windows runtime package candidate.
 */
export const WINDOWS_RUNTIME_BUILD_RECORD_FIELDS = [
  'packageId',
  'windowsBuildVersion',
  'architecture',
  'cpu',
  'gpu',
  'npuState',
  'runtimeDependencies',
  'modelDependencies',
  'storageFootprint',
  'requiredPermissions',
  'offlineFeatures',
  'networkRequirements',
  'installerVersion',
  'signatureHash',
  'rollbackVersion',
  'compatibilityState',
  'testEvidence',
] as const;

export type WindowsRuntimeBuildRecordField =
  (typeof WINDOWS_RUNTIME_BUILD_RECORD_FIELDS)[number];

/**
 * Required package / verification states.
 * No accelerator state becomes verified automatically.
 */
export const WINDOWS_RUNTIME_PACKAGE_STATES = [
  'BUILD_CANDIDATE',
  'INSTALL_NOT_TESTED',
  'INSTALLED',
  'RUNTIME_STARTED',
  'CPU_VERIFIED',
  'GPU_VERIFIED',
  'NPU_VERIFIED',
  'OFFLINE_VERIFIED',
  'SYNC_VERIFIED',
  'DEGRADED',
  'FAILED',
] as const;

export type WindowsRuntimePackageState =
  (typeof WINDOWS_RUNTIME_PACKAGE_STATES)[number];

/**
 * Core package chain (ordered).
 */
export const WINDOWS_RUNTIME_PACKAGE_CHAIN = [
  'windows_runtime',
  'hardware_truth_probe',
  'amd_aware_virtual_chip_adapter',
  'cpu_safe_fallback',
  'local_model_runtime',
  'offline_brain_packs',
  'agent_scheduler',
  'resource_governor',
  'audit_receipts',
  'home_base_sync',
] as const;

export type WindowsRuntimePackageChainHop =
  (typeof WINDOWS_RUNTIME_PACKAGE_CHAIN)[number];

/**
 * First verification sequence (ordered evidence gates).
 */
export const WINDOWS_RUNTIME_VERIFICATION_SEQUENCE = [
  'install_only_on_explicitly_authorized_test_device',
  'privacy_minimal_hardware_probe',
  'verify_runtime_heartbeat',
  'run_cpu_baseline_inference',
  'test_amd_gpu_npu_only_when_compatible_paths_exist',
  'load_small_approved_offline_knowledge_pack',
  'local_search_retrieval',
  'disconnect_network_retest_approved_offline_features',
  'reconnect_test_safe_home_base_sync',
  'record_all_evidence_and_failures',
] as const;

export type WindowsRuntimeVerificationStep =
  (typeof WINDOWS_RUNTIME_VERIFICATION_SEQUENCE)[number];

/**
 * Installation safeguards (locks — all must remain denied/false where harmful).
 */
export const WINDOWS_RUNTIME_INSTALL_SAFEGUARDS = Object.freeze({
  noSilentStartupPersistence: true as const,
  noBiosFirmwareChanges: true as const,
  noAutomaticDriverReplacement: true as const,
  noOverclocking: true as const,
  noUnrelatedFileAccess: true as const,
  noCredentialCollection: true as const,
  explicitUninstallPath: true as const,
  signedVersionedUpdates: true as const,
  rollbackSupport: true as const,
});

/**
 * ASUS truth rule — never assume AMD CPU / Radeon GPU / Ryzen AI NPU.
 */
export const ASUS_MACHINE_TRUTH_RULE = Object.freeze({
  discoverActualConfiguration: true as const,
  assumeAmdCpu: false as const,
  assumeRadeonGpu: false as const,
  assumeRyzenAiNpu: false as const,
  assumeAcceleratorsWork: false as const,
  machineProfileDeterminesCapability: true as const,
  autoVerifyGpu: false as const,
  autoVerifyNpu: false as const,
});

/**
 * Agent heartbeat / power behavior.
 */
export const WINDOWS_RUNTIME_AGENT_BEHAVIOR = Object.freeze({
  runningVerifiedRequiresFreshHeartbeat: true as const,
  asleepOrOffMeansWaitingNodeOrOfflineStopped: true as const,
  mayClaimContinuedLocalWorkAfterShutdown: false as const,
});

export type WindowsAgentRuntimeStatus =
  | 'RUNNING_VERIFIED'
  | 'WAITING_NODE'
  | 'OFFLINE_STOPPED'
  | 'ASLEEP'
  | 'HEARTBEAT_STALE';

export type AcceleratorEvidenceState =
  | 'NOT_TESTED'
  | 'COMPATIBLE_PATH_ABSENT'
  | 'MEASURED_PASS'
  | 'MEASURED_FAIL'
  | 'WAITING_DATA';

export type HardwareProbeProfile = {
  probeId: string;
  privacyMinimal: true;
  windowsBuildVersion: string;
  architecture: string;
  cpuVendor: string | null;
  cpuModel: string | null;
  gpuVendor: string | null;
  gpuModel: string | null;
  npuPresent: boolean | null;
  npuVendor: string | null;
  assumedAmdWithoutProbe: false;
  assumedRadeonWithoutProbe: false;
  assumedRyzenAiWithoutProbe: false;
};

export type WindowsRuntimeBuildRecord = {
  packageId: string;
  windowsBuildVersion: string;
  architecture: string;
  cpu: string | null;
  gpu: string | null;
  npuState: AcceleratorEvidenceState;
  runtimeDependencies: readonly string[];
  modelDependencies: readonly string[];
  storageFootprintBytes: number;
  requiredPermissions: readonly string[];
  offlineFeatures: readonly string[];
  networkRequirements: readonly string[];
  installerVersion: string;
  signatureHash: string | null;
  rollbackVersion: string | null;
  compatibilityState: string;
  testEvidence: readonly string[];
  packageState: WindowsRuntimePackageState;
  gpuState: AcceleratorEvidenceState;
  cpuState: AcceleratorEvidenceState | 'MEASURED_PASS' | 'NOT_TESTED';
  authorizedTestDeviceId: string | null;
  installed: boolean;
  runtimeStarted: boolean;
  tenantId: string;
  universeId: string;
  orgId: string;
};

export type WindowsVerificationEvidence = {
  step: WindowsRuntimeVerificationStep;
  state:
    | 'PASS'
    | 'DENIED'
    | 'WAITING_DATA'
    | 'NOT_TESTED'
    | 'FAILED'
    | 'SKIPPED_INCOMPATIBLE';
  summary: string;
  at: string;
};

export const WINDOWS_RUNTIME_SUCCESS_DEFINITION = Object.freeze({
  oneWindowsMachine: true as const,
  safeInstallation: true as const,
  localCpuInference: true as const,
  offlineKnowledgeSearch: true as const,
  governedAgentExecution: true as const,
  evidenceReceipts: true as const,
  cleanSyncBackToHomeBase: true as const,
  gpuNpuOnlyWhenMeasured: true as const,
});

export const WINDOWS_RUNTIME_PACKAGE_CANDIDATE_CYCLE = [
  'honesty_locks',
  'windows_runtime_package_bootstrap',
  // A — Structure
  'build_record_fields_encoded',
  'package_states_encoded',
  'package_chain_encoded',
  'verification_sequence_encoded',
  'install_safeguards_encoded',
  'asus_truth_rule_encoded',
  'agent_behavior_encoded',
  'success_definition_encoded',
  // B — Truth / verification
  'create_build_candidate',
  'deny_install_without_authorized_device',
  'privacy_minimal_hardware_probe',
  'deny_assume_asus_amd_npu_without_probe',
  'runtime_heartbeat_running_verified',
  'deny_claim_work_after_shutdown',
  'cpu_baseline_inference',
  'cpu_safe_fallback',
  'deny_auto_gpu_verified',
  'deny_auto_npu_verified',
  'gpu_npu_only_when_compatible_paths',
  'load_approved_offline_pack',
  'local_search_retrieval',
  'offline_retest_when_disconnected',
  'safe_home_base_sync',
  'record_evidence_and_failures',
  // C — Install / safety denies
  'deny_silent_startup_persistence',
  'deny_bios_firmware_changes',
  'deny_automatic_driver_replacement',
  'deny_overclocking',
  'deny_unrelated_file_access',
  'deny_credential_collection',
  'deny_bypass_guardian_rls',
  'deny_expand_tenant_universe_access',
  'deny_auto_deploy_changes',
  // D — Autonomy
  'guardian_rls_tenant_universe_isolation',
  'recommend_neq_act',
  'l4_autonomy_false',
  // E — Soft-wires
  'er_layer_context_documented',
  'er28_soft_wire',
  'er14_soft_wire',
  'er2_soft_wire',
  'er1_soft_wire',
  'eq7_soft_wire',
  'ep6_hardware_truth_probe_soft_wire',
  'virtual_chip_soft_wire',
  'amd_adapter_soft_wire',
  'el7_windows_local_runtime_soft_wire',
  'el_windows_probe_brief_soft_wire',
  'onnx_windows_ml_soft_wire',
  'el9_resource_governor_soft_wire',
  'asus_specific_local_runtime_soft_wire',
  'em157_soft_wire',
  'db_candidates_not_applied',
  'evidence',
] as const;

export type Er29Hop = (typeof WINDOWS_RUNTIME_PACKAGE_CANDIDATE_CYCLE)[number];

export type Er29EvidenceState =
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
  | 'BUILD_CANDIDATE'
  | 'INSTALL_NOT_TESTED'
  | 'RUNNING_VERIFIED'
  | 'OFFLINE_STOPPED'
  | 'WAITING_NODE'
  | 'SKIPPED_INCOMPATIBLE';

export type Er29HopRecord = {
  hop: Er29Hop;
  state: Er29EvidenceState;
  summary: string;
  at: string;
};

export type Er29ActorKind =
  | 'windows_runtime_packager'
  | 'local_runtime_agent'
  | 'hardware_probe'
  | 'human_approver'
  | 'founder'
  | 'tenant_admin'
  | 'test_device_owner';

export type Er29Actor = {
  kind: Er29ActorKind;
  id: string;
  orgId: string;
  tenantId: string;
  universeId: string;
  permissions: readonly string[];
};

export const ER29_LOCKS = Object.freeze({
  L4_AUTONOMY_ENABLED: false as const,
  AUTO_VERIFY_GPU: false as const,
  AUTO_VERIFY_NPU: false as const,
  ASSUME_ASUS_AMD_CPU_WITHOUT_PROBE: false as const,
  ASSUME_ASUS_RADEON_GPU_WITHOUT_PROBE: false as const,
  ASSUME_ASUS_RYZEN_AI_NPU_WITHOUT_PROBE: false as const,
  SILENT_STARTUP_PERSISTENCE: false as const,
  BIOS_FIRMWARE_CHANGES: false as const,
  AUTOMATIC_DRIVER_REPLACEMENT: false as const,
  OVERCLOCKING: false as const,
  UNRELATED_FILE_ACCESS: false as const,
  CREDENTIAL_COLLECTION: false as const,
  INSTALL_WITHOUT_AUTHORIZED_TEST_DEVICE: false as const,
  CLAIM_CONTINUED_WORK_AFTER_SHUTDOWN: false as const,
  RUNNING_VERIFIED_WITHOUT_FRESH_HEARTBEAT: false as const,
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
  TIP_LAND: false as const,
  PRODUCTION_AUTHORIZATION: false as const,
  DB_CANDIDATES_APPLIED: false as const,
  FULL_PRODUCTION_WINDOWS_RUNTIME_PACKAGE_SHIPPED: false as const,
  MANAGE_PULL_REQUEST: false as const,
  EXPLICIT_UNINSTALL_PATH: true as const,
  SIGNED_VERSIONED_UPDATES: true as const,
  ROLLBACK_SUPPORT: true as const,
});

export const ER29_MAY = Object.freeze([
  'create_build_candidate_with_full_build_record',
  'install_only_on_explicitly_authorized_test_device',
  'run_privacy_minimal_hardware_probe',
  'verify_runtime_heartbeat_for_RUNNING_VERIFIED',
  'run_cpu_baseline_inference_and_cpu_safe_fallback',
  'test_amd_gpu_npu_only_when_compatible_runtime_model_paths_exist',
  'load_small_approved_offline_knowledge_pack',
  'local_search_retrieval_and_offline_retest',
  'safe_home_base_sync_with_evidence_receipts',
  'record_all_evidence_and_failures',
] as const);

export const ER29_MUST_NOT = Object.freeze([
  'auto_mark_gpu_or_npu_verified_without_measurement',
  'assume_asus_amd_cpu_radeon_gpu_or_ryzen_ai_npu_without_probe',
  'silent_startup_persistence',
  'bios_or_firmware_changes',
  'automatic_driver_replacement',
  'overclocking',
  'unrelated_file_access',
  'credential_collection',
  'install_without_explicitly_authorized_test_device',
  'claim_continued_local_work_after_shutdown',
  'claim_RUNNING_VERIFIED_without_fresh_heartbeat',
  'bypass_guardian_rls_or_expand_tenant_universe_access',
  'auto_deploy_changes',
  'treat_recommend_as_act',
  'grant_agents_automatic_authority',
] as const);

export const ER29_AGENT_BOUNDS = Object.freeze({
  mayAutoVerifyGpu: false as const,
  mayAutoVerifyNpu: false as const,
  mayAssumeAsusAmdWithoutProbe: false as const,
  mayClaimWorkAfterShutdown: false as const,
  maySilentStartupPersistence: false as const,
  mayCollectCredentials: false as const,
  automaticAuthority: false as const,
  recommendEqualsAct: false as const,
});

export type SoftWirePresence = {
  present: boolean;
  pathChecked: string;
  note: string;
};

export type Er29SoftWireSnapshot = {
  er28UniversalRuntimePackageContract: SoftWirePresence;
  er28Report: SoftWirePresence;
  er14OfflineBrainPackager: SoftWirePresence;
  er14Report: SoftWirePresence;
  er2ApiTruthStateMachine: SoftWirePresence;
  er2Report: SoftWirePresence;
  er1RealApiConnectionRegistry: SoftWirePresence;
  er1Report: SoftWirePresence;
  eq7ArmEdgeAmdAcceleration: SoftWirePresence;
  eq7Report: SoftWirePresence;
  ep6LocalHardwareTruthProbe: SoftWirePresence;
  ep6Report: SoftWirePresence;
  virtualChipContract: SoftWirePresence;
  amdAdapterResearchPath: SoftWirePresence;
  el7WindowsLocalRuntime: SoftWirePresence;
  el7Report: SoftWirePresence;
  elWindowsHardwareProbeBrief: SoftWirePresence;
  onnxWindowsMlAdapter: SoftWirePresence;
  el9ResourceGovernor: SoftWirePresence;
  el9Report: SoftWirePresence;
  asusSpecificLocalRuntime: SoftWirePresence;
  em157HomeBase: SoftWirePresence;
};

export function assertEr29LocksIntact(): boolean {
  return (
    ER29_LOCKS.L4_AUTONOMY_ENABLED === false &&
    ER29_LOCKS.AUTO_VERIFY_GPU === false &&
    ER29_LOCKS.AUTO_VERIFY_NPU === false &&
    ER29_LOCKS.ASSUME_ASUS_AMD_CPU_WITHOUT_PROBE === false &&
    ER29_LOCKS.ASSUME_ASUS_RADEON_GPU_WITHOUT_PROBE === false &&
    ER29_LOCKS.ASSUME_ASUS_RYZEN_AI_NPU_WITHOUT_PROBE === false &&
    ER29_LOCKS.SILENT_STARTUP_PERSISTENCE === false &&
    ER29_LOCKS.BIOS_FIRMWARE_CHANGES === false &&
    ER29_LOCKS.AUTOMATIC_DRIVER_REPLACEMENT === false &&
    ER29_LOCKS.OVERCLOCKING === false &&
    ER29_LOCKS.UNRELATED_FILE_ACCESS === false &&
    ER29_LOCKS.CREDENTIAL_COLLECTION === false &&
    ER29_LOCKS.INSTALL_WITHOUT_AUTHORIZED_TEST_DEVICE === false &&
    ER29_LOCKS.CLAIM_CONTINUED_WORK_AFTER_SHUTDOWN === false &&
    ER29_LOCKS.RUNNING_VERIFIED_WITHOUT_FRESH_HEARTBEAT === false &&
    ER29_LOCKS.BYPASS_GUARDIAN_RLS === false &&
    ER29_LOCKS.EXPAND_TENANT_UNIVERSE_ACCESS === false &&
    ER29_LOCKS.AUTO_DEPLOY_CHANGES === false &&
    ER29_LOCKS.AGENT_AUTO_AUTHORITY === false &&
    ER29_LOCKS.RECOMMEND_EQ_ACT === false &&
    ER29_LOCKS.RECOMMEND_EQ_AUTHORIZE === false &&
    ER29_LOCKS.BYPASS_GUARDIAN_RLS_TENANT_UNIVERSE === false &&
    ER29_LOCKS.GUARDIAN_RLS_TENANT_UNIVERSE_ISOLATION_UNCHANGED === true &&
    ER29_LOCKS.HUMAN_APPROVAL_BOUNDARIES_UNCHANGED === true &&
    ER29_LOCKS.DOCUMENTED_EQ_IMPLEMENTED === false &&
    ER29_LOCKS.IMPLEMENTED_EQ_VERIFIED === false &&
    ER29_LOCKS.VERIFIED_EQ_PRODUCTION_AUTHORIZED === false &&
    ER29_LOCKS.HUMAN_APPROVAL_REQUIRED_BEFORE_CONSEQUENTIAL_ACTIONS === true &&
    ER29_LOCKS.TIP_LAND === false &&
    ER29_LOCKS.PRODUCTION_AUTHORIZATION === false &&
    ER29_LOCKS.DB_CANDIDATES_APPLIED === false &&
    ER29_LOCKS.FULL_PRODUCTION_WINDOWS_RUNTIME_PACKAGE_SHIPPED === false &&
    ER29_LOCKS.MANAGE_PULL_REQUEST === false &&
    ER29_LOCKS.EXPLICIT_UNINSTALL_PATH === true &&
    ER29_LOCKS.SIGNED_VERSIONED_UPDATES === true &&
    ER29_LOCKS.ROLLBACK_SUPPORT === true &&
    ASUS_MACHINE_TRUTH_RULE.assumeAmdCpu === false &&
    ASUS_MACHINE_TRUTH_RULE.autoVerifyGpu === false &&
    ASUS_MACHINE_TRUTH_RULE.autoVerifyNpu === false &&
    WINDOWS_RUNTIME_AGENT_BEHAVIOR.mayClaimContinuedLocalWorkAfterShutdown ===
      false &&
    WINDOWS_RUNTIME_INSTALL_SAFEGUARDS.noSilentStartupPersistence === true &&
    WINDOWS_RUNTIME_INSTALL_SAFEGUARDS.noCredentialCollection === true &&
    ER29_AGENT_BOUNDS.automaticAuthority === false
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
 * Soft-wire ASUS-specific paths: any of several candidate filenames counts
 * as PRESENT; if none exist → WAITING_DATA (not FAIL).
 */
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
    pathChecked: join(repoRoot, rels[0] ?? 'asus-local-runtime'),
    note: noteAbsent,
  };
}

export function er29SoftWireSnapshot(repoRoot?: string): Er29SoftWireSnapshot {
  const root =
    repoRoot ?? join(dirname(fileURLToPath(import.meta.url)), '../../..');

  return {
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
    ep6LocalHardwareTruthProbe: softWireFile(
      './local-hardware-truth-probe-types.ts',
      'EP6 Local Hardware Truth Probe PRESENT (soft-wire).',
      'EP6 Local Hardware Truth Probe absent — soft-wire WAITING_DATA.',
    ),
    ep6Report: softWireRepoRelative(
      root,
      'docs/operations/62L_EP6_LOCAL_HARDWARE_TRUTH_PROBE_V2_REPORT.md',
      'EP6 report PRESENT.',
      'EP6 report absent — soft-wire WAITING_DATA.',
    ),
    virtualChipContract: softWireFile(
      './virtual-chip-contract-types.ts',
      'Virtual Chip Contract PRESENT (soft-wire).',
      'Virtual Chip Contract absent — soft-wire WAITING_DATA.',
    ),
    amdAdapterResearchPath: softWireFile(
      './amd-adapter-research-path-types.ts',
      'AMD Adapter Research Path PRESENT (soft-wire).',
      'AMD Adapter Research Path absent — soft-wire WAITING_DATA.',
    ),
    el7WindowsLocalRuntime: softWireRepoRelative(
      root,
      'services/ai/local-runtime/inference-adapter.ts',
      'EL7 Windows Local Runtime Adapter PRESENT (soft-wire).',
      'EL7 Windows Local Runtime Adapter absent — soft-wire WAITING_DATA.',
    ),
    el7Report: softWireRepoRelative(
      root,
      'docs/operations/62L_EL7_WINDOWS_LOCAL_RUNTIME_ADAPTER_REPORT.md',
      'EL7 report PRESENT.',
      'EL7 report absent — soft-wire WAITING_DATA.',
    ),
    elWindowsHardwareProbeBrief: softWireRepoRelative(
      root,
      'docs/operations/62L_EL_WINDOWS_HARDWARE_RUNTIME_PROBE_BUILD_BRIEF.md',
      'EL Windows hardware runtime probe brief PRESENT.',
      'EL Windows hardware runtime probe brief absent — soft-wire WAITING_DATA.',
    ),
    onnxWindowsMlAdapter: softWireRepoRelative(
      root,
      'services/ai/local-runtime/onnx-windows-ml-adapter.ts',
      'ONNX Windows ML adapter PRESENT (soft-wire).',
      'ONNX Windows ML adapter absent — soft-wire WAITING_DATA.',
    ),
    el9ResourceGovernor: softWireRepoRelative(
      root,
      'services/ai/local-runtime/resource-governor.ts',
      'EL9 Resource Governor PRESENT (soft-wire).',
      'EL9 Resource Governor absent — soft-wire WAITING_DATA.',
    ),
    el9Report: softWireRepoRelative(
      root,
      'docs/operations/62L_EL9_RESOURCE_GOVERNOR_REPORT.md',
      'EL9 report PRESENT.',
      'EL9 report absent — soft-wire WAITING_DATA.',
    ),
    asusSpecificLocalRuntime: softWireAnyRepoRelative(
      root,
      [
        'services/ai/local-runtime/asus-windows-runtime.ts',
        'services/ai/local-brain/asus-windows-runtime-types.ts',
        'docs/operations/62L_ASUS_WINDOWS_LOCAL_RUNTIME_REPORT.md',
      ],
      'ASUS-specific local-runtime artifact PRESENT (soft-wire).',
      'ASUS-specific local-runtime artifact absent — soft-wire WAITING_DATA (do not invent machine profile).',
    ),
    em157HomeBase: softWireFile(
      './agent-compute-home-base-types.ts',
      'EM (#157) Agent Compute Home Base PRESENT (soft-wire).',
      'EM (#157) Agent Compute Home Base absent — soft-wire WAITING_DATA.',
    ),
  };
}

export function softWireHopState(present: boolean): Er29EvidenceState {
  return present ? 'PASS' : 'WAITING_DATA';
}

export function isEr29Agent(actor: Er29Actor): boolean {
  return (
    actor.kind === 'windows_runtime_packager' ||
    actor.kind === 'local_runtime_agent' ||
    actor.kind === 'hardware_probe'
  );
}

export function isHumanApprover(actor: Er29Actor): boolean {
  return (
    actor.kind === 'human_approver' ||
    actor.kind === 'founder' ||
    actor.kind === 'tenant_admin' ||
    actor.kind === 'test_device_owner'
  );
}

export function acceleratorNeverAutoVerified(): boolean {
  return (
    ER29_LOCKS.AUTO_VERIFY_GPU === false && ER29_LOCKS.AUTO_VERIFY_NPU === false
  );
}

export function asusAssumptionsForbidden(): boolean {
  return (
    ASUS_MACHINE_TRUTH_RULE.assumeAmdCpu === false &&
    ASUS_MACHINE_TRUTH_RULE.assumeRadeonGpu === false &&
    ASUS_MACHINE_TRUTH_RULE.assumeRyzenAiNpu === false
  );
}
