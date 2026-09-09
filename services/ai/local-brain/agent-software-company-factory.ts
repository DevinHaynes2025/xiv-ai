/**
 * 62L-DA Agent Software Company Factory —
 * Agent-run sandbox software factory.
 * No self-promote / merge-to-prod; registration ≠ authority; no spend.
 */

import { readJsonFile, writeJsonFileAtomic, xivLocalPath } from './durable-json';
import {
  DA_LOCKS,
  HONESTY_BANNER,
  MAX_SOFTWARE_PRODUCTS,
  REGISTRATION_NOT_AUTHORITY,
  SOFTWARE_FACTORY_SELF_PROMOTE_DENIED,
  type DaActor,
} from './superbrain-runtime-kernel-types';

export type SoftwareProduct = {
  id: string;
  name: string;
  orgId: string;
  tenantId: string;
  universeId: string;
  sandboxed: true;
  registered: boolean;
  productionAuthority: false;
  promoted: boolean;
  mergedToProd: boolean;
  status: 'SANDBOXED' | 'REGISTERED' | 'UNPROMOTED' | 'DENIED' | 'CANDIDATE';
  reason: string;
  createdAt: string;
  updatedAt: string;
};

export type SoftwareFactoryResult = {
  accepted: boolean;
  reason: string;
  product?: SoftwareProduct;
  at: string;
};

type Store = { products: SoftwareProduct[] };

function storePath(root: string) {
  return xivLocalPath(root, 'agent-software-company-factory.json');
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

export function agentSoftwareCompanyFactoryHonesty() {
  return {
    banner: HONESTY_BANNER,
    selfPromote: DA_LOCKS.SOFTWARE_FACTORY_SELF_PROMOTE,
    mergeToProd: DA_LOCKS.SOFTWARE_FACTORY_MERGE_TO_PROD,
    registrationEqAuthority: DA_LOCKS.REGISTRATION_EQ_AUTHORITY,
  };
}

export async function registerSoftwareProduct(input: {
  name: string;
  orgId: string;
  tenantId: string;
  universeId: string;
  root: string;
  actor: DaActor;
}): Promise<SoftwareFactoryResult> {
  void input.actor;
  const store = await load(input.root);
  const now = new Date().toISOString();
  if (store.products.length >= MAX_SOFTWARE_PRODUCTS) {
    return { accepted: false, reason: 'MAX_SOFTWARE_PRODUCTS_BOUNDED', at: now };
  }
  const product: SoftwareProduct = {
    id: id('ascf'),
    name: input.name.trim() || 'sandbox-product',
    orgId: input.orgId,
    tenantId: input.tenantId,
    universeId: input.universeId,
    sandboxed: true,
    registered: true,
    productionAuthority: false,
    promoted: false,
    mergedToProd: false,
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

export async function requestSoftwareSelfPromoteOrMerge(input: {
  productId: string;
  action: 'self_promote' | 'merge_to_prod';
  root: string;
  actor: DaActor;
}): Promise<SoftwareFactoryResult> {
  void input.actor;
  const store = await load(input.root);
  const now = new Date().toISOString();
  const product = store.products.find((p) => p.id === input.productId);
  if (!product) {
    return { accepted: false, reason: 'SOFTWARE_PRODUCT_NOT_FOUND', at: now };
  }
  product.promoted = false;
  product.mergedToProd = false;
  product.productionAuthority = false;
  product.status = 'DENIED';
  product.reason = SOFTWARE_FACTORY_SELF_PROMOTE_DENIED;
  product.updatedAt = now;
  await save(input.root, store);
  return {
    accepted: false,
    reason: SOFTWARE_FACTORY_SELF_PROMOTE_DENIED,
    product,
    at: now,
  };
}
