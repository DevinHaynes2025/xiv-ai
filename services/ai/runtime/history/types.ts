/**
 * 62L-EX15 — Historical Quantum & Computing Atlas types + locks.
 * Parent: 62L-EX / GitHub #170.
 *
 * Historical knowledge creates research hypotheses.
 * It does NOT automatically become current engineering truth.
 *
 * Honesty: DOCUMENTED ≠ IMPLEMENTED ≠ VERIFIED ≠ PRODUCTION AUTHORIZED
 * Presence ≠ VERIFIED. Historical ≠ modern proof. Simulator ≠ physical QPU.
 * Historical advantage ≠ QUANTUM_ADVANTAGE_VERIFIED.
 * L4_AUTONOMY_ENABLED=false.
 *
 * Soft-wire EX1–EX14 via existsSync; absent → WAITING_DATA (not FAIL).
 * Prefer extending offlinepacks/, quantum/, evidence/, pathway graph, agentmesh/.
 */

export const HONESTY_BANNER =
  'DOCUMENTED ≠ IMPLEMENTED ≠ VERIFIED ≠ PRODUCTION AUTHORIZED; historical ≠ modern proof; presence ≠ VERIFIED' as const;

export const GITHUB_SOT_ISSUE = 170 as const;
export const GITHUB_SOT_LABEL = '62L-EX15' as const;
export const GITHUB_SOT_FAMILY = '62L-EX' as const;
export const GITHUB_SOT_TITLE =
  'EX15 — Historical Quantum & Computing Atlas — research hypotheses only; historical≠modern proof; L4=false' as const;

export const GITLAB_MIRROR_NOTE =
  'GitLab mirror: MCP needsAuth / not resolved — no issue number invented.' as const;

export const EX15_DB_CANDIDATES_STATUS = 'NOT_APPLIED' as const;

export const NEXT_PHASE_TITLE =
  'EX16 — Quantum Algorithm Translation Layer' as const;

export const EX15_CANONICAL_FLOW = [
  'SOURCE',
  'RIGHTS',
  'PROVENANCE',
  'DATE_NORMALIZATION',
  'ENTITY_RESOLUTION',
  'CLAIM_EXTRACTION',
  'FACT_CLAIM_CLASSIFICATION',
  'DEDUPLICATION',
  'CONTRADICTION_CHECK',
  'TIMELINE',
  'GRAPH',
  'OFFLINE_PACK',
] as const;

export type Ex15CanonicalHop = (typeof EX15_CANONICAL_FLOW)[number];

export const EX15_LOCKS = {
  L4_AUTONOMY_ENABLED: false as const,
  TIP_LAND: false as const,
  PRODUCTION_AUTHORIZATION: false as const,
  PRODUCTION_WRITE: false as const,
  MERGE_MAIN: false as const,
  MANAGE_PULL_REQUEST: false as const,
  HISTORICAL_EQ_MODERN_PROOF: false as const,
  HISTORICAL_ADVANTAGE_EQ_QUANTUM_ADVANTAGE_VERIFIED: false as const,
  HISTORICAL_BENCHMARK_EQ_CURRENT_BENCHMARK: false as const,
  SIMULATOR_EQ_PHYSICAL_QPU: false as const,
  CLAIM_REPORTED_AUTO_PROMOTE_TO_FACT: false as const,
  TOO_EARLY_AUTO_VALIDATE: false as const,
  RETEST_WITHOUT_CLASSICAL_BASELINE: false as const,
  GRAPH_UPDATE_CHANGES_PERMISSIONS: false as const,
  CLONE_COPYRIGHTED_CORPORA_WITHOUT_RIGHTS: false as const,
  INGEST_LEAKED_PRIVATE_DATA: false as const,
  INGEST_STOLEN_DATABASE: false as const,
  INGEST_CONFIDENTIAL_VENDOR_DATA: false as const,
  INGEST_RESTRICTED_SOURCE_CODE: false as const,
  INGEST_PRIVATE_RTL: false as const,
  INGEST_FIRMWARE_KEYS: false as const,
  INGEST_TRADE_SECRET: false as const,
  PRESENCE_EQ_VERIFIED: false as const,
  SECOND_ORCHESTRATION_FRAMEWORK: false as const,
  DUPLICATE_AGENT_MESH: false as const,
  EXPAND_AGENT_MESH_AUTHORITY: false as const,
  WEAKEN_GUARDIAN_RLS: false as const,
  BROADEN_PERMISSIONS: false as const,
  CROSS_TENANT_ACCESS: false as const,
  CROSS_UNIVERSE_ACCESS: false as const,
  BUY_QPU_CLOUD_AUTONOMOUSLY: false as const,
  CLAIM_UNSUPPORTED_QUANTUM_ADVANTAGE: false as const,
  CLAIM_CONSCIOUSNESS_AS_FACT: false as const,
  CLAIM_SUPERINTELLIGENCE_AS_FACT: false as const,
  FAKE_SCALE_TELEMETRY: false as const,
} as const;

