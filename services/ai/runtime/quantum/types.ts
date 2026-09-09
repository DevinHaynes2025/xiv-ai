/**
 * 62L-EX6 — Physical QPU Execution Receipt types.
 * Parent: 62L-EX / GitHub #170.
 *
 * Honesty:
 *   COMPLETED ≠ VERIFIED
 *   SIMULATOR / mock ≠ PHYSICAL_QPU_VERIFIED
 *   physical execution ≠ quantum advantage
 *   presence ≠ VERIFIED
 *   DOCUMENTED ≠ IMPLEMENTED ≠ VERIFIED ≠ PRODUCTION AUTHORIZED
 *
 * L4_AUTONOMY_ENABLED=false. Credentials never in receipts.
 * Extends Agent Mesh + Home Base — not a second orchestration framework.
 */

export const HONESTY_BANNER =
  'COMPLETED ≠ VERIFIED; SIMULATOR/mock ≠ PHYSICAL_QPU_VERIFIED; physical ≠ quantum advantage' as const;

export const GITHUB_SOT_ISSUE = 170 as const;
export const GITHUB_SOT_LABEL = '62L-EX6' as const;
export const GITHUB_SOT_FAMILY = '62L-EX' as const;
export const GITHUB_SOT_TITLE =
  'EX6 — Physical QPU Execution Receipt — governed physical evidence; L4=false' as const;

export const GITLAB_MIRROR_NOTE =
  'GitLab mirror: MCP needsAuth / not resolved — no issue number invented.' as const;

export const NEXT_PHASE_TITLE = 'EX7 — Hybrid Classical/Quantum Router' as const;

/** Canonical ownership path — never spawn a parallel agent framework. */
export const CANONICAL_PATHWAY = [
  'HomeBase',
  'QuantumMission',
  'ClassicalBaseline',
  'QpuRegistry',
  'AuthorizationGate',
  'PhysicalBackendCandidate',
  'GovernedSubmission',
  'ProviderJob',
  'ProviderResult',
  'PhysicalQpuReceipt',
  'EvidenceReview',
  'BenchmarkComparison',
  'NeuralPathway',
  'HomeBase',
] as const;

export type CanonicalPathwayHop = (typeof CANONICAL_PATHWAY)[number];

export const EX6_LOCKS = {
  L4_AUTONOMY_ENABLED: false as const,
  TIP_LAND: false as const,
  PRODUCTION_AUTHORIZATION: false as const,
  PRODUCTION_WRITE: false as const,
  MERGE_MAIN: false as const,
  MANAGE_PULL_REQUEST: false as const,
  STORE_CREDENTIALS_IN_RECEIPTS: false as const,
  BUY_QPU_CLOUD_AUTONOMOUSLY: false as const,
  FABRICATE_PHYSICAL_RECEIPT: false as const,
  CLAIM_PHYSICAL_FROM_SIMULATOR: false as const,
  CLAIM_PHYSICAL_FROM_MOCK: false as const,
  CLAIM_UNSUPPORTED_QUANTUM_ADVANTAGE: false as const,
  CLAIM_CONSCIOUSNESS_AS_FACT: false as const,
  CLAIM_SUPERINTELLIGENCE_AS_FACT: false as const,
  COMPLETED_EQ_VERIFIED: false as const,
  PRESENCE_EQ_VERIFIED: false as const,
  SECOND_ORCHESTRATION_FRAMEWORK: false as const,
  WEAKEN_GUARDIAN_RLS: false as const,
  BROADEN_PERMISSIONS: false as const,
  REPUTATION_LIFTS_PERMISSIONS: false as const,
  MESH_BILLING_AUTHORITY: false as const,
  MESH_CREDENTIAL_AUTHORITY: false as const,
  MESH_PRODUCTION_AUTHORITY: false as const,
} as const;

export type Ex6LockKey = keyof typeof EX6_LOCKS;

