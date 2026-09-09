/**
 * Phase 2I-AB Global Connector Fabric + Online/Offline Agent Mesh + Supply Chain Intelligence Graph.
 * Deterministic. No network. Does not weaken 2I-AA/2I-Z.
 * Federated authorized connectors — NOT one gigantic world database.
 * L4 disabled. Offline ≠ authority. Unverified = NOT_CONFIGURED. STOPPED before new production credentials.
 */
import assert from 'node:assert/strict';

import { boundedAutonomyEnabled } from './authority';
import {
  agentMeshL4Enabled,
  auditSyncEvent,
  capabilityEqualsPrivilege as meshCapabilityEqualsPrivilege,
  createCheckpoint,
  createEventQueue,
  createHandoff,
  detectSyncConflict,
  evaluateOfflineAction,
  listAgentMeshReconnectStages,
  listAgentRuntimeModes,
  listOfflineForbiddenActions,
  offlineCreatesAuthority,
  openAgentRuntime,
  openCachePolicy,
  openCloudMemory,
  openLocalMemory,
  recoverFromCheckpoint,
  resetSyncIdempotencyLedger,
  resolveConflict,
  syncMayBypassGuardian,
  syncMayBypassServerAuth,
  syncMayIgnoreRevocation,
  syncMaySkipAudit,
  synchronizeAgentMesh,
  transitionAgentMode,
  validateCheckpointForRecovery,
} from './agentmesh';
import {
  applyPersonalization,
  bindCloudAccount,
  ciscoMayBypassNetworkControls,
  connectorFabricCopiesEveryDatabase,
  connectorMayGoLiveWithoutEvidence,
  connectorRequiredFieldKeys,
  connectorState,
  createComputeJob,
  createConnector,
  evaluateCiscoCapability,
  evaluateCloudAction,
  evaluateConnectorAccess,
  evaluateDeviceTrust,
  listCloudAuthPath,
  listConnectorHealthStates,
  listConnectorKinds,
  listDeviceTrustPath,
  listEnterprisePluginTargets,
  networkConnectorMayBypassControls,
  nvidiaIsAuthorizationLayer,
  openCloudFabric,
  openComputeFabric,
  openDeviceOsFabric,
  openEnterprisePlugins,
  openGlobalConnectorFabric,
  openPersonalizationEngine,
  personalizationWeakensTenantIsolation,
  pluginState,
  privateSupplierScrapingEnabled as connectorPrivateScrape,
  xivConnectsToAllWorldDatabases,
  xivReplacesHostOperatingSystem as fabricXivReplacesOs,
} from './connectorfabric';
import {
  advanceImprovementLoop,
  advanceInformationLogistics,
  agentsMaySilentlyExpandAuthority,
  claimBillionsOfUsers,
  claimTrillionsOfAgentsOrDatabases,
  createLogisticsRecord,
  createSupplierEntity,
  evaluateLineageAccess,
  evaluateLocationV3Access,
  evaluateSupplierProvenance,
  extremeScaleIsProven,
  extremeScaleStatus,
  federatedFabricCopiesEveryDatabase,
  globalSurveillanceAllowed,
  hiddenTrackingAllowed,
  l4AutonomyEnabled,
  linkSupplyChainNodes,
  listInformationLogisticsStages,
  listSupplyChainNodeKinds,
  listUniverseFabricKinds,
  listVisualGraphKinds,
  mayMarkLiveWithoutEvidence,
  openControlTowerContracts,
  openInformationLogisticsCenter,
  openLocationIntelligenceV3,
  openPhase2iabGrounding,
  openScaleArchitecture,
  openSupplierCommerceNetwork,
  openSupplyChainGraph,
  openUniverseFabric,
  parallelUniversesArePhysical,
  parallelUniversesMeanLogicalNamespaces,
  productionCredentialsEnabledInPhase2iab,
  scrapesPrivateSupplierSystems,
  supplierAdapterState,
  unverifiedProvidersStartAs,
  visualNodeExposesRequiredFields,
  xivConnectsViaAuthorizedApisOnly,
  xivHasAutomaticWorldDatabaseAccess,
  xivReplacesAndroidIosWindowsLinuxMacosSamsung,
} from './supplygraph';
import { modelProviderState } from './modelfoundry';
import { mongoDbLifecycle } from './cios';
import { gpsAutoAvailableToEveryAgent } from './locationintel';

function test(name: string, run: () => void) {
  run();
  console.log(`ok - ${name}`);
}

