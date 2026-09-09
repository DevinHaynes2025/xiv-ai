/**
 * Historical Business Intelligence contracts.
 * 2I-A types remain conservative. Real adapters live in runtime/sources.
 * No scraping. No unauthorized full-text ingestion.
 */
export type HistoricalOrRealtime = 'historical' | 'realtime';
export type OriginalOrDerived = 'original' | 'derived';

export type HistoricalProvenance = {
  sourceId: string;
  publisher: string;
  originalDate: string | null;
  ingestedAt: string;
  licenseType: string;
  usageRights: string;
  country: string | null;
  industry: string | null;
  entityIds: readonly string[];
  reliability: 'unknown' | 'low' | 'medium' | 'high';
  classification: 'public' | 'licensed' | 'restricted';
  originalOrDerived: OriginalOrDerived;
  historicalOrRealtime: HistoricalOrRealtime;
  contentHash: string | null;
};

export type HistoricalBusinessSource = {
  sourceId: string;
  name: string;
  authorized: boolean;
  configured: false;
  bulkScraping: false;
};

export type HistoricalBusinessDocument = {
  documentId: string;
  provenance: HistoricalProvenance;
};

export type HistoricalBusinessEvent = {
  eventId: string;
  kind: string;
  provenance: HistoricalProvenance;
};

export type HistoricalCompanyOutcome = {
  outcomeId: string;
  entityId: string;
  result: 'success' | 'failure' | 'unknown';
  provenance: HistoricalProvenance;
};

export type HistoricalFinancialMetric = { metricId: string; provenance: HistoricalProvenance };
export type HistoricalBankruptcyEvent = { eventId: string; provenance: HistoricalProvenance };
export type HistoricalFundingEvent = { eventId: string; provenance: HistoricalProvenance };
export type HistoricalAcquisitionEvent = { eventId: string; provenance: HistoricalProvenance };
export type HistoricalExpansionEvent = { eventId: string; provenance: HistoricalProvenance };
export type HistoricalProductEvent = { eventId: string; provenance: HistoricalProvenance };
export type HistoricalLeadershipEvent = { eventId: string; provenance: HistoricalProvenance };
export type HistoricalSupplyChainEvent = { eventId: string; provenance: HistoricalProvenance };
export type HistoricalMarketCondition = { conditionId: string; provenance: HistoricalProvenance };
export type HistoricalFailureFactor = { factorId: string; provenance: HistoricalProvenance };
export type HistoricalSuccessFactor = { factorId: string; provenance: HistoricalProvenance };
export type HistoricalIntervention = { interventionId: string; provenance: HistoricalProvenance };
export type HistoricalOutcome = { outcomeId: string; provenance: HistoricalProvenance };

export type HistoricalSourceAuthorization = {
  sourceId: string;
  explicitAuthorization: boolean;
};

export function historicalAdapterRequiresAuthorization(input: HistoricalSourceAuthorization) {
  if (!input.explicitAuthorization) {
    return { allowed: false as const, reason: 'Historical adapters require explicit source authorization.' };
  }
  return { allowed: false as const, reason: 'Historical adapter is declared but not configured. No ingestion.' };
}

export function historicalBulkScrapingEnabled() {
  return false;
}

export function unauthorizedCopyrightIngestionEnabled() {
  return false;
}
