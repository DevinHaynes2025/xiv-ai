/**
 * 62L-ER33 — Runtime Update Channel (park-and-implement).
 *
 * Layer: 62L-ER Real API Data Fabric + Global Historical Knowledge Ingestion +
 * Offline/Online Brain Sync + Historical Avatar Simulations + Universal Device
 * Distribution (GitHub #162).
 *
 * Signed, versioned update channel so runtimes, models, policies, adapters, and
 * offline knowledge packs upgrade safely across supported devices with
 * compatibility checks and rollback.
 *
 * Core flow:
 * New candidate → sandbox tests → compatibility matrix → security review →
 * human approval → staged rollout → health checks → continue / rollback
 *
 * Rollout stages (no jump to all devices):
 * DRAFT → SANDBOX → TEST_DEVICE → LIMITED_COHORT → VERIFIED_CANDIDATE →
 * broader authorized rollout
 *
 * Soft-wire when PRESENT: ER32–ER28, ER2. Soft-wire missing as WAITING_DATA.
 * Presence ≠ VERIFIED. Absent → WAITING_DATA (not FAIL).
 *
 * SoT: GitHub #162 / 62L-ER family. GitLab mirror: needsAuth; no number invented.
 *
 * Honesty: DOCUMENTED ≠ IMPLEMENTED ≠ VERIFIED ≠ PRODUCTION AUTHORIZED.
 * L4_AUTONOMY_ENABLED=false. Guardian/RLS/tenant/Universe unchanged.
 * DB candidates NOT_APPLIED. tip-land=NO.
 * Next (report only): ER34 — Capability Manifest.
 */

import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

export const HONESTY_BANNER =
  'DOCUMENTED ≠ IMPLEMENTED ≠ VERIFIED ≠ PRODUCTION AUTHORIZED' as const;

export const GITHUB_SOT_ISSUE = 162 as const;
export const GITHUB_SOT_LABEL = '62L-ER33' as const;
export const GITHUB_SOT_FAMILY = '62L-ER' as const;
export const GITHUB_SOT_TITLE =
  '62L-ER33 Runtime Update Channel — signed versioned updates; staged rollout; compatibility gate UPDATE_BLOCKED; rollback; offline last-verified; L4=false' as const;

export const GITLAB_MIRROR_NOTE =
  'GitLab mirror: search attempted; MCP needsAuth / not resolved in this environment — no issue number invented.' as const;

export const ER33_DB_CANDIDATES_STATUS = 'NOT_APPLIED' as const;

export const ER_LAYER_TITLE =
  '62L-ER Real API Data Fabric + Global Historical Knowledge Ingestion + Offline/Online Brain Sync + Historical Avatar Simulations + Universal Device Distribution' as const;

export const NEXT_PHASE_TITLE =
  'ER34 — Capability Manifest — device/runtime capability declaration so installers, schedulers, and update channels know what a node can safely run.' as const;

/**
 * Update package fields.
 */
export const UPDATE_PACKAGE_FIELDS = [
  'updateId',
  'packageRuntimeType',
  'targetPlatform',
  'targetArchitecture',
  'currentVersion',
  'targetVersion',
  'signedHash',
  'signature',
  'dependencies',
  'compatibilityRequirements',
  'requiredPermissions',
  'migrationRequirements',
  'rollbackVersion',
  'securityNotes',
  'releaseEvidence',
  'testStatus',
  'deploymentScope',
  'approvalState',
] as const;

export type UpdatePackageField = (typeof UPDATE_PACKAGE_FIELDS)[number];

/**
 * Core update channel flow.
 */
export const UPDATE_CHANNEL_CORE_FLOW = [
  'new_candidate',
  'sandbox_tests',
  'compatibility_matrix',
  'security_review',
  'human_approval',
  'staged_rollout',
  'health_checks',
  'continue_or_rollback',
] as const;

export type UpdateChannelCoreFlowHop =
  (typeof UPDATE_CHANNEL_CORE_FLOW)[number];

/**
 * Supported update types.
 */
export const SUPPORTED_UPDATE_TYPES = [
  'local_runtime',
  'hardware_adapters',
  'scheduler_policies',
  'model_packages',
  'offline_knowledge_packs',
  'agent_skills',
  'search_indexes',
  'policy_bundles',
  'connector_definitions',
  'benchmark_baselines',
] as const;

