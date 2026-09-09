/**
 * 62L-EX5 — QPU Provider Truth Registry types.
 * Parent: 62L-EX / GitHub #170.
 *
 * Honesty:
 *   DOCUMENTED ≠ VERIFIED
 *   AUTHORIZED ≠ QPU VERIFIED
 *   API-visible ≠ successful physical execution
 *   presence ≠ VERIFIED
 *   mocked registry flow ≠ physical verification
 *   physical execution alone ≠ quantum advantage
 *
 * L4_AUTONOMY_ENABLED=false. Credentials by reference only.
 * Extends Agent Mesh + Home Base — not a second orchestration framework.
 */

export const HONESTY_BANNER =
  'DOCUMENTED ≠ VERIFIED; AUTHORIZED ≠ QPU VERIFIED; API-visible ≠ physical execution' as const;

export const GITHUB_SOT_ISSUE = 170 as const;
export const GITHUB_SOT_LABEL = '62L-EX5' as const;
export const GITHUB_SOT_FAMILY = '62L-EX' as const;
export const GITHUB_SOT_TITLE =
  'EX5 — QPU Provider Truth Registry — provider/backend honesty, auth/cost/privacy gates; L4=false' as const;

export const GITLAB_MIRROR_NOTE =
  'GitLab mirror: MCP needsAuth / not resolved — no issue number invented.' as const;

export const NEXT_PHASE_TITLE = 'EX6 — Physical QPU Execution Receipt' as const;
export const NEXT_PHASE_AFTER = 'EX7 — Hybrid Classical/Quantum Router' as const;

/** Canonical ownership path — never spawn a parallel agent framework. */
export const CANONICAL_PATHWAY = [
  'QuantumMission',
  'ClassicalBaseline',
  'QpuRequirement',
  'ProviderTruthRegistry',
  'AuthorizationGate',
  'BackendCapabilityGate',
  'PrivacyCostGate',
  'JobCandidate',
  'HumanAuthorizationWhereRequired',
  'PhysicalQpu',
  'ExecutionReceipt',
  'Comparison',
  'EvidenceReview',
  'XivHomeBase',
] as const;

export type CanonicalPathwayHop = (typeof CANONICAL_PATHWAY)[number];

export const EX5_LOCKS = {
  L4_AUTONOMY_ENABLED: false as const,
  TIP_LAND: false as const,
  PRODUCTION_AUTHORIZATION: false as const,
  PRODUCTION_WRITE: false as const,
  MERGE_MAIN: false as const,
  MANAGE_PULL_REQUEST: false as const,
  STORE_RAW_CREDENTIALS: false as const,
  BUY_QPU_CLOUD_AUTONOMOUSLY: false as const,
  REVERSE_ENGINEER_PROPRIETARY_QPU_IP: false as const,
  REPRESENT_SIMULATION_AS_PHYSICAL: false as const,
  CLAIM_UNSUPPORTED_QUANTUM_ADVANTAGE: false as const,
  CLAIM_CONSCIOUSNESS_AS_FACT: false as const,
  CLAIM_SUPERINTELLIGENCE_AS_FACT: false as const,
  DOCUMENTED_EQ_VERIFIED: false as const,
  AUTHORIZED_EQ_QPU_VERIFIED: false as const,
  API_VISIBLE_EQ_PHYSICAL_EXECUTION: false as const,
  MOCKED_EQ_PHYSICAL_VERIFICATION: false as const,
  PHYSICAL_EXECUTION_EQ_ADVANTAGE: false as const,
  PRESENCE_EQ_VERIFIED: false as const,
  SECOND_ORCHESTRATION_FRAMEWORK: false as const,
  WEAKEN_GUARDIAN_RLS: false as const,
  BROADEN_PERMISSIONS: false as const,
  AUTO_SUBMIT_WHEN_APPROVAL_REQUIRED: false as const,
  FABRICATE_FRESHNESS: false as const,
  INFER_PHYSICAL_FROM_BRAND: false as const,
} as const;

export type Ex5LockKey = keyof typeof EX5_LOCKS;

