import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * 62L-BC — Quantum-Agentic Pathway Compiler + Cognitive Memory Hierarchy + Universe Fork Memory Fabric
 * Honesty: DOCUMENTED ≠ IMPLEMENTED ≠ VERIFIED ≠ PRODUCTION AUTHORIZED
 * No consciousness/sentience claims. Classical baseline required. QPU UNAVAILABLE until verified.
 */

export const QUANTUM_AGENTIC_CYCLE = [
  'working_dram',
  'persistent_nand',
  'tier_hot_warm_cold',
  'warehouse_store',
  'agent_memory',
  'neural_pathways',
  'memory_kind_route',
  'pressure_manage',
  'compress_consolidate',
  'checkpoint_crash',
  'universe_fork',
  'universe_compare',
  'merge_plan',
  'founder_sealed_route',
  'pathway_compile',
  'classical_baseline',
  'quantum_route_gate',
  'compete_evaluate',
  'metrics_calibrate',
  'evidence',
  'learning',
] as const;

export type BcHop = (typeof QUANTUM_AGENTIC_CYCLE)[number];

export type BcEvidenceState =
  | 'PASS'
  | 'FAIL'
  | 'UNAVAILABLE'
  | 'WAITING_DATA'
  | 'UNKNOWN'
  | 'NOT_TESTED'
  | 'DENIED'
  | 'DOCUMENTED'
  | 'IMPLEMENTED'
  | 'VERIFIED'
  | 'PRODUCTION_AUTHORIZED';

/** Cognitive memory hierarchy layers (architecture + typed runtime). */
export const MEMORY_HIERARCHY_LAYERS = [
  'dram_working',
  'nand_ssd_persistent',
  'hot_storage',
  'warm_storage',
  'cold_storage',
  'databases_knowledge_warehouse',
  'agent_memory',
  'neural_pathways',
  'isolated_parallel_universes',
] as const;

export type MemoryHierarchyLayer = (typeof MEMORY_HIERARCHY_LAYERS)[number];

/** Separated memory kinds. */
export const COGNITIVE_MEMORY_KINDS = ['episodic', 'semantic', 'procedural', 'team'] as const;
export type CognitiveMemoryKind = (typeof COGNITIVE_MEMORY_KINDS)[number];

export type MemoryTemperature = 'hot' | 'warm' | 'cold';

export type PathwayRouteKind =
  | 'classical_graph'
  | 'classical_greedy'
  | 'classical_dynamic_programming'
  | 'classical_heuristic'
  | 'quantum_simulator'
  | 'quantum_qpu';

export const BC_LOCKS = Object.freeze({
  L4_AUTONOMY_ENABLED: false as const,
  TIP_LAND: false as const,
  FOUNDER_IMPERSONATION: false as const,
  PRODUCTION_AUTHORIZATION: false as const,
  CONSCIOUSNESS_CLAIMED: false as const,
  SENTIENCE_CLAIMED: false as const,
  CLAIMS_QUANTUM_ADVANTAGE: false as const,
  QUANTUM_WITHOUT_CLASSICAL_BASELINE: false as const,
  CORRELATION_EQUALS_CAUSATION: false as const,
  UNIVERSE_SIM_IS_VERIFIED_FACT: false as const,
  MERGE_PLAN_IS_AUTO_MERGE: false as const,
  LABEL_IS_ACCESS: false as const,
  CEO_FOUNDER_SEALED_REPLICATING: false as const,
  TENANT_ISOLATION_BROKEN: false as const,
  GUARDIAN_RLS_WEAKENED: false as const,
  PERMISSION_EXPANSION: false as const,
  PROVIDERS_UNAVAILABLE_UNTIL_VERIFIED: true as const,
  CLASSICAL_BASELINE_REQUIRED: true as const,
});

export const FOUNDER_SEALED_MEMORY_DENY = 'FOUNDER_SEALED_MEMORY_ROUTING_DENY_BY_DEFAULT';
export const LABEL_ALONE_INSUFFICIENT = 'LABEL_ALONE_INSUFFICIENT';
export const MERGE_PLAN_NOT_AUTO_APPLY = 'MERGE_PLAN_IS_NOT_AUTO_MERGE_PRODUCTION';
export const QUANTUM_ADVANTAGE_DENIED = 'QUANTUM_ADVANTAGE_CLAIM_DENIED_WITHOUT_VERIFICATION';
export const QPU_UNAVAILABLE = 'QPU_OR_SIMULATOR_UNAVAILABLE_UNTIL_VERIFIED';
export const CLASSICAL_BASELINE_REQUIRED = 'CLASSICAL_BASELINE_REQUIRED';
export const CORRELATION_IS_NOT_CAUSATION =
  'Correlation is not causation. Competing mechanisms remain hypotheses until independently verified.';
