// 12D-283 — adversarial tests for the supervised reading cycle.
// Central properties under attack:
//   1. ONE CHUNK PER INVOCATION, STOP BEFORE REVIEW: a verified cycle
//      settles exactly one draft AWAITING_REVIEW; the remaining chunks
//      stay READY; review/269/264 never run here.
//   2. THE REAL CONTRACTS DO THE WORK: an unregistered source refuses
//      (NO REGISTER NO BINDING); a duplicate document refuses; the
//      queue head is the truth (a non-head story is never jumped).
//   3. THE DOOR NEVER THROWS: every refusal is an honest REFUSED packet
//      with MEASURED queue-truth state (FAILED ⇒ the provider call
//      happened, modelCalls 1, durable; READY ⇒ pre-call, modelCalls 0)
//      and ZERO document text.
//   4. HONEST FLAGS on every packet shape.

import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { OfflineStoryQueue } from './offline-story-queue';
import {
  registerReadingSource, type ReadingSourceStore,
} from './xiv-reading-source-register';
import {
  SUPERVISED_READING_CYCLE_POLICY, SUPERVISED_READING_CYCLE_GUARDRAILS,
  runSupervisedReadingCycle,
} from './xiv-supervised-reading-cycle';
import { prepareDocumentStories } from './xiv-document-ingest';
import { admitBoundReading } from './xiv-bound-admission';

const GENESIS = '12d-283-register-genesis';
const tenantId = 'reading-tenant';

class MemoryRegisterStore implements ReadingSourceStore {
  private lines: string[] | null = null;
  load(): readonly string[] | null { return this.lines; }
  save(lines: readonly string[]): void { this.lines = [...lines]; }
}

const pad = (seed: string): string => seed + '.'.repeat(Math.max(0, 1200 - seed.length));
const DOC = [
  pad('First paragraph of the supervised cycle reading.'),
  pad('Second paragraph of the supervised cycle reading.'),
  pad('Third paragraph of the supervised cycle reading.'),
].join('\n\n');

/** Registers the cirq source on a fresh register store. */
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

const goodCaller = async () => ({ model: 'qwen2.5-coder:7b', response: 'The chunk introduces the reading-cycle fixture text in one bounded summary.' });

const submission = (overrides: Record<string, unknown> = {}): Record<string, unknown> => ({
  tenantId, sourceId: 'quantumlib-cirq', documentId: 'cycle-doc-1',
  title: 'Supervised cycle reading', bodyText: DOC, ...overrides,
});

function withQueue<T>(fn: (dir: string, q: OfflineStoryQueue) => Promise<T> | T): Promise<T> {
  return (async () => {
    const dir = mkdtempSync(join(tmpdir(), 'xiv-reading-cycle-'));
    const q = new OfflineStoryQueue(join(dir, 'q.sqlite'));
    try {
      return await fn(dir, q);
    } finally { q.close(); rmSync(dir, { recursive: true, force: true }); }
  })();
}

test('12d-283: a verified cycle settles exactly ONE draft and stops before review', async () => {
  await withQueue(async (dir, q) => {
    const store = registeredRegister();
    const packet = await runSupervisedReadingCycle(q, store, GENESIS, submission(), goodCaller);
    assert.equal(packet.kind, 'SUPERVISED_READING_CYCLE');
    if (packet.kind !== 'SUPERVISED_READING_CYCLE') return;
    assert.equal(packet.storyId, 'doc-cycle-doc-1-chunk-1');
    assert.equal(packet.storyState, 'AWAITING_REVIEW');
    assert.deepEqual(packet.chunks, { prepared: 3, inserted: 3, duplicates: 0 });
    assert.equal(packet.remainingReady, 2, 'exactly one chunk was read; the rest stay READY');
    assert.equal(packet.model, 'qwen2.5-coder:7b');
    assert.equal(packet.loopbackEndpoint, '127.0.0.1:11434');
    assert.equal(packet.modelCalls, 1);
    assert.equal(packet.remoteCalls, 0);
    assert.equal(packet.activated, 0);
    assert.equal(packet.learningPromoted, false);
    assert.equal(packet.modelWeightMutation, false);
    assert.equal(packet.humanDecision, 'REQUIRED');
    assert.ok(packet.stoppedBefore.includes('12D-269'));
    assert.ok(packet.stoppedBefore.includes('12D-264'));
    // Queue truth: the read chunk is AWAITING_REVIEW; chunks 2-3 READY.
    assert.equal(q.inspectStory(tenantId, 'doc-cycle-doc-1-chunk-1')?.state, 'AWAITING_REVIEW');
    assert.equal(q.inspectStory(tenantId, 'doc-cycle-doc-1-chunk-2')?.state, 'READY');
    assert.equal(q.inspectStory(tenantId, 'doc-cycle-doc-1-chunk-3')?.state, 'READY');
    assert.equal(q.inspectHeldLease(), null, 'no lease is held after the cycle');
  });
});

