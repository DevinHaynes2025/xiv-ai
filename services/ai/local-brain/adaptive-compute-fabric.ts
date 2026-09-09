/**
 * 62L-CW Adaptive Compute Fabric —
 * Place workloads on verified CPU/GPU/NPU/quantum targets only.
 * Unconfigured/unverified → UNAVAILABLE.
 * Quantum requires classical baseline; sealed never silent cloud compute route.
 */

import { readJsonFile, writeJsonFileAtomic, xivLocalPath } from './durable-json';
import {
  CW_LOCKS,
  HONESTY_BANNER,
  MAX_COMPUTE_TARGETS,
  QUANTUM_WITHOUT_BASELINE_REJECTED,
  SEALED_SILENT_CLOUD_COMPUTE_DENIED,
  UNVERIFIED_ACCELERATOR_UNAVAILABLE,
  type ComputeTargetKind,
  type CwActor,
} from './autonomous-research-infrastructure-os-types';

export type AdaptiveComputeTarget = {
  id: string;
  kind: ComputeTargetKind;
  configured: boolean;
  authorized: boolean;
  verified: boolean;
  status: 'AVAILABLE' | 'UNAVAILABLE';
  reason: string;
  createdAt: string;
};

export type PlacementAttempt = {
  id: string;
  targetId: string | null;
  targetKind: ComputeTargetKind;
  classicalBaselineRef: string | null;
  contentMode: 'open' | 'sealed' | 'local_only';
  silentCloudComputeFallback: boolean;
  status: 'PLACED' | 'REJECTED' | 'UNAVAILABLE' | 'DENIED';
  reason: string;
  at: string;
};

type Store = {
  targets: AdaptiveComputeTarget[];
  attempts: PlacementAttempt[];
};

function storePath(root: string) {
  return xivLocalPath(root, 'adaptive-compute-fabric.json');
}

async function load(root: string): Promise<Store> {
  return readJsonFile<Store>(storePath(root), { targets: [], attempts: [] });
}

async function save(root: string, store: Store) {
  await writeJsonFileAtomic(storePath(root), store);
}

function id(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function adaptiveComputeFabricHonesty() {
  return {
    banner: HONESTY_BANNER,
    unverifiedAvailable: CW_LOCKS.UNVERIFIED_ACCELERATOR_AVAILABLE,
    unconfiguredAvailable: CW_LOCKS.UNCONFIGURED_TARGET_AVAILABLE,
    quantumClassicalBaselineRequired: CW_LOCKS.QUANTUM_CLASSICAL_BASELINE_REQUIRED,
    sealedSilentCloudFallback: CW_LOCKS.SEALED_SILENT_CLOUD_COMPUTE_FALLBACK,
  };
}

export async function registerAdaptiveComputeTarget(input: {
  kind: ComputeTargetKind;
  configured?: boolean;
  authorized?: boolean;
  verified?: boolean;
  root: string;
  actor: CwActor;
}): Promise<AdaptiveComputeTarget> {
  void input.actor;
  const store = await load(input.root);
  if (store.targets.length >= MAX_COMPUTE_TARGETS) {
    const blocked: AdaptiveComputeTarget = {
      id: id('act'),
      kind: input.kind,
      configured: false,
      authorized: false,
      verified: false,
      status: 'UNAVAILABLE',
      reason: 'MAX_COMPUTE_TARGETS_BOUNDED',
      createdAt: new Date().toISOString(),
    };
    return blocked;
  }
  const configured = input.configured === true;
  const authorized = input.authorized === true;
  const verified = input.verified === true;
  const ok = configured && authorized && verified;
  const target: AdaptiveComputeTarget = {
    id: id('act'),
    kind: input.kind,
    configured,
    authorized,
    verified,
    status: ok ? 'AVAILABLE' : 'UNAVAILABLE',
    reason: ok ? 'COMPUTE_TARGET_AVAILABLE' : UNVERIFIED_ACCELERATOR_UNAVAILABLE,
    createdAt: new Date().toISOString(),
  };
  store.targets.push(target);
  await save(input.root, store);
  return target;
}

export async function placeComputeWorkload(input: {
  targetKind: ComputeTargetKind;
  targetId?: string | null;
  classicalBaselineRef?: string | null;
  contentMode?: 'open' | 'sealed' | 'local_only';
  silentCloudComputeFallback?: boolean;
  root: string;
  actor: CwActor;
}): Promise<PlacementAttempt> {
  void input.actor;
  const store = await load(input.root);
  const now = new Date().toISOString();
  const contentMode = input.contentMode ?? 'open';
  const silent = input.silentCloudComputeFallback === true;
  const baseline = input.classicalBaselineRef?.trim() || null;

  if (contentMode === 'sealed' && silent) {
    const denied: PlacementAttempt = {
      id: id('acp'),
      targetId: input.targetId ?? null,
      targetKind: input.targetKind,
      classicalBaselineRef: baseline,
      contentMode,
      silentCloudComputeFallback: true,
      status: 'DENIED',
      reason: SEALED_SILENT_CLOUD_COMPUTE_DENIED,
      at: now,
    };
    store.attempts.push(denied);
    await save(input.root, store);
    return denied;
  }

  if (input.targetKind === 'quantum' && !baseline) {
    const rejected: PlacementAttempt = {
      id: id('acp'),
      targetId: input.targetId ?? null,
      targetKind: 'quantum',
      classicalBaselineRef: null,
      contentMode,
      silentCloudComputeFallback: silent,
      status: 'REJECTED',
      reason: QUANTUM_WITHOUT_BASELINE_REJECTED,
      at: now,
    };
    store.attempts.push(rejected);
    await save(input.root, store);
    return rejected;
  }

  let target: AdaptiveComputeTarget | undefined;
  if (input.targetId) {
    target = store.targets.find((t) => t.id === input.targetId);
  } else {
    target = store.targets.find(
      (t) =>
        t.kind === input.targetKind &&
        t.configured &&
        t.authorized &&
        t.verified &&
        t.status === 'AVAILABLE',
    );
  }

  if (!target || target.status !== 'AVAILABLE' || !target.configured || !target.verified) {
    const unavailable: PlacementAttempt = {
      id: id('acp'),
      targetId: target?.id ?? input.targetId ?? null,
      targetKind: input.targetKind,
      classicalBaselineRef: baseline,
      contentMode,
      silentCloudComputeFallback: silent,
      status: 'UNAVAILABLE',
      reason: UNVERIFIED_ACCELERATOR_UNAVAILABLE,
      at: now,
    };
    store.attempts.push(unavailable);
    await save(input.root, store);
    return unavailable;
  }

  const placed: PlacementAttempt = {
    id: id('acp'),
    targetId: target.id,
    targetKind: target.kind,
    classicalBaselineRef: baseline,
    contentMode,
    silentCloudComputeFallback: false,
    status: 'PLACED',
    reason: 'WORKLOAD_PLACED_ON_VERIFIED_TARGET',
    at: now,
  };
  store.attempts.push(placed);
  await save(input.root, store);
  return placed;
}
