// 12D-249 — XIV OS Approval Ledger Summary: the operator's READ-ONLY review
// surface over the approval lifecycle (12D-247 record, 12D-248 verify). Given
// the custody journal, the operator's seed, and the decision records the
// operator holds, it reports — honestly, per record — whether the decision is
// REGISTERED in the journal under the fixed purpose 'xiv-os-human-approval',
// and whether its receipt has been AUTHENTICATED (consumed) yet.
//
// Fail-closed by construction:
//   * The WHOLE journal replays through the 12D-236 fail-closed gates BEFORE
//     anything is summarized — a tampered line, a wrong seed, or a divergent
//     ledger refuses the summary outright. The summary never reads a journal
//     the replay has not verified.
//   * READ-ONLY: the store is only ever loaded, never saved. (Asserted by the
//     suite: the journal lines are byte-identical before and after.)
//   * Receipts are RE-DERIVED from the operator-held decision records — never
//     accepted as claims. A record the journal does not contain is reported
//     registered: false — absence is reported honestly, never papered over.
//   * Cross-checks refuse states that cannot come from the honest flow:
//     a register entry whose actor differs from the record's decidedBy, more
//     than one register/authenticate entry for the same receipt, or an
//     authenticate timestamp before the decision — any of them refuses.
//   * A MISSING journal refuses (fail closed on ambiguity) — record-level
//     absence inside an EXISTING journal is reported, journal-level absence
//     is not summarized.
//   * humanDecision: 'REQUIRED', learningPromoted: false, remoteCalls: 0,
//     modelCalls: 0, billionUsersProven: false on every surface.
//
// Disclosed residuals:
//   * The summary reflects THIS journal only — a decision registered in
//     another journal file reports registered: false here. Cross-journal
//     reconciliation is a future story (single-writer discipline, 12D-236).
//   * The summary is derived state: it proves nothing by itself. The durable
//     proofs are the custody journal (tamper-evident) and the runner's
//     evidence packets (12D-244); `verifyApprovalLedgerSummary` re-derives
//     the summary for tamper detection, and journal authenticity remains
//     verifyCustodySession with the operator's seed (out of band).

import {
  deriveApprovalReceipt, XIV_APPROVAL_CUSTODY_POLICY,
  type ApprovalDecisionRecord,
} from './xiv-approval-custody';
import {
  replayCustodyJournal, type CustodyJournalStore,
} from './operator-custody-journal';

export const XIV_APPROVAL_LEDGER_POLICY = Object.freeze({
  policyVersion: '12d-249-v1',
  purpose: XIV_APPROVAL_CUSTODY_POLICY.purpose,
});

export const XIV_APPROVAL_LEDGER_GUARDRAILS = Object.freeze({
  readOnlyNeverWrites: true,
  journalReplayedFailClosedBeforeReading: true,
  receiptsReDerivedFromHeldRecords: true,
  absenceReportedHonestly: true,
  fixedPurposeOnly: true,
  impossibleStatesRefuse: true,
  missingJournalRefuses: true,
  deterministicSummary: true,
  secretsNeverEnter: true,
  zeroModelCalls: true,
  zeroRemoteCalls: true,
  collectsNothing: true,
  learningPromoted: false,
  automaticRecovery: false, // a tampered journal refuses; a human decides
  billionUsersProven: false,
  humanDecision: 'REQUIRED' as const,
});

export interface ApprovalLedgerDecision {
  packetId: string;
  storyId: string;
  decision: 'APPROVED' | 'REJECTED';
  decidedBy: string;
  decidedAtMs: number;
  receiptSha256: string;
  registered: boolean;
  registeredAtMs: number | null;
  verified: boolean;
  verifiedAtMs: number | null;
}

export interface ApprovalLedgerSummary {
  schemaVersion: 1;
  policyVersion: string;
  ledgerVerified: true;
  purpose: string;
  journalOps: number;
  totalApprovalEntries: number;
  decisions: ReadonlyArray<ApprovalLedgerDecision>;
  guardrails: typeof XIV_APPROVAL_LEDGER_GUARDRAILS;
}

const RECORD_KEYS = ['packetId', 'storyId', 'decision', 'decidedBy', 'decidedAtMs'] as const;
const SEED_RE = /^[A-Za-z0-9][A-Za-z0-9_.:-]{7,127}$/;
const SUMMARY_KEYS = ['schemaVersion', 'policyVersion', 'ledgerVerified', 'purpose', 'journalOps', 'totalApprovalEntries', 'decisions', 'guardrails'] as const;

