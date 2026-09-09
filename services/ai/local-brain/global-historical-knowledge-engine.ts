/**
 * 62L-DH Global Historical Knowledge Engine —
 * Coverage maps + pathway discovery; provenance- and rights-aware.
 * Unauthorized historical ingestion DENIED.
 */

import { readJsonFile, writeJsonFileAtomic, xivLocalPath } from './durable-json';
import {
  DH_LOCKS,
  HONESTY_BANNER,
  MAX_HISTORICAL_COVERAGE_MAPS,
  UNAUTHORIZED_HISTORICAL_INGESTION_DENIED,
  type DhActor,
} from './adaptive-life-business-intelligence-os-types';

export type HistoricalKnowledgeEngine = {
  id: string;
  orgId: string;
  tenantId: string;
  universeId: string;
  createdAt: string;
};

export type CoverageMap = {
  id: string;
  engineId: string;
  mapId: string;
  region: string;
  status: 'REGISTERED' | 'DENIED';
  reason: string;
  createdAt: string;
};

export type HistoricalIngestion = {
  id: string;
  engineId: string;
  sourceId: string;
  provenancePresent: boolean;
  rightsCleared: boolean;
  authorized: boolean;
  status: 'ACCEPTED' | 'DENIED';
  reason: string;
  at: string;
};

export type PathwayDiscovery = {
  id: string;
  engineId: string;
  pathwayId: string;
  provenanceBacked: boolean;
  status: 'DISCOVERED' | 'DENIED';
  reason: string;
  at: string;
};

type Store = {
  engines: HistoricalKnowledgeEngine[];
  maps: CoverageMap[];
  ingestions: HistoricalIngestion[];
  pathways: PathwayDiscovery[];
};

function storePath(root: string) {
  return xivLocalPath(root, 'global-historical-knowledge-engine.json');
}

async function load(root: string): Promise<Store> {
  return readJsonFile<Store>(storePath(root), {
    engines: [],
    maps: [],
    ingestions: [],
    pathways: [],
  });
}

async function save(root: string, store: Store) {
  await writeJsonFileAtomic(storePath(root), store);
}

