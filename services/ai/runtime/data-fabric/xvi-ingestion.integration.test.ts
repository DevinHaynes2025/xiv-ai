import test from 'node:test';
import assert from 'node:assert/strict';

import {
  admitXviSource,
} from './xvi-source-validator';

import {
  bindAdmittedSourceToBrains,
} from './brains/xvi-admitted-brain-binding';

import {
  createXviFetchRequest,
} from './sources/xvi-fetch-request';

import {
  authorizeXviSupervisedFetch,
} from './sources/xvi-supervised-fetch';

import {
  admitXviSupervisedResponse,
} from './sources/xvi-supervised-response';

import {
  inspectXviContent,
} from './quarantine/xvi-content-inspector';

import {
  createXviInspectionEvidence,
} from './quarantine/xvi-inspection-evidence';

import {
  quarantineXviInspection,
} from './quarantine/xvi-inspection-quarantine';

import {
  createXviEvidenceChain,
} from './provenance/xvi-evidence-chain';

import {
  createXviProvenanceReceipt,
} from './provenance/xvi-provenance-ledger';

import {
  admitXviMemory,
} from './knowledge/xvi-memory-admission';

import {
  XviTemporalMemoryLedger,
} from './knowledge/xvi-temporal-memory';

function source() {
  return admitXviSource({
    version:
      'xvi-source-manifest-v1',

    sourceId:
      'world-bank-public',

    sourceName:
      'World Bank Public Data',

    authority:
      'INTERGOVERNMENTAL',

    sensitivity:
      'PUBLIC_AGGREGATE',

    brainTargets: [
      'MACRO',
      'FINANCIAL',
      'GOVERNMENT',
      'SUPPLY_CHAIN',
      'GOVERNANCE',
    ],

    canonicalOrigin:
      'https://api.worldbank.org/',

    retrievalAllowed: true,
    trainingAllowed: false,
    commercialUseAllowed: false,
    attributionRequired: true,

    containsPersonalData: false,

    providerAuthenticationRequired:
      false,

    authorizationVerified:
      true,

    executesFetch: false,
    networkAuthority: false,
    productionAuthority: false,
  });
}

function syntheticPipeline() {
  const admitted =
    source();

  const binding =
    bindAdmittedSourceToBrains(
      admitted,
    );

  const request =
    createXviFetchRequest({
      sourceId:
        admitted.manifest.sourceId,

      manifestDigest:
        admitted.manifestDigest,

      canonicalOrigin:
        'https://api.worldbank.org',

      endpointPath:
        '/v2/country?format=json',

      purpose:
        'Synthetic governed ingestion integration test.',

      maximumResponseBytes:
        1_048_576,

      timeoutMs:
        10_000,

      requestsPerMinute:
        10,
    });

  const authorization =
    authorizeXviSupervisedFetch({
      source:
        admitted,

      request,
    });

  /*
   * Synthetic payload only.
   * Gate 15H performs NO network request.
   */
  const payload =
    JSON.stringify({
      page: 1,

      data: [
        {
          id: 'USA',
          name:
            'United States',
        },
      ],
    });

  const response =
    admitXviSupervisedResponse({
      authorization,

      statusCode:
        200,

      contentType:
        'application/json',

      payload,

      redirectOccurred:
        false,
    });

  const inspection =
    inspectXviContent({
      response,
      payload,
    });

  const inspectionEvidence =
    createXviInspectionEvidence(
      inspection,
    );

  const temporaryQuarantine =
    quarantineXviInspection(
      inspection,
    );

  const evidence =
    createXviEvidenceChain({
      inspection:
        inspectionEvidence,

      quarantine:
        temporaryQuarantine,

      observedAtMs:
        3_000_000,

      schemaVersion:
        'world-bank-v1',

      brainTargets:
        binding.brainTargets,
    });

  /*
   * Final provenance is created from
   * the verified evidence-bound content.
   */
  const provenance =
    createXviProvenanceReceipt({
      sourceId:
        evidence.sourceId,

      manifestDigest:
        evidence.manifestDigest,

      observedAtMs:
        evidence.observedAtMs,

      schemaVersion:
        evidence.schemaVersion,

      contentDigest:
        evidence.contentDigest,

      brainTargets:
        evidence.brainTargets,

      parentDigest:
        null,
    });

  /*
   * Rebind quarantine to FINAL provenance
   * for memory admission.
   *
   * This remains derived from the exact
   * inspection flags; no caller chooses
   * whether the content is CLEAN.
   */
  const finalQuarantine = {
    ...temporaryQuarantine,

    provenanceDigest:
      provenance.provenanceDigest,
  };

  const memory =
    admitXviMemory({
      source:
        admitted,

      binding,

      provenance,

      quarantine:
        finalQuarantine,
    });

  const temporal =
    new XviTemporalMemoryLedger();

  const temporalReceipt =
    temporal.append({
      sourceId:
        memory.sourceId,

      manifestDigest:
        memory.manifestDigest,

      contentDigest:
        memory.contentDigest,

      provenanceDigest:
        memory.provenanceDigest,

      observedAtMs:
        evidence.observedAtMs,

      parentMemoryDigest:
        null,
    });

  return {
    admitted,
    binding,
    request,
    authorization,
    response,
    inspection,
    inspectionEvidence,
    temporaryQuarantine,
    evidence,
    provenance,
    finalQuarantine,
    memory,
    temporalReceipt,
  };
}

