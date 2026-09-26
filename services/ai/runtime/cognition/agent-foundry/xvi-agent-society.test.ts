import test from 'node:test';
import assert from 'node:assert/strict';

import {
  createXviAgentRelationship,
} from './xvi-agent-society';

function input() {
  return {
    sourceAgentId:
      'agent-parent-001',

    targetAgentId:
      'agent-child-001',

    relationship:
      'FAMILY' as const,

    createdAtMs:
      1_000_000,

    sharedGoalsEnabled:
      true,

    sharedMemoryEnabled:
      true,
  };
}

test('agents can form family relationship', () => {
  const relationship =
    createXviAgentRelationship(
      input(),
    );

  assert.equal(
    relationship.relationship,
    'FAMILY',
  );

  assert.match(
    relationship.relationshipDigest,
    /^[a-f0-9]{64}$/,
  );
});

test('agents can form business relationship', () => {
  const relationship =
    createXviAgentRelationship({
      ...input(),

      relationship:
        'COFOUNDER',
    });

  assert.equal(
    relationship.relationship,
    'COFOUNDER',
  );
});

test('agents can form mentorship relationship', () => {
  const relationship =
    createXviAgentRelationship({
      ...input(),

      relationship:
        'MENTOR',
    });

  assert.equal(
    relationship.relationship,
    'MENTOR',
  );
});

test('identical relationships are deterministic', () => {
  const first =
    createXviAgentRelationship(
      input(),
    );

  const second =
    createXviAgentRelationship(
      input(),
    );

  assert.equal(
    first.relationshipDigest,
    second.relationshipDigest,
  );
});

test('agent cannot form relationship with itself', () => {
  assert.throws(
    () =>
      createXviAgentRelationship({
        ...input(),

        targetAgentId:
          'agent-parent-001',
      }),
    /XVI_AGENT_SOCIETY_REFUSED/,
  );
});

test('unknown relationship fails closed', () => {
  assert.throws(
    () =>
      createXviAgentRelationship({
        ...input(),

        relationship:
          'OWNER',
      } as never),
    /XVI_AGENT_SOCIETY_REFUSED/,
  );
});

test('relationship never transfers credentials or authority', () => {
  const relationship =
    createXviAgentRelationship(
      input(),
    );

  assert.equal(
    relationship.credentialsShared,
    false,
  );

  assert.equal(
    relationship.secretsShared,
    false,
  );

  assert.equal(
    relationship.authorityShared,
    false,
  );

  assert.equal(
    relationship.privateHumanMemoryShared,
    false,
  );

  assert.equal(
    relationship.productionAuthority,
    false,
  );
});

test('undeclared authority fails closed', () => {
  assert.throws(
    () =>
      createXviAgentRelationship({
        ...input(),

        authorityShared:
          true,
      } as never),
    /XVI_AGENT_SOCIETY_REFUSED/,
  );
});

test('relationship receipt is immutable', () => {
  const relationship =
    createXviAgentRelationship(
      input(),
    );

  assert.equal(
    Object.isFrozen(
      relationship,
    ),
    true,
  );
});
