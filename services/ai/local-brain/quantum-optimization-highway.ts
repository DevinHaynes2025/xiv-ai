/**
 * 62L-EB Module C — Quantum Optimization Highway.
 * Quantum-inspired optimization benchmarking with classical baselines.
 * Benchmark ≠ verified fact; no unverified supremacy.
 */

import { readJsonFile, writeJsonFileAtomic, xivLocalPath } from './durable-json';
import {
  MAX_QUANTUM_BENCH,
  NO_UNVERIFIED_SUPREMACY,
  QUANTUM_BENCHMARK_NEQ_FACT,
  QUANTUM_NEEDS_CLASSICAL,
  type EbActor,
  type EbEvidenceState,
} from './multi-model-superbrain-federation-types';

export type QuantumBenchmark = {
  id: string;
  candidateId: string;
  classicalBaselinePresent: boolean;
  supremacyClaimed: boolean;
  reproducible: boolean;
  evidenceBacked: boolean;
  status: 'candidate' | 'benchmark_pass' | 'rejected' | 'denied';
  state: EbEvidenceState;
  reason: string;
  verifiedFact: false;
  createdAt: string;
};

type Store = {
  benchmarks: QuantumBenchmark[];
};

function storePath(root: string) {
  return xivLocalPath(root, 'quantum-optimization-highway.json');
}

async function load(root: string): Promise<Store> {
  return readJsonFile<Store>(storePath(root), { benchmarks: [] });
}

async function save(root: string, store: Store) {
  await writeJsonFileAtomic(storePath(root), store);
}

function id(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function quantumOptimizationHighwayHonesty() {
  return {
    classicalBaselineRequired: true,
    noUnverifiedSupremacy: true,
    benchmarkNeqVerifiedFact: true,
    quantumInspiredEqPhysicalQuantum: false,
    simForecastNeqVerifiedFact: true,
  };
}

export async function runQuantumOptimizationBenchmark(input: {
  candidateId: string;
  classicalBaselinePresent: boolean;
  supremacyClaimed?: boolean;
  reproducible?: boolean;
  evidenceBacked?: boolean;
  root: string;
  actor: EbActor;
}): Promise<QuantumBenchmark> {
  const store = await load(input.root);
  void input.actor;
  if (store.benchmarks.length >= MAX_QUANTUM_BENCH) {
    throw new Error('MAX_QUANTUM_BENCH_REACHED');
  }

  if (!input.classicalBaselinePresent) {
    const denied: QuantumBenchmark = {
      id: id('ebqoh'),
      candidateId: input.candidateId.trim(),
      classicalBaselinePresent: false,
      supremacyClaimed: Boolean(input.supremacyClaimed),
      reproducible: false,
      evidenceBacked: false,
      status: 'denied',
      state: 'CLASSICAL_BASELINE_REQUIRED',
      reason: QUANTUM_NEEDS_CLASSICAL,
      verifiedFact: false,
      createdAt: new Date().toISOString(),
    };
    store.benchmarks.push(denied);
    await save(input.root, store);
    return denied;
  }

  if (input.supremacyClaimed) {
    const denied: QuantumBenchmark = {
      id: id('ebqoh'),
      candidateId: input.candidateId.trim(),
      classicalBaselinePresent: true,
      supremacyClaimed: true,
      reproducible: Boolean(input.reproducible),
      evidenceBacked: Boolean(input.evidenceBacked),
      status: 'denied',
      state: 'DENIED',
      reason: NO_UNVERIFIED_SUPREMACY,
      verifiedFact: false,
      createdAt: new Date().toISOString(),
    };
    store.benchmarks.push(denied);
    await save(input.root, store);
    return denied;
  }

  const pass = Boolean(input.reproducible) && Boolean(input.evidenceBacked);
  const bench: QuantumBenchmark = {
    id: id('ebqoh'),
    candidateId: input.candidateId.trim(),
    classicalBaselinePresent: true,
    supremacyClaimed: false,
    reproducible: Boolean(input.reproducible),
    evidenceBacked: Boolean(input.evidenceBacked),
    status: pass ? 'benchmark_pass' : 'candidate',
    state: pass ? 'LABELED_EXPERIMENT' : 'CANDIDATE',
    reason: QUANTUM_BENCHMARK_NEQ_FACT,
    verifiedFact: false,
    createdAt: new Date().toISOString(),
  };
  store.benchmarks.push(bench);
  await save(input.root, store);
  return bench;
}
