// 12D-323 — adversarial tests for the review-decision-worksheet CLI.
// Central properties under attack:
//   1. PREPARES-NEVER-APPLIES: the worksheet emits the REAL review
//      door's hash-bound inputs (full expectedOutputHash, decision
//      vocabulary, REAL designated reviewers) and NEVER applies a
//      decision — running it twice leaves every state and count
//      unchanged; there is no write path.
//   2. NO SILENT LIES: a missing queue file refuses BEFORE the queue is
//      opened (the worksheet never creates a queue); truncation is
//      keyed off the queue's OWN census and disclosed, never padded.
//   3. SECRETS NEVER RENDER: a secret-shaped objective renders as a
//      counted redaction placeholder — never the content.
//   4. TAMPERED ROWS REFUSE THE WORKSHEET: a body that does not parse,
//      malformed identity fields, an objective over the REAL queue
//      contract's OWN bound, or a role the REAL workforce contract
//      does not know — nothing is prepared.
//   5. THE BLANKS STAY BLANK: reviewerId/decision/reviewRef are always
//      '' in every prepared decisionInputs — the worksheet never
//      decides.

import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createHash } from 'node:crypto';
import {
  REVIEW_DECISION_WORKSHEET_CLI_GUARDRAILS,
  REVIEW_DECISION_WORKSHEET_CLI_POLICY,
  runReviewDecisionWorksheetCommand,
} from './xiv-review-decision-worksheet.cli';
import { OfflineStoryQueue, type OfflineStory } from './offline-story-queue';
import { getEnterpriseRole } from './enterprise-workforce';
import { DatabaseSync } from 'node:sqlite';

const TENANT = 'worksheet-tenant';
const OTHER_TENANT = 'other-tenant';

