// 12D-417 — Reading Campaign Census CLI: read-only aggregate visibility
// over the whole supervised-reading campaign. Opens every
// `reading-*/queue.sqlite` under an operator-supplied directory through
// each queue's own summary() door and emits ONE honest census packet —
// what the queues report, nothing invented.
//
//   node xiv-reading-campaign-census.cli.ts --dir=<path> --tenant=<id>
//
// Fail-closed by construction:
//   * Exactly the two flags, each exactly once, each with a value;
//     unknown/duplicate/missing flags refuse. NO --apply, NO
//     --decision, NO --out: a census CLI that could mutate would not
//     be a census CLI.
//   * A `reading-*` directory WITHOUT a queue.sqlite REFUSES — a
//     matched campaign directory missing its queue is a broken
//     campaign, never silently skipped, and the census CLI never
//     creates a queue by accident.
//   * Zero `reading-*` directories under --dir refuses.
//   * Every queue is opened, summarized, and closed — no write
//     primitive exists on this path.
//   * Honest flags are PINNED in the packet, not parameterized;
//     2,000,000 rows/database is stated as the ONLY measured ceiling;
//     trillion/billion scale is VISION, never packet truth.
//   * LOCAL I/O only: modelCalls 0, no network primitive,
//     remoteCalls 0.
import { existsSync, readdirSync } from 'node:fs';
import { pathToFileURL } from 'url';
import { join } from 'node:path';
import { OfflineStoryQueue } from './offline-story-queue';

export const CAMPAIGN_CENSUS_CLI_POLICY = Object.freeze({
  policyVersion: '12d-417-v1',
  domain: 'XIV_READING_CAMPAIGN_CENSUS_CLI',
  flagOrder: ['--dir', '--tenant'] as const,
  queueDirPrefix: 'reading-',
  queueFileName: 'queue.sqlite',
});

