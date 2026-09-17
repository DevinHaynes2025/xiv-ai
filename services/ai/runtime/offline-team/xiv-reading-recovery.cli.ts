// 12D-292 — READING RECOVERY CLI (the operator's FAILED→READY door).
//
// The 12D-288 contract is the fail-closed heart; THIS is the operator's
// command-line door to it: one invocation re-proves ONE document's
// bytes through the REAL chain (12D-274 ingest → 12D-277/278 bound
// admission → the queue's own 12D-288 recovery door) and re-queues
// exactly ONE FAILED story. The re-READ is the operator's next
// 12D-284 supervised-cycle invocation — THIS door makes no model call
// (modelCalls 0) and carries NO network primitive at all.
//
// Fail-closed discipline (the 12D-284 pattern):
//   * EXACT ARGS: every flag is required exactly once; unknown,
//     duplicate, or missing flags refuse; the genesis must be ≥ 8
//     chars; the operatorRef ≤ 256, the title ≤ 256, the source and
//     document ids ≤ 128 (the recovery contract's own policy bounds).
//   * LOCAL I/O ONLY: the body is read from a LOCAL file path; the
//     register and the queue live in LOCAL files the operator names;
//     NOTHING is uploaded anywhere.
//   * THE RECOVERY NEVER THROWS (12D-288): a refusal packet prints
//     with exit code 2 and a MEASURED reason; a verified packet prints
//     with exit code 0. Both packets are printed verbatim — the CLI
//     adds nothing, hides nothing.
//   * The credential-shaped-content gate, the bytes re-proof, the
//     held-lease pre-gate, and every other gate live in the REAL
//     contracts; this CLI re-implements none of them.
//
// Pure parse: parseRecoveryArgs is exported for the adversarial suite;
// FileReadingRegisterStore is re-exported from the 12D-284 CLI so the
// register path stays the operator's own file, round-trippable.
import { readFileSync } from 'node:fs';
import { OfflineStoryQueue } from './offline-story-queue';
import type { ReadingSourceStore } from './xiv-reading-source-register';
import {
  recoverFailedReadingChunk,
  READING_RECOVERY_POLICY,
} from './xiv-reading-recovery';
import { FileReadingRegisterStore } from './xiv-supervised-reading-cycle.cli';

export { FileReadingRegisterStore };

export const READING_RECOVERY_CLI_GUARDRAILS = Object.freeze({
  localIoOnly: true, // the body file, the register file, the queue file
  noModelCallEver: true, // recovery only re-queues; the re-read is the cycle's door
  noNetworkPrimitive: true, // no fetch, no endpoint literal, no caller import
  remoteCalls: 0,
  modelCalls: 0,
  refusedWithExitTwo: true, // a refusal packet exits 2, verbatim packet
  printsPacketsVerbatim: true,
  oneStoryPerRecovery: true, // the loop is the operator, exactly as the contract pins
  collectsNothing: true,
  learningPromoted: false,
  activated: 0,
  automaticRecovery: false,
  billionUsersProven: false,
  humanDecision: 'REQUIRED' as const,
});

export type RecoveryArgs = Readonly<{
  registerPath: string;
  queuePath: string;
  registerGenesis: string;
  tenantId: string;
  sourceId: string;
  documentId: string;
  title: string;
  bodyPath: string;
  operatorRef: string;
}>;

const FLAG_ORDER = [
  '--register', '--queue', '--genesis', '--tenant',
  '--source', '--document', '--title', '--body', '--operator-ref',
] as const;

/**
 * The exact-flags parser: every flag required, in any order, each
 * exactly once, each with a value. Unknown flags, duplicates, missing
 * values, a short genesis, and any field over the recovery policy's
 * bound refuse.
 */
