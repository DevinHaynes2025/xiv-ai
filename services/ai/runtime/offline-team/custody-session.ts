// 12D-237 — Custody Session: the operator-facing lifecycle that joins the 12D-233
// custody registry (in-memory, process-local) to the 12D-236 durable journal so
// custody state SURVIVES a process restart under explicit operator control.
//
// It closes the residual 12D-235 disclosed verbatim: "the registry is
// process-local, NOT durable." A session is opened in exactly one of two
// EXPLICIT modes — fail-closed on the ambiguous middle:
//   * bootstrap: allowed ONLY when no journal exists; it creates a fresh
//     OperatorCustodyRegistry from an operator-provided seed (>= 8 chars) and
//     refuses if a custody chain already exists (re-seeding a live chain is
//     never an accident).
//   * resume: requires an existing journal; it is replayed through the
//     12D-236 fail-closed gates with the SAME seed — a wrong seed, a tampered
//     line, an out-of-order op, or a divergent ledger refuses the load. A
//     consumed receipt stays consumed across the restart; an unconsumed one
//     still authenticates.
// There is no "auto" mode: an absent journal without bootstrap:true refuses,
// and an existing journal with bootstrap:true refuses. The caller states intent.
//
// Disclosed residuals, carried verbatim from 12D-233/236:
//   * The seed is re-provided by the operator out of band; possession of
//     journal + seed is full custody control — the session authenticates the
//     CHAIN, not the operator. Registration is not issuance proof.
//   * One process per journal file (single-writer, operator discipline).
//   * humanDecision: 'REQUIRED', learningPromoted: false, remoteCalls: 0,
//     billionUsersProven: false on every surface. It calls nothing remote.

import {
  OperatorCustodyRegistry, type CustodyRecord,
} from './operator-custody-registry';
import {
  appendCustodyOp, replayCustodyJournal, type CustodyJournalOp,
  type CustodyJournalEntry, type CustodyJournalStore, type CustodyConsumption,
} from './operator-custody-journal';

export const CUSTODY_SESSION_POLICY = Object.freeze({
  policyVersion: '12d-237-v1',
  minSeedChars: 8,
});

export const CUSTODY_SESSION_GUARDRAILS = Object.freeze({
  explicitModeOnly: true, // bootstrap | resume; no auto-detected ambiguity
  bootstrapRefusesOverExistingJournal: true,
  resumeRefusesWithoutJournal: true,
  wrongSeedRefuses: true,
  consumedReceiptsStayConsumedAcrossRestarts: true,
  replayRefusesOnAnyAnomaly: true, // carried from 12D-236
  zeroModelCalls: true,
  zeroRemoteCalls: true,
  automaticRecovery: false, // a divergent journal refuses; a human decides
  humanDecision: 'REQUIRED' as const,
});

const SEED_RE = /^[A-Za-z0-9][A-Za-z0-9_.:-]{7,127}$/;

export interface CustodySession {
  /** The live (or replayed) registry — hand this to the execution bridges. */
  readonly registry: OperatorCustodyRegistry;
  /** Which explicit mode opened the session. */
  readonly mode: 'bootstrap' | 'resume';
  /** Ops journaled so far under this session (replayed ops count too). */
  readonly ops: number;
  /** Apply one custody op through the registry first, then journal it (12D-236). */
  apply(op: CustodyJournalOp, input: CustodyJournalEntry['input']): Readonly<{
    entry: CustodyJournalEntry;
    record: Readonly<CustodyRecord>;
    /** Present only when the op consumed a receipt (op === 'authenticate'). */
    consumed?: Readonly<CustodyConsumption>;
  }>;
}

/**
 * Open a custody session. `mode: 'bootstrap'` requires an EMPTY store and
 * creates a fresh registry seeded by `seed`; `mode: 'resume'` requires an
 * existing journal and replays it fail-closed under the same seed. Anything
 * else refuses — never invented state.
 */
export function openCustodySession(
  store: CustodyJournalStore,
  opts: { seed: string; mode: 'bootstrap' | 'resume' },
): CustodySession {
  if (!store || typeof store.load !== 'function' || typeof store.save !== 'function')
    throw new Error('a 12D-236 custody journal store is required; fail closed');
  if (typeof opts?.seed !== 'string' || !SEED_RE.test(opts.seed))
    throw new Error(`the custody seed must match ${SEED_RE.source} (>= ${CUSTODY_SESSION_POLICY.minSeedChars} chars); fail closed`);
  if (opts.mode !== 'bootstrap' && opts.mode !== 'resume')
    throw new Error(`custody session mode must be 'bootstrap' or 'resume'; fail closed`);

  const existing = store.load();
  if (opts.mode === 'bootstrap' && existing) {
    throw new Error('a custody journal already exists; re-seeding a live custody chain is refused; fail closed');
  }
  if (opts.mode === 'resume' && !existing) {
    throw new Error("no custody journal found to resume; pass mode 'bootstrap' explicitly to create one; fail closed");
  }

  if (opts.mode === 'resume') {
    const { registry, ops: replayed } = replayCustodyJournal(store, opts.seed);
    let ops = replayed;
    return Object.freeze({
      registry,
      mode: 'resume' as const,
      get ops() { return ops; },
      apply(op: CustodyJournalOp, input: CustodyJournalEntry['input']) {
        const applied = appendCustodyOp(registry, store, opts.seed, op, input);
        ops += 1;
        return applied;
      },
    });
  }

  // bootstrap: a fresh registry under the operator seed; nothing is journaled
  // yet — the first `apply` writes the first line.
  const registry = new OperatorCustodyRegistry(opts.seed);
  let ops = 0;
  return Object.freeze({
    registry,
    mode: 'bootstrap' as const,
    get ops() { return ops; },
    apply(op: CustodyJournalOp, input: CustodyJournalEntry['input']) {
      const applied = appendCustodyOp(registry, store, opts.seed, op, input);
      ops += 1;
      return applied;
    },
  });
}

/**
 * Read-only health check: the registry ledger verifies AND the journal still
 * replays to an identical op count. A tampered journal refuses here too.
 */
export function verifyCustodySession(
  session: CustodySession,
  store: CustodyJournalStore,
  seed: string,
): Readonly<{ ok: boolean; ops: number }> {
  if (!session || (session.mode !== 'bootstrap' && session.mode !== 'resume'))
    throw new Error('a live custody session is required; fail closed');
  const verdict = session.registry.verifyLedger();
  if (!verdict.ok) throw new Error('the custody ledger failed verification; fail closed');
  // The journal's chain root IS the seed (12D-236 replays with the seed as
  // genesis); the operator re-provides it here, exactly as at open time.
  const { ops } = replayCustodyJournal(store, seed);
  if (ops !== session.ops)
    throw new Error('the journal and the session disagree on op count; fail closed');
  return Object.freeze({ ok: true, ops });
}