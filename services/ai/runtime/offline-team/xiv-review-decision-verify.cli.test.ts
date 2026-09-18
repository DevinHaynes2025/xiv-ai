// 12D-355 — adversarial tests for the review-decision-verify CLI.
// Central properties under attack:
//   1. WRITES-NOTHING: applyReviewDecision is NEVER called — the queue
//      bytes are identical before and after every run (tested).
//   2. REAL PARSER PARITY: the decisions file is parsed by the REAL
//      12D-324 contract's own parser — a file the verify CLI accepts,
//      the apply door parses identically.
//   3. SAME PRE-FLIGHT: verdicts mirror the apply door's own checks —
//      unknown story, wrong state, stale/tampered hash,
//      non-designated reviewer — with the door's own wording.
//   4. FIRST-FAILURE-DOES-NOT-STOP: every entry gets a verdict, so all
//      problems surface at once (the APPLY door stays all-or-nothing).
//   5. MISSING FILES REFUSE, NEVER CREATED.

import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, writeFileSync, readFileSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createHash } from 'node:crypto';
import {
  REVIEW_DECISION_VERIFY_CLI_GUARDRAILS,
  REVIEW_DECISION_VERIFY_CLI_POLICY,
  runReviewDecisionVerifyCommand,
} from './xiv-review-decision-verify.cli';
import { OfflineStoryQueue, type OfflineStory } from './offline-story-queue';

const TENANT = 'verify-tenant';
const REVIEWER = 'secure_code_reviewer'; // memory_curator's REAL designated reviewer

