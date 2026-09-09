/**
 * Phase 2I-M Android Everywhere + Pocket Business OS.
 * Deterministic. No network. Does not weaken 2I-L or tenant tests.
 */
import assert from 'node:assert/strict';

import { boundedAutonomyEnabled } from './authority';
import {
  authorizeAndroidSession,
  cachePocketRecord,
  connectivityIsAuthAuthority,
  databaseConnectionBypassesClassification,
  enterpriseVendorStatus,
  guardianRemainsAboveAgents,
  offlineQueueAuthorizesItself,
  pocketCrossOrgDenied,
  pocketPrivateEntersGlobalBrain,
  reconnectOfflineEvent,
  requestPocketLocation,
  secretsWrittenToClientConfig,
  supplierAgentFinalizeBindingAgreement,
  supplierSelfReportVerified,
  tmsEvent,
  unconfiguredEnterpriseVendorRemainsNotConfigured,
  unknownDeviceBecomesTrustedAutomatically,
  wmsScan,
} from './pocket';

function test(name: string, run: () => void) {
  run();
  console.log(`ok - ${name}`);
}

test('unknown device cannot become trusted automatically', () => {
  assert.equal(unknownDeviceBecomesTrustedAutomatically('TRUSTED'), false);
  assert.equal(unknownDeviceBecomesTrustedAutomatically('UNKNOWN'), false);
});

test('revoked device denied', () => {
  const session = authorizeAndroidSession({
    deviceId: 'android-1',
    tenantId: 'tenant-a',
    universeId: 'universe-a',
    trustState: 'REVOKED',
  });
  assert.equal(session.authorized, false);
});

test('offline queue cannot authorize itself', () => {
  assert.equal(offlineQueueAuthorizesItself(), false);
});

test('reconnect requires tenant authorization', () => {
  const denied = reconnectOfflineEvent({
    tenantAuthorized: false,
    deviceVerified: true,
    universeAuthorized: true,
    permissionAuthorized: true,
  });
  assert.equal(denied.allowed, false);
});

test('GPS denied without OS permission', () => {
  const observation = requestPocketLocation({
    osPermissionGranted: false,
    xivScope: true,
    backgroundRequested: false,
    backgroundExplicitlyAllowed: false,
    purpose: 'WAREHOUSE',
  });
  assert.equal(observation.granted, false);
  assert.equal(observation.denial, 'gps_denied_without_os_permission');
});

test('GPS denied without XIV scope', () => {
  const observation = requestPocketLocation({
    osPermissionGranted: true,
    xivScope: false,
    backgroundRequested: false,
    backgroundExplicitlyAllowed: false,
    purpose: 'WAREHOUSE',
  });
  assert.equal(observation.granted, false);
  assert.equal(observation.denial, 'gps_denied_without_xiv_scope');
});

test('background location denied unless explicitly allowed', () => {
  const observation = requestPocketLocation({
    osPermissionGranted: true,
    xivScope: true,
    backgroundRequested: true,
    backgroundExplicitlyAllowed: false,
    purpose: 'DELIVERY',
  });
  assert.equal(observation.granted, false);
  assert.equal(observation.denial, 'background_location_denied_unless_explicitly_allowed');
});

test('Pocket Brain cannot cache CLOUD_ONLY data', () => {
  const denied = cachePocketRecord({
    recordId: 'macro-1',
    classification: 'CLOUD_ONLY',
    policy: 'CLOUD_ONLY',
  });
  assert.equal('allowed' in denied && denied.allowed === false, true);
});

test('tenant-private Pocket Brain data cannot enter Global Brain', () => {
  const cached = cachePocketRecord({
    recordId: 'task-1',
    classification: 'TENANT_PRIVATE',
    policy: 'OFFLINE_ENCRYPTED',
  });
  assert.equal('allowed' in cached, false);
  if (!('allowed' in cached)) assert.equal(pocketPrivateEntersGlobalBrain(cached), false);
});

test('WMS scan cannot invent inventory', () => {
  const invented = wmsScan({ workflow: 'RECEIVE', inventInventory: true });
  assert.equal(invented.allowed, false);
  const missing = wmsScan({ workflow: 'CYCLE_COUNT' });
  assert.equal(missing.allowed, false);
});

test('TMS cannot invent shipment event', () => {
  const invented = tmsEvent({ inventEvent: true });
  assert.equal(invented.allowed, false);
  const missing = tmsEvent({});
  assert.equal(missing.allowed, false);
});

test('supplier self-report != verified', () => {
  assert.equal(supplierSelfReportVerified(), false);
});

test('supplier agent cannot finalize binding agreement', () => {
  assert.equal(supplierAgentFinalizeBindingAgreement().allowed, false);
});

test('connectivity provider cannot become auth authority', () => {
  assert.equal(connectivityIsAuthAuthority('SATELLITE'), false);
  assert.equal(connectivityIsAuthAuthority('CELLULAR'), false);
});

test('unconfigured enterprise vendor remains NOT_CONFIGURED', () => {
  assert.equal(unconfiguredEnterpriseVendorRemainsNotConfigured(), true);
  assert.equal(enterpriseVendorStatus('cisco'), 'NOT_CONFIGURED');
  assert.equal(enterpriseVendorStatus('ibm'), 'NOT_CONFIGURED');
});

test('database connection cannot bypass classification', () => {
  assert.equal(
    databaseConnectionBypassesClassification({
      kind: 'RELATIONAL',
      classification: 'TENANT_PRIVATE',
      destination: 'global_brain',
    }),
    false,
  );
});

test('secrets never written to client config', () => {
  assert.equal(secretsWrittenToClientConfig(), false);
});

test('L4 disabled', () => {
  assert.equal(boundedAutonomyEnabled(), false);
});

test('cross-org denied', () => {
  assert.equal(pocketCrossOrgDenied(), true);
});

test('Guardian remains above agents', () => {
  assert.equal(guardianRemainsAboveAgents(), true);
});
