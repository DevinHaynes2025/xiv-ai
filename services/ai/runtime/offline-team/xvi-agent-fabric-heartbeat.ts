import type {
  HostLeaseHandle,
} from './shared-host-lease-store';

import type {
  FabricLeaseStore,
} from './xvi-agent-fabric-worker-lease';

import {
  renewFabricWorkerLease,
} from './xvi-agent-fabric-worker-lease';

export type FabricWorkerState =
  | 'RESERVED'
  | 'RUNNING'
  | 'CHECKPOINTING'
  | 'OWNERSHIP_LOST'
  | 'STOPPED';

export interface FabricHeartbeatController {
  tenantId: string;
  missionId: string;
  holderInstanceId: string;

  state: FabricWorkerState;

  sequence: number;
  lastHeartbeatMs: number | null;

  handle: HostLeaseHandle;

  productionAuthority: false;
}

export interface FabricHeartbeatReceipt {
  version: 'xvi-heartbeat-v1';

  tenantId: string;
  missionId: string;
  holderInstanceId: string;

  state: FabricWorkerState;

  sequence: number;
  heartbeatAtMs: number;

  ownershipVerified: boolean;

  providerCalls: 0;
  productionAuthority: false;

  /*
   * Frontend-safe by construction:
   * no lease secret or controller handle.
   */
  secretMaterialIncluded: false;
}

export const XVI_HEARTBEAT_GUARDRAILS =
  Object.freeze({
    productionAuthority: false,
    providerCalls: 0,
    optimisticExecutionAfterLeaseFailure: false,
    ownerSecretMayAppearInReceipt: false,
    ownerSecretMayAppearInUi: false,
    ownerSecretMayAppearInTelemetry: false,
  });

const refuse = (): never => {
  throw new Error('XVI_HEARTBEAT_REFUSED');
};

function identifier(value: unknown): string {
  if (
    typeof value !== 'string' ||
    value.length < 1 ||
    value.length > 128 ||
    value !== value.trim() ||
    !/^[A-Za-z0-9][A-Za-z0-9_.:@/-]*$/.test(value)
  ) {
    refuse();
  }

  return value;
}

function validClock(value: unknown): value is number {
  return (
    typeof value === 'number' &&
    Number.isSafeInteger(value) &&
    value >= 0
  );
}

function exactLeaseHandle(
  value: unknown,
): HostLeaseHandle {
  if (
    value === null ||
    typeof value !== 'object' ||
    Array.isArray(value) ||
    Object.getPrototypeOf(value) !== Object.prototype
  ) {
    refuse();
  }

  const expected = [
    'leaseId',
    'tenantId',
    'holderInstanceId',
    'revision',
    'ownerSecret',
  ] as const;

  const descriptors =
    Object.getOwnPropertyDescriptors(value);

  const keys = Reflect.ownKeys(value);

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
    const descriptor = descriptors[key];

    if (
      !descriptor ||
      !('value' in descriptor) ||
      descriptor.enumerable !== true
    ) {
      refuse();
    }
  }

  const leaseId =
    identifier(descriptors.leaseId.value);

  const tenantId =
    identifier(descriptors.tenantId.value);

  const holderInstanceId =
    identifier(
      descriptors.holderInstanceId.value,
    );

  const revision =
    descriptors.revision.value;

  if (
    typeof revision !== 'number' ||
    !Number.isSafeInteger(revision) ||
    revision < 1
  ) {
    refuse();
  }

  const ownerSecret =
    descriptors.ownerSecret.value;

  if (
    typeof ownerSecret !== 'string' ||
    !/^[a-f0-9]{64}$/.test(ownerSecret)
  ) {
    refuse();
  }

  return Object.freeze({
    leaseId,
    tenantId,
    holderInstanceId,
    revision,
    ownerSecret,
  });
}

export function createFabricHeartbeatController(
  tenantId: string,
  missionId: string,
  holderInstanceId: string,
  handle: HostLeaseHandle,
): FabricHeartbeatController {
  const validatedTenantId =
    identifier(tenantId);

  const validatedMissionId =
    identifier(missionId);

  const validatedHolderInstanceId =
    identifier(holderInstanceId);

  const privateHandle =
    exactLeaseHandle(handle);

  if (
    privateHandle.tenantId !==
      validatedTenantId ||
    privateHandle.holderInstanceId !==
      validatedHolderInstanceId
  ) {
    refuse();
  }

  return {
    tenantId: validatedTenantId,
    missionId: validatedMissionId,
    holderInstanceId:
      validatedHolderInstanceId,

    state: 'RESERVED',
    sequence: 0,
    lastHeartbeatMs: null,

    handle: privateHandle,

    productionAuthority: false,
  };
}

export function markFabricWorkerRunning(
  controller: FabricHeartbeatController,
): void {
  if (controller.state !== 'RESERVED') {
    refuse();
  }

  controller.state = 'RUNNING';
}

export function heartbeatFabricWorker(
  store: FabricLeaseStore,
  controller: FabricHeartbeatController,
  heartbeatAtMs: number,
  ttlMs = 10_000,
): Readonly<FabricHeartbeatReceipt> {
  if (
    controller.state !== 'RUNNING' &&
    controller.state !== 'CHECKPOINTING'
  ) {
    refuse();
  }

  if (!validClock(heartbeatAtMs)) {
    refuse();
  }

  if (
    controller.lastHeartbeatMs !== null &&
    heartbeatAtMs <= controller.lastHeartbeatMs
  ) {
    refuse();
  }

  let nextHandle: HostLeaseHandle;

  try {
    nextHandle =
      renewFabricWorkerLease(
        store,
        controller.handle,
        ttlMs,
      ) as HostLeaseHandle;
  } catch {
    /*
     * Losing proof of ownership is terminal for
     * this controller's execution claim.
     */
    controller.state = 'OWNERSHIP_LOST';
    refuse();
  }

  if (
    !nextHandle ||
    nextHandle.tenantId !== controller.tenantId ||
    nextHandle.holderInstanceId !==
      controller.holderInstanceId ||
    nextHandle.leaseId !== controller.handle.leaseId ||
    nextHandle.revision !==
      controller.handle.revision + 1
  ) {
    controller.state = 'OWNERSHIP_LOST';
    refuse();
  }

  controller.handle = nextHandle;
  controller.sequence += 1;
  controller.lastHeartbeatMs = heartbeatAtMs;

  return Object.freeze({
    version: 'xvi-heartbeat-v1' as const,

    tenantId: controller.tenantId,
    missionId: controller.missionId,
    holderInstanceId:
      controller.holderInstanceId,

    state: controller.state,

    sequence: controller.sequence,
    heartbeatAtMs,

    ownershipVerified: true,

    providerCalls: 0 as const,
    productionAuthority: false as const,
    secretMaterialIncluded: false as const,
  });
}

export function beginFabricCheckpoint(
  controller: FabricHeartbeatController,
): void {
  if (controller.state !== 'RUNNING') {
    refuse();
  }

  controller.state = 'CHECKPOINTING';
}

export function finishFabricCheckpoint(
  controller: FabricHeartbeatController,
): void {
  if (controller.state !== 'CHECKPOINTING') {
    refuse();
  }

  controller.state = 'RUNNING';
}
