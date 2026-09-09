import assert from 'node:assert/strict';
import test from 'node:test';

import { OWNERSHIP_MATRIX } from '../gates';
import { skippedMandatory, verifyManifestHash } from '../manifest';
import { assertBriefClaim } from '../readiness';
import { COMMIT, evidenceWorld, passingEvidence, refusalCode } from './harness';

// Sections 39, 51, 57, 58 and 61 — the package, the dashboard, the words a
// Founder Brief may use about it, and the twelve questions that decide whether
// any of it counts as done.

test('a fresh dashboard says TBD everywhere and TBD is not PASS', () => {
  const world = evidenceWorld();
  const rows = world.xiv.readiness(world.owner, COMMIT);

  assert.equal(rows.length, OWNERSHIP_MATRIX.length);
  assert.ok(rows.every((row) => row.result === 'TBD'));
  assert.ok(rows.every((row) => row.classification === 'UNPROVEN'));
  assert.ok(rows.every((row) => row.achievedEvidence === null));
  assert.ok(rows.every((row) => row.freshness === null));

  // Section 56's rule about canary is the one this whole table exists to serve.
  const summary = world.xiv.canaryReadiness(world.owner, COMMIT);
  assert.equal(summary.pass, 0);
  assert.equal(summary.canaryEligible, false);
  assert.equal(summary.unassignedReleaseCritical.length, OWNERSHIP_MATRIX.filter((g) => g.releaseCritical).length);
  assert.match(summary.reasons.join(' '), /release-critical criteria are UNASSIGNED/);
});

test('a brief climbs the ladder one rung at a time and never skips one', () => {
  const world = evidenceWorld();
  world.xiv.assignGate(world.owner, { gateKey: 'rls', ownerId: 'owner', verifierId: 'verifier' });

  const nothing = world.xiv.classifyForBrief(world.owner, 'rls', COMMIT);
  assert.equal(nothing.classification, 'UNPROVEN');

  // Somebody watched it happen and wrote it down. That is REPORTED, and it is
  // where most claims in a young system honestly sit.
  world.xiv.assignGate(world.owner, { gateKey: 'compute_routing', ownerId: 'owner', verifierId: 'verifier' });
  world.xiv.recordEvidence(
    world.owner,
    passingEvidence({
      gateKey: 'compute_routing',
      claimedLevel: 'E1',
      executorType: 'human',
      executorId: 'owner',
      testCase: 'routed a workload to the GPU node and watched it land',
      evidenceLocation: 'xiv-evidence/runtime/notes.md',
    }),
  );
  const reported = world.xiv.classifyForBrief(world.owner, 'compute_routing', COMMIT);
  assert.equal(reported.classification, 'REPORTED');

  const record = world.xiv.recordEvidence(world.owner, passingEvidence());
  const observed = world.xiv.classifyForBrief(world.owner, 'rls', COMMIT);
  assert.equal(observed.classification, 'OBSERVED');
  assert.match(observed.because, /nobody independent has confirmed/);

  // Section 58's one prohibition, as something a brief generator runs into
  // rather than something a reader has to catch.
  assert.equal(
    refusalCode(() => assertBriefClaim('VERIFIED', observed.classification, 'rls')),
    'brief_classification_overstated',
  );
  assertBriefClaim('OBSERVED', observed.classification, 'rls');

  world.xiv.verify(world.verifier, {
    recordId: record.id,
    verifierRole: 'Security',
    verdict: 'satisfies',
    rationale: 'reproduced the run and compared the artifact hash',
    checkedCommitSha: COMMIT,
  });
  assert.equal(world.xiv.classifyForBrief(world.owner, 'rls', COMMIT).classification, 'VERIFIED');
});

