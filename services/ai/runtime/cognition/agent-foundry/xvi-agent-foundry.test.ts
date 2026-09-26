import test from 'node:test';
import assert from 'node:assert/strict';

import {
  createXviAgentDescendant,
} from './xvi-agent-foundry';

function birth() {
  return {
    parentAgentId:
      'agent-founder-001',

    parentLineageDigest:
      null,

    childAgentId:
      'agent-research-001',

    transformerId:
      'SCIENCE_TRANSFORMER' as const,

    purpose:
      'Research governed scientific questions.',

    generation:
      1,

    createdAtMs:
      1_000_000,
  };
}

test('parent can create bounded descendant identity', () => {
  const child =
    createXviAgentDescendant(
      birth(),
    );

  assert.equal(
    child.childAgentId,
    'agent-research-001',
  );

  assert.match(
    child.lineageDigest,
    /^[a-f0-9]{64}$/,
  );
});

test('identical births are deterministic', () => {
  const first =
    createXviAgentDescendant(
      birth(),
    );

  const second =
    createXviAgentDescendant(
      birth(),
    );

  assert.equal(
    first.lineageDigest,
    second.lineageDigest,
  );
});

test('child identity changes lineage', () => {
  const first =
    createXviAgentDescendant(
      birth(),
    );

  const second =
    createXviAgentDescendant({
      ...birth(),

      childAgentId:
        'agent-research-002',
    });

  assert.notEqual(
    first.lineageDigest,
    second.lineageDigest,
  );
});

test('agent cannot be its own descendant', () => {
  assert.throws(
    () =>
      createXviAgentDescendant({
        ...birth(),

        childAgentId:
          'agent-founder-001',
      }),
    /XVI_AGENT_FOUNDRY_REFUSED/,
  );
});

test('malformed parent lineage fails closed', () => {
  assert.throws(
    () =>
      createXviAgentDescendant({
        ...birth(),

        parentLineageDigest:
          'bad',
      }),
    /XVI_AGENT_FOUNDRY_REFUSED/,
  );
});

test('generation is bounded', () => {
  assert.throws(
    () =>
      createXviAgentDescendant({
        ...birth(),

        generation:
          1000001,
      }),
    /XVI_AGENT_FOUNDRY_REFUSED/,
  );
});

test('undeclared authority fails closed', () => {
  assert.throws(
    () =>
      createXviAgentDescendant({
        ...birth(),

        inheritAuthority:
          true,
      } as never),
    /XVI_AGENT_FOUNDRY_REFUSED/,
  );
});

test('descendant receives zero inherited authority', () => {
  const child =
    createXviAgentDescendant(
      birth(),
    );

  assert.equal(
    child.inheritedCredentials,
    false,
  );

  assert.equal(
    child.inheritedAuthority,
    false,
  );

  assert.equal(
    child.inheritedSecrets,
    false,
  );

  assert.equal(
    child.externalActionAuthority,
    false,
  );

  assert.equal(
    child.productionAuthority,
    false,
  );

  assert.equal(
    child.requiresCapabilityGrant,
    true,
  );
});

test('descendant receipt is immutable', () => {
  const child =
    createXviAgentDescendant(
      birth(),
    );

  assert.equal(
    Object.isFrozen(child),
    true,
  );
});
