import { strict as assert } from 'node:assert';
import {
  authorizeApiStudioRoute,
  chooseComputePlan,
  evaluateLearningCandidate,
  sharedLearningAllowed,
  summarizeUsage,
  validateAgentTeam,
  validateVaultAccess,
} from './sovereign-learning-api-studio-evidence-runtime';

const now = '2026-09-11T17:00:00.000Z';
const future = '2026-09-12T17:00:00.000Z';

const cpuOnly = chooseComputePlan('brain-1', 'GPU', {
  cpuRuntime: { receiptRef: 'cpu-runtime-1', subjectId: 'brain-1', observedAt: now, expiresAt: future },
}, now);
assert.equal(cpuOnly.backend, 'CPU');
assert.equal(cpuOnly.cpuVerified, true);
assert.equal(cpuOnly.gpuEligible, false);
assert.equal(cpuOnly.gpuExecutionVerified, false);

const gpuEligible = chooseComputePlan('brain-1', 'GPU', {
  cpuRuntime: { receiptRef: 'cpu-runtime-1', subjectId: 'brain-1', observedAt: now, expiresAt: future },
  gpuHardware: { receiptRef: 'gpu-hw-1', subjectId: 'brain-1', observedAt: now, expiresAt: future },
  gpuRuntime: { receiptRef: 'gpu-runtime-1', subjectId: 'brain-1', observedAt: now, expiresAt: future },
  gpuBenchmark: { receiptRef: 'gpu-bench-1', subjectId: 'brain-1', observedAt: now, expiresAt: future },
}, now);
assert.equal(gpuEligible.backend, 'GPU');
assert.equal(gpuEligible.gpuEligible, true);
assert.equal(gpuEligible.gpuExecutionVerified, false);

const auth = {
  authorizationRef: 'auth-1', tenantId: 'tenant-1', userId: 'user-1', explicitUserAuthorization: true,
  scopes: ['read:private-rag'], dataClasses: ['HEALTH' as const], jurisdiction: 'US-TX',
  jurisdictionPolicyRef: 'policy-tx-1', legalReviewRef: 'legal-1', externalRoutingAllowed: true,
  observedAt: now, expiresAt: future,
};
const apiReadyVendor = { vendorId: 'hospital-platform', state: 'API_READY' as const, apiReceiptRef: 'api-1' };
const hybridRoute = {
  routeId: 'route-1', tenantId: 'tenant-1', plane: 'HYBRID' as const, classification: 'CONFIDENTIAL' as const,
  dataClass: 'HEALTH' as const, requiredScopes: ['read:private-rag'], jurisdiction: 'US-TX', vendorId: 'hospital-platform',
};
assert.equal(authorizeApiStudioRoute(hybridRoute, auth, apiReadyVendor, now).allowed, false);

const verifiedVendor = {
  vendorId: 'hospital-platform', state: 'VERIFIED_PARTNER' as const, apiReceiptRef: 'api-1',
  agreementReceiptRef: 'agreement-1', verificationReceiptRef: 'verify-1', expiresAt: future,
};
const hybridDecision = authorizeApiStudioRoute(hybridRoute, auth, verifiedVendor, now);
assert.equal(hybridDecision.allowed, true);
assert.equal(hybridDecision.externalRoute, true);
assert.equal(hybridDecision.financialAuthority.canMoveMoney, false);
assert.equal(hybridDecision.financialAuthority.canOpenAccounts, false);
assert.equal(hybridDecision.financialAuthority.canSignContracts, false);

const topSecret = authorizeApiStudioRoute({ ...hybridRoute, classification: 'TOP_SECRET' }, auth, verifiedVendor, now);
assert.equal(topSecret.allowed, false);
assert.equal(topSecret.reason, 'TOP_SECRET_LOCAL_ONLY');

assert.equal(validateVaultAccess({
  tenantId: 'tenant-1', secretId: 'secret-1', actorId: 'delegate-1', accessMode: 'DELEGATED',
  delegatedScopes: ['api:read'], requestedScopes: ['api:read'], auditReceiptRef: 'vault-audit-1', expiresAt: future,
}, now), true);
assert.equal(validateVaultAccess({
  tenantId: 'tenant-1', secretId: 'secret-1', actorId: 'delegate-1', accessMode: 'DELEGATED',
  delegatedScopes: ['api:read'], requestedScopes: ['api:write'], auditReceiptRef: 'vault-audit-1', expiresAt: future,
}, now), false);

