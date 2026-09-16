// 12D-272 — Custody Journal Census View: the fail-closed rendering contract
// that turns a 12D-236 custody journal submission (journal genesis + journal
// lines) into a display surface for the story shell. This is the operator's
// window into the custody chain's book: "this journal replays clean through
// the registry's own fail-closed gates; here is EXACTLY what it holds —
// measured counts, nothing more."
//
// The UI NEVER sees raw journal lines: it renders ONLY the frozen view
// model this module returns. Every submission is re-verified through the
// REAL 12D-236 replay — every line re-parsed against the journal's own
// hash chain, every op replayed through the 12D-233 registry gates in
// order, and the rebuilt ledger required to verify AND match op-for-op —
// before a single count is shown. Any anomaly refuses the WHOLE submission
// with ZERO journal content.
//
// Rules, structurally enforced:
//   * MEASURED COUNTS ONLY: the census reports the op count, the
//     registered/consumed split, and the distinct-purpose count — never a
//     receipt digest, never a registrant identity, never a purpose name.
//     An empty journal renders the measured 0 and claims nothing.
//   * TAMPER-EVIDENT END-TO-END: one edited, inserted, or deleted line
//     refuses the replay and the render — a tampered journal is never
//     repaired and never partially shown.
//   * NO WRITE PATH: the view reads the submitted lines through a
//     transient store whose save refuses — a census can never append.
//   * REGISTRATION IS NOT ISSUANCE PROOF: the census authenticates the
//     custody chain's bookkeeping, not the operator (the 12D-233 residual
//     verbatim) — possession of the journal is not authorization.
//   * PURE: no fs, no network, no clock, no randomness. modelCalls: 0,
//     remoteCalls: 0.
//
// Disclosed residuals:
//   * A journal fed by an impostor records an impostor's ops (12D-236
//     residual verbatim); the census renders the measured book, not the
//     truth of who fed it.
//   * TAIL TRUNCATION IS NOT DETECTED BY REPLAY ALONE: a hash chain
//     validates each line against its predecessor, so a lawful PREFIX of
//     a journal replays clean as a shorter journal. Middle-line edits,
//     insertions, and deletions all refuse; truncating the TAIL is only
//     detectable out of band, by comparing the journal's head digest —
//     single-writer discipline (the 12D-236 residual). The census renders
//     the measured count of what was SUBMITTED, never a claim that the
//     submission is the complete journal.

import {
  replayCustodyJournal,
  type CustodyJournalStore,
} from './operator-custody-journal';

export const CUSTODY_JOURNAL_CENSUS_VIEW_POLICY = Object.freeze({
  policyVersion: '12d-272-v1',
  domain: 'XIV_OS_CUSTODY_JOURNAL_CENSUS_VIEW',
});

