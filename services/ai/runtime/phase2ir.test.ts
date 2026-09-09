/**
 * Phase 2I-R business civilization graph: legal, capital, task forces, passports, roots, plugins.
 * Deterministic. No network. Does not weaken 2I-Q or tenant tests.
 */
import assert from 'node:assert/strict';

import { boundedAutonomyEnabled } from './authority';
import { knowledgeCrossOrgDenied } from './knowledge';
import { globalDataFabricProductionLive } from './network-os';
import {
  capitalEmitsBuySell,
  capitalLabelsGuaranteedWinner,
  conveneTaskForce,
  createCapitalProfile,
  createJourneyImage,
  farmToShelfEventRequiresEvidence,
  illustrativeAiImageIsVerifiedEvidence,
  informationLogisticsCopiesEveryDatabase,
  installIndustryPack,
  investorDecisionRemainsHuman,
  legalAgentImpersonatesAttorney,
  legalAgentIsLicensedAttorney,
  legalAgentMayIssueAttorneyAdvice,
  ownershipEquityPercentageHardcoded,
  pluginReceivesUnrestrictedAccess,
  retainHistoricalRelationship,
  taskForceGrantsPermissions,
  xivHardwareIsProductionLive,
  xivReplacesHostOperatingSystem,
} from './ecosystem';

function test(name: string, run: () => void) {
  run();
  console.log(`ok - ${name}`);
}

test('XIV does not replace host operating systems', () => {
  assert.equal(xivReplacesHostOperatingSystem('IOS'), false);
  assert.equal(xivReplacesHostOperatingSystem('ANDROID'), false);
  assert.equal(xivReplacesHostOperatingSystem('WINDOWS'), false);
  assert.equal(xivReplacesHostOperatingSystem('MACOS'), false);
});

test('Legal Agent is not a licensed attorney', () => {
  assert.equal(legalAgentIsLicensedAttorney(), false);
  assert.equal(legalAgentImpersonatesAttorney(), false);
  assert.equal(legalAgentMayIssueAttorneyAdvice(), false);
});

test('capital profile requires evidence', () => {
  const denied = createCapitalProfile('co-1', null);
  assert.equal('allowed' in denied && denied.allowed === false, true);
});

test('capital never labels a guaranteed winner', () => {
  assert.equal(capitalLabelsGuaranteedWinner(), false);
  assert.equal(investorDecisionRemainsHuman(), true);
});

test('capital does not emit BUY/SELL', () => {
  assert.equal(capitalEmitsBuySell(), false);
});

test('task force cannot grant permissions', () => {
  assert.equal(taskForceGrantsPermissions(conveneTaskForce('SUPPLY_DISRUPTION', ['supplier', 'legal'])), false);
});

test('information logistics does not copy every database', () => {
  assert.equal(informationLogisticsCopiesEveryDatabase(), false);
});

test('farm-to-shelf event requires evidence', () => {
  const denied = farmToShelfEventRequiresEvidence('STORE', null);
  assert.equal('allowed' in denied && denied.allowed === false, true);
});

test('illustrative AI image is not verified evidence', () => {
  assert.equal(illustrativeAiImageIsVerifiedEvidence(createJourneyImage('ILLUSTRATIVE_AI_IMAGE')), false);
});

test('root relationship requires provenance and can retain history', () => {
  const denied = retainHistoricalRelationship({ from: 'supplier-a', to: 'factory-b', kind: 'supplied', disappeared: true });
  assert.equal('allowed' in denied && denied.allowed === false, true);
  const kept = retainHistoricalRelationship({
    from: 'supplier-a',
    to: 'factory-b',
    kind: 'supplied',
    disappeared: true,
    evidence: { source: 'contract', retrievedAt: '2026-09-07T00:00:00.000Z', reference: 'rel-1' },
  });
  assert.equal('allowed' in kept, false);
  if (!('allowed' in kept)) assert.equal(kept.historicalRetention, true);
});

test('plugin cannot receive unrestricted access', () => {
  const denied = installIndustryPack({
    packId: 'WAREHOUSE',
    signed: true,
    scanned: true,
    requestedPermissions: ['*'],
    companyApproved: true,
    universeBound: true,
  });
  assert.equal('allowed' in denied && denied.allowed === false, true);
});

test('plugin requires approval and universe binding', () => {
  const denied = installIndustryPack({
    packId: 'RETAIL',
    signed: true,
    scanned: true,
    requestedPermissions: ['inventory.read'],
    companyApproved: false,
    universeBound: false,
  });
  assert.equal('allowed' in denied && denied.allowed === false, true);
});

test('approved plugin still has no unrestricted access', () => {
  const installed = installIndustryPack({
    packId: 'LEGAL_OPERATIONS',
    signed: true,
    scanned: true,
    requestedPermissions: ['workspace.read'],
    companyApproved: true,
    universeBound: true,
  });
  assert.equal('allowed' in installed, false);
  if (!('allowed' in installed)) assert.equal(pluginReceivesUnrestrictedAccess(installed), false);
});

test('XIV hardware is not production-live', () => {
  assert.equal(xivHardwareIsProductionLive(), false);
});

test('ownership equity percentage is not hardcoded', () => {
  assert.equal(ownershipEquityPercentageHardcoded(), false);
});

test('cross-org denied', () => {
  assert.equal(knowledgeCrossOrgDenied(), true);
});

test('L4 disabled', () => {
  assert.equal(boundedAutonomyEnabled(), false);
});

test('GDF production-live=false', () => {
  assert.equal(globalDataFabricProductionLive(), false);
});
