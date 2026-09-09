/**
 * 62L-EX13 — Quantum Pathway Plasticity + Hybrid Application Feedback Loop.
 * Parent: 62L-EX / GitHub #170. EY follow-on hooks → GitHub #173 (soft-wire only).
 *
 * SOFTWARE neural pathway plasticity from application lifecycle evidence.
 * NOT biological consciousness. NOT a second agent system.
 * DOCUMENTED ≠ IMPLEMENTED ≠ VERIFIED ≠ PRODUCTION AUTHORIZED.
 * Simulator ≠ physical QPU. PREFERRED ≠ authority. L4_AUTONOMY_ENABLED=false.
 */

export const HONESTY_BANNER =
  'APPLICATION EVENT→TELEMETRY→EVIDENCE→REVIEW→PATHWAY UPDATE→ROUTING CANDIDATE→RETEST→VERIFIED LESSON; presence≠VERIFIED; PREFERRED≠authority; simulator≠QPU; no consciousness/SI verified; L4=false' as const;

export const GITHUB_SOT_ISSUE = 170 as const;
export const GITHUB_EY_FOLLOWON_ISSUE = 173 as const;
export const GITHUB_SOT_LABEL = '62L-EX13' as const;
export const GITHUB_SOT_FAMILY = '62L-EX' as const;
export const GITHUB_SOT_TITLE =
  'EX13 — Quantum Pathway Plasticity + Hybrid Application Feedback Loop; L4=false' as const;

export const GITLAB_MIRROR_NOTE =
  'GitLab mirror: MCP may needsAuth / not resolved — no issue number invented.' as const;

export const NEXT_PHASE_TITLE = 'EX14 — Offline Quantum Research Pack' as const;

/** Application lifecycle states — never READY/RUNNING without evidence. */
export const APPLICATION_LIFECYCLE_STATES = [
  'STARTING',
  'ONLINE_READY',
  'OFFLINE_READY',
  'RUNNING_LOCAL',
  'RUNNING_HYBRID',
  'BACKGROUND',
  'SUSPENDED',
  'CLOSING',
  'CLOSED',
  'CRASHED',
  'RECOVERING',
  'RECONNECTING',
  'SYNC_PENDING',
  'DEGRADED',
  'BLOCKED',
  'STOPPING',
  'OFFLINE_STOPPED',
  'WAITING_DATA',
  'WAITING_PROVIDER',
] as const;

export type ApplicationLifecycleState = (typeof APPLICATION_LIFECYCLE_STATES)[number];

/** States that require concrete evidence before claim. */
export const EVIDENCE_GATED_STATES = [
  'ONLINE_READY',
  'OFFLINE_READY',
  'RUNNING_LOCAL',
  'RUNNING_HYBRID',
] as const;

export type EvidenceGatedState = (typeof EVIDENCE_GATED_STATES)[number];

/** Hybrid heartbeat grid targets. */
export const HEARTBEAT_TARGETS = [
  'APPLICATION',
  'HOME_BASE',
  'AGENT',
  'MODEL',
  'CPU',
  'GPU',
  'NPU',
  'SIMULATOR',
  'QPU_PROVIDER',
  'DATA_PIPE',
  'LOCAL_STORAGE',
  'CLOUD_CONNECTOR',
] as const;

export type HeartbeatTarget = (typeof HEARTBEAT_TARGETS)[number];

export type HeartbeatStatus =
  | 'FRESH'
  | 'STALE'
  | 'MISSING'
  | 'OFFLINE'
  | 'RUNNING_VERIFIED'
  | 'DEGRADED';

/** Neural plasticity pathway states (software, not biology). */
export const PATHWAY_PLASTICITY_STATES = [
  'NEW_PATH',
  'HYPOTHESIS',
  'MEASURED',
  'STRENGTHENING',
  'PREFERRED',
  'DEGRADING',
  'REGRESSED',
  'STALE',
  'RETEST_REQUIRED',
  'REJECTED',
  'REVOKED',
] as const;

export type PathwayPlasticityState = (typeof PATHWAY_PLASTICITY_STATES)[number];

/** Structured feedback sources — no hidden CoT. */
export const FEEDBACK_SOURCES = [
  'APPLICATION_LIFECYCLE',
  'USER_EXPLICIT',
  'UX_INTERACTION',
  'AGENT_HEARTBEAT',
  'ROUTE_OUTCOME',
  'DEVICE_TELEMETRY',
  'NETWORK_EVENT',
  'CRASH_RECOVERY',
  'SYNC_AUDIT',
  'GUARDIAN_DENY',
] as const;

export type FeedbackSource = (typeof FEEDBACK_SOURCES)[number];

