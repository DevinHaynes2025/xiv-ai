/**
 * 62L-DG Historical World Simulation Engine —
 * Historical timelines and pathway explorers; sim labeled; provenance required.
 */

import { readJsonFile, writeJsonFileAtomic, xivLocalPath } from './durable-json';
import {
  DG_LOCKS,
  HONESTY_BANNER,
  MAX_SIMULATION_TIMELINES,
  UNAUTHORIZED_HISTORICAL_SOURCE_DENIED,
  type DgActor,
} from './universal-personal-business-ai-os-types';

export type HistoricalSimulationEngine = {
  id: string;
  orgId: string;
  tenantId: string;
  universeId: string;
  createdAt: string;
};

export type HistoricalSource = {
  id: string;
  engineId: string;
  sourceId: string;
  authorized: boolean;
  provenanceBacked: boolean;
  status: 'REGISTERED' | 'DENIED';
  reason: string;
  at: string;
};

export type TimelineSimulation = {
  id: string;
  engineId: string;
  timelineId: string;
  sourceId: string;
  labeledSimulation: true;
  labeledVerifiedFact: false;
  status: 'LABELED_SIMULATION' | 'DENIED' | 'REJECTED';
  reason: string;
  at: string;
};

type Store = {
  engines: HistoricalSimulationEngine[];
  sources: HistoricalSource[];
  timelines: TimelineSimulation[];
};

function storePath(root: string) {
  return xivLocalPath(root, 'historical-world-simulation-engine.json');
}

async function load(root: string): Promise<Store> {
  return readJsonFile<Store>(storePath(root), {
    engines: [],
    sources: [],
    timelines: [],
  });
}

async function save(root: string, store: Store) {
  await writeJsonFileAtomic(storePath(root), store);
}

function id(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function historicalWorldSimulationHonesty() {
  return {
    banner: HONESTY_BANNER,
    unauthorizedHistoricalSource: DG_LOCKS.UNAUTHORIZED_HISTORICAL_SOURCE,
    historicalRequiresAuthorizedProvenance: DG_LOCKS.HISTORICAL_REQUIRES_AUTHORIZED_PROVENANCE,
    simulationsLabeled: true as const,
    forecastEqVerifiedFact: DG_LOCKS.FORECAST_EQ_VERIFIED_FACT,
  };
}

export async function bootstrapHistoricalWorldSimulationEngine(input: {
  orgId: string;
  tenantId: string;
  universeId: string;
  root: string;
  actor: DgActor;
}): Promise<HistoricalSimulationEngine> {
  void input.actor;
  const store = await load(input.root);
  const existing = store.engines.find(
    (e) =>
      e.orgId === input.orgId &&
      e.tenantId === input.tenantId &&
      e.universeId === input.universeId,
  );
  if (existing) return existing;
  const engine: HistoricalSimulationEngine = {
    id: id('dghist'),
    orgId: input.orgId,
    tenantId: input.tenantId,
    universeId: input.universeId,
    createdAt: new Date().toISOString(),
  };
  store.engines.push(engine);
  await save(input.root, store);
  return engine;
}

export async function registerHistoricalSource(input: {
  engineId: string;
  sourceId: string;
  authorized: boolean;
  provenanceBacked: boolean;
  root: string;
  actor: DgActor;
}): Promise<{ accepted: boolean; reason: string; source?: HistoricalSource }> {
  void input.actor;
  const store = await load(input.root);
  const ok = input.authorized && input.provenanceBacked;
  const source: HistoricalSource = {
    id: id('dghsrc'),
    engineId: input.engineId,
    sourceId: input.sourceId,
    authorized: input.authorized,
    provenanceBacked: input.provenanceBacked,
    status: ok ? 'REGISTERED' : 'DENIED',
    reason: ok
      ? 'AUTHORIZED_PROVENANCE_BACKED_SOURCE'
      : UNAUTHORIZED_HISTORICAL_SOURCE_DENIED,
    at: new Date().toISOString(),
  };
  store.sources.push(source);
  await save(input.root, store);
  return { accepted: ok, reason: source.reason, source };
}

export async function exploreHistoricalPathway(input: {
  engineId: string;
  timelineId: string;
  sourceId: string;
  root: string;
  actor: DgActor;
}): Promise<{ accepted: boolean; reason: string; timeline?: TimelineSimulation }> {
  void input.actor;
  const store = await load(input.root);
  if (store.timelines.filter((t) => t.engineId === input.engineId).length >= MAX_SIMULATION_TIMELINES) {
    return { accepted: false, reason: 'MAX_SIMULATION_TIMELINES' };
  }
  const source = store.sources.find(
    (s) =>
      s.engineId === input.engineId &&
      s.sourceId === input.sourceId &&
      s.status === 'REGISTERED',
  );
  if (!source) {
    const denied: TimelineSimulation = {
      id: id('dgtl'),
      engineId: input.engineId,
      timelineId: input.timelineId,
      sourceId: input.sourceId,
      labeledSimulation: true,
      labeledVerifiedFact: false,
      status: 'DENIED',
      reason: UNAUTHORIZED_HISTORICAL_SOURCE_DENIED,
      at: new Date().toISOString(),
    };
    store.timelines.push(denied);
    await save(input.root, store);
    return { accepted: false, reason: denied.reason, timeline: denied };
  }
  const timeline: TimelineSimulation = {
    id: id('dgtl'),
    engineId: input.engineId,
    timelineId: input.timelineId,
    sourceId: input.sourceId,
    labeledSimulation: true,
    labeledVerifiedFact: false,
    status: 'LABELED_SIMULATION',
    reason: 'HISTORICAL_PATHWAY_LABELED_SIMULATION',
    at: new Date().toISOString(),
  };
  store.timelines.push(timeline);
  await save(input.root, store);
  return { accepted: true, reason: timeline.reason, timeline };
}
