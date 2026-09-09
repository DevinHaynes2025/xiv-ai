import { createHash, randomUUID } from 'node:crypto';

import { agenticPut, agenticQuery } from './agentic-database';
import { CEO_SEALED_VAULT_FILE, SEALED_REDACTION, redactSealedForRouting } from './ceo-sealed-vault';
import { listDeviceNodes, type DeviceNode } from './device-node-runtime';
import { readJsonFile, writeJsonFileAtomic, xivLocalPath } from './durable-json';
import type { SealedActor } from './hybrid-edge-cloud-types';
import { indexLakeObject, sparseRetrieve, tokenizeForIndex } from './offline-intelligence-index';
import { ingestLakeSource } from './knowledge-lake';
import { localModelStatus } from './local-model';
import {
  DEFAULT_REPLICATION_POLICY,
  type MemoryReplicationClass,
} from './universe-os-types';

export type JournalEntry = {
  id: string;
  key: string;
  tenantId: string;
  universeId: string;
  sourceNodeId: string;
  payload: string;
  classification: MemoryReplicationClass;
  vectorClock: Record<string, number>;
  replicable: boolean;
  sealed: boolean;
  createdAt: string;
};

export type ReplicationReceipt = {
  id: string;
  entryId: string;
  fromNodeId: string;
  toNodeId: string;
  state: 'replicated' | 'skipped_sealed' | 'held' | 'denied' | 'conflict';
  reason: string;
  createdAt: string;
};

export type ConflictRecord = {
  id: string;
  key: string;
  tenantId: string;
  universeId: string;
  winnerId: string;
  retainedIds: string[];
  strategy: 'later_clock_wins_history_retained';
  forgotten: false;
  createdAt: string;
};

type ReplicationStore = {
  journal: JournalEntry[];
  receipts: ReplicationReceipt[];
  conflicts: ConflictRecord[];
};

const MAX_JOURNAL = 8_000;
const SECRET_MARKERS = ['.env', 'id_rsa', 'sk_live_', 'ghp_', 'BEGIN PRIVATE KEY'];

function storePath(root: string) {
  return xivLocalPath(root, 'distributed-memory-journal.json');
}

async function load(root: string): Promise<ReplicationStore> {
  const parsed = await readJsonFile<ReplicationStore>(storePath(root), {
    journal: [],
    receipts: [],
    conflicts: [],
  });
  return {
    journal: Array.isArray(parsed.journal) ? parsed.journal : [],
    receipts: Array.isArray(parsed.receipts) ? parsed.receipts : [],
    conflicts: Array.isArray(parsed.conflicts) ? parsed.conflicts : [],
  };
}

async function save(root: string, store: ReplicationStore) {
  await writeJsonFileAtomic(storePath(root), {
    journal: store.journal.slice(-MAX_JOURNAL),
    receipts: store.receipts.slice(-MAX_JOURNAL),
    conflicts: store.conflicts.slice(-2_000),
  });
}

function looksSecret(text: string) {
  const lower = text.toLowerCase();
  return SECRET_MARKERS.some((marker) => lower.includes(marker));
}

function clockDominates(a: Record<string, number>, b: Record<string, number>) {
  const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
  let greater = false;
  let less = false;
  for (const key of keys) {
    const left = a[key] ?? 0;
    const right = b[key] ?? 0;
    if (left > right) greater = true;
    if (left < right) less = true;
  }
  if (greater && !less) return 1;
  if (less && !greater) return -1;
  return 0;
}

export function scopedUniverseStoragePath(tenantId: string, universeId: string, file: string) {
  return xivLocalPath('.', `universes/${tenantId}/${universeId}/${file}`);
}

export async function appendMemoryJournal(input: {
  tenantId: string;
  universeId: string;
  sourceNodeId: string;
  key: string;
  payload: string;
  classification: MemoryReplicationClass;
  root?: string;
}): Promise<{ accepted: true; entry: JournalEntry } | { accepted: false; reason: string }> {
  if (!input.tenantId || !input.universeId || !input.sourceNodeId) {
    return { accepted: false, reason: 'JOURNAL_SCOPE_REQUIRED' };
  }
  if (!input.key.trim() || !input.payload.trim()) {
    return { accepted: false, reason: 'JOURNAL_CONTENT_REQUIRED' };
  }
  if (looksSecret(input.payload)) {
    return { accepted: false, reason: 'JOURNAL_SECRET_DENIED' };
  }
  const policy = DEFAULT_REPLICATION_POLICY[input.classification];
  const sealed = input.classification === 'sealed_founder_priority';
  const root = input.root ?? process.cwd();
  const store = await load(root);
  const prior = store.journal.filter(
    (item) =>
      item.key === input.key &&
      item.tenantId === input.tenantId &&
      item.universeId === input.universeId &&
      item.sourceNodeId === input.sourceNodeId,
  );
  const nextClock = { [input.sourceNodeId]: (prior.at(-1)?.vectorClock[input.sourceNodeId] ?? 0) + 1 };
  const entry: JournalEntry = {
    id: `jnl_${randomUUID()}`,
    key: input.key.trim(),
    tenantId: input.tenantId,
    universeId: input.universeId,
    sourceNodeId: input.sourceNodeId,
    payload: sealed ? SEALED_REDACTION : input.payload.trim().slice(0, 8_000),
    classification: input.classification,
    vectorClock: nextClock,
    replicable: policy === 'replicate',
    sealed,
    createdAt: new Date().toISOString(),
  };
  store.journal.push(entry);
  await save(root, store);
  return { accepted: true, entry };
}

