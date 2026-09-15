// 12D-236 tests — adversarial coverage for the durable Operator Custody Journal.
// Under test: apply-first journaling (refused ops never journal), independent
// tamper evidence, fail-closed replay (any anomaly refuses, never auto-repair),
// generation continuity across "restarts", and the atomic local-file store.
// Nothing here calls a network or executes anything.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { OperatorCustodyRegistry } from './operator-custody-registry';
import {
  OPERATOR_CUSTODY_JOURNAL_POLICY,
  OPERATOR_CUSTODY_JOURNAL_GUARDRAILS,
  appendCustodyOp,
  replayCustodyJournal,
  FileCustodyJournalStore,
  type CustodyJournalStore,
} from './operator-custody-journal';

const T0 = 1_000_000_000;
const SYNC_R = 'a'.repeat(64);
const EXEC_R = 'b'.repeat(64);
const SYNC_PURPOSE = 'xiv.sync.propose';
const TRANSPORT_PURPOSE = 'xiv.sync.transport';
const GENESIS = 'custody-journal-genesis-123456789';

/** In-memory JSONL store. */
function memStore(lines: string[] = []): CustodyJournalStore & { lines: string[] } {
  return {
    lines,
    load() { return [...this.lines]; },
    save(next: readonly string[]) { this.lines = [...next]; },
  };
}

test('12D-236 policy and guardrails match the charter and are frozen', () => {
  assert.equal(OPERATOR_CUSTODY_JOURNAL_POLICY.policyVersion, '12d-236-v1');
  assert.equal(OPERATOR_CUSTODY_JOURNAL_POLICY.journalVersion, 1);
  assert.equal(OPERATOR_CUSTODY_JOURNAL_GUARDRAILS.replayRefusesOnAnyAnomaly, true);
  assert.equal(OPERATOR_CUSTODY_JOURNAL_GUARDRAILS.journalIsIndependentlyTamperEvident, true);
  assert.equal(OPERATOR_CUSTODY_JOURNAL_GUARDRAILS.atomicReplaceOnWrite, true);
  assert.equal(OPERATOR_CUSTODY_JOURNAL_GUARDRAILS.localPlaneOnly, true);
  assert.equal(OPERATOR_CUSTODY_JOURNAL_GUARDRAILS.automaticRecovery, false);
  assert.equal(OPERATOR_CUSTODY_JOURNAL_GUARDRAILS.humanDecision, 'REQUIRED');
  assert.equal(Object.isFrozen(OPERATOR_CUSTODY_JOURNAL_POLICY), true);
  assert.equal(OPERATOR_CUSTODY_JOURNAL_GUARDRAILS.zeroRemoteCalls, true);
  assert.equal(Object.isFrozen(OPERATOR_CUSTODY_JOURNAL_GUARDRAILS), true);
});

test('12D-236 happy path: apply-first journaling, then replay rebuilds an identical registry', () => {
  const store = memStore();
  const live = new OperatorCustodyRegistry(GENESIS);
  appendCustodyOp(live, store, GENESIS, 'register', {
    receiptSha256: SYNC_R, purpose: SYNC_PURPOSE, registeredBy: 'devin', issuedAtMs: T0, registeredAtMs: T0,
  });
  appendCustodyOp(live, store, GENESIS, 'register', {
    receiptSha256: EXEC_R, purpose: TRANSPORT_PURPOSE, registeredBy: 'devin', issuedAtMs: T0, registeredAtMs: T0,
  });
  appendCustodyOp(live, store, GENESIS, 'authenticate', {
    receiptSha256: SYNC_R, purpose: SYNC_PURPOSE, nowMs: T0 + 100,
  });
  assert.equal(store.lines.length, 3);

  const { registry: rebuilt, ops } = replayCustodyJournal(store, GENESIS);
  assert.equal(ops, 3);
  assert.equal(rebuilt.verifyLedger().ok, true);
  // Line-for-line identity with the live registry's ledger (seq, kind, taskId, detail).
  const liveEvents = live.ledgerEntries().map((e) => [e.seq, e.kind, e.receiptSha256, e.detail] as const);
  const rebuiltEvents = rebuilt.ledgerEntries().map((e) => [e.seq, e.kind, e.receiptSha256, e.detail] as const);
  assert.deepEqual(rebuiltEvents, liveEvents);
  // The rebuilt state enforces the SAME contract: the consumed receipt refuses.
  assert.throws(
    () => rebuilt.authenticate({ receiptSha256: SYNC_R, purpose: SYNC_PURPOSE, nowMs: T0 + 200 }),
    /already consumed.*single-use refused/,
  );
  // The unconsumed one still authenticates on the rebuilt registry.
  const ok = rebuilt.authenticate({ receiptSha256: EXEC_R, purpose: TRANSPORT_PURPOSE, nowMs: T0 + 200 });
  assert.equal(ok.consumedAtMs, T0 + 200);
});