export type FeedbackDisposition =
  | 'ACCEPTED_FOR_REVIEW'
  | 'ACCEPTED_EVIDENCE'
  | 'UX_EVIDENCE'
  | 'DENIED'
  | 'QUARANTINED'
  | 'REJECTED'
  | 'WAITING_DATA';

export type RecoveryVerdict =
  | 'RECOVERED'
  | 'PARTIAL_RECOVERY'
  | 'RESTART_REQUIRED'
  | 'BLOCKED';

export type SoftWireDisposition = 'PRESENT_UNVERIFIED' | 'WAITING_DATA';

export type SoftWirePresence = {
  present: boolean;
  pathChecked: string;
  note: string;
  verified: false;
  disposition: SoftWireDisposition;
};

export type ComputeDevice = 'CPU' | 'GPU' | 'NPU' | 'SIMULATOR' | 'QPU_PROVIDER' | 'UNKNOWN';

export type OpenProbeKey =
  | 'config'
  | 'storage'
  | 'identity'
  | 'tenant'
  | 'universe'
  | 'guardian'
  | 'runtime'
  | 'cpu'
  | 'gpu'
  | 'npu'
  | 'models'
  | 'knowledgePacks'
  | 'agentRegistry'
  | 'agentHeartbeat'
  | 'network'
  | 'checkpoints'
  | 'sync'
  | 'revocations';

export type OpenProbeResult = {
  key: OpenProbeKey;
  ok: boolean;
  evidenceId: string | null;
  note: string;
  requiredForOnline: boolean;
  requiredForOffline: boolean;
};

export type OpenApplicationEvidence = {
  probes: readonly OpenProbeResult[];
  networkAvailable: boolean;
  localCapable: boolean;
  nowIso: string;
};

export type LifecycleFailureEvidence = {
  failureId: string;
  priorState: ApplicationLifecycleState;
  incompleteShutdown: true;
  checkpointFlushed: boolean;
  evidenceFlushed: boolean;
  crashedAt: string;
  note: string;
};

export type CheckpointRecord = {
  checkpointId: string;
  tenantId: string;
  universeId: string;
  state: ApplicationLifecycleState;
  createdAt: string;
  integrityOk: boolean;
  revoked: boolean;
  evidenceIds: readonly string[];
};

export type ShutdownReceipt = {
  receiptId: string;
  fromState: ApplicationLifecycleState;
  toState: 'OFFLINE_STOPPED';
  checkpointId: string;
  evidenceFlushed: true;
  agentsContinueAfterTerminate: false;
  closedAt: string;
};

export type HeartbeatRecord = {
  target: HeartbeatTarget;
  lastBeatAt: string;
  ttlMs: number;
  status: HeartbeatStatus;
  evidenceId: string | null;
};

/** XivFeedbackEvent — structured, no hidden chain-of-thought. */
export type XivFeedbackEvent = {
  eventId: string;
  source: FeedbackSource;
  tenantId: string;
  universeId: string;
  observedAt: string;
  lifecycleState?: ApplicationLifecycleState;
  routeId?: string;
  requestedDevice?: ComputeDevice;
  actualDevice?: ComputeDevice;
  outcome: 'SUCCESS' | 'FAIL' | 'DEGRADED' | 'RECOVERED' | 'USER_POSITIVE' | 'USER_NEGATIVE' | 'NEUTRAL';
  evidenceIds: readonly string[];
  evidenceAccepted: boolean;
  evidenceRejected: boolean;
  evidenceRevoked: boolean;
  dataClass?: 'PUBLIC' | 'INTERNAL' | 'RESTRICTED' | 'QUARANTINE';
  mayAlterPermissions?: boolean;
  mayAlterGuardian?: boolean;
  mayAlterRls?: boolean;
  /** Explicit structured rationale only — never hidden CoT. */
  structuredRationale: string;
  hiddenChainOfThought: false;
};

export type PathwayUpdateResult = {
  allowed: boolean;
  pathwayId: string;
  priorState: PathwayPlasticityState;
  nextState: PathwayPlasticityState;
  weightDelta: number;
  preferred: boolean;
  meansAuthority: false;
  reason: string;
  actualDeviceEvidence: ComputeDevice | null;
};

export type InfrastructureMetaphor =
  | 'OIL'
  | 'BRIDGES'
  | 'HIGHWAYS'
  | 'WORMHOLES'
  | 'ROOTS'
  | 'BRANCHES'
  | 'BAMBOO'
  | 'ICEBERG'
  | 'BLACK_HOLE';

export type IcebergTier = 'HOT' | 'WARM' | 'COLD' | 'ARCHIVE';

export type InfraMetaphorRecord = {
  metaphor: InfrastructureMetaphor;
  softwareConcept: string;
  autoTrusted: false;
  icebergTier?: IcebergTier;
};

