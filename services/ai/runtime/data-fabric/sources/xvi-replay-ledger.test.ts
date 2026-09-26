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
  XviReplayLedger,
} from './xvi-replay-ledger';
import {
  authorizeXviTransportDestination,
} from './xvi-transport-policy';

function envelope(
  nonce = 'nonce-000000000001',
  correlationId = 'corr-0001',
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

  const payloadReceipt =
    verifyXviPayloadIntegrity({
      payload:
        new TextEncoder().encode(
          body,
        ),

      fetchReceipt,

      requireNonEmpty:
        true,
    });

  return createXviProvenanceEnvelope({
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

    payloadReceipt,

    retrievedAt:
      '2026-09-24T21:30:00.000Z',

    requestNonce:
      nonce,

    correlationId,

    previousReceiptHash:
      null,
  });
}

test('first adoption succeeds', () => {
  const ledger =
    new XviReplayLedger();

  const receipt =
    ledger.adopt(
      envelope(),
    );

  assert.equal(
    receipt.adopted,
    true,
  );

  assert.equal(
    ledger.size,
    1,
  );
});

test('identical replay fails closed', () => {
  const ledger =
    new XviReplayLedger();

  const item =
    envelope();

  ledger.adopt(item);

  assert.throws(
    () =>
      ledger.adopt(item),
    /XVI_REPLAY_LEDGER_REFUSED/,
  );
});

test('same nonce and correlation fails closed', () => {
  const ledger =
    new XviReplayLedger();

  ledger.adopt(
    envelope(
      'nonce-000000000010',
      'corr-0010',
      '{"version":1}',
    ),
  );

  assert.throws(
    () =>
      ledger.adopt(
        envelope(
          'nonce-000000000010',
          'corr-0010',
          '{"version":2}',
        ),
      ),
    /XVI_REPLAY_LEDGER_REFUSED/,
  );
});

test('new nonce may be adopted', () => {
  const ledger =
    new XviReplayLedger();

  ledger.adopt(
    envelope(
      'nonce-000000000020',
      'corr-0020',
    ),
  );

  ledger.adopt(
    envelope(
      'nonce-000000000021',
      'corr-0020',
    ),
  );

  assert.equal(
    ledger.size,
    2,
  );
});

test('different correlation may be adopted with new nonce', () => {
  const ledger =
    new XviReplayLedger();

  ledger.adopt(
    envelope(
      'nonce-000000000030',
      'corr-0030',
    ),
  );

  ledger.adopt(
    envelope(
      'nonce-000000000031',
      'corr-0031',
    ),
  );

  assert.equal(
    ledger.size,
    2,
  );
});

test('receipt lookup works', () => {
  const ledger =
    new XviReplayLedger();

  const item =
    envelope();

  ledger.adopt(item);

  assert.equal(
    ledger.hasReceipt(
      item.receiptHash,
    ),
    true,
  );
});

test('unknown receipt is absent', () => {
  const ledger =
    new XviReplayLedger();

  assert.equal(
    ledger.hasReceipt(
      '0'.repeat(64),
    ),
    false,
  );
});

test('adoption receipt is immutable and zero authority', () => {
  const ledger =
    new XviReplayLedger();

  const receipt =
    ledger.adopt(
      envelope(),
    );

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

test('forged provenance receipt fails closed', () => {
  const genuine = envelope();
  const forged = {
    ...genuine,
    receiptHash: 'forged-receipt-hash',
  };
  assert.throws(
    () => new XviReplayLedger().adopt(forged),
    /XVI_REPLAY_LEDGER_REFUSED/,
  );
});