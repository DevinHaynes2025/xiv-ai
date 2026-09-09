import { digest, newId } from '../runtime/crypto';
import { GATES, MANDATORY_GATES, directoryForGate } from './gates';
import { assessLevel, canSatisfyCriterion } from './levels';
import { findSecrets } from './redaction';
import {
  EVIDENCE_LEVEL_RANK,
  evidenceDeny,
  type ApprovalState,
  type CommitBinding,
  type DashboardRow,
  type EvidenceActor,
  type EvidenceAudit,
  type EvidenceCategory,
  type EvidenceLevel,
  type EvidenceManifest,
  type EvidencePayload,
  type EvidenceRecord,
  type EvidenceResult,
  type EvidenceStatus,
  type ExceptionRecord,
  type ExceptionSeverity,
  type ExecutorType,
  type FailureRecord,
  type FounderBriefLine,
  type FounderBriefStatus,
  type FreshnessState,
  type GateAssignment,
  type GateId,
  type GateState,
  type RevalidationTrigger,
  type UnwaivableCondition,
  type VerificationRecord,
  type VerificationVerdict,
} from './types';

/**
 * Sections 33-61. The ledger is the thing that makes "we tested it" mean
 * something: it stores what was tested, against which commit, by whom, what was
 * expected, what happened, where the artifact lives, whether that artifact has
 * been altered, who owns remediation and who independently verified it.
 *
 * Like the runtime fabric this is an in-memory model. It is deliberately not
 * wired to CI, a database or a dashboard, because 62D is queued architecture.
 * What it does provide is an executable definition of the rules, so the rules
 * can be tested before anything depends on them.
 */

export type RecordEvidenceInput = {
  criterion: GateId;
  testRunId?: string;
  commit: CommitBinding;
  environment: string;
  testSuite: string;
  testCase: string;
  testVersion: string;
  expectedResult: string;
  actualResult: string;
  status: EvidenceStatus;
  startedAt: string;
  completedAt: string;
  runtimeNodeId?: string | null;
  runtimeVersion?: string | null;
  modelId?: string | null;
  modelVersion?: string | null;
  primaryOwner: string;
  payload: EvidencePayload;
  /** Section 35 E4 requirement: how a third party reruns this. */
  reproducibleCommand?: string | null;
  /** Section 55: which changes invalidate this record beyond the defaults. */
  invalidatedBy?: readonly RevalidationTrigger[];
  expiresAt?: string | null;
  exceptionId?: string | null;
};

type StoredEvidence = {
  record: EvidenceRecord;
  reproducibleCommand: string | null;
  invalidatedBy: readonly RevalidationTrigger[];
  category: EvidenceCategory;
};

export type LedgerOptions = {
  now?: () => Date;
  newId?: (prefix: string) => string;
};

/** Section 55 defaults: what each evidence category is sensitive to. */
const DEFAULT_TRIGGERS: Readonly<Record<EvidenceCategory, readonly RevalidationTrigger[]>> = Object.freeze({
  rls: ['code', 'rls_policy', 'schema'],
  agent_security: ['code', 'guardian', 'model'],
  runtime: ['code', 'runtime'],
  performance: ['code', 'runtime', 'infrastructure_policy'],
  cost: ['code', 'model', 'infrastructure_policy'],
  model_evaluation: ['model'],
  agent_evaluation: ['code', 'model', 'guardian'],
  mobile: ['code', 'mobile_build'],
  secret_scan: ['code'],
  dependency: ['dependency'],
  backup_restore: ['schema', 'infrastructure_policy'],
  rollback: ['code', 'schema', 'infrastructure_policy'],
  lineage: ['code', 'schema'],
  negative: ['code', 'guardian', 'rls_policy'],
  test_suite: ['code'],
});

/** Section 59. Decisions that no automated component may make. */
export const CEO_RESERVED_DECISIONS = [
  'production_deployment',
  'external_data_sharing',
  'legal_or_regulatory_commitment',
  'financial_commitment',
  'customer_facing_claim',
  'security_exception',
  'autonomy_expansion',
] as const;

export type CeoReservedDecision = (typeof CEO_RESERVED_DECISIONS)[number];

export class EvidenceLedger {
  private readonly evidence = new Map<string, StoredEvidence>();
  private readonly order: string[] = [];
  private readonly verifications = new Map<string, VerificationRecord>();
  private readonly approvals = new Map<string, { approverId: string; decision: 'approved' | 'rejected'; note: string; at: string }>();
  private readonly assignments = new Map<GateId, GateAssignment>();
  private readonly exceptions = new Map<string, ExceptionRecord>();
  private readonly failures = new Map<string, FailureRecord>();
  private readonly claimedStatus = new Map<GateId, FounderBriefStatus>();
  private chainHead: string | null = null;

  private readonly now: () => Date;
  private readonly nextId: (prefix: string) => string;

  constructor(options: LedgerOptions = {}) {
    this.now = options.now ?? (() => new Date());
    this.nextId = options.newId ?? newId;
  }

  private timestamp(): string {
    return this.now().toISOString();
  }

  private scopeMismatch(actor: EvidenceActor, organizationId: string, universeId: string): boolean {
    return actor.scope.organizationId !== organizationId || actor.scope.universeId !== universeId;
  }

  /* ---------------------------------------------------------------- */
  /* Ownership (sections 36, 56)                                       */
  /* ---------------------------------------------------------------- */

