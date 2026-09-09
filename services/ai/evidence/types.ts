import type { TenantScope } from '../runtime/types';

/**
 * 2I-AI-62D evidence governance (story sections 33-61).
 *
 * The governing principle is that a statement is not evidence. Every type here
 * exists so a gate can answer the section 61 questions from stored data rather
 * than from someone's recollection.
 */

/* ------------------------------------------------------------------ */
/* Result envelope                                                     */
/* ------------------------------------------------------------------ */

export type EvidenceDenialCode =
  | 'actor_unauthorized'
  | 'actor_tenant_mismatch'
  | 'separation_of_duties'
  | 'evidence_unknown'
  | 'evidence_tampered'
  | 'evidence_contains_secret'
  | 'commit_binding_missing'
  | 'commit_binding_mismatch'
  | 'gate_unknown'
  | 'gate_evidence_insufficient'
  | 'gate_verification_pending'
  | 'gate_human_approval_required'
  | 'verification_already_recorded'
  | 'exception_not_permitted'
  | 'exception_expired'
  | 'exception_unknown'
  | 'failure_unknown'
  | 'failure_unresolved'
  | 'threshold_not_met'
  | 'automation_cannot_approve'
  | 'status_upgrade_forbidden';

export type EvidenceDenied = { ok: false; code: EvidenceDenialCode; message: string };

export type EvidenceResult<T> = ({ ok: true } & T) | EvidenceDenied;

export function evidenceDeny(code: EvidenceDenialCode, message: string): EvidenceDenied {
  return { ok: false, code, message };
}

/* ------------------------------------------------------------------ */
/* Roles and actors (section 36)                                       */
/* ------------------------------------------------------------------ */

export type EvidenceRole = 'owner' | 'verifier' | 'approver' | 'guardian';

export type ExecutorType = 'ci' | 'human' | 'agent' | 'runtime' | 'scanner';

/**
 * The identity attached to every evidence action. `human` is a real
 * distinction here, not a label: section 59 reserves certain approvals for a
 * person and section 60 forbids automation from converting one into an
 * automatic approval.
 */
export type EvidenceActor = {
  actorId: string;
  actorType: ExecutorType;
  roles: readonly EvidenceRole[];
  scope: TenantScope;
  /** Set when a human is acting under a named authority, e.g. `ceo`. */
  authority?: 'ceo' | 'security_owner' | 'release_manager' | 'delegate';
};

/* ------------------------------------------------------------------ */
/* Evidence strength (section 35)                                      */
/* ------------------------------------------------------------------ */

export type EvidenceLevel = 'E0' | 'E1' | 'E2' | 'E3' | 'E4';

export const EVIDENCE_LEVEL_RANK: Readonly<Record<EvidenceLevel, number>> = Object.freeze({
  E0: 0,
  E1: 1,
  E2: 2,
  E3: 3,
  E4: 4,
});

export const EVIDENCE_LEVEL_LABEL: Readonly<Record<EvidenceLevel, string>> = Object.freeze({
  E0: 'claim',
  E1: 'manual observation',
  E2: 'automated test result',
  E3: 'system-generated verified evidence',
  E4: 'independently verified release evidence',
});

/* ------------------------------------------------------------------ */
/* Exact-commit binding (section 38)                                   */
/* ------------------------------------------------------------------ */

export type CommitBinding = {
  repository: string;
  branch: string;
  commitSha: string;
  buildId: string | null;
  dependencyLockHash?: string;
  migrationHash?: string;
  containerDigest?: string;
  mobileBuildId?: string;
  runtimeVersion?: string;
  configurationVersion?: string;
  modelRegistryVersion?: string;
  policyVersion?: string;
};

/** Section 55: what can invalidate evidence that already passed. */
export type RevalidationTrigger =
  | 'code'
  | 'rls_policy'
  | 'schema'
  | 'guardian'
  | 'runtime'
  | 'model'
  | 'dependency'
  | 'mobile_build'
  | 'infrastructure_policy';

