/**
 * 62L-DJ Global Collaboration & Knowledge Rooms —
 * Live collaboration rooms; opt-in; no silent private share;
 * no raw private cross-tenant sharing.
 */

import { readJsonFile, writeJsonFileAtomic, xivLocalPath } from './durable-json';
import {
  COLLABORATION_OPT_IN_DENIED,
  DJ_LOCKS,
  FORBIDDEN_PRIVATE_FIELDS,
  HONESTY_BANNER,
  MAX_COLLAB_ROOMS,
  RAW_PRIVATE_CROSS_TENANT_DENIED,
  type DjActor,
} from './personal-intelligence-command-os-types';

export type CollaborationKnowledgeRooms = {
  id: string;
  orgId: string;
  tenantId: string;
  universeId: string;
  createdAt: string;
};

export type CollaborationRoom = {
  id: string;
  fabricId: string;
  name: string;
  optInRequired: true;
  participantsOptedIn: string[];
  status: 'OPEN' | 'DENIED';
  reason: string;
  createdAt: string;
};

export type CollaborationShareAttempt = {
  id: string;
  roomId: string;
  fromTenantId: string;
  toTenantId: string;
  rawPrivatePayload: boolean;
  optInConfirmed: boolean;
  status: 'SHARED' | 'DENIED';
  reason: string;
  at: string;
};

type Store = {
  fabrics: CollaborationKnowledgeRooms[];
  rooms: CollaborationRoom[];
  shares: CollaborationShareAttempt[];
};

function storePath(root: string) {
  return xivLocalPath(root, 'global-collaboration-knowledge-rooms.json');
}

async function load(root: string): Promise<Store> {
  return readJsonFile<Store>(storePath(root), { fabrics: [], rooms: [], shares: [] });
}

async function save(root: string, store: Store) {
  await writeJsonFileAtomic(storePath(root), store);
}