test('grounding: federated authorized fabric, not world DB; L4 off; scale unproven', () => {
  const g = openPhase2iabGrounding();
  assert.equal(g.notOneGiganticWorldDatabase, true);
  assert.equal(g.l4Enabled, false);
  assert.equal(g.extremeScale, 'ENGINEERING_CAPACITY_TARGET');
  assert.equal(g.extremeScaleProven, false);
  assert.equal(g.productionCredentialsEnabled, false);
  assert.equal(xivConnectsViaAuthorizedApisOnly(), true);
  assert.equal(xivHasAutomaticWorldDatabaseAccess(), false);
  assert.equal(federatedFabricCopiesEveryDatabase(), false);
  assert.equal(parallelUniversesMeanLogicalNamespaces(), true);
  assert.equal(parallelUniversesArePhysical(), false);
  assert.equal(scrapesPrivateSupplierSystems(), false);
  assert.equal(xivReplacesAndroidIosWindowsLinuxMacosSamsung(), false);
  assert.equal(nvidiaIsAuthorizationLayer(), false);
  assert.equal(ciscoMayBypassNetworkControls(), false);
  assert.equal(extremeScaleStatus(), 'ENGINEERING_CAPACITY_TARGET');
  assert.equal(extremeScaleIsProven(), false);
  assert.equal(claimBillionsOfUsers(), false);
  assert.equal(claimTrillionsOfAgentsOrDatabases(), false);
  assert.equal(l4AutonomyEnabled(), false);
  assert.equal(boundedAutonomyEnabled(), false);
  assert.equal(unverifiedProvidersStartAs(), 'NOT_CONFIGURED');
  assert.equal(mayMarkLiveWithoutEvidence(), false);
  assert.equal(productionCredentialsEnabledInPhase2iab(), false);
});

test('agent mesh: modes, offline restrictions, no new authority', () => {
  const runtime = openAgentRuntime({
    runtimeId: 'rt-1',
    tenantId: 't1',
    universeId: 'u1',
    agentId: 'a1',
    mode: 'OFFLINE_LIMITED',
  });
  assert.equal(runtime.l4Enabled, false);
  assert.equal(runtime.offlineCreatesAuthority, false);
  assert.equal(offlineCreatesAuthority(), false);
  assert.equal(meshCapabilityEqualsPrivilege(), false);
  assert.equal(agentMeshL4Enabled(), false);
  assert.ok(listAgentRuntimeModes().includes('ONLINE'));
  assert.ok(listAgentRuntimeModes().includes('REAUTH_REQUIRED'));
  assert.ok(listOfflineForbiddenActions().includes('GAIN_NEW_AUTHORITY'));
  assert.ok(listOfflineForbiddenActions().includes('PRODUCTION_DEPLOY'));

  const deniedAuth = evaluateOfflineAction({
    mode: 'OFFLINE_LIMITED',
    action: 'GAIN_NEW_AUTHORITY',
  });
  assert.equal(deniedAuth.allowed, false);

  const deniedCloud = evaluateOfflineAction({
    mode: 'OFFLINE_LIMITED',
    action: 'READ_LOCAL_CACHE',
    dataClass: 'CLOUD_ONLY',
  });
  assert.equal(deniedCloud.allowed, false);

  const deniedDeploy = evaluateOfflineAction({
    mode: 'OFFLINE_LIMITED',
    action: 'PRODUCTION_DEPLOY',
  });
  assert.equal(deniedDeploy.allowed, false);

  const readOnlyTool = evaluateOfflineAction({
    mode: 'OFFLINE_READ_ONLY',
    action: 'BOUNDED_TOOL',
  });
  assert.equal(readOnlyTool.allowed, false);

  const okLocal = evaluateOfflineAction({
    mode: 'OFFLINE_LIMITED',
    action: 'QUEUE_SIGNED_EVENT',
    dataClass: 'ALLOWED_OFFLINE',
  });
  assert.equal(okLocal.allowed, true);

  const unsigned = createEventQueue({
    queueId: 'q1',
    runtimeId: 'rt-1',
    events: [{ eventId: 'e1', signed: false, cloudOnly: false }],
  });
  assert.equal(unsigned.allowed, false);

  const cloudEvent = createEventQueue({
    queueId: 'q2',
    runtimeId: 'rt-1',
    events: [{ eventId: 'e2', signed: true, cloudOnly: true }],
  });
  assert.equal(cloudEvent.allowed, false);

  const queued = createEventQueue({
    queueId: 'q3',
    runtimeId: 'rt-1',
    events: [{ eventId: 'e3', signed: true, cloudOnly: false }],
  });
  assert.equal(queued.allowed, true);

  const onlineDenied = transitionAgentMode({
    runtime,
    next: 'ONLINE',
    reauthenticated: false,
  });
  assert.equal(onlineDenied.allowed, false);

  const onlineOk = transitionAgentMode({
    runtime,
    next: 'ONLINE',
    reauthenticated: true,
    tenantValidated: true,
    universeValidated: true,
  });
  assert.equal(onlineOk.allowed, true);

  const cache = openCachePolicy('cache-1');
  assert.equal(cache.cloudOnlyBlockedOffline, true);
  assert.equal(cache.secretsNeverCachedOffline, true);
  assert.equal(openCloudMemory('cm-1').offlineAccessible, false);
  assert.equal(openLocalMemory({ memoryId: 'lm-1', tenantId: 't1', universeId: 'u1' }).encrypted, true);
});

