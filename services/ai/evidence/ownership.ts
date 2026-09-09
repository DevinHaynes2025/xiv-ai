import { refuse } from '../civilization/errors';
import { freshnessOf } from './freshness';
import { atLeast, effectiveLevel, rankOf } from './levels';
import {
  requireGate,
  requireMember,
  requireRecord,
  requireSupervisor,
  visibleTo,
  type EvidenceState,
} from './store';
import type {
  ApprovalKind,
  EvidenceActor,
  EvidenceApproval,
  EvidenceLevel,
  EvidenceVerification,
  OwnershipState,
  ReleaseGate,
} from './types';

// Section 36 — OWNER, VERIFIER, APPROVER, GUARDIAN.
//
// The separation rule is the only part of this framework that cannot be
// satisfied by working harder. Everything else is a matter of producing better
// artifacts; this one requires a second party to exist. So it is enforced as a
// refusal rather than a warning, and the refusal names what is missing.

export const ROLE_DUTIES = {
  owner: 'Makes the capability work and produces the evidence.',
  verifier: 'Independently decides whether the evidence satisfies the criterion.',
  approver: 'The human who accepts residual risk or permits advancement.',
  guardian: 'Policy enforcement. May block execution or promotion, may not grant itself business authority.',
} as const;

export type VerifyInput = {
  recordId: string;
  verifierRole: string;
  verdict: 'satisfies' | 'insufficient' | 'contradicted';
  rationale: string;
  checkedCommitSha: string;
};

export function verify(state: EvidenceState, actor: EvidenceActor, input: VerifyInput): EvidenceVerification {
  requireMember(state, actor);
  const record = requireRecord(state, actor.universeId, input.recordId);

  // The heart of section 36. A party cannot certify its own work, and no amount
  // of care in the rationale changes that, so the check is on identity alone.
  if (record.primaryOwner === actor.userId) {
    refuse('verifier_must_be_independent', `${actor.userId} owns ${record.id} and cannot verify it`);
  }
  if (state.verifications.some((v) => v.evidenceId === record.id && v.verifierId === actor.userId)) {
    refuse('verifier_already_recorded', record.id);
  }
  if (!input.rationale.trim()) {
    refuse('evidence_contract_field_missing', 'rationale');
  }
  // Verifying a different revision than the one under test is the quiet way an
  // E4 claim becomes false, so the mismatch is refused rather than recorded.
  if (input.checkedCommitSha !== record.code.commitSha) {
    refuse(
      'evidence_commit_mismatch',
      `the record is for ${record.code.commitSha} but the review looked at ${input.checkedCommitSha}`,
    );
  }

  const verification: EvidenceVerification = {
    id: state.nextId(),
    universeId: actor.universeId,
    organizationId: state.organizationOf(actor.universeId),
    evidenceId: record.id,
    verifierId: actor.userId,
    verifierRole: input.verifierRole,
    verdict: input.verdict,
    rationale: input.rationale,
    checkedCommitSha: input.checkedCommitSha,
    verifiedAt: state.clock(),
  };
  state.verifications.push(verification);
  record.reviewer = actor.userId;
  return verification;
}

export type ApproveInput = {
  gateKey: string;
  approvalKind: ApprovalKind;
  decision: 'approved' | 'rejected';
  rationale: string;
  commitSha: string;
  residualRisk?: string | null;
};

// Section 59 and section 60's last line. An approval is a human act. There is no
// parameter on this function that lets a caller record one on somebody else's
// behalf, and no code path anywhere that creates one from a threshold being met.
export function approve(state: EvidenceState, actor: EvidenceActor, input: ApproveInput): EvidenceApproval {
  requireSupervisor(state, actor);
  const gate = requireGate(state, actor.universeId, input.gateKey);

  if (!input.rationale.trim()) {
    refuse('evidence_contract_field_missing', 'rationale');
  }

  if (gate.releaseCritical) {
    const ownedIt = state.records.some(
      (record) =>
        record.gateId === gate.id &&
        record.code.commitSha === input.commitSha &&
        record.primaryOwner === actor.userId,
    );
    if (ownedIt) {
      refuse('approver_must_be_independent', `${actor.userId} produced the evidence for ${gate.gateKey}`);
    }
    const verifiedIt = state.verifications.some((verification) => {
      const record = state.records.find((r) => r.id === verification.evidenceId);
      return (
        record?.gateId === gate.id &&
        record.code.commitSha === input.commitSha &&
        verification.verifierId === actor.userId
      );
    });
    if (verifiedIt) {
      refuse('approver_must_be_independent', `${actor.userId} verified the evidence for ${gate.gateKey}`);
    }
  }

  const approval: EvidenceApproval = {
    id: state.nextId(),
    universeId: actor.universeId,
    organizationId: state.organizationOf(actor.universeId),
    gateId: gate.id,
    approverId: actor.userId,
    approvalKind: input.approvalKind,
    decision: input.decision,
    rationale: input.rationale,
    commitSha: input.commitSha,
    residualRisk: input.residualRisk ?? null,
    decidedAt: state.clock(),
  };
  state.approvals.push(approval);
  return approval;
}

