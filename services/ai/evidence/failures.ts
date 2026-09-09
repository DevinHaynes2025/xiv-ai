import { refuse } from '../civilization/errors';
import { requireMember, requireRecord, visibleTo, type EvidenceState } from './store';
import type { EvidenceActor, EvidenceFailure, Severity } from './types';

// Section 53 — failures do not disappear because a rerun went green.
//
// The behaviour this is written against is universal and entirely human: a test
// fails, someone reruns it, it passes, and the incident is never spoken of
// again. What is lost is the only interesting datum in the whole exchange —
// that the system produced a wrong answer once under conditions nobody
// characterised. Recording it turns flakiness from folklore into a list.

export type RecordFailureInput = {
  gateKey?: string | null;
  evidenceId?: string | null;
  testSuite: string;
  testCase: string;
  commitSha: string;
  environment: string;
  failure: string;
  severity: Severity;
  ownerId: string;
};

export function recordFailure(
  state: EvidenceState,
  actor: EvidenceActor,
  input: RecordFailureInput,
): EvidenceFailure {
  requireMember(state, actor);
  const gate = input.gateKey
    ? state.gates.find((g) => g.gateKey === input.gateKey && g.universeId === actor.universeId)
    : null;
  if (input.gateKey && !gate) refuse('gate_unknown', input.gateKey);
  if (input.evidenceId) requireRecord(state, actor.universeId, input.evidenceId);

  const failure: EvidenceFailure = {
    id: state.nextId(),
    universeId: actor.universeId,
    organizationId: state.organizationOf(actor.universeId),
    gateId: gate?.id ?? null,
    evidenceId: input.evidenceId ?? null,
    testSuite: input.testSuite,
    testCase: input.testCase,
    commitSha: input.commitSha,
    environment: input.environment,
    failure: input.failure,
    severity: input.severity,
    ownerId: input.ownerId,
    rootCause: null,
    remediation: null,
    fixCommit: null,
    retestEvidenceId: null,
    verification: null,
    closedAt: null,
    createdAt: state.clock(),
  };
  state.failures.push(failure);
  return failure;
}

export type CloseFailureInput = {
  failureId: string;
  rootCause: string;
  remediation: string;
  fixCommit: string;
  retestEvidenceId: string;
  verification: string;
};

// Closing requires the retest to exist as its own evidence record, at the commit
// that claims to fix it. "It passes now" is not a closure; a passing artifact
// against the fix commit is.
export function closeFailure(
  state: EvidenceState,
  actor: EvidenceActor,
  input: CloseFailureInput,
): EvidenceFailure {
  requireMember(state, actor);
  const failure = state.failures.find(
    (item) => item.id === input.failureId && item.universeId === actor.universeId,
  );
  if (!failure) refuse('failure_unknown', input.failureId);

  const retest = requireRecord(state, actor.universeId, input.retestEvidenceId);
  if (retest.status !== 'pass') {
    refuse('failure_closure_requires_retest', `${retest.id} is ${retest.status}`);
  }
  if (retest.code.commitSha !== input.fixCommit) {
    refuse(
      'failure_closure_requires_retest',
      `the retest ran against ${retest.code.commitSha} but the fix is claimed at ${input.fixCommit}`,
    );
  }
  for (const [field, value] of Object.entries({
    rootCause: input.rootCause,
    remediation: input.remediation,
    verification: input.verification,
  })) {
    if (!value.trim()) refuse('evidence_contract_field_missing', field);
  }

  failure.rootCause = input.rootCause;
  failure.remediation = input.remediation;
  failure.fixCommit = input.fixCommit;
  failure.retestEvidenceId = retest.id;
  failure.verification = input.verification;
  failure.closedAt = state.clock();
  return failure;
}

export function listFailures(state: EvidenceState, actor: EvidenceActor): EvidenceFailure[] {
  return visibleTo(state, actor, state.failures);
}

export function openFailures(state: EvidenceState, actor: EvidenceActor): EvidenceFailure[] {
  return listFailures(state, actor).filter((failure) => !failure.closedAt);
}