export function assertEx5LocksIntact(): boolean {
  return (
    EX5_LOCKS.L4_AUTONOMY_ENABLED === false &&
    EX5_LOCKS.TIP_LAND === false &&
    EX5_LOCKS.PRODUCTION_AUTHORIZATION === false &&
    EX5_LOCKS.PRODUCTION_WRITE === false &&
    EX5_LOCKS.MERGE_MAIN === false &&
    EX5_LOCKS.MANAGE_PULL_REQUEST === false &&
    EX5_LOCKS.STORE_RAW_CREDENTIALS === false &&
    EX5_LOCKS.BUY_QPU_CLOUD_AUTONOMOUSLY === false &&
    EX5_LOCKS.REPRESENT_SIMULATION_AS_PHYSICAL === false &&
    EX5_LOCKS.CLAIM_UNSUPPORTED_QUANTUM_ADVANTAGE === false &&
    EX5_LOCKS.DOCUMENTED_EQ_VERIFIED === false &&
    EX5_LOCKS.AUTHORIZED_EQ_QPU_VERIFIED === false &&
    EX5_LOCKS.API_VISIBLE_EQ_PHYSICAL_EXECUTION === false &&
    EX5_LOCKS.MOCKED_EQ_PHYSICAL_VERIFICATION === false &&
    EX5_LOCKS.PHYSICAL_EXECUTION_EQ_ADVANTAGE === false &&
    EX5_LOCKS.PRESENCE_EQ_VERIFIED === false &&
    EX5_LOCKS.SECOND_ORCHESTRATION_FRAMEWORK === false &&
    EX5_LOCKS.WEAKEN_GUARDIAN_RLS === false &&
    EX5_LOCKS.BROADEN_PERMISSIONS === false &&
    EX5_LOCKS.AUTO_SUBMIT_WHEN_APPROVAL_REQUIRED === false &&
    EX5_LOCKS.FABRICATE_FRESHNESS === false &&
    EX5_LOCKS.INFER_PHYSICAL_FROM_BRAND === false
  );
}

export function ex5L4AutonomyEnabled(): false {
  return EX5_LOCKS.L4_AUTONOMY_ENABLED;
}

export function guardianRlsUnchangedByEx5(): true {
  return true;
}

/** Provider truth states. */
export const PROVIDER_STATES = [
  'UNKNOWN',
  'DOCUMENTED',
  'NOT_CONFIGURED',
  'AUTH_REQUIRED',
  'AUTHORIZED',
  'DEGRADED',
  'UNAVAILABLE',
  'REVOKED',
] as const;

export type ProviderState = (typeof PROVIDER_STATES)[number];

/** Backend truth states. */
export const BACKEND_STATES = [
  'UNKNOWN',
  'DOCUMENTED',
  'DISCOVERED',
  'AVAILABLE_REPORTED',
  'SUPPORTED',
  'NOT_TESTED',
  'VERIFIED',
  'DEGRADED',
  'STALE',
  'UNAVAILABLE',
] as const;

export type BackendState = (typeof BACKEND_STATES)[number];

/** Registry candidates — none connected/paid/authorized/verified until evidence. */
export const QPU_PROVIDER_CANDIDATES = [
  'IBM_QUANTUM_CANDIDATE',
  'AWS_BRAKET_CANDIDATE',
  'AZURE_QUANTUM_CANDIDATE',
  'GOOGLE_QUANTUM_CANDIDATE',
  'OTHER_AUTHORIZED_QPU_PROVIDER',
] as const;

export type QpuProviderCandidate = (typeof QPU_PROVIDER_CANDIDATES)[number];

/** Physical vs simulator hard gate — never infer physical from brand. */
export const PHYSICAL_OR_SIMULATOR = ['PHYSICAL_QPU', 'SIMULATOR', 'UNKNOWN'] as const;
export type PhysicalOrSimulator = (typeof PHYSICAL_OR_SIMULATOR)[number];

/** Execution class labels used by EX5 routing (aligned with EX1). */
export const EX5_EXECUTION_CLASSES = [
  'CLASSICAL',
  'QUANTUM_INSPIRED',
  'SIMULATED_QUANTUM',
  'PHYSICAL_QPU_VERIFIED',
] as const;

export type Ex5ExecutionClass = (typeof EX5_EXECUTION_CLASSES)[number];

export const PRIVACY_CLASSES = [
  'PUBLIC',
  'TENANT_PRIVATE',
  'UNIVERSE_SCOPED',
  'FOUNDER_SEALED',
  'RESTRICTED',
] as const;

export type PrivacyClass = (typeof PRIVACY_CLASSES)[number];

export const INPUT_DATA_CLASSES = [
  'SYNTHETIC',
  'PUBLIC_REFERENCE',
  'TENANT_AUTHORIZED',
  'XIV_OWNED',
  'BENCHMARK_FIXTURE',
  'RESTRICTED',
] as const;

export type InputDataClass = (typeof INPUT_DATA_CLASSES)[number];

export const AUTH_MODES = [
  'NONE',
  'API_TOKEN_REF',
  'OAUTH_REF',
  'IAM_ROLE_REF',
  'SERVICE_PRINCIPAL_REF',
  'HUMAN_SESSION',
] as const;

export type AuthMode = (typeof AUTH_MODES)[number];

/** Credential reference only — never raw secrets. */
export type CredentialReference = {
  credentialRefId: string;
  vaultPath: string;
  /** Raw secret must never appear here, in logs, receipts, KG, or agent memory. */
  rawSecretPresent: false;
};