export type FreshnessState = 'valid' | 'stale' | 'superseded' | 'invalid';

/* ------------------------------------------------------------------ */
/* Typed evidence payloads (sections 40-52)                            */
/* ------------------------------------------------------------------ */

export type PolicyOperation = 'select' | 'insert' | 'update' | 'delete' | 'rpc' | 'storage' | 'service';

export type AccessOutcome = 'allow' | 'deny';

/** Section 40. One row per attempted access, with no row contents in it. */
export type RlsProbe = {
  table: string;
  testIdentity: string;
  identityState: 'authenticated' | 'unauthenticated' | 'revoked';
  operation: PolicyOperation;
  sourceTenant: string;
  targetTenant: string;
  expected: AccessOutcome;
  actual: AccessOutcome;
  rowsReturned: number;
};

export type RlsEvidencePayload = {
  kind: 'rls';
  probes: readonly RlsProbe[];
};

/** Section 41. */
export type AgentSecurityPayload = {
  kind: 'agent_security';
  agentId: string;
  agentRole: string;
  organizationId: string;
  universeId: string;
  requestedCapability: string;
  grantedCapability: string | null;
  modelId: string | null;
  runtimeNodeId: string | null;
  taskId: string | null;
  meetingId: string | null;
  resourceBudget: Record<string, number>;
  toolsRequested: readonly string[];
  toolsGranted: readonly string[];
  humanApprovalRequired: boolean;
  humanApprovalPresent: boolean;
  result: string;
  securityEvents: readonly string[];
  unauthorizedGrants: number;
};

/** Section 42. */
export type RuntimeEvidencePayload = {
  kind: 'runtime';
  nodeClass: string;
  architecture: string;
  cpuVendor: string;
  gpuVendor: string;
  runtimeVersion: string;
  trustLevel: string;
  attestationState: string;
  capabilities: readonly string[];
  workloadId: string;
  startedAt: string | null;
  finishedAt: string | null;
  resourceConsumption: Record<string, number>;
  terminationState: string;
  resultHash: string | null;
};

/** Section 43. */
export type PerformancePayload = {
  kind: 'performance';
  environment: string;
  hardwareClass: string;
  workloadDefinition: string;
  concurrency: number;
  executions: number;
  state: 'warm' | 'cold';
  p50Ms: number;
  p95Ms: number;
  p99Ms: number;
  errorRate: number;
  throughputPerSecond: number;
  cpuMillis: number;
  gpuMillis: number;
  memoryMb: number;
  networkMb: number;
  costUsd: number;
};

/** Section 44. */
export type CostPayload = {
  kind: 'cost';
  workloadCount: number;
  agentCount: number;
  activeAgentCount: number;
  modelCalls: number;
  tokens: number;
  cpuMillis: number;
  gpuMillis: number;
  storageMb: number;
  networkMb: number;
  estimatedCostUsd: number;
  attributableCostUsd: number | null;
  costPerTaskUsd: number;
  costPerSuccessfulTaskUsd: number | null;
};

/** Section 45. */
export type ModelEvaluationPayload = {
  kind: 'model_evaluation';
  modelId: string;
  modelVersion: string;
  evaluationSuite: string;
  evaluationVersion: string;
  domain: string;
  sampleCount: number;
  accuracy: number;
  taskSuccess: number;
  errorMetric: number;
  safetyFailures: number;
  latencyMs: number;
  costUsd: number;
};

export type AgentEvaluationPayload = {
  kind: 'agent_evaluation';
  agentId: string;
  role: string;
  toolPolicy: readonly string[];
  taskSuite: string;
  collaborationScore: number;
  policyViolations: number;
  humanCorrections: number;
  outcomeScore: number;
};

