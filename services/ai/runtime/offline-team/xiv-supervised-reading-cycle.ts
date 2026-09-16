// 12D-283 — SUPERVISED READING CYCLE (one chunk per invocation, STOP
// before review).
//
// The 12D-282 handoff's next candidate: the standing read→first-read
// loop, as a FAIL-CLOSED CONTRACT rather than a daemon. The loop is the
// OPERATOR re-invoking this door; each invocation advances the reading
// chain EXACTLY ONE chunk of ONE document and then STOPS — nothing
// waits, nothing polls, nothing retries, and nothing downstream of the
// first reader runs here.
//
// WHAT ONE INVOCATION DOES (all through the REAL contracts, never
// re-implemented):
//   1. the REAL 12D-274 ingest contract prepares the document
//      (credential-shaped content refuses; the digest is the
//      contract's own re-derivation);
//   2. the REAL 12D-277/278 bound admission binds the prepared result
//      to an ALREADY-REGISTERED source (NO REGISTER NO BINDING — this
//      door never registers a source) and admits the chunk stories
//      through the REAL 12D-275 queue door;
//   3. the queue is the truth about WHAT to read: the first story the
//      queue offers (its head) among this document's stories is read
//      by the REAL 12D-280 first reader — a non-head story is never
//      jumped;
//   4. the DRAFT settles as AWAITING_REVIEW and the cycle STOPS —
//      review (12D-100), recorded approval (12D-269), and the ledger
//      (12D-264) are DOWNSTREAM and never run here.
//
// WHAT ONE INVOCATION NEVER DOES:
//   - never reads a second chunk (chunksPerCycle: 1 — the remaining
//     READY chunks stay READY for the operator's next invocation);
//   - never reads a document as bytes OTHER than the bytes it was
//     admitted as (12D-287: a duplicate admission CONTINUES the
//     document's reading — the operator's loop re-invoking the door —
//     ONLY when the re-submitted bytes re-derive the SAME document
//     digest the queue's own stored objective was admitted with;
//     changed bytes or a changed title refuse);
//   - never registers a source, never writes a register, never opens a
//     database of its own (the queue and register stores are injected);
//   - never activates anything, never promotes learning, never reviews
//     its own draft, never recovers a FAILED story (automaticRecovery
//     false — recovery is the operator's 12D-100 voidLease door).
//
// HONEST FAILURE: this door NEVER THROWS. Any refusal — malformed
// submission, unregistered source, duplicate document, no READY story,
// a queue-head mismatch, a post-call provider failure — returns an
// honest REFUSED packet whose reason is the real contract's own
// message, with MEASURED state read back from the queue (a FAILED
// story means the provider call happened: modelCalls 1, the failure is
// durable, and recovery is the operator's door). Refused packets carry
// ZERO document text.
import { OfflineStoryQueue } from './offline-story-queue';
import {
  prepareDocumentStories, SECRET_CONTENT_RE,
} from './xiv-document-ingest';
import { admitBoundReading } from './xiv-bound-admission';
import {
  runOllamaFirstReader, OLLAMA_FIRST_READER_POLICY,
  type OllamaFirstReaderPacket,
} from './xiv-ollama-first-reader';
import type { ReadingSourceStore } from './xiv-reading-source-register';

export const SUPERVISED_READING_CYCLE_POLICY = Object.freeze({
  policyVersion: '12d-283-v1',
  domain: 'XIV_OS_SUPERVISED_READING_CYCLE',
  /** One document, one chunk, one invocation — the loop is the operator. */
  chunksPerCycle: 1,
  documentsPerCycle: 1,
  maxSourceIdChars: 128,
  maxDocumentIdChars: 128,
  maxTitleChars: 256,
});

