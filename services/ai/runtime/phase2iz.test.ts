/**
 * Phase 2I-Z Continuous Intelligence OS Foundation.
 * Deterministic. No network. Does not weaken 2I-Y. Does not implement 2I-U mature content.
 * L4 disabled. GDF production-live=false. MongoDB NOT_CONFIGURED. Offline ≠ authorization.
 * Foresight ≠ certainty. Patent research ≠ filing authority. NVIDIA ≠ authority.
 * Extreme scale NOT PROVEN. No new LIVE provider claims without evidence.
 */
import assert from 'node:assert/strict';

import { boundedAutonomyEnabled } from './authority';
import {
  FOUNDER_TWIN_DISCLOSURE,
  advanceFoundryStage,
  advanceShiftStage,
  agentMayBypassGuardian,
  agentMayDisableGuardian,
  agentMayPromoteToL4,
  agentMaySelfGrantPermissions,
  agentMaySilentProductionDeploy,
  agentMayWeakenTenantIsolation,
  claimExtremeScaleProven,
  computeForesight,
  createAgentHandoff,
  createAgentIdentity,
  createAgentProposal,
  createAgentRun,
  createAgentTaskForce,
  dataFabricAdapterState,
  evaluateAgentAction,
  executeShiftTask,
  extremeScaleIsProven,
  fabricMarksProviderLiveWithoutProof,
  foresightEqualsCertainty,
  founderTwinDisclosure,
  founderTwinIsRealFounder,
  gatewayBypassesGuardian,
  listAgentSocietyRoles,
  listDataFabricAdapters,
  listFoundryPipeline,
  listGovernanceStack,
  listOfflineSyncStages,
  listOperationsShifts,
  listPlatformCapabilities,
  listSecurityExpansionControls,
  listShiftLifecycle,
  mongoDbIsLive,
  mongoDbLifecycle,
  moreCapabilityMeansMoreAuthority,
  nvidiaIsAuthorityLayer,
  offlineEqualsAuthorization,
  openAgentSociety,
  openCapabilityGateway,
  openContinuousDataFabric,
  openCrossPlatformFabric,
  openForesightEngine,
  openFounderIntelligence,
  openFounderTwinSurface,
  openOperationsShift,
  openPocketBrain,
  openProductFoundry,
  openScaleFabric,
  openSecurityExpansion,
  patentResearchIsFilingAuthority,
  privateIntelligenceAutoEntersGlobal,
  queueSignedLocalEvent,
  requestForbiddenAction,
  routeNvidiaAcceleration,
  routeThroughGovernanceStack,
  synchronizeOfflineQueue,
  trillionNodeScaleIsProven,
  xivReplacesHostOs,
} from './cios';
import { xivReplacesHostOperatingSystem } from './ecosystem';
import { globalDataFabricProductionLive } from './network-os';
import { EXPERIENCE_AGENTS } from './network-os/experience';
import { admitMatureContentIntoNeuralFabric, matureBoundaryIsProduction, openMatureCommunityBoundary } from './neural';

function test(name: string, run: () => void) {
  run();
  console.log(`ok - ${name}`);
}

test('data fabric: adapters NOT_CONFIGURED; MongoDB not LIVE; postgres authoritative', () => {
  const fabric = openContinuousDataFabric();
  assert.equal(fabric.postgresAuthoritative, true);
  assert.equal(fabric.supabaseAuthoritative, true);
  assert.equal(fabric.mongoLive, false);
  assert.equal(fabric.productionLive, false);
  assert.equal(mongoDbLifecycle(), 'NOT_CONFIGURED');
  assert.equal(mongoDbIsLive(), false);
  assert.equal(dataFabricAdapterState('MONGODB'), 'NOT_CONFIGURED');
  assert.equal(fabricMarksProviderLiveWithoutProof('MONGODB'), false);
  assert.equal(fabricMarksProviderLiveWithoutProof('VECTOR_DB'), false);
  const mongo = listDataFabricAdapters().find((a) => a.kind === 'MONGODB');
  assert.ok(mongo);
  assert.equal(mongo.state, 'NOT_CONFIGURED');
  assert.equal(mongo.productionLive, false);
});

