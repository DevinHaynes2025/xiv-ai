import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';

import {
  createFabricRestartEnvelope,
} from './xvi-agent-fabric-restart-envelope';

import {
  restoreFabricMissionForRecovery,
} from './xvi-agent-fabric-restart-replay';

function jsonl(events: unknown[]): string {
  return events.map(event => JSON.stringify(event)).join('\n');
}

function digest(text: string): string {
  return createHash('sha256')
    .update(text, 'utf8')
    .digest('hex');
}

function event(
  sequence: number,
  kind:
    | 'ENQUEUED'
    | 'LEASED'
    | 'CHECKPOINTED'
    | 'COMPLETED'
    | 'FAILED'
    | 'RECOVERED',
  overrides: Record<string, unknown> = {},
) {
  return {
    sequence,
    eventId: `event-${sequence}`,
    workItemId: 'mission-001',
    kind,
    actor: 'xiv-runtime',
    at: `2026-09-24T04:00:0${sequence}.000Z`,
    ...overrides,
  };
}

function envelopeFor(journalText: string) {
  return createFabricRestartEnvelope({
    tenantId: 'tenant-a',
    missionId: 'mission-001',
    planDigest: 'a'.repeat(64),
    journalDigest: digest(journalText),
    connectivity: 'OFFLINE_ONLY',
    confidentiality: 'INTERNAL',
    risk: 'LOW',
    sourceCommit: 'c'.repeat(40),
  });
}

test('restart replay restores checkpointed lifecycle', () => {
  const journal = jsonl([
    event(1, 'ENQUEUED'),
    event(2, 'LEASED'),
    event(3, 'CHECKPOINTED'),
  ]);

  const restored = restoreFabricMissionForRecovery(
    envelopeFor(journal),
    journal,
  );

  assert.equal(restored.state, 'CHECKPOINTED');
  assert.equal(restored.eventCount, 3);
  assert.equal(restored.lastSequence, 3);
  assert.equal(restored.tenantId, 'tenant-a');
  assert.equal(restored.missionId, 'mission-001');
  assert.equal(
    restored.verification,
    'RESTORED_FOR_RECOVERY_EVALUATION',
  );
});

test('completed mission restores terminal completion', () => {
  const journal = jsonl([
    event(1, 'ENQUEUED'),
    event(2, 'LEASED'),
    event(3, 'COMPLETED'),
  ]);

  const restored = restoreFabricMissionForRecovery(
    envelopeFor(journal),
    journal,
  );

  assert.equal(restored.state, 'COMPLETED');
});

test('failed and recovered states restore exactly', () => {
  const failedJournal = jsonl([
    event(1, 'ENQUEUED'),
    event(2, 'LEASED'),
    event(3, 'FAILED'),
  ]);

  assert.equal(
    restoreFabricMissionForRecovery(
      envelopeFor(failedJournal),
      failedJournal,
    ).state,
    'FAILED',
  );

  const recoveredJournal = jsonl([
    event(1, 'ENQUEUED'),
    event(2, 'LEASED'),
    event(3, 'FAILED'),
    event(4, 'RECOVERED'),
  ]);

  assert.equal(
    restoreFabricMissionForRecovery(
      envelopeFor(recoveredJournal),
      recoveredJournal,
    ).state,
    'RECOVERED',
  );
});

test('journal digest mismatch fails closed', () => {
  const journal = jsonl([
    event(1, 'ENQUEUED'),
    event(2, 'LEASED'),
  ]);

  const envelope = createFabricRestartEnvelope({
    tenantId: 'tenant-a',
    missionId: 'mission-001',
    planDigest: 'a'.repeat(64),
    journalDigest: 'b'.repeat(64),
    connectivity: 'OFFLINE_ONLY',
    confidentiality: 'INTERNAL',
    risk: 'LOW',
    sourceCommit: 'c'.repeat(40),
  });

  assert.throws(
    () => restoreFabricMissionForRecovery(envelope, journal),
    /XVI_FABRIC_REPLAY_REFUSED/,
  );
});

test('cross-mission journal fails closed', () => {
  const journal = jsonl([
    event(1, 'ENQUEUED'),
    event(2, 'LEASED', {
      workItemId: 'mission-002',
    }),
  ]);

  assert.throws(
    () =>
      restoreFabricMissionForRecovery(
        envelopeFor(journal),
        journal,
      ),
    /XVI_FABRIC_REPLAY_REFUSED/,
  );
});

test('sequence gaps and duplicate event ids fail closed', () => {
  const gap = jsonl([
    event(1, 'ENQUEUED'),
    event(3, 'LEASED'),
  ]);

  assert.throws(
    () =>
      restoreFabricMissionForRecovery(
        envelopeFor(gap),
        gap,
      ),
    /XVI_FABRIC_REPLAY_REFUSED/,
  );

  const duplicate = jsonl([
    event(1, 'ENQUEUED'),
    {
      ...event(2, 'LEASED'),
      eventId: 'event-1',
    },
  ]);

  assert.throws(
    () =>
      restoreFabricMissionForRecovery(
        envelopeFor(duplicate),
        duplicate,
      ),
    /XVI_FABRIC_REPLAY_REFUSED/,
  );
});

