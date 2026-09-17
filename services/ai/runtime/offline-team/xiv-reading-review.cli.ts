// 12D-294 — Reading Review CLI: the operator's door for applying a HUMAN
// review decision to a settled reading draft, in the 12D-292 pattern
// (12D-238 CLI discipline applied to the review door). One explicit
// action per invocation, operator-invoked, non-daemonic, LOCAL plane
// only.
//
//   node xiv-reading-review.cli.ts --queue=<path> --tenant=<id>
//     --story=<id> --reviewer-role=<id> --review-ref=<ref>
//
// The CONTRACT is the queue's own review door (acceptReview,
// 12D-100-era operator review): a story in AWAITING_REVIEW whose role
// designates the given reviewer role moves to DONE with the review ref
// recorded as OPERATOR METADATA. The CLI is the EXECUTOR, never the
// DECIDER: the human decision comes from the operator invoking it with
// an honest review ref that names the decision's source.
//
// Fail-closed by construction:
//   * Exact args: exactly the five flags, each exactly once, each with
//     a value; unknown/duplicate/missing flags refuse. The review ref
//     must be non-empty and <= 256 chars (the queue's own bound); ids
//     are <= 128 chars.
//   * LOCAL I/O only: the queue file is opened from local disk; the
//     CLI NEVER calls a model (modelCalls 0), carries NO network
//     primitive (no fetch, no endpoint literal, no caller import), and
//     NEVER touches a register or a document.
//   * The designation is re-checked by the CLI against the REAL
//     workforce catalog BEFORE the queue door runs (defense-in-depth;
//     the queue re-checks) — a non-designated reviewer role refuses
//     with a verbatim packet and nothing is written.
//   * A story that is not inspectable or not in AWAITING_REVIEW refuses
//     with a verbatim packet — never a silent success, never a partial
//     review.
//   * The CLI is one story per invocation: batching is the operator
//     re-running the command (the 12D-284/292 discipline).
//   * Every packet carries the honest flags; a refusal exits 2.
import { pathToFileURL } from 'url';
import { getEnterpriseRole } from './enterprise-workforce';
import { OfflineStoryQueue } from './offline-story-queue';

export const READING_REVIEW_CLI_POLICY = Object.freeze({
  policyVersion: '12d-294-v1',
  domain: 'XIV_OS_READING_REVIEW_CLI',
  flagOrder: ['--queue', '--tenant', '--story', '--reviewer-role', '--review-ref'] as const,
});

