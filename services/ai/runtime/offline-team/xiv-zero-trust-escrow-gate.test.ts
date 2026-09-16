// 12D-266 — adversarial tests for the Zero-Trust Escrow Gate contract.
// Central properties under attack:
//   1. Money leaves escrow ONLY through a human-signed surface — RELEASE
//      and REFUND both demand the APPROVAL_REQUIRED signature, and ONLY
//      after a fully passed audit. No shortcut exists.
//   2. Any audit that is not CLEAN + AUTHORIZED, and any garbage event,
//      HOLDs the escrow — ambiguity never releases, never throws away
//      the lock, never loses the money facts.
//   3. Forged states refuse — the dual-track integers and the honest
//      flags ride IN the state and cannot be forged past the validator.

import test from 'node:test';
import assert from 'node:assert/strict';
import {
  ESCROW_GATE_GUARDRAILS,
  ESCROW_GATE_POLICY,
  createEscrowGate,
  isEscrowGateState,
  stepEscrowGate,
  verifyEscrowGateInvariants,
} from './xiv-zero-trust-escrow-gate';

const ESCROW = 'escrow-12d-266-alpha';

function lock(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    kind: 'LOCK',
    escrowId: ESCROW,
    track: 'USDC',
    amountMinorUnits: 1_500_000, // 1.5 USDC in micro units
    payeeRef: 'payee:bounty-001',
    ...overrides,
  };
}

function audit(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return { kind: 'AUDIT', cisoVerdict: 'CLEAN', arenaVerdict: 'AUTHORIZED', ...overrides };
}

function release(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    kind: 'RELEASE',
    approverId: 'approver:devin',
    approvalRef: 'approval:12d-266-001',
    approvalSignature: 'APPROVAL_REQUIRED:devin:12d-266-001',
    ...overrides,
  };
}

function locked() {
  let s = createEscrowGate(ESCROW);
  s = stepEscrowGate(s, lock());
  return s;
}

function audited() {
  let s = locked();
  s = stepEscrowGate(s, audit());
  return s;
}

test('12d-266: lock, audit, and human-signed release — the lawful happy path', () => {
  let s = createEscrowGate(ESCROW);
  assert.equal(s.phase, 'EMPTY');
  s = stepEscrowGate(s, lock());
  assert.equal(s.phase, 'LOCKED');
  assert.equal(s.track, 'USDC');
  assert.equal(s.amountMinorUnits, 1_500_000);
  assert.equal(s.payeeRef, 'payee:bounty-001');
  s = stepEscrowGate(s, audit());
  assert.equal(s.phase, 'AUDITED');
  assert.equal(s.auditsPassed, 1);
  s = stepEscrowGate(s, release());
  assert.equal(s.phase, 'RELEASED');
  assert.equal(s.approvalsRecorded, 1);
  assert.ok(Object.isFrozen(s));
  assert.ok(verifyEscrowGateInvariants(s).ok);
  // Terminal: nothing further happens.
  assert.equal(stepEscrowGate(s, audit()).phase, 'RELEASED');
  assert.equal(stepEscrowGate(s, release()).phase, 'RELEASED');
});

test('12d-266: fiat track locks in minor units with the same gate', () => {
  let s = createEscrowGate(ESCROW);
  s = stepEscrowGate(s, lock({ track: 'FIAT_USD', amountMinorUnits: 12_500 }));
  assert.equal(s.phase, 'LOCKED');
  assert.equal(s.track, 'FIAT_USD');
  assert.equal(s.amountMinorUnits, 12_500); // $125.00, integer cents only
  assert.equal(ESCROW_GATE_POLICY.fiatDecimals, 2);
  assert.equal(ESCROW_GATE_POLICY.usdcDecimals, 6);
});

