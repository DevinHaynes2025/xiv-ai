/**
 * 62L-ER32 — Edge / Vehicle Runtime Candidate (park-and-implement).
 *
 * Layer: 62L-ER Real API Data Fabric + Global Historical Knowledge Ingestion +
 * Offline/Online Brain Sync + Historical Avatar Simulations + Universal Device
 * Distribution (GitHub #162).
 *
 * Governed edge/vehicle runtime candidate for automotive, industrial, robotics,
 * warehouse, and field-compute environments — analytics and simulation only,
 * without autonomously controlling safety-critical systems.
 *
 * Core architecture:
 * Edge/Vehicle Device → enrollment → hardware capability probe → runtime
 * compatibility → local model/agent sandbox → telemetry/data-policy gate →
 * simulation/analytics → return receipt → XIV Home Base
 *
 * Soft-wire when PRESENT: ER31→ER28 (preferred bases; missing → WAITING_DATA),
 * EQ7 ARM edge/AMD accel. Presence ≠ VERIFIED.
 *
 * SoT: GitHub #162 / 62L-ER family. GitLab mirror: needsAuth; no number invented.
 *
 * Honesty: DOCUMENTED ≠ IMPLEMENTED ≠ VERIFIED ≠ PRODUCTION AUTHORIZED.
 * L4_AUTONOMY_ENABLED=false. Guardian/RLS/tenant/Universe unchanged.
 * DB candidates NOT_APPLIED. tip-land=NO.
 * Next (report only): ER33 — Runtime Update Channel.
 */

import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

export const HONESTY_BANNER =
  'DOCUMENTED ≠ IMPLEMENTED ≠ VERIFIED ≠ PRODUCTION AUTHORIZED' as const;

export const GITHUB_SOT_ISSUE = 162 as const;
export const GITHUB_SOT_LABEL = '62L-ER32' as const;
export const GITHUB_SOT_FAMILY = '62L-ER' as const;
export const GITHUB_SOT_TITLE =
  '62L-ER32 Edge / Vehicle Runtime Candidate — analytics/simulation only; hard lock on steering/braking/throttle/ECU/safety override/autonomous physical dispatch/driver-monitoring surveillance; telemetry enrollment gates; chip≠compatible' as const;

export const GITLAB_MIRROR_NOTE =
  'GitLab mirror: search attempted; MCP needsAuth / not resolved in this environment — no issue number invented.' as const;

export const ER32_DB_CANDIDATES_STATUS = 'NOT_APPLIED' as const;

export const ER_LAYER_TITLE =
  '62L-ER Real API Data Fabric + Global Historical Knowledge Ingestion + Offline/Online Brain Sync + Historical Avatar Simulations + Universal Device Distribution' as const;

export const NEXT_PHASE_TITLE =
  'ER33 — Runtime Update Channel — governed update/distribution channel for enrolled edge and vehicle runtimes without stealth install or safety-critical actuation.' as const;

/**
 * Edge / vehicle profile fields.
 */
export const EDGE_VEHICLE_PROFILE_FIELDS = [
  'nodeId',
  'devicePlatformType',
  'ownerOperator',
  'cpuGpuNpuAccelerator',
  'osRuntime',
  'modelSupport',
  'connectivity',
  'storage',
  'powerThermalState',
  'permittedSensorsData',
  'tenantUniverseScope',
  'safetyClassification',
  'runtimeState',
  'benchmarkRefs',
  'revocationState',
] as const;

export type EdgeVehicleProfileField =
  (typeof EDGE_VEHICLE_PROFILE_FIELDS)[number];

/**
 * Core architecture hops.
 */
export const EDGE_VEHICLE_CORE_ARCHITECTURE = [
  'edge_vehicle_device',
  'enrollment',
  'hardware_capability_probe',
  'runtime_compatibility',
  'local_model_agent_sandbox',
  'telemetry_data_policy_gate',
  'simulation_analytics',
  'return_receipt',
  'xiv_home_base',
] as const;

/**
 * Initial supported use cases (MAY).
 */
