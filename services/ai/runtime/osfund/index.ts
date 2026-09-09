/**
 * Phase 2I-X AI OS Foundation V2 barrel.
 * Agent data infrastructure, online/offline, federation, routing+sync, security roots V4.
 * More connectivity ≠ more authority. L4 disabled. No production deployment claims.
 */

export type {
  AgentConnectivityMode,
  ConnectorFamily,
  ConnectorLifecycle,
  DataAccessHop,
  DatabaseProviderKind,
  DatabasePurpose,
  IngestionStage,
  KnowledgeLane,
  OfflineCapability,
  OrchestratorNodeKind,
  PocketCacheClass,
  SecurityRootV4,
  SupabaseCapability,
  SyncConflictPolicy,
} from './types';
export {
  CONNECTOR_FAMILIES,
  DATABASE_PROVIDER_KINDS,
  DATA_ACCESS_PATH,
  PROVIDER_PURPOSE_MAP,
  SECURITY_ROOTS_V4,
  SUPABASE_CAPABILITIES,
} from './types';

export {
  adapterState,
  fabricMarksProviderLiveWithoutProof,
  listFabricAdapters,
  moreConnectivityMeansMoreAuthority,
  openDatabaseFabricV2,
} from './access';
export type { DatabaseAdapterContract, DatabaseFabricV2 } from './access';

export {
  agentReceivesRawDbCredential,
  dataAccessPath,
  routeAgentDataAccess,
  skipGuardianInDataPath,
} from './gateway';
export type { DataAccessDecision, DataAccessRequest } from './gateway';

export {
  agentReceivesSupabaseServiceRoleKey,
  openSupabaseFabric,
  recordSupabaseCapabilityProof,
  resetSupabaseProofForTests,
  supabaseCapabilityState,
  supabaseIsLiveWithoutProof,
} from './supabase';
export type { SupabaseCapabilityContract, SupabaseFabric } from './supabase';

export {
  mongoAdapterState,
  mongoDocumentBypassesClassification,
  mongoMarkedLiveWithoutProof,
  openMongoAdapter,
} from './mongodb';
export type { MongoAdapterContract } from './mongodb';

export {
  INGESTION_STAGES,
  ingestionBypassesClassification,
  runIngestionPipeline,
  unauthorizedSourceBecomesStoreFact,
} from './ingestion';
export type { IngestionDecision, IngestionRequest } from './ingestion';

export {
  agentGathersUnauthorizedSource,
  agentInventsMissingBusinessData,
  gatherAuthorizedData,
} from './gathering';
export type { GatherDecision, GatherRequest } from './gathering';

export {
  OFFLINE_CAPABILITIES,
  offlineAgentAccessUncachedPrivate,
  offlineAgentBypassesServerAuthority,
  offlineEscalatesPrivilege,
  openOfflineAgent,
  reconnectRequiresServerAuthorization,
} from './offline';
export type { OfflineAgentSession } from './offline';

export {
  cachePocketBrainV2,
  cloudOnlyNeverCached,
  openPocketBrainV2,
  pocketPrivateEntersGlobalAutomatically,
  pocketStoresRawSecrets,
} from './pocket';
export type { PocketBrainV2Record } from './pocket';

export {
  enqueueSync,
  openSyncEngine,
  resolveSyncConflict,
  syncEngineIsProductionLive,
  syncGrantsAuthority,
} from './sync';
export type { SyncDecision, SyncEnvelope } from './sync';

export {
  databaseRouterReturnsCredentials,
  eventRouterGrantsAuthority,
  routeDatabaseByPurpose,
  routeOsEvent,
} from './router';
export type { RoutedEvent } from './router';

export {
  ORCHESTRATOR_NODES_V4,
  openAgentOrchestratorV4,
  orchestratorBypassesGuardian,
  orchestratorConsensusCreatesVerifiedEvidence,
  temporaryTaskNodeReceivesPermanentAuthority,
} from './orchestrator';
export type { TaskGraph, TaskGraphNode } from './orchestrator';

export {
  knowledgeRouteCreatesAuthority,
  privateKnowledgeAutoEntersGlobal,
  routeKnowledge,
} from './knowledge';

export {
  auditRootCanBeDisabled,
  bindSecurityRootsV4,
  connectivityIsAuthority,
  deviceCannotImpersonateIdentity,
  listSecurityRootsV4,
  unknownSecurityRootIsTrusted,
} from './security';
export type { BoundRootsV4 } from './security';

export {
  allUnprovenConnectorsRemainNotConfigured,
  connectorFabricGrantsAuthority,
  connectorMarkedLiveWithoutProof,
  connectorState,
  openConnectorFabric,
  recordConnectorProof,
  resetConnectorProofForTests,
} from './connectors';