test('12d-266: release is structurally impossible without a passed audit', () => {
  // Pre-audit phases: a release attempt can only HOLD (or leave EMPTY).
  for (const phase of ['EMPTY', 'LOCKED', 'HOLD']) {
    const s = createEscrowGate(ESCROW);
    const t = phase === 'EMPTY' ? s : stepEscrowGate(s, lock());
    const next = stepEscrowGate(t, release());
    assert.notEqual(next.phase, 'RELEASED', `release must refuse from ${phase}`);
    assert.ok(next.phase === 'HOLD' || next.phase === phase);
  }
  // Terminal phases are frozen: nothing further happens, lawfully.
  const done = audited();
  const rel = stepEscrowGate(done, release());
  assert.equal(rel.phase, 'RELEASED');
  assert.equal(stepEscrowGate(rel, release()).phase, 'RELEASED');
  assert.equal(stepEscrowGate(rel, { ...release(), kind: 'REFUND' }).phase, 'RELEASED');
});

test('12d-266: release without the APPROVAL_REQUIRED signature HOLDs — no signature, no release', () => {
  const s = audited();
  for (const bad of [
    release({ approvalSignature: '' }),
    release({ approvalSignature: '   ' }),
    release({ approvalSignature: null }),
    release({ approvalRef: '' }),
    release({ approverId: 'bad id with spaces' }),
  ]) {
    const next = stepEscrowGate(s, bad);
    assert.equal(next.phase, 'HOLD');
    assert.equal(next.approvalsRecorded, 0, 'no approval may be recorded without a signature');
  }
});

test('12d-266: a partially clean audit HOLDs — both verdicts must pass', () => {
  for (const bad of [
    audit({ cisoVerdict: 'FINDINGS' }),
    audit({ arenaVerdict: 'REFUSED' }),
    audit({ arenaVerdict: 'authorized' }), // case-exact; near-miss refuses
    audit({ cisoVerdict: 1 }),
    audit({ cisoVerdict: undefined }),
  ]) {
    const next = stepEscrowGate(locked(), bad as Record<string, unknown>);
    assert.equal(next.phase, 'HOLD');
    assert.equal(next.auditsFailed, 1);
    assert.equal(next.amountMinorUnits, 1_500_000, 'the lock facts survive a failed audit');
  }
});

test('12d-266: a held escrow can re-audit and still release lawfully; refund also needs the signature', () => {
  let s = stepEscrowGate(locked(), audit({ arenaVerdict: 'REFUSED' }));
  assert.equal(s.phase, 'HOLD');
  s = stepEscrowGate(s, audit()); // a clean re-audit from HOLD is lawful
  assert.equal(s.phase, 'AUDITED');
  s = stepEscrowGate(s, { ...release(), kind: 'REFUND' });
  assert.equal(s.phase, 'REFUNDED');
  assert.equal(s.approvalsRecorded, 1);
  assert.ok(verifyEscrowGateInvariants(s).ok);
});

test('12d-266: unknown events, non-objects, and malformed payload HOLD — and never throw away the lock', () => {
  const s = locked();
  for (const bad of [
    null, undefined, 42, 'text', [], {},
    { kind: 'RELEASE_NOW' },
    { kind: 'LOCK', escrowId: ESCROW }, // malformed re-lock
    { kind: 'AUDIT', cisoVerdict: 'CLEAN' }, // missing arenaVerdict
  ] as unknown[]) {
    const next = stepEscrowGate(s, bad);
    assert.equal(next.phase, 'HOLD', JSON.stringify(bad));
    assert.equal(next.amountMinorUnits, 1_500_000, 'the lock facts must survive');
    assert.equal(next.auditsPassed, 0);
  }
});

test('12d-266: an EMPTY escrow ignores anomalies — it never fabricates money facts', () => {
  const s = createEscrowGate(ESCROW);
  assert.equal(stepEscrowGate(s, audit()).phase, 'EMPTY');
  assert.equal(stepEscrowGate(s, release()).phase, 'EMPTY');
  assert.equal(stepEscrowGate(s, { kind: '???' }).phase, 'EMPTY');
  assert.equal(s.track, null);
  assert.equal(s.amountMinorUnits, null);
});

