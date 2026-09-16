// 12D-285 — READING DRAFT RECEIPT (the review link's missing half).
//
// The 12D-280 first reader settles a model DRAFT into the queue as
// AWAITING_REVIEW with the draft's SHA-256 as outputHash — but the
// draft TEXT exists only in the operator's hands at read time. A human
// reviewer facing the 12D-100 review door must supply
// `expectedOutputHash`; until now nothing made the draft text they
// actually read PROVABLY the draft the queue settled. This rung closes
// that gap WITHOUT adding a write path:
//
//   * buildReadingDraftReceipt(submission) — PURE: re-derives the
//     draft digest from the submitted draft text (the digest is NEVER
//     trusted), re-applies the credential-shaped-content gate to the
//     draft text (a laundered secret never becomes review material),
//     enforces the 12D-280 draft budget, and freezes a receipt packet
//     the reviewer can carry. The receipt's digest is exactly what the
//     reviewer passes as expectedOutputHash.
//   * verifyReadingDraftReceiptAgainstQueue(queue, receipt) —
//     RUNTIME-SIDE (never shell-imported; the 12D-273 lesson): the
//     queue is the truth — the story must exist, be AWAITING_REVIEW,
//     and its settled outputHash must EQUAL the receipt's re-derived
//     digest. A mismatch refuses: the reviewer is not looking at the
//     draft that was settled.
//
// The receipt is a RECEIPT, not a settlement: it proves nothing about
// the draft's quality, approves nothing, reviews nothing —
// humanDecision REQUIRED. modelCalls 0 (this module calls no model;
// the draft was read by the 12D-280 door), remoteCalls 0, no write
// path of its own (the queue-bound verifier reads only; the pure part
// touches no store at all).
//
// Disclosed residual (honest scope): the receipt proves
// digest-consistency — that the reviewed text hashes to the queue's
// settled bytes. It does not prove WHO produced the text beyond the
// carried model label (the 12D-280 injected-caller residual), and it
// does not store the draft anywhere: the operator holds the text; the
// queue holds the hash; this module binds them.
import { createHash } from 'node:crypto';
import { OfflineStoryQueue } from './offline-story-queue';
import { SECRET_CONTENT_RE } from './xiv-document-ingest';
import { OLLAMA_FIRST_READER_POLICY } from './xiv-ollama-first-reader';

export const READING_DRAFT_RECEIPT_POLICY = Object.freeze({
  policyVersion: '12d-285-v1',
  domain: 'XIV_OS_READING_DRAFT_RECEIPT',
  /** Mirrors the 12D-280 first-reader draft budget. */
  maxDraftChars: OLLAMA_FIRST_READER_POLICY.maxDraftChars,
  maxIdChars: 128,
});

export const READING_DRAFT_RECEIPT_GUARDRAILS = Object.freeze({
  digestReDerivedNeverTrusted: true,
  secretReGateOnTheDraftText: true,
  queueTruthCrossGate: true,
  receiptNeverApproval: true, // a receipt proves bytes, not quality
  noWritePath: true, // the queue-bound verify only ever reads
  runtimeSideOnlyQueueDoor: true, // the queue door is never shell-imported
  pureReceiptDoor: true, // the pure part touches no store at all
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

/**
 * The queue-truth door: the receipt's digest must equal the settled
 * story's outputHash. Runtime-side only — never shell-imported. Throws
 * on ANY anomaly; reads only, never writes.
 */
export function verifyReadingDraftReceiptAgainstQueue(
  queue: unknown,
  receipt: unknown,
): ReadingDraftReceiptQueueVerified {
  if (!(queue instanceof OfflineStoryQueue))
    throw new Error('a trusted OfflineStoryQueue instance is required; this door never opens its own database; fail closed');
  if (receipt === null || typeof receipt !== 'object' || Array.isArray(receipt))
    throw new Error('a READING_DRAFT_RECEIPT packet object is required; fail closed');
  const r = receipt as Readonly<Record<string, unknown>>;
  if (r.kind !== 'READING_DRAFT_RECEIPT' || r.policyVersion !== READING_DRAFT_RECEIPT_POLICY.policyVersion)
    throw new Error(`a READING_DRAFT_RECEIPT packet with policyVersion ${READING_DRAFT_RECEIPT_POLICY.policyVersion} is required; fail closed`);
  if (r.activated !== 0 || r.learningPromoted !== false || r.humanDecision !== 'REQUIRED')
    throw new Error('the receipt carries tampered honest flags; fail closed');
  if (typeof r.tenantId !== 'string' || typeof r.storyId !== 'string'
    || typeof r.draftSha256 !== 'string' || !HEX64_RE.test(r.draftSha256))
    throw new Error('the receipt carries malformed identity fields; fail closed');
  // THE QUEUE IS THE TRUTH — read only, never written.
  const story = queue.inspectStory(r.tenantId, r.storyId);
  if (story === null)
    throw new Error(`the story ${r.storyId} does not exist in this queue; fail closed`);
  if (story.state !== 'AWAITING_REVIEW')
    throw new Error(`the story ${r.storyId} is ${story.state}; only an AWAITING_REVIEW draft can be receipt-verified; fail closed`);
  if (story.outputHash === null || story.outputHash !== r.draftSha256)
    throw new Error('the queue\'s settled draft does not match this receipt; the reviewer is not holding the draft that was settled; fail closed');
  return Object.freeze({
    kind: 'READING_DRAFT_RECEIPT_QUEUE_VERIFIED' as const,
    policyVersion: READING_DRAFT_RECEIPT_POLICY.policyVersion,
    tenantId: r.tenantId,
    storyId: r.storyId,
    storyState: story.state,
    draftSha256: r.draftSha256,
    readyForReview: true as const,
    modelCalls: 0 as const,
    remoteCalls: 0 as const,
    activated: 0 as const,
    learningPromoted: false as const,
    humanDecision: 'REQUIRED' as const,
  });
}