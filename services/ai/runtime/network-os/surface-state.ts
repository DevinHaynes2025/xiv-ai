/**
 * Shared data-surface vocabulary for premium UX.
 * Never present FORECAST/INFERENCE/DEMO as LIVE facts.
 */
export const DATA_SURFACE_STATES = [
  'LIVE',
  'CONNECTED',
  'SYNCING',
  'STALE',
  'DEGRADED',
  'NOT_CONFIGURED',
  'DEMO',
  'HISTORICAL',
  'INFERENCE',
  'FORECAST',
  'UNAVAILABLE',
] as const;

export type DataSurfaceState = (typeof DATA_SURFACE_STATES)[number];

export type SurfaceProvenance = {
  source: string;
  timestamp: string | null;
  freshness: DataSurfaceState;
  dataQuality: 'unknown' | 'explained' | 'not_measured';
};

export function isDataSurfaceState(value: string): value is DataSurfaceState {
  return (DATA_SURFACE_STATES as readonly string[]).includes(value);
}

export function surfaceMayBePresentedAsFact(state: DataSurfaceState) {
  return state === 'LIVE' || state === 'HISTORICAL' || state === 'CONNECTED';
}

export function forecastIsNotAFact(state: DataSurfaceState) {
  return state === 'FORECAST';
}

export function inferenceIsNotAFact(state: DataSurfaceState) {
  return state === 'INFERENCE';
}

export function liveDemoInferenceForecastSeparated(states: readonly DataSurfaceState[]) {
  const unique = new Set(states);
  return unique.has('LIVE') && unique.has('DEMO') && unique.has('INFERENCE') && unique.has('FORECAST');
}

export function demoSurfaceMustBeLabeled(state: DataSurfaceState) {
  return state === 'DEMO';
}

export function cardRequiresSourcePath(input: SurfaceProvenance) {
  return Boolean(input.source && (input.timestamp || input.freshness === 'NOT_CONFIGURED' || input.freshness === 'DEMO' || input.freshness === 'UNAVAILABLE'));
}
