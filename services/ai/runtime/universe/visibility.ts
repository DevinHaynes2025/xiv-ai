import type { UniverseRole, UniverseVisibility } from './types';

const ROLE_VISIBILITY: Record<UniverseRole, readonly UniverseVisibility[]> = {
  owner: ['private', 'universe', 'organization', 'employees', 'public'],
  executive: ['private', 'universe', 'organization', 'employees', 'public'],
  admin: ['universe', 'organization', 'employees', 'public'],
  manager: ['universe', 'organization', 'employees', 'public'],
  employee: ['organization', 'employees', 'public'],
  member: ['universe', 'public'],
  consumer_guest: ['public'],
  agent: ['universe', 'organization', 'employees', 'public'],
};

export function roleMaySeeVisibility(role: UniverseRole, visibility: UniverseVisibility) {
  return ROLE_VISIBILITY[role].includes(visibility);
}

export function isPublicVisibility(visibility: UniverseVisibility) {
  return visibility === 'public';
}
