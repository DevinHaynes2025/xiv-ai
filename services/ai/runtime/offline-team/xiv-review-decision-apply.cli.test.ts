// 12D-324 — adversarial tests for the review-decision-apply CLI.
// Central properties under attack:
//   1. EXECUTES-NEVER-DECIDES: every decision comes from the human's
//      decisions file — the CLI has no decision of its own, and an
//      empty/missing/blank decisions file refuses with NOTHING applied.
//   2. PRE-FLIGHT ALL, APPLY ONLY AFTER: one bad entry (unknown story,
//      wrong state, stale/tampered hash, non-designated reviewer)
//      refuses the WHOLE batch before the first door write.
//   3. HASH-BOUND: the claimed expectedOutputHash must equal the
//      queue's settled output hash — "not holding the draft they claim"
//      (the 12D-285 echo) — and the REAL door re-checks it anyway.
//   4. THE REAL LOOP: decisions applied through the REAL door leave the
//      REAL queue in the door's OWN states (APPROVED -> DONE,
//      CHANGES_REQUESTED -> READY, REJECTED -> FAILED).
//   5. SECRETS NEVER RENDER: a secret-shaped reviewRef refuses.

import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, writeFileSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createHash } from 'node:crypto';
import {
  REVIEW_DECISION_APPLY_CLI_GUARDRAILS,
  REVIEW_DECISION_APPLY_CLI_POLICY,
  parseHumanDecisions,
  runReviewDecisionApplyCommand,
} from './xiv-review-decision-apply.cli';
import { OfflineStoryQueue, type OfflineStory } from './offline-story-queue';
import { getEnterpriseRole } from './enterprise-workforce';

const TENANT = 'apply-tenant';
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

function makeAwaiting(q: OfflineStoryQueue, n: number, objective = `READ AND SUMMARIZE reviewed fact ${n}`): string {
  const story = makeStory(n, objective);
  q.enqueue([story]);
  const lease = q.claimNext(TENANT, 'memory_curator', 'worker-1', 120_000);
  assert.ok(lease);
  q.settle(lease!, { outcome: 'DRAFT', outputHash: createHash('sha256').update(`out-${n}`).digest('hex'), providerSettled: true });
  return story.id;
}

function withWorkspace(fn: (dir: string) => void): void {
  const dir = mkdtempSync(join(tmpdir(), 'xiv-apply-cli-'));
  try { fn(dir); } finally { rmSync(dir, { recursive: true, force: true }); }
}

interface Fixture {
  queuePath: string;
  ids: [string, string, string];
  hashes: [string, string, string];
}
/** A queue with 3 AWAITING_REVIEW stories; returns their ids and settled hashes. */
function applyQueue(dir: string): Fixture {
  const queuePath = join(dir, 'queue.sqlite');
  const q = new OfflineStoryQueue(queuePath);
  const ids: string[] = [];
  const hashes: string[] = [];
  try {
    for (let i = 1; i <= 3; i += 1) {
      const id = makeAwaiting(q, i);
      ids.push(id);
      hashes.push(createHash('sha256').update(`out-${i}`).digest('hex'));
    }
  } finally { q.close(); }
  return { queuePath, ids: ids as Fixture['ids'], hashes: hashes as Fixture['ids'] };
}

function decisionJson(storyId: string, hash: string, decision: string, reviewRef: string, reviewerId = REVIEWER): string {
  // Exact key order [storyId, reviewerId, decision, expectedOutputHash, reviewRef].
  return JSON.stringify({ storyId, reviewerId, decision, expectedOutputHash: hash, reviewRef });
}

