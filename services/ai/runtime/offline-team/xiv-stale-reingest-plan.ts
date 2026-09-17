// 12D-316 — Stale-Source Re-ingestion Plan: the rung that turns a STALE
// staleness assessment (the REAL 12D-315 card) into a BOUNDED, fail-closed
// re-ingestion plan — WITHOUT admitting anything. The operator supplies
// the NEW bytes of a source whose recorded evidence version moved; the
// plan re-derives the staleness through the REAL 12D-315 contract
// (requiring the target document to be assessed STALE — a CURRENT or
// UNCHECKED source has nothing to re-ingest), checks the successor
// documentId is genuinely NEW (never the stale id, never colliding with
// ANY assessed document), and hands the body to the REAL 12D-274 ingest
// door — the ONLY door from a local document to bounded reading stories.
// The plan itself NEVER touches the queue, never calls a model, never
// admits: the operator submits the emitted stories through the REAL
// 12D-275/12D-278 admission doors and decides. The lineage is disclosed
// in full: previous recorded head → the successor's new digest, so the
// evidence-version chain stays tamper-evident by disclosure.
import { prepareDocumentStories, SECRET_CONTENT_RE, type OrdinaryQueueStory } from './xiv-document-ingest';
import { prepareSourceStalenessCard } from './xiv-source-staleness-card';

export const STALE_REINGEST_PLAN_POLICY = Object.freeze({
  policyVersion: '12d-316-v1',
  domain: 'XIV_OS_STALE_REINGEST_PLAN',
});

export const STALE_REINGEST_PLAN_GUARDRAILS = Object.freeze({
  theRealStalenessDerivation: true, // STALE is re-derived via the REAL 12D-315 contract
  theRealIngestDoor: true, // chunks/digests/stories come from the REAL 12D-274 door
  staleOnlyReingested: true, // a CURRENT or UNCHECKED source refuses — nothing to re-ingest
  successorIdMustBeNew: true, // never the stale id, never colliding with an assessed document
  lineageDisclosed: true, // previous head → new head, tamper-evident by disclosure
  nothingAdmittedHere: true, // the operator submits through the REAL admission doors
  deliberateChunkingNeverTruncation: true, // over-budget chunks refuse (the REAL door's rule)
  secretReGate: true, // secrets are never processed, on every carried field
  pureModule: true,
  modelCalls: 0,
  remoteCalls: 0,
  activated: 0,
  collectsNothing: true,
  learningPromoted: false,
  automaticRecovery: false,
  billionUsersProven: false,
  humanDecision: 'REQUIRED' as const,
});

const INPUT_KEYS = ['memoryPacket', 'currentDigests', 'staleDocumentId', 'newDocumentId', 'newTitle', 'newBodyText'] as const;
const MAX_PLAN_CHUNKS = 24;
const ID_RE = /^[A-Za-z0-9][A-Za-z0-9_.:-]{0,127}$/;

export type StaleReingestPlanPacket = Readonly<
  | {
      status: 'VERIFIED';
      kind: 'STALE_REINGEST_PLAN';
      policyVersion: string;
      memoryPacket: unknown;
      currentDigests: readonly Readonly<{ documentId: string; digestSha256: string }>[];
      tenantId: string;
      staleDocumentId: string;
      previousDigestHead: string;
      currentDigestHead: string;
      newDocumentId: string;
      newTitle: string;
      newBodyText: string;
      newDigestSha256: string;
      chunkCount: number;
      storyIds: readonly string[];
      stories: readonly OrdinaryQueueStory[];
      modelCalls: 0;
      remoteCalls: 0;
      activated: 0;
      learningPromoted: false;
      stoppedBefore: string;
      humanDecision: 'REQUIRED';
    }
  | {
      status: 'REFUSED';
      kind: 'STALE_REINGEST_PLAN';
      policyVersion: string;
      reason: string;
      modelCalls: 0;
      remoteCalls: 0;
      activated: 0;
      learningPromoted: false;
      humanDecision: 'REQUIRED';
    }
>;

function refuse(reason: string): StaleReingestPlanPacket {
  return Object.freeze({
    status: 'REFUSED' as const,
    kind: 'STALE_REINGEST_PLAN' as const,
    policyVersion: STALE_REINGEST_PLAN_POLICY.policyVersion,
    reason,
    modelCalls: 0 as const,
    remoteCalls: 0 as const,
    activated: 0 as const,
    learningPromoted: false as const,
    humanDecision: 'REQUIRED' as const,
  });
}

export interface StaleReingestPlanPrepared {
  readonly status: 'PREPARED';
  readonly memoryPacket: unknown;
  readonly currentDigests: readonly Readonly<{ documentId: string; digestSha256: string }>[];
  readonly tenantId: string;
  readonly staleDocumentId: string;
  readonly previousDigestHead: string;
  readonly currentDigestHead: string;
  readonly newDocumentId: string;
  readonly newTitle: string;
  readonly newBodyText: string;
  readonly newDigestSha256: string;
  readonly chunkCount: number;
  readonly stories: readonly OrdinaryQueueStory[];
}

/**
 * Derive ONE re-ingestion plan. NEVER throws; any anomaly refuses. The
 * staleness is re-derived through the REAL 12D-315 contract; the stories
 * are produced by the REAL 12D-274 ingest door; nothing here admits,
 * queues, fetches or calls a model.
 */
