/**
 * 62L-CY Universe Knowledge Routing Grid —
 * Explicit signed knowledge routes between authorized Universes only.
 * Sealed or raw private silent routes DENIED.
 * Unsigned route packs REJECTED.
 */

import { createHash } from 'node:crypto';
import { readJsonFile, writeJsonFileAtomic, xivLocalPath } from './durable-json';
import {
  CY_LOCKS,
  HONESTY_BANNER,
  MAX_ROUTE_PACKS,
  SEALED_OR_RAW_PRIVATE_ROUTE_DENIED,
  UNAUTHORIZED_UNIVERSE_ROUTE_DENIED,
  UNSIGNED_ROUTE_PACK_REJECTED,
  type CyActor,
  type KnowledgeAssetClass,
} from './knowledge-colony-operating-system-types';

export type AuthorizedRouteLink = {
  id: string;
  sourceUniverseId: string;
  targetUniverseId: string;
  authorized: boolean;
  revoked: boolean;
  createdAt: string;
};

export type KnowledgeRoutePack = {
  id: string;
  sourceUniverseId: string;
  targetUniverseId: string;
  assetClass: KnowledgeAssetClass;
  payloadDigest: string;
  signature: string | null;
  signed: boolean;
  silent: boolean;
  status: 'ACCEPTED' | 'DENIED' | 'REJECTED';
  reason: string;
  createdAt: string;
};

export type RouteResult = {
  accepted: boolean;
  reason: string;
  pack?: KnowledgeRoutePack;
  link?: AuthorizedRouteLink;
  at: string;
};

type Store = {
  links: AuthorizedRouteLink[];
  packs: KnowledgeRoutePack[];
};