export type SupportedUpdateType = (typeof SUPPORTED_UPDATE_TYPES)[number];

/**
 * Rollout stages — no jump from DRAFT to all devices.
 */
export const ROLLOUT_STAGES = [
  'DRAFT',
  'SANDBOX',
  'TEST_DEVICE',
  'LIMITED_COHORT',
  'VERIFIED_CANDIDATE',
  'AUTHORIZED_BROADER_ROLLOUT',
] as const;

export type RolloutStage = (typeof ROLLOUT_STAGES)[number];

/**
 * Compatibility gate dimensions.
 */
export const COMPATIBILITY_GATE_CHECKS = [
  'platform',
  'architecture',
  'runtime',
  'storage',
  'memory',
  'permissions',
  'dependency_versions',
  'tenant_policy',
] as const;

export type CompatibilityGateCheck =
  (typeof COMPATIBILITY_GATE_CHECKS)[number];

export const COMPATIBILITY_GATE_OUTCOME = {
  COMPATIBLE: 'COMPATIBLE',
  UPDATE_BLOCKED: 'UPDATE_BLOCKED',
} as const;

export type CompatibilityGateOutcome =
  (typeof COMPATIBILITY_GATE_OUTCOME)[keyof typeof COMPATIBILITY_GATE_OUTCOME];

/**
 * Rollback triggers.
 */
export const ROLLBACK_TRIGGERS = [
  'crash_increase',
  'model_load_failure',
  'latency_regression',
  'excessive_memory_use',
  'sync_failure',
  'policy_regression',
  'security_test_failure',
] as const;

export type RollbackTrigger = (typeof ROLLBACK_TRIGGERS)[number];

/**
 * Rollback receipt must preserve these.
 */
export const ROLLBACK_PRESERVE_FIELDS = [
  'priorWorkingVersion',
  'rollbackTrigger',
  'healthThreshold',
  'rollbackReceipt',
  'affectedDeviceList',
] as const;

export type RollbackPreserveField =
  (typeof ROLLBACK_PRESERVE_FIELDS)[number];

/**
 * Evidence / cycle hops.
 */
export const RUNTIME_UPDATE_CHANNEL_CYCLE = [
  'honesty_banner',
  'locks',
  'create_update_package',
  'sandbox_tests',
  'compatibility_gate',
  'security_review',
  'human_approval',
  'staged_rollout',
  'health_checks',
  'rollback_path',
  'offline_reconnect',
  'deny_unsigned_stealth_firmware',
  'deny_permission_expansion',
  'deny_cross_tenant_mix',
  'revocation_stops_distribution',
  'er32_soft_wire',
  'er31_soft_wire',
  'er30_soft_wire',
  'er29_soft_wire',
  'er28_soft_wire',
  'er2_soft_wire',
  'db_candidates_not_applied',
  'evidence',
] as const;

export type Er33Hop = (typeof RUNTIME_UPDATE_CHANNEL_CYCLE)[number];

export type Er33EvidenceState =
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
  | 'UPDATE_BLOCKED'
  | 'ROLLED_BACK'
  | 'REVOKED';

export type Er33HopRecord = {
  hop: Er33Hop;
  state: Er33EvidenceState;
  summary: string;
  at: string;
};

export type Er33ActorKind =
  | 'update_channel_agent'
  | 'runtime_updater'
  | 'proposal'
  | 'human_approver'
  | 'founder'
  | 'guardian'
  | 'home_base'
  | 'tenant_admin'
  | 'security_reviewer';

export type Er33Actor = {
  kind: Er33ActorKind;
  id: string;
  orgId: string;
  tenantId: string;
  universeId: string;
  permissions: readonly string[];
};

