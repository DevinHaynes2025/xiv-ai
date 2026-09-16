// 12D-288 — adversarial tests for the FAILED→READY operator recovery
// door. Central properties under attack:
//   1. THE MEASURED LOOP CLOSES: chunk-1 read → chunk-2 fails DURABLY
//      (a real post-call provider failure through the REAL first
//      reader) → the operator recovers chunk-2 with the SAME bytes →
//      the cycle re-invocation READS chunk-2 → a 12D-285 receipt the
//      queue verifies. Recovery is one explicit operator step in that
//      loop — never automatic.
//   2. A DOCUMENT IS RECOVERED AS THE BYTES IT WAS ADMITTED AS: the
//      re-proof runs through the REAL ingest + bound admission (an
//      unregistered source refuses; changed bytes refuse at the queue
//      door's own fingerprint invariant) and the FAILED chunk's own
//      stored docRef must match the re-derived digest.
//   3. FAILED-ONLY, ONE CHUNK, NO MODEL CALL: a queue with no FAILED
//      story refuses (measured states named); a recovery NEVER invokes
//      the model (modelCalls 0) — the re-read is the cycle's next
//      invocation; exactly one FAILED story is re-queued per call.
//   4. THE OPERATOR REF IS ECHOED, NEVER STORED: the queue row carries
//      no trace of the ref; the output hash is cleared so the next
//      settlement writes a fresh one.
import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createHash } from 'node:crypto';
import { OfflineStoryQueue } from './offline-story-queue';
import {
  registerReadingSource, type ReadingSourceStore,
} from './xiv-reading-source-register';
import { runSupervisedReadingCycle } from './xiv-supervised-reading-cycle';
import { recoverFailedReadingChunk } from './xiv-reading-recovery';
import {
  buildReadingDraftReceipt, verifyReadingDraftReceiptAgainstQueue,
} from './xiv-reading-draft-receipt';
import { READING_RECOVERY_GUARDRAILS, READING_RECOVERY_POLICY } from './xiv-reading-recovery';

const GENESIS = '12d-288-register-genesis';
const tenantId = 'reading-tenant';

class MemoryRegisterStore implements ReadingSourceStore {
  private lines: string[] | null = null;
  load(): readonly string[] | null { return this.lines; }
  save(lines: readonly string[]): void { this.lines = [...lines]; }
}

const pad = (seed: string): string => seed + '.'.repeat(Math.max(0, 1200 - seed.length));
const DOC = [
  pad('First paragraph of the recovery reading.'),
  pad('Second paragraph of the recovery reading.'),
  pad('Third paragraph of the recovery reading.'),
].join('\n\n');

function registeredRegister(): MemoryRegisterStore {
  const store = new MemoryRegisterStore();
  registerReadingSource(store, GENESIS, {
    tenantId, sourceId: 'quantumlib-cirq',
    title: 'Cirq — open-source quantum circuit framework',
    sourceUrl: 'https://github.com/quantumlib/Cirq',
    sourceClass: 'OPEN_SOURCE_REPO',
    licenseNote: 'Apache 2.0 — public repository, cited verbatim',
  });
  return store;
}

const callerFor = (draft: string) => async () => ({ model: 'qwen2.5-coder:7b', response: draft });
const failingCaller = async () => { throw new Error('ollama returned HTTP 500'); };

const submission = (overrides: Record<string, unknown> = {}): Record<string, unknown> => ({
  tenantId, sourceId: 'quantumlib-cirq', documentId: 'recov-doc-1',
  title: 'Recovery reading', bodyText: DOC, ...overrides,
});

const recovery = (overrides: Record<string, unknown> = {}): Record<string, unknown> => ({
  tenantId, sourceId: 'quantumlib-cirq', documentId: 'recov-doc-1',
  title: 'Recovery reading', bodyText: DOC,
  operatorRef: 'operator:devin:recover-chunk-2-http500', ...overrides,
});

