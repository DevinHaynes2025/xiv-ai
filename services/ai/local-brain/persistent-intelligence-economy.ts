/**
 * 62L-CI Persistent Intelligence Economy —
 * Internal resource accounting for compute/memory/storage/model calls.
 * Proxies/ledgers only — no spend, purchase, or billing authority.
 */

import { readJsonFile, writeJsonFileAtomic, xivLocalPath } from './durable-json';
import {
  CI_LOCKS,
  ECONOMY_SPEND_DENIED,
  HONESTY_BANNER,
  type CiActor,
  type ResourceKind,
} from './persistent-intelligence-economy-types';

export type ResourceAccount = {
  id: string;
  orgId: string;
  tenantId: string;
  balances: Record<ResourceKind, number>;
  spendAuthority: false;
  purchaseAuthority: false;
  billingAuthority: false;
  createdAt: string;
  updatedAt: string;
};

export type ResourceLedgerEntry = {
  id: string;
  accountId: string;
  kind: ResourceKind;
  delta: number;
  reason: string;
  at: string;
};

export type EconomyActionResult = {
  accepted: boolean;
  reason: string;
  account?: ResourceAccount;
  at: string;
};

type Store = {
  accounts: ResourceAccount[];
  entries: ResourceLedgerEntry[];
};

function storePath(root: string) {
  return xivLocalPath(root, 'persistent-intelligence-economy.json');
}

async function load(root: string): Promise<Store> {
  return readJsonFile<Store>(storePath(root), { accounts: [], entries: [] });
}

async function save(root: string, store: Store) {
  await writeJsonFileAtomic(storePath(root), store);
}

function id(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function economyHonesty() {
  return {
    banner: HONESTY_BANNER,
    l4AutonomyEnabled: CI_LOCKS.L4_AUTONOMY_ENABLED,
    autonomousSpending: CI_LOCKS.AUTONOMOUS_SPENDING,
    purchaseAuthority: CI_LOCKS.PURCHASE_AUTHORITY,
    billingAuthority: CI_LOCKS.BILLING_AUTHORITY,
    resourceAccountingIsSpend: CI_LOCKS.RESOURCE_ACCOUNTING_IS_SPEND,
    productionAuthorization: CI_LOCKS.PRODUCTION_AUTHORIZATION,
  };
}

export async function openResourceAccount(input: {
  orgId: string;
  tenantId: string;
  initial?: Partial<Record<ResourceKind, number>>;
  root: string;
  actor: CiActor;
}): Promise<EconomyActionResult> {
  const store = await load(input.root);
  const now = new Date().toISOString();
  const account: ResourceAccount = {
    id: id('econ'),
    orgId: input.orgId,
    tenantId: input.tenantId,
    balances: {
      compute: input.initial?.compute ?? 0,
      memory: input.initial?.memory ?? 0,
      storage: input.initial?.storage ?? 0,
      model_calls: input.initial?.model_calls ?? 0,
    },
    spendAuthority: false,
    purchaseAuthority: false,
    billingAuthority: false,
    createdAt: now,
    updatedAt: now,
  };
  store.accounts.push(account);
  await save(input.root, store);
  return { accepted: true, reason: 'RESOURCE_ACCOUNT_OPENED_LEDGER_ONLY', account, at: now };
}

export async function recordResourceUsage(input: {
  accountId: string;
  kind: ResourceKind;
  units: number;
  reason: string;
  root: string;
  actor: CiActor;
}): Promise<EconomyActionResult> {
  const store = await load(input.root);
  const account = store.accounts.find((a) => a.id === input.accountId);
  if (!account) {
    return { accepted: false, reason: 'ACCOUNT_NOT_FOUND', at: new Date().toISOString() };
  }
  const now = new Date().toISOString();
  account.balances[input.kind] = (account.balances[input.kind] ?? 0) + Math.max(0, input.units);
  account.updatedAt = now;
  store.entries.push({
    id: id('entry'),
    accountId: account.id,
    kind: input.kind,
    delta: Math.max(0, input.units),
    reason: input.reason,
    at: now,
  });
  await save(input.root, store);
  return { accepted: true, reason: 'RESOURCE_USAGE_RECORDED', account, at: now };
}

/** Spend / purchase / bill are always DENIED — accounting is not authority. */
export async function attemptSpendPurchaseOrBill(input: {
  accountId: string;
  action: 'spend' | 'purchase' | 'bill';
  amount: number;
  root: string;
  actor: CiActor;
}): Promise<EconomyActionResult> {
  void input.amount;
  void input.actor;
  const store = await load(input.root);
  const account = store.accounts.find((a) => a.id === input.accountId);
  const now = new Date().toISOString();
  if (account) {
    // Harden: never flip authority flags
    account.spendAuthority = false;
    account.purchaseAuthority = false;
    account.billingAuthority = false;
    account.updatedAt = now;
    await save(input.root, store);
  }
  return {
    accepted: false,
    reason: ECONOMY_SPEND_DENIED,
    account,
    at: now,
  };
}
