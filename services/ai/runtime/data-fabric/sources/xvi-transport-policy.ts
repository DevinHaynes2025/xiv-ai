import {
  createHash,
} from 'node:crypto';

import {
  isIP,
} from 'node:net';

export interface XviTransportPolicyInput {
  canonicalOrigin: string;
  hostname: string;
  resolvedAddresses: readonly string[];
}

export interface XviTransportPolicyReceipt {
  version:
    'xvi-transport-policy-v1';

  canonicalOrigin: string;
  hostname: string;

  resolvedAddresses:
    readonly string[];

  receiptDigest: string;

  destinationApproved: true;

  credentialsAllowed: false;
  redirectsAllowed: false;
  privateAddressAllowed: false;

  networkCallPerformed: false;
  productionAuthority: false;
}

const TRANSPORT_RECEIPTS = new WeakSet<object>();

function refuse(): never {
  throw new Error(
    'XVI_TRANSPORT_POLICY_REFUSED',
  );
}

function canonicalizeReceipt(
  receipt: Omit<
    XviTransportPolicyReceipt,
    'receiptDigest'
  >,
): string {
  return JSON.stringify({
    version: receipt.version,
    canonicalOrigin: receipt.canonicalOrigin,
    hostname: receipt.hostname,
    resolvedAddresses: [...receipt.resolvedAddresses],
    destinationApproved: receipt.destinationApproved,
    credentialsAllowed: receipt.credentialsAllowed,
    redirectsAllowed: receipt.redirectsAllowed,
    privateAddressAllowed: receipt.privateAddressAllowed,
    networkCallPerformed: receipt.networkCallPerformed,
    productionAuthority: receipt.productionAuthority,
  });
}