test('governance stack: Guardian required; cannot bypass', () => {
  const gateway = openCapabilityGateway();
  assert.equal(gateway.stack.length, 9);
  assert.deepEqual(listGovernanceStack()[0], 'CAPABILITY_GATEWAY');
  assert.equal(gatewayBypassesGuardian(), false);
  const denied = routeThroughGovernanceStack({
    deviceTrusted: true,
    tenantValidated: true,
    guardianApproved: false,
    toolPermitted: true,
    dataAccessApproved: true,
    humanAuthorized: true,
    auditEnabled: true,
  });
  assert.equal(denied.allowed, false);
  const ok = routeThroughGovernanceStack({
    deviceTrusted: true,
    tenantValidated: true,
    guardianApproved: true,
    toolPermitted: true,
    dataAccessApproved: true,
    humanAuthorized: true,
    auditEnabled: true,
  });
  assert.equal(ok.allowed, true);
});

test('agents cannot self-grant / bypass Guardian / weaken tenant / silent deploy / promote L4', () => {
  assert.equal(agentMaySelfGrantPermissions(), false);
  assert.equal(agentMayDisableGuardian(), false);
  assert.equal(agentMayBypassGuardian(), false);
  assert.equal(agentMayWeakenTenantIsolation(), false);
  assert.equal(agentMaySilentProductionDeploy(), false);
  assert.equal(agentMayPromoteToL4(), false);
  assert.equal(requestForbiddenAction('SELF_GRANT_PERMISSIONS').allowed, false);
  assert.equal(requestForbiddenAction('DISABLE_GUARDIAN').allowed, false);
  assert.equal(requestForbiddenAction('SILENT_PRODUCTION_DEPLOY').allowed, false);
  assert.equal(requestForbiddenAction('PROMOTE_TO_L4').allowed, false);
  assert.equal(evaluateAgentAction('RESEARCH').allowed, true);
  assert.equal(evaluateAgentAction('SELF_GRANT_PERMISSIONS').allowed, false);
  assert.equal(moreCapabilityMeansMoreAuthority(), false);
});

test('agent collaboration objects: no permission transfer; L4 disabled on runs', () => {
  const a1 = createAgentIdentity({
    agentId: 'a1',
    societyRole: 'Research',
    tenantId: 't1',
    universeId: 'u1',
  });
  const a2 = createAgentIdentity({
    agentId: 'a2',
    societyRole: 'QA',
    tenantId: 't1',
    universeId: 'u1',
  });
  const force = createAgentTaskForce({ forceId: 'f1', tenantId: 't1', members: [a1, a2] });
  assert.equal(force.grantsPermissions, false);
  assert.equal(force.transfersPermissions, false);
  const handoff = createAgentHandoff({ handoffId: 'h1', fromAgentId: 'a1', toAgentId: 'a2' });
  assert.equal(handoff.transfersPermissions, false);
  const proposal = createAgentProposal({ proposalId: 'p1', agentId: 'a1' });
  assert.equal(proposal.executes, false);
  const run = createAgentRun({ runId: 'r1', agentId: 'a1', taskId: 'task1' });
  assert.equal(run.l4Enabled, false);
});

test('agent society + intelligence fabric lanes', () => {
  const society = openAgentSociety();
  assert.equal(listAgentSocietyRoles().length, 17);
  assert.equal(society.l4Enabled, false);
  assert.equal(society.selfGrantEnabled, false);
  assert.equal(privateIntelligenceAutoEntersGlobal(), false);
});

