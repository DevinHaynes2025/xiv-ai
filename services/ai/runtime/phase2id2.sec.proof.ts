/**
 * Phase 2I-D2 SEC EDGAR real-data proof.
 * Not part of npm run test:runtime. Requires network.
 * Never fabricates. Never uses service_role. Never writes hosted tables.
 */
import { boundedAutonomyEnabled } from './authority';
import { agentDebuggerCanDeploy } from './diagnostics';
import { forecastRequiresEvidence } from './foresight';
import {
  assessHistoricalQuality,
  buildCompanyGraphEdges,
  buildCompanyHistory,
  companySignalsFromFacts,
  compareCompanyPeriods,
  correctBusinessEvent,
  detectDuplicateSourceRecord,
  foresightContextFromCompanyHistory,
  ingestSecAdapterRecord,
  ledgerPersistsToHostedDatabase,
  listBusinessEvents,
  macroSurroundingCompanyPeriod,
  normalizeHistoricalRecord,
  requiredHistoricalProvenancePresent,
  resetBusinessEventLedgerForTests,
} from './historical';
import type { ObservedIndicatorSnapshot } from './historical';
import { learningMayMutateAgentAuthority } from './learning';
import { publishingWritesEnabled } from './publishing/policy';
import {
  adapterForProvider,
  evaluateGlobalBrainIngestion,
  providerStatusOf,
  recordSecValidatedRetrieval,
  recordWorldBankValidatedRetrieval,
  resetSecAdapterStatusForTests,
  resetSourceRegistryForTests,
  seedDeclaredBusinessDataProviders,
  sourcesUseServiceRole,
  secAdapterCapabilityStatus,
  secGlobalFabricIsProductionLive,
  worldBankAdapterCapabilityStatus,
  worldBankGlobalFabricIsProductionLive,
} from './sources';
import { evaluateTenantActivation } from './tenant';

const COMPANIES = [
  { ticker: 'AAPL', cik: '0000320193' },
  { ticker: 'MSFT', cik: '0000789019' },
] as const;

type ProofName =
  | 'SEC NETWORK'
  | 'PROVENANCE'
  | 'COMPANY IDENTITY'
  | 'COMPANY HISTORY'
  | 'EVENT FIRST ACCEPT'
  | 'EVENT DUPLICATE DETECTION'
  | 'EVENT CORRECTION APPEND'
  | 'BUSINESS TIME MACHINE'
  | 'FAILURE/SUCCESS INTELLIGENCE'
  | 'FORESIGHT'
  | 'GLOBAL BRAIN GATE'
  | 'WORLD BANK + SEC CROSS-SOURCE'
  | 'DATA QUALITY'
  | 'SECURITY REGRESSION';

const results: Record<ProofName, 'PASS' | 'FAIL'> = {
  'SEC NETWORK': 'FAIL',
  PROVENANCE: 'FAIL',
  'COMPANY IDENTITY': 'FAIL',
  'COMPANY HISTORY': 'FAIL',
  'EVENT FIRST ACCEPT': 'FAIL',
  'EVENT DUPLICATE DETECTION': 'FAIL',
  'EVENT CORRECTION APPEND': 'FAIL',
  'BUSINESS TIME MACHINE': 'FAIL',
  'FAILURE/SUCCESS INTELLIGENCE': 'FAIL',
  FORESIGHT: 'FAIL',
  'GLOBAL BRAIN GATE': 'FAIL',
  'WORLD BANK + SEC CROSS-SOURCE': 'FAIL',
  'DATA QUALITY': 'FAIL',
  'SECURITY REGRESSION': 'FAIL',
};

function fail(name: ProofName, reason: string) {
  results[name] = 'FAIL';
  console.log(`FAIL - ${name}: ${reason}`);
  return false;
}

function pass(name: ProofName, detail?: string) {
  results[name] = 'PASS';
  console.log(`PASS - ${name}${detail ? `: ${detail}` : ''}`);
  return true;
}

