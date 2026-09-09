/**
 * 62L-DA Neural Knowledge Event Bus —
 * Signed knowledge-event routing across departments/workcells.
 * Unsigned events rejected; sealed/raw private cannot silently cross Universes/cloud.
 */

import { createHash } from 'node:crypto';
import { readJsonFile, writeJsonFileAtomic, xivLocalPath } from './durable-json';
import {
  DA_LOCKS,
  HONESTY_BANNER,
  MAX_KNOWLEDGE_EVENTS,
  SEALED_RAW_PRIVATE_SILENT_ROUTE_DENIED,
  UNSIGNED_KNOWLEDGE_EVENT_REJECTED,
  type DaActor,
  type KnowledgeContentClass,
} from './superbrain-runtime-kernel-types';

export type KnowledgeEvent = {
  id: string;
  sourceUniverseId: string;
  targetUniverseId: string;
  topic: string;
  contentClass: KnowledgeContentClass;
  payloadDigest: string;
  signature: string | null;
  signed: boolean;
  silentCrossRoute: boolean;
  status: 'ACCEPTED' | 'REJECTED' | 'DENIED';
  reason: string;
  createdAt: string;
};

export type KnowledgeBusResult = {
  accepted: boolean;
  reason: string;
  event?: KnowledgeEvent;
  at: string;
};

type Store = { events: KnowledgeEvent[] };

function storePath(root: string) {
  return xivLocalPath(root, 'neural-knowledge-event-bus.json');
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

export function signKnowledgePayload(payload: string, key: string): string {
  return createHash('sha256').update(`${key}::${payload}`).digest('hex');
}

export function neuralKnowledgeEventBusHonesty() {
  return {
    banner: HONESTY_BANNER,
    unsignedAccepted: DA_LOCKS.UNSIGNED_KNOWLEDGE_EVENT_ACCEPTED,
    sealedSilentFederation: DA_LOCKS.SEALED_RAW_PRIVATE_SILENT_FEDERATION,
    sealedSilentUniverse: DA_LOCKS.SEALED_RAW_PRIVATE_SILENT_UNIVERSE_ROUTE,
  };
}

export async function publishKnowledgeEvent(input: {
  sourceUniverseId: string;
  targetUniverseId: string;
  topic: string;
  payload: string;
  contentClass?: KnowledgeContentClass;
  signature?: string | null;
  signingKey?: string;
  silentCrossRoute?: boolean;
  root: string;
  actor: DaActor;
}): Promise<KnowledgeBusResult> {
  void input.actor;
  const store = await load(input.root);
  const now = new Date().toISOString();
  if (store.events.length >= MAX_KNOWLEDGE_EVENTS) {
    return { accepted: false, reason: 'MAX_KNOWLEDGE_EVENTS_BOUNDED', at: now };
  }

  const contentClass = input.contentClass ?? 'open';
  const digest = createHash('sha256').update(input.payload).digest('hex');
  const expected = input.signingKey
    ? signKnowledgePayload(input.payload, input.signingKey)
    : null;
  const signature = input.signature ?? null;
  const signed = Boolean(signature && expected && signature === expected);

  if (!signed || !signature) {
    const event: KnowledgeEvent = {
      id: id('nkeb'),
      sourceUniverseId: input.sourceUniverseId,
      targetUniverseId: input.targetUniverseId,
      topic: input.topic,
      contentClass,
      payloadDigest: digest,
      signature,
      signed: false,
      silentCrossRoute: input.silentCrossRoute === true,
      status: 'REJECTED',
      reason: UNSIGNED_KNOWLEDGE_EVENT_REJECTED,
      createdAt: now,
    };
    store.events.push(event);
    await save(input.root, store);
    return { accepted: false, reason: UNSIGNED_KNOWLEDGE_EVENT_REJECTED, event, at: now };
  }

  const crossUniverse = input.sourceUniverseId !== input.targetUniverseId;
  const silent = input.silentCrossRoute === true;
  if (
    silent &&
    crossUniverse &&
    (contentClass === 'sealed' || contentClass === 'raw_private')
  ) {
    const event: KnowledgeEvent = {
      id: id('nkeb'),
      sourceUniverseId: input.sourceUniverseId,
      targetUniverseId: input.targetUniverseId,
      topic: input.topic,
      contentClass,
      payloadDigest: digest,
      signature,
      signed: true,
      silentCrossRoute: true,
      status: 'DENIED',
      reason: SEALED_RAW_PRIVATE_SILENT_ROUTE_DENIED,
      createdAt: now,
    };
    store.events.push(event);
    await save(input.root, store);
    return {
      accepted: false,
      reason: SEALED_RAW_PRIVATE_SILENT_ROUTE_DENIED,
      event,
      at: now,
    };
  }

  const event: KnowledgeEvent = {
    id: id('nkeb'),
    sourceUniverseId: input.sourceUniverseId,
    targetUniverseId: input.targetUniverseId,
    topic: input.topic,
    contentClass,
    payloadDigest: digest,
    signature,
    signed: true,
    silentCrossRoute: silent,
    status: 'ACCEPTED',
    reason: 'KNOWLEDGE_EVENT_ROUTED_SIGNED',
    createdAt: now,
  };
  store.events.push(event);
  await save(input.root, store);
  return { accepted: true, reason: event.reason, event, at: now };
}
