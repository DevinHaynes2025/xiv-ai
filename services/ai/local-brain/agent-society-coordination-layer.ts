/**
 * 62L-DZ Module E — Agent Society Coordination Layer.
 * Agent shifts / meetings; task-level reliability; governed.
 * Task reliability ≠ unrestricted autonomy; agent self-promotion denied.
 */

import { readJsonFile, writeJsonFileAtomic, xivLocalPath } from './durable-json';
import {
  AGENT_SELF_PROMOTION_DENIED,
  MAX_SOCIETY_EVENTS,
  TASK_RELIABILITY_NEQ_AUTONOMY,
  UNAUTHORIZED_SOCIETY_MEETING,
  UNSIGNED_SHIFT_DENIED,
  type DzActor,
} from './supply-chain-intelligence-fabric-types';

export type AgentShift = {
  id: string;
  shiftId: string;
  signed: boolean;
  authorized: boolean;
  unrestrictedAutonomyClaimed: boolean;
  status: 'ok' | 'denied';
  reason: string;
  createdAt: string;
};

export type SocietyMeeting = {
  id: string;
  meetingId: string;
  signed: boolean;
  authorized: boolean;
  status: 'ok' | 'denied';
  reason: string;
  createdAt: string;
};

export type AgentSelfPromotion = {
  id: string;
  agentId: string;
  status: 'denied';
  reason: string;
  at: string;
};

type Store = {
  shifts: AgentShift[];
  meetings: SocietyMeeting[];
  promotions: AgentSelfPromotion[];
};

function storePath(root: string) {
  return xivLocalPath(root, 'agent-society-coordination-layer.json');
}

async function load(root: string): Promise<Store> {
  return readJsonFile<Store>(storePath(root), {
    shifts: [],
    meetings: [],
    promotions: [],
  });
}

async function save(root: string, store: Store) {
  await writeJsonFileAtomic(storePath(root), store);
}

function id(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function agentSocietyCoordinationLayerHonesty() {
  return {
    signedAuthorizedOnly: true,
    taskReliabilityNeqUnrestrictedAutonomy: true,
    governedSociety: true,
    agentSelfPromotionForbidden: true,
    l4AutonomyEnabled: false,
  };
}

export async function openAgentShift(input: {
  shiftId: string;
  signed: boolean;
  authorized: boolean;
  unrestrictedAutonomyClaimed?: boolean;
  root: string;
  actor: DzActor;
}): Promise<AgentShift> {
  const store = await load(input.root);
  void input.actor;
  if (store.shifts.length >= MAX_SOCIETY_EVENTS) {
    throw new Error('MAX_SOCIETY_EVENTS_REACHED');
  }
  let status: 'ok' | 'denied' = 'ok';
  let reason = 'AGENT_SHIFT_OK';
  if (!input.signed) {
    status = 'denied';
    reason = UNSIGNED_SHIFT_DENIED;
  } else if (!input.authorized) {
    status = 'denied';
    reason = UNAUTHORIZED_SOCIETY_MEETING;
  } else if (input.unrestrictedAutonomyClaimed) {
    status = 'denied';
    reason = TASK_RELIABILITY_NEQ_AUTONOMY;
  }
  const shift: AgentShift = {
    id: id('dzash'),
    shiftId: input.shiftId.trim(),
    signed: input.signed,
    authorized: input.authorized,
    unrestrictedAutonomyClaimed: Boolean(input.unrestrictedAutonomyClaimed),
    status,
    reason,
    createdAt: new Date().toISOString(),
  };
  store.shifts.push(shift);
  await save(input.root, store);
  return shift;
}

export async function openSocietyMeeting(input: {
  meetingId: string;
  signed: boolean;
  authorized: boolean;
  root: string;
  actor: DzActor;
}): Promise<SocietyMeeting> {
  const store = await load(input.root);
  void input.actor;
  let status: 'ok' | 'denied' = 'ok';
  let reason = 'SOCIETY_MEETING_OK';
  if (!input.signed || !input.authorized) {
    status = 'denied';
    reason = UNAUTHORIZED_SOCIETY_MEETING;
  }
  const meeting: SocietyMeeting = {
    id: id('dzasm'),
    meetingId: input.meetingId.trim(),
    signed: input.signed,
    authorized: input.authorized,
    status,
    reason,
    createdAt: new Date().toISOString(),
  };
  store.meetings.push(meeting);
  await save(input.root, store);
  return meeting;
}

export async function attemptAgentSelfPromotion(input: {
  agentId: string;
  root: string;
  actor: DzActor;
}): Promise<AgentSelfPromotion> {
  const store = await load(input.root);
  void input.actor;
  const attempt: AgentSelfPromotion = {
    id: id('dzagsp'),
    agentId: input.agentId.trim(),
    status: 'denied',
    reason: AGENT_SELF_PROMOTION_DENIED,
    at: new Date().toISOString(),
  };
  store.promotions.push(attempt);
  await save(input.root, store);
  return attempt;
}