function gateDecisionRecord(record: unknown): Readonly<ApprovalDecisionRecord> {
  if (!record || typeof record !== 'object' || Array.isArray(record))
    throw new Error('an approval decision record is required; fail closed');
  const r = record as Record<string, unknown>;
  const keys = Object.keys(r);
  if (keys.length !== RECORD_KEYS.length || !RECORD_KEYS.every((k, i) => keys[i] === k))
    throw new Error(`a decision record must have exactly the keys [${RECORD_KEYS.join(', ')}] in order; fail closed`);
  if (r.decision !== 'APPROVED' && r.decision !== 'REJECTED')
    throw new Error("a decision record decision must be exactly 'APPROVED' or 'REJECTED'; fail closed");
  if (typeof r.decidedBy !== 'string' || !/^[A-Za-z0-9][A-Za-z0-9_.:-]{0,127}$/.test(r.decidedBy))
    throw new Error('a decision record decidedBy must match the operator id pattern; fail closed');
  if (typeof r.decidedAtMs !== 'number' || !Number.isSafeInteger(r.decidedAtMs) || r.decidedAtMs < 0)
    throw new Error('a decision record decidedAtMs must be a safe non-negative integer; fail closed');
  if (typeof r.packetId !== 'string' || !/^[0-9a-f]{64}$/.test(r.packetId))
    throw new Error('a decision record packetId must be lowercase hex64; fail closed');
  if (typeof r.storyId !== 'string' || r.storyId.length === 0)
    throw new Error('a decision record storyId must be a non-empty string; fail closed');
  return record as Readonly<ApprovalDecisionRecord>;
}

interface ApprovalJournalState {
  journalOps: number;
  registered: Map<string, { registeredAtMs: number; registeredBy: string }>;
  authenticated: Map<string, number>;
  approvalEntries: number;
}

/**
 * Replay-verify the journal, then parse it read-only for the fixed-purpose
 * approval state. Any duplicate register/authenticate entry for one receipt
 * refuses — that state cannot come from the honest chain.
 */
function readApprovalState(store: CustodyJournalStore, seed: string): ApprovalJournalState {
  const { ops } = replayCustodyJournal(store, seed);
  const lines = store.load();
  if (!lines) throw new Error('no custody journal found; fail closed');
  const registered = new Map<string, { registeredAtMs: number; registeredBy: string }>();
  const authenticated = new Map<string, number>();
  let approvalEntries = 0;
  for (const line of lines) {
    let raw: unknown;
    try { raw = JSON.parse(line); } catch {
      throw new Error('custody journal line is not JSON; fail closed');
    }
    if (!raw || typeof raw !== 'object' || Array.isArray(raw))
      throw new Error('custody journal line is not an object; fail closed');
    const e = raw as Record<string, unknown>;
    if (e.journalVersion !== 1 || (e.op !== 'register' && e.op !== 'authenticate'))
      throw new Error('custody journal line malformed; fail closed');
    const input = e.input;
    if (!input || typeof input !== 'object' || Array.isArray(input))
      throw new Error('custody journal op input malformed; fail closed');
    const i = input as Record<string, unknown>;
    if (i.purpose !== XIV_APPROVAL_LEDGER_POLICY.purpose) continue;
    approvalEntries += 1;
    if (typeof i.receiptSha256 !== 'string' || !/^[0-9a-f]{64}$/.test(i.receiptSha256))
      throw new Error('approval journal entry receipt malformed; fail closed');
    if (e.op === 'register') {
      if (registered.has(i.receiptSha256))
        throw new Error('duplicate register entry for one approval receipt — impossible in the honest chain; fail closed');
      registered.set(i.receiptSha256, {
        registeredAtMs: i.registeredAtMs as number,
        registeredBy: i.registeredBy as string,
      });
    } else {
      if (authenticated.has(i.receiptSha256))
        throw new Error('duplicate authenticate entry for one approval receipt — a receipt verifies exactly once; fail closed');
      authenticated.set(i.receiptSha256, i.nowMs as number);
    }
  }
  return { journalOps: ops, registered, authenticated, approvalEntries };
}

/**
 * Summarize the operator's approval ledger: per held decision record, whether
 * it is registered and/or verified in the REPLAY-VERIFIED journal, under the
 * fixed approval purpose. READ-ONLY — the store is never written.
 */
