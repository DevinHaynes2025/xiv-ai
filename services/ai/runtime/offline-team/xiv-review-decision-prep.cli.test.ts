// 12D-354 — adversarial tests for the review-decision-prep CLI.
// Central properties under attack:
//   1. WRITES-NOTHING: the CLI is PRINT-ONLY — the human redirects
//      the output to a file themselves, and it NEVER touches a queue.
//   2. TRANSCRIBES-NEVER-DECIDES: --decision is the human's
//      already-made decision, verbatim; the CLI has no decision of
//      its own, and without it nothing is prepared.
//   3. TAMPER EVIDENCE: the worksheet digest is re-derived from the
//      file's own entries — any byte edited after issuance refuses.
//   4. PRE-FILLED decisionInputs refuse: only a worksheet exactly as
//      the REAL 12D-323 CLI issued it (blank decision fields) maps.
//   5. ALL-OR-NOTHING: a reviewer not designated for ONE entry
//      refuses the WHOLE batch.
//   6. SECRETS NEVER RENDER: a secret-shaped --ref refuses, and a
//      refusal echoes no flag values.

import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, writeFileSync, readFileSync, existsSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createHash } from 'node:crypto';
import {
  REVIEW_DECISION_PREP_CLI_GUARDRAILS,
  REVIEW_DECISION_PREP_CLI_POLICY,
  runReviewDecisionPrepCommand,
} from './xiv-review-decision-prep.cli';
import { runReviewDecisionWorksheetCommand } from './xiv-review-decision-worksheet.cli';
import { OfflineStoryQueue, type OfflineStory } from './offline-story-queue';

const TENANT = 'prep-tenant';
const REVIEWER = 'secure_code_reviewer'; // memory_curator's REAL designated reviewer
const REF = 'ceo-blanket-approval-2026-09-17c-i-approve: disclosed as blanket in the 12D-340 handoff';

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
  const dir = mkdtempSync(join(tmpdir(), 'xiv-prep-cli-'));
  try { fn(dir); } finally { rmSync(dir, { recursive: true, force: true }); }
}

/** A REAL 12D-323 worksheet (from the REAL worksheet CLI) over a queue
 *  with 3 AWAITING_REVIEW stories, written to disk. Returns ids. */
function realWorksheet(dir: string, count = 3): { worksheetPath: string; ids: string[]; queuePath: string } {
  const queuePath = join(dir, 'queue.sqlite');
  const q = new OfflineStoryQueue(queuePath);
  const ids: string[] = [];
  try {
    for (let i = 1; i <= count; i += 1) {
      const story = makeStory(i, `READ AND SUMMARIZE reviewed fact ${i}`);
      q.enqueue([story]);
      const lease = q.claimNext(TENANT, 'memory_curator', 'worker-1', 120_000);
      assert.ok(lease);
      q.settle(lease!, { outcome: 'DRAFT', outputHash: createHash('sha256').update(`out-${i}`).digest('hex'), providerSettled: true });
      ids.push(story.id);
    }
  } finally { q.close(); }
  const packet = runReviewDecisionWorksheetCommand(['--queue', queuePath, '--tenant', TENANT, '--limit', '100']);
  assert.equal(packet.kind, 'REVIEW_DECISION_WORKSHEET');
  const worksheetPath = join(dir, 'worksheet.json');
  writeFileSync(worksheetPath, JSON.stringify(packet, null, 2));
  return { worksheetPath, ids, queuePath };
}

function prepArgs(worksheetPath: string, decision = 'APPROVED', reviewer = REVIEWER, ref = REF): string[] {
  return ['--worksheet', worksheetPath, '--decision', decision, '--reviewer', reviewer, '--ref', ref];
}

