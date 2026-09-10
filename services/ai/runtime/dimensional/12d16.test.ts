/**
 * 12D-16 -- Community age-gate + rules stubs (LOCAL / SIMULATION).
 * ageGate18PlusRequired, waiverAck, antiPredatorDeny, nonSexualCulturalFraming;
 * portals/wormholes claim bans; productionAuto* false.
 */
import assert from 'node:assert/strict';
import {
  COMMUNITY_AGE_GATE_GUARDRAILS,
  COMMUNITY_AGE_GATE_SAFE_ENVIRONMENTS,
  COMMUNITY_AGE_GATE_SCHEMA_VERSION,
  HIGH_AUTONOMY_TARGETS,
  OFFLINE_PREFER_LOCAL,
  PHYSICAL_PORTAL_CAPABILITY,
  PHYSICAL_PORTALS_BANNED,
  VALUATION_THEATER_ALLOWED,
  UNIVERSES_ARE_SIMULATION_LAYERS_ONLY,
  activateCommunityStub,
  applyCommunityProductionAuto,
  attachCommunityWaiverAck,
  buildCommunityAgeGateSurface,
  claimPhysicalPortalViaCommunity,
  claimWormholeAsPhysicalPathway,
  createCommunityWaiverAck,
  defaultCommunityRulesStubs,
  disableAntiPredatorDeny,
  dumpCommunityAgeGateGuardrails,
  evaluateCommunityAgeGate,
  evidenceHashCommunityAgeGate,
  listCommunityRulesStubs,
  setSexualCulturalFraming,
} from './index';
import { BUILDER_GUARDRAILS as POLICY_BUILDER_GUARDRAILS } from '../builder/policy';
import { FOUNDER_TWIN_GUARDRAILS } from './founder-twin-roster';

// --- Locked community age-gate LOCAL contract ---
assert.equal(COMMUNITY_AGE_GATE_GUARDRAILS.readOnly, true);
assert.equal(COMMUNITY_AGE_GATE_GUARDRAILS.simulationOnly, true);
assert.equal(COMMUNITY_AGE_GATE_GUARDRAILS.OFFLINE_PREFER_LOCAL, true);
assert.equal(OFFLINE_PREFER_LOCAL, true);
assert.equal(COMMUNITY_AGE_GATE_GUARDRAILS.preferredExecution, 'LOCAL');
assert.deepEqual([...COMMUNITY_AGE_GATE_SAFE_ENVIRONMENTS], ['LOCAL']);
assert.deepEqual([...COMMUNITY_AGE_GATE_GUARDRAILS.executionAllowList], ['LOCAL']);
assert.equal(COMMUNITY_AGE_GATE_GUARDRAILS.cloudSandboxAllowed, false);
assert.equal(COMMUNITY_AGE_GATE_GUARDRAILS.productionAllowed, false);
assert.equal(COMMUNITY_AGE_GATE_GUARDRAILS.productionAutoApply, false);
assert.equal(COMMUNITY_AGE_GATE_GUARDRAILS.productionAutoMerge, false);
assert.equal(COMMUNITY_AGE_GATE_GUARDRAILS.productionAutoDeploy, false);
assert.equal(COMMUNITY_AGE_GATE_GUARDRAILS.autonomousProductionDDL, false);
assert.equal(COMMUNITY_AGE_GATE_GUARDRAILS.autonomousProductionDML, false);
assert.equal(COMMUNITY_AGE_GATE_GUARDRAILS.destructiveDbAutoApply, false);
assert.equal(COMMUNITY_AGE_GATE_GUARDRAILS.L4_PRODUCTION_ENABLED, false);
assert.equal(COMMUNITY_AGE_GATE_GUARDRAILS.liveCloudSyncClaimed, false);
assert.equal(COMMUNITY_AGE_GATE_GUARDRAILS.ageGate18PlusRequired, true);
assert.equal(COMMUNITY_AGE_GATE_GUARDRAILS.waiverAckRequired, true);
assert.equal(COMMUNITY_AGE_GATE_GUARDRAILS.antiPredatorDeny, true);
assert.equal(COMMUNITY_AGE_GATE_GUARDRAILS.nonSexualCulturalFraming, true);
assert.equal(COMMUNITY_AGE_GATE_GUARDRAILS.physicalPortalClaimAllowed, false);
assert.equal(COMMUNITY_AGE_GATE_GUARDRAILS.physicalPortalCapability, false);
assert.equal(COMMUNITY_AGE_GATE_GUARDRAILS.wormholesAreSparseSimulationPathwaysOnly, true);
assert.equal(COMMUNITY_AGE_GATE_GUARDRAILS.portalWormholeClaimBan, true);
assert.equal(COMMUNITY_AGE_GATE_GUARDRAILS.noDdl, true);
assert.equal(COMMUNITY_AGE_GATE_GUARDRAILS.noDml, true);
assert.equal(COMMUNITY_AGE_GATE_GUARDRAILS.noDeploy, true);
assert.equal(COMMUNITY_AGE_GATE_GUARDRAILS.mayEnterGlobalBrain, false);
assert.equal(COMMUNITY_AGE_GATE_GUARDRAILS.ticket, '12D-16');
assert.equal(COMMUNITY_AGE_GATE_GUARDRAILS.communityAgeGateWire, 'WIRED');
assert.equal(COMMUNITY_AGE_GATE_SCHEMA_VERSION, '12d16.1');
assert.equal(PHYSICAL_PORTAL_CAPABILITY, false);
assert.equal(PHYSICAL_PORTALS_BANNED, true);
assert.equal(FOUNDER_TWIN_GUARDRAILS.wormholesAreSparseSimulationPathwaysOnly, true);
assert.equal(VALUATION_THEATER_ALLOWED, false);
assert.equal(UNIVERSES_ARE_SIMULATION_LAYERS_ONLY, true);
assert.equal(POLICY_BUILDER_GUARDRAILS.autonomousProductionDDL, false);
assert.equal(POLICY_BUILDER_GUARDRAILS.autonomousProductionDML, false);
assert.deepEqual([...HIGH_AUTONOMY_TARGETS], ['LOCAL', 'CLOUD_SANDBOX']);

