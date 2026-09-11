import assert from 'node:assert/strict';
import { promises as fs } from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import {
  ContentFreeUsageLedger74,
  CpuFirstBrainExecutionGate74,
  CpuFirstBrainRetrievalGateway74,
  GROUNDING_INVARIANTS_12D74,
  StrategicEvaluationCouncil74,
} from './cpu-first-brain-retrieval-api-studio-revocation-watch';

const now = new Date('2026-09-11T15:00:00.000Z');
const root = await fs.mkdtemp(path.join(os.tmpdir(), 'xiv-12d74-'));

let gpuVerified = false;
const planner = {
  plan(request: any) {
    if (request.requestedBackend === 'GPU') {
      return {
        tenantId: request.tenantId,
        workloadId: request.workloadId,
        selectedBackend: gpuVerified ? 'GPU' : 'CPU',
        status: gpuVerified ? 'VERIFIED' : 'UNVERIFIED',
        reasons: [gpuVerified ? 'verified gpu receipt' : 'gpu receipt incomplete'],
        evidenceRefs: gpuVerified ? ['gpu-hardware', 'gpu-runtime', 'gpu-benchmark'] : request.evidenceRefs,
        accelerationVerified: gpuVerified,
        claims: { cpuBaseline: true, cpuRuntimeVerified: false, gpuRunning: gpuVerified, ollamaRunning: false, physicalDeviceRunning: false },
      };
    }
    return {
      tenantId: request.tenantId,
      workloadId: request.workloadId,
      selectedBackend: 'CPU',
      status: 'VERIFIED',
      reasons: ['verified cpu receipt'],
      evidenceRefs: ['cpu-runtime-receipt'],
      accelerationVerified: false,
      claims: { cpuBaseline: true, cpuRuntimeVerified: true, gpuRunning: false, ollamaRunning: false, physicalDeviceRunning: false },
    };
  },
};
const executionGate = new CpuFirstBrainExecutionGate74(planner);
const gpuFallback = executionGate.select({ tenantId: 'tenant1', workloadId: 'w1', requestedBackend: 'GPU', classification: 'CONFIDENTIAL', estimatedMemoryMb: 512, evidenceRefs: ['workload'] }, now.getTime());
assert.equal(gpuFallback.selectedBackend, 'CPU');
assert.equal(gpuFallback.status, 'VERIFIED');
assert.equal(gpuFallback.claims.gpuRunning, false);
gpuVerified = true;
const gpuPlan = executionGate.select({ tenantId: 'tenant1', workloadId: 'w2', requestedBackend: 'GPU', classification: 'CONFIDENTIAL', estimatedMemoryMb: 512, evidenceRefs: ['workload'] }, now.getTime());
assert.equal(gpuPlan.selectedBackend, 'GPU');
assert.equal(gpuPlan.accelerationVerified, true);
gpuVerified = false;

