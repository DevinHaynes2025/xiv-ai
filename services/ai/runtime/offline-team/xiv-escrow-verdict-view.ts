// 12D-268 — Escrow Verdict View: the fail-closed rendering contract that
// turns an escrow gate state (12D-266) into a display surface for the story
// shell. This is the operator's window into the Lock/Audit/Release ledger:
// "this escrow exists, here is its phase, here is the ONE gate that must
// open next — and the rails are still DESIGNED, NOT INTEGRATED."
//
// The UI NEVER sees raw escrow material: it renders ONLY the frozen view
// model this module returns. Every input is re-verified through the REAL
// 12D-266 validator — isEscrowGateState, the forged-state gate that carries
// the honest flags, the money-fact/phase consistency, and the
// exit-needs-approval / exit-needs-audit invariants IN the validator —
// before a single byte is shown. Any anomaly yields an honest refusal
// carrying ZERO escrow content (no escrowId, no payeeRef, no amount).
//
// Rules, structurally enforced:
//   * FORGED STATES REFUSE: the view trusts the validator, and the
//     validator now refuses the two impossible exits (release without a
//     recorded approval — 12D-266; release without a passed audit — the
//     12D-268 paydown).
//   * THE NEXT-GATE ADVISORY IS DERIVED, NEVER INVENTED: it is a pure
//     function of the verified phase — the view narrates what the gate
//     itself already requires. It is a status readout, NOT an affordance:
//     no approve button, no endpoint, no decision made here. The human
//     approval event happens in the custody stack; the shell only shows
//     what the state already implies.
//   * MONEY FACTS STAY MINOR UNITS: the display shows the exact integer and
//     a derived decimal STRING (integer arithmetic only — never a float
//     conversion), so no rounding can enter at the display edge either.
//   * PURE: no fs, no network, no clock, no randomness. Reads nothing but
//     its argument. modelCalls: 0, remoteCalls: 0.
//
// Disclosed residuals:
//   * The view authenticates the STATE STRUCTURE, not the history — it
//     proves the state is lawful, not that the events that produced it
//     were (the gate records injected verdicts and approvals; it never
//     verifies who signed — the 12D-266 residual verbatim).
//   * railsIntegrated: false, realFundsMoved: false — this is a display
//     surface for a ledger contract; no rail is touched, no funds move.

import {
  ESCROW_GATE_POLICY,
  isEscrowGateState,
  type EscrowGateState,
} from './xiv-zero-trust-escrow-gate';

export const ESCROW_VERDICT_VIEW_POLICY = Object.freeze({
  policyVersion: '12d-268-v1',
  domain: 'XIV_OS_ESCROW_VERDICT_VIEW',
});

export const ESCROW_VERDICT_VIEW_GUARDRAILS = Object.freeze({
  verifyBeforeRender: true, // all-or-nothing; no partial renders
  forgedStatesRefuse: true,
  nextGateAdvisoryIsDerivedNeverInvented: true,
  moneyStaysMinorUnits: true, // decimal strings are integer-derived, never floats
  displayOnlyNoAffordance: true, // the shell narrates; the custody stack decides
  refusedRendersAsRefused: true, // never an empty success
  pureModule: true,
  modelCalls: 0,
  remoteCalls: 0,
  collectsNothing: true,
  learningPromoted: false,
  automaticRecovery: false,
  billionUsersProven: false,
  humanDecision: 'REQUIRED' as const,
});

const INPUT_KEYS = ['escrowState'] as const;

export type EscrowVerdictViewModel =
  | Readonly<{
      kind: 'VERIFIED_ESCROW_STATE';
      policyVersion: string;
      display: Readonly<{
        headline: string;
        escrowId: string;
        phase: string;
        track: string;
        amountMinorUnits: string;
        amountDisplay: string;
        payeeRef: string;
        auditsPassed: number;
        auditsFailed: number;
        approvalsRecorded: number;
        nextGate: string;
        railsStatus: string;
        operatorNote: string;
      }>;
    }>
  | Readonly<{
      kind: 'REFUSED';
      policyVersion: string;
      reason: string;
      display: Readonly<{
        headline: string;
        bodyText: string;
        operatorNote: string;
      }>;
    }>;

const REFUSAL_HEADLINE = 'Escrow state refused — HUMAN DECISION REQUIRED';

/** Exact decimal rendering of an integer minor-unit amount — integer
 * arithmetic only, never a float conversion. The validator has already
 * refused nonpositive and non-integer amounts. */
