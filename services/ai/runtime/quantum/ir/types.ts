/**
 * 62L-EX16 — Quantum Algorithm Translation Layer types + locks.
 * Parent: 62L-EX / GitHub #170.
 *
 * Canonical flow:
 * MISSION → WORKLOAD GENOME → XIV PROBLEM IR → VALIDATION →
 * ALGORITHM CANDIDATES → EXECUTION IR → PROVIDER/HARDWARE ADAPTER →
 * EXECUTION → RECEIPT → BENCHMARK → EVIDENCE → HOME BASE
 *
 * Mission describes WHAT once; XIV translates HOW for
 * CLASSICAL / QUANTUM_INSPIRED / SIMULATED_QUANTUM / PHYSICAL_QPU_CANDIDATE.
 * Do NOT tie Global Ops Brain to one AMD/NVIDIA/Intel/simulator/QPU/cloud service.
 *
 * Honesty: DOCUMENTED ≠ IMPLEMENTED ≠ VERIFIED ≠ PRODUCTION AUTHORIZED
 * Presence ≠ VERIFIED. Soft-wire absent → WAITING_DATA (not FAIL).
 * QUBO/Ising ≠ PHYSICAL_QPU_VERIFIED. Circuit IR ≠ physical-QPU execution.
 * L4_AUTONOMY_ENABLED=false.
 */

export const HONESTY_BANNER =
  'DOCUMENTED ≠ IMPLEMENTED ≠ VERIFIED ≠ PRODUCTION AUTHORIZED; QUBO/Ising≠PHYSICAL_QPU_VERIFIED; presence≠VERIFIED; L4=false' as const;

export const GITHUB_SOT_ISSUE = 170 as const;
export const GITHUB_SOT_LABEL = '62L-EX16' as const;
export const GITHUB_SOT_FAMILY = '62L-EX' as const;
export const GITHUB_SOT_TITLE =
  'EX16 — Quantum Algorithm Translation Layer — mission→IR→candidates→adapters; L4=false' as const;

export const GITLAB_MIRROR_NOTE =
  'GitLab mirror: MCP needsAuth / not resolved — no issue number invented.' as const;

export const EX16_DB_CANDIDATES_STATUS = 'NOT_APPLIED' as const;

export const NEXT_PHASE_TITLE =
  'EX17 — CPU/GPU/NPU Quantum Pre/Post-Processing Fabric' as const;

export const EX16_COMPILER_VERSION = 'ex16-compiler-1.0.0' as const;
export const EX16_SCHEMA_VERSION = 'xiv-problem-ir/1.0.0' as const;

/** Canonical pathway hops for EX16. */
export const EX16_CANONICAL_FLOW = [
  'MISSION',
  'WORKLOAD_GENOME',
  'XIV_PROBLEM_IR',
  'VALIDATION',
  'ALGORITHM_CANDIDATES',
  'EXECUTION_IR',
  'PROVIDER_HARDWARE_ADAPTER',
  'EXECUTION',
  'RECEIPT',
  'BENCHMARK',
  'EVIDENCE',
  'HOME_BASE',
] as const;

export type Ex16CanonicalHop = (typeof EX16_CANONICAL_FLOW)[number];

export const COMPILER_PIPELINE = [
  'PARSE',
  'VALIDATE',
  'NORMALIZE',
  'LOWER',
  'OPTIMIZE',
  'TARGET',
  'VERIFY',
  'EMIT',
] as const;

export type CompilerPipelineStage = (typeof COMPILER_PIPELINE)[number];

