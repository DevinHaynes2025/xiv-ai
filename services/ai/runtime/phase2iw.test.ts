/**
 * Phase 2I-W Experience + Neural Ecosystem Expansion.
 * Deterministic. No network. Does not weaken 2I-V. Does not mix 2I-U mature communities beyond boundary stubs.
 */
import assert from 'node:assert/strict';

import { boundedAutonomyEnabled } from './authority';
import { xivReplacesHostOperatingSystem } from './ecosystem';
import { companiesHouseSourceState } from './international';
import { gleifAdapterCapabilityStatus, recordGleifValidatedRetrieval, resetGleifAdapterStatusForTests } from './international/status';
import { gleifRemainsIdentityOnly } from './market';
import { globalDataFabricProductionLive } from './network-os';
import { EXPERIENCE_AGENTS } from './network-os/experience';
import {
  adaptExperienceLayout,
  adaptiveExperienceSelfApproves,
  admitMatureContentIntoNeuralFabric,
  agentReceivesRawDbCredential,
  aiConsensusCreatesVerifiedEvidence,
  applyFeedbackAsSecurityRewrite,
  availableIsAuthorized,
  contextSanitizerBypassAttempt,
  createPipeline,
  declareMind,
  deploymentReadiness,
  developerSandboxAccessesProduction,
  developerStoresRawDbCredential,
  enterpriseConnectorState,
  evaluateMatureBoundaryRequest,
  evaluateReleaseFlag,
  experienceAgentsLengthMustRemain,
  experienceChangesPrimaryNavCount,
  feedbackRewritesSecurityPolicy,
  instantiateSpecialty,
  matureBoundaryIsProduction,
  mindDisablesAudit,
  mindDisablesGuardian,
  mindExpandsOwnScope,
  mindSelfGrantsAuthority,
  nestPipeline,
  neuralBridgeGrantsExtraDataAccess,
  openBrainMap,
  openCognitiveSecurityGate,
  openCreateWorkspace,
  openExperienceFabric,
  openMatureCommunityBoundary,
  openNeuralFabric,
  openQuantumReadyGateway,
  openScaleBoard,
  openSitePreview,
  openSiteSandbox,
  productionDeploymentAllowed,
  promoteKnowledge,
  proposeAdaptiveRoute,
  publishSite,
  quarantineMind,
  requestNeuralConnection,
  routeCompute,
  routeThroughDataAccessGateway,
  runBusinessScenario,
  scaleClaimsCurrentCapacity,
  scaleTargetIsClaim,
  simulationCreatesAuthority,
  sitesAreProductionHosted,
  temporaryAgentReceivesPermanentAuthority,
  treatUnknownMindHealthAsHealthy,
  trillionsOfObjectsClaimed,
  untrustedSourceBecomesVerified,
} from './neural';
import { recordSecValidatedRetrieval, resetSecAdapterStatusForTests, secAdapterCapabilityStatus } from './sources/sec-status';
import {
  recordWorldBankValidatedRetrieval,
  resetWorldBankAdapterStatusForTests,
  worldBankAdapterCapabilityStatus,
} from './sources/world-bank-status';

function test(name: string, run: () => void) {
  run();
  console.log(`ok - ${name}`);
}

test('mind cannot self-grant authority', () => {
  const mind = declareMind({
    mindType: 'ExecutiveMind',
    tenantId: 'tenant-a',
    universeId: 'ops',
    purpose: 'command',
  });
  assert.equal(mindSelfGrantsAuthority(mind), false);
  assert.equal(mind.canSelfGrantAuthority, false);
  assert.equal(mind.grantsUnrestrictedAccess, false);
});

test('mind cannot expand own scope or disable guardian/audit', () => {
  const mind = declareMind({
    mindType: 'SecurityMind',
    tenantId: 'tenant-a',
    universeId: 'ops',
    purpose: 'security',
    knowledgeScope: ['security'],
  });
  const denied = mindExpandsOwnScope(mind, 'finance');
  assert.equal(denied.allowed, false);
  assert.equal(mindDisablesGuardian(), false);
  assert.equal(mindDisablesAudit(), false);
});

