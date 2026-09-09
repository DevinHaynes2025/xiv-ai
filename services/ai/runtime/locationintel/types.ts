/**
 * Phase 2I-AA Location Intelligence Fabric contracts.
 * No covert tracking. GPS never auto-available to every agent.
 * Permission path: OS → XIV → user/org → tenant → Universe → agent → purpose → precision → retention → audit
 */

export type LocationPermissionState =
  | 'LOCATION_DISABLED'
  | 'APPROXIMATE'
  | 'PRECISE'
  | 'ONE_TIME'
  | 'WHILE_USING_APP'
  | 'BACKGROUND_AUTHORIZED';

export type LocationPurpose =
  | 'NEARBY_SUPPLIERS'
  | 'WAREHOUSES'
  | 'STORES'
  | 'BUSINESS_EVENTS'
  | 'FIELD_OPS'
  | 'DELIVERY_STATUS'
  | 'ROUTE_CONTEXT'
  | 'REAL_ESTATE_CONTEXT'
  | 'GEOFENCED_WORKFLOWS'
  | 'SUPPLY_CHAIN_MAPS'
  | 'TRAVEL_MEETING_CONTEXT';

export type LocationPrecision = 'NONE' | 'APPROXIMATE' | 'PRECISE';

export type LocationScope = {
  tenantId: string;
  universeId: string;
  agentId: string;
  orgApproved: boolean;
  userApproved: boolean;
  osGranted: boolean;
  xivGranted: boolean;
};

export type LocationRetention = {
  expiresAt: string | null;
  indefinite: false;
  purposeBound: true;
};

export type LocationPolicy = {
  covertTracking: false;
  gpsAutoAvailableToEveryAgent: false;
  backgroundRequiresPolicy: true;
  precisionCeiling: LocationPrecision;
  allowedPurposes: readonly LocationPurpose[];
};

export type LocationEvent = {
  eventId: string;
  purpose: LocationPurpose;
  precision: LocationPrecision;
  state: LocationPermissionState;
  tenantId: string;
  universeId: string;
  agentId: string;
};

export type LocationAudit = {
  eventId: string;
  action: string;
  actor: string;
  at: string;
  purpose: LocationPurpose | null;
};

export type LocationGeofence = {
  geofenceId: string;
  tenantId: string;
  universeId: string;
  purpose: LocationPurpose;
  active: boolean;
};

export type LocationRoute = {
  routeId: string;
  tenantId: string;
  purpose: 'ROUTE_CONTEXT' | 'DELIVERY_STATUS' | 'FIELD_OPS';
};

export type LocationContext = {
  contextId: string;
  purpose: LocationPurpose;
  precision: LocationPrecision;
};

export type LocationRisk = {
  covertTrackingRisk: false;
  overCollectionRisk: boolean;
  backgroundWithoutPolicy: boolean;
};

export type LocationPermissionHop =
  | 'OS'
  | 'XIV'
  | 'USER_ORG'
  | 'TENANT'
  | 'UNIVERSE'
  | 'AGENT'
  | 'PURPOSE'
  | 'PRECISION'
  | 'RETENTION'
  | 'AUDIT';

export const LOCATION_PERMISSION_STATES: readonly LocationPermissionState[] = [
  'LOCATION_DISABLED',
  'APPROXIMATE',
  'PRECISE',
  'ONE_TIME',
  'WHILE_USING_APP',
  'BACKGROUND_AUTHORIZED',
] as const;

export const LOCATION_PURPOSES: readonly LocationPurpose[] = [
  'NEARBY_SUPPLIERS',
  'WAREHOUSES',
  'STORES',
  'BUSINESS_EVENTS',
  'FIELD_OPS',
  'DELIVERY_STATUS',
  'ROUTE_CONTEXT',
  'REAL_ESTATE_CONTEXT',
  'GEOFENCED_WORKFLOWS',
  'SUPPLY_CHAIN_MAPS',
  'TRAVEL_MEETING_CONTEXT',
] as const;

export const LOCATION_PERMISSION_PATH: readonly LocationPermissionHop[] = [
  'OS',
  'XIV',
  'USER_ORG',
  'TENANT',
  'UNIVERSE',
  'AGENT',
  'PURPOSE',
  'PRECISION',
  'RETENTION',
  'AUDIT',
] as const;

export const PRECISION_RANK: Record<LocationPrecision, number> = {
  NONE: 0,
  APPROXIMATE: 1,
  PRECISE: 2,
};
