import test from 'node:test';
import assert from 'node:assert/strict';

import {
  XviAgentFabricDurability,
  XVI_FABRIC_DURABILITY_GUARDRAILS,
  type FabricLifecycleInput,
} from './xvi-agent-fabric-durability';

function event(
  overrides: Partial<FabricLifecycleInput> = {},
): FabricLifecycleInput {
  return {
    eventId: 'event-001',
    missionId: 'mission-001',
    tenantId: 'tenant-a',
    kind: 'ENQUEUED',
    actor: 'xiv-supervisor',
    at: '2026-09-24T04:00:00.000Z',
    evidenceRef: 'evidence:1',
    ...overrides,
  };
}

test('durability adapter carries zero execution authority', () => {
  const durability = new XviAgentFabricDurability();
  const receipt = durability.append(event());

  assert.equal(XVI_FABRIC_DURABILITY_GUARDRAILS.executesNothing, true);
  assert.equal(receipt.executesNothing, true);
  assert.equal(receipt.productionAuthority, false);
});

test('journal lifecycle sequences monotonically', () => {
  const durability = new XviAgentFabricDurability();

  const first = durability.append(event());

  const second = durability.append(
    event({
      eventId: 'event-002',
      kind: 'LEASED',
      actor: 'xiv-worker-01',
    }),
  );

  assert.equal(first.sequence, 1);
  assert.equal(second.sequence, 2);
});

test('duplicate lifecycle events are refused by the durability boundary', () => {
  const durability = new XviAgentFabricDurability();

  durability.append(event());

  assert.throws(
    () => durability.append(event()),
    /XVI_AGENT_FABRIC_DURABILITY_REFUSED/,
  );
});

test('undeclared lifecycle fields fail closed', () => {
  const durability = new XviAgentFabricDurability();

  const input = {
    ...event(),
    productionAuthority: true,
  };

  assert.throws(
    () => durability.append(input as never),
    /XVI_AGENT_FABRIC_DURABILITY_REFUSED/,
  );
});

test('lifecycle accessors fail closed without invocation', () => {
  const durability = new XviAgentFabricDurability();
  const input = event();
  let invoked = 0;

  Object.defineProperty(input, 'kind', {
    enumerable: true,
    get() {
      invoked += 1;
      return 'COMPLETED';
    },
  });

  assert.throws(
    () => durability.append(input),
    /XVI_AGENT_FABRIC_DURABILITY_REFUSED/,
  );

  assert.equal(invoked, 0);
});

test('hidden symbol and inherited lifecycle data fail closed', () => {
  const durability = new XviAgentFabricDurability();

  const hidden = event();

  Object.defineProperty(hidden, 'secret', {
    value: 'no',
    enumerable: false,
  });

  assert.throws(
    () => durability.append(hidden),
    /XVI_AGENT_FABRIC_DURABILITY_REFUSED/,
  );

  const symbolic = event();

  Object.defineProperty(symbolic, Symbol('secret'), {
    value: true,
    enumerable: true,
  });

  assert.throws(
    () => durability.append(symbolic),
    /XVI_AGENT_FABRIC_DURABILITY_REFUSED/,
  );

  const inherited = event();
  Object.setPrototypeOf(inherited, { authority: true });

  assert.throws(
    () => durability.append(inherited),
    /XVI_AGENT_FABRIC_DURABILITY_REFUSED/,
  );
});

test('unknown lifecycle transitions are refused structurally', () => {
  const durability = new XviAgentFabricDurability();

  assert.throws(
    () =>
      durability.append(
        event({ kind: 'EXECUTED' as never }),
      ),
    /XVI_AGENT_FABRIC_DURABILITY_REFUSED/,
  );
});

test('timestamps must be canonical ISO UTC', () => {
  const durability = new XviAgentFabricDurability();

  for (const at of [
    '',
    'yesterday',
    '2026-09-24',
    '2026-09-24T04:00:00+00:00',
  ]) {
    assert.throws(
      () => durability.append(event({ at })),
      /XVI_AGENT_FABRIC_DURABILITY_REFUSED/,
    );
  }
});

test('returned receipt is detached and frozen', () => {
  const durability = new XviAgentFabricDurability();
  const input = event();

  const receipt = durability.append(input);

  input.tenantId = 'tenant-mutated';
  input.kind = 'FAILED';
  input.evidenceRef = 'evidence:mutated';

  assert.equal(receipt.tenantId, 'tenant-a');
  assert.equal(receipt.kind, 'ENQUEUED');
  assert.equal(receipt.evidenceRef, 'evidence:1');
  assert.equal(Object.isFrozen(receipt), true);
  assert.match(receipt.digest, /^[0-9a-f]{64}$/);
});