export const EDGE_VEHICLE_MAY_USE_CASES = [
  'fleet_logistics_analytics',
  'route_and_charging_simulations',
  'predictive_maintenance_research',
  'warehouse_industrial_monitoring',
  'edge_inference',
  'local_anomaly_detection',
  'asset_tracking',
  'offline_knowledge_search',
  'ev_adas_compute_benchmarking',
  'digital_twin_data_feeds',
] as const;

export type EdgeVehicleMayUseCase =
  (typeof EDGE_VEHICLE_MAY_USE_CASES)[number];

/**
 * Vehicle safety boundary — hard locks (MUST NOT).
 */
export const VEHICLE_SAFETY_MUST_NOT = [
  'steering',
  'braking',
  'throttle',
  'ecu_modification',
  'safety_system_override',
  'autonomous_dispatch_into_physical_operation',
  'driver_monitoring_surveillance',
] as const;

export type VehicleSafetyMustNot = (typeof VEHICLE_SAFETY_MUST_NOT)[number];

/**
 * XIV MAY analyze / simulate (not actuate).
 */
export const VEHICLE_ANALYTICS_MAY = [
  'route',
  'charging',
  'fleet_utilization',
  'maintenance',
  'sensor_trends',
  'compute_placement',
] as const;

/**
 * Telemetry privacy gate steps.
 */
export const TELEMETRY_PRIVACY_GATE = [
  'explicit_enrollment',
  'purpose',
  'permitted_fields',
  'retention',
  'deletion_revocation',
] as const;

/**
 * Runtime compatibility truth states — evidence-based only.
 * No vendor/product compatibility assumed merely because it contains a chip.
 */
export const RUNTIME_TRUTH_STATES = [
  'DOCUMENTED',
  'DETECTED',
  'SUPPORTED',
  'VERIFIED',
  'NOT_TESTED',
] as const;

export type RuntimeTruthState = (typeof RUNTIME_TRUTH_STATES)[number];

/**
 * Connectivity / home-base node states.
 */
export const EDGE_NODE_CONNECTIVITY_STATES = [
  'CONNECTED',
  'LOCAL_ONLY',
  'WAITING_NODE',
  'REVOKED',
] as const;

export type EdgeNodeConnectivityState =
  (typeof EDGE_NODE_CONNECTIVITY_STATES)[number];

/**
 * Home Base requirements for every edge node.
 */
export const HOME_BASE_EDGE_NODE_REQUIREMENTS = [
  'mission',
  'permissions',
  'resource_budget',
  'heartbeat',
  'return_path',
] as const;

export const EDGE_VEHICLE_RUNTIME_CANDIDATE_CYCLE = [
  'honesty_locks',
  'edge_vehicle_runtime_candidate_bootstrap',
  // A — Structure
  'edge_profile_fields_encoded',
  'core_architecture_encoded',
  'may_use_cases_encoded',
  'vehicle_safety_must_not_encoded',
  'telemetry_privacy_gate_encoded',
  'runtime_truth_states_encoded',
  'home_base_requirements_encoded',
  // B — Enrollment / analytics
  'enroll_edge_node',
  'allow_analytics_simulation_use_cases',
  'deny_safety_critical_vehicle_controls',
  // C — Telemetry / connectivity
  'telemetry_gate_enrollment_purpose_fields_retention',
  'precise_location_local_by_default',
  'connectivity_loss_local_only_or_waiting_node',
  // D — Compatibility honesty
  'deny_chip_implies_compatible',
  'runtime_truth_requires_compatibility_evidence',
  // E — Governance denies
  'deny_stealth_installation',
  'deny_privilege_escalation',
  'deny_firmware_flashing',
  'deny_unauthorized_can_network_access',
  'deny_cross_tenant_telemetry_pooling',
  'deny_hidden_cot',
  // F — Autonomy
  'guardian_rls_tenant_universe_isolation',
  'recommend_neq_act',
  'l4_autonomy_false',
  // G — Soft-wires
  'er_layer_context_documented',
  'er31_soft_wire',
  'er30_soft_wire',
  'er29_soft_wire',
  'er28_soft_wire',
  'eq7_soft_wire',
  'db_candidates_not_applied',
  'evidence',
] as const;

export type Er32Hop = (typeof EDGE_VEHICLE_RUNTIME_CANDIDATE_CYCLE)[number];

