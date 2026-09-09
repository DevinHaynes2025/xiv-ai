/**
 * 62L-DB Universe State Replication & Recovery Grid —
 * Signed/revocable Universe state replication with recovery and rollback.
 * Unauthorized / unsigned / revoked rejected.
 * Rollback cannot invent RUNNING_VERIFIED without heartbeat evidence.
 */

import { createHash } from 'node:crypto';
import { readJsonFile, writeJsonFileAtomic, xivLocalPath } from './durable-json';
import {
  DB_LOCKS,
  HONESTY_BANNER,
  MAX_REPLICATION_PACKS,
  NO_HEARTBEAT_NOT_RUNNING_VERIFIED,
  REVOKED_REPLICATION_REJECTED,
  ROLLBACK_NO_HEARTBEAT_NOT_RUNNING_VERIFIED,
  SEALED_RAW_PRIVATE_SILENT_STREAM_DENIED,
  UNSIGNED_REPLICATION_REJECTED,
  type DbActor,
  type MemoryContentClass,
  type MeshNodeStatus,
} from './distributed-superbrain-runtime-mesh-types';

export type ReplicationPack = {
  id: string;
  sourceUniverseId: string;
  targetUniverseId: string;
  payloadDigest: string;
  signature: string | null;
  signed: boolean;
  revoked: boolean;
  authorized: boolean;
  contentClass: MemoryContentClass;
  silentRoute: boolean;
  status: 'ACCEPTED' | 'REJECTED' | 'DENIED' | 'REVOKED';
  reason: string;
  createdAt: string;
};

export type RecoveryCheckpoint = {
  id: string;
  packId: string;
  claimedRunningVerified: boolean;
  hasHeartbeatEvidence: boolean;
  status: MeshNodeStatus | 'ROLLED_BACK' | 'DENIED';
  reason: string;
  at: string;
};

export type ReplicationResult = {
  accepted: boolean;
  reason: string;
  pack?: ReplicationPack;
  checkpoint?: RecoveryCheckpoint;
  at: string;
};

type Store = {
  packs: ReplicationPack[];
  checkpoints: RecoveryCheckpoint[];
  authorizedLinks: Array<{
    id: string;
    sourceUniverseId: string;
    targetUniverseId: string;
  }>;
};

function storePath(root: string) {
  return xivLocalPath(root, 'universe-state-replication-recovery-grid.json');
}

async function load(root: string): Promise<Store> {
  return readJsonFile<Store>(storePath(root), {
    packs: [],
    checkpoints: [],
    authorizedLinks: [],
  });
}

async function save(root: string, store: Store) {
  await writeJsonFileAtomic(storePath(root), store);
}

