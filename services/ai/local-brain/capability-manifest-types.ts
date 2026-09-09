/**
 * 62L-ER34 — Capability Manifest (park-and-implement).
 *
 * Layer: 62L-ER Real API Data Fabric + Global Historical Knowledge Ingestion +
 * Offline/Online Brain Sync + Historical Avatar Simulations + Universal Device
 * Distribution (GitHub #162).
 *
 * Every enrolled device publishes a truthful capability manifest so agents know
 * exactly what that device can do before routing work to it.
 *
 * Core rule: Manifest reports evidence, not aspirations.
 * Example: AMD GPU=DETECTED; Windows ML=SUPPORTED; Model A GPU inference=
 * NOT_TESTED → cannot treat as GPU-verified until bounded inference succeeds.
 *
 * Agent routing:
 * Agent → Task Envelope → Capability Manifest → Policy → Resource Governor →
 * Scheduler. Missing required capability → NO_ELIGIBLE_ROUTE (not forced).
 *
 * Soft-wire when PRESENT: ER33–ER28, ER2, EQ7, EQ6, EM (#157).
 * Presence ≠ VERIFIED. Absent → WAITING_DATA (not FAIL).
 *
 * SoT: GitHub #162 / 62L-ER family. GitLab mirror: needsAuth; no number invented.
 *
 * Honesty: DOCUMENTED ≠ IMPLEMENTED ≠ VERIFIED ≠ PRODUCTION AUTHORIZED.
 * L4_AUTONOMY_ENABLED=false. Guardian/RLS/tenant/Universe unchanged.
 * DB candidates NOT_APPLIED. tip-land=NO.
 * Next (report only): ER35 — Model / Data Pack Manifest.
 */

import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

export const HONESTY_BANNER =
  'DOCUMENTED ≠ IMPLEMENTED ≠ VERIFIED ≠ PRODUCTION AUTHORIZED' as const;

export const GITHUB_SOT_ISSUE = 162 as const;
export const GITHUB_SOT_LABEL = '62L-ER34' as const;
export const GITHUB_SOT_FAMILY = '62L-ER' as const;
export const GITHUB_SOT_TITLE =
  '62L-ER34 Capability Manifest — evidence-backed device capabilities; aspirations≠VERIFIED; missing→NO_ELIGIBLE_ROUTE; privacy technical-only' as const;

export const GITLAB_MIRROR_NOTE =
  'GitLab mirror: search attempted; MCP needsAuth / not resolved in this environment — no issue number invented.' as const;

export const ER34_DB_CANDIDATES_STATUS = 'NOT_APPLIED' as const;

export const ER_LAYER_TITLE =
  '62L-ER Real API Data Fabric + Global Historical Knowledge Ingestion + Offline/Online Brain Sync + Historical Avatar Simulations + Universal Device Distribution' as const;

export const NEXT_PHASE_TITLE =
  'ER35 — Model / Data Pack Manifest — declare which models and data packs a device may load, with evidence states and revocation.' as const;

/**
 * Manifest metadata fields (technical capability routing only).
 */
export const CAPABILITY_MANIFEST_FIELDS = [
  'deviceId',
  'ownerTenantUniverse',
  'platformOs',
  'architecture',
  'cpu',
  'gpu',
  'npuAccelerator',
  'availableRuntimes',
  'supportedModels',
  'supportedPrecisions',
  'ramStorage',
  'networkState',
  'batteryThermalState',
  'offlineFeatures',
  'allowedDataClasses',
  'grantedPermissions',
  'localOnlyRestrictions',
  'benchmarkRefs',
  'heartbeat',
  'packageVersion',
  'lastVerificationTime',
  'revocationState',
] as const;

export type CapabilityManifestField =
  (typeof CAPABILITY_MANIFEST_FIELDS)[number];

/**
 * Required per-capability evidence states.
 */
export const CAPABILITY_EVIDENCE_STATES = [
  'DOCUMENTED',
  'DETECTED',
  'SUPPORTED',
  'VERIFIED',
  'NOT_TESTED',
  'DEGRADED',
  'UNAVAILABLE',
  'STALE',
  'REVOKED',
] as const;

export type CapabilityEvidenceState =
  (typeof CAPABILITY_EVIDENCE_STATES)[number];

/**
 * Agent routing path before work assignment.
 */
