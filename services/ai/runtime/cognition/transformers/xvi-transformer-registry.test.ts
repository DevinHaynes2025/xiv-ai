import test from 'node:test';
import assert from 'node:assert/strict';

import {
  XVI_TRANSFORMERS,
  XVI_TRANSFORMER_COUNT,
} from './xvi-transformer-registry';

import {
  createXviTransformerStatus,
} from './xvi-transformer-status';

import {
  createXviTransformerProjection,
} from './xvi-transformer-projection';

test('exactly twelve transformers are registered', () => {
  assert.equal(
    XVI_TRANSFORMER_COUNT,
    12,
  );

  assert.equal(
    XVI_TRANSFORMERS.length,
    12,
  );
});

test('transformer identities are unique', () => {
  const ids =
    XVI_TRANSFORMERS.map(
      item => item.transformerId,
    );

  assert.equal(
    new Set(ids).size,
    12,
  );
});

test('each transformer maps to one unique brain', () => {
  const brains =
    XVI_TRANSFORMERS.map(
      item => item.brainId,
    );

  assert.equal(
    new Set(brains).size,
    12,
  );
});

test('all transformers prohibit authority replication', () => {
  for (
    const transformer of
      XVI_TRANSFORMERS
  ) {
    assert.equal(
      transformer.canSelfReplicateAuthority,
      false,
    );

    assert.equal(
      transformer.canCopyCredentials,
      false,
    );

    assert.equal(
      transformer.canEscalatePermissions,
      false,
    );

    assert.equal(
      transformer.externalActionsRequireApproval,
      true,
    );

    assert.equal(
      transformer.productionAuthority,
      false,
    );
  }
});

test('transformer can represent reasoning state', () => {
  const status =
    createXviTransformerStatus(
      'SCIENCE_TRANSFORMER',
      'REASONING',
      3,
      128,
      true,
    );

  assert.equal(
    status.brainId,
    'SCIENCE',
  );

  assert.equal(
    status.state,
    'REASONING',
  );

  assert.equal(
    status.activeTasks,
    3,
  );
});

test('transformer can represent simulation state', () => {
  const status =
    createXviTransformerStatus(
      'MACRO_TRANSFORMER',
      'SIMULATING',
      1,
      1000000,
      true,
    );

  assert.equal(
    status.state,
    'SIMULATING',
  );

  assert.equal(
    status.scenarioBranches,
    1000000,
  );
});

test('unsafe runtime counters fail closed', () => {
  assert.throws(
    () =>
      createXviTransformerStatus(
        'CODE_TRANSFORMER',
        'REASONING',
        -1,
        0,
        true,
      ),
    /XVI_TRANSFORMER_STATUS_REFUSED/,
  );

  assert.throws(
    () =>
      createXviTransformerStatus(
        'CODE_TRANSFORMER',
        'SIMULATING',
        1,
        1000000001,
        true,
      ),
    /XVI_TRANSFORMER_STATUS_REFUSED/,
  );
});

test('frontend projection contains exactly twelve safe transformers', () => {
  const projection =
    createXviTransformerProjection();

  assert.equal(
    projection.transformerCount,
    12,
  );

  assert.equal(
    projection.transformers.length,
    12,
  );

  assert.equal(
    projection.frontendSafe,
    true,
  );

  assert.equal(
    projection.secretMaterialIncluded,
    false,
  );

  assert.equal(
    projection.productionAuthority,
    false,
  );
});

test('frontend transformer projection exposes no authority', () => {
  const projection =
    createXviTransformerProjection();

  for (
    const transformer of
      projection.transformers
  ) {
    assert.equal(
      transformer.externalActionAuthority,
      false,
    );

    assert.equal(
      transformer.credentialAccess,
      false,
    );

    assert.equal(
      transformer.productionAuthority,
      false,
    );
  }
});

test('frontend projection is frozen', () => {
  const projection =
    createXviTransformerProjection();

  assert.equal(
    Object.isFrozen(projection),
    true,
  );

  assert.equal(
    Object.isFrozen(
      projection.transformers,
    ),
    true,
  );
});
