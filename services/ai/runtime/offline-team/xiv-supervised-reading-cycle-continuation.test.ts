// 12D-287 — adversarial tests for the supervised reading cycle's
// CONTINUATION gate. Central properties under attack:
//   1. THE OPERATOR'S LOOP WORKS: a multi-chunk document is advanced
//      one chunk per invocation to its end — the 12D-283 "read once"
//      gate made chunks 2..N unreachable, and this rung pays that
//      defect down. A continuation is a duplicate admission whose
//      re-submitted bytes re-derive the SAME document digest.
//   2. A DOCUMENT IS READ AS THE BYTES IT WAS ADMITTED AS: changed
//      bytes or a changed title under the same documentId refuse
//      BEFORE any provider call, and the queue truth is unchanged.
//   3. THE PROOF IS THE QUEUE'S OWN RECORD: the continuation reads the
//      docRef the queue's stored objective was admitted with (the
//      additively exported inspectStoryObjective accessor) — nothing
//      is trusted from the submission beyond the re-derived digest.
//   4. THE RECEIPT CHAIN CARRIES ACROSS CONTINUATIONS: a draft read on
//      a continuation builds a 12D-285 receipt that the queue
//      verifies.
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
import {
  buildReadingDraftReceipt, verifyReadingDraftReceiptAgainstQueue,
} from './xiv-reading-draft-receipt';

const GENESIS = '12d-287-register-genesis';
const tenantId = 'reading-tenant';

class MemoryRegisterStore implements ReadingSourceStore {
  private lines: string[] | null = null;
  load(): readonly string[] | null { return this.lines; }
  save(lines: readonly string[]): void { this.lines = [...lines]; }
}

