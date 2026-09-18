// 12D-355 — Review Decision Verify CLI: the read-only DRY-RUN half of
// the 12D-324 apply door. The apply CLI pre-flights every decision
// (story exists, AWAITING_REVIEW, settled-hash match, designated
// reviewer) and then APPLIES — but a 127-draft operator run that hits
// its FIRST failure learns only the first problem. This CLI runs the
// SAME pre-flight checks, against the SAME doors, and reports ALL of
// them at once — WITHOUT writing anything:
//
//   node xiv-review-decision-verify.cli.ts --queue=<path> --tenant=<id> --decisions=<file.json>
//
//   * The decisions file is parsed by the REAL apply contract's OWN
//     parser (parseHumanDecisions) — exact keys in order, bounded
//     values, secret-screened. A file the verify CLI accepts is a
//     file the apply door will parse identically.
//   * Every entry is checked against the REAL queue's inspectStory
//     door and the REAL workforce contract — the same checks the
//     apply door runs before its first write.
//   * FIRST-FAILURE-DOES-NOT-STOP: every entry gets a verdict, so the
//     operator sees all problems at once (the apply door itself stays
//     all-or-nothing).
//   * WRITES NOTHING — queueTouchedNever: the queue is opened, read,
//     closed; applyReviewDecision is NEVER called. The queue bytes
//     are identical before and after (tested).
//   * LOCAL I/O only: modelCalls 0, no network primitive,
//     remoteCalls 0. verified=false exits 2.
import { readFileSync, existsSync } from 'node:fs';
import { pathToFileURL } from 'url';
import { OfflineStoryQueue } from './offline-story-queue';
import { getEnterpriseRole } from './enterprise-workforce';
import { parseHumanDecisions } from './xiv-review-decision-apply.cli';

export const REVIEW_DECISION_VERIFY_CLI_POLICY = Object.freeze({
  policyVersion: '12d-355-v1',
  domain: 'XIV_OS_REVIEW_DECISION_VERIFY_CLI',
  flagOrder: ['--queue', '--tenant', '--decisions'] as const,
});

export const REVIEW_DECISION_VERIFY_CLI_GUARDRAILS = Object.freeze({
  readOnly: true, // the queue is opened, enumerated, never written
  queueTouchedNever: true, // applyReviewDecision is NEVER called here
  samePreflightAsTheApplyDoor: true, // inspectStory + workforce checks, mirrored exactly
  realParserParity: true, // parseHumanDecisions from the REAL 12D-324 contract
  firstFailureDoesNotStop: true, // every entry gets a verdict; the APPLY door stays all-or-nothing
  missingFileRefuses: true, // the CLI never creates a queue or decisions file by accident
  localIoOnly: true,
  noModelCallEver: true,
  noNetworkPrimitive: true,
  remoteCalls: 0,
  modelCalls: 0,
  verifiedFalseExitsTwo: true,
  collectsNothing: true,
  learningPromoted: false,
  activated: 0,
  automaticRecovery: false,
  billionUsersProven: false,
  humanDecision: 'REQUIRED' as const,
});

const ID_RE = /^[A-Za-z0-9][A-Za-z0-9_.:-]{0,127}$/;

export type ReviewDecisionVerifyArgs = Readonly<{
  queue: string;
  tenant: string;
  decisions: string;
}>;

