/**
 * 62L-EA Module F — Agent Department Network.
 * Departments, meetings; governed; ≠ unrestricted autonomy.
 * Self-promotion denied.
 */

import { readJsonFile, writeJsonFileAtomic, xivLocalPath } from './durable-json';
import {
  AGENT_DEPT_SELF_PROMOTION_DENIED,
  DEPT_NEQ_AUTONOMY,
  MAX_DEPT_EVENTS,
  UNAUTHORIZED_DEPT_MEETING,
  type EaActor,
} from './global-operations-intelligence-grid-types';

export type DepartmentMeeting = {
  id: string;
  meetingId: string;
  departmentId: string;
  signed: boolean;
  authorized: boolean;
  unrestrictedAutonomyClaimed: boolean;
  status: 'ok' | 'denied';
  reason: string;
  at: string;
};

export type AgentDepartmentSelfPromotion = {
  id: string;
  agentId: string;
  departmentId: string;
  status: 'denied';
  reason: string;
  at: string;
};

type Store = {
  meetings: DepartmentMeeting[];
  promotions: AgentDepartmentSelfPromotion[];
};

function storePath(root: string) {
  return xivLocalPath(root, 'agent-department-network.json');
}

async function load(root: string): Promise<Store> {
  return readJsonFile<Store>(storePath(root), {
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

export function agentDepartmentNetworkHonesty() {
  return {
    governedDepartments: true,
    departmentNeqUnrestrictedAutonomy: true,
    agentDepartmentSelfPromotionForbidden: true,
    humanFounderGateRequired: true,
  };
}

export async function openDepartmentMeeting(input: {
  meetingId: string;
  departmentId: string;
  signed: boolean;
  authorized: boolean;
  unrestrictedAutonomyClaimed?: boolean;
  root: string;
  actor: EaActor;
}): Promise<DepartmentMeeting> {
  const store = await load(input.root);
  void input.actor;
  if (store.meetings.length >= MAX_DEPT_EVENTS) {
    throw new Error('MAX_DEPT_EVENTS_REACHED');
  }
  if (!input.authorized || !input.signed) {
    const denied: DepartmentMeeting = {
      id: id('eadept'),
      meetingId: input.meetingId.trim(),
      departmentId: input.departmentId.trim(),
      signed: input.signed,
      authorized: input.authorized,
      unrestrictedAutonomyClaimed: Boolean(input.unrestrictedAutonomyClaimed),
      status: 'denied',
      reason: UNAUTHORIZED_DEPT_MEETING,
      at: new Date().toISOString(),
    };
    store.meetings.push(denied);
    await save(input.root, store);
    return denied;
  }
  if (input.unrestrictedAutonomyClaimed) {
    const denied: DepartmentMeeting = {
      id: id('eadept'),
      meetingId: input.meetingId.trim(),
      departmentId: input.departmentId.trim(),
      signed: true,
      authorized: true,
      unrestrictedAutonomyClaimed: true,
      status: 'denied',
      reason: DEPT_NEQ_AUTONOMY,
      at: new Date().toISOString(),
    };
    store.meetings.push(denied);
    await save(input.root, store);
    return denied;
  }
  const ok: DepartmentMeeting = {
    id: id('eadept'),
    meetingId: input.meetingId.trim(),
    departmentId: input.departmentId.trim(),
    signed: true,
    authorized: true,
    unrestrictedAutonomyClaimed: false,
    status: 'ok',
    reason: 'DEPARTMENT_MEETING_GOVERNED',
    at: new Date().toISOString(),
  };
  store.meetings.push(ok);
  await save(input.root, store);
  return ok;
}

export async function attemptAgentDepartmentSelfPromotion(input: {
  agentId: string;
  departmentId: string;
  root: string;
  actor: EaActor;
}): Promise<AgentDepartmentSelfPromotion> {
  const store = await load(input.root);
  void input.actor;
  const denial: AgentDepartmentSelfPromotion = {
    id: id('eaadsp'),
    agentId: input.agentId.trim(),
    departmentId: input.departmentId.trim(),
    status: 'denied',
    reason: AGENT_DEPT_SELF_PROMOTION_DENIED,
    at: new Date().toISOString(),
  };
  store.promotions.push(denial);
  await save(input.root, store);
  return denial;
}
