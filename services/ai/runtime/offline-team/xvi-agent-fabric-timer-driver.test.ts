import test from 'node:test';
import assert from 'node:assert/strict';

import {
  runFabricTimerDriver,
  XVI_TIMER_DRIVER_GUARDRAILS,
} from './xvi-agent-fabric-timer-driver';

import {
  createFabricScheduler,
  startFabricScheduler,
} from './xvi-agent-fabric-scheduler';

function scheduler(
  overrides: Record<string, number> = {},
) {
  const s = createFabricScheduler({
    missionId: 'mission-timer-001',
    tenantId: 'tenant-a',
    maxTicks: overrides.maxTicks ?? 4,
    heartbeatEveryTicks:
      overrides.heartbeatEveryTicks ?? 2,
    checkpointEveryTicks:
      overrides.checkpointEveryTicks ?? 3,
    maxRuntimeMs:
      overrides.maxRuntimeMs ?? 60_000,
    maxConsecutiveFailures:
      overrides.maxConsecutiveFailures ?? 3,
  });

  startFabricScheduler(s, 1_000);

  return s;
}

function clock() {
  let now = 1_000;

  return () => {
    now += 1;
    return now;
  };
}

test('bounded timer driver completes tick budget without overlap', async () => {
  const s = scheduler();

  let active = 0;
  let maximumActive = 0;
  let workCalls = 0;
  const sleeps: number[] = [];

  await runFabricTimerDriver(
    s,
    {
      intervalMs: 10,
      jitterMs: 2,
    },
    {
      now: clock(),

      async sleep(delayMs) {
        sleeps.push(delayMs);
      },

      async runWork() {
        active += 1;
        maximumActive =
          Math.max(maximumActive, active);

        workCalls += 1;

        await Promise.resolve();

        active -= 1;
      },

      async runCheckpoint() {},

      async runHeartbeat() {},
    },
  );

  assert.equal(workCalls, 4);
  assert.equal(maximumActive, 1);
  assert.equal(s.state, 'STOPPED');

  assert.deepEqual(
    sleeps,
    [12, 12, 12],
  );
});

test('cancellation before first tick performs no work', async () => {
  const s = scheduler();

  const controller =
    new AbortController();

  controller.abort();

  let workCalls = 0;

  await runFabricTimerDriver(
    s,
    {
      intervalMs: 10,
      jitterMs: 0,
    },
    {
      now: clock(),
      signal: controller.signal,

      async sleep() {},

      async runWork() {
        workCalls += 1;
      },

      async runCheckpoint() {},
      async runHeartbeat() {},
    },
  );

  assert.equal(workCalls, 0);
  assert.equal(s.tick, 0);
  assert.equal(s.state, 'STOPPED');
});

test('cancellation between ticks prevents subsequent work', async () => {
  const s = scheduler();

  const controller =
    new AbortController();

  let workCalls = 0;

  await runFabricTimerDriver(
    s,
    {
      intervalMs: 10,
      jitterMs: 0,
    },
    {
      now: clock(),
      signal: controller.signal,

      async sleep() {
        controller.abort();
      },

      async runWork() {
        workCalls += 1;
      },

      async runCheckpoint() {},
      async runHeartbeat() {},
    },
  );

  assert.equal(workCalls, 1);
  assert.equal(s.state, 'STOPPED');
});

test('heartbeat failure revokes scheduling ownership', async () => {
  const s = scheduler({
    heartbeatEveryTicks: 1,
  });

  let workCalls = 0;
  let heartbeatCalls = 0;

  await runFabricTimerDriver(
    s,
    {
      intervalMs: 10,
      jitterMs: 0,
    },
    {
      now: clock(),

      async sleep() {},

      async runWork() {
        workCalls += 1;
      },

      async runCheckpoint() {},

      async runHeartbeat() {
        heartbeatCalls += 1;
        throw new Error('lease lost');
      },
    },
  );

  assert.equal(workCalls, 1);
  assert.equal(heartbeatCalls, 1);

  assert.equal(
    s.state,
    'OWNERSHIP_LOST',
  );
});

