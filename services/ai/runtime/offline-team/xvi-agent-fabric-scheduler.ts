export type FabricSchedulerState =
  | 'READY'
  | 'RUNNING'
  | 'CHECKPOINTING'
  | 'STOPPING'
  | 'STOPPED'
  | 'OWNERSHIP_LOST'
  | 'FAILED';

export interface FabricSchedulerConfig {
  missionId: string;
  tenantId: string;
  maxTicks: number;
  heartbeatEveryTicks: number;
  checkpointEveryTicks: number;
  maxRuntimeMs: number;
  maxConsecutiveFailures: number;
}

export interface FabricScheduler {
  missionId: string;
  tenantId: string;

  state: FabricSchedulerState;

  tick: number;
  startedAtMs: number | null;
  lastTickAtMs: number | null;

  consecutiveFailures: number;

  config: Readonly<FabricSchedulerConfig>;

  productionAuthority: false;
  providerCalls: 0;
  processSpawns: 0;
}

export interface FabricSchedulerDecision {
  version: 'xvi-scheduler-v1';

  missionId: string;
  tenantId: string;

  tick: number;

  runWork: boolean;
  heartbeatDue: boolean;
  checkpointDue: boolean;
  stopAfterTick: boolean;

  state: FabricSchedulerState;

  productionAuthority: false;
  providerCalls: 0;
  processSpawns: 0;
  secretMaterialIncluded: false;
}

export const XVI_SCHEDULER_GUARDRAILS =
  Object.freeze({
    automaticTimers: false,
    productionAuthority: false,
    providerCalls: 0,
    processSpawns: 0,
    maximumTicks: 1_000_000,
    maximumRuntimeMs: 86_400_000,
    maximumConsecutiveFailures: 16,
    continuesAfterOwnershipLoss: false,
  });

interface FabricSchedulerCanonicalState {
  missionId: string;
  tenantId: string;
  state: FabricSchedulerState;
  tick: number;
  startedAtMs: number | null;
  lastTickAtMs: number | null;
  consecutiveFailures: number;
  productionAuthority: false;
  providerCalls: 0;
  processSpawns: 0;
}

const schedulerState =
  new WeakMap<
    FabricScheduler,
    FabricSchedulerCanonicalState
  >();

const refuse = (): never => {
  throw new Error('XVI_SCHEDULER_REFUSED');
};

function rememberScheduler(
  scheduler: FabricScheduler,
): void {
  schedulerState.set(
    scheduler,
    {
      missionId: scheduler.missionId,
      tenantId: scheduler.tenantId,
      state: scheduler.state,
      tick: scheduler.tick,
      startedAtMs: scheduler.startedAtMs,
      lastTickAtMs: scheduler.lastTickAtMs,
      consecutiveFailures:
        scheduler.consecutiveFailures,
      productionAuthority: false,
      providerCalls: 0,
      processSpawns: 0,
    },
  );
}

function assertSchedulerIntegrity(
  scheduler: FabricScheduler,
): FabricSchedulerCanonicalState {
  const expected =
    schedulerState.get(scheduler);

  if (
    !expected ||
    scheduler.missionId !== expected.missionId ||
    scheduler.tenantId !== expected.tenantId ||
    scheduler.state !== expected.state ||
    scheduler.tick !== expected.tick ||
    scheduler.startedAtMs !==
      expected.startedAtMs ||
    scheduler.lastTickAtMs !==
      expected.lastTickAtMs ||
    scheduler.consecutiveFailures !==
      expected.consecutiveFailures ||
    scheduler.productionAuthority !== false ||
    scheduler.providerCalls !== 0 ||
    scheduler.processSpawns !== 0
  ) {
    /*
     * Once integrity is lost, this public controller
     * must never be trusted for further scheduling.
     */
    scheduler.state = 'FAILED';

    schedulerState.set(
      scheduler,
      {
        ...(expected ?? {
          missionId: '',
          tenantId: '',
          tick: 0,
          startedAtMs: null,
          lastTickAtMs: null,
          consecutiveFailures: 0,
          productionAuthority: false,
          providerCalls: 0,
          processSpawns: 0,
        }),
        state: 'FAILED',
      },
    );

    refuse();
  }

  return expected;
}

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

