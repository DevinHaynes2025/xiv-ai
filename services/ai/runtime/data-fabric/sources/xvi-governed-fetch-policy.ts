import {
  createHash,
} from 'node:crypto';

import type {
  XviPeerAddressPolicyReceipt,
} from './xvi-peer-address-policy';
import {
  isXviPeerAddressPolicyReceipt,
} from './xvi-peer-address-policy';

export interface XviGovernedFetchPolicyInput {
  method: string;
  protocol: string;
  redirectMode: string;
  credentialsMode: string;
  timeoutMs: number;
  maxResponseBytes: number;
  expectedMimeTypes: readonly string[];
  observedMimeType: string;
  peerReceipt:
    Readonly<XviPeerAddressPolicyReceipt>;
}

export interface XviGovernedFetchPolicyReceipt {
  version:
    'xvi-governed-fetch-policy-v1';

  method:
    'GET';

  protocol:
    'https:';

  redirectMode:
    'error';

  credentialsMode:
    'omit';

  timeoutMs: number;
  maxResponseBytes: number;

  approvedAddresses: readonly string[];
  connectedAddress: string;
  transportReceiptDigest: string;
  peerReceiptDigest: string;

  expectedMimeTypes:
    readonly string[];

  observedMimeType: string;

  peerApproved:
    true;

  networkCallPerformed:
    false;

  productionAuthority:
    false;

  receiptDigest: string;
}

const FETCH_RECEIPTS = new WeakSet<object>();
const FETCH_PEER_RECEIPTS =
  new WeakMap<object, Readonly<XviPeerAddressPolicyReceipt>>();

const refuse = (): never => {
  throw new Error(
    'XVI_GOVERNED_FETCH_POLICY_REFUSED',
  );
};

function normalizeMimeType(
  value: string,
): string {
  const base =
    value
      .split(';')[0]
      ?.trim()
      .toLowerCase();

  if (!base) {
    refuse();
  }

  return base;
}

function canonicalizeReceipt(
  receipt: Omit<
    XviGovernedFetchPolicyReceipt,
    'receiptDigest'
  >,
): string {
  return JSON.stringify({
    version: receipt.version,
    method: receipt.method,
    protocol: receipt.protocol,
    redirectMode: receipt.redirectMode,
    credentialsMode: receipt.credentialsMode,
    timeoutMs: receipt.timeoutMs,
    maxResponseBytes: receipt.maxResponseBytes,
    approvedAddresses: [...receipt.approvedAddresses],
    connectedAddress: receipt.connectedAddress,
    transportReceiptDigest: receipt.transportReceiptDigest,
    peerReceiptDigest: receipt.peerReceiptDigest,
    expectedMimeTypes: [...receipt.expectedMimeTypes],
    observedMimeType: receipt.observedMimeType,
    peerApproved: receipt.peerApproved,
    networkCallPerformed: receipt.networkCallPerformed,
    productionAuthority: receipt.productionAuthority,
  });
}

function digestReceipt(
  receipt: Omit<
    XviGovernedFetchPolicyReceipt,
    'receiptDigest'
  >,
): string {
  return createHash('sha256')
    .update(canonicalizeReceipt(receipt))
    .digest('hex');
}

