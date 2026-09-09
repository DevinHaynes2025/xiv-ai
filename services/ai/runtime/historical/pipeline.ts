import { forecastRequiresEvidence } from '../foresight/provider';
import { createLearningLesson, learningMayMutateAgentAuthority } from '../learning/cycle';
import { nowIso } from '../actions';
import type { BusinessDataAdapter } from '../sources/adapter';
import { adapterForProvider } from '../sources/adapters';
import { canIngestFromProvider } from '../sources/registry';
import { evaluateGlobalBrainIngestion } from '../sources/policy';
import { acceptBusinessEvent } from './ledger';
import { macroKindFromIndicator } from './macro';
import { normalizeHistoricalRecord } from './normalize';
import { assessHistoricalQuality } from './quality';

export const HISTORICAL_FORESIGHT_PIPELINE = [
  'source',
  'adapter',
  'validation',
  'provenance',
  'normalization',
  'event_ledger',
  'data_quality',
  'entity_resolution',
  'historical_similarity',
  'foresight_context',
] as const;

export function ingestWorldBankAdapterRecord(input: {
  record: Record<string, unknown>;
  adapter: BusinessDataAdapter;
  comparableCount?: number;
}) {
  const validated = input.adapter.validate(input.record);
  if (!validated.ok) return { allowed: false as const, reason: validated.reason, stage: 'validation' as const };
  const classification = input.adapter.classify(input.record);
  if (classification !== 'public') {
    return { allowed: false as const, reason: 'World Bank proof accepts only public classification.', stage: 'classify' as const };
  }
  const provenance = input.adapter.attachProvenance(input.record);
  if ('allowed' in provenance) {
    return { ...provenance, stage: 'provenance' as const };
  }
  const indicatorId = String(input.record.indicatorId ?? '');
  const normalized = normalizeHistoricalRecord({
    kind: macroKindFromIndicator(indicatorId),
    sourceId: provenance.sourceId,
    sourceRecordId: provenance.sourceRecordId,
    publisher: provenance.publisher,
    originalDate: String(input.record.period ?? '') || null,
    retrievedAt: provenance.retrievedAt,
    ingestedAt: nowIso(),
    country: String(input.record.countryCode ?? '') || null,
    classification: 'public',
    historicalOrRealtime: 'historical',
    usageRights: provenance.usageRights,
    licenseType: provenance.licenseType,
    payload: {
      indicatorId,
      indicatorName: input.record.indicatorName ?? null,
      value: typeof input.record.value === 'number' ? input.record.value : null,
      freshness: input.adapter.recordFreshness(input.record),
    },
  });
  if ('allowed' in normalized) return { ...normalized, stage: 'normalization' as const };
  const quality = assessHistoricalQuality({
    provenanceComplete: true,
    hasValue: typeof input.record.value === 'number',
    historical: true,
    freshnessLabel: input.adapter.recordFreshness(input.record),
    comparableCount: input.comparableCount,
  });
  const accepted = acceptBusinessEvent(normalized, nowIso());
  return {
    ...accepted,
    normalized,
    quality,
    pipeline: HISTORICAL_FORESIGHT_PIPELINE,
    autonomousDecision: false as const,
    stage: 'event_ledger' as const,
  };
}

