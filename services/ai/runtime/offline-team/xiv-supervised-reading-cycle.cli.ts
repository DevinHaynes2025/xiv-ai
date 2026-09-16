// 12D-284 — SUPERVISED READING CYCLE CLI (the operator's one-chunk door).
//
// The 12D-283 contract is the fail-closed heart; THIS is the operator's
// command-line door to it: one invocation reads ONE chunk of ONE local
// document through the REAL chain (12D-274 ingest → 12D-277/278 bound
// admission to an already-registered source → 12D-280 first reader) and
// STOPS before review. The standing loop is the operator re-running
// this command — nothing waits, nothing polls, nothing retries.
//
// Fail-closed discipline:
//   * EXACT ARGS: every flag is required exactly once; unknown,
//     duplicate, or missing flags refuse; the genesis must be ≥ 8
//     chars; the title ≤ 256 chars (the cycle's own policy bounds).
//   * LOCAL I/O ONLY: the body is read from a LOCAL file path; the
//     register and the queue live in LOCAL files the operator names;
//     the model call is the loopback Ollama at the 12D-280 policy's
//     pinned endpoint with the pinned model name — remoteCalls stay 0
//     (loopback is not remote). Nothing is uploaded anywhere.
//   * THE CYCLE NEVER THROWS (12D-283): a refusal packet prints with
//     exit code 2 and a MEASURED reason; a verified packet prints with
//     exit code 0. Both packets are printed verbatim — the CLI adds
//     nothing, hides nothing.
//   * The credential-shaped-content gate and every other gate live in
//     the REAL contracts; this CLI re-implements none of them.
//
// Pure parse: parseSupervisedCycleArgs is exported for the adversarial
// suite; FileReadingRegisterStore is exported so the register path is
// the operator's own file, round-trippable and testable.
import { readFileSync, writeFileSync } from 'node:fs';
import { OfflineStoryQueue } from './offline-story-queue';
import type { ReadingSourceStore } from './xiv-reading-source-register';
import {
  runSupervisedReadingCycle,
  SUPERVISED_READING_CYCLE_POLICY,
} from './xiv-supervised-reading-cycle';

export const SUPERVISED_READING_CYCLE_CLI_GUARDRAILS = Object.freeze({
  localIoOnly: true, // the body file, the register file, the queue file
  loopbackCallerOnly: true, // 12D-280's pinned endpoint + model name
  remoteCalls: 0,
  modelCallsCountedNotPinnedZero: true,
  refusesWithExitTwo: true, // a refusal packet exits 2, verbatim packet
  printsPacketsVerbatim: true,
  collectsNothing: true,
  learningPromoted: false,
  activated: 0,
  automaticRecovery: false,
  billionUsersProven: false,
  humanDecision: 'REQUIRED' as const,
});

export type SupervisedCycleArgs = Readonly<{
  registerPath: string;
  queuePath: string;
  registerGenesis: string;
  tenantId: string;
  sourceId: string;
  documentId: string;
  title: string;
  bodyPath: string;
}>;

const FLAG_ORDER = [
  '--register', '--queue', '--genesis', '--tenant',
  '--source', '--document', '--title', '--body',
] as const;

/**
 * The exact-flags parser: every flag required, in any order, each
 * exactly once, each with a value. Unknown flags, duplicates, missing
 * values, and a short genesis refuse.
 */
export function parseSupervisedCycleArgs(argv: readonly string[]): SupervisedCycleArgs {
  if (argv.length !== FLAG_ORDER.length * 2)
    throw new Error(`the cycle command takes exactly ${FLAG_ORDER.length} flags with values (${FLAG_ORDER.join(' ')}); fail closed`);
  const values = new Map<string, string>();
  for (let i = 0; i < argv.length; i += 2) {
    const flag = argv[i]!;
    const value = argv[i + 1]!;
    if (!(FLAG_ORDER as readonly string[]).includes(flag))
      throw new Error(`unknown flag ${flag}; the cycle command takes exactly ${FLAG_ORDER.join(' ')}; fail closed`);
    if (values.has(flag))
      throw new Error(`the flag ${flag} appears more than once; fail closed`);
    if (value.length === 0 || value.startsWith('--'))
      throw new Error(`the flag ${flag} requires a value; fail closed`);
    values.set(flag, value);
  }
  const registerGenesis = values.get('--genesis')!;
  if (registerGenesis.length < 8)
    throw new Error('the register genesis must be at least 8 chars; fail closed');
  const title = values.get('--title')!;
  if (title.length > SUPERVISED_READING_CYCLE_POLICY.maxTitleChars)
    throw new Error(`the title exceeds ${SUPERVISED_READING_CYCLE_POLICY.maxTitleChars} chars; fail closed`);
  const args: SupervisedCycleArgs = Object.freeze({
    registerPath: values.get('--register')!,
    queuePath: values.get('--queue')!,
    registerGenesis,
    tenantId: values.get('--tenant')!,
    sourceId: values.get('--source')!,
    documentId: values.get('--document')!,
    title,
    bodyPath: values.get('--body')!,
  });
  return args;
}