let vendorStatus: 'API_READY' | 'VERIFIED_PARTNER' = 'API_READY';
const definitions = new Map<string, any>([
  ['tenant1:local-rag', { apiId: 'local-rag', tenantId: 'tenant1', exposure: 'LOCAL_LOOPBACK', dataClass: 'GENERAL', maxClassification: 'TOP_SECRET', requiredScopes: ['memory.read'], enabled: true }],
  ['tenant1:hybrid-vendor', { apiId: 'hybrid-vendor', tenantId: 'tenant1', exposure: 'HYBRID_OUTBOUND', connectorId: 'vendor-x', dataClass: 'GENERAL', maxClassification: 'RESTRICTED', requiredScopes: ['memory.read', 'vendor.read'], enabled: true }],
  ['tenant1:health-private', { apiId: 'health-private', tenantId: 'tenant1', exposure: 'PRIVATE_NETWORK', connectorId: 'health-target', dataClass: 'HEALTH', maxClassification: 'RESTRICTED', requiredScopes: ['memory.read', 'health.read'], enabled: true }],
]);
const classificationRank: Record<string, number> = { PUBLIC: 0, INTERNAL: 1, CONFIDENTIAL: 2, RESTRICTED: 3, TOP_SECRET: 4 };
const apiStudio = {
  get(tenantId: string, apiId: string) { return definitions.get(`${tenantId}:${apiId}`); },
  decide(request: any) {
    const definition = definitions.get(`${request.tenantId}:${request.apiId}`);
    const reasons: string[] = [];
    if (!definition?.enabled) reasons.push('missing or disabled');
    if (definition && !definition.requiredScopes.every((scope: string) => request.scopes.includes(scope))) reasons.push('minimum scopes missing');
    if (definition && classificationRank[request.classification] > classificationRank[definition.maxClassification]) reasons.push('classification exceeds maximum');
    if (definition?.exposure === 'HYBRID_OUTBOUND' && vendorStatus !== 'VERIFIED_PARTNER') reasons.push('VERIFIED_PARTNER evidence required');
    if (request.classification === 'TOP_SECRET' && definition?.exposure !== 'LOCAL_LOOPBACK') reasons.push('TOP_SECRET external routing denied');
    if (definition?.dataClass !== 'GENERAL' && (!request.consentReceipt || !request.legalPolicyReceipt)) reasons.push('consent/legal policy receipts required');
    return {
      allowed: reasons.length === 0,
      reasons: reasons.length ? reasons : ['governed API decision allowed'],
      exposure: definition?.exposure ?? 'LOCAL_LOOPBACK',
      requiredScopes: definition?.requiredScopes ?? [],
      externalRoutingAllowed: reasons.length === 0 && definition?.exposure === 'HYBRID_OUTBOUND',
      secretRenderingAllowed: false,
      embeddingAllowed: request.classification !== 'TOP_SECRET',
      clientRenderingAllowed: request.classification !== 'TOP_SECRET',
    };
  },
};

let retrievalRevoked = false;
let authorizationReads = 0;
const retrieval = {
  async authorizeRead(input: any) {
    if (retrievalRevoked) throw new Error('retrieval session inactive');
    authorizationReads += 1;
    if (input.classification === 'TOP_SECRET') assert.equal(input.route, 'LOCAL_RESTRICTED');
    return { receiptId: `retrieval-${authorizationReads}`, sessionId: input.sessionId, authorized: true as const, evidenceRefs: ['retrieval-evidence'], observedAt: (input.now ?? now).toISOString() };
  },
  invalidateByGrant() { retrievalRevoked = true; return 1; },
  invalidateByConsent() { retrievalRevoked = true; return 1; },
  invalidateByPolicy() { retrievalRevoked = true; return 1; },
};

const credentialBroker = {
  async attest(reference: any) {
    return {
      attestationId: 'credential-attestation-1', tenantId: reference.tenantId, secretId: reference.secretId, intendedApiId: reference.intendedApiId,
      scopes: reference.requiredScopes, current: true, expiresAt: '2026-09-12T00:00:00.000Z', auditReceiptId: 'vault-audit-1', evidenceRefs: ['vault-evidence'],
      secretValueRendered: false as const, secretValueLogged: false as const, ordinaryEmbeddingEligible: false as const, clientRenderingAllowed: false as const,
    };
  },
};

const usage = new ContentFreeUsageLedger74(root, 'tenant1');
const gateway = new CpuFirstBrainRetrievalGateway74(apiStudio, retrieval, executionGate, usage, credentialBroker);
const localSession = gateway.openSession({
  tenantId: 'tenant1', userId: 'user1', universeId: 'universe1', agentId: 'research-agent', apiId: 'local-rag', retrievalSessionId: 'retrieval-session-1',
  memoryNamespace: 'research.memory', grantId: 'grant-1', scopes: ['memory.read'], jurisdiction: 'US-TX', evidenceRefs: ['session-evidence'], ttlMs: 60_000, now,
});
await gateway.recordView(localSession.sessionId, 'brain.dashboard', ['view-receipt'], now);
const localResult = await gateway.invoke({
  apiSessionId: localSession.sessionId, classification: 'CONFIDENTIAL', dataClass: 'GENERAL', query: 'private query must not enter analytics', retrievalScope: 'memory.read',
  candidateCount: 8, hitCount: 3, requestedBackend: 'GPU', estimatedMemoryMb: 512, evidenceRefs: ['invoke-evidence'], now,
});
assert.equal(localResult.allowed, true);
assert.equal(localResult.execution.selectedBackend, 'CPU');
assert.equal(localResult.handling.rawQueryLogged, false);
assert.equal(localResult.authority.canMoveMoney, false);

