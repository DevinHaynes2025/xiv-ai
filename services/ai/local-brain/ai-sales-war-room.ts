/**
 * 62L-DS AI Sales War Room —
 * Premium collaborative sales OS; story-before-dashboard UX; specialized governed agents.
 * Operating controls + evidence, not dashboard theater alone.
 */

import { readJsonFile, writeJsonFileAtomic, xivLocalPath } from './durable-json';
import {
  DS_LOCKS,
  HONESTY_BANNER,
  MAX_WAR_ROOM_SESSIONS,
  SALES_WAR_ROOM_STORY_BEFORE_DASHBOARD,
  type DsActor,
} from './revenue-intelligence-os-types';

export type WarRoomAgentRole =
  | 'cro'
  | 'sdr'
  | 'account_executive'
  | 'negotiation'
  | 'customer_success'
  | 'sales_ops';

export type SalesStoryBeat = {
  id: string;
  title: string;
  narrative: string;
  evidenceRefs: string[];
  beforeDashboard: true;
};

export type SalesWarRoomSession = {
  id: string;
  orgId: string;
  tenantId: string;
  universeId: string;
  dealLabel: string;
  storyFirst: true;
  dashboardSecondary: true;
  agents: Array<{ role: WarRoomAgentRole; governed: true; canCharge: false; canSign: false }>;
  storyBeats: SalesStoryBeat[];
  theaterOnly: false;
  createdAt: string;
};

type Store = { sessions: SalesWarRoomSession[] };

function storePath(root: string) {
  return xivLocalPath(root, 'ai-sales-war-room.json');
}
async function load(root: string): Promise<Store> {
  return readJsonFile<Store>(storePath(root), { sessions: [] });
}
async function save(root: string, store: Store) {
  await writeJsonFileAtomic(storePath(root), store);
}
function id(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function aiSalesWarRoomHonesty() {
  return {
    banner: HONESTY_BANNER,
    storyBeforeDashboard: true as const,
    dashboardTheaterAlone: false as const,
    agentsCanCharge: false as const,
    agentsCanSign: false as const,
    l4AutonomyEnabled: DS_LOCKS.L4_AUTONOMY_ENABLED,
  };
}

export async function openSalesWarRoom(input: {
  dealLabel: string;
  storyTitle: string;
  storyNarrative: string;
  evidenceRefs?: string[];
  agentRoles?: WarRoomAgentRole[];
  root: string;
  actor: DsActor;
}): Promise<SalesWarRoomSession> {
  const store = await load(input.root);
  if (store.sessions.length >= MAX_WAR_ROOM_SESSIONS) throw new Error('MAX_WAR_ROOM_SESSIONS_REACHED');
  const roles = input.agentRoles ?? [
    'cro', 'sdr', 'account_executive', 'negotiation', 'customer_success', 'sales_ops',
  ];
  const session: SalesWarRoomSession = {
    id: id('swr'),
    orgId: input.actor.orgId,
    tenantId: input.actor.tenantId,
    universeId: input.actor.universeId,
    dealLabel: input.dealLabel,
    storyFirst: true,
    dashboardSecondary: true,
    agents: roles.map((role) => ({
      role,
      governed: true as const,
      canCharge: false as const,
      canSign: false as const,
    })),
    storyBeats: [
      {
        id: id('beat'),
        title: input.storyTitle,
        narrative: input.storyNarrative,
        evidenceRefs: input.evidenceRefs ?? [],
        beforeDashboard: true,
      },
    ],
    theaterOnly: false,
    createdAt: new Date().toISOString(),
  };
  store.sessions.push(session);
  await save(input.root, store);
  return session;
}

export async function probeStoryBeforeDashboard(input: {
  sessionId: string;
  root: string;
  actor: DsActor;
}): Promise<{ status: 'pass' | 'fail'; reason: string; storyFirst: boolean }> {
  const store = await load(input.root);
  void input.actor;
  const session = store.sessions.find((s) => s.id === input.sessionId);
  if (!session) return { status: 'fail', reason: 'SESSION_NOT_FOUND', storyFirst: false };
  const ok =
    session.storyFirst === true &&
    session.storyBeats.length > 0 &&
    session.storyBeats.every((b) => b.beforeDashboard === true) &&
    session.theaterOnly === false;
  return {
    status: ok ? 'pass' : 'fail',
    reason: ok ? SALES_WAR_ROOM_STORY_BEFORE_DASHBOARD : 'DASHBOARD_THEATER_ALONE',
    storyFirst: session.storyFirst,
  };
}