test('agent mesh V741: handoff auth, transitions, memory scope, bounded queue', () => {
  // 1. handoff without server authorization → DENIED
  const handoffNoServer = createHandoff({
    handoffId: 'h-noserver',
    fromAgentId: 'a1',
    toAgentId: 'a2',
    fromTenantId: 't1',
    toTenantId: 't1',
    fromUniverseId: 'u1',
    toUniverseId: 'u1',
    serverAuthorized: false,
  });
  assert.equal(handoffNoServer.allowed, false);
  if (!handoffNoServer.allowed) {
    assert.equal(handoffNoServer.reason, 'server_authorization_required');
  }

  // 2. same-tenant/same-Universe authorized handoff → ALLOWED (no permission transfer)
  const handoffOk = createHandoff({
    handoffId: 'h-ok',
    fromAgentId: 'a1',
    toAgentId: 'a2',
    fromTenantId: 't1',
    toTenantId: 't1',
    fromUniverseId: 'u1',
    toUniverseId: 'u1',
    serverAuthorized: true,
  });
  assert.equal(handoffOk.allowed, true);
  if (handoffOk.allowed) {
    assert.equal(handoffOk.handoff.transfersPermissions, false);
    assert.equal(handoffOk.handoff.requiresServerAuth, true);
    assert.equal(handoffOk.handoff.serverAuthorized, true);
    assert.equal(handoffOk.handoff.sameTenant, true);
    assert.equal(handoffOk.handoff.sameUniverse, true);
  }

  // 3. cross-tenant handoff → DENIED
  const crossTenant = createHandoff({
    handoffId: 'h-xt',
    fromAgentId: 'a1',
    toAgentId: 'a2',
    fromTenantId: 't1',
    toTenantId: 't2',
    fromUniverseId: 'u1',
    toUniverseId: 'u1',
    serverAuthorized: true,
  });
  assert.equal(crossTenant.allowed, false);
  if (!crossTenant.allowed) {
    assert.equal(crossTenant.reason, 'cross_tenant_handoff_denied');
  }

  // 4. cross-Universe handoff → DENIED
  const crossUniverse = createHandoff({
    handoffId: 'h-xu',
    fromAgentId: 'a1',
    toAgentId: 'a2',
    fromTenantId: 't1',
    toTenantId: 't1',
    fromUniverseId: 'u1',
    toUniverseId: 'u2',
    serverAuthorized: true,
  });
  assert.equal(crossUniverse.allowed, false);
  if (!crossUniverse.allowed) {
    assert.equal(crossUniverse.reason, 'cross_universe_handoff_denied');
  }

  // 5. BLOCKED → OFFLINE_LIMITED → DENIED
  const blockedRuntime = openAgentRuntime({
    runtimeId: 'rt-blocked',
    tenantId: 't1',
    universeId: 'u1',
    agentId: 'a1',
    mode: 'BLOCKED',
  });
  const blockedToOffline = transitionAgentMode({
    runtime: blockedRuntime,
    next: 'OFFLINE_LIMITED',
    reauthenticated: true,
    tenantValidated: true,
    universeValidated: true,
  });
  assert.equal(blockedToOffline.allowed, false);

  // BLOCKED → ONLINE without authorization → DENIED
  const blockedToOnlineNoAuth = transitionAgentMode({
    runtime: blockedRuntime,
    next: 'ONLINE',
  });
  assert.equal(blockedToOnlineNoAuth.allowed, false);

  // 6. REAUTH_REQUIRED → OFFLINE_LIMITED without reauth → DENIED
  const reauthRuntime = openAgentRuntime({
    runtimeId: 'rt-reauth',
    tenantId: 't1',
    universeId: 'u1',
    agentId: 'a1',
    mode: 'REAUTH_REQUIRED',
  });
  const reauthToOffline = transitionAgentMode({
    runtime: reauthRuntime,
    next: 'OFFLINE_LIMITED',
    reauthenticated: false,
  });
  assert.equal(reauthToOffline.allowed, false);

  // 7. valid reconnect path → ALLOWED
  const reconnect = transitionAgentMode({
    runtime: reauthRuntime,
    next: 'ONLINE',
    reauthenticated: true,
    tenantValidated: true,
    universeValidated: true,
  });
  assert.equal(reconnect.allowed, true);
  if (reconnect.allowed) {
    assert.equal(reconnect.runtime.mode, 'ONLINE');
  }

  // 8. local memory retains correct tenant/Universe scope
  const mem = openLocalMemory({ memoryId: 'lm-scope', tenantId: 'tenant-A', universeId: 'univ-B' });
  assert.equal(mem.tenantId, 'tenant-A');
  assert.equal(mem.universeId, 'univ-B');
  assert.equal(mem.scopedToTenant, true);
  assert.equal(mem.scopedToUniverse, true);
  assert.equal(mem.class, 'LOCAL_SCOPED');

  // 9. oversized event queue → DENIED
  const overflow = createEventQueue({
    queueId: 'q-overflow',
    runtimeId: 'rt-1',
    maxEvents: 2,
    events: [
      { eventId: 'e1', signed: true, cloudOnly: false, payloadBytes: 1 },
      { eventId: 'e2', signed: true, cloudOnly: false, payloadBytes: 1 },
      { eventId: 'e3', signed: true, cloudOnly: false, payloadBytes: 1 },
    ],
  });
  assert.equal(overflow.allowed, false);
  if (!overflow.allowed) {
    assert.equal(overflow.reason, 'event_queue_overflow');
  }

  const payloadOverflow = createEventQueue({
    queueId: 'q-bytes',
    runtimeId: 'rt-1',
    maxEvents: 10,
    maxPayloadBytes: 10,
    events: [{ eventId: 'e1', signed: true, cloudOnly: false, payloadBytes: 11 }],
  });
  assert.equal(payloadOverflow.allowed, false);

  const expired = createEventQueue({
    queueId: 'q-exp',
    runtimeId: 'rt-1',
    now: 1_000,
    events: [{ eventId: 'e1', signed: true, cloudOnly: false, payloadBytes: 1, expiresAt: 999 }],
  });
  assert.equal(expired.allowed, false);

  // 10. unsigned event → DENIED
  const unsigned = createEventQueue({
    queueId: 'q-unsigned',
    runtimeId: 'rt-1',
    events: [{ eventId: 'e1', signed: false, cloudOnly: false }],
  });
  assert.equal(unsigned.allowed, false);

  // 11. cloud-only offline event → DENIED
  const cloudOnly = createEventQueue({
    queueId: 'q-cloud',
    runtimeId: 'rt-1',
    events: [{ eventId: 'e1', signed: true, cloudOnly: true }],
  });
  assert.equal(cloudOnly.allowed, false);

  // 12. L4 remains false
  assert.equal(agentMeshL4Enabled(), false);
  assert.equal(l4AutonomyEnabled(), false);
  assert.equal(boundedAutonomyEnabled(), false);

  // 13. offline cannot create authority
  assert.equal(offlineCreatesAuthority(), false);
  const offlineAuth = evaluateOfflineAction({
    mode: 'OFFLINE_LIMITED',
    action: 'GAIN_NEW_AUTHORITY',
  });
  assert.equal(offlineAuth.allowed, false);

  // 14. Guardian/RLS behavior unchanged (recovery still requires Guardian; no bypass)
  const checkpoint = createCheckpoint({
    checkpointId: 'cp-v741',
    runtimeId: 'rt-1',
    tenantId: 't1',
    universeId: 'u1',
    lastCompletedStep: 'queue_flush',
    evidenceRefs: ['ev-1'],
  });
  assert.ok(checkpoint.integrityHash.startsWith('cp-'));
  assert.equal(checkpoint.transfersAuthority, false);
  assert.equal(checkpoint.version, 1);
  assert.equal(checkpoint.lastCompletedStep, 'queue_flush');
  const recoveryNoGuardian = recoverFromCheckpoint({
    recoveryId: 'r-nog',
    checkpoint,
    guardianActive: false,
    serverAuthorized: true,
  });
  assert.equal(recoveryNoGuardian.allowed, false);
  if (!recoveryNoGuardian.allowed) {
    assert.equal(recoveryNoGuardian.reason, 'guardian_required');
  }
  const recoveryOk = recoverFromCheckpoint({
    recoveryId: 'r-ok',
    checkpoint,
    guardianActive: true,
    serverAuthorized: true,
  });
  assert.equal(recoveryOk.allowed, true);
  if (recoveryOk.allowed) {
    assert.equal(recoveryOk.recovery.bypassesGuardian, false);
    assert.equal(recoveryOk.recovery.escalatesPrivilege, false);
  }
});