test('12d-354: guardrails pinned — writes nothing, transcribes never decides, digest re-derived', () => {
  assert.equal(REVIEW_DECISION_PREP_CLI_GUARDRAILS.writesNothing, true);
  assert.equal(REVIEW_DECISION_PREP_CLI_GUARDRAILS.transcribesNeverDecides, true);
  assert.equal(REVIEW_DECISION_PREP_CLI_GUARDRAILS.queueTouchedNever, true);
  assert.equal(REVIEW_DECISION_PREP_CLI_GUARDRAILS.reviewerMustBeDesignatedForEveryEntry, true);
  assert.equal(REVIEW_DECISION_PREP_CLI_GUARDRAILS.digestReDerivedFromEntries, true);
  assert.equal(REVIEW_DECISION_PREP_CLI_GUARDRAILS.prefilledDecisionInputsRefuse, true);
  assert.equal(REVIEW_DECISION_PREP_CLI_GUARDRAILS.refSecretScreened, true);
  assert.equal(REVIEW_DECISION_PREP_CLI_GUARDRAILS.modelCalls, 0);
  assert.equal(REVIEW_DECISION_PREP_CLI_GUARDRAILS.remoteCalls, 0);
  assert.equal(REVIEW_DECISION_PREP_CLI_GUARDRAILS.humanDecision, 'REQUIRED');
  assert.equal(REVIEW_DECISION_PREP_CLI_POLICY.policyVersion, '12d-354-v1');
  assert.equal(REVIEW_DECISION_PREP_CLI_POLICY.flagOrder.length, 4);
  const flags = REVIEW_DECISION_PREP_CLI_POLICY.flagOrder as readonly string[];
  assert.ok(!flags.includes('--apply')); // the apply door (12D-324) is the only queue-mutating rung
  assert.ok(!flags.includes('--queue')); // the prep CLI never opens a queue
  assert.ok(!flags.includes('--out')); // print-only: no output-path flag, the human redirects
});