export const ER33_LOCKS = Object.freeze({
  L4_AUTONOMY_ENABLED: false as const,
  TIP_LAND: false as const,
  PRODUCTION_AUTHORIZATION: false as const,
  PRODUCTION_WRITE: false as const,
  DB_CANDIDATES_APPLIED: false as const,
  FULL_PRODUCTION_RUNTIME_UPDATE_CHANNEL_SHIPPED: false as const,
  MANAGE_PULL_REQUEST: false as const,

  SIGNED_ARTIFACTS_ONLY: true as const,
  STEALTH_INSTALLATION: false as const,
  PRIVILEGE_ESCALATION: false as const,
  FIRMWARE_BIOS_UPDATES_VIA_CHANNEL: false as const,
  AUTOMATIC_PERMISSION_EXPANSION: false as const,
  CROSS_TENANT_PACKAGE_MIXING: false as const,
  REVOKED_UPDATES_MUST_STOP_DISTRIBUTION: true as const,
  FORCE_INCOMPATIBLE_INSTALL: false as const,
  JUMP_DRAFT_TO_ALL_DEVICES: false as const,
  TREAT_STALE_OFFLINE_AS_CURRENT: false as const,
  HIDDEN_CHAIN_OF_THOUGHT: false as const,

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

export const ER33_AGENT_BOUNDS = Object.freeze({
  mayCreateSignedUpdateCandidate: true as const,
  mayAdvanceRolloutWithEvidence: true as const,
  mayBlockIncompatibleInstall: true as const,
  mayRollbackOnHealthTrigger: true as const,
  mayServeLastVerifiedWhileOffline: true as const,
  mayReconnectAuthorizedCompatibleOnly: true as const,
  mayForceIncompatibleInstall: false as const,
  mayJumpDraftToAllDevices: false as const,
  mayStealthInstall: false as const,
  mayEscalatePrivileges: false as const,
  mayUpdateFirmwareOrBios: false as const,
  mayAutoExpandPermissions: false as const,
  mayMixCrossTenantPackages: false as const,
  mayDistributeRevokedUpdates: false as const,
  mayTreatStaleOfflineAsCurrent: false as const,
  mayBypassGuardianRls: false as const,
  mayExpandTenantUniverseAccess: false as const,
  mayAutoDeployChanges: false as const,
  automaticAuthority: false as const,
  mayRecommendOnly: true as const,
});

export const ER33_MAY = Object.freeze([
  'create_signed_versioned_update_packages',
  'advance_rollout_stages_only_with_evidence',
  'block_incompatible_installs_as_UPDATE_BLOCKED',
  'require_human_approval_before_staged_rollout',
  'rollback_preserving_prior_version_receipt_and_devices',
  'retain_last_verified_package_while_offline',
  'on_reconnect_deliver_only_authorized_compatible_updates',
  'stop_distribution_when_update_revoked',
] as const);

export const ER33_MUST_NOT = Object.freeze([
  'install_unsigned_or_stealth_artifacts',
  'escalate_privileges_or_auto_expand_permissions',
  'update_firmware_or_bios_through_this_channel',
  'mix_packages_across_tenants_or_universes',
  'force_install_when_compatibility_gate_fails',
  'jump_from_DRAFT_to_all_devices',
  'treat_stale_offline_package_as_current_before_updating',
  'continue_distributing_revoked_updates',
  'bypass_guardian_rls_or_expand_tenant_universe_access',
  'auto_deploy_changes',
  'treat_recommend_as_act',
  'grant_agents_automatic_authority',
  'enable_l4_autonomy',
  'include_hidden_chain_of_thought',
] as const);

export type SoftWirePresence = {
  present: boolean;
  pathChecked: string;
  note: string;
};

export type Er33SoftWireSnapshot = {
  er32EdgeVehicleRuntimeCandidate: SoftWirePresence;
  er32Report: SoftWirePresence;
  er31IosAppleRuntimeResearchCandidate: SoftWirePresence;
  er31Report: SoftWirePresence;
  er30AndroidArmRuntimePackageCandidate: SoftWirePresence;
  er30Report: SoftWirePresence;
  er29WindowsRuntimePackageCandidate: SoftWirePresence;
  er29Report: SoftWirePresence;
  er28UniversalRuntimePackageContract: SoftWirePresence;
  er28Report: SoftWirePresence;
  er2ApiTruthStateMachine: SoftWirePresence;
  er2Report: SoftWirePresence;
};

export type ApprovalState =
  | 'PENDING'
  | 'APPROVED'
  | 'REJECTED'
  | 'REVOKED';

export type TestStatus =
  | 'NOT_RUN'
  | 'SANDBOX_PASS'
  | 'SANDBOX_FAIL'
  | 'SECURITY_PASS'
  | 'SECURITY_FAIL';

export type DeviceProfile = {
  deviceId: string;
  platform: string;
  architecture: string;
  runtimeVersion: string;
  storageBytesAvailable: number;
  memoryBytesAvailable: number;
  grantedPermissions: readonly string[];
  dependencyVersions: Readonly<Record<string, string>>;
  tenantId: string;
  universeId: string;
  orgId: string;
  online: boolean;
  installedVersion: string | null;
  lastVerifiedPackageId: string | null;
  lastVerifiedVersion: string | null;
  packageStale: boolean;
};

export type CompatibilityRequirements = {
  platforms: readonly string[];
  architectures: readonly string[];
  minRuntimeVersion: string;
  minStorageBytes: number;
  minMemoryBytes: number;
  requiredPermissions: readonly string[];
  dependencyVersions: Readonly<Record<string, string>>;
  allowedTenantIds: readonly string[];
  allowedUniverseIds: readonly string[];
};

export type UpdatePackage = {
  updateId: string;
  packageRuntimeType: SupportedUpdateType;
  targetPlatform: string;
  targetArchitecture: string;
  currentVersion: string;
  targetVersion: string;
  signedHash: string;
  signature: string;
  signed: boolean;
  dependencies: Readonly<Record<string, string>>;
  compatibilityRequirements: CompatibilityRequirements;
  requiredPermissions: readonly string[];
  migrationRequirements: readonly string[];
  rollbackVersion: string;
  securityNotes: string;
  releaseEvidence: readonly string[];
  testStatus: TestStatus;
  deploymentScope: RolloutStage;
  approvalState: ApprovalState;
  tenantId: string;
  universeId: string;
  orgId: string;
  revoked: boolean;
  stealth: boolean;
  firmwareOrBios: boolean;
  expandsPermissions: boolean;
  sandboxEvidence: readonly string[];
  securityReviewEvidence: readonly string[];
  humanApprovedBy: string | null;
  rolloutEvidence: readonly string[];
};

export type CompatibilityGateResult = {
  outcome: CompatibilityGateOutcome;
  failedChecks: readonly CompatibilityGateCheck[];
  forced: false;
  summary: string;
};

export type RollbackReceipt = {
  priorWorkingVersion: string;
  rollbackTrigger: RollbackTrigger;
  healthThreshold: string;
  rollbackReceipt: string;
  affectedDeviceList: readonly string[];
  rolledBackTo: string;
  updateId: string;
  at: string;
};

export type OfflineReconnectResult = {
  delivered: boolean;
  reason: string;
  treatedAsCurrentBeforeUpdate: false;
  retainedLastVerified: boolean;
  lastVerifiedVersion: string | null;
  updateId: string | null;
};

export function assertEr33LocksIntact(): boolean {
  return (
    ER33_LOCKS.L4_AUTONOMY_ENABLED === false &&
    ER33_LOCKS.SIGNED_ARTIFACTS_ONLY === true &&
    ER33_LOCKS.STEALTH_INSTALLATION === false &&
    ER33_LOCKS.PRIVILEGE_ESCALATION === false &&
    ER33_LOCKS.FIRMWARE_BIOS_UPDATES_VIA_CHANNEL === false &&
    ER33_LOCKS.AUTOMATIC_PERMISSION_EXPANSION === false &&
    ER33_LOCKS.CROSS_TENANT_PACKAGE_MIXING === false &&
    ER33_LOCKS.REVOKED_UPDATES_MUST_STOP_DISTRIBUTION === true &&
    ER33_LOCKS.FORCE_INCOMPATIBLE_INSTALL === false &&
    ER33_LOCKS.JUMP_DRAFT_TO_ALL_DEVICES === false &&
    ER33_LOCKS.TREAT_STALE_OFFLINE_AS_CURRENT === false &&
    ER33_LOCKS.HIDDEN_CHAIN_OF_THOUGHT === false &&
    ER33_LOCKS.BYPASS_GUARDIAN_RLS === false &&
    ER33_LOCKS.EXPAND_TENANT_UNIVERSE_ACCESS === false &&
    ER33_LOCKS.AUTO_DEPLOY_CHANGES === false &&
    ER33_LOCKS.AGENT_AUTO_AUTHORITY === false &&
    ER33_LOCKS.RECOMMEND_EQ_ACT === false &&
    ER33_LOCKS.RECOMMEND_EQ_AUTHORIZE === false &&
    ER33_LOCKS.BYPASS_GUARDIAN_RLS_TENANT_UNIVERSE === false &&
    ER33_LOCKS.GUARDIAN_RLS_TENANT_UNIVERSE_ISOLATION_UNCHANGED === true &&
    ER33_LOCKS.HUMAN_APPROVAL_BOUNDARIES_UNCHANGED === true &&
    ER33_LOCKS.DOCUMENTED_EQ_IMPLEMENTED === false &&
    ER33_LOCKS.IMPLEMENTED_EQ_VERIFIED === false &&
    ER33_LOCKS.VERIFIED_EQ_PRODUCTION_AUTHORIZED === false &&
    ER33_LOCKS.HUMAN_APPROVAL_REQUIRED_BEFORE_CONSEQUENTIAL_ACTIONS ===
      true &&
    ER33_LOCKS.TIP_LAND === false &&
    ER33_LOCKS.PRODUCTION_AUTHORIZATION === false &&
    ER33_LOCKS.DB_CANDIDATES_APPLIED === false &&
    ER33_LOCKS.FULL_PRODUCTION_RUNTIME_UPDATE_CHANNEL_SHIPPED === false &&
    ER33_LOCKS.MANAGE_PULL_REQUEST === false &&
    ER33_AGENT_BOUNDS.mayForceIncompatibleInstall === false &&
    ER33_AGENT_BOUNDS.mayJumpDraftToAllDevices === false &&
    ER33_AGENT_BOUNDS.automaticAuthority === false
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

export function er33SoftWireSnapshot(repoRoot?: string): Er33SoftWireSnapshot {
  const root =
    repoRoot ?? join(dirname(fileURLToPath(import.meta.url)), '../../..');

  return {
    er32EdgeVehicleRuntimeCandidate: softWireFile(
      './edge-vehicle-runtime-candidate-types.ts',
      'ER32 Edge/Vehicle Runtime Candidate PRESENT (soft-wire).',
      'ER32 Edge/Vehicle Runtime Candidate absent — soft-wire WAITING_DATA.',
    ),
    er32Report: softWireRepoRelative(
      root,
      'docs/operations/62L_ER32_EDGE_VEHICLE_RUNTIME_CANDIDATE_REPORT.md',
      'ER32 report PRESENT.',
      'ER32 report absent — soft-wire WAITING_DATA.',
    ),
    er31IosAppleRuntimeResearchCandidate: softWireFile(
      './ios-apple-runtime-research-candidate-types.ts',
      'ER31 iOS/Apple Runtime Research Candidate PRESENT (soft-wire).',
      'ER31 iOS/Apple Runtime Research Candidate absent — soft-wire WAITING_DATA.',
    ),
    er31Report: softWireRepoRelative(
      root,
      'docs/operations/62L_ER31_IOS_APPLE_RUNTIME_RESEARCH_CANDIDATE_REPORT.md',
      'ER31 report PRESENT.',
      'ER31 report absent — soft-wire WAITING_DATA.',
    ),
    er30AndroidArmRuntimePackageCandidate: softWireFile(
      './android-arm-runtime-package-candidate-types.ts',
      'ER30 Android/ARM Runtime Package Candidate PRESENT (soft-wire).',
      'ER30 Android/ARM Runtime Package Candidate absent — soft-wire WAITING_DATA.',
    ),
    er30Report: softWireRepoRelative(
      root,
      'docs/operations/62L_ER30_ANDROID_ARM_RUNTIME_PACKAGE_CANDIDATE_REPORT.md',
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
  };
}

export function softWireHopState(present: boolean): Er33EvidenceState {
  return present ? 'PASS' : 'WAITING_DATA';
}

export function isEr33Agent(actor: Er33Actor): boolean {
  return (
    actor.kind === 'update_channel_agent' ||
    actor.kind === 'runtime_updater' ||
    actor.kind === 'home_base'
  );
}

export function isHumanApprover(actor: Er33Actor): boolean {
  return (
    actor.kind === 'human_approver' ||
    actor.kind === 'founder' ||
    actor.kind === 'tenant_admin'
  );
}

export function rolloutStageIndex(stage: RolloutStage): number {
  return ROLLOUT_STAGES.indexOf(stage);
}

export function mayAdvanceRollout(
  from: RolloutStage,
  to: RolloutStage,
): boolean {
  if (from === 'DRAFT' && to === 'AUTHORIZED_BROADER_ROLLOUT') {
    return false;
  }
  const fromIdx = rolloutStageIndex(from);
  const toIdx = rolloutStageIndex(to);
  if (fromIdx < 0 || toIdx < 0) return false;
  // Allow same stage or single-step forward only.
  return toIdx === fromIdx || toIdx === fromIdx + 1;
}
