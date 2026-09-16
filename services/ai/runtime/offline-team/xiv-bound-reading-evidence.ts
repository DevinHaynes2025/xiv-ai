// 12D-279 — Provenance-Bound Pathway Evidence: the expansion that lets
// the READING chain feed the brain's 12D-264 pathway ledger WITH its
// provenance intact. The existing pathway-evidence bridge converts a
// reviewed DONE queue outcome into a pathway candidate; THIS rung adds
// the reading-chain half: given a real 12D-278 BOUND_READING_ADMITTED
// result, a reviewed chunk story of THAT document becomes a pathway
// candidate whose evidenceRefs carry the reading's provenance —
//
//   reading-source:<sourceId>
//   reading-register-entry-sha256:<sourceEntryDigestSha256>
//   reading-document-sha256:<documentDigestSha256>
//
// — so a ledgered pathway candidate can trace back, ref by ref, to a
// REGISTERED PUBLIC source. Nothing is activated, nothing is approved,
// nothing is ledgered HERE: this module only PREPARES the candidate;
// the human approval (12D-269) and the ledger append (12D-264) remain
// the downstream, human-gated steps (proven end-to-end in the suite).
//
//   * THE REAL CONTRACT DOES THE WORK: the candidate is prepared by
//     the existing pathway-evidence bridge (called, never
//     re-implemented) — the queue's own DONE state and stored output
//     hash are the truth about the outcome, never the operator's word.
//   * THE BOUND RESULT IS VERIFIED BY SHAPE: the 12D-278 result and
//     its 12D-277 binding receipt are exact-keys checked (kind and
//     policyVersion pinned). The receipt's digests are NOT re-derived
//     here — re-derivation happened at bind/admit time behind the
//     12D-276/277/278 doors; this layer carries provenance, it does
//     not re-prove it (disclosed residual).
//   * THE STORY MUST BELONG TO THE BOUND DOCUMENT: storyId must be one
//     of the reading's own chunk stories (doc-<documentId>-chunk-N)
//     and the tenant must match the binding — a candidate about some
//     other story or tenant refuses.
//   * PROVENANCE IS CARRIED, NEVER SILENTLY DROPPED: the enriched ref
//     list is dedup'd and bounded — over the 32-ref budget the WHOLE
//     preparation refuses (fail closed).
//   * OPERATOR/RUNTIME-SIDE ONLY — imports the SQLite-backed queue and
//     must NEVER be imported by the story shell (the 12D-273 lesson).
//
// Disclosed residuals: the evidence-text trust point is unchanged
// (human-supervised reading remains where the text's origin is
// trusted). The request MUST carry a rollbackRef — the growth engine's
// own rollbackRequiredForActivation gate refuses an eligible candidate
// without one (fail closed, never silently defaulted).

import { OfflineStoryQueue } from './offline-story-queue';
import { preparePathwayCandidateFromQueue } from './pathway-evidence-bridge';
import {
  evaluatePathwayCandidate,
  type NeuralPathwayCandidate,
  type PathwayDomain,
} from './neural-pathway-growth-engine';

export const BOUND_READING_EVIDENCE_POLICY = Object.freeze({
  policyVersion: '12d-279-v1',
  domain: 'XIV_OS_BOUND_READING_EVIDENCE',
});