/** Strict arg parsing: exactly the three flags, each once, each valued. */
export function parseReviewDecisionVerifyArgs(argv: readonly string[]): ReviewDecisionVerifyArgs {
  if (argv.length !== REVIEW_DECISION_VERIFY_CLI_POLICY.flagOrder.length * 2)
    throw new Error(`expected exactly ${REVIEW_DECISION_VERIFY_CLI_POLICY.flagOrder.length} flags each with a value (${REVIEW_DECISION_VERIFY_CLI_POLICY.flagOrder.join(' ')}); fail closed`);
  const seen = new Map<string, string>();
  for (let i = 0; i < argv.length; i += 2) {
    const flag = argv[i]!;
    const value = argv[i + 1];
    if (!(REVIEW_DECISION_VERIFY_CLI_POLICY.flagOrder as readonly string[]).includes(flag))
      throw new Error(`unknown flag ${flag}; use only ${REVIEW_DECISION_VERIFY_CLI_POLICY.flagOrder.join(' ')}; fail closed`);
    if (typeof value !== 'string' || value.length === 0)
      throw new Error(`flag ${flag} requires a value; fail closed`);
    if (seen.has(flag))
      throw new Error(`duplicate flag ${flag}; fail closed`);
    seen.set(flag, value);
  }
  const queue = seen.get('--queue')!;
  const tenant = seen.get('--tenant')!;
  const decisions = seen.get('--decisions')!;
  if (!ID_RE.test(tenant)) throw new Error('the tenant id is malformed (<= 128 chars: letters, digits, _ . : -); fail closed');
  return Object.freeze({ queue, tenant, decisions });
}

export type ReviewDecisionVerifyVerdict = Readonly<{
  storyId: string;
  decision: string;
  reviewerId: string;
  wouldApply: boolean;
  reason: string; // '' when the door would accept; the door's own refusal wording otherwise
}>;

export type ReviewDecisionVerifyPacket = Readonly<{
  kind: 'REVIEW_DECISIONS_VERIFIED';
  policyVersion: string;
  tenantId: string;
  checked: number;
  verdicts: readonly ReviewDecisionVerifyVerdict[];
  verified: boolean; // true only when EVERY entry would pass the REAL door's pre-flight
  verifiedCount: number;
  failedCount: number;
  queueNeverWritten: true;
  modelCalls: 0;
  remoteCalls: 0;
  activated: 0;
  learningPromoted: false;
  stoppedBefore: string;
  humanDecision: 'REQUIRED';
}>;

export type ReviewDecisionVerifyRefused = Readonly<{
  kind: 'REVIEW_DECISIONS_VERIFY_REFUSED';
  policyVersion: string;
  reason: string;
  modelCalls: 0;
  remoteCalls: 0;
  activated: 0;
  learningPromoted: false;
  humanDecision: 'REQUIRED';
}>;

function refuse(reason: string): ReviewDecisionVerifyRefused {
  return Object.freeze({
    kind: 'REVIEW_DECISIONS_VERIFY_REFUSED' as const,
    policyVersion: REVIEW_DECISION_VERIFY_CLI_POLICY.policyVersion,
    reason,
    modelCalls: 0 as const, remoteCalls: 0 as const,
    activated: 0 as const, learningPromoted: false as const,
    humanDecision: 'REQUIRED' as const,
  });
}

/**
 * One CLI invocation = ONE read-only dry run. MISSING files refuse
 * BEFORE anything is opened; the decisions file is parsed by the REAL
 * apply contract's own parser; every entry is pre-flighted against
 * the REAL queue's inspectStory door and the REAL workforce contract;
 * NOTHING is ever written. verified=false exits 2.
 */