/**
 * The operator's file-backed register store: the register lives in the
 * JSON file the operator names; save writes through (the register is
 * durable; the CYCLE never saves — a bind issues a receipt only).
 */
export class FileReadingRegisterStore {
  private readonly path: string;
  private lines: string[] | null = null;
  constructor(path: string) {
    if (typeof path !== 'string' || path.length === 0)
      throw new Error('a register file path is required; fail closed');
    this.path = path;
  }
  load(): readonly string[] | null {
    if (this.lines !== null) return this.lines;
    try { this.lines = JSON.parse(readFileSync(this.path, 'utf8')) as string[]; }
    catch { this.lines = null; }
    return this.lines;
  }
  save(lines: readonly string[]): void {
    this.lines = [...lines];
    writeFileSync(this.path, JSON.stringify(this.lines), 'utf8');
  }
}

/**
 * The loopback caller: the ONLY network-adjacent code in the whole
 * rung, pinned to the 12D-280 policy's loopback endpoint and model
 * name. remoteCalls stay 0 — loopback is not remote.
 */
export function buildLoopbackCaller(): (prompt: string) => Promise<{ model: string; response: string }> {
  return async (prompt: string) => {
    const res = await fetch(`http://${OLLAMA_LOOPBACK}/api/generate`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ model: OLLAMA_MODEL, prompt, stream: false, options: { temperature: 0 } }),
    });
    if (!res.ok) throw new Error(`ollama returned HTTP ${res.status}`);
    const data = JSON.parse(await res.text()) as { response?: string };
    return { model: OLLAMA_MODEL, response: String(data.response ?? '') };
  };
}

const OLLAMA_LOOPBACK = '127.0.0.1:11434';
const OLLAMA_MODEL = 'qwen2.5-coder:7b';

/** The command body: parse → local read → REAL cycle → verbatim packet. */
export async function runSupervisedCycleCommand(argv: readonly string[]): Promise<{ refused: boolean }> {
  const args = parseSupervisedCycleArgs(argv);
  const bodyText = readFileSync(args.bodyPath, 'utf8');
  const register = new FileReadingRegisterStore(args.registerPath) as unknown as ReadingSourceStore;
  const queue = new OfflineStoryQueue(args.queuePath);
  try {
    const packet = await runSupervisedReadingCycle(queue, register, args.registerGenesis, {
      tenantId: args.tenantId, sourceId: args.sourceId, documentId: args.documentId,
      title: args.title, bodyText,
    }, buildLoopbackCaller());
    console.log(JSON.stringify(packet, null, 2));
    return { refused: packet.kind === 'SUPERVISED_READING_CYCLE_REFUSED' };
  } finally {
    queue.close();
  }
}

const IS_MAIN = process.argv[1] !== undefined && process.argv[1].endsWith('xiv-supervised-reading-cycle.cli.ts');
if (IS_MAIN) {
  runSupervisedCycleCommand(process.argv.slice(2))
    .then(({ refused }) => {
      if (refused) process.exitCode = 2;
    })
    .catch((err: unknown) => {
      // Refusals before the cycle door (parse, local read) print an
      // honest failure — never a silent exit, never a retry.
      console.log(JSON.stringify({
        kind: 'SUPERVISED_READING_CYCLE_REFUSED',
        policyVersion: SUPERVISED_READING_CYCLE_POLICY.policyVersion,
        reason: err instanceof Error ? err.message : String(err),
        storyState: null,
        modelCalls: 0,
        remoteCalls: 0,
        activated: 0,
        learningPromoted: false,
        humanDecision: 'REQUIRED',
      }, null, 2));
      process.exitCode = 2;
    });
}