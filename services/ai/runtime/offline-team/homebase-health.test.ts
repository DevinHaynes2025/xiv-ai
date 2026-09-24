import test from 'node:test';
import assert from 'node:assert/strict';

import {
  buildHomebaseHealthSnapshot,
} from './homebase-health';

function evidence() {
  return {
    capturedAtMs: 1_790_000_000_000,

    supervisor: {
      state: 'RUNNING',
      pid: 5332,
      startedAt: '2026-09-20T19:56:38.898Z',
    },

    worker: {
      mode: 'RUNNING',
      pid: 25312,
      heartbeatMs: 1_790_188_944_728,
    },

    inference: {
      endpoint: '127.0.0.1:11435',
      model: 'qwen2.5:3b',
      inventoryObserved: true,
    },

    queue: {
      ready: 2,
      running: 0,
      awaitingReview: 5,
      failed: 0,
    },

    governance: {
      cloudDisabledRequested: true,
      automaticCodeApplication: false,
      modelWeightMutation: false,
      productionAuthority: false,
    },
  };
}

test('homebase health produces a frozen integrity-only snapshot', () => {
  const snapshot = buildHomebaseHealthSnapshot(evidence());

  assert.equal(snapshot.version, 'homebase-health-v1');
  assert.equal(snapshot.supervisor.state, 'RUNNING');
  assert.equal(snapshot.worker.mode, 'RUNNING');
  assert.equal(snapshot.queue.awaitingReview, 5);

  assert.equal(
    snapshot.receipt.verification,
    'HEALTH_SNAPSHOT_INTEGRITY_ONLY',
  );

  assert.match(snapshot.receipt.digest, /^[0-9a-f]{64}$/);

  assert.equal(Object.isFrozen(snapshot), true);
  assert.equal(Object.isFrozen(snapshot.supervisor), true);
  assert.equal(Object.isFrozen(snapshot.worker), true);
  assert.equal(Object.isFrozen(snapshot.inference), true);
  assert.equal(Object.isFrozen(snapshot.queue), true);
  assert.equal(Object.isFrozen(snapshot.governance), true);
  assert.equal(Object.isFrozen(snapshot.receipt), true);
});

test('homebase health never grants authority', () => {
  const snapshot = buildHomebaseHealthSnapshot(evidence());

  assert.equal(
    snapshot.governance.automaticCodeApplication,
    false,
  );

  assert.equal(
    snapshot.governance.modelWeightMutation,
    false,
  );

  assert.equal(
    snapshot.governance.productionAuthority,
    false,
  );
});

test('unknown evidence remains unknown rather than fabricated', () => {
  const input = evidence();

  input.supervisor.state = 'UNKNOWN';
  input.supervisor.pid = null;
  input.supervisor.startedAt = null;

  input.worker.mode = 'UNKNOWN';
  input.worker.pid = null;
  input.worker.heartbeatMs = null;

  input.inference.endpoint = null;
  input.inference.model = null;
  input.inference.inventoryObserved = false;

  input.queue.ready = null;
  input.queue.running = null;
  input.queue.awaitingReview = null;
  input.queue.failed = null;

  const snapshot = buildHomebaseHealthSnapshot(input);

  assert.equal(snapshot.supervisor.state, 'UNKNOWN');
  assert.equal(snapshot.supervisor.pid, null);
  assert.equal(snapshot.worker.mode, 'UNKNOWN');
  assert.equal(snapshot.worker.heartbeatMs, null);
  assert.equal(snapshot.inference.endpoint, null);
  assert.equal(snapshot.queue.ready, null);
});

test('authority escalation is refused', () => {
  for (const key of [
    'automaticCodeApplication',
    'modelWeightMutation',
    'productionAuthority',
  ] as const) {
    const input = evidence();
    input.governance[key] = true;

    assert.throws(
      () => buildHomebaseHealthSnapshot(input),
      /HOMEBASE_HEALTH_REFUSED/,
    );
  }
});

test('unexpected properties fail closed', () => {
  const input = evidence() as ReturnType<typeof evidence> & {
    secret?: string;
  };

  input.secret = 'unexpected';

  assert.throws(
    () => buildHomebaseHealthSnapshot(input),
    /HOMEBASE_HEALTH_REFUSED/,
  );
});

test('accessors fail closed without invocation', () => {
  const input = evidence();
  let invoked = 0;

  Object.defineProperty(input.worker, 'mode', {
    enumerable: true,
    get() {
      invoked++;
      return 'RUNNING';
    },
  });

  assert.throws(
    () => buildHomebaseHealthSnapshot(input),
    /HOMEBASE_HEALTH_REFUSED/,
  );

  assert.equal(invoked, 0);
});

