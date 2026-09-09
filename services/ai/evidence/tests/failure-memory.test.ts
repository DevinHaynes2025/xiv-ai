import assert from 'node:assert/strict';
import test from 'node:test';

import { CODE, COMMIT, OTHER_COMMIT, evidenceWorld, passingEvidence, refusalCode } from './harness';

// Section 53 — the failure that disappears when somebody reruns the job is the
// only interesting datum in the whole exchange, because it is the one time the
// system gave a wrong answer under conditions nobody characterised.

test('a green rerun does not erase the red run beside it', () => {
  const world = evidenceWorld();
  world.xiv.assignGate(world.owner, { gateKey: 'rls', ownerId: 'owner', verifierId: 'verifier' });

  world.xiv.recordEvidence(
    world.owner,
    passingEvidence({
      testCase: 'agent_meeting_messages :: DELETE ORG_A -> ORG_B',
      status: 'fail',
      actualResult: 'the delete removed 1 row across the tenant boundary',
    }),
  );
  assert.equal(world.xiv.assessGate(world.owner, 'rls', COMMIT).state, 'FAIL');

  world.advance(60_000);
  world.xiv.recordEvidence(
    world.owner,
    passingEvidence({
      testRunId: 'run-2',
      testCase: 'agent_meeting_messages :: DELETE ORG_A -> ORG_B',
      actualResult: 'DENY (0 rows)',
    }),
  );

  // Running it again until it is green is the reflex this section exists to
  // interrupt. The gate stays failed while the failing artifact stands.
  assert.equal(world.xiv.assessGate(world.owner, 'rls', COMMIT).state, 'FAIL');
});

test('withdrawing a failure requires saying why the failure was wrong', () => {
  const world = evidenceWorld();
  world.xiv.assignGate(world.owner, { gateKey: 'rls', ownerId: 'owner', verifierId: 'verifier' });
  const failed = world.xiv.recordEvidence(
    world.owner,
    passingEvidence({ status: 'fail', actualResult: 'LEAKED (1 rows)' }),
  );

  assert.equal(
    refusalCode(() =>
      world.xiv.supersede(world.owner, {
        recordId: failed.id,
        reason: '   ',
        replacement: passingEvidence({ testRunId: 'run-2' }),
      }),
    ),
    'evidence_contract_field_missing',
  );

  // A superseding record is a claim that the earlier run measured the wrong
  // thing, and it is signed. That is a very different act from rerunning until
  // the pipeline is green, and it leaves a very different trail.
  const { previous, replacement } = world.xiv.supersede(world.owner, {
    recordId: failed.id,
    reason: 'the fixture seeded both rows into one tenant, so the run never crossed a boundary at all',
    replacement: passingEvidence({ testRunId: 'run-2' }),
  });
  assert.equal(previous.status, 'fail');
  assert.match(String(replacement.provenance.reason), /seeded both rows into one tenant/);
  world.xiv.verify(world.verifier, {
    recordId: replacement.id,
    verifierRole: 'Security',
    verdict: 'satisfies',
    rationale: 'checked the corrected fixture and re-ran the case',
    checkedCommitSha: COMMIT,
  });
  assert.equal(world.xiv.assessGate(world.owner, 'rls', COMMIT).state, 'PASS');
});

