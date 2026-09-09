/**
 * Phase 2I-LA-02 Cloud Worker Deployment + Scheduler — typed contracts.
 * Extends LA-01 cloudworkforce. Does not rebuild missions/leases/checkpoints.
 * L4 DISABLED. DEFAULT PERMISSIONS = NONE. Architecture ≠ 24/7 LIVE.
 * Unconfigured providers = NOT_CONFIGURED. Never invent RUNNING without evidence.
 */

import type { AdapterLifecycle, CloudWorkforceAgentId, ComputeGovernorLevel } from '../cloudworkforce/types';

export type { AdapterLifecycle, CloudWorkforceAgentId, ComputeGovernorLevel };

export type CloudProviderKind =
  | 'LOCAL_PROCESS'
  | 'AWS_ECS'
  | 'AWS_LAMBDA'
  | 'GCP_CLOUD_RUN'
  | 'AZURE_CONTAINER_APPS'
  | 'KUBERNETES'
  | 'FLY_IO'
  | 'UNKNOWN';

export type CloudProviderStatus =
  | 'NOT_CONFIGURED'
  | 'CONFIGURED'
  | 'PROVEN'
  | 'DEPLOYED_MINIMAL'
  | 'RUNNING';

/** Honest first-deployment target — never claim RUNNING without evidence. */
export type DeploymentTargetHonesty = {
  provider: CloudProviderKind;
  status: CloudProviderStatus;
  cloudDeployment: 'BLOCKED' | 'READY' | 'MINIMAL_WORKER_DEPLOYED';
  blocker: string | null;
  runs247Live: false;
  indefinite247Claimed: false;
  evidence: readonly string[];
};

export type WorkerProcessState =
  | 'CREATED'
  | 'STARTING'
  | 'HEALTHY'
  | 'DEGRADED'
  | 'UNHEALTHY'
  | 'STOPPING'
  | 'STOPPED'
  | 'CRASHED'
  | 'RECOVERING';

export type WorkerIdentity = {
  workerId: string;
  instanceId: string;
  agentRole: SpecialtyWorkerRole;
  tenantId: string;
  universeId: string;
  capabilities: readonly string[];
  defaultPermissions: 'NONE';
  allTools: false;
  l4Enabled: false;
  forged: false;
  productionLive: false;
};

export type SpecialtyWorkerRole =
  | 'RESEARCH'
  | 'ENGINEERING'
  | 'QA'
  | 'SECURITY'
  | 'DATABASE'
  | 'KNOWLEDGE';

export type ScheduleKind =
  | 'ONCE'
  | 'CRON'
  | 'INTERVAL'
  | 'FOLLOW_THE_SUN'
  | 'NIGHT_SHIFT'
  | 'ON_DEMAND'
  | 'POOL_FILL';

export type AgentSchedule = {
  scheduleId: string;
  kind: ScheduleKind;
  requiredCapabilities: readonly string[];
  preferredRoles: readonly SpecialtyWorkerRole[];
  timezone: string;
  windowStartHourUtc: number | null;
  windowEndHourUtc: number | null;
  maxConcurrent: number;
  nightShiftSafeLimits: true;
  l4Enabled: false;
  productionLive: false;
  continuousAutonomy: false;
};

export type CapabilityMatchResult =
  | { ok: true; workerId: string; score: number }
  | { ok: false; reason: string };

export type WorkerPool = {
  poolId: string;
  roles: readonly SpecialtyWorkerRole[];
  desiredSize: number;
  currentSize: number;
  maxSize: number;
  horizontalScaleEnabled: true;
  autoScaleLive: false;
  defaultPermissions: 'NONE';
  l4Enabled: false;
};

export type FollowTheSunRegion = {
  regionId: string;
  timezone: string;
  activeHoursUtc: readonly [number, number];
};

export type DurableQueueMessage = {
  messageId: string;
  missionId: string;
  payloadCursor: string;
  attempts: number;
  maxAttempts: number;
  enqueuedAt: string;
  visibleAt: string;
  deadLetter: false;
};