  assignGate(
    actor: EvidenceActor,
    input: { gateId: GateId; owner: string; verifier: string; approver?: string | null },
  ): EvidenceResult<{ assignment: GateAssignment }> {
    if (actor.actorType !== 'human') {
      return evidenceDeny('automation_cannot_approve', 'gate ownership is assigned by a human, not by automation');
    }
    if (!actor.roles.includes('guardian') && !actor.roles.includes('approver')) {
      return evidenceDeny('actor_unauthorized', `${actor.actorId} cannot assign gate ownership`);
    }
    const definition = GATES[input.gateId];
    if (!definition) return evidenceDeny('gate_unknown', `unknown gate ${input.gateId}`);

    // Section 36: the same person cannot both own and independently verify a
    // release-critical gate. Unassigned is an explicit state, so refusing here
    // leaves the gate visibly UNASSIGNED rather than falsely covered.
    if (definition.releaseCritical && input.owner === input.verifier) {
      return evidenceDeny(
        'separation_of_duties',
        `${definition.label} is release-critical: its owner cannot also be its independent verifier`,
      );
    }

    const assignment: GateAssignment = {
      gateId: input.gateId,
      owner: input.owner,
      verifier: input.verifier,
      approver: input.approver ?? null,
      assignedAt: this.timestamp(),
    };
    this.assignments.set(input.gateId, assignment);
    return { ok: true, assignment };
  }

  getAssignment(gateId: GateId): GateAssignment {
    return (
      this.assignments.get(gateId) ?? {
        gateId,
        owner: null,
        verifier: null,
        approver: null,
        assignedAt: null,
      }
    );
  }

  /* ---------------------------------------------------------------- */
  /* Recording evidence (sections 34, 38, 60)                          */
  /* ---------------------------------------------------------------- */

  recordEvidence(actor: EvidenceActor, input: RecordEvidenceInput): EvidenceResult<{ record: EvidenceRecord }> {
    const definition = GATES[input.criterion];
    if (!definition) return evidenceDeny('gate_unknown', `unknown gate ${input.criterion}`);

    // Section 60: automation is expected to produce evidence. It is only
    // approval that stays human, so `ci`, `runtime` and `scanner` are all valid
    // producers here.
    if (actor.actorType === 'agent') {
      return evidenceDeny('actor_unauthorized', 'agents do not write their own evidence records');
    }

    // Section 38: evidence with no exact revision is an observation about
    // nothing in particular.
    if (!input.commit.repository || !input.commit.branch || !input.commit.commitSha) {
      return evidenceDeny(
        'commit_binding_missing',
        `evidence for ${input.criterion} must carry repository, branch and commit`,
      );
    }

    // Sections 34 and 47.
    const secrets = findSecrets(input.payload);
    if (secrets.length > 0) {
      return evidenceDeny(
        'evidence_contains_secret',
        `evidence payload for ${input.criterion} carries possible secret material at ${secrets
          .map((finding) => `${finding.path} (${finding.reason})`)
          .join(', ')}`,
      );
    }

    const artifactHash = digest(input.payload);
    const evidenceId = this.nextId('evd');
    const location = `xiv-evidence/${input.commit.commitSha}/${directoryForGate(input.criterion)}/${evidenceId}.json`;

    const level = assessLevel({
      commit: input.commit,
      executorType: actor.actorType,
      artifactHash,
      evidenceLocation: location,
      payload: input.payload,
      status: input.status,
      reproducibleCommand: input.reproducibleCommand ?? null,
      verification: null,
      primaryOwner: input.primaryOwner,
      unresolvedBlockers: this.unresolvedBlockersFor(input.criterion),
    });

    const body = {
      evidenceId,
      criterion: input.criterion,
      commit: input.commit,
      artifactHash,
      status: input.status,
      expectedResult: input.expectedResult,
      actualResult: input.actualResult,
      executorId: actor.actorId,
      recordedAt: this.timestamp(),
    };
    const evidenceHash = digest(body);
    const chainHash = digest({ previous: this.chainHead, evidenceHash });

    const record: EvidenceRecord = {
      evidenceId,
      testRunId: input.testRunId ?? this.nextId('run'),
      acceptanceCriterionId: input.criterion,
      commit: input.commit,
      artifactHash,
      organizationScope: actor.scope.organizationId,
      universeScope: actor.scope.universeId,
      environment: input.environment,
      testSuite: input.testSuite,
      testCase: input.testCase,
      testVersion: input.testVersion,
      expectedResult: input.expectedResult,
      actualResult: input.actualResult,
      status: input.status,
      startedAt: input.startedAt,
      completedAt: input.completedAt,
      durationMs: Math.max(0, Date.parse(input.completedAt) - Date.parse(input.startedAt)),
      runtimeNodeId: input.runtimeNodeId ?? null,
      runtimeVersion: input.runtimeVersion ?? null,
      modelId: input.modelId ?? null,
      modelVersion: input.modelVersion ?? null,
      executorType: actor.actorType,
      executorId: actor.actorId,
      evidenceLocation: location,
      evidenceHash,
      primaryOwner: input.primaryOwner,
      reviewer: null,
      approvalState: definition.humanApproval === 'none' ? 'not_required' : 'pending',
      exceptionId: input.exceptionId ?? null,
      expiresAt: input.expiresAt ?? null,
      level,
      payload: input.payload,
      freshness: 'valid',
      supersededBy: null,
      previousHash: this.chainHead,
      chainHash,
      recordedAt: body.recordedAt,
    };

    // Later evidence for the same criterion, commit and test case supersedes
    // earlier evidence instead of competing with it.
    for (const stored of this.evidence.values()) {
      if (
        stored.record.acceptanceCriterionId === record.acceptanceCriterionId &&
        stored.record.testCase === record.testCase &&
        stored.record.supersededBy === null &&
        stored.record.evidenceId !== record.evidenceId
      ) {
        stored.record.supersededBy = record.evidenceId;
        stored.record.freshness = 'superseded';
      }
    }

    this.evidence.set(evidenceId, {
      record,
      reproducibleCommand: input.reproducibleCommand ?? null,
      invalidatedBy: input.invalidatedBy ?? DEFAULT_TRIGGERS[input.payload.kind],
      category: input.payload.kind,
    });
    this.order.push(evidenceId);
    this.chainHead = chainHash;

    return { ok: true, record };
  }

