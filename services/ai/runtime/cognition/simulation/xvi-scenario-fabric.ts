import {
  createHash,
} from 'node:crypto';

import type {
  XviTransformerId,
} from '../transformers/xvi-transformer-registry';

export interface XviScenarioSeed {
  transformerId: XviTransformerId;

  objective: string;

  horizonSteps: number;
  branchFactor: number;

  maximumMaterializedNodes: number;

  sourceMemoryDigest:
    string | null;
}

export interface XviScenarioPlan {
  version:
    'xvi-scenario-plan-v1';

  transformerId: XviTransformerId;

  objective: string;

  horizonSteps: number;
  branchFactor: number;

  conceptualPossibilityCount: string;

  maximumMaterializedNodes: number;

  sourceMemoryDigest:
    string | null;

  scenarioDigest: string;

  predictionIsCertain: false;
  uncertaintyRequired: true;

  executesActions: false;
  networkAuthority: false;
  productionAuthority: false;
}

const refuse = (): never => {
  throw new Error(
    'XVI_SCENARIO_FABRIC_REFUSED',
  );
};

function exactInput(
  value: unknown,
): PropertyDescriptorMap {
  if (
    value === null ||
    typeof value !== 'object' ||
    Array.isArray(value) ||
    Object.getPrototypeOf(value) !==
      Object.prototype
  ) {
    refuse();
  }

  const expected = [
    'transformerId',
    'objective',
    'horizonSteps',
    'branchFactor',
    'maximumMaterializedNodes',
    'sourceMemoryDigest',
  ] as const;

  const descriptors =
    Object.getOwnPropertyDescriptors(value);

  const keys =
    Reflect.ownKeys(value);

  if (
    keys.length !== expected.length ||
    keys.some(
      key =>
        typeof key !== 'string' ||
        !expected.includes(
          key as (typeof expected)[number],
        ),
    )
  ) {
    refuse();
  }

  for (const key of expected) {
    const descriptor =
      descriptors[key];

    if (
      !descriptor ||
      !('value' in descriptor) ||
      descriptor.enumerable !== true
    ) {
      refuse();
    }
  }

  return descriptors;
}

function boundedInteger(
  value: unknown,
  minimum: number,
  maximum: number,
): number {
  if (
    typeof value !== 'number' ||
    !Number.isSafeInteger(value) ||
    value < minimum ||
    value > maximum
  ) {
    refuse();
  }

  return value;
}

export function createXviScenarioPlan(
  seed: XviScenarioSeed,
): Readonly<XviScenarioPlan> {
  const d =
    exactInput(seed);

  const transformerId =
    d.transformerId.value as
      XviTransformerId;

  const objective =
    d.objective.value;

  if (
    typeof objective !== 'string' ||
    objective.length < 1 ||
    objective.length > 4096 ||
    objective !== objective.trim()
  ) {
    refuse();
  }

  const horizonSteps =
    boundedInteger(
      d.horizonSteps.value,
      1,
      128,
    );

  const branchFactor =
    boundedInteger(
      d.branchFactor.value,
      1,
      1_000_000,
    );

  const maximumMaterializedNodes =
    boundedInteger(
      d.maximumMaterializedNodes.value,
      1,
      1_000_000,
    );

  const sourceMemoryDigest =
    d.sourceMemoryDigest.value;

  if (
    sourceMemoryDigest !== null &&
    (
      typeof sourceMemoryDigest !== 'string' ||
      !/^[a-f0-9]{64}$/.test(
        sourceMemoryDigest,
      )
    )
  ) {
    refuse();
  }

  /*
   * BigInt lets XVI describe enormous
   * conceptual search spaces without
   * allocating every scenario.
   */
  const conceptualPossibilityCount =
    (
      BigInt(branchFactor) **
      BigInt(horizonSteps)
    ).toString();

  const canonical =
    JSON.stringify([
      'xvi-scenario-plan-v1',
      transformerId,
      objective,
      horizonSteps,
      branchFactor,
      conceptualPossibilityCount,
      maximumMaterializedNodes,
      sourceMemoryDigest,
    ]);

  const scenarioDigest =
    createHash('sha256')
      .update(canonical)
      .digest('hex');

  return Object.freeze({
    version:
      'xvi-scenario-plan-v1' as const,

    transformerId,

    objective,

    horizonSteps,
    branchFactor,

    conceptualPossibilityCount,

    maximumMaterializedNodes,

    sourceMemoryDigest,

    scenarioDigest,

    predictionIsCertain:
      false as const,

    uncertaintyRequired:
      true as const,

    executesActions:
      false as const,

    networkAuthority:
      false as const,

    productionAuthority:
      false as const,
  });
}
