import { readJsonFile, writeJsonFileAtomic, xivLocalPath } from './cortex-store';
import {
  listLakeObjects,
  markLakeRetrieved,
  type KnowledgeLakeObject,
  type LakePartition,
} from './knowledge-lake';

export const MAX_INDEX_POSTINGS = 50_000;
export const MAX_SPARSE_HITS = 64;

export type IndexPosting = {
  token: string;
  objectId: string;
  tenantId: string;
  universeId: string;
  industry: string;
  shard: string;
  partition: LakePartition;
  tier: KnowledgeLakeObject['tier'];
};

type IndexStore = { postings: IndexPosting[] };

function indexPath(root: string) {
  return xivLocalPath(root, 'offline-intelligence-index.json');
}

async function loadIndex(root: string): Promise<IndexPosting[]> {
  const parsed = await readJsonFile<IndexStore>(indexPath(root), { postings: [] });
  return Array.isArray(parsed.postings) ? parsed.postings : [];
}

async function saveIndex(root: string, postings: IndexPosting[]) {
  await writeJsonFileAtomic(indexPath(root), { postings: postings.slice(-MAX_INDEX_POSTINGS) });
}

export function tokenizeForIndex(text: string) {
  const latin = text
    .toLowerCase()
    .split(/[^a-z0-9]+/i)
    .filter((token) => token.length >= 3);
  const ideographs = text.match(/[\u3040-\u30ff\u3400-\u9fff]{2,}/g) ?? [];
  return [...new Set([...latin, ...ideographs].slice(0, 48))];
}

export async function indexLakeObject(object: KnowledgeLakeObject, root?: string) {
  const resolvedRoot = root ?? process.cwd();
  const postings = await loadIndex(resolvedRoot);
  const tokens = tokenizeForIndex(`${object.industry} ${object.era} ${object.originalText}`);
  const next = postings.filter((item) => item.objectId !== object.id);
  for (const token of tokens) {
    next.push({
      token,
      objectId: object.id,
      tenantId: object.tenantId,
      universeId: object.universeId,
      industry: object.industry,
      shard: object.shard,
      partition: object.partition,
      tier: object.tier,
    });
  }
  await saveIndex(resolvedRoot, next);
  return { objectId: object.id, tokens: tokens.length };
}

export async function sparseRetrieve(input: {
  tenantId: string;
  universeId: string;
  query: string;
  industry?: string;
  partition?: LakePartition;
  shard?: string;
  root?: string;
}): Promise<{
  state: 'AVAILABLE' | 'WAITING_DATA';
  hits: KnowledgeLakeObject[];
  tokens: string[];
  inventedFacts: false;
  reason: string;
}> {
  if (!input.tenantId || !input.universeId) throw new Error('TENANT_AND_UNIVERSE_REQUIRED');
  const tokens = tokenizeForIndex(input.query);
  if (tokens.length === 0) {
    return {
      state: 'AVAILABLE',
      hits: [],
      tokens,
      inventedFacts: false,
      reason: 'Empty query tokens. Sparse index will not invent matches.',
    };
  }
  const root = input.root ?? process.cwd();
  const postings = await loadIndex(root);
  const scores = new Map<string, number>();
  for (const posting of postings) {
    if (posting.tenantId !== input.tenantId || posting.universeId !== input.universeId) continue;
    if (input.industry && posting.industry !== input.industry) continue;
    if (input.partition && posting.partition !== input.partition) continue;
    if (input.shard && posting.shard !== input.shard) continue;
    if (!tokens.includes(posting.token)) continue;
    scores.set(posting.objectId, (scores.get(posting.objectId) ?? 0) + 1);
  }
  const ranked = [...scores.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, MAX_SPARSE_HITS)
    .map(([objectId]) => objectId);
  const catalog = await listLakeObjects({
    tenantId: input.tenantId,
    universeId: input.universeId,
    industry: input.industry,
    partition: input.partition,
    shard: input.shard,
    root,
  });
  const hits: KnowledgeLakeObject[] = [];
  for (const id of ranked) {
    const object = catalog.find((item) => item.id === id);
    if (object) {
      await markLakeRetrieved({ id: object.id, tenantId: input.tenantId, universeId: input.universeId, root });
      hits.push(object);
    }
  }
  return {
    state: 'AVAILABLE',
    hits,
    tokens,
    inventedFacts: false,
    reason: hits.length
      ? 'Sparse partitioned index returned local postings only.'
      : 'No local postings match. Do not invent industry memory or external freshness.',
  };
}

export async function offlineIndexStats(root = process.cwd()) {
  const postings = await loadIndex(root);
  return {
    postings: postings.length,
    objects: new Set(postings.map((item) => item.objectId)).size,
    shards: new Set(postings.map((item) => item.shard)).size,
    cap: MAX_INDEX_POSTINGS,
    productionAuthorization: false as const,
  };
}
