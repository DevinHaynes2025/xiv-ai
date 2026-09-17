// 12D-294 — adversarial suite for the reading review CLI. Every test
// drives the REAL contracts: a REAL AWAITING_REVIEW story is produced
// by the REAL 12D-283 supervised cycle with a stub caller (no model
// call, no network), and the CLI's door is the REAL queue acceptReview.
// Refusals are honest, verbatim, and write nothing.
import { strict as assert } from 'node:assert';
import { test } from 'node:test';
import { mkdtempSync, rmSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { OfflineStoryQueue } from './offline-story-queue';
import {
  registerReadingSource, type ReadingSourceStore,
} from './xiv-reading-source-register';
import { runSupervisedReadingCycle } from './xiv-supervised-reading-cycle';
import {
  parseReviewArgs, runReviewCommand,
  READING_REVIEW_CLI_POLICY, READING_REVIEW_CLI_GUARDRAILS,
} from './xiv-reading-review.cli';

const GENESIS = '12d-294-register-genesis';
const tenantId = 'reading-tenant';

class MemoryRegisterStore implements ReadingSourceStore {
  private lines: string[] | null = null;
  load(): readonly string[] | null { return this.lines; }
  save(lines: readonly string[]): void { this.lines = [...lines]; }
}

const pad = (seed: string): string => seed + '.'.repeat(Math.max(0, 1200 - seed.length));
const DOC = [
  pad('First paragraph of the reading review fixture.'),
  pad('Second paragraph of the reading review fixture.'),
  pad('Third paragraph of the reading review fixture.'),
].join('\n\n');

const stubCaller = async () => ({ model: 'qwen2.5-coder:7b', response: 'The chunk summarizes the review-fixture text in one bounded paragraph.' });

const base = ['--queue', '', '--tenant', tenantId, '--story', 'doc-review-doc-1-chunk-1',
  '--reviewer-role', 'secure_code_reviewer', '--review-ref', 'ceo-decision-2026-09-16-i-approve'];

function withQueue<T>(fn: (dir: string, q: OfflineStoryQueue) => Promise<T> | T): Promise<T> {
  return (async () => {
    const dir = mkdtempSync(join(tmpdir(), 'xiv-reading-review-'));
    const q = new OfflineStoryQueue(join(dir, 'q.sqlite'));
    try {
      return await fn(dir, q);
    } finally {
      try { q.close(); } catch { /* the test may already have closed it before a CLI re-open */ }
      rmSync(dir, { recursive: true, force: true });
    }
  })();
}

/** Produces a REAL AWAITING_REVIEW story via the REAL 12D-283 cycle. */
async function mkAwaitingReview(q: OfflineStoryQueue): Promise<string> {
  const store = new MemoryRegisterStore();
  registerReadingSource(store, GENESIS, {
    tenantId, sourceId: 'quantumlib-cirq',
    title: 'Cirq — open-source quantum circuit framework',
    sourceUrl: 'https://github.com/quantumlib/Cirq',
    sourceClass: 'OPEN_SOURCE_REPO',
    licenseNote: 'Apache 2.0 — public repository, cited verbatim',
  });
  const packet = await runSupervisedReadingCycle(q, store, GENESIS, {
    tenantId, sourceId: 'quantumlib-cirq', documentId: 'review-doc-1',
    title: 'Reading review fixture', bodyText: DOC,
  }, stubCaller);
  assert.equal(packet.kind, 'SUPERVISED_READING_CYCLE');
  if (packet.kind !== 'SUPERVISED_READING_CYCLE') throw new Error('unreachable');
  return packet.storyId;
}

test('12d-294: the parser enforces exactly the five flags, each once, with policy bounds', () => {
  const argv = ['--queue', 'q.sqlite', '--tenant', 't1', '--story', 's1', '--reviewer-role', 'secure_code_reviewer', '--review-ref', 'ref-1'];
  const args = parseReviewArgs(argv);
  assert.deepEqual({ ...args }, { queue: 'q.sqlite', tenant: 't1', story: 's1', reviewerRole: 'secure_code_reviewer', reviewRef: 'ref-1' });
  const bads: readonly string[][] = [
    argv.slice(2), // too few
    [...argv, '--extra', 'x'], // unknown
    ['--queue', 'a', '--queue', 'b', '--tenant', 't1', '--story', 's1', '--reviewer-role', 'r', '--review-ref', 'ref'], // duplicate
    ['--queue', 'a', '--tenant', '', '--story', 's1', '--reviewer-role', 'r', '--review-ref', 'ref'], // empty value
    ['--wat', 'x', '--tenant', 't1', '--story', 's1', '--reviewer-role', 'r', '--review-ref', 'ref'], // unknown flag
    ['--queue', 'a', '--tenant', 't1', '--story', 's1', '--reviewer-role', 'r', '--review-ref', 'r'.repeat(257)], // ref overlong
    ['--queue', 'a', '--tenant', 't1', '--story', 's1', '--reviewer-role', 'r', '--review-ref', '   '], // blank ref
    ['-queue', 'a', '--tenant', 't1', '--story', 's1', '--reviewer-role', 'r', '--review-ref', 'ref'], // malformed flag
  ];
  for (const bad of bads) {
    assert.throws(() => parseReviewArgs(bad), /fail closed|requires a value|unknown|duplicate|exceeds|non-empty|malformed/, `expected refusal for ${JSON.stringify(bad)}`);
  }
});

test('12d-294: a story NOT in the queue refuses honestly — nothing is reviewed and the queue closes cleanly', () => {
  const dir = mkdtempSync(join(tmpdir(), 'xiv-reading-review-fresh-'));
  try {
    const queuePath = join(dir, 'q.sqlite');
    const packet = runReviewCommand(['--queue', queuePath, '--tenant', tenantId, '--story', 'doc-review-doc-1-chunk-1', '--reviewer-role', 'secure_code_reviewer', '--review-ref', 'ref-1']);
    assert.equal(packet.kind, 'READING_REVIEW_REFUSED');
    if (packet.kind !== 'READING_REVIEW_REFUSED') throw new Error('unreachable');
    assert.match(packet.reason, /NO STORY/);
    assert.equal(packet.storyState, null);
    assert.equal(packet.modelCalls, 0);
    assert.equal(packet.remoteCalls, 0);
    // the queue file is usable afterwards (no lock, no partial write)
    const q2 = new OfflineStoryQueue(queuePath);
    assert.equal(q2.inspectStory(tenantId, 'doc-review-doc-1-chunk-1'), null);
    q2.close();
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test('12d-294: a story NOT in AWAITING_REVIEW refuses — the READY continuation chunk is never reviewed', async () => {
  await withQueue(async (dir, q) => {
    const storyId = await mkAwaitingReview(q);
    assert.equal(q.inspectStory(tenantId, storyId)?.state, 'AWAITING_REVIEW');
    // chunk-2 is READY, never reviewed
    const readyId = 'doc-review-doc-1-chunk-2';
    assert.equal(q.inspectStory(tenantId, readyId)?.state, 'READY');
    q.close();
    const packet = runReviewCommand(['--queue', join(dir, 'q.sqlite'), '--tenant', tenantId, '--story', readyId, '--reviewer-role', 'secure_code_reviewer', '--review-ref', 'ref-1']);
    assert.equal(packet.kind, 'READING_REVIEW_REFUSED');
    if (packet.kind !== 'READING_REVIEW_REFUSED') throw new Error('unreachable');
    assert.equal(packet.storyState, 'READY');
    assert.match(packet.reason, /not AWAITING_REVIEW/);
  });
});

test('12d-294: the REAL loop — a REAL AWAITING_REVIEW story is reviewed to DONE with the operator ref recorded', async () => {
  await withQueue(async (dir, q) => {
    const storyId = await mkAwaitingReview(q);
    const priorHash = q.inspectStory(tenantId, storyId)?.outputHash;
    assert.equal(typeof priorHash, 'string');
    q.close();
    const packet = runReviewCommand(['--queue', join(dir, 'q.sqlite'), '--tenant', tenantId, '--story', storyId, '--reviewer-role', 'secure_code_reviewer', '--review-ref', 'ceo-decision-2026-09-16-i-approve']);
    assert.equal(packet.kind, 'READING_REVIEW');
    if (packet.kind !== 'READING_REVIEW') throw new Error('unreachable');
    assert.equal(packet.priorState, 'AWAITING_REVIEW');
    assert.equal(packet.postState, 'DONE');
    assert.equal(packet.reviewerRoleId, 'secure_code_reviewer');
    assert.equal(packet.reviewRef, 'ceo-decision-2026-09-16-i-approve');
    assert.equal(packet.reviewRefRecordedAsOperatorMetadata, true);
    assert.equal(packet.modelCalls, 0);
    assert.equal(packet.remoteCalls, 0);
    assert.equal(packet.learningPromoted, false);
    // queue truth: DONE; the settled output hash is untouched by the review
    const q2 = new OfflineStoryQueue(join(dir, 'q.sqlite'));
    const row = (q2.page(tenantId, 0, 100) as unknown as readonly { id: string; state: string }[]).find((r) => r.id === storyId);
    assert.equal(row?.state, 'DONE');
    assert.equal(q2.inspectStory(tenantId, storyId)?.outputHash, priorHash);
    // a SECOND review of the now-DONE story refuses
    q2.close();
    const second = runReviewCommand(['--queue', join(dir, 'q.sqlite'), '--tenant', tenantId, '--story', storyId, '--reviewer-role', 'secure_code_reviewer', '--review-ref', 'ref-2']);
    assert.equal(second.kind, 'READING_REVIEW_REFUSED');
    if (second.kind !== 'READING_REVIEW_REFUSED') throw new Error('unreachable');
    assert.equal(second.storyState, 'DONE');
  });
});

test('12d-294: a NON-designated reviewer role refuses before anything is written', async () => {
  await withQueue(async (dir, q) => {
    const storyId = await mkAwaitingReview(q);
    q.close();
    const packet = runReviewCommand(['--queue', join(dir, 'q.sqlite'), '--tenant', tenantId, '--story', storyId, '--reviewer-role', 'local_reasoner', '--review-ref', 'ref-1']);
    assert.equal(packet.kind, 'READING_REVIEW_REFUSED');
    if (packet.kind !== 'READING_REVIEW_REFUSED') throw new Error('unreachable');
    assert.match(packet.reason, /NOT a designated reviewer/);
    assert.equal(packet.storyState, 'AWAITING_REVIEW'); // untouched
    // queue truth: still AWAITING_REVIEW
    const q2 = new OfflineStoryQueue(join(dir, 'q.sqlite'));
    assert.equal(q2.inspectStory(tenantId, storyId)?.state, 'AWAITING_REVIEW');
    q2.close();
  });
});

test('12d-294: the guardrails are pinned and the CLI source carries NO network primitive', () => {
  assert.equal(READING_REVIEW_CLI_POLICY.policyVersion, '12d-294-v1');
  assert.deepEqual([...READING_REVIEW_CLI_POLICY.flagOrder], ['--queue', '--tenant', '--story', '--reviewer-role', '--review-ref']);
  assert.equal(READING_REVIEW_CLI_GUARDRAILS.localIoOnly, true);
  assert.equal(READING_REVIEW_CLI_GUARDRAILS.noModelCallEver, true);
  assert.equal(READING_REVIEW_CLI_GUARDRAILS.noNetworkPrimitive, true);
  assert.equal(READING_REVIEW_CLI_GUARDRAILS.executorNotDecider, true);
  assert.equal(READING_REVIEW_CLI_GUARDRAILS.designatedReviewerOnly, true);
  assert.equal(READING_REVIEW_CLI_GUARDRAILS.modelCalls, 0);
  assert.equal(READING_REVIEW_CLI_GUARDRAILS.remoteCalls, 0);
  assert.equal(READING_REVIEW_CLI_GUARDRAILS.learningPromoted, false);
  assert.equal(READING_REVIEW_CLI_GUARDRAILS.activated, 0);
  assert.equal(READING_REVIEW_CLI_GUARDRAILS.automaticRecovery, false);
  assert.equal(READING_REVIEW_CLI_GUARDRAILS.billionUsersProven, false);
  assert.equal(READING_REVIEW_CLI_GUARDRAILS.humanDecision, 'REQUIRED');
  assert.equal(Object.isFrozen(READING_REVIEW_CLI_POLICY), true);
  assert.equal(Object.isFrozen(READING_REVIEW_CLI_GUARDRAILS), true);
  const source = readFileSync(join(process.cwd(), 'runtime', 'offline-team', 'xiv-reading-review.cli.ts'), 'utf8');
  assert.ok(!source.includes('fetch('), 'no fetch in the review CLI');
  assert.ok(!source.includes('127.0.0.1'), 'no endpoint literal in the review CLI');
  assert.ok(!source.includes('buildLoopbackCaller'), 'no caller import in the review CLI');
  assert.ok(!source.includes('node:fs'), 'no fs import in the review CLI');
  // the door is the REAL queue contract, not a reimplementation
  assert.ok(source.includes('acceptReview'), 'the CLI drives the REAL acceptReview door');
  assert.ok(source.includes('getEnterpriseRole'), 'the CLI re-checks the REAL workforce designation');
});