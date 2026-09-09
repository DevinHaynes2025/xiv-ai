/**
 * 62L-CL Offline/Cloud Superbrain Sync Fabric — signed/revocable offline↔cloud
 * knowledge synchronization with conflict/checksum handling.
 * No auto-trust of unverified packs.
 */

import { createHash } from 'node:crypto';
import { readJsonFile, writeJsonFileAtomic, xivLocalPath } from './durable-json';
import {
  CHECKSUM_CONFLICT_NOT_SILENT,
  CL_LOCKS,
  HONESTY_BANNER,
  UNSIGNED_OR_REVOKED_SYNC_PACK_REJECTED,
  type ClActor,
} from './global-knowledge-server-constellation-types';

export type SyncPack = {
  id: string;
  label: string;
  payloadDigest: string;
  signature: string | null;
  signed: boolean;
  revoked: boolean;
  trusted: boolean;
  status: 'candidate' | 'accepted' | 'rejected' | 'revoked';
  reason: string;
  createdAt: string;
};

export type SyncApplyAttempt = {
  id: string;
  packId: string;
  expectedChecksum: string;
  observedChecksum: string;
  conflict: boolean;
  status: 'accepted' | 'rejected';
  reason: string;
  at: string;
};

type Store = {
  packs: SyncPack[];
  applies: SyncApplyAttempt[];
};

function storePath(root: string) {
  return xivLocalPath(root, 'offline-cloud-superbrain-sync-fabric.json');
}

async function load(root: string): Promise<Store> {
  return readJsonFile<Store>(storePath(root), { packs: [], applies: [] });
}

async function save(root: string, store: Store) {
  await writeJsonFileAtomic(storePath(root), store);
}

function id(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

function digest(payload: string): string {
  return createHash('sha256').update(payload).digest('hex');
}

export function syncFabricHonesty() {
  return {
    banner: HONESTY_BANNER,
    l4AutonomyEnabled: CL_LOCKS.L4_AUTONOMY_ENABLED,
    requiresSignature: CL_LOCKS.SYNC_REQUIRES_SIGNATURE,
    revokable: CL_LOCKS.SYNC_REVOKABLE,
    autoTrustUnverified: CL_LOCKS.AUTO_TRUST_UNVERIFIED_PACKS,
    silentChecksumConflictAccept: CL_LOCKS.SILENT_CHECKSUM_CONFLICT_ACCEPT,
  };
}

export async function createSyncPack(input: {
  label: string;
  payload: string;
  signature?: string | null;
  root: string;
  actor: ClActor;
}): Promise<SyncPack> {
  const store = await load(input.root);
  const payloadDigest = digest(input.payload);
  const signed =
    typeof input.signature === 'string' && input.signature.trim().length > 0;
  const pack: SyncPack = {
    id: id('spack'),
    label: input.label,
    payloadDigest,
    signature: signed ? input.signature!.trim() : null,
    signed,
    revoked: false,
    trusted: false, // never auto-trust
    status: signed ? 'candidate' : 'rejected',
    reason: signed
      ? 'SYNC_PACK_SIGNED_CANDIDATE_NOT_AUTO_TRUSTED'
      : UNSIGNED_OR_REVOKED_SYNC_PACK_REJECTED,
    createdAt: new Date().toISOString(),
  };
  void input.actor;
  store.packs.push(pack);
  await save(input.root, store);
  return pack;
}

export async function revokeSyncPack(input: {
  packId: string;
  root: string;
  actor: ClActor;
}): Promise<{ accepted: boolean; pack: SyncPack | null; reason: string }> {
  const store = await load(input.root);
  const pack = store.packs.find((p) => p.id === input.packId) ?? null;
  void input.actor;
  if (!pack) {
    return { accepted: false, pack: null, reason: 'SYNC_PACK_NOT_FOUND' };
  }
  pack.revoked = true;
  pack.trusted = false;
  pack.status = 'revoked';
  pack.reason = UNSIGNED_OR_REVOKED_SYNC_PACK_REJECTED;
  await save(input.root, store);
  return { accepted: true, pack, reason: pack.reason };
}

export async function applySyncPack(input: {
  packId: string;
  expectedChecksum: string;
  observedPayload: string;
  root: string;
  actor: ClActor;
}): Promise<SyncApplyAttempt> {
  const store = await load(input.root);
  const pack = store.packs.find((p) => p.id === input.packId);
  void input.actor;
  const observedChecksum = digest(input.observedPayload);

  if (!pack || !pack.signed || pack.revoked || pack.status === 'rejected') {
    const attempt: SyncApplyAttempt = {
      id: id('sapply'),
      packId: input.packId,
      expectedChecksum: input.expectedChecksum,
      observedChecksum,
      conflict: false,
      status: 'rejected',
      reason: UNSIGNED_OR_REVOKED_SYNC_PACK_REJECTED,
      at: new Date().toISOString(),
    };
    store.applies.push(attempt);
    await save(input.root, store);
    return attempt;
  }

  const checksumOk =
    observedChecksum === input.expectedChecksum &&
    observedChecksum === pack.payloadDigest;
  if (!checksumOk) {
    const attempt: SyncApplyAttempt = {
      id: id('sapply'),
      packId: pack.id,
      expectedChecksum: input.expectedChecksum,
      observedChecksum,
      conflict: true,
      status: 'rejected',
      reason: CHECKSUM_CONFLICT_NOT_SILENT,
      at: new Date().toISOString(),
    };
    store.applies.push(attempt);
    await save(input.root, store);
    return attempt;
  }

  pack.status = 'accepted';
  pack.trusted = false; // accepted apply still not auto-trust expansion
  pack.reason = 'SYNC_PACK_APPLIED_WITH_CHECKSUM_MATCH_NOT_AUTO_TRUSTED';
  const attempt: SyncApplyAttempt = {
    id: id('sapply'),
    packId: pack.id,
    expectedChecksum: input.expectedChecksum,
    observedChecksum,
    conflict: false,
    status: 'accepted',
    reason: pack.reason,
    at: new Date().toISOString(),
  };
  store.applies.push(attempt);
  await save(input.root, store);
  return attempt;
}
