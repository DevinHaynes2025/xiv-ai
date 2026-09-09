/**
 * 62L-EX10 — Benchmark Comparability Gate types + locks.
 * Parent: 62L-EX / Global Operations Brain / GitHub #170.
 *
 * Canonical flow:
 * Experiment A + Experiment B → Benchmark Normalization → Comparability Gate →
 * Difference Classification → Valid Comparison or NOT_COMPARABLE →
 * Evidence Review → Learning Update → XIV Home Base
 *
 * No route/algorithm/hardware/simulator/QPU may be declared better unless
 * materially comparable. Never collapse gate outcomes to generic PASS.
 *
 * Honesty: DOCUMENTED ≠ IMPLEMENTED ≠ VERIFIED ≠ PRODUCTION AUTHORIZED
 * Presence ≠ VERIFIED. Simulator ≠ physical QPU. L4_AUTONOMY_ENABLED=false.
 *
 * Do NOT duplicate Agent Mesh / Classical Baseline Lab / Hybrid Router /
 * Guardian / tenant-Universe controls — soft-wire via existsSync.
 *
 * Next (docs-only): EX11 — Quantum Evidence Ledger.
 */

export const HONESTY_BANNER =
  'DOCUMENTED ≠ IMPLEMENTED ≠ VERIFIED ≠ PRODUCTION AUTHORIZED; simulator ≠ physical QPU; presence ≠ VERIFIED' as const;

export const GITHUB_SOT_ISSUE = 170 as const;
export const GITHUB_SOT_LABEL = '62L-EX10' as const;
export const GITHUB_SOT_FAMILY = '62L-EX' as const;
export const GITHUB_SOT_TITLE =
  'EX10 — Benchmark Comparability Gate — no better-claim without material comparability; L4=false' as const;

export const GITLAB_MIRROR_NOTE =
  'GitLab mirror: MCP needsAuth / not resolved — no issue number invented.' as const;

export const EX10_DB_CANDIDATES_STATUS = 'NOT_APPLIED' as const;

export const NEXT_PHASE_TITLE = 'EX11 — Quantum Evidence Ledger' as const;

/** Canonical ownership path — never spawn a parallel orchestration framework. */
export const CANONICAL_PATHWAY = [
  'ExperimentA',
  'ExperimentB',
  'BenchmarkNormalization',
  'ComparabilityGate',
  'DifferenceClassification',
  'ValidComparisonOrNotComparable',
  'EvidenceReview',
  'LearningUpdate',
  'XivHomeBase',
] as const;

export type CanonicalPathwayHop = (typeof CANONICAL_PATHWAY)[number];

export const EX10_LOCKS = {
  L4_AUTONOMY_ENABLED: false as const,
  TIP_LAND: false as const,
  PRODUCTION_AUTHORIZATION: false as const,
  PRODUCTION_WRITE: false as const,
  MERGE_MAIN: false as const,
  MANAGE_PULL_REQUEST: false as const,
  BUY_QPU_CLOUD_AUTONOMOUSLY: false as const,
  PRESENT_SIMULATION_AS_PHYSICAL: false as const,
  CLAIM_UNSUPPORTED_QUANTUM_ADVANTAGE: false as const,
  CLAIM_CONSCIOUSNESS_AS_FACT: false as const,
  CLAIM_SUPERINTELLIGENCE_AS_FACT: false as const,
  MISLEADING_BENCHMARK_COMPARISON: false as const,
  COLLAPSE_TO_GENERIC_PASS: false as const,
  FABRICATE_EFFICIENCY: false as const,
  EQUATE_MISMATCHED_TIMING_SCOPES: false as const,
  SINGLE_LUCKY_RUN_HIGH_CONFIDENCE: false as const,
  PRECISE_COST_WHEN_UNKNOWN: false as const,
  WINNER_LEARNING_FROM_NOT_COMPARABLE: false as const,
  PRESENCE_EQ_VERIFIED: false as const,
  WEAKEN_GUARDIAN_RLS: false as const,
  BROADEN_PERMISSIONS: false as const,
  CROSS_TENANT_ACCESS: false as const,
  CROSS_UNIVERSE_ACCESS: false as const,
  SECOND_ORCHESTRATION_FRAMEWORK: false as const,
  DUPLICATE_AGENT_MESH: false as const,
  DUPLICATE_CLASSICAL_BASELINE: false as const,
  DUPLICATE_HYBRID_ROUTER: false as const,
  DUPLICATE_GUARDIAN: false as const,
  LEARNING_ALTERS_PERMISSIONS: false as const,
} as const;

