// 12D-364 — OS Status CLI: the backend half of the frontend+backend
// status rung. Reads a REAL OfflineStoryQueue (read-only), measures
// its own census through the queue's own summary() door, and emits
// ONE honest status packet for the OS frontend to render. It decides
// nothing, applies nothing, and never fabricates counts: what it
// prints is what the queue reports.
//
//   node xiv-os-status.cli.ts --queue=<path> --tenant=<id>
//
// Fail-closed by construction:
//   * Exactly the two flags, each exactly once, each with a value;
//     unknown/duplicate/missing flags refuse. NO --apply, NO
//     --decision, NO --out: a status CLI that could mutate would not
//     be a status CLI.
//   * A MISSING queue file refuses BEFORE the queue is opened — the
//     CLI never creates a queue by accident.
//   * The queue is opened, summarized, and closed — no write
//     primitive exists on this path.
//   * Honest flags are PINNED in the packet, not parameterized:
//     humanDecision REQUIRED, learningPromoted false, activated 0,
//     collectsNothing true, automaticRecovery false,
//     billionUsersProven false — and the measured ceiling
//     (2,000,000 rows/database) is stated as the ONLY measured
//     ceiling; trillion/billion scale is VISION, never packet truth.
//   * LOCAL I/O only: modelCalls 0, no network primitive,
//     remoteCalls 0.
import { existsSync } from 'node:fs';
import { pathToFileURL } from 'url';
import { OfflineStoryQueue } from './offline-story-queue';

export const OS_STATUS_CLI_POLICY = Object.freeze({
  policyVersion: '12d-364-v1',
  domain: 'XIV_OS_STATUS_CLI',
  flagOrder: ['--queue', '--tenant'] as const,
});

export const OS_STATUS_CLI_GUARDRAILS = Object.freeze({
  readOnly: true, // the queue is opened, summarized, never written
  missingQueueFileRefuses: true, // the CLI never creates a queue by accident
  honestFlagsPinned: true,
  localIoOnly: true,
  noModelCallEver: true,
  noNetworkPrimitive: true,
  remoteCalls: 0,
  modelCalls: 0,
  refusedWithExitTwo: true,
  printsPacketsVerbatim: true,
  collectsNothing: true,
  learningPromoted: false,
  activated: 0,
  automaticRecovery: false,
  billionUsersProven: false,
  humanDecision: 'REQUIRED' as const,
});

const ID_RE = /^[A-Za-z0-9][A-Za-z0-9_.:-]{0,127}$/;

export type OsStatusArgs = Readonly<{
  queue: string;
  tenant: string;
}>;

/** Strict arg parsing: exactly the two flags, each once, each valued. */
export function parseOsStatusArgs(argv: readonly string[]): OsStatusArgs {
  if (argv.length !== OS_STATUS_CLI_POLICY.flagOrder.length * 2)
    throw new Error(`expected exactly ${OS_STATUS_CLI_POLICY.flagOrder.length} flags each with a value (${OS_STATUS_CLI_POLICY.flagOrder.join(' ')}); fail closed`);
  const seen = new Map<string, string>();
  for (let i = 0; i < argv.length; i += 2) {
    const flag = argv[i]!;
    const value = argv[i + 1];
    if (!(OS_STATUS_CLI_POLICY.flagOrder as readonly string[]).includes(flag))
      throw new Error(`unknown flag ${flag}; use only ${OS_STATUS_CLI_POLICY.flagOrder.join(' ')}; fail closed`);
    if (typeof value !== 'string' || value.length === 0)
      throw new Error(`flag ${flag} requires a value; fail closed`);
    if (seen.has(flag))
      throw new Error(`duplicate flag ${flag}; fail closed`);
    seen.set(flag, value);
  }
  const queue = seen.get('--queue')!;
  const tenant = seen.get('--tenant')!;
  if (!ID_RE.test(tenant)) throw new Error('the tenant id is malformed (<= 128 chars: letters, digits, _ . : -); fail closed');
  return Object.freeze({ queue, tenant });
}

