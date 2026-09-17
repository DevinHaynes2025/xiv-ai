// 12D-293 — Reading Register Census View Model: the fail-closed
// rendering contract that turns a reading-source-register submission
// (register genesis + register lines) into the story shell's window
// into the 12D-276 register census: WHAT is registered as public
// reading sources, by class, with capacity measured.
//
// The UI NEVER sees raw register lines: it renders ONLY the frozen view
// model this module returns. The whole submission is re-verified through
// the REAL 12D-276 contracts — readSourceRegisterEntries (the same
// chain walk the binding contract uses; tampered bytes refuse here
// exactly as they refuse at the binding door) and
// replaySourceRegisterCensus (the measured census) — before a single
// record renders. Any anomaly refuses the WHOLE submission with ZERO
// register content.
//
// Rules, structurally enforced:
//   * REGISTERED IS NOT READ: the census's sourcesRead field is pinned
//     0 BY THE REGISTER CONTRACT itself — the register never tracks
//     reads; measured reads live in the queue and the 12D-285 draft
//     receipts. The view renders that field honestly and its operator
//     note says exactly that.
//   * MEASURED COUNTS ONLY: entries, capacity, remainingCapacity,
//     byClass — from the REAL census, never embellished.
//   * HEAD DIGEST DISCLOSED: the register's own disclosed residual (a
//     lawful TAIL truncation replays clean as a shorter register) is
//     pinned in the render WITH the chain head digest — the operator
//     compares it out of band to detect truncation.
//   * NO WRITE PATH: the view reads the submitted lines through a
//     transient store whose save refuses — a census view can never
//     append to a register.
//   * NO TRUNCATION: every verified record renders (the register's own
//     10,000-entry cap bounds any lawful register).
//   * PURE: no fs, no network, no clock, no randomness. modelCalls: 0,
//     remoteCalls: 0.
import { readSourceRegisterEntries, replaySourceRegisterCensus } from './xiv-reading-source-register';
import type { ReadingSourceStore, ReadingSourceEntry } from './xiv-reading-source-register';

export const READING_REGISTER_CENSUS_VIEW_MODEL_POLICY = Object.freeze({
  policyVersion: '12d-293-v1',
  domain: 'XIV_OS_READING_REGISTER_CENSUS_VIEW_MODEL',
});

export const READING_REGISTER_CENSUS_VIEW_MODEL_GUARDRAILS = Object.freeze({
  verifyBeforeRender: true, // the REAL 12D-276 chain walk + census first
  registeredIsNotRead: true, // the census's sourcesRead is the REGISTER's field
  measuredCountsOnly: true,
  noWritePath: true, // the view's store save() refuses — never appends
  noActivationPath: true, // the view renders; it never reads or activates anything
  noTruncation: true,
  headDigestDisclosedForOutOfBandComparison: true,
  refusedRendersAsRefused: true, // never an empty success
  pureModule: true,
  modelCalls: 0,
  remoteCalls: 0,
  collectsNothing: true,
  learningPromoted: false,
  activated: 0,
  automaticRecovery: false,
  billionUsersProven: false,
  humanDecision: 'REQUIRED' as const,
});

const INPUT_KEYS = ['registerGenesis', 'lines'] as const;