test('untrusted endpoints and models are refused', () => {
  const endpoint = evidence();
  endpoint.inference.endpoint = '10.0.0.1:11435';

  assert.throws(
    () => buildHomebaseHealthSnapshot(endpoint),
    /HOMEBASE_HEALTH_REFUSED/,
  );

  const model = evidence();
  model.inference.model = 'remote:model';

  assert.throws(
    () => buildHomebaseHealthSnapshot(model),
    /HOMEBASE_HEALTH_REFUSED/,
  );
});

test('hidden and symbol properties fail closed', () => {
  const hidden = evidence();

  Object.defineProperty(hidden.worker, 'hidden', {
    value: 'shadow',
    enumerable: false,
  });

  assert.throws(
    () => buildHomebaseHealthSnapshot(hidden),
    /HOMEBASE_HEALTH_REFUSED/,
  );

  const symbolic = evidence();
  Object.defineProperty(symbolic.queue, Symbol('shadow'), {
    value: 1,
    enumerable: true,
  });

  assert.throws(
    () => buildHomebaseHealthSnapshot(symbolic),
    /HOMEBASE_HEALTH_REFUSED/,
  );
});

test('non-plain nested prototypes fail closed', () => {
  const input = evidence();

  Object.setPrototypeOf(input.supervisor, {
    inherited: true,
  });

  assert.throws(
    () => buildHomebaseHealthSnapshot(input),
    /HOMEBASE_HEALTH_REFUSED/,
  );
});

test('unsafe numeric evidence is refused', () => {
  for (const value of [
    -1,
    Number.MAX_SAFE_INTEGER + 1,
    Number.NaN,
    Number.POSITIVE_INFINITY,
    1.5,
  ]) {
    const input = evidence();
    input.queue.ready = value;

    assert.throws(
      () => buildHomebaseHealthSnapshot(input),
      /HOMEBASE_HEALTH_REFUSED/,
    );
  }

  const pid = evidence();
  pid.worker.pid = 4_194_305;

  assert.throws(
    () => buildHomebaseHealthSnapshot(pid),
    /HOMEBASE_HEALTH_REFUSED/,
  );
});

test('malformed timestamps fail closed', () => {
  for (const startedAt of [
    '',
    'yesterday',
    '2026-99-99T99:99:99Z',
    '2026-09-20',
    '2026-09-20T19:56:38+00:00',
  ]) {
    const input = evidence();
    input.supervisor.startedAt = startedAt;

    assert.throws(
      () => buildHomebaseHealthSnapshot(input),
      /HOMEBASE_HEALTH_REFUSED/,
    );
  }
});

test('snapshot is detached from later evidence mutation', () => {
  const input = evidence();
  const snapshot = buildHomebaseHealthSnapshot(input);

  input.supervisor.state = 'STOPPED';
  input.worker.mode = 'PAUSED';
  input.queue.awaitingReview = 999;

  assert.equal(snapshot.supervisor.state, 'RUNNING');
  assert.equal(snapshot.worker.mode, 'RUNNING');
  assert.equal(snapshot.queue.awaitingReview, 5);
});

test('identical evidence produces an identical receipt', () => {
  const a = buildHomebaseHealthSnapshot(evidence());
  const b = buildHomebaseHealthSnapshot(evidence());

  assert.equal(a.receipt.digest, b.receipt.digest);
});

test('changing admitted evidence changes the receipt', () => {
  const a = buildHomebaseHealthSnapshot(evidence());

  const input = evidence();
  input.queue.awaitingReview = 6;

  const b = buildHomebaseHealthSnapshot(input);

  assert.notEqual(a.receipt.digest, b.receipt.digest);
});

test('contradictory inference evidence is refused', () => {
  const missingObservation = evidence();
  missingObservation.inference.inventoryObserved = false;

  assert.throws(
    () => buildHomebaseHealthSnapshot(missingObservation),
    /HOMEBASE_HEALTH_REFUSED/,
  );

  const endpointWithoutModel = evidence();
  endpointWithoutModel.inference.model = null;

  assert.throws(
    () => buildHomebaseHealthSnapshot(endpointWithoutModel),
    /HOMEBASE_HEALTH_REFUSED/,
  );

  const modelWithoutEndpoint = evidence();
  modelWithoutEndpoint.inference.endpoint = null;

  assert.throws(
    () => buildHomebaseHealthSnapshot(modelWithoutEndpoint),
    /HOMEBASE_HEALTH_REFUSED/,
  );
});

