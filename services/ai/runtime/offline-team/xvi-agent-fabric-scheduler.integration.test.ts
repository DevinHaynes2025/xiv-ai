import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import {
  SharedHostLeaseStore,
} from './shared-host-lease-store';

import {
  reserveFabricWorkerLease,
} from './xvi-agent-fabric-worker-lease';

import {
  createFabricHeartbeatController,
  markFabricWorkerRunning,
  heartbeatFabricWorker,
} from './xvi-agent-fabric-heartbeat';

import {
  createFabricScheduler,
  startFabricScheduler,
  planFabricSchedulerTick,
  markFabricSchedulerOwnershipLost,
} from './xvi-agent-fabric-scheduler';

import type {
  FabricReplayResult,
} from './xvi-agent-fabric-restart-replay';

function replay(): Readonly<FabricReplayResult> {
  return Object.freeze({
    version: 'xvi-agent-fabric-replay-v1',
    tenantId: 'tenant-a',
    missionId: 'mission-scheduler-001',
    state: 'CHECKPOINTED',
    eventCount: 3,
    lastSequence: 3,
    envelopeVerified: true,
    journalVerified: true,
    executesNothing: true,
    productionAuthority: false,
    verification:
      'RESTORED_FOR_RECOVERY_EVALUATION',
  });
}

test('scheduler and heartbeat share real lease ownership safely', () => {
  const directory =
    mkdtempSync(join(tmpdir(), 'xvi-scheduler-'));

  const ledger =
    join(directory, 'scheduler.sqlite');

  const hostScopeId = 'c'.repeat(32);

  let now = 3_000_000;

  SharedHostLeaseStore.initialize(
    ledger,
    hostScopeId,
  );

  const store =
    new SharedHostLeaseStore(
      ledger,
      hostScopeId,
      () => now,
    );

  try {
    const reservation =
      reserveFabricWorkerLease(
        store,
        {
          replay: replay(),
          holderInstanceId: 'asus-worker-01',
          lane: 'HOMEBASE',
          providerId: 'local-test-provider',
          modelId: 'local-test-model',
          presenceEvidenceRef:
            'presence:scheduler-test',
          sourceCommit: 'c'.repeat(40),
          ttlMs: 10_000,
        },
      );

    assert.equal(
      reservation.status,
      'RESERVED_NOT_STARTED',
    );

    assert.ok(reservation.handle);

    const heartbeat =
      createFabricHeartbeatController(
        reservation.tenantId,
        reservation.missionId,
        reservation.holderInstanceId,
        reservation.handle,
      );

    const scheduler =
      createFabricScheduler({
        missionId: reservation.missionId,
        tenantId: reservation.tenantId,
        maxTicks: 4,
        heartbeatEveryTicks: 2,
        checkpointEveryTicks: 3,
        maxRuntimeMs: 60_000,
        maxConsecutiveFailures: 3,
      });

    markFabricWorkerRunning(heartbeat);

    startFabricScheduler(
      scheduler,
      now,
    );

    for (let i = 1; i <= 4; i += 1) {
      now += 1_000;

      const decision =
        planFabricSchedulerTick(
          scheduler,
          now,
        );

      assert.equal(
        decision.productionAuthority,
        false,
      );

      assert.equal(
        decision.providerCalls,
        0,
      );

      assert.equal(
        decision.processSpawns,
        0,
      );

      if (decision.heartbeatDue) {
        const receipt =
          heartbeatFabricWorker(
            store,
            heartbeat,
            now,
            10_000,
          );

        assert.equal(
          receipt.ownershipVerified,
          true,
        );
      }
    }

    assert.equal(
      scheduler.state,
      'STOPPING',
    );

    assert.equal(
      heartbeat.state,
      'RUNNING',
    );

    /*
     * Deliberately destroy heartbeat ownership
     * by mutating the private controller handle
     * to a stale revision.
     *
     * The next heartbeat must fail, after which
     * scheduling ownership is explicitly revoked.
     */
    heartbeat.handle = {
      ...heartbeat.handle,
      revision: heartbeat.handle.revision - 1,
    };

    now += 1_000;

    assert.throws(
      () =>
        heartbeatFabricWorker(
          store,
          heartbeat,
          now,
          10_000,
        ),
      /XVI_HEARTBEAT_REFUSED/,
    );

    assert.equal(
      heartbeat.state,
      'OWNERSHIP_LOST',
    );

    /*
     * Scheduler must not continue claiming work
     * after ownership loss.
     */
    if (scheduler.state === 'RUNNING') {
      markFabricSchedulerOwnershipLost(
        scheduler,
      );
    }

    assert.notEqual(
      scheduler.state,
      'RUNNING',
    );
  } finally {
    store.close();

    rmSync(
      directory,
      {
        recursive: true,
        force: true,
      },
    );
  }
});
