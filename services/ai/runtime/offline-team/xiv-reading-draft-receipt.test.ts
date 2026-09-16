// 12D-285 — adversarial tests for the reading draft receipt.
// Central properties under attack:
//   1. THE DIGEST IS RE-DERIVED, NEVER TRUSTED: a claimed digest that
//      does not match the submitted draft text refuses.
//   2. SECRET RE-GATE: credential-shaped draft text never becomes
//      review material.
//   3. THE QUEUE IS THE TRUTH: the receipt's digest must equal the
//      settled story's outputHash; wrong story, wrong state, or wrong
//      hash refuses.
//   4. A RECEIPT IS NOT AN APPROVAL: honest flags pinned; no write path.

import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createHash } from 'node:crypto';
import { OfflineStoryQueue } from './offline-story-queue';
import { prepareDocumentStories } from './xiv-document-ingest';
import { registerReadingSource, type ReadingSourceStore } from './xiv-reading-source-register';
import { admitBoundReading } from './xiv-bound-admission';
import { runOllamaFirstReader, type OllamaFirstReaderPacket } from './xiv-ollama-first-reader';
import {
  READING_DRAFT_RECEIPT_POLICY, READING_DRAFT_RECEIPT_GUARDRAILS,
  buildReadingDraftReceipt, verifyReadingDraftReceiptAgainstQueue,
} from './xiv-reading-draft-receipt';

const GENESIS = '12d-285-register-genesis';
const tenantId = 'reading-tenant';
const SOURCE_ID = 'quantumlib-cirq';
const documentId = 'receipt-doc-1';

class MemoryRegisterStore implements ReadingSourceStore {
  private lines: string[] | null = null;
  load(): readonly string[] | null { return this.lines; }
  save(lines: readonly string[]): void { this.lines = [...lines]; }
}

const pad = (seed: string): string => seed + '.'.repeat(Math.max(0, 1200 - seed.length));
const DOC = [
  pad('First paragraph of the draft receipt reading.'),
  pad('Second paragraph of the draft receipt reading.'),
  pad('Third paragraph of the draft receipt reading.'),
].join('\n\n');

const DRAFT = 'A bounded factual summary of the first chunk, produced by the local first reader.';

const sha256 = (text: string): string => createHash('sha256').update(text, 'utf8').digest('hex');

/** The REAL chain through the 12D-280 first reader: a settled draft in
 *  the queue, and the first-reader packet holding its digest. */
async function readOneDraft(q: OfflineStoryQueue, store: ReadingSourceStore): Promise<OllamaFirstReaderPacket> {
  registerReadingSource(store, GENESIS, {
    tenantId, sourceId: SOURCE_ID,
    title: 'Cirq — open-source quantum circuit framework',
    sourceUrl: 'https://github.com/quantumlib/Cirq',
    sourceClass: 'OPEN_SOURCE_REPO',
    licenseNote: 'Apache 2.0 — public repository, cited verbatim',
  });
  const prepared = prepareDocumentStories({ tenantId, documentId, title: 'Receipt reading', bodyText: DOC });
  const bound = admitBoundReading(q, store, GENESIS, prepared, {
    tenantId, sourceId: SOURCE_ID, documentId,
    documentDigestSha256: prepared.documentDigestSha256,
  });
  const caller = async () => ({ model: 'qwen2.5-coder:7b', response: DRAFT });
  const headStory = prepared.stories[0]!;
  return runOllamaFirstReader(q, bound, {
    tenantId, storyId: headStory.id, sourceId: SOURCE_ID, documentId,
    title: 'Receipt reading', bodyText: DOC,
  }, caller);
}

const receiptSubmission = (overrides: Record<string, unknown> = {}): Record<string, unknown> => ({
  tenantId, storyId: 'doc-receipt-doc-1-chunk-1', documentId,
  draftSha256: sha256(DRAFT), draftText: DRAFT, model: 'qwen2.5-coder:7b', ...overrides,
});

const receiptOf = (packet: OllamaFirstReaderPacket, overrides: Record<string, unknown> = {}) =>
  buildReadingDraftReceipt(receiptSubmission({
    storyId: packet.storyId, draftSha256: packet.draftSha256, ...overrides,
  }));