function makeStory(n: number, tenant: string, objective: string): OfflineStory {
  return {
    id: `draft-story-${String(n).padStart(3, '0')}`,
    tenantId: tenant,
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

/** Enqueue + settle (no review) -> AWAITING_REVIEW. */
function makeAwaiting(q: OfflineStoryQueue, n: number, tenant: string, objective: string): string {
  const story = makeStory(n, tenant, objective);
  q.enqueue([story]);
  const lease = q.claimNext(tenant, 'memory_curator', 'worker-1', 120_000);
  assert.ok(lease);
  q.settle(lease!, { outcome: 'DRAFT', outputHash: createHash('sha256').update(`out-${n}`).digest('hex'), providerSettled: true });
  return story.id;
}

function makeDone(q: OfflineStoryQueue, n: number, tenant: string, objective: string): void {
  const story = makeStory(n, tenant, objective);
  q.enqueue([story]);
  const lease = q.claimNext(tenant, 'memory_curator', 'worker-1', 120_000);
  assert.ok(lease);
  q.settle(lease!, { outcome: 'DRAFT', outputHash: createHash('sha256').update(`out-${n}`).digest('hex'), providerSettled: true });
  q.applyReviewDecision({
    tenantId: tenant, storyId: story.id, reviewerId: 'secure_code_reviewer',
    expectedOutputHash: createHash('sha256').update(`out-${n}`).digest('hex'),
    decision: 'APPROVED', reviewRef: `review:${n}`,
  });
}

function withWorkspace(fn: (dir: string) => void): void {
  const dir = mkdtempSync(join(tmpdir(), 'xiv-worksheet-cli-'));
  try { fn(dir); } finally { rmSync(dir, { recursive: true, force: true }); }
}

/** A queue with 3 AWAITING_REVIEW + 1 DONE for TENANT and 1 AWAITING_REVIEW for OTHER_TENANT. */
function worksheetQueue(dir: string): { queuePath: string; args: string[] } {
  const queuePath = join(dir, 'queue.sqlite');
  const q = new OfflineStoryQueue(queuePath);
  try {
    for (let i = 1; i <= 3; i += 1) makeAwaiting(q, i, TENANT, `READ AND SUMMARIZE reviewed fact number ${i} about the architecture`);
    makeDone(q, 4, TENANT, 'READ AND SUMMARIZE an already-reviewed fact');
    makeAwaiting(q, 5, OTHER_TENANT, 'READ AND SUMMARIZE another tenant fact');
  } finally {
    q.close();
  }
  const args = ['--queue', queuePath, '--tenant', TENANT, '--limit', '100'];
  return { queuePath, args };
}

test('12d-323: guardrails pinned — read-only, prepares never applies, decision left blank', () => {
  assert.equal(REVIEW_DECISION_WORKSHEET_CLI_GUARDRAILS.readOnly, true);
  assert.equal(REVIEW_DECISION_WORKSHEET_CLI_GUARDRAILS.preparesNeverApplies, true);
  assert.equal(REVIEW_DECISION_WORKSHEET_CLI_GUARDRAILS.awaitingReviewOnly, true);
  assert.equal(REVIEW_DECISION_WORKSHEET_CLI_GUARDRAILS.missingQueueFileRefuses, true);
  assert.equal(REVIEW_DECISION_WORKSHEET_CLI_GUARDRAILS.everyEntrySecretScreened, true);
  assert.equal(REVIEW_DECISION_WORKSHEET_CLI_GUARDRAILS.decisionLeftBlank, true);
  assert.equal(REVIEW_DECISION_WORKSHEET_CLI_GUARDRAILS.modelCalls, 0);
  assert.equal(REVIEW_DECISION_WORKSHEET_CLI_GUARDRAILS.remoteCalls, 0);
  assert.equal(REVIEW_DECISION_WORKSHEET_CLI_GUARDRAILS.humanDecision, 'REQUIRED');
  assert.equal(REVIEW_DECISION_WORKSHEET_CLI_POLICY.policyVersion, '12d-323-v1');
  assert.equal(REVIEW_DECISION_WORKSHEET_CLI_POLICY.flagOrder.length, 3);
  const flags = REVIEW_DECISION_WORKSHEET_CLI_POLICY.flagOrder as readonly string[];
  assert.ok(!flags.includes('--decision')); // no decision path
  assert.ok(!flags.includes('--apply')); // no apply path
  assert.ok(!flags.includes('--write')); // no write path
});

test('12d-323: parser discipline — exact flags, each once, bounded values', () => {
  const base = ['--queue', 'q', '--tenant', 't', '--limit', '50'];
  assert.throws(() => runReviewDecisionWorksheetCommand(base.slice(0, -2)), /fail closed/);
  assert.throws(() => runReviewDecisionWorksheetCommand([...base, '--extra', 'x']), /fail closed/);
  assert.throws(() => runReviewDecisionWorksheetCommand(base.map((v, i) => (i === 0 ? '--smuggled' : v))), /unknown flag/);
  assert.throws(() => runReviewDecisionWorksheetCommand(base.map((v, i) => (i === 2 ? '--queue' : v))), /duplicate flag/);
  assert.throws(() => runReviewDecisionWorksheetCommand(base.map((v) => (v === 'q' ? '' : v))), /requires a value/);
  assert.throws(() => runReviewDecisionWorksheetCommand(base.map((v) => (v === 't' ? 'bad id!' : v))), /tenant id/);
  assert.throws(() => runReviewDecisionWorksheetCommand(base.map((v) => (v === '50' ? '0' : v))), /1\.\.100/);
  assert.throws(() => runReviewDecisionWorksheetCommand(base.map((v) => (v === '50' ? '101' : v))), /1\.\.100/);
  assert.throws(() => runReviewDecisionWorksheetCommand(base.map((v) => (v === '50' ? 'abc' : v))), /positive integer/);
  assert.throws(() => runReviewDecisionWorksheetCommand(base.map((v) => (v === '50' ? '12.5' : v))), /positive integer/);
});

test('12d-323: the REAL loop — door inputs prepared, DONE excluded, other tenants excluded, blanks stay blank', () => {
  withWorkspace((dir) => {
    const { args } = worksheetQueue(dir);
    const packet = runReviewDecisionWorksheetCommand(args);
    assert.equal(packet.kind, 'REVIEW_DECISION_WORKSHEET');
    if (packet.kind !== 'REVIEW_DECISION_WORKSHEET') return;
    assert.equal(packet.policyVersion, REVIEW_DECISION_WORKSHEET_CLI_POLICY.policyVersion);
    assert.equal(packet.tenantId, TENANT);
    assert.equal(packet.totalAwaiting, 3);
    assert.equal(packet.listed, 3);
    assert.equal(packet.entries.length, 3);
    assert.deepEqual(packet.entries.map((e) => e.storyId),
      ['draft-story-001', 'draft-story-002', 'draft-story-003']);
    assert.ok(packet.entries.every((e) => e.state === 'AWAITING_REVIEW'));
    // The hash-bound input is the FULL hex64, matching the settled hash.
    assert.ok(packet.entries.every((e) => /^[0-9a-f]{64}$/.test(e.expectedOutputHash)));
    assert.ok(packet.entries.every((e) => e.decisionInputs.expectedOutputHash === e.expectedOutputHash));
    assert.ok(packet.entries.every((e) => e.decisionInputs.tenantId === TENANT && e.decisionInputs.storyId === e.storyId));
    // The blanks stay blank and the REAL designated reviewers are disclosed.
    assert.ok(packet.entries.every((e) => e.decisionInputs.reviewerId === '' && e.decisionInputs.decision === '' && e.decisionInputs.reviewRef === ''));
    assert.deepEqual(packet.entries[0]!.designatedReviewers, getEnterpriseRole('memory_curator').reviewerIds);
    // The door's OWN vocabulary is disclosed verbatim, with state effects.
    assert.deepEqual([...packet.doorDecisionVocabulary], [
      { decision: 'APPROVED', queueStateEffect: 'DONE' },
      { decision: 'CHANGES_REQUESTED', queueStateEffect: 'READY' },
      { decision: 'REJECTED', queueStateEffect: 'FAILED' },
    ]);
    assert.equal(packet.truncatedNote, '');
    assert.equal(packet.redactedCount, 0);
    assert.match(packet.worksheetDigestSha256, /^[a-f0-9]{64}$/);
    assert.match(packet.stoppedBefore, /never applies a decision/);
    assert.equal(packet.modelCalls, 0);
    assert.equal(packet.humanDecision, 'REQUIRED');
  });
});

test('12d-323: read-only — running twice changes nothing', () => {
  withWorkspace((dir) => {
    const { queuePath, args } = worksheetQueue(dir);
    const first = runReviewDecisionWorksheetCommand(args);
    const second = runReviewDecisionWorksheetCommand(args);
    assert.equal(first.kind, 'REVIEW_DECISION_WORKSHEET');
    assert.equal(second.kind, 'REVIEW_DECISION_WORKSHEET');
    if (first.kind !== 'REVIEW_DECISION_WORKSHEET' || second.kind !== 'REVIEW_DECISION_WORKSHEET') return;
    assert.equal(first.worksheetDigestSha256, second.worksheetDigestSha256);
    const q = new OfflineStoryQueue(queuePath);
    try {
      const summary = q.summary(TENANT) as unknown as { counts: { state: string; count: number }[] };
      const awaiting = summary.counts.filter((c) => c.state === 'AWAITING_REVIEW').reduce((a, c) => a + Number(c.count), 0);
      const done = summary.counts.filter((c) => c.state === 'DONE').reduce((a, c) => a + Number(c.count), 0);
      assert.equal(awaiting, 3);
      assert.equal(done, 1);
    } finally { q.close(); }
  });
});

test('12d-323: a missing queue file refuses BEFORE the queue is opened — never created', () => {
  withWorkspace((dir) => {
    const missing = join(dir, 'no-such-queue.sqlite');
    const packet = runReviewDecisionWorksheetCommand(['--queue', missing, '--tenant', TENANT, '--limit', '50']);
    assert.equal(packet.kind, 'REVIEW_DECISION_WORKSHEET_REFUSED');
    if (packet.kind !== 'REVIEW_DECISION_WORKSHEET_REFUSED') return;
    assert.match(packet.reason, /does not exist/);
    assert.ok(!existsSync(missing), 'the worksheet must never create a queue file');
  });
});

test('12d-323: truncation is honest — keyed off the queue census, disclosed never padded', () => {
  withWorkspace((dir) => {
    const { queuePath } = worksheetQueue(dir);
    const packet = runReviewDecisionWorksheetCommand(['--queue', queuePath, '--tenant', TENANT, '--limit', '2']);
    assert.equal(packet.kind, 'REVIEW_DECISION_WORKSHEET');
    if (packet.kind !== 'REVIEW_DECISION_WORKSHEET') return;
    assert.equal(packet.listed, 2);
    assert.equal(packet.totalAwaiting, 3);
    assert.match(packet.truncatedNote, /prepares 2 of 3 AWAITING_REVIEW/);
  });
});

test('12d-323: tenant scoping — another tenant\'s pending rows never appear', () => {
  withWorkspace((dir) => {
    const { queuePath } = worksheetQueue(dir);
    const packet = runReviewDecisionWorksheetCommand(['--queue', queuePath, '--tenant', OTHER_TENANT, '--limit', '100']);
    assert.equal(packet.kind, 'REVIEW_DECISION_WORKSHEET');
    if (packet.kind !== 'REVIEW_DECISION_WORKSHEET') return;
    assert.equal(packet.totalAwaiting, 1);
    assert.equal(packet.listed, 1);
    assert.deepEqual(packet.entries.map((e) => e.storyId), ['draft-story-005']);
    // An unknown tenant is an HONEST empty worksheet, not a refusal.
    const empty = runReviewDecisionWorksheetCommand(['--queue', queuePath, '--tenant', 'no-such-tenant', '--limit', '50']);
    assert.equal(empty.kind, 'REVIEW_DECISION_WORKSHEET');
    if (empty.kind !== 'REVIEW_DECISION_WORKSHEET') return;
    assert.equal(empty.totalAwaiting, 0);
    assert.equal(empty.listed, 0);
    assert.equal(empty.truncatedNote, '');
  });
});

test('12d-323: a secret-shaped objective renders as a COUNTED redaction — never the content', () => {
  withWorkspace((dir) => {
    const queuePath = join(dir, 'queue.sqlite');
    const q = new OfflineStoryQueue(queuePath);
    try {
      makeAwaiting(q, 1, TENANT, 'READ AND SUMMARIZE the handbook');
      makeAwaiting(q, 2, TENANT, `READ the config using key AKIA${'B'.repeat(16)} from the source`);
      makeAwaiting(q, 3, TENANT, 'READ AND SUMMARIZE another clean fact');
    } finally { q.close(); }
    const packet = runReviewDecisionWorksheetCommand(['--queue', queuePath, '--tenant', TENANT, '--limit', '100']);
    assert.equal(packet.kind, 'REVIEW_DECISION_WORKSHEET');
    if (packet.kind !== 'REVIEW_DECISION_WORKSHEET') return;
    assert.equal(packet.redactedCount, 1);
    const redacted = packet.entries.find((e) => e.objectiveRedacted);
    assert.ok(redacted);
    assert.match(redacted!.objectiveDisplay, /secret-shaped objective/);
    const wsJson = JSON.stringify(packet);
    assert.ok(!wsJson.includes('AKIA'), 'the secret must never render anywhere in the worksheet');
  });
});

test('12d-323: a tampered row refuses the WHOLE worksheet — nothing is prepared from a touched queue', () => {
  withWorkspace((dir) => {
    const { queuePath } = worksheetQueue(dir);
    const db = new DatabaseSync(queuePath);
    db.prepare("UPDATE stories SET body='not-json-at-all' WHERE id='draft-story-002'").run();
    db.close();
    const packet = runReviewDecisionWorksheetCommand(['--queue', queuePath, '--tenant', TENANT, '--limit', '100']);
    assert.equal(packet.kind, 'REVIEW_DECISION_WORKSHEET_REFUSED');
    if (packet.kind !== 'REVIEW_DECISION_WORKSHEET_REFUSED') return;
    assert.match(packet.reason, /does not parse/);
    assert.match(packet.reason, /REAL doors/);
    assert.equal(packet.modelCalls, 0);
  });
});

test('12d-323: a tampered identity field (broken output hash) refuses the worksheet', () => {
  withWorkspace((dir) => {
    const { queuePath } = worksheetQueue(dir);
    const db = new DatabaseSync(queuePath);
    db.prepare("UPDATE stories SET output_hash='zz-not-hex' WHERE id='draft-story-001'").run();
    db.close();
    const packet = runReviewDecisionWorksheetCommand(['--queue', queuePath, '--tenant', TENANT, '--limit', '100']);
    assert.equal(packet.kind, 'REVIEW_DECISION_WORKSHEET_REFUSED');
    if (packet.kind !== 'REVIEW_DECISION_WORKSHEET_REFUSED') return;
    assert.match(packet.reason, /malformed identity fields/);
  });
});

test('12d-323: a role the REAL workforce contract does not know refuses the worksheet', () => {
  withWorkspace((dir) => {
    const { queuePath } = worksheetQueue(dir);
    const db = new DatabaseSync(queuePath);
    const body = JSON.stringify({
      id: 'draft-story-001', tenantId: TENANT, roleId: 'not_a_real_role',
      objective: 'READ AND SUMMARIZE a fact', acceptance: ['a'], dependencies: [],
      sourceRevision: 'a'.repeat(40), masterPlanSha256: 'b'.repeat(64),
      securityClass: 'ORDINARY', kind: 'PRODUCT_STORY',
    });
    db.prepare("UPDATE stories SET role='not_a_real_role', body=? WHERE id='draft-story-001'").run(body);
    db.close();
    const packet = runReviewDecisionWorksheetCommand(['--queue', queuePath, '--tenant', TENANT, '--limit', '100']);
    assert.equal(packet.kind, 'REVIEW_DECISION_WORKSHEET_REFUSED');
    if (packet.kind !== 'REVIEW_DECISION_WORKSHEET_REFUSED') return;
    assert.match(packet.reason, /workforce contract does not know/);
  });
});

test('12d-323: the objective bound is the REAL queue contract\'s OWN 3000 — live-sized lists, over-3000 refuses', () => {
  withWorkspace((dir) => {
    const queuePath = join(dir, 'queue.sqlite');
    const q = new OfflineStoryQueue(queuePath);
    try {
      makeAwaiting(q, 1, TENANT, `READ AND SUMMARIZE chunk ${'x'.repeat(2600)}`);
    } finally { q.close(); }
    const packet = runReviewDecisionWorksheetCommand(['--queue', queuePath, '--tenant', TENANT, '--limit', '100']);
    assert.equal(packet.kind, 'REVIEW_DECISION_WORKSHEET');
    if (packet.kind !== 'REVIEW_DECISION_WORKSHEET') return;
    assert.equal(packet.listed, 1);
    assert.equal(packet.entries[0]!.objectiveDisplay.length, 200); // display is a bounded WINDOW
    // Over the queue contract's own bound the row is malformed — refuse.
    const tamperedBody = JSON.stringify({
      id: 'draft-story-001', tenantId: TENANT, roleId: 'memory_curator',
      objective: 'y'.repeat(3001), acceptance: ['a'], dependencies: [],
      sourceRevision: 'a'.repeat(40), masterPlanSha256: 'b'.repeat(64),
      securityClass: 'ORDINARY', kind: 'PRODUCT_STORY',
    });
    const db = new DatabaseSync(queuePath);
    db.prepare("UPDATE stories SET body=? WHERE id='draft-story-001'").run(tamperedBody);
    db.close();
    const refused = runReviewDecisionWorksheetCommand(['--queue', queuePath, '--tenant', TENANT, '--limit', '100']);
    assert.equal(refused.kind, 'REVIEW_DECISION_WORKSHEET_REFUSED');
    if (refused.kind === 'REVIEW_DECISION_WORKSHEET_REFUSED') assert.match(refused.reason, /malformed objective/);
  });
});

test('12d-323: the digest binds the derivation — two worksheets differ by derivation, and the digest re-hashes', () => {
  withWorkspace((dir) => {
    const { queuePath } = worksheetQueue(dir);
    const full = runReviewDecisionWorksheetCommand(['--queue', queuePath, '--tenant', TENANT, '--limit', '100']);
    const page = runReviewDecisionWorksheetCommand(['--queue', queuePath, '--tenant', TENANT, '--limit', '1']);
    assert.equal(full.kind, 'REVIEW_DECISION_WORKSHEET');
    assert.equal(page.kind, 'REVIEW_DECISION_WORKSHEET');
    if (full.kind !== 'REVIEW_DECISION_WORKSHEET' || page.kind !== 'REVIEW_DECISION_WORKSHEET') return;
    assert.notEqual(full.worksheetDigestSha256, page.worksheetDigestSha256);
    const reHash = createHash('sha256').update(JSON.stringify({
      policyVersion: REVIEW_DECISION_WORKSHEET_CLI_POLICY.policyVersion,
      tenantId: TENANT, status: 'AWAITING_REVIEW',
      entries: full.entries, totalAwaiting: full.totalAwaiting, listed: full.listed,
      truncatedNote: full.truncatedNote, redactedCount: full.redactedCount, scannedRows: full.scannedRows,
      doorDecisionVocabulary: full.doorDecisionVocabulary,
    }), 'utf8').digest('hex');
    assert.equal(full.worksheetDigestSha256, reHash);
  });
});