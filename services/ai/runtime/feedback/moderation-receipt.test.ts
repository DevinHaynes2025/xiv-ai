import assert from 'node:assert/strict';
import { generateKeyPairSync, sign } from 'node:crypto';
import { createInMemoryModerationReplayStore, evaluateDeletionAuthorization, serializeModerationReceipt, verifyModerationReceipt, type ModerationReceiptPayload, type ModerationTrustContext } from './moderation-receipt';

const key = generateKeyPairSync('ed25519'), forged = generateKeyPairSync('ed25519'), digest = 'a'.repeat(64);
const payload: ModerationReceiptPayload = { tenantId:'tenant-a',universeId:'universe-a',recordId:'record-1',feedbackDigest:digest,reviewerId:'reviewer-a',keyId:'key-1',nonce:'nonce-1',decision:'APPROVE_FOR_EVALUATION',reasonCode:'SAFE_USEFUL',issuedAt:'2026-09-13T02:00:00Z',expiresAt:'2026-09-13T03:00:00Z',sourceRevision:'revision-1' };
const signed = (p=payload,privateKey=key.privateKey) => ({payload:p,signature:sign(null,Buffer.from(serializeModerationReceipt(p)),privateKey).toString('base64')});
const context = ():ModerationTrustContext => ({tenantId:'tenant-a',universeId:'universe-a',recordId:'record-1',feedbackDigest:digest,feedbackOwnerId:'owner-a',reviewerId:'reviewer-a',keyId:'key-1',publicKeyPem:key.publicKey.export({type:'spki',format:'pem'}).toString(),expectedSourceRevision:'revision-1',now:new Date('2026-09-13T02:30:00Z'),maxClockSkewMs:30000,revokedKeyIds:new Set(),replayStore:createInMemoryModerationReplayStore(),mode:'TEST',consentActive:true});

assert.equal(verifyModerationReceipt(context(),signed()).evaluationAllowed,true);
assert.equal(verifyModerationReceipt(context(),signed()).pathwayPromoted,false);
assert.equal(verifyModerationReceipt(context(),signed(payload,forged.privateKey)).reason,'invalid_signature');
assert.equal(verifyModerationReceipt({...context(),tenantId:'tenant-b'},signed()).reason,'evidence_scope_mismatch');
assert.equal(verifyModerationReceipt({...context(),feedbackOwnerId:'reviewer-a'},signed()).reason,'independent_reviewer_required');
assert.equal(verifyModerationReceipt({...context(),consentActive:false},signed()).reason,'consent_withdrawn');
assert.equal(verifyModerationReceipt({...context(),revokedKeyIds:new Set(['key-1'])},signed()).reason,'reviewer_key_revoked');
assert.equal(verifyModerationReceipt({...context(),mode:'OPERATIONAL'},signed()).reason,'durable_replay_store_required');
const replayContext=context(), receipt=signed();assert.equal(verifyModerationReceipt(replayContext,receipt).verified,true);assert.equal(verifyModerationReceipt(replayContext,receipt).reason,'receipt_replayed');
const deletion={consentWithdrawn:true,ownerDeletionRequested:true,privacyApprovalRef:'privacy-1',operatorApprovalRef:'operator-1',exactRecordRevisionMatched:true};
assert.equal(evaluateDeletionAuthorization(deletion).approved,true);
assert.equal(evaluateDeletionAuthorization(deletion).deletionExecuted,false);
assert.equal(evaluateDeletionAuthorization({...deletion,consentWithdrawn:false}).approved,false);
assert.equal(evaluateDeletionAuthorization({...deletion,operatorApprovalRef:'privacy-1'}).approved,false);
assert.equal(evaluateDeletionAuthorization({...deletion,exactRecordRevisionMatched:false}).approved,false);
console.log('Signed feedback moderation contracts: OK');
