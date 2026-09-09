/**
 * 2I-AI-62D queued runtime contracts.
 * Deterministic. No network. Asserts the story stays queued, the canary gate
 * stays shut, and the two open defects stay visible until they are fixed.
 */
import assert from 'node:assert/strict';

import {
  ACCEPTANCE_GATES,
  ACCEPTANCE_TARGETS,
  ATTESTATION_STATES,
  ATTESTATION_STATES_ELIGIBLE_FOR_PROTECTED_WORKLOAD,
  CANARY_CANDIDATE,
  CAPABILITY_FLAGS,
  COMPUTE_LINEAGE_FIELDS,
  DEPLOYMENT_STATE,
  EXISTING_COMPUTE_ROUTERS,
  IMPLEMENTATION_STARTED,
  INVARIANTS,
  KILL_SWITCH_CONTROLS,
  L4_AUTONOMY_ENABLED,
  NEXT_STORY_ENTRY_REQUIREMENT,
  RESOURCE_BUDGET_DIMENSIONS,
  ROUTING_PRIORITY,
  RUNTIME_SCHEMA_PLAN,
  SECTION,
  SECURITY_LOCK,
  SPACE_PROVIDER_STATE,
  STORY_ID,
  VENDOR_DETECTION,
  allCapabilityFlagsFalse,
  allGatesUnmeasured,
  canaryGateOpen,
  measuredGates,
  referenceTables,
  securityLockHolds,
  storyIsImplemented,
  tenantBearingTables,
  tenantBlindRouters,
  unprovenVendors,
} from './2i-ai-62d';

function check(name: string, fn: () => void): void {
  fn();
  console.log(`  ok  ${name}`);
}

console.log(`${STORY_ID} queued runtime contracts`);

check('story is queued and owned by the shared core section', () => {
  assert.equal(DEPLOYMENT_STATE, 'QUEUED');
  assert.equal(IMPLEMENTATION_STARTED, false);
  assert.equal(storyIsImplemented(), false);
  assert.equal(SECTION, 'GLOBAL_OPERATIONS_BRAIN');
});

check('§32 security lock holds', () => {
  assert.equal(L4_AUTONOMY_ENABLED, false);
  assert.equal(securityLockHolds(), true);
  assert.equal(SECURITY_LOCK.AUTO_SATELLITE_ACCESS, false);
  assert.equal(SECURITY_LOCK.AUTO_PRODUCTION_MUTATION, false);
  assert.equal(allCapabilityFlagsFalse(), true);
});

check('§31 satellite stays unconfigured', () => {
  assert.equal(SPACE_PROVIDER_STATE, 'UNCONFIGURED');
  assert.equal(INVARIANTS.unconfiguredMeansSupported, false);
});

check('eight compute routers already exist; §8 would be the ninth', () => {
  assert.equal(EXISTING_COMPUTE_ROUTERS.length, 8);
  assert.equal(new Set(EXISTING_COMPUTE_ROUTERS.map((r) => r.fn)).size, 8);
  assert.equal(new Set(EXISTING_COMPUTE_ROUTERS.map((r) => r.module)).size, 8);
});

check('defect 1: no existing router can enforce the §24 Universe boundary', () => {
  assert.equal(tenantBlindRouters().length, 8);
  assert.ok(tenantBlindRouters().includes('routeComputeWorkload'));
  assert.equal(INVARIANTS.sharedHostMeansSharedUniverse, false);
  // AC-03 and AC-05 cannot be measured while this holds.
  assert.equal(ACCEPTANCE_GATES.AC03_tenant_universe_isolation, null);
  assert.equal(ACCEPTANCE_GATES.AC05_compute_routing, null);
});

check('defect 2: only NVIDIA has a proven detector', () => {
  assert.equal(VENDOR_DETECTION.NVIDIA.proven, true);
  assert.equal(VENDOR_DETECTION.AMD.proven, false);
  assert.equal(VENDOR_DETECTION.AMD.detector, null);
  assert.deepEqual(unprovenVendors(), ['AMD', 'APPLE_SILICON', 'ARM', 'INTEL', 'NPU']);
  // AC-06's portability matrix cannot be expressed while this holds.
  assert.equal(ACCEPTANCE_GATES.AC06_hardware_portability, null);
});

check('§8 puts security ahead of cost', () => {
  assert.equal(ROUTING_PRIORITY[0], 'SECURITY');
  assert.equal(ROUTING_PRIORITY.at(-1), 'COST');
  assert.equal(INVARIANTS.moreComputeMeansMoreAuthority, false);
});

check('§16 only an attested node receives protected workloads', () => {
  assert.equal(ATTESTATION_STATES.length, 7);
  assert.equal(ATTESTATION_STATES[0], 'UNKNOWN');
  assert.deepEqual([...ATTESTATION_STATES_ELIGIBLE_FOR_PROTECTED_WORKLOAD], ['ATTESTED']);
  for (const excluded of ['UNKNOWN', 'REGISTERED', 'DEGRADED', 'QUARANTINED', 'REVOKED'] as const) {
    assert.ok(!ATTESTATION_STATES_ELIGIBLE_FOR_PROTECTED_WORKLOAD.includes(excluded as never));
  }
});

