import { strict as assert } from 'node:assert';
import { composeDashboard, canRenderCardForClient } from './live-visual-dashboard';
import { buildStoryDrilldown } from './story-visual-drilldown';
import { buildLovableUxSyncManifest } from './lovable-ux-sync-manifest';

const card = {
  id: 'card-1',
  tenantId: 'tenant-a',
  title: 'Fulfillment risk',
  story: 'Supplier variability increased safety stock and warehouse congestion.',
  visual: 'TIMELINE' as const,
  data: [{ label: 'late orders', value: 14, unit: '%', evidenceRefs: ['ev-1'] }],
  confidence: 0.82,
  classification: 'CONFIDENTIAL' as const,
  nextAction: 'Run a governed reallocation simulation',
};

const mobile = composeDashboard('MOBILE', [card]);
assert.equal(mobile.columns, 1);
assert.equal(mobile.rawDataDefaultVisible, false);
assert.equal(canRenderCardForClient(card), true);

const topSecret = { ...card, id: 'card-2', classification: 'TOP_SECRET' as const };
assert.equal(canRenderCardForClient(topSecret), false);

const drilldown = buildStoryDrilldown(card);
assert.deepEqual(drilldown.map(x => x.level), ['STORY','EVIDENCE','RAW']);

const sync = buildLovableUxSyncManifest('PAUSED', ['lovable-project-receipt']);
assert.equal(sync.sourceOfTruth, 'GITHUB_GITLAB_GOVERNED_HISTORY');
assert.equal(sync.forbiddenScopes.includes('TOP_SECRET prompts'), true);

console.log('12D-48 live visual dashboard/Lovable sync contracts: OK');
