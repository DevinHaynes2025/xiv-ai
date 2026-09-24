import test from 'node:test';
import assert from 'node:assert/strict';

import {
  XviFabricRuntimeStream,
  XVI_RUNTIME_STREAM_GUARDRAILS,
} from './xvi-agent-fabric-runtime-stream';

function stream() {
  return new XviFabricRuntimeStream(
    'tenant-a',
    'mission-001',
  );
}

function append(
  target: XviFabricRuntimeStream,
  sequence: number,
  kind:
    | 'MISSION_STARTED'
    | 'TICK_STARTED'
    | 'WORK_STARTED'
    | 'WORK_COMPLETED'
    | 'CHECKPOINT_STARTED'
    | 'CHECKPOINT_COMPLETED'
    | 'HEARTBEAT_RENEWED'
    | 'FAILURE_RECORDED'
    | 'OWNERSHIP_LOST'
    | 'REVIEW_REQUIRED'
    | 'MISSION_STOPPED',
  occurredAtMs = sequence * 1_000,
) {
  return target.append({
    tenantId: 'tenant-a',
    missionId: 'mission-001',
    sequence,
    occurredAtMs,
    kind,
  });
}

test('stream begins only with mission started', () => {
  const target = stream();

  assert.throws(
    () =>
      append(
        target,
        1,
        'TICK_STARTED',
      ),
    /XVI_RUNTIME_STREAM_REFUSED/,
  );

  append(
    target,
    1,
    'MISSION_STARTED',
  );

  assert.equal(
    target.snapshot().status,
    'PREPARING',
  );
});

test('stream requires strict contiguous sequence', () => {
  const target = stream();

  append(target, 1, 'MISSION_STARTED');

  assert.throws(
    () =>
      append(
        target,
        3,
        'TICK_STARTED',
      ),
    /XVI_RUNTIME_STREAM_REFUSED/,
  );

  assert.throws(
    () =>
      append(
        target,
        1,
        'TICK_STARTED',
      ),
    /XVI_RUNTIME_STREAM_REFUSED/,
  );
});

test('stream refuses clock regression', () => {
  const target = stream();

  append(
    target,
    1,
    'MISSION_STARTED',
    2_000,
  );

  assert.throws(
    () =>
      append(
        target,
        2,
        'TICK_STARTED',
        1_999,
      ),
    /XVI_RUNTIME_STREAM_REFUSED/,
  );
});

test('cross tenant and mission events fail closed', () => {
  const target = stream();

  append(target, 1, 'MISSION_STARTED');

  assert.throws(
    () =>
      target.append({
        tenantId: 'tenant-b',
        missionId: 'mission-001',
        sequence: 2,
        occurredAtMs: 2_000,
        kind: 'TICK_STARTED',
      }),
    /XVI_RUNTIME_STREAM_REFUSED/,
  );

  assert.throws(
    () =>
      target.append({
        tenantId: 'tenant-a',
        missionId: 'mission-evil',
        sequence: 2,
        occurredAtMs: 2_000,
        kind: 'TICK_STARTED',
      }),
    /XVI_RUNTIME_STREAM_REFUSED/,
  );
});

test('legal work lifecycle projects deterministic mobile state', () => {
  const target = stream();

  append(target, 1, 'MISSION_STARTED');
  append(target, 2, 'TICK_STARTED');
  append(target, 3, 'WORK_STARTED');
  append(target, 4, 'WORK_COMPLETED');
  append(target, 5, 'CHECKPOINT_STARTED');
  append(target, 6, 'CHECKPOINT_COMPLETED');
  append(target, 7, 'HEARTBEAT_RENEWED');

  const snapshot =
    target.snapshot();

  assert.equal(snapshot.sequence, 7);
  assert.equal(snapshot.eventCount, 7);
  assert.equal(
    snapshot.lastEvent,
    'HEARTBEAT_RENEWED',
  );
  assert.equal(snapshot.status, 'HEALTHY');

  assert.equal(
    snapshot.productionAuthority,
    false,
  );

  assert.equal(
    snapshot.secretMaterialIncluded,
    false,
  );
});

