/**
 * 62L-ER32 — Edge / Vehicle Runtime Candidate denial + honesty tests.
 *
 * Script: npm run test:62ler32
 */

import assert from 'node:assert/strict';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';

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
  GITHUB_SOT_FAMILY,
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
  mayControlSafetyCriticalVehicleSystems,
  preciseLocationLocalByDefault,
  type Er32Actor,
} from './edge-vehicle-runtime-candidate-types.ts';

import {
  attemptAutonomousPhysicalDispatch,
  attemptBrakingControl,
  attemptChipImpliesCompatible,
  attemptCrossTenantTelemetryPooling,
  attemptDriverMonitoringSurveillance,
  attemptEcuModification,
  attemptFirmwareFlashing,
  attemptHiddenCot,
  attemptPrivilegeEscalation,
  attemptRecommendAsAct,
  attemptSafetySystemOverride,
  attemptStealthInstallation,
  attemptSteeringControl,
  attemptThrottleControl,
  attemptUnauthorizedCanNetworkAccess,
  bootstrapEdgeVehicleRuntimeCandidate,
  enrollEdgeVehicleNode,
  exampleFleetEdgeNode,
  handleConnectivityLoss,
  openTelemetryPolicy,
  probeGuardianRlsTenantUniverseIsolation,
  recordCompatibilityEvidence,
  requireHumanApproval,
  returnReceiptToHomeBase,
  runEdgeVehicleRuntimeCandidateCycle,
  runSimulationAnalytics,
} from './edge-vehicle-runtime-candidate-runtime.ts';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '../../..');

const agent: Er32Actor = {
  kind: 'edge_vehicle_runtime',
  id: 'evr-1',
  orgId: 'org-er32',
  tenantId: 'ten-er32',
  universeId: 'uni-er32',
  permissions: ['draft'],
};

const human: Er32Actor = {
  kind: 'human_approver',
  id: 'human-1',
  orgId: 'org-er32',
  tenantId: 'ten-er32',
  universeId: 'uni-er32',
  permissions: ['approve_consequential'],
};

test('SoT label ER32 / #162; Edge/Vehicle Runtime Candidate; next ER33', () => {
  assert.equal(GITHUB_SOT_LABEL, '62L-ER32');
  assert.equal(GITHUB_SOT_ISSUE, 162);
  assert.equal(GITHUB_SOT_FAMILY, '62L-ER');
  assert.match(GITHUB_SOT_TITLE, /Edge \/ Vehicle Runtime Candidate/);
  assert.match(GITLAB_MIRROR_NOTE, /no issue number invented/i);
  assert.match(NEXT_PHASE_TITLE, /ER33/);
  assert.match(NEXT_PHASE_TITLE, /Runtime Update Channel/);
  assert.match(ER_LAYER_TITLE, /Universal Device Distribution/);
});

test('honesty locks: L4 false; safety hard locks; chip≠compatible; DB NOT_APPLIED', () => {
  assert.equal(assertEr32LocksIntact(), true);
  assert.equal(ER32_LOCKS.L4_AUTONOMY_ENABLED, false);
  assert.equal(ER32_DB_CANDIDATES_STATUS, 'NOT_APPLIED');
  assert.equal(ER32_LOCKS.STEERING_CONTROL, false);
  assert.equal(ER32_LOCKS.BRAKING_CONTROL, false);
  assert.equal(ER32_LOCKS.THROTTLE_CONTROL, false);
  assert.equal(ER32_LOCKS.ECU_MODIFICATION, false);
  assert.equal(ER32_LOCKS.SAFETY_SYSTEM_OVERRIDE, false);
  assert.equal(ER32_LOCKS.AUTONOMOUS_DISPATCH_INTO_PHYSICAL_OPERATION, false);
  assert.equal(ER32_LOCKS.DRIVER_MONITORING_SURVEILLANCE, false);
  assert.equal(ER32_LOCKS.CHIP_IMPLIES_COMPATIBLE, false);
  assert.equal(ER32_LOCKS.STEALTH_INSTALLATION, false);
  assert.equal(ER32_LOCKS.FIRMWARE_FLASHING, false);
  assert.equal(ER32_LOCKS.UNAUTHORIZED_CAN_NETWORK_ACCESS, false);
  assert.equal(ER32_LOCKS.CROSS_TENANT_TELEMETRY_POOLING, false);
  assert.equal(ER32_LOCKS.TIP_LAND, false);
  assert.match(HONESTY_BANNER, /DOCUMENTED/);
  assert.equal(chipImpliesCompatible(), false);
  assert.equal(mayControlSafetyCriticalVehicleSystems(), false);
  assert.equal(preciseLocationLocalByDefault(), true);
  assert.equal(ER32_AGENT_BOUNDS.automaticAuthority, false);
  assert.equal(ER32_AGENT_BOUNDS.mayControlSteering, false);
});

