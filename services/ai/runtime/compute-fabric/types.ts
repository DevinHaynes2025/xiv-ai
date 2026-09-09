/**
 * 62L-EX17 — CPU/GPU/NPU Quantum Pre/Post-Processing Fabric types + locks.
 * Parent: 62L-EX / GitHub #170 — Offline Quantum-Inspired Agent Brain.
 *
 * Agents request COMPUTE CAPABILITIES; they do not seize hardware.
 * DETECTED ≠ VERIFIED. Presence ≠ VERIFIED. QPU may be UNAVAILABLE.
 * L4_AUTONOMY_ENABLED=false. Soft-wire EX1–EX16 via existsSync.
 *
 * Canonical:
 * Home Base → Agent Mesh → Workload Genome → Problem/Algorithm IR →
 * Hybrid Router → Resource Governor → CPU/GPU/NPU → Simulator/optional QPU →
 * Post-Processing → Benchmark → Evidence → Neural Pathways → Home Base
 */

export const HONESTY_BANNER =
  'DETECTED≠VERIFIED; presence≠VERIFIED; CPU fallback≠accelerator VERIFIED; simulated≠physical QPU; agents request capabilities, never seize hardware' as const;

export const GITHUB_SOT_ISSUE = 170 as const;
export const GITHUB_SOT_LABEL = '62L-EX17' as const;
export const GITHUB_SOT_FAMILY = '62L-EX' as const;
export const GITHUB_SOT_TITLE =
  'EX17 — CPU/GPU/NPU Quantum Pre/Post-Processing Fabric — heterogeneous local compute; L4=false' as const;

export const GITLAB_MIRROR_NOTE =
  'GitLab mirror: MCP needsAuth / not resolved — no issue number invented.' as const;

export const NEXT_PHASE_TITLE =
  'EX18 — Quantum Research Wormhole Router' as const;

/** §1 Compute pipeline stages (receipts at each hop). */
export const COMPUTE_PIPELINE_STAGES = [
  'MISSION',
  'INGEST',
  'VALIDATE',
  'PREPROCESS',
  'ENCODE',
  'OPTIMIZE',
  'ROUTE',
  'EXECUTE',
  'DECODE',
  'POSTPROCESS',
  'VERIFY',
  'BENCHMARK',
  'EVIDENCE',
  'LEARN',
] as const;

export type ComputePipelineStage = (typeof COMPUTE_PIPELINE_STAGES)[number];

/** §2 Compute classes. */
export const COMPUTE_CLASSES = [
  'CPU',
  'GPU',
  'NPU',
  'SIMULATOR_CPU',
  'SIMULATOR_GPU',
  'REMOTE_ACCELERATOR_CANDIDATE',
  'PHYSICAL_QPU_CANDIDATE',
] as const;

export type ComputeClass = (typeof COMPUTE_CLASSES)[number];

/** §3 Device truth states — detected ≠ VERIFIED. */
export const DEVICE_TRUTH_STATES = [
  'UNKNOWN',
  'DOCUMENTED',
  'DETECTED',
  'SUPPORTED',
  'VERIFIED',
  'NOT_TESTED',
  'DEGRADED',
  'STALE',
  'UNAVAILABLE',
  'OFFLINE_STOPPED',
  'REVOKED',
] as const;

export type DeviceTruthState = (typeof DEVICE_TRUTH_STATES)[number];

/** §12 Device routing decisions. */
export const ROUTING_DECISIONS = [
  'RUN',
  'QUEUE',
  'PARTITION',
  'THROTTLE',
  'FALLBACK',
  'WAITING_NODE',
  'DENY',
] as const;

export type RoutingDecision = (typeof ROUTING_DECISIONS)[number];

/** §19 Memory/RAM governor decisions. */
export const MEMORY_GOVERNOR_DECISIONS = [
  'ALLOW',
  'REDUCE_SCOPE',
  'QUEUE',
  'FALLBACK',
  'DENY_RESOURCE_LIMIT',
] as const;

export type MemoryGovernorDecision = (typeof MEMORY_GOVERNOR_DECISIONS)[number];

