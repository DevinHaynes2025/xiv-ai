/**
 * 62L-CP Plugin-composed Regional Data Refinery Nodes —
 * compose refinery pipelines from approved plugins (builds on CF/CG).
 * Authorized only; no arbitrary discovery; unapproved composition DENIED.
 */

import { readJsonFile, writeJsonFileAtomic, xivLocalPath } from './durable-json';
import {
  ARBITRARY_REFINERY_DISCOVERY_DENIED,
  CP_LOCKS,
  HONESTY_BANNER,
  UNAPPROVED_REFINERY_DENIED,
  type CpActor,
} from './knowledge-supply-plugin-foundry-types';

export type RefineryNode = {
  id: string;
  regionCode: string;
  label: string;
  authorized: boolean;
  buildsOnCfCg: boolean;
  pluginIds: string[];
  status: 'available' | 'unavailable' | 'denied' | 'candidate';
  reason: string;
  createdAt: string;
};

export type CompositionAttempt = {
  id: string;
  nodeId: string | null;
  pluginIds: string[];
  approvedPluginsOnly: boolean;
  status: 'composed' | 'denied';
  reason: string;
  at: string;
};

export type DiscoveryAttempt = {
  id: string;
  target: string;
  status: 'denied';
  reason: string;
  at: string;
};

type Store = {
  nodes: RefineryNode[];
  compositions: CompositionAttempt[];
  discoveries: DiscoveryAttempt[];
  approvedPluginIds: string[];
};

function storePath(root: string) {
  return xivLocalPath(root, 'plugin-composed-regional-data-refinery-nodes.json');
}

async function load(root: string): Promise<Store> {
  return readJsonFile<Store>(storePath(root), {
    nodes: [],
    compositions: [],
    discoveries: [],
    approvedPluginIds: [],
  });
}

async function save(root: string, store: Store) {
  await writeJsonFileAtomic(storePath(root), store);
}

function id(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function refineryNodesHonesty() {
  return {
    banner: HONESTY_BANNER,
    arbitraryDiscovery: CP_LOCKS.ARBITRARY_REFINERY_DISCOVERY,
    unapprovedComposition: CP_LOCKS.UNAPPROVED_REFINERY_COMPOSITION,
    buildsOnCfCg: true,
  };
}

export async function markPluginApprovedForRefinery(input: {
  pluginId: string;
  root: string;
  actor: CpActor;
}): Promise<{ accepted: boolean; reason: string }> {
  const store = await load(input.root);
  void input.actor;
  if (!store.approvedPluginIds.includes(input.pluginId)) {
    store.approvedPluginIds.push(input.pluginId);
  }
  await save(input.root, store);
  return { accepted: true, reason: 'PLUGIN_APPROVED_FOR_REFINERY_COMPOSITION' };
}

export async function authorizeRefineryNode(input: {
  regionCode: string;
  label: string;
  authorized?: boolean;
  root: string;
  actor: CpActor;
}): Promise<RefineryNode> {
  const store = await load(input.root);
  const authorized = input.authorized === true;
  const node: RefineryNode = {
    id: id('rnode'),
    regionCode: input.regionCode,
    label: input.label,
    authorized,
    buildsOnCfCg: true,
    pluginIds: [],
    status: authorized ? 'available' : 'unavailable',
    reason: authorized
      ? 'REFINERY_NODE_AUTHORIZED_BUILDS_ON_CF_CG'
      : UNAPPROVED_REFINERY_DENIED,
    createdAt: new Date().toISOString(),
  };
  void input.actor;
  store.nodes.push(node);
  await save(input.root, store);
  return node;
}

export async function composeRefineryPipeline(input: {
  nodeId: string;
  pluginIds: string[];
  root: string;
  actor: CpActor;
}): Promise<CompositionAttempt> {
  const store = await load(input.root);
  const node = store.nodes.find((n) => n.id === input.nodeId) ?? null;
  void input.actor;

  if (!node || !node.authorized) {
    const attempt: CompositionAttempt = {
      id: id('comp'),
      nodeId: input.nodeId,
      pluginIds: input.pluginIds,
      approvedPluginsOnly: false,
      status: 'denied',
      reason: UNAPPROVED_REFINERY_DENIED,
      at: new Date().toISOString(),
    };
    store.compositions.push(attempt);
    await save(input.root, store);
    return attempt;
  }

  const allApproved = input.pluginIds.every((pid) =>
    store.approvedPluginIds.includes(pid),
  );
  if (!allApproved || input.pluginIds.length === 0) {
    const attempt: CompositionAttempt = {
      id: id('comp'),
      nodeId: node.id,
      pluginIds: input.pluginIds,
      approvedPluginsOnly: false,
      status: 'denied',
      reason: UNAPPROVED_REFINERY_DENIED,
      at: new Date().toISOString(),
    };
    store.compositions.push(attempt);
    await save(input.root, store);
    return attempt;
  }

  node.pluginIds = [...input.pluginIds];
  node.status = 'available';
  node.reason = 'REFINERY_PIPELINE_COMPOSED_FROM_APPROVED_PLUGINS';
  const attempt: CompositionAttempt = {
    id: id('comp'),
    nodeId: node.id,
    pluginIds: input.pluginIds,
    approvedPluginsOnly: true,
    status: 'composed',
    reason: node.reason,
    at: new Date().toISOString(),
  };
  store.compositions.push(attempt);
  await save(input.root, store);
  return attempt;
}

export async function attemptArbitraryRefineryDiscovery(input: {
  target: string;
  root: string;
  actor: CpActor;
}): Promise<DiscoveryAttempt> {
  const store = await load(input.root);
  const attempt: DiscoveryAttempt = {
    id: id('rdisc'),
    target: input.target,
    status: 'denied',
    reason: ARBITRARY_REFINERY_DISCOVERY_DENIED,
    at: new Date().toISOString(),
  };
  void input.actor;
  store.discoveries.push(attempt);
  await save(input.root, store);
  return attempt;
}
