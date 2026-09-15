// 12D-238 — Custody Operator CLI: the human adoption layer for the custody stack
// (12D-233 registry · 12D-236 durable journal · 12D-237 session). One explicit
// action per invocation, operator-invoked, non-daemonic, LOCAL plane only.
//
//   node custody-session.cli.ts --action=open      --journal=<path> --seed=<seed> --mode=bootstrap|resume
//   node custody-session.cli.ts --action=register  --journal=<path> --seed=<seed> --mode=bootstrap|resume
//                                  --receipt-sha256=<64hex> --purpose=<p> --registered-by=<who>
//                                  --issued-at-ms=<int> --registered-at-ms=<int>
//   node custody-session.cli.ts --action=consume   --journal=<path> --seed=<seed> --mode=bootstrap|resume
//                                  --receipt-sha256=<64hex> --purpose=<p> --now-ms=<int>
//   node custody-session.cli.ts --action=show      --journal=<path> --seed=<seed>
//
// Fail-closed by construction:
//   * The CLI NEVER generates receipts — the operator computes the sha256 of
//     the artifact out of band and passes the 64-hex digest; there is no
//     generation flag, no randomness, no key material here.
//   * The mode is EXPLICIT on every mutating action (12D-237 refuses the
//     ambiguous middle; this CLI never picks one for the operator).
//   * Unknown/duplicate/malformed arguments refuse; unknown actions refuse.
//   * Every packet carries the honest flags; a failure prints an error packet
//     to stderr and exits 2 — never a silent success.
//
// Disclosed residuals carry over verbatim from 12D-233/236/237: possession of
// the journal + seed is full custody control; registration is not issuance
// proof; single-writer per journal file. Nothing remote is called — ever.

import { pathToFileURL } from 'url';
import { FileCustodyJournalStore } from './operator-custody-journal';
import { openCustodySession, type CustodySession } from './custody-session';

export const CUSTODY_CLI_POLICY = Object.freeze({
  policyVersion: '12d-238-v1',
  actions: ['open', 'register', 'consume', 'show'] as const,
});

export const CUSTODY_CLI_HONEST_FLAGS = Object.freeze({
  humanDecision: 'REQUIRED' as const,
  remoteCalls: 0,
  modelCalls: 0,
  learningPromoted: false,
  automaticRecovery: false,
  billionUsersProven: false,
  ciStatusClaimed: 'not claimed' as const,
});

const hex64 = (v: string): boolean => /^[0-9a-f]{64}$/.test(v);
const safeInt = (v: string): number => {
  if (!/^-?[0-9]{1,15}$/.test(v)) throw new Error(`timestamp ${JSON.stringify(v)} must be an integer; fail closed`);
  return Number(v);
};

/** Strict arg parsing: `--key=value` only, no duplicates, frozen result. */
export function parseCustodyCliArgs(argv: readonly string[]): Readonly<Record<string, string>> {
  const out: Record<string, string> = {};
  for (const a of argv) {
    if (!a.startsWith('--')) throw new Error(`argument ${JSON.stringify(a)} must be --key=value; fail closed`);
    const eq = a.indexOf('=');
    if (eq < 3) throw new Error(`argument ${JSON.stringify(a)} must be --key=value; fail closed`);
    const key = a.slice(2, eq);
    if (!/^[A-Za-z0-9-]{1,64}$/.test(key)) throw new Error(`argument name ${JSON.stringify(key)} is malformed; fail closed`);
    if (key in out) throw new Error(`duplicate argument --${key}; fail closed`);
    out[key] = a.slice(eq + 1);
  }
  return Object.freeze(out);
}

const req = (args: Readonly<Record<string, string>>, name: string): string => {
  const v = args[name];
  if (typeof v !== 'string' || v.length === 0) throw new Error(`missing required argument --${name}; fail closed`);
  return v;
};

export type CustodyCliPacket = Readonly<Record<string, unknown>>;