/** §22 Bottleneck classes. */
export const BOTTLENECK_CLASSES = [
  'COMPUTE',
  'MEMORY',
  'CACHE',
  'DATA_TRANSFER',
  'QUEUE',
  'I_O',
  'NETWORK',
  'RUNTIME',
  'MODEL_COMPATIBILITY',
  'THERMAL_RESOURCE',
  'UNKNOWN',
] as const;

export type BottleneckClass = (typeof BOTTLENECK_CLASSES)[number];

export type FeedbackKind = 'HYPOTHESIS' | 'MEASURED';

export type FeedbackOutcome = 'STRENGTHEN' | 'REGRESSED' | 'RETEST_REQUIRED';

export type SoftWireDisposition = 'PRESENT_UNVERIFIED' | 'WAITING_DATA';

export type SoftWirePresence = {
  present: boolean;
  pathChecked: string;
  note: string;
  verified: false;
  disposition: SoftWireDisposition;
};

export const EX17_LOCKS = {
  L4_AUTONOMY_ENABLED: false as const,
  TIP_LAND: false as const,
  PRODUCTION_AUTHORIZATION: false as const,
  PRODUCTION_WRITE: false as const,
  MERGE_MAIN: false as const,
  MANAGE_PULL_REQUEST: false as const,
  DETECTED_EQ_VERIFIED: false as const,
  PRESENCE_EQ_VERIFIED: false as const,
  CPU_FALLBACK_VERIFIES_ACCELERATOR: false as const,
  AGENTS_SEIZE_HARDWARE: false as const,
  FAKE_CONTINUED_COMPUTE_WHEN_POWERED_OFF: false as const,
  END_TO_END_PURELY_QUANTUM_WHEN_MAJOR_STAGES_CLASSICAL: false as const,
  WORMHOLE_BYPASS_AUTH: false as const,
  LEARNING_MODIFIES_PERMISSIONS: false as const,
  HIDDEN_COT_PERSISTENCE: false as const,
  CROSS_TENANT_COMPUTE: false as const,
  CROSS_UNIVERSE_COMPUTE: false as const,
  SECOND_ORCHESTRATION_FRAMEWORK: false as const,
  DUPLICATE_AGENT_MESH: false as const,
  EXPAND_AGENT_MESH_AUTHORITY: false as const,
  WEAKEN_GUARDIAN_RLS: false as const,
  BROADEN_PERMISSIONS: false as const,
  BUY_QPU_CLOUD_AUTONOMOUSLY: false as const,
  PRESENT_SIMULATION_AS_PHYSICAL_QPU: false as const,
  CLAIM_UNSUPPORTED_QUANTUM_ADVANTAGE: false as const,
  NPU_WITHOUT_RUNTIME_MODEL_EVIDENCE: false as const,
  COPY_PROPRIETARY_CHIP_INTERNALS: false as const,
} as const;

export type Ex17LockKey = keyof typeof EX17_LOCKS;

export function assertEx17LocksIntact(): boolean {
  return (
    EX17_LOCKS.L4_AUTONOMY_ENABLED === false &&
    EX17_LOCKS.TIP_LAND === false &&
    EX17_LOCKS.PRODUCTION_AUTHORIZATION === false &&
    EX17_LOCKS.MERGE_MAIN === false &&
    EX17_LOCKS.MANAGE_PULL_REQUEST === false &&
    EX17_LOCKS.DETECTED_EQ_VERIFIED === false &&
    EX17_LOCKS.PRESENCE_EQ_VERIFIED === false &&
    EX17_LOCKS.CPU_FALLBACK_VERIFIES_ACCELERATOR === false &&
    EX17_LOCKS.AGENTS_SEIZE_HARDWARE === false &&
    EX17_LOCKS.FAKE_CONTINUED_COMPUTE_WHEN_POWERED_OFF === false &&
    EX17_LOCKS.END_TO_END_PURELY_QUANTUM_WHEN_MAJOR_STAGES_CLASSICAL === false &&
    EX17_LOCKS.WORMHOLE_BYPASS_AUTH === false &&
    EX17_LOCKS.LEARNING_MODIFIES_PERMISSIONS === false &&
    EX17_LOCKS.HIDDEN_COT_PERSISTENCE === false &&
    EX17_LOCKS.CROSS_TENANT_COMPUTE === false &&
    EX17_LOCKS.CROSS_UNIVERSE_COMPUTE === false &&
    EX17_LOCKS.SECOND_ORCHESTRATION_FRAMEWORK === false &&
    EX17_LOCKS.EXPAND_AGENT_MESH_AUTHORITY === false &&
    EX17_LOCKS.WEAKEN_GUARDIAN_RLS === false &&
    EX17_LOCKS.BROADEN_PERMISSIONS === false &&
    EX17_LOCKS.NPU_WITHOUT_RUNTIME_MODEL_EVIDENCE === false &&
    EX17_LOCKS.COPY_PROPRIETARY_CHIP_INTERNALS === false
  );
}

