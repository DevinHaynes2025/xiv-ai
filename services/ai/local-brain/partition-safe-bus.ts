import { publishPersistentAgentMessage } from './persistent-agent-bus';
import { publishAgentMessage, type AgentMessageKind } from './agent-bus';
import { getMeshNode } from './mesh-node-registry';
import { cortexId, readJsonFile, writeJsonFileAtomic, xivLocalPath } from './cortex-store';
import { MESH_HONESTY } from './distributed-mesh-types';

export type MeshEnvelopeStatus =
  | 'queued'
  | 'delivered'
  | 'duplicate_dropped'
  | 'partition_queued'
  | 'expired'
  | 'failed';

export type MeshEnvelope = {
  id: string;
  idempotencyKey: string;
  fromNodeId: string;
  toNodeId: string;
  tenantId: string;
  universeId: string;
  kind: AgentMessageKind | 'workcell' | 'pack_transfer' | 'reconcile' | 'health';
  body: string;
  evidenceRefs: string[];
  workId?: string;
  createdAt: string;
  deliverAt: string;
  expiresAt: string;
  status: MeshEnvelopeStatus;
  requiresHumanApproval: boolean;
};

type PartitionLink = { a: string; b: string };

type Store = {
  envelopes: MeshEnvelope[];
  partitions: PartitionLink[];
  seenIdempotency: string[];
};

const DEFAULT_TTL_MS = 30 * 60_000;

function storePath(root: string) {
  return xivLocalPath(root, 'mesh-partition-bus.json');
}

async function load(root: string): Promise<Store> {
  const parsed = await readJsonFile<Store>(storePath(root), { envelopes: [], partitions: [], seenIdempotency: [] });
  return {
    envelopes: Array.isArray(parsed.envelopes) ? parsed.envelopes : [],
    partitions: Array.isArray(parsed.partitions) ? parsed.partitions : [],
    seenIdempotency: Array.isArray(parsed.seenIdempotency) ? parsed.seenIdempotency : [],
  };
}

async function save(root: string, store: Store) {
  await writeJsonFileAtomic(storePath(root), {
    envelopes: store.envelopes.slice(-10_000),
    partitions: store.partitions.slice(-2_000),
    seenIdempotency: store.seenIdempotency.slice(-20_000),
  });
}

function pairKey(a: string, b: string) {
  return a < b ? `${a}::${b}` : `${b}::${a}`;
}

export function nodesPartitioned(partitions: PartitionLink[], a: string, b: string) {
  if (a === b) return false;
  const key = pairKey(a, b);
  return partitions.some((link) => pairKey(link.a, link.b) === key);
}

export async function setMeshPartition(input: {
  nodeA: string;
  nodeB: string;
  partitioned: boolean;
  tenantId: string;
  universeId: string;
  root?: string;
}) {
  if (input.nodeA === input.nodeB) throw new Error('CANNOT_PARTITION_NODE_FROM_SELF');
  const root = input.root ?? process.cwd();
  const store = await load(root);
  const key = pairKey(input.nodeA, input.nodeB);
  store.partitions = store.partitions.filter((link) => pairKey(link.a, link.b) !== key);
  if (input.partitioned) store.partitions.push({ a: input.nodeA, b: input.nodeB });
  await save(root, store);
  return { partitioned: input.partitioned, pair: key, honesty: MESH_HONESTY };
}

export async function listMeshPartitions(root?: string) {
  return (await load(root ?? process.cwd())).partitions;
}

function busKind(kind: MeshEnvelope['kind']): AgentMessageKind {
  if (kind === 'task' || kind === 'evidence' || kind === 'challenge' || kind === 'decision_support' || kind === 'status') {
    return kind;
  }
  return 'status';
}