function makeStory(n: number, objective: string): OfflineStory {
  return {
    id: `draft-story-${String(n).padStart(3, '0')}`,
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

function withWorkspace(fn: (dir: string) => void): void {
  const dir = mkdtempSync(join(tmpdir(), 'xiv-verify-cli-'));
  try { fn(dir); } finally { rmSync(dir, { recursive: true, force: true }); }
}

interface Fixture {
  queuePath: string;
  ids: [string, string, string];
  hashes: [string, string, string];
}
/** A queue with 3 AWAITING_REVIEW stories; returns their ids and settled hashes. */
function verifyQueue(dir: string): Fixture {
  const queuePath = join(dir, 'queue.sqlite');
  const q = new OfflineStoryQueue(queuePath);
  const ids: string[] = [];
  const hashes: string[] = [];
  try {
    for (let i = 1; i <= 3; i += 1) {
      const story = makeStory(i, `READ AND SUMMARIZE reviewed fact ${i}`);
      q.enqueue([story]);
      const lease = q.claimNext(TENANT, 'memory_curator', 'worker-1', 120_000);
      assert.ok(lease);
      q.settle(lease!, { outcome: 'DRAFT', outputHash: createHash('sha256').update(`out-${i}`).digest('hex'), providerSettled: true });
      ids.push(story.id);
      hashes.push(createHash('sha256').update(`out-${i}`).digest('hex'));
    }
  } finally { q.close(); }
  return { queuePath, ids: ids as Fixture['ids'], hashes: hashes as Fixture['ids'] };
}

function decisionJson(storyId: string, hash: string, decision = 'APPROVED', reviewRef = 'ceo-blanket-approval-2026-09-17c-i-approve', reviewerId = REVIEWER): string {
  // Exact key order [storyId, reviewerId, decision, expectedOutputHash, reviewRef].
  return JSON.stringify({ storyId, reviewerId, decision, expectedOutputHash: hash, reviewRef });
}

test('12d-355: guardrails pinned — read-only dry run, real parser parity, first-failure-does-not-stop', () => {
  assert.equal(REVIEW_DECISION_VERIFY_CLI_GUARDRAILS.readOnly, true);
  assert.equal(REVIEW_DECISION_VERIFY_CLI_GUARDRAILS.queueTouchedNever, true);
  assert.equal(REVIEW_DECISION_VERIFY_CLI_GUARDRAILS.samePreflightAsTheApplyDoor, true);
  assert.equal(REVIEW_DECISION_VERIFY_CLI_GUARDRAILS.realParserParity, true);
  assert.equal(REVIEW_DECISION_VERIFY_CLI_GUARDRAILS.firstFailureDoesNotStop, true);
  assert.equal(REVIEW_DECISION_VERIFY_CLI_GUARDRAILS.missingFileRefuses, true);
  assert.equal(REVIEW_DECISION_VERIFY_CLI_GUARDRAILS.modelCalls, 0);
  assert.equal(REVIEW_DECISION_VERIFY_CLI_GUARDRAILS.remoteCalls, 0);
  assert.equal(REVIEW_DECISION_VERIFY_CLI_GUARDRAILS.humanDecision, 'REQUIRED');
  assert.equal(REVIEW_DECISION_VERIFY_CLI_POLICY.policyVersion, '12d-355-v1');
  assert.equal(REVIEW_DECISION_VERIFY_CLI_POLICY.flagOrder.length, 3);
  const flags = REVIEW_DECISION_VERIFY_CLI_POLICY.flagOrder as readonly string[];
  assert.ok(!flags.includes('--apply')); // the verify CLI NEVER applies
  assert.ok(!flags.includes('--write'));
});

test('12d-355: parser discipline — exact flags, each once, valued; tenant id-shaped', () => {
  const base = ['--queue', 'q', '--tenant', 't', '--decisions', 'd.json'];
  assert.throws(() => runReviewDecisionVerifyCommand(base.slice(0, -2)), /fail closed/);
  assert.throws(() => runReviewDecisionVerifyCommand([...base, '--extra', 'x']), /fail closed/);
  assert.throws(() => runReviewDecisionVerifyCommand(base.map((v, i) => (i === 0 ? '--smuggled' : v))), /unknown flag/);
  assert.throws(() => runReviewDecisionVerifyCommand(base.map((v, i) => (i === 2 ? '--queue' : v))), /duplicate flag/);
  assert.throws(() => runReviewDecisionVerifyCommand(base.map((v) => (v === 'q' ? '' : v))), /requires a value/);
  assert.throws(() => runReviewDecisionVerifyCommand(base.map((v) => (v === 't' ? 'bad id!' : v))), /tenant id/);
});

test('12d-355: missing files refuse and are never created', () => {
  withWorkspace((dir) => {
    const missingQueue = runReviewDecisionVerifyCommand(['--queue', join(dir, 'absent.sqlite'), '--tenant', TENANT, '--decisions', join(dir, 'd.json')]);
    assert.equal(missingQueue.kind, 'REVIEW_DECISIONS_VERIFY_REFUSED');
    if (missingQueue.kind === 'REVIEW_DECISIONS_VERIFY_REFUSED') assert.match(missingQueue.reason, /queue file does not exist/);
    assert.equal(existsSync(join(dir, 'absent.sqlite')), false);
    assert.equal(existsSync(join(dir, 'd.json')), false); // never invented either

    const { queuePath } = verifyQueue(dir);
    const missingDecisions = runReviewDecisionVerifyCommand(['--queue', queuePath, '--tenant', TENANT, '--decisions', join(dir, 'absent.json')]);
    assert.equal(missingDecisions.kind, 'REVIEW_DECISIONS_VERIFY_REFUSED');
    if (missingDecisions.kind === 'REVIEW_DECISIONS_VERIFY_REFUSED') assert.match(missingDecisions.reason, /decisions file does not exist/);
  });
});

test('12d-355: the decisions file is parsed by the REAL apply contract\'s parser — empty, junk, and malformed refusals carry its wording', () => {
  withWorkspace((dir) => {
    const { queuePath } = verifyQueue(dir);
    const emptyPath = join(dir, 'empty.json');
    writeFileSync(emptyPath, '');
    const empty = runReviewDecisionVerifyCommand(['--queue', queuePath, '--tenant', TENANT, '--decisions', emptyPath]);
    assert.equal(empty.kind, 'REVIEW_DECISIONS_VERIFY_REFUSED');
    if (empty.kind === 'REVIEW_DECISIONS_VERIFY_REFUSED') assert.match(empty.reason, /empty/);

    const junkPath = join(dir, 'junk.json');
    writeFileSync(junkPath, 'not-json{{');
    const junk = runReviewDecisionVerifyCommand(['--queue', queuePath, '--tenant', TENANT, '--decisions', junkPath]);
    assert.equal(junk.kind, 'REVIEW_DECISIONS_VERIFY_REFUSED');
    if (junk.kind === 'REVIEW_DECISIONS_VERIFY_REFUSED') assert.match(junk.reason, /does not parse as JSON/);

    const badKeyOrderPath = join(dir, 'bad-order.json');
    writeFileSync(badKeyOrderPath, `[${JSON.stringify({ reviewerId: REVIEWER, storyId: 's', decision: 'APPROVED', expectedOutputHash: 'a'.repeat(64), reviewRef: 'r' })}]`);
    const badOrder = runReviewDecisionVerifyCommand(['--queue', queuePath, '--tenant', TENANT, '--decisions', badKeyOrderPath]);
    assert.equal(badOrder.kind, 'REVIEW_DECISIONS_VERIFY_REFUSED');
    if (badOrder.kind === 'REVIEW_DECISIONS_VERIFY_REFUSED') assert.match(badOrder.reason, /in order/);
  });
});

test('12d-355: first-failure-does-not-stop — unknown story, stale hash, and wrong reviewer ALL surface in one run', () => {
  withWorkspace((dir) => {
    const { queuePath, ids, hashes } = verifyQueue(dir);
    const before = readFileSync(queuePath);
    const decisionsPath = join(dir, 'mixed.json');
    writeFileSync(decisionsPath, `[\n${decisionJson('no-such-story', hashes[0]!)},\n${decisionJson(ids[1]!, 'f'.repeat(64))},\n${decisionJson(ids[2]!, hashes[2]!, 'APPROVED', 'ref', 'not_the_designated_reviewer')}\n]`);
    const packet = runReviewDecisionVerifyCommand(['--queue', queuePath, '--tenant', TENANT, '--decisions', decisionsPath]);
    assert.equal(packet.kind, 'REVIEW_DECISIONS_VERIFIED');
    if (packet.kind !== 'REVIEW_DECISIONS_VERIFIED') return;
    assert.equal(packet.checked, 3);
    assert.equal(packet.verified, false);
    assert.equal(packet.verifiedCount, 0);
    assert.equal(packet.failedCount, 3);
    assert.equal(packet.queueNeverWritten, true);
    assert.match(packet.verdicts[0]!.reason, /does not hold/);
    assert.equal(packet.verdicts[0]!.wouldApply, false);
    assert.match(packet.verdicts[1]!.reason, /not being held at the claimed output hash/);
    assert.match(packet.verdicts[2]!.reason, /not one of role/);
    assert.match(packet.stoppedBefore, /READ-ONLY dry run/);
    // The queue bytes are identical — nothing was written.
    assert.ok(before.equals(readFileSync(queuePath)));
  });
});

test('12d-355: verified dry run — every entry would pass the REAL door\'s pre-flight, queue untouched', () => {
  withWorkspace((dir) => {
    const { queuePath, ids, hashes } = verifyQueue(dir);
    const before = readFileSync(queuePath);
    const decisionsPath = join(dir, 'good.json');
    writeFileSync(decisionsPath, `[\n${decisionJson(ids[0]!, hashes[0]!)},\n${decisionJson(ids[1]!, hashes[1]!, 'CHANGES_REQUESTED')},\n${decisionJson(ids[2]!, hashes[2]!, 'REJECTED')}\n]`);
    const packet = runReviewDecisionVerifyCommand(['--queue', queuePath, '--tenant', TENANT, '--decisions', decisionsPath]);
    assert.equal(packet.kind, 'REVIEW_DECISIONS_VERIFIED');
    if (packet.kind !== 'REVIEW_DECISIONS_VERIFIED') return;
    assert.equal(packet.policyVersion, REVIEW_DECISION_VERIFY_CLI_POLICY.policyVersion);
    assert.equal(packet.tenantId, TENANT);
    assert.equal(packet.verified, true);
    assert.equal(packet.verifiedCount, 3);
    assert.equal(packet.failedCount, 0);
    for (const v of packet.verdicts) {
      assert.equal(v.wouldApply, true);
      assert.equal(v.reason, '');
      assert.match(v.decision, /^(APPROVED|CHANGES_REQUESTED|REJECTED)$/);
      assert.equal(v.reviewerId, REVIEWER);
    }
    // The queue is untouched, byte for byte, and every story is still
    // AWAITING_REVIEW — the dry run decided nothing.
    const q = new OfflineStoryQueue(queuePath);
    try {
      for (const id of ids) assert.equal(q.inspectStory(TENANT, id)!.state, 'AWAITING_REVIEW');
    } finally { q.close(); }
    assert.ok(before.equals(readFileSync(queuePath)));
    assert.equal(packet.modelCalls, 0);
    assert.equal(packet.humanDecision, 'REQUIRED');
  });
});

test('12d-355: a mixed batch reports the good entries as applicable AND the queue stays untouched', () => {
  withWorkspace((dir) => {
    const { queuePath, ids, hashes } = verifyQueue(dir);
    const decisionsPath = join(dir, 'partial.json');
    writeFileSync(decisionsPath, `[\n${decisionJson(ids[0]!, hashes[0]!)},\n${decisionJson('no-such-story', hashes[1]!)}\n]`);
    const packet = runReviewDecisionVerifyCommand(['--queue', queuePath, '--tenant', TENANT, '--decisions', decisionsPath]);
    assert.equal(packet.kind, 'REVIEW_DECISIONS_VERIFIED');
    if (packet.kind !== 'REVIEW_DECISIONS_VERIFIED') return;
    assert.equal(packet.verified, false);
    assert.equal(packet.verifiedCount, 1);
    assert.equal(packet.failedCount, 1);
    assert.equal(packet.verdicts[0]!.wouldApply, true);
    assert.equal(packet.verdicts[1]!.wouldApply, false);
    // The dry run NEVER applies the good entry — the human still has to
    // run the REAL door (all-or-nothing) themselves.
    const q = new OfflineStoryQueue(queuePath);
    try { assert.equal(q.inspectStory(TENANT, ids[0]!)!.state, 'AWAITING_REVIEW'); } finally { q.close(); }
  });
});