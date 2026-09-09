/**
 * 62L-DK Business Media & Supply Chain Foundation —
 * Opt-in business media/community; adult 18+ where applicable;
 * recommendation ≠ publish/charge.
 * Supply-chain provenance-aware; forecast ≠ fact.
 */

import { readJsonFile, writeJsonFileAtomic, xivLocalPath } from './durable-json';
import {
  ADULT_MIN_AGE_YEARS,
  BUSINESS_MEDIA_OPT_IN_DENIED,
  DK_LOCKS,
  HONESTY_BANNER,
  MAX_MEDIA_SHARES,
  MAX_SUPPLY_FORECASTS,
  SUPPLY_CHAIN_FORECAST_NOT_FACT,
  type DkActor,
} from './unified-intelligence-experience-os-types';

export type BusinessMediaSupplyChainFoundation = {
  id: string;
  orgId: string;
  tenantId: string;
  universeId: string;
  optInRequired: true;
  adult18PlusRequired: true;
  createdAt: string;
};

export type BusinessMediaShare = {
  id: string;
  foundationId: string;
  contentRef: string;
  optIn: boolean;
  declaredAgeYears: number | null;
  recommendationOnly: boolean;
  publishAttempted: boolean;
  chargeAttempted: boolean;
  status: 'SHARED' | 'DENIED' | 'RECOMMENDATION_ONLY';
  reason: string;
  createdAt: string;
};

export type SupplyChainForecast = {
  id: string;
  foundationId: string;
  skuOrLane: string;
  provenanceRef: string | null;
  label: 'LABELED_FORECAST' | 'PROBABILISTIC' | 'DENIED';
  labeledVerifiedFact: false;
  status: 'ACCEPTED' | 'DENIED';
  reason: string;
  createdAt: string;
};

type Store = {
  foundations: BusinessMediaSupplyChainFoundation[];
  shares: BusinessMediaShare[];
  forecasts: SupplyChainForecast[];
};

function storePath(root: string) {
  return xivLocalPath(root, 'business-media-supply-chain-foundation.json');
}

async function load(root: string): Promise<Store> {
  return readJsonFile<Store>(storePath(root), {
    foundations: [],
    shares: [],
    forecasts: [],
  });
}

async function save(root: string, store: Store) {
  await writeJsonFileAtomic(storePath(root), store);
}

