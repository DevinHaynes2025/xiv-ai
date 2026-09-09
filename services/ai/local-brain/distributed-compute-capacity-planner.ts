/**
 * 62L-DE Distributed Compute Capacity Planner —
 * Compute-capacity forecasting/planning across verified targets.
 * Proxies/plans only; cannot spend money / purchase / bill.
 * Unverified hardware UNAVAILABLE (not planned as live).
 */

import { readJsonFile, writeJsonFileAtomic, xivLocalPath } from './durable-json';
import {
  CAPACITY_PLANNER_SPEND_DENIED,
  DE_LOCKS,
  HONESTY_BANNER,
  MAX_CAPACITY_LEDGER,
  MAX_CAPACITY_TARGETS,
  UNVERIFIED_HARDWARE_UNAVAILABLE,
  type CapacityAction,
  type DeActor,
  type HardwareKind,
} from './knowledge-exchange-gateway-marketplace-types';

export type CapacityTarget = {
  id: string;
  kind: HardwareKind;
  configured: boolean;
  authorized: boolean;
  verified: boolean;
  status: 'AVAILABLE' | 'UNAVAILABLE';
  plannedAsLive: boolean;
  reason: string;
  createdAt: string;
};

export type CapacityLedgerEntry = {
  id: string;
  action: CapacityAction;
  units: number;
  currencyAttempted: boolean;
  status: 'RECORDED' | 'DENIED' | 'PLAN_ONLY' | 'UNAVAILABLE';
  reason: string;
  at: string;
};

export type CapacityPlan = {
  id: string;
  targetId: string | null;
  targetKind: HardwareKind;
  units: number;
  status: 'PLAN_ONLY' | 'DENIED' | 'UNAVAILABLE';
  plannedAsLive: false;
  reason: string;
  at: string;
};

type Store = {
  targets: CapacityTarget[];
  ledger: CapacityLedgerEntry[];
  plans: CapacityPlan[];
};

function storePath(root: string) {
  return xivLocalPath(root, 'distributed-compute-capacity-planner.json');
}

async function load(root: string): Promise<Store> {
  return readJsonFile<Store>(storePath(root), {
    targets: [],
    ledger: [],
    plans: [],
  });
}

async function save(root: string, store: Store) {
  await writeJsonFileAtomic(storePath(root), store);
}

function id(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function computeCapacityPlannerHonesty() {
  return {
    banner: HONESTY_BANNER,
    canSpend: DE_LOCKS.CAPACITY_PLANNER_CAN_SPEND,
    canPurchase: DE_LOCKS.CAPACITY_PLANNER_CAN_PURCHASE,
    canBill: DE_LOCKS.CAPACITY_PLANNER_CAN_BILL,
    unverifiedPlannedAsLive: DE_LOCKS.UNVERIFIED_HARDWARE_PLANNED_AS_LIVE,
  };
}

export async function registerCapacityTarget(input: {
  kind: HardwareKind;
  configured?: boolean;
  authorized?: boolean;
  verified?: boolean;
  root: string;
  actor: DeActor;
}): Promise<CapacityTarget> {
  void input.actor;
  const store = await load(input.root);
  const now = new Date().toISOString();
  if (store.targets.length >= MAX_CAPACITY_TARGETS) {
    return {
      id: id('dccp'),
      kind: input.kind,
      configured: false,
      authorized: false,
      verified: false,
      status: 'UNAVAILABLE',
      plannedAsLive: false,
      reason: 'MAX_CAPACITY_TARGETS_BOUNDED',
      createdAt: now,
    };
  }
  const configured = input.configured === true;
  const authorized = input.authorized === true;
  const verified = input.verified === true;
  const ok = configured && authorized && verified;
  const target: CapacityTarget = {
    id: id('dccp'),
    kind: input.kind,
    configured,
    authorized,
    verified,
    status: ok ? 'AVAILABLE' : 'UNAVAILABLE',
    plannedAsLive: false,
    reason: ok ? 'CAPACITY_TARGET_AVAILABLE_FOR_PLANNING' : UNVERIFIED_HARDWARE_UNAVAILABLE,
    createdAt: now,
  };
  store.targets.push(target);
  await save(input.root, store);
  return target;
}

export async function accountCapacityAction(input: {
  action: CapacityAction;
  units: number;
  currencyAttempted?: boolean;
  root: string;
  actor: DeActor;
}): Promise<CapacityLedgerEntry> {
  void input.actor;
  const store = await load(input.root);
  const now = new Date().toISOString();
  if (store.ledger.length >= MAX_CAPACITY_LEDGER) {
    return {
      id: id('dccl'),
      action: input.action,
      units: input.units,
      currencyAttempted: false,
      status: 'DENIED',
      reason: 'MAX_CAPACITY_LEDGER_BOUNDED',
      at: now,
    };
  }

  const moneyActions: CapacityAction[] = ['purchase', 'bill', 'spend'];
  if (moneyActions.includes(input.action) || input.currencyAttempted === true) {
    const entry: CapacityLedgerEntry = {
      id: id('dccl'),
      action: input.action,
      units: input.units,
      currencyAttempted: true,
      status: 'DENIED',
      reason: CAPACITY_PLANNER_SPEND_DENIED,
      at: now,
    };
    store.ledger.push(entry);
    await save(input.root, store);
    return entry;
  }

  const entry: CapacityLedgerEntry = {
    id: id('dccl'),
    action: input.action,
    units: input.units,
    currencyAttempted: false,
    status: input.action === 'forecast' || input.action === 'plan' ? 'PLAN_ONLY' : 'RECORDED',
    reason:
      input.action === 'forecast' || input.action === 'plan'
        ? 'CAPACITY_FORECAST_OR_PLAN_ONLY_NO_SPEND'
        : 'CAPACITY_ACCOUNTING_RECORDED_NO_SPEND',
    at: now,
  };
  store.ledger.push(entry);
  await save(input.root, store);
  return entry;
}

export async function planCapacityWorkload(input: {
  targetId?: string | null;
  targetKind: HardwareKind;
  units: number;
  root: string;
  actor: DeActor;
}): Promise<CapacityPlan> {
  void input.actor;
  const store = await load(input.root);
  const now = new Date().toISOString();
  const target = input.targetId
    ? store.targets.find((t) => t.id === input.targetId)
    : store.targets.find(
        (t) =>
          t.kind === input.targetKind &&
          t.status === 'AVAILABLE' &&
          t.verified &&
          t.configured,
      );

  if (!target || target.status === 'UNAVAILABLE' || !target.verified) {
    const plan: CapacityPlan = {
      id: id('dccplan'),
      targetId: target?.id ?? null,
      targetKind: input.targetKind,
      units: input.units,
      status: 'UNAVAILABLE',
      plannedAsLive: false,
      reason: UNVERIFIED_HARDWARE_UNAVAILABLE,
      at: now,
    };
    store.plans.push(plan);
    await save(input.root, store);
    return plan;
  }

  const plan: CapacityPlan = {
    id: id('dccplan'),
    targetId: target.id,
    targetKind: target.kind,
    units: input.units,
    status: 'PLAN_ONLY',
    plannedAsLive: false,
    reason: 'CAPACITY_PLAN_RECORDED_NOT_LIVE_SPEND',
    at: now,
  };
  store.plans.push(plan);
  await save(input.root, store);
  return plan;
}
