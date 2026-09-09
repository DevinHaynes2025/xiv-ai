import assert from 'node:assert/strict';
import test from 'node:test';

import { assessLevel } from '../levels';
import { COMMIT, OTHER_COMMIT, evidenceWorld, passingEvidence, refusalCode } from './harness';

// Sections 34, 35 and 38 — the record contract, the strength ladder, and the
// rule that evidence belongs to exactly one commit.

test('an evidence record must be able to answer every question before it exists', () => {
  const world = evidenceWorld();

  assert.equal(
    refusalCode(() => world.xiv.recordEvidence(world.owner, passingEvidence({ testCase: '   ' }))),
    'evidence_contract_field_missing',
  );
  assert.equal(
    refusalCode(() => world.xiv.recordEvidence(world.owner, passingEvidence({ evidenceLocation: '' }))),
    'evidence_contract_field_missing',
  );
  assert.equal(
    refusalCode(() => world.xiv.recordEvidence(world.owner, passingEvidence({ expectedResult: '' }))),
    'evidence_contract_field_missing',
  );
});

test('a level is what the artifact earns, not what its author calls it', () => {
  const world = evidenceWorld();

  // A person describing what they saw is E1 no matter how confidently.
  const observed = assessLevel({
    code: { repository: 'xiv', branch: 'main', commitSha: COMMIT },
    executorType: 'human',
    evidenceLocation: 'notes.md',
    evidenceHash: 'abc',
    reproductionCommand: './run.sh',
    status: 'pass',
  });
  assert.equal(observed.achieved, 'E1');

  // An agent reporting its own success is also E1. This is the case section 33
  // is really written against, and the one most likely to be argued with.
  const selfReported = assessLevel({
    code: { repository: 'xiv', branch: 'main', commitSha: COMMIT },
    executorType: 'agent',
    evidenceLocation: 'agent-log.txt',
    evidenceHash: 'abc',
    reproductionCommand: './run.sh',
    status: 'pass',
  });
  assert.equal(selfReported.achieved, 'E1');

  // Automated, but with no way for anyone else to run it again, stops at E2.
  const unrepeatable = assessLevel({
    code: { repository: 'xiv', branch: 'main', commitSha: COMMIT },
    executorType: 'ci',
    evidenceLocation: 'out.json',
    evidenceHash: 'abc',
    reproductionCommand: null,
    status: 'pass',
  });
  assert.equal(unrepeatable.achieved, 'E2');

  // Everything except a second pair of eyes is E3, which is where an honest
  // system spends most of its time.
  const systemGenerated = assessLevel({
    code: { repository: 'xiv', branch: 'main', commitSha: COMMIT },
    executorType: 'database',
    evidenceLocation: 'out.json',
    evidenceHash: 'abc',
    reproductionCommand: './run.sh',
    status: 'pass',
  });
  assert.equal(systemGenerated.achieved, 'E3');
});

test('claiming a level the artifact does not reach is refused', () => {
  const world = evidenceWorld();

  assert.equal(
    refusalCode(() =>
      world.xiv.recordEvidence(
        world.owner,
        passingEvidence({ executorType: 'agent', executorId: 'agent-7', claimedLevel: 'E3' }),
      ),
    ),
    'evidence_level_overclaimed',
  );

  // E4 in particular can never be written, because at the moment of writing
  // nobody independent has looked at it. It is earned later or not at all.
  assert.equal(
    refusalCode(() => world.xiv.recordEvidence(world.owner, passingEvidence({ claimedLevel: 'E4' }))),
    'evidence_level_overclaimed',
  );
});

test('a credential never enters the evidence trail', () => {
  const world = evidenceWorld();

  assert.equal(
    refusalCode(() =>
      world.xiv.recordEvidence(
        world.owner,
        passingEvidence({ actualResult: 'Bearer abcdefghijklmnopqrstuvwxyz0123456789' }),
      ),
    ),
    'evidence_contains_secret',
  );
  assert.equal(
    refusalCode(() =>
      world.xiv.recordEvidence(
        world.owner,
        passingEvidence({ evidenceLocation: 'postgresql://xiv:hunter2@db.internal:5432/prod' }),
      ),
    ),
    'evidence_contains_secret',
  );

  // The refusal names the shape and the field, and does not echo the value,
  // because an error message is itself somewhere a secret would end up.
  try {
    world.xiv.recordEvidence(world.owner, passingEvidence({ actualResult: 'sk-abcdefghijklmnopqrstuvwxyz' }));
    assert.fail('expected a refusal');
  } catch (error) {
    const message = (error as Error).message;
    assert.match(message, /provider api key/);
    assert.doesNotMatch(message, /sk-abcdefghijklmnopqrstuvwxyz/);
  }
});

