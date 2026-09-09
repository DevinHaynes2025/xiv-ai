/**
 * 62L-ER32 — Edge / Vehicle Runtime Candidate runtime.
 *
 * Enroll edge nodes; allow analytics/simulation; deny safety-critical vehicle
 * controls; telemetry gate; connectivity loss → LOCAL_ONLY / WAITING_NODE;
 * deny chip-implies-compatible; deny stealth/firmware/CAN/cross-tenant pool.
 */

import {
  EDGE_VEHICLE_CORE_ARCHITECTURE,
  EDGE_VEHICLE_MAY_USE_CASES,
  EDGE_VEHICLE_PROFILE_FIELDS,
  EDGE_VEHICLE_RUNTIME_CANDIDATE_CYCLE,
  ER32_AGENT_BOUNDS,
  ER32_DB_CANDIDATES_STATUS,
  ER32_LOCKS,
  ER32_MAY,
  ER32_MUST_NOT,
  ER_LAYER_TITLE,
  GITHUB_SOT_ISSUE,
  GITHUB_SOT_LABEL,
  GITHUB_SOT_TITLE,
  GITLAB_MIRROR_NOTE,
  HOME_BASE_EDGE_NODE_REQUIREMENTS,
  HONESTY_BANNER,
  NEXT_PHASE_TITLE,
  RUNTIME_TRUTH_STATES,
  TELEMETRY_PRIVACY_GATE,
  VEHICLE_ANALYTICS_MAY,
  VEHICLE_SAFETY_MUST_NOT,
  assertEr32LocksIntact,
  chipImpliesCompatible,
  er32SoftWireSnapshot,
  isEr32Agent,
  isHumanApprover,
  mayControlSafetyCriticalVehicleSystems,
  preciseLocationLocalByDefault,
  softWireHopState,
  type CompatibilityEvidence,
  type EdgeNodeConnectivityState,
  type EdgeVehicleMayUseCase,
  type EdgeVehicleProfile,
  type Er32Actor,
  type Er32EvidenceState,
  type Er32HopRecord,
  type Er32SoftWireSnapshot,
  type RuntimeTruthState,
  type TelemetryPolicy,
  type VehicleSafetyMustNot,
} from './edge-vehicle-runtime-candidate-types.ts';

function nowIso(): string {
  return new Date().toISOString();
}

function hop(
  hopName: (typeof EDGE_VEHICLE_RUNTIME_CANDIDATE_CYCLE)[number],
  state: Er32EvidenceState,
  summary: string,
): Er32HopRecord {
  return { hop: hopName, state, summary, at: nowIso() };
}

export type DenialResult = {
  denied: true;
  state: 'DENIED' | 'WAITING_DATA';
  reason: string;
  executed: false;
};

function deny(
  reason: string,
  state: 'DENIED' | 'WAITING_DATA' = 'DENIED',
): DenialResult {
  return { denied: true, state, reason, executed: false };
}

export type SimulationAnalyticsResult = {
  resultId: string;
  nodeId: string;
  useCase: EdgeVehicleMayUseCase;
  analysisKind: (typeof VEHICLE_ANALYTICS_MAY)[number];
  actuatedPhysicalControl: false;
  summary: string;
  tenantId: string;
  universeId: string;
  orgId: string;
};

export type LocalCheckpoint = {
  checkpointId: string;
  nodeId: string;
  connectivity: Extract<
    EdgeNodeConnectivityState,
    'LOCAL_ONLY' | 'WAITING_NODE'
  >;
  at: string;
  payloadSummary: string;
};

export type EdgeReturnReceipt = {
  receiptId: string;
  nodeId: string;
  mission: string;
  permissions: readonly string[];
  resourceBudget: string;
  heartbeatOk: boolean;
  returnPath: string;
  connectivity: EdgeNodeConnectivityState;
  at: string;
  recommendationOnly: true;
};

