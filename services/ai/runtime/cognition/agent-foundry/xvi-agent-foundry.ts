import {
  createHash,
} from 'node:crypto';

import type {
  XviTransformerId,
} from '../transformers/xvi-transformer-registry';

export interface XviAgentBirthInput {
  parentAgentId: string;
  parentLineageDigest: string | null;

  childAgentId: string;

  transformerId: XviTransformerId;

  purpose: string;

  generation: number;
  createdAtMs: number;
}

export interface XviAgentBirthReceipt {
  version:
    'xvi-agent-birth-v1';

  parentAgentId: string;
  parentLineageDigest: string | null;

  childAgentId: string;

  transformerId: XviTransformerId;

  purpose: string;

  generation: number;
  createdAtMs: number;

  lineageDigest: string;

  inheritedCredentials: false;
  inheritedAuthority: false;
  inheritedSecrets: false;

  externalActionAuthority: false;
  productionAuthority: false;

  requiresCapabilityGrant: true;
}

const refuse = (): never => {
  throw new Error(
    'XVI_AGENT_FOUNDRY_REFUSED',
  );
};

function identifier(
  value: unknown,
): string {
  if (
    typeof value !== 'string' ||
    value.length < 1 ||
    value.length > 128 ||
    value !== value.trim() ||
    !/^[A-Za-z0-9][A-Za-z0-9_.:@/-]*$/.test(
      value,
    )
  ) {
    refuse();
  }

  return value;
}

export function createXviAgentDescendant(
  input: XviAgentBirthInput,
): Readonly<XviAgentBirthReceipt> {
  if (
    input === null ||
    typeof input !== 'object' ||
    Array.isArray(input) ||
    Object.getPrototypeOf(input) !==
      Object.prototype
  ) {
    refuse();
  }

  const expected = [
    'parentAgentId',
    'parentLineageDigest',
    'childAgentId',
    'transformerId',
    'purpose',
    'generation',
    'createdAtMs',
  ];

  const descriptors =
    Object.getOwnPropertyDescriptors(
      input,
    );

  const keys =
    Reflect.ownKeys(input);

  if (
    keys.length !== expected.length ||
    keys.some(
      key =>
        typeof key !== 'string' ||
        !expected.includes(key),
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

  const parentAgentId =
    identifier(
      descriptors.parentAgentId.value,
    );

  const childAgentId =
    identifier(
      descriptors.childAgentId.value,
    );

  if (
    parentAgentId === childAgentId
  ) {
    refuse();
  }

  const parentLineageDigest =
    descriptors.parentLineageDigest.value;

  if (
    parentLineageDigest !== null &&
    (
      typeof parentLineageDigest !==
        'string' ||
      !/^[a-f0-9]{64}$/.test(
        parentLineageDigest,
      )
    )
  ) {
    refuse();
  }

  const transformerId =
    descriptors.transformerId.value as
      XviTransformerId;

  const purpose =
    descriptors.purpose.value;

  if (
    typeof purpose !== 'string' ||
    purpose.length < 1 ||
    purpose.length > 2048 ||
    purpose !== purpose.trim()
  ) {
    refuse();
  }

  const generation =
    descriptors.generation.value;

  const createdAtMs =
    descriptors.createdAtMs.value;

  if (
    !Number.isSafeInteger(generation) ||
    generation < 1 ||
    generation > 1_000_000 ||
    !Number.isSafeInteger(createdAtMs) ||
    createdAtMs < 0
  ) {
    refuse();
  }

  const canonical =
    JSON.stringify([
      'xvi-agent-birth-v1',
      parentAgentId,
      parentLineageDigest,
      childAgentId,
      transformerId,
      purpose,
      generation,
      createdAtMs,
    ]);

  const lineageDigest =
    createHash('sha256')
      .update(canonical)
      .digest('hex');

  return Object.freeze({
    version:
      'xvi-agent-birth-v1' as const,

    parentAgentId,
    parentLineageDigest,

    childAgentId,

    transformerId,
    purpose,

    generation,
    createdAtMs,

    lineageDigest,

    inheritedCredentials:
      false as const,

    inheritedAuthority:
      false as const,

    inheritedSecrets:
      false as const,

    externalActionAuthority:
      false as const,

    productionAuthority:
      false as const,

    requiresCapabilityGrant:
      true as const,
  });
}
