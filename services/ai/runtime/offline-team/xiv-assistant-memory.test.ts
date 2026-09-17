// 12D-305 — adversarial tests for the assistant agent-memory seam.
// Central properties under attack:
//   1. SEMANTIC MEMORY ONLY: a fact enters the mini brain exclusively
//      through independent review — READY/LEASED/AWAITING_REVIEW/FAILED
//      stories never appear, no matter how many of them there are.
//   2. THE QUEUE IS WALKED READ-ONLY: the door calls page() and nothing
//      else — a spy queue proves no write door is ever touched.
//   3. BOUNDS BITE AND ARE DISCLOSED: entry cap, objective truncation,
//      and scan truncation are all carried in the packet, never silent.
//   4. SECRETS NEVER ENTER MEMORY: a secret-shaped DONE objective
//      refuses the WHOLE read (defense in depth over the ingest screen).
//   5. STATELESS AND DETERMINISTIC: no clock, no randomness — two reads
//      over the same queue state are byte-identical.

import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createHash } from 'node:crypto';
import { OfflineStoryQueue, type OfflineStory } from './offline-story-queue';
import {
  ASSISTANT_MEMORY_GUARDRAILS,
  ASSISTANT_MEMORY_POLICY,
  MAX_MEMORY_ENTRIES,
  MAX_MEMORY_OBJECTIVE_CHARS,
  MAX_SCAN_ROWS,
  deriveAssistantMemoryDigest,
  prepareAssistantMemoryRead,
} from './xiv-assistant-memory';

const TENANT = 'memory-tenant';
const OUTPUT_SEED = 'c';

function hashOf(n: number): string {
  return createHash('sha256').update(`out-${n}`).digest('hex');
}

function makeStory(n: number, objective: string): OfflineStory {
  return {
    id: `fact-story-${String(n).padStart(3, '0')}`,
    tenantId: TENANT,
    roleId: 'memory_curator',
    objective,
    acceptance: ['the fact is bounded and screened'],
    dependencies: [],
    sourceRevision: 'a'.repeat(40),
    masterPlanSha256: 'b'.repeat(64),
    securityClass: 'ORDINARY',
    kind: 'PRODUCT_STORY',
  };
}

/** Fast queue-level fixture: enqueue → settle → review a story all the way
 *  to DONE with a distinct output hash (the real door chain, queue level). */
function makeDone(q: OfflineStoryQueue, n: number, objective: string, tenant = TENANT): string {
  const story = { ...makeStory(n, objective), tenantId: tenant };
  q.enqueue([story]);
  const lease = q.claimNext(tenant, 'memory_curator', 'worker-1', 120_000);
  assert.ok(lease, `story ${n} must be claimable`);
  const outputHash = hashOf(n);
  q.settle(lease!, { outcome: 'DRAFT', outputHash, providerSettled: true });
  q.applyReviewDecision({
    tenantId: tenant, storyId: story.id, reviewerId: 'secure_code_reviewer',
    expectedOutputHash: outputHash, decision: 'APPROVED', reviewRef: `review:${n}`,
  });
  return story.id;
}

function withQueue(fn: (q: OfflineStoryQueue) => void): void {
  const dir = mkdtempSync(join(tmpdir(), 'xiv-assistant-memory-'));
  const q = new OfflineStoryQueue(join(dir, 'q.sqlite'));
  try { fn(q); } finally { q.close(); rmSync(dir, { recursive: true, force: true }); }
}

test('12d-305: DONE facts enter the memory — reviewed-only, digest re-derivable, flags pinned', () => {
  withQueue((q) => {
    const a = makeDone(q, 1, 'The reviewed fact one.');
    const b = makeDone(q, 2, 'The reviewed fact two.');
    const p = prepareAssistantMemoryRead(q, { tenantId: TENANT });
    assert.equal(p.kind, 'ASSISTANT_MEMORY_READ');
    assert.equal(p.policyVersion, ASSISTANT_MEMORY_POLICY.policyVersion);
    assert.deepEqual(p.entries.map((e) => e.storyId), [a, b]);
    assert.deepEqual(p.entries.map((e) => e.outputHash), [hashOf(1), hashOf(2)]);
    assert.ok(p.entries.every((e) => e.objectiveTruncated === false));
    assert.equal(p.memoryDigest, deriveAssistantMemoryDigest(p.entries));
    assert.equal(p.modelCalls, 0);
    assert.equal(p.remoteCalls, 0);
    assert.equal(p.learningPromoted, false);
    assert.equal(p.activated, 0);
    assert.equal(p.humanDecision, 'REQUIRED');
    assert.equal(p.entriesTruncated, false);
    assert.equal(p.scannedTruncated, false);
  });
});