test('24/7 shifts: scheduled lifecycle, not uncontrolled autonomy', () => {
  assert.equal(listOperationsShifts().length, 6);
  assert.equal(listShiftLifecycle().length, 10);
  let shift = openOperationsShift({ kind: 'NIGHT', tenantId: 't1' });
  assert.equal(shift.uncontrolledAutonomy, false);
  assert.equal(shift.silentProductionDeploy, false);
  assert.equal(shift.stage, 'ASSIGN');
  for (const stage of [
    'PLAN',
    'AUTHORIZE',
    'EXECUTE_BOUNDED_TASKS',
  ] as const) {
    shift = advanceShiftStage(shift, stage);
  }
  assert.equal(shift.stage, 'EXECUTE_BOUNDED_TASKS');
  const prodDenied = executeShiftTask({
    shift,
    authorized: true,
    withinBoundaries: true,
    targetsProduction: true,
  });
  assert.equal(prodDenied.allowed, false);
  const ok = executeShiftTask({ shift, authorized: true, withinBoundaries: true });
  assert.equal(ok.allowed, true);
});

test('offline pocket brain: Offline ≠ authorization; reconnect requires server auth', () => {
  const pocket = openPocketBrain();
  assert.equal(pocket.offlineIsAuthorization, false);
  assert.equal(offlineEqualsAuthorization(), false);
  assert.equal(listOfflineSyncStages().includes('SERVER_AUTHORIZATION'), true);
  assert.equal(queueSignedLocalEvent({ eventId: 'e1', signed: false }).allowed, false);
  assert.equal(queueSignedLocalEvent({ eventId: 'e1', signed: true }).allowed, true);
  const denied = synchronizeOfflineQueue({
    authenticated: true,
    deviceValidated: true,
    tenantValidated: true,
    conflictResolved: true,
    serverAuthorized: false,
    auditEnabled: true,
  });
  assert.equal(denied.allowed, false);
  const ok = synchronizeOfflineQueue({
    authenticated: true,
    deviceValidated: true,
    tenantValidated: true,
    conflictResolved: true,
    serverAuthorized: true,
    auditEnabled: true,
  });
  assert.equal(ok.allowed, true);
});

test('Founder Twin disclosure exact; twin is not the real founder', () => {
  assert.equal(FOUNDER_TWIN_DISCLOSURE, 'XIV Founder Twin — AI representation of Devin Xavier Haynes');
  assert.equal(founderTwinDisclosure(), FOUNDER_TWIN_DISCLOSURE);
  assert.equal(founderTwinIsRealFounder(), false);
  const twin = openFounderTwinSurface();
  assert.equal(twin.disclosure, FOUNDER_TWIN_DISCLOSURE);
  assert.equal(twin.actualFounder, false);
  const profile = openFounderIntelligence();
  assert.equal(profile.biography.legalName, 'Devin Xavier Haynes');
  assert.equal(profile.twinDisclosure, FOUNDER_TWIN_DISCLOSURE);
  assert.equal(profile.twinIsRealFounder, false);
});

test('foresight ≠ certainty; formula requires uncertainty and contradictions', () => {
  const engine = openForesightEngine();
  assert.equal(engine.foresightEqualsCertainty, false);
  assert.equal(foresightEqualsCertainty(), false);
  assert.equal(
    computeForesight({
      historicalEvidenceAuthorized: true,
      currentEvidenceAuthorized: true,
      causalModelsPresent: true,
      scenarioModelsPresent: true,
      uncertaintyStated: true,
      confidenceRangeStated: true,
      contradictionsRetained: true,
      claimsCertainty: true,
    }).allowed,
    false,
  );
  const ok = computeForesight({
    historicalEvidenceAuthorized: true,
    currentEvidenceAuthorized: true,
    causalModelsPresent: true,
    scenarioModelsPresent: true,
    uncertaintyStated: true,
    confidenceRangeStated: true,
    contradictionsRetained: true,
  });
  assert.equal(ok.allowed, true);
  if (ok.allowed) assert.equal(ok.foresight.certaintyClaimed, false);
});