test('12d-324: guardrails pinned — executes never decides, pre-flight all, hash-bound', () => {
  assert.equal(REVIEW_DECISION_APPLY_CLI_GUARDRAILS.executesNeverDecides, true);
  assert.equal(REVIEW_DECISION_APPLY_CLI_GUARDRAILS.preflightAllThenApply, true);
  assert.equal(REVIEW_DECISION_APPLY_CLI_GUARDRAILS.hashBound, true);
  assert.equal(REVIEW_DECISION_APPLY_CLI_GUARDRAILS.designatedReviewerRequired, true);
  assert.equal(REVIEW_DECISION_APPLY_CLI_GUARDRAILS.missingFileRefuses, true);
  assert.equal(REVIEW_DECISION_APPLY_CLI_GUARDRAILS.modelCalls, 0);
  assert.equal(REVIEW_DECISION_APPLY_CLI_GUARDRAILS.remoteCalls, 0);
  assert.equal(REVIEW_DECISION_APPLY_CLI_GUARDRAILS.humanDecision, 'REQUIRED');
  assert.equal(REVIEW_DECISION_APPLY_CLI_POLICY.policyVersion, '12d-324-v1');
  assert.equal(REVIEW_DECISION_APPLY_CLI_POLICY.flagOrder.length, 3);
  const flags = REVIEW_DECISION_APPLY_CLI_POLICY.flagOrder as readonly string[];
  assert.ok(!flags.includes('--decide')); // the CLI never decides
  assert.ok(!flags.includes('--decision')); // decisions come from the file, never a flag
  assert.ok(!flags.includes('--reviewRef')); // provenance comes from the file, never a flag
});

test('12d-324: parser discipline — exact flags, each once, valued; tenant id-shaped', () => {
  const base = ['--queue', 'q', '--tenant', 't', '--decisions', 'd.json'];
  assert.throws(() => runReviewDecisionApplyCommand(base.slice(0, -2)), /fail closed/);
  assert.throws(() => runReviewDecisionApplyCommand([...base, '--extra', 'x']), /fail closed/);
  assert.throws(() => runReviewDecisionApplyCommand(base.map((v, i) => (i === 0 ? '--smuggled' : v))), /unknown flag/);
  assert.throws(() => runReviewDecisionApplyCommand(base.map((v, i) => (i === 2 ? '--queue' : v))), /duplicate flag/);
  assert.throws(() => runReviewDecisionApplyCommand(base.map((v) => (v === 'q' ? '' : v))), /requires a value/);
  assert.throws(() => runReviewDecisionApplyCommand(base.map((v) => (v === 't' ? 'bad id!' : v))), /tenant id/);
});

test('12d-324: decisions-file discipline — exact keys in order, bounded values, no duplicates, no secrets', () => {
  const good = decisionJson('story-1', 'a'.repeat(64), 'APPROVED', 'review:1');
  assert.equal(parseHumanDecisions(`[${good}]`)[0]!.storyId, 'story-1');
  assert.throws(() => parseHumanDecisions('not-json'), /does not parse as JSON/);
  assert.throws(() => parseHumanDecisions('{"storyId":"s"}'), /JSON array/);
  assert.throws(() => parseHumanDecisions('[]'), /nothing the human decided/);
  // Key order matters.
  assert.throws(() => parseHumanDecisions(`[${JSON.stringify({ reviewerId: REVIEWER, storyId: 's', decision: 'APPROVED', expectedOutputHash: 'a'.repeat(64), reviewRef: 'r' })}]`), /in order/);
  assert.throws(() => parseHumanDecisions(`[${JSON.stringify({ storyId: 's', reviewerId: REVIEWER, decision: 'MAYBE', expectedOutputHash: 'a'.repeat(64), reviewRef: 'r' })}]`), /does not accept/);
  assert.throws(() => parseHumanDecisions(`[${JSON.stringify({ storyId: 's', reviewerId: REVIEWER, decision: 'APPROVED', expectedOutputHash: 'zz', reviewRef: 'r' })}]`), /malformed expectedOutputHash/);
  assert.throws(() => parseHumanDecisions(`[${JSON.stringify({ storyId: 's', reviewerId: REVIEWER, decision: 'APPROVED', expectedOutputHash: 'a'.repeat(64), reviewRef: '' })}]`), /malformed reviewRef/);
  assert.throws(() => parseHumanDecisions(`[${JSON.stringify({ storyId: 's', reviewerId: REVIEWER, decision: 'APPROVED', expectedOutputHash: 'a'.repeat(64), reviewRef: 'x'.repeat(257) })}]`), /malformed reviewRef/);
  assert.throws(() => parseHumanDecisions(`[${JSON.stringify({ storyId: 's', reviewerId: REVIEWER, decision: 'APPROVED', expectedOutputHash: 'a'.repeat(64), reviewRef: 'bearer ghp_ABCDEFGHIJKLMNOPQRSTUVWXYZ12' })}]`), /secret-shaped reviewRef/);
  assert.throws(() => parseHumanDecisions(`[${good}, ${good.replace('"story-1"', '"story-2"')}]`.replace('"story-2"', `"story-1"`)), /one decision per story/);
});

