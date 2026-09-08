/**
 * Phase 2I-Y Autonomous Research, Night Shift & Intelligence Task Force Fabric.
 * Deterministic. No network. Does not weaken 2I-X. Does not implement 2I-U mature content.
 * L4 disabled. GDF production-live=false. Quantum/network NOT_CONFIGURED without proof.
 */
import assert from 'node:assert/strict';

import { boundedAutonomyEnabled } from './authority';
import { xivReplacesHostOperatingSystem } from './ecosystem';
import { globalDataFabricProductionLive } from './network-os';
import { EXPERIENCE_AGENTS } from './network-os/experience';
import { admitMatureContentIntoNeuralFabric, matureBoundaryIsProduction, openMatureCommunityBoundary } from './neural';
import {
  acquiresGovernmentClassifiedIntel,
  allocateVirtualNeuralAddress,
  applySandboxPatch,
  authorizeNetworkPath,
  claimLiteralTrillionAgents,
  claimsGovernmentClassifiedIntel,
  companyPrivateAutoEntersGlobalLibrary,
  composeFounderBriefV2,
  computeCreatesAuthority,
  conveneIntelligenceTaskForce,
  dataTaskForceBypassesDataAccessGateway,
  dataTaskForceBypassesGuardian,
  dataTaskForceDbAccess,
  dataTaskForceReceivesRawCredentials,
  evaluateOutreach,
  gmailLiveSendConfiguredWithoutProof,
  gmailLiveSendState,
  ingestIntelligenceRecord,
  intelligenceTaskForceDisablesGuardian,
  intelligenceTaskForceGrantsL4,
  intakePriorArt,
  listDataTaskForceRoles,
  mayAccessClassification,
  networkEqualsAuthorization,
  networkProviderState,
  neuralGraphCreatesAuthority,
  nightShiftV2ChangesSecurityPolicy,
  nightShiftV2DeploysProduction,
  nightShiftV2MayRecommend,
  nightShiftV2SelfGrantsAuthority,
  nightShiftV2SelfGrantsCredentials,
  nightShiftV2SilentProductionDeploy,
  openAdvancedComputeFabric,
  openClassificationPolicy,
  openDataTaskForceCatalog,
  openGmailChannelContract,
  openIntelligenceLibrary,
  openNetworkAbstractionFabric,
  openNeuralGraph,
  openNightShiftV2,
  openPatentFoundry,
  outreachBypassesConsent,
  patentFoundryClaimsPatentability,
  privateIntelligenceEqualsGlobal,
  quantumFutureConfiguredWithoutProof,
  quantumProviderState,
  resetGmailProofForTests,
  routeAdvancedCompute,
  routeNeuralGraphEdge,
  sendViaGmail,
  taskForceCollaborationSharesPermissions,
  taskForceTransfersPermissions,
  unauthorizedPatentDbIngestAllowed,
  yellowPagesSpamAllowed,
} from './nightshift';
import {
  LEAKED_PASSWORD_PROTECTION,
  LEAKED_PASSWORD_PROTECTION_EVIDENCE,
  reviewSecurityDefinerGrantPolicy,
} from './tenant/security-definer-review';

function test(name: string, run: () => void) {
  run();
  console.log(`ok - ${name}`);
}

test('intelligence task force: collaboration does not share or transfer permissions', () => {
  const force = conveneIntelligenceTaskForce({
    kind: 'MARKET_RESEARCH',
    tenantId: 't1',
    universeId: 'research',
    members: [
      { agentId: 'a1', role: 'researcher' },
      { agentId: 'a2', role: 'analyst' },
    ],
  });
  assert.equal(force.grantsPermissions, false);
  assert.equal(force.transfersPermissions, false);
  assert.equal(force.temporary, true);
  assert.equal(taskForceCollaborationSharesPermissions(force), false);
  const denied = taskForceTransfersPermissions(force, 'a1', 'a2');
  assert.equal(denied.allowed, false);
  assert.equal(intelligenceTaskForceDisablesGuardian(), false);
  assert.equal(intelligenceTaskForceGrantsL4(), false);
});