test('an integration nobody configured is UNAVAILABLE, not failing and not passing', () => {
  const world = evidenceWorld();
  world.xiv.markUnavailable(world.owner, {
    gateKey: 'ios',
    reason: 'no Apple developer account or device lab is connected to this project',
  });

  const row = world.xiv.readiness(world.owner, COMMIT).find((item) => item.gateKey === 'ios');
  assert.equal(row?.classification, 'UNAVAILABLE');
  assert.equal(row?.result, 'TBD');
  assert.match(row?.reasons.join(' ') ?? '', /Apple developer account/);

  world.xiv.blockGate(world.owner, {
    gateKey: 'backup_restore',
    reason: 'no approved recovery environment exists to restore into',
  });
  const blocked = world.xiv.readiness(world.owner, COMMIT).find((item) => item.gateKey === 'backup_restore');
  assert.equal(blocked?.classification, 'BLOCKED');
  assert.equal(blocked?.result, 'TBD');
});

test('the manifest counts what ran, what did not, and refuses to hide the difference', () => {
  const world = evidenceWorld();
  world.xiv.assignGate(world.owner, { gateKey: 'rls', ownerId: 'owner', verifierId: 'verifier' });

  world.xiv.recordEvidence(world.owner, passingEvidence());
  world.xiv.recordEvidence(
    world.owner,
    passingEvidence({ testCase: 'agent_messages :: DELETE ORG_B -> ORG_A' }),
  );
  world.xiv.recordEvidence(
    world.owner,
    passingEvidence({ testCase: 'storage :: cross-tenant read', status: 'fail', actualResult: 'LEAKED (1 rows)' }),
  );
  world.xiv.recordEvidence(
    world.owner,
    passingEvidence({
      testCase: 'rpc :: cross-tenant call',
      status: 'skipped',
      actualResult: 'no RPC surface configured in this environment',
    }),
  );

  const manifest = world.xiv.buildManifest(world.owner, {
    testRunId: 'run-1',
    code: passingEvidence().code,
    environment: 'local-postgres',
    generatedBy: 'collector',
  });

  assert.equal(manifest.testsExecuted, 3);
  assert.equal(manifest.testsSkipped, 1);
  assert.equal(manifest.passes, 2);
  assert.equal(manifest.failures, 1);
  assert.ok(verifyManifestHash(manifest));

  // The skipped mandatory test is nameable, which is what section 39 means by
  // remaining visible. A count alone can be read past.
  const skipped = skippedMandatory(world.xiv.listRecords(world.owner));
  assert.equal(skipped.length, 1);
  assert.match(skipped[0].testCase, /rpc :: cross-tenant call/);

  // Editing a count after the fact is detectable rather than merely discouraged.
  const tampered = { ...manifest, failures: 0, passes: 3 };
  assert.equal(verifyManifestHash(tampered), false);

  assert.equal(
    refusalCode(() =>
      world.xiv.buildManifest(world.owner, {
        testRunId: 'run-1',
        code: passingEvidence().code,
        environment: 'local-postgres',
        generatedBy: 'collector',
      }),
    ),
    'manifest_run_duplicate',
  );
});

test('a release-gating record can be walked end to end, and the gaps are named', () => {
  const world = evidenceWorld();
  world.xiv.assignGate(world.owner, { gateKey: 'rls', ownerId: 'owner', verifierId: 'verifier' });

  const thin = world.xiv.recordEvidence(
    world.owner,
    passingEvidence({ claimedLevel: 'E2', reproductionCommand: null, testRunId: 'run-thin' }),
  );
  const incomplete = world.xiv.reconstructEvidence(world.owner, thin.id);
  assert.equal(incomplete.complete, false);
  assert.deepEqual(incomplete.missing, ['REPRODUCTION', 'INDEPENDENT VERIFICATION']);

  const full = world.xiv.recordEvidence(world.owner, passingEvidence({ testRunId: 'run-full' }));
  world.xiv.verify(world.verifier, {
    recordId: full.id,
    verifierRole: 'Security',
    verdict: 'satisfies',
    rationale: 'ran the reproduction command and compared the artifact',
    checkedCommitSha: COMMIT,
  });
  const chain = world.xiv.reconstructEvidence(world.owner, full.id);
  assert.equal(chain.complete, true);
  assert.deepEqual(
    chain.chain.map((link) => link.step),
    [
      'CRITERION',
      'CODE IDENTITY',
      'OWNER',
      'EXECUTION',
      'EXPECTATION',
      'RESULT',
      'ARTIFACT',
      'REPRODUCTION',
      'INDEPENDENT VERIFICATION',
      'HUMAN APPROVAL',
      'FRESHNESS',
    ],
  );

  // A gate that always needs a person keeps that link open until the person acts.
  world.xiv.assignGate(world.owner, { gateKey: 'agent_evaluation', ownerId: 'owner', verifierId: 'verifier' });
  const evaluation = world.xiv.recordEvidence(
    world.owner,
    passingEvidence({ gateKey: 'agent_evaluation', testRunId: 'run-eval', testCase: 'agent evaluation suite' }),
  );
  world.xiv.verify(world.verifier, {
    recordId: evaluation.id,
    verifierRole: 'independent evaluator',
    verdict: 'satisfies',
    rationale: 'reviewed the evaluation artifact',
    checkedCommitSha: COMMIT,
  });
  assert.deepEqual(world.xiv.reconstructEvidence(world.owner, evaluation.id).missing, ['HUMAN APPROVAL']);
});

