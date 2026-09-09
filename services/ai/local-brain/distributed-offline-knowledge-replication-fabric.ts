/**
 * 62L-CF Distributed Offline Knowledge Replication Fabric —
 * checksum-based offline replication; revocation; conflict handling;
 * no auto-trust of unverified packs.
 */

import { createHash } from 'node:crypto';

import { readJsonFile, writeJsonFileAtomic, xivLocalPath } from './durable-json';
import {
  CF_LOCKS,
  CHECKSUM_MISMATCH_REJECTED,
  HONESTY_BANNER,
  REVOKED_PACK_REJECTED,
  type CfActor,
} from './data-refinery-compression-replication-types';

export type ReplicationPack = {
  id: string;
  label: string;
  payload: string;
  checksumSha256: string;
  verified: boolean;
  revoked: boolean;
  trusted: boolean;
  productionAuthorized: false;
  createdAt: string;
  updatedAt: string;
};

export type ReplicationResult = {
  id: string;
  packId: string;
  operation: 'export' | 'import' | 'replicate';
  accepted: boolean;
  conflict: boolean;
  reason: string;
  at: string;
};

type Store = {
  packs: ReplicationPack[];
  results: ReplicationResult[];
};

function storePath(root: string) {
  return xivLocalPath(root, 'distributed-offline-knowledge-replication.json');
}

async function load(root: string): Promise<Store> {
  return readJsonFile<Store>(storePath(root), { packs: [], results: [] });
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

export function replicationHonesty() {
  return {
    banner: HONESTY_BANNER,
    l4AutonomyEnabled: CF_LOCKS.L4_AUTONOMY_ENABLED,
    checksumRequired: CF_LOCKS.OFFLINE_REPLICATION_CHECKSUM_REQUIRED,
    autoTrustUnverified: CF_LOCKS.AUTO_TRUST_UNVERIFIED_PACKS,
    revokedPackImportAllowed: CF_LOCKS.REVOKED_PACK_IMPORT_ALLOWED,
    checksumMismatchSilentAccept: CF_LOCKS.CHECKSUM_MISMATCH_SILENT_ACCEPT,
  };
}

export async function registerReplicationPack(input: {
  label: string;
  payload: string;
  verified?: boolean;
  root: string;
  actor: CfActor;
}): Promise<ReplicationPack> {
  const store = await load(input.root);
  const now = new Date().toISOString();
  const pack: ReplicationPack = {
    id: id('rpack'),
    label: input.label,
    payload: input.payload,
    checksumSha256: checksum(input.payload),
    verified: input.verified === true,
    revoked: false,
    // never auto-trust unverified
    trusted: input.verified === true,
    productionAuthorized: false,
    createdAt: now,
    updatedAt: now,
  };
  store.packs.push(pack);
  await save(input.root, store);
  return pack;
}

export async function revokeReplicationPack(input: {
  packId: string;
  root: string;
  actor: CfActor;
}): Promise<ReplicationPack | null> {
  const store = await load(input.root);
  const pack = store.packs.find((p) => p.id === input.packId);
  if (!pack) return null;
  pack.revoked = true;
  pack.trusted = false;
  pack.updatedAt = new Date().toISOString();
  await save(input.root, store);
  return pack;
}

export async function replicateOrImportPack(input: {
  packId: string;
  expectedChecksum?: string;
  providedPayload?: string;
  operation?: 'export' | 'import' | 'replicate';
  root: string;
  actor: CfActor;
}): Promise<ReplicationResult> {
  const store = await load(input.root);
  const pack = store.packs.find((p) => p.id === input.packId);
  const result: ReplicationResult = {
    id: id('repl'),
    packId: input.packId,
    operation: input.operation ?? 'replicate',
    accepted: false,
    conflict: false,
    reason: 'PACK_NOT_FOUND',
    at: new Date().toISOString(),
  };

  if (!pack) {
    store.results.push(result);
    await save(input.root, store);
    return result;
  }

  if (pack.revoked) {
    result.accepted = false;
    result.reason = REVOKED_PACK_REJECTED;
    store.results.push(result);
    await save(input.root, store);
    return result;
  }

  if (!pack.verified && !pack.trusted) {
    result.accepted = false;
    result.reason = 'UNVERIFIED_PACK_NOT_AUTO_TRUSTED';
    store.results.push(result);
    await save(input.root, store);
    return result;
  }

  const payload = input.providedPayload ?? pack.payload;
  const actual = checksum(payload);
  const expected = input.expectedChecksum ?? pack.checksumSha256;

  if (actual !== expected || actual !== pack.checksumSha256) {
    result.accepted = false;
    result.conflict = true;
    result.reason = CHECKSUM_MISMATCH_REJECTED;
    store.results.push(result);
    await save(input.root, store);
    return result;
  }

  result.accepted = true;
  result.reason = 'CHECKSUM_VERIFIED_REPLICATION_ACCEPTED';
  store.results.push(result);
  await save(input.root, store);
  return result;
}
