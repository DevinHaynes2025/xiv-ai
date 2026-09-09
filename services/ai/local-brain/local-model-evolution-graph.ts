/**
 * 62L-CV Local Model Evolution Graph —
 * Lineage graph for local-model evolution candidates.
 * Parent + metadata required; sandbox until eval + human review.
 * Skill/tool grant ≠ permission escalation.
 */

import { readJsonFile, writeJsonFileAtomic, xivLocalPath } from './durable-json';
import {
  CV_LOCKS,
  HONESTY_BANNER,
  MAX_EVOLUTION_GRAPH_NODES,
  MODEL_LINEAGE_REQUIRED,
  MODEL_SANDBOX_UNTIL_REVIEW,
  SKILL_TOOL_NO_PERMISSION_ESCALATION,
  type CvActor,
} from './distributed-intelligence-laboratory-os-types';

export type ModelEvolutionNode = {
  id: string;
  modelId: string;
  parentNodeId: string | null;
  lineageComplete: boolean;
  metadata: Record<string, string>;
  status: 'DENIED' | 'SANDBOX' | 'EVAL_PASS' | 'HUMAN_REVIEW_PENDING' | 'APPROVED_CANDIDATE';
  permissionEscalation: false;
  productionAuthorized: false;
  reason: string;
  createdAt: string;
};

export type EvolutionResult = {
  accepted: boolean;
  reason: string;
  node?: ModelEvolutionNode;
  permissionLevelAfter?: number;
  at: string;
};

type Store = { nodes: ModelEvolutionNode[] };

function storePath(root: string) {
  return xivLocalPath(root, 'local-model-evolution-graph.json');
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

export function modelEvolutionGraphHonesty() {
  return {
    banner: HONESTY_BANNER,
    requiresLineage: CV_LOCKS.MODEL_EVOLUTION_REQUIRES_LINEAGE,
    sandboxUntilEvalReview: CV_LOCKS.MODEL_EVOLUTION_SANDBOX_UNTIL_EVAL_REVIEW,
    skillToolGrantIsPermission: CV_LOCKS.SKILL_TOOL_GRANT_IS_PERMISSION,
  };
}

export async function registerRootModelNode(input: {
  modelId: string;
  metadata: Record<string, string>;
  root: string;
  actor: CvActor;
}): Promise<EvolutionResult> {
  void input.actor;
  const store = await load(input.root);
  if (store.nodes.length >= MAX_EVOLUTION_GRAPH_NODES) {
    return {
      accepted: false,
      reason: 'MAX_EVOLUTION_GRAPH_NODES_BOUNDED',
      at: new Date().toISOString(),
    };
  }
  const metaKeys = Object.keys(input.metadata ?? {});
  if (metaKeys.length === 0) {
    return {
      accepted: false,
      reason: MODEL_LINEAGE_REQUIRED,
      at: new Date().toISOString(),
    };
  }
  const now = new Date().toISOString();
  const node: ModelEvolutionNode = {
    id: id('men'),
    modelId: input.modelId,
    parentNodeId: null,
    lineageComplete: true, // root is its own lineage origin with metadata
    metadata: { ...input.metadata, root: 'true' },
    status: 'SANDBOX',
    permissionEscalation: false,
    productionAuthorized: false,
    reason: MODEL_SANDBOX_UNTIL_REVIEW,
    createdAt: now,
  };
  store.nodes.push(node);
  await save(input.root, store);
  return { accepted: true, reason: MODEL_SANDBOX_UNTIL_REVIEW, node, at: now };
}

export async function proposeEvolutionNode(input: {
  modelId: string;
  parentNodeId?: string | null;
  metadata?: Record<string, string>;
  root: string;
  actor: CvActor;
}): Promise<EvolutionResult> {
  void input.actor;
  const store = await load(input.root);
  const now = new Date().toISOString();
  const parentId = input.parentNodeId?.trim() || null;
  const metadata = input.metadata ?? {};
  const metaKeys = Object.keys(metadata);

  if (!parentId || metaKeys.length === 0) {
    const denied: ModelEvolutionNode = {
      id: id('men'),
      modelId: input.modelId,
      parentNodeId: parentId,
      lineageComplete: false,
      metadata,
      status: 'DENIED',
      permissionEscalation: false,
      productionAuthorized: false,
      reason: MODEL_LINEAGE_REQUIRED,
      createdAt: now,
    };
    store.nodes.push(denied);
    await save(input.root, store);
    return { accepted: false, reason: MODEL_LINEAGE_REQUIRED, node: denied, at: now };
  }

  const parent = store.nodes.find((n) => n.id === parentId);
  if (!parent || parent.status === 'DENIED') {
    return {
      accepted: false,
      reason: MODEL_LINEAGE_REQUIRED,
      at: now,
    };
  }

  const node: ModelEvolutionNode = {
    id: id('men'),
    modelId: input.modelId,
    parentNodeId: parentId,
    lineageComplete: true,
    metadata,
    status: 'SANDBOX',
    permissionEscalation: false,
    productionAuthorized: false,
    reason: MODEL_SANDBOX_UNTIL_REVIEW,
    createdAt: now,
  };
  store.nodes.push(node);
  await save(input.root, store);
  return { accepted: true, reason: MODEL_SANDBOX_UNTIL_REVIEW, node, at: now };
}

export async function grantSkillOrToolOnEvolution(input: {
  nodeId: string;
  skillOrToolId: string;
  root: string;
  actor: CvActor;
}): Promise<EvolutionResult> {
  const store = await load(input.root);
  const node = store.nodes.find((n) => n.id === input.nodeId);
  const now = new Date().toISOString();
  if (!node) {
    return { accepted: false, reason: 'NODE_NOT_FOUND', at: now };
  }
  // Grant is recorded as metadata only — never escalates permission/authority.
  node.metadata = {
    ...node.metadata,
    lastSkillToolGrant: input.skillOrToolId,
  };
  await save(input.root, store);
  return {
    accepted: true,
    reason: SKILL_TOOL_NO_PERMISSION_ESCALATION,
    node,
    permissionLevelAfter: input.actor.permissionLevel, // unchanged
    at: now,
  };
}
