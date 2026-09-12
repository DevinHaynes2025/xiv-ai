/** Source inventory only. A definition, enabled seat, or loaded model is not a running agent. */
export type WorkforceMaturity = 'registered' | 'prototype' | 'available' | 'future';
export interface WorkforceCatalogEntry {
  id: string;
  name: string;
  status: WorkforceMaturity;
}
export interface ConfiguredWorkerSeat {
  id: string;
  enabled: boolean;
  maxConcurrentJobs: number;
  requiresOllama: boolean;
  mayWriteProduction: false;
}
export const WORKFORCE_CENSUS_SOURCES = Object.freeze({
  primaryCatalog: 'services/ai/runtime/agents.ts#XIV_AGENT_REGISTRY',
  defaultOfflineSeats: 'services/ai/runtime/offline-team/orchestrator.ts#DEFAULT_OFFLINE_TEAM',
});
const maturities: readonly WorkforceMaturity[] = ['registered', 'prototype', 'available', 'future'];
const text = (value: unknown): value is string => typeof value === 'string'
  && value.trim().length > 0 && value === value.trim() && value.length <= 256;
function uniqueIds(rows: readonly { id: string }[], label: string): void {
  if (!Array.isArray(rows) || rows.length > 10_000) throw new Error(`${label}: bounded array required`);
  const ids = new Set<string>();
  for (const row of rows) {
    if (!row || !text(row.id) || ids.has(row.id)) throw new Error(`${label}: missing or duplicate identity`);
    ids.add(row.id);
  }
}

/** Pure reporting: never authorizes work, launches processes, calls models, or accepts live-status booleans. */
export function buildAgentWorkforceCensus(input: {
  catalog: readonly WorkforceCatalogEntry[];
  offlineSeats: readonly ConfiguredWorkerSeat[];
  generatedAt: string;
}) {
  if (typeof input.generatedAt !== 'string' || !Number.isFinite(Date.parse(input.generatedAt))
    || new Date(input.generatedAt).toISOString() !== input.generatedAt) throw new Error('canonical UTC timestamp required');
  uniqueIds(input.catalog, 'catalog');
  uniqueIds(input.offlineSeats, 'offline seats');
  const byMaturity: Record<WorkforceMaturity, number> = { registered: 0, prototype: 0, available: 0, future: 0 };
  const definitions = input.catalog.map(entry => {
    if (!text(entry.name) || !maturities.includes(entry.status)) throw new Error('invalid catalog definition');
    byMaturity[entry.status] += 1;
    return Object.freeze({ id: entry.id, name: entry.name, maturity: entry.status });
  });
  let enabledSeats = 0;
  let configuredJobSlots = 0;
  const seats = input.offlineSeats.map(seat => {
    if (typeof seat.enabled !== 'boolean' || typeof seat.requiresOllama !== 'boolean'
      || seat.mayWriteProduction !== false || !Number.isSafeInteger(seat.maxConcurrentJobs)
      || seat.maxConcurrentJobs < 1 || seat.maxConcurrentJobs > 64) throw new Error('invalid offline seat configuration');
    if (seat.enabled) { enabledSeats += 1; configuredJobSlots += seat.maxConcurrentJobs; }
    return Object.freeze({ id: seat.id, enabledInConfiguration: seat.enabled,
      configuredJobSlots: seat.maxConcurrentJobs, requiresOllama: seat.requiresOllama });
  });
  return Object.freeze({
    schemaVersion: 1,
    generatedAt: input.generatedAt,
    evidenceKind: 'SOURCE_CONFIGURATION_ONLY',
    scope: WORKFORCE_CENSUS_SOURCES,
    primaryCatalog: Object.freeze({ definitionCount: definitions.length,
      byMaturity: Object.freeze(byMaturity), definitions: Object.freeze(definitions) }),
    defaultOfflineTeam: Object.freeze({ seatDefinitionCount: seats.length, enabledInConfiguration: enabledSeats,
      configuredJobSlots, seats: Object.freeze(seats) }),
    runtime: Object.freeze({ status: 'NOT_OBSERVED', registeredInstanceCount: null, runningInstanceCount: null,
      reason: 'No authenticated runtime-instance snapshot was collected. Unknown is not zero.' }),
    ecosystemTotal: null,
    inventoriesAdditive: false,
    modelCountIsAgentCount: false,
    allAgentsAligned: null,
    productionAuthorizationGranted: false,
    limits: Object.freeze([
      'Only the two named source inventories are counted; this is not a whole-repository census.',
      'Maturity labels, enabled seats and job-slot limits do not prove live execution or model availability.',
      'Roles and user-facing personas may overlap; do not add their counts to these inventories.',
      'Runtime totals require authenticated, tenant-scoped, deduplicated and fresh instance telemetry.',
    ]),
  });
}
