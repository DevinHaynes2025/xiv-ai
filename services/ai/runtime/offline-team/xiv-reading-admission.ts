// 12D-275 — Reading Admission Door: the supervised, operator-driven step
// that admits 12D-274-prepared reading stories into a REAL 12D-1xx
// offline story queue, and reports a MEASURED admission census. This is
// the next rung of the reading chain started in 12D-274 (the CEO's
// 2026-09-16 directive — "use all the documents and get the AI agents to
// start learning and reading"): the bridge PREPARED the stories; THIS
// door ADMITS them — and it is supervised: an operator runs it against a
// queue they chose, and it re-verifies the prepared result structurally
// BEFORE a single row is written.
//
// Rules, structurally enforced:
//   * RE-VERIFIED, NEVER TRUSTED: the prepared result must be exactly
//     the shape prepareDocumentStories produces (exact keys, in order),
//     its policyVersion must be this chain's, and every story must
//     cross-bind to the SAME document digest (sourceRevision ===
//     digest.slice(0,40)), the approved master plan hash, the tenant,
//     the chunk sequence (id === doc-<documentId>-chunk-<i+1>), and the
//     ORDINARY PRODUCT_STORY shape with the memory_curator role. A
//     prepared result whose stories belong to a different document
//     refuses — cross-binding is the point.
//   * THE REAL QUEUE'S OWN CONTRACT does the admission: this door calls
//     the queue's own enqueue() (validation, fingerprints, dedup, the
//     1,000-row batch bound, and the 2,000,000-row policy ceiling are
//     the QUEUE's, never re-implemented here). After admission the
//     door re-derives the queue's own measured summary() for the tenant.
//   * MEASURED COUNTS ONLY: the result reports what the queue measured
//     (inserted, duplicates, the summary's GROUP BY counts). The
//     ceiling is never rendered as achieved usage; liveAgentCount stays
//     the honest null.
//   * SUPERVISED, NOT AUTOMATIC: this door never claims, never
//     settles, never reviews, never activates. It admits and reports.
//     Any weight-mutation learning promotion stays a CEO decision,
//     outside this module (learningPromotionStaysCEOgated).
//   * OPERATOR/RUNTIME-SIDE ONLY: this module imports the queue (it is
//     SQLite-backed) and must NEVER be imported by the story shell —
//     the shell stays database-free (the 12D-273 lesson). There is no
//     shell surface for this door, by design.
//
// Disclosed residuals:
//   * The door trusts the queue INSTANCE it is handed (the operator's
//     choice of database file is the supervision point); it never
//     opens, creates, or relocates a database.
//   * The structural re-verification proves the prepared result is
//     well-formed and cross-bound; it cannot prove which PROCESS
//     produced it — the digest chain (sourceRevision) is the bound.

import {
  APPROVED_MASTER_PLAN_SHA256,
} from './approved-master-plan-meeting';
import { OFFLINE_QUEUE_POLICY, OfflineStoryQueue } from './offline-story-queue';
import type { OrdinaryQueueStory } from './xiv-document-ingest';

export const READING_ADMISSION_POLICY = Object.freeze({
  policyVersion: '12d-275-v1',
  domain: 'XIV_OS_READING_ADMISSION',
  maxBatchStories: OFFLINE_QUEUE_POLICY.maxBatch,
});

export const READING_ADMISSION_GUARDRAILS = Object.freeze({
  supervisedOperatorDoor: true, // an operator runs it against a chosen queue
  reVerifiesPreparedNeverTrusted: true, // exact shape + cross-binding before any write
  realQueueContractOnly: true, // enqueue() and summary() are the queue's own
  measuredCountsOnly: true, // the ceiling is a POLICY bound, never achieved usage
  noClaimNoSettleNoReview: true, // this door admits; it never works the queue
  noActivationPath: true,
  learningPromotionStaysCEOgated: true, // ANY weight mutation is a CEO decision, elsewhere
  shellDatabaseFree: true, // never imported by the story shell
  deterministic: true,
  modelCalls: 0,
  remoteCalls: 0,
  collectsNothing: true,
  learningPromoted: false,
  automaticRecovery: false,
  billionUsersProven: false,
  humanDecision: 'REQUIRED' as const,
});

