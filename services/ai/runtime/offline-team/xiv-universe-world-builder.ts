export type UniverseVisibility = 'PRIVATE' | 'TEAM' | 'PUBLIC_BUSINESS';
export type UniverseZone = 'HOME' | 'VENTURE' | 'LAB' | 'MARKETPLACE' | 'EVENT' | 'SIMULATION';

export interface UniverseWorld {
  universeId: string;
  tenantId: string;
  ownerUserId: string;
  visibility: UniverseVisibility;
  zones: UniverseZone[];
  authorizedAgentIds: string[];
  deviceTargets: Array<'PHONE'|'TABLET'|'LAPTOP'|'DESKTOP'|'SMART_TV'|'CAR'|'XR'>;
  productionMutationAllowed: false;
}

export function validateUniverse(world: UniverseWorld): string[] {
  const errors: string[] = [];
  if (!world.universeId || !world.tenantId || !world.ownerUserId) errors.push('identity required');
  if (world.authorizedAgentIds.length > 8) errors.push('max 8 concurrently authorized agents');
  if (world.productionMutationAllowed !== false) errors.push('production mutation must remain disabled');
  return errors;
}

export const universePolicy = {
  privateByDefault: true,
  rawPrivateCrossUniverseSharing: false,
  topSecretExternalRendering: false,
  simulationsAreNotReality: true,
  agentIdentityIsGovernedDigitalIdentity: true,
};