test('12d-305: SEMANTIC memory only — unreviewed states never enter the mini brain', () => {
  withQueue((q) => {
    makeDone(q, 1, 'Reviewed fact one.');
    q.enqueue([makeStory(2, 'Still READY — never claimed.')]);
    q.enqueue([makeStory(3, 'Claimed, then returned unstarted — back to READY.')]);
    const l3 = q.claimNext(TENANT, 'memory_curator', 'worker-1', 120_000);
    assert.ok(l3);
    q.returnUnstarted(l3!);
    q.enqueue([makeStory(4, 'Settled, awaiting review.')]);
    // story 3 is READY again; claim and settle story 4 to AWAITING_REVIEW.
    const l4 = q.claimNext(TENANT, 'memory_curator', 'worker-1', 120_000);
    assert.ok(l4);
    q.settle(l4!, { outcome: 'DRAFT', outputHash: hashOf(4), providerSettled: true });
    const p = prepareAssistantMemoryRead(q, { tenantId: TENANT });
    assert.deepEqual(p.entries.map((e) => e.storyId), ['fact-story-001']);
    assert.equal(p.doneCount, 1);
    assert.equal(p.scannedRows, 4, 'all rows are scanned; only DONE is carried');
  });
});

test('12d-305: TENANT-BOUND — another tenant\'s reviewed facts never appear', () => {
  withQueue((q) => {
    makeDone(q, 1, 'Mine.');
    makeDone(q, 2, 'Theirs.', 'other-tenant');
    const p = prepareAssistantMemoryRead(q, { tenantId: TENANT });
    assert.deepEqual(p.entries.map((e) => e.storyId), ['fact-story-001']);
    const other = prepareAssistantMemoryRead(q, { tenantId: 'other-tenant' });
    assert.deepEqual(other.entries.map((e) => e.storyId), ['fact-story-002']);
  });
});

test('12d-305: the entry cap bites DISCLOSED — most-recent reviewed facts carried', () => {
  withQueue((q) => {
    for (let i = 1; i <= MAX_MEMORY_ENTRIES + 2; i += 1) makeDone(q, i, `Fact ${i}.`);
    const p = prepareAssistantMemoryRead(q, { tenantId: TENANT });
    assert.equal(p.doneCount, MAX_MEMORY_ENTRIES + 2);
    assert.equal(p.entries.length, MAX_MEMORY_ENTRIES);
    assert.equal(p.entriesTruncated, true);
    assert.deepEqual(p.entries.map((e) => e.storyId),
      Array.from({ length: MAX_MEMORY_ENTRIES }, (_, i) => `fact-story-${String(i + 3).padStart(3, '0')}`));
  });
});

test('12d-305: objective truncation bites DISCLOSED', () => {
  withQueue((q) => {
    makeDone(q, 1, 'x'.repeat(MAX_MEMORY_OBJECTIVE_CHARS + 500));
    const p = prepareAssistantMemoryRead(q, { tenantId: TENANT });
    assert.equal(p.entries.length, 1);
    assert.equal(p.entries[0]!.objectiveTruncated, true);
    assert.equal(p.entries[0]!.objective.length, MAX_MEMORY_OBJECTIVE_CHARS);
  });
});

test('12d-305: the scan bound bites DISCLOSED', () => {
  withQueue((q) => {
    const stories: OfflineStory[] = [];
    for (let i = 1; i <= MAX_SCAN_ROWS + 5; i += 1) stories.push(makeStory(i, `Fact ${i}.`));
    q.enqueue(stories);
    for (let i = 1; i <= MAX_SCAN_ROWS + 5; i += 1) makeDone(q, i, `Fact ${i}.`);
    const p = prepareAssistantMemoryRead(q, { tenantId: TENANT });
    assert.equal(p.scannedRows, MAX_SCAN_ROWS);
    assert.equal(p.scannedTruncated, true);
    assert.equal(p.doneCount, MAX_SCAN_ROWS);
    assert.equal(p.entries.length, MAX_MEMORY_ENTRIES);
  });
});

test('12d-305: a secret-shaped DONE objective refuses the WHOLE read', () => {
  withQueue((q) => {
    makeDone(q, 1, 'Clean fact.');
    makeDone(q, 2, 'leak: sk-' + 'a'.repeat(24));
    assert.throws(() => prepareAssistantMemoryRead(q, { tenantId: TENANT }), /secret-shaped/);
  });
});

test('12d-305: the queue is walked READ-ONLY — a spy proves no write door is touched', () => {
  withQueue((q) => {
    makeDone(q, 1, 'Fact.');
    // Monkey-patched own-property wrappers record every queue method the
    // door touches and delegate to the prototype (the real instance keeps
    // its private #db brand, so a Proxy would break it).
    const touched: string[] = [];
    const proto = OfflineStoryQueue.prototype as unknown as Record<string, (...a: unknown[]) => unknown>;
    for (const name of ['page', 'enqueue', 'claimNext', 'settle', 'acceptReview', 'applyReviewDecision',
      'voidLease', 'recoverFailedStory', 'returnUnstarted', 'renewLease', 'close']) {
      const original = proto[name]!;
      (q as unknown as Record<string, unknown>)[name] = (...args: unknown[]) => {
        touched.push(name);
        return original.apply(q, args);
      };
    }
    const p = prepareAssistantMemoryRead(q, { tenantId: TENANT });
    assert.equal(p.entries.length, 1);
    const forbidden = ['enqueue', 'claimNext', 'settle', 'acceptReview', 'applyReviewDecision',
      'voidLease', 'recoverFailedStory', 'returnUnstarted', 'renewLease', 'close'];
    for (const door of forbidden) assert.ok(!touched.includes(door), `the write door ${door} must never be touched`);
    assert.deepEqual(touched, ['page']);
  });
});

