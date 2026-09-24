import { createHash, timingSafeEqual } from 'node:crypto';

export type FabricRestartConnectivity =
  | 'OFFLINE_ONLY'
  | 'ONLINE_ALLOWED'
  | 'ONLINE_REQUIRED';

export type FabricRestartConfidentiality =
  | 'PUBLIC'
  | 'INTERNAL'
  | 'CONFIDENTIAL'
  | 'TOP_SECRET';

export type FabricRestartRisk =
  | 'LOW'
  | 'CONSEQUENTIAL'
  | 'PROHIBITED';

export interface FabricRestartInput {
  tenantId: string;
  missionId: string;
  planDigest: string;
  journalDigest: string;
  connectivity: FabricRestartConnectivity;
  confidentiality: FabricRestartConfidentiality;
  risk: FabricRestartRisk;
  sourceCommit: string;
}

export interface FabricRestartEnvelope extends FabricRestartInput {
  version: 'xvi-agent-fabric-restart-v1';
  executesNothing: true;
  productionAuthority: false;
  providerCalls: 0;
  processSpawns: 0;
  envelopeDigest: string;
}

export type FabricRestartVerification =
  | 'VERIFIED_FOR_RECOVERY_EVALUATION'
  | 'REFUSED';

export const XVI_FABRIC_RESTART_GUARDRAILS = Object.freeze({
  humanDecision: 'REQUIRED' as const,
  executesNothing: true,
  productionAuthority: false,
  providerCalls: 0,
  processSpawns: 0,
  executionAuthorityGranted: false,
  recoveryEvaluationOnly: true,
});

const refuse = (): never => {
  throw new Error('XVI_FABRIC_RESTART_REFUSED');
};

function exactObject(
  value: unknown,
  keys: readonly string[],
): asserts value is Record<string, unknown> {
  if (
    value === null ||
    typeof value !== 'object' ||
    Array.isArray(value) ||
    Object.getPrototypeOf(value) !== Object.prototype
  ) {
    refuse();
  }

  const descriptors = Object.getOwnPropertyDescriptors(value);
  const ownKeys = Reflect.ownKeys(value);

  if (
    ownKeys.length !== keys.length ||
    ownKeys.some(
      key => typeof key !== 'string' || !keys.includes(key),
    ) ||
    keys.some(key => {
      const descriptor = descriptors[key];

      return (
        !descriptor ||
        !('value' in descriptor) ||
        descriptor.enumerable !== true
      );
    })
  ) {
    refuse();
  }
}

function values(
  input: Record<string, unknown>,
): Record<string, unknown> {
  const descriptors = Object.getOwnPropertyDescriptors(input);
  const result: Record<string, unknown> = {};

  for (const [key, descriptor] of Object.entries(descriptors)) {
    if (!('value' in descriptor)) {
      refuse();
    }

    result[key] = descriptor.value;
  }

  return result;
}

function boundedId(value: unknown): string {
  if (
    typeof value !== 'string' ||
    value.length < 1 ||
    value.length > 128 ||
    !/^[A-Za-z0-9_.:@-]+$/.test(value)
  ) {
    refuse();
  }

  return value;
}

function exactHex(
  value: unknown,
  length: number,
): string {
  if (
    typeof value !== 'string' ||
    value.length !== length ||
    !/^[0-9a-f]+$/.test(value)
  ) {
    refuse();
  }

  return value;
}

function enumValue<T extends string>(
  value: unknown,
  allowed: readonly T[],
): T {
  if (
    typeof value !== 'string' ||
    !allowed.includes(value as T)
  ) {
    refuse();
  }

  return value as T;
}

function canonicalInput(
  input: unknown,
): Readonly<FabricRestartInput> {
  const keys = [
    'tenantId',
    'missionId',
    'planDigest',
    'journalDigest',
    'connectivity',
    'confidentiality',
    'risk',
    'sourceCommit',
  ] as const;

  exactObject(input, keys);

  const v = values(input);

  return Object.freeze({
    tenantId: boundedId(v.tenantId),
    missionId: boundedId(v.missionId),
    planDigest: exactHex(v.planDigest, 64),
    journalDigest: exactHex(v.journalDigest, 64),
    connectivity: enumValue(
      v.connectivity,
      ['OFFLINE_ONLY', 'ONLINE_ALLOWED', 'ONLINE_REQUIRED'] as const,
    ),
    confidentiality: enumValue(
      v.confidentiality,
      ['PUBLIC', 'INTERNAL', 'CONFIDENTIAL', 'TOP_SECRET'] as const,
    ),
    risk: enumValue(
      v.risk,
      ['LOW', 'CONSEQUENTIAL', 'PROHIBITED'] as const,
    ),
    sourceCommit: exactHex(v.sourceCommit, 40),
  });
}

