/**
 * Phase 2E cases. Run with: npx tsx runtime/phase2e.test.ts
 */
import assert from 'node:assert/strict';

import { createMemoryAuditStore } from './audit';
import { recordAccessEvent, sanitizeAuditText, stripSignedUrlSecrets } from './audit-access';
import { boundedAutonomyEnabled } from './authority';
import { createCompanyDataGateway } from './company-data';
import { classifyFreshness } from './context/adapters/freshness';
import { createHttpHealthAdapter } from './context/adapters/http-health';
import { createLiveContextProvider } from './context/adapters/live-provider';
import { createSessionRecordAdapter } from './context/adapters/session-records';
import { provenanceIsComplete } from './context/adapters/types';
import { readAuthorizedCompanyData } from './context/adapters/authorized-read';
import * as trusted from './guardian/trusted';
import {
  authorizationExpired,
  canConsumerReadMedia,
  canReadMedia,
  checkMediaQuota,
  createSignedUploadGrant,
  createUnavailableScanner,
  mediaIsTrusted,
  prepareSelectedMedia,
  privateMediaPublicUrl,
  quarantineMedia,
  signedDownloadFor,
  validateMediaAsset,
} from './media';
import type { MediaAsset } from './media/types';
import { evaluatePolicy } from './policy';
import { publishingWritesEnabled } from './publishing/policy';
import { createAgentRuntime } from './runtime';
import { STORAGE_TIERS } from './storage';
import type { Universe, UniverseMembership } from './universe/types';

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

function media(partial: Partial<MediaAsset> = {}): MediaAsset {
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
    storageProvider: 'not_configured',
    storageKeyReference: '',
    encryptionReference: '',
    uploadStatus: 'quarantined',
    scanStatus: 'unavailable',
    processingStatus: 'pending',
    retentionClass: 'standard',
    createdAt: '2026-01-01T00:00:00.000Z',
    source: 'company',
    prototype: true,
    publicUrl: null,
    ...partial,
  };
}

await test('1 live dataset requires provenance', () => {
  assert.equal(
    provenanceIsComplete({
      sourceId: 'xiv-session-authorized',
      sourceSystem: 'supabase_owner_rls',
      sourceType: 'authorized_session',
      sourceRecordId: 'user_a',
      organizationId: null,
      universeId: null,
      ownerId: 'user_a',
      scope: 'personal',
      retrievedAt: new Date().toISOString(),
      freshness: 'fresh',
      live: true,
      prototype: false,
      confidence: 'medium',
      dataClassification: 'internal',
    }),
    true,
  );
  assert.equal(
    provenanceIsComplete({
      sourceId: 'xiv-session-authorized',
      sourceSystem: 'supabase_owner_rls',
      sourceType: 'authorized_session',
      sourceRecordId: null,
      organizationId: null,
      universeId: null,
      retrievedAt: new Date().toISOString(),
      freshness: 'fresh',
      live: true,
      prototype: false,
      confidence: 'medium',
    }),
    false,
  );
});

await test('2 live dataset missing Universe denied', async () => {
  const gateway = createCompanyDataGateway(
    createSessionRecordAdapter({
      reader: () => [
        {
          kind: 'profile_identity',
          ownerId: 'user_a',
          scope: 'organization',
          sourceRecordId: 'user_a',
          organizationId: 'org_a',
          universeId: null,
        },
      ],
    }),
  );
  const result = await gateway.read({
    agentId: 'operations',
    organizationId: 'org_a',
    toolId: 'company_data_reader',
    capability: 'records',
    mode: 'read',
    classification: 'internal',
    domain: 'operations',
  });
  assert.equal(result.allowed, false);
  assert.match(result.reason, /Universe|unavailable/i);
});

await test('3 source failure does not fall back to prototype', async () => {
  const adapter = createSessionRecordAdapter({
    reader: async () => {
      throw new Error('source down');
    },
  });
  const dataset = await adapter.fetchRecords();
  assert.equal(dataset.status, 'unavailable');
  assert.equal(dataset.records.length, 0);
  assert.equal(dataset.provenance.prototype, false);
  const provider = createLiveContextProvider({
    status: dataset.status,
    provenance: dataset.provenance,
    records: dataset.records,
    domains: adapter.getCapabilities().domains,
  });
  const report = provider.getBusinessHealthReport();
  assert.equal(report.prototype, false);
  assert.equal(report.usedPrototypeFallback, false);
  assert.equal(report.findings.length, 0);
  assert.match(report.narrativeSummary, /unavailable|STALE/i);
});

