import {
  createHash,
} from 'node:crypto';

import type {
  XviTransformerId,
} from '../transformers/xvi-transformer-registry';

export type XviIntentDomain =
  | 'LIFE'
  | 'BUSINESS'
  | 'CREATE'
  | 'LEARN'
  | 'RESEARCH'
  | 'COMMUNITY'
  | 'WELLBEING'
  | 'TECHNOLOGY';

export type XviIntentMode =
  | 'EXPLORE'
  | 'PLAN'
  | 'SIMULATE'
  | 'BUILD';

export interface XviUniverseIntentInput {
  userId: string;
  twinDigest: string | null;
  humanityContextDigest: string | null;

  utterance: string;

  domain: XviIntentDomain;
  mode: XviIntentMode;

  transformerIds:
    readonly XviTransformerId[];

  createdAtMs: number;
}

export interface XviUniverseIntent {
  version:
    'xvi-universe-intent-v1';

  userId: string;

  twinDigest: string | null;
  humanityContextDigest: string | null;

  utterance: string;

  domain: XviIntentDomain;
  mode: XviIntentMode;

  transformerIds:
    readonly XviTransformerId[];

  createdAtMs: number;

  intentDigest: string;

  mayPlan: true;
  maySimulate: true;

  executesExternalAction: false;
  spendsMoney: false;
  signsAgreement: false;
  sendsCommunication: false;
  modifiesProduction: false;

  requiresApprovalForExternalAction: true;
  productionAuthority: false;
}

const DOMAINS =
  new Set<XviIntentDomain>([
    'LIFE',
    'BUSINESS',
    'CREATE',
    'LEARN',
    'RESEARCH',
    'COMMUNITY',
    'WELLBEING',
    'TECHNOLOGY',
  ]);

const MODES =
  new Set<XviIntentMode>([
    'EXPLORE',
    'PLAN',
    'SIMULATE',
    'BUILD',
  ]);

const TRANSFORMERS =
  new Set<XviTransformerId>([
    'MACRO_TRANSFORMER',
    'FINANCIAL_TRANSFORMER',
    'COMPANY_TRANSFORMER',
    'HEALTH_TRANSFORMER',
    'MENTAL_HEALTH_TRANSFORMER',
    'GOVERNMENT_TRANSFORMER',
    'CODE_TRANSFORMER',
    'SCIENCE_TRANSFORMER',
    'SUPPLY_CHAIN_TRANSFORMER',
    'GEOSPATIAL_TRANSFORMER',
    'TECHNOLOGY_TRANSFORMER',
    'GOVERNANCE_TRANSFORMER',
  ]);

const refuse = (): never => {
  throw new Error(
    'XVI_UNIVERSE_INTENT_REFUSED',
  );
};

function digestOrNull(
  value: unknown,
): string | null {
  if (value === null) {
    return null;
  }

  if (
    typeof value !== 'string' ||
    !/^[a-f0-9]{64}$/.test(value)
  ) {
    refuse();
  }

  return value;
}

export function createXviUniverseIntent(
  input: XviUniverseIntentInput,
): Readonly<XviUniverseIntent> {
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
    'userId',
    'twinDigest',
    'humanityContextDigest',
    'utterance',
    'domain',
    'mode',
    'transformerIds',
    'createdAtMs',
  ] as const;

  const descriptors =
    Object.getOwnPropertyDescriptors(input);

  const keys =
    Reflect.ownKeys(input);

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

  const userId =
    descriptors.userId.value;

  const utterance =
    descriptors.utterance.value;

  if (
    typeof userId !== 'string' ||
    userId.length < 1 ||
    userId.length > 128 ||
    userId !== userId.trim() ||
    typeof utterance !== 'string' ||
    utterance.length < 1 ||
    utterance.length > 8192 ||
    utterance !== utterance.trim()
  ) {
    refuse();
  }

  const twinDigest =
    digestOrNull(
      descriptors.twinDigest.value,
    );

  const humanityContextDigest =
    digestOrNull(
      descriptors.humanityContextDigest.value,
    );

  const domain =
    descriptors.domain.value as
      XviIntentDomain;

  const mode =
    descriptors.mode.value as
      XviIntentMode;

  if (
    !DOMAINS.has(domain) ||
    !MODES.has(mode)
  ) {
    refuse();
  }

  const transformerIds =
    descriptors.transformerIds.value;

  if (
    !Array.isArray(transformerIds) ||
    transformerIds.length < 1 ||
    transformerIds.length > 12 ||
    new Set(transformerIds).size !==
      transformerIds.length ||
    transformerIds.some(
      transformerId =>
        typeof transformerId !== 'string' ||
        !TRANSFORMERS.has(
          transformerId as XviTransformerId,
        ),
    )
  ) {
    refuse();
  }

  const createdAtMs =
    descriptors.createdAtMs.value;

  if (
    !Number.isSafeInteger(createdAtMs) ||
    createdAtMs < 0
  ) {
    refuse();
  }

  const frozenTransformers =
    Object.freeze([
      ...transformerIds,
    ]) as readonly XviTransformerId[];

  const canonical =
    JSON.stringify([
      'xvi-universe-intent-v1',
      userId,
      twinDigest,
      humanityContextDigest,
      utterance,
      domain,
      mode,
      frozenTransformers,
      createdAtMs,
    ]);

  const intentDigest =
    createHash('sha256')
      .update(canonical)
      .digest('hex');

  return Object.freeze({
    version:
      'xvi-universe-intent-v1' as const,

    userId,

    twinDigest,
    humanityContextDigest,

    utterance,

    domain,
    mode,

    transformerIds:
      frozenTransformers,

    createdAtMs,

    intentDigest,

    mayPlan:
      true as const,

    maySimulate:
      true as const,

    executesExternalAction:
      false as const,

    spendsMoney:
      false as const,

    signsAgreement:
      false as const,

    sendsCommunication:
      false as const,

    modifiesProduction:
      false as const,

    requiresApprovalForExternalAction:
      true as const,

    productionAuthority:
      false as const,
  });
}
