/**
 * US-SIM-01 Sims 18+ entry product surface -- honesty contract.
 * Run: npx tsx sims-18-entry.test.ts
 */

import assert from 'node:assert/strict';

import {
  BUILTIN_SIMS_18_ENTRY_FIXTURE,
  BUILTIN_SIMS_WORLDS,
  DEFAULT_SIM_READY_PROVIDERS,
  DEFAULT_SIM_WAITING_PROVIDERS,
  SIMS_18_ENTRY_POLICY,
  acknowledgeSims18Entry,
  attemptSims18Entry,
  bindSims18EntryFixture,
  clearSims18EntryFixture,
  isSims18EntryFixtureBound,
  listSims18EntryView,
  resetSims18EntrySession,
  selectSimsWorld,
  sims18EntryAllowsL4,
  sims18EntryAllowsLiveAgeVerification,
  sims18EntryAllowsLivePortalPhysics,
  sims18EntryAllowsLiveSimWorld,
  sims18EntryAllowsLiveWormholeTransport,
  sims18EntryAllowsProductionMutation,
  sims18EntryAllowsSexualFraming,
  sims18EntryIsReadOnly,
  sims18EntryPortalsWormholesAreMetaphorsOnly,
} from './sims-18-entry';

function main() {
  assert.equal(SIMS_18_ENTRY_POLICY.l4Autonomy, false);
  assert.equal(SIMS_18_ENTRY_POLICY.productionMutation, false);
  assert.equal(SIMS_18_ENTRY_POLICY.readOnly, true);
  assert.equal(SIMS_18_ENTRY_POLICY.layerKind, 'SIMULATION');
  assert.equal(SIMS_18_ENTRY_POLICY.liveSimWorld, false);
  assert.equal(SIMS_18_ENTRY_POLICY.liveAgeVerification, false);
  assert.equal(SIMS_18_ENTRY_POLICY.livePortalPhysics, false);
  assert.equal(SIMS_18_ENTRY_POLICY.liveWormholeTransport, false);
  assert.equal(SIMS_18_ENTRY_POLICY.sexualSimFramingAllowed, false);
  assert.equal(SIMS_18_ENTRY_POLICY.portalsWormholesAreMetaphorsOnly, true);
  assert.equal(SIMS_18_ENTRY_POLICY.ageGateMinimumYears, 18);
  assert.equal(SIMS_18_ENTRY_POLICY.dimensionalFollowUp, '12D-16/17');
  assert.equal(sims18EntryAllowsL4(), false);
  assert.equal(sims18EntryAllowsProductionMutation(), false);
  assert.equal(sims18EntryIsReadOnly(), true);
  assert.equal(sims18EntryAllowsLiveSimWorld(), false);
  assert.equal(sims18EntryAllowsLiveAgeVerification(), false);
  assert.equal(sims18EntryAllowsLivePortalPhysics(), false);
  assert.equal(sims18EntryAllowsLiveWormholeTransport(), false);
  assert.equal(sims18EntryAllowsSexualFraming(), false);
  assert.equal(sims18EntryPortalsWormholesAreMetaphorsOnly(), true);

  resetSims18EntrySession();
  assert.equal(isSims18EntryFixtureBound(), false);

  const unbound = listSims18EntryView();
  assert.equal(unbound.status, 'WAITING_DATA');
  assert.equal(unbound.simsGate, 'WAITING_DATA');
  assert.equal(unbound.role, 'consumer');
  assert.equal(unbound.readOnly, true);
  assert.equal(unbound.l4Autonomy, false);
  assert.equal(unbound.productionMutation, false);
  assert.equal(unbound.layerKind, 'SIMULATION');
  assert.equal(unbound.worlds, null);
  assert.equal(unbound.entryCard, null);
  assert.equal(unbound.ack, null);
  assert.equal(unbound.liveSimWorld, false);
  assert.equal(unbound.liveAgeVerification, false);
  assert.equal(unbound.livePortalPhysics, false);
  assert.equal(unbound.liveWormholeTransport, false);
  assert.equal(unbound.sexualSimFramingAllowed, false);
  assert.equal(unbound.portalsWormholesAreMetaphorsOnly, true);
  assert.equal(unbound.dimensionalFollowUp, '12D-16/17');
  assert.deepEqual(unbound.waitingProviders, [...DEFAULT_SIM_WAITING_PROVIDERS]);
  assert.ok(unbound.readyProviders.includes('LOCAL_RULES'));
  assert.match(unbound.note, /WAITING_DATA/);

  assert.throws(
    () => bindSims18EntryFixture({ universeId: '  ', tenantId: 'xiv' }),
    /universe_required/,
  );
  assert.throws(
    () => bindSims18EntryFixture({ universeId: 'demo-sims-18-entry', tenantId: '  ' }),
    /tenant_required/,
  );

  for (const world of BUILTIN_SIMS_WORLDS) {
    assert.equal(world.requiresAge18Plus, true);
    assert.equal(world.sexualFraming, false);
    assert.equal(world.liveSimWorld, false);
    assert.equal(world.prototypeOnly, true);
    assert.ok(world.entryMetaphor === 'PORTAL' || world.entryMetaphor === 'WORMHOLE');
    assert.match(world.entryLabel, /metaphor/i);
  }
  assert.ok(BUILTIN_SIMS_18_ENTRY_FIXTURE.waitingProviders.includes('LIVE_SIM_WORLD'));

  const bound = bindSims18EntryFixture({
    universeId: 'demo-sims-18-entry',
    tenantId: 'xiv',
  });
  assert.equal(bound.universeId, 'demo-sims-18-entry');
  assert.equal(bound.tenantId, 'xiv');
  assert.equal(isSims18EntryFixtureBound(), true);
  assert.equal(bound.ack.age18PlusAcknowledged, false);
  assert.equal(bound.ack.liveAgeVerification, false);

  const ageRequired = listSims18EntryView({
    tenantId: 'xiv',
    universeId: 'demo-sims-18-entry',
  });
  assert.equal(ageRequired.status, 'AGE_GATE_REQUIRED');
  assert.equal(ageRequired.simsGate, 'AGE_GATE_REQUIRED');
  assert.ok(ageRequired.worlds);
  assert.equal(ageRequired.worlds!.length, BUILTIN_SIMS_WORLDS.length);
  assert.ok(ageRequired.entryCard);
  assert.equal(ageRequired.entryCard!.entryAllowed, false);
  assert.ok(ageRequired.entryCard!.blockingReasons.some((r) => /AGE_GATE_REQUIRED/.test(r)));
  assert.equal(ageRequired.entryCard!.livePortalPhysics, false);
  assert.equal(ageRequired.entryCard!.liveWormholeTransport, false);
  assert.equal(ageRequired.liveSimWorld, false);
  assert.match(ageRequired.note, /AGE_GATE_REQUIRED/);

  const deniedAttempt = attemptSims18Entry();
  assert.equal(deniedAttempt.allowed, false);
  assert.ok(deniedAttempt.reasons.some((r) => /AGE_GATE_REQUIRED|SANDBOX_RULES/.test(r)));

  acknowledgeSims18Entry({ age18PlusAcknowledged: true });
  const stillBlocked = attemptSims18Entry();
  assert.equal(stillBlocked.allowed, false);
  assert.ok(stillBlocked.reasons.some((r) => /SANDBOX_RULES/.test(r)));

  acknowledgeSims18Entry({ sandboxRulesAcknowledged: true });
  const allowed = attemptSims18Entry();
  assert.equal(allowed.allowed, true);
  assert.ok(allowed.card);
  assert.equal(allowed.card!.entryAllowed, true);
  assert.equal(allowed.card!.sexualFraming, false);
  assert.equal(allowed.card!.liveSimWorld, false);
  assert.equal(allowed.card!.liveAgeVerification, false);
  assert.equal(allowed.card!.livePortalPhysics, false);
  assert.equal(allowed.card!.liveWormholeTransport, false);
  assert.match(allowed.card!.entryLabel, /metaphor/i);

  const view = listSims18EntryView({
    tenantId: 'xiv',
    universeId: 'demo-sims-18-entry',
  });
  assert.equal(view.simsGate, 'FIXTURE_SIMULATION');
  assert.equal(view.status, 'WAITING_PROVIDER');
  assert.equal(view.readOnly, true);
  assert.equal(view.l4Autonomy, false);
  assert.equal(view.productionMutation, false);
  assert.ok(view.waitingProviders.includes('LIVE_SIM_WORLD'));
  assert.ok(view.waitingProviders.includes('LIVE_AGE_VERIFICATION'));
  assert.deepEqual(view.readyProviders, [...DEFAULT_SIM_READY_PROVIDERS]);
  assert.equal(view.portalsWormholesAreMetaphorsOnly, true);
  assert.equal(view.dimensionalFollowUp, '12D-16/17');
  assert.match(view.note, /FIXTURE_SIMULATION|WAITING_PROVIDER/);
  assert.match(view.note, /liveSimWorld=false/);
  assert.match(view.note, /metaphor/i);

  selectSimsWorld('sim-pro-atelier');
  const switched = listSims18EntryView({
    tenantId: 'xiv',
    universeId: 'demo-sims-18-entry',
  });
  assert.equal(switched.entryCard!.worldId, 'sim-pro-atelier');
  assert.equal(switched.entryCard!.entryMetaphor, 'WORMHOLE');

  const denied = listSims18EntryView({
    tenantId: 'xiv',
    universeId: 'demo-sims-18-entry',
    forceDenied: true,
  });
  assert.equal(denied.status, 'GATE_DENIED');
  assert.equal(denied.simsGate, 'GATE_DENIED');
  assert.equal(denied.worlds, null);
  assert.equal(denied.entryCard, null);
  assert.match(denied.note, /GATE_DENIED/);

  const mismatchTenant = listSims18EntryView({ tenantId: 'other-tenant' });
  assert.equal(mismatchTenant.status, 'WAITING_DATA');
  assert.equal(mismatchTenant.worlds, null);
  assert.equal(mismatchTenant.entryCard, null);

  clearSims18EntryFixture();
  assert.equal(isSims18EntryFixtureBound(), false);
  const again = listSims18EntryView();
  assert.equal(again.status, 'WAITING_DATA');
  assert.equal(again.worlds, null);
  assert.equal(again.productionMutation, false);
  assert.equal(again.l4Autonomy, false);
  assert.equal(again.liveSimWorld, false);
  assert.equal(again.livePortalPhysics, false);

  resetSims18EntrySession();

  console.log(
    'ok - US-SIM-01 sims 18+ entry (WAITING_DATA unbound; AGE_GATE_REQUIRED; FIXTURE_SIMULATION after acks; WAITING_PROVIDER live sim/age; GATE_DENIED on deny; portal/wormhole metaphors only; liveSimWorld=false; liveAgeVerification=false; sexualFraming=false; productionMutation=false; L4 false; 12D-16/17 FOLLOW_UP)',
  );
}

main();
