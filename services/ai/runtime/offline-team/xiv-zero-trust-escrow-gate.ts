// 12D-266 — Zero-Trust Escrow Gate: the Lock/Audit/Release contract for
// the dual fiat & crypto payout ledger, as a PURE, fail-closed contract
// module. This module moves NO money, holds NO credentials, calls NO
// service, and touches NO chain. It enforces the gate's SHAPE so a future
// authorized rail integration cannot release funds outside it silently:
//
//   * DUAL TRACK: every payout carries track 'FIAT_USD' (minor units,
//     2 decimals) or 'USDC' (minor units, 6 decimals) — integers only,
//     never floats, never rounded.
//   * LOCK: funds enter escrow as a ledgered LOCK — the only way in.
//   * AUDIT: release is impossible until BOTH injected verdicts pass —
//     the local CISO scan verdict must be 'CLEAN' AND the arena judge
//     verdict must be 'AUTHORIZED' (12D-258 chain). Any other verdict,
//     or any garbage, puts the escrow on HOLD. Fail closed.
//   * RELEASE: requires phase AUDITED plus a HUMAN approval event with
//     the approver id, a nonblank approval ref, and a nonblank
//     APPROVAL_REQUIRED signature — recorded, never fabricated. No
//     human signature, no release. Any release path that skips the
//     signature is structurally impossible.
//   * REFUND: the second lawful exit — also requires the human
//     approval event. Money can only ever leave escrow through a
//     human-signed surface.
//   * AMBIGUITY HOLDS: an unknown event, or any anomaly, puts the
//     escrow on HOLD — it never releases and never silently re-locks.
//
// Disclosed residuals (honest flags pinned on every surface):
//   * railsIntegrated: false — the fiat and USDC rails are DESIGNED, NOT
//     INTEGRATED. No Stripe-like gateway, no chain, no wallet, no node.
//   * realFundsMoved: false — this gate records custody state; it never
//     performs a transfer.
//   * The gate records injected verdicts and approvals — like the
//     12D-264 ledger, it records, never verifies who signed.
//   * humanDecision: 'REQUIRED', learningPromoted: false, remoteCalls: 0,
//     modelCalls: 0, billionUsersProven: false.

export const ESCROW_GATE_POLICY = Object.freeze({
  policyVersion: '12d-266-v1',
  domain: 'XIV_OS_ZERO_TRUST_ESCROW_GATE',
  /** The rails are DESIGNED, NOT INTEGRATED — no gateway, no chain, no wallet. */
  railsStatus: 'DESIGNED_NOT_INTEGRATED' as const,
  fiatDecimals: 2,
  usdcDecimals: 6,
  maxPayeeRefChars: 128,
  maxApprovalRefChars: 128,
  maxSignatureChars: 256,
});

export const ESCROW_GATE_GUARDRAILS = Object.freeze({
  humanApprovalSignatureRequired: true,
  auditRequiredBeforeRelease: true,
  dualTrackIntegerMinorUnitsOnly: true,
  railsIntegrated: false,
  realFundsMoved: false,
  noCredentialsHandled: true,
  localPlaneOnly: true,
  ambiguityHolds: true,
  modelCalls: 0,
  remoteCalls: 0,
  collectsNothing: true,
  learningPromoted: false,
  automaticRecovery: false,
  billionUsersProven: false,
  humanDecision: 'REQUIRED' as const,
});

export type EscrowTrack = 'FIAT_USD' | 'USDC';
export type EscrowPhase = 'EMPTY' | 'LOCKED' | 'HOLD' | 'AUDITED' | 'RELEASED' | 'REFUNDED';

export type EscrowGateState = Readonly<{
  escrowId: string;
  phase: EscrowPhase;
  track: EscrowTrack | null;
  amountMinorUnits: number | null;
  payeeRef: string | null;
  auditsPassed: number;
  auditsFailed: number;
  approvalsRecorded: number;
  railsIntegrated: false;
  realFundsMoved: false;
  humanDecision: 'REQUIRED';
  policyVersion: string;
  guardrails: typeof ESCROW_GATE_GUARDRAILS;
}>;

const ref = (v: unknown, max: number): v is string =>
  typeof v === 'string' && v.trim().length > 0 && v.length <= max;
const escrowIdOk = (v: unknown): v is string =>
  typeof v === 'string' && /^[A-Za-z0-9_.:-]{1,128}$/.test(v);

const TRACKS: readonly EscrowTrack[] = ['FIAT_USD', 'USDC'];

const LOCK_KEYS = ['kind', 'escrowId', 'track', 'amountMinorUnits', 'payeeRef'] as const;
const AUDIT_KEYS = ['kind', 'cisoVerdict', 'arenaVerdict'] as const;
const APPROVAL_KEYS = ['kind', 'approverId', 'approvalRef', 'approvalSignature'] as const;

