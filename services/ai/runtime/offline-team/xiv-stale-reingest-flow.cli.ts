// 12D-321 — Stale-Re-ingestion Flow CLI: the ONE-invocation operator
// flow the 12D-316 handoff named as its next candidate — staleness
// assessment → plan derivation → the REAL admission doors — in the
// 12D-296 CLI discipline (executor, not decider; one plan per
// invocation; LOCAL plane only).
//
//   node xiv-stale-reingest-flow.cli.ts --queue=<path> --register=<path>
//     --genesis=<genesis> --source=<id> --memory=<packet-path>
//     --digests=<digests-path> --document=<stale-id>
//     --new-document=<successor-id> --new-title=<title> --new-body=<path>
//
// The chain, every stage a REAL door (called, never re-implemented):
//   1. THE REAL 12D-316 plan (prepareStaleReingestPlan) re-derives the
//      staleness through the REAL 12D-315 contract, requires a STALE
//      row, checks the successor id is genuinely new, and produces the
//      stories through the REAL 12D-274 ingest door. A REFUSED plan
//      (CURRENT/UNCHECKED source, colliding id, tampered packet,
//      secret-shaped input) ends the invocation with NOTHING admitted.
//   2. THE PREPARED DIGEST IS RE-DERIVED, NEVER TRUSTED: the CLI
//      re-runs the REAL 12D-274 door over the plan packet's OWN
//      newBodyText and refuses unless the re-derived digest, chunk
//      count and story ids match the plan packet's claims — a tampered
//      plan packet cannot launder a different document through.
//   3. THE REAL 12D-278 BOUND ADMISSION BRIDGE admits the re-derived
//      prepared result — the binding is re-derived from the register
//      chain bytes and cross-gated against the prepared digest/tenant/
//      document id, and the REAL 12D-275 door (provenance REQUIRED, the
//      12D-295 adoption) does the queue admission itself.
//
// Fail-closed by construction:
//   * Exact args: exactly the ten flags, each exactly once, each with a
//     value; unknown/duplicate/missing flags refuse. NO TENANT FLAG —
//     the tenant comes from the verified memory packet, never the
//     operator's word. No digest flag anywhere in the chain.
//   * THE CLI NEVER REGISTERS (read-only store, save throws) and NEVER
//     DECIDES: admission is the doors' contract; the CLI prints the
//     chained receipt.
//   * LOCAL I/O only: modelCalls 0, no network primitive, remoteCalls 0.
//   * A refusal prints the door's own message verbatim and exits 2 —
//     nothing was admitted, nothing was partially written.
import { readFileSync } from 'node:fs';
import { pathToFileURL } from 'url';
import { DOCUMENT_INGEST_POLICY, prepareDocumentStories } from './xiv-document-ingest';
import { OfflineStoryQueue } from './offline-story-queue';
import { admitBoundReading } from './xiv-bound-admission';
import {
  STALE_REINGEST_PLAN_POLICY, prepareStaleReingestPlan,
} from './xiv-stale-reingest-plan';
import {
  readSourceRegisterEntries, type ReadingSourceStore,
} from './xiv-reading-source-register';

export const STALE_REINGEST_FLOW_CLI_POLICY = Object.freeze({
  policyVersion: '12d-321-v1',
  domain: 'XIV_OS_STALE_REINGEST_FLOW_CLI',
  flagOrder: ['--queue', '--register', '--genesis', '--source', '--memory', '--digests', '--document', '--new-document', '--new-title', '--new-body'] as const,
});