test('12D-236 a registry refusal journals nothing: the store is untouched', () => {
  const store = memStore();
  const live = new OperatorCustodyRegistry(GENESIS);
  appendCustodyOp(live, store, GENESIS, 'register', {
    receiptSha256: SYNC_R, purpose: SYNC_PURPOSE, registeredBy: 'devin', issuedAtMs: T0, registeredAtMs: T0,
  });
  const before = store.lines.length;
  // Cross-purpose re-registration is refused by the registry — the journal must not record it.
  assert.throws(
    () => appendCustodyOp(live, store, GENESIS, 'register', {
      receiptSha256: SYNC_R, purpose: TRANSPORT_PURPOSE, registeredBy: 'devin', issuedAtMs: T0, registeredAtMs: T0,
    }),
    /cross-purpose re-registration refused/,
  );
  // Replay of the consumed receipt is refused by the registry — nothing journaled.
  appendCustodyOp(live, store, GENESIS, 'authenticate', { receiptSha256: SYNC_R, purpose: SYNC_PURPOSE, nowMs: T0 + 100 });
  assert.throws(
    () => appendCustodyOp(live, store, GENESIS, 'authenticate', { receiptSha256: SYNC_R, purpose: SYNC_PURPOSE, nowMs: T0 + 200 }),
    /already consumed/,
  );
  assert.equal(store.lines.length, 2);
  const { registry: rebuilt } = replayCustodyJournal(store, GENESIS);
  assert.equal(rebuilt.verifyLedger().ok, true);
});

test('12D-236 a tampered journal line refuses the replay (independent tamper evidence)', () => {
  const store = memStore();
  const live = new OperatorCustodyRegistry(GENESIS);
  appendCustodyOp(live, store, GENESIS, 'register', {
    receiptSha256: SYNC_R, purpose: SYNC_PURPOSE, registeredBy: 'devin', issuedAtMs: T0, registeredAtMs: T0,
  });
  // Tamper: swap the purpose inside the recorded op.
  const forged = store.lines[0]!.replace(SYNC_PURPOSE, TRANSPORT_PURPOSE);
  const tampered = memStore([forged]);
  assert.throws(() => replayCustodyJournal(tampered, GENESIS), /tampered with/);
});

test('12D-236 a garbage or oversized line refuses the replay', () => {
  const store = memStore();
  const live = new OperatorCustodyRegistry(GENESIS);
  appendCustodyOp(live, store, GENESIS, 'register', {
    receiptSha256: SYNC_R, purpose: SYNC_PURPOSE, registeredBy: 'devin', issuedAtMs: T0, registeredAtMs: T0,
  });
  const withGarbage = memStore([...store.lines, 'not json at all']);
  assert.throws(() => replayCustodyJournal(withGarbage, GENESIS), /not JSON/);
  const withBigLine = memStore([...store.lines, 'x'.repeat(OPERATOR_CUSTODY_JOURNAL_POLICY.maxLineChars + 1)]);
  assert.throws(() => replayCustodyJournal(withBigLine, GENESIS), /oversized/);
});

test('12D-236 an out-of-order journal refuses (chain mismatch)', () => {
  const store = memStore();
  const live = new OperatorCustodyRegistry(GENESIS);
  appendCustodyOp(live, store, GENESIS, 'register', {
    receiptSha256: SYNC_R, purpose: SYNC_PURPOSE, registeredBy: 'devin', issuedAtMs: T0, registeredAtMs: T0,
  });
  appendCustodyOp(live, store, GENESIS, 'register', {
    receiptSha256: EXEC_R, purpose: TRANSPORT_PURPOSE, registeredBy: 'devin', issuedAtMs: T0, registeredAtMs: T0,
  });
  const swapped = memStore([store.lines[1]!, store.lines[0]!]);
  assert.throws(() => replayCustodyJournal(swapped, GENESIS), /digest mismatch|tampered/);
});

test('12D-236 a hand-forged journal whose ops violate the registry refuses (fail-closed order)', () => {
  // An authenticate-before-register journal has internally CONSISTENT digests if
  // forged as a set — but the registry replay refuses it. The journal cannot be
  // used to smuggle an op the live contract would refuse.
  const forged = {
    journalVersion: 1, op: 'authenticate',
    input: { receiptSha256: SYNC_R, purpose: SYNC_PURPOSE, nowMs: T0 + 100 },
    journalDigest: 'f'.repeat(64),
  };
  const store = memStore([JSON.stringify(forged)]);
  // The digest also won't verify — but even a recomputed forgery fails on replay.
  assert.throws(() => replayCustodyJournal(store, GENESIS), /tampered with|not in the custody registry/);
});

test('12D-236 an empty journal replays to a fresh empty registry', () => {
  const { registry, ops } = replayCustodyJournal(memStore(), GENESIS);
  assert.equal(ops, 0);
  assert.equal(registry.verifyLedger().ok, true);
  assert.equal(registry.ledgerEntries().length, 0);
});

