/**
 * 62L-EX5 — QPU backend / provider truth registry.
 * DOCUMENTED ≠ VERIFIED. Simulator → SIMULATED_QUANTUM only.
 * Never infer PHYSICAL_QPU from brand. Freshness TTL enforced.
 */

import { createDefaultProviderRecord, seedUnconfiguredProviderCatalog } from './qpu-provider.ts';
import {
  EX5_LOCKS,
  type BackendState,
  type Ex5ExecutionClass,
  type InputDataClass,
  type PhysicalOrSimulator,
  type PrivacyClass,
  type QpuBackendRecord,
  type QpuProviderRecord,
} from './qpu-types.ts';

export type QpuTruthRegistry = {
  providers: Map<string, QpuProviderRecord>;
  backends: Map<string, QpuBackendRecord>;
  tenantId: string;
  universeId: string;
  /** Mocked discovery never counts as physical verification. */
  mockedDiscovery: boolean;
};

export function createQpuTruthRegistry(input: {
  tenantId: string;
  universeId: string;
  seedCandidates?: boolean;
  mockedDiscovery?: boolean;
}): QpuTruthRegistry {
  const providers = new Map<string, QpuProviderRecord>();
  if (input.seedCandidates !== false) {
    for (const p of seedUnconfiguredProviderCatalog({
      tenantId: input.tenantId,
      universeId: input.universeId,
    })) {
      providers.set(p.providerId, p);
    }
  }
  return {
    providers,
    backends: new Map(),
    tenantId: input.tenantId,
    universeId: input.universeId,
    mockedDiscovery: input.mockedDiscovery === true,
  };
}

export function upsertProvider(registry: QpuTruthRegistry, provider: QpuProviderRecord): void {
  if (provider.tenantId !== registry.tenantId || provider.universeId !== registry.universeId) {
    throw new Error('CROSS_TENANT_OR_UNIVERSE_PROVIDER_UPSERT_DENIED');
  }
  if (provider.rawCredentialsStored !== false) {
    throw new Error('RAW_CREDENTIALS_FORBIDDEN');
  }
  registry.providers.set(provider.providerId, provider);
}

export function createBackendRecord(input: {
  backendId: string;
  providerId: string;
  displayName: string;
  state?: BackendState;
  physicalOrSimulator: PhysicalOrSimulator;
  qubitsReported?: number | null;
  qubitsVerified?: number | null;
  operationsReported?: readonly string[];
  operationsVerified?: readonly string[];
  region?: string | null;
  privacyClasses?: readonly PrivacyClass[];
  dataClasses?: readonly InputDataClass[];
  evidenceRefs?: readonly string[];
  discoveredAt?: string | null;
  lastVerifiedAt?: string | null;
  lastSeenAt?: string | null;
  freshnessTtlMs?: number;
  pricingRef?: string | null;
}): QpuBackendRecord {
  // Never infer physical from brand / display name.
  let physicalOrSimulator = input.physicalOrSimulator;
  if (EX5_LOCKS.INFER_PHYSICAL_FROM_BRAND) {
    physicalOrSimulator = 'UNKNOWN';
  }
  return {
    backendId: input.backendId,
    providerId: input.providerId,
    displayName: input.displayName,
    state: input.state ?? 'NOT_TESTED',
    physicalOrSimulator,
    qubitsReported: input.qubitsReported ?? null,
    qubitsVerified: input.qubitsVerified ?? null,
    operationsReported: [...(input.operationsReported ?? [])],
    operationsVerified: [...(input.operationsVerified ?? [])],
    connectivityReported: null,
    connectivityVerified: null,
    queueDepthReported: null,
    availabilityReported: null,
    region: input.region ?? null,
    privacyClasses: [...(input.privacyClasses ?? ['PUBLIC', 'TENANT_PRIVATE'])],
    dataClasses: [...(input.dataClasses ?? ['SYNTHETIC', 'BENCHMARK_FIXTURE'])],
    pricingRef: input.pricingRef ?? null,
    evidenceRefs: [...(input.evidenceRefs ?? [])],
    discoveredAt: input.discoveredAt ?? null,
    lastVerifiedAt: input.lastVerifiedAt ?? null,
    lastSeenAt: input.lastSeenAt ?? null,
    freshnessTtlMs: input.freshnessTtlMs ?? 3_600_000,
    inferredPhysicalFromBrand: false,
  };
}

export function upsertBackend(registry: QpuTruthRegistry, backend: QpuBackendRecord): void {
  if (!registry.providers.has(backend.providerId)) {
    // Allow documenting a backend under an explicit provider upsert first preferred;
    // for DOCUMENTED-only flows, auto-attach a DOCUMENTED provider shell.
    const shell = createDefaultProviderRecord({
      providerId: backend.providerId,
      candidate: 'OTHER_AUTHORIZED_QPU_PROVIDER',
      displayName: `Documented provider shell for ${backend.providerId}`,
      tenantId: registry.tenantId,
      universeId: registry.universeId,
      state: 'DOCUMENTED',
    });
    registry.providers.set(shell.providerId, shell);
  }
  registry.backends.set(backend.backendId, backend);
}

