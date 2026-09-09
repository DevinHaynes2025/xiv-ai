/**
 * Phase 2I-AA Location Intelligence Fabric barrel.
 * Permission-gated GPS business modules. No covert tracking.
 */

export type {
  LocationAudit,
  LocationContext,
  LocationEvent,
  LocationGeofence,
  LocationPermissionHop,
  LocationPermissionState,
  LocationPolicy,
  LocationPrecision,
  LocationPurpose,
  LocationRetention,
  LocationRisk,
  LocationRoute,
  LocationScope,
} from './types';
export {
  LOCATION_PERMISSION_PATH,
  LOCATION_PERMISSION_STATES,
  LOCATION_PURPOSES,
  PRECISION_RANK,
} from './types';

export {
  covertTrackingAllowed,
  evaluateLocationAccess,
  gpsAutoAvailableToEveryAgent,
  listLocationPermissionPath,
  listLocationPermissionStates,
  listLocationPurposes,
  locationAgentMayExceedPrecision,
  openDefaultLocationPolicy,
} from './permissions';
export type { LocationAccessRequest } from './permissions';

export {
  assessLocationRisk,
  createGeofence,
  createLocationRoute,
  emitLocationEvent,
  openLocationContext,
  openLocationGateway,
} from './gateway';
export type { LocationGateway } from './gateway';

export {
  denyCovertLocationUse,
  isLegitimateLocationPurpose,
  listLocationBusinessModules,
} from './business';
export type { LocationBusinessModule } from './business';
