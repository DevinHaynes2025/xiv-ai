/**
 * 62L-DD Autonomous AI Venture Studio System —
 * AI venture studios building sandbox product candidates only.
 * No self-promote to production.
 */

import { readJsonFile, writeJsonFileAtomic, xivLocalPath } from './durable-json';
import {
  DD_LOCKS,
  HONESTY_BANNER,
  MAX_VENTURE_PRODUCTS,
  VENTURE_SELF_PROMOTION_DENIED,
  type DdActor,
} from './cognitive-service-mesh-types';

export type VentureLifecycle =
  | 'registered'
  | 'sandbox'
  | 'gated'
  | 'approved_candidate'
  | 'unpromoted'
  | 'denied';

export type VentureProduct = {
  id: string;
  studioId: string;
  name: string;
  lifecycle: VentureLifecycle;
  sandboxCandidate: true;
  productionAuthorized: false;
  authorityGranted: false;
  reason: string;
  createdAt: string;
  updatedAt: string;
};

type Store = { products: VentureProduct[] };

function storePath(root: string) {
  return xivLocalPath(root, 'autonomous-ai-venture-studio-system.json');
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

export function ventureStudioHonesty() {
  return {
    banner: HONESTY_BANNER,
    sandboxCandidatesOnly: DD_LOCKS.VENTURE_SANDBOX_CANDIDATES_ONLY,
    selfPromotionToProduction: DD_LOCKS.VENTURE_SELF_PROMOTION_TO_PRODUCTION,
    productionAuthorization: DD_LOCKS.PRODUCTION_AUTHORIZATION,
  };
}

export async function registerVentureSandboxProduct(input: {
  studioId: string;
  name: string;
  root: string;
  actor: DdActor;
}): Promise<{ accepted: boolean; reason: string; product?: VentureProduct; at: string }> {
  void input.actor;
  const store = await load(input.root);
  const now = new Date().toISOString();
  if (store.products.length >= MAX_VENTURE_PRODUCTS) {
    return { accepted: false, reason: 'MAX_VENTURE_PRODUCTS_BOUNDED', at: now };
  }
  const product: VentureProduct = {
    id: id('aavs'),
    studioId: input.studioId.trim(),
    name: input.name.trim() || 'unnamed-venture',
    lifecycle: 'sandbox',
    sandboxCandidate: true,
    productionAuthorized: false,
    authorityGranted: false,
    reason: 'VENTURE_PRODUCT_REGISTERED_SANDBOX_CANDIDATE_ONLY',
    createdAt: now,
    updatedAt: now,
  };
  store.products.push(product);
  await save(input.root, store);
  return { accepted: true, reason: product.reason, product, at: now };
}

export async function advanceVentureGates(input: {
  productId: string;
  sandboxPassed?: boolean;
  securityGatePassed?: boolean;
  reviewGatePassed?: boolean;
  root: string;
  actor: DdActor;
}): Promise<{ accepted: boolean; reason: string; product?: VentureProduct; at: string }> {
  void input.actor;
  const store = await load(input.root);
  const now = new Date().toISOString();
  const product = store.products.find((p) => p.id === input.productId);
  if (!product) {
    return { accepted: false, reason: 'VENTURE_PRODUCT_NOT_FOUND', at: now };
  }
  const gates =
    input.sandboxPassed === true &&
    input.securityGatePassed === true &&
    input.reviewGatePassed === true;
  product.lifecycle = gates ? 'approved_candidate' : 'gated';
  product.updatedAt = now;
  product.reason = gates
    ? 'VENTURE_PRODUCT_APPROVED_CANDIDATE_NOT_PRODUCTION'
    : 'VENTURE_PRODUCT_GATED_SANDBOX';
  await save(input.root, store);
  return { accepted: true, reason: product.reason, product, at: now };
}

export async function attemptVentureSelfPromotion(input: {
  productId: string;
  root: string;
  actor: DdActor;
}): Promise<{ accepted: boolean; reason: string; product?: VentureProduct; at: string }> {
  void input.actor;
  const store = await load(input.root);
  const now = new Date().toISOString();
  const product = store.products.find((p) => p.id === input.productId);
  if (!product) {
    return { accepted: false, reason: 'VENTURE_PRODUCT_NOT_FOUND', at: now };
  }
  product.lifecycle = 'denied';
  product.productionAuthorized = false;
  product.authorityGranted = false;
  product.updatedAt = now;
  product.reason = VENTURE_SELF_PROMOTION_DENIED;
  await save(input.root, store);
  return { accepted: false, reason: VENTURE_SELF_PROMOTION_DENIED, product, at: now };
}
