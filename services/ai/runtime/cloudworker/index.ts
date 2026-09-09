/**
 * Phase 2I-LA-02 Cloud Worker Deployment + Scheduler barrel.
 * Extends LA-01 cloudworkforce. L4 DISABLED. DEFAULT PERMISSIONS = NONE.
 * Architecture ≠ 24/7 LIVE. Unconfigured = NOT_CONFIGURED.
 */

export type {
  AgentSchedule,
  AutoRecoveryAction,
  CapabilityMatchResult,
  CloudAgentCommMessage,
  CloudProviderKind,
  CloudProviderStatus,
  CloudWorkerEvidence,
  CostGovernorDecision,
  DeadLetterRecord,
  DeploymentTargetHonesty,
  DurableQueueMessage,
  FollowTheSunRegion,
  FounderMissionControlSnapshot,
  HeartbeatMonitorSample,
  ModelRouterConnection,
  NightShiftV1Limits,
  ScheduleKind,
  SecretReference,
  SpecialtyWorkerRole,
  WhileYouWereAwayReport,
  WorkerIdentity,
  WorkerPool,
  WorkerProcessState,
} from './types';

export {
  openCloudAgentRuntime,
  openPhase2ilbGrounding,
  registerRuntimeWorker,
  startRuntimeWorker,
  providerStatusLabel,
} from './runtime';
export type { CloudAgentRuntime } from './runtime';

export {
  detectCloudDeployment,
  deployMinimalCloudWorker,
  labelProviderRunningWithoutEvidence,
  probeVerifiedCloud,
} from './deployment';

export { transitionWorkerProcess, workerLifecycleAllowsL4 } from './lifecycle';
export type { LifecycleEvent } from './lifecycle';

export {
  createWorkerIdentity,
  identityDefaultPermissions,
  identityHasAllTools,
} from './identity';

export {
  SCHEDULE_KINDS,
  createSchedule,
  matchWorkerCapabilities,
  openAgentScheduler,
  registerSchedule,
  scheduleAllowsSilentProd,
} from './scheduler';
export type { AgentScheduler } from './scheduler';

export {
  markPoolWorkerStarted,
  openWorkerPool,
  poolAutoScaleIsLive,
  scalePool,
} from './pools';

export {
  DEFAULT_FOLLOW_THE_SUN_REGIONS,
  activeFollowTheSunRegions,
  followTheSunMeans247,
  isRegionActive,
  registerFollowTheSunSchedules,
} from './follow-the-sun';

export {
  SPECIALTY_WORKERS,
  listSpecialtyWorkers,
  mappedLa01AgentIds,
  spawnSpecialtyWorker,
} from './specialty-workers';
export type { SpecialtyWorkerDef } from './specialty-workers';

export {
  ackDurable,
  claimDurable,
  enqueueDurable,
  failDurable,
  listDeadLetters,
  openDurableCloudQueue,
} from './durable-queue';
export type { DurableCloudQueue } from './durable-queue';

export {
  applyWorkerCrashRecovery,
  evaluateAutoRecovery,
  openHeartbeatMonitor,
  recordWorkerHeartbeat,
  runCrashRecoveryAgainstLa01,
} from './recovery';
export type { HeartbeatMonitor } from './recovery';

export {
  NIGHT_SHIFT_V1_LIMITS,
  nightShiftAllowsSilentProd,
  nightShiftAllowedWorkCount,
  openNightShiftV1Runtime,
  registerNightShiftSchedule,
  tryStartNightShiftMission,
} from './night-shift-v1';
export type { NightShiftV1Runtime } from './night-shift-v1';

export {
  createSecretReference,
  resolveSecretValue,
  secretReferenceHoldsValue,
} from './secrets';

export {
  openGuardianDbPath,
  requestGuardianDbQuery,
  workerMayHoldRawDbUrl,
} from './guardian-db';
export type { GuardianDbPath } from './guardian-db';

export {
  connectModelRouter,
  costRespectsComputePressure,
  evaluateCost,
  modelRouterMayBypassCost,
  openCostGovernor,
} from './cost-governor';

export {
  assignScheduleToCapableWorker,
  openAgentWorkforceManager,
  provisionSpecialtyWorker,
  resizePool,
  workforceRuns247,
} from './workforce-manager';
export type { AgentWorkforceManager } from './workforce-manager';

export {
  createCloudAgentMessage,
  deliverCloudAgentMessage,
} from './communication';

export {
  buildWhileYouWereAwayReport,
  openFounderMissionControl,
} from './founder-control';

export {
  appendAudit,
  auditAllowsSilentProd,
  openCloudWorkerAuditLog,
} from './audit';
export type { CloudWorkerAuditEvent, CloudWorkerAuditLog } from './audit';

export { runOfflineFounderTest } from './offline-founder';
export type { OfflineFounderTestResult } from './offline-founder';

export { collectCloudWorkerEvidence } from './evidence';
