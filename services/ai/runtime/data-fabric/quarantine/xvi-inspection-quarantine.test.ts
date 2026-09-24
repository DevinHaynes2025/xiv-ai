import test from 'node:test';
import assert from 'node:assert/strict';

import {
  quarantineXviInspection,
} from './xvi-inspection-quarantine';

function inspection() {
  return {
    version:
      'xvi-content-inspection-v1' as const,

    sourceId:
      'world-bank-public',

    manifestDigest:
      'a'.repeat(64),

    requestDigest:
      'b'.repeat(64),

    contentDigest:
      'c'.repeat(64),

    payloadBytes:
      1024,

    malwareDetected: false,
    executableContentDetected: false,
    promptInjectionDetected: false,
    personalDataDetected: false,
    credentialMaterialDetected: false,

    requiresReview: false,

    executesContent:
      false as const,

    executesFetch:
      false as const,

    executesTraining:
      false as const,

    networkAuthority:
      false as const,

    productionAuthority:
      false as const,
  };
}

test('clean inspection deterministically produces CLEAN quarantine', () => {
  const result =
    quarantineXviInspection(
      inspection(),
    );

  assert.equal(
    result.decision,
    'CLEAN',
  );

  assert.equal(
    result.safeForMemoryAdmission,
    true,
  );
});

test('prompt injection produces review-required quarantine', () => {
  const result =
    quarantineXviInspection({
      ...inspection(),

      promptInjectionDetected:
        true,

      requiresReview:
        true,
    });

  assert.equal(
    result.decision,
    'REVIEW_REQUIRED',
  );

  assert.equal(
    result.safeForMemoryAdmission,
    false,
  );
});

test('credential detection produces review-required quarantine', () => {
  const result =
    quarantineXviInspection({
      ...inspection(),

      credentialMaterialDetected:
        true,

      requiresReview:
        true,
    });

  assert.equal(
    result.decision,
    'REVIEW_REQUIRED',
  );
});

test('personal-data detection produces review-required quarantine', () => {
  const result =
    quarantineXviInspection({
      ...inspection(),

      personalDataDetected:
        true,

      requiresReview:
        true,
    });

  assert.equal(
    result.decision,
    'REVIEW_REQUIRED',
  );
});

test('malware detection produces review-required quarantine', () => {
  const result =
    quarantineXviInspection({
      ...inspection(),

      malwareDetected:
        true,

      requiresReview:
        true,
    });

  assert.equal(
    result.decision,
    'REVIEW_REQUIRED',
  );
});

test('inconsistent clean claim fails closed', () => {
  assert.throws(
    () =>
      quarantineXviInspection({
        ...inspection(),

        promptInjectionDetected:
          true,

        requiresReview:
          false,
      }),
    /XVI_INSPECTION_QUARANTINE_REFUSED/,
  );
});

test('authority escalation fails closed', () => {
  assert.throws(
    () =>
      quarantineXviInspection({
        ...inspection(),

        executesContent:
          true,
      } as never),
    /XVI_INSPECTION_QUARANTINE_REFUSED/,
  );
});

test('derived quarantine preserves zero authority', () => {
  const result =
    quarantineXviInspection(
      inspection(),
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