await test('4 stale data labeled stale', () => {
  const stale = classifyFreshness({
    retrievedAt: '2020-01-01T00:00:00.000Z',
    sourceUpdatedAt: '2020-01-01T00:00:00.000Z',
    now: Date.parse('2026-09-06T00:00:00.000Z'),
  });
  assert.equal(stale, 'stale');
  const provider = createLiveContextProvider({
    status: 'stale',
    provenance: {
      sourceId: 'xiv-session-authorized',
      sourceSystem: 'supabase_owner_rls',
      sourceType: 'authorized_session',
      sourceRecordId: '1',
      organizationId: 'org_a',
      universeId: 'uni_a',
      ownerId: 'user_a',
      scope: 'universe',
      retrievedAt: '2020-01-01T00:00:00.000Z',
      sourceUpdatedAt: '2020-01-01T00:00:00.000Z',
      freshness: 'stale',
      freshnessStatus: 'stale',
      live: true,
      prototype: false,
      confidence: 'medium',
      dataClassification: 'internal',
    },
    records: [],
    domains: {
      operations: false,
      inventory: false,
      supply_chain: false,
      warehouse: false,
      customer: false,
      finance: false,
      technology: true,
    },
  });
  assert.equal(provider.getBusinessHealthReport().dataStatus, 'stale');
  assert.match(provider.getBusinessHealthReport().narrativeSummary, /STALE/);
});

await test('5 unsupported domain unavailable', async () => {
  const result = await readAuthorizedCompanyData(
    {
      agentId: 'executive',
      organizationId: 'org_a',
      universeId: 'uni_a',
      toolId: 'company_data_reader',
      capability: 'records',
      mode: 'read',
      classification: 'internal',
      domain: 'finance',
    },
    createSessionRecordAdapter({ reader: () => [], ownerId: 'user_a' }),
  );
  assert.equal(result.allowed, false);
  assert.equal(result.unsupportedDomain, true);
});

await test('6 Executive Agent only reads allowed domains', async () => {
  const finance = await readAuthorizedCompanyData(
    {
      agentId: 'executive',
      organizationId: 'org_a',
      universeId: 'uni_a',
      ownerId: 'user_a',
      toolId: 'company_data_reader',
      capability: 'records',
      mode: 'read',
      classification: 'internal',
      domain: 'finance',
    },
    createSessionRecordAdapter({ reader: () => [], ownerId: 'user_a' }),
  );
  assert.equal(finance.allowed, false);
  const technology = await readAuthorizedCompanyData(
    {
      agentId: 'executive',
      ownerId: 'user_a',
      toolId: 'company_data_reader',
      capability: 'records',
      mode: 'read',
      classification: 'internal',
      domain: 'technology',
      scope: 'personal',
    },
    createSessionRecordAdapter({ reader: () => [], ownerId: 'user_a' }),
  );
  assert.equal(technology.allowed, true);
});

await test('7 Guardian denied confidential company context', async () => {
  const result = await readAuthorizedCompanyData(
    {
      agentId: 'guardian',
      organizationId: 'org_a',
      universeId: 'uni_a',
      toolId: 'company_data_reader',
      capability: 'records',
      mode: 'read',
      classification: 'confidential',
      domain: 'technology',
    },
    createSessionRecordAdapter({ reader: () => [] }),
  );
  assert.equal(result.allowed, false);
  const runtime = createAgentRuntime({ store: createMemoryAuditStore() });
  assert.equal(
    runtime.request({
      agentId: 'guardian',
      toolId: 'company_data_reader',
      intent: 'Read confidential company data',
    }).verdict,
    'denied',
  );
});

await test('8 agent cannot bypass Company Data Gateway', async () => {
  const runtime = createAgentRuntime({ store: createMemoryAuditStore() });
  const viaTool = runtime.request({
    agentId: 'executive',
    toolId: 'company_data_reader',
    intent: 'Read company data',
  });
  assert.equal(viaTool.output?.adapterCalledDirectly, false);
  assert.equal(viaTool.output?.via, 'company_data_gateway_required');
});

await test('9 production writes denied', () => {
  const decision = evaluatePolicy({
    agentId: 'executive',
    toolId: 'propose_operational_change',
    environment: 'production',
  });
  assert.equal(decision.verdict, 'denied');
  assert.equal(publishingWritesEnabled(), false);
});

