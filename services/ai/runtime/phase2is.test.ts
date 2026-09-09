/**
 * Phase 2I-S platform runtime, developer SDK, plugin marketplace, OEM/hardware foundations.
 * Deterministic. No network. Does not weaken 2I-R or tenant tests.
 */
import assert from 'node:assert/strict';

import { boundedAutonomyEnabled } from './authority';
import { xivReplacesHostOperatingSystem } from './ecosystem';
import { companiesHouseSourceState } from './international';
import { gleifAdapterCapabilityStatus, recordGleifValidatedRetrieval, resetGleifAdapterStatusForTests } from './international/status';
import { gleifRemainsIdentityOnly } from './market';
import { globalDataFabricProductionLive } from './network-os';
import {
  alwaysOnMicrophoneEnabled,
  authorizeBoundDeviceRequest,
  bindDeviceToUniverses,
  claimHardwareAttestation,
  createDeveloperSandbox,
  createEnterprisePolicyPack,
  createIndustryPack,
  createLicense,
  createMarketplaceListing,
  createMarketplaceReview,
  createOemPartner,
  createPlatformRuntime,
  createPrivateCatalog,
  enqueueOfflineV2,
  evaluateLicensedAction,
  evaluatePluginAgainstPolicy,
  evaluatePluginInstall,
  evaluateRuntimeRequest,
  followerCountAffectsSecurityAuthority,
  hardwareAttestationClaimedWithoutEvidence,
  hardwareProductionLive,
  hardwareSecureBootIsLive,
  installGovernedIndustryPack,
  invokeExtensionApi,
  invokeLocalAi,
  invokeSdk,
  licenseOverridesAuthorization,
  localAiBypassesGuardian,
  marketplaceListingGrantsInstalledAccess,
  marketplaceReviewCreatesVerification,
  nativeDesktopBinaryExists,
  oemLicensingIsLive,
  oemProfileGrantsRuntimePrivilege,
  offlineActionBecomesServerAuthority,
  pluginAccessesFounderRestrictedData,
  pluginCannotSelfPromote,
  pluginDisablesAudit,
  pluginMayPromoteLifecycle,
  pluginMintsProductionCredential,
  pluginModifiesGuardian,
  pluginModifiesTenantIsolation,
  pluginReadsUnrelatedUniverse,
  pluginRequiresManifest,
  pluginSandboxAllows,
  readPrivateCatalog,
  readSandboxData,
  reconcileOfflineV2,
  referenceProfileIsManufacturedDevice,
  resolveHardwareCapability,
  runtimeCannotBypassGuardian,
  sandboxAccessesProductionData,
  sdkStoresRawProductionSecret,
  secureElementIntegrationIsLive,
  treatUnknownHealthAsHealthy,
  unavailableHardwareCapabilityRemainsUnavailable,
  validPluginManifest,
  xivLaptopExists,
  xivOwnsOperatingSystemKernel,
  xivPhoneExists,
} from './platform';
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

const signedPackage = {
  manifest: validPluginManifest(),
  signed: true,
  signatureValid: true,
  integrityIntact: true,
  securityScanPassed: true,
  dependenciesReviewed: true,
};

test('plugin requires manifest', () => {
  const denied = evaluatePluginInstall({
    package: { ...signedPackage, manifest: undefined },
    organizationApproved: true,
    universeId: 'ops',
    tenantId: 'tenant-a',
  });
  assert.equal(denied.allowed, false);
  assert.equal(pluginRequiresManifest({ ...signedPackage, manifest: undefined }), false);
});

test('unsigned plugin denied', () => {
  const denied = evaluatePluginInstall({
    package: { ...signedPackage, signed: false, signatureValid: false },
    organizationApproved: true,
    universeId: 'ops',
    tenantId: 'tenant-a',
  });
  assert.equal(denied.allowed, false);
  if (!denied.allowed) assert.equal(denied.reason, 'unsigned_plugin_denied');
});

