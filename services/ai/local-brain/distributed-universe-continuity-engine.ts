/**
 * 62L-DA Distributed Universe Continuity Engine —
 * Signed/revocable Universe continuity and recovery packs.
 * Unauthorized / unsigned / revoked rejected.
 * Recovery cannot invent RUNNING_VERIFIED without heartbeat evidence.
 */

import { createHash } from 'node:crypto';
import { readJsonFile, writeJsonFileAtomic, xivLocalPath } from './durable-json';
import {
  DA_LOCKS,
  HONESTY_BANNER,
  MAX_CONTINUITY_PACKS,
  NO_HEARTBEAT_NOT_RUNNING_VERIFIED,
  REVOKED_CONTINUITY_REJECTED,
  SEALED_RAW_PRIVATE_SILENT_ROUTE_DENIED,
  UNSIGNED_CONTINUITY_REJECTED,
  type DaActor,
  type KnowledgeContentClass,
} from './superbrain-runtime-kernel-types';

export type ContinuityPack = {
  id: string;
  sourceUniverseId: string;
  targetUniverseId: string;
  payloadDigest: string;
  signature: string | null;
  signed: boolean;
  revoked: boolean;
  authorized: boolean;
  contentClass: KnowledgeContentClass;
  silentRoute: boolean;
  status: 'ACCEPTED' | 'REJECTED' | 'DENIED' | 'REVOKED';
  reason: string;
  createdAt: string;
};

export type ContinuityResult = {
  accepted: boolean;
  reason: string;
  pack?: ContinuityPack;
  at: string;
};

type Store = {
  packs: ContinuityPack[];
  authorizedLinks: Array<{
    id: string;
    sourceUniverseId: string;
    targetUniverseId: string;
  }>;
};

function storePath(root: string) {
  return xivLocalPath(root, 'distributed-universe-continuity-engine.json');
}

async function load(root: string): Promise<Store> {
  return readJsonFile<Store>(storePath(root), { packs: [], authorizedLinks: [] });
}

async function save(root: string, store: Store) {
  await writeJsonFileAtomic(storePath(root), store);
}

function id(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function signContinuityPayload(payload: string, key: string): string {
  return createHash('sha256').update(`continuity::${key}::${payload}`).digest('hex');
}

export function universeContinuityEngineHonesty() {
  return {
    banner: HONESTY_BANNER,
    unsignedAccepted: DA_LOCKS.UNSIGNED_CONTINUITY_PACK_ACCEPTED,
    revokedAccepted: DA_LOCKS.REVOKED_CONTINUITY_PACK_ACCEPTED,
    sealedSilentRoute: DA_LOCKS.SEALED_RAW_PRIVATE_SILENT_UNIVERSE_ROUTE,
    recoveryInventRunningVerified: DA_LOCKS.RUNNING_VERIFIED_WITHOUT_HEARTBEAT,
  };
}

export async function authorizeContinuityLink(input: {
  sourceUniverseId: string;
  targetUniverseId: string;
  root: string;
  actor: DaActor;
}): Promise<{ accepted: boolean; reason: string; at: string }> {
  void input.actor;
  const store = await load(input.root);
  const now = new Date().toISOString();
  store.authorizedLinks.push({
    id: id('clink'),
    sourceUniverseId: input.sourceUniverseId,
    targetUniverseId: input.targetUniverseId,
  });
  await save(input.root, store);
  return { accepted: true, reason: 'CONTINUITY_LINK_AUTHORIZED', at: now };
}

export async function submitContinuityPack(input: {
  sourceUniverseId: string;
  targetUniverseId: string;
  payload: string;
  signature?: string | null;
  signingKey?: string;
  revoked?: boolean;
  contentClass?: KnowledgeContentClass;
  silentRoute?: boolean;
  root: string;
  actor: DaActor;
}): Promise<ContinuityResult> {
  void input.actor;
  const store = await load(input.root);
  const now = new Date().toISOString();
  if (store.packs.length >= MAX_CONTINUITY_PACKS) {
    return { accepted: false, reason: 'MAX_CONTINUITY_PACKS_BOUNDED', at: now };
  }

  const digest = createHash('sha256').update(input.payload).digest('hex');
  const expected = input.signingKey
    ? signContinuityPayload(input.payload, input.signingKey)
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
    const pack: ContinuityPack = {
      id: id('duc'),
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
      reason: REVOKED_CONTINUITY_REJECTED,
      createdAt: now,
    };
    store.packs.push(pack);
    await save(input.root, store);
    return { accepted: false, reason: REVOKED_CONTINUITY_REJECTED, pack, at: now };
  }

  if (!signed || !signature) {
    const pack: ContinuityPack = {
      id: id('duc'),
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
      reason: UNSIGNED_CONTINUITY_REJECTED,
      createdAt: now,
    };
    store.packs.push(pack);
    await save(input.root, store);
    return { accepted: false, reason: UNSIGNED_CONTINUITY_REJECTED, pack, at: now };
  }

  if (
    input.silentRoute === true &&
    (contentClass === 'sealed' || contentClass === 'raw_private')
  ) {
    const pack: ContinuityPack = {
      id: id('duc'),
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
      reason: SEALED_RAW_PRIVATE_SILENT_ROUTE_DENIED,
      createdAt: now,
    };
    store.packs.push(pack);
    await save(input.root, store);
    return {
      accepted: false,
      reason: SEALED_RAW_PRIVATE_SILENT_ROUTE_DENIED,
      pack,
      at: now,
    };
  }

  if (!linkOk) {
    const pack: ContinuityPack = {
      id: id('duc'),
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
      reason: 'UNAUTHORIZED_CONTINUITY_ROUTE_DENIED',
      createdAt: now,
    };
    store.packs.push(pack);
    await save(input.root, store);
    return { accepted: false, reason: pack.reason, pack, at: now };
  }

  const pack: ContinuityPack = {
    id: id('duc'),
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
    reason: 'CONTINUITY_PACK_ACCEPTED',
    createdAt: now,
  };
  store.packs.push(pack);
  await save(input.root, store);
  return { accepted: true, reason: pack.reason, pack, at: now };
}

export async function attemptContinuityRecoveryWithoutHeartbeat(input: {
  claimRunningVerified: boolean;
  hasHeartbeatEvidence?: boolean;
  root: string;
  actor: DaActor;
}): Promise<{ accepted: boolean; reason: string; claimedRunningVerified: boolean; at: string }> {
  void input.root;
  void input.actor;
  const now = new Date().toISOString();
  if (input.claimRunningVerified && input.hasHeartbeatEvidence !== true) {
    return {
      accepted: false,
      reason: NO_HEARTBEAT_NOT_RUNNING_VERIFIED,
      claimedRunningVerified: false,
      at: now,
    };
  }
  return {
    accepted: false,
    reason: NO_HEARTBEAT_NOT_RUNNING_VERIFIED,
    claimedRunningVerified: false,
    at: now,
  };
}
