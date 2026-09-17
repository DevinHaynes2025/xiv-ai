// 12D-305 — Assistant Agent-Memory Seam: the fail-closed READ door that
// gives a XIV AI assistant its "mini brain" semantic memory — the
// tenant-bound inventory of REVIEWED reading facts (DONE queue stories),
// per the directive-#4 lineage and the cerememory mapping (semantic
// memory = DONE chunks + reviewed facts).
//
// What this door IS:
//   * a READ-ONLY queue walk: the trusted queue's own bounded `page`
//     door is the ONLY queue method invoked — never enqueue, never
//     claim, never settle, never review, never recover;
//   * SEMANTIC memory only: entries are DONE stories exclusively —
//     a fact enters the mini brain only through independent human
//     review (the review→candidate→approval chain);
//   * TENANT-BOUND: only the requested tenant's rows are walked;
//   * BOUNDED: at most MAX_MEMORY_ENTRIES carried (most recent within
//     the scan window), each objective truncated to MAX_MEMORY_OBJECTIVE
//     chars with the truncation DISCLOSED, at most MAX_SCAN_ROWS walked
//     with the scan truncation DISCLOSED;
//   * SECRET-SCREENED: SECRET_CONTENT_RE runs over every objective — a
//     secret-shaped memory refuses the WHOLE read (defense in depth;
//     DONE chunks were screened at ingest, the door never trusts that).
//
// What this door is NOT (yet — later rungs, their own ceilings):
//   * not a prompt seam — nothing here composes into a model call
//     (modelCalls 0); the 12D-302 conversation seam is unchanged;
//   * not learning: no weights move, nothing is activated, nothing is
//     promoted (learningPromoted false — CEO-gated, always);
//   * not a write path: the memory is re-derived on every read, held by
//     the caller, never persisted (stateless by contract, like 12D-300).
//
// PURE of wall-clock and randomness: the packet carries no timestamp and
// two reads over the same queue state are byte-identical. remoteCalls 0.
import { createHash } from 'node:crypto';
import { OfflineStoryQueue } from './offline-story-queue';
import { SECRET_CONTENT_RE } from './xiv-document-ingest';

export const ASSISTANT_MEMORY_POLICY = Object.freeze({
  policyVersion: '12d-305-v1',
  domain: 'XIV_OS_ASSISTANT_MEMORY_SEAM',
});

export const ASSISTANT_MEMORY_GUARDRAILS = Object.freeze({
  readOnlyQueueAccess: true, // page() is the only queue method this door calls
  semanticMemoryOnly: true, // DONE (independently reviewed) stories exclusively
  tenantBound: true,
  boundedMemory: true,
  secretScreenedBothWays: true,
  disclosedTruncation: true, // every bound that bites is disclosed in the packet
  noPromptSeamYet: true, // feeding a model is a later rung with its own ceiling
  noWeightMutation: true,
  noActivationPath: true,
  pureModule: true,
  modelCalls: 0,
  remoteCalls: 0,
  collectsNothing: true,
  learningPromoted: false,
  activated: 0,
  automaticRecovery: false,
  billionUsersProven: false,
  humanDecision: 'REQUIRED' as const,
});

export const MAX_MEMORY_ENTRIES = 6;
export const MAX_MEMORY_OBJECTIVE_CHARS = 2_000;
export const MAX_SCAN_ROWS = 500;
const PAGE_SIZE = 100;

const REQUEST_KEYS = ['tenantId'] as const;
const SHA_RE = /^[a-f0-9]{64}$/;
const TENANT_RE = /^[A-Za-z0-9][A-Za-z0-9_.:-]{0,127}$/;

export interface AssistantMemoryEntry extends Readonly<{
  storyId: string;
  outputHash: string;
  objective: string;
  objectiveTruncated: boolean;
}> {}

export interface AssistantMemoryPacket extends Readonly<{
  kind: 'ASSISTANT_MEMORY_READ';
  policyVersion: string;
  tenantId: string;
  entries: readonly AssistantMemoryEntry[];
  scannedRows: number;
  scannedTruncated: boolean;
  doneCount: number;
  entriesTruncated: boolean;
  memoryDigest: string;
  modelCalls: 0;
  remoteCalls: 0;
  learningPromoted: false;
  activated: 0;
  humanDecision: 'REQUIRED';
}> {}

/** sha256 over the canonical JSON of the entries — the caller re-derives this
 *  before trusting the memory (the 12D-301 discipline: digests are never trusted). */
