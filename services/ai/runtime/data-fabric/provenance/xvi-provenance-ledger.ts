import {
  createHash,
} from 'node:crypto';

import type {
  XviBrainTarget,
} from '../xvi-source-manifest';

export interface XviProvenanceInput {
  sourceId: string;
  manifestDigest: string;

  observedAtMs: number;

  schemaVersion: string;

  contentDigest: string;

  brainTargets:
    readonly XviBrainTarget[];

  parentDigest:
    string | null;
}

export interface XviProvenanceReceipt {
  version:
    'xvi-provenance-receipt-v1';

  sourceId: string;
  manifestDigest: string;

  observedAtMs: number;
  schemaVersion: string;

  contentDigest: string;

  brainTargets:
    readonly XviBrainTarget[];

  parentDigest:
    string | null;

  provenanceDigest: string;

  executesFetch: false;
  executesTraining: false;
  networkAuthority: false;
  productionAuthority: false;
}

const VALID_BRAINS =
  new Set<XviBrainTarget>([
    'MACRO',
    'FINANCIAL',
    'COMPANY',
    'HEALTH',
    'MENTAL_HEALTH',
    'GOVERNMENT',
    'CODE',
    'SCIENCE',
    'SUPPLY_CHAIN',
    'GEOSPATIAL',
    'TECHNOLOGY',
    'GOVERNANCE',
  ]);

const refuse = (): never => {
  throw new Error(
    'XVI_PROVENANCE_REFUSED',
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
    'sourceId',
    'manifestDigest',
    'observedAtMs',
    'schemaVersion',
    'contentDigest',
    'brainTargets',
    'parentDigest',
  ] as const;

  const descriptors =
    Object.getOwnPropertyDescriptors(
      value,
    );

  const keys =
    Reflect.ownKeys(value);

  if (
    keys.length !== expected.length ||
    keys.some(
      key =>
        typeof key !== 'string' ||
        !expected.includes(
          key as
            (typeof expected)[number],
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

function identifier(
  value: unknown,
  max = 128,
): string {
  if (
    typeof value !== 'string' ||
    value.length < 1 ||
    value.length > max ||
    value !== value.trim()
  ) {
    refuse();
  }

  return value;
}

function digest64(
  value: unknown,
): string {
  if (
    typeof value !== 'string' ||
    !/^[a-f0-9]{64}$/.test(value)
  ) {
    refuse();
  }

  return value;
}

export function createXviProvenanceReceipt(
  input: XviProvenanceInput,
): Readonly<XviProvenanceReceipt> {
  const d =
    exactInput(input);

  const sourceId =
    identifier(
      d.sourceId.value,
      128,
    );

  const manifestDigest =
    digest64(
      d.manifestDigest.value,
    );

  const observedAtMs =
    d.observedAtMs.value;

  if (
    typeof observedAtMs !== 'number' ||
    !Number.isSafeInteger(observedAtMs) ||
    observedAtMs < 0
  ) {
    refuse();
  }

  const schemaVersion =
    identifier(
      d.schemaVersion.value,
      128,
    );

  const contentDigest =
    digest64(
      d.contentDigest.value,
    );

  const targets =
    d.brainTargets.value;

  if (
    !Array.isArray(targets) ||
    targets.length < 1 ||
    targets.length > 12 ||
    new Set(targets).size !==
      targets.length ||
    targets.some(
      target =>
        typeof target !== 'string' ||
        !VALID_BRAINS.has(
          target as XviBrainTarget,
        ),
    )
  ) {
    refuse();
  }

  const parentDigest =
    d.parentDigest.value;

  if (
    parentDigest !== null &&
    !/^[a-f0-9]{64}$/.test(
      parentDigest,
    )
  ) {
    refuse();
  }

  const frozenTargets =
    Object.freeze([
      ...targets,
    ]) as readonly XviBrainTarget[];

  const canonical =
    JSON.stringify([
      'xvi-provenance-receipt-v1',
      sourceId,
      manifestDigest,
      observedAtMs,
      schemaVersion,
      contentDigest,
      frozenTargets,
      parentDigest,
    ]);

  const provenanceDigest =
    createHash('sha256')
      .update(canonical)
      .digest('hex');

  return Object.freeze({
    version:
      'xvi-provenance-receipt-v1' as const,

    sourceId,
    manifestDigest,

    observedAtMs,
    schemaVersion,

    contentDigest,

    brainTargets:
      frozenTargets,

    parentDigest,

    provenanceDigest,

    executesFetch: false as const,
    executesTraining: false as const,
    networkAuthority: false as const,
    productionAuthority: false as const,
  });
}
