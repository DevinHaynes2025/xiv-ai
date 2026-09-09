/**
 * 62L-DR Revenue Command Center — CRO-oriented revenue surfaces/contracts.
 * Recommendation-only; close/charge/deploy require founder gates.
 */

import { readJsonFile, writeJsonFileAtomic, xivLocalPath } from './durable-json';
import {
  DR_LOCKS,
  HONESTY_BANNER,
  type DrActor,
} from './enterprise-nervous-revenue-command-types';

export type RevenuePipelineStage =
  | 'prospect'
  | 'qualify'
  | 'propose'
  | 'negotiate'
  | 'commit_pending_founder'
  | 'won_advisory'
  | 'lost';

export type RevenueCommandSurface = {
  id: string;
  orgId: string;
  tenantId: string;
  stage: RevenuePipelineStage;
  dealLabel: string;
  recommendationOnly: true;
  executableClose: false;
  productionAuthorized: false;
  createdAt: string;
};

type Store = { surfaces: RevenueCommandSurface[] };

function storePath(root: string) {
  return xivLocalPath(root, 'revenue-command-center.json');
}

async function load(root: string): Promise<Store> {
  return readJsonFile<Store>(storePath(root), { surfaces: [] });
}

async function save(root: string, store: Store) {
  await writeJsonFileAtomic(storePath(root), store);
}

function id(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function revenueCommandCenterHonesty() {
  return {
    banner: HONESTY_BANNER,
    recommendationEqCloseDeal: DR_LOCKS.RECOMMENDATION_EQ_CLOSE_DEAL,
    l4AutonomyEnabled: DR_LOCKS.L4_AUTONOMY_ENABLED,
    productionAuthorization: DR_LOCKS.PRODUCTION_AUTHORIZATION,
  };
}

export async function openRevenueCommandSurface(input: {
  dealLabel: string;
  stage?: RevenuePipelineStage;
  root: string;
  actor: DrActor;
}): Promise<RevenueCommandSurface> {
  const store = await load(input.root);
  void input.actor;
  const surface: RevenueCommandSurface = {
    id: id('rcc'),
    orgId: input.actor.orgId,
    tenantId: input.actor.tenantId,
    stage: input.stage ?? 'prospect',
    dealLabel: input.dealLabel,
    recommendationOnly: true,
    executableClose: false,
    productionAuthorized: false,
    createdAt: new Date().toISOString(),
  };
  store.surfaces.push(surface);
  await save(input.root, store);
  return surface;
}

export async function listRevenueSurfaces(root: string): Promise<RevenueCommandSurface[]> {
  const store = await load(root);
  return store.surfaces;
}
