// 12D-272 — adversarial tests for the custody journal census view. Central
// properties under attack:
//   1. The FULL 12D-236 replay (journal hash chain + 12D-233 registry gates
//      + ledger-match) runs before any count renders — one edited,
//      inserted, or deleted line refuses the WHOLE submission with ZERO
//      journal content.
//   2. MEASURED COUNTS ONLY: the render reports counts, never a receipt
//      digest, a registrant identity, or a purpose name.
//   3. NO WRITE PATH: the view's store refuses save — a census never
//      appends.

import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { OperatorCustodyRegistry } from './operator-custody-registry';
import { appendCustodyOp, type CustodyJournalStore } from './operator-custody-journal';
import {
  CUSTODY_JOURNAL_CENSUS_VIEW_GUARDRAILS,
  CUSTODY_JOURNAL_CENSUS_VIEW_POLICY,
  buildCustodyJournalCensusViewModel,
} from './xiv-custody-journal-census-view';

const GENESIS = '12d-272-census-genesis';
const RECEIPT_A = 'a'.repeat(64);
const RECEIPT_B = 'b'.repeat(64);
const RECEIPT_C = 'c'.repeat(64);
const OPERATOR = 'operator:devin';
const PURPOSE_1 = 'xiv-os-approval';
const PURPOSE_2 = 'xiv-os-escrow';
const T0 = 1_000_000;

class MemoryJournalStore implements CustodyJournalStore {
  private lines: string[] | null = null;
  load(): readonly string[] | null { return this.lines; }
  save(lines: readonly string[]): void { this.lines = [...lines]; }
  get written(): readonly string[] { return this.lines ?? []; }
}

function journalWith(): { store: MemoryJournalStore; registry: OperatorCustodyRegistry } {
  const store = new MemoryJournalStore();
  const registry = new OperatorCustodyRegistry(GENESIS);
  appendCustodyOp(registry, store, GENESIS, 'register', {
    receiptSha256: RECEIPT_A, purpose: PURPOSE_1, registeredBy: OPERATOR, issuedAtMs: T0, registeredAtMs: T0,
  });
  appendCustodyOp(registry, store, GENESIS, 'register', {
    receiptSha256: RECEIPT_B, purpose: PURPOSE_1, registeredBy: OPERATOR, issuedAtMs: T0, registeredAtMs: T0,
  });
  appendCustodyOp(registry, store, GENESIS, 'authenticate', {
    receiptSha256: RECEIPT_A, purpose: PURPOSE_1, nowMs: T0 + 10,
  });
  appendCustodyOp(registry, store, GENESIS, 'register', {
    receiptSha256: RECEIPT_C, purpose: PURPOSE_2, registeredBy: OPERATOR, issuedAtMs: T0, registeredAtMs: T0,
  });
  return { store, registry };
}

function submission(store: MemoryJournalStore, genesis: string = GENESIS) {
  return { journalGenesis: genesis, lines: [...store.written] };
}

const REFUSAL_LEAK_CHECK = (
  vm: { display: { headline: string; bodyText: string; operatorNote: string }; reason: string },
  ...secrets: string[]
) => {
  for (const secret of secrets) {
    assert.ok(!vm.display.headline.includes(secret), `headline leaked ${secret.slice(0, 30)}`);
    assert.ok(!vm.display.bodyText.includes(secret), `body leaked ${secret.slice(0, 30)}`);
    assert.ok(!vm.display.operatorNote.includes(secret), `operatorNote leaked ${secret.slice(0, 30)}`);
    assert.ok(!vm.reason.includes(secret), `reason leaked ${secret.slice(0, 30)}`);
  }
};

