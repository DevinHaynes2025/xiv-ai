/**
 * 62L-EK Module E — Quantum Research Lab + benchmark compare + truth states.
 * ASUS = quantum-development workstation via simulators/math — not a claimed
 * connected QPU unless PHYSICAL_QPU_VERIFIED.
 * No quantum-advantage claim unless quantum method beats strong classical
 * baselines under reproducible conditions.
 */

import { readJsonFile, writeJsonFileAtomic, xivLocalPath } from './durable-json';
import {
  ASUS_NEQ_PHYSICAL_QPU,
  MAX_QUANTUM_EVENTS,
  QUANTUM_ADVANTAGE_DENIED,
  QUANTUM_BENCHMARK_METRICS,
  QUANTUM_METHOD_LADDER,
  QUANTUM_TRUTH_STATES,
  type EkActor,
  type EkEvidenceState,
  type QuantumTruthState,
} from './windows-amd-local-cognitive-os-types';

export type QuantumExperiment = {
  id: string;
  experimentId: string;
  truthState: QuantumTruthState;
  method: (typeof QUANTUM_METHOD_LADDER)[number];
  status: 'ok' | 'denied';
  state: EkEvidenceState;
  reason: string;
  physicalQpuClaimed: false;
  at: string;
};

export type QuantumBenchmark = {
  id: string;
  experimentId: string;
  methodsCompared: string[];
  metrics: typeof QUANTUM_BENCHMARK_METRICS;
  quantumBeatsClassicalBaselines: boolean;
  reproducible: boolean;
  advantageClaimed: boolean;
  status: 'ok' | 'denied';
  state: EkEvidenceState;
  reason: string;
  at: string;
};

export type QuantumAdvantageProbe = {
  id: string;
  claimAdvantage: boolean;
  beatsClassicalBaselines: boolean;
  reproducible: boolean;
  status: 'denied' | 'ok';
  state: EkEvidenceState;
  reason: string;
  at: string;
};

type Store = {
  experiments: QuantumExperiment[];
  benchmarks: QuantumBenchmark[];
  advantages: QuantumAdvantageProbe[];
};

function storePath(root: string) {
  return xivLocalPath(root, 'quantum-research-lab.json');
}

async function load(root: string): Promise<Store> {
  return readJsonFile<Store>(storePath(root), {
    experiments: [],
    benchmarks: [],
    advantages: [],
  });
}

async function save(root: string, store: Store) {
  await writeJsonFileAtomic(storePath(root), store);
}

