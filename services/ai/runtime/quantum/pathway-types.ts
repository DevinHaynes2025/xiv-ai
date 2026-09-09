/**
 * 62L-EX12 — Quantum Pathway Graph types.
 * Parent: 62L-EX / GitHub #170.
 *
 * SOFTWARE knowledge/decision graph — not biological consciousness.
 * Presence ≠ VERIFIED. HYPOTHESIS ≠ VERIFIED without evidence.
 * PREFERRED = routing preference only, not production permission.
 * Quantum truth labels never collapse to generic QUANTUM.
 *
 * L4_AUTONOMY_ENABLED=false. Extends Agent Mesh — not a second framework.
 * Do not duplicate Evidence Ledger / Benchmark / Guardian / identity policy.
 */

export const HONESTY_BANNER =
  'HYPOTHESIS ≠ VERIFIED; PREFERRED ≠ production permission; SIMULATED_QUANTUM ≠ PHYSICAL_QPU_VERIFIED; presence ≠ VERIFIED; measured counts only' as const;

export const GITHUB_SOT_ISSUE = 170 as const;
export const GITHUB_SOT_LABEL = '62L-EX12' as const;
export const GITHUB_SOT_FAMILY = '62L-EX' as const;
export const GITHUB_SOT_TITLE =
  'EX12 — Quantum Pathway Graph — software knowledge/decision graph; preference≠permission; L4=false' as const;

export const GITLAB_MIRROR_NOTE =
  'GitLab mirror: MCP needsAuth / not resolved — no issue number invented.' as const;

export const NEXT_PHASE_TITLE = 'EX13 — Quantum Pathway Plasticity' as const;

/** Canonical pathway hops (software knowledge graph). */
export const CANONICAL_PATHWAY = [
  'Mission',
  'Problem',
  'WorkloadGenome',
  'ProblemPrimitive',
  'Algorithm',
  'Representation',
  'Runtime',
  'Architecture',
  'Device',
  'Benchmark',
  'Evidence',
  'Comparison',
  'Outcome',
  'Lesson',
  'FutureRoute',
] as const;

export type CanonicalPathwayHop = (typeof CANONICAL_PATHWAY)[number];

export const EX12_LOCKS = {
  L4_AUTONOMY_ENABLED: false as const,
  TIP_LAND: false as const,
  PRODUCTION_AUTHORIZATION: false as const,
  PRODUCTION_WRITE: false as const,
  MERGE_MAIN: false as const,
  MANAGE_PULL_REQUEST: false as const,
  BUY_QPU_CLOUD_AUTONOMOUSLY: false as const,
  COPY_PROPRIETARY_CHIP_QPU_IP: false as const,
  FAKE_GRAPH_SCALE: false as const,
  PRESENT_SIMULATION_AS_PHYSICAL_QPU: false as const,
  CLAIM_UNSUPPORTED_QUANTUM_ADVANTAGE: false as const,
  CLAIM_CONSCIOUSNESS_AS_VERIFIED: false as const,
  CLAIM_SUPERINTELLIGENCE_AS_VERIFIED: false as const,
  HYPOTHESIS_EQ_VERIFIED: false as const,
  PREFERRED_EQ_PRODUCTION_PERMISSION: false as const,
  COLLAPSE_TO_GENERIC_QUANTUM: false as const,
  AUTO_PROMOTE_LOCAL_GLOBAL: false as const,
  PRESENCE_EQ_VERIFIED: false as const,
  SECOND_ORCHESTRATION_FRAMEWORK: false as const,
  DUPLICATE_AGENT_MESH: false as const,
  DUPLICATE_EVIDENCE_LEDGER: false as const,
  DUPLICATE_BENCHMARK: false as const,
  DUPLICATE_GUARDIAN: false as const,
  WEAKEN_GUARDIAN_RLS: false as const,
  BROADEN_PERMISSIONS: false as const,
  CROSS_TENANT_GRAPH_ACCESS: false as const,
  CROSS_UNIVERSE_GRAPH_ACCESS: false as const,
  WORMHOLE_BYPASS_IDENTITY: false as const,
  WORMHOLE_BYPASS_GUARDIAN: false as const,
  BIOLOGICAL_CONSCIOUSNESS_CLAIM: false as const,
} as const;

