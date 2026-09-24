import test from 'node:test';
import assert from 'node:assert/strict';

import {
  admitXviSource,
} from '../xvi-source-validator';

import {
  createXviFetchRequest,
} from './xvi-fetch-request';

import {
  authorizeXviSupervisedFetch,
} from './xvi-supervised-fetch';

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

  const request =
    createXviFetchRequest({
      sourceId:
        source.manifest.sourceId,

      manifestDigest:
        source.manifestDigest,

      canonicalOrigin:
        'https://api.worldbank.org',

      endpointPath:
        '/v2/country?format=json',

      purpose:
        'Retrieve governed public country metadata.',

      maximumResponseBytes:
        1_048_576,

      timeoutMs:
        10_000,

      requestsPerMinute:
        10,
    });

  return {
    source,
    request,
  };
}

test('matching admitted source becomes supervised-fetch eligible', () => {
  const receipt =
    authorizeXviSupervisedFetch(
      chain(),
    );

  assert.equal(
    receipt.decision,
    'SUPERVISED_FETCH_ELIGIBLE',
  );

  assert.equal(
    receipt.networkCallPerformed,
    false,
  );
});

test('source identity mismatch fails closed', () => {
  const value =
    chain();

  assert.throws(
    () =>
      authorizeXviSupervisedFetch({
        ...value,

        request: {
          ...value.request,
          sourceId:
            'other-source',
        },
      }),
    /XVI_SUPERVISED_FETCH_REFUSED/,
  );
});

test('manifest mismatch fails closed', () => {
  const value =
    chain();

  assert.throws(
    () =>
      authorizeXviSupervisedFetch({
        ...value,

        request: {
          ...value.request,
          manifestDigest:
            'f'.repeat(64),
        },
      }),
    /XVI_SUPERVISED_FETCH_REFUSED/,
  );
});

test('origin substitution fails closed', () => {
  const value =
    chain();

  assert.throws(
    () =>
      authorizeXviSupervisedFetch({
        ...value,

        request: {
          ...value.request,
          canonicalOrigin:
            'https://evil.example',
        },
      }),
    /XVI_SUPERVISED_FETCH_REFUSED/,
  );
});

test('network authority escalation fails closed', () => {
  const value =
    chain();

  assert.throws(
    () =>
      authorizeXviSupervisedFetch({
        ...value,

        request: {
          ...value.request,
          networkAuthority: true,
        },
      } as never),
    /XVI_SUPERVISED_FETCH_REFUSED/,
  );
});

test('redirect escalation fails closed', () => {
  const value =
    chain();

  assert.throws(
    () =>
      authorizeXviSupervisedFetch({
        ...value,

        request: {
          ...value.request,
          followsRedirects: true,
        },
      } as never),
    /XVI_SUPERVISED_FETCH_REFUSED/,
  );
});

test('credential escalation fails closed', () => {
  const value =
    chain();

  assert.throws(
    () =>
      authorizeXviSupervisedFetch({
        ...value,

        request: {
          ...value.request,
          sendsCredentials: true,
        },
      } as never),
    /XVI_SUPERVISED_FETCH_REFUSED/,
  );
});

test('returned content execution escalation fails closed', () => {
  const value =
    chain();

  assert.throws(
    () =>
      authorizeXviSupervisedFetch({
        ...value,

        request: {
          ...value.request,
          executesReturnedContent:
            true,
        },
      } as never),
    /XVI_SUPERVISED_FETCH_REFUSED/,
  );
});

test('authorization input accessors fail closed without invocation', () => {
  const candidate =
    chain() as Record<
      string,
      unknown
    >;

  let invoked = 0;

  Object.defineProperty(
    candidate,
    'request',
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
      authorizeXviSupervisedFetch(
        candidate as never,
      ),
    /XVI_SUPERVISED_FETCH_REFUSED/,
  );

  assert.equal(invoked, 0);
});

test('eligibility receipt still performs nothing', () => {
  const receipt =
    authorizeXviSupervisedFetch(
      chain(),
    );

  assert.equal(
    receipt.networkCallPerformed,
    false,
  );

  assert.equal(
    receipt.credentialsSent,
    false,
  );

  assert.equal(
    receipt.redirectFollowed,
    false,
  );

  assert.equal(
    receipt.contentExecuted,
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
