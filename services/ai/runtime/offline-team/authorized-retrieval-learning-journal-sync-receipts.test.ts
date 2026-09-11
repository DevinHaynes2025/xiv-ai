import assert from 'node:assert/strict';
import { promises as fs } from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import {
  AuthorizedRetrievalSessionRegistry,
  EncryptedLearningEvaluationJournal,
  PrivacyPreservingSyncReceiptJournal,
  RetrievalAccessJournal,
  approveSharedLearningExport,
  type AgentMemoryPolicy,
  type RetrievalAuthoritySnapshot,
  type UniverseLearningKeyResolver,
} from './authorized-retrieval-learning-journal-sync-receipts';

async function expectReject(fn: () => Promise<unknown>, pattern: RegExp): Promise<void> {
  await assert.rejects(fn, pattern);
}

const root = await fs.mkdtemp(path.join(os.tmpdir(), 'xiv-12d73-'));
const tenantId = 'tenant-a';
const userId = 'user-a';
const universeId = 'universe-a';
const now = new Date('2026-09-11T14:30:00.000Z');

const policies: AgentMemoryPolicy[] = [
  {
    agentId: 'research-agent', role: 'research', memoryNamespace: 'research-memory',
    readableNamespaces: ['research-memory'], writableNamespaces: ['research-memory'],
    allowedScopes: ['memory.read', 'memory.write'], classificationCeiling: 'TOP_SECRET',
    goals: ['source-backed retrieval'], policyRefs: ['policy:research-v1'], evidenceRefs: ['evidence:research-policy'],
    consciousness: false, freeWill: false, independentLegalAuthority: false,
  },
  {
    agentId: 'finance-agent', role: 'finance-governance', memoryNamespace: 'finance-memory',
    readableNamespaces: ['finance-memory'], writableNamespaces: ['finance-memory'],
    allowedScopes: ['memory.read'], classificationCeiling: 'RESTRICTED',
    goals: ['governed financial analysis only'], policyRefs: ['policy:finance-v1'], evidenceRefs: ['evidence:finance-policy'],
    consciousness: false, freeWill: false, independentLegalAuthority: false,
  },
];

let authority: RetrievalAuthoritySnapshot = {
  tenantId, userId, universeId, grantId: 'grant-1', grantCurrent: true,
  consentReceiptId: 'consent-1', consentCurrent: true,
  policyReceiptId: 'legal-1', policyCurrent: true,
  scopes: ['memory.read', 'memory.write'], authorizationVersion: 1,
  evidenceRefs: ['evidence:grant', 'evidence:consent', 'evidence:policy'],
};
const resolver = async () => ({ ...authority, scopes: [...authority.scopes], evidenceRefs: [...authority.evidenceRefs] });
const accessJournal = new RetrievalAccessJournal(root, tenantId, userId);
const sessions = new AuthorizedRetrievalSessionRegistry(resolver, accessJournal, policies);

await expectReject(
  () => sessions.startSession({ tenantId, userId, universeId, agentId: 'research-agent', memoryNamespace: 'finance-memory', grantId: 'grant-1', scopes: ['memory.read'], ttlMs: 60_000, evidenceRefs: ['evidence:start'], now }),
  /read namespace denied/,
);

const session = await sessions.startSession({
  tenantId, userId, universeId, agentId: 'research-agent', memoryNamespace: 'research-memory', grantId: 'grant-1',
  scopes: ['memory.read'], ttlMs: 60_000, evidenceRefs: ['evidence:start'], now,
});
const ordinary = await sessions.authorizeRead({
  sessionId: session.sessionId, scope: 'memory.read', memoryNamespace: 'research-memory', classification: 'CONFIDENTIAL',
  route: 'LOCAL_ONLY', query: 'private roadmap query', candidateCount: 9, hitCount: 2, evidenceRefs: ['evidence:query-1'], now,
});
assert.equal(ordinary.authorized, true);
assert.equal(ordinary.ordinaryEmbeddingsExecuted, false);
assert.equal(ordinary.querySha256.length, 64);
const journalRaw = await fs.readFile(accessJournal.filePath, 'utf8');
assert.equal(journalRaw.includes('private roadmap query'), false, 'raw query must not enter access journal');
assert.equal((await accessJournal.load()).length, 1);

