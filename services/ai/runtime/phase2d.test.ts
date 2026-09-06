/**
 * Phase 2D cases. Run with: npx tsx runtime/phase2d.test.ts
 */
import assert from 'node:assert/strict';

import { createMemoryAuditStore } from './audit';
import { boundedAutonomyEnabled } from './authority';
import { buildExecutiveBrief } from './brief';
import { createCompanyDataGateway } from './company-data';
import { createHttpHealthAdapter } from './context/adapters/http-health';
import { createLiveContextProvider } from './context/adapters/live-provider';
import { readAuthorizedCompanyData } from './context/adapters/authorized-read';
import { adapterIsReadOnly, provenanceIsComplete } from './context/adapters/types';
import { consumerCanReadContent } from './content/policy';
import * as trusted from './guardian/trusted';
import { canConsumerReadMedia } from './media/policy';
import { validateMediaAsset } from './media/validation';
import type { MediaAsset } from './media/types';
import { evaluatePolicy } from './policy';
import { publishingWritesEnabled } from './publishing/policy';
import { createAgentRuntime } from './runtime';
import { canAgentAccessClassification } from './security/classification';
import { authorizationHasCredentials, canReserveStorage, createAbstractStorageProvider, STORAGE_TIERS } from './storage';
import { canReadUniverseResource } from './universe/permissions';
import type { Universe, UniverseMembership, UniverseResource } from './universe/types';

function test(name: string, run: () => void | Promise<void>) {
  return Promise.resolve()
    .then(run)
    .then(() => {
      console.log(`ok - ${name}`);
    });
}

const universeA: Universe = {
  universeId: 'uni_a',
  organizationId: 'org_a',
  name: 'Universe A',
  status: 'active',
  createdAt: '2026-01-01T00:00:00.000Z',
  dataClassification: 'confidential',
  storageTier: 'business',
  regionPreference: 'eu-north',
  prototype: true,
};

const universeB: Universe = { ...universeA, universeId: 'uni_b', organizationId: 'org_b', name: 'Universe B' };

const memberA: UniverseMembership = {
  membershipId: 'mem_a',
  universeId: 'uni_a',
  organizationId: 'org_a',
  principalId: 'user_a',
  role: 'employee',
  status: 'active',
};

const privateResourceA: UniverseResource = {
  resourceId: 'res_a',
  universeId: 'uni_a',
  organizationId: 'org_a',
  ownerId: 'user_a',
  resourceType: 'document',
  visibility: 'private',
  classification: 'confidential',
  createdAt: '2026-01-01T00:00:00.000Z',
};

function media(partial: Partial<MediaAsset>): MediaAsset {
  return {
    mediaId: 'media_1',
    ownerId: 'user_a',
    universeId: 'uni_a',
    organizationId: 'org_a',
    mediaType: 'image',
    mimeType: 'image/jpeg',
    sizeBytes: 1024,
    checksum: 'abc123checksum',
    visibility: 'private',
    classification: 'internal',
    storageProvider: 'abstract',
    storageKeyReference: 'ref_images_1',
    encryptionReference: 'enc_ref_1',
    uploadStatus: 'pending',
    scanStatus: 'pending',
    processingStatus: 'pending',
    retentionClass: 'standard',
    createdAt: '2026-01-01T00:00:00.000Z',
    source: 'company',
    prototype: true,
    ...partial,
  };
}

await test('Universe A cannot read Universe B private resource', () => {
  const result = canReadUniverseResource({
    universe: universeB,
    membership: memberA,
    resource: privateResourceA,
  });
  assert.equal(result.allowed, false);
});

await test('unknown Universe is denied', () => {
  const result = canReadUniverseResource({
    resource: privateResourceA,
  });
  assert.match(result.reason, /Unknown Universe/i);
});

await test('missing ownership is denied', () => {
  const result = canReadUniverseResource({
    universe: universeA,
    membership: memberA,
    resource: { visibility: 'private' },
  });
  assert.match(result.reason, /Missing ownership/i);
});

