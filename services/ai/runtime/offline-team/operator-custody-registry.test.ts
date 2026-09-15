// 12D-233 tests — adversarial coverage for the Operator Custody Registry.
// Under test: exactly-once registration, single-use consumption, cross-purpose
// and replay refusal, ordering (consumption cannot predate issuance),
// tamper-evident ledger, frozen records, and the disclosed residuals. Nothing
// here calls a network or executes anything.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'crypto';
import {
  OperatorCustodyRegistry,
  OPERATOR_CUSTODY_POLICY,
  OPERATOR_CUSTODY_GUARDRAILS,
} from './operator-custody-registry';

const T0 = 1_000_000_000;
const SYNC_R = 'a'.repeat(64);
const EXEC_R = 'b'.repeat(64);
const SYNC_PURPOSE = 'xiv.sync.propose';
const TRANSPORT_PURPOSE = 'xiv.sync.transport';
const OTHER_PURPOSE = 'xiv.scaling.decision';

const registry = (): OperatorCustodyRegistry => new OperatorCustodyRegistry('custody-seed-123456789');

const registered = (r = registry()): OperatorCustodyRegistry => {
  r.register({
    receiptSha256: SYNC_R, purpose: SYNC_PURPOSE,
    registeredBy: 'devin-xavier-haynes', issuedAtMs: T0, registeredAtMs: T0 + 100,
  });
  return r;
};

test('12D-233 policy and guardrails match the charter and are frozen', () => {
  assert.equal(OPERATOR_CUSTODY_POLICY.policyVersion, '12d-233-v1');
  assert.equal(OPERATOR_CUSTODY_POLICY.receiptHexChars, 64);
  assert.equal(OPERATOR_CUSTODY_GUARDRAILS.receiptsAreRegisteredExactlyOnce, true);
  assert.equal(OPERATOR_CUSTODY_GUARDRAILS.oneConsumptionPerReceipt, true);
  assert.equal(OPERATOR_CUSTODY_GUARDRAILS.crossPurposeReuseRefused, true);
  assert.equal(OPERATOR_CUSTODY_GUARDRAILS.consumptionCannotPredateRegistration, true);
  // The disclosed residuals are stated as true — they are part of the contract.
  assert.equal(OPERATOR_CUSTODY_GUARDRAILS.registrationIsNotIssuanceProof, true);
  assert.equal(OPERATOR_CUSTODY_GUARDRAILS.processLocalNotDurable, true);
  assert.equal(OPERATOR_CUSTODY_GUARDRAILS.zeroRemoteCalls, true);
  assert.equal(OPERATOR_CUSTODY_GUARDRAILS.humanDecision, 'REQUIRED');
  assert.equal(Object.isFrozen(OPERATOR_CUSTODY_POLICY), true);
  assert.equal(Object.isFrozen(OPERATOR_CUSTODY_GUARDRAILS), true);
});

test('12D-233 happy path: register once, verify read-only, authenticate consumes once', () => {
  const r = registered();
  const before = r.verify({ receiptSha256: SYNC_R, purpose: SYNC_PURPOSE });
  assert.deepEqual({ ...before }, { registered: true, consumed: false, purpose: SYNC_PURPOSE });
  const rec = r.recordFor(SYNC_R);
  assert.equal(rec!.purpose, SYNC_PURPOSE);
  assert.equal(rec!.registeredBy, 'devin-xavier-haynes');
  assert.match(rec!.recordDigest, /^[0-9a-f]{64}$/);
  const auth = r.authenticate({ receiptSha256: SYNC_R, purpose: SYNC_PURPOSE, nowMs: T0 + 500 });
  assert.equal(auth.consumedAtMs, T0 + 500);
  assert.equal(Object.isFrozen(auth), true);
  assert.equal(Object.isFrozen(rec!), true);
  // Read-only verify sees consumption; authenticate again refuses.
  const after = r.verify({ receiptSha256: SYNC_R, purpose: SYNC_PURPOSE });
  assert.deepEqual({ ...after }, { registered: true, consumed: true, purpose: SYNC_PURPOSE });
  assert.equal(r.verifyLedger().ok, true);
});

test('12D-233 re-registration for the same purpose is refused', () => {
  const r = registered();
  assert.throws(() => r.register({
    receiptSha256: SYNC_R, purpose: SYNC_PURPOSE,
    registeredBy: 'devin-xavier-haynes', issuedAtMs: T0, registeredAtMs: T0 + 100,
  }), /registered exactly once/);
});

test('12D-233 cross-purpose re-registration is refused', () => {
  const r = registered();
  assert.throws(() => r.register({
    receiptSha256: SYNC_R, purpose: OTHER_PURPOSE,
    registeredBy: 'devin-xavier-haynes', issuedAtMs: T0, registeredAtMs: T0 + 100,
  }), /cross-purpose re-registration refused/);
});

test('12D-233 an unregistered receipt cannot authenticate', () => {
  const r = registered();
  assert.throws(
    () => r.authenticate({ receiptSha256: EXEC_R, purpose: TRANSPORT_PURPOSE, nowMs: T0 + 500 }),
    /not in the custody registry/,
  );
});

