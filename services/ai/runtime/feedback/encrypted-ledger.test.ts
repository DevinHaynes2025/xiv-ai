import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { EncryptedFeedbackLedger, FEEDBACK_GOVERNANCE_STATUS, evaluateFeedbackPathwayPromotion } from './encrypted-ledger';

const root = mkdtempSync(join(tmpdir(), 'xiv-feedback-'));
const key = Buffer.alloc(32, 7);
const ledger = new EncryptedFeedbackLedger({ rootDirectory: root, key, keyId: 'test-key-1', now: () => new Date('2026-09-13T02:00:00Z') });
const submitted = ledger.submit({ tenantId: 'tenant-a', universeId: 'universe-a', userId: 'user-a', consentReceiptId: 'consent-1', feedback: 'Please create accessible community workshops in Dallas.' });
assert.equal(submitted.state, 'ACTIVE_REVIEW_CANDIDATE');
assert.equal(submitted.pathwayPromoted, false);
assert.equal(readFileSync(join(root, 'feedback-events.jsonl'), 'utf8').includes('accessible community workshops'), false);
assert.equal(ledger.readForOwner({ tenantId: 'tenant-a', universeId: 'universe-a', userId: 'user-a', recordId: submitted.recordId }), 'Please create accessible community workshops in Dallas.');
assert.throws(() => ledger.readForOwner({ tenantId: 'tenant-b', universeId: 'universe-a', userId: 'user-a', recordId: submitted.recordId }));

const restarted = new EncryptedFeedbackLedger({ rootDirectory: root, key, keyId: 'test-key-1' });
assert.equal(restarted.readForOwner({ tenantId: 'tenant-a', universeId: 'universe-a', userId: 'user-a', recordId: submitted.recordId }).startsWith('Please create'), true);
assert.equal(restarted.withdrawConsent({ tenantId: 'tenant-a', universeId: 'universe-a', userId: 'user-a', recordId: submitted.recordId }).state, 'CONSENT_WITHDRAWN');
assert.throws(() => restarted.readForOwner({ tenantId: 'tenant-a', universeId: 'universe-a', userId: 'user-a', recordId: submitted.recordId }));
assert.equal(restarted.requestDeletion({ tenantId: 'tenant-a', universeId: 'universe-a', userId: 'user-a', recordId: submitted.recordId }).state, 'DELETION_PENDING');

const base = { consentActive: true, moderationApproved: true, evaluationScore: 0.92, independentReviewReferences: ['review-a', 'review-b'], humanApprovalReference: 'approval-1' };
assert.equal(evaluateFeedbackPathwayPromotion(base).allowed, true);
assert.equal(evaluateFeedbackPathwayPromotion(base).pathwayPromoted, false);
assert.equal(evaluateFeedbackPathwayPromotion({ ...base, consentActive: false }).allowed, false);
assert.equal(evaluateFeedbackPathwayPromotion({ ...base, evaluationScore: 0.919 }).allowed, false);
assert.equal(evaluateFeedbackPathwayPromotion({ ...base, independentReviewReferences: ['review-a', 'review-a'] }).allowed, false);
assert.equal(evaluateFeedbackPathwayPromotion({ ...base, humanApprovalReference: undefined }).allowed, false);
assert.equal(FEEDBACK_GOVERNANCE_STATUS.productionWritesEnabled, false);
assert.equal(FEEDBACK_GOVERNANCE_STATUS.physicalDeletion, 'OPERATOR_WORKFLOW_REQUIRED');
console.log('Encrypted feedback ledger contracts: OK');
