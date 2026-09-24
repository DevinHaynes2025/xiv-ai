import {
  planFabricSchedulerTick,
  recordFabricSchedulerSuccess,
  recordFabricSchedulerFailure,
  stopFabricScheduler,
  markFabricSchedulerOwnershipLost,
  type FabricScheduler,
  type FabricSchedulerDecision,
} from './xvi-agent-fabric-scheduler';

export interface FabricTimerDriverDeps {
  now: () => number;
  sleep: (delayMs: number) => Promise<void>;
  runWork: (
    decision: Readonly<FabricSchedulerDecision>,
  ) => Promise<void>;
  runCheckpoint: (
    decision: Readonly<FabricSchedulerDecision>,
  ) => Promise<void>;
  runHeartbeat: (
    decision: Readonly<FabricSchedulerDecision>,
  ) => Promise<void>;
  signal?: AbortSignal;
}

export interface FabricTimerDriverConfig {
  intervalMs: number;
  jitterMs: number;
}

export const XVI_TIMER_DRIVER_GUARDRAILS =
  Object.freeze({
    providerCalls: 0,
    processSpawns: 0,
    productionAuthority: false,
    overlappingTicksAllowed: false,
    maximumIntervalMs: 60_000,
    maximumJitterMs: 5_000,
  });

const refuse = (): never => {
  throw new Error('XVI_TIMER_DRIVER_REFUSED');
};

function boundedInteger(
  value: unknown,
  min: number,
  max: number,
): number {
  if (
    typeof value !== 'number' ||
    !Number.isSafeInteger(value) ||
    value < min ||
    value > max
  ) {
    refuse();
  }

  return value;
}

function exactDataObject(
  value: unknown,
  required: readonly string[],
  optional: readonly string[] = [],
): Readonly<Record<string, unknown>> {
  if (
    value === null ||
    typeof value !== 'object' ||
    Array.isArray(value) ||
    Object.getPrototypeOf(value) !== Object.prototype
  ) {
    refuse();
  }

  const descriptors =
    Object.getOwnPropertyDescriptors(value);

  const keys = Reflect.ownKeys(value);

  const admitted = [
    ...required,
    ...optional,
  ];

  if (
    keys.some(
      key =>
        typeof key !== 'string' ||
        !admitted.includes(key),
    ) ||
    required.some(
      key => !Object.prototype.hasOwnProperty.call(
        descriptors,
        key,
      ),
    )
  ) {
    refuse();
  }

  for (const key of keys) {
    if (typeof key !== 'string') {
      refuse();
    }

    const descriptor = descriptors[key];

    if (
      !descriptor ||
      !('value' in descriptor) ||
      descriptor.enumerable !== true
    ) {
      refuse();
    }
  }

  return descriptorsToValues(
    descriptors,
    keys as string[],
  );
}

function descriptorsToValues(
  descriptors: PropertyDescriptorMap,
  keys: readonly string[],
): Readonly<Record<string, unknown>> {
  const result: Record<string, unknown> = {};

  for (const key of keys) {
    const descriptor = descriptors[key];

    if (!descriptor || !('value' in descriptor)) {
      refuse();
    }

    result[key] = descriptor.value;
  }

  return Object.freeze(result);
}

function admitConfig(
  input: FabricTimerDriverConfig,
): Readonly<FabricTimerDriverConfig> {
  const exact =
    exactDataObject(
      input,
      ['intervalMs', 'jitterMs'],
    );

  return Object.freeze({
    intervalMs:
      boundedInteger(
        exact.intervalMs,
        1,
        XVI_TIMER_DRIVER_GUARDRAILS
          .maximumIntervalMs,
      ),

    jitterMs:
      boundedInteger(
        exact.jitterMs,
        0,
        XVI_TIMER_DRIVER_GUARDRAILS
          .maximumJitterMs,
      ),
  });
}

function admitDeps(
  input: FabricTimerDriverDeps,
): Readonly<FabricTimerDriverDeps> {
  const exact =
    exactDataObject(
      input,
      [
        'now',
        'sleep',
        'runWork',
        'runCheckpoint',
        'runHeartbeat',
      ],
      ['signal'],
    );

  for (const key of [
    'now',
    'sleep',
    'runWork',
    'runCheckpoint',
    'runHeartbeat',
  ] as const) {
    if (typeof exact[key] !== 'function') {
      refuse();
    }
  }

  const signal = exact.signal;

  if (
    signal !== undefined &&
    !(
      typeof signal === 'object' &&
      signal !== null &&
      typeof (signal as AbortSignal).aborted ===
        'boolean'
    )
  ) {
    refuse();
  }

  return Object.freeze({
    now:
      exact.now as FabricTimerDriverDeps['now'],

    sleep:
      exact.sleep as FabricTimerDriverDeps['sleep'],

    runWork:
      exact.runWork as FabricTimerDriverDeps['runWork'],

    runCheckpoint:
      exact.runCheckpoint as
        FabricTimerDriverDeps['runCheckpoint'],

    runHeartbeat:
      exact.runHeartbeat as
        FabricTimerDriverDeps['runHeartbeat'],

    ...(signal === undefined
      ? {}
      : {
          signal: signal as AbortSignal,
        }),
  });
}

function isSchedulerIntegrityFailure(
  error: unknown,
): boolean {
  return (
    error instanceof Error &&
    error.message === 'XVI_SCHEDULER_REFUSED'
  );
}

export async function runFabricTimerDriver(
  scheduler: FabricScheduler,
  config: FabricTimerDriverConfig,
  deps: FabricTimerDriverDeps,
): Promise<void> {
  const admittedConfig =
    admitConfig(config);

  const admittedDeps =
    admitDeps(deps);

  let runningTick = false;

  while (scheduler.state === 'RUNNING') {
    if (admittedDeps.signal?.aborted) {
      stopFabricScheduler(scheduler);
      return;
    }

    if (runningTick) {
      refuse();
    }

    runningTick = true;

    try {
      const nowMs =
        admittedDeps.now();

      const decision =
        planFabricSchedulerTick(
          scheduler,
          nowMs,
        );

      try {
        await admittedDeps.runWork(decision);

        if (decision.checkpointDue) {
          await admittedDeps.runCheckpoint(
            decision,
          );
        }

        if (decision.heartbeatDue) {
          try {
            await admittedDeps.runHeartbeat(
              decision,
            );
          } catch (error) {
            if (
              isSchedulerIntegrityFailure(error)
            ) {
              throw error;
            }

            markFabricSchedulerOwnershipLost(
              scheduler,
            );

            return;
          }
        }

        recordFabricSchedulerSuccess(
          scheduler,
        );
      } catch (error) {
        /*
         * Scheduler integrity failures are not
         * ordinary work failures. Never downgrade
         * them into the retry/failure budget.
         */
        if (
          isSchedulerIntegrityFailure(error)
        ) {
          throw error;
        }

        if (scheduler.state === 'RUNNING') {
          recordFabricSchedulerFailure(
            scheduler,
          );
        }
      }

      if (scheduler.state === 'STOPPING') {
        stopFabricScheduler(scheduler);
        return;
      }

      if (scheduler.state !== 'RUNNING') {
        return;
      }
    } finally {
      runningTick = false;
    }

    const delay =
      admittedConfig.intervalMs +
      admittedConfig.jitterMs;

    await admittedDeps.sleep(delay);
  }
}
