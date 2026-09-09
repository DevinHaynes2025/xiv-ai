/**
 * Phase 2I-D2 SEC company intelligence unit tests.
 * Deterministic. No network. Not LIVE.
 */
import assert from 'node:assert/strict';

import { boundedAutonomyEnabled } from './authority';
import { agentDebuggerCanDeploy } from './diagnostics';
import { forecastRequiresEvidence } from './foresight';
import {
  acceptBusinessEvent,
  buildCompanyGraphEdges,
  buildCompanyHistory,
  cikIsAuthoritativeIdentity,
  companyGraphDatabaseDeployed,
  companyIdentityFromSec,
  companySignalsFromFacts,
  compareCompanyPeriods,
  correctBusinessEvent,
  crossSourceClaimsCausation,
  declareBankruptcy,
  detectDuplicateSourceRecord,
  financialObservationFromSecFact,
  inferAcquisitionFromFilingText,
  ingestSecAdapterRecord,
  ledgerPersistsToHostedDatabase,
  listBusinessEvents,
  macroSurroundingCompanyPeriod,
  mergeCompaniesByNameOnly,
  normalizeHistoricalRecord,
  omitMissingFinancialFact,
  requiredHistoricalProvenancePresent,
  resetBusinessEventLedgerForTests,
  resolveEntitiesByNameOnly,
} from './historical';
import { learningMayMutateAgentAuthority } from './learning';
import {
  enforceSecBounds,
  enforceSecRequestBounds,
  mapSecFacts,
  mapSecFilings,
  mapSecIdentity,
  missingSecFactIsFabricated,
  padSecCik,
  SEC_MAX_FILINGS_PER_COMPANY,
  secUserAgentContainsSecrets,
} from './providers';
import { publishingWritesEnabled } from './publishing/policy';
import {
  canIngestFromProvider,
  evaluateGlobalBrainIngestion,
  registerBusinessDataProvider,
  resetSecAdapterStatusForTests,
  resetSourceRegistryForTests,
  SEC_EDGAR_DESCRIPTOR,
  secAdapterCapabilityStatus,
  seedDeclaredBusinessDataProviders,
  sourcesUseServiceRole,
} from './sources';
import { adapterForProvider } from './sources/adapters';
import { evaluateTenantActivation } from './tenant';

function test(name: string, run: () => void) {
  run();
  console.log(`ok - ${name}`);
}

resetSourceRegistryForTests();
resetBusinessEventLedgerForTests();
resetSecAdapterStatusForTests();
seedDeclaredBusinessDataProviders();

test('SEC adapter default deny when unconfigured', () => {
  registerBusinessDataProvider({
    ...SEC_EDGAR_DESCRIPTOR,
    providerId: 'us_sec_edgar_unconfigured',
    status: 'not_configured',
    authorization: {
      authorized: false,
      configured: false,
      provenanceEnabled: true,
      classificationKnown: true,
      usageRightsKnown: true,
    },
  });
  const denied = canIngestFromProvider('us_sec_edgar_unconfigured');
  assert.equal(denied.allowed, false);
  assert.match(denied.reason, /unconfigured/i);
});

test('bounded request enforcement', () => {
  assert.equal(enforceSecBounds({ bulk: true }).allowed, false);
  assert.equal(enforceSecBounds({ maxFilings: SEC_MAX_FILINGS_PER_COMPANY + 1 }).allowed, false);
  assert.equal(enforceSecBounds({ companyCount: 4 }).allowed, false);
  const missingCik = enforceSecRequestBounds({});
  assert.equal(missingCik.allowed, false);
  const ok = enforceSecBounds({ maxFilings: 4, companyCount: 2 });
  assert.equal(ok.allowed, true);
});

test('CIK identity handling', () => {
  assert.equal(padSecCik('320193'), '0000320193');
  assert.equal(cikIsAuthoritativeIdentity(), true);
  const identity = companyIdentityFromSec({ cik: '320193', legalName: 'Apple Inc.', ticker: 'AAPL' });
  assert.equal('sec' in identity && identity.sec?.cik === '0000320193', true);
  const denied = companyIdentityFromSec({ cik: '', legalName: 'Apple Inc.' });
  assert.equal('allowed' in denied && denied.allowed === false, true);
});

test('company-name-only merge denied', () => {
  const byName = mergeCompaniesByNameOnly('Apple Inc.', 'Apple Inc.');
  assert.equal(byName.merged, false);
  const entities = resolveEntitiesByNameOnly('Apple Inc.', 'Apple Inc.');
  assert.equal(entities.merged, false);
});

