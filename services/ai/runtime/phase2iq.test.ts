/**
 * Phase 2I-Q Founder Twin, sovereign security, voice, night shift, universe fabric.
 * Deterministic. No network. Does not weaken 2I-P or tenant tests.
 */
import assert from 'node:assert/strict';

import { boundedAutonomyEnabled } from './authority';
import { globalDataFabricProductionLive } from './network-os';
import {
  alwaysRecordEverythingEnabled,
  companyUniverseRemainsPrivate,
  companyVoiceEntersGlobalBrainAutomatically,
  createMarketingDraft,
  cryptoAlgorithmsAreVersioned,
  cryptoMigrationSupported,
  founderTwinDisablesGuardian,
  founderTwinExposesCustomerPrivateData,
  founderTwinGrantsSelfPermissions,
  founderTwinIsRealFounderAuthority,
  marketingFabricatesEvidence,
  marketingMassSpamsUsers,
  nightShiftChangesSecurityPolicy,
  nightShiftDeploysProductionAgents,
  nightShiftDeploysProductionPipelines,
  nightShiftMayProduceRecommendations,
  openFounderTwin,
  openVoiceSession,
  parallelFounderInstancesExpandPermissions,
  personalUniverseRemainsPrivate,
  personalVoiceEntersCompanyBrainAutomatically,
  quantumSecurityClaimedWithoutProof,
  spawnFounderTwinInstance,
  startNightShift,
  storeVoiceMemory,
  universeBypassesTenantIsolation,
  voiceDisabledByDefault,
} from './sovereign';

function test(name: string, run: () => void) {
  run();
  console.log(`ok - ${name}`);
}

test('Founder Twin != real founder authority', () => {
  assert.equal(founderTwinIsRealFounderAuthority(openFounderTwin()), false);
});

test('Founder Twin cannot grant itself permissions', () => {
  assert.equal(founderTwinGrantsSelfPermissions(), false);
});

test('Founder Twin cannot disable Guardian', () => {
  assert.equal(founderTwinDisablesGuardian(), false);
});

test('Founder Twin cannot expose customer-private data', () => {
  assert.equal(founderTwinExposesCustomerPrivateData(), false);
});

test('parallel Founder instances cannot expand permissions', () => {
  assert.equal(
    parallelFounderInstancesExpandPermissions([spawnFounderTwinInstance('strategy'), spawnFounderTwinInstance('security')]),
    false,
  );
});

test('voice disabled by default', () => {
  assert.equal(voiceDisabledByDefault(), true);
  const denied = openVoiceSession({ microphonePermission: true, recordingVisible: true, purpose: 'ASSISTANT' });
  assert.equal('allowed' in denied && denied.allowed === false, true);
});

test('microphone requires permission', () => {
  const denied = openVoiceSession({
    mode: 'PUSH_TO_TALK',
    microphonePermission: false,
    recordingVisible: true,
    purpose: 'ASSISTANT',
  });
  assert.equal('allowed' in denied && denied.allowed === false, true);
});

test('recording requires visible state', () => {
  const denied = openVoiceSession({
    mode: 'SESSION_ONLY',
    microphonePermission: true,
    recordingVisible: false,
    purpose: 'MEETING',
  });
  assert.equal('allowed' in denied && denied.allowed === false, true);
});

test('voice memory requires explicit policy', () => {
  assert.equal(storeVoiceMemory({ destination: 'PERSONAL', explicit: false }).allowed, false);
});

test('personal voice data cannot enter Company Brain automatically', () => {
  assert.equal(personalVoiceEntersCompanyBrainAutomatically(), false);
});

test('company voice data cannot enter Global Brain automatically', () => {
  assert.equal(companyVoiceEntersGlobalBrainAutomatically(), false);
});

test('always-record-everything remains disabled', () => {
  assert.equal(alwaysRecordEverythingEnabled(), false);
});

test('Night Shift cannot deploy production agents autonomously', () => {
  assert.equal(nightShiftDeploysProductionAgents(), false);
});

test('Night Shift cannot production-deploy pipelines', () => {
  assert.equal(nightShiftDeploysProductionPipelines(), false);
});

test('Night Shift cannot change security policy', () => {
  assert.equal(nightShiftChangesSecurityPolicy(), false);
});

test('Night Shift can produce recommendations', () => {
  assert.equal(nightShiftMayProduceRecommendations(startNightShift()), true);
});

test('crypto algorithms are versioned', () => {
  assert.equal(cryptoAlgorithmsAreVersioned(), true);
});

test('crypto migration is supported', () => {
  assert.equal(cryptoMigrationSupported(), true);
});

test('no claim of quantum security without proof', () => {
  assert.equal(quantumSecurityClaimedWithoutProof(), false);
});

test('Universe cannot bypass tenant isolation', () => {
  assert.equal(universeBypassesTenantIsolation('COMPANY', 'tenant-a', 'tenant-b'), false);
});

test('Company Universe remains private', () => {
  assert.equal(companyUniverseRemainsPrivate(), true);
});

test('Personal Universe remains private', () => {
  assert.equal(personalUniverseRemainsPrivate(), true);
});

test('marketing agents cannot fabricate evidence', () => {
  assert.equal(marketingFabricatesEvidence(createMarketingDraft('draft')), false);
});

test('marketing agents cannot mass-spam users', () => {
  assert.equal(marketingMassSpamsUsers(createMarketingDraft('draft')), false);
});

test('L4 remains disabled', () => {
  assert.equal(boundedAutonomyEnabled(), false);
});

test('GDF production-live=false', () => {
  assert.equal(globalDataFabricProductionLive(), false);
});
