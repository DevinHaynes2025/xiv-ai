// 12D-244 tests — adversarial coverage for the custody operator runner.
// Under test: two-phase plan gating (a malformed plan refuses BEFORE ANY
// apply — the journal stays untouched), stop-on-first-refusal mid-plan
// (cross-purpose / single-use / chronology), applied ops STAY applied (no
// rollback claim), the frozen deterministic evidence packet (runId bound to
// plan + applied digests; the seed never serializes), evidence verification
// with guardrails compared BY VALUE (JSON round-trip still verifies), the
// bootstrap→resume handoff, and the honest flags. Nothing calls a network
// or a model.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'crypto';
import {
  CUSTODY_RUNNER_POLICY,
  CUSTODY_RUNNER_GUARDRAILS,
  runCustodyPlan,
  verifyCustodyRunEvidence,
  type CustodyRunnerStep,
  type CustodyRunEvidence,
} from './custody-runner';
import type { CustodyJournalStore } from './operator-custody-journal';

const SEED = 'operator-custody-seed-1';
const T0 = 1_000_000;
const PURPOSE = 'operator-release-approval';
const BY = 'CEO-DEVIN-HAYNES';

const hex = (text: string): string =>
  createHash('sha256').update(text, 'utf8').digest('hex');
const RECEIPT_A = hex('receipt-alpha');
const RECEIPT_B = hex('receipt-beta');

function memStore(): CustodyJournalStore & { isEmpty(): boolean } {
  let lines: string[] | null = null;
  return {
    load: () => (lines === null ? null : [...lines]),
    save: (next) => { lines = [...next]; },
    isEmpty: () => lines === null,
  };
}

const reg = (receiptSha256: string, purpose: string, over: { issuedAtMs?: number; atMs?: number } = {}): CustodyRunnerStep =>
  Object.freeze({
    op: 'register' as const,
    receiptSha256,
    purpose,
    registeredBy: BY,
    issuedAtMs: over.issuedAtMs ?? T0,
    atMs: over.atMs ?? T0 + 10,
  });

const auth = (receiptSha256: string, purpose: string, atMs = T0 + 20): CustodyRunnerStep =>
  Object.freeze({ op: 'authenticate' as const, receiptSha256, purpose, atMs });

test('12D-244 policy and guardrails are frozen with the pinned honest flags', () => {
  assert.ok(Object.isFrozen(CUSTODY_RUNNER_POLICY));
  assert.ok(Object.isFrozen(CUSTODY_RUNNER_GUARDRAILS));
  assert.equal(CUSTODY_RUNNER_GUARDRAILS.humanDecision, 'REQUIRED');
  assert.equal(CUSTODY_RUNNER_GUARDRAILS.learningPromoted, false);
  assert.equal(CUSTODY_RUNNER_GUARDRAILS.zeroRemoteCalls, true);
  assert.equal(CUSTODY_RUNNER_GUARDRAILS.zeroModelCalls, true);
  assert.equal(CUSTODY_RUNNER_GUARDRAILS.billionUsersProven, false);
  assert.equal(CUSTODY_RUNNER_GUARDRAILS.automaticRecovery, false);
  assert.equal(CUSTODY_RUNNER_GUARDRAILS.appliedOpsStayApplied, true);
  assert.equal(CUSTODY_RUNNER_GUARDRAILS.seedNeverSerializesIntoEvidence, true);
});

test('12D-244 happy path: register then authenticate runs clean and stamps evidence', () => {
  const store = memStore();
  const steps: CustodyRunnerStep[] = [reg(RECEIPT_A, PURPOSE), auth(RECEIPT_A, PURPOSE)];
  const evidence = runCustodyPlan({ store, seed: SEED, mode: 'bootstrap', steps });
  assert.equal(evidence.schemaVersion, 1);
  assert.equal(evidence.policyVersion, '12d-244-v1');
  assert.equal(evidence.mode, 'bootstrap');
  assert.equal(evidence.applied.length, 2);
  assert.equal(evidence.opsBefore, 0);
  assert.equal(evidence.opsAfter, 2);
  assert.deepEqual(evidence.pending, []);
  assert.equal('refused' in evidence, false);
  assert.equal(evidence.journalVerified, true);
  assert.equal(evidence.guardrails, CUSTODY_RUNNER_GUARDRAILS);
  assert.match(evidence.runId, /^[0-9a-f]{64}$/);
  // The authenticate step consumed the receipt — proof lands in evidence.
  const consumed = evidence.applied[1].consumed;
  assert.ok(consumed);
  assert.equal(consumed!.receiptSha256, RECEIPT_A);
  assert.equal(consumed!.purpose, PURPOSE);
  assert.equal(consumed!.consumedAtMs, T0 + 20);
  // Applied journal digests are hex64 and distinct.
  assert.match(evidence.applied[0].journalDigest, /^[0-9a-f]{64}$/);
  assert.notEqual(evidence.applied[0].journalDigest, evidence.applied[1].journalDigest);
});