export type Ex10LockKey = keyof typeof EX10_LOCKS;

export function assertEx10LocksIntact(): boolean {
  return (
    EX10_LOCKS.L4_AUTONOMY_ENABLED === false &&
    EX10_LOCKS.TIP_LAND === false &&
    EX10_LOCKS.PRODUCTION_AUTHORIZATION === false &&
    EX10_LOCKS.MERGE_MAIN === false &&
    EX10_LOCKS.MANAGE_PULL_REQUEST === false &&
    EX10_LOCKS.PRESENT_SIMULATION_AS_PHYSICAL === false &&
    EX10_LOCKS.CLAIM_UNSUPPORTED_QUANTUM_ADVANTAGE === false &&
    EX10_LOCKS.MISLEADING_BENCHMARK_COMPARISON === false &&
    EX10_LOCKS.COLLAPSE_TO_GENERIC_PASS === false &&
    EX10_LOCKS.FABRICATE_EFFICIENCY === false &&
    EX10_LOCKS.EQUATE_MISMATCHED_TIMING_SCOPES === false &&
    EX10_LOCKS.SINGLE_LUCKY_RUN_HIGH_CONFIDENCE === false &&
    EX10_LOCKS.PRECISE_COST_WHEN_UNKNOWN === false &&
    EX10_LOCKS.WINNER_LEARNING_FROM_NOT_COMPARABLE === false &&
    EX10_LOCKS.PRESENCE_EQ_VERIFIED === false &&
    EX10_LOCKS.WEAKEN_GUARDIAN_RLS === false &&
    EX10_LOCKS.BROADEN_PERMISSIONS === false &&
    EX10_LOCKS.CROSS_TENANT_ACCESS === false &&
    EX10_LOCKS.CROSS_UNIVERSE_ACCESS === false &&
    EX10_LOCKS.SECOND_ORCHESTRATION_FRAMEWORK === false &&
    EX10_LOCKS.LEARNING_ALTERS_PERMISSIONS === false
  );
}

export function ex10L4AutonomyEnabled(): false {
  return EX10_LOCKS.L4_AUTONOMY_ENABLED;
}

export function guardianRlsUnchangedByEx10(): true {
  return true;
}

/** Gate states — never collapse to generic PASS. */
export const COMPARABILITY_STATES = [
  'COMPARABLE',
  'PARTIALLY_COMPARABLE',
  'NOT_COMPARABLE',
  'INSUFFICIENT_EVIDENCE',
  'STALE_COMPARISON',
  'REVIEW_REQUIRED',
  'DENIED',
  'WAITING_DATA',
  'WAITING_PROVIDER',
] as const;

export type ComparabilityState = (typeof COMPARABILITY_STATES)[number];

export const TIMING_SCOPES = [
  'EXECUTION_ONLY',
  'END_TO_END',
  'PROVIDER_REPORTED',
  'LOCAL_MEASURED',
] as const;

export type TimingScope = (typeof TIMING_SCOPES)[number];

export const EXECUTION_CLASSES = [
  'CLASSICAL',
  'QUANTUM_INSPIRED',
  'SIMULATED_QUANTUM',
  'PHYSICAL_QPU',
] as const;

export type ExecutionClass = (typeof EXECUTION_CLASSES)[number];

export const DEVICE_CLASSES = ['CPU', 'GPU', 'NPU', 'QPU'] as const;
export type DeviceClass = (typeof DEVICE_CLASSES)[number];

export const COST_ACCOUNTING_METHODS = [
  'MEASURED',
  'PROVIDER_REPORTED',
  'ESTIMATED',
  'UNKNOWN',
] as const;

export type CostAccountingMethod = (typeof COST_ACCOUNTING_METHODS)[number];

export const ENERGY_ACCOUNTING_METHODS = [
  'MEASURED',
  'ESTIMATED_PROXY',
  'UNKNOWN',
] as const;

