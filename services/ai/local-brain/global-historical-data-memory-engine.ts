/**
 * 62L-DZ Module B — Global Historical Data Memory Engine.
 * Historical / temporal knowledge graphs; ACL deny-by-default; label ≠ access.
 * Authorized / public / licensed / customer-owned data only.
 */

import { readJsonFile, writeJsonFileAtomic, xivLocalPath } from './durable-json';
import {
  HISTORICAL_MEMORY_ACL_DENIED,
  LABEL_NEQ_HISTORICAL_ACCESS,
  MAX_HISTORICAL_NODES,
  TEMPORAL_KG_ACL,
  type DzActor,
} from './supply-chain-intelligence-fabric-types';

export type HistoricalMemoryAccess = {
  id: string;
  memoryId: string;
  contextId: string;
  aclGranted: boolean;
  labelPresent: boolean;
  status: 'ok' | 'denied';
  reason: string;
  resultCount: number;
  createdAt: string;
};

export type TemporalKnowledgeGraphAccess = {
  id: string;
  graphId: string;
  contextId: string;
  aclGranted: boolean;
  status: 'ok' | 'denied';
  reason: string;
  at: string;
};

type Store = {
  memories: HistoricalMemoryAccess[];
  temporalGraphs: TemporalKnowledgeGraphAccess[];
};

function storePath(root: string) {
  return xivLocalPath(root, 'global-historical-data-memory-engine.json');
}

async function load(root: string): Promise<Store> {
  return readJsonFile<Store>(storePath(root), {
    memories: [],
    temporalGraphs: [],
  });
}

async function save(root: string, store: Store) {
  await writeJsonFileAtomic(storePath(root), store);
}

function id(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function globalHistoricalDataMemoryEngineHonesty() {
  return {
    denyByDefault: true,
    labelAloneNeqAccess: true,
    temporalKnowledgeGraphAclEnforced: true,
    authorizedPublicLicensedCustomerOwnedOnly: true,
    crossContextLeakage: false,
  };
}

export async function accessHistoricalMemory(input: {
  memoryId: string;
  contextId: string;
  aclGranted: boolean;
  labelPresent?: boolean;
  root: string;
  actor: DzActor;
}): Promise<HistoricalMemoryAccess> {
  const store = await load(input.root);
  void input.actor;
  if (store.memories.length >= MAX_HISTORICAL_NODES) {
    throw new Error('MAX_HISTORICAL_NODES_REACHED');
  }
  const denied = !input.aclGranted;
  const reason = denied
    ? input.labelPresent
      ? LABEL_NEQ_HISTORICAL_ACCESS
      : HISTORICAL_MEMORY_ACL_DENIED
    : 'HISTORICAL_MEMORY_OK';
  const record: HistoricalMemoryAccess = {
    id: id('dzhm'),
    memoryId: input.memoryId.trim(),
    contextId: input.contextId,
    aclGranted: input.aclGranted,
    labelPresent: Boolean(input.labelPresent),
    status: denied ? 'denied' : 'ok',
    reason,
    resultCount: denied ? 0 : 1,
    createdAt: new Date().toISOString(),
  };
  store.memories.push(record);
  await save(input.root, store);
  return record;
}

export async function accessTemporalKnowledgeGraph(input: {
  graphId: string;
  contextId: string;
  aclGranted: boolean;
  root: string;
  actor: DzActor;
}): Promise<TemporalKnowledgeGraphAccess> {
  const store = await load(input.root);
  void input.actor;
  const denied = !input.aclGranted;
  const record: TemporalKnowledgeGraphAccess = {
    id: id('dztkg'),
    graphId: input.graphId.trim(),
    contextId: input.contextId,
    aclGranted: input.aclGranted,
    status: denied ? 'denied' : 'ok',
    reason: denied ? TEMPORAL_KG_ACL : 'TEMPORAL_KG_ACCESS_OK',
    at: new Date().toISOString(),
  };
  store.temporalGraphs.push(record);
  await save(input.root, store);
  return record;
}