export const AGENT_ROUTING_PATH = [
  'agent',
  'task_envelope',
  'capability_manifest',
  'policy',
  'resource_governor',
  'scheduler',
] as const;

export type AgentRoutingHop = (typeof AGENT_ROUTING_PATH)[number];

/**
 * Events that force STALE + re-verification request.
 */
export const MANIFEST_STALE_TRIGGERS = [
  'os_update',
  'driver_runtime_update',
  'model_update',
  'hardware_change',
  'package_update',
  'long_heartbeat_gap',
] as const;

export type ManifestStaleTrigger = (typeof MANIFEST_STALE_TRIGGERS)[number];

/**
 * Cross-device brain contributors (each publishes only verified capabilities).
 */
export const CROSS_DEVICE_CLASSES = [
  'asus_laptop',
  'android_phone',
  'apple_device',
  'server',
  'edge_node',
] as const;

export type CrossDeviceClass = (typeof CROSS_DEVICE_CLASSES)[number];

/**
 * Privacy: technical metadata only — these personal content classes are blocked.
 */
export const BLOCKED_PERSONAL_CONTENT = [
  'personal_files',
  'browser_activity',
  'passwords',
  'unrelated_apps',
  'precise_location',
  'private_content',
] as const;

export type BlockedPersonalContent =
  (typeof BLOCKED_PERSONAL_CONTENT)[number];

export const CAPABILITY_MANIFEST_TRUTH_BOUNDARY = Object.freeze({
  reportsEvidenceNotAspirations: true as const,
  mayTreatAspirationAsVerified: false as const,
  mayForceRouteWhenCapabilityMissing: false as const,
  missingRequiredCapabilityMeansNoEligibleRoute: true as const,
  mayExposePersonalFiles: false as const,
  mayExposeBrowserActivity: false as const,
  mayExposePasswords: false as const,
  mayExposeUnrelatedApps: false as const,
  mayExposePreciseLocation: false as const,
  mayExposePrivateContent: false as const,
  crossDeviceContributesOnlyVerified: true as const,
  staleRequiresReVerification: true as const,
});

export type CapabilityEntry = {
  capabilityId: string;
  label: string;
  state: CapabilityEvidenceState;
  evidenceRefs: readonly string[];
  lastVerifiedAt: string | null;
  aspirationOnly: false;
};

export type DeviceCapabilityManifest = {
  deviceId: string;
  ownerId: string;
  tenantId: string;
  universeId: string;
  orgId: string;
  platformOs: string;
  architecture: string;
  cpu: CapabilityEntry;
  gpu: CapabilityEntry;
  npuAccelerator: CapabilityEntry;
  availableRuntimes: readonly CapabilityEntry[];
  supportedModels: readonly CapabilityEntry[];
  supportedPrecisions: readonly string[];
  ramBytes: number;
  storageBytes: number;
  networkState: string;
  batteryThermalState: string;
  offlineFeatures: readonly string[];
  allowedDataClasses: readonly string[];
  grantedPermissions: readonly string[];
  localOnlyRestrictions: readonly string[];
  benchmarkRefs: readonly string[];
  heartbeatAt: string;
  packageVersion: string;
  lastVerificationTime: string | null;
  revocationState: 'ACTIVE' | 'REVOKED' | 'PENDING_REVOKE';
  deviceClass: CrossDeviceClass;
  capabilities: readonly CapabilityEntry[];
  containsPersonalContent: false;
  containsHiddenChainOfThought: false;
  stale: boolean;
  staleTriggers: readonly ManifestStaleTrigger[];
  reVerificationRequested: boolean;
};

export type TaskEnvelope = {
  taskId: string;
  requiredCapabilities: readonly string[];
  requiredMinState: CapabilityEvidenceState;
  tenantId: string;
  universeId: string;
};

export type RouteDecision =
  | {
      eligible: true;
      route: 'ELIGIBLE';
      deviceId: string;
      matchedCapabilities: readonly string[];
      path: typeof AGENT_ROUTING_PATH;
      forced: false;
    }
  | {
      eligible: false;
      route: 'NO_ELIGIBLE_ROUTE';
      deviceId: string;
      missingCapabilities: readonly string[];
      forced: false;
      reason: string;
    };

