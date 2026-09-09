/**
 * 62L-EX2 — Classical Baseline First (Global Operations Brain / GitHub #170).
 *
 * Classical Baseline Lab = mandatory comparison layer for quantum /
 * quantum-inspired / simulated-quantum research.
 *
 * Soft-wire Agent Mesh, EX1 quantum mission, chipgraph, benchmarks via
 * existsSync. Presence ≠ VERIFIED. Absent → WAITING_DATA (not FAIL).
 *
 * Honesty: DOCUMENTED ≠ IMPLEMENTED ≠ VERIFIED ≠ PRODUCTION AUTHORIZED.
 * L4_AUTONOMY_ENABLED=false. tip-land=NO. No PR unless founder asks.
 * Never claim quantum advantage from one isolated result.
 * COMPLETED ≠ automatically REPRODUCIBLE.
 *
 * Canonical path (not a second agent framework):
 * Home Base → Agent Mesh → Quantum Mission → Classical Baseline → Candidate →
 * Comparable Benchmark → Evidence Review → Neural Pathway → Home Base.
 *
 * Next (docs-only): EX3 — Quantum-Inspired Algorithm Lab.
 */

import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

export const HONESTY_BANNER =
  'DOCUMENTED ≠ IMPLEMENTED ≠ VERIFIED ≠ PRODUCTION AUTHORIZED' as const;

export const GITHUB_SOT_ISSUE = 170 as const;
export const GITHUB_SOT_LABEL = '62L-EX2' as const;
export const GITHUB_SOT_FAMILY = '62L-EX' as const;
export const GITHUB_SOT_TITLE =
  'EX2 — Classical Baseline First — mandatory classical comparison layer for quantum / quantum-inspired / simulated-quantum research; L4=false' as const;

export const GITLAB_MIRROR_NOTE =
  'GitLab mirror: MCP needsAuth / not resolved — no issue number invented.' as const;

export const EX2_DB_CANDIDATES_STATUS = 'NOT_APPLIED' as const;

export const NEXT_PHASE_TITLE =
  'EX3 — Quantum-Inspired Algorithm Lab' as const;

/** Canonical ownership path — never spawn a parallel agent framework. */
export const CANONICAL_PATHWAY = [
  'HomeBase',
  'AgentMesh',
  'QuantumMission',
  'ClassicalBaseline',
  'Candidate',
  'ComparableBenchmark',
  'EvidenceReview',
  'NeuralPathway',
  'HomeBase',
] as const;

export type CanonicalPathwayHop = (typeof CANONICAL_PATHWAY)[number];

export const EX2_LOCKS = {
  L4_AUTONOMY_ENABLED: false as const,
  TIP_LAND: false as const,
  PRODUCTION_AUTHORIZATION: false as const,
  MANAGE_PULL_REQUEST: false as const,
  DOCUMENTED_EQ_IMPLEMENTED: false as const,
  IMPLEMENTED_EQ_VERIFIED: false as const,
  VERIFIED_EQ_PRODUCTION_AUTHORIZED: false as const,
  PRESENCE_EQ_VERIFIED: false as const,
  COMPLETED_EQ_REPRODUCIBLE: false as const,
  CLAIM_ADVANTAGE_FROM_ISOLATED_RESULT: false as const,
  FABRICATE_COST: false as const,
  BROADEN_PERMISSIONS: false as const,
  WEAKEN_GUARDIAN_RLS: false as const,
  COPY_RESTRICTED_PROPRIETARY_IP: false as const,
  SECOND_AGENT_FRAMEWORK: false as const,
} as const;

export const EX2_MUST_NOT = [
  'claim_quantum_faster_cheaper_superior_advantage_from_isolated_result',
  'auto_mark_completed_as_reproducible',
  'fabricate_cost_when_unknown',
  'treat_presence_as_verified',
  'broaden_permissions_or_weaken_guardian_rls',
  'copy_restricted_proprietary_ip',
  'spawn_second_agent_framework',
  'support_strong_claim_from_stale_baseline',
  'compare_across_tenant_or_universe',
] as const;

