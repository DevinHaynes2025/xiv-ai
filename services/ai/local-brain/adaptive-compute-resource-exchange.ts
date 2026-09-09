/**
 * 62L-DD Adaptive Compute Resource Exchange —
 * Bounded compute-resource matching across verified accelerators.
 * Accounting ≠ spend; no purchase/bill authority.
 * Verified AMD/NVIDIA/NPU/quantum only; classical baseline for quantum.
 */

import { readJsonFile, writeJsonFileAtomic, xivLocalPath } from './durable-json';
import {
  DD_LOCKS,
  HONESTY_BANNER,
  MAX_EXCHANGE_LEDGER,
  MAX_EXCHANGE_TARGETS,
  RESOURCE_EXCHANGE_SPEND_DENIED,
  UNVERIFIED_ACCELERATOR_DENIED,
  type AcceleratorKind,
  type DdActor,
  type ExchangeAction,
} from './cognitive-service-mesh-types';

export type ExchangeTarget = {
  id: string;
  kind: AcceleratorKind;
  configured: boolean;
  authorized: boolean;
  verified: boolean;
  status: 'AVAILABLE' | 'UNAVAILABLE' | 'DENIED';
  reason: string;
  createdAt: string;
};

export type ExchangeLedgerEntry = {
  id: string;
  action: ExchangeAction;
  units: number;
  currencyAttempted: boolean;
  status: 'RECORDED' | 'DENIED' | 'REJECTED' | 'UNAVAILABLE';
  reason: string;
  at: string;
};

export type MatchAttempt = {
  id: string;
  targetId: string | null;
  targetKind: AcceleratorKind;
  classicalBaselineRef: string | null;
  status: 'MATCHED' | 'REJECTED' | 'UNAVAILABLE' | 'DENIED';
  reason: string;
  at: string;
};

type Store = {
  targets: ExchangeTarget[];
  ledger: ExchangeLedgerEntry[];
  matches: MatchAttempt[];
};

function storePath(root: string) {
  return xivLocalPath(root, 'adaptive-compute-resource-exchange.json');
}

async function load(root: string): Promise<Store> {
  return readJsonFile<Store>(storePath(root), {
    targets: [],
    ledger: [],
    matches: [],
  });
}

async function save(root: string, store: Store) {
  await writeJsonFileAtomic(storePath(root), store);
}

