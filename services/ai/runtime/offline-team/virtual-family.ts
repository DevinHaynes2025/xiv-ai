export interface VirtualFamilyMember {
  agentId: string;
  genomeId: string;
  role: string;
  tenantId: string;
}

export interface VirtualFamily {
  familyId: string;
  tenantId: string;
  dimensionIds: readonly number[];
  members: readonly VirtualFamilyMember[];
  sharedLessonRefs: readonly string[];
  simulationOnly: true;
}

export const VIRTUAL_FAMILY_GUARDRAILS = {
  simulationOnly: true,
  maxDimensions: 100,
  maxMembers: 256,
  crossTenantMembershipAllowed: false,
  autonomousProductionAuthority: false,
  physicalPersonClaimAllowed: false,
} as const;

export function createVirtualFamily(input: Omit<VirtualFamily, 'simulationOnly'>): VirtualFamily {
  if (!input.familyId || !input.tenantId) throw new Error('family identity required');
  if (input.dimensionIds.length > VIRTUAL_FAMILY_GUARDRAILS.maxDimensions) throw new Error('dimension limit exceeded');
  if (input.members.length > VIRTUAL_FAMILY_GUARDRAILS.maxMembers) throw new Error('member limit exceeded');
  if (input.members.some((m) => m.tenantId !== input.tenantId)) throw new Error('cross-tenant virtual family membership forbidden');
  return Object.freeze({ ...input, dimensionIds: Object.freeze([...new Set(input.dimensionIds)]), members: Object.freeze([...input.members]), sharedLessonRefs: Object.freeze([...input.sharedLessonRefs]), simulationOnly: true as const });
}
