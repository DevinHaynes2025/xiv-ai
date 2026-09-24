import test from 'node:test';
import assert from 'node:assert/strict';

import {
  createFabricHeartbeatController,
  markFabricWorkerRunning,
  heartbeatFabricWorker,
  beginFabricCheckpoint,
  finishFabricCheckpoint,
  XVI_HEARTBEAT_GUARDRAILS,
} from './xvi-agent-fabric-heartbeat';

import type {
  HostLeaseHandle,
} from './shared-host-lease-store';

import type {
  FabricLeaseStore,
} from './xvi-agent-fabric-worker-lease';

function handle(
  revision = 1,
): HostLeaseHandle {
  return {
    leaseId: 'lease-001',
    tenantId: 'tenant-a',
    holderInstanceId: 'worker-a',
    revision,
    ownerSecret: 'f'.repeat(64),
  };
}

function store(): FabricLeaseStore {
  return {
    acquire() {
      throw new Error('not used');
    },

    renew(current) {
      return {
        ...current,
        revision: current.revision + 1,
      };
    },

    markStopped() {
      throw new Error('not used');
    },

    release() {
      throw new Error('not used');
    },
  };
}

function controller() {
  return createFabricHeartbeatController(
    'tenant-a',
    'mission-001',
    'worker-a',
    handle(),
  );
}

test('reservation is not running', () => {
  const c = controller();

  assert.equal(c.state, 'RESERVED');
  assert.equal(c.sequence, 0);
  assert.equal(c.lastHeartbeatMs, null);

  assert.throws(
    () =>
      heartbeatFabricWorker(
        store(),
        c,
        1_000,
      ),
    /XVI_HEARTBEAT_REFUSED/,
  );
});

test('explicit running transition enables heartbeat', () => {
  const c = controller();

  markFabricWorkerRunning(c);

  const receipt =
    heartbeatFabricWorker(
      store(),
      c,
      1_000,
    );

  assert.equal(c.state, 'RUNNING');
  assert.equal(c.sequence, 1);
  assert.equal(c.lastHeartbeatMs, 1_000);
  assert.equal(c.handle.revision, 2);

  assert.equal(receipt.sequence, 1);
  assert.equal(receipt.ownershipVerified, true);
  assert.equal(receipt.productionAuthority, false);
  assert.equal(receipt.providerCalls, 0);
});

test('heartbeat timestamps must increase strictly', () => {
  const c = controller();

  markFabricWorkerRunning(c);

  heartbeatFabricWorker(
    store(),
    c,
    1_000,
  );

  assert.throws(
    () =>
      heartbeatFabricWorker(
        store(),
        c,
        1_000,
      ),
    /XVI_HEARTBEAT_REFUSED/,
  );

  assert.throws(
    () =>
      heartbeatFabricWorker(
        store(),
        c,
        999,
      ),
    /XVI_HEARTBEAT_REFUSED/,
  );

  assert.equal(c.sequence, 1);
});

test('unsafe heartbeat clocks fail closed before renewal', () => {
  for (const value of [
    -1,
    1.5,
    Number.MAX_SAFE_INTEGER + 1,
    Number.NaN,
    Number.POSITIVE_INFINITY,
  ]) {
    const c = controller();
    markFabricWorkerRunning(c);

    let renewed = false;

    const fake: FabricLeaseStore = {
      ...store(),
      renew() {
        renewed = true;
        return handle(2);
      },
    };

    assert.throws(
      () =>
        heartbeatFabricWorker(
          fake,
          c,
          value,
        ),
      /XVI_HEARTBEAT_REFUSED/,
    );

    assert.equal(renewed, false);
  }
});