test('12d-266: one lock per escrow — a re-lock, a foreign lock, or a nonpositive amount HOLDs', () => {
  const s = locked();
  assert.equal(stepEscrowGate(s, lock()).phase, 'HOLD');
  assert.equal(stepEscrowGate(s, lock({ escrowId: 'escrow-foreign' })).phase, 'HOLD');
  const fresh = createEscrowGate(ESCROW);
  assert.equal(stepEscrowGate(fresh, lock({ amountMinorUnits: 0 })).phase, 'EMPTY');
  assert.equal(stepEscrowGate(fresh, lock({ amountMinorUnits: -5 })).phase, 'EMPTY');
  assert.equal(stepEscrowGate(fresh, lock({ amountMinorUnits: 1.5 })).phase, 'EMPTY');
  assert.equal(stepEscrowGate(fresh, lock({ track: 'BTC' })).phase, 'EMPTY');
});

test('12d-266: forged states refuse the validator — honest flags and money facts are pinned', () => {
  const good = audited();
  const base = good as unknown as Record<string, unknown>;
  const bads: unknown[] = [
    null, undefined, 42, 'text', [],
    { ...base, escrowId: 'bad id with spaces' },
    { ...base, railsIntegrated: true }, // the rails are NOT integrated; no state may claim otherwise
    { ...base, realFundsMoved: true },
    { ...base, humanDecision: 'NOT_REQUIRED' },
    { ...base, policyVersion: '12d-999-v1' },
    { ...base, guardrails: { ...ESCROW_GATE_GUARDRAILS } }, // the frozen guardrails, by identity
    { ...base, phase: 'RELEASED', approvalsRecorded: 0 }, // a release without a recorded approval
    { ...base, phase: 'EMPTY', track: 'USDC' }, // money facts before a lock are impossible
    { ...base, phase: 'LOCKED', track: null },
    { ...base, phase: 'LOCKED', amountMinorUnits: 1.5 },
    { ...base, phase: 'LOCKED', track: 'BTC' },
    { ...base, auditsPassed: -1 },
    { ...base, approvalsRecorded: 1.5 },
  ];
  for (const bad of bads) assert.equal(isEscrowGateState(bad), false, JSON.stringify(bad));
  assert.equal(isEscrowGateState(good), true);
  assert.throws(() => verifyEscrowGateInvariants({ ...base, phase: 'RELEASED', approvalsRecorded: 0 } as never), /fail closed/);
});

test('12d-266: bad escrow ids refuse construction', () => {
  for (const id of ['', 'bad id with spaces', 'x'.repeat(129), null, undefined, 42]) {
    assert.throws(() => createEscrowGate(id as string), /fail closed/);
  }
  assert.equal(createEscrowGate('x'.repeat(128)).escrowId, 'x'.repeat(128));
});

test('12d-266: policy pins — the honest boundary never moves', () => {
  assert.equal(ESCROW_GATE_POLICY.policyVersion, '12d-266-v1');
  assert.equal(ESCROW_GATE_POLICY.railsStatus, 'DESIGNED_NOT_INTEGRATED');
  assert.equal(ESCROW_GATE_GUARDRAILS.humanDecision, 'REQUIRED');
  assert.equal(ESCROW_GATE_GUARDRAILS.humanApprovalSignatureRequired, true);
  assert.equal(ESCROW_GATE_GUARDRAILS.auditRequiredBeforeRelease, true);
  assert.equal(ESCROW_GATE_GUARDRAILS.dualTrackIntegerMinorUnitsOnly, true);
  assert.equal(ESCROW_GATE_GUARDRAILS.railsIntegrated, false);
  assert.equal(ESCROW_GATE_GUARDRAILS.realFundsMoved, false);
  assert.equal(ESCROW_GATE_GUARDRAILS.noCredentialsHandled, true);
  assert.equal(ESCROW_GATE_GUARDRAILS.ambiguityHolds, true);
  assert.equal(ESCROW_GATE_GUARDRAILS.modelCalls, 0);
  assert.equal(ESCROW_GATE_GUARDRAILS.remoteCalls, 0);
  assert.equal(ESCROW_GATE_GUARDRAILS.learningPromoted, false);
  assert.equal(ESCROW_GATE_GUARDRAILS.billionUsersProven, false);
  assert.equal(ESCROW_GATE_GUARDRAILS.automaticRecovery, false);
});