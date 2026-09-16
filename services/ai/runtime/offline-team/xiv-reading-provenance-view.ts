// 12D-281 — READING PROVENANCE VIEW (operator-facing, view-only).
//
// The 12D-264 pathway ledger now holds candidates whose evidenceRefs
// carry READING provenance (the 12D-279 refs):
//   reading-source:<sourceId>
//   reading-register-entry-sha256:<sourceEntryDigestSha256>
//   reading-document-sha256:<documentDigestSha256>
// This rung is the operator-facing VIEW over those entries: WHICH
// ledgered pathways trace back, ref by ref, to a registered reading
// source. A ledgered pathway whose evidence carries no reading-source
// ref is counted as an otherEntry — never counted as reading provenance.
//
// THE REAL LEDGER REPLAY DOES THE WORK: the chain is verified by the
// ledger module's own parseLedgerLine links (via the additively
// exported replayPathwayLedgerEntries) — a tampered ledger refuses here
// exactly as it does for the census; the view never re-implements the
// chain and never repairs anything.
//
// VIEW-ONLY: the store is only ever LOADED — save is never called, no
// entry is written, nothing is repaired, nothing activates. The view
// reports MEASURED counts only (the census lesson). Provenance is
// CARRIED, NOT INVENTED: the refs are read from the ledgered
// candidates' own evidenceRefs — the view does not re-verify that a
// register-entry digest still exists in a register (re-derivation
// happened behind the 12D-276/277/278 doors; disclosed residual).
//
// Pure composition: no fs, no network, no clock, no randomness, no
// model calls, database-free (injected store, read-only) — this is the
// module class a shell surface MAY import (the 12D-273 lesson: a
// shell-reachable door over the QUEUE would have been the mistake; a
// read-only view over a verified ledger is not that door).
import { replayPathwayLedgerEntries, PATHWAY_LEDGER_POLICY } from './xiv-pathway-ledger';
import type { PathwayLedgerStore } from './xiv-pathway-ledger';

export const READING_PROVENANCE_VIEW_POLICY = Object.freeze({
  policyVersion: '12d-281-v1',
  domain: 'XIV_OS_READING_PROVENANCE_VIEW',
  /** Bounded view: a full ledger is opened in narrower views, never truncated. */
  maxEntriesInView: 256,
  maxSourceIdChars: 128,
});

export const READING_PROVENANCE_VIEW_GUARDRAILS = Object.freeze({
  viewOnly: true,
  storeLoadOnlyNeverSaved: true,
  realLedgerReplayOnly: true,
  provenanceCarriedNotInvented: true,
  measuredCountsOnly: true,
  shellDatabaseFree: true,
  modelCalls: 0,
  remoteCalls: 0,
  collectsNothing: true,
  learningPromoted: false,
  activated: 0,
  automaticRecovery: false,
  billionUsersProven: false,
  humanDecision: 'REQUIRED' as const,
});

const READING_SOURCE_REF = 'reading-source:';
const READING_REGISTER_REF = 'reading-register-entry-sha256:';
const READING_DOCUMENT_REF = 'reading-document-sha256:';
const HEX64_RE = /^[0-9a-f]{64}$/;

export type ReadingProvenanceRecord = Readonly<{
  pathwayId: string;
  version: number;
  domain: string;
  sourceId: string;
  registerEntryDigestSha256: string;
  documentDigestSha256: string;
  ledgerEntryDigest: string;
}>;

export type ReadingProvenanceViewPacket = Readonly<{
  kind: 'READING_PROVENANCE_VIEW';
  policyVersion: string;
  ledgerPolicyVersion: string;
  ledgerEntries: number;
  readingProvenanceEntries: number;
  otherEntries: number;
  bySource: Readonly<Record<string, number>>;
  records: readonly ReadingProvenanceRecord[];
  modelCalls: 0;
  remoteCalls: 0;
  learningPromoted: false;
  activated: 0;
  humanDecision: 'REQUIRED';
}>;