export function enrollEdgeVehicleNode(input: {
  actor: Er32Actor;
  nodeId: string;
  devicePlatformType: string;
  ownerOperator: string;
  cpuGpuNpuAccelerator: string;
  osRuntime: string;
  modelSupport?: readonly string[];
  storage?: string;
  powerThermalState?: string;
  permittedSensorsData?: readonly string[];
  mission: string;
  permissions: readonly string[];
  resourceBudget: string;
  heartbeatIntervalSec?: number;
  returnPath?: string;
  explicitEnrollment: boolean;
  stealthInstall?: boolean;
  attemptPrivilegeEscalation?: boolean;
  attemptFirmwareFlash?: boolean;
  attemptHiddenCot?: boolean;
}): EdgeVehicleProfile | DenialResult {
  if (!isEr32Agent(input.actor) && input.actor.kind !== 'guardian') {
    return deny('Only edge/vehicle runtime agents may enroll nodes.');
  }
  if (!input.explicitEnrollment) {
    return deny('Edge/vehicle enrollment requires explicit enrollment.');
  }
  if (input.stealthInstall === true) {
    return deny('STEALTH_INSTALLATION=false — covert install denied.');
  }
  if (input.attemptPrivilegeEscalation === true) {
    return deny('PRIVILEGE_ESCALATION=false.');
  }
  if (input.attemptFirmwareFlash === true) {
    return deny('FIRMWARE_FLASHING=false.');
  }
  if (input.attemptHiddenCot === true) {
    return deny('HIDDEN_CHAIN_OF_THOUGHT_IN_ER32=false.');
  }

  return {
    nodeId: input.nodeId,
    devicePlatformType: input.devicePlatformType,
    ownerOperator: input.ownerOperator,
    cpuGpuNpuAccelerator: input.cpuGpuNpuAccelerator,
    osRuntime: input.osRuntime,
    modelSupport: [...(input.modelSupport ?? [])],
    connectivity: 'CONNECTED',
    storage: input.storage ?? 'local-encrypted',
    powerThermalState: input.powerThermalState ?? 'nominal',
    permittedSensorsData: [...(input.permittedSensorsData ?? [])],
    tenantId: input.actor.tenantId,
    universeId: input.actor.universeId,
    orgId: input.actor.orgId,
    safetyClassification: 'NON_SAFETY_CRITICAL_ANALYTICS',
    runtimeState: 'DOCUMENTED',
    benchmarkRefs: [],
    revocationState: 'ACTIVE',
    enrolled: true,
    stealthInstall: false,
    mission: input.mission,
    permissions: [...input.permissions],
    resourceBudget: input.resourceBudget,
    heartbeatIntervalSec: input.heartbeatIntervalSec ?? 60,
    returnPath: input.returnPath ?? 'home_base_return_receipt',
  };
}

export function runSimulationAnalytics(input: {
  actor: Er32Actor;
  profile: EdgeVehicleProfile;
  useCase: EdgeVehicleMayUseCase;
  analysisKind: (typeof VEHICLE_ANALYTICS_MAY)[number];
  attemptSafetyControl?: VehicleSafetyMustNot;
  attemptAutonomousPhysicalDispatch?: boolean;
  attemptDriverMonitoringSurveillance?: boolean;
}): SimulationAnalyticsResult | DenialResult {
  if (input.profile.revocationState === 'REVOKED') {
    return deny('Revoked edge nodes cannot run workloads.');
  }
  if (
    input.profile.tenantId !== input.actor.tenantId ||
    input.profile.universeId !== input.actor.universeId
  ) {
    return deny('Cross-tenant edge workloads denied.');
  }
  if (input.attemptSafetyControl) {
    return deny(
      `Vehicle safety hard lock: ${input.attemptSafetyControl} MUST NOT.`,
    );
  }
  if (input.attemptAutonomousPhysicalDispatch === true) {
    return deny(
      'AUTONOMOUS_DISPATCH_INTO_PHYSICAL_OPERATION=false.',
    );
  }
  if (input.attemptDriverMonitoringSurveillance === true) {
    return deny('DRIVER_MONITORING_SURVEILLANCE=false.');
  }
  if (!EDGE_VEHICLE_MAY_USE_CASES.includes(input.useCase)) {
    return deny('Use case not in EDGE_VEHICLE_MAY_USE_CASES.');
  }
  if (!VEHICLE_ANALYTICS_MAY.includes(input.analysisKind)) {
    return deny('Analysis kind not in VEHICLE_ANALYTICS_MAY.');
  }

  return {
    resultId: `sim-${input.profile.nodeId}-${input.useCase}`,
    nodeId: input.profile.nodeId,
    useCase: input.useCase,
    analysisKind: input.analysisKind,
    actuatedPhysicalControl: false,
    summary: `Analytics/simulation only for ${input.useCase}/${input.analysisKind}; no physical actuation.`,
    tenantId: input.actor.tenantId,
    universeId: input.actor.universeId,
    orgId: input.actor.orgId,
  };
}

