/**
 * 62L-CI Global Edge Knowledge Exchange —
 * Revocable exchange of approved knowledge deltas across enrolled edge nodes.
 * Unenrolled exchange DENIED; unapproved deltas DENIED; revoked import REJECTED.
 * No hidden device deploy path — deploy without enrollment DENIED.
 */

import { createHash } from 'node:crypto';

import { readJsonFile, writeJsonFileAtomic, xivLocalPath } from './durable-json';
import {
  CI_LOCKS,
  HIDDEN_DEVICE_DEPLOY_DENIED,
  HONESTY_BANNER,
  REVOKED_DELTA_IMPORT_REJECTED,
  UNAPPROVED_DELTA_EXCHANGE_DENIED,
  UNENROLLED_EDGE_EXCHANGE_DENIED,
  type CiActor,
} from './persistent-intelligence-economy-types';

export type EdgeNode = {
  id: string;
  label: string;
  enrolled: boolean;
  revoked: boolean;
  createdAt: string;
  updatedAt: string;
};

export type KnowledgeDelta = {
  id: string;
  payload: string;
  checksumSha256: string;
  approved: boolean;
  revoked: boolean;
  createdAt: string;
  updatedAt: string;
};

export type EdgeExchangeResult = {
  accepted: boolean;
  reason: string;
  node?: EdgeNode;
  delta?: KnowledgeDelta;
  at: string;
};

type Store = {
  nodes: EdgeNode[];
  deltas: KnowledgeDelta[];
};

function storePath(root: string) {
  return xivLocalPath(root, 'global-edge-knowledge-exchange.json');
}

async function load(root: string): Promise<Store> {
  return readJsonFile<Store>(storePath(root), { nodes: [], deltas: [] });
}

async function save(root: string, store: Store) {
  await writeJsonFileAtomic(storePath(root), store);
}