test('work failures consume bounded failure budget', async () => {
  const s = scheduler({
    maxTicks: 10,
    maxConsecutiveFailures: 2,
  });

  let workCalls = 0;

  await runFabricTimerDriver(
    s,
    {
      intervalMs: 1,
      jitterMs: 0,
    },
    {
      now: clock(),

      async sleep() {},

      async runWork() {
        workCalls += 1;
        throw new Error('work failed');
      },

      async runCheckpoint() {},
      async runHeartbeat() {},
    },
  );

  assert.equal(workCalls, 2);
  assert.equal(s.state, 'FAILED');
  assert.equal(
    s.consecutiveFailures,
    2,
  );
});

test('checkpoint failure consumes failure budget', async () => {
  const s = scheduler({
    maxTicks: 10,
    checkpointEveryTicks: 1,
    maxConsecutiveFailures: 2,
  });

  let checkpointCalls = 0;

  await runFabricTimerDriver(
    s,
    {
      intervalMs: 1,
      jitterMs: 0,
    },
    {
      now: clock(),

      async sleep() {},

      async runWork() {},

      async runCheckpoint() {
        checkpointCalls += 1;
        throw new Error('checkpoint failed');
      },

      async runHeartbeat() {},
    },
  );

  assert.equal(checkpointCalls, 2);
  assert.equal(s.state, 'FAILED');
});

test('heartbeat is not attempted after work failure on same tick', async () => {
  const s = scheduler({
    maxTicks: 10,
    heartbeatEveryTicks: 1,
    maxConsecutiveFailures: 1,
  });

  let heartbeatCalls = 0;

  await runFabricTimerDriver(
    s,
    {
      intervalMs: 1,
      jitterMs: 0,
    },
    {
      now: clock(),

      async sleep() {},

      async runWork() {
        throw new Error('work failed');
      },

      async runCheckpoint() {},

      async runHeartbeat() {
        heartbeatCalls += 1;
      },
    },
  );

  assert.equal(heartbeatCalls, 0);
  assert.equal(s.state, 'FAILED');
});

test('invalid interval and jitter fail closed before work', async () => {
  const invalid = [
    { intervalMs: 0, jitterMs: 0 },
    { intervalMs: 60_001, jitterMs: 0 },
    { intervalMs: 1.5, jitterMs: 0 },
    { intervalMs: 10, jitterMs: -1 },
    { intervalMs: 10, jitterMs: 5_001 },
    { intervalMs: 10, jitterMs: 1.5 },
  ];

  for (const candidate of invalid) {
    const s = scheduler();
    let workCalls = 0;

    await assert.rejects(
      () =>
        runFabricTimerDriver(
          s,
          candidate,
          {
            now: clock(),

            async sleep() {},

            async runWork() {
              workCalls += 1;
            },

            async runCheckpoint() {},
            async runHeartbeat() {},
          },
        ),
      /XVI_TIMER_DRIVER_REFUSED/,
    );

    assert.equal(workCalls, 0);
  }
});

test('driver guardrails carry zero authority', () => {
  assert.equal(
    XVI_TIMER_DRIVER_GUARDRAILS
      .productionAuthority,
    false,
  );

  assert.equal(
    XVI_TIMER_DRIVER_GUARDRAILS.providerCalls,
    0,
  );

  assert.equal(
    XVI_TIMER_DRIVER_GUARDRAILS.processSpawns,
    0,
  );

  assert.equal(
    XVI_TIMER_DRIVER_GUARDRAILS
      .overlappingTicksAllowed,
    false,
  );
});

test('scheduler tampering during work terminates trust', async () => {
  const s = scheduler({
    maxTicks: 10,
  });

  let workCalls = 0;

  await assert.rejects(
    () =>
      runFabricTimerDriver(
        s,
        {
          intervalMs: 1,
          jitterMs: 0,
        },
        {
          now: clock(),

          async sleep() {},

          async runWork() {
            workCalls += 1;
            s.tick = 999;
          },

          async runCheckpoint() {},
          async runHeartbeat() {},
        },
      ),
    /XVI_SCHEDULER_REFUSED/,
  );

  assert.equal(workCalls, 1);
  assert.equal(s.state, 'FAILED');
});

test('scheduler identity tampering during work terminates trust', async () => {
  const s = scheduler({
    maxTicks: 10,
  });

  await assert.rejects(
    () =>
      runFabricTimerDriver(
        s,
        {
          intervalMs: 1,
          jitterMs: 0,
        },
        {
          now: clock(),

          async sleep() {},

          async runWork() {
            s.tenantId = 'tenant-evil';
          },

          async runCheckpoint() {},
          async runHeartbeat() {},
        },
      ),
    /XVI_SCHEDULER_REFUSED/,
  );

  assert.equal(s.state, 'FAILED');
});