function withQueue<T>(fn: (q: OfflineStoryQueue, store: MemoryRegisterStore) => Promise<T> | T): Promise<T> {
  return (async () => {
    const dir = mkdtempSync(join(tmpdir(), 'xiv-draft-receipt-'));
    const q = new OfflineStoryQueue(join(dir, 'q.sqlite'));
    try {
      return await fn(q, new MemoryRegisterStore());
    } finally { q.close(); rmSync(dir, { recursive: true, force: true }); }
  })();
}

test('12d-285: the receipt re-derives the digest and the queue cross-checks it (full REAL chain)', async () => {
  await withQueue(async (q, store) => {
    const packet = await readOneDraft(q, store);
    assert.equal(packet.storyState, 'AWAITING_REVIEW');
    const receipt = receiptOf(packet);
    assert.equal(receipt.kind, 'READING_DRAFT_RECEIPT');
    assert.equal(receipt.draftSha256, packet.draftSha256);
    assert.equal(receipt.draftChars, DRAFT.length);
    assert.ok(receipt.reviewHint.includes('12D-100'));
    assert.equal(receipt.modelCalls, 0);
    assert.equal(receipt.remoteCalls, 0);
    assert.equal(receipt.activated, 0);
    assert.equal(receipt.learningPromoted, false);
    assert.equal(receipt.humanDecision, 'REQUIRED');
    const verified = verifyReadingDraftReceiptAgainstQueue(q, receipt);
    assert.equal(verified.kind, 'READING_DRAFT_RECEIPT_QUEUE_VERIFIED');
    assert.equal(verified.storyState, 'AWAITING_REVIEW');
    assert.equal(verified.readyForReview, true);
    // THE LOOP CLOSES: the receipt's digest IS the review door's
    // expectedOutputHash, and the queue's own cross-check accepts it.
    q.applyReviewDecision({
      tenantId, storyId: packet.storyId, reviewerId: 'secure_code_reviewer',
      expectedOutputHash: receipt.draftSha256, decision: 'APPROVED', reviewRef: 'review:receipt-1',
    });
    assert.equal(q.inspectStory(tenantId, packet.storyId)?.state, 'DONE');
  });
});

test('12d-285: a tampered claimed digest refuses — the digest is re-derived, never trusted', () => {
  assert.throws(() => receiptSubmission({ draftSha256: 'f'.repeat(64) }) && buildReadingDraftReceipt(receiptSubmission({ draftSha256: 'f'.repeat(64) })), /does not match the re-derived digest/);
});

test('12d-285: credential-shaped draft text refuses before any digest matters', () => {
  const text = 'sk-abcdefghijklmnopqrst leaked';
  assert.throws(
    () => buildReadingDraftReceipt(receiptSubmission({ draftText: text, draftSha256: sha256(text) })),
    /credential-shaped/,
  );
});

test('12d-285: an over-budget draft refuses — the 12D-280 budget is mirrored', () => {
  const longDraft = 'x'.repeat(READING_DRAFT_RECEIPT_POLICY.maxDraftChars + 1);
  assert.throws(
    () => buildReadingDraftReceipt(receiptSubmission({ draftText: longDraft, draftSha256: sha256(longDraft) })),
    /exceeds/,
  );
});

test('12d-285: malformed submissions refuse', () => {
  assert.throws(() => buildReadingDraftReceipt(null), /submission object is required/);
  assert.throws(() => buildReadingDraftReceipt(42), /submission object is required/);
  assert.throws(() => buildReadingDraftReceipt(receiptSubmission({ extra: 1 })), /exactly the keys/);
  assert.throws(
    () => buildReadingDraftReceipt({ draftText: DRAFT, model: 'm', draftSha256: sha256(DRAFT), documentId, storyId: 's', tenantId }),
    /exactly the keys/,
    'reordered keys refuse',
  );
  assert.throws(() => buildReadingDraftReceipt(receiptSubmission({ draftSha256: 'not-hex' })), /64 lowercase hex/);
  assert.throws(() => buildReadingDraftReceipt(receiptSubmission({ draftText: '' })), /non-empty string/);
});

test('12d-285: the queue-truth door refuses a story that does not exist', async () => {
  await withQueue(async (q, store) => {
    await readOneDraft(q, store);
    // A well-formed receipt for a story the queue has never heard of.
    const ghost = buildReadingDraftReceipt(receiptSubmission({ storyId: 'doc-receipt-doc-1-chunk-9', documentId }));
    assert.throws(() => verifyReadingDraftReceiptAgainstQueue(q, ghost), /does not exist in this queue/);
  });
});