export function assertEx6LocksIntact(): boolean {
  return (
    EX6_LOCKS.L4_AUTONOMY_ENABLED === false &&
    EX6_LOCKS.TIP_LAND === false &&
    EX6_LOCKS.PRODUCTION_AUTHORIZATION === false &&
    EX6_LOCKS.PRODUCTION_WRITE === false &&
    EX6_LOCKS.MERGE_MAIN === false &&
    EX6_LOCKS.MANAGE_PULL_REQUEST === false &&
    EX6_LOCKS.STORE_CREDENTIALS_IN_RECEIPTS === false &&
    EX6_LOCKS.BUY_QPU_CLOUD_AUTONOMOUSLY === false &&
    EX6_LOCKS.FABRICATE_PHYSICAL_RECEIPT === false &&
    EX6_LOCKS.CLAIM_PHYSICAL_FROM_SIMULATOR === false &&
    EX6_LOCKS.CLAIM_PHYSICAL_FROM_MOCK === false &&
    EX6_LOCKS.CLAIM_UNSUPPORTED_QUANTUM_ADVANTAGE === false &&
    EX6_LOCKS.COMPLETED_EQ_VERIFIED === false &&
    EX6_LOCKS.PRESENCE_EQ_VERIFIED === false &&
    EX6_LOCKS.SECOND_ORCHESTRATION_FRAMEWORK === false &&
    EX6_LOCKS.WEAKEN_GUARDIAN_RLS === false &&
    EX6_LOCKS.BROADEN_PERMISSIONS === false &&
    EX6_LOCKS.REPUTATION_LIFTS_PERMISSIONS === false &&
    EX6_LOCKS.MESH_BILLING_AUTHORITY === false &&
    EX6_LOCKS.MESH_CREDENTIAL_AUTHORITY === false &&
    EX6_LOCKS.MESH_PRODUCTION_AUTHORITY === false
  );
}

export function ex6L4AutonomyEnabled(): false {
  return EX6_LOCKS.L4_AUTONOMY_ENABLED;
}

export function guardianRlsUnchangedByEx6(): true {
  return true;
}

/** Requested / actual execution classes (actual must reflect reality). */
export const EXECUTION_CLASSES = [
  'CLASSICAL',
  'QUANTUM_INSPIRED',
  'SIMULATED_QUANTUM',
  'PHYSICAL_QPU',
] as const;

export type ExecutionClass = (typeof EXECUTION_CLASSES)[number];

/**
 * Receipt / verification lifecycle states.
 * COMPLETED ≠ VERIFIED — COMPLETED_UNVERIFIED is distinct from PHYSICAL_QPU_VERIFIED.
 */
export const VERIFICATION_STATES = [
  'NOT_STARTED',
  'SUBMITTED',
  'PROVIDER_ACCEPTED',
  'QUEUED',
  'RUNNING',
  'COMPLETED_UNVERIFIED',
  'EVIDENCE_INCOMPLETE',
  'PHYSICAL_QPU_VERIFIED',
  'FAILED',
  'STALE',
  'REVOKED',
  'WAITING_PROVIDER',
  'DENIED',
  'TEST_RECEIPT',
] as const;

export type VerificationState = (typeof VERIFICATION_STATES)[number];

/** Backend classification — SIMULATOR never yields physical verification. */
export const BACKEND_CLASSIFICATIONS = [
  'PHYSICAL_QPU',
  'SIMULATOR',
  'UNKNOWN',
] as const;

export type BackendClassification = (typeof BACKEND_CLASSIFICATIONS)[number];

/**
 * Evidence environment — only PHYSICAL_PROVIDER may satisfy physical verification.
 * UNIT_TEST / LOCAL_SIMULATION / STAGING_PROVIDER never prove physical QPU.
 */
export const EVIDENCE_ENVIRONMENTS = [
  'UNIT_TEST',
  'LOCAL_SIMULATION',
  'STAGING_PROVIDER',
  'PHYSICAL_PROVIDER',
] as const;

export type EvidenceEnvironment = (typeof EVIDENCE_ENVIRONMENTS)[number];

/** Physical QPU connection honesty when hardware is unavailable. */
export const PHYSICAL_QPU_STATES = [
  'NOT_TESTED',
  'UNAVAILABLE',
  'AUTHORIZED_CANDIDATE',
  'CONNECTED_UNVERIFIED',
  'VERIFIED',
] as const;

export type PhysicalQpuState = (typeof PHYSICAL_QPU_STATES)[number];

export const COST_STATES = [
  'UNKNOWN',
  'ESTIMATED',
  'REPORTED',
  'INVOICED',
  'WAIVED',
  'NOT_APPLICABLE',
  'DENIED',
] as const;

export type CostState = (typeof COST_STATES)[number];

export const RECEIPT_KINDS = [
  'PHYSICAL_ATTEMPT',
  'SIMULATED',
  'MOCK',
  'TEST_RECEIPT',
  'FAILURE',
  'COMPARISON',
] as const;

export type ReceiptKind = (typeof RECEIPT_KINDS)[number];

/** Mesh roles for EX6 — no billing / credential / production authority. */
export const EX6_MESH_ROLES = [
  'HardwareEvidenceAgent',
  'BenchmarkAgent',
  'ReviewerAgent',
  'ClassicalBaselineAgent',
  'SimulationAgent',
] as const;

