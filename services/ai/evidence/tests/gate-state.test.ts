import assert from 'node:assert/strict';
import test from 'node:test';
import { MANDATORY_GATES } from '../gates';
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
 * Sections 53, 54, 55, 56 and 57: how a gate moves between states, what an
 * exception can and cannot cover, and what makes passing evidence stop
 * counting.
 */

test('section 56: a gate walks from UNASSIGNED to PASS and never skips a step', () => {
  const ledger = newLedger();
  assert.equal(ledger.gateState('rls'), 'UNASSIGNED');

  expectOk(ledger.assignGate(guardian, { gateId: 'rls', owner: 'database_owner', verifier: 'security_reviewer' }), 'assign');
  assert.equal(ledger.gateState('rls'), 'ASSIGNED');

  const evidence = expectOk(
    ledger.recordEvidence(ci, {
      criterion: 'rls',
      commit: COMMIT,
      environment: 'ci',
      testSuite: 'rls/isolation',
      testCase: 'policy matrix',
      testVersion: '1',
      expectedResult: 'deny across tenants',
      actualResult: 'deny across tenants',
      status: 'pass',
      startedAt: '2026-01-01T00:00:00.000Z',
      completedAt: '2026-01-01T00:00:01.000Z',
      primaryOwner: 'database_owner',
      payload: cleanRlsProbes(),
      reproducibleCommand: 'npm run test:rls',
    }),
    'record',
  ).record;
  assert.equal(ledger.gateState('rls'), 'VERIFICATION_PENDING');

  expectOk(
    ledger.verifyEvidence(actor('security_reviewer', { roles: ['verifier'] }), {
      evidenceId: evidence.evidenceId,
      verdict: 'satisfies',
      note: 'reproduced',
    }),
    'verify',
  );
  assert.equal(ledger.gateState('rls'), 'PASS');
});

test('section 40: an RLS probe that returns rows it should not fails the gate', () => {
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
          // The row count is what makes this evidence rather than an assertion.
          actual: 'allow',
          rowsReturned: 4,
        },
      ],
    },
  });

  // The suite reported a pass, but the probe matrix contradicts it. The payload
  // is the evidence, so the payload decides.
  assert.equal(ledger.gateState('rls'), 'EVIDENCE_PENDING');
});

test('section 55: a schema change stales RLS evidence without deleting it', () => {
  const ledger = newLedger();
  const evidence = fullyEvidence(ledger, {
    criterion: 'rls',
    payload: cleanRlsProbes(),
    owner: 'database_owner',
    verifier: 'security_reviewer',
  });
  assert.equal(ledger.gateState('rls'), 'PASS');

  const { staled } = ledger.applyChange('schema');
  assert.deepEqual(staled, [evidence.evidenceId]);
  assert.equal(ledger.gateState('rls'), 'STALE');
  assert.equal(ledger.freshnessOf(evidence.evidenceId), 'stale');
  // Section 58: stale evidence is reported as unavailable, not as a pass.
  assert.equal(ledger.founderBriefStatus('rls').status, 'UNAVAILABLE');

  // A change the record is not sensitive to leaves it alone.
  const fresh = newLedger();
  fullyEvidence(fresh, { criterion: 'rls', payload: cleanRlsProbes(), owner: 'db', verifier: 'sec' });
  assert.deepEqual(fresh.applyChange('mobile_build').staled, []);
  assert.equal(fresh.gateState('rls'), 'PASS');
});

test('section 54: an exception carries a compensating control and an expiry', () => {
  const ledger = newLedger();
  const noControl = expectDenied(
    ledger.openException(actor('platform_owner'), {
      criterion: 'cost_governance',
      severity: 'medium',
      risk: 'cost telemetry is estimated rather than billed',
      reason: 'no billing integration yet',
      scope: 'staging only',
      compensatingControl: '   ',
      owner: 'platform_owner',
      expiresAt: '2026-03-01T00:00:00.000Z',
    }),
    'exception with no compensating control',
  );
  assert.equal(noControl.code, 'exception_not_permitted');

  const expired = expectDenied(
    ledger.openException(actor('platform_owner'), {
      criterion: 'cost_governance',
      severity: 'medium',
      risk: 'cost telemetry is estimated',
      reason: 'no billing integration yet',
      scope: 'staging only',
      compensatingControl: 'weekly manual reconciliation against the cloud invoice',
      owner: 'platform_owner',
      expiresAt: '2020-01-01T00:00:00.000Z',
    }),
    'exception expiring in the past',
  );
  assert.equal(expired.code, 'exception_expired');
});

