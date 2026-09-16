// 12D-268 — adversarial tests for the escrow verdict view. Central
// properties under attack:
//   1. Only a state that passes the REAL 12D-266 validator renders —
//      including the 12D-268 paydown (an exit with zero passed audits
//      refuses, like the 12D-266 exit-without-approval refusal).
//   2. The next-gate advisory is DERIVED from the phase, never invented.
//   3. A refusal carries ZERO escrow content.

import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createEscrowGate,
  stepEscrowGate,
  isEscrowGateState,
  type EscrowGateState,
} from './xiv-zero-trust-escrow-gate';
import {
  ESCROW_VERDICT_VIEW_GUARDRAILS,
  ESCROW_VERDICT_VIEW_POLICY,
  buildEscrowVerdictViewModel,
} from './xiv-escrow-verdict-view';

const LOCK_KEYS = { kind: 'LOCK', escrowId: 'escrow-12d-268-demo', payeeRef: 'payee:demo-0001' } as const;

function locked(track: string = 'FIAT_USD', amountMinorUnits = 1234): EscrowGateState {
  // Exact key order is part of the 12D-266 contract — build the event in
  // the declared order, never by spreading a partial.
  const st = stepEscrowGate(createEscrowGate(LOCK_KEYS.escrowId), {
    kind: 'LOCK',
    escrowId: LOCK_KEYS.escrowId,
    track,
    amountMinorUnits,
    payeeRef: LOCK_KEYS.payeeRef,
  });
  assert.equal(st.phase, 'LOCKED');
  return st;
}

function audited(track: string = 'FIAT_USD', amountMinorUnits = 1234): EscrowGateState {
  const st = stepEscrowGate(locked(track, amountMinorUnits), {
    kind: 'AUDIT', cisoVerdict: 'CLEAN', arenaVerdict: 'AUTHORIZED',
  });
  assert.equal(st.phase, 'AUDITED');
  assert.equal(isEscrowGateState(st), true, 'lawful chain must satisfy the validator');
  return st;
}