test('illegal lifecycle transition fails closed', () => {
  const target = stream();

  append(target, 1, 'MISSION_STARTED');

  assert.throws(
    () =>
      append(
        target,
        2,
        'WORK_COMPLETED',
      ),
    /XVI_RUNTIME_STREAM_REFUSED/,
  );
});

test('ownership loss cannot return directly to work', () => {
  const target = stream();

  append(target, 1, 'MISSION_STARTED');
  append(target, 2, 'TICK_STARTED');
  append(target, 3, 'OWNERSHIP_LOST');

  assert.throws(
    () =>
      append(
        target,
        4,
        'WORK_STARTED',
      ),
    /XVI_RUNTIME_STREAM_REFUSED/,
  );

  append(
    target,
    4,
    'REVIEW_REQUIRED',
  );

  assert.equal(
    target.snapshot().status,
    'NEEDS_REVIEW',
  );
});

test('stopped mission is terminal', () => {
  const target = stream();

  append(target, 1, 'MISSION_STARTED');
  append(target, 2, 'MISSION_STOPPED');

  assert.throws(
    () =>
      append(
        target,
        3,
        'TICK_STARTED',
      ),
    /XVI_RUNTIME_STREAM_REFUSED/,
  );

  assert.equal(
    target.snapshot().status,
    'STOPPED',
  );
});

test('returned event history is detached', () => {
  const target = stream();

  append(target, 1, 'MISSION_STARTED');

  const history =
    target.events();

  assert.equal(
    Object.isFrozen(history),
    true,
  );

  assert.equal(history.length, 1);

  assert.throws(
    () =>
      (
        history as
          Readonly<unknown>[]
      ).push({}),
  );
});

test('empty stream cannot manufacture snapshot', () => {
  assert.throws(
    () =>
      stream().snapshot(),
    /XVI_RUNTIME_STREAM_REFUSED/,
  );
});

test('stream projection carries zero authority', () => {
  assert.equal(
    XVI_RUNTIME_STREAM_GUARDRAILS
      .productionAuthority,
    false,
  );

  assert.equal(
    XVI_RUNTIME_STREAM_GUARDRAILS
      .providerCalls,
    0,
  );

  assert.equal(
    XVI_RUNTIME_STREAM_GUARDRAILS
      .processSpawns,
    0,
  );

  assert.equal(
    XVI_RUNTIME_STREAM_GUARDRAILS
      .automaticExecution,
    false,
  );
});

test('failed append is atomic and does not advance stream', () => {
  const target = stream();

  append(target, 1, 'MISSION_STARTED');

  const before = target.snapshot();

  assert.throws(
    () =>
      append(
        target,
        3,
        'TICK_STARTED',
      ),
    /XVI_RUNTIME_STREAM_REFUSED/,
  );

  const after = target.snapshot();

  assert.deepEqual(after, before);
  assert.equal(target.events().length, 1);

  append(target, 2, 'TICK_STARTED');

  assert.equal(
    target.snapshot().sequence,
    2,
  );
});

test('failed cross mission append does not poison next legal append', () => {
  const target = stream();

  append(target, 1, 'MISSION_STARTED');

  assert.throws(
    () =>
      target.append({
        tenantId: 'tenant-a',
        missionId: 'mission-evil',
        sequence: 2,
        occurredAtMs: 2_000,
        kind: 'TICK_STARTED',
      }),
    /XVI_RUNTIME_STREAM_REFUSED/,
  );

  append(target, 2, 'TICK_STARTED');

  assert.equal(
    target.snapshot().eventCount,
    2,
  );
});

test('event sequence overflow fails closed atomically', () => {
  const target = stream();

  target.append({
    tenantId: 'tenant-a',
    missionId: 'mission-001',
    sequence: 1,
    occurredAtMs: 1_000,
    kind: 'MISSION_STARTED',
  });

  const source = {
    tenantId: 'tenant-a',
    missionId: 'mission-001',
    sequence: Number.MAX_SAFE_INTEGER + 1,
    occurredAtMs: 2_000,
    kind: 'TICK_STARTED',
  } as never;

  assert.throws(
    () => target.append(source),
    /XVI_RUNTIME_EVENT_REFUSED/,
  );

  assert.equal(
    target.snapshot().sequence,
    1,
  );
});

