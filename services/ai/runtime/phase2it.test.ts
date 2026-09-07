/**
 * Phase 2I-T Global Operations Brain + mobile distribution + agent infrastructure V3.
 * Deterministic. No network. Does not weaken 2I-S or mix 2I-U mature communities.
 */
import assert from 'node:assert/strict';

import { boundedAutonomyEnabled } from './authority';
import { xivReplacesHostOperatingSystem } from './ecosystem';
import { companiesHouseSourceState } from './international';
import { gleifAdapterCapabilityStatus, recordGleifValidatedRetrieval, resetGleifAdapterStatusForTests } from './international/status';
import { gleifRemainsIdentityOnly } from './market';
import { globalDataFabricProductionLive } from './network-os';
import { EXPERIENCE_AGENTS } from './network-os/experience';
import {
  adaptivePriorities,
  agentsRunConstantly,
  analyzeAuthorizedMedia,
  appStoreListingIsLive,
  assembleOperationsTaskForce,
  cachePocketAuthorized,
  classifyMobileSurface,
  dataFabricProductionLive,
  deviceSecuritySignalsArePublicProfileData,
  evaluateFeatureFlag,
  experienceAgentsUnchanged,
  extraDatabaseCreatedWithoutReason,
  featureFlagMayChangeSecurityPolicy,
  fleetEnablesPersonalSurveillance,
  googlePlayListingIsLive,
  installSoftwarePack,
  ipAddressIsPublicProfileData,
  mediaInferenceBecomesIdentityProfile,
  phoneContainsEntireXiv,
  pocketBypassesServerAuthorization,
  regionalServicesAreProductionLive,
  residencyIsPolicyDriven,
  routeToNearestRegion,
  snapshotDeviceFleet,
  softwarePackShippedInsideMobileBinary,
  storeMediaBinaryInPostgres,
  storeReasonRequired,
  taskForceExecutesWithoutHuman,
  trillionsOfObjectsProven,
  uploadMediaObject,
  webPwaIsProductionLive,
  xivHuntsSuspectedCriminals,
  xivReplacesHostMobileOs,
  xivSupportsEveryPhone,
} from './opsbrain';
import { recordSecValidatedRetrieval, resetSecAdapterStatusForTests, secAdapterCapabilityStatus } from './sources/sec-status';
import {
  recordWorldBankValidatedRetrieval,
  resetWorldBankAdapterStatusForTests,
  worldBankAdapterCapabilityStatus,
} from './sources/world-bank-status';

function test(name: string, run: () => void) {
  run();
  console.log(`ok - ${name}`);
}

test('primary nav and experience agents unchanged', () => {
  assert.equal(EXPERIENCE_AGENTS.length, 11);
  assert.equal(experienceAgentsUnchanged(), true);
});

test('XIV does not replace host operating systems', () => {
  assert.equal(xivReplacesHostOperatingSystem('IOS'), false);
  assert.equal(xivReplacesHostOperatingSystem('ANDROID'), false);
  assert.equal(xivReplacesHostMobileOs(), false);
});

test('XIV does not claim every phone', () => {
  assert.equal(xivSupportsEveryPhone(), false);
  assert.equal(appStoreListingIsLive(), false);
  assert.equal(googlePlayListingIsLive(), false);
  assert.equal(webPwaIsProductionLive(), false);
});

test('phone is a window, not the entire XIV platform', () => {
  assert.equal(phoneContainsEntireXiv(), false);
  assert.equal(trillionsOfObjectsProven(), false);
});

test('adaptive phone vs tablet priorities', () => {
  const phone = classifyMobileSurface({ platform: 'ios', width: 390 });
  const tablet = classifyMobileSurface({ platform: 'android', width: 834 });
  assert.equal(phone, 'IPHONE');
  assert.equal(tablet, 'ANDROID_TABLET');
  assert.equal(adaptivePriorities(phone).includes('alerts'), true);
  assert.equal(adaptivePriorities(tablet).includes('command_centers'), true);
});

test('division agents do not run constantly or grant authority', () => {
  assert.equal(agentsRunConstantly(), false);
  const force = assembleOperationsTaskForce('SUPPLIER_DELAY');
  assert.equal(force.alwaysOn, false);
  assert.equal(force.grantsPermissions, false);
  assert.equal(taskForceExecutesWithoutHuman(force), false);
  assert.equal(force.assembled.includes('Supplier Agent'), true);
});

test('data stores require a reason and are not extra databases', () => {
  assert.equal(storeReasonRequired('OBJECT_STORAGE'), true);
  assert.equal(extraDatabaseCreatedWithoutReason(), false);
  assert.equal(dataFabricProductionLive(), false);
});