export function prepareStaleReingestPlan(
  raw: unknown,
): StaleReingestPlanPrepared | StaleReingestPlanPacket {
  try {
    if (raw === null || typeof raw !== 'object' || Array.isArray(raw))
      return refuse('the input must be an object; fail closed');
    const keys = Object.keys(raw as Record<string, unknown>);
    if (keys.length !== INPUT_KEYS.length || !INPUT_KEYS.every((k, i) => keys[i] === k))
      return refuse(`the input must have exactly the keys [${INPUT_KEYS.join(', ')}] in order; fail closed`);
    const s = raw as Readonly<Record<string, unknown>>;
    for (const [field, value] of [['staleDocumentId', s.staleDocumentId], ['newDocumentId', s.newDocumentId], ['newTitle', s.newTitle], ['newBodyText', s.newBodyText]] as const) {
      if (typeof value !== 'string' || value.length < 1)
        return refuse(`a non-empty string ${field} is required; fail closed`);
      // Only the two identifiers are id-shaped; the title is free text
      // (bounded by the REAL 12D-274 door) and the body is source bytes.
      if (field !== 'newTitle' && field !== 'newBodyText' && !ID_RE.test(value))
        return refuse(`the ${field} must be a bounded id-shaped string; fail closed`);
      if (SECRET_CONTENT_RE.test(value))
        return refuse(`${field} is secret-shaped; secrets are never processed; fail closed`);
    }
    // Validated identities captured as locals (the screening loop above
    // does not narrow the record's property types).
    const vStaleDocumentId = s.staleDocumentId as string;
    const vNewDocumentId = s.newDocumentId as string;
    const vNewTitle = s.newTitle as string;
    const vNewBodyText = s.newBodyText as string;
    // THE STALENESS IS RE-DERIVED through the REAL 12D-315 contract —
    // never trusted from the caller.
    const staleness = prepareSourceStalenessCard({ memoryPacket: s.memoryPacket, currentDigests: s.currentDigests });
    if (staleness.status === 'REFUSED')
      return refuse(`the staleness derivation refused (${staleness.reason}); the plan refuses; fail closed`);
    const row = staleness.assessed.find((a) => a.documentId === vStaleDocumentId);
    if (row === undefined)
      return refuse('the target document is not carried by the verified memory packet; fail closed');
    if (row.verdict !== 'STALE')
      return refuse(`nothing to re-ingest: the target document is assessed ${row.verdict}, not STALE; fail closed`);
    // The successor id must be genuinely NEW — never the stale id and
    // never colliding with ANY assessed document (carried, supplied, or
    // pattern-absent).
    if (staleness.assessed.some((a) => a.documentId === vNewDocumentId))
      return refuse('the successor documentId collides with an assessed document; choose a genuinely new id; fail closed');
    // THE STORIES ARE PRODUCED BY THE REAL 12D-274 INGEST DOOR — this
    // plan never re-implements chunking, digesting or story shaping.
    const ingest = prepareDocumentStories({
      tenantId: staleness.tenantId,
      documentId: vNewDocumentId,
      title: vNewTitle,
      bodyText: vNewBodyText,
    });
    if (ingest.chunkCount > MAX_PLAN_CHUNKS)
      return refuse(`the re-ingestion produced ${ingest.chunkCount} chunks (over the ${MAX_PLAN_CHUNKS} plan cap); re-chunk the source deliberately; fail closed`);
    return Object.freeze({
      status: 'PREPARED' as const,
      memoryPacket: s.memoryPacket,
      currentDigests: Object.freeze(staleness.currentDigests.map((d) => Object.freeze({ ...d }))),
      tenantId: staleness.tenantId,
      staleDocumentId: vStaleDocumentId,
      previousDigestHead: row.recordedDigestHead,
      currentDigestHead: row.currentDigestHead,
      newDocumentId: vNewDocumentId,
      newTitle: vNewTitle,
      newBodyText: vNewBodyText,
      newDigestSha256: ingest.documentDigestSha256,
      chunkCount: ingest.chunkCount,
      stories: ingest.stories,
    });
  } catch (err) {
    return refuse(err instanceof Error ? err.message : String(err));
  }
}

/**
 * Emit the FROZEN plan packet from a prepared plan (the exact shape the
 * view model re-verifies). Pure derivation — nothing here admits.
 */
export function buildStaleReingestPlanPacket(
  prepared: StaleReingestPlanPrepared,
): StaleReingestPlanPacket {
  if (prepared.status !== 'PREPARED')
    return refuse('the plan packet is built only from a PREPARED plan; fail closed');
  return Object.freeze({
    status: 'VERIFIED' as const,
    kind: 'STALE_REINGEST_PLAN' as const,
    policyVersion: STALE_REINGEST_PLAN_POLICY.policyVersion,
    memoryPacket: prepared.memoryPacket,
    currentDigests: prepared.currentDigests,
    tenantId: prepared.tenantId,
    staleDocumentId: prepared.staleDocumentId,
    previousDigestHead: prepared.previousDigestHead,
    currentDigestHead: prepared.currentDigestHead,
    newDocumentId: prepared.newDocumentId,
    newTitle: prepared.newTitle,
    newBodyText: prepared.newBodyText,
    newDigestSha256: prepared.newDigestSha256,
    chunkCount: prepared.chunkCount,
    storyIds: Object.freeze(prepared.stories.map((story) => story.id)),
    stories: prepared.stories,
    modelCalls: 0 as const,
    remoteCalls: 0 as const,
    activated: 0 as const,
    learningPromoted: false as const,
    stoppedBefore: 'preparation only — nothing admitted, nothing queued, no model ran; the operator submits through the real doors and decides',
    humanDecision: 'REQUIRED' as const,
  });
}