/**
 * 62L-DU Module E — Adult Community Universes.
 * Lawful 18+ clothing-optional/naturist communities only.
 * Strict consent, privacy, age controls, moderation, anti-harassment.
 * No minors. No non-consensual imagery.
 */

import { readJsonFile, writeJsonFileAtomic, xivLocalPath } from './durable-json';
import {
  ADULT_AGE_GATE_REQUIRED,
  MAX_ADULT_UNIVERSE_EVENTS,
  MINOR_ACCESS_DENIED,
  NON_CONSENSUAL_DENIED,
  type DuActor,
} from './universal-industry-intelligence-os-types';

export type AdultUniverseEvent = {
  id: string;
  universeId: string;
  kind: 'access' | 'imagery' | 'age_gate';
  status: 'allowed' | 'denied';
  reason: string;
  at: string;
};

type Store = {
  events: AdultUniverseEvent[];
};

function storePath(root: string) {
  return xivLocalPath(root, 'adult-community-universes.json');
}

async function load(root: string): Promise<Store> {
  return readJsonFile<Store>(storePath(root), { events: [] });
}

async function save(root: string, store: Store) {
  await writeJsonFileAtomic(storePath(root), store);
}

function id(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function adultCommunityUniversesHonesty() {
  return {
    minorsAllowed: false,
    nonConsensualImageryAllowed: false,
    ageGateRequired: true,
    consentRequired: true,
    privacyControls: true,
    moderationRequired: true,
    antiHarassment: true,
    lawful18PlusOnly: true,
  };
}

export async function accessAdultUniverse(input: {
  universeId: string;
  claimedAge: number;
  ageVerified: boolean;
  isMinor?: boolean;
  root: string;
  actor: DuActor;
}): Promise<AdultUniverseEvent> {
  const store = await load(input.root);
  void input.actor;
  if (store.events.length >= MAX_ADULT_UNIVERSE_EVENTS) {
    throw new Error('MAX_ADULT_UNIVERSE_EVENTS_REACHED');
  }
  const isMinor = input.isMinor === true || input.claimedAge < 18;
  let status: 'allowed' | 'denied';
  let reason: string;
  if (isMinor) {
    status = 'denied';
    reason = MINOR_ACCESS_DENIED;
  } else if (!input.ageVerified || input.claimedAge < 18) {
    status = 'denied';
    reason = ADULT_AGE_GATE_REQUIRED;
  } else {
    status = 'allowed';
    reason = 'ADULT_UNIVERSE_AGE_VERIFIED_18_PLUS';
  }
  const event: AdultUniverseEvent = {
    id: id('duadult'),
    universeId: input.universeId,
    kind: isMinor ? 'access' : 'age_gate',
    status,
    reason,
    at: new Date().toISOString(),
  };
  store.events.push(event);
  await save(input.root, store);
  return event;
}

export async function moderateImagery(input: {
  universeId: string;
  consensual: boolean;
  subjectsAgeVerifiedAdult: boolean;
  root: string;
  actor: DuActor;
}): Promise<AdultUniverseEvent> {
  const store = await load(input.root);
  void input.actor;
  const denied =
    !input.consensual || !input.subjectsAgeVerifiedAdult;
  const event: AdultUniverseEvent = {
    id: id('duimg'),
    universeId: input.universeId,
    kind: 'imagery',
    status: denied ? 'denied' : 'allowed',
    reason: !input.subjectsAgeVerifiedAdult
      ? MINOR_ACCESS_DENIED
      : !input.consensual
        ? NON_CONSENSUAL_DENIED
        : 'CONSENSUAL_ADULT_IMAGERY_ALLOWED_BOUNDED',
    at: new Date().toISOString(),
  };
  store.events.push(event);
  await save(input.root, store);
  return event;
}

export async function requireAdultAgeGate(input: {
  universeId: string;
  ageGatePresent: boolean;
  root: string;
  actor: DuActor;
}): Promise<AdultUniverseEvent> {
  const store = await load(input.root);
  void input.actor;
  const event: AdultUniverseEvent = {
    id: id('duage'),
    universeId: input.universeId,
    kind: 'age_gate',
    status: input.ageGatePresent ? 'allowed' : 'denied',
    reason: input.ageGatePresent
      ? 'ADULT_AGE_GATE_PRESENT'
      : ADULT_AGE_GATE_REQUIRED,
    at: new Date().toISOString(),
  };
  store.events.push(event);
  await save(input.root, store);
  return event;
}