export const STALE_REINGEST_FLOW_CLI_GUARDRAILS = Object.freeze({
  oneFlowPerInvocation: true, // staleness → plan → admission, ONE plan per invocation
  everyStageIsARealDoor: true, // 12D-316 plan (12D-315 re-derivation + 12D-274 stories) → 12D-278 bridge → 12D-275 door
  digestReDerivedNeverTrusted: true, // the prepared result is re-derived from the plan packet's OWN bytes
  tenantFromTheVerifiedPacket: true, // NO tenant flag — the packet's tenant is the truth
  staleOnly: true, // a CURRENT/UNCHECKED source is "nothing to re-ingest"
  registersNothing: true, // the CLI's register store is READ-ONLY (save throws)
  executorNotDecider: true,
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
const HEX64_RE = /^[0-9a-f]{64}$/;

export type StaleReingestFlowArgs = Readonly<{
  queue: string;
  register: string;
  genesis: string;
  source: string;
  memory: string;
  digests: string;
  document: string;
  newDocument: string;
  newTitle: string;
  newBody: string;
}>;

/** Strict arg parsing: exactly the ten flags, in any order, each once, each valued. */
export function parseStaleReingestFlowArgs(argv: readonly string[]): StaleReingestFlowArgs {
  if (argv.length !== STALE_REINGEST_FLOW_CLI_POLICY.flagOrder.length * 2)
    throw new Error(`expected exactly ${STALE_REINGEST_FLOW_CLI_POLICY.flagOrder.length} flags each with a value (${STALE_REINGEST_FLOW_CLI_POLICY.flagOrder.join(' ')}); fail closed`);
  const seen = new Map<string, string>();
  for (let i = 0; i < argv.length; i += 2) {
    const flag = argv[i]!;
    const value = argv[i + 1];
    if (!(STALE_REINGEST_FLOW_CLI_POLICY.flagOrder as readonly string[]).includes(flag))
      throw new Error(`unknown flag ${flag}; use only ${STALE_REINGEST_FLOW_CLI_POLICY.flagOrder.join(' ')}; fail closed`);
    if (typeof value !== 'string' || value.length === 0)
      throw new Error(`flag ${flag} requires a value; fail closed`);
    if (seen.has(flag))
      throw new Error(`duplicate flag ${flag}; fail closed`);
    seen.set(flag, value);
  }
  const queue = seen.get('--queue')!;
  const register = seen.get('--register')!;
  const genesis = seen.get('--genesis')!;
  const source = seen.get('--source')!;
  const memory = seen.get('--memory')!;
  const digests = seen.get('--digests')!;
  const document = seen.get('--document')!;
  const newDocument = seen.get('--new-document')!;
  const newTitle = seen.get('--new-title')!;
  const newBody = seen.get('--new-body')!;
  if (!ID_RE.test(source)) throw new Error('the source id is malformed (<= 128 chars: letters, digits, _ . : -); fail closed');
  if (!ID_RE.test(document)) throw new Error('the stale document id is malformed (<= 128 chars: letters, digits, _ . : -); fail closed');
  if (!ID_RE.test(newDocument)) throw new Error('the successor document id is malformed (<= 128 chars: letters, digits, _ . : -); fail closed');
  if (genesis.length < 8) throw new Error('the register genesis must be a string of at least 8 chars; fail closed');
  if (newTitle.length < 1 || newTitle.length > DOCUMENT_INGEST_POLICY.maxTitleChars)
    throw new Error(`the successor title must be bounded (1..${DOCUMENT_INGEST_POLICY.maxTitleChars} chars); fail closed`);
  return Object.freeze({ queue, register, genesis, source, memory, digests, document, newDocument, newTitle, newBody });
}

/** A READ-ONLY register store: the flow binds against the register, it never writes one. */
export class ReadOnlyFlowRegisterStore implements ReadingSourceStore {
  private readonly lines: readonly string[];
  constructor(lines: readonly string[]) { this.lines = Object.freeze([...lines]); }
  load(): readonly string[] | null { return this.lines; }
  save(_lines: readonly string[]): void { throw new Error('a re-ingestion flow never writes a register; registration is the supervised 12D-276 step; fail closed'); }
}

export type StaleReingestFlowPacket = Readonly<{
  kind: 'STALE_REINGEST_ADMITTED';
  policyVersion: string;
  tenantId: string;
  sourceId: string;
  lineage: Readonly<{
    staleDocumentId: string;
    previousDigestHead: string;
    currentDigestHead: string;
    newDocumentId: string;
    newDigestSha256: string;
    chunkCount: number;
  }>;
  registerEntries: number;
  admission: Readonly<{ prepared: number; inserted: number; duplicates: number }>;
  binding: Readonly<{ kind: string; sourceId: string; sourceClass: string; sourceEntryDigestSha256: string }>;
  modelCalls: 0;
  remoteCalls: 0;
  activated: 0;
  learningPromoted: false;
  stoppedBefore: string;
  humanDecision: 'REQUIRED';
}>;

export type StaleReingestFlowRefused = Readonly<{
  kind: 'STALE_REINGEST_FLOW_REFUSED';
  policyVersion: string;
  reason: string;
  modelCalls: 0;
  remoteCalls: 0;
  activated: 0;
  learningPromoted: false;
  humanDecision: 'REQUIRED';
}>;

function refuse(reason: string): StaleReingestFlowRefused {
  return Object.freeze({
    kind: 'STALE_REINGEST_FLOW_REFUSED' as const,
    policyVersion: STALE_REINGEST_FLOW_CLI_POLICY.policyVersion,
    reason,
    modelCalls: 0 as const, remoteCalls: 0 as const,
    activated: 0 as const, learningPromoted: false as const,
    humanDecision: 'REQUIRED' as const,
  });
}

/**
 * One CLI invocation = the whole flow. Loads the LOCAL files (memory
 * packet, current digests, successor body, register), runs the REAL
 * 12D-316 plan, RE-DERIVES the prepared result through the REAL 12D-274
 * door from the plan packet's own bytes, and submits through the REAL
 * 12D-278 bridge. Prints the chained receipt; a refusal at ANY stage
 * returns the REFUSED packet with the door's own message verbatim —
 * nothing was admitted, nothing was partially written.
 */
export function runStaleReingestFlowCommand(argv: readonly string[]): StaleReingestFlowPacket | StaleReingestFlowRefused {
  const args = parseStaleReingestFlowArgs(argv);
  // LOCAL reads, bounded and parsed fail-closed — nothing is admitted
  // by a read failure.
  let memoryPacket: unknown;
  try {
    memoryPacket = JSON.parse(readFileSync(args.memory, 'utf8')) as unknown;
  } catch {
    return refuse('the memory packet file is unreadable or is not valid JSON; NOTHING was admitted; fail closed');
  }
  let digestsFile: unknown;
  try {
    digestsFile = JSON.parse(readFileSync(args.digests, 'utf8')) as unknown;
  } catch {
    return refuse('the digests file is unreadable or is not valid JSON; NOTHING was admitted; fail closed');
  }
  if (!Array.isArray(digestsFile) || digestsFile.length < 1 || digestsFile.length > 64)
    return refuse('the digests file must be a JSON array of 1..64 {documentId, digestSha256} entries; NOTHING was admitted; fail closed');
  for (const entry of digestsFile) {
    if (entry === null || typeof entry !== 'object' || Array.isArray(entry))
      return refuse('each digests entry must be an object; NOTHING was admitted; fail closed');
    const ek = Object.keys(entry as Record<string, unknown>);
    if (ek.length !== 2 || ek[0] !== 'documentId' || ek[1] !== 'digestSha256')
      return refuse('each digests entry must have exactly the keys [documentId, digestSha256] in order; NOTHING was admitted; fail closed');
    const e = entry as Readonly<Record<string, unknown>>;
    if (typeof e.documentId !== 'string' || !ID_RE.test(e.documentId)
      || typeof e.digestSha256 !== 'string' || !HEX64_RE.test(e.digestSha256))
      return refuse('each digests entry needs an id-shaped documentId and a hex64 digestSha256; NOTHING was admitted; fail closed');
  }
  let bodyText: string;
  try {
    bodyText = readFileSync(args.newBody, 'utf8');
  } catch {
    return refuse('the successor body file is unreadable; NOTHING was admitted; fail closed');
  }
  if (bodyText.length > DOCUMENT_INGEST_POLICY.maxDocumentChars)
    return refuse(`the successor body file exceeds ${DOCUMENT_INGEST_POLICY.maxDocumentChars} chars; chunk the document deliberately first; NOTHING was admitted; fail closed`);
  // MEASURED, CHAIN-VALIDATED register census for the receipt (a
  // tampered middle line refuses HERE, before the queue is even opened).
  let registerLines: unknown;
  try {
    registerLines = JSON.parse(readFileSync(args.register, 'utf8')) as unknown;
  } catch {
    return refuse('the register file is unreadable or is not valid JSON; NOTHING was admitted; fail closed');
  }
  if (!Array.isArray(registerLines) || !registerLines.every((l) => typeof l === 'string'))
    return refuse('the register file must be a JSON array of register lines; NOTHING was admitted; fail closed');
  const flowStore = new ReadOnlyFlowRegisterStore(registerLines as readonly string[]);
  let registerEntries: number;
  try {
    registerEntries = readSourceRegisterEntries(flowStore, args.genesis).length;
  } catch (err) {
    return refuse(`${err instanceof Error ? err.message : String(err)} NOTHING was admitted`);
  }
  // STAGE 1 — THE REAL 12D-316 PLAN (staleness re-derived through the
  // REAL 12D-315 contract; stories produced by the REAL 12D-274 door).
  // The digests array is passed IN FILE ORDER — the plan validates every
  // entry itself; the CLI never re-sorts or filters it.
  const plan = prepareStaleReingestPlan({
    memoryPacket,
    currentDigests: digestsFile,
    staleDocumentId: args.document,
    newDocumentId: args.newDocument,
    newTitle: args.newTitle,
    newBodyText: bodyText,
  });
  if (plan.status === 'REFUSED') {
    return refuse(`PLAN REFUSED — ${plan.reason}`);
  }
  if (plan.status !== 'PREPARED')
    return refuse('the plan derivation returned an unknown status; fail closed');
  // STAGE 2 — THE PREPARED RESULT IS RE-DERIVED, NEVER TRUSTED: the
  // REAL 12D-274 door re-runs over the plan packet's OWN bytes; a
  // tampered plan packet (digest, chunk count or story ids edited in
  // flight) refuses HERE.
  const prepared = prepareDocumentStories({
    tenantId: plan.tenantId,
    documentId: plan.newDocumentId,
    title: plan.newTitle,
    bodyText: plan.newBodyText,
  });
  const reStoryIds = prepared.stories.map((s) => s.id);
  const planStoryIds = plan.stories.map((s) => s.id);
  if (prepared.documentDigestSha256 !== plan.newDigestSha256
    || prepared.chunkCount !== plan.chunkCount
    || JSON.stringify(reStoryIds) !== JSON.stringify(planStoryIds))
    return refuse('the plan packet does not match its own re-derived derivation (digest, chunk count or story ids differ); a tampered plan cannot admit; fail closed');
  // STAGE 3 — THE REAL 12D-278 BOUND ADMISSION BRIDGE (the REAL 12D-275
  // door does the queue admission; the binding is re-derived from the
  // register chain and cross-gated against the prepared identity).
  const queue = new OfflineStoryQueue(args.queue);
  try {
    let admission;
    try {
      admission = admitBoundReading(queue, flowStore, args.genesis, prepared, {
        tenantId: plan.tenantId,
        sourceId: args.source,
        documentId: plan.newDocumentId,
        documentDigestSha256: prepared.documentDigestSha256,
      });
    } catch (err) {
      // A door refusal travels as a REFUSED packet with the door's own
      // message verbatim — never a silent success, never a partial write.
      return refuse(`ADMISSION REFUSED — ${err instanceof Error ? err.message : String(err)}`);
    }
    return Object.freeze({
      kind: 'STALE_REINGEST_ADMITTED' as const,
      policyVersion: STALE_REINGEST_FLOW_CLI_POLICY.policyVersion,
      tenantId: plan.tenantId,
      sourceId: args.source,
      lineage: {
        staleDocumentId: plan.staleDocumentId,
        previousDigestHead: plan.previousDigestHead,
        currentDigestHead: plan.currentDigestHead,
        newDocumentId: plan.newDocumentId,
        newDigestSha256: prepared.documentDigestSha256,
        chunkCount: prepared.chunkCount,
      },
      registerEntries,
      admission: admission.admission,
      binding: {
        kind: admission.binding.kind,
        sourceId: admission.binding.sourceId,
        sourceClass: admission.binding.sourceClass,
        sourceEntryDigestSha256: admission.binding.sourceEntryDigestSha256,
      },
      modelCalls: 0 as const, remoteCalls: 0 as const,
      activated: 0 as const, learningPromoted: false as const,
      stoppedBefore: 'the successor stories are ADMITTED (12D-275) but never claimed, settled, reviewed or promoted here — the supervised cycle and the operator decide',
      humanDecision: 'REQUIRED' as const,
    });
  } finally {
    queue.close();
  }
}

/** The daemon-free entrypoint: one packet, exit 2 on refusal. */
export function mainStaleReingestFlowCli(argv: readonly string[]): void {
  try {
    const packet = runStaleReingestFlowCommand(argv);
    process.stdout.write(`${JSON.stringify(packet, null, 2)}\n`);
    if (packet.kind === 'STALE_REINGEST_FLOW_REFUSED') process.exitCode = 2;
  } catch (err) {
    process.stdout.write(`${JSON.stringify({
      kind: 'STALE_REINGEST_FLOW_REFUSED',
      policyVersion: STALE_REINGEST_FLOW_CLI_POLICY.policyVersion,
      reason: err instanceof Error ? err.message : String(err),
      modelCalls: 0, remoteCalls: 0,
      activated: 0, learningPromoted: false,
      humanDecision: 'REQUIRED',
    }, null, 2)}\n`);
    process.exitCode = 2;
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  mainStaleReingestFlowCli(process.argv.slice(2).filter((a): a is string => typeof a === 'string'));
}