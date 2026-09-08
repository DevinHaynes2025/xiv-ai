/**
 * Phase 2I-X AI OS Foundation V2 — agent data, offline, federation, routing+sync, security roots V4.
 * Deterministic. No network. Does not weaken 2I-W. Does not implement 2I-U mature communities.
 * More connectivity ≠ more authority. L4 disabled. Providers stay NOT_CONFIGURED unless proven.
 */
import assert from 'node:assert/strict';

import { boundedAutonomyEnabled } from './authority';
import { xivReplacesHostOperatingSystem } from './ecosystem';
import { companiesHouseSourceState } from './international';
import { gleifAdapterCapabilityStatus, recordGleifValidatedRetrieval, resetGleifAdapterStatusForTests } from './international/status';
import { gleifRemainsIdentityOnly } from './market';
import { globalDataFabricProductionLive } from './network-os';
import { EXPERIENCE_AGENTS } from './network-os/experience';
import { admitMatureContentIntoNeuralFabric, matureBoundaryIsProduction, openMatureCommunityBoundary } from './neural';
import {
  adapterState,
  agentGathersUnauthorizedSource,
  agentInventsMissingBusinessData,
  agentReceivesRawDbCredential,
  agentReceivesSupabaseServiceRoleKey,
  allUnprovenConnectorsRemainNotConfigured,
  auditRootCanBeDisabled,
  bindSecurityRootsV4,
  cachePocketBrainV2,
  cloudOnlyNeverCached,
  connectorFabricGrantsAuthority,
  connectorMarkedLiveWithoutProof,
  connectorState,
  connectivityIsAuthority,
  dataAccessPath,
  databaseRouterReturnsCredentials,
  deviceCannotImpersonateIdentity,
  enqueueSync,
  eventRouterGrantsAuthority,
  fabricMarksProviderLiveWithoutProof,
  gatherAuthorizedData,
  ingestionBypassesClassification,
  knowledgeRouteCreatesAuthority,
  listFabricAdapters,
  listSecurityRootsV4,
  mongoAdapterState,
  mongoDocumentBypassesClassification,
  mongoMarkedLiveWithoutProof,
  moreConnectivityMeansMoreAuthority,
  offlineAgentAccessUncachedPrivate,
  offlineAgentBypassesServerAuthority,
  offlineEscalatesPrivilege,
  openAgentOrchestratorV4,
  openConnectorFabric,
  openDatabaseFabricV2,
  openMongoAdapter,
  openOfflineAgent,
  openPocketBrainV2,
  openSupabaseFabric,
  openSyncEngine,
  orchestratorBypassesGuardian,
  orchestratorConsensusCreatesVerifiedEvidence,
  pocketPrivateEntersGlobalAutomatically,
  pocketStoresRawSecrets,
  privateKnowledgeAutoEntersGlobal,
  reconnectRequiresServerAuthorization,
  resetConnectorProofForTests,
  resetSupabaseProofForTests,
  resolveSyncConflict,
  routeAgentDataAccess,
  routeDatabaseByPurpose,
  routeKnowledge,
  routeOsEvent,
  runIngestionPipeline,
  skipGuardianInDataPath,
  supabaseCapabilityState,
  supabaseIsLiveWithoutProof,
  syncEngineIsProductionLive,
  syncGrantsAuthority,
  temporaryTaskNodeReceivesPermanentAuthority,
  unauthorizedSourceBecomesStoreFact,
  unknownSecurityRootIsTrusted,
} from './osfund';
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

test('database fabric v2 adapters are present and not live', () => {
  const fabric = openDatabaseFabricV2();
  assert.equal(fabric.productionLive, false);
  assert.equal(fabric.authorityFromConnectivity, false);
  assert.equal(listFabricAdapters().length, 12);
  assert.equal(adapterState('MONGODB'), 'NOT_CONFIGURED');
  assert.equal(adapterState('SUPABASE_POSTGRES'), 'NOT_CONFIGURED');
  assert.equal(fabricMarksProviderLiveWithoutProof('POSTGRES'), false);
});

