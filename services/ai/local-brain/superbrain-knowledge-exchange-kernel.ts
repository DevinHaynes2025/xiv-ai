/**
 * 62L-DE Superbrain Knowledge Exchange Kernel —
 * Governed knowledge exchange with explicit data rights + provenance.
 * Local-first; sealed never silent cloud/Universe fallback.
 * Heartbeat truth; logical ≠ RUNNING_VERIFIED.
 */

import { createHash } from 'node:crypto';
import { readJsonFile, writeJsonFileAtomic, xivLocalPath } from './durable-json';
import {
  DE_LOCKS,
  HEARTBEAT_TTL_MS,
  HONESTY_BANNER,
  KNOWLEDGE_EXCHANGE_PROVENANCE_DENIED,
  KNOWLEDGE_EXCHANGE_RIGHTS_DENIED,
  MAX_EXCHANGE_NODES,
  NO_HEARTBEAT_NOT_RUNNING_VERIFIED,
  NO_POWERED_NODE_WAITING_OR_STOPPED,
  SEALED_SILENT_ROUTE_DENIED,
  type DeActor,
  type ExchangeNodeStatus,
  type KnowledgeAssetClass,
} from './knowledge-exchange-gateway-marketplace-types';

export type ExchangeNode = {
  id: string;
  name: string;
  status: ExchangeNodeStatus;
  logical: boolean;
  authorizedNodePowered: boolean;
  lastHeartbeatAt: string | null;
  runtimeEvidence: string | null;
  reason: string;
  createdAt: string;
  updatedAt: string;
};

export type KnowledgeExchangeRecord = {
  id: string;
  assetClass: KnowledgeAssetClass;
  hasDataRights: boolean;
  hasProvenance: boolean;
  silent: boolean;
  status: 'ACCEPTED' | 'DENIED' | 'REJECTED';
  reason: string;
  payloadDigest: string;
  createdAt: string;
};

type Store = {
  nodes: ExchangeNode[];
  exchanges: KnowledgeExchangeRecord[];
};

function storePath(root: string) {
  return xivLocalPath(root, 'superbrain-knowledge-exchange-kernel.json');
}

async function load(root: string): Promise<Store> {
  return readJsonFile<Store>(storePath(root), { nodes: [], exchanges: [] });
}

async function save(root: string, store: Store) {
  await writeJsonFileAtomic(storePath(root), store);
}

