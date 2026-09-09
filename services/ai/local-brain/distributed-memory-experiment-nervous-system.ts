/**
 * 62L-CY Distributed Memory/Experiment Nervous System —
 * Bounded distributed experiment/memory synchronization.
 * Does not invent live workers or grant production authority.
 */

import { readJsonFile, writeJsonFileAtomic, xivLocalPath } from './durable-json';
import {
  CY_LOCKS,
  HONESTY_BANNER,
  MAX_NERVOUS_SYNC_EVENTS,
  type CyActor,
} from './knowledge-colony-operating-system-types';

export type NervousSyncEvent = {
  id: string;
  kind: 'memory' | 'experiment' | 'heartbeat_mirror';
  sourceNodeId: string;
  targetNodeId: string;
  payloadRef: string;
  containsRawPrivate: boolean;
  status: 'SYNCED' | 'BOUNDED' | 'DENIED' | 'REJECTED';
  reason: string;
  at: string;
};

export type NervousResult = {
  accepted: boolean;
  reason: string;
  event?: NervousSyncEvent;
  at: string;
};

type Store = { events: NervousSyncEvent[] };

function storePath(root: string) {
  return xivLocalPath(root, 'distributed-memory-experiment-nervous-system.json');
}

async function load(root: string): Promise<Store> {
  return readJsonFile<Store>(storePath(root), { events: [] });
}

async function save(root: string, store: Store) {
  await writeJsonFileAtomic(storePath(root), store);
}

function id(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function nervousSystemHonesty() {
  return {
    banner: HONESTY_BANNER,
    localFirst: CY_LOCKS.LOCAL_FIRST,
    learningGrantsPermission: CY_LOCKS.LEARNING_GRANTS_PERMISSION,
    productionAuthorization: CY_LOCKS.PRODUCTION_AUTHORIZATION,
  };
}

export async function syncNervousSystemEvent(input: {
  kind: 'memory' | 'experiment' | 'heartbeat_mirror';
  sourceNodeId: string;
  targetNodeId: string;
  payloadRef: string;
  containsRawPrivate?: boolean;
  root: string;
  actor: CyActor;
}): Promise<NervousResult> {
  void input.actor;
  const store = await load(input.root);
  const now = new Date().toISOString();
  if (store.events.length >= MAX_NERVOUS_SYNC_EVENTS) {
    return {
      accepted: false,
      reason: 'MAX_NERVOUS_SYNC_EVENTS_BOUNDED',
      at: now,
    };
  }

  if (input.containsRawPrivate === true) {
    const event: NervousSyncEvent = {
      id: id('dmen'),
      kind: input.kind,
      sourceNodeId: input.sourceNodeId,
      targetNodeId: input.targetNodeId,
      payloadRef: input.payloadRef,
      containsRawPrivate: true,
      status: 'DENIED',
      reason: 'RAW_PRIVATE_NERVOUS_SYNC_DENIED',
      at: now,
    };
    store.events.push(event);
    await save(input.root, store);
    return { accepted: false, reason: event.reason, event, at: now };
  }

  const event: NervousSyncEvent = {
    id: id('dmen'),
    kind: input.kind,
    sourceNodeId: input.sourceNodeId.trim() || 'src',
    targetNodeId: input.targetNodeId.trim() || 'dst',
    payloadRef: input.payloadRef.trim() || 'payload',
    containsRawPrivate: false,
    status: 'SYNCED',
    reason: 'DISTRIBUTED_MEMORY_EXPERIMENT_SYNC_BOUNDED',
    at: now,
  };
  store.events.push(event);
  await save(input.root, store);
  return { accepted: true, reason: event.reason, event, at: now };
}
