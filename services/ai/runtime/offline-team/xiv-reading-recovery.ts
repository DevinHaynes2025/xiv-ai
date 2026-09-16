// 12D-288 — FAILED→READY OPERATOR RECOVERY DOOR for reading chunks.
//
// The 12D-287 handoff's open question: the queue's recovery doors cover
// HELD leases only (returnUnstarted / voidLease); a story settled FAILED
// — e.g. by the measured durable `ollama returned HTTP 500` the GHG
// queue's chunk-2 carries — had NO path back to READY, so its chunk of
// the document could never be read. This rung is that door, and it is
// OPERATOR-gated by design:
//
//   - Recovery is NEVER automatic (automaticRecovery false): the
//     operator explicitly re-submits the document bytes + an operator
//     ref, and exactly ONE FAILED story is re-queued per invocation
//     (the rest stay measured in the packet).
//   - THE BYTES ARE RE-PROVEN FIRST, through the REAL contracts: the
//     REAL 12D-274 ingest contract re-derives the document digest from
//     the re-submitted bytes, and the REAL 12D-277/278 bound admission
//     re-runs — so an UNREGISTERED source refuses (NO REGISTER NO
//     BINDING) and CHANGED bytes refuse at the queue door's own
//     fingerprint invariant, BEFORE anything is recovered. The door
//     then reads the FAILED chunk's own stored objective
//     (inspectStoryObjective) and requires the docRef of the
//     RE-DERIVED digest — the same continuation discipline as 12D-287:
//     a document is read as the bytes it was admitted as.
//   - NO MODEL CALL RUNS HERE (modelCalls 0): recovery only re-queues.
//     The re-READ is the operator's next supervised-cycle invocation
//     (12D-283), which reads the recovered chunk as the queue's first
//     READY story — the stop-before-review discipline is never
//     bypassed by recovering.
//   - The operator ref is ECHOED to the caller, never stored as a
//     review or settlement record (the voidLease discipline).
//
// HONEST FAILURE: this door NEVER THROWS. Any refusal — malformed
// request, unregistered source, changed bytes, no FAILED story, a held
// lease covering the target — returns an honest REFUSED packet whose
// reason is the real contract's own message, with MEASURED state read
// back from the queue. Refused packets carry ZERO document text.
import { OfflineStoryQueue } from './offline-story-queue';
import {
  prepareDocumentStories, SECRET_CONTENT_RE,
} from './xiv-document-ingest';
import { admitBoundReading } from './xiv-bound-admission';
import type { ReadingSourceStore } from './xiv-reading-source-register';

export const READING_RECOVERY_POLICY = Object.freeze({
  policyVersion: '12d-288-v1',
  domain: 'XIV_OS_READING_RECOVERY',
  /** One FAILED chunk re-queued per invocation — the loop is the operator. */
  chunksPerRecovery: 1,
  maxSourceIdChars: 128,
  maxDocumentIdChars: 128,
  maxTitleChars: 256,
  maxOperatorRefChars: 256,
});

export const READING_RECOVERY_GUARDRAILS = Object.freeze({
  failedOnlyDoor: true,
  explicitOperatorAction: true,
  automaticRecovery: false, // NEVER a retry loop; nothing auto-advances
  bytesReprovenBeforeRecovery: true, // REAL ingest + bound admission + stored docRef
  heldLeaseOnTargetRefuses: true, // the lease doors own held leases
  oneChunkPerRecovery: true,
  neverRegistersSource: true, // this door never registers a source
  noModelCallInRecovery: true, // modelCalls 0 — the re-read is the cycle's next invocation
  realContractsOnly: true, // 12D-274 + 12D-277/278 + the queue's own doors
  neverThrowsReturnsRefused: true,
  refusedCarriesZeroDocumentText: true,
  operatorRefEchoedNeverStored: true,
  remoteCalls: 0,
  collectsNothing: true,
  learningPromoted: false,
  activated: 0,
  modelWeightMutation: false,
  billionUsersProven: false,
  humanDecision: 'REQUIRED' as const,
});

export const READING_RECOVERY_SUBMISSION_KEYS = [
  'tenantId', 'sourceId', 'documentId', 'title', 'bodyText', 'operatorRef',
] as const;

export type ReadingRecoveryPacket = Readonly<{
  kind: 'READING_RECOVERY';
  policyVersion: string;
  tenantId: string;
  sourceId: string;
  documentId: string;
  documentDigestSha256: string;
  storyId: string;
  priorState: 'FAILED';
  storyState: 'READY';
  /** Echoed to the operator for their own record — never stored in the queue. */
  operatorRef: string;
  chunks: Readonly<{ prepared: number; inserted: number; duplicates: number }>;
  remainingFailed: number;
  modelCalls: 0;
  remoteCalls: 0;
  automaticRecovery: false;
  humanDecision: 'REQUIRED';
  nextStep: string;
}>;