function withQueue<T>(fn: (dir: string, q: OfflineStoryQueue) => Promise<T> | T): Promise<T> {
  return (async () => {
    const dir = mkdtempSync(join(tmpdir(), 'xiv-reading-recov-'));
    const q = new OfflineStoryQueue(join(dir, 'q.sqlite'));
    try {
      return await fn(dir, q);
    } finally { q.close(); rmSync(dir, { recursive: true, force: true }); }
  })();
}

test('12d-288: the measured loop closes — durable failure, recovery, re-read, receipt', async () => {
  await withQueue(async (dir, q) => {
    const store = registeredRegister();
    // Invocation 1: chunk-1 reads fine.
    const first = await runSupervisedReadingCycle(q, store, GENESIS, submission(), callerFor('Draft of chunk one.'));
    assert.equal(first.kind, 'SUPERVISED_READING_CYCLE');
    // Invocation 2: a REAL post-call provider failure settles chunk-2
    // FAILED durably (no silent retry).
    const failed = await runSupervisedReadingCycle(q, store, GENESIS, submission(), failingCaller);
    assert.equal(failed.kind, 'SUPERVISED_READING_CYCLE_REFUSED');
    if (failed.kind !== 'SUPERVISED_READING_CYCLE_REFUSED') return;
    assert.equal(failed.modelCalls, 1, 'a FAILED story means the provider call happened');
    assert.equal(q.inspectStory(tenantId, 'doc-recov-doc-1-chunk-2')?.state, 'FAILED');
    // THE OPERATOR RECOVERS chunk-2 with the SAME bytes — exactly one
    // explicit action, no model call, nothing automatic.
    const packet = recoverFailedReadingChunk(q, store, GENESIS, recovery());
    assert.equal(packet.kind, 'READING_RECOVERY');
    if (packet.kind !== 'READING_RECOVERY') return;
    assert.equal(packet.storyId, 'doc-recov-doc-1-chunk-2');
    assert.equal(packet.priorState, 'FAILED');
    assert.equal(packet.storyState, 'READY');
    assert.equal(packet.remainingFailed, 0);
    assert.equal(packet.modelCalls, 0);
    assert.equal(packet.remoteCalls, 0);
    assert.equal(packet.automaticRecovery, false);
    assert.equal(packet.humanDecision, 'REQUIRED');
    assert.equal(packet.operatorRef, 'operator:devin:recover-chunk-2-http500');
    assert.deepEqual(packet.chunks, { prepared: 3, inserted: 0, duplicates: 3 });
    // The queue truth: READY, and the failed settlement's output hash
    // is CLEARED so the next settlement writes a fresh one.
    assert.deepEqual(q.inspectStory(tenantId, 'doc-recov-doc-1-chunk-2'), { state: 'READY', role: 'memory_curator', outputHash: null });
    // The operator ref is ECHOED, NEVER STORED — nothing in the row.
    const row = q.page(tenantId, 0, 50).find((r) => String(r.id) === 'doc-recov-doc-1-chunk-2');
    assert.ok(row);
    assert.ok(!JSON.stringify(row).includes('operator:devin'), 'the operator ref is never stored');
    // The next cycle invocation READS the recovered chunk-2 (continuation).
    const readAgain = await runSupervisedReadingCycle(q, store, GENESIS, submission(), callerFor('Draft of chunk two.'));
    assert.equal(readAgain.kind, 'SUPERVISED_READING_CYCLE');
    if (readAgain.kind !== 'SUPERVISED_READING_CYCLE') return;
    assert.equal(readAgain.storyId, 'doc-recov-doc-1-chunk-2');
    assert.equal(readAgain.continuation, true);
    assert.equal(readAgain.modelCalls, 1);
    // The receipt chain binds the recovered chunk's settled draft.
    const draftText = 'Draft of chunk two.';
    const receipt = buildReadingDraftReceipt({
      tenantId, storyId: readAgain.storyId, documentId: readAgain.documentId,
      draftSha256: createHash('sha256').update(draftText, 'utf8').digest('hex'),
      draftText, model: readAgain.model,
    });
    const verified = verifyReadingDraftReceiptAgainstQueue(q, receipt);
    assert.equal(verified.kind, 'READING_DRAFT_RECEIPT_QUEUE_VERIFIED');
    assert.equal(verified.readyForReview, true);
  });
});

