import {
  createHash,
} from 'node:crypto';

import type {
  XviBrainTarget,
  XviSourceAuthority,
  XviSourceManifest,
  XviSourceSensitivity,
} from './xvi-source-manifest';

const AUTHORITIES =
  new Set<XviSourceAuthority>([
    'OFFICIAL_GOVERNMENT',
    'INTERGOVERNMENTAL',
    'PUBLIC_COMPANY',
    'OPEN_SOURCE',
    'LICENSED_PROVIDER',
    'EXPLICITLY_AUTHORIZED',
  ]);

const SENSITIVITIES =
  new Set<XviSourceSensitivity>([
    'PUBLIC',
    'PUBLIC_AGGREGATE',
    'RESTRICTED',
    'PROHIBITED',
  ]);

const BRAINS =
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

export interface XviAdmittedSource {
  version: 'xvi-admitted-source-v1';

  manifest:
    Readonly<XviSourceManifest>;

  manifestDigest: string;

  admittedForRetrieval: true;

  executesFetch: false;
  executesTraining: false;
  networkAuthority: false;
  productionAuthority: false;
}

const refuse = (): never => {
  throw new Error(
    'XVI_SOURCE_ADMISSION_REFUSED',
  );
};

function exactObject(
  value: unknown,
  expected: readonly string[],
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

  return descriptors;
}

function boundedText(
  value: unknown,
  maximum: number,
): string {
  if (
    typeof value !== 'string' ||
    value.length < 1 ||
    value.length > maximum ||
    value !== value.trim()
  ) {
    refuse();
  }

  return value;
}

function strictBoolean(
  value: unknown,
): boolean {
  if (typeof value !== 'boolean') {
    refuse();
  }

  return value;
}

function canonicalOrigin(
  value: unknown,
): string {
  const raw =
    boundedText(value, 2048);

  let parsed: URL;

  try {
    parsed = new URL(raw);
  } catch {
    refuse();
  }

  if (
    parsed.protocol !== 'https:' ||
    parsed.username !== '' ||
    parsed.password !== '' ||
    parsed.hash !== ''
  ) {
    refuse();
  }

  return parsed.toString();
}

function brainTargets(
  value: unknown,
): readonly XviBrainTarget[] {
  if (
    !Array.isArray(value) ||
    value.length < 1 ||
    value.length > 12
  ) {
    refuse();
  }

  const result:
    XviBrainTarget[] = [];

  for (const target of value) {
    if (
      typeof target !== 'string' ||
      !BRAINS.has(
        target as XviBrainTarget,
      )
    ) {
      refuse();
    }

    result.push(
      target as XviBrainTarget,
    );
  }

  if (
    new Set(result).size !==
      result.length
  ) {
    refuse();
  }

  return Object.freeze([...result]);
}

export function admitXviSource(
  candidate: XviSourceManifest,
): Readonly<XviAdmittedSource> {
  const d =
    exactObject(
      candidate,
      [
        'version',
        'sourceId',
        'sourceName',
        'authority',
        'sensitivity',
        'brainTargets',
        'canonicalOrigin',
        'retrievalAllowed',
        'trainingAllowed',
        'commercialUseAllowed',
        'attributionRequired',
        'containsPersonalData',
        'providerAuthenticationRequired',
        'authorizationVerified',
        'executesFetch',
        'networkAuthority',
        'productionAuthority',
      ],
    );

  if (
    d.version.value !==
      'xvi-source-manifest-v1'
  ) {
    refuse();
  }

  const sourceId =
    boundedText(
      d.sourceId.value,
      128,
    );

  if (
    !/^[a-z0-9][a-z0-9._-]*$/.test(
      sourceId,
    )
  ) {
    refuse();
  }

  const sourceName =
    boundedText(
      d.sourceName.value,
      256,
    );

  const authority =
    d.authority.value as
      XviSourceAuthority;

  const sensitivity =
    d.sensitivity.value as
      XviSourceSensitivity;

  if (
    !AUTHORITIES.has(authority) ||
    !SENSITIVITIES.has(sensitivity)
  ) {
    refuse();
  }

  const targets =
    brainTargets(
      d.brainTargets.value,
    );

  const origin =
    canonicalOrigin(
      d.canonicalOrigin.value,
    );

  const retrievalAllowed =
    strictBoolean(
      d.retrievalAllowed.value,
    );

  const trainingAllowed =
    strictBoolean(
      d.trainingAllowed.value,
    );

  const commercialUseAllowed =
    strictBoolean(
      d.commercialUseAllowed.value,
    );

  const attributionRequired =
    strictBoolean(
      d.attributionRequired.value,
    );

  const containsPersonalData =
    strictBoolean(
      d.containsPersonalData.value,
    );

  const authRequired =
    strictBoolean(
      d.providerAuthenticationRequired
        .value,
    );

  const authVerified =
    strictBoolean(
      d.authorizationVerified.value,
    );

  if (
    d.executesFetch.value !== false ||
    d.networkAuthority.value !== false ||
    d.productionAuthority.value !== false
  ) {
    refuse();
  }

  if (
    !retrievalAllowed ||
    sensitivity === 'PROHIBITED' ||
    containsPersonalData ||
    (authRequired && !authVerified)
  ) {
    refuse();
  }

  /*
   * Training remains independently gated.
   * Retrieval permission never implies
   * training permission.
   */
  if (
    trainingAllowed &&
    sensitivity !== 'PUBLIC'
  ) {
    refuse();
  }

  const normalized:
    Readonly<XviSourceManifest> =
    Object.freeze({
      version:
        'xvi-source-manifest-v1',

      sourceId,
      sourceName,

      authority,
      sensitivity,

      brainTargets: targets,

      canonicalOrigin: origin,

      retrievalAllowed,
      trainingAllowed,
      commercialUseAllowed,
      attributionRequired,

      containsPersonalData,

      providerAuthenticationRequired:
        authRequired,

      authorizationVerified:
        authVerified,

      executesFetch: false,
      networkAuthority: false,
      productionAuthority: false,
    });

  const canonical =
    JSON.stringify([
      normalized.version,
      normalized.sourceId,
      normalized.sourceName,
      normalized.authority,
      normalized.sensitivity,
      normalized.brainTargets,
      normalized.canonicalOrigin,
      normalized.retrievalAllowed,
      normalized.trainingAllowed,
      normalized.commercialUseAllowed,
      normalized.attributionRequired,
      normalized.containsPersonalData,
      normalized.providerAuthenticationRequired,
      normalized.authorizationVerified,
      normalized.executesFetch,
      normalized.networkAuthority,
      normalized.productionAuthority,
    ]);

  const manifestDigest =
    createHash('sha256')
      .update(canonical)
      .digest('hex');

  return Object.freeze({
    version:
      'xvi-admitted-source-v1' as const,

    manifest: normalized,

    manifestDigest,

    admittedForRetrieval:
      true as const,

    executesFetch: false as const,
    executesTraining: false as const,
    networkAuthority: false as const,
    productionAuthority: false as const,
  });
}
