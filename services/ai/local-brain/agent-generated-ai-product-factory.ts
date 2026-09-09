/**
 * 62L-CZ Agent-Generated AI Product Factory —
 * Agent-built AI product candidates with promotion gates.
 * Sandbox → gates; no self-production-promote; registration ≠ authority; no spend.
 */

import { readJsonFile, writeJsonFileAtomic, xivLocalPath } from './durable-json';
import {
  CZ_LOCKS,
  HONESTY_BANNER,
  MAX_PRODUCT_CANDIDATES,
  PRODUCT_FACTORY_SELF_PROMOTE_DENIED,
  REGISTRATION_NOT_AUTHORITY,
  ACCOUNTING_SCHEDULER_SPEND_DENIED,
  type CzActor,
} from './intelligence-civilization-kernel-types';

export type ProductCandidate = {
  id: string;
  name: string;
  orgId: string;
  tenantId: string;
  universeId: string;
  sandboxed: true;
  registered: boolean;
  productionAuthority: false;
  promoted: boolean;
  status: 'SANDBOXED' | 'REGISTERED' | 'UNPROMOTED' | 'DENIED' | 'CANDIDATE';
  reason: string;
  createdAt: string;
  updatedAt: string;
};

export type ProductFactoryResult = {
  accepted: boolean;
  reason: string;
  product?: ProductCandidate;
  at: string;
};

type Store = { products: ProductCandidate[] };

function storePath(root: string) {
  return xivLocalPath(root, 'agent-generated-ai-product-factory.json');
}

async function load(root: string): Promise<Store> {
  return readJsonFile<Store>(storePath(root), { products: [] });
}

async function save(root: string, store: Store) {
  await writeJsonFileAtomic(storePath(root), store);
}

function id(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function productFactoryHonesty() {
  return {
    banner: HONESTY_BANNER,
    selfPromote: CZ_LOCKS.PRODUCT_FACTORY_SELF_PROMOTE,
    registrationEqAuthority: CZ_LOCKS.REGISTRATION_EQ_AUTHORITY,
    spendEnabled: CZ_LOCKS.FACTORY_SPEND_ENABLED,
  };
}

export async function registerProductCandidate(input: {
  name: string;
  orgId: string;
  tenantId: string;
  universeId: string;
  root: string;
  actor: CzActor;
}): Promise<ProductFactoryResult> {
  void input.actor;
  const store = await load(input.root);
  const now = new Date().toISOString();
  if (store.products.length >= MAX_PRODUCT_CANDIDATES) {
    return { accepted: false, reason: 'MAX_PRODUCT_CANDIDATES_BOUNDED', at: now };
  }
  const product: ProductCandidate = {
    id: id('aprod'),
    name: input.name.trim(),
    orgId: input.orgId,
    tenantId: input.tenantId,
    universeId: input.universeId,
    sandboxed: true,
    registered: true,
    productionAuthority: false,
    promoted: false,
    status: 'REGISTERED',
    reason: REGISTRATION_NOT_AUTHORITY,
    createdAt: now,
    updatedAt: now,
  };
  store.products.push(product);
  await save(input.root, store);
  return {
    accepted: true,
    reason: REGISTRATION_NOT_AUTHORITY,
    product,
    at: now,
  };
}

/**
 * Self-production-promote is always DENIED. Registration is not authority.
 */
export async function requestProductSelfPromote(input: {
  productId: string;
  root: string;
  actor: CzActor;
}): Promise<ProductFactoryResult> {
  void input.actor;
  const store = await load(input.root);
  const now = new Date().toISOString();
  const product = store.products.find((p) => p.id === input.productId);
  if (!product) {
    return { accepted: false, reason: 'PRODUCT_NOT_FOUND', at: now };
  }
  product.promoted = false;
  product.productionAuthority = false;
  product.status = 'DENIED';
  product.reason = PRODUCT_FACTORY_SELF_PROMOTE_DENIED;
  product.updatedAt = now;
  await save(input.root, store);
  return {
    accepted: false,
    reason: PRODUCT_FACTORY_SELF_PROMOTE_DENIED,
    product,
    at: now,
  };
}

export async function attemptFactorySpend(input: {
  productId: string;
  amount: number;
  root: string;
  actor: CzActor;
}): Promise<{ accepted: false; reason: string; at: string }> {
  void input.actor;
  void input.productId;
  void input.amount;
  void input.root;
  return {
    accepted: false,
    reason: ACCOUNTING_SCHEDULER_SPEND_DENIED,
    at: new Date().toISOString(),
  };
}