const dump = dumpCommunityAgeGateGuardrails();
assert.equal(dump.productionAutoApply, false);
assert.equal(dump.productionAutoMerge, false);
assert.equal(dump.productionAutoDeploy, false);
assert.equal(dump.L4_PRODUCTION_ENABLED, false);
assert.equal(dump.liveCloudSyncClaimed, false);
assert.equal(dump.ageGate18PlusRequired, true);
assert.equal(dump.waiverAckRequired, true);
assert.equal(dump.antiPredatorDeny, true);
assert.equal(dump.nonSexualCulturalFraming, true);
assert.equal(dump.physicalPortalClaimAllowed, false);
assert.equal(dump.portalWormholeClaimBan, true);
assert.equal(dump.simulationOnly, true);
assert.deepEqual(dump.safeEnvironments, ['LOCAL']);

assert.throws(() => claimPhysicalPortalViaCommunity(), /portal/i);
assert.throws(() => claimWormholeAsPhysicalPathway(), /wormhole|SIMULATION/i);
assert.throws(() => applyCommunityProductionAuto(), /productionAuto/);
assert.throws(() => disableAntiPredatorDeny(), /antiPredatorDeny/);
assert.throws(() => setSexualCulturalFraming(), /nonSexualCulturalFraming/);

// --- Surface: community rules stubs ---
let surface = buildCommunityAgeGateSurface({ seed: 'xiv-12d16-test' });
assert.equal(surface.simulationOnly, true);
assert.equal(surface.preferredExecution, 'LOCAL');
assert.equal(surface.OFFLINE_PREFER_LOCAL, true);
assert.equal(surface.liveCloudSyncClaimed, false);
assert.equal(surface.productionAutoApply, false);
assert.equal(surface.L4_PRODUCTION_ENABLED, false);
assert.equal(surface.ageGate18PlusRequired, true);
assert.equal(surface.antiPredatorDeny, true);
assert.equal(surface.nonSexualCulturalFraming, true);
assert.equal(surface.physicalPortalClaimAllowed, false);
assert.equal(surface.wormholesAreSparseSimulationPathwaysOnly, true);
assert.equal(surface.schemaVersion, '12d16.1');
assert.ok(surface.surfaceId.includes('community-age-gate'));
assert.equal(surface.waiverAck, null);

