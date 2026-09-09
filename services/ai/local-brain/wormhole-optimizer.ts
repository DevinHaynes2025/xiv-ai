import { GlobalBrainHighways } from './global-brain-highways';
import { NeuralFabric } from './neural-fabric';
import { redactSealedFields, SEALED_REDACTION } from './ceo-sealed-vault';
import type { EnsEvidenceState, EnsGraphEndpoint, WormholeBoundaryKind } from './enterprise-nervous-types';

export type AuthorizedHop = {
  from: string;
  to: string;
  authorized: true;
};

export type WormholeProposal = {
  id: string;
  from: string;
  to: string;
  path: string[];
  hopsSaved: number;
  bypassedBoundary: false;
  tunnelsThroughSecurity: false;
  sealedPayload: typeof SEALED_REDACTION;
  state: EnsEvidenceState;
  reason: string;
};

type GraphState = {
  endpoints: Map<string, EnsGraphEndpoint>;
  edges: AuthorizedHop[];
  sealedGrants: Set<string>;
};

const graphs = new Map<string, GraphState>();

function graphKey(tenantId: string, universeId: string) {
  return `${tenantId}::${universeId}`;
}

function graphOf(tenantId: string, universeId: string): GraphState {
  const key = graphKey(tenantId, universeId);
  let graph = graphs.get(key);
  if (!graph) {
    graph = { endpoints: new Map(), edges: [], sealedGrants: new Set() };
    graphs.set(key, graph);
  }
  return graph;
}

export function resetWormholesForTests() {
  graphs.clear();
}

export function registerEnsEndpoint(endpoint: EnsGraphEndpoint) {
  const graph = graphOf(endpoint.tenantId, endpoint.universeId);
  graph.endpoints.set(endpoint.id, { ...endpoint });
  return endpoint;
}

export function grantSealedWormholeRead(input: { tenantId: string; universeId: string; endpointId: string; actorId: string }) {
  const graph = graphOf(input.tenantId, input.universeId);
  graph.sealedGrants.add(`${input.actorId}->${input.endpointId}`);
}

export function connectAuthorizedHop(input: {
  tenantId: string;
  universeId: string;
  from: string;
  to: string;
}): { accepted: boolean; state: EnsEvidenceState; reason: string } {
  const graph = graphOf(input.tenantId, input.universeId);
  const from = graph.endpoints.get(input.from);
  const to = graph.endpoints.get(input.to);
  if (!from || !to) return { accepted: false, state: 'FAIL', reason: 'ENDPOINT_NOT_REGISTERED' };
  if (from.tenantId !== to.tenantId) return { accepted: false, state: 'FAIL', reason: 'TENANT_ISOLATION' };
  if (from.universeId !== to.universeId) return { accepted: false, state: 'FAIL', reason: 'UNIVERSE_BOUNDARY' };
  graph.edges.push({ from: from.id, to: to.id, authorized: true });
  return { accepted: true, state: 'PASS', reason: 'AUTHORIZED_HOP' };
}

function neighbors(graph: GraphState, id: string) {
  return graph.edges.filter((edge) => edge.from === id).map((edge) => edge.to);
}

function shortestAuthorizedPath(graph: GraphState, from: string, to: string): string[] | null {
  if (from === to) return [from];
  const queue: string[][] = [[from]];
  const seen = new Set([from]);
  while (queue.length) {
    const path = queue.shift()!;
    const last = path[path.length - 1];
    for (const next of neighbors(graph, last)) {
      if (seen.has(next)) continue;
      const nextPath = [...path, next];
      if (next === to) return nextPath;
      seen.add(next);
      queue.push(nextPath);
    }
  }
  return null;
}

function boundaryOnPath(
  graph: GraphState,
  path: string[],
  actor: { tenantId: string; universeId: string; id: string; guardianAuthorized?: boolean },
): WormholeBoundaryKind | null {
  for (const id of path) {
    const node = graph.endpoints.get(id);
    if (!node) return 'owner';
    if (node.tenantId !== actor.tenantId) return 'tenant';
    if (node.universeId !== actor.universeId) return 'universe';
    if (node.rlsProtected && node.tenantId !== actor.tenantId) return 'rls';
    if (node.guardianProtected && actor.guardianAuthorized !== true) return 'guardian';
    if (node.sealed && !graph.sealedGrants.has(`${actor.id}->${node.id}`)) return 'sealed';
    if (node.ownerId !== actor.tenantId && node.classification === 'restricted' && node.ownerId !== actor.id) {
      return 'owner';
    }
  }
  return null;
}