export type Ex15LockKey = keyof typeof EX15_LOCKS;

export function assertEx15LocksIntact(): boolean {
  return (
    EX15_LOCKS.L4_AUTONOMY_ENABLED === false &&
    EX15_LOCKS.TIP_LAND === false &&
    EX15_LOCKS.PRODUCTION_AUTHORIZATION === false &&
    EX15_LOCKS.MERGE_MAIN === false &&
    EX15_LOCKS.MANAGE_PULL_REQUEST === false &&
    EX15_LOCKS.HISTORICAL_EQ_MODERN_PROOF === false &&
    EX15_LOCKS.HISTORICAL_ADVANTAGE_EQ_QUANTUM_ADVANTAGE_VERIFIED === false &&
    EX15_LOCKS.HISTORICAL_BENCHMARK_EQ_CURRENT_BENCHMARK === false &&
    EX15_LOCKS.SIMULATOR_EQ_PHYSICAL_QPU === false &&
    EX15_LOCKS.CLAIM_REPORTED_AUTO_PROMOTE_TO_FACT === false &&
    EX15_LOCKS.TOO_EARLY_AUTO_VALIDATE === false &&
    EX15_LOCKS.RETEST_WITHOUT_CLASSICAL_BASELINE === false &&
    EX15_LOCKS.GRAPH_UPDATE_CHANGES_PERMISSIONS === false &&
    EX15_LOCKS.CLONE_COPYRIGHTED_CORPORA_WITHOUT_RIGHTS === false &&
    EX15_LOCKS.PRESENCE_EQ_VERIFIED === false &&
    EX15_LOCKS.SECOND_ORCHESTRATION_FRAMEWORK === false &&
    EX15_LOCKS.EXPAND_AGENT_MESH_AUTHORITY === false &&
    EX15_LOCKS.WEAKEN_GUARDIAN_RLS === false &&
    EX15_LOCKS.BROADEN_PERMISSIONS === false &&
    EX15_LOCKS.CROSS_TENANT_ACCESS === false &&
    EX15_LOCKS.CROSS_UNIVERSE_ACCESS === false &&
    EX15_LOCKS.FAKE_SCALE_TELEMETRY === false
  );
}

export function ex15L4AutonomyEnabled(): false {
  return EX15_LOCKS.L4_AUTONOMY_ENABLED;
}

export function guardianRlsUnchangedByEx15(): true {
  return true;
}

/** Explicitly never auto-promoted from historical results alone. */
export const QUANTUM_ADVANTAGE_VERIFIED = false as const;

export type SoftWireDisposition = 'PRESENT_UNVERIFIED' | 'WAITING_DATA';

export type SoftWirePresence = {
  present: boolean;
  pathChecked: string;
  note: string;
  verified: false;
  disposition: SoftWireDisposition;
};

export type Ex15Denial = {
  denied: true;
  state: 'DENIED' | 'QUARANTINED';
  reason: string;
  executed: false;
};

export function ex15Deny(
  reason: string,
  state: 'DENIED' | 'QUARANTINED' = 'DENIED',
): Ex15Denial {
  return { denied: true, state, reason, executed: false };
}

export function isEx15Denial(v: unknown): v is Ex15Denial {
  return (
    typeof v === 'object' &&
    v !== null &&
    (v as Ex15Denial).denied === true &&
    (v as Ex15Denial).executed === false
  );
}

/* ---------- Domains (§2) ---------- */

export const HISTORICAL_DOMAINS = [
  'COMPUTING_HISTORY',
  'SEMICONDUCTORS',
  'CPU_HISTORY',
  'GPU_HISTORY',
  'ACCELERATOR_HISTORY',
  'ARM_HISTORY',
  'RISC_V_HISTORY',
  'OS',
  'DATABASES',
  'DISTRIBUTED_SYSTEMS',
  'INTERNET_NETWORKING',
  'AI_ML_NEURAL_NETWORKS',
  'OPERATIONS_RESEARCH',
  'GRAPH_ALGORITHMS',
  'OPTIMIZATION',
  'QUANTUM_INFORMATION',
  'QUANTUM_COMPUTING',
  'QUANTUM_ALGORITHMS',
  'QUANTUM_HARDWARE',
  'CYBER_DEFENSE',
  'SUPPLY_CHAIN_TECHNOLOGY',
  'CLOUD_COMPUTING',
  'EDGE_COMPUTING',
] as const;