const topSecret = await sessions.authorizeRead({
  sessionId: session.sessionId, scope: 'memory.read', memoryNamespace: 'research-memory', classification: 'TOP_SECRET',
  route: 'LOCAL_RESTRICTED', query: 'restricted local query', candidateCount: 1, hitCount: 1, evidenceRefs: ['evidence:query-secret'], now,
});
assert.equal(topSecret.ordinaryEmbeddingEligible, false);
assert.equal(topSecret.externalPluginAllowed, false);
assert.equal(topSecret.publicWebAllowed, false);
assert.equal(topSecret.clientRenderingAllowed, false);
await expectReject(
  () => sessions.authorizeRead({ sessionId: session.sessionId, scope: 'memory.read', memoryNamespace: 'research-memory', classification: 'TOP_SECRET', route: 'HYBRID', query: 'x', candidateCount: 1, hitCount: 1, evidenceRefs: ['evidence:x'], now }),
  /TOP_SECRET retrieval must use LOCAL_RESTRICTED/,
);

sessions.assertWriteAllowed('research-agent', 'research-memory', 'CONFIDENTIAL', 'memory.write');
assert.throws(() => sessions.assertWriteAllowed('finance-agent', 'research-memory', 'INTERNAL', 'memory.read'), /write namespace denied/);
assert.throws(() => sessions.assertWriteAllowed('finance-agent', 'finance-memory', 'TOP_SECRET', 'memory.read'), /classification ceiling exceeded/);

authority = { ...authority, authorizationVersion: 2 };
await expectReject(
  () => sessions.authorizeRead({ sessionId: session.sessionId, scope: 'memory.read', memoryNamespace: 'research-memory', classification: 'INTERNAL', route: 'LOCAL_ONLY', query: 'x', candidateCount: 1, hitCount: 0, evidenceRefs: ['evidence:version-change'], now }),
  /invalidated by authorization change/,
);

authority = { ...authority, authorizationVersion: 3, grantCurrent: true };
const session2 = await sessions.startSession({ tenantId, userId, universeId, agentId: 'research-agent', memoryNamespace: 'research-memory', grantId: 'grant-1', scopes: ['memory.read'], ttlMs: 60_000, evidenceRefs: ['evidence:start2'], now });
assert.equal(sessions.invalidateByConsent('consent-1'), 1);
await expectReject(
  () => sessions.authorizeRead({ sessionId: session2.sessionId, scope: 'memory.read', memoryNamespace: 'research-memory', classification: 'INTERNAL', route: 'LOCAL_ONLY', query: 'x', candidateCount: 1, hitCount: 0, evidenceRefs: ['evidence:revoked'], now }),
  /session inactive/,
);

