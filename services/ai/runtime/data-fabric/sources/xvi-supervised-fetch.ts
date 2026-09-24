import type {
  XviAdmittedSource,
} from '../xvi-source-validator';

import type {
  XviFetchRequest,
} from './xvi-fetch-request';

export interface XviSupervisedFetchInput {
  source:
    Readonly<XviAdmittedSource>;

  request:
    Readonly<XviFetchRequest>;
}

export interface XviSupervisedFetchReceipt {
  version:
    'xvi-supervised-fetch-v1';

  sourceId: string;
  manifestDigest: string;
  requestDigest: string;

  canonicalOrigin: string;
  endpointPath: string;

  maximumResponseBytes: number;
  timeoutMs: number;
  requestsPerMinute: number;

  decision:
    'SUPERVISED_FETCH_ELIGIBLE';

  networkCallPerformed: false;
  credentialsSent: false;
  redirectFollowed: false;
  contentExecuted: false;
  productionAuthority: false;
}

const refuse = (): never => {
  throw new Error(
    'XVI_SUPERVISED_FETCH_REFUSED',
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
    'source',
    'request',
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

export function authorizeXviSupervisedFetch(
  input: XviSupervisedFetchInput,
): Readonly<XviSupervisedFetchReceipt> {
  const d =
    exactInput(input);

  const source =
    d.source.value as
      Readonly<XviAdmittedSource>;

  const request =
    d.request.value as
      Readonly<XviFetchRequest>;

  if (
    source.version !==
      'xvi-admitted-source-v1' ||
    source.admittedForRetrieval !== true ||
    source.executesFetch !== false ||
    source.networkAuthority !== false ||
    source.productionAuthority !== false
  ) {
    refuse();
  }

  if (
    request.version !==
      'xvi-fetch-request-v1' ||
    request.method !== 'GET' ||
    request.executesFetch !== false ||
    request.networkAuthority !== false ||
    request.followsRedirects !== false ||
    request.sendsCredentials !== false ||
    request.executesReturnedContent !== false ||
    request.productionAuthority !== false
  ) {
    refuse();
  }

  if (
    source.manifest.sourceId !==
      request.sourceId ||
    source.manifestDigest !==
      request.manifestDigest
  ) {
    refuse();
  }

  const admittedOrigin =
    new URL(
      source.manifest.canonicalOrigin,
    ).origin;

  if (
    admittedOrigin !==
      request.canonicalOrigin
  ) {
    refuse();
  }

  return Object.freeze({
    version:
      'xvi-supervised-fetch-v1' as const,

    sourceId:
      request.sourceId,

    manifestDigest:
      request.manifestDigest,

    requestDigest:
      request.requestDigest,

    canonicalOrigin:
      request.canonicalOrigin,

    endpointPath:
      request.endpointPath,

    maximumResponseBytes:
      request.maximumResponseBytes,

    timeoutMs:
      request.timeoutMs,

    requestsPerMinute:
      request.requestsPerMinute,

    decision:
      'SUPERVISED_FETCH_ELIGIBLE' as const,

    networkCallPerformed:
      false as const,

    credentialsSent:
      false as const,

    redirectFollowed:
      false as const,

    contentExecuted:
      false as const,

    productionAuthority:
      false as const,
  });
}