export function ingestSecAdapterRecord(input: {
  record: Record<string, unknown>;
  adapter: BusinessDataAdapter;
  comparableCount?: number;
}) {
  const validated = input.adapter.validate(input.record);
  if (!validated.ok) return { allowed: false as const, reason: validated.reason, stage: 'validation' as const };
  if (input.adapter.classify(input.record) !== 'public') {
    return { allowed: false as const, reason: 'SEC proof accepts only public classification.', stage: 'classify' as const };
  }
  const provenance = input.adapter.attachProvenance(input.record);
  if ('allowed' in provenance) {
    return { ...provenance, stage: 'provenance' as const };
  }
  const kind =
    input.record.recordType === 'filing'
      ? 'sec_filing'
      : input.record.recordType === 'fact'
        ? `financial_metric:${String(input.record.metric ?? 'unknown')}`
        : 'sec_identity';
  const normalized = normalizeHistoricalRecord({
    kind,
    sourceId: provenance.sourceId,
    sourceRecordId: provenance.sourceRecordId,
    publisher: provenance.publisher,
    originalDate:
      [input.record.originalDate, input.record.filingDate, input.record.period, input.record.retrievedAt, provenance.retrievedAt]
        .map((value) => String(value ?? '').trim())
        .find((value) => value.length > 0) ?? null,
    retrievedAt: provenance.retrievedAt,
    ingestedAt: nowIso(),
    country: 'US',
    classification: 'public',
    historicalOrRealtime: 'historical',
    usageRights: provenance.usageRights,
    licenseType: provenance.licenseType,
    entityIds: input.record.cik ? [String(input.record.cik)] : [],
    payload: {
      recordType: input.record.recordType ?? null,
      metric: input.record.metric ?? null,
      value: typeof input.record.value === 'number' ? input.record.value : null,
      form: input.record.form ?? null,
      accession: input.record.accession ?? null,
      ticker: input.record.ticker ?? null,
      legalName: input.record.legalName ?? null,
    },
  });
  if ('allowed' in normalized) return { ...normalized, stage: 'normalization' as const };
  const quality = assessHistoricalQuality({
    provenanceComplete: true,
    hasValue: typeof input.record.value === 'number' || input.record.recordType === 'identity' || input.record.recordType === 'filing',
    historical: true,
    freshnessLabel: input.adapter.recordFreshness(input.record),
    comparableCount: input.comparableCount,
  });
  const accepted = acceptBusinessEvent(normalized, nowIso());
  return {
    ...accepted,
    normalized,
    quality,
    pipeline: HISTORICAL_FORESIGHT_PIPELINE,
    autonomousDecision: false as const,
    stage: 'event_ledger' as const,
  };
}

export function ingestPublicObservation(input: {
  providerId: string;
  kind: string;
  sourceId: string;
  sourceRecordId: string;
  publisher: string;
  retrievedAt: string;
  licenseType: string;
  usageRights: string;
  payload?: Record<string, unknown>;
  country?: string | null;
}) {
  const ingest = canIngestFromProvider(input.providerId);
  if (!ingest.allowed) return ingest;
  const normalized = normalizeHistoricalRecord({
    kind: input.kind,
    sourceId: input.sourceId,
    sourceRecordId: input.sourceRecordId,
    publisher: input.publisher,
    retrievedAt: input.retrievedAt,
    ingestedAt: nowIso(),
    licenseType: input.licenseType,
    usageRights: input.usageRights,
    country: input.country ?? null,
    payload: input.payload,
  });
  if ('allowed' in normalized) return normalized;
  const quality = assessHistoricalQuality({
    provenanceComplete: true,
    hasValue: input.payload?.value != null,
    historical: true,
  });
  const accepted = acceptBusinessEvent(normalized, nowIso());
  return { ...accepted, quality, pipeline: HISTORICAL_FORESIGHT_PIPELINE, autonomousDecision: false as const };
}

export function foresightContextFromLedger(evidenceRefs: readonly string[], confidence: 'low' | 'medium' | 'high' | 'unknown') {
  const forecast = forecastRequiresEvidence({
    evidenceRefs,
    confidence: confidence === 'unknown' ? undefined : confidence,
  });
  return {
    ...forecast,
    stances: ['observed', 'inferred', 'hypothesized', 'forecast', 'recommended'] as const,
    productionAutonomousDecisions: false as const,
  };
}