test('Night Shift V2 cannot deploy production or self-grant credentials/authority', () => {
  const job = openNightShiftV2('FOUNDER_BRIEF');
  assert.equal(nightShiftV2DeploysProduction(job), false);
  assert.equal(nightShiftV2SilentProductionDeploy(), false);
  assert.equal(nightShiftV2SelfGrantsCredentials(), false);
  assert.equal(nightShiftV2SelfGrantsAuthority(), false);
  assert.equal(nightShiftV2ChangesSecurityPolicy(), false);
  assert.equal(nightShiftV2MayRecommend(job), true);
  assert.equal(job.silentProductionDeploy, false);

  const sandboxJob = openNightShiftV2('SANDBOX_PATCH');
  const prodDenied = applySandboxPatch({ job: sandboxJob, humanApproved: true, targetsProduction: true });
  assert.equal(prodDenied.allowed, false);
  const unapproved = applySandboxPatch({ job: sandboxJob, humanApproved: false, targetsProduction: false });
  assert.equal(unapproved.allowed, false);
  const ok = applySandboxPatch({ job: sandboxJob, humanApproved: true, targetsProduction: false });
  assert.equal(ok.allowed, true);
  if (ok.allowed) assert.equal(ok.deployedToProduction, false);

  const brief = composeFounderBriefV2();
  assert.equal(brief.productionDeployed, false);
});

test('private intelligence is not global; no government classified acquisition', () => {
  const library = openIntelligenceLibrary();
  assert.equal(library.companyPrivateSeparated, true);
  assert.equal(library.acceptsGovernmentClassified, false);
  assert.equal(privateIntelligenceEqualsGlobal(), false);
  assert.equal(companyPrivateAutoEntersGlobalLibrary(), false);
  assert.equal(claimsGovernmentClassifiedIntel(), false);

  const privateLeak = ingestIntelligenceRecord({
    lane: 'GLOBAL_PUBLIC',
    license: 'company_private',
  });
  assert.equal(privateLeak.allowed, false);

  const classified = ingestIntelligenceRecord({
    lane: 'GLOBAL_PUBLIC',
    license: 'open',
    governmentClassified: true,
  });
  assert.equal(classified.allowed, false);

  const ok = ingestIntelligenceRecord({
    lane: 'GLOBAL_PUBLIC',
    license: 'licensed',
  });
  assert.equal(ok.allowed, true);
});

test('patent foundry never claims patentability; unauthorized DB ingest denied', () => {
  const foundry = openPatentFoundry();
  assert.equal(foundry.claimsPatentability, false);
  assert.equal(patentFoundryClaimsPatentability(), false);
  assert.equal(unauthorizedPatentDbIngestAllowed(), false);
  const claimDenied = intakePriorArt({
    sourceAuthorized: true,
    patentDbAuthorized: true,
    claimsPatentability: true,
  });
  assert.equal(claimDenied.allowed, false);
  const dbDenied = intakePriorArt({
    sourceAuthorized: true,
    patentDbAuthorized: false,
  });
  assert.equal(dbDenied.allowed, false);
});

test('outreach requires consent, suppression, jurisdiction; no Yellow Pages spam', () => {
  assert.equal(yellowPagesSpamAllowed(), false);
  assert.equal(outreachBypassesConsent(), false);
  assert.equal(
    evaluateOutreach({
      channel: 'EMAIL',
      recipientConsented: false,
      suppressed: false,
      jurisdictionAllowed: true,
      optedOut: false,
    }).allowed,
    false,
  );
  assert.equal(
    evaluateOutreach({
      channel: 'EMAIL',
      recipientConsented: true,
      suppressed: true,
      jurisdictionAllowed: true,
      optedOut: false,
    }).allowed,
    false,
  );
  assert.equal(
    evaluateOutreach({
      channel: 'EMAIL',
      recipientConsented: true,
      suppressed: false,
      jurisdictionAllowed: false,
      optedOut: false,
    }).allowed,
    false,
  );
  assert.equal(
    evaluateOutreach({
      channel: 'EMAIL',
      recipientConsented: true,
      suppressed: false,
      jurisdictionAllowed: true,
      optedOut: false,
      yellowPagesBulkScraped: true,
    }).allowed,
    false,
  );
  assert.equal(
    evaluateOutreach({
      channel: 'EMAIL',
      recipientConsented: true,
      suppressed: false,
      jurisdictionAllowed: true,
      optedOut: false,
    }).allowed,
    true,
  );
});

test('advanced compute: QUANTUM_FUTURE NOT_CONFIGURED without proof', () => {
  const fabric = openAdvancedComputeFabric();
  assert.equal(fabric.QuantumProvider, 'NOT_CONFIGURED');
  assert.equal(quantumProviderState(), 'NOT_CONFIGURED');
  assert.equal(quantumFutureConfiguredWithoutProof(), false);
  assert.equal(computeCreatesAuthority(), false);
  const denied = routeAdvancedCompute({
    backend: 'QUANTUM_FUTURE',
    guardianApproved: true,
    quantumProven: false,
  });
  assert.equal(denied.allowed, false);
  const cpu = routeAdvancedCompute({ backend: 'CPU', guardianApproved: true });
  assert.equal(cpu.allowed, true);
});