export const CAPABILITY_MANIFEST_CYCLE = [
  'honesty_locks',
  'capability_manifest_bootstrap',
  // A — Structure
  'manifest_fields_encoded',
  'evidence_states_encoded',
  'agent_routing_path_encoded',
  'stale_triggers_encoded',
  'cross_device_classes_encoded',
  'privacy_blocklist_encoded',
  'truth_boundary_encoded',
  // B — Truth
  'publish_manifest_with_evidence_states',
  'deny_aspiration_as_verified',
  'example_amd_gpu_detected_windows_ml_supported_model_not_tested',
  'route_check_no_eligible_when_missing',
  'mark_stale_on_meaningful_change_or_heartbeat_gap',
  'deny_personal_content_in_manifest',
  'cross_device_verified_only',
  // C — Denies
  'deny_treat_not_tested_as_gpu_verified',
  'deny_force_route_when_capability_missing',
  'deny_personal_files',
  'deny_browser_activity',
  'deny_passwords',
  'deny_unrelated_apps',
  'deny_precise_location',
  'deny_private_content',
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
  'er33_soft_wire',
  'er32_soft_wire',
  'er31_soft_wire',
  'er30_soft_wire',
  'er29_soft_wire',
  'er28_soft_wire',
  'er2_soft_wire',
  'eq7_soft_wire',
  'eq6_soft_wire',
  'em157_soft_wire',
  'db_candidates_not_applied',
  'evidence',
] as const;

export type Er34Hop = (typeof CAPABILITY_MANIFEST_CYCLE)[number];

export type Er34EvidenceState =
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
  | 'NO_ELIGIBLE_ROUTE';

export type Er34HopRecord = {
  hop: Er34Hop;
  state: Er34EvidenceState;
  summary: string;
  at: string;
};

export type Er34ActorKind =
  | 'capability_manifest_publisher'
  | 'routing_agent'
  | 'device_enroller'
  | 'proposal'
  | 'human_approver'
  | 'founder'
  | 'guardian'
  | 'home_base'
  | 'tenant_admin';

export type Er34Actor = {
  kind: Er34ActorKind;
  id: string;
  orgId: string;
  tenantId: string;
  universeId: string;
  permissions: readonly string[];
};

