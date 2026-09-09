/**
 * Phase 2I-D World Bank real-data proof.
 * Not part of npm run test:runtime. Requires network.
 * Never fabricates observations. Never uses service_role. Never writes hosted tables.
 */
import { boundedAutonomyEnabled } from './authority';
import { agentDebuggerCanDeploy } from './diagnostics';
import { forecastRequiresEvidence } from './foresight';
import {
  compareObservedPeriods,
  correctBusinessEvent,
  detectDuplicateSourceRecord,
  foresightContextFromWorldBankComparison,
  ingestWorldBankAdapterRecord,
  ledgerPersistsToHostedDatabase,
  listBusinessEvents,
  normalizeHistoricalRecord,
  requiredHistoricalProvenancePresent,
  resetBusinessEventLedgerForTests,
  toGdpObservation,
  toInflationObservation,
  toRegionalEconomicObservation,
} from './historical';
import type { ObservedIndicatorSnapshot } from './historical';
import { learningMayMutateAgentAuthority } from './learning';
import { WORLD_BANK_PROVIDER_STATUS } from './providers/world-bank';
import { publishingWritesEnabled } from './publishing/policy';
import {
  adapterForProvider,
  catalogSecurityIsSound,
  evaluateGlobalBrainIngestion,
  recordWorldBankValidatedRetrieval,
  resetSourceRegistryForTests,
  resetWorldBankAdapterStatusForTests,
  seedDeclaredBusinessDataProviders,
  sourcesUseServiceRole,
  worldBankAdapterCapabilityStatus,
  worldBankGlobalFabricIsProductionLive,
} from './sources';
import { evaluateTenantActivation } from './tenant';

const INDICATORS = [
  { id: 'NY.GDP.MKTP.CD', label: 'GDP' },
  { id: 'NY.GDP.MKTP.KD.ZG', label: 'GDP growth' },
  { id: 'FP.CPI.TOTL.ZG', label: 'inflation' },
] as const;

type ProofName =
  | 'TYPECHECK_NARROWING'
  | 'WORLD BANK NETWORK'
  | 'PROVENANCE'
  | 'NORMALIZATION'
  | 'EVENT FIRST ACCEPT'
  | 'EVENT DUPLICATE DETECTION'
  | 'EVENT CORRECTION APPEND'
  | 'MACRO INTELLIGENCE'
  | 'BUSINESS TIME MACHINE'
  | 'FORESIGHT CONTEXT'
  | 'GLOBAL BRAIN GATE'
  | 'DATA QUALITY'
  | 'SECURITY REGRESSION';

