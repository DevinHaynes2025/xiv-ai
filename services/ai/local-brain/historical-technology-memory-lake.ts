/**
 * 62L-DL Global Historical Technology Memory Lake —
 * Expands historical technology memory with authorized + provenance intake only.
 */

import { readJsonFile, writeJsonFileAtomic, xivLocalPath } from './durable-json';
import {
  DL_LOCKS,
  HONESTY_BANNER,
  MAX_TECH_LAKE_ENTRIES,
  UNAUTHORIZED_TECH_LAKE_DENIED,
  type DlActor,
} from './neural-transportation-os-types';

export type HistoricalTechnologyMemoryLake = {
  id: string;
  orgId: string;
  tenantId: string;
  universeId: string;
  provenanceRequired: true;
  createdAt: string;
};

export type TechLakeEntry = {
  id: string;
  lakeId: string;
  sourceId: string;
  title: string;
  authorized: boolean;
  provenanceRef: string | null;
  claimKind: 'FACT_CANDIDATE' | 'CORRELATION_ONLY' | 'HYPOTHESIS' | 'DENIED';
  status: 'ACCEPTED' | 'DENIED';
  reason: string;
  createdAt: string;
};

type Store = { lakes: HistoricalTechnologyMemoryLake[]; entries: TechLakeEntry[] };

function storePath(root: string) {
  return xivLocalPath(root, 'historical-technology-memory-lake.json');
}

async function load(root: string): Promise<Store> {
  return readJsonFile<Store>(storePath(root), { lakes: [], entries: [] });
}

async function save(root: string, store: Store) {
  await writeJsonFileAtomic(storePath(root), store);
}

function id(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function historicalTechnologyMemoryLakeHonesty() {
  return {
    banner: HONESTY_BANNER,
    unauthorizedTechHistoryLakeIntake: DL_LOCKS.UNAUTHORIZED_TECH_HISTORY_LAKE_INTAKE,
    techHistoryLakeRequiresProvenance: DL_LOCKS.TECH_HISTORY_LAKE_REQUIRES_PROVENANCE,
  };
}

export async function bootstrapHistoricalTechnologyMemoryLake(input: {
  orgId: string;
  tenantId: string;
  universeId: string;
  root: string;
  actor: DlActor;
}): Promise<HistoricalTechnologyMemoryLake> {
  void input.actor;
  const store = await load(input.root);
  const existing = store.lakes.find(
    (l) =>
      l.orgId === input.orgId &&
      l.tenantId === input.tenantId &&
      l.universeId === input.universeId,
  );
  if (existing) return existing;
  const lake: HistoricalTechnologyMemoryLake = {
    id: id('dllake'),
    orgId: input.orgId,
    tenantId: input.tenantId,
    universeId: input.universeId,
    provenanceRequired: true,
    createdAt: new Date().toISOString(),
  };
  store.lakes.push(lake);
  await save(input.root, store);
  return lake;
}

export async function ingestTechHistoryLakeEntry(input: {
  lakeId: string;
  sourceId: string;
  title: string;
  authorized: boolean;
  provenanceRef?: string;
  claimCausationFromPattern?: boolean;
  root: string;
  actor: DlActor;
}): Promise<{ accepted: boolean; reason: string; entry?: TechLakeEntry; at: string }> {
  void input.actor;
  const store = await load(input.root);
  const now = new Date().toISOString();
  const lake = store.lakes.find((l) => l.id === input.lakeId);
  if (!lake) return { accepted: false, reason: 'LAKE_NOT_FOUND', at: now };

  if (store.entries.length >= MAX_TECH_LAKE_ENTRIES) {
    return { accepted: false, reason: 'MAX_TECH_LAKE_ENTRIES_REACHED', at: now };
  }

  if (input.authorized !== true || !input.provenanceRef?.trim()) {
    const entry: TechLakeEntry = {
      id: id('dltech'),
      lakeId: input.lakeId,
      sourceId: input.sourceId,
      title: input.title,
      authorized: input.authorized === true,
      provenanceRef: input.provenanceRef?.trim() || null,
      claimKind: 'DENIED',
      status: 'DENIED',
      reason: UNAUTHORIZED_TECH_LAKE_DENIED,
      createdAt: now,
    };
    store.entries.push(entry);
    await save(input.root, store);
    return { accepted: false, reason: UNAUTHORIZED_TECH_LAKE_DENIED, entry, at: now };
  }

  const claimKind =
    input.claimCausationFromPattern === true ? 'CORRELATION_ONLY' : 'FACT_CANDIDATE';
  const entry: TechLakeEntry = {
    id: id('dltech'),
    lakeId: input.lakeId,
    sourceId: input.sourceId,
    title: input.title,
    authorized: true,
    provenanceRef: input.provenanceRef.trim(),
    claimKind,
    status: 'ACCEPTED',
    reason:
      claimKind === 'CORRELATION_ONLY'
        ? 'AUTHORIZED_LAKE_INTAKE_PATTERN_REMAINS_CORRELATION_ONLY'
        : 'AUTHORIZED_PROVENANCE_TECH_HISTORY_LAKE_ACCEPTED',
    createdAt: now,
  };
  store.entries.push(entry);
  await save(input.root, store);
  return { accepted: true, reason: entry.reason, entry, at: now };
}