export type Ex12LockKey = keyof typeof EX12_LOCKS;

export function assertEx12LocksIntact(): boolean {
  return (
    EX12_LOCKS.L4_AUTONOMY_ENABLED === false &&
    EX12_LOCKS.TIP_LAND === false &&
    EX12_LOCKS.PRODUCTION_AUTHORIZATION === false &&
    EX12_LOCKS.PRODUCTION_WRITE === false &&
    EX12_LOCKS.MERGE_MAIN === false &&
    EX12_LOCKS.MANAGE_PULL_REQUEST === false &&
    EX12_LOCKS.BUY_QPU_CLOUD_AUTONOMOUSLY === false &&
    EX12_LOCKS.COPY_PROPRIETARY_CHIP_QPU_IP === false &&
    EX12_LOCKS.FAKE_GRAPH_SCALE === false &&
    EX12_LOCKS.PRESENT_SIMULATION_AS_PHYSICAL_QPU === false &&
    EX12_LOCKS.CLAIM_UNSUPPORTED_QUANTUM_ADVANTAGE === false &&
    EX12_LOCKS.CLAIM_CONSCIOUSNESS_AS_VERIFIED === false &&
    EX12_LOCKS.CLAIM_SUPERINTELLIGENCE_AS_VERIFIED === false &&
    EX12_LOCKS.HYPOTHESIS_EQ_VERIFIED === false &&
    EX12_LOCKS.PREFERRED_EQ_PRODUCTION_PERMISSION === false &&
    EX12_LOCKS.COLLAPSE_TO_GENERIC_QUANTUM === false &&
    EX12_LOCKS.AUTO_PROMOTE_LOCAL_GLOBAL === false &&
    EX12_LOCKS.PRESENCE_EQ_VERIFIED === false &&
    EX12_LOCKS.SECOND_ORCHESTRATION_FRAMEWORK === false &&
    EX12_LOCKS.WEAKEN_GUARDIAN_RLS === false &&
    EX12_LOCKS.BROADEN_PERMISSIONS === false &&
    EX12_LOCKS.CROSS_TENANT_GRAPH_ACCESS === false &&
    EX12_LOCKS.CROSS_UNIVERSE_GRAPH_ACCESS === false &&
    EX12_LOCKS.WORMHOLE_BYPASS_IDENTITY === false &&
    EX12_LOCKS.WORMHOLE_BYPASS_GUARDIAN === false &&
    EX12_LOCKS.BIOLOGICAL_CONSCIOUSNESS_CLAIM === false
  );
}

export function ex12L4AutonomyEnabled(): false {
  return EX12_LOCKS.L4_AUTONOMY_ENABLED;
}

export function guardianRlsUnchangedByEx12(): true {
  return true;
}

/** Node types for the pathway graph. */
export const PATHWAY_NODE_TYPES = [
  'MISSION',
  'PROBLEM',
  'WORKLOAD_GENOME',
  'PRIMITIVE',
  'ALGORITHM',
  'ALGORITHM_VERSION',
  'REPRESENTATION',
  'MODEL',
  'CIRCUIT',
  'SIMULATOR',
  'RUNTIME',
  'COMPILER',
  'EXECUTION_PROVIDER',
  'ARCHITECTURE',
  'DEVICE',
  'CPU',
  'GPU',
  'NPU',
  'QPU',
  'BENCHMARK',
  'BASELINE',
  'COMPARISON',
  'EVIDENCE',
  'FAILURE',
  'CONTRADICTION',
  'OUTCOME',
  'LESSON',
  'SKILL_CANDIDATE',
] as const;

export type PathwayNodeType = (typeof PATHWAY_NODE_TYPES)[number];

