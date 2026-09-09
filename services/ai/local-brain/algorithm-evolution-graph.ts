/**
 * 62L-CU Algorithm Evolution Graph — algorithm lineage + negative-result
 * tracking. Variants must retain parent lineage links.
 */

import { readJsonFile, writeJsonFileAtomic, xivLocalPath } from './durable-json';
import {
  ALGORITHM_LINEAGE_REQUIRED,
  CU_LOCKS,
  HONESTY_BANNER,
  NEGATIVE_RESULT_KEPT_SEARCHABLE,
  type CuActor,
} from './cognitive-research-cloud-types';

export type AlgorithmNode = {
  id: string;
  name: string;
  parentId: string | null;
  lineageRootId: string;
  lineageDepth: number;
  outcome: 'positive' | 'negative' | 'candidate' | 'baseline';
  negativeKept: boolean;
  searchable: true;
  reason: string;
  createdAt: string;
};

export type LineageEdge = {
  childId: string;
  parentId: string;
  lineageRootId: string;
};

type Store = {
  nodes: AlgorithmNode[];
};

function storePath(root: string) {
  return xivLocalPath(root, 'algorithm-evolution-graph.json');
}

async function load(root: string): Promise<Store> {
  return readJsonFile<Store>(storePath(root), { nodes: [] });
}

async function save(root: string, store: Store) {
  await writeJsonFileAtomic(storePath(root), store);
}

function id(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function algorithmEvolutionGraphHonesty() {
  return {
    banner: HONESTY_BANNER,
    variantsCarryLineage: CU_LOCKS.ALGORITHM_VARIANTS_CARRY_LINEAGE,
    negativeSearchable: CU_LOCKS.NEGATIVE_RESULTS_SEARCHABLE,
  };
}

export async function registerBaselineAlgorithm(input: {
  name: string;
  root: string;
  actor: CuActor;
}): Promise<AlgorithmNode> {
  const store = await load(input.root);
  void input.actor;
  const nodeId = id('algo');
  const node: AlgorithmNode = {
    id: nodeId,
    name: input.name.trim(),
    parentId: null,
    lineageRootId: nodeId,
    lineageDepth: 0,
    outcome: 'baseline',
    negativeKept: false,
    searchable: true,
    reason: 'ALGORITHM_BASELINE_REGISTERED',
    createdAt: new Date().toISOString(),
  };
  store.nodes.push(node);
  await save(input.root, store);
  return node;
}

export async function spawnAlgorithmVariant(input: {
  name: string;
  parentId: string;
  outcome?: 'positive' | 'negative' | 'candidate';
  root: string;
  actor: CuActor;
}): Promise<AlgorithmNode | { status: 'denied'; reason: string }> {
  const store = await load(input.root);
  void input.actor;
  const parent = store.nodes.find((n) => n.id === input.parentId);
  if (!parent) {
    return { status: 'denied', reason: ALGORITHM_LINEAGE_REQUIRED };
  }

  const outcome = input.outcome ?? 'candidate';
  const node: AlgorithmNode = {
    id: id('algo'),
    name: input.name.trim(),
    parentId: parent.id,
    lineageRootId: parent.lineageRootId,
    lineageDepth: parent.lineageDepth + 1,
    outcome,
    negativeKept: outcome === 'negative',
    searchable: true,
    reason:
      outcome === 'negative'
        ? `${ALGORITHM_LINEAGE_REQUIRED};${NEGATIVE_RESULT_KEPT_SEARCHABLE}`
        : ALGORITHM_LINEAGE_REQUIRED,
    createdAt: new Date().toISOString(),
  };
  store.nodes.push(node);
  await save(input.root, store);
  return node;
}

export async function getAlgorithmLineage(input: {
  algorithmId: string;
  root: string;
  actor: CuActor;
}): Promise<{ node: AlgorithmNode | null; edges: LineageEdge[]; parentLinkIntact: boolean }> {
  const store = await load(input.root);
  void input.actor;
  const node = store.nodes.find((n) => n.id === input.algorithmId) ?? null;
  if (!node) return { node: null, edges: [], parentLinkIntact: false };

  const lineage = store.nodes.filter((n) => n.lineageRootId === node.lineageRootId);
  const edges: LineageEdge[] = lineage
    .filter((n) => n.parentId)
    .map((n) => ({
      childId: n.id,
      parentId: n.parentId as string,
      lineageRootId: n.lineageRootId,
    }));

  const parentLinkIntact =
    node.parentId === null
      ? node.lineageDepth === 0
      : edges.some((e) => e.childId === node.id && e.parentId === node.parentId);

  return { node, edges, parentLinkIntact };
}

export async function searchNegativeAlgorithmVariants(input: {
  query?: string;
  root: string;
  actor: CuActor;
}): Promise<AlgorithmNode[]> {
  const store = await load(input.root);
  void input.actor;
  const q = (input.query ?? '').trim().toLowerCase();
  return store.nodes.filter(
    (n) =>
      n.outcome === 'negative' &&
      n.negativeKept &&
      n.searchable &&
      (q ? n.name.toLowerCase().includes(q) : true),
  );
}
