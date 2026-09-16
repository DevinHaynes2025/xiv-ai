// 12D-264 — Pathway Ledger: the durable, tamper-evident book of the brain.
// Reviewed pathway candidates (from the pathway-evidence bridge) accumulate
// here as EVIDENCE AWAITING HUMAN REVIEW — nothing is activated, no weight
// mutates, no learning is promoted. The ledger is the honest answer to the
// CEO's "trillions of neural pathways" direction: it holds a CENSUS of
// exactly what has been earned, entry by entry, with a hard per-ledger cap.
// A census can only ever report measured counts and remaining capacity —
// scale beyond what a ledger holds is a design aspiration, never a claim
// (the 2,000,000 rows/database measured ceiling stays the only one).
//
// Rules, structurally enforced:
//   * LEDGERED, NEVER ACTIVATED: only eligibility-true candidates that
//     already carry the operator's RECORDED human approval are appended.
//     The ledger records that approval — it never verifies the approver,
//     never performs an approval, and has NO activation path at all;
//     activation stays a human decision in the custody stack.
//   * TAMPER-EVIDENT: every entry carries its own hash-chained digest over
//     (genesis + prevDigest + canonical candidate JSON) — any tamper
//     refuses the replay. Fail closed, never repaired.
//   * EXACTLY ONCE per (pathwayId, version): re-registration refuses.
//   * BOUNDED: maxEntriesPerLedger is a hard cap; the N+1th entry refuses
//     the WHOLE append (the book never truncates silently). More capacity
//     means more ledgers, never a lie about one.
//   * INJECTED STORE: the same shape as the 12D-236 custody journal —
//     LOCAL plane only, atomic writes are the store's contract.
//
// Disclosed residuals:
//   * A ledger fed by an impostor records an impostor's candidates —
//     ledgering is not proof (the 12D-233 disclosure carries over).
//   * Eligibility is evaluated by the existing 12D-2xx growth-engine gate;
//     the ledger authenticates bookkeeping, not truth of the evidence.
//   * humanDecision: 'REQUIRED', learningPromoted: false, remoteCalls: 0,
//     modelCalls: 0, billionUsersProven: false on every surface.

import { createHash } from 'crypto';
import {
  evaluatePathwayCandidate,
  type NeuralPathwayCandidate,
  type PathwayDomain,
} from './neural-pathway-growth-engine';

export const PATHWAY_LEDGER_POLICY = Object.freeze({
  policyVersion: '12d-264-v1',
  ledgerVersion: 1,
  domain: 'XIV_OS_PATHWAY_LEDGER',
  /** Hard cap per ledger file — more capacity means more ledgers, never a lie. */
  maxEntriesPerLedger: 10_000,
  maxLineChars: 8192,
});

export const PATHWAY_LEDGER_GUARDRAILS = Object.freeze({
  ledgeredNeverActivated: true, // there is no activation path in this module
  tamperEvidentChain: true,
  exactlyOncePerPathwayVersion: true,
  boundedPerLedger: true,
  censusReportsMeasuredCountsOnly: true, // a census can never claim unledgered scale
  localPlaneOnly: true,
  injectedStoreOnly: true,
  modelCalls: 0,
  remoteCalls: 0,
  collectsNothing: true,
  learningPromoted: false,
  automaticRecovery: false,
  billionUsersProven: false,
  humanDecision: 'REQUIRED' as const,
});

/** The injected store contract — a LOCAL book, never a network sink. */
export interface PathwayLedgerStore {
  load(): readonly string[] | null;
  save(lines: readonly string[]): void;
}

export type PathwayLedgerEntry = Readonly<{
  ledgerVersion: 1;
  op: 'CANDIDATE_LEDGERED';
  candidate: Readonly<NeuralPathwayCandidate>;
  entryDigest: string;
}>;

export type PathwayCensus = Readonly<{
  policyVersion: string;
  entries: number;
  capacity: number;
  remainingCapacity: number;
  byDomain: Readonly<Record<PathwayDomain, number>>;
  learningPromoted: false;
  activated: 0;
}>;

const digestOf = (parts: readonly (string | number)[]): string =>
  createHash('sha256').update(parts.join('|')).digest('hex');

const id = (v: unknown): v is string => typeof v === 'string' && /^[A-Za-z0-9_.:-]{1,128}$/.test(v);
const finiteUnit = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v) && v >= 0 && v <= 1;
const DOMAINS: readonly PathwayDomain[] = ['GENERAL', 'CODE', 'ARCHITECTURE', 'SECURITY', 'MEMORY', 'OPERATIONS'];
const CANDIDATE_KEYS = ['pathwayId', 'tenantId', 'domain', 'version', 'parentPathwayId', 'confidence', 'evaluationScore', 'evidenceRefs', 'reviewRefs', 'humanApproved', 'rollbackRef', 'modelWeightMutation', 'productionMutation'] as const;