export const ER34_LOCKS = Object.freeze({
  L4_AUTONOMY_ENABLED: false as const,
  TIP_LAND: false as const,
  PRODUCTION_AUTHORIZATION: false as const,
  PRODUCTION_WRITE: false as const,
  DB_CANDIDATES_APPLIED: false as const,
  FULL_PRODUCTION_CAPABILITY_MANIFEST_SHIPPED: false as const,
  MANAGE_PULL_REQUEST: false as const,

  ASPIRATION_AS_VERIFIED: false as const,
  FORCE_ROUTE_WHEN_CAPABILITY_MISSING: false as const,
  EXPOSE_PERSONAL_FILES: false as const,
  EXPOSE_BROWSER_ACTIVITY: false as const,
  EXPOSE_PASSWORDS: false as const,
  EXPOSE_UNRELATED_APPS: false as const,
  EXPOSE_PRECISE_LOCATION: false as const,
  EXPOSE_PRIVATE_CONTENT: false as const,
  HIDDEN_CHAIN_OF_THOUGHT: false as const,
  TREAT_NOT_TESTED_AS_GPU_VERIFIED: false as const,
  CROSS_DEVICE_UNVERIFIED_CONTRIBUTION: false as const,

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

export const ER34_AGENT_BOUNDS = Object.freeze({
  mayPublishEvidenceBackedManifest: true as const,
  mayRouteViaManifestPolicyGovernorScheduler: true as const,
  mayMarkStaleAndRequestReVerification: true as const,
  mayContributeVerifiedCapabilitiesOnly: true as const,
  mayTreatAspirationAsVerified: false as const,
  mayForceRouteWhenCapabilityMissing: false as const,
  mayExposePersonalContent: false as const,
  mayTreatNotTestedAsGpuVerified: false as const,
  mayBypassGuardianRls: false as const,
  mayExpandTenantUniverseAccess: false as const,
  mayAutoDeployChanges: false as const,
  automaticAuthority: false as const,
  mayRecommendOnly: true as const,
});

export const ER34_MAY = Object.freeze([
  'publish_device_capability_manifest_with_per_capability_evidence_states',
  'route_work_only_when_required_capabilities_meet_min_evidence_state',
  'mark_manifest_STALE_after_os_driver_model_hardware_package_or_heartbeat_gap',
  'request_re_verification_when_STALE',
  'contribute_only_verified_capabilities_into_cross_device_brain',
  'expose_technical_capability_metadata_for_routing_only',
] as const);

export const ER34_MUST_NOT = Object.freeze([
  'treat_aspirations_as_VERIFIED',
  'treat_NOT_TESTED_model_gpu_inference_as_GPU_verified',
  'force_execution_when_required_capability_missing',
  'expose_personal_files_browser_activity_passwords_unrelated_apps_precise_location_or_private_content',
  'package_hidden_chain_of_thought',
  'contribute_unverified_capabilities_as_verified_cross_device',
  'bypass_guardian_rls_or_expand_tenant_universe_access',
  'auto_deploy_changes',
  'treat_recommend_as_act',
  'grant_agents_automatic_authority',
] as const);

/** Default heartbeat gap (ms) after which manifest is STALE. */
export const DEFAULT_HEARTBEAT_STALE_GAP_MS = 24 * 60 * 60 * 1000;

/**
 * Evidence ladder: aspiration / DOCUMENTED / DETECTED / SUPPORTED / NOT_TESTED
 * cannot silently become VERIFIED without bounded verification evidence.
 */
export function canClaimVerified(input: {
  from: CapabilityEvidenceState;
  hasBoundedVerificationEvidence: boolean;
  aspirationOnly?: boolean;
}): boolean {
  if (input.aspirationOnly === true) return false;
  if (!input.hasBoundedVerificationEvidence) return false;
  if (input.from === 'REVOKED' || input.from === 'UNAVAILABLE') return false;
  return (
    input.from === 'SUPPORTED' ||
    input.from === 'DETECTED' ||
    input.from === 'NOT_TESTED' ||
    input.from === 'DEGRADED' ||
    input.from === 'STALE' ||
    input.from === 'DOCUMENTED' ||
    input.from === 'VERIFIED'
  );
}

export function aspirationMayBecomeVerified(): boolean {
  return CAPABILITY_MANIFEST_TRUTH_BOUNDARY.mayTreatAspirationAsVerified;
}

export function missingCapabilityForcesRoute(): boolean {
  return CAPABILITY_MANIFEST_TRUTH_BOUNDARY.mayForceRouteWhenCapabilityMissing;
}

export type SoftWirePresence = {
  present: boolean;
  pathChecked: string;
  note: string;
};

export type Er34SoftWireSnapshot = {
  er33CrossDeviceRuntimeFederation: SoftWirePresence;
  er33Report: SoftWirePresence;
  er32ServerEdgeRuntimePackage: SoftWirePresence;
  er32Report: SoftWirePresence;
  er31AppleDeviceRuntimePackage: SoftWirePresence;
  er31Report: SoftWirePresence;
  er30AndroidArmRuntimePackage: SoftWirePresence;
  er30Report: SoftWirePresence;
  er29WindowsRuntimePackage: SoftWirePresence;
  er29Report: SoftWirePresence;
  er28UniversalRuntimePackageContract: SoftWirePresence;
  er28Report: SoftWirePresence;
  er2ApiTruthStateMachine: SoftWirePresence;
  er2Report: SoftWirePresence;
  eq7ArmEdgeAmdAcceleration: SoftWirePresence;
  eq7Report: SoftWirePresence;
  eq6ArchitectureCapabilityGraph: SoftWirePresence;
  eq6Report: SoftWirePresence;
  em157HomeBase: SoftWirePresence;
};

export function assertEr34LocksIntact(): boolean {
  return (
    ER34_LOCKS.L4_AUTONOMY_ENABLED === false &&
    ER34_LOCKS.ASPIRATION_AS_VERIFIED === false &&
    ER34_LOCKS.FORCE_ROUTE_WHEN_CAPABILITY_MISSING === false &&
    ER34_LOCKS.EXPOSE_PERSONAL_FILES === false &&
    ER34_LOCKS.EXPOSE_BROWSER_ACTIVITY === false &&
    ER34_LOCKS.EXPOSE_PASSWORDS === false &&
    ER34_LOCKS.EXPOSE_UNRELATED_APPS === false &&
    ER34_LOCKS.EXPOSE_PRECISE_LOCATION === false &&
    ER34_LOCKS.EXPOSE_PRIVATE_CONTENT === false &&
    ER34_LOCKS.HIDDEN_CHAIN_OF_THOUGHT === false &&
    ER34_LOCKS.TREAT_NOT_TESTED_AS_GPU_VERIFIED === false &&
    ER34_LOCKS.CROSS_DEVICE_UNVERIFIED_CONTRIBUTION === false &&
    ER34_LOCKS.BYPASS_GUARDIAN_RLS === false &&
    ER34_LOCKS.EXPAND_TENANT_UNIVERSE_ACCESS === false &&
    ER34_LOCKS.AUTO_DEPLOY_CHANGES === false &&
    ER34_LOCKS.AGENT_AUTO_AUTHORITY === false &&
    ER34_LOCKS.RECOMMEND_EQ_ACT === false &&
    ER34_LOCKS.RECOMMEND_EQ_AUTHORIZE === false &&
    ER34_LOCKS.BYPASS_GUARDIAN_RLS_TENANT_UNIVERSE === false &&
    ER34_LOCKS.GUARDIAN_RLS_TENANT_UNIVERSE_ISOLATION_UNCHANGED === true &&
    ER34_LOCKS.HUMAN_APPROVAL_BOUNDARIES_UNCHANGED === true &&
    ER34_LOCKS.DOCUMENTED_EQ_IMPLEMENTED === false &&
    ER34_LOCKS.IMPLEMENTED_EQ_VERIFIED === false &&
    ER34_LOCKS.VERIFIED_EQ_PRODUCTION_AUTHORIZED === false &&
    ER34_LOCKS.HUMAN_APPROVAL_REQUIRED_BEFORE_CONSEQUENTIAL_ACTIONS === true &&
    ER34_LOCKS.TIP_LAND === false &&
    ER34_LOCKS.PRODUCTION_AUTHORIZATION === false &&
    ER34_LOCKS.DB_CANDIDATES_APPLIED === false &&
    ER34_LOCKS.FULL_PRODUCTION_CAPABILITY_MANIFEST_SHIPPED === false &&
    ER34_LOCKS.MANAGE_PULL_REQUEST === false &&
    CAPABILITY_MANIFEST_TRUTH_BOUNDARY.reportsEvidenceNotAspirations === true &&
    CAPABILITY_MANIFEST_TRUTH_BOUNDARY.mayTreatAspirationAsVerified === false &&
    CAPABILITY_MANIFEST_TRUTH_BOUNDARY.mayForceRouteWhenCapabilityMissing ===
      false &&
    CAPABILITY_MANIFEST_TRUTH_BOUNDARY.missingRequiredCapabilityMeansNoEligibleRoute ===
      true &&
    CAPABILITY_MANIFEST_TRUTH_BOUNDARY.crossDeviceContributesOnlyVerified ===
      true &&
    ER34_AGENT_BOUNDS.mayTreatAspirationAsVerified === false &&
    ER34_AGENT_BOUNDS.mayForceRouteWhenCapabilityMissing === false &&
    ER34_AGENT_BOUNDS.automaticAuthority === false
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

export function er34SoftWireSnapshot(repoRoot?: string): Er34SoftWireSnapshot {
  const root =
    repoRoot ?? join(dirname(fileURLToPath(import.meta.url)), '../../..');

  return {
    er33CrossDeviceRuntimeFederation: softWireFile(
      './cross-device-runtime-federation-types.ts',
      'ER33 Cross-Device Runtime Federation PRESENT (soft-wire).',
      'ER33 Cross-Device Runtime Federation absent — soft-wire WAITING_DATA.',
    ),
    er33Report: softWireRepoRelative(
      root,
      'docs/operations/62L_ER33_CROSS_DEVICE_RUNTIME_FEDERATION_REPORT.md',
      'ER33 report PRESENT.',
      'ER33 report absent — soft-wire WAITING_DATA.',
    ),
    er32ServerEdgeRuntimePackage: softWireFile(
      './server-edge-runtime-package-types.ts',
      'ER32 Server/Edge Runtime Package PRESENT (soft-wire).',
      'ER32 Server/Edge Runtime Package absent — soft-wire WAITING_DATA.',
    ),
    er32Report: softWireRepoRelative(
      root,
      'docs/operations/62L_ER32_SERVER_EDGE_RUNTIME_PACKAGE_REPORT.md',
      'ER32 report PRESENT.',
      'ER32 report absent — soft-wire WAITING_DATA.',
    ),
    er31AppleDeviceRuntimePackage: softWireFile(
      './apple-device-runtime-package-types.ts',
      'ER31 Apple Device Runtime Package PRESENT (soft-wire).',
      'ER31 Apple Device Runtime Package absent — soft-wire WAITING_DATA.',
    ),
    er31Report: softWireRepoRelative(
      root,
      'docs/operations/62L_ER31_APPLE_DEVICE_RUNTIME_PACKAGE_REPORT.md',
      'ER31 report PRESENT.',
      'ER31 report absent — soft-wire WAITING_DATA.',
    ),
    er30AndroidArmRuntimePackage: softWireFile(
      './android-arm-runtime-package-types.ts',
      'ER30 Android ARM Runtime Package PRESENT (soft-wire).',
      'ER30 Android ARM Runtime Package absent — soft-wire WAITING_DATA.',
    ),
    er30Report: softWireRepoRelative(
      root,
      'docs/operations/62L_ER30_ANDROID_ARM_RUNTIME_PACKAGE_CANDIDATE_REPORT.md',
      'ER30 report PRESENT.',
      'ER30 report absent — soft-wire WAITING_DATA.',
    ),
    er29WindowsRuntimePackage: softWireFile(
      './windows-runtime-package-types.ts',
      'ER29 Windows Runtime Package PRESENT (soft-wire).',
      'ER29 Windows Runtime Package absent — soft-wire WAITING_DATA.',
    ),
    er29Report: softWireRepoRelative(
      root,
      'docs/operations/62L_ER29_WINDOWS_RUNTIME_PACKAGE_REPORT.md',
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
    eq6ArchitectureCapabilityGraph: softWireFile(
      './architecture-capability-graph-types.ts',
      'EQ6 Architecture Capability Graph PRESENT (soft-wire).',
      'EQ6 Architecture Capability Graph absent — soft-wire WAITING_DATA.',
    ),
    eq6Report: softWireRepoRelative(
      root,
      'docs/operations/62L_EQ6_ARCHITECTURE_CAPABILITY_GRAPH_REPORT.md',
      'EQ6 report PRESENT.',
      'EQ6 report absent — soft-wire WAITING_DATA.',
    ),
    em157HomeBase: softWireFile(
      './agent-compute-home-base-types.ts',
      'EM (#157) Agent Compute Home Base PRESENT (soft-wire).',
      'EM (#157) Agent Compute Home Base absent — soft-wire WAITING_DATA.',
    ),
  };
}

export function softWireHopState(present: boolean): Er34EvidenceState {
  return present ? 'PASS' : 'WAITING_DATA';
}

export function isEr34Agent(actor: Er34Actor): boolean {
  return (
    actor.kind === 'capability_manifest_publisher' ||
    actor.kind === 'routing_agent' ||
    actor.kind === 'device_enroller'
  );
}

export function isHumanApprover(actor: Er34Actor): boolean {
  return (
    actor.kind === 'human_approver' ||
    actor.kind === 'founder' ||
    actor.kind === 'tenant_admin'
  );
}

/**
 * Ranking for minimum-state checks (higher = stronger evidence).
 * REVOKED / UNAVAILABLE are never eligible for routing matches.
 */
export const CAPABILITY_STATE_RANK: Record<CapabilityEvidenceState, number> =
  Object.freeze({
    REVOKED: -2,
    UNAVAILABLE: -1,
    STALE: 0,
    DOCUMENTED: 1,
    NOT_TESTED: 2,
    DETECTED: 3,
    DEGRADED: 3,
    SUPPORTED: 4,
    VERIFIED: 5,
  });

export function stateMeetsMinimum(
  actual: CapabilityEvidenceState,
  required: CapabilityEvidenceState,
): boolean {
  if (actual === 'REVOKED' || actual === 'UNAVAILABLE' || actual === 'STALE') {
    return false;
  }
  return CAPABILITY_STATE_RANK[actual] >= CAPABILITY_STATE_RANK[required];
}