export type DataPipeStage =
  | 'INGEST'
  | 'VALIDATE'
  | 'NORMALIZE'
  | 'DEDUP'
  | 'CLASSIFY'
  | 'STORE'
  | 'ROUTE'
  | 'AUDIT';

export type DataPipeSourceClass =
  | 'LOCAL_FILE'
  | 'LOCAL_DB'
  | 'AUTHORIZED_API'
  | 'USER_UPLOAD'
  | 'AGENT_TELEMETRY'
  | 'LIFECYCLE_EVENT'
  | 'RESTRICTED'
  | 'QUARANTINE';

export type CloudCapacityTarget = {
  label: '6TB_GOOGLE_CLOUD';
  status: 'CAPACITY_TARGET_NOT_PROVISIONED';
  purchased: false;
  allocated: false;
  evidenceOfProvision: null;
};

export type PlatformMatrixClaim = {
  platform: 'DESKTOP_LINUX' | 'DESKTOP_MAC' | 'DESKTOP_WINDOWS' | 'ANDROID' | 'IOS';
  verifiedInThisEnv: boolean;
  disposition: 'DOCUMENTED' | 'WAITING_COMPATIBLE_ENV' | 'VERIFIED_LOCAL';
};

export type Ex13SoftWireSnapshot = {
  agentMesh: SoftWirePresence;
  hybridRouter: SoftWirePresence;
  evidenceLedger: SoftWirePresence;
  pathwayGraph: SoftWirePresence;
  pathwayWeight: SoftWirePresence;
  guardian: SoftWirePresence;
  ex1: SoftWirePresence;
  ex2: SoftWirePresence;
  ex3: SoftWirePresence;
  ex4: SoftWirePresence;
  ex5: SoftWirePresence;
  ex6: SoftWirePresence;
  ex7: SoftWirePresence;
  ex8: SoftWirePresence;
  ex9: SoftWirePresence;
  ex10: SoftWirePresence;
  ex11: SoftWirePresence;
  ex12: SoftWirePresence;
};

export const EX13_LOCKS = {
  L4_AUTONOMY_ENABLED: false as const,
  TIP_LAND: false as const,
  PRODUCTION_AUTHORIZATION: false as const,
  PRODUCTION_WRITE: false as const,
  MERGE_MAIN: false as const,
  FORCE_PUSH: false as const,
  MANAGE_PULL_REQUEST: false as const,
  BUY_CLOUD_STORAGE_AUTONOMOUSLY: false as const,
  PROVISION_6TB_WITHOUT_EVIDENCE: false as const,
  OFFENSIVE_CYBER: false as const,
  ILLICIT_DARK_WEB_INDEXING: false as const,
  FABRICATE_24_7_WITHOUT_RUNTIME: false as const,
  FABRICATE_SCALE: false as const,
  CLAIM_CONSCIOUSNESS_AS_VERIFIED: false as const,
  CLAIM_SUPERINTELLIGENCE_AS_VERIFIED: false as const,
  PREFERRED_EQ_AUTHORITY: false as const,
  HYPOTHESIS_EQ_VERIFIED: false as const,
  PRESENCE_EQ_VERIFIED: false as const,
  SECOND_AGENT_SYSTEM: false as const,
  WEAKEN_GUARDIAN_RLS: false as const,
  BROADEN_PERMISSIONS: false as const,
  CROSS_TENANT_FEEDBACK: false as const,
  CROSS_UNIVERSE_FEEDBACK: false as const,
  SYNC_BEFORE_VALIDATE: false as const,
  SILENT_PARTIAL_STARTUP: false as const,
  AGENTS_CONTINUE_AFTER_TERMINATE: false as const,
  STALE_HEARTBEAT_AS_RUNNING_VERIFIED: false as const,
  STRENGTHEN_REQUESTED_DEVICE_WHEN_ACTUAL_DIFFERS: false as const,
  REJECTED_EVIDENCE_STRENGTHENS: false as const,
  LIFECYCLE_ALTERS_PERMISSIONS: false as const,
  UNDER_21_COMMUNITY_DEFAULT: false as const,
} as const;

export type Ex13LockKey = keyof typeof EX13_LOCKS;