function parseCandidate(v: unknown): NeuralPathwayCandidate {
  if (v === null || typeof v !== 'object' || Array.isArray(v))
    throw new Error('a pathway candidate object is required; fail closed');
  // Key discipline: every key must be KNOWN, every required key PRESENT,
  // and the order must follow CANDIDATE_KEYS. parentPathwayId alone is
  // optional (JSON.stringify omits undefined optionals; the gate survives
  // its absence without loosening anything else).
  const keys = Object.keys(v as Record<string, unknown>);
  const keySet = new Set<string>(CANDIDATE_KEYS);
  if (keys.some((k) => !keySet.has(k)))
    throw new Error(`a pathway candidate must have exactly the keys [${CANDIDATE_KEYS.join(', ')}] in order; fail closed`);
  const required = CANDIDATE_KEYS.filter((k) => k !== 'parentPathwayId');
  if (!required.every((k) => (keys as readonly string[]).includes(k)))
    throw new Error(`a pathway candidate must have exactly the keys [${CANDIDATE_KEYS.join(', ')}] in order; fail closed`);
  const positions = keys.map((k) => (CANDIDATE_KEYS as readonly string[]).indexOf(k));
  if (!positions.every((p, i) => i === 0 || positions[i - 1]! < p))
    throw new Error(`a pathway candidate must have exactly the keys [${CANDIDATE_KEYS.join(', ')}] in order; fail closed`);
  const c = v as Readonly<Record<string, unknown>>;
  if (!id(c.pathwayId) || !id(c.tenantId)) throw new Error('scoped pathway/tenant identities required; fail closed');
  if (!DOMAINS.includes(c.domain as PathwayDomain)) throw new Error('unknown pathway domain; fail closed');
  if (typeof c.version !== 'number' || !Number.isSafeInteger(c.version) || c.version < 1)
    throw new Error('version must be a safe integer >= 1; fail closed');
  if (c.parentPathwayId !== undefined && !id(c.parentPathwayId))
    throw new Error('invalid parent pathway id; fail closed');
  if (!finiteUnit(c.confidence) || !finiteUnit(c.evaluationScore))
    throw new Error('finite unit confidence/evaluation required; fail closed');
  const refsOk = (arr: unknown): arr is readonly string[] =>
    Array.isArray(arr) && arr.length > 0 && arr.length <= 32
    && arr.every((r) => typeof r === 'string' && r.trim().length > 0 && r.length <= 256);
  if (!refsOk(c.evidenceRefs) || !refsOk(c.reviewRefs))
    throw new Error('bounded evidence and review refs required; fail closed');
  // A ledgered candidate carries the operator's RECORDED human approval
  // (set out-of-band by the operator). The ledger RECORDS that approval —
  // it never VERIFIES who approved (disclosed residual), and it never
  // performs an approval itself: nothing is activated here, ever.
  if (c.humanApproved !== true)
    throw new Error('a ledgered candidate must carry the recorded human approval; the ledger records, never approves; fail closed');
  if (c.modelWeightMutation !== false || c.productionMutation !== false)
    throw new Error('a ledgered candidate never mutates weights or production; fail closed');
  return c as unknown as NeuralPathwayCandidate;
}

const canonical = (c: Readonly<NeuralPathwayCandidate>): string =>
  JSON.stringify(c, [
    'pathwayId', 'tenantId', 'domain', 'version', 'parentPathwayId',
    'confidence', 'evaluationScore', 'evidenceRefs', 'reviewRefs',
    'humanApproved', 'rollbackRef', 'modelWeightMutation', 'productionMutation',
  ]);

/**
 * Ledger ONE reviewed pathway candidate. Requires an eligible candidate
 * (the existing growth-engine gate), a live store, and budget under the
 * hard cap. Exactly once per (pathwayId, version). Refused appends write
 * nothing. Throws on ANY anomaly.
 */