function minorUnitsDisplay(amountMinorUnits: number, decimals: number): string {
  const scale = 10 ** decimals;
  const whole = Math.trunc(amountMinorUnits / scale);
  const frac = amountMinorUnits - whole * scale;
  return `${whole}.${String(frac).padStart(decimals, '0')}`;
}

/** The next-gate advisory — a pure function of the verified phase. The gate
 * itself already requires exactly this; the view invents nothing. */
function nextGateFor(phase: string): string {
  switch (phase) {
    case 'EMPTY':
      return 'awaiting LOCK — money facts do not exist yet';
    case 'LOCKED':
      return 'awaiting a dual-verdict audit (CISO CLEAN + arena AUTHORIZED); release is impossible before it';
    case 'HOLD':
      return 'on HOLD — deliver a clean + authorized audit; release stays impossible until then';
    case 'AUDITED':
      return 'audit passed — a human-signed RELEASE or REFUND event is required; the human decides in the custody stack, never through this shell';
    case 'RELEASED':
      return 'released through a human-signed surface (recorded) — the escrow is terminal';
    case 'REFUNDED':
      return 'refunded through a human-signed surface (recorded) — the escrow is terminal';
    default:
      return 'unknown phase'; // unreachable behind isEscrowGateState
  }
}

/**
 * The only door from raw escrow-gate material to the UI. Accepts ANY
 * unknown value; returns a frozen view model that is either a fully
 * verified escrow state or an honest refusal. Never throws.
 */
export function buildEscrowVerdictViewModel(raw: unknown): EscrowVerdictViewModel {
  try {
    if (raw === null || typeof raw !== 'object' || Array.isArray(raw))
      throw new Error('an escrow verdict submission object is required; fail closed');
    const keys = Object.keys(raw as Record<string, unknown>);
    if (keys.length !== INPUT_KEYS.length || !INPUT_KEYS.every((k, i) => keys[i] === k))
      throw new Error(`an escrow verdict submission must have exactly the keys [${INPUT_KEYS.join(', ')}] in order; fail closed`);
    const state = (raw as Readonly<Record<string, unknown>>).escrowState;
    // The REAL 12D-266 validator — forged states refuse here, including the
    // two impossible exits (no approval / no passed audit).
    if (!isEscrowGateState(state))
      throw new Error('the escrow state failed the 12D-266 validator; nothing is rendered; fail closed');
    const s = state as Readonly<EscrowGateState>;
    const hasMoney = s.track !== null && s.amountMinorUnits !== null;
    const decimals = s.track === 'USDC'
      ? ESCROW_GATE_POLICY.usdcDecimals
      : ESCROW_GATE_POLICY.fiatDecimals;
    return Object.freeze({
      kind: 'VERIFIED_ESCROW_STATE' as const,
      policyVersion: ESCROW_VERDICT_VIEW_POLICY.policyVersion,
      display: Object.freeze({
        headline: `Escrow ${s.escrowId}: ${s.phase}`,
        escrowId: s.escrowId,
        phase: s.phase,
        track: hasMoney ? String(s.track) : 'none — money facts do not exist before LOCK',
        amountMinorUnits: hasMoney ? String(s.amountMinorUnits) : 'none',
        amountDisplay: hasMoney
          ? minorUnitsDisplay(s.amountMinorUnits as number, decimals)
          : 'none',
        payeeRef: hasMoney ? String(s.payeeRef) : 'none',
        auditsPassed: s.auditsPassed,
        auditsFailed: s.auditsFailed,
        approvalsRecorded: s.approvalsRecorded,
        nextGate: nextGateFor(s.phase),
        railsStatus: ESCROW_GATE_POLICY.railsStatus,
        operatorNote: `Verified against escrow policy ${ESCROW_GATE_POLICY.policyVersion}: the state passes the forged-state validator, the money facts ride in the state, and the next-gate advisory is derived from the phase, never invented. The rails are ${ESCROW_GATE_POLICY.railsStatus} — this surface renders a ledger state; it moves no funds and touches no chain. A human-signed approval event is the only exit; the decision happens in the custody stack, never through this shell.`,
      }),
    });
  } catch (err) {
    return Object.freeze({
      kind: 'REFUSED' as const,
      policyVersion: ESCROW_VERDICT_VIEW_POLICY.policyVersion,
      reason: err instanceof Error ? err.message : String(err),
      display: Object.freeze({
        headline: REFUSAL_HEADLINE,
        bodyText: 'The escrow submission failed verification and was NOT rendered. Nothing is shown from it — not the escrow id, not the payee, not the amount, not the phase. Diagnostics below are for the operator.',
        operatorNote: 'Refused. Deliver a lawful escrow gate state, or step the gate in the escrow ledger.',
      }),
    });
  }
}