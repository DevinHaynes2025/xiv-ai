import { createPublicKey, verify } from 'node:crypto';

export type ModerationDecision = 'APPROVE_FOR_EVALUATION' | 'REJECT' | 'REDACT_AND_REVIEW';
export type ModerationReceiptPayload = {
  tenantId: string; universeId: string; recordId: string; feedbackDigest: string;
  reviewerId: string; keyId: string; nonce: string; decision: ModerationDecision;
  reasonCode: 'SAFE_USEFUL' | 'ABUSE' | 'PERSONAL_DATA' | 'UNSUPPORTED_CLAIM' | 'OTHER';
  issuedAt: string; expiresAt: string; sourceRevision: string;
};
export type SignedModerationReceipt = { payload: ModerationReceiptPayload; signature: string };
export type ModerationReplayStore = { durability: 'MEMORY' | 'DURABLE'; reserve(key: string): boolean };
export type ModerationTrustContext = {
  tenantId: string; universeId: string; recordId: string; feedbackDigest: string; feedbackOwnerId: string;
  reviewerId: string; keyId: string; publicKeyPem: string; expectedSourceRevision: string;
  now: Date; maxClockSkewMs: number; revokedKeyIds: ReadonlySet<string>;
  replayStore: ModerationReplayStore; mode: 'TEST' | 'OPERATIONAL'; consentActive: boolean;
};

const keys: readonly (keyof ModerationReceiptPayload)[] = ['tenantId','universeId','recordId','feedbackDigest','reviewerId','keyId','nonce','decision','reasonCode','issuedAt','expiresAt','sourceRevision'];
const SAFE_ID = /^[A-Za-z0-9_-]{1,80}$/;
const DIGEST = /^[a-f0-9]{64}$/i;

export function serializeModerationReceipt(payload: ModerationReceiptPayload) {
  return JSON.stringify(Object.fromEntries(keys.map((key) => [key, payload[key]])));
}

function denied(reason: string) {
  return { verified: false as const, state: 'DENIED' as const, reason, evaluationAllowed: false as const, pathwayPromoted: false as const, modelWeightsModified: false as const, deletionExecuted: false as const };
}

export function verifyModerationReceipt(context: ModerationTrustContext, receipt: SignedModerationReceipt) {
  const payload = receipt.payload;
  const serialized = serializeModerationReceipt(payload);
  if (Buffer.byteLength(serialized) + Buffer.byteLength(receipt.signature) > 8192) return denied('receipt_too_large');
  if (payload.tenantId !== context.tenantId || payload.universeId !== context.universeId || payload.recordId !== context.recordId || payload.feedbackDigest !== context.feedbackDigest) return denied('evidence_scope_mismatch');
  if (!DIGEST.test(payload.feedbackDigest)) return denied('feedback_digest_invalid');
  if (payload.reviewerId !== context.reviewerId || payload.keyId !== context.keyId) return denied('untrusted_reviewer');
  if (payload.reviewerId === context.feedbackOwnerId) return denied('independent_reviewer_required');
  if (context.revokedKeyIds.has(payload.keyId)) return denied('reviewer_key_revoked');
  if (payload.sourceRevision !== context.expectedSourceRevision) return denied('source_revision_mismatch');
  if (!SAFE_ID.test(payload.nonce)) return denied('invalid_nonce');
  try {
    if (/PRIVATE KEY/.test(context.publicKeyPem)) return denied('public_ed25519_key_required');
    const key = createPublicKey(context.publicKeyPem);
    if (key.asymmetricKeyType !== 'ed25519') return denied('public_ed25519_key_required');
    const signature = Buffer.from(receipt.signature, 'base64');
    if (signature.length !== 64 || signature.toString('base64') !== receipt.signature) return denied('invalid_signature_encoding');
    if (!verify(null, Buffer.from(serialized), key, signature)) return denied('invalid_signature');
  } catch { return denied('invalid_signature'); }
  const issued = Date.parse(payload.issuedAt), expires = Date.parse(payload.expiresAt), now = context.now.getTime();
  if (!Number.isFinite(issued) || !Number.isFinite(expires) || expires <= issued) return denied('invalid_time_window');
  if (issued > now + context.maxClockSkewMs) return denied('receipt_from_future');
  if (expires < now) return denied('receipt_expired');
  if (!context.consentActive) return denied('consent_withdrawn');
  if (context.mode === 'OPERATIONAL' && context.replayStore.durability !== 'DURABLE') return denied('durable_replay_store_required');
  try { if (!context.replayStore.reserve([payload.tenantId,payload.universeId,payload.reviewerId,payload.keyId,payload.nonce].join(':'))) return denied('receipt_replayed'); }
  catch { return denied('replay_store_unavailable'); }
  return { verified: true as const, state: 'VERIFIED_MODERATION_RECOMMENDATION' as const, reason: null, decision: payload.decision, evaluationAllowed: payload.decision === 'APPROVE_FOR_EVALUATION', pathwayPromoted: false as const, modelWeightsModified: false as const, deletionExecuted: false as const };
}

export function createInMemoryModerationReplayStore(): ModerationReplayStore {
  const seen = new Set<string>();
  return { durability: 'MEMORY', reserve(key) { if (seen.has(key)) return false; seen.add(key); return true; } };
}

export function evaluateDeletionAuthorization(input: { consentWithdrawn: boolean; ownerDeletionRequested: boolean; privacyApprovalRef?: string; operatorApprovalRef?: string; exactRecordRevisionMatched: boolean }) {
  const approved = input.consentWithdrawn && input.ownerDeletionRequested && SAFE_ID.test(input.privacyApprovalRef ?? '') && SAFE_ID.test(input.operatorApprovalRef ?? '') && input.privacyApprovalRef !== input.operatorApprovalRef && input.exactRecordRevisionMatched;
  return { approved, state: approved ? 'AUTHORIZED_FOR_SEPARATE_DELETION_WORKFLOW' as const : 'REVIEW_REQUIRED' as const, deletionExecuted: false as const, productionWritePerformed: false as const };
}