test('network abstraction: network ≠ authorization; provider NOT_CONFIGURED', () => {
  const fabric = openNetworkAbstractionFabric();
  assert.equal(fabric.networkIsAuthorization, false);
  assert.equal(networkEqualsAuthorization(), false);
  assert.equal(networkProviderState(), 'NOT_CONFIGURED');
  const denied = authorizeNetworkPath({
    connectivityPresent: true,
    guardianApproved: false,
    purpose: 'research',
    authorizedEndpoint: true,
  });
  assert.equal(denied.allowed, false);
  const unauthorized = authorizeNetworkPath({
    connectivityPresent: true,
    guardianApproved: true,
    purpose: 'research',
    authorizedEndpoint: false,
  });
  assert.equal(unauthorized.allowed, false);
});

test('classification ladder; no government classified acquisition', () => {
  const policy = openClassificationPolicy();
  assert.deepEqual(policy.ladder, ['PUBLIC', 'INTERNAL', 'CONFIDENTIAL', 'RESTRICTED', 'SECRET']);
  assert.equal(acquiresGovernmentClassifiedIntel(), false);
  assert.equal(
    mayAccessClassification({
      subjectClearance: 'INTERNAL',
      objectClassification: 'SECRET',
    }).allowed,
    false,
  );
  assert.equal(
    mayAccessClassification({
      subjectClearance: 'SECRET',
      objectClassification: 'INTERNAL',
      governmentClassifiedSource: true,
    }).allowed,
    false,
  );
});

test('neural graph / VNAS is abstraction — not literal trillions of agents', () => {
  const graph = openNeuralGraph();
  assert.equal(graph.literalTrillionAgents, false);
  assert.equal(claimLiteralTrillionAgents(), false);
  assert.equal(neuralGraphCreatesAuthority(), false);
  const addr = allocateVirtualNeuralAddress({ namespace: 'research', nodeId: 'n1' });
  assert.equal(addr.literalTrillionAgents, false);
  const denied = routeNeuralGraphEdge({
    from: addr,
    to: allocateVirtualNeuralAddress({ namespace: 'research', nodeId: 'n2' }),
    sameTenant: false,
    sameUniverse: true,
    guardianApproved: true,
  });
  assert.equal(denied.allowed, false);
});

test('Gmail channel contract only; live send NOT_CONFIGURED without proof', () => {
  resetGmailProofForTests();
  const channel = openGmailChannelContract();
  assert.equal(channel.authorizedChannelContract, true);
  assert.equal(channel.liveSend, 'NOT_CONFIGURED');
  assert.equal(gmailLiveSendState(), 'NOT_CONFIGURED');
  assert.equal(gmailLiveSendConfiguredWithoutProof(), false);
  assert.equal(sendViaGmail({ consentOk: true }).allowed, false);
  assert.equal(sendViaGmail({ consentOk: false, liveSendProven: true }).allowed, false);
});

test('Data Task Force roles are catalog; DB ops via Guardian→Data Access Gateway', () => {
  const catalog = openDataTaskForceCatalog();
  assert.equal(listDataTaskForceRoles().length, 8);
  assert.deepEqual(catalog.dbPath, [
    'Agent',
    'Guardian',
    'Policy',
    'Classification',
    'Purpose',
    'Adapter',
    'Audit',
  ]);
  assert.equal(dataTaskForceReceivesRawCredentials(), false);
  assert.equal(dataTaskForceBypassesGuardian(), false);
  assert.equal(dataTaskForceBypassesDataAccessGateway(), false);
  const denied = dataTaskForceDbAccess({
    role: 'DataSteward',
    guardianApproved: false,
    purpose: 'ops',
    classification: 'TENANT_PRIVATE',
  });
  assert.equal(denied.allowed, false);
  const credDenied = dataTaskForceDbAccess({
    role: 'DataSteward',
    guardianApproved: true,
    purpose: 'ops',
    classification: 'TENANT_PRIVATE',
    rawCredentialRequested: true,
  });
  assert.equal(credDenied.allowed, false);
});

test('LEAKED_PASSWORD_PROTECTION ENABLED with dashboard verified evidence', () => {
  assert.equal(LEAKED_PASSWORD_PROTECTION, 'ENABLED');
  assert.equal(LEAKED_PASSWORD_PROTECTION_EVIDENCE, 'Supabase dashboard verified');
  const review = reviewSecurityDefinerGrantPolicy();
  assert.equal(review.LEAKED_PASSWORD_PROTECTION, 'ENABLED');
  assert.equal(review.leakedPasswordProtectionEvidence, 'Supabase dashboard verified');
  assert.equal(review.leakedPasswordProtectionClaimedFixedInSql, false);
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

console.log('All phase 2I-Y cases passed.');