function digestPayload(
  payload: Omit<FabricRestartEnvelope, 'envelopeDigest'>,
): string {
  return createHash('sha256')
    .update(JSON.stringify(payload), 'utf8')
    .digest('hex');
}

export function createFabricRestartEnvelope(
  input: FabricRestartInput,
): Readonly<FabricRestartEnvelope> {
  const canonical = canonicalInput(input);

  const payload = Object.freeze({
    version: 'xvi-agent-fabric-restart-v1' as const,
    ...canonical,
    executesNothing: true as const,
    productionAuthority: false as const,
    providerCalls: 0 as const,
    processSpawns: 0 as const,
  });

  return Object.freeze({
    ...payload,
    envelopeDigest: digestPayload(payload),
  });
}

function safeDigestEqual(a: string, b: string): boolean {
  if (
    !/^[0-9a-f]{64}$/.test(a) ||
    !/^[0-9a-f]{64}$/.test(b)
  ) {
    return false;
  }

  return timingSafeEqual(
    Buffer.from(a, 'hex'),
    Buffer.from(b, 'hex'),
  );
}

function canonicalEnvelopeForVerification(
  input: unknown,
): Readonly<FabricRestartEnvelope> {
  const keys = [
    'version',
    'tenantId',
    'missionId',
    'planDigest',
    'journalDigest',
    'connectivity',
    'confidentiality',
    'risk',
    'sourceCommit',
    'executesNothing',
    'productionAuthority',
    'providerCalls',
    'processSpawns',
    'envelopeDigest',
  ] as const;

  exactObject(input, keys);

  const descriptors = Object.getOwnPropertyDescriptors(input);

  const read = (key: string): unknown => {
    const descriptor = descriptors[key];

    if (
      !descriptor ||
      !('value' in descriptor) ||
      descriptor.enumerable !== true
    ) {
      refuse();
    }

    return descriptor.value;
  };

  if (read('version') !== 'xvi-agent-fabric-restart-v1') {
    refuse();
  }

  if (
    read('executesNothing') !== true ||
    read('productionAuthority') !== false ||
    read('providerCalls') !== 0 ||
    read('processSpawns') !== 0
  ) {
    refuse();
  }

  const canonical = Object.freeze({
    version: 'xvi-agent-fabric-restart-v1' as const,
    tenantId: boundedId(read('tenantId')),
    missionId: boundedId(read('missionId')),
    planDigest: exactHex(read('planDigest'), 64),
    journalDigest: exactHex(read('journalDigest'), 64),
    connectivity: enumValue(
      read('connectivity'),
      ['OFFLINE_ONLY', 'ONLINE_ALLOWED', 'ONLINE_REQUIRED'] as const,
    ),
    confidentiality: enumValue(
      read('confidentiality'),
      ['PUBLIC', 'INTERNAL', 'CONFIDENTIAL', 'TOP_SECRET'] as const,
    ),
    risk: enumValue(
      read('risk'),
      ['LOW', 'CONSEQUENTIAL', 'PROHIBITED'] as const,
    ),
    sourceCommit: exactHex(read('sourceCommit'), 40),
    executesNothing: true as const,
    productionAuthority: false as const,
    providerCalls: 0 as const,
    processSpawns: 0 as const,
    envelopeDigest: exactHex(read('envelopeDigest'), 64),
  });

  const {
    envelopeDigest,
    ...payload
  } = canonical;

  if (
    !safeDigestEqual(
      envelopeDigest,
      digestPayload(payload),
    )
  ) {
    refuse();
  }

  return canonical;
}

export function verifyFabricRestartEnvelope(
  expected: Readonly<FabricRestartEnvelope>,
  observed: Readonly<FabricRestartEnvelope>,
): FabricRestartVerification {
  try {
    const canonicalExpected =
      canonicalEnvelopeForVerification(expected);

    const canonicalObserved =
      canonicalEnvelopeForVerification(observed);

    const fields: readonly (keyof FabricRestartInput)[] = [
      'tenantId',
      'missionId',
      'planDigest',
      'journalDigest',
      'connectivity',
      'confidentiality',
      'risk',
      'sourceCommit',
    ];

    for (const field of fields) {
      if (
        canonicalExpected[field] !==
        canonicalObserved[field]
      ) {
        return 'REFUSED';
      }
    }

    if (
      !safeDigestEqual(
        canonicalExpected.envelopeDigest,
        canonicalObserved.envelopeDigest,
      )
    ) {
      return 'REFUSED';
    }

    return 'VERIFIED_FOR_RECOVERY_EVALUATION';
  } catch {
    return 'REFUSED';
  }
}
