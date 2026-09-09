/**
 * Phase 2I-A Business OS foundations.
 * Not hosted tenant activation. Not LIVE.
 */
import assert from 'node:assert/strict';

import { boundedAutonomyEnabled } from './authority';
import { createOptimizationProvider, quantumProcessingActive } from './compute';
import { agentDebuggerCanDeploy } from './diagnostics';
import { companyEntersGlobalBrainAutomatically, evaluateBrainTransfer, globalBrainAllowsProvenance } from './fabric';
import { forecastRequiresEvidence, productionForesightEnabled } from './foresight';
import { createOpportunityHypothesis, foundryTreatsHypothesisAsFact } from './foundry';
import { IDENTITY_FORBIDDEN_STORE_FIELDS, identityStoresRawBiometrics } from './identity';
import { createLearningLesson, learningMayMutateAgentAuthority } from './learning';
import {
  canHostBusinessLive,
  consumerCanHostBusinessLive,
  businessLiveHostingEnabled,
  businessLiveProviderStatus,
  createUnavailableLiveStreamProvider,
  evaluateBusinessLivePolicy,
} from './live';
import {
  FIRST_PARTY_PACK_MANIFESTS,
  consumerInstallDenied,
  evaluateModulePolicy,
  insuranceUnderwritingDecision,
  modulePermissionDefault,
  realEstateFabricatesProperty,
  requestModulePermissions,
  resetModuleRegistryForTests,
  seedFirstPartyBusinessPacks,
  wmsFabricatesInventory,
} from './modules';
import { publishingWritesEnabled } from './publishing/policy';
import { agentMayReceiveUnrestricted } from './security/fabric';
import { evaluateTenantActivation } from './tenant';

function test(name: string, run: () => void) {
  run();
  console.log(`ok - ${name}`);
}

resetModuleRegistryForTests();
seedFirstPartyBusinessPacks(FIRST_PARTY_PACK_MANIFESTS);

test('module permissions default deny', () => {
  const def = modulePermissionDefault();
  assert.equal(def.allow, false);
  assert.equal(def.wildcard, false);
  const empty = evaluateModulePolicy({
    actorOrganizationId: 'org_a',
    requestedOrganizationId: 'org_a',
    requestedPermissions: [],
  });
  assert.equal(empty.allowed, true);
});

test('wildcard permissions rejected', () => {
  const wildcard = requestModulePermissions(['*']);
  assert.equal(wildcard.allowed, false);
  const policy = evaluateModulePolicy({
    actorOrganizationId: 'org_a',
    requestedOrganizationId: 'org_a',
    requestedPermissions: ['crm.read', '*'],
  });
  assert.equal(policy.allowed, false);
});

test('cross-tenant module scope cannot be requested', () => {
  const cross = evaluateModulePolicy({
    actorOrganizationId: 'org_a',
    requestedOrganizationId: 'org_b',
    requestedPermissions: ['crm.read'],
  });
  assert.equal(cross.allowed, false);
  assert.match(cross.reason, /cross-tenant/i);
  const forbidden = evaluateModulePolicy({
    actorOrganizationId: 'org_a',
    requestedOrganizationId: 'org_a',
    requestedPermissions: ['cross_tenant.access'],
  });
  assert.equal(forbidden.allowed, false);
});

test('Business Live provider remains not_configured', () => {
  assert.equal(businessLiveProviderStatus(), 'not_configured');
  assert.equal(createUnavailableLiveStreamProvider().status, 'not_configured');
  assert.equal(businessLiveHostingEnabled(), false);
  const blocked = evaluateBusinessLivePolicy({ classification: 'business', evidenceRefs: [] });
  assert.equal(blocked.outcome, 'block');
  assert.equal(blocked.perfect, false);
});

test('consumer cannot host Business Live', () => {
  assert.equal(consumerCanHostBusinessLive(), false);
  assert.equal(canHostBusinessLive({ experienceRole: 'consumer' }).allowed, false);
});

test('raw biometric storage is not part of identity contracts', () => {
  assert.equal(identityStoresRawBiometrics(), false);
  assert.equal(IDENTITY_FORBIDDEN_STORE_FIELDS.includes('faceTemplate'), true);
  assert.equal(IDENTITY_FORBIDDEN_STORE_FIELDS.includes('rawFaceImage'), true);
});

test('Company Brain data cannot automatically become Global Brain data', () => {
  assert.equal(companyEntersGlobalBrainAutomatically(), false);
  const transfer = evaluateBrainTransfer({ from: 'company', to: 'global' });
  assert.equal(transfer.allowed, false);
});

test('Global Brain requires explicit allowed provenance category', () => {
  assert.equal(globalBrainAllowsProvenance(null).allowed, false);
  assert.equal(globalBrainAllowsProvenance('scraped').allowed, false);
  assert.equal(globalBrainAllowsProvenance('licensed').allowed, true);
});

test('learning system cannot mutate agent authority', () => {
  assert.equal(learningMayMutateAgentAuthority(), false);
  const lesson = createLearningLesson({
    evidence: [{ evidenceId: 'ev1', summary: 'Measured miss', sourceId: 'src1' }],
    scope: { organizationId: 'org_a', universeId: null, brain: 'company' },
    timestamp: '2026-09-07T00:00:00.000Z',
  });
  assert.equal('allowed' in lesson && lesson.allowed === false, false);
  if ('mutatesAuthority' in lesson) {
    assert.equal(lesson.mutatesAuthority, false);
    assert.equal(lesson.mutatesModel, false);
    assert.equal(lesson.mutatesPolicy, false);
  }
});

test('forecasts require evidence/confidence metadata', () => {
  const denied = forecastRequiresEvidence({ evidenceRefs: [] });
  assert.equal(denied.allowed, false);
  const ok = forecastRequiresEvidence({ evidenceRefs: ['ev1'], confidence: 'low' });
  assert.equal(ok.allowed, true);
  if (ok.allowed) assert.equal(ok.certainty, false);
  assert.equal(productionForesightEnabled(), false);
});

test('Idea Foundry output distinguishes hypothesis vs validated fact', () => {
  assert.equal(foundryTreatsHypothesisAsFact(), false);
  const missing = createOpportunityHypothesis({ statement: 'New warehouse region', evidenceIds: [] });
  assert.equal('allowed' in missing && missing.allowed === false, true);
  const hyp = createOpportunityHypothesis({ statement: 'New warehouse region', evidenceIds: ['ev1'] });
  assert.equal('stance' in hyp && hyp.stance === 'hypothesis', true);
});

test('future_quantum provider is marked unavailable/not active', () => {
  const quantum = createOptimizationProvider('future_quantum');
  assert.equal(quantum.kind, 'future_quantum');
  assert.equal(quantum.status, 'not_active');
  assert.equal(quantum.quantumProcessingActive, false);
  assert.equal(quantumProcessingActive(), false);
});

test('L4 remains disabled, Guardian deploy denied, unrestricted writes denied', () => {
  assert.equal(boundedAutonomyEnabled(), false);
  assert.equal(agentDebuggerCanDeploy(), false);
  assert.equal(publishingWritesEnabled(), false);
  assert.equal(agentMayReceiveUnrestricted('database'), false);
  assert.equal(agentMayReceiveUnrestricted('deploy'), false);
  assert.equal(consumerInstallDenied().allowed, false);
  assert.equal(insuranceUnderwritingDecision().allowed, false);
  assert.equal(realEstateFabricatesProperty(), false);
  assert.equal(wmsFabricatesInventory(), false);
  assert.equal(evaluateTenantActivation().tenantPersistence, 'blocked');
});

console.log('All Phase 2I-A foundation cases passed.');
