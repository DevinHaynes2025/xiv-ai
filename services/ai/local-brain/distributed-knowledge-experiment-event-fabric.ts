/**
 * 62L-CZ Distributed Knowledge/Experiment Event Fabric —
 * Distributed experiment and knowledge events under governed local-first rules.
 */

import { readJsonFile, writeJsonFileAtomic, xivLocalPath } from './durable-json';
import {
  CZ_LOCKS,
  HONESTY_BANNER,
  MAX_EVENT_FABRIC_EVENTS,
  type CzActor,
} from './intelligence-civilization-kernel-types';

export type FabricEventKind = 'knowledge' | 'experiment' | 'heartbeat' | 'audit';

export type FabricEvent = {
  id: string;
  kind: FabricEventKind;
  topic: string;
  payloadDigest: string;
  orgId: string;
  tenantId: string;
  universeId: string;
  sealed: boolean;
  authorized: boolean;
  status: 'ACCEPTED' | 'DENIED' | 'BOUNDED';
  reason: string;
  createdAt: string;
};

export type FabricResult = {
  accepted: boolean;
  reason: string;
  event?: FabricEvent;
  at: string;
};

type Store = { events: FabricEvent[] };

function storePath(root: string) {
  return xivLocalPath(root, 'distributed-knowledge-experiment-event-fabric.json');
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

function digest(payload: string): string {
  let h = 0;
  for (let i = 0; i < payload.length; i++) h = (h * 31 + payload.charCodeAt(i)) >>> 0;
  return `d${h.toString(16)}`;
}

export function eventFabricHonesty() {
  return {
    banner: HONESTY_BANNER,
    localFirst: CZ_LOCKS.LOCAL_FIRST,
    learningGrantsPermission: CZ_LOCKS.LEARNING_GRANTS_PERMISSION,
    founderSealedDenyByDefault: CZ_LOCKS.FOUNDER_SEALED_DENY_BY_DEFAULT,
  };
}

export async function publishFabricEvent(input: {
  kind: FabricEventKind;
  topic: string;
  payload: string;
  orgId: string;
  tenantId: string;
  universeId: string;
  sealed?: boolean;
  authorized?: boolean;
  root: string;
  actor: CzActor;
}): Promise<FabricResult> {
  void input.actor;
  const store = await load(input.root);
  const now = new Date().toISOString();
  if (store.events.length >= MAX_EVENT_FABRIC_EVENTS) {
    return { accepted: false, reason: 'MAX_EVENT_FABRIC_EVENTS_BOUNDED', at: now };
  }

  const authorized = input.authorized === true;
  const sealed = input.sealed === true;

  if (!authorized) {
    const denied: FabricEvent = {
      id: id('fevt'),
      kind: input.kind,
      topic: input.topic,
      payloadDigest: digest(input.payload),
      orgId: input.orgId,
      tenantId: input.tenantId,
      universeId: input.universeId,
      sealed,
      authorized: false,
      status: 'DENIED',
      reason: 'UNAUTHORIZED_FABRIC_EVENT_DENIED',
      createdAt: now,
    };
    store.events.push(denied);
    await save(input.root, store);
    return { accepted: false, reason: denied.reason, event: denied, at: now };
  }

  const event: FabricEvent = {
    id: id('fevt'),
    kind: input.kind,
    topic: input.topic.trim(),
    payloadDigest: digest(input.payload),
    orgId: input.orgId,
    tenantId: input.tenantId,
    universeId: input.universeId,
    sealed,
    authorized: true,
    status: 'ACCEPTED',
    reason: 'FABRIC_EVENT_ACCEPTED_LOCAL_FIRST',
    createdAt: now,
  };
  store.events.push(event);
  await save(input.root, store);
  return { accepted: true, reason: event.reason, event, at: now };
}

export async function listFabricEvents(input: {
  root: string;
  kind?: FabricEventKind;
}): Promise<FabricEvent[]> {
  const store = await load(input.root);
  if (!input.kind) return store.events;
  return store.events.filter((e) => e.kind === input.kind);
}
