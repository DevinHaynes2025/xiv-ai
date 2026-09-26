import test from 'node:test';
import assert from 'node:assert/strict';

import {
  createXviScenarioPlan,
} from './xvi-scenario-fabric';

function seed() {
  return {
    transformerId:
      'MACRO_TRANSFORMER' as const,

    objective:
      'Explore plausible economic futures.',

    horizonSteps:
      20,

    branchFactor:
      100,

    maximumMaterializedNodes:
      10000,

    sourceMemoryDigest:
      'a'.repeat(64),
  };
}

test('scenario fabric represents huge spaces without materializing them', () => {
  const plan =
    createXviScenarioPlan(
      seed(),
    );

  assert.equal(
    plan.conceptualPossibilityCount,
    '10000000000000000000000000000000000000000',
  );

  assert.equal(
    plan.maximumMaterializedNodes,
    10000,
  );
});

test('identical scenario plans are deterministic', () => {
  const first =
    createXviScenarioPlan(
      seed(),
    );

  const second =
    createXviScenarioPlan(
      seed(),
    );

  assert.equal(
    first.scenarioDigest,
    second.scenarioDigest,
  );
});

test('objective changes scenario identity', () => {
  const first =
    createXviScenarioPlan(
      seed(),
    );

  const second =
    createXviScenarioPlan({
      ...seed(),

      objective:
        'Explore supply-chain futures.',
    });

  assert.notEqual(
    first.scenarioDigest,
    second.scenarioDigest,
  );
});

test('scenario fabric never claims certainty', () => {
  const plan =
    createXviScenarioPlan(
      seed(),
    );

  assert.equal(
    plan.predictionIsCertain,
    false,
  );

  assert.equal(
    plan.uncertaintyRequired,
    true,
  );
});

test('materialization budget is bounded', () => {
  assert.throws(
    () =>
      createXviScenarioPlan({
        ...seed(),

        maximumMaterializedNodes:
          1000001,
      }),
    /XVI_SCENARIO_FABRIC_REFUSED/,
  );
});

test('branch factor is bounded', () => {
  assert.throws(
    () =>
      createXviScenarioPlan({
        ...seed(),

        branchFactor:
          1000001,
      }),
    /XVI_SCENARIO_FABRIC_REFUSED/,
  );
});

test('malformed memory identity fails closed', () => {
  assert.throws(
    () =>
      createXviScenarioPlan({
        ...seed(),

        sourceMemoryDigest:
          'bad',
      }),
    /XVI_SCENARIO_FABRIC_REFUSED/,
  );
});

test('scenario plan carries zero action authority', () => {
  const plan =
    createXviScenarioPlan(
      seed(),
    );

  assert.equal(
    plan.executesActions,
    false,
  );

  assert.equal(
    plan.networkAuthority,
    false,
  );

  assert.equal(
    plan.productionAuthority,
    false,
  );

  assert.equal(
    Object.isFrozen(plan),
    true,
  );
});
