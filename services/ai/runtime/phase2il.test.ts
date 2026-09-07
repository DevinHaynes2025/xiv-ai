/**
 * Phase 2I-L temporal intelligence + civilization knowledge + foresight lab.
 * Deterministic. No network. Does not weaken 2I-K or tenant tests.
 */
import assert from 'node:assert/strict';

import { boundedAutonomyEnabled } from './authority';
import { requestAgentSelfPromotion } from './everywhere';
import { foundrySelfDeploy, draftAgentSpecification, globalBrainExcludesTenantPrivateData } from './knowledge';
import { globalDataFabricProductionLive } from './network-os';
import {
  archaeologicalEqualsPrimarySource,
  contradictoryTemporalSourcesRemainVisible,
  correctTemporalClaim,
  createForecastScenario,
  createHistoricalAnalogue,
  createTemporalClaim,
  deduplicateTemporalSources,
  disputedClaimStaysDisputed,
  evidenceClassesAreEquivalent,
  forecastIsFact,
  historicalAnalogyBecomesForecastFact,
  laterAccountBecomesContemporary,
  libraryProviderRemainsNotConfigured,
  machineTranslationIsVerifiedInterpretation,
  quantumForecastProviderStatus,
  scenarioClaimsCertainty,
  sourceCorrectionPreservesHistory,
} from './temporal';

function test(name: string, run: () => void) {
  run();
  console.log(`ok - ${name}`);
}

const primaryEvidence = {
  evidenceClass: 'DIRECT_PRIMARY_SOURCE' as const,
  translationState: 'ORIGINAL' as const,
  source: {
    institution: 'demo_archive',
    collection: 'ledgers',
    document: 'port-register-1347',
    retrievedAt: '2026-09-07T00:00:00.000Z',
    license: 'public_domain_unproven',
    language: 'la',
  },
};

test('historical claim requires provenance', () => {
  const denied = createTemporalClaim({ text: 'Silk moved west.', geography: 'Eurasia', evidence: null });
  assert.equal('allowed' in denied && denied.allowed === false, true);
});

test('archaeological evidence != direct primary source', () => {
  assert.equal(archaeologicalEqualsPrimarySource(), false);
  assert.equal(evidenceClassesAreEquivalent('ARCHAEOLOGICAL_EVIDENCE', 'DIRECT_PRIMARY_SOURCE'), false);
});

test('machine translation != verified interpretation', () => {
  assert.equal(machineTranslationIsVerifiedInterpretation('MACHINE_TRANSLATED'), false);
  assert.equal(machineTranslationIsVerifiedInterpretation('HUMAN_REVIEWED'), true);
});

test('disputed claim stays disputed', () => {
  const claim = createTemporalClaim({
    text: 'Route volume is reconstructed.',
    geography: 'Silk Road',
    evidence: { ...primaryEvidence, evidenceClass: 'DISPUTED' },
    disputed: true,
  });
  assert.equal('allowed' in claim, false);
  if (!('allowed' in claim)) assert.equal(disputedClaimStaysDisputed(claim), true);
});

test('later account cannot silently become contemporary source', () => {
  assert.equal(laterAccountBecomesContemporary(), false);
  assert.equal(evidenceClassesAreEquivalent('LATER_HISTORICAL_ACCOUNT', 'CONTEMPORARY_RECORD'), false);
});

test('historical analogy does not become forecast fact', () => {
  const analogue = createHistoricalAnalogue({
    similarities: ['chokepoint'],
    differences: ['containerization'],
  });
  assert.equal(historicalAnalogyBecomesForecastFact(analogue), false);
});

test('forecast does not become fact', () => {
  const forecast = createForecastScenario({
    statement: 'Rerouting may persist.',
    stance: 'FORECAST',
    probability: 0.38,
    modelId: 'calibrated-demo',
    evidenceCount: 2,
  });
  assert.equal('allowed' in forecast, false);
  if (!('allowed' in forecast)) assert.equal(forecastIsFact(forecast), false);
});

test('scenario cannot claim certainty', () => {
  const scenario = createForecastScenario({ statement: 'Extended disruption', stance: 'SCENARIO' });
  assert.equal('allowed' in scenario, false);
  if (!('allowed' in scenario)) assert.equal(scenarioClaimsCertainty(scenario), false);
});

test('probability requires model/evidence', () => {
  const denied = createForecastScenario({
    statement: 'Invented 42%.',
    stance: 'FORECAST',
    probability: 0.42,
  });
  assert.equal('allowed' in denied && denied.allowed === false, true);
});

test('quantum remains NOT_CONFIGURED unless proven', () => {
  assert.equal(quantumForecastProviderStatus(), 'NOT_CONFIGURED');
});

test('library provider remains NOT_CONFIGURED without integration', () => {
  assert.equal(libraryProviderRemainsNotConfigured(), true);
});

test('duplicate historical sources deduplicate appropriately', () => {
  const result = deduplicateTemporalSources(
    { institution: 'loc', document: 'map-1850' },
    { institution: 'loc', document: 'map-1850' },
  );
  assert.equal(result.duplicate, true);
});

test('contradictory sources remain visible', () => {
  const conflict = contradictoryTemporalSourcesRemainVisible({
    claim: 'Port closed',
    sources: [
      { institution: 'chronicle_a', stance: 'closed' },
      { institution: 'chronicle_b', stance: 'open' },
    ],
  });
  assert.equal(conflict.visible, true);
  assert.equal(conflict.resolvedAutomatically, false);
});

test('source correction preserves history', () => {
  const claim = createTemporalClaim({
    text: 'Workshop produced silk.',
    geography: 'Chang’an',
    evidence: primaryEvidence,
  });
  assert.equal('allowed' in claim, false);
  if (!('allowed' in claim)) {
    const correction = correctTemporalClaim(claim, 'Workshop stored silk.');
    assert.equal(sourceCorrectionPreservesHistory(correction), true);
  }
});

test('private tenant data cannot enter Global Brain', () => {
  assert.equal(globalBrainExcludesTenantPrivateData(), true);
});

test('agents cannot self-promote', () => {
  assert.equal(
    requestAgentSelfPromotion({ agentId: 'history-agent', claimedRole: 'Research Director', requestedAuthority: 'L4' })
      .allowed,
    false,
  );
});

test('agents cannot self-create production authority', () => {
  const spec = draftAgentSpecification({ role: 'Port History Specialist' });
  assert.equal(foundrySelfDeploy(spec).allowed, false);
});

test('L4 disabled', () => {
  assert.equal(boundedAutonomyEnabled(), false);
});

test('GDF remains production-live=false', () => {
  assert.equal(globalDataFabricProductionLive(), false);
});