test('neural fabric does not create privilege', () => {
  const fabric = openNeuralFabric();
  assert.equal(fabric.productionLive, false);
  assert.equal(fabric.createsPrivilege, false);
  assert.equal(neuralBridgeGrantsExtraDataAccess(), false);
});

test('neural connection requires guardian, cognitive gate, and firewall', () => {
  const from = declareMind({ mindType: 'OperationsMind', tenantId: 't1', universeId: 'u1', purpose: 'ops' });
  const to = declareMind({ mindType: 'FinanceMind', tenantId: 't1', universeId: 'u1', purpose: 'finance' });
  const denied = requestNeuralConnection({
    from,
    to,
    guardianApproved: false,
    cognitiveGateCleared: true,
    firewallCleared: true,
    purpose: 'handoff',
    classification: 'TENANT_PRIVATE',
    sameTenant: true,
    sameUniverse: true,
  });
  assert.equal(denied.allowed, false);
  if (!denied.allowed) assert.equal(denied.reason, 'neural_route_requires_guardian');
});

test('cross-tenant and cross-universe neural routes denied', () => {
  const from = declareMind({ mindType: 'DataMind', tenantId: 't1', universeId: 'u1', purpose: 'data' });
  const to = declareMind({ mindType: 'DataMind', tenantId: 't2', universeId: 'u1', purpose: 'data' });
  const crossTenant = requestNeuralConnection({
    from,
    to,
    guardianApproved: true,
    cognitiveGateCleared: true,
    firewallCleared: true,
    purpose: 'share',
    classification: 'TENANT_PRIVATE',
    sameTenant: false,
    sameUniverse: true,
  });
  assert.equal(crossTenant.allowed, false);
  const crossUniverse = requestNeuralConnection({
    from,
    to: declareMind({ mindType: 'DataMind', tenantId: 't1', universeId: 'u2', purpose: 'data' }),
    guardianApproved: true,
    cognitiveGateCleared: true,
    firewallCleared: true,
    purpose: 'share',
    classification: 'TENANT_PRIVATE',
    sameTenant: true,
    sameUniverse: false,
  });
  assert.equal(crossUniverse.allowed, false);
});

test('AVAILABLE is not AUTHORIZED', () => {
  assert.equal(availableIsAuthorized('AVAILABLE'), false);
  assert.equal(availableIsAuthorized('AUTHORIZED'), true);
});

test('quarantined mind cannot route', () => {
  const from = declareMind({ mindType: 'RiskMind', tenantId: 't1', universeId: 'u1', purpose: 'risk' });
  const quarantined = { ...from, healthState: 'QUARANTINED' as const };
  const to = declareMind({ mindType: 'SecurityMind', tenantId: 't1', universeId: 'u1', purpose: 'security' });
  const denied = requestNeuralConnection({
    from: quarantined,
    to,
    guardianApproved: true,
    cognitiveGateCleared: true,
    firewallCleared: true,
    purpose: 'escalate',
    classification: 'TENANT_PRIVATE',
    sameTenant: true,
    sameUniverse: true,
  });
  assert.equal(denied.allowed, false);
  assert.equal(quarantineMind('HEALTHY'), 'QUARANTINED');
});

test('AI consensus does not create verified evidence', () => {
  assert.equal(aiConsensusCreatesVerifiedEvidence(), false);
});

test('simulation is not observed fact', () => {
  assert.equal(simulationCreatesAuthority(), false);
  const denied = runBusinessScenario({ kind: 'supplier_failure', label: 'OBSERVED' });
  assert.equal(denied.allowed, false);
  const sim = runBusinessScenario({ kind: 'demand_spike', label: 'SIMULATED' });
  assert.equal(sim.allowed, true);
  if (sim.allowed) assert.equal(sim.result.isFact, false);
  const promote = promoteKnowledge({
    state: 'SIMULATED',
    evidencePresent: true,
    humanOrPolicyVerified: true,
  });
  assert.equal(promote.allowed, false);
});