  getEvidence(evidenceId: string): EvidenceRecord | null {
    return this.evidence.get(evidenceId)?.record ?? null;
  }

  listEvidence(criterion?: GateId): EvidenceRecord[] {
    const all = this.order.map((id) => this.evidence.get(id)!.record);
    return criterion ? all.filter((record) => record.acceptanceCriterionId === criterion) : all;
  }

  /** The current, non-superseded evidence for a gate. */
  currentEvidence(criterion: GateId): EvidenceRecord[] {
    return this.listEvidence(criterion).filter((record) => record.supersededBy === null);
  }

  /* ---------------------------------------------------------------- */
  /* Independent verification (sections 36, 61)                        */
  /* ---------------------------------------------------------------- */

  verifyEvidence(
    actor: EvidenceActor,
    input: { evidenceId: string; verdict: VerificationVerdict; note: string },
  ): EvidenceResult<{ verification: VerificationRecord; level: EvidenceLevel }> {
    const stored = this.evidence.get(input.evidenceId);
    if (!stored) return evidenceDeny('evidence_unknown', `unknown evidence ${input.evidenceId}`);
    const record = stored.record;

    if (this.scopeMismatch(actor, record.organizationScope, record.universeScope)) {
      return evidenceDeny('actor_tenant_mismatch', `${actor.actorId} cannot verify evidence outside its scope`);
    }
    if (!actor.roles.includes('verifier') && !actor.roles.includes('guardian')) {
      return evidenceDeny('actor_unauthorized', `${actor.actorId} does not hold the verifier role`);
    }
    if (actor.actorType === 'ci' || actor.actorType === 'agent') {
      return evidenceDeny(
        'automation_cannot_approve',
        'independent verification is a review act; automation may collect evidence but not verify it',
      );
    }
    // Section 36: the author of the evidence cannot be the person who
    // independently confirms it.
    if (actor.actorId === record.primaryOwner) {
      return evidenceDeny('separation_of_duties', `${actor.actorId} owns this criterion and cannot verify it`);
    }
    if (actor.actorId === record.executorId && record.executorType === 'human') {
      return evidenceDeny('separation_of_duties', `${actor.actorId} executed this test and cannot verify it`);
    }
    if (this.verifications.has(input.evidenceId)) {
      return evidenceDeny('verification_already_recorded', `evidence ${input.evidenceId} is already verified`);
    }
    if (!this.integrityOf(input.evidenceId)) {
      return evidenceDeny('evidence_tampered', `evidence ${input.evidenceId} no longer matches its recorded hash`);
    }

    const verification: VerificationRecord = {
      verificationId: this.nextId('ver'),
      evidenceId: input.evidenceId,
      verifierId: actor.actorId,
      verdict: input.verdict,
      note: input.note,
      at: this.timestamp(),
    };
    this.verifications.set(input.evidenceId, verification);
    record.reviewer = actor.actorId;

    record.level = assessLevel({
      commit: record.commit,
      executorType: record.executorType,
      artifactHash: record.artifactHash,
      evidenceLocation: record.evidenceLocation,
      payload: record.payload,
      status: record.status,
      reproducibleCommand: stored.reproducibleCommand,
      verification,
      primaryOwner: record.primaryOwner,
      unresolvedBlockers: this.unresolvedBlockersFor(record.acceptanceCriterionId),
    });
    // The chain covers the recorded facts, so re-derived strength does not
    // rewrite history; it is recomputed from the same inputs on demand.

    return { ok: true, verification, level: record.level };
  }

  getVerification(evidenceId: string): VerificationRecord | null {
    return this.verifications.get(evidenceId) ?? null;
  }

  /* ---------------------------------------------------------------- */
  /* Human approval (sections 36, 59, 60)                              */
  /* ---------------------------------------------------------------- */

