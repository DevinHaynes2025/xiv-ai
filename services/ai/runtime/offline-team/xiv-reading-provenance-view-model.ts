// 12D-282 — Reading Provenance View Model: the fail-closed rendering
// contract that turns a pathway-ledger submission (ledger genesis +
// ledger lines) into the story shell's window into 12D-281's provenance
// view: WHICH ledgered pathway candidates trace back, ref by ref, to a
// registered reading source.
//
// The UI NEVER sees raw ledger lines: it renders ONLY the frozen view
// model this module returns. The whole submission is re-verified through
// the REAL 12D-264 ledger replay (the additively exported
// replayPathwayLedgerEntries — the same parseLedgerLine chain walk the
// census uses; tampered bytes refuse here exactly as they refuse for the
// census) and the REAL 12D-281 summarizeReadingProvenance before a
// single record renders. Any anomaly refuses the WHOLE submission with
// ZERO ledger content.
//
// Rules, structurally enforced:
//   * PROVENANCE CARRIED, NOT INVENTED: the records show exactly the
//     refs the ledgered candidates carry (source id + register/document
//     digests + the ledger entry digest); nothing is re-derived or
//     embellished here, and nothing is re-verified beyond the ledger's
//     own chain (the 12D-281 residual, pinned in the operator note).
//   * MEASURED COUNTS ONLY for the summary: ledgerEntries,
//     readingProvenanceEntries, otherEntries, bySource — an empty
//     ledger's count of 0 refuses upstream (the view never fabricates
//     a zero-entry success).
//   * NO WRITE PATH: the view reads the submitted lines through a
//     transient store whose save refuses — a provenance view can never
//     append to a ledger.
//   * BOUNDED: the 12D-281 view budget (256 entries) applies — an
//     over-budget submission refuses; the view never truncates.
//   * PURE: no fs, no network, no clock, no randomness. modelCalls: 0,
//     remoteCalls: 0.
//
// Disclosed residuals (carried from 12D-281, pinned in the render):
//   * the view reads provenance AS CARRIED — it does not re-verify that
//     a register-entry digest still exists in a register or that a
//     document digest matches a live binding; re-derivation happened
//     behind the 12D-276/277/278 doors.
//   * the record carries the FIRST ref of each kind; extra refs stay in
//     the candidate bytes.
import { replayPathwayLedgerEntries } from './xiv-pathway-ledger';
import type { PathwayLedgerStore } from './xiv-pathway-ledger';
import {
  summarizeReadingProvenance,
  READING_PROVENANCE_VIEW_POLICY,
  type ReadingProvenanceRecord,
} from './xiv-reading-provenance-view';

export const READING_PROVENANCE_VIEW_MODEL_POLICY = Object.freeze({
  policyVersion: '12d-282-v1',
  domain: 'XIV_OS_READING_PROVENANCE_VIEW_MODEL',
});

