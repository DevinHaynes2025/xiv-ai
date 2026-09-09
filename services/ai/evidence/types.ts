// 2I-AI-62D governance — types for evidence, verification and ownership.
//
// This layer sits beside the agent civilization rather than inside it. The
// civilization decides what agents may do; this decides whether XIV is allowed
// to believe that any of it works.

export type EvidenceLevel = 'E0' | 'E1' | 'E2' | 'E3' | 'E4';

export type EvidenceStatus = 'pass' | 'fail' | 'skipped' | 'error' | 'blocked';

export type OutcomeKind = 'positive' | 'negative';

export type ExecutorType = 'ci' | 'human' | 'agent' | 'runtime' | 'database';

export type ApprovalState = 'not_required' | 'pending' | 'approved' | 'rejected';

export type Freshness = 'VALID' | 'STALE' | 'SUPERSEDED' | 'INVALID';

// Section 56. One accountable state per gate, and every one of them is
// computed. None of them can be written by a caller.
export type OwnershipState =
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

// Section 36. Four roles, and the separation rule that a critical gate cannot
// have one party holding owner, verifier and approver at once.
export type EvidenceRole = 'owner' | 'verifier' | 'approver' | 'guardian';

export type HumanApprovalRule = 'none' | 'exception_only' | 'required' | 'ceo';

// Section 58. How a Founder Brief is allowed to describe a gate.
export type BriefClassification =
  | 'VERIFIED'
  | 'OBSERVED'
  | 'REPORTED'
  | 'UNPROVEN'
  | 'BLOCKED'
  | 'UNAVAILABLE';

export type RevalidationTrigger =
  | 'code_change'
  | 'rls_policy_change'
  | 'schema_change'
  | 'guardian_change'
  | 'runtime_change'
  | 'model_change'
  | 'dependency_change'
  | 'mobile_build_change'
  | 'infrastructure_change'
  | 'security_policy_change';

export type ApprovalKind =
  | 'gate'
  | 'exception'
  | 'staging'
  | 'canary'
  | 'production'
  | 'authority_expansion';

export type Severity = 'low' | 'medium' | 'high' | 'critical';

// Section 38. The identity of the code an artifact was taken against. Evidence
// for one CodeIdentity says nothing about another unless an impact analysis
// explicitly carries it across.
export type CodeIdentity = {
  repository: string;
  branch: string;
  commitSha: string;
  buildId?: string | null;
  artifactHash?: string | null;
  dependencyLockHash?: string | null;
  migrationHash?: string | null;
  containerDigest?: string | null;
  mobileBuildId?: string | null;
  runtimeVersion?: string | null;
  configurationVersion?: string | null;
  modelRegistryVersion?: string | null;
  policyVersion?: string | null;
};

export type ReleaseGate = {
  id: string;
  universeId: string;
  organizationId: string;
  gateKey: string;
  title: string;
  sectionRef: string | null;
  ownerRole: string;
  verifierRole: string;
  requiredEvidenceLevel: EvidenceLevel;
  humanApprovalRule: HumanApprovalRule;
  threshold: string;
  releaseCritical: boolean;
  // Section 54. A hard blocker is a gate whose failure no exception can trade
  // away. Confirmed cross-tenant exposure is the archetype.
  hardBlocker: boolean;
  assignedOwnerId: string | null;
  assignedVerifierId: string | null;
  assignedApproverId: string | null;
  blockedReason: string | null;
  // Set when the capability the gate covers is not configured at all, which is
  // UNAVAILABLE rather than a failure (section 58).
  unavailableReason: string | null;
  provenance: Record<string, unknown>;
  createdBy: string;
  createdAt: string;
};

