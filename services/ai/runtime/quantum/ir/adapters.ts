/**
 * 62L-EX16 — Provider adapter layer (syntax only).
 * Adapters do NOT own mission authority and cannot broaden permissions.
 */

import {
  EX16_LOCKS,
  type ProviderAdapterKind,
  type AccessScope,
  ex16Deny,
  type Ex16Denial,
} from './types.ts';
import type { AlgorithmTranslation } from './translator.ts';
import type { XivProblemIR } from './problem-ir.ts';
import { resolveOfflineProviderNeed } from './soft-wire.ts';

export type ProviderAdapter = {
  kind: ProviderAdapterKind;
  ownsMissionAuthority: false;
  canBroadenPermissions: false;
  embedsCredentials: false;
  syntaxOnly: true;
  offlineCapable: boolean;
  requiresExternalProvider: boolean;
};

export type AdapterBinding = {
  adapter: ProviderAdapter;
  translationId: string;
  missionId: string;
  workloadIrId: string;
  permissions: readonly string[];
  status: 'BOUND' | 'WAITING_PROVIDER' | 'DENIED';
  note: string;
};

const ADAPTER_TABLE: Record<ProviderAdapterKind, Omit<ProviderAdapter, 'kind'>> = {
  LOCAL_CLASSICAL: {
    ownsMissionAuthority: false,
    canBroadenPermissions: false,
    embedsCredentials: false,
    syntaxOnly: true,
    offlineCapable: true,
    requiresExternalProvider: false,
  },
  LOCAL_QUANTUM_SIMULATOR: {
    ownsMissionAuthority: false,
    canBroadenPermissions: false,
    embedsCredentials: false,
    syntaxOnly: true,
    offlineCapable: true,
    requiresExternalProvider: false,
  },
  AMD_COMPUTE: {
    ownsMissionAuthority: false,
    canBroadenPermissions: false,
    embedsCredentials: false,
    syntaxOnly: true,
    offlineCapable: false,
    requiresExternalProvider: true,
  },
  NVIDIA_COMPUTE: {
    ownsMissionAuthority: false,
    canBroadenPermissions: false,
    embedsCredentials: false,
    syntaxOnly: true,
    offlineCapable: false,
    requiresExternalProvider: true,
  },
  INTEL_COMPUTE: {
    ownsMissionAuthority: false,
    canBroadenPermissions: false,
    embedsCredentials: false,
    syntaxOnly: true,
    offlineCapable: false,
    requiresExternalProvider: true,
  },
  ARM_EDGE: {
    ownsMissionAuthority: false,
    canBroadenPermissions: false,
    embedsCredentials: false,
    syntaxOnly: true,
    offlineCapable: true,
    requiresExternalProvider: false,
  },
  APPLE_EDGE: {
    ownsMissionAuthority: false,
    canBroadenPermissions: false,
    embedsCredentials: false,
    syntaxOnly: true,
    offlineCapable: true,
    requiresExternalProvider: false,
  },
  QUALCOMM_EDGE: {
    ownsMissionAuthority: false,
    canBroadenPermissions: false,
    embedsCredentials: false,
    syntaxOnly: true,
    offlineCapable: true,
    requiresExternalProvider: false,
  },
  PHYSICAL_QPU_PROVIDER: {
    ownsMissionAuthority: false,
    canBroadenPermissions: false,
    embedsCredentials: false,
    syntaxOnly: true,
    offlineCapable: false,
    requiresExternalProvider: true,
  },
};

export function getProviderAdapter(kind: ProviderAdapterKind): ProviderAdapter {
  return { kind, ...ADAPTER_TABLE[kind] };
}

/**
 * Same IR for AMD/NVIDIA/Intel — one brain; adapters only change binding syntax.
 */
export function bindProviderAdapter(input: {
  kind: ProviderAdapterKind;
  problem: XivProblemIR;
  translation: AlgorithmTranslation;
  actor: AccessScope;
  grantedPermissions: readonly string[];
  requestedPermissions?: readonly string[];
  offline?: boolean;
}): AdapterBinding | Ex16Denial {
  if (
    input.actor.tenantId !== input.problem.tenantId ||
    input.actor.universeId !== input.problem.universeId
  ) {
    return ex16Deny('adapter binding cross-scope DENIED');
  }

  const adapter = getProviderAdapter(input.kind);
  const requested = input.requestedPermissions ?? input.grantedPermissions;
  const extra = requested.filter((p) => !input.grantedPermissions.includes(p));
  if (extra.length > 0 || EX16_LOCKS.ADAPTER_BROADENS_PERMISSIONS) {
    return ex16Deny('provider adapter cannot broaden permissions');
  }

  if (adapter.ownsMissionAuthority || EX16_LOCKS.ADAPTER_OWNS_MISSION_AUTHORITY) {
    return ex16Deny('adapter cannot own mission authority');
  }

  const offline = input.offline ?? true;
  if (offline && adapter.requiresExternalProvider) {
    const wait = resolveOfflineProviderNeed({
      offline: true,
      requiresExternalProvider: true,
      providerName: input.kind,
    });
    return {
      adapter,
      translationId: input.translation.translationId,
      missionId: input.problem.missionId,
      workloadIrId: input.problem.irId,
      permissions: input.grantedPermissions,
      status: 'WAITING_PROVIDER',
      note: wait.note,
    };
  }

  return {
    adapter,
    translationId: input.translation.translationId,
    missionId: input.problem.missionId,
    workloadIrId: input.problem.irId,
    permissions: input.grantedPermissions,
    status: 'BOUND',
    note: `syntax binding only; same workload IR ${input.problem.irId}`,
  };
}

export function vendorAdaptersShareWorkloadIr(
  problem: XivProblemIR,
  kinds: ProviderAdapterKind[] = ['AMD_COMPUTE', 'NVIDIA_COMPUTE', 'INTEL_COMPUTE'],
): { sharedIrId: string; bindings: AdapterBinding[] } {
  const translationStub: AlgorithmTranslation = {
    translationId: 'tr_stub',
    sourceIrId: problem.irId,
    targetRepresentation: 'CLASSICAL_GRAPH',
    executionClass: 'CLASSICAL',
    lossyState: 'LOSSLESS',
    semanticEquivalence: 'SEMANTICALLY_EQUIVALENT',
    objectivePreserved: true,
    approximationNotes: [],
    quboMatrix: null,
    isingCouplings: null,
    circuit: null,
    physicalQpuVerified: false,
    status: 'VALID',
    compilerVersion: 'ex16-compiler-1.0.0',
    schemaVersion: problem.schemaVersion,
    createdAt: problem.createdAt,
  };
  const actor = { tenantId: problem.tenantId, universeId: problem.universeId };
  const bindings: AdapterBinding[] = [];
  for (const kind of kinds) {
    const b = bindProviderAdapter({
      kind,
      problem,
      translation: translationStub,
      actor,
      grantedPermissions: ['translate'],
      offline: false,
    });
    if ('denied' in b) continue;
    bindings.push(b);
  }
  return { sharedIrId: problem.irId, bindings };
}