test('missing provenance rejected', () => {
  const denied = normalizeHistoricalRecord({
    kind: 'sec_filing',
    sourceId: 'us_sec_edgar',
    publisher: 'U.S. SEC EDGAR',
    retrievedAt: '2026-09-07T00:00:00.000Z',
    ingestedAt: '2026-09-07T00:00:00.000Z',
    licenseType: 'us_government_public',
    usageRights: 'public',
  });
  assert.equal('allowed' in denied && denied.allowed === false, true);
});

test('missing financial fact not fabricated', () => {
  assert.equal(missingSecFactIsFabricated(), false);
  const mapped = mapSecFacts({
    cik: '0000320193',
    entityName: 'Apple Inc.',
    facts: { 'us-gaap': {} },
    retrievedAt: '2026-09-07T00:00:00.000Z',
  });
  assert.equal(mapped.facts.length, 0);
  assert.equal(mapped.fabricated, false);
  const omitted = omitMissingFinancialFact('revenue', []);
  assert.equal(omitted.length, 0);
  const missingValue = financialObservationFromSecFact({
    recordType: 'fact',
    sourceId: 'us_sec_edgar',
    sourceRecordId: 'sec:fact:missing',
    cik: '0000320193',
    legalName: 'Apple Inc.',
    metric: 'revenue',
    usGaapConcept: 'Revenues',
    period: '2023',
    originalDate: '2023',
    value: undefined as unknown as number,
    unit: 'USD',
    form: '10-K',
    accession: '0001',
    retrievedAt: '2026-09-07T00:00:00.000Z',
    publisher: 'U.S. SEC EDGAR',
    licenseType: 'us_government_public',
    usageRights: 'public',
    fabricated: false,
    freshness: 'aging',
  });
  assert.equal('allowed' in missingValue && missingValue.allowed === false, true);
});

test('public SEC Global Brain eligibility; private tenant data remains denied', () => {
  const publicOk = evaluateGlobalBrainIngestion({
    category: 'public',
    brainOrigin: 'external_public',
    provenancePresent: true,
    licenseKnown: true,
  });
  assert.equal(publicOk.allowed, true);
  assert.equal(
    evaluateGlobalBrainIngestion({
      category: 'public',
      brainOrigin: 'company',
      provenancePresent: true,
      licenseKnown: true,
    }).allowed,
    false,
  );
});

test('bankruptcy requires authoritative evidence', () => {
  const denied = declareBankruptcy({ authoritativeSource: false });
  assert.equal(denied.bankrupt, false);
});

test('forecast evidence/confidence', () => {
  assert.equal(forecastRequiresEvidence({ evidenceRefs: [] }).allowed, false);
  assert.equal(forecastRequiresEvidence({ evidenceRefs: ['sec:1'], confidence: 'low' }).allowed, true);
});

test('cross-source provenance retained', () => {
  const context = macroSurroundingCompanyPeriod({
    cik: '0000320193',
    companyPeriod: '2023',
    companyFacts: [{ metric: 'revenue', value: 1, sourceRecordId: 'sec:fact:rev:2023' }],
    macro: [
      {
        indicatorId: 'NY.GDP.MKTP.KD.ZG',
        indicatorName: 'GDP growth',
        period: '2023',
        value: 2.9,
        sourceRecordId: 'US:NY.GDP.MKTP.KD.ZG:2023',
      },
    ],
  });
  assert.equal('causalClaim' in context && context.causalClaim === false, true);
  assert.equal(crossSourceClaimsCausation(), false);
  if ('macro' in context) {
    assert.equal(context.macro[0]?.sourceRecordId, 'US:NY.GDP.MKTP.KD.ZG:2023');
  }
});

test('event duplicate detection and correction append behavior', () => {
  const adapter = adapterForProvider('us_sec_edgar');
  const identity = mapSecIdentity({
    cik: '0000320193',
    name: 'Apple Inc.',
    tickers: ['AAPL'],
    retrievedAt: '2026-09-07T00:00:00.000Z',
  });
  assert.equal('cik' in identity, true);
  if (!('cik' in identity)) return;
  const first = ingestSecAdapterRecord({ record: { ...identity }, adapter });
  assert.equal('accepted' in first && first.accepted === true, true);
  if (!('accepted' in first) || !first.accepted) return;
  assert.equal(requiredHistoricalProvenancePresent(first.normalized), true);
  const duplicate = ingestSecAdapterRecord({ record: { ...identity }, adapter });
  assert.equal('duplicate' in duplicate && duplicate.duplicate === true, true);
  assert.equal(detectDuplicateSourceRecord(identity.sourceId, identity.sourceRecordId), true);
  const corrected = normalizeHistoricalRecord({
    ...first.normalized,
    retrievedAt: '2026-09-07T00:01:00.000Z',
    payload: { ...first.normalized.payload, correction: true },
  });
  assert.equal('eventId' in corrected, true);
  if (!('eventId' in corrected)) return;
  const version = correctBusinessEvent(first.event.eventId, corrected, '2026-09-07T00:01:00.000Z');
  assert.equal(version.accepted === true && 'rewritten' in version && version.rewritten === false, true);
  assert.equal(listBusinessEvents().length >= 2, true);
  assert.equal(ledgerPersistsToHostedDatabase(), false);
});