const pad = (seed: string): string => seed + '.'.repeat(Math.max(0, 1200 - seed.length));
const DOC = [
  pad('First paragraph of the continuation reading.'),
  pad('Second paragraph of the continuation reading.'),
  pad('Third paragraph of the continuation reading.'),
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

const submission = (overrides: Record<string, unknown> = {}): Record<string, unknown> => ({
  tenantId, sourceId: 'quantumlib-cirq', documentId: 'cont-doc-1',
  title: 'Continuation reading', bodyText: DOC, ...overrides,
});

function withQueue<T>(fn: (dir: string, q: OfflineStoryQueue) => Promise<T> | T): Promise<T> {
  return (async () => {
    const dir = mkdtempSync(join(tmpdir(), 'xiv-reading-cont-'));
    const q = new OfflineStoryQueue(join(dir, 'q.sqlite'));
    try {
      return await fn(dir, q);
    } finally { q.close(); rmSync(dir, { recursive: true, force: true }); }
  })();
}

test('12d-287: the operator loop advances a document chunk by chunk to its end', async () => {
  await withQueue(async (dir, q) => {
    const store = registeredRegister();
    const drafts = ['Draft of chunk one.', 'Draft of chunk two.', 'Draft of chunk three.'];
    for (let i = 0; i < 3; i += 1) {
      const packet = await runSupervisedReadingCycle(q, store, GENESIS, submission(), callerFor(drafts[i]!));
      assert.equal(packet.kind, 'SUPERVISED_READING_CYCLE', `invocation ${i + 1}`);
      if (packet.kind !== 'SUPERVISED_READING_CYCLE') return;
      assert.equal(packet.storyId, `doc-cont-doc-1-chunk-${i + 1}`);
      assert.equal(packet.continuation, i > 0, 'the first invocation is fresh; the rest continue');
      assert.equal(packet.remainingReady, 2 - i);
      assert.equal(packet.modelCalls, 1);
      if (i === 1) assert.deepEqual(packet.chunks, { prepared: 3, inserted: 0, duplicates: 3 });
    }
    // Every chunk is settled; a further invocation refuses honestly,
    // BEFORE any provider call, and nothing auto-advances.
    const spent = await runSupervisedReadingCycle(q, store, GENESIS, submission(), callerFor('never called'));
    assert.equal(spent.kind, 'SUPERVISED_READING_CYCLE_REFUSED');
    if (spent.kind !== 'SUPERVISED_READING_CYCLE_REFUSED') return;
    assert.ok(spent.reason.includes('no READY story'));
    assert.equal(spent.modelCalls, 0);
  });
});

test('12d-287: changed bytes refuse and leave the queue truth untouched', async () => {
  await withQueue(async (dir, q) => {
    const store = registeredRegister();
    const first = await runSupervisedReadingCycle(q, store, GENESIS, submission(), callerFor('Draft of chunk one.'));
    assert.equal(first.kind, 'SUPERVISED_READING_CYCLE');
    const changed = await runSupervisedReadingCycle(q, store, GENESIS, submission({ bodyText: DOC + '\n\nExtra paragraph.' }), callerFor('never called'));
    assert.equal(changed.kind, 'SUPERVISED_READING_CYCLE_REFUSED');
    if (changed.kind !== 'SUPERVISED_READING_CYCLE_REFUSED') return;
    // Changed bytes are refused by the QUEUE'S OWN fingerprint
    // invariant (story ID content conflict) — a layer DEEPER than the
    // cycle's continuation gate: the bytes are protected by the queue
    // itself, before the cycle's docRef proof even runs.
    assert.ok(changed.reason.includes('content conflict'), `measured reason: ${changed.reason}`);
    assert.equal(changed.modelCalls, 0, 'pre-call refusal: the model is never invoked on foreign bytes');
    assert.equal(changed.storyState, 'AWAITING_REVIEW', 'measured queue truth: chunk-1 holds its settled draft');
    // The queue is unchanged: chunk-2 is still READY for the operator.
    assert.equal(q.inspectStory(tenantId, 'doc-cont-doc-1-chunk-2')?.state, 'READY');
  });
});

test('12d-287: the continuation proof is the queue\'s own stored docRef (inspectStoryObjective)', async () => {
  await withQueue(async (dir, q) => {
    const store = registeredRegister();
    await runSupervisedReadingCycle(q, store, GENESIS, submission(), callerFor('Draft of chunk one.'));
    // The stored objective carries the docRef of the digest the
    // document was ADMITTED with.
    const objective = q.inspectStoryObjective(tenantId, 'doc-cont-doc-1-chunk-1');
    assert.ok(typeof objective === 'string' && objective.length > 0);
    assert.ok(objective!.includes('doc:cont-doc-1:'), 'the stored objective cites the document ref');
    // The cycle's continuation gate re-derives the digest from the
    // re-submitted bytes and matches it against THAT record. MEASURED
    // TRUTH: every tamper direction — changed bytes, changed title,
    // shortened body — is refused by the QUEUE'S OWN fingerprint
    // invariant ('story ID content conflict'), a layer DEEPER than the
    // gate: the digest lives inside the stored objective the
    // fingerprint covers, so any byte change conflicts at the queue
    // door before the gate even runs. The gate stays as fail-closed
    // defense-in-depth; the refusal the door actually returns is the
    // queue's own.
    for (const [label, tampered] of [
      ['changed bytes', submission({ bodyText: DOC + '\n\nExtra paragraph.' })],
      ['changed title', submission({ title: 'Retitled' })],
      ['shortened body', submission({ bodyText: DOC.split('\n\n').slice(0, 2).join('\n\n') })],
    ] as const) {
      const refused = await runSupervisedReadingCycle(q, store, GENESIS, tampered, callerFor('never called'));
      assert.equal(refused.kind, 'SUPERVISED_READING_CYCLE_REFUSED', label);
      if (refused.kind !== 'SUPERVISED_READING_CYCLE_REFUSED') return;
      assert.ok(refused.reason.includes('content conflict'), `${label} — measured reason: ${refused.reason}`);
      assert.equal(refused.modelCalls, 0, `${label}: the model is never invoked on foreign bytes`);
    }
    // Missing story and bad ids refuse on the accessor itself.
    assert.equal(q.inspectStoryObjective(tenantId, 'doc-cont-doc-1-chunk-9'), null);
    assert.throws(() => q.inspectStoryObjective(tenantId, ''), /story identity required/);
    assert.throws(() => q.inspectStoryObjective('', 'doc-cont-doc-1-chunk-1'), /story identity required/);
  });
});

test('12d-287: a draft read on a continuation builds a receipt the queue verifies', async () => {
  await withQueue(async (dir, q) => {
    const store = registeredRegister();
    await runSupervisedReadingCycle(q, store, GENESIS, submission(), callerFor('Draft of chunk one.'));
    const packet = await runSupervisedReadingCycle(q, store, GENESIS, submission(), callerFor('Draft of chunk two.'));
    assert.equal(packet.kind, 'SUPERVISED_READING_CYCLE');
    if (packet.kind !== 'SUPERVISED_READING_CYCLE') return;
    const draftText = 'Draft of chunk two.';
    // The receipt chain (12D-285) binds the draft the operator holds —
    // here, the continuation's real settled draft — to the queue.
    const receipt = buildReadingDraftReceipt({
      tenantId, storyId: packet.storyId, documentId: packet.documentId,
      draftSha256: createHash('sha256').update(draftText, 'utf8').digest('hex'),
      draftText, model: packet.model,
    });
    const verified = verifyReadingDraftReceiptAgainstQueue(q, receipt);
    assert.equal(verified.kind, 'READING_DRAFT_RECEIPT_QUEUE_VERIFIED');
    assert.equal(verified.readyForReview, true);
    assert.equal(verified.storyId, 'doc-cont-doc-1-chunk-2');
    assert.equal(verified.humanDecision, 'REQUIRED');
  });
});

test('12d-287: pinned guardrails and determinism of the continuation refusal', async () => {
  await withQueue(async (dir, q) => {
    const store = registeredRegister();
    await runSupervisedReadingCycle(q, store, GENESIS, submission(), callerFor('Draft of chunk one.'));
    const r1 = await runSupervisedReadingCycle(q, store, GENESIS, submission({ bodyText: DOC + ' tampered' }), callerFor('never called'));
    const r2 = await runSupervisedReadingCycle(q, store, GENESIS, submission({ bodyText: DOC + ' tampered' }), callerFor('never called'));
    assert.equal(JSON.stringify(r1), JSON.stringify(r2));
  });
});