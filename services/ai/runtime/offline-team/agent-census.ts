/** Inventory is not liveness. This reporter never grants tool or execution authority. */
export interface CensusDefinition { id: string; name: string; status: string }
export interface CensusSeat { id: string; enabled: boolean; requiresOllama: boolean }
export function buildAgentCensus(definitions: readonly CensusDefinition[], seats: readonly CensusSeat[]) {
  const allowed = new Set(['registered', 'prototype', 'available', 'future']);
  const seen = new Set<string>();
  const statusCounts = { registered: 0, prototype: 0, available: 0, future: 0 };
  const core = definitions.map(d => {
    if (!d || typeof d.id !== 'string' || !d.id.trim() || seen.has(d.id)
      || typeof d.name !== 'string' || !d.name.trim() || !allowed.has(d.status)) throw new Error('invalid or duplicate core definition');
    seen.add(d.id); statusCounts[d.status as keyof typeof statusCounts]++;
    return Object.freeze({ id: d.id, name: d.name, declaredStatus: d.status });
  });
  const seatIds = new Set<string>();
  const workers = seats.map(s => {
    if (!s || typeof s.id !== 'string' || !s.id.trim() || seatIds.has(s.id)
      || typeof s.enabled !== 'boolean' || typeof s.requiresOllama !== 'boolean') throw new Error('invalid or duplicate worker seat');
    seatIds.add(s.id);
    return Object.freeze({ id: s.id, configuredEnabled: s.enabled, requiresOllama: s.requiresOllama });
  });
  return Object.freeze({
    scope: 'CORE_REGISTRY_AND_DEFAULT_OFFLINE_TEAM',
    coreDefinitionCount: core.length, declaredStatusCounts: Object.freeze(statusCounts),
    configuredOfflineSeatCount: workers.length, configuredEnabledSeatCount: workers.filter(s => s.configuredEnabled).length,
    coreDefinitions: Object.freeze(core), offlineSeats: Object.freeze(workers),
    liveAgentCount: null, liveAgentCountState: 'UNKNOWN_NO_INSTANCE_TELEMETRY',
    countsAreAdditive: false, productionReadinessInferred: false,
  });
}