check('§25 kill switch covers all eight controls', () => {
  assert.equal(KILL_SWITCH_CONTROLS.length, 8);
  for (const c of ['REVOKE_NODE', 'STOP_MEETING', 'REVOKE_MODEL'] as const) {
    assert.ok(KILL_SWITCH_CONTROLS.includes(c));
  }
});

check('§17 / AC-08 budget bounds all twelve dimensions', () => {
  assert.equal(RESOURCE_BUDGET_DIMENSIONS.length, 12);
  for (const d of ['GPU', 'TOKENS', 'ENERGY', 'COST', 'DURATION'] as const) {
    assert.ok(RESOURCE_BUDGET_DIMENSIONS.includes(d));
  }
});

check('§23 / AC-15 lineage names both the runtime and the model', () => {
  assert.equal(COMPUTE_LINEAGE_FIELDS.length, 12);
  assert.ok(COMPUTE_LINEAGE_FIELDS.includes('RUNTIME'));
  assert.ok(COMPUTE_LINEAGE_FIELDS.includes('MODEL'));
  assert.ok(COMPUTE_LINEAGE_FIELDS.includes('UNIVERSE'));
});

check('§27 slice names all fourteen tables with a tenant split', () => {
  assert.equal(Object.keys(RUNTIME_SCHEMA_PLAN).length, 14);
  assert.equal(tenantBearingTables().length, 12);
  assert.deepEqual(referenceTables(), ['xiv_model_registry', 'xiv_runtime_capabilities']);
  // Which models exist is a platform fact; how one performed for a tenant is not.
  assert.equal(RUNTIME_SCHEMA_PLAN.xiv_model_registry.tenantBearing, false);
  assert.equal(RUNTIME_SCHEMA_PLAN.xiv_model_evaluations.tenantBearing, true);
  for (const [table, plan] of Object.entries(RUNTIME_SCHEMA_PLAN)) {
    assert.ok(plan.rationale.length > 0, `${table} needs a rationale`);
  }
});

check('every AC gate is unmeasured, and TBD is not PASS', () => {
  assert.equal(Object.keys(ACCEPTANCE_GATES).length, 24);
  assert.equal(allGatesUnmeasured(), true);
  assert.deepEqual(measuredGates(), []);
  assert.equal(INVARIANTS.tbdMeansPass, false);
  // null is unmeasured, distinct from a measured failure.
  assert.equal(ACCEPTANCE_GATES.AC01_runtime_identity, null);
  assert.notEqual(ACCEPTANCE_GATES.AC01_runtime_identity, false);
});

check('canary gate is shut', () => {
  assert.equal(canaryGateOpen(), false);
  assert.equal(CANARY_CANDIDATE, false);
});

check('acceptance targets are not softened', () => {
  assert.equal(ACCEPTANCE_TARGETS.routingDecisionSampleSize, 1000);
  assert.equal(ACCEPTANCE_TARGETS.routingPolicyCorrectMinPercent, 99.9);
  assert.equal(ACCEPTANCE_TARGETS.tenantInvalidRoutingMax, 0);
  assert.equal(ACCEPTANCE_TARGETS.securityInvalidRoutingMax, 0);
  assert.equal(ACCEPTANCE_TARGETS.duplicateConsequentialActionsMax, 0);
  assert.equal(ACCEPTANCE_TARGETS.killSwitchAckP95Seconds, 2);
  assert.equal(ACCEPTANCE_TARGETS.logicalAgentIdentities, 100_000);
  assert.equal(ACCEPTANCE_TARGETS.forcedFailureScenarios, 100);
});

check('62E entry requirement separates logical from active agents', () => {
  assert.equal(NEXT_STORY_ENTRY_REQUIREMENT.storyId, '2I-AI-62E');
  assert.equal(NEXT_STORY_ENTRY_REQUIREMENT.registeredLogicalAgents, 100_000);
  assert.ok(
    NEXT_STORY_ENTRY_REQUIREMENT.simultaneouslyActiveBoundedTasks <
      NEXT_STORY_ENTRY_REQUIREMENT.registeredLogicalAgents,
  );
  assert.equal(NEXT_STORY_ENTRY_REQUIREMENT.crossTenantSchedulingViolationsMax, 0);
  assert.equal(NEXT_STORY_ENTRY_REQUIREMENT.recursiveAgentCreationMax, 0);
});

check('promotion ladder never skips a rung', () => {
  assert.equal(INVARIANTS.documentedMeansImplemented, false);
  assert.equal(INVARIANTS.implementedMeansVerified, false);
  assert.equal(INVARIANTS.verifiedMeansProductionAuthorized, false);
});

check('trust is never implied by installation, proximity or disconnection', () => {
  assert.equal(INVARIANTS.installedSoftwareMeansTrustedDevice, false);
  assert.equal(INVARIANTS.physicalProximityMeansTrust, false);
  assert.equal(INVARIANTS.offlineMeansAdditionalAuthority, false);
  assert.equal(INVARIANTS.runtimeMayOverrideGuardian, false);
  assert.equal(INVARIANTS.agentMayGrantItselfInfrastructure, false);
});

console.log(`${STORY_ID}: all queued runtime contracts hold`);
