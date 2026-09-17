// 12D-296 — Bound Admission CLI: the operator's executor surface for the
// 12D-295 ADOPTED door, in the 12D-294 CLI discipline (12D-238 CLI
// pattern applied to the bound-admission chain). ONE document per
// invocation, operator-invoked, non-daemonic, LOCAL plane only.
//
//   node xiv-bound-admission.cli.ts --queue=<path> --register=<path>
//     --genesis=<genesis> --source=<id> --tenant=<id> --document=<id>
//     --title=<title> --body=<path>
//
// The CONTRACT is the ADOPTED door itself (12D-295): prepareDocumentStories
// derives the REAL document digest FROM THE TEXT ON DISK (never an
// operator claim), then admitReadingStories requires provenance — the
// registered source, the register genesis — re-derives the binding from
// the register chain bytes, and admits through the REAL queue contract.
// NO REGISTER, NO BINDING, NO ADMISSION is structural here too: there is
// NO flag to bypass provenance.
//
// Fail-closed by construction:
//   * Exact args: exactly the eight flags, each exactly once, each with
//     a value; unknown/duplicate/missing flags refuse. Ids are <= 128
//     chars; the genesis >= 8 chars; the title bounded to the ingest
//     contract's 200; the body file bounded to the ingest contract's
//     100,000 chars (the door refuses oversize anyway — the CLI refuses
//     earlier, without reading further).
//   * THE CLI NEVER REGISTERS: the register store it builds is
//     READ-ONLY (save throws). Registering a source is the separate
//     supervised 12D-276 step; an admission invocation cannot register
//     its way past the provenance gate.
//   * THE DIGEST IS RE-DERIVED, NEVER CLAIMED: the CLI has no flag for a
//     document digest — the digest comes from prepareDocumentStories
//     reading the body bytes. An operator cannot state a digest here.
//   * LOCAL I/O only: the queue, the register file, and the body file
//     are opened from local disk; the CLI NEVER calls a model
//     (modelCalls 0), carries NO network primitive (no fetch, no
//     endpoint literal, no caller import), and NEVER touches remote
//     anything (remoteCalls 0).
//   * Every packet carries the honest flags; a refusal exits 2, with
//     the door's own refusal message verbatim when the door refused.
//   * The CLI is one document per invocation: batching is the operator
//     re-running the command (the 12D-284/292 discipline).
import { readFileSync } from 'node:fs';
import { pathToFileURL } from 'url';
import { DOCUMENT_INGEST_POLICY, prepareDocumentStories } from './xiv-document-ingest';
import { OfflineStoryQueue } from './offline-story-queue';
import { admitReadingStories } from './xiv-reading-admission';
import {
  readSourceRegisterEntries, type ReadingSourceStore,
} from './xiv-reading-source-register';

export const BOUND_ADMISSION_CLI_POLICY = Object.freeze({
  policyVersion: '12d-296-v1',
  domain: 'XIV_OS_BOUND_ADMISSION_CLI',
  flagOrder: ['--queue', '--register', '--genesis', '--source', '--tenant', '--document', '--title', '--body'] as const,
});