test('the twelve questions are answered from stored evidence or not at all', () => {
  const world = evidenceWorld();
  const empty = world.xiv.answerDefinitionOfDone(world.owner, 'rls', COMMIT);

  assert.equal(Object.keys(empty.answers).length, 12);
  assert.equal(empty.answered, false);
  assert.ok(Object.values(empty.answers).filter((answer) => answer === 'UNPROVEN').length >= 10);

  world.xiv.assignGate(world.owner, { gateKey: 'rls', ownerId: 'owner', verifierId: 'verifier' });
  const record = world.xiv.recordEvidence(world.owner, passingEvidence());
  world.xiv.verify(world.verifier, {
    recordId: record.id,
    verifierRole: 'Security',
    verdict: 'satisfies',
    rationale: 'reproduced the run',
    checkedCommitSha: COMMIT,
  });

  const done = world.xiv.answerDefinitionOfDone(world.owner, 'rls', COMMIT);
  assert.equal(done.answered, true);
  assert.match(done.answers['What exactly was tested?'], /rls-matrix \/ agent_registry/);
  assert.match(done.answers['Against which commit/build?'], new RegExp(COMMIT));
  assert.match(done.answers['Who or what executed it?'], /database:postgresql-16/);
  assert.match(done.answers['Has the evidence been altered?'], /^no; sha256 [0-9a-f]{16}$/);
  assert.equal(done.answers['Who independently verified it?'], 'verifier');
  assert.equal(done.answers['Is the evidence still fresh?'], 'VALID');

  // Section 55 again, from the reader's side: the same twelve questions asked a
  // week later give a different answer, without anyone editing anything.
  world.advance(60_000);
  world.xiv.declareChange(world.owner, {
    triggerKind: 'rls_policy_change',
    detail: 'the tenant predicate was rewritten',
    gateKey: 'rls',
  });
  const later = world.xiv.answerDefinitionOfDone(world.owner, 'rls', COMMIT);
  assert.equal(later.answers['Is the evidence still fresh?'], 'STALE');
});

test('proving one gate does not make the release ready', () => {
  const world = evidenceWorld();
  world.xiv.assignGate(world.owner, { gateKey: 'rls', ownerId: 'owner', verifierId: 'verifier' });
  const record = world.xiv.recordEvidence(world.owner, passingEvidence());
  world.xiv.verify(world.verifier, {
    recordId: record.id,
    verifierRole: 'Security',
    verdict: 'satisfies',
    rationale: 'reproduced the run',
    checkedCommitSha: COMMIT,
  });

  const summary = world.xiv.canaryReadiness(world.owner, COMMIT);
  assert.equal(summary.pass, 1);
  assert.equal(summary.canaryEligible, false);
  assert.ok(summary.hardBlockersFailing.includes('no_confirmed_cross_tenant_exposure'));
  assert.ok(summary.releaseCriticalUnproven.includes('canary_promotion'));

  // The summary names what is missing rather than reporting a percentage, so
  // "84% ready" never becomes a thing anyone can say.
  assert.match(summary.reasons.join(' '), /hard blockers are not proven/);
});
