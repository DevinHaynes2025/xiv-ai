/**
 * 62L-DL Business Media Social Graph —
 * Opt-in Business Media rooms/social graph; adult 18+ where applicable.
 */

import { readJsonFile, writeJsonFileAtomic, xivLocalPath } from './durable-json';
import {
  ADULT_MIN_AGE_YEARS,
  BUSINESS_MEDIA_OPT_IN_DENIED,
  DL_LOCKS,
  HONESTY_BANNER,
  MAX_SOCIAL_GRAPH_EDGES,
  type DlActor,
} from './neural-transportation-os-types';

export type BusinessMediaSocialGraph = {
  id: string;
  orgId: string;
  tenantId: string;
  universeId: string;
  optInRequired: true;
  adult18PlusRequired: true;
  createdAt: string;
};

export type BusinessMediaRoom = {
  id: string;
  graphId: string;
  name: string;
  createdAt: string;
};

export type SocialGraphShare = {
  id: string;
  graphId: string;
  roomId: string | null;
  contentRef: string;
  fromActorId: string;
  toActorId: string;
  optIn: boolean;
  declaredAgeYears: number | null;
  status: 'SHARED' | 'DENIED';
  reason: string;
  createdAt: string;
};

type Store = {
  graphs: BusinessMediaSocialGraph[];
  rooms: BusinessMediaRoom[];
  shares: SocialGraphShare[];
};

function storePath(root: string) {
  return xivLocalPath(root, 'business-media-social-graph.json');
}

async function load(root: string): Promise<Store> {
  return readJsonFile<Store>(storePath(root), { graphs: [], rooms: [], shares: [] });
}

async function save(root: string, store: Store) {
  await writeJsonFileAtomic(storePath(root), store);
}

function id(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function businessMediaSocialGraphHonesty() {
  return {
    banner: HONESTY_BANNER,
    businessMediaShareWithoutOptIn: DL_LOCKS.BUSINESS_MEDIA_SHARE_WITHOUT_OPT_IN,
    businessMediaOptInRequired: DL_LOCKS.BUSINESS_MEDIA_OPT_IN_REQUIRED,
    adult18PlusRequired: DL_LOCKS.ADULT_18_PLUS_REQUIRED,
  };
}

export async function bootstrapBusinessMediaSocialGraph(input: {
  orgId: string;
  tenantId: string;
  universeId: string;
  root: string;
  actor: DlActor;
}): Promise<BusinessMediaSocialGraph> {
  void input.actor;
  const store = await load(input.root);
  const existing = store.graphs.find(
    (g) =>
      g.orgId === input.orgId &&
      g.tenantId === input.tenantId &&
      g.universeId === input.universeId,
  );
  if (existing) return existing;
  const graph: BusinessMediaSocialGraph = {
    id: id('dlgraph'),
    orgId: input.orgId,
    tenantId: input.tenantId,
    universeId: input.universeId,
    optInRequired: true,
    adult18PlusRequired: true,
    createdAt: new Date().toISOString(),
  };
  store.graphs.push(graph);
  await save(input.root, store);
  return graph;
}

export async function openBusinessMediaRoom(input: {
  graphId: string;
  name: string;
  root: string;
  actor: DlActor;
}): Promise<{ accepted: boolean; reason: string; room?: BusinessMediaRoom; at: string }> {
  void input.actor;
  const store = await load(input.root);
  const now = new Date().toISOString();
  const graph = store.graphs.find((g) => g.id === input.graphId);
  if (!graph) return { accepted: false, reason: 'GRAPH_NOT_FOUND', at: now };
  const room: BusinessMediaRoom = {
    id: id('dlroom'),
    graphId: input.graphId,
    name: input.name.trim() || 'room',
    createdAt: now,
  };
  store.rooms.push(room);
  await save(input.root, store);
  return { accepted: true, reason: 'BUSINESS_MEDIA_ROOM_OPENED', room, at: now };
}

export async function shareOnBusinessMediaSocialGraph(input: {
  graphId: string;
  roomId?: string;
  contentRef: string;
  toActorId: string;
  optIn: boolean;
  declaredAgeYears?: number;
  root: string;
  actor: DlActor;
}): Promise<{ accepted: boolean; reason: string; share?: SocialGraphShare; at: string }> {
  const store = await load(input.root);
  const now = new Date().toISOString();
  const graph = store.graphs.find((g) => g.id === input.graphId);
  if (!graph) return { accepted: false, reason: 'GRAPH_NOT_FOUND', at: now };

  if (store.shares.length >= MAX_SOCIAL_GRAPH_EDGES) {
    return { accepted: false, reason: 'MAX_SOCIAL_GRAPH_EDGES_REACHED', at: now };
  }

  const age = input.declaredAgeYears ?? input.actor.declaredAgeYears ?? null;
  if (input.optIn !== true || age === null || age < ADULT_MIN_AGE_YEARS) {
    const share: SocialGraphShare = {
      id: id('dlshare'),
      graphId: input.graphId,
      roomId: input.roomId ?? null,
      contentRef: input.contentRef,
      fromActorId: input.actor.id,
      toActorId: input.toActorId,
      optIn: input.optIn === true,
      declaredAgeYears: age,
      status: 'DENIED',
      reason: BUSINESS_MEDIA_OPT_IN_DENIED,
      createdAt: now,
    };
    store.shares.push(share);
    await save(input.root, store);
    return { accepted: false, reason: BUSINESS_MEDIA_OPT_IN_DENIED, share, at: now };
  }

  const share: SocialGraphShare = {
    id: id('dlshare'),
    graphId: input.graphId,
    roomId: input.roomId ?? null,
    contentRef: input.contentRef,
    fromActorId: input.actor.id,
    toActorId: input.toActorId,
    optIn: true,
    declaredAgeYears: age,
    status: 'SHARED',
    reason: 'BUSINESS_MEDIA_SOCIAL_GRAPH_SHARE_ACCEPTED_OPT_IN_ADULT',
    createdAt: now,
  };
  store.shares.push(share);
  await save(input.root, store);
  return { accepted: true, reason: share.reason, share, at: now };
}
