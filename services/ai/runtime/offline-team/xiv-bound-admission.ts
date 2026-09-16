// 12D-278 — Bound Admission Bridge: the structural completion of the
// reading chain's provenance. 12D-276 registers public sources; 12D-277
// binds readings to them; 12D-274/12D-275 ingest and admit. THIS bridge
// JOINS the two halves: an operator can no longer admit a reading whose
// REGISTERED-SOURCE binding is absent or mismatched — the binding is
// re-derived from the register chain bytes and cross-gated against the
// PREPARED result's own digest, tenant, and document id (the REAL
// digests, never the operator's word about them).
//
//   * NO BINDING, NO ADMISSION: `admitBoundReading` refuses unless
//     bindReadingToSource issues a receipt for the SAME (tenantId,
//     documentId, documentDigestSha256) as the prepared result — an
//     unregistered reading physically cannot pass this door.
//   * THE PREPARED DIGEST IS THE TRUTH: the binding is checked against
//     prepareDocumentStories' own digest — an operator declaring a
//     different document's digest (or a different tenant) refuses.
//   * THE REAL QUEUE'S OWN CONTRACT still does the admission (12D-275
//     is called, never re-implemented); the measured census is the
//     queue's own summary.
//   * EVIDENCE IS CARRIED, NOT CONSUMED: the frozen result pairs the
//     binding receipt WITH the measured admission — provenance travels
//     with the admission record. Nothing is activated here; any
//     weight-mutation learning promotion stays CEO-gated.
//   * PURE COMPOSITION: no fs, no network, no clock, no randomness, no
//     model calls. OPERATOR/RUNTIME-SIDE ONLY — imports the SQLite-
//     backed queue and must NEVER be imported by the story shell (the
//     12D-273 lesson).
//
// Disclosed residuals:
//   * The bridge proves the reading's IDENTITY chain (registered source
//     → binding → prepared digest → admitted rows); it cannot prove the
//     ingested text was truly fetched from the registered URL — the
//     human-supervised reading step remains the trust point (the same
//     residual as 12D-277, disclosed there too).
//   * admitReadingStories (12D-275) itself is UNCHANGED and still
//     available to operators without a register — this bridge is the
//     REQUIRED-PROVENANCE path, offered alongside, not a silent
//     replacement. Adopting it as the ONLY door is a CEO decision.

import { OfflineStoryQueue } from './offline-story-queue';
import { admitReadingStories, type ReadingAdmissionResult } from './xiv-reading-admission';
import {
  READING_BINDING_POLICY,
  bindReadingToSource,
  type ReadingBinding,
} from './xiv-reading-binding';
import type { ReadingSourceStore } from './xiv-reading-source-register';

export const BOUND_ADMISSION_POLICY = Object.freeze({
  policyVersion: '12d-278-v1',
  domain: 'XIV_OS_BOUND_ADMISSION',
});

export const BOUND_ADMISSION_GUARDRAILS = Object.freeze({
  noBindingNoAdmission: true, // an unregistered reading physically cannot pass
  preparedDigestIsTheTruth: true, // cross-gated against prepareDocumentStories' own digest
  realQueueContractOnly: true, // 12D-275 admission is called, never re-implemented
  provenanceCarriedNotConsumed: true, // binding + admission travel together
  supervisedOperatorDoor: true,
  noClaimNoSettleNoReview: true,
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

const READING_KEYS = ['tenantId', 'sourceId', 'documentId', 'documentDigestSha256'] as const;

export type BoundAdmissionResult = Readonly<{
  kind: 'BOUND_READING_ADMITTED';
  policyVersion: string;
  binding: ReadingBinding;
  admission: ReadingAdmissionResult['admission'];
  census: ReadingAdmissionResult['census'];
  learningPromoted: false;
  activated: 0;
  humanDecision: 'REQUIRED';
}>;

/**
 * The REQUIRED-PROVENANCE door: admit a prepared reading ONLY through
 * its registered-source binding. The binding is re-derived from the
 * register chain and cross-gated against the prepared result's own
 * digest, tenant, and document id; the admission itself is the REAL
 * 12D-275 door. Throws on ANY anomaly — fail closed, nothing is
 * written unless every gate passes.
 */
export function admitBoundReading(
  queue: unknown,
  registerStore: unknown,
  registerGenesis: string,
  prepared: unknown,
  bindingInput: unknown,
): BoundAdmissionResult {
  // The PREPARED result is verified first — its digest is the truth the
  // binding must match.
  if (prepared === null || typeof prepared !== 'object' || Array.isArray(prepared))
    throw new Error('a prepared document-ingest result object is required; fail closed');
  const keys = Object.keys(prepared as Record<string, unknown>);
  if (keys.length !== READING_KEYS.length + 2 || !['policyVersion', 'documentId', 'tenantId', 'documentDigestSha256', 'chunkCount', 'stories'].every((k, i) => keys[i] === k))
    throw new Error('a prepared result must carry the 12d-274 shape; fail closed');
  const p = prepared as Readonly<Record<string, unknown>>;
  if (bindingInput === null || typeof bindingInput !== 'object' || Array.isArray(bindingInput))
    throw new Error('a reading binding object is required; NO BINDING, NO ADMISSION; fail closed');
  const bKeys = Object.keys(bindingInput as Record<string, unknown>);
  if (bKeys.length !== READING_KEYS.length || !READING_KEYS.every((k, i) => bKeys[i] === k))
    throw new Error(`a reading binding must have exactly the keys [${READING_KEYS.join(', ')}] in order; fail closed`);
  const b = bindingInput as Readonly<Record<string, unknown>>;
  // CROSS-GATE the operator's declared reading identity against the
  // PREPARED bytes — the digest is prepareDocumentStories' own, never
  // the operator's word.
  if (b.tenantId !== p.tenantId)
    throw new Error('the binding tenant does not match the prepared result; fail closed');
  if (b.documentId !== p.documentId)
    throw new Error('the binding document does not match the prepared result; fail closed');
  if (b.documentDigestSha256 !== p.documentDigestSha256)
    throw new Error('the binding digest does not match the prepared result digest; fail closed');
  // The binding is re-derived from the register chain (12D-277).
  if (!(queue instanceof OfflineStoryQueue))
    throw new Error('a trusted OfflineStoryQueue instance is required; the door never opens a database; fail closed');
  if (typeof registerStore !== 'object' || registerStore === null
    || typeof (registerStore as ReadingSourceStore).load !== 'function'
    || typeof (registerStore as ReadingSourceStore).save !== 'function')
    throw new Error('a trusted reading source register store is required; fail closed');
  const binding = bindReadingToSource(
    registerStore as Parameters<typeof bindReadingToSource>[0],
    registerGenesis as string,
    bindingInput,
  );
  if (binding.kind !== 'READING_BOUND_TO_SOURCE' || binding.policyVersion !== READING_BINDING_POLICY.policyVersion)
    throw new Error('the binding receipt is not 12d-277 material; fail closed');
  // THE REAL QUEUE'S OWN CONTRACT does the admission.
  const admission = admitReadingStories(queue, prepared);
  return Object.freeze({
    kind: 'BOUND_READING_ADMITTED' as const,
    policyVersion: BOUND_ADMISSION_POLICY.policyVersion,
    binding,
    admission: admission.admission,
    census: admission.census,
    learningPromoted: false as const,
    activated: 0 as const,
    humanDecision: 'REQUIRED' as const,
  });
}