/**
 * The provenance view's ONLY door: replay the verified pathway ledger
 * and summarize which entries carry reading provenance. Throws on ANY
 * anomaly — fail closed, never truncates (an over-budget view refuses).
 */
export function summarizeReadingProvenance(
  store: unknown,
  ledgerGenesis: unknown,
): ReadingProvenanceViewPacket {
  if (typeof store !== 'object' || store === null || typeof (store as PathwayLedgerStore).load !== 'function')
    throw new Error('a trusted pathway ledger store is required; the view never opens a database; fail closed');
  if (typeof ledgerGenesis !== 'string' || ledgerGenesis.length < 8)
    throw new Error('the ledger genesis must be a string of at least 8 chars; fail closed');
  // THE REAL LEDGER REPLAY IS THE TRUTH — tampered bytes refuse here.
  const entries = replayPathwayLedgerEntries(store as PathwayLedgerStore, ledgerGenesis);
  if (entries.length === 0)
    throw new Error('no pathway ledger found; the view never fabricates a zero-entry success; fail closed');
  if (entries.length > READING_PROVENANCE_VIEW_POLICY.maxEntriesInView)
    throw new Error(`the ledger exceeds ${READING_PROVENANCE_VIEW_POLICY.maxEntriesInView} entries; open a narrower view — the view never truncates; fail closed`);

  const bySource: Record<string, number> = {};
  const records: ReadingProvenanceRecord[] = [];
  let readingProvenanceEntries = 0;
  for (const e of entries) {
    const c = e.candidate;
    // Digest-shaped provenance refs are validated on EVERY entry — a
    // malformed carried digest refuses even when the entry claims no
    // reading provenance.
    const registerDigest = firstDigestRef(c.evidenceRefs, READING_REGISTER_REF);
    const documentDigest = firstDigestRef(c.evidenceRefs, READING_DOCUMENT_REF);
    const sourceRefs = c.evidenceRefs.filter((r) => r.startsWith(READING_SOURCE_REF));
    if (sourceRefs.length === 0) continue; // an otherEntry — never counted as reading provenance
    readingProvenanceEntries += 1;
    // The first ref of each kind is the record's provenance; extra refs
    // stay in the candidate bytes (carried, never invented).
    const sourceId = sourceRefs[0]!.slice(READING_SOURCE_REF.length);
    if (sourceId.length === 0 || sourceId.length > READING_PROVENANCE_VIEW_POLICY.maxSourceIdChars)
      throw new Error('a ledgered reading-source ref carries a malformed source id; fail closed');
    bySource[sourceId] = (bySource[sourceId] ?? 0) + 1;
    records.push(Object.freeze({
      pathwayId: c.pathwayId,
      version: c.version,
      domain: String(c.domain),
      sourceId,
      registerEntryDigestSha256: registerDigest,
      documentDigestSha256: documentDigest,
      ledgerEntryDigest: e.entryDigest,
    }));
  }
  return Object.freeze({
    kind: 'READING_PROVENANCE_VIEW' as const,
    policyVersion: READING_PROVENANCE_VIEW_POLICY.policyVersion,
    ledgerPolicyVersion: PATHWAY_LEDGER_POLICY.policyVersion,
    ledgerEntries: entries.length,
    readingProvenanceEntries,
    otherEntries: entries.length - readingProvenanceEntries,
    bySource: Object.freeze(bySource),
    records: Object.freeze(records),
    modelCalls: 0 as const,
    remoteCalls: 0 as const,
    learningPromoted: false as const,
    activated: 0 as const,
    humanDecision: 'REQUIRED' as const,
  });
}

function firstDigestRef(refs: readonly string[], prefix: string): string {
  const ref = refs.find((r) => r.startsWith(prefix));
  if (ref === undefined) return '';
  const digest = ref.slice(prefix.length);
  if (!HEX64_RE.test(digest))
    throw new Error(`a ledgered ${prefix} ref carries a malformed digest; fail closed`);
  return digest;
}