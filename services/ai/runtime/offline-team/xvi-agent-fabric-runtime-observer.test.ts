import test from 'node:test';
import assert from 'node:assert/strict';

import {
  createFabricRuntimeObserver,
  XVI_RUNTIME_OBSERVER_GUARDRAILS,
} from './xvi-agent-fabric-runtime-observer';

import {
  createFabricScheduler,
  startFabricScheduler,
  planFabricSchedulerTick,
} from './xvi-agent-fabric-scheduler';

function scheduler() {
  const value =
    createFabricScheduler({
      tenantId: 'tenant-a',
      missionId: 'mission-001',
      maxTicks: 4,
      heartbeatEveryTicks: 2,
      checkpointEveryTicks: 3,
      maxRuntimeMs: 60_000,
      maxConsecutiveFailures: 3,
    });

  startFabricScheduler(
    value,
    1_000,
  );

  return value;
}

test('observer projects scheduler work without gaining authority', () => {
  const s = scheduler();

  const observer =
    createFabricRuntimeObserver(
      'tenant-a',
      'mission-001',
    );

  observer.missionStarted(1_000);

  const decision =
    planFabricSchedulerTick(
      s,
      1_001,
    );

  observer.tickStarted(
    decision,
    1_001,
  );

  observer.workStarted(
    decision,
    1_001,
  );

  observer.workCompleted(
    decision,
    1_002,
  );

  const snapshot =
    observer.stream.snapshot();

  assert.equal(
    snapshot.status,
    'HEALTHY',
  );

  assert.equal(
    snapshot.lastEvent,
    'WORK_COMPLETED',
  );

  assert.equal(
    snapshot.eventCount,
    4,
  );

  assert.equal(
    snapshot.productionAuthority,
    false,
  );

  assert.equal(
    snapshot.secretMaterialIncluded,
    false,
  );
});

test('observer refuses cross mission scheduler decisions', () => {
  const observer =
    createFabricRuntimeObserver(
      'tenant-a',
      'mission-001',
    );

  observer.missionStarted(1_000);

  const s =
    createFabricScheduler({
      tenantId: 'tenant-a',
      missionId: 'mission-evil',
      maxTicks: 1,
      heartbeatEveryTicks: 1,
      checkpointEveryTicks: 1,
      maxRuntimeMs: 1_000,
      maxConsecutiveFailures: 1,
    });

  startFabricScheduler(s, 1_000);

  const decision =
    planFabricSchedulerTick(
      s,
      1_001,
    );

  assert.throws(
    () =>
      observer.tickStarted(
        decision,
        1_001,
      ),
    /XVI_RUNTIME_OBSERVER_REFUSED/,
  );

  assert.equal(
    observer.stream.snapshot()
      .eventCount,
    1,
  );
});

test('ownership loss projects recovering and cannot silently resume', () => {
  const observer =
    createFabricRuntimeObserver(
      'tenant-a',
      'mission-001',
    );

  observer.missionStarted(1_000);

  const s = scheduler();

  const decision =
    planFabricSchedulerTick(
      s,
      1_001,
    );

  observer.tickStarted(
    decision,
    1_001,
  );

  observer.ownershipLost(
    1_002,
  );

  assert.equal(
    observer.stream.snapshot().status,
    'RECOVERING',
  );

  assert.throws(
    () =>
      observer.workStarted(
        decision,
        1_003,
      ),
    /XVI_RUNTIME_STREAM_REFUSED/,
  );

  assert.equal(
    observer.stream.snapshot().status,
    'RECOVERING',
  );
});

test('observer clock regression fails without stream mutation', () => {
  const observer =
    createFabricRuntimeObserver(
      'tenant-a',
      'mission-001',
    );

  observer.missionStarted(2_000);

  assert.throws(
    () =>
      observer.failureRecorded(
        1_999,
      ),
    /XVI_RUNTIME_OBSERVER_REFUSED/,
  );

  assert.equal(
    observer.stream.snapshot()
      .eventCount,
    1,
  );
});