await test('private company media is denied to consumer', () => {
  const result = canConsumerReadMedia(media({ visibility: 'private', source: 'company' }));
  assert.equal(result.allowed, false);
});

await test('public media may be read when policy allows', () => {
  const result = canConsumerReadMedia(media({ visibility: 'public', classification: 'public', source: 'company' }));
  assert.equal(result.allowed, true);
});

await test('unsupported MIME is denied', () => {
  const result = validateMediaAsset(media({ mimeType: 'application/x-msdownload' }));
  assert.equal(result.ok, false);
  assert.match(result.reason, /Executable|Unsupported MIME/i);
});

await test('oversized media is denied', () => {
  const result = validateMediaAsset(media({ sizeBytes: 80 * 1024 * 1024 }));
  assert.equal(result.ok, false);
  assert.match(result.reason, /Oversized/i);
});

await test('missing checksum is denied', () => {
  const result = validateMediaAsset(media({ checksum: '' }));
  assert.equal(result.ok, false);
  assert.match(result.reason, /checksum/i);
});

await test('missing Universe ownership is denied for private company media', () => {
  const result = validateMediaAsset(media({ universeId: '', organizationId: '', visibility: 'private', source: 'company' }));
  assert.equal(result.ok, false);
  assert.match(result.reason, /Universe/i);
});

await test('storage quota is enforced', () => {
  const denied = canReserveStorage(
    { usedBytes: STORAGE_TIERS.consumer.maxBytes - 100, objectCount: 1, namespace: 'images' },
    STORAGE_TIERS.consumer,
    10_000,
  );
  assert.equal(denied.allowed, false);
});

await test('storage credentials are never returned', () => {
  const storage = createAbstractStorageProvider(STORAGE_TIERS.consumer);
  const auth = storage.createUploadAuthorization({ namespace: 'images', sizeBytes: 1024, ownerId: 'user_a' });
  assert.equal(auth.credentialsReturned, false);
  assert.equal(authorizationHasCredentials(auth), false);
  assert.equal(authorizationHasCredentials(storage.getSignedDownload(auth.reference.referenceId)), false);
  assert.doesNotMatch(JSON.stringify(auth), /AKIA|secret|password|apiKey/i);
});

await test('real adapter is read-only', () => {
  const adapter = createHttpHealthAdapter({ healthUrl: '' });
  assert.equal(adapterIsReadOnly(adapter), true);
  assert.equal(adapter.getCapabilities().write, false);
  assert.equal('writeRecords' in adapter, false);
  assert.equal(publishingWritesEnabled(), false);
});

await test('provenance is required', () => {
  assert.equal(provenanceIsComplete(null), false);
  assert.equal(
    provenanceIsComplete({
      sourceId: 'xiv-ai-health',
      sourceSystem: 'xiv_ai_http',
      sourceType: 'connection_health',
      sourceRecordId: null,
      organizationId: null,
      universeId: null,
      retrievedAt: new Date().toISOString(),
      freshness: 'unknown',
      live: false,
      prototype: false,
      confidence: 'low',
    }),
    true,
  );
});

await test('live source failure does not silently fall back to prototype', async () => {
  const adapter = createHttpHealthAdapter({
    healthUrl: 'https://example.invalid',
    fetchImpl: async () => {
      throw new Error('offline');
    },
  });
  const dataset = await adapter.fetchMetrics();
  assert.equal(dataset.status === 'unavailable' || dataset.status === 'not_configured', true);
  assert.equal(dataset.records.length, 0);
  assert.equal(dataset.message, 'Live source unavailable');
  assert.equal(dataset.provenance.prototype, false);
  const provider = createLiveContextProvider({ status: dataset.status, provenance: dataset.provenance });
  const report = provider.getBusinessHealthReport();
  assert.equal(report.prototype, false);
  assert.equal(report.usedPrototypeFallback, false);
  assert.equal(report.findings.length, 0);
  assert.match(report.narrativeSummary, /Live source unavailable|STALE/);
});