  approveGate(
    actor: EvidenceActor,
    input: { gateId: GateId; evidenceId: string; decision: 'approved' | 'rejected'; note: string },
  ): EvidenceResult<{ approvalState: ApprovalState }> {
    const definition = GATES[input.gateId];
    if (!definition) return evidenceDeny('gate_unknown', `unknown gate ${input.gateId}`);
    const stored = this.evidence.get(input.evidenceId);
    if (!stored) return evidenceDeny('evidence_unknown', `unknown evidence ${input.evidenceId}`);

    // Section 60 in one line: automation collects, humans approve.
    if (actor.actorType !== 'human') {
      return evidenceDeny(
        'automation_cannot_approve',
        `${actor.actorType} ${actor.actorId} cannot approve ${definition.label}; approval is a human act`,
      );
    }
    if (!actor.roles.includes('approver') && !actor.roles.includes('guardian')) {
      return evidenceDeny('actor_unauthorized', `${actor.actorId} does not hold the approver role`);
    }
    if (definition.humanApproval === 'named_human' && actor.authority !== 'ceo' && actor.authority !== 'release_manager') {
      return evidenceDeny(
        'actor_unauthorized',
        `${definition.label} requires the CEO or a separately authorized release human`,
      );
    }
    const record = stored.record;
    if (definition.releaseCritical) {
      if (actor.actorId === record.primaryOwner) {
        return evidenceDeny('separation_of_duties', `${actor.actorId} owns this criterion and cannot approve it`);
      }
      const verification = this.verifications.get(input.evidenceId);
      if (verification && verification.verifierId === actor.actorId) {
        return evidenceDeny('separation_of_duties', `${actor.actorId} verified this evidence and cannot also approve it`);
      }
    }

    this.approvals.set(input.gateId, {
      approverId: actor.actorId,
      decision: input.decision,
      note: input.note,
      at: this.timestamp(),
    });
    record.approvalState = input.decision;
    return { ok: true, approvalState: record.approvalState };
  }

  /** Section 59: the boundary automation is not allowed to cross. */
  requestReservedDecision(
    actor: EvidenceActor,
    input: { decision: CeoReservedDecision; summary: string },
  ): EvidenceResult<{ decision: CeoReservedDecision; decidedBy: string; at: string }> {
    if (actor.actorType !== 'human') {
      return evidenceDeny(
        'automation_cannot_approve',
        `${input.decision} is reserved for human authority; ${actor.actorType} ${actor.actorId} may prepare it but not decide it`,
      );
    }
    if (actor.authority !== 'ceo') {
      return evidenceDeny('actor_unauthorized', `${input.decision} is reserved for the CEO or an explicit delegate`);
    }
    return { ok: true, decision: input.decision, decidedBy: actor.actorId, at: this.timestamp() };
  }

  /* ---------------------------------------------------------------- */
  /* Exceptions (section 54)                                           */
  /* ---------------------------------------------------------------- */

  openException(
    actor: EvidenceActor,
    input: {
      criterion: GateId;
      severity: ExceptionSeverity;
      risk: string;
      reason: string;
      scope: string;
      compensatingControl: string;
      owner: string;
      expiresAt: string;
      unwaivable?: UnwaivableCondition | null;
    },
  ): EvidenceResult<{ exception: ExceptionRecord }> {
    if (!GATES[input.criterion]) return evidenceDeny('gate_unknown', `unknown gate ${input.criterion}`);
    if (actor.actorType !== 'human') {
      return evidenceDeny('automation_cannot_approve', 'an exception is a documented human decision');
    }
    // Section 54: some conditions are not exception candidates at any severity.
    if (input.unwaivable) {
      return evidenceDeny(
        'exception_not_permitted',
        `${input.unwaivable} can never be waived by exception; it blocks release outright`,
      );
    }
    if (!input.compensatingControl.trim()) {
      return evidenceDeny('exception_not_permitted', 'an exception requires a compensating control');
    }
    if (Date.parse(input.expiresAt) <= this.now().getTime()) {
      return evidenceDeny('exception_expired', 'an exception must carry a future expiry');
    }

    const exception: ExceptionRecord = {
      exceptionId: this.nextId('exc'),
      criterion: input.criterion,
      severity: input.severity,
      risk: input.risk,
      reason: input.reason,
      scope: input.scope,
      compensatingControl: input.compensatingControl,
      owner: input.owner,
      expiresAt: input.expiresAt,
      reviewer: null,
      humanApprover: null,
      state: 'pending',
      createdAt: this.timestamp(),
    };
    this.exceptions.set(exception.exceptionId, exception);
    return { ok: true, exception };
  }

  reviewException(
    actor: EvidenceActor,
    input: { exceptionId: string; decision: 'approved' | 'rejected'; note: string },
  ): EvidenceResult<{ exception: ExceptionRecord }> {
    const exception = this.exceptions.get(input.exceptionId);
    if (!exception) return evidenceDeny('exception_unknown', `unknown exception ${input.exceptionId}`);
    if (actor.actorType !== 'human') {
      return evidenceDeny('automation_cannot_approve', 'exceptions are approved by a named human');
    }
    if (!actor.roles.includes('approver') && !actor.roles.includes('guardian')) {
      return evidenceDeny('actor_unauthorized', `${actor.actorId} cannot approve exceptions`);
    }
    if (actor.actorId === exception.owner) {
      return evidenceDeny('separation_of_duties', `${actor.actorId} raised this exception and cannot approve it`);
    }
    exception.state = input.decision;
    exception.humanApprover = actor.actorId;
    exception.reviewer = actor.actorId;
    return { ok: true, exception };
  }