function id(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function quantumResearchLabHonesty() {
  return {
    truthStates: QUANTUM_TRUTH_STATES,
    methodLadder: QUANTUM_METHOD_LADDER,
    benchmarkMetrics: QUANTUM_BENCHMARK_METRICS,
    asusNeqPhysicalQpuUnlessVerified: true,
    quantumAdvantageNeedsReproducibleBaselines: true,
    asusIsQuantumDevWorkstationViaSimulators: true,
    l4AutonomyEnabled: false,
  };
}

export async function registerQuantumExperiment(input: {
  experimentId: string;
  truthState: QuantumTruthState;
  method: (typeof QUANTUM_METHOD_LADDER)[number];
  claimPhysicalQpu?: boolean;
  root: string;
  actor: EkActor;
}): Promise<QuantumExperiment> {
  void input.actor;
  const store = await load(input.root);
  if (store.experiments.length >= MAX_QUANTUM_EVENTS) {
    throw new Error('MAX_QUANTUM_EVENTS');
  }

  if (!QUANTUM_TRUTH_STATES.includes(input.truthState)) {
    const denied: QuantumExperiment = {
      id: id('ekq'),
      experimentId: input.experimentId.trim(),
      truthState: 'THEORETICAL',
      method: input.method,
      status: 'denied',
      state: 'DENIED',
      reason: 'QUANTUM_TRUTH_STATE_REQUIRED',
      physicalQpuClaimed: false,
      at: new Date().toISOString(),
    };
    store.experiments.push(denied);
    await save(input.root, store);
    return denied;
  }

  if (
    input.claimPhysicalQpu &&
    input.truthState !== 'PHYSICAL_QPU_VERIFIED'
  ) {
    const denied: QuantumExperiment = {
      id: id('ekq'),
      experimentId: input.experimentId.trim(),
      truthState: input.truthState,
      method: input.method,
      status: 'denied',
      state: 'DENIED',
      reason: ASUS_NEQ_PHYSICAL_QPU,
      physicalQpuClaimed: false,
      at: new Date().toISOString(),
    };
    store.experiments.push(denied);
    await save(input.root, store);
    return denied;
  }

  const rec: QuantumExperiment = {
    id: id('ekq'),
    experimentId: input.experimentId.trim(),
    truthState: input.truthState,
    method: input.method,
    status: 'ok',
    state: input.truthState,
    reason: 'QUANTUM_EXPERIMENT_LABELED',
    physicalQpuClaimed: false,
    at: new Date().toISOString(),
  };
  store.experiments.push(rec);
  await save(input.root, store);
  return rec;
}

export async function compareQuantumBenchmarks(input: {
  experimentId: string;
  methodsCompared?: string[];
  quantumBeatsClassicalBaselines: boolean;
  reproducible: boolean;
  claimAdvantage: boolean;
  root: string;
  actor: EkActor;
}): Promise<QuantumBenchmark> {
  void input.actor;
  const store = await load(input.root);
  const methods = input.methodsCompared ?? [...QUANTUM_METHOD_LADDER];
  const allowAdvantage =
    input.claimAdvantage &&
    input.quantumBeatsClassicalBaselines &&
    input.reproducible;

  const rec: QuantumBenchmark = {
    id: id('ekqb'),
    experimentId: input.experimentId.trim(),
    methodsCompared: methods,
    metrics: QUANTUM_BENCHMARK_METRICS,
    quantumBeatsClassicalBaselines: input.quantumBeatsClassicalBaselines,
    reproducible: input.reproducible,
    advantageClaimed: allowAdvantage,
    status: allowAdvantage || !input.claimAdvantage ? 'ok' : 'denied',
    state: allowAdvantage
      ? 'BOUNDED'
      : input.claimAdvantage
        ? 'DENIED'
        : 'LABELED_SIMULATION',
    reason: allowAdvantage
      ? 'QUANTUM_ADVANTAGE_BOUNDED_WITH_BASELINES'
      : input.claimAdvantage
        ? QUANTUM_ADVANTAGE_DENIED
        : 'QUANTUM_BENCHMARK_COMPARE_RECORDED',
    at: new Date().toISOString(),
  };
  store.benchmarks.push(rec);
  await save(input.root, store);
  return rec;
}

export async function denyQuantumAdvantageWithoutBaselines(input: {
  claimAdvantage: boolean;
  beatsClassicalBaselines: boolean;
  reproducible: boolean;
  root: string;
  actor: EkActor;
}): Promise<QuantumAdvantageProbe> {
  void input.actor;
  const store = await load(input.root);
  const ok =
    input.claimAdvantage &&
    input.beatsClassicalBaselines &&
    input.reproducible;
  const probe: QuantumAdvantageProbe = {
    id: id('ekqa'),
    claimAdvantage: input.claimAdvantage,
    beatsClassicalBaselines: input.beatsClassicalBaselines,
    reproducible: input.reproducible,
    status: ok ? 'ok' : 'denied',
    state: ok ? 'BOUNDED' : 'DENIED',
    reason: ok
      ? 'QUANTUM_ADVANTAGE_BOUNDED_WITH_BASELINES'
      : QUANTUM_ADVANTAGE_DENIED,
    at: new Date().toISOString(),
  };
  store.advantages.push(probe);
  await save(input.root, store);
  return probe;
}

export async function probeAsusPhysicalQpuClaim(input: {
  claimConnectedQpu: boolean;
  physicalQpuVerified: boolean;
  root: string;
  actor: EkActor;
}): Promise<{
  id: string;
  status: 'denied' | 'ok';
  state: EkEvidenceState;
  reason: string;
  physicalQpuClaimed: false;
  at: string;
}> {
  void input.actor;
  void input.root;
  if (input.claimConnectedQpu && !input.physicalQpuVerified) {
    return {
      id: id('ekasusq'),
      status: 'denied',
      state: 'DENIED',
      reason: ASUS_NEQ_PHYSICAL_QPU,
      physicalQpuClaimed: false,
      at: new Date().toISOString(),
    };
  }
  return {
    id: id('ekasusq'),
    status: 'ok',
    state: input.physicalQpuVerified ? 'PHYSICAL_QPU_VERIFIED' : 'SIMULATED',
    reason: input.physicalQpuVerified
      ? 'PHYSICAL_QPU_VERIFIED'
      : 'ASUS_QUANTUM_DEV_WORKSTATION_SIM_ONLY',
    physicalQpuClaimed: false,
    at: new Date().toISOString(),
  };
}
