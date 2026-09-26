import test from 'node:test';
import assert from 'node:assert/strict';

import {
  verifyXviConnectedPeer,
} from './xvi-peer-address-policy';

import {
  authorizeXviGovernedFetch,
} from './xvi-governed-fetch-policy';
import {
  authorizeXviTransportDestination,
} from './xvi-transport-policy';

function peerReceipt() {
  const transportReceipt =
    authorizeXviTransportDestination({
      canonicalOrigin: 'https://api.example.test',
      hostname: 'api.example.test',
      resolvedAddresses: ['8.8.8.8'],
    });

  return verifyXviConnectedPeer({
    transportReceipt,
    connectedAddress:
      '8.8.8.8',
  });
}

function input() {
  return {
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

    maxResponseBytes:
      256 * 1024,

    expectedMimeTypes: [
      'application/json',
    ],

    observedMimeType:
      'application/json; charset=utf-8',

    peerReceipt:
      peerReceipt(),
  };
}

test('valid governed fetch policy passes', () => {
  const receipt =
    authorizeXviGovernedFetch(
      input(),
    );

  assert.equal(
    receipt.method,
    'GET',
  );

  assert.equal(
    receipt.observedMimeType,
    'application/json',
  );
});

test('POST fails closed', () => {
  assert.throws(
    () =>
      authorizeXviGovernedFetch({
        ...input(),
        method:
          'POST',
      }),
    /XVI_GOVERNED_FETCH_POLICY_REFUSED/,
  );
});

test('HTTP fails closed', () => {
  assert.throws(
    () =>
      authorizeXviGovernedFetch({
        ...input(),
        protocol:
          'http:',
      }),
    /XVI_GOVERNED_FETCH_POLICY_REFUSED/,
  );
});

test('redirect following fails closed', () => {
  assert.throws(
    () =>
      authorizeXviGovernedFetch({
        ...input(),
        redirectMode:
          'follow',
      }),
    /XVI_GOVERNED_FETCH_POLICY_REFUSED/,
  );
});

test('credential inclusion fails closed', () => {
  assert.throws(
    () =>
      authorizeXviGovernedFetch({
        ...input(),
        credentialsMode:
          'include',
      }),
    /XVI_GOVERNED_FETCH_POLICY_REFUSED/,
  );
});

test('oversized response budget fails closed', () => {
  assert.throws(
    () =>
      authorizeXviGovernedFetch({
        ...input(),
        maxResponseBytes:
          100 * 1024 * 1024,
      }),
    /XVI_GOVERNED_FETCH_POLICY_REFUSED/,
  );
});

test('unsupported MIME type fails closed', () => {
  assert.throws(
    () =>
      authorizeXviGovernedFetch({
        ...input(),
        observedMimeType:
          'text/html',
      }),
    /XVI_GOVERNED_FETCH_POLICY_REFUSED/,
  );
});

test('invalid timeout fails closed', () => {
  assert.throws(
    () =>
      authorizeXviGovernedFetch({
        ...input(),
        timeoutMs:
          0,
      }),
    /XVI_GOVERNED_FETCH_POLICY_REFUSED/,
  );
});

test('receipt carries zero authority', () => {
  const receipt =
    authorizeXviGovernedFetch(
      input(),
    );

  assert.equal(
    receipt.networkCallPerformed,
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
      receipt.expectedMimeTypes,
    ),
    true,
  );
});

test('forged peer policy receipt fails closed', () => {
  const genuine = peerReceipt();

  assert.throws(
    () =>
      authorizeXviGovernedFetch({
        ...input(),
        peerReceipt: {
          ...genuine,
          connectedAddress: '1.1.1.1',
        },
      }),
    /XVI_GOVERNED_FETCH_POLICY_REFUSED/,
  );
});

test('private destination cannot reach governed fetch authorization', () => {
  assert.throws(
    () => {
      const transportReceipt =
        authorizeXviTransportDestination({
          canonicalOrigin: 'https://loopback.example.test',
          hostname: 'loopback.example.test',
          resolvedAddresses: ['127.0.0.1'],
        });
      const peer = verifyXviConnectedPeer({
        transportReceipt,
        connectedAddress: '127.0.0.1',
      });
      authorizeXviGovernedFetch({
        ...input(),
        peerReceipt: peer,
      });
    },
    /XVI_TRANSPORT_POLICY_REFUSED/,
  );
});

test('valid public transport-to-peer-to-fetch chain succeeds locally', () => {
  const transportReceipt =
    authorizeXviTransportDestination({
      canonicalOrigin: 'https://api.example.test',
      hostname: 'api.example.test',
      resolvedAddresses: ['8.8.8.8'],
    });
  const peer = verifyXviConnectedPeer({
    transportReceipt,
    connectedAddress: '8.8.8.8',
  });
  const receipt = authorizeXviGovernedFetch({
    ...input(),
    peerReceipt: peer,
  });

  assert.equal(receipt.peerApproved, true);
  assert.equal(receipt.networkCallPerformed, false);
});