/** Section 46. */
export type MobilePayload = {
  kind: 'mobile';
  platform: 'ios' | 'android';
  osVersion: string;
  deviceClass: string;
  buildId: string;
  testSuite: string;
  passed: number;
  failed: number;
  crashes: number;
  authenticationResult: 'pass' | 'fail';
  authorizationResult: 'pass' | 'fail';
  offlineResult: 'pass' | 'fail';
  syncResult: 'pass' | 'fail';
};

/** Section 47. Findings are counted and categorized; values are never carried. */
export type SecretScanPayload = {
  kind: 'secret_scan';
  scanner: string;
  scannerVersion: string;
  scope: string;
  filesScanned: number;
  findingsBySeverity: Record<'critical' | 'high' | 'medium' | 'low', number>;
  findings: readonly {
    credentialType: string;
    locationCategory: string;
    severity: 'critical' | 'high' | 'medium' | 'low';
    remediationState: 'open' | 'remediated' | 'suppressed';
  }[];
  suppressedFindings: number;
  suppressionReason: string | null;
};

/** Section 48. */
export type DependencyPayload = {
  kind: 'dependency';
  sbomRef: string;
  dependencyLockHash: string;
  scannerVersion: string;
  scannedAt: string;
  criticalFindings: number;
  highFindings: number;
  reachableFindings: number;
  acceptedExceptionIds: readonly string[];
};

/** Section 49. */
export type BackupRestorePayload = {
  kind: 'backup_restore';
  backupIdentifier: string;
  sourceEnvironment: string;
  restoreEnvironment: string;
  startedAt: string;
  finishedAt: string;
  recordsExpected: number;
  recordsRecovered: number;
  integrityChecksPassed: boolean;
  rlsChecksPassed: boolean;
  applicationValidationPassed: boolean;
  measuredRpoSeconds: number;
  measuredRtoSeconds: number;
  usedProductionData: boolean;
};

/** Section 50. */
export type RollbackPayload = {
  kind: 'rollback';
  candidateVersion: string;
  knownGoodVersion: string;
  trigger: string;
  procedure: string;
  startedAt: string;
  recoveredAt: string;
  schemaBackwardCompatible: boolean;
  applicationHealthPassed: boolean;
  dataIntegrityPassed: boolean;
  authorizationPassed: boolean;
};

/** Section 51. */
export const LINEAGE_LINKS = [
  'original_source',
  'ingestion',
  'classification',
  'transformation',
  'model',
  'agent',
  'runtime',
  'meeting',
  'recommendation',
  'human_approval',
  'result',
] as const;

export type LineageLink = (typeof LINEAGE_LINKS)[number];

export type LineagePayload = {
  kind: 'lineage';
  subjectId: string;
  consequential: boolean;
  presentLinks: readonly LineageLink[];
  missingLinks: readonly LineageLink[];
  reconstructionPercent: number;
};

/** Section 52. Proof of what the system refuses to do. */
export type NegativeProbe = {
  scenario: string;
  attempted: string;
  expected: 'denied' | 'terminated';
  actual: 'denied' | 'terminated' | 'allowed';
  denialCode: string | null;
};

export type NegativePayload = {
  kind: 'negative';
  probes: readonly NegativeProbe[];
};

/** Section 39 / E2. A plain automated suite result. */
export type TestSuitePayload = {
  kind: 'test_suite';
  runner: string;
  passed: number;
  failed: number;
  skipped: number;
  cases: readonly { name: string; status: 'pass' | 'fail' | 'skip'; durationMs: number }[];
};

export type EvidencePayload =
  | RlsEvidencePayload
  | AgentSecurityPayload
  | RuntimeEvidencePayload
  | PerformancePayload
  | CostPayload
  | ModelEvaluationPayload
  | AgentEvaluationPayload
  | MobilePayload
  | SecretScanPayload
  | DependencyPayload
  | BackupRestorePayload
  | RollbackPayload
  | LineagePayload
  | NegativePayload
  | TestSuitePayload;

export type EvidenceCategory = EvidencePayload['kind'];

