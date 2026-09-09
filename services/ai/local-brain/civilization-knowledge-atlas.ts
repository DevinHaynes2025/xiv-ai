/**
 * 62L-DM Civilization Knowledge Atlas —
 * Lawful provenance-backed regional packs; inclusive UX without demographic profiling.
 */

import { readJsonFile, writeJsonFileAtomic, xivLocalPath } from './durable-json';
import {
  ADULT_MIN_AGE_YEARS,
  ATLAS_WITHOUT_PROVENANCE_DENIED,
  CIVILIZATION_ATLAS_REGIONS,
  DEMOGRAPHIC_PROFILING_DENIED,
  DM_LOCKS,
  HONESTY_BANNER,
  MAX_ATLAS_PACKS,
  UNDER_18_DENIED,
  type CivilizationAtlasRegion,
  type DmActor,
} from './global-neural-transit-civilization-atlas-types';

export type CivilizationKnowledgeAtlas = {
  id: string;
  orgId: string;
  tenantId: string;
  universeId: string;
  regionsSupported: readonly CivilizationAtlasRegion[];
  provenanceRequired: true;
  demographicProfiling: false;
  createdAt: string;
};

export type AtlasPackEntry = {
  id: string;
  atlasId: string;
  region: CivilizationAtlasRegion;
  title: string;
  authorized: boolean;
  provenanceRef: string | null;
  rightsCleared: boolean;
  status: 'ACCEPTED' | 'DENIED';
  reason: string;
  createdAt: string;
};

export type InclusiveUxSession = {
  id: string;
  atlasId: string;
  locale: string;
  culturallyRespectful: true;
  demographicProfilingAttempted: boolean;
  declaredAgeYears: number | null;
  status: 'ADMITTED' | 'DENIED';
  reason: string;
  createdAt: string;
};

type Store = {
  atlases: CivilizationKnowledgeAtlas[];
  packs: AtlasPackEntry[];
  uxSessions: InclusiveUxSession[];
};

function storePath(root: string) {
  return xivLocalPath(root, 'civilization-knowledge-atlas.json');
}

async function load(root: string): Promise<Store> {
  return readJsonFile<Store>(storePath(root), { atlases: [], packs: [], uxSessions: [] });
}

async function save(root: string, store: Store) {
  await writeJsonFileAtomic(storePath(root), store);
}

