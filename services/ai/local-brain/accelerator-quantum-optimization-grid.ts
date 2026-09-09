/**
 * 62L-CT E — Accelerator/Quantum Optimization Grid
 * CPU/GPU/NPU/quantum with verification honesty.
 * Classical baseline required; unconfigured → UNAVAILABLE; no unsupported claims.
 */

import { readJsonFile, writeJsonFileAtomic, xivLocalPath } from './durable-json';
import {
  CT_LOCKS,
  HONESTY_BANNER,
  QUANTUM_WITHOUT_BASELINE_REJECTED,
  UNCONFIGURED_ACCELERATOR_UNAVAILABLE,
  type AcceleratorKind,
  type CtActor,
} from './ai-research-civilization-os-types';

export type AcceleratorNode = {
  id: string;
  kind: AcceleratorKind;
  configured: boolean;
  verified: boolean;
  status: 'available' | 'unavailable';
  reason: string;
  createdAt: string;
};

export type OptimizationPlan = {
  id: string;
  workload: string;
  classicalBaselinePresent: boolean;
  quantumClaimed: boolean;
  quantumEvidencePresent: boolean;
  targetKind: AcceleratorKind;
  status: 'planned_classical' | 'rejected' | 'unavailable';
  reason: string;
  createdAt: string;
};

type Store = { nodes: AcceleratorNode[]; plans: OptimizationPlan[] };

function storePath(root: string) {
  return xivLocalPath(root, 'accelerator-quantum-optimization-grid.json');
}

async function load(root: string): Promise<Store> {
  return readJsonFile<Store>(storePath(root), { nodes: [], plans: [] });
}

async function save(root: string, store: Store) {
  await writeJsonFileAtomic(storePath(root), store);
}

function id(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function acceleratorGridHonesty() {
  return {
    banner: HONESTY_BANNER,
    quantumWithoutBaseline: CT_LOCKS.QUANTUM_WITHOUT_CLASSICAL_BASELINE,
    quantumAdvantageWithoutEvidence: CT_LOCKS.QUANTUM_ADVANTAGE_WITHOUT_EVIDENCE,
    unconfiguredAcceleratorAvailable: CT_LOCKS.UNCONFIGURED_ACCELERATOR_AVAILABLE,
    unconfiguredQpuAvailable: CT_LOCKS.UNCONFIGURED_QPU_AVAILABLE,
  };
}

export async function registerAcceleratorNode(input: {
  kind: AcceleratorKind;
  configured?: boolean;
  verified?: boolean;
  root: string;
  actor: CtActor;
}): Promise<AcceleratorNode> {
  const store = await load(input.root);
  const configured = Boolean(input.configured);
  const verified = Boolean(input.verified);
  const available = configured && (input.kind === 'cpu' || input.kind === 'gpu' || input.kind === 'npu' || verified);
  const node: AcceleratorNode = {
    id: id('accel'),
    kind: input.kind,
    configured,
    verified,
    status: available ? 'available' : 'unavailable',
    reason: available
      ? 'ACCELERATOR_CONFIGURED'
      : UNCONFIGURED_ACCELERATOR_UNAVAILABLE,
    createdAt: new Date().toISOString(),
  };
  store.nodes.push(node);
  await save(input.root, store);
  void input.actor;
  return node;
}

export async function planOptimization(input: {
  workload: string;
  classicalBaselinePresent: boolean;
  quantumClaimed?: boolean;
  quantumEvidencePresent?: boolean;
  targetKind: AcceleratorKind;
  acceleratorId?: string;
  root: string;
  actor: CtActor;
}): Promise<OptimizationPlan> {
  const store = await load(input.root);
  const node = input.acceleratorId
    ? store.nodes.find((n) => n.id === input.acceleratorId)
    : store.nodes.find((n) => n.kind === input.targetKind);

  if (!node || node.status === 'unavailable' || !node.configured) {
    const plan: OptimizationPlan = {
      id: id('opt'),
      workload: input.workload,
      classicalBaselinePresent: input.classicalBaselinePresent,
      quantumClaimed: Boolean(input.quantumClaimed),
      quantumEvidencePresent: Boolean(input.quantumEvidencePresent),
      targetKind: input.targetKind,
      status: 'unavailable',
      reason: UNCONFIGURED_ACCELERATOR_UNAVAILABLE,
      createdAt: new Date().toISOString(),
    };
    store.plans.push(plan);
    await save(input.root, store);
    return plan;
  }

  if (
    (input.targetKind === 'qpu' || input.targetKind === 'simulator' || input.quantumClaimed) &&
    (!input.classicalBaselinePresent || !input.quantumEvidencePresent)
  ) {
    const plan: OptimizationPlan = {
      id: id('opt'),
      workload: input.workload,
      classicalBaselinePresent: input.classicalBaselinePresent,
      quantumClaimed: Boolean(input.quantumClaimed),
      quantumEvidencePresent: Boolean(input.quantumEvidencePresent),
      targetKind: input.targetKind,
      status: 'rejected',
      reason: QUANTUM_WITHOUT_BASELINE_REJECTED,
      createdAt: new Date().toISOString(),
    };
    store.plans.push(plan);
    await save(input.root, store);
    return plan;
  }

  const plan: OptimizationPlan = {
    id: id('opt'),
    workload: input.workload,
    classicalBaselinePresent: input.classicalBaselinePresent,
    quantumClaimed: Boolean(input.quantumClaimed),
    quantumEvidencePresent: Boolean(input.quantumEvidencePresent),
    targetKind: input.targetKind,
    status: 'planned_classical',
    reason: 'CLASSICAL_BASELINE_PLAN_OR_VERIFIED_TARGET',
    createdAt: new Date().toISOString(),
  };
  store.plans.push(plan);
  await save(input.root, store);
  void input.actor;
  return plan;
}
