// 12D-357 — adversarial tests for the review-operator-loop CLI.
// Central properties under attack:
//   1. APPLIES-NOTHING: the loop chains the REAL 12D-323/354/355
//      contracts by import and NEVER writes the queue — bytes
//      identical before/after, stories stay AWAITING_REVIEW (tested).
//   2. STAGE REFUSALS PROPAGATE: a missing queue refuses at the
//      worksheet stage; a non-designated reviewer refuses at the prep
//      stage — each with the stage contract's OWN wording, wrapped
//      with its stage name.
//   3. TEMP WORKSPACE DELETED: the private mkdtemp scratch is gone
//      after every run, success or refusal.
//   4. PARSER DISCIPLINE: exactly five flags, each once, valued.

import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, existsSync, readdirSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createHash } from 'node:crypto';
import {
  REVIEW_OPERATOR_LOOP_CLI_GUARDRAILS,
  REVIEW_OPERATOR_LOOP_CLI_POLICY,
  runReviewOperatorLoopCommand,
} from './xiv-review-operator-loop.cli';
import { OfflineStoryQueue, type OfflineStory } from './offline-story-queue';

const TENANT = 'loop-tenant';
const REVIEWER = 'secure_code_reviewer'; // memory_curator's REAL designated reviewer
const REF = 'ceo-blanket-approval-2026-09-17g-i-approve-the-new-drafts-too';

function makeStory(n: number): OfflineStory {
  return {
    id: `draft-story-${String(n).padStart(3, '0')}`,
    tenantId: TENANT,
    roleId: 'memory_curator',
    objective: `READ AND SUMMARIZE reviewed fact ${n}`,
    acceptance: ['the fact is bounded and screened'],
    dependencies: [],
    sourceRevision: 'a'.repeat(40),
    masterPlanSha256: 'b'.repeat(64),
    securityClass: 'ORDINARY',
    kind: 'PRODUCT_STORY',
  };
}

function withWorkspace(fn: (dir: string) => void): void {
  const dir = mkdtempSync(join(tmpdir(), 'xiv-loop-cli-'));
  try { fn(dir); } finally { rmSync(dir, { recursive: true, force: true }); }
}

/** A queue with 3 AWAITING_REVIEW stories. */
function loopQueue(dir: string): string {
  const queuePath = join(dir, 'queue.sqlite');
  const q = new OfflineStoryQueue(queuePath);
  try {
    for (let i = 1; i <= 3; i += 1) {
      const story = makeStory(i);
      q.enqueue([story]);
      const lease = q.claimNext(TENANT, 'memory_curator', 'worker-1', 120_000);
      assert.ok(lease);
      q.settle(lease!, { outcome: 'DRAFT', outputHash: createHash('sha256').update(`out-${i}`).digest('hex'), providerSettled: true });
    }
  } finally { q.close(); }
  return queuePath;
}

function loopArgs(queuePath: string, decision = 'APPROVED', reviewer = REVIEWER): string[] {
  return ['--queue', queuePath, '--tenant', TENANT, '--decision', decision, '--reviewer', reviewer, '--ref', REF];
}

test('12d-357: guardrails pinned — print-only, queue never touched, real contracts by import', () => {
  assert.equal(REVIEW_OPERATOR_LOOP_CLI_GUARDRAILS.printOnly, true);
  assert.equal(REVIEW_OPERATOR_LOOP_CLI_GUARDRAILS.queueTouchedNever, true);
  assert.equal(REVIEW_OPERATOR_LOOP_CLI_GUARDRAILS.realContractReuse, true);
  assert.equal(REVIEW_OPERATOR_LOOP_CLI_GUARDRAILS.tempWorkspaceDeleted, true);
  assert.equal(REVIEW_OPERATOR_LOOP_CLI_GUARDRAILS.appliesNothing, true);
  assert.equal(REVIEW_OPERATOR_LOOP_CLI_GUARDRAILS.modelCalls, 0);
  assert.equal(REVIEW_OPERATOR_LOOP_CLI_GUARDRAILS.remoteCalls, 0);
  assert.equal(REVIEW_OPERATOR_LOOP_CLI_GUARDRAILS.humanDecision, 'REQUIRED');
  assert.equal(REVIEW_OPERATOR_LOOP_CLI_POLICY.policyVersion, '12d-357-v1');
  assert.equal(REVIEW_OPERATOR_LOOP_CLI_POLICY.flagOrder.length, 5);
  const flags = REVIEW_OPERATOR_LOOP_CLI_POLICY.flagOrder as readonly string[];
  assert.ok(!flags.includes('--apply')); // the REAL 12D-324 door is the only mutating rung
  assert.ok(!flags.includes('--out')); // print-only
});

