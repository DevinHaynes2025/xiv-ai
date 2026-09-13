import assert from 'node:assert/strict';
import { FEEDBACK_SPECIALIST_ROLES, GENOME_PATHWAY_TARGET, previewFeedbackIntake } from './intake-preview';

const context = { tenantId: 'xiv-community-preview', universeId: 'xiv-public-preview' };
const valid = { userId: 'u1', audience: 'COMMUNITY' as const, feedback: 'Please add small, accessible community learning events.', improvementConsent: true };
const receipt = previewFeedbackIntake(valid, context);

assert.equal(receipt.status, 'REVIEW_REQUIRED');
assert.equal(receipt.learningCandidate.state, 'AWAITING_HUMAN_REVIEW');
assert.equal(receipt.learningCandidate.promoted, false);
assert.equal(receipt.feedbackStored, false);
assert.equal(receipt.rawFeedbackReturned, false);
assert.equal(receipt.modelWeightsModified, false);
assert.equal(receipt.neuralPathwayActivated, false);
assert.equal(receipt.profileInferred, false);
assert.equal(receipt.externalAccountsAccessed, false);
assert.match(receipt.feedbackDigest, /^[a-f0-9]{64}$/);
assert.equal('feedback' in receipt, false);

assert.throws(() => previewFeedbackIntake({ ...valid, userId: '' }, context));
assert.throws(() => previewFeedbackIntake({ ...valid, improvementConsent: false }, context));
assert.throws(() => previewFeedbackIntake({ ...valid, feedback: 'short' }, context));
assert.throws(() => previewFeedbackIntake({ ...valid, feedback: 'x'.repeat(2001) }, context));
assert.throws(() => previewFeedbackIntake(valid, { tenantId: '', universeId: 'u' }));

assert.equal(FEEDBACK_SPECIALIST_ROLES.length, 4);
for (const role of FEEDBACK_SPECIALIST_ROLES) {
  assert.equal(role.lifecycle, 'DEFINED');
  assert.equal(role.executionState, 'NOT_RUNNING');
}
assert.ok(FEEDBACK_SPECIALIST_ROLES.find((role) => role.id === 'AI_ECONOMIST')?.prohibitedActions.includes('trade or move money'));
assert.ok(FEEDBACK_SPECIALIST_ROLES.find((role) => role.id === 'COMMUNITY_EVENT_PLANNER')?.prohibitedActions.includes('invite people without consent'));
assert.equal(GENOME_PATHWAY_TARGET.decimal, '1000000000000000000');
assert.equal(GENOME_PATHWAY_TARGET.materialization, 'SPARSE_ON_DEMAND');
assert.equal(GENOME_PATHWAY_TARGET.measuredCapacity, false);
assert.equal(GENOME_PATHWAY_TARGET.claimedAchieved, false);

console.log('Feedback intake preview contracts: OK');
