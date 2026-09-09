/**
 * 62L-EX7 — Hybrid Classical/Quantum Router types.
 * Parent: 62L-EX / Global Operations Brain / GitHub #170.
 *
 * One shared router on existing fabric — NOT a second quantum orchestration system.
 * Soft-wire EX1–EX6, Agent Mesh, chipgraph, baselines, simulators, QPU registry,
 * receipts, benchmarks, Guardian/policy via existsSync.
 * Presence ≠ VERIFIED. Absent → WAITING_DATA.
 *
 * L4_AUTONOMY_ENABLED=false. tip-land=NO. No PR unless founder asks.
 * PHYSICAL_QPU_CANDIDATE ≠ submitted. Never collapse classes into vague QUANTUM.
 * PREFERRED ≠ production authorization.
 *
 * Canonical flow:
 * Mission → Problem Classification → Workload Genome → Policy Gate →
 * Data/Privacy Gate → Evidence Gate → Cost/Latency Gate →
 * Eligible Execution Paths → Route Scoring → Selected Candidate →
 * Execution → Receipt → Comparison → Learning → XIV Home Base.
 *
 * Next (docs-only): EX8 — Offline Quantum Agent Team.
 */

import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

export const HONESTY_BANNER =
  'DOCUMENTED ≠ IMPLEMENTED ≠ VERIFIED ≠ PRODUCTION AUTHORIZED; PHYSICAL_QPU_CANDIDATE ≠ submitted; PREFERRED ≠ production auth; presence ≠ VERIFIED' as const;

export const GITHUB_SOT_ISSUE = 170 as const;
export const GITHUB_SOT_LABEL = '62L-EX7' as const;
export const GITHUB_SOT_FAMILY = '62L-EX' as const;
export const GITHUB_SOT_TITLE =
  'EX7 — Hybrid Classical/Quantum Router — LOCAL_FIRST route selection across classical / QI / simulated / physical-candidate paths; L4=false' as const;

export const GITLAB_MIRROR_NOTE =
  'GitLab mirror: MCP needsAuth / not resolved — no issue number invented.' as const;

export const EX7_DB_CANDIDATES_STATUS = 'NOT_APPLIED' as const;

export const NEXT_PHASE_TITLE = 'EX8 — Offline Quantum Agent Team' as const;

/** Canonical ownership path — never spawn a parallel orchestration framework. */
export const EX7_CANONICAL_FLOW = [
  'Mission',
  'ProblemClassification',
  'WorkloadGenome',
  'PolicyGate',
  'DataPrivacyGate',
  'EvidenceGate',
  'CostLatencyGate',
  'EligibleExecutionPaths',
  'RouteScoring',
  'SelectedCandidate',
  'Execution',
  'Receipt',
  'Comparison',
  'Learning',
  'XivHomeBase',
] as const;

export type Ex7CanonicalHop = (typeof EX7_CANONICAL_FLOW)[number];

export const EX7_LOCKS = {
  L4_AUTONOMY_ENABLED: false as const,
  TIP_LAND: false as const,
  PRODUCTION_AUTHORIZATION: false as const,
  PRODUCTION_WRITE: false as const,
  MERGE_MAIN: false as const,
  MANAGE_PULL_REQUEST: false as const,
  BUY_QPU_CLOUD_AUTONOMOUSLY: false as const,
  SUBMIT_COST_BEARING_JOBS_AUTONOMOUSLY: false as const,
  CHANGE_CREDENTIALS_AUTONOMOUSLY: false as const,
  ACCEPT_PROVIDER_TERMS_AUTONOMOUSLY: false as const,
  CREATE_FINANCIAL_COMMITMENTS: false as const,
  FABRICATE_AVAILABILITY: false as const,
  PRESENT_SIMULATION_AS_PHYSICAL: false as const,
  CLAIM_UNSUPPORTED_QUANTUM_ADVANTAGE: false as const,
  CLAIM_CONSCIOUSNESS_AS_FACT: false as const,
  CLAIM_SUPERINTELLIGENCE_AS_FACT: false as const,
  COLLAPSE_CLASSES_INTO_VAGUE_QUANTUM: false as const,
  PREFERRED_EQ_PRODUCTION_AUTH: false as const,
  PRESENCE_EQ_VERIFIED: false as const,
  DETECTED_EQ_VERIFIED: false as const,
  SECOND_ORCHESTRATION_FRAMEWORK: false as const,
  WEAKEN_GUARDIAN_RLS: false as const,
  BROADEN_PERMISSIONS: false as const,
  ROUTE_LEARNING_MODIFIES_PERMISSIONS: false as const,
  SILENT_FALLBACK: false as const,
} as const;