await test('10 L4 remains disabled', () => {
  assert.equal(boundedAutonomyEnabled(), false);
});

await test('11 human approval does not override policy', () => {
  const decision = evaluatePolicy({
    agentId: 'executive',
    toolId: 'propose_operational_change',
    approved: true,
  });
  assert.equal(decision.verdict, 'denied');
});

await test('12 unsupported MIME denied', () => {
  assert.equal(validateMediaAsset(media({ mimeType: 'image/gif' })).ok, false);
});

await test('13 executable MIME denied', () => {
  assert.equal(validateMediaAsset(media({ mimeType: 'application/x-msdownload' })).ok, false);
});

await test('14 oversized image denied', () => {
  assert.equal(validateMediaAsset(media({ sizeBytes: 20 * 1024 * 1024 }), { tier: 'consumer' }).ok, false);
});

await test('15 oversized video denied', () => {
  assert.equal(
    validateMediaAsset(media({ mediaType: 'video', mimeType: 'video/mp4', sizeBytes: 80 * 1024 * 1024 }), {
      tier: 'consumer',
    }).ok,
    false,
  );
});

await test('16 missing checksum denied', () => {
  assert.equal(validateMediaAsset(media({ checksum: '' })).ok, false);
});

await test('17 quota exceeded denied', () => {
  const denied = checkMediaQuota(10_000, STORAGE_TIERS.consumer.maxBytes - 100, 'consumer');
  assert.equal(denied.allowed, false);
});

await test('18 private company media requires Universe', () => {
  const result = validateMediaAsset(media({ universeId: '', organizationId: '', visibility: 'private', source: 'company' }));
  assert.equal(result.ok, false);
  assert.match(result.reason, /Universe/i);
});

await test('19 cross-Universe media access denied', () => {
  const result = canReadMedia({
    asset: media(),
    universe: universeB,
    membership: memberA,
  });
  assert.equal(result.allowed, false);
});

await test('20 consumer cannot read restricted company media', () => {
  const result = canConsumerReadMedia(media({ visibility: 'private', classification: 'restricted', source: 'company' }));
  assert.equal(result.allowed, false);
});

await test('21 unscanned media is not marked safe', async () => {
  const scanned = await createUnavailableScanner().scan(media());
  assert.notEqual(scanned.status, 'safe');
  const draft = quarantineMedia(prepareSelectedMedia({ ...media(), localUri: 'file://x.jpg' }).draft);
  assert.equal(mediaIsTrusted(draft), false);
});

await test('22 scanner unavailable remains unavailable', async () => {
  const scanned = await createUnavailableScanner().scan(media());
  assert.equal(scanned.status, 'unavailable');
});

await test('23 private media does not expose permanent public URL', () => {
  const draft = { ...media({ visibility: 'private', publicUrl: 'https://cdn.example/forever' }), pipelineStatus: 'quarantined' as const };
  assert.equal(privateMediaPublicUrl(draft), null);
  assert.equal(signedDownloadFor('ref_1', 'private').permanentPublicUrl, null);
});

await test('24 cloud/storage credentials not returned', () => {
  const grant = createSignedUploadGrant({
    mediaId: 'media_1',
    ownerId: 'user_a',
    universeId: 'uni_a',
    organizationId: 'org_a',
    allowedMime: 'image/jpeg',
    maxBytes: 1024,
    visibility: 'private',
    classification: 'internal',
  });
  assert.equal(grant.credentialsReturned, false);
  assert.equal(grant.uploadEnabled, false);
  assert.doesNotMatch(JSON.stringify(grant), /AKIA|secret|password|apiKey/i);
});

await test('25 upload authorization expires', () => {
  assert.equal(authorizationExpired(new Date(Date.now() - 1000).toISOString()), true);
  assert.equal(authorizationExpired(new Date(Date.now() + 60_000).toISOString()), false);
});

await test('26 media audit strips secrets', () => {
  const dirty = 'https://s3.example/obj?X-Amz-Signature=abc&token=secret-value';
  const cleaned = stripSignedUrlSecrets(dirty);
  assert.doesNotMatch(cleaned, /X-Amz-Signature|token=secret/i);
  const store = createMemoryAuditStore();
  recordAccessEvent(store, {
    category: 'media',
    agentId: 'executive',
    toolId: 'media_intelligence_reader',
    reason: dirty,
    decision: 'denied',
  });
  assert.doesNotMatch(store.listEvents()[0]?.note ?? '', /X-Amz-Signature|token=secret/i);
  assert.doesNotMatch(sanitizeAuditText('api_key=supersecret'), /supersecret/);
});