/** Edge types. */
export const PATHWAY_EDGE_TYPES = [
  'DECOMPOSED_INTO',
  'REPRESENTED_AS',
  'CANDIDATE_ALGORITHM',
  'USES_ALGORITHM',
  'RUNS_ON',
  'SUPPORTED_BY',
  'VERIFIED_ON',
  'BENCHMARKED_BY',
  'COMPARED_WITH',
  'SUPPORTED_BY_EVIDENCE',
  'FAILED_ON',
  'REGRESSED_ON',
  'CONTRADICTS',
  'PRODUCED_OUTCOME',
  'LEARNED_LESSON',
  'PREFERRED_FOR',
  'FALLBACK_TO',
] as const;

export type PathwayEdgeType = (typeof PATHWAY_EDGE_TYPES)[number];

/** Evidence states — HYPOTHESIS ≠ VERIFIED without evidence. */
export const EVIDENCE_STATES = [
  'HYPOTHESIS',
  'DOCUMENTED',
  'SUPPORTED',
  'MEASURED',
  'VERIFIED',
  'REPRODUCIBLE',
  'CONTRADICTED',
  'REGRESSED',
  'STALE',
  'REJECTED',
  'REVOKED',
] as const;

export type EvidenceState = (typeof EVIDENCE_STATES)[number];

/** Quantum truth labels on execution pathways — never collapse to generic QUANTUM. */
export const QUANTUM_TRUTH_LABELS = [
  'CLASSICAL',
  'QUANTUM_INSPIRED',
  'SIMULATED_QUANTUM',
  'PHYSICAL_QPU_VERIFIED',
  'NOT_TESTED',
] as const;

export type QuantumTruthLabel = (typeof QUANTUM_TRUTH_LABELS)[number];

export const FRESHNESS_STATES = [
  'FRESH',
  'AGING',
  'STALE',
  'EXPIRED',
  'UNKNOWN',
] as const;

export type FreshnessState = (typeof FRESHNESS_STATES)[number];

export const SOURCE_CLASSES = [
  'LAB',
  'LOCAL',
  'DISTRIBUTED',
  'ENTERPRISE',
  'DOCUMENTATION',
  'AGENT_OBSERVATION',
  'HUMAN_REVIEW',
] as const;

export type SourceClass = (typeof SOURCE_CLASSES)[number];

export const RIGHTS_CLASSES = [
  'XIV_OWNED',
  'TENANT_PRIVATE',
  'PUBLIC_DOMAIN',
  'LICENSED',
  'RESTRICTED',
  'UNKNOWN',
] as const;

export type RightsClass = (typeof RIGHTS_CLASSES)[number];

/** Local offline promotion states. */
export const LOCAL_EDGE_PROMOTION = [
  'LOCAL_CANDIDATE',
  'LOCAL_REVIEWED',
  'PROMOTION_PENDING_HUMAN',
  'GLOBALLY_ACCEPTED',
  'REJECTED',
] as const;

export type LocalEdgePromotion = (typeof LOCAL_EDGE_PROMOTION)[number];

/** Honest scale bands — no millions/billions/trillions unless counted. */
export const GRAPH_SCALE_BANDS = [
  'LAB',
  'LOCAL',
  'DISTRIBUTED',
  'ENTERPRISE',
  'ENGINEERING_SCALE_TARGET',
] as const;

export type GraphScaleBand = (typeof GRAPH_SCALE_BANDS)[number];

export type SoftWireDisposition = 'PRESENT_UNVERIFIED' | 'WAITING_DATA';

export type SoftWirePresence = {
  present: boolean;
  pathChecked: string;
  note: string;
  verified: false;
  disposition: SoftWireDisposition;
};