export const CAMPAIGN_CENSUS_CLI_GUARDRAILS = Object.freeze({
  readOnly: true, // every queue is opened, summarized, never written
  missingQueueFileRefuses: true, // a matched dir without a queue is a broken campaign, not a skip
  emptyCampaignRefuses: true, // zero reading-* dirs refuses; silence is never success
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

export type CampaignCensusArgs = Readonly<{
  dir: string;
  tenant: string;
}>;

/** Strict arg parsing: exactly the two flags, each once, each valued. */
export function parseCampaignCensusArgs(argv: readonly string[]): CampaignCensusArgs {
  if (argv.length !== CAMPAIGN_CENSUS_CLI_POLICY.flagOrder.length * 2)
    throw new Error(`expected exactly ${CAMPAIGN_CENSUS_CLI_POLICY.flagOrder.length} flags each with a value (${CAMPAIGN_CENSUS_CLI_POLICY.flagOrder.join(' ')}); fail closed`);
  const seen = new Map<string, string>();
  for (let i = 0; i < argv.length; i += 2) {
    const flag = argv[i]!;
    const value = argv[i + 1];
    if (!(CAMPAIGN_CENSUS_CLI_POLICY.flagOrder as readonly string[]).includes(flag))
      throw new Error(`unknown flag ${flag}; use only ${CAMPAIGN_CENSUS_CLI_POLICY.flagOrder.join(' ')}; fail closed`);
    if (typeof value !== 'string' || value.length === 0)
      throw new Error(`flag ${flag} requires a value; fail closed`);
    if (seen.has(flag))
      throw new Error(`duplicate flag ${flag}; fail closed`);
    seen.set(flag, value);
  }
  const dir = seen.get('--dir')!;
  const tenant = seen.get('--tenant')!;
  if (!ID_RE.test(tenant)) throw new Error('the tenant id is malformed (<= 128 chars: letters, digits, _ . : -); fail closed');
  return Object.freeze({ dir, tenant });
}

export type CampaignCensusPacket = Readonly<{
  kind: 'CAMPAIGN_CENSUS_PACKET';
  policyVersion: string;
  tenantId: string;
  measuredAtMs: number;
  queueDir: string;
  queues: readonly {
    queueDir: string;
    counts: readonly { kind: string; state: string; count: number }[];
    awaitingReview: number;
    ready: number;
    done: number;
  }[];
  aggregates: Readonly<{
    totalQueues: number;
    awaitingReviewTotal: number;
    readyTotal: number;
    doneTotal: number;
    note: 'aggregated from each queue\'s own summary() door — never invented';
  }>;
  ceiling: Readonly<{
    rowsPerDatabase: 2000000;
    scope: 'measured';
    note: '2,000,000 rows/database is the ONLY measured ceiling; trillion/billion/infinite scale is VISION, never packet truth';
  }>;
  reviewPath: Readonly<{
    state: 'drafts AWAITING_REVIEW below are the reviewer\'s to decide; the apply door executes only the human\'s decisions';
    nextSteps: readonly string[];
  }>;
  queuesNeverWritten: true;
  modelCalls: 0;
  remoteCalls: 0;
  activated: 0;
  learningPromoted: false;
  automaticRecovery: false;
  billionUsersProven: false;
  humanDecision: 'REQUIRED';
}>;

export type CampaignCensusRefusedPacket = Readonly<{
  kind: 'CAMPAIGN_CENSUS_REFUSED';
  policyVersion: string;
  reason: string;
  modelCalls: 0;
  remoteCalls: 0;
  activated: 0;
  learningPromoted: false;
  humanDecision: 'REQUIRED';
}>;

function summarizeQueue(queuePath: string, tenant: string, queueDir: string) {
  const queue = new OfflineStoryQueue(queuePath);
  try {
    const summary = queue.summary(tenant);
    const counts = summary.counts.map((c) => Object.freeze({ kind: String(c.kind), state: String(c.state), count: Number(c.count) }));
    const sum = (state: string) => counts
      .filter((c) => c.kind === 'PRODUCT_STORY' && c.state === state)
      .reduce((acc, c) => acc + c.count, 0);
    return Object.freeze({
      queueDir,
      counts,
      awaitingReview: sum('AWAITING_REVIEW'),
      ready: sum('READY'),
      done: sum('DONE'),
    });
  } finally {
    queue.close();
  }
}

/** The REAL measured census: enumerate, open, summarize, close, emit. */
export function runCampaignCensusCommand(argv: readonly string[]): CampaignCensusPacket | CampaignCensusRefusedPacket {
  try {
    const args = parseCampaignCensusArgs(argv);
    if (!existsSync(args.dir))
      return Object.freeze({
        kind: 'CAMPAIGN_CENSUS_REFUSED',
        policyVersion: CAMPAIGN_CENSUS_CLI_POLICY.policyVersion,
        reason: `the directory ${args.dir} does not exist; fail closed`,
        modelCalls: 0, remoteCalls: 0,
        activated: 0, learningPromoted: false,
        humanDecision: 'REQUIRED',
      });
    const matched = readdirSync(args.dir, { withFileTypes: true })
      .filter((e) => e.isDirectory() && e.name.startsWith(CAMPAIGN_CENSUS_CLI_POLICY.queueDirPrefix))
      .map((e) => e.name)
      .sort();
    if (matched.length === 0)
      return Object.freeze({
        kind: 'CAMPAIGN_CENSUS_REFUSED',
        policyVersion: CAMPAIGN_CENSUS_CLI_POLICY.policyVersion,
        reason: `no ${CAMPAIGN_CENSUS_CLI_POLICY.queueDirPrefix}* directories under ${args.dir} — an empty campaign refuses; silence is never success`,
        modelCalls: 0, remoteCalls: 0,
        activated: 0, learningPromoted: false,
        humanDecision: 'REQUIRED',
      });
    const queues: ReturnType<typeof summarizeQueue>[] = [];
    for (const name of matched) {
      const queuePath = join(args.dir, name, CAMPAIGN_CENSUS_CLI_POLICY.queueFileName);
      if (!existsSync(queuePath))
        return Object.freeze({
          kind: 'CAMPAIGN_CENSUS_REFUSED',
          policyVersion: CAMPAIGN_CENSUS_CLI_POLICY.policyVersion,
          reason: `the campaign directory ${join(args.dir, name)} has no ${CAMPAIGN_CENSUS_CLI_POLICY.queueFileName} — a matched campaign directory missing its queue is a broken campaign; the census CLI never creates a queue by accident; fail closed`,
          modelCalls: 0, remoteCalls: 0,
          activated: 0, learningPromoted: false,
          humanDecision: 'REQUIRED',
        });
      queues.push(summarizeQueue(queuePath, args.tenant, name));
    }
    const awaitingReviewTotal = queues.reduce((acc, q) => acc + q.awaitingReview, 0);
    const readyTotal = queues.reduce((acc, q) => acc + q.ready, 0);
    const doneTotal = queues.reduce((acc, q) => acc + q.done, 0);
    return Object.freeze({
      kind: 'CAMPAIGN_CENSUS_PACKET',
      policyVersion: CAMPAIGN_CENSUS_CLI_POLICY.policyVersion,
      tenantId: args.tenant,
      measuredAtMs: Date.now(),
      queueDir: args.dir,
      queues: Object.freeze(queues),
      aggregates: Object.freeze({
        totalQueues: queues.length,
        awaitingReviewTotal,
        readyTotal,
        doneTotal,
        note: 'aggregated from each queue\'s own summary() door — never invented',
      }),
      ceiling: Object.freeze({
        rowsPerDatabase: 2000000 as const,
        scope: 'measured' as const,
        note: '2,000,000 rows/database is the ONLY measured ceiling; trillion/billion/infinite scale is VISION, never packet truth',
      }),
      reviewPath: Object.freeze({
        state: 'drafts AWAITING_REVIEW below are the reviewer\'s to decide; the apply door executes only the human\'s decisions',
        nextSteps: Object.freeze([
          awaitingReviewTotal > 0
            ? `${awaitingReviewTotal} drafts AWAITING_REVIEW across ${queues.length} queues — the reviewer decides; receipts are never fabricated`
            : '0 drafts AWAITING_REVIEW across all queues',
          'the 12D-323 worksheet CLI prepares hash-bound decision inputs per queue; the 12D-324 apply CLI executes the human\'s decisions',
          'blanket approvals stay DISCLOSED as blanket; no apply runs without the human\'s decisions',
        ]),
      }),
      queuesNeverWritten: true as const,
      modelCalls: 0 as const,
      remoteCalls: 0 as const,
      activated: 0 as const,
      learningPromoted: false as const,
      automaticRecovery: false as const,
      billionUsersProven: false as const,
      humanDecision: 'REQUIRED' as const,
    });
  } catch (err) {
    return Object.freeze({
      kind: 'CAMPAIGN_CENSUS_REFUSED',
      policyVersion: CAMPAIGN_CENSUS_CLI_POLICY.policyVersion,
      reason: err instanceof Error ? err.message : String(err),
      modelCalls: 0, remoteCalls: 0,
      activated: 0, learningPromoted: false,
      humanDecision: 'REQUIRED',
    });
  }
}

/** The daemon-free entrypoint: one packet, exit 2 when refused. */
export function mainCampaignCensusCli(argv: readonly string[]): void {
  const packet = runCampaignCensusCommand(argv);
  process.stdout.write(`${JSON.stringify(packet, null, 2)}\n`);
  if (packet.kind === 'CAMPAIGN_CENSUS_REFUSED') process.exitCode = 2;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  mainCampaignCensusCli(process.argv.slice(2).filter((a): a is string => typeof a === 'string'));
}