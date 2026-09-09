/**
 * 62L-DB Universal Accelerator Scheduler —
 * Verified CPU/GPU/NPU/quantum scheduling over DA control plane concepts.
 * Classical baseline required for quantum; no spend/bill authority.
 * Unconfigured/unverified → UNAVAILABLE.
 */

import { readJsonFile, writeJsonFileAtomic, xivLocalPath } from './durable-json';
import {
  DB_LOCKS,
  HONESTY_BANNER,
  MAX_ACCELERATOR_TARGETS,
  QUANTUM_WITHOUT_BASELINE_REJECTED,
  SCHEDULER_SPEND_DENIED,
  UNCONFIGURED_PROVIDER_UNAVAILABLE,
  type AcceleratorKind,
  type DbActor,
} from './distributed-superbrain-runtime-mesh-types';

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

export type Schedule = {
  id: string;
  targetId: string | null;
  targetKind: AcceleratorKind;
  classicalBaselineRef: string | null;
  status: 'SCHEDULED' | 'REJECTED' | 'UNAVAILABLE' | 'DENIED';
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
  targets: AcceleratorTarget[];
  schedules: Schedule[];
  spendAttempts: SpendAttempt[];
};

function storePath(root: string) {
  return xivLocalPath(root, 'universal-accelerator-scheduler.json');
}

async function load(root: string): Promise<Store> {
  return readJsonFile<Store>(storePath(root), {
    targets: [],
    schedules: [],
    spendAttempts: [],
  });
}

async function save(root: string, store: Store) {
  await writeJsonFileAtomic(storePath(root), store);
}

function id(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function universalAcceleratorSchedulerHonesty() {
  return {
    banner: HONESTY_BANNER,
    unverifiedAvailable: DB_LOCKS.UNVERIFIED_ACCELERATOR_AVAILABLE,
    quantumClassicalBaselineRequired: DB_LOCKS.QUANTUM_CLASSICAL_BASELINE_REQUIRED,
    spendEnabled: DB_LOCKS.SCHEDULER_SPEND_ENABLED,
    billEnabled: DB_LOCKS.SCHEDULER_BILL_ENABLED,
  };
}

export async function registerAcceleratorTarget(input: {
  kind: AcceleratorKind;
  configured?: boolean;
  authorized?: boolean;
  verified?: boolean;
  root: string;
  actor: DbActor;
}): Promise<AcceleratorTarget> {
  void input.actor;
  const store = await load(input.root);
  const now = new Date().toISOString();
  if (store.targets.length >= MAX_ACCELERATOR_TARGETS) {
    return {
      id: id('uas'),
      kind: input.kind,
      configured: false,
      authorized: false,
      verified: false,
      status: 'UNAVAILABLE',
      reason: 'MAX_ACCELERATOR_TARGETS_BOUNDED',
      createdAt: now,
    };
  }
  const configured = input.configured === true;
  const authorized = input.authorized === true;
  const verified = input.verified === true;
  const ok = configured && authorized && verified;
  const target: AcceleratorTarget = {
    id: id('uas'),
    kind: input.kind,
    configured,
    authorized,
    verified,
    status: ok ? 'AVAILABLE' : 'UNAVAILABLE',
    reason: ok ? 'ACCELERATOR_TARGET_AVAILABLE' : UNCONFIGURED_PROVIDER_UNAVAILABLE,
    createdAt: now,
  };
  store.targets.push(target);
  await save(input.root, store);
  return target;
}

export async function scheduleAcceleratorWorkload(input: {
  targetKind: AcceleratorKind;
  targetId?: string | null;
  classicalBaselineRef?: string | null;
  root: string;
  actor: DbActor;
}): Promise<Schedule> {
  void input.actor;
  const store = await load(input.root);
  const now = new Date().toISOString();

  if (input.targetKind === 'quantum' && !input.classicalBaselineRef) {
    const schedule: Schedule = {
      id: id('sched'),
      targetId: input.targetId ?? null,
      targetKind: 'quantum',
      classicalBaselineRef: null,
      status: 'REJECTED',
      reason: QUANTUM_WITHOUT_BASELINE_REJECTED,
      at: now,
    };
    store.schedules.push(schedule);
    await save(input.root, store);
    return schedule;
  }

  const target = input.targetId
    ? store.targets.find((t) => t.id === input.targetId)
    : store.targets.find((t) => t.kind === input.targetKind && t.status === 'AVAILABLE');

  if (!target || target.status === 'UNAVAILABLE' || !target.configured || !target.verified) {
    const schedule: Schedule = {
      id: id('sched'),
      targetId: target?.id ?? input.targetId ?? null,
      targetKind: input.targetKind,
      classicalBaselineRef: input.classicalBaselineRef ?? null,
      status: 'UNAVAILABLE',
      reason: UNCONFIGURED_PROVIDER_UNAVAILABLE,
      at: now,
    };
    store.schedules.push(schedule);
    await save(input.root, store);
    return schedule;
  }

  const schedule: Schedule = {
    id: id('sched'),
    targetId: target.id,
    targetKind: input.targetKind,
    classicalBaselineRef: input.classicalBaselineRef ?? null,
    status: 'SCHEDULED',
    reason: 'ACCELERATOR_WORKLOAD_SCHEDULED',
    at: now,
  };
  store.schedules.push(schedule);
  await save(input.root, store);
  return schedule;
}

export async function attemptSchedulerSpendOrBill(input: {
  amount: number;
  currency?: string;
  mode?: 'spend' | 'bill';
  root: string;
  actor: DbActor;
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
    reason: SCHEDULER_SPEND_DENIED,
    at: now,
  };
  store.spendAttempts.push(attempt);
  await save(input.root, store);
  return {
    accepted: false,
    reason: SCHEDULER_SPEND_DENIED,
    attempt,
    at: now,
  };
}