test('synthetic public data traverses complete governed pipeline', () => {
  const result =
    syntheticPipeline();

  assert.equal(
    result.authorization.decision,
    'SUPERVISED_FETCH_ELIGIBLE',
  );

  assert.equal(
    result.response.eligibleForQuarantine,
    true,
  );

  assert.equal(
    result.inspection.requiresReview,
    false,
  );

  assert.equal(
    result.temporaryQuarantine.decision,
    'CLEAN',
  );

  assert.equal(
    result.evidence.eligibleForProvenance,
    true,
  );

  assert.equal(
    result.memory.admittedToMemory,
    true,
  );

  assert.equal(
    result.temporalReceipt.sequence,
    1,
  );
});

test('payload identity survives response through temporal memory', () => {
  const result =
    syntheticPipeline();

  assert.equal(
    result.response.contentDigest,
    result.inspection.contentDigest,
  );

  assert.equal(
    result.inspection.contentDigest,
    result.inspectionEvidence.contentDigest,
  );

  assert.equal(
    result.inspectionEvidence.contentDigest,
    result.evidence.contentDigest,
  );

  assert.equal(
    result.evidence.contentDigest,
    result.provenance.contentDigest,
  );

  assert.equal(
    result.provenance.contentDigest,
    result.memory.contentDigest,
  );

  assert.equal(
    result.memory.contentDigest,
    result.temporalReceipt.contentDigest,
  );
});

test('manifest identity survives complete pipeline', () => {
  const result =
    syntheticPipeline();

  assert.equal(
    result.admitted.manifestDigest,
    result.request.manifestDigest,
  );

  assert.equal(
    result.request.manifestDigest,
    result.response.manifestDigest,
  );

  assert.equal(
    result.response.manifestDigest,
    result.evidence.manifestDigest,
  );

  assert.equal(
    result.evidence.manifestDigest,
    result.memory.manifestDigest,
  );
});

test('final provenance replaces temporary quarantine provenance binding', () => {
  const result =
    syntheticPipeline();

  assert.equal(
    result.finalQuarantine.provenanceDigest,
    result.provenance.provenanceDigest,
  );

  assert.equal(
    result.memory.provenanceDigest,
    result.provenance.provenanceDigest,
  );
});

test('no stage gains execution or production authority', () => {
  const result =
    syntheticPipeline();

  assert.equal(
    result.authorization.networkCallPerformed,
    false,
  );

  assert.equal(
    result.response.executesContent,
    false,
  );

  assert.equal(
    result.inspection.executesContent,
    false,
  );

  assert.equal(
    result.inspectionEvidence.executesContent,
    false,
  );

  assert.equal(
    result.evidence.executesContent,
    false,
  );

  assert.equal(
    result.memory.executesContent,
    false,
  );

  assert.equal(
    result.memory.executesTraining,
    false,
  );

  assert.equal(
    result.temporalReceipt.productionAuthority,
    false,
  );
});

test('brain routing survives evidence into memory', () => {
  const result =
    syntheticPipeline();

  assert.deepEqual(
    result.binding.brainTargets,
    result.evidence.brainTargets,
  );

  assert.deepEqual(
    result.evidence.brainTargets,
    result.memory.brainTargets,
  );
});
