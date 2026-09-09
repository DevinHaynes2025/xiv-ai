/**
 * 62L-DY Module E — Long-Term Memory Graph.
 * Governed LTM; sealed deny unenrolled; ACL-enforced.
 */

import { readJsonFile, writeJsonFileAtomic, xivLocalPath } from './durable-json';
import {
  LTM_ACL_DENIED,
  LTM_UNENROLLED_DENIED,
  MAX_LTM_NODES,
  type DyActor,
} from './intelligent-supply-chain-command-types';

export type LtmNode = {
  id: string;
  nodeId: string;
  enrolled: boolean;
  sealed: true;
  grantsAuthority: false;
  createdAt: string;
};

export type LtmAccess = {
  id: string;
  nodeId: string;
  enrolled: boolean;
  explicitGrant: boolean;
  status: 'ok' | 'denied';
  reason: string;
  at: string;
};

type Store = {
  nodes: LtmNode[];
  accesses: LtmAccess[];
};

function storePath(root: string) {
  return xivLocalPath(root, 'long-term-memory-graph.json');
}

async function load(root: string): Promise<Store> {
  return readJsonFile<Store>(storePath(root), { nodes: [], accesses: [] });
}

async function save(root: string, store: Store) {
  await writeJsonFileAtomic(storePath(root), store);
}

function id(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function longTermMemoryGraphHonesty() {
  return {
    sealedDenyUnenrolled: true,
    governedAcl: true,
    grantsAuthority: false,
    learningNeqPermission: true,
  };
}

export async function enrollLtmNode(input: {
  nodeId: string;
  enrolled: boolean;
  root: string;
  actor: DyActor;
}): Promise<LtmNode> {
  const store = await load(input.root);
  void input.actor;
  if (store.nodes.length >= MAX_LTM_NODES) throw new Error('MAX_LTM_NODES_REACHED');
  const node: LtmNode = {
    id: id('dyltm'),
    nodeId: input.nodeId.trim(),
    enrolled: input.enrolled,
    sealed: true,
    grantsAuthority: false,
    createdAt: new Date().toISOString(),
  };
  store.nodes.push(node);
  await save(input.root, store);
  return node;
}

export async function accessLtmNode(input: {
  nodeId: string;
  enrolled: boolean;
  explicitGrant: boolean;
  root: string;
  actor: DyActor;
}): Promise<LtmAccess> {
  const store = await load(input.root);
  void input.actor;
  let reason = 'LTM_ACCESS_OK';
  let status: 'ok' | 'denied' = 'ok';
  if (!input.enrolled) {
    status = 'denied';
    reason = LTM_UNENROLLED_DENIED;
  } else if (!input.explicitGrant) {
    status = 'denied';
    reason = LTM_ACL_DENIED;
  }
  const access: LtmAccess = {
    id: id('dylta'),
    nodeId: input.nodeId.trim(),
    enrolled: input.enrolled,
    explicitGrant: input.explicitGrant,
    status,
    reason,
    at: new Date().toISOString(),
  };
  store.accesses.push(access);
  await save(input.root, store);
  return access;
}