export type RegisterCensusViewModel =
  | Readonly<{
      kind: 'VERIFIED_REGISTER_CENSUS';
      policyVersion: string;
      display: Readonly<{
        headline: string;
        entries: number;
        capacity: number;
        remainingCapacity: number;
        byClass: Readonly<Record<string, number>>;
        sourcesRead: 0;
        headDigest: string;
        records: readonly Readonly<{
          sourceId: string;
          sourceClass: string;
          sourceUrl: string;
          licenseNote: string;
          entryDigest: string;
        }>[];
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

const REFUSAL_HEADLINE = 'Reading register census refused — HUMAN DECISION REQUIRED';

/**
 * A transient read-only store: the view reads the SUBMITTED lines and can
 * never write — save() refuses unconditionally, so a census view has no
 * append path by construction.
 */
class CensusViewStore implements ReadingSourceStore {
  constructor(private readonly lines: readonly string[]) {}
  load(): readonly string[] | null { return this.lines; }
  save(): void { throw new Error('a reading register census view never writes to a register; fail closed'); }
}

const toRecord = (e: ReadingSourceEntry) => ({
  sourceId: e.sourceId,
  sourceClass: e.sourceClass,
  sourceUrl: e.sourceUrl,
  licenseNote: e.licenseNote,
  entryDigest: e.entryDigest,
});

/**
 * The only door from raw register material to the UI. Accepts ANY
 * unknown value; returns a frozen view model that is either a fully
 * verified census or an honest refusal. Never throws.
 */
export function buildReadingRegisterCensusViewModel(raw: unknown): RegisterCensusViewModel {
  try {
    if (raw === null || typeof raw !== 'object' || Array.isArray(raw))
      throw new Error('a reading register census submission object is required; fail closed');
    const keys = Object.keys(raw as Record<string, unknown>);
    if (keys.length !== INPUT_KEYS.length || !INPUT_KEYS.every((k, i) => keys[i] === k))
      throw new Error(`a reading register census submission must have exactly the keys [${INPUT_KEYS.join(', ')}] in order; fail closed`);
    const s = raw as Readonly<Record<string, unknown>>;
    if (typeof s.registerGenesis !== 'string' || s.registerGenesis.length < 8)
      throw new Error('the register genesis must be a string of at least 8 chars; fail closed');
    if (!Array.isArray(s.lines))
      throw new Error('the register lines must be an array of register lines; fail closed');
    for (const line of s.lines as readonly unknown[]) {
      if (typeof line !== 'string')
        throw new Error('every register line must be a string; fail closed');
    }
    if ((s.lines as readonly string[]).length === 0)
      throw new Error('the register is empty; there is nothing to render and the view never fabricates a zero-entry success; fail closed');
    const store = new CensusViewStore(s.lines as readonly string[]);
    // THE REAL CHAIN, TWICE: the 12D-277 chain walk re-verifies every
    // line's digest against its predecessor (tampered bytes refuse),
    // then the 12D-276 census renders the MEASURED counts.
    const entries = readSourceRegisterEntries(store, s.registerGenesis);
    const census = replaySourceRegisterCensus(store, s.registerGenesis);
    const headDigest = entries[entries.length - 1]!.entryDigest;
    return Object.freeze({
      kind: 'VERIFIED_REGISTER_CENSUS' as const,
      policyVersion: READING_REGISTER_CENSUS_VIEW_MODEL_POLICY.policyVersion,
      display: Object.freeze({
        headline: `Reading register census: ${census.entries} of ${census.capacity} public sources registered — registered is NOT read`,
        entries: census.entries,
        capacity: census.capacity,
        remainingCapacity: census.remainingCapacity,
        byClass: census.byClass,
        sourcesRead: census.sourcesRead,
        headDigest,
        records: entries.map(toRecord),
        status: 'replayed clean — the records show exactly the registered entries; nothing is re-derived beyond the register chain',
        operatorNote: `Verified against the REAL 12D-276 contracts: readSourceRegisterEntries re-parses every line against the register's own hash chain, then replaySourceRegisterCensus renders the measured counts. REGISTERED IS NOT READ: the census's sourcesRead field is pinned 0 by the register contract — reads are measured by the queue and the 12D-285 draft receipts, never by this register. DISCLOSED RESIDUAL: a lawful TAIL truncation of this register would replay clean as a shorter register — compare the head digest (${headDigest.slice(0, 16)}…) out of band to detect it. The view's write path refuses; nothing is appended, nothing is read, nothing is activated here. humanDecision: 'REQUIRED' — the shell decides nothing.`,
      }),
    });
  } catch (err) {
    return Object.freeze({
      kind: 'REFUSED' as const,
      policyVersion: READING_REGISTER_CENSUS_VIEW_MODEL_POLICY.policyVersion,
      reason: err instanceof Error ? err.message : String(err),
      display: Object.freeze({
        headline: REFUSAL_HEADLINE,
        bodyText: 'The register submission failed verification and was NOT rendered. Nothing is shown from it — not the register lines, not the sources, not the genesis, not any count or record. Diagnostics below are for the operator.',
        operatorNote: 'Refused. Deliver the exact register genesis and the untampered register lines, or inspect the register where it is kept.',
      }),
    });
  }
}