/**
 * 62L-CY Adaptive GPU/Quantum Compute Economy —
 * Verified AMD/NVIDIA/NPU/quantum scheduling + resource accounting.
 * Accounting CANNOT spend money / purchase / bill.
 * Unverified → UNAVAILABLE; quantum requires classical baseline.
 */

import { readJsonFile, writeJsonFileAtomic, xivLocalPath } from './durable-json';
import {
  CY_LOCKS,
  ECONOMY_SPEND_DENIED,
  HONESTY_BANNER,
  MAX_COMPUTE_TARGETS,
  MAX_ECONOMY_LEDGER_ENTRIES,
  QUANTUM_WITHOUT_BASELINE_REJECTED,
  UNVERIFIED_ACCELERATOR_UNAVAILABLE,
  type ComputeTargetKind,
  type CyActor,
  type EconomyAction,
} from './knowledge-colony-operating-system-types';

export type EconomyComputeTarget = {
  id: string;
  kind: ComputeTargetKind;
  configured: boolean;
  authorized: boolean;
  verified: boolean;
  status: 'AVAILABLE' | 'UNAVAILABLE';
  reason: string;
  createdAt: string;
};

export type EconomyLedgerEntry = {
  id: string;
  action: EconomyAction;
  units: number;
  currencyAttempted: boolean;
  status: 'RECORDED' | 'DENIED' | 'REJECTED' | 'UNAVAILABLE';
  reason: string;
  at: string;
};

export type ScheduleAttempt = {
  id: string;
  targetId: string | null;
  targetKind: ComputeTargetKind;
  classicalBaselineRef: string | null;
  status: 'SCHEDULED' | 'REJECTED' | 'UNAVAILABLE' | 'DENIED';
  reason: string;
  at: string;
};

type Store = {
  targets: EconomyComputeTarget[];
  ledger: EconomyLedgerEntry[];
  schedules: ScheduleAttempt[];
};

function storePath(root: string) {
  return xivLocalPath(root, 'adaptive-gpu-quantum-compute-economy.json');
}

async function load(root: string): Promise<Store> {
  return readJsonFile<Store>(storePath(root), {
    targets: [],
    ledger: [],
    schedules: [],
  });
}

async function save(root: string, store: Store) {
  await writeJsonFileAtomic(storePath(root), store);
}

function id(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function computeEconomyHonesty() {
  return {
    banner: HONESTY_BANNER,
    canSpendMoney: CY_LOCKS.ECONOMY_CAN_SPEND_MONEY,
    canPurchase: CY_LOCKS.ECONOMY_CAN_PURCHASE,
    canBill: CY_LOCKS.ECONOMY_CAN_BILL,
    unverifiedAvailable: CY_LOCKS.UNVERIFIED_ACCELERATOR_AVAILABLE,
    quantumClassicalBaselineRequired: CY_LOCKS.QUANTUM_CLASSICAL_BASELINE_REQUIRED,
  };
}

export async function registerEconomyComputeTarget(input: {
  kind: ComputeTargetKind;
  configured?: boolean;
  authorized?: boolean;
  verified?: boolean;
  root: string;
  actor: CyActor;
}): Promise<EconomyComputeTarget> {
  void input.actor;
  const store = await load(input.root);
  if (store.targets.length >= MAX_COMPUTE_TARGETS) {
    return {
      id: id('agqe'),
      kind: input.kind,
      configured: false,
      authorized: false,
      verified: false,
      status: 'UNAVAILABLE',
      reason: 'MAX_COMPUTE_TARGETS_BOUNDED',
      createdAt: new Date().toISOString(),
    };
  }
  const configured = input.configured === true;
  const authorized = input.authorized === true;
  const verified = input.verified === true;
  const ok = configured && authorized && verified;
  const target: EconomyComputeTarget = {
    id: id('agqe'),
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

export async function accountComputeResource(input: {
  action: EconomyAction;
  units: number;
  currencyAttempted?: boolean;
  root: string;
  actor: CyActor;
}): Promise<EconomyLedgerEntry> {
  void input.actor;
  const store = await load(input.root);
  const now = new Date().toISOString();
  if (store.ledger.length >= MAX_ECONOMY_LEDGER_ENTRIES) {
    return {
      id: id('led'),
      action: input.action,
      units: input.units,
      currencyAttempted: false,
      status: 'DENIED',
      reason: 'MAX_ECONOMY_LEDGER_ENTRIES_BOUNDED',
      at: now,
    };
  }

  const spendLike =
    input.action === 'purchase' ||
    input.action === 'bill' ||
    input.action === 'spend' ||
    input.currencyAttempted === true;

  if (spendLike) {
    const entry: EconomyLedgerEntry = {
      id: id('led'),
      action: input.action,
      units: input.units,
      currencyAttempted: true,
      status: 'DENIED',
      reason: ECONOMY_SPEND_DENIED,
      at: now,
    };
    store.ledger.push(entry);
    await save(input.root, store);
    return entry;
  }

  const entry: EconomyLedgerEntry = {
    id: id('led'),
    action: input.action,
    units: Math.max(0, input.units),
    currencyAttempted: false,
    status: 'RECORDED',
    reason: 'RESOURCE_ACCOUNTING_ONLY_NO_SPEND_AUTHORITY',
    at: now,
  };
  store.ledger.push(entry);
  await save(input.root, store);
  return entry;
}

export async function scheduleEconomyWorkload(input: {
  targetKind: ComputeTargetKind;
  targetId?: string | null;
  classicalBaselineRef?: string | null;
  root: string;
  actor: CyActor;
}): Promise<ScheduleAttempt> {
  void input.actor;
  const store = await load(input.root);
  const now = new Date().toISOString();

  if (input.targetKind === 'quantum' && !input.classicalBaselineRef?.trim()) {
    const attempt: ScheduleAttempt = {
      id: id('sched'),
      targetId: input.targetId ?? null,
      targetKind: 'quantum',
      classicalBaselineRef: null,
      status: 'REJECTED',
      reason: QUANTUM_WITHOUT_BASELINE_REJECTED,
      at: now,
    };
    store.schedules.push(attempt);
    await save(input.root, store);
    return attempt;
  }

  const target = input.targetId
    ? store.targets.find((t) => t.id === input.targetId)
    : store.targets.find(
        (t) => t.kind === input.targetKind && t.status === 'AVAILABLE',
      );

  if (!target || target.status !== 'AVAILABLE') {
    const attempt: ScheduleAttempt = {
      id: id('sched'),
      targetId: input.targetId ?? null,
      targetKind: input.targetKind,
      classicalBaselineRef: input.classicalBaselineRef ?? null,
      status: 'UNAVAILABLE',
      reason: UNVERIFIED_ACCELERATOR_UNAVAILABLE,
      at: now,
    };
    store.schedules.push(attempt);
    await save(input.root, store);
    return attempt;
  }

  const attempt: ScheduleAttempt = {
    id: id('sched'),
    targetId: target.id,
    targetKind: target.kind,
    classicalBaselineRef: input.classicalBaselineRef ?? null,
    status: 'SCHEDULED',
    reason: 'VERIFIED_COMPUTE_SCHEDULED_ACCOUNTING_ONLY',
    at: now,
  };
  store.schedules.push(attempt);
  await save(input.root, store);
  return attempt;
}