test('12D-244 runId is deterministic: same plan + same fresh history, same runId', () => {
  const steps: CustodyRunnerStep[] = [reg(RECEIPT_A, PURPOSE), auth(RECEIPT_A, PURPOSE)];
  const a = runCustodyPlan({ store: memStore(), seed: SEED, mode: 'bootstrap', steps });
  const b = runCustodyPlan({ store: memStore(), seed: SEED, mode: 'bootstrap', steps });
  assert.equal(a.runId, b.runId);
  // A different seed produces a different journal chain — a different runId.
  const c = runCustodyPlan({ store: memStore(), seed: 'operator-custody-seed-2', mode: 'bootstrap', steps });
  assert.notEqual(c.runId, a.runId);
});

test('12D-244 evidence verifies against its plan, including after a JSON round-trip', () => {
  const store = memStore();
  const steps: CustodyRunnerStep[] = [reg(RECEIPT_A, PURPOSE), auth(RECEIPT_A, PURPOSE)];
  const evidence = runCustodyPlan({ store, seed: SEED, mode: 'bootstrap', steps });
  const direct = verifyCustodyRunEvidence(evidence, steps, 'bootstrap');
  assert.equal(direct.ok, true);
  assert.equal(direct.runId, evidence.runId);
  // Guardrails are compared BY VALUE — the evidence still verifies after
  // crossing a JSON wire (the 12D-241 reference-equality lesson, applied
  // at design time rather than re-caught by this suite).
  const transported = JSON.parse(JSON.stringify(evidence)) as CustodyRunEvidence;
  const again = verifyCustodyRunEvidence(transported, steps, 'bootstrap');
  assert.equal(again.runId, evidence.runId);
});

test('12D-244 a malformed plan refuses BEFORE ANY apply — the journal stays untouched', () => {
  const bad: Array<{ label: string; steps: CustodyRunnerStep[] }> = [
    { label: 'extra key', steps: [Object.freeze({ ...reg(RECEIPT_A, PURPOSE), extra: 1 })] },
    { label: 'missing key', steps: [Object.freeze({ op: 'register', receiptSha256: RECEIPT_A, purpose: PURPOSE, registeredBy: BY, issuedAtMs: T0 } as unknown as CustodyRunnerStep)] },
    { label: 'unknown op', steps: [Object.freeze({ op: 'revoke', receiptSha256: RECEIPT_A, purpose: PURPOSE, atMs: T0 } as unknown as CustodyRunnerStep)] },
    { label: 'uppercase receipt', steps: [reg(RECEIPT_A.toUpperCase(), PURPOSE)] },
    { label: 'short receipt', steps: [reg('abc123', PURPOSE)] },
    { label: 'empty purpose', steps: [reg(RECEIPT_A, '')] },
    { label: 'non-integer atMs', steps: [reg(RECEIPT_A, PURPOSE, { atMs: 1.5 })] },
    { label: 'negative issuedAtMs', steps: [reg(RECEIPT_A, PURPOSE, { issuedAtMs: -1 })] },
    { label: 'empty registeredBy', steps: [Object.freeze({ ...reg(RECEIPT_A, PURPOSE), registeredBy: '' })] },
  ];
  for (const { label, steps } of bad) {
    const store = memStore();
    assert.throws(
      () => runCustodyPlan({ store, seed: SEED, mode: 'bootstrap', steps }),
      /fail closed/,
      `expected a malformed plan (${label}) to refuse`,
    );
    assert.equal(store.isEmpty(), true, `the journal must stay untouched (${label})`);
  }
  // Options-object shape is gated too.
  const store = memStore();
  assert.throws(
    () => runCustodyPlan({ store, seed: SEED, mode: 'bootstrap', steps: [reg(RECEIPT_A, PURPOSE)], extra: 1 } as unknown as Parameters<typeof runCustodyPlan>[0]),
    /fail closed/,
  );
  assert.equal(store.isEmpty(), true);
});

