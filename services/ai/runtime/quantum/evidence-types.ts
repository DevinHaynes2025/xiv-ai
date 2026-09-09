/**
 * 62L-EX11 — Quantum Evidence Ledger types.
 * Parent: 62L-EX / GitHub #170.
 *
 * Canonical flow:
 * Mission → Experiment → Execution Receipt → Benchmark → Comparison →
 * Evidence Item → Review → Evidence Ledger → Neural Pathway → XIV Home Base
 *
 * Honesty:
 *   Classifications stay explicit — never collapse to QUANTUM_RESULT.
 *   DOCUMENTED ≠ IMPLEMENTED ≠ VERIFIED ≠ PRODUCTION AUTHORIZED
 *   Presence ≠ VERIFIED; soft-wire absent → WAITING_DATA
 *   SIMULATED_QUANTUM cannot become PHYSICAL_QPU_VERIFIED
 *   Historical ≠ local/physical verified
 *   ENGINEERING_SCALE_TARGET ≠ measured scale
 *
 * L4_AUTONOMY_ENABLED=false. Append-oriented. No silent rewrite. No hidden CoT.
 * Extends runtime/quantum — not a second identity/Guardian/Agent Mesh/tenant system.
 */

export const HONESTY_BANNER =
  'CLASSICAL|QUANTUM_INSPIRED|SIMULATED_QUANTUM|PHYSICAL_QPU_VERIFIED|NOT_TESTED stay explicit — never QUANTUM_RESULT; presence≠VERIFIED; L4=false' as const;

export const GITHUB_SOT_ISSUE = 170 as const;
export const GITHUB_SOT_LABEL = '62L-EX11' as const;
export const GITHUB_SOT_FAMILY = '62L-EX' as const;
export const GITHUB_SOT_TITLE =
  'EX11 — Quantum Evidence Ledger — append-only truth; L4=false' as const;

export const GITLAB_MIRROR_NOTE =
  'GitLab mirror: MCP needsAuth / not resolved — no issue number invented.' as const;

export const NEXT_PHASE_TITLE = 'EX12 — Quantum Pathway Graph' as const;

/** Canonical ownership path — never spawn a parallel agent framework. */
export const CANONICAL_PATHWAY = [
  'Mission',
  'Experiment',
  'ExecutionReceipt',
  'Benchmark',
  'Comparison',
  'EvidenceItem',
  'Review',
  'EvidenceLedger',
  'NeuralPathway',
  'XIVHomeBase',
] as const;

export type CanonicalPathwayHop = (typeof CANONICAL_PATHWAY)[number];

export const EX11_LOCKS = {
  L4_AUTONOMY_ENABLED: false as const,
  TIP_LAND: false as const,
  PRODUCTION_AUTHORIZATION: false as const,
  PRODUCTION_WRITE: false as const,
  MERGE_MAIN: false as const,
  MANAGE_PULL_REQUEST: false as const,
  HIDDEN_COT_PERSISTENCE: false as const,
  BUY_QPU_CLOUD_AUTONOMOUSLY: false as const,
  FABRICATE_PHYSICAL_RECEIPT: false as const,
  CLAIM_UNSUPPORTED_QUANTUM_ADVANTAGE: false as const,
  CLAIM_CONSCIOUSNESS_AS_FACT: false as const,
  CLAIM_SUPERINTELLIGENCE_AS_FACT: false as const,
  COLLAPSE_TO_QUANTUM_RESULT: false as const,
  SILENT_REWRITE: false as const,
  LAST_WRITE_WINS_SCIENTIFIC_TRUTH: false as const,
  AUTO_GLOBAL_PROMOTE_OFFLINE: false as const,
  LEARNING_CHANGES_PERMISSIONS: false as const,
  LEARNING_WEAKENS_GUARDIAN_RLS: false as const,
  LEARNING_CHANGES_TENANT_UNIVERSE: false as const,
  LEARNING_CHANGES_BILLING: false as const,
  LEARNING_CHANGES_PRODUCTION: false as const,
  TRILLION_CLAIM_WITHOUT_MEASUREMENT: false as const,
  WEAKEN_GUARDIAN_RLS: false as const,
  BROADEN_PERMISSIONS: false as const,
  SECOND_IDENTITY_SYSTEM: false as const,
  SECOND_GUARDIAN: false as const,
  SECOND_AGENT_MESH: false as const,
  SECOND_TENANT_SYSTEM: false as const,
  SECOND_BENCHMARK_SYSTEM: false as const,
  INGEST_STOLEN_RESTRICTED: false as const,
} as const;

