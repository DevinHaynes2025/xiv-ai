import { createHash } from 'node:crypto';

import { cortexId, readJsonFile, writeJsonFileAtomic, xivLocalPath } from './cortex-store';
import type { MemoryPartition } from './memory-cortex';

export type LakeTier = 'hot' | 'warm' | 'cold' | 'archive';
export type LakePartition = MemoryPartition;

export const MAX_LAKE_OBJECTS = 10_000;
export const MAX_INLINE_BODY_CHARS = 32_000;

const SECRET_PATTERN = /BEGIN (?:RSA |OPENSSH )?PRIVATE KEY|sk_live_|ghp_[A-Za-z0-9]{20,}/i;

export type KnowledgeLakeObject = {
  id: string;
  tenantId: string;
  universeId: string;
  industry: string;
  era: string;
  partition: LakePartition;
  sourceUri: string;
  sourceLanguage: string;
  originalText: string;
  contentHash: string;
  shard: string;
  tier: LakeTier;
  byteLength: number;
  ingestedAt: string;
  lastRetrievedAt?: string;
  provenanceRefs: string[];
  classification: 'public' | 'internal' | 'confidential' | 'restricted';
  duplicateOf?: string;
  productionAuthorization: false;
};

type LakeCatalog = { objects: KnowledgeLakeObject[] };

function catalogPath(root: string) {
  return xivLocalPath(root, 'knowledge-lake.json');
}

async function loadCatalog(root: string): Promise<KnowledgeLakeObject[]> {
  const parsed = await readJsonFile<LakeCatalog>(catalogPath(root), { objects: [] });
  return Array.isArray(parsed.objects) ? parsed.objects : [];
}

async function saveCatalog(root: string, objects: KnowledgeLakeObject[]) {
  await writeJsonFileAtomic(catalogPath(root), { objects: objects.slice(-MAX_LAKE_OBJECTS) });
}

export function normalizeForHash(text: string) {
  return text.normalize('NFC').replace(/\s+/g, ' ').trim();
}

export function hashLakeContent(sourceLanguage: string, originalText: string) {
  return createHash('sha256')
    .update(`${sourceLanguage}\n${normalizeForHash(originalText)}`)
    .digest('hex');
}

export function lakeShardFor(contentHash: string) {
  return contentHash.slice(0, 2);
}

function denySecrets(sourceUri: string, originalText: string) {
  const uri = sourceUri.replaceAll('\\', '/').toLowerCase();
  if (uri.split('/').includes('.env') || uri.endsWith('.env') || uri.includes('.xiv-local/')) {
    throw new Error('LAKE_SOURCE_PATH_DENIED');
  }
  if (SECRET_PATTERN.test(originalText)) {
    throw new Error('LAKE_SECRET_MATERIAL_DENIED');
  }
}