test('observer itself carries zero authority', () => {
  assert.equal(
    XVI_RUNTIME_OBSERVER_GUARDRAILS
      .productionAuthority,
    false,
  );

  assert.equal(
    XVI_RUNTIME_OBSERVER_GUARDRAILS
      .providerCalls,
    0,
  );

  assert.equal(
    XVI_RUNTIME_OBSERVER_GUARDRAILS
      .processSpawns,
    0,
  );

  assert.equal(
    XVI_RUNTIME_OBSERVER_GUARDRAILS
      .mutatesScheduler,
    false,
  );

  assert.equal(
    XVI_RUNTIME_OBSERVER_GUARDRAILS
      .ownsLease,
    false,
  );
});

test('forged scheduler authority flags are refused', () => {
  const observer =
    createFabricRuntimeObserver(
      'tenant-a',
      'mission-001',
    );

  observer.missionStarted(1_000);

  const s = scheduler();

  const decision =
    planFabricSchedulerTick(
      s,
      1_001,
    );

  const forged = {
    ...decision,
    productionAuthority: true,
  };

  assert.throws(
    () =>
      observer.tickStarted(
        forged as never,
        1_001,
      ),
    /XVI_RUNTIME_OBSERVER_REFUSED/,
  );

  assert.equal(
    observer.stream.snapshot().eventCount,
    1,
  );
});

test('scheduler decision identity cannot cross observer boundary', () => {
  const observer =
    createFabricRuntimeObserver(
      'tenant-a',
      'mission-001',
    );

  observer.missionStarted(1_000);

  const s = scheduler();

  const decision =
    planFabricSchedulerTick(
      s,
      1_001,
    );

  const forged = {
    ...decision,
    tenantId: 'tenant-b',
  };

  assert.throws(
    () =>
      observer.workStarted(
        forged,
        1_001,
      ),
    /XVI_RUNTIME_OBSERVER_REFUSED/,
  );

  assert.equal(
    observer.stream.snapshot().eventCount,
    1,
  );
});

test('failed observer append does not advance observer sequence or clock', () => {
  const observer =
    createFabricRuntimeObserver(
      'tenant-a',
      'mission-001',
    );

  observer.missionStarted(1_000);

  /*
   * Illegal directly after MISSION_STARTED.
   * Stream must refuse it and observer must not
   * consume sequence 2 or advance its clock.
   */
  assert.throws(
    () =>
      observer.workCompleted(
        planFabricSchedulerTick(
          scheduler(),
          1_001,
        ),
        1_500,
      ),
    /XVI_RUNTIME_STREAM_REFUSED/,
  );

  const s = scheduler();

  const decision =
    planFabricSchedulerTick(
      s,
      1_001,
    );

  observer.tickStarted(
    decision,
    1_001,
  );

  const snapshot =
    observer.stream.snapshot();

  assert.equal(snapshot.sequence, 2);
  assert.equal(snapshot.eventCount, 2);
  assert.equal(
    snapshot.lastEvent,
    'TICK_STARTED',
  );
});

test('stopped observer projection cannot resume work', () => {
  const observer =
    createFabricRuntimeObserver(
      'tenant-a',
      'mission-001',
    );

  observer.missionStarted(1_000);
  observer.missionStopped(1_001);

  const s = scheduler();

  const decision =
    planFabricSchedulerTick(
      s,
      1_002,
    );

  assert.throws(
    () =>
      observer.tickStarted(
        decision,
        1_002,
      ),
    /XVI_RUNTIME_STREAM_REFUSED/,
  );

  assert.equal(
    observer.stream.snapshot().status,
    'STOPPED',
  );
});

test('observer snapshot serialization exposes no controller credentials', () => {
  const observer =
    createFabricRuntimeObserver(
      'tenant-a',
      'mission-001',
    );

  observer.missionStarted(1_000);

  const serialized =
    JSON.stringify(
      observer.stream.snapshot(),
    );

  for (const forbidden of [
    'ownerSecret',
    'leaseId',
    'handle',
    'providerId',
    'modelId',
    'sourceCommit',
    'presenceEvidenceRef',
  ]) {
    assert.equal(
      serialized.includes(forbidden),
      false,
    );
  }
});
