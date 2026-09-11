import assert from 'node:assert/strict';
import { promises as fs } from 'node:fs';
import { tmpdir } from 'node:os';
import * as path from 'node:path';
import {
  PersistentGovernedApiSessionJournal75,
  VaultCredentialBroker75,
  PrivateBrainRuntimeSupervisor75,
  UsageRollupCheckpointStore75,
  PersistentWorkCouncil75,
  evaluateHybridRoute75,
  type GpuEvidenceReceipt75,
  type RuntimeProbeSample75,
  type VaultAuditEvidence75,
} from './persistent-governed-api-vault-runtime-supervisor';

const NOW = new Date('2026-09-11T16:00:00.000Z');
const LATER = new Date('2026-09-11T16:01:00.000Z');
const FUTURE = '2026-09-11T18:00:00.000Z';
const EVIDENCE = ['receipt:test:001'];
const GENESIS = '0'.repeat(64);

async function tempRoot(label: string): Promise<string> {
  return fs.mkdtemp(path.join(tmpdir(), `xiv-12d75-${label}-`));
}

async function expectReject(fn: () => Promise<unknown>, pattern: RegExp): Promise<void> {
  await assert.rejects(fn, pattern);
}

async function testPersistentSessions(): Promise<void> {
  const root = await tempRoot('sessions');
  const journal = new PersistentGovernedApiSessionJournal75(root, 'tenant-a', 'user-a');
  const session = await journal.open({
    tenantId: 'tenant-a',
    userId: 'user-a',
    universeId: 'universe-a',
    agentId: 'agent-research',
    apiId: 'api-local-rag',
    exposure: 'LOCAL_LOOPBACK',
    classification: 'RESTRICTED',
    dataClass: 'GENERAL',
    scopes: ['rag.read', 'api.invoke'],
    grantId: 'grant-a',
    consentReceiptId: 'consent-a',
    policyReceiptId: 'policy-a',
    evidenceRefs: EVIDENCE,
    ttlMs: 60 * 60 * 1000,
    now: NOW,
  });
  assert.equal(session.rawContentPersisted, false);
  assert.equal(session.secretMaterialPersisted, false);

  const afterRestart = new PersistentGovernedApiSessionJournal75(root, 'tenant-a', 'user-a');
  assert.equal((await afterRestart.requireActive(session.sessionId, ['rag.read'], LATER)).state, 'ACTIVE');

  const invalidated = await afterRestart.invalidateAuthority('CONSENT', 'consent-a', 'subject revoked consent', ['receipt:consent:revoke'], LATER);
  assert.deepEqual(invalidated, [session.sessionId]);
  const secondRestart = new PersistentGovernedApiSessionJournal75(root, 'tenant-a', 'user-a');
  await expectReject(() => secondRestart.requireActive(session.sessionId, ['rag.read'], LATER), /revoked/);

  await expectReject(() => journal.open({
    tenantId: 'tenant-a',
    userId: 'user-a',
    universeId: 'u-top',
    agentId: 'agent-a',
    apiId: 'api-hybrid',
    exposure: 'HYBRID_OUTBOUND',
    classification: 'TOP_SECRET',
    dataClass: 'GENERAL',
    scopes: ['rag.read'],
    grantId: 'grant-top',
    vendorId: 'vendor-target',
    evidenceRefs: EVIDENCE,
    ttlMs: 10_000,
    now: NOW,
  }), /TOP_SECRET/);

  const raw = await fs.readFile(journal.filePath, 'utf8');
  const lines = raw.trim().split(/\r?\n/);
  const first = JSON.parse(lines[0]);
  first.evidenceRefs = ['tampered'];
  lines[0] = JSON.stringify(first);
  await fs.writeFile(journal.filePath, `${lines.join('\n')}\n`, 'utf8');
  await expectReject(() => journal.load(), /integrity failure/);
}

