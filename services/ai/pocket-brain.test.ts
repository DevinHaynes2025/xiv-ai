/**
 * US-PB-01 Pocket Brain product surface -- honesty contract.
 * Run: npx tsx pocket-brain.test.ts
 */

import assert from 'node:assert/strict';

import {
  BUILTIN_POCKET_BRAIN_FIXTURE,
  DEFAULT_POCKET_READY_PROVIDERS,
  DEFAULT_POCKET_WAITING_PROVIDERS,
  POCKET_BRAIN_POLICY,
  bindPocketBrainFixture,
  clearPocketBrainFixture,
  isPocketBrainFixtureBound,
  listPocketBrainView,
  pocketBrainAllowsAutoPromoteToGlobalBrain,
  pocketBrainAllowsL4,
  pocketBrainAllowsProductionMutation,
  pocketBrainCloudOnlyNeverCached,
  pocketBrainIsReadOnly,
  resetPocketBrainSession,
} from './pocket-brain';

function main() {
  assert.equal(POCKET_BRAIN_POLICY.l4Autonomy, false);
  assert.equal(POCKET_BRAIN_POLICY.productionMutation, false);
  assert.equal(POCKET_BRAIN_POLICY.readOnly, true);
  assert.equal(POCKET_BRAIN_POLICY.layerKind, 'SIMULATION');
  assert.equal(POCKET_BRAIN_POLICY.cloudOnlyNeverCached, true);
  assert.equal(POCKET_BRAIN_POLICY.autoPromoteToGlobalBrain, false);
  assert.equal(POCKET_BRAIN_POLICY.offlineAgentsBypassAuthority, false);
  assert.equal(pocketBrainAllowsL4(), false);
  assert.equal(pocketBrainAllowsProductionMutation(), false);
  assert.equal(pocketBrainIsReadOnly(), true);
  assert.equal(pocketBrainAllowsAutoPromoteToGlobalBrain(), false);
  assert.equal(pocketBrainCloudOnlyNeverCached(), true);

  resetPocketBrainSession();
  assert.equal(isPocketBrainFixtureBound(), false);

  const unbound = listPocketBrainView();
  assert.equal(unbound.status, 'WAITING_DATA');
  assert.equal(unbound.pocketGate, 'WAITING_DATA');
  assert.equal(unbound.role, 'executive');
  assert.equal(unbound.readOnly, true);
  assert.equal(unbound.l4Autonomy, false);
  assert.equal(unbound.productionMutation, false);
  assert.equal(unbound.layerKind, 'SIMULATION');
  assert.equal(unbound.tenantScope, null);
  assert.equal(unbound.universeScope, null);
  assert.equal(unbound.deviceScope, null);
  assert.equal(unbound.cacheCard, null);
  assert.equal(unbound.knowledgeItems, null);
  assert.equal(unbound.cloudOnlyNeverCached, true);
  assert.equal(unbound.autoPromoteToGlobalBrain, false);
  assert.deepEqual(unbound.waitingProviders, [...DEFAULT_POCKET_WAITING_PROVIDERS]);
  assert.ok(unbound.readyProviders.includes('LOCAL_RULES'));
  assert.match(unbound.note, /WAITING_DATA/);
  assert.match(unbound.note, /null/);

  assert.throws(
    () => bindPocketBrainFixture({ universeId: '  ', tenantId: 'xiv', deviceScope: 'asus-local' }),
    /universe_required/,
  );
  assert.throws(
    () => bindPocketBrainFixture({ universeId: 'demo-pocket', tenantId: '  ', deviceScope: 'asus-local' }),
    /tenant_required/,
  );
  assert.throws(
    () => bindPocketBrainFixture({ universeId: 'demo-pocket', tenantId: 'xiv', deviceScope: '  ' }),
    /device_required/,
  );

  assert.equal(BUILTIN_POCKET_BRAIN_FIXTURE.cacheCard.livePocketSync, false);
  assert.equal(BUILTIN_POCKET_BRAIN_FIXTURE.cacheCard.liveGlobalBrain, false);
  assert.equal(BUILTIN_POCKET_BRAIN_FIXTURE.cacheCard.lastSyncAt, null);
  assert.equal(BUILTIN_POCKET_BRAIN_FIXTURE.cacheCard.layerKind, 'SIMULATION');
  assert.ok(BUILTIN_POCKET_BRAIN_FIXTURE.knowledgeItems.some((k) => k.classification === 'CLOUD_ONLY' && k.cached === false));

  const bound = bindPocketBrainFixture({
    universeId: 'demo-pocket',
    tenantId: 'xiv',
    deviceScope: 'asus-local',
  });
  assert.equal(bound.universeId, 'demo-pocket');
  assert.equal(bound.tenantId, 'xiv');
  assert.equal(bound.deviceScope, 'asus-local');
  assert.equal(isPocketBrainFixtureBound(), true);
  assert.equal(bound.cacheCard.livePocketSync, false);
  assert.equal(bound.cacheCard.liveGlobalBrain, false);
  assert.equal(bound.cacheCard.lastSyncAt, null);

  const view = listPocketBrainView({
    tenantId: 'xiv',
    universeId: 'demo-pocket',
    deviceScope: 'asus-local',
  });
  assert.equal(view.pocketGate, 'FIXTURE_SIMULATION');
  assert.equal(view.status, 'WAITING_PROVIDER');
  assert.equal(view.readOnly, true);
  assert.equal(view.l4Autonomy, false);
  assert.equal(view.productionMutation, false);
  assert.equal(view.tenantScope, 'xiv');
  assert.equal(view.universeScope, 'demo-pocket');
  assert.equal(view.deviceScope, 'asus-local');
  assert.ok(view.cacheCard);
  assert.equal(view.cacheCard!.livePocketSync, false);
  assert.equal(view.cacheCard!.liveGlobalBrain, false);
  assert.equal(view.cacheCard!.lastSyncAt, null);
  assert.equal(view.cacheCard!.entryCount, 3);
  assert.equal(view.cacheCard!.cloudOnlyExcludedCount, 1);
  assert.ok(view.knowledgeItems);
  assert.equal(view.knowledgeItems!.length, BUILTIN_POCKET_BRAIN_FIXTURE.knowledgeItems.length);
  assert.ok(view.waitingProviders.includes('XIV_DATA_SYNC'));
  assert.ok(view.readyProviders.includes('LOCAL_OLLAMA_STUB'));
  assert.deepEqual(view.readyProviders, [...DEFAULT_POCKET_READY_PROVIDERS]);
  assert.match(view.note, /FIXTURE_SIMULATION|WAITING_PROVIDER/);
  assert.match(view.note, /livePocketSync=false/);
  assert.match(view.note, /liveGlobalBrain=false/);

  for (const row of view.knowledgeItems!) {
    assert.equal(row.autoPromoteBlocked, true);
    if (row.classification === 'CLOUD_ONLY') {
      assert.equal(row.cached, false);
      assert.ok(row.waitingReason);
    }
  }

  const mismatchTenant = listPocketBrainView({ tenantId: 'other-tenant' });
  assert.equal(mismatchTenant.status, 'WAITING_DATA');
  assert.equal(mismatchTenant.cacheCard, null);
  assert.equal(mismatchTenant.knowledgeItems, null);
  assert.match(mismatchTenant.note, /WAITING_DATA|mismatch|tenant/i);

  const mismatchDevice = listPocketBrainView({
    tenantId: 'xiv',
    universeId: 'demo-pocket',
    deviceScope: 'other-device',
  });
  assert.equal(mismatchDevice.status, 'WAITING_DATA');
  assert.equal(mismatchDevice.cacheCard, null);
  assert.equal(mismatchDevice.knowledgeItems, null);

  clearPocketBrainFixture();
  assert.equal(isPocketBrainFixtureBound(), false);
  const again = listPocketBrainView();
  assert.equal(again.status, 'WAITING_DATA');
  assert.equal(again.cacheCard, null);
  assert.equal(again.knowledgeItems, null);
  assert.equal(again.productionMutation, false);
  assert.equal(again.l4Autonomy, false);
  assert.equal(again.autoPromoteToGlobalBrain, false);

  resetPocketBrainSession();

  console.log(
    'ok - US-PB-01 pocket brain (WAITING_DATA unbound; FIXTURE_SIMULATION bind; WAITING_PROVIDER cloud/sync; lastSyncAt=null; livePocketSync=false; liveGlobalBrain=false; CLOUD_ONLY uncached; productionMutation=false; L4 false; no fabricated pocket metrics)',
  );
}

main();