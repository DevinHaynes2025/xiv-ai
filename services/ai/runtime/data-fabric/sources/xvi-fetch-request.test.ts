import test from 'node:test';
import assert from 'node:assert/strict';

import {
  createXviFetchRequest,
} from './xvi-fetch-request';

function input() {
  return {
    sourceId:
      'world-bank-public',

    manifestDigest:
      'a'.repeat(64),

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
  };
}

test('bounded GET request is described without execution', () => {
  const request =
    createXviFetchRequest(
      input(),
    );

  assert.equal(
    request.method,
    'GET',
  );

  assert.equal(
    request.executesFetch,
    false,
  );

  assert.equal(
    request.networkAuthority,
    false,
  );

  assert.equal(
    request.sendsCredentials,
    false,
  );

  assert.equal(
    request.followsRedirects,
    false,
  );

  assert.equal(
    request.executesReturnedContent,
    false,
  );
});

test('identical fetch requests have identical digests', () => {
  const first =
    createXviFetchRequest(
      input(),
    );

  const second =
    createXviFetchRequest(
      input(),
    );

  assert.equal(
    first.requestDigest,
    second.requestDigest,
  );
});

test('endpoint changes request identity', () => {
  const first =
    createXviFetchRequest(
      input(),
    );

  const second =
    createXviFetchRequest({
      ...input(),

      endpointPath:
        '/v2/incomeLevel?format=json',
    });

  assert.notEqual(
    first.requestDigest,
    second.requestDigest,
  );
});

test('http origins fail closed', () => {
  assert.throws(
    () =>
      createXviFetchRequest({
        ...input(),

        canonicalOrigin:
          'http://api.worldbank.org',
      }),
    /XVI_FETCH_REQUEST_REFUSED/,
  );
});

test('credential-bearing origins fail closed', () => {
  assert.throws(
    () =>
      createXviFetchRequest({
        ...input(),

        canonicalOrigin:
          'https://user:password@example.com',
      }),
    /XVI_FETCH_REQUEST_REFUSED/,
  );
});

test('origin paths fail closed', () => {
  assert.throws(
    () =>
      createXviFetchRequest({
        ...input(),

        canonicalOrigin:
          'https://example.com/private',
      }),
    /XVI_FETCH_REQUEST_REFUSED/,
  );
});

test('scheme-relative endpoint fails closed', () => {
  assert.throws(
    () =>
      createXviFetchRequest({
        ...input(),

        endpointPath:
          '//evil.example/payload',
      }),
    /XVI_FETCH_REQUEST_REFUSED/,
  );
});

test('response budget fails closed', () => {
  assert.throws(
    () =>
      createXviFetchRequest({
        ...input(),

        maximumResponseBytes:
          16 * 1024 * 1024 + 1,
      }),
    /XVI_FETCH_REQUEST_REFUSED/,
  );
});

test('timeout budget fails closed', () => {
  assert.throws(
    () =>
      createXviFetchRequest({
        ...input(),

        timeoutMs:
          30_001,
      }),
    /XVI_FETCH_REQUEST_REFUSED/,
  );
});

test('rate budget fails closed', () => {
  assert.throws(
    () =>
      createXviFetchRequest({
        ...input(),

        requestsPerMinute:
          61,
      }),
    /XVI_FETCH_REQUEST_REFUSED/,
  );
});

test('accessors fail closed without invocation', () => {
  const candidate =
    input() as Record<
      string,
      unknown
    >;

  let invoked = 0;

  Object.defineProperty(
    candidate,
    'endpointPath',
    {
      enumerable: true,

      get() {
        invoked += 1;
        return '/evil';
      },
    },
  );

  assert.throws(
    () =>
      createXviFetchRequest(
        candidate as never,
      ),
    /XVI_FETCH_REQUEST_REFUSED/,
  );

  assert.equal(
    invoked,
    0,
  );
});

test('undeclared execution authority fails closed', () => {
  assert.throws(
    () =>
      createXviFetchRequest({
        ...input(),
        networkAuthority: true,
      } as never),
    /XVI_FETCH_REQUEST_REFUSED/,
  );
});

test('request receipt is frozen', () => {
  const request =
    createXviFetchRequest(
      input(),
    );

  assert.equal(
    Object.isFrozen(request),
    true,
  );
});
