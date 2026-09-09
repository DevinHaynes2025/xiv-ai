/**
 * 62L-DY Module C — Autonomous Experiment & Optimization Lab.
 * Bounded algorithm experiments; optimization benchmarking; candidates from
 * measured bottlenecks; compare classical / ML / quantum-inspired;
 * retain only reproducible evidence-backed improvements.
 * Experiment candidate ≠ production change.
 * Quantum-inspired requires classical baselines; no unverified supremacy.
 */

import { readJsonFile, writeJsonFileAtomic, xivLocalPath } from './durable-json';
import {
  EXPERIMENT_NEQ_PROD,
  MAX_EXPERIMENTS,
  QUANTUM_NEEDS_CLASSICAL,
  RETAIN_REPRODUCIBLE_ONLY,
  SUPREMACY_DENIED,
  type DyActor,
} from './intelligent-supply-chain-command-types';

export type ExperimentFamily = 'classical' | 'ml' | 'quantum_inspired';

export type ExperimentCandidate = {
  id: string;
  bottleneckId: string;
  family: ExperimentFamily;
  classicalBaselinePresent: boolean;
  reproducible: boolean;
  evidenceBacked: boolean;
  supremacyClaimed: boolean;
  productionChangeAuthorized: false;
  status: 'candidate' | 'retained' | 'rejected' | 'denied';
  reason: string;
  createdAt: string;
};

type Store = {
  experiments: ExperimentCandidate[];
};

function storePath(root: string) {
  return xivLocalPath(root, 'autonomous-experiment-optimization-lab.json');
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

export function autonomousExperimentOptimizationLabHonesty() {
  return {
    experimentCandidateNeqProductionChange: true,
    classicalBaselineRequiredForQuantumInspired: true,
    retainOnlyReproducibleEvidenceBacked: true,
    noUnverifiedSupremacyClaims: true,
    quantumInspiredEqPhysicalQuantum: false,
    simForecastExperimentNeqVerifiedFact: true,
  };
}

export async function generateExperimentFromBottleneck(input: {
  bottleneckId: string;
  family: ExperimentFamily;
  classicalBaselinePresent: boolean;
  attemptProductionChange?: boolean;
  root: string;
  actor: DyActor;
}): Promise<ExperimentCandidate> {
  const store = await load(input.root);
  void input.actor;
  if (store.experiments.length >= MAX_EXPERIMENTS) {
    throw new Error('MAX_EXPERIMENTS_REACHED');
  }
  if (
    input.family === 'quantum_inspired' &&
    !input.classicalBaselinePresent
  ) {
    const denied: ExperimentCandidate = {
      id: id('dyexp'),
      bottleneckId: input.bottleneckId.trim(),
      family: input.family,
      classicalBaselinePresent: false,
      reproducible: false,
      evidenceBacked: false,
      supremacyClaimed: false,
      productionChangeAuthorized: false,
      status: 'denied',
      reason: QUANTUM_NEEDS_CLASSICAL,
      createdAt: new Date().toISOString(),
    };
    store.experiments.push(denied);
    await save(input.root, store);
    return denied;
  }
  const candidate: ExperimentCandidate = {
    id: id('dyexp'),
    bottleneckId: input.bottleneckId.trim(),
    family: input.family,
    classicalBaselinePresent: input.classicalBaselinePresent,
    reproducible: false,
    evidenceBacked: false,
    supremacyClaimed: false,
    productionChangeAuthorized: false,
    status: 'candidate',
    reason: EXPERIMENT_NEQ_PROD,
    createdAt: new Date().toISOString(),
  };
  store.experiments.push(candidate);
  await save(input.root, store);
  return candidate;
}

export async function evaluateExperimentRetention(input: {
  experimentId: string;
  reproducible: boolean;
  evidenceBacked: boolean;
  root: string;
  actor: DyActor;
}): Promise<ExperimentCandidate> {
  const store = await load(input.root);
  void input.actor;
  const exp = store.experiments.find((e) => e.id === input.experimentId);
  if (!exp) throw new Error('EXPERIMENT_NOT_FOUND');
  const keep = input.reproducible && input.evidenceBacked;
  exp.reproducible = input.reproducible;
  exp.evidenceBacked = input.evidenceBacked;
  exp.productionChangeAuthorized = false;
  exp.status = keep ? 'retained' : 'rejected';
  exp.reason = keep ? RETAIN_REPRODUCIBLE_ONLY : RETAIN_REPRODUCIBLE_ONLY;
  await save(input.root, store);
  return exp;
}

export async function denyUnverifiedSupremacyClaim(input: {
  experimentId: string;
  supremacyClaimed: boolean;
  verifiedEvidence: boolean;
  root: string;
  actor: DyActor;
}): Promise<ExperimentCandidate> {
  const store = await load(input.root);
  void input.actor;
  const exp = store.experiments.find((e) => e.id === input.experimentId);
  if (!exp) throw new Error('EXPERIMENT_NOT_FOUND');
  if (input.supremacyClaimed && !input.verifiedEvidence) {
    exp.supremacyClaimed = true;
    exp.status = 'denied';
    exp.reason = SUPREMACY_DENIED;
    exp.productionChangeAuthorized = false;
  }
  await save(input.root, store);
  return exp;
}
