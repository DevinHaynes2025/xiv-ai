/**
 * 62L-DB Neural Memory Streaming Fabric —
 * Signed memory streaming fabric over DA knowledge event bus concepts.
 * Unsigned streams rejected; sealed/raw private cannot silently stream
 * cross-Universe or to cloud.
 */

import { createHash } from 'node:crypto';
import { readJsonFile, writeJsonFileAtomic, xivLocalPath } from './durable-json';
import {
  DB_LOCKS,
  HONESTY_BANNER,
  MAX_MEMORY_STREAMS,
  SEALED_RAW_PRIVATE_SILENT_STREAM_DENIED,
  UNSIGNED_MEMORY_STREAM_REJECTED,
  type DbActor,
  type MemoryContentClass,
} from './distributed-superbrain-runtime-mesh-types';

export type MemoryStream = {
  id: string;
  sourceUniverseId: string;
  targetUniverseId: string;
  topic: string;
  contentClass: MemoryContentClass;
  payloadDigest: string;
  signature: string | null;
  signed: boolean;
  silentCrossRoute: boolean;
  cloudTarget: boolean;
  status: 'ACCEPTED' | 'REJECTED' | 'DENIED' | 'SIGNED';
  reason: string;
  createdAt: string;
};

export type MemoryStreamResult = {
  accepted: boolean;
  reason: string;
  stream?: MemoryStream;
  at: string;
};

type Store = { streams: MemoryStream[] };

function storePath(root: string) {
  return xivLocalPath(root, 'neural-memory-streaming-fabric.json');
}

async function load(root: string): Promise<Store> {
  return readJsonFile<Store>(storePath(root), { streams: [] });
}

async function save(root: string, store: Store) {
  await writeJsonFileAtomic(storePath(root), store);
}

function id(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function signMemoryPayload(payload: string, key: string): string {
  return createHash('sha256').update(`memory-stream::${key}::${payload}`).digest('hex');
}

export function neuralMemoryStreamingFabricHonesty() {
  return {
    banner: HONESTY_BANNER,
    unsignedAccepted: DB_LOCKS.UNSIGNED_MEMORY_STREAM_ACCEPTED,
    sealedSilentCrossUniverse: DB_LOCKS.SEALED_RAW_PRIVATE_SILENT_CROSS_UNIVERSE_STREAM,
    sealedSilentCloud: DB_LOCKS.SEALED_RAW_PRIVATE_SILENT_CLOUD_STREAM,
  };
}

export async function publishMemoryStream(input: {
  sourceUniverseId: string;
  targetUniverseId: string;
  topic: string;
  payload: string;
  contentClass?: MemoryContentClass;
  signature?: string | null;
  signingKey?: string;
  silentCrossRoute?: boolean;
  cloudTarget?: boolean;
  root: string;
  actor: DbActor;
}): Promise<MemoryStreamResult> {
  void input.actor;
  const store = await load(input.root);
  const now = new Date().toISOString();
  if (store.streams.length >= MAX_MEMORY_STREAMS) {
    return { accepted: false, reason: 'MAX_MEMORY_STREAMS_BOUNDED', at: now };
  }

  const contentClass = input.contentClass ?? 'open';
  const digest = createHash('sha256').update(input.payload).digest('hex');
  const expected = input.signingKey
    ? signMemoryPayload(input.payload, input.signingKey)
    : null;
  const signature = input.signature ?? null;
  const signed = Boolean(signature && expected && signature === expected);
  const silent = input.silentCrossRoute === true;
  const cloudTarget = input.cloudTarget === true;
  const crossUniverse = input.sourceUniverseId !== input.targetUniverseId;

  if (!signed || !signature) {
    const stream: MemoryStream = {
      id: id('nmsf'),
      sourceUniverseId: input.sourceUniverseId,
      targetUniverseId: input.targetUniverseId,
      topic: input.topic,
      contentClass,
      payloadDigest: digest,
      signature,
      signed: false,
      silentCrossRoute: silent,
      cloudTarget,
      status: 'REJECTED',
      reason: UNSIGNED_MEMORY_STREAM_REJECTED,
      createdAt: now,
    };
    store.streams.push(stream);
    await save(input.root, store);
    return { accepted: false, reason: UNSIGNED_MEMORY_STREAM_REJECTED, stream, at: now };
  }

  if (
    (contentClass === 'sealed' || contentClass === 'raw_private') &&
    silent &&
    (crossUniverse || cloudTarget)
  ) {
    const stream: MemoryStream = {
      id: id('nmsf'),
      sourceUniverseId: input.sourceUniverseId,
      targetUniverseId: input.targetUniverseId,
      topic: input.topic,
      contentClass,
      payloadDigest: digest,
      signature,
      signed: true,
      silentCrossRoute: true,
      cloudTarget,
      status: 'DENIED',
      reason: SEALED_RAW_PRIVATE_SILENT_STREAM_DENIED,
      createdAt: now,
    };
    store.streams.push(stream);
    await save(input.root, store);
    return {
      accepted: false,
      reason: SEALED_RAW_PRIVATE_SILENT_STREAM_DENIED,
      stream,
      at: now,
    };
  }

  const stream: MemoryStream = {
    id: id('nmsf'),
    sourceUniverseId: input.sourceUniverseId,
    targetUniverseId: input.targetUniverseId,
    topic: input.topic,
    contentClass,
    payloadDigest: digest,
    signature,
    signed: true,
    silentCrossRoute: false,
    cloudTarget: false,
    status: 'ACCEPTED',
    reason: 'SIGNED_MEMORY_STREAM_ACCEPTED',
    createdAt: now,
  };
  store.streams.push(stream);
  await save(input.root, store);
  return { accepted: true, reason: stream.reason, stream, at: now };
}
