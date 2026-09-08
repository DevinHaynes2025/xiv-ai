/**
 * Location Gateway — geofence, route, context, audit.
 */

import type {
  LocationAudit,
  LocationContext,
  LocationEvent,
  LocationGeofence,
  LocationPurpose,
  LocationRisk,
  LocationRoute,
} from './types';
import { evaluateLocationAccess, openDefaultLocationPolicy, type LocationAccessRequest } from './permissions';

export type LocationGateway = {
  gpsAutoAvailableToEveryAgent: false;
  covertTracking: false;
  productionLive: false;
};

export function openLocationGateway(): LocationGateway {
  return {
    gpsAutoAvailableToEveryAgent: false,
    covertTracking: false,
    productionLive: false,
  };
}

export function emitLocationEvent(
  request: LocationAccessRequest,
  ids: { eventId: string; agentId: string },
): { allowed: false; reason: string } | { allowed: true; event: LocationEvent; audit: LocationAudit } {
  const decision = evaluateLocationAccess(request);
  if (!decision.allowed) {
    return { allowed: false, reason: decision.reason };
  }
  const event: LocationEvent = {
    eventId: ids.eventId,
    purpose: decision.purpose,
    precision: decision.precision,
    state: decision.state,
    tenantId: request.scope.tenantId,
    universeId: request.scope.universeId,
    agentId: ids.agentId,
  };
  const audit: LocationAudit = {
    eventId: `locaudit_${ids.eventId}`,
    action: 'LOCATION_ACCESS',
    actor: ids.agentId,
    at: 'deterministic',
    purpose: decision.purpose,
  };
  return { allowed: true, event, audit };
}

export function createGeofence(input: {
  geofenceId: string;
  tenantId: string;
  universeId: string;
  purpose: LocationPurpose;
  covert?: boolean;
}): LocationGeofence | { allowed: false; reason: string } {
  if (input.covert === true) {
    return { allowed: false, reason: 'covert_tracking_forbidden' };
  }
  const policy = openDefaultLocationPolicy();
  if (!policy.allowedPurposes.includes(input.purpose)) {
    return { allowed: false, reason: 'purpose_not_allowed' };
  }
  return {
    geofenceId: input.geofenceId,
    tenantId: input.tenantId,
    universeId: input.universeId,
    purpose: input.purpose,
    active: true,
  };
}

export function createLocationRoute(input: {
  routeId: string;
  tenantId: string;
  purpose: LocationRoute['purpose'];
}): LocationRoute {
  return {
    routeId: input.routeId,
    tenantId: input.tenantId,
    purpose: input.purpose,
  };
}

export function openLocationContext(input: {
  contextId: string;
  purpose: LocationPurpose;
  precision: LocationContext['precision'];
}): LocationContext {
  return {
    contextId: input.contextId,
    purpose: input.purpose,
    precision: input.precision,
  };
}

export function assessLocationRisk(input: {
  backgroundWithoutPolicy?: boolean;
  overCollection?: boolean;
}): LocationRisk {
  return {
    covertTrackingRisk: false,
    overCollectionRisk: input.overCollection === true,
    backgroundWithoutPolicy: input.backgroundWithoutPolicy === true,
  };
}
