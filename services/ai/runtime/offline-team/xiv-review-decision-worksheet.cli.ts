// 12D-323 — Review Decision Worksheet CLI: the mechanical half of the
// CEO-gated review rung. The 12D-322 slate lists the pending drafts but
// deliberately shows only 16-hex hash HEADS — while the REAL review
// door (applyReviewDecision) is HASH-BOUND: a decision refuses unless
// expectedOutputHash matches the settled hash exactly. This CLI
// prepares the door's EXACT inputs for every pending draft — the full
// output hash, the door's decision vocabulary with its state effects,
// the story's REAL designated independent reviewers (from the REAL
// enterprise-workforce contract, never invented) — and NEVER applies
// anything: the decision, the reviewer, and the reviewRef are the
// human's, filled in at the review door.
//
//   node xiv-review-decision-worksheet.cli.ts --queue=<path> --tenant=<id> --limit=<1..100>
//
// Fail-closed by construction:
//   * Exactly the three flags, each exactly once, each with a value;
//     unknown/duplicate/missing flags refuse. NO --decision flag and NO
//     --apply flag: a worksheet that could decide would be the decision.
//   * A MISSING queue file refuses BEFORE the queue is opened — the CLI
//     never creates a queue by accident.
//   * EVERY entry is secret-screened: a secret-shaped objective renders
//     as a redaction placeholder — secrets never render, and the
//     refusal count is disclosed, never the content.
//   * A TAMPERED ROW refuses the whole worksheet (fail closed): a body
//     that does not parse, malformed identity fields, an objective
//     outside the REAL queue contract's OWN bound, or a role the REAL
//     workforce contract does not know — nothing is prepared.
//   * The worksheet digest binds the whole derivation tamper-evidently.
//   * LOCAL I/O only: modelCalls 0, no network primitive, remoteCalls 0.
import { readFileSync, existsSync } from 'node:fs';
import { pathToFileURL } from 'url';
import { createHash } from 'node:crypto';
import { OfflineStoryQueue } from './offline-story-queue';
import { getEnterpriseRole } from './enterprise-workforce';
import { SECRET_CONTENT_RE } from './xiv-document-ingest';

export const REVIEW_DECISION_WORKSHEET_CLI_POLICY = Object.freeze({
  policyVersion: '12d-323-v1',
  domain: 'XIV_OS_REVIEW_DECISION_WORKSHEET_CLI',
  flagOrder: ['--queue', '--tenant', '--limit'] as const,
});

