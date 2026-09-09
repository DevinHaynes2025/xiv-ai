/**
 * Phase 2I-LA-01 Persistent Cloud Agent Workforce — typed contracts.
 * Architecture ≠ 24/7 LIVE. L4 DISABLED. DEFAULT PERMISSIONS = NONE.
 * Capability ≠ privilege. Unconfigured adapters = NOT_CONFIGURED.
 */

export type AdapterLifecycle = 'NOT_CONFIGURED' | 'CONFIGURED' | 'PROVEN' | 'LIVE';

export type AgentMissionStatus =
  | 'DRAFT'
  | 'QUEUED'
  | 'CLAIMED'
  | 'RUNNING'
  | 'CHECKPOINTING'
  | 'HANDED_OFF'
  | 'COMPLETED'
  | 'FAILED'
  | 'RETRY_WAIT'
  | 'QUARANTINED'
  | 'CANCELLED'
  | 'ORPHANED';

export type ComputeGovernorLevel =
  | 'NORMAL'
  | 'ELEVATED'
  | 'HIGH'
  | 'CRITICAL'
  | 'EMERGENCY'
  | 'UNKNOWN';

export type AgentMemoryScopeClass =
  | 'MISSION_LOCAL'
  | 'WORKER_SCOPED'
  | 'TENANT_SCOPED'
  | 'UNIVERSE_SCOPED'
  | 'COMPANY_PRIVATE'
  | 'GLOBAL_BRAIN_CANDIDATE';

export type CloudWorkforceAgentId =
  | 'night_research'
  | 'night_engineering'
  | 'night_qa'
  | 'night_security'
  | 'night_data_quality'
  | 'night_product'
  | 'founder_brief_aggregator'
  | 'mission_router';

export type AgentMissionQueueAdapterKind = 'DB_BACKED' | 'AWS_TASK' | 'REDIS_QUEUE' | 'CLOUD_TASK';

export type SecurityDecision = 'ALLOWED' | 'DENIED';

/** Required mission identity + isolation + authority bounds. */
export type AgentMission = {
  missionId: string;
  tenantId: string;
  universeId: string;
  objective: string;
  status: AgentMissionStatus;
  templateId: string | null;
  assignedWorkerId: string | null;
  authorityLevel: 'L0' | 'L1' | 'L2' | 'L3';
  /** Agents cannot self-expand. Always false on mission record. */
  selfExpandableAuthority: false;
  budgetId: string;
  retryCount: number;
  maxRetries: number;
  leaseId: string | null;
  checkpointId: string | null;
  createdAt: string;
  updatedAt: string;
  l4Enabled: false;
  productionLive: false;
  permissions: readonly never[];
};

export type AgentMissionStatusTransition = {
  from: AgentMissionStatus;
  to: AgentMissionStatus;
  allowed: boolean;
  reason?: string;
};

export type AgentWorker = {
  workerId: string;
  agentId: CloudWorkforceAgentId;
  tenantId: string;
  universeId: string;
  shiftId: string | null;
  status: 'IDLE' | 'BUSY' | 'OFFLINE' | 'QUARANTINED';
  /** DEFAULT PERMISSIONS = NONE — never all-tools. */
  permissions: readonly never[];
  toolsGranted: readonly never[];
  defaultPermissions: 'NONE';
  allTools: false;
  l4Enabled: false;
  capabilityEqualsPrivilege: false;
  productionLive: false;
  forged: false;
};

export type AgentShift = {
  shiftId: string;
  kind: 'NIGHT' | 'DAY' | 'HANDOFF' | 'FOUNDER_BRIEF';
  tenantId: string;
  universeId: string;
  startedAt: string;
  endsAt: string | null;
  continuousAutonomy: false;
  productionLive: false;
};

export type AgentCheckpoint = {
  checkpointId: string;
  missionId: string;
  tenantId: string;
  universeId: string;
  workerId: string;
  progressCursor: string;
  completedSteps: readonly string[];
  pendingSteps: readonly string[];
  contextRefs: readonly string[];
  memoryRefs: readonly string[];
  repoStateRef: string | null;
  dbStateRef: string | null;
  lastHeartbeatAt: string;
  attemptCount: number;
  signature: string;
  tampered: false;
  transfersAuthority: false;
  createdAt: string;
};

export type AgentDebrief = {
  debriefId: string;
  missionId: string;
  tenantId: string;
  universeId: string;
  workerId: string;
  outcome: 'SUCCESS' | 'PARTIAL' | 'FAILED' | 'QUARANTINED' | 'HANDED_OFF';
  summary: string;
  findings: readonly string[];
  blockers: readonly string[];
  lessons: readonly string[];
  humanDecisionsRequired: readonly string[];
  evidenceRefs: readonly string[];
  promotesToGlobalBrain: false;
  createdAt: string;
};

export type AgentHeartbeat = {
  heartbeatId: string;
  missionId: string;
  leaseId: string;
  workerId: string;
  tenantId: string;
  universeId: string;
  at: string;
  healthy: boolean;
};

