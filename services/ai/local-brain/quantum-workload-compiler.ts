/**
 * 62L-BX Classical/Quantum Workload Planner + Quantum Workload Compiler.
 * Classical baseline required; QPU/simulator separate; no advantage claim without evidence.
 * Unconfigured QPU → UNAVAILABLE.
 */

import { readJsonFile, writeJsonFileAtomic, xivLocalPath } from './durable-json';
import {
  BX_LOCKS,
  HONESTY_BANNER,
  NO_QUANTUM_ADVANTAGE_WITHOUT_EVIDENCE,
  QUANTUM_CLASSICAL_BASELINE_REQUIRED,
  UNCONFIGURED_QPU_UNAVAILABLE,
  type BxActor,
} from './neural-chip-os-semiconductor-twin-types';

export type QuantumBackendKind = 'classical_baseline' | 'quantum_simulator' | 'quantum_qpu';

export type QuantumBackendRecord = {
  backendKey: string;
  kind: QuantumBackendKind;
  configured: boolean;
  authorized: boolean;
  verified: boolean;
  label: 'UNAVAILABLE' | 'AVAILABLE' | 'VERIFIED';
};

export type WorkloadPlan = {
  id: string;
  objective: string;
  classicalBaselinePresent: boolean;
  classicalBaselineRef: string | null;
  quantumRequested: boolean;
  backendKey: string | null;
  status: 'PLANNED' | 'REJECTED' | 'UNAVAILABLE' | 'COMPILED_CANDIDATE';
  claimsQuantumAdvantage: false;
  productionAuthorized: false;
  reason: string | null;
  createdAt: string;
  actorId: string;
};

type Store = {
  backends: QuantumBackendRecord[];
  plans: WorkloadPlan[];
};

function storePath(root: string) {
  return xivLocalPath(root, 'quantum-workload-compiler.json');
}

async function load(root: string): Promise<Store> {
  return readJsonFile<Store>(storePath(root), { backends: [], plans: [] });
}

async function save(root: string, store: Store) {
  await writeJsonFileAtomic(storePath(root), store);
}

