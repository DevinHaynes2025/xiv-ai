/**
 * 62L-CW Universe Intelligence Replication Network —
 * Signed intelligence replication between explicitly authorized Universes/nodes.
 * Unauthorized DENIED; unsigned/revoked packs REJECTED.
 * No raw private pooling by default; revocable.
 */

import { createHash } from 'node:crypto';
import { readJsonFile, writeJsonFileAtomic, xivLocalPath } from './durable-json';
import {
  CW_LOCKS,
  HONESTY_BANNER,
  MAX_REPLICATION_PACKS,
  REVOKED_REPLICATION_REJECTED,
  UNAUTHORIZED_UNIVERSE_REPLICATION_DENIED,
  UNSIGNED_REPLICATION_REJECTED,
  type CwActor,
} from './autonomous-research-infrastructure-os-types';

export type AuthorizedUniverseLink = {
  id: string;
  sourceUniverseId: string;
  targetUniverseId: string;
  authorized: boolean;
  revoked: boolean;
  createdAt: string;
};

export type ReplicationPack = {
  id: string;
  sourceUniverseId: string;
  targetUniverseId: string;
  payloadDigest: string;
  signature: string | null;
  signed: boolean;
  revoked: boolean;
  rawPrivatePooling: boolean;
  status: 'ACCEPTED' | 'DENIED' | 'REJECTED' | 'REVOKED';
  reason: string;
  createdAt: string;
};

export type ReplicationResult = {
  accepted: boolean;
  reason: string;
  pack?: ReplicationPack;
  link?: AuthorizedUniverseLink;
  at: string;
};

type Store = {
  links: AuthorizedUniverseLink[];
  packs: ReplicationPack[];
};

function storePath(root: string) {
  return xivLocalPath(root, 'universe-intelligence-replication-network.json');
}

async function load(root: string): Promise<Store> {
  return readJsonFile<Store>(storePath(root), { links: [], packs: [] });
}

async function save(root: string, store: Store) {
  await writeJsonFileAtomic(storePath(root), store);
}