const PREPARED_KEYS = ['policyVersion', 'documentId', 'tenantId', 'documentDigestSha256', 'chunkCount', 'stories'] as const;
const STORY_KEYS = ['id', 'tenantId', 'roleId', 'objective', 'acceptance', 'dependencies', 'sourceRevision', 'masterPlanSha256', 'securityClass', 'kind'] as const;
const ID_RE = /^[A-Za-z0-9][A-Za-z0-9_.:-]{0,127}$/;
const HEX64_RE = /^[0-9a-f]{64}$/;
const INGEST_POLICY_VERSION = '12d-274-v1';
const ROLE_ID = 'memory_curator';

export type ReadingAdmissionResult = Readonly<{
  kind: 'READING_STORIES_ADMITTED';
  policyVersion: string;
  documentId: string;
  tenantId: string;
  documentDigestSha256: string;
  admission: Readonly<{ prepared: number; inserted: number; duplicates: number }>;
  census: Readonly<{
    counts: readonly unknown[];
    leaseHeld: boolean;
    leaseExpired: boolean;
    liveAgentCount: null;
    capacityRowsAreUserStories: false;
    hostWideCoordinationVerified: false;
  }>;
  learningPromoted: false;
  activated: 0;
  humanDecision: 'REQUIRED';
}>;

/**
 * The supervised door from prepared reading stories to the REAL queue.
 * Accepts a trusted OfflineStoryQueue instance and a prepared result;
 * re-verifies BOTH structurally, admits through the queue's own
 * enqueue(), and returns a frozen MEASURED census. Throws on ANY
 * anomaly — fail closed, nothing is written unless every gate passes.
 */
