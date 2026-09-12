import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import {
  listSocialAdapters, getSocialAdapter, advanceStage, ingestAccountArchive, pageArchive,
  archiveSummary, socialIngestionSnapshot, SOCIAL_INGESTION_GUARDRAILS, SOCIAL_INGESTION_POLICY,
  type SocialArchiveEntry,
} from './social-ingestion-registry';

const entry = (over: Partial<SocialArchiveEntry> = {}): SocialArchiveEntry =>
  ({ recordedAtMs: 1_700_000_000_000, kind: 'POST', text: `historic post ${JSON.stringify(over)}`, ...over });
const ingest = (over: Record<string, unknown> = {}) => ingestAccountArchive({
  platform: 'X', tenantId: 'tenant-a', accountRef: 'acct-1',
  consentReceiptRef: 'consent:user-1:2026-09-12', operatorAttestationRef: 'operator:attest:1',
  securityClass: 'ORDINARY', entries: [entry()], ...over,
} as Parameters<typeof ingestAccountArchive>[0]);

test('all five platforms are registered at NOT_STARTED with no live access', () => {
  const adapters = listSocialAdapters();
  assert.deepEqual(adapters.map(a => a.platform), ['META', 'TIKTOK', 'X', 'LINKEDIN', 'INSTAGRAM']);
  for (const a of adapters) {
    assert.equal(a.stage, 'NOT_STARTED');
    assert.deepEqual(a.evidenceRefs, []);
    assert.ok(a.dataClasses.length > 0);
  }
  const snap = socialIngestionSnapshot();
  assert.equal(snap.platformAccessEstablished, false);
  assert.equal(snap.consentVerifiedByPlatform, false);
  assert.equal(snap.remoteCalls, 0);
  assert.equal(snap.liveAgentCount, null);
  assert.equal(snap.humanDecision, 'REQUIRED');
  assert.equal(snap.learningPromoted, false);
});

test('stage advancement requires a receipt, never regresses, and LIVE is unreachable', () => {
  assert.throws(() => advanceStage('META', 'AGREEMENT_PENDING', ''), /evidence receipt required/);
  const advanced = advanceStage('META', 'AGREEMENT_PENDING', 'receipt:meta:nda-draft-1');
  assert.equal(advanced.stage, 'AGREEMENT_PENDING');
  assert.deepEqual([...advanced.evidenceRefs], ['receipt:meta:nda-draft-1']);
  assert.throws(() => advanceStage('META', 'NOT_STARTED', 'receipt:x'), /regression/);
  assert.throws(() => advanceStage('META', 'LIVE', 'receipt:whatever'), /unreachable/);
  // Even the highest reachable stage never implies live platform access.
  const top = advanceStage('TIKTOK', 'CONSENT_SCOPE_APPROVED', 'receipt:tiktok:scope-1');
  assert.equal(top.stage, 'CONSENT_SCOPE_APPROVED');
  assert.equal(socialIngestionSnapshot().platformAccessEstablished, false);
});

test('archive ingestion requires consent receipt, operator attestation, and ORDINARY class', () => {
  assert.throws(() => ingest({ consentReceiptRef: '' }), /consent receipt required/);
  assert.throws(() => ingest({ operatorAttestationRef: '' }), /operator attestation required/);
  assert.throws(() => ingest({ securityClass: 'TOP_SECRET' }), /rejected from the social ingestion plane/);
  assert.throws(() => ingest({ securityClass: 'CONFIDENTIAL' }), /rejected from the social ingestion plane/);
});

test('archive entries are validated and bounded', () => {
  assert.throws(() => ingest({ entries: [entry({ recordedAtMs: -1 })] }), /timestamp invalid/);
  assert.throws(() => ingest({ entries: [entry({ recordedAtMs: Date.now() + 120_000 })] }), /timestamp invalid/);
  assert.throws(() => ingest({ entries: [entry({ kind: 'LIKE' as never })] }), /kind invalid/);
  assert.throws(() => ingest({ entries: [entry({ text: 'x'.repeat(SOCIAL_INGESTION_POLICY.maxTextChars + 1) })] }), /text exceeds policy/);
  assert.throws(() => ingest({ entries: [entry(), entry()] }), /deduplicated batch/);
  assert.throws(() => ingest({ entries: [] }), /bounded archive batch required/);
});

test('ingestion dedups across batches and paging stays bounded and ordered', () => {
  const first = ingest();
  assert.equal(first.accepted, 1);
  const second = ingest();
  assert.equal(second.accepted, 0);
  assert.equal(second.duplicates, 1);
  const now = 1_700_000_100_000;
  ingestAccountArchive({ platform: 'X', tenantId: 'tenant-a', accountRef: 'acct-1',
    consentReceiptRef: 'consent:user-1:2026-09-12', operatorAttestationRef: 'operator:attest:1',
    securityClass: 'ORDINARY',
    entries: [0, 1, 2].map(i => ({ recordedAtMs: now + i, kind: 'POST' as const, text: `p-${i}` })) });
  const summary = archiveSummary('tenant-a', 'X', 'acct-1');
  assert.equal(summary.entries, 4);
  assert.equal(summary.byKind.POST, 4);
  assert.equal(pageArchive('tenant-a', 'X', 'acct-1', 0, 2).length, 2);
  assert.equal(pageArchive('tenant-a', 'X', 'acct-1', 1, 100).length, 2);
  assert.deepEqual(pageArchive('tenant-a', 'X', 'acct-1', 999), []);
  assert.equal(pageArchive('tenant-a', 'INSTAGRAM', 'acct-1').length, 0);
  assert.throws(() => pageArchive('tenant-a', 'X', 'acct-1', 0, 101), /invalid page/);
});

test('archives are isolated by tenant and account', () => {
  ingest();
  assert.equal(archiveSummary('tenant-b', 'X', 'acct-1').entries, 0);
  assert.equal(archiveSummary('tenant-a', 'X', 'acct-2').entries, 0);
});

test('guardrails are frozen and assert the honest posture', () => {
  assert.equal(SOCIAL_INGESTION_GUARDRAILS.remoteCallsAllowed, false);
  assert.equal(SOCIAL_INGESTION_GUARDRAILS.liveStageUnreachableFromThisModule, true);
  assert.equal(SOCIAL_INGESTION_GUARDRAILS.archiveIsNotLivePlatformAccess, true);
  assert.throws(() => { (SOCIAL_INGESTION_GUARDRAILS as Record<string, unknown>).remoteCallsAllowed = true; }, TypeError);
  assert.throws(() => getSocialAdapter('DISCORD' as never), /unknown platform/);
});