test('12d-288: recovery with changed bytes or an unregistered source refuses BEFORE anything moves', async () => {
  await withQueue(async (dir, q) => {
    const store = registeredRegister();
    const first = await runSupervisedReadingCycle(q, store, GENESIS, submission(), callerFor('Draft of chunk one.'));
    assert.equal(first.kind, 'SUPERVISED_READING_CYCLE');
    const broke = await runSupervisedReadingCycle(q, store, GENESIS, submission(), failingCaller);
    assert.equal(broke.kind, 'SUPERVISED_READING_CYCLE_REFUSED');
    // Changed bytes refuse at the QUEUE'S OWN fingerprint invariant —
    // a layer deeper than the door's own docRef proof.
    const tampered = recoverFailedReadingChunk(q, store, GENESIS, recovery({ bodyText: DOC + '\n\nExtra paragraph.' }));
    assert.equal(tampered.kind, 'READING_RECOVERY_REFUSED');
    if (tampered.kind !== 'READING_RECOVERY_REFUSED') return;
    assert.ok(tampered.reason.includes('content conflict'), `measured reason: ${tampered.reason}`);
    assert.equal(tampered.modelCalls, 0);
    assert.equal(q.inspectStory(tenantId, 'doc-recov-doc-1-chunk-2')?.state, 'FAILED', 'the queue truth is untouched by a refused recovery');
    // An unregistered source refuses at the bound admission (NO
    // REGISTER NO BINDING) before anything is recovered.
    const unregistered = recoverFailedReadingChunk(q, new MemoryRegisterStore(), GENESIS, recovery());
    assert.equal(unregistered.kind, 'READING_RECOVERY_REFUSED');
    if (unregistered.kind !== 'READING_RECOVERY_REFUSED') return;
    assert.ok(unregistered.reason.length > 0);
    assert.equal(q.inspectStory(tenantId, 'doc-recov-doc-1-chunk-2')?.state, 'FAILED');
    // A changed title under the same documentId refuses too.
    const retitled = recoverFailedReadingChunk(q, store, GENESIS, recovery({ title: 'Retitled' }));
    assert.equal(retitled.kind, 'READING_RECOVERY_REFUSED');
    if (retitled.kind !== 'READING_RECOVERY_REFUSED') return;
    assert.ok(retitled.reason.includes('content conflict'), `measured reason: ${retitled.reason}`);
  });
});

test('12d-288: a FAILED-only door — no FAILED story refuses with measured states; the queue door itself refuses non-FAILED states', async () => {
  await withQueue(async (dir, q) => {
    const store = registeredRegister();
    // Everything read fine — nothing is FAILED.
    for (const draft of ['Draft of chunk one.', 'Draft of chunk two.', 'Draft of chunk three.']) {
      const packet = await runSupervisedReadingCycle(q, store, GENESIS, submission(), callerFor(draft));
      assert.equal(packet.kind, 'SUPERVISED_READING_CYCLE');
    }
    const refused = recoverFailedReadingChunk(q, store, GENESIS, recovery());
    assert.equal(refused.kind, 'READING_RECOVERY_REFUSED');
    if (refused.kind !== 'READING_RECOVERY_REFUSED') return;
    assert.ok(refused.reason.includes('no FAILED story'), `measured reason: ${refused.reason}`);
    assert.ok(refused.reason.includes('AWAITING_REVIEW'), 'the measured states are named honestly');
    assert.equal(refused.modelCalls, 0);
    // The queue's own door refuses every non-FAILED state directly.
    for (const [storyId, state] of [
      ['doc-recov-doc-1-chunk-1', 'AWAITING_REVIEW'],
      ['doc-recov-doc-1-chunk-2', 'AWAITING_REVIEW'],
      ['doc-recov-doc-1-chunk-3', 'AWAITING_REVIEW'],
    ] as const) {
      assert.equal(q.inspectStory(tenantId, storyId)?.state, state);
      assert.throws(() => q.recoverFailedStory({ tenantId, storyId, operatorRef: 'operator:x' }), /FAILED-only door/);
    }
    assert.throws(() => q.recoverFailedStory({ tenantId, storyId: 'doc-recov-doc-1-chunk-9', operatorRef: 'operator:x' }), /story not found/);
    assert.throws(() => q.recoverFailedStory({ tenantId, storyId: 'doc-recov-doc-1-chunk-1', operatorRef: '' }), /operator recovery request invalid/);
    assert.throws(() => q.recoverFailedStory({ tenantId, storyId: 'doc-recov-doc-1-chunk-1', operatorRef: 'x'.repeat(257) }), /operator recovery request invalid/);
  });
});

