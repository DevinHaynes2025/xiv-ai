import type {
  XviSupervisedResponseReceipt,
} from '../sources/xvi-supervised-response';

import type {
  XviQuarantineReceipt,
} from './xvi-quarantine-verdict';

export interface XviResponseQuarantineInput {
  response:
    Readonly<XviSupervisedResponseReceipt>;

  quarantine:
    Readonly<XviQuarantineReceipt>;
}

export interface XviResponseQuarantineBinding {
  version:
    'xvi-response-quarantine-binding-v1';

  sourceId: string;
  manifestDigest: string;
  requestDigest: string;
  contentDigest: string;
  provenanceDigest: string;

  payloadBytes: number;

  quarantineVerified: true;
  eligibleForProvenance: true;

  contentTrustedAsInstructions: false;

  executesContent: false;
  executesFetch: false;
  executesTraining: false;

  networkAuthority: false;
  productionAuthority: false;
}

const refuse = (): never => {
  throw new Error(
    'XVI_RESPONSE_QUARANTINE_BINDING_REFUSED',
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
    'response',
    'quarantine',
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

export function bindXviResponseToQuarantine(
  input: XviResponseQuarantineInput,
): Readonly<XviResponseQuarantineBinding> {
  const d =
    exactInput(input);

  const response =
    d.response.value as
      Readonly<XviSupervisedResponseReceipt>;

  const quarantine =
    d.quarantine.value as
      Readonly<XviQuarantineReceipt>;

  if (
    response.version !==
      'xvi-supervised-response-v1' ||
    response.statusCode !== 200 ||
    response.contentType !==
      'application/json' ||
    response.eligibleForQuarantine !==
      true ||
    response.networkAuthority !== false ||
    response.executesContent !== false ||
    response.executesTraining !== false ||
    response.productionAuthority !== false
  ) {
    refuse();
  }

  if (
    quarantine.version !==
      'xvi-quarantine-v1' ||
    quarantine.decision !== 'CLEAN' ||
    quarantine.safeForMemoryAdmission !==
      true ||
    quarantine.executesContent !== false ||
    quarantine.executesFetch !== false ||
    quarantine.executesTraining !== false ||
    quarantine.networkAuthority !== false ||
    quarantine.productionAuthority !== false
  ) {
    refuse();
  }

  if (
    response.sourceId !==
      quarantine.sourceId ||
    response.manifestDigest !==
      quarantine.manifestDigest ||
    response.contentDigest !==
      quarantine.contentDigest
  ) {
    refuse();
  }

  return Object.freeze({
    version:
      'xvi-response-quarantine-binding-v1' as const,

    sourceId:
      response.sourceId,

    manifestDigest:
      response.manifestDigest,

    requestDigest:
      response.requestDigest,

    contentDigest:
      response.contentDigest,

    provenanceDigest:
      quarantine.provenanceDigest,

    payloadBytes:
      response.payloadBytes,

    quarantineVerified:
      true as const,

    eligibleForProvenance:
      true as const,

    contentTrustedAsInstructions:
      false as const,

    executesContent:
      false as const,

    executesFetch:
      false as const,

    executesTraining:
      false as const,

    networkAuthority:
      false as const,

    productionAuthority:
      false as const,
  });
}