async function testCredentialBroker(): Promise<void> {
  const root = await tempRoot('broker');
  const broker = new VaultCredentialBroker75(root, 'tenant-a', 'user-a');
  const audit: VaultAuditEvidence75 = {
    auditReceiptId: 'vault-audit-1',
    tenantId: 'tenant-a',
    userId: 'user-a',
    secretId: 'secret-api-key',
    secretVersion: 3,
    actorRole: 'DELEGATE',
    delegatedScopes: ['vendor.read'],
    allowedScopes: ['vendor.read', 'vendor.metadata'],
    intendedApiId: 'api-vendor',
    verifiedAt: NOW.toISOString(),
    expiresAt: FUTURE,
    evidenceRefs: ['receipt:vault:001'],
    secretValueRendered: false,
    secretValueLogged: false,
    ordinaryEmbeddingEligible: false,
    clientRenderingAllowed: false,
  };
  const issued = await broker.issue({ audit, requestedScopes: ['vendor.read'], ttlMs: 120_000, evidenceRefs: ['receipt:broker:issue'], now: NOW });
  assert.match(issued.handle, /^xivcred_/);
  assert.equal(issued.plaintextIncluded, false);
  assert.equal(issued.loggable, false);
  assert.equal(issued.embeddingEligible, false);
  assert.equal(issued.clientRenderable, false);
  assert.equal(issued.restartInvalidatesHandle, true);

  const use = await broker.authorizeUse({ handle: issued.handle, apiId: 'api-vendor', requiredScopes: ['vendor.read'], evidenceRefs: ['receipt:broker:use'], now: LATER });
  assert.equal(use.authorized, true);
  assert.equal(use.plaintextReturned, false);
  assert.equal(use.secretVersion, 3);

  const receipts = await broker.loadReceipts();
  assert.equal(receipts.length, 2);
  assert.equal(receipts.every((receipt) => receipt.plaintextStored === false), true);
  assert.equal(JSON.stringify(receipts).includes(issued.handle), false);

  const restarted = new VaultCredentialBroker75(root, 'tenant-a', 'user-a');
  await expectReject(() => restarted.authorizeUse({ handle: issued.handle, apiId: 'api-vendor', requiredScopes: ['vendor.read'], evidenceRefs: EVIDENCE, now: LATER }), /restart-invalidated/);
  await expectReject(() => broker.issue({ audit, requestedScopes: ['vendor.read'], ttlMs: 600_000, evidenceRefs: EVIDENCE, now: NOW }), /five minutes/);
}

async function testRuntimeSupervisor(): Promise<void> {
  const supervisor = new PrivateBrainRuntimeSupervisor75('tenant-a');
  const empty = supervisor.evaluateComponent('CPU_BRAIN', [], { asOf: NOW });
  assert.equal(empty.status, 'UNVERIFIED');
  assert.equal(empty.configuredImpliesRunning, false);

  const samples: RuntimeProbeSample75[] = [
    { tenantId: 'tenant-a', component: 'CPU_BRAIN', observedAt: '2026-09-11T15:59:30.000Z', reachable: true, httpStatus: 200, latencyMs: 45, queueDepth: 3, storageUsedBytes: 20, storageCapacityBytes: 100, evidenceRefs: ['probe:cpu:1'] },
    { tenantId: 'tenant-a', component: 'CPU_BRAIN', observedAt: '2026-09-11T15:59:50.000Z', reachable: true, httpStatus: 204, latencyMs: 55, queueDepth: 2, storageUsedBytes: 21, storageCapacityBytes: 100, evidenceRefs: ['probe:cpu:2'] },
    { tenantId: 'tenant-a', component: 'RAG', observedAt: '2026-09-11T15:59:50.000Z', reachable: true, httpStatus: 500, latencyMs: 90, evidenceRefs: ['probe:rag:1'] },
  ];
  assert.equal(supervisor.evaluateComponent('CPU_BRAIN', samples, { asOf: NOW }).status, 'HEALTHY');
  assert.equal(supervisor.evaluateComponent('RAG', samples, { asOf: NOW }).status, 'OFFLINE');
  assert.equal(supervisor.evaluateComponent('API_STUDIO', samples, { asOf: NOW }).status, 'UNVERIFIED');

  const degradedSamples: RuntimeProbeSample75[] = [
    { tenantId: 'tenant-a', component: 'API_STUDIO', observedAt: '2026-09-11T15:59:50.000Z', reachable: true, httpStatus: 200, latencyMs: 2_100, queueDepth: 120, evidenceRefs: ['probe:api:1'] },
  ];
  assert.equal(supervisor.evaluateComponent('API_STUDIO', degradedSamples, { asOf: NOW }).status, 'DEGRADED');

  const partialGpu: GpuEvidenceReceipt75[] = [
    { tenantId: 'tenant-a', deviceId: 'gpu-1', kind: 'HARDWARE', receiptId: 'gpu-hw', observedAt: NOW.toISOString(), expiresAt: FUTURE, evidenceRefs: ['gpu:hw'] },
    { tenantId: 'tenant-a', deviceId: 'gpu-1', kind: 'RUNTIME', receiptId: 'gpu-runtime', observedAt: NOW.toISOString(), expiresAt: FUTURE, evidenceRefs: ['gpu:runtime'] },
  ];
  assert.equal(supervisor.evaluateGpu(partialGpu, NOW).eligible, false);
  const verifiedGpu: GpuEvidenceReceipt75[] = [
    ...partialGpu,
    { tenantId: 'tenant-a', deviceId: 'gpu-1', kind: 'BENCHMARK', receiptId: 'gpu-benchmark', observedAt: NOW.toISOString(), expiresAt: FUTURE, evidenceRefs: ['gpu:benchmark'] },
  ];
  assert.equal(supervisor.evaluateGpu(verifiedGpu, NOW).eligible, true);
  assert.equal(supervisor.evaluateGpu(verifiedGpu, NOW).executionObserved, false);
  const snapshot = supervisor.snapshot(samples, verifiedGpu, NOW);
  assert.equal(snapshot.execution.sovereignBaseline, 'CPU');
  assert.equal(snapshot.execution.gpuAccelerationEligible, true);
  assert.equal(snapshot.execution.gpuExecutionObserved, false);
  assert.equal(snapshot.execution.selectedBackend, 'GPU_ELIGIBLE_NOT_OBSERVED');
  assert.equal(snapshot.execution.ollamaRunning, false);
}