export const READING_PROVENANCE_VIEW_MODEL_GUARDRAILS = Object.freeze({
  verifyBeforeRender: true, // the REAL 12D-264 replay + 12D-281 view first
  provenanceCarriedNotInvented: true,
  measuredCountsOnly: true,
  noWritePath: true, // the view's store save() refuses — never appends
  noActivationPath: true, // the view renders; it never activates anything
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

const INPUT_KEYS = ['ledgerGenesis', 'lines'] as const;

export type ReadingProvenanceViewModel =
  | Readonly<{
      kind: 'VERIFIED_READING_PROVENANCE';
      policyVersion: string;
      display: Readonly<{
        headline: string;
        ledgerEntries: number;
        readingProvenanceEntries: number;
        otherEntries: number;
        bySource: Readonly<Record<string, number>>;
        records: readonly ReadingProvenanceRecord[];
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

const REFUSAL_HEADLINE = 'Reading provenance view refused — HUMAN DECISION REQUIRED';

/**
 * A transient read-only store: the view reads the SUBMITTED lines and can
 * never write — save() refuses unconditionally, so a provenance view has
 * no append path by construction.
 */
class ProvenanceViewStore implements PathwayLedgerStore {
  constructor(private readonly lines: readonly string[]) {}
  load(): readonly string[] | null { return this.lines; }
  save(): void { throw new Error('a reading provenance view never writes to a ledger; fail closed'); }
}

/**
 * The only door from raw pathway-ledger material to the UI. Accepts ANY
 * unknown value; returns a frozen view model that is either a fully
 * verified provenance view or an honest refusal. Never throws.
 */
export function buildReadingProvenanceViewModel(raw: unknown): ReadingProvenanceViewModel {
  try {
    if (raw === null || typeof raw !== 'object' || Array.isArray(raw))
      throw new Error('a reading provenance view submission object is required; fail closed');
    const keys = Object.keys(raw as Record<string, unknown>);
    if (keys.length !== INPUT_KEYS.length || !INPUT_KEYS.every((k, i) => keys[i] === k))
      throw new Error(`a reading provenance view submission must have exactly the keys [${INPUT_KEYS.join(', ')}] in order; fail closed`);
    const s = raw as Readonly<Record<string, unknown>>;
    if (typeof s.ledgerGenesis !== 'string' || s.ledgerGenesis.length < 8)
      throw new Error('the ledger genesis must be a string of at least 8 chars; fail closed');
    if (!Array.isArray(s.lines))
      throw new Error('the ledger lines must be an array of ledger lines; fail closed');
    for (const line of s.lines as readonly unknown[]) {
      if (typeof line !== 'string')
        throw new Error('every ledger line must be a string; fail closed');
    }
    const store = new ProvenanceViewStore(s.lines as readonly string[]);
    // THE REAL CHAIN, TWICE: the 12D-264 replay re-verifies the ledger's
    // own hash chain (tampered bytes refuse), then the 12D-281 view
    // counts and records the reading provenance (bounded, never
    // truncates; carried refs validated on every entry).
    replayPathwayLedgerEntries(store, s.ledgerGenesis);
    const packet = summarizeReadingProvenance(store, s.ledgerGenesis);
    return Object.freeze({
      kind: 'VERIFIED_READING_PROVENANCE' as const,
      policyVersion: READING_PROVENANCE_VIEW_MODEL_POLICY.policyVersion,
      display: Object.freeze({
        headline: `Reading provenance: ${packet.readingProvenanceEntries} of ${packet.ledgerEntries} ledgered candidates trace to a registered reading source`,
        ledgerEntries: packet.ledgerEntries,
        readingProvenanceEntries: packet.readingProvenanceEntries,
        otherEntries: packet.otherEntries,
        bySource: packet.bySource,
        records: packet.records,
        status: 'replayed clean — the records show exactly the provenance refs the ledgered candidates carry; nothing is re-derived beyond the ledger chain',
        operatorNote: `Verified against reading-provenance policy: the 12D-264 ledger replay re-parses every line against the ledger's own hash chain, then the 12D-281 view counts reading provenance (an entry counts ONLY if its own evidenceRefs carry a reading-source: ref) and validates every carried digest ref. PROVENANCE IS CARRIED, NOT RE-PROVEN: the view does not re-verify that a register-entry digest still exists in a register or that a document digest matches a live binding — re-derivation happened behind the 12D-276/277/278 doors; each record carries the FIRST ref of each kind (extra refs stay in the candidate bytes). The view is bounded at ${READING_PROVENANCE_VIEW_POLICY.maxEntriesInView} entries and NEVER truncates — an over-budget ledger refuses. The view's write path refuses; nothing is appended, nothing is activated here. humanDecision: 'REQUIRED' — the shell decides nothing.`,
      }),
    });
  } catch (err) {
    return Object.freeze({
      kind: 'REFUSED' as const,
      policyVersion: READING_PROVENANCE_VIEW_MODEL_POLICY.policyVersion,
      reason: err instanceof Error ? err.message : String(err),
      display: Object.freeze({
        headline: REFUSAL_HEADLINE,
        bodyText: 'The pathway ledger submission failed verification and was NOT rendered. Nothing is shown from it — not the ledger lines, not the candidates, not the genesis, not any count or record. Diagnostics below are for the operator.',
        operatorNote: 'Refused. Deliver the exact ledger genesis and the untampered ledger lines, or inspect the ledger in the pathway stack.',
      }),
    });
  }
}