test('tampered package denied', () => {
  const denied = evaluatePluginInstall({
    package: { ...signedPackage, tampered: true, integrityIntact: false },
    organizationApproved: true,
    universeId: 'ops',
    tenantId: 'tenant-a',
  });
  assert.equal(denied.allowed, false);
  if (!denied.allowed) assert.equal(denied.reason, 'tampered_package_denied');
});

test('plugin wildcard permission denied', () => {
  const denied = evaluatePluginInstall({
    package: { ...signedPackage, manifest: validPluginManifest({ requestedCapabilities: ['*'] }) },
    organizationApproved: true,
    universeId: 'ops',
    tenantId: 'tenant-a',
  });
  assert.equal(denied.allowed, false);
  if (!denied.allowed) assert.equal(denied.reason, 'plugin_wildcard_permission_denied');
});

test('plugin cannot request all tenant data', () => {
  const denied = evaluatePluginInstall({
    package: { ...signedPackage, manifest: validPluginManifest({ requestedDataScopes: ['all_tenant_data'] }) },
    organizationApproved: true,
    universeId: 'ops',
    tenantId: 'tenant-a',
  });
  assert.equal(denied.allowed, false);
});

test('plugin cannot modify Guardian', () => {
  assert.equal(pluginModifiesGuardian(), false);
  assert.equal(pluginSandboxAllows('modify_guardian'), false);
  assert.equal(runtimeCannotBypassGuardian(), true);
});

test('plugin cannot modify tenant isolation', () => {
  assert.equal(pluginModifiesTenantIsolation(), false);
  assert.equal(pluginSandboxAllows('modify_tenant_policy'), false);
});

test('plugin cannot mint production credential', () => {
  assert.equal(pluginMintsProductionCredential(), false);
  assert.equal(pluginSandboxAllows('mint_production_credentials'), false);
  assert.equal(sdkStoresRawProductionSecret(), false);
});

test('plugin cannot disable audit', () => {
  assert.equal(pluginDisablesAudit(), false);
  assert.equal(pluginSandboxAllows('disable_audit'), false);
});

test('plugin cannot promote itself', () => {
  assert.equal(pluginCannotSelfPromote(), true);
  const denied = pluginMayPromoteLifecycle('DRAFT', 'SUBMITTED', 'plugin');
  assert.equal(denied.allowed, false);
});

test('plugin cannot access founder-restricted data', () => {
  assert.equal(pluginAccessesFounderRestrictedData(), false);
  assert.equal(pluginSandboxAllows('read_founder_restricted_data'), false);
  const api = invokeExtensionApi({
    api: 'DataAPI',
    tenantId: 'tenant-a',
    universeId: 'ops',
    classification: 'FOUNDER_RESTRICTED',
    purpose: 'ops',
    capability: 'data.read',
  });
  assert.equal(api.allowed, false);
});

test('plugin cannot read unrelated Universe', () => {
  const installed = evaluatePluginInstall({
    package: signedPackage,
    organizationApproved: true,
    universeId: 'ops',
    tenantId: 'tenant-a',
  });
  assert.equal(installed.allowed, true);
  if (installed.allowed) {
    assert.equal(pluginReadsUnrelatedUniverse(installed.installation, 'finance'), false);
    assert.equal(pluginReadsUnrelatedUniverse(installed.installation, 'ops'), true);
  }
});

test('marketplace listing != installed access', () => {
  const listing = createMarketplaceListing({ listingId: 'l1', pluginId: 'warehouse.scan', category: 'WAREHOUSE' });
  assert.equal(marketplaceListingGrantsInstalledAccess(listing), false);
  assert.equal(listing.installedAccess, false);
});

test('marketplace review cannot create verification', () => {
  const review = createMarketplaceReview({});
  assert.equal('allowed' in review, false);
  if (!('allowed' in review)) assert.equal(marketplaceReviewCreatesVerification(review), false);
});