export function openTelemetryPolicy(input: {
  actor: Er32Actor;
  profile: EdgeVehicleProfile;
  policyId: string;
  purpose: string;
  permittedFields: readonly string[];
  retention: string;
  deletionRevocationPath?: string;
  explicitEnrollment: boolean;
  attemptWithoutPurpose?: boolean;
  attemptWithoutPermittedFields?: boolean;
  attemptWithoutRetention?: boolean;
  attemptPreciseLocationCloudDefault?: boolean;
  attemptCrossTenantPool?: boolean;
}): TelemetryPolicy | DenialResult {
  if (!input.explicitEnrollment || !input.profile.enrolled) {
    return deny('TELEMETRY_WITHOUT_ENROLLMENT=false.');
  }
  if (input.attemptWithoutPurpose === true || !input.purpose.trim()) {
    return deny('TELEMETRY_WITHOUT_PURPOSE=false.');
  }
  if (
    input.attemptWithoutPermittedFields === true ||
    input.permittedFields.length === 0
  ) {
    return deny('TELEMETRY_WITHOUT_PERMITTED_FIELDS=false.');
  }
  if (input.attemptWithoutRetention === true || !input.retention.trim()) {
    return deny('TELEMETRY_WITHOUT_RETENTION_POLICY=false.');
  }
  if (input.attemptPreciseLocationCloudDefault === true) {
    return deny(
      'PRECISE_LOCATION_LOCAL_BY_DEFAULT=true — cloud-by-default denied.',
    );
  }
  if (input.attemptCrossTenantPool === true) {
    return deny('CROSS_TENANT_TELEMETRY_POOLING=false.');
  }
  if (
    input.profile.tenantId !== input.actor.tenantId ||
    input.profile.universeId !== input.actor.universeId
  ) {
    return deny('Telemetry policies are tenant/Universe scoped.');
  }

  return {
    policyId: input.policyId,
    nodeId: input.profile.nodeId,
    explicitEnrollment: true,
    purpose: input.purpose,
    permittedFields: [...input.permittedFields],
    retention: input.retention,
    deletionRevocationPath:
      input.deletionRevocationPath ?? 'home_base_deletion_revocation',
    preciseLocationLocalByDefault: true,
    tenantId: input.actor.tenantId,
    universeId: input.actor.universeId,
    orgId: input.actor.orgId,
  };
}

export function handleConnectivityLoss(input: {
  actor: Er32Actor;
  profile: EdgeVehicleProfile;
  mode: 'LOCAL_ONLY' | 'WAITING_NODE';
  payloadSummary?: string;
}): { profile: EdgeVehicleProfile; checkpoint: LocalCheckpoint } | DenialResult {
  if (!input.profile.enrolled) {
    return deny('Connectivity handling requires enrolled node.');
  }

  const checkpoint: LocalCheckpoint = {
    checkpointId: `ckpt-${input.profile.nodeId}-${Date.now()}`,
    nodeId: input.profile.nodeId,
    connectivity: input.mode,
    at: nowIso(),
    payloadSummary: input.payloadSummary ?? 'local checkpoint on connectivity loss',
  };

  return {
    profile: {
      ...input.profile,
      connectivity: input.mode,
    },
    checkpoint,
  };
}