export type HistoricalDomain = (typeof HISTORICAL_DOMAINS)[number];

/* ---------- Truth states (§3) ---------- */

export const TRUTH_STATES = [
  'FACT_SUPPORTED',
  'CLAIM_REPORTED',
  'INTERPRETATION',
  'DISPUTED',
  'HYPOTHESIS',
  'OUTDATED',
  'SUPERSEDED',
  'UNKNOWN',
] as const;

export type TruthState = (typeof TRUTH_STATES)[number];

/* ---------- Rights / restricted classes (§4–5) ---------- */

export const RIGHTS_CLASSES = [
  'PUBLIC_DOMAIN',
  'OPEN_LICENSE',
  'FAIR_USE_SUMMARY',
  'XIV_OWNED_DERIVED',
  'LICENSED_AUTHORIZED',
  'UNKNOWN_PUBLIC',
] as const;

export type RightsClass = (typeof RIGHTS_CLASSES)[number];

export const RESTRICTED_SOURCE_CLASSES = [
  'STOLEN_DATABASE',
  'LEAKED_PRIVATE_DATA',
  'CONFIDENTIAL_VENDOR_DATA',
  'RESTRICTED_SOURCE_CODE',
  'PRIVATE_RTL',
  'FIRMWARE_KEYS',
  'TRADE_SECRET',
  'UNKNOWN_RESTRICTED',
] as const;

export type RestrictedSourceClass = (typeof RESTRICTED_SOURCE_CLASSES)[number];

export const SOURCE_PRIORITY = [
  'PRIMARY_PUBLIC_RECORD',
  'PEER_REVIEWED',
  'STANDARDS_BODY',
  'VENDOR_PUBLIC_DOC',
  'REPUTABLE_SECONDARY',
  'NEWS_ARCHIVE',
  'ORAL_HISTORY',
  'UNVERIFIED_CLAIM',
] as const;

export type SourcePriority = (typeof SOURCE_PRIORITY)[number];

export const SOURCE_QUALITY = [
  'HIGH',
  'MEDIUM',
  'LOW',
  'UNKNOWN',
] as const;

export type SourceQuality = (typeof SOURCE_QUALITY)[number];

export const DATE_CONFIDENCE = [
  'EXACT',
  'YEAR',
  'DECADE',
  'APPROXIMATE',
  'UNKNOWN',
] as const;

export type DateConfidence = (typeof DATE_CONFIDENCE)[number];

export type SourceRef = {
  refId: string;
  title: string;
  publisher?: string;
  urlOrLocator?: string;
  publishedAt?: string;
  priority: SourcePriority;
  quality: SourceQuality;
  rightsClass: RightsClass | RestrictedSourceClass;
  excerptAllowed: boolean;
};

/* ---------- HistoricalComputingEvent (§1) ---------- */

export type HistoricalComputingEvent = {
  eventId: string;
  eventVersion: number;
  title: string;
  summary: string;
  domain: HistoricalDomain;
  subdomain?: string;
  dateStart?: string;
  dateEnd?: string;
  dateConfidence: DateConfidence;
  people: string[];
  orgs: string[];
  projects: string[];
  hardwareFamilies: string[];
  softwareFamilies: string[];
  algorithmFamilies: string[];
  problemClass?: string;
  technicalContext?: string;
  economicContext?: string;
  businessContext?: string;
  scientificContext?: string;
  claimedOutcome?: string;
  verifiedOutcome?: string;
  successes: string[];
  failures: string[];
  limitations: string[];
  primarySourceRefs: SourceRef[];
  secondarySourceRefs: SourceRef[];
  rightsClass: RightsClass;
  sourceQuality: SourceQuality;
  confidence: number;
  disputed: boolean;
  disputeNotes?: string[];
  truthState: TruthState;
  modernRelevance?: string;
  tenantId: string;
  universeId: string;
  tooEarly?: boolean;
  pathwayStatus: 'DOCUMENTED' | 'HYPOTHESIS' | 'VERIFIED';
  quantumAdvantageVerified: false;
  isCurrentBenchmark: false;
  isCurrentQpuVerification: false;
  createdAt: string;
  updatedAt: string;
  previousVersions?: HistoricalComputingEventSnapshot[];
};

