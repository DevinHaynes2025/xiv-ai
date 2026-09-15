// 12D-252 — Approval Ledger Batch CLI: the human adoption layer for the
// 12D-251 batch summary, in the 12D-238/12D-250 pattern. One explicit action
// per invocation, operator-invoked, non-daemonic, LOCAL plane only. The
// operator hands it a custody journal, the custody seed, and ONE directory of
// decision records; it replays the journal fail-closed (12D-251) and prints
// the batch summary as a frozen JSON packet.
//
//   node xiv-approval-ledger-batch.cli.ts --journal=<path> --seed=<seed> --records-dir=<path>
//
// Fail-closed by construction (12D-250 discipline carries over verbatim):
//   * Strict args: `--key=value` only, no duplicates, NO unknown keys, and
//     only the FIRST '=' splits a key from its value.
//   * The records directory is read strictly from LOCAL disk — never
//     fetched, never sent. Any malformed entry refuses the WHOLE batch by
//     name (12D-251); an empty or missing directory refuses.
//   * The CLI NEVER writes: no journal mutation, no receipt generation, no
//     randomness, no key material. It is a reader; the custody stack writes.
//   * Every packet carries the honest flags; a failure prints an error
//     packet to stderr and exits 2 — never a silent success.
//
// Disclosed residuals carry over verbatim from 12D-233/236/249/251:
// possession of the journal + seed is full custody control; registration is
// not issuance proof; the summary reflects THIS journal only; every file in
// the records directory must be a .json decision record. Nothing remote is
// called — ever.

import { pathToFileURL } from 'url';
import { resolve } from 'path';
import {
  summarizeApprovalLedgerBatch,
  XIV_APPROVAL_LEDGER_BATCH_POLICY,
} from './xiv-approval-ledger-batch';
import { type ApprovalLedgerSummary } from './xiv-approval-ledger';
import { FileCustodyJournalStore } from './operator-custody-journal';

export const APPROVAL_LEDGER_BATCH_CLI_POLICY = Object.freeze({
  policyVersion: '12d-252-v1',
  domain: 'XIV_OS_APPROVAL_LEDGER_BATCH_CLI',
  keys: ['journal', 'seed', 'records-dir'] as const,
});

export const APPROVAL_LEDGER_BATCH_CLI_HONEST_FLAGS = Object.freeze({
  humanDecision: 'REQUIRED' as const,
  remoteCalls: 0,
  modelCalls: 0,
  learningPromoted: false,
  automaticRecovery: false,
  readOnlyNeverWrites: true,
  billionUsersProven: false,
  ciStatusClaimed: 'not claimed' as const,
});

/** Strict arg parsing: `--key=value` only, known keys only, no duplicates. */
export function parseApprovalLedgerBatchCliArgs(
  argv: readonly string[],
): Readonly<Record<string, string>> {
  const out: Record<string, string> = {};
  for (const a of argv) {
    if (!a.startsWith('--')) throw new Error(`argument ${JSON.stringify(a)} must be --key=value; fail closed`);
    const eq = a.indexOf('=');
    if (eq < 3) throw new Error(`argument ${JSON.stringify(a)} must be --key=value; fail closed`);
    const key = a.slice(2, eq);
    if (!/^[A-Za-z0-9-]{1,64}$/.test(key))
      throw new Error(`argument name ${JSON.stringify(key)} is malformed; fail closed`);
    if (key in out) throw new Error(`duplicate argument --${key}; fail closed`);
    if (!(APPROVAL_LEDGER_BATCH_CLI_POLICY.keys as readonly string[]).includes(key))
      throw new Error(`unknown argument --${key}; use only ${APPROVAL_LEDGER_BATCH_CLI_POLICY.keys.join(' | ')}`);
    out[key] = a.slice(eq + 1); // only the FIRST '=' splits — values may contain '='
  }
  return Object.freeze(out);
}

const req = (args: Readonly<Record<string, string>>, name: string): string => {
  const v = args[name];
  if (typeof v !== 'string' || v.length === 0)
    throw new Error(`missing required argument --${name}; fail closed`);
  return v;
};

/**
 * The batch CLI's self-check: re-derive the whole batch summary from the
 * same inputs and compare bytes — a summary that does not re-derive from a
 * fresh replay never reaches the operator.
 */
function verifyBatchSummary(
  summary: Readonly<ApprovalLedgerSummary>,
  opts: Readonly<{ journalPath: string; seed: string; recordsDir: string }>,
): Readonly<{ ok: true; policyVersion: string }> {
  const reDerived = summarizeApprovalLedgerBatch({
    store: new FileCustodyJournalStore(resolve(opts.journalPath)),
    seed: opts.seed,
    recordsDir: opts.recordsDir,
  });
  if (JSON.stringify(reDerived) !== JSON.stringify(summary))
    throw new Error('approval ledger batch summary mismatch — tampered, foreign, or stale; fail closed');
  return Object.freeze({ ok: true, policyVersion: XIV_APPROVAL_LEDGER_BATCH_POLICY.policyVersion });
}

/**
 * Run one CLI invocation. Reads the journal and the records directory;
 * writes nothing. Throws on any refusal — mainApprovalLedgerBatchCli turns
 * that into the error packet.
 */
export function runApprovalLedgerBatchCli(argv: readonly string[]): Readonly<{
  schemaVersion: 1;
  policyVersion: string;
  action: 'summarize-batch';
  flags: typeof APPROVAL_LEDGER_BATCH_CLI_HONEST_FLAGS;
  result: Readonly<ApprovalLedgerSummary>;
}> {
  const args = parseApprovalLedgerBatchCliArgs(argv);
  // Each required key refuses individually and by name (12D-238 pattern).
  const seed = req(args, 'seed');
  const recordsDir = req(args, 'records-dir');
  const journalPath = req(args, 'journal');

  // 12D-251 gate: replays the WHOLE journal through the fail-closed checks
  // before anything is reported; every record in the directory is
  // shape-gated and its receipt re-derived, never accepted as a claim.
  const summary = summarizeApprovalLedgerBatch({
    store: new FileCustodyJournalStore(resolve(journalPath)),
    seed,
    recordsDir,
  });
  // The CLI re-verifies its own output (a fresh replay + byte comparison)
  // before handing it to the operator.
  verifyBatchSummary(summary, { journalPath, seed, recordsDir });

  return Object.freeze({
    schemaVersion: 1 as const,
    policyVersion: APPROVAL_LEDGER_BATCH_CLI_POLICY.policyVersion,
    action: 'summarize-batch' as const,
    flags: APPROVAL_LEDGER_BATCH_CLI_HONEST_FLAGS,
    result: summary,
  });
}

/** The daemon-free entrypoint: one packet, exit 2 on refusal. */
export function mainApprovalLedgerBatchCli(argv: readonly string[]): void {
  try {
    const packet = runApprovalLedgerBatchCli(argv);
    process.stdout.write(`${JSON.stringify(packet, null, 2)}\n`);
  } catch (err) {
    process.stderr.write(`${JSON.stringify({
      schemaVersion: 1, policyVersion: APPROVAL_LEDGER_BATCH_CLI_POLICY.policyVersion,
      ok: false, error: err instanceof Error ? err.message : String(err),
      flags: APPROVAL_LEDGER_BATCH_CLI_HONEST_FLAGS,
    }, null, 2)}\n`);
    process.exitCode = 2;
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  mainApprovalLedgerBatchCli(process.argv.slice(2).filter((a): a is string => typeof a === 'string'));
}