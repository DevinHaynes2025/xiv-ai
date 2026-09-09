/**
 * 62L-BQ Global Authorized Data/Server Federation —
 * adapters for online/offline authorized servers, databases, APIs,
 * object stores, queues, edge nodes, local networks.
 * Configured + authorized only. Deny silent arbitrary server scan/access.
 */

import { randomUUID } from 'node:crypto';

import {
  ARBITRARY_SCAN_DENIED,
  BQ_LOCKS,
  UNCONFIGURED_ADAPTER_UNAVAILABLE,
  type FederationAdapterKind,
} from './polyglot-coding-civilization-types';

export type FederationAdapterState = 'AVAILABLE' | 'UNAVAILABLE' | 'DENIED';

export type FederationAdapter = {
  id: string;
  key: string;
  kind: FederationAdapterKind;
  endpoint: string;
  configured: boolean;
  authorized: boolean;
  verified: boolean;
  evidenceRefs: string[];
  state: FederationAdapterState;
  notes: string;
};

export type FederationAccessResult = {
  allowed: boolean;
  state: FederationAdapterState;
  reason: string;
  adapterId: string | null;
  scannedArbitrary: false;
};

export type ArbitraryScanAttempt = {
  id: string;
  target: string;
  at: string;
  allowed: false;
  reason: typeof ARBITRARY_SCAN_DENIED;
};

const adapters = new Map<string, FederationAdapter>();
const scanDenials: ArbitraryScanAttempt[] = [];

function normalizeKey(key: string) {
  return key.trim().toLowerCase().replace(/[\s-]+/g, '_');
}

function computeState(a: Pick<FederationAdapter, 'configured' | 'authorized' | 'verified' | 'evidenceRefs'>): FederationAdapterState {
  if (a.configured && a.authorized && a.verified && a.evidenceRefs.length > 0) {
    return 'AVAILABLE';
  }
  return 'UNAVAILABLE';
}

export function resetFederationAdapters() {
  adapters.clear();
  scanDenials.length = 0;
}

export function registerFederationAdapter(input: {
  key: string;
  kind: FederationAdapterKind;
  endpoint: string;
  configured?: boolean;
  authorized?: boolean;
  verified?: boolean;
  evidenceRefs?: string[];
  notes?: string;
}): FederationAdapter {
  const key = normalizeKey(input.key);
  const evidenceRefs = [...(input.evidenceRefs ?? [])];
  const configured = input.configured === true;
  const authorized = input.authorized === true;
  const verified = input.verified === true;
  const adapter: FederationAdapter = {
    id: randomUUID(),
    key,
    kind: input.kind,
    endpoint: input.endpoint.trim(),
    configured,
    authorized,
    verified,
    evidenceRefs,
    state: computeState({ configured, authorized, verified, evidenceRefs }),
    notes:
      input.notes ??
      (configured
        ? 'Registered adapter; AVAILABLE only when configured+authorized+verified.'
        : UNCONFIGURED_ADAPTER_UNAVAILABLE),
  };
  adapters.set(key, adapter);
  return { ...adapter, evidenceRefs: [...adapter.evidenceRefs] };
}

export function listFederationAdapters(): FederationAdapter[] {
  return [...adapters.values()].map((a) => ({
    ...a,
    evidenceRefs: [...a.evidenceRefs],
  }));
}

export function getFederationAdapter(key: string): FederationAdapter | null {
  const a = adapters.get(normalizeKey(key));
  return a ? { ...a, evidenceRefs: [...a.evidenceRefs] } : null;
}

/**
 * Probe an adapter. Unconfigured → UNAVAILABLE (hard honesty).
 */
export function probeFederationAdapter(key: string): FederationAccessResult {
  const adapter = adapters.get(normalizeKey(key));
  if (!adapter) {
    return {
      allowed: false,
      state: 'UNAVAILABLE',
      reason: UNCONFIGURED_ADAPTER_UNAVAILABLE,
      adapterId: null,
      scannedArbitrary: false,
    };
  }
  const state = computeState(adapter);
  adapter.state = state;
  adapters.set(adapter.key, adapter);
  if (state !== 'AVAILABLE') {
    return {
      allowed: false,
      state: 'UNAVAILABLE',
      reason: UNCONFIGURED_ADAPTER_UNAVAILABLE,
      adapterId: adapter.id,
      scannedArbitrary: false,
    };
  }
  return {
    allowed: true,
    state: 'AVAILABLE',
    reason: 'AUTHORIZED_CONFIGURED_VERIFIED_ADAPTER',
    adapterId: adapter.id,
    scannedArbitrary: false,
  };
}

/**
 * Hard deny: no silent scan or access of arbitrary/unauthorized servers.
 */
export function attemptArbitraryServerScan(input: {
  target: string;
  reason?: string;
}): FederationAccessResult & { attempt: ArbitraryScanAttempt } {
  if (BQ_LOCKS.SILENT_ARBITRARY_SERVER_SCAN) {
    // Lock violated in config — still deny at runtime.
  }
  const attempt: ArbitraryScanAttempt = {
    id: randomUUID(),
    target: input.target,
    at: new Date().toISOString(),
    allowed: false,
    reason: ARBITRARY_SCAN_DENIED,
  };
  scanDenials.push(attempt);
  return {
    allowed: false,
    state: 'DENIED',
    reason: ARBITRARY_SCAN_DENIED,
    adapterId: null,
    scannedArbitrary: false,
    attempt,
  };
}

/**
 * Access only via registered adapter key — never by raw arbitrary endpoint scan.
 */
export function accessAuthorizedAdapter(input: {
  adapterKey: string;
  operation: 'read' | 'write' | 'list' | 'health';
}): FederationAccessResult {
  // Refuse if caller tries to smuggle an arbitrary URL as a key-like scan.
  if (/^https?:\/\//i.test(input.adapterKey) || input.adapterKey.includes('://')) {
    return attemptArbitraryServerScan({ target: input.adapterKey });
  }
  return probeFederationAdapter(input.adapterKey);
}

export function listScanDenials() {
  return scanDenials.map((d) => ({ ...d }));
}

export function federationHonesty() {
  return {
    locks: BQ_LOCKS,
    silentArbitraryServerScan: BQ_LOCKS.SILENT_ARBITRARY_SERVER_SCAN,
    unconfiguredIsUnavailable: true as const,
    founderSealedDenyByDefault: BQ_LOCKS.FOUNDER_SEALED_DENY_BY_DEFAULT,
    productionAuthorization: false as const,
  };
}
