/**
 * Phase 2I-AB Online + Offline Agent Mesh contracts.
 * Offline ≠ new authority. Capability ≠ privilege. L4 disabled.
 * Reconnect requires re-auth + tenant/Universe validation + server-side authorization.
 */

export type AgentRuntimeMode =
  | 'ONLINE'
  | 'OFFLINE_LIMITED'
  | 'OFFLINE_READ_ONLY'
  | 'SYNC_PENDING'
  | 'REAUTH_REQUIRED'
  | 'BLOCKED';

export type AgentSyncPolicy =
  | 'IMMEDIATE_ON_RECONNECT'
  | 'BATCHED'
  | 'MANUAL_APPROVAL'
  | 'READ_ONLY_REPLAY';

export type AgentOfflineState =
  | 'ENCRYPTED_POCKET_ACTIVE'
  | 'SIGNED_EVENTS_QUEUED'
  | 'BOUNDED_TOOLSET'
  | 'CLOUD_ONLY_BLOCKED'
  | 'PROD_DEPLOY_BLOCKED'
  | 'AWAITING_REAUTH';

export type AgentConflictKind =
  | 'VERSION_SKEW'
  | 'TENANT_MISMATCH'
  | 'UNIVERSE_MISMATCH'
  | 'AUTHORITY_DRIFT'
  | 'DUPLICATE_EVENT'
  | 'STALE_CHECKPOINT';

export type AgentConflictResolution =
  | 'SERVER_WINS'
  | 'REQUIRE_HUMAN'
  | 'DROP_UNAUTHORIZED'
  | 'REPLAY_BOUNDED';

export type AgentCacheClass = 'ALLOWED_OFFLINE' | 'CLOUD_ONLY' | 'OFFLINE_PROHIBITED' | 'TENANT_PRIVATE';

export type AgentMemoryClass = 'LOCAL_SCOPED' | 'CLOUD_SCOPED' | 'HYBRID_SYNCED';

export type AgentMeshSyncStage =
  | 'SIGNED_LOCAL_EVENT_QUEUE'
  | 'RECONNECT'
  | 'REAUTH'
  | 'DEVICE_VALIDATION'
  | 'TENANT_VALIDATION'
  | 'UNIVERSE_VALIDATION'
  | 'CONFLICT_DETECTION'
  | 'SERVER_AUTHORIZATION'
  | 'SYNCHRONIZE'
  | 'AUDIT';

export const AGENT_RUNTIME_MODES: readonly AgentRuntimeMode[] = [
  'ONLINE',
  'OFFLINE_LIMITED',
  'OFFLINE_READ_ONLY',
  'SYNC_PENDING',
  'REAUTH_REQUIRED',
  'BLOCKED',
] as const;

export const AGENT_MESH_SYNC_STAGES: readonly AgentMeshSyncStage[] = [
  'SIGNED_LOCAL_EVENT_QUEUE',
  'RECONNECT',
  'REAUTH',
  'DEVICE_VALIDATION',
  'TENANT_VALIDATION',
  'UNIVERSE_VALIDATION',
  'CONFLICT_DETECTION',
  'SERVER_AUTHORIZATION',
  'SYNCHRONIZE',
  'AUDIT',
] as const;

export const OFFLINE_FORBIDDEN_ACTIONS = [
  'GAIN_NEW_AUTHORITY',
  'ACCESS_CLOUD_ONLY_DATA',
  'PRODUCTION_DEPLOY',
  'BYPASS_GUARDIAN',
  'CROSS_UNIVERSE_READ',
  'EXPAND_PERMISSION_SCOPES',
  'SILENT_PRIVILEGE_ESCALATION',
] as const;

export type OfflineForbiddenAction = (typeof OFFLINE_FORBIDDEN_ACTIONS)[number];
