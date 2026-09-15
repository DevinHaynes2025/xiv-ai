// 12D-237 tests — adversarial coverage for the custody session lifecycle.
// Under test: explicit-mode-only opening (no auto), bootstrap-refuses-over-
// existing-journal, resume-refuses-without-journal, wrong-seed refusal,
// restart continuity (consumed receipts stay consumed), verify() tamper
// detection, and fail-closed malformed calls. Nothing calls a network.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  CUSTODY_SESSION_POLICY,
  CUSTODY_SESSION_GUARDRAILS,
  openCustodySession,
  verifyCustodySession,
  type CustodySession,
} from './custody-session';
import { FileCustodyJournalStore, type CustodyJournalStore } from './operator-custody-journal';

const T0 = 1_000_000_000;
const SYNC_R = 'a'.repeat(64);
const EXEC_R = 'b'.repeat(64);
const SYNC_PURPOSE = 'xiv.sync.propose';
const TRANSPORT_PURPOSE = 'xiv.sync.transport';
const SEED = 'custody-session-seed-001';

/** In-memory JSONL store; `null` lines model "no journal exists yet". */
function memStore(lines: readonly string[] | null = null): CustodyJournalStore {
  let current: readonly string[] | null = lines;
  return {
    load() { return current === null ? null : [...current]; },
    save(next: readonly string[]) { current = [...next]; },
  };
}

const reg = (session: CustodySession, receipt: string, purpose: string, atMs: number) =>
  session.apply('register', {
    receiptSha256: receipt, purpose, registeredBy: 'devin', issuedAtMs: atMs, registeredAtMs: atMs,
  });

test('12D-237 policy and guardrails match the charter and are frozen', () => {
  assert.equal(CUSTODY_SESSION_POLICY.policyVersion, '12d-237-v1');
  assert.equal(CUSTODY_SESSION_POLICY.minSeedChars, 8);
  assert.equal(CUSTODY_SESSION_GUARDRAILS.explicitModeOnly, true);
  assert.equal(CUSTODY_SESSION_GUARDRAILS.bootstrapRefusesOverExistingJournal, true);
  assert.equal(CUSTODY_SESSION_GUARDRAILS.resumeRefusesWithoutJournal, true);
  assert.equal(CUSTODY_SESSION_GUARDRAILS.wrongSeedRefuses, true);
  assert.equal(CUSTODY_SESSION_GUARDRAILS.consumedReceiptsStayConsumedAcrossRestarts, true);
  assert.equal(CUSTODY_SESSION_GUARDRAILS.automaticRecovery, false);
  assert.equal(CUSTODY_SESSION_GUARDRAILS.humanDecision, 'REQUIRED');
  assert.equal(CUSTODY_SESSION_GUARDRAILS.zeroRemoteCalls, true);
  assert.equal(Object.isFrozen(CUSTODY_SESSION_POLICY), true);
  assert.equal(Object.isFrozen(CUSTODY_SESSION_GUARDRAILS), true);
});

test('12D-237 bootstrap on an empty store creates a fresh registry and journals ops', () => {
  const store = memStore();
  const session = openCustodySession(store, { seed: SEED, mode: 'bootstrap' });
  assert.equal(session.mode, 'bootstrap');
  assert.equal(session.ops, 0);
  reg(session, SYNC_R, SYNC_PURPOSE, T0);
  session.apply('authenticate', { receiptSha256: SYNC_R, purpose: SYNC_PURPOSE, nowMs: T0 + 100 });
  assert.equal(session.ops, 2);
  assert.equal(session.registry.verifyLedger().ok, true);
  assert.equal(store.load()!.length, 2);
});

test('12D-237 bootstrap over an existing journal refuses (re-seeding a live chain is never an accident)', () => {
  const store = memStore();
  const session = openCustodySession(store, { seed: SEED, mode: 'bootstrap' });
  reg(session, SYNC_R, SYNC_PURPOSE, T0);
  assert.throws(
    () => openCustodySession(store, { seed: SEED, mode: 'bootstrap' }),
    /re-seeding a live custody chain is refused/,
  );
});

test('12D-237 resume without a journal and without bootstrap refuses (no silent fresh start)', () => {
  const store = memStore();
  assert.throws(
    () => openCustodySession(store, { seed: SEED, mode: 'resume' }),
    /no custody journal found to resume/,
  );
});

test('12D-237 resume with a wrong seed refuses (chain mismatch)', () => {
  const store = memStore();
  const session = openCustodySession(store, { seed: SEED, mode: 'bootstrap' });
  reg(session, SYNC_R, SYNC_PURPOSE, T0);
  assert.throws(
    () => openCustodySession(store, { seed: 'different-seed-999', mode: 'resume' }),
    /digest mismatch|tampered/,
  );
});

test('12D-237 restart continuity: consumed receipts stay consumed, unconsumed still authenticate', () => {
  const store = memStore();
  const gen1 = openCustodySession(store, { seed: SEED, mode: 'bootstrap' });
  reg(gen1, SYNC_R, SYNC_PURPOSE, T0);
  reg(gen1, EXEC_R, TRANSPORT_PURPOSE, T0);
  gen1.apply('authenticate', { receiptSha256: SYNC_R, purpose: SYNC_PURPOSE, nowMs: T0 + 100 });

  const gen2 = openCustodySession(store, { seed: SEED, mode: 'resume' });
  assert.equal(gen2.mode, 'resume');
  assert.equal(gen2.ops, 3); // replayed ops count
  assert.throws(
    () => gen2.apply('authenticate', { receiptSha256: SYNC_R, purpose: SYNC_PURPOSE, nowMs: T0 + 200 }),
    /already consumed/,
  );
  const ok = gen2.apply('authenticate', { receiptSha256: EXEC_R, purpose: TRANSPORT_PURPOSE, nowMs: T0 + 200 });
  assert.equal(ok.consumed?.consumedAtMs, T0 + 200);
  assert.equal(ok.consumed?.receiptSha256, EXEC_R);
  assert.equal(gen2.ops, 4);

  // A third generation sees everything.
  const gen3 = openCustodySession(store, { seed: SEED, mode: 'resume' });
  assert.equal(gen3.ops, 4);
  assert.equal(gen3.registry.verifyLedger().ok, true);
});

