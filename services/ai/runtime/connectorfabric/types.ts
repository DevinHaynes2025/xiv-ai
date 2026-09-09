/**
 * Phase 2I-AB Global Connector Fabric contracts.
 * Federated authorized connectors — NOT “all databases in the world.”
 * Unverified providers start NOT_CONFIGURED. Never LIVE without evidence.
 * NVIDIA = compute acceleration, not authorization.
 * Cisco/network connectors must never bypass network controls.
 * XIV does not replace host OS.
 */

export type ConnectorHealthState =
  | 'NOT_CONFIGURED'
  | 'CONFIGURED'
  | 'AUTHENTICATING'
  | 'CONNECTED'
  | 'DEGRADED'
  | 'BLOCKED'
  | 'REVOKED';

export type ConnectorKind =
  | 'CloudConnector'
  | 'DatabaseConnector'
  | 'SupplierConnector'
  | 'CommerceConnector'
  | 'ERPConnector'
  | 'CRMConnector'
  | 'WMSConnector'
  | 'TMSConnector'
  | 'NetworkConnector'
  | 'IdentityConnector'
  | 'DeviceConnector'
  | 'ObservabilityConnector'
  | 'CollaborationConnector'
  | 'PublicDataConnector';

export type AuthenticationMode =
  | 'OAUTH2'
  | 'API_KEY_CUSTOMER'
  | 'MTLS'
  | 'OIDC'
  | 'SERVICE_ACCOUNT'
  | 'PLUGIN_ADAPTER'
  | 'NOT_CONFIGURED';

export type DataClassification =
  | 'PUBLIC'
  | 'INTERNAL'
  | 'TENANT_PRIVATE'
  | 'RESTRICTED'
  | 'SECRET'
  | 'LICENSED';

export type ResidencyPolicy = 'REGION_LOCKED' | 'TENANT_POLICY' | 'CUSTOMER_DIRECTED' | 'UNKNOWN';

export type CloudProviderKind =
  | 'AWS'
  | 'AZURE'
  | 'GCP'
  | 'ORACLE'
  | 'IBM'
  | 'PRIVATE'
  | 'EDGE'
  | 'FUTURE_REGIONAL';

export type EnterprisePluginTarget =
  | 'CISCO'
  | 'ORACLE'
  | 'MICROSOFT'
  | 'SAP'
  | 'SALESFORCE'
  | 'SERVICENOW'
  | 'IBM'
  | 'SNOWFLAKE'
  | 'DATABRICKS'
  | 'MONGODB'
  | 'POSTGRESQL'
  | 'SUPABASE'
  | 'REDIS'
  | 'ELASTIC'
  | 'GRAPH_DB'
  | 'VECTOR_STORE';

export type DeviceOsKind =
  | 'ANDROID'
  | 'IOS'
  | 'WINDOWS'
  | 'LINUX'
  | 'MACOS'
  | 'WEB'
  | 'SAMSUNG_ANDROID'
  | 'WAREHOUSE_HANDHELD'
  | 'TABLET'
  | 'DESKTOP'
  | 'FUTURE_XR';

export type ComputeCapabilityKind =
  | 'CPU'
  | 'GPU'
  | 'NVIDIA_COMPATIBLE'
  | 'DISTRIBUTED'
  | 'EDGE'
  | 'SPECIALIZED'
  | 'FUTURE_QUANTUM';

export type CloudAuthPathHop =
  | 'Identity'
  | 'Tenant'
  | 'Universe'
  | 'Guardian'
  | 'Connector'
  | 'CloudPolicy'
  | 'ResourcePermission'
  | 'Action'
  | 'Audit';

export type DeviceTrustPathHop =
  | 'HostOS'
  | 'XivApp'
  | 'DeviceTrust'
  | 'CapabilityGateway'
  | 'Identity'
  | 'Universe'
  | 'Guardian'
  | 'AgentFirewall';

export const CONNECTOR_KINDS: readonly ConnectorKind[] = [
  'CloudConnector',
  'DatabaseConnector',
  'SupplierConnector',
  'CommerceConnector',
  'ERPConnector',
  'CRMConnector',
  'WMSConnector',
  'TMSConnector',
  'NetworkConnector',
  'IdentityConnector',
  'DeviceConnector',
  'ObservabilityConnector',
  'CollaborationConnector',
  'PublicDataConnector',
] as const;

export const CONNECTOR_HEALTH_STATES: readonly ConnectorHealthState[] = [
  'NOT_CONFIGURED',
  'CONFIGURED',
  'AUTHENTICATING',
  'CONNECTED',
  'DEGRADED',
  'BLOCKED',
  'REVOKED',
] as const;

export const CLOUD_PROVIDER_KINDS: readonly CloudProviderKind[] = [
  'AWS',
  'AZURE',
  'GCP',
  'ORACLE',
  'IBM',
  'PRIVATE',
  'EDGE',
  'FUTURE_REGIONAL',
] as const;

export const ENTERPRISE_PLUGIN_TARGETS: readonly EnterprisePluginTarget[] = [
  'CISCO',
  'ORACLE',
  'MICROSOFT',
  'SAP',
  'SALESFORCE',
  'SERVICENOW',
  'IBM',
  'SNOWFLAKE',
  'DATABRICKS',
  'MONGODB',
  'POSTGRESQL',
  'SUPABASE',
  'REDIS',
  'ELASTIC',
  'GRAPH_DB',
  'VECTOR_STORE',
] as const;

export const DEVICE_OS_KINDS: readonly DeviceOsKind[] = [
  'ANDROID',
  'IOS',
  'WINDOWS',
  'LINUX',
  'MACOS',
  'WEB',
  'SAMSUNG_ANDROID',
  'WAREHOUSE_HANDHELD',
  'TABLET',
  'DESKTOP',
  'FUTURE_XR',
] as const;

export const COMPUTE_CAPABILITY_KINDS: readonly ComputeCapabilityKind[] = [
  'CPU',
  'GPU',
  'NVIDIA_COMPATIBLE',
  'DISTRIBUTED',
  'EDGE',
  'SPECIALIZED',
  'FUTURE_QUANTUM',
] as const;

export const CLOUD_AUTH_PATH: readonly CloudAuthPathHop[] = [
  'Identity',
  'Tenant',
  'Universe',
  'Guardian',
  'Connector',
  'CloudPolicy',
  'ResourcePermission',
  'Action',
  'Audit',
] as const;

export const DEVICE_TRUST_PATH: readonly DeviceTrustPathHop[] = [
  'HostOS',
  'XivApp',
  'DeviceTrust',
  'CapabilityGateway',
  'Identity',
  'Universe',
  'Guardian',
  'AgentFirewall',
] as const;

/** Required fields on every connector contract. */
export type ConnectorRequiredFields = {
  provider: string;
  connectionId: string;
  tenantId: string;
  universeId: string;
  authenticationMode: AuthenticationMode;
  permissionScopes: readonly string[];
  dataClassification: DataClassification;
  readPermission: boolean;
  writePermission: boolean;
  region: string;
  residencyPolicy: ResidencyPolicy;
  syncFrequency: string;
  freshness: string;
  provenance: string;
  rateLimit: number;
  auditState: 'REQUIRED' | 'COMPLETE' | 'MISSING';
  healthState: ConnectorHealthState;
};