test('contradictory supervisor and worker identity is refused', () => {
  const stoppedSupervisor = evidence();
  stoppedSupervisor.supervisor.state = 'STOPPED';

  assert.throws(
    () => buildHomebaseHealthSnapshot(stoppedSupervisor),
    /HOMEBASE_HEALTH_REFUSED/,
  );

  const stoppedWorker = evidence();
  stoppedWorker.worker.mode = 'STOPPED';

  assert.throws(
    () => buildHomebaseHealthSnapshot(stoppedWorker),
    /HOMEBASE_HEALTH_REFUSED/,
  );
});

test('inference semantic matrix is exact', () => {
  const observed = evidence();
  assert.doesNotThrow(() => buildHomebaseHealthSnapshot(observed));

  const unknown = evidence();
  unknown.inference.inventoryObserved = false;
  unknown.inference.endpoint = null;
  unknown.inference.model = null;
  assert.doesNotThrow(() => buildHomebaseHealthSnapshot(unknown));

  const cases = [
    (() => {
      const x = evidence();
      x.inference.inventoryObserved = true;
      x.inference.model = null;
      return x;
    })(),
    (() => {
      const x = evidence();
      x.inference.inventoryObserved = true;
      x.inference.endpoint = null;
      return x;
    })(),
    (() => {
      const x = evidence();
      x.inference.inventoryObserved = false;
      x.inference.model = 'qwen2.5:3b';
      return x;
    })(),
    (() => {
      const x = evidence();
      x.inference.inventoryObserved = false;
      x.inference.endpoint = '127.0.0.1:11435';
      return x;
    })(),
  ];

  for (const input of cases) {
    assert.throws(
      () => buildHomebaseHealthSnapshot(input),
      /HOMEBASE_HEALTH_REFUSED/,
    );
  }
});

test('supervisor semantic matrix is exact', () => {
  const running = evidence();
  assert.doesNotThrow(() => buildHomebaseHealthSnapshot(running));

  const stopped = evidence();
  stopped.supervisor.state = 'STOPPED';
  stopped.supervisor.pid = null;
  assert.doesNotThrow(() => buildHomebaseHealthSnapshot(stopped));

  const unknown = evidence();
  unknown.supervisor.state = 'UNKNOWN';
  unknown.supervisor.pid = null;
  unknown.supervisor.startedAt = null;
  assert.doesNotThrow(() => buildHomebaseHealthSnapshot(unknown));

  const invalid = [
    (() => {
      const x = evidence();
      x.supervisor.state = 'RUNNING';
      x.supervisor.pid = null;
      return x;
    })(),
    (() => {
      const x = evidence();
      x.supervisor.state = 'STOPPED';
      return x;
    })(),
    (() => {
      const x = evidence();
      x.supervisor.state = 'UNKNOWN';
      return x;
    })(),
  ];

  for (const input of invalid) {
    assert.throws(
      () => buildHomebaseHealthSnapshot(input),
      /HOMEBASE_HEALTH_REFUSED/,
    );
  }
});

test('worker semantic matrix is exact', () => {
  const running = evidence();
  assert.doesNotThrow(() => buildHomebaseHealthSnapshot(running));

  const paused = evidence();
  paused.worker.mode = 'PAUSED';
  assert.doesNotThrow(() => buildHomebaseHealthSnapshot(paused));

  const stopped = evidence();
  stopped.worker.mode = 'STOPPED';
  stopped.worker.pid = null;
  stopped.worker.heartbeatMs = null;
  assert.doesNotThrow(() => buildHomebaseHealthSnapshot(stopped));

  const unknown = evidence();
  unknown.worker.mode = 'UNKNOWN';
  unknown.worker.pid = null;
  unknown.worker.heartbeatMs = null;
  assert.doesNotThrow(() => buildHomebaseHealthSnapshot(unknown));

  const invalid = [
    (() => {
      const x = evidence();
      x.worker.mode = 'RUNNING';
      x.worker.pid = null;
      return x;
    })(),
    (() => {
      const x = evidence();
      x.worker.mode = 'STOPPED';
      return x;
    })(),
    (() => {
      const x = evidence();
      x.worker.mode = 'UNKNOWN';
      x.worker.pid = null;
      return x;
    })(),
  ];

  for (const input of invalid) {
    assert.throws(
      () => buildHomebaseHealthSnapshot(input),
      /HOMEBASE_HEALTH_REFUSED/,
    );
  }
});
