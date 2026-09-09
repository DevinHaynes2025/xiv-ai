/**
 * 2I-AI-62D §§33-61 evidence, verification and ownership contracts.
 *
 * Documentation lock only. Produces no evidence, promotes no gate, approves
 * nothing.
 *
 * The distinctive part of this module is EVIDENCE_LEDGER: the claims the
 * 2I-AI-62 series has actually made so far, each classified against §35's
 * five levels and §58's brief vocabulary. Applying the evidence model to
 * everything except our own claims would be the first thing §33 rules out.
 *
 * Status: QUEUED ARCHITECTURE — NOT IMPLEMENTED
 */

export const STORY_ID = '2I-AI-62D' as const;
export const EVIDENCE_SECTION = '§§33-61' as const;

/** §33. Each step is earned; none is implied by the one before it. */
export const EVIDENCE_PROGRESSION = [
  'DOCUMENTED',
  'IMPLEMENTED',
  'TESTED',
  'EVIDENCE_CAPTURED',
  'INDEPENDENTLY_VERIFIED',
  'GATE_PASSED',
  'STAGING_CANARY_CANDIDATE',
] as const;

/** §35. Strength levels, ordered weakest to strongest. */
export const EVIDENCE_LEVELS = ['E0', 'E1', 'E2', 'E3', 'E4'] as const;
export type EvidenceLevel = (typeof EVIDENCE_LEVELS)[number];

/** §35. E0 is a claim with no artifact and can never satisfy a criterion. */
export const LEVEL_CANNOT_SATISFY_ANY_CRITERION: EvidenceLevel = 'E0';
/** §35. E1 is useful in development, insufficient alone for a security gate. */
export const LEVEL_INSUFFICIENT_FOR_CRITICAL_SECURITY: EvidenceLevel = 'E1';
/** §35. E3 is the default minimum for a significant release gate. */
export const LEVEL_MINIMUM_FOR_RELEASE_GATE: EvidenceLevel = 'E3';
/** §35. E4 is required for a critical staging or canary security gate. */
export const LEVEL_REQUIRED_FOR_CRITICAL_GATE: EvidenceLevel = 'E4';

/** §35 E4 requires all five simultaneously. */
export const E4_REQUIREMENTS = [
  'EXACT_COMMIT',
  'REPRODUCIBLE_TEST',
  'SYSTEM_ARTIFACT',
  'INDEPENDENT_REVIEWER',
  'NO_UNRESOLVED_BLOCKER',
] as const;

/** §34. Minimum fields on an evidence record. */
export const EVIDENCE_RECORD_FIELDS = [
  'evidence_id',
  'test_run_id',
  'acceptance_criterion_id',
  'repository',
  'branch',
  'commit_sha',
  'build_id',
  'artifact_hash',
  'organization_scope',
  'universe_scope',
  'environment',
  'test_suite',
  'test_case',
  'test_version',
  'expected_result',
  'actual_result',
  'status',
  'started_at',
  'completed_at',
  'duration_ms',
  'runtime_node_id',
  'runtime_version',
  'model_id',
  'model_version',
  'executor_type',
  'executor_id',
  'evidence_location',
  'evidence_hash',
  'primary_owner',
  'reviewer',
  'approval_state',
  'exception_id',
  'expires_at',
] as const;

/** §34. Never copied into an artifact. */
export const EVIDENCE_FORBIDDEN_CONTENT = [
  'SECRETS',
  'AUTH_TOKENS',
  'PRIVATE_PROMPTS',
  'UNNECESSARY_CUSTOMER_DATA',
] as const;

/** §36. Four roles. */
export const EVIDENCE_ROLES = ['OWNER', 'VERIFIER', 'APPROVER', 'GUARDIAN'] as const;
export type EvidenceRole = (typeof EVIDENCE_ROLES)[number];

/**
 * §36. One actor may not hold all three of these on a critical gate. Guardian
 * is excluded because it enforces policy rather than producing or accepting.
 */
export const ROLES_REQUIRING_SEPARATION: readonly EvidenceRole[] = ['OWNER', 'VERIFIER', 'APPROVER'];