test('media binaries are not stored in Postgres', () => {
  assert.equal(storeMediaBinaryInPostgres(), false);
  const denied = uploadMediaObject({
    tenantId: 'tenant-a',
    universeId: 'ops',
    classified: true,
    rightsChecked: true,
    storeBinaryInPostgres: true,
  });
  assert.equal(denied.allowed, false);
});

test('media intelligence does not become a user identity profile', () => {
  const result = analyzeAuthorizedMedia({ authorized: true, sensitiveInterest: true });
  assert.equal('allowed' in result, false);
  if (!('allowed' in result)) {
    assert.equal(result.becomesUserIdentityProfile, false);
    assert.equal(mediaInferenceBecomesIdentityProfile(), false);
  }
});

test('XIV does not hunt suspected criminals; device signals stay private', () => {
  assert.equal(xivHuntsSuspectedCriminals(), false);
  assert.equal(deviceSecuritySignalsArePublicProfileData(), false);
  assert.equal(ipAddressIsPublicProfileData(), false);
});

test('residency is policy-driven and regions are not production-live', () => {
  assert.equal(residencyIsPolicyDriven(), true);
  assert.equal(regionalServicesAreProductionLive(), false);
  const denied = routeToNearestRegion({
    requested: 'EUROPE',
    policy: { tenantId: 'tenant-a', requiredRegion: 'NORTH_AMERICA' },
  });
  assert.equal(denied.allowed, false);
});

test('Pocket Brain cannot cache CLOUD_ONLY or bypass server authorization', () => {
  const denied = cachePocketAuthorized({
    kind: 'approved_documents',
    classification: 'CLOUD_ONLY',
    policy: 'CLOUD_ONLY',
  });
  assert.equal('allowed' in denied && denied.allowed === false, true);
  assert.equal(pocketBypassesServerAuthorization(), false);
});

test('feature flags cannot casually change high-risk security', () => {
  const denied = evaluateFeatureFlag({
    flag: 'disable-guardian',
    rolloutPercentage: 100,
    killSwitch: false,
    highRiskSecurity: true,
  });
  assert.equal(denied.allowed, false);
  assert.equal(featureFlagMayChangeSecurityPolicy(), false);
});

test('device fleet is not personal-device surveillance', () => {
  const snapshot = snapshotDeviceFleet(
    [
      { deviceId: 'd1', orgId: 'org-a', state: 'TRUSTED', personalSurveillance: false },
      { deviceId: 'd2', orgId: 'org-a', state: 'NEEDS_UPDATE', personalSurveillance: false },
      { deviceId: 'd3', orgId: 'org-b', state: 'AT_RISK', personalSurveillance: false },
    ],
    'org-a',
  );
  assert.equal(snapshot.managed, 2);
  assert.equal(snapshot.trusted, 1);
  assert.equal(snapshot.needUpdates, 1);
  assert.equal(snapshot.personalDeviceSurveillance, false);
  assert.equal(fleetEnablesPersonalSurveillance(), false);
});

test('software pack install does not grant automatic data access', () => {
  assert.equal(softwarePackShippedInsideMobileBinary('WarehousePack'), false);
  const installed = installSoftwarePack({
    kind: 'WarehousePack',
    signed: true,
    scanned: true,
    requestedPermissions: ['inventory.read'],
    companyApproved: true,
    universeBound: true,
  });
  assert.equal('allowed' in installed && installed.allowed === false, false);
  if (!('allowed' in installed && installed.allowed === false)) {
    assert.equal(installed.automaticDataAccess, false);
  }
});

test('L4 remains disabled', () => {
  assert.equal(boundedAutonomyEnabled(), false);
});

test('GDF production-live=false', () => {
  assert.equal(globalDataFabricProductionLive(), false);
});

test('World Bank proven', () => {
  resetWorldBankAdapterStatusForTests();
  recordWorldBankValidatedRetrieval();
  assert.equal(worldBankAdapterCapabilityStatus(), 'LIVE');
  resetWorldBankAdapterStatusForTests();
});

test('SEC proven', () => {
  resetSecAdapterStatusForTests();
  recordSecValidatedRetrieval();
  assert.equal(secAdapterCapabilityStatus(), 'LIVE');
  resetSecAdapterStatusForTests();
});

test('GLEIF proven', () => {
  resetGleifAdapterStatusForTests();
  recordGleifValidatedRetrieval();
  assert.equal(gleifAdapterCapabilityStatus(), 'LIVE');
  assert.equal(gleifRemainsIdentityOnly(), true);
  resetGleifAdapterStatusForTests();
});

test('Companies House NOT_CONFIGURED', () => {
  assert.equal(companiesHouseSourceState(), 'NOT_CONFIGURED');
});
