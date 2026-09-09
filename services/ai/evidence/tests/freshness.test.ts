import assert from 'node:assert/strict';
import test from 'node:test';

import { COMMIT, evidenceWorld, passingEvidence } from './harness';

// Section 55 — a PASS is a statement about a moment, and XIV recomputes whether
// that moment still describes the system rather than trusting that it does.

function provenGate() {
  const world = evidenceWorld();
  world.xiv.assignGate(world.owner, { gateKey: 'rls', ownerId: 'owner', verifierId: 'verifier' });
  const record = world.xiv.recordEvidence(world.owner, passingEvidence());
  world.xiv.verify(world.verifier, {
    recordId: record.id,
    verifierRole: 'Security',
    verdict: 'satisfies',
    rationale: 'reproduced the matrix and compared the artifact hash',
    checkedCommitSha: COMMIT,
  });
  assert.equal(world.xiv.assessGate(world.owner, 'rls', COMMIT).state, 'PASS');
  return { world, record };
}

test('changing the policy a suite measured takes the pass with it', () => {
  const { world, record } = provenGate();

  world.advance(60_000);
  world.xiv.declareChange(world.owner, {
    triggerKind: 'rls_policy_change',
    detail: 'agent_messages select policy rewritten to read the tenant from the JWT claim',
    gateKey: 'rls',
  });

  // The suite did not become wrong. It became a measurement of something that is
  // no longer deployed, which is the more dangerous of the two.
  assert.equal(world.xiv.freshnessOf(record.id), 'STALE');
  assert.match(world.xiv.explainFreshness(world.owner, record.id), /rls_policy_change/);

  const assessment = world.xiv.assessGate(world.owner, 'rls', COMMIT);
  assert.equal(assessment.state, 'STALE');
  assert.match(assessment.reasons.join(' '), /gone stale and must be retaken/);
});

test('the change that produced a commit does not age the evidence taken against it', () => {
  const { world, record } = provenGate();

  world.advance(60_000);
  world.xiv.declareChange(world.owner, {
    triggerKind: 'schema_change',
    detail: 'the migration under test, which is the thing the run measured',
    toCommitSha: COMMIT,
  });

  // Without this the collector would invalidate its own output every run and
  // the whole mechanism would be noise nobody reads.
  assert.equal(world.xiv.freshnessOf(record.id), 'VALID');
  assert.equal(world.xiv.assessGate(world.owner, 'rls', COMMIT).state, 'PASS');
});

test('a change is only allowed to age what it could have affected', () => {
  const { world, record } = provenGate();

  world.advance(60_000);
  world.xiv.declareChange(world.owner, {
    triggerKind: 'model_change',
    detail: 'the default reasoning model moved a minor version',
    gateKey: 'model_authorization',
  });
  assert.equal(world.xiv.freshnessOf(record.id), 'VALID');

  // An unscoped change is treated as affecting everything, because a change
  // nobody could bound is not a change anybody has understood.
  world.advance(60_000);
  world.xiv.declareChange(world.owner, {
    triggerKind: 'infrastructure_change',
    detail: 'the database was moved to a new instance class',
  });
  assert.equal(world.xiv.freshnessOf(record.id), 'STALE');
});

test('evidence can be given a shelf life at the moment it is taken', () => {
  const world = evidenceWorld();
  world.xiv.assignGate(world.owner, { gateKey: 'rls', ownerId: 'owner', verifierId: 'verifier' });
  const record = world.xiv.recordEvidence(
    world.owner,
    passingEvidence({ expiresAt: '2026-09-09T10:00:00.000Z' }),
  );
  assert.equal(world.xiv.freshnessOf(record.id), 'VALID');

  world.advance(2 * 60 * 60 * 1000);
  assert.equal(world.xiv.freshnessOf(record.id), 'STALE');
  assert.match(world.xiv.explainFreshness(world.owner, record.id), /expired at 2026-09-09T10:00/);
});

test('a result its owner no longer stands behind is INVALID rather than deleted', () => {
  const { world, record } = provenGate();

  world.xiv.invalidate(world.owner, {
    recordId: record.id,
    reason: 'the harness ran as the table owner, so the denials it recorded were not the policy denying',
  });

  assert.equal(world.xiv.freshnessOf(record.id), 'INVALID');
  assert.match(world.xiv.explainFreshness(world.owner, record.id), /ran as the table owner/);

  // The gate stops being proven, and the reason why is still on the shelf. This
  // is the difference between withdrawing a claim and hiding it.
  const assessment = world.xiv.assessGate(world.owner, 'rls', COMMIT);
  assert.notEqual(assessment.state, 'PASS');
  assert.equal(world.xiv.listRecords(world.owner).length, 1);
});

test('a gate that was proven once is not proven forever', () => {
  const { world } = provenGate();

  world.advance(60_000);
  world.xiv.declareChange(world.owner, {
    triggerKind: 'code_change',
    detail: 'the tenant claim helper was rewritten',
    gateKey: 'rls',
  });
  assert.equal(world.xiv.assessGate(world.owner, 'rls', COMMIT).state, 'STALE');

  // Retaking it is a new run, a new artifact and a new review. Nothing about the
  // earlier pass shortens that.
  const retaken = world.xiv.recordEvidence(
    world.owner,
    passingEvidence({ testRunId: 'run-2', testCase: 'agent_registry :: SELECT ORG_A -> ORG_B, after rewrite' }),
  );
  assert.equal(world.xiv.assessGate(world.owner, 'rls', COMMIT).state, 'VERIFICATION_PENDING');

  world.xiv.verify(world.verifier, {
    recordId: retaken.id,
    verifierRole: 'Security',
    verdict: 'satisfies',
    rationale: 'read the new artifact against the rewritten helper',
    checkedCommitSha: COMMIT,
  });
  assert.equal(world.xiv.assessGate(world.owner, 'rls', COMMIT).state, 'PASS');
});