test('12d-305: malformed requests, junk queues, and reordered keys refuse', () => {
  withQueue((q) => {
    assert.throws(() => prepareAssistantMemoryRead(null as unknown as OfflineStoryQueue, { tenantId: TENANT }), /trusted OfflineStoryQueue/);
    assert.throws(() => prepareAssistantMemoryRead(42 as unknown as OfflineStoryQueue, { tenantId: TENANT }), /trusted OfflineStoryQueue/);
    for (const bad of [null, undefined, 42, 'req', [], {}]) {
      assert.throws(() => prepareAssistantMemoryRead(q, bad as { tenantId: string }), /required|order|malformed/);
    }
    assert.throws(() => prepareAssistantMemoryRead(q, { tenantId: TENANT, smuggled: 1 } as { tenantId: string }), /in order/);
    assert.throws(() => prepareAssistantMemoryRead(q, { tenantId: 'UPPER NOT ALLOWED!' }), /malformed tenantId/);
    assert.throws(() => prepareAssistantMemoryRead(q, { tenantId: '' }), /malformed tenantId/);
  });
});

test('12d-305: deterministic — two reads over the same queue state are byte-identical', () => {
  withQueue((q) => {
    makeDone(q, 1, 'Fact one.');
    makeDone(q, 2, 'Fact two.');
    const a = JSON.stringify(prepareAssistantMemoryRead(q, { tenantId: TENANT }));
    const b = JSON.stringify(prepareAssistantMemoryRead(q, { tenantId: TENANT }));
    assert.equal(a, b);
  });
});

test('12d-305: packets and guardrails are frozen and pinned', () => {
  withQueue((q) => {
    makeDone(q, 1, 'Fact.');
    const p = prepareAssistantMemoryRead(q, { tenantId: TENANT });
    assert.ok(Object.isFrozen(p));
    assert.ok(Object.isFrozen(p.entries));
    assert.ok(Object.isFrozen(p.entries[0]));
    assert.ok(Object.isFrozen(ASSISTANT_MEMORY_POLICY));
    assert.ok(Object.isFrozen(ASSISTANT_MEMORY_GUARDRAILS));
    assert.equal(ASSISTANT_MEMORY_GUARDRAILS.readOnlyQueueAccess, true);
    assert.equal(ASSISTANT_MEMORY_GUARDRAILS.semanticMemoryOnly, true);
    assert.equal(ASSISTANT_MEMORY_GUARDRAILS.tenantBound, true);
    assert.equal(ASSISTANT_MEMORY_GUARDRAILS.boundedMemory, true);
    assert.equal(ASSISTANT_MEMORY_GUARDRAILS.secretScreenedBothWays, true);
    assert.equal(ASSISTANT_MEMORY_GUARDRAILS.disclosedTruncation, true);
    assert.equal(ASSISTANT_MEMORY_GUARDRAILS.noPromptSeamYet, true);
    assert.equal(ASSISTANT_MEMORY_GUARDRAILS.noWeightMutation, true);
    assert.equal(ASSISTANT_MEMORY_GUARDRAILS.noActivationPath, true);
    assert.equal(ASSISTANT_MEMORY_GUARDRAILS.modelCalls, 0);
    assert.equal(ASSISTANT_MEMORY_GUARDRAILS.remoteCalls, 0);
    assert.equal(ASSISTANT_MEMORY_GUARDRAILS.collectsNothing, true);
    assert.equal(ASSISTANT_MEMORY_GUARDRAILS.learningPromoted, false);
    assert.equal(ASSISTANT_MEMORY_GUARDRAILS.activated, 0);
    assert.equal(ASSISTANT_MEMORY_GUARDRAILS.automaticRecovery, false);
    assert.equal(ASSISTANT_MEMORY_GUARDRAILS.billionUsersProven, false);
    assert.equal(ASSISTANT_MEMORY_GUARDRAILS.humanDecision, 'REQUIRED');
  });
});

test('12d-305: source purity — the memory seam stays pure (no fs, no network, no clock)', () => {
  const src = readFileSync(join(import.meta.dirname.replace(/\\/g, '/'), 'xiv-assistant-memory.ts'), 'utf8');
  for (const banned of ['node:fs', 'node:path', 'fetch(', 'http://', 'https://', '127.0.0.1', '11434', 'Date.now', 'Math.random', 'child_process', 'XMLHttpRequest', 'WebSocket', 'require(']) {
    assert.ok(!src.includes(banned), `the memory seam must not contain ${banned}`);
  }
});