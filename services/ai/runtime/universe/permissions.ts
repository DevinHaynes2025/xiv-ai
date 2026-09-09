import { canAgentAccessClassification } from '../security/classification';
import type { XivAgentId } from '../agents';
import { membershipIsActive, universeExists } from './membership';
import type { Universe, UniverseMembership, UniverseResource } from './types';
import { isPublicVisibility, roleMaySeeVisibility } from './visibility';

export type ResourceAccessInput = {
  universe?: Universe;
  membership?: UniverseMembership;
  resource?: Partial<UniverseResource> & { visibility?: UniverseResource['visibility'] };
};

function denyMissingMetadata(input: ResourceAccessInput) {
  if (!universeExists(input.universe)) return 'Unknown Universe: DENY';
  if (!input.universe.organizationId) return 'Missing organization: DENY';
  const resource = input.resource;
  if (!resource) return 'Missing ownership metadata: DENY';
  if (!resource.resourceId || !resource.universeId || !resource.organizationId || !resource.ownerId) {
    return 'Missing ownership metadata: DENY';
  }
  return null;
}

export function canReadUniverseResource(input: ResourceAccessInput) {
  const denied = denyMissingMetadata(input);
  if (denied) return { allowed: false as const, reason: denied };
  const universe = input.universe;
  if (!universeExists(universe)) {
    return { allowed: false as const, reason: 'Unknown Universe: DENY' };
  }
  const resource = input.resource as UniverseResource;
  if (resource.universeId !== universe.universeId || resource.organizationId !== universe.organizationId) {
    return { allowed: false as const, reason: 'A resource from Universe A must not be readable from Universe B.' };
  }
  if (isPublicVisibility(resource.visibility)) {
    return { allowed: true as const, reason: 'Public visibility is readable.' };
  }
  if (!membershipIsActive(input.membership)) {
    return { allowed: false as const, reason: 'DEFAULT = DENY. No active membership.' };
  }
  if (input.membership.universeId !== universe.universeId) {
    return { allowed: false as const, reason: 'Membership is for another Universe: DENY' };
  }
  if (!roleMaySeeVisibility(input.membership.role, resource.visibility)) {
    return { allowed: false as const, reason: 'Role cannot read this visibility: DENY' };
  }
  return { allowed: true as const, reason: 'Membership permits read.' };
}

export function canPublishUniverseResource(input: ResourceAccessInput) {
  const denied = denyMissingMetadata(input);
  if (denied) return { allowed: false as const, reason: denied };
  if (!membershipIsActive(input.membership)) {
    return { allowed: false as const, reason: 'DEFAULT = DENY. Publishing requires an active membership.' };
  }
  const publishRoles = ['owner', 'executive', 'admin', 'manager'] as const;
  if (!publishRoles.includes(input.membership.role as (typeof publishRoles)[number])) {
    return { allowed: false as const, reason: 'Role cannot publish: DENY' };
  }
  if (input.membership.universeId !== input.universe?.universeId) {
    return { allowed: false as const, reason: 'Cannot publish into another Universe: DENY' };
  }
  return { allowed: true as const, reason: 'Publishing is authorized as a draft/policy check only. No production write.' };
}

export function canAgentAccessUniverseResource(
  agentId: XivAgentId,
  input: ResourceAccessInput,
) {
  const read = canReadUniverseResource(input);
  if (!read.allowed) return read;
  const classification = input.resource?.classification ?? 'restricted';
  if (!canAgentAccessClassification(agentId, classification)) {
    return { allowed: false as const, reason: `${agentId} cannot access ${classification} Universe data.` };
  }
  if (agentId === 'guardian' && classification !== 'public') {
    return { allowed: false as const, reason: 'Guardian cannot read private business data.' };
  }
  return { allowed: true as const, reason: 'Agent may observe this resource through the governed gateway.' };
}
