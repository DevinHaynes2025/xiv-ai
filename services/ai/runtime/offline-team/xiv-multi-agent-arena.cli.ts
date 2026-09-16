// 12D-256 — Multi-Agent Arena CLI: the operator adoption layer for the
// 12D-253 Consensus Arena, in the 12D-238/12D-250/12D-252 CLI pattern. One
// explicit action per invocation, operator-invoked, non-daemonic, LOCAL
// plane only. The operator hands it ONE debate transcript and ONE packet
// file; it replays the hash chain fail-closed (12D-253), gates the
// consensus, and — only if the gate is AUTHORIZED and the packet fully
// verifies and the judge step binds it — prints the arena receipt as a
// frozen JSON packet.
//
//   node xiv-multi-agent-arena.cli.ts --transcript=<path> --packet=<path>
//
// Fail-closed by construction (12D-252 discipline carries over verbatim):
//   * Strict args: `--key=value` only, no duplicates, NO unknown keys, and
//     only the FIRST '=' splits a key from its value.
//   * Both inputs are read strictly from LOCAL disk, parsed as single JSON
//     objects; anything else refuses.
//   * The CLI NEVER writes: no transcript mutation, no journaling, no
//     randomness, no key material. It is a reader; the custody stack writes.
//   * A tampered transcript, an exhausted debate, an aborted judge, or a
//     non-binding packet refuses — failures print an honest error packet to
//     stderr and exit 2, never a silent success.
//   * An AUTHORIZED verdict means ready for HUMAN REVIEW, never an approval.
//
// Disclosed residuals carry over verbatim from 12D-233/236/253: possession
// of a transcript is not proof a debate happened; the arena authenticates
// the STRUCTURE of consensus, not the honesty of the agents. Nothing remote
// is called — ever.

import { pathToFileURL } from 'url';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import {
  gateConsensus,
  deriveArenaReceipt,
  XIV_MULTI_AGENT_ARENA_POLICY,
  XIV_MULTI_AGENT_ARENA_GUARDRAILS,
  type ArenaTranscript,
} from './xiv-multi-agent-arena';
import { type StoryShellPacket } from './xiv-os-wire-contract';

export const ARENA_CLI_POLICY = Object.freeze({
  policyVersion: '12d-256-v1',
  domain: 'XIV_MULTI_AGENT_ARENA_CLI',
  keys: ['transcript', 'packet'] as const,
});

export const ARENA_CLI_HONEST_FLAGS = Object.freeze({
  humanDecision: 'REQUIRED' as const,
  remoteCalls: 0,
  modelCalls: 0,
  learningPromoted: false,
  automaticRecovery: false,
  readOnlyNeverWrites: true,
  authorizedMeansReadyForHumanReview: true,
  billionUsersProven: false,
  ciStatusClaimed: 'not claimed' as const,
});

/** Strict arg parsing: `--key=value` only, known keys only, no duplicates. */
export function parseArenaCliArgs(
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
    if (!(ARENA_CLI_POLICY.keys as readonly string[]).includes(key))
      throw new Error(`unknown argument --${key}; use only ${ARENA_CLI_POLICY.keys.join(' | ')}`);
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

/** Read one local JSON file; anything but a single JSON object refuses. */
function readJsonObjectFile(path: string, name: string): unknown {
  let raw: string;
  try {
    raw = readFileSync(path, 'utf8');
  } catch {
    throw new Error(`the ${name} file could not be read from local disk: ${path}; fail closed`);
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error(`the ${name} file is not valid JSON; fail closed`);
  }
  if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed))
    throw new Error(`the ${name} file must contain one JSON object; fail closed`);
  return parsed;
}

/**
 * Run one CLI invocation. Reads the transcript and the packet; writes
 * nothing. Throws on any refusal — mainArenaCli turns that into the error
 * packet (exit 2). A transcript that has NOT reached full consensus
 * (exhausted debate, aborted judge, forged history) THROWS here — no
 * verdict packet is printed for a debate that authorized nothing; the
 * error names the gate's reason. A receipt exists only on AUTHORIZED
 * consensus plus a verified, bound packet.
 */
export function runArenaCli(argv: readonly string[]): Readonly<{
  schemaVersion: 1;
  policyVersion: string;
  action: 'arena-verdict';
  flags: typeof ARENA_CLI_HONEST_FLAGS;
  result: Readonly<{
    outcome: 'AUTHORIZED' | 'HUMAN_DECISION_REQUIRED';
    reason: string;
    transcriptDigest: string;
    debateTurnsUsed: number;
    receipt: string | null;
    packetId: string | null;
  }>;
}> {
  const args = parseArenaCliArgs(argv);
  // Each required key refuses individually and by name (12D-238 pattern).
  const transcriptPath = req(args, 'transcript');
  const packetPath = req(args, 'packet');

  const transcript = readJsonObjectFile(resolve(transcriptPath), 'transcript') as unknown as ArenaTranscript;
  const packet = readJsonObjectFile(resolve(packetPath), 'packet') as unknown as StoryShellPacket;

  // 12D-253 gate: full-replay verification refuses ANY anomaly; the gate
  // then reports AUTHORIZED or HUMAN_DECISION_REQUIRED honestly.
  const gate = gateConsensus(transcript);
  const lastAdversary = [...transcript.steps].filter((s) => s.role === 'ADVERSARY').length;

  // A receipt only exists on full consensus with a verified, bound packet —
  // deriveArenaReceipt refuses (and the refusal propagates) otherwise.
  const receipt = deriveArenaReceipt({ transcript, packet });

  return Object.freeze({
    schemaVersion: 1 as const,
    policyVersion: ARENA_CLI_POLICY.policyVersion,
    action: 'arena-verdict' as const,
    flags: ARENA_CLI_HONEST_FLAGS,
    result: Object.freeze({
      outcome: gate.outcome,
      reason: gate.reason,
      transcriptDigest: gate.transcriptDigest,
      debateTurnsUsed: lastAdversary === 0 ? 0 : lastAdversary,
      receipt: receipt.receipt,
      packetId: receipt.packetId,
    }),
  });
}

/** The daemon-free entrypoint: one packet, exit 2 on refusal. */
export function mainArenaCli(argv: readonly string[]): void {
  try {
    const packet = runArenaCli(argv);
    process.stdout.write(`${JSON.stringify(packet, null, 2)}\n`);
  } catch (err) {
    process.stderr.write(`${JSON.stringify({
      schemaVersion: 1, policyVersion: ARENA_CLI_POLICY.policyVersion,
      ok: false, error: err instanceof Error ? err.message : String(err),
      guardrails: XIV_MULTI_AGENT_ARENA_GUARDRAILS,
      maxDebateTurns: XIV_MULTI_AGENT_ARENA_POLICY.maxDebateTurns,
    }, null, 2)}\n`);
    process.exitCode = 2;
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  mainArenaCli(process.argv.slice(2).filter((a): a is string => typeof a === 'string'));
}