export async function replicateJournalToNode(input: {
  tenantId: string;
  universeId: string;
  fromNodeId: string;
  toNodeId: string;
  entryId: string;
  root?: string;
}): Promise<ReplicationReceipt> {
  const root = input.root ?? process.cwd();
  const store = await load(root);
  const nodes = await listDeviceNodes({ tenantId: input.tenantId, universeId: input.universeId, root });
  const from = nodes.find((node) => node.id === input.fromNodeId);
  const to = nodes.find((node) => node.id === input.toNodeId);
  const entry = store.journal.find((item) => item.id === input.entryId);
  const now = new Date().toISOString();
  const receipt = (state: ReplicationReceipt['state'], reason: string): ReplicationReceipt => ({
    id: `rcpt_${randomUUID()}`,
    entryId: input.entryId,
    fromNodeId: input.fromNodeId,
    toNodeId: input.toNodeId,
    state,
    reason,
    createdAt: now,
  });

  if (!from || !to || from.tenantId !== to.tenantId || from.universeId !== to.universeId) {
    const denied = receipt('denied', 'Replication requires two nodes in the same tenant/Universe.');
    store.receipts.push(denied);
    await save(root, store);
    return denied;
  }
  if (!entry || entry.tenantId !== input.tenantId || entry.universeId !== input.universeId) {
    const denied = receipt('denied', 'Journal entry is not in tenant/Universe scope.');
    store.receipts.push(denied);
    await save(root, store);
    return denied;
  }
  if (entry.sealed || entry.classification === 'sealed_founder_priority' || !entry.replicable) {
    const skipped = receipt(
      'skipped_sealed',
      'CEO-sealed / non-replicating memory stays on the source node by default.',
    );
    store.receipts.push(skipped);
    await save(root, store);
    return skipped;
  }

  const existing = store.journal.find(
    (item) =>
      item.key === entry.key &&
      item.tenantId === entry.tenantId &&
      item.universeId === entry.universeId &&
      item.sourceNodeId === to.id &&
      item.payload !== entry.payload,
  );
  const replica: JournalEntry = {
    ...entry,
    id: `jnl_${randomUUID()}`,
    sourceNodeId: to.id,
    vectorClock: { ...entry.vectorClock, [to.id]: (entry.vectorClock[to.id] ?? 0) + 1 },
  };
  store.journal.push(replica);

  if (existing) {
    const conflict = await resolveJournalConflict({
      tenantId: input.tenantId,
      universeId: input.universeId,
      key: entry.key,
      leftId: existing.id,
      rightId: replica.id,
      root,
      store,
    });
    const conflicted = receipt('conflict', `Conflict retained; winner=${conflict.winnerId}`);
    store.receipts.push(conflicted);
    await save(root, store);
    return conflicted;
  }

  const ok = receipt('replicated', 'Ordinary memory replicated to authorized peer node.');
  store.receipts.push(ok);
  await save(root, store);
  return ok;
}

export async function resolveJournalConflict(input: {
  tenantId: string;
  universeId: string;
  key: string;
  leftId: string;
  rightId: string;
  root?: string;
  store?: ReplicationStore;
}): Promise<ConflictRecord> {
  const root = input.root ?? process.cwd();
  const store = input.store ?? (await load(root));
  const left = store.journal.find((item) => item.id === input.leftId);
  const right = store.journal.find((item) => item.id === input.rightId);
  if (!left || !right) {
    throw new Error('CONFLICT_ENTRIES_REQUIRED');
  }
  const cmp = clockDominates(left.vectorClock, right.vectorClock);
  let winner = right;
  if (cmp > 0) winner = left;
  else if (cmp === 0) {
    winner = left.createdAt >= right.createdAt ? left : right;
    if (left.createdAt === right.createdAt) {
      winner = left.sourceNodeId < right.sourceNodeId ? left : right;
    }
  }
  const record: ConflictRecord = {
    id: `cfl_${randomUUID()}`,
    key: input.key,
    tenantId: input.tenantId,
    universeId: input.universeId,
    winnerId: winner.id,
    retainedIds: [left.id, right.id],
    strategy: 'later_clock_wins_history_retained',
    forgotten: false,
    createdAt: new Date().toISOString(),
  };
  store.conflicts.push(record);
  if (!input.store) await save(root, store);
  return record;
}

