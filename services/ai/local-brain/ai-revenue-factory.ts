/**
 * 62L-DT Module A — Growth Operating System / AI Revenue Factory.
 * Acquisition pipeline controls; recommend ≠ charge.
 */

import { readJsonFile, writeJsonFileAtomic, xivLocalPath } from './durable-json';
import {
  MAX_PIPELINE_ITEMS,
  RECOMMEND_NEQ_CHARGE,
  UNCONFIGURED_PROVIDER_UNAVAILABLE,
  type DtActor,
} from './growth-operating-system-types';

export type AcquisitionRecommendation = {
  id: string;
  channel: string;
  segment: string;
  action: 'recommend';
  chargesCustomer: false;
  deploysSpend: false;
  signsContract: false;
  status: 'recommendation_only';
  reason: string;
  createdAt: string;
};

export type RevenueProviderProbe = {
  providerId: string;
  configured: boolean;
  availability: 'AVAILABLE' | 'UNAVAILABLE';
  status: 'ok' | 'denied';
  reason: string;
  at: string;
};

type Store = {
  recommendations: AcquisitionRecommendation[];
  providerProbes: RevenueProviderProbe[];
};

function storePath(root: string) {
  return xivLocalPath(root, 'ai-revenue-factory.json');
}

async function load(root: string): Promise<Store> {
  return readJsonFile<Store>(storePath(root), { recommendations: [], providerProbes: [] });
}

async function save(root: string, store: Store) {
  await writeJsonFileAtomic(storePath(root), store);
}

function id(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function aiRevenueFactoryHonesty() {
  return {
    recommendEqCharge: false,
    recommendEqSpend: false,
    recommendEqContract: false,
    l4AutonomyEnabled: false,
    unconfiguredProviderInventedAvailable: false,
  };
}

export async function recommendAcquisitionAction(input: {
  channel: string;
  segment: string;
  attemptCharge?: boolean;
  attemptSpend?: boolean;
  attemptSign?: boolean;
  root: string;
  actor: DtActor;
}): Promise<AcquisitionRecommendation> {
  const store = await load(input.root);
  void input.actor;
  if (store.recommendations.length >= MAX_PIPELINE_ITEMS) {
    throw new Error('MAX_PIPELINE_ITEMS_REACHED');
  }
  const recommendation: AcquisitionRecommendation = {
    id: id('dtrev'),
    channel: input.channel.trim(),
    segment: input.segment.trim(),
    action: 'recommend',
    chargesCustomer: false,
    deploysSpend: false,
    signsContract: false,
    status: 'recommendation_only',
    reason:
      input.attemptCharge || input.attemptSpend || input.attemptSign
        ? RECOMMEND_NEQ_CHARGE
        : RECOMMEND_NEQ_CHARGE,
    createdAt: new Date().toISOString(),
  };
  store.recommendations.push(recommendation);
  await save(input.root, store);
  return recommendation;
}

export async function probeRevenueProvider(input: {
  providerId: string;
  configured: boolean;
  claimAvailable?: boolean;
  root: string;
  actor: DtActor;
}): Promise<RevenueProviderProbe> {
  const store = await load(input.root);
  void input.actor;
  const probe: RevenueProviderProbe = input.configured
    ? {
        providerId: input.providerId,
        configured: true,
        availability: 'AVAILABLE',
        status: 'ok',
        reason: 'REVENUE_PROVIDER_CONFIGURED_NOT_PRODUCTION_AUTHORIZED',
        at: new Date().toISOString(),
      }
    : {
        providerId: input.providerId,
        configured: false,
        availability: 'UNAVAILABLE',
        status: 'denied',
        reason: UNCONFIGURED_PROVIDER_UNAVAILABLE,
        at: new Date().toISOString(),
      };
  if (!input.configured && input.claimAvailable) {
    probe.status = 'denied';
    probe.availability = 'UNAVAILABLE';
    probe.reason = UNCONFIGURED_PROVIDER_UNAVAILABLE;
  }
  store.providerProbes.push(probe);
  await save(input.root, store);
  return probe;
}
