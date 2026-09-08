/**
 * Phase 2I-AC Data Nervous System + Information Logistics contracts.
 * Authorized data lineage + observability — NOT surveillance.
 * Metadata preferred; do NOT record sensitive payloads merely for audit.
 */

export type CapabilityLifecycle = 'NOT_CONFIGURED' | 'CONFIGURED' | 'PROVEN' | 'LIVE';

export type DataEventKind =
  | 'CREATED'
  | 'INGESTED'
  | 'READ'
  | 'TRANSFORMED'
  | 'INDEXED'
  | 'EMBEDDED'
  | 'SUMMARIZED'
  | 'ANALYZED'
  | 'USED_BY_AGENT'
  | 'USED_BY_MODEL'
  | 'PROPOSED_FOR_DECISION'
  | 'APPROVED'
  | 'REJECTED'
  | 'UPDATED'
  | 'EXPORTED'
  | 'ARCHIVED'
  | 'DELETED';

export type DataClassification =
  | 'PUBLIC'
  | 'INTERNAL'
  | 'TENANT_PRIVATE'
  | 'PERSONAL'
  | 'COMPANY'
  | 'SECRET'
  | 'RESTRICTED';

export type DataPurpose =
  | 'OPERATIONS'
  | 'ANALYTICS'
  | 'AGENT_REASONING'
  | 'MODEL_INFERENCE'
  | 'TRAINING_CANDIDATE'
  | 'AUDIT'
  | 'COMPLIANCE'
  | 'RESEARCH'
  | 'PRODUCT'
  | 'SUPPLY_CHAIN';

export type DataFreshnessState = 'FRESH' | 'CURRENT' | 'STALE' | 'EXPIRED' | 'UNKNOWN';
export type DataQualityState = 'UNKNOWN' | 'PASSING' | 'DEGRADED' | 'FAILING' | 'QUARANTINED';

export type InformationLogisticsStage =
  | 'SOURCE'
  | 'DOCUMENT_OR_EVENT'
  | 'CLAIM'
  | 'EVIDENCE'
  | 'KNOWLEDGE'
  | 'AGENT_REASONING'
  | 'PROPOSAL'
  | 'DECISION'
  | 'ACTION'
  | 'OUTCOME'
  | 'LESSON';

export const DATA_EVENT_KINDS = [
  'CREATED',
  'INGESTED',
  'READ',
  'TRANSFORMED',
  'INDEXED',
  'EMBEDDED',
  'SUMMARIZED',
  'ANALYZED',
  'USED_BY_AGENT',
  'USED_BY_MODEL',
  'PROPOSED_FOR_DECISION',
  'APPROVED',
  'REJECTED',
  'UPDATED',
  'EXPORTED',
  'ARCHIVED',
  'DELETED',
] as const satisfies readonly DataEventKind[];

export const INFORMATION_LOGISTICS_STAGES = [
  'SOURCE',
  'DOCUMENT_OR_EVENT',
  'CLAIM',
  'EVIDENCE',
  'KNOWLEDGE',
  'AGENT_REASONING',
  'PROPOSAL',
  'DECISION',
  'ACTION',
  'OUTCOME',
  'LESSON',
] as const satisfies readonly InformationLogisticsStage[];

export const DATA_CLASSIFICATIONS = [
  'PUBLIC',
  'INTERNAL',
  'TENANT_PRIVATE',
  'PERSONAL',
  'COMPANY',
  'SECRET',
  'RESTRICTED',
] as const satisfies readonly DataClassification[];