export type GateAssessment = {
  gate: ReleaseGate;
  state: OwnershipState;
  achievedLevel: EvidenceLevel | null;
  commitSha: string | null;
  reasons: string[];
};

// Section 56 — the one accountable state, computed.
//
// Order matters and is the policy itself. A failure outranks everything; a
// skipped mandatory test outranks a pile of passes beside it; nothing outranks
// the absence of an owner except an actual result. Each branch returns the
// reason as well as the state, because a dashboard that says EVIDENCE_PENDING
// without saying what is missing just moves the question somewhere else.
export function assessGate(
  state: EvidenceState,
  actor: EvidenceActor,
  gateKey: string,
  commitSha: string,
): GateAssessment {
  requireMember(state, actor);
  const gate = requireGate(state, actor.universeId, gateKey);
  const reasons: string[] = [];

  const forGate = state.records.filter((record) => record.gateId === gate.id);
  const atCommit = forGate.filter((record) => record.code.commitSha === commitSha);
  const live = atCommit.filter((record) => freshnessOf(state, record) !== 'SUPERSEDED');

  const verificationsFor = (recordId: string) => state.verifications.filter((v) => v.evidenceId === recordId);

  const blockers = unresolvedBlockersFor(state, gate);
  const passing = live.filter((record) => record.status === 'pass' && freshnessOf(state, record) === 'VALID');
  const achievedLevel = passing.reduce<EvidenceLevel | null>((best, record) => {
    const achieved = effectiveLevel(record.evidenceLevel, {
      verifiedAtSameCommit: verificationsFor(record.id).some(
        (v) => v.verdict === 'satisfies' && v.checkedCommitSha === commitSha,
      ),
      unresolvedBlockers: blockers,
    });
    if (!best || rankOf(achieved) > rankOf(best)) return achieved;
    return best;
  }, null);

  const done = (ownershipState: OwnershipState): GateAssessment => ({
    gate,
    state: ownershipState,
    achievedLevel,
    commitSha,
    reasons,
  });

  if (gate.unavailableReason) {
    reasons.push(gate.unavailableReason);
    return done('BLOCKED');
  }
  if (gate.blockedReason) {
    reasons.push(gate.blockedReason);
    return done('BLOCKED');
  }

  const failures = live.filter((record) => record.mandatory && (record.status === 'fail' || record.status === 'error'));
  if (failures.length > 0) {
    reasons.push(`${failures.length} mandatory test(s) failed: ${failures.map((f) => f.testCase).join(', ')}`);
    return done('FAIL');
  }

  // Section 39. A mandatory test that did not run is not a pass, and hiding it
  // behind an aggregate is the single easiest way to ship an unproven gate.
  const skipped = live.filter(
    (record) => record.mandatory && (record.status === 'skipped' || record.status === 'blocked'),
  );
  if (skipped.length > 0) {
    reasons.push(`${skipped.length} mandatory test(s) did not run: ${skipped.map((s) => s.testCase).join(', ')}`);
    return done('EVIDENCE_PENDING');
  }

  if (!gate.assignedOwnerId) {
    reasons.push('no owner is accountable for this criterion');
    return done('UNASSIGNED');
  }

  const activeException = state.exceptions.find(
    (exception) =>
      exception.gateId === gate.id &&
      !exception.revokedAt &&
      Date.parse(exception.expiresAt) > Date.parse(state.clock()) &&
      exception.humanApproverId !== null,
  );
  const pendingException = state.exceptions.find(
    (exception) => exception.gateId === gate.id && !exception.revokedAt && exception.humanApproverId === null,
  );

  if (passing.length === 0) {
    const stale = live.filter((record) => freshnessOf(state, record) === 'STALE');
    if (stale.length > 0) {
      reasons.push(`${stale.length} result(s) at this commit have gone stale and must be retaken`);
      return done('STALE');
    }
    if (forGate.length > 0) {
      reasons.push(`evidence exists for other commits but none for ${commitSha.slice(0, 12)}`);
    } else {
      reasons.push('no evidence has been produced');
    }
    if (activeException) {
      reasons.push(`covered by exception ${activeException.id} until ${activeException.expiresAt}`);
      return done('EXCEPTION_APPROVED');
    }
    if (pendingException) return done('EXCEPTION_PENDING');
    return done(forGate.length > 0 ? 'EVIDENCE_PENDING' : 'ASSIGNED');
  }

  if (!achievedLevel || !atLeast(achievedLevel, gate.requiredEvidenceLevel)) {
    reasons.push(`the strongest evidence is ${achievedLevel ?? 'none'} but this gate requires ${gate.requiredEvidenceLevel}`);
    if (activeException) {
      reasons.push(`covered by exception ${activeException.id} until ${activeException.expiresAt}`);
      return done('EXCEPTION_APPROVED');
    }
    if (pendingException) return done('EXCEPTION_PENDING');
    if (blockers > 0) {
      reasons.push(`${blockers} unresolved blocker(s) hold this evidence below the level the gate needs`);
      return done('EVIDENCE_PENDING');
    }
    // A gate short of E4 with an E3 artifact in hand is not waiting for anyone
    // to run anything. It is waiting for a reviewer, and saying EVIDENCE_PENDING
    // would send the owner back to work that is already done.
    const closableByReview = passing.some((record) =>
      atLeast(
        effectiveLevel(record.evidenceLevel, { verifiedAtSameCommit: true, unresolvedBlockers: 0 }),
        gate.requiredEvidenceLevel,
      ),
    );
    if (closableByReview) {
      reasons.push('only an independent review stands between the artifact and the level this gate needs');
      return done('VERIFICATION_PENDING');
    }
    return done('EVIDENCE_PENDING');
  }

  const contradicted = passing.some((record) =>
    verificationsFor(record.id).some((v) => v.verdict === 'insufficient' || v.verdict === 'contradicted'),
  );
  if (contradicted) {
    reasons.push('an independent reviewer found the evidence insufficient or contradicted');
    return done('FAIL');
  }

  if (rankOf(gate.requiredEvidenceLevel) >= rankOf('E3')) {
    const satisfied = passing.some((record) =>
      verificationsFor(record.id).some((v) => v.verdict === 'satisfies' && v.checkedCommitSha === commitSha),
    );
    if (!satisfied) {
      reasons.push('no independent verifier has confirmed the evidence at this commit');
      return done('VERIFICATION_PENDING');
    }
  }

  if (gate.humanApprovalRule === 'required' || gate.humanApprovalRule === 'ceo') {
    const approved = state.approvals.some(
      (approval) =>
        approval.gateId === gate.id && approval.commitSha === commitSha && approval.decision === 'approved',
    );
    if (!approved) {
      reasons.push(
        gate.humanApprovalRule === 'ceo'
          ? 'awaiting CEO or separately authorized human approval'
          : 'awaiting human approval',
      );
      return done('VERIFICATION_PENDING');
    }
  }

  reasons.push('evidence produced, independently verified where required, and fresh');
  return done('PASS');
}

// A blocker is an open, high or critical failure recorded against the gate and
// not yet closed. Section 35 forbids E4 while any of those is outstanding.
export function unresolvedBlockersFor(state: EvidenceState, gate: ReleaseGate): number {
  return state.failures.filter(
    (failure) =>
      failure.gateId === gate.id &&
      !failure.closedAt &&
      (failure.severity === 'high' || failure.severity === 'critical'),
  ).length;
}

export function listVerifications(state: EvidenceState, actor: EvidenceActor): EvidenceVerification[] {
  return visibleTo(state, actor, state.verifications);
}

export function listApprovals(state: EvidenceState, actor: EvidenceActor): EvidenceApproval[] {
  return visibleTo(state, actor, state.approvals);
}