export type CostPolicy = {
  policyId: string;
  currency: 'USD';
  maxSpendUsd: number;
  perJobMaxUsd: number;
  externalSpendRequiresHumanApproval: true;
  autonomousPurchaseAllowed: false;
  version: string;
};

export type SpendingLimits = {
  softLimitUsd: number;
  hardLimitUsd: number;
  spentUsd: number;
};

export type DiscoveryStatus =
  | 'NOT_ATTEMPTED'
  | 'UNAVAILABLE'
  | 'OFFLINE'
  | 'PARTIAL'
  | 'COMPLETE_REPORTED';

export type SoftWirePresence = {
  present: boolean;
  pathChecked: string;
  note: string;
  verified: false;
  disposition: 'PRESENT_UNVERIFIED' | 'WAITING_DATA';
};

export type QpuProviderRecord = {
  providerId: string;
  candidate: QpuProviderCandidate;
  displayName: string;
  state: ProviderState;
  authMode: AuthMode;
  /** Credential by reference only. */
  credentialRef: CredentialReference | null;
  regions: readonly string[];
  allowedDataClasses: readonly InputDataClass[];
  allowedPrivacyClasses: readonly PrivacyClass[];
  costPolicy: CostPolicy;
  spendingLimits: SpendingLimits;
  humanApprovalRequired: boolean;
  discoveryStatus: DiscoveryStatus;
  termsVersion: string | null;
  policyVersion: string | null;
  revoked: boolean;
  revocationReason: string | null;
  lastSeenAt: string | null;
  freshnessTtlMs: number;
  tenantId: string;
  universeId: string;
  /** Never store raw credentials on the record. */
  rawCredentialsStored: false;
};

export type QpuBackendRecord = {
  backendId: string;
  providerId: string;
  displayName: string;
  state: BackendState;
  physicalOrSimulator: PhysicalOrSimulator;
  qubitsReported: number | null;
  qubitsVerified: number | null;
  operationsReported: readonly string[];
  operationsVerified: readonly string[];
  connectivityReported: string | null;
  connectivityVerified: string | null;
  queueDepthReported: number | null;
  availabilityReported: string | null;
  region: string | null;
  privacyClasses: readonly PrivacyClass[];
  dataClasses: readonly InputDataClass[];
  pricingRef: string | null;
  evidenceRefs: readonly string[];
  discoveredAt: string | null;
  lastVerifiedAt: string | null;
  lastSeenAt: string | null;
  freshnessTtlMs: number;
  /** Brand alone never proves physical. */
  inferredPhysicalFromBrand: false;
};

export type GateDecision =
  | 'ALLOWED'
  | 'DENIED'
  | 'HUMAN_APPROVAL_REQUIRED'
  | 'WAITING_PROVIDER'
  | 'WAITING_DATA';

export type GateResult = {
  decision: GateDecision;
  reason: string;
  executionClass: Ex5ExecutionClass | null;
  providerState: ProviderState | null;
  backendState: BackendState | null;
  physicalOrSimulator: PhysicalOrSimulator | null;
  humanApprovalRequired: boolean;
  physicalQpuVerified: false | true;
  quantumAdvantageVerified: false;
  fabricated: false;
  l4Enabled: false;
  guardianRlsUnchanged: true;
};

export type QpuJobRequest = {
  jobId: string;
  missionId: string;
  taskId: string;
  agentId: string;
  tenantId: string;
  universeId: string;
  providerId: string;
  backendId: string;
  problemClass: string;
  shots: number;
  estimatedCostUsd: number;
  regionRequired: string | null;
  inputDataClass: InputDataClass;
  privacyClass: PrivacyClass;
  missionExpiresAt: string;
  missionStatus: 'ACTIVE' | 'EXPIRED' | 'REVOKED' | 'PAUSED' | 'COMPLETED' | 'FAILED' | 'DRAFT';
  budgetRemainingUsd: number;
  paymentRequired: boolean;
  guardianActive: boolean;
  offlineDisconnected: boolean;
  discoveryAvailable: boolean;
  requireVerifiedPhysical: boolean;
  humanApprovalGranted: boolean;
  now: string;
};

/** Soft-wire probe snapshot — presence ≠ VERIFIED. */
export type Ex5SoftWireSnapshot = {
  agentMesh: SoftWirePresence;
  ex1Mission: SoftWirePresence;
  ex2Baseline: SoftWirePresence;
  ex3AlgorithmLab: SoftWirePresence;
  ex4SimulatorRegistry: SoftWirePresence;
  chipgraph: SoftWirePresence;
  evidence: SoftWirePresence;
  benchmark: SoftWirePresence;
  guardian: SoftWirePresence;
};
