import assert from 'node:assert/strict';
import test from 'node:test';

import { OWNERSHIP_MATRIX } from '../gates';
import { COMMIT, evidenceWorld, passingEvidence, refusalCode } from './harness';

// Section 54 — an exception is XIV writing down that it shipped with a known
// gap, who decided that, what stands in its place and when the decision runs
// out. Five conditions are outside the mechanism entirely.

const EXPIRY = '2026-09-30T00:00:00.000Z';

function gap(overrides: Record<string, unknown> = {}) {
  return {
    gateKey: 'secret_scanning',
    severity: 'medium' as const,
    risk: 'a pre-commit scanner covers the repository but the CI scan is not wired up yet',
    reason: 'the scanner runs locally and the CI job is queued behind the pipeline rewrite',
    scope: 'this commit only, internal environments',
    compensatingControl: 'pre-commit scanning on every developer machine plus a manual scan before each merge',
    ownerId: 'owner',
    reviewerId: 'verifier',
    expiresAt: EXPIRY,
    ...overrides,
  };
}

test('the five conditions that cannot be waived cannot be waived', () => {
  const world = evidenceWorld();
  const hardBlockers = OWNERSHIP_MATRIX.filter((seed) => seed.hardBlocker).map((seed) => seed.gateKey);

  // Section 54 lists five, so the count is asserted rather than the loop merely
  // passing over whatever happens to be marked.
  assert.equal(hardBlockers.length, 5);
  for (const gateKey of hardBlockers) {
    assert.equal(refusalCode(() => world.xiv.fileException(world.owner, gap({ gateKey }))), 'exception_hard_blocker_not_waivable');
  }
});

test('a gap in the scan is negotiable and a leaked secret is not', () => {
  const world = evidenceWorld();

  // Section 37 grants secret scanning an exception route and section 54 says
  // exposed production secrets can never be waived. Those are two different
  // objects, and modelling them as two gates is what lets both sentences be
  // true at once.
  const filed = world.xiv.fileException(world.owner, gap());
  assert.equal(filed.humanApproverId, null);

  assert.equal(
    refusalCode(() => world.xiv.fileException(world.owner, gap({ gateKey: 'no_exposed_production_secrets' }))),
    'exception_hard_blocker_not_waivable',
  );
});

test('an exception without a control, an expiry or a second reader is not an exception', () => {
  const world = evidenceWorld();

  assert.equal(
    refusalCode(() => world.xiv.fileException(world.owner, gap({ compensatingControl: '  ' }))),
    'exception_requires_compensating_control',
  );
  // An exception with no end date is a policy change nobody voted on.
  assert.equal(
    refusalCode(() => world.xiv.fileException(world.owner, gap({ expiresAt: '2026-09-09T08:00:00.000Z' }))),
    'exception_requires_expiry',
  );
  assert.equal(
    refusalCode(() => world.xiv.fileException(world.owner, gap({ reviewerId: 'owner' }))),
    'verifier_must_be_independent',
  );
});

test('filing an exception asks for cover and does not grant it', () => {
  const world = evidenceWorld();
  world.xiv.assignGate(world.owner, {
    gateKey: 'secret_scanning',
    ownerId: 'owner',
    verifierId: 'verifier',
    approverId: 'approver',
  });

  const exception = world.xiv.fileException(world.owner, gap());
  assert.equal(world.xiv.assessGate(world.owner, 'secret_scanning', COMMIT).state, 'EXCEPTION_PENDING');

  // The owner of the gap is exactly the person who most wants it covered, so
  // they are the one person who cannot accept it.
  assert.equal(
    refusalCode(() =>
      world.xiv.acceptException(world.owner, {
        exceptionId: exception.id,
        rationale: 'I am comfortable with this',
        commitSha: COMMIT,
      }),
    ),
    'approver_must_be_independent',
  );

  world.xiv.acceptException(world.approver, {
    exceptionId: exception.id,
    rationale: 'accepted for internal environments only, on the strength of the pre-commit control',
    commitSha: COMMIT,
  });
  assert.equal(world.xiv.assessGate(world.owner, 'secret_scanning', COMMIT).state, 'EXCEPTION_APPROVED');
});

test('an accepted exception stops covering the gate the moment it expires', () => {
  const world = evidenceWorld();
  world.xiv.assignGate(world.owner, { gateKey: 'secret_scanning', ownerId: 'owner', verifierId: 'verifier' });
  const exception = world.xiv.fileException(world.owner, gap());
  world.xiv.acceptException(world.approver, {
    exceptionId: exception.id,
    rationale: 'accepted for three weeks while the CI job is built',
    commitSha: COMMIT,
  });

  assert.equal(world.xiv.expiringExceptions(world.owner, 30 * 24 * 60 * 60 * 1000).length, 1);
  assert.equal(world.xiv.expiringExceptions(world.owner, 60 * 60 * 1000).length, 0);

  world.advance(30 * 24 * 60 * 60 * 1000);

  // Nothing had to be remembered or re-run for this to happen, which is the
  // only reason an expiry date is worth writing down.
  const assessment = world.xiv.assessGate(world.owner, 'secret_scanning', COMMIT);
  assert.equal(assessment.state, 'ASSIGNED');
  assert.match(assessment.reasons.join(' '), /no evidence has been produced/);
});

test('a revoked exception stops covering the gate immediately', () => {
  const world = evidenceWorld();
  world.xiv.assignGate(world.owner, { gateKey: 'secret_scanning', ownerId: 'owner', verifierId: 'verifier' });
  const exception = world.xiv.fileException(world.owner, gap());
  world.xiv.acceptException(world.approver, {
    exceptionId: exception.id,
    rationale: 'accepted while the CI job is built',
    commitSha: COMMIT,
  });
  assert.equal(world.xiv.assessGate(world.owner, 'secret_scanning', COMMIT).state, 'EXCEPTION_APPROVED');

  world.xiv.revokeException(world.approver, {
    exceptionId: exception.id,
    reason: 'the compensating control turned out not to run on the build machines',
  });
  assert.equal(world.xiv.assessGate(world.owner, 'secret_scanning', COMMIT).state, 'ASSIGNED');
  // Revoked, not erased. The record that XIV once accepted this risk survives.
  assert.equal(world.xiv.listExceptions(world.owner).length, 1);
});

test('an exception excuses the missing evidence and not a failing test', () => {
  const world = evidenceWorld();
  world.xiv.assignGate(world.owner, { gateKey: 'secret_scanning', ownerId: 'owner', verifierId: 'verifier' });
  const exception = world.xiv.fileException(world.owner, gap());
  world.xiv.acceptException(world.approver, {
    exceptionId: exception.id,
    rationale: 'accepted while the CI job is built',
    commitSha: COMMIT,
  });

  world.xiv.recordEvidence(
    world.owner,
    passingEvidence({
      gateKey: 'secret_scanning',
      testSuite: 'gitleaks',
      testCase: 'repository scan',
      expectedResult: '0 findings at high or above',
      actualResult: '1 high finding in a checked-in configuration file',
      status: 'fail',
      outcomeKind: 'positive',
    }),
  );

  // "We have not finished the scan" is a schedule problem someone can accept.
  // "The scan found something" is a result, and no exception turns a found
  // credential into an absent one.
  assert.equal(world.xiv.assessGate(world.owner, 'secret_scanning', COMMIT).state, 'FAIL');
});
