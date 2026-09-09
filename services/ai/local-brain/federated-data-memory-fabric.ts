/**
 * 62L-DE Federated Data/Memory Fabric —
 * Federated data/memory with rights/provenance.
 * Sealed silent routes DENIED; unsigned federation packs REJECTED.
 */

import { createHash } from 'node:crypto';
import { readJsonFile, writeJsonFileAtomic, xivLocalPath } from './durable-json';
import {
  DE_LOCKS,
  HONESTY_BANNER,
  KNOWLEDGE_EXCHANGE_PROVENANCE_DENIED,
  KNOWLEDGE_EXCHANGE_RIGHTS_DENIED,
  MAX_FABRIC_PACKS,
  SEALED_SILENT_ROUTE_DENIED,
  type DeActor,
  type KnowledgeAssetClass,
} from './knowledge-exchange-gateway-marketplace-types';

export type FabricFederationPack = {
  id: string;
  sourceUniverseId: string;
  targetUniverseId: string;
  assetClass: KnowledgeAssetClass;
  hasDataRights: boolean;
  hasProvenance: boolean;
  signed: boolean;
  signature: string | null;
  silent: boolean;
  status: 'ACCEPTED' | 'DENIED' | 'REJECTED';
  reason: string;
  payloadDigest: string;
  createdAt: string;
};

type Store = { packs: FabricFederationPack[] };

function storePath(root: string) {
  return xivLocalPath(root, 'federated-data-memory-fabric.json');
}

async function load(root: string): Promise<Store> {
  return readJsonFile<Store>(storePath(root), { packs: [] });
}

async function save(root: string, store: Store) {
  await writeJsonFileAtomic(storePath(root), store);
}

function id(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function signFabricPayload(payload: string, key: string): string {
  return createHash('sha256').update(`fabric::${key}::${payload}`).digest('hex');
}

export function federatedDataMemoryFabricHonesty() {
  return {
    banner: HONESTY_BANNER,
    sealedSilentFallback: DE_LOCKS.SEALED_SILENT_CLOUD_OR_UNIVERSE_FALLBACK,
    withoutRights: DE_LOCKS.KNOWLEDGE_EXCHANGE_WITHOUT_RIGHTS,
    withoutProvenance: DE_LOCKS.KNOWLEDGE_EXCHANGE_WITHOUT_PROVENANCE,
    localFirst: DE_LOCKS.LOCAL_FIRST,
  };
}

export async function submitFabricFederationPack(input: {
  sourceUniverseId: string;
  targetUniverseId: string;
  assetClass: KnowledgeAssetClass;
  payload: string;
  hasDataRights?: boolean;
  hasProvenance?: boolean;
  signature?: string | null;
  signingKey?: string | null;
  silent?: boolean;
  root: string;
  actor: DeActor;
}): Promise<{
  accepted: boolean;
  reason: string;
  pack?: FabricFederationPack;
  at: string;
}> {
  void input.actor;
  const store = await load(input.root);
  const now = new Date().toISOString();
  if (store.packs.length >= MAX_FABRIC_PACKS) {
    return { accepted: false, reason: 'MAX_FABRIC_PACKS_BOUNDED', at: now };
  }

  const digest = createHash('sha256').update(input.payload).digest('hex');
  const silent = input.silent === true;
  const sealedOrPrivate =
    input.assetClass === 'sealed' || input.assetClass === 'raw_private';
  const signature = input.signature ?? null;
  let signed = Boolean(signature);
  if (input.signingKey && signature) {
    signed = signFabricPayload(input.payload, input.signingKey) === signature;
  }

  if (silent && sealedOrPrivate) {
    const pack: FabricFederationPack = {
      id: id('fdmf'),
      sourceUniverseId: input.sourceUniverseId,
      targetUniverseId: input.targetUniverseId,
      assetClass: input.assetClass,
      hasDataRights: input.hasDataRights === true,
      hasProvenance: input.hasProvenance === true,
      signed,
      signature,
      silent: true,
      status: 'DENIED',
      reason: SEALED_SILENT_ROUTE_DENIED,
      payloadDigest: digest,
      createdAt: now,
    };
    store.packs.push(pack);
    await save(input.root, store);
    return { accepted: false, reason: pack.reason, pack, at: now };
  }

  if (input.hasDataRights !== true) {
    const pack: FabricFederationPack = {
      id: id('fdmf'),
      sourceUniverseId: input.sourceUniverseId,
      targetUniverseId: input.targetUniverseId,
      assetClass: input.assetClass,
      hasDataRights: false,
      hasProvenance: input.hasProvenance === true,
      signed,
      signature,
      silent,
      status: 'DENIED',
      reason: KNOWLEDGE_EXCHANGE_RIGHTS_DENIED,
      payloadDigest: digest,
      createdAt: now,
    };
    store.packs.push(pack);
    await save(input.root, store);
    return { accepted: false, reason: pack.reason, pack, at: now };
  }

  if (input.hasProvenance !== true) {
    const pack: FabricFederationPack = {
      id: id('fdmf'),
      sourceUniverseId: input.sourceUniverseId,
      targetUniverseId: input.targetUniverseId,
      assetClass: input.assetClass,
      hasDataRights: true,
      hasProvenance: false,
      signed,
      signature,
      silent,
      status: 'DENIED',
      reason: KNOWLEDGE_EXCHANGE_PROVENANCE_DENIED,
      payloadDigest: digest,
      createdAt: now,
    };
    store.packs.push(pack);
    await save(input.root, store);
    return { accepted: false, reason: pack.reason, pack, at: now };
  }

  if (!signed || !signature) {
    const pack: FabricFederationPack = {
      id: id('fdmf'),
      sourceUniverseId: input.sourceUniverseId,
      targetUniverseId: input.targetUniverseId,
      assetClass: input.assetClass,
      hasDataRights: true,
      hasProvenance: true,
      signed: false,
      signature: null,
      silent,
      status: 'REJECTED',
      reason: 'UNSIGNED_FEDERATED_DATA_MEMORY_PACK_REJECTED',
      payloadDigest: digest,
      createdAt: now,
    };
    store.packs.push(pack);
    await save(input.root, store);
    return { accepted: false, reason: pack.reason, pack, at: now };
  }

  const pack: FabricFederationPack = {
    id: id('fdmf'),
    sourceUniverseId: input.sourceUniverseId,
    targetUniverseId: input.targetUniverseId,
    assetClass: input.assetClass,
    hasDataRights: true,
    hasProvenance: true,
    signed: true,
    signature,
    silent,
    status: 'ACCEPTED',
    reason: 'FEDERATED_DATA_MEMORY_PACK_ACCEPTED',
    payloadDigest: digest,
    createdAt: now,
  };
  store.packs.push(pack);
  await save(input.root, store);
  return { accepted: true, reason: pack.reason, pack, at: now };
}
