/**
 * Phase 2I-O planetary supply chain + Earth data + pipeline foundry + defense mesh.
 * Deterministic. No network. Does not weaken 2I-N or tenant tests.
 */
import assert from 'node:assert/strict';

import { boundedAutonomyEnabled } from './authority';
import { companiesHouseSourceState } from './international';
import { gleifRemainsIdentityOnly } from './market';
import { globalDataFabricProductionLive } from './network-os';
import {
  agentAnomalyBypassesGuardian,
  connectorAgentCreateProductionCredentials,
  createEarthObservation,
  createSupplyChainNervousEvent,
  dataUniverseBypassesTenantIsolation,
  earthObservationIsForecast,
  earthTwinScenarioIsFact,
  highImpactQuarantineRequiresHumanReview,
  pipelineAgentProductionDeploy,
  planetaryAgentSelfGrantTools,
  planetaryAgentSelfPromote,
  planetaryGps,
  privateCompanyUniverseBecomesPublicAutomatically,
  privateLocationEntersGlobalBrain,
  scienceProviderStatus,
  storageLabeledInfinite,
  supplierClaimBecomesVerifiedAutomatically,
  telecomConnectivityIsLocationAuthority,
  warehouseForecast,
  warehouseObservation,
  warehouseObservationEqualsForecast,
  warehouseRecommendation,
  warehouseRecommendationIsFact,
} from './planetary';
import {
  recordSecValidatedRetrieval,
  resetSecAdapterStatusForTests,
  secAdapterCapabilityStatus,
} from './sources';
import {
  recordWorldBankValidatedRetrieval,
  resetWorldBankAdapterStatusForTests,
  worldBankAdapterCapabilityStatus,
} from './sources/world-bank-status';
import { gleifAdapterCapabilityStatus, recordGleifValidatedRetrieval, resetGleifAdapterStatusForTests } from './international/status';

function test(name: string, run: () => void) {
  run();
  console.log(`ok - ${name}`);
}

test('supply-chain event requires evidence', () => {
  const denied = createSupplyChainNervousEvent({
    eventType: 'SHIP',
    entity: 'pallet-1',
    organizationId: 'org-a',
    universeId: 'uni-a',
    evidence: null,
  });
  assert.equal('allowed' in denied && denied.allowed === false, true);
});

test('supplier claim cannot become verified automatically', () => {
  assert.equal(supplierClaimBecomesVerifiedAutomatically(), false);
});

test('warehouse observation != forecast', () => {
  assert.equal(warehouseObservationEqualsForecast(warehouseObservation('bin occupied'), warehouseForecast('bin will fill')), false);
});

test('warehouse recommendation != fact', () => {
  assert.equal(warehouseRecommendationIsFact(warehouseRecommendation('re-slot SKU A')), false);
});

test('GPS denied without permission', () => {
  const gps = planetaryGps({
    osPermissionGranted: false,
    purpose: 'WAREHOUSE',
    grantedPrecision: 'APPROXIMATE',
    requestedPrecision: 'APPROXIMATE',
  });
  assert.equal(gps.granted, false);
  assert.equal(gps.denial, 'gps_denied_without_permission');
});

test('GPS denied without purpose', () => {
  const gps = planetaryGps({
    osPermissionGranted: true,
    grantedPrecision: 'APPROXIMATE',
    requestedPrecision: 'APPROXIMATE',
  });
  assert.equal(gps.granted, false);
  assert.equal(gps.denial, 'gps_denied_without_purpose');
});

test('GPS precision cannot exceed grant', () => {
  const gps = planetaryGps({
    osPermissionGranted: true,
    purpose: 'DELIVERY',
    grantedPrecision: 'APPROXIMATE',
    requestedPrecision: 'PRECISE',
  });
  assert.equal(gps.granted, false);
  assert.equal(gps.denial, 'gps_precision_cannot_exceed_grant');
});

test('private location cannot enter Global Brain', () => {
  assert.equal(privateLocationEntersGlobalBrain(), false);
});

test('telecom connectivity != location authority', () => {
  assert.equal(telecomConnectivityIsLocationAuthority(), false);
});

