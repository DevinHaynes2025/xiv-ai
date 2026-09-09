/**
 * Phase 2I-H international company intelligence foundations.
 * Deterministic. No network. Does not weaken 2I-G or tenant tests.
 */
import assert from 'node:assert/strict';

import { boundedAutonomyEnabled } from './authority';
import {
  authorizeInternationalProviderAfterProof,
  bindCompanyChart,
  bindCompanyFactToSheet,
  buildCompanyStory,
  buildCompanyTimeline,
  buildGlobalCompanyResearchPacket,
  companiesHouseSourceState,
  createCompanyWatchItem,
  createInvitationCandidate,
  expandCompanyContradiction,
  filingsRemainFacts,
  forecastRemainsForecast,
  gleifAdapterCapabilityStatus,
  gleifGlobalFabricIsProductionLive,
  internationalCrossOrgDenied,
  internationalProviderSourceState,
  nameOnlyCompanyMergeDenied,
  privateCompanyDataMayEnterGlobalResearch,
  provenanceRequiredForCompanyRecord,
  recordGleifValidatedRetrieval,
  resetGleifAdapterStatusForTests,
  sameInternationalCompany,
  watchlistTermAllowed,
} from './international';
import { globalDataFabricProductionLive } from './network-os';
import {
  recordSecValidatedRetrieval,
  resetSecAdapterStatusForTests,
  resetSourceRegistryForTests,
  seedDeclaredBusinessDataProviders,
  secAdapterCapabilityStatus,
} from './sources';
import {
  recordWorldBankValidatedRetrieval,
  resetWorldBankAdapterStatusForTests,
  worldBankAdapterCapabilityStatus,
} from './sources/world-bank-status';
import { connectorCatalog, unprovenConnectorMustNotBeLive } from './network-os/experience';
import { unsupportedGlobalProvidersRemainNotConfigured } from './workspace';

function test(name: string, run: () => void) {
  run();
  console.log(`ok - ${name}`);
}

const unilever = {
  country: 'GB',
  lei: '549300MKFYEKVRWML317',
  registry: 'uk_companies_house',
  registryId: '00041424',
  legalName: 'UNILEVER PLC',
};
const appleUs = {
  country: 'US',
  lei: 'HWUPKR0MPOU8FGXBT394',
  registry: 'us_sec_edgar',
  registryId: '0000320193',
  legalName: 'Apple Inc.',
};

test('jurisdiction IDs prevent name-only company merging', () => {
  const sameNameDifferentPlace = nameOnlyCompanyMergeDenied(
    { country: 'GB', lei: null, registry: null, registryId: null, legalName: 'Acme Limited' },
    { country: 'US', lei: null, registry: null, registryId: null, legalName: 'Acme Limited' },
  );
  assert.equal(sameNameDifferentPlace.allowed, false);
  assert.equal(sameInternationalCompany(unilever, appleUs), false);
  assert.equal(sameInternationalCompany(unilever, { ...unilever }), true);
});

test('new provider remains NOT_CONFIGURED until proof', () => {
  resetGleifAdapterStatusForTests();
  assert.equal(internationalProviderSourceState(), 'NOT_CONFIGURED');
  assert.equal(gleifAdapterCapabilityStatus(), 'PROTOTYPE');
  assert.equal(companiesHouseSourceState(), 'NOT_CONFIGURED');
});

test('successful proof can authorize provider', () => {
  resetGleifAdapterStatusForTests();
  const denied = authorizeInternationalProviderAfterProof({ proofSucceeded: true });
  assert.equal(denied.allowed, false);
  recordGleifValidatedRetrieval();
  const authorized = authorizeInternationalProviderAfterProof({ proofSucceeded: true });
  assert.equal(authorized.allowed, true);
  assert.equal(internationalProviderSourceState(), 'AUTHORIZED');
  assert.equal(gleifAdapterCapabilityStatus(), 'LIVE');
  resetGleifAdapterStatusForTests();
});

test('source provenance required', () => {
  assert.equal(
    provenanceRequiredForCompanyRecord({
      provenance: {
        provider: 'gleif_lei',
        sourceId: 'gleif_lei',
        sourceRecordId: 'lei:549300MKFYEKVRWML317',
        retrievedAt: '2026-01-01T00:00:00.000Z',
        publisher: 'GLEIF',
        licenseType: 'public_lei_reference',
        usageRights: 'public',
        fabricated: false,
      },
    }).allowed,
    true,
  );
  assert.equal(
    provenanceRequiredForCompanyRecord({
      provenance: {
        provider: '',
        sourceId: '',
        sourceRecordId: '',
        retrievedAt: '',
        publisher: 'GLEIF',
        licenseType: 'public_lei_reference',
        usageRights: 'public',
        fabricated: false,
      },
    }).allowed,
    false,
  );
});

