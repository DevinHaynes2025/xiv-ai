/**
 * 62L-CN Distributed Global Memory Exchange —
 * Compact signed memory deltas for approved knowledge only.
 * No raw private pooling by default; unsigned/revoked rejected; checksum/conflict handling.
 */

import { createHash, createHmac } from 'node:crypto';

import { readJsonFile, writeJsonFileAtomic, xivLocalPath } from './durable-json';
import {
  CHECKSUM_CONFLICT,
  CN_LOCKS,
  HONESTY_BANNER,
  RAW_PRIVATE_POOLING_DENIED,
  REVOKED_DELTA_REJECTED,
  UNSIGNED_DELTA_REJECTED,
  type CnActor,
} from './world-knowledge-routing-os-types';

export type MemoryDelta = {
  id: string;
  compactPayload: string;
  checksumSha256: string;
  signature: string | null;
  signed: boolean;
  approved: boolean;
  revoked: boolean;
  rawPrivatePooling: false;
  createdAt: string;
  updatedAt: string;
};

export type MemoryExchangeResult = {
  accepted: boolean;
  reason: string;
  delta?: MemoryDelta;
  at: string;
};

type Store = {
  deltas: MemoryDelta[];
  imports: Array<{ id: string; deltaId: string; at: string; reason: string }>;
};

function storePath(root: string) {
  return xivLocalPath(root, 'distributed-global-memory-exchange.json');
}

async function load(root: string): Promise<Store> {
  return readJsonFile<Store>(storePath(root), { deltas: [], imports: [] });
}

async function save(root: string, store: Store) {
  await writeJsonFileAtomic(storePath(root), store);
}

function id(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

function checksum(payload: string) {
  return createHash('sha256').update(payload).digest('hex');
}

/** Deterministic local signing material — not production key management. */
function signPayload(payload: string, secret = 'xiv-cn-local-memory-delta') {
  return createHmac('sha256', secret).update(payload).digest('hex');
}

export function memoryExchangeHonesty() {
  return {
    banner: HONESTY_BANNER,
    l4AutonomyEnabled: CN_LOCKS.L4_AUTONOMY_ENABLED,
    rawPrivatePoolingDefault: CN_LOCKS.RAW_PRIVATE_POOLING_DEFAULT,
    memoryDeltaRequiresSignature: CN_LOCKS.MEMORY_DELTA_REQUIRES_SIGNATURE,
    memoryDeltaRevokable: CN_LOCKS.MEMORY_DELTA_REVOKABLE,
    unsignedDeltaAccepted: CN_LOCKS.UNSIGNED_DELTA_ACCEPTED,
    revokedDeltaAccepted: CN_LOCKS.REVOKED_DELTA_ACCEPTED,
    approvedKnowledgeOnly: CN_LOCKS.APPROVED_KNOWLEDGE_ONLY,
  };
}

export async function createSignedMemoryDelta(input: {
  compactPayload: string;
  approved?: boolean;
  sign?: boolean;
  root: string;
  actor: CnActor;
}): Promise<MemoryExchangeResult> {
  void input.actor;
  const store = await load(input.root);
  const now = new Date().toISOString();
  const signed = input.sign !== false;
  const sum = checksum(input.compactPayload);
  const delta: MemoryDelta = {
    id: id('mdelta'),
    compactPayload: input.compactPayload,
    checksumSha256: sum,
    signature: signed ? signPayload(`${sum}:${input.compactPayload}`) : null,
    signed,
    approved: input.approved === true,
    revoked: false,
    rawPrivatePooling: false,
    createdAt: now,
    updatedAt: now,
  };
  store.deltas.push(delta);
  await save(input.root, store);
  return {
    accepted: true,
    reason: signed ? 'SIGNED_MEMORY_DELTA_CREATED' : 'UNSIGNED_MEMORY_DELTA_REGISTERED',
    delta,
    at: now,
  };
}

export async function revokeMemoryDelta(input: {
  deltaId: string;
  root: string;
  actor: CnActor;
}): Promise<MemoryExchangeResult> {
  void input.actor;
  const store = await load(input.root);
  const now = new Date().toISOString();
  const delta = store.deltas.find((d) => d.id === input.deltaId);
  if (!delta) return { accepted: false, reason: 'DELTA_NOT_FOUND', at: now };
  delta.revoked = true;
  delta.approved = false;
  delta.updatedAt = now;
  await save(input.root, store);
  return { accepted: true, reason: 'MEMORY_DELTA_REVOKED', delta, at: now };
}

export async function exchangeMemoryDelta(input: {
  deltaId: string;
  operation: 'export' | 'import';
  /** Probe: attempt raw private pooling instead of compact signed delta. */
  attemptRawPrivatePooling?: boolean;
  /** Probe: present mismatched checksum. */
  overrideChecksum?: string;
  root: string;
  actor: CnActor;
}): Promise<MemoryExchangeResult> {
  void input.actor;
  const store = await load(input.root);
  const now = new Date().toISOString();

  if (input.attemptRawPrivatePooling === true) {
    return {
      accepted: false,
      reason: RAW_PRIVATE_POOLING_DENIED,
      at: now,
    };
  }

  const delta = store.deltas.find((d) => d.id === input.deltaId);
  if (!delta) return { accepted: false, reason: 'DELTA_NOT_FOUND', at: now };

  if (delta.revoked) {
    return { accepted: false, reason: REVOKED_DELTA_REJECTED, delta, at: now };
  }

  if (!delta.signed || !delta.signature) {
    return { accepted: false, reason: UNSIGNED_DELTA_REJECTED, delta, at: now };
  }

  if (!delta.approved) {
    return {
      accepted: false,
      reason: 'UNAPPROVED_MEMORY_DELTA_DENIED',
      delta,
      at: now,
    };
  }

  const expected = checksum(delta.compactPayload);
  if (delta.checksumSha256 !== expected) {
    return { accepted: false, reason: CHECKSUM_CONFLICT, delta, at: now };
  }
  if (input.overrideChecksum && input.overrideChecksum !== delta.checksumSha256) {
    return { accepted: false, reason: CHECKSUM_CONFLICT, delta, at: now };
  }

  const expectedSig = signPayload(`${delta.checksumSha256}:${delta.compactPayload}`);
  if (delta.signature !== expectedSig) {
    return { accepted: false, reason: UNSIGNED_DELTA_REJECTED, delta, at: now };
  }

  store.imports.push({
    id: id('mimp'),
    deltaId: delta.id,
    at: now,
    reason: `MEMORY_DELTA_${input.operation.toUpperCase()}_ACCEPTED`,
  });
  await save(input.root, store);
  return {
    accepted: true,
    reason: `MEMORY_DELTA_${input.operation.toUpperCase()}_ACCEPTED`,
    delta,
    at: now,
  };
}
