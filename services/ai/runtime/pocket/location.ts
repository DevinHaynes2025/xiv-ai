import { requestLocation } from '../everywhere/location';

export type PocketLocationRequest = {
  osPermissionGranted: boolean;
  xivScope: boolean;
  backgroundRequested: boolean;
  backgroundExplicitlyAllowed: boolean;
  purpose?: 'WAREHOUSE' | 'DELIVERY' | 'FIELD_SERVICE' | 'SUPPLY_CHAIN';
};

export function requestPocketLocation(request: PocketLocationRequest) {
  if (!request.osPermissionGranted) {
    return { granted: false as const, denial: 'gps_denied_without_os_permission', liveGpsPath: false as const };
  }
  if (!request.xivScope) {
    return { granted: false as const, denial: 'gps_denied_without_xiv_scope', liveGpsPath: false as const };
  }
  if (request.backgroundRequested && !request.backgroundExplicitlyAllowed) {
    return { granted: false as const, denial: 'background_location_denied_unless_explicitly_allowed', liveGpsPath: false as const };
  }
  const observation = requestLocation({
    permission: request.backgroundExplicitlyAllowed ? 'BACKGROUND_ALLOWED' : 'WHILE_USING_APP',
    requestedPrecision: 'APPROXIMATE',
    purpose: request.purpose ?? 'WAREHOUSE',
    agentId: 'warehouse',
    agentLocationScope: 'APPROXIMATE',
    tenantAllowsLocation: true,
  });
  return { granted: observation.granted, denial: observation.denial, liveGpsPath: false as const, precision: observation.precision };
}
