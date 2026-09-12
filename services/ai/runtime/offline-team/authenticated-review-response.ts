import { createPublicKey, verify, type KeyObject } from 'node:crypto';
import { OfflineStoryQueue } from './offline-story-queue';

/**
 * 12D-101 — Authenticated reviewer-response ingestion.
 * Closes the AWAITING_REVIEW port: a reviewer's decision is ingested ONLY as an Ed25519-signed
 * envelope from an operator-enrolled reviewer, bound to the exact settled output hash, applied
 * atomically by the queue. A valid signature authenticates an enrolled reviewer — it is NOT an
 * independent model attestation and never promotes learning. Verify-only: no private key is
 * handled here, enrollment is never accepted from review messages, and no network API exists.
 */
export const REVIEW_RESPONSE_LIMITS = Object.freeze({
  maxEnrollments: 256, maxReceiptBytes: 8192, maxTtlMs: 300_000,
  maxReviewRefChars: 256, maxNoteChars: 2000,
});
export type ReviewDecision = 'APPROVED' | 'CHANGES_REQUESTED' | 'REJECTED';
export interface ReviewerEnrollment {
  reviewerId: string;
  tenantId: string;
  /** Enterprise roles whose stories this reviewer is designated to review. */
  mayReviewRoleIds: readonly string[];
  publicKeyPem: string;
  expiresAtMs: number;
}
export interface ReviewResponsePayload {
  schemaVersion: 1;
  reviewerId: string;
  tenantId: string;
  storyId: string;
  /** The exact settled output this review judges; the queue re-checks the match. */
  outputHash: string;
  decision: ReviewDecision;
  reviewRef: string;
  note: string;
  sequence: number;
  reviewedAtMs: number;
  expiresAtMs: number;
}
const fields: readonly (keyof ReviewResponsePayload)[] = Object.freeze([
  'schemaVersion', 'reviewerId', 'tenantId', 'storyId', 'outputHash', 'decision',
  'reviewRef', 'note', 'sequence', 'reviewedAtMs', 'expiresAtMs',
]);
const identity = (v: unknown): v is string => typeof v === 'string' && /^[A-Za-z0-9][A-Za-z0-9_.:-]{0,127}$/.test(v);
const epoch = (v: unknown): v is number => Number.isSafeInteger(v) && (v as number) >= 0;
const hex = (v: unknown, length: number): v is string => typeof v === 'string' && new RegExp(`^[a-f0-9]{${length}}$`).test(v);
const object = (v: unknown): v is Record<string, unknown> => v !== null && typeof v === 'object' && !Array.isArray(v);
function isPayload(v: unknown): v is ReviewResponsePayload {
  if (!object(v) || Object.keys(v).length !== fields.length || !fields.every(k => Object.hasOwn(v, k))) return false;
  return v.schemaVersion === 1 && identity(v.reviewerId) && identity(v.tenantId) && identity(v.storyId)
    && hex(v.outputHash, 64) && ['APPROVED', 'CHANGES_REQUESTED', 'REJECTED'].includes(v.decision as string)
    && typeof v.reviewRef === 'string' && v.reviewRef.trim().length > 0 && v.reviewRef.length <= REVIEW_RESPONSE_LIMITS.maxReviewRefChars
    && typeof v.note === 'string' && v.note.length <= REVIEW_RESPONSE_LIMITS.maxNoteChars
    && epoch(v.sequence) && v.sequence > 0 && epoch(v.reviewedAtMs) && epoch(v.expiresAtMs);
}
/** Fixed field-order encoding plus protocol domain separation. No private key is handled here. */
export function reviewResponseSigningBytes(payload: ReviewResponsePayload): Buffer {
  if (!isPayload(payload)) throw new Error('invalid review response payload');
  return Buffer.from('XIV_REVIEW_RESPONSE_V1\0' + JSON.stringify(fields.map(k => payload[k])), 'utf8');
}
type Registered = { config: Readonly<ReviewerEnrollment>; key: KeyObject; revoked: boolean; last?: Readonly<ReviewResponsePayload> };
export type ReviewIngestionReason = 'OK' | 'MALFORMED' | 'UNKNOWN_REVIEWER' | 'ENROLLMENT_EXPIRED' | 'REVOKED'
  | 'REPLAYED' | 'STALE' | 'SCOPE_MISMATCH' | 'STORY_NOT_AWAITING_REVIEW' | 'OUTPUT_HASH_MISMATCH'
  | 'NOT_DESIGNATED_REVIEWER';