test('12d-283: an unregistered source refuses — NO REGISTER NO BINDING, measured state null', async () => {
  await withQueue(async (dir, q) => {
    const packet = await runSupervisedReadingCycle(q, registeredRegister(), GENESIS, submission({ sourceId: 'not-registered' }), goodCaller);
    assert.equal(packet.kind, 'SUPERVISED_READING_CYCLE_REFUSED');
    if (packet.kind !== 'SUPERVISED_READING_CYCLE_REFUSED') return;
    assert.ok(packet.reason.includes('NO REGISTER, NO BINDING'));
    assert.equal(packet.storyState, null);
    assert.equal(packet.modelCalls, 0);
    assert.equal(packet.remoteCalls, 0);
    assert.equal(packet.learningPromoted, false);
    assert.equal(packet.humanDecision, 'REQUIRED');
  });
});

test('12d-283: a duplicate document refuses — a document is read once', async () => {
  await withQueue(async (dir, q) => {
    const store = registeredRegister();
    const first = await runSupervisedReadingCycle(q, store, GENESIS, submission(), goodCaller);
    assert.equal(first.kind, 'SUPERVISED_READING_CYCLE');
    const second = await runSupervisedReadingCycle(q, store, GENESIS, submission(), goodCaller);
    assert.equal(second.kind, 'SUPERVISED_READING_CYCLE_REFUSED');
    if (second.kind !== 'SUPERVISED_READING_CYCLE_REFUSED') return;
    assert.ok(second.reason.includes('already admitted'));
    assert.equal(second.modelCalls, 0, 'the duplicate refusal happens before any provider call');
  });
});

test('12d-283: the queue head is the truth — a non-head story is refused, never jumped', async () => {
  await withQueue(async (dir, q) => {
    const store = registeredRegister();
    // Another document is admitted FIRST, so the queue's head belongs
    // to it; the cycle's document must wait its turn.
    const firstPrepared = prepareDocumentStories({ tenantId, documentId: 'cycle-doc-0', title: 'Earlier reading', bodyText: pad('Earlier document body.').slice(0, 2400) });
    admitBoundReading(q, store, GENESIS, firstPrepared, {
      tenantId, sourceId: 'quantumlib-cirq', documentId: 'cycle-doc-0',
      documentDigestSha256: firstPrepared.documentDigestSha256,
    });
    const packet = await runSupervisedReadingCycle(q, store, GENESIS, submission(), goodCaller);
    assert.equal(packet.kind, 'SUPERVISED_READING_CYCLE_REFUSED');
    if (packet.kind !== 'SUPERVISED_READING_CYCLE_REFUSED') return;
    assert.ok(packet.reason.includes('never jumps the queue'));
    assert.equal(packet.modelCalls, 0, 'the head mismatch is a pre-call refusal');
    assert.equal(packet.storyState, 'READY', 'the refused story stays READY, untouched');
    assert.equal(q.inspectStory(tenantId, 'doc-cycle-doc-1-chunk-1')?.state, 'READY');
  });
});

