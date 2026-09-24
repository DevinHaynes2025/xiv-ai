import test from 'node:test';
import assert from 'node:assert/strict';

import {
  createFabricScheduler,
  startFabricScheduler,
  planFabricSchedulerTick,
  recordFabricSchedulerSuccess,
  recordFabricSchedulerFailure,
  markFabricSchedulerOwnershipLost,
  stopFabricScheduler,
  XVI_SCHEDULER_GUARDRAILS,
  type FabricSchedulerConfig,
} from './xvi-agent-fabric-scheduler';

function config(
  overrides: Partial<FabricSchedulerConfig> = {},
): FabricSchedulerConfig {
  return {
    missionId: 'mission-001',
    tenantId: 'tenant-a',
    maxTicks: 6,
    heartbeatEveryTicks: 2,
    checkpointEveryTicks: 3,
    maxRuntimeMs: 60_000,
    maxConsecutiveFailures: 3,
    ...overrides,
  };
}

test('scheduler starts with zero execution authority', () => {
  const scheduler =
    createFabricScheduler(config());

  assert.equal(scheduler.state, 'READY');
  assert.equal(scheduler.tick, 0);
  assert.equal(scheduler.productionAuthority, false);
  assert.equal(scheduler.providerCalls, 0);
  assert.equal(scheduler.processSpawns, 0);

  assert.equal(
    XVI_SCHEDULER_GUARDRAILS.automaticTimers,
    false,
  );
});

test('scheduler requires explicit start', () => {
  const scheduler =
    createFabricScheduler(config());

  assert.throws(
    () => planFabricSchedulerTick(scheduler, 1_000),
    /XVI_SCHEDULER_REFUSED/,
  );

  assert.equal(scheduler.tick, 0);
});

test('scheduler cadence is deterministic', () => {
  const scheduler =
    createFabricScheduler(config());

  startFabricScheduler(scheduler, 1_000);

  const one =
    planFabricSchedulerTick(scheduler, 1_001);

  assert.equal(one.tick, 1);
  assert.equal(one.heartbeatDue, false);
  assert.equal(one.checkpointDue, false);

  const two =
    planFabricSchedulerTick(scheduler, 1_002);

  assert.equal(two.tick, 2);
  assert.equal(two.heartbeatDue, true);
  assert.equal(two.checkpointDue, false);

  const three =
    planFabricSchedulerTick(scheduler, 1_003);

  assert.equal(three.tick, 3);
  assert.equal(three.heartbeatDue, false);
  assert.equal(three.checkpointDue, true);

  const sixScheduler =
    createFabricScheduler(config());

  startFabricScheduler(sixScheduler, 2_000);

  let final;

  for (let tick = 1; tick <= 6; tick += 1) {
    final =
      planFabricSchedulerTick(
        sixScheduler,
        2_000 + tick,
      );
  }

  assert.ok(final);
  assert.equal(final.tick, 6);
  assert.equal(final.heartbeatDue, true);
  assert.equal(final.checkpointDue, true);
  assert.equal(final.stopAfterTick, true);
  assert.equal(final.state, 'STOPPING');
});

test('duplicate start fails closed', () => {
  const scheduler =
    createFabricScheduler(config());

  startFabricScheduler(scheduler, 1_000);

  assert.throws(
    () => startFabricScheduler(scheduler, 1_001),
    /XVI_SCHEDULER_REFUSED/,
  );
});

test('clock must move strictly forward between ticks', () => {
  const scheduler =
    createFabricScheduler(config());

  startFabricScheduler(scheduler, 1_000);

  planFabricSchedulerTick(scheduler, 1_001);

  for (const time of [1_001, 1_000, 999]) {
    assert.throws(
      () =>
        planFabricSchedulerTick(
          scheduler,
          time,
        ),
      /XVI_SCHEDULER_REFUSED/,
    );
  }

  assert.equal(scheduler.tick, 1);
});

test('unsafe clocks fail closed', () => {
  for (const value of [
    -1,
    1.5,
    Number.NaN,
    Number.POSITIVE_INFINITY,
    Number.MAX_SAFE_INTEGER + 1,
  ]) {
    const scheduler =
      createFabricScheduler(config());

    assert.throws(
      () =>
        startFabricScheduler(
          scheduler,
          value,
        ),
      /XVI_SCHEDULER_REFUSED/,
    );
  }
});