test('profile fields + architecture + MAY use cases + safety MUST NOT encoded', () => {
  assert.equal(EDGE_VEHICLE_PROFILE_FIELDS.length, 15);
  assert.ok(EDGE_VEHICLE_PROFILE_FIELDS.includes('nodeId'));
  assert.ok(EDGE_VEHICLE_PROFILE_FIELDS.includes('safetyClassification'));
  assert.ok(EDGE_VEHICLE_PROFILE_FIELDS.includes('revocationState'));
  assert.deepEqual([...EDGE_VEHICLE_CORE_ARCHITECTURE], [
    'edge_vehicle_device',
    'enrollment',
    'hardware_capability_probe',
    'runtime_compatibility',
    'local_model_agent_sandbox',
    'telemetry_data_policy_gate',
    'simulation_analytics',
    'return_receipt',
    'xiv_home_base',
  ]);
  assert.equal(EDGE_VEHICLE_MAY_USE_CASES.length, 10);
  assert.ok(EDGE_VEHICLE_MAY_USE_CASES.includes('fleet_logistics_analytics'));
  assert.ok(EDGE_VEHICLE_MAY_USE_CASES.includes('ev_adas_compute_benchmarking'));
  assert.deepEqual([...VEHICLE_SAFETY_MUST_NOT], [
    'steering',
    'braking',
    'throttle',
    'ecu_modification',
    'safety_system_override',
    'autonomous_dispatch_into_physical_operation',
    'driver_monitoring_surveillance',
  ]);
  assert.ok(VEHICLE_ANALYTICS_MAY.includes('route'));
  assert.ok(VEHICLE_ANALYTICS_MAY.includes('compute_placement'));
  assert.deepEqual([...TELEMETRY_PRIVACY_GATE], [
    'explicit_enrollment',
    'purpose',
    'permitted_fields',
    'retention',
    'deletion_revocation',
  ]);
  assert.deepEqual([...RUNTIME_TRUTH_STATES], [
    'DOCUMENTED',
    'DETECTED',
    'SUPPORTED',
    'VERIFIED',
    'NOT_TESTED',
  ]);
  assert.deepEqual([...HOME_BASE_EDGE_NODE_REQUIREMENTS], [
    'mission',
    'permissions',
    'resource_budget',
    'heartbeat',
    'return_path',
  ]);
  assert.ok(ER32_MAY.includes('require_compatibility_evidence_for_SUPPORTED_or_VERIFIED'));
  assert.ok(ER32_MUST_NOT.includes('control_steering_braking_throttle'));
  assert.ok(EDGE_VEHICLE_RUNTIME_CANDIDATE_CYCLE.includes('deny_chip_implies_compatible'));
});

