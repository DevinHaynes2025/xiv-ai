import assert from 'node:assert/strict';
import { buildExperienceResponse } from './experience-backend';
import { toExperienceViewModel } from './experience-view-model';

const cards = [{
  id: 'story-1',
  title: 'Supplier variability',
  summary: 'Lead-time variation is increasing inventory pressure.',
  confidence: 0.82,
  evidenceRefs: ['metric:lead-time-variance'],
  action: { label: 'Review simulation', approvalRequired: true },
}];

const executive = buildExperienceResponse({
  tenantId: 'xiv-demo',
  userId: 'ceo',
  surface: 'EXECUTIVE_HOME',
  offline: true,
}, cards);
assert.equal(executive.offlineCapable, true);
assert.equal(executive.cards[0].action?.approvalRequired, true);

const community = buildExperienceResponse({
  tenantId: 'xiv-demo',
  userId: 'ceo',
  surface: 'COMMUNITY',
  offline: true,
}, []);
assert.equal(community.offlineCapable, false);
assert.ok(community.warnings.includes('surface_requires_network_or_cached_content'));

const view = toExperienceViewModel('EXECUTIVE_HOME', cards);
assert.equal(view.storyFirst, true);
assert.equal(view.density, 'LOW');
assert.match(view.primaryQuestion, /What changed/);

console.log('12D-39 local brain persistence/UX/backend contracts: OK');
