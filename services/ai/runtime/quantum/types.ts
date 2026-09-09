/**
 * 62L-EX1 — Offline Quantum Mission Contract types.
 * Shared contract for classical, quantum-inspired, simulator, and future authorized QPU agents.
 * Extends Agent Mesh + Home Base — not a second orchestration framework.
 * Honesty: DOCUMENTED ≠ IMPLEMENTED ≠ VERIFIED ≠ PRODUCTION AUTHORIZED.
 * L4_AUTONOMY_ENABLED=false. No silent reclassification. No fabricated QPU/cloud execution.
 */

/** Canonical execution classes — default CLASSICAL; cannot silently change. */
export const EXECUTION_CLASSES = [
  'CLASSICAL',
  'QUANTUM_INSPIRED',
  'SIMULATED_QUANTUM',
  'PHYSICAL_QPU_VERIFIED',
] as const;

export type ExecutionClass = (typeof EXECUTION_CLASSES)[number];

/** Offline-allowed execution targets while disconnected. */
export const OFFLINE_ALLOWED_DEVICES = [
  'LOCAL_CPU',
  'VERIFIED_LOCAL_GPU',
  'VERIFIED_LOCAL_NPU',
  'LOCAL_QUANTUM_SIMULATOR',
  'QUANTUM_INSPIRED_CLASSICAL_RUNTIME',
] as const;

export type OfflineAllowedDevice = (typeof OFFLINE_ALLOWED_DEVICES)[number];

/** Devices that require a verified provider / physical QPU link. */
export const PROVIDER_REQUIRED_DEVICES = [
  'PHYSICAL_QPU',
  'CLOUD_QPU',
  'REMOTE_QUANTUM_PROVIDER',
] as const;

export type ProviderRequiredDevice = (typeof PROVIDER_REQUIRED_DEVICES)[number];

export type RequestedDevice = OfflineAllowedDevice | ProviderRequiredDevice | string;

/** Mission / task work states. */
export const QUANTUM_WORK_STATES = [
  'QUEUED',
  'LOCAL_READY',
  'RUNNING_CLASSICAL',
  'RUNNING_QUANTUM_INSPIRED',
  'RUNNING_SIMULATOR',
  'WAITING_PROVIDER',
  'WAITING_NODE',
  'WAITING_DATA',
  'REVIEW_REQUIRED',
  'COMPLETED',
  'FAILED',
  'EXPIRED',
  'REVOKED',
  'OFFLINE_STOPPED',
] as const;

export type QuantumWorkState = (typeof QUANTUM_WORK_STATES)[number];

/**
 * Quantum agent roles — mesh roles only.
 * No separate uncontrolled memory/authority outside Agent Mesh + Home Base.
 */
export const QUANTUM_MESH_ROLES = [
  'QuantumResearchAgent',
  'ClassicalBaselineAgent',
  'QuantumInspiredAgent',
  'SimulationAgent',
  'HardwareEvidenceAgent',
  'BenchmarkAgent',
  'ReviewerAgent',
] as const;

export type QuantumMeshRole = (typeof QUANTUM_MESH_ROLES)[number];

export const PROBLEM_CLASSES = [
  'OPTIMIZATION',
  'GRAPH_SEARCH',
  'SAMPLING',
  'LINEAR_ALGEBRA',
  'TENSOR',
  'ANNEALING_INSPIRED',
  'PROBABILISTIC',
  'SCHEDULING',
  'ROUTING',
  'PORTFOLIO',
  'SUPPLY_CHAIN',
  'RESOURCE_ALLOCATION',
  'SIMULATION',
  'BENCHMARK',
  'OTHER',
] as const;

export type ProblemClass = (typeof PROBLEM_CLASSES)[number];

export const PRIVACY_CLASSES = [
  'PUBLIC',
  'TENANT_PRIVATE',
  'UNIVERSE_SCOPED',
  'FOUNDER_SEALED',
  'RESTRICTED',
] as const;

export type PrivacyClass = (typeof PRIVACY_CLASSES)[number];

export const INPUT_DATA_CLASSES = [
  'SYNTHETIC',
  'PUBLIC_REFERENCE',
  'TENANT_AUTHORIZED',
  'XIV_OWNED',
  'BENCHMARK_FIXTURE',
  'RESTRICTED',
] as const;

export type InputDataClass = (typeof INPUT_DATA_CLASSES)[number];

export const EVIDENCE_STATES = [
  'NONE',
  'DOCUMENTED',
  'IMPLEMENTED',
  'TESTED',
  'REVIEWED',
  'VERIFIED',
  'PRODUCTION_AUTHORIZED',
] as const;

export type EvidenceState = (typeof EVIDENCE_STATES)[number];

/** Advantage claims that require classical baseline + gates. */
export const ADVANTAGE_CLAIM_KINDS = [
  'FASTER',
  'BETTER',
  'LOWER_COST',
  'MORE_ACCURATE',
  'MORE_EFFICIENT',
] as const;

export type AdvantageClaimKind = (typeof ADVANTAGE_CLAIM_KINDS)[number];

