import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';

import {
  admitXviSource,
} from '../xvi-source-validator';

import {
  bindAdmittedSourceToBrains,
} from '../brains/xvi-admitted-brain-binding';

import {
  createXviProvenanceReceipt,
} from '../provenance/xvi-provenance-ledger';

import {
  createXviQuarantineVerdict,
} from '../quarantine/xvi-quarantine-verdict';

import {
  admitXviMemory,
} from './xvi-memory-admission';

function chain() {
  const source =
    admitXviSource({
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

  const binding =
    bindAdmittedSourceToBrains(
      source,
    );

  /*
   * Synthetic content identity only.
   * This test performs no network fetch.
   */
  const contentDigest =
    createHash('sha256')
      .update(
        'synthetic-world-bank-test-payload',
      )
      .digest('hex');

  const provenance =
    createXviProvenanceReceipt({
      sourceId:
        source.manifest.sourceId,

      manifestDigest:
        source.manifestDigest,

      observedAtMs:
        1_000_000,

      schemaVersion:
        'world-bank-v1',

      contentDigest,

      brainTargets:
        binding.brainTargets,

      parentDigest:
        null,
    });

  const quarantine =
    createXviQuarantineVerdict({
      sourceId:
        source.manifest.sourceId,

      manifestDigest:
        source.manifestDigest,

      contentDigest,

      provenanceDigest:
        provenance.provenanceDigest,

      malwareDetected: false,
      executableContentDetected: false,
      promptInjectionDetected: false,
      personalDataDetected: false,
      credentialMaterialDetected: false,

      decision:
        'CLEAN',
    });

  return {
    source,
    binding,
    provenance,
    quarantine,
  };
}

test('verified clean receipt chain enters CORE memory', () => {
  const result =
    admitXviMemory(
      chain(),
    );

  assert.equal(
    result.admittedToMemory,
    true,
  );

  assert.equal(
    result.retrievalEligible,
    true,
  );

  assert.equal(
    result.trainingEligible,
    false,
  );
});

test('memory admission carries zero execution authority', () => {
  const result =
    admitXviMemory(
      chain(),
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

test('manifest mismatch fails closed', () => {
  const value =
    chain();

  assert.throws(
    () =>
      admitXviMemory({
        ...value,

        quarantine: {
          ...value.quarantine,

          manifestDigest:
            'f'.repeat(64),
        },
      }),
    /XVI_MEMORY_ADMISSION_REFUSED/,
  );
});

test('content mismatch fails closed', () => {
  const value =
    chain();

  assert.throws(
    () =>
      admitXviMemory({
        ...value,

        quarantine: {
          ...value.quarantine,

          contentDigest:
            'f'.repeat(64),
        },
      }),
    /XVI_MEMORY_ADMISSION_REFUSED/,
  );
});

test('provenance mismatch fails closed', () => {
  const value =
    chain();

  assert.throws(
    () =>
      admitXviMemory({
        ...value,

        quarantine: {
          ...value.quarantine,

          provenanceDigest:
            'f'.repeat(64),
        },
      }),
    /XVI_MEMORY_ADMISSION_REFUSED/,
  );
});

test('non-clean quarantine cannot enter memory', () => {
  const value =
    chain();

  assert.throws(
    () =>
      admitXviMemory({
        ...value,

        quarantine: {
          ...value.quarantine,

          decision:
            'REVIEW_REQUIRED',

          safeForMemoryAdmission:
            false,
        },
      }),
    /XVI_MEMORY_ADMISSION_REFUSED/,
  );
});

test('brain routing mismatch fails closed', () => {
  const value =
    chain();

  assert.throws(
    () =>
      admitXviMemory({
        ...value,

        binding: {
          ...value.binding,

          brainTargets: [
            'MACRO',
          ],
        },
      }),
    /XVI_MEMORY_ADMISSION_REFUSED/,
  );
});

test('memory input accessors fail closed without invocation', () => {
  const value =
    chain() as Record<
      string,
      unknown
    >;

  let invoked = 0;

  Object.defineProperty(
    value,
    'quarantine',
    {
      enumerable: true,

      get() {
        invoked += 1;

        return {};
      },
    },
  );

  assert.throws(
    () =>
      admitXviMemory(
        value as never,
      ),
    /XVI_MEMORY_ADMISSION_REFUSED/,
  );

  assert.equal(invoked, 0);
});

test('undeclared memory authority fails closed', () => {
  assert.throws(
    () =>
      admitXviMemory({
        ...chain(),
        autonomousExecution: true,
      } as never),
    /XVI_MEMORY_ADMISSION_REFUSED/,
  );
});

test('memory receipt is deeply safe at routing boundary', () => {
  const result =
    admitXviMemory(
      chain(),
    );

  assert.equal(
    Object.isFrozen(result),
    true,
  );

  assert.equal(
    Object.isFrozen(
      result.brainTargets,
    ),
    true,
  );

  const serialized =
    JSON.stringify(result);

  for (const forbidden of [
    'password',
    'credential',
    'ownerSecret',
    'authorizationToken',
    'executePayload',
  ]) {
    assert.equal(
      serialized.includes(forbidden),
      false,
    );
  }
});