export const UNIVERSE_SIM_NOT_FACT =
  'Universe simulation/fork is not a verified fact. Merge plan ≠ auto-merge production.';
export const NO_CONSCIOUSNESS =
  'XIV does not claim consciousness, sentience, or subjective experience. Metrics are correctness, cost, latency, and calibration only.';

export const NEXT_PHASE_TITLE =
  '62L-BD — XIV Cognitive Memory Chip Architecture + Agent Neural Bus + Universe-to-Universe Knowledge Router + Persistent Offline Brain Fabric';

export type PredecessorId = 'BA' | 'AZ' | 'AY' | 'AX' | 'AW' | 'AV' | 'AS' | 'AR' | 'AF' | 'X';

const HERE = dirname(fileURLToPath(import.meta.url));

const PREDECESSOR_MODULES: Record<PredecessorId, string> = {
  BA: 'neural-database-runtime.ts',
  AZ: 'enterprise-nervous-runtime.ts',
  AY: 'growth-media-runtime.ts',
  AX: 'sovereign-sealed-runtime.ts',
  AW: 'business-os-runtime.ts',
  AV: 'universal-runtime.ts',
  AS: 'cognitive-compiler-runtime.ts',
  AR: 'distributed-memory-runtime.ts',
  AF: 'universe-os-kernel.ts',
  X: 'memory-cortex.ts',
};

const PREDECESSOR_REPORTS: Record<PredecessorId, string> = {
  BA: '62L_BA_NEURAL_DATABASE_OS_WAREHOUSE_API_REPORT.md',
  AZ: '62L_AZ_ENTERPRISE_NERVOUS_DIGITAL_TWIN_FABRIC_REPORT.md',
  AY: '62L_AY_GROWTH_MEDIA_ONBOARDING_SUPERBRAIN_REFINERY_REPORT.md',
  AX: '62L_AX_SOVEREIGN_SEALED_FABRIC_UX_TRUST_REPORT.md',
  AW: '62L_AW_UNIVERSAL_APP_RUNTIME_BUSINESS_OS_REPORT.md',
  AV: '62L_AV_UNIVERSAL_RUNTIME_ALGORITHM_FOUNDRY_CFO_REPORT.md',
  AS: '62L_AS_COGNITIVE_COMPILER_MATH_REASONING_FABRIC_REPORT.md',
  AR: '62L_AR_DISTRIBUTED_MEMORY_NEURAL_HIGHWAY_COMPILER_REPORT.md',
  AF: '62L_AF_UNIVERSE_OS_KERNEL_MEMORY_REPLICATION_REPORT.md',
  X: '62L_X_MEMORY_CORTEX_WORLD_KNOWLEDGE_REPORT.md',
};

export function predecessorModuleState(id: PredecessorId): 'AVAILABLE' | 'WAITING_DATA' {
  return existsSync(join(HERE, PREDECESSOR_MODULES[id])) ? 'AVAILABLE' : 'WAITING_DATA';
}

export function predecessorReportState(cwd: string, id: PredecessorId): BcEvidenceState {
  return existsSync(join(cwd, 'docs', 'operations', PREDECESSOR_REPORTS[id])) ? 'PASS' : 'WAITING_DATA';
}

export function predecessorMap(
  cwd = process.cwd(),
): Record<PredecessorId, { module: 'AVAILABLE' | 'WAITING_DATA'; report: BcEvidenceState }> {
  const ids = Object.keys(PREDECESSOR_MODULES) as PredecessorId[];
  return Object.fromEntries(
    ids.map((id) => [id, { module: predecessorModuleState(id), report: predecessorReportState(cwd, id) }]),
  ) as Record<PredecessorId, { module: 'AVAILABLE' | 'WAITING_DATA'; report: BcEvidenceState }>;
}

export type BcHopRecord = {
  hop: BcHop;
  state: BcEvidenceState;
  summary: string;
  at: string;
};

export type PathwayMetrics = {
  correctness: number;
  cost: number;
  latencyMs: number;
  calibration: number;
  claimsConsciousness: false;
  claimsSentience: false;
  claimsQuantumAdvantage: false;
};

export type BcActorKind = 'ceo_principal' | 'ordinary_agent' | 'label_only_principal' | 'tool';

export type BcActor = {
  kind: BcActorKind;
  id: string;
  tenantId: string;
  universeId: string;
  role?: string;
  impersonatingFounder?: boolean;
  labelOnly?: boolean;
};
