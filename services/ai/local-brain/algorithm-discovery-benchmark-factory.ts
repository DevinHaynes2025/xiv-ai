/**
 * 62L-DZ Module C — Algorithm Discovery & Benchmark Factory.
 * Bounded discovery; reproducible benchmark gates; classical baselines;
 * discovery candidate ≠ production algorithm; no self-promotion to prod.
 */

import { readJsonFile, writeJsonFileAtomic, xivLocalPath } from './durable-json';
import {
  ALGORITHM_SELF_PROMOTION_DENIED,
  BENCHMARK_GATE_REQUIRED,
  DISCOVERY_NEQ_PROD,
  MAX_DISCOVERIES,
  QUANTUM_NEEDS_CLASSICAL,
  type DzActor,
} from './supply-chain-intelligence-fabric-types';

export type DiscoveryFamily = 'classical' | 'ml' | 'quantum_inspired';

export type AlgorithmDiscovery = {
  id: string;
  candidateId: string;
  family: DiscoveryFamily;
  classicalBaselinePresent: boolean;
  reproducible: boolean;
  evidenceBacked: boolean;
  productionAlgorithmAuthorized: false;
  status: 'candidate' | 'benchmark_pass' | 'rejected' | 'denied';
  reason: string;
  createdAt: string;
};

export type SelfPromotionAttempt = {
  id: string;
  discoveryId: string;
  status: 'denied';
  reason: string;
  at: string;
};

type Store = {
  discoveries: AlgorithmDiscovery[];
  promotions: SelfPromotionAttempt[];
};

function storePath(root: string) {
  return xivLocalPath(root, 'algorithm-discovery-benchmark-factory.json');
}

async function load(root: string): Promise<Store> {
  return readJsonFile<Store>(storePath(root), {
    discoveries: [],
    promotions: [],
  });
}

async function save(root: string, store: Store) {
  await writeJsonFileAtomic(storePath(root), store);
}

function id(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function algorithmDiscoveryBenchmarkFactoryHonesty() {
  return {
    discoveryCandidateNeqProductionAlgorithm: true,
    classicalBaselineRequiredForQuantumInspired: true,
    benchmarkGateRequiresReproducibleEvidence: true,
    algorithmSelfPromotionForbidden: true,
    quantumInspiredEqPhysicalQuantum: false,
    simForecastNeqVerifiedFact: true,
  };
}

export async function discoverAlgorithmCandidate(input: {
  candidateId: string;
  family: DiscoveryFamily;
  classicalBaselinePresent: boolean;
  attemptProductionPromote?: boolean;
  root: string;
  actor: DzActor;
}): Promise<AlgorithmDiscovery> {
  const store = await load(input.root);
  void input.actor;
  if (store.discoveries.length >= MAX_DISCOVERIES) {
    throw new Error('MAX_DISCOVERIES_REACHED');
  }
  if (
    input.family === 'quantum_inspired' &&
    !input.classicalBaselinePresent
  ) {
    const denied: AlgorithmDiscovery = {
      id: id('dzalg'),
      candidateId: input.candidateId.trim(),
      family: input.family,
      classicalBaselinePresent: false,
      reproducible: false,
      evidenceBacked: false,
      productionAlgorithmAuthorized: false,
      status: 'denied',
      reason: QUANTUM_NEEDS_CLASSICAL,
      createdAt: new Date().toISOString(),
    };
    store.discoveries.push(denied);
    await save(input.root, store);
    return denied;
  }
  const candidate: AlgorithmDiscovery = {
    id: id('dzalg'),
    candidateId: input.candidateId.trim(),
    family: input.family,
    classicalBaselinePresent: input.classicalBaselinePresent,
    reproducible: false,
    evidenceBacked: false,
    productionAlgorithmAuthorized: false,
    status: 'candidate',
    reason: DISCOVERY_NEQ_PROD,
    createdAt: new Date().toISOString(),
  };
  store.discoveries.push(candidate);
  await save(input.root, store);
  return candidate;
}

export async function evaluateBenchmarkGate(input: {
  discoveryId: string;
  reproducible: boolean;
  evidenceBacked: boolean;
  root: string;
  actor: DzActor;
}): Promise<AlgorithmDiscovery> {
  const store = await load(input.root);
  void input.actor;
  const disc = store.discoveries.find((d) => d.id === input.discoveryId);
  if (!disc) throw new Error('DISCOVERY_NOT_FOUND');
  const pass = input.reproducible && input.evidenceBacked;
  disc.reproducible = input.reproducible;
  disc.evidenceBacked = input.evidenceBacked;
  disc.productionAlgorithmAuthorized = false;
  disc.status = pass ? 'benchmark_pass' : 'rejected';
  disc.reason = BENCHMARK_GATE_REQUIRED;
  await save(input.root, store);
  return disc;
}

export async function attemptAlgorithmSelfPromotion(input: {
  discoveryId: string;
  root: string;
  actor: DzActor;
}): Promise<SelfPromotionAttempt> {
  const store = await load(input.root);
  void input.actor;
  const disc = store.discoveries.find((d) => d.id === input.discoveryId);
  if (!disc) throw new Error('DISCOVERY_NOT_FOUND');
  disc.productionAlgorithmAuthorized = false;
  disc.status = 'denied';
  disc.reason = ALGORITHM_SELF_PROMOTION_DENIED;
  const attempt: SelfPromotionAttempt = {
    id: id('dzasp'),
    discoveryId: input.discoveryId,
    status: 'denied',
    reason: ALGORITHM_SELF_PROMOTION_DENIED,
    at: new Date().toISOString(),
  };
  store.promotions.push(attempt);
  await save(input.root, store);
  return attempt;
}