export const BOUND_READING_EVIDENCE_GUARDRAILS = Object.freeze({
  provenanceCarriedIntoEvidence: true, // a ledgered candidate traces to its registered source
  realQueueOutcomeOnly: true, // the queue's DONE state + stored output hash are the truth
  realBridgeContractOnly: true, // the existing pathway-evidence bridge is called, never re-implemented
  storyMustBelongToTheBoundDocument: true,
  provenanceNeverSilentlyDropped: true, // over the ref budget the WHOLE preparation refuses
  preparedNotApprovedNotLedgered: true, // approval (12D-269) + ledger (12D-264) stay downstream
  noActivationPath: true,
  learningPromotionStaysCEOgated: true,
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

const BOUND_KEYS = ['kind', 'policyVersion', 'binding', 'admission', 'census', 'learningPromoted', 'activated', 'humanDecision'] as const;
const BINDING_KEYS = ['kind', 'policyVersion', 'tenantId', 'sourceId', 'sourceUrl', 'sourceClass', 'sourceEntryDigestSha256', 'documentId', 'documentDigestSha256', 'learningPromoted', 'activated', 'humanDecision'] as const;
const REQUEST_KEYS = ['tenantId', 'storyId', 'pathwayId', 'domain', 'version', 'confidence', 'evaluationScore', 'evidenceRefs', 'reviewRefs', 'expectedOutputHash', 'rollbackRef'] as const;

const DOMAINS: readonly PathwayDomain[] = ['GENERAL', 'CODE', 'ARCHITECTURE', 'SECURITY', 'MEMORY', 'OPERATIONS'];
const ID_RE = /^[A-Za-z0-9][A-Za-z0-9_.:-]{0,127}$/;
const SHA_RE = /^[a-f0-9]{64}$/;
const MAX_REFS = 32;

export type BoundReadingEvidencePacket = Readonly<{
  kind: 'BOUND_READING_EVIDENCE_PACKET';
  policyVersion: string;
  binding: Readonly<Record<string, unknown>>;
  tenantId: string;
  storyId: string;
  outputHash: string;
  candidate: Readonly<NeuralPathwayCandidate>;
  currentEligibility: Readonly<{ eligible: boolean; reasons: readonly string[] }>;
  admissionCounts: Readonly<{ prepared: number; inserted: number; duplicates: number }>;
  activationAttempted: false;
  learningPromoted: false;
  modelWeightMutation: false;
  productionMutation: false;
  humanDecision: 'REQUIRED';
}>;

/**
 * Prepare a pathway candidate from a REVIEWED DONE chunk story of a
 * BOUND reading. The candidate is prepared by the REAL pathway-evidence
 * bridge (queue DONE + output-hash cross-gates included), then enriched
 * with the reading's provenance refs from the binding receipt. Throws
 * on ANY anomaly — fail closed, nothing is prepared unless every gate
 * passes.
 */
export function prepareBoundReadingPathwayEvidence(
  queue: unknown,
  bound: unknown,
  request: unknown,
): BoundReadingEvidencePacket {
  if (!(queue instanceof OfflineStoryQueue))
    throw new Error('a trusted OfflineStoryQueue instance is required; the door never opens a database; fail closed');
  // The 12D-278 result is verified by exact shape first.
  if (bound === null || typeof bound !== 'object' || Array.isArray(bound))
    throw new Error('a BOUND_READING_ADMITTED result object is required; fail closed');
  const bKeys = Object.keys(bound as Record<string, unknown>);
  if (bKeys.length !== BOUND_KEYS.length || !BOUND_KEYS.every((k, i) => bKeys[i] === k))
    throw new Error(`a bound admission result must have exactly the keys [${BOUND_KEYS.join(', ')}] in order; fail closed`);
  const b = bound as Readonly<Record<string, unknown>>;
  if (b.kind !== 'BOUND_READING_ADMITTED')
    throw new Error('the result is not a BOUND_READING_ADMITTED packet; fail closed');
  if (b.policyVersion !== '12d-278-v1')
    throw new Error('the bound admission result is not 12d-278 material; fail closed');
  const binding = b.binding;
  if (binding === null || typeof binding !== 'object' || Array.isArray(binding))
    throw new Error('the bound result must carry a binding receipt; fail closed');
  const rKeys = Object.keys(binding as Record<string, unknown>);
  if (rKeys.length !== BINDING_KEYS.length || !BINDING_KEYS.every((k, i) => rKeys[i] === k))
    throw new Error(`a binding receipt must have exactly the keys [${BINDING_KEYS.join(', ')}] in order; fail closed`);
  const r = binding as Readonly<Record<string, unknown>>;
  if (r.kind !== 'READING_BOUND_TO_SOURCE' || r.policyVersion !== '12d-277-v1')
    throw new Error('the binding receipt is not 12d-277 material; fail closed');
  if (r.learningPromoted !== false || r.activated !== 0 || r.humanDecision !== 'REQUIRED')
    throw new Error('the binding receipt carries tampered honest flags; fail closed');
  const sourceId = r.sourceId as string;
  const sourceEntryDigest = r.sourceEntryDigestSha256 as string;
  const documentId = r.documentId as string;
  const documentDigest = r.documentDigestSha256 as string;
  if (typeof sourceId !== 'string' || !ID_RE.test(sourceId)
    || typeof documentId !== 'string' || !ID_RE.test(documentId)
    || typeof sourceEntryDigest !== 'string' || !SHA_RE.test(sourceEntryDigest)
    || typeof documentDigest !== 'string' || !SHA_RE.test(documentDigest))
    throw new Error('the binding receipt carries malformed provenance; fail closed');
  // The operator's request is exact-keys gated in order.
  if (request === null || typeof request !== 'object' || Array.isArray(request))
    throw new Error('a pathway evidence request object is required; fail closed');
  const qKeys = Object.keys(request as Record<string, unknown>);
  if (qKeys.length !== REQUEST_KEYS.length || !REQUEST_KEYS.every((k, i) => qKeys[i] === k))
    throw new Error(`a bound reading evidence request must have exactly the keys [${REQUEST_KEYS.join(', ')}] in order; fail closed`);
  const q = request as Readonly<Record<string, unknown>>;
  const tenantId = q.tenantId;
  const storyId = q.storyId;
  if (typeof tenantId !== 'string' || !ID_RE.test(tenantId)
    || typeof storyId !== 'string' || !ID_RE.test(storyId))
    throw new Error('scoped tenant and story ids are required; fail closed');
  // CROSS-GATE: the candidate's tenant and story must belong to the
  // BOUND document — no other story can ride this provenance.
  if (tenantId !== r.tenantId)
    throw new Error('the request tenant does not match the binding tenant; fail closed');
  const chunkPrefix = `doc-${documentId}-chunk-`;
  if (!storyId.startsWith(chunkPrefix))
    throw new Error('the story is not one of the bound document’s chunk stories; fail closed');
  const chunkTail = storyId.slice(chunkPrefix.length);
  if (!/^[1-9][0-9]{0,5}$/.test(chunkTail))
    throw new Error('the story chunk index is malformed; fail closed');
  if (typeof q.pathwayId !== 'string' || !ID_RE.test(q.pathwayId))
    throw new Error('a scoped pathway id is required; fail closed');
  if (typeof q.domain !== 'string' || !DOMAINS.includes(q.domain as PathwayDomain))
    throw new Error(`the domain must be one of [${DOMAINS.join(', ')}]; fail closed`);
  if (!Number.isSafeInteger(q.version) || (q.version as number) < 1)
    throw new Error('version must be a safe integer >= 1; fail closed');
  if (typeof q.confidence !== 'number' || !Number.isFinite(q.confidence) || q.confidence < 0 || q.confidence > 1
    || typeof q.evaluationScore !== 'number' || !Number.isFinite(q.evaluationScore) || q.evaluationScore < 0 || q.evaluationScore > 1)
    throw new Error('finite confidence/evaluation scores in [0,1] are required; fail closed');
  const expectedOutputHash = q.expectedOutputHash;
  if (typeof expectedOutputHash !== 'string' || !SHA_RE.test(expectedOutputHash))
    throw new Error('a hex64 expectedOutputHash is required (the queue’s stored hash is the truth); fail closed');
  const rollbackRef = q.rollbackRef;
  if (typeof rollbackRef !== 'string' || rollbackRef.trim().length === 0 || rollbackRef.length > 256)
    throw new Error('a bounded rollbackRef is required (the growth engine refuses an eligible candidate without one); fail closed');
  for (const [name, v] of [['evidenceRefs', q.evidenceRefs], ['reviewRefs', q.reviewRefs]] as const) {
    if (!Array.isArray(v) || v.length === 0 || v.length > MAX_REFS
      || !v.every((e) => typeof e === 'string' && e.trim().length > 0 && e.length <= 256))
      throw new Error(`bounded ${name} are required; fail closed`);
  }
  if (new Set((q.reviewRefs as readonly string[]).map((x) => x.trim())).size !== (q.reviewRefs as readonly string[]).length)
    throw new Error('duplicate review refs forbidden; fail closed');
  // THE REAL BRIDGE does the work — DONE-state and output-hash truth
  // are the queue's own, never re-implemented here.
  const inner = preparePathwayCandidateFromQueue(queue, {
    tenantId, storyId,
    expectedOutputHash,
    pathwayId: q.pathwayId as string,
    domain: q.domain as PathwayDomain,
    version: q.version as number,
    confidence: q.confidence as number,
    evaluationScore: q.evaluationScore as number,
    evidenceRefs: [...(q.evidenceRefs as readonly string[])],
    reviewRefs: [...(q.reviewRefs as readonly string[])],
    rollbackRef,
  });
  // Enrich the candidate's evidence with the reading's provenance —
  // dedup'd, bounded; over budget the WHOLE preparation refuses.
  const provenanceRefs = [
    `reading-source:${sourceId}`,
    `reading-register-entry-sha256:${sourceEntryDigest}`,
    `reading-document-sha256:${documentDigest}`,
  ];
  const enrichedRefs = Object.freeze([...new Set([...inner.candidate.evidenceRefs, ...provenanceRefs])]);
  if (enrichedRefs.length > MAX_REFS)
    throw new Error(`the provenance-enriched evidence exceeds the ${MAX_REFS}-ref budget; fail closed`);
  const c = inner.candidate;
  const candidate: Readonly<NeuralPathwayCandidate> = Object.freeze({
    ...c,
    evidenceRefs: enrichedRefs,
  });
  const currentEligibility = evaluatePathwayCandidate(candidate);
  return Object.freeze({
    kind: 'BOUND_READING_EVIDENCE_PACKET' as const,
    policyVersion: BOUND_READING_EVIDENCE_POLICY.policyVersion,
    binding: Object.freeze({ ...r }) as Readonly<Record<string, unknown>>,
    tenantId,
    storyId,
    outputHash: inner.outputHash,
    candidate,
    currentEligibility,
    admissionCounts: Object.freeze({ ...(b.admission as Readonly<{ prepared: number; inserted: number; duplicates: number }>) }),
    activationAttempted: false as const,
    learningPromoted: false as const,
    modelWeightMutation: false as const,
    productionMutation: false as const,
    humanDecision: 'REQUIRED' as const,
  });
}