  listExceptions(criterion?: GateId): ExceptionRecord[] {
    const all = [...this.exceptions.values()].map((exception) => {
      if (exception.state === 'approved' && Date.parse(exception.expiresAt) <= this.now().getTime()) {
        exception.state = 'expired';
      }
      return exception;
    });
    return criterion ? all.filter((exception) => exception.criterion === criterion) : all;
  }

  private activeException(criterion: GateId): ExceptionRecord | null {
    return this.listExceptions(criterion).find((exception) => exception.state === 'approved') ?? null;
  }

  private pendingException(criterion: GateId): ExceptionRecord | null {
    return this.listExceptions(criterion).find((exception) => exception.state === 'pending') ?? null;
  }

  /* ---------------------------------------------------------------- */
  /* Failures (section 53)                                             */
  /* ---------------------------------------------------------------- */

  recordFailure(
    actor: EvidenceActor,
    input: {
      test: string;
      criterion: GateId;
      commitSha: string;
      environment: string;
      failure: string;
      severity: ExceptionSeverity;
      owner: string;
    },
  ): EvidenceResult<{ failure: FailureRecord }> {
    if (!GATES[input.criterion]) return evidenceDeny('gate_unknown', `unknown gate ${input.criterion}`);
    if (actor.actorType === 'agent') {
      return evidenceDeny('actor_unauthorized', 'agents do not file failure records');
    }
    const failure: FailureRecord = {
      failureId: this.nextId('flr'),
      test: input.test,
      criterion: input.criterion,
      commitSha: input.commitSha,
      environment: input.environment,
      failure: input.failure,
      severity: input.severity,
      owner: input.owner,
      rootCause: null,
      remediation: null,
      fixCommit: null,
      retestEvidenceId: null,
      verifiedBy: null,
      closedAt: null,
    };
    this.failures.set(failure.failureId, failure);
    return { ok: true, failure };
  }

  /** Section 53: a failure closes on retest evidence, not on assertion. */
  closeFailure(
    actor: EvidenceActor,
    input: {
      failureId: string;
      rootCause: string;
      remediation: string;
      fixCommit: string;
      retestEvidenceId: string;
    },
  ): EvidenceResult<{ failure: FailureRecord }> {
    const failure = this.failures.get(input.failureId);
    if (!failure) return evidenceDeny('failure_unknown', `unknown failure ${input.failureId}`);
    if (actor.actorType !== 'human') {
      return evidenceDeny('automation_cannot_approve', 'closing a failure requires a human verifier');
    }
    if (actor.actorId === failure.owner) {
      return evidenceDeny('separation_of_duties', `${actor.actorId} owns this failure and cannot close it alone`);
    }
    const retest = this.evidence.get(input.retestEvidenceId);
    if (!retest) return evidenceDeny('evidence_unknown', `unknown retest evidence ${input.retestEvidenceId}`);
    if (retest.record.status !== 'pass') {
      return evidenceDeny('failure_unresolved', `retest evidence ${input.retestEvidenceId} did not pass`);
    }
    if (retest.record.commit.commitSha !== input.fixCommit) {
      return evidenceDeny(
        'commit_binding_mismatch',
        `retest evidence is bound to ${retest.record.commit.commitSha}, not to fix commit ${input.fixCommit}`,
      );
    }

    failure.rootCause = input.rootCause;
    failure.remediation = input.remediation;
    failure.fixCommit = input.fixCommit;
    failure.retestEvidenceId = input.retestEvidenceId;
    failure.verifiedBy = actor.actorId;
    failure.closedAt = this.timestamp();
    return { ok: true, failure };
  }

  listFailures(criterion?: GateId): FailureRecord[] {
    const all = [...this.failures.values()];
    return criterion ? all.filter((failure) => failure.criterion === criterion) : all;
  }

  private unresolvedBlockersFor(criterion: GateId): number {
    return this.listFailures(criterion).filter(
      (failure) => failure.closedAt === null && (failure.severity === 'critical' || failure.severity === 'high'),
    ).length;
  }

  /* ---------------------------------------------------------------- */
  /* Freshness (section 55)                                            */
  /* ---------------------------------------------------------------- */

  /**
   * Applying a change does not delete evidence, it ages it. Stale evidence is
   * visibly stale rather than quietly passing.
   */
  applyChange(trigger: RevalidationTrigger): { staled: string[] } {
    const staled: string[] = [];
    for (const stored of this.evidence.values()) {
      if (stored.record.freshness !== 'valid') continue;
      if (!stored.invalidatedBy.includes(trigger)) continue;
      stored.record.freshness = 'stale';
      staled.push(stored.record.evidenceId);
    }
    return { staled };
  }

  freshnessOf(evidenceId: string): FreshnessState {
    const stored = this.evidence.get(evidenceId);
    if (!stored) return 'invalid';
    if (stored.record.freshness !== 'valid') return stored.record.freshness;
    if (stored.record.expiresAt && Date.parse(stored.record.expiresAt) <= this.now().getTime()) return 'stale';
    if (!this.integrityOf(evidenceId)) return 'invalid';
    return 'valid';
  }

  /* ---------------------------------------------------------------- */
  /* Tamper evidence (sections 34, 61)                                 */
  /* ---------------------------------------------------------------- */

