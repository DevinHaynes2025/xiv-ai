/**
 * 62L-DY Module F — Agent Collaboration Protocol.
 * Agent meetings/collaboration: signed / authorized only.
 * Collaboration ≠ unrestricted autonomy.
 */

import { readJsonFile, writeJsonFileAtomic, xivLocalPath } from './durable-json';
import {
  COLLAB_NEQ_AUTONOMY,
  MAX_COLLAB_MEETINGS,
  UNAUTHORIZED_COLLAB_DENIED,
  UNSIGNED_MEETING_DENIED,
  type DyActor,
} from './intelligent-supply-chain-command-types';

export type AgentMeeting = {
  id: string;
  meetingId: string;
  signed: boolean;
  authorized: boolean;
  unrestrictedAutonomyClaimed: boolean;
  status: 'ok' | 'denied';
  reason: string;
  createdAt: string;
};

type Store = {
  meetings: AgentMeeting[];
};

function storePath(root: string) {
  return xivLocalPath(root, 'agent-collaboration-protocol-dy.json');
}

async function load(root: string): Promise<Store> {
  return readJsonFile<Store>(storePath(root), { meetings: [] });
}

async function save(root: string, store: Store) {
  await writeJsonFileAtomic(storePath(root), store);
}

function id(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function agentCollaborationProtocolHonesty() {
  return {
    signedAuthorizedOnly: true,
    collaborationNeqUnrestrictedAutonomy: true,
    governedProtocol: true,
    l4AutonomyEnabled: false,
  };
}

export async function openAgentMeeting(input: {
  meetingId: string;
  signed: boolean;
  authorized: boolean;
  unrestrictedAutonomyClaimed?: boolean;
  root: string;
  actor: DyActor;
}): Promise<AgentMeeting> {
  const store = await load(input.root);
  void input.actor;
  if (store.meetings.length >= MAX_COLLAB_MEETINGS) {
    throw new Error('MAX_COLLAB_MEETINGS_REACHED');
  }
  let status: 'ok' | 'denied' = 'ok';
  let reason = 'AGENT_MEETING_OK';
  if (!input.signed) {
    status = 'denied';
    reason = UNSIGNED_MEETING_DENIED;
  } else if (!input.authorized) {
    status = 'denied';
    reason = UNAUTHORIZED_COLLAB_DENIED;
  } else if (input.unrestrictedAutonomyClaimed) {
    status = 'denied';
    reason = COLLAB_NEQ_AUTONOMY;
  }
  const meeting: AgentMeeting = {
    id: id('dyacm'),
    meetingId: input.meetingId.trim(),
    signed: input.signed,
    authorized: input.authorized,
    unrestrictedAutonomyClaimed: Boolean(input.unrestrictedAutonomyClaimed),
    status,
    reason,
    createdAt: new Date().toISOString(),
  };
  store.meetings.push(meeting);
  await save(input.root, store);
  return meeting;
}
