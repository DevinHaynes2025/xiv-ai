import { refuse } from '../civilization/errors';
import { requireGate, requireSupervisor, visibleTo, type EvidenceState } from './store';
import type { EvidenceActor, EvidenceException, Severity } from './types';

// Section 54 — exception governance.
//
// An exception is XIV writing down that it knowingly shipped with a gap, who
// decided that, what they put in place instead and when the decision runs out.
// The value is entirely in the last part: an exception with no expiry is not an
// exception, it is a policy change nobody voted on.
//
// Five conditions can never be excepted. They are modelled as hardBlocker gates
// in gates.ts, and this module refuses to file against them at all rather than
// filing an exception that some later reader might treat as valid.

export const UNWAIVABLE = [
  'confirmed cross-tenant exposure',
  'Guardian bypass',
  'unauthorized production action',
  'unresolved exposed production secrets',
  'inability to stop a dangerous workload',
] as const;

export type FileExceptionInput = {
  gateKey: string;
  severity: Severity;
  risk: string;
  reason: string;
  scope: string;
  compensatingControl: string;
  ownerId: string;
  reviewerId: string;
  expiresAt: string;
};

export function fileException(
  state: EvidenceState,
  actor: EvidenceActor,
  input: FileExceptionInput,
): EvidenceException {
  requireSupervisor(state, actor);
  const gate = requireGate(state, actor.universeId, input.gateKey);

  if (gate.hardBlocker) {
    refuse(
      'exception_hard_blocker_not_waivable',
      `${gate.gateKey} covers ${UNWAIVABLE.join(' / ')} and no exception can waive it`,
    );
  }
  if (!input.compensatingControl.trim()) {
    refuse('exception_requires_compensating_control', gate.gateKey);
  }
  const expiry = Date.parse(input.expiresAt);
  if (Number.isNaN(expiry) || expiry <= Date.parse(state.clock())) {
    refuse('exception_requires_expiry', 'an exception must expire at a stated future moment');
  }
  if (input.ownerId === input.reviewerId) {
    refuse('verifier_must_be_independent', 'the owner of a gap cannot be the reviewer of its exception');
  }

  const exception: EvidenceException = {
    id: state.nextId(),
    universeId: actor.universeId,
    organizationId: state.organizationOf(actor.universeId),
    gateId: gate.id,
    severity: input.severity,
    risk: input.risk,
    reason: input.reason,
    scope: input.scope,
    compensatingControl: input.compensatingControl,
    ownerId: input.ownerId,
    reviewerId: input.reviewerId,
    // Filed pending. It does not cover anything until a person accepts it, which
    // is the difference between requesting an exception and having one.
    humanApproverId: null,
    approvalId: null,
    expiresAt: input.expiresAt,
    revokedAt: null,
    createdBy: actor.userId,
    createdAt: state.clock(),
  };
  state.exceptions.push(exception);
  return exception;
}

// Section 59. The human step, kept separate from filing so that no single call
// can both request and grant.
export function acceptException(
  state: EvidenceState,
  actor: EvidenceActor,
  input: { exceptionId: string; rationale: string; commitSha: string },
): EvidenceException {
  requireSupervisor(state, actor);
  const exception = state.exceptions.find(
    (item) => item.id === input.exceptionId && item.universeId === actor.universeId,
  );
  if (!exception) refuse('exception_unknown', input.exceptionId);
  if (exception.ownerId === actor.userId) {
    refuse('approver_must_be_independent', 'the owner of the gap cannot accept the risk of their own exception');
  }
  if (!input.rationale.trim()) refuse('evidence_contract_field_missing', 'rationale');

  exception.humanApproverId = actor.userId;
  return exception;
}

export function revokeException(
  state: EvidenceState,
  actor: EvidenceActor,
  input: { exceptionId: string; reason: string },
): EvidenceException {
  requireSupervisor(state, actor);
  const exception = state.exceptions.find(
    (item) => item.id === input.exceptionId && item.universeId === actor.universeId,
  );
  if (!exception) refuse('exception_unknown', input.exceptionId);
  exception.revokedAt = state.clock();
  return exception;
}

export function listExceptions(state: EvidenceState, actor: EvidenceActor): EvidenceException[] {
  return visibleTo(state, actor, state.exceptions);
}

export function expiringExceptions(
  state: EvidenceState,
  actor: EvidenceActor,
  withinMs: number,
): EvidenceException[] {
  const now = Date.parse(state.clock());
  return listExceptions(state, actor).filter(
    (exception) =>
      !exception.revokedAt &&
      Date.parse(exception.expiresAt) > now &&
      Date.parse(exception.expiresAt) - now <= withinMs,
  );
}