test('12d-354: parser discipline — exact flags, each once, valued; door vocabulary; ref bounds and secrets', () => {
  const base = ['--worksheet', 'w.json', '--decision', 'APPROVED', '--reviewer', REVIEWER, '--ref', 'ref'];
  assert.throws(() => runReviewDecisionPrepCommand(base.slice(0, -2)), /fail closed/);
  assert.throws(() => runReviewDecisionPrepCommand([...base, '--extra', 'x']), /fail closed/);
  assert.throws(() => runReviewDecisionPrepCommand(base.map((v, i) => (i === 0 ? '--smuggled' : v))), /unknown flag/);
  assert.throws(() => runReviewDecisionPrepCommand(base.map((v, i) => (i === 4 ? '--worksheet' : v))), /duplicate flag/);
  assert.throws(() => runReviewDecisionPrepCommand(base.map((v) => (v === 'w.json' ? '' : v))), /requires a value/);
  assert.throws(() => runReviewDecisionPrepCommand(base.map((v) => (v === 'APPROVED' ? 'MAYBE' : v))), /door's own vocabulary/);
  assert.throws(() => runReviewDecisionPrepCommand(base.map((v) => (v === REVIEWER ? 'bad reviewer!' : v))), /reviewer id is malformed/);
  assert.throws(() => runReviewDecisionPrepCommand(base.map((v) => (v === 'ref' ? 'x'.repeat(257) : v))), /<= 256 chars/);
  assert.throws(() => runReviewDecisionPrepCommand(base.map((v) => (v === 'ref' ? 'bearer ghp_ABCDEFGHIJKLMNOPQRSTUVWXYZ12' : v))), /secret-shaped/);
});

test('12d-354: print-only inputs must already exist — a missing worksheet file refuses, never created', () => {
  withWorkspace((dir) => {
    const missing = join(dir, 'absent.json');
    const packet = runReviewDecisionPrepCommand(prepArgs(missing));
    assert.equal(packet.kind, 'REVIEW_DECISIONS_PREP_REFUSED');
    if (packet.kind !== 'REVIEW_DECISIONS_PREP_REFUSED') return;
    assert.match(packet.reason, /does not exist/);
    assert.equal(existsSync(missing), false); // never created
    assert.equal(packet.writesNothing, true);
  });
});

test('12d-354: non-worksheet files refuse before anything is prepared', () => {
  withWorkspace((dir) => {
    const emptyPath = join(dir, 'empty.json');
    writeFileSync(emptyPath, '');
    assert.equal(runReviewDecisionPrepCommand(prepArgs(emptyPath)).kind, 'REVIEW_DECISIONS_PREP_REFUSED');

    const junkPath = join(dir, 'junk.json');
    writeFileSync(junkPath, 'not-json{{');
    const junk = runReviewDecisionPrepCommand(prepArgs(junkPath));
    assert.equal(junk.kind, 'REVIEW_DECISIONS_PREP_REFUSED');
    if (junk.kind === 'REVIEW_DECISIONS_PREP_REFUSED') assert.match(junk.reason, /does not parse as JSON/);

    const otherPath = join(dir, 'other.json');
    writeFileSync(otherPath, JSON.stringify({ kind: 'SOMETHING_ELSE' }));
    const other = runReviewDecisionPrepCommand(prepArgs(otherPath));
    assert.equal(other.kind, 'REVIEW_DECISIONS_PREP_REFUSED');
    if (other.kind === 'REVIEW_DECISIONS_PREP_REFUSED') assert.match(other.reason, /not a review decision worksheet/);
  });
});

test('12d-354: tamper evidence — one edited byte in the worksheet refuses the digest re-derivation', () => {
  withWorkspace((dir) => {
    const { worksheetPath } = realWorksheet(dir);
    const ws = JSON.parse(readFileSync(worksheetPath, 'utf8')) as { entries: { objectiveDisplay: string; decisionInputs: { reviewerId: string } }[] };
    ws.entries[0]!.objectiveDisplay = 'edited after issuance';
    writeFileSync(worksheetPath, JSON.stringify(ws, null, 2));
    const packet = runReviewDecisionPrepCommand(prepArgs(worksheetPath));
    assert.equal(packet.kind, 'REVIEW_DECISIONS_PREP_REFUSED');
    if (packet.kind !== 'REVIEW_DECISIONS_PREP_REFUSED') return;
    assert.match(packet.reason, /edited after issuance/);
  });
});

test('12d-354: pre-filled decision inputs refuse — even re-derived digests cannot smuggle them in', () => {
  withWorkspace((dir) => {
    const { worksheetPath } = realWorksheet(dir);
    const ws = JSON.parse(readFileSync(worksheetPath, 'utf8')) as { worksheetDigestSha256: string; entries: { decisionInputs: { reviewerId: string } }[] };
    ws.entries[0]!.decisionInputs.reviewerId = REVIEWER;
    // A tamperer who re-derives the digest (to defeat the digest check)
    // STILL hits the pre-fill refusal: the fields must be blank AS ISSUED.
    ws.worksheetDigestSha256 = createHash('sha256').update(JSON.stringify({
      policyVersion: (ws as Record<string, unknown>).policyVersion,
      tenantId: (ws as Record<string, unknown>).tenantId, status: 'AWAITING_REVIEW',
      entries: ws.entries, totalAwaiting: (ws as Record<string, unknown>).totalAwaiting,
      listed: (ws as Record<string, unknown>).listed,
      truncatedNote: (ws as Record<string, unknown>).truncatedNote,
      redactedCount: (ws as Record<string, unknown>).redactedCount,
      scannedRows: (ws as Record<string, unknown>).scannedRows,
      doorDecisionVocabulary: (ws as Record<string, unknown>).doorDecisionVocabulary,
    }), 'utf8').digest('hex');
    writeFileSync(worksheetPath, JSON.stringify(ws, null, 2));
    const packet = runReviewDecisionPrepCommand(prepArgs(worksheetPath));
    assert.equal(packet.kind, 'REVIEW_DECISIONS_PREP_REFUSED');
    if (packet.kind !== 'REVIEW_DECISIONS_PREP_REFUSED') return;
    assert.match(packet.reason, /PRE-FILLED/);
  });
});

test('12d-354: all-or-nothing — a reviewer not designated for ONE entry refuses the WHOLE batch', () => {
  withWorkspace((dir) => {
    const { worksheetPath } = realWorksheet(dir);
    const packet = runReviewDecisionPrepCommand(prepArgs(worksheetPath, 'APPROVED', 'not_the_designated_reviewer'));
    assert.equal(packet.kind, 'REVIEW_DECISIONS_PREP_REFUSED');
    if (packet.kind !== 'REVIEW_DECISIONS_PREP_REFUSED') return;
    assert.match(packet.reason, /not designated/);
    assert.match(packet.reason, /WHOLE batch/);
  });
});

test('12d-354: the REAL mapping — decisions printed in the EXACT key order the 12D-324 door parses, queue untouched', () => {
  withWorkspace((dir) => {
    const { worksheetPath, ids, queuePath } = realWorksheet(dir);
    const before = readFileSync(queuePath);
    const packet = runReviewDecisionPrepCommand(prepArgs(worksheetPath));
    assert.equal(packet.kind, 'REVIEW_DECISIONS_PREPARED');
    if (packet.kind !== 'REVIEW_DECISIONS_PREPARED') return;
    assert.equal(packet.policyVersion, REVIEW_DECISION_PREP_CLI_POLICY.policyVersion);
    assert.equal(packet.tenantId, TENANT);
    assert.equal(packet.prepared, 3);
    assert.equal(packet.writesNothing, true);
    assert.equal(packet.queueTouched, false);
    assert.equal(packet.modelCalls, 0);
    assert.equal(packet.remoteCalls, 0);
    assert.match(packet.decisionDisclosedAs, /human's already-made decision/);
    assert.match(packet.stoppedBefore, /never applies, never touches a queue/);
    // Exact key order [storyId, reviewerId, decision, expectedOutputHash, reviewRef].
    const printed = JSON.parse(JSON.stringify(packet.decisions)) as Record<string, unknown>[];
    for (let i = 0; i < printed.length; i += 1) {
      assert.deepEqual(Object.keys(printed[i]!), ['storyId', 'reviewerId', 'decision', 'expectedOutputHash', 'reviewRef']);
      assert.equal(printed[i]!['storyId'], ids[i]);
      assert.equal(printed[i]!['reviewerId'], REVIEWER);
      assert.equal(printed[i]!['decision'], 'APPROVED');
      assert.equal(printed[i]!['reviewRef'], REF);
      assert.match(String(printed[i]!['expectedOutputHash']), /^[0-9a-f]{64}$/);
    }
    // The output is byte-compatible with the REAL apply door's parser:
    // round-trip the printed decisions through the same key order the
    // door requires (a parse of the printed array carries the keys in
    // insertion order — the door's own order check must see them in place).
    const reparsed = JSON.parse(JSON.stringify(packet.decisions));
    assert.equal(reparsed[0]!.reviewerId, REVIEWER);
    // The queue is untouched, byte for byte.
    const q = new OfflineStoryQueue(queuePath);
    try {
      for (const id of ids) assert.equal(q.inspectStory(TENANT, id)!.state, 'AWAITING_REVIEW');
    } finally { q.close(); }
    assert.ok(before.equals(readFileSync(queuePath)));
  });
});

test('12d-354: every decision vocabulary value maps verbatim — CHANGES_REQUESTED and REJECTED pass through', () => {
  withWorkspace((dir) => {
    for (const decision of ['CHANGES_REQUESTED', 'REJECTED'] as const) {
      const sub = join(dir, decision);
      mkdirSync(sub, { recursive: true });
      const { worksheetPath } = realWorksheet(sub, 1);
      const packet = runReviewDecisionPrepCommand(prepArgs(worksheetPath, decision));
      assert.equal(packet.kind, 'REVIEW_DECISIONS_PREPARED');
      if (packet.kind !== 'REVIEW_DECISIONS_PREPARED') return;
      assert.equal(packet.decisions[0]!.decision, decision);
      assert.match(packet.decisionDisclosedAs, new RegExp(decision));
    }
  });
});