/**
 * US-COM-01 Community age-gate + rules acknowledgment -- honesty contract.
 * Run: npx tsx community-age-gate.test.ts
 */

import assert from 'node:assert/strict';

import {
  BUILTIN_COMMUNITY_AGE_GATE_FIXTURE,
  BUILTIN_GATED_COMMUNITIES,
  COMMUNITY_AGE_GATE_POLICY,
  DEFAULT_COM_READY_PROVIDERS,
  DEFAULT_COM_WAITING_PROVIDERS,
  acknowledgeCommunityAgeGate,
  attemptGatedCommunityEntry,
  bindCommunityAgeGateFixture,
  clearCommunityAgeGateFixture,
  clearCommunityPolicyDenialStubs,
  communityAgeGateAllowsL4,
  communityAgeGateAllowsLiveAgeVerification,
  communityAgeGateAllowsLiveLegalWaiver,
  communityAgeGateAllowsProductionMutation,
  communityAgeGateAllowsSexualFraming,
  communityAgeGateIsReadOnly,
  isCommunityAgeGateFixtureBound,
  listCommunityAgeGateView,
  probeCommunityPolicyDenialStubs,
  resetCommunityAgeGateSession,
  selectGatedCommunity,
} from './community-age-gate';

function main() {
  assert.equal(COMMUNITY_AGE_GATE_POLICY.l4Autonomy, false);
  assert.equal(COMMUNITY_AGE_GATE_POLICY.productionMutation, false);
  assert.equal(COMMUNITY_AGE_GATE_POLICY.layerKind, 'SIMULATION');
  assert.equal(COMMUNITY_AGE_GATE_POLICY.liveLegalWaiver, false);
  assert.equal(COMMUNITY_AGE_GATE_POLICY.liveAgeVerification, false);
  assert.equal(COMMUNITY_AGE_GATE_POLICY.sexualCommunityFramingAllowed, false);
  assert.equal(COMMUNITY_AGE_GATE_POLICY.antiPredatorPolicyRequired, true);
  assert.equal(COMMUNITY_AGE_GATE_POLICY.antiBullyPolicyRequired, true);
  assert.equal(COMMUNITY_AGE_GATE_POLICY.ageGateMinimumYears, 18);
  assert.equal(communityAgeGateAllowsL4(), false);
  assert.equal(communityAgeGateAllowsProductionMutation(), false);
  assert.equal(communityAgeGateIsReadOnly(), true);
  assert.equal(communityAgeGateAllowsLiveLegalWaiver(), false);
  assert.equal(communityAgeGateAllowsLiveAgeVerification(), false);
  assert.equal(communityAgeGateAllowsSexualFraming(), false);

  resetCommunityAgeGateSession();
  assert.equal(isCommunityAgeGateFixtureBound(), false);

  const unbound = listCommunityAgeGateView();
  assert.equal(unbound.status, 'WAITING_DATA');
  assert.equal(unbound.communityAgeGate, 'WAITING_DATA');
  assert.equal(unbound.role, 'consumer_business');
  assert.equal(unbound.readOnly, true);
  assert.equal(unbound.l4Autonomy, false);
  assert.equal(unbound.productionMutation, false);
  assert.equal(unbound.layerKind, 'SIMULATION');
  assert.equal(unbound.communities, null);
  assert.equal(unbound.ageGateCard, null);
  assert.equal(unbound.ack, null);
  assert.equal(unbound.policyDenials, null);
  assert.equal(unbound.liveLegalWaiver, false);
  assert.equal(unbound.liveAgeVerification, false);
  assert.equal(unbound.sexualCommunityFramingAllowed, false);
  assert.deepEqual(unbound.waitingProviders, [...DEFAULT_COM_WAITING_PROVIDERS]);
  assert.ok(unbound.readyProviders.includes('LOCAL_RULES'));
  assert.match(unbound.note, /WAITING_DATA/);

  assert.throws(
    () => bindCommunityAgeGateFixture({ universeId: '  ', tenantId: 'xiv' }),
    /universe_required/,
  );
  assert.throws(
    () => bindCommunityAgeGateFixture({ universeId: 'demo-community-age-gate', tenantId: '  ' }),
    /tenant_required/,
  );

  for (const community of BUILTIN_GATED_COMMUNITIES) {
    assert.equal(community.ageGated, true);
    assert.equal(community.sexualFraming, false);
    assert.equal(community.requiresAge18Plus, true);
    assert.equal(community.requiresWaiverAck, true);
    assert.equal(community.requiresAntiPredatorAck, true);
    assert.equal(community.requiresAntiBullyAck, true);
    assert.match(community.description, /Non-sexual|non-sexual|Professional|civic|cultural/i);
  }

  const bound = bindCommunityAgeGateFixture({
    universeId: 'demo-community-age-gate',
    tenantId: 'xiv',
  });
  assert.equal(bound.universeId, 'demo-community-age-gate');
  assert.equal(bound.tenantId, 'xiv');
  assert.equal(isCommunityAgeGateFixtureBound(), true);
  assert.equal(bound.ack.liveLegal, false);
  assert.equal(bound.ack.liveAgeVerification, false);
  assert.equal(bound.ack.age18PlusAcknowledged, false);

  const needsAge = listCommunityAgeGateView({
    tenantId: 'xiv',
    universeId: 'demo-community-age-gate',
  });
  assert.equal(needsAge.communityAgeGate, 'AGE_GATE_REQUIRED');
  assert.equal(needsAge.status, 'AGE_GATE_REQUIRED');
  assert.ok(needsAge.communities);
  assert.equal(needsAge.communities!.length, BUILTIN_GATED_COMMUNITIES.length);
  assert.ok(needsAge.ageGateCard);
  assert.equal(needsAge.ageGateCard!.entryAllowed, false);
  assert.ok(needsAge.ageGateCard!.blockingReasons.includes('AGE_18_PLUS_ACK_REQUIRED'));
  assert.equal(needsAge.ageGateCard!.sexualFraming, false);
  assert.equal(needsAge.liveLegalWaiver, false);
  assert.equal(needsAge.liveAgeVerification, false);
  assert.match(needsAge.note, /AGE_GATE_REQUIRED/);

  const deniedEntry = attemptGatedCommunityEntry();
  assert.equal(deniedEntry.allowed, false);
  assert.equal(deniedEntry.gate, 'AGE_GATE_REQUIRED');
  assert.ok(deniedEntry.denial);
  assert.equal(deniedEntry.denial!.kind, 'AGE_GATE');
  assert.equal(deniedEntry.denial!.liveIncident, false);

  acknowledgeCommunityAgeGate({ age18PlusAcknowledged: true });
  const needsRules = listCommunityAgeGateView({
    tenantId: 'xiv',
    universeId: 'demo-community-age-gate',
  });
  assert.equal(needsRules.communityAgeGate, 'RULES_ACK_REQUIRED');
  assert.equal(needsRules.status, 'RULES_ACK_REQUIRED');
  assert.equal(needsRules.ack!.age18PlusAcknowledged, true);
  assert.equal(needsRules.ack!.liveLegal, false);
  assert.ok(needsRules.ageGateCard!.blockingReasons.includes('WAIVER_CONTRACT_ACK_REQUIRED'));

  const deniedRules = attemptGatedCommunityEntry();
  assert.equal(deniedRules.allowed, false);
  assert.equal(deniedRules.gate, 'RULES_ACK_REQUIRED');
  assert.ok(deniedRules.denial);
  assert.equal(deniedRules.denial!.liveIncident, false);

  acknowledgeCommunityAgeGate({
    waiverContractAcknowledged: true,
    antiPredatorAcknowledged: true,
    antiBullyAcknowledged: true,
  });

  const allowed = attemptGatedCommunityEntry({
    communityId: 'com-cultural-heritage',
  });
  assert.equal(allowed.allowed, true);
  assert.equal(allowed.gate, 'FIXTURE_SIMULATION');
  assert.equal(allowed.denial, null);
  assert.equal(allowed.card.entryAllowed, true);
  assert.equal(allowed.card.sexualFraming, false);
  assert.equal(allowed.card.liveLegalWaiver, false);
  assert.equal(allowed.card.liveAgeVerification, false);
  assert.match(allowed.note, /WAITING_PROVIDER|liveAgeVerification=false/);

  const readyLocal = listCommunityAgeGateView({
    tenantId: 'xiv',
    universeId: 'demo-community-age-gate',
  });
  assert.equal(readyLocal.communityAgeGate, 'FIXTURE_SIMULATION');
  assert.equal(readyLocal.status, 'WAITING_PROVIDER');
  assert.ok(readyLocal.waitingProviders.includes('LIVE_AGE_VERIFICATION'));
  assert.ok(readyLocal.waitingProviders.includes('LIVE_LEGAL_WAIVER'));
  assert.deepEqual(readyLocal.readyProviders, [...DEFAULT_COM_READY_PROVIDERS]);
  assert.equal(readyLocal.ageGateCard!.entryAllowed, true);
  assert.equal(readyLocal.productionMutation, false);
  assert.equal(readyLocal.l4Autonomy, false);
  assert.match(readyLocal.note, /FIXTURE_SIMULATION|WAITING_PROVIDER/);

  selectGatedCommunity('com-civic-makers');
  const switched = listCommunityAgeGateView({
    tenantId: 'xiv',
    universeId: 'demo-community-age-gate',
  });
  assert.equal(switched.ageGateCard!.communityId, 'com-civic-makers');
  assert.equal(switched.ageGateCard!.framing, 'LOCAL_CIVIC');

  clearCommunityPolicyDenialStubs();
  const probed = probeCommunityPolicyDenialStubs();
  assert.equal(probed.length, 4);
  assert.ok(probed.some((d) => d.kind === 'ANTI_PREDATOR'));
  assert.ok(probed.some((d) => d.kind === 'ANTI_BULLY'));
  assert.ok(probed.every((d) => d.liveIncident === false && d.verdict === 'denied'));

  const withDenials = listCommunityAgeGateView({
    tenantId: 'xiv',
    universeId: 'demo-community-age-gate',
  });
  assert.ok(withDenials.policyDenials);
  assert.equal(withDenials.policyDenials!.length, 4);

  const deniedView = listCommunityAgeGateView({
    tenantId: 'xiv',
    universeId: 'demo-community-age-gate',
    forceDenied: true,
  });
  assert.equal(deniedView.status, 'GATE_DENIED');
  assert.equal(deniedView.communityAgeGate, 'GATE_DENIED');
  assert.equal(deniedView.ageGateCard, null);
  assert.equal(deniedView.communities, null);
  assert.match(deniedView.note, /GATE_DENIED/);

  const mismatch = listCommunityAgeGateView({ tenantId: 'other-tenant' });
  assert.equal(mismatch.status, 'WAITING_DATA');
  assert.equal(mismatch.communities, null);
  assert.equal(mismatch.ageGateCard, null);
  assert.match(mismatch.note, /WAITING_DATA|mismatch|tenant/i);

  assert.ok(
    BUILTIN_COMMUNITY_AGE_GATE_FIXTURE.banners.some((b) => /non-sexual/i.test(b)),
  );

  clearCommunityAgeGateFixture();
  assert.equal(isCommunityAgeGateFixtureBound(), false);
  const again = listCommunityAgeGateView();
  assert.equal(again.status, 'WAITING_DATA');
  assert.equal(again.communities, null);
  assert.equal(again.ageGateCard, null);
  assert.equal(again.productionMutation, false);
  assert.equal(again.l4Autonomy, false);
  assert.equal(again.liveLegalWaiver, false);
  assert.equal(again.liveAgeVerification, false);

  resetCommunityAgeGateSession();

  console.log(
    'ok - US-COM-01 community age-gate (WAITING_DATA unbound; AGE_GATE_REQUIRED; RULES_ACK_REQUIRED; FIXTURE_SIMULATION + WAITING_PROVIDER live age/legal; GATE_DENIED; anti-predator/anti-bully denial stubs; non-sexual framing; liveLegalWaiver=false; liveAgeVerification=false; productionMutation=false; L4 false)',
  );
}

main();