test('enroll edge node; allow analytics/simulation; deny all safety-critical controls', () => {
  assert.equal(
    enrollEdgeVehicleNode({
      actor: agent,
      nodeId: 'bad',
      devicePlatformType: 'truck',
      ownerOperator: 'x',
      cpuGpuNpuAccelerator: 'chip',
      osRuntime: 'linux',
      mission: 'm',
      permissions: ['analytics'],
      resourceBudget: '1',
      explicitEnrollment: false,
    }).state,
    'DENIED',
  );

  const profile = exampleFleetEdgeNode(agent);
  assert.equal(profile.enrolled, true);
  assert.equal(profile.stealthInstall, false);
  assert.equal(profile.safetyClassification, 'NON_SAFETY_CRITICAL_ANALYTICS');

  const sim = runSimulationAnalytics({
    actor: agent,
    profile,
    useCase: 'route_and_charging_simulations',
    analysisKind: 'charging',
  });
  assert.ok(!('denied' in sim));
  assert.equal(sim.actuatedPhysicalControl, false);

  assert.equal(attemptSteeringControl().state, 'DENIED');
  assert.equal(attemptBrakingControl().state, 'DENIED');
  assert.equal(attemptThrottleControl().state, 'DENIED');
  assert.equal(attemptEcuModification().state, 'DENIED');
  assert.equal(attemptSafetySystemOverride().state, 'DENIED');
  assert.equal(attemptAutonomousPhysicalDispatch().state, 'DENIED');
  assert.equal(attemptDriverMonitoringSurveillance().state, 'DENIED');

  assert.equal(
    runSimulationAnalytics({
      actor: agent,
      profile,
      useCase: 'fleet_logistics_analytics',
      analysisKind: 'route',
      attemptSafetyControl: 'steering',
    }).state,
    'DENIED',
  );
});

test('telemetry gate + connectivity loss → LOCAL_ONLY / WAITING_NODE', () => {
  const profile = exampleFleetEdgeNode(agent);

  assert.equal(
    openTelemetryPolicy({
      actor: agent,
      profile,
      policyId: 't0',
      purpose: '',
      permittedFields: ['x'],
      retention: '7d',
      explicitEnrollment: true,
      attemptWithoutPurpose: true,
    }).state,
    'DENIED',
  );

  const policy = openTelemetryPolicy({
    actor: agent,
    profile,
    policyId: 't1',
    purpose: 'predictive_maintenance_research',
    permittedFields: ['battery_soc', 'temp_proxy'],
    retention: '14d',
    explicitEnrollment: true,
  });
  assert.ok(!('denied' in policy));
  assert.equal(policy.preciseLocationLocalByDefault, true);
  assert.equal(policy.explicitEnrollment, true);

  assert.equal(
    openTelemetryPolicy({
      actor: agent,
      profile,
      policyId: 't-bad',
      purpose: 'x',
      permittedFields: ['loc'],
      retention: '1d',
      explicitEnrollment: true,
      attemptPreciseLocationCloudDefault: true,
    }).state,
    'DENIED',
  );

  const local = handleConnectivityLoss({
    actor: agent,
    profile,
    mode: 'LOCAL_ONLY',
  });
  assert.ok(!('denied' in local));
  assert.equal(local.profile.connectivity, 'LOCAL_ONLY');
  assert.equal(local.checkpoint.connectivity, 'LOCAL_ONLY');

  const waiting = handleConnectivityLoss({
    actor: agent,
    profile,
    mode: 'WAITING_NODE',
  });
  assert.ok(!('denied' in waiting));
  assert.equal(waiting.profile.connectivity, 'WAITING_NODE');

  const receipt = returnReceiptToHomeBase({ actor: agent, profile });
  assert.ok(!('denied' in receipt));
  assert.equal(receipt.recommendationOnly, true);
  assert.equal(receipt.mission, profile.mission);
});

