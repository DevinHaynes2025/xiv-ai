export type CommunitySurface = 'PUBLIC_BUSINESS' | 'PRIVATE_ORG' | 'LEARNING_HUB' | 'IDEA_MARKET' | 'XIV_UNIVERSE';
export type UniverseKind = 'BUSINESS_WORLD' | 'TRAVEL_WORLD' | 'ROBOTICS_WORLD' | 'MOBILITY_WORLD' | 'ACADEMY_WORLD' | 'SIMULATION_WORLD';

export interface CommunityPolicy {
  surface: CommunitySurface;
  tenantScoped: boolean;
  publicReadable: boolean;
  ageGateRequired: boolean;
  offlineCapable: boolean;
}

export interface UniverseNode {
  universeId: string;
  tenantId?: string;
  kind: UniverseKind;
  dimensionIds: readonly number[];
  simulationOnly: true;
  memberAgentIds: readonly string[];
  evidenceRefs: readonly string[];
}

export const COMMUNITY_POLICIES: readonly CommunityPolicy[] = Object.freeze([
  { surface: 'PUBLIC_BUSINESS', tenantScoped: false, publicReadable: true, ageGateRequired: true, offlineCapable: false },
  { surface: 'PRIVATE_ORG', tenantScoped: true, publicReadable: false, ageGateRequired: true, offlineCapable: true },
  { surface: 'LEARNING_HUB', tenantScoped: false, publicReadable: true, ageGateRequired: true, offlineCapable: true },
  { surface: 'IDEA_MARKET', tenantScoped: false, publicReadable: true, ageGateRequired: true, offlineCapable: false },
  { surface: 'XIV_UNIVERSE', tenantScoped: false, publicReadable: false, ageGateRequired: true, offlineCapable: true },
]);

export const XIV_UNIVERSE_GUARDRAILS = {
  simulationOnly: true,
  physicalPortalClaimAllowed: false,
  crossTenantPrivateDataAllowed: false,
  autonomousProductionMutationAllowed: false,
  maxDimensionsPerUniverse: 100,
} as const;

export function createUniverseNode(input: UniverseNode): UniverseNode {
  if (!input.universeId.trim()) throw new Error('universeId required');
  if (input.dimensionIds.some((d) => !Number.isInteger(d) || d < 1 || d > XIV_UNIVERSE_GUARDRAILS.maxDimensionsPerUniverse)) {
    throw new Error('dimension ids must be integers between 1 and 100');
  }
  return Object.freeze({
    ...input,
    dimensionIds: Object.freeze([...new Set(input.dimensionIds)]),
    memberAgentIds: Object.freeze([...new Set(input.memberAgentIds)]),
    evidenceRefs: Object.freeze([...input.evidenceRefs]),
    simulationOnly: true,
  });
}
