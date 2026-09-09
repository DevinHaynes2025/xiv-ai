import type { Universe, UniverseMembership, UniverseRole } from './types';

export function membershipIsActive(membership: UniverseMembership | undefined): membership is UniverseMembership {
  return Boolean(membership && membership.status === 'active' && membership.universeId && membership.organizationId);
}

export function roleInUniverse(membership: UniverseMembership | undefined, roles: readonly UniverseRole[]) {
  return membershipIsActive(membership) && roles.includes(membership.role);
}

export function universeExists(universe: Universe | undefined): universe is Universe {
  return Boolean(universe?.universeId && universe.organizationId);
}
