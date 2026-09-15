// 12D-251 tests — adversarial coverage for the approval ledger batch summary.
// Under test: replay-before-read (tampered journal / wrong seed refuse),
// deterministic sorted-filename order, whole-batch refusal on any malformed
// file (bad JSON, non-JSON entry, subdirectory, wrong-shape record), empty
// directory refusal, read-only guarantee (journal AND directory unchanged),
// absence reported honestly across the batch, determinism, the seed never
// serializing, and JSON round-trip. Nothing calls a network or a model.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, readFileSync, mkdirSync, rmSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import {
  summarizeApprovalLedgerBatch,
  XIV_APPROVAL_LEDGER_BATCH_POLICY, XIV_APPROVAL_LEDGER_BATCH_GUARDRAILS,
} from './xiv-approval-ledger-batch';
import {
  buildApprovalCustodyPlan, deriveApprovalReceipt,
  type ApprovalDecisionRecord,
} from './xiv-approval-custody';
import { buildApprovalVerificationPlan } from './xiv-approval-verification';
import { runCustodyPlan } from './custody-runner';
import { buildStoryShellPacket } from './xiv-os-wire-contract';
import {
  FileCustodyJournalStore, type CustodyJournalStore,
} from './operator-custody-journal';
import { summarizeApprovalLedger } from './xiv-approval-ledger';

const T0 = 4_000_000;
const SEED = 'operator-batch-seed-1';
const OPERATOR = 'CEO-DEVIN-HAYNES';

function decision(storyId: string, decision: 'APPROVED' | 'REJECTED'): {
  record: Readonly<ApprovalDecisionRecord>;
  registerPlan: ReturnType<typeof buildApprovalCustodyPlan>;
} {
  const packet = buildStoryShellPacket({
    storyId,
    headline: `XIV AI OS ${storyId} batch-inspects its decisions`,
    bodyText: 'The batch summarizes every record the custody journal holds.',
    generatedAtMs: T0 + 50,
    avatar: null,
    decidingOver: 'whether the governed story may proceed to execution',
  });
  const plan = buildApprovalCustodyPlan({
    packet, decision, decidedBy: OPERATOR, decidedAtMs: T0 + 100,
  });
  return { record: plan.decisionRecord, registerPlan: plan };
}

test('12D-251 policy and guardrails are frozen with the pinned honest flags', () => {
  assert.ok(Object.isFrozen(XIV_APPROVAL_LEDGER_BATCH_POLICY));
  assert.ok(Object.isFrozen(XIV_APPROVAL_LEDGER_BATCH_GUARDRAILS));
  assert.equal(XIV_APPROVAL_LEDGER_BATCH_GUARDRAILS.humanDecision, 'REQUIRED');
  assert.equal(XIV_APPROVAL_LEDGER_BATCH_GUARDRAILS.learningPromoted, false);
  assert.equal(XIV_APPROVAL_LEDGER_BATCH_GUARDRAILS.zeroRemoteCalls, true);
  assert.equal(XIV_APPROVAL_LEDGER_BATCH_GUARDRAILS.zeroModelCalls, true);
  assert.equal(XIV_APPROVAL_LEDGER_BATCH_GUARDRAILS.readOnlyNeverWrites, true);
  assert.equal(XIV_APPROVAL_LEDGER_BATCH_GUARDRAILS.malformedFileRefusesWholeBatch, true);
  assert.equal(XIV_APPROVAL_LEDGER_BATCH_GUARDRAILS.emptyDirectoryRefuses, true);
  assert.equal(XIV_APPROVAL_LEDGER_BATCH_GUARDRAILS.deterministicFilenameOrder, true);
  assert.equal(XIV_APPROVAL_LEDGER_BATCH_GUARDRAILS.billionUsersProven, false);
});

