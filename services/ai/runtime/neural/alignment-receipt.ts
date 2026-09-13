import { createPublicKey, verify } from 'node:crypto';
import { evaluateEcosystemAlignment, type AlignmentDecision, type EcosystemTarget } from './ecosystem-alignment';

export type AlignmentReceiptPayload = {
  tenantId: string; universeId: string; target: EcosystemTarget; issuerId: string; keyId: string;
  nonce: string; issuedAt: string; expiresAt: string; sourceRevision: string;
  participantOptIn: boolean; organizationAuthorized: boolean; humanApprovalRef: string;
  termsDigest: string; dataPolicyDigest: string; capabilityEvidenceDigest: string;
};
export type SignedAlignmentReceipt = { payload: AlignmentReceiptPayload; signature: string };
export type AlignmentReplayStore = { durability: 'MEMORY' | 'DURABLE'; reserve(key: string): boolean };
export type AlignmentTrustContext = {
  tenantId: string; universeId: string; target: EcosystemTarget; issuerId: string; keyId: string;
  publicKeyPem: string; expectedSourceRevision: string; now: Date; maxClockSkewMs: number;
  expectedHumanApprovalRef: string; expectedTermsDigest: string;
  expectedDataPolicyDigest: string; expectedCapabilityEvidenceDigest: string;
  replayStore: AlignmentReplayStore;
  mode: 'TEST' | 'OPERATIONAL';
};
const keys: readonly (keyof AlignmentReceiptPayload)[] = ['tenantId','universeId','target','issuerId','keyId','nonce','issuedAt','expiresAt','sourceRevision','participantOptIn','organizationAuthorized','humanApprovalRef','termsDigest','dataPolicyDigest','capabilityEvidenceDigest'];
export function serializeAlignmentReceipt(p: AlignmentReceiptPayload): string {
  return JSON.stringify(Object.fromEntries(keys.map((key) => [key, p[key]])));
}
function deny(target: EcosystemTarget, reason: string): AlignmentDecision {
  return { target, state: 'NOT_CONFIGURED', allowed: false, reason, productionLive: false, partnershipClaimed: false, grantsAuthority: false };
}
export function evaluateAuthenticatedAlignment(c: AlignmentTrustContext, r: SignedAlignmentReceipt): AlignmentDecision {
  const p = r.payload;
  if (p.tenantId !== c.tenantId || p.universeId !== c.universeId || p.target !== c.target) return deny(c.target, 'scope_mismatch');
  if (p.issuerId !== c.issuerId || p.keyId !== c.keyId) return deny(c.target, 'untrusted_issuer');
  if (p.sourceRevision !== c.expectedSourceRevision) return deny(c.target, 'source_revision_mismatch');
  try {
    if (!verify(null, Buffer.from(serializeAlignmentReceipt(p)), createPublicKey(c.publicKeyPem), Buffer.from(r.signature, 'base64'))) return deny(c.target, 'invalid_signature');
  } catch { return deny(c.target, 'invalid_signature'); }
  const issued = Date.parse(p.issuedAt), expires = Date.parse(p.expiresAt), now = c.now.getTime();
  if (!Number.isFinite(issued) || !Number.isFinite(expires) || expires <= issued) return deny(c.target, 'invalid_time_window');
  if (issued > now + c.maxClockSkewMs) return deny(c.target, 'receipt_from_future');
  if (expires < now) return deny(c.target, 'receipt_expired');
  if (!p.nonce || !p.humanApprovalRef) return deny(c.target, 'approval_or_nonce_missing');
  if (![p.termsDigest,p.dataPolicyDigest,p.capabilityEvidenceDigest].every((v) => /^[a-f0-9]{64}$/i.test(v))) return deny(c.target, 'evidence_digest_invalid');
  if (p.humanApprovalRef !== c.expectedHumanApprovalRef) return deny(c.target, 'human_approval_mismatch');
  if (p.termsDigest !== c.expectedTermsDigest || p.dataPolicyDigest !== c.expectedDataPolicyDigest || p.capabilityEvidenceDigest !== c.expectedCapabilityEvidenceDigest) return deny(c.target, 'evidence_digest_mismatch');
  if (!p.participantOptIn) return deny(c.target, 'participant_opt_in_required');
  if (!p.organizationAuthorized) return deny(c.target, 'organization_authority_required');
  if (c.mode === 'OPERATIONAL' && c.replayStore.durability !== 'DURABLE') return deny(c.target, 'durable_replay_store_required');
  const replayKey = [p.tenantId,p.universeId,p.issuerId,p.keyId,p.nonce].join(':');
  try {
    if (!c.replayStore.reserve(replayKey)) return deny(c.target, 'receipt_replayed');
  } catch { return deny(c.target, 'replay_store_unavailable'); }
  return evaluateEcosystemAlignment({ tenantId:c.tenantId, universeId:c.universeId, target:c.target, actorAuthorized:true, humanApproved:true, participantOptIn:true, organizationAuthorized:true, termsAccepted:true, dataPolicyApproved:true, capabilityEvidenceVerified:true });
}
export function createInMemoryAlignmentReplayStore(): AlignmentReplayStore {
  const seen = new Set<string>(); return { durability: 'MEMORY', reserve(key) { if (seen.has(key)) return false; seen.add(key); return true; } };
}
