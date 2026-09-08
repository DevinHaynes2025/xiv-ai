/**
 * Phase 2I-Y Night Shift & Intelligence Task Force Fabric barrel.
 * Governed research / QA / outreach / compute / network contracts.
 * No silent production deploy. L4 disabled. Quantum/network NOT_CONFIGURED without proof.
 */

export type {
  CapabilityLifecycle,
  ClassificationLadder,
  ComputeBackendV4,
  DataTaskForceRole,
  IntelligenceLane,
  IntelligenceTaskForceKind,
  NetworkFabricMode,
  NightShiftJobKind,
  OutreachChannel,
  PatentWorkspaceStage,
  VirtualNeuralAddress,
} from './types';
export {
  CLASSIFICATION_LADDER,
  COMPUTE_BACKENDS_V4,
  DATA_TASK_FORCE_ROLES,
  NIGHT_SHIFT_JOB_KINDS,
} from './types';

export {
  conveneIntelligenceTaskForce,
  intelligenceTaskForceDisablesGuardian,
  intelligenceTaskForceGrantsL4,
  taskForceCollaborationSharesPermissions,
  taskForceMemberSelfGrantsAuthority,
  taskForceTransfersPermissions,
} from './task-forces';
export type { IntelligenceTaskForce, IntelligenceTaskForceMember } from './task-forces';

export {
  applySandboxPatch,
  composeFounderBriefV2,
  nightShiftV2ChangesSecurityPolicy,
  nightShiftV2DeploysProduction,
  nightShiftV2MayRecommend,
  nightShiftV2SelfGrantsAuthority,
  nightShiftV2SelfGrantsCredentials,
  nightShiftV2SilentProductionDeploy,
  openNightShiftV2,
} from './night-shift-v2';
export type { FounderBriefV2, NightShiftV2Job } from './night-shift-v2';

export {
  claimsGovernmentClassifiedIntel,
  companyPrivateAutoEntersGlobalLibrary,
  ingestIntelligenceRecord,
  openIntelligenceLibrary,
  privateIntelligenceEqualsGlobal,
} from './intelligence-library';
export type { IntelligenceLibrary, IntelligenceLibraryRecord } from './intelligence-library';

export {
  intakePriorArt,
  openPatentFoundry,
  patentFoundryClaimsPatentability,
  promoteToCounselWorkspace,
  unauthorizedPatentDbIngestAllowed,
} from './patent-foundry';
export type { PatentFoundry, PriorArtIntake } from './patent-foundry';

export {
  evaluateOutreach,
  outreachBypassesConsent,
  outreachBypassesSuppression,
  outreachIgnoresJurisdiction,
  yellowPagesSpamAllowed,
} from './outreach';
export type { OutreachDecision, OutreachRequest } from './outreach';

export {
  computeCreatesAuthority,
  openAdvancedComputeFabric,
  quantumFutureConfiguredWithoutProof,
  quantumProviderState,
  routeAdvancedCompute,
} from './compute-fabric';
export type { AdvancedComputeFabric } from './compute-fabric';

export {
  authorizeNetworkPath,
  networkEqualsAuthorization,
  networkProviderState,
  openNetworkAbstractionFabric,
  unauthorizedConnectivityAllowed,
} from './network-fabric';
export type { NetworkAbstractionFabric } from './network-fabric';

export {
  acquiresGovernmentClassifiedIntel,
  autoDowngradeClassificationAllowed,
  classificationRank,
  mayAccessClassification,
  openClassificationPolicy,
} from './classification';
export type { ClassificationPolicy } from './classification';

export {
  allocateVirtualNeuralAddress,
  claimLiteralTrillionAgents,
  neuralGraphCreatesAuthority,
  openNeuralGraph,
  routeNeuralGraphEdge,
} from './neural-graph';
export type { NeuralGraph, NeuralGraphNode } from './neural-graph';

export {
  gmailLiveSendConfiguredWithoutProof,
  gmailLiveSendState,
  openGmailChannelContract,
  recordGmailLiveSendProof,
  resetGmailProofForTests,
  sendViaGmail,
} from './gmail';
export type { GmailChannelContract } from './gmail';

export {
  dataTaskForceBypassesDataAccessGateway,
  dataTaskForceBypassesGuardian,
  dataTaskForceDbAccess,
  dataTaskForceReceivesRawCredentials,
  listDataTaskForceRoles,
  openDataTaskForceCatalog,
} from './data-task-force';
export type { DataTaskForceCatalog } from './data-task-force';
