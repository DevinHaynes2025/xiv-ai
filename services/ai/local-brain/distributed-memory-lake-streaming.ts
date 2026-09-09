/**
 * 62L-DC Distributed Memory Lake Streaming —
 * Signed memory-lake streaming only.
 * Unsigned streams REJECTED; sealed/raw private silent streams DENIED.
 */

import { createHash } from 'node:crypto';
import { readJsonFile, writeJsonFileAtomic, xivLocalPath } from './durable-json';
import {
  DC_LOCKS,
  HONESTY_BANNER,
  MAX_MEMORY_STREAMS,
  SEALED_RAW_PRIVATE_SILENT_STREAM_DENIED,
  UNSIGNED_MEMORY_LAKE_STREAM_REJECTED,
  type DcActor,
  type MemoryAssetClass,
} from './superbrain-service-fabric-types';

export type MemoryLakeStream = {
  id: string;
  lakeId: string;
  assetClass: MemoryAssetClass;
  payloadDigest: string;
  signature: string | null;
  signed: boolean;
  silent: boolean;
  status: 'ACCEPTED' | 'DENIED' | 'REJECTED';
  reason: string;
  createdAt: string;
};

export type StreamResult = {
  accepted: boolean;
  reason: string;
  stream?: MemoryLakeStream;
  at: string;
};

type Store = { streams: MemoryLakeStream[] };

function storePath(root: string) {
  return xivLocalPath(root, 'distributed-memory-lake-streaming.json');
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

export function signMemoryLakePayload(payload: string, keyMaterial: string): string {
  return createHash('sha256').update(`${keyMaterial}::${payload}`).digest('hex');
}

export function memoryLakeStreamingHonesty() {
  return {
    banner: HONESTY_BANNER,
    unsignedAccepted: DC_LOCKS.UNSIGNED_MEMORY_LAKE_STREAM_ACCEPTED,
    silentSealedOrRawPrivate: DC_LOCKS.SILENT_SEALED_OR_RAW_PRIVATE_STREAM,
    localFirst: DC_LOCKS.LOCAL_FIRST,
  };
}

export async function openMemoryLakeStream(input: {
  lakeId: string;
  assetClass: MemoryAssetClass;
  payload: string;
  signature?: string | null;
  signingKey?: string | null;
  silent?: boolean;
  root: string;
  actor: DcActor;
}): Promise<StreamResult> {
  void input.actor;
  const store = await load(input.root);
  const now = new Date().toISOString();
  if (store.streams.length >= MAX_MEMORY_STREAMS) {
    return { accepted: false, reason: 'MAX_MEMORY_STREAMS_BOUNDED', at: now };
  }

  const digest = createHash('sha256').update(input.payload).digest('hex');
  const silent = input.silent === true;
  const sealedOrPrivate =
    input.assetClass === 'sealed' || input.assetClass === 'raw_private';

  if (silent && sealedOrPrivate) {
    const stream: MemoryLakeStream = {
      id: id('mls'),
      lakeId: input.lakeId.trim(),
      assetClass: input.assetClass,
      payloadDigest: digest,
      signature: input.signature ?? null,
      signed: Boolean(input.signature),
      silent: true,
      status: 'DENIED',
      reason: SEALED_RAW_PRIVATE_SILENT_STREAM_DENIED,
      createdAt: now,
    };
    store.streams.push(stream);
    await save(input.root, store);
    return { accepted: false, reason: stream.reason, stream, at: now };
  }

  if (!input.signature?.trim()) {
    const stream: MemoryLakeStream = {
      id: id('mls'),
      lakeId: input.lakeId.trim(),
      assetClass: input.assetClass,
      payloadDigest: digest,
      signature: null,
      signed: false,
      silent,
      status: 'REJECTED',
      reason: UNSIGNED_MEMORY_LAKE_STREAM_REJECTED,
      createdAt: now,
    };
    store.streams.push(stream);
    await save(input.root, store);
    return { accepted: false, reason: stream.reason, stream, at: now };
  }

  if (input.signingKey) {
    const expected = signMemoryLakePayload(input.payload, input.signingKey);
    if (expected !== input.signature) {
      const stream: MemoryLakeStream = {
        id: id('mls'),
        lakeId: input.lakeId.trim(),
        assetClass: input.assetClass,
        payloadDigest: digest,
        signature: input.signature,
        signed: false,
        silent,
        status: 'REJECTED',
        reason: UNSIGNED_MEMORY_LAKE_STREAM_REJECTED,
        createdAt: now,
      };
      store.streams.push(stream);
      await save(input.root, store);
      return { accepted: false, reason: stream.reason, stream, at: now };
    }
  }

  if (sealedOrPrivate || input.assetClass === 'unapproved') {
    const stream: MemoryLakeStream = {
      id: id('mls'),
      lakeId: input.lakeId.trim(),
      assetClass: input.assetClass,
      payloadDigest: digest,
      signature: input.signature,
      signed: true,
      silent,
      status: 'DENIED',
      reason: SEALED_RAW_PRIVATE_SILENT_STREAM_DENIED,
      createdAt: now,
    };
    store.streams.push(stream);
    await save(input.root, store);
    return { accepted: false, reason: stream.reason, stream, at: now };
  }

  const stream: MemoryLakeStream = {
    id: id('mls'),
    lakeId: input.lakeId.trim(),
    assetClass: input.assetClass,
    payloadDigest: digest,
    signature: input.signature,
    signed: true,
    silent: false,
    status: 'ACCEPTED',
    reason: 'SIGNED_MEMORY_LAKE_STREAM_ACCEPTED_LOCAL_SCOPE',
    createdAt: now,
  };
  store.streams.push(stream);
  await save(input.root, store);
  return { accepted: true, reason: stream.reason, stream, at: now };
}