test('agent mesh: sync conflicts, recovery, audit completeness, cross-Universe isolation', () => {
  assert.equal(syncMayBypassServerAuth(), false);
  assert.equal(syncMaySkipAudit(), false);

  const syncDenied = synchronizeAgentMesh({
    authenticated: true,
    deviceValidated: true,
    tenantValidated: true,
    universeValidated: false,
    conflictResolved: true,
    serverAuthorized: true,
    auditEnabled: true,
  });
  assert.equal(syncDenied.allowed, false);

  const syncOk = synchronizeAgentMesh({
    authenticated: true,
    deviceValidated: true,
    tenantValidated: true,
    universeValidated: true,
    conflictResolved: true,
    serverAuthorized: true,
    auditEnabled: true,
  });
  assert.equal(syncOk.allowed, true);

  const conflict = resolveConflict({
    conflictId: 'c1',
    kind: 'UNIVERSE_MISMATCH',
    localAuthorized: false,
    serverAuthorized: true,
  });
  assert.equal(conflict.allowed, true);
  if (conflict.allowed) {
    assert.equal(conflict.conflict.resolution, 'DROP_UNAUTHORIZED');
  }

  const skew = resolveConflict({
    conflictId: 'c2',
    kind: 'VERSION_SKEW',
    localAuthorized: true,
    serverAuthorized: true,
    humanApproved: false,
  });
  assert.equal(skew.allowed, false);

  const handoffDenied = createHandoff({
    handoffId: 'h1',
    fromAgentId: 'a1',
    toAgentId: 'a2',
    fromTenantId: 't1',
    toTenantId: 't1',
    fromUniverseId: 'u1',
    toUniverseId: 'u2',
    serverAuthorized: true,
  });
  assert.equal(handoffDenied.allowed, false);

  const handoffOk = createHandoff({
    handoffId: 'h2',
    fromAgentId: 'a1',
    toAgentId: 'a2',
    fromTenantId: 't1',
    toTenantId: 't1',
    fromUniverseId: 'u1',
    toUniverseId: 'u1',
    serverAuthorized: true,
  });
  assert.equal(handoffOk.allowed, true);
  if (handoffOk.allowed) {
    assert.equal(handoffOk.handoff.transfersPermissions, false);
  }

  const checkpoint = createCheckpoint({
    checkpointId: 'cp1',
    runtimeId: 'rt-1',
    tenantId: 't1',
    universeId: 'u1',
  });
  const recoveryDenied = recoverFromCheckpoint({
    recoveryId: 'r1',
    checkpoint,
    guardianActive: false,
    serverAuthorized: true,
  });
  assert.equal(recoveryDenied.allowed, false);

  const recoveryOk = recoverFromCheckpoint({
    recoveryId: 'r2',
    checkpoint,
    guardianActive: true,
    serverAuthorized: true,
  });
  assert.equal(recoveryOk.allowed, true);

  const audit = auditSyncEvent({
    eventId: 'ae1',
    actor: 'a1',
    tenantId: 't1',
    universeId: 'u1',
    action: 'SYNC',
  });
  assert.equal(audit.complete, true);
  assert.equal(audit.audited, true);
});

