import test from 'node:test';
import assert from 'node:assert/strict';

import {
  XviTemporalMemoryLedger,
} from './xvi-temporal-memory';

function observation(
  sequence: number,
  parentMemoryDigest:
    string | null,
) {
  return {
    sourceId:
      'world-bank-public',

    manifestDigest:
      'a'.repeat(64),

    contentDigest:
      sequence
        .toString(16)
        .padStart(64, '0'),

    provenanceDigest:
      (sequence + 100)
        .toString(16)
        .padStart(64, '0'),

    observedAtMs:
      1_000_000 + sequence,

    parentMemoryDigest,
  };
}

test('genesis observation creates temporal memory head', () => {
  const ledger =
    new XviTemporalMemoryLedger();

  const receipt =
    ledger.append(
      observation(1, null),
    );

  assert.equal(
    receipt.sequence,
    1,
  );

  assert.match(
    receipt.memoryDigest,
    /^[a-f0-9]{64}$/,
  );
});

test('second observation must extend current head', () => {
  const ledger =
    new XviTemporalMemoryLedger();

  const first =
    ledger.append(
      observation(1, null),
    );

  const second =
    ledger.append(
      observation(
        2,
        first.memoryDigest,
      ),
    );

  assert.equal(
    second.sequence,
    2,
  );

  assert.equal(
    second.parentMemoryDigest,
    first.memoryDigest,
  );
});

test('backward observation time fails closed', () => {
  const ledger =
    new XviTemporalMemoryLedger();

  const first =
    ledger.append(
      observation(2, null),
    );

  assert.throws(
    () =>
      ledger.append({
        ...observation(
          3,
          first.memoryDigest,
        ),

        observedAtMs:
          first.observedAtMs - 1,
      }),
    /XVI_TEMPORAL_MEMORY_REFUSED/,
  );
});

test('duplicate observation time fails closed', () => {
  const ledger =
    new XviTemporalMemoryLedger();

  const first =
    ledger.append(
      observation(1, null),
    );

  assert.throws(
    () =>
      ledger.append({
        ...observation(
          2,
          first.memoryDigest,
        ),

        observedAtMs:
          first.observedAtMs,
      }),
    /XVI_TEMPORAL_MEMORY_REFUSED/,
  );
});

test('wrong parent memory head fails closed', () => {
  const ledger =
    new XviTemporalMemoryLedger();

  ledger.append(
    observation(1, null),
  );

  assert.throws(
    () =>
      ledger.append(
        observation(
          2,
          'f'.repeat(64),
        ),
      ),
    /XVI_TEMPORAL_MEMORY_REFUSED/,
  );
});

test('provenance replay fails closed', () => {
  const ledger =
    new XviTemporalMemoryLedger();

  const first =
    ledger.append(
      observation(1, null),
    );

  const replay = {
    ...observation(
      2,
      first.memoryDigest,
    ),

    provenanceDigest:
      first.provenanceDigest,
  };

  assert.throws(
    () =>
      ledger.append(replay),
    /XVI_TEMPORAL_MEMORY_REFUSED/,
  );
});

test('failed append does not advance ledger state', () => {
  const ledger =
    new XviTemporalMemoryLedger();

  const first =
    ledger.append(
      observation(1, null),
    );

  assert.throws(
    () =>
      ledger.append(
        observation(
          2,
          'f'.repeat(64),
        ),
      ),
    /XVI_TEMPORAL_MEMORY_REFUSED/,
  );

  const snapshot =
    ledger.snapshot();

  assert.equal(
    snapshot.sequence,
    1,
  );

  assert.equal(
    snapshot.lastMemoryDigest,
    first.memoryDigest,
  );
});

test('accessors fail closed without invocation', () => {
  const ledger =
    new XviTemporalMemoryLedger();

  const candidate =
    observation(
      1,
      null,
    ) as Record<string, unknown>;

  let invoked = 0;

  Object.defineProperty(
    candidate,
    'contentDigest',
    {
      enumerable: true,

      get() {
        invoked += 1;
        return 'b'.repeat(64);
      },
    },
  );

  assert.throws(
    () =>
      ledger.append(
        candidate as never,
      ),
    /XVI_TEMPORAL_MEMORY_REFUSED/,
  );

  assert.equal(invoked, 0);
});

test('temporal memory carries zero execution authority', () => {
  const ledger =
    new XviTemporalMemoryLedger();

  const receipt =
    ledger.append(
      observation(1, null),
    );

  assert.equal(
    receipt.executesContent,
    false,
  );

  assert.equal(
    receipt.executesFetch,
    false,
  );

  assert.equal(
    receipt.executesTraining,
    false,
  );

  assert.equal(
    receipt.networkAuthority,
    false,
  );

  assert.equal(
    receipt.productionAuthority,
    false,
  );
});