await test('agent cannot bypass Company Data Gateway', async () => {
  const adapter = createHttpHealthAdapter({ healthUrl: '' });
  const direct = await adapter.fetchRecords();
  assert.ok(direct);
  const gated = await readAuthorizedCompanyData(
    {
      agentId: 'executive',
      organizationId: 'org_a',
      toolId: 'company_data_reader',
      capability: 'records',
      mode: 'read',
      classification: 'internal',
    },
    adapter,
  );
  assert.equal(gated.usedPrototypeFallback, false);
  const runtime = createAgentRuntime({ store: createMemoryAuditStore() });
  const viaTool = runtime.request({
    agentId: 'executive',
    toolId: 'company_data_reader',
    intent: 'Read company data',
  });
  assert.equal(viaTool.output?.adapterCalledDirectly, false);
  assert.equal(viaTool.output?.via, 'company_data_gateway_required');
});

await test('Guardian cannot read private business data', () => {
  assert.equal(canAgentAccessClassification('guardian', 'confidential'), false);
  const runtime = createAgentRuntime({ store: createMemoryAuditStore() });
  const result = runtime.request({
    agentId: 'guardian',
    toolId: 'company_data_reader',
    intent: 'Read confidential company data',
  });
  assert.equal(result.verdict, 'denied');
});

await test('Executive Agent read access still passes policy', () => {
  const decision = evaluatePolicy({
    agentId: 'executive',
    toolId: 'business_health_report',
  });
  assert.equal(decision.verdict, 'allowed');
  const briefDecision = evaluatePolicy({
    agentId: 'executive',
    toolId: 'executive_brief_builder',
  });
  assert.equal(briefDecision.verdict, 'allowed');
});

await test('production writes remain denied', () => {
  const decision = evaluatePolicy({
    agentId: 'executive',
    toolId: 'propose_operational_change',
    environment: 'production',
  });
  assert.equal(decision.verdict, 'denied');
});

await test('human approval does not override policy', () => {
  const decision = evaluatePolicy({
    agentId: 'executive',
    toolId: 'propose_operational_change',
    approved: true,
  });
  assert.equal(decision.verdict, 'denied');
});

await test('L4 remains disabled', () => {
  assert.equal(boundedAutonomyEnabled(), false);
});

await test('Guardian check-ID security remains intact', async () => {
  const denied = await trusted.runGuardianCheck('rm -rf /');
  assert.equal(denied.status, 'denied');
  const ok = await trusted.runGuardianCheck('runtime-health');
  assert.notEqual(ok.status, 'denied');
});

await test('raw shell remains impossible', () => {
  assert.equal('exec' in trusted, false);
  assert.equal(createCompanyDataGateway(createHttpHealthAdapter({ healthUrl: '' })) && true, true);
});

await test('consumer cannot auto-read private company content', () => {
  const result = consumerCanReadContent({
    contentId: 'c1',
    authorId: 'exec_1',
    universeId: 'uni_a',
    organizationId: 'org_a',
    contentType: 'post',
    visibility: 'private',
    classification: 'internal',
    mediaReferences: [],
    createdAt: '2026-01-01T00:00:00.000Z',
    source: 'company',
    moderationStatus: 'approved',
  });
  assert.equal(result.allowed, false);
});

await test('write mode is denied by Company Data Gateway', async () => {
  const gateway = createCompanyDataGateway(createHttpHealthAdapter({ healthUrl: '' }));
  const result = await gateway.read({
    agentId: 'executive',
    organizationId: 'org_a',
    toolId: 'company_data_reader',
    capability: 'metrics',
    mode: 'write',
  });
  assert.equal(result.allowed, false);
  assert.match(result.reason, /read-only/i);
});

await test('Executive brief does not invent dollar impact', () => {
  const brief = buildExecutiveBrief({
    liveStatus: 'unavailable',
    provenance: null,
  });
  assert.equal(brief.financialImpactClaimed, false);
  assert.equal(brief.dataStatus, 'unavailable');
});

console.log('All Phase 2D cases passed.');
