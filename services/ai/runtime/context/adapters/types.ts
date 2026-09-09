import type { DataClassification } from '../../universe/types';
import type { DataScope } from './scope';

export type { DataScope } from './scope';

export type LiveSourceStatus = 'live' | 'unavailable' | 'not_configured' | 'stale';

export type FreshnessStatus = 'fresh' | 'aging' | 'stale' | 'unknown' | 'sample' | 'live';

export type DataDomainCapability = {
  operations: boolean;
  inventory: boolean;
  supply_chain: boolean;
  warehouse: boolean;
  customer: boolean;
  finance: boolean;
  technology: boolean;
};

export type DataProvenance = {
  sourceId: string;
  sourceSystem: string;
  sourceType: string;
  sourceRecordId: string | null;
  organizationId: string | null;
  universeId: string | null;
  ownerId: string | null;
  scope: DataScope;
  retrievedAt: string;
  sourceUpdatedAt?: string | null;
  freshness: FreshnessStatus;
  freshnessStatus?: 'fresh' | 'aging' | 'stale' | 'unknown';
  live: boolean;
  prototype: boolean;
  confidence: 'low' | 'medium' | 'high';
  dataClassification: DataClassification;
};

export type AdapterCapabilities = {
  read: true;
  write: false;
  metrics: boolean;
  records: boolean;
  connectionHealth: boolean;
  domains: DataDomainCapability;
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
  const base = Boolean(
    value.sourceId &&
      value.sourceSystem &&
      value.sourceType &&
      'sourceRecordId' in value &&
      'organizationId' in value &&
      'universeId' in value &&
      'ownerId' in value &&
      value.scope &&
      value.retrievedAt &&
      value.freshness &&
      typeof value.live === 'boolean' &&
      typeof value.prototype === 'boolean' &&
      value.confidence &&
      value.dataClassification,
  );
  if (!base) return false;
  if (value.scope === 'personal') return Boolean(value.ownerId);
  if (value.scope === 'organization') return Boolean(value.organizationId);
  if (value.scope === 'universe') return Boolean(value.organizationId && value.universeId);
  if (value.scope === 'public') return value.dataClassification === 'public';
  return false;
}

export function adapterIsReadOnly(adapter: BusinessDataAdapter) {
  const capabilities = adapter.getCapabilities();
  return capabilities.read === true && capabilities.write === false;
}