test('12D-244 an empty plan refuses and a plan over the cap refuses', () => {
  const emptyStore = memStore();
  assert.throws(
    () => runCustodyPlan({ store: emptyStore, seed: SEED, mode: 'bootstrap', steps: [] }),
    /empty custody plan is refused/,
  );
  assert.equal(emptyStore.isEmpty(), true);
  const tooMany: CustodyRunnerStep[] = Array.from({ length: (CUSTODY_RUNNER_POLICY.maxPlanSteps ?? 64) + 1 }, (_, i) =>
    reg(hex(`receipt-${i}`), PURPOSE),
  );
  const cappedStore = memStore();
  assert.throws(
    () => runCustodyPlan({ store: cappedStore, seed: SEED, mode: 'bootstrap', steps: tooMany }),
    /capped at 64 steps/,
  );
  assert.equal(cappedStore.isEmpty(), true);
});

test('12D-244 stop-on-first-refusal: a cross-purpose authenticate stops the run mid-plan', () => {
  const store = memStore();
  const steps: CustodyRunnerStep[] = [
    reg(RECEIPT_A, PURPOSE),
    auth(RECEIPT_A, 'a-different-purpose'), // cross-purpose: refused
    auth(RECEIPT_A, PURPOSE), // never reached
  ];
  const evidence = runCustodyPlan({ store, seed: SEED, mode: 'bootstrap', steps });
  assert.ok(evidence.refused);
  assert.equal(evidence.refused!.index, 1);
  assert.equal(evidence.refused!.op, 'authenticate');
  assert.match(evidence.refused!.reason, /fail closed/);
  assert.equal(evidence.applied.length, 1);
  assert.equal(evidence.applied[0].op, 'register');
  assert.deepEqual(evidence.pending, [2]);
  assert.equal(evidence.opsAfter, 1);
});

test('12D-244 stop-on-first-refusal: a receipt authenticates exactly once', () => {
  const store = memStore();
  const steps: CustodyRunnerStep[] = [
    reg(RECEIPT_A, PURPOSE),
    auth(RECEIPT_A, PURPOSE),
    auth(RECEIPT_A, PURPOSE), // single-use: refused
    auth(RECEIPT_A, PURPOSE), // never reached
  ];
  const evidence = runCustodyPlan({ store, seed: SEED, mode: 'bootstrap', steps });
  assert.ok(evidence.refused);
  assert.equal(evidence.refused!.index, 2);
  assert.equal(evidence.applied.length, 2);
  assert.deepEqual(evidence.pending, [3]);
});

test('12D-244 stop-on-first-refusal: authenticating before issuance refuses', () => {
  const store = memStore();
  const steps: CustodyRunnerStep[] = [
    reg(RECEIPT_A, PURPOSE, { issuedAtMs: T0 + 100, atMs: T0 + 110 }),
    auth(RECEIPT_A, PURPOSE, T0 + 50), // nowMs < issuedAtMs: refused
  ];
  const evidence = runCustodyPlan({ store, seed: SEED, mode: 'bootstrap', steps });
  assert.ok(evidence.refused);
  assert.equal(evidence.refused!.index, 1);
  assert.equal(evidence.applied.length, 1);
  assert.deepEqual(evidence.pending, []);
});

test('12D-244 applied ops stay applied after a stopped run (no rollback is claimed)', () => {
  const store = memStore();
  runCustodyPlan({
    store,
    seed: SEED,
    mode: 'bootstrap',
    steps: [reg(RECEIPT_A, PURPOSE), auth(RECEIPT_A, 'a-different-purpose')],
  });
  // A resume run over the same journal sees the register op INTACT — the
  // refusal did not undo it, and the journal verifies.
  const steps: CustodyRunnerStep[] = [reg(RECEIPT_B, PURPOSE, { issuedAtMs: T0 + 100, atMs: T0 + 110 })];
  const second = runCustodyPlan({ store, seed: SEED, mode: 'resume', steps });
  assert.equal(second.opsBefore, 1);
  assert.equal(second.mode, 'resume');
  assert.equal(second.applied.length, 1);
  assert.equal(second.opsAfter, 2);
});