export const REVIEW_DECISION_WORKSHEET_CLI_GUARDRAILS = Object.freeze({
  readOnly: true, // the queue is opened, enumerated, never written
  preparesNeverApplies: true, // no decision is ever applied here — the door stays the human's
  awaitingReviewOnly: true, // the worksheet serves the pending-review rung only
  missingQueueFileRefuses: true, // the CLI never creates a queue by accident
  everyEntrySecretScreened: true, // secrets never render; redactions are counted, not echoed
  decisionLeftBlank: true, // the worksheet carries the vocabulary, never a filled decision
  tamperedRowRefusesTheWorksheet: true,
  digestTamperEvident: true,
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

// The REAL review door's OWN vocabulary and state effects
// (offline-story-queue applyReviewDecision) — disclosed verbatim, the
// worksheet fills in neither.
const DOOR_DECISION_VOCABULARY = Object.freeze([
  Object.freeze({ decision: 'APPROVED', queueStateEffect: 'DONE' }),
  Object.freeze({ decision: 'CHANGES_REQUESTED', queueStateEffect: 'READY' }),
  Object.freeze({ decision: 'REJECTED', queueStateEffect: 'FAILED' }),
]);

const ID_RE = /^[A-Za-z0-9][A-Za-z0-9_.:-]{0,127}$/;
const HEX64_RE = /^[0-9a-f]{64}$/;
const OBJECTIVE_DISPLAY_CHARS = 200;
const PAGE_SIZE = 100; // the REAL queue contract's own page bound
const WORKSHEET_MAX_ROWS = 500; // the worksheet's own scan bound — a bigger backlog paginates by re-run

export type ReviewDecisionWorksheetArgs = Readonly<{
  queue: string;
  tenant: string;
  limit: number;
}>;

/** Strict arg parsing: exactly the three flags, each once, each valued. */
export function parseReviewDecisionWorksheetArgs(argv: readonly string[]): ReviewDecisionWorksheetArgs {
  if (argv.length !== REVIEW_DECISION_WORKSHEET_CLI_POLICY.flagOrder.length * 2)
    throw new Error(`expected exactly ${REVIEW_DECISION_WORKSHEET_CLI_POLICY.flagOrder.length} flags each with a value (${REVIEW_DECISION_WORKSHEET_CLI_POLICY.flagOrder.join(' ')}); fail closed`);
  const seen = new Map<string, string>();
  for (let i = 0; i < argv.length; i += 2) {
    const flag = argv[i]!;
    const value = argv[i + 1];
    if (!(REVIEW_DECISION_WORKSHEET_CLI_POLICY.flagOrder as readonly string[]).includes(flag))
      throw new Error(`unknown flag ${flag}; use only ${REVIEW_DECISION_WORKSHEET_CLI_POLICY.flagOrder.join(' ')}; fail closed`);
    if (typeof value !== 'string' || value.length === 0)
      throw new Error(`flag ${flag} requires a value; fail closed`);
    if (seen.has(flag))
      throw new Error(`duplicate flag ${flag}; fail closed`);
    seen.set(flag, value);
  }
  const queue = seen.get('--queue')!;
  const tenant = seen.get('--tenant')!;
  const limitRaw = seen.get('--limit')!;
  if (!ID_RE.test(tenant)) throw new Error('the tenant id is malformed (<= 128 chars: letters, digits, _ . : -); fail closed');
  if (!/^[0-9]+$/.test(limitRaw)) throw new Error('the limit must be a positive integer; fail closed');
  const limit = Number(limitRaw);
  if (!Number.isSafeInteger(limit) || limit < 1 || limit > 100)
    throw new Error('the limit must be 1..100 (one page of the REAL queue contract); fail closed');
  return Object.freeze({ queue, tenant, limit });
}

export type ReviewDecisionWorksheetEntry = Readonly<{
  ordinal: number;
  storyId: string;
  roleId: string;
  kind: string;
  state: 'AWAITING_REVIEW';
  objectiveDisplay: string; // bounded window; redaction placeholder when secret-shaped
  objectiveRedacted: boolean;
  expectedOutputHash: string; // FULL hex64 — the REAL door's hash-bound input
  designatedReviewers: readonly string[]; // the REAL workforce contract's reviewers for this role
  decisionInputs: Readonly<{
    tenantId: string;
    storyId: string;
    reviewerId: ''; // blank — the human chooses among the designated reviewers
    expectedOutputHash: string;
    decision: ''; // blank — the human decides
    reviewRef: ''; // blank — the human writes the provenance reference (<= 256 chars)
  }>;
}>;

export type ReviewDecisionWorksheetPacket = Readonly<{
  kind: 'REVIEW_DECISION_WORKSHEET';
  policyVersion: string;
  tenantId: string;
  status: 'AWAITING_REVIEW';
  entries: readonly ReviewDecisionWorksheetEntry[];
  totalAwaiting: number;
  listed: number;
  truncatedNote: string; // '' when the worksheet is complete — disclosed, never padded
  redactedCount: number;
  scannedRows: number;
  doorDecisionVocabulary: typeof DOOR_DECISION_VOCABULARY;
  worksheetDigestSha256: string;
  modelCalls: 0;
  remoteCalls: 0;
  activated: 0;
  learningPromoted: false;
  stoppedBefore: string;
  humanDecision: 'REQUIRED';
}>;

export type ReviewDecisionWorksheetRefused = Readonly<{
  kind: 'REVIEW_DECISION_WORKSHEET_REFUSED';
  policyVersion: string;
  reason: string;
  modelCalls: 0;
  remoteCalls: 0;
  activated: 0;
  learningPromoted: false;
  humanDecision: 'REQUIRED';
}>;

function refuse(reason: string): ReviewDecisionWorksheetRefused {
  return Object.freeze({
    kind: 'REVIEW_DECISION_WORKSHEET_REFUSED' as const,
    policyVersion: REVIEW_DECISION_WORKSHEET_CLI_POLICY.policyVersion,
    reason,
    modelCalls: 0 as const, remoteCalls: 0 as const,
    activated: 0 as const, learningPromoted: false as const,
    humanDecision: 'REQUIRED' as const,
  });
}

const REDACTED_OBJECTIVE = '[secret-shaped objective — redacted at the worksheet; decide at the review door]';

/**
 * One CLI invocation = ONE measured worksheet page. Opens the
 * operator's REAL queue (refusing first if the file does not exist —
 * never creating one), enumerates through the REAL queue contract's
 * own read-only page() until `limit` AWAITING_REVIEW entries are
 * prepared or the scan bound is reached, and prints the frozen
 * worksheet with the door's EXACT per-entry inputs. NEVER writes and
 * NEVER applies a decision; a tampered row refuses the whole
 * worksheet; a refusal exits 2.
 */
export function runReviewDecisionWorksheetCommand(argv: readonly string[]): ReviewDecisionWorksheetPacket | ReviewDecisionWorksheetRefused {
  const args = parseReviewDecisionWorksheetArgs(argv);
  // A MISSING queue file refuses BEFORE the queue is opened — the CLI
  // never creates a queue by accident.
  if (!existsSync(args.queue))
    return refuse('the queue file does not exist; the worksheet never creates a queue; NOTHING was read; fail closed');
  let probe: unknown;
  try {
    probe = readFileSync(args.queue);
  } catch {
    return refuse('the queue file is unreadable; NOTHING was read; fail closed');
  }
  if (probe instanceof Buffer && probe.length === 0)
    return refuse('the queue file is empty; NOTHING was read; fail closed');
  const queue = new OfflineStoryQueue(args.queue);
  try {
    // THE TOTAL comes from the REAL queue contract's own census — never
    // counted by the CLI's own logic.
    const summary = queue.summary(args.tenant) as unknown as Readonly<{
      counts: readonly { kind: string; state: string; count: number }[];
    }>;
    const totalAwaiting = summary.counts
      .map((c) => ({ state: String(c.state ?? ''), count: Number(c.count ?? 0) }))
      .filter((c) => c.state === 'AWAITING_REVIEW' && Number.isSafeInteger(c.count) && c.count >= 0)
      .reduce((acc, c) => acc + c.count, 0);
    const entries: ReviewDecisionWorksheetEntry[] = [];
    let redactedCount = 0;
    let scannedRows = 0;
    let afterOrdinal = 0;
    while (entries.length < args.limit && scannedRows < WORKSHEET_MAX_ROWS) {
      let rows: unknown[];
      try {
        rows = queue.page(args.tenant, afterOrdinal, PAGE_SIZE) as unknown[];
      } catch (err) {
        return refuse(`the queue page read refused (${err instanceof Error ? err.message : String(err)}); NOTHING was prepared; fail closed`);
      }
      if (rows.length === 0) break;
      scannedRows += rows.length;
      for (const row of rows) {
        if (row === null || typeof row !== 'object')
          return refuse('a queue row is malformed (not an object); the queue bytes were touched outside the REAL doors; NOTHING was prepared; fail closed');
        const r = row as Readonly<Record<string, unknown>>;
        const ordinal = Number(r.ordinal);
        if (!Number.isSafeInteger(ordinal) || ordinal < 0 || ordinal <= afterOrdinal)
          return refuse('a queue row ordinal is malformed; the queue bytes were touched outside the REAL doors; NOTHING was prepared; fail closed');
        afterOrdinal = ordinal;
        if (r.state !== 'AWAITING_REVIEW') continue; // the worksheet prepares ONLY pending reviews
        if (typeof r.id !== 'string' || !ID_RE.test(r.id)
          || typeof r.role !== 'string' || !ID_RE.test(r.role)
          || typeof r.kind !== 'string' || !ID_RE.test(r.kind)
          || typeof r.output_hash !== 'string' || !HEX64_RE.test(r.output_hash)
          || typeof r.body !== 'string')
          return refuse(`queue row ${ordinal} carries malformed identity fields; the queue bytes were touched outside the REAL doors; NOTHING was prepared; fail closed`);
        let objective: unknown;
        try {
          const parsed = JSON.parse(r.body) as Readonly<Record<string, unknown>>;
          objective = parsed.objective;
        } catch {
          return refuse(`queue row ${ordinal} (story ${r.id}) carries a body that does not parse; the queue bytes were touched outside the REAL doors; NOTHING was prepared; fail closed`);
        }
        if (typeof objective !== 'string' || objective.length < 1 || objective.length > 3000)
          // 3000 is the REAL queue contract's OWN objective bound
          // (offline-story-queue validate: bounded(objective, 3000)) —
          // the worksheet re-derives its shape from the door, never guesses.
          return refuse(`queue row ${ordinal} (story ${r.id}) carries a malformed objective; the queue bytes were touched outside the REAL doors; NOTHING was prepared; fail closed`);
        // The designated reviewers come from the REAL workforce
        // contract — the same check the REAL review door itself runs
        // (a role the workforce does not know cannot be reviewed).
        let designatedReviewers: readonly string[];
        try {
          designatedReviewers = getEnterpriseRole(r.role).reviewerIds;
        } catch {
          return refuse(`queue row ${ordinal} (story ${r.id}) carries role ${r.role}, which the REAL workforce contract does not know; the queue bytes were touched outside the REAL doors; NOTHING was prepared; fail closed`);
        }
        let objectiveDisplay: string;
        let objectiveRedacted = false;
        if (SECRET_CONTENT_RE.test(objective)) {
          // SECRETS NEVER RENDER: the placeholder carries no content, and
          // the redaction is COUNTED, not echoed.
          objectiveDisplay = REDACTED_OBJECTIVE;
          objectiveRedacted = true;
          redactedCount += 1;
        } else {
          objectiveDisplay = objective.length <= OBJECTIVE_DISPLAY_CHARS
            ? objective
            : objective.slice(0, OBJECTIVE_DISPLAY_CHARS);
        }
        entries.push(Object.freeze({
          ordinal,
          storyId: r.id,
          roleId: r.role,
          kind: r.kind,
          state: 'AWAITING_REVIEW' as const,
          objectiveDisplay,
          objectiveRedacted,
          expectedOutputHash: r.output_hash,
          designatedReviewers,
          decisionInputs: Object.freeze({
            tenantId: args.tenant,
            storyId: r.id,
            reviewerId: '' as const,
            expectedOutputHash: r.output_hash,
            decision: '' as const,
            reviewRef: '' as const,
          }),
        }));
        if (entries.length >= args.limit) break;
      }
      if (rows.length < PAGE_SIZE) break; // the scan reached the tenant's end
    }
    // Truncation is honest, keyed off the queue's OWN census: the note
    // is '' exactly when everything pending is prepared.
    const truncatedNote = totalAwaiting > entries.length
      ? `the worksheet prepares ${entries.length} of ${totalAwaiting} AWAITING_REVIEW stories — raise --limit (1..100 per page) or re-run to page further; nothing is hidden`
      : '';
    const worksheetDigestSha256 = createHash('sha256').update(JSON.stringify({
      policyVersion: REVIEW_DECISION_WORKSHEET_CLI_POLICY.policyVersion,
      tenantId: args.tenant, status: 'AWAITING_REVIEW',
      entries, totalAwaiting, listed: entries.length,
      truncatedNote, redactedCount, scannedRows,
      doorDecisionVocabulary: DOOR_DECISION_VOCABULARY,
    }), 'utf8').digest('hex');
    return Object.freeze({
      kind: 'REVIEW_DECISION_WORKSHEET' as const,
      policyVersion: REVIEW_DECISION_WORKSHEET_CLI_POLICY.policyVersion,
      tenantId: args.tenant,
      status: 'AWAITING_REVIEW' as const,
      entries: Object.freeze(entries),
      totalAwaiting,
      listed: entries.length,
      truncatedNote,
      redactedCount,
      scannedRows,
      doorDecisionVocabulary: DOOR_DECISION_VOCABULARY,
      worksheetDigestSha256,
      modelCalls: 0 as const, remoteCalls: 0 as const,
      activated: 0 as const, learningPromoted: false as const,
      stoppedBefore: 'the worksheet PREPARES the review door\'s hash-bound inputs — it never applies a decision, never picks a reviewer, never writes a reviewRef; the 12D-285 draft-receipt step (the reviewer must hold the settled draft, queue-verified) comes FIRST, and every decision is the human\'s, made at the review door',
      humanDecision: 'REQUIRED' as const,
    });
  } finally {
    queue.close();
  }
}

/** The daemon-free entrypoint: one packet, exit 2 on refusal. */
export function mainReviewDecisionWorksheetCli(argv: readonly string[]): void {
  try {
    const packet = runReviewDecisionWorksheetCommand(argv);
    process.stdout.write(`${JSON.stringify(packet, null, 2)}\n`);
    if (packet.kind === 'REVIEW_DECISION_WORKSHEET_REFUSED') process.exitCode = 2;
  } catch (err) {
    process.stdout.write(`${JSON.stringify({
      kind: 'REVIEW_DECISION_WORKSHEET_REFUSED',
      policyVersion: REVIEW_DECISION_WORKSHEET_CLI_POLICY.policyVersion,
      reason: err instanceof Error ? err.message : String(err),
      modelCalls: 0, remoteCalls: 0,
      activated: 0, learningPromoted: false,
      humanDecision: 'REQUIRED',
    }, null, 2)}\n`);
    process.exitCode = 2;
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  mainReviewDecisionWorksheetCli(process.argv.slice(2).filter((a): a is string => typeof a === 'string'));
}