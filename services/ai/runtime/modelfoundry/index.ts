/**
 * Phase 2I-AA Model Foundry barrel.
 * Model Registry + Evaluation Lab + Dataset Governance + Offline contracts.
 * NOT “train everything.” Controlled fine-tune experiments only after safe datasets + benchmarks.
 * L4 disabled. Providers NOT_CONFIGURED until proven. STOPPED before new production credentials.
 */

export type {
  AdminSurfaceStub,
  BackendEngineKind,
  CapabilityLifecycle,
  DataClass,
  DatasetClassification,
  DatasetConsentState,
  DatasetRightsState,
  DatasetSourceKind,
  EvalMetricKind,
  LearningPipelineStage,
  ModelApprovalStatus,
  ModelLifecycleState,
  ModelProviderKind,
  ModelSecurityControl,
  OfflineModelMode,
} from './types';
export {
  ADMIN_SURFACE_STUBS,
  BACKEND_ENGINES,
  EVAL_METRICS,
  LEARNING_PIPELINE,
  MODEL_LIFECYCLE_STATES,
  MODEL_PROVIDER_KINDS,
  MODEL_SECURITY_CONTROLS,
  RUNNABLE_MODEL_STATES,
} from './types';

export {
  createFineTuneCandidate,
  createModelRecord,
  listModelLifecycleStates,
  listModelProviderKinds,
  modelMayBypassGuardian,
  modelMayGrantTools,
  modelMayPromoteToL4,
  modelMaySelfPromote,
  modelProviderState,
  openModelHealth,
  openModelProviders,
  openModelRegistry,
  promoteModel,
  quarantineModel,
  registerModel,
  runModelInference,
  smarterModelMeansMoreAuthority,
} from './registry';
export type {
  ModelAudit,
  ModelBenchmark,
  ModelCanary,
  ModelCapability,
  ModelDatasetLineage,
  ModelDeployment,
  ModelEvaluationScores,
  ModelExperiment,
  ModelFineTuneCandidate,
  ModelHealth,
  ModelPolicy,
  ModelProvider,
  ModelRecord,
  ModelRegistry,
  ModelRollback,
  ModelVersion,
  PromoteModelRequest,
} from './registry';

export {
  admitDatasetToTraining,
  createDataset,
  crossTenantDatasetDenied,
  openDatasetAudit,
  privateDataMayEnterSharedTraining,
  syntheticDataAllowedForTesting,
} from './datasets';
export type {
  DatasetAudit,
  DatasetConsent,
  DatasetProvenance,
  DatasetQuality,
  DatasetRecord,
  DatasetRedaction,
  DatasetRetention,
  DatasetRights,
  DatasetSource,
  DatasetTenantScope,
  DatasetUniverseScope,
  EvaluationDataset,
  TrainingDataset,
} from './datasets';

export {
  advanceLearningStage,
  learningPipelineDocument,
  listLearningPipelineStages,
  openLearningPipeline,
} from './pipeline';
export type { LearningPipeline, LearningStepInput } from './pipeline';

export {
  createVectorIndex,
  openKnowledgeFabric,
  queryVectorIndex,
  registerKnowledgeClaim,
} from './rag';
export type {
  ChunkRegistryEntry,
  Confidence,
  Contradiction,
  DocumentRegistryEntry,
  EmbeddingRegistryEntry,
  EvidenceLink,
  Freshness,
  KnowledgeClaim,
  KnowledgeFabric,
  SourceReference,
  VectorIndex,
} from './rag';

export {
  listBackendEngines,
  openBackendIntelligenceLayer,
  routeInference,
  routeToolCall,
} from './backend';
export type {
  AuditEngine,
  BackendIntelligenceLayer,
  ConnectorGateway,
  DataAccessGateway,
  DecisionEngine,
  EvidenceEngine,
  InferenceGateway,
  LocationGatewayHandle,
  OutcomeEngine,
  PolicyEngine,
  TaskOrchestrator,
  ToolGateway,
} from './backend';

export {
  offlineModelMayGainAuthority,
  openOfflineModel,
  revalidateOfflineSession,
  startOfflineSession,
} from './offline';
export type { OfflineModelContract, OfflineSession } from './offline';

export {
  applyModelQuarantine,
  assertTrainingDataIntegrity,
  detectCrossTenantLeak,
  detectModelDrift,
  detectModelPoisoning,
  detectPromptInjection,
  detectSensitiveDataLeak,
  detectUnsafeToolCall,
  evalRegressionGate,
  listModelSecurityControls,
  openModelSecurity,
  validateToolOutput,
} from './security';
export type { ModelSecurityFabric } from './security';

export {
  evaluationAutoPromotesModel,
  listEvalMetrics,
  openEvaluationLab,
  scoreEvaluation,
} from './evaluations';
export type { EvalScoreCard, EvaluationLab } from './evaluations';

export { listAdminSurfaceStubs, openAdminSurface } from './ui-stubs';
export type { AdminSurface } from './ui-stubs';