/** §56. Accountability states. */
export const OWNERSHIP_STATES = [
  'UNASSIGNED',
  'ASSIGNED',
  'IN_PROGRESS',
  'EVIDENCE_PENDING',
  'VERIFICATION_PENDING',
  'PASS',
  'FAIL',
  'BLOCKED',
  'EXCEPTION_PENDING',
  'EXCEPTION_APPROVED',
  'STALE',
] as const;
export type OwnershipState = (typeof OWNERSHIP_STATES)[number];

/** §56. No release-critical criterion may enter canary in this state. */
export const STATE_FORBIDDEN_AT_CANARY: OwnershipState = 'UNASSIGNED';

/** §55. Evidence is recalculated, not assumed permanent. */
export const FRESHNESS_STATES = ['VALID', 'STALE', 'SUPERSEDED', 'INVALID'] as const;
export type FreshnessState = (typeof FRESHNESS_STATES)[number];

/** §55. Any of these invalidates evidence until revalidated. */
export const REVALIDATION_TRIGGERS = [
  'CODE_AFFECTING_TESTED_BEHAVIOR',
  'RLS_POLICY_CHANGE',
  'SCHEMA_CHANGE',
  'GUARDIAN_CHANGE',
  'RUNTIME_CHANGE',
  'MODEL_CHANGE',
  'DEPENDENCY_CHANGE',
  'MOBILE_BUILD_CHANGE',
  'INFRA_SECURITY_POLICY_CHANGE',
] as const;

/** §58. Founder brief vocabulary. */
export const BRIEF_STATUSES = [
  'VERIFIED',
  'OBSERVED',
  'REPORTED',
  'UNPROVEN',
  'BLOCKED',
  'UNAVAILABLE',
] as const;
export type BriefStatus = (typeof BRIEF_STATUSES)[number];

/** §58. This promotion never happens without evidence. */
export const FORBIDDEN_BRIEF_PROMOTION = { from: 'REPORTED', to: 'VERIFIED' } as const;

/** §40. Required behavioural matrix per tenant-bearing table. */
export const RLS_REQUIRED_SCENARIOS = [
  'ORG_A_TO_ORG_A_ALLOW',
  'ORG_A_TO_ORG_B_DENY',
  'ORG_B_TO_ORG_A_DENY',
  'UNAUTHENTICATED_DENY',
  'REVOKED_USER_DENY',
] as const;

export const RLS_REQUIRED_OPERATIONS = [
  'SELECT',
  'INSERT',
  'UPDATE',
  'DELETE',
  'RPC',
  'STORAGE',
  'SERVICE_INTERFACE',
] as const;

/** §52. A secure system is proven partly by what it refuses. */
export const REQUIRED_NEGATIVE_EVIDENCE = [
  'CROSS_TENANT_READ_DENIED',
  'UNAUTHORIZED_AGENT_TOOL_DENIED',
  'REVOKED_RUNTIME_DENIED',
  'EXPIRED_OFFLINE_PACKAGE_DENIED',
  'UNREGISTERED_MODEL_DENIED',
  'BUDGET_EXCEEDED_TERMINATED',
] as const;

/** §54. An exception can never waive these. */
export const NON_WAIVABLE_BLOCKERS = [
  'CONFIRMED_CROSS_TENANT_EXPOSURE',
  'GUARDIAN_BYPASS',
  'UNAUTHORIZED_PRODUCTION_ACTION',
  'UNRESOLVED_EXPOSED_PRODUCTION_SECRETS',
  'INABILITY_TO_STOP_DANGEROUS_WORKLOAD',
] as const;

/** §59. Reserved to a human; an agent may prepare but not manufacture these. */
export const HUMAN_ONLY_DECISIONS = [
  'STAGING_CANARY_AUTHORIZATION',
  'PRODUCTION_DEPLOYMENT',
  'MATERIAL_RESIDUAL_RISK_ACCEPTANCE',
  'AGENT_AUTHORITY_EXPANSION',
  'EXTERNAL_PROVIDER_ACTIVATION',
  'SATELLITE_PROVIDER_AGREEMENT',
  'MAJOR_BUDGET_EXPANSION',
  'L4_AUTONOMY_CHANGE',
] as const;

/** §38. Fields that identify the code under test. */
export const EXACT_COMMIT_FIELDS = ['repository', 'branch', 'commit_sha'] as const;

/** §39. Evidence package directories. */
export const EVIDENCE_PACKAGE_DIRS = [
  'unit',
  'integration',
  'security',
  'rls',
  'tenant-isolation',
  'api',
  'web',
  'mobile',
  'runtime',
  'agents',
  'models',
  'dependencies',
  'secrets',
  'performance',
  'cost',
  'provenance',
  'backup-restore',
  'rollback',
] as const;

