import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {
  IndustryVendorAdapterRegistry,
  SovereignBrainRuntimePlanner,
  TenantSecretVault,
  XIVApiStudioRegistry,
  createNeuralPathwayGrowthReceipt,
  type ConsentReceipt,
  type LegalPolicyReceipt,
  type VaultKeyMaterial,
} from './sovereign-brain-api-studio-vault';

const tenantId = 'tenant-alpha';
const now = new Date('2026-09-11T12:00:00.000Z');
const future = new Date('2026-09-12T12:00:00.000Z').toISOString();
const evidence = ['receipt:evidence-1'];

async function main(): Promise<void> {
  const planner = new SovereignBrainRuntimePlanner([]);
  const noGpu = planner.plan({
    tenantId,
    workloadId: 'brain-job-1',
    requestedBackend: 'GPU',
    classification: 'CONFIDENTIAL',
    estimatedMemoryMb: 2048,
    evidenceRefs: evidence,
  }, now.getTime());
  assert.equal(noGpu.selectedBackend, 'CPU');
  assert.equal(noGpu.accelerationVerified, false);
  assert.equal(noGpu.claims.gpuRunning, false);

  const verifiedPlanner = new SovereignBrainRuntimePlanner([{
    receiptId: 'gpu-r1',
    tenantId,
    backend: 'GPU',
    observedAt: '2026-09-11T11:00:00.000Z',
    expiresAt: future,
    hardwareVerified: true,
    runtimeVerified: true,
    benchmarkVerified: true,
    evidenceRefs: ['probe:gpu-hw', 'probe:gpu-runtime', 'benchmark:gpu-1'],
  }]);
  const gpu = verifiedPlanner.plan({
    tenantId,
    workloadId: 'brain-job-2',
    requestedBackend: 'GPU',
    classification: 'CONFIDENTIAL',
    estimatedMemoryMb: 2048,
    evidenceRefs: evidence,
  }, now.getTime());
  assert.equal(gpu.selectedBackend, 'GPU');
  assert.equal(gpu.status, 'VERIFIED');
  assert.equal(gpu.claims.gpuRunning, true);
  assert.equal(gpu.claims.ollamaRunning, false);

  const vendors = new IndustryVendorAdapterRegistry();
  vendors.upsert({
    adapterId: 'example-health',
    tenantId,
    providerName: 'Example Health Target',
    industry: 'healthcare',
    status: 'API_READY',
    supportedDataClasses: ['HEALTH'],
    supportedScopes: ['records:read'],
    jurisdictions: ['US-TX'],
    evidenceRefs: ['api-docs:example-health'],
  });
  assert.equal(vendors.isVerifiedPartner(tenantId, 'example-health', now.getTime()), false);

  const studio = new XIVApiStudioRegistry(vendors);
  studio.register({
    apiId: 'health-summary',
    tenantId,
    name: 'Private health summary',
    exposure: 'HYBRID_OUTBOUND',
    method: 'POST',
    route: '/v1/health/summary',
    connectorId: 'example-health',
    dataClass: 'HEALTH',
    maxClassification: 'RESTRICTED',
    requiredScopes: ['records:read'],
    allowedJurisdictions: ['US-TX'],
    enabled: true,
    evidenceRefs: ['api-definition:health-summary'],
  });

  const consent: ConsentReceipt = {
    receiptId: 'consent-1',
    tenantId,
    subjectId: 'user-1',
    connectorId: 'example-health',
    dataClass: 'HEALTH',
    scopes: ['records:read'],
    jurisdiction: 'US-TX',
    authorizedAt: '2026-09-11T10:00:00.000Z',
    expiresAt: future,
    externalRoutingAllowed: true,
    evidenceRefs: ['consent:signature-1'],
  };
  const policy: LegalPolicyReceipt = {
    receiptId: 'policy-1',
    tenantId,
    connectorId: 'example-health',
    dataClass: 'HEALTH',
    jurisdiction: 'US-TX',
    reviewedAt: '2026-09-11T10:30:00.000Z',
    expiresAt: future,
    approvedScopes: ['records:read'],
    externalRoutingAllowed: true,
    evidenceRefs: ['legal-review:1'],
  };

  const targetBlocked = studio.decide({
    tenantId,
    apiId: 'health-summary',
    subjectId: 'user-1',
    scopes: ['records:read'],
    jurisdiction: 'US-TX',
    classification: 'RESTRICTED',
    dataClass: 'HEALTH',
    consentReceipt: consent,
    legalPolicyReceipt: policy,
  }, now.getTime());
  assert.equal(targetBlocked.allowed, false);
  assert.match(targetBlocked.reasons.join(' '), /VERIFIED_PARTNER/);

  vendors.upsert({
    adapterId: 'example-health',
    tenantId,
    providerName: 'Example Health Target',
    industry: 'healthcare',
    status: 'VERIFIED_PARTNER',
    supportedDataClasses: ['HEALTH'],
    supportedScopes: ['records:read'],
    jurisdictions: ['US-TX'],
    verifiedAt: '2026-09-11T11:30:00.000Z',
    expiresAt: future,
    evidenceRefs: ['agreement:partner-123', 'api-test:partner-123'],
  });
  const partnerAllowed = studio.decide({
    tenantId,
    apiId: 'health-summary',
    subjectId: 'user-1',
    scopes: ['records:read'],
    jurisdiction: 'US-TX',
    classification: 'RESTRICTED',
    dataClass: 'HEALTH',
    consentReceipt: consent,
    legalPolicyReceipt: policy,
  }, now.getTime());
  assert.equal(partnerAllowed.allowed, true);
  assert.equal(partnerAllowed.externalRoutingAllowed, true);
  assert.equal(partnerAllowed.secretRenderingAllowed, false);

  studio.register({
    apiId: 'top-secret-local',
    tenantId,
    name: 'Local restricted API',
    exposure: 'LOCAL_LOOPBACK',
    method: 'POST',
    route: '/v1/private/local',
    dataClass: 'GENERAL',
    maxClassification: 'TOP_SECRET',
    requiredScopes: ['private:read'],
    allowedJurisdictions: [],
    enabled: true,
    evidenceRefs: ['api-definition:local'],
  });
  const topSecretLocal = studio.decide({
    tenantId,
    apiId: 'top-secret-local',
    subjectId: 'user-1',
    scopes: ['private:read'],
    jurisdiction: 'US-TX',
    classification: 'TOP_SECRET',
    dataClass: 'GENERAL',
  }, now.getTime());
  assert.equal(topSecretLocal.allowed, true);
  assert.equal(topSecretLocal.externalRoutingAllowed, false);
  assert.equal(topSecretLocal.embeddingAllowed, false);
  assert.equal(topSecretLocal.clientRenderingAllowed, false);

  const tempRoot = await mkdtemp(path.join(os.tmpdir(), 'xiv-12d70-'));
  try {
    const key: VaultKeyMaterial = {
      tenantId,
      keyId: 'vault-key-1',
      keyVersion: 1,
      key: Buffer.alloc(32, 7),
      evidenceRefs: ['key-ceremony:1'],
    };
    const vault = new TenantSecretVault(tempRoot, tenantId, { resolve: () => key });
    const ceo = {
      tenantId,
      actorId: 'ceo-1',
      role: 'CEO' as const,
      scopes: ['secrets:finance'],
      evidenceRefs: ['auth:ceo-session'],
    };
    const put = await vault.putSecret(ceo, {
      secretId: 'finance-api-key',
      name: 'Finance connector credential',
      value: 'never-log-this-secret',
      classification: 'TOP_SECRET',
      scopes: ['secrets:finance'],
      evidenceRefs: ['secret-import:1'],
    });
    assert.equal(put.metadata.valueRendered, false);
    const metadata = await vault.listMetadata(ceo);
    assert.equal(metadata.secrets.length, 1);
    assert.equal(JSON.stringify(metadata.secrets).includes('never-log-this-secret'), false);

    const secret = await vault.readSecret(ceo, 'finance-api-key');
    assert.equal(secret.value, 'never-log-this-secret');
    assert.equal(secret.handling.noEmbedding, true);
    assert.equal(secret.handling.noClientRendering, true);

    const delegate = {
      tenantId,
      actorId: 'delegate-1',
      role: 'DELEGATE' as const,
      scopes: ['secrets:other'],
      evidenceRefs: ['auth:delegate-session'],
      grant: {
        grantId: 'grant-1',
        tenantId,
        delegateId: 'delegate-1',
        scopes: ['secrets:other'],
        issuedBy: 'ceo-1',
        issuedAt: '2026-09-11T10:00:00.000Z',
        expiresAt: future,
        evidenceRefs: ['approval:delegate-grant'],
      },
    };
    await assert.rejects(() => vault.readSecret(delegate, 'finance-api-key'), /minimum scopes/);

    const stored = await readFile(path.join(tempRoot, tenantId, 'secrets', 'finance-api-key.xivsecret.json'), 'utf8');
    assert.equal(stored.includes('never-log-this-secret'), false);
    const audit = await readFile(path.join(tempRoot, tenantId, 'vault-audit.xivjsonl'), 'utf8');
    assert.equal(audit.includes('never-log-this-secret'), false);
  } finally {
    await rm(tempRoot, { recursive: true, force: true });
  }

  const pathway = createNeuralPathwayGrowthReceipt({
    pathwayId: 'path-1',
    tenantId,
    sourceNode: 'retrieval-evidence',
    targetNode: 'agent-policy-memory',
    capabilityVersion: '1.0.0',
    evidenceRefs: ['eval:rag-1', 'citation:source-1'],
    evaluationScore: 0.94,
    promoted: false,
    humanApprovalRequired: true,
    dataDna: {
      configurationVersion: 'cfg-7',
      capabilityVersion: '1.0.0',
      provenanceRefs: ['source:document-1'],
    },
  });
  assert.equal(pathway.semantics.graphEdgeIsFact, false);
  assert.equal(pathway.semantics.correlationIsCausation, false);
  assert.equal(pathway.semantics.consciousnessClaim, false);

  console.log('12D-70 CPU brain/API Studio/tenant vault contracts: OK');
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