  private integrityOf(evidenceId: string): boolean {
    const stored = this.evidence.get(evidenceId);
    if (!stored) return false;
    const record = stored.record;
    if (digest(record.payload) !== record.artifactHash) return false;
    const expected = digest({
      evidenceId: record.evidenceId,
      criterion: record.acceptanceCriterionId,
      commit: record.commit,
      artifactHash: record.artifactHash,
      status: record.status,
      expectedResult: record.expectedResult,
      actualResult: record.actualResult,
      executorId: record.executorId,
      recordedAt: record.recordedAt,
    });
    return expected === record.evidenceHash;
  }

  /** Walks the chain so an edit to any earlier record is visible. */
  verifyIntegrity(): { ok: boolean; brokenAt: string | null; reason: string | null } {
    let previous: string | null = null;
    for (const evidenceId of this.order) {
      const record = this.evidence.get(evidenceId)!.record;
      if (!this.integrityOf(evidenceId)) {
        return { ok: false, brokenAt: evidenceId, reason: 'record contents no longer match their recorded hash' };
      }
      if (record.previousHash !== previous) {
        return { ok: false, brokenAt: evidenceId, reason: 'chain link does not match the preceding record' };
      }
      if (record.chainHash !== digest({ previous, evidenceHash: record.evidenceHash })) {
        return { ok: false, brokenAt: evidenceId, reason: 'chain hash does not match its inputs' };
      }
      previous = record.chainHash;
    }
    return { ok: true, brokenAt: null, reason: null };
  }

  /* ---------------------------------------------------------------- */
  /* Thresholds (section 57)                                           */
  /* ---------------------------------------------------------------- */

  private thresholdMet(criterion: GateId, records: readonly EvidenceRecord[]): boolean {
    const definition = GATES[criterion];
    switch (definition.threshold.kind) {
      case 'all_pass':
        return records.length > 0 && records.every((record) => record.status === 'pass' && payloadPasses(record.payload));
      case 'ratio': {
        const minimum = definition.threshold.minimum;
        let total = 0;
        let passed = 0;
        for (const record of records) {
          if (record.payload.kind !== 'test_suite') continue;
          total += record.payload.passed + record.payload.failed;
          passed += record.payload.passed;
        }
        return total > 0 && passed / total >= minimum;
      }
      case 'max_findings': {
        const maximum = definition.threshold.maximum;
        let findings = 0;
        for (const record of records) {
          if (record.payload.kind === 'secret_scan') {
            findings += record.payload.findings.filter((finding) => finding.remediationState === 'open').length;
          } else if (record.payload.kind === 'dependency') {
            findings += record.payload.criticalFindings + record.payload.reachableFindings;
          }
        }
        return findings <= maximum;
      }
    }
  }

  /* ---------------------------------------------------------------- */
  /* Gate state (section 56)                                           */
  /* ---------------------------------------------------------------- */

  gateState(criterion: GateId): GateState {
    const definition = GATES[criterion];
    if (!definition) return 'UNASSIGNED';

    const assignment = this.getAssignment(criterion);
    const records = this.currentEvidence(criterion);

    if (records.length === 0) {
      return assignment.owner ? 'ASSIGNED' : 'UNASSIGNED';
    }

    if (records.some((record) => record.status === 'blocked')) return 'BLOCKED';
    if (records.some((record) => record.status === 'fail')) return 'FAIL';
    if (this.unresolvedBlockersFor(criterion) > 0) return 'FAIL';

    const freshness = records.map((record) => this.freshnessOf(record.evidenceId));
    if (freshness.some((state) => state === 'invalid')) return 'BLOCKED';
    if (freshness.some((state) => state === 'stale')) return 'STALE';

    const pendingException = this.pendingException(criterion);
    const approvedException = this.activeException(criterion);

    const missingCategories = definition.requiredCategories.filter(
      (category) => !records.some((record) => record.payload.kind === category),
    );
    const strongest = gateLevel(records);
    const levelSatisfied =
      EVIDENCE_LEVEL_RANK[strongest] >= EVIDENCE_LEVEL_RANK[definition.requiredEvidence] &&
      canSatisfyCriterion(strongest);

    if (records.some((record) => record.status === 'skipped' || record.status === 'unavailable')) {
      if (approvedException) return 'EXCEPTION_APPROVED';
      if (pendingException) return 'EXCEPTION_PENDING';
      return 'BLOCKED';
    }

    if (missingCategories.length > 0 || !this.thresholdMet(criterion, records)) {
      if (approvedException) return 'EXCEPTION_APPROVED';
      if (pendingException) return 'EXCEPTION_PENDING';
      return 'EVIDENCE_PENDING';
    }

    if (!levelSatisfied) {
      // The gap between what is required and what exists is nearly always the
      // missing independent verification, so name that state precisely.
      const needsVerification = records.some((record) => !this.verifications.has(record.evidenceId));
      if (approvedException) return 'EXCEPTION_APPROVED';
      if (pendingException) return 'EXCEPTION_PENDING';
      return needsVerification ? 'VERIFICATION_PENDING' : 'EVIDENCE_PENDING';
    }

    if (definition.humanApproval === 'required' || definition.humanApproval === 'named_human') {
      const approval = this.approvals.get(criterion);
      if (!approval) return 'VERIFICATION_PENDING';
      if (approval.decision === 'rejected') return 'FAIL';
    }

    return 'PASS';
  }

  /* ---------------------------------------------------------------- */
  /* Dashboard and release readiness (section 57)                      */
  /* ---------------------------------------------------------------- */

