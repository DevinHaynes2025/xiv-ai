import test from 'node:test';
import assert from 'node:assert/strict';

import {
  verifyXviConnectedPeer,
} from './xvi-peer-address-policy';

import {
  authorizeXviGovernedFetch,
} from './xvi-governed-fetch-policy';

import {
  verifyXviPayloadIntegrity,
} from './xvi-payload-integrity';
import {
  authorizeXviTransportDestination,
} from './xvi-transport-policy';

function fetchReceipt(
  maxResponseBytes = 1024,
) {
  const transportReceipt =
    authorizeXviTransportDestination({
      canonicalOrigin: 'https://api.example.test',
      hostname: 'api.example.test',
      resolvedAddresses: ['8.8.8.8'],
    });

  const peerReceipt =
    verifyXviConnectedPeer({
      transportReceipt,
      connectedAddress:
        '8.8.8.8',
    });

  return authorizeXviGovernedFetch({
    method:
      'GET',

    protocol:
      'https:',

    redirectMode:
      'error',

    credentialsMode:
      'omit',

    timeoutMs:
      5_000,

    maxResponseBytes,

    expectedMimeTypes: [
      'application/json',
    ],

    observedMimeType:
      'application/json; charset=utf-8',

    peerReceipt,
  });
}

function payload(
  value = '{"ok":true}',
): Uint8Array {
  return new TextEncoder().encode(
    value,
  );
}

test('valid payload passes', () => {
  const receipt =
    verifyXviPayloadIntegrity({
      payload:
        payload(),

      fetchReceipt:
        fetchReceipt(),

      requireNonEmpty:
        true,
    });

  assert.equal(
    receipt.withinBudget,
    true,
  );

  assert.equal(
    receipt.byteLength > 0,
    true,
  );
});

test('payload at exact byte limit passes', () => {
  const body =
    new Uint8Array(32);

  const receipt =
    verifyXviPayloadIntegrity({
      payload:
        body,

      fetchReceipt:
        fetchReceipt(32),

      requireNonEmpty:
        true,
    });

  assert.equal(
    receipt.byteLength,
    32,
  );
});

test('oversized payload fails closed', () => {
  assert.throws(
    () =>
      verifyXviPayloadIntegrity({
        payload:
          new Uint8Array(33),

        fetchReceipt:
          fetchReceipt(32),

        requireNonEmpty:
          true,
      }),
    /XVI_PAYLOAD_INTEGRITY_REFUSED/,
  );
});

test('required non-empty payload fails when empty', () => {
  assert.throws(
    () =>
      verifyXviPayloadIntegrity({
        payload:
          new Uint8Array(0),

        fetchReceipt:
          fetchReceipt(),

        requireNonEmpty:
          true,
      }),
    /XVI_PAYLOAD_INTEGRITY_REFUSED/,
  );
});

test('empty payload may pass when explicitly allowed', () => {
  const receipt =
    verifyXviPayloadIntegrity({
      payload:
        new Uint8Array(0),

      fetchReceipt:
        fetchReceipt(),

      requireNonEmpty:
        false,
    });

  assert.equal(
    receipt.byteLength,
    0,
  );
});

test('same payload produces stable SHA-256', () => {
  const first =
    verifyXviPayloadIntegrity({
      payload:
        payload('same'),

      fetchReceipt:
        fetchReceipt(),

      requireNonEmpty:
        true,
    });

  const second =
    verifyXviPayloadIntegrity({
      payload:
        payload('same'),

      fetchReceipt:
        fetchReceipt(),

      requireNonEmpty:
        true,
    });

  assert.equal(
    first.sha256,
    second.sha256,
  );
});

test('mutated payload produces different SHA-256', () => {
  const first =
    verifyXviPayloadIntegrity({
      payload:
        payload('alpha'),

      fetchReceipt:
        fetchReceipt(),

      requireNonEmpty:
        true,
    });

  const second =
    verifyXviPayloadIntegrity({
      payload:
        payload('beta'),

      fetchReceipt:
        fetchReceipt(),

      requireNonEmpty:
        true,
    });

  assert.notEqual(
    first.sha256,
    second.sha256,
  );
});

test('receipt carries normalized MIME type', () => {
  const receipt =
    verifyXviPayloadIntegrity({
      payload:
        payload(),

      fetchReceipt:
        fetchReceipt(),

      requireNonEmpty:
        true,
    });

  assert.equal(
    receipt.observedMimeType,
    'application/json',
  );
});

test('receipt is immutable and zero authority', () => {
  const receipt =
    verifyXviPayloadIntegrity({
      payload:
        payload(),

      fetchReceipt:
        fetchReceipt(),

      requireNonEmpty:
        true,
    });

  assert.equal(
    Object.isFrozen(receipt),
    true,
  );

  assert.equal(
    receipt.networkCallPerformed,
    false,
  );

  assert.equal(
    receipt.productionAuthority,
    false,
  );
});

test('forged governed fetch receipt fails closed', () => {
  const receipt = fetchReceipt();

  assert.throws(
    () =>
      verifyXviPayloadIntegrity({
        payload: payload(),
        fetchReceipt: {
          ...receipt,
        },
        requireNonEmpty: true,
      }),
    /XVI_PAYLOAD_INTEGRITY_REFUSED/,
  );
});