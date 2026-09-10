/**
 * US-MC-01 Adult Mindcraft gated entry -- honesty contract.
 * Run: npx tsx mindcraft-adults-entry.test.ts
 */

import assert from 'node:assert/strict';

import {
  BUILTIN_MINDCRAFT_ADULTS_ENTRY_FIXTURE,
  BUILTIN_MINDCRAFT_ROOMS,
  CULTURE_GALLERY_ENTRY_LINES,
  DEFAULT_MC_READY_PROVIDERS,
  DEFAULT_MC_WAITING_PROVIDERS,
  HEALTH_GROVE_ENTRY_LINES,
  MINDCRAFT_ADULTS_ENTRY_POLICY,
  US_COM_01_DENY_CODES,
  acknowledgeMindcraftAdultsEntry,
  attemptMindcraftRoomEntry,
  bindMindcraftAdultsEntryFixture,
  clearMindcraftAdultsEntryFixture,
  clearMindcraftPolicyDenialStubs,
  isMindcraftAdultsEntryFixtureBound,
  listMindcraftAdultsEntryView,
  mindcraftAdultsEntryAllowsL4,
  mindcraftAdultsEntryAllowsLiveAgeVerification,
  mindcraftAdultsEntryAllowsLiveLegalWaiver,
  mindcraftAdultsEntryAllowsLiveMindcraftWorld,
  mindcraftAdultsEntryAllowsProductionMutation,
  mindcraftAdultsEntryAllowsSexualFraming,
  mindcraftAdultsEntryClothingOptionalOnlyCultureGallery,
  mindcraftAdultsEntryIsReadOnly,
  probeMindcraftPolicyDenialStubs,
  resetMindcraftAdultsEntrySession,
  selectMindcraftRoom,
} from './mindcraft-adults-entry';