export function authorizeXviGovernedFetch(
  input: XviGovernedFetchPolicyInput,
): Readonly<XviGovernedFetchPolicyReceipt> {
  if (
    input === null ||
    typeof input !== 'object' ||
    Array.isArray(input)
  ) {
    refuse();
  }

  if (
    input.method !== 'GET' ||
    input.protocol !== 'https:' ||
    input.redirectMode !== 'error' ||
    input.credentialsMode !== 'omit'
  ) {
    refuse();
  }

  if (
    !Number.isInteger(input.timeoutMs) ||
    input.timeoutMs < 100 ||
    input.timeoutMs > 30_000
  ) {
    refuse();
  }

  if (
    !Number.isInteger(
      input.maxResponseBytes,
    ) ||
    input.maxResponseBytes < 1 ||
    input.maxResponseBytes >
      10 * 1024 * 1024
  ) {
    refuse();
  }

  if (
    !Array.isArray(
      input.expectedMimeTypes,
    ) ||
    input.expectedMimeTypes.length < 1 ||
    input.expectedMimeTypes.length > 16
  ) {
    refuse();
  }

  const expected =
    input.expectedMimeTypes.map(
      value => {
        if (
          typeof value !== 'string'
        ) {
          refuse();
        }

        return normalizeMimeType(
          value,
        );
      },
    );

  if (
    new Set(expected).size !==
      expected.length
  ) {
    refuse();
  }

  if (
    typeof input.observedMimeType !==
      'string'
  ) {
    refuse();
  }

  const observed =
    normalizeMimeType(
      input.observedMimeType,
    );

  if (
    !expected.includes(observed)
  ) {
    refuse();
  }

  const peerReceipt =
    input.peerReceipt;

  if (!isXviPeerAddressPolicyReceipt(peerReceipt)) {
    refuse();
  }

  const base:
    Omit<XviGovernedFetchPolicyReceipt, 'receiptDigest'> = {
      version:
        'xvi-governed-fetch-policy-v1',

      method:
        'GET',

      protocol:
        'https:',

      redirectMode:
        'error',

      credentialsMode:
        'omit',

      timeoutMs:
        input.timeoutMs,

      maxResponseBytes:
        input.maxResponseBytes,

      approvedAddresses:
        Object.freeze([
          ...peerReceipt.approvedAddresses,
        ]),

      connectedAddress:
        peerReceipt.connectedAddress,

      transportReceiptDigest:
        peerReceipt.transportReceiptDigest,

      peerReceiptDigest:
        peerReceipt.receiptDigest,

      expectedMimeTypes:
        Object.freeze(
          [...expected],
        ),

      observedMimeType:
        observed,

      peerApproved:
        true,

      networkCallPerformed:
        false,

      productionAuthority:
        false,
    };

  const frozenReceipt = Object.freeze({
    ...base,
    receiptDigest: digestReceipt(base),
  });
  FETCH_RECEIPTS.add(frozenReceipt);
  FETCH_PEER_RECEIPTS.set(
    frozenReceipt,
    peerReceipt,
  );
  return frozenReceipt;
}

export function isXviGovernedFetchPolicyReceipt(
  receipt: unknown,
): boolean {
  if (
    receipt === null ||
    typeof receipt !== 'object' ||
    !FETCH_RECEIPTS.has(receipt) ||
    !Object.isFrozen(receipt)
  ) {
    return false;
  }

  const candidate =
    receipt as Readonly<XviGovernedFetchPolicyReceipt>;
  const peerReceipt =
    FETCH_PEER_RECEIPTS.get(receipt);

  if (
    !peerReceipt ||
    !isXviPeerAddressPolicyReceipt(peerReceipt) ||
    !Object.isFrozen(candidate.approvedAddresses) ||
    !Object.isFrozen(candidate.expectedMimeTypes) ||
    candidate.version !== 'xvi-governed-fetch-policy-v1' ||
    candidate.approvedAddresses.length !==
      peerReceipt.approvedAddresses.length ||
    candidate.approvedAddresses.some(
      (address, index) =>
        address !== peerReceipt.approvedAddresses[index],
    ) ||
    candidate.connectedAddress !== peerReceipt.connectedAddress ||
    candidate.transportReceiptDigest !==
      peerReceipt.transportReceiptDigest ||
    candidate.peerReceiptDigest !== peerReceipt.receiptDigest ||
    candidate.peerApproved !== true ||
    candidate.networkCallPerformed !== false ||
    candidate.productionAuthority !== false ||
    !/^[a-f0-9]{64}$/.test(candidate.receiptDigest)
  ) {
    return false;
  }

  const {
    receiptDigest,
    ...base
  } = candidate;

  return receiptDigest === digestReceipt(base);
}