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
  beginFabricCheckpoint,
  finishFabricCheckpoint,
} from './xvi-agent-fabric-heartbeat';

import type {
  FabricReplayResult,
} from './xvi-agent-fabric-restart-replay';

function replay(): Readonly<FabricReplayResult> {
  return Object.freeze({
    version: 'xvi-agent-fabric-replay-v1',
    tenantId: 'tenant-a',
    missionId: 'mission-heartbeat-001',
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

test('real ledger maintains heartbeat ownership across revisions', () => {
  const directory =
    mkdtempSync(join(tmpdir(), 'xvi-heartbeat-'));

  const ledger =
    join(directory, 'heartbeat.sqlite');

  const hostScopeId = 'b'.repeat(32);

  let now = 2_000_000;

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
            'presence:heartbeat-test',
          sourceCommit: 'b'.repeat(40),
          ttlMs: 10_000,
        },
      );

    assert.equal(
      reservation.status,
      'RESERVED_NOT_STARTED',
    );

    assert.ok(reservation.handle);

    const initialRevision =
      reservation.handle.revision;

    const controller =
      createFabricHeartbeatController(
        reservation.tenantId,
        reservation.missionId,
        reservation.holderInstanceId,
        reservation.handle,
      );

    /*
     * Reservation still does not imply execution.
     */
    assert.equal(controller.state, 'RESERVED');

    markFabricWorkerRunning(controller);

    now += 1_000;

    const first =
      heartbeatFabricWorker(
        store,
        controller,
        now,
        10_000,
      );

    assert.equal(first.sequence, 1);
    assert.equal(first.ownershipVerified, true);
    assert.equal(first.productionAuthority, false);
    assert.equal(first.providerCalls, 0);

    assert.equal(
      controller.handle.revision,
      initialRevision + 1,
    );

    now += 1_000;

    beginFabricCheckpoint(controller);

    const second =
      heartbeatFabricWorker(
        store,
        controller,
        now,
        10_000,
      );

    assert.equal(second.sequence, 2);
    assert.equal(second.state, 'CHECKPOINTING');

    assert.equal(
      controller.handle.revision,
      initialRevision + 2,
    );

    finishFabricCheckpoint(controller);

    assert.equal(controller.state, 'RUNNING');

    /*
     * Public heartbeat receipts must never expose
     * the private controller handle.
     */
    const serialized = JSON.stringify([
      first,
      second,
    ]);

    assert.equal(
      serialized.includes('ownerSecret'),
      false,
    );

    assert.equal(
      serialized.includes(
        controller.handle.ownerSecret,
      ),
      false,
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