const keyBytes = Buffer.alloc(32, 7);
const keyResolver: UniverseLearningKeyResolver = {
  async resolve(requestTenant, requestUser, keyVersion) {
    assert.equal(requestTenant, tenantId);
    assert.equal(requestUser, userId);
    assert.equal(keyVersion ?? 1, 1);
    return { tenantId, userId, keyId: 'learning-key-1', keyVersion: 1, key: keyBytes, evidenceRefs: ['evidence:key'] };
  },
};
const learning = new EncryptedLearningEvaluationJournal(root, tenantId, userId, keyResolver);
const evaluation = await learning.recordEvaluation({
  tenantId, userId, universeId, agentId: 'research-agent', memoryNamespace: 'research-memory', subjectVersion: 'memory-v4',
  evaluationScore: 0.92, threshold: 0.8, promotionVersion: 'memory-v5',
  provenanceRefs: ['source:doc-4'], evidenceRefs: ['evidence:evaluation'], evaluatedAt: now.toISOString(),
});
assert.equal(evaluation.promoted, true);
assert.equal(evaluation.modelWeightsMutated, false);
assert.equal(evaluation.graphEdgeIsFact, false);
assert.equal(evaluation.correlationIsCausation, false);
const encryptedRaw = await fs.readFile(learning.filePath, 'utf8');
assert.equal(encryptedRaw.includes('source:doc-4'), false, 'learning provenance must remain encrypted at rest');
assert.equal(encryptedRaw.includes('memory-v5'), false, 'promotion payload must remain encrypted at rest');
const reloadedLearning = new EncryptedLearningEvaluationJournal(root, tenantId, userId, keyResolver);
assert.equal((await reloadedLearning.load()).length, 1);
const rollback = await reloadedLearning.recordRollback({
  tenantId, userId, universeId, agentId: 'research-agent', memoryNamespace: 'research-memory', evaluationId: evaluation.evaluationId,
  promotionVersion: 'memory-v5', rollbackToVersion: 'memory-v4', reason: 'evaluation regression',
  provenanceRefs: ['source:rollback-review'], evidenceRefs: ['evidence:rollback'], rolledBackAt: new Date(now.getTime() + 1000).toISOString(),
});
assert.equal(rollback.modelWeightsMutated, false);
assert.equal((await reloadedLearning.load()).length, 2);

assert.throws(() => approveSharedLearningExport({
  tenantId, universeId, exportId: 'small', classification: 'INTERNAL', cohortSize: 4, aggregateOnly: true, minimized: true,
  anonymized: true, rawRecordsIncluded: false, directIdentifiersIncluded: false, metricNames: ['success_rate'], evidenceRefs: ['evidence:export'], approvedByPolicy: true,
}), /minimum privacy cohort/);
assert.throws(() => approveSharedLearningExport({
  tenantId, universeId, exportId: 'secret', classification: 'TOP_SECRET', cohortSize: 10, aggregateOnly: true, minimized: true,
  anonymized: true, rawRecordsIncluded: false, directIdentifiersIncluded: false, metricNames: ['success_rate'], evidenceRefs: ['evidence:export'], approvedByPolicy: true,
}), /TOP_SECRET/);
const exportReceipt = approveSharedLearningExport({
  tenantId, universeId, exportId: 'agg-1', classification: 'INTERNAL', cohortSize: 10, aggregateOnly: true, minimized: true,
  anonymized: true, rawRecordsIncluded: false, directIdentifiersIncluded: false, metricNames: ['success_rate', 'latency_bucket'], evidenceRefs: ['evidence:export'], approvedByPolicy: true,
}, now);
assert.equal(exportReceipt.approved, true);
assert.equal(exportReceipt.rawRecordsIncluded, false);