const topSecretResult = await gateway.invoke({
  apiSessionId: localSession.sessionId, classification: 'TOP_SECRET', dataClass: 'GENERAL', query: 'restricted local query', retrievalScope: 'memory.read',
  candidateCount: 2, hitCount: 1, estimatedMemoryMb: 256, evidenceRefs: ['top-secret-evidence'], now,
});
assert.equal(topSecretResult.allowed, true);
assert.equal(topSecretResult.route, 'LOCAL_RESTRICTED');

const usageView = await usage.materialize();
assert.equal(usageView.views, 1);
assert.equal(usageView.uniqueUsers, 1);
assert.equal(usageView.sessions, 1);
assert.equal(usageView.featureUsage['api:local-rag'], 2);
const usageRaw = await fs.readFile(usage.filePath, 'utf8');
assert.equal(usageRaw.includes('private query must not enter analytics'), false);
assert.equal(usageRaw.includes('restricted local query'), false);

const hybridSession = gateway.openSession({
  tenantId: 'tenant1', userId: 'user1', universeId: 'universe1', agentId: 'integration-agent', apiId: 'hybrid-vendor', retrievalSessionId: 'retrieval-session-2',
  memoryNamespace: 'integration.memory', grantId: 'grant-2', scopes: ['memory.read', 'vendor.read'], jurisdiction: 'US-TX', evidenceRefs: ['hybrid-session-evidence'], ttlMs: 60_000, now,
  credentialRef: { tenantId: 'tenant1', secretId: 'vendor-x-api-key', intendedApiId: 'hybrid-vendor', requiredScopes: ['memory.read', 'vendor.read'], evidenceRefs: ['vault-ref'] },
});
const apiReadyDenied = await gateway.invoke({
  apiSessionId: hybridSession.sessionId, classification: 'RESTRICTED', dataClass: 'GENERAL', query: 'hybrid target query', retrievalScope: 'memory.read',
  candidateCount: 4, hitCount: 2, estimatedMemoryMb: 256, evidenceRefs: ['hybrid-attempt'], now,
});
assert.equal(apiReadyDenied.allowed, false);
assert.match(apiReadyDenied.reasons.join(' '), /VERIFIED_PARTNER/);

vendorStatus = 'VERIFIED_PARTNER';
const hybridAllowed = await gateway.invoke({
  apiSessionId: hybridSession.sessionId, classification: 'RESTRICTED', dataClass: 'GENERAL', query: 'authorized hybrid query', retrievalScope: 'memory.read',
  candidateCount: 4, hitCount: 2, estimatedMemoryMb: 256, evidenceRefs: ['partner-receipt', 'user-authorization'], now,
});
assert.equal(hybridAllowed.allowed, true);
assert.equal(hybridAllowed.route, 'HYBRID');
assert.equal(hybridAllowed.credentialAttestationId, 'credential-attestation-1');

const hybridTopSecretDenied = await gateway.invoke({
  apiSessionId: hybridSession.sessionId, classification: 'TOP_SECRET', dataClass: 'GENERAL', query: 'never external', retrievalScope: 'memory.read',
  candidateCount: 1, hitCount: 0, estimatedMemoryMb: 256, evidenceRefs: ['top-secret-denial'], now,
});
assert.equal(hybridTopSecretDenied.allowed, false);
assert.equal(hybridTopSecretDenied.handling.topSecretExternalRoutingAllowed, false);