await test('27 trusted check-ID runner still passes', async () => {
  const ok = await trusted.runGuardianCheck('runtime-health');
  assert.notEqual(ok.status, 'denied');
});

await test('28 arbitrary shell remains impossible', async () => {
  const denied = await trusted.runGuardianCheck('rm -rf /');
  assert.equal(denied.status, 'denied');
  assert.equal('exec' in trusted, false);
});

function personalRecord(ownerId = 'user_a'): import('./context/adapters/session-records').AuthorizedSessionRecord {
  return {
    kind: 'profile_identity',
    ownerId,
    scope: 'personal',
    sourceRecordId: ownerId,
    organizationId: null,
    universeId: null,
  };
}

await test('S1 technology domain does not bypass ownership', async () => {
  const gateway = createCompanyDataGateway(
    createSessionRecordAdapter({ ownerId: 'user_a', reader: () => [personalRecord()] }),
  );
  const result = await gateway.read({
    agentId: 'technology',
    toolId: 'company_data_reader',
    capability: 'records',
    mode: 'read',
    classification: 'internal',
    domain: 'technology',
  });
  assert.equal(result.allowed, false);
  assert.match(result.reason, /ownerId/i);
});

await test('S2 personal technology record requires ownerId', async () => {
  assert.equal(
    provenanceIsComplete({
      sourceId: 'xiv-session-authorized',
      sourceSystem: 'supabase_owner_rls',
      sourceType: 'profile_identity',
      sourceRecordId: 'user_a',
      organizationId: null,
      universeId: null,
      ownerId: null,
      scope: 'personal',
      retrievedAt: new Date().toISOString(),
      freshness: 'fresh',
      live: true,
      prototype: false,
      confidence: 'medium',
      dataClassification: 'internal',
    }),
    false,
  );
});

await test('S3 personal record with wrong owner denied', async () => {
  const result = await createCompanyDataGateway(
    createSessionRecordAdapter({ ownerId: 'user_a', reader: () => [personalRecord('user_a')] }),
  ).read({
    agentId: 'executive',
    ownerId: 'user_b',
    toolId: 'company_data_reader',
    capability: 'records',
    mode: 'read',
    classification: 'internal',
    domain: 'technology',
    scope: 'personal',
  });
  assert.equal(result.allowed, false);
  assert.match(result.reason, /owner mismatch/i);
});

await test('S4 personal record with matching owner allowed when policy allows', async () => {
  const result = await createCompanyDataGateway(
    createSessionRecordAdapter({ ownerId: 'user_a', reader: () => [personalRecord('user_a')] }),
  ).read({
    agentId: 'technology',
    ownerId: 'user_a',
    toolId: 'company_data_reader',
    capability: 'records',
    mode: 'read',
    classification: 'internal',
    domain: 'technology',
    scope: 'personal',
  });
  assert.equal(result.allowed, true);
});

await test('S5 organization-scoped technology record requires organization', async () => {
  const adapter = createSessionRecordAdapter({
    ownerId: 'user_a',
    reader: () => [
      {
        kind: 'profile_identity',
        ownerId: 'user_a',
        scope: 'organization',
        sourceRecordId: 'user_a',
        organizationId: 'org_a',
        universeId: null,
      },
    ],
  });
  const missing = await createCompanyDataGateway(adapter).read({
    agentId: 'technology',
    ownerId: 'user_a',
    toolId: 'company_data_reader',
    capability: 'records',
    mode: 'read',
    classification: 'internal',
    domain: 'technology',
  });
  assert.equal(missing.allowed, false);
  assert.match(missing.reason, /organization/i);
  const membership = {
    id: 'om_a',
    organizationId: 'org_a',
    userId: 'user_a',
    role: 'member' as const,
    status: 'active' as const,
    createdAt: '2026-09-06T00:00:00.000Z',
    updatedAt: '2026-09-06T00:00:00.000Z',
  };
  const ok = await createCompanyDataGateway(adapter).read({
    agentId: 'technology',
    ownerId: 'user_a',
    organizationId: 'org_a',
    organizationMembership: membership,
    toolId: 'company_data_reader',
    capability: 'records',
    mode: 'read',
    classification: 'internal',
    domain: 'technology',
  });
  assert.equal(ok.allowed, true);
});

