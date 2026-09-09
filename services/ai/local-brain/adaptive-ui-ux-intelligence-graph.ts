/**
 * 62L-DI Adaptive UI/UX Intelligence Graph — explainable/reversible; no authority self-grant.
 */
import { readJsonFile, writeJsonFileAtomic, xivLocalPath } from './durable-json';
import {
  DI_LOCKS, HONESTY_BANNER, MAX_UX_GRAPH_NODES, UX_GRAPH_AUTHORITY_SELF_GRANT_DENIED, type DiActor,
} from './personalized-intelligence-companion-os-types';

export type UxGraphNode = {
  id: string; graphId: string; nodeKey: string; preferenceValue: string;
  explainable: true; reversible: true; previousValue: string | null;
  status: 'APPLIED' | 'REVERSED' | 'DENIED'; reason: string; at: string;
};
export type UxAuthorityAttempt = {
  id: string; graphId: string; requestSelfGrantAuthority: boolean; status: 'DENIED'; reason: string; at: string;
};
export type AdaptiveUiUxIntelligenceGraph = { id: string; orgId: string; tenantId: string; universeId: string; createdAt: string };
type Store = { graphs: AdaptiveUiUxIntelligenceGraph[]; nodes: UxGraphNode[]; authorityAttempts: UxAuthorityAttempt[] };

function storePath(root: string) { return xivLocalPath(root, 'adaptive-ui-ux-intelligence-graph.json'); }
async function load(root: string): Promise<Store> {
  return readJsonFile<Store>(storePath(root), { graphs: [], nodes: [], authorityAttempts: [] });
}
async function save(root: string, store: Store) { await writeJsonFileAtomic(storePath(root), store); }
function id(prefix: string) { return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`; }

export function adaptiveUiUxIntelligenceGraphHonesty() {
  return {
    banner: HONESTY_BANNER,
    uxGraphSelfGrantsAgentAuthority: DI_LOCKS.UX_GRAPH_SELF_GRANTS_AGENT_AUTHORITY,
    uxGraphMustBeExplainable: DI_LOCKS.UX_GRAPH_MUST_BE_EXPLAINABLE,
    uxGraphMustBeReversible: DI_LOCKS.UX_GRAPH_MUST_BE_REVERSIBLE,
    learningGrantsPermission: DI_LOCKS.LEARNING_GRANTS_PERMISSION,
  };
}

export async function bootstrapAdaptiveUiUxIntelligenceGraph(input: {
  orgId: string; tenantId: string; universeId: string; root: string; actor: DiActor;
}): Promise<AdaptiveUiUxIntelligenceGraph> {
  void input.actor;
  const store = await load(input.root);
  const existing = store.graphs.find((g) => g.orgId === input.orgId && g.tenantId === input.tenantId && g.universeId === input.universeId);
  if (existing) return existing;
  const graph: AdaptiveUiUxIntelligenceGraph = { id: id('diuxg'), orgId: input.orgId, tenantId: input.tenantId, universeId: input.universeId, createdAt: new Date().toISOString() };
  store.graphs.push(graph); await save(input.root, store); return graph;
}

export async function applyUxGraphPreference(input: {
  graphId: string; nodeKey: string; preferenceValue: string; root: string; actor: DiActor;
}): Promise<{ accepted: boolean; reason: string; node?: UxGraphNode }> {
  void input.actor;
  const store = await load(input.root);
  const now = new Date().toISOString();
  const graph = store.graphs.find((g) => g.id === input.graphId);
  if (!graph) return { accepted: false, reason: 'UX_GRAPH_NOT_FOUND' };
  if (store.nodes.length >= MAX_UX_GRAPH_NODES) return { accepted: false, reason: 'MAX_UX_GRAPH_NODES_BOUNDED' };
  const prior = [...store.nodes].reverse().find((n) => n.graphId === graph.id && n.nodeKey === input.nodeKey && n.status === 'APPLIED');
  const node: UxGraphNode = {
    id: id('diuxn'), graphId: graph.id, nodeKey: input.nodeKey.trim() || 'pref', preferenceValue: input.preferenceValue,
    explainable: true, reversible: true, previousValue: prior?.preferenceValue ?? null,
    status: 'APPLIED', reason: 'UX_GRAPH_PREFERENCE_APPLIED_EXPLAINABLE_REVERSIBLE', at: now,
  };
  store.nodes.push(node); await save(input.root, store);
  return { accepted: true, reason: 'UX_GRAPH_PREFERENCE_APPLIED', node };
}

export async function reverseUxGraphPreference(input: {
  nodeId: string; root: string; actor: DiActor;
}): Promise<{ accepted: boolean; reason: string; node?: UxGraphNode }> {
  void input.actor;
  const store = await load(input.root);
  const now = new Date().toISOString();
  const node = store.nodes.find((n) => n.id === input.nodeId);
  if (!node) return { accepted: false, reason: 'UX_GRAPH_NODE_NOT_FOUND' };
  if (!node.reversible) return { accepted: false, reason: 'UX_GRAPH_NODE_NOT_REVERSIBLE' };
  const reversed: UxGraphNode = {
    id: id('diuxn'), graphId: node.graphId, nodeKey: node.nodeKey, preferenceValue: node.previousValue ?? 'DEFAULT',
    explainable: true, reversible: true, previousValue: node.preferenceValue,
    status: 'REVERSED', reason: 'UX_GRAPH_PREFERENCE_REVERSED', at: now,
  };
  node.status = 'REVERSED'; store.nodes.push(reversed); await save(input.root, store);
  return { accepted: true, reason: 'UX_GRAPH_PREFERENCE_REVERSED', node: reversed };
}

export async function attemptUxGraphAuthoritySelfGrant(input: {
  graphId: string; root: string; actor: DiActor;
}): Promise<{ accepted: boolean; reason: string; attempt?: UxAuthorityAttempt }> {
  void input.actor;
  const store = await load(input.root);
  const now = new Date().toISOString();
  const graph = store.graphs.find((g) => g.id === input.graphId);
  if (!graph) return { accepted: false, reason: 'UX_GRAPH_NOT_FOUND' };
  const attempt: UxAuthorityAttempt = {
    id: id('diuxa'), graphId: graph.id, requestSelfGrantAuthority: true, status: 'DENIED',
    reason: UX_GRAPH_AUTHORITY_SELF_GRANT_DENIED, at: now,
  };
  store.authorityAttempts.push(attempt); await save(input.root, store);
  return { accepted: false, reason: UX_GRAPH_AUTHORITY_SELF_GRANT_DENIED, attempt };
}