export type ReviewIngestionResult = Readonly<{
  accepted: boolean; reason: ReviewIngestionReason; storyId: string | null;
  applied: 'DONE' | 'READY' | 'FAILED' | null; reviewerId: string | null; decision: ReviewDecision | null;
}>;

/**
 * Construct only from operator-controlled reviewer enrollment. Do not accept enrollment or
 * public keys from review messages. The queue reference is the ONLY writer; this class itself
 * writes nothing and must run behind a separately authenticated, bounded ingestion boundary.
 */
export class AuthenticatedReviewIngestion {
  readonly #queue: OfflineStoryQueue;
  readonly #registrations = new Map<string, Registered>();
  readonly #clock: () => number;
  #lastClock = -1;

  constructor(input: { queue: OfflineStoryQueue; enrollments: readonly ReviewerEnrollment[]; clock?: () => number }) {
    if (!input || !(input.queue instanceof OfflineStoryQueue) || !Array.isArray(input.enrollments)) throw new Error('invalid review ingestion configuration');
    if (input.enrollments.length > REVIEW_RESPONSE_LIMITS.maxEnrollments) throw new Error('reviewer enrollment capacity exceeded');
    this.#queue = input.queue; this.#clock = input.clock ?? Date.now;
    const now = this.now();
    for (const c of input.enrollments) {
      if (!c || !identity(c.reviewerId) || !identity(c.tenantId)
        || !Array.isArray(c.mayReviewRoleIds) || c.mayReviewRoleIds.length < 1 || c.mayReviewRoleIds.length > 16
        || !c.mayReviewRoleIds.every(identity) || new Set(c.mayReviewRoleIds).size !== c.mayReviewRoleIds.length
        || !epoch(c.expiresAtMs) || c.expiresAtMs <= now || this.#registrations.has(c.reviewerId)
        || typeof c.publicKeyPem !== 'string' || c.publicKeyPem.length > 2048
        || !c.publicKeyPem.startsWith('-----BEGIN PUBLIC KEY-----')) throw new Error('invalid reviewer enrollment');
      const key = createPublicKey(c.publicKeyPem);
      if (key.type !== 'public' || key.asymmetricKeyType !== 'ed25519') throw new Error('Ed25519 public key required');
      this.#registrations.set(c.reviewerId, { config: Object.freeze({ ...c, mayReviewRoleIds: Object.freeze([...c.mayReviewRoleIds]) }), key, revoked: false });
    }
  }
  private now(): number {
    const value = this.#clock();
    if (!epoch(value) || value < this.#lastClock) throw new Error('invalid or backward review clock');
    this.#lastClock = value; return value;
  }
  /** Reject malformed, forged, stale, cross-scope, replayed, and out-of-scope reviews without logging input. */
  accept(raw: string): ReviewIngestionResult {
    const none = (reason: ReviewIngestionReason, reviewerId: string | null = null, decision: ReviewDecision | null = null, storyId: string | null = null): ReviewIngestionResult =>
      Object.freeze({ accepted: false, reason, storyId, applied: null, reviewerId, decision });
    const now = this.now();
    if (typeof raw !== 'string' || Buffer.byteLength(raw, 'utf8') > REVIEW_RESPONSE_LIMITS.maxReceiptBytes) return none('MALFORMED');
    try {
      const envelope: unknown = JSON.parse(raw);
      if (!object(envelope) || Object.keys(envelope).length !== 2 || !Object.hasOwn(envelope, 'payload')
        || !Object.hasOwn(envelope, 'signatureHex') || !isPayload(envelope.payload) || !hex(envelope.signatureHex, 128)) return none('MALFORMED');
      const p = envelope.payload; const r = this.#registrations.get(p.reviewerId);
      if (!r) return none('UNKNOWN_REVIEWER', p.reviewerId, p.decision, p.storyId);
      if (r.revoked) return none('REVOKED', p.reviewerId, p.decision, p.storyId);
      if (r.config.expiresAtMs <= now) return none('ENROLLMENT_EXPIRED', p.reviewerId, p.decision, p.storyId);
      if (p.tenantId !== r.config.tenantId) return none('SCOPE_MISMATCH', p.reviewerId, p.decision, p.storyId);
      if (p.sequence <= (r.last?.sequence ?? 0) || p.reviewedAtMs < (r.last?.reviewedAtMs ?? 0)) return none('REPLAYED', p.reviewerId, p.decision, p.storyId);
      if (p.reviewedAtMs > now || p.expiresAtMs <= now || p.expiresAtMs <= p.reviewedAtMs
        || p.expiresAtMs - p.reviewedAtMs > REVIEW_RESPONSE_LIMITS.maxTtlMs
        || p.expiresAtMs > r.config.expiresAtMs) return none('STALE', p.reviewerId, p.decision, p.storyId);
      if (!verify(null, reviewResponseSigningBytes(p), r.key, Buffer.from(envelope.signatureHex, 'hex'))) return none('MALFORMED', p.reviewerId, p.decision, p.storyId);
      const story = this.#queue.inspectStory(p.tenantId, p.storyId);
      if (!story || story.state !== 'AWAITING_REVIEW') return none('STORY_NOT_AWAITING_REVIEW', p.reviewerId, p.decision, p.storyId);
      if (story.outputHash !== p.outputHash) return none('OUTPUT_HASH_MISMATCH', p.reviewerId, p.decision, p.storyId);
      if (!r.config.mayReviewRoleIds.includes(story.role)) return none('NOT_DESIGNATED_REVIEWER', p.reviewerId, p.decision, p.storyId);
      const applied = this.#queue.applyReviewDecision({ tenantId: p.tenantId, storyId: p.storyId, reviewerId: p.reviewerId,
        expectedOutputHash: p.outputHash, decision: p.decision, reviewRef: p.reviewRef });
      r.last = Object.freeze({ ...p });
      return Object.freeze({ accepted: true, reason: 'OK', storyId: p.storyId, applied, reviewerId: p.reviewerId, decision: p.decision });
    } catch { return none('MALFORMED'); }
  }
  /** Operator-only lifecycle action; this class must not be exposed directly to untrusted clients. */
  revoke(reviewerId: string): void {
    const r = this.#registrations.get(reviewerId);
    if (!r) throw new Error('unknown enrolled reviewer');
    r.revoked = true;
  }
  snapshot() {
    const now = this.now();
    const reviewers = [...this.#registrations.values()].map(r => Object.freeze({
      reviewerId: r.config.reviewerId, tenantId: r.config.tenantId, mayReviewRoleIds: r.config.mayReviewRoleIds,
      state: r.revoked ? 'REVOKED' : r.config.expiresAtMs <= now ? 'ENROLLMENT_EXPIRED' : 'ENROLLED',
      lastSequence: r.last?.sequence ?? null, lastReviewedAtMs: r.last?.reviewedAtMs ?? null }));
    return Object.freeze({ scope: 'THIS_TENANT_AND_EXPLICIT_ENROLLMENTS', reviewerCount: reviewers.length,
      reviewers: Object.freeze(reviewers), assurance: 'REVIEWER_SIGNATURE_NOT_INDEPENDENT_MODEL_ATTESTATION',
      automaticRecovery: false, humanDecision: 'REQUIRED', learningPromoted: false, liveAgentCount: null });
  }
}