/**
 * Phase 2I-I international filings + market/startup intelligence.
 * Deterministic. No network. Does not weaken 2I-H or tenant tests.
 */
import assert from 'node:assert/strict';

import { boundedAutonomyEnabled } from './authority';
import {
  acceptFakeValuation,
  acceptStartupFundingClaim,
  agentDisagreementAutoPromotesFact,
  contradictionRemainsVisible,
  createBusinessStoryClaim,
  createCompanyComparisonSheet,
  createCompanyIntelligenceChart,
  createDailyArticleCandidate,
  createDocumentaryPacket,
  createGlobalCompanyEvent,
  createOpportunityCandidate,
  createWatchlistItemV2,
  documentaryClaimPreservesType,
  expandInvitationStatus,
  gleifRemainsIdentityOnly,
  investmentLanguageDenied,
  jurisdictionAwareMergeDenied,
  marketCrossOrgDenied,
  marketPriceFeedAvailable,
  openCompanyResearchRoom,
  privateTenantDataCannotEnterPublicDiscovery,
  secRemainsFilingFinancialSource,
  unprovenInternationalFilingProvidersRemainNotConfigured,
  worldBankRemainsMacroSource,
} from './market';
import { globalDataFabricProductionLive } from './network-os';
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

test('unproven international filing providers remain NOT_CONFIGURED', () => {
  assert.equal(unprovenInternationalFilingProvidersRemainNotConfigured(), true);
});

test('GLEIF remains identity-only', () => {
  resetGleifAdapterStatusForTests();
  recordGleifValidatedRetrieval();
  assert.equal(gleifAdapterCapabilityStatus(), 'LIVE');
  assert.equal(gleifRemainsIdentityOnly(), true);
  resetGleifAdapterStatusForTests();
});

test('SEC remains filing/financial source', () => {
  resetSecAdapterStatusForTests();
  recordSecValidatedRetrieval();
  assert.equal(secAdapterCapabilityStatus(), 'LIVE');
  assert.equal(secRemainsFilingFinancialSource(), true);
  resetSecAdapterStatusForTests();
});

test('World Bank remains macro source', () => {
  resetWorldBankAdapterStatusForTests();
  recordWorldBankValidatedRetrieval();
  assert.equal(worldBankAdapterCapabilityStatus(), 'LIVE');
  assert.equal(worldBankRemainsMacroSource(), true);
  resetWorldBankAdapterStatusForTests();
});

test('name-only merge denied', () => {
  const denied = jurisdictionAwareMergeDenied(
    { country: 'GB', lei: null, registry: null, registryId: null, legalName: 'Acme Limited' },
    { country: 'US', lei: null, registry: null, registryId: null, legalName: 'Acme Limited' },
  );
  assert.equal(denied.allowed, false);
});

test('jurisdiction-aware IDs required', () => {
  const denied = createGlobalCompanyEvent({
    eventType: 'STATUS_CHANGE',
    legalName: 'Acme Limited',
    jurisdiction: 'GB',
    provider: 'gleif_lei',
    source: 'gleif_lei',
    retrievedAt: '2026-01-01T00:00:00.000Z',
    evidence: 'missing-id',
  });
  assert.equal(denied.allowed, false);
});

test('company events require evidence', () => {
  const denied = createGlobalCompanyEvent({
    eventType: 'FILING',
    legalName: 'Apple Inc.',
    jurisdiction: 'US',
    provider: 'us_sec_edgar',
    source: 'us_sec_edgar',
    retrievedAt: '2026-01-01T00:00:00.000Z',
    lei: 'HWUPKR0MPOU8FGXBT394',
    evidence: null,
  });
  assert.equal(denied.allowed, false);
  const ok = createGlobalCompanyEvent({
    eventType: 'FILING',
    legalName: 'Apple Inc.',
    jurisdiction: 'US',
    provider: 'us_sec_edgar',
    source: 'us_sec_edgar',
    retrievedAt: '2026-01-01T00:00:00.000Z',
    lei: 'HWUPKR0MPOU8FGXBT394',
    evidence: 'sec:filing:1',
  });
  assert.equal(ok.allowed, true);
});

test('startup funding claims require evidence', () => {
  assert.equal(acceptStartupFundingClaim({ startupId: 's1', legalName: 'Demo Co', stage: 'SEED', fundingClaim: { amount: '2M' } }).allowed, false);
  assert.equal(
    acceptStartupFundingClaim({
      startupId: 's1',
      legalName: 'Demo Co',
      stage: 'SEED',
      fundingClaim: { amount: '2M', evidence: 'public filing note' },
    }).allowed,
    true,
  );
});