await test('S6 Universe-scoped technology record requires organization + Universe', async () => {
  const adapter = createSessionRecordAdapter({
    ownerId: 'user_a',
    reader: () => [
      {
        kind: 'profile_identity',
        ownerId: 'user_a',
        scope: 'universe',
        sourceRecordId: 'user_a',
        organizationId: 'org_a',
        universeId: 'uni_a',
      },
    ],
  });
  const missing = await createCompanyDataGateway(adapter).read({
    agentId: 'executive',
    ownerId: 'user_a',
    organizationId: 'org_a',
    toolId: 'company_data_reader',
    capability: 'records',
    mode: 'read',
    classification: 'internal',
    domain: 'technology',
  });
  assert.equal(missing.allowed, false);
  assert.match(missing.reason, /universe/i);
  const organizationMembership = {
    id: 'om_a',
    organizationId: 'org_a',
    userId: 'user_a',
    role: 'owner' as const,
    status: 'active' as const,
    createdAt: '2026-09-06T00:00:00.000Z',
    updatedAt: '2026-09-06T00:00:00.000Z',
  };
  const universeMembership = {
    id: 'um_a',
    universeId: 'uni_a',
    userId: 'user_a',
    role: 'owner' as const,
    status: 'active' as const,
    createdAt: '2026-09-06T00:00:00.000Z',
    updatedAt: '2026-09-06T00:00:00.000Z',
  };
  const ok = await createCompanyDataGateway(adapter).read({
    agentId: 'executive',
    ownerId: 'user_a',
    organizationId: 'org_a',
    universeId: 'uni_a',
    organizationMembership,
    universeMembership,
    toolId: 'company_data_reader',
    capability: 'records',
    mode: 'read',
    classification: 'internal',
    domain: 'technology',
  });
  assert.equal(ok.allowed, true);
});

await test('S7 missing scope denied', () => {
  assert.equal(
    provenanceIsComplete({
      sourceId: 'xiv-session-authorized',
      sourceSystem: 'supabase_owner_rls',
      sourceType: 'authorized_session',
      sourceRecordId: 'user_a',
      organizationId: null,
      universeId: null,
      ownerId: 'user_a',
      retrievedAt: new Date().toISOString(),
      freshness: 'fresh',
      live: true,
      prototype: false,
      confidence: 'medium',
      dataClassification: 'internal',
    }),
    false,
  );
});

await test('S8 public access requires explicit public classification', async () => {
  const result = await createCompanyDataGateway(createHttpHealthAdapter({ healthUrl: '' })).read({
    agentId: 'executive',
    toolId: 'company_data_reader',
    capability: 'connection_health',
    mode: 'read',
    classification: 'public',
  });
  assert.equal(result.allowed, true);
  assert.equal(result.status, 'not_configured');
});

await test('S9 public is not inferred from absent metadata', async () => {
  const result = await createCompanyDataGateway(createHttpHealthAdapter({ healthUrl: '' })).read({
    agentId: 'executive',
    toolId: 'company_data_reader',
    capability: 'connection_health',
    mode: 'read',
  });
  assert.equal(result.allowed, false);
  assert.match(result.reason, /explicit public classification/i);
});

await test('S10 Guardian cannot read personal session records', async () => {
  const result = await createCompanyDataGateway(
    createSessionRecordAdapter({ ownerId: 'user_a', reader: () => [personalRecord()] }),
  ).read({
    agentId: 'guardian',
    ownerId: 'user_a',
    toolId: 'company_data_reader',
    capability: 'records',
    mode: 'read',
    classification: 'internal',
  });
  assert.equal(result.allowed, false);
  assert.match(result.reason, /Guardian cannot read personal/i);
});

await test('S11 Executive cannot read unrelated personal records', async () => {
  const result = await createCompanyDataGateway(
    createSessionRecordAdapter({ ownerId: 'user_a', reader: () => [personalRecord('user_a')] }),
  ).read({
    agentId: 'executive',
    ownerId: 'user_other',
    toolId: 'company_data_reader',
    capability: 'records',
    mode: 'read',
    classification: 'internal',
    domain: 'technology',
    scope: 'personal',
  });
  assert.equal(result.allowed, false);
  assert.match(result.reason, /owner mismatch/i);
});

await test('HTTP health adapter exposes domain capabilities', () => {
  const caps = createHttpHealthAdapter({ healthUrl: '' }).getCapabilities();
  assert.equal(caps.domains.operations, false);
  assert.equal(caps.domains.finance, false);
  assert.equal(caps.write, false);
});

console.log('All Phase 2E cases passed.');