/** Exact-keys gate IN ORDER — the house discipline, per event family. */
function exactKeys(v: unknown, KEYS: readonly string[], message: string): Readonly<Record<string, unknown>> {
  if (v === null || typeof v !== 'object' || Array.isArray(v)) throw new Error(message);
  const keys = Object.keys(v as Record<string, unknown>);
  if (keys.length !== KEYS.length || !KEYS.every((k, i) => keys[i] === k)) throw new Error(message);
  return v as Readonly<Record<string, unknown>>;
}

const LOCK_MSG = 'an escrow LOCK event must have exactly the keys [kind, escrowId, track, amountMinorUnits, payeeRef] in order; fail closed';
const AUDIT_MSG = 'an escrow AUDIT event must have exactly the keys [kind, cisoVerdict, arenaVerdict] in order; fail closed';
const APPROVAL_MSG = 'a human approval event must have exactly the keys [kind, approverId, approvalRef, approvalSignature] in order; fail closed';

/** Verify the escrow state carries the invariants — camera-off analog: the
 * dual-track integers and the human-decision pins ride IN the state, and a
 * forged state refuses. */
export function isEscrowGateState(v: unknown): v is EscrowGateState {
  if (v === null || typeof v !== 'object') return false;
  const s = v as Readonly<Record<string, unknown>>;
  if (!escrowIdOk(s.escrowId)) return false;
  if (s.railsIntegrated !== false || s.realFundsMoved !== false) return false;
  if (s.humanDecision !== 'REQUIRED') return false;
  if (s.policyVersion !== ESCROW_GATE_POLICY.policyVersion) return false;
  if (s.guardrails !== ESCROW_GATE_GUARDRAILS) return false;
  if (typeof s.auditsPassed !== 'number' || !Number.isSafeInteger(s.auditsPassed) || s.auditsPassed < 0) return false;
  if (typeof s.auditsFailed !== 'number' || !Number.isSafeInteger(s.auditsFailed) || s.auditsFailed < 0) return false;
  if (typeof s.approvalsRecorded !== 'number' || !Number.isSafeInteger(s.approvalsRecorded) || s.approvalsRecorded < 0) return false;
  // Track/amount/payee must be consistent with the phase: money facts exist
  // once LOCKED (or later) and never before.
  const PHASES_WITH_MONEY: readonly string[] = ['LOCKED', 'HOLD', 'AUDITED', 'RELEASED', 'REFUNDED'];
  const phased = PHASES_WITH_MONEY.includes(s.phase as string);
  const hasTrack = s.track === null || TRACKS.includes(s.track as EscrowTrack);
  if (!hasTrack) return false;
  if (!phased) {
    if (s.phase !== 'EMPTY') return false;
    return s.track === null && s.amountMinorUnits === null && s.payeeRef === null;
  }
  if (!TRACKS.includes(s.track as EscrowTrack)) return false;
  if (typeof s.amountMinorUnits !== 'number' || !Number.isSafeInteger(s.amountMinorUnits) || s.amountMinorUnits <= 0) return false;
  const max = s.track === 'FIAT_USD'
    ? ESCROW_GATE_POLICY.fiatDecimals
    : ESCROW_GATE_POLICY.usdcDecimals;
  if (max !== 2 && max !== 6) return false;
  if (typeof s.payeeRef !== 'string' || s.payeeRef.length === 0 || s.payeeRef.length > ESCROW_GATE_POLICY.maxPayeeRefChars) return false;
  // A lawful exit RIDES IN the state: a released or refunded escrow must
  // already carry the recorded human approval. An exit without an approval
  // is an impossible state, not an invariant checked elsewhere (the
  // 12D-263 lesson — forged states refuse at the validator, not after it).
  if ((s.phase === 'RELEASED' || s.phase === 'REFUNDED') && s.approvalsRecorded < 1) return false;
  return true;
}

export function verifyEscrowGateInvariants(state: EscrowGateState): Readonly<{ ok: true }> {
  if (!isEscrowGateState(state)) throw new Error('escrow gate state violates its invariants; fail closed');
  if (state.phase === 'RELEASED' || state.phase === 'REFUNDED') {
    if (state.approvalsRecorded < 1)
      throw new Error('a released or refunded escrow must carry a recorded human approval; fail closed');
  }
  return Object.freeze({ ok: true } as const);
}

export function createEscrowGate(escrowId: string): EscrowGateState {
  if (!escrowIdOk(escrowId)) throw new Error('a valid escrow id is required; fail closed');
  return Object.freeze({
    escrowId,
    phase: 'EMPTY' as const,
    track: null,
    amountMinorUnits: null,
    payeeRef: null,
    auditsPassed: 0,
    auditsFailed: 0,
    approvalsRecorded: 0,
    railsIntegrated: false as const,
    realFundsMoved: false as const,
    humanDecision: 'REQUIRED' as const,
    policyVersion: ESCROW_GATE_POLICY.policyVersion,
    guardrails: ESCROW_GATE_GUARDRAILS,
  });
}