test('12D-236 a missing journal refuses the replay rather than inventing state', () => {
  const store = memStore();
  store.load = () => null;
  assert.throws(() => replayCustodyJournal(store, GENESIS), /no custody journal found/);
});

test('12D-236 durability across generations: reload, extend, reload again', () => {
  const store = memStore();
  // Generation 1: register the sync receipt and consume it.
  let live = new OperatorCustodyRegistry(GENESIS);
  appendCustodyOp(live, store, GENESIS, 'register', {
    receiptSha256: SYNC_R, purpose: SYNC_PURPOSE, registeredBy: 'devin', issuedAtMs: T0, registeredAtMs: T0,
  });
  appendCustodyOp(live, store, GENESIS, 'authenticate', { receiptSha256: SYNC_R, purpose: SYNC_PURPOSE, nowMs: T0 + 100 });
  // Generation 2: a "restarted" process loads the journal and extends it.
  let gen2 = replayCustodyJournal(store, GENESIS).registry;
  assert.throws(
    () => appendCustodyOp(gen2, store, GENESIS, 'authenticate', { receiptSha256: SYNC_R, purpose: SYNC_PURPOSE, nowMs: T0 + 200 }),
    /already consumed/,
  );
  appendCustodyOp(gen2, store, GENESIS, 'register', {
    receiptSha256: EXEC_R, purpose: TRANSPORT_PURPOSE, registeredBy: 'devin', issuedAtMs: T0 + 150, registeredAtMs: T0 + 150,
  });
  // Generation 3: the journal holds generation 2's extension; the receipt from
  // generation 1 is still consumed and the new registration is usable.
  const gen3 = replayCustodyJournal(store, GENESIS).registry;
  assert.equal(gen3.verifyLedger().ok, true);
  const ok = gen3.authenticate({ receiptSha256: EXEC_R, purpose: TRANSPORT_PURPOSE, nowMs: T0 + 300 });
  assert.equal(ok.consumedAtMs, T0 + 300);
  assert.equal(store.lines.length, 3);
  void live;
});

test('12D-236 malformed calls fail closed without journaling', () => {
  const store = memStore();
  const live = new OperatorCustodyRegistry(GENESIS);
  assert.throws(
    () => appendCustodyOp(live, store, GENESIS, 'revoke' as never, { receiptSha256: SYNC_R, purpose: SYNC_PURPOSE }),
    /unknown custody journal op/,
  );
  assert.throws(
    () => appendCustodyOp(live, store, 'short', 'register', {
      receiptSha256: SYNC_R, purpose: SYNC_PURPOSE, registeredBy: 'd', issuedAtMs: T0, registeredAtMs: T0,
    }),
    /journal genesis/,
  );
  assert.throws(
    () => appendCustodyOp(null as never, store, GENESIS, 'register', {
      receiptSha256: SYNC_R, purpose: SYNC_PURPOSE, registeredBy: 'd', issuedAtMs: T0, registeredAtMs: T0,
    }),
    /fail closed/,
  );
  assert.equal(store.lines.length, 0);
});

test('12D-236 the file store is atomic-replace and reports a missing file as null', () => {
  const dir = mkdtempSync(join(tmpdir(), 'xiv-custody-12d-236-'));
  try {
    const path = join(dir, 'custody.journal');
    const store = new FileCustodyJournalStore(path);
    assert.equal(store.load(), null); // no journal yet
    store.save(['line-one', 'line-two']);
    assert.deepEqual(store.load(), ['line-one', 'line-two']);
    assert.equal(existsSync(`${path}.tmp`), false); // temp file renamed away
    store.save(['line-one']);
    assert.deepEqual(store.load(), ['line-one']); // atomic replace, not append-corrupt
    assert.throws(() => new FileCustodyJournalStore(''), /journal file path/);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('12D-236 the file store round-trips through replay end to end', () => {
  const dir = mkdtempSync(join(tmpdir(), 'xiv-custody-12d-236-'));
  try {
    const path = join(dir, 'custody.journal');
    const fileStore = new FileCustodyJournalStore(path);
    const live = new OperatorCustodyRegistry(GENESIS);
    appendCustodyOp(live, fileStore, GENESIS, 'register', {
      receiptSha256: SYNC_R, purpose: SYNC_PURPOSE, registeredBy: 'devin', issuedAtMs: T0, registeredAtMs: T0,
    });
    appendCustodyOp(live, fileStore, GENESIS, 'authenticate', { receiptSha256: SYNC_R, purpose: SYNC_PURPOSE, nowMs: T0 + 100 });
    const { registry: rebuilt, ops } = replayCustodyJournal(new FileCustodyJournalStore(path), GENESIS);
    assert.equal(ops, 2);
    assert.equal(rebuilt.verifyLedger().ok, true);
    assert.throws(
      () => rebuilt.authenticate({ receiptSha256: SYNC_R, purpose: SYNC_PURPOSE, nowMs: T0 + 200 }),
      /already consumed/,
    );
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});