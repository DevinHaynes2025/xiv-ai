/**
 * Phase 2I-P legacy intelligence + agent assembly + algorithm foundry + brain network.
 * Deterministic. No network. Does not weaken 2I-O or tenant tests.
 */
import assert from 'node:assert/strict';

import { boundedAutonomyEnabled } from './authority';
import { globalBrainExcludesTenantPrivateData } from './knowledge';
import { globalDataFabricProductionLive } from './network-os';
import {
  agentMeetingGrantsPermissions,
  agentMemoryBecomesGlobalBrainFact,
  aiInferenceIsDocumentedBelief,
  algorithmModifiesGuardian,
  algorithmModifiesTenantIsolation,
  algorithmProposalProductionDeploysItself,
  biasEvaluationClaimsZeroBias,
  councilDisagreementVisible,
  councilMajorityCreatesVerifiedFact,
  createHistoricalQuotation,
  createObituaryClaim,
  matchHistoricalIdentity,
  measuredBiasEvaluation,
  obituaryAloneCreatesCompleteLegacyBrain,
  openAgentMeeting,
  openCouncilOfMinds,
  pocketAgentAccessUncachedPrivateData,
  pocketAgentBypassesServerAuthority,
  promoteKnowledge,
  proposeAlgorithm,
  simulateLegacyResponse,
  simulatedStatementEqualsHistoricalQuotation,
  simulationClaimsToBeDeceasedPerson,
  societyCrossOrgDenied,
  unauthorizedDatabaseDenied,
  unauthorizedNetworkSourceDenied,
} from './society';

function test(name: string, run: () => void) {
  run();
  console.log(`ok - ${name}`);
}

test('obituary claim requires source', () => {
  const denied = createObituaryClaim({ text: 'founded a company', evidence: null });
  assert.equal('allowed' in denied && denied.allowed === false, true);
});

test('identity match requires evidence', () => {
  const denied = matchHistoricalIdentity({ personId: 'p1', legalName: 'Ada Lovelace', evidence: null });
  assert.equal('allowed' in denied && denied.allowed === false, true);
});

test('obituary alone cannot create complete Legacy Brain', () => {
  assert.equal(
    obituaryAloneCreatesCompleteLegacyBrain({
      recordId: 'obit-1',
      evidence: { source: 'public-obit', retrievedAt: '2026-09-07T00:00:00.000Z', reference: 'obit-1', license: 'public', public: true },
    }),
    false,
  );
});

test('simulation cannot claim to be deceased person', () => {
  assert.equal(simulationClaimsToBeDeceasedPerson(simulateLegacyResponse('on computation')), false);
});

test('simulated statement != historical quotation', () => {
  assert.equal(simulatedStatementEqualsHistoricalQuotation(simulateLegacyResponse('on computation')), false);
});

test('historical quotation requires evidence', () => {
  const denied = createHistoricalQuotation({ text: 'we may say most aptly', evidence: null });
  assert.equal('allowed' in denied && denied.allowed === false, true);
});

test('AI inference != documented belief', () => {
  assert.equal(
    aiInferenceIsDocumentedBelief({
      claimId: 'c1',
      text: 'would support cloud computing',
      class: 'AI_INFERENCE',
      evidence: null,
    }),
    false,
  );
});

test('Council disagreement remains visible', () => {
  const council = openCouncilOfMinds('How should inventory risk be priced?', [
    { memberId: 'thinker-a', kind: 'HISTORICAL_SIMULATION', distinguishable: true },
    { memberId: 'economics', kind: 'XIV_AGENT', distinguishable: true },
  ]);
  assert.equal(councilDisagreementVisible(council), true);
});

test('Council majority cannot create verified fact', () => {
  const council = openCouncilOfMinds('Is this origin verified?', [
    { memberId: 'a', kind: 'XIV_AGENT', distinguishable: true },
    { memberId: 'b', kind: 'XIV_AGENT', distinguishable: true },
  ]);
  assert.equal(councilMajorityCreatesVerifiedFact(council), false);
});

test('agent meeting cannot grant permissions', () => {
  assert.equal(agentMeetingGrantsPermissions(openAgentMeeting('RESEARCH', ['finance', 'supply-chain'])), false);
});

test('offline agent cannot access uncached private data', () => {
  assert.equal(
    pocketAgentAccessUncachedPrivateData({
      cached: false,
      classification: 'TENANT_PRIVATE',
      policy: 'CLOUD_ONLY',
    }),
    false,
  );
});

test('offline agent cannot bypass server authority', () => {
  assert.equal(pocketAgentBypassesServerAuthority(), false);
});

test('algorithm proposal cannot production-deploy itself', () => {
  assert.equal(algorithmProposalProductionDeploysItself(proposeAlgorithm({ demandId: 'd1', problem: 'slotting' })), false);
});

test('algorithm cannot modify Guardian', () => {
  assert.equal(algorithmModifiesGuardian(), false);
});

test('algorithm cannot modify tenant isolation', () => {
  assert.equal(algorithmModifiesTenantIsolation(), false);
});

test('bias evaluation cannot claim zero bias', () => {
  assert.equal(biasEvaluationClaimsZeroBias(measuredBiasEvaluation()), false);
});

test('agent memory cannot become Global Brain fact automatically', () => {
  assert.equal(agentMemoryBecomesGlobalBrainFact(), false);
});

test('knowledge promotion requires evidence', () => {
  const denied = promoteKnowledge({ text: 'supplier is verified' });
  assert.equal('allowed' in denied && denied.allowed === false, true);
});

test('unauthorized network source denied', () => {
  assert.equal(unauthorizedNetworkSourceDenied(false), true);
});

test('unauthorized database denied', () => {
  assert.equal(unauthorizedDatabaseDenied(false), true);
});

test('private tenant data cannot enter Global Brain', () => {
  assert.equal(globalBrainExcludesTenantPrivateData(), true);
});

test('cross-org denied', () => {
  assert.equal(societyCrossOrgDenied(), true);
});

test('L4 disabled', () => {
  assert.equal(boundedAutonomyEnabled(), false);
});

test('GDF production-live=false', () => {
  assert.equal(globalDataFabricProductionLive(), false);
});