function exactConfig(
  input: unknown,
): FabricSchedulerConfig {
  if (
    input === null ||
    typeof input !== 'object' ||
    Array.isArray(input) ||
    Object.getPrototypeOf(input) !== Object.prototype
  ) {
    refuse();
  }

  const expected = [
    'missionId',
    'tenantId',
    'maxTicks',
    'heartbeatEveryTicks',
    'checkpointEveryTicks',
    'maxRuntimeMs',
    'maxConsecutiveFailures',
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

  const missionId =
    identifier(descriptors.missionId.value);

  const tenantId =
    identifier(descriptors.tenantId.value);

  const maxTicks =
    boundedInteger(
      descriptors.maxTicks.value,
      1,
      XVI_SCHEDULER_GUARDRAILS.maximumTicks,
    );

  const heartbeatEveryTicks =
    boundedInteger(
      descriptors.heartbeatEveryTicks.value,
      1,
      maxTicks,
    );

  const checkpointEveryTicks =
    boundedInteger(
      descriptors.checkpointEveryTicks.value,
      1,
      maxTicks,
    );

  const maxRuntimeMs =
    boundedInteger(
      descriptors.maxRuntimeMs.value,
      1,
      XVI_SCHEDULER_GUARDRAILS.maximumRuntimeMs,
    );

  const maxConsecutiveFailures =
    boundedInteger(
      descriptors.maxConsecutiveFailures.value,
      1,
      XVI_SCHEDULER_GUARDRAILS
        .maximumConsecutiveFailures,
    );

  return Object.freeze({
    missionId,
    tenantId,
    maxTicks,
    heartbeatEveryTicks,
    checkpointEveryTicks,
    maxRuntimeMs,
    maxConsecutiveFailures,
  });
}

export function createFabricScheduler(
  config: FabricSchedulerConfig,
): FabricScheduler {
  const admitted = exactConfig(config);

  const scheduler: FabricScheduler = {
    missionId: admitted.missionId,
    tenantId: admitted.tenantId,

    state: 'READY',

    tick: 0,
    startedAtMs: null,
    lastTickAtMs: null,

    consecutiveFailures: 0,

    config: admitted,

    productionAuthority: false,
    providerCalls: 0,
    processSpawns: 0,
  };

  rememberScheduler(scheduler);

  return scheduler;
}

export function startFabricScheduler(
  scheduler: FabricScheduler,
  nowMs: number,
): void {
  assertSchedulerIntegrity(scheduler);

  if (
    scheduler.state !== 'READY' ||
    !Number.isSafeInteger(nowMs) ||
    nowMs < 0
  ) {
    refuse();
  }

  scheduler.startedAtMs = nowMs;
  scheduler.lastTickAtMs = null;
  scheduler.state = 'RUNNING';

  rememberScheduler(scheduler);
}

export function planFabricSchedulerTick(
  scheduler: FabricScheduler,
  nowMs: number,
): Readonly<FabricSchedulerDecision> {
  assertSchedulerIntegrity(scheduler);

  if (scheduler.state !== 'RUNNING') {
    refuse();
  }

  if (
    !Number.isSafeInteger(nowMs) ||
    nowMs < 0 ||
    scheduler.startedAtMs === null ||
    nowMs < scheduler.startedAtMs ||
    (
      scheduler.lastTickAtMs !== null &&
      nowMs <= scheduler.lastTickAtMs
    )
  ) {
    refuse();
  }

  const elapsed =
    nowMs - scheduler.startedAtMs;

  if (
    elapsed > scheduler.config.maxRuntimeMs
  ) {
    scheduler.state = 'STOPPING';
    rememberScheduler(scheduler);
    refuse();
  }

  const nextTick = scheduler.tick + 1;

  if (
    nextTick > scheduler.config.maxTicks
  ) {
    scheduler.state = 'STOPPING';
    rememberScheduler(scheduler);
    refuse();
  }

  scheduler.tick = nextTick;
  scheduler.lastTickAtMs = nowMs;

  const heartbeatDue =
    nextTick %
      scheduler.config.heartbeatEveryTicks ===
    0;

  const checkpointDue =
    nextTick %
      scheduler.config.checkpointEveryTicks ===
    0;

  const stopAfterTick =
    nextTick === scheduler.config.maxTicks;

  if (stopAfterTick) {
    scheduler.state = 'STOPPING';
  }

  rememberScheduler(scheduler);

  return Object.freeze({
    version: 'xvi-scheduler-v1' as const,

    missionId: scheduler.missionId,
    tenantId: scheduler.tenantId,

    tick: nextTick,

    runWork: true,
    heartbeatDue,
    checkpointDue,
    stopAfterTick,

    state: scheduler.state,

    productionAuthority: false as const,
    providerCalls: 0 as const,
    processSpawns: 0 as const,
    secretMaterialIncluded: false as const,
  });
}

export function recordFabricSchedulerSuccess(
  scheduler: FabricScheduler,
): void {
  assertSchedulerIntegrity(scheduler);

  if (
    scheduler.state !== 'RUNNING' &&
    scheduler.state !== 'STOPPING'
  ) {
    refuse();
  }

  scheduler.consecutiveFailures = 0;

  rememberScheduler(scheduler);
}

export function recordFabricSchedulerFailure(
  scheduler: FabricScheduler,
): void {
  assertSchedulerIntegrity(scheduler);

  if (scheduler.state !== 'RUNNING') {
    refuse();
  }

  scheduler.consecutiveFailures += 1;

  if (
    scheduler.consecutiveFailures >=
    scheduler.config.maxConsecutiveFailures
  ) {
    scheduler.state = 'FAILED';
  }

  rememberScheduler(scheduler);
}

export function markFabricSchedulerOwnershipLost(
  scheduler: FabricScheduler,
): void {
  assertSchedulerIntegrity(scheduler);

  if (
    scheduler.state !== 'RUNNING' &&
    scheduler.state !== 'CHECKPOINTING'
  ) {
    refuse();
  }

  scheduler.state = 'OWNERSHIP_LOST';

  rememberScheduler(scheduler);
}

export function stopFabricScheduler(
  scheduler: FabricScheduler,
): void {
  assertSchedulerIntegrity(scheduler);

  if (
    scheduler.state !== 'RUNNING' &&
    scheduler.state !== 'STOPPING'
  ) {
    refuse();
  }

  scheduler.state = 'STOPPED';

  rememberScheduler(scheduler);
}
