// 12D-322 — Review Slate CLI: the read-only MEASUREMENT surface that
// serves the CEO-gated review rung. The 12D-321 handoff's top
// actionable candidate is the review of the drafts sitting in
// AWAITING_REVIEW — but the operator/CEO has no trustworthy listing of
// WHAT is pending. This CLI prints the pending-review slate: one page
// per invocation, over the operator's REAL queue, through the REAL
// queue contract's own read-only page/summary queries — NOTHING is
// decided, settled, reviewed, or written here.
//
//   node xiv-review-slate.cli.ts --queue=<path> --tenant=<id> --limit=<1..100>
//
// Fail-closed by construction:
//   * Exactly the three flags, each exactly once, each with a value;
//     unknown/duplicate/missing flags refuse. NO status flag (the slate
//     is AWAITING_REVIEW-only — DONE/READY listings are the census's
//     job), NO decision flag (review decisions are the human's, made at
//     the review door — never here), NO write path of any kind.
//   * A MISSING queue file refuses BEFORE the queue is opened — the CLI
//     never creates a queue by accident (an empty queue file where the
//     operator typo'd a path would be a silent lie).
//   * EVERY entry is secret-screened: a secret-shaped objective renders
//     as a redaction placeholder — secrets never render, and the
//     refusal count is disclosed, never the content.
//   * A TAMPERED ROW refuses the whole slate (fail closed): a body that
//     does not parse, or an entry whose identity fields are malformed,
//     means the queue's bytes were touched outside the REAL doors —
//     the slate renders NOTHING and says why.
//   * The slate digest binds the whole derivation (entries, counts,
//     truncation) tamper-evidently.
//   * LOCAL I/O only: modelCalls 0, no network primitive, remoteCalls 0.
import { readFileSync, existsSync } from 'node:fs';
import { pathToFileURL } from 'url';
import { createHash } from 'node:crypto';
import { OfflineStoryQueue } from './offline-story-queue';
import { SECRET_CONTENT_RE } from './xiv-document-ingest';

export const REVIEW_SLATE_CLI_POLICY = Object.freeze({
  policyVersion: '12d-322-v1',
  domain: 'XIV_OS_REVIEW_SLATE_CLI',
  flagOrder: ['--queue', '--tenant', '--limit'] as const,
});

