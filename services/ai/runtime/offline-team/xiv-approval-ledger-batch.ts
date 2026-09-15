// 12D-251 — Approval Ledger Batch Summary: batch mode over a LOCAL directory
// of decision records, on top of the 12D-249 read-only summary. The operator
// holds many decision records as JSON files; this summarizes ALL of them in
// one replay-gated, read-only pass, in deterministic (sorted-filename) order.
//
// Fail-closed by construction:
//   * The WHOLE journal replays through the 12D-236 gates FIRST (12D-249
//     replay-before-read carries over verbatim) — a tampered journal, a wrong
//     seed, or a divergent ledger refuses the batch before anything is read.
//   * FAIL CLOSED ON ANY MALFORMED FILE: one malformed JSON file, one
//     non-JSON file, one subdirectory, or one wrong-shape record refuses the
//     WHOLE batch — never a partial summary that silently drops decisions.
//     The refusing file is named in the error.
//   * An EMPTY records directory refuses: a batch over zero records is an
//     operator mistake, not a success with zero findings.
//   * DETERMINISTIC ORDER: records are loaded in sorted-filename order, so
//     the decisions array is byte-stable across runs on the same directory.
//   * READ-ONLY: the journal is never written; the records directory is only
//     ever read. (Asserted by the suite.)
//   * Receipts are re-derived from the loaded records (12D-249 gate); a
//     record the journal does not contain reports registered: false honestly.
//   * humanDecision: 'REQUIRED', learningPromoted: false, remoteCalls: 0,
//     modelCalls: 0, billionUsersProven: false on every surface.
//
// Disclosed residuals:
//   * Only files ending '.json' are accepted, and EVERY file in the directory
//     must be one — a directory with non-record files refuses (the operator
//     points the batch at a directory of records, nothing else).
//   * The summary reflects THIS journal only (12D-249 residual verbatim) —
//     records registered in other journals report registered: false here.
//   * The batch is derived state and proves nothing by itself; journal
//     authenticity remains verifyCustodySession with the operator's seed
//     (out of band).

import { readdirSync, readFileSync } from 'fs';
import { resolve } from 'path';
import {
  summarizeApprovalLedger, type ApprovalLedgerSummary,
} from './xiv-approval-ledger';
import type { ApprovalDecisionRecord } from './xiv-approval-custody';
import type { CustodyJournalStore } from './operator-custody-journal';

export const XIV_APPROVAL_LEDGER_BATCH_POLICY = Object.freeze({
  policyVersion: '12d-251-v1',
  domain: 'XIV_OS_APPROVAL_LEDGER_BATCH',
});

export const XIV_APPROVAL_LEDGER_BATCH_GUARDRAILS = Object.freeze({
  readOnlyNeverWrites: true,
  journalReplayedFailClosedBeforeReading: true,
  malformedFileRefusesWholeBatch: true,
  emptyDirectoryRefuses: true,
  deterministicFilenameOrder: true,
  localDirectoryOnly: true,
  receiptsReDerivedFromHeldRecords: true,
  secretsNeverEnter: true,
  zeroModelCalls: true,
  zeroRemoteCalls: true,
  collectsNothing: true,
  learningPromoted: false,
  automaticRecovery: false, // one bad file stops the batch; a human decides
  billionUsersProven: false,
  humanDecision: 'REQUIRED' as const,
});

const BATCH_OPTS_KEYS = ['store', 'seed', 'recordsDir'] as const;

/**
 * Summarize a WHOLE directory of decision records in one pass: the journal
 * replays fail-closed first, then every '.json' file in sorted-filename
 * order is loaded and shape-gated — any anomaly refuses the WHOLE batch.
 * READ-ONLY: the journal and the directory are never written.
 */
export function summarizeApprovalLedgerBatch(opts: Readonly<{
  store: CustodyJournalStore;
  seed: string;
  recordsDir: string;
}>): Readonly<ApprovalLedgerSummary> {
  if (!opts || typeof opts !== 'object' || Array.isArray(opts))
    throw new Error('summarizeApprovalLedgerBatch expects an options object; fail closed');
  const keys = Object.keys(opts);
  if (keys.length !== BATCH_OPTS_KEYS.length || !BATCH_OPTS_KEYS.every((k, i) => keys[i] === k))
    throw new Error(`summarizeApprovalLedgerBatch options must have exactly the keys [${BATCH_OPTS_KEYS.join(', ')}] in order; fail closed`);
  if (typeof opts.recordsDir !== 'string' || opts.recordsDir.length === 0)
    throw new Error('recordsDir must be a non-empty local path; fail closed');

  // Phase 1: the journal replay gate (throws before the directory is read).
  const dir = resolve(opts.recordsDir);
  let entries: readonly string[];
  try {
    entries = readdirSync(dir);
  } catch {
    throw new Error('failed to read the records directory; fail closed');
  }
  if (entries.length === 0)
    throw new Error('the records directory is empty — a batch over zero records refuses; fail closed');
  // Every entry must be a .json file: a subdirectory or a non-record file
  // refuses BY NAME — the operator points the batch at records, nothing else.
  const sorted = [...entries].sort();
  const recordFiles = sorted.filter((f) => f.endsWith('.json'));
  if (recordFiles.length !== sorted.length) {
    const offenders = sorted.filter((f) => !f.endsWith('.json'));
    throw new Error(`non-record entries in the records directory: ${offenders.join(', ')}; every file must be a .json decision record; fail closed`);
  }

  // Load EVERY record fail-closed — one malformed file refuses the whole batch.
  const records = recordFiles.map((f) => {
    let parsed: unknown;
    try {
      parsed = JSON.parse(readFileSync(resolve(dir, f), 'utf8'));
    } catch {
      throw new Error(`failed to parse batch record file ${f}; fail closed`);
    }
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed))
      throw new Error(`batch record file ${f} must be one JSON object; fail closed`);
    return parsed as unknown as ApprovalDecisionRecord;
  });

  // The 12D-249 gate: one pass, every record shape-gated, receipts
  // re-derived, absence reported honestly. Deterministic filename order.
  return summarizeApprovalLedger({ store: opts.store, seed: opts.seed, records });
}