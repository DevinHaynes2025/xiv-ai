import test from 'node:test';
import assert from 'node:assert/strict';

import {
  bindXviFinalEvidence,
} from './xvi-final-evidence-binding';

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

    payloadBytes: 1024,

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

function evidence() {
  return {
    version:
      'xvi-evidence-chain-v1' as const,

    sourceId:
      'world-bank-public',

    manifestDigest:
      'a'.repeat(64),

    requestDigest:
      'b'.repeat(64),

    contentDigest:
      'c'.repeat(64),

    inspectionDigest:
      'd'.repeat(64),

    quarantineDecision:
      'CLEAN' as const,

    observedAtMs:
      3_000_000,

    schemaVersion:
      'world-bank-v1',

    brainTargets: [
      'MACRO',
      'FINANCIAL',
      'GOVERNMENT',
      'SUPPLY_CHAIN',
      'GOVERNANCE',
    ] as const,

    evidenceDigest:
      'e'.repeat(64),

    eligibleForProvenance:
      true as const,

    executesContent: false as const,
    executesFetch: false as const,
    executesTraining: false as const,
    networkAuthority: false as const,
    productionAuthority: false as const,
  };
}

function provenance() {
  return {
    version:
      'xvi-provenance-receipt-v1' as const,

    sourceId:
      'world-bank-public',

    manifestDigest:
      'a'.repeat(64),

    observedAtMs:
      3_000_000,

    schemaVersion:
      'world-bank-v1',

    contentDigest:
      'c'.repeat(64),

    brainTargets: [
      'MACRO',
      'FINANCIAL',
      'GOVERNMENT',
      'SUPPLY_CHAIN',
      'GOVERNANCE',
    ] as const,

    parentDigest:
      null,

    provenanceDigest:
      'f'.repeat(64),

    executesFetch: false as const,
    executesTraining: false as const,
    networkAuthority: false as const,
    productionAuthority: false as const,
  };
}

test('matching inspection evidence and provenance bind', () => {
  const result =
    bindXviFinalEvidence({
      inspection: inspection(),
      evidence: evidence(),
      provenance: provenance(),
    });

  assert.equal(
    result.finalEvidenceVerified,
    true,
  );

  assert.equal(
    result.eligibleForMemoryAdmission,
    true,
  );
});

test('content mismatch fails closed', () => {
  assert.throws(
    () =>
      bindXviFinalEvidence({
        inspection: inspection(),

        evidence: {
          ...evidence(),
          contentDigest:
            '9'.repeat(64),
        },

        provenance: provenance(),
      }),
    /XVI_FINAL_EVIDENCE_BINDING_REFUSED/,
  );
});

test('inspection mismatch fails closed', () => {
  assert.throws(
    () =>
      bindXviFinalEvidence({
        inspection: inspection(),

        evidence: {
          ...evidence(),
          inspectionDigest:
            '9'.repeat(64),
        },

        provenance: provenance(),
      }),
    /XVI_FINAL_EVIDENCE_BINDING_REFUSED/,
  );
});

test('observation timestamp mismatch fails closed', () => {
  assert.throws(
    () =>
      bindXviFinalEvidence({
        inspection: inspection(),
        evidence: evidence(),

        provenance: {
          ...provenance(),
          observedAtMs:
            3_000_001,
        },
      }),
    /XVI_FINAL_EVIDENCE_BINDING_REFUSED/,
  );
});

test('schema mismatch fails closed', () => {
  assert.throws(
    () =>
      bindXviFinalEvidence({
        inspection: inspection(),
        evidence: evidence(),

        provenance: {
          ...provenance(),
          schemaVersion:
            'evil-schema',
        },
      }),
    /XVI_FINAL_EVIDENCE_BINDING_REFUSED/,
  );
});

test('brain route mismatch fails closed', () => {
  assert.throws(
    () =>
      bindXviFinalEvidence({
        inspection: inspection(),
        evidence: evidence(),

        provenance: {
          ...provenance(),
          brainTargets: [
            'MACRO',
          ],
        },
      }),
    /XVI_FINAL_EVIDENCE_BINDING_REFUSED/,
  );
});

test('authority escalation fails closed', () => {
  assert.throws(
    () =>
      bindXviFinalEvidence({
        inspection: inspection(),

        evidence: {
          ...evidence(),
          networkAuthority:
            true,
        } as never,

        provenance: provenance(),
      }),
    /XVI_FINAL_EVIDENCE_BINDING_REFUSED/,
  );
});

test('final binding remains zero-authority and frozen', () => {
  const result =
    bindXviFinalEvidence({
      inspection: inspection(),
      evidence: evidence(),
      provenance: provenance(),
    });

  assert.equal(result.executesContent, false);
  assert.equal(result.executesFetch, false);
  assert.equal(result.executesTraining, false);
  assert.equal(result.networkAuthority, false);
  assert.equal(result.productionAuthority, false);
  assert.equal(Object.isFrozen(result), true);
});
