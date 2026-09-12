import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createHash, createPrivateKey, generateKeyPairSync, sign } from 'node:crypto';
import { OfflineStoryQueue, type OfflineStory, type StoryLease } from './offline-story-queue';
import { AuthenticatedReviewIngestion, reviewResponseSigningBytes,
  type ReviewResponsePayload } from './authenticated-review-response';

const tenantId = 'synthetic-tenant';
const story = (id = 'story-1'): OfflineStory => ({ id, tenantId, roleId: 'node_backend',
  objective: `Synthetic bounded draft ${id}`, acceptance: ['Must pass the fixture test'],
  dependencies: [], sourceRevision: 'b'.repeat(40), masterPlanSha256: 'c'.repeat(64),
  kind: 'PRODUCT_STORY', securityClass: 'ORDINARY' });
const hashOf = (s: string): string => createHash('sha256').update(s).digest('hex');

function fixture() {
  const dir = mkdtempSync(join(tmpdir(), 'xiv-review-ingest-test-'));
  let now = 1_800_000_000_000;
  let seq = 0;
  const queues: OfflineStoryQueue[] = [];
  const queue = () => { const q = new OfflineStoryQueue(join(dir, `queue-${++seq}.sqlite`), () => now); queues.push(q); return q; };
  return { dir, now: () => now, advance: (n: number) => { now += n; }, queue,
    done: () => { for (const q of queues) { try { q.close(); } catch {} } rmSync(dir, { recursive: true, force: true }); } };
}

function settled(q: OfflineStoryQueue, outputHash: string, id?: string): StoryLease {
  q.enqueue([story(id)]);
  const lease = q.claimNext(tenantId, 'node_backend', 'worker-a', 120_000);
  if (!lease) throw new Error('expected claim');
  q.settle(lease, { outcome: 'DRAFT', outputHash, providerSettled: true });
  return lease;
}

function reviewer() {
  const { publicKey, privateKey } = generateKeyPairSync('ed25519');
  const publicKeyPem = publicKey.export({ type: 'spki', format: 'pem' }).toString();
  return { publicKeyPem, privateKey: createPrivateKey(privateKey.export({ type: 'pkcs8', format: 'pem' }).toString()) };
}
const payload = (over: Partial<ReviewResponsePayload>): ReviewResponsePayload => ({
  schemaVersion: 1, reviewerId: 'secure_code_reviewer', tenantId, storyId: 'story-1',
  outputHash: 'a'.repeat(64), decision: 'APPROVED', reviewRef: 'review:evidence-1',
  note: 'bounded review note', sequence: 1, reviewedAtMs: 1_800_000_000_000,
  expiresAtMs: 1_800_000_000_000 + 60_000, ...over });
const envelope = (p: ReviewResponsePayload, priv: ReturnType<typeof reviewer>['privateKey']): string =>
  JSON.stringify({ payload: p, signatureHex: sign(null, reviewResponseSigningBytes(p), priv).toString('hex') });

test('a signed APPROVED response from an enrolled designated reviewer moves the story to DONE', () => {
  const f = fixture(); try {
    const q = f.queue(); const outputHash = hashOf('draft-1'); settled(q, outputHash);
    const r = reviewer();
    const ingest = new AuthenticatedReviewIngestion({ clock: f.now, queue: q, enrollments: [{ reviewerId: 'secure_code_reviewer',
      tenantId, mayReviewRoleIds: ['node_backend'], publicKeyPem: r.publicKeyPem, expiresAtMs: f.now() + 86_400_000 }] });
    const result = ingest.accept(envelope(payload({ outputHash }), r.privateKey));
    assert.equal(result.accepted, true); assert.equal(result.reason, 'OK'); assert.equal(result.applied, 'DONE');
    assert.equal(q.inspectStory(tenantId, 'story-1')?.state, 'DONE');
  } finally { f.done(); }
});

test('a forged or tampered response is rejected and the story stays AWAITING_REVIEW', () => {
  const f = fixture(); try {
    const q = f.queue(); const outputHash = hashOf('draft-1'); settled(q, outputHash);
    const r = reviewer(); const attacker = reviewer();
    const ingest = new AuthenticatedReviewIngestion({ clock: f.now, queue: q, enrollments: [{ reviewerId: 'secure_code_reviewer',
      tenantId, mayReviewRoleIds: ['node_backend'], publicKeyPem: r.publicKeyPem, expiresAtMs: f.now() + 86_400_000 }] });
    assert.equal(ingest.accept(envelope(payload({ outputHash }), attacker.privateKey)).reason, 'MALFORMED');
    const signed = JSON.parse(envelope(payload({ outputHash }), r.privateKey)) as { payload: ReviewResponsePayload; signatureHex: string };
    signed.payload.note = 'tampered after signing';
    assert.equal(ingest.accept(JSON.stringify(signed)).reason, 'MALFORMED');
    assert.equal(q.inspectStory(tenantId, 'story-1')?.state, 'AWAITING_REVIEW');
  } finally { f.done(); }
});

