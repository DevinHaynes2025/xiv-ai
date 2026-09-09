/**
 * 62L-EA Module D — Quantum-Inspired Compute Brain.
 * Optimization with classical baselines; honesty locks.
 * No unverified quantum supremacy; sim ≠ verified fact.
 */

import { readJsonFile, writeJsonFileAtomic, xivLocalPath } from './durable-json';
import {
  MAX_QUANTUM_EVENTS,
  QUANTUM_NEEDS_CLASSICAL,
  QUANTUM_NO_SUPREMACY,
  QUANTUM_SIM_NEQ_FACT,
  type EaActor,
} from './global-operations-intelligence-grid-types';

export type QuantumOptimization = {
  id: string;
  candidateId: string;
  classicalBaselinePresent: boolean;
  supremacyClaimed: boolean;
  claimVerifiedFact: boolean;
  productionAuthorized: false;
  status: 'candidate' | 'denied' | 'labeled_simulation';
  reason: string;
  createdAt: string;
};

type Store = {
  optimizations: QuantumOptimization[];
};

function storePath(root: string) {
  return xivLocalPath(root, 'quantum-inspired-compute-brain.json');
}

async function load(root: string): Promise<Store> {
  return readJsonFile<Store>(storePath(root), { optimizations: [] });
}

async function save(root: string, store: Store) {
  await writeJsonFileAtomic(storePath(root), store);
}

function id(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function quantumInspiredComputeBrainHonesty() {
  return {
    classicalBaselineRequired: true,
    quantumInspiredEqPhysicalQuantum: false,
    noUnverifiedSupremacy: true,
    simNeqVerifiedFact: true,
    productionAuthorized: false,
  };
}

export async function runQuantumInspiredOptimization(input: {
  candidateId: string;
  classicalBaselinePresent: boolean;
  supremacyClaimed?: boolean;
  claimVerifiedFact?: boolean;
  root: string;
  actor: EaActor;
}): Promise<QuantumOptimization> {
  const store = await load(input.root);
  void input.actor;
  if (store.optimizations.length >= MAX_QUANTUM_EVENTS) {
    throw new Error('MAX_QUANTUM_EVENTS_REACHED');
  }
  if (!input.classicalBaselinePresent) {
    const denied: QuantumOptimization = {
      id: id('eaqi'),
      candidateId: input.candidateId.trim(),
      classicalBaselinePresent: false,
      supremacyClaimed: Boolean(input.supremacyClaimed),
      claimVerifiedFact: Boolean(input.claimVerifiedFact),
      productionAuthorized: false,
      status: 'denied',
      reason: QUANTUM_NEEDS_CLASSICAL,
      createdAt: new Date().toISOString(),
    };
    store.optimizations.push(denied);
    await save(input.root, store);
    return denied;
  }
  if (input.supremacyClaimed) {
    const denied: QuantumOptimization = {
      id: id('eaqi'),
      candidateId: input.candidateId.trim(),
      classicalBaselinePresent: true,
      supremacyClaimed: true,
      claimVerifiedFact: Boolean(input.claimVerifiedFact),
      productionAuthorized: false,
      status: 'denied',
      reason: QUANTUM_NO_SUPREMACY,
      createdAt: new Date().toISOString(),
    };
    store.optimizations.push(denied);
    await save(input.root, store);
    return denied;
  }
  if (input.claimVerifiedFact) {
    const denied: QuantumOptimization = {
      id: id('eaqi'),
      candidateId: input.candidateId.trim(),
      classicalBaselinePresent: true,
      supremacyClaimed: false,
      claimVerifiedFact: true,
      productionAuthorized: false,
      status: 'denied',
      reason: QUANTUM_SIM_NEQ_FACT,
      createdAt: new Date().toISOString(),
    };
    store.optimizations.push(denied);
    await save(input.root, store);
    return denied;
  }
  const ok: QuantumOptimization = {
    id: id('eaqi'),
    candidateId: input.candidateId.trim(),
    classicalBaselinePresent: true,
    supremacyClaimed: false,
    claimVerifiedFact: false,
    productionAuthorized: false,
    status: 'labeled_simulation',
    reason: 'QUANTUM_INSPIRED_LABELED_SIMULATION_WITH_CLASSICAL_BASELINE',
    createdAt: new Date().toISOString(),
  };
  store.optimizations.push(ok);
  await save(input.root, store);
  return ok;
}
