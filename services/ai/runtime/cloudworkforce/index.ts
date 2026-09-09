/**
 * Phase 2I-LA-01 Persistent Cloud Agent Workforce barrel.
 * Missions, leases, checkpoints, debriefs, queue, recovery, Night Shift template.
 * DEFAULT PERMISSIONS = NONE. L4 DISABLED. Architecture ≠ 24/7 LIVE.
 */

export type {
  AdapterLifecycle,
  AgentBudget,
  AgentCheckpoint,
  AgentDebrief,
  AgentExecutionEvent,
  AgentHandoff,
  AgentHeartbeat,
  AgentLease,
  AgentMemoryScopeClass,
  AgentMission,
  AgentMissionQueueAdapterKind,
  AgentMissionStatus,
  AgentMissionStatusTransition,
  AgentShift,
  AgentWorkforceMessage,
  AgentWorkforceMessageType,
  AgentWorker,
  CloudWorkforceAgentId,
  ComputeGovernorLevel,
  FounderShiftBrief,
  SecurityAuditResult,
  SecurityDecision,
  WorkforceObservabilityMetrics,
} from './types';
export {
  AGENT_MISSION_STATUSES,
  CLOUD_WORKFORCE_AGENT_IDS,
  COMPUTE_GOVERNOR_LEVELS,
  DEFAULT_LEASE_TTL_MS,
  DEFAULT_MAX_RETRIES,
  FOUNDER_BRIEF_EMAIL,
} from './types';

export {
  agentMayEscalateOwnAuthority,
  evaluateTransition,
  listAllowedTransitions,
  openTransitionAudit,
  transitionMission,
} from './transitions';

export {
  createLease,
  duplicateClaimRejected,
  leaseIsExpired,
  recoverExpiredLease,
  releaseLease,
  renewLease,
} from './lease';

export {
  checkpointTransfersAuthority,
  createCheckpoint,
  resumeFromCheckpoint,
  verifyCheckpointSignature,
} from './checkpoint';

export {
  createMission,
  DbBackedAgentMissionQueue,
  openDbBackedAgentMissionQueue,
} from './queue';
export type { AgentMissionQueue, ClaimResult, QueueOpResult } from './queue';

export {
  architectureExistsMeans247Live,
  awsTaskQueueAdapter,
  cloudTaskQueueAdapter,
  cloudWorkforceRuns247Live,
  queueAdapterLifecycle,
  redisQueueAdapter,
  resolveQueueAdapter,
} from './adapters';
export type { UnconfiguredQueueAdapter } from './adapters';

export {
  elevatePressure,
  listComputeGovernorLevels,
  maxConcurrencyFor,
  openComputeGovernor,
  pressureReducesConcurrency,
} from './governor';

export {
  applyBoundedRecovery,
  defaultMaxRetries,
  evaluateRecovery,
  recordHeartbeat,
} from './heartbeat';

export { createDebrief, debriefPromotesToGlobalBrain } from './debrief';

export {
  CLOUD_WORKFORCE_TEAM,
  listCloudWorkforceAgentIds,
  listCloudWorkforceAgents,
  openAgentShift,
  registerCloudWorker,
  workerDefaultPermissions,
  workerHasAllTools,
} from './workers';
export type { CloudWorkforceAgentDefinition } from './workers';

export {
  evaluateNightShiftWork,
  NIGHT_SHIFT_ALLOWED_WORK,
  NIGHT_SHIFT_NOT_AUTOMATICALLY_ALLOWED,
  NIGHT_SHIFT_TEMPLATE_ID,
  openNightShiftMissionTemplate,
} from './nightshift';
export type {
  NightShiftAllowedWork,
  NightShiftForbiddenWork,
  NightShiftMissionTemplate,
} from './nightshift';

export {
  createMissionHandoff,
  evaluateHandoff,
  executeHandoff,
  handoffTransfersAuthority,
  handoffTransfersPermissions,
} from './handoff';
export type { HandoffBundle } from './handoff';

export {
  agentsMaySelfGrantPermissions,
  agentsMaySilentProductionDeploy,
  allow,
  capabilityEqualsPrivilege,
  cloudWorkforceL4Enabled,
  defaultPermissionsAreNone,
  deny,
  evaluateSecurity,
} from './security';
export type { SecurityAction } from './security';

export {
  agentsRan24x7LiveClaim,
  createFounderShiftBrief,
  founderBriefDeliveryEmail,
  founderBriefGmailIsLive,
  founderTwinIsDeliveryAuthority,
} from './brief';

export { openWorkforceObservability } from './observability';

export {
  openFounderBriefUi,
  openMissionControlPanel,
  openWhileYouWereAwayUi,
} from './ui';
export type {
  FounderBriefUiContract,
  MissionControlMissionRow,
  MissionControlPanelContract,
  WhileYouWereAwayUiContract,
} from './ui';

export {
  createWorkforceMessage,
  messageBypassesTenantIsolation,
  messageBypassesUniverseIsolation,
} from './messages';

export {
  budgetIsSelfExpandable,
  createAgentBudget,
  evaluateBudgetSpend,
} from './budget';

export {
  cloudWorkforceProductionLive,
  defaultPermissions,
  persistentArchitectureMeans247Live,
  productionCredentialsEnabledInPhase2ila,
  stoppedBeforeNewProductionCredentials,
} from './invariants';

export {
  classifyMemoryScope,
  evaluateGlobalBrainPromotion,
  memoryAutoPromotesToGlobalBrain,
  recordMissionMemoryChain,
} from './memory';
export type { MissionMemoryRecord } from './memory';

export {
  architectureExistsIsNotLive247,
  bumpMetric,
  createEmptyMetrics,
} from './metrics';

/** Phase grounding — honest lifecycle labels. */
export function openPhase2ilaGrounding() {
  return {
    phase: '2I-LA-01' as const,
    title: 'Persistent Cloud Agent Workforce',
    l4Enabled: false as const,
    defaultPermissions: 'NONE' as const,
    architectureExistsIsNotLive247: true as const,
    productionLive: false as const,
    unconfiguredAdapters: 'NOT_CONFIGURED' as const,
    founderBriefEmail: 'devinhaynes2025@gmail.com' as const,
    gmailDelivery: 'NOT_CONFIGURED' as const,
  };
}