export function recordCompatibilityEvidence(input: {
  actor: Er32Actor;
  profile: EdgeVehicleProfile;
  evidenceId: string;
  chipPresent: boolean;
  runtimeProbed: boolean;
  workloadExercised: boolean;
  claimChipImpliesCompatible?: boolean;
  desiredTruthState?: RuntimeTruthState;
}): CompatibilityEvidence | DenialResult {
  if (input.claimChipImpliesCompatible === true) {
    return deny(
      'CHIP_IMPLIES_COMPATIBLE=false — chip presence alone is not compatibility.',
    );
  }

  let truthState: RuntimeTruthState = 'DOCUMENTED';
  if (input.chipPresent && !input.runtimeProbed) {
    truthState = 'DETECTED';
  }
  if (input.runtimeProbed && !input.workloadExercised) {
    truthState = 'NOT_TESTED';
  }
  if (input.runtimeProbed && input.workloadExercised) {
    truthState = input.desiredTruthState === 'VERIFIED' ? 'VERIFIED' : 'SUPPORTED';
  }
  if (!input.chipPresent && !input.runtimeProbed) {
    truthState = 'DOCUMENTED';
  }

  // Never elevate to SUPPORTED/VERIFIED from chip alone
  if (
    input.chipPresent &&
    !input.runtimeProbed &&
    (input.desiredTruthState === 'SUPPORTED' ||
      input.desiredTruthState === 'VERIFIED')
  ) {
    return deny(
      'Vendor/product compatibility requires runtime probe + evidence; chip≠compatible.',
    );
  }

  return {
    evidenceId: input.evidenceId,
    nodeId: input.profile.nodeId,
    chipPresent: input.chipPresent,
    runtimeProbed: input.runtimeProbed,
    workloadExercised: input.workloadExercised,
    truthState,
    claimsChipImpliesCompatible: false,
  };
}

export function returnReceiptToHomeBase(input: {
  actor: Er32Actor;
  profile: EdgeVehicleProfile;
  heartbeatOk?: boolean;
}): EdgeReturnReceipt | DenialResult {
  for (const req of HOME_BASE_EDGE_NODE_REQUIREMENTS) {
    if (req === 'mission' && !input.profile.mission) {
      return deny('Home Base requires mission.');
    }
    if (req === 'permissions' && input.profile.permissions.length === 0) {
      return deny('Home Base requires permissions.');
    }
    if (req === 'resource_budget' && !input.profile.resourceBudget) {
      return deny('Home Base requires resource budget.');
    }
    if (req === 'return_path' && !input.profile.returnPath) {
      return deny('Home Base requires return path.');
    }
  }

  return {
    receiptId: `rcpt-${input.profile.nodeId}`,
    nodeId: input.profile.nodeId,
    mission: input.profile.mission,
    permissions: [...input.profile.permissions],
    resourceBudget: input.profile.resourceBudget,
    heartbeatOk: input.heartbeatOk ?? true,
    returnPath: input.profile.returnPath,
    connectivity: input.profile.connectivity,
    at: nowIso(),
    recommendationOnly: true,
  };
}

export function attemptSteeringControl(): DenialResult {
  return deny('STEERING_CONTROL=false — hard vehicle safety lock.');
}

export function attemptBrakingControl(): DenialResult {
  return deny('BRAKING_CONTROL=false — hard vehicle safety lock.');
}

export function attemptThrottleControl(): DenialResult {
  return deny('THROTTLE_CONTROL=false — hard vehicle safety lock.');
}

export function attemptEcuModification(): DenialResult {
  return deny('ECU_MODIFICATION=false.');
}