test('deny chip-implies-compatible; stealth/firmware/CAN/cross-tenant; Guardian', () => {
  const profile = exampleFleetEdgeNode(agent);

  assert.equal(attemptChipImpliesCompatible().state, 'DENIED');
  assert.equal(
    recordCompatibilityEvidence({
      actor: agent,
      profile,
      evidenceId: 'bad',
      chipPresent: true,
      runtimeProbed: false,
      workloadExercised: false,
      claimChipImpliesCompatible: true,
    }).state,
    'DENIED',
  );
  assert.equal(
    recordCompatibilityEvidence({
      actor: agent,
      profile,
      evidenceId: 'chip-only-verified',
      chipPresent: true,
      runtimeProbed: false,
      workloadExercised: false,
      desiredTruthState: 'VERIFIED',
    }).state,
    'DENIED',
  );

  const detected = recordCompatibilityEvidence({
    actor: agent,
    profile,
    evidenceId: 'det',
    chipPresent: true,
    runtimeProbed: false,
    workloadExercised: false,
  });
  assert.ok(!('denied' in detected));
  assert.equal(detected.truthState, 'DETECTED');
  assert.equal(detected.claimsChipImpliesCompatible, false);

  const supported = recordCompatibilityEvidence({
    actor: agent,
    profile,
    evidenceId: 'sup',
    chipPresent: true,
    runtimeProbed: true,
    workloadExercised: true,
  });
  assert.ok(!('denied' in supported));
  assert.equal(supported.truthState, 'SUPPORTED');

  assert.equal(attemptStealthInstallation().state, 'DENIED');
  assert.equal(attemptPrivilegeEscalation().state, 'DENIED');
  assert.equal(attemptFirmwareFlashing().state, 'DENIED');
  assert.equal(attemptUnauthorizedCanNetworkAccess().state, 'DENIED');
  assert.equal(attemptCrossTenantTelemetryPooling().state, 'DENIED');
  assert.equal(attemptHiddenCot().state, 'DENIED');
  assert.equal(attemptRecommendAsAct().state, 'DENIED');

  assert.equal(
    enrollEdgeVehicleNode({
      actor: agent,
      nodeId: 'stealth',
      devicePlatformType: 'ecu',
      ownerOperator: 'x',
      cpuGpuNpuAccelerator: 'x',
      osRuntime: 'x',
      mission: 'm',
      permissions: ['a'],
      resourceBudget: '1',
      explicitEnrollment: true,
      stealthInstall: true,
    }).state,
    'DENIED',
  );

  const iso = probeGuardianRlsTenantUniverseIsolation({
    actor: agent,
    otherTenantId: 'ten-other',
    otherUniverseId: 'uni-other',
  });
  assert.equal(iso.state, 'DENIED');

  assert.equal(
    requireHumanApproval({ actor: agent, action: 'consequential' }).state,
    'DENIED',
  );
  const ok = requireHumanApproval({ actor: human, action: 'consequential' });
  assert.ok(!('denied' in ok));
  assert.equal(ok.approved, true);
});

test('soft-wires ER31–ER28 WAITING_DATA when absent; EQ7 PRESENT; cycle green', () => {
  const snap = er32SoftWireSnapshot(repoRoot);
  assert.equal(snap.er31IosAppleRuntimeResearch.present, false);
  assert.equal(snap.er30AndroidArmRuntimePackage.present, false);
  assert.equal(snap.er29WindowsRuntimePackage.present, false);
  assert.equal(snap.er28UniversalRuntimePackageContract.present, false);
  assert.equal(snap.eq7ArmEdgeAmdAcceleration.present, true);

  const boot = bootstrapEdgeVehicleRuntimeCandidate({
    actor: agent,
    repoRoot,
  });
  assert.equal(boot.locksIntact, true);
  assert.equal(boot.profile.enrolled, true);
  assert.match(boot.honesty, /DOCUMENTED/);
  assert.match(boot.next, /ER33/);

  const cycle = runEdgeVehicleRuntimeCandidateCycle({
    actor: agent,
    repoRoot,
  });
  assert.equal(cycle.allCriticalPass, true);
  assert.ok(cycle.hops.length >= 20);

  const er31 = cycle.hops.find((h) => h.hop === 'er31_soft_wire');
  const er28 = cycle.hops.find((h) => h.hop === 'er28_soft_wire');
  const eq7 = cycle.hops.find((h) => h.hop === 'eq7_soft_wire');
  assert.equal(er31?.state, 'WAITING_DATA');
  assert.equal(er28?.state, 'WAITING_DATA');
  assert.equal(eq7?.state, 'PASS');

  const l4 = cycle.hops.find((h) => h.hop === 'l4_autonomy_false');
  assert.equal(l4?.state, 'PASS');
});
