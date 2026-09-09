import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';

import type { ClaimState } from './knowledge-domains';

export type KnowledgeNodeType = 'concept' | 'claim' | 'event' | 'entity' | 'skill' | 'decision' | 'outcome';
export type KnowledgeEdgeType = 'SUPPORTS' | 'CONTRADICTS' | 'RELATES_TO' | 'CAUSED_BY' | 'DERIVED_FROM' | 'AFFECTS' | 'PRECEDES';

export type KnowledgeNode = {
  id: string;
  type: KnowledgeNodeType;
  domain: string;
  label: string;
  summary: string;
  claimState: ClaimState;
  sourceRefs: string[];
  confidence?: number;
  classification: 'public' | 'internal' | 'confidential' | 'restricted';
  createdAt: string;
  updatedAt: string;
};

export type KnowledgeEdge = {
  id: string;
  from: string;
  to: string;
  type: KnowledgeEdgeType;
  evidenceRefs: string[];
  createdAt: string;
};

type GraphState = { nodes: KnowledgeNode[]; edges: KnowledgeEdge[] };

function graphPath(root = process.cwd()) {
  return join(root, '.xiv-local', 'knowledge-graph.json');
}

async function load(root?: string): Promise<GraphState> {
  try {
    const raw = await readFile(graphPath(root), 'utf8');
    const parsed = JSON.parse(raw) as Partial<GraphState>;
    return { nodes: Array.isArray(parsed.nodes) ? parsed.nodes : [], edges: Array.isArray(parsed.edges) ? parsed.edges : [] };
  } catch {
    return { nodes: [], edges: [] };
  }
}

async function save(state: GraphState, root?: string) {
  const path = graphPath(root);
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, JSON.stringify(state, null, 2), { encoding: 'utf8', mode: 0o600 });
}

export async function upsertKnowledgeNode(input: Omit<KnowledgeNode, 'createdAt' | 'updatedAt'>, root?: string) {
  const state = await load(root);
  const now = new Date().toISOString();
  const index = state.nodes.findIndex((node) => node.id === input.id);
  const next: KnowledgeNode = {
    ...input,
    confidence: input.confidence === undefined ? undefined : Math.max(0, Math.min(1, input.confidence)),
    createdAt: index >= 0 ? state.nodes[index].createdAt : now,
    updatedAt: now,
  };
  if (index >= 0) state.nodes[index] = next;
  else state.nodes.push(next);
  await save({ nodes: state.nodes.slice(-100_000), edges: state.edges }, root);
  return next;
}

export async function addKnowledgeEdge(input: Omit<KnowledgeEdge, 'createdAt'>, root?: string) {
  const state = await load(root);
  if (!state.nodes.some((node) => node.id === input.from) || !state.nodes.some((node) => node.id === input.to)) {
    throw new Error('Knowledge edge endpoints must exist before an edge can be created.');
  }
  const edge: KnowledgeEdge = { ...input, createdAt: new Date().toISOString() };
  if (!state.edges.some((candidate) => candidate.id === edge.id)) state.edges.push(edge);
  await save({ nodes: state.nodes, edges: state.edges.slice(-250_000) }, root);
  return edge;
}

export async function searchKnowledgeGraph(query: string, root?: string) {
  const state = await load(root);
  const needle = query.trim().toLowerCase();
  const nodes = needle
    ? state.nodes.filter((node) => `${node.domain} ${node.label} ${node.summary}`.toLowerCase().includes(needle)).slice(-100)
    : state.nodes.slice(-100);
  const ids = new Set(nodes.map((node) => node.id));
  return { nodes, edges: state.edges.filter((edge) => ids.has(edge.from) || ids.has(edge.to)).slice(-250) };
}

export async function knowledgeGraphStats(root?: string) {
  const state = await load(root);
  const contradictions = state.edges.filter((edge) => edge.type === 'CONTRADICTS').length;
  return { nodes: state.nodes.length, edges: state.edges.length, contradictions };
}
