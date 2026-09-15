// 12D-249 tests — adversarial coverage for the approval ledger summary.
// Under test: replay-before-read (a tampered journal or wrong seed refuses),
// the honest per-record report (registered / verified with real timestamps),
// absence reported honestly, impossible states refusing (a journal entry
// registered by an actor the record contradicts), read-only guarantee (the
// journal lines are byte-identical before and after), determinism, the seed
// never serializing into the summary, and verifyApprovalLedgerSummary
// catching a tampered or foreign summary. Nothing calls a network or a model.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  XIV_APPROVAL_LEDGER_POLICY,
  XIV_APPROVAL_LEDGER_GUARDRAILS,
  summarizeApprovalLedger,
  verifyApprovalLedgerSummary,
  type ApprovalLedgerSummary,
} from './xiv-approval-ledger';
import {
  buildApprovalCustodyPlan, deriveApprovalReceipt, type ApprovalDecisionRecord,
} from './xiv-approval-custody';
import { buildApprovalVerificationPlan } from './xiv-approval-verification';
import { runCustodyPlan } from './custody-runner';
import { buildStoryShellPacket } from './xiv-os-wire-contract';
import { OperatorCustodyRegistry } from './operator-custody-registry';
import { appendCustodyOp, type CustodyJournalStore } from './operator-custody-journal';

const T0 = 2_000_000;
const SEED = 'operator-ledger-seed-1';
const WRONG_SEED = 'operator-ledger-seed-9';
const OPERATOR = 'CEO-DEVIN-HAYNES';

function memStore(): CustodyJournalStore {
  let lines: string[] | null = null;
  return {
    load: () => (lines === null ? null : [...lines]),
    save: (next) => { lines = [...next]; },
  };
}

/** A verified packet + its 12D-247 approval plan for one decision. */
function decisionFixture(storyId: string, decision: 'APPROVED' | 'REJECTED'): {
  record: Readonly<ApprovalDecisionRecord>;
  registerPlan: ReturnType<typeof buildApprovalCustodyPlan>;
} {
  const packet = buildStoryShellPacket({
    storyId,
    headline: `XIV AI OS ${storyId} governs its decision honestly`,
    bodyText: 'The ledger summarizes what the custody journal durably recorded.',
    generatedAtMs: T0 + 50,
    avatar: null,
    decidingOver: 'whether the governed story may proceed to execution',
  });
  const plan = buildApprovalCustodyPlan({
    packet, decision, decidedBy: OPERATOR, decidedAtMs: T0 + 100,
  });
  return { record: plan.decisionRecord, registerPlan: plan };
}

test('12D-249 policy and guardrails are frozen with the pinned honest flags', () => {
  assert.ok(Object.isFrozen(XIV_APPROVAL_LEDGER_POLICY));
  assert.ok(Object.isFrozen(XIV_APPROVAL_LEDGER_GUARDRAILS));
  assert.equal(XIV_APPROVAL_LEDGER_GUARDRAILS.humanDecision, 'REQUIRED');
  assert.equal(XIV_APPROVAL_LEDGER_GUARDRAILS.learningPromoted, false);
  assert.equal(XIV_APPROVAL_LEDGER_GUARDRAILS.zeroRemoteCalls, true);
  assert.equal(XIV_APPROVAL_LEDGER_GUARDRAILS.zeroModelCalls, true);
  assert.equal(XIV_APPROVAL_LEDGER_GUARDRAILS.readOnlyNeverWrites, true);
  assert.equal(XIV_APPROVAL_LEDGER_GUARDRAILS.journalReplayedFailClosedBeforeReading, true);
  assert.equal(XIV_APPROVAL_LEDGER_GUARDRAILS.absenceReportedHonestly, true);
  assert.equal(XIV_APPROVAL_LEDGER_GUARDRAILS.billionUsersProven, false);
  assert.equal(XIV_APPROVAL_LEDGER_POLICY.purpose, 'xiv-os-human-approval');
});

test('12D-249 registered decisions are summarized with their real timestamps', () => {
  const store = memStore();
  const a = decisionFixture('12d-249-story-001', 'APPROVED');
  const b = decisionFixture('12d-249-story-002', 'REJECTED');
  runCustodyPlan({ store, seed: SEED, mode: 'bootstrap', steps: a.registerPlan.steps });
  runCustodyPlan({ store, seed: SEED, mode: 'resume', steps: b.registerPlan.steps });

  const summary = summarizeApprovalLedger({ store, seed: SEED, records: [a.record, b.record] });
  assert.equal(summary.schemaVersion, 1);
  assert.equal(summary.policyVersion, '12d-249-v1');
  assert.equal(summary.ledgerVerified, true);
  assert.equal(summary.journalOps, 2);
  assert.equal(summary.totalApprovalEntries, 2);
  assert.equal(summary.decisions.length, 2);
  for (const [d, rec] of [[summary.decisions[0], a.record], [summary.decisions[1], b.record]] as const) {
    assert.equal(d!.registered, true);
    assert.equal(d!.verified, false);
    assert.equal(d!.registeredAtMs, rec.decidedAtMs);
    assert.equal(d!.verifiedAtMs, null);
    assert.equal(d!.receiptSha256, deriveApprovalReceipt(rec));
    assert.equal(d!.decidedBy, OPERATOR);
  }
  assert.equal(summary.decisions[0]!.decision, 'APPROVED');
  assert.equal(summary.decisions[1]!.decision, 'REJECTED');
});

