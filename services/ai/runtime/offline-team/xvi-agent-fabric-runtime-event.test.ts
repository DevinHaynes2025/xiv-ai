import test from 'node:test';
import assert from 'node:assert/strict';

import {
  createFabricRuntimeEvent,
  XVI_RUNTIME_EVENT_GUARDRAILS,
  type FabricRuntimeEventInput,
} from './xvi-agent-fabric-runtime-event';

function input(
  overrides: Partial<FabricRuntimeEventInput> = {},
): FabricRuntimeEventInput {
  return {
    tenantId: 'tenant-a',
    missionId: 'mission-001',
    sequence: 1,
    occurredAtMs: 1_000,
    kind: 'MISSION_STARTED',
    ...overrides,
  };
}

test('runtime event carries zero execution authority', () => {
  const event =
    createFabricRuntimeEvent(input());

  assert.equal(event.providerCalls, 0);
  assert.equal(event.processSpawns, 0);
  assert.equal(event.productionAuthority, false);
  assert.equal(event.secretMaterialIncluded, false);

  assert.equal(
    XVI_RUNTIME_EVENT_GUARDRAILS.networkWrites,
    0,
  );

  assert.equal(
    XVI_RUNTIME_EVENT_GUARDRAILS.persistentWrites,
    0,
  );
});

test('runtime status projection is deterministic', () => {
  const expected = {
    MISSION_STARTED: 'PREPARING',
    TICK_STARTED: 'WORKING',
    WORK_STARTED: 'WORKING',
    WORK_COMPLETED: 'HEALTHY',
    CHECKPOINT_STARTED: 'SAVING',
    CHECKPOINT_COMPLETED: 'HEALTHY',
    HEARTBEAT_RENEWED: 'HEALTHY',
    FAILURE_RECORDED: 'DEGRADED',
    OWNERSHIP_LOST: 'RECOVERING',
    REVIEW_REQUIRED: 'NEEDS_REVIEW',
    MISSION_STOPPED: 'STOPPED',
  } as const;

  let sequence = 1;

  for (
    const [kind, status] of
    Object.entries(expected)
  ) {
    const event =
      createFabricRuntimeEvent(
        input({
          sequence,
          kind:
            kind as FabricRuntimeEventInput['kind'],
        }),
      );

    assert.equal(event.kind, kind);
    assert.equal(event.status, status);

    sequence += 1;
  }
});

test('runtime event is detached from caller mutation', () => {
  const source = input();

  const event =
    createFabricRuntimeEvent(source);

  source.tenantId = 'tenant-b';
  source.missionId = 'mission-evil';
  source.sequence = 999;
  source.kind = 'OWNERSHIP_LOST';

  assert.equal(event.tenantId, 'tenant-a');
  assert.equal(event.missionId, 'mission-001');
  assert.equal(event.sequence, 1);
  assert.equal(event.kind, 'MISSION_STARTED');
  assert.equal(event.status, 'PREPARING');

  assert.equal(Object.isFrozen(event), true);
});

test('undeclared fields fail closed', () => {
  assert.throws(
    () =>
      createFabricRuntimeEvent({
        ...input(),
        ownerSecret: 'f'.repeat(64),
      } as never),
    /XVI_RUNTIME_EVENT_REFUSED/,
  );

  assert.throws(
    () =>
      createFabricRuntimeEvent({
        ...input(),
        operatorOverride: true,
      } as never),
    /XVI_RUNTIME_EVENT_REFUSED/,
  );
});

test('input accessors fail closed without invocation', () => {
  const source = input();

  let invoked = 0;

  Object.defineProperty(
    source,
    'missionId',
    {
      enumerable: true,
      get() {
        invoked += 1;
        return 'mission-evil';
      },
    },
  );

  assert.throws(
    () =>
      createFabricRuntimeEvent(source),
    /XVI_RUNTIME_EVENT_REFUSED/,
  );

  assert.equal(invoked, 0);
});

test('hidden symbol state fails closed', () => {
  const source =
    input() as FabricRuntimeEventInput &
      Record<symbol, unknown>;

  source[Symbol('authority')] = true;

  assert.throws(
    () =>
      createFabricRuntimeEvent(source),
    /XVI_RUNTIME_EVENT_REFUSED/,
  );
});

test('inherited state fails closed', () => {
  const source =
    Object.create({
      productionAuthority: true,
    });

  Object.assign(source, input());

  assert.throws(
    () =>
      createFabricRuntimeEvent(source),
    /XVI_RUNTIME_EVENT_REFUSED/,
  );
});

test('unknown event kinds fail closed', () => {
  assert.throws(
    () =>
      createFabricRuntimeEvent(
        input({
          kind: 'EXECUTE_PROVIDER' as never,
        }),
      ),
    /XVI_RUNTIME_EVENT_REFUSED/,
  );
});

test('sequence must be a positive safe integer', () => {
  for (const sequence of [
    0,
    -1,
    1.5,
    Number.MAX_SAFE_INTEGER + 1,
    Number.NaN,
    Number.POSITIVE_INFINITY,
  ]) {
    assert.throws(
      () =>
        createFabricRuntimeEvent(
          input({
            sequence,
          }),
        ),
      /XVI_RUNTIME_EVENT_REFUSED/,
    );
  }
});

test('clock must be a nonnegative safe integer', () => {
  for (const occurredAtMs of [
    -1,
    1.5,
    Number.MAX_SAFE_INTEGER + 1,
    Number.NaN,
    Number.POSITIVE_INFINITY,
  ]) {
    assert.throws(
      () =>
        createFabricRuntimeEvent(
          input({
            occurredAtMs,
          }),
        ),
      /XVI_RUNTIME_EVENT_REFUSED/,
    );
  }
});

test('identity fields are bounded canonical identifiers', () => {
  const invalid = [
    '',
    ' tenant-a',
    'tenant-a ',
    'a'.repeat(129),
    'tenant a',
    'tenant<script>',
  ];

  for (const tenantId of invalid) {
    assert.throws(
      () =>
        createFabricRuntimeEvent(
          input({ tenantId }),
        ),
      /XVI_RUNTIME_EVENT_REFUSED/,
    );
  }

  for (const missionId of invalid) {
    assert.throws(
      () =>
        createFabricRuntimeEvent(
          input({ missionId }),
        ),
      /XVI_RUNTIME_EVENT_REFUSED/,
    );
  }
});

test('serialized mobile projection contains no secret-bearing fields', () => {
  const event =
    createFabricRuntimeEvent(
      input({
        kind: 'HEARTBEAT_RENEWED',
      }),
    );

  const serialized =
    JSON.stringify(event);

  assert.equal(
    serialized.includes('ownerSecret'),
    false,
  );

  assert.equal(
    serialized.includes('leaseId'),
    false,
  );

  assert.equal(
    serialized.includes('handle'),
    false,
  );

  assert.equal(
    serialized.includes('providerId'),
    false,
  );

  assert.equal(
    serialized.includes('modelId'),
    false,
  );
});
