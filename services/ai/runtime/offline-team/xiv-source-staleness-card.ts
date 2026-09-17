// 12D-315 — Source Staleness Card: the OpenWiki "Grounded Claims"
// discipline applied to the XIV AI OS memory block — a fact is grounded
// in the SOURCE BYTES it was read as, and STALE evidence requires work
// even if the caller omits it. The operator re-fetches a source and
// supplies its CURRENT digest (the card never fetches — it is a pure
// module, modelCalls 0); the card compares the digest the facts were
// READ as (recorded in the objectives as
// `doc:<documentId>:<digestHead16>` — the same record the REAL 12D-287
// continuation gate binds re-submissions to) against the digest the
// bytes have NOW, and derives the verdict honestly:
//   * STALE_SOURCES_PRESENT — a source changed after its facts were
//     read; the affected reviewed facts are disclosed BY storyId (they
//     stay in the packet — the card never mutates memory — but the
//     operator now knows they cite evidence that moved);
//   * UNCHECKED_SOURCES_PRESENT — a carried document was never checked;
//     undisclosed staleness is not allowed to look like currency;
//   * ALL_CURRENT — every carried document's recorded head matches the
//     re-fetched bytes.
// Fail closed end to end: exact keys in order, REAL 12D-306 packet gate,
// hex64 digest shape, distinct documentIds, honest flags pinned, no
// write path, no weight mutation, nothing activated, nothing fetched.
import { buildAssistantMemoryViewModel } from './xiv-assistant-memory-view-model';
import { SECRET_CONTENT_RE } from './xiv-document-ingest';

export const SOURCE_STALENESS_CARD_POLICY = Object.freeze({
  policyVersion: '12d-315-v1',
  domain: 'XIV_OS_SOURCE_STALENESS_CARD',
});

