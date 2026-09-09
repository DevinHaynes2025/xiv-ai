/**
 * 62L-CR B — GPU/Quantum Workload Civilization
 * Verified AMD/NVIDIA acceleration + classical/quantum research routing.
 * Unverified hardware → UNAVAILABLE (not live). Classical baseline required.
 */

import { readJsonFile, writeJsonFileAtomic, xivLocalPath } from './durable-json';
import {
  CR_LOCKS,
  HONESTY_BANNER,
  MAX_ACTIVE_GPU_WORKLOADS,
  MAX_ACTIVE_QUANTUM_RESEARCH_JOBS,
  QUANTUM_WITHOUT_BASELINE_REJECTED,
  UNVERIFIED_ACCELERATOR_UNAVAILABLE,
  type CrActor,
} from './hybrid-supercompute-universe-os-types';

export type AcceleratorVendor = 'amd' | 'nvidia' | 'generic' | 'quantum-provider';
export type AcceleratorKind = 'amd_rocm' | 'nvidia_cuda' | 'quantum_simulator' | 'quantum_qpu' | 'cpu';

export type AcceleratorRecord = {
  id: string;
  vendor: AcceleratorVendor;
  kind: AcceleratorKind;
  configured: boolean;
  authorized: boolean;
  runtimeVerified: boolean;
  label: 'UNAVAILABLE' | 'AVAILABLE' | 'VERIFIED';
  evidenceRefs: string[];
  reason: string;
};

export type WorkloadRoute = {
  id: string;
  objective: string;
  classicalBaselinePresent: boolean;
  classicalBaselineRef: string | null;
  quantumRequested: boolean;
  acceleratorId: string | null;
  status: 'PLANNED' | 'REJECTED' | 'UNAVAILABLE' | 'ROUTED_CANDIDATE';
  claimsQuantumAdvantage: false;
  productionAuthorized: false;
  reason: string;
  createdAt: string;
};

type Store = {
  accelerators: AcceleratorRecord[];
  routes: WorkloadRoute[];
};

function storePath(root: string) {
  return xivLocalPath(root, 'gpu-quantum-workload-civilization.json');
}

async function load(root: string): Promise<Store> {
  return readJsonFile<Store>(storePath(root), { accelerators: [], routes: [] });
}

async function save(root: string, store: Store) {
  await writeJsonFileAtomic(storePath(root), store);
}

function id(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function gpuQuantumHonesty() {
  return {
    banner: HONESTY_BANNER,
    gpuRequiresVerification: CR_LOCKS.GPU_REQUIRES_RUNTIME_VERIFICATION,
    qpuRequiresVerification: CR_LOCKS.QPU_REQUIRES_RUNTIME_VERIFICATION,
    unverifiedLive: CR_LOCKS.UNVERIFIED_ACCELERATOR_LIVE,
    classicalBaselineRequired: CR_LOCKS.QUANTUM_CLASSICAL_BASELINE_REQUIRED,
    advantageWithoutEvidence: CR_LOCKS.QUANTUM_ADVANTAGE_WITHOUT_EVIDENCE,
  };
}

export async function registerAccelerator(input: {
  vendor: AcceleratorVendor;
  kind: AcceleratorKind;
  configured?: boolean;
  authorized?: boolean;
  runtimeVerified?: boolean;
  evidenceRefs?: string[];
  root: string;
  actor: CrActor;
}): Promise<AcceleratorRecord> {
  const store = await load(input.root);
  const configured = input.configured === true;
  const authorized = input.authorized === true;
  const runtimeVerified = input.runtimeVerified === true;
  const evidenceRefs = input.evidenceRefs ?? [];
  const verified =
    configured && authorized && runtimeVerified && evidenceRefs.length > 0;
  const record: AcceleratorRecord = {
    id: id('accel'),
    vendor: input.vendor,
    kind: input.kind,
    configured,
    authorized,
    runtimeVerified,
    label: verified ? 'VERIFIED' : 'UNAVAILABLE',
    evidenceRefs,
    reason: verified
      ? 'ACCELERATOR_RUNTIME_VERIFIED'
      : UNVERIFIED_ACCELERATOR_UNAVAILABLE,
  };
  void input.actor;
  store.accelerators.push(record);
  await save(input.root, store);
  return record;
}

export async function routeWorkload(input: {
  objective: string;
  classicalBaselinePresent: boolean;
  classicalBaselineRef?: string | null;
  quantumRequested?: boolean;
  acceleratorId?: string | null;
  root: string;
  actor: CrActor;
}): Promise<WorkloadRoute> {
  const store = await load(input.root);
  const quantumRequested = input.quantumRequested === true;

  if (quantumRequested && !input.classicalBaselinePresent) {
    const rejected: WorkloadRoute = {
      id: id('wroute'),
      objective: input.objective,
      classicalBaselinePresent: false,
      classicalBaselineRef: null,
      quantumRequested: true,
      acceleratorId: null,
      status: 'REJECTED',
      claimsQuantumAdvantage: false,
      productionAuthorized: false,
      reason: QUANTUM_WITHOUT_BASELINE_REJECTED,
      createdAt: new Date().toISOString(),
    };
    void input.actor;
    store.routes.push(rejected);
    await save(input.root, store);
    return rejected;
  }

  let status: WorkloadRoute['status'] = 'PLANNED';
  let reason = 'WORKLOAD_ROUTE_PLANNED_CLASSICAL';
  let acceleratorId = input.acceleratorId ?? null;

  if (acceleratorId) {
    const accel = store.accelerators.find((a) => a.id === acceleratorId);
    if (!accel || accel.label !== 'VERIFIED') {
      status = 'UNAVAILABLE';
      reason = UNVERIFIED_ACCELERATOR_UNAVAILABLE;
      acceleratorId = accel?.id ?? acceleratorId;
    } else if (quantumRequested) {
      const activeQ = store.routes.filter(
        (r) => r.quantumRequested && r.status === 'ROUTED_CANDIDATE',
      ).length;
      if (activeQ >= MAX_ACTIVE_QUANTUM_RESEARCH_JOBS) {
        status = 'REJECTED';
        reason = `QUANTUM_JOB_BOUNDED_MAX_${MAX_ACTIVE_QUANTUM_RESEARCH_JOBS}`;
      } else {
        status = 'ROUTED_CANDIDATE';
        reason = 'QUANTUM_ROUTED_WITH_CLASSICAL_BASELINE_CANDIDATE';
      }
    } else {
      const activeG = store.routes.filter(
        (r) => !r.quantumRequested && r.status === 'ROUTED_CANDIDATE',
      ).length;
      if (activeG >= MAX_ACTIVE_GPU_WORKLOADS) {
        status = 'REJECTED';
        reason = `GPU_WORKLOAD_BOUNDED_MAX_${MAX_ACTIVE_GPU_WORKLOADS}`;
      } else {
        status = 'ROUTED_CANDIDATE';
        reason = 'GPU_ROUTED_VERIFIED_CANDIDATE';
      }
    }
  } else if (quantumRequested) {
    status = 'UNAVAILABLE';
    reason = UNVERIFIED_ACCELERATOR_UNAVAILABLE;
  }

  const route: WorkloadRoute = {
    id: id('wroute'),
    objective: input.objective,
    classicalBaselinePresent: input.classicalBaselinePresent,
    classicalBaselineRef: input.classicalBaselineRef ?? null,
    quantumRequested,
    acceleratorId,
    status,
    claimsQuantumAdvantage: false,
    productionAuthorized: false,
    reason,
    createdAt: new Date().toISOString(),
  };
  void input.actor;
  store.routes.push(route);
  await save(input.root, store);
  return route;
}
