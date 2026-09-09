import assert from 'node:assert/strict';
import test from 'node:test';

import { COMMIT, evidenceWorld, passingEvidence, refusalCode } from './harness';

// Sections 36, 37, 56, 59 and 60 — who is accountable, who is allowed to agree
// with them, and the single state that falls out of the two.

test('a party cannot certify its own work', () => {
  const world = evidenceWorld();
  const record = world.xiv.recordEvidence(world.owner, passingEvidence());

  assert.equal(
    refusalCode(() =>
      world.xiv.verify(world.owner, {
        recordId: record.id,
        verifierRole: 'Security',
        verdict: 'satisfies',
        rationale: 'I wrote it and I am confident in it',
        checkedCommitSha: COMMIT,
      }),
    ),
    'verifier_must_be_independent',
  );

  const verification = world.xiv.verify(world.verifier, {
    recordId: record.id,
    verifierRole: 'Security',
    verdict: 'satisfies',
    rationale: 're-ran the suite from the reproduction command and read the artifact',
    checkedCommitSha: COMMIT,
  });
  assert.equal(verification.verifierId, 'verifier');

  // One reviewer signing twice is one reviewer, so the second signature is not
  // additional confidence and is not recorded as if it were.
  assert.equal(
    refusalCode(() =>
      world.xiv.verify(world.verifier, {
        recordId: record.id,
        verifierRole: 'Security',
        verdict: 'satisfies',
        rationale: 'still looks right',
        checkedCommitSha: COMMIT,
      }),
    ),
    'verifier_already_recorded',
  );
});

test('a review of different code is not a review of this code', () => {
  const world = evidenceWorld();
  const record = world.xiv.recordEvidence(world.owner, passingEvidence());

  // The quiet way a false E4 gets made: the artifact is from one revision and
  // the reviewer read another, and nothing in the paperwork says so.
  assert.equal(
    refusalCode(() =>
      world.xiv.verify(world.verifier, {
        recordId: record.id,
        verifierRole: 'Security',
        verdict: 'satisfies',
        rationale: 'reviewed the branch tip',
        checkedCommitSha: 'aaaaaaa1111111111111111111111111111aaaa',
      }),
    ),
    'evidence_commit_mismatch',
  );
});

test('one person cannot hold two independent roles on a critical gate', () => {
  const world = evidenceWorld();

  assert.equal(
    refusalCode(() =>
      world.xiv.assignGate(world.owner, { gateKey: 'rls', ownerId: 'owner', verifierId: 'owner' }),
    ),
    'verifier_must_be_independent',
  );
  assert.equal(
    refusalCode(() =>
      world.xiv.assignGate(world.owner, {
        gateKey: 'rls',
        ownerId: 'owner',
        verifierId: 'verifier',
        approverId: 'owner',
      }),
    ),
    'approver_must_be_independent',
  );

  // Section 37 says these are roles rather than necessarily separate employees,
  // and it only demands the separation where the gate is release critical. On a
  // gate that is not, one person wearing two hats is allowed to stay allowed.
  const routing = world.xiv.assignGate(world.owner, {
    gateKey: 'compute_routing',
    ownerId: 'owner',
    verifierId: 'verifier',
    approverId: 'owner',
  });
  assert.equal(routing.assignedApproverId, 'owner');
});

test('a gate nobody is accountable for is UNASSIGNED even when its tests pass', () => {
  const world = evidenceWorld();
  const record = world.xiv.recordEvidence(world.owner, passingEvidence());
  world.xiv.verify(world.verifier, {
    recordId: record.id,
    verifierRole: 'Security',
    verdict: 'satisfies',
    rationale: 'read the matrix output row by row',
    checkedCommitSha: COMMIT,
  });

  // Section 56's rule about canary is only enforceable if a green suite cannot
  // fill the hole where an owner should be.
  const unowned = world.xiv.assessGate(world.owner, 'rls', COMMIT);
  assert.equal(unowned.state, 'UNASSIGNED');
  assert.match(unowned.reasons.join(' '), /no owner is accountable/);

  world.xiv.assignGate(world.owner, { gateKey: 'rls', ownerId: 'owner', verifierId: 'verifier' });
  assert.equal(world.xiv.assessGate(world.owner, 'rls', COMMIT).state, 'PASS');
});