test('12d-357: parser discipline — exact flags, each once, valued', () => {
  const base = ['--queue', 'q', '--tenant', 't', '--decision', 'APPROVED', '--reviewer', 'r', '--ref', 'x'];
  assert.throws(() => runReviewOperatorLoopCommand(base.slice(0, -2)), /fail closed/);
  assert.throws(() => runReviewOperatorLoopCommand([...base, '--extra', 'y']), /fail closed/);
  assert.throws(() => runReviewOperatorLoopCommand(base.map((v, i) => (i === 0 ? '--smuggled' : v))), /unknown flag/);
  assert.throws(() => runReviewOperatorLoopCommand(base.map((v, i) => (i === 2 ? '--queue' : v))), /duplicate flag/);
  assert.throws(() => runReviewOperatorLoopCommand(base.map((v) => (v === 'q' ? '' : v))), /requires a value/);
});

test('12d-357: the REAL loop — worksheet, prep, and verify all measured in one dry run, queue untouched', () => {
  withWorkspace((dir) => {
    const queuePath = loopQueue(dir);
    const before = readFileSync(queuePath);
    const packet = runReviewOperatorLoopCommand(loopArgs(queuePath));
    assert.equal(packet.kind, 'REVIEW_OPERATOR_LOOP_DRY_RUN');
    if (packet.kind !== 'REVIEW_OPERATOR_LOOP_DRY_RUN') return;
    assert.equal(packet.policyVersion, REVIEW_OPERATOR_LOOP_CLI_POLICY.policyVersion);
    assert.equal(packet.tenantId, TENANT);
    assert.equal(packet.worksheet.entries, 3);
    assert.match(packet.worksheet.worksheetDigestSha256, /^[0-9a-f]{64}$/);
    assert.equal(packet.prep.prepared, 3);
    assert.match(packet.prep.decisionDisclosedAs, /human's already-made decision/);
    assert.equal(packet.verify.verified, true);
    assert.equal(packet.verify.verifiedCount, 3);
    assert.equal(packet.verify.failedCount, 0);
    assert.equal(packet.queueTouched, false);
    assert.equal(packet.tempWorkspaceDeleted, true);
    assert.match(packet.nextStep, /never applies/);
    assert.match(packet.stoppedBefore, /READ-ONLY dry run/);
    // The queue bytes are identical and every story is still
    // AWAITING_REVIEW — the dry run decided nothing.
    const q = new OfflineStoryQueue(queuePath);
    try {
      for (let i = 1; i <= 3; i += 1) {
        const id = `draft-story-${String(i).padStart(3, '0')}`;
        assert.equal(q.inspectStory(TENANT, id)!.state, 'AWAITING_REVIEW');
      }
    } finally { q.close(); }
    assert.ok(before.equals(readFileSync(queuePath)));
  });
});

test('12d-357: a missing queue refuses at the WORKSHEET stage with that contract\'s own wording', () => {
  withWorkspace((dir) => {
    const packet = runReviewOperatorLoopCommand(loopArgs(join(dir, 'absent.sqlite')));
    assert.equal(packet.kind, 'REVIEW_OPERATOR_LOOP_REFUSED');
    if (packet.kind !== 'REVIEW_OPERATOR_LOOP_REFUSED') return;
    assert.equal(packet.stage, 'worksheet');
    assert.match(packet.reason, /does not exist/);
    assert.equal(existsSync(join(dir, 'absent.sqlite')), false);
  });
});

test('12d-357: a non-designated reviewer refuses at the PREP stage — the whole dry run stops, queue untouched', () => {
  withWorkspace((dir) => {
    const queuePath = loopQueue(dir);
    const before = readFileSync(queuePath);
    const packet = runReviewOperatorLoopCommand(loopArgs(queuePath, 'APPROVED', 'not_the_designated_reviewer'));
    assert.equal(packet.kind, 'REVIEW_OPERATOR_LOOP_REFUSED');
    if (packet.kind !== 'REVIEW_OPERATOR_LOOP_REFUSED') return;
    assert.equal(packet.stage, 'prep');
    assert.match(packet.reason, /not designated/);
    assert.match(packet.reason, /WHOLE batch/);
    assert.ok(before.equals(readFileSync(queuePath)));
  });
});

test('12d-357: the temp workspace is deleted after every run — nothing lingers in tmpdir', () => {
  const before = new Set(readdirSync(tmpdir()));
  withWorkspace((dir) => {
    const queuePath = loopQueue(dir);
    runReviewOperatorLoopCommand(loopArgs(queuePath));
  });
  const afterSuccess = readdirSync(tmpdir()).filter((d) => !before.has(d) && d.startsWith('xiv-operator-loop-'));
  assert.equal(afterSuccess.length, 0);
  withWorkspace((dir) => {
    runReviewOperatorLoopCommand(loopArgs(join(dir, 'absent.sqlite')));
  });
  const afterRefusal = readdirSync(tmpdir()).filter((d) => !before.has(d) && d.startsWith('xiv-operator-loop-'));
  assert.equal(afterRefusal.length, 0);
});