test('currency mismatch is surfaced', () => {
  const denied = bindCompanyFactToSheet({
    provider: 'us_sec_edgar',
    sourceRecordId: 'sec:fact:1',
    period: '2024',
    currency: 'USD',
    expectedCurrency: 'GBP',
    retrievedAt: '2026-01-01T00:00:00.000Z',
    verificationState: 'SUPPORTED',
    value: 1,
  });
  assert.equal(denied.allowed, false);
});

test('reporting-period mismatch is surfaced', () => {
  const denied = bindCompanyFactToSheet({
    provider: 'us_sec_edgar',
    sourceRecordId: 'sec:fact:1',
    period: '2024',
    expectedPeriod: '2025',
    currency: 'USD',
    retrievedAt: '2026-01-01T00:00:00.000Z',
    verificationState: 'SUPPORTED',
    value: 1,
  });
  assert.equal(denied.allowed, false);
});

test('contradiction agent flags conflicting company claims', () => {
  const conflict = expandCompanyContradiction(
    {
      claimId: 'a',
      subject: 'revenue',
      value: '10',
      period: '2024',
      stance: 'FACT',
      sourceId: 'website',
      websiteClaim: true,
    },
    {
      claimId: 'b',
      subject: 'revenue',
      value: '4',
      period: '2024',
      stance: 'FACT',
      sourceId: 'us_sec_edgar',
      filingClaim: true,
    },
  );
  assert.equal(conflict.status, 'CONTRADICTED');
});

test('filings remain fact; forecasts remain forecast', () => {
  assert.equal(filingsRemainFacts('FACT'), true);
  assert.equal(forecastRemainsForecast('FORECAST'), true);
  assert.equal(forecastRemainsForecast('FACT'), false);
});

test('watchlist never emits BUY/SELL', () => {
  assert.equal(watchlistTermAllowed('BUY').allowed, false);
  assert.equal(watchlistTermAllowed('SELL').allowed, false);
  assert.equal(watchlistTermAllowed('WATCH').allowed, true);
  const item = createCompanyWatchItem({
    watchId: 'w1',
    legalName: 'UNILEVER PLC',
    jurisdiction: 'GB',
    reason: 'Public LEI identity research',
    signal: 'REQUIRES_REVIEW',
    evidence: 'gleif_lei',
  });
  assert.equal(item.recommendation, null);
});

test('watchlist never guarantees returns', () => {
  assert.equal(watchlistTermAllowed('GUARANTEED_WINNER').allowed, false);
  assert.equal(watchlistTermAllowed('PRICE_TARGET').allowed, false);
  assert.equal(
    createCompanyWatchItem({
      watchId: 'w2',
      legalName: 'UNILEVER PLC',
      jurisdiction: 'GB',
      reason: 'Research only',
      signal: 'WATCH',
      evidence: 'gleif_lei',
    }).guaranteedReturn,
    false,
  );
});

test('XIV Sheets real-data bindings preserve provenance', () => {
  const bound = bindCompanyFactToSheet({
    provider: 'gleif_lei',
    sourceRecordId: 'lei:549300MKFYEKVRWML317',
    period: null,
    currency: 'GBP',
    retrievedAt: '2026-01-01T00:00:00.000Z',
    verificationState: 'SUPPORTED',
    value: 'UNILEVER PLC',
  });
  assert.equal(bound.allowed, true);
  if (bound.allowed) {
    assert.equal(bound.binding.provider, 'gleif_lei');
    assert.equal(bound.binding.sourceRecordId, 'lei:549300MKFYEKVRWML317');
    assert.equal(bound.binding.retrievedAt, '2026-01-01T00:00:00.000Z');
  }
});

test('charts preserve source metadata', () => {
  const chart = bindCompanyChart({
    kind: 'event_timeline',
    source: 'gleif_lei',
    period: '2013-2026',
    freshness: 'aging',
    provenance: 'lei:549300MKFYEKVRWML317',
  });
  assert.equal(chart.allowed, true);
  if (chart.allowed) {
    assert.equal(chart.chart.source, 'gleif_lei');
    assert.equal(chart.chart.fakeMarketPrice, false);
  }
  assert.equal(bindCompanyChart({ kind: 'market_price', source: 'x', period: '2024', freshness: 'n/a', provenance: 'x' }).allowed, false);
});

