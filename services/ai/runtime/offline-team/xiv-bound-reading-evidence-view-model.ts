// 12D-304 — Bound-Reading Pathway Evidence View Model: the fail-closed
// rendering contract that turns a REAL 12D-279 evidence packet into the
// story shell's window onto the READING→REVIEW→PATHWAY loop.
//
// The packet is produced RUNTIME-SIDE by prepareBoundReadingPathwayEvidence
// (it needs a trusted queue — the 12D-286 lesson: queue doors are never
// shell-imported). The operator carries the packet to the shell; this
// module renders it ONLY after full re-verification:
//   * exact-key gate on the packet (14 keys, in order)
//   * policy pin: 12d-279 material, kind BOUND_READING_EVIDENCE_PACKET
//   * honest flags enforced: activationAttempted false, learningPromoted
//     false, modelWeightMutation false, productionMutation false,
//     humanDecision REQUIRED
//   * the binding receipt re-gated (12d-277 shape, honest flags, hex64
//     provenance digests)
//   * ELIGIBILITY RE-DERIVED — evaluatePathwayCandidate (the REAL
//     growth-engine evaluator) re-runs over the candidate and must MATCH
//     the packet's currentEligibility exactly; a tampered eligibility
//     refuses the render
//   * humanApproved must be false — the packet is a PREPARED candidate,
//     never an approval
// The eligible/false reasons render verbatim (the honest "not yet" list:
// evaluation/confidence thresholds, distinct reviews, human approval —
// all CEO-gated). Ledgered NEVER activated. PURE module: no fs, no
// network, no clock, no randomness. modelCalls 0, remoteCalls 0.
import {
  evaluatePathwayCandidate,
  type NeuralPathwayCandidate,
} from './neural-pathway-growth-engine';
import { SECRET_CONTENT_RE } from './xiv-document-ingest';

export const BOUND_READING_EVIDENCE_VIEW_MODEL_POLICY = Object.freeze({
  policyVersion: '12d-304-v1',
  domain: 'XIV_OS_BOUND_READING_EVIDENCE_VIEW_MODEL',
});