test('12d-288: one chunk per recovery; a lease on a DIFFERENT story does not block', async () => {
  await withQueue(async (dir, q) => {
    const store = registeredRegister();
    // Two durable failures: chunk-2 and chunk-3 both FAILED (two failed
    // calls through the REAL first reader), chunk-1 read fine.
    assert.equal((await runSupervisedReadingCycle(q, store, GENESIS, submission(), callerFor('Draft of chunk one.'))).kind, 'SUPERVISED_READING_CYCLE');
    assert.equal((await runSupervisedReadingCycle(q, store, GENESIS, submission(), failingCaller)).kind, 'SUPERVISED_READING_CYCLE_REFUSED');
    assert.equal((await runSupervisedReadingCycle(q, store, GENESIS, submission(), failingCaller)).kind, 'SUPERVISED_READING_CYCLE_REFUSED');
    assert.equal(q.inspectStory(tenantId, 'doc-recov-doc-1-chunk-2')?.state, 'FAILED');
    assert.equal(q.inspectStory(tenantId, 'doc-recov-doc-1-chunk-3')?.state, 'FAILED');
    // An UNRELATED lease (held on a separately-enqueued story of the
    // same tenant — the only claimable READY story now that chunks 2..3
    // are FAILED) does NOT block recovering a FAILED story.
    q.enqueue([{
      id: 'standalone-story-1', tenantId, roleId: 'memory_curator',
      objective: 'A standalone story unrelated to the reading.',
      acceptance: ['the standalone story is bounded'],
      dependencies: [], sourceRevision: 'a'.repeat(40),
      masterPlanSha256: 'b'.repeat(64), securityClass: 'ORDINARY',
      kind: 'PRODUCT_STORY',
    }]);
    const held = q.claimNext(tenantId, 'memory_curator', 'standalone-owner', 60_000);
    assert.ok(held !== null, 'the standalone story holds the singleton lease');
    assert.equal(held?.storyId, 'standalone-story-1');
    const packet = recoverFailedReadingChunk(q, store, GENESIS, recovery());
    assert.equal(packet.kind, 'READING_RECOVERY');
    if (packet.kind !== 'READING_RECOVERY') return;
    assert.equal(packet.storyId, 'doc-recov-doc-1-chunk-2', 'the FIRST FAILED story in ordinal order');
    assert.equal(packet.remainingFailed, 1, 'chunk-3 stays FAILED for the operator\'s next invocation');
    // The unrelated lease is UNDISTURBED by the recovery.
    assert.equal(q.inspectHeldLease()?.storyId, 'standalone-story-1');
    // The second recovery re-queues chunk-3; a third refuses (nothing
    // FAILED remains).
    const second = recoverFailedReadingChunk(q, store, GENESIS, recovery({ operatorRef: 'operator:devin:recover-chunk-3' }));
    assert.equal(second.kind, 'READING_RECOVERY');
    if (second.kind !== 'READING_RECOVERY') return;
    assert.equal(second.storyId, 'doc-recov-doc-1-chunk-3');
    const third = recoverFailedReadingChunk(q, store, GENESIS, recovery({ operatorRef: 'operator:devin:nothing-left' }));
    assert.equal(third.kind, 'READING_RECOVERY_REFUSED');
    if (third.kind !== 'READING_RECOVERY_REFUSED') return;
    assert.ok(third.reason.includes('no FAILED story'));
  });
});

