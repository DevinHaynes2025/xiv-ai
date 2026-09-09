import type { HistoricalProvenance } from './types';

export const HISTORICAL_NORMALIZATION_VERSION = '2I-D.1';

export type NormalizedHistoricalRecord = {
  eventId: string;
  kind: string;
  sourceId: string;
  sourceRecordId: string;
  publisher: string;
  originalDate: string | null;
  retrievedAt: string;
  ingestedAt: string;
  country: string | null;
  industry: string | null;
  entityIds: readonly string[];
  classification: 'public' | 'licensed' | 'restricted';
  originalOrDerived: 'original' | 'derived';
  historicalOrRealtime: 'historical' | 'realtime';
  reliability: 'unknown' | 'low' | 'medium' | 'high';
  usageRights: string;
  licenseType: string;
  contentHash: string;
  normalizationVersion: string;
  provenanceChain: readonly string[];
  provenance: HistoricalProvenance;
  payload: Record<string, unknown>;
};

export function requiredHistoricalProvenancePresent(record: NormalizedHistoricalRecord) {
  return Boolean(
    record.sourceId &&
      record.sourceRecordId &&
      record.publisher &&
      record.originalDate &&
      record.retrievedAt &&
      record.ingestedAt &&
      record.country &&
      record.classification &&
      record.historicalOrRealtime &&
      record.usageRights &&
      record.contentHash &&
      record.normalizationVersion &&
      record.provenanceChain.length > 0,
  );
}

export function fingerprintContent(value: string) {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (Math.imul(31, hash) + value.charCodeAt(index)) | 0;
  }
  return `xivh:${(hash >>> 0).toString(16)}`;
}

export function normalizeHistoricalRecord(input: {
  kind: string;
  sourceId?: string | null;
  sourceRecordId?: string | null;
  publisher?: string | null;
  originalDate?: string | null;
  retrievedAt?: string | null;
  ingestedAt?: string | null;
  country?: string | null;
  industry?: string | null;
  entityIds?: readonly string[];
  classification?: 'public' | 'licensed' | 'restricted';
  originalOrDerived?: 'original' | 'derived';
  historicalOrRealtime?: 'historical' | 'realtime';
  reliability?: 'unknown' | 'low' | 'medium' | 'high';
  usageRights?: string | null;
  licenseType?: string | null;
  payload?: Record<string, unknown>;
}): NormalizedHistoricalRecord | { allowed: false; reason: string } {
  if (!input.sourceId || !input.sourceRecordId || !input.publisher || !input.retrievedAt || !input.ingestedAt) {
    return { allowed: false, reason: 'Missing provenance rejected.' };
  }
  if (!input.licenseType || !input.usageRights) {
    return { allowed: false, reason: 'Unknown license rejected.' };
  }
  const provenance: HistoricalProvenance = {
    sourceId: input.sourceId,
    publisher: input.publisher,
    originalDate: input.originalDate ?? null,
    ingestedAt: input.ingestedAt,
    licenseType: input.licenseType,
    usageRights: input.usageRights,
    country: input.country ?? null,
    industry: input.industry ?? null,
    entityIds: input.entityIds ?? [],
    reliability: input.reliability ?? 'unknown',
    classification: input.classification ?? 'public',
    originalOrDerived: input.originalOrDerived ?? 'original',
    historicalOrRealtime: input.historicalOrRealtime ?? 'historical',
    contentHash: fingerprintContent(`${input.sourceId}:${input.sourceRecordId}:${input.retrievedAt}`),
  };
  return {
    eventId: `${input.sourceId}:${input.sourceRecordId}`,
    kind: input.kind,
    sourceId: input.sourceId,
    sourceRecordId: input.sourceRecordId,
    publisher: input.publisher,
    originalDate: input.originalDate ?? null,
    retrievedAt: input.retrievedAt,
    ingestedAt: input.ingestedAt,
    country: input.country ?? null,
    industry: input.industry ?? null,
    entityIds: input.entityIds ?? [],
    classification: input.classification ?? 'public',
    originalOrDerived: input.originalOrDerived ?? 'original',
    historicalOrRealtime: input.historicalOrRealtime ?? 'historical',
    reliability: input.reliability ?? 'unknown',
    usageRights: input.usageRights,
    licenseType: input.licenseType,
    contentHash: provenance.contentHash ?? fingerprintContent(input.sourceRecordId),
    normalizationVersion: HISTORICAL_NORMALIZATION_VERSION,
    provenanceChain: [input.sourceId, input.sourceRecordId],
    provenance,
    payload: input.payload ?? {},
  };
}