test('12D-249 the full lifecycle shows verified:true with the verification moment', () => {
  const store = memStore();
  const { record, registerPlan } = decisionFixture('12d-249-story-003', 'APPROVED');
  runCustodyPlan({ store, seed: SEED, mode: 'bootstrap', steps: registerPlan.steps });
  // Register-only view first: registered, not yet verified.
  const before = summarizeApprovalLedger({ store, seed: SEED, records: [record] });
  assert.equal(before.decisions[0]!.verified, false);
  // Then the 12D-248 verification consumes the receipt.
  const verPlan = buildApprovalVerificationPlan({ decisionRecord: record, verifiedAtMs: T0 + 200 });
  runCustodyPlan({ store, seed: SEED, mode: 'resume', steps: verPlan.steps });
  const after = summarizeApprovalLedger({ store, seed: SEED, records: [record] });
  assert.equal(after.journalOps, 2);
  assert.equal(after.totalApprovalEntries, 2);
  assert.equal(after.decisions[0]!.registered, true);
  assert.equal(after.decisions[0]!.verified, true);
  assert.equal(after.decisions[0]!.verifiedAtMs, T0 + 200);
});

test('12D-249 absence is reported honestly and non-approval ops are not approval entries', () => {
  const store = memStore();
  const { record, registerPlan } = decisionFixture('12d-249-story-004', 'APPROVED');
  // A non-approval custody op first (operator-authored, different purpose).
  const otherStep = {
    op: 'register' as const,
    receiptSha256: 'a'.repeat(64),
    purpose: 'xiv-os-unrelated-purpose',
    registeredBy: OPERATOR,
    issuedAtMs: T0 + 10,
    atMs: T0 + 10,
  };
  runCustodyPlan({ store, seed: SEED, mode: 'bootstrap', steps: [otherStep] });
  runCustodyPlan({ store, seed: SEED, mode: 'resume', steps: registerPlan.steps });

  const summary = summarizeApprovalLedger({ store, seed: SEED, records: [record] });
  assert.equal(summary.journalOps, 2);
  assert.equal(summary.totalApprovalEntries, 1); // only the fixed-purpose entry
  // An absent record (registered in no journal) reports registered:false.
  const absent: ApprovalDecisionRecord = {
    ...record, packetId: 'b'.repeat(64), storyId: '12d-249-story-absent',
  };
  const withAbsent = summarizeApprovalLedger({ store, seed: SEED, records: [record, absent] });
  assert.equal(withAbsent.decisions[0]!.registered, true);
  assert.equal(withAbsent.decisions[1]!.registered, false);
  assert.equal(withAbsent.decisions[1]!.verified, false);
  assert.equal(withAbsent.decisions[1]!.registeredAtMs, null);
  assert.equal(withAbsent.decisions[1]!.verifiedAtMs, null);
  assert.equal(withAbsent.decisions[1]!.receiptSha256, deriveApprovalReceipt(absent));
  // Empty records list still replays the journal and counts ops honestly.
  const none = summarizeApprovalLedger({ store, seed: SEED, records: [] });
  assert.equal(none.decisions.length, 0);
  assert.equal(none.journalOps, 2);
});