const stubs = listCommunityRulesStubs(surface);
assert.equal(stubs.length, 5);
assert.ok(stubs.every((s) => s.simulationOnly === true));
assert.ok(stubs.every((s) => s.productionEnforced === false));
assert.ok(stubs.every((s) => s.required === true));
assert.deepEqual(
  stubs.map((s) => s.ruleKey).sort(),
  [
    'age_gate_18_plus',
    'anti_predator_deny',
    'non_sexual_cultural_framing',
    'portals_wormholes_claim_ban',
    'waiver_ack',
  ].sort(),
);
assert.equal(defaultCommunityRulesStubs().length, 5);

// --- Age-gate evaluate + activate ---
const deniedAge = evaluateCommunityAgeGate({
  ageVerified18PlusStub: false,
  waiverAck: null,
});
assert.equal(deniedAge.allowed, false);
assert.equal(deniedAge.ageGate18PlusRequired, true);
assert.equal(deniedAge.antiPredatorDenyApplied, true);
assert.equal(deniedAge.nonSexualCulturalFraming, true);
assert.match(deniedAge.reason, /ageGate18PlusRequired|FAILED/i);

const deniedWaiver = evaluateCommunityAgeGate({
  ageVerified18PlusStub: true,
  waiverAck: null,
});
assert.equal(deniedWaiver.allowed, false);
assert.match(deniedWaiver.reason, /waiverAck/i);

assert.throws(
  () =>
    evaluateCommunityAgeGate({
      ageVerified18PlusStub: true,
      waiverAck: createCommunityWaiverAck(),
      attemptBypass: true,
    }),
  /bypass/i,
);

const waiver = createCommunityWaiverAck({ ackId: 'waiver:test' });
assert.equal(waiver.acknowledged, true);
assert.equal(waiver.simulationOnly, true);
assert.equal(waiver.productionBinding, false);
assert.ok(waiver.textHash.length >= 16);

surface = attachCommunityWaiverAck(surface, waiver);
assert.equal(surface.waiverAck?.ackId, 'waiver:test');

const allowed = evaluateCommunityAgeGate({
  ageVerified18PlusStub: true,
  waiverAck: surface.waiverAck,
});
assert.equal(allowed.allowed, true);
assert.equal(allowed.waiverAckPresented, true);
assert.equal(allowed.gateId, 'xiv-community-age-gate');

const activated = activateCommunityStub({
  surface,
  ageVerified18PlusStub: true,
});
assert.equal(activated.outcome, 'ACTIVATED_STUB');
assert.equal(activated.simulationOnly, true);
assert.equal(activated.liveCloudSyncClaimed, false);

const gateDenied = activateCommunityStub({
  surface: buildCommunityAgeGateSurface({ seed: 'xiv-12d16-no-waiver' }),
  ageVerified18PlusStub: true,
});
assert.equal(gateDenied.outcome, 'GATE_DENIED');

const ageDenied = activateCommunityStub({
  surface,
  ageVerified18PlusStub: false,
});
assert.equal(ageDenied.outcome, 'GATE_DENIED');

// Evidence hash
const tipSha = 'fcb82b618a4ecb018050838e210068ba57b05007';
const evidence = evidenceHashCommunityAgeGate({
  tipSha,
  surface,
  testsPassed: ['12d16.test.ts'],
});
assert.equal(typeof evidence, 'string');
assert.ok(evidence.length >= 16);

console.log('12d16.test.ts: OK');
console.log(
  JSON.stringify({
    tipShaPlaceholder: tipSha,
    surfaceId: surface.surfaceId,
    rules: stubs.map((s) => s.ruleKey),
    evidence,
    guardrailDumpKeys: Object.keys(dump).sort(),
  }),
);