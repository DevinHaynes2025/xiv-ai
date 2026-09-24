import test from 'node:test';
import assert from 'node:assert/strict';

import {
  createXviQuarantineVerdict,
} from './xvi-quarantine-verdict';

function input() {
  return {
    sourceId:
      'world-bank-public',

    manifestDigest:
      'a'.repeat(64),

    contentDigest:
      'b'.repeat(64),

    provenanceDigest:
      'c'.repeat(64),

    malwareDetected: false,
    executableContentDetected: false,
    promptInjectionDetected: false,
    personalDataDetected: false,
    credentialMaterialDetected: false,

    decision:
      'CLEAN' as const,
  };
}

test('clean content is eligible for memory admission', () => {
  const result =
    createXviQuarantineVerdict(
      input(),
    );

  assert.equal(
    result.safeForMemoryAdmission,
    true,
  );

  assert.equal(
    result.decision,
    'CLEAN',
  );
});

test('prompt injection cannot be labeled clean', () => {
  assert.throws(
    () =>
      createXviQuarantineVerdict({
        ...input(),
        promptInjectionDetected:
          true,
      }),
    /XVI_QUARANTINE_REFUSED/,
  );
});

test('credential material cannot be labeled clean', () => {
  assert.throws(
    () =>
      createXviQuarantineVerdict({
        ...input(),
        credentialMaterialDetected:
          true,
      }),
    /XVI_QUARANTINE_REFUSED/,
  );
});

test('personal data cannot be labeled clean', () => {
  assert.throws(
    () =>
      createXviQuarantineVerdict({
        ...input(),
        personalDataDetected:
          true,
      }),
    /XVI_QUARANTINE_REFUSED/,
  );
});

test('executable content cannot be labeled clean', () => {
  assert.throws(
    () =>
      createXviQuarantineVerdict({
        ...input(),
        executableContentDetected:
          true,
      }),
    /XVI_QUARANTINE_REFUSED/,
  );
});

test('review-required content cannot enter memory', () => {
  const result =
    createXviQuarantineVerdict({
      ...input(),
      decision:
        'REVIEW_REQUIRED',
    });

  assert.equal(
    result.safeForMemoryAdmission,
    false,
  );
});

test('rejected content cannot enter memory', () => {
  const result =
    createXviQuarantineVerdict({
      ...input(),
      decision:
        'REJECTED',
    });

  assert.equal(
    result.safeForMemoryAdmission,
    false,
  );
});

test('accessors fail closed without invocation', () => {
  const candidate =
    input() as Record<string, unknown>;

  let invoked = 0;

  Object.defineProperty(
    candidate,
    'decision',
    {
      enumerable: true,

      get() {
        invoked += 1;
        return 'CLEAN';
      },
    },
  );

  assert.throws(
    () =>
      createXviQuarantineVerdict(
        candidate as never,
      ),
    /XVI_QUARANTINE_REFUSED/,
  );

  assert.equal(invoked, 0);
});

test('undeclared authority fields fail closed', () => {
  assert.throws(
    () =>
      createXviQuarantineVerdict({
        ...input(),
        executePayload: true,
      } as never),
    /XVI_QUARANTINE_REFUSED/,
  );
});

test('quarantine receipt carries zero authority', () => {
  const result =
    createXviQuarantineVerdict(
      input(),
    );

  assert.equal(
    result.executesContent,
    false,
  );

  assert.equal(
    result.executesFetch,
    false,
  );

  assert.equal(
    result.executesTraining,
    false,
  );

  assert.equal(
    result.networkAuthority,
    false,
  );

  assert.equal(
    result.productionAuthority,
    false,
  );
});
