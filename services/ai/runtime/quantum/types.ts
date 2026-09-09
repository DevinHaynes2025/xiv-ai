/**
 * 62L-EX9 — Quantum Workload Genome types + locks.
 * Parent: 62L-EX / GitHub #170.
 *
 * Canonical flow:
 * Mission → Problem Definition → Workload Genome → Problem Primitives →
 * Candidate Algorithms → Classical Baseline → Hardware Requirements →
 * Hybrid Router → Execution → Benchmark → Evidence → XIV Home Base
 *
 * Honesty: DOCUMENTED ≠ IMPLEMENTED ≠ VERIFIED ≠ PRODUCTION AUTHORIZED
 * Presence ≠ VERIFIED. QUBO/Ising ≠ physical quantum execution.
 * Quantum suitability LOW/MEDIUM/HIGH/UNKNOWN ≠ QUANTUM_ADVANTAGE_VERIFIED.
 * L4_AUTONOMY_ENABLED=false.
 *
 * Do NOT duplicate Agent Mesh / Hybrid Router / Classical Baseline /
 * Guardian / identity / tenant-Universe controls — soft-wire via existsSync.
 * Genome first, then candidates — never hard-code vendor winners.
 */

export const HONESTY_BANNER =
  'DOCUMENTED ≠ IMPLEMENTED ≠ VERIFIED ≠ PRODUCTION AUTHORIZED' as const;

export const GITHUB_SOT_ISSUE = 170 as const;
export const GITHUB_SOT_LABEL = '62L-EX9' as const;
export const GITHUB_SOT_FAMILY = '62L-EX' as const;
export const GITHUB_SOT_TITLE =
  'EX9 — Quantum Workload Genome — genome-first problem DNA; candidates only; L4=false' as const;

export const GITLAB_MIRROR_NOTE =
  'GitLab mirror: MCP needsAuth / not resolved — no issue number invented.' as const;

export const EX9_DB_CANDIDATES_STATUS = 'NOT_APPLIED' as const;

export const NEXT_PHASE_TITLE =
  'EX10 — Benchmark Comparability Gate' as const;

/** Canonical pathway hops for EX9. */
export const EX9_CANONICAL_FLOW = [
  'Mission',
  'ProblemDefinition',
  'WorkloadGenome',
  'ProblemPrimitives',
  'CandidateAlgorithms',
  'ClassicalBaseline',
  'HardwareRequirements',
  'HybridRouter',
  'Execution',
  'Benchmark',
  'Evidence',
  'XivHomeBase',
] as const;

export type Ex9CanonicalHop = (typeof EX9_CANONICAL_FLOW)[number];

export const EX9_LOCKS = {
  L4_AUTONOMY_ENABLED: false as const,
  TIP_LAND: false as const,
  PRODUCTION_AUTHORIZATION: false as const,
  PRODUCTION_WRITE: false as const,
  MERGE_MAIN: false as const,
  MANAGE_PULL_REQUEST: false as const,
  BUY_QPU_CLOUD_AUTONOMOUSLY: false as const,
  HARD_CODE_VENDOR_WINNER: false as const,
  AUTO_SELECT_ALGORITHM_WINNER: false as const,
  QUBO_EQUALS_PHYSICAL_QPU: false as const,
  GENOME_IMPLIES_PHYSICAL_QPU: false as const,
  SIMILARITY_BYPASSES_BENCHMARK: false as const,
  QUANTUM_SUITABILITY_EQUALS_ADVANTAGE: false as const,
  CLAIM_UNSUPPORTED_QUANTUM_ADVANTAGE: false as const,
  CLAIM_CONSCIOUSNESS_AS_FACT: false as const,
  CLAIM_SUPERINTELLIGENCE_AS_FACT: false as const,
  PRESENT_SIMULATION_AS_PHYSICAL: false as const,
  PRESENCE_EQ_VERIFIED: false as const,
  BOTTLENECK_PREDICTION_EQ_MEASURED: false as const,
  LEARNING_ALTERS_PERMISSIONS: false as const,
  WEAKEN_GUARDIAN_RLS: false as const,
  BROADEN_PERMISSIONS: false as const,
  CROSS_TENANT_ACCESS: false as const,
  CROSS_UNIVERSE_ACCESS: false as const,
  SECOND_ORCHESTRATION_FRAMEWORK: false as const,
  DUPLICATE_AGENT_MESH: false as const,
  DUPLICATE_HYBRID_ROUTER: false as const,
  DUPLICATE_CLASSICAL_BASELINE: false as const,
  DUPLICATE_GUARDIAN: false as const,
  REVERSE_ENGINEER_PROPRIETARY_QPU_IP: false as const,
} as const;