test('12d-288: malformed requests refuse and carry zero document text; guardrails and determinism', async () => {
  await withQueue(async (dir, q) => {
    const store = registeredRegister();
    assert.equal((await runSupervisedReadingCycle(q, store, GENESIS, submission(), callerFor('Draft of chunk one.'))).kind, 'SUPERVISED_READING_CYCLE');
    assert.equal((await runSupervisedReadingCycle(q, store, GENESIS, submission(), failingCaller)).kind, 'SUPERVISED_READING_CYCLE_REFUSED');
    const wrongKeys: Array<Record<string, unknown>> = [
      {}, // empty
      { tenantId, sourceId: 'quantumlib-cirq', documentId: 'recov-doc-1', title: 'Recovery reading', bodyText: DOC }, // missing operatorRef
      { ...recovery(), extra: 1 }, // extra key
      { operatorRef: 'operator:devin:reordered', bodyText: DOC, title: 'Recovery reading', documentId: 'recov-doc-1', sourceId: 'quantumlib-cirq', tenantId }, // reordered
      { ...recovery(), operatorRef: '' },
      { ...recovery(), operatorRef: 'x'.repeat(257) },
      { ...recovery(), bodyText: '-----BEGIN RSA PRIVATE KEY-----\nMIIBCg==\n-----END RSA PRIVATE KEY-----' },
      { ...recovery(), operatorRef: 42 },
      'not an object' as unknown as Record<string, unknown>,
    ];
    for (const [i, bad] of wrongKeys.entries()) {
      const refused = recoverFailedReadingChunk(q, store, GENESIS, bad);
      assert.equal(refused.kind, 'READING_RECOVERY_REFUSED', `case ${i}`);
      if (refused.kind !== 'READING_RECOVERY_REFUSED') return;
      assert.ok(!JSON.stringify(refused).includes('UNTRUSTED_DOCUMENT_TEXT'), 'refused packets carry zero document text');
      assert.ok(!JSON.stringify(refused).includes('First paragraph'), 'refused packets carry zero document text');
      assert.equal(refused.modelCalls, 0);
      assert.equal(refused.automaticRecovery, false);
    }
    // Wrong doors refuse.
    assert.equal(recoverFailedReadingChunk(q, store, GENESIS, null).kind, 'READING_RECOVERY_REFUSED');
    assert.equal(recoverFailedReadingChunk('not a queue', store, GENESIS, recovery()).kind, 'READING_RECOVERY_REFUSED');
    assert.equal(recoverFailedReadingChunk(q, null, GENESIS, recovery()).kind, 'READING_RECOVERY_REFUSED');
    assert.equal(recoverFailedReadingChunk(q, store, 'short', recovery()).kind, 'READING_RECOVERY_REFUSED');
    // Pinned guardrails: recovery is explicit, never automatic, and
    // makes no model call.
    assert.equal(READING_RECOVERY_POLICY.policyVersion, '12d-288-v1');
    assert.equal(READING_RECOVERY_POLICY.chunksPerRecovery, 1);
    assert.equal(READING_RECOVERY_GUARDRAILS.automaticRecovery, false);
    assert.equal(READING_RECOVERY_GUARDRAILS.failedOnlyDoor, true);
    assert.equal(READING_RECOVERY_GUARDRAILS.noModelCallInRecovery, true);
    assert.equal(READING_RECOVERY_GUARDRAILS.bytesReprovenBeforeRecovery, true);
    assert.equal(READING_RECOVERY_GUARDRAILS.remoteCalls, 0);
    assert.equal(READING_RECOVERY_GUARDRAILS.learningPromoted, false);
    assert.equal(READING_RECOVERY_GUARDRAILS.humanDecision, 'REQUIRED');
    // Determinism of a refusal.
    const r1 = recoverFailedReadingChunk(q, store, GENESIS, recovery({ bodyText: DOC + ' tampered' }));
    const r2 = recoverFailedReadingChunk(q, store, GENESIS, recovery({ bodyText: DOC + ' tampered' }));
    assert.equal(JSON.stringify(r1), JSON.stringify(r2));
  });
});