export function assertEx2LocksIntact(): boolean {
  return (
    EX2_LOCKS.L4_AUTONOMY_ENABLED === false &&
    EX2_LOCKS.TIP_LAND === false &&
    EX2_LOCKS.PRODUCTION_AUTHORIZATION === false &&
    EX2_LOCKS.MANAGE_PULL_REQUEST === false &&
    EX2_LOCKS.COMPLETED_EQ_REPRODUCIBLE === false &&
    EX2_LOCKS.CLAIM_ADVANTAGE_FROM_ISOLATED_RESULT === false &&
    EX2_LOCKS.FABRICATE_COST === false &&
    EX2_LOCKS.BROADEN_PERMISSIONS === false &&
    EX2_LOCKS.WEAKEN_GUARDIAN_RLS === false &&
    EX2_LOCKS.SECOND_AGENT_FRAMEWORK === false
  );
}

/** Classical Baseline Contract — required comparison receipt fields. */
export const CLASSICAL_BASELINE_CONTRACT_FIELDS = [
  'baselineId',
  'missionId',
  'taskId',
  'tenantId',
  'universeId',
  'problemClass',
  'problemVersion',
  'algorithmId',
  'algorithmVersion',
  'inputHash',
  'datasetVersion',
  'problemSize',
  'seed',
  'configuration',
  'precision',
  'tolerance',
  'runtimeId',
  'runtimeVersion',
  'deviceClass',
  'deviceId',
  'deviceEvidenceState',
  'startedAt',
  'completedAt',
  'runtimeMs',
  'memoryPeakMb',
  'throughput',
  'latency',
  'energyProxy',
  'outputHash',
  'qualityMetrics',
  'successCriteria',
  'evidenceRefs',
  'reproducibilityState',
  'createdAt',
] as const;

export type ClassicalBaselineContractField =
  (typeof CLASSICAL_BASELINE_CONTRACT_FIELDS)[number];

export const BASELINE_STATES = [
  'NOT_STARTED',
  'READY',
  'RUNNING',
  'COMPLETED',
  'FAILED',
  'EXPIRED',
  'STALE',
  'NOT_COMPARABLE',
  'REPRODUCIBLE',
  'NON_REPRODUCIBLE',
] as const;

export type BaselineState = (typeof BASELINE_STATES)[number];

export const COMPARISON_STATES = [
  'ELIGIBLE',
  'NOT_COMPARABLE',
  'BLOCKED',
  'DENIED',
  'WAITING_DATA',
  'WAITING_PROVIDER',
] as const;

export type ComparisonState = (typeof COMPARISON_STATES)[number];

export const DEVICE_CLASSES = ['CPU', 'GPU', 'NPU'] as const;
export type DeviceClass = (typeof DEVICE_CLASSES)[number];

export const DEVICE_EVIDENCE_STATES = [
  'DOCUMENTED',
  'DETECTED',
  'SUPPORTED',
  'VERIFIED',
  'NOT_TESTED',
  'WAITING_DATA',
  'UNAVAILABLE',
] as const;

export type DeviceEvidenceState = (typeof DEVICE_EVIDENCE_STATES)[number];

export const COST_STATES = ['KNOWN', 'COST_UNKNOWN'] as const;
export type CostState = (typeof COST_STATES)[number];

export const ENERGY_STATES = [
  'MEASURED',
  'ENERGY_PROXY_ESTIMATE',
  'ENERGY_UNKNOWN',
] as const;
export type EnergyState = (typeof ENERGY_STATES)[number];

export const CLASSICAL_ALGORITHM_CANDIDATES = [
  'exact',
  'heuristic',
  'dynamic_programming',
  'graph',
  'linear_algebra',
  'numerical_optimization',
  'mixed_integer_programming',
  'monte_carlo',
  'sampling',
  'search',
  'machine_learning',
  'constraints',
  'scheduling',
  'routing',
  'simulation',
] as const;