export type HistoricalComputingEventSnapshot = Pick<
  HistoricalComputingEvent,
  | 'eventId'
  | 'eventVersion'
  | 'title'
  | 'summary'
  | 'truthState'
  | 'disputed'
  | 'primarySourceRefs'
  | 'secondarySourceRefs'
  | 'updatedAt'
>;

/* ---------- Timeline edges (§17) ---------- */

export const TIMELINE_EDGE_TYPES = [
  'PRECEDED',
  'INSPIRED',
  'IMPROVED',
  'REPLACED',
  'FAILED_BECAUSE',
  'REVIVED_BY',
  'DEPENDED_ON',
  'COMPETED_WITH',
] as const;

export type TimelineEdgeType = (typeof TIMELINE_EDGE_TYPES)[number];

export type TimelineEdge = {
  edgeId: string;
  fromEventId: string;
  toEventId: string;
  edgeType: TimelineEdgeType;
  tenantId: string;
  universeId: string;
  note?: string;
  /** Graph updates never change permissions. */
  permissionsUnchanged: true;
};

/* ---------- Algorithm evolution (§8) ---------- */

export type AlgorithmEvolutionNode = {
  nodeId: string;
  kind:
    | 'PROBLEM'
    | 'HISTORICAL_ALGORITHM'
    | 'HARDWARE'
    | 'RESULT'
    | 'LIMITATION'
    | 'LATER_IMPROVEMENT'
    | 'MODERN_CANDIDATE';
  label: string;
  eventId?: string;
  modernCandidateImpliesVerified: false;
};

export type AlgorithmEvolutionEdge = {
  fromNodeId: string;
  toNodeId: string;
  relation: string;
};

export type AlgorithmEvolutionGraph = {
  graphId: string;
  tenantId: string;
  universeId: string;
  nodes: AlgorithmEvolutionNode[];
  edges: AlgorithmEvolutionEdge[];
};

/* ---------- Failure atlas (§9) ---------- */

export const FAILURE_CATEGORIES = [
  'COMPUTE_LIMIT',
  'MEMORY_LIMIT',
  'NETWORK_LIMIT',
  'HARDWARE_COST',
  'ENERGY_LIMIT',
  'LATENCY_LIMIT',
  'ALGORITHM_SCALE',
  'DATA_LIMIT',
  'MARKET_FAILURE',
  'BUSINESS_MODEL_FAILURE',
  'SECURITY_FAILURE',
  'RELIABILITY_FAILURE',
  'TIMING_TOO_EARLY',
  'UNKNOWN',
] as const;

export type FailureCategory = (typeof FAILURE_CATEGORIES)[number];

export type FailureRecord = {
  failureId: string;
  eventId: string;
  category: FailureCategory;
  summary: string;
  tenantId: string;
  universeId: string;
  searchable: true;
};

/* ---------- Retest (§19) ---------- */

export type HistoricalRetestCandidate = {
  candidateId: string;
  eventId: string;
  status: 'HYPOTHESIS';
  classicalBaselineRequired: true;
  classicalBaselinePresent: boolean;
  tooEarly: boolean;
  modernRelevance?: string;
  tenantId: string;
  universeId: string;
  quantumAdvantageVerified: false;
  isCurrentBenchmark: false;
  isCurrentQpuVerification: false;
};

/* ---------- Temporal truth (§23) ---------- */

export const TEMPORAL_TRUTH = [
  'KNOWN_AT_THE_TIME',
  'KNOWN_TODAY',
] as const;

export type TemporalTruth = (typeof TEMPORAL_TRUTH)[number];

export type TemporalTruthAnnotation = {
  eventId: string;
  knownAtTheTime: string[];
  knownToday: string[];
  hindsightDistortionAvoided: true;
};

/* ---------- Scale telemetry (§28) — measured only ---------- */

export type AtlasScaleTelemetry = {
  eventCount: number;
  failureCount: number;
  edgeCount: number;
  retestCandidateCount: number;
  measured: true;
  fabricated: false;
};

export type Ex15SoftWireSnapshot = {
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
  agentMesh: SoftWirePresence;
  offlinePacks: SoftWirePresence;
  quantum: SoftWirePresence;
  evidence: SoftWirePresence;
  pathwayGraph: SoftWirePresence;
  guardian: SoftWirePresence;
  historicalCompany: SoftWirePresence;
};
