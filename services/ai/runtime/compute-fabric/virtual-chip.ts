/**
 * 62L-EX17 — XIV_VIRTUAL_CHIP + COMPUTE_HIGHWAYS + software wormholes.
 * Shared contract / adapters only — no proprietary chip internals.
 * Wormholes never bypass auth / Guardian / tenant / Universe.
 */

import {
  EX17_LOCKS,
  ex17Deny,
  type ComputeClass,
  type ComputeHighway,
  type Ex17Denial,
  type SoftwareWormhole,
  type TenantScope,
  type VirtualChip,
} from './types.ts';

export function createVirtualChip(
  chipId: string,
  mapsTo: ComputeClass,
): VirtualChip {
  return {
    chipId,
    kind: 'XIV_VIRTUAL_CHIP',
    softwareAbstraction: true,
    mapsTo,
    proprietaryInternalsExposed: false,
  };
}

export function createComputeHighway(
  highwayId: string,
  from: ComputeClass,
  to: ComputeClass,
): ComputeHighway {
  return {
    highwayId,
    from,
    to,
    authRequired: true,
  };
}

export type WormholeOpenInput = {
  wormholeId: string;
  fromNode: string;
  toNode: string;
  scope: TenantScope;
  actorTenantId: string;
  actorUniverseId: string;
  guardianActive: boolean;
  runtimeAuthorized: boolean;
  /** Hostile attempt — must fail. */
  bypassAuth?: boolean;
};

export function openSoftwareWormhole(
  input: WormholeOpenInput,
): SoftwareWormhole | Ex17Denial {
  if (input.bypassAuth || EX17_LOCKS.WORMHOLE_BYPASS_AUTH) {
    return ex17Deny('WORMHOLE_BYPASS_AUTH_DENIED');
  }
  if (!input.guardianActive) {
    return ex17Deny('WORMHOLE_GUARDIAN_REQUIRED');
  }
  if (!input.runtimeAuthorized) {
    return ex17Deny('WORMHOLE_RUNTIME_UNAUTHORIZED');
  }
  if (input.actorTenantId !== input.scope.tenantId) {
    return ex17Deny('CROSS_TENANT_WORMHOLE_DENIED');
  }
  if (input.actorUniverseId !== input.scope.universeId) {
    return ex17Deny('CROSS_UNIVERSE_WORMHOLE_DENIED');
  }
  return {
    wormholeId: input.wormholeId,
    fromNode: input.fromNode,
    toNode: input.toNode,
    authRequired: true,
    bypassAuth: false,
    tenantId: input.scope.tenantId,
    universeId: input.scope.universeId,
    guardianActive: true,
  };
}

/** Cross-chip bridge adapter — shared contract only. */
export type CrossChipBridge = {
  bridgeId: string;
  sharedContract: 'XIV_COMPUTE_BRIDGE_V1';
  adapterOnly: true;
  proprietaryInternals: false;
  from: ComputeClass;
  to: ComputeClass;
};

export function createCrossChipBridge(
  bridgeId: string,
  from: ComputeClass,
  to: ComputeClass,
): CrossChipBridge {
  return {
    bridgeId,
    sharedContract: 'XIV_COMPUTE_BRIDGE_V1',
    adapterOnly: true,
    proprietaryInternals: false,
    from,
    to,
  };
}