function released(kind: 'RELEASE' | 'REFUND' = 'RELEASE'): EscrowGateState {
  const st = stepEscrowGate(audited(), {
    kind,
    approverId: 'operator:devin',
    approvalRef: 'approval-ref-12d-268',
    approvalSignature: 'APPROVAL_REQUIRED:demo-signature',
  });
  assert.equal(st.phase, kind === 'RELEASE' ? 'RELEASED' : 'REFUNDED');
  return st;
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

test('12d-268: a lawful AUDITED escrow renders with the derived next gate', () => {
  const vm = buildEscrowVerdictViewModel({ escrowState: audited() });
  assert.ok(vm.kind === 'VERIFIED_ESCROW_STATE');
  assert.equal(vm.policyVersion, ESCROW_VERDICT_VIEW_POLICY.policyVersion);
  assert.equal(vm.display.escrowId, LOCK_KEYS.escrowId);
  assert.equal(vm.display.phase, 'AUDITED');
  assert.equal(vm.display.track, 'FIAT_USD');
  assert.equal(vm.display.amountMinorUnits, '1234');
  assert.equal(vm.display.amountDisplay, '12.34');
  assert.equal(vm.display.payeeRef, 'payee:demo-0001');
  assert.equal(vm.display.auditsPassed, 1);
  assert.equal(vm.display.approvalsRecorded, 0);
  assert.ok(vm.display.nextGate.includes('human-signed RELEASE or REFUND'));
  assert.ok(vm.display.operatorNote.includes('DESIGNED_NOT_INTEGRATED'), 'the honest rails status renders');
  assert.ok(Object.isFrozen(vm) && Object.isFrozen(vm.display));
});

test('12d-268: the full lawful chain to RELEASED renders as terminal', () => {
  const vm = buildEscrowVerdictViewModel({ escrowState: released() });
  assert.ok(vm.kind === 'VERIFIED_ESCROW_STATE');
  assert.equal(vm.display.phase, 'RELEASED');
  assert.equal(vm.display.auditsPassed, 1);
  assert.equal(vm.display.approvalsRecorded, 1);
  assert.ok(vm.display.nextGate.includes('terminal'));
  const refund = buildEscrowVerdictViewModel({ escrowState: released('REFUND') });
  assert.ok(refund.kind === 'VERIFIED_ESCROW_STATE');
  assert.equal(refund.display.phase, 'REFUNDED');
});

test('12d-268: an EMPTY escrow renders — with no money facts, never fabricated', () => {
  const vm = buildEscrowVerdictViewModel({ escrowState: createEscrowGate(LOCK_KEYS.escrowId) });
  assert.ok(vm.kind === 'VERIFIED_ESCROW_STATE');
  assert.equal(vm.display.phase, 'EMPTY');
  assert.equal(vm.display.amountDisplay, 'none');
  assert.equal(vm.display.track, 'none — money facts do not exist before LOCK');
  assert.ok(vm.display.nextGate.includes('awaiting LOCK'));
});

test('12d-268: a HOLD after a failed audit renders the HOLD advisory', () => {
  const held = stepEscrowGate(locked(), {
    kind: 'AUDIT', cisoVerdict: 'CLEAN', arenaVerdict: 'AUTHORIZED_WITH_RESERVATIONS',
  });
  assert.equal(held.phase, 'HOLD');
  const vm = buildEscrowVerdictViewModel({ escrowState: held });
  assert.ok(vm.kind === 'VERIFIED_ESCROW_STATE');
  assert.equal(vm.display.phase, 'HOLD');
  assert.equal(vm.display.auditsFailed, 1);
  assert.ok(vm.display.nextGate.includes('release stays impossible'));
});

test('12d-268: minor-unit display is exact integer arithmetic — no float rounding anywhere', () => {
  const usdc = audited('USDC', 1000001);
  const vmUsdc = buildEscrowVerdictViewModel({ escrowState: usdc });
  assert.ok(vmUsdc.kind === 'VERIFIED_ESCROW_STATE');
  assert.equal(vmUsdc.display.amountDisplay, '1.000001');
  const tiny = audited('FIAT_USD', 5);
  const vmTiny = buildEscrowVerdictViewModel({ escrowState: tiny });
  assert.ok(vmTiny.kind === 'VERIFIED_ESCROW_STATE');
  assert.equal(vmTiny.display.amountDisplay, '0.05');
  const usdcTiny = audited('USDC', 100);
  const vmUsdcTiny = buildEscrowVerdictViewModel({ escrowState: usdcTiny });
  assert.ok(vmUsdcTiny.kind === 'VERIFIED_ESCROW_STATE');
  assert.equal(vmUsdcTiny.display.amountDisplay, '0.000100');
});

test('12d-268: PAYDOWN REGRESSION — a forged RELEASED state with zero passed audits refuses at the view', () => {
  const base = released() as unknown as Record<string, unknown>;
  const forgedNoAudit = { ...base, auditsPassed: 0 };
  assert.equal(isEscrowGateState(forgedNoAudit), false, 'the validator must refuse it directly');
  const vm = buildEscrowVerdictViewModel({ escrowState: forgedNoAudit });
  assert.equal(vm.kind, 'REFUSED');
  REFUSAL_LEAK_CHECK(vm, 'payee:demo-0001', LOCK_KEYS.escrowId, '12.34');
});

test('12d-268: a forged RELEASED state without a recorded approval refuses (12D-266 regression via the view)', () => {
  const base = released() as unknown as Record<string, unknown>;
  const vm = buildEscrowVerdictViewModel({ escrowState: { ...base, approvalsRecorded: 0 } });
  assert.equal(vm.kind, 'REFUSED');
  REFUSAL_LEAK_CHECK(vm, 'payee:demo-0001', LOCK_KEYS.escrowId);
});

test('12d-268: a tampered money fact refuses the whole submission with zero leak', () => {
  const base = locked() as unknown as Record<string, unknown>;
  const tampered = { ...base, amountMinorUnits: 1.5 };
  const vm = buildEscrowVerdictViewModel({ escrowState: tampered });
  assert.equal(vm.kind, 'REFUSED');
  REFUSAL_LEAK_CHECK(vm, 'payee:demo-0001', LOCK_KEYS.escrowId);
});

test('12d-268: the exact-keys gate refuses reordering, extras, and absences', () => {
  const state = audited();
  const reordered = { ESCROW: state, escrowState: state } as unknown as Record<string, unknown>;
  assert.equal(buildEscrowVerdictViewModel(reordered).kind, 'REFUSED');
  const extra = { escrowState: state, smuggled: true } as unknown as Record<string, unknown>;
  assert.equal(buildEscrowVerdictViewModel(extra).kind, 'REFUSED');
  const empty = {} as unknown as Record<string, unknown>;
  assert.equal(buildEscrowVerdictViewModel(empty).kind, 'REFUSED');
});

test('12d-268: malformed submissions HOLD — null, array, string, number, boolean, undefined', () => {
  for (const raw of [null, [], 'string', 42, true, undefined, { escrowState: null }, { escrowState: 'nope' }]) {
    const vm = buildEscrowVerdictViewModel(raw);
    assert.equal(vm.kind, 'REFUSED', `${String(raw)} must refuse`);
    assert.ok(vm.kind === 'REFUSED');
    assert.ok(vm.reason.length > 0);
  }
});

test('12d-268: the verified view never carries an affordance', () => {
  const vm = buildEscrowVerdictViewModel({ escrowState: audited() });
  assert.ok(vm.kind === 'VERIFIED_ESCROW_STATE');
  const rendered = JSON.stringify(vm);
  assert.ok(!rendered.includes('approve'), 'no approve verb in a verified view');
  assert.ok(!rendered.includes('endpoint'), 'no endpoints in a verified view');
  assert.ok(vm.display.nextGate.includes('never through this shell'));
});

test('12d-268: guardrails and policy are pinned and frozen', () => {
  assert.ok(Object.isFrozen(ESCROW_VERDICT_VIEW_POLICY));
  assert.ok(Object.isFrozen(ESCROW_VERDICT_VIEW_GUARDRAILS));
  assert.equal(ESCROW_VERDICT_VIEW_GUARDRAILS.humanDecision, 'REQUIRED');
  assert.equal(ESCROW_VERDICT_VIEW_GUARDRAILS.modelCalls, 0);
  assert.equal(ESCROW_VERDICT_VIEW_GUARDRAILS.remoteCalls, 0);
  assert.equal(ESCROW_VERDICT_VIEW_GUARDRAILS.learningPromoted, false);
  assert.equal(ESCROW_VERDICT_VIEW_GUARDRAILS.automaticRecovery, false);
  assert.equal(ESCROW_VERDICT_VIEW_GUARDRAILS.billionUsersProven, false);
  assert.equal(ESCROW_VERDICT_VIEW_GUARDRAILS.moneyStaysMinorUnits, true);
  assert.equal(ESCROW_VERDICT_VIEW_GUARDRAILS.nextGateAdvisoryIsDerivedNeverInvented, true);
  assert.equal(ESCROW_VERDICT_VIEW_GUARDRAILS.displayOnlyNoAffordance, true);
});