test('identity mapping, filings cap, history, graph, and single-metric signal restraint', () => {
  const retrievedAt = '2026-09-07T00:00:00.000Z';
  const identity = mapSecIdentity({ cik: '789019', name: 'MICROSOFT CORP', tickers: ['MSFT'], retrievedAt });
  assert.equal('cik' in identity && identity.cik === '0000789019', true);
  if (!('cik' in identity)) return;
  const filings = mapSecFilings({
    cik: identity.cik,
    accessionNumber: ['a1', 'a2', 'a3'],
    filingDate: ['2023-07-01', '2023-10-01', '2024-01-01'],
    form: ['10-Q', '8-K', '10-K'],
    retrievedAt,
    maxFilings: 8,
  });
  assert.equal(filings.length, 2);
  assert.equal(inferAcquisitionFromFilingText('acquired something').allowed, false);
  const facts = mapSecFacts({
    cik: identity.cik,
    entityName: identity.legalName,
    retrievedAt,
    facts: {
      'us-gaap': {
        Revenues: {
          units: {
            USD: [
              { end: '2023-06-30', val: 100, accn: '0001', form: '10-K', fp: 'FY' },
              { end: '2022-06-30', val: 80, accn: '0002', form: '10-K', fp: 'FY' },
            ],
          },
        },
        NetIncomeLoss: {
          units: {
            USD: [
              { end: '2023-06-30', val: 20, accn: '0001', form: '10-K', fp: 'FY' },
              { end: '2022-06-30', val: 10, accn: '0002', form: '10-K', fp: 'FY' },
            ],
          },
        },
      },
    },
  });
  const history = buildCompanyHistory({ identity, filings, facts: facts.facts });
  assert.equal('identity' in history, true);
  const graph = buildCompanyGraphEdges({
    cik: identity.cik,
    legalName: identity.legalName,
    filings,
    facts: facts.facts,
    industry: 'software',
    macroPeriod: '2023',
  });
  assert.equal(Array.isArray(graph), true);
  assert.equal(companyGraphDatabaseDeployed(), false);
  const single = companySignalsFromFacts({
    facts: [{ metric: 'revenue', period: '2023', value: 1, sourceRecordId: 'sec:1' }],
  });
  assert.equal(single.declaredSuccess, false);
  assert.equal(single.declaredDistress, false);
  const multi = companySignalsFromFacts({
    facts: facts.facts.map((item) => ({
      metric: item.metric,
      period: item.period,
      value: item.value,
      sourceRecordId: item.sourceRecordId,
    })),
  });
  assert.equal(multi.declaredSuccess, false);
  const report = compareCompanyPeriods({
    cik: identity.cik,
    legalName: identity.legalName,
    periodAYear: '2022',
    periodBYear: '2023',
    periodA: facts.facts.filter((item) => item.period === '2022').map((item) => ({
      indicatorId: item.metric,
      indicatorName: item.metric,
      period: item.period,
      value: item.value,
      sourceRecordId: item.sourceRecordId,
    })),
    periodB: facts.facts.filter((item) => item.period === '2023').map((item) => ({
      indicatorId: item.metric,
      indicatorName: item.metric,
      period: item.period,
      value: item.value,
      sourceRecordId: item.sourceRecordId,
    })),
  });
  assert.equal('destiny' in report && report.destiny === false, true);
});

test('service_role unused; L4 disabled; Guardian deploy denied; unrestricted writes denied', () => {
  assert.equal(sourcesUseServiceRole(), false);
  assert.equal(boundedAutonomyEnabled(), false);
  assert.equal(agentDebuggerCanDeploy(), false);
  assert.equal(publishingWritesEnabled(), false);
  assert.equal(evaluateTenantActivation().tenantPersistence, 'blocked');
  assert.equal(learningMayMutateAgentAuthority(), false);
  assert.equal(secAdapterCapabilityStatus(), 'CONFIGURED');
  assert.equal(secUserAgentContainsSecrets(), false);
  assert.equal(acceptBusinessEvent !== null, true);
});

console.log('All Phase 2I-D2 SEC company intelligence unit cases passed.');