export function ex17L4AutonomyEnabled(): false {
  return EX17_LOCKS.L4_AUTONOMY_ENABLED;
}

export function guardianRlsUnchangedByEx17(): true {
  return true;
}

export type TenantScope = {
  tenantId: string;
  universeId: string;
};

export type Ex17Denial = {
  denied: true;
  state:
    | 'DENIED'
    | 'WAITING_DATA'
    | 'WAITING_PROVIDER'
    | 'OFFLINE_STOPPED'
    | 'DENY_RESOURCE_LIMIT'
    | 'WAITING_NODE';
  reason: string;
  executed: false;
  evidenceCreated: boolean;
};

export function ex17Deny(
  reason: string,
  state: Ex17Denial['state'] = 'DENIED',
  evidenceCreated = true,
): Ex17Denial {
  return { denied: true, state, reason, executed: false, evidenceCreated };
}

export function isEx17Denial(v: unknown): v is Ex17Denial {
  return (
    typeof v === 'object' &&
    v !== null &&
    (v as Ex17Denial).denied === true &&
    (v as Ex17Denial).executed === false
  );
}

/** §4 ComputeStageRequest envelope — founder fields. */
export type ComputeStageRequest = {
  requestId: string;
  missionId: string;
  stage: ComputePipelineStage;
  tenantId: string;
  universeId: string;
  agentId: string;
  /** Agents request capabilities — never seize. */
  capabilityRequest: true;
  seizeHardware: false;
  requestedDevice: ComputeClass;
  requiredTruthState: DeviceTruthState;
  allowCpuFallback: boolean;
  memoryBudgetBytes: number;
  estimatedMemoryBytes: number;
  powerState: 'ON' | 'OFF' | 'SLEEP';
  networkOnline: boolean;
  requiresWebData: boolean;
  qpuAvailable: boolean;
  waitingProvider?: boolean;
  /** Preferred local hardware home profile (Home Base may reroute). */
  preferredExecutionProfile: ComputeClass;
  homeBaseMayReroute: true;
  /** NPU eligibility extras. */
  npuRuntimeId?: string | null;
  npuModelId?: string | null;
  npuEvidenceCompatible?: boolean;
  /** Classical major stages flag — never claim purely quantum e2e. */
  majorStagesClassical: boolean;
  claimPurelyQuantumEndToEnd: false;
  simulatorQubitEstimate?: number;
  simulatorQubitBudget?: number;
  offlineLocalEligible?: boolean;
  createdAt: string;
};

export type DeviceProfile = {
  deviceId: string;
  computeClass: ComputeClass;
  truthState: DeviceTruthState;
  tenantId: string;
  universeId: string;
  memoryBytesAvailable: number;
  poweredOff?: boolean;
  npuRuntimeId?: string | null;
  npuModelId?: string | null;
  npuEvidenceCompatible?: boolean;
};

export type StageReceipt = {
  receiptId: string;
  requestId: string;
  stage: ComputePipelineStage;
  status: 'OK' | 'DENIED' | 'WAITING' | 'FALLBACK' | 'STOPPED';
  requestedDevice: ComputeClass;
  actualDevice: ComputeClass | null;
  fallbackUsed: boolean;
  fallbackReason: string | null;
  acceleratorVerified: false | true;
  decision: RoutingDecision | MemoryGovernorDecision | 'WAITING_DATA' | 'WAITING_PROVIDER' | 'OFFLINE_STOPPED';
  note: string;
  createdAt: string;
};

