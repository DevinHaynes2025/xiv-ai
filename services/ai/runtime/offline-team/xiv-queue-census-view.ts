// 12D-273 — Queue Census View: the fail-closed rendering contract that
// turns a 12D-1xx offline story queue census submission (the pinned queue
// policy + the queue's measured summary) into a display surface for the
// story shell. This is the operator's window into the draft backlog's
// book: "here is EXACTLY what this queue holds, measured, under its
// policy ceiling — and the honest flags are the real ones."
//
// The queue itself is a LOCAL SQLite file; the view is PURE (no fs), so
// the submission carries the queue's OWN measured summary() output plus
// the queue's OWN frozen policy object, and the view re-verifies BOTH
// structurally before a single count renders:
//   * the policy must deep-equal the REAL OFFLINE_QUEUE_POLICY, key for
//     key and value for value — a submission carrying a relaxed ceiling
//     or an auto-steal flag is not this queue's book;
//   * the summary must have exactly the keys summary() produces, in
//     order, with every count row exact-shaped and state-valid;
//   * CROSS-CONSISTENCY: a lease cannot be expired without being held;
//     no count row may be zero; (kind, state) pairs may not repeat; and
//     the measured total can never exceed the policy ceiling — the
//     queue's contract makes every violation impossible to produce.
//
// Rules, structurally enforced:
//   * MEASURED COUNTS ONLY: the render reports what summary() measured —
//     rows by state and kind, the lease fact, and the POLICY ceiling
//     labeled as a ceiling, never as usage. 2,000,000 rows/database is
//     the queue's policy ceiling (proven by the 12D-103 fixture + drill);
//     it is NEVER rendered as achieved scale. `liveAgentCount` is the
//     honest null.
//   * HONEST FLAGS ARE RE-VERIFIED, NEVER TRUSTED: a submission whose
//     `capacityRowsAreUserStories` or `hostWideCoordinationVerified` is
//     true, or whose `liveAgentCount` is a number, is not this queue's
//     book — it refuses.
//   * NO WRITE PATH: the view never touches a queue; it renders.
//   * PURE: no fs, no network, no clock, no randomness. modelCalls: 0,
//     remoteCalls: 0.
//
// Disclosed residuals:
//   * The view re-verifies the STRUCTURE of the measured book, not the
//     SQLite bytes — an operator could paste a summary from a queue
//     other than the one they mean (the same class as every census view:
//     the census renders what was SUBMITTED, honestly measured by the
//     real contract that produced it).
//   * POLICY SNAPSHOT: this module pins a frozen copy of
//     OFFLINE_QUEUE_POLICY rather than importing the queue module — the
//     queue is SQLite-backed, and the story shell must never pull a
//     database dependency into the browser-facing build. The suite
//     proves the snapshot deep-equals the REAL policy, key for key and
//     value for value; if the queue's policy ever changes, the snapshot
//     test refuses — which is exactly when this view must be updated
//     deliberately, by a reviewed change.

/**
 * The PINNED snapshot of the offline queue policy. This module pins a
 * frozen copy rather than importing the queue module — the queue is
 * SQLite-backed, and the story shell must never pull a database
 * dependency into the browser-facing build. The suite proves this
 * snapshot deep-equals the REAL OFFLINE_QUEUE_POLICY, key for key and
 * value for value; if the queue's policy ever changes, the snapshot
 * test refuses — which is exactly when this view must be updated
 * deliberately, by a reviewed change.
 */
export const PINNED_OFFLINE_QUEUE_POLICY = Object.freeze({
  maxRows: 2_000_000, maxBatch: 1000,
  maxPage: 100, maxLeaseMs: 300_000, maxOutstandingLeases: 1,
  networkCalls: false, launchesProcesses: false, plaintextOrdinaryBacklogOnly: true,
  isHostWideLock: false, automaticallyStealsExpiredLeases: false,
});

export const QUEUE_CENSUS_VIEW_POLICY = Object.freeze({
  policyVersion: '12d-273-v1',
  domain: 'XIV_OS_QUEUE_CENSUS_VIEW',
});