test('illegal lifecycle history fails closed', () => {
  const histories = [
    jsonl([
      event(1, 'ENQUEUED'),
      event(2, 'COMPLETED'),
    ]),
    jsonl([
      event(1, 'ENQUEUED'),
      event(2, 'CHECKPOINTED'),
    ]),
    jsonl([
      event(1, 'ENQUEUED'),
      event(2, 'LEASED'),
      event(3, 'RECOVERED'),
    ]),
    jsonl([
      event(1, 'ENQUEUED'),
      event(2, 'LEASED'),
      event(3, 'COMPLETED'),
      event(4, 'FAILED'),
    ]),
  ];

  for (const journal of histories) {
    assert.throws(
      () =>
        restoreFabricMissionForRecovery(
          envelopeFor(journal),
          journal,
        ),
      /XVI_FABRIC_REPLAY_REFUSED/,
    );
  }
});

test('empty and malformed journals fail closed', () => {
  for (const journal of ['', '{not-json}']) {
    assert.throws(
      () =>
        restoreFabricMissionForRecovery(
          envelopeFor(journal),
          journal,
        ),
      /XVI_FABRIC_REPLAY_REFUSED/,
    );
  }
});

test('replay result carries zero execution authority', () => {
  const journal = jsonl([
    event(1, 'ENQUEUED'),
    event(2, 'LEASED'),
  ]);

  const restored = restoreFabricMissionForRecovery(
    envelopeFor(journal),
    journal,
  );

  assert.equal(restored.executesNothing, true);
  assert.equal(restored.productionAuthority, false);
  assert.equal(Object.isFrozen(restored), true);
});

test('replay refuses unknown event kinds', () => {
  const journal = jsonl([
    event(1, 'ENQUEUED'),
    {
      ...event(2, 'LEASED'),
      kind: 'EXECUTED',
    },
  ]);

  assert.throws(
    () =>
      restoreFabricMissionForRecovery(
        envelopeFor(journal),
        journal,
      ),
    /XVI_FABRIC_REPLAY_REFUSED/,
  );
});

test('replay refuses extra or missing event properties', () => {
  const extra = jsonl([
    event(1, 'ENQUEUED'),
    {
      ...event(2, 'LEASED'),
      productionAuthority: true,
    },
  ]);

  assert.throws(
    () =>
      restoreFabricMissionForRecovery(
        envelopeFor(extra),
        extra,
      ),
    /XVI_FABRIC_REPLAY_REFUSED/,
  );

  const missingActor = jsonl([
    event(1, 'ENQUEUED'),
    {
      sequence: 2,
      eventId: 'event-2',
      workItemId: 'mission-001',
      kind: 'LEASED',
      at: '2026-09-24T04:00:02.000Z',
    },
  ]);

  assert.throws(
    () =>
      restoreFabricMissionForRecovery(
        envelopeFor(missingActor),
        missingActor,
      ),
    /XVI_FABRIC_REPLAY_REFUSED/,
  );
});

test('replay refuses malformed event primitives', () => {
  const variants = [
    {
      ...event(2, 'LEASED'),
      sequence: 2.5,
    },
    {
      ...event(2, 'LEASED'),
      eventId: '',
    },
    {
      ...event(2, 'LEASED'),
      workItemId: 123,
    },
    {
      ...event(2, 'LEASED'),
      actor: '',
    },
    {
      ...event(2, 'LEASED'),
      at: 'yesterday',
    },
  ];

  for (const malformed of variants) {
    const journal = jsonl([
      event(1, 'ENQUEUED'),
      malformed,
    ]);

    assert.throws(
      () =>
        restoreFabricMissionForRecovery(
          envelopeFor(journal),
          journal,
        ),
      /XVI_FABRIC_REPLAY_REFUSED/,
    );
  }
});

test('replay refuses zero negative and unsafe sequence numbers', () => {
  for (const sequence of [
    0,
    -1,
    Number.MAX_SAFE_INTEGER + 1,
  ]) {
    const journal = jsonl([
      {
        ...event(1, 'ENQUEUED'),
        sequence,
      },
    ]);

    assert.throws(
      () =>
        restoreFabricMissionForRecovery(
          envelopeFor(journal),
          journal,
        ),
      /XVI_FABRIC_REPLAY_REFUSED/,
    );
  }
});

test('replay refuses oversized event identifiers', () => {
  const journal = jsonl([
    {
      ...event(1, 'ENQUEUED'),
      eventId: 'x'.repeat(1024),
    },
  ]);

  assert.throws(
    () =>
      restoreFabricMissionForRecovery(
        envelopeFor(journal),
        journal,
      ),
    /XVI_FABRIC_REPLAY_REFUSED/,
  );
});

test('replay accepts bounded checkpoint evidence', () => {
  const journal = jsonl([
    event(1, 'ENQUEUED'),
    event(2, 'LEASED'),
    {
      ...event(3, 'CHECKPOINTED'),
      evidence: 'checkpoint:001',
    },
  ]);

  const restored = restoreFabricMissionForRecovery(
    envelopeFor(journal),
    journal,
  );

  assert.equal(restored.state, 'CHECKPOINTED');
});

test('replay refuses malformed or oversized evidence references', () => {
  const variants = [
    '',
    'x'.repeat(129),
    'contains spaces',
    123,
  ];

  for (const evidence of variants) {
    const journal = jsonl([
      event(1, 'ENQUEUED'),
      event(2, 'LEASED'),
      {
        ...event(3, 'CHECKPOINTED'),
        evidence,
      },
    ]);

    assert.throws(
      () =>
        restoreFabricMissionForRecovery(
          envelopeFor(journal),
          journal,
        ),
      /XVI_FABRIC_REPLAY_REFUSED/,
    );
  }
});