test('12d-272: a clean journal renders the measured census', () => {
  const { store } = journalWith();
  const vm = buildCustodyJournalCensusViewModel(submission(store));
  assert.ok(vm.kind === 'VERIFIED_CUSTODY_JOURNAL_CENSUS');
  assert.equal(vm.policyVersion, CUSTODY_JOURNAL_CENSUS_VIEW_POLICY.policyVersion);
  assert.equal(vm.display.ops, 4);
  assert.equal(vm.display.registered, 3);
  assert.equal(vm.display.consumed, 1);
  assert.equal(vm.display.distinctPurposes, 2);
  assert.ok(vm.display.status.includes('MEASURED counts only'));
  assert.ok(vm.display.operatorNote.includes('REGISTRATION IS NOT ISSUANCE PROOF'));
  assert.ok(vm.display.operatorNote.includes('12D-233 residual'));
  assert.ok(vm.display.operatorNote.includes('can never append'));
  assert.ok(Object.isFrozen(vm) && Object.isFrozen(vm.display));
});

test('12d-272: an empty journal renders the measured 0 and claims nothing', () => {
  const store = new MemoryJournalStore();
  const vm = buildCustodyJournalCensusViewModel(submission(store));
  assert.ok(vm.kind === 'VERIFIED_CUSTODY_JOURNAL_CENSUS');
  assert.equal(vm.display.ops, 0);
  assert.equal(vm.display.registered, 0);
  assert.equal(vm.display.consumed, 0);
  assert.equal(vm.display.distinctPurposes, 0);
  const rendered = JSON.stringify(vm);
  assert.ok(!rendered.includes('trillion'), 'no scale claims');
  assert.ok(!rendered.includes('authorized'), 'no authorization claims');
});

test('12d-272: the verified census carries NO receipt, identity, or purpose material', () => {
  const { store } = journalWith();
  const vm = buildCustodyJournalCensusViewModel(submission(store));
  assert.ok(vm.kind === 'VERIFIED_CUSTODY_JOURNAL_CENSUS');
  const rendered = JSON.stringify(vm);
  assert.ok(!rendered.includes(RECEIPT_A.slice(0, 16)), 'no receipt digests in a census render');
  assert.ok(!rendered.includes(OPERATOR), 'no registrant identities in a census render');
  assert.ok(!rendered.includes(PURPOSE_1), 'no purpose names in a census render');
  assert.ok(!rendered.includes(PURPOSE_2), 'no purpose names in a census render');
});

test('12d-272: TAMPER — one edited field refuses the whole submission with zero leak', () => {
  const { store } = journalWith();
  const tampered = JSON.parse(store.written[0]!) as Record<string, unknown>;
  const input = tampered.input as Record<string, unknown>;
  input.purpose = PURPOSE_2;
  const vm = buildCustodyJournalCensusViewModel({ journalGenesis: GENESIS, lines: [JSON.stringify(tampered), ...store.written.slice(1)] });
  assert.ok(vm.kind === 'REFUSED');
  assert.ok(vm.kind === 'REFUSED');
  assert.ok(vm.reason.includes('tampered') || vm.reason.includes('mismatch') || vm.reason.includes('refuses'));
  REFUSAL_LEAK_CHECK(vm, RECEIPT_A.slice(0, 24), OPERATOR, PURPOSE_2, GENESIS);
});

test('12d-272: TAMPER — an inserted foreign line refuses', () => {
  const { store } = journalWith();
  const forged = {
    journalVersion: 1, op: 'register',
    input: { receiptSha256: 'd'.repeat(64), purpose: PURPOSE_1, registeredBy: OPERATOR, issuedAtMs: T0, registeredAtMs: T0 },
    journalDigest: 'e'.repeat(64),
  };
  const lines = [store.written[0]!, JSON.stringify(forged), ...store.written.slice(1)];
  const vm = buildCustodyJournalCensusViewModel({ journalGenesis: GENESIS, lines });
  assert.equal(vm.kind, 'REFUSED');
  REFUSAL_LEAK_CHECK(vm, 'd'.repeat(24), RECEIPT_A.slice(0, 24), GENESIS);
});