test('more connectivity does not mean more authority', () => {
  assert.equal(moreConnectivityMeansMoreAuthority(), false);
  assert.equal(connectivityIsAuthority(), false);
  assert.equal(connectorFabricGrantsAuthority(), false);
  assert.equal(eventRouterGrantsAuthority(), false);
  assert.equal(syncGrantsAuthority(), false);
  assert.equal(knowledgeRouteCreatesAuthority(), false);
});

test('data access path is Agent→Guardian→…→Audit and credentials never returned', () => {
  assert.deepEqual(dataAccessPath(), [
    'Agent',
    'Guardian',
    'Policy',
    'Classification',
    'Purpose',
    'Adapter',
    'Audit',
  ]);
  assert.equal(agentReceivesRawDbCredential(), false);
  assert.equal(skipGuardianInDataPath(), false);
  const deniedCred = routeAgentDataAccess({
    agentId: 'a1',
    guardianApproved: true,
    purpose: 'ops',
    classification: 'TENANT_PRIVATE',
    provider: 'POSTGRES',
    rawCredentialRequested: true,
  });
  assert.equal(deniedCred.allowed, false);
  const deniedGuardian = routeAgentDataAccess({
    agentId: 'a1',
    guardianApproved: false,
    purpose: 'ops',
    classification: 'TENANT_PRIVATE',
    provider: 'POSTGRES',
  });
  assert.equal(deniedGuardian.allowed, false);
  const ok = routeAgentDataAccess({
    agentId: 'a1',
    guardianApproved: true,
    purpose: 'ops',
    classification: 'TENANT_PRIVATE',
    provider: 'POSTGRES',
  });
  assert.equal(ok.allowed, true);
  if (ok.allowed) assert.equal(ok.credentialsReturned, false);
});

test('supabase contracts exist but are not LIVE without proof', () => {
  resetSupabaseProofForTests();
  const fabric = openSupabaseFabric();
  assert.equal(fabric.productionLive, false);
  assert.equal(fabric.agentReceivesServiceRoleKey, false);
  assert.equal(supabaseIsLiveWithoutProof(), false);
  assert.equal(agentReceivesSupabaseServiceRoleKey(), false);
  assert.equal(supabaseCapabilityState('Auth'), 'NOT_CONFIGURED');
  assert.equal(supabaseCapabilityState('Postgres'), 'NOT_CONFIGURED');
  assert.equal(supabaseCapabilityState('RLS'), 'NOT_CONFIGURED');
});

test('mongodb adapter remains NOT_CONFIGURED', () => {
  const mongo = openMongoAdapter();
  assert.equal(mongo.state, 'NOT_CONFIGURED');
  assert.equal(mongoAdapterState(), 'NOT_CONFIGURED');
  assert.equal(mongoMarkedLiveWithoutProof(), false);
  assert.equal(mongoDocumentBypassesClassification(), false);
  assert.equal(mongo.returnsRawCredentials, false);
});

test('ingestion requires authorized source and provenance', () => {
  assert.equal(unauthorizedSourceBecomesStoreFact(), false);
  assert.equal(ingestionBypassesClassification(), false);
  const denied = runIngestionPipeline({
    sourceAuthorized: false,
    provenancePresent: true,
    classification: 'PUBLIC',
    license: 'open',
    rights: 'reuse',
  });
  assert.equal(denied.allowed, false);
  const ok = runIngestionPipeline({
    sourceAuthorized: true,
    provenancePresent: true,
    classification: 'PUBLIC',
    license: 'open',
    rights: 'reuse',
  });
  assert.equal(ok.allowed, true);
});

test('agent data gathering is authorized-sources-only', () => {
  assert.equal(agentGathersUnauthorizedSource(), false);
  assert.equal(agentInventsMissingBusinessData(), false);
  const denied = gatherAuthorizedData({
    sourceAuthorized: false,
    guardianApproved: true,
    purpose: 'research',
    classification: 'PUBLIC',
  });
  assert.equal(denied.allowed, false);
  const inventDenied = gatherAuthorizedData({
    sourceAuthorized: true,
    guardianApproved: true,
    purpose: 'research',
    classification: 'PUBLIC',
    inventsMissingData: true,
  });
  assert.equal(inventDenied.allowed, false);
});

