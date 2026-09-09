import assert from 'node:assert/strict';
import test from 'node:test';
import {
  COMMIT,
  actor,
  ci,
  cleanRlsProbes,
  expectDenied,
  expectOk,
  fullyEvidence,
  guardian,
  newLedger,
  passingSuite,
  refusalProbes,
} from './fixtures';

/**
 * The ways a gate could be talked into passing without the evidence to back it.
 * Each of these was reachable in the first cut of the ledger.
 */

test('section 35: writing a stronger level onto a stored record does not move its gate', () => {
  const ledger = newLedger();
  const record = expectOk(
    ledger.recordEvidence(ci, {
      criterion: 'rls',
      commit: COMMIT,
      environment: 'ci',
      testSuite: 'rls/isolation',
      testCase: 'policy matrix',
      testVersion: '1',
      expectedResult: 'deny',
      actualResult: 'deny',
      status: 'pass',
      startedAt: '2026-01-01T00:00:00.000Z',
      completedAt: '2026-01-01T00:00:01.000Z',
      primaryOwner: 'database_owner',
      payload: cleanRlsProbes(),
      reproducibleCommand: 'npm run test:rls',
    }),
    'recordEvidence',
  ).record;

  // rls requires E4, and nobody has verified this.
  assert.equal(ledger.gateState('rls'), 'VERIFICATION_PENDING');

  (ledger.getEvidence(record.evidenceId) as { level: string }).level = 'E4';

  // The stored field is a convenience for serialization. Strength is re-derived
  // from the record's own contents on every read.
  assert.equal(ledger.gateState('rls'), 'VERIFICATION_PENDING');
  assert.equal(ledger.dashboard().find((row) => row.criterion === 'rls')!.evidenceLevel, 'E3');
});

test('section 36: an approval does not carry forward to the evidence that replaced it', () => {
  const ledger = newLedger();
  const first = fullyEvidence(ledger, {
    criterion: 'rollback',
    owner: 'release_owner',
    verifier: 'sre_verifier',
    payload: {
      kind: 'rollback',
      candidateVersion: '62d.1.0',
      knownGoodVersion: '62d.0.9',
      trigger: 'elevated error rate',
      procedure: 'documented canary rollback',
      startedAt: '2026-01-01T00:00:00.000Z',
      recoveredAt: '2026-01-01T00:03:10.000Z',
      schemaBackwardCompatible: true,
      applicationHealthPassed: true,
      dataIntegrityPassed: true,
      authorizationPassed: true,
    },
  });
  assert.equal(ledger.gateState('rollback'), 'PASS');

  // A second drill on a later build supersedes the approved one.
  const second = expectOk(
    ledger.recordEvidence(ci, {
      criterion: 'rollback',
      commit: { ...COMMIT, commitSha: 'bb22cc33dd44ee55ff6677889900aabbccddeeff' },
      environment: 'staging',
      testSuite: 'suite/rollback',
      testCase: 'rollback-rollback',
      testVersion: '2',
      expectedResult: 'recovered',
      actualResult: 'recovered',
      status: 'pass',
      startedAt: '2026-01-02T00:00:00.000Z',
      completedAt: '2026-01-02T00:04:00.000Z',
      primaryOwner: 'release_owner',
      payload: {
        kind: 'rollback',
        candidateVersion: '62d.2.0',
        knownGoodVersion: '62d.1.0',
        trigger: 'elevated error rate',
        procedure: 'documented canary rollback',
        startedAt: '2026-01-02T00:00:00.000Z',
        recoveredAt: '2026-01-02T00:03:40.000Z',
        schemaBackwardCompatible: true,
        applicationHealthPassed: true,
        dataIntegrityPassed: true,
        authorizationPassed: true,
      },
      reproducibleCommand: 'ops/rollback-drill.sh',
    }),
    'second drill',
  ).record;
  expectOk(
    ledger.verifyEvidence(actor('sre_verifier', { roles: ['verifier'] }), {
      evidenceId: second.evidenceId,
      verdict: 'satisfies',
      note: 'watched the second drill',
    }),
    'verify the second drill',
  );

  assert.equal(ledger.getEvidence(first.evidenceId)?.supersededBy, second.evidenceId);
  assert.equal(ledger.gateState('rollback'), 'VERIFICATION_PENDING', 'the new drill needs its own approval');

  expectOk(
    ledger.approveGate(actor('release_manager', { roles: ['approver'], authority: 'release_manager' }), {
      gateId: 'rollback',
      evidenceId: second.evidenceId,
      decision: 'approved',
      note: 'second drill reviewed',
    }),
    'approve the second drill',
  );
  assert.equal(ledger.gateState('rollback'), 'PASS');
});

test('section 54: an unwaivable condition is detected from the evidence, not from the request', () => {
  const ledger = newLedger();
  fullyEvidence(ledger, {
    criterion: 'rls',
    owner: 'database_owner',
    verifier: 'security_reviewer',
    payload: {
      kind: 'rls',
      probes: [
        {
          table: 'xiv_compute_workloads',
          testIdentity: 'member_of_org_alpha',
          identityState: 'authenticated',
          operation: 'select',
          sourceTenant: 'org_alpha',
          targetTenant: 'org_beta',
          expected: 'deny',
          actual: 'allow',
          rowsReturned: 4,
        },
      ],
    },
  });

  // The requester simply omits the unwaivable flag.
  const denied = expectDenied(
    ledger.openException(actor('database_owner'), {
      criterion: 'rls',
      severity: 'low',
      risk: 'a policy edge case in one table',
      reason: 'shipping the rest of the release',
      scope: 'one table',
      compensatingControl: 'we will monitor query logs',
      owner: 'database_owner',
      expiresAt: '2026-06-01T00:00:00.000Z',
    }),
    'exception hiding a cross-tenant read',
  );
  assert.equal(denied.code, 'exception_not_permitted');
  assert.match(denied.message, /cross_tenant_exposure/);
});