test('agent mesh V741 slice2: sync reconnect, revocation, stale checkpoint, idempotency', () => {
  resetSyncIdempotencyLedger();
  assert.equal(syncMayBypassGuardian(), false);
  assert.equal(syncMayIgnoreRevocation(), false);
  assert.ok(listAgentMeshReconnectStages().includes('REAUTH'));
  assert.ok(listAgentMeshReconnectStages().includes('SERVER_AUTHORIZATION'));
  assert.equal(listAgentMeshReconnectStages()[0], 'RECONNECT');

  // Revocation-first
  const revoked = synchronizeAgentMesh({
    authenticated: true,
    deviceValidated: true,
    tenantValidated: true,
    universeValidated: true,
    conflictResolved: true,
    serverAuthorized: true,
    auditEnabled: true,
    revoked: true,
    syncId: 'sync-revoked',
  });
  assert.equal(revoked.allowed, false);
  if (!revoked.allowed) {
    assert.equal(revoked.reason, 'agent_revoked');
    assert.equal(revoked.stage, 'RECONNECT');
  }

  // Conflict detection helpers
  const tenantConflict = detectSyncConflict({
    conflictId: 'dc1',
    localTenantId: 't1',
    serverTenantId: 't2',
    localUniverseId: 'u1',
    serverUniverseId: 'u1',
  });
  assert.equal(tenantConflict.conflict, true);
  if (tenantConflict.conflict) {
    assert.equal(tenantConflict.kind, 'TENANT_MISMATCH');
  }

  const staleDetect = detectSyncConflict({
    conflictId: 'dc2',
    localTenantId: 't1',
    serverTenantId: 't1',
    localUniverseId: 'u1',
    serverUniverseId: 'u1',
    localCheckpointVersion: 1,
    serverCheckpointVersion: 3,
  });
  assert.equal(staleDetect.conflict, true);
  if (staleDetect.conflict) {
    assert.equal(staleDetect.kind, 'STALE_CHECKPOINT');
  }

  const staleResolved = resolveConflict({
    conflictId: 'c-stale',
    kind: 'STALE_CHECKPOINT',
    localAuthorized: true,
    serverAuthorized: true,
  });
  assert.equal(staleResolved.allowed, true);
  if (staleResolved.allowed) {
    assert.equal(staleResolved.conflict.resolution, 'DROP_UNAUTHORIZED');
  }

  // Stale checkpoint recovery rejected
  const checkpoint = createCheckpoint({
    checkpointId: 'cp-stale',
    runtimeId: 'rt-1',
    tenantId: 't1',
    universeId: 'u1',
    version: 1,
  });
  assert.equal(validateCheckpointForRecovery(checkpoint).valid, true);
  const staleRecovery = recoverFromCheckpoint({
    recoveryId: 'r-stale',
    checkpoint,
    guardianActive: true,
    serverAuthorized: true,
    serverMinVersion: 2,
  });
  assert.equal(staleRecovery.allowed, false);
  if (!staleRecovery.allowed) {
    assert.equal(staleRecovery.reason, 'stale_checkpoint_rejected');
  }

  // Tampered checkpoint integrity
  const tampered = { ...checkpoint, integrityHash: 'cp-deadbeef' };
  assert.equal(validateCheckpointForRecovery(tampered).valid, false);
  const tamperedRecovery = recoverFromCheckpoint({
    recoveryId: 'r-tamp',
    checkpoint: tampered,
    guardianActive: true,
    serverAuthorized: true,
  });
  assert.equal(tamperedRecovery.allowed, false);

  // Idempotent / replay-safe sync
  const first = synchronizeAgentMesh({
    authenticated: true,
    deviceValidated: true,
    tenantValidated: true,
    universeValidated: true,
    conflictResolved: true,
    serverAuthorized: true,
    auditEnabled: true,
    syncId: 'sync-idem-1',
  });
  assert.equal(first.allowed, true);
  if (first.allowed) {
    assert.equal(first.receipt.applied, true);
    assert.equal(first.receipt.duplicate, false);
    assert.equal(first.receipt.idempotent, true);
    assert.equal(first.receipt.replaySafe, true);
  }
  const replay = synchronizeAgentMesh({
    authenticated: true,
    deviceValidated: true,
    tenantValidated: true,
    universeValidated: true,
    conflictResolved: true,
    serverAuthorized: true,
    auditEnabled: true,
    syncId: 'sync-idem-1',
  });
  assert.equal(replay.allowed, true);
  if (replay.allowed) {
    assert.equal(replay.receipt.duplicate, true);
    assert.equal(replay.receipt.applied, false);
  }

  // Audit completeness + Guardian not bypassed
  const audit = auditSyncEvent({
    eventId: 'ae-s2',
    actor: 'a1',
    tenantId: 't1',
    universeId: 'u1',
    action: 'RECONNECT_SYNC',
    stage: 'AUDIT',
  });
  assert.equal(audit.complete, true);
  assert.equal(audit.guardianBypassed, false);
  assert.equal(agentMeshL4Enabled(), false);
  assert.equal(offlineCreatesAuthority(), false);
});

