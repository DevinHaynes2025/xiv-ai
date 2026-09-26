import {
  createHash,
} from 'node:crypto';

import type {
  XviTransportPolicyReceipt,
} from './xvi-transport-policy';
import {
  isXviTransportPolicyReceipt,
} from './xvi-transport-policy';

export interface XviPeerAddressPolicyInput {
  transportReceipt:
    Readonly<XviTransportPolicyReceipt>;
  connectedAddress: string;
}

export interface XviPeerAddressPolicyReceipt {
  version:
    'xvi-peer-address-policy-v1';

  transportReceiptDigest: string;

  approvedAddresses:
    readonly string[];

  connectedAddress: string;

  receiptDigest: string;

  peerApproved: true;

  networkCallPerformed: false;
  productionAuthority: false;
}

const PEER_RECEIPTS = new WeakSet<object>();
const PEER_TRANSPORT_RECEIPTS =
  new WeakMap<object, Readonly<XviTransportPolicyReceipt>>();

function refuse(): never {
  throw new Error(
    'XVI_PEER_ADDRESS_POLICY_REFUSED',
  );
}

function canonicalizeReceipt(
  receipt: Omit<
    XviPeerAddressPolicyReceipt,
    'receiptDigest'
  >,
): string {
  return JSON.stringify({
    version: receipt.version,
    transportReceiptDigest: receipt.transportReceiptDigest,
    approvedAddresses: [...receipt.approvedAddresses],
    connectedAddress: receipt.connectedAddress,
    peerApproved: receipt.peerApproved,
    networkCallPerformed: receipt.networkCallPerformed,
    productionAuthority: receipt.productionAuthority,
  });
}

function digestReceipt(
  receipt: Omit<
    XviPeerAddressPolicyReceipt,
    'receiptDigest'
  >,
): string {
  return createHash('sha256')
    .update(canonicalizeReceipt(receipt))
    .digest('hex');
}

function exactInput(
  value: unknown,
): PropertyDescriptorMap {
  if (
    value === null ||
    typeof value !== 'object' ||
    Array.isArray(value) ||
    Object.getPrototypeOf(value) !==
      Object.prototype
  ) {
    refuse();
  }

  const expected = [
    'transportReceipt',
    'connectedAddress',
  ] as const;

  const descriptors =
    Object.getOwnPropertyDescriptors(value);

  const keys =
    Reflect.ownKeys(value);

  if (
    keys.length !== expected.length ||
    keys.some(
      key =>
        typeof key !== 'string' ||
        !expected.includes(
          key as
            (typeof expected)[number],
        ),
    )
  ) {
    refuse();
  }

  for (const key of expected) {
    const descriptor =
      descriptors[key];

    if (
      !descriptor ||
      !('value' in descriptor) ||
      descriptor.enumerable !== true
    ) {
      refuse();
    }
  }

  return descriptors;
}

export function verifyXviConnectedPeer(
  input: XviPeerAddressPolicyInput,
): Readonly<XviPeerAddressPolicyReceipt> {
  const descriptors =
    exactInput(input);

  const transportReceipt =
    descriptors.transportReceipt.value;

  const connectedAddress =
    descriptors.connectedAddress.value;

  if (
    !isXviTransportPolicyReceipt(transportReceipt) ||
    typeof connectedAddress !== 'string' ||
    !transportReceipt.resolvedAddresses.includes(
      connectedAddress,
    )
  ) {
    refuse();
  }

  const base = {
    version:
      'xvi-peer-address-policy-v1' as const,

    transportReceiptDigest:
      transportReceipt.receiptDigest,

    approvedAddresses:
      Object.freeze([
        ...transportReceipt.resolvedAddresses,
      ]),

    connectedAddress,

    peerApproved:
      true as const,

    networkCallPerformed:
      false as const,

    productionAuthority:
      false as const,
  };
  const receipt = Object.freeze({
    ...base,
    receiptDigest: digestReceipt(base),
  });
  PEER_RECEIPTS.add(receipt);
  PEER_TRANSPORT_RECEIPTS.set(
    receipt,
    transportReceipt,
  );
  return receipt;
}

export function isXviPeerAddressPolicyReceipt(
  receipt: unknown,
): receipt is Readonly<XviPeerAddressPolicyReceipt> {
  if (
    receipt === null ||
    typeof receipt !== 'object' ||
    !PEER_RECEIPTS.has(receipt) ||
    !Object.isFrozen(receipt)
  ) {
    return false;
  }

  const candidate =
    receipt as Readonly<XviPeerAddressPolicyReceipt>;
  const transportReceipt =
    PEER_TRANSPORT_RECEIPTS.get(receipt);

  if (
    !transportReceipt ||
    !isXviTransportPolicyReceipt(transportReceipt) ||
    !Object.isFrozen(candidate.approvedAddresses) ||
    candidate.version !== 'xvi-peer-address-policy-v1' ||
    candidate.transportReceiptDigest !==
      transportReceipt.receiptDigest ||
    candidate.approvedAddresses.length !==
      transportReceipt.resolvedAddresses.length ||
    candidate.approvedAddresses.some(
      (address, index) =>
        address !==
          transportReceipt.resolvedAddresses[index],
    ) ||
    !candidate.approvedAddresses.includes(
      candidate.connectedAddress,
    ) ||
    candidate.peerApproved !== true ||
    candidate.networkCallPerformed !== false ||
    candidate.productionAuthority !== false ||
    !/^[a-f0-9]{64}$/.test(candidate.receiptDigest)
  ) {
    return false;
  }

  return candidate.receiptDigest === digestReceipt({
    version: candidate.version,
    transportReceiptDigest: candidate.transportReceiptDigest,
    approvedAddresses: candidate.approvedAddresses,
    connectedAddress: candidate.connectedAddress,
    peerApproved: candidate.peerApproved,
    networkCallPerformed: candidate.networkCallPerformed,
    productionAuthority: candidate.productionAuthority,
  });
}