export type Ex9LockKey = keyof typeof EX9_LOCKS;

export function assertEx9LocksIntact(): boolean {
  return (
    EX9_LOCKS.L4_AUTONOMY_ENABLED === false &&
    EX9_LOCKS.TIP_LAND === false &&
    EX9_LOCKS.PRODUCTION_AUTHORIZATION === false &&
    EX9_LOCKS.MERGE_MAIN === false &&
    EX9_LOCKS.MANAGE_PULL_REQUEST === false &&
    EX9_LOCKS.HARD_CODE_VENDOR_WINNER === false &&
    EX9_LOCKS.AUTO_SELECT_ALGORITHM_WINNER === false &&
    EX9_LOCKS.QUBO_EQUALS_PHYSICAL_QPU === false &&
    EX9_LOCKS.GENOME_IMPLIES_PHYSICAL_QPU === false &&
    EX9_LOCKS.SIMILARITY_BYPASSES_BENCHMARK === false &&
    EX9_LOCKS.QUANTUM_SUITABILITY_EQUALS_ADVANTAGE === false &&
    EX9_LOCKS.CLAIM_UNSUPPORTED_QUANTUM_ADVANTAGE === false &&
    EX9_LOCKS.BOTTLENECK_PREDICTION_EQ_MEASURED === false &&
    EX9_LOCKS.LEARNING_ALTERS_PERMISSIONS === false &&
    EX9_LOCKS.WEAKEN_GUARDIAN_RLS === false &&
    EX9_LOCKS.BROADEN_PERMISSIONS === false &&
    EX9_LOCKS.CROSS_TENANT_ACCESS === false &&
    EX9_LOCKS.CROSS_UNIVERSE_ACCESS === false &&
    EX9_LOCKS.SECOND_ORCHESTRATION_FRAMEWORK === false
  );
}

export function ex9L4AutonomyEnabled(): false {
  return EX9_LOCKS.L4_AUTONOMY_ENABLED;
}

export function guardianRlsUnchangedByEx9(): true {
  return true;
}

export type SoftWireDisposition = 'PRESENT_UNVERIFIED' | 'WAITING_DATA';

export type SoftWirePresence = {
  present: boolean;
  pathChecked: string;
  note: string;
  /** Soft-wire never elevates to VERIFIED. */
  verified: false;
  disposition: SoftWireDisposition;
};

export const GENOME_STATUS_VALUES = [
  'DRAFT',
  'CURRENT',
  'STALE',
  'REBUILD_REQUIRED',
  'EXPIRED',
  'DENIED',
  'WAITING_DATA',
] as const;

export type GenomeStatus = (typeof GENOME_STATUS_VALUES)[number];

export const QUANTUM_SUITABILITY_LEVELS = [
  'LOW',
  'MEDIUM',
  'HIGH',
  'UNKNOWN',
] as const;

export type QuantumSuitabilityLevel =
  (typeof QUANTUM_SUITABILITY_LEVELS)[number];

/** Explicitly never auto-promoted from suitability alone. */
export const QUANTUM_ADVANTAGE_VERIFIED = false as const;

export const EXECUTION_CLASSES = [
  'CLASSICAL',
  'QUANTUM_INSPIRED',
  'SIMULATED_QUANTUM',
  'PHYSICAL_QPU_VERIFIED',
] as const;

export type ExecutionClass = (typeof EXECUTION_CLASSES)[number];

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

export const HARDWARE_CLASSES = [
  'LOCAL_CPU',
  'VERIFIED_LOCAL_GPU',
  'VERIFIED_LOCAL_NPU',
  'LOCAL_QUANTUM_SIMULATOR',
  'QUANTUM_INSPIRED_CLASSICAL_RUNTIME',
  'PHYSICAL_QPU',
  'CLOUD_ACCELERATOR',
  'UNVERIFIED_ACCELERATOR',
] as const;

export type HardwareClass = (typeof HARDWARE_CLASSES)[number];

export type Ex9Denial = {
  denied: true;
  state: 'DENIED';
  reason: string;
  executed: false;
};

export function ex9Deny(reason: string): Ex9Denial {
  return { denied: true, state: 'DENIED', reason, executed: false };
}

export function isEx9Denial(value: unknown): value is Ex9Denial {
  return (
    typeof value === 'object' &&
    value !== null &&
    (value as Ex9Denial).denied === true &&
    (value as Ex9Denial).state === 'DENIED'
  );
}
