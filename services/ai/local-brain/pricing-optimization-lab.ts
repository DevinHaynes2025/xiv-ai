/**
 * 62L-DT Module D — Pricing Optimization Lab.
 * Experiments / bundle design ≠ auto-price or auto-bill.
 */

import { readJsonFile, writeJsonFileAtomic, xivLocalPath } from './durable-json';
import {
  BUNDLE_NEQ_AUTO_BILL,
  MAX_PRICING_EXPERIMENTS,
  PRICING_NEQ_AUTO_PRICE,
  type DtActor,
} from './growth-operating-system-types';

export type PricingExperiment = {
  id: string;
  name: string;
  hypothesis: string;
  autoPriced: false;
  autoBilled: false;
  status: 'lab_only' | 'denied';
  reason: string;
  createdAt: string;
};

export type BundleDesign = {
  id: string;
  name: string;
  components: string[];
  autoBilled: false;
  autoPriced: false;
  status: 'design_only' | 'denied';
  reason: string;
  createdAt: string;
};

type Store = {
  experiments: PricingExperiment[];
  bundles: BundleDesign[];
};

function storePath(root: string) {
  return xivLocalPath(root, 'pricing-optimization-lab.json');
}

async function load(root: string): Promise<Store> {
  return readJsonFile<Store>(storePath(root), { experiments: [], bundles: [] });
}

async function save(root: string, store: Store) {
  await writeJsonFileAtomic(storePath(root), store);
}

function id(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function pricingOptimizationLabHonesty() {
  return {
    pricingExperimentAutoPrice: false,
    bundleDesignAutoBill: false,
    recommendationEqPayment: false,
  };
}

export async function createPricingExperiment(input: {
  name: string;
  hypothesis: string;
  attemptAutoPrice?: boolean;
  root: string;
  actor: DtActor;
}): Promise<PricingExperiment> {
  const store = await load(input.root);
  void input.actor;
  if (store.experiments.length >= MAX_PRICING_EXPERIMENTS) {
    throw new Error('MAX_PRICING_EXPERIMENTS_REACHED');
  }
  const experiment: PricingExperiment = {
    id: id('dtprice'),
    name: input.name.trim(),
    hypothesis: input.hypothesis.trim(),
    autoPriced: false,
    autoBilled: false,
    status: input.attemptAutoPrice ? 'denied' : 'lab_only',
    reason: input.attemptAutoPrice ? PRICING_NEQ_AUTO_PRICE : PRICING_NEQ_AUTO_PRICE,
    createdAt: new Date().toISOString(),
  };
  store.experiments.push(experiment);
  await save(input.root, store);
  return experiment;
}

export async function designBundle(input: {
  name: string;
  components: string[];
  attemptAutoBill?: boolean;
  root: string;
  actor: DtActor;
}): Promise<BundleDesign> {
  const store = await load(input.root);
  void input.actor;
  const bundle: BundleDesign = {
    id: id('dtbundle'),
    name: input.name.trim(),
    components: input.components.map((c) => c.trim()).filter(Boolean),
    autoBilled: false,
    autoPriced: false,
    status: input.attemptAutoBill ? 'denied' : 'design_only',
    reason: input.attemptAutoBill ? BUNDLE_NEQ_AUTO_BILL : BUNDLE_NEQ_AUTO_BILL,
    createdAt: new Date().toISOString(),
  };
  store.bundles.push(bundle);
  await save(input.root, store);
  return bundle;
}