test('12D-244 the seed never serializes into the evidence packet', () => {
  const store = memStore();
  const evidence = runCustodyPlan({
    store,
    seed: SEED,
    mode: 'bootstrap',
    steps: [reg(RECEIPT_A, PURPOSE), auth(RECEIPT_A, PURPOSE)],
  });
  const serialized = JSON.stringify(evidence);
  assert.equal(serialized.includes(SEED), false);
  // No top-level seed key (the substring 'seed' legitimately appears in the
  // guardrail name seedNeverSerializesIntoEvidence — the assertion is on the
  // key and the value, not the substring).
  assert.equal('seed' in evidence, false);
  assert.ok(!serialized.match(/"seed"\s*:/));
});

test('12D-244 tampered evidence refuses verification', () => {
  const store = memStore();
  const steps: CustodyRunnerStep[] = [reg(RECEIPT_A, PURPOSE), auth(RECEIPT_A, PURPOSE)];
  const evidence = runCustodyPlan({ store, seed: SEED, mode: 'bootstrap', steps });

  const flip = (hexStr: string): string =>
    (hexStr[0] === '0' ? '1' : '0') + hexStr.slice(1);

  // Tampered runId.
  const tamperedId = { ...evidence, runId: flip(evidence.runId) } as CustodyRunEvidence;
  assert.throws(
    () => verifyCustodyRunEvidence(tamperedId, steps, 'bootstrap'),
    /mismatch — tampered or foreign evidence/,
  );
  // A swapped applied journalDigest re-derives a different runId.
  const tamperedDigest = {
    ...evidence,
    applied: evidence.applied.map((a, i) => (i === 0 ? { ...a, journalDigest: flip(a.journalDigest) } : a)),
  } as CustodyRunEvidence;
  assert.throws(
    () => verifyCustodyRunEvidence(tamperedDigest, steps, 'bootstrap'),
    /fail closed/,
  );
  // Foreign policy version / mode / guardrails each refuse.
  assert.throws(
    () => verifyCustodyRunEvidence({ ...evidence, policyVersion: '12d-243-v1' } as CustodyRunEvidence, steps, 'bootstrap'),
    /policyVersion/,
  );
  assert.throws(
    () => verifyCustodyRunEvidence(evidence, steps, 'resume'),
    /mode must be 'resume'/,
  );
  assert.throws(
    () => verifyCustodyRunEvidence({ ...evidence, guardrails: { ...CUSTODY_RUNNER_GUARDRAILS, stopsOnFirstRefusal: false } } as unknown as CustodyRunEvidence, steps, 'bootstrap'),
    /BY VALUE/,
  );
  // An extra key smuggled into the evidence refuses the exact-keys audit.
  assert.throws(
    () => verifyCustodyRunEvidence({ ...evidence, smuggled: true } as unknown as CustodyRunEvidence, steps, 'bootstrap'),
    /exactly the keys/,
  );
});

test('12D-244 bootstrap refuses over an existing journal (the 12D-237 gate carries through)', () => {
  const store = memStore();
  runCustodyPlan({ store, seed: SEED, mode: 'bootstrap', steps: [reg(RECEIPT_A, PURPOSE)] });
  assert.throws(
    () => runCustodyPlan({ store, seed: SEED, mode: 'bootstrap', steps: [reg(RECEIPT_B, PURPOSE, { issuedAtMs: T0 + 100, atMs: T0 + 110 })] }),
    /re-seeding a live custody chain is refused/,
  );
});

test('12D-244 a weak or malformed seed refuses before anything is applied', () => {
  const store = memStore();
  assert.throws(
    () => runCustodyPlan({ store, seed: 'short', mode: 'bootstrap', steps: [reg(RECEIPT_A, PURPOSE)] }),
    /custody seed must match/,
  );
  assert.throws(
    () => runCustodyPlan({ store, seed: SEED, mode: 'auto' as 'bootstrap', steps: [reg(RECEIPT_A, PURPOSE)] }),
    /must be 'bootstrap' or 'resume'/,
  );
  assert.equal(store.isEmpty(), true);
});