test('12d-272: TAMPER — a MIDDLE line deleted refuses (the chain breaks)', () => {
  const { store } = journalWith();
  // Drop line index 1 but keep line 2: line 2 chains from line 1's digest,
  // so replaying it after line 0 refuses.
  const vm = buildCustodyJournalCensusViewModel({
    journalGenesis: GENESIS,
    lines: [store.written[0]!, store.written[2]!, store.written[3]!],
  });
  assert.equal(vm.kind, 'REFUSED');
  REFUSAL_LEAK_CHECK(vm, RECEIPT_A.slice(0, 24), GENESIS);
});

test('12d-272: DISCLOSED RESIDUAL — a TAIL truncation replays as a shorter lawful journal', () => {
  const { store } = journalWith();
  // A lawful PREFIX of a hash chain is indistinguishable from a shorter
  // lawful journal — the census renders the measured count of what was
  // SUBMITTED and DISCLOSES that tail truncation needs the out-of-band
  // head-digest comparison. The residual is pinned in the render itself.
  const vm = buildCustodyJournalCensusViewModel({ journalGenesis: GENESIS, lines: store.written.slice(0, 2) });
  assert.ok(vm.kind === 'VERIFIED_CUSTODY_JOURNAL_CENSUS');
  assert.equal(vm.display.ops, 2, 'the measured count of the SUBMITTED lines, honestly');
  assert.ok(vm.display.status.includes('TAIL TRUNCATION'), 'the residual is pinned in the render');
  assert.ok(vm.display.operatorNote.includes('compare the head digest out of band'));
});

test('12d-272: a lawful journal that the REGISTRY gates refuse cannot render as a census', () => {
  const { store } = journalWith();
  // A journal whose ops are internally digest-consistent is impossible to
  // forge cheaply — so the adversarial path here is the REAL replay
  // refusing a journal that violates registry semantics. Deleting the
  // register op but keeping its consume already breaks the chain (above);
  // here we prove the reverse order also refuses: an authenticate BEFORE
  // its register (chain-valid is impossible to hand-build, so we prove the
  // registry gate inside the replay refuses a hand-built chain that
  // re-registers the same receipt).
  const reg1: Record<string, unknown> = {
    journalVersion: 1, op: 'register',
    input: { receiptSha256: RECEIPT_A, purpose: PURPOSE_1, registeredBy: OPERATOR, issuedAtMs: T0, registeredAtMs: T0 },
    journalDigest: '',
  };
  const reg2: Record<string, unknown> = {
    journalVersion: 1, op: 'register',
    input: { receiptSha256: RECEIPT_A, purpose: PURPOSE_2, registeredBy: OPERATOR, issuedAtMs: T0, registeredAtMs: T0 },
    journalDigest: '',
  };
  // digest line 1 by hand over the real chain, then chain line 2 to it
  const canon = (input: unknown) => JSON.stringify(input);
  const d1 = createHash('sha256').update([GENESIS, GENESIS, 'register', canon(reg1.input)].join('|')).digest('hex');
  reg1.journalDigest = d1;
  const d2 = createHash('sha256').update([GENESIS, d1, 'register', canon(reg2.input)].join('|')).digest('hex');
  reg2.journalDigest = d2;
  const vm = buildCustodyJournalCensusViewModel({ journalGenesis: GENESIS, lines: [JSON.stringify(reg1), JSON.stringify(reg2)] });
  assert.equal(vm.kind, 'REFUSED');
  assert.ok(vm.reason.includes('exactly once') || vm.reason.includes('cross-purpose'), 'the registry gate inside the replay refused');
  REFUSAL_LEAK_CHECK(vm, RECEIPT_A.slice(0, 24), OPERATOR, GENESIS);
});

test('12d-272: a foreign genesis refuses (a census binds its genesis)', () => {
  const { store } = journalWith();
  const vm = buildCustodyJournalCensusViewModel(submission(store, 'foreign-genesis-xx'));
  assert.equal(vm.kind, 'REFUSED');
  REFUSAL_LEAK_CHECK(vm, RECEIPT_A.slice(0, 24), OPERATOR);
});

