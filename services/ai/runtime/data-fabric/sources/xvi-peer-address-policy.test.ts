import test from 'node:test';
import assert from 'node:assert/strict';

import {
  verifyXviConnectedPeer,
} from './xvi-peer-address-policy';
import type {
  XviPeerAddressPolicyInput,
} from './xvi-peer-address-policy';
import {
  authorizeXviTransportDestination,
} from './xvi-transport-policy';

function input() {
  return {
    transportReceipt:
      authorizeXviTransportDestination({
        canonicalOrigin: 'https://api.example.test',
        hostname: 'api.example.test',
        resolvedAddresses: ['8.8.8.8', '1.1.1.1'],
      }),

    connectedAddress:
      '8.8.8.8',
  };
}

test('approved connected peer passes', () => {
  const receipt =
    verifyXviConnectedPeer(
      input(),
    );

  assert.equal(
    receipt.peerApproved,
    true,
  );

  assert.equal(
    receipt.connectedAddress,
    '8.8.8.8',
  );
});

test('different public peer fails closed', () => {
  assert.throws(
    () =>
      verifyXviConnectedPeer({
        ...input(),

        connectedAddress:
          '9.9.9.9',
      }),
    /XVI_PEER_ADDRESS_POLICY_REFUSED/,
  );
});

test('loopback peer fails when not approved', () => {
  assert.throws(
    () =>
      verifyXviConnectedPeer({
        ...input(),

        connectedAddress:
          '127.0.0.1',
      }),
    /XVI_PEER_ADDRESS_POLICY_REFUSED/,
  );
});

test('malformed connected peer fails closed', () => {
  assert.throws(
    () =>
      verifyXviConnectedPeer({
        ...input(),

        connectedAddress:
          'not-an-ip',
      }),
    /XVI_PEER_ADDRESS_POLICY_REFUSED/,
  );
});

test('manual approved-list injection cannot create peer authority', () => {
  assert.throws(
    () =>
      verifyXviConnectedPeer({
        approvedAddresses: ['127.0.0.1'],
        connectedAddress: '127.0.0.1',
      } as unknown as XviPeerAddressPolicyInput),
    /XVI_PEER_ADDRESS_POLICY_REFUSED/,
  );
});

test('forged transport receipt fails closed', () => {
  const genuine = input().transportReceipt;
  assert.throws(
    () =>
      verifyXviConnectedPeer({
        transportReceipt: {
          ...genuine,
          resolvedAddresses: ['1.1.1.1'],
        },
        connectedAddress: '8.8.8.8',
      }),
    /XVI_PEER_ADDRESS_POLICY_REFUSED/,
  );
});

test('changed destination invalidates the transport receipt', () => {
  const transportReceipt =
    authorizeXviTransportDestination({
      canonicalOrigin: 'https://api-a.example.test',
      hostname: 'api-a.example.test',
      resolvedAddresses: ['8.8.8.8'],
    });

  assert.throws(
    () =>
      verifyXviConnectedPeer({
        transportReceipt: {
          ...transportReceipt,
          canonicalOrigin: 'https://api-b.example.test',
          hostname: 'api-b.example.test',
        },
        connectedAddress: '8.8.8.8',
      }),
    /XVI_PEER_ADDRESS_POLICY_REFUSED/,
  );
});

test('transport receipt from destination A cannot authorize destination B', () => {
  const transportReceiptA =
    authorizeXviTransportDestination({
      canonicalOrigin: 'https://api-a.example.test',
      hostname: 'api-a.example.test',
      resolvedAddresses: ['8.8.8.8'],
    });
  const transportReceiptB =
    authorizeXviTransportDestination({
      canonicalOrigin: 'https://api-b.example.test',
      hostname: 'api-b.example.test',
      resolvedAddresses: ['1.1.1.1'],
    });
  assert.equal(
    transportReceiptB.resolvedAddresses.includes('1.1.1.1'),
    true,
  );

  assert.throws(
    () =>
      verifyXviConnectedPeer({
        transportReceipt: transportReceiptA,
        connectedAddress: '1.1.1.1',
      }),
    /XVI_PEER_ADDRESS_POLICY_REFUSED/,
  );
});

test('connected peer outside the authorized address set fails closed', () => {
  assert.throws(
    () =>
      verifyXviConnectedPeer({
        ...input(),
        connectedAddress: '9.9.9.9',
      }),
    /XVI_PEER_ADDRESS_POLICY_REFUSED/,
  );
});

test('receipt carries zero execution authority', () => {
  const receipt =
    verifyXviConnectedPeer(
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
      receipt.approvedAddresses,
    ),
    true,
  );
});