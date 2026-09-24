import {
  createHash,
} from 'node:crypto';

export interface FabricLocalInferenceInput {
  tenantId: string;
  missionId: string;

  providerId: string;
  modelId: string;

  prompt: string;

  timeoutMs: number;
  maxOutputTokens: number;

  sourceCommit: string;
}

export interface FabricLocalInferenceEnvelope {
  version: 'xvi-local-inference-v1';

  tenantId: string;
  missionId: string;

  providerId: string;
  modelId: string;

  prompt: string;
  promptBytes: number;

  timeoutMs: number;
  maxOutputTokens: number;

  sourceCommit: string;

  requestDigest: string;

  executesProvider: false;
  networkAllowed: false;
  shellAllowed: false;
  productionAuthority: false;
  secretMaterialIncluded: false;
}

export const XVI_LOCAL_INFERENCE_GUARDRAILS =
  Object.freeze({
    maximumPromptBytes: 65_536,
    maximumTimeoutMs: 120_000,
    maximumOutputTokens: 8_192,

    executesProvider: false,
    networkAllowed: false,
    shellAllowed: false,
    productionAuthority: false,
    secretMaterialIncluded: false,
  });

const refuse = (): never => {
  throw new Error(
    'XVI_LOCAL_INFERENCE_REFUSED',
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

function commit(
  value: unknown,
): string {
  if (
    typeof value !== 'string' ||
    !/^[a-f0-9]{40}$/.test(value)
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

function exactInput(
  input: unknown,
): PropertyDescriptorMap {
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
    'tenantId',
    'missionId',
    'providerId',
    'modelId',
    'prompt',
    'timeoutMs',
    'maxOutputTokens',
    'sourceCommit',
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

function digestEnvelope(
  value: {
    tenantId: string;
    missionId: string;
    providerId: string;
    modelId: string;
    prompt: string;
    promptBytes: number;
    timeoutMs: number;
    maxOutputTokens: number;
    sourceCommit: string;
  },
): string {
  const canonical =
    JSON.stringify([
      'xvi-local-inference-v1',
      value.tenantId,
      value.missionId,
      value.providerId,
      value.modelId,
      value.prompt,
      value.promptBytes,
      value.timeoutMs,
      value.maxOutputTokens,
      value.sourceCommit,
    ]);

  return createHash('sha256')
    .update(canonical)
    .digest('hex');
}

export function createFabricLocalInferenceEnvelope(
  input: FabricLocalInferenceInput,
): Readonly<FabricLocalInferenceEnvelope> {
  const descriptors =
    exactInput(input);

  const tenantId =
    identifier(
      descriptors.tenantId.value,
    );

  const missionId =
    identifier(
      descriptors.missionId.value,
    );

  const providerId =
    identifier(
      descriptors.providerId.value,
    );

  const modelId =
    identifier(
      descriptors.modelId.value,
    );

  const prompt =
    descriptors.prompt.value;

  if (
    typeof prompt !== 'string' ||
    prompt.length < 1
  ) {
    refuse();
  }

  const promptBytes =
    Buffer.byteLength(
      prompt,
      'utf8',
    );

  if (
    promptBytes >
      XVI_LOCAL_INFERENCE_GUARDRAILS
        .maximumPromptBytes
  ) {
    refuse();
  }

  const timeoutMs =
    boundedInteger(
      descriptors.timeoutMs.value,
      1,
      XVI_LOCAL_INFERENCE_GUARDRAILS
        .maximumTimeoutMs,
    );

  const maxOutputTokens =
    boundedInteger(
      descriptors.maxOutputTokens.value,
      1,
      XVI_LOCAL_INFERENCE_GUARDRAILS
        .maximumOutputTokens,
    );

  const sourceCommit =
    commit(
      descriptors.sourceCommit.value,
    );

  const admitted = {
    tenantId,
    missionId,
    providerId,
    modelId,
    prompt,
    promptBytes,
    timeoutMs,
    maxOutputTokens,
    sourceCommit,
  };

  const requestDigest =
    digestEnvelope(admitted);

  return Object.freeze({
    version:
      'xvi-local-inference-v1' as const,

    ...admitted,

    requestDigest,

    executesProvider: false as const,
    networkAllowed: false as const,
    shellAllowed: false as const,
    productionAuthority: false as const,
    secretMaterialIncluded: false as const,
  });
}

export type FabricLocalInferenceVerification =
  | 'VERIFIED_FOR_PROVIDER_EVALUATION'
  | 'REFUSED';

export function verifyFabricLocalInferenceEnvelope(
  observed: unknown,
): FabricLocalInferenceVerification {
  try {
    if (
      observed === null ||
      typeof observed !== 'object' ||
      Array.isArray(observed) ||
      Object.getPrototypeOf(observed) !==
        Object.prototype
    ) {
      return 'REFUSED';
    }

    const expected = [
      'version',
      'tenantId',
      'missionId',
      'providerId',
      'modelId',
      'prompt',
      'promptBytes',
      'timeoutMs',
      'maxOutputTokens',
      'sourceCommit',
      'requestDigest',
      'executesProvider',
      'networkAllowed',
      'shellAllowed',
      'productionAuthority',
      'secretMaterialIncluded',
    ] as const;

    const descriptors =
      Object.getOwnPropertyDescriptors(
        observed,
      );

    const keys =
      Reflect.ownKeys(observed);

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
      return 'REFUSED';
    }

    for (const key of expected) {
      const descriptor =
        descriptors[key];

      if (
        !descriptor ||
        !('value' in descriptor) ||
        descriptor.enumerable !== true
      ) {
        return 'REFUSED';
      }
    }

    if (
      descriptors.version.value !==
        'xvi-local-inference-v1' ||
      descriptors.executesProvider.value !==
        false ||
      descriptors.networkAllowed.value !==
        false ||
      descriptors.shellAllowed.value !==
        false ||
      descriptors.productionAuthority.value !==
        false ||
      descriptors.secretMaterialIncluded.value !==
        false
    ) {
      return 'REFUSED';
    }

    const rebuilt =
      createFabricLocalInferenceEnvelope({
        tenantId:
          descriptors.tenantId.value,
        missionId:
          descriptors.missionId.value,
        providerId:
          descriptors.providerId.value,
        modelId:
          descriptors.modelId.value,
        prompt:
          descriptors.prompt.value,
        timeoutMs:
          descriptors.timeoutMs.value,
        maxOutputTokens:
          descriptors.maxOutputTokens.value,
        sourceCommit:
          descriptors.sourceCommit.value,
      });

    if (
      descriptors.promptBytes.value !==
        rebuilt.promptBytes ||
      descriptors.requestDigest.value !==
        rebuilt.requestDigest
    ) {
      return 'REFUSED';
    }

    return 'VERIFIED_FOR_PROVIDER_EVALUATION';
  } catch {
    return 'REFUSED';
  }
}