export type ClassicalAlgorithmCandidate =
  (typeof CLASSICAL_ALGORITHM_CANDIDATES)[number];

export const STALE_TRIGGERS = [
  'algorithm_change',
  'runtime_change',
  'hardware_change',
  'model_change',
  'driver_change',
  'problem_change',
  'dataset_change',
  'methodology_change',
] as const;

export type StaleTrigger = (typeof STALE_TRIGGERS)[number];

export type SoftWirePresence = {
  present: boolean;
  pathChecked: string;
  note: string;
  /** Presence alone never equals VERIFIED. */
  verified: false;
  hopState: 'PASS' | 'WAITING_DATA';
};

export type Ex2SoftWireSnapshot = {
  agentMesh: SoftWirePresence;
  ex1QuantumMission: SoftWirePresence;
  chipgraph: SoftWirePresence;
  benchmarks: SoftWirePresence;
};

export type QualityMetrics = {
  objectiveValue: number | null;
  accuracy: number | null;
  feasibility: boolean | null;
  custom: Record<string, number | string | boolean | null>;
};

export type SuccessCriteria = {
  criteriaId: string;
  objective: string;
  accuracyTolerance: number;
  mustSatisfyConstraints: boolean;
  outputObjective: string;
};

export type EnergyProxy = {
  state: EnergyState;
  value: number | null;
  unit: string | null;
  note: string;
};

export type CostProxy = {
  state: CostState;
  value: number | null;
  currency: string | null;
  note: string;
};

export type ClassicalBaselineReceipt = {
  baselineId: string;
  missionId: string;
  taskId: string;
  tenantId: string;
  universeId: string;
  problemClass: string;
  problemVersion: string;
  algorithmId: string;
  algorithmVersion: string;
  inputHash: string;
  datasetVersion: string;
  problemSize: number;
  seed: number;
  configuration: Record<string, unknown>;
  precision: string;
  tolerance: number;
  runtimeId: string;
  runtimeVersion: string;
  deviceClass: DeviceClass;
  deviceId: string;
  deviceEvidenceState: DeviceEvidenceState;
  startedAt: string;
  completedAt: string | null;
  runtimeMs: number | null;
  memoryPeakMb: number | null;
  throughput: number | null;
  latency: number | null;
  energyProxy: EnergyProxy;
  costProxy: CostProxy;
  outputHash: string | null;
  qualityMetrics: QualityMetrics;
  successCriteria: SuccessCriteria;
  evidenceRefs: readonly string[];
  baselineState: BaselineState;
  /** COMPLETED does not imply REPRODUCIBLE. */
  reproducibilityState: BaselineState | 'NOT_EVALUATED';
  createdAt: string;
  staleTriggers: readonly StaleTrigger[];
  samplingShots: number | null;
};

export type CandidateReceipt = {
  candidateId: string;
  missionId: string;
  taskId: string;
  tenantId: string;
  universeId: string;
  problemClass: string;
  problemVersion: string;
  inputHash: string;
  datasetVersion: string;
  problemSize: number;
  seed: number;
  precision: string;
  tolerance: number;
  successCriteria: SuccessCriteria;
  runtimeMs: number | null;
  deviceClass: DeviceClass;
  deviceEvidenceState: DeviceEvidenceState;
  methodFamily: 'quantum' | 'quantum_inspired' | 'simulated_quantum' | 'hybrid';
  evidenceRefs: readonly string[];
  completed: boolean;
};