export const BOUND_ADMISSION_CLI_GUARDRAILS = Object.freeze({
  localIoOnly: true,
  noModelCallEver: true,
  noNetworkPrimitive: true,
  remoteCalls: 0,
  modelCalls: 0,
  executorNotDecider: true, // the operator invokes; the doors decide by contract
  provenanceRequired: true, // the 12D-295 adopted door — there is NO bypass flag
  reDerivesDigestFromTheText: true, // the digest is prepareDocumentStories', never an operator claim
  registersNothing: true, // the CLI's register store is READ-ONLY (save throws)
  oneDocumentPerInvocation: true,
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

export type BoundAdmissionArgs = Readonly<{
  queue: string;
  register: string;
  genesis: string;
  source: string;
  tenant: string;
  document: string;
  title: string;
  body: string;
}>;

/** Strict arg parsing: exactly the eight flags, in any order, each once, each valued. */
export function parseAdmissionArgs(argv: readonly string[]): BoundAdmissionArgs {
  if (argv.length !== BOUND_ADMISSION_CLI_POLICY.flagOrder.length * 2)
    throw new Error(`expected exactly ${BOUND_ADMISSION_CLI_POLICY.flagOrder.length} flags each with a value (${BOUND_ADMISSION_CLI_POLICY.flagOrder.join(' ')}); fail closed`);
  const seen = new Map<string, string>();
  for (let i = 0; i < argv.length; i += 2) {
    const flag = argv[i]!;
    const value = argv[i + 1];
    if (!(BOUND_ADMISSION_CLI_POLICY.flagOrder as readonly string[]).includes(flag))
      throw new Error(`unknown flag ${flag}; use only ${BOUND_ADMISSION_CLI_POLICY.flagOrder.join(' ')}; fail closed`);
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
  const tenant = seen.get('--tenant')!;
  const document = seen.get('--document')!;
  const title = seen.get('--title')!;
  const body = seen.get('--body')!;
  if (!ID_RE.test(source)) throw new Error('the source id is malformed (<= 128 chars: letters, digits, _ . : -); fail closed');
  if (!ID_RE.test(tenant)) throw new Error('the tenant id is malformed (<= 128 chars: letters, digits, _ . : -); fail closed');
  if (!ID_RE.test(document)) throw new Error('the document id is malformed (<= 128 chars: letters, digits, _ . : -); fail closed');
  if (genesis.length < 8) throw new Error('the register genesis must be a string of at least 8 chars; fail closed');
  if (title.length < 1 || title.length > DOCUMENT_INGEST_POLICY.maxTitleChars)
    throw new Error(`the title must be bounded (1..${DOCUMENT_INGEST_POLICY.maxTitleChars} chars); fail closed`);
  return Object.freeze({ queue, register, genesis, source, tenant, document, title, body });
}

/** A READ-ONLY register store: the CLI binds against the register, it never writes one. */
export class ReadOnlyRegisterStore implements ReadingSourceStore {
  private readonly lines: readonly string[];
  constructor(lines: readonly string[]) { this.lines = Object.freeze([...lines]); }
  load(): readonly string[] | null { return this.lines; }
  save(_lines: readonly string[]): void { throw new Error('an admission CLI never writes a register; registration is the supervised 12D-276 step; fail closed'); }
}

export type BoundAdmissionPacket = Readonly<{
  kind: 'BOUND_ADMITTED';
  policyVersion: string;
  tenantId: string;
  documentId: string;
  sourceId: string;
  documentDigestSha256: string;
  registerEntries: number;
  admission: Readonly<{ prepared: number; inserted: number; duplicates: number }>;
  binding: Readonly<{ kind: string; sourceId: string; sourceClass: string; sourceEntryDigestSha256: string }>;
  modelCalls: 0;
  remoteCalls: 0;
  activated: 0;
  learningPromoted: false;
  humanDecision: 'REQUIRED';
}>;

export type BoundAdmissionRefused = Readonly<{
  kind: 'BOUND_ADMISSION_REFUSED';
  policyVersion: string;
  reason: string;
  modelCalls: 0;
  remoteCalls: 0;
  activated: 0;
  learningPromoted: false;
  humanDecision: 'REQUIRED';
}>;

/**
 * One CLI invocation. Loads the LOCAL register file (a JSON array of
 * register lines), derives the document digest FROM THE BODY TEXT via
 * the REAL ingest contract, and runs the REAL adopted door
 * (admitReadingStories — 12D-295, provenance REQUIRED, binding
 * re-derived from the chain). Prints the packet verbatim; throws on
 * refusal — mainBoundAdmissionCli turns that into the refusal packet
 * (exit 2) with the door's own message verbatim.
 */
export function runBoundAdmissionCommand(argv: readonly string[]): BoundAdmissionPacket | BoundAdmissionRefused {
  const args = parseAdmissionArgs(argv);
  // LOCAL reads, bounded and parsed fail-closed.
  let registerLines: unknown;
  try {
    registerLines = JSON.parse(readFileSync(args.register, 'utf8')) as unknown;
  } catch {
    return refuse('the register file is unreadable or is not valid JSON; NOTHING was admitted; fail closed');
  }
  if (!Array.isArray(registerLines) || !registerLines.every((l) => typeof l === 'string'))
    return refuse('the register file must be a JSON array of register lines; NOTHING was admitted; fail closed');
  let bodyText: string;
  try {
    bodyText = readFileSync(args.body, 'utf8');
  } catch {
    return refuse('the body file is unreadable; NOTHING was admitted; fail closed');
  }
  if (bodyText.length > DOCUMENT_INGEST_POLICY.maxDocumentChars)
    return refuse(`the body file exceeds ${DOCUMENT_INGEST_POLICY.maxDocumentChars} chars; chunk the document deliberately first; NOTHING was admitted; fail closed`);
  const store = new ReadOnlyRegisterStore(registerLines as readonly string[]);
  // MEASURED, CHAIN-VALIDATED register census for the packet (a tampered
  // middle line refuses HERE, before the queue is even opened).
  let registerEntries: number;
  try {
    registerEntries = readSourceRegisterEntries(store, args.genesis).length;
  } catch (err) {
    return refuse(`${err instanceof Error ? err.message : String(err)} NOTHING was admitted`);
  }
  // THE REAL CONTRACTS: the digest is derived from the text; the door
  // requires provenance and re-derives the binding from the chain.
  const queue = new OfflineStoryQueue(args.queue);
  try {
    const prepared = prepareDocumentStories({
      tenantId: args.tenant, documentId: args.document, title: args.title, bodyText,
    });
    let admission;
    try {
      admission = admitReadingStories(queue, prepared, {
        registerStore: store,
        registerGenesis: args.genesis,
        sourceId: args.source,
      });
    } catch (err) {
      // A door refusal travels as a REFUSED packet with the door's own
      // message verbatim — never a silent success, never a partial write.
      return refuse(`ADMISSION REFUSED — ${err instanceof Error ? err.message : String(err)}`);
    }
    return Object.freeze({
      kind: 'BOUND_ADMITTED' as const,
      policyVersion: BOUND_ADMISSION_CLI_POLICY.policyVersion,
      tenantId: args.tenant,
      documentId: args.document,
      sourceId: args.source,
      documentDigestSha256: admission.documentDigestSha256,
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
      humanDecision: 'REQUIRED' as const,
    });
  } finally {
    queue.close();
  }
}

function refuse(reason: string): BoundAdmissionRefused {
  return Object.freeze({
    kind: 'BOUND_ADMISSION_REFUSED' as const,
    policyVersion: BOUND_ADMISSION_CLI_POLICY.policyVersion,
    reason,
    modelCalls: 0 as const, remoteCalls: 0 as const,
    activated: 0 as const, learningPromoted: false as const,
    humanDecision: 'REQUIRED' as const,
  });
}

/** The daemon-free entrypoint: one packet, exit 2 on refusal. */
export function mainBoundAdmissionCli(argv: readonly string[]): void {
  try {
    const packet = runBoundAdmissionCommand(argv);
    process.stdout.write(`${JSON.stringify(packet, null, 2)}\n`);
    if (packet.kind === 'BOUND_ADMISSION_REFUSED') process.exitCode = 2;
  } catch (err) {
    process.stdout.write(`${JSON.stringify({
      kind: 'BOUND_ADMISSION_REFUSED',
      policyVersion: BOUND_ADMISSION_CLI_POLICY.policyVersion,
      reason: err instanceof Error ? err.message : String(err),
      modelCalls: 0, remoteCalls: 0,
      activated: 0, learningPromoted: false,
      humanDecision: 'REQUIRED',
    }, null, 2)}\n`);
    process.exitCode = 2;
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  mainBoundAdmissionCli(process.argv.slice(2).filter((a): a is string => typeof a === 'string'));
}