/**
 * 62L-EE Module D — Lean Enterprise Optimization Engine.
 * Lean / Six Sigma / Kaizen; algorithm benchmarking.
 * Experiment ≠ production change; classical baselines for quantum-inspired.
 * Self-promotion denied.
 */

import { readJsonFile, writeJsonFileAtomic, xivLocalPath } from './durable-json';
import {
  BENCHMARK_NEQ_PROD,
  CLASSICAL_BASELINE_REQUIRED,
  LEAN_EXPERIMENT_ONLY,
  MAX_LEAN_EXPERIMENTS,
  type EeActor,
  type EeEvidenceState,
} from './data-nervous-system-types';

export type LeanExperiment = {
  id: string;
  method: 'lean' | 'six_sigma' | 'kaizen';
  applyToProductionRequested: boolean;
  status: 'experiment_only' | 'denied';
  state: EeEvidenceState;
  reason: string;
  productionChanged: false;
  at: string;
};

export type AlgorithmBenchmark = {
  id: string;
  name: string;
  quantumInspired: boolean;
  classicalBaselinePresent: boolean;
  promoteToProdRequested: boolean;
  status: 'ok' | 'denied';
  state: EeEvidenceState;
  reason: string;
  productionChanged: false;
  at: string;
};

type Store = {
  experiments: LeanExperiment[];
  benchmarks: AlgorithmBenchmark[];
};

function storePath(root: string) {
  return xivLocalPath(root, 'lean-enterprise-optimization-engine.json');
}

async function load(root: string): Promise<Store> {
  return readJsonFile<Store>(storePath(root), {
    experiments: [],
    benchmarks: [],
  });
}

async function save(root: string, store: Store) {
  await writeJsonFileAtomic(storePath(root), store);
}

function id(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function leanEnterpriseOptimizationEngineHonesty() {
  return {
    leanSixSigmaKaizenExperimentOnly: true,
    experimentNeqProdChange: true,
    algorithmBenchmarkNeqProdChange: true,
    classicalBaselineWhenQuantumInspired: true,
    selfPromotionDenied: true,
    productionChanged: false,
  };
}

export async function runLeanExperiment(input: {
  method: 'lean' | 'six_sigma' | 'kaizen';
  applyToProductionRequested?: boolean;
  root: string;
  actor: EeActor;
}): Promise<LeanExperiment> {
  const store = await load(input.root);
  void input.actor;
  if (store.experiments.length >= MAX_LEAN_EXPERIMENTS) {
    throw new Error('MAX_LEAN_EXPERIMENTS_REACHED');
  }
  const apply = Boolean(input.applyToProductionRequested);
  const exp: LeanExperiment = {
    id: id('eelean'),
    method: input.method,
    applyToProductionRequested: apply,
    status: apply ? 'denied' : 'experiment_only',
    state: apply ? 'DENIED' : 'LABELED_EXPERIMENT',
    reason: LEAN_EXPERIMENT_ONLY,
    productionChanged: false,
    at: new Date().toISOString(),
  };
  store.experiments.push(exp);
  await save(input.root, store);
  return exp;
}

export async function runAlgorithmBenchmark(input: {
  name: string;
  quantumInspired?: boolean;
  classicalBaselinePresent?: boolean;
  promoteToProdRequested?: boolean;
  root: string;
  actor: EeActor;
}): Promise<AlgorithmBenchmark> {
  const store = await load(input.root);
  void input.actor;
  if (store.benchmarks.length >= MAX_LEAN_EXPERIMENTS) {
    throw new Error('MAX_LEAN_EXPERIMENTS_REACHED');
  }
  const qi = Boolean(input.quantumInspired);
  const baseline = Boolean(input.classicalBaselinePresent);
  const promote = Boolean(input.promoteToProdRequested);
  let status: AlgorithmBenchmark['status'] = 'ok';
  let state: EeEvidenceState = 'LABELED_EXPERIMENT';
  let reason = BENCHMARK_NEQ_PROD;

  if (qi && !baseline) {
    status = 'denied';
    state = 'CLASSICAL_BASELINE_REQUIRED';
    reason = CLASSICAL_BASELINE_REQUIRED;
  } else if (promote) {
    status = 'denied';
    state = 'PROMOTION_DENIED';
    reason = BENCHMARK_NEQ_PROD;
  }

  const bench: AlgorithmBenchmark = {
    id: id('eebench'),
    name: input.name.trim(),
    quantumInspired: qi,
    classicalBaselinePresent: baseline,
    promoteToProdRequested: promote,
    status,
    state,
    reason,
    productionChanged: false,
    at: new Date().toISOString(),
  };
  store.benchmarks.push(bench);
  await save(input.root, store);
  return bench;
}