function id(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function signReplicationPayload(payload: string, key: string): string {
  return createHash('sha256').update(`replication::${key}::${payload}`).digest('hex');
}

export function universeStateReplicationRecoveryGridHonesty() {
  return {
    banner: HONESTY_BANNER,
    unsignedAccepted: DB_LOCKS.UNSIGNED_REPLICATION_PACK_ACCEPTED,
    revokedAccepted: DB_LOCKS.REVOKED_REPLICATION_PACK_ACCEPTED,
    sealedSilentRoute: DB_LOCKS.SEALED_RAW_PRIVATE_SILENT_CROSS_UNIVERSE_STREAM,
    rollbackInventsRunningVerified: DB_LOCKS.ROLLBACK_INVENTS_RUNNING_VERIFIED,
  };
}

export async function authorizeReplicationLink(input: {
  sourceUniverseId: string;
  targetUniverseId: string;
  root: string;
  actor: DbActor;
}): Promise<{ accepted: boolean; reason: string; at: string }> {
  void input.actor;
  const store = await load(input.root);
  const now = new Date().toISOString();
  store.authorizedLinks.push({
    id: id('rlink'),
    sourceUniverseId: input.sourceUniverseId,
    targetUniverseId: input.targetUniverseId,
  });
  await save(input.root, store);
  return { accepted: true, reason: 'REPLICATION_LINK_AUTHORIZED', at: now };
}

export async function submitReplicationPack(input: {
  sourceUniverseId: string;
  targetUniverseId: string;
  payload: string;
  signature?: string | null;
  signingKey?: string;
  revoked?: boolean;
  contentClass?: MemoryContentClass;
  silentRoute?: boolean;
  root: string;
  actor: DbActor;
}): Promise<ReplicationResult> {
  void input.actor;
  const store = await load(input.root);
  const now = new Date().toISOString();
  if (store.packs.length >= MAX_REPLICATION_PACKS) {
    return { accepted: false, reason: 'MAX_REPLICATION_PACKS_BOUNDED', at: now };
  }

  const digest = createHash('sha256').update(input.payload).digest('hex');
  const expected = input.signingKey
    ? signReplicationPayload(input.payload, input.signingKey)
    : null;
  const signature = input.signature ?? null;
  const signed = Boolean(signature && expected && signature === expected);
  const contentClass = input.contentClass ?? 'open';
  const linkOk = store.authorizedLinks.some(
    (l) =>
      l.sourceUniverseId === input.sourceUniverseId &&
      l.targetUniverseId === input.targetUniverseId,
  );

  if (input.revoked === true) {
    const pack: ReplicationPack = {
      id: id('usrp'),
      sourceUniverseId: input.sourceUniverseId,
      targetUniverseId: input.targetUniverseId,
      payloadDigest: digest,
      signature,
      signed,
      revoked: true,
      authorized: linkOk,
      contentClass,
      silentRoute: input.silentRoute === true,
      status: 'REVOKED',
      reason: REVOKED_REPLICATION_REJECTED,
      createdAt: now,
    };
    store.packs.push(pack);
    await save(input.root, store);
    return { accepted: false, reason: REVOKED_REPLICATION_REJECTED, pack, at: now };
  }

  if (!signed || !signature) {
    const pack: ReplicationPack = {
      id: id('usrp'),
      sourceUniverseId: input.sourceUniverseId,
      targetUniverseId: input.targetUniverseId,
      payloadDigest: digest,
      signature,
      signed: false,
      revoked: false,
      authorized: linkOk,
      contentClass,
      silentRoute: input.silentRoute === true,
      status: 'REJECTED',
      reason: UNSIGNED_REPLICATION_REJECTED,
      createdAt: now,
    };
    store.packs.push(pack);
    await save(input.root, store);
    return { accepted: false, reason: UNSIGNED_REPLICATION_REJECTED, pack, at: now };
  }

  if (
    input.silentRoute === true &&
    (contentClass === 'sealed' || contentClass === 'raw_private')
  ) {
    const pack: ReplicationPack = {
      id: id('usrp'),
      sourceUniverseId: input.sourceUniverseId,
      targetUniverseId: input.targetUniverseId,
      payloadDigest: digest,
      signature,
      signed: true,
      revoked: false,
      authorized: linkOk,
      contentClass,
      silentRoute: true,
      status: 'DENIED',
      reason: SEALED_RAW_PRIVATE_SILENT_STREAM_DENIED,
      createdAt: now,
    };
    store.packs.push(pack);
    await save(input.root, store);
    return {
      accepted: false,
      reason: SEALED_RAW_PRIVATE_SILENT_STREAM_DENIED,
      pack,
      at: now,
    };
  }

  if (!linkOk) {
    const pack: ReplicationPack = {
      id: id('usrp'),
      sourceUniverseId: input.sourceUniverseId,
      targetUniverseId: input.targetUniverseId,
      payloadDigest: digest,
      signature,
      signed: true,
      revoked: false,
      authorized: false,
      contentClass,
      silentRoute: input.silentRoute === true,
      status: 'DENIED',
      reason: 'UNAUTHORIZED_REPLICATION_ROUTE_DENIED',
      createdAt: now,
    };
    store.packs.push(pack);
    await save(input.root, store);
    return { accepted: false, reason: pack.reason, pack, at: now };
  }

  const pack: ReplicationPack = {
    id: id('usrp'),
    sourceUniverseId: input.sourceUniverseId,
    targetUniverseId: input.targetUniverseId,
    payloadDigest: digest,
    signature,
    signed: true,
    revoked: false,
    authorized: true,
    contentClass,
    silentRoute: false,
    status: 'ACCEPTED',
    reason: 'REPLICATION_PACK_ACCEPTED',
    createdAt: now,
  };
  store.packs.push(pack);
  await save(input.root, store);
  return { accepted: true, reason: pack.reason, pack, at: now };
}

export async function rollbackReplicationWithoutInventingRunning(input: {
  packId: string;
  claimRunningVerified?: boolean;
  hasHeartbeatEvidence?: boolean;
  root: string;
  actor: DbActor;
}): Promise<ReplicationResult> {
  void input.actor;
  const store = await load(input.root);
  const now = new Date().toISOString();
  const pack = store.packs.find((p) => p.id === input.packId);
  if (!pack) {
    return { accepted: false, reason: 'REPLICATION_PACK_NOT_FOUND', at: now };
  }

  if (input.claimRunningVerified === true && input.hasHeartbeatEvidence !== true) {
    const checkpoint: RecoveryCheckpoint = {
      id: id('rchk'),
      packId: pack.id,
      claimedRunningVerified: false,
      hasHeartbeatEvidence: false,
      status: 'DENIED',
      reason: ROLLBACK_NO_HEARTBEAT_NOT_RUNNING_VERIFIED,
      at: now,
    };
    store.checkpoints.push(checkpoint);
    await save(input.root, store);
    return {
      accepted: false,
      reason: ROLLBACK_NO_HEARTBEAT_NOT_RUNNING_VERIFIED,
      pack,
      checkpoint,
      at: now,
    };
  }

  const checkpoint: RecoveryCheckpoint = {
    id: id('rchk'),
    packId: pack.id,
    claimedRunningVerified: false,
    hasHeartbeatEvidence: input.hasHeartbeatEvidence === true,
    status: 'ROLLED_BACK',
    reason:
      input.hasHeartbeatEvidence === true
        ? 'ROLLBACK_ACCEPTED_WITHOUT_INVENTING_STATUS'
        : NO_HEARTBEAT_NOT_RUNNING_VERIFIED,
    at: now,
  };
  store.checkpoints.push(checkpoint);
  await save(input.root, store);
  return {
    accepted: true,
    reason: checkpoint.reason,
    pack,
    checkpoint,
    at: now,
  };
}
