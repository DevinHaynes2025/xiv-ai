/**
 * 62L-CX Distributed Scientific Memory Fabric —
 * Scientific / business / technical memory products must be signed.
 * Raw private data is not globally pooled.
 */

import { readJsonFile, writeJsonFileAtomic, xivLocalPath } from './durable-json';
import {
  CX_LOCKS,
  HONESTY_BANNER,
  MAX_MEMORY_PRODUCTS,
  RAW_PRIVATE_GLOBAL_POOL_DENIED,
  UNSIGNED_MEMORY_PRODUCT_REJECTED,
  type CxActor,
  type MemoryProductKind,
} from './persistent-knowledge-civilization-types';

export type MemoryProduct = {
  id: string;
  kind: MemoryProductKind;
  label: string;
  signed: boolean;
  signatureRef: string | null;
  containsRawPrivate: boolean;
  globallyPooled: false;
  status: 'ACCEPTED' | 'REJECTED' | 'DENIED';
  reason: string;
  createdAt: string;
};

export type MemoryFabricResult = {
  accepted: boolean;
  reason: string;
  product?: MemoryProduct;
  at: string;
};

type Store = { products: MemoryProduct[]; poolAttempts: MemoryFabricResult[] };

function storePath(root: string) {
  return xivLocalPath(root, 'distributed-scientific-memory-fabric.json');
}

async function load(root: string): Promise<Store> {
  return readJsonFile<Store>(storePath(root), { products: [], poolAttempts: [] });
}

async function save(root: string, store: Store) {
  await writeJsonFileAtomic(storePath(root), store);
}

function id(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function scientificMemoryFabricHonesty() {
  return {
    banner: HONESTY_BANNER,
    requiresSignature: CX_LOCKS.MEMORY_PRODUCT_REQUIRES_SIGNATURE,
    unsignedAccepted: CX_LOCKS.UNSIGNED_MEMORY_PRODUCT_ACCEPTED,
    rawPrivateGlobalPooling: CX_LOCKS.RAW_PRIVATE_GLOBAL_POOLING,
  };
}

export async function publishMemoryProduct(input: {
  kind: MemoryProductKind;
  label: string;
  signed?: boolean;
  signatureRef?: string | null;
  containsRawPrivate?: boolean;
  root: string;
  actor: CxActor;
}): Promise<MemoryFabricResult> {
  void input.actor;
  const store = await load(input.root);
  const now = new Date().toISOString();
  if (store.products.length >= MAX_MEMORY_PRODUCTS) {
    return {
      accepted: false,
      reason: 'MAX_MEMORY_PRODUCTS_BOUNDED',
      at: now,
    };
  }

  const signed = input.signed === true && Boolean(input.signatureRef?.trim());
  if (!signed) {
    const product: MemoryProduct = {
      id: id('dsmf'),
      kind: input.kind,
      label: input.label.trim() || 'unnamed-product',
      signed: false,
      signatureRef: null,
      containsRawPrivate: input.containsRawPrivate === true,
      globallyPooled: false,
      status: 'REJECTED',
      reason: UNSIGNED_MEMORY_PRODUCT_REJECTED,
      createdAt: now,
    };
    store.products.push(product);
    await save(input.root, store);
    return {
      accepted: false,
      reason: UNSIGNED_MEMORY_PRODUCT_REJECTED,
      product,
      at: now,
    };
  }

  if (input.containsRawPrivate === true) {
    const denied = await attemptRawPrivateGlobalPool({
      label: input.label,
      root: input.root,
      actor: input.actor,
    });
    return denied;
  }

  const product: MemoryProduct = {
    id: id('dsmf'),
    kind: input.kind,
    label: input.label.trim() || 'unnamed-product',
    signed: true,
    signatureRef: input.signatureRef!.trim(),
    containsRawPrivate: false,
    globallyPooled: false,
    status: 'ACCEPTED',
    reason: 'SIGNED_MEMORY_PRODUCT_ACCEPTED_LOCAL_SCOPE',
    createdAt: now,
  };
  store.products.push(product);
  await save(input.root, store);
  return { accepted: true, reason: product.reason, product, at: now };
}

export async function attemptRawPrivateGlobalPool(input: {
  label: string;
  root: string;
  actor: CxActor;
}): Promise<MemoryFabricResult> {
  void input.actor;
  const store = await load(input.root);
  const now = new Date().toISOString();
  const product: MemoryProduct = {
    id: id('dsmf'),
    kind: 'technical',
    label: input.label.trim() || 'raw-private',
    signed: false,
    signatureRef: null,
    containsRawPrivate: true,
    globallyPooled: false,
    status: 'DENIED',
    reason: RAW_PRIVATE_GLOBAL_POOL_DENIED,
    createdAt: now,
  };
  const result: MemoryFabricResult = {
    accepted: false,
    reason: RAW_PRIVATE_GLOBAL_POOL_DENIED,
    product,
    at: now,
  };
  store.products.push(product);
  store.poolAttempts.push(result);
  await save(input.root, store);
  return result;
}
