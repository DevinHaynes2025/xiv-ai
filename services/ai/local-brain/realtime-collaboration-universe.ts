/**
 * 62L-DI Real-Time Collaboration Universe — multilingual rooms; opt-in sharing; 18+.
 */
import { readJsonFile, writeJsonFileAtomic, xivLocalPath } from './durable-json';
import {
  ADULT_MIN_AGE_YEARS, COLLABORATION_OPT_IN_REQUIRED_DENIED, DI_LOCKS, HONESTY_BANNER,
  MAX_COLLAB_ROOMS, UNDER_18_DENIED, type DiActor,
} from './personalized-intelligence-companion-os-types';

export type CollaborationRoom = {
  id: string; universeId: string; orgId: string; tenantId: string; locale: string; title: string;
  status: 'OPEN' | 'DENIED'; reason: string; createdAt: string;
};
export type CollaborationShareAttempt = {
  id: string; roomId: string; explicitOptIn: boolean; status: 'ALLOWED' | 'DENIED'; reason: string; at: string;
};
export type CollaborationOnboardingAttempt = {
  id: string; universeRecordId: string; declaredAgeYears: number | null;
  status: 'admitted' | 'denied'; reason: string; adultConfirmed: boolean; at: string;
};
export type RealtimeCollaborationUniverse = { id: string; orgId: string; tenantId: string; universeId: string; createdAt: string };
type Store = { universes: RealtimeCollaborationUniverse[]; rooms: CollaborationRoom[]; shares: CollaborationShareAttempt[]; onboardings: CollaborationOnboardingAttempt[] };

function storePath(root: string) { return xivLocalPath(root, 'realtime-collaboration-universe.json'); }
async function load(root: string): Promise<Store> {
  return readJsonFile<Store>(storePath(root), { universes: [], rooms: [], shares: [], onboardings: [] });
}
async function save(root: string, store: Store) { await writeJsonFileAtomic(storePath(root), store); }
function id(prefix: string) { return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`; }

export function realtimeCollaborationUniverseHonesty() {
  return {
    banner: HONESTY_BANNER,
    collaborationShareWithoutOptIn: DI_LOCKS.COLLABORATION_SHARE_WITHOUT_OPT_IN,
    communityOptInRequired: DI_LOCKS.COMMUNITY_OPT_IN_REQUIRED,
    adult18PlusRequired: DI_LOCKS.ADULT_18_PLUS_REQUIRED,
  };
}

export async function bootstrapRealtimeCollaborationUniverse(input: {
  orgId: string; tenantId: string; universeId: string; root: string; actor: DiActor;
}): Promise<RealtimeCollaborationUniverse> {
  void input.actor;
  const store = await load(input.root);
  const existing = store.universes.find((u) => u.orgId === input.orgId && u.tenantId === input.tenantId && u.universeId === input.universeId);
  if (existing) return existing;
  const universe: RealtimeCollaborationUniverse = { id: id('dicu'), orgId: input.orgId, tenantId: input.tenantId, universeId: input.universeId, createdAt: new Date().toISOString() };
  store.universes.push(universe); await save(input.root, store); return universe;
}

export async function openCollaborationRoom(input: {
  universeRecordId: string; title: string; locale?: string; root: string; actor: DiActor;
}): Promise<{ accepted: boolean; reason: string; room?: CollaborationRoom }> {
  void input.actor;
  const store = await load(input.root);
  const now = new Date().toISOString();
  const universe = store.universes.find((u) => u.id === input.universeRecordId);
  if (!universe) return { accepted: false, reason: 'COLLABORATION_UNIVERSE_NOT_FOUND' };
  if (store.rooms.length >= MAX_COLLAB_ROOMS) return { accepted: false, reason: 'MAX_COLLAB_ROOMS_BOUNDED' };
  const room: CollaborationRoom = {
    id: id('diroom'), universeId: universe.universeId, orgId: universe.orgId, tenantId: universe.tenantId,
    locale: input.locale ?? 'en', title: input.title.trim() || 'untitled-room', status: 'OPEN',
    reason: 'MULTILINGUAL_COLLABORATION_ROOM_OPEN', createdAt: now,
  };
  store.rooms.push(room); await save(input.root, store);
  return { accepted: true, reason: 'COLLABORATION_ROOM_OPENED', room };
}

export async function attemptCollaborationShare(input: {
  roomId: string; explicitOptIn?: boolean; root: string; actor: DiActor;
}): Promise<{ accepted: boolean; reason: string; attempt?: CollaborationShareAttempt }> {
  void input.actor;
  const store = await load(input.root);
  const now = new Date().toISOString();
  const room = store.rooms.find((r) => r.id === input.roomId);
  if (!room) return { accepted: false, reason: 'COLLABORATION_ROOM_NOT_FOUND' };
  if (input.explicitOptIn !== true) {
    const attempt: CollaborationShareAttempt = { id: id('dicsh'), roomId: room.id, explicitOptIn: false, status: 'DENIED', reason: COLLABORATION_OPT_IN_REQUIRED_DENIED, at: now };
    store.shares.push(attempt); await save(input.root, store);
    return { accepted: false, reason: COLLABORATION_OPT_IN_REQUIRED_DENIED, attempt };
  }
  const attempt: CollaborationShareAttempt = { id: id('dicsh'), roomId: room.id, explicitOptIn: true, status: 'ALLOWED', reason: 'COLLABORATION_SHARE_OPT_IN_RECORDED', at: now };
  store.shares.push(attempt); await save(input.root, store);
  return { accepted: true, reason: 'COLLABORATION_SHARE_OPT_IN_RECORDED', attempt };
}

export async function attemptCollaborationOnboarding(input: {
  universeRecordId: string; declaredAgeYears: number | null; root: string; actor: DiActor;
}): Promise<{ accepted: boolean; reason: string; attempt?: CollaborationOnboardingAttempt }> {
  void input.actor;
  const store = await load(input.root);
  const now = new Date().toISOString();
  const universe = store.universes.find((u) => u.id === input.universeRecordId);
  if (!universe) return { accepted: false, reason: 'COLLABORATION_UNIVERSE_NOT_FOUND' };
  const age = input.declaredAgeYears;
  const adult = typeof age === 'number' && Number.isFinite(age) && age >= ADULT_MIN_AGE_YEARS;
  if (!adult) {
    const attempt: CollaborationOnboardingAttempt = { id: id('diconb'), universeRecordId: universe.id, declaredAgeYears: age, status: 'denied', reason: UNDER_18_DENIED, adultConfirmed: false, at: now };
    store.onboardings.push(attempt); await save(input.root, store);
    return { accepted: false, reason: UNDER_18_DENIED, attempt };
  }
  const attempt: CollaborationOnboardingAttempt = { id: id('diconb'), universeRecordId: universe.id, declaredAgeYears: age, status: 'admitted', reason: 'ADULT_18_PLUS_CONFIRMED', adultConfirmed: true, at: now };
  store.onboardings.push(attempt); await save(input.root, store);
  return { accepted: true, reason: 'COLLABORATION_ONBOARDING_ADMITTED', attempt };
}
