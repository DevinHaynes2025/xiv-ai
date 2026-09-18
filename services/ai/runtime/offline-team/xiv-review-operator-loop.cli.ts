// 12D-357 — Review Operator Loop CLI: the ONE-SHOT dry run that chains
// the three REAL committed review CLIs — 12D-323 worksheet (the door's
// hash-bound inputs) → 12D-354 prep (the decisions file shape) →
// 12D-355 verify (the 12D-324 door's own pre-flight) — so the operator
// sees EVERYTHING the review door needs in one invocation, BEFORE the
// human runs the REAL apply door:
//
//   node xiv-review-operator-loop.cli.ts --queue=<path> --tenant=<id> \
//     --decision=<APPROVED|CHANGES_REQUESTED|REJECTED> --reviewer=<id> --ref=<provenance <=256>
//
// Fail-closed by construction:
//   * Exactly the five flags, each exactly once, each with a value;
//     unknown/duplicate/missing refuse. NO --apply flag: the REAL
//     12D-324 door is the only queue-mutating rung, run by the human.
//   * Each stage reuses the REAL committed contracts by IMPORT (never
//     re-typed): a refusal at any stage is the stage's own refusal,
//     wrapped with its stage name, NOTHING applied, exit 2.
//   * The worksheet and decisions files are written ONLY to a private
//     mkdtemp workspace that is deleted in a finally block — the QUEUE
//     is never written (queueTouched false, tested byte-for-byte).
//   * LOCAL I/O only: modelCalls 0, no network primitive,
//     remoteCalls 0. Honest flags pinned.
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'url';
import {
  runReviewDecisionWorksheetCommand,
} from './xiv-review-decision-worksheet.cli';
import {
  runReviewDecisionPrepCommand,
} from './xiv-review-decision-prep.cli';
import {
  runReviewDecisionVerifyCommand,
} from './xiv-review-decision-verify.cli';

export const REVIEW_OPERATOR_LOOP_CLI_POLICY = Object.freeze({
  policyVersion: '12d-357-v1',
  domain: 'XIV_OS_REVIEW_OPERATOR_LOOP_CLI',
  flagOrder: ['--queue', '--tenant', '--decision', '--reviewer', '--ref'] as const,
});

export const REVIEW_OPERATOR_LOOP_CLI_GUARDRAILS = Object.freeze({
  printOnly: true, // the loop PRODUCES the door's inputs; it never applies
  queueTouchedNever: true, // the REAL 12D-324 door is the only queue-mutating rung
  realContractReuse: true, // 12D-323 + 12D-354 + 12D-355 by IMPORT, never re-typed
  tempWorkspaceDeleted: true, // mkdtemp scratch is deleted in a finally block
  appliesNothing: true,
  localIoOnly: true,
  noModelCallEver: true,
  noNetworkPrimitive: true,
  remoteCalls: 0,
  modelCalls: 0,
  refusedWithExitTwo: true,
  collectsNothing: true,
  learningPromoted: false,
  activated: 0,
  automaticRecovery: false,
  billionUsersProven: false,
  humanDecision: 'REQUIRED' as const,
});

export type ReviewOperatorLoopArgs = Readonly<{
  queue: string;
  tenant: string;
  decision: string;
  reviewer: string;
  ref: string;
}>;

/** Strict arg parsing: exactly the five flags, each once, each valued. */
export function parseReviewOperatorLoopArgs(argv: readonly string[]): ReviewOperatorLoopArgs {
  if (argv.length !== REVIEW_OPERATOR_LOOP_CLI_POLICY.flagOrder.length * 2)
    throw new Error(`expected exactly ${REVIEW_OPERATOR_LOOP_CLI_POLICY.flagOrder.length} flags each with a value (${REVIEW_OPERATOR_LOOP_CLI_POLICY.flagOrder.join(' ')}); fail closed`);
  const seen = new Map<string, string>();
  for (let i = 0; i < argv.length; i += 2) {
    const flag = argv[i]!;
    const value = argv[i + 1];
    if (!(REVIEW_OPERATOR_LOOP_CLI_POLICY.flagOrder as readonly string[]).includes(flag))
      throw new Error(`unknown flag ${flag}; use only ${REVIEW_OPERATOR_LOOP_CLI_POLICY.flagOrder.join(' ')}; fail closed`);
    if (typeof value !== 'string' || value.length === 0)
      throw new Error(`flag ${flag} requires a value; fail closed`);
    if (seen.has(flag))
      throw new Error(`duplicate flag ${flag}; fail closed`);
    seen.set(flag, value);
  }
  return Object.freeze({
    queue: seen.get('--queue')!,
    tenant: seen.get('--tenant')!,
    decision: seen.get('--decision')!,
    reviewer: seen.get('--reviewer')!,
    ref: seen.get('--ref')!,
  });
}

export type ReviewOperatorLoopPacket = Readonly<{
  kind: 'REVIEW_OPERATOR_LOOP_DRY_RUN';
  policyVersion: string;
  tenantId: string;
  worksheet: Readonly<{ entries: number; worksheetDigestSha256: string }>;
  prep: Readonly<{ prepared: number; decisionDisclosedAs: string }>;
  verify: Readonly<{ verified: boolean; verifiedCount: number; failedCount: number }>;
  queueTouched: false;
  tempWorkspaceDeleted: true;
  nextStep: string;
  modelCalls: 0;
  remoteCalls: 0;
  activated: 0;
  learningPromoted: false;
  stoppedBefore: string;
  humanDecision: 'REQUIRED';
}>;