export const REVIEW_SLATE_CLI_GUARDRAILS = Object.freeze({
  readOnly: true, // the queue is opened, enumerated, never written
  listsNeverDecides: true, // review decisions are the human's, at the review door
  awaitingReviewOnly: true, // no status flag; DONE/READY listings are the census's job
  missingQueueFileRefuses: true, // the CLI never creates a queue by accident
  everyEntrySecretScreened: true, // secrets never render; redactions are counted, not echoed
  tamperedRowRefusesTheSlate: true,
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

const ID_RE = /^[A-Za-z0-9][A-Za-z0-9_.:-]{0,127}$/;
const HEX64_RE = /^[0-9a-f]{64}$/;
const OBJECTIVE_DISPLAY_CHARS = 200;
const PAGE_SIZE = 100; // the REAL queue contract's own page bound
const SLATE_MAX_ROWS = 500; // the slate's own scan bound — a bigger backlog paginates by re-run

export type ReviewSlateArgs = Readonly<{
  queue: string;
  tenant: string;
  limit: number;
}>;

/** Strict arg parsing: exactly the three flags, each once, each valued. */
export function parseReviewSlateArgs(argv: readonly string[]): ReviewSlateArgs {
  if (argv.length !== REVIEW_SLATE_CLI_POLICY.flagOrder.length * 2)
    throw new Error(`expected exactly ${REVIEW_SLATE_CLI_POLICY.flagOrder.length} flags each with a value (${REVIEW_SLATE_CLI_POLICY.flagOrder.join(' ')}); fail closed`);
  const seen = new Map<string, string>();
  for (let i = 0; i < argv.length; i += 2) {
    const flag = argv[i]!;
    const value = argv[i + 1];
    if (!(REVIEW_SLATE_CLI_POLICY.flagOrder as readonly string[]).includes(flag))
      throw new Error(`unknown flag ${flag}; use only ${REVIEW_SLATE_CLI_POLICY.flagOrder.join(' ')}; fail closed`);
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

export type ReviewSlateEntry = Readonly<{
  ordinal: number;
  storyId: string;
  roleId: string;
  kind: string;
  state: 'AWAITING_REVIEW';
  objectiveDisplay: string; // bounded window; redaction placeholder when secret-shaped
  objectiveRedacted: boolean;
  outputHashHead: string; // 16 hex chars — the head, never the whole hash
}>;

export type ReviewSlatePacket = Readonly<{
  kind: 'REVIEW_SLATE';
  policyVersion: string;
  tenantId: string;
  status: 'AWAITING_REVIEW';
  entries: readonly ReviewSlateEntry[];
  totalAwaiting: number;
  listed: number;
  truncatedNote: string; // '' when the slate is complete — disclosed, never padded
  redactedCount: number;
  scannedRows: number;
  slateDigestSha256: string;
  modelCalls: 0;
  remoteCalls: 0;
  activated: 0;
  learningPromoted: false;
  stoppedBefore: string;
  humanDecision: 'REQUIRED';
}>;

export type ReviewSlateRefused = Readonly<{
  kind: 'REVIEW_SLATE_REFUSED';
  policyVersion: string;
  reason: string;
  modelCalls: 0;
  remoteCalls: 0;
  activated: 0;
  learningPromoted: false;
  humanDecision: 'REQUIRED';
}>;

function refuse(reason: string): ReviewSlateRefused {
  return Object.freeze({
    kind: 'REVIEW_SLATE_REFUSED' as const,
    policyVersion: REVIEW_SLATE_CLI_POLICY.policyVersion,
    reason,
    modelCalls: 0 as const, remoteCalls: 0 as const,
    activated: 0 as const, learningPromoted: false as const,
    humanDecision: 'REQUIRED' as const,
  });
}

const REDACTED_OBJECTIVE = '[secret-shaped objective — redacted at the slate; decide at the review door]';

/**
 * One CLI invocation = ONE measured slate page. Opens the operator's
 * REAL queue (refusing first if the file does not exist — never
 * creating one), enumerates through the REAL queue contract's own
 * read-only page() until `limit` AWAITING_REVIEW entries are listed or
 * the scan bound is reached, and prints the frozen slate. NEVER writes;
 * a tampered row refuses the whole slate; a refusal exits 2.
 */
export function runReviewSlateCommand(argv: readonly string[]): ReviewSlatePacket | ReviewSlateRefused {
  const args = parseReviewSlateArgs(argv);
  // A MISSING queue file refuses BEFORE the queue is opened — the CLI
  // never creates a queue by accident.
  if (!existsSync(args.queue))
    return refuse('the queue file does not exist; the slate never creates a queue; NOTHING was read; fail closed');
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
    // The census rows come from the queue's own SQL; every count is
    // re-validated before it is trusted (the census is the door's, the
    // validation is the CLI's discipline).
    const totalAwaiting = summary.counts
      .map((c) => ({ state: String(c.state ?? ''), count: Number(c.count ?? 0) }))
      .filter((c) => c.state === 'AWAITING_REVIEW' && Number.isSafeInteger(c.count) && c.count >= 0)
      .reduce((acc, c) => acc + c.count, 0);
    const entries: ReviewSlateEntry[] = [];
    let redactedCount = 0;
    let scannedRows = 0;
    let afterOrdinal = 0;
    while (entries.length < args.limit && scannedRows < SLATE_MAX_ROWS) {
      let rows: unknown[];
      try {
        rows = queue.page(args.tenant, afterOrdinal, PAGE_SIZE) as unknown[];
      } catch (err) {
        return refuse(`the queue page read refused (${err instanceof Error ? err.message : String(err)}); NOTHING was listed; fail closed`);
      }
      if (rows.length === 0) break;
      scannedRows += rows.length;
      for (const row of rows) {
        if (row === null || typeof row !== 'object')
          return refuse('a queue row is malformed (not an object); the queue bytes were touched outside the REAL doors; NOTHING was listed; fail closed');
        const r = row as Readonly<Record<string, unknown>>;
        const ordinal = Number(r.ordinal);
        if (!Number.isSafeInteger(ordinal) || ordinal < 0 || ordinal <= afterOrdinal)
          return refuse('a queue row ordinal is malformed; the queue bytes were touched outside the REAL doors; NOTHING was listed; fail closed');
        afterOrdinal = ordinal;
        if (r.state !== 'AWAITING_REVIEW') continue; // the slate lists ONLY pending reviews
        if (typeof r.id !== 'string' || !ID_RE.test(r.id)
          || typeof r.role !== 'string' || !ID_RE.test(r.role)
          || typeof r.kind !== 'string' || !ID_RE.test(r.kind)
          || typeof r.output_hash !== 'string' || !HEX64_RE.test(r.output_hash)
          || typeof r.body !== 'string')
          return refuse(`queue row ${ordinal} carries malformed identity fields; the queue bytes were touched outside the REAL doors; NOTHING was listed; fail closed`);
        let objective: unknown;
        try {
          const parsed = JSON.parse(r.body) as Readonly<Record<string, unknown>>;
          objective = parsed.objective;
        } catch {
          return refuse(`queue row ${ordinal} (story ${r.id}) carries a body that does not parse; the queue bytes were touched outside the REAL doors; NOTHING was listed; fail closed`);
        }
        if (typeof objective !== 'string' || objective.length < 1 || objective.length > 3000)
          // 3000 is the REAL queue contract's OWN objective bound
          // (offline-story-queue validate: bounded(objective, 3000)) —
          // the slate re-derives its shape from the door, never guesses.
          return refuse(`queue row ${ordinal} (story ${r.id}) carries a malformed objective; the queue bytes were touched outside the REAL doors; NOTHING was listed; fail closed`);
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
          outputHashHead: r.output_hash.slice(0, 16),
        }));
        if (entries.length >= args.limit) break;
      }
      if (rows.length < PAGE_SIZE) break; // the scan reached the tenant's end
    }
    // Truncation is honest, keyed off the queue's OWN census: the note
    // is '' exactly when everything pending is listed.
    const truncatedNote = totalAwaiting > entries.length
      ? `the slate lists ${entries.length} of ${totalAwaiting} AWAITING_REVIEW stories — raise --limit (1..100 per page) or re-run to page further; nothing is hidden`
      : '';
    const slateDigestSha256 = createHash('sha256').update(JSON.stringify({
      policyVersion: REVIEW_SLATE_CLI_POLICY.policyVersion,
      tenantId: args.tenant, status: 'AWAITING_REVIEW',
      entries, totalAwaiting, listed: entries.length,
      truncatedNote, redactedCount, scannedRows,
    }), 'utf8').digest('hex');
    return Object.freeze({
      kind: 'REVIEW_SLATE' as const,
      policyVersion: REVIEW_SLATE_CLI_POLICY.policyVersion,
      tenantId: args.tenant,
      status: 'AWAITING_REVIEW' as const,
      entries: Object.freeze(entries),
      totalAwaiting,
      listed: entries.length,
      truncatedNote,
      redactedCount,
      scannedRows,
      slateDigestSha256,
      modelCalls: 0 as const, remoteCalls: 0 as const,
      activated: 0 as const, learningPromoted: false as const,
      stoppedBefore: 'the slate LISTS pending reviews — it never decides, settles, or approves; every review decision stays the human\'s, made at the review door',
      humanDecision: 'REQUIRED' as const,
    });
  } finally {
    queue.close();
  }
}

/** The daemon-free entrypoint: one packet, exit 2 on refusal. */
export function mainReviewSlateCli(argv: readonly string[]): void {
  try {
    const packet = runReviewSlateCommand(argv);
    process.stdout.write(`${JSON.stringify(packet, null, 2)}\n`);
    if (packet.kind === 'REVIEW_SLATE_REFUSED') process.exitCode = 2;
  } catch (err) {
    process.stdout.write(`${JSON.stringify({
      kind: 'REVIEW_SLATE_REFUSED',
      policyVersion: REVIEW_SLATE_CLI_POLICY.policyVersion,
      reason: err instanceof Error ? err.message : String(err),
      modelCalls: 0, remoteCalls: 0,
      activated: 0, learningPromoted: false,
      humanDecision: 'REQUIRED',
    }, null, 2)}\n`);
    process.exitCode = 2;
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  mainReviewSlateCli(process.argv.slice(2).filter((a): a is string => typeof a === 'string'));
}