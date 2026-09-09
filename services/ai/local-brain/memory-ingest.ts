import { createHash } from 'node:crypto';

import { readJsonFile, writeJsonFileAtomic, xivLocalPath } from './durable-json';
import { hashLakeContent, ingestLakeSource } from './knowledge-lake';
import type { MemoryPartition } from './memory-cortex';
import { rememberCortexTrace } from './memory-cortex';
import { recordContradiction, upsertPartitionedKnowledge } from './world-knowledge-graph';
import type { MemoryClass, MemoryPolarity, PoisonState } from './distributed-memory-types';

export const MAX_MEMORY_RECORDS = 10_000;

export type DistributedMemoryRecord = {
  id: string;
  tenantId: string;
  universeId: string;
  partition: MemoryPartition;
  memoryClass: MemoryClass;
  polarity: MemoryPolarity;
  claim: string;
  summary: string;
  contentHash: string;
  integrity: string;
  validFrom: string;
  validTo?: string;
  sourceRefs: string[];
  evidenceRefs: string[];
  duplicateOf?: string;
  contradictionId?: string;
  poisonState: PoisonState;
  founderRestricted: boolean;
  sealed: false;
  productionAuthorization: false;
  createdAt: string;
};

type MemoryStore = { records: DistributedMemoryRecord[] };

function storePath(root: string) {
  return xivLocalPath(root, 'distributed-memory.json');
}

export function memoryIntegrity(input: {
  tenantId: string;
  universeId: string;
  contentHash: string;
  claim: string;
}) {
  return createHash('sha256')
    .update(`${input.tenantId}\n${input.universeId}\n${input.contentHash}\n${input.claim}`)
    .digest('hex');
}

function classifyMemory(input: {
  polarity: MemoryPolarity;
  founderRestricted?: boolean;
  contradiction?: boolean;
}): MemoryClass {
  if (input.founderRestricted) return 'founder_restricted';
  if (input.contradiction) return 'contradiction';
  if (input.polarity === 'counterclaim') return 'fact';
  return 'fact';
}

async function load(root: string): Promise<MemoryStore> {
  const parsed = await readJsonFile<MemoryStore>(storePath(root), { records: [] });
  return { records: Array.isArray(parsed.records) ? parsed.records : [] };
}

export async function listDistributedMemory(input: {
  tenantId: string;
  universeId: string;
  includeForgotten?: boolean;
  asOf?: string;
  root?: string;
}) {
  const store = await load(input.root ?? process.cwd());
  const asOf = input.asOf ?? new Date().toISOString();
  return store.records.filter((record) => {
    if (record.tenantId !== input.tenantId || record.universeId !== input.universeId) return false;
    if (record.validFrom > asOf) return false;
    if (record.validTo && record.validTo < asOf) return false;
    return true;
  });
}

export async function ingestEvidenceMemory(input: {
  tenantId: string;
  universeId: string;
  partition: MemoryPartition;
  claim: string;
  summary: string;
  polarity?: MemoryPolarity;
  validFrom?: string;
  validTo?: string;
  sourceUri?: string;
  sourceLanguage?: string;
  industry?: string;
  evidenceRefs?: string[];
  founderRestricted?: boolean;
  now?: string;
  root?: string;
}) {
  if (!input.tenantId || !input.universeId) throw new Error('TENANT_AND_UNIVERSE_REQUIRED');
  if (!input.claim.trim()) throw new Error('MEMORY_CLAIM_REQUIRED');
  const root = input.root ?? process.cwd();
  const now = input.now ?? new Date().toISOString();
  const polarity = input.polarity ?? 'claim';
  const lake = await ingestLakeSource({
    tenantId: input.tenantId,
    universeId: input.universeId,
    industry: input.industry ?? 'memory',
    partition: input.partition,
    sourceUri: input.sourceUri ?? `xiv-memory://${input.tenantId}/${encodeURIComponent(input.claim.slice(0, 48))}`,
    sourceLanguage: input.sourceLanguage ?? 'en',
    originalText: input.claim,
    provenanceRefs: input.evidenceRefs ?? [`ingest:${now}`],
    classification: input.partition === 'world' ? 'internal' : 'confidential',
    root,
  });
  const contentHash = lake.object.contentHash;
  const store = await load(root);
  const scoped = store.records.filter((item) => item.tenantId === input.tenantId && item.universeId === input.universeId);
  const duplicate = scoped.find((item) => item.contentHash === contentHash && item.polarity === polarity);

  const record: DistributedMemoryRecord = {
    id: duplicate?.id ?? `dmem_${contentHash.slice(0, 16)}`,
    tenantId: input.tenantId,
    universeId: input.universeId,
    partition: input.partition,
    memoryClass: classifyMemory({ polarity, founderRestricted: input.founderRestricted }),
    polarity,
    claim: input.claim.trim(),
    summary: (input.summary || input.claim).trim().slice(0, 4_000),
    contentHash,
    integrity: memoryIntegrity({
      tenantId: input.tenantId,
      universeId: input.universeId,
      contentHash,
      claim: input.claim.trim(),
    }),
    validFrom: input.validFrom ?? now,
    validTo: input.validTo,
    sourceRefs: duplicate
      ? [...new Set([...duplicate.sourceRefs, lake.object.id])]
      : [lake.object.id],
    evidenceRefs: [...(input.evidenceRefs ?? lake.object.provenanceRefs)],
    duplicateOf: duplicate?.id,
    poisonState: 'clean',
    founderRestricted: input.founderRestricted === true,
    sealed: false,
    productionAuthorization: false,
    createdAt: duplicate?.createdAt ?? now,
  };

  if (duplicate) {
    Object.assign(duplicate, {
      sourceRefs: record.sourceRefs,
      evidenceRefs: [...new Set([...duplicate.evidenceRefs, ...record.evidenceRefs])],
    });
  } else {
    store.records.push(record);
  }
  await writeJsonFileAtomic(storePath(root), { records: store.records.slice(-MAX_MEMORY_RECORDS) });

  await rememberCortexTrace({
    tenantId: input.tenantId,
    universeId: input.universeId,
    partition: input.partition,
    kind: record.memoryClass === 'contradiction' ? 'contradiction' : 'fact',
    claimState: record.contradictionId ? 'DISPUTED' : 'UNKNOWN',
    label: record.claim.slice(0, 120),
    summary: record.summary,
    validFrom: record.validFrom,
    validTo: record.validTo,
    evidenceRefs: record.evidenceRefs,
    sourceRefs: record.sourceRefs,
    classification: input.partition === 'personal' || input.partition === 'company' ? 'confidential' : 'internal',
    now,
    root,
  });

  return {
    record: duplicate ?? record,
    duplicate: Boolean(duplicate),
    lakeObjectId: lake.object.id,
    lakeDuplicate: lake.duplicate,
    hash: hashLakeContent(input.sourceLanguage ?? 'en', input.claim),
  };
}