async function testUsageCheckpointAndCouncil(): Promise<void> {
  const root = await tempRoot('ops');
  const checkpointStore = new UsageRollupCheckpointStore75(root, 'tenant-a');
  const checkpoint = await checkpointStore.save({
    tenantId: 'tenant-a',
    sourceEventCount: 12,
    sourceHeadHash: 'a'.repeat(64),
    views: 7,
    uniqueUsers: 3,
    sessions: 4,
    featureUsage: { search: 5, dashboard: 2 },
    surfaceViews: { executive: 4, universe: 3 },
    rawContentLogged: false,
    rawQueryLogged: false,
    payloadLogged: false,
    evidenceRefs: ['receipt:usage:rollup'],
  }, NOW);
  assert.equal(checkpoint.views, 7);
  assert.equal(checkpoint.uniqueUsers, 3);
  assert.equal((await checkpointStore.load())?.checkpointHash, checkpoint.checkpointHash);

  const council = new PersistentWorkCouncil75(root, 'tenant-a');
  const task = await council.assignTask({ tenantId: 'tenant-a', title: 'Evaluate private RAG promotion', ownerRole: 'RAG_EVALUATOR', status: 'ACTIVE', evidenceRefs: ['receipt:task:1'] }, NOW);
  const meeting = await council.recordMeeting({
    tenantId: 'tenant-a',
    recurrence: 'DAILY',
    scheduledFor: NOW.toISOString(),
    nextScheduledFor: '2026-09-12T16:00:00.000Z',
    participantRoles: ['RAG_EVALUATOR', 'PRIVACY_REVIEWER', 'PLATFORM_ENGINEER'],
    taskIds: [task.taskId],
    minutesEvidenceRefs: ['receipt:minutes:1'],
    decisions: [{ summary: 'Keep promotion in evaluation until evidence threshold is met.', ownerRole: 'RAG_EVALUATOR', evidenceRefs: ['receipt:decision:1'] }],
    dissent: [{ role: 'PLATFORM_ENGINEER', statement: 'Request a larger offline benchmark before promotion.', evidenceRefs: ['receipt:dissent:1'] }],
  }, NOW);
  assert.equal(meeting.participantRoles.length, 3);
  assert.equal(meeting.dissent.length, 1);
  assert.equal(meeting.authority.canDeploy, false);
  assert.equal(meeting.authority.canMoveMoney, false);
  const restarted = new PersistentWorkCouncil75(root, 'tenant-a');
  const entries = await restarted.load();
  assert.equal(entries.length, 2);
  assert.equal(entries[1].meeting?.dissent[0].role, 'PLATFORM_ENGINEER');

  await expectReject(() => council.recordMeeting({
    tenantId: 'tenant-a', recurrence: 'DAILY', scheduledFor: NOW.toISOString(), nextScheduledFor: FUTURE,
    participantRoles: ['ONLY_ONE'], taskIds: [], minutesEvidenceRefs: EVIDENCE, decisions: [], dissent: [],
  }, NOW), /2-8/);
}