function id(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function computeResourceExchangeHonesty() {
  return {
    banner: HONESTY_BANNER,
    canSpend: DD_LOCKS.RESOURCE_EXCHANGE_CAN_SPEND,
    canPurchase: DD_LOCKS.RESOURCE_EXCHANGE_CAN_PURCHASE,
    canBill: DD_LOCKS.RESOURCE_EXCHANGE_CAN_BILL,
    unverifiedExchange: DD_LOCKS.UNVERIFIED_ACCELERATOR_EXCHANGE,
    quantumClassicalBaselineRequired: DD_LOCKS.QUANTUM_CLASSICAL_BASELINE_REQUIRED,
  };
}

export async function registerExchangeTarget(input: {
  kind: AcceleratorKind;
  configured?: boolean;
  authorized?: boolean;
  verified?: boolean;
  root: string;
  actor: DdActor;
}): Promise<ExchangeTarget> {
  void input.actor;
  const store = await load(input.root);
  const now = new Date().toISOString();
  if (store.targets.length >= MAX_EXCHANGE_TARGETS) {
    return {
      id: id('acre'),
      kind: input.kind,
      configured: false,
      authorized: false,
      verified: false,
      status: 'UNAVAILABLE',
      reason: 'MAX_EXCHANGE_TARGETS_BOUNDED',
      createdAt: now,
    };
  }
  const configured = input.configured === true;
  const authorized = input.authorized === true;
  const verified = input.verified === true;
  const ok = configured && authorized && verified;
  const target: ExchangeTarget = {
    id: id('acre'),
    kind: input.kind,
    configured,
    authorized,
    verified,
    status: ok ? 'AVAILABLE' : 'UNAVAILABLE',
    reason: ok ? 'EXCHANGE_TARGET_AVAILABLE' : UNVERIFIED_ACCELERATOR_DENIED,
    createdAt: now,
  };
  store.targets.push(target);
  await save(input.root, store);
  return target;
}

export async function accountResourceExchange(input: {
  action: ExchangeAction;
  units: number;
  currencyAttempted?: boolean;
  root: string;
  actor: DdActor;
}): Promise<ExchangeLedgerEntry> {
  void input.actor;
  const store = await load(input.root);
  const now = new Date().toISOString();
  if (store.ledger.length >= MAX_EXCHANGE_LEDGER) {
    return {
      id: id('acrl'),
      action: input.action,
      units: input.units,
      currencyAttempted: false,
      status: 'DENIED',
      reason: 'MAX_EXCHANGE_LEDGER_BOUNDED',
      at: now,
    };
  }

  const spendLike =
    input.action === 'purchase' ||
    input.action === 'bill' ||
    input.action === 'spend' ||
    input.currencyAttempted === true;

  if (spendLike) {
    const entry: ExchangeLedgerEntry = {
      id: id('acrl'),
      action: input.action,
      units: input.units,
      currencyAttempted: input.currencyAttempted === true,
      status: 'DENIED',
      reason: RESOURCE_EXCHANGE_SPEND_DENIED,
      at: now,
    };
    store.ledger.push(entry);
    await save(input.root, store);
    return entry;
  }

  const entry: ExchangeLedgerEntry = {
    id: id('acrl'),
    action: input.action,
    units: input.units,
    currencyAttempted: false,
    status: 'RECORDED',
    reason: 'RESOURCE_EXCHANGE_ACCOUNTING_ONLY',
    at: now,
  };
  store.ledger.push(entry);
  await save(input.root, store);
  return entry;
}

export async function matchComputeResource(input: {
  targetKind: AcceleratorKind;
  classicalBaselineRef?: string | null;
  root: string;
  actor: DdActor;
}): Promise<MatchAttempt> {
  void input.actor;
  const store = await load(input.root);
  const now = new Date().toISOString();
  const target = store.targets.find(
    (t) => t.kind === input.targetKind && t.status === 'AVAILABLE',
  );

  if (!target) {
    const attempt: MatchAttempt = {
      id: id('acrm'),
      targetId: null,
      targetKind: input.targetKind,
      classicalBaselineRef: input.classicalBaselineRef ?? null,
      status: 'UNAVAILABLE',
      reason: UNVERIFIED_ACCELERATOR_DENIED,
      at: now,
    };
    store.matches.push(attempt);
    await save(input.root, store);
    return attempt;
  }

  if (
    input.targetKind === 'quantum' &&
    DD_LOCKS.QUANTUM_CLASSICAL_BASELINE_REQUIRED &&
    !input.classicalBaselineRef
  ) {
    const attempt: MatchAttempt = {
      id: id('acrm'),
      targetId: target.id,
      targetKind: input.targetKind,
      classicalBaselineRef: null,
      status: 'REJECTED',
      reason: 'QUANTUM_MATCH_WITHOUT_CLASSICAL_BASELINE_REJECTED',
      at: now,
    };
    store.matches.push(attempt);
    await save(input.root, store);
    return attempt;
  }

  const attempt: MatchAttempt = {
    id: id('acrm'),
    targetId: target.id,
    targetKind: input.targetKind,
    classicalBaselineRef: input.classicalBaselineRef ?? null,
    status: 'MATCHED',
    reason: 'VERIFIED_ACCELERATOR_MATCHED_ACCOUNTING_ONLY',
    at: now,
  };
  store.matches.push(attempt);
  await save(input.root, store);
  return attempt;
}
