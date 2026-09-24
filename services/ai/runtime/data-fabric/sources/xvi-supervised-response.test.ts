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

import {
  admitXviSupervisedResponse,
} from './xvi-supervised-response';

function authorization() {
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

  return authorizeXviSupervisedFetch({
    source,
    request,
  });
}

function response() {
  return {
    authorization:
      authorization(),

    statusCode:
      200,

    contentType:
      'application/json',

    payload:
      JSON.stringify({
        page: 1,
        total: 1,
        data: [
          {
            id: 'USA',
            name:
              'United States',
          },
        ],
      }),

    redirectOccurred:
      false,
  };
}

test('valid bounded JSON response becomes quarantine eligible', () => {
  const result =
    admitXviSupervisedResponse(
      response(),
    );

  assert.equal(
    result.eligibleForQuarantine,
    true,
  );

  assert.equal(
    result.statusCode,
    200,
  );

  assert.equal(
    result.contentType,
    'application/json',
  );

  assert.match(
    result.contentDigest,
    /^[a-f0-9]{64}$/,
  );
});

test('redirected response fails closed', () => {
  assert.throws(
    () =>
      admitXviSupervisedResponse({
        ...response(),
        redirectOccurred:
          true,
      }),
    /XVI_SUPERVISED_RESPONSE_REFUSED/,
  );
});

test('non-200 response fails closed', () => {
  assert.throws(
    () =>
      admitXviSupervisedResponse({
        ...response(),
        statusCode:
          302,
      }),
    /XVI_SUPERVISED_RESPONSE_REFUSED/,
  );
});

test('unexpected content type fails closed', () => {
  assert.throws(
    () =>
      admitXviSupervisedResponse({
        ...response(),
        contentType:
          'text/html',
      }),
    /XVI_SUPERVISED_RESPONSE_REFUSED/,
  );
});

test('malformed json fails closed', () => {
  assert.throws(
    () =>
      admitXviSupervisedResponse({
        ...response(),
        payload:
          '{broken',
      }),
    /XVI_SUPERVISED_RESPONSE_REFUSED/,
  );
});

test('empty payload fails closed', () => {
  assert.throws(
    () =>
      admitXviSupervisedResponse({
        ...response(),
        payload:
          '',
      }),
    /XVI_SUPERVISED_RESPONSE_REFUSED/,
  );
});

test('oversized payload fails closed', () => {
  const value =
    response();

  const constrained = {
    ...value,

    authorization: {
      ...value.authorization,

      maximumResponseBytes:
        8,
    },
  };

  assert.throws(
    () =>
      admitXviSupervisedResponse(
        constrained,
      ),
    /XVI_SUPERVISED_RESPONSE_REFUSED/,
  );
});

test('authorization escalation fails closed', () => {
  const value =
    response();

  assert.throws(
    () =>
      admitXviSupervisedResponse({
        ...value,

        authorization: {
          ...value.authorization,

          productionAuthority:
            true,
        },
      } as never),
    /XVI_SUPERVISED_RESPONSE_REFUSED/,
  );
});

test('response accessors fail closed without invocation', () => {
  const candidate =
    response() as Record<
      string,
      unknown
    >;

  let invoked = 0;

  Object.defineProperty(
    candidate,
    'payload',
    {
      enumerable: true,

      get() {
        invoked += 1;
        return '{}';
      },
    },
  );

  assert.throws(
    () =>
      admitXviSupervisedResponse(
        candidate as never,
      ),
    /XVI_SUPERVISED_RESPONSE_REFUSED/,
  );

  assert.equal(invoked, 0);
});

test('response receipt executes nothing', () => {
  const result =
    admitXviSupervisedResponse(
      response(),
    );

  assert.equal(
    result.networkAuthority,
    false,
  );

  assert.equal(
    result.executesContent,
    false,
  );

  assert.equal(
    result.executesTraining,
    false,
  );

  assert.equal(
    result.productionAuthority,
    false,
  );

  assert.equal(
    Object.isFrozen(result),
    true,
  );
});