export const SUPERVISED_READING_CYCLE_GUARDRAILS = Object.freeze({
  oneChunkPerInvocation: true,
  stopsBeforeReview: true,
  realContractsOnly: true, // 12D-274 + 12D-277/278 + 12D-275 + 12D-280
  bindsToRegisteredSourcesOnly: true, // this door never registers a source
  continuationRequiresAdmittedBytes: true, // 12D-287: changed bytes refuse
  queueHeadIsTheTruth: true,
  neverThrowsReturnsRefused: true,
  refusedCarriesZeroDocumentText: true,
  measuredStateFromQueueTruth: true,
  noSilentRetry: true,
  automaticRecovery: false,
  modelCallsCountedNotPinnedZero: true,
  remoteCalls: 0,
  collectsNothing: true,
  learningPromoted: false,
  activated: 0,
  modelWeightMutation: false,
  billionUsersProven: false,
  humanDecision: 'REQUIRED' as const,
});

const SUBMISSION_KEYS = ['tenantId', 'sourceId', 'documentId', 'title', 'bodyText'] as const;

const STOPPED_BEFORE = 'review on the model DRAFT (12D-100), 12D-269 recorded approval, 12D-264 ledger — all downstream, never run here';

export type SupervisedReadingCyclePacket = Readonly<{
  kind: 'SUPERVISED_READING_CYCLE';
  policyVersion: string;
  tenantId: string;
  sourceId: string;
  documentId: string;
  documentDigestSha256: string;
  storyId: string;
  storyState: string;
  /** 12D-287: true when this invocation CONTINUED an already-admitted document (same bytes re-proven). */
  continuation: boolean;
  chunks: Readonly<{ prepared: number; inserted: number; duplicates: number }>;
  remainingReady: number;
  model: string;
  loopbackEndpoint: string;
  modelCalls: 1;
  remoteCalls: 0;
  draftChars: number;
  draftSha256: string;
  activated: 0;
  learningPromoted: false;
  modelWeightMutation: false;
  humanDecision: 'REQUIRED';
  stoppedBefore: string;
}>;

export type SupervisedReadingCycleRefused = Readonly<{
  kind: 'SUPERVISED_READING_CYCLE_REFUSED';
  policyVersion: string;
  reason: string;
  /** Measured queue truth AFTER the refusal: null if the story is not inspectable. */
  storyState: string | null;
  /** MEASURED: a FAILED story means the provider call happened (durable). */
  modelCalls: 0 | 1;
  remoteCalls: 0;
  activated: 0;
  learningPromoted: false;
  humanDecision: 'REQUIRED';
}>;

/**
 * The supervised cycle's ONLY door: advance the reading chain one chunk
 * for one document, then stop before review. Accepts ANY unknown values;
 * returns a frozen packet that is either a measured cycle or an honest
 * refusal. Never throws.
 */