test('journal JSONL contains lifecycle evidence without authority', () => {
  const durability = new XviAgentFabricDurability();

  durability.append(event());

  const text = durability.journalJsonLines();

  assert.match(text, /"kind":"ENQUEUED"/);
  assert.match(text, /"workItemId":"mission-001"/);
  assert.doesNotMatch(text, /productionAuthority/);
});

test('mission lifecycle refuses completion before lease', () => {
  const durability = new XviAgentFabricDurability();

  durability.append(event());

  assert.throws(
    () =>
      durability.append(
        event({
          eventId: 'event-002',
          kind: 'COMPLETED',
          actor: 'xiv-worker-01',
        }),
      ),
    /XVI_AGENT_FABRIC_DURABILITY_REFUSED/,
  );
});

test('mission lifecycle refuses checkpoint before lease', () => {
  const durability = new XviAgentFabricDurability();

  durability.append(event());

  assert.throws(
    () =>
      durability.append(
        event({
          eventId: 'event-002',
          kind: 'CHECKPOINTED',
          actor: 'xiv-worker-01',
        }),
      ),
    /XVI_AGENT_FABRIC_DURABILITY_REFUSED/,
  );
});

test('mission lifecycle permits enqueue lease checkpoint completion', () => {
  const durability = new XviAgentFabricDurability();

  const enqueued = durability.append(event());

  const leased = durability.append(
    event({
      eventId: 'event-002',
      kind: 'LEASED',
      actor: 'xiv-worker-01',
    }),
  );

  const checkpointed = durability.append(
    event({
      eventId: 'event-003',
      kind: 'CHECKPOINTED',
      actor: 'xiv-worker-01',
      evidenceRef: 'checkpoint:001',
    }),
  );

  const completed = durability.append(
    event({
      eventId: 'event-004',
      kind: 'COMPLETED',
      actor: 'xiv-worker-01',
      evidenceRef: 'result:001',
    }),
  );

  assert.equal(enqueued.sequence, 1);
  assert.equal(leased.sequence, 2);
  assert.equal(checkpointed.sequence, 3);
  assert.equal(completed.sequence, 4);
});

test('failed mission may recover but completed mission is terminal', () => {
  const failed = new XviAgentFabricDurability();

  failed.append(event());

  failed.append(
    event({
      eventId: 'event-002',
      kind: 'LEASED',
      actor: 'xiv-worker-01',
    }),
  );

  failed.append(
    event({
      eventId: 'event-003',
      kind: 'FAILED',
      actor: 'xiv-worker-01',
      evidenceRef: 'failure:001',
    }),
  );

  const recovered = failed.append(
    event({
      eventId: 'event-004',
      kind: 'RECOVERED',
      actor: 'xiv-supervisor',
      evidenceRef: 'recovery:001',
    }),
  );

  assert.equal(recovered.kind, 'RECOVERED');

  const completed = new XviAgentFabricDurability();

  completed.append(event());

  completed.append(
    event({
      eventId: 'event-002',
      kind: 'LEASED',
      actor: 'xiv-worker-01',
    }),
  );

  completed.append(
    event({
      eventId: 'event-003',
      kind: 'COMPLETED',
      actor: 'xiv-worker-01',
      evidenceRef: 'result:001',
    }),
  );

  assert.throws(
    () =>
      completed.append(
        event({
          eventId: 'event-004',
          kind: 'RECOVERED',
          actor: 'xiv-supervisor',
        }),
      ),
    /XVI_AGENT_FABRIC_DURABILITY_REFUSED/,
  );
});

test('different missions cannot borrow each others lifecycle', () => {
  const durability = new XviAgentFabricDurability();

  durability.append(event());

  assert.throws(
    () =>
      durability.append(
        event({
          eventId: 'event-002',
          missionId: 'mission-002',
          kind: 'LEASED',
          actor: 'xiv-worker-01',
        }),
      ),
    /XVI_AGENT_FABRIC_DURABILITY_REFUSED/,
  );
});

test('failed journal append does not advance lifecycle state', () => {
  const durability = new XviAgentFabricDurability();

  durability.append(event());

  assert.throws(
    () =>
      durability.append(
        event({
          eventId: 'event-001',
          kind: 'LEASED',
          actor: 'xiv-worker-01',
        }),
      ),
    /duplicate event/,
  );

  const leased = durability.append(
    event({
      eventId: 'event-002',
      kind: 'LEASED',
      actor: 'xiv-worker-01',
    }),
  );

  assert.equal(leased.kind, 'LEASED');
  assert.equal(leased.sequence, 2);
});