export const CUSTODY_JOURNAL_CENSUS_VIEW_GUARDRAILS = Object.freeze({
  verifyBeforeRender: true, // the FULL 12D-236 replay before any count shows
  measuredCountsOnly: true, // no receipt digests, no identities, no purpose names
  tamperEvidentEndToEnd: true, // one bad line refuses the whole render
  noWritePath: true, // the view's store save() refuses — a census never appends
  registrationIsNotIssuanceProof: true, // the 12D-233 residual, pinned here too
  noActivationPath: true, // the view renders; it never activates anything
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

const INPUT_KEYS = ['journalGenesis', 'lines'] as const;

export type CustodyJournalCensusViewModel =
  | Readonly<{
      kind: 'VERIFIED_CUSTODY_JOURNAL_CENSUS';
      policyVersion: string;
      display: Readonly<{
        headline: string;
        ops: number;
        registered: number;
        consumed: number;
        distinctPurposes: number;
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

const REFUSAL_HEADLINE = 'Custody journal census refused — HUMAN DECISION REQUIRED';

/**
 * A transient read-only store: the view reads the SUBMITTED lines and can
 * never write — save() refuses unconditionally, so a census view has no
 * append path by construction.
 */
class CensusViewStore implements CustodyJournalStore {
  constructor(private readonly lines: readonly string[]) {}
  load(): readonly string[] | null { return this.lines; }
  save(): void { throw new Error('a custody census view never writes to a journal; fail closed'); }
}

/**
 * The only door from raw custody journal material to the UI. Accepts ANY
 * unknown value; returns a frozen view model that is either a fully
 * verified measured census or an honest refusal. Never throws.
 */
export function buildCustodyJournalCensusViewModel(raw: unknown): CustodyJournalCensusViewModel {
  try {
    if (raw === null || typeof raw !== 'object' || Array.isArray(raw))
      throw new Error('a custody journal census submission object is required; fail closed');
    const keys = Object.keys(raw as Record<string, unknown>);
    if (keys.length !== INPUT_KEYS.length || !INPUT_KEYS.every((k, i) => keys[i] === k))
      throw new Error(`a custody journal census submission must have exactly the keys [${INPUT_KEYS.join(', ')}] in order; fail closed`);
    const s = raw as Readonly<Record<string, unknown>>;
    if (typeof s.journalGenesis !== 'string' || s.journalGenesis.length < 8)
      throw new Error('the journal genesis must be a string of at least 8 chars; fail closed');
    if (!Array.isArray(s.lines))
      throw new Error('the journal lines must be an array of journal lines; fail closed');
    for (const line of s.lines as readonly unknown[]) {
      if (typeof line !== 'string')
        throw new Error('every journal line must be a string; fail closed');
    }
    // The REAL 12D-236 replay: every line re-parsed against the journal's
    // own hash chain, every op replayed through the registry's fail-closed
    // gates in order, the rebuilt ledger verified AND matched op-for-op.
    // Any tamper refuses.
    const replay = replayCustodyJournal(new CensusViewStore(s.lines as readonly string[]), s.journalGenesis);
    const events = replay.registry.ledgerEntries();
    let registered = 0;
    let consumed = 0;
    const purposes = new Set<string>();
    for (const e of events) {
      if (e.kind === 'CUSTODY_REGISTERED') registered += 1;
      else consumed += 1;
      purposes.add(e.purpose);
    }
    return Object.freeze({
      kind: 'VERIFIED_CUSTODY_JOURNAL_CENSUS' as const,
      policyVersion: CUSTODY_JOURNAL_CENSUS_VIEW_POLICY.policyVersion,
      display: Object.freeze({
        headline: `Custody journal census: ${replay.ops} ops replayed clean`,
        ops: replay.ops,
        registered,
        consumed,
        distinctPurposes: purposes.size,
        status: 'replayed clean — the census reports MEASURED counts only; TAIL TRUNCATION is not detected by replay (compare the head digest out of band)',
        operatorNote: `Verified against custody journal policy: every line re-parsed against the journal's own hash chain, every op replayed through the 12D-233 registry gates in order, and the rebuilt ledger verified AND matched op-for-op in this view's path. REGISTRATION IS NOT ISSUANCE PROOF — the census authenticates the custody chain's bookkeeping, not the operator; possession of the journal is not authorization (the 12D-233 residual). A journal fed by an impostor records an impostor's ops. TAIL TRUNCATION IS NOT DETECTED BY REPLAY ALONE — a lawful prefix replays as a shorter journal; compare the head digest out of band. This census can never append (its write path refuses) and nothing is activated here. humanDecision: 'REQUIRED' — the shell decides nothing.`,
      }),
    });
  } catch (err) {
    return Object.freeze({
      kind: 'REFUSED' as const,
      policyVersion: CUSTODY_JOURNAL_CENSUS_VIEW_POLICY.policyVersion,
      reason: err instanceof Error ? err.message : String(err),
      display: Object.freeze({
        headline: REFUSAL_HEADLINE,
        bodyText: 'The custody journal submission failed verification and was NOT rendered. Nothing is shown from it — not the journal lines, not the ops, not the genesis, not any count. Diagnostics below are for the operator.',
        operatorNote: 'Refused. Deliver the exact genesis and the untampered journal lines, or inspect the journal in the custody stack.',
      }),
    });
  }
}