export type ComparabilityReceipt = {
  comparisonId: string;
  comparisonState: ComparisonState;
  reasons: readonly string[];
  sameProblemDefinition: boolean;
  sameInput: boolean;
  sameConstraints: boolean;
  sameSuccessCriteria: boolean;
  equivalentAccuracyTolerance: boolean;
  equivalentOutputObjective: boolean;
  comparableRuntimeAccounting: boolean;
  confidence: number;
  evidenceRefs: readonly string[];
  freshness: 'FRESH' | 'STALE' | 'UNKNOWN';
  reproducibility: BaselineState | 'NOT_EVALUATED';
  createdAt: string;
};

export type AdvantageClaimInput = {
  claimText: string;
  baselineReceipt: ClassicalBaselineReceipt | null;
  candidateReceipt: CandidateReceipt | null;
  comparabilityReceipt: ComparabilityReceipt | null;
  repeatRunSummary: RepeatabilitySummary | null;
  reviewResult: 'APPROVED' | 'DENIED' | 'PENDING' | null;
};

export type AdvantageClaimDecision = {
  allowed: false | true;
  decision: 'DENIED' | 'ALLOWED_WITH_EVIDENCE' | 'BLOCKED';
  reasons: readonly string[];
};

export type RepeatabilitySummary = {
  runCount: number;
  successfulRuns: number;
  failedRuns: number;
  medianRuntimeMs: number | null;
  meanRuntimeMs: number | null;
  minRuntimeMs: number | null;
  maxRuntimeMs: number | null;
  varianceRuntimeMs: number | null;
  qualityVariance: number | null;
  seedPreserved: boolean;
  samplingShotsPreserved: boolean;
  reproducibilityState: 'REPRODUCIBLE' | 'NON_REPRODUCIBLE' | 'NOT_EVALUATED';
};

export type ComparisonEdge = {
  edgeId: string;
  kind: 'COMPARISON_EDGE';
  classicalPathwayId: string;
  candidatePathwayId: string;
  comparability: ComparisonState;
  confidence: number;
  evidenceRefs: readonly string[];
  freshness: 'FRESH' | 'STALE' | 'UNKNOWN';
  reproducibility: BaselineState | 'NOT_EVALUATED';
};

function softWireFile(
  fromDir: string,
  rel: string,
  notePresent: string,
  noteAbsent: string,
): SoftWirePresence {
  const pathChecked = join(fromDir, rel);
  const present = existsSync(pathChecked);
  return {
    present,
    pathChecked,
    note: present ? notePresent : noteAbsent,
    verified: false,
    hopState: present ? 'PASS' : 'WAITING_DATA',
  };
}

/**
 * Soft-wire presence probe. Presence ≠ VERIFIED.
 * Absent → WAITING_DATA (not FAIL).
 */
export function ex2SoftWireSnapshot(repoRoot?: string): Ex2SoftWireSnapshot {
  const here = dirname(fileURLToPath(import.meta.url));
  const runtime = join(here, '..');
  const root = repoRoot ?? join(here, '../../../..');

  return {
    agentMesh: softWireFile(
      runtime,
      'agentmesh/index.ts',
      'Agent Mesh PRESENT (soft-wire). Presence≠VERIFIED. Reuse — do not duplicate.',
      'Agent Mesh absent — soft-wire WAITING_DATA.',
    ),
    ex1QuantumMission: softWireFile(
      here,
      'mission.ts',
      'EX1 Quantum Mission PRESENT (soft-wire). Presence≠VERIFIED.',
      'EX1 Quantum Mission absent — soft-wire WAITING_DATA.',
    ),
    chipgraph: softWireFile(
      runtime,
      'chipgraph/types.ts',
      'Chipgraph PRESENT (soft-wire). Presence≠VERIFIED.',
      'Chipgraph absent — soft-wire WAITING_DATA.',
    ),
    benchmarks: softWireFile(
      join(root, 'services/ai'),
      'local-runtime/classical-quant-benchmark.ts',
      'Classical quant benchmark PRESENT (soft-wire). Presence≠VERIFIED.',
      'Benchmark pack absent — soft-wire WAITING_DATA.',
    ),
  };
}