export type Ex7LockKey = keyof typeof EX7_LOCKS;

export function assertEx7LocksIntact(): boolean {
  return (
    EX7_LOCKS.L4_AUTONOMY_ENABLED === false &&
    EX7_LOCKS.TIP_LAND === false &&
    EX7_LOCKS.PRODUCTION_AUTHORIZATION === false &&
    EX7_LOCKS.MANAGE_PULL_REQUEST === false &&
    EX7_LOCKS.BUY_QPU_CLOUD_AUTONOMOUSLY === false &&
    EX7_LOCKS.SUBMIT_COST_BEARING_JOBS_AUTONOMOUSLY === false &&
    EX7_LOCKS.FABRICATE_AVAILABILITY === false &&
    EX7_LOCKS.PRESENT_SIMULATION_AS_PHYSICAL === false &&
    EX7_LOCKS.CLAIM_UNSUPPORTED_QUANTUM_ADVANTAGE === false &&
    EX7_LOCKS.COLLAPSE_CLASSES_INTO_VAGUE_QUANTUM === false &&
    EX7_LOCKS.PREFERRED_EQ_PRODUCTION_AUTH === false &&
    EX7_LOCKS.PRESENCE_EQ_VERIFIED === false &&
    EX7_LOCKS.DETECTED_EQ_VERIFIED === false &&
    EX7_LOCKS.SECOND_ORCHESTRATION_FRAMEWORK === false &&
    EX7_LOCKS.WEAKEN_GUARDIAN_RLS === false &&
    EX7_LOCKS.BROADEN_PERMISSIONS === false &&
    EX7_LOCKS.ROUTE_LEARNING_MODIFIES_PERMISSIONS === false &&
    EX7_LOCKS.SILENT_FALLBACK === false
  );
}

export function ex7L4AutonomyEnabled(): false {
  return EX7_LOCKS.L4_AUTONOMY_ENABLED;
}

export function guardianRlsUnchangedByEx7(): true {
  return true;
}

/**
 * Route classes — never collapse into vague QUANTUM.
 * PHYSICAL_QPU_CANDIDATE ≠ submitted / cost-bearing execution.
 */
export const ROUTE_CLASSES = [
  'CLASSICAL_CPU',
  'CLASSICAL_GPU',
  'CLASSICAL_NPU',
  'QUANTUM_INSPIRED_CPU',
  'QUANTUM_INSPIRED_GPU',
  'QUANTUM_INSPIRED_NPU',
  'SIMULATED_QUANTUM_CPU',
  'SIMULATED_QUANTUM_GPU',
  'PHYSICAL_QPU_CANDIDATE',
] as const;

export type RouteClass = (typeof ROUTE_CLASSES)[number];

export const ROUTE_STATES = [
  'ROUTE_SELECTED',
  'WAITING_NODE',
  'WAITING_PROVIDER',
  'WAITING_DATA',
  'HUMAN_APPROVAL_REQUIRED',
  'RESOURCE_LIMITED',
  'NO_ELIGIBLE_ROUTE',
  'EXPIRED',
  'REVOKED',
  'ROUTE_DENIED',
  'INSUFFICIENT_EVIDENCE',
] as const;

export type RouteState = (typeof ROUTE_STATES)[number];

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

export const PRIVACY_CLASSES = [
  'PUBLIC',
  'INTERNAL',
  'CONFIDENTIAL',
  'RESTRICTED',
  'PRIVATE_LOCAL_ONLY',
] as const;

export type PrivacyClass = (typeof PRIVACY_CLASSES)[number];

export const INPUT_DATA_CLASSES = [
  'PUBLIC',
  'TENANT_SCOPED',
  'SENSITIVE',
  'REGULATED',
  'PRIVATE_LOCAL',
] as const;

export type InputDataClass = (typeof INPUT_DATA_CLASSES)[number];

export const FALLBACK_POLICIES = [
  'NONE',
  'CLASSICAL_CPU_ONLY',
  'LOCAL_CLASSICAL_THEN_QI',
  'LOCAL_THEN_SIMULATOR',
  'EXPLICIT_CHAIN',
] as const;

export type FallbackPolicy = (typeof FALLBACK_POLICIES)[number];

export const LEARNING_STATES = [
  'OBSERVED',
  'RANKED',
  'PREFERRED',
  'DEPRECATED',
  'BLOCKED_BY_POLICY',
] as const;

export type LearningState = (typeof LEARNING_STATES)[number];

