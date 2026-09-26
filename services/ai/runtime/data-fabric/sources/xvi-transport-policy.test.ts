import test from 'node:test';
import assert from 'node:assert/strict';

import {
  authorizeXviTransportDestination,
  isXviTransportPolicyReceipt,
} from './xvi-transport-policy';

function input() {
  return {
    canonicalOrigin:
      'https://api.worldbank.org',

    hostname:
      'api.worldbank.org',

    resolvedAddresses: [
      '8.8.8.8',
    ],
  };
}

test('public HTTPS destination is policy eligible', () => {
  const receipt =
    authorizeXviTransportDestination(
      input(),
    );

  assert.equal(
    receipt.destinationApproved,
    true,
  );

  assert.equal(
    receipt.networkCallPerformed,
    false,
  );
});

test('loopback IPv4 fails closed', () => {
  assert.throws(
    () =>
      authorizeXviTransportDestination({
        ...input(),
        resolvedAddresses: [
          '127.0.0.1',
        ],
      }),
    /XVI_TRANSPORT_POLICY_REFUSED/,
  );
});

test('loopback and shorthand IPv4 representations fail closed', () => {
  for (const address of [
    '127.0.0.1',
    '127.1',
    '::1',
    '::ffff:127.0.0.1',
    '::ffff:7f00:1',
  ]) {
    assert.throws(
      () =>
        authorizeXviTransportDestination({
          ...input(),
          resolvedAddresses: [address],
        }),
      /XVI_TRANSPORT_POLICY_REFUSED/,
      address,
    );
  }
});

test('RFC1918 addresses fail closed', () => {
  for (const address of [
    '10.0.0.1',
    '172.16.0.1',
    '192.168.1.1',
  ]) {
    assert.throws(
      () =>
        authorizeXviTransportDestination({
          ...input(),
          resolvedAddresses: [
            address,
          ],
        }),
      /XVI_TRANSPORT_POLICY_REFUSED/,
    );
  }
});

test('link-local metadata range fails closed', () => {
  assert.throws(
    () =>
      authorizeXviTransportDestination({
        ...input(),
        resolvedAddresses: [
          '169.254.169.254',
        ],
      }),
    /XVI_TRANSPORT_POLICY_REFUSED/,
  );
});

test('CGNAT space fails closed', () => {
  assert.throws(
    () =>
      authorizeXviTransportDestination({
        ...input(),
        resolvedAddresses: [
          '100.64.0.1',
        ],
      }),
    /XVI_TRANSPORT_POLICY_REFUSED/,
  );
});

test('loopback IPv6 fails closed', () => {
  assert.throws(
    () =>
      authorizeXviTransportDestination({
        ...input(),
        resolvedAddresses: [
          '::1',
        ],
      }),
    /XVI_TRANSPORT_POLICY_REFUSED/,
  );
});

test('unique-local IPv6 fails closed', () => {
  assert.throws(
    () =>
      authorizeXviTransportDestination({
        ...input(),
        resolvedAddresses: [
          'fd00::1',
        ],
      }),
    /XVI_TRANSPORT_POLICY_REFUSED/,
  );
});

test('IPv6 link-local fails closed', () => {
  assert.throws(
    () =>
      authorizeXviTransportDestination({
        ...input(),
        resolvedAddresses: [
          'fe80::1',
        ],
      }),
    /XVI_TRANSPORT_POLICY_REFUSED/,
  );
});

test('IPv4-mapped loopback fails closed', () => {
  assert.throws(
    () =>
      authorizeXviTransportDestination({
        ...input(),
        resolvedAddresses: [
          '::ffff:127.0.0.1',
        ],
      }),
    /XVI_TRANSPORT_POLICY_REFUSED/,
  );
});

test('origin hostname mismatch fails closed', () => {
  assert.throws(
    () =>
      authorizeXviTransportDestination({
        ...input(),
        hostname:
          'evil.example',
      }),
    /XVI_TRANSPORT_POLICY_REFUSED/,
  );
});

test('http origins fail closed', () => {
  assert.throws(
    () =>
      authorizeXviTransportDestination({
        ...input(),
        canonicalOrigin:
          'http://api.worldbank.org',
      }),
    /XVI_TRANSPORT_POLICY_REFUSED/,
  );
});

test('credential-bearing origins fail closed', () => {
  assert.throws(
    () =>
      authorizeXviTransportDestination({
        ...input(),
        canonicalOrigin:
          'https://user:pass@api.worldbank.org',
      }),
    /XVI_TRANSPORT_POLICY_REFUSED/,
  );
});

test('duplicate resolved addresses fail closed', () => {
  assert.throws(
    () =>
      authorizeXviTransportDestination({
        ...input(),
        resolvedAddresses: [
          '8.8.8.8',
          '8.8.8.8',
        ],
      }),
    /XVI_TRANSPORT_POLICY_REFUSED/,
  );
});

test('transport receipt carries zero authority', () => {
  const receipt =
    authorizeXviTransportDestination(
      input(),
    );

  assert.equal(
    receipt.credentialsAllowed,
    false,
  );

  assert.equal(
    receipt.redirectsAllowed,
    false,
  );

  assert.equal(
    receipt.privateAddressAllowed,
    false,
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
      receipt.resolvedAddresses,
    ),
    true,
  );
});

test('transport receipt verifier rejects mutated security fields', () => {
  const receipt =
    authorizeXviTransportDestination(input());

  assert.equal(
    isXviTransportPolicyReceipt(receipt),
    true,
  );
  assert.equal(
    isXviTransportPolicyReceipt({
      ...receipt,
      resolvedAddresses: ['127.0.0.1'],
    }),
    false,
  );
});

test('reserved and documentation IPv4 ranges fail closed', () => {
  for (const address of [
    '192.0.2.1',
    '198.51.100.1',
    '203.0.113.1',
    '192.0.0.1',
    '240.0.0.1',
    '255.255.255.255',
  ]) {
    assert.throws(
      () =>
        authorizeXviTransportDestination({
          ...input(),
          resolvedAddresses: [address],
        }),
      /XVI_TRANSPORT_POLICY_REFUSED/,
    );
  }
});

test('documentation, transition, and embedded IPv4 IPv6 ranges fail closed', () => {
  for (const address of [
    '2001:db8::1',
    '3fff::1',
    '::ffff:7f00:1',
    '2002:7f00:1::1',
    '64:ff9b::808:808',
  ]) {
    assert.throws(
      () =>
        authorizeXviTransportDestination({
          ...input(),
          resolvedAddresses: [address],
        }),
      /XVI_TRANSPORT_POLICY_REFUSED/,
      address,
    );
  }
});

test('public global IPv6 destination remains policy eligible', () => {
  const receipt = authorizeXviTransportDestination({
    ...input(),
    resolvedAddresses: ['2001:4860:4860::8888'],
  });
  assert.equal(receipt.destinationApproved, true);
});