/** §39. A skipped mandatory test is never silently a pass. */
export const SKIPPED_MANDATORY_TEST_COUNTS_AS_PASS = false;

/**
 * §37 ownership. Owner, verifier and whether a human approval is required.
 * Roles, not necessarily separate people — but not the same actor either.
 */
export type GateOwnership = {
  readonly owner: string;
  readonly verifier: string;
  readonly requiredLevel: EvidenceLevel;
  readonly humanApproval: 'NO' | 'EXCEPTION_ONLY' | 'REQUIRED' | 'CANARY_GATE';
  readonly state: OwnershipState;
};

export const GATE_OWNERSHIP: Readonly<Record<string, GateOwnership>> = {
  runtime_identity: { owner: 'RUNTIME_PLATFORM', verifier: 'SECURITY', requiredLevel: 'E3', humanApproval: 'EXCEPTION_ONLY', state: 'UNASSIGNED' },
  runtime_attestation: { owner: 'SECURITY_PLATFORM', verifier: 'SECURITY_REVIEWER', requiredLevel: 'E3', humanApproval: 'EXCEPTION_ONLY', state: 'UNASSIGNED' },
  rls: { owner: 'DATABASE', verifier: 'SECURITY', requiredLevel: 'E4', humanApproval: 'EXCEPTION_ONLY', state: 'UNASSIGNED' },
  tenant_isolation: { owner: 'DATABASE_SECURITY', verifier: 'INDEPENDENT_SECURITY_VERIFIER', requiredLevel: 'E4', humanApproval: 'REQUIRED', state: 'UNASSIGNED' },
  universe_isolation: { owner: 'DATABASE_SECURITY', verifier: 'INDEPENDENT_SECURITY_VERIFIER', requiredLevel: 'E4', humanApproval: 'EXCEPTION_ONLY', state: 'UNASSIGNED' },
  workload_authorization: { owner: 'RUNTIME_SECURITY', verifier: 'SECURITY', requiredLevel: 'E3', humanApproval: 'EXCEPTION_ONLY', state: 'UNASSIGNED' },
  compute_routing: { owner: 'RUNTIME_PLATFORM', verifier: 'QA_PLATFORM_VERIFIER', requiredLevel: 'E3', humanApproval: 'NO', state: 'UNASSIGNED' },
  intel_runtime: { owner: 'RUNTIME_PLATFORM', verifier: 'QA', requiredLevel: 'E3', humanApproval: 'NO', state: 'UNASSIGNED' },
  amd_runtime: { owner: 'RUNTIME_PLATFORM', verifier: 'QA', requiredLevel: 'E3', humanApproval: 'NO', state: 'UNASSIGNED' },
  nvidia_runtime: { owner: 'RUNTIME_ML', verifier: 'QA_ML_VERIFIER', requiredLevel: 'E3', humanApproval: 'NO', state: 'UNASSIGNED' },
  ios: { owner: 'MOBILE', verifier: 'QA_SECURITY', requiredLevel: 'E3', humanApproval: 'REQUIRED', state: 'UNASSIGNED' },
  android: { owner: 'MOBILE', verifier: 'QA_SECURITY', requiredLevel: 'E3', humanApproval: 'REQUIRED', state: 'UNASSIGNED' },
  offline_mode: { owner: 'RUNTIME_MOBILE', verifier: 'SECURITY', requiredLevel: 'E3', humanApproval: 'EXCEPTION_ONLY', state: 'UNASSIGNED' },
  agent_runtime_assignment: { owner: 'AGENT_PLATFORM', verifier: 'SECURITY_QA', requiredLevel: 'E3', humanApproval: 'NO', state: 'UNASSIGNED' },
  resource_governor: { owner: 'RUNTIME_PLATFORM', verifier: 'SRE_QA', requiredLevel: 'E3', humanApproval: 'NO', state: 'UNASSIGNED' },
  kill_switch: { owner: 'RUNTIME_SRE', verifier: 'SECURITY_SRE_VERIFIER', requiredLevel: 'E4', humanApproval: 'NO', state: 'UNASSIGNED' },
  failure_recovery: { owner: 'SRE_RUNTIME', verifier: 'QA_SRE', requiredLevel: 'E3', humanApproval: 'NO', state: 'UNASSIGNED' },
  model_authorization: { owner: 'ML_PLATFORM', verifier: 'AI_EVALUATION_SECURITY', requiredLevel: 'E3', humanApproval: 'EXCEPTION_ONLY', state: 'UNASSIGNED' },
  agent_evaluation: { owner: 'AI_EVALUATION', verifier: 'INDEPENDENT_EVALUATOR', requiredLevel: 'E3', humanApproval: 'REQUIRED', state: 'UNASSIGNED' },
  secret_scanning: { owner: 'SECURITY', verifier: 'SECURITY', requiredLevel: 'E3', humanApproval: 'EXCEPTION_ONLY', state: 'UNASSIGNED' },
  dependency_scanning: { owner: 'SECURITY_PLATFORM', verifier: 'SECURITY', requiredLevel: 'E3', humanApproval: 'EXCEPTION_ONLY', state: 'UNASSIGNED' },
  provenance: { owner: 'INFORMATION_LOGISTICS', verifier: 'QA_SECURITY', requiredLevel: 'E4', humanApproval: 'NO', state: 'UNASSIGNED' },
  backup_restore: { owner: 'DATABASE_SRE', verifier: 'INDEPENDENT_SRE_DB_REVIEWER', requiredLevel: 'E4', humanApproval: 'CANARY_GATE', state: 'UNASSIGNED' },
  rollback: { owner: 'RELEASE_SRE', verifier: 'QA_SRE', requiredLevel: 'E4', humanApproval: 'CANARY_GATE', state: 'UNASSIGNED' },
  cost_governance: { owner: 'FINOPS_PLATFORM', verifier: 'PLATFORM_FINANCE_REVIEWER', requiredLevel: 'E3', humanApproval: 'REQUIRED', state: 'UNASSIGNED' },
  canary_promotion: { owner: 'RELEASE', verifier: 'SECURITY_AND_QA', requiredLevel: 'E4', humanApproval: 'REQUIRED', state: 'UNASSIGNED' },
} as const;