export function summarizeApprovalLedger(opts: Readonly<{
  store: CustodyJournalStore;
  seed: string;
  records: ReadonlyArray<Readonly<ApprovalDecisionRecord>>;
}>): Readonly<ApprovalLedgerSummary> {
  if (!opts || typeof opts !== 'object' || Array.isArray(opts))
    throw new Error('summarizeApprovalLedger expects an options object; fail closed');
  const keys = Object.keys(opts);
  if (keys.length !== 3 || !['store', 'seed', 'records'].every((k, i) => keys[i] === k))
    throw new Error('summarizeApprovalLedger options must have exactly the keys [store, seed, records] in order; fail closed');
  if (typeof opts.seed !== 'string' || !SEED_RE.test(opts.seed))
    throw new Error(`the custody seed must match ${SEED_RE.source}; fail closed`);
  if (!Array.isArray(opts.records))
    throw new Error('records must be an array of decision records; fail closed');

  const state = readApprovalState(opts.store, opts.seed);
  const decisions = opts.records.map((rec) => {
    const record = gateDecisionRecord(rec);
    const receipt = deriveApprovalReceipt(record);
    const reg = state.registered.get(receipt);
    if (reg && reg.registeredBy !== record.decidedBy)
      throw new Error(`the approval receipt was registered by '${reg.registeredBy}' but the record says '${record.decidedBy}' — impossible in the honest chain; fail closed`);
    const verAt = state.authenticated.get(receipt);
    if (reg && reg.registeredAtMs !== record.decidedAtMs)
      throw new Error('the approval receipt registeredAtMs differs from the record decidedAtMs — impossible in the honest chain; fail closed');
    if (verAt !== undefined && verAt < record.decidedAtMs)
      throw new Error('the approval receipt was authenticated before its decision — impossible in the honest chain; fail closed');
    return Object.freeze({
      packetId: record.packetId,
      storyId: record.storyId,
      decision: record.decision,
      decidedBy: record.decidedBy,
      decidedAtMs: record.decidedAtMs,
      receiptSha256: receipt,
      registered: reg !== undefined,
      registeredAtMs: reg ? reg.registeredAtMs : null,
      verified: verAt !== undefined,
      verifiedAtMs: verAt ?? null,
    });
  });

  return Object.freeze({
    schemaVersion: 1 as const,
    policyVersion: XIV_APPROVAL_LEDGER_POLICY.policyVersion,
    ledgerVerified: true as const,
    purpose: XIV_APPROVAL_LEDGER_POLICY.purpose,
    journalOps: state.journalOps,
    totalApprovalEntries: state.approvalEntries,
    decisions: Object.freeze(decisions),
    guardrails: XIV_APPROVAL_LEDGER_GUARDRAILS,
  });
}

/**
 * Re-derive the summary and compare it to the given one — a tampered or
 * foreign summary refuses. The re-derivation runs the same replay gate, so
 * a summary claiming a journal state that no longer replays refuses too.
 */
export function verifyApprovalLedgerSummary(
  summary: Readonly<ApprovalLedgerSummary>,
  opts: Readonly<{
    store: CustodyJournalStore;
    seed: string;
    records: ReadonlyArray<Readonly<ApprovalDecisionRecord>>;
  }>,
): Readonly<{ ok: true; policyVersion: string }> {
  if (!summary || typeof summary !== 'object' || Array.isArray(summary))
    throw new Error('an approval ledger summary is required; fail closed');
  const s = summary as unknown as Record<string, unknown>;
  const actualKeys = Object.keys(s);
  if (actualKeys.length !== SUMMARY_KEYS.length || !SUMMARY_KEYS.every((k, i) => actualKeys[i] === k))
    throw new Error(`an approval ledger summary must have exactly the keys [${SUMMARY_KEYS.join(', ')}] in order; fail closed`);
  if (s.schemaVersion !== 1)
    throw new Error('approval ledger summary schemaVersion must be 1; fail closed');
  if (s.policyVersion !== XIV_APPROVAL_LEDGER_POLICY.policyVersion)
    throw new Error(`approval ledger summary policyVersion must be '${XIV_APPROVAL_LEDGER_POLICY.policyVersion}'; fail closed`);
  if (s.ledgerVerified !== true)
    throw new Error('approval ledger summary ledgerVerified must be pinned true (the summary refuses to emit an unverified view); fail closed');
  if (s.guardrails !== XIV_APPROVAL_LEDGER_GUARDRAILS
    && JSON.stringify(s.guardrails) !== JSON.stringify(XIV_APPROVAL_LEDGER_GUARDRAILS))
    throw new Error('approval ledger summary guardrails must equal the frozen 12D-249 guardrails; fail closed');
  const reDerived = summarizeApprovalLedger(opts);
  if (JSON.stringify(reDerived) !== JSON.stringify(summary))
    throw new Error('approval ledger summary mismatch — tampered, foreign, or stale; fail closed');
  return Object.freeze({ ok: true, policyVersion: XIV_APPROVAL_LEDGER_POLICY.policyVersion });
}