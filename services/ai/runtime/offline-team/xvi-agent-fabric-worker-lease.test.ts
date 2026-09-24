import test from 'node:test';
import assert from 'node:assert/strict';

import {
  reserveFabricWorkerLease,
  XVI_WORKER_LEASE_GUARDRAILS,
  type FabricLeaseStore,
} from './xvi-agent-fabric-worker-lease';

import type {
  FabricReplayResult,
} from './xvi-agent-fabric-restart-replay';

function replay(
  state: FabricReplayResult['state'] = 'CHECKPOINTED',
): Readonly<FabricReplayResult> {
  return Object.freeze({
    version: 'xvi-agent-fabric-replay-v1',
    tenantId: 'tenant-a',
    missionId: 'mission-001',
    state,
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

function request(
  state: FabricReplayResult['state'] = 'CHECKPOINTED',
) {
  return {
    replay: replay(state),
    holderInstanceId: 'asus-worker-01',
    lane: 'HOMEBASE' as const,
    providerId: 'ollama-local',
    modelId: 'qwen2.5:3b',
    presenceEvidenceRef: 'presence:001',
    sourceCommit: 'a'.repeat(40),
    ttlMs: 10_000,
  };
}

function store(
  mode: 'RESERVED' | 'BLOCKED' = 'RESERVED',
): FabricLeaseStore {
  return {
    acquire(binding) {
      if (mode === 'BLOCKED') {
        return Object.freeze({
          status: 'BLOCKED' as const,
          decision: 'DENY_ACTIVE_LEASE',
          operatorReviewRequired: false,
          handle: null,
        });
      }

      return Object.freeze({
        status: 'RESERVED_NOT_STARTED' as const,
        decision: 'ALLOW_NO_EXISTING_LEASE',
        operatorReviewRequired: false as const,
        handle: Object.freeze({
          leaseId: 'lease-001',
          tenantId: binding.tenantId,
          holderInstanceId:
            binding.holderInstanceId,
          revision: 1,
          ownerSecret: 'f'.repeat(64),
        }),
      });
    },

    renew() {
      return {};
    },

    markStopped() {
      return {};
    },

    release() {
      return {};
    },
  };
}

test('lease reservation never claims provider start or production authority', () => {
  const result =
    reserveFabricWorkerLease(store(), request());

  assert.equal(
    XVI_WORKER_LEASE_GUARDRAILS.providerStartedByAcquire,
    false,
  );

  assert.equal(result.status, 'RESERVED_NOT_STARTED');
  assert.equal(result.ownershipReserved, true);
  assert.equal(result.providerStarted, false);
  assert.equal(result.productionAuthority, false);
  assert.equal(result.executesNothing, true);
});

test('blocked acquisition creates no ownership claim', () => {
  const result =
    reserveFabricWorkerLease(
      store('BLOCKED'),
      request(),
    );

  assert.equal(result.status, 'BLOCKED');
  assert.equal(result.ownershipReserved, false);
  assert.equal(result.handle, null);
});

test('terminal completed replay cannot acquire a worker lease', () => {
  assert.throws(
    () =>
      reserveFabricWorkerLease(
        store(),
        request('COMPLETED'),
      ),
    /XVI_WORKER_LEASE_REFUSED/,
  );
});

test('failed replay requires recovery decision before lease', () => {
  assert.throws(
    () =>
      reserveFabricWorkerLease(
        store(),
        request('FAILED'),
      ),
    /XVI_WORKER_LEASE_REFUSED/,
  );
});

test('lease binding derives tenant and work identity from verified replay', () => {
  let observed: unknown = null;

  const fake = store();

  const wrapped: FabricLeaseStore = {
    ...fake,
    acquire(binding) {
      observed = binding;
      return fake.acquire(binding);
    },
  };

  reserveFabricWorkerLease(
    wrapped,
    request(),
  );

  assert.deepEqual(observed, {
    tenantId: 'tenant-a',
    holderInstanceId: 'asus-worker-01',
    lane: 'HOMEBASE',
    workId: 'mission-001',
    providerId: 'ollama-local',
    modelId: 'qwen2.5:3b',
    presenceEvidenceRef: 'presence:001',
    sourceCommit: 'a'.repeat(40),
    ttlMs: 10_000,
  });
});

test('invalid lane and ttl fail closed', () => {
  assert.throws(
    () =>
      reserveFabricWorkerLease(
        store(),
        {
          ...request(),
          lane: 'REMOTE' as never,
        },
      ),
    /XVI_WORKER_LEASE_REFUSED/,
  );

  assert.throws(
    () =>
      reserveFabricWorkerLease(
        store(),
        {
          ...request(),
          ttlMs: 30_001,
        },
      ),
    /XVI_WORKER_LEASE_REFUSED/,
  );
});

test('undeclared request fields fail closed', () => {
  assert.throws(
    () =>
      reserveFabricWorkerLease(
        store(),
        {
          ...request(),
          operatorOverride: true,
        } as never,
      ),
    /XVI_WORKER_LEASE_REFUSED/,
  );
});

test('request accessors fail closed without invocation', () => {
  const input = request();
  let invoked = 0;

  Object.defineProperty(input, 'providerId', {
    enumerable: true,
    get() {
      invoked += 1;
      return 'ollama-local';
    },
  });

  assert.throws(
    () =>
      reserveFabricWorkerLease(
        store(),
        input,
      ),
    /XVI_WORKER_LEASE_REFUSED/,
  );

  assert.equal(invoked, 0);
});

test('mismatched store handle identity fails closed', () => {
  const fake: FabricLeaseStore = {
    ...store(),

    acquire() {
      return Object.freeze({
        status: 'RESERVED_NOT_STARTED' as const,
        decision: 'ALLOW_NO_EXISTING_LEASE',
        operatorReviewRequired: false as const,
        handle: Object.freeze({
          leaseId: 'lease-001',
          tenantId: 'tenant-b',
          holderInstanceId: 'asus-worker-01',
          revision: 1,
          ownerSecret: 'f'.repeat(64),
        }),
      });
    },
  };

  assert.throws(
    () =>
      reserveFabricWorkerLease(
        fake,
        request(),
      ),
    /XVI_WORKER_LEASE_REFUSED/,
  );
});

test('worker guardrails do not expose operator recovery', () => {
  assert.equal(
    XVI_WORKER_LEASE_GUARDRAILS
      .operatorRecoveryExposedToWorker,
    false,
  );

  assert.equal(
    XVI_WORKER_LEASE_GUARDRAILS
      .ownerSecretMayAppearInUi,
    false,
  );

  assert.equal(
    XVI_WORKER_LEASE_GUARDRAILS
      .ownerSecretMayAppearInPrompt,
    false,
  );

  assert.equal(
    XVI_WORKER_LEASE_GUARDRAILS
      .ownerSecretMayAppearInTelemetry,
    false,
  );
});

test('worker lease renews through the same private handle', async () => {
  const module =
    await import('./xvi-agent-fabric-worker-lease');

  let observedTtl: number | undefined;
  let observedSecret: string | undefined;

  const fake = store();

  const wrapped: FabricLeaseStore = {
    ...fake,
    renew(handle, ttlMs) {
      observedTtl = ttlMs;
      observedSecret = handle.ownerSecret;

      return Object.freeze({
        state: 'ACTIVE',
        revision: 2,
      });
    },
  };

  const reservation =
    reserveFabricWorkerLease(wrapped, request());

  assert.ok(reservation.handle);

  module.renewFabricWorkerLease(
    wrapped,
    reservation.handle,
    10_000,
  );

  assert.equal(observedTtl, 10_000);
  assert.equal(observedSecret, 'f'.repeat(64));
});

test('invalid renewal ttl fails closed before store call', async () => {
  const module =
    await import('./xvi-agent-fabric-worker-lease');

  let called = false;

  const fake: FabricLeaseStore = {
    ...store(),
    renew() {
      called = true;
      return {};
    },
  };

  const reservation =
    reserveFabricWorkerLease(fake, request());

  assert.ok(reservation.handle);

  assert.throws(
    () =>
      module.renewFabricWorkerLease(
        fake,
        reservation.handle!,
        30_001,
      ),
    /XVI_WORKER_LEASE_REFUSED/,
  );

  assert.equal(called, false);
});

test('unacknowledged stop cannot carry stop evidence', async () => {
  const module =
    await import('./xvi-agent-fabric-worker-lease');

  const fake = store();
  const reservation =
    reserveFabricWorkerLease(fake, request());

  assert.ok(reservation.handle);

  assert.throws(
    () =>
      module.markFabricWorkerStopped(
        fake,
        reservation.handle!,
        false,
        'stop:001',
      ),
    /XVI_WORKER_LEASE_REFUSED/,
  );
});

test('confirmed stop forwards bounded evidence', async () => {
  const module =
    await import('./xvi-agent-fabric-worker-lease');

  let observed:
    | {
        acknowledged: boolean;
        evidence?: string;
      }
    | undefined;

  const fake: FabricLeaseStore = {
    ...store(),

    markStopped(
      _handle,
      providerAcknowledged,
      stopEvidenceRef,
    ) {
      observed = {
        acknowledged: providerAcknowledged,
        ...(stopEvidenceRef === undefined
          ? {}
          : { evidence: stopEvidenceRef }),
      };

      return Object.freeze({
        state: 'STOPPED_CONFIRMED',
      });
    },
  };

  const reservation =
    reserveFabricWorkerLease(fake, request());

  assert.ok(reservation.handle);

  module.markFabricWorkerStopped(
    fake,
    reservation.handle!,
    true,
    'stop:001',
  );

  assert.deepEqual(observed, {
    acknowledged: true,
    evidence: 'stop:001',
  });
});

test('release requires bounded evidence', async () => {
  const module =
    await import('./xvi-agent-fabric-worker-lease');

  let called = false;

  const fake: FabricLeaseStore = {
    ...store(),

    release() {
      called = true;
      return Object.freeze({
        state: 'RELEASED',
      });
    },
  };

  const reservation =
    reserveFabricWorkerLease(fake, request());

  assert.ok(reservation.handle);

  assert.throws(
    () =>
      module.releaseFabricWorkerLease(
        fake,
        reservation.handle!,
        '',
      ),
    /XVI_WORKER_LEASE_REFUSED/,
  );

  assert.equal(called, false);

  module.releaseFabricWorkerLease(
    fake,
    reservation.handle!,
    'release:001',
  );

  assert.equal(called, true);
});

test('store ownership failures fail closed at worker boundary', async () => {
  const module =
    await import('./xvi-agent-fabric-worker-lease');

  const fake: FabricLeaseStore = {
    ...store(),

    renew() {
      throw new Error(
        'host lease ownership or revision mismatch',
      );
    },
  };

  const reservation =
    reserveFabricWorkerLease(fake, request());

  assert.ok(reservation.handle);

  assert.throws(
    () =>
      module.renewFabricWorkerLease(
        fake,
        reservation.handle!,
      ),
    /XVI_WORKER_LEASE_REFUSED/,
  );
});
