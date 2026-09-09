/**
 * 62L-EK Module G — Live Avatar Identity Layer + automation disclosure.
 * Narrow offline delegation allowed but must visibly disclose automation.
 * Must not impersonate the human as live without disclosure.
 * Digital Twin / avatar ≠ founder; label ≠ access.
 */

import { readJsonFile, writeJsonFileAtomic, xivLocalPath } from './durable-json';
import {
  AVATAR_DISCLOSURE_REQUIRED,
  AVATAR_NEQ_FOUNDER,
  AVATAR_PRESENCE_STATES,
  MAX_AVATAR_EVENTS,
  type AvatarPresenceState,
  type EkActor,
  type EkEvidenceState,
} from './windows-amd-local-cognitive-os-types';

export type AvatarPresence = {
  id: string;
  avatarId: string;
  universeId: string;
  presence: AvatarPresenceState;
  automationActive: boolean;
  automationDisclosed: boolean;
  status: 'ok' | 'denied';
  state: EkEvidenceState;
  reason: string;
  founderAuthority: false;
  at: string;
};

export type AvatarDelegation = {
  id: string;
  avatarId: string;
  scope: 'basic_faq' | 'general';
  automationDisclosed: boolean;
  claimLiveHuman: boolean;
  status: 'ok' | 'denied';
  state: EkEvidenceState;
  reason: string;
  at: string;
};

type Store = {
  presence: AvatarPresence[];
  delegations: AvatarDelegation[];
};

function storePath(root: string) {
  return xivLocalPath(root, 'live-avatar-identity-layer.json');
}

async function load(root: string): Promise<Store> {
  return readJsonFile<Store>(storePath(root), {
    presence: [],
    delegations: [],
  });
}

async function save(root: string, store: Store) {
  await writeJsonFileAtomic(storePath(root), store);
}

function id(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function liveAvatarIdentityLayerHonesty() {
  return {
    presenceStates: AVATAR_PRESENCE_STATES,
    automationDisclosureRequired: true,
    narrowOfflineDelegationAllowedWithDisclosure: true,
    mustNotImpersonateLiveHumanWithoutDisclosure: true,
    avatarNeqFounder: true,
    digitalTwinNeqFounder: true,
    labelNeqAccess: true,
    productionBeyondContracts: false,
    l4AutonomyEnabled: false,
  };
}

export async function registerAvatarPresence(input: {
  avatarId: string;
  universeId: string;
  presence: AvatarPresenceState;
  automationActive: boolean;
  automationDisclosed: boolean;
  root: string;
  actor: EkActor;
}): Promise<AvatarPresence> {
  void input.actor;
  const store = await load(input.root);
  if (store.presence.length >= MAX_AVATAR_EVENTS) throw new Error('MAX_AVATAR_EVENTS');

  if (input.automationActive && !input.automationDisclosed) {
    const denied: AvatarPresence = {
      id: id('ekav'),
      avatarId: input.avatarId.trim(),
      universeId: input.universeId.trim(),
      presence: input.presence,
      automationActive: true,
      automationDisclosed: false,
      status: 'denied',
      state: 'DENIED',
      reason: AVATAR_DISCLOSURE_REQUIRED,
      founderAuthority: false,
      at: new Date().toISOString(),
    };
    store.presence.push(denied);
    await save(input.root, store);
    return denied;
  }

  if (
    input.presence === 'LIVE_VERIFIED' &&
    input.automationActive &&
    !input.automationDisclosed
  ) {
    const denied: AvatarPresence = {
      id: id('ekav'),
      avatarId: input.avatarId.trim(),
      universeId: input.universeId.trim(),
      presence: input.presence,
      automationActive: true,
      automationDisclosed: false,
      status: 'denied',
      state: 'DENIED',
      reason: AVATAR_DISCLOSURE_REQUIRED,
      founderAuthority: false,
      at: new Date().toISOString(),
    };
    store.presence.push(denied);
    await save(input.root, store);
    return denied;
  }

  const rec: AvatarPresence = {
    id: id('ekav'),
    avatarId: input.avatarId.trim(),
    universeId: input.universeId.trim(),
    presence: input.presence,
    automationActive: input.automationActive,
    automationDisclosed: input.automationDisclosed,
    status: 'ok',
    state: input.automationDisclosed ? 'AUTOMATION_DISCLOSED' : 'REGISTERED',
    reason: 'AVATAR_PRESENCE_REGISTERED',
    founderAuthority: false,
    at: new Date().toISOString(),
  };
  store.presence.push(rec);
  await save(input.root, store);
  return rec;
}

export async function delegateAvatarOfflineFaq(input: {
  avatarId: string;
  automationDisclosed: boolean;
  claimLiveHuman: boolean;
  root: string;
  actor: EkActor;
}): Promise<AvatarDelegation> {
  void input.actor;
  const store = await load(input.root);

  if (input.claimLiveHuman && !input.automationDisclosed) {
    const denied: AvatarDelegation = {
      id: id('ekavd'),
      avatarId: input.avatarId.trim(),
      scope: 'basic_faq',
      automationDisclosed: false,
      claimLiveHuman: true,
      status: 'denied',
      state: 'DENIED',
      reason: AVATAR_DISCLOSURE_REQUIRED,
      at: new Date().toISOString(),
    };
    store.delegations.push(denied);
    await save(input.root, store);
    return denied;
  }

  if (!input.automationDisclosed) {
    const denied: AvatarDelegation = {
      id: id('ekavd'),
      avatarId: input.avatarId.trim(),
      scope: 'basic_faq',
      automationDisclosed: false,
      claimLiveHuman: input.claimLiveHuman,
      status: 'denied',
      state: 'DENIED',
      reason: AVATAR_DISCLOSURE_REQUIRED,
      at: new Date().toISOString(),
    };
    store.delegations.push(denied);
    await save(input.root, store);
    return denied;
  }

  const ok: AvatarDelegation = {
    id: id('ekavd'),
    avatarId: input.avatarId.trim(),
    scope: 'basic_faq',
    automationDisclosed: true,
    claimLiveHuman: false,
    status: 'ok',
    state: 'AUTOMATION_DISCLOSED',
    reason: 'OFFLINE_FAQ_DELEGATION_WITH_DISCLOSURE',
    at: new Date().toISOString(),
  };
  store.delegations.push(ok);
  await save(input.root, store);
  return ok;
}

export async function probeAvatarFounderAuthority(input: {
  actor: EkActor;
  claimFounderAuthority: boolean;
  root: string;
}): Promise<{
  id: string;
  status: 'denied';
  state: EkEvidenceState;
  reason: string;
  founderAuthority: false;
  at: string;
}> {
  void input.root;
  return {
    id: id('ekavf'),
    status: 'denied',
    state: 'DENIED',
    reason: AVATAR_NEQ_FOUNDER,
    founderAuthority: false,
    at: new Date().toISOString(),
  };
}