test('section 54: a refusal that did not hold cannot be waived either', () => {
  const ledger = newLedger();
  fullyEvidence(ledger, {
    criterion: 'kill_switch',
    owner: 'runtime_owner',
    verifier: 'security_reviewer',
    payload: {
      kind: 'negative',
      probes: [
        {
          scenario: 'operator stops a running agent',
          attempted: 'stopAgent',
          expected: 'terminated',
          actual: 'allowed',
          denialCode: null,
        },
      ],
    },
  });

  const denied = expectDenied(
    ledger.openException(actor('runtime_owner'), {
      criterion: 'kill_switch',
      severity: 'medium',
      risk: 'the stop path is flaky under load',
      reason: 'we will fix it next iteration',
      scope: 'staging',
      compensatingControl: 'operators can pause the node instead',
      owner: 'runtime_owner',
      expiresAt: '2026-06-01T00:00:00.000Z',
    }),
    'exception over an unstoppable workload',
  );
  assert.equal(denied.code, 'exception_not_permitted');
  assert.match(denied.message, /cannot_stop_dangerous_workload/);
});

test('section 54: an exception on a gate with no hard blocker is still available', () => {
  const ledger = newLedger();
  fullyEvidence(ledger, {
    criterion: 'rls',
    payload: cleanRlsProbes(),
    owner: 'database_owner',
    verifier: 'security_reviewer',
  });

  const exception = expectOk(
    ledger.openException(actor('database_owner'), {
      criterion: 'rls',
      severity: 'low',
      risk: 'the policy matrix does not yet cover storage buckets',
      reason: 'storage is not exposed in 62D',
      scope: 'storage policies only',
      compensatingControl: 'buckets remain unexposed until the matrix covers them',
      owner: 'database_owner',
      expiresAt: '2026-06-01T00:00:00.000Z',
    }),
    'openException',
  ).exception;
  expectOk(
    ledger.reviewException(guardian, { exceptionId: exception.exceptionId, decision: 'approved', note: 'accepted' }),
    'reviewException',
  );
  assert.equal(exception.state, 'approved');
});

test('section 53: a failure cannot be closed with a retest from a different criterion', () => {
  const ledger = newLedger();
  const failure = expectOk(
    ledger.recordFailure(ci, {
      test: 'offline.test.ts results exceeding the grant are rejected',
      criterion: 'offline_mode',
      commitSha: COMMIT.commitSha,
      environment: 'ci',
      failure: 'an over-budget offline result was accepted',
      severity: 'high',
      owner: 'runtime_owner',
    }),
    'recordFailure',
  ).failure;

  const unrelated = expectOk(
    ledger.recordEvidence(ci, {
      criterion: 'kill_switch',
      commit: COMMIT,
      environment: 'ci',
      testSuite: 'runtime/tests/kill-switch.test.ts',
      testCase: 'quarantine',
      testVersion: '1',
      expectedResult: 'terminated',
      actualResult: 'terminated',
      status: 'pass',
      startedAt: '2026-01-01T00:00:00.000Z',
      completedAt: '2026-01-01T00:00:01.000Z',
      primaryOwner: 'runtime_owner',
      payload: refusalProbes(),
    }),
    'unrelated evidence',
  ).record;

  const denied = expectDenied(
    ledger.closeFailure(actor('qa_verifier', { roles: ['verifier'] }), {
      failureId: failure.failureId,
      rootCause: 'grant audit was not applied to sync results',
      remediation: 'audit the results against the grant',
      fixCommit: COMMIT.commitSha,
      retestEvidenceId: unrelated.evidenceId,
    }),
    'closing with evidence for another gate',
  );
  assert.equal(denied.code, 'failure_unresolved');
  assert.match(denied.message, /covers kill_switch, not offline_mode/);
});

test('section 58: automation cannot report a status on a gate at all', () => {
  const ledger = newLedger();
  fullyEvidence(ledger, {
    criterion: 'kill_switch',
    payload: refusalProbes(),
    owner: 'runtime_owner',
    verifier: 'security_reviewer',
  });

  const denied = expectDenied(
    ledger.claimStatus(ci, { criterion: 'kill_switch', status: 'VERIFIED' }),
    'ci reporting a status',
  );
  assert.equal(denied.code, 'automation_cannot_approve');
  assert.equal(ledger.reportedStatus('kill_switch'), null);
});

test('section 53: a blocker opened after verification pulls the level back down', () => {
  const ledger = newLedger();
  fullyEvidence(ledger, {
    criterion: 'compute_routing',
    owner: 'runtime_owner',
    verifier: 'qa_verifier',
    payload: passingSuite({ passed: 1000, failed: 0, cases: [] }),
  });
  assert.equal(ledger.gateState('compute_routing'), 'PASS');
  assert.equal(ledger.dashboard().find((row) => row.criterion === 'compute_routing')!.evidenceLevel, 'E4');

  expectOk(
    ledger.recordFailure(ci, {
      test: 'router placed a confidential workload on a shared host',
      criterion: 'compute_routing',
      commitSha: COMMIT.commitSha,
      environment: 'staging',
      failure: 'placement ignored the dedicated tenancy floor',
      severity: 'critical',
      owner: 'runtime_owner',
    }),
    'recordFailure',
  );

  assert.equal(ledger.gateState('compute_routing'), 'FAIL');
  // E4 requires no open blocker, so the level falls with the gate rather than
  // staying at the strength it had when it was verified.
  assert.equal(ledger.dashboard().find((row) => row.criterion === 'compute_routing')!.evidenceLevel, 'E3');
});