export type DeadLetterRecord = {
  messageId: string;
  missionId: string;
  reason: string;
  attempts: number;
  deadLetteredAt: string;
  deadLetter: true;
  autoReplay: false;
};

export type SecretReference = {
  secretId: string;
  provider: 'ENV' | 'GUARDIAN_VAULT' | 'CLOUD_SECRET_MANAGER';
  name: string;
  /** Never holds the secret value — reference only. */
  resolved: false;
  lifecycle: AdapterLifecycle;
  productionLive: false;
};

export type HeartbeatMonitorSample = {
  workerId: string;
  at: string;
  healthy: boolean;
  missedBeats: number;
};

export type AutoRecoveryAction =
  | { kind: 'RESTART_WORKER'; workerId: string; audited: true }
  | { kind: 'REQUEUE_MISSION'; missionId: string; audited: true }
  | { kind: 'QUARANTINE'; workerId: string; audited: true }
  | { kind: 'NONE'; reason: string };

export type CostGovernorDecision = {
  allowed: boolean;
  reason: string;
  estimatedUnits: number;
  budgetRemaining: number;
  selfExpandable: false;
};

export type ModelRouterConnection = {
  connected: boolean;
  routerId: 'xiv-model-router';
  lifecycle: AdapterLifecycle;
  mayBypassBudget: false;
  l4Enabled: false;
};

export type CloudAgentCommMessage = {
  messageId: string;
  fromWorkerId: string;
  toWorkerId: string;
  tenantId: string;
  universeId: string;
  kind: 'STATUS' | 'HANDOFF_REQUEST' | 'CHECKPOINT_HINT' | 'BRIEF_FRAGMENT';
  body: string;
  bypassesTenantIsolation: false;
  bypassesUniverseIsolation: false;
};

export type FounderMissionControlSnapshot = {
  title: 'Founder Mission Control';
  workers: readonly { workerId: string; state: WorkerProcessState; role: SpecialtyWorkerRole }[];
  schedules: readonly string[];
  poolSizes: readonly { poolId: string; current: number; desired: number }[];
  cloudWorkerVerified: boolean;
  runs247Live: false;
  indefinite247: false;
  l4Enabled: false;
  defaultPermissions: 'NONE';
  founderBriefEmail: 'devinhaynes2025@gmail.com';
};

export type WhileYouWereAwayReport = {
  title: 'While You Were Away';
  completedMissionIds: readonly string[];
  failedMissionIds: readonly string[];
  recoveredCrashes: number;
  deadLetters: number;
  humanDecisionsRequired: readonly string[];
  productionDeployedOvernight: false;
  agentsRan24x7Live: false;
  cloudWorkerVerified: boolean;
};

export type CloudWorkerEvidence = {
  phase: '2I-LA-02';
  cloudDeployment: 'BLOCKED' | 'READY' | 'MINIMAL_WORKER_DEPLOYED';
  cloudDeploymentBlocker: string | null;
  providerStatus: CloudProviderStatus;
  cloudWorkerVerified: boolean;
  offlineFounderTestPassed: boolean;
  crashRecoveryTestPassed: boolean;
  runs247Live: false;
  indefinite247Claimed: false;
  l4Enabled: false;
  defaultPermissions: 'NONE';
  unconfiguredAdapters: 'NOT_CONFIGURED';
  founderBriefEmail: 'devinhaynes2025@gmail.com';
  computePressure: ComputeGovernorLevel;
  mappedLa01Agents: readonly CloudWorkforceAgentId[];
};

export type NightShiftV1Limits = {
  maxMissionsPerShift: number;
  maxConcurrentWorkers: number;
  maxRetries: number;
  allowSilentProdDeploy: false;
  allowL4: false;
  allowSelfGrant: false;
  allowSecretRotation: false;
  runs247Live: false;
};
