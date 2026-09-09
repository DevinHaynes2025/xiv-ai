import type { ConfidenceBand, ProviderCapabilityStatus } from './types';

export type EarthObservationProvider = {
  providerId: string;
  class: 'SATELLITE' | 'WEATHER' | 'MARITIME' | 'PORT' | 'AGRICULTURE' | 'INFRASTRUCTURE' | 'DISASTER' | 'OPEN_SCIENCE';
  status: ProviderCapabilityStatus;
  partnershipClaimed: false;
};

export type EarthObservation = {
  provider: string;
  dataset: string;
  license: string;
  timestamp?: string;
  retrievedAt: string;
  geography: string;
  resolution?: string;
  evidence: { source: string; retrievedAt: string; reference: string };
  stance: 'OBSERVATION' | 'FORECAST' | 'SCENARIO';
  isFact: boolean;
};

export type SatelliteObservation = EarthObservation & { class: 'SATELLITE' };
export type WeatherObservation = EarthObservation & { class: 'WEATHER' };
export type MaritimeObservation = EarthObservation & { class: 'MARITIME' };
export type PortObservation = EarthObservation & { class: 'PORT' };
export type AgricultureObservation = EarthObservation & { class: 'AGRICULTURE' };
export type InfrastructureObservation = EarthObservation & { class: 'INFRASTRUCTURE' };
export type DisasterObservation = EarthObservation & { class: 'DISASTER' };
export type GeospatialEvidence = EarthObservation['evidence'] & { license: string };

export type EarthTwinEntity = { entityId: string; class: 'COMPANY' | 'PRODUCT' | 'LOGISTICS' | 'GEOSPATIAL' };
export type EarthTwinRelationship = { from: string; to: string; kind: string };
export type EarthTwinObservation = EarthObservation;
export type EarthTwinState = { observed: true; simulated: false };
export type EarthTwinScenario = { scenarioId: string; isFact: false; isSimulation: true };
export type EarthTwinConfidence = ConfidenceBand;

export const EARTH_OBSERVATION_PROVIDERS: readonly EarthObservationProvider[] = [
  { providerId: 'nasa_open_science', class: 'OPEN_SCIENCE', status: 'NOT_CONFIGURED', partnershipClaimed: false },
  { providerId: 'open_eo', class: 'SATELLITE', status: 'NOT_CONFIGURED', partnershipClaimed: false },
  { providerId: 'public_weather', class: 'WEATHER', status: 'NOT_CONFIGURED', partnershipClaimed: false },
];

export function createEarthObservation(input: {
  provider: string;
  dataset?: string;
  license?: string;
  timestamp?: string;
  retrievedAt?: string;
  geography: string;
  resolution?: string;
}): EarthObservation | { allowed: false; reason: string } {
  if (!input.dataset || !input.license || !input.retrievedAt) {
    return { allowed: false, reason: 'satellite_observation_requires_provenance' };
  }
  return {
    provider: input.provider,
    dataset: input.dataset,
    license: input.license,
    timestamp: input.timestamp ?? input.retrievedAt,
    retrievedAt: input.retrievedAt,
    geography: input.geography,
    resolution: input.resolution,
    evidence: { source: input.provider, retrievedAt: input.retrievedAt, reference: input.dataset },
    stance: 'OBSERVATION',
    isFact: false,
  };
}

export function earthObservationIsForecast(observation: EarthObservation): boolean {
  return observation.stance === 'FORECAST';
}

export function earthTwinScenarioIsFact(): false {
  return false;
}

export function openEarthTwinScenario(scenarioId: string): EarthTwinScenario {
  return { scenarioId, isFact: false, isSimulation: true };
}

export function scienceProviderStatus(id: 'nasa' | 'starlink' | 'att' | 'verizon' | 'cisco'): 'NOT_CONFIGURED' {
  void id;
  return 'NOT_CONFIGURED';
}

export function nasaPartnershipClaimed(): false {
  return false;
}

export function globalSatelliteCoverageClaimed(): false {
  return false;
}

export function earthTwinIsRealtimeCopyOfEarth(): false {
  return false;
}
