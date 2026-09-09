/**
 * 62L-DH Community Collaboration Graph —
 * Community collaboration edges; sharing is opt-in only.
 */

import { readJsonFile, writeJsonFileAtomic, xivLocalPath } from './durable-json';
import {
  COMMUNITY_SHARE_OPT_IN_DENIED,
  DH_LOCKS,
  HONESTY_BANNER,
  MAX_COMMUNITY_EDGES,
  type DhActor,
} from './adaptive-life-business-intelligence-os-types';

export type CommunityCollaborationGraph = {
  id: string;
  orgId: string;
  tenantId: string;
  universeId: string;
  createdAt: string;
};

export type CollaborationEdge = {
  id: string;
  graphId: string;
  fromNode: string;
  toNode: string;
  shareRequested: boolean;
  optIn: boolean;
  status: 'REGISTERED' | 'DENIED' | 'SHARED_OPT_IN';
  reason: string;
  at: string;
};

type Store = { graphs: CommunityCollaborationGraph[]; edges: CollaborationEdge[] };

function storePath(root: string) {
  return xivLocalPath(root, 'community-collaboration-graph.json');
}

async function load(root: string): Promise<Store> {
  return readJsonFile<Store>(storePath(root), { graphs: [], edges: [] });
}

async function save(root: string, store: Store) {
  await writeJsonFileAtomic(storePath(root), store);
}

function id(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function communityCollaborationGraphHonesty() {
  return {
    banner: HONESTY_BANNER,
    communityShareWithoutOptIn: DH_LOCKS.COMMUNITY_SHARE_WITHOUT_OPT_IN,
    communitySharingOptInOnly: DH_LOCKS.COMMUNITY_SHARING_OPT_IN_ONLY,
  };
}

export async function bootstrapCommunityCollaborationGraph(input: {
  orgId: string;
  tenantId: string;
  universeId: string;
  root: string;
  actor: DhActor;
}): Promise<CommunityCollaborationGraph> {
  void input.actor;
  const store = await load(input.root);
  const existing = store.graphs.find(
    (g) =>
      g.orgId === input.orgId &&
      g.tenantId === input.tenantId &&
      g.universeId === input.universeId,
  );
  if (existing) return existing;
  const graph: CommunityCollaborationGraph = {
    id: id('dhcg'),
    orgId: input.orgId,
    tenantId: input.tenantId,
    universeId: input.universeId,
    createdAt: new Date().toISOString(),
  };
  store.graphs.push(graph);
  await save(input.root, store);
  return graph;
}

export async function requestCommunityShare(input: {
  graphId: string;
  fromNode: string;
  toNode: string;
  optIn?: boolean;
  root: string;
  actor: DhActor;
}): Promise<{ accepted: boolean; reason: string; edge?: CollaborationEdge; at: string }> {
  void input.actor;
  const store = await load(input.root);
  const now = new Date().toISOString();
  const graph = store.graphs.find((g) => g.id === input.graphId);
  if (!graph) return { accepted: false, reason: 'COMMUNITY_GRAPH_NOT_FOUND', at: now };
  if (store.edges.length >= MAX_COMMUNITY_EDGES) {
    return { accepted: false, reason: 'MAX_COMMUNITY_EDGES_BOUNDED', at: now };
  }

  const optIn = input.optIn === true;

  if (!optIn) {
    const edge: CollaborationEdge = {
      id: id('dhce'),
      graphId: graph.id,
      fromNode: (input.fromNode ?? '').trim() || 'from',
      toNode: (input.toNode ?? '').trim() || 'to',
      shareRequested: true,
      optIn: false,
      status: 'DENIED',
      reason: COMMUNITY_SHARE_OPT_IN_DENIED,
      at: now,
    };
    store.edges.push(edge);
    await save(input.root, store);
    return { accepted: false, reason: edge.reason, edge, at: now };
  }

  const edge: CollaborationEdge = {
    id: id('dhce'),
    graphId: graph.id,
    fromNode: (input.fromNode ?? '').trim() || 'from',
    toNode: (input.toNode ?? '').trim() || 'to',
    shareRequested: true,
    optIn: true,
    status: 'SHARED_OPT_IN',
    reason: 'COMMUNITY_SHARE_ACCEPTED_WITH_EXPLICIT_OPT_IN',
    at: now,
  };
  store.edges.push(edge);
  await save(input.root, store);
  return { accepted: true, reason: edge.reason, edge, at: now };
}

export async function registerCollaborationEdge(input: {
  graphId: string;
  fromNode: string;
  toNode: string;
  root: string;
  actor: DhActor;
}): Promise<{ accepted: boolean; reason: string; edge?: CollaborationEdge; at: string }> {
  void input.actor;
  const store = await load(input.root);
  const now = new Date().toISOString();
  const graph = store.graphs.find((g) => g.id === input.graphId);
  if (!graph) return { accepted: false, reason: 'COMMUNITY_GRAPH_NOT_FOUND', at: now };
  if (store.edges.length >= MAX_COMMUNITY_EDGES) {
    return { accepted: false, reason: 'MAX_COMMUNITY_EDGES_BOUNDED', at: now };
  }
  const edge: CollaborationEdge = {
    id: id('dhce'),
    graphId: graph.id,
    fromNode: (input.fromNode ?? '').trim() || 'from',
    toNode: (input.toNode ?? '').trim() || 'to',
    shareRequested: false,
    optIn: false,
    status: 'REGISTERED',
    reason: 'COLLABORATION_EDGE_REGISTERED_NO_SHARE',
    at: now,
  };
  store.edges.push(edge);
  await save(input.root, store);
  return { accepted: true, reason: edge.reason, edge, at: now };
}