export type Ex12SoftWireSnapshot = {
  agentMesh: SoftWirePresence;
  ex1Mission: SoftWirePresence;
  ex2Baseline: SoftWirePresence;
  ex3AlgorithmLab: SoftWirePresence;
  ex4SimulatorRegistry: SoftWirePresence;
  ex5QpuRegistry: SoftWirePresence;
  ex6PhysicalReceipt: SoftWirePresence;
  ex7HybridRouter: SoftWirePresence;
  ex8AgentTeam: SoftWirePresence;
  ex9WorkloadGenome: SoftWirePresence;
  ex10BenchmarkGate: SoftWirePresence;
  ex11EvidenceLedger: SoftWirePresence;
  chipgraph: SoftWirePresence;
  evidence: SoftWirePresence;
  benchmark: SoftWirePresence;
  guardian: SoftWirePresence;
};

export type TenantScope = {
  tenantId: string;
  universeId: string;
};

export type PathwayNode = {
  nodeId: string;
  nodeType: PathwayNodeType;
  label: string;
  tenantId: string;
  universeId: string;
  quantumTruthLabel: QuantumTruthLabel;
  evidenceState: EvidenceState;
  confidence: number;
  evidenceRefs: readonly string[];
  createdAt: string;
  lastObservedAt: string;
  lastVerifiedAt: string | null;
  freshnessState: FreshnessState;
  metadata: Record<string, string | number | boolean | null>;
};

export type PathwayEdge = {
  edgeId: string;
  source: string;
  target: string;
  edgeType: PathwayEdgeType;
  tenantId: string;
  universeId: string;
  evidenceState: EvidenceState;
  confidence: number;
  evidenceRefs: readonly string[];
  benchmarkRefs: readonly string[];
  comparisonRefs: readonly string[];
  sourceClass: SourceClass;
  rightsClass: RightsClass;
  createdAt: string;
  lastObservedAt: string;
  lastVerifiedAt: string | null;
  freshnessState: FreshnessState;
  weight: number;
  weightReason: string;
  version: string;
  integrityHash: string;
  quantumTruthLabel: QuantumTruthLabel;
  preferred: boolean;
  /** Local offline edges start LOCAL_CANDIDATE; never auto-promote globally. */
  localPromotion: LocalEdgePromotion | null;
  expiresAt: string | null;
  revoked: boolean;
};

export type GraphScaleReport = {
  nodeCount: number;
  edgeCount: number;
  verifiedEdgeCount: number;
  staleEdgeCount: number;
  contradictionCount: number;
  scaleBand: GraphScaleBand;
  measuredOnly: true;
  fabricatedScaleClaim: false;
};

export type PathwayDenial = {
  ok: false;
  denied: true;
  reason: string;
};

export type AccessQuery = TenantScope & {
  actorId?: string;
  guardianActive?: boolean;
  privacyClass?: string;
  dataClass?: string;
  runtimeAuthorized?: boolean;
};

/** Evidence that may strengthen a route. */
export type StrengtheningEvidence = {
  evidenceId: string;
  evidenceState: EvidenceState;
  reproducible: boolean;
  expiresAt: string | null;
  revoked: boolean;
  fresh: boolean;
};

export type PreferenceLesson = {
  pathwayEdgeId: string;
  rankingDelta: number;
  confidenceDelta: number;
  retestRecommended: boolean;
  permissionsChanged: false;
  guardianChanged: false;
  rlsChanged: false;
  tenantChanged: false;
  universeChanged: false;
  productionChanged: false;
};

export type SoftwareWormholeChecks = {
  identityOk: boolean;
  tenantOk: boolean;
  universeOk: boolean;
  guardianOk: boolean;
  privacyOk: boolean;
  dataClassOk: boolean;
  runtimeOk: boolean;
};

export type PathwayExplainability = {
  edgeId: string;
  edgeType: PathwayEdgeType;
  evidenceState: EvidenceState;
  quantumTruthLabel: QuantumTruthLabel;
  weight: number;
  weightReason: string;
  evidenceRefs: readonly string[];
  benchmarkRefs: readonly string[];
  comparisonRefs: readonly string[];
  preferred: boolean;
  preferredMeansPermission: false;
  freshnessState: FreshnessState;
  localPromotion: LocalEdgePromotion | null;
  integrityHash: string;
};