/* ------------------------------------------------------------------ */
/* Evidence record (section 34)                                        */
/* ------------------------------------------------------------------ */

export type EvidenceStatus = 'pass' | 'fail' | 'skipped' | 'blocked' | 'unavailable';

export type ApprovalState = 'not_required' | 'pending' | 'approved' | 'rejected';

export type EvidenceRecord = {
  evidenceId: string;
  testRunId: string;
  acceptanceCriterionId: GateId;

  commit: CommitBinding;
  artifactHash: string;

  organizationScope: string;
  universeScope: string;
  environment: string;

  testSuite: string;
  testCase: string;
  testVersion: string;

  expectedResult: string;
  actualResult: string;
  status: EvidenceStatus;

  startedAt: string;
  completedAt: string;
  durationMs: number;

  runtimeNodeId: string | null;
  runtimeVersion: string | null;
  modelId: string | null;
  modelVersion: string | null;

  executorType: ExecutorType;
  executorId: string;

  evidenceLocation: string;
  evidenceHash: string;

  primaryOwner: string;
  reviewer: string | null;
  approvalState: ApprovalState;

  exceptionId: string | null;
  expiresAt: string | null;

  /** Assessed strength, derived rather than declared (section 35). */
  level: EvidenceLevel;
  payload: EvidencePayload;
  freshness: FreshnessState;
  supersededBy: string | null;
  /** Hash chain link, so a silent edit to an earlier record is detectable. */
  previousHash: string | null;
  chainHash: string;
  recordedAt: string;
};

/* ------------------------------------------------------------------ */
/* Verification (sections 36, 61)                                      */
/* ------------------------------------------------------------------ */

export type VerificationVerdict = 'satisfies' | 'insufficient' | 'contradicted';

export type VerificationRecord = {
  verificationId: string;
  evidenceId: string;
  verifierId: string;
  verdict: VerificationVerdict;
  note: string;
  at: string;
};

/* ------------------------------------------------------------------ */
/* Exceptions (section 54)                                             */
/* ------------------------------------------------------------------ */

export type ExceptionSeverity = 'low' | 'medium' | 'high' | 'critical';

export type ExceptionRecord = {
  exceptionId: string;
  criterion: GateId;
  severity: ExceptionSeverity;
  risk: string;
  reason: string;
  scope: string;
  compensatingControl: string;
  owner: string;
  expiresAt: string;
  reviewer: string | null;
  humanApprover: string | null;
  state: 'pending' | 'approved' | 'rejected' | 'expired';
  createdAt: string;
};

/**
 * Section 54: things an exception can never waive. These are not severity
 * judgements, they are hard blockers.
 */
export const UNWAIVABLE_CONDITIONS = [
  'cross_tenant_exposure',
  'guardian_bypass',
  'unauthorized_production_action',
  'exposed_production_secret',
  'cannot_stop_dangerous_workload',
] as const;

export type UnwaivableCondition = (typeof UNWAIVABLE_CONDITIONS)[number];

/* ------------------------------------------------------------------ */
/* Failures (section 53)                                               */
/* ------------------------------------------------------------------ */

export type FailureRecord = {
  failureId: string;
  test: string;
  criterion: GateId;
  commitSha: string;
  environment: string;
  failure: string;
  severity: ExceptionSeverity;
  owner: string;
  rootCause: string | null;
  remediation: string | null;
  fixCommit: string | null;
  retestEvidenceId: string | null;
  verifiedBy: string | null;
  closedAt: string | null;
};

/* ------------------------------------------------------------------ */
/* Gates (sections 37, 56, 57)                                         */
/* ------------------------------------------------------------------ */

