/**
 * 62L-DG Continuous Agent Learning & Debrief System —
 * Visible agent learning/debrief rooms; learning ≠ permission;
 * cannot self-grant authority.
 */

import { readJsonFile, writeJsonFileAtomic, xivLocalPath } from './durable-json';
import {
  DG_LOCKS,
  HONESTY_BANNER,
  LEARNING_AUTHORITY_SELF_GRANT_DENIED,
  MAX_DEBRIEF_ENTRIES,
  type DgActor,
} from './universal-personal-business-ai-os-types';

export type ContinuousLearningDebriefSystem = {
  id: string;
  orgId: string;
  tenantId: string;
  universeId: string;
  createdAt: string;
};

export type DebriefRoom = {
  id: string;
  systemId: string;
  roomId: string;
  visible: true;
  status: 'OPEN' | 'DENIED';
  reason: string;
  createdAt: string;
};

export type LearningDebriefEntry = {
  id: string;
  systemId: string;
  roomId: string;
  agentId: string;
  summary: string;
  authoritySelfGrantRequested: boolean;
  status: 'RECORDED' | 'DENIED';
  reason: string;
  learningGrantsPermission: false;
  at: string;
};

type Store = {
  systems: ContinuousLearningDebriefSystem[];
  rooms: DebriefRoom[];
  entries: LearningDebriefEntry[];
};

function storePath(root: string) {
  return xivLocalPath(root, 'continuous-agent-learning-debrief-system.json');
}

async function load(root: string): Promise<Store> {
  return readJsonFile<Store>(storePath(root), {
    systems: [],
    rooms: [],
    entries: [],
  });
}

async function save(root: string, store: Store) {
  await writeJsonFileAtomic(storePath(root), store);
}

function id(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function continuousAgentLearningDebriefHonesty() {
  return {
    banner: HONESTY_BANNER,
    learningSelfGrantsAuthority: DG_LOCKS.LEARNING_SELF_GRANTS_AUTHORITY,
    learningEqPermission: DG_LOCKS.LEARNING_EQ_PERMISSION,
    debriefSelfGrantsAuthority: DG_LOCKS.DEBRIEF_SELF_GRANTS_AUTHORITY,
  };
}

export async function bootstrapContinuousAgentLearningDebriefSystem(input: {
  orgId: string;
  tenantId: string;
  universeId: string;
  root: string;
  actor: DgActor;
}): Promise<ContinuousLearningDebriefSystem> {
  void input.actor;
  const store = await load(input.root);
  const existing = store.systems.find(
    (s) =>
      s.orgId === input.orgId &&
      s.tenantId === input.tenantId &&
      s.universeId === input.universeId,
  );
  if (existing) return existing;
  const system: ContinuousLearningDebriefSystem = {
    id: id('dglds'),
    orgId: input.orgId,
    tenantId: input.tenantId,
    universeId: input.universeId,
    createdAt: new Date().toISOString(),
  };
  store.systems.push(system);
  await save(input.root, store);
  return system;
}

export async function openVisibleDebriefRoom(input: {
  systemId: string;
  roomId: string;
  root: string;
  actor: DgActor;
}): Promise<DebriefRoom> {
  void input.actor;
  const store = await load(input.root);
  const room: DebriefRoom = {
    id: id('dgroom'),
    systemId: input.systemId,
    roomId: input.roomId,
    visible: true,
    status: 'OPEN',
    reason: 'VISIBLE_AGENT_LEARNING_DEBRIEF_ROOM',
    createdAt: new Date().toISOString(),
  };
  store.rooms.push(room);
  await save(input.root, store);
  return room;
}

export async function recordLearningDebrief(input: {
  systemId: string;
  roomId: string;
  agentId: string;
  summary: string;
  authoritySelfGrantRequested?: boolean;
  root: string;
  actor: DgActor;
}): Promise<{ accepted: boolean; reason: string; entry: LearningDebriefEntry }> {
  void input.actor;
  const store = await load(input.root);
  if (store.entries.filter((e) => e.systemId === input.systemId).length >= MAX_DEBRIEF_ENTRIES) {
    const capped: LearningDebriefEntry = {
      id: id('dgld'),
      systemId: input.systemId,
      roomId: input.roomId,
      agentId: input.agentId,
      summary: input.summary,
      authoritySelfGrantRequested: input.authoritySelfGrantRequested === true,
      status: 'DENIED',
      reason: 'MAX_DEBRIEF_ENTRIES',
      learningGrantsPermission: false,
      at: new Date().toISOString(),
    };
    store.entries.push(capped);
    await save(input.root, store);
    return { accepted: false, reason: capped.reason, entry: capped };
  }

  if (input.authoritySelfGrantRequested === true) {
    const denied: LearningDebriefEntry = {
      id: id('dgld'),
      systemId: input.systemId,
      roomId: input.roomId,
      agentId: input.agentId,
      summary: input.summary,
      authoritySelfGrantRequested: true,
      status: 'DENIED',
      reason: LEARNING_AUTHORITY_SELF_GRANT_DENIED,
      learningGrantsPermission: false,
      at: new Date().toISOString(),
    };
    store.entries.push(denied);
    await save(input.root, store);
    return { accepted: false, reason: denied.reason, entry: denied };
  }

  const entry: LearningDebriefEntry = {
    id: id('dgld'),
    systemId: input.systemId,
    roomId: input.roomId,
    agentId: input.agentId,
    summary: input.summary,
    authoritySelfGrantRequested: false,
    status: 'RECORDED',
    reason: 'LEARNING_DEBRIEF_RECORDED_NO_AUTHORITY_GRANT',
    learningGrantsPermission: false,
    at: new Date().toISOString(),
  };
  store.entries.push(entry);
  await save(input.root, store);
  return { accepted: true, reason: entry.reason, entry };
}
