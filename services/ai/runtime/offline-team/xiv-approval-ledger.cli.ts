// 12D-250 — Approval Ledger CLI: the human adoption layer for 12D-249, in the
// 12D-238 pattern. One explicit action per invocation, operator-invoked,
// non-daemonic, LOCAL plane only. The operator hands it a custody journal, the
// custody seed, and ONE decision record file; it replays the journal fail-closed
// (12D-249) and prints the exact registration and verification status of that
// decision as a frozen JSON packet.
//
//   node xiv-approval-ledger.cli.ts --journal=<path> --seed=<seed> --decision-record=<path>
//
// Fail-closed by construction:
//   * Strict args: `--key=value` only, no duplicates, NO unknown keys (the
//     12D-249 exact-keys discipline applied to the CLI surface — a smuggled
//     or typo'd flag refuses rather than being ignored). Values may contain
//     '=' (only the first '=' splits a key from its value, so Windows paths
//     with '=' survive verbatim).
//   * The decision record is read strictly from LOCAL disk — the CLI never
//     fetches, never sends, never accepts a record from anywhere else. Its
//     exact shape is enforced by the 12D-249 gate (exactly [packetId, storyId,
//     decision, decidedBy, decidedAtMs] in order); a malformed file refuses.
//   * The CLI NEVER writes: no journal mutation, no receipt generation, no
//     randomness, no key material. It is a reader; the custody stack writes.
//   * Every packet carries the honest flags; a failure prints an error packet
//     to stderr and exits 2 — never a silent success, never a partial summary.
//
// Disclosed residuals carry over verbatim from 12D-233/236/249: possession of
// the journal + seed is full custody control; registration is not issuance
// proof; the summary reflects THIS journal only (single-writer per file);
// authentication is the chain's, not the operator's identity. Nothing remote
// is called — ever.

import { pathToFileURL } from 'url';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import {
  summarizeApprovalLedger, verifyApprovalLedgerSummary,
  type ApprovalLedgerSummary,
} from './xiv-approval-ledger';
import { type ApprovalDecisionRecord } from './xiv-approval-custody';
import { FileCustodyJournalStore } from './operator-custody-journal';

export const APPROVAL_LEDGER_CLI_POLICY = Object.freeze({
  policyVersion: '12d-250-v1',
  domain: 'XIV_OS_APPROVAL_LEDGER_CLI',
  keys: ['journal', 'seed', 'decision-record'] as const,
});

export const APPROVAL_LEDGER_CLI_HONEST_FLAGS = Object.freeze({
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
export function parseApprovalLedgerCliArgs(
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
    if (!(APPROVAL_LEDGER_CLI_POLICY.keys as readonly string[]).includes(key))
      throw new Error(`unknown argument --${key}; use only ${APPROVAL_LEDGER_CLI_POLICY.keys.join(' | ')}`);
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

/** Read + shape-gate ONE decision record from local disk. Never remote. */
function readDecisionRecord(rawPath: string): Readonly<Record<string, unknown>> {
  let parsed: unknown;
  try {
    parsed = JSON.parse(readFileSync(resolve(rawPath), 'utf8'));
  } catch {
    throw new Error('failed to parse decision record; fail closed');
  }
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed))
    throw new Error('a decision record file must be one JSON object; fail closed');
  return parsed as Record<string, unknown>;
}

/**
 * Run one CLI invocation. Reads the journal and the record; writes nothing.
 * Throws on any refusal — mainApprovalLedgerCli turns that into the error packet.
 */
export function runApprovalLedgerCli(argv: readonly string[]): Readonly<{
  schemaVersion: 1;
  policyVersion: string;
  action: 'summarize';
  flags: typeof APPROVAL_LEDGER_CLI_HONEST_FLAGS;
  result: Readonly<ApprovalLedgerSummary>;
}> {
  const args = parseApprovalLedgerCliArgs(argv);
  // Each required key refuses individually and by name (12D-238 pattern) —
  // never a blanket message that hides WHICH argument was wrong.
  const seed = req(args, 'seed');
  const recordPath = req(args, 'decision-record');
  const decisionRecord = readDecisionRecord(recordPath);
  const store = new FileCustodyJournalStore(resolve(req(args, 'journal')));

  // 12D-249 gate: replays the WHOLE journal through the fail-closed checks
  // before anything is reported; the record's receipt is re-derived, never
  // accepted as a claim. Read-only by construction. The record's type is
  // asserted only through the runtime gate below (summarizeApprovalLedger
  // re-checks the exact shape and refuses malformed files).
  const record = decisionRecord as unknown as ApprovalDecisionRecord;
  const summary = summarizeApprovalLedger({ store, seed, records: [record] });
  // The CLI re-verifies its own output before handing it to the operator.
  verifyApprovalLedgerSummary(summary, { store, seed, records: [record] });

  return Object.freeze({
    schemaVersion: 1 as const,
    policyVersion: APPROVAL_LEDGER_CLI_POLICY.policyVersion,
    action: 'summarize' as const,
    flags: APPROVAL_LEDGER_CLI_HONEST_FLAGS,
    result: summary,
  });
}

/** The daemon-free entrypoint: one packet, exit 2 on refusal. */
export function mainApprovalLedgerCli(argv: readonly string[]): void {
  try {
    const packet = runApprovalLedgerCli(argv);
    process.stdout.write(`${JSON.stringify(packet, null, 2)}\n`);
  } catch (err) {
    process.stderr.write(`${JSON.stringify({
      schemaVersion: 1, policyVersion: APPROVAL_LEDGER_CLI_POLICY.policyVersion,
      ok: false, error: err instanceof Error ? err.message : String(err),
      flags: APPROVAL_LEDGER_CLI_HONEST_FLAGS,
    }, null, 2)}\n`);
    process.exitCode = 2;
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  mainApprovalLedgerCli(process.argv.slice(2).filter((a): a is string => typeof a === 'string'));
}