export type GateId =
  | 'runtime_identity'
  | 'runtime_attestation'
  | 'rls'
  | 'tenant_isolation'
  | 'universe_isolation'
  | 'workload_authorization'
  | 'compute_routing'
  | 'intel_runtime'
  | 'amd_runtime'
  | 'nvidia_runtime'
  | 'ios'
  | 'android'
  | 'offline_mode'
  | 'agent_runtime_assignment'
  | 'resource_governor'
  | 'kill_switch'
  | 'failure_recovery'
  | 'model_authorization'
  | 'agent_evaluation'
  | 'secret_scanning'
  | 'dependency_scanning'
  | 'provenance'
  | 'backup_restore'
  | 'rollback'
  | 'cost_governance'
  | 'canary_promotion';

export type HumanApprovalRule = 'none' | 'exception_only' | 'required' | 'named_human';

export type GateDefinition = {
  id: GateId;
  label: string;
  primaryOwner: string;
  requiredEvidence: EvidenceLevel;
  requiredCategories: readonly EvidenceCategory[];
  independentVerifier: string;
  humanApproval: HumanApprovalRule;
  /** Section 57 threshold, expressed so a machine can evaluate it. */
  threshold: { kind: 'all_pass' } | { kind: 'ratio'; minimum: number } | { kind: 'max_findings'; maximum: number };
  releaseCritical: boolean;
};

/** Section 56. */
export type GateState =
  | 'UNASSIGNED'
  | 'ASSIGNED'
  | 'IN_PROGRESS'
  | 'EVIDENCE_PENDING'
  | 'VERIFICATION_PENDING'
  | 'PASS'
  | 'FAIL'
  | 'BLOCKED'
  | 'EXCEPTION_PENDING'
  | 'EXCEPTION_APPROVED'
  | 'STALE';

export type GateAssignment = {
  gateId: GateId;
  owner: string | null;
  verifier: string | null;
  approver: string | null;
  assignedAt: string | null;
};

/** Section 57. */
export type DashboardRow = {
  criterion: GateId;
  owner: string | null;
  evidenceLevel: EvidenceLevel;
  requiredEvidence: EvidenceLevel;
  threshold: string;
  result: GateState;
  verifier: string | null;
  freshness: FreshnessState | 'TBD';
};

/* ------------------------------------------------------------------ */
/* Founder brief statuses (section 58)                                 */
/* ------------------------------------------------------------------ */

export type FounderBriefStatus = 'VERIFIED' | 'OBSERVED' | 'REPORTED' | 'UNPROVEN' | 'BLOCKED' | 'UNAVAILABLE';

export type FounderBriefLine = {
  criterion: GateId;
  status: FounderBriefStatus;
  basis: string;
};

/* ------------------------------------------------------------------ */
/* CI evidence package (section 39)                                    */
/* ------------------------------------------------------------------ */

export type EvidenceManifest = {
  generatedAt: string;
  commit: CommitBinding;
  environment: string;
  testsExecuted: number;
  testsSkipped: number;
  passes: number;
  failures: number;
  warnings: number;
  exceptions: readonly string[];
  /** Mandatory gates that produced no evidence in this run. */
  missingMandatoryGates: readonly GateId[];
  /** Mandatory gates whose evidence was recorded as skipped. */
  skippedMandatoryGates: readonly GateId[];
  entries: readonly {
    evidenceId: string;
    criterion: GateId;
    category: EvidenceCategory;
    level: EvidenceLevel;
    status: EvidenceStatus;
    artifactHash: string;
    evidenceHash: string;
    location: string;
  }[];
  chainHead: string | null;
};

/* ------------------------------------------------------------------ */
/* Section 61 answers                                                  */
/* ------------------------------------------------------------------ */

export type EvidenceAudit = {
  whatWasTested: string;
  againstWhichCommit: string;
  whereWasItTested: string;
  whoExecutedIt: string;
  whatWasExpected: string;
  whatActuallyHappened: string;
  whereIsTheEvidence: string;
  hasTheEvidenceBeenAltered: boolean;
  whoOwnsRemediation: string;
  whoIndependentlyVerifiedIt: string | null;
  isTheEvidenceFresh: FreshnessState;
  didAHumanApprovalBecomeNecessary: boolean;
};