function id(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function knowledgeExchangeKernelHonesty() {
  return {
    banner: HONESTY_BANNER,
    localFirst: DE_LOCKS.LOCAL_FIRST,
    withoutRights: DE_LOCKS.KNOWLEDGE_EXCHANGE_WITHOUT_RIGHTS,
    withoutProvenance: DE_LOCKS.KNOWLEDGE_EXCHANGE_WITHOUT_PROVENANCE,
    sealedSilentFallback: DE_LOCKS.SEALED_SILENT_CLOUD_OR_UNIVERSE_FALLBACK,
    logicalAutoRunningVerified: DE_LOCKS.LOGICAL_AUTO_RUNNING_VERIFIED,
    runningVerifiedWithoutHeartbeat: DE_LOCKS.RUNNING_VERIFIED_WITHOUT_HEARTBEAT,
  };
}

export async function registerExchangeNode(input: {
  name: string;
  authorizedNodePowered?: boolean;
  root: string;
  actor: DeActor;
}): Promise<{ accepted: boolean; reason: string; node?: ExchangeNode; at: string }> {
  void input.actor;
  const store = await load(input.root);
  const now = new Date().toISOString();
  if (store.nodes.length >= MAX_EXCHANGE_NODES) {
    return { accepted: false, reason: 'MAX_EXCHANGE_NODES_BOUNDED', at: now };
  }
  const powered = input.authorizedNodePowered === true;
  const node: ExchangeNode = {
    id: id('sxn'),
    name: input.name.trim() || 'unnamed-exchange-node',
    status: powered ? 'LOGICAL' : 'WAITING_NODE',
    logical: true,
    authorizedNodePowered: powered,
    lastHeartbeatAt: null,
    runtimeEvidence: null,
    reason: powered
      ? 'EXCHANGE_NODE_LOGICAL_NOT_RUNNING_VERIFIED'
      : NO_POWERED_NODE_WAITING_OR_STOPPED,
    createdAt: now,
    updatedAt: now,
  };
  store.nodes.push(node);
  await save(input.root, store);
  return { accepted: true, reason: node.reason, node, at: now };
}

export async function recordExchangeNodeHeartbeat(input: {
  nodeId: string;
  runtimeEvidence: string;
  root: string;
  actor: DeActor;
}): Promise<{ accepted: boolean; reason: string; node?: ExchangeNode; at: string }> {
  void input.actor;
  const store = await load(input.root);
  const now = new Date().toISOString();
  const node = store.nodes.find((n) => n.id === input.nodeId);
  if (!node) return { accepted: false, reason: 'EXCHANGE_NODE_NOT_FOUND', at: now };
  if (!node.authorizedNodePowered) {
    node.status = 'WAITING_NODE';
    node.reason = NO_POWERED_NODE_WAITING_OR_STOPPED;
    node.updatedAt = now;
    await save(input.root, store);
    return { accepted: false, reason: node.reason, node, at: now };
  }
  node.lastHeartbeatAt = now;
  node.runtimeEvidence = input.runtimeEvidence.trim() || null;
  node.status = 'RUNNING_VERIFIED';
  node.reason = 'EXCHANGE_NODE_RUNNING_VERIFIED_WITH_HEARTBEAT';
  node.updatedAt = now;
  await save(input.root, store);
  return { accepted: true, reason: node.reason, node, at: now };
}

export async function claimExchangeNodeRunningVerified(input: {
  nodeId: string;
  root: string;
  actor: DeActor;
}): Promise<{ accepted: boolean; reason: string; node?: ExchangeNode; at: string }> {
  void input.actor;
  const store = await load(input.root);
  const now = new Date().toISOString();
  const node = store.nodes.find((n) => n.id === input.nodeId);
  if (!node) return { accepted: false, reason: 'EXCHANGE_NODE_NOT_FOUND', at: now };
  if (!node.authorizedNodePowered) {
    node.status =
      node.status === 'OFFLINE_STOPPED' ? 'OFFLINE_STOPPED' : 'WAITING_NODE';
    node.reason = NO_POWERED_NODE_WAITING_OR_STOPPED;
    node.updatedAt = now;
    await save(input.root, store);
    return { accepted: false, reason: node.reason, node, at: now };
  }
  if (!node.lastHeartbeatAt || !node.runtimeEvidence) {
    node.reason = NO_HEARTBEAT_NOT_RUNNING_VERIFIED;
    node.updatedAt = now;
    await save(input.root, store);
    return { accepted: false, reason: node.reason, node, at: now };
  }
  const age = Date.now() - Date.parse(node.lastHeartbeatAt);
  if (Number.isNaN(age) || age > HEARTBEAT_TTL_MS) {
    node.status = 'HEARTBEAT_STALE';
    node.reason = NO_HEARTBEAT_NOT_RUNNING_VERIFIED;
    node.updatedAt = now;
    await save(input.root, store);
    return { accepted: false, reason: node.reason, node, at: now };
  }
  node.status = 'RUNNING_VERIFIED';
  node.reason = 'EXCHANGE_NODE_RUNNING_VERIFIED_WITH_HEARTBEAT';
  node.updatedAt = now;
  await save(input.root, store);
  return { accepted: true, reason: node.reason, node, at: now };
}

export async function setExchangeNodePower(input: {
  nodeId: string;
  powered: boolean;
  stopMode?: 'WAITING_NODE' | 'OFFLINE_STOPPED';
  root: string;
  actor: DeActor;
}): Promise<{ accepted: boolean; reason: string; node?: ExchangeNode; at: string }> {
  void input.actor;
  const store = await load(input.root);
  const now = new Date().toISOString();
  const node = store.nodes.find((n) => n.id === input.nodeId);
  if (!node) return { accepted: false, reason: 'EXCHANGE_NODE_NOT_FOUND', at: now };
  node.authorizedNodePowered = input.powered;
  if (!input.powered) {
    node.status = input.stopMode === 'OFFLINE_STOPPED' ? 'OFFLINE_STOPPED' : 'WAITING_NODE';
    node.reason = NO_POWERED_NODE_WAITING_OR_STOPPED;
  } else {
    node.status = 'LOGICAL';
    node.reason = 'EXCHANGE_NODE_POWERED_LOGICAL_AWAITING_HEARTBEAT';
  }
  node.updatedAt = now;
  await save(input.root, store);
  return { accepted: true, reason: node.reason, node, at: now };
}

export async function submitKnowledgeExchange(input: {
  assetClass: KnowledgeAssetClass;
  payload: string;
  hasDataRights?: boolean;
  hasProvenance?: boolean;
  silent?: boolean;
  root: string;
  actor: DeActor;
}): Promise<{
  accepted: boolean;
  reason: string;
  exchange?: KnowledgeExchangeRecord;
  at: string;
}> {
  void input.actor;
  const store = await load(input.root);
  const now = new Date().toISOString();
  const digest = createHash('sha256').update(input.payload).digest('hex');
  const silent = input.silent === true;
  const sealedOrPrivate =
    input.assetClass === 'sealed' || input.assetClass === 'raw_private';

  if (silent && sealedOrPrivate) {
    const exchange: KnowledgeExchangeRecord = {
      id: id('sxk'),
      assetClass: input.assetClass,
      hasDataRights: input.hasDataRights === true,
      hasProvenance: input.hasProvenance === true,
      silent: true,
      status: 'DENIED',
      reason: SEALED_SILENT_ROUTE_DENIED,
      payloadDigest: digest,
      createdAt: now,
    };
    store.exchanges.push(exchange);
    await save(input.root, store);
    return { accepted: false, reason: exchange.reason, exchange, at: now };
  }

  if (input.hasDataRights !== true) {
    const exchange: KnowledgeExchangeRecord = {
      id: id('sxk'),
      assetClass: input.assetClass,
      hasDataRights: false,
      hasProvenance: input.hasProvenance === true,
      silent,
      status: 'DENIED',
      reason: KNOWLEDGE_EXCHANGE_RIGHTS_DENIED,
      payloadDigest: digest,
      createdAt: now,
    };
    store.exchanges.push(exchange);
    await save(input.root, store);
    return { accepted: false, reason: exchange.reason, exchange, at: now };
  }

  if (input.hasProvenance !== true) {
    const exchange: KnowledgeExchangeRecord = {
      id: id('sxk'),
      assetClass: input.assetClass,
      hasDataRights: true,
      hasProvenance: false,
      silent,
      status: 'DENIED',
      reason: KNOWLEDGE_EXCHANGE_PROVENANCE_DENIED,
      payloadDigest: digest,
      createdAt: now,
    };
    store.exchanges.push(exchange);
    await save(input.root, store);
    return { accepted: false, reason: exchange.reason, exchange, at: now };
  }

  const exchange: KnowledgeExchangeRecord = {
    id: id('sxk'),
    assetClass: input.assetClass,
    hasDataRights: true,
    hasProvenance: true,
    silent,
    status: 'ACCEPTED',
    reason: 'KNOWLEDGE_EXCHANGE_ACCEPTED_WITH_RIGHTS_AND_PROVENANCE',
    payloadDigest: digest,
    createdAt: now,
  };
  store.exchanges.push(exchange);
  await save(input.root, store);
  return { accepted: true, reason: exchange.reason, exchange, at: now };
}