  dashboard(): DashboardRow[] {
    return (Object.keys(GATES) as GateId[]).map((criterion) => {
      const definition = GATES[criterion];
      const records = this.currentEvidence(criterion);
      const assignment = this.getAssignment(criterion);
      return {
        criterion,
        owner: assignment.owner,
        evidenceLevel: records.length > 0 ? gateLevel(records) : 'E0',
        requiredEvidence: definition.requiredEvidence,
        threshold: describeThreshold(definition.threshold),
        result: this.gateState(criterion),
        verifier: assignment.verifier,
        // Section 57: an empty cell is TBD, and TBD is never PASS.
        freshness: records.length > 0 ? this.freshnessOf(records[0]!.evidenceId) : 'TBD',
      };
    });
  }

  /**
   * Section 57: deployment readiness is the conjunction of every release
   * critical gate, not a majority vote.
   */
  releaseReadiness(): { ready: boolean; blockers: { criterion: GateId; state: GateState }[] } {
    const blockers = MANDATORY_GATES.map((criterion) => ({ criterion, state: this.gateState(criterion) })).filter(
      (entry) => entry.state !== 'PASS' && entry.state !== 'EXCEPTION_APPROVED',
    );
    return { ready: blockers.length === 0, blockers };
  }

  /* ---------------------------------------------------------------- */
  /* Founder brief (section 58)                                        */
  /* ---------------------------------------------------------------- */

  founderBriefStatus(criterion: GateId): FounderBriefLine {
    const state = this.gateState(criterion);
    const records = this.currentEvidence(criterion);

    if (records.length === 0) {
      return {
        criterion,
        status: state === 'UNASSIGNED' ? 'UNPROVEN' : 'UNPROVEN',
        basis: state === 'UNASSIGNED' ? 'no owner and no evidence' : 'assigned but no evidence recorded',
      };
    }
    if (state === 'BLOCKED') {
      return { criterion, status: 'BLOCKED', basis: 'evidence could not be produced or is unusable' };
    }
    if (state === 'FAIL') {
      return { criterion, status: 'BLOCKED', basis: 'recorded evidence failed or an open blocker exists' };
    }
    if (state === 'STALE') {
      return { criterion, status: 'UNAVAILABLE', basis: 'evidence exists but a change invalidated it' };
    }
    if (state === 'PASS' || state === 'EXCEPTION_APPROVED') {
      const level = gateLevel(records);
      const independentlyVerified = records.some((record) => {
        const verification = this.verifications.get(record.evidenceId);
        return verification?.verdict === 'satisfies' && verification.verifierId !== record.primaryOwner;
      });
      if (EVIDENCE_LEVEL_RANK[level] >= EVIDENCE_LEVEL_RANK.E3 && independentlyVerified) {
        return { criterion, status: 'VERIFIED', basis: `${level} evidence with independent verification` };
      }
      return { criterion, status: 'OBSERVED', basis: `${level} evidence without independent verification` };
    }
    const level = gateLevel(records);
    if (level === 'E0') return { criterion, status: 'REPORTED', basis: 'claim only' };
    return { criterion, status: 'OBSERVED', basis: `${level} evidence, gate state ${state}` };
  }

  founderBrief(): FounderBriefLine[] {
    return (Object.keys(GATES) as GateId[]).map((criterion) => this.founderBriefStatus(criterion));
  }

  /**
   * Section 58: REPORTED may never be upgraded to VERIFIED without evidence.
   * A claimed status is accepted only when the ledger already supports it.
   */
  claimStatus(
    actor: EvidenceActor,
    input: { criterion: GateId; status: FounderBriefStatus },
  ): EvidenceResult<{ status: FounderBriefStatus }> {
    if (!GATES[input.criterion]) return evidenceDeny('gate_unknown', `unknown gate ${input.criterion}`);
    const derived = this.founderBriefStatus(input.criterion).status;
    const strength: Readonly<Record<FounderBriefStatus, number>> = {
      UNAVAILABLE: 0,
      BLOCKED: 0,
      UNPROVEN: 1,
      REPORTED: 2,
      OBSERVED: 3,
      VERIFIED: 4,
    };
    if (strength[input.status] > strength[derived]) {
      return evidenceDeny(
        'status_upgrade_forbidden',
        `${input.criterion} is ${derived} in the ledger; ${actor.actorId} cannot report it as ${input.status}`,
      );
    }
    this.claimedStatus.set(input.criterion, input.status);
    return { ok: true, status: input.status };
  }

  /** What has actually been said about a gate outside the ledger. */
  reportedStatus(criterion: GateId): FounderBriefStatus | null {
    return this.claimedStatus.get(criterion) ?? null;
  }

  /* ---------------------------------------------------------------- */
  /* CI evidence package (section 39)                                  */
  /* ---------------------------------------------------------------- */