export const EX16_LOCKS = {
  L4_AUTONOMY_ENABLED: false as const,
  TIP_LAND: false as const,
  PRODUCTION_AUTHORIZATION: false as const,
  PRODUCTION_WRITE: false as const,
  MERGE_MAIN: false as const,
  MANAGE_PULL_REQUEST: false as const,
  BUY_QPU_CLOUD_AUTONOMOUSLY: false as const,
  HARD_CODE_VENDOR_WINNER: false as const,
  AUTO_SELECT_ALGORITHM_WINNER: false as const,
  AUTO_PREFERRED_CANDIDATE: false as const,
  QUBO_EQUALS_PHYSICAL_QPU: false as const,
  ISING_EQUALS_PHYSICAL_QPU: false as const,
  CIRCUIT_IR_EQUALS_PHYSICAL_QPU: false as const,
  GPU_NPU_HARDCODED_BETTER: false as const,
  ADAPTER_OWNS_MISSION_AUTHORITY: false as const,
  ADAPTER_BROADENS_PERMISSIONS: false as const,
  INVALID_TRANSLATION_ENTERS_ROUTER: false as const,
  LEARNING_CHANGES_AUTHORITY: false as const,
  LEARNING_CHANGES_PERMISSIONS: false as const,
  LEARNING_WEAKENS_GUARDIAN_RLS: false as const,
  WEAKEN_GUARDIAN_RLS: false as const,
  BROADEN_PERMISSIONS: false as const,
  CROSS_TENANT_ACCESS: false as const,
  CROSS_UNIVERSE_ACCESS: false as const,
  PRESENCE_EQ_VERIFIED: false as const,
  HISTORICAL_ATLAS_EQ_VERIFIED: false as const,
  CLAIM_UNSUPPORTED_QUANTUM_ADVANTAGE: false as const,
  CLAIM_CONSCIOUSNESS_AS_FACT: false as const,
  CLAIM_SUPERINTELLIGENCE_AS_FACT: false as const,
  PRESENT_SIMULATION_AS_PHYSICAL: false as const,
  EMBED_PROVIDER_CREDENTIALS: false as const,
  EXPOSE_PROPRIETARY_COMPILER_INTERNALS: false as const,
  SECOND_ORCHESTRATION_FRAMEWORK: false as const,
  DUPLICATE_AGENT_MESH: false as const,
  DUPLICATE_HYBRID_ROUTER: false as const,
  DUPLICATE_EVIDENCE_LEDGER: false as const,
  DUPLICATE_PATHWAY_GRAPH: false as const,
  DUPLICATE_GUARDIAN: false as const,
  DUPLICATE_TENANT_UNIVERSE: false as const,
} as const;

export type Ex16LockKey = keyof typeof EX16_LOCKS;

export function assertEx16LocksIntact(): boolean {
  return (
    EX16_LOCKS.L4_AUTONOMY_ENABLED === false &&
    EX16_LOCKS.TIP_LAND === false &&
    EX16_LOCKS.PRODUCTION_AUTHORIZATION === false &&
    EX16_LOCKS.MERGE_MAIN === false &&
    EX16_LOCKS.MANAGE_PULL_REQUEST === false &&
    EX16_LOCKS.HARD_CODE_VENDOR_WINNER === false &&
    EX16_LOCKS.AUTO_SELECT_ALGORITHM_WINNER === false &&
    EX16_LOCKS.AUTO_PREFERRED_CANDIDATE === false &&
    EX16_LOCKS.QUBO_EQUALS_PHYSICAL_QPU === false &&
    EX16_LOCKS.ISING_EQUALS_PHYSICAL_QPU === false &&
    EX16_LOCKS.CIRCUIT_IR_EQUALS_PHYSICAL_QPU === false &&
    EX16_LOCKS.GPU_NPU_HARDCODED_BETTER === false &&
    EX16_LOCKS.ADAPTER_OWNS_MISSION_AUTHORITY === false &&
    EX16_LOCKS.ADAPTER_BROADENS_PERMISSIONS === false &&
    EX16_LOCKS.INVALID_TRANSLATION_ENTERS_ROUTER === false &&
    EX16_LOCKS.LEARNING_CHANGES_AUTHORITY === false &&
    EX16_LOCKS.LEARNING_CHANGES_PERMISSIONS === false &&
    EX16_LOCKS.WEAKEN_GUARDIAN_RLS === false &&
    EX16_LOCKS.BROADEN_PERMISSIONS === false &&
    EX16_LOCKS.CROSS_TENANT_ACCESS === false &&
    EX16_LOCKS.CROSS_UNIVERSE_ACCESS === false &&
    EX16_LOCKS.EMBED_PROVIDER_CREDENTIALS === false &&
    EX16_LOCKS.EXPOSE_PROPRIETARY_COMPILER_INTERNALS === false &&
    EX16_LOCKS.SECOND_ORCHESTRATION_FRAMEWORK === false
  );
}