test('renewal failure permanently loses execution claim', () => {
  const c = controller();

  markFabricWorkerRunning(c);

  const failing: FabricLeaseStore = {
    ...store(),

    renew() {
      throw new Error(
        'host lease ownership or revision mismatch',
      );
    },
  };

  assert.throws(
    () =>
      heartbeatFabricWorker(
        failing,
        c,
        1_000,
      ),
    /XVI_HEARTBEAT_REFUSED/,
  );

  assert.equal(
    c.state,
    'OWNERSHIP_LOST',
  );

  assert.equal(c.sequence, 0);
  assert.equal(c.lastHeartbeatMs, null);

  assert.throws(
    () =>
      heartbeatFabricWorker(
        store(),
        c,
        2_000,
      ),
    /XVI_HEARTBEAT_REFUSED/,
  );
});

test('forged next revision loses ownership', () => {
  const c = controller();

  markFabricWorkerRunning(c);

  const forged: FabricLeaseStore = {
    ...store(),

    renew(current) {
      return {
        ...current,
        revision: current.revision + 2,
      };
    },
  };

  assert.throws(
    () =>
      heartbeatFabricWorker(
        forged,
        c,
        1_000,
      ),
    /XVI_HEARTBEAT_REFUSED/,
  );

  assert.equal(
    c.state,
    'OWNERSHIP_LOST',
  );
});

test('cross-tenant and cross-holder handles are refused', () => {
  assert.throws(
    () =>
      createFabricHeartbeatController(
        'tenant-a',
        'mission-001',
        'worker-a',
        {
          ...handle(),
          tenantId: 'tenant-b',
        },
      ),
    /XVI_HEARTBEAT_REFUSED/,
  );

  assert.throws(
    () =>
      createFabricHeartbeatController(
        'tenant-a',
        'mission-001',
        'worker-a',
        {
          ...handle(),
          holderInstanceId: 'worker-b',
        },
      ),
    /XVI_HEARTBEAT_REFUSED/,
  );
});

test('checkpoint state may retain heartbeat ownership', () => {
  const c = controller();

  markFabricWorkerRunning(c);
  beginFabricCheckpoint(c);

  assert.equal(
    c.state,
    'CHECKPOINTING',
  );

  const receipt =
    heartbeatFabricWorker(
      store(),
      c,
      1_000,
    );

  assert.equal(
    receipt.state,
    'CHECKPOINTING',
  );

  finishFabricCheckpoint(c);

  assert.equal(c.state, 'RUNNING');
});

test('illegal state transitions fail closed', () => {
  const c = controller();

  assert.throws(
    () => beginFabricCheckpoint(c),
    /XVI_HEARTBEAT_REFUSED/,
  );

  assert.throws(
    () => finishFabricCheckpoint(c),
    /XVI_HEARTBEAT_REFUSED/,
  );

  markFabricWorkerRunning(c);

  assert.throws(
    () => markFabricWorkerRunning(c),
    /XVI_HEARTBEAT_REFUSED/,
  );
});

test('heartbeat receipt contains no bearer secret', () => {
  const c = controller();

  markFabricWorkerRunning(c);

  const receipt =
    heartbeatFabricWorker(
      store(),
      c,
      1_000,
    );

  const serialized =
    JSON.stringify(receipt);

  assert.equal(
    serialized.includes('ownerSecret'),
    false,
  );

  assert.equal(
    serialized.includes('f'.repeat(64)),
    false,
  );

  assert.equal(
    receipt.secretMaterialIncluded,
    false,
  );
});

test('heartbeat guardrails carry zero execution authority', () => {
  assert.equal(
    XVI_HEARTBEAT_GUARDRAILS.productionAuthority,
    false,
  );

  assert.equal(
    XVI_HEARTBEAT_GUARDRAILS.providerCalls,
    0,
  );

  assert.equal(
    XVI_HEARTBEAT_GUARDRAILS
      .optimisticExecutionAfterLeaseFailure,
    false,
  );

  assert.equal(
    XVI_HEARTBEAT_GUARDRAILS
      .ownerSecretMayAppearInReceipt,
    false,
  );
});

