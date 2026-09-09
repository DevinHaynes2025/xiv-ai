/**
 * 62L-CW Distributed Model/Tool Experiment Graph —
 * Lineage graph for models, tools, algorithms, and experiments.
 * Nodes without lineage parent/metadata are DENIED.
 */

import { readJsonFile, writeJsonFileAtomic, xivLocalPath } from './durable-json';
import {
  CW_LOCKS,
  HONESTY_BANNER,
  LINEAGE_REQUIRED,
  MAX_EXPERIMENT_GRAPH_NODES,
  type CwActor,
  type ExperimentGraphNodeKind,
} from './autonomous-research-infrastructure-os-types';

export type ExperimentGraphNode = {
  id: string;
  kind: ExperimentGraphNodeKind;
  refId: string;
  parentNodeId: string | null;
  lineageComplete: boolean;
  metadata: Record<string, string>;
  status: 'DENIED' | 'LINEAGED' | 'CANDIDATE';
  reason: string;
  createdAt: string;
};

export type ExperimentGraphResult = {
  accepted: boolean;
  reason: string;
  node?: ExperimentGraphNode;
  at: string;
};

type Store = { nodes: ExperimentGraphNode[] };

function storePath(root: string) {
  return xivLocalPath(root, 'distributed-model-tool-experiment-graph.json');
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

function metadataComplete(metadata: Record<string, string> | undefined): boolean {
  if (!metadata) return false;
  const keys = Object.keys(metadata).filter((k) => metadata[k]?.trim());
  return keys.length > 0;
}

export function experimentGraphHonesty() {
  return {
    banner: HONESTY_BANNER,
    requiresLineage: CW_LOCKS.MODEL_TOOL_EXPERIMENT_REQUIRES_LINEAGE,
  };
}

export async function registerRootExperimentGraphNode(input: {
  kind: ExperimentGraphNodeKind;
  refId: string;
  metadata: Record<string, string>;
  root: string;
  actor: CwActor;
}): Promise<ExperimentGraphResult> {
  void input.actor;
  if (!metadataComplete(input.metadata)) {
    return {
      accepted: false,
      reason: LINEAGE_REQUIRED,
      at: new Date().toISOString(),
    };
  }
  const store = await load(input.root);
  if (store.nodes.length >= MAX_EXPERIMENT_GRAPH_NODES) {
    return {
      accepted: false,
      reason: 'MAX_EXPERIMENT_GRAPH_NODES_BOUNDED',
      at: new Date().toISOString(),
    };
  }
  const now = new Date().toISOString();
  const node: ExperimentGraphNode = {
    id: id('egn'),
    kind: input.kind,
    refId: input.refId.trim(),
    parentNodeId: null,
    lineageComplete: true,
    metadata: { ...input.metadata },
    status: 'LINEAGED',
    reason: 'ROOT_NODE_LINEAGED',
    createdAt: now,
  };
  store.nodes.push(node);
  await save(input.root, store);
  return { accepted: true, reason: node.reason, node, at: now };
}

export async function proposeExperimentGraphNode(input: {
  kind: ExperimentGraphNodeKind;
  refId: string;
  parentNodeId: string | null;
  metadata: Record<string, string>;
  root: string;
  actor: CwActor;
}): Promise<ExperimentGraphResult> {
  void input.actor;
  const store = await load(input.root);
  const now = new Date().toISOString();

  if (!input.parentNodeId || !metadataComplete(input.metadata)) {
    return {
      accepted: false,
      reason: LINEAGE_REQUIRED,
      at: now,
    };
  }
  const parent = store.nodes.find((n) => n.id === input.parentNodeId);
  if (!parent || parent.status === 'DENIED') {
    return {
      accepted: false,
      reason: LINEAGE_REQUIRED,
      at: now,
    };
  }
  if (store.nodes.length >= MAX_EXPERIMENT_GRAPH_NODES) {
    return {
      accepted: false,
      reason: 'MAX_EXPERIMENT_GRAPH_NODES_BOUNDED',
      at: now,
    };
  }
  const node: ExperimentGraphNode = {
    id: id('egn'),
    kind: input.kind,
    refId: input.refId.trim(),
    parentNodeId: parent.id,
    lineageComplete: true,
    metadata: { ...input.metadata },
    status: 'LINEAGED',
    reason: 'CHILD_NODE_LINEAGED',
    createdAt: now,
  };
  store.nodes.push(node);
  await save(input.root, store);
  return { accepted: true, reason: node.reason, node, at: now };
}

export async function listExperimentGraphNodes(root: string): Promise<ExperimentGraphNode[]> {
  const store = await load(root);
  return store.nodes;
}
