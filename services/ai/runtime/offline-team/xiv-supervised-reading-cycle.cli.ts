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
// 12D-289: the loopback caller lives in its OWN module (authorized in
// the 12D-113 audit's AUTHORIZED_NETWORK_SURFACES) — this guardrails
// module carries NO network primitive (guardrails-no-network).
import { buildLoopbackCaller } from './xiv-reading-loopback-caller';
import { buildMultiModelCallerDeclared } from './xiv-reading-multi-model-caller';

export { buildLoopbackCaller, READING_LOOPBACK_CALLER_POLICY } from './xiv-reading-loopback-caller';

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
  /** 12D-397: optional operator declaration — run the reading cycle
   *  through the DECLARED multi-model caller (12D-386: pinned primary
   *  qwen2.5-coder:7b FIRST, then the declared local fallback
   *  qwen2.5:3b once; loopback only, never a remote fallback). Default
   *  false: the single pinned primary — today's behavior. */
  declaredFailover: boolean;
}>;

const FLAG_ORDER = [
  '--register', '--queue', '--genesis', '--tenant',
  '--source', '--document', '--title', '--body',
] as const;
/** The ONE optional operator flag (12D-397): value must be true|false. */
const OPTIONAL_FAILOVER_FLAG = '--declaredFailover' as const;

/**
 * The exact-flags parser: every flag required, in any order, each
 * exactly once, each with a value. Unknown flags, duplicates, missing
 * values, and a short genesis refuse.
 */
export function parseSupervisedCycleArgs(argv: readonly string[]): SupervisedCycleArgs {
  const optionalPair = argv.length === FLAG_ORDER.length * 2 + 2
    && argv[argv.length - 2] === OPTIONAL_FAILOVER_FLAG;
  if (argv.length !== FLAG_ORDER.length * 2 && argv.length !== FLAG_ORDER.length * 2 + 2)
    throw new Error(`the cycle command takes exactly ${FLAG_ORDER.length} flags with values (plus optionally ${OPTIONAL_FAILOVER_FLAG} true|false); fail closed`);
  const values = new Map<string, string>();
  const pairs = optionalPair ? argv.slice(0, argv.length - 2) : argv;
  let declaredFailover = false;
  for (let i = 0; i < pairs.length; i += 2) {
    const flag = argv[i]!;
    const value = argv[i + 1]!;
    if (!(FLAG_ORDER as readonly string[]).includes(flag))
      throw new Error(`unknown flag ${flag}; the cycle command takes exactly ${FLAG_ORDER.join(' ')} (plus optionally ${OPTIONAL_FAILOVER_FLAG} true|false); fail closed`);
    if (values.has(flag))
      throw new Error(`the flag ${flag} appears more than once; fail closed`);
    if (value.length === 0 || value.startsWith('--'))
      throw new Error(`the flag ${flag} requires a value; fail closed`);
    values.set(flag, value);
  }
  if (optionalPair) {
    const v = argv[argv.length - 1]!;
    if (v !== 'true' && v !== 'false')
      throw new Error(`the ${OPTIONAL_FAILOVER_FLAG} flag accepts exactly true or false; fail closed`);
    declaredFailover = v === 'true';
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
    declaredFailover,
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
 * The loopback caller: moved to its own module in 12D-289 (the 12D-113
 * audit's guardrails-no-network invariant) — re-exported here for the
 * operator's import stability. Pinned to the 12D-280 policy's loopback
 * endpoint and model name; remoteCalls stay 0 — loopback is not remote.
 */

/** The command body: parse → local read → REAL cycle → verbatim packet. */
export async function runSupervisedCycleCommand(argv: readonly string[]): Promise<{ refused: boolean }> {
  const args = parseSupervisedCycleArgs(argv);
  const bodyText = readFileSync(args.bodyPath, 'utf8');
  const register = new FileReadingRegisterStore(args.registerPath) as unknown as ReadingSourceStore;
  const queue = new OfflineStoryQueue(args.queuePath);
  try {
    // 12D-397: the DECLARED caller (pinned primary first, then the
    // declared local fallback once) when the operator passes
    // --declaredFailover true; otherwise the single pinned primary —
    // today's behavior. Both are loopback-only; remoteCalls stay 0.
    // LIVE-MEASURED (12D-397): the 12D-280 reader verifies the caller
    // result has EXACTLY the keys [model, response] in order, while the
    // 12D-386 declared caller adds candidateIndex for its own provenance
    // tests — so a thin adapter drops candidateIndex. The settled model
    // name still flows in .model (what the packet reports), and the
    // reader's fail-closed shape gate is NOT loosened.
    const declared = args.declaredFailover ? buildMultiModelCallerDeclared() : null;
    const caller = declared
      ? async (prompt: string) => {
          const r = await declared(prompt);
          return { model: r.model, response: r.response };
        }
      : buildLoopbackCaller();
    const packet = await runSupervisedReadingCycle(queue, register, args.registerGenesis, {
      tenantId: args.tenantId, sourceId: args.sourceId, documentId: args.documentId,
      title: args.title, bodyText,
    }, caller);
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