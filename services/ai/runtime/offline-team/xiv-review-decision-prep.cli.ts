// 12D-354 — Review Decision Prep CLI: the operator-loop half between
// the 12D-323 worksheet and the 12D-324 apply door. The worksheet
// prepares the door's EXACT hash-bound inputs with BLANK decision
// fields; the apply door executes a decisions FILE whose entries must
// carry EXACTLY the keys [storyId, reviewerId, decision,
// expectedOutputHash, reviewRef] in order. Until now that mapping
// lived only in a never-committed scratch script. This CLI makes it a
// REAL, tested, committed rung.
//
//   node xiv-review-decision-prep.cli.ts --worksheet=<file.json> --decision=<APPROVED|CHANGES_REQUESTED|REJECTED> --reviewer=<id> --ref=<provenance <=256 chars>
//
// What it is — and is not:
//   * --decision is THE HUMAN's already-made decision, transcribed
//     verbatim into every entry (disclosed in the packet). The CLI
//     has NO decision of its own: without the human's flags it
//     produces nothing, and it NEVER touches a queue — output is
//     PRINT-ONLY; the human redirects it to a file and hands it to
//     the 12D-324 apply door themselves.
//   * --reviewer is validated against EVERY entry's REAL
//     designatedReviewers (from the REAL enterprise-workforce
//     contract, carried on the worksheet). One entry the reviewer is
//     not designated for refuses the WHOLE batch — all-or-nothing.
//   * --ref is the human's provenance reference (<= 256 chars,
//     secret-screened): a blanket approval must be DISCLOSED as
//     blanket in the ref itself — the 12D-317/12D-340 discipline.
//
// Fail-closed by construction:
//   * Exactly the four flags, each exactly once, each with a value;
//     unknown/duplicate/missing flags refuse.
//   * A MISSING worksheet file refuses BEFORE anything is read — the
//     CLI never creates a worksheet by accident.
//   * The packet must be a REAL REVIEW_DECISION_WORKSHEET at the
//     worksheet contract's policy version.
//   * TAMPER EVIDENCE: the worksheet digest is RE-DERIVED from the
//     file's own entries (the same derivation the 12D-323 CLI ran)
//     and compared to worksheetDigestSha256 — a worksheet whose bytes
//     were edited after issuance refuses.
//   * PRE-FILLED decisionInputs refuse: the worksheet's decision
//     fields must be exactly as the 12D-323 CLI issued them (blank) —
//     a worksheet that arrives with decisions already filled in was
//     not produced by the real producer.
//   * The decision must be in the REAL door's OWN vocabulary.
//   * A secret-shaped --ref refuses (secrets never render, never go
//     to ANY model) — and a refusal echoes no flag values.
//   * LOCAL I/O only: modelCalls 0, no network primitive,
//     remoteCalls 0. A refusal exits 2.
import { readFileSync, existsSync } from 'node:fs';
import { pathToFileURL } from 'url';
import { createHash } from 'node:crypto';
import {
  REVIEW_DECISION_WORKSHEET_CLI_POLICY,
  DOOR_DECISION_VOCABULARY,
} from './xiv-review-decision-worksheet.cli';
import { SECRET_CONTENT_RE } from './xiv-document-ingest';

export const REVIEW_DECISION_PREP_CLI_POLICY = Object.freeze({
  policyVersion: '12d-354-v1',
  domain: 'XIV_OS_REVIEW_DECISION_PREP_CLI',
  flagOrder: ['--worksheet', '--decision', '--reviewer', '--ref'] as const,
});

