/**
 * 62L-CE Global Knowledge Excavation Grid — deepen iceberg/bamboo-roots excavation
 * over authorized sources only. Unauthorized archive mining DENIED.
 */

import { readJsonFile, writeJsonFileAtomic, xivLocalPath } from './durable-json';
import {
  CE_LOCKS,
  HONESTY_BANNER,
  UNAUTHORIZED_ARCHIVE_DENIED,
  type CeActor,
} from './knowledge-excavation-memory-lake-types';

export type ExcavationDepth = 'surface' | 'iceberg' | 'bamboo_roots';

export type KnowledgeSource = {
  id: string;
  label: string;
  authorized: boolean;
  sealed: boolean;
  category:
    | 'historical'
    | 'cultural'
    | 'business'
    | 'legal'
    | 'health'
    | 'supply_chain'
    | 'research'
    | 'other';
  status: 'available' | 'denied' | 'unavailable';
  reason: string;
  createdAt: string;
};

export type ExcavationResult = {
  id: string;
  sourceId: string;
  depth: ExcavationDepth;
  accepted: boolean;
  status: 'excavated' | 'denied' | 'unavailable';
  reason: string;
  artifactDigest?: string;
  createdAt: string;
};

type Store = {
  sources: KnowledgeSource[];
  excavations: ExcavationResult[];
};

function storePath(root: string) {
  return xivLocalPath(root, 'global-knowledge-excavation-grid.json');
}

async function load(root: string): Promise<Store> {
  return readJsonFile<Store>(storePath(root), { sources: [], excavations: [] });
}

async function save(root: string, store: Store) {
  await writeJsonFileAtomic(storePath(root), store);
}

function id(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function excavationGridHonesty() {
  return {
    banner: HONESTY_BANNER,
    l4AutonomyEnabled: CE_LOCKS.L4_AUTONOMY_ENABLED,
    unauthorizedArchiveMining: CE_LOCKS.UNAUTHORIZED_ARCHIVE_MINING,
    founderSealedDenyByDefault: CE_LOCKS.FOUNDER_SEALED_DENY_BY_DEFAULT,
  };
}

export async function registerKnowledgeSource(input: {
  label: string;
  authorized: boolean;
  sealed?: boolean;
  category?: KnowledgeSource['category'];
  root: string;
  actor: CeActor;
}): Promise<KnowledgeSource> {
  const store = await load(input.root);
  const authorized = input.authorized === true;
  const source: KnowledgeSource = {
    id: id('ksrc'),
    label: input.label,
    authorized,
    sealed: input.sealed === true,
    category: input.category ?? 'research',
    status: authorized ? 'available' : 'denied',
    reason: authorized ? 'AUTHORIZED_SOURCE' : UNAUTHORIZED_ARCHIVE_DENIED,
    createdAt: new Date().toISOString(),
  };
  store.sources.push(source);
  await save(input.root, store);
  return source;
}

export async function excavateKnowledge(input: {
  sourceId: string;
  depth: ExcavationDepth;
  root: string;
  actor: CeActor;
}): Promise<ExcavationResult> {
  const store = await load(input.root);
  const source = store.sources.find((s) => s.id === input.sourceId);
  if (!source) {
    const missing: ExcavationResult = {
      id: id('excv'),
      sourceId: input.sourceId,
      depth: input.depth,
      accepted: false,
      status: 'unavailable',
      reason: 'SOURCE_NOT_FOUND_UNAVAILABLE',
      createdAt: new Date().toISOString(),
    };
    store.excavations.push(missing);
    await save(input.root, store);
    return missing;
  }
  if (!source.authorized || source.status === 'denied') {
    const denied: ExcavationResult = {
      id: id('excv'),
      sourceId: source.id,
      depth: input.depth,
      accepted: false,
      status: 'denied',
      reason: UNAUTHORIZED_ARCHIVE_DENIED,
      createdAt: new Date().toISOString(),
    };
    store.excavations.push(denied);
    await save(input.root, store);
    return denied;
  }
  const ok: ExcavationResult = {
    id: id('excv'),
    sourceId: source.id,
    depth: input.depth,
    accepted: true,
    status: 'excavated',
    reason: `EXCAVATED_${input.depth.toUpperCase()}_AUTHORIZED`,
    artifactDigest: `digest_${source.id}_${input.depth}`,
    createdAt: new Date().toISOString(),
  };
  store.excavations.push(ok);
  await save(input.root, store);
  return ok;
}

export async function attemptUnauthorizedArchiveFeed(input: {
  label: string;
  root: string;
  actor: CeActor;
}): Promise<{ denied: true; reason: string; source: KnowledgeSource }> {
  const source = await registerKnowledgeSource({
    label: input.label,
    authorized: false,
    category: 'other',
    root: input.root,
    actor: input.actor,
  });
  const dig = await excavateKnowledge({
    sourceId: source.id,
    depth: 'bamboo_roots',
    root: input.root,
    actor: input.actor,
  });
  return {
    denied: true,
    reason: dig.reason === UNAUTHORIZED_ARCHIVE_DENIED ? dig.reason : UNAUTHORIZED_ARCHIVE_DENIED,
    source,
  };
}