export type Er32EvidenceState =
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
  | 'PRODUCTION_AUTHORIZED'
  | 'RECOMMENDATION_ONLY'
  | 'PLAN_ONLY'
  | 'BOUNDED'
  | 'NOT_APPLIED'
  | 'NOT_TESTED'
  | 'NOT_AVAILABLE'
  | 'NOT_VERIFIED'
  | 'WAITING_DATA'
  | 'WAITING_NODE'
  | 'LOCAL_ONLY'
  | 'ADVISORY_ONLY'
  | 'REGISTERED'
  | 'ENROLLED'
  | 'HUMAN_APPROVAL_REQUIRED'
  | 'UNVERIFIED'
  | 'PARTIAL'
  | 'DEGRADED'
  | 'UNKNOWN'
  | 'REVOKED';

export type Er32HopRecord = {
  hop: Er32Hop;
  state: Er32EvidenceState;
  summary: string;
  at: string;
};

export type Er32ActorKind =
  | 'edge_vehicle_runtime'
  | 'edge_enrollment'
  | 'telemetry_policy'
  | 'simulation_analytics'
  | 'proposal'
  | 'human_approver'
  | 'founder'
  | 'guardian'
  | 'home_base'
  | 'tenant_admin';

export type Er32Actor = {
  kind: Er32ActorKind;
  id: string;
  orgId: string;
  tenantId: string;
  universeId: string;
  permissions: readonly string[];
};

export const ER32_LOCKS = Object.freeze({
  L4_AUTONOMY_ENABLED: false as const,
  TIP_LAND: false as const,
  PRODUCTION_AUTHORIZATION: false as const,
  PRODUCTION_WRITE: false as const,
  DB_CANDIDATES_APPLIED: false as const,
  FULL_PRODUCTION_EDGE_VEHICLE_RUNTIME_SHIPPED: false as const,
  MANAGE_PULL_REQUEST: false as const,

  // Vehicle safety hard locks
  STEERING_CONTROL: false as const,
  BRAKING_CONTROL: false as const,
  THROTTLE_CONTROL: false as const,
  ECU_MODIFICATION: false as const,
  SAFETY_SYSTEM_OVERRIDE: false as const,
  AUTONOMOUS_DISPATCH_INTO_PHYSICAL_OPERATION: false as const,
  DRIVER_MONITORING_SURVEILLANCE: false as const,

  // Compatibility honesty
  CHIP_IMPLIES_COMPATIBLE: false as const,
  VENDOR_COMPATIBILITY_ASSUMED_WITHOUT_EVIDENCE: false as const,

  // Telemetry / privacy
  TELEMETRY_WITHOUT_ENROLLMENT: false as const,
  TELEMETRY_WITHOUT_PURPOSE: false as const,
  TELEMETRY_WITHOUT_PERMITTED_FIELDS: false as const,
  TELEMETRY_WITHOUT_RETENTION_POLICY: false as const,
  PRECISE_LOCATION_CLOUD_BY_DEFAULT: false as const,
  CROSS_TENANT_TELEMETRY_POOLING: false as const,

  // Governance
  STEALTH_INSTALLATION: false as const,
  PRIVILEGE_ESCALATION: false as const,
  FIRMWARE_FLASHING: false as const,
  UNAUTHORIZED_CAN_NETWORK_ACCESS: false as const,
  HIDDEN_CHAIN_OF_THOUGHT_IN_ER32: false as const,

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
  PRECISE_LOCATION_LOCAL_BY_DEFAULT: true as const,
});

export const ER32_AGENT_BOUNDS = Object.freeze({
  mayEnrollEdgeNodes: true as const,
  mayRunAnalyticsAndSimulation: true as const,
  mayGateTelemetryByEnrollmentPurposeFieldsRetention: true as const,
  mayCheckpointLocallyOnConnectivityLoss: true as const,
  mayReturnReceiptToHomeBase: true as const,
  mayRecordCompatibilityEvidence: true as const,
  automaticAuthority: false as const,
  mayControlSteering: false as const,
  mayControlBraking: false as const,
  mayControlThrottle: false as const,
  mayModifyEcu: false as const,
  mayOverrideSafetySystems: false as const,
  mayAutonomousDispatchPhysical: false as const,
  mayDriverMonitoringSurveillance: false as const,
  mayAssumeChipImpliesCompatible: false as const,
  mayStealthInstall: false as const,
  mayPrivilegeEscalate: false as const,
  mayFlashFirmware: false as const,
  mayUnauthorizedCanAccess: false as const,
  mayPoolCrossTenantTelemetry: false as const,
  mayIncludeHiddenChainOfThought: false as const,
  mayRecommendOnly: true as const,
});