function id(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function globalHistoricalKnowledgeEngineHonesty() {
  return {
    banner: HONESTY_BANNER,
    unauthorizedHistoricalIngestion: DH_LOCKS.UNAUTHORIZED_HISTORICAL_INGESTION,
    requiresProvenanceAndRights: DH_LOCKS.HISTORICAL_REQUIRES_PROVENANCE_AND_RIGHTS,
  };
}

export async function bootstrapGlobalHistoricalKnowledgeEngine(input: {
  orgId: string;
  tenantId: string;
  universeId: string;
  root: string;
  actor: DhActor;
}): Promise<HistoricalKnowledgeEngine> {
  void input.actor;
  const store = await load(input.root);
  const existing = store.engines.find(
    (e) =>
      e.orgId === input.orgId &&
      e.tenantId === input.tenantId &&
      e.universeId === input.universeId,
  );
  if (existing) return existing;
  const engine: HistoricalKnowledgeEngine = {
    id: id('dhhk'),
    orgId: input.orgId,
    tenantId: input.tenantId,
    universeId: input.universeId,
    createdAt: new Date().toISOString(),
  };
  store.engines.push(engine);
  await save(input.root, store);
  return engine;
}

export async function registerHistoricalCoverageMap(input: {
  engineId: string;
  mapId: string;
  region: string;
  root: string;
  actor: DhActor;
}): Promise<{ accepted: boolean; reason: string; map?: CoverageMap; at: string }> {
  void input.actor;
  const store = await load(input.root);
  const now = new Date().toISOString();
  const engine = store.engines.find((e) => e.id === input.engineId);
  if (!engine) return { accepted: false, reason: 'HISTORICAL_ENGINE_NOT_FOUND', at: now };
  if (store.maps.length >= MAX_HISTORICAL_COVERAGE_MAPS) {
    return { accepted: false, reason: 'MAX_HISTORICAL_COVERAGE_MAPS_BOUNDED', at: now };
  }
  const map: CoverageMap = {
    id: id('dhcm'),
    engineId: engine.id,
    mapId: (input.mapId ?? '').trim() || 'unnamed-map',
    region: (input.region ?? '').trim() || 'unspecified',
    status: 'REGISTERED',
    reason: 'HISTORICAL_COVERAGE_MAP_REGISTERED_CONTRACT',
    createdAt: now,
  };
  store.maps.push(map);
  await save(input.root, store);
  return { accepted: true, reason: map.reason, map, at: now };
}

export async function ingestHistoricalSource(input: {
  engineId: string;
  sourceId: string;
  provenancePresent?: boolean;
  rightsCleared?: boolean;
  authorized?: boolean;
  root: string;
  actor: DhActor;
}): Promise<{ accepted: boolean; reason: string; ingestion?: HistoricalIngestion; at: string }> {
  void input.actor;
  const store = await load(input.root);
  const now = new Date().toISOString();
  const engine = store.engines.find((e) => e.id === input.engineId);
  if (!engine) return { accepted: false, reason: 'HISTORICAL_ENGINE_NOT_FOUND', at: now };

  const provenancePresent = input.provenancePresent === true;
  const rightsCleared = input.rightsCleared === true;
  const authorized = input.authorized === true;

  if (!authorized || !provenancePresent || !rightsCleared) {
    const ingestion: HistoricalIngestion = {
      id: id('dhin'),
      engineId: engine.id,
      sourceId: (input.sourceId ?? '').trim() || 'unnamed-source',
      provenancePresent,
      rightsCleared,
      authorized,
      status: 'DENIED',
      reason: UNAUTHORIZED_HISTORICAL_INGESTION_DENIED,
      at: now,
    };
    store.ingestions.push(ingestion);
    await save(input.root, store);
    return { accepted: false, reason: ingestion.reason, ingestion, at: now };
  }

  const ingestion: HistoricalIngestion = {
    id: id('dhin'),
    engineId: engine.id,
    sourceId: (input.sourceId ?? '').trim() || 'unnamed-source',
    provenancePresent: true,
    rightsCleared: true,
    authorized: true,
    status: 'ACCEPTED',
    reason: 'AUTHORIZED_PROVENANCE_RIGHTS_AWARE_HISTORICAL_INGESTION',
    at: now,
  };
  store.ingestions.push(ingestion);
  await save(input.root, store);
  return { accepted: true, reason: ingestion.reason, ingestion, at: now };
}

export async function discoverHistoricalPathway(input: {
  engineId: string;
  pathwayId: string;
  provenanceBacked?: boolean;
  authorized?: boolean;
  root: string;
  actor: DhActor;
}): Promise<{ accepted: boolean; reason: string; pathway?: PathwayDiscovery; at: string }> {
  void input.actor;
  const store = await load(input.root);
  const now = new Date().toISOString();
  const engine = store.engines.find((e) => e.id === input.engineId);
  if (!engine) return { accepted: false, reason: 'HISTORICAL_ENGINE_NOT_FOUND', at: now };

  const provenanceBacked = input.provenanceBacked === true;
  const authorized = input.authorized === true;

  if (!authorized || !provenanceBacked) {
    const pathway: PathwayDiscovery = {
      id: id('dhpw'),
      engineId: engine.id,
      pathwayId: (input.pathwayId ?? '').trim() || 'unnamed-pathway',
      provenanceBacked,
      status: 'DENIED',
      reason: UNAUTHORIZED_HISTORICAL_INGESTION_DENIED,
      at: now,
    };
    store.pathways.push(pathway);
    await save(input.root, store);
    return { accepted: false, reason: pathway.reason, pathway, at: now };
  }

  const pathway: PathwayDiscovery = {
    id: id('dhpw'),
    engineId: engine.id,
    pathwayId: (input.pathwayId ?? '').trim() || 'unnamed-pathway',
    provenanceBacked: true,
    status: 'DISCOVERED',
    reason: 'PROVENANCE_BACKED_HISTORICAL_PATHWAY_DISCOVERED',
    at: now,
  };
  store.pathways.push(pathway);
  await save(input.root, store);
  return { accepted: true, reason: pathway.reason, pathway, at: now };
}