test('a mandatory test that did not run is not a pass', () => {
  const world = evidenceWorld();
  world.xiv.assignGate(world.owner, { gateKey: 'rls', ownerId: 'owner', verifierId: 'verifier' });

  const passed = world.xiv.recordEvidence(world.owner, passingEvidence());
  world.xiv.verify(world.verifier, {
    recordId: passed.id,
    verifierRole: 'Security',
    verdict: 'satisfies',
    rationale: 'confirmed against the artifact',
    checkedCommitSha: COMMIT,
  });
  assert.equal(world.xiv.assessGate(world.owner, 'rls', COMMIT).state, 'PASS');

  world.xiv.recordEvidence(
    world.owner,
    passingEvidence({
      testCase: 'storage bucket :: cross-tenant read',
      status: 'skipped',
      actualResult: 'no storage configured in this environment',
    }),
  );

  // Section 39. The passing rows do not average out the one that never ran.
  const assessment = world.xiv.assessGate(world.owner, 'rls', COMMIT);
  assert.equal(assessment.state, 'EVIDENCE_PENDING');
  assert.match(assessment.reasons.join(' '), /did not run: storage bucket/);
});

test('one failure outranks every pass beside it', () => {
  const world = evidenceWorld();
  world.xiv.assignGate(world.owner, { gateKey: 'rls', ownerId: 'owner', verifierId: 'verifier' });
  world.xiv.recordEvidence(world.owner, passingEvidence());
  world.xiv.recordEvidence(
    world.owner,
    passingEvidence({
      testCase: 'agent_messages :: SELECT ORG_B -> ORG_A',
      status: 'fail',
      actualResult: 'LEAKED (3 rows)',
    }),
  );

  const assessment = world.xiv.assessGate(world.owner, 'rls', COMMIT);
  assert.equal(assessment.state, 'FAIL');
  assert.match(assessment.reasons.join(' '), /agent_messages/);
});

test('a reviewer who disagrees fails the gate rather than being outvoted', () => {
  const world = evidenceWorld();
  world.xiv.assignGate(world.owner, { gateKey: 'rls', ownerId: 'owner', verifierId: 'verifier' });
  const record = world.xiv.recordEvidence(world.owner, passingEvidence());
  world.xiv.verify(world.verifier, {
    recordId: record.id,
    verifierRole: 'Security',
    verdict: 'contradicted',
    rationale: 'the harness ran as a superuser, so the deny it reports is not the policy denying',
    checkedCommitSha: COMMIT,
  });

  const assessment = world.xiv.assessGate(world.owner, 'rls', COMMIT);
  assert.equal(assessment.state, 'FAIL');
  assert.match(assessment.reasons.join(' '), /insufficient or contradicted/);
});

