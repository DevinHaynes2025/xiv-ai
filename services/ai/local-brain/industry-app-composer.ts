/**
 * 62L-DZ Module G — Industry App Composer.
 * Sandbox composition ≠ production deploy; app-pack self-promotion denied;
 * wedge-first behind supply-chain pilot.
 */

import { readJsonFile, writeJsonFileAtomic, xivLocalPath } from './durable-json';
import {
  APP_PACK_SELF_PROMOTION_DENIED,
  MAX_APP_COMPOSITIONS,
  SANDBOX_NEQ_PROD,
  WEDGE_FIRST_GATED,
  type DzActor,
} from './supply-chain-intelligence-fabric-types';

export type AppComposition = {
  id: string;
  packId: string;
  industry: string;
  sandboxOnly: true;
  productionDeployAuthorized: false;
  supplyChainPilotProven: boolean;
  status: 'sandboxed' | 'gated' | 'denied';
  reason: string;
  createdAt: string;
};

export type AppPackSelfPromotion = {
  id: string;
  packId: string;
  status: 'denied';
  reason: string;
  at: string;
};

export type WedgeGate = {
  id: string;
  supplyChainPilotProofPresent: boolean;
  attemptBroaderIndustry: boolean;
  status: 'allowed_pilot' | 'denied';
  reason: string;
  at: string;
};

type Store = {
  compositions: AppComposition[];
  promotions: AppPackSelfPromotion[];
  gates: WedgeGate[];
};

function storePath(root: string) {
  return xivLocalPath(root, 'industry-app-composer.json');
}

async function load(root: string): Promise<Store> {
  return readJsonFile<Store>(storePath(root), {
    compositions: [],
    promotions: [],
    gates: [],
  });
}

async function save(root: string, store: Store) {
  await writeJsonFileAtomic(storePath(root), store);
}

function id(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function industryAppComposerHonesty() {
  return {
    sandboxCompositionNeqProdDeploy: true,
    appPackSelfPromotionForbidden: true,
    wedgeFirstSupplyChainPilot: true,
    fakeGaClaimed: false,
  };
}

export async function composeIndustryApp(input: {
  packId: string;
  industry: string;
  supplyChainPilotProven: boolean;
  attemptProdDeploy?: boolean;
  root: string;
  actor: DzActor;
}): Promise<AppComposition> {
  const store = await load(input.root);
  void input.actor;
  if (store.compositions.length >= MAX_APP_COMPOSITIONS) {
    throw new Error('MAX_APP_COMPOSITIONS_REACHED');
  }
  const composition: AppComposition = {
    id: id('dziac'),
    packId: input.packId.trim(),
    industry: input.industry.trim(),
    sandboxOnly: true,
    productionDeployAuthorized: false,
    supplyChainPilotProven: input.supplyChainPilotProven,
    status: input.supplyChainPilotProven ? 'sandboxed' : 'gated',
    reason: input.attemptProdDeploy
      ? SANDBOX_NEQ_PROD
      : input.supplyChainPilotProven
        ? SANDBOX_NEQ_PROD
        : WEDGE_FIRST_GATED,
    createdAt: new Date().toISOString(),
  };
  store.compositions.push(composition);
  await save(input.root, store);
  return composition;
}

export async function attemptAppPackSelfPromotion(input: {
  packId: string;
  root: string;
  actor: DzActor;
}): Promise<AppPackSelfPromotion> {
  const store = await load(input.root);
  void input.actor;
  const attempt: AppPackSelfPromotion = {
    id: id('dzapsp'),
    packId: input.packId.trim(),
    status: 'denied',
    reason: APP_PACK_SELF_PROMOTION_DENIED,
    at: new Date().toISOString(),
  };
  store.promotions.push(attempt);
  await save(input.root, store);
  return attempt;
}

export async function evaluateWedgeFirstGate(input: {
  supplyChainPilotProofPresent: boolean;
  attemptBroaderIndustry: boolean;
  root: string;
  actor: DzActor;
}): Promise<WedgeGate> {
  const store = await load(input.root);
  void input.actor;
  const denied = !input.supplyChainPilotProofPresent;
  const gate: WedgeGate = {
    id: id('dzwig'),
    supplyChainPilotProofPresent: input.supplyChainPilotProofPresent,
    attemptBroaderIndustry: input.attemptBroaderIndustry,
    status: denied ? 'denied' : 'allowed_pilot',
    reason: denied ? WEDGE_FIRST_GATED : 'SUPPLY_CHAIN_PILOT_PROVEN',
    at: new Date().toISOString(),
  };
  store.gates.push(gate);
  await save(input.root, store);
  return gate;
}