/**
 * The claims the 62 series has actually produced, classified honestly.
 *
 * `executor: 'AGENT'` on a claim whose verifier is also the agent means §36's
 * separation is not satisfied, which is why nothing here reaches E4 regardless
 * of how carefully it was tested.
 */
export type EvidenceEntry = {
  readonly claim: string;
  readonly level: EvidenceLevel;
  readonly briefStatus: BriefStatus;
  readonly commitScoped: boolean;
  readonly independentlyVerified: boolean;
  readonly note: string;
};

export const EVIDENCE_LEDGER: readonly EvidenceEntry[] = [
  {
    claim: 'Universe-blind RLS allowed a cross-Universe read on xiv_agent_meetings',
    level: 'E2',
    briefStatus: 'OBSERVED',
    commitScoped: true,
    independentlyVerified: false,
    note: 'Executed against a local PostgreSQL 16 cluster. Reproducible, but not CI-signed and not independently reviewed; author was also verifier.',
  },
  {
    claim: 'The Universe-scoped RLS migration closes that read',
    level: 'E2',
    briefStatus: 'OBSERVED',
    commitScoped: true,
    independentlyVerified: false,
    note: 'Behaviourally tested on one table of the eighteen the migration alters.',
  },
  {
    claim: 'Eight compute routers exist and none accepts a tenant or Universe identifier',
    level: 'E2',
    briefStatus: 'OBSERVED',
    commitScoped: true,
    independentlyVerified: false,
    note: 'Static analysis over the runtime, asserted in 2i-ai-62d.test.ts so a ninth changes the diff.',
  },
  {
    claim: 'Only NVIDIA has a hardware capability detector',
    level: 'E2',
    briefStatus: 'OBSERVED',
    commitScoped: true,
    independentlyVerified: false,
    note: 'Static analysis; AcceleratorKind and detectNvidiaCapability are the whole surface.',
  },
  {
    claim: 'The landed 62B meeting engine enforces its RLS schema',
    level: 'E1',
    briefStatus: 'REPORTED',
    commitScoped: true,
    independentlyVerified: false,
    note: 'phase2ai62b.test.ts is entirely in-process and touches no database, so the storage property is untested by it.',
  },
  {
    claim: 'The XIV runtime test suite passes',
    level: 'E2',
    briefStatus: 'OBSERVED',
    commitScoped: true,
    independentlyVerified: false,
    note: 'Tests pass individually. The aggregate npm run test:runtime has never completed here: it halts on a missing @supabase/supabase-js.',
  },
] as const;