test('reviews bind to the exact settled output hash and refuse replayed sequences', () => {
  const f = fixture(); try {
    const q = f.queue(); const outputHash = hashOf('draft-1'); settled(q, outputHash);
    const r = reviewer();
    const ingest = new AuthenticatedReviewIngestion({ clock: f.now, queue: q, enrollments: [{ reviewerId: 'secure_code_reviewer',
      tenantId, mayReviewRoleIds: ['node_backend'], publicKeyPem: r.publicKeyPem, expiresAtMs: f.now() + 86_400_000 }] });
    const wrongHash = ingest.accept(envelope(payload({ outputHash: 'f'.repeat(64) }), r.privateKey));
    assert.equal(wrongHash.reason, 'OUTPUT_HASH_MISMATCH');
    assert.equal(ingest.accept(envelope(payload({ outputHash }), r.privateKey)).accepted, true);
    assert.equal(ingest.accept(envelope(payload({ outputHash: 'f'.repeat(64), sequence: 2 }), r.privateKey)).reason, 'STORY_NOT_AWAITING_REVIEW');
    const q2 = f.queue(); settled(q2, outputHash);
    const ingest2 = new AuthenticatedReviewIngestion({ clock: f.now, queue: q2, enrollments: [{ reviewerId: 'secure_code_reviewer',
      tenantId, mayReviewRoleIds: ['node_backend'], publicKeyPem: r.publicKeyPem, expiresAtMs: f.now() + 86_400_000 }] });
    assert.equal(ingest2.accept(envelope(payload({ outputHash, sequence: 5 }), r.privateKey)).accepted, true);
    // Replay check precedes state checks: the same envelope refused even though the story is also DONE.
    assert.equal(ingest2.accept(envelope(payload({ outputHash, sequence: 5 }), r.privateKey)).reason, 'REPLAYED');
    const q3 = f.queue(); settled(q3, outputHash); settled(q3, hashOf('draft-2'), 'story-2');
    const ingest3 = new AuthenticatedReviewIngestion({ clock: f.now, queue: q3, enrollments: [{ reviewerId: 'secure_code_reviewer',
      tenantId, mayReviewRoleIds: ['node_backend'], publicKeyPem: r.publicKeyPem, expiresAtMs: f.now() + 86_400_000 }] });
    assert.equal(ingest3.accept(envelope(payload({ outputHash, sequence: 3 }), r.privateKey)).accepted, true);
    assert.equal(ingest3.accept(envelope(payload({ outputHash: hashOf('draft-2'), storyId: 'story-2', sequence: 2 }), r.privateKey)).reason, 'REPLAYED');
  } finally { f.done(); }
});

test('CHANGES_REQUESTED re-queues the story and its next cycle can be reviewed on its own hash', () => {
  const f = fixture(); try {
    const q = f.queue(); const first = hashOf('draft-1'); settled(q, first);
    const r = reviewer();
    const ingest = new AuthenticatedReviewIngestion({ clock: f.now, queue: q, enrollments: [{ reviewerId: 'secure_code_reviewer',
      tenantId, mayReviewRoleIds: ['node_backend'], publicKeyPem: r.publicKeyPem, expiresAtMs: f.now() + 86_400_000 }] });
    const result = ingest.accept(envelope(payload({ outputHash: first, decision: 'CHANGES_REQUESTED' }), r.privateKey));
    assert.equal(result.accepted, true); assert.equal(result.applied, 'READY');
    assert.equal(q.inspectStory(tenantId, 'story-1')?.state, 'READY');
    const lease = q.claimNext(tenantId, 'node_backend', 'worker-b', 120_000);
    assert.ok(lease);
    const second = hashOf('draft-2');
    q.settle(lease, { outcome: 'DRAFT', outputHash: second, providerSettled: true });
    const result2 = ingest.accept(envelope(payload({ outputHash: second, decision: 'APPROVED', sequence: 2 }), r.privateKey));
    assert.equal(result2.accepted, true); assert.equal(result2.applied, 'DONE');
    assert.equal(q.inspectStory(tenantId, 'story-1')?.state, 'DONE');
  } finally { f.done(); }
});