export function admitReadingStories(
  queue: unknown,
  prepared: unknown,
): ReadingAdmissionResult {
  // The queue is the operator's choice — a trusted instance, never a path.
  if (!(queue instanceof OfflineStoryQueue))
    throw new Error('a trusted OfflineStoryQueue instance is required; the door never opens a database; fail closed');
  if (prepared === null || typeof prepared !== 'object' || Array.isArray(prepared))
    throw new Error('a prepared document-ingest result object is required; fail closed');
  const keys = Object.keys(prepared as Record<string, unknown>);
  if (keys.length !== PREPARED_KEYS.length || !PREPARED_KEYS.every((k, i) => keys[i] === k))
    throw new Error(`a prepared result must have exactly the keys [${PREPARED_KEYS.join(', ')}] in order; fail closed`);
  const p = prepared as Readonly<Record<string, unknown>>;
  if (p.policyVersion !== INGEST_POLICY_VERSION)
    throw new Error(`the prepared result must be 12d-274 ingest material (${INGEST_POLICY_VERSION}); fail closed`);
  if (typeof p.documentId !== 'string' || !ID_RE.test(p.documentId))
    throw new Error('a scoped document id is required; fail closed');
  if (typeof p.tenantId !== 'string' || !ID_RE.test(p.tenantId))
    throw new Error('a scoped tenant id is required; fail closed');
  if (typeof p.documentDigestSha256 !== 'string' || !HEX64_RE.test(p.documentDigestSha256))
    throw new Error('a hex64 document digest is required; fail closed');
  if (typeof p.chunkCount !== 'number' || !Number.isSafeInteger(p.chunkCount) || p.chunkCount < 1)
    throw new Error('a positive chunkCount is required; fail closed');
  if (!Array.isArray(p.stories) || p.stories.length < 1)
    throw new Error('a non-empty stories array is required; fail closed');
  if (p.stories.length !== p.chunkCount)
    throw new Error('chunkCount must equal the prepared stories count; fail closed');
  if (p.stories.length > READING_ADMISSION_POLICY.maxBatchStories)
    throw new Error(`the prepared batch exceeds the queue's own batch bound (${READING_ADMISSION_POLICY.maxBatchStories}); chunk the admission deliberately; fail closed`);

  const sourceRevision = p.documentDigestSha256.slice(0, 40);
  const digest16 = p.documentDigestSha256.slice(0, 16);
  const stories: OrdinaryQueueStory[] = [];
  for (let i = 0; i < p.stories.length; i++) {
    const story = p.stories[i];
    if (story === null || typeof story !== 'object' || Array.isArray(story))
      throw new Error('every prepared story must be an object; fail closed');
    const sk = Object.keys(story as Record<string, unknown>);
    if (sk.length !== STORY_KEYS.length || !STORY_KEYS.every((k, j) => sk[j] === k))
      throw new Error(`a prepared story must have exactly the keys [${STORY_KEYS.join(', ')}] in order; fail closed`);
    const s = story as Readonly<Record<string, unknown>>;
    if (s.id !== `doc-${p.documentId}-chunk-${i + 1}`)
      throw new Error(`prepared story ${i + 1} carries a foreign or reordered chunk id; fail closed`);
    if (typeof s.objective !== 'string' || s.objective.length < 1 || s.objective.length > 3000)
      throw new Error('a prepared story objective must be bounded (1..3000 chars); fail closed');
    if (!Array.isArray(s.acceptance) || s.acceptance.length < 1 || s.acceptance.length > 8
      || !(s.acceptance as readonly unknown[]).every((a) => typeof a === 'string' && a.length > 0 && a.length <= 500))
      throw new Error('prepared story acceptance must be 1..8 bounded strings; fail closed');
    if (!Array.isArray(s.dependencies) || (s.dependencies as readonly unknown[]).length !== 0)
      throw new Error('a reading story has no dependencies; fail closed');
    // CROSS-BINDING: the story belongs to THIS document digest, THIS
    // tenant, THIS plan, and the ORDINARY memory_curator reading shape.
    if (s.tenantId !== p.tenantId)
      throw new Error(`a prepared story carries a foreign tenant; fail closed`);
    if (s.sourceRevision !== sourceRevision)
      throw new Error('a prepared story is not bound to the stated document digest (sourceRevision mismatch); fail closed');
    if (s.masterPlanSha256 !== APPROVED_MASTER_PLAN_SHA256)
      throw new Error('a prepared story must carry the approved master plan hash; fail closed');
    if (s.securityClass !== 'ORDINARY' || s.kind !== 'PRODUCT_STORY' || s.roleId !== ROLE_ID)
      throw new Error('prepared reading stories are ORDINARY memory_curator PRODUCT_STORIES; fail closed');
    if (typeof s.objective === 'string' && !s.objective.includes(digest16))
      throw new Error('a prepared story objective must cite the document digest; fail closed');
    stories.push(s as unknown as OrdinaryQueueStory);
  }

  // THE REAL QUEUE'S OWN CONTRACT does the admission.
  const admitted = queue.enqueue(stories);
  // Cross-consistency the queue's own contract makes certain.
  if (admitted.inserted + admitted.duplicates !== stories.length)
    throw new Error('the queue admission accounting does not add up; fail closed');
  const census = queue.summary(p.tenantId);
  return Object.freeze({
    kind: 'READING_STORIES_ADMITTED' as const,
    policyVersion: READING_ADMISSION_POLICY.policyVersion,
    documentId: p.documentId,
    tenantId: p.tenantId,
    documentDigestSha256: p.documentDigestSha256,
    admission: Object.freeze({
      prepared: stories.length,
      inserted: admitted.inserted,
      duplicates: admitted.duplicates,
    }),
    census: Object.freeze({
      counts: Object.freeze(census.counts),
      leaseHeld: census.leaseHeld,
      leaseExpired: census.leaseExpired,
      liveAgentCount: null as null,
      capacityRowsAreUserStories: false as const,
      hostWideCoordinationVerified: false as const,
    }),
    learningPromoted: false as const,
    activated: 0 as const,
    humanDecision: 'REQUIRED' as const,
  });
}