export const READING_REVIEW_CLI_GUARDRAILS = Object.freeze({
  localIoOnly: true,
  noModelCallEver: true,
  noNetworkPrimitive: true,
  remoteCalls: 0,
  modelCalls: 0,
  executorNotDecider: true, // the human decision comes from the operator, never the CLI
  designatedReviewerOnly: true, // the queue's own designation gate, re-checked here
  oneStoryPerInvocation: true,
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

export type ReadingReviewArgs = Readonly<{
  queue: string;
  tenant: string;
  story: string;
  reviewerRole: string;
  reviewRef: string;
}>;

/** Strict arg parsing: exactly the five flags, in any order, each once, each valued. */
export function parseReviewArgs(argv: readonly string[]): ReadingReviewArgs {
  if (argv.length !== READING_REVIEW_CLI_POLICY.flagOrder.length * 2)
    throw new Error(`expected exactly ${READING_REVIEW_CLI_POLICY.flagOrder.length} flags each with a value (${READING_REVIEW_CLI_POLICY.flagOrder.join(' ')}); fail closed`);
  const seen = new Map<string, string>();
  for (let i = 0; i < argv.length; i += 2) {
    const flag = argv[i]!;
    const value = argv[i + 1];
    if (!(READING_REVIEW_CLI_POLICY.flagOrder as readonly string[]).includes(flag))
      throw new Error(`unknown flag ${flag}; use only ${READING_REVIEW_CLI_POLICY.flagOrder.join(' ')}; fail closed`);
    if (typeof value !== 'string' || value.length === 0)
      throw new Error(`flag ${flag} requires a value; fail closed`);
    if (seen.has(flag))
      throw new Error(`duplicate flag ${flag}; fail closed`);
    seen.set(flag, value);
  }
  const queue = seen.get('--queue')!;
  const tenant = seen.get('--tenant')!;
  const story = seen.get('--story')!;
  const reviewerRole = seen.get('--reviewer-role')!;
  const reviewRef = seen.get('--review-ref')!;
  if (!ID_RE.test(tenant)) throw new Error('the tenant id is malformed (<= 128 chars: letters, digits, _ . : -); fail closed');
  if (!ID_RE.test(story)) throw new Error('the story id is malformed (<= 128 chars: letters, digits, _ . : -); fail closed');
  if (!ID_RE.test(reviewerRole)) throw new Error('the reviewer role id is malformed (<= 128 chars: letters, digits, _ . : -); fail closed');
  if (reviewRef.length > 256) throw new Error('the review ref exceeds 256 chars; fail closed');
  if (reviewRef.trim().length === 0) throw new Error('the review ref must be non-empty; fail closed');
  return Object.freeze({ queue, tenant, story, reviewerRole, reviewRef });
}

export type ReadingReviewPacket = Readonly<{
  kind: 'READING_REVIEW';
  policyVersion: string;
  tenantId: string;
  storyId: string;
  reviewerRoleId: string;
  reviewRef: string;
  priorState: string;
  postState: string | null;
  reviewRefRecordedAsOperatorMetadata: true;
  modelCalls: 0;
  remoteCalls: 0;
  activated: 0;
  learningPromoted: false;
  humanDecision: 'REQUIRED';
}>;

export type ReadingReviewRefused = Readonly<{
  kind: 'READING_REVIEW_REFUSED';
  policyVersion: string;
  reason: string;
  storyState: string | null;
  modelCalls: 0;
  remoteCalls: 0;
  activated: 0;
  learningPromoted: false;
  humanDecision: 'REQUIRED';
}>;

/**
 * One CLI invocation. Opens the LOCAL queue, verifies the story is
 * AWAITING_REVIEW and the reviewer role is designated (defense-in-depth;
 * the queue re-checks both), applies the REAL acceptReview door, and
 * prints the packet verbatim. Throws on refusal —
 * mainReadingReviewCli turns that into the refusal packet (exit 2).
 */
export function runReviewCommand(argv: readonly string[]): ReadingReviewPacket | ReadingReviewRefused {
  const args = parseReviewArgs(argv);
  const queue = new OfflineStoryQueue(args.queue);
  try {
    const prior = queue.inspectStory(args.tenant, args.story);
    if (prior === null)
      return Object.freeze({
        kind: 'READING_REVIEW_REFUSED' as const,
        policyVersion: READING_REVIEW_CLI_POLICY.policyVersion,
        reason: 'NO STORY — the story id is not in this queue; NOTHING was reviewed; fail closed',
        storyState: null,
        modelCalls: 0 as const, remoteCalls: 0 as const,
        activated: 0 as const, learningPromoted: false as const,
        humanDecision: 'REQUIRED' as const,
      });
    if (prior.state !== 'AWAITING_REVIEW')
      return Object.freeze({
        kind: 'READING_REVIEW_REFUSED' as const,
        policyVersion: READING_REVIEW_CLI_POLICY.policyVersion,
        reason: `the story is in state ${prior.state}, not AWAITING_REVIEW; NOTHING was reviewed; fail closed`,
        storyState: prior.state,
        modelCalls: 0 as const, remoteCalls: 0 as const,
        activated: 0 as const, learningPromoted: false as const,
        humanDecision: 'REQUIRED' as const,
      });
    // Defense-in-depth designation check (the queue re-checks its own).
    let designated = false;
    try {
      designated = getEnterpriseRole(prior.role).reviewerIds.includes(args.reviewerRole);
    } catch { designated = false; }
    if (!designated)
      return Object.freeze({
        kind: 'READING_REVIEW_REFUSED' as const,
        policyVersion: READING_REVIEW_CLI_POLICY.policyVersion,
        reason: `the reviewer role ${args.reviewerRole} is NOT a designated reviewer of the story's role; NOTHING was reviewed; fail closed`,
        storyState: prior.state,
        modelCalls: 0 as const, remoteCalls: 0 as const,
        activated: 0 as const, learningPromoted: false as const,
        humanDecision: 'REQUIRED' as const,
      });
    // THE REAL QUEUE DOOR.
    queue.acceptReview(args.tenant, args.story, args.reviewerRole, args.reviewRef);
    const post = queue.inspectStory(args.tenant, args.story);
    return Object.freeze({
      kind: 'READING_REVIEW' as const,
      policyVersion: READING_REVIEW_CLI_POLICY.policyVersion,
      tenantId: args.tenant,
      storyId: args.story,
      reviewerRoleId: args.reviewerRole,
      reviewRef: args.reviewRef,
      priorState: prior.state,
      postState: post === null ? null : post.state,
      reviewRefRecordedAsOperatorMetadata: true as const,
      modelCalls: 0 as const, remoteCalls: 0 as const,
      activated: 0 as const, learningPromoted: false as const,
      humanDecision: 'REQUIRED' as const,
    });
  } finally {
    queue.close();
  }
}

/** The daemon-free entrypoint: one packet, exit 2 on refusal. */
export function mainReadingReviewCli(argv: readonly string[]): void {
  try {
    const packet = runReviewCommand(argv);
    process.stdout.write(`${JSON.stringify(packet, null, 2)}\n`);
    if (packet.kind === 'READING_REVIEW_REFUSED') process.exitCode = 2;
  } catch (err) {
    process.stdout.write(`${JSON.stringify({
      kind: 'READING_REVIEW_REFUSED',
      policyVersion: READING_REVIEW_CLI_POLICY.policyVersion,
      reason: err instanceof Error ? err.message : String(err),
      storyState: null,
      modelCalls: 0, remoteCalls: 0,
      activated: 0, learningPromoted: false,
      humanDecision: 'REQUIRED',
    }, null, 2)}\n`);
    process.exitCode = 2;
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  mainReadingReviewCli(process.argv.slice(2).filter((a): a is string => typeof a === 'string'));
}