test('12d-285: the queue-truth door refuses wrong state and wrong hash', async () => {
  await withQueue(async (q, store) => {
    const packet = await readOneDraft(q, store);
    // Wrong state: a READY story (this queue's chunk-2) refuses.
    const readyReceipt = buildReadingDraftReceipt(receiptSubmission({
      storyId: 'doc-receipt-doc-1-chunk-2',
      draftSha256: sha256('other text'), draftText: 'other text',
    }));
    assert.throws(() => verifyReadingDraftReceiptAgainstQueue(q, readyReceipt), /only an AWAITING_REVIEW draft/);
    // Wrong hash: the settled story's outputHash mismatches.
    const wrongHash = buildReadingDraftReceipt(receiptSubmission({
      storyId: packet.storyId, draftSha256: sha256('a different text'), draftText: 'a different text',
    }));
    assert.throws(() => verifyReadingDraftReceiptAgainstQueue(q, wrongHash), /does not match this receipt/);
    // Sanity: the REAL receipt still verifies after the refusals.
    assert.equal(verifyReadingDraftReceiptAgainstQueue(q, receiptOf(packet)).readyForReview, true);
  });
});

test('12d-285: the queue door refuses malformed packets and never writes', async () => {
  await withQueue(async (q, store) => {
    const packet = await readOneDraft(q, store);
    const before = JSON.stringify(q.inspectStory(tenantId, packet.storyId));
    assert.throws(() => verifyReadingDraftReceiptAgainstQueue('not-a-queue', receiptOf(packet)), /OfflineStoryQueue/);
    assert.throws(() => verifyReadingDraftReceiptAgainstQueue(q, null), /packet object is required/);
    assert.throws(() => verifyReadingDraftReceiptAgainstQueue(q, { kind: 'OTHER' }), /READING_DRAFT_RECEIPT packet/);
    assert.throws(
      () => verifyReadingDraftReceiptAgainstQueue(q, { ...receiptOf(packet), learningPromoted: true }),
      /tampered honest flags/,
    );
    assert.equal(JSON.stringify(q.inspectStory(tenantId, packet.storyId)), before, 'the queue door only ever reads');
  });
});

test('12d-285: determinism and pinned policy/guardrails', async () => {
  await withQueue(async (q, store) => {
    const packet = await readOneDraft(q, store);
    const submission = receiptSubmission({ storyId: packet.storyId, draftSha256: packet.draftSha256 });
    assert.equal(
      JSON.stringify(buildReadingDraftReceipt(submission)),
      JSON.stringify(buildReadingDraftReceipt(submission)),
    );
    assert.equal(READING_DRAFT_RECEIPT_POLICY.policyVersion, '12d-285-v1');
    assert.equal(READING_DRAFT_RECEIPT_POLICY.maxDraftChars, 8000);
    assert.equal(READING_DRAFT_RECEIPT_GUARDRAILS.digestReDerivedNeverTrusted, true);
    assert.equal(READING_DRAFT_RECEIPT_GUARDRAILS.secretReGateOnTheDraftText, true);
    assert.equal(READING_DRAFT_RECEIPT_GUARDRAILS.queueTruthCrossGate, true);
    assert.equal(READING_DRAFT_RECEIPT_GUARDRAILS.receiptNeverApproval, true);
    assert.equal(READING_DRAFT_RECEIPT_GUARDRAILS.noWritePath, true);
    assert.equal(READING_DRAFT_RECEIPT_GUARDRAILS.runtimeSideOnlyQueueDoor, true);
    assert.equal(READING_DRAFT_RECEIPT_GUARDRAILS.pureReceiptDoor, true);
    assert.equal(READING_DRAFT_RECEIPT_GUARDRAILS.modelCalls, 0);
    assert.equal(READING_DRAFT_RECEIPT_GUARDRAILS.remoteCalls, 0);
    assert.equal(READING_DRAFT_RECEIPT_GUARDRAILS.learningPromoted, false);
    assert.equal(READING_DRAFT_RECEIPT_GUARDRAILS.activated, 0);
    assert.equal(READING_DRAFT_RECEIPT_GUARDRAILS.automaticRecovery, false);
    assert.equal(READING_DRAFT_RECEIPT_GUARDRAILS.humanDecision, 'REQUIRED');
    assert.equal(READING_DRAFT_RECEIPT_GUARDRAILS.billionUsersProven, false);
  });
});