test('connector fabric: required fields, permissions, rate limits, secret leakage', () => {
  const fabric = openGlobalConnectorFabric();
  assert.equal(fabric.automaticWorldDbAccess, false);
  assert.equal(fabric.copiesEveryDatabase, false);
  assert.equal(xivConnectsToAllWorldDatabases(), false);
  assert.equal(connectorFabricCopiesEveryDatabase(), false);
  assert.equal(connectorPrivateScrape(), false);
  assert.equal(listConnectorKinds().length, 14);
  assert.ok(listConnectorHealthStates().includes('NOT_CONFIGURED'));
  assert.ok(listConnectorHealthStates().includes('CONNECTED'));
  assert.ok(connectorRequiredFieldKeys().includes('tenantId'));
  assert.ok(connectorRequiredFieldKeys().includes('universeId'));
  assert.ok(connectorRequiredFieldKeys().includes('permissionScopes'));
  assert.ok(connectorRequiredFieldKeys().includes('rateLimit'));
  assert.ok(connectorRequiredFieldKeys().includes('auditState'));

  for (const kind of listConnectorKinds()) {
    assert.equal(connectorState(kind), 'NOT_CONFIGURED');
    assert.equal(connectorMayGoLiveWithoutEvidence(kind), false);
  }

  const connector = createConnector({
    kind: 'DatabaseConnector',
    provider: 'ACME_DB',
    connectionId: 'c1',
    tenantId: 't1',
    universeId: 'u1',
    readPermission: true,
    writePermission: false,
    rateLimit: 10,
    healthState: 'CONNECTED',
  });
  assert.equal(connector.authenticationMode, 'NOT_CONFIGURED');
  assert.equal(connector.productionCredentialsEnabled, false);

  const crossUniverse = evaluateConnectorAccess({
    connector,
    tenantId: 't1',
    universeId: 'u2',
    wantsWrite: false,
  });
  assert.equal(crossUniverse.allowed, false);

  const writeDenied = evaluateConnectorAccess({
    connector,
    tenantId: 't1',
    universeId: 'u1',
    wantsWrite: true,
  });
  assert.equal(writeDenied.allowed, false);

  const rateLimited = evaluateConnectorAccess({
    connector: { ...connector, authenticationMode: 'OAUTH2' },
    tenantId: 't1',
    universeId: 'u1',
    wantsWrite: false,
    rateLimitExceeded: true,
  });
  assert.equal(rateLimited.allowed, false);

  const secretLeak = evaluateConnectorAccess({
    connector: { ...connector, authenticationMode: 'OAUTH2' },
    tenantId: 't1',
    universeId: 'u1',
    wantsWrite: false,
    secretsInPayload: true,
  });
  assert.equal(secretLeak.allowed, false);

  const ok = evaluateConnectorAccess({
    connector: { ...connector, authenticationMode: 'OAUTH2', auditState: 'COMPLETE' },
    tenantId: 't1',
    universeId: 'u1',
    wantsWrite: false,
  });
  assert.equal(ok.allowed, true);
});

