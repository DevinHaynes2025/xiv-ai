export type ToolHealth = 'ACTIVE' | 'AVAILABLE' | 'PAUSED' | 'OFFLINE' | 'UNVERIFIED';

export interface ToolHeartbeat {
  toolId: string;
  kind: 'LOCAL' | 'PLUGIN' | 'API';
  health: ToolHealth;
  checkedAt: string;
  evidenceRefs: string[];
  capabilities: string[];
  tenantScoped: boolean;
  topSecretAllowed: boolean;
}

export const HEARTBEAT_GUARDRAILS = {
  activeRequiresEvidence: true,
  topSecretExternalAllowed: false,
  crossTenantAccess: false,
  productionMutationAllowed: false,
};

export function normalizeHeartbeat(input: ToolHeartbeat): ToolHeartbeat {
  const health = input.health === 'ACTIVE' && input.evidenceRefs.length === 0 ? 'UNVERIFIED' : input.health;
  return {
    ...input,
    health,
    capabilities: [...new Set(input.capabilities)],
    evidenceRefs: [...new Set(input.evidenceRefs)],
    topSecretAllowed: input.kind === 'LOCAL' ? input.topSecretAllowed : false,
  };
}

export function usableHeartbeat(input: ToolHeartbeat): boolean {
  const hb = normalizeHeartbeat(input);
  return (hb.health === 'ACTIVE' || hb.health === 'AVAILABLE') && hb.evidenceRefs.length > 0;
}
