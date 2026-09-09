/**
 * 62L-DM Heterogeneous Compute Fabric — CPU/GPU/NPU verified-only placement.
 */

import { readJsonFile, writeJsonFileAtomic, xivLocalPath } from './durable-json';
import {
  DM_LOCKS,
  HONESTY_BANNER,
  MAX_COMPUTE_PLACEMENTS,
  UNVERIFIED_COMPUTE_PLACEMENT_DENIED,
  type ComputeKind,
  type DmActor,
} from './global-neural-transit-civilization-atlas-types';

export type HeterogeneousComputeFabricDm = {
  id: string;
  orgId: string;
  tenantId: string;
  universeId: string;
  verifiedOnly: true;
  createdAt: string;
};

export type ComputePlacement = {
  id: string;
  fabricId: string;
  kind: ComputeKind;
  verified: boolean;
  status: 'PLACED' | 'DENIED' | 'RESEARCH_LABEL_ONLY';
  reason: string;
  createdAt: string;
};

type Store = { fabrics: HeterogeneousComputeFabricDm[]; placements: ComputePlacement[] };

function storePath(root: string) {
  return xivLocalPath(root, 'heterogeneous-compute-fabric-dm.json');
}

async function load(root: string): Promise<Store> {
  return readJsonFile<Store>(storePath(root), { fabrics: [], placements: [] });
}

async function save(root: string, store: Store) {
  await writeJsonFileAtomic(storePath(root), store);
}

function id(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function heterogeneousComputeFabricDmHonesty() {
  return {
    banner: HONESTY_BANNER,
    cpuGpuNpuVerifiedOnly: DM_LOCKS.CPU_GPU_NPU_VERIFIED_ONLY,
    unverifiedComputePlacement: DM_LOCKS.UNVERIFIED_COMPUTE_PLACEMENT,
    quantumHonestyBounded: true,
  };
}

export async function bootstrapHeterogeneousComputeFabricDm(input: {
  orgId: string;
  tenantId: string;
  universeId: string;
  root: string;
  actor: DmActor;
}): Promise<HeterogeneousComputeFabricDm> {
  void input.actor;
  const store = await load(input.root);
  const existing = store.fabrics.find(
    (f) => f.orgId === input.orgId && f.tenantId === input.tenantId && f.universeId === input.universeId,
  );
  if (existing) return existing;
  const fabric: HeterogeneousComputeFabricDm = {
    id: id('dmcomp'),
    orgId: input.orgId,
    tenantId: input.tenantId,
    universeId: input.universeId,
    verifiedOnly: true,
    createdAt: new Date().toISOString(),
  };
  store.fabrics.push(fabric);
  await save(input.root, store);
  return fabric;
}

export async function placeHeterogeneousCompute(input: {
  fabricId: string;
  kind: ComputeKind;
  verified: boolean;
  root: string;
  actor: DmActor;
}): Promise<{ accepted: boolean; reason: string; placement?: ComputePlacement; at: string }> {
  void input.actor;
  const store = await load(input.root);
  const now = new Date().toISOString();
  const fabric = store.fabrics.find((f) => f.id === input.fabricId);
  if (!fabric) return { accepted: false, reason: 'FABRIC_NOT_FOUND', at: now };
  if (store.placements.length >= MAX_COMPUTE_PLACEMENTS) {
    return { accepted: false, reason: 'MAX_COMPUTE_PLACEMENTS_REACHED', at: now };
  }

  if (input.kind === 'quantum_honesty') {
    const placement: ComputePlacement = {
      id: id('dmplace'),
      fabricId: input.fabricId,
      kind: input.kind,
      verified: false,
      status: 'RESEARCH_LABEL_ONLY',
      reason: 'QUANTUM_HONESTY_RESEARCH_LABEL_ONLY_NOT_PRODUCTION_COMPUTE',
      createdAt: now,
    };
    store.placements.push(placement);
    await save(input.root, store);
    return { accepted: false, reason: placement.reason, placement, at: now };
  }

  if (input.verified !== true) {
    const placement: ComputePlacement = {
      id: id('dmplace'),
      fabricId: input.fabricId,
      kind: input.kind,
      verified: false,
      status: 'DENIED',
      reason: UNVERIFIED_COMPUTE_PLACEMENT_DENIED,
      createdAt: now,
    };
    store.placements.push(placement);
    await save(input.root, store);
    return { accepted: false, reason: UNVERIFIED_COMPUTE_PLACEMENT_DENIED, placement, at: now };
  }

  const placement: ComputePlacement = {
    id: id('dmplace'),
    fabricId: input.fabricId,
    kind: input.kind,
    verified: true,
    status: 'PLACED',
    reason: `VERIFIED_${input.kind.toUpperCase()}_PLACEMENT`,
    createdAt: now,
  };
  store.placements.push(placement);
  await save(input.root, store);
  return { accepted: true, reason: placement.reason, placement, at: now };
}