async function testHybridRouteGovernance(): Promise<void> {
  const root = await tempRoot('hybrid');
  const journal = new PersistentGovernedApiSessionJournal75(root, 'tenant-a', 'user-a');
  const session = await journal.open({
    tenantId: 'tenant-a', userId: 'user-a', universeId: 'universe-a', agentId: 'agent-finance-read', apiId: 'api-finance-read',
    exposure: 'HYBRID_OUTBOUND', classification: 'RESTRICTED', dataClass: 'FINANCIAL', scopes: ['financial.read'], grantId: 'grant-finance',
    consentReceiptId: 'consent-finance', policyReceiptId: 'policy-us', vendorId: 'named-bank-target', evidenceRefs: ['receipt:session:finance'], ttlMs: 60 * 60 * 1000, now: NOW,
  });
  const authorization = {
    receiptId: 'auth-1', tenantId: 'tenant-a', userId: 'user-a', vendorId: 'named-bank-target', scopes: ['financial.read'], dataClasses: ['FINANCIAL' as const], jurisdiction: 'US-TX', externalRoutingAllowed: true, expiresAt: FUTURE, evidenceRefs: ['receipt:user:auth'],
  };
  const legalPolicy = {
    receiptId: 'policy-1', tenantId: 'tenant-a', jurisdiction: 'US-TX', vendorId: 'named-bank-target', allowedDataClasses: ['FINANCIAL' as const], externalRoutingAllowed: true, expiresAt: FUTURE, evidenceRefs: ['receipt:legal:policy'],
  };
  const apiReady = {
    receiptId: 'vendor-1', tenantId: 'tenant-a', vendorId: 'named-bank-target', status: 'API_READY' as const, supportedApi: true, expiresAt: FUTURE, evidenceRefs: ['receipt:vendor:api-ready'],
  };
  const denied = await evaluateHybridRoute75({ sessionJournal: journal, sessionId: session.sessionId, requiredScopes: ['financial.read'], authorization, legalPolicy, vendor: apiReady, dataClass: 'FINANCIAL', classification: 'RESTRICTED', jurisdiction: 'US-TX', now: LATER });
  assert.equal(denied.allowed, false);
  assert.equal(denied.partnershipClaimAllowed, false);
  assert.match(denied.reasons.join(' '), /not VERIFIED_PARTNER/);

  const verified = { ...apiReady, receiptId: 'vendor-2', status: 'VERIFIED_PARTNER' as const, evidenceRefs: ['receipt:vendor:verified-partner'] };
  const allowed = await evaluateHybridRoute75({ sessionJournal: journal, sessionId: session.sessionId, requiredScopes: ['financial.read'], authorization, legalPolicy, vendor: verified, dataClass: 'FINANCIAL', classification: 'RESTRICTED', jurisdiction: 'US-TX', now: LATER });
  assert.equal(allowed.allowed, true);
  assert.equal(allowed.partnershipClaimAllowed, true);
  assert.equal(allowed.financialAuthority.unrestrictedBankAccess, false);
  assert.equal(allowed.financialAuthority.canMoveMoney, false);
  assert.equal(allowed.financialAuthority.canOpenAccounts, false);
  assert.equal(allowed.financialAuthority.canSignContracts, false);

  const topSecret = await evaluateHybridRoute75({ sessionJournal: journal, sessionId: session.sessionId, requiredScopes: ['financial.read'], authorization, legalPolicy, vendor: verified, dataClass: 'FINANCIAL', classification: 'TOP_SECRET', jurisdiction: 'US-TX', now: LATER });
  assert.equal(topSecret.allowed, false);
  assert.equal(topSecret.topSecretExternalRoutingAllowed, false);
}

async function testSubjectAndPathIsolation(): Promise<void> {
  const root = await tempRoot('isolation');
  assert.throws(() => new PersistentGovernedApiSessionJournal75(root, '../tenant', 'user-a'), /invalid tenant id/);
  const journal = new PersistentGovernedApiSessionJournal75(root, 'tenant-a', 'user-a');
  await expectReject(() => journal.open({
    tenantId: 'tenant-b', userId: 'user-a', universeId: 'u', agentId: 'a', apiId: 'api', exposure: 'LOCAL_LOOPBACK', classification: 'INTERNAL', dataClass: 'GENERAL', scopes: ['read'], grantId: 'grant', evidenceRefs: EVIDENCE, ttlMs: 1000, now: NOW,
  }), /subject mismatch/);
  assert.equal(GENESIS.length, 64);
}

async function main(): Promise<void> {
  await testPersistentSessions();
  await testCredentialBroker();
  await testRuntimeSupervisor();
  await testUsageCheckpointAndCouncil();
  await testHybridRouteGovernance();
  await testSubjectAndPathIsolation();
  console.log('12D-75 persistent API/vault/runtime supervisor contracts: OK');
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