test('a wrong record is superseded rather than corrected in place', () => {
  const world = evidenceWorld();
  const original = world.xiv.recordEvidence(
    world.owner,
    passingEvidence({ status: 'fail', actualResult: 'LEAKED (1 rows)' }),
  );

  const { previous, replacement } = world.xiv.supersede(world.owner, {
    recordId: original.id,
    reason: 'the fixture was seeded into the wrong tenant, so the run measured nothing',
    replacement: passingEvidence(),
  });

  // Both survive. The trail shows a result was revised and why, rather than
  // showing a result that was always right.
  assert.equal(previous.status, 'fail');
  assert.equal(previous.supersededBy, replacement.id);
  assert.equal(world.xiv.freshnessOf(previous.id), 'SUPERSEDED');
  assert.equal(world.xiv.freshnessOf(replacement.id), 'VALID');
  assert.equal(replacement.provenance.supersedes, original.id);

  assert.equal(
    refusalCode(() =>
      world.xiv.supersede(world.owner, {
        recordId: original.id,
        reason: 'again',
        replacement: passingEvidence(),
      }),
    ),
    'evidence_immutable',
  );
});

test('evidence for one commit does not prove another commit', () => {
  const world = evidenceWorld();
  world.xiv.assignGate(world.owner, { gateKey: 'rls', ownerId: 'owner', verifierId: 'verifier' });
  const record = world.xiv.recordEvidence(world.owner, passingEvidence());
  world.xiv.verify(world.verifier, {
    recordId: record.id,
    verifierRole: 'Security',
    verdict: 'satisfies',
    rationale: 're-ran the matrix and read the artifact',
    checkedCommitSha: COMMIT,
  });

  assert.equal(world.xiv.assessGate(world.owner, 'rls', COMMIT).state, 'PASS');

  const other = world.xiv.assessGate(world.owner, 'rls', OTHER_COMMIT);
  assert.equal(other.state, 'EVIDENCE_PENDING');
  assert.match(other.reasons.join(' '), /evidence exists for other commits/);
});

test('carrying evidence to another commit costs an argument and a second signature', () => {
  const world = evidenceWorld();
  const record = world.xiv.recordEvidence(world.owner, passingEvidence());

  assert.equal(
    refusalCode(() =>
      world.xiv.reuseAcrossCommits(world.owner, {
        recordId: record.id,
        toCommitSha: OTHER_COMMIT,
        impactAnalysis: 'nothing changed',
        analyzedBy: 'verifier',
      }),
    ),
    'evidence_reuse_requires_impact_analysis',
  );

  // And the owner cannot certify that their own evidence still applies.
  assert.equal(
    refusalCode(() =>
      world.xiv.reuseAcrossCommits(world.owner, {
        recordId: record.id,
        toCommitSha: OTHER_COMMIT,
        impactAnalysis:
          'the only change is a README edit, which cannot reach any policy, schema object or query path',
        analyzedBy: 'owner',
      }),
    ),
    'verifier_must_be_independent',
  );

  const carried = world.xiv.reuseAcrossCommits(world.owner, {
    recordId: record.id,
    toCommitSha: OTHER_COMMIT,
    impactAnalysis:
      'the only change is a README edit, which cannot reach any policy, schema object or query path',
    analyzedBy: 'verifier',
  });
  assert.equal(carried.code.commitSha, OTHER_COMMIT);
  assert.equal(carried.provenance.carriedFrom, record.id);
});

test('a denial that was expected and observed is kept as evidence in its own right', () => {
  const world = evidenceWorld();
  world.xiv.recordEvidence(world.owner, passingEvidence());
  world.xiv.recordEvidence(
    world.owner,
    passingEvidence({
      testCase: 'agent requesting an unauthorized capability',
      expectedResult: 'DENIED by Guardian',
      actualResult: 'DENIED, security event created',
      gateKey: 'no_guardian_bypass',
    }),
  );

  const denials = world.xiv.negativeEvidence(world.owner);
  assert.equal(denials.length, 2);
  // Section 52: a secure system is proven partly by what it refuses to do, so
  // the refusals are first-class records rather than absent ones.
  assert.ok(denials.every((record) => record.expectedResult.includes('DEN')));
});