export const SOURCE_STALENESS_CARD_GUARDRAILS = Object.freeze({
  theRealMemoryGate: true, // the packet goes through the REAL 12D-306 view-model gate
  evidenceVersionRecordedInObjectives: true, // the SAME record the 12D-287 gate binds to
  staleEvidenceDisclosedByStoryId: true, // OpenWiki's "stale claims require work"
  uncheckedIsNotCurrent: true, // a document nobody re-fetched renders UNCHECKED
  cardNeverMutatesMemory: true, // the packet is rendered, never rewritten
  cardNeverFetches: true, // the operator supplies the re-fetched digests
  digestShapeEnforced: true, // hex64, lowercase
  verificationOnly: true, // no model call, no caller, nothing drafted
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

const INPUT_KEYS = ['memoryPacket', 'currentDigests'] as const;
const MAX_DIGEST_ENTRIES = 24;
const DOCUMENT_ID_RE = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/;
const SHA_RE = /^[0-9a-f]{64}$/;
const DOC_REF_RE = /doc:([^:\s"]+):([0-9a-f]{16})/;

export type DocumentStalenessVerdict =
  | 'CURRENT'
  | 'STALE'
  | 'UNCHECKED'
  | 'PATTERN_ABSENT';

export type AssessedDocument = Readonly<{
  documentId: string;
  recordedDigestHead: string;
  currentDigestHead: string;
  verdict: DocumentStalenessVerdict;
}>;

export type SourceStalenessVerdict =
  | 'ALL_CURRENT'
  | 'UNCHECKED_SOURCES_PRESENT'
  | 'STALE_SOURCES_PRESENT';

export type SourceStalenessCardPacket = Readonly<
  | {
      status: 'VERIFIED';
      kind: 'SOURCE_STALENESS_CARD';
      policyVersion: string;
      memoryPacket: unknown;
      currentDigests: readonly Readonly<{ documentId: string; digestSha256: string }>[];
      tenantId: string;
      assessed: readonly AssessedDocument[];
      staleCount: number;
      staleDocumentIds: readonly string[];
      uncheckedCount: number;
      affectedStoryIds: readonly string[];
      verdict: SourceStalenessVerdict;
      modelCalls: 0;
      remoteCalls: 0;
      activated: 0;
      learningPromoted: false;
      stoppedBefore: string;
      humanDecision: 'REQUIRED';
    }
  | {
      status: 'REFUSED';
      kind: 'SOURCE_STALENESS_CARD';
      policyVersion: string;
      reason: string;
      modelCalls: 0;
      remoteCalls: 0;
      activated: 0;
      learningPromoted: false;
      humanDecision: 'REQUIRED';
    }
>;

function refuse(reason: string): SourceStalenessCardPacket {
  return Object.freeze({
    status: 'REFUSED' as const,
    kind: 'SOURCE_STALENESS_CARD' as const,
    policyVersion: SOURCE_STALENESS_CARD_POLICY.policyVersion,
    reason,
    modelCalls: 0 as const,
    remoteCalls: 0 as const,
    activated: 0 as const,
    learningPromoted: false as const,
    humanDecision: 'REQUIRED' as const,
  });
}

export interface SourceStalenessCardPrepared {
  readonly status: 'PREPARED';
  readonly memoryPacket: unknown;
  readonly currentDigests: readonly Readonly<{ documentId: string; digestSha256: string }>[];
  readonly tenantId: string;
  readonly assessed: readonly AssessedDocument[];
  readonly staleDocumentIds: readonly string[];
  readonly affectedStoryIds: readonly string[];
  readonly verdict: SourceStalenessVerdict;
}

/**
 * Derive ONE staleness card. NEVER throws; any anomaly refuses. The
 * memory packet is verified through the REAL 12D-306 gate — a refused
 * packet refuses the card and the refusal carries no memory content.
 * The digest entries are screened BEFORE any comparison; the card never
 * fetches and never mutates the packet.
 */
export function prepareSourceStalenessCard(
  raw: unknown,
): SourceStalenessCardPrepared | SourceStalenessCardPacket {
  try {
    if (raw === null || typeof raw !== 'object' || Array.isArray(raw))
      return refuse('the input must be an object; fail closed');
    const keys = Object.keys(raw as Record<string, unknown>);
    if (keys.length !== INPUT_KEYS.length || !INPUT_KEYS.every((k, i) => keys[i] === k))
      return refuse(`the input must have exactly the keys [${INPUT_KEYS.join(', ')}] in order; fail closed`);
    const p = raw as Readonly<Record<string, unknown>>;
    // THE CURRENT DIGESTS ARE SCREENED before anything is derived.
    if (!Array.isArray(p.currentDigests) || p.currentDigests.length < 1 || p.currentDigests.length > MAX_DIGEST_ENTRIES)
      return refuse(`currentDigests must be an array of 1..${MAX_DIGEST_ENTRIES} {documentId, digestSha256} entries; fail closed`);
    const seen = new Set<string>();
    const digests: { documentId: string; digestSha256: string }[] = [];
    for (const entry of p.currentDigests as unknown[]) {
      if (entry === null || typeof entry !== 'object' || Array.isArray(entry))
        return refuse('each currentDigests entry must be an object; fail closed');
      const eKeys = Object.keys(entry as Record<string, unknown>);
      if (eKeys.length !== 2 || eKeys[0] !== 'documentId' || eKeys[1] !== 'digestSha256')
        return refuse('each currentDigests entry must have exactly the keys [documentId, digestSha256] in order; fail closed');
      const e = entry as Readonly<Record<string, unknown>>;
      if (typeof e.documentId !== 'string' || !DOCUMENT_ID_RE.test(e.documentId))
        return refuse('each documentId must be a bounded id-shaped string (1..128 chars); fail closed');
      if (typeof e.digestSha256 !== 'string' || !SHA_RE.test(e.digestSha256))
        return refuse('each digestSha256 must be a lowercase hex64 sha256; fail closed');
      if (SECRET_CONTENT_RE.test(e.documentId))
        return refuse('a documentId is secret-shaped; secrets are never processed; fail closed');
      if (seen.has(e.documentId))
        return refuse(`the documentId ${e.documentId} appears more than once in currentDigests; fail closed`);
      seen.add(e.documentId);
      digests.push({ documentId: e.documentId, digestSha256: e.digestSha256 });
    }
    // THE MEMORY PACKET IS RE-VERIFIED through the REAL 12D-306 gate — never trusted.
    const vm = buildAssistantMemoryViewModel(p.memoryPacket);
    if (vm.kind === 'REFUSED')
      return refuse(`the memory packet failed verification (${vm.reason}); the card refuses; fail closed`);
    // The recorded evidence is RE-DERIVED from the verified objectives —
    // the SAME docRef record the REAL 12D-287 continuation gate binds to.
    const recorded = new Map<string, string>();
    const patternAbsent: string[] = [];
    const affected: string[] = [];
    for (const entry of vm.display.entries) {
      const match = entry.objective.match(DOC_REF_RE);
      const documentId = match !== null ? match[1]! : entry.storyId;
      if (match === null) {
        patternAbsent.push(entry.storyId);
        continue;
      }
      if (!recorded.has(documentId)) recorded.set(documentId, match[2]!);
    }
    const assessed: AssessedDocument[] = [];
    const staleDocumentIds: string[] = [];
    // Every CARRIED document gets an assessment row — unchecked is
    // never allowed to look like current (the OpenWiki discipline).
    for (const [documentId, recordedHead] of recorded) {
      const supplied = digests.find((d) => d.documentId === documentId);
      if (supplied === undefined) {
        assessed.push(Object.freeze({ documentId, recordedDigestHead: recordedHead, currentDigestHead: '', verdict: 'UNCHECKED' as const }));
        continue;
      }
      const currentHead = supplied.digestSha256.slice(0, 16);
      const verdict: DocumentStalenessVerdict = currentHead === recordedHead ? 'CURRENT' : 'STALE';
      assessed.push(Object.freeze({ documentId, recordedDigestHead: recordedHead, currentDigestHead: currentHead, verdict }));
      if (verdict === 'STALE') {
        staleDocumentIds.push(documentId);
        for (const entry of vm.display.entries) {
          const m = entry.objective.match(DOC_REF_RE);
          if (m !== null && m[1] === documentId) affected.push(entry.storyId);
        }
      }
    }
    // Supplied digests for documents the memory does not carry are rows
    // too — disclosed, never silently dropped.
    for (const d of digests) {
      if (recorded.has(d.documentId)) continue;
      assessed.push(Object.freeze({
        documentId: d.documentId,
        recordedDigestHead: '',
        currentDigestHead: d.digestSha256.slice(0, 16),
        verdict: 'UNCHECKED' as const,
      }));
    }
    for (const storyId of patternAbsent) {
      assessed.push(Object.freeze({
        documentId: storyId,
        recordedDigestHead: '',
        currentDigestHead: '',
        verdict: 'PATTERN_ABSENT' as const,
      }));
    }
    const verdict: SourceStalenessVerdict = staleDocumentIds.length > 0
      ? 'STALE_SOURCES_PRESENT'
      : assessed.every((a) => a.verdict === 'CURRENT')
        ? 'ALL_CURRENT'
        : 'UNCHECKED_SOURCES_PRESENT';
    return Object.freeze({
      status: 'PREPARED' as const,
      memoryPacket: p.memoryPacket,
      currentDigests: Object.freeze(digests.map((d) => Object.freeze({ ...d }))),
      tenantId: vm.display.tenantId,
      assessed: Object.freeze(assessed),
      staleDocumentIds: Object.freeze([...staleDocumentIds]),
      affectedStoryIds: Object.freeze([...affected]),
      verdict,
    });
  } catch (err) {
    return refuse(err instanceof Error ? err.message : String(err));
  }
}

/**
 * Emit the FROZEN card packet from a prepared card (the exact shape the
 * view model re-verifies). Pure derivation — nothing here fetches.
 */
export function buildSourceStalenessCardPacket(
  prepared: SourceStalenessCardPrepared,
): SourceStalenessCardPacket {
  if (prepared.status !== 'PREPARED')
    return refuse('the card packet is built only from a PREPARED card; fail closed');
  const staleCount = prepared.assessed.filter((a) => a.verdict === 'STALE').length;
  const uncheckedCount = prepared.assessed.filter((a) => a.verdict !== 'STALE' && a.verdict !== 'CURRENT').length;
  return Object.freeze({
    status: 'VERIFIED' as const,
    kind: 'SOURCE_STALENESS_CARD' as const,
    policyVersion: SOURCE_STALENESS_CARD_POLICY.policyVersion,
    memoryPacket: prepared.memoryPacket,
    currentDigests: prepared.currentDigests,
    tenantId: prepared.tenantId,
    assessed: prepared.assessed,
    staleCount,
    staleDocumentIds: prepared.staleDocumentIds,
    uncheckedCount,
    affectedStoryIds: prepared.affectedStoryIds,
    verdict: prepared.verdict,
    modelCalls: 0 as const,
    remoteCalls: 0 as const,
    activated: 0 as const,
    learningPromoted: false as const,
    stoppedBefore: 'verification only — nothing fetched, nothing mutated, the operator decides',
    humanDecision: 'REQUIRED' as const,
  });
}