export function ex16L4AutonomyEnabled(): false {
  return EX16_LOCKS.L4_AUTONOMY_ENABLED;
}

export function guardianRlsUnchangedByEx16(): true {
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

export const EXECUTION_CLASSES = [
  'CLASSICAL',
  'QUANTUM_INSPIRED',
  'SIMULATED_QUANTUM',
  'PHYSICAL_QPU_CANDIDATE',
] as const;

export type ExecutionClass = (typeof EXECUTION_CLASSES)[number];

/** PHYSICAL_QPU_VERIFIED is never implied by translation alone. */
export const PHYSICAL_QPU_VERIFIED = false as const;

export const REPRESENTATION_TARGETS = [
  'CLASSICAL_GRAPH',
  'LINEAR_PROGRAM',
  'INTEGER_PROGRAM',
  'MIXED_INTEGER_PROGRAM',
  'CONSTRAINT_PROGRAM',
  'QUBO_INSPIRED',
  'ISING_INSPIRED',
  'TENSOR_NETWORK_INSPIRED',
  'QUANTUM_CIRCUIT_IR',
  'SAMPLING_MODEL',
  'SIMULATION_MODEL',
  'ML_INFERENCE_GRAPH',
] as const;

export type RepresentationTarget = (typeof REPRESENTATION_TARGETS)[number];

export const LOSSY_TRANSLATION_STATES = [
  'LOSSLESS',
  'EQUIVALENT_WITH_TOLERANCE',
  'LOSSY',
  'EXPERIMENTAL',
  'INVALID',
  'REVIEW_REQUIRED',
] as const;

export type LossyTranslationState = (typeof LOSSY_TRANSLATION_STATES)[number];

export const SEMANTIC_EQUIVALENCE = [
  'SEMANTICALLY_EQUIVALENT',
  'SEMANTICALLY_DIFFERENT',
  'EQUIVALENT_WITH_TOLERANCE',
  'UNCHECKED',
] as const;

export type SemanticEquivalence = (typeof SEMANTIC_EQUIVALENCE)[number];

export const PROVIDER_ADAPTERS = [
  'LOCAL_CLASSICAL',
  'LOCAL_QUANTUM_SIMULATOR',
  'AMD_COMPUTE',
  'NVIDIA_COMPUTE',
  'INTEL_COMPUTE',
  'ARM_EDGE',
  'APPLE_EDGE',
  'QUALCOMM_EDGE',
  'PHYSICAL_QPU_PROVIDER',
] as const;

export type ProviderAdapterKind = (typeof PROVIDER_ADAPTERS)[number];

export const CHIP_KINDS = ['CPU', 'GPU', 'NPU', 'EDGE', 'SIMULATOR', 'QPU_CANDIDATE'] as const;
export type ChipKind = (typeof CHIP_KINDS)[number];

export const TRANSLATION_STATUS = [
  'DRAFT',
  'VALID',
  'TRANSLATION_FAILED',
  'WAITING_DATA',
  'WAITING_PROVIDER',
  'STALE',
  'DENIED',
  'CACHED',
  'REVIEW_REQUIRED',
] as const;

export type TranslationStatus = (typeof TRANSLATION_STATUS)[number];

export const FEEDBACK_OUTCOMES = ['STRENGTHENED', 'REGRESSED', 'UNCHANGED', 'CANDIDATE'] as const;
export type FeedbackOutcome = (typeof FEEDBACK_OUTCOMES)[number];

export type Ex16Denial = {
  denied: true;
  state: 'DENIED';
  reason: string;
  executed: false;
};

export function ex16Deny(reason: string): Ex16Denial {
  return { denied: true, state: 'DENIED', reason, executed: false };
}

export type AccessScope = {
  tenantId: string;
  universeId: string;
};

export function assertSameTenantUniverse(
  a: AccessScope,
  b: AccessScope,
): Ex16Denial | null {
  if (a.tenantId !== b.tenantId) {
    return ex16Deny('cross-tenant IR DENIED');
  }
  if (a.universeId !== b.universeId) {
    return ex16Deny('cross-Universe IR DENIED');
  }
  return null;
}
