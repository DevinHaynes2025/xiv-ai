export type {
  AcceleratorKind,
  AlgorithmClass,
  InfrastructurePlane,
  NvidiaSignal,
  OptimizationWorkload,
  PolyglotStoreClass,
  TrustRoot,
} from './types';
export { ALGORITHM_CLASSES, NVIDIA_SIGNALS, POLYGLOT_STORE_CLASSES, TRUST_ROOTS } from './types';

export {
  detectNvidiaCapability,
  gpuUnavailableFallsBackToCpu,
  mobileRequiresNvidia,
  moreComputeMeansMorePrivilege,
  nvidiaCapabilityCanBeFabricated,
  nvidiaRequiredForXiv,
  routeComputeWorkload,
} from './compute';
export type {
  AcceleratorProfile,
  ComputeAudit,
  ComputeBudget,
  ComputeCapability,
  ComputeFallback,
  ComputeHealth,
  ComputeJob,
  ComputeMetric,
  ComputePolicy,
  ComputeProvider,
  ComputeQueue,
  ComputeRuntime,
  ComputeWorkload,
  DistributedInferenceCapability,
  GPUCapability,
  LocalInferenceCapability,
  NvidiaCapability,
  NvidiaEvidence,
} from './compute';

export {
  algorithmCannotBypassApproval,
  algorithmCannotDeployItself,
  algorithmSelfDeployDenied,
  promoteAlgorithm,
  proposeFoundryAlgorithm,
} from './algorithms';
export type { AlgorithmCandidate, AlgorithmStage } from './algorithms';

export {
  STORE_PURPOSES,
  agentObtainsDbCredentials,
  polyglotRequiresPurpose,
  replicateRegion,
  routeDataQuery,
} from './data';
export type { DataPlaneQuery } from './data';

export {
  auditRootCanBeDisabled,
  bindRequestRoots,
  dataRootPreservesProvenance,
  deviceCannotImpersonateIdentity,
  trustRootUnknownIsTrusted,
} from './roots';
export type { AuthorityRoot, DataRoot, DecisionRootGraph, DeviceRoot, IdentityRoot } from './roots';

export { modelGrantsOwnPermissions, modelIsOwnAuthority, scheduleAiWorkload } from './models';
export type {
  EmbeddingPolicy,
  InferencePolicy,
  ModelAudit,
  ModelCapability,
  ModelDeployment,
  ModelEvaluation,
  ModelPolicy,
  ModelProvider,
  ModelRegistry,
  ModelRisk,
  ModelRollback,
  ModelVersion,
  PromptPolicy,
  ToolPolicy,
  TrainingDataPolicy,
} from './models';

export {
  dependencyTrustState,
  evaluateArtifact,
  runtimeAttestationClaimed,
  unknownDependencyIsTrusted,
} from './supply-chain';
export type {
  ArtifactSignature,
  DependencyTrust,
  RuntimeIntegrity,
  SbomContract,
  SoftwareSupplyStage,
} from './supply-chain';

export { createGlobalInfrastructure, planePrivilege } from './planes';
export type { ComputePlane, ControlPlane, DataPlane, Underlay } from './planes';
