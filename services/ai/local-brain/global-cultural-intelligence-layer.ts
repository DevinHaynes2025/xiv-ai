/**
 * 62L-DN Global Cultural Intelligence Layer —
 * Culturally respectful inclusive intelligence; adult 18+ where required.
 * Demographic profiling by race/gender/culture/background is DENIED / not offered.
 */

import { readJsonFile, writeJsonFileAtomic, xivLocalPath } from './durable-json';
import {
  ADULT_MIN_AGE_YEARS,
  DEMOGRAPHIC_PROFILING_DENIED,
  DN_LOCKS,
  HONESTY_BANNER,
  MAX_CULTURAL_PACKS,
  UNDER_18_DENIED,
  type DnActor,
} from './universal-agent-runtime-os-types';

export type CulturalIntelligenceLayer = {
  id: string;
  orgId: string;
  tenantId: string;
  universeId: string;
  demographicProfilingOffered: false;
  inclusiveWithoutProfiling: true;
  createdAt: string;
};

export type CulturalPack = {
  id: string;
  layerId: string;
  localeHint: string;
  respectfulInclusive: true;
  status: 'AVAILABLE' | 'DENIED';
  reason: string;
  createdAt: string;
};

export type DemographicProfilingAttempt = {
  id: string;
  layerId: string;
  dimension: 'race' | 'gender' | 'culture' | 'background';
  status: 'DENIED';
  reason: string;
  at: string;
};

export type CulturalOnboardingAttempt = {
  id: string;
  layerId: string;
  declaredAgeYears: number | null;
  status: 'admitted' | 'denied';
  reason: string;
  at: string;
};

type Store = {
  layers: CulturalIntelligenceLayer[];
  packs: CulturalPack[];
  profilingAttempts: DemographicProfilingAttempt[];
  onboardings: CulturalOnboardingAttempt[];
};

function storePath(root: string) {
  return xivLocalPath(root, 'global-cultural-intelligence-layer.json');
}

async function load(root: string): Promise<Store> {
  return readJsonFile<Store>(storePath(root), {
    layers: [],
    packs: [],
    profilingAttempts: [],
    onboardings: [],
  });
}

async function save(root: string, store: Store) {
  await writeJsonFileAtomic(storePath(root), store);
}

function id(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function globalCulturalIntelligenceHonesty() {
  return {
    banner: HONESTY_BANNER,
    demographicProfiling: DN_LOCKS.USER_DEMOGRAPHIC_PROFILING,
    profileByRace: DN_LOCKS.PROFILE_BY_RACE,
    profileByGender: DN_LOCKS.PROFILE_BY_GENDER,
    profileByCulture: DN_LOCKS.PROFILE_BY_CULTURE,
    profileByBackground: DN_LOCKS.PROFILE_BY_BACKGROUND,
    demographicProfilingFeatureOffered: DN_LOCKS.DEMOGRAPHIC_PROFILING_FEATURE_OFFERED,
    inclusiveWithoutProfiling: DN_LOCKS.INCLUSIVE_UX_WITHOUT_DEMOGRAPHIC_PROFILING,
    adult18PlusRequired: DN_LOCKS.ADULT_18_PLUS_REQUIRED,
  };
}

export async function bootstrapGlobalCulturalIntelligenceLayer(input: {
  orgId: string;
  tenantId: string;
  universeId: string;
  root: string;
  actor: DnActor;
}): Promise<CulturalIntelligenceLayer> {
  void input.actor;
  const store = await load(input.root);
  const existing = store.layers.find(
    (l) =>
      l.orgId === input.orgId &&
      l.tenantId === input.tenantId &&
      l.universeId === input.universeId,
  );
  if (existing) return existing;
  const layer: CulturalIntelligenceLayer = {
    id: id('dncult'),
    orgId: input.orgId,
    tenantId: input.tenantId,
    universeId: input.universeId,
    demographicProfilingOffered: false,
    inclusiveWithoutProfiling: true,
    createdAt: new Date().toISOString(),
  };
  store.layers.push(layer);
  await save(input.root, store);
  return layer;
}

export async function requestDemographicProfiling(input: {
  layerId: string;
  dimension: DemographicProfilingAttempt['dimension'];
  root: string;
  actor: DnActor;
}): Promise<{ accepted: false; reason: string; attempt: DemographicProfilingAttempt }> {
  void input.actor;
  const store = await load(input.root);
  const attempt: DemographicProfilingAttempt = {
    id: id('dnprof'),
    layerId: input.layerId,
    dimension: input.dimension,
    status: 'DENIED',
    reason: DEMOGRAPHIC_PROFILING_DENIED,
    at: new Date().toISOString(),
  };
  store.profilingAttempts.push(attempt);
  await save(input.root, store);
  return { accepted: false, reason: attempt.reason, attempt };
}

export async function registerCulturalPack(input: {
  layerId: string;
  localeHint: string;
  root: string;
  actor: DnActor;
}): Promise<{ accepted: boolean; reason: string; pack?: CulturalPack }> {
  void input.actor;
  const store = await load(input.root);
  const layer = store.layers.find((l) => l.id === input.layerId);
  if (!layer) return { accepted: false, reason: 'CULTURAL_LAYER_NOT_FOUND' };
  if (store.packs.length >= MAX_CULTURAL_PACKS) {
    return { accepted: false, reason: 'MAX_CULTURAL_PACKS_REACHED' };
  }
  const pack: CulturalPack = {
    id: id('dnpack'),
    layerId: input.layerId,
    localeHint: input.localeHint,
    respectfulInclusive: true,
    status: 'AVAILABLE',
    reason: 'CULTURAL_PACK_INCLUSIVE_WITHOUT_DEMOGRAPHIC_PROFILING',
    createdAt: new Date().toISOString(),
  };
  store.packs.push(pack);
  await save(input.root, store);
  return { accepted: true, reason: pack.reason, pack };
}

export async function attemptCulturalOnboarding(input: {
  layerId: string;
  declaredAgeYears: number | null;
  root: string;
  actor: DnActor;
}): Promise<{ accepted: boolean; reason: string; attempt: CulturalOnboardingAttempt }> {
  void input.actor;
  const store = await load(input.root);
  const now = new Date().toISOString();
  const age = input.declaredAgeYears;
  if (age == null || !Number.isFinite(age) || age < ADULT_MIN_AGE_YEARS) {
    const attempt: CulturalOnboardingAttempt = {
      id: id('dncultob'),
      layerId: input.layerId,
      declaredAgeYears: age,
      status: 'denied',
      reason: UNDER_18_DENIED,
      at: now,
    };
    store.onboardings.push(attempt);
    await save(input.root, store);
    return { accepted: false, reason: attempt.reason, attempt };
  }
  const attempt: CulturalOnboardingAttempt = {
    id: id('dncultob'),
    layerId: input.layerId,
    declaredAgeYears: age,
    status: 'admitted',
    reason: 'ADULT_18_PLUS_CONFIRMED_INCLUSIVE_CULTURAL_UX',
    at: now,
  };
  store.onboardings.push(attempt);
  await save(input.root, store);
  return { accepted: true, reason: attempt.reason, attempt };
}
