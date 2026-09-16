// 12D-286 — Reading Draft Receipt View Model: the fail-closed rendering
// contract that turns a draft-receipt submission (tenantId, storyId,
// documentId, draftSha256, draftText, model) into the story shell's
// window onto 12D-285's reading draft receipt: the PROOF that the text a
// reviewer holds is the draft the queue settled, carried as the exact
// digest they must pass to the 12D-100 review door.
//
// The UI NEVER sees the draft text back: the operator pastes the draft
// in, the REAL pure 12D-285 receipt door re-derives its digest (the
// digest is NEVER trusted), re-applies the credential-shaped-content
// gate, and this module renders ONLY the frozen receipt metadata — the
// digest, the measured char count, the carried model label, and the
// review hint. A verified view NEVER echoes the draft text; a refused
// view NEVER carries any of it. Any anomaly refuses the WHOLE submission
// with ZERO draft content.
//
// Rules, structurally enforced:
//   * THE REAL DOOR, NOT A RE-IMPLEMENTATION: every verified view went
//     through buildReadingDraftReceipt (12D-285) — the exact-keys gate,
//     the hex64 digest gate, the 8000-char draft budget, the secret
//     re-gate, and the re-derive-and-compare digest cross-check all run
//     there; this module adds no policy of its own.
//   * THE QUEUE DOOR STAYS RUNTIME-SIDE (the 12D-285 lesson, restated):
//     verifyReadingDraftReceiptAgainstQueue needs a trusted
//     OfflineStoryQueue instance and is never shell-imported — this view
//     renders the receipt as READY-TO-CARRY; the queue cross-check
//     happens in the operator's runtime when the receipt is presented to
//     the 12D-100 review door. The shell decides nothing.
//   * NO WRITE PATH, NO CONTENT SURFACE: the view stores nothing, echoes
//     no draft text, and renders no approval control — a receipt proves
//     bytes, not quality (humanDecision REQUIRED).
//   * PURE: no fs, no network, no clock, no randomness. modelCalls: 0
//     (the receipt calls no model — the draft was read by the 12D-280
//     door), remoteCalls: 0.
//
// Disclosed residual (carried from 12D-285, pinned in the render): the
// receipt proves DIGEST-CONSISTENCY, not authorship beyond the carried
// model label, and the queue-side cross-check (story exists,
// AWAITING_REVIEW, settled outputHash equal) is NOT re-run here — the
// shell has no queue; the receipt is renderable before that door runs.
import {
  buildReadingDraftReceipt,
  READING_DRAFT_RECEIPT_POLICY,
  type ReadingDraftReceipt,
} from './xiv-reading-draft-receipt-core';

export const READING_DRAFT_RECEIPT_VIEW_MODEL_POLICY = Object.freeze({
  policyVersion: '12d-286-v1',
  domain: 'XIV_OS_READING_DRAFT_RECEIPT_VIEW_MODEL',
});

export const READING_DRAFT_RECEIPT_VIEW_MODEL_GUARDRAILS = Object.freeze({
  theRealDoorNotAReimplementation: true, // 12D-285 buildReadingDraftReceipt runs first
  draftTextNeverEchoed: true, // verified or refused, the text never renders
  noWritePath: true,
  queueDoorRuntimeSideOnly: true, // no queue cross-check happens in the shell
  receiptNeverApproval: true, // a receipt proves bytes, not quality
  refusedRendersAsRefused: true, // never an empty success
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

const SUBMISSION_KEYS = ['tenantId', 'storyId', 'documentId', 'draftSha256', 'draftText', 'model'] as const;

export type ReadingDraftReceiptViewModel =
  | Readonly<{
      kind: 'VERIFIED_READING_DRAFT_RECEIPT';
      policyVersion: string;
      display: Readonly<{
        headline: string;
        receipt: ReadingDraftReceipt;
        status: string;
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

const REFUSAL_HEADLINE = 'Reading draft receipt refused — HUMAN DECISION REQUIRED';

/**
 * The only door from a raw draft-receipt submission to the UI. Accepts
 * ANY unknown value; returns a frozen view model that is either a fully
 * receipt-verified view or an honest refusal. Never throws.
 */
export function buildReadingDraftReceiptViewModel(raw: unknown): ReadingDraftReceiptViewModel {
  try {
    if (raw === null || typeof raw !== 'object' || Array.isArray(raw))
      throw new Error('a draft receipt submission object is required; fail closed');
    const keys = Object.keys(raw as Record<string, unknown>);
    if (keys.length !== SUBMISSION_KEYS.length || !SUBMISSION_KEYS.every((k, i) => keys[i] === k))
      throw new Error(`a draft receipt submission must have exactly the keys [${SUBMISSION_KEYS.join(', ')}] in order; fail closed`);
    // THE REAL 12D-285 DOOR: the digest is re-derived from the submitted
    // draft text there (never trusted), the secret gate re-applies to the
    // text, and the 12D-280 draft budget holds. Every refusal below this
    // point is that door's refusal — this module invents no policy.
    const receipt = buildReadingDraftReceipt(raw);
    return Object.freeze({
      kind: 'VERIFIED_READING_DRAFT_RECEIPT' as const,
      policyVersion: READING_DRAFT_RECEIPT_VIEW_MODEL_POLICY.policyVersion,
      display: Object.freeze({
        headline: `Draft receipt verified: ${receipt.draftChars} chars, digest ${receipt.draftSha256.slice(0, 12)}… — carry draftSha256 as the 12D-100 review door's expectedOutputHash`,
        receipt,
        status: 'the draft digest was re-derived from the text you hold and matches the claimed digest — the receipt is ready to carry to the review door',
        operatorNote: `Verified against reading-draft-receipt policy ${READING_DRAFT_RECEIPT_POLICY.policyVersion}: buildReadingDraftReceipt re-derived the SHA-256 from the submitted draft text and re-applied the credential-shaped-content gate. THE DRAFT TEXT IS NOT ECHOED — only the digest and metadata render. THE QUEUE DOOR STAYS RUNTIME-SIDE: this shell holds no queue, so the queue cross-check (story exists, is AWAITING_REVIEW, settled outputHash === draftSha256) happens in the operator's runtime via verifyReadingDraftReceiptAgainstQueue when the receipt is presented. A receipt proves DIGEST-CONSISTENCY, not authorship beyond the carried model label, and proves nothing about quality — humanDecision: 'REQUIRED', the 12D-100 review door and the human decision stay downstream, untouched.`,
      }),
    });
  } catch (err) {
    return Object.freeze({
      kind: 'REFUSED' as const,
      policyVersion: READING_DRAFT_RECEIPT_VIEW_MODEL_POLICY.policyVersion,
      reason: err instanceof Error ? err.message : String(err),
      display: Object.freeze({
        headline: REFUSAL_HEADLINE,
        bodyText: 'The draft receipt submission failed verification and was NOT rendered. Nothing is shown from it — not the draft text, not the claimed digest, not the story or document ids. Diagnostics below are for the operator.',
        operatorNote: 'Refused. Deliver { tenantId, storyId, documentId, draftSha256, draftText, model } exactly, in that key order, with the claimed digest equal to the SHA-256 of the draft text you hold.',
      }),
    });
  }
}