/** The human approval event — RELEASE and REFUND both require it. The
 * APPROVAL_REQUIRED signature is RECORDED here, verified by shape only:
 * the rail integration (a future, separately authorized story) owns
 * cryptographic signature verification against custody records. */
function parseApproval(v: unknown): Readonly<{ approverId: string; approvalRef: string; approvalSignature: string }> {
  const e = exactKeys(v, APPROVAL_KEYS, APPROVAL_MSG);
  if (e.kind !== 'RELEASE' && e.kind !== 'REFUND') throw new Error(APPROVAL_MSG);
  if (!escrowIdOk(e.approverId)) throw new Error('a valid approver id is required; fail closed');
  if (!ref(e.approvalRef, ESCROW_GATE_POLICY.maxApprovalRefChars))
    throw new Error('a nonblank approval ref is required; fail closed');
  if (!ref(e.approvalSignature, ESCROW_GATE_POLICY.maxSignatureChars))
    throw new Error('the APPROVAL_REQUIRED signature is required; no signature, no release; fail closed');
  return Object.freeze({
    approverId: e.approverId,
    approvalRef: e.approvalRef,
    approvalSignature: e.approvalSignature,
  });
}

export type EscrowGateEvent = Readonly<Record<string, unknown>>;

/**
 * Step the escrow gate. Money enters ONLY via LOCK; it leaves ONLY via a
 * human-signed RELEASE (after a passed audit) or human-signed REFUND. Any
 * audit that is not fully clean + authorized HOLDs the escrow. Any
 * unknown event HOLDs the escrow. Ambiguity never releases. Never
 * mutates the input state; throws on nothing — HOLD is the failure mode.
 */
export function stepEscrowGate(state: EscrowGateState, event: unknown): EscrowGateState {
  if (!isEscrowGateState(state)) throw new Error('a valid escrow gate state is required; fail closed');
  const hold = (): EscrowGateState => Object.freeze({
    ...state,
    phase: (state.phase === 'EMPTY' || state.phase === 'RELEASED' || state.phase === 'REFUNDED') ? state.phase : 'HOLD',
  } as EscrowGateState);
  if (event === null || typeof event !== 'object' || Array.isArray(event)) return hold();
  const e = event as Readonly<Record<string, unknown>>;

  if (e.kind === 'LOCK') {
    if (state.phase !== 'EMPTY') return hold(); // one lock per escrow; a re-lock is an anomaly
    let l: Readonly<Record<string, unknown>>;
    try { l = exactKeys(event, LOCK_KEYS, LOCK_MSG); } catch { return hold(); }
    if (!TRACKS.includes(l.track as EscrowTrack)) return hold();
    if (typeof l.amountMinorUnits !== 'number' || !Number.isSafeInteger(l.amountMinorUnits) || l.amountMinorUnits <= 0)
      return hold();
    if (!escrowIdOk(l.escrowId) || l.escrowId !== state.escrowId) return hold();
    if (!ref(l.payeeRef, ESCROW_GATE_POLICY.maxPayeeRefChars)) return hold();
    const track = l.track as EscrowTrack;
    return Object.freeze({
      ...state,
      phase: 'LOCKED' as const,
      track,
      amountMinorUnits: l.amountMinorUnits,
      payeeRef: l.payeeRef,
    } as EscrowGateState);
  }

  if (e.kind === 'AUDIT') {
    if (state.phase !== 'LOCKED' && state.phase !== 'HOLD') return hold();
    let a: Readonly<Record<string, unknown>>;
    try { a = exactKeys(event, AUDIT_KEYS, AUDIT_MSG); } catch { return hold(); }
    const passed = a.cisoVerdict === 'CLEAN' && a.arenaVerdict === 'AUTHORIZED';
    if (!passed) {
      return Object.freeze({
        ...state,
        phase: 'HOLD' as const,
        auditsFailed: state.auditsFailed + 1,
      } as EscrowGateState);
    }
    return Object.freeze({
      ...state,
      phase: 'AUDITED' as const,
      auditsPassed: state.auditsPassed + 1,
    } as EscrowGateState);
  }

  if (e.kind === 'RELEASE' || e.kind === 'REFUND') {
    if (state.phase !== 'AUDITED') return hold(); // no audit passed, no release — ever
    try { parseApproval(event); } catch { return hold(); }
    return Object.freeze({
      ...state,
      phase: (e.kind === 'RELEASE' ? 'RELEASED' as const : 'REFUNDED' as const),
      approvalsRecorded: state.approvalsRecorded + 1,
    } as EscrowGateState);
  }

  return hold(); // unknown event kinds HOLD — ambiguity never releases
}