export function assertEx13LocksIntact(): boolean {
  return (
    EX13_LOCKS.L4_AUTONOMY_ENABLED === false &&
    EX13_LOCKS.TIP_LAND === false &&
    EX13_LOCKS.PRODUCTION_AUTHORIZATION === false &&
    EX13_LOCKS.PRODUCTION_WRITE === false &&
    EX13_LOCKS.MERGE_MAIN === false &&
    EX13_LOCKS.FORCE_PUSH === false &&
    EX13_LOCKS.MANAGE_PULL_REQUEST === false &&
    EX13_LOCKS.BUY_CLOUD_STORAGE_AUTONOMOUSLY === false &&
    EX13_LOCKS.PROVISION_6TB_WITHOUT_EVIDENCE === false &&
    EX13_LOCKS.OFFENSIVE_CYBER === false &&
    EX13_LOCKS.ILLICIT_DARK_WEB_INDEXING === false &&
    EX13_LOCKS.FABRICATE_24_7_WITHOUT_RUNTIME === false &&
    EX13_LOCKS.FABRICATE_SCALE === false &&
    EX13_LOCKS.CLAIM_CONSCIOUSNESS_AS_VERIFIED === false &&
    EX13_LOCKS.CLAIM_SUPERINTELLIGENCE_AS_VERIFIED === false &&
    EX13_LOCKS.PREFERRED_EQ_AUTHORITY === false &&
    EX13_LOCKS.HYPOTHESIS_EQ_VERIFIED === false &&
    EX13_LOCKS.PRESENCE_EQ_VERIFIED === false &&
    EX13_LOCKS.SECOND_AGENT_SYSTEM === false &&
    EX13_LOCKS.WEAKEN_GUARDIAN_RLS === false &&
    EX13_LOCKS.BROADEN_PERMISSIONS === false &&
    EX13_LOCKS.CROSS_TENANT_FEEDBACK === false &&
    EX13_LOCKS.CROSS_UNIVERSE_FEEDBACK === false &&
    EX13_LOCKS.SYNC_BEFORE_VALIDATE === false &&
    EX13_LOCKS.SILENT_PARTIAL_STARTUP === false &&
    EX13_LOCKS.AGENTS_CONTINUE_AFTER_TERMINATE === false &&
    EX13_LOCKS.STALE_HEARTBEAT_AS_RUNNING_VERIFIED === false &&
    EX13_LOCKS.STRENGTHEN_REQUESTED_DEVICE_WHEN_ACTUAL_DIFFERS === false &&
    EX13_LOCKS.REJECTED_EVIDENCE_STRENGTHENS === false &&
    EX13_LOCKS.LIFECYCLE_ALTERS_PERMISSIONS === false &&
    EX13_LOCKS.UNDER_21_COMMUNITY_DEFAULT === false
  );
}

export function ex13L4AutonomyEnabled(): false {
  return EX13_LOCKS.L4_AUTONOMY_ENABLED;
}

export function guardianRlsUnchangedByEx13(): true {
  return true;
}

export function consciousnessClaimedAsVerified(): false {
  return false;
}

export function superintelligenceClaimedAsVerified(): false {
  return false;
}

export function isSecondAgentSystem(): false {
  return false;
}

export function cloudSixTbTarget(): CloudCapacityTarget {
  return {
    label: '6TB_GOOGLE_CLOUD',
    status: 'CAPACITY_TARGET_NOT_PROVISIONED',
    purchased: false,
    allocated: false,
    evidenceOfProvision: null,
  };
}

export const INFRA_METAPHORS: readonly InfraMetaphorRecord[] = [
  { metaphor: 'OIL', softwareConcept: 'lubrication/health checks for runtime paths', autoTrusted: false },
  { metaphor: 'BRIDGES', softwareConcept: 'cross-plane connectors with identity gates', autoTrusted: false },
  { metaphor: 'HIGHWAYS', softwareConcept: 'high-throughput routing corridors', autoTrusted: false },
  { metaphor: 'WORMHOLES', softwareConcept: 'governed short-circuit routes (still identity-bound)', autoTrusted: false },
  { metaphor: 'ROOTS', softwareConcept: 'foundational local knowledge roots', autoTrusted: false },
  { metaphor: 'BRANCHES', softwareConcept: 'feature/pathway branches', autoTrusted: false },
  { metaphor: 'BAMBOO', softwareConcept: 'fast local growth of candidate pathways', autoTrusted: false },
  { metaphor: 'ICEBERG', softwareConcept: 'HOT/WARM/COLD/ARCHIVE storage tiers', autoTrusted: false, icebergTier: 'HOT' },
  { metaphor: 'BLACK_HOLE', softwareConcept: 'quarantine / dead-letter — never auto-trusted', autoTrusted: false },
] as const;

export const DATA_PIPE_STAGES: readonly DataPipeStage[] = [
  'INGEST',
  'VALIDATE',
  'NORMALIZE',
  'DEDUP',
  'CLASSIFY',
  'STORE',
  'ROUTE',
  'AUDIT',
] as const;

export const MATURE_COMMUNITY_POLICY = {
  minimumAge: 18 as const,
  under21DefaultAllowed: false as const,
  hooksPreparedOnly: true as const,
  productionAuthorized: false as const,
} as const;

export const DEFENSIVE_CYBER_POLICY = {
  defensiveOnly: true as const,
  offensiveAllowed: false as const,
  darkWebIllicitIndexingAllowed: false as const,
} as const;