function id(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function civilizationKnowledgeAtlasHonesty() {
  return {
    banner: HONESTY_BANNER,
    provenanceRequired: DM_LOCKS.ATLAS_INTAKE_REQUIRES_PROVENANCE_AND_RIGHTS,
    atlasWithoutProvenanceAllowed: DM_LOCKS.ATLAS_WITHOUT_PROVENANCE_ALLOWED,
    demographicProfiling: DM_LOCKS.USER_DEMOGRAPHIC_PROFILING,
    profileByRace: DM_LOCKS.PROFILE_BY_RACE,
    profileByGender: DM_LOCKS.PROFILE_BY_GENDER,
    profileByCulture: DM_LOCKS.PROFILE_BY_CULTURE,
    profileByBackground: DM_LOCKS.PROFILE_BY_BACKGROUND,
    inclusiveUxWithoutDemographicProfiling: DM_LOCKS.INCLUSIVE_UX_WITHOUT_DEMOGRAPHIC_PROFILING,
    adult18PlusRequired: DM_LOCKS.ADULT_18_PLUS_REQUIRED,
    regionsSupported: CIVILIZATION_ATLAS_REGIONS,
  };
}

export async function bootstrapCivilizationKnowledgeAtlas(input: {
  orgId: string;
  tenantId: string;
  universeId: string;
  root: string;
  actor: DmActor;
}): Promise<CivilizationKnowledgeAtlas> {
  void input.actor;
  const store = await load(input.root);
  const existing = store.atlases.find(
    (a) => a.orgId === input.orgId && a.tenantId === input.tenantId && a.universeId === input.universeId,
  );
  if (existing) return existing;
  const atlas: CivilizationKnowledgeAtlas = {
    id: id('dmatlas'),
    orgId: input.orgId,
    tenantId: input.tenantId,
    universeId: input.universeId,
    regionsSupported: CIVILIZATION_ATLAS_REGIONS,
    provenanceRequired: true,
    demographicProfiling: false,
    createdAt: new Date().toISOString(),
  };
  store.atlases.push(atlas);
  await save(input.root, store);
  return atlas;
}

export async function ingestCivilizationAtlasPack(input: {
  atlasId: string;
  region: CivilizationAtlasRegion;
  title: string;
  authorized: boolean;
  provenanceRef?: string;
  rightsCleared?: boolean;
  root: string;
  actor: DmActor;
}): Promise<{ accepted: boolean; reason: string; pack?: AtlasPackEntry; at: string }> {
  void input.actor;
  const store = await load(input.root);
  const now = new Date().toISOString();
  const atlas = store.atlases.find((a) => a.id === input.atlasId);
  if (!atlas) return { accepted: false, reason: 'ATLAS_NOT_FOUND', at: now };
  if (store.packs.length >= MAX_ATLAS_PACKS) {
    return { accepted: false, reason: 'MAX_ATLAS_PACKS_REACHED', at: now };
  }
  if (input.authorized !== true || !input.provenanceRef?.trim() || input.rightsCleared !== true) {
    const pack: AtlasPackEntry = {
      id: id('dmpack'),
      atlasId: input.atlasId,
      region: input.region,
      title: input.title,
      authorized: input.authorized === true,
      provenanceRef: input.provenanceRef?.trim() || null,
      rightsCleared: input.rightsCleared === true,
      status: 'DENIED',
      reason: ATLAS_WITHOUT_PROVENANCE_DENIED,
      createdAt: now,
    };
    store.packs.push(pack);
    await save(input.root, store);
    return { accepted: false, reason: ATLAS_WITHOUT_PROVENANCE_DENIED, pack, at: now };
  }
  const pack: AtlasPackEntry = {
    id: id('dmpack'),
    atlasId: input.atlasId,
    region: input.region,
    title: input.title,
    authorized: true,
    provenanceRef: input.provenanceRef.trim(),
    rightsCleared: true,
    status: 'ACCEPTED',
    reason: 'LAWFUL_PROVENANCE_BACKED_ATLAS_PACK_ACCEPTED',
    createdAt: now,
  };
  store.packs.push(pack);
  await save(input.root, store);
  return { accepted: true, reason: pack.reason, pack, at: now };
}

export async function startInclusiveUxSession(input: {
  atlasId: string;
  locale: string;
  declaredAgeYears?: number;
  profileByRace?: boolean;
  profileByGender?: boolean;
  profileByCulture?: boolean;
  profileByBackground?: boolean;
  root: string;
  actor: DmActor;
}): Promise<{ accepted: boolean; reason: string; session?: InclusiveUxSession; at: string }> {
  void input.actor;
  const store = await load(input.root);
  const now = new Date().toISOString();
  const atlas = store.atlases.find((a) => a.id === input.atlasId);
  if (!atlas) return { accepted: false, reason: 'ATLAS_NOT_FOUND', at: now };

  const profilingAttempted =
    input.profileByRace === true ||
    input.profileByGender === true ||
    input.profileByCulture === true ||
    input.profileByBackground === true;

  if (profilingAttempted) {
    const session: InclusiveUxSession = {
      id: id('dmux'),
      atlasId: input.atlasId,
      locale: input.locale,
      culturallyRespectful: true,
      demographicProfilingAttempted: true,
      declaredAgeYears: input.declaredAgeYears ?? null,
      status: 'DENIED',
      reason: DEMOGRAPHIC_PROFILING_DENIED,
      createdAt: now,
    };
    store.uxSessions.push(session);
    await save(input.root, store);
    return { accepted: false, reason: DEMOGRAPHIC_PROFILING_DENIED, session, at: now };
  }

  const age = input.declaredAgeYears;
  if (typeof age !== 'number' || !Number.isFinite(age) || age < ADULT_MIN_AGE_YEARS) {
    const session: InclusiveUxSession = {
      id: id('dmux'),
      atlasId: input.atlasId,
      locale: input.locale,
      culturallyRespectful: true,
      demographicProfilingAttempted: false,
      declaredAgeYears: typeof age === 'number' ? age : null,
      status: 'DENIED',
      reason: UNDER_18_DENIED,
      createdAt: now,
    };
    store.uxSessions.push(session);
    await save(input.root, store);
    return { accepted: false, reason: UNDER_18_DENIED, session, at: now };
  }

  const session: InclusiveUxSession = {
    id: id('dmux'),
    atlasId: input.atlasId,
    locale: input.locale || 'en',
    culturallyRespectful: true,
    demographicProfilingAttempted: false,
    declaredAgeYears: age,
    status: 'ADMITTED',
    reason: 'INCLUSIVE_18_PLUS_UX_WITHOUT_DEMOGRAPHIC_PROFILING',
    createdAt: now,
  };
  store.uxSessions.push(session);
  await save(input.root, store);
  return { accepted: true, reason: session.reason, session, at: now };
}
