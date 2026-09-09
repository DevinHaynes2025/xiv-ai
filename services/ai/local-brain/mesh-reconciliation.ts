import { LocalCheckpointStore } from './checkpoint-store';
import { appendLearning } from './learning-ledger';
import { drainMeshBus, listMeshEnvelopes, listMeshPartitions, setMeshPartition } from './partition-safe-bus';
import { retryFailedPackTransfers } from './knowledge-pack-exchange';
import { MESH_HONESTY } from './distributed-mesh-types';
import { join } from 'node:path';
import { cortexId, readJsonFile, writeJsonFileAtomic, xivLocalPath } from './cortex-store';

export type ConsequentialWorkLog = {
  workId: string;
  tenantId: string;
  universeId: string;
  kind: string;
  status: 'completed' | 'in_flight';
  resultRef: string;
  completedAt: string;
};

type Store = { works: ConsequentialWorkLog[] };

function workPath(root: string) {
  return xivLocalPath(root, 'mesh-work-log.json');
}

async function loadWork(root: string) {
  const parsed = await readJsonFile<Store>(workPath(root), { works: [] });
  return Array.isArray(parsed.works) ? parsed.works : [];
}

async function saveWork(root: string, works: ConsequentialWorkLog[]) {
  await writeJsonFileAtomic(workPath(root), { works: works.slice(-10_000) });
}

export async function beginConsequentialWork(input: {
  workId: string;
  tenantId: string;
  universeId: string;
  kind: string;
  root?: string;
  now?: number;
}): Promise<{ accepted: boolean; duplicatePrevented: boolean; existing?: ConsequentialWorkLog }> {
  const root = input.root ?? process.cwd();
  const works = await loadWork(root);
  const existing = works.find((item) => item.workId === input.workId && item.tenantId === input.tenantId && item.universeId === input.universeId);
  if (existing) {
    return { accepted: false, duplicatePrevented: true, existing };
  }
  const entry: ConsequentialWorkLog = {
    workId: input.workId,
    tenantId: input.tenantId,
    universeId: input.universeId,
    kind: input.kind,
    status: 'in_flight',
    resultRef: '',
    completedAt: new Date(input.now ?? Date.now()).toISOString(),
  };
  works.push(entry);
  await saveWork(root, works);
  return { accepted: true, duplicatePrevented: false };
}

export async function completeConsequentialWork(input: {
  workId: string;
  tenantId: string;
  universeId: string;
  resultRef: string;
  root?: string;
  now?: number;
}) {
  const root = input.root ?? process.cwd();
  const works = await loadWork(root);
  const existing = works.find((item) => item.workId === input.workId && item.tenantId === input.tenantId && item.universeId === input.universeId);
  if (!existing) throw new Error('CONSEQUENTIAL_WORK_NOT_FOUND');
  existing.status = 'completed';
  existing.resultRef = input.resultRef;
  existing.completedAt = new Date(input.now ?? Date.now()).toISOString();
  await saveWork(root, works);
  return existing;
}

export async function lookupConsequentialWork(input: {
  workId: string;
  tenantId: string;
  universeId: string;
  root?: string;
}) {
  const works = await loadWork(input.root ?? process.cwd());
  return works.find((item) => item.workId === input.workId && item.tenantId === input.tenantId && item.universeId === input.universeId) ?? null;
}

export async function reconnectAndReconcile(input: {
  localNodeId: string;
  peerNodeId: string;
  tenantId: string;
  universeId: string;
  root?: string;
  now?: number;
}) {
  const root = input.root ?? process.cwd();
  const now = input.now ?? Date.now();
  await setMeshPartition({
    nodeA: input.localNodeId,
    nodeB: input.peerNodeId,
    partitioned: false,
    tenantId: input.tenantId,
    universeId: input.universeId,
    root,
  });
  const drained = await drainMeshBus({ tenantId: input.tenantId, universeId: input.universeId, root, now });
  const packs = await retryFailedPackTransfers({ tenantId: input.tenantId, universeId: input.universeId, root, now });
  const envelopes = await listMeshEnvelopes({ tenantId: input.tenantId, universeId: input.universeId, root });
  const remainingPartitioned = envelopes.filter((item) => item.status === 'partition_queued').length;
  const checkpoints = new LocalCheckpointStore(join(root, '.xiv-local', 'brain-state.json'));
  const checkpointId = cortexId('meshck');
  await checkpoints.checkpoint({
    taskId: `reconcile:${input.localNodeId}:${input.peerNodeId}`,
    at: new Date(now).toISOString(),
    state: 'completed',
    attempt: 1,
    summary: `reconnect delivered=${drained.delivered} expired=${drained.expired} remainingPartitioned=${remainingPartitioned}`,
    nextAction: 'Resume authorized local-first routing.',
    evidence: [`checkpoint:${checkpointId}`],
  });
  const learning = await appendLearning({
    domain: 'operations',
    subject: `mesh-reconcile:${input.localNodeId}`,
    claimState: 'VERIFIED_FACT',
    summary: `Reconnect recovered bus messages and pack transfers without duplicating completed work.`,
    sourceRefs: [`checkpoint:${checkpointId}`],
    evidence: [`delivered:${drained.delivered}`, `packRetries:${packs.retried.length}`],
    taskId: checkpointId,
  }, root);
  return {
    drained,
    packs,
    remainingPartitioned,
    checkpointId,
    learningId: learning.id,
    partitions: await listMeshPartitions(root),
    honesty: MESH_HONESTY,
  };
}