test('12d-272: the exact-keys gate refuses reordering, extras, and absences', () => {
  const { store } = journalWith();
  const reordered = { lines: [...store.written], journalGenesis: GENESIS } as unknown as Record<string, unknown>;
  assert.equal(buildCustodyJournalCensusViewModel(reordered).kind, 'REFUSED');
  const extra = { journalGenesis: GENESIS, lines: [...store.written], smuggled: true } as unknown as Record<string, unknown>;
  assert.equal(buildCustodyJournalCensusViewModel(extra).kind, 'REFUSED');
  const missing = { journalGenesis: GENESIS } as unknown as Record<string, unknown>;
  assert.equal(buildCustodyJournalCensusViewModel(missing).kind, 'REFUSED');
  const shortGenesis = { journalGenesis: 'short', lines: [] } as unknown as Record<string, unknown>;
  assert.equal(buildCustodyJournalCensusViewModel(shortGenesis).kind, 'REFUSED');
});

test('12d-272: malformed submissions HOLD — null, array, string, number, boolean, undefined', () => {
  for (const raw of [null, [], 'string', 42, true, undefined]) {
    const vm = buildCustodyJournalCensusViewModel(raw);
    assert.equal(vm.kind, 'REFUSED', `${String(raw)} must refuse`);
    assert.ok(vm.kind === 'REFUSED');
    assert.ok(vm.reason.length > 0);
  }
  const { store } = journalWith();
  assert.equal(buildCustodyJournalCensusViewModel({ journalGenesis: GENESIS, lines: [store.written[0], 42] }).kind, 'REFUSED');
  assert.equal(buildCustodyJournalCensusViewModel({ journalGenesis: GENESIS, lines: 'not-an-array' }).kind, 'REFUSED');
});

test('12d-272: the verified census never carries an affordance', () => {
  const { store } = journalWith();
  const vm = buildCustodyJournalCensusViewModel(submission(store));
  assert.ok(vm.kind === 'VERIFIED_CUSTODY_JOURNAL_CENSUS');
  const rendered = JSON.stringify(vm);
  assert.ok(!rendered.includes('approve '), 'no approval verb');
  assert.ok(!rendered.includes('activate '), 'no activation affordance verb');
  assert.ok(!rendered.includes('consume now'), 'no consumption affordance');
  assert.ok(rendered.includes('nothing is activated here'), 'the honest pin renders');
  assert.ok(rendered.includes('can never append'), 'the honest no-write pin renders');
});

test('12d-272: guardrails and policy are pinned and frozen', () => {
  assert.ok(Object.isFrozen(CUSTODY_JOURNAL_CENSUS_VIEW_POLICY));
  assert.ok(Object.isFrozen(CUSTODY_JOURNAL_CENSUS_VIEW_GUARDRAILS));
  assert.equal(CUSTODY_JOURNAL_CENSUS_VIEW_GUARDRAILS.humanDecision, 'REQUIRED');
  assert.equal(CUSTODY_JOURNAL_CENSUS_VIEW_GUARDRAILS.modelCalls, 0);
  assert.equal(CUSTODY_JOURNAL_CENSUS_VIEW_GUARDRAILS.remoteCalls, 0);
  assert.equal(CUSTODY_JOURNAL_CENSUS_VIEW_GUARDRAILS.learningPromoted, false);
  assert.equal(CUSTODY_JOURNAL_CENSUS_VIEW_GUARDRAILS.automaticRecovery, false);
  assert.equal(CUSTODY_JOURNAL_CENSUS_VIEW_GUARDRAILS.billionUsersProven, false);
  assert.equal(CUSTODY_JOURNAL_CENSUS_VIEW_GUARDRAILS.measuredCountsOnly, true);
  assert.equal(CUSTODY_JOURNAL_CENSUS_VIEW_GUARDRAILS.noWritePath, true);
  assert.equal(CUSTODY_JOURNAL_CENSUS_VIEW_GUARDRAILS.noActivationPath, true);
  assert.equal(CUSTODY_JOURNAL_CENSUS_VIEW_GUARDRAILS.tamperEvidentEndToEnd, true);
  assert.equal(CUSTODY_JOURNAL_CENSUS_VIEW_GUARDRAILS.registrationIsNotIssuanceProof, true);
});