test('12d-283: a wrong-model caller settles FAILED durably — the refusal is honest, no retry', async () => {
  await withQueue(async (dir, q) => {
    const packet = await runSupervisedReadingCycle(q, registeredRegister(), GENESIS, submission(), async () => ({ model: 'some-other-model', response: 'draft' }));
    assert.equal(packet.kind, 'SUPERVISED_READING_CYCLE_REFUSED');
    if (packet.kind !== 'SUPERVISED_READING_CYCLE_REFUSED') return;
    assert.ok(packet.reason.includes('only the policy model'));
    assert.equal(packet.storyState, 'FAILED', 'measured from the queue: the provider call happened');
    assert.equal(packet.modelCalls, 1, 'a FAILED story means the call was made');
  });
});

test('12d-283: a caller that throws (connection refused) settles FAILED durably', async () => {
  await withQueue(async (dir, q) => {
    const packet = await runSupervisedReadingCycle(q, registeredRegister(), GENESIS, submission(), async () => { throw new Error('connect ECONNREFUSED 127.0.0.1:11434'); });
    assert.equal(packet.kind, 'SUPERVISED_READING_CYCLE_REFUSED');
    if (packet.kind !== 'SUPERVISED_READING_CYCLE_REFUSED') return;
    assert.ok(packet.reason.includes('ECONNREFUSED'));
    assert.equal(packet.storyState, 'FAILED');
    assert.equal(packet.modelCalls, 1);
  });
});

test('12d-283: credential-shaped submissions refuse before anything is prepared', async () => {
  await withQueue(async (dir, q) => {
    const packet = await runSupervisedReadingCycle(q, registeredRegister(), GENESIS, submission({ bodyText: 'sk-abcdefghijklmnopqrst key material' }), goodCaller);
    assert.equal(packet.kind, 'SUPERVISED_READING_CYCLE_REFUSED');
    if (packet.kind !== 'SUPERVISED_READING_CYCLE_REFUSED') return;
    assert.ok(packet.reason.includes('credential-shaped'));
    assert.equal(packet.storyState, null);
    assert.equal(packet.modelCalls, 0);
  });
});

test('12d-283: malformed submissions refuse and never throw', async () => {
  await withQueue(async (dir, q) => {
    const store = registeredRegister();
    assert.equal((await runSupervisedReadingCycle(q, store, GENESIS, null, goodCaller)).kind, 'SUPERVISED_READING_CYCLE_REFUSED');
    assert.equal((await runSupervisedReadingCycle(q, store, GENESIS, 42, goodCaller)).kind, 'SUPERVISED_READING_CYCLE_REFUSED');
    assert.equal((await runSupervisedReadingCycle(q, store, GENESIS, submission({ extra: 1 }), goodCaller)).kind, 'SUPERVISED_READING_CYCLE_REFUSED', 'extra key');
    assert.equal((await runSupervisedReadingCycle('not-a-queue', store, GENESIS, submission(), goodCaller)).kind, 'SUPERVISED_READING_CYCLE_REFUSED');
    assert.equal((await runSupervisedReadingCycle(q, store, 'short', submission(), goodCaller)).kind, 'SUPERVISED_READING_CYCLE_REFUSED');
    assert.equal((await runSupervisedReadingCycle(q, store, GENESIS, submission(), 'not-a-caller')).kind, 'SUPERVISED_READING_CYCLE_REFUSED');
    // Reordered keys refuse (exact keys in order).
    const reordered = { bodyText: DOC, title: 't', documentId: 'd', sourceId: 'quantumlib-cirq', tenantId };
    assert.equal((await runSupervisedReadingCycle(q, store, GENESIS, reordered, goodCaller)).kind, 'SUPERVISED_READING_CYCLE_REFUSED');
  });
});