export type ReadingRecoveryRefused = Readonly<{
  kind: 'READING_RECOVERY_REFUSED';
  policyVersion: string;
  reason: string;
  /** Measured queue truth AFTER the refusal: null if the story is not inspectable. */
  storyState: string | null;
  modelCalls: 0;
  remoteCalls: 0;
  automaticRecovery: false;
  humanDecision: 'REQUIRED';
}>;

const NEXT_STEP = 'the operator re-invokes the supervised reading cycle (12D-283); the recovered chunk is read as the bytes it was admitted as, and the draft still stops before review';

/**
 * The recovery door's ONLY entry: re-prove the document bytes through
 * the REAL contracts, then re-queue exactly one FAILED story. Accepts
 * ANY unknown values; returns a frozen packet that is either a measured
 * recovery or an honest refusal. Never throws.
 */
export function recoverFailedReadingChunk(
  queue: unknown,
  registerStore: unknown,
  registerGenesis: unknown,
  recovery: unknown,
): ReadingRecoveryPacket | ReadingRecoveryRefused {
  try {
    if (!(queue instanceof OfflineStoryQueue))
      throw new Error('a trusted OfflineStoryQueue instance is required; this door never opens its own database; fail closed');
    if (typeof registerStore !== 'object' || registerStore === null
      || typeof (registerStore as ReadingSourceStore).load !== 'function'
      || typeof (registerStore as ReadingSourceStore).save !== 'function')
      throw new Error('a trusted reading source register store is required; fail closed');
    if (typeof registerGenesis !== 'string' || registerGenesis.length < 8)
      throw new Error('the register genesis must be a string of at least 8 chars; fail closed');
    if (recovery === null || typeof recovery !== 'object' || Array.isArray(recovery))
      throw new Error('a recovery request object is required; fail closed');
    const keys = Object.keys(recovery as Record<string, unknown>);
    if (keys.length !== READING_RECOVERY_SUBMISSION_KEYS.length
      || !READING_RECOVERY_SUBMISSION_KEYS.every((k, i) => keys[i] === k))
      throw new Error(`a recovery request must have exactly the keys [${READING_RECOVERY_SUBMISSION_KEYS.join(', ')}] in order; fail closed`);
    const r = recovery as Readonly<Record<string, unknown>>;
    for (const k of READING_RECOVERY_SUBMISSION_KEYS) {
      if (typeof r[k] !== 'string' || (r[k] as string).length === 0)
        throw new Error(`the recovery field ${k} must be a non-empty string; fail closed`);
    }
    const tenantId = r.tenantId as string;
    const sourceId = r.sourceId as string;
    const documentId = r.documentId as string;
    const title = r.title as string;
    const bodyText = r.bodyText as string;
    const operatorRef = r.operatorRef as string;
    if (sourceId.length > READING_RECOVERY_POLICY.maxSourceIdChars)
      throw new Error(`the source id exceeds ${READING_RECOVERY_POLICY.maxSourceIdChars} chars; fail closed`);
    if (documentId.length > READING_RECOVERY_POLICY.maxDocumentIdChars)
      throw new Error(`the document id exceeds ${READING_RECOVERY_POLICY.maxDocumentIdChars} chars; fail closed`);
    if (title.length > READING_RECOVERY_POLICY.maxTitleChars)
      throw new Error(`the title exceeds ${READING_RECOVERY_POLICY.maxTitleChars} chars; fail closed`);
    if (operatorRef.length > READING_RECOVERY_POLICY.maxOperatorRefChars)
      throw new Error(`the operator ref exceeds ${READING_RECOVERY_POLICY.maxOperatorRefChars} chars; fail closed`);
    if (SECRET_CONTENT_RE.test(title) || SECRET_CONTENT_RE.test(bodyText))
      throw new Error('the recovery request carries credential-shaped content; it never becomes queue material; fail closed');

    // (1) THE REAL 12D-274 INGEST CONTRACT — the digest is re-derived
    // from the re-submitted bytes; nothing is trusted from the request.
    const prepared = prepareDocumentStories({ tenantId, documentId, title, bodyText });

    // (2) THE REAL 12D-277/278 BOUND ADMISSION — an unregistered source
    // refuses here (NO REGISTER NO BINDING) and CHANGED bytes refuse at
    // the queue door's own fingerprint invariant. A duplicate admission
    // is EXPECTED here (the stories already exist); it is the re-proof.
    const bound = admitBoundReading(queue, registerStore as ReadingSourceStore, registerGenesis, prepared, {
      tenantId, sourceId, documentId, documentDigestSha256: prepared.documentDigestSha256,
    });
    const admission = bound.admission as Readonly<Record<string, unknown>>;
    if (typeof admission.duplicates !== 'number' || Number.isNaN(admission.duplicates))
      throw new Error('the bound admission carries a malformed duplicates count; fail closed');

    // (3) THE QUEUE IS THE TRUTH about WHAT failed: the FIRST FAILED
    // story among this document's admitted stories (ordinal order).
    // None is an honest stop — recovery recovers exactly one story per
    // invocation and the loop is the operator.
    const failed: string[] = [];
    const states: string[] = [];
    for (const st of prepared.stories) {
      const story = queue.inspectStory(tenantId, st.id);
      if (story === null) continue;
      states.push(String(story.state));
      if (story.state === 'FAILED') failed.push(st.id);
    }
    if (failed.length === 0)
      throw new Error(`no FAILED story of this document remains to recover (measured states: ${states.join(', ') || 'none inspectable'}); recovery is a FAILED-only door; fail closed`);
    const target = failed[0]!;

    // (4) THE QUEUE'S OWN RECORD: the target chunk's stored objective is
    // the record of the docRef it was admitted with — the re-derived
    // digest must match it. MEASURED: the queue door's own fingerprint
    // invariant already refused any tampered re-submission ABOVE (the
    // digest lives inside the fingerprinted objective); this proof is
    // disclosed defense-in-depth, like the 12D-287 continuation gate.
    const storedObjective = queue.inspectStoryObjective(tenantId, target);
    if (storedObjective === null)
      throw new Error(`the FAILED story ${target} is not inspectable in this queue; fail closed`);
    const docRef = `doc:${documentId}:${prepared.documentDigestSha256.slice(0, 16)}`;
    if (!storedObjective.includes(docRef))
      throw new Error(`the story ${target} was admitted with different bytes; a document is read as the bytes it was admitted as; fail closed`);

    // (5) THE HELD-LEASE PRE-GATE (measured, disclosed): a held lease
    // covering the TARGET refuses — the lease doors own held leases. A
    // lease held on a DIFFERENT story does not block recovery.
    const held = queue.inspectHeldLease();
    if (held !== null && held.tenantId === tenantId && held.storyId === target)
      throw new Error(`a held lease covers the story ${target}; settle it or use the operator voidLease door; fail closed`);

    // (6) THE REAL 12D-288 QUEUE DOOR — its own gates re-run (FAILED
    // only, held-lease check, output-hash clear).
    const recovered = queue.recoverFailedStory({ tenantId, storyId: target, operatorRef });
    if (recovered !== 'READY')
      throw new Error('the queue recovery did not report READY; fail closed');
    // The queue truth re-read AFTER the recovery: the story IS READY.
    const after = queue.inspectStory(tenantId, target);
    if (after === null || after.state !== 'READY')
      throw new Error('the recovered story did not settle READY in the queue truth; fail closed');
    return Object.freeze({
      kind: 'READING_RECOVERY' as const,
      policyVersion: READING_RECOVERY_POLICY.policyVersion,
      tenantId,
      sourceId,
      documentId,
      documentDigestSha256: prepared.documentDigestSha256,
      storyId: target,
      priorState: 'FAILED' as const,
      storyState: 'READY' as const,
      operatorRef,
      chunks: Object.freeze({
        prepared: Number(admission.prepared),
        inserted: Number(admission.inserted),
        duplicates: Number(admission.duplicates),
      }),
      remainingFailed: failed.length - 1,
      modelCalls: 0 as const,
      remoteCalls: 0 as const,
      automaticRecovery: false as const,
      humanDecision: 'REQUIRED' as const,
      nextStep: NEXT_STEP,
    });
  } catch (err) {
    // MEASURED state from the queue truth (chunk-1 first), mirroring the
    // supervised cycle's measured-state residual.
    let storyState: string | null = null;
    if (queue instanceof OfflineStoryQueue
      && recovery !== null && typeof recovery === 'object' && !Array.isArray(recovery)) {
      const r = recovery as Readonly<Record<string, unknown>>;
      if (typeof r.tenantId === 'string' && typeof r.documentId === 'string') {
        for (let i = 1; i <= 4096; i += 1) {
          const id = `doc-${r.documentId}-chunk-${i}`.slice(0, 128);
          if (!/^[A-Za-z0-9_.:-]{1,128}$/.test(id)) break;
          const story = queue.inspectStory(r.tenantId, id);
          if (story === null) break;
          storyState = String(story.state);
          break;
        }
      }
    }
    return Object.freeze({
      kind: 'READING_RECOVERY_REFUSED' as const,
      policyVersion: READING_RECOVERY_POLICY.policyVersion,
      reason: err instanceof Error ? err.message : String(err),
      storyState,
      modelCalls: 0 as const,
      remoteCalls: 0 as const,
      automaticRecovery: false as const,
      humanDecision: 'REQUIRED' as const,
    });
  }
}