export type AgentLease = {
  leaseId: string;
  missionId: string;
  workerId: string;
  tenantId: string;
  universeId: string;
  acquiredAt: string;
  expiresAt: string;
  heartbeatAt: string;
  active: boolean;
};

export type AgentBudget = {
  budgetId: string;
  missionId: string;
  tenantId: string;
  universeId: string;
  costCeiling: number;
  spent: number;
  selfExpandable: false;
};

export type AgentHandoff = {
  handoffId: string;
  missionId: string;
  fromWorkerId: string;
  toWorkerId: string;
  tenantId: string;
  universeId: string;
  checkpointId: string;
  debriefId: string | null;
  viaGuardian: true;
  viaMissionRouter: true;
  transfersPermissions: false;
  transfersAuthority: false;
  sameTenantRequired: true;
  sameUniverseRequired: true;
  createdAt: string;
};

export type AgentExecutionEvent = {
  eventId: string;
  missionId: string;
  tenantId: string;
  universeId: string;
  workerId: string | null;
  kind:
    | 'ENQUEUED'
    | 'CLAIMED'
    | 'HEARTBEAT'
    | 'CHECKPOINT'
    | 'RELEASED'
    | 'COMPLETED'
    | 'FAILED'
    | 'RETRY'
    | 'QUARANTINED'
    | 'ORPHAN_RECOVERY'
    | 'HANDOFF'
    | 'SECURITY_DENIED'
    | 'BUDGET_EXCEEDED'
    | 'AUTHORITY_ESCALATION_DENIED';
  at: string;
  detail: string;
  audited: true;
};

export type AgentWorkforceMessageType =
  | 'MISSION_ASSIGN'
  | 'MISSION_STATUS'
  | 'CHECKPOINT_SYNC'
  | 'DEBRIEF'
  | 'HANDOFF_REQUEST'
  | 'HEARTBEAT'
  | 'SECURITY_ALERT'
  | 'FOUNDER_ATTENTION';

export type AgentWorkforceMessage = {
  messageId: string;
  type: AgentWorkforceMessageType;
  missionId: string;
  tenantId: string;
  universeId: string;
  fromWorkerId: string | null;
  toWorkerId: string | null;
  payload: Readonly<Record<string, unknown>>;
  bypassesTenantIsolation: false;
  bypassesUniverseIsolation: false;
  createdAt: string;
};

export type FounderShiftBrief = {
  briefId: string;
  shiftId: string;
  generatedAt: string;
  deliveryEmail: 'devinhaynes2025@gmail.com';
  deliveryLifecycle: AdapterLifecycle;
  sections: {
    missionsCompleted: readonly string[];
    missionsFailed: readonly string[];
    quarantined: readonly string[];
    checkpoints: readonly string[];
    handoffs: readonly string[];
    securityDenials: readonly string[];
    budgetAlerts: readonly string[];
    lessons: readonly string[];
    humanDecisionsRequired: readonly string[];
    computePressure: ComputeGovernorLevel;
  };
  twinIsAuthority: false;
  productionDeployedOvernight: false;
  agentsRan24x7Live: false;
};

export type WorkforceObservabilityMetrics = {
  missionsQueued: number;
  missionsRunning: number;
  missionsCompleted: number;
  missionsFailed: number;
  missionsQuarantined: number;
  activeLeases: number;
  expiredLeasesRecovered: number;
  duplicateClaimsRejected: number;
  heartbeats: number;
  checkpoints: number;
  handoffs: number;
  securityDenials: number;
  computeGovernorLevel: ComputeGovernorLevel;
  maxConcurrency: number;
  architectureExistsIsNotLive247: true;
};

export type SecurityAuditResult = {
  decision: SecurityDecision;
  reason: string;
  audited: true;
};

export const AGENT_MISSION_STATUSES: readonly AgentMissionStatus[] = [
  'DRAFT',
  'QUEUED',
  'CLAIMED',
  'RUNNING',
  'CHECKPOINTING',
  'HANDED_OFF',
  'COMPLETED',
  'FAILED',
  'RETRY_WAIT',
  'QUARANTINED',
  'CANCELLED',
  'ORPHANED',
] as const;

export const COMPUTE_GOVERNOR_LEVELS: readonly ComputeGovernorLevel[] = [
  'NORMAL',
  'ELEVATED',
  'HIGH',
  'CRITICAL',
  'EMERGENCY',
  'UNKNOWN',
] as const;

export const CLOUD_WORKFORCE_AGENT_IDS: readonly CloudWorkforceAgentId[] = [
  'night_research',
  'night_engineering',
  'night_qa',
  'night_security',
  'night_data_quality',
  'night_product',
  'founder_brief_aggregator',
  'mission_router',
] as const;

export const DEFAULT_MAX_RETRIES = 3;
export const DEFAULT_LEASE_TTL_MS = 60_000;
export const FOUNDER_BRIEF_EMAIL = 'devinhaynes2025@gmail.com' as const;