export function runReviewDecisionVerifyCommand(argv: readonly string[]): ReviewDecisionVerifyPacket | ReviewDecisionVerifyRefused {
  const args = parseReviewDecisionVerifyArgs(argv);
  // MISSING files refuse BEFORE anything is opened — the CLI never
  // creates a queue or a decisions file by accident.
  if (!existsSync(args.queue))
    return refuse('the queue file does not exist; the CLI never creates a queue; NOTHING was read; fail closed');
  if (!existsSync(args.decisions))
    return refuse('the decisions file does not exist; the CLI never invents decisions — the human writes them first; NOTHING was read; fail closed');
  let raw: string;
  try {
    raw = readFileSync(args.decisions, 'utf8');
  } catch {
    return refuse('the decisions file is unreadable; NOTHING was read; fail closed');
  }
  if (raw.length === 0)
    return refuse('the decisions file is empty; NOTHING was read; fail closed');
  let decisions: ReturnType<typeof parseHumanDecisions>;
  try {
    decisions = parseHumanDecisions(raw);
  } catch (err) {
    return refuse(`${err instanceof Error ? err.message : String(err)}; NOTHING was read`);
  }
  const queue = new OfflineStoryQueue(args.queue);
  try {
    // The SAME pre-flight the apply door runs — but every entry gets a
    // verdict, and NOTHING is ever written.
    const verdicts: ReviewDecisionVerifyVerdict[] = [];
    for (const decision of decisions) {
      let reason = '';
      let inspected: { state: string; role: string; outputHash: string | null } | null = null;
      try {
        inspected = queue.inspectStory(args.tenant, decision.storyId);
        if (inspected === null)
          reason = `decision for story ${decision.storyId} names a story this queue does not hold under tenant ${args.tenant}`;
      } catch (err) {
        reason = `the queue story read refused (${err instanceof Error ? err.message : String(err)})`;
      }
      if (inspected !== null && reason === '') {
        if (inspected.state !== 'AWAITING_REVIEW')
          reason = `story ${decision.storyId} is ${inspected.state}, not AWAITING_REVIEW — the review door itself would refuse`;
        else if (inspected.outputHash === null || inspected.outputHash !== decision.expectedOutputHash)
          reason = `story ${decision.storyId} is not being held at the claimed output hash (the settled hash is the truth; a stale or tampered hash means the reviewer is not holding the draft they claim)`;
        else {
          let designated: readonly string[] | null = null;
          try {
            designated = getEnterpriseRole(inspected.role).reviewerIds;
          } catch {
            reason = `story ${decision.storyId} carries role ${inspected.role}, which the REAL workforce contract does not know`;
          }
          if (designated !== null && !designated.includes(decision.reviewerId))
            reason = `decision for story ${decision.storyId} names reviewer ${decision.reviewerId}, who is not one of role ${inspected.role}'s designated independent reviewers (${designated.join(', ')})`;
        }
      }
      verdicts.push(Object.freeze({
        storyId: decision.storyId,
        decision: decision.decision,
        reviewerId: decision.reviewerId,
        wouldApply: reason === '',
        reason,
      }));
    }
    const verifiedCount = verdicts.filter((v) => v.wouldApply).length;
    return Object.freeze({
      kind: 'REVIEW_DECISIONS_VERIFIED' as const,
      policyVersion: REVIEW_DECISION_VERIFY_CLI_POLICY.policyVersion,
      tenantId: args.tenant,
      checked: verdicts.length,
      verdicts: Object.freeze(verdicts),
      verified: verifiedCount === verdicts.length,
      verifiedCount,
      failedCount: verdicts.length - verifiedCount,
      queueNeverWritten: true as const,
      modelCalls: 0 as const, remoteCalls: 0 as const,
      activated: 0 as const, learningPromoted: false as const,
      stoppedBefore: 'the verify CLI is a READ-ONLY dry run of the REAL 12D-324 door\'s pre-flight — it never applies a decision, never settles a draft, never promotes any learning; every verdict is measured against the queue\'s own inspectStory door and the REAL workforce contract',
      humanDecision: 'REQUIRED' as const,
    });
  } finally {
    queue.close();
  }
}

/** The daemon-free entrypoint: one packet, exit 2 when unverified. */
export function mainReviewDecisionVerifyCli(argv: readonly string[]): void {
  try {
    const packet = runReviewDecisionVerifyCommand(argv);
    process.stdout.write(`${JSON.stringify(packet, null, 2)}\n`);
    if (packet.kind === 'REVIEW_DECISIONS_VERIFY_REFUSED') process.exitCode = 2;
    else if (packet.kind === 'REVIEW_DECISIONS_VERIFIED' && !packet.verified) process.exitCode = 2;
  } catch (err) {
    process.stdout.write(`${JSON.stringify({
      kind: 'REVIEW_DECISIONS_VERIFY_REFUSED',
      policyVersion: REVIEW_DECISION_VERIFY_CLI_POLICY.policyVersion,
      reason: err instanceof Error ? err.message : String(err),
      modelCalls: 0, remoteCalls: 0,
      activated: 0, learningPromoted: false,
      humanDecision: 'REQUIRED',
    }, null, 2)}\n`);
    process.exitCode = 2;
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  mainReviewDecisionVerifyCli(process.argv.slice(2).filter((a): a is string => typeof a === 'string'));
}