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
//   * buildReadingDraftReceipt(submission) — PURE, now LIVING IN
//     xiv-reading-draft-receipt-core.ts (12D-286 split it out so the
//     story shell can import the receipt door without pulling the
//     SQLite-backed queue — the 12D-273 lesson) and re-exported here so
//     the 12D-285 imports keep working: re-derives the draft digest
//     from the submitted draft text (the digest is NEVER trusted),
//     re-applies the credential-shaped-content gate to the draft text,
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
import { OfflineStoryQueue } from './offline-story-queue';
import { OLLAMA_FIRST_READER_POLICY } from './xiv-ollama-first-reader';
import {
  READING_DRAFT_RECEIPT_POLICY,
  type ReadingDraftReceiptQueueVerified,
} from './xiv-reading-draft-receipt-core';

// DRIFT CHECK (runtime-side, where the SQLite-backed chain is already
// importable): the core pins the 12D-280 draft budget as a frozen
// mirror so the shell never pulls xiv-ollama-first-reader (the 12D-273
// lesson) — this module re-checks the mirror against the REAL policy,
// so a silent divergence fails fast instead of drifting.
if (READING_DRAFT_RECEIPT_POLICY.maxDraftChars !== OLLAMA_FIRST_READER_POLICY.maxDraftChars)
  throw new Error('the receipt policy draft budget has drifted from the 12D-280 first-reader policy; fail closed');

export {
  buildReadingDraftReceipt,
  READING_DRAFT_RECEIPT_POLICY,
} from './xiv-reading-draft-receipt-core';
export type {
  ReadingDraftReceipt,
  ReadingDraftReceiptQueueVerified,
} from './xiv-reading-draft-receipt-core';

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

const HEX64_RE = /^[0-9a-f]{64}$/;

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