test('offline agents cannot access uncached private or bypass server authority', () => {
  const session = openOfflineAgent('OFFLINE');
  assert.equal(session.canAccessUncachedPrivate, false);
  assert.equal(session.canBypassServerAuthority, false);
  assert.equal(session.canCacheCredentials, false);
  assert.equal(offlineAgentAccessUncachedPrivate({ cached: false, classification: 'TENANT_PRIVATE' }), false);
  assert.equal(offlineAgentAccessUncachedPrivate({ cached: false, classification: 'CLOUD_ONLY' }), false);
  assert.equal(offlineAgentBypassesServerAuthority(), false);
  assert.equal(offlineEscalatesPrivilege(), false);
  assert.equal(reconnectRequiresServerAuthorization(), true);
});

test('Pocket Brain V2 never caches CLOUD_ONLY and never auto-promotes private to global', () => {
  const pocket = openPocketBrainV2();
  assert.equal(pocket.cloudOnlyCached, false);
  assert.equal(pocket.copyOfGlobalBrain, false);
  assert.equal(cloudOnlyNeverCached(), true);
  const denied = cachePocketBrainV2({ recordId: 'r1', classification: 'CLOUD_ONLY' });
  assert.equal('allowed' in denied && denied.allowed === false, true);
  const cached = cachePocketBrainV2({ recordId: 'r2', classification: 'ALLOWED_OFFLINE' });
  assert.equal('allowed' in cached, false);
  if (!('allowed' in cached)) {
    assert.equal(cached.mayEnterGlobalBrain, false);
    assert.equal(cached.secretsStored, false);
  }
  assert.equal(pocketPrivateEntersGlobalAutomatically(), false);
  assert.equal(pocketStoresRawSecrets(), false);
});

test('sync engine is not production live and cannot escalate privilege', () => {
  const engine = openSyncEngine();
  assert.equal(engine.productionLive, false);
  assert.equal(syncEngineIsProductionLive(), false);
  assert.equal(syncGrantsAuthority(), false);
  const secretDenied = enqueueSync({ tenantId: 't1', universeId: 'u1', containsSecret: true });
  assert.equal(secretDenied.allowed, false);
  const cloudDenied = enqueueSync({ tenantId: 't1', universeId: 'u1', cloudOnly: true });
  assert.equal(cloudDenied.allowed, false);
  const privilegeDenied = resolveSyncConflict({ localPrivilegeHigher: true, humanReviewed: true });
  assert.equal(privilegeDenied.allowed, false);
  const ok = enqueueSync({ tenantId: 't1', universeId: 'u1' });
  assert.equal(ok.allowed, true);
  if (ok.allowed) assert.equal(ok.serverAuthorizationRequired, true);
});

test('event router honors tenant and universe', () => {
  const crossTenant = routeOsEvent({
    event: { eventId: 'e1', tenantId: 't1', universeId: 'u1', classification: 'TENANT_PRIVATE' },
    consumerTenantId: 't2',
    consumerUniverseId: 'u1',
  });
  assert.equal(crossTenant.allowed, false);
  const crossUniverse = routeOsEvent({
    event: { eventId: 'e1', tenantId: 't1', universeId: 'u1', classification: 'TENANT_PRIVATE' },
    consumerTenantId: 't1',
    consumerUniverseId: 'u2',
  });
  assert.equal(crossUniverse.allowed, false);
});

test('database router selects by purpose and never returns credentials', () => {
  assert.equal(databaseRouterReturnsCredentials(), false);
  const denied = routeDatabaseByPurpose({
    purpose: 'semantic_retrieval',
    requestedProvider: 'MONGODB',
    guardianApproved: true,
  });
  assert.equal(denied.allowed, false);
  const ok = routeDatabaseByPurpose({
    purpose: 'semantic_retrieval',
    requestedProvider: 'VECTOR',
    guardianApproved: true,
  });
  assert.equal(ok.allowed, true);
  if (ok.allowed) assert.equal(ok.credentialsReturned, false);
});

