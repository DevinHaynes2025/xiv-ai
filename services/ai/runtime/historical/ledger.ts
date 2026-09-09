/**
 * Append-only in-memory business event ledger. Not hosted Postgres.
 */
import type { NormalizedHistoricalRecord } from './normalize';

export type BusinessEventId = string;

export type BusinessEventSource = {
  sourceId: string;
  sourceRecordId: string;
  publisher: string;
};

export type BusinessEventTime = {
  originalDate: string | null;
  retrievedAt: string;
  ingestedAt: string;
  acceptedAt: string;
  historicalOrRealtime: 'historical' | 'realtime';
};

export type BusinessEventEntity = {
  entityIds: readonly string[];
  country: string | null;
  industry: string | null;
};

export type BusinessEventPayload = Record<string, unknown>;

export type BusinessEventProvenance = {
  provenanceChain: readonly string[];
  contentHash: string;
  usageRights: string;
  licenseType: string;
};

export type BusinessEventClassification = {
  classification: 'public' | 'licensed' | 'restricted';
  originalOrDerived: 'original' | 'derived';
};

export type BusinessEventQuality = {
  reliability: 'unknown' | 'low' | 'medium' | 'high';
};

export type BusinessEventVersion = {
  version: number;
  supersedes: BusinessEventId | null;
  immutable: true;
};

export type BusinessEventEnvelope = BusinessEventVersion & {
  eventId: BusinessEventId;
  source: BusinessEventSource;
  time: BusinessEventTime;
  entity: BusinessEventEntity;
  payload: BusinessEventPayload;
  provenance: BusinessEventProvenance;
  classification: BusinessEventClassification;
  quality: BusinessEventQuality;
  record: NormalizedHistoricalRecord;
  acceptedAt: string;
};

const events: BusinessEventEnvelope[] = [];

export function resetBusinessEventLedgerForTests() {
  events.length = 0;
}

export function acceptBusinessEvent(record: NormalizedHistoricalRecord, acceptedAt: string) {
  const duplicate = events.find(
    (item) => item.record.sourceId === record.sourceId && item.record.sourceRecordId === record.sourceRecordId && item.supersedes === null,
  );
  if (duplicate && duplicate.record.contentHash === record.contentHash) {
    return { accepted: false as const, duplicate: true as const, eventId: duplicate.eventId };
  }
  const envelope = envelopeFromRecord(record, events.length + 1, 1, null, acceptedAt);
  events.push(envelope);
  return { accepted: true as const, duplicate: false as const, event: envelope };
}

export function correctBusinessEvent(previousEventId: string, record: NormalizedHistoricalRecord, acceptedAt: string) {
  const previous = events.find((item) => item.eventId === previousEventId);
  if (!previous) {
    return { accepted: false as const, reason: 'Unknown event. Corrections cannot rewrite missing rows.' };
  }
  const envelope = envelopeFromRecord(record, events.length + 1, previous.version + 1, previous.eventId, acceptedAt);
  events.push(envelope);
  return { accepted: true as const, rewritten: false as const, event: envelope };
}

export function listBusinessEvents() {
  return [...events];
}

export function detectDuplicateSourceRecord(sourceId: string, sourceRecordId: string) {
  return events.some((item) => item.record.sourceId === sourceId && item.record.sourceRecordId === sourceRecordId);
}

export function ledgerPersistsToHostedDatabase() {
  return false;
}

function envelopeFromRecord(
  record: NormalizedHistoricalRecord,
  sequence: number,
  version: number,
  supersedes: BusinessEventId | null,
  acceptedAt: string,
): BusinessEventEnvelope {
  return {
    eventId: `${record.eventId}:v${sequence}`,
    version,
    supersedes,
    immutable: true,
    source: {
      sourceId: record.sourceId,
      sourceRecordId: record.sourceRecordId,
      publisher: record.publisher,
    },
    time: {
      originalDate: record.originalDate,
      retrievedAt: record.retrievedAt,
      ingestedAt: record.ingestedAt,
      acceptedAt,
      historicalOrRealtime: record.historicalOrRealtime,
    },
    entity: {
      entityIds: record.entityIds,
      country: record.country,
      industry: record.industry,
    },
    payload: record.payload,
    provenance: {
      provenanceChain: record.provenanceChain,
      contentHash: record.contentHash,
      usageRights: record.usageRights,
      licenseType: record.licenseType,
    },
    classification: {
      classification: record.classification,
      originalOrDerived: record.originalOrDerived,
    },
    quality: { reliability: record.reliability },
    record,
    acceptedAt,
  };
}
