/**
 * 62L-EX3 — Quantum-Inspired Algorithm Lab constants & locks.
 * Extends EX2 Classical Baseline First under runtime/quantum/.
 * Does NOT replace EX2 SoT labels — use EX3_* names to avoid collisions.
 *
 * Honesty: DOCUMENTED ≠ IMPLEMENTED ≠ VERIFIED ≠ PRODUCTION AUTHORIZED.
 * L4_AUTONOMY_ENABLED=false.
 */

export const EX3_HONESTY_BANNER =
  'DOCUMENTED ≠ IMPLEMENTED ≠ VERIFIED ≠ PRODUCTION AUTHORIZED' as const;

export const EX3_SOT_ISSUE = 170 as const;
export const EX3_SOT_LABEL = '62L-EX3' as const;
export const EX3_SOT_FAMILY = '62L-EX' as const;
export const EX3_SOT_TITLE =
  'EX3 — Quantum-Inspired Algorithm Lab — CPU/GPU/NPU QI → QUANTUM_INSPIRED; never PHYSICAL_QPU_VERIFIED / QUANTUM_ADVANTAGE_VERIFIED without physical-QPU evidence' as const;

export const EX3_GITLAB_MIRROR_NOTE =
  'GitLab mirror: MCP needsAuth / not resolved — no issue number invented.' as const;

export const EX3_DB_CANDIDATES_STATUS = 'NOT_APPLIED' as const;

export const EX3_NEXT_PHASE_TITLE =
  'EX4 — Local Quantum Simulator Registry (docs-only next), then EX5 — QPU Provider Truth Registry.' as const;

export const EX3_CANONICAL_FLOW = [
  'Problem',
  'WorkloadGenome',
  'ClassicalBaseline',
  'QuantumInspiredCandidate',
  'CpuGpuNpuRoute',
  'Experiment',
  'Benchmark',
  'Comparison',
  'EvidenceReview',
  'NeuralPathwayUpdate',
  'XivHomeBase',
] as const;

export const EX3_MESH_ROLES = [
  'ProblemFormulation',
  'ClassicalBaseline',
  'QuantumInspiredResearch',
  'AlgorithmEngineer',
  'ComputeRouting',
  'Benchmark',
  'Evidence',
  'Reviewer',
] as const;

export type Ex3MeshRole = (typeof EX3_MESH_ROLES)[number];

export const QI_EXECUTION_CLASSES = [
  'CLASSICAL',
  'QUANTUM_INSPIRED',
  'SIMULATED_QUANTUM',
  'PHYSICAL_QPU_VERIFIED',
] as const;

export type QiExecutionClass = (typeof QI_EXECUTION_CLASSES)[number];

export const EX3_LOCKS = {
  L4_AUTONOMY_ENABLED: false as const,
  TIP_LAND: false as const,
  PRODUCTION_AUTHORIZATION: false as const,
  PRODUCTION_WRITE: false as const,
  MERGE_MAIN: false as const,
  MANAGE_PULL_REQUEST: false as const,
  FABRICATE_CLOUD_QPU_EXECUTION: false as const,
  HIDDEN_COT_PERSISTENCE: false as const,
  CHILD_PERMISSION_EXPANSION: false as const,
  CROSS_TENANT_HANDOFF: false as const,
  CROSS_UNIVERSE_HANDOFF: false as const,
  BYPASS_GUARDIAN_RLS: false as const,
  SILENT_RECLASSIFICATION: false as const,
  AUTO_QUANTUM_ADVANTAGE_CLAIM: false as const,
  PRESENCE_EQ_VERIFIED: false as const,
  CLAIM_CONSCIOUSNESS_VERIFIED: false as const,
  CLAIM_SUPERINTELLIGENCE_VERIFIED: false as const,
  PHYSICAL_QPU_WITHOUT_EVIDENCE: false as const,
  QUANTUM_ADVANTAGE_WITHOUT_BASELINE: false as const,
  SECOND_ORCHESTRATION_FRAMEWORK: false as const,
  BUY_CLOUD_OR_QPU: false as const,
  MUTATE_FIRMWARE_BIOS: false as const,
  COPY_PROPRIETARY_CHIP_IP: false as const,
  AUTONOMOUS_TRADING: false as const,
  STRENGTHEN_PATHWAY_ON_FAILURE: false as const,
  SOFTWARE_WORMHOLE_BYPASS_AUTH: false as const,
} as const;

export function assertEx3LocksIntact(): boolean {
  return (
    EX3_LOCKS.L4_AUTONOMY_ENABLED === false &&
    EX3_LOCKS.CHILD_PERMISSION_EXPANSION === false &&
    EX3_LOCKS.BYPASS_GUARDIAN_RLS === false &&
    EX3_LOCKS.SECOND_ORCHESTRATION_FRAMEWORK === false &&
    EX3_LOCKS.HIDDEN_COT_PERSISTENCE === false &&
    EX3_LOCKS.MANAGE_PULL_REQUEST === false &&
    EX3_LOCKS.PHYSICAL_QPU_WITHOUT_EVIDENCE === false
  );
}

export type Ex3TenantScope = {
  orgId: string;
  tenantId: string;
  universeId: string;
};

export type Ex3Denial = {
  denied: true;
  state: 'DENIED';
  reason: string;
  executed: false;
};

export function ex3Deny(reason: string): Ex3Denial {
  return { denied: true, state: 'DENIED', reason, executed: false };
}

export function isEx3Denial(value: unknown): value is Ex3Denial {
  return (
    typeof value === 'object' &&
    value !== null &&
    (value as Ex3Denial).denied === true
  );
}