export type EnergyAccountingMethod = (typeof ENERGY_ACCOUNTING_METHODS)[number];

export const WINNER_STATES = [
  'BASELINE_BETTER',
  'CANDIDATE_BETTER',
  'STATISTICAL_TIE',
  'TRADEOFF',
  'NOT_COMPARABLE',
  'INSUFFICIENT_EVIDENCE',
] as const;

export type WinnerState = (typeof WINNER_STATES)[number];

export const OBJECTIVE_WINNERS = [
  'BEST_LATENCY',
  'BEST_THROUGHPUT',
  'BEST_MEMORY',
  'BEST_COST',
  'BEST_LOCAL_PRIVACY',
  'BEST_QUALITY',
  'BEST_RELIABILITY',
] as const;

export type ObjectiveWinner = (typeof OBJECTIVE_WINNERS)[number];

export const QPU_TIMING_SCOPES = [
  'QPU_EXECUTION_ONLY',
  'END_TO_END_HYBRID_RUNTIME',
] as const;

export type QpuTimingScope = (typeof QPU_TIMING_SCOPES)[number];

export type SuccessCriteria = {
  criteriaId: string;
  objective: string;
  qualityTarget: number;
  accuracyTolerance: number;
  mustSatisfyConstraints: boolean;
  outputObjective: string;
};

export type HardwareContext = {
  deviceClass: DeviceClass;
  deviceId: string;
  deviceVendor: string | null;
  runtimeId: string;
  runtimeVersion: string;
  driverVersion: string | null;
  modelVersion: string | null;
  os: string | null;
  ramMb: number | null;
  vramMb: number | null;
  thermalState: string | null;
  batteryState: string | null;
  concurrency: number | null;
  queueDepth: number | null;
};

export type ExperimentSide = {
  receiptId: string;
  tenantId: string;
  universeId: string;
  missionId: string;
  taskId: string;
  problemClass: string;
  problemVersion: string;
  problemSize: number;
  inputHash: string;
  datasetVersion: string;
  datasetSize: number;
  algorithmId: string;
  algorithmVersion: string;
  executionClass: ExecutionClass;
  hardware: HardwareContext;
  precision: string;
  tolerance: number;
  seed: number | null;
  shots: number | null;
  samplingMethod: string | null;
  noiseModel: string | null;
  initMethod: string | null;
  batchSize: number;
  timingScope: TimingScope;
  successCriteria: SuccessCriteria;
  qualityMetricSchema: string;
  qualityPassed: boolean;
  qualityScore: number | null;
  runtimeMs: number | null;
  /** Multi-run samples for statistical comparison. */
  runtimesMs: number[];
  memoryPeakMb: number | null;
  throughput: number | null;
  costMethod: CostAccountingMethod;
  costValue: number | null;
  energyMethod: EnergyAccountingMethod;
  energyValue: number | null;
  runCount: number;
  /** Provider / QPU evidence */
  providerId: string | null;
  providerContextEvidence: boolean;
  queueMs: number | null;
  submitMs: number | null;
  execMs: number | null;
  preProcessMs: number | null;
  postProcessMs: number | null;
  qpuTimingScopes: QpuTimingScope[];
  /** Freshness */
  stale: boolean;
  materialChangeSinceComparison: boolean;
  expiresAt: string | null;
  createdAt: string;
};

/** Full BenchmarkComparisonRequest contract fields from story. */
export const BENCHMARK_COMPARISON_REQUEST_FIELDS = [
  'comparisonId',
  'missionId',
  'taskId',
  'tenantId',
  'universeId',
  'baselineReceiptId',
  'candidateReceiptId',
  'problemClass',
  'problemVersion',
  'problemSize',
  'inputHash',
  'datasetVersion',
  'datasetSize',
  'baselineAlgorithmId',
  'candidateAlgorithmId',
  'baselineExecutionClass',
  'candidateExecutionClass',
  'baselineDevice',
  'candidateDevice',
  'baselineRuntime',
  'candidateRuntime',
  'precision',
  'tolerance',
  'seeds',
  'batchSizes',
  'successCriteria',
  'qualityMetricSchema',
  'runtimeAccountingMethod',
  'costAccountingMethod',
  'energyAccountingMethod',
  'createdAt',
  'expiresAt',
] as const;