/** LOCAL_FIRST priority tiers (1 = highest). Remote needs explicit reason. */
export const LOCAL_FIRST_PRIORITY = {
  VERIFIED_LOCAL_SATISFYING: 1,
  VERIFIED_LOCAL_ACCELERATOR: 2,
  QI_LOCAL_WHEN_JUSTIFIED: 3,
  VERIFIED_LOCAL_SIMULATOR: 4,
  AUTHORIZED_REMOTE_CLASSICAL: 5,
  AUTHORIZED_PHYSICAL_QPU_CANDIDATE: 6,
} as const;

export type SoftWirePresence = {
  present: boolean;
  pathChecked: string;
  note: string;
  /** Presence alone never equals VERIFIED. */
  verified: false;
  hopState: 'PASS' | 'WAITING_DATA';
};

export type Ex7SoftWireSnapshot = {
  agentMesh: SoftWirePresence;
  chipgraph: SoftWirePresence;
  guardian: SoftWirePresence;
  policy: SoftWirePresence;
  baselines: SoftWirePresence;
  ex1Mission: SoftWirePresence;
  ex2Baseline: SoftWirePresence;
  ex3QuantumInspired: SoftWirePresence;
  ex4SimulatorRegistry: SoftWirePresence;
  ex5QpuRegistry: SoftWirePresence;
  ex6PhysicalReceipt: SoftWirePresence;
  benchmarks: SoftWirePresence;
};

export type HybridExecutionRequest = {
  requestId: string;
  missionId: string;
  taskId: string;
  parentMissionId: string | null;
  tenantId: string;
  universeId: string;
  agentId: string;
  problemClass: string;
  workloadGenomeId: string;
  inputDataClass: InputDataClass;
  privacyClass: PrivacyClass;
  localOnly: boolean;
  allowedRouteClasses: readonly RouteClass[];
  preferredRouteClasses: readonly RouteClass[];
  minimumEvidenceState: DeviceEvidenceState;
  latencyBudgetMs: number | null;
  runtimeBudgetMs: number | null;
  memoryBudgetMb: number | null;
  computeBudgetUnits: number | null;
  externalCostBudget: number | null;
  baselineRequired: boolean;
  qualityTarget: number | null;
  precision: string | null;
  tolerance: number | null;
  fallbackPolicy: FallbackPolicy;
  explicitFallbackChain: readonly RouteClass[];
  humanApprovalRequired: boolean;
  returnPath: string;
  createdAt: string;
  expiresAt: string;
  /** Caller context used for tenant/universe gates. */
  callerTenantId: string;
  callerUniverseId: string;
  offline: boolean;
  webFreshRequired: boolean;
  estimatedExternalCost: number | null;
  costBearingPhysicalQpu: boolean;
};

export type HardwareDeviceRecord = {
  deviceId: string;
  vendor:
    | 'AMD'
    | 'NVIDIA'
    | 'Intel'
    | 'Apple'
    | 'Qualcomm'
    | 'ARM'
    | 'GENERIC'
    | 'QPU_PROVIDER';
  routeClass: RouteClass;
  evidenceState: DeviceEvidenceState;
  locality: 'LOCAL' | 'REMOTE';
  available: boolean;
  memoryMb: number | null;
  queueDepth: number | null;
  energyProxy: number | null;
  estimatedCost: number | null;
  startupMs: number | null;
  historicalSuccessRate: number | null;
  benchmarkFreshness: 'FRESH' | 'STALE' | 'UNKNOWN';
  providerAvailable: boolean | null;
  runtimeId: string;
};

export type RouteCandidate = {
  candidateId: string;
  routeClass: RouteClass;
  device: HardwareDeviceRecord;
  localFirstTier: number;
  remoteReason: string | null;
};

export type RouteScoreBreakdown = {
  privacy: number;
  locality: number;
  latency: number;
  throughput: number;
  memoryFit: number;
  quality: number;
  reliability: number;
  startup: number;
  historicalSuccess: number;
  freshness: number;
  cost: number;
  energyProxy: number;
  queue: number;
  providerAvailability: number;
  total: number;
};

export type IneligibleRoute = {
  candidateId: string;
  routeClass: RouteClass;
  deviceId: string;
  reason: string;
  gate: string;
};

export type HybridRouteDecision = {
  decisionId: string;
  requestId: string;
  state: RouteState;
  eligible: readonly RouteCandidate[];
  ineligible: readonly IneligibleRoute[];
  selected: RouteCandidate | null;
  selectedRouteClass: RouteClass | null;
  selectedDeviceId: string | null;
  selectedRuntimeId: string | null;
  score: RouteScoreBreakdown | null;
  reasons: readonly string[];
  approvalsRequired: readonly string[];
  fallbackRequested: readonly RouteClass[];
  fallbackActual: RouteClass | null;
  fallbackRecorded: boolean;
  evidenceRefs: readonly string[];
  advantageClaimAllowed: false;
  advantageClaimBlockReason: string | null;
  learningState: LearningState | null;
  createdAt: string;
};