export async function publishMeshEnvelope(input: {
  idempotencyKey: string;
  fromNodeId: string;
  toNodeId: string;
  tenantId: string;
  universeId: string;
  kind: MeshEnvelope['kind'];
  body: string;
  evidenceRefs: string[];
  workId?: string;
  delayMs?: number;
  ttlMs?: number;
  requiresHumanApproval?: boolean;
  failDelivery?: boolean;
  root?: string;
  now?: number;
}): Promise<MeshEnvelope> {
  if (!input.idempotencyKey.trim()) throw new Error('IDEMPOTENCY_KEY_REQUIRED');
  if (!input.body.trim()) throw new Error('MESH_ENVELOPE_BODY_REQUIRED');
  const from = await getMeshNode(input.fromNodeId, input.tenantId, input.universeId, input.root);
  const to = await getMeshNode(input.toNodeId, input.tenantId, input.universeId, input.root);
  if (!from || !to) throw new Error('MESH_NODE_NOT_FOUND');
  if (from.universeId !== to.universeId || from.tenantId !== to.tenantId) {
    throw new Error('CROSS_UNIVERSE_MESH_MESSAGE_DENIED');
  }

  const now = input.now ?? Date.now();
  const root = input.root ?? process.cwd();
  const store = await load(root);
  const existing = store.envelopes.find((item) => item.idempotencyKey === input.idempotencyKey && item.tenantId === input.tenantId && item.universeId === input.universeId);
  if (existing) {
    return { ...existing, status: 'duplicate_dropped' };
  }

  const ttlMs = Math.max(1_000, Math.min(input.ttlMs ?? DEFAULT_TTL_MS, 24 * 60 * 60_000));
  const deliverAt = now + Math.max(0, input.delayMs ?? 0);
  const envelope: MeshEnvelope = {
    id: cortexId('meshenv'),
    idempotencyKey: input.idempotencyKey,
    fromNodeId: input.fromNodeId,
    toNodeId: input.toNodeId,
    tenantId: input.tenantId,
    universeId: input.universeId,
    kind: input.kind,
    body: input.body,
    evidenceRefs: [...input.evidenceRefs],
    workId: input.workId,
    createdAt: new Date(now).toISOString(),
    deliverAt: new Date(deliverAt).toISOString(),
    expiresAt: new Date(now + ttlMs).toISOString(),
    status: 'queued',
    requiresHumanApproval: input.requiresHumanApproval === true,
  };

  if (input.failDelivery) {
    envelope.status = 'failed';
    store.envelopes.push(envelope);
    store.seenIdempotency.push(input.idempotencyKey);
    await save(root, store);
    return envelope;
  }

  if (Date.parse(envelope.expiresAt) <= now) {
    envelope.status = 'expired';
    store.envelopes.push(envelope);
    await save(root, store);
    return envelope;
  }

  if (nodesPartitioned(store.partitions, input.fromNodeId, input.toNodeId) && input.fromNodeId !== input.toNodeId) {
    envelope.status = 'partition_queued';
    store.envelopes.push(envelope);
    store.seenIdempotency.push(input.idempotencyKey);
    await save(root, store);
    return envelope;
  }

  if (deliverAt > now) {
    store.envelopes.push(envelope);
    store.seenIdempotency.push(input.idempotencyKey);
    await save(root, store);
    return envelope;
  }

  await deliverEnvelope(envelope, root, now);
  store.envelopes.push(envelope);
  store.seenIdempotency.push(input.idempotencyKey);
  await save(root, store);
  return envelope;
}

async function deliverEnvelope(envelope: MeshEnvelope, root: string, now: number) {
  const payload = {
    fromRole: `node:${envelope.fromNodeId}`,
    toRole: `node:${envelope.toNodeId}`,
    tenantId: envelope.tenantId,
    universeId: envelope.universeId,
    kind: busKind(envelope.kind),
    body: envelope.body,
    evidenceRefs: envelope.evidenceRefs,
    requiresHumanApproval: envelope.requiresHumanApproval,
    ttlMs: Math.max(1_000, Date.parse(envelope.expiresAt) - now),
    now,
  };
  publishAgentMessage(payload);
  await publishPersistentAgentMessage(payload, root);
  envelope.status = 'delivered';
}

export async function drainMeshBus(input: {
  tenantId: string;
  universeId: string;
  root?: string;
  now?: number;
}) {
  const now = input.now ?? Date.now();
  const root = input.root ?? process.cwd();
  const store = await load(root);
  let delivered = 0;
  let expired = 0;
  for (const envelope of store.envelopes) {
    if (envelope.tenantId !== input.tenantId || envelope.universeId !== input.universeId) continue;
    if (envelope.status === 'delivered' || envelope.status === 'duplicate_dropped' || envelope.status === 'failed') continue;
    if (Date.parse(envelope.expiresAt) <= now) {
      envelope.status = 'expired';
      expired += 1;
      continue;
    }
    if (envelope.status === 'partition_queued') {
      if (nodesPartitioned(store.partitions, envelope.fromNodeId, envelope.toNodeId)) continue;
    }
    if (Date.parse(envelope.deliverAt) > now) continue;
    if (envelope.status === 'queued' || envelope.status === 'partition_queued') {
      await deliverEnvelope(envelope, root, now);
      delivered += 1;
    }
  }
  await save(root, store);
  return { delivered, expired, honesty: MESH_HONESTY };
}

export async function listMeshEnvelopes(input: { tenantId: string; universeId: string; root?: string }) {
  const store = await load(input.root ?? process.cwd());
  return store.envelopes.filter((item) => item.tenantId === input.tenantId && item.universeId === input.universeId);
}

export async function inboxForNode(input: {
  nodeId: string;
  tenantId: string;
  universeId: string;
  root?: string;
  now?: number;
}) {
  const now = input.now ?? Date.now();
  const envelopes = await listMeshEnvelopes(input);
  return envelopes.filter((item) =>
    item.toNodeId === input.nodeId &&
    item.status === 'delivered' &&
    Date.parse(item.expiresAt) > now,
  );
}
