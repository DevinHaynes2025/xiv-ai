import type {
  HostLeaseBinding,
  HostLeaseHandle,
} from './shared-host-lease-store';

import type {
  FabricInferenceBindingReceipt,
} from './xvi-agent-fabric-inference-binding';

export interface FabricInferenceOwnershipStore {
  assertActiveBinding(
    handle: HostLeaseHandle,
    expected: Omit<HostLeaseBinding, 'ttlMs'>,
  ): void;
}

export interface FabricInferenceOwnershipInput {
  receipt: Readonly<FabricInferenceBindingReceipt>;
  handle: HostLeaseHandle;

  lane: HostLeaseBinding['lane'];
  presenceEvidenceRef: string;
}

export interface FabricInferenceOwnershipReceipt {
  version: 'xvi-inference-ownership-v1';

  tenantId: string;
  missionId: string;
  providerId: string;
  modelId: string;
  holderInstanceId: string;
  sourceCommit: string;
  requestDigest: string;

  activeOwnershipVerified: true;

  executesProvider: false;
  networkAllowed: false;
  shellAllowed: false;
  productionAuthority: false;
  secretMaterialIncluded: false;

  decision:
    'ACTIVE_OWNERSHIP_VERIFIED_FOR_PROVIDER_EVALUATION';
}

export const XVI_INFERENCE_OWNERSHIP_GUARDRAILS =
  Object.freeze({
    executesProvider: false,
    networkAllowed: false,
    shellAllowed: false,
    productionAuthority: false,
    secretMaterialIncluded: false,
    exposesOwnerSecret: false,
    exposesLeaseHandle: false,
  });

const refuse = (): never => {
  throw new Error(
    'XVI_INFERENCE_OWNERSHIP_REFUSED',
  );
};

function exactOwnershipInput(
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
    'receipt',
    'handle',
    'lane',
    'presenceEvidenceRef',
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

  return descriptors;
}

export function verifyFabricInferenceOwnership(
  store: FabricInferenceOwnershipStore,
  input: FabricInferenceOwnershipInput,
): Readonly<FabricInferenceOwnershipReceipt> {
  const descriptors =
    exactOwnershipInput(input);

  const receipt =
    descriptors.receipt.value as
      Readonly<FabricInferenceBindingReceipt>;

  const handle =
    descriptors.handle.value as
      HostLeaseHandle;

  const lane =
    descriptors.lane.value as
      HostLeaseBinding['lane'];

  const presenceEvidenceRef =
    descriptors.presenceEvidenceRef.value as
      string;

  if (
    receipt.decision !==
      'BOUND_FOR_PROVIDER_EVALUATION' ||
    receipt.requestVerified !== true ||
    receipt.identityBound !== true ||
    receipt.executesProvider !== false ||
    receipt.networkAllowed !== false ||
    receipt.shellAllowed !== false ||
    receipt.productionAuthority !== false ||
    receipt.secretMaterialIncluded !== false
  ) {
    refuse();
  }

  /*
   * Controller-only operation.
   * The private handle is used for authentication,
   * but never copied into the resulting receipt.
   */
  try {
    store.assertActiveBinding(
      handle,
      {
        tenantId: receipt.tenantId,
        holderInstanceId:
          receipt.holderInstanceId,
        lane,
        workId: receipt.missionId,
        providerId: receipt.providerId,
        modelId: receipt.modelId,
        presenceEvidenceRef,
        sourceCommit:
          receipt.sourceCommit,
      },
    );
  } catch {
    refuse();
  }

  return Object.freeze({
    version:
      'xvi-inference-ownership-v1' as const,

    tenantId: receipt.tenantId,
    missionId: receipt.missionId,
    providerId: receipt.providerId,
    modelId: receipt.modelId,
    holderInstanceId:
      receipt.holderInstanceId,
    sourceCommit:
      receipt.sourceCommit,
    requestDigest:
      receipt.requestDigest,

    activeOwnershipVerified:
      true as const,

    executesProvider: false as const,
    networkAllowed: false as const,
    shellAllowed: false as const,
    productionAuthority: false as const,
    secretMaterialIncluded: false as const,

    decision:
      'ACTIVE_OWNERSHIP_VERIFIED_FOR_PROVIDER_EVALUATION' as const,
  });
}