export function parseRecoveryArgs(argv: readonly string[]): RecoveryArgs {
  if (argv.length !== FLAG_ORDER.length * 2)
    throw new Error(`the recovery command takes exactly ${FLAG_ORDER.length} flags with values (${FLAG_ORDER.join(' ')}); fail closed`);
  const values = new Map<string, string>();
  for (let i = 0; i < argv.length; i += 2) {
    const flag = argv[i]!;
    const value = argv[i + 1]!;
    if (!(FLAG_ORDER as readonly string[]).includes(flag))
      throw new Error(`unknown flag ${flag}; the recovery command takes exactly ${FLAG_ORDER.join(' ')}; fail closed`);
    if (values.has(flag))
      throw new Error(`the flag ${flag} appears more than once; fail closed`);
    if (value.length === 0 || value.startsWith('--'))
      throw new Error(`the flag ${flag} requires a value; fail closed`);
    values.set(flag, value);
  }
  const registerGenesis = values.get('--genesis')!;
  if (registerGenesis.length < 8)
    throw new Error('the register genesis must be at least 8 chars; fail closed');
  const sourceId = values.get('--source')!;
  if (sourceId.length > READING_RECOVERY_POLICY.maxSourceIdChars)
    throw new Error(`the source id exceeds ${READING_RECOVERY_POLICY.maxSourceIdChars} chars; fail closed`);
  const documentId = values.get('--document')!;
  if (documentId.length > READING_RECOVERY_POLICY.maxDocumentIdChars)
    throw new Error(`the document id exceeds ${READING_RECOVERY_POLICY.maxDocumentIdChars} chars; fail closed`);
  const title = values.get('--title')!;
  if (title.length > READING_RECOVERY_POLICY.maxTitleChars)
    throw new Error(`the title exceeds ${READING_RECOVERY_POLICY.maxTitleChars} chars; fail closed`);
  const operatorRef = values.get('--operator-ref')!;
  if (operatorRef.length > READING_RECOVERY_POLICY.maxOperatorRefChars)
    throw new Error(`the operator ref exceeds ${READING_RECOVERY_POLICY.maxOperatorRefChars} chars; fail closed`);
  const args: RecoveryArgs = Object.freeze({
    registerPath: values.get('--register')!,
    queuePath: values.get('--queue')!,
    registerGenesis,
    tenantId: values.get('--tenant')!,
    sourceId,
    documentId,
    title,
    bodyPath: values.get('--body')!,
    operatorRef,
  });
  return args;
}

/** The command body: parse → local read → REAL recovery → verbatim packet. */
export function runRecoveryCommand(argv: readonly string[]): { refused: boolean } {
  const args = parseRecoveryArgs(argv);
  const bodyText = readFileSync(args.bodyPath, 'utf8');
  const register = new FileReadingRegisterStore(args.registerPath) as unknown as ReadingSourceStore;
  const queue = new OfflineStoryQueue(args.queuePath);
  try {
    const packet = recoverFailedReadingChunk(queue, register, args.registerGenesis, {
      tenantId: args.tenantId, sourceId: args.sourceId, documentId: args.documentId,
      title: args.title, bodyText, operatorRef: args.operatorRef,
    });
    console.log(JSON.stringify(packet, null, 2));
    return { refused: packet.kind === 'READING_RECOVERY_REFUSED' };
  } finally {
    queue.close();
  }
}

const IS_MAIN = process.argv[1] !== undefined && process.argv[1].endsWith('xiv-reading-recovery.cli.ts');
if (IS_MAIN) {
  try {
    const { refused } = runRecoveryCommand(process.argv.slice(2));
    if (refused) process.exitCode = 2;
  } catch (err: unknown) {
    // Refusals before the recovery door (parse, local read) print an
    // honest failure — never a silent exit, never a retry.
    console.log(JSON.stringify({
      kind: 'READING_RECOVERY_REFUSED',
      policyVersion: READING_RECOVERY_POLICY.policyVersion,
      reason: err instanceof Error ? err.message : String(err),
      storyState: null,
      modelCalls: 0,
      remoteCalls: 0,
      automaticRecovery: false,
      humanDecision: 'REQUIRED',
    }, null, 2));
    process.exitCode = 2;
  }
}