export function appendPathwayCandidate(
  store: PathwayLedgerStore,
  ledgerGenesis: string,
  candidate: unknown,
): Readonly<PathwayLedgerEntry> {
  if (typeof ledgerGenesis !== 'string' || ledgerGenesis.length < 8)
    throw new Error('the ledger genesis must be a string of at least 8 chars; fail closed');
  const c = parseCandidate(candidate);
  const eligibility = evaluatePathwayCandidate(c);
  if (!eligibility.eligible)
    throw new Error(`pathway candidate is not eligible (${eligibility.reasons.join('; ')}); fail closed`);

  const lines = store.load();
  if (lines !== null && lines.length >= PATHWAY_LEDGER_POLICY.maxEntriesPerLedger)
    throw new Error(`the ledger is full (${PATHWAY_LEDGER_POLICY.maxEntriesPerLedger} entries); open a new ledger; fail closed`);
  // Exactly once per (pathwayId, version) — walk the existing chain.
  let prev = ledgerGenesis;
  if (lines) {
    for (const line of lines) {
      const e = parseLedgerLine(line, ledgerGenesis, prev);
      prev = e.entryDigest;
      if (e.candidate.pathwayId === c.pathwayId && e.candidate.version === c.version)
        throw new Error(`pathway ${c.pathwayId} v${c.version} is already ledgered; a candidate is ledgered exactly once; fail closed`);
    }
  }
  const entry: PathwayLedgerEntry = Object.freeze({
    ledgerVersion: 1 as const,
    op: 'CANDIDATE_LEDGERED' as const,
    candidate: Object.freeze({ ...c }),
    entryDigest: digestOf([ledgerGenesis, prev, 'CANDIDATE_LEDGERED', JSON.stringify(c)]),
  });
  const line = JSON.stringify(entry);
  if (line.length > PATHWAY_LEDGER_POLICY.maxLineChars)
    throw new Error(`pathway ledger line exceeds ${PATHWAY_LEDGER_POLICY.maxLineChars} chars; fail closed`);
  store.save([...(lines ?? []), line]);
  return entry;
}

function parseLedgerLine(line: string, ledgerGenesis: string, prev: string): PathwayLedgerEntry {
  if (typeof line !== 'string' || line.length > PATHWAY_LEDGER_POLICY.maxLineChars)
    throw new Error('pathway ledger line malformed or oversized; fail closed');
  let raw: unknown;
  try { raw = JSON.parse(line); } catch { throw new Error('pathway ledger line is not JSON; fail closed'); }
  if (raw === null || typeof raw !== 'object' || Array.isArray(raw))
    throw new Error('pathway ledger line is not an object; fail closed');
  const r = raw as Readonly<Record<string, unknown>>;
  if (r.ledgerVersion !== 1) throw new Error('unknown pathway ledger version; fail closed');
  if (r.op !== 'CANDIDATE_LEDGERED') throw new Error('unknown pathway ledger op; fail closed');
  const candidate = parseCandidate(r.candidate);
  const e: PathwayLedgerEntry = {
    ledgerVersion: 1 as const,
    op: 'CANDIDATE_LEDGERED' as const,
    candidate,
    entryDigest: typeof r.entryDigest === 'string' ? r.entryDigest : '',
  };
  const expect = digestOf([ledgerGenesis, prev, 'CANDIDATE_LEDGERED', JSON.stringify(candidate)]);
  if (e.entryDigest !== expect)
    throw new Error('pathway ledger digest mismatch — the ledger has been tampered with; fail closed');
  return Object.freeze(e);
}

/**
 * Replay the ledger, verifying every link, and return the honest census:
   exactly what the book holds, with the hard cap and remaining capacity.
   Any anomaly refuses the load — a tampered ledger is never repaired.
 */
export function replayPathwayCensus(
  store: PathwayLedgerStore,
  ledgerGenesis: string,
): Readonly<PathwayCensus> {
  if (typeof ledgerGenesis !== 'string' || ledgerGenesis.length < 8)
    throw new Error('the ledger genesis must be a string of at least 8 chars; fail closed');
  const lines = store.load();
  if (!lines) throw new Error('no pathway ledger found; fail closed');
  let prev = ledgerGenesis;
  const byDomain = Object.fromEntries(DOMAINS.map((d) => [d, 0])) as Record<PathwayDomain, number>;
  for (const line of lines) {
    const e = parseLedgerLine(line, ledgerGenesis, prev);
    prev = e.entryDigest;
    byDomain[e.candidate.domain] += 1;
  }
  return Object.freeze({
    policyVersion: PATHWAY_LEDGER_POLICY.policyVersion,
    entries: lines.length,
    capacity: PATHWAY_LEDGER_POLICY.maxEntriesPerLedger,
    remainingCapacity: PATHWAY_LEDGER_POLICY.maxEntriesPerLedger - lines.length,
    byDomain: Object.freeze(byDomain),
    learningPromoted: false as const,
    activated: 0 as const,
  });
}