/**
 * Phase 2I-X AI OS Foundation V2 contracts.
 * Logical fabric only. More connectivity ≠ more authority. L4 disabled.
 * Providers stay NOT_CONFIGURED unless proven LIVE.
 */

export type ConnectorLifecycle = 'NOT_CONFIGURED' | 'CONFIGURED' | 'PROVEN' | 'LIVE';

export type DatabaseProviderKind =
  | 'SUPABASE_POSTGRES'
  | 'POSTGRES'
  | 'MONGODB'
  | 'GRAPH'
  | 'VECTOR'
  | 'SEARCH'
  | 'OBJECT'
  | 'STREAM'
  | 'TIME_SERIES'
  | 'CACHE'
  | 'LAKEHOUSE'
  | 'ARCHIVE';

export type DataAccessHop =
  | 'Agent'
  | 'Guardian'
  | 'Policy'
  | 'Classification'
  | 'Purpose'
  | 'Adapter'
  | 'Audit';

export type SupabaseCapability =
  | 'Auth'
  | 'Postgres'
  | 'RLS'
  | 'Storage'
  | 'Realtime'
  | 'Edge'
  | 'Vector'
  | 'Audit';

export type AgentConnectivityMode = 'ONLINE' | 'OFFLINE' | 'DEGRADED' | 'RECONNECTING';

export type OfflineCapability =
  | 'QUEUED_ACTIONS'
  | 'CACHED_AUTHORIZED'
  | 'READ_CACHED_ONLY'
  | 'NO_PRIVATE_UNCACHED'
  | 'NO_CREDENTIAL_CACHE';

export type PocketCacheClass = 'ALLOWED_OFFLINE' | 'CLOUD_ONLY' | 'OFFLINE_PROHIBITED' | 'TENANT_PRIVATE';

export type SyncConflictPolicy = 'SERVER_WINS_UNTIL_REVIEW' | 'REQUIRE_HUMAN' | 'DENY';

export type KnowledgeLane = 'TENANT_PRIVATE' | 'UNIVERSE_SCOPED' | 'AUTHORIZED_SHARED' | 'GLOBAL_PUBLIC';

export type DatabasePurpose =
  | 'accounts_permissions'
  | 'graph_relationships'
  | 'semantic_retrieval'
  | 'full_text_search'
  | 'object_blobs'
  | 'event_streams'
  | 'metrics_sensors'
  | 'ephemeral_cache'
  | 'analytics_copy'
  | 'compliance_archive';

export type SecurityRootV4 =
  | 'IdentityRoot'
  | 'DeviceRoot'
  | 'SessionRoot'
  | 'TenantRoot'
  | 'UniverseRoot'
  | 'DataRoot'
  | 'ClassificationRoot'
  | 'PurposeRoot'
  | 'AgentRoot'
  | 'ModelRoot'
  | 'PolicyRoot'
  | 'GuardianRoot'
  | 'ApprovalRoot'
  | 'AuditRoot'
  | 'ConnectivityRoot'
  | 'RecoveryRoot';

export type ConnectorFamily =
  | 'SUPABASE'
  | 'MONGODB'
  | 'POSTGRES'
  | 'GRAPH_DB'
  | 'VECTOR_DB'
  | 'SEARCH_ENGINE'
  | 'OBJECT_STORE'
  | 'STREAM_BUS'
  | 'TIME_SERIES_DB'
  | 'CACHE_LAYER'
  | 'LAKEHOUSE'
  | 'ARCHIVE_STORE'
  | 'ENTERPRISE_ERP'
  | 'ENTERPRISE_CRM'
  | 'ENTERPRISE_CLOUD';

export type OrchestratorNodeKind =
  | 'Observe'
  | 'Gather'
  | 'Analyze'
  | 'Draft'
  | 'Challenge'
  | 'Escalate'
  | 'Approve'
  | 'Execute'
  | 'Audit'
  | 'Learn';

export type IngestionStage =
  | 'Discover'
  | 'Authorize'
  | 'Fetch'
  | 'Normalize'
  | 'Classify'
  | 'Provenance'
  | 'Store'
  | 'Index'
  | 'Audit';

export const DATABASE_PROVIDER_KINDS: readonly DatabaseProviderKind[] = [
  'SUPABASE_POSTGRES',
  'POSTGRES',
  'MONGODB',
  'GRAPH',
  'VECTOR',
  'SEARCH',
  'OBJECT',
  'STREAM',
  'TIME_SERIES',
  'CACHE',
  'LAKEHOUSE',
  'ARCHIVE',
] as const;

export const DATA_ACCESS_PATH: readonly DataAccessHop[] = [
  'Agent',
  'Guardian',
  'Policy',
  'Classification',
  'Purpose',
  'Adapter',
  'Audit',
] as const;

export const SUPABASE_CAPABILITIES: readonly SupabaseCapability[] = [
  'Auth',
  'Postgres',
  'RLS',
  'Storage',
  'Realtime',
  'Edge',
  'Vector',
  'Audit',
] as const;

export const SECURITY_ROOTS_V4: readonly SecurityRootV4[] = [
  'IdentityRoot',
  'DeviceRoot',
  'SessionRoot',
  'TenantRoot',
  'UniverseRoot',
  'DataRoot',
  'ClassificationRoot',
  'PurposeRoot',
  'AgentRoot',
  'ModelRoot',
  'PolicyRoot',
  'GuardianRoot',
  'ApprovalRoot',
  'AuditRoot',
  'ConnectivityRoot',
  'RecoveryRoot',
] as const;

export const CONNECTOR_FAMILIES: readonly ConnectorFamily[] = [
  'SUPABASE',
  'MONGODB',
  'POSTGRES',
  'GRAPH_DB',
  'VECTOR_DB',
  'SEARCH_ENGINE',
  'OBJECT_STORE',
  'STREAM_BUS',
  'TIME_SERIES_DB',
  'CACHE_LAYER',
  'LAKEHOUSE',
  'ARCHIVE_STORE',
  'ENTERPRISE_ERP',
  'ENTERPRISE_CRM',
  'ENTERPRISE_CLOUD',
] as const;

export const PROVIDER_PURPOSE_MAP: Readonly<Record<DatabaseProviderKind, DatabasePurpose>> = {
  SUPABASE_POSTGRES: 'accounts_permissions',
  POSTGRES: 'accounts_permissions',
  MONGODB: 'object_blobs',
  GRAPH: 'graph_relationships',
  VECTOR: 'semantic_retrieval',
  SEARCH: 'full_text_search',
  OBJECT: 'object_blobs',
  STREAM: 'event_streams',
  TIME_SERIES: 'metrics_sensors',
  CACHE: 'ephemeral_cache',
  LAKEHOUSE: 'analytics_copy',
  ARCHIVE: 'compliance_archive',
};