export const ER32_MAY = Object.freeze([
  'enroll_edge_vehicle_nodes_with_explicit_consent',
  'run_fleet_logistics_route_charging_maintenance_analytics',
  'run_warehouse_industrial_edge_inference_and_anomaly_detection',
  'feed_digital_twins_and_offline_knowledge_search',
  'benchmark_ev_adas_compute_without_actuation',
  'checkpoint_locally_on_connectivity_loss_LOCAL_ONLY_or_WAITING_NODE',
  'require_compatibility_evidence_for_SUPPORTED_or_VERIFIED',
] as const);

export const ER32_MUST_NOT = Object.freeze([
  'control_steering_braking_throttle',
  'modify_ecu_or_override_safety_systems',
  'autonomous_dispatch_into_physical_operation',
  'driver_monitoring_surveillance',
  'assume_chip_implies_runtime_compatible',
  'stealth_install_privilege_escalate_or_flash_firmware',
  'unauthorized_can_or_network_access',
  'cross_tenant_telemetry_pooling',
  'store_hidden_chain_of_thought',
  'bypass_guardian_rls_tenant_universe',
  'treat_recommend_as_act',
  'grant_agents_automatic_authority',
  'enable_l4_autonomy',
] as const);

export type SoftWirePresence = {
  present: boolean;
  pathChecked: string;
  note: string;
};

export type Er32SoftWireSnapshot = {
  er31IosAppleRuntimeResearch: SoftWirePresence;
  er31Report: SoftWirePresence;
  er30AndroidArmRuntimePackage: SoftWirePresence;
  er30Report: SoftWirePresence;
  er29WindowsRuntimePackage: SoftWirePresence;
  er29Report: SoftWirePresence;
  er28UniversalRuntimePackageContract: SoftWirePresence;
  er28Report: SoftWirePresence;
  eq7ArmEdgeAmdAcceleration: SoftWirePresence;
  eq7Report: SoftWirePresence;
};