test('runtime exhaustion moves scheduler toward stop', () => {
  const scheduler =
    createFabricScheduler(
      config({
        maxRuntimeMs: 100,
      }),
    );

  startFabricScheduler(scheduler, 1_000);

  assert.throws(
    () =>
      planFabricSchedulerTick(
        scheduler,
        1_101,
      ),
    /XVI_SCHEDULER_REFUSED/,
  );

  assert.equal(
    scheduler.state,
    'STOPPING',
  );

  assert.equal(scheduler.tick, 0);
});

test('failure budget is bounded and terminal', () => {
  const scheduler =
    createFabricScheduler(config());

  startFabricScheduler(scheduler, 1_000);

  recordFabricSchedulerFailure(scheduler);
  assert.equal(
    scheduler.consecutiveFailures,
    1,
  );

  recordFabricSchedulerFailure(scheduler);
  assert.equal(
    scheduler.consecutiveFailures,
    2,
  );

  recordFabricSchedulerFailure(scheduler);

  assert.equal(scheduler.state, 'FAILED');

  assert.throws(
    () =>
      recordFabricSchedulerFailure(
        scheduler,
      ),
    /XVI_SCHEDULER_REFUSED/,
  );

  assert.throws(
    () =>
      planFabricSchedulerTick(
        scheduler,
        1_001,
      ),
    /XVI_SCHEDULER_REFUSED/,
  );
});

test('success resets consecutive failure count', () => {
  const scheduler =
    createFabricScheduler(config());

  startFabricScheduler(scheduler, 1_000);

  recordFabricSchedulerFailure(scheduler);
  recordFabricSchedulerFailure(scheduler);

  assert.equal(
    scheduler.consecutiveFailures,
    2,
  );

  recordFabricSchedulerSuccess(scheduler);

  assert.equal(
    scheduler.consecutiveFailures,
    0,
  );
});

test('ownership loss is terminal for scheduling', () => {
  const scheduler =
    createFabricScheduler(config());

  startFabricScheduler(scheduler, 1_000);

  markFabricSchedulerOwnershipLost(
    scheduler,
  );

  assert.equal(
    scheduler.state,
    'OWNERSHIP_LOST',
  );

  assert.throws(
    () =>
      planFabricSchedulerTick(
        scheduler,
        1_001,
      ),
    /XVI_SCHEDULER_REFUSED/,
  );

  assert.throws(
    () =>
      recordFabricSchedulerSuccess(
        scheduler,
      ),
    /XVI_SCHEDULER_REFUSED/,
  );
});

test('stop prevents future work planning', () => {
  const scheduler =
    createFabricScheduler(config());

  startFabricScheduler(scheduler, 1_000);

  stopFabricScheduler(scheduler);

  assert.equal(scheduler.state, 'STOPPED');

  assert.throws(
    () =>
      planFabricSchedulerTick(
        scheduler,
        1_001,
      ),
    /XVI_SCHEDULER_REFUSED/,
  );
});

test('configuration bounds fail closed', () => {
  const invalid = [
    config({ maxTicks: 0 }),
    config({ maxTicks: 1_000_001 }),
    config({ heartbeatEveryTicks: 0 }),
    config({ heartbeatEveryTicks: 7 }),
    config({ checkpointEveryTicks: 0 }),
    config({ checkpointEveryTicks: 7 }),
    config({ maxRuntimeMs: 0 }),
    config({ maxRuntimeMs: 86_400_001 }),
    config({ maxConsecutiveFailures: 0 }),
    config({ maxConsecutiveFailures: 17 }),
  ];

  for (const candidate of invalid) {
    assert.throws(
      () => createFabricScheduler(candidate),
      /XVI_SCHEDULER_REFUSED/,
    );
  }
});

test('configuration accessors fail closed without invocation', () => {
  const candidate = config();

  let invoked = 0;

  Object.defineProperty(
    candidate,
    'maxTicks',
    {
      enumerable: true,
      get() {
        invoked += 1;
        return 6;
      },
    },
  );

  assert.throws(
    () => createFabricScheduler(candidate),
    /XVI_SCHEDULER_REFUSED/,
  );

  assert.equal(invoked, 0);
});

test('hidden symbol and inherited config state fail closed', () => {
  const hidden = config();

  Object.defineProperty(
    hidden,
    'operatorOverride',
    {
      value: true,
      enumerable: false,
    },
  );

  assert.throws(
    () => createFabricScheduler(hidden),
    /XVI_SCHEDULER_REFUSED/,
  );

  const symbol = config();

  Object.defineProperty(
    symbol,
    Symbol('authority'),
    {
      value: true,
      enumerable: true,
    },
  );

  assert.throws(
    () => createFabricScheduler(symbol),
    /XVI_SCHEDULER_REFUSED/,
  );

  const inherited =
    Object.assign(
      Object.create({
        productionAuthority: true,
      }),
      config(),
    );

  assert.throws(
    () =>
      createFabricScheduler(
        inherited,
      ),
    /XVI_SCHEDULER_REFUSED/,
  );
});