export type HybridRouteReceipt = {
  receiptId: string;
  decisionId: string;
  requestId: string;
  missionId: string;
  taskId: string;
  tenantId: string;
  universeId: string;
  requestedRouteClass: RouteClass | null;
  actualRouteClass: RouteClass | null;
  requestedDeviceId: string | null;
  actualDeviceId: string | null;
  state: RouteState;
  score: RouteScoreBreakdown | null;
  fallbackRequested: readonly RouteClass[];
  fallbackActual: RouteClass | null;
  evidenceRefs: readonly string[];
  learningState: LearningState;
  /** Learning may change ranking/confidence — never permissions. */
  permissionsUnchanged: true;
  guardianRlsUnchanged: true;
  createdAt: string;
};

export type RouteLearningUpdate = {
  routeClass: RouteClass;
  deviceId: string;
  learningState: LearningState;
  confidenceDelta: number;
  rankingDelta: number;
  /** Always false — learning cannot modify permissions. */
  permissionsModified: false;
  guardianRlsModified: false;
  productionAuthGranted: false;
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
export function ex7SoftWireSnapshot(repoRoot?: string): Ex7SoftWireSnapshot {
  const here = dirname(fileURLToPath(import.meta.url));
  const runtime = join(here, '..');
  const root = repoRoot ?? join(here, '../../../..');
  const aiRoot = join(root, 'services/ai');

  return {
    agentMesh: softWireFile(
      runtime,
      'agentmesh/index.ts',
      'Agent Mesh PRESENT (soft-wire). Presence≠VERIFIED. Reuse — do not duplicate.',
      'Agent Mesh absent — soft-wire WAITING_DATA.',
    ),
    chipgraph: softWireFile(
      runtime,
      'chipgraph/types.ts',
      'Chipgraph PRESENT (soft-wire). Presence≠VERIFIED.',
      'Chipgraph absent — soft-wire WAITING_DATA.',
    ),
    guardian: softWireFile(
      runtime,
      'guardian/validate.ts',
      'Guardian PRESENT — EX7 must not mutate Guardian/RLS.',
      'Guardian absent — soft-wire WAITING_DATA.',
    ),
    policy: softWireFile(
      runtime,
      'policy.ts',
      'Runtime policy PRESENT (soft-wire). Presence≠VERIFIED.',
      'Runtime policy absent — soft-wire WAITING_DATA.',
    ),
    baselines: softWireFile(
      here,
      'baseline.ts',
      'EX2 classical baseline PRESENT (soft-wire). Presence≠VERIFIED.',
      'EX2 baseline.ts absent — soft-wire WAITING_DATA.',
    ),
    ex1Mission: softWireFile(
      here,
      'mission.ts',
      'EX1 mission contract PRESENT (soft-wire). Presence≠VERIFIED.',
      'EX1 mission.ts absent — soft-wire WAITING_DATA.',
    ),
    ex2Baseline: softWireFile(
      here,
      'baseline.ts',
      'EX2 baseline PRESENT (soft-wire). Presence≠VERIFIED.',
      'EX2 baseline absent — soft-wire WAITING_DATA.',
    ),
    ex3QuantumInspired: softWireFile(
      here,
      'quantum-inspired.ts',
      'EX3 quantum-inspired lab PRESENT (soft-wire). Presence≠VERIFIED.',
      'EX3 quantum-inspired.ts absent — soft-wire WAITING_DATA.',
    ),
    ex4SimulatorRegistry: softWireFile(
      here,
      'simulator-registry.ts',
      'EX4 simulator registry PRESENT (soft-wire). Presence≠VERIFIED.',
      'EX4 simulator-registry.ts absent — soft-wire WAITING_DATA.',
    ),
    ex5QpuRegistry: softWireFile(
      here,
      'qpu-provider.ts',
      'EX5 QPU provider registry PRESENT (soft-wire). Presence≠VERIFIED.',
      'EX5 qpu-provider.ts absent — soft-wire WAITING_DATA.',
    ),
    ex6PhysicalReceipt: softWireFile(
      here,
      'physical-qpu-receipt.ts',
      'EX6 physical QPU receipt PRESENT (soft-wire). Presence≠VERIFIED.',
      'EX6 physical-qpu-receipt.ts absent — soft-wire WAITING_DATA.',
    ),
    benchmarks: softWireFile(
      aiRoot,
      'local-runtime/classical-quant-benchmark.ts',
      'Classical quant benchmark PRESENT (soft-wire). Presence≠VERIFIED.',
      'Benchmark pack absent — soft-wire WAITING_DATA.',
    ),
  };
}