function id(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function businessMediaSupplyChainHonesty() {
  return {
    banner: HONESTY_BANNER,
    businessMediaShareWithoutOptIn: DK_LOCKS.BUSINESS_MEDIA_SHARE_WITHOUT_OPT_IN,
    businessMediaOptInRequired: DK_LOCKS.BUSINESS_MEDIA_OPT_IN_REQUIRED,
    adult18PlusRequired: DK_LOCKS.ADULT_18_PLUS_REQUIRED,
    recommendationEqPublish: DK_LOCKS.RECOMMENDATION_EQ_PUBLISH,
    recommendationEqCharge: DK_LOCKS.RECOMMENDATION_EQ_CHARGE,
    supplyChainForecastLabeledVerifiedFact:
      DK_LOCKS.SUPPLY_CHAIN_FORECAST_LABELED_VERIFIED_FACT,
    supplyChainForecastNeqFact: DK_LOCKS.SUPPLY_CHAIN_FORECAST_NEQ_FACT,
    supplyChainProvenanceAware: DK_LOCKS.SUPPLY_CHAIN_PROVENANCE_AWARE,
  };
}

export async function bootstrapBusinessMediaSupplyChainFoundation(input: {
  orgId: string;
  tenantId: string;
  universeId: string;
  root: string;
  actor: DkActor;
}): Promise<BusinessMediaSupplyChainFoundation> {
  void input.actor;
  const store = await load(input.root);
  const existing = store.foundations.find(
    (f) =>
      f.orgId === input.orgId &&
      f.tenantId === input.tenantId &&
      f.universeId === input.universeId,
  );
  if (existing) return existing;
  const foundation: BusinessMediaSupplyChainFoundation = {
    id: id('dkbiz'),
    orgId: input.orgId,
    tenantId: input.tenantId,
    universeId: input.universeId,
    optInRequired: true,
    adult18PlusRequired: true,
    createdAt: new Date().toISOString(),
  };
  store.foundations.push(foundation);
  await save(input.root, store);
  return foundation;
}

export async function shareBusinessMedia(input: {
  foundationId: string;
  contentRef: string;
  optIn: boolean;
  declaredAgeYears?: number;
  publish?: boolean;
  charge?: boolean;
  recommendationOnly?: boolean;
  root: string;
  actor: DkActor;
}): Promise<{ accepted: boolean; reason: string; share?: BusinessMediaShare; at: string }> {
  void input.actor;
  const store = await load(input.root);
  const now = new Date().toISOString();
  const foundation = store.foundations.find((f) => f.id === input.foundationId);
  if (!foundation) return { accepted: false, reason: 'FOUNDATION_NOT_FOUND', at: now };

  if (store.shares.length >= MAX_MEDIA_SHARES) {
    return { accepted: false, reason: 'MAX_MEDIA_SHARES_REACHED', at: now };
  }

  const age = input.declaredAgeYears ?? null;
  const adultOk = age !== null && age >= ADULT_MIN_AGE_YEARS;

  if (input.optIn !== true || !adultOk || input.publish === true || input.charge === true) {
    const share: BusinessMediaShare = {
      id: id('dkshare'),
      foundationId: input.foundationId,
      contentRef: input.contentRef,
      optIn: input.optIn === true,
      declaredAgeYears: age,
      recommendationOnly: input.recommendationOnly === true,
      publishAttempted: input.publish === true,
      chargeAttempted: input.charge === true,
      status: 'DENIED',
      reason: BUSINESS_MEDIA_OPT_IN_DENIED,
      createdAt: now,
    };
    store.shares.push(share);
    await save(input.root, store);
    return { accepted: false, reason: BUSINESS_MEDIA_OPT_IN_DENIED, share, at: now };
  }

  const share: BusinessMediaShare = {
    id: id('dkshare'),
    foundationId: input.foundationId,
    contentRef: input.contentRef,
    optIn: true,
    declaredAgeYears: age,
    recommendationOnly: input.recommendationOnly !== false,
    publishAttempted: false,
    chargeAttempted: false,
    status: input.recommendationOnly === false ? 'SHARED' : 'RECOMMENDATION_ONLY',
    reason:
      input.recommendationOnly === false
        ? 'BUSINESS_MEDIA_OPT_IN_SHARE_ACCEPTED'
        : 'BUSINESS_MEDIA_RECOMMENDATION_ONLY_NOT_PUBLISH_OR_CHARGE',
    createdAt: now,
  };
  store.shares.push(share);
  await save(input.root, store);
  return { accepted: true, reason: share.reason, share, at: now };
}

export async function submitSupplyChainForecast(input: {
  foundationId: string;
  skuOrLane: string;
  provenanceRef?: string;
  claimVerifiedFact?: boolean;
  root: string;
  actor: DkActor;
}): Promise<{
  accepted: boolean;
  reason: string;
  forecast?: SupplyChainForecast;
  at: string;
}> {
  void input.actor;
  const store = await load(input.root);
  const now = new Date().toISOString();
  const foundation = store.foundations.find((f) => f.id === input.foundationId);
  if (!foundation) return { accepted: false, reason: 'FOUNDATION_NOT_FOUND', at: now };

  if (store.forecasts.length >= MAX_SUPPLY_FORECASTS) {
    return { accepted: false, reason: 'MAX_SUPPLY_FORECASTS_REACHED', at: now };
  }

  if (input.claimVerifiedFact === true || !input.provenanceRef?.trim()) {
    const forecast: SupplyChainForecast = {
      id: id('dksc'),
      foundationId: input.foundationId,
      skuOrLane: input.skuOrLane,
      provenanceRef: input.provenanceRef?.trim() || null,
      label: 'DENIED',
      labeledVerifiedFact: false,
      status: 'DENIED',
      reason: SUPPLY_CHAIN_FORECAST_NOT_FACT,
      createdAt: now,
    };
    store.forecasts.push(forecast);
    await save(input.root, store);
    return { accepted: false, reason: SUPPLY_CHAIN_FORECAST_NOT_FACT, forecast, at: now };
  }

  const forecast: SupplyChainForecast = {
    id: id('dksc'),
    foundationId: input.foundationId,
    skuOrLane: input.skuOrLane,
    provenanceRef: input.provenanceRef.trim(),
    label: 'LABELED_FORECAST',
    labeledVerifiedFact: false,
    status: 'ACCEPTED',
    reason: 'SUPPLY_CHAIN_FORECAST_ACCEPTED_AS_LABELED_FORECAST_NOT_FACT',
    createdAt: now,
  };
  store.forecasts.push(forecast);
  await save(input.root, store);
  return { accepted: true, reason: forecast.reason, forecast, at: now };
}