test('malformed lease handle primitives fail closed', () => {
  const variants = [
    { ...handle(), leaseId: '' },
    { ...handle(), tenantId: '' },
    { ...handle(), holderInstanceId: '' },
    { ...handle(), revision: 0 },
    { ...handle(), revision: -1 },
    { ...handle(), revision: 1.5 },
    { ...handle(), ownerSecret: '' },
    { ...handle(), ownerSecret: 'x'.repeat(64) },
  ];

  for (const candidate of variants) {
    assert.throws(
      () =>
        createFabricHeartbeatController(
          'tenant-a',
          'mission-001',
          'worker-a',
          candidate as HostLeaseHandle,
        ),
      /XVI_HEARTBEAT_REFUSED/,
    );
  }
});

test('lease handle accessors fail closed without invocation', () => {
  const candidate = handle();

  let invoked = 0;

  Object.defineProperty(candidate, 'tenantId', {
    enumerable: true,
    get() {
      invoked += 1;
      return 'tenant-a';
    },
  });

  assert.throws(
    () =>
      createFabricHeartbeatController(
        'tenant-a',
        'mission-001',
        'worker-a',
        candidate,
      ),
    /XVI_HEARTBEAT_REFUSED/,
  );

  assert.equal(invoked, 0);
});

test('lease handle undeclared hidden symbol and inherited state fail closed', () => {
  const hidden = handle();

  Object.defineProperty(
    hidden,
    'operatorOverride',
    {
      value: true,
      enumerable: false,
    },
  );

  assert.throws(
    () =>
      createFabricHeartbeatController(
        'tenant-a',
        'mission-001',
        'worker-a',
        hidden,
      ),
    /XVI_HEARTBEAT_REFUSED/,
  );

  const symbol = handle();

  Object.defineProperty(
    symbol,
    Symbol('authority'),
    {
      value: true,
      enumerable: true,
    },
  );

  assert.throws(
    () =>
      createFabricHeartbeatController(
        'tenant-a',
        'mission-001',
        'worker-a',
        symbol,
      ),
    /XVI_HEARTBEAT_REFUSED/,
  );

  const inherited =
    Object.assign(
      Object.create({
        operatorOverride: true,
      }),
      handle(),
    );

  assert.throws(
    () =>
      createFabricHeartbeatController(
        'tenant-a',
        'mission-001',
        'worker-a',
        inherited,
      ),
    /XVI_HEARTBEAT_REFUSED/,
  );
});

test('controller owns a detached lease handle copy', () => {
  const original = handle();

  const c =
    createFabricHeartbeatController(
      'tenant-a',
      'mission-001',
      'worker-a',
      original,
    );

  original.revision = 999;
  original.tenantId = 'tenant-b';
  original.ownerSecret = 'a'.repeat(64);

  assert.equal(c.handle.revision, 1);
  assert.equal(c.handle.tenantId, 'tenant-a');
  assert.equal(
    c.handle.ownerSecret,
    'f'.repeat(64),
  );
});

test('heartbeat receipt is detached from later controller mutation', () => {
  const c = controller();

  markFabricWorkerRunning(c);

  const receipt =
    heartbeatFabricWorker(
      store(),
      c,
      1_000,
    );

  c.sequence = 999;
  c.lastHeartbeatMs = 999_999;
  c.state = 'OWNERSHIP_LOST';

  assert.equal(receipt.sequence, 1);
  assert.equal(receipt.heartbeatAtMs, 1_000);
  assert.equal(receipt.state, 'RUNNING');
});

test('receipt exposes no lease identifiers or bearer material', () => {
  const c = controller();

  markFabricWorkerRunning(c);

  const receipt =
    heartbeatFabricWorker(
      store(),
      c,
      1_000,
    );

  const keys = Reflect.ownKeys(receipt);

  assert.equal(
    keys.includes('ownerSecret'),
    false,
  );

  assert.equal(
    keys.includes('handle'),
    false,
  );

  assert.equal(
    keys.includes('leaseId'),
    false,
  );

  assert.equal(
    keys.includes('revision'),
    false,
  );
});