function id(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function signReplicationPayload(payload: string, keyMaterial: string): string {
  return createHash('sha256').update(`${keyMaterial}::${payload}`).digest('hex');
}

export function universeReplicationHonesty() {
  return {
    banner: HONESTY_BANNER,
    unauthorizedReplication: CW_LOCKS.UNAUTHORIZED_UNIVERSE_REPLICATION,
    unsignedAccepted: CW_LOCKS.UNSIGNED_REPLICATION_PACK_ACCEPTED,
    revokedAccepted: CW_LOCKS.REVOKED_REPLICATION_PACK_ACCEPTED,
    rawPrivatePoolingByDefault: CW_LOCKS.RAW_PRIVATE_POOLING_BY_DEFAULT,
  };
}

export async function authorizeUniverseReplicationLink(input: {
  sourceUniverseId: string;
  targetUniverseId: string;
  root: string;
  actor: CwActor;
}): Promise<ReplicationResult> {
  void input.actor;
  const store = await load(input.root);
  const now = new Date().toISOString();
  const link: AuthorizedUniverseLink = {
    id: id('ulink'),
    sourceUniverseId: input.sourceUniverseId.trim(),
    targetUniverseId: input.targetUniverseId.trim(),
    authorized: true,
    revoked: false,
    createdAt: now,
  };
  store.links.push(link);
  await save(input.root, store);
  return {
    accepted: true,
    reason: 'UNIVERSE_REPLICATION_LINK_AUTHORIZED',
    link,
    at: now,
  };
}

export async function revokeUniverseReplicationLink(input: {
  linkId: string;
  root: string;
  actor: CwActor;
}): Promise<ReplicationResult> {
  void input.actor;
  const store = await load(input.root);
  const link = store.links.find((l) => l.id === input.linkId);
  if (!link) {
    return { accepted: false, reason: 'LINK_NOT_FOUND', at: new Date().toISOString() };
  }
  link.revoked = true;
  link.authorized = false;
  await save(input.root, store);
  return {
    accepted: true,
    reason: 'UNIVERSE_REPLICATION_LINK_REVOKED',
    link,
    at: new Date().toISOString(),
  };
}

export async function submitIntelligenceReplicationPack(input: {
  sourceUniverseId: string;
  targetUniverseId: string;
  payload: string;
  signature?: string | null;
  signingKey?: string | null;
  revoked?: boolean;
  rawPrivatePooling?: boolean;
  root: string;
  actor: CwActor;
}): Promise<ReplicationResult> {
  void input.actor;
  const store = await load(input.root);
  const now = new Date().toISOString();

  if (store.packs.length >= MAX_REPLICATION_PACKS) {
    return {
      accepted: false,
      reason: 'MAX_REPLICATION_PACKS_BOUNDED',
      at: now,
    };
  }

  const digest = createHash('sha256').update(input.payload).digest('hex');
  const signature = input.signature?.trim() || null;
  const expected =
    input.signingKey?.trim()
      ? signReplicationPayload(input.payload, input.signingKey.trim())
      : null;
  const signed = Boolean(signature && expected && signature === expected);

  if (input.revoked === true) {
    const pack: ReplicationPack = {
      id: id('rpack'),
      sourceUniverseId: input.sourceUniverseId,
      targetUniverseId: input.targetUniverseId,
      payloadDigest: digest,
      signature,
      signed,
      revoked: true,
      rawPrivatePooling: input.rawPrivatePooling === true,
      status: 'REJECTED',
      reason: REVOKED_REPLICATION_REJECTED,
      createdAt: now,
    };
    store.packs.push(pack);
    await save(input.root, store);
    return { accepted: false, reason: pack.reason, pack, at: now };
  }

  if (!signed || !signature) {
    const pack: ReplicationPack = {
      id: id('rpack'),
      sourceUniverseId: input.sourceUniverseId,
      targetUniverseId: input.targetUniverseId,
      payloadDigest: digest,
      signature,
      signed: false,
      revoked: false,
      rawPrivatePooling: input.rawPrivatePooling === true,
      status: 'REJECTED',
      reason: UNSIGNED_REPLICATION_REJECTED,
      createdAt: now,
    };
    store.packs.push(pack);
    await save(input.root, store);
    return { accepted: false, reason: pack.reason, pack, at: now };
  }

  const link = store.links.find(
    (l) =>
      l.sourceUniverseId === input.sourceUniverseId &&
      l.targetUniverseId === input.targetUniverseId &&
      l.authorized &&
      !l.revoked,
  );

  if (!link) {
    const pack: ReplicationPack = {
      id: id('rpack'),
      sourceUniverseId: input.sourceUniverseId,
      targetUniverseId: input.targetUniverseId,
      payloadDigest: digest,
      signature,
      signed: true,
      revoked: false,
      rawPrivatePooling: input.rawPrivatePooling === true,
      status: 'DENIED',
      reason: UNAUTHORIZED_UNIVERSE_REPLICATION_DENIED,
      createdAt: now,
    };
    store.packs.push(pack);
    await save(input.root, store);
    return { accepted: false, reason: pack.reason, pack, at: now };
  }

  if (input.rawPrivatePooling === true && CW_LOCKS.RAW_PRIVATE_POOLING_BY_DEFAULT === false) {
    const pack: ReplicationPack = {
      id: id('rpack'),
      sourceUniverseId: input.sourceUniverseId,
      targetUniverseId: input.targetUniverseId,
      payloadDigest: digest,
      signature,
      signed: true,
      revoked: false,
      rawPrivatePooling: true,
      status: 'DENIED',
      reason: 'RAW_PRIVATE_POOLING_DENIED_BY_DEFAULT',
      createdAt: now,
    };
    store.packs.push(pack);
    await save(input.root, store);
    return { accepted: false, reason: pack.reason, pack, at: now };
  }

  const pack: ReplicationPack = {
    id: id('rpack'),
    sourceUniverseId: input.sourceUniverseId,
    targetUniverseId: input.targetUniverseId,
    payloadDigest: digest,
    signature,
    signed: true,
    revoked: false,
    rawPrivatePooling: false,
    status: 'ACCEPTED',
    reason: 'SIGNED_AUTHORIZED_REPLICATION_ACCEPTED',
    createdAt: now,
  };
  store.packs.push(pack);
  await save(input.root, store);
  return { accepted: true, reason: pack.reason, pack, link, at: now };
}