test('12D-249 a tampered journal refuses the summary before anything is read', () => {
  const store = memStore();
  const { record, registerPlan } = decisionFixture('12d-249-story-005', 'APPROVED');
  runCustodyPlan({ store, seed: SEED, mode: 'bootstrap', steps: registerPlan.steps });
  const lines = store.load()!;
  // Flip one hex char inside the recorded receipt — the digest chain breaks.
  const tampered = lines.map((l, i) => (i === 0
    ? l.replace(/"receiptSha256":"([0-9a-f])/, (_m, c: string) => `"receiptSha256":"${c === 'a' ? 'b' : 'a'}`)
    : l));
  assert.notEqual(tampered.join('\n'), lines.join('\n'));
  store.save(tampered);
  assert.throws(
    () => summarizeApprovalLedger({ store, seed: SEED, records: [record] }),
    /tampered|fail closed/,
  );
});

test('12D-249 a wrong seed refuses (the journal is bound to its genesis)', () => {
  const store = memStore();
  const { record, registerPlan } = decisionFixture('12d-249-story-006', 'APPROVED');
  runCustodyPlan({ store, seed: SEED, mode: 'bootstrap', steps: registerPlan.steps });
  assert.throws(
    () => summarizeApprovalLedger({ store, seed: WRONG_SEED, records: [record] }),
    /tampered|fail closed/,
  );
  // A missing journal refuses outright — journal-level absence is never summarized.
  assert.throws(
    () => summarizeApprovalLedger({ store: memStore(), seed: SEED, records: [record] }),
    /no custody journal found/,
  );
  // Malformed call shapes refuse.
  assert.throws(
    () => summarizeApprovalLedger({ store, seed: SEED, records: [record], extra: 1 } as never),
    /exactly the keys/,
  );
  assert.throws(
    () => summarizeApprovalLedger({ store, seed: 'short', records: [record] }),
    /custody seed must match/,
  );
});

test('12D-249 a journal entry registered by a contradicting actor refuses', () => {
  // Impossible honestly (the receipt binds decidedBy), so build it directly:
  // the registry accepts the receipt, the journal records the impostor's actor.
  const store = memStore();
  const registry = new OperatorCustodyRegistry(SEED);
  const { record } = decisionFixture('12d-249-story-007', 'APPROVED');
  const receipt = deriveApprovalReceipt(record);
  appendCustodyOp(registry, store, SEED, 'register', {
    receiptSha256: receipt,
    purpose: 'xiv-os-human-approval',
    registeredBy: 'IMPOSTOR-OPERATOR',
    issuedAtMs: record.decidedAtMs,
    registeredAtMs: record.decidedAtMs,
  });
  assert.throws(
    () => summarizeApprovalLedger({ store, seed: SEED, records: [record] }),
    /registered by 'IMPOSTOR-OPERATOR' but the record says 'CEO-DEVIN-HAYNES'/,
  );
});

test('12D-249 the summary is read-only: journal lines are byte-identical before and after', () => {
  const store = memStore();
  const { record, registerPlan } = decisionFixture('12d-249-story-008', 'APPROVED');
  runCustodyPlan({ store, seed: SEED, mode: 'bootstrap', steps: registerPlan.steps });
  const before = store.load()!.join('\n');
  const summary = summarizeApprovalLedger({ store, seed: SEED, records: [record] });
  verifyApprovalLedgerSummary(summary, { store, seed: SEED, records: [record] });
  assert.equal(store.load()!.join('\n'), before);
  // The summary is frozen and deterministic; it never carries the seed.
  assert.ok(Object.isFrozen(summary));
  assert.ok(Object.isFrozen(summary.decisions));
  const again = summarizeApprovalLedger({ store, seed: SEED, records: [record] });
  assert.equal(JSON.stringify(again), JSON.stringify(summary));
  const serialized = JSON.stringify(summary);
  assert.equal(serialized.includes(SEED), false);
  assert.equal(serialized.includes(WRONG_SEED), false);
  // The summary round-trips JSON and still verifies.
  const transported = JSON.parse(serialized) as ApprovalLedgerSummary;
  assert.equal(verifyApprovalLedgerSummary(transported, { store, seed: SEED, records: [record] }).ok, true);
});

test('12D-249 a tampered or foreign summary refuses verification', () => {
  const store = memStore();
  const { record, registerPlan } = decisionFixture('12d-249-story-009', 'APPROVED');
  runCustodyPlan({ store, seed: SEED, mode: 'bootstrap', steps: registerPlan.steps });
  const summary = summarizeApprovalLedger({ store, seed: SEED, records: [record] });

  // A flipped registered flag refuses (the re-derivation disagrees).
  assert.throws(
    () => verifyApprovalLedgerSummary(
      { ...summary, decisions: [{ ...summary.decisions[0]!, registered: false, registeredAtMs: null }] },
      { store, seed: SEED, records: [record] },
    ),
    /mismatch — tampered, foreign, or stale/,
  );
  // A summary for a DIFFERENT record set refuses (foreign).
  const other = decisionFixture('12d-249-story-010', 'REJECTED');
  assert.throws(
    () => verifyApprovalLedgerSummary(summary, { store, seed: SEED, records: [other.record] }),
    /mismatch — tampered, foreign, or stale/,
  );
  // A smuggled key refuses the shape gate.
  assert.throws(
    () => verifyApprovalLedgerSummary({ ...summary, smuggled: true } as never, { store, seed: SEED, records: [record] }),
    /exactly the keys/,
  );
  // An unpinned ledgerVerified refuses (the summary never emits an unverified view).
  assert.throws(
    () => verifyApprovalLedgerSummary({ ...summary, ledgerVerified: false } as never, { store, seed: SEED, records: [record] }),
    /pinned true/,
  );
  // Tampered guardrails refuse.
  assert.throws(
    () => verifyApprovalLedgerSummary({ ...summary, guardrails: { ...XIV_APPROVAL_LEDGER_GUARDRAILS, readOnlyNeverWrites: false } } as never, { store, seed: SEED, records: [record] }),
    /must equal the frozen 12D-249 guardrails/,
  );
});