export async function routeLocalDatabase(input: {
  tenantId: string;
  universeId: string;
  table: string;
  document: Record<string, unknown>;
  actor: SealedActor;
  sealed?: boolean;
  preferCloud?: boolean;
  root?: string;
}) {
  if (input.preferCloud) {
    return {
      routed: 'none' as const,
      state: 'UNAVAILABLE' as const,
      reason: 'Cloud database routing remains UNAVAILABLE until a provider is detected, configured, authorized, and verified.',
      row: null,
    };
  }
  if (input.sealed) {
    return {
      routed: 'local_sealed' as const,
      state: 'DENIED' as const,
      reason: 'Sealed founder-priority rows are not placed on the replicating journal path; use the CEO sealed vault.',
      row: null,
      vaultFile: CEO_SEALED_VAULT_FILE,
    };
  }
  const row = await agenticPut({
    tenantId: input.tenantId,
    universeId: input.universeId,
    table: input.table,
    document: input.document,
    sealed: false,
    root: input.root,
  });
  const visible = await agenticQuery({
    tenantId: input.tenantId,
    universeId: input.universeId,
    table: input.table,
    actor: input.actor,
    root: input.root,
  });
  return {
    routed: 'local' as const,
    state: 'AVAILABLE' as const,
    reason: 'Local agentic database (62L-AE) is the eligible offline router.',
    row,
    visibleCount: visible.rows.length,
    productionWrite: false as const,
  };
}

export async function upsertVectorRetrievalIndex(input: {
  tenantId: string;
  universeId: string;
  text: string;
  industry?: string;
  root?: string;
}) {
  const model = await localModelStatus();
  const denseState = process.env.XIV_LOCAL_EMBEDDING_MODEL?.trim() && model.availability === 'AVAILABLE'
    ? 'AVAILABLE'
    : 'UNAVAILABLE';
  const lake = await ingestLakeSource({
    tenantId: input.tenantId,
    universeId: input.universeId,
    industry: input.industry ?? 'operations',
    era: '2026',
    partition: 'world',
    sourceUri: `synthetic:62laf/vector/${createHash('sha256').update(input.text).digest('hex').slice(0, 12)}`,
    sourceLanguage: 'en',
    originalText: input.text,
    provenanceRefs: ['62L-AF-vector-index'],
    root: input.root,
  });
  await indexLakeObject(lake.object, input.root);
  const sparse = await sparseRetrieve({
    tenantId: input.tenantId,
    universeId: input.universeId,
    query: input.text,
    industry: input.industry ?? 'operations',
    root: input.root,
  });
  return {
    tokens: tokenizeForIndex(input.text),
    sparseHits: sparse.hits.length,
    denseEmbeddings: denseState,
    inventedEmbeddings: false as const,
    inventedFacts: false as const,
    objectId: lake.object.id,
  };
}

export async function redactSealedBeforePeerRoute(input: {
  recordId: string;
  tenantId: string;
  universeId: string;
  actor: SealedActor;
  root?: string;
}) {
  return redactSealedForRouting({
    recordId: input.recordId,
    tenantId: input.tenantId,
    universeId: input.universeId,
    destination: 'peer',
    actor: input.actor,
    root: input.root,
  });
}

export async function listJournal(input: {
  tenantId: string;
  universeId: string;
  nodeId?: string;
  root?: string;
}) {
  const store = await load(input.root ?? process.cwd());
  return store.journal.filter(
    (item) =>
      item.tenantId === input.tenantId &&
      item.universeId === input.universeId &&
      (!input.nodeId || item.sourceNodeId === input.nodeId),
  );
}

export async function listReplicationReceipts(input: {
  tenantId?: string;
  universeId?: string;
  root?: string;
}) {
  const store = await load(input.root ?? process.cwd());
  return store.receipts;
}

export async function listConflicts(input: { tenantId: string; universeId: string; root?: string }) {
  const store = await load(input.root ?? process.cwd());
  return store.conflicts.filter(
    (item) => item.tenantId === input.tenantId && item.universeId === input.universeId,
  );
}

export function nodeIds(nodes: DeviceNode[]) {
  return nodes.map((node) => node.id);
}