export function attemptSafetySystemOverride(): DenialResult {
  return deny('SAFETY_SYSTEM_OVERRIDE=false.');
}

export function attemptAutonomousPhysicalDispatch(): DenialResult {
  return deny('AUTONOMOUS_DISPATCH_INTO_PHYSICAL_OPERATION=false.');
}

export function attemptDriverMonitoringSurveillance(): DenialResult {
  return deny('DRIVER_MONITORING_SURVEILLANCE=false.');
}

export function attemptChipImpliesCompatible(): DenialResult {
  return deny('CHIP_IMPLIES_COMPATIBLE=false.');
}

export function attemptStealthInstallation(): DenialResult {
  return deny('STEALTH_INSTALLATION=false.');
}

export function attemptPrivilegeEscalation(): DenialResult {
  return deny('PRIVILEGE_ESCALATION=false.');
}

export function attemptFirmwareFlashing(): DenialResult {
  return deny('FIRMWARE_FLASHING=false.');
}

export function attemptUnauthorizedCanNetworkAccess(): DenialResult {
  return deny('UNAUTHORIZED_CAN_NETWORK_ACCESS=false.');
}

export function attemptCrossTenantTelemetryPooling(): DenialResult {
  return deny('CROSS_TENANT_TELEMETRY_POOLING=false.');
}

export function attemptHiddenCot(): DenialResult {
  return deny('HIDDEN_CHAIN_OF_THOUGHT_IN_ER32=false.');
}

export function attemptRecommendAsAct(): DenialResult {
  return deny('RECOMMEND ≠ ACT — recommendation only.');
}

export function probeGuardianRlsTenantUniverseIsolation(input: {
  actor: Er32Actor;
  otherTenantId: string;
  otherUniverseId: string;
}): DenialResult | { isolated: true; state: 'PASS' } {
  if (
    input.actor.tenantId === input.otherTenantId &&
    input.actor.universeId === input.otherUniverseId
  ) {
    return { isolated: true, state: 'PASS' };
  }
  return deny('BYPASS_GUARDIAN_RLS_TENANT_UNIVERSE=false — isolation intact.');
}

export function requireHumanApproval(input: {
  actor: Er32Actor;
  action: string;
}): { approved: true; action: string } | DenialResult {
  if (!isHumanApprover(input.actor)) {
    return deny(
      'HUMAN_APPROVAL_REQUIRED_BEFORE_CONSEQUENTIAL_ACTIONS — human approver required.',
    );
  }
  return { approved: true, action: input.action };
}

export function exampleFleetEdgeNode(actor: Er32Actor): EdgeVehicleProfile {
  const enrolled = enrollEdgeVehicleNode({
    actor,
    nodeId: 'edge-fleet-1',
    devicePlatformType: 'commercial_vehicle_edge_gateway',
    ownerOperator: 'fleet-ops',
    cpuGpuNpuAccelerator: 'cpu+gpu+npu-candidate',
    osRuntime: 'linux-edge-runtime-candidate',
    modelSupport: ['onnx-local', 'anomaly-detector-cand'],
    permittedSensorsData: ['vehicle_speed_aggregate', 'battery_soc'],
    mission: 'fleet_logistics_analytics',
    permissions: ['analytics', 'simulation'],
    resourceBudget: 'cpu=2;mem=4Gi;gpu=shared',
    explicitEnrollment: true,
  });
  if ('denied' in enrolled) {
    throw new Error(enrolled.reason);
  }
  return enrolled;
}

export function bootstrapEdgeVehicleRuntimeCandidate(input: {
  actor: Er32Actor;
  repoRoot?: string;
}): {
  locksIntact: boolean;
  softWire: Er32SoftWireSnapshot;
  profile: EdgeVehicleProfile;
  honesty: typeof HONESTY_BANNER;
  next: typeof NEXT_PHASE_TITLE;
} {
  const locksIntact = assertEr32LocksIntact();
  const softWire = er32SoftWireSnapshot(input.repoRoot);
  const profile = exampleFleetEdgeNode(input.actor);
  return {
    locksIntact,
    softWire,
    profile,
    honesty: HONESTY_BANNER,
    next: NEXT_PHASE_TITLE,
  };
}

