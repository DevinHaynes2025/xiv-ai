export type HistoricalProvenance = {
  archive: string;
  collection: string | null;
  retrievedAt: string;
  license: string;
  reference: string;
};

export type HistoricalBusinessRecord = {
  recordId: string;
  kind: 'company' | 'founder' | 'industry' | 'county' | 'city' | 'factory' | 'product' | 'trade_route' | 'economic_event' | 'document';
  claim: string;
  geography: string;
  period: string;
  provenance: HistoricalProvenance;
  libraryStatus: 'NOT_CONFIGURED';
};

export function historicalLibraryStatus(archiveId = 'us_library_of_congress'): 'NOT_CONFIGURED' {
  void archiveId;
  return 'NOT_CONFIGURED';
}

export function createHistoricalRecord(input: {
  claim: string;
  geography: string;
  period: string;
  provenance?: HistoricalProvenance | null;
}): HistoricalBusinessRecord | { allowed: false; reason: string } {
  if (!input.provenance?.archive || !input.provenance.retrievedAt || !input.provenance.reference) {
    return { allowed: false, reason: 'historical_claims_require_provenance' };
  }
  return {
    recordId: `hist:${input.geography}:${input.period}`,
    kind: 'economic_event',
    claim: input.claim,
    geography: input.geography,
    period: input.period,
    provenance: input.provenance,
    libraryStatus: 'NOT_CONFIGURED',
  };
}

export function historicalClaimsRequireProvenance(record: { provenance?: HistoricalProvenance | null }): boolean {
  return Boolean(record.provenance?.archive && record.provenance.reference && record.provenance.retrievedAt);
}