test('12d-283: a held lease refuses honestly — nothing auto-advances', async () => {
  await withQueue(async (dir, q) => {
    const store = registeredRegister();
    // Another worker holds the singleton lease on a DIFFERENT document's
    // story: the cycle admits its own document fresh (duplicates 0), but
    // the first reader's claim returns nothing — the cycle returns an
    // honest refusal (never polls, never waits, never recovers on its own).
    const earlier = prepareDocumentStories({ tenantId, documentId: 'cycle-doc-0', title: 'Earlier reading', bodyText: pad('Earlier document body.') });
    admitBoundReading(q, store, GENESIS, earlier, {
      tenantId, sourceId: 'quantumlib-cirq', documentId: 'cycle-doc-0',
      documentDigestSha256: earlier.documentDigestSha256,
    });
    const lease = q.claimNext(tenantId, 'memory_curator', 'other-worker', 120000);
    assert.ok(lease, 'the other worker holds the lease');
    const packet = await runSupervisedReadingCycle(q, store, GENESIS, submission(), goodCaller);
    assert.equal(packet.kind, 'SUPERVISED_READING_CYCLE_REFUSED');
    if (packet.kind !== 'SUPERVISED_READING_CYCLE_REFUSED') return;
    assert.ok(packet.reason.includes('no READY story'));
    assert.notEqual(packet.storyState, null);
    assert.equal(packet.modelCalls, 0, 'measured from the queue truth: no provider call happened');
  });
});

test('12d-283: determinism and pinned policy/guardrails', async () => {
  await withQueue(async (dir, q) => {
    const store = registeredRegister();
    const a = await runSupervisedReadingCycle(q, store, GENESIS, submission(), goodCaller);
    const b = await runSupervisedReadingCycle(q, store, GENESIS, submission(), goodCaller);
    assert.equal(b.kind, 'SUPERVISED_READING_CYCLE_REFUSED', 'the second invocation hits the duplicate gate');
    if (a.kind !== 'SUPERVISED_READING_CYCLE') return;
    assert.equal(SUPERVISED_READING_CYCLE_POLICY.policyVersion, '12d-283-v1');
    assert.equal(SUPERVISED_READING_CYCLE_POLICY.chunksPerCycle, 1);
    assert.equal(SUPERVISED_READING_CYCLE_POLICY.documentsPerCycle, 1);
    assert.equal(SUPERVISED_READING_CYCLE_GUARDRAILS.oneChunkPerInvocation, true);
    assert.equal(SUPERVISED_READING_CYCLE_GUARDRAILS.stopsBeforeReview, true);
    assert.equal(SUPERVISED_READING_CYCLE_GUARDRAILS.realContractsOnly, true);
    assert.equal(SUPERVISED_READING_CYCLE_GUARDRAILS.bindsToRegisteredSourcesOnly, true);
    assert.equal(SUPERVISED_READING_CYCLE_GUARDRAILS.duplicateAdmissionRefuses, true);
    assert.equal(SUPERVISED_READING_CYCLE_GUARDRAILS.queueHeadIsTheTruth, true);
    assert.equal(SUPERVISED_READING_CYCLE_GUARDRAILS.neverThrowsReturnsRefused, true);
    assert.equal(SUPERVISED_READING_CYCLE_GUARDRAILS.refusedCarriesZeroDocumentText, true);
    assert.equal(SUPERVISED_READING_CYCLE_GUARDRAILS.measuredStateFromQueueTruth, true);
    assert.equal(SUPERVISED_READING_CYCLE_GUARDRAILS.noSilentRetry, true);
    assert.equal(SUPERVISED_READING_CYCLE_GUARDRAILS.automaticRecovery, false);
    assert.equal(SUPERVISED_READING_CYCLE_GUARDRAILS.remoteCalls, 0);
    assert.equal(SUPERVISED_READING_CYCLE_GUARDRAILS.modelCallsCountedNotPinnedZero, true);
    assert.equal(SUPERVISED_READING_CYCLE_GUARDRAILS.learningPromoted, false);
    assert.equal(SUPERVISED_READING_CYCLE_GUARDRAILS.activated, 0);
    assert.equal(SUPERVISED_READING_CYCLE_GUARDRAILS.modelWeightMutation, false);
    assert.equal(SUPERVISED_READING_CYCLE_GUARDRAILS.humanDecision, 'REQUIRED');
    assert.equal(SUPERVISED_READING_CYCLE_GUARDRAILS.billionUsersProven, false);
    // A refusal is deterministic too (measured reason, no randomness).
    const r1 = await runSupervisedReadingCycle(q, store, GENESIS, null, goodCaller);
    const r2 = await runSupervisedReadingCycle(q, store, GENESIS, null, goodCaller);
    assert.equal(JSON.stringify(r1), JSON.stringify(r2));
  });
});