test('fake valuation denied', () => {
  assert.equal(acceptFakeValuation({ startupId: 's1', legalName: 'Demo Co', stage: 'UNKNOWN', valuationClaim: { value: '1B' } }).allowed, false);
});

test('investment recommendation language denied', () => {
  assert.equal(investmentLanguageDenied('MULTIBAGGER').allowed, false);
  assert.equal(investmentLanguageDenied('CERTAIN_WINNER').allowed, false);
  assert.equal(createOpportunityCandidate({ candidateId: 'o1', category: 'STARTUP', legalName: 'Demo', country: 'NG', evidence: 'demo' }).recommendation, null);
});

test('BUY/SELL denied', () => {
  assert.equal(investmentLanguageDenied('BUY').allowed, false);
  assert.equal(investmentLanguageDenied('SELL').allowed, false);
});

test('watchlist remains research-only', () => {
  const item = createWatchlistItemV2({ watchId: 'w1', country: 'GB', reason: 'GLEIF identity watch' });
  assert.equal(item.recommendation, null);
  assert.equal(item.notificationTransportLive, false);
  assert.equal(item.researchState, 'REQUIRES_REVIEW');
});

test('contradiction stays visible', () => {
  assert.equal(
    contradictionRemainsVisible(
      { claimId: 'a', subject: 'revenue', value: '10', stance: 'FACT', sourceId: 'press' },
      { claimId: 'b', subject: 'revenue', value: '4', stance: 'FACT', sourceId: 'us_sec_edgar' },
    ),
    true,
  );
});

test('agent disagreement cannot auto-promote claims to fact', () => {
  const room = openCompanyResearchRoom([
    { role: 'Story', claim: 'Growth is certain', stance: 'INFERENCE', evidence: null },
    { role: 'Filings', claim: 'Revenue observed', stance: 'FACT', evidence: 'sec:fact:1' },
  ]);
  assert.equal(agentDisagreementAutoPromotesFact(room), false);
  assert.equal(room.disagreements[0]?.visible, true);
});

test('Sheets bindings preserve provenance', () => {
  const rows = createCompanyComparisonSheet([
    { company: 'UNILEVER PLC', country: 'GB', provider: 'gleif_lei', sourceRecordId: 'lei:549300MKFYEKVRWML317', retrievedAt: '2026-01-01T00:00:00.000Z' },
  ]);
  assert.equal(rows[0]?.allowed, true);
  if (rows[0]?.allowed) assert.equal(rows[0].binding.provider, 'gleif_lei');
});

test('charts preserve provenance', () => {
  const chart = createCompanyIntelligenceChart({
    kind: 'EventTimeline',
    source: 'gleif_lei',
    period: '2013-2026',
    provenance: 'lei:549300MKFYEKVRWML317',
  });
  assert.equal(chart.allowed, true);
});

test('private tenant data cannot enter public discovery', () => {
  assert.equal(
    privateTenantDataCannotEnterPublicDiscovery({
      brainOrigin: 'company',
      provenancePresent: true,
      licenseKnown: true,
    }).allowed,
    false,
  );
});

test('documentary claims preserve claim type', () => {
  const packet = createDocumentaryPacket([{ text: 'Founder said we are winning', label: 'FOUNDER_CLAIM', evidence: null }]);
  assert.equal(documentaryClaimPreservesType(packet.claims[0], 'FOUNDER_CLAIM'), true);
  assert.equal(packet.videoProductionLive, false);
  assert.equal(createBusinessStoryClaim('FOUNDER_CLAIM', null).collapsed, false);
});

test('AI articles require human review', () => {
  assert.equal(createDailyArticleCandidate({ title: 'Draft', category: 'GLOBAL', reviewState: 'PUBLISHED' }).allowed, false);
  assert.equal(createDailyArticleCandidate({ title: 'Draft', category: 'GLOBAL' }).allowed, true);
});

test('invitation requires review', () => {
  assert.equal(expandInvitationStatus({ reviewedByHuman: false }).allowed, false);
  const reviewed = expandInvitationStatus({ reviewedByHuman: true });
  assert.equal(reviewed.allowed, true);
});

test('Global Data Fabric production-live=false', () => {
  assert.equal(globalDataFabricProductionLive(), false);
});

test('L4 disabled', () => {
  assert.equal(boundedAutonomyEnabled(), false);
});

test('cross-org denied', () => {
  assert.equal(marketCrossOrgDenied('org_a', 'org_b').allowed, false);
});

test('unsupported market-price feeds remain unavailable', () => {
  assert.equal(marketPriceFeedAvailable().available, false);
  assert.equal(createCompanyIntelligenceChart({ kind: 'market_price', source: 'x', period: '2024', provenance: 'x' }).allowed, false);
});

console.log('All Phase 2I-I international filings and market intelligence unit cases passed.');
