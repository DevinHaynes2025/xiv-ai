/**
 * 62L-DU Module C — Data Control Tower.
 * Visual data warehouses / information control towers / cloud+local navigation.
 * Deny-by-default; label alone ≠ access.
 */

import { readJsonFile, writeJsonFileAtomic, xivLocalPath } from './durable-json';
import {
  DATA_TOWER_DENIED,
  LABEL_NEQ_DATA_ACCESS,
  MAX_DATA_TOWER_NODES,
  type DuActor,
} from './universal-industry-intelligence-os-types';

export type DataTowerNode = {
  id: string;
  name: string;
  location: 'cloud' | 'local' | 'hybrid';
  sealed: boolean;
  grantsAccess: false;
  createdAt: string;
};

export type DataTowerAccess = {
  id: string;
  nodeId: string;
  labelPresent: boolean;
  explicitGrant: boolean;
  status: 'allowed' | 'denied';
  reason: string;
  at: string;
};

type Store = {
  nodes: DataTowerNode[];
  access: DataTowerAccess[];
};

function storePath(root: string) {
  return xivLocalPath(root, 'data-control-tower.json');
}

async function load(root: string): Promise<Store> {
  return readJsonFile<Store>(storePath(root), { nodes: [], access: [] });
}

async function save(root: string, store: Store) {
  await writeJsonFileAtomic(storePath(root), store);
}

function id(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function dataControlTowerHonesty() {
  return {
    denyByDefault: true,
    labelAloneEqAccess: false,
    localFirst: true,
    l4AutonomyEnabled: false,
  };
}

export async function registerDataTowerNode(input: {
  name: string;
  location: DataTowerNode['location'];
  sealed?: boolean;
  root: string;
  actor: DuActor;
}): Promise<DataTowerNode> {
  const store = await load(input.root);
  void input.actor;
  if (store.nodes.length >= MAX_DATA_TOWER_NODES) {
    throw new Error('MAX_DATA_TOWER_NODES_REACHED');
  }
  const node: DataTowerNode = {
    id: id('dutower'),
    name: input.name.trim(),
    location: input.location,
    sealed: input.sealed !== false,
    grantsAccess: false,
    createdAt: new Date().toISOString(),
  };
  store.nodes.push(node);
  await save(input.root, store);
  return node;
}

export async function accessDataTower(input: {
  nodeId: string;
  labelPresent: boolean;
  explicitGrant: boolean;
  root: string;
  actor: DuActor;
}): Promise<DataTowerAccess> {
  const store = await load(input.root);
  void input.actor;
  let status: 'allowed' | 'denied';
  let reason: string;
  if (input.explicitGrant) {
    status = 'allowed';
    reason = 'DATA_TOWER_EXPLICIT_GRANT';
  } else if (input.labelPresent) {
    status = 'denied';
    reason = LABEL_NEQ_DATA_ACCESS;
  } else {
    status = 'denied';
    reason = DATA_TOWER_DENIED;
  }
  const access: DataTowerAccess = {
    id: id('duacc'),
    nodeId: input.nodeId,
    labelPresent: input.labelPresent,
    explicitGrant: input.explicitGrant,
    status,
    reason,
    at: new Date().toISOString(),
  };
  store.access.push(access);
  await save(input.root, store);
  return access;
}
