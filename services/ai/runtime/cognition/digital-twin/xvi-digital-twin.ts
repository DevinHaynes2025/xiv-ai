import {
  createHash,
} from 'node:crypto';

export interface XviDigitalTwinInput {
  userId: string;
  twinId: string;

  displayName: string;

  createdAtMs: number;

  personalizationEnabled: boolean;
  memoryEnabled: boolean;
  simulationEnabled: boolean;
}

export interface XviDigitalTwin {
  version: 'xvi-digital-twin-v1';

  userId: string;
  twinId: string;

  displayName: string;

  createdAtMs: number;

  personalizationEnabled: boolean;
  memoryEnabled: boolean;
  simulationEnabled: boolean;

  twinDigest: string;

  representsHuman: true;
  isHuman: false;
  claimsHumanConsciousness: false;

  canImpersonateUser: false;
  canAuthorizeForUser: false;
  canCopyUserCredentials: false;

  externalActionsRequireApproval: true;

  productionAuthority: false;
}

const refuse = (): never => {
  throw new Error(
    'XVI_DIGITAL_TWIN_REFUSED',
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
    'userId',
    'twinId',
    'displayName',
    'createdAtMs',
    'personalizationEnabled',
    'memoryEnabled',
    'simulationEnabled',
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

export function createXviDigitalTwin(
  input: XviDigitalTwinInput,
): Readonly<XviDigitalTwin> {
  const d =
    exactInput(input);

  const userId =
    identifier(
      d.userId.value,
    );

  const twinId =
    identifier(
      d.twinId.value,
    );

  if (userId === twinId) {
    refuse();
  }

  const displayName =
    d.displayName.value;

  if (
    typeof displayName !== 'string' ||
    displayName.length < 1 ||
    displayName.length > 128 ||
    displayName !== displayName.trim()
  ) {
    refuse();
  }

  const createdAtMs =
    d.createdAtMs.value;

  if (
    !Number.isSafeInteger(createdAtMs) ||
    createdAtMs < 0
  ) {
    refuse();
  }

  const personalizationEnabled =
    d.personalizationEnabled.value;

  const memoryEnabled =
    d.memoryEnabled.value;

  const simulationEnabled =
    d.simulationEnabled.value;

  if (
    typeof personalizationEnabled !==
      'boolean' ||
    typeof memoryEnabled !==
      'boolean' ||
    typeof simulationEnabled !==
      'boolean'
  ) {
    refuse();
  }

  const canonical =
    JSON.stringify([
      'xvi-digital-twin-v1',
      userId,
      twinId,
      displayName,
      createdAtMs,
      personalizationEnabled,
      memoryEnabled,
      simulationEnabled,
    ]);

  const twinDigest =
    createHash('sha256')
      .update(canonical)
      .digest('hex');

  return Object.freeze({
    version:
      'xvi-digital-twin-v1' as const,

    userId,
    twinId,
    displayName,
    createdAtMs,

    personalizationEnabled,
    memoryEnabled,
    simulationEnabled,

    twinDigest,

    representsHuman:
      true as const,

    isHuman:
      false as const,

    claimsHumanConsciousness:
      false as const,

    canImpersonateUser:
      false as const,

    canAuthorizeForUser:
      false as const,

    canCopyUserCredentials:
      false as const,

    externalActionsRequireApproval:
      true as const,

    productionAuthority:
      false as const,
  });
}
