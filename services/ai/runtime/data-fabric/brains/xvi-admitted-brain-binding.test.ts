import test from 'node:test';
import assert from 'node:assert/strict';

import {
  admitXviSource,
} from '../xvi-source-validator';

import {
  bindAdmittedSourceToBrains,
} from './xvi-admitted-brain-binding';

function admitted() {
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

test('admitted source binds to declared brains', () => {
  const result =
    bindAdmittedSourceToBrains(
      admitted(),
    );

  assert.deepEqual(
    result.brainTargets,
    [
      'MACRO',
      'FINANCIAL',
      'GOVERNMENT',
      'SUPPLY_CHAIN',
      'GOVERNANCE',
    ],
  );

  assert.equal(
    result.admissionVerified,
    true,
  );

  assert.equal(
    result.routingVerified,
    true,
  );
});

test('brain binding carries zero execution authority', () => {
  const result =
    bindAdmittedSourceToBrains(
      admitted(),
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

test('forged admission digest fails closed', () => {
  const source =
    admitted();

  assert.throws(
    () =>
      bindAdmittedSourceToBrains({
        ...source,
        manifestDigest:
          'z'.repeat(64),
      }),
    /XVI_ADMITTED_BRAIN_BINDING_REFUSED/,
  );
});

test('authority escalation fails closed', () => {
  const source =
    admitted();

  assert.throws(
    () =>
      bindAdmittedSourceToBrains({
        ...source,
        networkAuthority: true,
      } as never),
    /XVI_ADMITTED_BRAIN_BINDING_REFUSED/,
  );

  assert.throws(
    () =>
      bindAdmittedSourceToBrains({
        ...source,
        executesFetch: true,
      } as never),
    /XVI_ADMITTED_BRAIN_BINDING_REFUSED/,
  );
});

test('binding output is frozen', () => {
  const result =
    bindAdmittedSourceToBrains(
      admitted(),
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
});
