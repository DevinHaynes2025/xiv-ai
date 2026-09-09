import assert from 'node:assert/strict';
import test from 'node:test';
import { CEO_RESERVED_DECISIONS } from '../ledger';
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
 * Sections 36, 56, 59 and 60: who may claim a gate, who may confirm it and
 * which acts stay with a person.
 */

function record(ledger: ReturnType<typeof newLedger>, owner = 'database_owner') {
  return expectOk(
    ledger.recordEvidence(ci, {
      criterion: 'rls',
      commit: COMMIT,
      environment: 'ci',
      testSuite: 'rls/isolation',
      testCase: 'cross-tenant select',
      testVersion: '1',
      expectedResult: 'deny',
      actualResult: 'deny',
      status: 'pass',
      startedAt: '2026-01-01T00:00:00.000Z',
      completedAt: '2026-01-01T00:00:01.000Z',
      primaryOwner: owner,
      payload: cleanRlsProbes(),
      reproducibleCommand: 'npm run test:rls',
    }),
    'recordEvidence',
  ).record;
}

test('section 36: the owner of a criterion cannot be its independent verifier', () => {
  const ledger = newLedger();
  const evidence = record(ledger, 'database_owner');

  const denied = expectDenied(
    ledger.verifyEvidence(actor('database_owner', { roles: ['owner', 'verifier'] }), {
      evidenceId: evidence.evidenceId,
      verdict: 'satisfies',
      note: 'looks right to me',
    }),
    'self-verification',
  );
  assert.equal(denied.code, 'separation_of_duties');
  assert.equal(ledger.gateState('rls'), 'VERIFICATION_PENDING');

  expectOk(
    ledger.verifyEvidence(actor('security_reviewer', { roles: ['verifier'] }), {
      evidenceId: evidence.evidenceId,
      verdict: 'satisfies',
      note: 'reproduced against the same commit',
    }),
    'independent verification',
  );
  assert.equal(ledger.gateState('rls'), 'PASS');
});

test('section 36: a release-critical gate cannot be assigned one person as owner and verifier', () => {
  const ledger = newLedger();
  const denied = expectDenied(
    ledger.assignGate(guardian, { gateId: 'tenant_isolation', owner: 'sam', verifier: 'sam' }),
    'assigning both roles to one person',
  );
  assert.equal(denied.code, 'separation_of_duties');
  // The gate stays visibly unassigned rather than falsely covered.
  assert.equal(ledger.gateState('tenant_isolation'), 'UNASSIGNED');

  expectOk(
    ledger.assignGate(guardian, { gateId: 'tenant_isolation', owner: 'sam', verifier: 'riley' }),
    'assignGate',
  );
  assert.equal(ledger.gateState('tenant_isolation'), 'ASSIGNED');
});

test('section 60: automation may produce evidence but never verify or approve it', () => {
  const ledger = newLedger();
  const evidence = record(ledger);

  const verification = expectDenied(
    ledger.verifyEvidence({ ...ci, roles: ['verifier'] }, {
      evidenceId: evidence.evidenceId,
      verdict: 'satisfies',
      note: 'green build',
    }),
    'ci verification',
  );
  assert.equal(verification.code, 'automation_cannot_approve');

  const approval = expectDenied(
    ledger.approveGate({ ...ci, roles: ['approver'] }, {
      gateId: 'rls',
      evidenceId: evidence.evidenceId,
      decision: 'approved',
      note: 'green build',
    }),
    'ci approval',
  );
  assert.equal(approval.code, 'automation_cannot_approve');

  const agentAttempt = expectDenied(
    ledger.recordEvidence(actor('agent_analyst', { actorType: 'agent' }), {
      criterion: 'rls',
      commit: COMMIT,
      environment: 'ci',
      testSuite: 'self-report',
      testCase: 'i checked my own isolation',
      testVersion: '1',
      expectedResult: 'deny',
      actualResult: 'deny',
      status: 'pass',
      startedAt: '2026-01-01T00:00:00.000Z',
      completedAt: '2026-01-01T00:00:01.000Z',
      primaryOwner: 'agent_analyst',
      payload: cleanRlsProbes(),
    }),
    'agent-authored evidence',
  );
  assert.equal(agentAttempt.code, 'actor_unauthorized');
});

test('section 36: one person cannot verify and then approve the same critical gate', () => {
  const ledger = newLedger();
  const evidence = expectOk(
    ledger.recordEvidence(ci, {
      criterion: 'rollback',
      commit: COMMIT,
      environment: 'staging',
      testSuite: 'release/rollback',
      testCase: 'canary rolls back to the last known good build',
      testVersion: '1',
      expectedResult: 'recovered',
      actualResult: 'recovered',
      status: 'pass',
      startedAt: '2026-01-01T00:00:00.000Z',
      completedAt: '2026-01-01T00:04:00.000Z',
      primaryOwner: 'release_owner',
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
      reproducibleCommand: 'ops/rollback-drill.sh',
    }),
    'rollback evidence',
  ).record;

  expectOk(
    ledger.verifyEvidence(actor('sre_verifier', { roles: ['verifier'] }), {
      evidenceId: evidence.evidenceId,
      verdict: 'satisfies',
      note: 'watched the drill',
    }),
    'verify',
  );

  const denied = expectDenied(
    ledger.approveGate(actor('sre_verifier', { roles: ['verifier', 'approver'] }), {
      gateId: 'rollback',
      evidenceId: evidence.evidenceId,
      decision: 'approved',
      note: 'and I approve it too',
    }),
    'verifier approving their own verification',
  );
  assert.equal(denied.code, 'separation_of_duties');
  assert.equal(ledger.gateState('rollback'), 'VERIFICATION_PENDING');

  expectOk(
    ledger.approveGate(actor('release_manager', { roles: ['approver'], authority: 'release_manager' }), {
      gateId: 'rollback',
      evidenceId: evidence.evidenceId,
      decision: 'approved',
      note: 'drill reviewed',
    }),
    'approveGate',
  );
  assert.equal(ledger.gateState('rollback'), 'PASS');
});

