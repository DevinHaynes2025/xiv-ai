/**
 * 62L-CZ GPU/NPU/Quantum Resource Scheduler —
 * Verified AMD/NVIDIA/NPU/quantum scheduling only.
 * Classical baseline required for quantum; unconfigured → UNAVAILABLE.
 * Accounting/scheduler cannot spend or bill.
 */

import { readJsonFile, writeJsonFileAtomic, xivLocalPath } from './durable-json';
import {
  ACCOUNTING_SCHEDULER_SPEND_DENIED,
  CZ_LOCKS,
  HONESTY_BANNER,
  MAX_SCHEDULER_TARGETS,
  QUANTUM_WITHOUT_BASELINE_REJECTED,
  UNVERIFIED_ACCELERATOR_UNAVAILABLE,
  type AcceleratorVendor,
  type CzActor,
} from './intelligence-civilization-kernel-types';

export type SchedulerTarget = {
  id: string;
  vendor: AcceleratorVendor;
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
  vendor: AcceleratorVendor;
  classicalBaselineRef: string | null;
  spendRequested: boolean;
  billRequested: boolean;
  status: 'SCHEDULED' | 'REJECTED' | 'UNAVAILABLE' | 'DENIED';
  reason: string;
  at: string;
};

type Store = {
  targets: SchedulerTarget[];
  attempts: ScheduleAttempt[];
};

function storePath(root: string) {
  return xivLocalPath(root, 'gpu-npu-quantum-resource-scheduler.json');
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

export function resourceSchedulerHonesty() {
  return {
    banner: HONESTY_BANNER,
    unverifiedAvailable: CZ_LOCKS.UNVERIFIED_ACCELERATOR_AVAILABLE,
    unconfiguredAvailable: CZ_LOCKS.UNCONFIGURED_TARGET_AVAILABLE,
    quantumClassicalBaselineRequired: CZ_LOCKS.QUANTUM_CLASSICAL_BASELINE_REQUIRED,
    spendBillEnabled: CZ_LOCKS.SCHEDULER_SPEND_BILL_ENABLED,
  };
}

export async function registerSchedulerTarget(input: {
  vendor: AcceleratorVendor;
  configured?: boolean;
  authorized?: boolean;
  verified?: boolean;
  root: string;
  actor: CzActor;
}): Promise<SchedulerTarget> {
  void input.actor;
  const store = await load(input.root);
  if (store.targets.length >= MAX_SCHEDULER_TARGETS) {
    return {
      id: id('rst'),
      vendor: input.vendor,
      configured: false,
      authorized: false,
      verified: false,
      status: 'UNAVAILABLE',
      reason: 'MAX_SCHEDULER_TARGETS_BOUNDED',
      createdAt: new Date().toISOString(),
    };
  }
  const configured = input.configured === true;
  const authorized = input.authorized === true;
  const verified = input.verified === true;
  const ok = configured && authorized && verified;
  const target: SchedulerTarget = {
    id: id('rst'),
    vendor: input.vendor,
    configured,
    authorized,
    verified,
    status: ok ? 'AVAILABLE' : 'UNAVAILABLE',
    reason: ok ? 'SCHEDULER_TARGET_AVAILABLE' : UNVERIFIED_ACCELERATOR_UNAVAILABLE,
    createdAt: new Date().toISOString(),
  };
  store.targets.push(target);
  await save(input.root, store);
  return target;
}

export async function scheduleResourceWorkload(input: {
  vendor: AcceleratorVendor;
  targetId?: string | null;
  classicalBaselineRef?: string | null;
  spendRequested?: boolean;
  billRequested?: boolean;
  root: string;
  actor: CzActor;
}): Promise<ScheduleAttempt> {
  void input.actor;
  const store = await load(input.root);
  const now = new Date().toISOString();
  const baseline = input.classicalBaselineRef?.trim() || null;
  const spend = input.spendRequested === true;
  const bill = input.billRequested === true;

  if (spend || bill || CZ_LOCKS.SCHEDULER_SPEND_BILL_ENABLED === false) {
    if (spend || bill) {
      const denied: ScheduleAttempt = {
        id: id('rsa'),
        targetId: input.targetId ?? null,
        vendor: input.vendor,
        classicalBaselineRef: baseline,
        spendRequested: spend,
        billRequested: bill,
        status: 'DENIED',
        reason: ACCOUNTING_SCHEDULER_SPEND_DENIED,
        at: now,
      };
      store.attempts.push(denied);
      await save(input.root, store);
      return denied;
    }
  }

  if (input.vendor === 'quantum' && !baseline) {
    const rejected: ScheduleAttempt = {
      id: id('rsa'),
      targetId: input.targetId ?? null,
      vendor: 'quantum',
      classicalBaselineRef: null,
      spendRequested: false,
      billRequested: false,
      status: 'REJECTED',
      reason: QUANTUM_WITHOUT_BASELINE_REJECTED,
      at: now,
    };
    store.attempts.push(rejected);
    await save(input.root, store);
    return rejected;
  }

  let target: SchedulerTarget | undefined;
  if (input.targetId) {
    target = store.targets.find((t) => t.id === input.targetId);
  } else {
    target = store.targets.find(
      (t) =>
        t.vendor === input.vendor &&
        t.configured &&
        t.authorized &&
        t.verified &&
        t.status === 'AVAILABLE',
    );
  }

  if (!target || target.status !== 'AVAILABLE' || !target.configured || !target.verified) {
    const unavailable: ScheduleAttempt = {
      id: id('rsa'),
      targetId: target?.id ?? input.targetId ?? null,
      vendor: input.vendor,
      classicalBaselineRef: baseline,
      spendRequested: false,
      billRequested: false,
      status: 'UNAVAILABLE',
      reason: UNVERIFIED_ACCELERATOR_UNAVAILABLE,
      at: now,
    };
    store.attempts.push(unavailable);
    await save(input.root, store);
    return unavailable;
  }

  const scheduled: ScheduleAttempt = {
    id: id('rsa'),
    targetId: target.id,
    vendor: target.vendor,
    classicalBaselineRef: baseline,
    spendRequested: false,
    billRequested: false,
    status: 'SCHEDULED',
    reason: 'WORKLOAD_SCHEDULED_VERIFIED_TARGET',
    at: now,
  };
  store.attempts.push(scheduled);
  await save(input.root, store);
  return scheduled;
}

export async function attemptSchedulerSpendOrBill(input: {
  amount: number;
  kind: 'spend' | 'bill';
  root: string;
  actor: CzActor;
}): Promise<{ accepted: false; reason: string; amount: number; kind: string; at: string }> {
  void input.actor;
  void input.root;
  return {
    accepted: false,
    reason: ACCOUNTING_SCHEDULER_SPEND_DENIED,
    amount: input.amount,
    kind: input.kind,
    at: new Date().toISOString(),
  };
}