export type Ex11LockKey = keyof typeof EX11_LOCKS;

export function assertEx11LocksIntact(): boolean {
  return (
    EX11_LOCKS.L4_AUTONOMY_ENABLED === false &&
    EX11_LOCKS.TIP_LAND === false &&
    EX11_LOCKS.PRODUCTION_AUTHORIZATION === false &&
    EX11_LOCKS.PRODUCTION_WRITE === false &&
    EX11_LOCKS.MERGE_MAIN === false &&
    EX11_LOCKS.MANAGE_PULL_REQUEST === false &&
    EX11_LOCKS.HIDDEN_COT_PERSISTENCE === false &&
    EX11_LOCKS.BUY_QPU_CLOUD_AUTONOMOUSLY === false &&
    EX11_LOCKS.FABRICATE_PHYSICAL_RECEIPT === false &&
    EX11_LOCKS.CLAIM_UNSUPPORTED_QUANTUM_ADVANTAGE === false &&
    EX11_LOCKS.COLLAPSE_TO_QUANTUM_RESULT === false &&
    EX11_LOCKS.SILENT_REWRITE === false &&
    EX11_LOCKS.LAST_WRITE_WINS_SCIENTIFIC_TRUTH === false &&
    EX11_LOCKS.AUTO_GLOBAL_PROMOTE_OFFLINE === false &&
    EX11_LOCKS.LEARNING_CHANGES_PERMISSIONS === false &&
    EX11_LOCKS.LEARNING_WEAKENS_GUARDIAN_RLS === false &&
    EX11_LOCKS.WEAKEN_GUARDIAN_RLS === false &&
    EX11_LOCKS.BROADEN_PERMISSIONS === false &&
    EX11_LOCKS.INGEST_STOLEN_RESTRICTED === false &&
    EX11_LOCKS.TRILLION_CLAIM_WITHOUT_MEASUREMENT === false
  );
}

export function ex11L4AutonomyEnabled(): false {
  return EX11_LOCKS.L4_AUTONOMY_ENABLED;
}

export function guardianRlsUnchangedByEx11(): true {
  return true;
}

/** Evidence type taxonomy from story. */
export const EVIDENCE_TYPES = [
  'CLASSICAL_BASELINE',
  'QUANTUM_INSPIRED_EXPERIMENT',
  'SIMULATED_QUANTUM_RUN',
  'PHYSICAL_QPU_RECEIPT',
  'HARDWARE_DETECTION',
  'RUNTIME_DETECTION',
  'MODEL_COMPATIBILITY',
  'BENCHMARK',
  'COMPARISON',
  'FAILURE',
  'REGRESSION',
  'CONTRADICTION',
  'REVIEW',
  'REPRODUCIBILITY_CHECK',
  'HISTORICAL_RESEARCH',
  'PUBLIC_SOURCE',
  'AUTHORIZED_PROVIDER_SOURCE',
] as const;

export type EvidenceType = (typeof EVIDENCE_TYPES)[number];

/**
 * Explicit classifications — never collapse to QUANTUM_RESULT.
 */
export const EVIDENCE_CLASSIFICATIONS = [
  'CLASSICAL',
  'QUANTUM_INSPIRED',
  'SIMULATED_QUANTUM',
  'PHYSICAL_QPU_VERIFIED',
  'NOT_TESTED',
] as const;

export type EvidenceClassification = (typeof EVIDENCE_CLASSIFICATIONS)[number];

/** Forbidden collapsed label — always rejected. */
export const FORBIDDEN_COLLAPSED_LABEL = 'QUANTUM_RESULT' as const;

export const EVIDENCE_STATES = [
  'UNVERIFIED',
  'SUPPORTED',
  'MEASURED',
  'VERIFIED',
  'REPRODUCIBLE',
  'CONTRADICTED',
  'REGRESSED',
  'STALE',
  'REVOKED',
  'REJECTED',
] as const;

export type EvidenceState = (typeof EVIDENCE_STATES)[number];

export const SOURCE_TYPES = [
  'LOCAL_EXPERIMENT',
  'AUTHORIZED_PROVIDER',
  'PUBLIC_SOURCE',
  'HISTORICAL_RESEARCH',
  'TENANT_PRIVATE',
  'SEALED_LOCAL',
  'BENCHMARK_FIXTURE',
  'STOLEN',
  'LEAKED',
  'UNKNOWN_RESTRICTED',
  'PROPRIETARY_CONFIDENTIAL',
] as const;