export type OsStatusPacket = Readonly<{
  kind: 'OS_STATUS_PACKET';
  policyVersion: string;
  tenantId: string;
  measuredAtMs: number;
  counts: readonly { kind: string; state: string; count: number }[];
  leaseHeld: boolean;
  leaseExpired: boolean;
  liveAgentCount: null;
  ceiling: Readonly<{
    rowsPerDatabase: 2000000;
    scope: 'measured';
    note: '2,000,000 rows/database is the ONLY measured ceiling; trillion/billion/infinite scale is VISION, never packet truth';
  }>;
  reviewPath: Readonly<{
    state: 'the drafts below AWAITING_REVIEW are the reviewer\'s to decide';
    nextSteps: readonly string[];
  }>;
  queueNeverWritten: true;
  modelCalls: 0;
  remoteCalls: 0;
  activated: 0;
  learningPromoted: false;
  automaticRecovery: false;
  billionUsersProven: false;
  humanDecision: 'REQUIRED';
}>;

export type OsStatusRefusedPacket = Readonly<{
  kind: 'OS_STATUS_REFUSED';
  policyVersion: string;
  reason: string;
  modelCalls: 0;
  remoteCalls: 0;
  activated: 0;
  learningPromoted: false;
  humanDecision: 'REQUIRED';
}>;

/** The REAL measured status: open the queue, summarize, close, emit. */
export function runOsStatusCommand(argv: readonly string[]): OsStatusPacket | OsStatusRefusedPacket {
  try {
    const args = parseOsStatusArgs(argv);
    if (!existsSync(args.queue))
      return Object.freeze({
        kind: 'OS_STATUS_REFUSED',
        policyVersion: OS_STATUS_CLI_POLICY.policyVersion,
        reason: `the queue file ${args.queue} does not exist — the status CLI never creates a queue by accident; point --queue at an existing OfflineStoryQueue sqlite file`,
        modelCalls: 0, remoteCalls: 0,
        activated: 0, learningPromoted: false,
        humanDecision: 'REQUIRED',
      });
    const queue = new OfflineStoryQueue(args.queue);
    try {
      const summary = queue.summary(args.tenant);
      const awaiting = summary.counts
        .filter((c) => c.state === 'AWAITING_REVIEW')
        .reduce((acc, c) => acc + Number(c.count), 0);
      return Object.freeze({
        kind: 'OS_STATUS_PACKET',
        policyVersion: OS_STATUS_CLI_POLICY.policyVersion,
        tenantId: args.tenant,
        measuredAtMs: Date.now(),
        counts: Object.freeze(summary.counts.map((c) => Object.freeze({ kind: String(c.kind), state: String(c.state), count: Number(c.count) }))),
        leaseHeld: summary.leaseHeld,
        leaseExpired: summary.leaseExpired,
        liveAgentCount: null,
        ceiling: Object.freeze({
          rowsPerDatabase: 2000000 as const,
          scope: 'measured' as const,
          note: '2,000,000 rows/database is the ONLY measured ceiling; trillion/billion/infinite scale is VISION, never packet truth',
        }),
        reviewPath: Object.freeze({
          state: 'the drafts below AWAITING_REVIEW are the reviewer\'s to decide',
          nextSteps: Object.freeze([
            `run the 12D-323 worksheet CLI against this queue to prepare hash-bound decision inputs${awaiting > 0 ? ` (${awaiting} drafts AWAITING_REVIEW)` : ' (0 drafts AWAITING_REVIEW right now)'}`,
            'fill decisions at the REAL hash-bound door only — the 12D-354 prep + 12D-355 verify CLIs dry-run it, the 12D-324 apply CLI executes the human\'s decisions',
            'no apply runs without the human\'s decisions; receipts are never fabricated; blanket approvals stay DISCLOSED as blanket',
          ]),
        }),
        queueNeverWritten: true as const,
        modelCalls: 0 as const,
        remoteCalls: 0 as const,
        activated: 0 as const,
        learningPromoted: false as const,
        automaticRecovery: false as const,
        billionUsersProven: false as const,
        humanDecision: 'REQUIRED' as const,
      });
    } finally {
      queue.close();
    }
  } catch (err) {
    return Object.freeze({
      kind: 'OS_STATUS_REFUSED',
      policyVersion: OS_STATUS_CLI_POLICY.policyVersion,
      reason: err instanceof Error ? err.message : String(err),
      modelCalls: 0, remoteCalls: 0,
      activated: 0, learningPromoted: false,
      humanDecision: 'REQUIRED',
    });
  }
}

/** The daemon-free entrypoint: one packet, exit 2 when refused. */
export function mainOsStatusCli(argv: readonly string[]): void {
  const packet = runOsStatusCommand(argv);
  process.stdout.write(`${JSON.stringify(packet, null, 2)}\n`);
  if (packet.kind === 'OS_STATUS_REFUSED') process.exitCode = 2;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  mainOsStatusCli(process.argv.slice(2).filter((a): a is string => typeof a === 'string'));
}