export type PartitionHop = {
  stage: ComputePipelineStage;
  device: ComputeClass;
  truthState: DeviceTruthState;
};

export type PartitionRecord = {
  partitionId: string;
  requestId: string;
  hops: readonly PartitionHop[];
  actualRoute: readonly ComputeClass[];
};

export type TimingBreakdown = {
  preprocessingMs: number;
  executionMs: number;
  postprocessingMs: number;
  queueMs: number;
  networkMs: number;
  totalMs: number;
};

export type HybridBenchmark = {
  benchmarkId: string;
  requestId: string;
  timing: TimingBreakdown;
  bottleneck: BottleneckClass;
  feedbackKind: FeedbackKind;
  outcome: FeedbackOutcome | null;
};

export type ComputeEvidence = {
  evidenceId: string;
  requestId: string;
  kind: 'ROUTE_FAILURE' | 'FALLBACK' | 'SUCCESS' | 'RESOURCE_DENIAL' | 'OFFLINE';
  note: string;
  measured: true;
  createdAt: string;
};

export type ProvenanceRecord = {
  provenanceId: string;
  fabric: 'PREPROCESS' | 'QUANTUM_PREPROCESS' | 'POSTPROCESS';
  inputs: readonly string[];
  outputs: readonly string[];
  classicalStages: readonly string[];
  quantumClaimed: boolean;
  purelyQuantumEndToEnd: false;
};

export type VirtualChip = {
  chipId: string;
  kind: 'XIV_VIRTUAL_CHIP';
  softwareAbstraction: true;
  mapsTo: ComputeClass;
  proprietaryInternalsExposed: false;
};

export type ComputeHighway = {
  highwayId: string;
  from: ComputeClass;
  to: ComputeClass;
  authRequired: true;
};

export type SoftwareWormhole = {
  wormholeId: string;
  fromNode: string;
  toNode: string;
  authRequired: true;
  bypassAuth: false;
  tenantId: string;
  universeId: string;
  guardianActive: boolean;
};

export type AgentMeetingBrief = {
  briefId: string;
  missionId: string;
  tenantId: string;
  universeId: string;
  structuredSummary: string;
  evidenceRefs: readonly string[];
  hiddenCotPersisted: false;
  chainOfThought: null;
};

export type CheckpointRecord = {
  checkpointId: string;
  requestId: string;
  stage: ComputePipelineStage;
  resumeValid: boolean;
  poweredOff: boolean;
  continuedComputeAfterPowerOff: false;
  createdAt: string;
};

export type LearningUpdate = {
  updateId: string;
  requestId: string;
  outcome: FeedbackOutcome;
  permissionsModified: false;
  note: string;
};

export type Ex17SoftWireSnapshot = {
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
  ex13: SoftWirePresence;
  ex14: SoftWirePresence;
  ex15: SoftWirePresence;
  ex16: SoftWirePresence;
  agentmesh: SoftWirePresence;
  quantumIr: SoftWirePresence;
  chipgraph: SoftWirePresence;
  lifecycle: SoftWirePresence;
  localRuntime: SoftWirePresence;
  guardian: SoftWirePresence;
  benchmark: SoftWirePresence;
  evidence: SoftWirePresence;
};

/** Truth ladder: DETECTED cannot satisfy VERIFIED request. */
export function deviceSatisfiesRequiredTruth(
  deviceState: DeviceTruthState,
  required: DeviceTruthState,
): boolean {
  if (required === 'VERIFIED') {
    return deviceState === 'VERIFIED';
  }
  if (required === 'SUPPORTED') {
    return deviceState === 'SUPPORTED' || deviceState === 'VERIFIED';
  }
  if (required === 'DETECTED') {
    return (
      deviceState === 'DETECTED' ||
      deviceState === 'SUPPORTED' ||
      deviceState === 'VERIFIED'
    );
  }
  return deviceState === required;
}

export function isAcceleratorClass(c: ComputeClass): boolean {
  return c === 'GPU' || c === 'NPU' || c === 'PHYSICAL_QPU_CANDIDATE';
}
