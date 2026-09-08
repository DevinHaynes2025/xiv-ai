/**
 * Phase 2I-AC Continuous Evolution barrel.
 * Feedback Loop V4 + Interface Evolution + Night Shift V4 + Continuous Evolution Engine + Content/Visual intelligence.
 * Scale targets remain ENGINEERING_CAPACITY_TARGET. L4 disabled.
 */

export type {
  ContentIntelligenceStage,
  FeedbackLoopStage,
  InterfaceProposalKind,
  NightShiftKind,
  VisualGraphKind,
} from './types';
export {
  CONTENT_INTELLIGENCE_STAGES,
  FEEDBACK_LOOP_STAGES,
  INTERFACE_PROPOSAL_KINDS,
  NIGHT_SHIFT_KINDS,
  VISUAL_GRAPH_KINDS,
} from './types';

export {
  advanceFeedbackStage,
  listFeedbackLoopStages,
  measureActualOutcome,
  openFeedbackLoopV4,
  runFeedbackCycle,
  storeExpectedOutcome,
} from './feedback';
export type { ActualOutcome, ExpectedOutcome, FeedbackCycle } from './feedback';

export {
  darkPatternsAllowed,
  interfaceProposalAutoShips,
  listInterfaceProposalKinds,
  openInterfaceEvolutionEngine,
  proposeInterfaceChange,
} from './interface';
export type {
  AccessibilityIssue,
  FeatureUsage,
  InterfaceExperiment,
  PerformanceMetric,
  UIObservation,
  UIProposal,
  UIPrototype,
  UserJourney,
  UXEvaluation,
  UXFeedback,
} from './interface';

export {
  aggregateMorningFounderBrief,
  createNightShiftMission,
  listNightShiftKinds,
  nightShiftMaySilentProductionDeploy,
  openNightShiftV3,
  openNightShiftV4,
} from './nightshift';
export type { MorningFounderBrief, NightShiftMission, NightShiftV3, NightShiftV4 } from './nightshift';

export {
  continuousEvolutionMayAutoShip,
  listContinuousEvolutionStages,
  openContinuousEvolutionEngine,
  CONTINUOUS_EVOLUTION_STAGES,
} from './continuous';
export type { ContinuousEvolutionEngine, ContinuousEvolutionStage } from './continuous';

export {
  advanceContentStage,
  createVisualGraphNode,
  listContentIntelligenceStages,
  listVisualGraphKinds,
  openContentIntelligenceEngine,
  openVisualIntelligenceContracts,
  startContentPipeline,
  visualNodeExposesRequiredFields,
} from './content';
export type { ContentPipelineRun, VisualGraphNodeContract } from './content';

export {
  agentDeploymentState,
  aiAgreementEqualsTruth,
  claimBillionsOfUsers,
  claimTrillionsOfAgentsOrDatabases,
  connectedNetworkEqualsTrusted,
  creativeControlEqualsProductionControl,
  extremeScaleIsProven,
  extremeScaleStatus,
  founderTwinEqualsActualFounder,
  l4AutonomyEnabled,
  l4RemainsDisabled,
  listNotConfiguredProviders,
  moreAgentsMeansMorePermissions,
  moreDataMeansPermissionToUse,
  moreIntelligenceMeansMoreAuthority,
  offlineEqualsAuthorized,
  openPhase2iacInvariants,
  PHASE2IAC_PROVIDER_KEYS,
  pluginInstalledEqualsUnrestricted,
  productionCredentialsEnabledInPhase2iac,
  providerState,
  stoppedBeforeNewProductionCredentials,
} from './invariants';
export type { Phase2iacProviderKey, ProviderConfigState } from './invariants';
