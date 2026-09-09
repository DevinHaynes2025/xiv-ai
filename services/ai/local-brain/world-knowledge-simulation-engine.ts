/**
 * 62L-CI World Knowledge Simulation Engine —
 * World/business simulation layer; clearly labeled; not auto fact promotion.
 */

import { readJsonFile, writeJsonFileAtomic, xivLocalPath } from './durable-json';
import {
  CI_LOCKS,
  HONESTY_BANNER,
  SIMULATION_LABELED_NOT_FACT,
  type CiActor,
} from './persistent-intelligence-economy-types';

export type SimulationKind = 'world' | 'business' | 'scenario';

export type SimulationRun = {
  id: string;
  kind: SimulationKind;
  scenario: string;
  output: string;
  label: 'LABELED_SIMULATION';
  verifiedFact: false;
  productionAuthorized: false;
  createdAt: string;
};

export type SimulationResult = {
  accepted: boolean;
  reason: string;
  run?: SimulationRun;
  at: string;
};

type Store = { runs: SimulationRun[] };

function storePath(root: string) {
  return xivLocalPath(root, 'world-knowledge-simulation-engine.json');
}

async function load(root: string): Promise<Store> {
  return readJsonFile<Store>(storePath(root), { runs: [] });
}

async function save(root: string, store: Store) {
  await writeJsonFileAtomic(storePath(root), store);
}

function id(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function simulationHonesty() {
  return {
    banner: HONESTY_BANNER,
    l4AutonomyEnabled: CI_LOCKS.L4_AUTONOMY_ENABLED,
    simulationIsVerifiedFact: CI_LOCKS.SIMULATION_IS_VERIFIED_FACT,
    simulationMustBeLabeled: CI_LOCKS.SIMULATION_MUST_BE_LABELED,
  };
}

export async function runWorldBusinessSimulation(input: {
  kind: SimulationKind;
  scenario: string;
  assumptions: string[];
  root: string;
  actor: CiActor;
}): Promise<SimulationResult> {
  void input.actor;
  const store = await load(input.root);
  const now = new Date().toISOString();
  const output = [
    `[LABELED_SIMULATION:${input.kind}]`,
    `scenario=${input.scenario}`,
    `assumptions=${input.assumptions.join('|') || 'none'}`,
    'NOT_VERIFIED_FACT',
  ].join(' ');

  const run: SimulationRun = {
    id: id('sim'),
    kind: input.kind,
    scenario: input.scenario,
    output,
    label: 'LABELED_SIMULATION',
    verifiedFact: false,
    productionAuthorized: false,
    createdAt: now,
  };
  store.runs.push(run);
  await save(input.root, store);
  return {
    accepted: true,
    reason: SIMULATION_LABELED_NOT_FACT,
    run,
    at: now,
  };
}

/** Attempt to promote simulation to verified fact — always DENIED. */
export async function attemptPromoteSimulationToVerifiedFact(input: {
  runId: string;
  root: string;
  actor: CiActor;
}): Promise<SimulationResult> {
  void input.actor;
  const store = await load(input.root);
  const run = store.runs.find((r) => r.id === input.runId);
  const now = new Date().toISOString();
  if (!run) {
    return { accepted: false, reason: 'SIMULATION_NOT_FOUND', at: now };
  }
  // Immutable honesty: never flip verifiedFact
  run.verifiedFact = false;
  run.label = 'LABELED_SIMULATION';
  await save(input.root, store);
  return {
    accepted: false,
    reason: SIMULATION_LABELED_NOT_FACT,
    run,
    at: now,
  };
}
