import { randomUUID } from 'node:crypto';

import { readJsonFile, writeJsonFileAtomic, xivLocalPath } from './durable-json';
import { evaluateOfflineTask } from './offline-policy';

export type HistoricalRecord = {
  id: string;
  tenantId: string;
  universeId: string;
  sourceId: string;
  era: string;
  observedAt: string;
  summary: string;
  provenanceRefs: string[];
  stale: boolean;
};

export type TimelineEdge = {
  id: string;
  from: string;
  to: string;
  relation: 'precedes' | 'supersedes' | 'same_era';
};

export type FreshnessVerdict = {
  state: 'FRESH' | 'STALE' | 'WAITING_DATA';
  stale: boolean;
  reason: string;
};

type RegistryStore = {
  records: HistoricalRecord[];
  edges: TimelineEdge[];
};

function pathFor(root: string) {
  return xivLocalPath(root, 'historical-data-registry.json');
}

async function load(root: string): Promise<RegistryStore> {
  const parsed = await readJsonFile<RegistryStore>(pathFor(root), { records: [], edges: [] });
  return {
    records: Array.isArray(parsed.records) ? parsed.records : [],
    edges: Array.isArray(parsed.edges) ? parsed.edges : [],
  };
}

async function save(root: string, store: RegistryStore) {
  await writeJsonFileAtomic(pathFor(root), {
    records: store.records.slice(-10_000),
    edges: store.edges.slice(-20_000),
  });
}

export async function registerHistoricalRecord(input: {
  tenantId: string;
  universeId: string;
  sourceId: string;
  era: string;
  observedAt: string;
  summary: string;
  provenanceRefs: string[];
  root?: string;
}) {
  if (!input.tenantId || !input.universeId) throw new Error('HISTORICAL_SCOPE_REQUIRED');
  if (input.provenanceRefs.length === 0) throw new Error('HISTORICAL_PROVENANCE_REQUIRED');
  const root = input.root ?? process.cwd();
  const store = await load(root);
  const record: HistoricalRecord = {
    id: `hist_${randomUUID()}`,
    tenantId: input.tenantId,
    universeId: input.universeId,
    sourceId: input.sourceId,
    era: input.era,
    observedAt: input.observedAt,
    summary: input.summary.trim(),
    provenanceRefs: [...input.provenanceRefs],
    stale: false,
  };
  store.records.push(record);
  await save(root, store);
  return record;
}

export async function linkTimeline(input: {
  tenantId: string;
  universeId: string;
  from: string;
  to: string;
  relation: TimelineEdge['relation'];
  root?: string;
}) {
  const root = input.root ?? process.cwd();
  const store = await load(root);
  const from = store.records.find((item) => item.id === input.from && item.tenantId === input.tenantId && item.universeId === input.universeId);
  const to = store.records.find((item) => item.id === input.to && item.tenantId === input.tenantId && item.universeId === input.universeId);
  if (!from || !to) throw new Error('TIMELINE_ENDPOINT_MISSING');
  if (from.id === to.id) throw new Error('TIMELINE_LOOP_DENIED');
  const edge: TimelineEdge = { id: `tl_${randomUUID()}`, from: from.id, to: to.id, relation: input.relation };
  store.edges.push(edge);
  await save(root, store);
  return edge;
}

export function freshnessEngine(input: {
  observedAt: string;
  now?: string;
  maxAgeMs: number;
  needsExternalFreshness?: boolean;
}): FreshnessVerdict {
  if (input.needsExternalFreshness) {
    const offline = evaluateOfflineTask({
      needsInternet: true,
      needsCloudProvider: false,
      needsExternalFreshness: true,
      needsProductionWrite: false,
      needsPermissionChange: false,
      classification: 'internal',
    });
    return { state: 'WAITING_DATA', stale: true, reason: offline.reason };
  }
  const now = Date.parse(input.now ?? new Date().toISOString());
  const observed = Date.parse(input.observedAt);
  if (!Number.isFinite(now) || !Number.isFinite(observed)) {
    return { state: 'WAITING_DATA', stale: true, reason: 'Observed timestamp could not be parsed.' };
  }
  if (now - observed > input.maxAgeMs) {
    return { state: 'STALE', stale: true, reason: 'Record exceeded the local freshness window. Refresh in place; do not copy a stale warehouse.' };
  }
  return { state: 'FRESH', stale: false, reason: 'Record is within the local freshness window.' };
}

export async function listHistoricalRecords(input: { tenantId: string; universeId: string; root?: string }) {
  const store = await load(input.root ?? process.cwd());
  return {
    records: store.records.filter((item) => item.tenantId === input.tenantId && item.universeId === input.universeId),
    edges: store.edges,
  };
}
