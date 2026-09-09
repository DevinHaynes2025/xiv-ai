/**
 * 62L-DC Adaptive Accelerator Federation —
 * Verified accelerator federation only.
 * Unverified → UNAVAILABLE; classical baseline for quantum; cannot spend/bill.
 */

import { readJsonFile, writeJsonFileAtomic, xivLocalPath } from './durable-json';
import {
  DC_LOCKS,
  FEDERATION_SPEND_DENIED,
  HONESTY_BANNER,
  MAX_ACCELERATOR_TARGETS,
  MAX_FEDERATION_LEDGER,
  QUANTUM_WITHOUT_BASELINE_REJECTED,
  UNVERIFIED_ACCELERATOR_UNAVAILABLE,
  type AcceleratorKind,
  type DcActor,
  type FederationAction,
} from './superbrain-service-fabric-types';

export type FederatedAccelerator = {
  id: string;
  kind: AcceleratorKind;
  configured: boolean;
  authorized: boolean;
  verified: boolean;
  status: 'AVAILABLE' | 'UNAVAILABLE';
  reason: string;
  createdAt: string;
};

export type FederationLedgerEntry = {
  id: string;
  action: FederationAction;
  units: number;
  currencyAttempted: boolean;
  status: 'RECORDED' | 'DENIED' | 'REJECTED' | 'UNAVAILABLE';
  reason: string;
  at: string;
};

export type FederationSchedule = {
  id: string;
  targetId: string | null;
  targetKind: AcceleratorKind;
  classicalBaselineRef: string | null;
  status: 'SCHEDULED' | 'REJECTED' | 'UNAVAILABLE' | 'DENIED';
  reason: string;
  at: string;
};

type Store = {
  targets: FederatedAccelerator[];
  ledger: FederationLedgerEntry[];
  schedules: FederationSchedule[];
};

function storePath(root: string) {
  return xivLocalPath(root, 'adaptive-accelerator-federation.json');
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

export function adaptiveAcceleratorFederationHonesty() {
  return {
    banner: HONESTY_BANNER,
    unverifiedAvailable: DC_LOCKS.UNVERIFIED_ACCELERATOR_AVAILABLE,
    quantumClassicalBaselineRequired: DC_LOCKS.QUANTUM_CLASSICAL_BASELINE_REQUIRED,
    canSpendMoney: DC_LOCKS.FEDERATION_CAN_SPEND_MONEY,
    canBill: DC_LOCKS.FEDERATION_CAN_BILL,
  };
}

export async function registerFederatedAccelerator(input: {
  kind: AcceleratorKind;
  configured?: boolean;
  authorized?: boolean;
  verified?: boolean;
  root: string;
  actor: DcActor;
}): Promise<FederatedAccelerator> {
  void input.actor;
  const store = await load(input.root);
  const now = new Date().toISOString();
  if (store.targets.length >= MAX_ACCELERATOR_TARGETS) {
    return {
      id: id('aaf'),
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
  const target: FederatedAccelerator = {
    id: id('aaf'),
    kind: input.kind,
    configured,
    authorized,
    verified,
    status: ok ? 'AVAILABLE' : 'UNAVAILABLE',
    reason: ok ? 'FEDERATED_ACCELERATOR_AVAILABLE' : UNVERIFIED_ACCELERATOR_UNAVAILABLE,
    createdAt: now,
  };
  store.targets.push(target);
  await save(input.root, store);
  return target;
}

export async function accountFederationResource(input: {
  action: FederationAction;
  units: number;
  currencyAttempted?: boolean;
  root: string;
  actor: DcActor;
}): Promise<FederationLedgerEntry> {
  void input.actor;
  const store = await load(input.root);
  const now = new Date().toISOString();
  if (store.ledger.length >= MAX_FEDERATION_LEDGER) {
    return {
      id: id('led'),
      action: input.action,
      units: input.units,
      currencyAttempted: false,
      status: 'DENIED',
      reason: 'MAX_FEDERATION_LEDGER_BOUNDED',
      at: now,
    };
  }

  const spendLike =
    input.action === 'spend' ||
    input.action === 'bill' ||
    input.action === 'purchase' ||
    input.currencyAttempted === true;

  if (spendLike) {
    const entry: FederationLedgerEntry = {
      id: id('led'),
      action: input.action,
      units: input.units,
      currencyAttempted: true,
      status: 'DENIED',
      reason: FEDERATION_SPEND_DENIED,
      at: now,
    };
    store.ledger.push(entry);
    await save(input.root, store);
    return entry;
  }

  const entry: FederationLedgerEntry = {
    id: id('led'),
    action: input.action,
    units: Math.max(0, input.units),
    currencyAttempted: false,
    status: 'RECORDED',
    reason: 'FEDERATION_ACCOUNTING_ONLY_NO_SPEND_AUTHORITY',
    at: now,
  };
  store.ledger.push(entry);
  await save(input.root, store);
  return entry;
}

export async function scheduleFederatedWorkload(input: {
  targetKind: AcceleratorKind;
  targetId?: string | null;
  classicalBaselineRef?: string | null;
  root: string;
  actor: DcActor;
}): Promise<FederationSchedule> {
  void input.actor;
  const store = await load(input.root);
  const now = new Date().toISOString();

  if (input.targetKind === 'quantum' && !input.classicalBaselineRef?.trim()) {
    const attempt: FederationSchedule = {
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
    const attempt: FederationSchedule = {
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

  const attempt: FederationSchedule = {
    id: id('sched'),
    targetId: target.id,
    targetKind: target.kind,
    classicalBaselineRef: input.classicalBaselineRef ?? null,
    status: 'SCHEDULED',
    reason: 'VERIFIED_FEDERATED_ACCELERATOR_SCHEDULED_NO_SPEND',
    at: now,
  };
  store.schedules.push(attempt);
  await save(input.root, store);
  return attempt;
}
