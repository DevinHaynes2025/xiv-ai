/**
 * 62L-DO Global Civilization & Innovation Memory Lake —
 * Extends civilization atlas + innovation knowledge; provenance/rights required.
 * Unauthorized intake DENIED.
 */

import { readJsonFile, writeJsonFileAtomic, xivLocalPath } from './durable-json';
import {
  DO_LOCKS,
  HONESTY_BANNER,
  MAX_MEMORY_LAKE_ENTRIES,
  MEMORY_LAKE_INTAKE_DENIED,
  type DoActor,
} from './distributed-cognitive-runtime-plugin-mesh-types';

export type MemoryLakeEntry = {
  id: string;
  kind: 'civilization' | 'innovation';
  title: string;
  provenance: string | null;
  rightsAuthorized: boolean;
  status: 'accepted' | 'denied';
  reason: string;
  createdAt: string;
};

type Store = {
  entries: MemoryLakeEntry[];
};

function storePath(root: string) {
  return xivLocalPath(root, 'global-civilization-innovation-memory-lake.json');
}

async function load(root: string): Promise<Store> {
  return readJsonFile<Store>(storePath(root), { entries: [] });
}

async function save(root: string, store: Store) {
  await writeJsonFileAtomic(storePath(root), store);
}

function id(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function globalCivilizationInnovationMemoryLakeHonesty() {
  return {
    banner: HONESTY_BANNER,
    unauthorizedIntake: DO_LOCKS.MEMORY_LAKE_UNAUTHORIZED_INTAKE,
    requiresProvenanceRights: DO_LOCKS.MEMORY_LAKE_REQUIRES_PROVENANCE_RIGHTS,
  };
}

export async function intakeMemoryLakeEntry(input: {
  kind: 'civilization' | 'innovation';
  title: string;
  provenance?: string | null;
  rightsAuthorized?: boolean;
  root: string;
  actor: DoActor;
}): Promise<MemoryLakeEntry> {
  const store = await load(input.root);
  void input.actor;
  if (store.entries.length >= MAX_MEMORY_LAKE_ENTRIES) {
    throw new Error('MAX_MEMORY_LAKE_ENTRIES_REACHED');
  }

  const provenance = input.provenance?.trim() || null;
  const rightsAuthorized = input.rightsAuthorized === true;
  const ok = Boolean(provenance) && rightsAuthorized;

  const entry: MemoryLakeEntry = {
    id: id('domem'),
    kind: input.kind,
    title: input.title.trim(),
    provenance,
    rightsAuthorized,
    status: ok ? 'accepted' : 'denied',
    reason: ok
      ? 'MEMORY_LAKE_INTAKE_AUTHORIZED_WITH_PROVENANCE_RIGHTS'
      : MEMORY_LAKE_INTAKE_DENIED,
    createdAt: new Date().toISOString(),
  };
  store.entries.push(entry);
  await save(input.root, store);
  return entry;
}