const sync = new PrivacyPreservingSyncReceiptJournal(root, tenantId, userId);
const testedDevice = {
  adapterId: 'android-adapter', kind: 'DEVICE' as const, providerName: 'Android', platform: 'android', deviceStatus: 'TESTED' as const,
  verificationReceiptId: 'device-tested', verifiedAt: '2026-09-11T13:00:00.000Z', expiresAt: '2026-09-12T00:00:00.000Z', evidenceRefs: ['evidence:device-test'],
};
await expectReject(
  () => sync.record({ tenantId, userId, universeId, authorizationGrantId: 'grant-sync', explicitUserAuthorization: true, classification: 'INTERNAL', adapter: testedDevice, success: true, latencyMs: 20, evidenceRefs: ['evidence:sync'], attemptedAt: now.toISOString() }),
  /verified adapter required/,
);
const verifiedDevice = { ...testedDevice, deviceStatus: 'VERIFIED' as const, verificationReceiptId: 'device-verified' };
await sync.record({ tenantId, userId, universeId, authorizationGrantId: 'grant-sync', explicitUserAuthorization: true, classification: 'INTERNAL', adapter: verifiedDevice, success: true, latencyMs: 20, evidenceRefs: ['evidence:sync-1'], attemptedAt: now.toISOString() });
await sync.record({ tenantId, userId, universeId, authorizationGrantId: 'grant-sync', explicitUserAuthorization: true, classification: 'INTERNAL', adapter: verifiedDevice, success: false, latencyMs: 90, errorCode: 'TIMEOUT', evidenceRefs: ['evidence:sync-2'], attemptedAt: now.toISOString() });
const apiReadyVendor = {
  adapterId: 'retailer-api', kind: 'VENDOR' as const, providerName: 'RetailerTarget', vendorStatus: 'API_READY' as const,
  verificationReceiptId: 'vendor-api-ready', verifiedAt: '2026-09-11T13:00:00.000Z', expiresAt: '2026-09-12T00:00:00.000Z', evidenceRefs: ['evidence:vendor-api'],
};
await expectReject(
  () => sync.record({ tenantId, userId, universeId, authorizationGrantId: 'grant-sync', explicitUserAuthorization: true, classification: 'INTERNAL', adapter: apiReadyVendor, success: true, latencyMs: 30, evidenceRefs: ['evidence:vendor-sync'], attemptedAt: now.toISOString() }),
  /verified adapter required/,
);
const verifiedVendor = { ...apiReadyVendor, vendorStatus: 'VERIFIED_PARTNER' as const, verificationReceiptId: 'vendor-partner' };
await sync.record({ tenantId, userId, universeId, authorizationGrantId: 'grant-sync', explicitUserAuthorization: true, classification: 'CONFIDENTIAL', adapter: verifiedVendor, success: true, latencyMs: 35, evidenceRefs: ['evidence:vendor-sync'], attemptedAt: now.toISOString() });
await expectReject(
  () => sync.record({ tenantId, userId, universeId, authorizationGrantId: 'grant-sync', explicitUserAuthorization: true, classification: 'TOP_SECRET', adapter: verifiedVendor, success: true, latencyMs: 35, evidenceRefs: ['evidence:secret-sync'], attemptedAt: now.toISOString() }),
  /TOP_SECRET/,
);
const revokedDevice = { ...verifiedDevice, revokedAt: '2026-09-11T14:00:00.000Z' };
await expectReject(
  () => sync.record({ tenantId, userId, universeId, authorizationGrantId: 'grant-sync', explicitUserAuthorization: true, classification: 'INTERNAL', adapter: revokedDevice, success: true, latencyMs: 20, evidenceRefs: ['evidence:revoked-sync'], attemptedAt: now.toISOString() }),
  /expired or revoked/,
);
const summary = await sync.summarize();
assert.equal(summary.totalAttempts, 3);
assert.equal(summary.byPlatform[0].attempts, 2);
assert.equal(summary.byPlatform[0].successes, 1);
assert.equal(summary.byPlatform[0].p50LatencyMs, 20);
assert.equal(summary.byPlatform[0].p95LatencyMs, 90);
assert.equal(summary.byVendor[0].attempts, 1);
assert.equal(summary.universalDeviceSupportClaim, false);
assert.equal(summary.partnershipClaimInferred, false);
assert.equal(summary.expiredOrRevokedRejected, 1);

assert.throws(() => new RetrievalAccessJournal(root, '../other', userId), /invalid tenant id/);

const syncRaw = await fs.readFile(sync.filePath, 'utf8');
await fs.writeFile(sync.filePath, syncRaw.replace('"latencyMs":20', '"latencyMs":21'), 'utf8');
await expectReject(() => sync.load(), /integrity failure/);

console.log('12D-73 authorized retrieval/learning journal/privacy sync contracts: OK');
