/**
 * 62L-DK Global Tech History Atlas —
 * Authorized + provenance-aware historical technology knowledge.
 * Pattern ≠ causation.
 */

import { readJsonFile, writeJsonFileAtomic, xivLocalPath } from './durable-json';
import {
  DK_LOCKS,
  HONESTY_BANNER,
  MAX_TECH_ATLAS_ENTRIES,
  UNAUTHORIZED_TECH_HISTORY_DENIED,
  type DkActor,
} from './unified-intelligence-experience-os-types';

export type TechHistoryAtlas = {
  id: string;
  orgId: string;
  tenantId: string;
  universeId: string;
  provenanceRequired: true;
  patternEqCausation: false;
  createdAt: string;
};

export type TechHistoryEntry = {
  id: string;
  atlasId: string;
  sourceId: string;
  title: string;
  authorized: boolean;
  provenanceRef: string | null;
  claimKind: 'FACT_CANDIDATE' | 'CORRELATION_ONLY' | 'HYPOTHESIS' | 'DENIED';
  status: 'ACCEPTED' | 'DENIED';
  reason: string;
  createdAt: string;
};

type Store = { atlases: TechHistoryAtlas[]; entries: TechHistoryEntry[] };

function storePath(root: string) {
  return xivLocalPath(root, 'global-tech-history-atlas.json');
}

async function load(root: string): Promise<Store> {
  return readJsonFile<Store>(storePath(root), { atlases: [], entries: [] });
}

async function save(root: string, store: Store) {
  await writeJsonFileAtomic(storePath(root), store);
}

function id(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function globalTechHistoryAtlasHonesty() {
  return {
    banner: HONESTY_BANNER,
    unauthorizedTechHistorySource: DK_LOCKS.UNAUTHORIZED_TECH_HISTORY_SOURCE,
    techHistoryRequiresProvenance: DK_LOCKS.TECH_HISTORY_REQUIRES_PROVENANCE,
    patternEqCausation: DK_LOCKS.PATTERN_EQ_CAUSATION,
  };
}

export async function bootstrapGlobalTechHistoryAtlas(input: {
  orgId: string;
  tenantId: string;
  universeId: string;
  root: string;
  actor: DkActor;
}): Promise<TechHistoryAtlas> {
  void input.actor;
  const store = await load(input.root);
  const existing = store.atlases.find(
    (a) =>
      a.orgId === input.orgId &&
      a.tenantId === input.tenantId &&
      a.universeId === input.universeId,
  );
  if (existing) return existing;
  const atlas: TechHistoryAtlas = {
    id: id('dkatlas'),
    orgId: input.orgId,
    tenantId: input.tenantId,
    universeId: input.universeId,
    provenanceRequired: true,
    patternEqCausation: false,
    createdAt: new Date().toISOString(),
  };
  store.atlases.push(atlas);
  await save(input.root, store);
  return atlas;
}

export async function ingestTechHistorySource(input: {
  atlasId: string;
  sourceId: string;
  title: string;
  authorized: boolean;
  provenanceRef?: string;
  claimCausationFromPattern?: boolean;
  root: string;
  actor: DkActor;
}): Promise<{ accepted: boolean; reason: string; entry?: TechHistoryEntry; at: string }> {
  void input.actor;
  const store = await load(input.root);
  const now = new Date().toISOString();
  const atlas = store.atlases.find((a) => a.id === input.atlasId);
  if (!atlas) return { accepted: false, reason: 'ATLAS_NOT_FOUND', at: now };

  if (store.entries.length >= MAX_TECH_ATLAS_ENTRIES) {
    return { accepted: false, reason: 'MAX_TECH_ATLAS_ENTRIES_REACHED', at: now };
  }

  if (input.authorized !== true || !input.provenanceRef?.trim()) {
    const entry: TechHistoryEntry = {
      id: id('dktech'),
      atlasId: input.atlasId,
      sourceId: input.sourceId,
      title: input.title,
      authorized: input.authorized === true,
      provenanceRef: input.provenanceRef?.trim() || null,
      claimKind: 'DENIED',
      status: 'DENIED',
      reason: UNAUTHORIZED_TECH_HISTORY_DENIED,
      createdAt: now,
    };
    store.entries.push(entry);
    await save(input.root, store);
    return { accepted: false, reason: UNAUTHORIZED_TECH_HISTORY_DENIED, entry, at: now };
  }

  const claimKind =
    input.claimCausationFromPattern === true ? 'CORRELATION_ONLY' : 'FACT_CANDIDATE';

  const entry: TechHistoryEntry = {
    id: id('dktech'),
    atlasId: input.atlasId,
    sourceId: input.sourceId,
    title: input.title,
    authorized: true,
    provenanceRef: input.provenanceRef.trim(),
    claimKind,
    status: 'ACCEPTED',
    reason:
      claimKind === 'CORRELATION_ONLY'
        ? 'AUTHORIZED_SOURCE_ACCEPTED_PATTERN_REMAINS_CORRELATION_ONLY'
        : 'AUTHORIZED_PROVENANCE_TECH_HISTORY_ACCEPTED',
    createdAt: now,
  };
  store.entries.push(entry);
  await save(input.root, store);
  return { accepted: true, reason: entry.reason, entry, at: now };
}