function storePath(root: string) {
  return xivLocalPath(root, 'universe-knowledge-routing-grid.json');
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

export function signKnowledgeRoutePayload(payload: string, keyMaterial: string): string {
  return createHash('sha256').update(`${keyMaterial}::${payload}`).digest('hex');
}

export function universeKnowledgeRoutingHonesty() {
  return {
    banner: HONESTY_BANNER,
    silentSealedOrRawPrivate: CY_LOCKS.SILENT_SEALED_OR_RAW_PRIVATE_UNIVERSE_ROUTE,
    unsignedAccepted: CY_LOCKS.UNSIGNED_ROUTE_PACK_ACCEPTED,
    unauthorizedRoute: CY_LOCKS.UNAUTHORIZED_UNIVERSE_ROUTE,
  };
}

export async function authorizeUniverseKnowledgeRoute(input: {
  sourceUniverseId: string;
  targetUniverseId: string;
  root: string;
  actor: CyActor;
}): Promise<RouteResult> {
  void input.actor;
  const store = await load(input.root);
  const now = new Date().toISOString();
  const link: AuthorizedRouteLink = {
    id: id('ukrg'),
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
    reason: 'UNIVERSE_KNOWLEDGE_ROUTE_AUTHORIZED',
    link,
    at: now,
  };
}

export async function submitUniverseKnowledgeRoutePack(input: {
  sourceUniverseId: string;
  targetUniverseId: string;
  assetClass: KnowledgeAssetClass;
  payload: string;
  signature?: string | null;
  signingKey?: string | null;
  silent?: boolean;
  root: string;
  actor: CyActor;
}): Promise<RouteResult> {
  void input.actor;
  const store = await load(input.root);
  const now = new Date().toISOString();
  if (store.packs.length >= MAX_ROUTE_PACKS) {
    return {
      accepted: false,
      reason: 'MAX_ROUTE_PACKS_BOUNDED',
      at: now,
    };
  }

  const digest = createHash('sha256').update(input.payload).digest('hex');
  const silent = input.silent === true;
  const sealedOrPrivate =
    input.assetClass === 'sealed' || input.assetClass === 'raw_private';

  if (silent && sealedOrPrivate) {
    const pack: KnowledgeRoutePack = {
      id: id('route'),
      sourceUniverseId: input.sourceUniverseId,
      targetUniverseId: input.targetUniverseId,
      assetClass: input.assetClass,
      payloadDigest: digest,
      signature: input.signature ?? null,
      signed: Boolean(input.signature),
      silent: true,
      status: 'DENIED',
      reason: SEALED_OR_RAW_PRIVATE_ROUTE_DENIED,
      createdAt: now,
    };
    store.packs.push(pack);
    await save(input.root, store);
    return { accepted: false, reason: pack.reason, pack, at: now };
  }

  if (!input.signature?.trim()) {
    const pack: KnowledgeRoutePack = {
      id: id('route'),
      sourceUniverseId: input.sourceUniverseId,
      targetUniverseId: input.targetUniverseId,
      assetClass: input.assetClass,
      payloadDigest: digest,
      signature: null,
      signed: false,
      silent,
      status: 'REJECTED',
      reason: UNSIGNED_ROUTE_PACK_REJECTED,
      createdAt: now,
    };
    store.packs.push(pack);
    await save(input.root, store);
    return { accepted: false, reason: pack.reason, pack, at: now };
  }

  if (input.signingKey) {
    const expected = signKnowledgeRoutePayload(input.payload, input.signingKey);
    if (expected !== input.signature) {
      const pack: KnowledgeRoutePack = {
        id: id('route'),
        sourceUniverseId: input.sourceUniverseId,
        targetUniverseId: input.targetUniverseId,
        assetClass: input.assetClass,
        payloadDigest: digest,
        signature: input.signature,
        signed: false,
        silent,
        status: 'REJECTED',
        reason: UNSIGNED_ROUTE_PACK_REJECTED,
        createdAt: now,
      };
      store.packs.push(pack);
      await save(input.root, store);
      return { accepted: false, reason: pack.reason, pack, at: now };
    }
  }

  const link = store.links.find(
    (l) =>
      l.sourceUniverseId === input.sourceUniverseId &&
      l.targetUniverseId === input.targetUniverseId &&
      l.authorized &&
      !l.revoked,
  );
  if (!link) {
    const pack: KnowledgeRoutePack = {
      id: id('route'),
      sourceUniverseId: input.sourceUniverseId,
      targetUniverseId: input.targetUniverseId,
      assetClass: input.assetClass,
      payloadDigest: digest,
      signature: input.signature,
      signed: true,
      silent,
      status: 'DENIED',
      reason: UNAUTHORIZED_UNIVERSE_ROUTE_DENIED,
      createdAt: now,
    };
    store.packs.push(pack);
    await save(input.root, store);
    return { accepted: false, reason: pack.reason, pack, at: now };
  }

  if (input.assetClass === 'unapproved' || sealedOrPrivate) {
    const pack: KnowledgeRoutePack = {
      id: id('route'),
      sourceUniverseId: input.sourceUniverseId,
      targetUniverseId: input.targetUniverseId,
      assetClass: input.assetClass,
      payloadDigest: digest,
      signature: input.signature,
      signed: true,
      silent,
      status: 'DENIED',
      reason: sealedOrPrivate
        ? SEALED_OR_RAW_PRIVATE_ROUTE_DENIED
        : UNAUTHORIZED_UNIVERSE_ROUTE_DENIED,
      createdAt: now,
    };
    store.packs.push(pack);
    await save(input.root, store);
    return { accepted: false, reason: pack.reason, pack, at: now };
  }

  const pack: KnowledgeRoutePack = {
    id: id('route'),
    sourceUniverseId: input.sourceUniverseId,
    targetUniverseId: input.targetUniverseId,
    assetClass: input.assetClass,
    payloadDigest: digest,
    signature: input.signature,
    signed: true,
    silent: false,
    status: 'ACCEPTED',
    reason: 'SIGNED_AUTHORIZED_UNIVERSE_KNOWLEDGE_ROUTE_ACCEPTED',
    createdAt: now,
  };
  store.packs.push(pack);
  await save(input.root, store);
  return { accepted: true, reason: pack.reason, pack, link, at: now };
}