test('satellite observation requires provenance', () => {
  const denied = createEarthObservation({ provider: 'open_eo', geography: 'Gulf of Mexico' });
  assert.equal('allowed' in denied && denied.allowed === false, true);
});

test('Earth observation != forecast', () => {
  const observation = createEarthObservation({
    provider: 'open_eo',
    dataset: 'demo-port',
    license: 'public_unproven',
    retrievedAt: '2026-09-07T00:00:00.000Z',
    geography: 'Houston',
  });
  assert.equal('allowed' in observation, false);
  if (!('allowed' in observation)) assert.equal(earthObservationIsForecast(observation), false);
});

test('Earth Twin scenario != fact', () => {
  assert.equal(earthTwinScenarioIsFact(), false);
});

test('NASA provider remains NOT_CONFIGURED without proof', () => {
  assert.equal(scienceProviderStatus('nasa'), 'NOT_CONFIGURED');
});

test('Starlink remains NOT_CONFIGURED without proof', () => {
  assert.equal(scienceProviderStatus('starlink'), 'NOT_CONFIGURED');
});

test('AT&T remains NOT_CONFIGURED without proof', () => {
  assert.equal(scienceProviderStatus('att'), 'NOT_CONFIGURED');
});

test('Verizon remains NOT_CONFIGURED without proof', () => {
  assert.equal(scienceProviderStatus('verizon'), 'NOT_CONFIGURED');
});

test('Cisco remains NOT_CONFIGURED without proof', () => {
  assert.equal(scienceProviderStatus('cisco'), 'NOT_CONFIGURED');
});

test('pipeline agent cannot production-deploy pipeline', () => {
  assert.equal(pipelineAgentProductionDeploy('VALIDATING').allowed, false);
});

test('connector agent cannot create production credentials', () => {
  assert.equal(connectorAgentCreateProductionCredentials().allowed, false);
});

test('data Universe cannot bypass tenant isolation', () => {
  assert.equal(dataUniverseBypassesTenantIsolation('SUPPLY_CHAIN', 'tenant-a', 'tenant-b'), false);
});

test('PRIVATE company Universe cannot become public automatically', () => {
  assert.equal(privateCompanyUniverseBecomesPublicAutomatically(), false);
});

test('storage is not labeled infinite', () => {
  assert.equal(storageLabeledInfinite(), false);
});

test('agent cannot self-promote', () => {
  assert.equal(planetaryAgentSelfPromote(), false);
});

test('agent cannot self-grant tools', () => {
  assert.equal(planetaryAgentSelfGrantTools(), false);
});

test('agent anomaly cannot bypass Guardian', () => {
  assert.equal(agentAnomalyBypassesGuardian('SUSPICIOUS'), false);
});

test('high-impact quarantine requires governed policy/human review', () => {
  assert.equal(highImpactQuarantineRequiresHumanReview(), true);
});

test('L4 disabled', () => {
  assert.equal(boundedAutonomyEnabled(), false);
});

test('GDF production-live=false', () => {
  assert.equal(globalDataFabricProductionLive(), false);
});

test('World Bank remains proven', () => {
  resetWorldBankAdapterStatusForTests();
  recordWorldBankValidatedRetrieval();
  assert.equal(worldBankAdapterCapabilityStatus(), 'LIVE');
  resetWorldBankAdapterStatusForTests();
});

test('SEC remains proven', () => {
  resetSecAdapterStatusForTests();
  recordSecValidatedRetrieval();
  assert.equal(secAdapterCapabilityStatus(), 'LIVE');
  resetSecAdapterStatusForTests();
});

test('GLEIF remains proven', () => {
  resetGleifAdapterStatusForTests();
  recordGleifValidatedRetrieval();
  assert.equal(gleifAdapterCapabilityStatus(), 'LIVE');
  resetGleifAdapterStatusForTests();
});

test('GLEIF identity-only', () => {
  assert.equal(gleifRemainsIdentityOnly(), true);
});

test('Companies House remains NOT_CONFIGURED', () => {
  assert.equal(companiesHouseSourceState(), 'NOT_CONFIGURED');
});