function id(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function globalCollaborationKnowledgeRoomsHonesty() {
  return {
    banner: HONESTY_BANNER,
    collaborationWithoutOptIn: DJ_LOCKS.COLLABORATION_WITHOUT_OPT_IN,
    collaborationOptInRequired: DJ_LOCKS.COLLABORATION_OPT_IN_REQUIRED,
    rawPrivateCrossTenantShare: DJ_LOCKS.RAW_PRIVATE_CROSS_TENANT_SHARE,
    forbiddenPrivateFields: [...FORBIDDEN_PRIVATE_FIELDS],
    productionAuthorization: DJ_LOCKS.PRODUCTION_AUTHORIZATION,
  };
}

export async function bootstrapGlobalCollaborationKnowledgeRooms(input: {
  orgId: string;
  tenantId: string;
  universeId: string;
  root: string;
  actor: DjActor;
}): Promise<CollaborationKnowledgeRooms> {
  void input.actor;
  const store = await load(input.root);
  const existing = store.fabrics.find(
    (f) =>
      f.orgId === input.orgId &&
      f.tenantId === input.tenantId &&
      f.universeId === input.universeId,
  );
  if (existing) return existing;
  const fabric: CollaborationKnowledgeRooms = {
    id: id('djcollab'),
    orgId: input.orgId,
    tenantId: input.tenantId,
    universeId: input.universeId,
    createdAt: new Date().toISOString(),
  };
  store.fabrics.push(fabric);
  await save(input.root, store);
  return fabric;
}

export async function openCollaborationRoom(input: {
  fabricId: string;
  name: string;
  participantIds: string[];
  participantsOptedIn?: string[];
  skipOptIn?: boolean;
  root: string;
  actor: DjActor;
}): Promise<{ accepted: boolean; reason: string; room?: CollaborationRoom; at: string }> {
  void input.actor;
  const store = await load(input.root);
  const now = new Date().toISOString();
  const fabric = store.fabrics.find((f) => f.id === input.fabricId);
  if (!fabric) return { accepted: false, reason: 'COLLAB_FABRIC_NOT_FOUND', at: now };
  if (store.rooms.length >= MAX_COLLAB_ROOMS) {
    return { accepted: false, reason: 'MAX_COLLAB_ROOMS_BOUNDED', at: now };
  }

  const optedIn = new Set(input.participantsOptedIn ?? []);
  const allOptedIn =
    input.skipOptIn !== true &&
    input.participantIds.length > 0 &&
    input.participantIds.every((p) => optedIn.has(p));

  if (input.skipOptIn === true || !allOptedIn) {
    const room: CollaborationRoom = {
      id: id('djroom'),
      fabricId: fabric.id,
      name: input.name.trim() || 'unnamed-room',
      optInRequired: true,
      participantsOptedIn: [],
      status: 'DENIED',
      reason: COLLABORATION_OPT_IN_DENIED,
      createdAt: now,
    };
    store.rooms.push(room);
    await save(input.root, store);
    return { accepted: false, reason: COLLABORATION_OPT_IN_DENIED, room, at: now };
  }

  const room: CollaborationRoom = {
    id: id('djroom'),
    fabricId: fabric.id,
    name: input.name.trim() || 'unnamed-room',
    optInRequired: true,
    participantsOptedIn: [...input.participantIds],
    status: 'OPEN',
    reason: 'COLLABORATION_ROOM_OPENED_WITH_OPT_IN',
    createdAt: now,
  };
  store.rooms.push(room);
  await save(input.root, store);
  return { accepted: true, reason: room.reason, room, at: now };
}

export async function attemptCrossTenantShare(input: {
  roomId: string;
  fromTenantId: string;
  toTenantId: string;
  rawPrivatePayload?: boolean;
  payloadFields?: string[];
  optInConfirmed?: boolean;
  root: string;
  actor: DjActor;
}): Promise<{
  accepted: boolean;
  reason: string;
  share?: CollaborationShareAttempt;
  at: string;
}> {
  void input.actor;
  const store = await load(input.root);
  const now = new Date().toISOString();
  const room = store.rooms.find((r) => r.id === input.roomId);
  if (!room) return { accepted: false, reason: 'COLLAB_ROOM_NOT_FOUND', at: now };

  const hasForbidden = (input.payloadFields ?? []).some((f) =>
    (FORBIDDEN_PRIVATE_FIELDS as readonly string[]).includes(f),
  );
  const crossTenant = input.fromTenantId !== input.toTenantId;
  const rawPrivate = input.rawPrivatePayload === true || hasForbidden;

  if (crossTenant && rawPrivate) {
    const share: CollaborationShareAttempt = {
      id: id('djshare'),
      roomId: room.id,
      fromTenantId: input.fromTenantId,
      toTenantId: input.toTenantId,
      rawPrivatePayload: true,
      optInConfirmed: input.optInConfirmed === true,
      status: 'DENIED',
      reason: RAW_PRIVATE_CROSS_TENANT_DENIED,
      at: now,
    };
    store.shares.push(share);
    await save(input.root, store);
    return { accepted: false, reason: RAW_PRIVATE_CROSS_TENANT_DENIED, share, at: now };
  }

  if (input.optInConfirmed !== true) {
    const share: CollaborationShareAttempt = {
      id: id('djshare'),
      roomId: room.id,
      fromTenantId: input.fromTenantId,
      toTenantId: input.toTenantId,
      rawPrivatePayload: false,
      optInConfirmed: false,
      status: 'DENIED',
      reason: COLLABORATION_OPT_IN_DENIED,
      at: now,
    };
    store.shares.push(share);
    await save(input.root, store);
    return { accepted: false, reason: COLLABORATION_OPT_IN_DENIED, share, at: now };
  }

  const share: CollaborationShareAttempt = {
    id: id('djshare'),
    roomId: room.id,
    fromTenantId: input.fromTenantId,
    toTenantId: input.toTenantId,
    rawPrivatePayload: false,
    optInConfirmed: true,
    status: 'SHARED',
    reason: 'OPT_IN_SANITIZED_SHARE_RECORDED',
    at: now,
  };
  store.shares.push(share);
  await save(input.root, store);
  return { accepted: true, reason: share.reason, share, at: now };
}
