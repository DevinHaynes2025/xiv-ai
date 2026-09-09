import type { SecFactRecord, SecFilingMetadata, SecIdentityRecord } from '../providers/sec-edgar';
import { companyIdentityFromSec, type CompanyIdentity } from './company-identity';
import { financialObservationFromSecFact, type SecFinancialObservation } from './financial-facts';
import { normalizeHistoricalRecord, type NormalizedHistoricalRecord } from './normalize';

export type CompanyHistoryEvent = {
  eventId: string;
  kind: 'sec_filing' | 'financial_metric';
  period: string | null;
  sourceRecordId: string;
  provenanceSourceId: 'us_sec_edgar';
};

export type CompanyFilingTimeline = {
  cik: string;
  filings: readonly SecFilingMetadata[];
};

export type CompanyMetricTimeline = {
  cik: string;
  observations: readonly SecFinancialObservation[];
};

export type CompanyFinancialTimeline = CompanyMetricTimeline;

export type CompanyHistoryEvidence = {
  evidenceId: string;
  sourceId: 'us_sec_edgar';
  summary: string;
};

export type CompanyHistory = {
  identity: CompanyIdentity;
  filings: CompanyFilingTimeline;
  metrics: CompanyMetricTimeline;
  events: readonly CompanyHistoryEvent[];
  evidence: readonly CompanyHistoryEvidence[];
  fabricated: false;
};

export function secEventFromFiling(filing: SecFilingMetadata) {
  return normalizeHistoricalRecord({
    kind: 'sec_filing',
    sourceId: filing.sourceId,
    sourceRecordId: filing.sourceRecordId,
    publisher: filing.publisher,
    originalDate: filing.filingDate,
    retrievedAt: filing.retrievedAt,
    ingestedAt: filing.retrievedAt,
    country: 'US',
    classification: 'public',
    historicalOrRealtime: 'historical',
    usageRights: filing.usageRights,
    licenseType: filing.licenseType,
    entityIds: [filing.cik],
    payload: { form: filing.form, accession: filing.accession },
  });
}

export function secEventFromFact(fact: SecFactRecord) {
  return normalizeHistoricalRecord({
    kind: `financial_metric:${fact.metric}`,
    sourceId: fact.sourceId,
    sourceRecordId: fact.sourceRecordId,
    publisher: fact.publisher,
    originalDate: fact.period,
    retrievedAt: fact.retrievedAt,
    ingestedAt: fact.retrievedAt,
    country: 'US',
    classification: 'public',
    historicalOrRealtime: 'historical',
    usageRights: fact.usageRights,
    licenseType: fact.licenseType,
    entityIds: [fact.cik],
    payload: { metric: fact.metric, value: fact.value, unit: fact.unit, form: fact.form, accession: fact.accession },
  });
}

export function inferAcquisitionFromFilingText(_text: string) {
  void _text;
  return { allowed: false as const, reason: 'Acquisitions are not inferred from weak textual similarity.' };
}

export function buildCompanyHistory(input: {
  identity: SecIdentityRecord;
  filings: readonly SecFilingMetadata[];
  facts: readonly SecFactRecord[];
}): CompanyHistory | { allowed: false; reason: string } {
  const identity = companyIdentityFromSec({
    cik: input.identity.cik,
    legalName: input.identity.legalName,
    ticker: input.identity.ticker,
  });
  if ('allowed' in identity) return identity;
  const observations = input.facts.flatMap((fact) => {
    const mapped = financialObservationFromSecFact(fact);
    return 'allowed' in mapped ? [] : [mapped];
  });
  const events: CompanyHistoryEvent[] = [];
  const evidence: CompanyHistoryEvidence[] = [
    {
      evidenceId: identity.evidence[0]?.evidenceId ?? identity.identityId,
      sourceId: 'us_sec_edgar',
      summary: `SEC identity ${identity.sec?.cik}`,
    },
  ];
  for (const filing of input.filings) {
    const normalized = secEventFromFiling(filing);
    if ('allowed' in normalized) continue;
    events.push({
      eventId: normalized.eventId,
      kind: 'sec_filing',
      period: filing.filingDate,
      sourceRecordId: filing.sourceRecordId,
      provenanceSourceId: 'us_sec_edgar',
    });
    evidence.push({
      evidenceId: filing.sourceRecordId,
      sourceId: 'us_sec_edgar',
      summary: `${filing.form} filed ${filing.filingDate}`,
    });
  }
  for (const observation of observations) {
    events.push({
      eventId: observation.observationId,
      kind: 'financial_metric',
      period: observation.period,
      sourceRecordId: observation.sourceRecordId,
      provenanceSourceId: 'us_sec_edgar',
    });
    evidence.push({
      evidenceId: observation.sourceRecordId,
      sourceId: 'us_sec_edgar',
      summary: `${observation.metric} ${observation.period}=${observation.value} ${observation.unit}`,
    });
  }
  return {
    identity,
    filings: { cik: input.identity.cik, filings: input.filings },
    metrics: { cik: input.identity.cik, observations },
    events,
    evidence,
    fabricated: false,
  };
}

export function normalizedSecEvents(history: CompanyHistory): NormalizedHistoricalRecord[] {
  const records: NormalizedHistoricalRecord[] = [];
  for (const filing of history.filings.filings) {
    const event = secEventFromFiling(filing);
    if (!('allowed' in event)) records.push(event);
  }
  return records;
}