test('section 54: cross-tenant exposure can never be waived', () => {
  const ledger = newLedger();
  const denied = expectDenied(
    ledger.openException(actor('platform_owner'), {
      criterion: 'tenant_isolation',
      severity: 'critical',
      risk: 'one universe can read another',
      reason: 'ship deadline',
      scope: 'production',
      compensatingControl: 'we will watch the logs',
      owner: 'platform_owner',
      expiresAt: '2026-03-01T00:00:00.000Z',
      unwaivable: 'cross_tenant_exposure',
    }),
    'waiving cross-tenant exposure',
  );
  assert.equal(denied.code, 'exception_not_permitted');
  assert.match(denied.message, /blocks release outright/);
});

test('section 54: an approved exception moves a gate to EXCEPTION_APPROVED, not PASS', () => {
  const ledger = newLedger();
  fullyEvidence(ledger, {
    criterion: 'cost_governance',
    owner: 'finops_owner',
    verifier: 'platform_reviewer',
    status: 'skipped',
    payload: {
      kind: 'cost',
      workloadCount: 0,
      agentCount: 0,
      activeAgentCount: 0,
      modelCalls: 0,
      tokens: 0,
      cpuMillis: 0,
      gpuMillis: 0,
      storageMb: 0,
      networkMb: 0,
      estimatedCostUsd: 0,
      attributableCostUsd: null,
      costPerTaskUsd: 0,
      costPerSuccessfulTaskUsd: null,
    },
  });
  assert.equal(ledger.gateState('cost_governance'), 'BLOCKED');

  const exception = expectOk(
    ledger.openException(actor('finops_owner'), {
      criterion: 'cost_governance',
      severity: 'medium',
      risk: 'no billing source is connected in the queued architecture',
      reason: '62D does not purchase compute',
      scope: 'queued architecture only',
      compensatingControl: 'modelled cost estimates are recorded per workload and reviewed at 62E',
      owner: 'finops_owner',
      expiresAt: '2026-06-01T00:00:00.000Z',
    }),
    'openException',
  ).exception;
  assert.equal(ledger.gateState('cost_governance'), 'EXCEPTION_PENDING');

  const selfApproval = expectDenied(
    ledger.reviewException(actor('finops_owner', { roles: ['approver'] }), {
      exceptionId: exception.exceptionId,
      decision: 'approved',
      note: 'approving my own exception',
    }),
    'self-approved exception',
  );
  assert.equal(selfApproval.code, 'separation_of_duties');

  expectOk(
    ledger.reviewException(guardian, { exceptionId: exception.exceptionId, decision: 'approved', note: 'accepted for 62D' }),
    'reviewException',
  );
  assert.equal(ledger.gateState('cost_governance'), 'EXCEPTION_APPROVED');
});

test('section 53: a failure closes only on passing retest evidence bound to the fix commit', () => {
  const ledger = newLedger();
  fullyEvidence(ledger, {
    criterion: 'failure_recovery',
    payload: passingSuite(),
    owner: 'sre_owner',
    verifier: 'qa_verifier',
  });
  fullyEvidence(ledger, {
    criterion: 'failure_recovery',
    payload: refusalProbes(),
    owner: 'sre_owner',
    verifier: 'qa_verifier',
  });
  assert.equal(ledger.gateState('failure_recovery'), 'PASS');

  const failure = expectOk(
    ledger.recordFailure(ci, {
      test: 'recovery.test.ts consequential actions are never replayed',
      criterion: 'failure_recovery',
      commitSha: COMMIT.commitSha,
      environment: 'ci',
      failure: 'a held workload was rescheduled onto a second node',
      severity: 'critical',
      owner: 'sre_owner',
    }),
    'recordFailure',
  ).failure;

  // An open critical failure holds the gate down even though the evidence
  // itself passed.
  assert.equal(ledger.gateState('failure_recovery'), 'FAIL');

  const fixCommit = 'aa11bb22cc33dd44ee55ff6677889900aabbccdd';
  const wrongCommit = expectDenied(
    ledger.closeFailure(actor('qa_verifier', { roles: ['verifier'] }), {
      failureId: failure.failureId,
      rootCause: 'scheduleWorkload did not check held status',
      remediation: 'refuse to schedule held work',
      fixCommit,
      retestEvidenceId: ledger.currentEvidence('failure_recovery')[0]!.evidenceId,
    }),
    'closing against evidence from the wrong commit',
  );
  assert.equal(wrongCommit.code, 'commit_binding_mismatch');

  const retest = expectOk(
    ledger.recordEvidence(ci, {
      criterion: 'failure_recovery',
      commit: { ...COMMIT, commitSha: fixCommit },
      environment: 'ci',
      testSuite: 'runtime/tests/recovery.test.ts',
      testCase: 'held work cannot be rescheduled',
      testVersion: '2',
      expectedResult: 'consequential_replay_blocked',
      actualResult: 'consequential_replay_blocked',
      status: 'pass',
      startedAt: '2026-01-02T00:00:00.000Z',
      completedAt: '2026-01-02T00:00:01.000Z',
      primaryOwner: 'sre_owner',
      payload: refusalProbes(),
      reproducibleCommand: 'npm test --prefix services/ai',
    }),
    'retest evidence',
  ).record;

  const ownerClosing = expectDenied(
    ledger.closeFailure(actor('sre_owner', { roles: ['owner'] }), {
      failureId: failure.failureId,
      rootCause: 'missing status check',
      remediation: 'added the check',
      fixCommit,
      retestEvidenceId: retest.evidenceId,
    }),
    'owner closing their own failure',
  );
  assert.equal(ownerClosing.code, 'separation_of_duties');

  const closed = expectOk(
    ledger.closeFailure(actor('qa_verifier', { roles: ['verifier'] }), {
      failureId: failure.failureId,
      rootCause: 'scheduleWorkload did not check held status',
      remediation: 'refuse to schedule held work and require an explicit human release',
      fixCommit,
      retestEvidenceId: retest.evidenceId,
    }),
    'closeFailure',
  ).failure;

  assert.equal(closed.verifiedBy, 'qa_verifier');
  assert.equal(closed.retestEvidenceId, retest.evidenceId);
});

