/**
 * 62L-DC Autonomous AI Product Studio Network —
 * Isolated AI Product Studios.
 * Registration ≠ authority; no self-promote to production.
 */

import { readJsonFile, writeJsonFileAtomic, xivLocalPath } from './durable-json';
import {
  DC_LOCKS,
  HONESTY_BANNER,
  MAX_PRODUCT_STUDIOS,
  STUDIO_SELF_PROMOTION_DENIED,
  type DcActor,
} from './superbrain-service-fabric-types';

export type StudioLifecycle =
  | 'registered'
  | 'isolated'
  | 'sandbox'
  | 'gated'
  | 'approved_candidate'
  | 'unpromoted'
  | 'denied';

export type AiProductStudio = {
  id: string;
  name: string;
  productKey: string;
  lifecycle: StudioLifecycle;
  isolated: true;
  sandboxPassed: boolean;
  securityGatePassed: boolean;
  reviewGatePassed: boolean;
  authorityGranted: false;
  productionAuthorized: false;
  reason: string;
  createdAt: string;
  updatedAt: string;
};

export type StudioResult = {
  accepted: boolean;
  reason: string;
  studio?: AiProductStudio;
  at: string;
};

type Store = { studios: AiProductStudio[] };

function storePath(root: string) {
  return xivLocalPath(root, 'autonomous-ai-product-studio-network.json');
}

async function load(root: string): Promise<Store> {
  return readJsonFile<Store>(storePath(root), { studios: [] });
}

async function save(root: string, store: Store) {
  await writeJsonFileAtomic(storePath(root), store);
}

function id(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function aiProductStudioNetworkHonesty() {
  return {
    banner: HONESTY_BANNER,
    isolated: DC_LOCKS.STUDIO_ISOLATED,
    selfPromotionToProduction: DC_LOCKS.STUDIO_SELF_PROMOTION_TO_PRODUCTION,
    productionAuthorization: DC_LOCKS.PRODUCTION_AUTHORIZATION,
  };
}

export async function registerAiProductStudio(input: {
  name: string;
  productKey: string;
  root: string;
  actor: DcActor;
}): Promise<StudioResult> {
  void input.actor;
  const store = await load(input.root);
  const now = new Date().toISOString();
  if (store.studios.length >= MAX_PRODUCT_STUDIOS) {
    return { accepted: false, reason: 'MAX_PRODUCT_STUDIOS_BOUNDED', at: now };
  }
  const studio: AiProductStudio = {
    id: id('aaps'),
    name: input.name.trim() || 'unnamed-studio',
    productKey: input.productKey.trim().toLowerCase(),
    lifecycle: 'isolated',
    isolated: true,
    sandboxPassed: false,
    securityGatePassed: false,
    reviewGatePassed: false,
    authorityGranted: false,
    productionAuthorized: false,
    reason: 'AI_PRODUCT_STUDIO_ISOLATED_NO_AUTHORITY',
    createdAt: now,
    updatedAt: now,
  };
  store.studios.push(studio);
  await save(input.root, store);
  return {
    accepted: true,
    reason: studio.reason,
    studio,
    at: now,
  };
}

export async function advanceAiProductStudioGates(input: {
  studioId: string;
  sandboxPassed?: boolean;
  securityGatePassed?: boolean;
  reviewGatePassed?: boolean;
  root: string;
  actor: DcActor;
}): Promise<StudioResult> {
  void input.actor;
  const store = await load(input.root);
  const studio = store.studios.find((s) => s.id === input.studioId);
  const now = new Date().toISOString();
  if (!studio) {
    return { accepted: false, reason: 'AI_PRODUCT_STUDIO_NOT_FOUND', at: now };
  }
  if (input.sandboxPassed === true) studio.sandboxPassed = true;
  if (input.securityGatePassed === true) studio.securityGatePassed = true;
  if (input.reviewGatePassed === true) studio.reviewGatePassed = true;
  studio.updatedAt = now;
  if (studio.sandboxPassed && studio.securityGatePassed && studio.reviewGatePassed) {
    studio.lifecycle = 'approved_candidate';
    studio.reason = 'STUDIO_GATES_PASSED_CANDIDATE_NOT_PRODUCTION';
  } else {
    studio.lifecycle = 'gated';
    studio.reason = 'AWAITING_REMAINING_STUDIO_GATES';
  }
  studio.authorityGranted = false;
  studio.productionAuthorized = false;
  studio.isolated = true;
  await save(input.root, store);
  return { accepted: true, reason: studio.reason, studio, at: now };
}

export async function attemptStudioSelfPromotion(input: {
  studioId: string;
  root: string;
  actor: DcActor;
}): Promise<StudioResult> {
  void input.actor;
  const store = await load(input.root);
  const studio = store.studios.find((s) => s.id === input.studioId);
  const now = new Date().toISOString();
  if (!studio) {
    return { accepted: false, reason: 'AI_PRODUCT_STUDIO_NOT_FOUND', at: now };
  }
  studio.lifecycle = 'unpromoted';
  studio.productionAuthorized = false;
  studio.authorityGranted = false;
  studio.isolated = true;
  studio.reason = STUDIO_SELF_PROMOTION_DENIED;
  studio.updatedAt = now;
  await save(input.root, store);
  return {
    accepted: false,
    reason: STUDIO_SELF_PROMOTION_DENIED,
    studio,
    at: now,
  };
}