export type Ex6MeshRole = (typeof EX6_MESH_ROLES)[number];

export type SoftWirePresence = {
  present: boolean;
  pathChecked: string;
  note: string;
  verified: false;
  disposition: 'PRESENT_UNVERIFIED' | 'WAITING_DATA';
};

export type PhysicalEvidenceChecklist = {
  providerAuthorized: boolean;
  backendClassificationPhysical: boolean;
  providerJobIdPresent: boolean;
  jobAccepted: boolean;
  jobCompleted: boolean;
  providerResultReturned: boolean;
  backendIdentityConfirmed: boolean;
  timestampsPresent: boolean;
  resultHashPresent: boolean;
  auditEvidencePresent: boolean;
  receiptHashValid: boolean;
};

export type ProviderMetadataSafe = {
  providerId: string;
  backendId: string;
  backendDisplayName: string | null;
  region: string | null;
  queuePosition: number | null;
  /** Credential refs only — never raw secrets. */
  credentialRefId: string | null;
  /** Explicit scrub: raw credentials must never appear. */
  rawCredentialsPresent: false;
  extraSafeFields: Readonly<Record<string, string | number | boolean | null>>;
};

export type MeasurementSummary = {
  bitstringCounts: Readonly<Record<string, number>> | null;
  expectationValues: Readonly<Record<string, number>> | null;
  rawPayloadRef: string | null;
};

export type QualityMetrics = {
  fidelityEstimate: number | null;
  errorMitigationApplied: boolean;
  notes: readonly string[];
};

export type CostTruth = {
  costState: CostState;
  amount: number | null;
  currency: string | null;
  costEvidenceRef: string | null;
};

/**
 * Canonical Physical QPU Execution Receipt.
 * Never stores credentials. Never fabricates physical proof from simulator/mock.
 */
export type PhysicalQpuExecutionReceipt = {
  receiptId: string;
  receiptKind: ReceiptKind;
  receiptVersion: string;
  missionId: string;
  taskId: string;
  parentTaskId: string | null;
  tenantId: string;
  universeId: string;
  agentId: string;
  agentRole: Ex6MeshRole;
  providerId: string;
  backendId: string;
  providerJobId: string | null;
  requestedExecutionClass: ExecutionClass;
  actualExecutionClass: ExecutionClass;
  backendClassification: BackendClassification;
  evidenceEnvironment: EvidenceEnvironment;
  physicalQpuState: PhysicalQpuState;
  algorithmHash: string | null;
  circuitHash: string | null;
  problemHash: string | null;
  shots: number | null;
  seed: string | number | null;
  precision: string | null;
  submittedAt: string | null;
  acceptedAt: string | null;
  queuedAt: string | null;
  startedAt: string | null;
  completedAt: string | null;
  durationMs: number | null;
  providerMetadata: ProviderMetadataSafe;
  resultHash: string | null;
  measurements: MeasurementSummary | null;
  quality: QualityMetrics | null;
  baselineReceiptId: string | null;
  comparisonReceiptId: string | null;
  cost: CostTruth;
  evidenceRefs: readonly string[];
  auditEvidenceRef: string | null;
  verificationState: VerificationState;
  physicalQpuVerified: boolean;
  quantumAdvantageVerified: false;
  evidenceChecklist: PhysicalEvidenceChecklist;
  limitations: readonly string[];
  returnPath: string;
  neuralPathwayId: string | null;
  reputationDelta: number;
  reputationLiftsPermissions: false;
  createdAt: string;
  receiptHash: string;
  fabricated: false;
  l4Enabled: false;
  guardianRlsUnchanged: true;
  mockProvider: boolean;
};

export type ComparisonReceipt = {
  comparisonId: string;
  physicalReceiptId: string;
  baselineReceiptId: string | null;
  tenantId: string;
  universeId: string;
  comparable: boolean;
  reasons: readonly string[];
  physicalFaster: boolean | null;
  physicalCheaper: boolean | null;
  physicalSuperior: boolean | null;
  quantumAdvantageVerified: false;
  createdAt: string;
};

export type NeuralPathwayRecord = {
  pathwayId: string;
  pathwayKind: 'PHYSICAL_QPU' | 'SIMULATED_QUANTUM' | 'CLASSICAL' | 'QUANTUM_INSPIRED';
  receiptId: string;
  missionId: string;
  tenantId: string;
  universeId: string;
  hops: readonly CanonicalPathwayHop[];
  physicalVsSimSeparated: true;
  createdAt: string;
};

export const RECEIPT_VERSION = '62L-EX6.1' as const;