/** Neural pathway stages (routing / research priority only — not authority). */
export const NEURAL_PATHWAY_STAGES = [
  'PROBLEM',
  'REPRESENTATION',
  'CLASSICAL_ALGORITHM',
  'QUANTUM_INSPIRED',
  'QUANTUM_CANDIDATE',
  'RUNTIME',
  'CPU_GPU_NPU_QPU',
  'BENCHMARK',
  'RESULT',
  'EVIDENCE',
  'LESSON',
] as const;

export type NeuralPathwayStage = (typeof NEURAL_PATHWAY_STAGES)[number];

export const MISSION_STATUS_VALUES = [
  'DRAFT',
  'ACTIVE',
  'PAUSED',
  'COMPLETED',
  'EXPIRED',
  'REVOKED',
  'FAILED',
] as const;

export type MissionStatus = (typeof MISSION_STATUS_VALUES)[number];

export type ComputeBudget = {
  maxCpuMs: number;
  maxGpuMs: number;
  maxNpuMs: number;
  maxQpuShots: number;
};

export type MemoryBudget = {
  maxMb: number;
};

export type TimeBudget = {
  maxWallClockMs: number;
};

export type ExternalCostBudget = {
  maxUsd: number;
  cloudPurchaseAllowed: false;
  qpuPurchaseAllowed: false;
};

/** Classical baseline equivalence requirements before advantage claims. */
export type ClassicalBaselineEquivalence = {
  algorithm: string;
  input: string;
  problemSize: string | number;
  seedOrConfig: string;
  precisionOrTolerance: string;
  hardware: string;
  runtimeMs: number | null;
  latencyMs: number | null;
  memoryMb: number | null;
  outputQuality: string;
  successCriteria: string;
  recorded: boolean;
};

export type QuantumMissionContract = {
  missionId: string;
  taskId: string;
  parentTaskId: string | null;
  agentId: string;
  tenantId: string;
  universeId: string;
  problemClass: ProblemClass;
  objective: string;
  inputDataClass: InputDataClass;
  privacyClass: PrivacyClass;
  allowedExecutionClasses: readonly ExecutionClass[];
  preferredExecutionClass: ExecutionClass;
  classicalBaselineRequired: boolean;
  minimumEvidenceState: EvidenceState;
  computeBudget: ComputeBudget;
  memoryBudget: MemoryBudget;
  timeBudget: TimeBudget;
  externalCostBudget: ExternalCostBudget;
  allowedProviders: readonly string[];
  allowedDevices: readonly RequestedDevice[];
  evidenceRequirements: readonly string[];
  benchmarkRequirements: readonly string[];
  stopConditions: readonly string[];
  returnPath: string;
  createdAt: string;
  expiresAt: string;
  status: MissionStatus;
  /** Current work state machine hop. */
  workState: QuantumWorkState;
  /** Locked classification — silent mutation forbidden. */
  classification: ExecutionClass;
  agentRole: QuantumMeshRole;
  poweredOff: boolean;
  offlineDisconnected: boolean;
  physicalQpuAvailable: boolean;
  classicalBaselineId: string | null;
  classicalBaseline: ClassicalBaselineEquivalence | null;
  quantumAdvantageVerified: false | true;
  l4Enabled: false;
  hiddenCotPersistence: false;
  guardianRlsUnchanged: true;
};

export type QuantumChildTaskSpec = {
  parentTaskId: string;
  purpose: string;
  allowedTools: readonly string[];
  allowedData: readonly InputDataClass[];
  executionClasses: readonly ExecutionClass[];
  computeBudget: ComputeBudget;
  memoryBudget?: MemoryBudget;
  timeBudget?: TimeBudget;
  expiry: string;
  expectedOutput: string;
  evidenceRequirements: readonly string[];
  returnPath: string;
  childTaskId: string;
  childAgentId: string;
  tenantId: string;
  universeId: string;
  agentRole: QuantumMeshRole;
};

export const EX1_LOCKS = {
  L4_AUTONOMY_ENABLED: false,
  TIP_LAND: false,
  PRODUCTION_AUTHORIZATION: false,
  PRODUCTION_WRITE: false,
  MERGE_MAIN: false,
  MANAGE_PULL_REQUEST: false,
  FABRICATE_CLOUD_QPU_EXECUTION: false,
  HIDDEN_COT_PERSISTENCE: false,
  CHILD_PERMISSION_EXPANSION: false,
  CROSS_TENANT_HANDOFF: false,
  CROSS_UNIVERSE_HANDOFF: false,
  BYPASS_GUARDIAN_RLS: false,
  SILENT_RECLASSIFICATION: false,
  AUTO_QUANTUM_ADVANTAGE_CLAIM: false,
  PRESENCE_EQ_VERIFIED: false,
  CLAIM_CONSCIOUSNESS_VERIFIED: false,
  CLAIM_SUPERINTELLIGENCE_VERIFIED: false,
} as const;

export type Ex1LockKey = keyof typeof EX1_LOCKS;

/** Soft-wire probe result — presence ≠ VERIFIED. */
export type SoftWirePresence = {
  present: boolean;
  pathChecked: string;
  note: string;
  verified: false;
  disposition: 'PRESENT_UNVERIFIED' | 'WAITING_DATA';
};
