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
  createXviProvenanceEnvelope,
} from './xvi-provenance-envelope';
import {
  authorizeXviTransportDestination,
} from './xvi-transport-policy';

function payloadReceipt(
  body = '{"ok":true}',
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

  const fetchReceipt =
    authorizeXviGovernedFetch({
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
        1024,

      expectedMimeTypes: [
        'application/json',
      ],

      observedMimeType:
        'application/json; charset=utf-8',

      peerReceipt,
    });

  return verifyXviPayloadIntegrity({
    payload:
      new TextEncoder().encode(
        body,
      ),

    fetchReceipt,

    requireNonEmpty:
      true,
  });
}

function input() {
  return {
    sourceId:
      'world-bank-indicators',

    canonicalOrigin:
      'https://api.worldbank.org',

    hostname:
      'api.worldbank.org',

    approvedAddresses: [
      '8.8.8.8',
    ],

    connectedAddress:
      '8.8.8.8',

    payloadReceipt:
      payloadReceipt(),

    retrievedAt:
      '2026-09-24T21:30:00.000Z',

    requestNonce:
      'nonce-000000000001',

    correlationId:
      'corr-0001',

    previousReceiptHash:
      null,
  };
}

test('valid provenance envelope passes', () => {
  const receipt =
    createXviProvenanceEnvelope(
      input(),
    );

  assert.equal(
    receipt.version,
    'xvi-provenance-envelope-v1',
  );

  assert.equal(
    receipt.receiptHash.length,
    64,
  );
});

test('identical input produces deterministic hash', () => {
  const first =
    createXviProvenanceEnvelope(
      input(),
    );

  const second =
    createXviProvenanceEnvelope(
      input(),
    );

  assert.equal(
    first.receiptHash,
    second.receiptHash,
  );
});

test('changed payload changes receipt hash', () => {
  const first =
    createXviProvenanceEnvelope(
      input(),
    );

  const second =
    createXviProvenanceEnvelope({
      ...input(),
      payloadReceipt:
        payloadReceipt(
          '{"ok":false}',
        ),
    });

  assert.notEqual(
    first.receiptHash,
    second.receiptHash,
  );
});

test('changed source changes receipt hash', () => {
  const first =
    createXviProvenanceEnvelope(
      input(),
    );

  const second =
    createXviProvenanceEnvelope({
      ...input(),
      sourceId:
        'sec-edgar',
    });

  assert.notEqual(
    first.receiptHash,
    second.receiptHash,
  );
});

test('short nonce fails closed', () => {
  assert.throws(
    () =>
      createXviProvenanceEnvelope({
        ...input(),
        requestNonce:
          'short',
      }),
    /XVI_PROVENANCE_ENVELOPE_REFUSED/,
  );
});

test('short correlation ID fails closed', () => {
  assert.throws(
    () =>
      createXviProvenanceEnvelope({
        ...input(),
        correlationId:
          'x',
      }),
    /XVI_PROVENANCE_ENVELOPE_REFUSED/,
  );
});

test('invalid previous receipt hash fails closed', () => {
  assert.throws(
    () =>
      createXviProvenanceEnvelope({
        ...input(),
        previousReceiptHash:
          'not-a-sha256',
      }),
    /XVI_PROVENANCE_ENVELOPE_REFUSED/,
  );
});

test('previous receipt hash participates in chain', () => {
  const first =
    createXviProvenanceEnvelope(
      input(),
    );

  const second =
    createXviProvenanceEnvelope({
      ...input(),

      requestNonce:
        'nonce-000000000002',

      previousReceiptHash:
        first.receiptHash,
    });

  assert.equal(
    second.previousReceiptHash,
    first.receiptHash,
  );

  assert.notEqual(
    second.receiptHash,
    first.receiptHash,
  );
});

test('receipt is immutable and zero authority', () => {
  const receipt =
    createXviProvenanceEnvelope(
      input(),
    );

  assert.equal(
    Object.isFrozen(receipt),
    true,
  );

  assert.equal(
    Object.isFrozen(
      receipt.approvedAddresses,
    ),
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

test('forged payload integrity metadata fails closed', () => {
  const genuine = input().payloadReceipt;
  assert.throws(
    () =>
      createXviProvenanceEnvelope({
        ...input(),
        payloadReceipt: {
          ...genuine,
          byteLength: -1,
          sha256: 'not-a-digest',
        },
      }),
    /XVI_PROVENANCE_ENVELOPE_REFUSED/,
  );
});

test('peer metadata must match the verified fetch receipt', () => {
  assert.throws(
    () =>
      createXviProvenanceEnvelope({
        ...input(),
        approvedAddresses: [
          '1.1.1.1',
        ],
        connectedAddress: '1.1.1.1',
      }),
    /XVI_PROVENANCE_ENVELOPE_REFUSED/,
  );
});