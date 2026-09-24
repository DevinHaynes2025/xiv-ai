import {
  createHash,
} from 'node:crypto';

import type {
  XviSupervisedFetchReceipt,
} from './xvi-supervised-fetch';

export interface XviSupervisedResponseInput {
  authorization:
    Readonly<XviSupervisedFetchReceipt>;

  statusCode: number;
  contentType: string;

  payload: string;

  redirectOccurred: boolean;
}

export interface XviSupervisedResponseReceipt {
  version:
    'xvi-supervised-response-v1';

  sourceId: string;
  manifestDigest: string;
  requestDigest: string;

  statusCode: 200;

  contentType:
    'application/json';

  payloadBytes: number;
  contentDigest: string;

  eligibleForQuarantine: true;

  networkAuthority: false;
  executesContent: false;
  executesTraining: false;
  productionAuthority: false;
}

const refuse = (): never => {
  throw new Error(
    'XVI_SUPERVISED_RESPONSE_REFUSED',
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
    'authorization',
    'statusCode',
    'contentType',
    'payload',
    'redirectOccurred',
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

export function admitXviSupervisedResponse(
  input: XviSupervisedResponseInput,
): Readonly<XviSupervisedResponseReceipt> {
  const d =
    exactInput(input);

  const authorization =
    d.authorization.value as
      Readonly<XviSupervisedFetchReceipt>;

  if (
    authorization.version !==
      'xvi-supervised-fetch-v1' ||
    authorization.decision !==
      'SUPERVISED_FETCH_ELIGIBLE' ||
    authorization.networkCallPerformed !==
      false ||
    authorization.credentialsSent !==
      false ||
    authorization.redirectFollowed !==
      false ||
    authorization.contentExecuted !==
      false ||
    authorization.productionAuthority !==
      false
  ) {
    refuse();
  }

  const statusCode =
    d.statusCode.value;

  if (statusCode !== 200) {
    refuse();
  }

  const contentType =
    d.contentType.value;

  if (
    contentType !==
      'application/json'
  ) {
    refuse();
  }

  const redirectOccurred =
    d.redirectOccurred.value;

  if (
    typeof redirectOccurred !==
      'boolean' ||
    redirectOccurred
  ) {
    refuse();
  }

  const payload =
    d.payload.value;

  if (
    typeof payload !== 'string'
  ) {
    refuse();
  }

  const payloadBytes =
    Buffer.byteLength(
      payload,
      'utf8',
    );

  if (
    payloadBytes < 1 ||
    payloadBytes >
      authorization.maximumResponseBytes
  ) {
    refuse();
  }

  /*
   * Require valid JSON before anything can
   * move toward quarantine.
   */
  try {
    JSON.parse(payload);
  } catch {
    refuse();
  }

  const contentDigest =
    createHash('sha256')
      .update(payload, 'utf8')
      .digest('hex');

  return Object.freeze({
    version:
      'xvi-supervised-response-v1' as const,

    sourceId:
      authorization.sourceId,

    manifestDigest:
      authorization.manifestDigest,

    requestDigest:
      authorization.requestDigest,

    statusCode:
      200 as const,

    contentType:
      'application/json' as const,

    payloadBytes,

    contentDigest,

    eligibleForQuarantine:
      true as const,

    networkAuthority:
      false as const,

    executesContent:
      false as const,

    executesTraining:
      false as const,

    productionAuthority:
      false as const,
  });
}