const results: Record<ProofName, 'PASS' | 'FAIL'> = {
  TYPECHECK_NARROWING: 'FAIL',
  'WORLD BANK NETWORK': 'FAIL',
  PROVENANCE: 'FAIL',
  NORMALIZATION: 'FAIL',
  'EVENT FIRST ACCEPT': 'FAIL',
  'EVENT DUPLICATE DETECTION': 'FAIL',
  'EVENT CORRECTION APPEND': 'FAIL',
  'MACRO INTELLIGENCE': 'FAIL',
  'BUSINESS TIME MACHINE': 'FAIL',
  'FORESIGHT CONTEXT': 'FAIL',
  'GLOBAL BRAIN GATE': 'FAIL',
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

export async function runWorldBankRealDataProof() {
  resetSourceRegistryForTests();
  resetBusinessEventLedgerForTests();
  resetWorldBankAdapterStatusForTests();
  seedDeclaredBusinessDataProviders();

  const adapter = adapterForProvider('world_bank_open_data');
  const missing = adapter.attachProvenance({ countryCode: 'US' });
  if (!('allowed' in missing) || missing.allowed !== false) {
    fail('TYPECHECK_NARROWING', 'Missing provenance was not rejected by the adapter.');
  } else {
    pass('TYPECHECK_NARROWING', 'denied results are discriminated from observations');
  }

  const retrieved: Record<string, unknown>[] = [];
  for (const indicator of INDICATORS) {
    const response = await adapter.fetch({
      providerId: 'world_bank_open_data',
      query: {
        countryCode: 'US',
        indicatorId: indicator.id,
        dateStart: '2015',
        dateEnd: '2023',
        perPage: '8',
      },
    });
    if (!response.allowed) {
      fail('WORLD BANK NETWORK', `${indicator.label} fetch denied: ${response.reason}`);
      return finish(false);
    }
    if (response.fabricated) {
      fail('WORLD BANK NETWORK', 'Fabricated observations are forbidden.');
      return finish(false);
    }
    retrieved.push(...response.records);
  }

  if (retrieved.length === 0) {
    fail('WORLD BANK NETWORK', 'No observations retrieved.');
    return finish(false);
  }

  console.log('WORLD BANK OBSERVATIONS (public, attributed, not secrets):');
  for (const record of retrieved) {
    console.log(
      JSON.stringify({
        provider: 'world_bank_open_data',
        indicator: record.indicatorId,
        indicatorName: record.indicatorName,
        country: record.countryCode,
        period: record.period,
        value: record.value ?? null,
        retrievedAt: record.retrievedAt,
        sourceRecordId: record.sourceRecordId,
        freshness: record.freshness,
        usageRights: 'CC-BY-4.0 public open data. Attribution required.',
      }),
    );
  }
  pass('WORLD BANK NETWORK', `${retrieved.length} bounded U.S. observations`);

  const unique = adapter.deduplicate(retrieved);
  const firstNumeric = unique.find((row) => typeof row.value === 'number');
  if (!firstNumeric) {
    fail('PROVENANCE', 'No numeric World Bank value was retrieved. Null rows are not fabricated.');
    return finish(false);
  }

  let provenanceOk = true;
  let qualityOk = true;
  const acceptedEvents = [];
  for (const record of unique) {
    const ingested = ingestWorldBankAdapterRecord({
      record,
      adapter,
      comparableCount: unique.length,
    });
    if (!('accepted' in ingested) || !ingested.accepted) {
      if ('duplicate' in ingested && ingested.duplicate) continue;
      provenanceOk = false;
      fail('PROVENANCE', `ingest rejected: ${'reason' in ingested ? ingested.reason : 'unknown'}`);
      break;
    }
    if (!requiredHistoricalProvenancePresent(ingested.normalized)) {
      provenanceOk = false;
      fail('PROVENANCE', `missing required provenance on ${ingested.normalized.sourceRecordId}`);
      break;
    }
    if (ingested.quality.certainty !== false) qualityOk = false;
    acceptedEvents.push(ingested);
  }

  const missingProvenance = normalizeHistoricalRecord({
    kind: 'gdp',
    sourceId: 'world_bank_open_data',
    publisher: 'World Bank',
    retrievedAt: String(firstNumeric.retrievedAt ?? ''),
    ingestedAt: String(firstNumeric.retrievedAt ?? ''),
    licenseType: 'CC-BY-4.0',
    usageRights: 'attribution required',
  });
  if (!('allowed' in missingProvenance) || missingProvenance.allowed !== false) {
    provenanceOk = false;
    fail('PROVENANCE', 'Record without sourceRecordId was not rejected.');
  }
  if (provenanceOk && acceptedEvents.length > 0) {
    pass('PROVENANCE', `${acceptedEvents.length} events contain required provenance fields`);
  }

  let normalizationOk = provenanceOk && acceptedEvents.length > 0;
  if (normalizationOk) {
    pass('NORMALIZATION', `${acceptedEvents.length} records normalized with provenance`);
  } else if (results.NORMALIZATION !== 'FAIL') {
    fail('NORMALIZATION', 'No normalized records with required provenance.');
  }

  const firstAccepted = acceptedEvents[0];
  if (firstAccepted && firstAccepted.accepted) {
    pass('EVENT FIRST ACCEPT', firstAccepted.event.eventId);
  } else {
    fail('EVENT FIRST ACCEPT', 'First real normalized event was not accepted.');
  }
  if (firstAccepted && firstAccepted.accepted) {
    const duplicate = ingestWorldBankAdapterRecord({
      record: unique.find((row) => row.sourceRecordId === firstAccepted.normalized.sourceRecordId) ?? unique[0],
      adapter,
      comparableCount: unique.length,
    });
    if (!('duplicate' in duplicate) || duplicate.duplicate !== true || !detectDuplicateSourceRecord(firstAccepted.normalized.sourceId, firstAccepted.normalized.sourceRecordId)) {
      fail('EVENT DUPLICATE DETECTION', 'Identical source event was not detected as duplicate.');
      fail('EVENT CORRECTION APPEND', 'Skipped because duplicate detection failed.');
    } else {
      pass('EVENT DUPLICATE DETECTION', firstAccepted.normalized.sourceRecordId);
      const corrected = normalizeHistoricalRecord({
        ...firstAccepted.normalized,
        payload: { ...firstAccepted.normalized.payload, correction: 'append-only revision' },
        retrievedAt: `${String(firstAccepted.normalized.retrievedAt).slice(0, 19)}Z`,
      });
      if ('allowed' in corrected) {
        fail('EVENT CORRECTION APPEND', corrected.reason);
      } else {
        const version = correctBusinessEvent(firstAccepted.event.eventId, corrected, new Date().toISOString());
        if (!version.accepted || version.rewritten !== false || version.event.supersedes !== firstAccepted.event.eventId) {
          fail('EVENT CORRECTION APPEND', 'Correction did not append a new version.');
        } else {
          pass('EVENT CORRECTION APPEND', `supersedes=${firstAccepted.event.eventId}; events=${listBusinessEvents().length}; hosted=${ledgerPersistsToHostedDatabase()}`);
        }
      }
    }
  }

  const numeric = unique.filter((row) => typeof row.value === 'number' && typeof row.period === 'string') as Array<
    Record<string, unknown> & { value: number; period: string; indicatorId: string; indicatorName: string; sourceRecordId: string }
  >;
  const years = [...new Set(numeric.map((row) => row.period))].sort();
  const periodAYear = years[0];
  const periodBYear = years[years.length - 1];
  let timeMachineOk = false;
  if (!periodAYear || !periodBYear || periodAYear === periodBYear) {
    fail('BUSINESS TIME MACHINE', 'Need two distinct observed years. No future years were invented.');
    fail('MACRO INTELLIGENCE', 'Skipped because two historical periods were not observed.');
  } else {
    const toSnapshot = (row: (typeof numeric)[number]): ObservedIndicatorSnapshot => ({
      indicatorId: row.indicatorId,
      indicatorName: String(row.indicatorName),
      period: row.period,
      value: row.value,
      sourceRecordId: row.sourceRecordId,
    });
    const report = compareObservedPeriods({
      periodAYear,
      periodBYear,
      periodA: numeric.filter((row) => row.period === periodAYear).map(toSnapshot),
      periodB: numeric.filter((row) => row.period === periodBYear).map(toSnapshot),
    });
    if ('allowed' in report && report.allowed === false) {
      fail('BUSINESS TIME MACHINE', report.reason);
    } else if (!('destiny' in report) || report.destiny !== false || report.futurePrediction !== false || report.stance !== 'hypothesized') {
      fail('BUSINESS TIME MACHINE', 'Report must remain a historical scenario, not destiny.');
    } else if (!report.periodA || !report.periodB || report.evidence.length === 0) {
      fail('BUSINESS TIME MACHINE', 'Report missing period A/B or source evidence.');
    } else {
      timeMachineOk = true;
      pass('BUSINESS TIME MACHINE', `${periodAYear} vs ${periodBYear}; similarities=${report.similarities.length}; differences=${report.differences.length}`);
      const gdpA = numeric.find((row) => row.period === periodAYear && row.indicatorId === 'NY.GDP.MKTP.CD');
      const gdpB = numeric.find((row) => row.period === periodBYear && row.indicatorId === 'NY.GDP.MKTP.CD');
      const inflationA = numeric.find((row) => row.period === periodAYear && row.indicatorId === 'FP.CPI.TOTL.ZG');
      const inflationB = numeric.find((row) => row.period === periodBYear && row.indicatorId === 'FP.CPI.TOTL.ZG');
      const provenance = {
        sourceId: 'world_bank_open_data',
        publisher: 'World Bank',
        retrievedAt: String(firstNumeric.retrievedAt),
        usageRights: 'Public open data. Attribution required.',
        licenseType: 'CC-BY-4.0',
        sourceRecordId: String(firstNumeric.sourceRecordId),
      };
      if (gdpA) {
        const gdp = toGdpObservation({
          seriesId: gdpA.indicatorId,
          period: gdpA.period,
          value: gdpA.value,
          provenance: { ...provenance, sourceRecordId: gdpA.sourceRecordId },
        });
        console.log(`MACRO GDPObservation period=${gdp.period} value=${gdp.value} live=${gdp.live}`);
      }
      if (inflationA) {
        const inflation = toInflationObservation({
          seriesId: inflationA.indicatorId,
          period: inflationA.period,
          value: inflationA.value,
          provenance: { ...provenance, sourceRecordId: inflationA.sourceRecordId },
        });
        console.log(`MACRO InflationObservation period=${inflation.period} value=${inflation.value} live=${inflation.live}`);
      }
      const regional = toRegionalEconomicObservation({
        country: 'US',
        seriesId: 'NY.GDP.MKTP.CD',
        period: periodBYear,
        value: gdpB?.value ?? null,
        provenance: { ...provenance, sourceRecordId: String(gdpB?.sourceRecordId ?? firstNumeric.sourceRecordId) },
      });
      console.log(`MACRO RegionalEconomicObservation country=${regional.country} period=${regional.period} live=${regional.live}`);
      void inflationB;
      if (gdpA && inflationA && regional.country === 'US' && regional.live === false) {
        pass('MACRO INTELLIGENCE', `GDP ${gdpA.period}/${gdpB?.period ?? 'n/a'}; inflation ${inflationA.period}; regional US ${periodBYear}`);
      } else {
        fail('MACRO INTELLIGENCE', 'Missing GDP, inflation, or regional observation from retrieved World Bank values.');
      }

      const evidenceRefs = report.evidence.map((item) => item.evidenceId);
      const deniedForecast = forecastRequiresEvidence({ evidenceRefs: [] });
      const foresight = foresightContextFromWorldBankComparison({
        observed: numeric.map((row) => ({
          summary: `${row.indicatorName} ${row.period}=${row.value}`,
          sourceRecordId: row.sourceRecordId,
          value: row.value,
        })),
        inferred: report.differences.map((item) => item.summary),
        hypothesized: [
          'Public macro conditions differed across the two observed U.S. periods. This is a possible explanation, not a company diagnosis.',
        ],
        recommended: [
          'Treat this as a historical comparison experiment only. Do not execute a business action from this proof.',
        ],
        evidenceRefs,
        confidence: 'low',
      });
      if (
        deniedForecast.allowed !== false ||
        !('certainty' in foresight.forecast) ||
        foresight.forecast.certainty !== false ||
        foresight.forecast.forecastsAreFacts !== false
      ) {
        fail('FORESIGHT CONTEXT', 'Forecasts must not be treated as facts.');
      } else if (foresight.observed.length === 0 || foresight.inferred.length === 0) {
        fail('FORESIGHT CONTEXT', 'Observed/inferred stances missing.');
      } else {
        pass('FORESIGHT CONTEXT', 'observed/inferred/hypothesized/forecast/recommended distinguished');
        console.log(
          JSON.stringify({
            observedCount: foresight.observed.length,
            inferredCount: foresight.inferred.length,
            hypothesized: foresight.hypothesized,
            forecast: foresight.forecast,
            recommended: foresight.recommended,
          }),
        );
      }
    }
  }
  if (!timeMachineOk && results['BUSINESS TIME MACHINE'] !== 'FAIL') {
    fail('BUSINESS TIME MACHINE', 'Comparison did not complete.');
  }

  const publicOk = evaluateGlobalBrainIngestion({
    category: 'public',
    brainOrigin: 'external_public',
    provenancePresent: true,
    licenseKnown: true,
  });
  const deniedCategories = ['private_company', 'personal', 'secret', 'unknown_license', 'unknown_provenance'] as const;
  const deniedAll = deniedCategories.every(
    (category) =>
      evaluateGlobalBrainIngestion({
        category,
        brainOrigin: 'external_public',
        provenancePresent: true,
        licenseKnown: category !== 'unknown_license',
      }).allowed === false,
  );
  const companyDenied = evaluateGlobalBrainIngestion({
    category: 'public',
    brainOrigin: 'company',
    provenancePresent: true,
    licenseKnown: true,
  });
  if (!publicOk.allowed || !deniedAll || companyDenied.allowed) {
    fail('GLOBAL BRAIN GATE', 'Public World Bank must be allowed; private/personal/secret/unknown must be denied.');
  } else {
    pass('GLOBAL BRAIN GATE', 'public World Bank allowed; Company Brain not used');
  }

  const quality = firstAccepted && 'quality' in firstAccepted ? firstAccepted.quality : null;
  if (!quality || quality.certainty !== false) {
    fail('DATA QUALITY', 'Quality scores must not claim certainty.');
  } else {
    const dims = quality.findings.map((item) => item.dimension).sort().join(',');
    if (dims !== 'completeness,consistency,freshness,provenance,reliability') {
      fail('DATA QUALITY', `Unexpected dimensions: ${dims}`);
    } else {
      pass('DATA QUALITY', 'explainable scores; certainty=false');
      console.log(JSON.stringify(quality.findings));
    }
  }

  const securityOk =
    sourcesUseServiceRole() === false &&
    boundedAutonomyEnabled() === false &&
    agentDebuggerCanDeploy() === false &&
    publishingWritesEnabled() === false &&
    evaluateTenantActivation().tenantPersistence === 'blocked' &&
    learningMayMutateAgentAuthority() === false &&
    companyDenied.allowed === false &&
    ledgerPersistsToHostedDatabase() === false &&
    WORLD_BANK_PROVIDER_STATUS === 'not_configured' &&
    catalogSecurityIsSound();
  if (!securityOk) {
    fail('SECURITY REGRESSION', 'A 2H-C/2I control was weakened.');
  } else {
    pass('SECURITY REGRESSION', 'service_role absent; L4 disabled; Guardian deploy denied; writes denied');
  }

  const corePassed =
    results['WORLD BANK NETWORK'] === 'PASS' &&
    results.PROVENANCE === 'PASS' &&
    results.NORMALIZATION === 'PASS' &&
    results['EVENT FIRST ACCEPT'] === 'PASS' &&
    results['EVENT DUPLICATE DETECTION'] === 'PASS' &&
    results['EVENT CORRECTION APPEND'] === 'PASS' &&
    results['MACRO INTELLIGENCE'] === 'PASS' &&
    results['BUSINESS TIME MACHINE'] === 'PASS' &&
    results['FORESIGHT CONTEXT'] === 'PASS' &&
    results['GLOBAL BRAIN GATE'] === 'PASS';
  if (corePassed) {
    recordWorldBankValidatedRetrieval();
  }
  return finish(corePassed && results['SECURITY REGRESSION'] === 'PASS' && results['DATA QUALITY'] === 'PASS');
}

function finish(ok: boolean) {
  console.log('');
  console.log(`PHASE 2I-D REAL DATA PROOF: ${ok ? 'PASS' : 'FAIL'}`);
  console.log(`WORLD BANK NETWORK: ${results['WORLD BANK NETWORK']}`);
  console.log(`PROVENANCE: ${results.PROVENANCE}`);
  console.log(`NORMALIZATION: ${results.NORMALIZATION}`);
  console.log(`DATA QUALITY: ${results['DATA QUALITY']}`);
  console.log(`EVENT FIRST ACCEPT: ${results['EVENT FIRST ACCEPT']}`);
  console.log(`EVENT DUPLICATE DETECTION: ${results['EVENT DUPLICATE DETECTION']}`);
  console.log(`EVENT CORRECTION APPEND: ${results['EVENT CORRECTION APPEND']}`);
  console.log(`MACRO INTELLIGENCE: ${results['MACRO INTELLIGENCE']}`);
  console.log(`BUSINESS TIME MACHINE: ${results['BUSINESS TIME MACHINE']}`);
  console.log(`FORESIGHT CONTEXT: ${results['FORESIGHT CONTEXT']}`);
  console.log(`GLOBAL BRAIN GATE: ${results['GLOBAL BRAIN GATE']}`);
  console.log(`World Bank Adapter: ${worldBankAdapterCapabilityStatus()}`);
  console.log(`Global Data Fabric production-live: ${worldBankGlobalFabricIsProductionLive()}`);
  return { ok, results, worldBankAdapter: worldBankAdapterCapabilityStatus() };
}

const isMain = process.argv[1]?.includes('phase2id.worldbank.proof');
if (isMain) {
  const result = await runWorldBankRealDataProof();
  process.exitCode = result.ok ? 0 : 1;
}
