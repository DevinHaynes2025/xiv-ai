/**
 * 62L-CN International Data Corridor Graph —
 * Graph of approved corridors between configured endpoints.
 * Unapproved knowledge cannot enter; arbitrary discovery DENIED.
 */

import { readJsonFile, writeJsonFileAtomic, xivLocalPath } from './durable-json';
import {
  ARBITRARY_DISCOVERY_DENIED,
  CN_LOCKS,
  HONESTY_BANNER,
  UNAPPROVED_KNOWLEDGE_CORRIDOR_DENIED,
  UNCONFIGURED_ENDPOINT_DENIED,
  type CnActor,
} from './world-knowledge-routing-os-types';

export type CorridorNode = {
  id: string;
  endpointId: string;
  label: string;
  configured: boolean;
  jurisdiction: string;
  createdAt: string;
};

export type CorridorEdge = {
  id: string;
  fromNodeId: string;
  toNodeId: string;
  approved: boolean;
  trustWeight: number;
  latencyMs: number;
  costWeight: number;
  sealedAllowed: false;
  createdAt: string;
};

export type CorridorTransit = {
  id: string;
  corridorId: string | null;
  knowledgeApproved: boolean;
  accepted: boolean;
  reason: string;
  at: string;
};

type Store = {
  nodes: CorridorNode[];
  edges: CorridorEdge[];
  transits: CorridorTransit[];
};

function storePath(root: string) {
  return xivLocalPath(root, 'international-data-corridor-graph.json');
}

async function load(root: string): Promise<Store> {
  return readJsonFile<Store>(storePath(root), {
    nodes: [],
    edges: [],
    transits: [],
  });
}

async function save(root: string, store: Store) {
  await writeJsonFileAtomic(storePath(root), store);
}

function id(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function corridorGraphHonesty() {
  return {
    banner: HONESTY_BANNER,
    l4AutonomyEnabled: CN_LOCKS.L4_AUTONOMY_ENABLED,
    unapprovedKnowledgeInCorridor: CN_LOCKS.UNAPPROVED_KNOWLEDGE_IN_CORRIDOR,
    arbitraryEndpointDiscovery: CN_LOCKS.ARBITRARY_ENDPOINT_DISCOVERY,
    sealedSilentInternationalCorridor: CN_LOCKS.SEALED_SILENT_INTERNATIONAL_CORRIDOR,
    configuredEndpointsOnly: CN_LOCKS.CONFIGURED_ENDPOINTS_ONLY,
  };
}

export async function registerCorridorNode(input: {
  endpointId: string;
  label: string;
  configured?: boolean;
  jurisdiction: string;
  root: string;
  actor: CnActor;
}): Promise<CorridorNode> {
  void input.actor;
  const store = await load(input.root);
  const node: CorridorNode = {
    id: id('cnode'),
    endpointId: input.endpointId,
    label: input.label,
    configured: input.configured !== false,
    jurisdiction: input.jurisdiction,
    createdAt: new Date().toISOString(),
  };
  store.nodes.push(node);
  await save(input.root, store);
  return node;
}

export async function registerCorridor(input: {
  fromNodeId: string;
  toNodeId: string;
  approved?: boolean;
  trustWeight?: number;
  latencyMs?: number;
  costWeight?: number;
  root: string;
  actor: CnActor;
}): Promise<{ edge: CorridorEdge | null; accepted: boolean; reason: string }> {
  void input.actor;
  const store = await load(input.root);
  const from = store.nodes.find((n) => n.id === input.fromNodeId);
  const to = store.nodes.find((n) => n.id === input.toNodeId);
  if (!from || !to || !from.configured || !to.configured) {
    return {
      edge: null,
      accepted: false,
      reason: UNCONFIGURED_ENDPOINT_DENIED,
    };
  }
  const edge: CorridorEdge = {
    id: id('cedge'),
    fromNodeId: from.id,
    toNodeId: to.id,
    approved: input.approved !== false,
    trustWeight: Math.max(0, Math.min(100, input.trustWeight ?? 50)),
    latencyMs: Math.max(0, input.latencyMs ?? 100),
    costWeight: Math.max(0, input.costWeight ?? 1),
    sealedAllowed: false,
    createdAt: new Date().toISOString(),
  };
  store.edges.push(edge);
  await save(input.root, store);
  return { edge, accepted: true, reason: 'CORRIDOR_REGISTERED' };
}

export async function transitCorridor(input: {
  corridorId: string;
  knowledgeApproved: boolean;
  attemptDiscoverUnlistedEndpoint?: boolean;
  root: string;
  actor: CnActor;
}): Promise<CorridorTransit> {
  void input.actor;
  const store = await load(input.root);
  const now = new Date().toISOString();

  if (input.attemptDiscoverUnlistedEndpoint === true) {
    const transit: CorridorTransit = {
      id: id('ctransit'),
      corridorId: null,
      knowledgeApproved: input.knowledgeApproved,
      accepted: false,
      reason: ARBITRARY_DISCOVERY_DENIED,
      at: now,
    };
    store.transits.push(transit);
    await save(input.root, store);
    return transit;
  }

  const edge = store.edges.find((e) => e.id === input.corridorId);
  if (!edge || !edge.approved) {
    const transit: CorridorTransit = {
      id: id('ctransit'),
      corridorId: input.corridorId,
      knowledgeApproved: input.knowledgeApproved,
      accepted: false,
      reason: UNCONFIGURED_ENDPOINT_DENIED,
      at: now,
    };
    store.transits.push(transit);
    await save(input.root, store);
    return transit;
  }

  if (!input.knowledgeApproved) {
    const transit: CorridorTransit = {
      id: id('ctransit'),
      corridorId: edge.id,
      knowledgeApproved: false,
      accepted: false,
      reason: UNAPPROVED_KNOWLEDGE_CORRIDOR_DENIED,
      at: now,
    };
    store.transits.push(transit);
    await save(input.root, store);
    return transit;
  }

  const transit: CorridorTransit = {
    id: id('ctransit'),
    corridorId: edge.id,
    knowledgeApproved: true,
    accepted: true,
    reason: 'CORRIDOR_TRANSIT_ACCEPTED',
    at: now,
  };
  store.transits.push(transit);
  await save(input.root, store);
  return transit;
}
