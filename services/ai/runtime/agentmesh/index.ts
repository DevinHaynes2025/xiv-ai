/**
 * Phase 2I-AB Agent Mesh barrel.
 * Online + Offline Agent Mesh — encrypted scoped Pocket Brain, signed events,
 * bounded toolset, no new authority offline, no CLOUD_ONLY offline, no prod deploy offline.
 * L4 disabled. Capability ≠ privilege. Reconnect re-auth + Universe validation.
 * 62L-EW1–EW5: Offline Research Mission + Safe Web/TI + Branch/Return Mesh (extend-in-place).
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
  ApprovedOnlineSourceClass,
  DeniedResearchSourceClass,
  LawfulDefensiveTiClass,
  OfflineForbiddenAction,
  ResearchDataClass,
  ResearchEvidenceClass,
  ResearchRuntimeState,
  ResearchSourceDisposition,
} from './types';
export {
  AGENT_MESH_SYNC_STAGES,
  AGENT_RUNTIME_MODES,
  APPROVED_ONLINE_SOURCE_CLASSES,
  CONCEPT_TRANSLATIONS,
  DENIED_RESEARCH_SOURCE_CLASSES,
  EW_LOCKS,
  LAWFUL_DEFENSIVE_TI_CLASSES,
  OFFLINE_FORBIDDEN_ACTIONS,
  RESEARCH_DATA_CLASSES,
  RESEARCH_EVIDENCE_CLASSES,
  RESEARCH_RUNTIME_STATES,
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

export {
  acceptResearchChildReturn,
  advanceResearchMission,
  assertEwLocksIntact,
  auditEwSoftWires,
  completeResearchToHomeBase,
  conceptTranslations,
  createOfflineResearchMission,
  evaluateResearchHandoff,
  evaluateResearchSource,
  ewHiddenCotPersistenceAllowed,
  ewL4AutonomyEnabled,
  listApprovedOnlineSourceClasses,
  listDeniedResearchSourceClasses,
  listLawfulDefensiveTiClasses,
  listResearchRuntimeStates,
  probe61oHardening,
  probeGobOrchestration,
  spawnResearchChild,
} from './research';
export type {
  ChildReturnResult,
  ChildSpawnResult,
  HandoffEvalResult,
  HomeBaseResearchReceipt,
  OfflineResearchMission,
  ResearchAdvanceResult,
  ResearchChildReturn,
  ResearchChildSpec,
  SoftWirePresence,
  SourceEvaluation,
} from './research';
