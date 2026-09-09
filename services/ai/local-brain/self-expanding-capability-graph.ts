/**
 * 62L-DP Self-Expanding Capability Graph —
 * Evidence-backed capability graph growth without silent authority expansion.
 * Graph growth does NOT auto-grant new permissions.
 */

import { readJsonFile, writeJsonFileAtomic, xivLocalPath } from './durable-json';
import {
  CAPABILITY_GROWTH_NO_AUTO_GRANT,
  MAX_CAPABILITY_NODES,
  type DpActor,
  type PermissionScope,
} from './plugin-civilization-os-types';

export type CapabilityNode = {
  id: string;
  capability: string;
  pluginId: string | null;
  evidenceRef: string | null;
  discoveredAt: string;
  grantsPermissions: false;
  autoGrantedScopes: [];
  reason: string;
};

export type CapabilityGrowthEvent = {
  id: string;
  nodeId: string;
  requestedAutoGrantScopes: PermissionScope[];
  status: 'recorded' | 'denied_auto_grant';
  grantedScopes: [];
  reason: string;
  at: string;
};

type Store = {
  nodes: CapabilityNode[];
  growth: CapabilityGrowthEvent[];
};

function storePath(root: string) {
  return xivLocalPath(root, 'self-expanding-capability-graph.json');
}

async function load(root: string): Promise<Store> {
  return readJsonFile<Store>(storePath(root), { nodes: [], growth: [] });
}

async function save(root: string, store: Store) {
  await writeJsonFileAtomic(storePath(root), store);
}

function id(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function selfExpandingCapabilityGraphHonesty() {
  return {
    growthAutoGrantsPermissions: false,
    evidenceBacked: true,
    silentAuthorityExpansion: false,
  };
}

export async function growCapabilityGraph(input: {
  capability: string;
  pluginId?: string | null;
  evidenceRef?: string | null;
  requestedAutoGrantScopes?: PermissionScope[];
  root: string;
  actor: DpActor;
}): Promise<{ node: CapabilityNode; growth: CapabilityGrowthEvent }> {
  const store = await load(input.root);
  void input.actor;
  if (store.nodes.length >= MAX_CAPABILITY_NODES) {
    throw new Error('MAX_CAPABILITY_NODES_REACHED');
  }

  const node: CapabilityNode = {
    id: id('dpcap'),
    capability: input.capability.trim(),
    pluginId: input.pluginId ?? null,
    evidenceRef: input.evidenceRef ?? null,
    discoveredAt: new Date().toISOString(),
    grantsPermissions: false,
    autoGrantedScopes: [],
    reason: CAPABILITY_GROWTH_NO_AUTO_GRANT,
  };

  const requested = input.requestedAutoGrantScopes ?? [];
  const growth: CapabilityGrowthEvent = {
    id: id('dpgrow'),
    nodeId: node.id,
    requestedAutoGrantScopes: requested,
    status: requested.length > 0 ? 'denied_auto_grant' : 'recorded',
    grantedScopes: [],
    reason: CAPABILITY_GROWTH_NO_AUTO_GRANT,
    at: new Date().toISOString(),
  };

  store.nodes.push(node);
  store.growth.push(growth);
  await save(input.root, store);
  return { node, growth };
}

export async function listCapabilityNodes(input: { root: string }) {
  const store = await load(input.root);
  return store.nodes;
}
