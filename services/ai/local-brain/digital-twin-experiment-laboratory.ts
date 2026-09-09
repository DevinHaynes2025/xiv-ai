/**
 * 62L-DX Module C — Digital Twin Experiment Laboratory.
 * Reproducible experiments; sim ≠ fact; ≠ physical control.
 */

import { readJsonFile, writeJsonFileAtomic, xivLocalPath } from './durable-json';
import {
  MAX_TWIN_EXPERIMENTS,
  TWIN_LABELED_SIM,
  TWIN_NEQ_PHYSICAL,
  TWIN_SIM_NEQ_FACT,
  type DxActor,
} from './autonomous-supply-chain-ops-types';

export type TwinExperiment = {
  id: string;
  name: string;
  reproducible: true;
  labeledSimulation: true;
  verifiedFact: false;
  physicalControl: false;
  status: 'labeled_simulation' | 'denied';
  reason: string;
  createdAt: string;
};

type Store = { experiments: TwinExperiment[] };

function storePath(root: string) {
  return xivLocalPath(root, 'digital-twin-experiment-laboratory.json');
}

async function load(root: string): Promise<Store> {
  return readJsonFile<Store>(storePath(root), { experiments: [] });
}

async function save(root: string, store: Store) {
  await writeJsonFileAtomic(storePath(root), store);
}

function id(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function digitalTwinExperimentLaboratoryHonesty() {
  return {
    simEqVerifiedFact: false,
    twinEqPhysicalControl: false,
    reproducibleExperimentsLabeledOnly: true,
  };
}

export async function runTwinExperiment(input: {
  name: string;
  claimVerifiedFact?: boolean;
  attemptPhysicalControl?: boolean;
  root: string;
  actor: DxActor;
}): Promise<TwinExperiment> {
  const store = await load(input.root);
  void input.actor;
  if (store.experiments.length >= MAX_TWIN_EXPERIMENTS) {
    throw new Error('MAX_TWIN_EXPERIMENTS_REACHED');
  }

  let status: TwinExperiment['status'] = 'labeled_simulation';
  let reason = TWIN_LABELED_SIM;

  if (input.claimVerifiedFact === true) {
    status = 'denied';
    reason = TWIN_SIM_NEQ_FACT;
  } else if (input.attemptPhysicalControl === true) {
    status = 'denied';
    reason = TWIN_NEQ_PHYSICAL;
  }

  const experiment: TwinExperiment = {
    id: id('dxtwin'),
    name: input.name.trim(),
    reproducible: true,
    labeledSimulation: true,
    verifiedFact: false,
    physicalControl: false,
    status,
    reason,
    createdAt: new Date().toISOString(),
  };
  store.experiments.push(experiment);
  await save(input.root, store);
  return experiment;
}