test('12D-237 refused ops journal nothing and do not advance the session op count', () => {
  const store = memStore();
  const session = openCustodySession(store, { seed: SEED, mode: 'bootstrap' });
  reg(session, SYNC_R, SYNC_PURPOSE, T0);
  assert.throws(
    () => reg(session, SYNC_R, TRANSPORT_PURPOSE, T0),
    /cross-purpose re-registration refused/,
  );
  assert.equal(session.ops, 1);
  assert.equal(store.load()!.length, 1);
});

test('12D-237 verifyCustodySession passes on a healthy session and refuses a tampered journal', () => {
  const store = memStore();
  const session = openCustodySession(store, { seed: SEED, mode: 'bootstrap' });
  reg(session, SYNC_R, SYNC_PURPOSE, T0);
  const healthy = verifyCustodySession(session, store, SEED);
  assert.equal(healthy.ok, true);
  assert.equal(healthy.ops, 1);

  // Tamper with the journal behind the session's back.
  const tamperedLines = store.load()!.map((l) => l.replace(SYNC_PURPOSE, TRANSPORT_PURPOSE));
  const tamperedStore = memStore(tamperedLines);
  assert.throws(() => verifyCustodySession(session, tamperedStore, SEED), /tampered with/);

  // Wrong seed at verify refuses too.
  assert.throws(() => verifyCustodySession(session, store, 'different-seed-999'), /digest mismatch|tampered/);
});

test('12D-237 verifyCustodySession refuses when the session and journal disagree on op count', () => {
  const store = memStore();
  const session = openCustodySession(store, { seed: SEED, mode: 'bootstrap' });
  reg(session, SYNC_R, SYNC_PURPOSE, T0);
  // A journal written by an older session generation (fewer ops) behind this
  // session's back — the live registry has MORE ops than the journal records.
  const staleStore = memStore([]);
  assert.throws(
    () => verifyCustodySession(session, staleStore, SEED),
    /no custody journal found|disagree on op count/,
  );
});

test('12D-237 malformed calls fail closed', () => {
  assert.throws(() => openCustodySession(null as never, { seed: SEED, mode: 'bootstrap' }), /journal store is required/);
  assert.throws(() => openCustodySession(memStore(), { seed: 'short', mode: 'bootstrap' }), /custody seed/);
  assert.throws(() => openCustodySession(memStore(), { seed: SEED, mode: 'auto' as never }), /bootstrap.*resume/);
});

test('12D-237 the session hands a replayed registry straight to the bridge contract', () => {
  // The registry a resumed session exposes enforces the SAME single-use
  // contract the execution bridges (12D-234/235) rely on — no re-registration
  // of a consumed receipt, and a registered-but-unconsumed receipt
  // authenticates with its original record intact.
  const store = memStore();
  const gen1 = openCustodySession(store, { seed: SEED, mode: 'bootstrap' });
  reg(gen1, SYNC_R, SYNC_PURPOSE, T0);
  gen1.apply('authenticate', { receiptSha256: SYNC_R, purpose: SYNC_PURPOSE, nowMs: T0 + 100 });
  const gen2 = openCustodySession(store, { seed: SEED, mode: 'resume' });
  assert.equal(gen2.registry.verify({ receiptSha256: SYNC_R, purpose: SYNC_PURPOSE }).registered, true);
  assert.throws(
    () => gen2.registry.authenticate({ receiptSha256: SYNC_R, purpose: SYNC_PURPOSE, nowMs: T0 + 300 }),
    /already consumed/,
  );
});

test('12D-237 the file store drives a full bootstrap → restart → resume cycle', () => {
  const dir = mkdtempSync(join(tmpdir(), 'xiv-custody-12d-237-'));
  try {
    const store = new FileCustodyJournalStore(join(dir, 'custody.journal'));
    const gen1 = openCustodySession(store, { seed: SEED, mode: 'bootstrap' });
    reg(gen1, SYNC_R, SYNC_PURPOSE, T0);
    reg(gen1, EXEC_R, TRANSPORT_PURPOSE, T0 + 10);
    gen1.apply('authenticate', { receiptSha256: SYNC_R, purpose: SYNC_PURPOSE, nowMs: T0 + 100 });
    assert.equal(verifyCustodySession(gen1, store, SEED).ok, true);

    const gen2 = openCustodySession(new FileCustodyJournalStore(join(dir, 'custody.journal')), { seed: SEED, mode: 'resume' });
    assert.equal(gen2.ops, 3);
    assert.throws(
      () => gen2.registry.authenticate({ receiptSha256: SYNC_R, purpose: SYNC_PURPOSE, nowMs: T0 + 400 }),
      /already consumed/,
    );
    const ok = gen2.registry.authenticate({ receiptSha256: EXEC_R, purpose: TRANSPORT_PURPOSE, nowMs: T0 + 400 });
    assert.equal(ok.consumedAtMs, T0 + 400);
    assert.equal(verifyCustodySession(gen2, store, SEED).ops, 3);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});