test('duplicate terminal event fails closed', () => {
  const target = stream();

  append(target, 1, 'MISSION_STARTED');
  append(target, 2, 'MISSION_STOPPED');

  assert.throws(
    () =>
      append(
        target,
        3,
        'MISSION_STOPPED',
      ),
    /XVI_RUNTIME_STREAM_REFUSED/,
  );

  assert.equal(
    target.snapshot().eventCount,
    2,
  );
});

test('event input accessor fails before stream mutation', () => {
  const target = stream();

  append(target, 1, 'MISSION_STARTED');

  let invoked = 0;

  const candidate = {
    tenantId: 'tenant-a',
    missionId: 'mission-001',
    sequence: 2,
    occurredAtMs: 2_000,
    kind: 'TICK_STARTED',
  };

  Object.defineProperty(
    candidate,
    'sequence',
    {
      enumerable: true,
      get() {
        invoked += 1;
        return 2;
      },
    },
  );

  assert.throws(
    () =>
      target.append(candidate as never),
    /XVI_RUNTIME_EVENT_REFUSED/,
  );

  assert.equal(invoked, 0);
  assert.equal(
    target.snapshot().eventCount,
    1,
  );
});

test('malicious event prototype fails before stream mutation', () => {
  const target = stream();

  append(target, 1, 'MISSION_STARTED');

  const candidate =
    Object.create({
      productionAuthority: true,
    });

  Object.assign(candidate, {
    tenantId: 'tenant-a',
    missionId: 'mission-001',
    sequence: 2,
    occurredAtMs: 2_000,
    kind: 'TICK_STARTED',
  });

  assert.throws(
    () =>
      target.append(candidate),
    /XVI_RUNTIME_EVENT_REFUSED/,
  );

  assert.equal(
    target.snapshot().eventCount,
    1,
  );
});

test('snapshot is immutable and detached', () => {
  const target = stream();

  append(target, 1, 'MISSION_STARTED');

  const snapshot =
    target.snapshot();

  assert.equal(
    Object.isFrozen(snapshot),
    true,
  );

  assert.throws(
    () => {
      (
        snapshot as {
          sequence: number;
        }
      ).sequence = 999;
    },
    TypeError,
  );

  assert.equal(
    target.snapshot().sequence,
    1,
  );
});

test('history cannot mutate admitted event objects', () => {
  const target = stream();

  append(target, 1, 'MISSION_STARTED');

  const history =
    target.events();

  assert.equal(
    Object.isFrozen(history[0]),
    true,
  );

  assert.throws(
    () => {
      (
        history[0] as {
          missionId: string;
        }
      ).missionId = 'mission-evil';
    },
    TypeError,
  );

  assert.equal(
    target.snapshot().missionId,
    'mission-001',
  );
});

test('same timestamp is allowed but clock regression is not', () => {
  const target = stream();

  append(
    target,
    1,
    'MISSION_STARTED',
    1_000,
  );

  append(
    target,
    2,
    'TICK_STARTED',
    1_000,
  );

  assert.equal(
    target.snapshot().occurredAtMs,
    1_000,
  );

  assert.throws(
    () =>
      append(
        target,
        3,
        'WORK_STARTED',
        999,
      ),
    /XVI_RUNTIME_STREAM_REFUSED/,
  );
});

test('review required cannot silently resume execution', () => {
  const target = stream();

  append(target, 1, 'MISSION_STARTED');
  append(target, 2, 'REVIEW_REQUIRED');

  assert.throws(
    () =>
      append(
        target,
        3,
        'TICK_STARTED',
      ),
    /XVI_RUNTIME_STREAM_REFUSED/,
  );

  assert.equal(
    target.snapshot().status,
    'NEEDS_REVIEW',
  );
});

test('serialized snapshot exposes no controller secret material', () => {
  const target = stream();

  append(target, 1, 'MISSION_STARTED');
  append(target, 2, 'TICK_STARTED');
  append(target, 3, 'WORK_STARTED');

  const serialized =
    JSON.stringify(
      target.snapshot(),
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
