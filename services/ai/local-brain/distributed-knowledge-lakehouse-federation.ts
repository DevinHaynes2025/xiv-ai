/**
 * 62L-DD Distributed Knowledge Lakehouse Federation —
 * Federated knowledge lakehouse routing.
 * Authorized/signed only; no raw private pooling by default;
 * sealed cannot silent-route.
 */

import { createHash } from 'node:crypto';
import { readJsonFile, writeJsonFileAtomic, xivLocalPath } from './durable-json';
import {
  DD_LOCKS,
  HONESTY_BANNER,
  MAX_FEDERATION_PACKS,
  RAW_PRIVATE_FEDERATION_DENIED,
  SEALED_SILENT_ROUTE_DENIED,
  UNSIGNED_FEDERATION_PACK_REJECTED,
  type DdActor,
  type LakehouseAssetClass,
} from './cognitive-service-mesh-types';

export type FederationLink = {
  id: string;
  sourceLakehouseId: string;
  targetLakehouseId: string;
  authorized: boolean;
  revoked: boolean;
  createdAt: string;
};

export type FederationPack = {
  id: string;
  sourceLakehouseId: string;
  targetLakehouseId: string;
  assetClass: LakehouseAssetClass;
  payloadDigest: string;
  signature: string | null;
  signed: boolean;
  silent: boolean;
  status: 'ACCEPTED' | 'DENIED' | 'REJECTED';
  reason: string;
  createdAt: string;
};

type Store = { links: FederationLink[]; packs: FederationPack[] };

function storePath(root: string) {
  return xivLocalPath(root, 'distributed-knowledge-lakehouse-federation.json');
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

export function signLakehouseFederationPayload(payload: string, keyMaterial: string): string {
  return createHash('sha256').update(`${keyMaterial}::${payload}`).digest('hex');
}

export function lakehouseFederationHonesty() {
  return {
    banner: HONESTY_BANNER,
    rawPrivateFederationDefault: DD_LOCKS.RAW_PRIVATE_LAKEHOUSE_FEDERATION_DEFAULT,
    unsignedAccepted: DD_LOCKS.UNSIGNED_FEDERATION_PACK_ACCEPTED,
    sealedSilentRoute: DD_LOCKS.SEALED_SILENT_LAKEHOUSE_ROUTE,
  };
}

export async function authorizeLakehouseFederation(input: {
  sourceLakehouseId: string;
  targetLakehouseId: string;
  root: string;
  actor: DdActor;
}): Promise<{ accepted: boolean; reason: string; link?: FederationLink; at: string }> {
  void input.actor;
  const store = await load(input.root);
  const now = new Date().toISOString();
  const link: FederationLink = {
    id: id('dklf'),
    sourceLakehouseId: input.sourceLakehouseId.trim(),
    targetLakehouseId: input.targetLakehouseId.trim(),
    authorized: true,
    revoked: false,
    createdAt: now,
  };
  store.links.push(link);
  await save(input.root, store);
  return { accepted: true, reason: 'LAKEHOUSE_FEDERATION_AUTHORIZED', link, at: now };
}

export async function submitLakehouseFederationPack(input: {
  sourceLakehouseId: string;
  targetLakehouseId: string;
  assetClass: LakehouseAssetClass;
  payload: string;
  signature?: string | null;
  signingKey?: string | null;
  silent?: boolean;
  root: string;
  actor: DdActor;
}): Promise<{ accepted: boolean; reason: string; pack?: FederationPack; at: string }> {
  void input.actor;
  const store = await load(input.root);
  const now = new Date().toISOString();
  if (store.packs.length >= MAX_FEDERATION_PACKS) {
    return { accepted: false, reason: 'MAX_FEDERATION_PACKS_BOUNDED', at: now };
  }

  const digest = createHash('sha256').update(input.payload).digest('hex');
  const silent = input.silent === true;
  let signature = input.signature ?? null;
  if (!signature && input.signingKey) {
    signature = signLakehouseFederationPayload(input.payload, input.signingKey);
  }
  const signed = Boolean(signature);

  const deny = (status: 'DENIED' | 'REJECTED', reason: string) => {
    const pack: FederationPack = {
      id: id('dklp'),
      sourceLakehouseId: input.sourceLakehouseId.trim(),
      targetLakehouseId: input.targetLakehouseId.trim(),
      assetClass: input.assetClass,
      payloadDigest: digest,
      signature,
      signed,
      silent,
      status,
      reason,
      createdAt: now,
    };
    store.packs.push(pack);
    return pack;
  };

  if (input.assetClass === 'raw_private') {
    const pack = deny('DENIED', RAW_PRIVATE_FEDERATION_DENIED);
    await save(input.root, store);
    return { accepted: false, reason: pack.reason, pack, at: now };
  }

  if ((input.assetClass === 'sealed' || silent) && silent) {
    const pack = deny('DENIED', SEALED_SILENT_ROUTE_DENIED);
    await save(input.root, store);
    return { accepted: false, reason: pack.reason, pack, at: now };
  }

  if (input.assetClass === 'sealed' && !signed) {
    const pack = deny('DENIED', SEALED_SILENT_ROUTE_DENIED);
    await save(input.root, store);
    return { accepted: false, reason: pack.reason, pack, at: now };
  }

  if (!signed || DD_LOCKS.UNSIGNED_FEDERATION_PACK_ACCEPTED) {
    const pack = deny('REJECTED', UNSIGNED_FEDERATION_PACK_REJECTED);
    await save(input.root, store);
    return { accepted: false, reason: pack.reason, pack, at: now };
  }

  const link = store.links.find(
    (l) =>
      l.sourceLakehouseId === input.sourceLakehouseId.trim() &&
      l.targetLakehouseId === input.targetLakehouseId.trim() &&
      l.authorized &&
      !l.revoked,
  );
  if (!link) {
    const pack = deny('DENIED', 'UNAUTHORIZED_LAKEHOUSE_FEDERATION_DENIED');
    await save(input.root, store);
    return { accepted: false, reason: pack.reason, pack, at: now };
  }

  if (
    input.assetClass !== 'approved_knowledge' &&
    input.assetClass !== 'approved_index' &&
    input.assetClass !== 'approved_model' &&
    input.assetClass !== 'experiment_metadata'
  ) {
    const pack = deny('DENIED', 'UNAPPROVED_LAKEHOUSE_ASSET_DENIED');
    await save(input.root, store);
    return { accepted: false, reason: pack.reason, pack, at: now };
  }

  const pack: FederationPack = {
    id: id('dklp'),
    sourceLakehouseId: input.sourceLakehouseId.trim(),
    targetLakehouseId: input.targetLakehouseId.trim(),
    assetClass: input.assetClass,
    payloadDigest: digest,
    signature,
    signed: true,
    silent: false,
    status: 'ACCEPTED',
    reason: 'SIGNED_AUTHORIZED_LAKEHOUSE_FEDERATION_ACCEPTED',
    createdAt: now,
  };
  store.packs.push(pack);
  await save(input.root, store);
  return { accepted: true, reason: pack.reason, pack, at: now };
}