export type ReviewOperatorLoopRefused = Readonly<{
  kind: 'REVIEW_OPERATOR_LOOP_REFUSED';
  policyVersion: string;
  stage: 'worksheet' | 'prep' | 'verify';
  reason: string;
  modelCalls: 0;
  remoteCalls: 0;
  activated: 0;
  learningPromoted: false;
  humanDecision: 'REQUIRED';
}>;

function refuse(stage: ReviewOperatorLoopRefused['stage'], reason: string): ReviewOperatorLoopRefused {
  return Object.freeze({
    kind: 'REVIEW_OPERATOR_LOOP_REFUSED' as const,
    policyVersion: REVIEW_OPERATOR_LOOP_CLI_POLICY.policyVersion,
    stage,
    reason,
    modelCalls: 0 as const, remoteCalls: 0 as const,
    activated: 0 as const, learningPromoted: false as const,
    humanDecision: 'REQUIRED' as const,
  });
}

/**
 * One CLI invocation = ONE read-only dry run of the whole operator
 * loop, chaining the REAL committed contracts by import. The queue is
 * NEVER written; the temp worksheet/decisions scratch is deleted in a
 * finally block; any stage refusal ends the loop with NOTHING applied.
 */
export function runReviewOperatorLoopCommand(argv: readonly string[]): ReviewOperatorLoopPacket | ReviewOperatorLoopRefused {
  const args = parseReviewOperatorLoopArgs(argv);
  // Stage 1 — the REAL 12D-323 worksheet (missing queue refuses there,
  // with the worksheet contract's own wording).
  const ws = runReviewDecisionWorksheetCommand(['--queue', args.queue, '--tenant', args.tenant, '--limit', '100']);
  if (ws.kind === 'REVIEW_DECISION_WORKSHEET_REFUSED')
    return refuse('worksheet', ws.reason);
  // Stage 2 — the REAL 12D-354 prep, over a PRIVATE temp snapshot of
  // the worksheet (deleted in the finally below). The decisions output
  // is handed to stage 3 through the same private workspace.
  const dir = mkdtempSync(join(tmpdir(), 'xiv-operator-loop-'));
  try {
    const wsPath = join(dir, 'worksheet.json');
    writeFileSync(wsPath, JSON.stringify(ws, null, 2));
    const prep = runReviewDecisionPrepCommand(['--worksheet', wsPath, '--decision', args.decision, '--reviewer', args.reviewer, '--ref', args.ref]);
    if (prep.kind === 'REVIEW_DECISIONS_PREP_REFUSED')
      return refuse('prep', prep.reason);
    const decPath = join(dir, 'decisions.json');
    writeFileSync(decPath, JSON.stringify(prep.decisions, null, 1));
    // Stage 3 — the REAL 12D-355 verify (the 12D-324 door's own
    // pre-flight, read-only).
    const verify = runReviewDecisionVerifyCommand(['--queue', args.queue, '--tenant', args.tenant, '--decisions', decPath]);
    if (verify.kind === 'REVIEW_DECISIONS_VERIFY_REFUSED')
      return refuse('verify', verify.reason);
    return Object.freeze({
      kind: 'REVIEW_OPERATOR_LOOP_DRY_RUN' as const,
      policyVersion: REVIEW_OPERATOR_LOOP_CLI_POLICY.policyVersion,
      tenantId: args.tenant,
      worksheet: Object.freeze({ entries: ws.entries.length, worksheetDigestSha256: ws.worksheetDigestSha256 }),
      prep: Object.freeze({ prepared: prep.prepared, decisionDisclosedAs: prep.decisionDisclosedAs }),
      verify: Object.freeze({ verified: verify.verified, verifiedCount: verify.verifiedCount, failedCount: verify.failedCount }),
      queueTouched: false as const,
      tempWorkspaceDeleted: true as const,
      nextStep: 'the human runs the REAL 12D-324 apply CLI themselves with the printed decisions — this loop never applies',
      modelCalls: 0 as const, remoteCalls: 0 as const,
      activated: 0 as const, learningPromoted: false as const,
      stoppedBefore: 'the operator loop is a READ-ONLY dry run chaining the REAL 12D-323/354/355 contracts — it never applies a decision, never settles a draft, never promotes any learning; the REAL 12D-324 door is the only queue-mutating rung and the human runs it',
      humanDecision: 'REQUIRED' as const,
    });
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

/** The daemon-free entrypoint: one packet, exit 2 on refusal. */
export function mainReviewOperatorLoopCli(argv: readonly string[]): void {
  try {
    const packet = runReviewOperatorLoopCommand(argv);
    process.stdout.write(`${JSON.stringify(packet, null, 2)}\n`);
    if (packet.kind === 'REVIEW_OPERATOR_LOOP_REFUSED') process.exitCode = 2;
  } catch (err) {
    process.stdout.write(`${JSON.stringify({
      kind: 'REVIEW_OPERATOR_LOOP_REFUSED',
      policyVersion: REVIEW_OPERATOR_LOOP_CLI_POLICY.policyVersion,
      stage: 'worksheet',
      reason: err instanceof Error ? err.message : String(err),
      modelCalls: 0, remoteCalls: 0,
      activated: 0, learningPromoted: false,
      humanDecision: 'REQUIRED',
    }, null, 2)}\n`);
    process.exitCode = 2;
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  mainReviewOperatorLoopCli(process.argv.slice(2).filter((a): a is string => typeof a === 'string'));
}