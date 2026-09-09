import { addKnowledgeEdge, knowledgeGraphStats, upsertKnowledgeNode, type KnowledgeNode } from './knowledge-graph';
import type { ClaimState } from './knowledge-domains';
import { cortexId, readJsonFile, writeJsonFileAtomic, xivLocalPath } from './cortex-store';
import type { MemoryPartition } from './memory-cortex';

export type KnowledgePartition = MemoryPartition;
export type ContradictionState =
  | 'OPEN'
  | 'INVESTIGATING'
  | 'PARTIALLY_RESOLVED'
  | 'RESOLVED'
  | 'UNRESOLVABLE'
  | 'STALE'
  | 'REOPENED';

export type PartitionedKnowledgeNode = KnowledgeNode & {
  partition: KnowledgePartition;
  tenantId: string;
  universeId: string;
};

export type ContradictionRecord = {
  id: string;
  tenantId: string;
  universeId: string;
  partition: KnowledgePartition;
  claimA: string;
  claimB: string;
  edgeId: string;
  state: ContradictionState;
  evidenceRefs: string[];
  history: Array<{ at: string; state: ContradictionState; note: string }>;
  createdAt: string;
  updatedAt: string;
  forgotten: false;
};

type WorldGraphIndex = {
  nodes: Array<{ id: string; partition: KnowledgePartition; tenantId: string; universeId: string }>;
  contradictions: ContradictionRecord[];
};

function indexPath(root: string) {
  return xivLocalPath(root, 'world-knowledge-index.json');
}

async function loadIndex(root: string): Promise<WorldGraphIndex> {
  const parsed = await readJsonFile<WorldGraphIndex>(indexPath(root), { nodes: [], contradictions: [] });
  return {
    nodes: Array.isArray(parsed.nodes) ? parsed.nodes : [],
    contradictions: Array.isArray(parsed.contradictions) ? parsed.contradictions : [],
  };
}

async function saveIndex(root: string, index: WorldGraphIndex) {
  await writeJsonFileAtomic(indexPath(root), {
    nodes: index.nodes.slice(-100_000),
    contradictions: index.contradictions.slice(-50_000),
  });
}

export async function upsertPartitionedKnowledge(input: {
  id: string;
  tenantId: string;
  universeId: string;
  partition: KnowledgePartition;
  type: KnowledgeNode['type'];
  domain: string;
  label: string;
  summary: string;
  claimState: ClaimState;
  sourceRefs: string[];
  confidence?: number;
  classification?: KnowledgeNode['classification'];
  root?: string;
}): Promise<PartitionedKnowledgeNode> {
  if (!input.tenantId || !input.universeId) throw new Error('TENANT_AND_UNIVERSE_REQUIRED');
  if (input.sourceRefs.length === 0) throw new Error('KNOWLEDGE_PROVENANCE_REQUIRED');
  if ((input.partition === 'personal' || input.partition === 'company') && input.classification === 'public') {
    throw new Error('PRIVATE_KNOWLEDGE_CANNOT_PROMOTE_TO_WORLD');
  }
  const root = input.root ?? process.cwd();
  const node = await upsertKnowledgeNode({
    id: input.id,
    type: input.type,
    domain: input.domain,
    label: input.label,
    summary: input.summary,
    claimState: input.claimState,
    sourceRefs: input.sourceRefs,
    confidence: input.confidence,
    classification: input.classification ?? (input.partition === 'world' ? 'internal' : 'confidential'),
  }, root);
  const index = await loadIndex(root);
  const existing = index.nodes.find((item) => item.id === input.id);
  if (existing) {
    if (existing.tenantId !== input.tenantId || existing.universeId !== input.universeId) {
      throw new Error('KNOWLEDGE_NODE_TENANT_MISMATCH');
    }
    existing.partition = input.partition;
  } else {
    index.nodes.push({
      id: input.id,
      partition: input.partition,
      tenantId: input.tenantId,
      universeId: input.universeId,
    });
  }
  await saveIndex(root, index);
  return { ...node, partition: input.partition, tenantId: input.tenantId, universeId: input.universeId };
}

export async function listPartitionedKnowledge(input: {
  tenantId: string;
  universeId: string;
  partition?: KnowledgePartition;
  root?: string;
}) {
  const index = await loadIndex(input.root ?? process.cwd());
  return index.nodes.filter((node) =>
    node.tenantId === input.tenantId &&
    node.universeId === input.universeId &&
    (!input.partition || node.partition === input.partition),
  );
}

export async function recordContradiction(input: {
  tenantId: string;
  universeId: string;
  partition: KnowledgePartition;
  claimA: string;
  claimB: string;
  evidenceRefs: string[];
  root?: string;
}): Promise<ContradictionRecord> {
  if (!input.tenantId || !input.universeId) throw new Error('TENANT_AND_UNIVERSE_REQUIRED');
  if (input.claimA === input.claimB) throw new Error('CONTRADICTION_REQUIRES_TWO_CLAIMS');
  const root = input.root ?? process.cwd();
  const edgeId = cortexId('ctr-edge');
  await addKnowledgeEdge({
    id: edgeId,
    from: input.claimA,
    to: input.claimB,
    type: 'CONTRADICTS',
    evidenceRefs: input.evidenceRefs,
  }, root);
  const now = new Date().toISOString();
  const record: ContradictionRecord = {
    id: cortexId('ctr'),
    tenantId: input.tenantId,
    universeId: input.universeId,
    partition: input.partition,
    claimA: input.claimA,
    claimB: input.claimB,
    edgeId,
    state: 'OPEN',
    evidenceRefs: [...input.evidenceRefs],
    history: [{ at: now, state: 'OPEN', note: 'Contradiction edge recorded. Both claims preserved.' }],
    createdAt: now,
    updatedAt: now,
    forgotten: false,
  };
  const index = await loadIndex(root);
  index.contradictions.push(record);
  await saveIndex(root, index);
  return record;
}

export async function transitionContradiction(input: {
  id: string;
  tenantId: string;
  universeId: string;
  state: ContradictionState;
  note: string;
  root?: string;
}) {
  const root = input.root ?? process.cwd();
  const index = await loadIndex(root);
  const record = index.contradictions.find((item) =>
    item.id === input.id && item.tenantId === input.tenantId && item.universeId === input.universeId,
  );
  if (!record) throw new Error('CONTRADICTION_NOT_FOUND');
  const now = new Date().toISOString();
  record.state = input.state;
  record.updatedAt = now;
  record.history.push({ at: now, state: input.state, note: input.note });
  record.forgotten = false;
  await saveIndex(root, index);
  return record;
}

export async function listContradictions(input: {
  tenantId: string;
  universeId: string;
  partition?: KnowledgePartition;
  root?: string;
}) {
  const index = await loadIndex(input.root ?? process.cwd());
  return index.contradictions.filter((item) =>
    item.tenantId === input.tenantId &&
    item.universeId === input.universeId &&
    (!input.partition || item.partition === input.partition),
  );
}

export async function worldKnowledgeStats(root = process.cwd()) {
  const [graph, index] = await Promise.all([knowledgeGraphStats(root), loadIndex(root)]);
  return {
    graph,
    partitionedNodes: index.nodes.length,
    contradictions: index.contradictions.length,
    openContradictions: index.contradictions.filter((item) => item.state === 'OPEN' || item.state === 'INVESTIGATING' || item.state === 'REOPENED').length,
    deletedContradictions: 0,
    productionAuthorization: false as const,
  };
}
