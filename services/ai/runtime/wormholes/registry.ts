/**
 * 62L-EX18 — Wormhole registry (in-memory research index).
 * Tenant/Universe isolated. No cross-tenant private reuse.
 */

import {
  computeIntegrityHash,
  computeInputHash,
  computeWorkloadFingerprint,
} from './fingerprint.ts';
import { clearQuarantineStore, isQuarantined } from './quarantine.ts';
import {
  EX18_LOCKS,
  type BenefitState,
  type DeviceEnrollment,
  type FreshnessState,
  type HighwayState,
  type QuantumTruthLabel,
  type WormholeType,
  type XivWormholeDna,
  type XivWormholeRoute,
} from './types.ts';

export type RegisterWormholeInput = {
  wormholeId: string;
  wormholeType: WormholeType;
  tenantId: string;
  universeId: string;
  sourceRef: string;
  destinationRef: string;
  inputPayload: string;
  payloadDigest: string;
  dataClass: string;
  purpose: string;
  freshness?: FreshnessState;
  ttlExpiryIso?: string | null;
  evidenceRefs?: readonly string[];
  quantumTruthLabel?: QuantumTruthLabel;
  highwayState?: HighwayState;
  benefitState?: BenefitState;
  benefitMeasured?: boolean;
  latencySavedMs?: number | null;
  confidence?: number;
  rootRefs?: readonly string[];
  branchRefs?: readonly string[];
  bridgeRefs?: readonly string[];
  compiledArtifactTrusted?: boolean;
  historicalQpuOnly?: boolean;
  deviceEnrollment?: DeviceEnrollment | null;
  mode?: 'LOCAL_FIRST' | 'OFFLINE_FIRST' | 'HYBRID_READY';
  missionId?: string;
  genomeId?: string;
  problemIrHash?: string;
  datasetVersion?: string;
  modelVersion?: string;
  runtimeVersion?: string;
  failureHint?: 'AVOID_ROUTE_HINT' | null;
  retestRequired?: boolean;
  nowIso: string;
};

const registry = new Map<string, XivWormholeRoute>();
const dnaStore = new Map<string, XivWormholeDna>();

export function clearWormholeRegistry(): void {
  registry.clear();
  dnaStore.clear();
  clearQuarantineStore();
}

export function registerWormhole(input: RegisterWormholeInput): XivWormholeRoute {
  const workloadFingerprint = computeWorkloadFingerprint({
    tenantId: input.tenantId,
    universeId: input.universeId,
    missionId: input.missionId,
    genomeId: input.genomeId,
    problemIrHash: input.problemIrHash,
    wormholeType: input.wormholeType,
    inputPayload: input.inputPayload,
    datasetVersion: input.datasetVersion,
    modelVersion: input.modelVersion,
    runtimeVersion: input.runtimeVersion,
  });
  const inputHash = computeInputHash(input.inputPayload);
  const integrityHash = computeIntegrityHash({
    wormholeId: input.wormholeId,
    workloadFingerprint,
    inputHash,
    payloadDigest: input.payloadDigest,
  });

  const route: XivWormholeRoute = {
    wormholeId: input.wormholeId,
    wormholeType: input.wormholeType,
    version: '1.0.0',
    tenantId: input.tenantId,
    universeId: input.universeId,
    sourceRef: input.sourceRef,
    destinationRef: input.destinationRef,
    workloadFingerprint,
    inputHash,
    integrityHash,
    dataClass: input.dataClass,
    purpose: input.purpose,
    freshness: input.freshness ?? 'FRESH',
    ttlExpiryIso: input.ttlExpiryIso ?? null,
    evidenceRefs: input.evidenceRefs ?? [],
    quantumTruthLabel: input.quantumTruthLabel ?? 'CLASSICAL',
    highwayState: input.highwayState ?? 'CANDIDATE',
    benefitState: input.benefitState ?? 'NOT_TESTED',
    benefitMeasured: input.benefitMeasured ?? false,
    latencySavedMs: input.latencySavedMs ?? null,
    costSavedProxy: null,
    confidence: input.confidence ?? 0.5,
    rootRefs: input.rootRefs ?? ['ROOT_POLICY', 'ROOT_GUARDIAN'],
    branchRefs: input.branchRefs ?? [],
    bridgeRefs: input.bridgeRefs ?? [],
    quarantineReason: null,
    failureHint: input.failureHint ?? null,
    retestRequired: input.retestRequired ?? false,
    compiledArtifactTrusted: input.compiledArtifactTrusted ?? false,
    warmSessionAuthRecheckRequired: true,
    algorithmWarmStartIsHintOnly: true,
    indexedRouteStillRequiresPolicy: true,
    historicalQpuOnly: input.historicalQpuOnly ?? false,
    deviceEnrollment: input.deviceEnrollment
      ? { ...input.deviceEnrollment, lanPropagationAllowed: false }
      : null,
    mode: input.mode ?? 'LOCAL_FIRST',
    localPreferredWhenMeetsRequirements: true,
    cloudNotAutoBetter: true,
    authorityBypass: false,
    guardianBypass: false,
    rlsBypass: false,
    createdAtIso: input.nowIso,
    updatedAtIso: input.nowIso,
  };

  registry.set(route.wormholeId, route);
  return route;
}

