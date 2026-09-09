export type KpiObservation = {
  metric: string;
  value: number | null;
  unit: string;
  observedAt: string;
  sourceRefs: string[];
  stale: boolean;
};

export type KpiResult = KpiObservation & {
  state: 'VERIFIED' | 'STALE' | 'UNKNOWN';
  productionEffect: false;
};

export function evaluateKpi(observation: KpiObservation): KpiResult {
  if (observation.value === null || !Number.isFinite(observation.value)) {
    return { ...observation, value: null, state: 'UNKNOWN', productionEffect: false };
  }
  if (observation.sourceRefs.length === 0) {
    return { ...observation, state: 'UNKNOWN', productionEffect: false };
  }
  return {
    ...observation,
    state: observation.stale ? 'STALE' : 'VERIFIED',
    productionEffect: false,
  };
}

export function percentChange(current: KpiResult, prior: KpiResult) {
  if (current.state === 'UNKNOWN' || prior.state === 'UNKNOWN' || current.value === null || prior.value === null || prior.value === 0) {
    return { value: null, state: 'UNKNOWN' as const };
  }
  const value = ((current.value - prior.value) / Math.abs(prior.value)) * 100;
  return { value, state: current.state === 'STALE' || prior.state === 'STALE' ? 'STALE' as const : 'VERIFIED' as const };
}