export async function ingestLakeSource(input: {
  tenantId: string;
  universeId: string;
  industry: string;
  era?: string;
  partition: LakePartition;
  sourceUri: string;
  sourceLanguage: string;
  originalText: string;
  provenanceRefs: string[];
  classification?: KnowledgeLakeObject['classification'];
  tier?: LakeTier;
  now?: string;
  root?: string;
}): Promise<{ object: KnowledgeLakeObject; duplicate: boolean }> {
  if (!input.tenantId || !input.universeId) throw new Error('TENANT_AND_UNIVERSE_REQUIRED');
  if (!input.industry.trim() || !input.sourceUri.trim() || !input.sourceLanguage.trim()) {
    throw new Error('LAKE_SOURCE_METADATA_REQUIRED');
  }
  if (!input.originalText.trim()) throw new Error('LAKE_ORIGINAL_TEXT_REQUIRED');
  if (input.provenanceRefs.length === 0) throw new Error('LAKE_PROVENANCE_REQUIRED');
  if ((input.partition === 'personal' || input.partition === 'company') && input.classification === 'public') {
    throw new Error('PRIVATE_LAKE_OBJECT_CANNOT_PROMOTE_TO_WORLD');
  }
  denySecrets(input.sourceUri, input.originalText);

  const root = input.root ?? process.cwd();
  const now = input.now ?? new Date().toISOString();
  const originalText = input.originalText.slice(0, MAX_INLINE_BODY_CHARS);
  const contentHash = hashLakeContent(input.sourceLanguage, originalText);
  const objects = await loadCatalog(root);
  const existing = objects.find((item) =>
    item.tenantId === input.tenantId &&
    item.universeId === input.universeId &&
    item.contentHash === contentHash,
  );
  if (existing) {
    return { object: existing, duplicate: true };
  }

  const object: KnowledgeLakeObject = {
    id: cortexId('lake'),
    tenantId: input.tenantId,
    universeId: input.universeId,
    industry: input.industry.trim().toLowerCase(),
    era: (input.era ?? 'unknown').trim() || 'unknown',
    partition: input.partition,
    sourceUri: input.sourceUri.trim(),
    sourceLanguage: input.sourceLanguage.trim().toLowerCase(),
    originalText,
    contentHash,
    shard: lakeShardFor(contentHash),
    tier: input.tier ?? 'hot',
    byteLength: Buffer.byteLength(originalText, 'utf8'),
    ingestedAt: now,
    provenanceRefs: [...input.provenanceRefs],
    classification: input.classification ?? (input.partition === 'world' ? 'internal' : 'confidential'),
    productionAuthorization: false,
  };
  objects.push(object);
  await saveCatalog(root, objects);
  return { object, duplicate: false };
}

export async function getLakeObject(input: {
  id: string;
  tenantId: string;
  universeId: string;
  root?: string;
}) {
  const objects = await listLakeObjects(input);
  return objects.find((item) => item.id === input.id) ?? null;
}

export async function listLakeObjects(input: {
  tenantId: string;
  universeId: string;
  industry?: string;
  era?: string;
  partition?: LakePartition;
  shard?: string;
  root?: string;
}) {
  const objects = await loadCatalog(input.root ?? process.cwd());
  return objects.filter((item) =>
    item.tenantId === input.tenantId &&
    item.universeId === input.universeId &&
    (!input.industry || item.industry === input.industry) &&
    (!input.era || item.era === input.era) &&
    (!input.partition || item.partition === input.partition) &&
    (!input.shard || item.shard === input.shard),
  );
}

export async function markLakeRetrieved(input: {
  id: string;
  tenantId: string;
  universeId: string;
  now?: string;
  root?: string;
}) {
  const root = input.root ?? process.cwd();
  const objects = await loadCatalog(root);
  const object = objects.find((item) =>
    item.id === input.id && item.tenantId === input.tenantId && item.universeId === input.universeId,
  );
  if (!object) throw new Error('LAKE_OBJECT_NOT_FOUND');
  object.lastRetrievedAt = input.now ?? new Date().toISOString();
  if (object.tier === 'cold' || object.tier === 'archive') object.tier = 'warm';
  await saveCatalog(root, objects);
  return object;
}

export async function assignLakeTier(input: {
  id: string;
  tenantId: string;
  universeId: string;
  tier: LakeTier;
  root?: string;
}) {
  const root = input.root ?? process.cwd();
  const objects = await loadCatalog(root);
  const object = objects.find((item) =>
    item.id === input.id && item.tenantId === input.tenantId && item.universeId === input.universeId,
  );
  if (!object) throw new Error('LAKE_OBJECT_NOT_FOUND');
  object.tier = input.tier;
  await saveCatalog(root, objects);
  return object;
}

export async function knowledgeLakeStats(root = process.cwd()) {
  const objects = await loadCatalog(root);
  const byTier: Record<LakeTier, number> = { hot: 0, warm: 0, cold: 0, archive: 0 };
  const shards = new Set<string>();
  for (const object of objects) {
    byTier[object.tier] += 1;
    shards.add(object.shard);
  }
  return {
    objects: objects.length,
    materializedCap: MAX_LAKE_OBJECTS,
    byTier,
    shards: shards.size,
    productionAuthorization: false as const,
  };
}