function digestReceipt(
  receipt: Omit<
    XviTransportPolicyReceipt,
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
    'canonicalOrigin',
    'hostname',
    'resolvedAddresses',
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

function ipv4Octets(
  address: string,
): readonly number[] {
  const parts =
    address.split('.');

  if (parts.length !== 4) {
    refuse();
  }

  const octets =
    parts.map(part => {
      if (
        !/^(0|[1-9][0-9]{0,2})$/.test(part)
      ) {
        refuse();
      }

      const value =
        Number(part);

      if (
        !Number.isInteger(value) ||
        value < 0 ||
        value > 255
      ) {
        refuse();
      }

      return value;
    });

  return octets;
}

function forbiddenIpv4(
  address: string,
): boolean {
  const [
    a,
    b,
    c,
  ] =
    ipv4Octets(address);

  if (
    a === 0 ||
    a === 10 ||
    a === 127 ||
    a >= 224
  ) {
    return true;
  }

  if (
    a === 169 &&
    b === 254
  ) {
    return true;
  }

  if (
    a === 172 &&
    b >= 16 &&
    b <= 31
  ) {
    return true;
  }

  if (
    a === 192 &&
    b === 168
  ) {
    return true;
  }

  if (
    a === 100 &&
    b >= 64 &&
    b <= 127
  ) {
    return true;
  }

  if (
    a === 198 &&
    (b === 18 || b === 19)
  ) {
    return true;
  }

  /*
   * IETF protocol assignments and
   * documentation/test networks must never
   * be treated as public destinations.
   */
  if (
    a === 192 &&
    b === 0 &&
    (
      c === 0 ||
      c === 2
    )
  ) {
    return true;
  }

  if (
    a === 192 &&
    b === 88 &&
    c === 99
  ) {
    return true;
  }

  if (
    a === 198 &&
    b === 51 &&
    c === 100
  ) {
    return true;
  }

  if (
    a === 203 &&
    b === 0 &&
    c === 113
  ) {
    return true;
  }

  return false;
}

function ipv6Words(address: string): readonly number[] {
  let normalized = address.toLowerCase();
  if (normalized.includes('.')) {
    const separator = normalized.lastIndexOf(':');
    if (separator < 0) {
      return [];
    }
    const octets = ipv4Octets(normalized.slice(separator + 1));
    const high = ((octets[0] ?? 0) << 8) | (octets[1] ?? 0);
    const low = ((octets[2] ?? 0) << 8) | (octets[3] ?? 0);
    normalized = `${normalized.slice(0, separator + 1)}${high.toString(16)}:${low.toString(16)}`;
  }

  const compressionIndex = normalized.indexOf('::');
  if (
    compressionIndex !== -1 &&
    normalized.indexOf('::', compressionIndex + 2) !== -1
  ) {
    return [];
  }
  const leftText = compressionIndex === -1
    ? normalized
    : normalized.slice(0, compressionIndex);
  const rightText = compressionIndex === -1
    ? ''
    : normalized.slice(compressionIndex + 2);
  const left = leftText === '' ? [] : leftText.split(':');
  const right = rightText === '' ? [] : rightText.split(':');
  const missingWords = compressionIndex === -1
    ? 0
    : 8 - left.length - right.length;
  if (
    (compressionIndex === -1 && left.length !== 8) ||
    (compressionIndex !== -1 && missingWords < 1)
  ) {
    return [];
  }
  const parts = [
    ...left,
    ...Array.from({ length: missingWords }, () => '0'),
    ...right,
  ];
  if (
    parts.length !== 8 ||
    parts.some(part => !/^[a-f0-9]{1,4}$/.test(part))
  ) {
    return [];
  }
  return parts.map(part => Number.parseInt(part, 16));
}

function forbiddenIpv6(address: string): boolean {
  const words = ipv6Words(address);
  if (words.length !== 8) {
    return true;
  }
  const first = words[0] ?? 0;
  const second = words[1] ?? 0;

  // Permit only global-unicast 2000::/3, then exclude special-use subranges.
  if ((first & 0xe000) !== 0x2000) {
    return true;
  }
  if (
    first === 0x2001 &&
    (
      second <= 0x01ff ||
      second === 0x0db8
    )
  ) {
    return true;
  }
  if (
    first === 0x2002 ||
    (first === 0x3fff && second <= 0x0fff)
  ) {
    return true;
  }
  return false;
}

function forbiddenAddress(
  address: string,
): boolean {
  const kind =
    isIP(address);

  if (kind === 4) {
    return forbiddenIpv4(address);
  }

  if (kind === 6) {
    return forbiddenIpv6(address);
  }

  return true;
}

export function authorizeXviTransportDestination(
  input: XviTransportPolicyInput,
): Readonly<XviTransportPolicyReceipt> {
  const d =
    exactInput(input);

  const rawOrigin =
    d.canonicalOrigin.value;

  const hostname =
    d.hostname.value;

  const addresses =
    d.resolvedAddresses.value;

  if (
    typeof rawOrigin !== 'string' ||
    typeof hostname !== 'string' ||
    !Array.isArray(addresses) ||
    addresses.length < 1 ||
    addresses.length > 16
  ) {
    refuse();
  }

  let origin: URL;

  try {
    origin =
      new URL(rawOrigin);
  } catch {
    refuse();
  }

  if (
    origin.protocol !== 'https:' ||
    origin.username !== '' ||
    origin.password !== '' ||
    origin.hash !== '' ||
    origin.search !== '' ||
    origin.pathname !== '/'
  ) {
    refuse();
  }

  if (
    origin.hostname !== hostname ||
    hostname !== hostname.toLowerCase() ||
    hostname.length < 1 ||
    hostname.length > 253
  ) {
    refuse();
  }

  const unique =
    [...new Set(addresses)];

  if (
    unique.length !==
      addresses.length
  ) {
    refuse();
  }

  for (const address of unique) {
    if (
      typeof address !== 'string' ||
      forbiddenAddress(address)
    ) {
      refuse();
    }
  }

  const base = {
    version:
      'xvi-transport-policy-v1' as const,

    canonicalOrigin:
      origin.origin,

    hostname,

    resolvedAddresses:
      Object.freeze([...unique]),

    destinationApproved:
      true as const,

    credentialsAllowed:
      false as const,

    redirectsAllowed:
      false as const,

    privateAddressAllowed:
      false as const,

    networkCallPerformed:
      false as const,

    productionAuthority:
      false as const,
  };

  const receipt = Object.freeze({
    ...base,
    receiptDigest: digestReceipt(base),
  });
  TRANSPORT_RECEIPTS.add(receipt);
  return receipt;
}

export function isXviTransportPolicyReceipt(
  receipt: unknown,
): receipt is Readonly<XviTransportPolicyReceipt> {
  if (
    receipt === null ||
    typeof receipt !== 'object' ||
    !TRANSPORT_RECEIPTS.has(receipt) ||
    !Object.isFrozen(receipt)
  ) {
    return false;
  }

  const candidate =
    receipt as Readonly<XviTransportPolicyReceipt>;

  return Object.isFrozen(candidate.resolvedAddresses) &&
    candidate.version === 'xvi-transport-policy-v1' &&
    candidate.destinationApproved === true &&
    candidate.credentialsAllowed === false &&
    candidate.redirectsAllowed === false &&
    candidate.privateAddressAllowed === false &&
    candidate.networkCallPerformed === false &&
    candidate.productionAuthority === false &&
    /^[a-f0-9]{64}$/.test(candidate.receiptDigest) &&
    candidate.receiptDigest === digestReceipt({
      version: candidate.version,
      canonicalOrigin: candidate.canonicalOrigin,
      hostname: candidate.hostname,
      resolvedAddresses: candidate.resolvedAddresses,
      destinationApproved: candidate.destinationApproved,
      credentialsAllowed: candidate.credentialsAllowed,
      redirectsAllowed: candidate.redirectsAllowed,
      privateAddressAllowed: candidate.privateAddressAllowed,
      networkCallPerformed: candidate.networkCallPerformed,
      productionAuthority: candidate.productionAuthority,
    });
}