export async function runSecRealDataProof() {
  resetSourceRegistryForTests();
  resetBusinessEventLedgerForTests();
  resetSecAdapterStatusForTests();
  seedDeclaredBusinessDataProviders();

  const sec = adapterForProvider('us_sec_edgar');
  const worldBank = adapterForProvider('world_bank_open_data');
  const retrieved: Record<string, unknown>[] = [];

  for (const company of COMPANIES) {
    const response = await sec.fetch({
      providerId: 'us_sec_edgar',
      query: { cik: company.cik, maxFilings: '8' },
    });
    if (!response.allowed) {
      fail('SEC NETWORK', `${company.ticker} fetch denied: ${response.reason}`);
      return finish(false);
    }
    if (response.fabricated) {
      fail('SEC NETWORK', 'Fabricated SEC observations are forbidden.');
      return finish(false);
    }
    retrieved.push(...response.records);
  }

  const identities = retrieved.filter((row) => row.recordType === 'identity');
  const filings = retrieved.filter((row) => row.recordType === 'filing');
  const facts = retrieved.filter((row) => row.recordType === 'fact' && typeof row.value === 'number');
  if (identities.length === 0) {
    fail('SEC NETWORK', 'No SEC company identities retrieved.');
    return finish(false);
  }
  pass('SEC NETWORK', `companies=${identities.length} filings=${filings.length} facts=${facts.length}`);

  console.log('SEC OBSERVATIONS (public EDGAR, no secrets):');
  for (const row of identities) {
    console.log(
      JSON.stringify({
        provider: 'us_sec_edgar',
        kind: 'identity',
        cik: row.cik,
        legalName: row.legalName,
        ticker: row.ticker ?? null,
        sourceRecordId: row.sourceRecordId,
        retrievedAt: row.retrievedAt,
      }),
    );
  }
  for (const row of filings.slice(0, 12)) {
    console.log(
      JSON.stringify({
        provider: 'us_sec_edgar',
        kind: 'filing',
        cik: row.cik,
        form: row.form,
        filingDate: row.filingDate,
        accession: row.accession,
        sourceRecordId: row.sourceRecordId,
        retrievedAt: row.retrievedAt,
      }),
    );
  }
  for (const row of facts.slice(0, 16)) {
    console.log(
      JSON.stringify({
        provider: 'us_sec_edgar',
        kind: 'fact',
        cik: row.cik,
        metric: row.metric,
        period: row.period,
        value: row.value,
        unit: row.unit,
        sourceRecordId: row.sourceRecordId,
        retrievedAt: row.retrievedAt,
      }),
    );
  }

  const unique = sec.deduplicate(retrieved);
  const accepted = [];
  let provenanceOk = true;
  for (const record of unique) {
    const ingested = ingestSecAdapterRecord({ record, adapter: sec, comparableCount: unique.length });
    if (!('accepted' in ingested) || !ingested.accepted) {
      if ('duplicate' in ingested && ingested.duplicate) continue;
      provenanceOk = false;
      fail('PROVENANCE', `ingest rejected: ${'reason' in ingested ? ingested.reason : 'unknown'}`);
      break;
    }
    if (!requiredHistoricalProvenancePresent(ingested.normalized)) {
      provenanceOk = false;
      fail('PROVENANCE', `missing provenance on ${ingested.normalized.sourceRecordId}`);
      break;
    }
    accepted.push(ingested);
  }
  if (provenanceOk && accepted.length > 0) {
    pass('PROVENANCE', `${accepted.length} SEC records normalized with provenance`);
  }

  const firstIdentity = identities[0];
  if (firstIdentity && typeof firstIdentity.cik === 'string' && typeof firstIdentity.legalName === 'string') {
    pass('COMPANY IDENTITY', `${firstIdentity.legalName} CIK ${firstIdentity.cik}`);
  } else {
    fail('COMPANY IDENTITY', 'No authoritative CIK identity retrieved.');
  }

  const appleIdentity = identities.find((row) => row.cik === '0000320193');
  const appleFilings = filings.filter((row) => row.cik === '0000320193');
  const appleFacts = facts.filter((row) => row.cik === '0000320193');
  if (appleIdentity && appleFilings.length > 0) {
    const history = buildCompanyHistory({
      identity: appleIdentity as never,
      filings: appleFilings as never,
      facts: appleFacts as never,
    });
    if ('allowed' in history && history.allowed === false) {
      fail('COMPANY HISTORY', history.reason);
    } else {
      pass('COMPANY HISTORY', `events=${'events' in history ? history.events.length : 0}`);
      const graph = buildCompanyGraphEdges({
        cik: String(appleIdentity.cik),
        legalName: String(appleIdentity.legalName),
        filings: appleFilings.map((item) => ({ sourceRecordId: String(item.sourceRecordId), form: String(item.form) })),
        facts: appleFacts.map((item) => ({
          sourceRecordId: String(item.sourceRecordId),
          metric: String(item.metric),
          period: String(item.period),
        })),
        industry: typeof appleIdentity.sicDescription === 'string' ? appleIdentity.sicDescription : null,
        macroPeriod: typeof appleFacts[0]?.period === 'string' ? String(appleFacts[0].period) : null,
      });
      if ('allowed' in graph) console.log(`GRAPH denied: ${graph.reason}`);
      else console.log(`GRAPH edges=${graph.length} databaseDeployed=false`);
    }
  } else {
    fail('COMPANY HISTORY', 'Need retrieved identity and filings for at least one company.');
  }

  const firstAccepted = accepted[0];
  if (firstAccepted && firstAccepted.accepted) {
    pass('EVENT FIRST ACCEPT', firstAccepted.event.eventId);
    const duplicate = ingestSecAdapterRecord({
      record: unique.find((row) => row.sourceRecordId === firstAccepted.normalized.sourceRecordId) ?? unique[0],
      adapter: sec,
    });
    if (!('duplicate' in duplicate) || duplicate.duplicate !== true || !detectDuplicateSourceRecord(firstAccepted.normalized.sourceId, firstAccepted.normalized.sourceRecordId)) {
      fail('EVENT DUPLICATE DETECTION', 'Identical SEC source record was not detected.');
      fail('EVENT CORRECTION APPEND', 'Skipped because duplicate detection failed.');
    } else {
      pass('EVENT DUPLICATE DETECTION', firstAccepted.normalized.sourceRecordId);
      const corrected = normalizeHistoricalRecord({
        ...firstAccepted.normalized,
        retrievedAt: `${String(firstAccepted.normalized.retrievedAt).slice(0, 19)}Z`,
        payload: { ...firstAccepted.normalized.payload, correction: 'append-only revision' },
      });
      if ('allowed' in corrected) {
        fail('EVENT CORRECTION APPEND', corrected.reason);
      } else {
        const version = correctBusinessEvent(firstAccepted.event.eventId, corrected, new Date().toISOString());
        if (!version.accepted || version.rewritten !== false) {
          fail('EVENT CORRECTION APPEND', 'Correction did not append.');
        } else {
          pass('EVENT CORRECTION APPEND', `events=${listBusinessEvents().length}; hosted=${ledgerPersistsToHostedDatabase()}`);
        }
      }
    }
  } else {
    fail('EVENT FIRST ACCEPT', 'No SEC event accepted.');
  }

  const numericFacts = appleFacts.filter((row) => typeof row.period === 'string') as Array<
    Record<string, unknown> & { metric: string; period: string; value: number; sourceRecordId: string }
  >;
  const companyYears = [...new Set(numericFacts.map((row) => row.period))].sort();
  const yearsWithMetrics = companyYears.filter(
    (year) => new Set(numericFacts.filter((row) => row.period === year).map((row) => row.metric)).size >= 2,
  );
  const periodAYear = yearsWithMetrics[yearsWithMetrics.length - 2] ?? yearsWithMetrics[0];
  const periodBYear = yearsWithMetrics[yearsWithMetrics.length - 1];
  if (!periodAYear || !periodBYear || periodAYear === periodBYear) {
    fail('BUSINESS TIME MACHINE', 'Need two distinct retrieved financial years.');
  } else {
    const toSnap = (row: (typeof numericFacts)[number]): ObservedIndicatorSnapshot => ({
      indicatorId: row.metric,
      indicatorName: row.metric,
      period: row.period,
      value: row.value,
      sourceRecordId: row.sourceRecordId,
    });
    const report = compareCompanyPeriods({
      cik: '0000320193',
      legalName: String(appleIdentity?.legalName ?? 'Apple'),
      periodAYear,
      periodBYear,
      periodA: numericFacts.filter((row) => row.period === periodAYear).map(toSnap),
      periodB: numericFacts.filter((row) => row.period === periodBYear).map(toSnap),
      filingActivityA: appleFilings.filter((row) => String(row.filingDate).startsWith(periodAYear)).map((row) => String(row.form)),
      filingActivityB: appleFilings.filter((row) => String(row.filingDate).startsWith(periodBYear)).map((row) => String(row.form)),
    });
    if ('allowed' in report && report.allowed === false) {
      fail('BUSINESS TIME MACHINE', report.reason);
    } else if (!('destiny' in report) || report.destiny !== false || report.futurePrediction !== false) {
      fail('BUSINESS TIME MACHINE', 'Historical similarity must not be destiny.');
    } else {
      pass('BUSINESS TIME MACHINE', `${periodAYear} vs ${periodBYear}; differences=${report.differences.length}`);
      console.log(JSON.stringify({ periodA: periodAYear, periodB: periodBYear, similarities: report.similarities, differences: report.differences, limitations: report.limitations, confidence: report.confidence }));
    }
  }

  const signals = companySignalsFromFacts({
    facts: numericFacts.map((row) => ({
      metric: row.metric,
      period: row.period,
      value: row.value,
      sourceRecordId: row.sourceRecordId,
    })),
  });
  if (signals.declaredSuccess || signals.declaredDistress || signals.bankruptcyDeclared) {
    fail('FAILURE/SUCCESS INTELLIGENCE', 'Must not declare success, distress, or bankruptcy from these facts alone.');
  } else {
    pass('FAILURE/SUCCESS INTELLIGENCE', `stance=${signals.stance}; certainty=${signals.certainty}`);
  }

  const evidenceRefs = numericFacts.map((row) => row.sourceRecordId);
  const deniedForecast = forecastRequiresEvidence({ evidenceRefs: [] });
  const foresight = foresightContextFromCompanyHistory({
    observed: numericFacts.map((row) => ({
      summary: `${row.metric} ${row.period}=${row.value}`,
      sourceRecordId: row.sourceRecordId,
      value: row.value,
    })),
    inferred: [String(signals.inferred)],
    hypothesized: ['Public SEC financials changed across retrieved periods. This is a possible explanation, not a diagnosis.'],
    recommended: ['Treat this as a historical comparison experiment. Not an investment or trading action.'],
    evidenceRefs,
    confidence: 'low',
  });
  if (deniedForecast.allowed !== false || !('certainty' in foresight.forecast) || foresight.forecast.certainty !== false || foresight.forecast.forecastsAreFacts !== false) {
    fail('FORESIGHT', 'Forecasts must not be treated as facts.');
  } else {
    pass('FORESIGHT', 'observed/inferred/hypothesized/forecast/recommended distinguished; not investment advice');
  }

  const publicOk = evaluateGlobalBrainIngestion({
    category: 'public',
    brainOrigin: 'external_public',
    provenancePresent: true,
    licenseKnown: true,
  });
  const denied =
    evaluateGlobalBrainIngestion({ category: 'public', brainOrigin: 'company', provenancePresent: true, licenseKnown: true }).allowed === false &&
    evaluateGlobalBrainIngestion({ category: 'personal', brainOrigin: 'personal', provenancePresent: true, licenseKnown: true }).allowed === false &&
    evaluateGlobalBrainIngestion({ category: 'secret', brainOrigin: 'external_public', provenancePresent: true, licenseKnown: true }).allowed === false &&
    evaluateGlobalBrainIngestion({ category: 'unknown_provenance', brainOrigin: 'external_public', provenancePresent: true, licenseKnown: true }).allowed === false &&
    evaluateGlobalBrainIngestion({ category: 'public', brainOrigin: 'external_public', provenancePresent: true, licenseKnown: false }).allowed === false;
  if (!publicOk.allowed || !denied) {
    fail('GLOBAL BRAIN GATE', 'Public SEC must be allowed; private/personal/secret/unknown must be denied.');
  } else {
    pass('GLOBAL BRAIN GATE', 'public SEC allowed; Company Brain not used');
  }

  const macro: ObservedIndicatorSnapshot[] = [];
  for (const indicator of [
    { id: 'NY.GDP.MKTP.KD.ZG', name: 'GDP growth' },
    { id: 'FP.CPI.TOTL.ZG', name: 'inflation' },
  ]) {
    const response = await worldBank.fetch({
      providerId: 'world_bank_open_data',
      query: { countryCode: 'US', indicatorId: indicator.id, dateStart: '2018', dateEnd: '2024', perPage: '8' },
    });
    if (!response.allowed) {
      fail('WORLD BANK + SEC CROSS-SOURCE', `macro fetch denied: ${response.reason}`);
      break;
    }
    for (const row of response.records) {
      if (typeof row.period !== 'string') continue;
      macro.push({
        indicatorId: indicator.id,
        indicatorName: indicator.name,
        period: row.period,
        value: typeof row.value === 'number' ? row.value : null,
        sourceRecordId: String(row.sourceRecordId ?? ''),
      });
    }
  }
  if (macro.length > 0) recordWorldBankValidatedRetrieval();
  const overlapping = (yearsWithMetrics ?? []).filter((year) =>
    macro.some((item) => item.period === year || String(item.period).startsWith(year)),
  );
  const companyPeriod = overlapping[overlapping.length - 1];
  if (companyPeriod && macro.length > 0) {
    const context = macroSurroundingCompanyPeriod({
      cik: '0000320193',
      companyPeriod,
      companyFacts: numericFacts
        .filter((row) => row.period === companyPeriod)
        .map((row) => ({ metric: row.metric, value: row.value, sourceRecordId: row.sourceRecordId })),
      macro,
    });
    if (
      'causalClaim' in context &&
      context.causalClaim === false &&
      context.macro.length > 0 &&
      context.macro.every((item) => item.sourceRecordId)
    ) {
      pass('WORLD BANK + SEC CROSS-SOURCE', context.answer);
      console.log(JSON.stringify({ question: context.question, answer: context.answer, limitations: context.limitations }));
    } else {
      fail('WORLD BANK + SEC CROSS-SOURCE', 'Need overlapping World Bank + SEC period with retained provenance and no causal claim.');
    }
  } else if (results['WORLD BANK + SEC CROSS-SOURCE'] !== 'FAIL') {
    fail('WORLD BANK + SEC CROSS-SOURCE', 'Need a company financial year that also exists in retrieved World Bank observations.');
  }

  const quality = assessHistoricalQuality({
    provenanceComplete: true,
    hasValue: facts.length > 0,
    historical: true,
    freshnessLabel: 'aging',
    comparableCount: facts.length,
  });
  if (quality.certainty !== false) {
    fail('DATA QUALITY', 'Quality scores must not claim certainty.');
  } else {
    pass('DATA QUALITY', 'explainable scores; certainty=false');
    console.log(JSON.stringify(quality.findings));
  }

  const securityOk =
    sourcesUseServiceRole() === false &&
    boundedAutonomyEnabled() === false &&
    agentDebuggerCanDeploy() === false &&
    publishingWritesEnabled() === false &&
    evaluateTenantActivation().tenantPersistence === 'blocked' &&
    learningMayMutateAgentAuthority() === false &&
    ledgerPersistsToHostedDatabase() === false &&
    providerStatusOf('us_bls') === 'not_configured' &&
    providerStatusOf('us_fred') === 'not_configured' &&
    providerStatusOf('us_census') === 'not_configured' &&
    worldBankGlobalFabricIsProductionLive() === false &&
    secGlobalFabricIsProductionLive() === false;
  if (!securityOk) fail('SECURITY REGRESSION', 'A 2H-C/2I control was weakened.');
  else pass('SECURITY REGRESSION', 'service_role absent; L4 disabled; Guardian deploy denied; writes denied');

  const core =
    results['SEC NETWORK'] === 'PASS' &&
    results.PROVENANCE === 'PASS' &&
    results['COMPANY IDENTITY'] === 'PASS' &&
    results['COMPANY HISTORY'] === 'PASS' &&
    results['EVENT FIRST ACCEPT'] === 'PASS' &&
    results['EVENT DUPLICATE DETECTION'] === 'PASS' &&
    results['EVENT CORRECTION APPEND'] === 'PASS' &&
    results['BUSINESS TIME MACHINE'] === 'PASS' &&
    results['FAILURE/SUCCESS INTELLIGENCE'] === 'PASS' &&
    results.FORESIGHT === 'PASS' &&
    results['GLOBAL BRAIN GATE'] === 'PASS' &&
    results['WORLD BANK + SEC CROSS-SOURCE'] === 'PASS' &&
    results['DATA QUALITY'] === 'PASS' &&
    results['SECURITY REGRESSION'] === 'PASS';
  if (core) recordSecValidatedRetrieval();
  return finish(core, { companies: identities.length, filings: filings.length, facts: facts.length });
}