test('E4 is granted by a second pair of eyes and withdrawn by an open blocker', () => {
  const world = evidenceWorld();
  world.xiv.assignGate(world.owner, {
    gateKey: 'tenant_isolation',
    ownerId: 'owner',
    verifierId: 'verifier',
  });
  const record = world.xiv.recordEvidence(
    world.owner,
    passingEvidence({ gateKey: 'tenant_isolation', testCase: 'cross-tenant matrix, all tables' }),
  );

  // Stored as E3, because that is all it could be at the moment it was written.
  assert.equal(record.evidenceLevel, 'E3');
  const unverified = world.xiv.assessGate(world.owner, 'tenant_isolation', COMMIT);
  assert.equal(unverified.state, 'VERIFICATION_PENDING');

  world.xiv.verify(world.verifier, {
    recordId: record.id,
    verifierRole: 'independent security verifier',
    verdict: 'satisfies',
    rationale: 'reproduced the matrix on a clean database and compared hashes',
    checkedCommitSha: COMMIT,
  });
  const verified = world.xiv.assessGate(world.owner, 'tenant_isolation', COMMIT);
  assert.equal(verified.achievedLevel, 'E4');
  assert.equal(verified.state, 'PASS');

  // Section 35 lists "no unresolved blocker" as part of E4, so an open blocker
  // takes the level back down and the gate with it. The evidence did not change;
  // what XIV is entitled to conclude from it did.
  const failure = world.xiv.recordFailure(world.owner, {
    gateKey: 'tenant_isolation',
    testSuite: 'rls-matrix',
    testCase: 'agent_meeting_messages :: DELETE ORG_A -> ORG_B',
    commitSha: COMMIT,
    environment: 'local-postgres',
    failure: 'the delete succeeded across the tenant boundary on one run in twenty',
    severity: 'high',
    ownerId: 'owner',
  });
  const blocked = world.xiv.assessGate(world.owner, 'tenant_isolation', COMMIT);
  assert.equal(blocked.achievedLevel, 'E3');
  assert.equal(blocked.state, 'EVIDENCE_PENDING');
  assert.match(blocked.reasons.join(' '), /strongest evidence is E3 but this gate requires E4/);
  assert.match(blocked.reasons.join(' '), /1 unresolved blocker/);

  const retest = world.xiv.recordEvidence(
    world.owner,
    passingEvidence({
      gateKey: 'tenant_isolation',
      testCase: 'agent_meeting_messages :: DELETE ORG_A -> ORG_B, 500 iterations',
    }),
  );
  world.xiv.closeFailure(world.owner, {
    failureId: failure.id,
    rootCause: 'the fixture reused a membership row, so one iteration acted with a stale claim',
    remediation: 'seed a distinct membership per iteration and assert the claim before the delete',
    fixCommit: COMMIT,
    retestEvidenceId: retest.id,
    verification: 'ran 500 iterations with no crossing',
  });
  assert.equal(world.xiv.assessGate(world.owner, 'tenant_isolation', COMMIT).state, 'PASS');
});

test('automation prepares the package and a person still has to sign it', () => {
  const world = evidenceWorld();
  world.xiv.assignGate(world.owner, {
    gateKey: 'canary_promotion',
    ownerId: 'owner',
    verifierId: 'verifier',
    approverId: 'approver',
  });
  const record = world.xiv.recordEvidence(
    world.owner,
    passingEvidence({ gateKey: 'canary_promotion', testCase: 'complete gate package' }),
  );
  world.xiv.verify(world.verifier, {
    recordId: record.id,
    verifierRole: 'Security + QA',
    verdict: 'satisfies',
    rationale: 'every gate in the package was checked against this commit',
    checkedCommitSha: COMMIT,
  });

  // Everything section 60 permits automation to do has now been done, and the
  // answer is still no.
  const prepared = world.xiv.assessGate(world.owner, 'canary_promotion', COMMIT);
  assert.equal(prepared.achievedLevel, 'E4');
  assert.equal(prepared.state, 'VERIFICATION_PENDING');
  assert.match(prepared.reasons.join(' '), /CEO or separately authorized human/);

  // And the two people who produced the evidence cannot be the person who
  // accepts the risk of it.
  for (const actor of [world.owner, world.verifier]) {
    assert.equal(
      refusalCode(() =>
        world.xiv.approve(actor, {
          gateKey: 'canary_promotion',
          approvalKind: 'canary',
          decision: 'approved',
          rationale: 'the package is complete',
          commitSha: COMMIT,
        }),
      ),
      'approver_must_be_independent',
    );
  }

  const approval = world.xiv.approve(world.approver, {
    gateKey: 'canary_promotion',
    approvalKind: 'canary',
    decision: 'approved',
    rationale: 'read the package, accept the residual risk of a bounded canary',
    commitSha: COMMIT,
    residualRisk: 'one runtime class is untested and excluded from the canary',
  });
  // The approval is stamped with whoever made the call. There is no parameter
  // for recording it on somebody else's behalf, which is the whole of section 59.
  assert.equal(approval.approverId, 'approver');
  assert.equal(world.xiv.assessGate(world.owner, 'canary_promotion', COMMIT).state, 'PASS');
});

