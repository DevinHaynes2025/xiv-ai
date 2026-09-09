/**
 * 62L-DN Heterogeneous Compute Optimization Brain —
 * CPU/GPU/NPU optimization on verified targets only.
 * Unconfigured accelerator → UNAVAILABLE.
 * Optimizer cannot spend or bill.
 */

import { readJsonFile, writeJsonFileAtomic, xivLocalPath } from './durable-json';
import {
  DN_LOCKS,
  HONESTY_BANNER,
  MAX_COMPUTE_PLANS,
  OPTIMIZER_SPEND_BILL_DENIED,
  UNCONFIGURED_ACCELERATOR_UNAVAILABLE,
  type ComputeAcceleratorKind,
  type DnActor,
} from './universal-agent-runtime-os-types';

export type ComputeOptimizationBrain = {
  id: string;
  orgId: string;
  tenantId: string;
  universeId: string;
  spendAuthority: false;
  billingAuthority: false;
  verifiedTargetsOnly: true;
  createdAt: string;
};

export type AcceleratorTarget = {
  id: string;
  brainId: string;
  kind: ComputeAcceleratorKind;
  configured: boolean;
  verified: boolean;
  status: 'AVAILABLE' | 'UNAVAILABLE';
  reason: string;
  createdAt: string;
};

export type OptimizationPlan = {
  id: string;
  brainId: string;
  targetId: string | null;
  kind: ComputeAcceleratorKind;
  status: 'PLANNED' | 'UNAVAILABLE' | 'DENIED';
  reason: string;
  spendAttempted: boolean;
  billAttempted: boolean;
  createdAt: string;
};

export type SpendBillAttempt = {
  id: string;
  brainId: string;
  kind: 'spend' | 'bill';
  status: 'DENIED';
  reason: string;
  at: string;
};

type Store = {
  brains: ComputeOptimizationBrain[];
  targets: AcceleratorTarget[];
  plans: OptimizationPlan[];
  spendBills: SpendBillAttempt[];
};

function storePath(root: string) {
  return xivLocalPath(root, 'heterogeneous-compute-optimization-brain.json');
}

async function load(root: string): Promise<Store> {
  return readJsonFile<Store>(storePath(root), {
    brains: [],
    targets: [],
    plans: [],
    spendBills: [],
  });
}

async function save(root: string, store: Store) {
  await writeJsonFileAtomic(storePath(root), store);
}