const healthSession = gateway.openSession({
  tenantId: 'tenant1', userId: 'user1', universeId: 'universe1', agentId: 'health-agent', apiId: 'health-private', retrievalSessionId: 'retrieval-session-3',
  memoryNamespace: 'health.memory', grantId: 'grant-health', consentReceiptId: 'consent-health', policyReceiptId: 'policy-health',
  scopes: ['memory.read', 'health.read'], jurisdiction: 'US-TX', evidenceRefs: ['health-session'], ttlMs: 60_000, now,
  credentialRef: { tenantId: 'tenant1', secretId: 'health-api-key', intendedApiId: 'health-private', requiredScopes: ['memory.read', 'health.read'], evidenceRefs: ['health-vault-ref'] },
});
const missingPolicyDenied = await gateway.invoke({
  apiSessionId: healthSession.sessionId, classification: 'RESTRICTED', dataClass: 'HEALTH', query: 'health query', retrievalScope: 'memory.read',
  candidateCount: 2, hitCount: 1, estimatedMemoryMb: 256, evidenceRefs: ['health-attempt'], now,
});
assert.equal(missingPolicyDenied.allowed, false);
assert.match(missingPolicyDenied.reasons.join(' '), /consent\/legal policy/);

const revocation = gateway.applyRevocation({ tenantId: 'tenant1', kind: 'GRANT', targetId: 'grant-1', reason: 'grant revoked by user', evidenceRefs: ['revocation-receipt'], observedAt: now.toISOString() });
assert.equal(revocation.apiSessionsInvalidated.includes(localSession.sessionId), true);
assert.equal(revocation.retrievalSessionsInvalidated, 1);
await assert.rejects(() => gateway.invoke({
  apiSessionId: localSession.sessionId, classification: 'CONFIDENTIAL', dataClass: 'GENERAL', query: 'after revoke', retrievalScope: 'memory.read',
  candidateCount: 1, hitCount: 0, estimatedMemoryMb: 128, evidenceRefs: ['post-revoke'], now,
}), /API session inactive/);

const council = new StrategicEvaluationCouncil74();
const task = council.assignTask({ tenantId: 'tenant1', title: 'Evaluate local retrieval quality', ownerRole: 'RAG_EVALUATOR', status: 'ACTIVE', evidenceRefs: ['task-evidence'] });
assert.equal(task.productionAuthority, false);
const meeting = council.recordMeeting({
  tenantId: 'tenant1', recurrence: 'DAILY', scheduledFor: '2026-09-11T16:00:00.000Z', nextScheduledFor: '2026-09-12T16:00:00.000Z',
  participantRoles: ['RAG_EVALUATOR', 'PRIVACY_REVIEWER', 'OPS_OWNER'], taskIds: [task.taskId], minutesEvidenceRefs: ['minutes-receipt'],
  decisions: [{ summary: 'Keep CPU baseline until GPU benchmark receipts are current.', ownerRole: 'OPS_OWNER', productionImpact: false }],
  dissent: [{ role: 'RAG_EVALUATOR', statement: 'Re-test GPU after a fresh benchmark.', evidenceRefs: ['dissent-evidence'] }],
});
assert.equal(meeting.participantRoles.length, 3);
assert.equal(meeting.dissent.length, 1);
assert.equal(meeting.decisions[0].status, 'RECOMMENDATION_ONLY');
assert.equal(meeting.autonomousDeploymentAllowed, false);
assert.throws(() => council.recordMeeting({
  tenantId: 'tenant1', recurrence: 'DAILY', scheduledFor: '2026-09-11T16:00:00.000Z', nextScheduledFor: '2026-09-12T16:00:00.000Z',
  participantRoles: ['ONLY_ONE'], taskIds: [task.taskId], minutesEvidenceRefs: ['minutes'], decisions: [], dissent: [],
}), /2-8/);

assert.equal(GROUNDING_INVARIANTS_12D74.dimensionMeaning, 'semantic/computational dimensions');
assert.equal(GROUNDING_INVARIANTS_12D74.graphEdgesAreFacts, false);
assert.equal(GROUNDING_INVARIANTS_12D74.correlationIsCausation, false);
assert.equal(GROUNDING_INVARIANTS_12D74.autonomousCounterattackAllowed, false);
console.log('12D-74 CPU brain retrieval/API Studio/revocation contracts: OK');
