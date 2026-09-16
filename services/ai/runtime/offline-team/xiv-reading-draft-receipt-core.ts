// 12D-286 — the PURE half of the 12D-285 reading draft receipt, split
// into its own module so the story shell can import the receipt door
// WITHOUT pulling the SQLite-backed queue (the 12D-273 lesson: the
// story shell must never pull offline-story-queue). Everything here is
// byte-for-byte the same contract 12D-285 committed; the queue door
// (verifyReadingDraftReceiptAgainstQueue) stays in
// xiv-reading-draft-receipt.ts, which re-exports this module's pure
// door so the 12D-285 imports keep working.
//
// The 12D-280 first reader settles a model DRAFT into the queue as
// AWAITING_REVIEW with the draft's SHA-256 as outputHash — but the
// draft TEXT exists only in the operator's hands at read time.
// buildReadingDraftReceipt re-derives the draft digest from the
// submitted draft text (the digest is NEVER trusted), re-applies the
// credential-shaped-content gate to the draft text (a laundered secret
// never becomes review material), enforces the 12D-280 draft budget,
// and freezes a receipt packet the reviewer can carry. The receipt's
// digest is exactly what the reviewer passes as expectedOutputHash.
//
// PURE: no fs, no network, no queue, no clock, no randomness.
// modelCalls: 0 (this module calls no model — the draft was read by
// the 12D-280 door), remoteCalls: 0, no write path of any kind.
import { createHash } from 'node:crypto';
import { SECRET_CONTENT_RE } from './xiv-document-ingest';

export const READING_DRAFT_RECEIPT_POLICY = Object.freeze({
  policyVersion: '12d-285-v1',
  domain: 'XIV_OS_READING_DRAFT_RECEIPT',
  /** Mirrors the 12D-280 first-reader draft budget (OLLAMA_FIRST_READER_POLICY.maxDraftChars). */
  maxDraftChars: 8000,
  maxIdChars: 128,
});

const SUBMISSION_KEYS = ['tenantId', 'storyId', 'documentId', 'draftSha256', 'draftText', 'model'] as const;
const HEX64_RE = /^[0-9a-f]{64}$/;

export type ReadingDraftReceipt = Readonly<{
  kind: 'READING_DRAFT_RECEIPT';
  policyVersion: string;
  tenantId: string;
  storyId: string;
  documentId: string;
  model: string;
  draftChars: number;
  draftSha256: string;
  reviewHint: string;
  modelCalls: 0;
  remoteCalls: 0;
  activated: 0;
  learningPromoted: false;
  humanDecision: 'REQUIRED';
}>;

export type ReadingDraftReceiptQueueVerified = Readonly<{
  kind: 'READING_DRAFT_RECEIPT_QUEUE_VERIFIED';
  policyVersion: string;
  tenantId: string;
  storyId: string;
  storyState: string;
  draftSha256: string;
  readyForReview: true;
  modelCalls: 0;
  remoteCalls: 0;
  activated: 0;
  learningPromoted: false;
  humanDecision: 'REQUIRED';
}>;

/**
 * The receipt's pure door: re-derive the draft digest from the text
 * the reviewer actually holds, re-gate it, and freeze the receipt.
 * Throws on ANY anomaly — fail closed, never truncates.
 */
export function buildReadingDraftReceipt(submission: unknown): ReadingDraftReceipt {
  if (submission === null || typeof submission !== 'object' || Array.isArray(submission))
    throw new Error('a draft receipt submission object is required; fail closed');
  const keys = Object.keys(submission as Record<string, unknown>);
  if (keys.length !== SUBMISSION_KEYS.length || !SUBMISSION_KEYS.every((k, i) => keys[i] === k))
    throw new Error(`a draft receipt submission must have exactly the keys [${SUBMISSION_KEYS.join(', ')}] in order; fail closed`);
  const s = submission as Readonly<Record<string, unknown>>;
  for (const k of ['tenantId', 'storyId', 'documentId', 'draftSha256', 'draftText', 'model'] as const) {
    if (typeof s[k] !== 'string' || (s[k] as string).length === 0)
      throw new Error(`the submission field ${k} must be a non-empty string; fail closed`);
  }
  const tenantId = s.tenantId as string;
  const storyId = s.storyId as string;
  const documentId = s.documentId as string;
  const model = s.model as string;
  const draftText = s.draftText as string;
  const claimedSha256 = s.draftSha256 as string;
  if (tenantId.length > READING_DRAFT_RECEIPT_POLICY.maxIdChars
    || storyId.length > READING_DRAFT_RECEIPT_POLICY.maxIdChars
    || documentId.length > READING_DRAFT_RECEIPT_POLICY.maxIdChars
    || model.length > READING_DRAFT_RECEIPT_POLICY.maxIdChars)
    throw new Error('an identity field exceeds the receipt policy bound; fail closed');
  if (!HEX64_RE.test(claimedSha256))
    throw new Error('the claimed draft digest must be 64 lowercase hex chars; fail closed');
  if (draftText.length > READING_DRAFT_RECEIPT_POLICY.maxDraftChars)
    throw new Error(`the draft text exceeds ${READING_DRAFT_RECEIPT_POLICY.maxDraftChars} chars; fail closed`);
  // The 12D-274 lesson, on the reviewer's side of the chain: a draft
  // carrying credential-shaped content never becomes review material.
  if (SECRET_CONTENT_RE.test(draftText))
    throw new Error('the draft text carries credential-shaped content; it never becomes review material; fail closed');
  // THE DIGEST IS RE-DERIVED, NEVER TRUSTED: the receipt's digest is
  // the hash of the text the reviewer actually holds.
  const draftSha256 = createHash('sha256').update(draftText, 'utf8').digest('hex');
  if (draftSha256 !== claimedSha256)
    throw new Error('the claimed draft digest does not match the re-derived digest of the submitted draft text; the reviewer is not holding the draft they claim; fail closed');
  return Object.freeze({
    kind: 'READING_DRAFT_RECEIPT' as const,
    policyVersion: READING_DRAFT_RECEIPT_POLICY.policyVersion,
    tenantId,
    storyId,
    documentId,
    model,
    draftChars: draftText.length,
    draftSha256,
    reviewHint: 'pass draftSha256 as expectedOutputHash to the 12D-100 review door; the queue cross-checks it',
    modelCalls: 0 as const,
    remoteCalls: 0 as const,
    activated: 0 as const,
    learningPromoted: false as const,
    humanDecision: 'REQUIRED' as const,
  });
}