export function getProvider(
  registry: QpuTruthRegistry,
  providerId: string,
): QpuProviderRecord | null {
  return registry.providers.get(providerId) ?? null;
}

export function getBackend(registry: QpuTruthRegistry, backendId: string): QpuBackendRecord | null {
  return registry.backends.get(backendId) ?? null;
}

export function isBackendFresh(backend: QpuBackendRecord, nowIso: string): boolean {
  if (!backend.lastSeenAt && !backend.lastVerifiedAt) return false;
  const anchor = backend.lastVerifiedAt ?? backend.lastSeenAt;
  if (!anchor) return false;
  const age = Date.parse(nowIso) - Date.parse(anchor);
  if (Number.isNaN(age)) return false;
  return age <= backend.freshnessTtlMs;
}

export function markBackendStale(backend: QpuBackendRecord): QpuBackendRecord {
  return { ...backend, state: 'STALE' };
}

/**
 * DOCUMENTED cannot satisfy VERIFIED.
 * AVAILABLE_REPORTED / SUPPORTED / NOT_TESTED also cannot.
 */
export function backendSatisfiesVerified(backend: QpuBackendRecord, nowIso: string): boolean {
  if (backend.state === 'DOCUMENTED') return false;
  if (backend.state === 'STALE') return false;
  if (backend.state !== 'VERIFIED') return false;
  if (!isBackendFresh(backend, nowIso)) return false;
  if (backend.physicalOrSimulator !== 'PHYSICAL_QPU') return false;
  if (backend.qubitsVerified === null) return false;
  if (!backend.lastVerifiedAt) return false;
  return true;
}

/** Map backend physical/simulator gate to execution class. */
export function executionClassForBackend(backend: QpuBackendRecord): Ex5ExecutionClass {
  if (backend.physicalOrSimulator === 'SIMULATOR') {
    return 'SIMULATED_QUANTUM';
  }
  if (
    backend.physicalOrSimulator === 'PHYSICAL_QPU' &&
    backend.state === 'VERIFIED' &&
    backend.qubitsVerified !== null
  ) {
    // Classification candidate only — still needs real job receipt for PHYSICAL_QPU_VERIFIED claim.
    return 'PHYSICAL_QPU_VERIFIED';
  }
  if (backend.physicalOrSimulator === 'UNKNOWN') {
    return 'CLASSICAL';
  }
  return 'SIMULATED_QUANTUM';
}

/** Simulator backends can never be labeled PHYSICAL_QPU_VERIFIED. */
export function simulatorCanBePhysicalQpuVerified(backend: QpuBackendRecord): false | never {
  if (backend.physicalOrSimulator === 'SIMULATOR') {
    return false;
  }
  return false;
}

export function classifyBackendHonesty(backend: QpuBackendRecord): {
  executionClass: Ex5ExecutionClass;
  physicalQpuVerified: false;
  reason: string;
} {
  if (backend.physicalOrSimulator === 'SIMULATOR') {
    return {
      executionClass: 'SIMULATED_QUANTUM',
      physicalQpuVerified: false,
      reason: 'SIMULATOR_MAPS_TO_SIMULATED_QUANTUM_ONLY',
    };
  }
  if (backend.state === 'DOCUMENTED') {
    return {
      executionClass:
        backend.physicalOrSimulator === 'PHYSICAL_QPU' ? 'CLASSICAL' : 'SIMULATED_QUANTUM',
      physicalQpuVerified: false,
      reason: 'DOCUMENTED_CANNOT_SATISFY_VERIFIED',
    };
  }
  // Even VERIFIED backend registration alone is not a physical job receipt.
  return {
    executionClass: executionClassForBackend(backend),
    physicalQpuVerified: false,
    reason: 'REGISTRY_ENTRY_ALONE_IS_NOT_PHYSICAL_VERIFICATION',
  };
}

/** Successful mocked registry discovery ≠ physical verification. */
export function mockedRegistryImpliesPhysicalVerification(registry: QpuTruthRegistry): false {
  void registry.mockedDiscovery;
  return false;
}

export function listProviders(registry: QpuTruthRegistry): QpuProviderRecord[] {
  return [...registry.providers.values()];
}

export function listBackends(registry: QpuTruthRegistry): QpuBackendRecord[] {
  return [...registry.backends.values()];
}

export function excludeStaleFromVerifiedRoute(
  backends: readonly QpuBackendRecord[],
  nowIso: string,
): QpuBackendRecord[] {
  return backends.filter((b) => {
    if (b.state === 'STALE') return false;
    if (b.state !== 'VERIFIED') return false;
    return isBackendFresh(b, nowIso);
  });
}
