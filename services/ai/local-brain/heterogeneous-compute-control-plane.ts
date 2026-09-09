/**
 * 62L-DA Heterogeneous Compute Control Plane —
 * AMD/NVIDIA/NPU/quantum placement control plane.
 * Verified targets only; classical baseline for quantum; no spend/bill authority.
 * Unconfigured/unverified → UNAVAILABLE.
 */

import { readJsonFile, writeJsonFileAtomic, xivLocalPath } from './durable-json';
import {
  CONTROL_PLANE_SPEND_DENIED,
  DA_LOCKS,
  HONESTY_BANNER,
  MAX_COMPUTE_TARGETS,
  QUANTUM_WITHOUT_BASELINE_REJECTED,
  UNCONFIGURED_PROVIDER_UNAVAILABLE,
  type AcceleratorKind,
  type DaActor,
} from './superbrain-runtime-kernel-types';

export type ComputeTarget = {
  id: string;
  kind: AcceleratorKind;
  configured: boolean;
  authorized: boolean;
  verified: boolean;
  status: 'AVAILABLE' | 'UNAVAILABLE';
  reason: string;
  createdAt: string;
};

export type Placement = {
  id: string;
  targetId: string | null;
  targetKind: AcceleratorKind;
  classicalBaselineRef: string | null;
  status: 'PLACED' | 'REJECTED' | 'UNAVAILABLE' | 'DENIED';
  reason: string;
  at: string;
};

export type SpendAttempt = {
  id: string;
  amount: number;
  currency: string;
  status: 'DENIED';
  reason: string;
  at: string;
};

type Store = {
  targets: ComputeTarget[];
  placements: Placement[];
  spendAttempts: SpendAttempt[];
};

function storePath(root: string) {
  return xivLocalPath(root, 'heterogeneous-compute-control-plane.json');
}

async function load(root: string): Promise<Store> {
  return readJsonFile<Store>(storePath(root), {
    targets: [],
    placements: [],
    spendAttempts: [],
  });
}

async function save(root: string, store: Store) {
  await writeJsonFileAtomic(storePath(root), store);
}

function id(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function heterogeneousComputeControlPlaneHonesty() {
  return {
    banner: HONESTY_BANNER,
    unverifiedAvailable: DA_LOCKS.UNVERIFIED_ACCELERATOR_AVAILABLE,
    quantumClassicalBaselineRequired: DA_LOCKS.QUANTUM_CLASSICAL_BASELINE_REQUIRED,
    spendEnabled: DA_LOCKS.CONTROL_PLANE_SPEND_ENABLED,
    billEnabled: DA_LOCKS.CONTROL_PLANE_BILL_ENABLED,
  };
}

export async function registerComputeTarget(input: {
  kind: AcceleratorKind;
  configured?: boolean;
  authorized?: boolean;
  verified?: boolean;
  root: string;
  actor: DaActor;
}): Promise<ComputeTarget> {
  void input.actor;
  const store = await load(input.root);
  const now = new Date().toISOString();
  if (store.targets.length >= MAX_COMPUTE_TARGETS) {
    return {
      id: id('hccp'),
      kind: input.kind,
      configured: false,
      authorized: false,
      verified: false,
      status: 'UNAVAILABLE',
      reason: 'MAX_COMPUTE_TARGETS_BOUNDED',
      createdAt: now,
    };
  }
  const configured = input.configured === true;
  const authorized = input.authorized === true;
  const verified = input.verified === true;
  const ok = configured && authorized && verified;
  const target: ComputeTarget = {
    id: id('hccp'),
    kind: input.kind,
    configured,
    authorized,
    verified,
    status: ok ? 'AVAILABLE' : 'UNAVAILABLE',
    reason: ok ? 'COMPUTE_TARGET_AVAILABLE' : UNCONFIGURED_PROVIDER_UNAVAILABLE,
    createdAt: now,
  };
  store.targets.push(target);
  await save(input.root, store);
  return target;
}

export async function placeComputeWorkload(input: {
  targetKind: AcceleratorKind;
  targetId?: string | null;
  classicalBaselineRef?: string | null;
  root: string;
  actor: DaActor;
}): Promise<Placement> {
  void input.actor;
  const store = await load(input.root);
  const now = new Date().toISOString();

  if (input.targetKind === 'quantum' && !input.classicalBaselineRef) {
    const placement: Placement = {
      id: id('place'),
      targetId: input.targetId ?? null,
      targetKind: 'quantum',
      classicalBaselineRef: null,
      status: 'REJECTED',
      reason: QUANTUM_WITHOUT_BASELINE_REJECTED,
      at: now,
    };
    store.placements.push(placement);
    await save(input.root, store);
    return placement;
  }

  const target = input.targetId
    ? store.targets.find((t) => t.id === input.targetId)
    : store.targets.find((t) => t.kind === input.targetKind && t.status === 'AVAILABLE');

  if (!target || target.status === 'UNAVAILABLE' || !target.configured || !target.verified) {
    const placement: Placement = {
      id: id('place'),
      targetId: target?.id ?? input.targetId ?? null,
      targetKind: input.targetKind,
      classicalBaselineRef: input.classicalBaselineRef ?? null,
      status: 'UNAVAILABLE',
      reason: UNCONFIGURED_PROVIDER_UNAVAILABLE,
      at: now,
    };
    store.placements.push(placement);
    await save(input.root, store);
    return placement;
  }

  const placement: Placement = {
    id: id('place'),
    targetId: target.id,
    targetKind: input.targetKind,
    classicalBaselineRef: input.classicalBaselineRef ?? null,
    status: 'PLACED',
    reason: 'COMPUTE_WORKLOAD_PLACED',
    at: now,
  };
  store.placements.push(placement);
  await save(input.root, store);
  return placement;
}

export async function attemptControlPlaneSpendOrBill(input: {
  amount: number;
  currency?: string;
  mode?: 'spend' | 'bill';
  root: string;
  actor: DaActor;
}): Promise<{ accepted: false; reason: string; attempt: SpendAttempt; at: string }> {
  void input.actor;
  void input.mode;
  const store = await load(input.root);
  const now = new Date().toISOString();
  const attempt: SpendAttempt = {
    id: id('spend'),
    amount: input.amount,
    currency: input.currency ?? 'USD',
    status: 'DENIED',
    reason: CONTROL_PLANE_SPEND_DENIED,
    at: now,
  };
  store.spendAttempts.push(attempt);
  await save(input.root, store);
  return {
    accepted: false,
    reason: CONTROL_PLANE_SPEND_DENIED,
    attempt,
    at: now,
  };
}
