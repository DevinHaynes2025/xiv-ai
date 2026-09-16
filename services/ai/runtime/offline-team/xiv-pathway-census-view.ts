// 12D-271 — Pathway Census View: the fail-closed rendering contract that
// turns a 12D-264 pathway ledger submission (genesis + ledger lines) into a
// display surface for the story shell. This is the operator's window into
// the brain's book: "this ledger replays clean; here is EXACTLY what it
// holds and what capacity remains — measured counts, nothing more."
//
// The UI NEVER sees raw ledger lines: it renders ONLY the frozen view
// model this module returns. Every submission is re-verified through the
// REAL 12D-264 replay — every entry re-parsed, every candidate re-gated,
// every hash-chain link re-derived — before a single count is shown. Any
// tamper refuses the WHOLE submission with ZERO ledger content.
//
// Rules, structurally enforced:
//   * MEASURED COUNTS ONLY: a census reports entries, capacity, and
//     remaining capacity — never a claim about anything the ledger does
//     not hold. An empty ledger renders the measured 0 and claims nothing
//     about unledgered scale (the 2,000,000 rows/database measured ceiling
//     stays the only one in the OS).
//   * TAMPER-EVIDENT END-TO-END: one edited, inserted, or deleted line
//     refuses the replay and the render — a tampered ledger is never
//     repaired and never partially shown.
//   * LEDGERED, NEVER ACTIVATED: the view has no activation path and
//     renders no activation claim; `activated` stays the literal 0.
//   * NO WRITE PATH: the view reads the submitted lines through a
//     transient store whose save refuses — a census can never append.
//   * BOUNDED: a submission claiming MORE lines than the hard cap cannot
//     be a lawful ledger — it refuses before the replay.
//   * PURE: no fs, no network, no clock, no randomness. modelCalls: 0,
//     remoteCalls: 0.
//
// Disclosed residuals:
//   * The census authenticates the BOOKKEEPING, not the truth of the
//     evidence — a ledger fed by an impostor records an impostor's
//     candidates (the 12D-233 residual verbatim); the ledger records,
//     never verifies who approved (12D-264 residual verbatim).

import {
  PATHWAY_LEDGER_POLICY,
  replayPathwayCensus,
  type PathwayLedgerStore,
} from './xiv-pathway-ledger';

export const PATHWAY_CENSUS_VIEW_POLICY = Object.freeze({
  policyVersion: '12d-271-v1',
  domain: 'XIV_OS_PATHWAY_CENSUS_VIEW',
});

export const PATHWAY_CENSUS_VIEW_GUARDRAILS = Object.freeze({
  verifyBeforeRender: true, // the FULL 12D-264 replay before any count shows
  measuredCountsOnly: true, // a census claims nothing beyond the book
  tamperEvidentEndToEnd: true, // one bad line refuses the whole render
  noWritePath: true, // the view's store save() refuses — census never appends
  boundedSubmission: true, // more lines than the hard cap cannot be lawful
  noActivationPath: true, // the view renders; it never activates
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

const INPUT_KEYS = ['ledgerGenesis', 'lines'] as const;

export type PathwayCensusViewModel =
  | Readonly<{
      kind: 'VERIFIED_PATHWAY_CENSUS';
      policyVersion: string;
      display: Readonly<{
        headline: string;
        entries: number;
        capacity: number;
        remainingCapacity: number;
        byDomain: Readonly<Record<string, number>>;
        activated: 0;
        status: string;
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

const REFUSAL_HEADLINE = 'Pathway ledger census refused — HUMAN DECISION REQUIRED';

/**
 * A transient read-only store: the view reads the SUBMITTED lines and can
 * never write — save() refuses unconditionally, so a census view has no
 * append path by construction.
 */
class CensusViewStore implements PathwayLedgerStore {
  constructor(private readonly lines: readonly string[]) {}
  load(): readonly string[] | null { return this.lines; }
  save(): void { throw new Error('a census view never writes to a ledger; fail closed'); }
}

/**
 * The only door from raw ledger material to the UI. Accepts ANY unknown
 * value; returns a frozen view model that is either a fully verified
 * measured census or an honest refusal. Never throws.
 */
export function buildPathwayCensusViewModel(raw: unknown): PathwayCensusViewModel {
  try {
    if (raw === null || typeof raw !== 'object' || Array.isArray(raw))
      throw new Error('a pathway ledger census submission object is required; fail closed');
    const keys = Object.keys(raw as Record<string, unknown>);
    if (keys.length !== INPUT_KEYS.length || !INPUT_KEYS.every((k, i) => keys[i] === k))
      throw new Error(`a pathway ledger census submission must have exactly the keys [${INPUT_KEYS.join(', ')}] in order; fail closed`);
    const s = raw as Readonly<Record<string, unknown>>;
    if (typeof s.ledgerGenesis !== 'string' || s.ledgerGenesis.length < 8)
      throw new Error('the ledger genesis must be a string of at least 8 chars; fail closed');
    if (!Array.isArray(s.lines))
      throw new Error('the ledger lines must be an array of ledger lines; fail closed');
    if ((s.lines as readonly unknown[]).length > PATHWAY_LEDGER_POLICY.maxEntriesPerLedger)
      throw new Error(`a lawful ledger can never hold more than ${PATHWAY_LEDGER_POLICY.maxEntriesPerLedger} entries; fail closed`);
    for (const line of s.lines as readonly unknown[]) {
      if (typeof line !== 'string')
        throw new Error('every ledger line must be a string; fail closed');
    }
    // The REAL 12D-264 replay: every entry re-parsed, every candidate
    // re-gated, every hash-chain link re-derived. Any tamper refuses.
    const census = replayPathwayCensus(new CensusViewStore(s.lines as readonly string[]), s.ledgerGenesis);
    return Object.freeze({
      kind: 'VERIFIED_PATHWAY_CENSUS' as const,
      policyVersion: PATHWAY_CENSUS_VIEW_POLICY.policyVersion,
      display: Object.freeze({
        headline: `Pathway ledger census: ${census.entries} of ${census.capacity} entries`,
        entries: census.entries,
        capacity: census.capacity,
        remainingCapacity: census.remainingCapacity,
        byDomain: census.byDomain,
        activated: census.activated,
        status: 'ledgered, never activated — the census reports MEASURED counts only',
        operatorNote: `Verified against pathway ledger policy ${PATHWAY_LEDGER_POLICY.policyVersion}: every entry re-parsed, every candidate re-gated, every hash-chain link re-derived in this view's path. The ledger records the recorded approvals — it never verifies who approved (the 12D-233 residual), and it authenticates bookkeeping, not the truth of the evidence. Nothing is activated here or anywhere in this chain; this census can never append (its write path refuses). humanDecision: 'REQUIRED' — the shell decides nothing.`,
      }),
    });
  } catch (err) {
    return Object.freeze({
      kind: 'REFUSED' as const,
      policyVersion: PATHWAY_CENSUS_VIEW_POLICY.policyVersion,
      reason: err instanceof Error ? err.message : String(err),
      display: Object.freeze({
        headline: REFUSAL_HEADLINE,
        bodyText: 'The pathway ledger submission failed verification and was NOT rendered. Nothing is shown from it — not the ledger lines, not the candidates, not the genesis, not any count. Diagnostics below are for the operator.',
        operatorNote: 'Refused. Deliver the exact genesis and the untampered ledger lines, or inspect the ledger in the custody stack.',
      }),
    });
  }
}