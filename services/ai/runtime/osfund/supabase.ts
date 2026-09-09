/**
 * Supabase capability contracts. Contract existence ≠ LIVE.
 * Only proven retrieval may elevate status; default remains NOT_CONFIGURED.
 */

import { SUPABASE_CAPABILITIES, type ConnectorLifecycle, type SupabaseCapability } from './types';

export type SupabaseCapabilityContract = {
  capability: SupabaseCapability;
  state: ConnectorLifecycle;
  productionLive: false;
};

export type SupabaseFabric = {
  capabilities: readonly SupabaseCapabilityContract[];
  productionLive: false;
  rlsRequired: true;
  agentReceivesServiceRoleKey: false;
};

const provenCapabilities = new Set<SupabaseCapability>();

export function resetSupabaseProofForTests(): void {
  provenCapabilities.clear();
}

export function recordSupabaseCapabilityProof(capability: SupabaseCapability): void {
  provenCapabilities.add(capability);
}

export function supabaseCapabilityState(capability: SupabaseCapability): ConnectorLifecycle {
  return provenCapabilities.has(capability) ? 'LIVE' : 'NOT_CONFIGURED';
}

export function openSupabaseFabric(): SupabaseFabric {
  return {
    capabilities: SUPABASE_CAPABILITIES.map((capability) => ({
      capability,
      state: supabaseCapabilityState(capability),
      productionLive: false as const,
    })),
    productionLive: false,
    rlsRequired: true,
    agentReceivesServiceRoleKey: false,
  };
}

export function supabaseIsLiveWithoutProof(): false {
  return false;
}

export function agentReceivesSupabaseServiceRoleKey(): false {
  return false;
}