export function claimsContradict(a: string, b: string) {
  const left = a.trim().toLowerCase();
  const right = b.trim().toLowerCase();
  if (!left || !right || left === right) return false;
  const negate = (text: string) =>
    text
      .replace(/\b(not|no|never|false)\b/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  const aNeg = /\b(not|no|never|false)\b/.test(left);
  const bNeg = /\b(not|no|never|false)\b/.test(right);
  return aNeg !== bNeg && negate(left) === negate(right);
}

export async function detectAndPreserveContradiction(input: {
  tenantId: string;
  universeId: string;
  partition: MemoryPartition;
  claimA: string;
  claimB: string;
  evidenceRefs: string[];
  root?: string;
}) {
  const contradict = claimsContradict(input.claimA, input.claimB);
  if (!contradict) {
    return { contradicted: false as const, dropped: false as const, bothRetained: true as const };
  }
  const first = await ingestEvidenceMemory({
    ...input,
    claim: input.claimA,
    summary: input.claimA,
    polarity: 'claim',
  });
  const second = await ingestEvidenceMemory({
    ...input,
    claim: input.claimB,
    summary: input.claimB,
    polarity: 'counterclaim',
  });
  await upsertPartitionedKnowledge({
    id: first.record.id,
    tenantId: input.tenantId,
    universeId: input.universeId,
    partition: input.partition,
    type: 'claim',
    domain: 'distributed-memory',
    label: input.claimA.slice(0, 120),
    summary: input.claimA,
    claimState: 'DISPUTED',
    sourceRefs: input.evidenceRefs,
    classification: 'internal',
    root: input.root,
  });
  await upsertPartitionedKnowledge({
    id: second.record.id,
    tenantId: input.tenantId,
    universeId: input.universeId,
    partition: input.partition,
    type: 'claim',
    domain: 'distributed-memory',
    label: input.claimB.slice(0, 120),
    summary: input.claimB,
    claimState: 'DISPUTED',
    sourceRefs: input.evidenceRefs,
    classification: 'internal',
    root: input.root,
  });
  const contradiction = await recordContradiction({
    tenantId: input.tenantId,
    universeId: input.universeId,
    partition: input.partition,
    claimA: first.record.id,
    claimB: second.record.id,
    evidenceRefs: input.evidenceRefs,
    root: input.root,
  });
  const root = input.root ?? process.cwd();
  const store = await load(root);
  for (const record of store.records) {
    if (record.id === first.record.id || record.id === second.record.id) {
      record.contradictionId = contradiction.id;
      record.memoryClass = 'contradiction';
    }
  }
  await writeJsonFileAtomic(storePath(root), { records: store.records.slice(-MAX_MEMORY_RECORDS) });
  return {
    contradicted: true as const,
    dropped: false as const,
    bothRetained: true as const,
    forgotten: false as const,
    contradiction,
    records: [first.record.id, second.record.id],
  };
}
