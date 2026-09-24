import type {
  HostLeaseBinding,
  HostLeaseHandle,
} from './shared-host-lease-store';

import type {
  SharedHostLane,
} from './shared-host-job-lease';

import type {
  FabricReplayResult,
} from './xvi-agent-fabric-restart-replay';

export interface FabricLeaseStore {
  acquire(binding: HostLeaseBinding):
    | Readonly<{
        status: 'BLOCKED';
        decision: string;
        operatorReviewRequired: boolean;
        handle: null;
      }>
    | Readonly<{
        status: 'RESERVED_NOT_STARTED';
        decision: string;
        operatorReviewRequired: false;
        handle: HostLeaseHandle;
      }>;

  renew(
    handle: HostLeaseHandle,
    ttlMs?: number,
  ): unknown;

  markStopped(
    handle: HostLeaseHandle,
    providerAcknowledged: boolean,
    stopEvidenceRef?: string,
  ): unknown;

  release(
    handle: HostLeaseHandle,
    releaseEvidenceRef: string,
  ): unknown;
}

export interface FabricWorkerLeaseRequest {
  replay: Readonly<FabricReplayResult>;
  holderInstanceId: string;
  lane: SharedHostLane;
  providerId: string;
  modelId: string;
  presenceEvidenceRef: string;
  sourceCommit: string;
  ttlMs?: number;
}

export interface FabricWorkerLeaseReservation {
  status: 'BLOCKED' | 'RESERVED_NOT_STARTED';
  tenantId: string;
  missionId: string;
  holderInstanceId: string;
  decision: string;
  operatorReviewRequired: boolean;
  ownershipReserved: boolean;
  providerStarted: false;
  productionAuthority: false;
  executesNothing: true;
  handle: HostLeaseHandle | null;
}

export const XVI_WORKER_LEASE_GUARDRAILS = Object.freeze({
  humanDecision: 'REQUIRED' as const,
  providerStartedByAcquire: false,
  productionAuthority: false,
  operatorRecoveryExposedToWorker: false,
  ownerSecretMayAppearInUi: false,
  ownerSecretMayAppearInPrompt: false,
  ownerSecretMayAppearInTelemetry: false,
});

