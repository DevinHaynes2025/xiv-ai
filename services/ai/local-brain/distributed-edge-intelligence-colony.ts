/**
 * 62L-CH Distributed Edge Intelligence Colony — enrolled edge nodes with
 * explicit permissions; colony coordination bounded.
 * Unenrolled → UNAVAILABLE/DENIED.
 */

import { readJsonFile, writeJsonFileAtomic, xivLocalPath } from './durable-json';
import {
  CH_LOCKS,
  HONESTY_BANNER,
  UNENROLLED_EDGE_DENIED,
  type ChActor,
} from './knowledge-civilization-dept-universities-types';

export type EdgeNodePermission =
  | 'read_local'
  | 'write_local'
  | 'coordinate'
  | 'sync_bounded';

export type EdgeColonyNode = {
  id: string;
  label: string;
  enrolled: boolean;
  permissions: EdgeNodePermission[];
  status: 'available' | 'unavailable' | 'denied';
  reason: string;
  createdAt: string;
};

export type EdgeColonyAction = {
  id: string;
  nodeId: string;
  action: 'coordinate' | 'sync' | 'execute';
  status: 'allowed' | 'denied' | 'unavailable';
  reason: string;
  at: string;
};

type Store = {
  nodes: EdgeColonyNode[];
  actions: EdgeColonyAction[];
};

function storePath(root: string) {
  return xivLocalPath(root, 'distributed-edge-intelligence-colony.json');
}

async function load(root: string): Promise<Store> {
  return readJsonFile<Store>(storePath(root), { nodes: [], actions: [] });
}

async function save(root: string, store: Store) {
  await writeJsonFileAtomic(storePath(root), store);
}

function id(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function edgeColonyHonesty() {
  return {
    banner: HONESTY_BANNER,
    l4AutonomyEnabled: CH_LOCKS.L4_AUTONOMY_ENABLED,
    requiresExplicitEnrollment: CH_LOCKS.EDGE_REQUIRES_EXPLICIT_ENROLLMENT,
    requiresExplicitPermissions: CH_LOCKS.EDGE_REQUIRES_EXPLICIT_PERMISSIONS,
    unenrolledAllowed: CH_LOCKS.UNENROLLED_EDGE_ALLOWED,
  };
}

export async function registerEdgeColonyNode(input: {
  label: string;
  enroll?: boolean;
  permissions?: EdgeNodePermission[];
  root: string;
  actor: ChActor;
}): Promise<EdgeColonyNode> {
  const store = await load(input.root);
  const enrolled = input.enroll === true;
  const permissions = enrolled ? (input.permissions ?? []) : [];
  const node: EdgeColonyNode = {
    id: id('ecn'),
    label: input.label,
    enrolled,
    permissions,
    status: enrolled ? 'available' : 'unavailable',
    reason: enrolled
      ? 'EDGE_NODE_ENROLLED_WITH_EXPLICIT_PERMISSIONS'
      : UNENROLLED_EDGE_DENIED,
    createdAt: new Date().toISOString(),
  };
  void input.actor;
  store.nodes.push(node);
  await save(input.root, store);
  return node;
}

export async function enrollEdgeColonyNode(input: {
  nodeId: string;
  permissions: EdgeNodePermission[];
  root: string;
  actor: ChActor;
}): Promise<{ accepted: boolean; reason: string; node: EdgeColonyNode | null }> {
  const store = await load(input.root);
  const node = store.nodes.find((n) => n.id === input.nodeId);
  if (!node) {
    return { accepted: false, reason: 'EDGE_NODE_NOT_FOUND', node: null };
  }
  if (!Array.isArray(input.permissions) || input.permissions.length === 0) {
    return {
      accepted: false,
      reason: 'EDGE_ENROLLMENT_REQUIRES_EXPLICIT_PERMISSIONS',
      node,
    };
  }
  node.enrolled = true;
  node.permissions = [...input.permissions];
  node.status = 'available';
  node.reason = 'EDGE_NODE_ENROLLED_WITH_EXPLICIT_PERMISSIONS';
  void input.actor;
  await save(input.root, store);
  return { accepted: true, reason: node.reason, node };
}

export async function requestEdgeColonyAction(input: {
  nodeId: string;
  action: EdgeColonyAction['action'];
  root: string;
  actor: ChActor;
}): Promise<EdgeColonyAction> {
  const store = await load(input.root);
  const node = store.nodes.find((n) => n.id === input.nodeId);
  void input.actor;

  if (!node || !node.enrolled) {
    const denied: EdgeColonyAction = {
      id: id('eca'),
      nodeId: input.nodeId,
      action: input.action,
      status: node ? 'denied' : 'unavailable',
      reason: UNENROLLED_EDGE_DENIED,
      at: new Date().toISOString(),
    };
    store.actions.push(denied);
    await save(input.root, store);
    return denied;
  }

  const needsCoord = input.action === 'coordinate' || input.action === 'sync';
  const hasPerm =
    (input.action === 'execute' && node.permissions.includes('write_local')) ||
    (input.action === 'coordinate' && node.permissions.includes('coordinate')) ||
    (input.action === 'sync' && node.permissions.includes('sync_bounded')) ||
    (!needsCoord && node.permissions.includes('read_local'));

  if (!hasPerm) {
    const denied: EdgeColonyAction = {
      id: id('eca'),
      nodeId: node.id,
      action: input.action,
      status: 'denied',
      reason: UNENROLLED_EDGE_DENIED,
      at: new Date().toISOString(),
    };
    // More precise: permission missing still DENIED under colony policy
    denied.reason = 'EDGE_ACTION_DENIED_MISSING_EXPLICIT_PERMISSION';
    store.actions.push(denied);
    await save(input.root, store);
    return denied;
  }

  const ok: EdgeColonyAction = {
    id: id('eca'),
    nodeId: node.id,
    action: input.action,
    status: 'allowed',
    reason: 'EDGE_ACTION_ALLOWED_BOUNDED',
    at: new Date().toISOString(),
  };
  store.actions.push(ok);
  await save(input.root, store);
  return ok;
}