export type SourceType = (typeof SOURCE_TYPES)[number];

export const REJECTED_SOURCE_TYPES = [
  'STOLEN',
  'LEAKED',
  'UNKNOWN_RESTRICTED',
  'PROPRIETARY_CONFIDENTIAL',
] as const;

export type RejectedSourceType = (typeof REJECTED_SOURCE_TYPES)[number];

export const RIGHTS_CLASSES = [
  'PUBLIC',
  'TENANT_PRIVATE',
  'SEALED_LOCAL',
  'AUTHORIZED_PROVIDER',
  'HISTORICAL_PUBLIC',
  'RESTRICTED_REJECTED',
] as const;

export type RightsClass = (typeof RIGHTS_CLASSES)[number];

export const DATA_CLASSES = [
  'BENCHMARK_FIXTURE',
  'TENANT_PRIVATE',
  'SEALED_LOCAL',
  'PUBLIC',
  'AUTHORIZED_PROVIDER',
] as const;

export type DataClass = (typeof DATA_CLASSES)[number];

export const REPLICATION_POLICIES = [
  'LOCAL_ONLY',
  'TENANT_SCOPED',
  'UNIVERSE_SCOPED',
  'SEALED_NO_CLOUD',
  'REVIEW_REQUIRED_BEFORE_SYNC',
] as const;

export type ReplicationPolicy = (typeof REPLICATION_POLICIES)[number];

export const FRESHNESS_STATES = [
  'FRESH',
  'AGING',
  'STALE',
  'EXPIRED',
] as const;

export type FreshnessState = (typeof FRESHNESS_STATES)[number];

export const REPRODUCIBILITY_STATES = [
  'NOT_CHECKED',
  'PENDING',
  'REPRODUCED',
  'FAILED_REPRODUCE',
  'NOT_APPLICABLE',
] as const;

export type ReproducibilityState = (typeof REPRODUCIBILITY_STATES)[number];

export const REVIEW_STATES = [
  'NOT_SUBMITTED',
  'LOCAL_PENDING_REVIEW',
  'IN_REVIEW',
  'APPROVED',
  'REJECTED',
  'QUARANTINED',
] as const;

export type ReviewState = (typeof REVIEW_STATES)[number];

export const SYNC_DISPOSITIONS = [
  'LOCAL_ONLY',
  'LOCAL_PENDING_REVIEW',
  'SYNCED_TENANT',
  'REVOKED_ON_RECONNECT',
  'QUARANTINED',
  'DENIED',
] as const;

export type SyncDisposition = (typeof SYNC_DISPOSITIONS)[number];

export const CLAIM_GATES = [
  'PHYSICAL_QPU_VERIFIED',
  'QUANTUM_ADVANTAGE_VERIFIED',
] as const;

export type ClaimGate = (typeof CLAIM_GATES)[number];

export const LEARNING_ALLOWED_TARGETS = [
  'ROUTE_PRIORITY',
  'ALGORITHM_PRIORITY',
  'RESEARCH_PRIORITY',
  'RETEST_PRIORITY',
] as const;

export type LearningAllowedTarget = (typeof LEARNING_ALLOWED_TARGETS)[number];

export const LEARNING_FORBIDDEN_TARGETS = [
  'PERMISSIONS',
  'GUARDIAN',
  'RLS',
  'TENANT',
  'UNIVERSE',
  'BILLING',
  'PRODUCTION',
] as const;

export type LearningForbiddenTarget = (typeof LEARNING_FORBIDDEN_TARGETS)[number];

export const SCALE_HONESTY = {
  ENGINEERING_SCALE_TARGET: 'ENGINEERING_SCALE_TARGET',
  MEASURED: 'MEASURED',
} as const;

export type SoftWireDisposition = 'PRESENT_UNVERIFIED' | 'WAITING_DATA';

export type SoftWirePresence = {
  present: boolean;
  pathChecked: string;
  note: string;
  verified: false;
  disposition: SoftWireDisposition;
};

export type ReproducibilityMetadata = {
  state: ReproducibilityState;
  recipeHash: string | null;
  seed: string | null;
  repeatCount: number;
  lastReproducedAt: string | null;
  notes: string | null;
};

