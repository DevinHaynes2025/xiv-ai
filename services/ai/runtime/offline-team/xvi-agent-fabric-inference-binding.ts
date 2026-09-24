import type {
  HostLeaseBinding,
} from './shared-host-lease-store';

import {
  verifyFabricLocalInferenceEnvelope,
  type FabricLocalInferenceEnvelope,
} from './xvi-agent-fabric-local-inference';

export interface FabricInferenceBindingInput {
  inference: Readonly<FabricLocalInferenceEnvelope>;

  lease: Omit<
    HostLeaseBinding,
    'ttlMs'
  >;
}

export interface FabricInferenceBindingReceipt {
  version: 'xvi-inference-binding-v1';

  tenantId: string;
  missionId: string;

  providerId: string;
  modelId: string;

  holderInstanceId: string;
  workId: string;

  sourceCommit: string;
  requestDigest: string;

  requestVerified: true;
  identityBound: true;

  executesProvider: false;
  networkAllowed: false;
  shellAllowed: false;
  productionAuthority: false;
  secretMaterialIncluded: false;

  decision:
    'BOUND_FOR_PROVIDER_EVALUATION';
}

export const XVI_INFERENCE_BINDING_GUARDRAILS =
  Object.freeze({
    executesProvider: false,
    networkAllowed: false,
    shellAllowed: false,
    productionAuthority: false,
    secretMaterialIncluded: false,
    leaseHandleIncluded: false,
    ownerSecretIncluded: false,
  });

const refuse = (): never => {
  throw new Error(
    'XVI_INFERENCE_BINDING_REFUSED',
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

function exactInput(
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

export function bindFabricInferenceToLease(
  input: FabricInferenceBindingInput,
): Readonly<FabricInferenceBindingReceipt> {
  const root =
    exactInput(
      input,
      ['inference', 'lease'],
    );

  const inference =
    root.inference.value;

  const lease =
    root.lease.value;

  if (
    verifyFabricLocalInferenceEnvelope(
      inference,
    ) !==
      'VERIFIED_FOR_PROVIDER_EVALUATION'
  ) {
    refuse();
  }

  const leaseDescriptors =
    exactInput(
      lease,
      [
        'tenantId',
        'holderInstanceId',
        'lane',
        'workId',
        'providerId',
        'modelId',
        'presenceEvidenceRef',
        'sourceCommit',
      ],
    );

  const tenantId =
    identifier(
      leaseDescriptors.tenantId.value,
    );

  const holderInstanceId =
    identifier(
      leaseDescriptors
        .holderInstanceId.value,
    );

  const workId =
    identifier(
      leaseDescriptors.workId.value,
    );

  const providerId =
    identifier(
      leaseDescriptors.providerId.value,
    );

  const modelId =
    identifier(
      leaseDescriptors.modelId.value,
    );

  /*
   * Validate but deliberately do not copy these
   * into the public receipt.
   */
  identifier(
    leaseDescriptors.lane.value,
  );

  identifier(
    leaseDescriptors
      .presenceEvidenceRef.value,
  );

  const sourceCommit =
    commit(
      leaseDescriptors
        .sourceCommit.value,
    );

  if (
    inference.tenantId !== tenantId ||
    inference.missionId !== workId ||
    inference.providerId !== providerId ||
    inference.modelId !== modelId ||
    inference.sourceCommit !==
      sourceCommit
  ) {
    refuse();
  }

  return Object.freeze({
    version:
      'xvi-inference-binding-v1' as const,

    tenantId,
    missionId: inference.missionId,

    providerId,
    modelId,

    holderInstanceId,
    workId,

    sourceCommit,
    requestDigest:
      inference.requestDigest,

    requestVerified: true as const,
    identityBound: true as const,

    executesProvider: false as const,
    networkAllowed: false as const,
    shellAllowed: false as const,
    productionAuthority: false as const,
    secretMaterialIncluded: false as const,

    decision:
      'BOUND_FOR_PROVIDER_EVALUATION' as const,
  });
}
