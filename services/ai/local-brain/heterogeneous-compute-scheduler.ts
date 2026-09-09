/**
 * 62L-CV Heterogeneous Compute Scheduler —
 * Schedule across verified CPU/AMD/NVIDIA/NPU/quantum targets only.
 * Unconfigured/unverified → UNAVAILABLE.
 * Quantum requires classical baseline; sealed never silent cloud accelerator route.
 */

import { readJsonFile, writeJsonFileAtomic, xivLocalPath } from './durable-json';
import {
  CV_LOCKS,
  HONESTY_BANNER,
  QUANTUM_WITHOUT_BASELINE_REJECTED,
  SEALED_SILENT_CLOUD_ACCELERATOR_DENIED,
  UNVERIFIED_ACCELERATOR_UNAVAILABLE,
  type ComputeTargetKind,
  type CvActor,
} from './distributed-intelligence-laboratory-os-types';

export type ComputeTarget = {
  id: string;
  kind: ComputeTargetKind;
  configured: boolean;
  authorized: boolean;
  verified: boolean;
  status: 'AVAILABLE' | 'UNAVAILABLE';
  reason: string;
  createdAt: string;
};

export type ScheduleAttempt = {
  id: string;
  targetId: string | null;
  targetKind: ComputeTargetKind;
  classicalBaselineRef: string | null;
  contentMode: 'open' | 'sealed' | 'local_only';
  silentCloudAcceleratorFallback: boolean;
  status: 'SCHEDULED' | 'REJECTED' | 'UNAVAILABLE' | 'DENIED';
  reason: string;
  at: string;
};

type Store = {
  targets: ComputeTarget[];
  attempts: ScheduleAttempt[];
};

function storePath(root: string) {
  return xivLocalPath(root, 'heterogeneous-compute-scheduler.json');
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

export function heterogeneousSchedulerHonesty() {
  return {
    banner: HONESTY_BANNER,
    unverifiedAvailable: CV_LOCKS.UNVERIFIED_ACCELERATOR_AVAILABLE,
    unconfiguredAvailable: CV_LOCKS.UNCONFIGURED_TARGET_AVAILABLE,
    quantumClassicalBaselineRequired: CV_LOCKS.QUANTUM_CLASSICAL_BASELINE_REQUIRED,
    sealedSilentCloudFallback: CV_LOCKS.SEALED_SILENT_CLOUD_ACCELERATOR_FALLBACK,
  };
}

export async function registerComputeTarget(input: {
  kind: ComputeTargetKind;
  configured?: boolean;
  authorized?: boolean;
  verified?: boolean;
  root: string;
  actor: CvActor;
}): Promise<ComputeTarget> {
  void input.actor;
  const store = await load(input.root);
  const configured = input.configured === true;
  const authorized = input.authorized === true;
  const verified = input.verified === true;
  const ok = configured && authorized && verified;
  const target: ComputeTarget = {
    id: id('hct'),
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

export async function scheduleComputeJob(input: {
  targetKind: ComputeTargetKind;
  targetId?: string | null;
  classicalBaselineRef?: string | null;
  contentMode?: 'open' | 'sealed' | 'local_only';
  silentCloudAcceleratorFallback?: boolean;
  root: string;
  actor: CvActor;
}): Promise<ScheduleAttempt> {
  void input.actor;
  const store = await load(input.root);
  const now = new Date().toISOString();
  const contentMode = input.contentMode ?? 'open';
  const silent = input.silentCloudAcceleratorFallback === true;
  const baseline = input.classicalBaselineRef?.trim() || null;

  if (contentMode === 'sealed' && silent) {
    const denied: ScheduleAttempt = {
      id: id('hcs'),
      targetId: input.targetId ?? null,
      targetKind: input.targetKind,
      classicalBaselineRef: baseline,
      contentMode,
      silentCloudAcceleratorFallback: true,
      status: 'DENIED',
      reason: SEALED_SILENT_CLOUD_ACCELERATOR_DENIED,
      at: now,
    };
    store.attempts.push(denied);
    await save(input.root, store);
    return denied;
  }

  if (input.targetKind === 'quantum' && !baseline) {
    const rejected: ScheduleAttempt = {
      id: id('hcs'),
      targetId: input.targetId ?? null,
      targetKind: 'quantum',
      classicalBaselineRef: null,
      contentMode,
      silentCloudAcceleratorFallback: silent,
      status: 'REJECTED',
      reason: QUANTUM_WITHOUT_BASELINE_REJECTED,
      at: now,
    };
    store.attempts.push(rejected);
    await save(input.root, store);
    return rejected;
  }

  let target: ComputeTarget | undefined;
  if (input.targetId) {
    target = store.targets.find((t) => t.id === input.targetId);
  } else {
    target = store.targets.find(
      (t) =>
        t.kind === input.targetKind &&
        t.status === 'AVAILABLE' &&
        t.configured &&
        t.authorized &&
        t.verified,
    );
  }

  if (!target || target.status !== 'AVAILABLE' || !target.verified) {
    const unavailable: ScheduleAttempt = {
      id: id('hcs'),
      targetId: target?.id ?? input.targetId ?? null,
      targetKind: input.targetKind,
      classicalBaselineRef: baseline,
      contentMode,
      silentCloudAcceleratorFallback: silent,
      status: 'UNAVAILABLE',
      reason: UNVERIFIED_ACCELERATOR_UNAVAILABLE,
      at: now,
    };
    store.attempts.push(unavailable);
    await save(input.root, store);
    return unavailable;
  }

  const scheduled: ScheduleAttempt = {
    id: id('hcs'),
    targetId: target.id,
    targetKind: target.kind,
    classicalBaselineRef: baseline,
    contentMode,
    silentCloudAcceleratorFallback: false,
    status: 'SCHEDULED',
    reason: 'JOB_SCHEDULED_ON_VERIFIED_TARGET',
    at: now,
  };
  store.attempts.push(scheduled);
  await save(input.root, store);
  return scheduled;
}
