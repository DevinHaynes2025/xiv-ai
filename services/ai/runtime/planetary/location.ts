import { companyEntersGlobalBrainAutomatically, evaluateBrainTransfer } from '../fabric';
import { connectivityIsAuthAuthority } from '../pocket/connectors';
import { requestPocketLocation } from '../pocket/location';
import type { LocationPrecision } from '../everywhere/types';
import type { LocationPrecisionClass, LocationPurpose } from './types';

export type LocationProvider = {
  providerId: string;
  class: 'DEVICE_GPS' | 'BUSINESS_PLACES' | 'LOGISTICS_TELEMATICS' | 'SATELLITE_DERIVED';
  status: 'NOT_CONFIGURED';
};

export type LocationObservation = {
  granted: boolean;
  purpose?: LocationPurpose;
  precision?: LocationPrecisionClass;
  liveGpsPath: false;
};

export type LocationSource = 'ANDROID' | 'IOS' | 'PLACES' | 'GEOCODING' | 'CARRIER' | 'TELEMATICS';
export type LocationPermission = {
  osPermission: boolean;
  xivPermission: boolean;
  purpose: LocationPurpose | null;
  tenantAuthorization: boolean;
  universeAuthorization: boolean;
  agentPermission: boolean;
  precisionAuthorization: LocationPrecisionClass;
  retentionPolicy: string;
  audit: true;
};
export type LocationEvidence = { source: string; retrievedAt: string; reference: string };
export type LocationFreshness = 'UNKNOWN' | 'STALE' | 'CURRENT';
export type LocationConfidence = 'unknown' | 'low' | 'medium' | 'high';
export type Geofence = { geofenceId: string; purpose: LocationPurpose };
export type GeospatialEntity = { entityId: string; class: string; universeId: string };

export const LOCATION_FABRIC_PROVIDERS: readonly LocationProvider[] = [
  { providerId: 'device_gps_android', class: 'DEVICE_GPS', status: 'NOT_CONFIGURED' },
  { providerId: 'device_gps_ios', class: 'DEVICE_GPS', status: 'NOT_CONFIGURED' },
  { providerId: 'business_places', class: 'BUSINESS_PLACES', status: 'NOT_CONFIGURED' },
  { providerId: 'business_geocoding', class: 'BUSINESS_PLACES', status: 'NOT_CONFIGURED' },
  { providerId: 'carrier_telematics', class: 'LOGISTICS_TELEMATICS', status: 'NOT_CONFIGURED' },
  { providerId: 'satellite_derived', class: 'SATELLITE_DERIVED', status: 'NOT_CONFIGURED' },
];

export function planetaryGps(input: {
  osPermissionGranted: boolean;
  purpose?: LocationPurpose;
  grantedPrecision: LocationPrecision;
  requestedPrecision: LocationPrecision;
}): LocationObservation & { denial?: string } {
  if (!input.osPermissionGranted) {
    return { granted: false, denial: 'gps_denied_without_permission', liveGpsPath: false };
  }
  if (!input.purpose) {
    return { granted: false, denial: 'gps_denied_without_purpose', liveGpsPath: false };
  }
  if (input.requestedPrecision === 'PRECISE' && input.grantedPrecision === 'APPROXIMATE') {
    return { granted: false, denial: 'gps_precision_cannot_exceed_grant', liveGpsPath: false };
  }
  return requestPocketLocation({
    osPermissionGranted: true,
    xivScope: true,
    backgroundRequested: false,
    backgroundExplicitlyAllowed: false,
    purpose: input.purpose === 'PORT' ? 'SUPPLY_CHAIN' : input.purpose,
  });
}

export function privateLocationEntersGlobalBrain(): boolean {
  return companyEntersGlobalBrainAutomatically() || evaluateBrainTransfer({ from: 'personal', to: 'global' }).allowed;
}

export function telecomConnectivityIsLocationAuthority(): boolean {
  return connectivityIsAuthAuthority('CELLULAR') || connectivityIsAuthAuthority('SATELLITE');
}

export function googleLocationIntegrationLive(): false {
  return false;
}

export function globalRealtimeGpsCoverageClaimed(): false {
  return false;
}