export function assertEr32LocksIntact(): boolean {
  return (
    ER32_LOCKS.L4_AUTONOMY_ENABLED === false &&
    ER32_LOCKS.STEERING_CONTROL === false &&
    ER32_LOCKS.BRAKING_CONTROL === false &&
    ER32_LOCKS.THROTTLE_CONTROL === false &&
    ER32_LOCKS.ECU_MODIFICATION === false &&
    ER32_LOCKS.SAFETY_SYSTEM_OVERRIDE === false &&
    ER32_LOCKS.AUTONOMOUS_DISPATCH_INTO_PHYSICAL_OPERATION === false &&
    ER32_LOCKS.DRIVER_MONITORING_SURVEILLANCE === false &&
    ER32_LOCKS.CHIP_IMPLIES_COMPATIBLE === false &&
    ER32_LOCKS.VENDOR_COMPATIBILITY_ASSUMED_WITHOUT_EVIDENCE === false &&
    ER32_LOCKS.TELEMETRY_WITHOUT_ENROLLMENT === false &&
    ER32_LOCKS.TELEMETRY_WITHOUT_PURPOSE === false &&
    ER32_LOCKS.TELEMETRY_WITHOUT_PERMITTED_FIELDS === false &&
    ER32_LOCKS.TELEMETRY_WITHOUT_RETENTION_POLICY === false &&
    ER32_LOCKS.PRECISE_LOCATION_CLOUD_BY_DEFAULT === false &&
    ER32_LOCKS.PRECISE_LOCATION_LOCAL_BY_DEFAULT === true &&
    ER32_LOCKS.CROSS_TENANT_TELEMETRY_POOLING === false &&
    ER32_LOCKS.STEALTH_INSTALLATION === false &&
    ER32_LOCKS.PRIVILEGE_ESCALATION === false &&
    ER32_LOCKS.FIRMWARE_FLASHING === false &&
    ER32_LOCKS.UNAUTHORIZED_CAN_NETWORK_ACCESS === false &&
    ER32_LOCKS.HIDDEN_CHAIN_OF_THOUGHT_IN_ER32 === false &&
    ER32_LOCKS.AGENT_AUTO_AUTHORITY === false &&
    ER32_LOCKS.RECOMMEND_EQ_ACT === false &&
    ER32_LOCKS.RECOMMEND_EQ_AUTHORIZE === false &&
    ER32_LOCKS.BYPASS_GUARDIAN_RLS_TENANT_UNIVERSE === false &&
    ER32_LOCKS.GUARDIAN_RLS_TENANT_UNIVERSE_ISOLATION_UNCHANGED === true &&
    ER32_LOCKS.HUMAN_APPROVAL_BOUNDARIES_UNCHANGED === true &&
    ER32_LOCKS.DOCUMENTED_EQ_IMPLEMENTED === false &&
    ER32_LOCKS.IMPLEMENTED_EQ_VERIFIED === false &&
    ER32_LOCKS.VERIFIED_EQ_PRODUCTION_AUTHORIZED === false &&
    ER32_LOCKS.HUMAN_APPROVAL_REQUIRED_BEFORE_CONSEQUENTIAL_ACTIONS === true &&
    ER32_LOCKS.TIP_LAND === false &&
    ER32_LOCKS.PRODUCTION_AUTHORIZATION === false &&
    ER32_LOCKS.DB_CANDIDATES_APPLIED === false &&
    ER32_LOCKS.FULL_PRODUCTION_EDGE_VEHICLE_RUNTIME_SHIPPED === false &&
    ER32_LOCKS.MANAGE_PULL_REQUEST === false &&
    ER32_AGENT_BOUNDS.automaticAuthority === false &&
    ER32_AGENT_BOUNDS.mayControlSteering === false &&
    ER32_AGENT_BOUNDS.mayControlBraking === false &&
    ER32_AGENT_BOUNDS.mayControlThrottle === false &&
    ER32_AGENT_BOUNDS.mayModifyEcu === false &&
    ER32_AGENT_BOUNDS.mayOverrideSafetySystems === false &&
    ER32_AGENT_BOUNDS.mayAutonomousDispatchPhysical === false &&
    ER32_AGENT_BOUNDS.mayDriverMonitoringSurveillance === false &&
    ER32_AGENT_BOUNDS.mayAssumeChipImpliesCompatible === false &&
    ER32_AGENT_BOUNDS.mayStealthInstall === false &&
    ER32_AGENT_BOUNDS.mayPrivilegeEscalate === false &&
    ER32_AGENT_BOUNDS.mayFlashFirmware === false &&
    ER32_AGENT_BOUNDS.mayUnauthorizedCanAccess === false &&
    ER32_AGENT_BOUNDS.mayPoolCrossTenantTelemetry === false &&
    ER32_AGENT_BOUNDS.mayIncludeHiddenChainOfThought === false
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

export function er32SoftWireSnapshot(repoRoot?: string): Er32SoftWireSnapshot {
  const root =
    repoRoot ?? join(dirname(fileURLToPath(import.meta.url)), '../../..');

  return {
    er31IosAppleRuntimeResearch: softWireFile(
      './ios-apple-runtime-research-candidate-types.ts',
      'ER31 iOS / Apple Runtime Research Candidate PRESENT (soft-wire).',
      'ER31 iOS / Apple Runtime Research Candidate absent — soft-wire WAITING_DATA.',
    ),
    er31Report: softWireRepoRelative(
      root,
      'docs/operations/62L_ER31_IOS_APPLE_RUNTIME_RESEARCH_CANDIDATE_REPORT.md',
      'ER31 report PRESENT (soft-wire).',
      'ER31 report absent — soft-wire WAITING_DATA.',
    ),
    er30AndroidArmRuntimePackage: softWireFile(
      './android-arm-runtime-package-candidate-types.ts',
      'ER30 Android / ARM Runtime Package Candidate PRESENT (soft-wire).',
      'ER30 Android / ARM Runtime Package Candidate absent — soft-wire WAITING_DATA.',
    ),
    er30Report: softWireRepoRelative(
      root,
      'docs/operations/62L_ER30_ANDROID_ARM_RUNTIME_PACKAGE_CANDIDATE_REPORT.md',
      'ER30 report PRESENT (soft-wire).',
      'ER30 report absent — soft-wire WAITING_DATA.',
    ),
    er29WindowsRuntimePackage: softWireFile(
      './windows-runtime-package-candidate-types.ts',
      'ER29 Windows Runtime Package Candidate PRESENT (soft-wire).',
      'ER29 Windows Runtime Package Candidate absent — soft-wire WAITING_DATA.',
    ),
    er29Report: softWireRepoRelative(
      root,
      'docs/operations/62L_ER29_WINDOWS_RUNTIME_PACKAGE_CANDIDATE_REPORT.md',
      'ER29 report PRESENT (soft-wire).',
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
      'ER28 report PRESENT (soft-wire).',
      'ER28 report absent — soft-wire WAITING_DATA.',
    ),
    eq7ArmEdgeAmdAcceleration: softWireFile(
      './arm-edge-amd-acceleration-types.ts',
      'EQ7 ARM Edge/Phone + AMD XIV Acceleration PRESENT (soft-wire).',
      'EQ7 ARM Edge/Phone + AMD XIV Acceleration absent — soft-wire WAITING_DATA.',
    ),
    eq7Report: softWireRepoRelative(
      root,
      'docs/operations/62L_EQ7_ARM_EDGE_AMD_ACCELERATION_REPORT.md',
      'EQ7 report PRESENT (soft-wire).',
      'EQ7 report absent — soft-wire WAITING_DATA.',
    ),
  };
}

export function softWireHopState(present: boolean): Er32EvidenceState {
  return present ? 'PASS' : 'WAITING_DATA';
}

export function isEr32Agent(actor: Er32Actor): boolean {
  return (
    actor.kind === 'edge_vehicle_runtime' ||
    actor.kind === 'edge_enrollment' ||
    actor.kind === 'telemetry_policy' ||
    actor.kind === 'simulation_analytics' ||
    actor.kind === 'proposal' ||
    actor.kind === 'home_base'
  );
}

export function isHumanApprover(actor: Er32Actor): boolean {
  return (
    actor.kind === 'human_approver' ||
    actor.kind === 'founder' ||
    actor.kind === 'tenant_admin' ||
    actor.permissions.includes('approve_consequential')
  );
}

export function chipImpliesCompatible(): false {
  return false;
}

export function mayControlSafetyCriticalVehicleSystems(): false {
  return false;
}

export function preciseLocationLocalByDefault(): true {
  return true;
}

export type EdgeVehicleProfile = {
  nodeId: string;
  devicePlatformType: string;
  ownerOperator: string;
  cpuGpuNpuAccelerator: string;
  osRuntime: string;
  modelSupport: readonly string[];
  connectivity: EdgeNodeConnectivityState;
  storage: string;
  powerThermalState: string;
  permittedSensorsData: readonly string[];
  tenantId: string;
  universeId: string;
  orgId: string;
  safetyClassification: 'NON_SAFETY_CRITICAL_ANALYTICS' | 'SAFETY_CRITICAL_LOCKED';
  runtimeState: RuntimeTruthState;
  benchmarkRefs: readonly string[];
  revocationState: 'ACTIVE' | 'REVOKED';
  enrolled: true;
  stealthInstall: false;
  mission: string;
  permissions: readonly string[];
  resourceBudget: string;
  heartbeatIntervalSec: number;
  returnPath: string;
};

export type TelemetryPolicy = {
  policyId: string;
  nodeId: string;
  explicitEnrollment: true;
  purpose: string;
  permittedFields: readonly string[];
  retention: string;
  deletionRevocationPath: string;
  preciseLocationLocalByDefault: true;
  tenantId: string;
  universeId: string;
  orgId: string;
};

export type CompatibilityEvidence = {
  evidenceId: string;
  nodeId: string;
  chipPresent: boolean;
  runtimeProbed: boolean;
  workloadExercised: boolean;
  truthState: RuntimeTruthState;
  claimsChipImpliesCompatible: false;
};