test('untrusted knowledge cannot become verified without evidence', () => {
  assert.equal(untrustedSourceBecomesVerified('UNVERIFIED'), false);
  const denied = promoteKnowledge({
    state: 'UNVERIFIED',
    evidencePresent: false,
    humanOrPolicyVerified: false,
  });
  assert.equal(denied.allowed, false);
});

test('adaptive route and experience cannot self-approve', () => {
  assert.equal(adaptiveExperienceSelfApproves(), false);
  const routeDenied = proposeAdaptiveRoute({
    observedUsefulness: true,
    sandboxed: true,
    securityReviewed: false,
    governanceApproved: true,
  });
  assert.equal(routeDenied.allowed, false);
  const experienceDenied = adaptExperienceLayout({
    surface: 'PHONE',
    observedUsefulness: true,
    sandboxed: false,
    securityReviewed: true,
    governanceApproved: true,
  });
  assert.equal(experienceDenied.allowed, false);
});

test('agent cannot receive raw DB credentials', () => {
  assert.equal(agentReceivesRawDbCredential(), false);
  assert.equal(developerStoresRawDbCredential(), false);
  const denied = routeThroughDataAccessGateway({
    guardianApproved: true,
    purpose: 'ops',
    classification: 'TENANT_PRIVATE',
    store: 'RELATIONAL',
  });
  assert.equal(denied.allowed, true);
  if (denied.allowed) assert.equal(denied.credentialsReturned, false);
});

test('nested pipeline cannot escape parent policy', () => {
  const denied = nestPipeline({ parentPolicyLocked: true, childAttemptsEscape: true });
  assert.equal(denied.allowed, false);
  const pipelineDenied = createPipeline({ domain: 'ops', guardianBound: false });
  assert.equal(pipelineDenied.allowed, false);
});

test('feedback cannot rewrite security policy', () => {
  assert.equal(feedbackRewritesSecurityPolicy(), false);
  const denied = applyFeedbackAsSecurityRewrite();
  assert.equal(denied.allowed, false);
});

test('quantum backend unavailable without evidence', () => {
  const gateway = openQuantumReadyGateway();
  assert.equal(gateway.QuantumProvider, 'NOT_CONFIGURED');
  assert.equal(gateway.QuantumExecution, 'NOT_PROVEN');
  const denied = routeCompute({ backend: 'QUANTUM_FUTURE', guardianApproved: true, quantumProven: false });
  assert.equal(denied.allowed, false);
});

test('cognitive security gate is not bypassable', () => {
  const gate = openCognitiveSecurityGate();
  assert.equal(gate.bypassable, false);
  assert.equal(contextSanitizerBypassAttempt().allowed, false);
});

test('unknown mind health is not treated as healthy', () => {
  assert.equal(treatUnknownMindHealthAsHealthy(), false);
});

test('temporary agents do not receive permanent authority', () => {
  assert.equal(temporaryAgentReceivesPermanentAuthority(), false);
  const agent = instantiateSpecialty('Security');
  assert.equal(agent.canDisableGuardian, false);
  assert.equal(agent.canMintProductionCredential, false);
});

test('create workspace and brain map do not grant production privilege', () => {
  const workspace = openCreateWorkspace({ tenantId: 't1', universeId: 'u1' });
  assert.equal(workspace.productionPublished, false);
  const brain = openBrainMap();
  assert.equal(brain.grantsAuthority, false);
  const experience = openExperienceFabric();
  assert.equal(experience.replacesHostOs, false);
  assert.equal(experienceChangesPrimaryNavCount(), false);
});