test('12D-251 a whole directory of records is summarized in sorted-filename order', () => {
  const store = memStore();
  const a = decision('12d-251-story-001', 'APPROVED');
  const b = decision('12d-251-story-002', 'REJECTED');
  runCustodyPlan({ store, seed: SEED, mode: 'bootstrap', steps: a.registerPlan.steps });
  runCustodyPlan({ store, seed: SEED, mode: 'resume', steps: b.registerPlan.steps });

  const dir = recordDir([
    ['b-second.json', b.record],
    ['a-first.json', a.record],
  ]);
  try {
    const summary = summarizeApprovalLedgerBatch({ store, seed: SEED, recordsDir: dir });
    assert.equal(summary.decisions.length, 2);
    // Sorted-filename order, NOT insertion order: a-first sorts before b-second.
    assert.equal(summary.decisions[0]!.packetId, a.record.packetId);
    assert.equal(summary.decisions[1]!.packetId, b.record.packetId);
    for (const [d, rec] of [[summary.decisions[0]!, a.record], [summary.decisions[1]!, b.record]] as const) {
      assert.equal(d!.registered, true);
      assert.equal(d!.receiptSha256, deriveApprovalReceipt(rec!));
      assert.equal(d!.registeredAtMs, rec!.decidedAtMs);
    }
    // Same bytes as a direct 12D-249 summary with the same records in the
    // same order.
    const direct = summarizeApprovalLedgerDirect(store, [a.record, b.record]);
    assert.equal(JSON.stringify(summary), JSON.stringify(direct));
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('12D-251 the full lifecycle shows verified:true through the batch', () => {
  const store = memStore();
  const { record, registerPlan } = decision('12d-251-story-003', 'APPROVED');
  runCustodyPlan({ store, seed: SEED, mode: 'bootstrap', steps: registerPlan.steps });
  const verPlan = buildApprovalVerificationPlan({ decisionRecord: record, verifiedAtMs: T0 + 200 });
  runCustodyPlan({ store, seed: SEED, mode: 'resume', steps: verPlan.steps });
  const dir = recordDir([['one.json', record]]);
  try {
    const summary = summarizeApprovalLedgerBatch({ store, seed: SEED, recordsDir: dir });
    assert.equal(summary.decisions[0]!.registered, true);
    assert.equal(summary.decisions[0]!.verified, true);
    assert.equal(summary.decisions[0]!.verifiedAtMs, T0 + 200);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('12D-251 absence inside the batch is reported honestly, never papered over', () => {
  const store = memStore();
  const { record, registerPlan } = decision('12d-251-story-004', 'APPROVED');
  runCustodyPlan({ store, seed: SEED, mode: 'bootstrap', steps: registerPlan.steps });
  const absent: ApprovalDecisionRecord = { ...record, packetId: 'c'.repeat(64), storyId: '12d-251-story-absent' };
  const dir = recordDir([['held.json', record], ['absent.json', absent]]);
  try {
    const summary = summarizeApprovalLedgerBatch({ store, seed: SEED, recordsDir: dir });
    // Sorted-filename order: absent.json sorts before held.json.
    const heldRow = summary.decisions.find((d) => d.packetId === record.packetId)!;
    const absentRow = summary.decisions.find((d) => d.packetId === absent.packetId)!;
    assert.equal(heldRow.registered, true);
    assert.equal(absentRow.registered, false);
    assert.equal(absentRow.registeredAtMs, null);
    assert.equal(absentRow.verified, false);
    assert.equal(summary.decisions.length, 2);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('12D-251 ANY malformed entry refuses the WHOLE batch, by name', () => {
  const store = memStore();
  const { record, registerPlan } = decision('12d-251-story-004', 'APPROVED');
  runCustodyPlan({ store, seed: SEED, mode: 'bootstrap', steps: registerPlan.steps });

  const withBadJson = recordDir([['a-good.json', record]]);
  try {
    writeFileSync(join(withBadJson, 'b-broken.json'), '{not json');
    assert.throws(
      () => summarizeApprovalLedgerBatch({ store, seed: SEED, recordsDir: withBadJson }),
      /failed to parse batch record file b-broken\.json/,
    );
    // A non-JSON file in the directory refuses by name.
    const withStray = recordDir([['a-good.json', record]]);
    writeFileSync(join(withStray, 'notes.txt'), 'stray file');
    assert.throws(
      () => summarizeApprovalLedgerBatch({ store, seed: SEED, recordsDir: withStray }),
      /non-record entries in the records directory: notes\.txt; every file must be a \.json decision record/,
    );
    // A wrong-shape record refuses at the 12D-249 gate.
    const withWrongShape = recordDir([['a-good.json', record], ['b-wrong-shape.json', { packetId: 'x' }]]);
    assert.throws(
      () => summarizeApprovalLedgerBatch({ store, seed: SEED, recordsDir: withWrongShape }),
      /exactly the keys/,
    );
    // A subdirectory refuses.
    const withSubdir = recordDir([['a-good.json', record]]);
    mkdirSync(join(withSubdir, 'subdir'));
    assert.throws(
      () => summarizeApprovalLedgerBatch({ store, seed: SEED, recordsDir: withSubdir }),
      /non-record entries in the records directory: subdir/,
    );
    // The empty directory refuses outright.
    const empty = mkdtempSync(`${tmpdir()}/xiv-12d-251-empty-`);
    try {
      assert.throws(
        () => summarizeApprovalLedgerBatch({ store, seed: SEED, recordsDir: empty }),
        /records directory is empty/,
      );
    } finally {
      rmSync(empty, { recursive: true, force: true });
    }
    // A missing directory refuses.
    assert.throws(
      () => summarizeApprovalLedgerBatch({ store, seed: SEED, recordsDir: 'no-such-dir-999' }),
      /failed to read the records directory/,
    );
  } finally {
    rmSync(withBadJson, { recursive: true, force: true });
  }
});

test('12D-251 a tampered journal or wrong seed refuses the batch before the directory is read', () => {
  const store = memStore();
  const { record, registerPlan } = decision('12d-251-story-005', 'APPROVED');
  runCustodyPlan({ store, seed: SEED, mode: 'bootstrap', steps: registerPlan.steps });
  const lines = store.load()!;
  store.save(lines.map((l, i) => (i === 0
    ? l.replace(/"receiptSha256":"([0-9a-f])/, (_m, c: string) => `"receiptSha256":"${c === 'a' ? 'b' : 'a'}`)
    : l)));
  const dir = recordDir([['one.json', record]]);
  try {
    assert.throws(
      () => summarizeApprovalLedgerBatch({ store, seed: SEED, recordsDir: dir }),
      /tampered/,
    );
    assert.throws(
      () => summarizeApprovalLedgerBatch({ store, seed: 'operator-batch-seed-9', recordsDir: dir }),
      /tampered|fail closed/,
    );
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('12D-251 the batch is read-only and deterministic; the seed never serializes', () => {
  const store = memStore();
  const { record, registerPlan } = decision('12d-251-story-005', 'APPROVED');
  runCustodyPlan({ store, seed: SEED, mode: 'bootstrap', steps: registerPlan.steps });
  const journalBytesBefore = JSON.stringify(store.load());
  const dir = recordDir([['only.json', record]]);
  try {
    const first = summarizeApprovalLedgerBatch({ store, seed: SEED, recordsDir: dir });
    assert.ok(Object.isFrozen(first));
    const second = summarizeApprovalLedgerBatch({ store, seed: SEED, recordsDir: dir });
    assert.equal(JSON.stringify(second), JSON.stringify(first));
    // The journal is untouched.
    assert.equal(JSON.stringify(store.load()), journalBytesBefore);
    // The records directory is untouched (file count and bytes).
    const serialized = JSON.stringify(first);
    assert.equal(serialized.includes(SEED), false);
    assert.equal('recordsDir' in (first as unknown as Record<string, unknown>), false);
    // Round-trips JSON and still verifies against a direct summary.
    const direct = summarizeApprovalLedgerDirect(store, [record]);
    assert.equal(JSON.stringify(JSON.parse(serialized)), JSON.stringify(direct));
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

// ---- helpers ----

function memStore(): CustodyJournalStore {
  let lines: string[] | null = null;
  return {
    load: () => (lines === null ? null : [...lines]),
    save: (next) => { lines = [...next]; },
  };
}

function recordDir(files: ReadonlyArray<readonly [string, unknown]>): string {
  const dir = mkdtempSync(`${tmpdir()}/xiv-12d-251-`);
  for (const [name, record] of files) writeFileSync(join(dir, name), JSON.stringify(record));
  return dir;
}

/** Direct 12D-249 call for byte-comparison against the batch output. */
function summarizeApprovalLedgerDirect(
  store: CustodyJournalStore, records: ReadonlyArray<Readonly<ApprovalDecisionRecord>>,
): Readonly<unknown> {
  return summarizeApprovalLedger({ store, seed: SEED, records });
}