/** Open a session for the mutating actions — mode is explicit, never inferred. */
function sessionFor(args: Readonly<Record<string, string>>): CustodySession {
  const mode = req(args, 'mode');
  if (mode !== 'bootstrap' && mode !== 'resume')
    throw new Error("mode must be 'bootstrap' or 'resume'; fail closed");
  return openCustodySession(new FileCustodyJournalStore(req(args, 'journal')), {
    seed: req(args, 'seed'), mode,
  });
}

/** Run one CLI invocation. Pure with respect to the filesystem: throws on any refusal. */
export function runCustodyCli(argv: readonly string[]): CustodyCliPacket {
  const args = parseCustodyCliArgs(argv);
  const action = req(args, 'action');
  if (!(CUSTODY_CLI_POLICY.actions as readonly string[]).includes(action))
    throw new Error(`unknown action ${JSON.stringify(action)}; use ${CUSTODY_CLI_POLICY.actions.join(' | ')}`);

  const base = {
    schemaVersion: 1 as const,
    policyVersion: CUSTODY_CLI_POLICY.policyVersion,
    action,
    flags: CUSTODY_CLI_HONEST_FLAGS,
  };

  if (action === 'open') {
    const session = sessionFor(args);
    return Object.freeze({
      ...base,
      result: {
        ok: true, mode: session.mode, journalOps: session.ops,
        ledgerVerifies: session.registry.verifyLedger().ok,
      },
    });
  }

  if (action === 'register') {
    const session = sessionFor(args);
    const receiptSha256 = req(args, 'receipt-sha256');
    if (!hex64(receiptSha256)) throw new Error('receipt-sha256 must be 64 hex characters; fail closed');
    const issuedAtMs = safeInt(req(args, 'issued-at-ms'));
    const registeredAtMs = safeInt(req(args, 'registered-at-ms'));
    const applied = session.apply('register', {
      receiptSha256,
      purpose: req(args, 'purpose'),
      registeredBy: req(args, 'registered-by'),
      issuedAtMs, registeredAtMs,
    });
    return Object.freeze({
      ...base,
      result: {
        ok: true, mode: session.mode, journalOps: session.ops,
        registered: applied.record,
        disclosure: 'registration is not issuance proof — authenticity is the operator’s out-of-band custody',
      },
    });
  }

  if (action === 'consume') {
    const session = sessionFor(args);
    const receiptSha256 = req(args, 'receipt-sha256');
    if (!hex64(receiptSha256)) throw new Error('receipt-sha256 must be 64 hex characters; fail closed');
    const applied = session.apply('authenticate', {
      receiptSha256, purpose: req(args, 'purpose'), nowMs: safeInt(req(args, 'now-ms')),
    });
    return Object.freeze({
      ...base,
      result: { ok: true, mode: session.mode, journalOps: session.ops, consumed: applied.consumed ?? null },
    });
  }

  // show — resume-only: a journal must exist to be inspected.
  const session = openCustodySession(new FileCustodyJournalStore(req(args, 'journal')), {
    seed: req(args, 'seed'), mode: 'resume',
  });
  return Object.freeze({
    ...base,
    result: {
      ok: true, mode: session.mode, journalOps: session.ops,
      ledgerVerifies: session.registry.verifyLedger().ok,
      note: 'per-receipt state is intentionally not listed; use the seed only inside this process',
    },
  });
}

/** The daemon-free entrypoint: one action, one JSON packet, exit 2 on refusal. */
export function mainCustodyCli(argv: readonly string[]): void {
  try {
    const packet = runCustodyCli(argv);
    process.stdout.write(`${JSON.stringify(packet, null, 2)}\n`);
  } catch (err) {
    process.stderr.write(`${JSON.stringify({
      schemaVersion: 1, policyVersion: CUSTODY_CLI_POLICY.policyVersion,
      ok: false, error: err instanceof Error ? err.message : String(err),
      flags: CUSTODY_CLI_HONEST_FLAGS,
    }, null, 2)}\n`);
    process.exitCode = 2;
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const [, , actionFlag, ...rest] = process.argv;
  mainCustodyCli([actionFlag, ...rest].filter((a): a is string => typeof a === 'string'));
}