test('private company data cannot enter global research', () => {
  assert.equal(
    privateCompanyDataMayEnterGlobalResearch({
      brainOrigin: 'company',
      provenancePresent: true,
      licenseKnown: true,
      category: 'private_company',
    }).allowed,
    false,
  );
  assert.equal(
    privateCompanyDataMayEnterGlobalResearch({
      brainOrigin: 'external_public',
      provenancePresent: true,
      licenseKnown: true,
      category: 'public',
    }).allowed,
    true,
  );
});

test('company invitation requires human review', () => {
  assert.equal(createInvitationCandidate({ candidateId: 'c1', reviewedByHuman: false }).allowed, false);
  const reviewed = createInvitationCandidate({ candidateId: 'c1', reviewedByHuman: true });
  assert.equal(reviewed.allowed, true);
  if (reviewed.allowed) assert.equal(reviewed.automatedMassOutreach, false);
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

test('Global Data Fabric remains production-live=false', () => {
  assert.equal(globalDataFabricProductionLive(), false);
  assert.equal(gleifGlobalFabricIsProductionLive(), false);
});

test('L4 remains disabled', () => {
  assert.equal(boundedAutonomyEnabled(), false);
});

test('unproven providers remain NOT_CONFIGURED', () => {
  resetGleifAdapterStatusForTests();
  resetSourceRegistryForTests();
  seedDeclaredBusinessDataProviders();
  assert.equal(companiesHouseSourceState(), 'NOT_CONFIGURED');
  assert.equal(unsupportedGlobalProvidersRemainNotConfigured(), true);
  for (const id of ['oracle', 'snowflake', 'bigquery', 'nvidia', 'video', 'messaging']) {
    const row = unprovenConnectorMustNotBeLive(id);
    assert.equal(row.live === false || row.surface === 'NOT_CONFIGURED', true);
    const catalog = connectorCatalog().find((item) => item.id === id);
    assert.equal(catalog?.provenLive, false);
  }
});

test('cross-org access denied', () => {
  assert.equal(internationalCrossOrgDenied('org_a', 'org_b').allowed, false);
});

test('timeline, packet, and story stay evidence-bound', () => {
  const record = {
    identity: {
      country: 'GB',
      region: 'GB-WRL',
      registry: 'uk_companies_house',
      registryId: '00041424',
      companyNumber: '00041424',
      lei: '549300MKFYEKVRWML317',
      exchange: null,
      ticker: null,
      currency: 'GBP',
      language: 'en',
      legalName: 'UNILEVER PLC',
      tradingName: null,
      status: 'ACTIVE',
      incorporationDate: '2013-11-27T03:03:00Z',
      industry: null,
      registeredAddress: 'PORT SUNLIGHT, LIVERPOOL',
      source: 'gleif_lei',
      retrievedAt: '2026-01-01T00:00:00.000Z',
    },
    officers: [],
    filings: [],
    events: [
      {
        eventType: 'registration' as const,
        source: 'gleif_lei',
        sourceTimestamp: '2013-11-27T03:03:00Z',
        retrievedAt: '2026-01-01T00:00:00.000Z',
        jurisdiction: 'GB',
        evidence: 'lei:549300MKFYEKVRWML317',
        verificationState: 'SUPPORTED' as const,
      },
    ],
    facts: [],
    provenance: {
      provider: 'gleif_lei',
      sourceId: 'gleif_lei',
      sourceRecordId: 'lei:549300MKFYEKVRWML317',
      retrievedAt: '2026-01-01T00:00:00.000Z',
      publisher: 'GLEIF',
      licenseType: 'public_lei_reference',
      usageRights: 'public',
      fabricated: false as const,
    },
    fabricated: false as const,
  };
  assert.equal(buildCompanyTimeline(record).length, 1);
  const packet = buildGlobalCompanyResearchPacket({ packetId: 'p1', record });
  assert.equal(packet.sections.includes('IDENTITY'), true);
  assert.equal(packet.confidence.universalTrustNumber, false);
  const story = buildCompanyStory(record);
  assert.equal(story.paragraphs.some((item) => item.heading === 'WHAT THE COMPANY IS' && item.evidence), true);
});

console.log('All Phase 2I-H international company intelligence unit cases passed.');
