export type AndroidTrustState = 'UNKNOWN' | 'REGISTERED' | 'VERIFIED' | 'TRUSTED' | 'LIMITED' | 'AT_RISK' | 'QUARANTINED' | 'REVOKED';

export type PocketClassification = 'PUBLIC' | 'INTERNAL' | 'CONFIDENTIAL' | 'TENANT_PRIVATE' | 'CLOUD_ONLY';

export type PocketCachePolicy = 'CLOUD_ONLY' | 'OFFLINE_ENCRYPTED' | 'OFFLINE_PROHIBITED';

export type ConnectivityTransport = 'WIFI' | 'CELLULAR' | 'SATELLITE' | 'ETHERNET' | 'VPN' | 'UNKNOWN';

export type SupplierVerificationClass =
  | 'SELF_REPORTED'
  | 'DOCUMENT_VERIFIED'
  | 'REGISTRY_VERIFIED'
  | 'PUBLIC_SOURCE'
  | 'BUYER_CONFIRMED'
  | 'INFERRED'
  | 'UNKNOWN';

export type WmsWorkflow = 'RECEIVE' | 'PUTAWAY' | 'PICK' | 'PACK' | 'SHIP' | 'CYCLE_COUNT' | 'TRANSFER' | 'ADJUSTMENT' | 'EXCEPTION';

export type EnterpriseCategory =
  | 'DATABASE'
  | 'CLOUD'
  | 'ERP'
  | 'CRM'
  | 'WMS'
  | 'TMS'
  | 'NETWORK'
  | 'SECURITY'
  | 'DATA_WAREHOUSE'
  | 'OBSERVABILITY'
  | 'COLLABORATION';

export type DatabaseKind =
  | 'RELATIONAL'
  | 'DOCUMENT'
  | 'KEY_VALUE'
  | 'GRAPH'
  | 'VECTOR'
  | 'TIME_SERIES'
  | 'WAREHOUSE'
  | 'OBJECT_STORAGE'
  | 'STREAM';
