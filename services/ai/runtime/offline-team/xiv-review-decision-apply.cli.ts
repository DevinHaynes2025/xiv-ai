// 12D-324 — Review Decision Apply CLI: the EXECUTION surface for review
// decisions THE HUMAN has already made. The review loop's operator
// tooling now runs slate (12D-322, lists) → worksheet (12D-323,
// prepares the door's hash-bound inputs) → THE HUMAN DECIDES → apply
// (this CLI, the 12D-317 discipline made operator-repeatable). This CLI
// NEVER decides: every decision, reviewer, and reviewRef comes from a
// decisions file the human wrote; the CLI validates every entry through
// the REAL doors (pre-flight) and applies through the REAL
// applyReviewDecision door — and refuses the WHOLE batch BEFORE
// applying anything when any entry fails.
//
//   node xiv-review-decision-apply.cli.ts --queue=<path> --tenant=<id> --decisions=<file.json>
//
// The decisions file: a JSON array (1..1000) of entries with EXACT keys
// in order [storyId, reviewerId, decision, expectedOutputHash,
// reviewRef] — the full hashes come from the 12D-323 worksheet.
//
// Fail-closed by construction:
//   * Exactly the three flags, each exactly once, each with a value;
//     unknown/duplicate/missing flags refuse.
//   * A MISSING queue or decisions file refuses BEFORE anything is
//     opened — the CLI never creates a file by accident.
//   * PRE-FLIGHT ALL, APPLY ONLY AFTER: every entry is checked against
//     the REAL queue's own inspectStory door (exists, AWAITING_REVIEW,
//     settled output hash === the claimed expectedOutputHash — a stale
//     or tampered hash is "not holding the draft they claim", the
//     12D-285 echo) and the REAL workforce contract's designated
//     independent reviewers BEFORE the first door write. One bad entry
//     refuses the batch with NOTHING applied.
//   * The reviewRef is secret-screened — secrets never render and
//     never go to any model.
//   * LOCAL I/O only: modelCalls 0, no network primitive, remoteCalls 0.
import { readFileSync, existsSync } from 'node:fs';
import { pathToFileURL } from 'url';
import { OfflineStoryQueue } from './offline-story-queue';
import { getEnterpriseRole } from './enterprise-workforce';
import { SECRET_CONTENT_RE } from './xiv-document-ingest';

export const REVIEW_DECISION_APPLY_CLI_POLICY = Object.freeze({
  policyVersion: '12d-324-v1',
  domain: 'XIV_OS_REVIEW_DECISION_APPLY_CLI',
  flagOrder: ['--queue', '--tenant', '--decisions'] as const,
});

