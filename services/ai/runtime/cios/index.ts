/**
 * Phase 2I-Z Continuous Intelligence OS Foundation barrel.
 * Governed cross-platform intelligence operating fabric.
 * L4 disabled. GDF production-live false. MongoDB NOT_CONFIGURED.
 * Offline ≠ authorization. Foresight ≠ certainty. Patent research ≠ filing authority.
 * NVIDIA = accelerator not authority. XIV does not replace host OS.
 * Extreme scale NOT PROVEN. No new LIVE provider claims without evidence.
 */

export type {
  AgentAllowedAction,
  AgentForbiddenAction,
  AgentSocietyRole,
  CapabilityLifecycle,
  ContinuousBoundary,
  DataFabricAdapterKind,
  FoundryPipelineStage,
  GovernanceStackHop,
  IntelligenceFabricLane,
  OfflineSyncStage,
  OperationsShiftKind,
  PlatformCapability,
  PocketSyncScope,
  ScaleEngineeringTarget,
  SecurityExpansionControl,
  ShiftLifecycleStage,
} from './types';
export {
  AGENT_ALLOWED_ACTIONS,
  AGENT_FORBIDDEN_ACTIONS,
  AGENT_SOCIETY_ROLES,
  CONTINUOUS_BOUNDARIES,
  DATA_FABRIC_ADAPTER_KINDS,
  FOUNDER_TWIN_DISCLOSURE,
  FOUNDRY_PIPELINE,
  GOVERNANCE_STACK,
  INTELLIGENCE_FABRIC_LANES,
  OFFLINE_SYNC_STAGES,
  OPERATIONS_SHIFT_KINDS,
  PLATFORM_CAPABILITIES,
  SCALE_ENGINEERING_TARGETS,
  SECURITY_EXPANSION_CONTROLS,
  SHIFT_LIFECYCLE,
} from './types';

export {
  adapterPresenceCreatesAuthority,
  dataFabricAdapterState,
  fabricMarksProviderLiveWithoutProof,
  listDataFabricAdapters,
  mongoDbIsLive,
  mongoDbLifecycle,
  openContinuousDataFabric,
} from './fabric';
export type { ContinuousDataFabric, DataFabricAdapter } from './fabric';

export {
  agentBudgetSelfExpands,
  agentLessonRewritesSecurity,
  agentRecoveryBypassesGuardian,
  agentVoteCreatesAuthority,
  createAgentHandoff,
  createAgentIdentity,
  createAgentProposal,
  createAgentRun,
  createAgentTaskForce,
} from './collaboration';
export type {
  AgentBudget,
  AgentCapability,
  AgentCheckpoint,
  AgentCritique,
  AgentEvaluation,
  AgentEvidence,
  AgentFailure,
  AgentHandoff,
  AgentIdentity,
  AgentLesson,
  AgentMeeting,
  AgentProposal,
  AgentRecovery,
  AgentRun,
  AgentTask,
  AgentTaskForce,
  AgentToolGrant,
  AgentVote,
} from './collaboration';

export {
  agentMayBypassGuardian,
  agentMayBypassHumanApproval,
  agentMayCreateHiddenCredentials,
  agentMayDisableGuardian,
  agentMayPromoteToL4,
  agentMayReadUnauthorizedTenantData,
  agentMayRewriteAuthority,
  agentMaySelfGrantPermissions,
  agentMaySilentProductionDeploy,
  agentMayWeakenTenantIsolation,
  evaluateAgentAction,
  listAllowedAgentActions,
  listForbiddenAgentActions,
  moreCapabilityMeansMoreAuthority,
  requestForbiddenAction,
} from './governance';

export {
  gatewayBypassesGuardian,
  gatewayWeakensTenantIsolation,
  listGovernanceStack,
  openCapabilityGateway,
  routeThroughGovernanceStack,
} from './gateway';
export type { CapabilityGateway, GatewayRequest } from './gateway';

export {
  listAgentSocietyRoles,
  listIntelligenceFabricLanes,
  openAgentSociety,
  openIntelligenceFabric,
  privateIntelligenceAutoEntersGlobal,
  societyRoleGrantsL4,
} from './society';
export type { AgentSociety, IntelligenceFabric } from './society';

export {
  advanceShiftStage,
  continuousOperationWithoutBoundaries,
  executeShiftTask,
  listContinuousBoundaries,
  listOperationsShifts,
  listShiftLifecycle,
  openOperationsShift,
  shiftUncontrolledAutonomyAllowed,
} from './shifts';
export type { OperationsShift } from './shifts';

export {
  listOfflineSyncStages,
  offlineBypassesServerAuthority,
  offlineEqualsAuthorization,
  offlineGrantsNewPermissions,
  openPocketBrain,
  queueSignedLocalEvent,
  synchronizeOfflineQueue,
} from './pocket';
export type { OfflineEvent, PocketBrainSession } from './pocket';

export {
  founderTwinDisclosure,
  founderTwinHasRealAuthority,
  founderTwinIsRealFounder,
  openFounderIntelligence,
  openFounderTwinSurface,
} from './founder';
export type { FounderBiography, FounderIntelligenceProfile, FounderTwinSurface } from './founder';

export {
  computeForesight,
  foresightClaimsCertainty,
  foresightEqualsCertainty,
  openForesightEngine,
} from './foresight';
export type { ForesightEngine, ForesightInput, ForesightOutput } from './foresight';

export {
  advanceFoundryStage,
  foundryOffersAutonomousLegalAdvice,
  listFoundryPipeline,
  openProductFoundry,
  patentResearchIsFilingAuthority,
} from './foundry';
export type { FoundryAdvanceRequest, ProductFoundry } from './foundry';

export {
  listPlatformCapabilities,
  nvidiaAcceleratorCreatesAuthority,
  nvidiaIsAuthorityLayer,
  openCrossPlatformFabric,
  routeNvidiaAcceleration,
  xivReplacesHostOs,
} from './platforms';
export type { CrossPlatformFabric, PlatformCapabilityContract } from './platforms';

export {
  claimExtremeScaleProven,
  extremeScaleIsProven,
  listScaleEngineeringTargets,
  openScaleFabric,
  trillionNodeScaleIsProven,
} from './scale';
export type { ScaleFabric, ScaleTarget } from './scale';

export {
  evaluateSecurityControl,
  listSecurityExpansionControls,
  openSecurityExpansion,
  securityExpansionBypassable,
  securityExpansionGrantsAuthority,
} from './security';
export type { SecurityExpansionFabric } from './security';