// Section 34, field for field. Nothing here is optional that the story lists as
// a minimum field, so a record that cannot answer a question does not exist.
export type EvidenceRecord = {
  id: string;
  universeId: string;
  organizationId: string;
  gateId: string;
  testRunId: string;

  code: CodeIdentity;

  environment: string;
  testSuite: string;
  testCase: string;
  testVersion: string;

  expectedResult: string;
  actualResult: string;
  status: EvidenceStatus;
  outcomeKind: OutcomeKind;
  mandatory: boolean;

  evidenceLevel: EvidenceLevel;

  startedAt: string;
  completedAt: string;
  durationMs: number | null;

  runtimeNodeId: string | null;
  modelId: string | null;
  modelVersion: string | null;
  executorType: ExecutorType;
  executorId: string;

  evidenceLocation: string;
  evidenceHash: string;
  // The command that regenerates this artifact. Section 35 separates E2 from
  // E3 partly on whether the result can be produced again by someone else.
  reproductionCommand: string | null;

  primaryOwner: string;
  reviewer: string | null;
  approvalState: ApprovalState;

  exceptionId: string | null;
  expiresAt: string | null;

  supersededBy: string | null;
  invalidatedAt: string | null;
  invalidatedReason: string | null;

  provenance: Record<string, unknown>;
  securityClassification: string;
  retentionPolicy: string;
  createdBy: string;
  createdAt: string;
};

export type EvidenceVerification = {
  id: string;
  universeId: string;
  organizationId: string;
  evidenceId: string;
  verifierId: string;
  verifierRole: string;
  verdict: 'satisfies' | 'insufficient' | 'contradicted';
  rationale: string;
  checkedCommitSha: string;
  verifiedAt: string;
};

export type EvidenceApproval = {
  id: string;
  universeId: string;
  organizationId: string;
  gateId: string;
  approverId: string;
  approvalKind: ApprovalKind;
  decision: 'approved' | 'rejected';
  rationale: string;
  commitSha: string;
  residualRisk: string | null;
  decidedAt: string;
};

export type EvidenceException = {
  id: string;
  universeId: string;
  organizationId: string;
  gateId: string;
  severity: Severity;
  risk: string;
  reason: string;
  scope: string;
  compensatingControl: string;
  ownerId: string;
  reviewerId: string;
  humanApproverId: string | null;
  approvalId: string | null;
  expiresAt: string;
  revokedAt: string | null;
  createdBy: string;
  createdAt: string;
};

export type EvidenceFailure = {
  id: string;
  universeId: string;
  organizationId: string;
  gateId: string | null;
  evidenceId: string | null;
  testSuite: string;
  testCase: string;
  commitSha: string;
  environment: string;
  failure: string;
  severity: Severity;
  ownerId: string;
  rootCause: string | null;
  remediation: string | null;
  fixCommit: string | null;
  retestEvidenceId: string | null;
  verification: string | null;
  closedAt: string | null;
  createdAt: string;
};

export type EvidenceRevalidation = {
  id: string;
  universeId: string;
  organizationId: string;
  triggerKind: RevalidationTrigger;
  detail: string;
  fromCommitSha: string | null;
  toCommitSha: string | null;
  affectsGateId: string | null;
  affectsAllGates: boolean;
  declaredBy: string;
  occurredAt: string;
};

// Section 39. The manifest is the index of a package, so it records what was
// skipped as loudly as what passed.
export type EvidenceManifest = {
  id: string;
  universeId: string;
  organizationId: string;
  testRunId: string;
  code: CodeIdentity;
  environment: string;
  testsExecuted: number;
  testsSkipped: number;
  passes: number;
  failures: number;
  warnings: number;
  exceptions: number;
  artifactHashes: Record<string, string>;
  manifestHash: string;
  generatedBy: string;
  createdAt: string;
};

// Section 57, one row of the readiness table.
export type ReadinessRow = {
  gateKey: string;
  title: string;
  owner: string;
  ownerAssigned: string | null;
  requiredEvidence: EvidenceLevel;
  achievedEvidence: EvidenceLevel | null;
  threshold: string;
  state: OwnershipState;
  result: 'PASS' | 'FAIL' | 'TBD';
  verifier: string;
  verifierAssigned: string | null;
  freshness: Freshness | null;
  classification: BriefClassification;
  commitSha: string | null;
  reasons: string[];
};

export type EvidenceActor = {
  universeId: string;
  userId: string;
};
