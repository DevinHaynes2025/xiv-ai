// 12D-252 tests — adversarial coverage for the Approval Ledger Batch CLI.
// Under test: strict arg parsing (unknown keys refuse, '='-bearing values
// survive), missing-argument refusals by name, empty/missing/non-record
// directory refusals THROUGH the CLI, the HAPPY PATH end-to-end (a real
// journal on disk + a real records directory → correct JSON), tampered
// journal refusal, read-only (journal bytes identical), the seed never
// appearing in any packet, and the exit-2 error packet. Nothing calls a
// network or a model.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, readFileSync, rmSync, mkdirSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import {
  runApprovalLedgerBatchCli, mainApprovalLedgerBatchCli,
  APPROVAL_LEDGER_BATCH_CLI_POLICY, APPROVAL_LEDGER_BATCH_CLI_HONEST_FLAGS,
} from './xiv-approval-ledger-batch.cli';
import { buildApprovalCustodyPlan } from './xiv-approval-custody';
import { buildApprovalVerificationPlan } from './xiv-approval-verification';
import { runCustodyPlan } from './custody-runner';
import { buildStoryShellPacket } from './xiv-os-wire-contract';
import { FileCustodyJournalStore } from './operator-custody-journal';
import { summarizeApprovalLedgerBatch } from './xiv-approval-ledger-batch';

const T0 = 5_000_000;
const SEED = 'operator-batch-cli-seed-1';
const OPERATOR = 'CEO-DEVIN-HAYNES';

function decision(storyId: string, decision: 'APPROVED' | 'REJECTED') {
  const packet = buildStoryShellPacket({
    storyId,
    headline: `XIV AI OS ${storyId} batch-CLI inspects its decisions`,
    bodyText: 'The batch CLI prints what the custody journal durably holds.',
    generatedAtMs: T0 + 50,
    avatar: null,
    decidingOver: 'whether the governed story may proceed to execution',
  });
  return buildApprovalCustodyPlan({
    packet, decision, decidedBy: OPERATOR, decidedAtMs: T0 + 100,
  });
}

test('12D-252 policy and honest flags are frozen with the pinned values', () => {
  assert.ok(Object.isFrozen(APPROVAL_LEDGER_BATCH_CLI_POLICY));
  assert.ok(Object.isFrozen(APPROVAL_LEDGER_BATCH_CLI_HONEST_FLAGS));
  assert.equal(APPROVAL_LEDGER_BATCH_CLI_POLICY.policyVersion, '12d-252-v1');
  assert.equal(APPROVAL_LEDGER_BATCH_CLI_HONEST_FLAGS.humanDecision, 'REQUIRED');
  assert.equal(APPROVAL_LEDGER_BATCH_CLI_HONEST_FLAGS.learningPromoted, false);
  assert.equal(APPROVAL_LEDGER_BATCH_CLI_HONEST_FLAGS.remoteCalls, 0);
  assert.equal(APPROVAL_LEDGER_BATCH_CLI_HONEST_FLAGS.modelCalls, 0);
  assert.equal(APPROVAL_LEDGER_BATCH_CLI_HONEST_FLAGS.readOnlyNeverWrites, true);
  assert.equal(APPROVAL_LEDGER_BATCH_CLI_HONEST_FLAGS.billionUsersProven, false);
});

test('12D-252 arg parsing refuses non-key=value, duplicates, and UNKNOWN keys', () => {
  assert.throws(
    () => runApprovalLedgerBatchCli([`--records-dir=x`, 'seed=y']),
    /must be --key=value/,
  );
  assert.throws(
    () => runApprovalLedgerBatchCli(['--seed=a', '--seed=b']),
    /duplicate argument --seed/,
  );
  assert.throws(
    () => runApprovalLedgerBatchCli([`--decision-record=x`, `--seed=${SEED}`, '--journal=j']),
    /unknown argument --decision-record/, // the SINGLE-record flag is unknown here — this is the batch CLI
  );
  assert.throws(
    () => runApprovalLedgerBatchCli([`--records-dir=x`, `--seed=${SEED}`, '--journal=j', '--extra=1']),
    /unknown argument --extra/,
  );
});