export function deriveAssistantMemoryDigest(entries: readonly AssistantMemoryEntry[]): string {
  return createHash('sha256').update(JSON.stringify(entries.map((e) => ({
    storyId: e.storyId, outputHash: e.outputHash, objective: e.objective, objectiveTruncated: e.objectiveTruncated,
  })))).digest('hex');
}

/**
 * The only door from a trusted queue to the assistant's semantic memory.
 * Throws on any violation — the caller renders honest refusals.
 */
export function prepareAssistantMemoryRead(
  queue: OfflineStoryQueue,
  request: { tenantId: string },
): AssistantMemoryPacket {
  if (!(queue instanceof OfflineStoryQueue))
    throw new Error('a trusted OfflineStoryQueue instance is required; the door never opens a database; fail closed');
  if (request === null || typeof request !== 'object' || Array.isArray(request))
    throw new Error('a memory-read request object is required; fail closed');
  const keys = Object.keys(request as Record<string, unknown>);
  if (keys.length !== REQUEST_KEYS.length || !REQUEST_KEYS.every((k, i) => keys[i] === k))
    throw new Error(`a memory-read request must have exactly the keys [${REQUEST_KEYS.join(', ')}] in order; fail closed`);
  const tenantId = (request as { tenantId: unknown }).tenantId;
  if (typeof tenantId !== 'string' || !TENANT_RE.test(tenantId))
    throw new Error('the memory-read request carries a malformed tenantId; fail closed');
  // READ-ONLY scan through the queue's own bounded page door.
  const doneRows: { storyId: string; outputHash: string; objective: string }[] = [];
  let scannedRows = 0;
  let scannedTruncated = false;
  let after = 0;
  for (;;) {
    const rows = queue.page(tenantId, after, Math.min(PAGE_SIZE, MAX_SCAN_ROWS - scannedRows));
    if (!Array.isArray(rows) || rows.length === 0) break;
    for (const row of rows) {
      scannedRows += 1;
      if (String(row.state) !== 'DONE') continue;
      const storyId = String(row.id);
      const outputHash = String(row.output_hash ?? '');
      let objective = '';
      try {
        const body = JSON.parse(String(row.body)) as { objective?: unknown };
        if (typeof body.objective === 'string') objective = body.objective;
      } catch { /* a malformed body carries no memory */ }
      if (!/^[A-Za-z0-9][A-Za-z0-9_.:-]{0,127}$/.test(storyId) || !SHA_RE.test(outputHash))
        throw new Error('a DONE queue row carries a malformed identity; fail closed');
      doneRows.push({ storyId, outputHash, objective });
    }
    after = Number(rows[rows.length - 1]!.ordinal);
    if (rows.length < PAGE_SIZE || scannedRows >= MAX_SCAN_ROWS) break;
  }
  if (scannedRows >= MAX_SCAN_ROWS) {
    // The scan bound bit — probe one row past the window to disclose it honestly.
    const probe = queue.page(tenantId, after, 1);
    if (probe.length > 0) scannedTruncated = true;
  }
  for (const row of doneRows) {
    if (SECRET_CONTENT_RE.test(row.objective))
      throw new Error('a DONE story objective is secret-shaped; it never enters the memory; fail closed');
  }
  const doneCount = doneRows.length;
  // Most-recent-within-window carry: the mini brain remembers the latest
  // reviewed facts first. The bound that bites is disclosed.
  const entries: AssistantMemoryEntry[] = doneRows.slice(-MAX_MEMORY_ENTRIES).map((row) => {
    const truncated = row.objective.length > MAX_MEMORY_OBJECTIVE_CHARS;
    return Object.freeze({
      storyId: row.storyId,
      outputHash: row.outputHash,
      objective: truncated ? row.objective.slice(0, MAX_MEMORY_OBJECTIVE_CHARS) : row.objective,
      objectiveTruncated: truncated,
    });
  });
  return Object.freeze({
    kind: 'ASSISTANT_MEMORY_READ' as const,
    policyVersion: ASSISTANT_MEMORY_POLICY.policyVersion,
    tenantId,
    entries: Object.freeze(entries),
    scannedRows,
    scannedTruncated,
    doneCount,
    entriesTruncated: doneCount > MAX_MEMORY_ENTRIES,
    memoryDigest: deriveAssistantMemoryDigest(entries),
    modelCalls: 0 as const,
    remoteCalls: 0 as const,
    learningPromoted: false as const,
    activated: 0 as const,
    humanDecision: 'REQUIRED' as const,
  });
}