export function proposeWormholeShortcut(input: {
  tenantId: string;
  universeId: string;
  from: string;
  to: string;
  actorId: string;
  guardianAuthorized?: boolean;
  skipNodes?: string[];
  sealedPayload?: string;
}): WormholeProposal {
  const graph = graphOf(input.tenantId, input.universeId);
  const from = graph.endpoints.get(input.from);
  const to = graph.endpoints.get(input.to);

  const deny = (reason: string): WormholeProposal => ({
    id: `wh_denied`,
    from: input.from,
    to: input.to,
    path: [],
    hopsSaved: 0,
    bypassedBoundary: false,
    tunnelsThroughSecurity: false,
    sealedPayload: SEALED_REDACTION,
    state: 'FAIL',
    reason,
  });

  if (!from || !to) return deny('ENDPOINT_NOT_REGISTERED');
  if (from.tenantId !== input.tenantId || to.tenantId !== input.tenantId) return deny('TENANT_ISOLATION');
  if (from.universeId !== input.universeId || to.universeId !== input.universeId) return deny('UNIVERSE_BOUNDARY');

  const actor = {
    tenantId: input.tenantId,
    universeId: input.universeId,
    id: input.actorId,
    guardianAuthorized: input.guardianAuthorized,
  };

  if (input.skipNodes?.length) {
    return deny('WORMHOLE_MAY_NOT_SKIP_BOUNDARY_NODES');
  }

  const path = shortestAuthorizedPath(graph, input.from, input.to);
  if (!path) return deny('NO_AUTHORIZED_PATH');

  const blocked = boundaryOnPath(graph, path, actor);
  if (blocked) return deny(`BOUNDARY_RESPECT:${blocked.toUpperCase()}`);

  if (input.sealedPayload) {
    redactSealedFields({ sealedPayload: input.sealedPayload, payload: input.sealedPayload });
  }

  const hopsSaved = Math.max(0, path.length - 2);
  return {
    id: `wh_${input.from}_${input.to}`,
    from: input.from,
    to: input.to,
    path,
    hopsSaved,
    bypassedBoundary: false,
    tunnelsThroughSecurity: false,
    sealedPayload: SEALED_REDACTION,
    state: 'PASS',
    reason: hopsSaved > 0 ? 'AUTHORIZED_SHORTCUT' : 'AUTHORIZED_DIRECT_HOP',
  };
}

export function applyWormholeToHighways(input: {
  tenantId: string;
  universeId: string;
  fromLane: 'knowledge' | 'agent_team' | 'decision';
  toLane: 'knowledge' | 'agent_team' | 'decision' | 'evidence';
  topic: string;
}) {
  const highways = new GlobalBrainHighways();
  highways.ensureScope(input.tenantId, input.universeId);
  return highways.route({
    tenantId: input.tenantId,
    universeId: input.universeId,
    fromLane: input.fromLane,
    toLane: input.toLane,
    topic: input.topic,
    body: 'logical shortcut over authorized highway lanes',
    evidenceRefs: ['62L-AQ:wormhole'],
  });
}

export function logicalFabricStats() {
  const fabric = new NeuralFabric();
  return fabric.stats();
}

export function attemptCrossTenantWormhole(input: {
  fromTenant: string;
  toTenant: string;
  from: EnsGraphEndpoint;
  to: EnsGraphEndpoint;
  actorId: string;
}): WormholeProposal {
  registerEnsEndpoint(input.from);
  registerEnsEndpoint(input.to);
  return proposeWormholeShortcut({
    tenantId: input.fromTenant,
    universeId: input.from.universeId,
    from: input.from.id,
    to: input.to.id,
    actorId: input.actorId,
  });
}