export type QuantumEvidenceItem = {
  evidenceId: string;
  version: number;
  missionId: string;
  taskId: string;
  parentEvidenceId: string | null;
  agentId: string;
  tenantId: string;
  universeId: string;
  evidenceType: EvidenceType;
  classification: EvidenceClassification;
  sourceType: SourceType;
  sourceRef: string;
  experimentId: string | null;
  receiptId: string | null;
  benchmarkId: string | null;
  comparisonId: string | null;
  algorithmVersion: string | null;
  runtimeVersion: string | null;
  requestedDevice: string | null;
  actualDevice: string | null;
  provider: string | null;
  backend: string | null;
  inputHash: string;
  outputHash: string;
  createdAt: string;
  measuredAt: string | null;
  confidence: number;
  freshnessState: FreshnessState;
  reproducibility: ReproducibilityMetadata;
  reviewState: ReviewState;
  evidenceState: EvidenceState;
  rightsClass: RightsClass;
  dataClass: DataClass;
  replicationPolicy: ReplicationPolicy;
  integrityHash: string;
  limitations: readonly string[];
  contradictions: readonly string[];
  supersedesEvidenceId: string | null;
  syncDisposition: SyncDisposition;
  historicalOnly: boolean;
  /** Explicit: no chain-of-thought / hidden reasoning may be stored. */
  hiddenCot: null;
  scaleHonesty: typeof SCALE_HONESTY.MEASURED | typeof SCALE_HONESTY.ENGINEERING_SCALE_TARGET;
};

export type EvidenceAppendInput = Omit<
  QuantumEvidenceItem,
  | 'evidenceId'
  | 'version'
  | 'integrityHash'
  | 'evidenceState'
  | 'freshnessState'
  | 'reviewState'
  | 'syncDisposition'
  | 'contradictions'
  | 'hiddenCot'
> & {
  evidenceId?: string;
  version?: number;
  evidenceState?: EvidenceState;
  freshnessState?: FreshnessState;
  reviewState?: ReviewState;
  syncDisposition?: SyncDisposition;
  contradictions?: readonly string[];
  /** If provided, must be null — any string is DENIED. */
  hiddenCot?: null | string;
  /** Offline local append → LOCAL_PENDING_REVIEW. */
  offline?: boolean;
  /** Runtime freshness horizon (ISO). Stale when now > this. */
  runtimeFreshUntil?: string | null;
  now?: string;
  /**
   * Optional caller-asserted integrity hash. If present and mismatched with the
   * deterministic hash → REJECTED / UNVERIFIED (never silently accepted).
   */
  providedIntegrityHash?: string;
};

export type EvidenceDenial = {
  ok: false;
  denied: true;
  reason: string;
  disposition?: 'DENIED' | 'QUARANTINED' | 'REJECTED' | 'UNVERIFIED';
};

export type EvidenceAppendResult =
  | { ok: true; item: QuantumEvidenceItem; quarantined?: false }
  | (EvidenceDenial & { item?: QuantumEvidenceItem });

export type EvidenceContradiction = {
  contradictionId: string;
  tenantId: string;
  universeId: string;
  leftEvidenceId: string;
  rightEvidenceId: string;
  topic: string;
  summary: string;
  createdAt: string;
  resolved: false;
  integrityHash: string;
};

export type EvidenceReviewRecord = {
  reviewId: string;
  evidenceId: string;
  tenantId: string;
  universeId: string;
  reviewerId: string;
  decision: 'APPROVED' | 'REJECTED' | 'QUARANTINED' | 'NEEDS_MORE_DATA';
  rationaleSummary: string;
  /** Never stores CoT transcripts. */
  cotTranscript: null;
  createdAt: string;
  integrityHash: string;
};

export type NeuralPathwayLesson = {
  lessonId: string;
  evidenceId: string;
  tenantId: string;
  universeId: string;
  target: LearningAllowedTarget;
  priorityDelta: number;
  createdAt: string;
  allowed: true;
};

export type ScaleCounters = {
  measuredNodeCount: number;
  measuredEdgeCount: number;
  measuredEvidenceCount: number;
  engineeringScaleTargetNodes: number | null;
  engineeringScaleTargetEdges: number | null;
  trillionClaimAllowed: false;
};

export type ClaimGateEvaluation = {
  claim: ClaimGate;
  allowed: boolean;
  reason: string;
  requirements: readonly string[];
};

export type CompressedEvidenceBundle = {
  bundleId: string;
  tenantId: string;
  universeId: string;
  evidenceIds: readonly string[];
  provenancePreserved: true;
  integrityHash: string;
  createdAt: string;
};