test('private catalog cannot leak cross-tenant', () => {
  const catalog = createPrivateCatalog('tenant-a');
  const leaked = readPrivateCatalog(catalog, 'tenant-b');
  assert.equal(leaked.allowed, false);
});

test('developer sandbox cannot access production data', () => {
  const sandbox = createDeveloperSandbox('sandbox-tenant');
  assert.equal(sandboxAccessesProductionData(sandbox), false);
  const denied = readSandboxData({ sandbox, dataClass: 'production_customer' });
  assert.equal(denied.allowed, false);
});

test('SDK call requires tenant/Universe context', () => {
  const denied = invokeSdk({ capability: 'data.read' });
  assert.equal(denied.allowed, false);
  const allowed = invokeSdk({ tenantId: 'tenant-a', universeId: 'ops', capability: 'data.read' });
  assert.equal(allowed.allowed, true);
});

test('API call requires capability', () => {
  const denied = invokeExtensionApi({
    api: 'DataAPI',
    tenantId: 'tenant-a',
    universeId: 'ops',
    classification: 'TENANT_PRIVATE',
    purpose: 'ops',
  });
  assert.equal(denied.allowed, false);
  if (!denied.allowed) assert.equal(denied.reason, 'api_requires_capability');
});

test('API call honors classification', () => {
  const denied = invokeExtensionApi({
    api: 'DataAPI',
    tenantId: 'tenant-a',
    universeId: 'ops',
    classification: 'TENANT_PRIVATE',
    purpose: 'ops',
    capability: 'data.read',
    destination: 'global_brain',
  });
  assert.equal(denied.allowed, false);
});

test('API call honors purpose', () => {
  const denied = invokeExtensionApi({
    api: 'DataAPI',
    tenantId: 'tenant-a',
    universeId: 'ops',
    classification: 'TENANT_PRIVATE',
    capability: 'data.read',
  });
  assert.equal(denied.allowed, false);
  if (!denied.allowed) assert.equal(denied.reason, 'api_requires_purpose');
});

test('industry pack installation does not grant automatic data access', () => {
  const pack = createIndustryPack('WarehousePack');
  assert.equal(pack.automaticDataAccess, false);
  const installed = installGovernedIndustryPack({
    packId: 'WAREHOUSE',
    signed: true,
    scanned: true,
    requestedPermissions: ['inventory.read'],
    companyApproved: true,
    universeBound: true,
  });
  assert.equal('allowed' in installed, false);
  if (!('allowed' in installed)) assert.equal(installed.automaticDataAccess, false);
});

test('OEM profile does not grant runtime privilege', () => {
  assert.equal(oemProfileGrantsRuntimePrivilege(createOemPartner('oem-1')), false);
  assert.equal(oemLicensingIsLive(), false);
});

test('reference hardware != manufactured hardware', () => {
  assert.equal(referenceProfileIsManufacturedDevice('XIV_MOBILE_REFERENCE'), false);
  assert.equal(xivLaptopExists(), false);
  assert.equal(xivPhoneExists(), false);
  assert.equal(xivOwnsOperatingSystemKernel(), false);
  assert.equal(hardwareProductionLive(), false);
});

test('unavailable hardware capability remains unavailable', () => {
  const capability = resolveHardwareCapability({ capability: 'SECURE_ELEMENT', hostProvides: false });
  assert.equal(unavailableHardwareCapabilityRemainsUnavailable(capability), true);
  assert.equal(capability.available, false);
  assert.equal(hardwareSecureBootIsLive(), false);
  assert.equal(secureElementIntegrationIsLive(), false);
});

test('hardware attestation cannot be claimed without evidence', () => {
  const attestation = claimHardwareAttestation({ hostAttestationEvidence: false });
  assert.equal(attestation.claimed, false);
  assert.equal(hardwareAttestationClaimedWithoutEvidence(attestation), false);
});

