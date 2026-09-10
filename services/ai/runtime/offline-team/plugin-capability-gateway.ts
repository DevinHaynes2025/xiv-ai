export type CapabilityStatus = 'AVAILABLE' | 'UNVERIFIED' | 'BLOCKED';

export interface PluginCapability {
  id: string;
  provider: string;
  capability: string;
  status: CapabilityStatus;
  online: boolean;
  tenantScoped: boolean;
  canReceiveSecrets: boolean;
  evidenceRefs: string[];
}

export function verifyPluginCapability(input: PluginCapability): PluginCapability {
  if (!input.tenantScoped) return { ...input, status: 'BLOCKED' };
  if (input.canReceiveSecrets) return { ...input, status: 'BLOCKED' };
  if (!input.evidenceRefs.length) return { ...input, status: 'UNVERIFIED' };
  return { ...input, status: 'AVAILABLE' };
}

export function selectCapability(
  capabilities: PluginCapability[],
  capability: string,
  requireOffline: boolean,
): PluginCapability | null {
  return capabilities
    .map(verifyPluginCapability)
    .filter(x => x.status === 'AVAILABLE' && x.capability === capability && (!requireOffline || !x.online))
    .sort((a, b) => Number(a.online) - Number(b.online))[0] ?? null;
}

export const PLUGIN_GATEWAY_GUARDRAILS = {
  explicitCapabilityRegistration: true,
  tenantScopeRequired: true,
  rawSecretsToPluginsAllowed: false,
  evidenceBeforeAvailable: true,
  productionAuthorityGrantedByPlugin: false,
};
