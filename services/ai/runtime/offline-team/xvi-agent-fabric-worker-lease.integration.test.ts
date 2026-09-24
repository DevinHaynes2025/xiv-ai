import test from 'node:test';
import assert from 'node:assert/strict';
import {
  mkdtempSync,
  rmSync,
} from 'node:fs';
import {
  tmpdir,
} from 'node:os';
import {
  join,
} from 'node:path';

import {
  SharedHostLeaseStore,
} from './shared-host-lease-store';

import {
  reserveFabricWorkerLease,
  renewFabricWorkerLease,
  markFabricWorkerStopped,
  releaseFabricWorkerLease,
} from './xvi-agent-fabric-worker-lease';

import type {
  FabricReplayResult,
} from './xvi-agent-fabric-restart-replay';

function replay(): Readonly<FabricReplayResult> {
  return Object.freeze({
    version: 'xvi-agent-fabric-replay-v1',
    tenantId: 'tenant-a',
    missionId: 'mission-001',
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

function request(holderInstanceId: string) {
  return {
    replay: replay(),
    holderInstanceId,
    lane: 'HOMEBASE' as const,
    providerId: 'local-test-provider',
    modelId: 'local-test-model',
    presenceEvidenceRef: 'presence:test',
    sourceCommit: 'a'.repeat(40),
    ttlMs: 10_000,
  };
}

test('real host ledger enforces single-owner lease lifecycle', () => {
  const directory =
    mkdtempSync(
      join(tmpdir(), 'xvi-host-lease-'),
    );

  const ledger =
    join(directory, 'host-lease.sqlite');

  const hostScopeId = 'a'.repeat(32);

  let now = 1_000_000;

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
    /*
     * First controller reserves ownership.
     * This MUST NOT imply provider execution.
     */
    const first =
      reserveFabricWorkerLease(
        store,
        request('worker-a'),
      );

    assert.equal(
      first.status,
      'RESERVED_NOT_STARTED',
    );

    assert.equal(
      first.ownershipReserved,
      true,
    );

    assert.equal(
      first.providerStarted,
      false,
    );

    assert.equal(
      first.productionAuthority,
      false,
    );

    assert.ok(first.handle);

    /*
     * Competing worker must not steal
     * the currently held lease.
     */
    const competing =
      reserveFabricWorkerLease(
        store,
        request('worker-b'),
      );

    assert.equal(
      competing.status,
      'BLOCKED',
    );

    assert.equal(
      competing.ownershipReserved,
      false,
    );

    assert.equal(
      competing.handle,
      null,
    );

    /*
     * Advance the deterministic test clock
     * while staying inside the lease TTL.
     */
    now += 1_000;

    const renewed =
      renewFabricWorkerLease(
        store,
        first.handle,
        10_000,
      );

    assert.ok(renewed);

    const renewedHandle = renewed as typeof first.handle;

    assert.ok(renewedHandle);
    assert.equal(
      renewedHandle.leaseId,
      first.handle.leaseId,
    );
    assert.equal(
      renewedHandle.tenantId,
      first.handle.tenantId,
    );
    assert.equal(
      renewedHandle.holderInstanceId,
      first.handle.holderInstanceId,
    );
    assert.equal(
      renewedHandle.revision,
      first.handle.revision + 1,
    );

    /*
     * The previous revision must immediately
     * become stale.
     */
    assert.throws(
      () =>
        renewFabricWorkerLease(
          store,
          first.handle!,
          10_000,
        ),
      /XVI_WORKER_LEASE_REFUSED/,
    );

    now += 1_000;

    const stopped =
      markFabricWorkerStopped(
        store,
        renewedHandle,
        true,
        'stop:test',
      );

    assert.ok(stopped);

    const stoppedHandle =
      stopped as typeof first.handle;

    assert.ok(stoppedHandle);
    assert.equal(
      stoppedHandle.leaseId,
      renewedHandle.leaseId,
    );
    assert.equal(
      stoppedHandle.revision,
      renewedHandle.revision + 1,
    );

    /*
     * Renewal handle is stale after settlement.
     */
    assert.throws(
      () =>
        renewFabricWorkerLease(
          store,
          renewedHandle!,
          10_000,
        ),
      /XVI_WORKER_LEASE_REFUSED/,
    );

    now += 1_000;

    const released =
      releaseFabricWorkerLease(
        store,
        stoppedHandle,
        'release:test',
      );

    assert.ok(released);

    const releasedHandle =
      released as typeof first.handle;

    assert.ok(releasedHandle);
    assert.equal(
      releasedHandle.leaseId,
      stoppedHandle.leaseId,
    );
    assert.equal(
      releasedHandle.revision,
      stoppedHandle.revision + 1,
    );

    /*
     * Settled ownership cannot be reused.
     */
    assert.throws(
      () =>
        releaseFabricWorkerLease(
          store,
          stoppedHandle!,
          'release:again',
        ),
      /XVI_WORKER_LEASE_REFUSED/,
    );

    /*
     * After confirmed release a new worker
     * may reserve the host resource.
     */
    now += 1_000;

    const next =
      reserveFabricWorkerLease(
        store,
        request('worker-b'),
      );

    assert.equal(
      next.status,
      'RESERVED_NOT_STARTED',
    );

    assert.equal(
      next.ownershipReserved,
      true,
    );

    assert.equal(
      next.providerStarted,
      false,
    );

    assert.equal(
      next.productionAuthority,
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