test('an approval covers the commit it was given for and no other', () => {
  const world = evidenceWorld();
  world.xiv.assignGate(world.owner, {
    gateKey: 'canary_promotion',
    ownerId: 'owner',
    verifierId: 'verifier',
    approverId: 'approver',
  });
  const record = world.xiv.recordEvidence(
    world.owner,
    passingEvidence({ gateKey: 'canary_promotion', testCase: 'complete gate package' }),
  );
  world.xiv.verify(world.verifier, {
    recordId: record.id,
    verifierRole: 'Security + QA',
    verdict: 'satisfies',
    rationale: 'checked the package',
    checkedCommitSha: COMMIT,
  });
  world.xiv.approve(world.approver, {
    gateKey: 'canary_promotion',
    approvalKind: 'canary',
    decision: 'approved',
    rationale: 'accepted for this build',
    commitSha: COMMIT,
  });

  const carried = world.xiv.reuseAcrossCommits(world.owner, {
    recordId: record.id,
    toCommitSha: 'feedface0000111122223333444455556666feed',
    impactAnalysis:
      'the follow-up commit only edits documentation prose and cannot reach any policy or code path',
    analyzedBy: 'verifier',
  });
  world.xiv.verify(world.verifier, {
    recordId: carried.id,
    verifierRole: 'Security + QA',
    verdict: 'satisfies',
    rationale: 'the impact analysis holds',
    checkedCommitSha: carried.code.commitSha,
  });

  // Evidence can be argued across commits. An approval cannot: it was a human
  // accepting risk on a stated artifact, not a standing permission.
  const next = world.xiv.assessGate(world.owner, 'canary_promotion', carried.code.commitSha);
  assert.equal(next.achievedLevel, 'E4');
  assert.equal(next.state, 'VERIFICATION_PENDING');
  assert.match(next.reasons.join(' '), /CEO or separately authorized human/);
});

test('a guardian can stop a gate without being able to pass one', () => {
  const world = evidenceWorld();
  world.xiv.assignGate(world.owner, { gateKey: 'rls', ownerId: 'owner', verifierId: 'verifier' });
  const record = world.xiv.recordEvidence(world.owner, passingEvidence());
  world.xiv.verify(world.verifier, {
    recordId: record.id,
    verifierRole: 'Security',
    verdict: 'satisfies',
    rationale: 'artifact matches',
    checkedCommitSha: COMMIT,
  });
  assert.equal(world.xiv.assessGate(world.owner, 'rls', COMMIT).state, 'PASS');

  world.xiv.blockGate(world.owner, {
    gateKey: 'rls',
    reason: 'held while the policy rewrite lands, because the suite is measuring the old policy',
  });

  // Section 36: the Guardian layer may prevent promotion. Nothing in the surface
  // lets it grant one, so a block outranks a pass and there is no counterpart
  // call that outranks a block.
  const held = world.xiv.assessGate(world.owner, 'rls', COMMIT);
  assert.equal(held.state, 'BLOCKED');
  assert.match(held.reasons.join(' '), /policy rewrite/);
});

test('the evidence of another universe is not visible or verifiable', () => {
  const world = evidenceWorld();
  const record = world.xiv.recordEvidence(world.owner, passingEvidence());

  assert.equal(
    refusalCode(() => world.xiv.listRecords(world.outsider)),
    'tenancy_not_a_member',
  );
  assert.equal(
    refusalCode(() =>
      world.xiv.verify(world.outsider, {
        recordId: record.id,
        verifierRole: 'Security',
        verdict: 'satisfies',
        rationale: 'looks fine from here',
        checkedCommitSha: COMMIT,
      }),
    ),
    'tenancy_not_a_member',
  );
});
