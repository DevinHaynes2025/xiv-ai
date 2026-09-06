export type LiveSourceStatus = 'live' | 'unavailable' | 'not_configured' | 'stale';

export type DataProvenance = {
  sourceId: string;
  sourceSystem: string;
  sourceType: string;
  sourceRecordId: string | null;
  organizationId: string | null;
  universeId: string | null;
  retrievedAt: string;
  freshness: 'live' | 'stale' | 'unknown' | 'sample';
  live: boolean;
  prototype: boolean;
  confidence: 'low' | 'medium' | 'high';
};

export type AdapterCapabilities = {
  read: true;
  write: false;
  metrics: boolean;
  records: boolean;
  connectionHealth: boolean;
};

export type SourceMetadata = {
  sourceId: string;
  sourceSystem: string;
  sourceType: string;
  configured: boolean;
  writeSupported: false;
};

export type AdapterDataset<T> = {
  status: LiveSourceStatus;
  records: readonly T[];
  provenance: DataProvenance;
  message: string;
};

export type BusinessDataAdapter = {
  getConnectionStatus(): Promise<LiveSourceStatus> | LiveSourceStatus;
  getCapabilities(): AdapterCapabilities;
  getSourceMetadata(): SourceMetadata;
  fetchMetrics(): Promise<AdapterDataset<Record<string, unknown>>> | AdapterDataset<Record<string, unknown>>;
  fetchRecords(): Promise<AdapterDataset<Record<string, unknown>>> | AdapterDataset<Record<string, unknown>>;
  getFreshness(): Promise<DataProvenance['freshness']> | DataProvenance['freshness'];
};

export function provenanceIsComplete(value: Partial<DataProvenance> | null | undefined): value is DataProvenance {
  if (!value) return false;
  return Boolean(
    value.sourceId &&
      value.sourceSystem &&
      value.sourceType &&
      'sourceRecordId' in value &&
      'organizationId' in value &&
      'universeId' in value &&
      value.retrievedAt &&
      value.freshness &&
      typeof value.live === 'boolean' &&
      typeof value.prototype === 'boolean' &&
      value.confidence,
  );
}

export function adapterIsReadOnly(adapter: BusinessDataAdapter) {
  const capabilities = adapter.getCapabilities();
  return capabilities.read === true && capabilities.write === false;
}
