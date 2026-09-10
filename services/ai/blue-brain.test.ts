/**
 * US-BB-01 Blue Brain product surface -- honesty contract.
 * Run: npx tsx blue-brain.test.ts
 */

import assert from 'node:assert/strict';

import {
  BUILTIN_BLUE_BRAIN_FIXTURE,
  DEFAULT_BLUE_READY_PROVIDERS,
  DEFAULT_BLUE_WAITING_PROVIDERS,
  BLUE_BRAIN_POLICY,
  allowBlueBrainPolicyGate,
  bindBlueBrainFixture,
  blueBrainAllowsAspirationalAsMeasured,
  blueBrainAllowsEnterGlobalBrain,
  blueBrainAllowsL4,
  blueBrainAllowsLiveCloudSyncClaim,
  blueBrainAllowsPolicyGateBypass,
  blueBrainAllowsProductionMutation,
  blueBrainAllowsPromoteToGlobalBrain,
  blueBrainIsReadOnly,
  blueBrainPocketIngestStubsOnly,
  blueBrainPolicyGateInFront,
  clearBlueBrainFixture,
  denyBlueBrainPolicyGate,
  isBlueBrainFixtureBound,
  listBlueBrainView,
  resetBlueBrainSession,
} from './blue-brain';

function main() {
  assert.equal(BLUE_BRAIN_POLICY.l4Autonomy, false);
  assert.equal(BLUE_BRAIN_POLICY.productionMutation, false);
  assert.equal(BLUE_BRAIN_POLICY.readOnly, true);
  assert.equal(BLUE_BRAIN_POLICY.layerKind, 'SIMULATION');
  assert.equal(BLUE_BRAIN_POLICY.liveCloudSyncClaimed, false);
  assert.equal(BLUE_BRAIN_POLICY.mayEnterGlobalBrain, false);
  assert.equal(BLUE_BRAIN_POLICY.promoteToGlobalBrainAllowed, false);
  assert.equal(BLUE_BRAIN_POLICY.policyGateInFront, true);
  assert.equal(BLUE_BRAIN_POLICY.policyGateBypassAllowed, false);
  assert.equal(BLUE_BRAIN_POLICY.pocketIngestStubsOnly, true);
  assert.equal(BLUE_BRAIN_POLICY.acceleratorVerifiedAllowed, false);
  assert.equal(BLUE_BRAIN_POLICY.aspirationalScaleAsMeasuredAllowed, false);
  assert.equal(blueBrainAllowsL4(), false);
  assert.equal(blueBrainAllowsProductionMutation(), false);
  assert.equal(blueBrainIsReadOnly(), true);
  assert.equal(blueBrainAllowsLiveCloudSyncClaim(), false);
  assert.equal(blueBrainAllowsEnterGlobalBrain(), false);
  assert.equal(blueBrainAllowsPromoteToGlobalBrain(), false);
  assert.equal(blueBrainPolicyGateInFront(), true);
  assert.equal(blueBrainAllowsPolicyGateBypass(), false);
  assert.equal(blueBrainPocketIngestStubsOnly(), true);
  assert.equal(blueBrainAllowsAspirationalAsMeasured(), false);
  assert.equal(allowBlueBrainPolicyGate(), 'ALLOWED');
  assert.equal(denyBlueBrainPolicyGate('test'), 'DENIED');

  resetBlueBrainSession();
  assert.equal(isBlueBrainFixtureBound(), false);

  const unbound = listBlueBrainView();
  assert.equal(unbound.status, 'WAITING_DATA');
  assert.equal(unbound.blueBrainGate, 'WAITING_DATA');
  assert.equal(unbound.policyGate, 'WAITING_DATA');
  assert.equal(unbound.role, 'executive');
  assert.equal(unbound.readOnly, true);
  assert.equal(unbound.l4Autonomy, false);
  assert.equal(unbound.productionMutation, false);
  assert.equal(unbound.layerKind, 'SIMULATION');
  assert.equal(unbound.tenantScope, null);
  assert.equal(unbound.universeScope, null);
  assert.equal(unbound.deviceScope, null);
  assert.equal(unbound.surfaceCard, null);
  assert.equal(unbound.pocketIngestStubs, null);
  assert.equal(unbound.scaleClaims, null);
  assert.equal(unbound.liveCloudSyncClaimed, false);
  assert.equal(unbound.mayEnterGlobalBrain, false);
  assert.equal(unbound.promoteToGlobalBrainAllowed, false);
  assert.equal(unbound.policyGateInFront, true);
  assert.equal(unbound.pocketIngestStubsOnly, true);
  assert.deepEqual(unbound.waitingProviders, [...DEFAULT_BLUE_WAITING_PROVIDERS]);
  assert.ok(unbound.readyProviders.includes('LOCAL_RULES'));
  assert.match(unbound.note, /WAITING_DATA/);
  assert.match(unbound.note, /null/);

  assert.throws(
    () => bindBlueBrainFixture({ universeId: '  ', tenantId: 'xiv', deviceScope: 'asus-local' }),
    /universe_required/,
  );
  assert.throws(
    () => bindBlueBrainFixture({ universeId: 'demo-blue-brain', tenantId: '  ', deviceScope: 'asus-local' }),
    /tenant_required/,
  );
  assert.throws(
    () => bindBlueBrainFixture({ universeId: 'demo-blue-brain', tenantId: 'xiv', deviceScope: '  ' }),
    /device_required/,
  );

  assert.equal(BUILTIN_BLUE_BRAIN_FIXTURE.surfaceCard.liveCloudSyncClaimed, false);
  assert.equal(BUILTIN_BLUE_BRAIN_FIXTURE.surfaceCard.mayEnterGlobalBrain, false);
  assert.equal(BUILTIN_BLUE_BRAIN_FIXTURE.surfaceCard.lastReadAt, null);
  assert.equal(BUILTIN_BLUE_BRAIN_FIXTURE.surfaceCard.layerKind, 'SIMULATION');
  assert.ok(
    BUILTIN_BLUE_BRAIN_FIXTURE.pocketIngestStubs.some(
      (k) => k.classification === 'CLOUD_ONLY' && k.cached === false,
    ),
  );
  assert.ok(
    BUILTIN_BLUE_BRAIN_FIXTURE.scaleClaims.some((c) => c.kind === 'aspirational' && c.asMeasured === false),
  );

  const bound = bindBlueBrainFixture({
    universeId: 'demo-blue-brain',
    tenantId: 'xiv',
    deviceScope: 'asus-local',
  });
  assert.equal(bound.universeId, 'demo-blue-brain');
  assert.equal(bound.tenantId, 'xiv');
  assert.equal(bound.deviceScope, 'asus-local');
  assert.equal(bound.policyGate, 'ALLOWED');
  assert.equal(isBlueBrainFixtureBound(), true);
  assert.equal(bound.surfaceCard.liveCloudSyncClaimed, false);
  assert.equal(bound.surfaceCard.mayEnterGlobalBrain, false);
  assert.equal(bound.surfaceCard.lastReadAt, null);

  const view = listBlueBrainView({
    tenantId: 'xiv',
    universeId: 'demo-blue-brain',
    deviceScope: 'asus-local',
  });
  assert.equal(view.blueBrainGate, 'FIXTURE_SIMULATION');
  assert.equal(view.status, 'WAITING_PROVIDER');
  assert.equal(view.policyGate, 'ALLOWED');
  assert.equal(view.readOnly, true);
  assert.equal(view.l4Autonomy, false);
  assert.equal(view.productionMutation, false);
  assert.equal(view.tenantScope, 'xiv');
  assert.equal(view.universeScope, 'demo-blue-brain');
  assert.equal(view.deviceScope, 'asus-local');
  assert.ok(view.surfaceCard);
  assert.equal(view.surfaceCard!.liveCloudSyncClaimed, false);
  assert.equal(view.surfaceCard!.mayEnterGlobalBrain, false);
  assert.equal(view.surfaceCard!.lastReadAt, null);
  assert.equal(view.surfaceCard!.stubCount, 3);
  assert.ok(view.pocketIngestStubs);
  assert.equal(view.pocketIngestStubs!.length, BUILTIN_BLUE_BRAIN_FIXTURE.pocketIngestStubs.length);
  assert.ok(view.waitingProviders.includes('GLOBAL_BRAIN'));
  assert.ok(view.readyProviders.includes('POCKET_INGEST_STUB'));
  assert.deepEqual(view.readyProviders, [...DEFAULT_BLUE_READY_PROVIDERS]);
  assert.match(view.note, /FIXTURE_SIMULATION|WAITING_PROVIDER/);
  assert.match(view.note, /liveCloudSyncClaimed=false/);
  assert.match(view.note, /mayEnterGlobalBrain=false/);

  for (const row of view.pocketIngestStubs!) {
    assert.equal(row.mayEnterGlobalBrain, false);
    if (row.classification === 'CLOUD_ONLY') {
      assert.equal(row.cached, false);
      assert.ok(row.waitingReason);
    }
  }

  assert.ok(view.scaleClaims);
  for (const claim of view.scaleClaims!) {
    if (claim.kind === 'aspirational') {
      assert.equal(claim.asMeasured, false);
      assert.equal(claim.value, null);
    } else {
      assert.equal(claim.asMeasured, true);
    }
  }

  const denied = listBlueBrainView({
    tenantId: 'xiv',
    universeId: 'demo-blue-brain',
    deviceScope: 'asus-local',
    policyGate: 'DENIED',
  });
  assert.equal(denied.status, 'GATE_DENIED');
  assert.equal(denied.blueBrainGate, 'GATE_DENIED');
  assert.equal(denied.policyGate, 'DENIED');
  assert.equal(denied.surfaceCard, null);
  assert.equal(denied.pocketIngestStubs, null);
  assert.equal(denied.scaleClaims, null);
  assert.match(denied.note, /GATE_DENIED/);

  const mismatchTenant = listBlueBrainView({ tenantId: 'other-tenant' });
  assert.equal(mismatchTenant.status, 'WAITING_DATA');
  assert.equal(mismatchTenant.surfaceCard, null);
  assert.equal(mismatchTenant.pocketIngestStubs, null);
  assert.match(mismatchTenant.note, /WAITING_DATA|mismatch|tenant/i);

  const mismatchDevice = listBlueBrainView({
    tenantId: 'xiv',
    universeId: 'demo-blue-brain',
    deviceScope: 'other-device',
  });
  assert.equal(mismatchDevice.status, 'WAITING_DATA');
  assert.equal(mismatchDevice.surfaceCard, null);
  assert.equal(mismatchDevice.pocketIngestStubs, null);

  clearBlueBrainFixture();
  assert.equal(isBlueBrainFixtureBound(), false);
  const again = listBlueBrainView();
  assert.equal(again.status, 'WAITING_DATA');
  assert.equal(again.surfaceCard, null);
  assert.equal(again.pocketIngestStubs, null);
  assert.equal(again.productionMutation, false);
  assert.equal(again.l4Autonomy, false);
  assert.equal(again.mayEnterGlobalBrain, false);
  assert.equal(again.liveCloudSyncClaimed, false);

  resetBlueBrainSession();

  console.log(
    'ok - US-BB-01 blue brain (WAITING_DATA unbound; FIXTURE_SIMULATION bind; WAITING_PROVIDER cloud/sync/Global Brain; GATE_DENIED on deny; lastReadAt=null; liveCloudSyncClaimed=false; mayEnterGlobalBrain=false; aspirational not measured; productionMutation=false; L4 false; no fabricated neural metrics)',
  );
}

main();