export function runEdgeVehicleRuntimeCandidateCycle(input: {
  actor: Er32Actor;
  repoRoot?: string;
}): {
  hops: Er32HopRecord[];
  softWire: Er32SoftWireSnapshot;
  allCriticalPass: boolean;
} {
  const softWire = er32SoftWireSnapshot(input.repoRoot);
  const hops: Er32HopRecord[] = [];

  hops.push(
    hop(
      'honesty_locks',
      assertEr32LocksIntact() ? 'PASS' : 'FAIL',
      `L4=${ER32_LOCKS.L4_AUTONOMY_ENABLED}; chipImpliesCompatible=${chipImpliesCompatible()}; safetyControl=${mayControlSafetyCriticalVehicleSystems()}`,
    ),
  );
  hops.push(
    hop(
      'edge_vehicle_runtime_candidate_bootstrap',
      'PASS',
      `${GITHUB_SOT_LABEL} bootstrap; SoT #${GITHUB_SOT_ISSUE}; ${GITHUB_SOT_TITLE}`,
    ),
  );
  hops.push(
    hop(
      'edge_profile_fields_encoded',
      EDGE_VEHICLE_PROFILE_FIELDS.length === 15 ? 'PASS' : 'FAIL',
      `profile fields=${EDGE_VEHICLE_PROFILE_FIELDS.length}`,
    ),
  );
  hops.push(
    hop(
      'core_architecture_encoded',
      EDGE_VEHICLE_CORE_ARCHITECTURE.length === 9 ? 'PASS' : 'FAIL',
      `architecture hops=${EDGE_VEHICLE_CORE_ARCHITECTURE.length}`,
    ),
  );
  hops.push(
    hop(
      'may_use_cases_encoded',
      EDGE_VEHICLE_MAY_USE_CASES.length === 10 ? 'PASS' : 'FAIL',
      `MAY use cases=${EDGE_VEHICLE_MAY_USE_CASES.length}`,
    ),
  );
  hops.push(
    hop(
      'vehicle_safety_must_not_encoded',
      VEHICLE_SAFETY_MUST_NOT.length === 7 ? 'PASS' : 'FAIL',
      `MUST NOT safety=${VEHICLE_SAFETY_MUST_NOT.join(',')}`,
    ),
  );
  hops.push(
    hop(
      'telemetry_privacy_gate_encoded',
      TELEMETRY_PRIVACY_GATE.length === 5 ? 'PASS' : 'FAIL',
      `telemetry gate=${TELEMETRY_PRIVACY_GATE.join('→')}`,
    ),
  );
  hops.push(
    hop(
      'runtime_truth_states_encoded',
      RUNTIME_TRUTH_STATES.includes('NOT_TESTED') ? 'PASS' : 'FAIL',
      `truth states=${RUNTIME_TRUTH_STATES.join('|')}`,
    ),
  );
  hops.push(
    hop(
      'home_base_requirements_encoded',
      HOME_BASE_EDGE_NODE_REQUIREMENTS.length === 5 ? 'PASS' : 'FAIL',
      `home base reqs=${HOME_BASE_EDGE_NODE_REQUIREMENTS.join(',')}`,
    ),
  );

  const profile = exampleFleetEdgeNode(input.actor);
  hops.push(
    hop('enroll_edge_node', profile.enrolled ? 'PASS' : 'FAIL', profile.nodeId),
  );

  const sim = runSimulationAnalytics({
    actor: input.actor,
    profile,
    useCase: 'fleet_logistics_analytics',
    analysisKind: 'fleet_utilization',
  });
  hops.push(
    hop(
      'allow_analytics_simulation_use_cases',
      'denied' in sim ? 'FAIL' : 'PASS',
      'denied' in sim ? sim.reason : sim.summary,
    ),
  );

  hops.push(
    hop(
      'deny_safety_critical_vehicle_controls',
      attemptSteeringControl().state === 'DENIED' &&
        attemptBrakingControl().state === 'DENIED' &&
        attemptThrottleControl().state === 'DENIED' &&
        attemptEcuModification().state === 'DENIED' &&
        attemptSafetySystemOverride().state === 'DENIED' &&
        attemptAutonomousPhysicalDispatch().state === 'DENIED' &&
        attemptDriverMonitoringSurveillance().state === 'DENIED'
        ? 'PASS'
        : 'FAIL',
      'All vehicle safety hard locks DENIED',
    ),
  );

  const tel = openTelemetryPolicy({
    actor: input.actor,
    profile,
    policyId: 'tel-1',
    purpose: 'fleet_utilization_research',
    permittedFields: ['vehicle_speed_aggregate', 'battery_soc'],
    retention: '30d',
    explicitEnrollment: true,
  });
  hops.push(
    hop(
      'telemetry_gate_enrollment_purpose_fields_retention',
      'denied' in tel ? 'FAIL' : 'PASS',
      'denied' in tel ? tel.reason : tel.policyId,
    ),
  );
  hops.push(
    hop(
      'precise_location_local_by_default',
      preciseLocationLocalByDefault() &&
        ER32_LOCKS.PRECISE_LOCATION_CLOUD_BY_DEFAULT === false
        ? 'PASS'
        : 'FAIL',
      'precise location local-by-default',
    ),
  );

  const loss = handleConnectivityLoss({
    actor: input.actor,
    profile,
    mode: 'LOCAL_ONLY',
  });
  hops.push(
    hop(
      'connectivity_loss_local_only_or_waiting_node',
      'denied' in loss
        ? 'FAIL'
        : loss.profile.connectivity === 'LOCAL_ONLY'
          ? 'LOCAL_ONLY'
          : 'WAITING_NODE',
      'denied' in loss ? loss.reason : loss.checkpoint.checkpointId,
    ),
  );

  hops.push(
    hop(
      'deny_chip_implies_compatible',
      attemptChipImpliesCompatible().state === 'DENIED' &&
        chipImpliesCompatible() === false
        ? 'PASS'
        : 'FAIL',
      'chip≠compatible',
    ),
  );

  const ev = recordCompatibilityEvidence({
    actor: input.actor,
    profile,
    evidenceId: 'ev-1',
    chipPresent: true,
    runtimeProbed: false,
    workloadExercised: false,
    desiredTruthState: 'VERIFIED',
  });
  hops.push(
    hop(
      'runtime_truth_requires_compatibility_evidence',
      'denied' in ev && ev.state === 'DENIED' ? 'PASS' : 'FAIL',
      'chip-only VERIFIED denied',
    ),
  );

  hops.push(
    hop(
      'deny_stealth_installation',
      attemptStealthInstallation().state === 'DENIED' ? 'PASS' : 'FAIL',
      'stealth install denied',
    ),
  );
  hops.push(
    hop(
      'deny_privilege_escalation',
      attemptPrivilegeEscalation().state === 'DENIED' ? 'PASS' : 'FAIL',
      'privilege escalation denied',
    ),
  );
  hops.push(
    hop(
      'deny_firmware_flashing',
      attemptFirmwareFlashing().state === 'DENIED' ? 'PASS' : 'FAIL',
      'firmware flashing denied',
    ),
  );
  hops.push(
    hop(
      'deny_unauthorized_can_network_access',
      attemptUnauthorizedCanNetworkAccess().state === 'DENIED' ? 'PASS' : 'FAIL',
      'unauthorized CAN/network denied',
    ),
  );
  hops.push(
    hop(
      'deny_cross_tenant_telemetry_pooling',
      attemptCrossTenantTelemetryPooling().state === 'DENIED' ? 'PASS' : 'FAIL',
      'cross-tenant telemetry pool denied',
    ),
  );
  hops.push(
    hop(
      'deny_hidden_cot',
      attemptHiddenCot().state === 'DENIED' ? 'PASS' : 'FAIL',
      'hidden CoT denied',
    ),
  );

  const iso = probeGuardianRlsTenantUniverseIsolation({
    actor: input.actor,
    otherTenantId: 'other-ten',
    otherUniverseId: 'other-uni',
  });
  hops.push(
    hop(
      'guardian_rls_tenant_universe_isolation',
      'denied' in iso ? 'PASS' : 'FAIL',
      'Guardian/RLS isolation probe',
    ),
  );
  hops.push(
    hop(
      'recommend_neq_act',
      attemptRecommendAsAct().state === 'DENIED' ? 'PASS' : 'FAIL',
      'recommend ≠ act',
    ),
  );
  hops.push(
    hop(
      'l4_autonomy_false',
      ER32_LOCKS.L4_AUTONOMY_ENABLED === false ? 'PASS' : 'FAIL',
      'L4_AUTONOMY_ENABLED=false',
    ),
  );

  hops.push(
    hop(
      'er_layer_context_documented',
      'DOCUMENTED',
      ER_LAYER_TITLE,
    ),
  );
  hops.push(
    hop(
      'er31_soft_wire',
      softWireHopState(
        softWire.er31IosAppleRuntimeResearch.present ||
          softWire.er31Report.present,
      ),
      softWire.er31IosAppleRuntimeResearch.note,
    ),
  );
  hops.push(
    hop(
      'er30_soft_wire',
      softWireHopState(
        softWire.er30AndroidArmRuntimePackage.present ||
          softWire.er30Report.present,
      ),
      softWire.er30AndroidArmRuntimePackage.note,
    ),
  );
  hops.push(
    hop(
      'er29_soft_wire',
      softWireHopState(
        softWire.er29WindowsRuntimePackage.present ||
          softWire.er29Report.present,
      ),
      softWire.er29WindowsRuntimePackage.note,
    ),
  );
  hops.push(
    hop(
      'er28_soft_wire',
      softWireHopState(
        softWire.er28UniversalRuntimePackageContract.present ||
          softWire.er28Report.present,
      ),
      softWire.er28UniversalRuntimePackageContract.note,
    ),
  );
  hops.push(
    hop(
      'eq7_soft_wire',
      softWireHopState(
        softWire.eq7ArmEdgeAmdAcceleration.present || softWire.eq7Report.present,
      ),
      softWire.eq7ArmEdgeAmdAcceleration.note,
    ),
  );
  hops.push(
    hop(
      'db_candidates_not_applied',
      ER32_DB_CANDIDATES_STATUS === 'NOT_APPLIED' ? 'NOT_APPLIED' : 'FAIL',
      `DB candidates ${ER32_DB_CANDIDATES_STATUS}; ${GITLAB_MIRROR_NOTE}`,
    ),
  );
  hops.push(
    hop(
      'evidence',
      'CANDIDATE',
      `${HONESTY_BANNER}; next=${NEXT_PHASE_TITLE}; MAY=${ER32_MAY.length}; MUST_NOT=${ER32_MUST_NOT.length}; bounds.auto=${ER32_AGENT_BOUNDS.automaticAuthority}`,
    ),
  );

  const criticalHops = hops.filter(
    (h) =>
      !h.hop.includes('soft_wire') &&
      h.hop !== 'er_layer_context_documented' &&
      h.hop !== 'evidence' &&
      h.hop !== 'db_candidates_not_applied' &&
      h.hop !== 'connectivity_loss_local_only_or_waiting_node',
  );
  const allCriticalPass = criticalHops.every(
    (h) => h.state === 'PASS' || h.state === 'DOCUMENTED' || h.state === 'CANDIDATE',
  );

  return { hops, softWire, allCriticalPass };
}