export async function runSupervisedReadingCycle(
  queue: unknown,
  registerStore: unknown,
  registerGenesis: unknown,
  submission: unknown,
  caller: unknown,
): Promise<SupervisedReadingCyclePacket | SupervisedReadingCycleRefused> {
  try {
    if (!(queue instanceof OfflineStoryQueue))
      throw new Error('a trusted OfflineStoryQueue instance is required; this door never opens its own database; fail closed');
    if (typeof registerStore !== 'object' || registerStore === null
      || typeof (registerStore as ReadingSourceStore).load !== 'function'
      || typeof (registerStore as ReadingSourceStore).save !== 'function')
      throw new Error('a trusted reading source register store is required; fail closed');
    if (typeof registerGenesis !== 'string' || registerGenesis.length < 8)
      throw new Error('the register genesis must be a string of at least 8 chars; fail closed');
    if (typeof caller !== 'function')
      throw new Error('an injected loopback caller function is required; this module never builds network I/O itself; fail closed');
    if (submission === null || typeof submission !== 'object' || Array.isArray(submission))
      throw new Error('a reading submission object is required; fail closed');
    const keys = Object.keys(submission as Record<string, unknown>);
    if (keys.length !== SUBMISSION_KEYS.length || !SUBMISSION_KEYS.every((k, i) => keys[i] === k))
      throw new Error(`a reading submission must have exactly the keys [${SUBMISSION_KEYS.join(', ')}] in order; fail closed`);
    const s = submission as Readonly<Record<string, unknown>>;
    for (const k of SUBMISSION_KEYS) {
      if (typeof s[k] !== 'string' || (s[k] as string).length === 0)
        throw new Error(`the submission field ${k} must be a non-empty string; fail closed`);
    }
    const tenantId = s.tenantId as string;
    const sourceId = s.sourceId as string;
    const documentId = s.documentId as string;
    const title = s.title as string;
    const bodyText = s.bodyText as string;
    if (sourceId.length > SUPERVISED_READING_CYCLE_POLICY.maxSourceIdChars)
      throw new Error(`the source id exceeds ${SUPERVISED_READING_CYCLE_POLICY.maxSourceIdChars} chars; fail closed`);
    if (documentId.length > SUPERVISED_READING_CYCLE_POLICY.maxDocumentIdChars)
      throw new Error(`the document id exceeds ${SUPERVISED_READING_CYCLE_POLICY.maxDocumentIdChars} chars; fail closed`);
    if (title.length > SUPERVISED_READING_CYCLE_POLICY.maxTitleChars)
      throw new Error(`the title exceeds ${SUPERVISED_READING_CYCLE_POLICY.maxTitleChars} chars; fail closed`);
    // Pre-gate for a clean refusal; the REAL ingest gate re-checks.
    if (SECRET_CONTENT_RE.test(title) || SECRET_CONTENT_RE.test(bodyText))
      throw new Error('the submission carries credential-shaped content; it never becomes queue material; fail closed');

    // (1) THE REAL 12D-274 INGEST CONTRACT — the digest is its own.
    const prepared = prepareDocumentStories({ tenantId, documentId, title, bodyText });

    // (2) THE REAL 12D-277/278 BOUND ADMISSION — to an ALREADY-REGISTERED
    // source (an unregistered sourceId refuses here: NO REGISTER NO
    // BINDING). A duplicate admission is the operator's CONTINUATION
    // (12D-287): the loop is the operator re-invoking this door for the
    // SAME document, allowed ONLY when the re-submitted bytes re-derive
    // the SAME document digest the queue's own stored objective was
    // admitted with — a document is read as the bytes it was admitted
    // as; changed bytes refuse.
    const bound = admitBoundReading(queue, registerStore as ReadingSourceStore, registerGenesis, prepared, {
      tenantId, sourceId, documentId, documentDigestSha256: prepared.documentDigestSha256,
    });
    const admission = bound.admission as Readonly<Record<string, unknown>>;
    if (typeof admission.duplicates !== 'number' || Number.isNaN(admission.duplicates))
      throw new Error('the bound admission carries a malformed duplicates count; fail closed');
    if (admission.duplicates !== 0) {
      // 12D-287 CONTINUATION GATE (defense-in-depth): the digest was
      // RE-DERIVED from the re-submitted bytes by the real ingest
      // contract; the queue's own stored objective for this document's
      // first chunk is the record of the digest it was admitted with.
      // MEASURED: the 12D-275 queue door's own fingerprint invariant
      // refuses any tampered re-submission (the digest lives inside the
      // objective the fingerprint covers) BEFORE this gate — the gate
      // stays so the cycle itself never trusts changed bytes even if
      // the door's invariant were ever relaxed.
      const firstChunkId = `doc-${documentId}-chunk-1`.slice(0, 128);
      const storedObjective = queue.inspectStoryObjective(tenantId, firstChunkId);
      if (storedObjective === null)
        throw new Error(`the document ${documentId} was admitted (${admission.duplicates} duplicate stories) but its first chunk is not inspectable in this queue; fail closed`);
      const docRef = `doc:${documentId}:${prepared.documentDigestSha256.slice(0, 16)}`;
      if (!storedObjective.includes(docRef))
        throw new Error(`the document ${documentId} was admitted with different bytes; a document is read as the bytes it was admitted as; fail closed`);
    }

    // (3) THE QUEUE IS THE TRUTH ABOUT WHAT TO READ — the first READY
    // story among THIS document's admitted stories; none is an honest
    // stop (the operator reviews or recovers; nothing auto-advances).
    const ready = prepared.stories.filter((st) => {
      const story = queue.inspectStory(tenantId, st.id);
      return story !== null && story.state === 'READY';
    });
    if (ready.length === 0)
      throw new Error('no READY story of this document remains to read; the operator reviews the drafts or recovers FAILED stories; nothing auto-advances; fail closed');
    const headStory = ready[0]!;

    // (4) THE REAL 12D-280 FIRST READER — its own gates apply (head
    // match, model identity, draft gates, durable post-call failures).
    let read: OllamaFirstReaderPacket | null = null;
    try {
      read = await runOllamaFirstReader(queue, bound, {
        tenantId, storyId: headStory.id, sourceId, documentId, title, bodyText,
      }, caller);
    } catch (err) {
      // Re-throw with the real reason; the measured-state refusal below
      // reads the queue truth back.
      throw err instanceof Error ? err : new Error(String(err));
    }

    const remainingReady = prepared.stories.filter((st) => {
      const story = queue.inspectStory(tenantId, st.id);
      return story !== null && story.state === 'READY';
    }).length;
    return Object.freeze({
      kind: 'SUPERVISED_READING_CYCLE' as const,
      policyVersion: SUPERVISED_READING_CYCLE_POLICY.policyVersion,
      tenantId,
      sourceId,
      documentId,
      documentDigestSha256: read.documentDigestSha256,
      storyId: read.storyId,
      storyState: read.storyState,
      continuation: admission.duplicates !== 0,
      chunks: Object.freeze({
        prepared: Number(admission.prepared),
        inserted: Number(admission.inserted),
        duplicates: Number(admission.duplicates),
      }),
      remainingReady,
      model: read.model,
      loopbackEndpoint: read.loopbackEndpoint,
      modelCalls: 1 as const,
      remoteCalls: 0 as const,
      draftChars: read.draftChars,
      draftSha256: read.draftSha256,
      activated: 0 as const,
      learningPromoted: false as const,
      modelWeightMutation: false as const,
      humanDecision: 'REQUIRED' as const,
      stoppedBefore: STOPPED_BEFORE,
    });
  } catch (err) {
    // MEASURED state from the queue truth: a FAILED story means the
    // provider call happened — the failure is durable and modelCalls is
    // 1; a still-READY story means the refusal was pre-call (modelCalls
    // 0). Nothing is retried here either way.
    let storyState: string | null = null;
    let modelCalls: 0 | 1 = 0;
    if (queue instanceof OfflineStoryQueue
      && submission !== null && typeof submission === 'object' && !Array.isArray(submission)) {
      const s = submission as Readonly<Record<string, unknown>>;
      if (typeof s.tenantId === 'string' && typeof s.documentId === 'string') {
        // The story id is only derivable from a successful prepare; on a
        // pre-prepare refusal there is no story to inspect (state null).
        for (const st of storyIdsFor(queue, s.tenantId, s.documentId)) {
          const story = queue.inspectStory(s.tenantId, st);
          if (story !== null) {
            storyState = String(story.state);
            if (storyState === 'FAILED') modelCalls = 1;
            break;
          }
        }
      }
    }
    return Object.freeze({
      kind: 'SUPERVISED_READING_CYCLE_REFUSED' as const,
      policyVersion: SUPERVISED_READING_CYCLE_POLICY.policyVersion,
      reason: err instanceof Error ? err.message : String(err),
      storyState,
      modelCalls,
      remoteCalls: 0 as const,
      activated: 0 as const,
      learningPromoted: false as const,
      humanDecision: 'REQUIRED' as const,
    });
  }
}

/**
 * Measured queue truth: the story ids of one document, read back from
 * the queue's own rows (ids are the ingest contract's deterministic
 * `doc-<documentId>-chunk-<n>` shape, enumerated up to the queue's
 * count for this document — never guessed beyond what the queue holds).
 */
function storyIdsFor(queue: OfflineStoryQueue, tenantId: string, documentId: string): string[] {
  const ids: string[] = [];
  for (let i = 1; i <= 4096; i += 1) {
    const id = `doc-${documentId}-chunk-${i}`.slice(0, 128);
    const story = queue.inspectStory(tenantId, id);
    if (story === null) break;
    ids.push(id);
  }
  return ids;
}