test('cloud + network + plugins: scope, Cisco never bypasses, all NOT_CONFIGURED', () => {
  const cloud = openCloudFabric();
  assert.equal(cloud.autoConnectsAllAccounts, false);
  assert.deepEqual([...listCloudAuthPath()], [
    'Identity',
    'Tenant',
    'Universe',
    'Guardian',
    'Connector',
    'CloudPolicy',
    'ResourcePermission',
    'Action',
    'Audit',
  ]);
  for (const p of cloud.providers) {
    assert.equal(p.healthState, 'NOT_CONFIGURED');
    assert.equal(p.productionCredentialsEnabled, false);
  }

  const bindDenied = bindCloudAccount({
    provider: 'AWS',
    accountOrProjectId: 'acct-1',
    tenantId: 't1',
    universeId: 'u1',
    explicitlyAuthorized: false,
  });
  assert.equal(bindDenied.allowed, false);

  const bindOk = bindCloudAccount({
    provider: 'AWS',
    accountOrProjectId: 'acct-1',
    tenantId: 't1',
    universeId: 'u1',
    explicitlyAuthorized: true,
  });
  assert.equal(bindOk.allowed, true);
  if (bindOk.allowed) {
    const actionDenied = evaluateCloudAction({
      binding: bindOk.binding,
      tenantId: 't1',
      universeId: 'u1',
      guardianApproved: false,
      resourcePermission: true,
      audited: true,
    });
    assert.equal(actionDenied.allowed, false);

    const actionOk = evaluateCloudAction({
      binding: bindOk.binding,
      tenantId: 't1',
      universeId: 'u1',
      guardianApproved: true,
      resourcePermission: true,
      audited: true,
    });
    assert.equal(actionOk.allowed, true);
  }

  assert.equal(ciscoMayBypassNetworkControls(), false);
  assert.equal(networkConnectorMayBypassControls(), false);
  const ciscoBypass = evaluateCiscoCapability({ bypassNetworkControls: true, inventory: true });
  assert.equal(ciscoBypass.allowed, false);
  const ciscoOk = evaluateCiscoCapability({
    inventory: true,
    telemetry: true,
    deviceHealth: true,
    securityEvents: true,
    enterpriseNetworkingContext: true,
  });
  assert.equal(ciscoOk.allowed, true);

  const plugins = openEnterprisePlugins();
  assert.equal(plugins.length, listEnterprisePluginTargets().length);
  for (const plugin of plugins) {
    assert.equal(plugin.healthState, 'NOT_CONFIGURED');
    assert.equal(plugin.bypassesNetworkControls, false);
    assert.equal(pluginState(plugin.target), 'NOT_CONFIGURED');
  }
});

test('device + compute + personalization: XIV ≠ OS; NVIDIA ≠ auth; prefs cannot weaken isolation', () => {
  const devices = openDeviceOsFabric();
  assert.equal(devices.xivReplacesHostOs, false);
  assert.equal(fabricXivReplacesOs(), false);
  assert.deepEqual([...listDeviceTrustPath()].slice(0, 3), ['HostOS', 'XivApp', 'DeviceTrust']);

  const trustDenied = evaluateDeviceTrust({
    osGranted: true,
    xivAppPresent: true,
    deviceTrusted: true,
    identityBound: true,
    universeValidated: true,
    guardianApproved: false,
  });
  assert.equal(trustDenied.allowed, false);

  const compute = openComputeFabric();
  assert.equal(compute.nvidiaIsAuthorization, false);
  const nvidiaJob = createComputeJob({
    jobId: 'j1',
    providerId: 'nvidia-1',
    tenantId: 't1',
    universeId: 'u1',
    budgetCeiling: 10,
    claimsNvidiaAuthority: true,
  });
  assert.equal(nvidiaJob.allowed, false);
  const jobOk = createComputeJob({
    jobId: 'j2',
    providerId: 'cpu-1',
    tenantId: 't1',
    universeId: 'u1',
    budgetCeiling: 10,
  });
  assert.equal(jobOk.allowed, true);

  const profile = openPersonalizationEngine({ userId: 'user-1', tenantId: 't1' });
  assert.equal(personalizationWeakensTenantIsolation(), false);
  const weaken = applyPersonalization({
    profile,
    weakenTenantIsolation: true,
  });
  assert.equal(weaken.allowed, false);
  const expand = applyPersonalization({
    profile,
    expandAgentAuthority: true,
  });
  assert.equal(expand.allowed, false);
  const prefOk = applyPersonalization({
    profile,
    preference: { preferenceId: 'p1' },
  });
  assert.equal(prefOk.allowed, true);
});

test('supplier network + provenance: adapters NOT_CONFIGURED; no private scrape', () => {
  const network = openSupplierCommerceNetwork();
  assert.equal(network.scrapesPrivateSupplierSystems, false);
  for (const adapter of network.adapters) {
    assert.equal(adapter.healthState, 'NOT_CONFIGURED');
    assert.equal(supplierAdapterState(adapter.kind), 'NOT_CONFIGURED');
  }
  const entity = createSupplierEntity({
    entityId: 's1',
    kind: 'Supplier',
    tenantId: 't1',
    universeId: 'u1',
    verification: 'SELF_REPORTED',
  });
  const weak = evaluateSupplierProvenance({ entity });
  assert.equal(weak.trusted, false);
  const verified = evaluateSupplierProvenance({
    entity: { ...entity, verification: 'REGISTRY_VERIFIED', provenance: 'GLEIF' },
  });
  assert.equal(verified.trusted, true);
});

