import {
  createHash,
} from 'node:crypto';

export interface XviFetchRequestInput {
  sourceId: string;
  manifestDigest: string;

  canonicalOrigin: string;
  endpointPath: string;

  purpose: string;

  maximumResponseBytes: number;
  timeoutMs: number;

  requestsPerMinute: number;
}

export interface XviFetchRequest {
  version: 'xvi-fetch-request-v1';

  sourceId: string;
  manifestDigest: string;

  canonicalOrigin: string;
  endpointPath: string;

  purpose: string;

  maximumResponseBytes: number;
  timeoutMs: number;
  requestsPerMinute: number;

  requestDigest: string;

  method: 'GET';

  executesFetch: false;
  networkAuthority: false;
  followsRedirects: false;
  sendsCredentials: false;
  executesReturnedContent: false;
  productionAuthority: false;
}

export const XVI_FETCH_REQUEST_GUARDRAILS =
  Object.freeze({
    maximumResponseBytes:
      16 * 1024 * 1024,

    maximumTimeoutMs:
      30_000,

    maximumRequestsPerMinute:
      60,

    allowedMethod:
      'GET' as const,

    executesFetch: false,
    networkAuthority: false,

    followsRedirects: false,
    sendsCredentials: false,

    executesReturnedContent: false,
    productionAuthority: false,
  });

const refuse = (): never => {
  throw new Error(
    'XVI_FETCH_REQUEST_REFUSED',
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
    'canonicalOrigin',
    'endpointPath',
    'purpose',
    'maximumResponseBytes',
    'timeoutMs',
    'requestsPerMinute',
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

function text(
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

export function createXviFetchRequest(
  input: XviFetchRequestInput,
): Readonly<XviFetchRequest> {
  const d =
    exactInput(input);

  const sourceId =
    text(
      d.sourceId.value,
      128,
    );

  const manifestDigest =
    d.manifestDigest.value;

  if (
    typeof manifestDigest !== 'string' ||
    !/^[a-f0-9]{64}$/.test(
      manifestDigest,
    )
  ) {
    refuse();
  }

  const rawOrigin =
    text(
      d.canonicalOrigin.value,
      2048,
    );

  let origin: URL;

  try {
    origin =
      new URL(rawOrigin);
  } catch {
    refuse();
  }

  if (
    origin.protocol !== 'https:' ||
    origin.username !== '' ||
    origin.password !== '' ||
    origin.hash !== '' ||
    origin.search !== ''
  ) {
    refuse();
  }

  /*
   * Origin means origin only.
   * Endpoint paths are separately admitted.
   */
  if (
    origin.pathname !== '/' &&
    origin.pathname !== ''
  ) {
    refuse();
  }

  const canonicalOrigin =
    origin.origin;

  const endpointPath =
    text(
      d.endpointPath.value,
      2048,
    );

  if (
    !endpointPath.startsWith('/') ||
    endpointPath.startsWith('//') ||
    endpointPath.includes('\\') ||
    endpointPath.includes('\0')
  ) {
    refuse();
  }

  let resolved: URL;

  try {
    resolved =
      new URL(
        endpointPath,
        canonicalOrigin,
      );
  } catch {
    refuse();
  }

  /*
   * Endpoint must remain on the exact
   * admitted origin.
   */
  if (
    resolved.origin !==
      canonicalOrigin
  ) {
    refuse();
  }

  const purpose =
    text(
      d.purpose.value,
      512,
    );

  const maximumResponseBytes =
    boundedInteger(
      d.maximumResponseBytes.value,
      1,
      XVI_FETCH_REQUEST_GUARDRAILS
        .maximumResponseBytes,
    );

  const timeoutMs =
    boundedInteger(
      d.timeoutMs.value,
      1,
      XVI_FETCH_REQUEST_GUARDRAILS
        .maximumTimeoutMs,
    );

  const requestsPerMinute =
    boundedInteger(
      d.requestsPerMinute.value,
      1,
      XVI_FETCH_REQUEST_GUARDRAILS
        .maximumRequestsPerMinute,
    );

  const canonical =
    JSON.stringify([
      'xvi-fetch-request-v1',
      sourceId,
      manifestDigest,
      canonicalOrigin,
      endpointPath,
      purpose,
      maximumResponseBytes,
      timeoutMs,
      requestsPerMinute,
      'GET',
    ]);

  const requestDigest =
    createHash('sha256')
      .update(canonical)
      .digest('hex');

  return Object.freeze({
    version:
      'xvi-fetch-request-v1' as const,

    sourceId,
    manifestDigest,

    canonicalOrigin,
    endpointPath,

    purpose,

    maximumResponseBytes,
    timeoutMs,
    requestsPerMinute,

    requestDigest,

    method:
      'GET' as const,

    executesFetch:
      false as const,

    networkAuthority:
      false as const,

    followsRedirects:
      false as const,

    sendsCredentials:
      false as const,

    executesReturnedContent:
      false as const,

    productionAuthority:
      false as const,
  });
}