export const REVIEW_DECISION_APPLY_CLI_GUARDRAILS = Object.freeze({
  executesNeverDecides: true, // every decision comes from the human's decisions file
  preflightAllThenApply: true, // one bad entry refuses the batch with NOTHING applied
  hashBound: true, // every entry must match the queue's settled output hash
  designatedReviewerRequired: true, // the REAL workforce contract's own check
  missingFileRefuses: true, // the CLI never creates a queue or decisions file by accident
  everyRefSecretScreened: true, // reviewRefs are secret-screened, never echoed
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

const DOOR_DECISIONS = ['APPROVED', 'CHANGES_REQUESTED', 'REJECTED'] as const;

const ID_RE = /^[A-Za-z0-9][A-Za-z0-9_.:-]{0,127}$/;
const HEX64_RE = /^[0-9a-f]{64}$/;
const DECISIONS_MAX = 1000;

export type ReviewDecisionApplyArgs = Readonly<{
  queue: string;
  tenant: string;
  decisions: string;
}>;

/** Strict arg parsing: exactly the three flags, each once, each valued. */
export function parseReviewDecisionApplyArgs(argv: readonly string[]): ReviewDecisionApplyArgs {
  if (argv.length !== REVIEW_DECISION_APPLY_CLI_POLICY.flagOrder.length * 2)
    throw new Error(`expected exactly ${REVIEW_DECISION_APPLY_CLI_POLICY.flagOrder.length} flags each with a value (${REVIEW_DECISION_APPLY_CLI_POLICY.flagOrder.join(' ')}); fail closed`);
  const seen = new Map<string, string>();
  for (let i = 0; i < argv.length; i += 2) {
    const flag = argv[i]!;
    const value = argv[i + 1];
    if (!(REVIEW_DECISION_APPLY_CLI_POLICY.flagOrder as readonly string[]).includes(flag))
      throw new Error(`unknown flag ${flag}; use only ${REVIEW_DECISION_APPLY_CLI_POLICY.flagOrder.join(' ')}; fail closed`);
    if (typeof value !== 'string' || value.length === 0)
      throw new Error(`flag ${flag} requires a value; fail closed`);
    if (seen.has(flag))
      throw new Error(`duplicate flag ${flag}; fail closed`);
    seen.set(flag, value);
  }
  const tenant = seen.get('--tenant')!;
  if (!ID_RE.test(tenant)) throw new Error('the tenant id is malformed (<= 128 chars: letters, digits, _ . : -); fail closed');
  return Object.freeze({ queue: seen.get('--queue')!, tenant, decisions: seen.get('--decisions')! });
}

export type HumanReviewDecision = Readonly<{
  storyId: string;
  reviewerId: string;
  decision: (typeof DOOR_DECISIONS)[number];
  expectedOutputHash: string; // FULL hex64 — from the 12D-323 worksheet
  reviewRef: string; // the human's provenance reference, <= 256 chars
}>;

/** Parse + validate the decisions file's SHAPE (no queue access yet). */
export function parseHumanDecisions(raw: string): readonly HumanReviewDecision[] {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error('the decisions file does not parse as JSON; fail closed');
  }
  if (!Array.isArray(parsed)) throw new Error('the decisions file must be a JSON array of decisions; fail closed');
  if (parsed.length < 1) throw new Error('the decisions file is empty — there is nothing the human decided; fail closed');
  if (parsed.length > DECISIONS_MAX) throw new Error(`the decisions file exceeds the ${DECISIONS_MAX}-decision batch bound; fail closed`);
  const seen = new Set<string>();
  return parsed.map((row, index) => {
    if (row === null || typeof row !== 'object' || Array.isArray(row))
      throw new Error(`decision ${index} is not an object; fail closed`);
    const r = row as Readonly<Record<string, unknown>>;
    const keys = Object.keys(r);
    if (keys.length !== 5 || !['storyId', 'reviewerId', 'decision', 'expectedOutputHash', 'reviewRef'].every((k, i) => keys[i] === k))
      throw new Error(`decision ${index} must carry exactly the keys [storyId, reviewerId, decision, expectedOutputHash, reviewRef] in order; fail closed`);
    const storyId = r.storyId;
    const reviewerId = r.reviewerId;
    const decision = r.decision;
    const expectedOutputHash = r.expectedOutputHash;
    const reviewRef = r.reviewRef;
    if (typeof storyId !== 'string' || !ID_RE.test(storyId))
      throw new Error(`decision ${index} carries a malformed storyId; fail closed`);
    if (typeof reviewerId !== 'string' || !ID_RE.test(reviewerId))
      throw new Error(`decision ${index} carries a malformed reviewerId; fail closed`);
    if (typeof decision !== 'string' || !(DOOR_DECISIONS as readonly string[]).includes(decision))
      throw new Error(`decision ${index} carries decision '${String(decision)}', which the REAL review door does not accept (APPROVED | CHANGES_REQUESTED | REJECTED); fail closed`);
    if (typeof expectedOutputHash !== 'string' || !HEX64_RE.test(expectedOutputHash))
      throw new Error(`decision ${index} (story ${storyId}) carries a malformed expectedOutputHash (the full hex64 comes from the 12D-323 worksheet); fail closed`);
    if (typeof reviewRef !== 'string' || reviewRef.length < 1 || reviewRef.length > 256)
      throw new Error(`decision ${index} carries a malformed reviewRef (1..256 chars of the human's own provenance reference); fail closed`);
    if (SECRET_CONTENT_RE.test(reviewRef))
      throw new Error(`decision ${index} carries a secret-shaped reviewRef; secrets never render and never go to ANY model; fail closed`);
    if (seen.has(storyId)) throw new Error(`decision ${index} repeats story ${storyId}; one decision per story; fail closed`);
    seen.add(storyId);
    return Object.freeze({ storyId, reviewerId, decision: decision as HumanReviewDecision['decision'], expectedOutputHash, reviewRef });
  });
}

export type ReviewDecisionApplyResult = Readonly<{
  storyId: string;
  decision: string;
  reviewRef: string;
  doorResult: 'DONE' | 'READY' | 'FAILED';
}>;

export type ReviewDecisionApplyPacket = Readonly<{
  kind: 'REVIEW_DECISIONS_APPLIED';
  policyVersion: string;
  tenantId: string;
  applied: readonly ReviewDecisionApplyResult[];
  appliedCount: number;
  decidedBy: 'THE_HUMAN_VIA_THE_DECISIONS_FILE';
  modelCalls: 0;
  remoteCalls: 0;
  activated: 0;
  learningPromoted: false;
  stoppedBefore: string;
  humanDecision: 'REQUIRED';
}>;

export type ReviewDecisionApplyRefused = Readonly<{
  kind: 'REVIEW_DECISION_APPLY_REFUSED';
  policyVersion: string;
  reason: string;
  appliedCount: number; // 0 on every pre-flight refusal — the batch never partially applies
  modelCalls: 0;
  remoteCalls: 0;
  activated: 0;
  learningPromoted: false;
  humanDecision: 'REQUIRED';
}>;

function refuse(reason: string, appliedCount = 0): ReviewDecisionApplyRefused {
  return Object.freeze({
    kind: 'REVIEW_DECISION_APPLY_REFUSED' as const,
    policyVersion: REVIEW_DECISION_APPLY_CLI_POLICY.policyVersion,
    reason,
    appliedCount: appliedCount as 0,
    modelCalls: 0 as const, remoteCalls: 0 as const,
    activated: 0 as const, learningPromoted: false as const,
    humanDecision: 'REQUIRED' as const,
  });
}

/**
 * One CLI invocation = ONE batch of THE HUMAN's review decisions,
 * executed through the REAL review door. The queue and decisions files
 * must both already exist (never created); every entry is pre-flighted
 * through the REAL inspectStory + workforce doors BEFORE the first
 * write — one bad entry refuses the whole batch with NOTHING applied.
 */
export function runReviewDecisionApplyCommand(argv: readonly string[]): ReviewDecisionApplyPacket | ReviewDecisionApplyRefused {
  const args = parseReviewDecisionApplyArgs(argv);
  // MISSING files refuse BEFORE anything is opened — the CLI never
  // creates a queue or a decisions file by accident.
  if (!existsSync(args.queue))
    return refuse('the queue file does not exist; the CLI never creates a queue; NOTHING was applied; fail closed');
  if (!existsSync(args.decisions))
    return refuse('the decisions file does not exist; the CLI never invents decisions — the human writes them first; NOTHING was applied; fail closed');
  let raw: string;
  try {
    raw = readFileSync(args.decisions, 'utf8');
  } catch {
    return refuse('the decisions file is unreadable; NOTHING was applied; fail closed');
  }
  if (raw.length === 0)
    return refuse('the decisions file is empty; NOTHING was applied; fail closed');
  let decisions: readonly HumanReviewDecision[];
  try {
    decisions = parseHumanDecisions(raw);
  } catch (err) {
    return refuse(`${err instanceof Error ? err.message : String(err)}; NOTHING was applied`);
  }
  const queue = new OfflineStoryQueue(args.queue);
  try {
    // PRE-FLIGHT ALL, APPLY ONLY AFTER: every entry against the REAL
    // queue's own inspectStory door and the REAL workforce contract.
    const rows: { decision: HumanReviewDecision; role: string; settledHash: string }[] = [];
    for (const decision of decisions) {
      let inspected: { state: string; role: string; outputHash: string | null };
      try {
        const found = queue.inspectStory(args.tenant, decision.storyId);
        if (found === null)
          return refuse(`decision for story ${decision.storyId} names a story this queue does not hold under tenant ${args.tenant}; NOTHING was applied; fail closed`);
        inspected = found;
      } catch (err) {
        return refuse(`the queue story read refused (${err instanceof Error ? err.message : String(err)}); NOTHING was applied; fail closed`);
      }
      if (inspected.state !== 'AWAITING_REVIEW')
        return refuse(`story ${decision.storyId} is ${inspected.state}, not AWAITING_REVIEW — the review door itself would refuse; NOTHING was applied; fail closed`);
      if (inspected.outputHash === null || inspected.outputHash !== decision.expectedOutputHash)
        return refuse(`story ${decision.storyId} is not being held at the claimed output hash (the settled hash is the truth; a stale or tampered hash means the reviewer is not holding the draft they claim); NOTHING was applied; fail closed`);
      let designated: readonly string[];
      try {
        designated = getEnterpriseRole(inspected.role).reviewerIds;
      } catch {
        return refuse(`story ${decision.storyId} carries role ${inspected.role}, which the REAL workforce contract does not know; NOTHING was applied; fail closed`);
      }
      if (!designated.includes(decision.reviewerId))
        return refuse(`decision for story ${decision.storyId} names reviewer ${decision.reviewerId}, who is not one of role ${inspected.role}'s designated independent reviewers (${designated.join(', ')}); NOTHING was applied; fail closed`);
      rows.push({ decision, role: inspected.role, settledHash: inspected.outputHash });
    }
    // ALL entries pre-flighted — apply each through the REAL review
    // door, in order, with the door's own result recorded verbatim.
    const applied: ReviewDecisionApplyResult[] = [];
    for (const { decision } of rows) {
      const doorResult = queue.applyReviewDecision({
        tenantId: args.tenant,
        storyId: decision.storyId,
        reviewerId: decision.reviewerId,
        expectedOutputHash: decision.expectedOutputHash,
        decision: decision.decision,
        reviewRef: decision.reviewRef,
      });
      applied.push(Object.freeze({
        storyId: decision.storyId,
        decision: decision.decision,
        reviewRef: decision.reviewRef,
        doorResult,
      }));
    }
    return Object.freeze({
      kind: 'REVIEW_DECISIONS_APPLIED' as const,
      policyVersion: REVIEW_DECISION_APPLY_CLI_POLICY.policyVersion,
      tenantId: args.tenant,
      applied: Object.freeze(applied),
      appliedCount: applied.length,
      decidedBy: 'THE_HUMAN_VIA_THE_DECISIONS_FILE' as const,
      modelCalls: 0 as const, remoteCalls: 0 as const,
      activated: 0 as const, learningPromoted: false as const,
      stoppedBefore: 'the apply CLI EXECUTES the decisions the HUMAN wrote in the decisions file — it never decides, never settles a draft, never promotes any learning; every entry was hash-bound against the queue\'s settled output and reviewer-checked against the REAL workforce contract before the first write',
      humanDecision: 'REQUIRED' as const,
    });
  } finally {
    queue.close();
  }
}

/** The daemon-free entrypoint: one packet, exit 2 on refusal. */
export function mainReviewDecisionApplyCli(argv: readonly string[]): void {
  try {
    const packet = runReviewDecisionApplyCommand(argv);
    process.stdout.write(`${JSON.stringify(packet, null, 2)}\n`);
    if (packet.kind === 'REVIEW_DECISION_APPLY_REFUSED') process.exitCode = 2;
  } catch (err) {
    process.stdout.write(`${JSON.stringify({
      kind: 'REVIEW_DECISION_APPLY_REFUSED',
      policyVersion: REVIEW_DECISION_APPLY_CLI_POLICY.policyVersion,
      reason: err instanceof Error ? err.message : String(err),
      appliedCount: 0,
      modelCalls: 0, remoteCalls: 0,
      activated: 0, learningPromoted: false,
      humanDecision: 'REQUIRED',
    }, null, 2)}\n`);
    process.exitCode = 2;
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  mainReviewDecisionApplyCli(process.argv.slice(2).filter((a): a is string => typeof a === 'string'));
}