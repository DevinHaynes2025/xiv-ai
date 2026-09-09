/**
 * Phase 2I-W Experience + Neural Ecosystem barrel.
 * Logical fabric only. Does not claim production deployment or host-OS replacement.
 */

export type {
  AgentSpecialty,
  ComputeBackendV3,
  ConnectorState,
  DeploymentLane,
  ExperienceNav,
  ExperienceSurface,
  KnowledgeState,
  MindHealth,
  MindKind,
  NeuralConnectionState,
  PolyglotStoreV3,
  EnterpriseConnector,
} from './types';
export {
  AGENT_SPECIALTIES,
  COMPUTE_BACKENDS_V3,
  ENTERPRISE_CONNECTORS,
  EXPERIENCE_NAV,
  MIND_KINDS,
  POLYGLOT_STORES_V3,
} from './types';

export {
  declareMind,
  mindDisablesAudit,
  mindDisablesGuardian,
  mindExpandsOwnScope,
  mindSelfGrantsAuthority,
  treatUnknownMindHealthAsHealthy,
  unknownMindHealthIsHealthy,
} from './minds';
export type { GovernedMind } from './minds';

export {
  aiConsensusCreatesVerifiedEvidence,
  availableIsAuthorized,
  neuralBridgeGrantsExtraDataAccess,
  openNeuralFabric,
  proposeAdaptiveRoute,
  requestNeuralConnection,
} from './fabric';
export type {
  NeuralAudit,
  NeuralConfidence,
  NeuralConflict,
  NeuralConnection,
  NeuralConsensus,
  NeuralContext,
  NeuralEvidence,
  NeuralFabric,
  NeuralHealth,
  NeuralMessage,
  NeuralNode,
  NeuralPermission,
  NeuralPurpose,
  NeuralRoute,
} from './fabric';

export {
  contextSanitizerBypassAttempt,
  openCognitiveSecurityGate,
  promoteKnowledge,
  quarantineMind,
  securityGates,
  untrustedSourceBecomesVerified,
} from './security';
export type {
  CognitiveSecurityGate,
  ContextSanitizer,
  ContradictionEngine,
  CrossMindPolicy,
  CrossUniverseLeakDetector,
  DataPoisoningDefense,
  KnowledgeBoundary,
  MindFirewall,
  MindIntegrityMonitor,
  MindQuarantine,
  PrivilegeEscalationDetector,
  PromptInjectionDefense,
  ProvenanceValidator,
} from './security';

export {
  assembleIdeaTaskForce,
  labelIdeaClaim,
  openCreateWorkspace,
} from './create';
export type {
  CreateWorkspace,
  Idea,
  IdeaAgent,
  IdeaContributor,
  IdeaEvidence,
  IdeaExperiment,
  IdeaMarket,
  IdeaOpportunity,
  IdeaOutcome,
  IdeaPipeline,
  IdeaPrototype,
  IdeaRisk,
  IdeaSource,
  IdeaThread,
  IdeaVersion,
} from './create';

export {
  agentReceivesRawDbCredential,
  copiesEntireInternet,
  enterpriseConnectorState,
  listPolyglotStores,
  mediaBinaryInRelationalStore,
  registerKnowledgeSource,
  routeThroughDataAccessGateway,
} from './data';
export type {
  DataAccessDecision,
  DataBackupReference,
  DataBinding,
  DataClass,
  DataCost,
  DataEncryptionPolicy,
  DataHealth,
  DataLineage,
  DataProvenance,
  DataProvider,
  DataRegion,
  DataResidency,
  DataRetention,
  DataStore,
  KnowledgeSource,
} from './data';

export {
  analyzeAuthorizedPost,
  mediaProductionScaleClaimed,
  uploadMediaPipeline,
} from './media';
export type {
  MediaAsset,
  MediaClassification,
  MediaDeletionState,
  MediaEmbedding,
  MediaEvidence,
  MediaMetadata,
  MediaModeration,
  MediaObject,
  MediaRights,
  MediaRetention,
  MediaTranscript,
  MediaUpload,
  MediaVariant,
  PostAnalysis,
} from './media';