test('12D-252 missing arguments refuse by name', () => {
  assert.throws(
    () => runApprovalLedgerBatchCli([`--seed=${SEED}`]),
    /missing required argument --records-dir/,
  );
  assert.throws(
    () => runApprovalLedgerBatchCli([`--seed=${SEED}`, '--records-dir=x']),
    /missing required argument --journal/,
  );
  assert.throws(
    () => runApprovalLedgerBatchCli(['--journal=j', '--records-dir=x']),
    /missing required argument --seed/,
  );
});

test('12D-252 HAPPY PATH: a real journal and a real records directory report the whole batch', () => {
  const dir = mkdtempSync(`${tmpdir()}/xiv-12d-252-happy-`);
  try {
    const journalPath = join(dir, 'custody-journal.jsonl');
    const store = new FileCustodyJournalStore(journalPath);
    const a = decision('12d-252-story-001', 'APPROVED');
    const b = decision('12d-252-story-002', 'REJECTED');
    runCustodyPlan({ store, seed: SEED, mode: 'bootstrap', steps: a.steps });
    runCustodyPlan({ store, seed: SEED, mode: 'resume', steps: b.steps });
    // The 12D-248 verification of decision A.
    const verPlan = buildApprovalVerificationPlan({
      decisionRecord: a.decisionRecord, verifiedAtMs: T0 + 200,
    });
    runCustodyPlan({ store, seed: SEED, mode: 'resume', steps: verPlan.steps });

    // The operator holds both records in one directory (reverse filename
    // order on purpose — the batch sorts by filename, not insertion).
    const recordsDir = join(dir, 'records');
    mkdirSync(recordsDir);
    writeFileSync(join(recordsDir, 'z-second.json'), JSON.stringify(b.decisionRecord));
    writeFileSync(join(recordsDir, 'a-first.json'), JSON.stringify(a.decisionRecord));

    const packetOut = runApprovalLedgerBatchCli([
      `--journal=${journalPath}`, `--seed=${SEED}`, `--records-dir=${recordsDir}`,
    ]);
    assert.equal(packetOut.schemaVersion, 1);
    assert.equal(packetOut.action, 'summarize-batch');
    assert.equal(packetOut.flags.humanDecision, 'REQUIRED');
    assert.equal(packetOut.result.decisions.length, 2);
    // Sorted-filename order: a-first first, z-second second.
    assert.equal(packetOut.result.decisions[0]!.packetId, a.decisionRecord.packetId);
    assert.equal(packetOut.result.decisions[0]!.verified, true);
    assert.equal(packetOut.result.decisions[0]!.verifiedAtMs, T0 + 200);
    assert.equal(packetOut.result.decisions[1]!.decision, 'REJECTED');
    assert.equal(packetOut.result.decisions[1]!.registered, true);
    // The packet matches a direct 12D-251 summary of the same inputs.
    const direct = summarizeApprovalLedgerBatch({
      store, seed: SEED, recordsDir,
    });
    assert.equal(JSON.stringify(packetOut.result), JSON.stringify(direct));
    // The seed never serializes into the packet.
    const serialized = JSON.stringify(packetOut);
    assert.equal(serialized.includes(SEED), false);
    assert.equal('seed' in packetOut, false);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('12D-252 an empty records directory refuses THROUGH the CLI, by name', () => {
  const dir = mkdtempSync(`${tmpdir()}/xiv-12d-252-empty-`);
  try {
    const empty = mkdtempSync(`${tmpdir()}/xiv-12d-252-empty-dir-`);
    try {
      assert.throws(
        () => runApprovalLedgerBatchCli([
          `--journal=${join(dir, 'no-journal.jsonl')}`, `--seed=${SEED}`, `--records-dir=${empty}`,
        ]),
        /no custody journal found|records directory is empty/,
      );
      // With a REAL journal, the empty directory is what refuses.
      const journalPath = join(dir, 'custody-journal.jsonl');
      const plan = decision('12d-252-story-003', 'APPROVED');
      runCustodyPlan({
        store: new FileCustodyJournalStore(journalPath), seed: SEED,
        mode: 'bootstrap', steps: plan.steps,
      });
      assert.throws(
        () => runApprovalLedgerBatchCli([
          `--journal=${journalPath}`, `--seed=${SEED}`, `--records-dir=${empty}`,
        ]),
        /records directory is empty/,
      );
      // A stray non-record file refuses by name.
      writeFileSync(join(empty, 'notes.txt'), 'stray');
      assert.throws(
        () => runApprovalLedgerBatchCli([
          `--journal=${journalPath}`, `--seed=${SEED}`, `--records-dir=${empty}`,
        ]),
        /non-record entries in the records directory: notes\.txt/,
      );
    } finally {
      rmSync(empty, { recursive: true, force: true });
    }
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('12D-252 a tampered journal refuses THROUGH the batch CLI', () => {
  const dir = mkdtempSync(`${tmpdir()}/xiv-12d-252-tamper-`);
  try {
    const journalPath = join(dir, 'custody-journal.jsonl');
    const store = new FileCustodyJournalStore(journalPath);
    const plan = decision('12d-252-story-004', 'APPROVED');
    runCustodyPlan({ store, seed: SEED, mode: 'bootstrap', steps: plan.steps });
    const recordsDir = join(dir, 'records');
    mkdirSync(recordsDir);
    writeFileSync(join(recordsDir, 'one.json'), JSON.stringify(plan.decisionRecord));
    // Flip one hex char inside the recorded receipt — the digest chain breaks.
    const lines = readFileSync(journalPath, 'utf8').split('\n').filter((l) => l.length > 0);
    const tampered = lines.map((l, i) => (i === 0
      ? l.replace(/"receiptSha256":"([0-9a-f])/, (_m, c: string) => `"receiptSha256":"${c === 'a' ? 'b' : 'a'}`)
      : l));
    writeFileSync(journalPath, `${tampered.join('\n')}\n`);
    assert.throws(
      () => runApprovalLedgerBatchCli([
        `--journal=${journalPath}`, `--seed=${SEED}`, `--records-dir=${recordsDir}`,
      ]),
      /tampered/,
    );
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('12D-252 the batch CLI is read-only: the journal file is byte-identical after a run', () => {
  const dir = mkdtempSync(`${tmpdir()}/xiv-12d-252-ro-`);
  try {
    const journalPath = join(dir, 'custody-journal.jsonl');
    const store = new FileCustodyJournalStore(journalPath);
    const plan = decision('12d-252-story-005', 'APPROVED');
    runCustodyPlan({ store, seed: SEED, mode: 'bootstrap', steps: plan.steps });
    const recordsDir = join(dir, 'records');
    mkdirSync(recordsDir);
    writeFileSync(join(recordsDir, 'only.json'), JSON.stringify(plan.decisionRecord));
    const before = readFileSync(journalPath);
    const recordsBefore = readFileSync(join(recordsDir, 'only.json'));
    runApprovalLedgerBatchCli([
      `--journal=${journalPath}`, `--seed=${SEED}`, `--records-dir=${recordsDir}`,
    ]);
    assert.equal(Buffer.compare(readFileSync(journalPath), before), 0);
    assert.equal(Buffer.compare(readFileSync(join(recordsDir, 'only.json')), recordsBefore), 0);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('12D-252 the error packet is honest, exits 2, and never echoes the seed', () => {
  const priorExitCode = process.exitCode;
  process.exitCode = undefined;
  try {
    const writes: string[] = [];
    const origWrite = process.stderr.write.bind(process.stderr);
    (process.stderr as { write: (chunk: string) => boolean }).write = (chunk: string) => {
      writes.push(chunk); return true;
    };
    try {
      mainApprovalLedgerBatchCli([`--seed=${SEED}`]); // missing journal + records-dir
    } finally {
      (process.stderr as { write: typeof origWrite }).write = origWrite;
    }
    assert.equal(process.exitCode, 2);
    const errPacket = JSON.parse(writes.join('')) as Record<string, unknown>;
    assert.equal(errPacket.ok, false);
    assert.equal(errPacket.policyVersion, '12d-252-v1');
    assert.match(String(errPacket.error), /missing required argument --records-dir/);
    assert.equal(writes.join('').includes(SEED), false);
  } finally {
    process.exitCode = priorExitCode;
  }
});