test('Agent Orchestrator V4 task graph is guardian-first', () => {
  const denied = openAgentOrchestratorV4({ guardianAuthorized: false });
  assert.equal('allowed' in denied && denied.allowed === false, true);
  const graph = openAgentOrchestratorV4({ guardianAuthorized: true, roles: ['ops', 'finance'] });
  assert.equal('allowed' in graph, false);
  if (!('allowed' in graph)) {
    assert.equal(graph.version, 'V4');
    assert.equal(graph.guardianFirst, true);
    assert.equal(graph.consensusCreatesVerifiedEvidence, false);
    assert.equal(graph.nodes.length, 10);
  }
  assert.equal(orchestratorConsensusCreatesVerifiedEvidence(), false);
  assert.equal(temporaryTaskNodeReceivesPermanentAuthority(), false);
  assert.equal(orchestratorBypassesGuardian(), false);
});

test('knowledge routing blocks private→global auto promotion', () => {
  assert.equal(privateKnowledgeAutoEntersGlobal(), false);
  const denied = routeKnowledge({
    from: 'TENANT_PRIVATE',
    to: 'GLOBAL_PUBLIC',
    evidencePresent: true,
    humanOrPolicyVerified: true,
  });
  assert.equal(denied.allowed, false);
  const unverified = routeKnowledge({
    from: 'AUTHORIZED_SHARED',
    to: 'GLOBAL_PUBLIC',
    evidencePresent: false,
    humanOrPolicyVerified: false,
  });
  assert.equal(unverified.allowed, false);
});

test('Security Roots V4: connectivity is not authority; audit cannot be disabled', () => {
  assert.equal(listSecurityRootsV4().length >= 16, true);
  assert.equal(connectivityIsAuthority(), false);
  assert.equal(auditRootCanBeDisabled(), false);
  assert.equal(deviceCannotImpersonateIdentity(), true);
  assert.equal(unknownSecurityRootIsTrusted('ConnectivityRoot'), false);
  const deviceDenied = bindSecurityRootsV4({
    identityId: 'u1',
    deviceId: 'd1',
    tenantId: 't1',
    universeId: 'ops',
    dataId: 'obj1',
    purpose: 'ops',
    classification: 'TENANT_PRIVATE',
    deviceClaimsIdentity: true,
    approved: true,
  });
  assert.equal(deviceDenied.allowed, false);
  const connectivityDenied = bindSecurityRootsV4({
    identityId: 'u1',
    deviceId: 'd1',
    tenantId: 't1',
    universeId: 'ops',
    dataId: 'obj1',
    purpose: 'ops',
    classification: 'TENANT_PRIVATE',
    connectivityAlone: true,
    approved: true,
  });
  assert.equal(connectivityDenied.allowed, false);
  const ok = bindSecurityRootsV4({
    identityId: 'u1',
    deviceId: 'd1',
    tenantId: 't1',
    universeId: 'ops',
    dataId: 'obj1',
    purpose: 'ops',
    classification: 'TENANT_PRIVATE',
    approved: true,
  });
  assert.equal(ok.allowed, true);
  if (ok.allowed) assert.equal(ok.roots.connectivityGrantsAuthority, false);
});

test('connector fabric remains NOT_CONFIGURED unless proven', () => {
  resetConnectorProofForTests();
  const fabric = openConnectorFabric();
  assert.equal(fabric.productionLive, false);
  assert.equal(fabric.connectivityGrantsAuthority, false);
  assert.equal(connectorState('MONGODB'), 'NOT_CONFIGURED');
  assert.equal(connectorState('SUPABASE'), 'NOT_CONFIGURED');
  assert.equal(allUnprovenConnectorsRemainNotConfigured(), true);
  assert.equal(connectorMarkedLiveWithoutProof('MONGODB'), false);
});

test('experience agents unchanged and primary host OS not replaced', () => {
  assert.equal(EXPERIENCE_AGENTS.length, 11);
  assert.equal(xivReplacesHostOperatingSystem('IOS'), false);
  assert.equal(xivReplacesHostOperatingSystem('ANDROID'), false);
});

test('L4 remains disabled', () => {
  assert.equal(boundedAutonomyEnabled(), false);
});

test('GDF production-live=false', () => {
  assert.equal(globalDataFabricProductionLive(), false);
});

test('mature boundary not implemented (2I-U out of scope)', () => {
  assert.equal(matureBoundaryIsProduction(), false);
  assert.equal(admitMatureContentIntoNeuralFabric(), false);
  const boundary = openMatureCommunityBoundary();
  assert.equal(boundary.implemented, false);
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