function finish(ok: boolean, counts?: { companies: number; filings: number; facts: number }) {
  console.log('');
  console.log(`PHASE 2I-D2 SEC COMPANY INTELLIGENCE: ${ok ? 'PASS' : 'FAIL'}`);
  console.log(`SEC NETWORK: ${results['SEC NETWORK']}`);
  console.log(`COMPANIES RETRIEVED: ${counts?.companies ?? 0}`);
  console.log(`FILINGS RETRIEVED: ${counts?.filings ?? 0}`);
  console.log(`FINANCIAL FACTS: ${counts?.facts ?? 0}`);
  console.log(`PROVENANCE: ${results.PROVENANCE}`);
  console.log(`COMPANY IDENTITY: ${results['COMPANY IDENTITY']}`);
  console.log(`COMPANY HISTORY: ${results['COMPANY HISTORY']}`);
  console.log(`EVENT LEDGER: first=${results['EVENT FIRST ACCEPT']} duplicate=${results['EVENT DUPLICATE DETECTION']} correction=${results['EVENT CORRECTION APPEND']}`);
  console.log(`BUSINESS TIME MACHINE: ${results['BUSINESS TIME MACHINE']}`);
  console.log(`FAILURE/SUCCESS INTELLIGENCE: ${results['FAILURE/SUCCESS INTELLIGENCE']}`);
  console.log(`FORESIGHT: ${results.FORESIGHT}`);
  console.log(`GLOBAL BRAIN GATE: ${results['GLOBAL BRAIN GATE']}`);
  console.log(`WORLD BANK + SEC CROSS-SOURCE: ${results['WORLD BANK + SEC CROSS-SOURCE']}`);
  console.log(`DATA QUALITY: ${results['DATA QUALITY']}`);
  console.log(`World Bank Adapter: ${worldBankAdapterCapabilityStatus()}`);
  console.log(`SEC Adapter: ${secAdapterCapabilityStatus()}`);
  console.log(`Global Data Fabric production-live: ${secGlobalFabricIsProductionLive()}`);
  return { ok, results, counts, secAdapter: secAdapterCapabilityStatus() };
}

const isMain = process.argv[1]?.includes('phase2id2.sec.proof');
if (isMain) {
  const result = await runSecRealDataProof();
  process.exitCode = result.ok ? 0 : 1;
}
