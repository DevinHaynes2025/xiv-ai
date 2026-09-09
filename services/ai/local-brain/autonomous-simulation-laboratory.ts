/**
 * 62L-CT D — Autonomous Simulation Laboratory
 * Multi-Universe simulation labs (bounded, labeled). sim ≠ verified fact/discovery.
 */

import { readJsonFile, writeJsonFileAtomic, xivLocalPath } from './durable-json';
import {
  CT_LOCKS,
  HONESTY_BANNER,
  SIM_NOT_VERIFIED_DISCOVERY,
  type CtActor,
} from './ai-research-civilization-os-types';

export type SimulationRun = {
  id: string;
  labId: string;
  universeIds: string[];
  labeled: true;
  label: 'LABELED_SIMULATION';
  verifiedDiscovery: false;
  status: 'completed' | 'denied';
  reason: string;
  createdAt: string;
};

export type DiscoveryLabelAttempt = {
  id: string;
  simulationId: string;
  requestedLabel: 'verified_discovery' | 'hypothesis';
  status: 'rejected' | 'accepted_as_simulation';
  reason: string;
  at: string;
};

type Store = { runs: SimulationRun[]; labels: DiscoveryLabelAttempt[] };

function storePath(root: string) {
  return xivLocalPath(root, 'autonomous-simulation-laboratory.json');
}

async function load(root: string): Promise<Store> {
  return readJsonFile<Store>(storePath(root), { runs: [], labels: [] });
}

async function save(root: string, store: Store) {
  await writeJsonFileAtomic(storePath(root), store);
}

function id(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function simulationLabHonesty() {
  return {
    banner: HONESTY_BANNER,
    multiUniverseLabeled: CT_LOCKS.MULTI_UNIVERSE_SIMS_LABELED,
    simEqVerifiedDiscovery: CT_LOCKS.SIM_EQ_VERIFIED_DISCOVERY,
    simAutoLabelVerified: CT_LOCKS.SIM_AUTO_LABEL_VERIFIED,
  };
}

export async function runMultiUniverseSimulation(input: {
  labId: string;
  universeIds: string[];
  root: string;
  actor: CtActor;
}): Promise<SimulationRun> {
  const store = await load(input.root);
  const run: SimulationRun = {
    id: id('sim'),
    labId: input.labId,
    universeIds: [...input.universeIds],
    labeled: true,
    label: 'LABELED_SIMULATION',
    verifiedDiscovery: false,
    status: 'completed',
    reason: SIM_NOT_VERIFIED_DISCOVERY,
    createdAt: new Date().toISOString(),
  };
  store.runs.push(run);
  await save(input.root, store);
  void input.actor;
  return run;
}

export async function attemptLabelSimAsVerifiedDiscovery(input: {
  simulationId: string;
  root: string;
  actor: CtActor;
}): Promise<DiscoveryLabelAttempt> {
  const store = await load(input.root);
  const attempt: DiscoveryLabelAttempt = {
    id: id('simlabel'),
    simulationId: input.simulationId,
    requestedLabel: 'verified_discovery',
    status: 'rejected',
    reason: SIM_NOT_VERIFIED_DISCOVERY,
    at: new Date().toISOString(),
  };
  store.labels.push(attempt);
  await save(input.root, store);
  void input.actor;
  return attempt;
}