function id(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function heterogeneousComputeOptimizationHonesty() {
  return {
    banner: HONESTY_BANNER,
    unconfiguredAcceleratorAvailable: DN_LOCKS.UNCONFIGURED_ACCELERATOR_AVAILABLE,
    unverifiedAcceleratorAvailable: DN_LOCKS.UNVERIFIED_ACCELERATOR_AVAILABLE,
    cpuGpuNpuVerifiedOnly: DN_LOCKS.CPU_GPU_NPU_VERIFIED_ONLY,
    optimizerSpendAuthority: DN_LOCKS.OPTIMIZER_SPEND_AUTHORITY,
    optimizerBillingAuthority: DN_LOCKS.OPTIMIZER_BILLING_AUTHORITY,
  };
}

export async function bootstrapHeterogeneousComputeOptimizationBrain(input: {
  orgId: string;
  tenantId: string;
  universeId: string;
  root: string;
  actor: DnActor;
}): Promise<ComputeOptimizationBrain> {
  void input.actor;
  const store = await load(input.root);
  const existing = store.brains.find(
    (b) =>
      b.orgId === input.orgId &&
      b.tenantId === input.tenantId &&
      b.universeId === input.universeId,
  );
  if (existing) return existing;
  const brain: ComputeOptimizationBrain = {
    id: id('dncomp'),
    orgId: input.orgId,
    tenantId: input.tenantId,
    universeId: input.universeId,
    spendAuthority: false,
    billingAuthority: false,
    verifiedTargetsOnly: true,
    createdAt: new Date().toISOString(),
  };
  store.brains.push(brain);
  await save(input.root, store);
  return brain;
}

export async function registerAcceleratorTarget(input: {
  brainId: string;
  kind: ComputeAcceleratorKind;
  configured?: boolean;
  verified?: boolean;
  root: string;
  actor: DnActor;
}): Promise<{ accepted: boolean; reason: string; target?: AcceleratorTarget }> {
  void input.actor;
  const store = await load(input.root);
  const brain = store.brains.find((b) => b.id === input.brainId);
  if (!brain) return { accepted: false, reason: 'COMPUTE_BRAIN_NOT_FOUND' };

  const configured = input.configured === true;
  const verified = input.verified === true && configured;
  let status: AcceleratorTarget['status'];
  let reason: string;
  if (!configured) {
    status = 'UNAVAILABLE';
    reason = UNCONFIGURED_ACCELERATOR_UNAVAILABLE;
  } else if (!verified) {
    status = 'UNAVAILABLE';
    reason = 'UNVERIFIED_ACCELERATOR_UNAVAILABLE';
  } else {
    status = 'AVAILABLE';
    reason = 'ACCELERATOR_CONFIGURED_AND_VERIFIED_CONTRACT_ONLY';
  }

  const target: AcceleratorTarget = {
    id: id('dnacc'),
    brainId: input.brainId,
    kind: input.kind,
    configured,
    verified,
    status,
    reason,
    createdAt: new Date().toISOString(),
  };
  store.targets.push(target);
  await save(input.root, store);
  return { accepted: status === 'AVAILABLE', reason: target.reason, target };
}

export async function proposeOptimizationPlan(input: {
  brainId: string;
  kind: ComputeAcceleratorKind;
  targetId?: string;
  attemptSpend?: boolean;
  attemptBill?: boolean;
  root: string;
  actor: DnActor;
}): Promise<{ accepted: boolean; reason: string; plan?: OptimizationPlan }> {
  void input.actor;
  const store = await load(input.root);
  const brain = store.brains.find((b) => b.id === input.brainId);
  if (!brain) return { accepted: false, reason: 'COMPUTE_BRAIN_NOT_FOUND' };
  if (store.plans.length >= MAX_COMPUTE_PLANS) {
    return { accepted: false, reason: 'MAX_COMPUTE_PLANS_REACHED' };
  }

  if (input.attemptSpend === true || input.attemptBill === true) {
    const plan: OptimizationPlan = {
      id: id('dnplan'),
      brainId: input.brainId,
      targetId: input.targetId ?? null,
      kind: input.kind,
      status: 'DENIED',
      reason: OPTIMIZER_SPEND_BILL_DENIED,
      spendAttempted: input.attemptSpend === true,
      billAttempted: input.attemptBill === true,
      createdAt: new Date().toISOString(),
    };
    store.plans.push(plan);
    await save(input.root, store);
    return { accepted: false, reason: plan.reason, plan };
  }

  let target: AcceleratorTarget | undefined;
  if (input.targetId) {
    target = store.targets.find((t) => t.id === input.targetId);
  } else {
    target = store.targets.find(
      (t) => t.brainId === input.brainId && t.kind === input.kind && t.status === 'AVAILABLE',
    );
  }

  if (!target || target.status !== 'AVAILABLE') {
    const plan: OptimizationPlan = {
      id: id('dnplan'),
      brainId: input.brainId,
      targetId: target?.id ?? null,
      kind: input.kind,
      status: 'UNAVAILABLE',
      reason: target?.reason ?? UNCONFIGURED_ACCELERATOR_UNAVAILABLE,
      spendAttempted: false,
      billAttempted: false,
      createdAt: new Date().toISOString(),
    };
    store.plans.push(plan);
    await save(input.root, store);
    return { accepted: false, reason: plan.reason, plan };
  }

  const plan: OptimizationPlan = {
    id: id('dnplan'),
    brainId: input.brainId,
    targetId: target.id,
    kind: input.kind,
    status: 'PLANNED',
    reason: 'OPTIMIZATION_PLAN_BOUNDED_NO_SPEND_AUTHORITY',
    spendAttempted: false,
    billAttempted: false,
    createdAt: new Date().toISOString(),
  };
  store.plans.push(plan);
  await save(input.root, store);
  return { accepted: true, reason: plan.reason, plan };
}

export async function attemptOptimizerSpendOrBill(input: {
  brainId: string;
  kind: 'spend' | 'bill';
  root: string;
  actor: DnActor;
}): Promise<{ accepted: false; reason: string; attempt: SpendBillAttempt }> {
  void input.actor;
  const store = await load(input.root);
  const attempt: SpendBillAttempt = {
    id: id('dnspend'),
    brainId: input.brainId,
    kind: input.kind,
    status: 'DENIED',
    reason: OPTIMIZER_SPEND_BILL_DENIED,
    at: new Date().toISOString(),
  };
  store.spendBills.push(attempt);
  await save(input.root, store);
  return { accepted: false, reason: attempt.reason, attempt };
}