export function getWormhole(wormholeId: string): XivWormholeRoute | null {
  return registry.get(wormholeId) ?? null;
}

export function listWormholesForScope(tenantId: string, universeId: string): XivWormholeRoute[] {
  return [...registry.values()].filter(
    (r) =>
      r.tenantId === tenantId &&
      r.universeId === universeId &&
      !isQuarantined(r.wormholeId),
  );
}

export function findCompatibleWormholes(input: {
  tenantId: string;
  universeId: string;
  wormholeType: WormholeType;
  workloadFingerprint: string;
  inputHash: string;
}): XivWormholeRoute[] {
  return listWormholesForScope(input.tenantId, input.universeId).filter(
    (r) =>
      r.wormholeType === input.wormholeType &&
      r.workloadFingerprint === input.workloadFingerprint &&
      r.inputHash === input.inputHash,
  );
}

export function updateWormhole(
  wormholeId: string,
  patch: Partial<
    Pick<
      XivWormholeRoute,
      | 'freshness'
      | 'highwayState'
      | 'benefitState'
      | 'benefitMeasured'
      | 'confidence'
      | 'latencySavedMs'
      | 'failureHint'
      | 'retestRequired'
      | 'quarantineReason'
      | 'evidenceRefs'
      | 'updatedAtIso'
    >
  >,
): XivWormholeRoute | null {
  const existing = registry.get(wormholeId);
  if (!existing) return null;
  const next: XivWormholeRoute = {
    ...existing,
    ...patch,
    authorityBypass: false,
    guardianBypass: false,
    rlsBypass: false,
    warmSessionAuthRecheckRequired: true,
    algorithmWarmStartIsHintOnly: true,
    indexedRouteStillRequiresPolicy: true,
    localPreferredWhenMeetsRequirements: true,
    cloudNotAutoBetter: true,
  };
  registry.set(wormholeId, next);
  return next;
}

export function markSourceRevoked(wormholeId: string, nowIso: string): XivWormholeRoute | null {
  return updateWormhole(wormholeId, {
    freshness: 'REVOKED',
    highwayState: 'DEGRADED',
    updatedAtIso: nowIso,
  });
}

export function markRuntimeStale(wormholeId: string, nowIso: string): XivWormholeRoute | null {
  return updateWormhole(wormholeId, {
    freshness: 'STALE',
    highwayState: 'STALE',
    updatedAtIso: nowIso,
  });
}

/** §26 XIV_WORMHOLE_DNA — portable; no private customer data. */
export function exportWormholeDna(route: XivWormholeRoute): XivWormholeDna | { denied: true; reason: string } {
  if (EX18_LOCKS.PORTABLE_DNA_INCLUDES_PRIVATE_CUSTOMER_DATA === true) {
    return { denied: true, reason: 'Invariant broken: private data in DNA.' };
  }
  if (
    route.dataClass === 'PRIVATE_CUSTOMER' ||
    route.dataClass === 'THIRD_PARTY_PRIVATE'
  ) {
    return {
      denied: true,
      reason: 'XIV_WORMHOLE_DNA forbids private third-party/customer data in portable DNA.',
    };
  }
  const dna: XivWormholeDna = {
    dnaId: `dna:${route.wormholeId}`,
    version: route.version,
    wormholeType: route.wormholeType,
    publicPatternHash: route.workloadFingerprint.slice(0, 32),
    highwayState: route.highwayState,
    containsPrivateCustomerData: false,
    containsThirdPartyPrivateData: false,
    portable: true,
  };
  dnaStore.set(dna.dnaId, dna);
  return dna;
}

export function getDna(dnaId: string): XivWormholeDna | null {
  return dnaStore.get(dnaId) ?? null;
}
