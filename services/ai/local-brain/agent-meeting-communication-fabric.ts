/**
 * 62L-DF Agent Meeting/Communication Fabric —
 * Structured agent meetings/communications/debriefs.
 * Meetings cannot transfer production authority.
 */

import { readJsonFile, writeJsonFileAtomic, xivLocalPath } from './durable-json';
import {
  DF_LOCKS,
  HONESTY_BANNER,
  MAX_MEETINGS,
  MEETING_PRODUCTION_AUTHORITY_DENIED,
  type DfActor,
} from './human-centered-superbrain-ux-types';

export type AgentMeeting = {
  id: string;
  fabricId: string;
  roomName: string;
  objective: string;
  status: 'OPEN' | 'DEBRIEFED' | 'DENIED';
  productionAuthorityTransferred: false;
  reason: string;
  createdAt: string;
  updatedAt: string;
};

export type MeetingAuthorityAttempt = {
  id: string;
  meetingId: string;
  requestedProductionAuthority: true;
  status: 'DENIED';
  reason: string;
  at: string;
};

export type AgentMeetingCommunicationFabric = {
  id: string;
  orgId: string;
  tenantId: string;
  universeId: string;
  createdAt: string;
};

type Store = {
  fabrics: AgentMeetingCommunicationFabric[];
  meetings: AgentMeeting[];
  authorityAttempts: MeetingAuthorityAttempt[];
};

function storePath(root: string) {
  return xivLocalPath(root, 'agent-meeting-communication-fabric.json');
}

async function load(root: string): Promise<Store> {
  return readJsonFile<Store>(storePath(root), {
    fabrics: [],
    meetings: [],
    authorityAttempts: [],
  });
}

async function save(root: string, store: Store) {
  await writeJsonFileAtomic(storePath(root), store);
}

function id(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function agentMeetingCommunicationFabricHonesty() {
  return {
    banner: HONESTY_BANNER,
    meetingTransfersProductionAuthority: DF_LOCKS.MEETING_TRANSFERS_PRODUCTION_AUTHORITY,
    communicationTransfersProductionAuthority:
      DF_LOCKS.COMMUNICATION_TRANSFERS_PRODUCTION_AUTHORITY,
    productionAuthorization: DF_LOCKS.PRODUCTION_AUTHORIZATION,
  };
}

export async function bootstrapAgentMeetingCommunicationFabric(input: {
  orgId: string;
  tenantId: string;
  universeId: string;
  root: string;
  actor: DfActor;
}): Promise<AgentMeetingCommunicationFabric> {
  void input.actor;
  const store = await load(input.root);
  const existing = store.fabrics.find(
    (f) =>
      f.orgId === input.orgId &&
      f.tenantId === input.tenantId &&
      f.universeId === input.universeId,
  );
  if (existing) return existing;
  const fabric: AgentMeetingCommunicationFabric = {
    id: id('dfmf'),
    orgId: input.orgId,
    tenantId: input.tenantId,
    universeId: input.universeId,
    createdAt: new Date().toISOString(),
  };
  store.fabrics.push(fabric);
  await save(input.root, store);
  return fabric;
}

export async function openAgentTeamMeeting(input: {
  fabricId: string;
  roomName: string;
  objective: string;
  transferProductionAuthority?: boolean;
  root: string;
  actor: DfActor;
}): Promise<{ accepted: boolean; reason: string; meeting?: AgentMeeting; at: string }> {
  void input.actor;
  const store = await load(input.root);
  const now = new Date().toISOString();
  const fabric = store.fabrics.find((f) => f.id === input.fabricId);
  if (!fabric) return { accepted: false, reason: 'MEETING_FABRIC_NOT_FOUND', at: now };
  if (store.meetings.length >= MAX_MEETINGS) {
    return { accepted: false, reason: 'MAX_MEETINGS_BOUNDED', at: now };
  }

  if (
    input.transferProductionAuthority === true ||
    DF_LOCKS.MEETING_TRANSFERS_PRODUCTION_AUTHORITY
  ) {
    const meeting: AgentMeeting = {
      id: id('dfmt'),
      fabricId: fabric.id,
      roomName: input.roomName.trim() || 'Agent Team Room',
      objective: input.objective.trim() || 'debrief',
      status: 'DENIED',
      productionAuthorityTransferred: false,
      reason: MEETING_PRODUCTION_AUTHORITY_DENIED,
      createdAt: now,
      updatedAt: now,
    };
    store.meetings.push(meeting);
    const attempt: MeetingAuthorityAttempt = {
      id: id('dfma'),
      meetingId: meeting.id,
      requestedProductionAuthority: true,
      status: 'DENIED',
      reason: MEETING_PRODUCTION_AUTHORITY_DENIED,
      at: now,
    };
    store.authorityAttempts.push(attempt);
    await save(input.root, store);
    return { accepted: false, reason: meeting.reason, meeting, at: now };
  }

  const meeting: AgentMeeting = {
    id: id('dfmt'),
    fabricId: fabric.id,
    roomName: input.roomName.trim() || 'Agent Team Room',
    objective: input.objective.trim() || 'structured-meeting',
    status: 'OPEN',
    productionAuthorityTransferred: false,
    reason: 'AGENT_TEAM_MEETING_OPEN_NO_PRODUCTION_AUTHORITY',
    createdAt: now,
    updatedAt: now,
  };
  store.meetings.push(meeting);
  await save(input.root, store);
  return { accepted: true, reason: meeting.reason, meeting, at: now };
}

export async function attemptMeetingProductionAuthorityTransfer(input: {
  meetingId: string;
  root: string;
  actor: DfActor;
}): Promise<{
  accepted: boolean;
  reason: string;
  attempt?: MeetingAuthorityAttempt;
  at: string;
}> {
  void input.actor;
  const store = await load(input.root);
  const now = new Date().toISOString();
  const meeting = store.meetings.find((m) => m.id === input.meetingId);
  if (!meeting) return { accepted: false, reason: 'MEETING_NOT_FOUND', at: now };

  const attempt: MeetingAuthorityAttempt = {
    id: id('dfma'),
    meetingId: meeting.id,
    requestedProductionAuthority: true,
    status: 'DENIED',
    reason: MEETING_PRODUCTION_AUTHORITY_DENIED,
    at: now,
  };
  store.authorityAttempts.push(attempt);
  meeting.updatedAt = now;
  await save(input.root, store);
  return { accepted: false, reason: attempt.reason, attempt, at: now };
}

export async function debriefAgentMeeting(input: {
  meetingId: string;
  root: string;
  actor: DfActor;
}): Promise<{ accepted: boolean; reason: string; meeting?: AgentMeeting; at: string }> {
  void input.actor;
  const store = await load(input.root);
  const now = new Date().toISOString();
  const meeting = store.meetings.find((m) => m.id === input.meetingId);
  if (!meeting) return { accepted: false, reason: 'MEETING_NOT_FOUND', at: now };
  if (meeting.status === 'DENIED') {
    return { accepted: false, reason: meeting.reason, meeting, at: now };
  }
  meeting.status = 'DEBRIEFED';
  meeting.updatedAt = now;
  meeting.reason = 'AGENT_MEETING_DEBRIEFED_NO_PRODUCTION_AUTHORITY';
  await save(input.root, store);
  return { accepted: true, reason: meeting.reason, meeting, at: now };
}
