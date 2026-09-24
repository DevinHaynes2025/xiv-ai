import test from 'node:test';
import assert from 'node:assert/strict';

import {
  createXviInspectionEvidence,
} from './xvi-inspection-evidence';

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

test('inspection evidence is deterministic', () => {
  const first =
    createXviInspectionEvidence(
      inspection(),
    );

  const second =
    createXviInspectionEvidence(
      inspection(),
    );

  assert.equal(
    first.inspectionDigest,
    second.inspectionDigest,
  );
});

test('content identity changes inspection identity', () => {
  const first =
    createXviInspectionEvidence(
      inspection(),
    );

  const second =
    createXviInspectionEvidence({
      ...inspection(),

      contentDigest:
        'd'.repeat(64),
    });

  assert.notEqual(
    first.inspectionDigest,
    second.inspectionDigest,
  );
});

test('hazard state changes inspection identity', () => {
  const first =
    createXviInspectionEvidence(
      inspection(),
    );

  const second =
    createXviInspectionEvidence({
      ...inspection(),

      promptInjectionDetected:
        true,

      requiresReview:
        true,
    });

  assert.notEqual(
    first.inspectionDigest,
    second.inspectionDigest,
  );
});

test('inconsistent review state fails closed', () => {
  assert.throws(
    () =>
      createXviInspectionEvidence({
        ...inspection(),

        malwareDetected:
          true,

        requiresReview:
          false,
      }),
    /XVI_INSPECTION_EVIDENCE_REFUSED/,
  );
});

test('malformed request digest fails closed', () => {
  assert.throws(
    () =>
      createXviInspectionEvidence({
        ...inspection(),

        requestDigest:
          'bad',
      }),
    /XVI_INSPECTION_EVIDENCE_REFUSED/,
  );
});

test('authority escalation fails closed', () => {
  assert.throws(
    () =>
      createXviInspectionEvidence({
        ...inspection(),

        networkAuthority:
          true,
      } as never),
    /XVI_INSPECTION_EVIDENCE_REFUSED/,
  );
});

test('inspection evidence carries zero authority', () => {
  const receipt =
    createXviInspectionEvidence(
      inspection(),
    );

  assert.match(
    receipt.inspectionDigest,
    /^[a-f0-9]{64}$/,
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

  assert.equal(
    Object.isFrozen(receipt),
    true,
  );
});