test('local AI cannot access uncached private data', () => {
  const denied = invokeLocalAi({ cachedAndAuthorized: false, guardianAuthorized: true, classification: 'TENANT_PRIVATE' });
  assert.equal(denied.allowed, false);
});

test('local AI cannot bypass Guardian', () => {
  assert.equal(localAiBypassesGuardian(), false);
  const denied = invokeLocalAi({ cachedAndAuthorized: true, guardianAuthorized: false });
  assert.equal(denied.allowed, false);
});

test('offline action cannot become server authority', () => {
  assert.equal(offlineActionBecomesServerAuthority(), false);
});

test('offline event requires signature', () => {
  const denied = enqueueOfflineV2({ signed: false });
  assert.equal(denied.allowed, false);
  const unsignedReconcile = reconcileOfflineV2({
    signed: false,
    reauthenticated: true,
    guardianPassed: true,
    tenantValid: true,
    universeValid: true,
  });
  assert.equal(unsignedReconcile.allowed, false);
});

test('device binding cannot bypass Universe policy', () => {
  const binding = bindDeviceToUniverses({ deviceId: 'd1', tenantId: 'tenant-a', universeIds: ['ops', 'finance'] });
  const denied = authorizeBoundDeviceRequest({
    binding,
    requestedUniverseId: 'ops',
    universePolicyAllows: false,
  });
  assert.equal(denied.allowed, false);
});

test('revoked device denied', () => {
  const binding = bindDeviceToUniverses({ deviceId: 'd1', tenantId: 'tenant-a', universeIds: ['ops'] });
  const denied = authorizeBoundDeviceRequest({
    binding,
    requestedUniverseId: 'ops',
    revoked: true,
    universePolicyAllows: true,
  });
  assert.equal(denied.allowed, false);
  if (!denied.allowed) assert.equal(denied.reason, 'revoked_device_denied');
});

test('license cannot override authorization', () => {
  assert.equal(licenseOverridesAuthorization(createLicense('platform')), false);
  const denied = evaluateLicensedAction({ licensed: true, authorized: false });
  assert.equal(denied.allowed, false);
});

test('plugin cannot override enterprise policy', () => {
  const pack = createEnterprisePolicyPack('PluginPolicyPack');
  const denied = evaluatePluginAgainstPolicy({ pack, pluginRequestsOverride: true });
  assert.equal(denied.allowed, false);
});

test('UNKNOWN health is not HEALTHY', () => {
  assert.equal(treatUnknownHealthAsHealthy('UNKNOWN'), false);
  assert.equal(treatUnknownHealthAsHealthy('HEALTHY'), true);
  const runtime = createPlatformRuntime({
    environment: 'MOBILE',
    deviceId: 'd1',
    identityId: 'id-1',
    tenantId: 'tenant-a',
    universeId: 'ops',
  });
  assert.equal(runtime.health.treatedAsHealthy, false);
});

test('runtime request cannot bypass Guardian', () => {
  const denied = evaluateRuntimeRequest({
    deviceAuthorized: true,
    identityBound: true,
    sessionValid: true,
    tenantId: 'tenant-a',
    universeId: 'ops',
    classification: 'TENANT_PRIVATE',
    capability: 'data.read',
    agentOrExtension: 'plugin',
    purpose: 'ops',
    authoritySatisfied: true,
    approvalSatisfied: true,
    bypassGuardian: true,
  });
  assert.equal(denied.allowed, false);
});

test('XIV does not replace host operating systems', () => {
  assert.equal(xivReplacesHostOperatingSystem('IOS'), false);
  assert.equal(xivReplacesHostOperatingSystem('ANDROID'), false);
  assert.equal(xivReplacesHostOperatingSystem('WINDOWS'), false);
  assert.equal(xivReplacesHostOperatingSystem('MACOS'), false);
  assert.equal(nativeDesktopBinaryExists(), false);
  assert.equal(alwaysOnMicrophoneEnabled(), false);
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
