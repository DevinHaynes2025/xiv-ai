export { SUPPLY_CHAIN_AGENTS_V2 } from './supply';

export const GEOSPATIAL_AGENTS = [
  'Location Fabric',
  'Geofence',
  'Geospatial Evidence',
  'Privacy Zone',
  'Precision Grant',
] as const;

export const EARTH_INTELLIGENCE_AGENTS = [
  'Earth Observation',
  'Satellite Provenance',
  'Weather Exposure',
  'Port Observation',
  'Maritime',
  'Agriculture',
  'Infrastructure',
  'Disaster',
  'Earth Twin Scenario',
] as const;

export const DATABASE_AGENTS_V2 = [
  'Universe Catalog',
  'Tiered Storage',
  'Retention',
  'Deduplication',
  'Fingerprint',
  'Source Reference',
] as const;

export function agentAgreementCreatesAuthority(): false {
  return false;
}
