import test from 'node:test';
import assert from 'node:assert/strict';

import {
  createXviProvenanceReceipt,
} from './xvi-provenance-ledger';

function input() {
  return {
    sourceId:
      'world-bank-public',

    manifestDigest:
      'a'.repeat(64),

    observedAtMs:
      1_000_000,

    schemaVersion:
      'world-bank-v1',

    contentDigest:
      'b'.repeat(64),

    brainTargets: [
      'MACRO',
      'FINANCIAL',
      'GOVERNANCE',
    ] as const,

    parentDigest:
      null,
  };
}

test('provenance receipt is deterministic', () => {
  const first =
    createXviProvenanceReceipt(
      input(),
    );

  const second =
    createXviProvenanceReceipt(
      input(),
    );

  assert.equal(
    first.provenanceDigest,
    second.provenanceDigest,
  );
});

test('content change changes provenance identity', () => {
  const first =
    createXviProvenanceReceipt(
      input(),
    );

  const changed =
    createXviProvenanceReceipt({
      ...input(),
      contentDigest:
        'c'.repeat(64),
    });

  assert.notEqual(
    first.provenanceDigest,
    changed.provenanceDigest,
  );
});

test('timestamp participates in provenance identity', () => {
  const first =
    createXviProvenanceReceipt(
      input(),
    );

  const changed =
    createXviProvenanceReceipt({
      ...input(),
      observedAtMs:
        1_000_001,
    });

  assert.notEqual(
    first.provenanceDigest,
    changed.provenanceDigest,
  );
});

test('malformed digests fail closed', () => {
  assert.throws(
    () =>
      createXviProvenanceReceipt({
        ...input(),
        manifestDigest:
          'bad',
      }),
    /XVI_PROVENANCE_REFUSED/,
  );

  assert.throws(
    () =>
      createXviProvenanceReceipt({
        ...input(),
        contentDigest:
          'z'.repeat(64),
      }),
    /XVI_PROVENANCE_REFUSED/,
  );
});

test('duplicate brain routes fail closed', () => {
  assert.throws(
    () =>
      createXviProvenanceReceipt({
        ...input(),
        brainTargets: [
          'MACRO',
          'MACRO',
        ],
      } as never),
    /XVI_PROVENANCE_REFUSED/,
  );
});

test('accessors fail closed without invocation', () => {
  const candidate =
    input() as Record<string, unknown>;

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
      createXviProvenanceReceipt(
        candidate as never,
      ),
    /XVI_PROVENANCE_REFUSED/,
  );

  assert.equal(
    invoked,
    0,
  );
});

test('receipt carries no execution authority', () => {
  const receipt =
    createXviProvenanceReceipt(
      input(),
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

test('receipt and brain targets are frozen', () => {
  const receipt =
    createXviProvenanceReceipt(
      input(),
    );

  assert.equal(
    Object.isFrozen(receipt),
    true,
  );

  assert.equal(
    Object.isFrozen(
      receipt.brainTargets,
    ),
    true,
  );
});

test('unknown brain target fails closed', () => {
  assert.throws(
    () =>
      createXviProvenanceReceipt({
        ...input(),
        brainTargets: [
          'MACRO',
          'QUANTUM_EVIL',
        ],
      } as never),
    /XVI_PROVENANCE_REFUSED/,
  );
});

test('parent lineage changes provenance identity', () => {
  const root =
    createXviProvenanceReceipt(
      input(),
    );

  const child =
    createXviProvenanceReceipt({
      ...input(),
      parentDigest:
        root.provenanceDigest,
    });

  assert.notEqual(
    root.provenanceDigest,
    child.provenanceDigest,
  );

  assert.equal(
    child.parentDigest,
    root.provenanceDigest,
  );
});

test('undeclared provenance state fails closed', () => {
  assert.throws(
    () =>
      createXviProvenanceReceipt({
        ...input(),
        bypassQuarantine: true,
      } as never),
    /XVI_PROVENANCE_REFUSED/,
  );
});