export const BOUND_READING_EVIDENCE_VIEW_MODEL_GUARDRAILS = Object.freeze({
  theRealDoorNotAReimplementation: true, // the packet must be 12d-279 material
  eligibilityReDerivedNeverTrusted: true, // the growth-engine evaluator re-runs
  humanApprovedMustBeFalse: true, // a packet is a candidate, never an approval
  bindingReGated: true, // the 12d-277 receipt is re-checked
  ledgeredNeverActivated: true,
  refusedRendersAsRefused: true,
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

const PACKET_KEYS = [
  'kind', 'policyVersion', 'binding', 'tenantId', 'storyId', 'outputHash',
  'candidate', 'currentEligibility', 'admissionCounts', 'activationAttempted',
  'learningPromoted', 'modelWeightMutation', 'productionMutation', 'humanDecision',
] as const;
const BINDING_KEYS = ['kind', 'policyVersion', 'tenantId', 'sourceId', 'sourceUrl', 'sourceClass', 'sourceEntryDigestSha256', 'documentId', 'documentDigestSha256', 'learningPromoted', 'activated', 'humanDecision'] as const;
const ADMISSION_KEYS = ['prepared', 'inserted', 'duplicates'] as const;

const SHA_RE = /^[0-9a-f]{64}$/;
const ID_RE = /^[a-z0-9][a-z0-9-]{0,63}$/;
const DOMAINS = ['GENERAL', 'CODE', 'ARCHITECTURE', 'SECURITY', 'MEMORY', 'OPERATIONS'] as const;

export type BoundReadingEvidenceViewModel =
  | Readonly<{
      kind: 'VERIFIED_BOUND_READING_EVIDENCE';
      policyVersion: string;
      display: Readonly<{
        headline: string;
        sourceId: string;
        documentId: string;
        storyId: string;
        eligible: boolean;
        eligibilityReasons: readonly string[];
        evidenceRefs: readonly string[];
        admissionCounts: Readonly<{ prepared: number; inserted: number; duplicates: number }>;
        operatorNote: string;
      }>;
    }>
  | Readonly<{
      kind: 'REFUSED';
      policyVersion: string;
      reason: string;
      display: Readonly<{
        headline: string;
        bodyText: string;
        operatorNote: string;
      }>;
    }>;

const REFUSAL_HEADLINE = 'Bound-reading pathway evidence refused — HUMAN DECISION REQUIRED';

function requireExactKeys(raw: Record<string, unknown>, keys: readonly string[], what: string): void {
  const ks = Object.keys(raw);
  if (ks.length !== keys.length || !keys.every((k, i) => ks[i] === k))
    throw new Error(`${what} must have exactly the keys [${keys.join(', ')}] in order; fail closed`);
}

/**
 * The only door from a raw 12D-279 evidence packet to the UI. Accepts
 * ANY unknown value; returns a frozen view model that is either a fully
 * re-verified view or an honest refusal. Never throws.
 */
export function buildBoundReadingEvidenceViewModel(raw: unknown): BoundReadingEvidenceViewModel {
  try {
    if (raw === null || typeof raw !== 'object' || Array.isArray(raw))
      throw new Error('a bound reading evidence packet object is required; fail closed');
    const p = raw as Readonly<Record<string, unknown>>;
    requireExactKeys(p as Record<string, unknown>, PACKET_KEYS, 'an evidence packet');
    if (p.kind !== 'BOUND_READING_EVIDENCE_PACKET')
      throw new Error('the packet is not BOUND_READING_EVIDENCE_PACKET material; fail closed');
    if (p.policyVersion !== '12d-279-v1')
      throw new Error('the packet is not 12d-279 material; fail closed');
    if (p.activationAttempted !== false || p.learningPromoted !== false || p.modelWeightMutation !== false || p.productionMutation !== false)
      throw new Error('the packet flags must be the pinned honest values (nothing activated, nothing learned, nothing mutated); fail closed');
    if (p.humanDecision !== 'REQUIRED')
      throw new Error('humanDecision must be REQUIRED on pathway evidence; fail closed');
    // BINDING RE-GATE (12d-277 shape).
    const binding = p.binding;
    if (binding === null || typeof binding !== 'object' || Array.isArray(binding))
      throw new Error('the packet must carry a binding receipt; fail closed');
    const b = binding as Readonly<Record<string, unknown>>;
    requireExactKeys(b as Record<string, unknown>, BINDING_KEYS, 'a binding receipt');
    if (b.kind !== 'READING_BOUND_TO_SOURCE' || b.policyVersion !== '12d-277-v1')
      throw new Error('the binding receipt is not 12d-277 material; fail closed');
    if (b.learningPromoted !== false || b.activated !== 0 || b.humanDecision !== 'REQUIRED')
      throw new Error('the binding receipt carries tampered honest flags; fail closed');
    for (const [k, re] of [['sourceId', ID_RE], ['documentId', ID_RE]] as const) {
      if (typeof b[k] !== 'string' || !ID_RE.test(b[k] as string))
        throw new Error(`the binding receipt carries a malformed ${k}; fail closed`);
    }
    if (typeof b.sourceUrl !== 'string' || b.sourceUrl.trim().length === 0 || b.sourceUrl.length > 512)
      throw new Error('the binding receipt carries a malformed sourceUrl; fail closed');
    if (typeof b.sourceClass !== 'string' || b.sourceClass.trim().length === 0 || b.sourceClass.length > 64)
      throw new Error('the binding receipt carries a malformed sourceClass; fail closed');
    for (const k of ['documentDigestSha256', 'sourceEntryDigestSha256'] as const) {
      if (typeof b[k] !== 'string' || !SHA_RE.test(b[k] as string))
        throw new Error(`the binding receipt carries a malformed ${k}; fail closed`);
    }
    if (typeof p.tenantId !== 'string' || !ID_RE.test(p.tenantId))
      throw new Error('the packet carries a malformed tenantId; fail closed');
    if (typeof p.storyId !== 'string' || !/^doc-[a-z0-9][a-z0-9-]*-chunk-[1-9][0-9]{0,5}$/.test(p.storyId))
      throw new Error('the packet carries a malformed storyId; fail closed');
    if (typeof p.outputHash !== 'string' || !SHA_RE.test(p.outputHash))
      throw new Error('outputHash must be hex64; fail closed');
    // CANDIDATE RE-GATE + ELIGIBILITY RE-DERIVATION (the real evaluator).
    const candidate = p.candidate;
    if (candidate === null || typeof candidate !== 'object' || Array.isArray(candidate))
      throw new Error('the packet must carry a pathway candidate; fail closed');
    const c = candidate as Readonly<Record<string, unknown>>;
    if (typeof c.pathwayId !== 'string' || c.pathwayId.trim().length === 0 || c.pathwayId.length > 256)
      throw new Error('the candidate carries a malformed pathwayId; fail closed');
    if (typeof c.tenantId !== 'string' || c.tenantId !== p.tenantId)
      throw new Error('the candidate tenant does not match the packet tenant; fail closed');
    if (typeof c.domain !== 'string' || !DOMAINS.includes(c.domain as (typeof DOMAINS)[number]))
      throw new Error('the candidate carries an unknown domain; fail closed');
    if (typeof c.confidence !== 'number' || !Number.isFinite(c.confidence) || c.confidence < 0 || c.confidence > 1
      || typeof c.evaluationScore !== 'number' || !Number.isFinite(c.evaluationScore) || c.evaluationScore < 0 || c.evaluationScore > 1)
      throw new Error('the candidate carries out-of-range confidence/evaluation scores; fail closed');
    if (c.humanApproved !== false)
      throw new Error('a PREPARED candidate must carry humanApproved false; the approval is a separate CEO-gated door; fail closed');
    if (c.modelWeightMutation !== false || c.productionMutation !== false)
      throw new Error('the candidate must carry the pinned no-mutation flags; fail closed');
    for (const [name, v] of [['evidenceRefs', c.evidenceRefs], ['reviewRefs', c.reviewRefs]] as const) {
      if (!Array.isArray(v) || v.length === 0 || v.length > 64
        || !v.every((e) => typeof e === 'string' && e.trim().length > 0 && e.length <= 256))
        throw new Error(`the candidate carries malformed ${name}; fail closed`);
    }
    const reDerived = evaluatePathwayCandidate(c as unknown as NeuralPathwayCandidate);
    const currentEligibility = p.currentEligibility;
    if (currentEligibility === null || typeof currentEligibility !== 'object' || Array.isArray(currentEligibility))
      throw new Error('the packet must carry currentEligibility; fail closed');
    const e = currentEligibility as Readonly<Record<string, unknown>>;
    if (typeof e.eligible !== 'boolean' || !Array.isArray(e.reasons)
      || !e.reasons.every((r) => typeof r === 'string' && r.trim().length > 0 && r.length <= 256))
      throw new Error('currentEligibility must be {eligible: boolean, reasons: bounded strings}; fail closed');
    const packetReasons = e.reasons as readonly string[];
    if (reDerived.eligible !== e.eligible || reDerived.reasons.length !== packetReasons.length
      || !reDerived.reasons.every((r, i) => r === packetReasons[i]))
      throw new Error('the packet currentEligibility does not match the re-derived evaluation; fail closed');
    const ac = p.admissionCounts;
    if (ac === null || typeof ac !== 'object' || Array.isArray(ac))
      throw new Error('the packet must carry admissionCounts; fail closed');
    const ak = Object.keys(ac as Record<string, unknown>);
    if (ak.length !== ADMISSION_KEYS.length || !ADMISSION_KEYS.every((k, i) => ak[i] === k))
      throw new Error('admissionCounts must have exactly the keys [prepared, inserted, duplicates] in order; fail closed');
    for (const k of ADMISSION_KEYS) {
      const v = (ac as Readonly<Record<string, unknown>>)[k];
      if (typeof v !== 'number' || !Number.isSafeInteger(v) || v < 0)
        throw new Error(`admissionCounts.${k} must be a safe non-negative integer; fail closed`);
    }
    for (const r of (c.evidenceRefs as readonly string[])) {
      if (SECRET_CONTENT_RE.test(r))
        throw new Error('an evidence ref is secret-shaped; it never renders; fail closed');
    }
    return Object.freeze({
      kind: 'VERIFIED_BOUND_READING_EVIDENCE' as const,
      policyVersion: BOUND_READING_EVIDENCE_VIEW_MODEL_POLICY.policyVersion,
      display: Object.freeze({
        headline: `Pathway evidence verified for ${String(p.storyId)} — eligibility ${e.eligible ? 'TRUE' : 'FALSE (honest)'} with ${packetReasons.length} unmet gate(s) — ledgered NEVER activated`,
        sourceId: String(b.sourceId),
        documentId: String(b.documentId),
        storyId: String(p.storyId),
        eligible: e.eligible,
        eligibilityReasons: Object.freeze([...packetReasons]),
        evidenceRefs: Object.freeze([...(c.evidenceRefs as readonly string[])]),
        admissionCounts: Object.freeze({ ...(ac as Readonly<{ prepared: number; inserted: number; duplicates: number }>) }),
        operatorNote: `Re-verified against pathway-evidence policy 12d-279-v1: the binding receipt was re-gated (12d-277 material, hex64 provenance digests), the eligibility was RE-DERIVED with the REAL growth-engine evaluator and matches the packet, and humanApproved is false — this is a PREPARED candidate, never an approval. The unmet gates (evaluation/confidence thresholds, distinct reviews, human approval) are the CEO-gated growth-engine gates. Ledgered NEVER activated (activationAttempted false); no weights moved (learningPromoted false); remoteCalls 0; humanDecision REQUIRED.`,
      }),
    });
  } catch (err) {
    return Object.freeze({
      kind: 'REFUSED' as const,
      policyVersion: BOUND_READING_EVIDENCE_VIEW_MODEL_POLICY.policyVersion,
      reason: err instanceof Error ? err.message : String(err),
      display: Object.freeze({
        headline: REFUSAL_HEADLINE,
        bodyText: 'The pathway evidence packet failed verification and was NOT rendered. Nothing is shown from it — not ids, not digests, not eligibility claims. Diagnostics below are for the operator.',
        operatorNote: 'Refused. The input must be a packet the REAL 12D-279 door produced (prepareBoundReadingPathwayEvidence) — all 14 keys in order, 12d-279 material, honest flags, and a currentEligibility the real evaluator reproduces.',
      }),
    });
  }
}