test('patent research ≠ filing authority; foundry requires human decision', () => {
  const foundry = openProductFoundry();
  assert.equal(foundry.patentResearchIsFilingAuthority, false);
  assert.equal(patentResearchIsFilingAuthority(), false);
  assert.equal(listFoundryPipeline().length, 12);
  assert.equal(
    advanceFoundryStage({
      stage: 'IP_PATENT_RESEARCH',
      humanDecisionRequired: false,
      claimsFilingAuthority: true,
    }).allowed,
    false,
  );
  assert.equal(
    advanceFoundryStage({
      stage: 'HUMAN_DECISION',
      humanDecisionRequired: false,
    }).allowed,
    false,
  );
  assert.equal(
    advanceFoundryStage({
      stage: 'SANDBOX_BUILD',
      humanDecisionRequired: false,
      sandboxOnly: true,
    }).allowed,
    true,
  );
});

test('cross-platform: XIV does not replace host OS; NVIDIA is accelerator not authority', () => {
  const fabric = openCrossPlatformFabric();
  assert.equal(fabric.replacesHostOperatingSystems, false);
  assert.equal(fabric.nvidiaIsAuthorityLayer, false);
  assert.equal(listPlatformCapabilities().includes('NVIDIA_ACCELERATION'), true);
  assert.equal(xivReplacesHostOs('ANDROID'), false);
  assert.equal(xivReplacesHostOs('IOS'), false);
  assert.equal(xivReplacesHostOs('WINDOWS'), false);
  assert.equal(xivReplacesHostOs('LINUX'), false);
  assert.equal(xivReplacesHostOs('WEB'), false);
  assert.equal(nvidiaIsAuthorityLayer(), false);
  assert.equal(
    routeNvidiaAcceleration({ guardianApproved: true, purpose: 'train', claimsAuthority: true }).allowed,
    false,
  );
  const ok = routeNvidiaAcceleration({ guardianApproved: true, purpose: 'infer' });
  assert.equal(ok.allowed, true);
  if (ok.allowed) {
    assert.equal(ok.authorityGranted, false);
    assert.equal(ok.state, 'NOT_CONFIGURED');
  }
});

test('extreme scale NOT PROVEN; engineering targets only', () => {
  const scale = openScaleFabric();
  assert.equal(scale.extremeScaleProven, false);
  assert.equal(scale.trillionNodeProven, false);
  assert.equal(extremeScaleIsProven(), false);
  assert.equal(trillionNodeScaleIsProven(), false);
  assert.equal(claimExtremeScaleProven(), false);
});

test('security expansion: more capability ≠ more authority', () => {
  const sec = openSecurityExpansion();
  assert.equal(listSecurityExpansionControls().length, 19);
  assert.equal(sec.moreCapabilityMeansMoreAuthority, false);
  assert.equal(sec.bypassable, false);
});

test('research provenance / QA-UAT society roles present', () => {
  const roles = listAgentSocietyRoles();
  assert.ok(roles.includes('Research'));
  assert.ok(roles.includes('QA'));
  assert.ok(roles.includes('UAT'));
  assert.ok(roles.includes('DataQuality'));
  assert.ok(roles.includes('PatentResearch'));
});

test('L4 remains disabled', () => {
  assert.equal(boundedAutonomyEnabled(), false);
});

test('GDF production-live=false', () => {
  assert.equal(globalDataFabricProductionLive(), false);
});

test('EXPERIENCE_AGENTS length stays 11; host OS not replaced', () => {
  assert.equal(EXPERIENCE_AGENTS.length, 11);
  assert.equal(xivReplacesHostOperatingSystem('IOS'), false);
  assert.equal(xivReplacesHostOperatingSystem('ANDROID'), false);
});

test('mature boundary not implemented (2I-U out of scope)', () => {
  assert.equal(matureBoundaryIsProduction(), false);
  assert.equal(admitMatureContentIntoNeuralFabric(), false);
  const boundary = openMatureCommunityBoundary();
  assert.equal(boundary.implemented, false);
});

console.log('All phase 2I-Z cases passed.');