test('scheduler config is detached from caller mutation', () => {
  const original = config();

  const scheduler =
    createFabricScheduler(original);

  original.maxTicks = 999_999;
  original.maxRuntimeMs = 1;

  assert.equal(
    scheduler.config.maxTicks,
    6,
  );

  assert.equal(
    scheduler.config.maxRuntimeMs,
    60_000,
  );

  assert.equal(
    Object.isFrozen(scheduler.config),
    true,
  );
});

test('decision is frozen and contains no secret material', () => {
  const scheduler =
    createFabricScheduler(config());

  startFabricScheduler(scheduler, 1_000);

  const decision =
    planFabricSchedulerTick(
      scheduler,
      1_001,
    );

  assert.equal(
    Object.isFrozen(decision),
    true,
  );

  assert.equal(
    decision.secretMaterialIncluded,
    false,
  );

  const serialized =
    JSON.stringify(decision);

  assert.equal(
    serialized.includes('ownerSecret'),
    false,
  );

  assert.equal(
    serialized.includes('handle'),
    false,
  );
});

test('scheduler guardrails forbid authority and side effects', () => {
  assert.equal(
    XVI_SCHEDULER_GUARDRAILS.productionAuthority,
    false,
  );

  assert.equal(
    XVI_SCHEDULER_GUARDRAILS.providerCalls,
    0,
  );

  assert.equal(
    XVI_SCHEDULER_GUARDRAILS.processSpawns,
    0,
  );

  assert.equal(
    XVI_SCHEDULER_GUARDRAILS
      .continuesAfterOwnershipLoss,
    false,
  );
});

test('external state mutation cannot manufacture running authority', () => {
  const scheduler =
    createFabricScheduler(config());

  scheduler.state = 'RUNNING';

  assert.throws(
    () =>
      planFabricSchedulerTick(
        scheduler,
        1_000,
      ),
    /XVI_SCHEDULER_REFUSED/,
  );
});

test('external tick mutation cannot bypass tick budget', () => {
  const scheduler =
    createFabricScheduler(config());

  startFabricScheduler(scheduler, 1_000);

  scheduler.tick = 5;

  assert.throws(
    () =>
      planFabricSchedulerTick(
        scheduler,
        1_001,
      ),
    /XVI_SCHEDULER_REFUSED/,
  );
});

test('external clock mutation cannot rewrite scheduler history', () => {
  const scheduler =
    createFabricScheduler(config());

  startFabricScheduler(scheduler, 1_000);

  planFabricSchedulerTick(
    scheduler,
    1_001,
  );

  scheduler.startedAtMs = 0;
  scheduler.lastTickAtMs = 0;

  assert.throws(
    () =>
      planFabricSchedulerTick(
        scheduler,
        1_002,
      ),
    /XVI_SCHEDULER_REFUSED/,
  );
});

test('external failure counter mutation cannot erase failure history', () => {
  const scheduler =
    createFabricScheduler(config());

  startFabricScheduler(scheduler, 1_000);

  recordFabricSchedulerFailure(scheduler);
  recordFabricSchedulerFailure(scheduler);

  scheduler.consecutiveFailures = 0;

  assert.throws(
    () =>
      recordFabricSchedulerFailure(
        scheduler,
      ),
    /XVI_SCHEDULER_REFUSED/,
  );

  assert.equal(
    scheduler.state,
    'FAILED',
  );
});

test('scheduler identity cannot be rewritten after admission', () => {
  const scheduler =
    createFabricScheduler(config());

  scheduler.tenantId = 'tenant-b';
  scheduler.missionId = 'mission-evil';

  assert.throws(
    () =>
      startFabricScheduler(
        scheduler,
        1_000,
      ),
    /XVI_SCHEDULER_REFUSED/,
  );

  assert.equal(
    scheduler.state,
    'FAILED',
  );
});

test('scheduler authority flags cannot be elevated externally', () => {
  const scheduler =
    createFabricScheduler(config());

  (scheduler as {
    productionAuthority: boolean;
  }).productionAuthority = true;

  (scheduler as {
    providerCalls: number;
  }).providerCalls = 999;

  assert.throws(
    () =>
      startFabricScheduler(
        scheduler,
        1_000,
      ),
    /XVI_SCHEDULER_REFUSED/,
  );
});