  manifest(commit: CommitBinding, environment: string): EvidenceManifest {
    const entries = this.listEvidence()
      .filter((record) => record.commit.commitSha === commit.commitSha)
      .map((record) => ({
        evidenceId: record.evidenceId,
        criterion: record.acceptanceCriterionId,
        category: record.payload.kind,
        level: record.level,
        status: record.status,
        artifactHash: record.artifactHash,
        evidenceHash: record.evidenceHash,
        location: record.evidenceLocation,
      }));

    const covered = new Set(entries.map((entry) => entry.criterion));
    const skipped = new Set(
      entries.filter((entry) => entry.status === 'skipped' || entry.status === 'unavailable').map((entry) => entry.criterion),
    );

    return {
      generatedAt: this.timestamp(),
      commit,
      environment,
      testsExecuted: entries.length,
      // Section 39: skipped tests are reported, never silently omitted.
      testsSkipped: entries.filter((entry) => entry.status === 'skipped').length,
      passes: entries.filter((entry) => entry.status === 'pass').length,
      failures: entries.filter((entry) => entry.status === 'fail').length,
      warnings: entries.filter((entry) => entry.status === 'unavailable').length,
      exceptions: this.listExceptions()
        .filter((exception) => exception.state === 'approved')
        .map((exception) => exception.exceptionId),
      missingMandatoryGates: MANDATORY_GATES.filter((criterion) => !covered.has(criterion)),
      skippedMandatoryGates: MANDATORY_GATES.filter((criterion) => skipped.has(criterion)),
      entries,
      chainHead: this.chainHead,
    };
  }

  /* ---------------------------------------------------------------- */
  /* Section 61 questions                                              */
  /* ---------------------------------------------------------------- */

  audit(evidenceId: string): EvidenceResult<{ audit: EvidenceAudit }> {
    const stored = this.evidence.get(evidenceId);
    if (!stored) return evidenceDeny('evidence_unknown', `unknown evidence ${evidenceId}`);
    const record = stored.record;
    const definition = GATES[record.acceptanceCriterionId];
    const verification = this.verifications.get(evidenceId);

    return {
      ok: true,
      audit: {
        whatWasTested: `${record.testSuite} / ${record.testCase} (${definition.label})`,
        againstWhichCommit: `${record.commit.repository}@${record.commit.branch}#${record.commit.commitSha}`,
        whereWasItTested: record.environment,
        whoExecutedIt: `${record.executorType}:${record.executorId}`,
        whatWasExpected: record.expectedResult,
        whatActuallyHappened: record.actualResult,
        whereIsTheEvidence: record.evidenceLocation,
        hasTheEvidenceBeenAltered: !this.integrityOf(evidenceId),
        whoOwnsRemediation: record.primaryOwner,
        whoIndependentlyVerifiedIt: verification?.verifierId ?? null,
        isTheEvidenceFresh: this.freshnessOf(evidenceId),
        didAHumanApprovalBecomeNecessary: definition.humanApproval !== 'none',
      },
    };
  }
}

/**
 * A gate is only as strong as its weakest supporting record, so the reported
 * level is the minimum. Taking the maximum would let one strong artifact carry
 * several weak ones.
 */
function gateLevel(records: readonly EvidenceRecord[]): EvidenceLevel {
  let weakest: EvidenceLevel = 'E4';
  for (const record of records) {
    if (EVIDENCE_LEVEL_RANK[record.level] < EVIDENCE_LEVEL_RANK[weakest]) weakest = record.level;
  }
  return records.length === 0 ? 'E0' : weakest;
}

function describeThreshold(threshold: (typeof GATES)[GateId]['threshold']): string {
  switch (threshold.kind) {
    case 'all_pass':
      return '100% pass';
    case 'ratio':
      return `>= ${(threshold.minimum * 100).toFixed(1)}% pass`;
    case 'max_findings':
      return `<= ${threshold.maximum} open findings`;
  }
}

/** Payload-level pass conditions that a status field alone would not capture. */
function payloadPasses(payload: EvidencePayload): boolean {
  switch (payload.kind) {
    case 'rls':
      return payload.probes.length > 0 && payload.probes.every((probe) => probe.expected === probe.actual);
    case 'negative':
      return payload.probes.length > 0 && payload.probes.every((probe) => probe.actual === probe.expected);
    case 'lineage':
      return payload.missingLinks.length === 0 && payload.reconstructionPercent >= 100;
    case 'agent_security':
      return payload.unauthorizedGrants === 0 && (!payload.humanApprovalRequired || payload.humanApprovalPresent);
    case 'secret_scan':
      return payload.findings.every((finding) => finding.remediationState !== 'open');
    case 'dependency':
      return payload.criticalFindings === 0 && payload.reachableFindings === 0;
    case 'backup_restore':
      return (
        payload.recordsRecovered >= payload.recordsExpected &&
        payload.integrityChecksPassed &&
        payload.rlsChecksPassed &&
        payload.applicationValidationPassed &&
        !payload.usedProductionData
      );
    case 'rollback':
      return (
        payload.schemaBackwardCompatible &&
        payload.applicationHealthPassed &&
        payload.dataIntegrityPassed &&
        payload.authorizationPassed
      );
    case 'mobile':
      return (
        payload.failed === 0 &&
        payload.crashes === 0 &&
        payload.authenticationResult === 'pass' &&
        payload.authorizationResult === 'pass' &&
        payload.offlineResult === 'pass' &&
        payload.syncResult === 'pass'
      );
    case 'test_suite':
      return payload.failed === 0;
    case 'model_evaluation':
      return payload.safetyFailures === 0;
    case 'agent_evaluation':
      return payload.policyViolations === 0;
    default:
      return true;
  }
}

export function createEvidenceLedger(options?: LedgerOptions): EvidenceLedger {
  return new EvidenceLedger(options);
}

export type { ExecutorType };