test('12d-324: the REAL loop — decisions applied through the REAL door, queue left in the door\'s OWN states', () => {
  withWorkspace((dir) => {
    const { queuePath, ids, hashes } = applyQueue(dir);
    const decisionsPath = join(dir, 'decisions.json');
    writeFileSync(decisionsPath, `[\n${decisionJson(ids[0]!, hashes[0]!, 'APPROVED', 'ceo-decision-test-1')},\n${decisionJson(ids[1]!, hashes[1]!, 'CHANGES_REQUESTED', 'ceo-decision-test-2')},\n${decisionJson(ids[2]!, hashes[2]!, 'REJECTED', 'ceo-decision-test-3')}\n]`);
    const packet = runReviewDecisionApplyCommand(['--queue', queuePath, '--tenant', TENANT, '--decisions', decisionsPath]);
    assert.equal(packet.kind, 'REVIEW_DECISIONS_APPLIED');
    if (packet.kind !== 'REVIEW_DECISIONS_APPLIED') return;
    assert.equal(packet.policyVersion, REVIEW_DECISION_APPLY_CLI_POLICY.policyVersion);
    assert.equal(packet.tenantId, TENANT);
    assert.equal(packet.decidedBy, 'THE_HUMAN_VIA_THE_DECISIONS_FILE');
    assert.equal(packet.appliedCount, 3);
    assert.deepEqual(packet.applied.map((r) => r.doorResult), ['DONE', 'READY', 'FAILED']);
    assert.match(packet.stoppedBefore, /never decides/);
    assert.equal(packet.modelCalls, 0);
    assert.equal(packet.humanDecision, 'REQUIRED');
    // Queue truth, read back through the REAL queue contract.
    const q = new OfflineStoryQueue(queuePath);
    try {
      assert.equal(q.inspectStory(TENANT, ids[0]!)!.state, 'DONE');
      assert.equal(q.inspectStory(TENANT, ids[1]!)!.state, 'READY');
      assert.equal(q.inspectStory(TENANT, ids[2]!)!.state, 'FAILED');
    } finally { q.close(); }
  });
});

test('12d-324: read-only files must already exist — a missing queue or decisions file refuses, never created', () => {
  withWorkspace((dir) => {
    const missingQueue = join(dir, 'no-queue.sqlite');
    const missingDecisions = join(dir, 'no-decisions.json');
    const refused1 = runReviewDecisionApplyCommand(['--queue', missingQueue, '--tenant', TENANT, '--decisions', 'whatever.json']);
    assert.equal(refused1.kind, 'REVIEW_DECISION_APPLY_REFUSED');
    if (refused1.kind === 'REVIEW_DECISION_APPLY_REFUSED') assert.match(refused1.reason, /queue file does not exist/);
    assert.ok(!existsSync(missingQueue), 'the CLI must never create a queue');
    const { queuePath } = applyQueue(dir);
    const refused2 = runReviewDecisionApplyCommand(['--queue', queuePath, '--tenant', TENANT, '--decisions', missingDecisions]);
    assert.equal(refused2.kind, 'REVIEW_DECISION_APPLY_REFUSED');
    if (refused2.kind === 'REVIEW_DECISION_APPLY_REFUSED') assert.match(refused2.reason, /never invents decisions/);
    assert.ok(!existsSync(missingDecisions), 'the CLI must never create a decisions file');
  });
});

test('12d-324: pre-flight ALL, apply ONLY after — one bad story refuses the batch with NOTHING applied', () => {
  withWorkspace((dir) => {
    const { queuePath, ids, hashes } = applyQueue(dir);
    const decisionsPath = join(dir, 'decisions.json');
    // Entry 1 is good; entry 2 names a story the queue does not hold.
    writeFileSync(decisionsPath, `[${decisionJson(ids[0]!, hashes[0]!, 'APPROVED', 'review:1')}, ${decisionJson('no-such-story', hashes[1]!, 'APPROVED', 'review:2')}]`);
    const packet = runReviewDecisionApplyCommand(['--queue', queuePath, '--tenant', TENANT, '--decisions', decisionsPath]);
    assert.equal(packet.kind, 'REVIEW_DECISION_APPLY_REFUSED');
    if (packet.kind !== 'REVIEW_DECISION_APPLY_REFUSED') return;
    assert.match(packet.reason, /does not hold/);
    assert.equal(packet.appliedCount, 0);
    const q = new OfflineStoryQueue(queuePath);
    try { assert.equal(q.inspectStory(TENANT, ids[0]!)!.state, 'AWAITING_REVIEW'); } finally { q.close(); }
  });
});