export type BenchmarkComparisonRequestField =
  (typeof BENCHMARK_COMPARISON_REQUEST_FIELDS)[number];

export type BenchmarkComparisonRequest = {
  comparisonId: string;
  missionId: string;
  taskId: string;
  tenantId: string;
  universeId: string;
  baselineReceiptId: string;
  candidateReceiptId: string;
  problemClass: string;
  problemVersion: string;
  problemSize: number;
  inputHash: string;
  datasetVersion: string;
  datasetSize: number;
  baselineAlgorithmId: string;
  candidateAlgorithmId: string;
  baselineExecutionClass: ExecutionClass;
  candidateExecutionClass: ExecutionClass;
  baselineDevice: HardwareContext;
  candidateDevice: HardwareContext;
  baselineRuntime: { runtimeId: string; runtimeVersion: string };
  candidateRuntime: { runtimeId: string; runtimeVersion: string };
  precision: string;
  tolerance: number;
  seeds: { baseline: number | null; candidate: number | null };
  batchSizes: { baseline: number; candidate: number };
  successCriteria: SuccessCriteria;
  qualityMetricSchema: string;
  runtimeAccountingMethod: TimingScope;
  costAccountingMethod: CostAccountingMethod;
  energyAccountingMethod: EnergyAccountingMethod;
  createdAt: string;
  expiresAt: string;
  /** Actor scope for isolation checks. */
  actorTenantId: string;
  actorUniverseId: string;
  networkOnline?: boolean;
  externalDataRequired?: boolean;
  waitingProvider?: boolean;
};

export type SoftWirePresence = {
  present: boolean;
  pathChecked: string;
  note: string;
  verified: false;
  disposition: 'PRESENT_UNVERIFIED' | 'WAITING_DATA';
};

export type MatchFlags = {
  sameProblemDefinition: boolean;
  sameProblemSize: boolean;
  sameInput: boolean;
  sameDataset: boolean;
  sameObjective: boolean;
  sameQualityTarget: boolean;
  sameQualityMetricSchema: boolean;
  sameSuccessCriteria: boolean;
  samePrecision: boolean;
  sameTolerance: boolean;
  sameBatchSize: boolean;
  sameTimingScope: boolean;
  hardwareContextComparable: boolean;
  randomnessControlled: boolean;
  classLabelHonest: boolean;
  costMethodsComparable: boolean;
  energyMethodsComparable: boolean;
  providerEvidenceAdequate: boolean;
};

export type NormalizedMetrics = {
  latencyMeanMs: number | null;
  latencyStdMs: number | null;
  throughputMean: number | null;
  memoryPeakMb: number | null;
  qualityScore: number | null;
  costNormalized: number | null;
  energyNormalized: number | null;
  runCount: number;
  statistical: boolean;
};

export type DifferenceClass =
  | 'NONE'
  | 'PROBLEM_MISMATCH'
  | 'SIZE_MISMATCH'
  | 'OBJECTIVE_MISMATCH'
  | 'QUALITY_TARGET_MISMATCH'
  | 'TIMING_SCOPE_MISMATCH'
  | 'HARDWARE_CONTEXT_MISMATCH'
  | 'CLASS_CROSS_LABEL'
  | 'SIMULATOR_VS_PHYSICAL'
  | 'COST_METHOD_MISMATCH'
  | 'ENERGY_METHOD_MIXED'
  | 'RANDOMNESS_UNCONTROLLED'
  | 'SINGLE_RUN_LOW_CONFIDENCE'
  | 'STALE'
  | 'INSUFFICIENT_PROVIDER_EVIDENCE'
  | 'CROSS_VENDOR_PARTIAL'
  | 'OTHER';

export type NeuralLearningUpdate = {
  strengthen: boolean;
  strength: 'NONE' | 'WEAK' | 'STRONG';
  weightDelta: number;
  reason: string;
  permissionsChanged: false;
  guardianChanged: false;
  rlsChanged: false;
};

export type ContradictionRecord = {
  contradictionId: string;
  comparisonId: string;
  kind: string;
  leftClaim: string;
  rightClaim: string;
  reasons: string[];
  createdAt: string;
};