test('sites are preview/sandbox only', () => {
  assert.equal(sitesAreProductionHosted(), false);
  assert.equal(developerSandboxAccessesProduction(), false);
  const preview = openSitePreview({ tenantId: 't1', universeId: 'u1' });
  assert.equal(preview.sandboxOnly, true);
  const sandbox = openSiteSandbox({ tenantId: 't1' });
  assert.equal(sandbox.accessesProductionData, false);
  const publish = publishSite({
    humanApproved: true,
    securityReviewed: true,
    guardianApproved: true,
    selfPublish: false,
  });
  assert.equal(publish.allowed, false);
});

test('scale targets are not claims', () => {
  assert.equal(scaleClaimsCurrentCapacity(), false);
  assert.equal(trillionsOfObjectsClaimed(), false);
  assert.equal(scaleTargetIsClaim('media_objects'), false);
  const board = openScaleBoard();
  assert.equal(board.claimsCurrentCapacity, false);
});

test('deployment is not live', () => {
  assert.equal(productionDeploymentAllowed(), false);
  const readiness = deploymentReadiness();
  assert.equal(readiness.productionDeployed, false);
  assert.equal(readiness.appStorePublished, false);
  assert.equal(readiness.playStorePublished, false);
  assert.equal(readiness.publicHostingEnabled, false);
  const flag = evaluateReleaseFlag({ flag: 'security-bypass', highRiskSecurity: true });
  assert.equal(flag.allowed, false);
});

test('mature boundary is not production and admits no mature content', () => {
  assert.equal(matureBoundaryIsProduction(), false);
  assert.equal(admitMatureContentIntoNeuralFabric(), false);
  const boundary = openMatureCommunityBoundary();
  assert.equal(boundary.implemented, false);
  assert.equal(boundary.contentPresent, false);
  const denied = evaluateMatureBoundaryRequest({ requestMatureContent: true });
  assert.equal(denied.allowed, false);
});

test('enterprise connectors remain NOT_CONFIGURED', () => {
  assert.equal(enterpriseConnectorState('AWS'), 'NOT_CONFIGURED');
  assert.equal(enterpriseConnectorState('SAP'), 'NOT_CONFIGURED');
});

test('experience agents unchanged', () => {
  assert.equal(EXPERIENCE_AGENTS.length, 11);
  assert.equal(experienceAgentsLengthMustRemain(), 11);
});

test('XIV does not replace host OS', () => {
  assert.equal(xivReplacesHostOperatingSystem('IOS'), false);
  assert.equal(xivReplacesHostOperatingSystem('ANDROID'), false);
  assert.equal(xivReplacesHostOperatingSystem('WINDOWS'), false);
  assert.equal(xivReplacesHostOperatingSystem('MACOS'), false);
});

test('L4 remains disabled', () => {
  assert.equal(boundedAutonomyEnabled(), false);
});

test('GDF production-live=false', () => {
  assert.equal(globalDataFabricProductionLive(), false);
});

test('World Bank proven', () => {
  resetWorldBankAdapterStatusForTests();
  recordWorldBankValidatedRetrieval();
  assert.equal(worldBankAdapterCapabilityStatus(), 'LIVE');
  resetWorldBankAdapterStatusForTests();
});

test('SEC proven', () => {
  resetSecAdapterStatusForTests();
  recordSecValidatedRetrieval();
  assert.equal(secAdapterCapabilityStatus(), 'LIVE');
  resetSecAdapterStatusForTests();
});

test('GLEIF proven', () => {
  resetGleifAdapterStatusForTests();
  recordGleifValidatedRetrieval();
  assert.equal(gleifAdapterCapabilityStatus(), 'LIVE');
  assert.equal(gleifRemainsIdentityOnly(), true);
  resetGleifAdapterStatusForTests();
});

test('Companies House NOT_CONFIGURED', () => {
  assert.equal(companiesHouseSourceState(), 'NOT_CONFIGURED');
});
