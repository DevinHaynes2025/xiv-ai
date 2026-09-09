/**
 * 62L-CX Adaptive Accelerator Grid —
 * Verified AMD / NVIDIA / NPU / quantum workload routing only.
 * Unverified → UNAVAILABLE; quantum requires classical baseline;
 * sealed never silent cloud accelerator fallback.
 */

import { readJsonFile, writeJsonFileAtomic, xivLocalPath } from './durable-json';
import {
  CX_LOCKS,
  HONESTY_BANNER,
  MAX_ACCELERATOR_TARGETS,
  QUANTUM_WITHOUT_BASELINE_REJECTED,
  SEALED_SILENT_CLOUD_ACCELERATOR_DENIED,
  UNVERIFIED_ACCELERATOR_UNAVAILABLE,
  type AcceleratorKind,
  type CxActor,
} from './persistent-knowledge-civilization-types';

export type AcceleratorTarget = {
  id: string;
  kind: AcceleratorKind;
  configured: boolean;
  authorized: boolean;
  verified: boolean;
  status: 'AVAILABLE' | 'UNAVAILABLE';
  reason: string;
  createdAt: string;
};

export type AcceleratorRoute = {
  id: string;
  targetId: string | null;
  targetKind: AcceleratorKind;
  classicalBaselineRef: string | null;
  contentMode: 'open' | 'sealed' | 'local_only';
  silentCloudAcceleratorFallback: boolean;
  status: 'ROUTED' | 'REJECTED' | 'UNAVAILABLE' | 'DENIED';
  reason: string;
  at: string;
};

type Store = {
  targets: AcceleratorTarget[];
  routes: AcceleratorRoute[];
};

function storePath(root: string) {
  return xivLocalPath(root, 'adaptive-accelerator-grid.json');
}

async function load(root: string): Promise<Store> {
  return readJsonFile<Store>(storePath(root), { targets: [], routes: [] });
}

async function save(root: string, store: Store) {
  await writeJsonFileAtomic(storePath(root), store);
}

function id(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function adaptiveAcceleratorGridHonesty() {
  return {
    banner: HONESTY_BANNER,
    unverifiedAvailable: CX_LOCKS.UNVERIFIED_ACCELERATOR_AVAILABLE,
    unconfiguredAvailable: CX_LOCKS.UNCONFIGURED_TARGET_AVAILABLE,
    quantumClassicalBaselineRequired: CX_LOCKS.QUANTUM_CLASSICAL_BASELINE_REQUIRED,
    sealedSilentCloudFallback: CX_LOCKS.SEALED_SILENT_CLOUD_ACCELERATOR_FALLBACK,
  };
}

export async function registerAcceleratorTarget(input: {
  kind: AcceleratorKind;
  configured?: boolean;
  authorized?: boolean;
  verified?: boolean;
  root: string;
  actor: CxActor;
}): Promise<AcceleratorTarget> {
  void input.actor;
  const store = await load(input.root);
  if (store.targets.length >= MAX_ACCELERATOR_TARGETS) {
    return {
      id: id('aag'),
      kind: input.kind,
      configured: false,
      authorized: false,
      verified: false,
      status: 'UNAVAILABLE',
      reason: 'MAX_ACCELERATOR_TARGETS_BOUNDED',
      createdAt: new Date().toISOString(),
    };
  }
  const configured = input.configured === true;
  const authorized = input.authorized === true;
  const verified = input.verified === true;
  const ok = configured && authorized && verified;
  const target: AcceleratorTarget = {
    id: id('aag'),
    kind: input.kind,
    configured,
    authorized,
    verified,
    status: ok ? 'AVAILABLE' : 'UNAVAILABLE',
    reason: ok ? 'ACCELERATOR_TARGET_AVAILABLE' : UNVERIFIED_ACCELERATOR_UNAVAILABLE,
    createdAt: new Date().toISOString(),
  };
  store.targets.push(target);
  await save(input.root, store);
  return target;
}

export async function routeAcceleratorWorkload(input: {
  targetKind: AcceleratorKind;
  targetId?: string | null;
  classicalBaselineRef?: string | null;
  contentMode?: 'open' | 'sealed' | 'local_only';
  silentCloudAcceleratorFallback?: boolean;
  root: string;
  actor: CxActor;
}): Promise<AcceleratorRoute> {
  void input.actor;
  const store = await load(input.root);
  const now = new Date().toISOString();
  const contentMode = input.contentMode ?? 'open';
  const silent = input.silentCloudAcceleratorFallback === true;
  const baseline = input.classicalBaselineRef?.trim() || null;

  if (contentMode === 'sealed' && silent) {
    const denied: AcceleratorRoute = {
      id: id('aar'),
      targetId: input.targetId ?? null,
      targetKind: input.targetKind,
      classicalBaselineRef: baseline,
      contentMode,
      silentCloudAcceleratorFallback: true,
      status: 'DENIED',
      reason: SEALED_SILENT_CLOUD_ACCELERATOR_DENIED,
      at: now,
    };
    store.routes.push(denied);
    await save(input.root, store);
    return denied;
  }

  if (input.targetKind === 'quantum' && !baseline) {
    const rejected: AcceleratorRoute = {
      id: id('aar'),
      targetId: input.targetId ?? null,
      targetKind: 'quantum',
      classicalBaselineRef: null,
      contentMode,
      silentCloudAcceleratorFallback: silent,
      status: 'REJECTED',
      reason: QUANTUM_WITHOUT_BASELINE_REJECTED,
      at: now,
    };
    store.routes.push(rejected);
    await save(input.root, store);
    return rejected;
  }

  const target = input.targetId
    ? store.targets.find((t) => t.id === input.targetId)
    : store.targets.find(
        (t) => t.kind === input.targetKind && t.status === 'AVAILABLE',
      );

  if (!target || target.status !== 'AVAILABLE' || target.kind !== input.targetKind) {
    const unavailable: AcceleratorRoute = {
      id: id('aar'),
      targetId: target?.id ?? input.targetId ?? null,
      targetKind: input.targetKind,
      classicalBaselineRef: baseline,
      contentMode,
      silentCloudAcceleratorFallback: silent,
      status: 'UNAVAILABLE',
      reason: UNVERIFIED_ACCELERATOR_UNAVAILABLE,
      at: now,
    };
    store.routes.push(unavailable);
    await save(input.root, store);
    return unavailable;
  }

  const routed: AcceleratorRoute = {
    id: id('aar'),
    targetId: target.id,
    targetKind: target.kind,
    classicalBaselineRef: baseline,
    contentMode,
    silentCloudAcceleratorFallback: false,
    status: 'ROUTED',
    reason: 'ACCELERATOR_WORKLOAD_ROUTED_VERIFIED_TARGET',
    at: now,
  };
  store.routes.push(routed);
  await save(input.root, store);
  return routed;
}