function id(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

function checksum(payload: string) {
  return createHash('sha256').update(payload).digest('hex');
}

export function edgeExchangeHonesty() {
  return {
    banner: HONESTY_BANNER,
    l4AutonomyEnabled: CI_LOCKS.L4_AUTONOMY_ENABLED,
    edgeExchangeUnenrolled: CI_LOCKS.EDGE_EXCHANGE_UNENROLLED,
    edgeExchangeUnapprovedDelta: CI_LOCKS.EDGE_EXCHANGE_UNAPPROVED_DELTA,
    edgeExchangeRevokedDelta: CI_LOCKS.EDGE_EXCHANGE_REVOKED_DELTA,
    hiddenDeviceDeploy: CI_LOCKS.HIDDEN_DEVICE_DEPLOY,
    deviceDeployRequiresEnrollment: CI_LOCKS.DEVICE_DEPLOY_REQUIRES_ENROLLMENT,
    sealedSilentCloudFallback: CI_LOCKS.SEALED_SILENT_CLOUD_FALLBACK,
    localFirst: CI_LOCKS.LOCAL_FIRST,
  };
}

export async function enrollEdgeNode(input: {
  label: string;
  root: string;
  actor: CiActor;
}): Promise<EdgeExchangeResult> {
  void input.actor;
  const store = await load(input.root);
  const now = new Date().toISOString();
  const node: EdgeNode = {
    id: id('edge'),
    label: input.label,
    enrolled: true,
    revoked: false,
    createdAt: now,
    updatedAt: now,
  };
  store.nodes.push(node);
  await save(input.root, store);
  return { accepted: true, reason: 'EDGE_NODE_ENROLLED', node, at: now };
}

export async function registerKnowledgeDelta(input: {
  payload: string;
  approved?: boolean;
  root: string;
  actor: CiActor;
}): Promise<EdgeExchangeResult> {
  void input.actor;
  const store = await load(input.root);
  const now = new Date().toISOString();
  const delta: KnowledgeDelta = {
    id: id('delta'),
    payload: input.payload,
    checksumSha256: checksum(input.payload),
    approved: Boolean(input.approved),
    revoked: false,
    createdAt: now,
    updatedAt: now,
  };
  store.deltas.push(delta);
  await save(input.root, store);
  return {
    accepted: true,
    reason: delta.approved ? 'KNOWLEDGE_DELTA_APPROVED' : 'KNOWLEDGE_DELTA_UNAPPROVED_REGISTERED',
    delta,
    at: now,
  };
}

export async function approveKnowledgeDelta(input: {
  deltaId: string;
  root: string;
  actor: CiActor;
}): Promise<EdgeExchangeResult> {
  void input.actor;
  const store = await load(input.root);
  const delta = store.deltas.find((d) => d.id === input.deltaId);
  const now = new Date().toISOString();
  if (!delta) return { accepted: false, reason: 'DELTA_NOT_FOUND', at: now };
  if (delta.revoked) {
    return { accepted: false, reason: REVOKED_DELTA_IMPORT_REJECTED, delta, at: now };
  }
  delta.approved = true;
  delta.updatedAt = now;
  await save(input.root, store);
  return { accepted: true, reason: 'KNOWLEDGE_DELTA_APPROVED', delta, at: now };
}

export async function revokeKnowledgeDelta(input: {
  deltaId: string;
  root: string;
  actor: CiActor;
}): Promise<EdgeExchangeResult> {
  void input.actor;
  const store = await load(input.root);
  const delta = store.deltas.find((d) => d.id === input.deltaId);
  const now = new Date().toISOString();
  if (!delta) return { accepted: false, reason: 'DELTA_NOT_FOUND', at: now };
  delta.revoked = true;
  delta.approved = false;
  delta.updatedAt = now;
  await save(input.root, store);
  return { accepted: true, reason: 'KNOWLEDGE_DELTA_REVOKED', delta, at: now };
}

export async function exchangeKnowledgeDelta(input: {
  nodeId: string;
  deltaId: string;
  operation: 'export' | 'import';
  root: string;
  actor: CiActor;
}): Promise<EdgeExchangeResult> {
  void input.actor;
  const store = await load(input.root);
  const node = store.nodes.find((n) => n.id === input.nodeId);
  const delta = store.deltas.find((d) => d.id === input.deltaId);
  const now = new Date().toISOString();

  if (!node || !node.enrolled || node.revoked) {
    return {
      accepted: false,
      reason: UNENROLLED_EDGE_EXCHANGE_DENIED,
      node,
      delta,
      at: now,
    };
  }
  if (!delta) {
    return { accepted: false, reason: 'DELTA_NOT_FOUND', node, at: now };
  }
  if (delta.revoked) {
    return {
      accepted: false,
      reason: REVOKED_DELTA_IMPORT_REJECTED,
      node,
      delta,
      at: now,
    };
  }
  if (!delta.approved) {
    return {
      accepted: false,
      reason: UNAPPROVED_DELTA_EXCHANGE_DENIED,
      node,
      delta,
      at: now,
    };
  }

  return {
    accepted: true,
    reason: `EDGE_DELTA_${input.operation.toUpperCase()}_OK`,
    node,
    delta,
    at: now,
  };
}

/** Hidden deploy path: device deploy without enrollment is always DENIED. */
export async function attemptDeviceDeployWithoutEnrollment(input: {
  deviceLabel: string;
  root: string;
  actor: CiActor;
}): Promise<EdgeExchangeResult> {
  void input.actor;
  const store = await load(input.root);
  const now = new Date().toISOString();
  // Do not auto-enroll — no hidden path
  const ghost: EdgeNode = {
    id: id('ghost'),
    label: input.deviceLabel,
    enrolled: false,
    revoked: false,
    createdAt: now,
    updatedAt: now,
  };
  store.nodes.push(ghost);
  await save(input.root, store);
  return {
    accepted: false,
    reason: HIDDEN_DEVICE_DEPLOY_DENIED,
    node: ghost,
    at: now,
  };
}
