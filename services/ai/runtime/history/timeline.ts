/**
 * 62L-EX15 — Timeline graph (§17).
 * Edges: PRECEDED, INSPIRED, IMPROVED, REPLACED, FAILED_BECAUSE,
 * REVIVED_BY, DEPENDED_ON, COMPETED_WITH.
 * Graph updates cannot change permissions.
 */

import {
  TIMELINE_EDGE_TYPES,
  ex15Deny,
  type Ex15Denial,
  type TimelineEdge,
  type TimelineEdgeType,
} from './types.ts';
import { assertTenantUniverseAccess, type AtlasStore } from './atlas.ts';

export type TimelineStore = {
  edges: Map<string, TimelineEdge>;
};

export function createTimelineStore(): TimelineStore {
  return { edges: new Map() };
}

export function addTimelineEdge(
  store: TimelineStore,
  atlas: AtlasStore,
  input: {
    edgeId: string;
    fromEventId: string;
    toEventId: string;
    edgeType: TimelineEdgeType;
    actorTenantId: string;
    actorUniverseId: string;
    note?: string;
    attemptChangePermissions?: boolean;
  },
): TimelineEdge | Ex15Denial {
  if (input.attemptChangePermissions) {
    return ex15Deny('Graph updates cannot change permissions.');
  }
  if (!(TIMELINE_EDGE_TYPES as readonly string[]).includes(input.edgeType)) {
    return ex15Deny(`Unknown timeline edge type ${input.edgeType}.`);
  }

  const from = atlas.events.get(input.fromEventId);
  const to = atlas.events.get(input.toEventId);
  if (!from || !to) {
    return ex15Deny('Timeline edge requires both events to exist in atlas.');
  }

  const accessFrom = assertTenantUniverseAccess({
    resourceTenantId: from.tenantId,
    resourceUniverseId: from.universeId,
    actorTenantId: input.actorTenantId,
    actorUniverseId: input.actorUniverseId,
  });
  if ('denied' in accessFrom) return accessFrom;

  const accessTo = assertTenantUniverseAccess({
    resourceTenantId: to.tenantId,
    resourceUniverseId: to.universeId,
    actorTenantId: input.actorTenantId,
    actorUniverseId: input.actorUniverseId,
  });
  if ('denied' in accessTo) return accessTo;

  if (from.tenantId !== to.tenantId || from.universeId !== to.universeId) {
    return ex15Deny('Cross-tenant/Universe timeline edges DENIED.');
  }

  const edge: TimelineEdge = {
    edgeId: input.edgeId,
    fromEventId: input.fromEventId,
    toEventId: input.toEventId,
    edgeType: input.edgeType,
    tenantId: from.tenantId,
    universeId: from.universeId,
    note: input.note,
    permissionsUnchanged: true,
  };
  store.edges.set(edge.edgeId, edge);
  return edge;
}

export function listTimelineEdges(
  store: TimelineStore,
  filter?: { eventId?: string; edgeType?: TimelineEdgeType },
): TimelineEdge[] {
  const all = [...store.edges.values()];
  return all.filter((e) => {
    if (filter?.edgeType && e.edgeType !== filter.edgeType) return false;
    if (
      filter?.eventId &&
      e.fromEventId !== filter.eventId &&
      e.toEventId !== filter.eventId
    ) {
      return false;
    }
    return true;
  });
}