function main() {
  assert.equal(MINDCRAFT_ADULTS_ENTRY_POLICY.l4Autonomy, false);
  assert.equal(MINDCRAFT_ADULTS_ENTRY_POLICY.productionMutation, false);
  assert.equal(MINDCRAFT_ADULTS_ENTRY_POLICY.readOnly, true);
  assert.equal(MINDCRAFT_ADULTS_ENTRY_POLICY.layerKind, 'SIMULATION');
  assert.equal(MINDCRAFT_ADULTS_ENTRY_POLICY.liveLegalWaiver, false);
  assert.equal(MINDCRAFT_ADULTS_ENTRY_POLICY.liveAgeVerification, false);
  assert.equal(MINDCRAFT_ADULTS_ENTRY_POLICY.liveMindcraftWorld, false);
  assert.equal(MINDCRAFT_ADULTS_ENTRY_POLICY.sexualFramingAllowed, false);
  assert.equal(MINDCRAFT_ADULTS_ENTRY_POLICY.antiPredatorPolicyRequired, true);
  assert.equal(MINDCRAFT_ADULTS_ENTRY_POLICY.ageGateMinimumYears, 18);
  assert.equal(MINDCRAFT_ADULTS_ENTRY_POLICY.clothingOptionalOnlyCultureGalleryHeritageEdu, true);
  assert.equal(MINDCRAFT_ADULTS_ENTRY_POLICY.reportsPreserved, true);
  assert.equal(MINDCRAFT_ADULTS_ENTRY_POLICY.storyId, 'US-MC-01');
  assert.equal(mindcraftAdultsEntryAllowsL4(), false);
  assert.equal(mindcraftAdultsEntryAllowsProductionMutation(), false);
  assert.equal(mindcraftAdultsEntryIsReadOnly(), true);
  assert.equal(mindcraftAdultsEntryAllowsLiveLegalWaiver(), false);
  assert.equal(mindcraftAdultsEntryAllowsLiveAgeVerification(), false);
  assert.equal(mindcraftAdultsEntryAllowsLiveMindcraftWorld(), false);
  assert.equal(mindcraftAdultsEntryAllowsSexualFraming(), false);
  assert.equal(mindcraftAdultsEntryClothingOptionalOnlyCultureGallery(), true);

  assert.deepEqual(
    [...US_COM_01_DENY_CODES],
    [
      'PREDATOR_GROOMING_DENIED',
      'SEXUALIZATION_DENIED',
      'BULLY_HARASS_DENIED',
      'SCAM_FRAUD_DENIED',
      'UNDERAGE_ACCESS_DENIED',
      'REPORT_RETALIATION_DENIED',
    ],
  );

  resetMindcraftAdultsEntrySession();
  assert.equal(isMindcraftAdultsEntryFixtureBound(), false);

  const unbound = listMindcraftAdultsEntryView();
  assert.equal(unbound.status, 'WAITING_DATA');
  assert.equal(unbound.mindcraftGate, 'WAITING_DATA');
  assert.equal(unbound.role, 'consumer');
  assert.equal(unbound.readOnly, true);
  assert.equal(unbound.l4Autonomy, false);
  assert.equal(unbound.productionMutation, false);
  assert.equal(unbound.layerKind, 'SIMULATION');
  assert.equal(unbound.rooms, null);
  assert.equal(unbound.entryCard, null);
  assert.equal(unbound.ack, null);
  assert.equal(unbound.policyDenials, null);
  assert.equal(unbound.liveLegalWaiver, false);
  assert.equal(unbound.liveAgeVerification, false);
  assert.equal(unbound.liveMindcraftWorld, false);
  assert.equal(unbound.sexualFramingAllowed, false);
  assert.equal(unbound.clothingOptionalOnlyCultureGalleryHeritageEdu, true);
  assert.equal(unbound.reportsPreserved, true);
  assert.equal(unbound.storyId, 'US-MC-01');
  assert.deepEqual(unbound.waitingProviders, [...DEFAULT_MC_WAITING_PROVIDERS]);
  assert.ok(unbound.readyProviders.includes('LOCAL_RULES'));
  assert.match(unbound.note, /WAITING_DATA/);

  assert.throws(
    () => bindMindcraftAdultsEntryFixture({ universeId: '  ', tenantId: 'xiv' }),
    /universe_required/,
  );
  assert.throws(
    () => bindMindcraftAdultsEntryFixture({ universeId: 'demo-mindcraft-adults-entry', tenantId: '  ' }),
    /tenant_required/,
  );

  assert.equal(BUILTIN_MINDCRAFT_ROOMS.length, 7);
  const roomIds = BUILTIN_MINDCRAFT_ROOMS.map((r) => r.roomId);
  assert.deepEqual(roomIds, [
    'lobby-agora',
    'biz-atelier',
    'social-hearth',
    'culture-gallery',
    'health-grove',
    'sim-sandbox',
    'safety-desk',
  ]);

  for (const room of BUILTIN_MINDCRAFT_ROOMS) {
    assert.equal(room.requiresAge18Plus, true);
    assert.equal(room.sexualFraming, false);
    assert.equal(room.simulation, true);
    assert.equal(room.liveMindcraftWorld, false);
    assert.equal(room.prototypeOnly, true);
    assert.ok(room.envClass === 'LOCAL' || room.envClass === 'CLOUD_SANDBOX');
  }

  const culture = BUILTIN_MINDCRAFT_ROOMS.find((r) => r.roomId === 'culture-gallery')!;
  assert.equal(culture.clothingOptionalHeritageEduOnly, true);
  assert.equal(culture.requiresSoftReverify, true);
  assert.equal(culture.framing, 'NON_SEXUAL_CULTURAL');
  assert.match(culture.description, /heritage|education|Cultural Steward/i);

  const health = BUILTIN_MINDCRAFT_ROOMS.find((r) => r.roomId === 'health-grove')!;
  assert.equal(health.requiresSoftReverify, true);
  assert.equal(health.clothingOptionalHeritageEduOnly, false);

  for (const room of BUILTIN_MINDCRAFT_ROOMS) {
    if (room.roomId !== 'culture-gallery') {
      assert.equal(room.clothingOptionalHeritageEduOnly, false);
    }
  }

  assert.equal(HEALTH_GROVE_ENTRY_LINES.length, 5);
  assert.equal(CULTURE_GALLERY_ENTRY_LINES.length, 5);
  assert.ok(HEALTH_GROVE_ENTRY_LINES.some((l) => /WAITING_CLINICAL/.test(l)));
  assert.ok(CULTURE_GALLERY_ENTRY_LINES.some((l) => /heritage\/education/i.test(l)));

  const bound = bindMindcraftAdultsEntryFixture({
    universeId: 'demo-mindcraft-adults-entry',
    tenantId: 'xiv',
  });
  assert.equal(bound.universeId, 'demo-mindcraft-adults-entry');
  assert.equal(bound.tenantId, 'xiv');
  assert.equal(isMindcraftAdultsEntryFixtureBound(), true);
  assert.equal(bound.ack.liveLegal, false);
  assert.equal(bound.ack.liveAgeVerification, false);
  assert.equal(bound.ack.age18PlusAcknowledged, false);
  assert.equal(bound.healthEntryLinesPresent, true);
  assert.equal(bound.cultureEntryLinesPresent, true);

  const needsAge = listMindcraftAdultsEntryView({
    tenantId: 'xiv',
    universeId: 'demo-mindcraft-adults-entry',
  });
  assert.equal(needsAge.mindcraftGate, 'AGE_GATE_REQUIRED');
  assert.equal(needsAge.status, 'AGE_GATE_REQUIRED');
  assert.ok(needsAge.rooms);
  assert.equal(needsAge.rooms!.length, 7);
  assert.ok(needsAge.entryCard);
  assert.equal(needsAge.entryCard!.entryAllowed, false);
  assert.ok(needsAge.entryCard!.blockingReasons.includes('AGE_GATE_DENIED'));
  assert.equal(needsAge.entryCard!.sexualFraming, false);
  assert.equal(needsAge.liveLegalWaiver, false);
  assert.equal(needsAge.liveAgeVerification, false);
  assert.match(needsAge.note, /AGE_GATE_REQUIRED/);

  const deniedEntry = attemptMindcraftRoomEntry();
  assert.equal(deniedEntry.allowed, false);
  assert.equal(deniedEntry.gate, 'AGE_GATE_REQUIRED');
  assert.ok(deniedEntry.denial);
  assert.equal(deniedEntry.denial!.code, 'AGE_GATE_DENIED');
  assert.equal(deniedEntry.denial!.liveIncident, false);

  acknowledgeMindcraftAdultsEntry({ age18PlusAcknowledged: true });
  const needsRules = listMindcraftAdultsEntryView({
    tenantId: 'xiv',
    universeId: 'demo-mindcraft-adults-entry',
  });
  assert.equal(needsRules.mindcraftGate, 'RULES_ACK_REQUIRED');
  assert.equal(needsRules.status, 'RULES_ACK_REQUIRED');
  assert.equal(needsRules.ack!.age18PlusAcknowledged, true);
  assert.equal(needsRules.ack!.liveLegal, false);
  assert.ok(needsRules.entryCard!.blockingReasons.includes('TOS_ACK_MISSING'));

  const deniedRules = attemptMindcraftRoomEntry();
  assert.equal(deniedRules.allowed, false);
  assert.equal(deniedRules.gate, 'RULES_ACK_REQUIRED');
  assert.ok(deniedRules.denial);
  assert.equal(deniedRules.denial!.liveIncident, false);

  acknowledgeMindcraftAdultsEntry({
    tosRulesAcknowledged: true,
    waiverAcknowledged: true,
    antiPredatorAcknowledged: true,
    antiBullyAcknowledged: true,
  });

  const lobbyOk = attemptMindcraftRoomEntry({ roomId: 'lobby-agora' });
  assert.equal(lobbyOk.allowed, true);
  assert.equal(lobbyOk.gate, 'FIXTURE_SIMULATION');
  assert.equal(lobbyOk.denial, null);
  assert.equal(lobbyOk.card!.entryAllowed, true);
  assert.equal(lobbyOk.card!.sexualFraming, false);
  assert.equal(lobbyOk.card!.liveMindcraftWorld, false);

  selectMindcraftRoom('culture-gallery');
  const cultureBlocked = attemptMindcraftRoomEntry({ roomId: 'culture-gallery' });
  assert.equal(cultureBlocked.allowed, false);
  assert.ok(cultureBlocked.reasons.includes('NON_SEXUAL_CULTURAL_ACK_REQUIRED'));

  acknowledgeMindcraftAdultsEntry({ nonSexualCulturalAcknowledged: true });
  const cultureOk = attemptMindcraftRoomEntry({ roomId: 'culture-gallery' });
  assert.equal(cultureOk.allowed, true);
  assert.equal(cultureOk.card!.clothingOptionalHeritageEduOnly, true);
  assert.equal(cultureOk.card!.entryLines.length, 5);
  assert.ok(cultureOk.card!.entryLines.some((l) => /heritage\/education/i.test(l)));

  selectMindcraftRoom('health-grove');
  const healthOk = attemptMindcraftRoomEntry({ roomId: 'health-grove' });
  assert.equal(healthOk.allowed, true);
  assert.equal(healthOk.card!.entryLines.length, 5);
  assert.ok(healthOk.card!.entryLines.some((l) => /WAITING_CLINICAL/.test(l)));

  clearMindcraftAdultsEntryFixture();
  bindMindcraftAdultsEntryFixture({
    universeId: 'demo-mindcraft-adults-entry',
    tenantId: 'xiv',
    selectedRoomId: 'health-grove',
    healthEntryLinesPresent: false,
  });
  acknowledgeMindcraftAdultsEntry({
    age18PlusAcknowledged: true,
    tosRulesAcknowledged: true,
    waiverAcknowledged: true,
    antiPredatorAcknowledged: true,
    antiBullyAcknowledged: true,
  });
  const healthFailClosed = attemptMindcraftRoomEntry({ roomId: 'health-grove' });
  assert.equal(healthFailClosed.allowed, false);
  assert.ok(healthFailClosed.reasons.includes('ENTRY_LINES_MISSING'));

  clearMindcraftAdultsEntryFixture();
  bindMindcraftAdultsEntryFixture({
    universeId: 'demo-mindcraft-adults-entry',
    tenantId: 'xiv',
    selectedRoomId: 'culture-gallery',
    cultureEntryLinesPresent: false,
  });
  acknowledgeMindcraftAdultsEntry({
    age18PlusAcknowledged: true,
    tosRulesAcknowledged: true,
    waiverAcknowledged: true,
    antiPredatorAcknowledged: true,
    antiBullyAcknowledged: true,
    nonSexualCulturalAcknowledged: true,
  });
  const cultureFailClosed = attemptMindcraftRoomEntry({ roomId: 'culture-gallery' });
  assert.equal(cultureFailClosed.allowed, false);
  assert.ok(cultureFailClosed.reasons.includes('ENTRY_LINES_MISSING'));

  clearMindcraftAdultsEntryFixture();
  bindMindcraftAdultsEntryFixture({
    universeId: 'demo-mindcraft-adults-entry',
    tenantId: 'xiv',
  });
  acknowledgeMindcraftAdultsEntry({
    age18PlusAcknowledged: true,
    tosRulesAcknowledged: true,
    waiverAcknowledged: true,
    antiPredatorAcknowledged: true,
    antiBullyAcknowledged: true,
    nonSexualCulturalAcknowledged: true,
  });

  const readyLocal = listMindcraftAdultsEntryView({
    tenantId: 'xiv',
    universeId: 'demo-mindcraft-adults-entry',
  });
  assert.equal(readyLocal.mindcraftGate, 'FIXTURE_SIMULATION');
  assert.equal(readyLocal.status, 'WAITING_PROVIDER');
  assert.ok(readyLocal.waitingProviders.includes('LIVE_AGE_VERIFICATION'));
  assert.ok(readyLocal.waitingProviders.includes('LIVE_LEGAL_WAIVER'));
  assert.ok(readyLocal.waitingProviders.includes('LIVE_MINDCRAFT_WORLD'));
  assert.deepEqual(readyLocal.readyProviders, [...DEFAULT_MC_READY_PROVIDERS]);
  assert.equal(readyLocal.productionMutation, false);
  assert.equal(readyLocal.l4Autonomy, false);
  assert.match(readyLocal.note, /FIXTURE_SIMULATION|WAITING_PROVIDER/);

  selectMindcraftRoom('sim-sandbox');
  const switched = listMindcraftAdultsEntryView({
    tenantId: 'xiv',
    universeId: 'demo-mindcraft-adults-entry',
  });
  assert.equal(switched.entryCard!.roomId, 'sim-sandbox');
  assert.equal(switched.entryCard!.theme, 'Meta / Gaming');
  assert.ok(switched.entryCard!.entryLines.some((l) => /metaphor/i.test(l)));

  clearMindcraftPolicyDenialStubs();
  const probed = probeMindcraftPolicyDenialStubs();
  assert.equal(probed.length, 6);
  assert.ok(probed.every((d) => d.liveIncident === false && d.verdict === 'denied'));
  assert.deepEqual(
    probed.map((d) => d.code).sort(),
    [...US_COM_01_DENY_CODES].sort(),
  );

  const withDenials = listMindcraftAdultsEntryView({
    tenantId: 'xiv',
    universeId: 'demo-mindcraft-adults-entry',
  });
  assert.ok(withDenials.policyDenials);
  assert.equal(withDenials.policyDenials!.length, 6);

  const deniedView = listMindcraftAdultsEntryView({
    tenantId: 'xiv',
    universeId: 'demo-mindcraft-adults-entry',
    forceDenied: true,
  });
  assert.equal(deniedView.status, 'GATE_DENIED');
  assert.equal(deniedView.mindcraftGate, 'GATE_DENIED');
  assert.equal(deniedView.entryCard, null);
  assert.equal(deniedView.rooms, null);
  assert.match(deniedView.note, /GATE_DENIED/);

  const mismatch = listMindcraftAdultsEntryView({ tenantId: 'other-tenant' });
  assert.equal(mismatch.status, 'WAITING_DATA');
  assert.equal(mismatch.rooms, null);
  assert.equal(mismatch.entryCard, null);
  assert.match(mismatch.note, /WAITING_DATA|mismatch|tenant/i);

  assert.ok(BUILTIN_MINDCRAFT_ADULTS_ENTRY_FIXTURE.banners.some((b) => /non-sexual|NON-SEXUAL/i.test(b)));
  assert.ok(
    BUILTIN_MINDCRAFT_ADULTS_ENTRY_FIXTURE.banners.some((b) => /PREDATOR_GROOMING_DENIED/.test(b)),
  );

  clearMindcraftAdultsEntryFixture();
  assert.equal(isMindcraftAdultsEntryFixtureBound(), false);
  const again = listMindcraftAdultsEntryView();
  assert.equal(again.status, 'WAITING_DATA');
  assert.equal(again.rooms, null);
  assert.equal(again.entryCard, null);
  assert.equal(again.productionMutation, false);
  assert.equal(again.l4Autonomy, false);
  assert.equal(again.liveLegalWaiver, false);
  assert.equal(again.liveAgeVerification, false);
  assert.equal(again.liveMindcraftWorld, false);

  resetMindcraftAdultsEntrySession();

  console.log(
    'ok - US-MC-01 mindcraft adults entry (WAITING_DATA unbound; AGE_GATE_REQUIRED; RULES_ACK_REQUIRED; culture soft re-verify; health/culture entry-lines fail-closed; FIXTURE_SIMULATION + WAITING_PROVIDER; GATE_DENIED; US-COM-01 deny codes; clothing-optional culture-gallery only; sexualFraming=false; liveMindcraftWorld=false; productionMutation=false; L4 false)',
  );
}

main();