test('12D-233 cross-gate reuse is refused: a sync receipt cannot serve the transport gate', () => {
  const r = registered();
  assert.throws(
    () => r.authenticate({ receiptSha256: SYNC_R, purpose: TRANSPORT_PURPOSE, nowMs: T0 + 500 }),
    /registered for purpose xiv.sync.propose.*cross-purpose reuse refused/,
  );
});

test('12D-233 a consumed receipt never authenticates again (single-use replay refusal)', () => {
  const r = registered();
  r.authenticate({ receiptSha256: SYNC_R, purpose: SYNC_PURPOSE, nowMs: T0 + 500 });
  assert.throws(
    () => r.authenticate({ receiptSha256: SYNC_R, purpose: SYNC_PURPOSE, nowMs: T0 + 600 }),
    /already consumed.*single-use refused/,
  );
  // The refusal did not corrupt the ledger.
  assert.equal(r.verifyLedger().ok, true);
});

test('12D-233 consumption cannot predate issuance', () => {
  const r = registered();
  assert.throws(
    () => r.authenticate({ receiptSha256: SYNC_R, purpose: SYNC_PURPOSE, nowMs: T0 - 1 }),
    /before it was issued/,
  );
  // The refused consumption left no event and did not consume the receipt.
  assert.equal(r.verify({ receiptSha256: SYNC_R, purpose: SYNC_PURPOSE }).consumed, false);
});

test('12D-233 a receipt cannot be registered before it was issued', () => {
  const r = registry();
  assert.throws(() => r.register({
    receiptSha256: SYNC_R, purpose: SYNC_PURPOSE,
    registeredBy: 'devin-xavier-haynes', issuedAtMs: T0, registeredAtMs: T0 - 1,
  }), /registered before it was issued/);
});

test('12D-233 the custody ledger is tamper-evident', () => {
  const r = registered();
  r.authenticate({ receiptSha256: SYNC_R, purpose: SYNC_PURPOSE, nowMs: T0 + 500 });
  assert.equal(r.verifyLedger().ok, true);
  (r.ledgerEntries() as unknown as { push: (e: unknown) => void }).push({
    seq: 9999, atMs: T0, receiptSha256: EXEC_R, purpose: SYNC_PURPOSE,
    kind: 'CUSTODY_REGISTERED', detail: 'forged', hash: 'f'.repeat(64),
  });
  assert.equal(r.verifyLedger().ok, false);
});

test('12D-233 records are frozen after creation; mutation attempts throw', () => {
  const r = registered();
  const rec = r.recordFor(SYNC_R)!;
  assert.throws(() => { (rec as { purpose: string }).purpose = 'forged'; }, TypeError);
  const entries = r.ledgerEntries();
  assert.throws(() => { (entries[0] as { detail: string }).detail = 'rewritten'; }, TypeError);
});

test('12D-233 malformed inputs fail closed without partial state', () => {
  const r = registry();
  assert.throws(() => r.register({ receiptSha256: 'nothex', purpose: SYNC_PURPOSE, registeredBy: 'devin', issuedAtMs: T0, registeredAtMs: T0 }), /64-hex/);
  assert.throws(() => r.register({ receiptSha256: SYNC_R, purpose: 'bad purpose!', registeredBy: 'devin', issuedAtMs: T0, registeredAtMs: T0 }), /custody purpose must match/);
  assert.throws(() => r.register({ receiptSha256: SYNC_R, purpose: SYNC_PURPOSE, registeredBy: '', issuedAtMs: T0, registeredAtMs: T0 }), /registrant identity/);
  assert.throws(() => r.register({ receiptSha256: SYNC_R, purpose: SYNC_PURPOSE, registeredBy: 'devin', issuedAtMs: T0, registeredAtMs: T0, note: 'x'.repeat(300) }), /at most 256/);
  assert.throws(() => r.authenticate({ receiptSha256: SYNC_R, purpose: SYNC_PURPOSE, nowMs: T0 + 1 }), /not in the custody registry/);
  assert.throws(() => r.verify({ receiptSha256: SYNC_R, purpose: 'bad purpose!' }), /fail closed/);
  assert.throws(() => r.recordFor('short'), /64-hex/);
  // Nothing leaked into the ledger from refused calls.
  assert.equal(r.ledgerEntries().length, 0);
  assert.equal(r.verifyLedger().ok, true);
});

test('12D-233 two receipts for two purposes both work — the separation holds positively too', () => {
  const r = registry();
  r.register({ receiptSha256: SYNC_R, purpose: SYNC_PURPOSE, registeredBy: 'devin', issuedAtMs: T0, registeredAtMs: T0 });
  r.register({ receiptSha256: EXEC_R, purpose: TRANSPORT_PURPOSE, registeredBy: 'devin', issuedAtMs: T0 + 100, registeredAtMs: T0 + 100 });
  r.authenticate({ receiptSha256: SYNC_R, purpose: SYNC_PURPOSE, nowMs: T0 + 200 });
  r.authenticate({ receiptSha256: EXEC_R, purpose: TRANSPORT_PURPOSE, nowMs: T0 + 300 });
  assert.equal(r.verifyLedger().ok, true);
  assert.equal(r.ledgerEntries().length, 4); // 2 registrations + 2 consumptions
});