test('section 59: canary promotion needs a named human, not a role with the right label', () => {
  const ledger = newLedger();
  const evidence = fullyEvidence(ledger, {
    criterion: 'canary_promotion',
    payload: passingSuite(),
    owner: 'release_owner',
    verifier: 'qa_verifier',
    approver: null,
  });

  const denied = expectDenied(
    ledger.approveGate(actor('duty_engineer', { roles: ['approver'] }), {
      gateId: 'canary_promotion',
      evidenceId: evidence.evidenceId,
      decision: 'approved',
      note: 'looks fine',
    }),
    'unnamed approver',
  );
  assert.equal(denied.code, 'actor_unauthorized');

  expectOk(
    ledger.approveGate(actor('founder', { roles: ['approver'], authority: 'ceo' }), {
      gateId: 'canary_promotion',
      evidenceId: evidence.evidenceId,
      decision: 'approved',
      note: 'promoting the canary',
    }),
    'ceo approval',
  );
  assert.equal(ledger.gateState('canary_promotion'), 'PASS');
});

test('section 59: reserved decisions are refused to every non-human caller', () => {
  const ledger = newLedger();

  for (const decision of CEO_RESERVED_DECISIONS) {
    const denied = expectDenied(
      ledger.requestReservedDecision(ci, { decision, summary: 'automated request' }),
      `ci requesting ${decision}`,
    );
    assert.equal(denied.code, 'automation_cannot_approve');
  }

  const notCeo = expectDenied(
    ledger.requestReservedDecision(actor('vp_eng', { roles: ['approver'] }), {
      decision: 'production_deployment',
      summary: 'ship it',
    }),
    'non-CEO reserved decision',
  );
  assert.equal(notCeo.code, 'actor_unauthorized');

  const allowed = expectOk(
    ledger.requestReservedDecision(actor('founder', { roles: ['approver'], authority: 'ceo' }), {
      decision: 'production_deployment',
      summary: 'ship it',
    }),
    'ceo reserved decision',
  );
  assert.equal(allowed.decidedBy, 'founder');
});

test('section 36: verification is recorded once and the verifier is named on the record', () => {
  const ledger = newLedger();
  const evidence = record(ledger);

  expectOk(
    ledger.verifyEvidence(actor('security_reviewer', { roles: ['verifier'] }), {
      evidenceId: evidence.evidenceId,
      verdict: 'satisfies',
      note: 'reproduced',
    }),
    'first verification',
  );

  const second = expectDenied(
    ledger.verifyEvidence(actor('other_reviewer', { roles: ['verifier'] }), {
      evidenceId: evidence.evidenceId,
      verdict: 'insufficient',
      note: 'changed my mind on behalf of someone else',
    }),
    'second verification',
  );
  assert.equal(second.code, 'verification_already_recorded');

  const audit = expectOk(ledger.audit(evidence.evidenceId), 'audit');
  assert.equal(audit.audit.whoIndependentlyVerifiedIt, 'security_reviewer');
  assert.equal(ledger.getEvidence(evidence.evidenceId)?.reviewer, 'security_reviewer');
});

test('section 36: a verifier outside the tenant scope cannot confirm the evidence', () => {
  const ledger = newLedger();
  const evidence = record(ledger);

  const denied = expectDenied(
    ledger.verifyEvidence(
      actor('outside_reviewer', {
        roles: ['verifier'],
        scope: { organizationId: 'other_org', universeId: 'other_universe' },
      }),
      { evidenceId: evidence.evidenceId, verdict: 'satisfies', note: 'from elsewhere' },
    ),
    'cross-scope verification',
  );
  assert.equal(denied.code, 'actor_tenant_mismatch');
});

test('sections 36 and 52: a refusal-only gate still needs an independent reviewer', () => {
  const ledger = newLedger();
  fullyEvidence(ledger, {
    criterion: 'runtime_identity',
    payload: refusalProbes(),
    owner: 'runtime_owner',
    verifier: 'security_reviewer',
  });
  fullyEvidence(ledger, {
    criterion: 'runtime_identity',
    payload: passingSuite(),
    owner: 'runtime_owner',
    verifier: 'security_reviewer',
  });
  assert.equal(ledger.gateState('runtime_identity'), 'PASS');
  assert.equal(ledger.founderBriefStatus('runtime_identity').status, 'VERIFIED');
});
