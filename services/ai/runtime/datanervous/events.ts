/**
 * Data Nervous System — event + asset + movement contracts.
 * Metadata lineage only; no raw secrets/PII payloads in audit records.
 */

import {
  DATA_EVENT_KINDS,
  type DataClassification,
  type DataEventKind,
  type DataFreshnessState,
  type DataPurpose,
  type DataQualityState,
} from './types';

export type DataOwner = {
  ownerId: string;
  tenantId: string;
  universeId: string;
  kind: 'USER' | 'TEAM' | 'SYSTEM' | 'SUPPLIER' | 'FOUNDER';
};

export type DataAsset = {
  assetId: string;
  kind: string;
  classification: DataClassification;
  purpose: DataPurpose;
  owner: DataOwner;
  region: string;
  retentionPolicyId: string;
  containsRawSecrets: false;
  containsRawPiiPayload: false;
};

export type DataProvenance = {
  sourceSystem: string;
  sourceRef: string;
  ingestedAt: string;
  rightsState: 'UNKNOWN' | 'LICENSED' | 'PUBLIC_DOMAIN' | 'CUSTOMER_OWNED' | 'DENIED';
  authorized: boolean;
};

export type DataEvent = {
  eventId: string;
  kind: DataEventKind;
  assetId: string;
  occurredAt: string;
  source: string;
  destination: string | null;
  purpose: DataPurpose;
  tenantId: string;
  universeId: string;
  classification: DataClassification;
  agentId: string | null;
  modelId: string | null;
  authorizationRef: string | null;
  transformationId: string | null;
  resultSummary: string;
  provenanceRef: string;
  /** Audit stores metadata hashes/refs — never raw secret/PII payloads. */
  payloadMode: 'METADATA_ONLY';
  rawSecretsRecorded: false;
  rawPiiRecorded: false;
};

export type DataMovement = {
  movementId: string;
  assetId: string;
  fromSystem: string;
  toSystem: string;
  authorized: boolean;
  purpose: DataPurpose;
  classification: DataClassification;
  tenantId: string;
  universeId: string;
};

export type DataTransformation = {
  transformationId: string;
  assetId: string;
  kind: 'NORMALIZE' | 'ENRICH' | 'EMBED' | 'SUMMARIZE' | 'REDACT' | 'AGGREGATE';
  inputRefs: readonly string[];
  outputRef: string;
  agentId: string | null;
  modelId: string | null;
};

export type DataAccess = {
  accessId: string;
  assetId: string;
  consumerId: string;
  purpose: DataPurpose;
  authorized: boolean;
  deniedReason: string | null;
};

export type DataMutation = {
  mutationId: string;
  assetId: string;
  kind: 'CREATE' | 'UPDATE' | 'ARCHIVE' | 'DELETE';
  actorId: string;
  authorized: boolean;
};

export type DataConsumer = {
  consumerId: string;
  kind: 'AGENT' | 'MODEL' | 'HUMAN' | 'SERVICE' | 'PLUGIN';
  tenantId: string;
};

export type DataProducer = {
  producerId: string;
  kind: 'CONNECTOR' | 'AGENT' | 'HUMAN' | 'SYSTEM' | 'IMPORT';
  tenantId: string;
};

export type DataRetention = {
  retentionPolicyId: string;
  maxDays: number;
  deleteOnExpiry: boolean;
  legalHold: boolean;
};

export type DataRegion = {
  regionId: string;
  residencyRequired: boolean;
  crossBorderAllowed: boolean;
};

export type DataAudit = {
  auditId: string;
  eventId: string;
  recordedAt: string;
  metadataOnly: true;
  rawPayloadStored: false;
};

export type DataFreshness = {
  assetId: string;
  state: DataFreshnessState;
  observedAt: string;
  maxAgeSeconds: number;
};

export type DataQuality = {
  assetId: string;
  state: DataQualityState;
  score: number;
  notes: string;
};

export function listDataEventKinds(): readonly DataEventKind[] {
  return DATA_EVENT_KINDS;
}

export function createDataAsset(input: {
  assetId: string;
  kind: string;
  classification: DataClassification;
  purpose: DataPurpose;
  owner: DataOwner;
  region: string;
  retentionPolicyId: string;
}): DataAsset {
  return {
    ...input,
    containsRawSecrets: false,
    containsRawPiiPayload: false,
  };
}

export function emitDataEvent(input: {
  eventId: string;
  kind: DataEventKind;
  assetId: string;
  occurredAt: string;
  source: string;
  destination?: string | null;
  purpose: DataPurpose;
  tenantId: string;
  universeId: string;
  classification: DataClassification;
  agentId?: string | null;
  modelId?: string | null;
  authorizationRef?: string | null;
  transformationId?: string | null;
  resultSummary: string;
  provenanceRef: string;
}): DataEvent {
  return {
    eventId: input.eventId,
    kind: input.kind,
    assetId: input.assetId,
    occurredAt: input.occurredAt,
    source: input.source,
    destination: input.destination ?? null,
    purpose: input.purpose,
    tenantId: input.tenantId,
    universeId: input.universeId,
    classification: input.classification,
    agentId: input.agentId ?? null,
    modelId: input.modelId ?? null,
    authorizationRef: input.authorizationRef ?? null,
    transformationId: input.transformationId ?? null,
    resultSummary: input.resultSummary,
    provenanceRef: input.provenanceRef,
    payloadMode: 'METADATA_ONLY',
    rawSecretsRecorded: false,
    rawPiiRecorded: false,
  };
}

export function recordSensitivePayloadForAudit(_payload: unknown): never {
  throw new Error('data_nervous_system_forbids_raw_secret_or_pii_payload_audit');
}

export function createDataMovement(input: {
  movementId: string;
  assetId: string;
  fromSystem: string;
  toSystem: string;
  authorized: boolean;
  purpose: DataPurpose;
  classification: DataClassification;
  tenantId: string;
  universeId: string;
}): DataMovement {
  return { ...input };
}

export function evaluateDataAccess(input: {
  asset: DataAsset;
  consumer: DataConsumer;
  purpose: DataPurpose;
  authorized: boolean;
}): DataAccess {
  if (input.asset.owner.tenantId !== input.consumer.tenantId) {
    return {
      accessId: `deny-${input.asset.assetId}-${input.consumer.consumerId}`,
      assetId: input.asset.assetId,
      consumerId: input.consumer.consumerId,
      purpose: input.purpose,
      authorized: false,
      deniedReason: 'cross_tenant_data_access_denied',
    };
  }
  if (!input.authorized) {
    return {
      accessId: `deny-${input.asset.assetId}-${input.consumer.consumerId}`,
      assetId: input.asset.assetId,
      consumerId: input.consumer.consumerId,
      purpose: input.purpose,
      authorized: false,
      deniedReason: 'authorization_required',
    };
  }
  return {
    accessId: `ok-${input.asset.assetId}-${input.consumer.consumerId}`,
    assetId: input.asset.assetId,
    consumerId: input.consumer.consumerId,
    purpose: input.purpose,
    authorized: true,
    deniedReason: null,
  };
}

export function openDataAudit(event: DataEvent): DataAudit {
  return {
    auditId: `audit-${event.eventId}`,
    eventId: event.eventId,
    recordedAt: event.occurredAt,
    metadataOnly: true,
    rawPayloadStored: false,
  };
}