test('section 57: the dashboard shows TBD for gates with no evidence and never reads as pass', () => {
  const ledger = newLedger();
  fullyEvidence(ledger, {
    criterion: 'kill_switch',
    payload: refusalProbes(),
    owner: 'runtime_owner',
    verifier: 'security_reviewer',
  });

  const rows = ledger.dashboard();
  const killSwitch = rows.find((row) => row.criterion === 'kill_switch')!;
  assert.equal(killSwitch.result, 'PASS');
  assert.equal(killSwitch.evidenceLevel, 'E4');
  assert.equal(killSwitch.freshness, 'valid');

  const untouched = rows.filter((row) => row.criterion !== 'kill_switch');
  assert.ok(untouched.every((row) => row.freshness === 'TBD'));
  assert.ok(untouched.every((row) => row.result !== 'PASS'));
  assert.ok(untouched.every((row) => row.evidenceLevel === 'E0'));

  const readiness = ledger.releaseReadiness();
  assert.equal(readiness.ready, false);
  assert.equal(readiness.blockers.length, MANDATORY_GATES.length - 1);
});

test('section 57: thresholds are evaluated from the payload, not from a green checkmark', () => {
  const ledger = newLedger();

  // compute_routing allows a 99.9% pass ratio rather than demanding perfection.
  fullyEvidence(ledger, {
    criterion: 'compute_routing',
    owner: 'runtime_owner',
    verifier: 'qa_verifier',
    payload: passingSuite({ passed: 998, failed: 2, cases: [] }),
  });
  assert.equal(ledger.gateState('compute_routing'), 'EVIDENCE_PENDING');

  const better = newLedger();
  fullyEvidence(better, {
    criterion: 'compute_routing',
    owner: 'runtime_owner',
    verifier: 'qa_verifier',
    payload: passingSuite({ passed: 1000, failed: 0, cases: [] }),
  });
  assert.equal(better.gateState('compute_routing'), 'PASS');
});

test('section 47: an open secret finding blocks its gate; a remediated one does not', () => {
  const ledger = newLedger();
  fullyEvidence(ledger, {
    criterion: 'secret_scanning',
    owner: 'security_owner',
    verifier: 'platform_reviewer',
    payload: {
      kind: 'secret_scan',
      scanner: 'gitleaks',
      scannerVersion: '8.0.0',
      scope: 'repository',
      filesScanned: 900,
      findingsBySeverity: { critical: 1, high: 0, medium: 0, low: 0 },
      findings: [
        { credentialType: 'provider api key', locationCategory: 'service env file', severity: 'critical', remediationState: 'open' },
      ],
      suppressedFindings: 0,
      suppressionReason: null,
    },
  });
  assert.equal(ledger.gateState('secret_scanning'), 'EVIDENCE_PENDING');

  const remediated = newLedger();
  fullyEvidence(remediated, {
    criterion: 'secret_scanning',
    owner: 'security_owner',
    verifier: 'platform_reviewer',
    payload: {
      kind: 'secret_scan',
      scanner: 'gitleaks',
      scannerVersion: '8.0.0',
      scope: 'repository',
      filesScanned: 900,
      findingsBySeverity: { critical: 0, high: 0, medium: 0, low: 1 },
      findings: [
        {
          credentialType: 'provider api key',
          locationCategory: 'service env file',
          severity: 'low',
          remediationState: 'remediated',
        },
      ],
      suppressedFindings: 0,
      suppressionReason: null,
    },
  });
  assert.equal(remediated.gateState('secret_scanning'), 'PASS');
});