/** §40 coverage actually achieved against the required matrix. */
export const RLS_SCENARIO_COVERAGE: Readonly<Record<string, boolean>> = {
  ORG_A_TO_ORG_A_ALLOW: true,
  ORG_A_TO_ORG_B_DENY: true,
  ORG_B_TO_ORG_A_DENY: false,
  UNAUTHENTICATED_DENY: false,
  REVOKED_USER_DENY: false,
} as const;

export const RLS_OPERATION_COVERAGE: Readonly<Record<string, boolean>> = {
  SELECT: true,
  INSERT: true,
  UPDATE: false,
  DELETE: false,
  RPC: false,
  STORAGE: false,
  SERVICE_INTERFACE: false,
} as const;

/** Tables altered by the Universe RLS migration versus tables behaviourally tested. */
export const RLS_TABLES_ALTERED = 18;
export const RLS_TABLES_BEHAVIOURALLY_TESTED = 1;

export function evidenceLevelRank(level: EvidenceLevel): number {
  return EVIDENCE_LEVELS.indexOf(level);
}

export function satisfiesGate(level: EvidenceLevel, required: EvidenceLevel): boolean {
  return evidenceLevelRank(level) >= evidenceLevelRank(required);
}

/**
 * Gates where §37 names the same function as owner and verifier. §37 allows
 * this for a small team ("roles, not necessarily separate employees"), but it
 * is the weakest form of independence and §36 pushes the other way, so the set
 * is surfaced rather than silently accepted.
 */
export function selfVerifyingGates(): string[] {
  return Object.entries(GATE_OWNERSHIP)
    .filter(([, g]) => g.owner === g.verifier)
    .map(([name]) => name)
    .sort();
}

export function unassignedGates(): string[] {
  return Object.entries(GATE_OWNERSHIP)
    .filter(([, g]) => g.state === 'UNASSIGNED')
    .map(([name]) => name)
    .sort();
}

export function gatesRequiringIndependentVerification(): string[] {
  return Object.entries(GATE_OWNERSHIP)
    .filter(([, g]) => g.requiredLevel === 'E4')
    .map(([name]) => name)
    .sort();
}

export function claimsAtOrAboveLevel(level: EvidenceLevel): EvidenceEntry[] {
  return EVIDENCE_LEDGER.filter((e) => satisfiesGate(e.level, level));
}

export function verifiedClaims(): EvidenceEntry[] {
  return EVIDENCE_LEDGER.filter((e) => e.briefStatus === 'VERIFIED');
}

export function uncoveredRlsScenarios(): string[] {
  return Object.entries(RLS_SCENARIO_COVERAGE)
    .filter(([, covered]) => !covered)
    .map(([s]) => s)
    .sort();
}

export function uncoveredRlsOperations(): string[] {
  return Object.entries(RLS_OPERATION_COVERAGE)
    .filter(([, covered]) => !covered)
    .map(([o]) => o)
    .sort();
}

/** §36. A critical gate needs three distinct actors. */
export function roleSeparationSatisfied(actors: {
  owner: string;
  verifier: string;
  approver: string;
}): boolean {
  return new Set([actors.owner, actors.verifier, actors.approver]).size === 3;
}

/** §54. */
export function exceptionCanWaive(blocker: string): boolean {
  return !NON_WAIVABLE_BLOCKERS.includes(blocker as (typeof NON_WAIVABLE_BLOCKERS)[number]);
}

/** §60. Automation may recommend; it never converts a required approval. */
export function automationCanApprove(): false {
  return false;
}

/** §58. */
export function canPromoteBriefStatus(from: BriefStatus, to: BriefStatus, hasEvidence: boolean): boolean {
  if (from === FORBIDDEN_BRIEF_PROMOTION.from && to === FORBIDDEN_BRIEF_PROMOTION.to) {
    return hasEvidence;
  }
  return true;
}

/** §38. Evidence for one commit does not transfer without impact analysis. */
export function evidenceTransfers(
  sameCommit: boolean,
  impactAnalysisProvesUnaffected: boolean,
): boolean {
  return sameCommit || impactAnalysisProvesUnaffected;
}