function id(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

function normalizeKey(key: string) {
  return key.trim().toLowerCase().replace(/[\s-]+/g, '_');
}

export async function registerQuantumBackend(input: {
  backendKey: string;
  kind: QuantumBackendKind;
  configured: boolean;
  authorized: boolean;
  verified: boolean;
  root?: string;
}) {
  const root = input.root ?? process.cwd();
  const store = await load(root);
  const key = normalizeKey(input.backendKey);

  let label: QuantumBackendRecord['label'] = 'UNAVAILABLE';
  if (input.kind === 'classical_baseline') {
    label = input.configured ? (input.verified ? 'VERIFIED' : 'AVAILABLE') : 'UNAVAILABLE';
  } else if (input.configured && input.authorized && input.verified) {
    label = 'VERIFIED';
  } else if (input.configured && input.authorized) {
    label = 'AVAILABLE';
  } else {
    label = 'UNAVAILABLE';
  }

  const record: QuantumBackendRecord = {
    backendKey: key,
    kind: input.kind,
    configured: input.configured,
    authorized: input.authorized,
    verified: input.verified,
    label,
  };
  const idx = store.backends.findIndex((b) => b.backendKey === key);
  if (idx >= 0) store.backends[idx] = record;
  else store.backends.push(record);
  await save(root, store);
  return { accepted: true as const, backend: record };
}

export async function getQuantumBackend(backendKey: string, root = process.cwd()) {
  const store = await load(root);
  return store.backends.find((b) => b.backendKey === normalizeKey(backendKey)) ?? null;
}

/** Plan/compile a workload. Quantum without classical baseline → REJECTED. */
export async function planQuantumWorkload(input: {
  objective: string;
  classicalBaselineRef?: string | null;
  quantumRequested?: boolean;
  backendKey?: string | null;
  claimQuantumAdvantage?: boolean;
  actor: BxActor;
  root?: string;
}) {
  const root = input.root ?? process.cwd();
  const store = await load(root);
  const classicalPresent = Boolean(input.classicalBaselineRef?.trim());
  const quantumRequested = Boolean(input.quantumRequested);

  if (input.claimQuantumAdvantage) {
    const plan: WorkloadPlan = {
      id: id('qplan'),
      objective: input.objective.trim(),
      classicalBaselinePresent: classicalPresent,
      classicalBaselineRef: input.classicalBaselineRef?.trim() || null,
      quantumRequested,
      backendKey: input.backendKey ? normalizeKey(input.backendKey) : null,
      status: 'REJECTED',
      claimsQuantumAdvantage: false,
      productionAuthorized: false,
      reason: NO_QUANTUM_ADVANTAGE_WITHOUT_EVIDENCE,
      createdAt: new Date().toISOString(),
      actorId: input.actor.id,
    };
    store.plans.push(plan);
    await save(root, store);
    return { accepted: false as const, plan, reason: plan.reason };
  }

  if (quantumRequested && !classicalPresent) {
    const plan: WorkloadPlan = {
      id: id('qplan'),
      objective: input.objective.trim(),
      classicalBaselinePresent: false,
      classicalBaselineRef: null,
      quantumRequested: true,
      backendKey: input.backendKey ? normalizeKey(input.backendKey) : null,
      status: 'REJECTED',
      claimsQuantumAdvantage: false,
      productionAuthorized: false,
      reason: QUANTUM_CLASSICAL_BASELINE_REQUIRED,
      createdAt: new Date().toISOString(),
      actorId: input.actor.id,
    };
    store.plans.push(plan);
    await save(root, store);
    return { accepted: false as const, plan, reason: plan.reason };
  }

  if (quantumRequested && input.backendKey) {
    const backend = await getQuantumBackend(input.backendKey, root);
    if (!backend || backend.label === 'UNAVAILABLE' || !backend.configured) {
      const plan: WorkloadPlan = {
        id: id('qplan'),
        objective: input.objective.trim(),
        classicalBaselinePresent: classicalPresent,
        classicalBaselineRef: input.classicalBaselineRef?.trim() || null,
        quantumRequested: true,
        backendKey: normalizeKey(input.backendKey),
        status: 'UNAVAILABLE',
        claimsQuantumAdvantage: false,
        productionAuthorized: false,
        reason: UNCONFIGURED_QPU_UNAVAILABLE,
        createdAt: new Date().toISOString(),
        actorId: input.actor.id,
      };
      store.plans.push(plan);
      await save(root, store);
      return { accepted: false as const, plan, reason: plan.reason };
    }
  }

  const plan: WorkloadPlan = {
    id: id('qplan'),
    objective: input.objective.trim(),
    classicalBaselinePresent: classicalPresent || !quantumRequested,
    classicalBaselineRef: input.classicalBaselineRef?.trim() || (quantumRequested ? null : 'implicit_classical_only'),
    quantumRequested,
    backendKey: input.backendKey ? normalizeKey(input.backendKey) : null,
    status: quantumRequested ? 'COMPILED_CANDIDATE' : 'PLANNED',
    claimsQuantumAdvantage: false,
    productionAuthorized: false,
    reason: null,
    createdAt: new Date().toISOString(),
    actorId: input.actor.id,
  };
  store.plans.push(plan);
  await save(root, store);
  return { accepted: true as const, plan, reason: null };
}

export function quantumWorkloadHonesty() {
  return {
    banner: HONESTY_BANNER,
    L4_AUTONOMY_ENABLED: BX_LOCKS.L4_AUTONOMY_ENABLED,
    classicalBaselineRequired: BX_LOCKS.CLASSICAL_BASELINE_REQUIRED,
    quantumWithoutBaseline: BX_LOCKS.QUANTUM_WITHOUT_CLASSICAL_BASELINE,
    advantageWithoutEvidence: BX_LOCKS.QUANTUM_ADVANTAGE_CLAIM_WITHOUT_EVIDENCE,
    unconfiguredQpuTreatedAvailable: BX_LOCKS.UNCONFIGURED_QPU_TREATED_AVAILABLE,
    productionAuthorization: BX_LOCKS.PRODUCTION_AUTHORIZATION,
  };
}
