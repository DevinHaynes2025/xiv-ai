import type { UniverseResource } from './types';

export function resourceIsolationKey(resource: Pick<UniverseResource, 'universeId' | 'organizationId' | 'resourceId'>) {
  return `${resource.universeId}:${resource.organizationId}:${resource.resourceId}`;
}

export function resourcesShareUniverse(a: Pick<UniverseResource, 'universeId'>, b: Pick<UniverseResource, 'universeId'>) {
  return Boolean(a.universeId && b.universeId && a.universeId === b.universeId);
}