test('supply chain graph + information logistics + lineage isolation', () => {
  const graph = openSupplyChainGraph({ tenantId: 't1', universeId: 'u1' });
  assert.equal(graph.missingLinksDefaultToUnknown, true);
  assert.equal(listSupplyChainNodeKinds().includes('RAW_MATERIAL'), true);
  assert.equal(listSupplyChainNodeKinds().includes('RECYCLE'), true);
  assert.equal(listSupplyChainNodeKinds().length, 16);

  const from = graph.nodes.find((n) => n.kind === 'SUPPLIER')!;
  const to = graph.nodes.find((n) => n.kind === 'MANUFACTURER')!;
  const link = linkSupplyChainNodes({
    relationshipId: 'rel-1',
    from,
    to,
    source: 'buyer',
    provenance: 'PO',
    confidence: 0.8,
  });
  assert.equal(link.allowed, true);

  const cross = linkSupplyChainNodes({
    relationshipId: 'rel-2',
    from,
    to: { ...to, universeId: 'u2' },
  });
  assert.equal(cross.allowed, false);

  const ilc = openInformationLogisticsCenter({ tenantId: 't1', universeId: 'u1' });
  assert.equal(listInformationLogisticsStages().length, 12);
  assert.equal(ilc.stages[0], 'SOURCE');
  assert.equal(ilc.stages[ilc.stages.length - 1], 'LEARN');

  const record = createLogisticsRecord({
    recordId: 'r1',
    what: 'sku',
    where: 'warehouse',
    owner: 'ops',
    whoMayAccess: ['ops', 'analyst'],
    why: 'fulfillment',
    tenantId: 't1',
    universeId: 'u1',
  });
  const lineageDenied = evaluateLineageAccess({
    record,
    actorId: 'stranger',
    tenantId: 't1',
    universeId: 'u1',
  });
  assert.equal(lineageDenied.allowed, false);
  const lineageCross = evaluateLineageAccess({
    record,
    actorId: 'ops',
    tenantId: 't2',
    universeId: 'u1',
  });
  assert.equal(lineageCross.allowed, false);
  const lineageOk = evaluateLineageAccess({
    record,
    actorId: 'ops',
    tenantId: 't1',
    universeId: 'u1',
  });
  assert.equal(lineageOk.allowed, true);

  const advanceDenied = advanceInformationLogistics({
    record,
    next: 'VERIFY',
    evidencePresent: false,
    accessAuthorized: true,
  });
  assert.equal(advanceDenied.allowed, false);

  const toIngest = advanceInformationLogistics({
    record,
    next: 'INGEST',
    evidencePresent: true,
    accessAuthorized: true,
  });
  assert.equal(toIngest.allowed, true);
});

test('universe fabric + scale + improvement + location V3 + visual contracts', () => {
  const universes = openUniverseFabric({ tenantId: 't1' });
  assert.equal(universes.logicalNamespacesOnly, true);
  assert.equal(universes.physicalAlternateUniverses, false);
  assert.equal(universes.extraterrestrialClaims, false);
  assert.equal(listUniverseFabricKinds().length, 8);

  const scale = openScaleArchitecture();
  assert.equal(scale.proven, false);
  assert.equal(scale.engineeringCapacityTargetOnly, true);
  for (const p of scale.partitions) {
    assert.equal(p.status, 'ENGINEERING_CAPACITY_TARGET');
    assert.equal(p.proven, false);
  }

  assert.equal(agentsMaySilentlyExpandAuthority(), false);
  const silent = advanceImprovementLoop({
    stage: 'LEARN',
    silentlyExpandAuthority: true,
  });
  assert.equal(silent.allowed, false);
  const actDenied = advanceImprovementLoop({ stage: 'ACT', humanApproved: false });
  assert.equal(actDenied.allowed, false);
  const actOk = advanceImprovementLoop({ stage: 'ACT', humanApproved: true });
  assert.equal(actOk.allowed, true);

  const loc = openLocationIntelligenceV3();
  assert.equal(loc.hiddenTracking, false);
  assert.equal(loc.globalSurveillance, false);
  assert.equal(hiddenTrackingAllowed(), false);
  assert.equal(globalSurveillanceAllowed(), false);
  assert.equal(gpsAutoAvailableToEveryAgent(), false);

  const locDenied = evaluateLocationV3Access({
    purpose: 'SUPPLIER_PROXIMITY',
    osGranted: true,
    userApproved: true,
    orgApproved: true,
    tenantId: 't1',
    universeId: 'u1',
    agentAuthorized: true,
    hiddenTracking: true,
  });
  assert.equal(locDenied.allowed, false);

  const locOk = evaluateLocationV3Access({
    purpose: 'SHIPMENT_CORRIDOR',
    osGranted: true,
    userApproved: true,
    orgApproved: true,
    tenantId: 't1',
    universeId: 'u1',
    agentAuthorized: true,
  });
  assert.equal(locOk.allowed, true);

  const tower = openControlTowerContracts({ tenantId: 't1', universeId: 'u1' });
  assert.equal(listVisualGraphKinds().length, 10);
  assert.equal(tower.dataContractsOnly, true);
  for (const node of tower.nodes) {
    assert.equal(visualNodeExposesRequiredFields(node), true);
  }
});

test('prior phases remain intact: model providers + mongo NOT_CONFIGURED', () => {
  assert.equal(modelProviderState('OPENAI'), 'NOT_CONFIGURED');
  assert.equal(mongoDbLifecycle(), 'NOT_CONFIGURED');
});

console.log('phase2iab: all tests passed');