export const REVIEW_DECISION_PREP_CLI_GUARDRAILS = Object.freeze({
  writesNothing: true, // PRINT-ONLY: the human redirects the output themselves
  transcribesNeverDecides: true, // --decision is the human's already-made decision, verbatim
  queueTouchedNever: true, // the apply door (12D-324) is the only queue-mutating rung
  reviewerMustBeDesignatedForEveryEntry: true, // all-or-nothing
  digestReDerivedFromEntries: true, // tamper evidence against the 12D-323 issuance
  prefilledDecisionInputsRefuse: true,
  refSecretScreened: true,
  blanketApprovalDisclosedInRef: true, // the ref itself carries the disclosure
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

const ID_RE = /^[A-Za-z0-9][A-Za-z0-9_.:-]{0,127}$/;
const HEX64_RE = /^[0-9a-f]{64}$/;
const DECISIONS_MAX = 1000; // the REAL apply contract's own batch bound
const REF_MAX_CHARS = 256; // the REAL apply contract's own reviewRef bound

export type ReviewDecisionPrepArgs = Readonly<{
  worksheet: string;
  decision: string;
  reviewer: string;
  ref: string;
}>;

/** Strict arg parsing: exactly the four flags, each once, each valued. */
export function parseReviewDecisionPrepArgs(argv: readonly string[]): ReviewDecisionPrepArgs {
  if (argv.length !== REVIEW_DECISION_PREP_CLI_POLICY.flagOrder.length * 2)
    throw new Error(`expected exactly ${REVIEW_DECISION_PREP_CLI_POLICY.flagOrder.length} flags each with a value (${REVIEW_DECISION_PREP_CLI_POLICY.flagOrder.join(' ')}); fail closed`);
  const seen = new Map<string, string>();
  for (let i = 0; i < argv.length; i += 2) {
    const flag = argv[i]!;
    const value = argv[i + 1];
    if (!(REVIEW_DECISION_PREP_CLI_POLICY.flagOrder as readonly string[]).includes(flag))
      throw new Error(`unknown flag ${flag}; use only ${REVIEW_DECISION_PREP_CLI_POLICY.flagOrder.join(' ')}; fail closed`);
    if (typeof value !== 'string' || value.length === 0)
      throw new Error(`flag ${flag} requires a value; fail closed`);
    if (seen.has(flag))
      throw new Error(`duplicate flag ${flag}; fail closed`);
    seen.set(flag, value);
  }
  const worksheet = seen.get('--worksheet')!;
  const decision = seen.get('--decision')!;
  const reviewer = seen.get('--reviewer')!;
  const ref = seen.get('--ref')!;
  const doorDecisions: readonly string[] = DOOR_DECISION_VOCABULARY.map((d) => d.decision);
  if (!doorDecisions.includes(decision))
    throw new Error(`the decision must be one of the REAL door's own vocabulary (${doorDecisions.join(' | ')}); fail closed`);
  if (!ID_RE.test(reviewer))
    throw new Error('the reviewer id is malformed (<= 128 chars: letters, digits, _ . : -); fail closed');
  if (ref.length > REF_MAX_CHARS)
    throw new Error(`the reviewRef must be <= ${REF_MAX_CHARS} chars (the REAL apply contract's own bound); fail closed`);
  if (SECRET_CONTENT_RE.test(ref))
    throw new Error('the reviewRef is secret-shaped; secrets never render, never go to ANY model; NOTHING was prepared; fail closed');
  return Object.freeze({ worksheet, decision, reviewer, ref });
}

export type ReviewDecisionPreparedEntry = Readonly<{
  storyId: string;
  reviewerId: string;
  decision: string;
  expectedOutputHash: string;
  reviewRef: string;
}>;

export type ReviewDecisionPrepPacket = Readonly<{
  kind: 'REVIEW_DECISIONS_PREPARED';
  policyVersion: string;
  worksheetPolicyVersion: string;
  tenantId: string;
  prepared: number;
  decisions: readonly ReviewDecisionPreparedEntry[];
  worksheetDigestSha256: string; // the digest verified against the worksheet's own
  decisionDisclosedAs: string; // the human's already-made decision, verbatim
  modelCalls: 0;
  remoteCalls: 0;
  writesNothing: true;
  queueTouched: false;
  activated: 0;
  learningPromoted: false;
  stoppedBefore: string;
  humanDecision: 'REQUIRED';
}>;

export type ReviewDecisionPrepRefused = Readonly<{
  kind: 'REVIEW_DECISIONS_PREP_REFUSED';
  policyVersion: string;
  reason: string;
  modelCalls: 0;
  remoteCalls: 0;
  writesNothing: true;
  activated: 0;
  learningPromoted: false;
  humanDecision: 'REQUIRED';
}>;

function refuse(reason: string): ReviewDecisionPrepRefused {
  return Object.freeze({
    kind: 'REVIEW_DECISIONS_PREP_REFUSED' as const,
    policyVersion: REVIEW_DECISION_PREP_CLI_POLICY.policyVersion,
    reason,
    modelCalls: 0 as const, remoteCalls: 0 as const,
    writesNothing: true as const,
    activated: 0 as const, learningPromoted: false as const,
    humanDecision: 'REQUIRED' as const,
  });
}

type WorksheetFile = Readonly<{
  kind?: unknown;
  policyVersion?: unknown;
  tenantId?: unknown;
  entries?: unknown;
  totalAwaiting?: unknown;
  listed?: unknown;
  truncatedNote?: unknown;
  redactedCount?: unknown;
  scannedRows?: unknown;
  doorDecisionVocabulary?: unknown;
  worksheetDigestSha256?: unknown;
}>;

/**
 * One CLI invocation = ONE decisions file, PRINT-ONLY. Reads the
 * operator's REAL 12D-323 worksheet (refusing first if the file does
 * not exist — never creating one), re-derives the worksheet digest
 * for tamper evidence, validates the human's decision/reviewer/ref
 * against EVERY entry's REAL door inputs, and prints the decisions
 * array in the EXACT key order the REAL 12D-324 apply door parses.
 * NEVER writes a file and NEVER touches a queue; a refusal exits 2.
 */
export function runReviewDecisionPrepCommand(argv: readonly string[]): ReviewDecisionPrepPacket | ReviewDecisionPrepRefused {
  const args = parseReviewDecisionPrepArgs(argv);
  // A MISSING worksheet file refuses BEFORE anything is read — the
  // CLI never creates a worksheet by accident.
  if (!existsSync(args.worksheet))
    return refuse('the worksheet file does not exist; the prep CLI never creates a worksheet; NOTHING was read; fail closed');
  let raw: string;
  try {
    raw = readFileSync(args.worksheet, 'utf8');
  } catch {
    return refuse('the worksheet file is unreadable; NOTHING was read; fail closed');
  }
  if (raw.length === 0)
    return refuse('the worksheet file is empty; NOTHING was read; fail closed');
  let ws: WorksheetFile;
  try {
    ws = JSON.parse(raw) as WorksheetFile;
  } catch {
    return refuse('the worksheet file does not parse as JSON; NOTHING was prepared; fail closed');
  }
  if (ws.kind !== 'REVIEW_DECISION_WORKSHEET')
    return refuse(`the file is not a review decision worksheet (kind ${String(ws.kind)}); NOTHING was prepared; fail closed`);
  if (ws.policyVersion !== REVIEW_DECISION_WORKSHEET_CLI_POLICY.policyVersion)
    return refuse(`the worksheet is not at the 12D-323 contract's policy version (${String(ws.policyVersion)}); NOTHING was prepared; fail closed`);
  const entries = ws.entries;
  if (!Array.isArray(entries) || entries.length < 1)
    return refuse('the worksheet carries no entries; NOTHING was prepared; fail closed');
  if (entries.length > DECISIONS_MAX)
    return refuse(`the worksheet carries ${entries.length} entries; the REAL apply contract's own batch bound is ${DECISIONS_MAX}; fail closed`);
  if (typeof ws.worksheetDigestSha256 !== 'string' || !HEX64_RE.test(ws.worksheetDigestSha256))
    return refuse('the worksheet carries no usable worksheetDigestSha256; NOTHING was prepared; fail closed');
  // TAMPER EVIDENCE: the digest is re-derived from the file's OWN
  // entries with the SAME derivation the 12D-323 CLI ran — a
  // worksheet whose bytes were edited after issuance refuses.
  const tenantId = ws.tenantId;
  if (typeof tenantId !== 'string' || !ID_RE.test(tenantId))
    return refuse('the worksheet carries a malformed tenantId; NOTHING was prepared; fail closed');
  const rederived = createHash('sha256').update(JSON.stringify({
    policyVersion: REVIEW_DECISION_WORKSHEET_CLI_POLICY.policyVersion,
    tenantId, status: 'AWAITING_REVIEW',
    entries, totalAwaiting: ws.totalAwaiting, listed: ws.listed,
    truncatedNote: ws.truncatedNote, redactedCount: ws.redactedCount,
    scannedRows: ws.scannedRows,
    doorDecisionVocabulary: ws.doorDecisionVocabulary,
  }), 'utf8').digest('hex');
  if (rederived !== ws.worksheetDigestSha256)
    return refuse('the worksheet digest does not re-derive from its own entries — the bytes were edited after issuance; NOTHING was prepared; fail closed');
  // EVERY entry is validated: the door inputs as issued (blank where
  // the human fills in), a full hex64 hash, and the human's reviewer
  // designated for THIS entry. One failure refuses the WHOLE batch.
  const decisions: ReviewDecisionPreparedEntry[] = [];
  for (const entry of entries) {
    if (entry === null || typeof entry !== 'object')
      return refuse('a worksheet entry is malformed (not an object); NOTHING was prepared; fail closed');
    const e = entry as Readonly<Record<string, unknown>>;
    const storyId = e.storyId;
    const expectedOutputHash = e.expectedOutputHash;
    const designated = e.designatedReviewers;
    const di = e.decisionInputs;
    if (typeof storyId !== 'string' || !ID_RE.test(storyId))
      return refuse('a worksheet entry carries a malformed storyId; NOTHING was prepared; fail closed');
    if (typeof expectedOutputHash !== 'string' || !HEX64_RE.test(expectedOutputHash))
      return refuse(`worksheet entry (story ${storyId}) carries a malformed expectedOutputHash; NOTHING was prepared; fail closed`);
    if (!Array.isArray(designated) || !designated.every((r) => typeof r === 'string' && r.length > 0))
      return refuse(`worksheet entry (story ${storyId}) carries malformed designatedReviewers; NOTHING was prepared; fail closed`);
    if (di === null || typeof di !== 'object')
      return refuse(`worksheet entry (story ${storyId}) carries no decisionInputs; NOTHING was prepared; fail closed`);
    const d = di as Readonly<Record<string, unknown>>;
    if (d.tenantId !== tenantId || d.storyId !== storyId || d.expectedOutputHash !== expectedOutputHash)
      return refuse(`worksheet entry (story ${storyId}) carries decisionInputs that do not match the entry itself; NOTHING was prepared; fail closed`);
    if (d.reviewerId !== '' || d.decision !== '' || d.reviewRef !== '')
      return refuse(`worksheet entry (story ${storyId}) carries PRE-FILLED decision inputs — the worksheet was not produced by the REAL 12D-323 CLI as issued; NOTHING was prepared; fail closed`);
    if (!(designated as readonly string[]).includes(args.reviewer))
      return refuse(`reviewer ${args.reviewer} is not designated for story ${storyId} (designated: ${(designated as readonly string[]).join(', ')}); one undesignated entry refuses the WHOLE batch; NOTHING was prepared; fail closed`);
    decisions.push(Object.freeze({
      storyId,
      reviewerId: args.reviewer,
      decision: args.decision,
      expectedOutputHash,
      reviewRef: args.ref,
    }));
  }
  const tenantIds = new Set((entries as Readonly<Record<string, unknown>>[]).map((e) => (e.decisionInputs as Readonly<Record<string, unknown>>)?.tenantId));
  if (tenantIds.size !== 1)
    return refuse('the worksheet mixes tenants across entries; NOTHING was prepared; fail closed');
  return Object.freeze({
    kind: 'REVIEW_DECISIONS_PREPARED' as const,
    policyVersion: REVIEW_DECISION_PREP_CLI_POLICY.policyVersion,
    worksheetPolicyVersion: REVIEW_DECISION_WORKSHEET_CLI_POLICY.policyVersion,
    tenantId,
    prepared: decisions.length,
    decisions: Object.freeze(decisions),
    worksheetDigestSha256: ws.worksheetDigestSha256,
    decisionDisclosedAs: `the human's already-made decision, transcribed verbatim: ${args.decision}`,
    modelCalls: 0 as const, remoteCalls: 0 as const,
    writesNothing: true as const, queueTouched: false as const,
    activated: 0 as const, learningPromoted: false as const,
    stoppedBefore: 'the prep CLI MAPS the worksheet into the REAL 12D-324 door\'s input shape with the human\'s already-made decision — it never decides, never applies, never touches a queue; output is print-only and the human redirects it themselves',
    humanDecision: 'REQUIRED' as const,
  });
}

/** The daemon-free entrypoint: one packet, exit 2 on refusal. */
export function mainReviewDecisionPrepCli(argv: readonly string[]): void {
  try {
    const packet = runReviewDecisionPrepCommand(argv);
    process.stdout.write(`${JSON.stringify(packet, null, 2)}\n`);
    if (packet.kind === 'REVIEW_DECISIONS_PREP_REFUSED') process.exitCode = 2;
  } catch (err) {
    process.stdout.write(`${JSON.stringify({
      kind: 'REVIEW_DECISIONS_PREP_REFUSED',
      policyVersion: REVIEW_DECISION_PREP_CLI_POLICY.policyVersion,
      reason: err instanceof Error ? err.message : String(err),
      modelCalls: 0, remoteCalls: 0,
      writesNothing: true,
      activated: 0, learningPromoted: false,
      humanDecision: 'REQUIRED',
    }, null, 2)}\n`);
    process.exitCode = 2;
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  mainReviewDecisionPrepCli(process.argv.slice(2).filter((a): a is string => typeof a === 'string'));
}