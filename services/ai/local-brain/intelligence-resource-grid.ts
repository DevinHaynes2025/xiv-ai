/**
 * 62L-CJ Intelligence Resource Grid — placement/accounting across CPU/GPU/NPU,
 * memory, storage, network, model calls, queues, knowledge freshness.
 * Placement/accounting ≠ purchasing/billing/spend authority.
 */

import { readJsonFile, writeJsonFileAtomic, xivLocalPath } from './durable-json';
import {
  CJ_LOCKS,
  GRID_SPEND_DENIED,
  HONESTY_BANNER,
  type CjActor,
} from './intelligence-resource-grid-apprenticeship-types';

export type ResourceKind =
  | 'cpu'
  | 'gpu'
  | 'npu'
  | 'memory'
  | 'storage'
  | 'network'
  | 'model_call'
  | 'queue'
  | 'knowledge_freshness';

export type ResourceAccount = {
  id: string;
  kind: ResourceKind;
  unitsAvailable: number;
  unitsReserved: number;
  freshnessLabel: 'fresh' | 'stale' | 'waiting_data' | 'unknown';
  at: string;
};

export type PlacementPlan = {
  id: string;
  workloadId: string;
  placements: Array<{ kind: ResourceKind; units: number }>;
  accounted: true;
  purchaseAttempted: boolean;
  billAttempted: boolean;
  spendAttempted: boolean;
  accepted: boolean;
  reason: string;
  productionAuthorized: false;
  at: string;
};

type Store = {
  accounts: ResourceAccount[];
  plans: PlacementPlan[];
  denials: Array<{ id: string; at: string; reason: string }>;
};

function storePath(root: string) {
  return xivLocalPath(root, 'intelligence-resource-grid.json');
}

async function load(root: string): Promise<Store> {
  return readJsonFile<Store>(storePath(root), {
    accounts: [],
    plans: [],
    denials: [],
  });
}

async function save(root: string, store: Store) {
  await writeJsonFileAtomic(storePath(root), store);
}

function id(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function resourceGridHonesty() {
  return {
    banner: HONESTY_BANNER,
    l4AutonomyEnabled: CJ_LOCKS.L4_AUTONOMY_ENABLED,
    autonomousSpending: CJ_LOCKS.AUTONOMOUS_SPENDING,
    purchaseAuthority: CJ_LOCKS.PURCHASE_AUTHORITY,
    billingAuthority: CJ_LOCKS.BILLING_AUTHORITY,
    resourceGridIsSpend: CJ_LOCKS.RESOURCE_GRID_IS_SPEND,
    placementAccountingOnly: CJ_LOCKS.RESOURCE_GRID_PLACEMENT_ACCOUNTING_ONLY,
  };
}

export async function registerResourceAccount(input: {
  kind: ResourceKind;
  unitsAvailable: number;
  freshnessLabel?: ResourceAccount['freshnessLabel'];
  root: string;
}): Promise<ResourceAccount> {
  const store = await load(input.root);
  const account: ResourceAccount = {
    id: id('racct'),
    kind: input.kind,
    unitsAvailable: Math.max(0, input.unitsAvailable),
    unitsReserved: 0,
    freshnessLabel: input.freshnessLabel ?? 'unknown',
    at: new Date().toISOString(),
  };
  store.accounts.push(account);
  await save(input.root, store);
  return account;
}

export async function placeAndAccountWorkload(input: {
  workloadId: string;
  placements: Array<{ kind: ResourceKind; units: number }>;
  root: string;
  actor: CjActor;
  /** Hard-deny probes — grid has no spend/purchase/bill authority. */
  attemptPurchase?: boolean;
  attemptBill?: boolean;
  attemptSpend?: boolean;
}): Promise<PlacementPlan> {
  const store = await load(input.root);
  const now = new Date().toISOString();
  const spendProbe =
    input.attemptPurchase === true ||
    input.attemptBill === true ||
    input.attemptSpend === true;

  if (spendProbe) {
    const denial = {
      id: id('deny'),
      at: now,
      reason: GRID_SPEND_DENIED,
    };
    store.denials.push(denial);
    const plan: PlacementPlan = {
      id: id('place'),
      workloadId: input.workloadId,
      placements: input.placements,
      accounted: true,
      purchaseAttempted: input.attemptPurchase === true,
      billAttempted: input.attemptBill === true,
      spendAttempted: input.attemptSpend === true,
      accepted: false,
      reason: GRID_SPEND_DENIED,
      productionAuthorized: false,
      at: now,
    };
    store.plans.push(plan);
    await save(input.root, store);
    return plan;
  }

  for (const p of input.placements) {
    const acct = store.accounts.find((a) => a.kind === p.kind);
    if (!acct || acct.unitsAvailable - acct.unitsReserved < p.units) {
      const plan: PlacementPlan = {
        id: id('place'),
        workloadId: input.workloadId,
        placements: input.placements,
        accounted: true,
        purchaseAttempted: false,
        billAttempted: false,
        spendAttempted: false,
        accepted: false,
        reason: 'RESOURCE_CAPACITY_UNAVAILABLE',
        productionAuthorized: false,
        at: now,
      };
      store.plans.push(plan);
      await save(input.root, store);
      return plan;
    }
  }

  for (const p of input.placements) {
    const acct = store.accounts.find((a) => a.kind === p.kind)!;
    acct.unitsReserved += p.units;
  }

  const plan: PlacementPlan = {
    id: id('place'),
    workloadId: input.workloadId,
    placements: input.placements,
    accounted: true,
    purchaseAttempted: false,
    billAttempted: false,
    spendAttempted: false,
    accepted: true,
    reason: 'PLACEMENT_ACCOUNTED_NO_SPEND_AUTHORITY',
    productionAuthorized: false,
    at: now,
  };
  store.plans.push(plan);
  await save(input.root, store);
  return plan;
}
