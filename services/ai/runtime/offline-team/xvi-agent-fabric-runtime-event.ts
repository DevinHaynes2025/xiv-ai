export type FabricRuntimeEventKind =
  | 'MISSION_STARTED'
  | 'TICK_STARTED'
  | 'WORK_STARTED'
  | 'WORK_COMPLETED'
  | 'CHECKPOINT_STARTED'
  | 'CHECKPOINT_COMPLETED'
  | 'HEARTBEAT_RENEWED'
  | 'FAILURE_RECORDED'
  | 'OWNERSHIP_LOST'
  | 'REVIEW_REQUIRED'
  | 'MISSION_STOPPED';

export type FabricRuntimeStatus =
  | 'PREPARING'
  | 'WORKING'
  | 'SAVING'
  | 'HEALTHY'
  | 'DEGRADED'
  | 'RECOVERING'
  | 'NEEDS_REVIEW'
  | 'STOPPED';

export interface FabricRuntimeEventInput {
  tenantId: string;
  missionId: string;
  sequence: number;
  occurredAtMs: number;
  kind: FabricRuntimeEventKind;
}

export interface FabricRuntimeEvent {
  version: 'xvi-runtime-event-v1';

  tenantId: string;
  missionId: string;

  sequence: number;
  occurredAtMs: number;

  kind: FabricRuntimeEventKind;
  status: FabricRuntimeStatus;

  providerCalls: 0;
  processSpawns: 0;
  productionAuthority: false;
  secretMaterialIncluded: false;
}

export const XVI_RUNTIME_EVENT_GUARDRAILS =
  Object.freeze({
    providerCalls: 0,
    processSpawns: 0,
    productionAuthority: false,
    secretMaterialIncluded: false,
    networkWrites: 0,
    persistentWrites: 0,
  });

const refuse = (): never => {
  throw new Error('XVI_RUNTIME_EVENT_REFUSED');
};

const STATUS: Readonly<
  Record<FabricRuntimeEventKind, FabricRuntimeStatus>
> = Object.freeze({
  MISSION_STARTED: 'PREPARING',
  TICK_STARTED: 'WORKING',
  WORK_STARTED: 'WORKING',
  WORK_COMPLETED: 'HEALTHY',
  CHECKPOINT_STARTED: 'SAVING',
  CHECKPOINT_COMPLETED: 'HEALTHY',
  HEARTBEAT_RENEWED: 'HEALTHY',
  FAILURE_RECORDED: 'DEGRADED',
  OWNERSHIP_LOST: 'RECOVERING',
  REVIEW_REQUIRED: 'NEEDS_REVIEW',
  MISSION_STOPPED: 'STOPPED',
});

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

function exactInput(
  input: unknown,
): asserts input is FabricRuntimeEventInput {
  if (
    input === null ||
    typeof input !== 'object' ||
    Array.isArray(input) ||
    Object.getPrototypeOf(input) !== Object.prototype
  ) {
    refuse();
  }

  const expected = [
    'tenantId',
    'missionId',
    'sequence',
    'occurredAtMs',
    'kind',
  ] as const;

  const descriptors =
    Object.getOwnPropertyDescriptors(input);

  const keys = Reflect.ownKeys(input);

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
}

export function createFabricRuntimeEvent(
  input: FabricRuntimeEventInput,
): Readonly<FabricRuntimeEvent> {
  exactInput(input);

  const descriptors =
    Object.getOwnPropertyDescriptors(input);

  const tenantId =
    identifier(descriptors.tenantId.value);

  const missionId =
    identifier(descriptors.missionId.value);

  const sequence =
    descriptors.sequence.value;

  const occurredAtMs =
    descriptors.occurredAtMs.value;

  const kind =
    descriptors.kind.value as FabricRuntimeEventKind;

  if (
    !Number.isSafeInteger(sequence) ||
    sequence < 1 ||
    !Number.isSafeInteger(occurredAtMs) ||
    occurredAtMs < 0 ||
    !Object.prototype.hasOwnProperty.call(
      STATUS,
      kind,
    )
  ) {
    refuse();
  }

  return Object.freeze({
    version: 'xvi-runtime-event-v1' as const,

    tenantId,
    missionId,

    sequence,
    occurredAtMs,

    kind,
    status: STATUS[kind],

    providerCalls: 0 as const,
    processSpawns: 0 as const,
    productionAuthority: false as const,
    secretMaterialIncluded: false as const,
  });
}