export {
  cachePocketV3,
  offlineEscalatesPrivilege,
  syncOfflineAction,
} from './pocket';
export type { PocketBrainV3, PocketCacheKind } from './pocket';

export {
  assembleParallelAgents,
  instantiateSpecialty,
  openAgentSociety,
  temporaryAgentReceivesPermanentAuthority,
} from './agents';
export type { AgentPool, TemporaryAssembly } from './agents';

export { createPipeline, nestPipeline } from './pipelines';
export type {
  NestedPipeline,
  Pipeline,
  PipelineAgent,
  PipelineApproval,
  PipelineAudit,
  PipelineEdge,
  PipelineEvidence,
  PipelineMetric,
  PipelineNode,
  PipelineOutcome,
  PipelinePolicy,
  PipelineTrigger,
} from './pipelines';

export { runBusinessScenario, simulationCreatesAuthority } from './simulation';
export type { BusinessScenarioKind, ScenarioResult } from './simulation';

export {
  openQuantumReadyGateway,
  partnershipClaimedWithVendor,
  quantumOverridesGuardian,
  routeCompute,
} from './compute';
export type { QuantumReadyGateway } from './compute';

export {
  deploymentReadiness,
  evaluateReleaseFlag,
  productionDeploymentAllowed,
} from './deployment';
export type {
  BuildArtifact,
  DeploymentReadiness,
  EnvironmentConfig,
  FeatureFlag,
  HealthCheck,
  KillSwitch,
  MigrationPlan,
  MinimumClientVersion,
  ReadinessCheck,
  ReleaseApproval,
  ReleaseManifest,
  RollbackPlan,
  SBOMReference,
  ArtifactSignature,
} from './deployment';

export {
  adaptExperienceLayout,
  adaptiveExperienceSelfApproves,
  experienceAgentsLengthMustRemain,
  experienceChangesPrimaryNavCount,
  openBrainMap,
  openExperienceFabric,
} from './experience';
export type { AdaptiveLayout, BrainMapSurface, ExperienceFabric } from './experience';

export {
  bindDeveloperSdk,
  developerSandboxAccessesProduction,
  developerStoresRawDbCredential,
  developerTooling,
  openDeveloperWorkspace,
} from './developer';
export type { DeveloperSdkBinding, DeveloperTooling, DeveloperWorkspace } from './developer';

export {
  applyFeedbackAsSecurityRewrite,
  feedbackRewritesSecurityPolicy,
  NEURAL_FEEDBACK_LOOP,
  proposeImprovement,
  recordNeuralLesson,
} from './feedback';
export type { FeedbackStep, ImprovementProposal, NeuralLesson } from './feedback';

export {
  admitMatureContentIntoNeuralFabric,
  evaluateMatureBoundaryRequest,
  matureBoundaryGate,
  matureBoundaryIsProduction,
  openMatureCommunityBoundary,
} from './mature-boundary';
export type { MatureBoundaryGate, MatureCommunityBoundary } from './mature-boundary';

export {
  draftTravelItinerary,
  openTravelPlan,
  travelAgent,
  travelIsLiveBookingEngine,
} from './travel';
export type { TravelAgent, TravelItineraryDraft, TravelPlan } from './travel';

export {
  openSitePreview,
  openSiteSandbox,
  publishSite,
  siteSandboxAccessesProduction,
  sitesAreProductionHosted,
} from './sites';
export type { SitePreview, SitePublishGate, SiteSandbox } from './sites';

export {
  openScaleBoard,
  SCALE_TARGETS,
  scaleClaimsCurrentCapacity,
  scaleTargetIsClaim,
  trillionsOfObjectsClaimed,
} from './scale';
export type { ScaleBoard, ScaleTarget } from './scale';
