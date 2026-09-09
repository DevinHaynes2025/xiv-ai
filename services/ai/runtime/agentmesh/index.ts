/**
 * Phase 2I-AB Agent Mesh barrel.
 * Online + Offline Agent Mesh — encrypted scoped Pocket Brain, signed events,
 * bounded toolset, no new authority offline, no CLOUD_ONLY offline, no prod deploy offline.
 * L4 disabled. Capability ≠ privilege. Reconnect re-auth + Universe validation.
 */

export type {
  AgentCacheClass,
  AgentConflictKind,
  AgentConflictResolution,
  AgentMeshSyncStage,
  AgentMemoryClass,
  AgentOfflineState,
  AgentRuntimeMode,
  AgentSyncPolicy,
  OfflineForbiddenAction,
} from './types';
export {
  AGENT_MESH_SYNC_STAGES,
  AGENT_RUNTIME_MODES,
  OFFLINE_FORBIDDEN_ACTIONS,
} from './types';

export {
  agentMeshL4Enabled,
  capabilityEqualsPrivilege,
  createCheckpoint,
  createEventQueue,
  createHandoff,
  evaluateOfflineAction,
  listAgentRuntimeModes,
  listOfflineForbiddenActions,
  offlineCreatesAuthority,
  openAgentRuntime,
  openCachePolicy,
  openCloudMemory,
  openLocalMemory,
  transitionAgentMode,
} from './runtime';
export type {
  AgentCachePolicy,
  AgentCheckpoint,
  AgentCloudMemory,
  AgentConflict,
  AgentEventQueue,
  AgentHandoff,
  AgentLocalMemory,
  AgentRecovery,
  AgentRuntime,
} from './runtime';

export {
  auditSyncEvent,
  listAgentMeshSyncStages,
  recoverFromCheckpoint,
  resolveConflict,
  syncMayBypassServerAuth,
  syncMaySkipAudit,
  synchronizeAgentMesh,
} from './sync';
