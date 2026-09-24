import test from 'node:test';
import assert from 'node:assert/strict';

import {
  createXviEvidenceChain,
} from './xvi-evidence-chain';

function inspection() {
  return {
    version:
      'xvi-inspection-evidence-v1' as const,

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

    inspectionDigest:
      'd'.repeat(64),

    executesContent: false as const,
    executesFetch: false as const,
    executesTraining: false as const,
    networkAuthority: false as const,
    productionAuthority: false as const,
  };
}

function quarantine() {
  return {
    version:
      'xvi-quarantine-v1' as const,

    sourceId:
      'world-bank-public',

    manifestDigest:
      'a'.repeat(64),

    contentDigest:
      'c'.repeat(64),

    provenanceDigest:
      'e'.repeat(64),

    decision:
      'CLEAN' as const,

    safeForMemoryAdmission: true,

    executesContent: false as const,
    executesFetch: false as const,
    executesTraining: false as const,
    networkAuthority: false as const,
    productionAuthority: false as const,
  };
}

function input() {
  return {
    inspection:
      inspection(),

    quarantine:
      quarantine(),

    observedAtMs:
      2_000_000,

    schemaVersion:
      'world-bank-v1',

    brainTargets: [
      'MACRO',
      'FINANCIAL',
      'GOVERNMENT',
      'SUPPLY_CHAIN',
      'GOVERNANCE',
    ] as const,
  };
}

test('clean evidence chain produces deterministic digest', () => {
  const first =
    createXviEvidenceChain(
      input(),
    );

  const second =
    createXviEvidenceChain(
      input(),
    );

  assert.equal(
    first.evidenceDigest,
    second.evidenceDigest,
  );

  assert.match(
    first.evidenceDigest,
    /^[a-f0-9]{64}$/,
  );
});

test('inspection identity changes evidence identity', () => {
  const first =
    createXviEvidenceChain(
      input(),
    );

  const second =
    createXviEvidenceChain({
      ...input(),

      inspection: {
        ...inspection(),

        inspectionDigest:
          'f'.repeat(64),
      },
    });

  assert.notEqual(
    first.evidenceDigest,
    second.evidenceDigest,
  );
});

test('content mismatch fails closed', () => {
  assert.throws(
    () =>
      createXviEvidenceChain({
        ...input(),

        quarantine: {
          ...quarantine(),

          contentDigest:
            'f'.repeat(64),
        },
      }),
    /XVI_EVIDENCE_CHAIN_REFUSED/,
  );
});

test('review-required inspection fails closed', () => {
  assert.throws(
    () =>
      createXviEvidenceChain({
        ...input(),

        inspection: {
          ...inspection(),

          promptInjectionDetected:
            true,

          requiresReview:
            true,
        },
      }),
    /XVI_EVIDENCE_CHAIN_REFUSED/,
  );
});

test('non-clean quarantine fails closed', () => {
  assert.throws(
    () =>
      createXviEvidenceChain({
        ...input(),

        quarantine: {
          ...quarantine(),

          decision:
            'REVIEW_REQUIRED',

          safeForMemoryAdmission:
            false,
        },
      }),
    /XVI_EVIDENCE_CHAIN_REFUSED/,
  );
});

test('unknown brain target fails closed', () => {
  assert.throws(
    () =>
      createXviEvidenceChain({
        ...input(),

        brainTargets: [
          'MACRO',
          'UNKNOWN_BRAIN',
        ],
      } as never),
    /XVI_EVIDENCE_CHAIN_REFUSED/,
  );
});

test('timestamp changes evidence identity', () => {
  const first =
    createXviEvidenceChain(
      input(),
    );

  const second =
    createXviEvidenceChain({
      ...input(),

      observedAtMs:
        2_000_001,
    });

  assert.notEqual(
    first.evidenceDigest,
    second.evidenceDigest,
  );
});

test('evidence receipt carries zero authority', () => {
  const receipt =
    createXviEvidenceChain(
      input(),
    );

  assert.equal(
    receipt.eligibleForProvenance,
    true,
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

  assert.equal(
    Object.isFrozen(
      receipt.brainTargets,
    ),
    true,
  );
});