test('REJECTED retires the story without granting any settlement', () => {
  const f = fixture(); try {
    const q = f.queue(); const outputHash = hashOf('draft-1'); settled(q, outputHash);
    const r = reviewer();
    const ingest = new AuthenticatedReviewIngestion({ clock: f.now, queue: q, enrollments: [{ reviewerId: 'secure_code_reviewer',
      tenantId, mayReviewRoleIds: ['node_backend'], publicKeyPem: r.publicKeyPem, expiresAtMs: f.now() + 86_400_000 }] });
    const result = ingest.accept(envelope(payload({ outputHash, decision: 'REJECTED' }), r.privateKey));
    assert.equal(result.accepted, true); assert.equal(result.applied, 'FAILED');
    assert.equal(q.inspectStory(tenantId, 'story-1')?.state, 'FAILED');
  } finally { f.done(); }
});

test('scope, revocation, expiry, and designation are all enforced before any queue write', () => {
  const f = fixture(); try {
    const q = f.queue(); const outputHash = hashOf('draft-1'); settled(q, outputHash);
    const r = reviewer();
    const ingest = new AuthenticatedReviewIngestion({ clock: f.now, queue: q, enrollments: [{ reviewerId: 'secure_code_reviewer',
      tenantId: 'other-tenant', mayReviewRoleIds: ['node_backend'], publicKeyPem: r.publicKeyPem, expiresAtMs: f.now() + 86_400_000 }] });
    assert.equal(ingest.accept(envelope(payload({ outputHash }), r.privateKey)).reason, 'SCOPE_MISMATCH');
    const q2 = f.queue(); settled(q2, outputHash);
    const ingest2 = new AuthenticatedReviewIngestion({ clock: f.now, queue: q2, enrollments: [{ reviewerId: 'secure_code_reviewer',
      tenantId, mayReviewRoleIds: ['node_backend'], publicKeyPem: r.publicKeyPem, expiresAtMs: f.now() + 86_400_000 }] });
    ingest2.revoke('secure_code_reviewer');
    assert.equal(ingest2.accept(envelope(payload({ outputHash }), r.privateKey)).reason, 'REVOKED');
    const q3 = f.queue(); settled(q3, outputHash);
    const ingest3 = new AuthenticatedReviewIngestion({ clock: f.now, queue: q3, enrollments: [{ reviewerId: 'secure_code_reviewer',
      tenantId, mayReviewRoleIds: ['web_engineer'], publicKeyPem: r.publicKeyPem, expiresAtMs: f.now() + 86_400_000 }] });
    assert.equal(ingest3.accept(envelope(payload({ outputHash }), r.privateKey)).reason, 'NOT_DESIGNATED_REVIEWER');
    assert.equal(q3.inspectStory(tenantId, 'story-1')?.state, 'AWAITING_REVIEW');
    const q4 = f.queue(); settled(q4, outputHash);
    const expired = f.now() - 1000;
    assert.throws(() => new AuthenticatedReviewIngestion({ clock: f.now, queue: q4, enrollments: [{ reviewerId: 'secure_code_reviewer',
      tenantId, mayReviewRoleIds: ['node_backend'], publicKeyPem: r.publicKeyPem, expiresAtMs: expired }] }));
  } finally { f.done(); }
});

test('stale or future-dated reviews are refused; snapshot stays honest', () => {
  const f = fixture(); try {
    const q = f.queue(); const outputHash = hashOf('draft-1'); settled(q, outputHash);
    const r = reviewer();
    const ingest = new AuthenticatedReviewIngestion({ clock: f.now, queue: q, enrollments: [{ reviewerId: 'secure_code_reviewer',
      tenantId, mayReviewRoleIds: ['node_backend'], publicKeyPem: r.publicKeyPem, expiresAtMs: f.now() + 86_400_000 }] });
    assert.equal(ingest.accept(envelope(payload({ outputHash, reviewedAtMs: f.now() + 60_000 }), r.privateKey)).reason, 'STALE');
    assert.equal(ingest.accept(envelope(payload({ outputHash, expiresAtMs: f.now() + 400_000 }), r.privateKey)).reason, 'STALE');
    assert.equal(ingest.accept(envelope(payload({ outputHash, expiresAtMs: f.now() + 86_400_000 * 2 }), r.privateKey)).reason, 'STALE');
    const snap = ingest.snapshot();
    assert.equal(snap.assurance, 'REVIEWER_SIGNATURE_NOT_INDEPENDENT_MODEL_ATTESTATION');
    assert.equal(snap.learningPromoted, false); assert.equal(snap.liveAgentCount, null);
    assert.equal(q.inspectStory(tenantId, 'story-1')?.state, 'AWAITING_REVIEW');
  } finally { f.done(); }
});