export const QUEUE_CENSUS_VIEW_GUARDRAILS = Object.freeze({
  verifyBeforeRender: true, // policy deep-equals the REAL policy; summary exact-shape
  measuredCountsOnly: true, // the ceiling renders as a CEILING, never as usage
  crossConsistencyGates: true, // impossible-in-queue submissions refuse
  honestFlagsReVerifiedNeverTrusted: true,
  noWritePath: true, // the view never touches a queue
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

const INPUT_KEYS = ['policy', 'summary'] as const;
const SUMMARY_KEYS = ['counts', 'leaseHeld', 'leaseExpired', 'liveAgentCount', 'capacityRowsAreUserStories', 'hostWideCoordinationVerified'] as const;
const COUNT_ROW_KEYS = ['kind', 'state', 'count'] as const;
const KINDS = ['PRODUCT_STORY', 'CAPACITY_FIXTURE'] as const;
const STATES = ['READY', 'LEASED', 'AWAITING_REVIEW', 'DONE', 'FAILED'] as const;

export type QueueCensusViewModel =
  | Readonly<{
      kind: 'VERIFIED_QUEUE_CENSUS';
      policyVersion: string;
      display: Readonly<{
        headline: string;
        totalStories: number;
        byState: Readonly<Record<string, number>>;
        byKind: Readonly<Record<string, number>>;
        leaseHeld: boolean;
        leaseExpired: boolean;
        policyCeilingRows: number;
        capacityNote: string;
        liveAgentCount: null;
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

const REFUSAL_HEADLINE = 'Queue census refused — HUMAN DECISION REQUIRED';

/** Deep-equal over JSON-representable values — the policy gate's backbone. */
const deepEqual = (a: unknown, b: unknown): boolean =>
  JSON.stringify(a) === JSON.stringify(b);

/**
 * The only door from raw queue census material to the UI. Accepts ANY
 * unknown value; returns a frozen view model that is either a fully
 * verified measured census or an honest refusal. Never throws.
 */
export function buildQueueCensusViewModel(raw: unknown): QueueCensusViewModel {
  try {
    if (raw === null || typeof raw !== 'object' || Array.isArray(raw))
      throw new Error('a queue census submission object is required; fail closed');
    const keys = Object.keys(raw as Record<string, unknown>);
    if (keys.length !== INPUT_KEYS.length || !INPUT_KEYS.every((k, i) => keys[i] === k))
      throw new Error(`a queue census submission must have exactly the keys [${INPUT_KEYS.join(', ')}] in order; fail closed`);
    const s = raw as Readonly<Record<string, unknown>>;
    // POLICY GATE: the submission must carry the queue's OWN frozen policy —
    // deep-equal to the REAL OFFLINE_QUEUE_POLICY. A relaxed ceiling, an
    // auto-steal flag, or a network allowance is not this queue's book.
    if (!deepEqual(s.policy, PINNED_OFFLINE_QUEUE_POLICY))
      throw new Error('the submission must carry the REAL offline queue policy, unchanged; fail closed');
    // SUMMARY GATE: exactly the keys summary() produces, in order.
    const sum = s.summary;
    if (sum === null || typeof sum !== 'object' || Array.isArray(sum))
      throw new Error('the queue summary must be an object; fail closed');
    const sumKeys = Object.keys(sum as Record<string, unknown>);
    if (sumKeys.length !== SUMMARY_KEYS.length || !SUMMARY_KEYS.every((k, i) => sumKeys[i] === k))
      throw new Error(`the queue summary must have exactly the keys [${SUMMARY_KEYS.join(', ')}] in order; fail closed`);
    const m = sum as Readonly<Record<string, unknown>>;
    if (!Array.isArray(m.counts))
      throw new Error('the queue summary counts must be an array; fail closed');
    const rows: Readonly<{ kind: string; state: string; count: number }>[] = [];
    const seenPairs = new Set<string>();
    let total = 0;
    for (const row of m.counts as readonly unknown[]) {
      if (row === null || typeof row !== 'object' || Array.isArray(row))
        throw new Error('every count row must be an object; fail closed');
      const rowKeys = Object.keys(row as Record<string, unknown>);
      if (rowKeys.length !== COUNT_ROW_KEYS.length || !COUNT_ROW_KEYS.every((k, i) => rowKeys[i] === k))
        throw new Error(`a count row must have exactly the keys [${COUNT_ROW_KEYS.join(', ')}] in order; fail closed`);
      const r = row as Readonly<Record<string, unknown>>;
      if (typeof r.kind !== 'string' || !(KINDS as readonly string[]).includes(r.kind))
        throw new Error('unknown story kind in the queue summary; fail closed');
      if (typeof r.state !== 'string' || !(STATES as readonly string[]).includes(r.state))
        throw new Error('unknown queue state in the queue summary; fail closed');
      if (typeof r.count !== 'number' || !Number.isSafeInteger(r.count) || r.count < 1)
        throw new Error('a GROUP BY count is always a positive integer; fail closed');
      const pair = `${r.kind}|${r.state}`;
      if (seenPairs.has(pair))
        throw new Error('a GROUP BY census cannot repeat a (kind, state) pair; fail closed');
      seenPairs.add(pair);
      rows.push(Object.freeze({ kind: r.kind, state: r.state, count: r.count }));
      total += r.count;
    }
    if (total > PINNED_OFFLINE_QUEUE_POLICY.maxRows)
      throw new Error('the measured total can never exceed the queue policy ceiling; fail closed');
    // CROSS-CONSISTENCY: facts the queue's own contract makes impossible.
    if (typeof m.leaseHeld !== 'boolean')
      throw new Error('the leaseHeld fact must be a boolean; fail closed');
    if (typeof m.leaseExpired !== 'boolean')
      throw new Error('the leaseExpired fact must be a boolean; fail closed');
    if (m.leaseExpired === true && m.leaseHeld !== true)
      throw new Error('a lease cannot be expired when no lease is held; fail closed');
    if (m.liveAgentCount !== null)
      throw new Error('liveAgentCount is the honest null — the queue never claims live agents; fail closed');
    if (m.capacityRowsAreUserStories !== false)
      throw new Error('capacity fixture rows are not user stories — the honest flag stays false; fail closed');
    if (m.hostWideCoordinationVerified !== false)
      throw new Error('host-wide coordination is not verified — the honest flag stays false; fail closed');
    // Measured projections only.
    const byState: Record<string, number> = Object.fromEntries(STATES.map((st) => [st, 0]));
    const byKind: Record<string, number> = Object.fromEntries(KINDS.map((k) => [k, 0]));
    for (const r of rows) {
      byState[r.state] += r.count;
      byKind[r.kind] += r.count;
    }
    return Object.freeze({
      kind: 'VERIFIED_QUEUE_CENSUS' as const,
      policyVersion: QUEUE_CENSUS_VIEW_POLICY.policyVersion,
      display: Object.freeze({
        headline: `Queue census: ${total} measured stories under the ${PINNED_OFFLINE_QUEUE_POLICY.maxRows.toLocaleString('en-US')}-row policy ceiling`,
        totalStories: total,
        byState: Object.freeze(byState),
        byKind: Object.freeze(byKind),
        leaseHeld: m.leaseHeld,
        leaseExpired: m.leaseExpired,
        policyCeilingRows: PINNED_OFFLINE_QUEUE_POLICY.maxRows,
        capacityNote: `the ceiling is the queue's POLICY bound (proven by the 12D-103 synthetic fixture + drill), never achieved usage — ${total} rows are MEASURED`,
        liveAgentCount: null as null,
        operatorNote: `Verified against the REAL offline queue policy, key for key and value for value, and the summary's exact shape with cross-consistency gates (no expired lease without a lease, no zero counts, no repeated (kind, state) pairs, measured total under the ceiling) in this view's path. HONEST FLAGS RE-VERIFIED, NEVER TRUSTED: liveAgentCount stays the honest null, capacity fixture rows are never user stories, host-wide coordination is never claimed. The ceiling is a bound, not an achievement — zero real user stories have ever been claimed. This view never touches a queue (no write path) and nothing is activated here. humanDecision: 'REQUIRED' — the shell decides nothing.`,
      }),
    });
  } catch (err) {
    return Object.freeze({
      kind: 'REFUSED' as const,
      policyVersion: QUEUE_CENSUS_VIEW_POLICY.policyVersion,
      reason: err instanceof Error ? err.message : String(err),
      display: Object.freeze({
        headline: REFUSAL_HEADLINE,
        bodyText: 'The queue census submission failed verification and was NOT rendered. Nothing is shown from it — not the counts, not the policy, not the lease fact. Diagnostics below are for the operator.',
        operatorNote: 'Refused. Deliver the queue\'s own frozen policy object and its own summary() output, unchanged.',
      }),
    });
  }
}