test('cancellation during work prevents another tick', async () => {
  const s = scheduler({
    maxTicks: 10,
  });

  const controller =
    new AbortController();

  let workCalls = 0;
  let sleepCalls = 0;

  await runFabricTimerDriver(
    s,
    {
      intervalMs: 1,
      jitterMs: 0,
    },
    {
      now: clock(),
      signal: controller.signal,

      async sleep() {
        sleepCalls += 1;
      },

      async runWork() {
        workCalls += 1;
        controller.abort();
      },

      async runCheckpoint() {},
      async runHeartbeat() {},
    },
  );

  assert.equal(workCalls, 1);
  assert.equal(sleepCalls, 1);
  assert.equal(s.state, 'STOPPED');
});

test('now failure escapes without manufacturing scheduler progress', async () => {
  const s = scheduler();

  await assert.rejects(
    () =>
      runFabricTimerDriver(
        s,
        {
          intervalMs: 1,
          jitterMs: 0,
        },
        {
          now() {
            throw new Error('clock unavailable');
          },

          async sleep() {},
          async runWork() {},
          async runCheckpoint() {},
          async runHeartbeat() {},
        },
      ),
    /clock unavailable/,
  );

  assert.equal(s.tick, 0);
});

test('sleep failure escapes after completed tick without overlapping work', async () => {
  const s = scheduler({
    maxTicks: 10,
  });

  let workCalls = 0;

  await assert.rejects(
    () =>
      runFabricTimerDriver(
        s,
        {
          intervalMs: 1,
          jitterMs: 0,
        },
        {
          now: clock(),

          async sleep() {
            throw new Error('timer unavailable');
          },

          async runWork() {
            workCalls += 1;
          },

          async runCheckpoint() {},
          async runHeartbeat() {},
        },
      ),
    /timer unavailable/,
  );

  assert.equal(workCalls, 1);
  assert.equal(s.tick, 1);
});

test('callback dependencies with accessors are rejected without invocation', async () => {
  const s = scheduler();

  let invoked = 0;

  const deps = {
    sleep: async () => {},
    runWork: async () => {},
    runCheckpoint: async () => {},
    runHeartbeat: async () => {},
  } as {
    now?: () => number;
    sleep: () => Promise<void>;
    runWork: () => Promise<void>;
    runCheckpoint: () => Promise<void>;
    runHeartbeat: () => Promise<void>;
  };

  Object.defineProperty(
    deps,
    'now',
    {
      enumerable: true,
      get() {
        invoked += 1;
        return clock();
      },
    },
  );

  await assert.rejects(
    () =>
      runFabricTimerDriver(
        s,
        {
          intervalMs: 1,
          jitterMs: 0,
        },
        deps as never,
      ),
    /XVI_TIMER_DRIVER_REFUSED/,
  );

  assert.equal(invoked, 0);
});

test('undeclared dependency fields fail closed', async () => {
  const s = scheduler();

  await assert.rejects(
    () =>
      runFabricTimerDriver(
        s,
        {
          intervalMs: 1,
          jitterMs: 0,
        },
        {
          now: clock(),
          async sleep() {},
          async runWork() {},
          async runCheckpoint() {},
          async runHeartbeat() {},
          operatorOverride: true,
        } as never,
      ),
    /XVI_TIMER_DRIVER_REFUSED/,
  );
});

test('timer configuration accessors fail closed without invocation', async () => {
  const s = scheduler();

  let invoked = 0;

  const candidate = {
    jitterMs: 0,
  } as {
    intervalMs?: number;
    jitterMs: number;
  };

  Object.defineProperty(
    candidate,
    'intervalMs',
    {
      enumerable: true,
      get() {
        invoked += 1;
        return 1;
      },
    },
  );

  await assert.rejects(
    () =>
      runFabricTimerDriver(
        s,
        candidate as never,
        {
          now: clock(),
          async sleep() {},
          async runWork() {},
          async runCheckpoint() {},
          async runHeartbeat() {},
        },
      ),
    /XVI_TIMER_DRIVER_REFUSED/,
  );

  assert.equal(invoked, 0);
});