test('12d-324: a stale or tampered expectedOutputHash refuses — "not holding the draft they claim"', () => {
  withWorkspace((dir) => {
    const { queuePath, ids } = applyQueue(dir);
    const decisionsPath = join(dir, 'decisions.json');
    writeFileSync(decisionsPath, `[${decisionJson(ids[0]!, 'f'.repeat(64), 'APPROVED', 'review:1')}]`);
    const packet = runReviewDecisionApplyCommand(['--queue', queuePath, '--tenant', TENANT, '--decisions', decisionsPath]);
    assert.equal(packet.kind, 'REVIEW_DECISION_APPLY_REFUSED');
    if (packet.kind !== 'REVIEW_DECISION_APPLY_REFUSED') return;
    assert.match(packet.reason, /not holding the draft they claim/);
    assert.equal(packet.appliedCount, 0);
  });
});

test('12d-324: a non-designated reviewer refuses — the REAL workforce contract\'s own check', () => {
  withWorkspace((dir) => {
    const { queuePath, ids, hashes } = applyQueue(dir);
    const decisionsPath = join(dir, 'decisions.json');
    writeFileSync(decisionsPath, `[${decisionJson(ids[0]!, hashes[0]!, 'APPROVED', 'review:1', 'not_a_designated_reviewer')}]`);
    const packet = runReviewDecisionApplyCommand(['--queue', queuePath, '--tenant', TENANT, '--decisions', decisionsPath]);
    assert.equal(packet.kind, 'REVIEW_DECISION_APPLY_REFUSED');
    if (packet.kind !== 'REVIEW_DECISION_APPLY_REFUSED') return;
    assert.match(packet.reason, /designated independent reviewers/);
    assert.equal(packet.appliedCount, 0);
    assert.deepEqual(getEnterpriseRole('memory_curator').reviewerIds.includes('not_a_designated_reviewer'), false);
  });
});

test('12d-324: a story that is not AWAITING_REVIEW refuses — the door\'s own preconditions mirrored', () => {
  withWorkspace((dir) => {
    const { queuePath, ids, hashes } = applyQueue(dir);
    const q = new OfflineStoryQueue(queuePath);
    try { q.applyReviewDecision({ tenantId: TENANT, storyId: ids[0]!, reviewerId: REVIEWER, expectedOutputHash: hashes[0]!, decision: 'APPROVED', reviewRef: 'fixture' }); } finally { q.close(); }
    const decisionsPath = join(dir, 'decisions.json');
    writeFileSync(decisionsPath, `[${decisionJson(ids[1]!, hashes[1]!, 'APPROVED', 'review:1')}, ${decisionJson(ids[0]!, hashes[0]!, 'APPROVED', 'review:2')}]`);
    const packet = runReviewDecisionApplyCommand(['--queue', queuePath, '--tenant', TENANT, '--decisions', decisionsPath]);
    assert.equal(packet.kind, 'REVIEW_DECISION_APPLY_REFUSED');
    if (packet.kind !== 'REVIEW_DECISION_APPLY_REFUSED') return;
    assert.match(packet.reason, /DONE, not AWAITING_REVIEW/);
    assert.equal(packet.appliedCount, 0);
  });
});

test('12d-324: an empty decisions file refuses — the CLI never invents a decision', () => {
  withWorkspace((dir) => {
    const { queuePath } = applyQueue(dir);
    const emptyPath = join(dir, 'empty.json');
    writeFileSync(emptyPath, '');
    const packet = runReviewDecisionApplyCommand(['--queue', queuePath, '--tenant', TENANT, '--decisions', emptyPath]);
    assert.equal(packet.kind, 'REVIEW_DECISION_APPLY_REFUSED');
    if (packet.kind === 'REVIEW_DECISION_APPLY_REFUSED') assert.match(packet.reason, /decisions file is empty/);
  });
});