const refuse = (): never => {
  throw new Error('XVI_WORKER_LEASE_REFUSED');
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

function commit(value: unknown): string {
  if (
    typeof value !== 'string' ||
    !/^[a-f0-9]{40}$/.test(value)
  ) {
    refuse();
  }

  return value;
}

function exactRequest(
  input: unknown,
): asserts input is FabricWorkerLeaseRequest {
  if (
    input === null ||
    typeof input !== 'object' ||
    Array.isArray(input) ||
    Object.getPrototypeOf(input) !== Object.prototype
  ) {
    refuse();
  }

  const required = [
    'replay',
    'holderInstanceId',
    'lane',
    'providerId',
    'modelId',
    'presenceEvidenceRef',
    'sourceCommit',
  ];

  const optional = ['ttlMs'];
  const allowed = new Set([...required, ...optional]);

  const descriptors = Object.getOwnPropertyDescriptors(input);

  for (const key of Reflect.ownKeys(input)) {
    if (
      typeof key !== 'string' ||
      !allowed.has(key)
    ) {
      refuse();
    }
  }

  for (const key of required) {
    const d = descriptors[key];

    if (
      !d ||
      !('value' in d) ||
      d.enumerable !== true
    ) {
      refuse();
    }
  }

  for (const key of optional) {
    const d = descriptors[key];

    if (
      d &&
      (!('value' in d) || d.enumerable !== true)
    ) {
      refuse();
    }
  }
}

function eligibleReplay(
  replay: Readonly<FabricReplayResult>,
): void {
  if (
    replay.verification !==
      'RESTORED_FOR_RECOVERY_EVALUATION' ||
    replay.executesNothing !== true ||
    replay.productionAuthority !== false
  ) {
    refuse();
  }

  if (
    replay.state === 'COMPLETED' ||
    replay.state === 'FAILED'
  ) {
    refuse();
  }
}

export function reserveFabricWorkerLease(
  store: FabricLeaseStore,
  request: FabricWorkerLeaseRequest,
): Readonly<FabricWorkerLeaseReservation> {
  exactRequest(request);

  const descriptors =
    Object.getOwnPropertyDescriptors(request);

  const read = (key: string): unknown => {
    const d = descriptors[key];

    if (!d || !('value' in d)) {
      refuse();
    }

    return d.value;
  };

  const replay =
    read('replay') as Readonly<FabricReplayResult>;

  eligibleReplay(replay);

  const holderInstanceId =
    identifier(read('holderInstanceId'));

  const lane = read('lane');

  if (
    lane !== 'HOMEBASE' &&
    lane !== 'OFFLINE_SHIFT'
  ) {
    refuse();
  }

  const ttlValue = read('ttlMs');

  if (
    ttlValue !== undefined &&
    (
      typeof ttlValue !== 'number' ||
      !Number.isSafeInteger(ttlValue) ||
      ttlValue < 1 ||
      ttlValue > 30_000
    )
  ) {
    refuse();
  }

  const binding: HostLeaseBinding = {
    tenantId: identifier(replay.tenantId),
    holderInstanceId,
    lane,
    workId: identifier(replay.missionId),
    providerId: identifier(read('providerId')),
    modelId: identifier(read('modelId')),
    presenceEvidenceRef:
      identifier(read('presenceEvidenceRef')),
    sourceCommit: commit(read('sourceCommit')),
    ...(ttlValue === undefined
      ? {}
      : { ttlMs: ttlValue }),
  };

  const result = store.acquire(binding);

  if (result.status === 'BLOCKED') {
    return Object.freeze({
      status: 'BLOCKED' as const,
      tenantId: replay.tenantId,
      missionId: replay.missionId,
      holderInstanceId,
      decision: result.decision,
      operatorReviewRequired:
        result.operatorReviewRequired,
      ownershipReserved: false,
      providerStarted: false as const,
      productionAuthority: false as const,
      executesNothing: true as const,
      handle: null,
    });
  }

  if (
    result.status !== 'RESERVED_NOT_STARTED' ||
    result.handle === null
  ) {
    refuse();
  }

  if (
    result.handle.tenantId !== replay.tenantId ||
    result.handle.holderInstanceId !==
      holderInstanceId
  ) {
    refuse();
  }

  return Object.freeze({
    status: 'RESERVED_NOT_STARTED' as const,
    tenantId: replay.tenantId,
    missionId: replay.missionId,
    holderInstanceId,
    decision: result.decision,
    operatorReviewRequired: false,
    ownershipReserved: true,
    providerStarted: false as const,
    productionAuthority: false as const,
    executesNothing: true as const,

    /*
     * Controller-only value.
     * Never serialize this reservation for UI/telemetry because
     * handle contains ownerSecret.
     */
    handle: result.handle,
  });
}

export function renewFabricWorkerLease(
  store: FabricLeaseStore,
  handle: HostLeaseHandle,
  ttlMs = 10_000,
): unknown {
  if (
    !Number.isSafeInteger(ttlMs) ||
    ttlMs < 1 ||
    ttlMs > 30_000
  ) {
    refuse();
  }

  try {
    return store.renew(handle, ttlMs);
  } catch {
    refuse();
  }
}

export function markFabricWorkerStopped(
  store: FabricLeaseStore,
  handle: HostLeaseHandle,
  providerAcknowledged: boolean,
  stopEvidenceRef?: string,
): unknown {
  if (typeof providerAcknowledged !== 'boolean') {
    refuse();
  }

  if (
    !providerAcknowledged &&
    stopEvidenceRef !== undefined
  ) {
    refuse();
  }

  if (
    stopEvidenceRef !== undefined
  ) {
    identifier(stopEvidenceRef);
  }

  try {
    return store.markStopped(
      handle,
      providerAcknowledged,
      stopEvidenceRef,
    );
  } catch {
    refuse();
  }
}

export function releaseFabricWorkerLease(
  store: FabricLeaseStore,
  handle: HostLeaseHandle,
  releaseEvidenceRef: string,
): unknown {
  identifier(releaseEvidenceRef);

  try {
    return store.release(
      handle,
      releaseEvidenceRef,
    );
  } catch {
    refuse();
  }
}