export function foresightContextFromWorldBankComparison(input: {
  observed: readonly { summary: string; sourceRecordId: string; value: number | null }[];
  inferred: readonly string[];
  hypothesized: readonly string[];
  recommended: readonly string[];
  evidenceRefs: readonly string[];
  confidence: 'low' | 'medium' | 'high';
}) {
  const forecast = forecastRequiresEvidence({
    evidenceRefs: input.evidenceRefs,
    confidence: input.confidence,
  });
  return {
    observed: input.observed.map((item) => ({
      stance: 'observed' as const,
      summary: item.summary,
      sourceRecordId: item.sourceRecordId,
      value: item.value,
      fabricated: false as const,
    })),
    inferred: input.inferred.map((summary) => ({ stance: 'inferred' as const, summary })),
    hypothesized: input.hypothesized.map((summary) => ({ stance: 'hypothesized' as const, summary })),
    forecast: forecast.allowed
      ? {
          stance: 'forecast' as const,
          summary: 'Possible future macro scenario conditioned on public historical evidence. Not a fact.',
          allowed: true as const,
          certainty: false as const,
          forecastsAreFacts: false as const,
          confidence: input.confidence,
          evidenceRefs: input.evidenceRefs,
        }
      : forecast,
    recommended: input.recommended.map((summary) => ({
      stance: 'recommended' as const,
      summary,
      executed: false as const,
    })),
    productionAutonomousDecisions: false as const,
    productionForesightEnabled: false as const,
  };
}

export function foresightContextFromCompanyHistory(input: {
  observed: readonly { summary: string; sourceRecordId: string; value: number | null }[];
  inferred: readonly string[];
  hypothesized: readonly string[];
  recommended: readonly string[];
  evidenceRefs: readonly string[];
  confidence: 'low' | 'medium' | 'high';
}) {
  const forecast = forecastRequiresEvidence({
    evidenceRefs: input.evidenceRefs,
    confidence: input.confidence,
  });
  return {
    observed: input.observed.map((item) => ({
      stance: 'observed' as const,
      summary: item.summary,
      sourceRecordId: item.sourceRecordId,
      value: item.value,
      fabricated: false as const,
    })),
    inferred: input.inferred.map((summary) => ({ stance: 'inferred' as const, summary })),
    hypothesized: input.hypothesized.map((summary) => ({ stance: 'hypothesized' as const, summary })),
    forecast: forecast.allowed
      ? {
          stance: 'forecast' as const,
          summary: 'Possible company future scenario conditioned on public SEC evidence. Not a fact. Not an investment recommendation.',
          allowed: true as const,
          certainty: false as const,
          forecastsAreFacts: false as const,
          investmentAdvice: false as const,
          confidence: input.confidence,
          evidenceRefs: input.evidenceRefs,
        }
      : forecast,
    recommended: input.recommended.map((summary) => ({
      stance: 'recommended' as const,
      summary,
      executed: false as const,
      trading: false as const,
    })),
    productionAutonomousDecisions: false as const,
    productionForesightEnabled: false as const,
  };
}

export function learningFromAcceptedEvent(input: {
  eventId: string;
  sourceId: string;
  summary: string;
}) {
  if (learningMayMutateAgentAuthority()) {
    return { allowed: false as const, reason: 'Learning cannot alter agent authority.' };
  }
  return createLearningLesson({
    evidence: [{ evidenceId: input.eventId, summary: input.summary, sourceId: input.sourceId }],
    scope: { organizationId: null, universeId: null, brain: 'global' },
    timestamp: nowIso(),
    outcome: null,
  });
}

export function globalIngestGateForExternalPublic(input: { provenancePresent: boolean; licenseKnown: boolean }) {
  return evaluateGlobalBrainIngestion({
    category: 'public',
    brainOrigin: 'external_public',
    provenancePresent: input.provenancePresent,
    licenseKnown: input.licenseKnown,
  });
}

export function adapterFetchDeniedIfUnconfigured(providerId: string) {
  return adapterForProvider(providerId).health();
}