assert.equal(validateAgentTeam([
  { agentId: 'researcher', role: 'Research', memoryNamespace: 'm/research', goals: ['ground facts'], policies: ['cite evidence'], consciousnessClaim: false, freeWillClaim: false, independentLegalAuthority: false },
  { agentId: 'reviewer', role: 'Reviewer', memoryNamespace: 'm/review', goals: ['test claims'], policies: ['preserve dissent'], consciousnessClaim: false, freeWillClaim: false, independentLegalAuthority: false },
]), true);

const promoted = evaluateLearningCandidate({
  candidateId: 'learn-1', tenantId: 'tenant-1', agentId: 'researcher', memoryNamespace: 'm/research',
  classification: 'CONFIDENTIAL', dataClass: 'HEALTH', sourceRefs: ['src-1'], evaluationRefs: ['eval-1'],
  evaluationScore: 0.94, authorizationRef: 'auth-1', privacyReviewRef: 'privacy-1', securityReviewRef: 'security-1',
  modelWeightMutationRequested: false,
});
assert.equal(promoted.decision, 'PROMOTE_PRIVATE_MEMORY');
assert.equal(promoted.modelWeightsMutated, false);
assert.equal(promoted.graphEdgeIsFact, false);
assert.equal(promoted.correlationIsCausation, false);

const rejectedTopSecretWeights = evaluateLearningCandidate({
  candidateId: 'learn-2', tenantId: 'tenant-1', agentId: 'reviewer', memoryNamespace: 'm/review',
  classification: 'TOP_SECRET', dataClass: 'GENERAL', sourceRefs: ['src-2'], evaluationRefs: ['eval-2'],
  evaluationScore: 1, privacyReviewRef: 'privacy-2', securityReviewRef: 'security-2', modelWeightMutationRequested: true,
});
assert.equal(rejectedTopSecretWeights.decision, 'REJECT');
assert.equal(rejectedTopSecretWeights.ordinaryEmbeddingEligible, false);

assert.equal(sharedLearningAllowed({
  signalId: 'signal-1', cohortSize: 12, minimized: true, anonymized: true, aggregated: true,
  containsRawPrivateRecords: false, containsDirectIdentifiers: false, classification: 'INTERNAL',
  policyReceiptRef: 'share-policy-1', evidenceRefs: ['agg-evidence-1'],
}), true);
assert.equal(sharedLearningAllowed({
  signalId: 'signal-2', cohortSize: 12, minimized: true, anonymized: true, aggregated: true,
  containsRawPrivateRecords: false, containsDirectIdentifiers: false, classification: 'TOP_SECRET',
  policyReceiptRef: 'share-policy-1', evidenceRefs: ['agg-evidence-2'],
}), false);

const usage = summarizeUsage([
  { tenantId: 'tenant-1', pseudonymousUserId: 'u1', sessionId: 's1', feature: 'api-studio', surface: 'studio', kind: 'VIEW', evidenceRef: 'ev1' },
  { tenantId: 'tenant-1', pseudonymousUserId: 'u1', sessionId: 's1', feature: 'private-rag', surface: 'brain', kind: 'FEATURE_USE', evidenceRef: 'ev2' },
  { tenantId: 'tenant-1', pseudonymousUserId: 'u2', sessionId: 's2', feature: 'private-rag', surface: 'brain', kind: 'FEATURE_USE', evidenceRef: 'ev3' },
]);
assert.deepEqual({ views: usage.views, uniqueUsers: usage.uniqueUsers, sessions: usage.sessions, featureUses: usage.featureUses, contentLogged: usage.contentLogged }, {
  views: 1, uniqueUsers: 2, sessions: 2, featureUses: 2, contentLogged: false,
});

console.log('12D-84 sovereign learning/API Studio evidence runtime contracts: OK');