test('a failure is closed by a passing retest at the commit that claims to fix it', () => {
  const world = evidenceWorld();
  const failure = world.xiv.recordFailure(world.owner, {
    gateKey: 'rls',
    testSuite: 'rls-matrix',
    testCase: 'agent_messages :: UPDATE ORG_B -> ORG_A',
    commitSha: COMMIT,
    environment: 'local-postgres',
    failure: 'the update policy allowed a write from the wrong tenant on one run in twenty',
    severity: 'critical',
    ownerId: 'owner',
  });

  const stillFailing = world.xiv.recordEvidence(
    world.owner,
    passingEvidence({ code: { ...CODE, commitSha: OTHER_COMMIT }, status: 'fail' }),
  );
  assert.equal(
    refusalCode(() =>
      world.xiv.closeFailure(world.owner, {
        failureId: failure.id,
        rootCause: 'a missing tenant predicate on the update policy',
        remediation: 'add the predicate and a matrix case for it',
        fixCommit: OTHER_COMMIT,
        retestEvidenceId: stillFailing.id,
        verification: 'ran it again',
      }),
    ),
    'failure_closure_requires_retest',
  );

  const wrongCommit = world.xiv.recordEvidence(world.owner, passingEvidence({ testRunId: 'run-2' }));
  assert.equal(
    refusalCode(() =>
      world.xiv.closeFailure(world.owner, {
        failureId: failure.id,
        rootCause: 'a missing tenant predicate on the update policy',
        remediation: 'add the predicate and a matrix case for it',
        fixCommit: OTHER_COMMIT,
        retestEvidenceId: wrongCommit.id,
        verification: 'ran it against the fix',
      }),
    ),
    'failure_closure_requires_retest',
  );

  // And a closure has to name a cause. "Could not reproduce" is how a real
  // defect gets filed as weather.
  assert.equal(
    refusalCode(() =>
      world.xiv.closeFailure(world.owner, {
        failureId: failure.id,
        rootCause: '',
        remediation: 'none needed',
        fixCommit: COMMIT,
        retestEvidenceId: wrongCommit.id,
        verification: 'passes now',
      }),
    ),
    'evidence_contract_field_missing',
  );

  const closed = world.xiv.closeFailure(world.owner, {
    failureId: failure.id,
    rootCause: 'the update policy checked membership but not the tenant of the target row',
    remediation: 'added the tenant predicate and a matrix case that fails without it',
    fixCommit: COMMIT,
    retestEvidenceId: wrongCommit.id,
    verification: '500 iterations with no crossing',
  });
  assert.equal(closed.retestEvidenceId, wrongCommit.id);
  assert.equal(world.xiv.openFailures(world.owner).length, 0);

  // Closed and still on the shelf. This is the historical engineering memory
  // the section asks for: next time this test flakes, its history is one lookup
  // away rather than one person's recollection.
  const remembered = world.xiv.listFailures(world.owner);
  assert.equal(remembered.length, 1);
  assert.match(remembered[0].rootCause ?? '', /checked membership but not the tenant/);
});

test('an open blocker is counted against the gate it was found in', () => {
  const world = evidenceWorld();
  world.xiv.assignGate(world.owner, { gateKey: 'rls', ownerId: 'owner', verifierId: 'verifier' });
  const record = world.xiv.recordEvidence(world.owner, passingEvidence());
  world.xiv.verify(world.verifier, {
    recordId: record.id,
    verifierRole: 'Security',
    verdict: 'satisfies',
    rationale: 'artifact matches the claim',
    checkedCommitSha: COMMIT,
  });
  assert.equal(world.xiv.assessGate(world.owner, 'rls', COMMIT).achievedLevel, 'E4');

  // A low-severity annoyance is not a blocker and does not pretend to be one.
  world.xiv.recordFailure(world.owner, {
    gateKey: 'rls',
    testSuite: 'rls-matrix',
    testCase: 'the harness prints a duplicate line for skipped tables',
    commitSha: COMMIT,
    environment: 'local-postgres',
    failure: 'cosmetic duplicate output',
    severity: 'low',
    ownerId: 'owner',
  });
  assert.equal(world.xiv.assessGate(world.owner, 'rls', COMMIT).achievedLevel, 'E4');

  world.xiv.recordFailure(world.owner, {
    gateKey: 'rls',
    testSuite: 'rls-matrix',
    testCase: 'universe_memberships :: SELECT ORG_B -> ORG_A',
    commitSha: COMMIT,
    environment: 'local-postgres',
    failure: 'a revoked member could still read one row',
    severity: 'critical',
    ownerId: 'owner',
  });
  assert.equal(world.xiv.assessGate(world.owner, 'rls', COMMIT).achievedLevel, 'E3');
});

test('a failure cannot be filed against a gate that does not exist', () => {
  const world = evidenceWorld();
  assert.equal(
    refusalCode(() =>
      world.xiv.recordFailure(world.owner, {
        gateKey: 'quantum_runtime',
        testSuite: 'rls-matrix',
        testCase: 'anything',
        commitSha: COMMIT,
        environment: 'local-postgres',
        failure: 'something went wrong',
        severity: 'high',
        ownerId: 'owner',
      }),
    ),
    'gate_unknown',
  );
});
