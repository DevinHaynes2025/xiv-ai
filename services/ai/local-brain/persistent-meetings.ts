import { publishPersistentAgentMessage, loadPersistentInbox } from './persistent-agent-bus';
import { createMeeting, runLocalMeeting, type MeshAgentRole, type MeshMeeting } from './agent-mesh';
import { retrieveEvidencePathway } from './cortex-evidence';
import { cortexId, readJsonFile, writeJsonFileAtomic, xivLocalPath } from './cortex-store';

export type PersistentMeetingState = 'open' | 'paused' | 'completed' | 'unavailable';

export type PersistentMeeting = {
  id: string;
  tenantId: string;
  universeId: string;
  objective: string;
  roles: MeshAgentRole[];
  maxRounds: number;
  completedRounds: number;
  state: PersistentMeetingState;
  retrievalBeforeReasoning: true;
  evidenceRefs: string[];
  messages: Array<{ from: string; content: string }>;
  consensusForced: false;
  founderImpersonation: false;
  productionAuthorized: false;
  createdAt: string;
  updatedAt: string;
};

type Store = { meetings: PersistentMeeting[] };

function pathFor(root: string) {
  return xivLocalPath(root, 'persistent-meetings.json');
}

async function load(root: string) {
  const parsed = await readJsonFile<Store>(pathFor(root), { meetings: [] });
  return Array.isArray(parsed.meetings) ? parsed.meetings : [];
}

async function save(root: string, meetings: PersistentMeeting[]) {
  await writeJsonFileAtomic(pathFor(root), { meetings: meetings.slice(-1_000) });
}

export async function openPersistentMeeting(input: {
  tenantId: string;
  universeId: string;
  objective: string;
  roles: MeshAgentRole[];
  maxRounds?: number;
  root?: string;
}): Promise<PersistentMeeting> {
  if (!input.tenantId || !input.universeId) throw new Error('TENANT_AND_UNIVERSE_REQUIRED');
  if (!input.objective.trim()) throw new Error('MEETING_OBJECTIVE_REQUIRED');
  const root = input.root ?? process.cwd();
  const knowledge = await retrieveEvidencePathway({
    tenantId: input.tenantId,
    universeId: input.universeId,
    query: input.objective,
    root,
  });
  const now = new Date().toISOString();
  const meeting: PersistentMeeting = {
    id: cortexId('pmeet'),
    tenantId: input.tenantId,
    universeId: input.universeId,
    objective: input.objective.trim(),
    roles: [...new Set(input.roles)].slice(0, 8),
    maxRounds: Math.max(1, Math.min(input.maxRounds ?? 1, 4)),
    completedRounds: 0,
    state: 'open',
    retrievalBeforeReasoning: true,
    evidenceRefs: knowledge.evidenceRefs,
    messages: [],
    consensusForced: false,
    founderImpersonation: false,
    productionAuthorized: false,
    createdAt: now,
    updatedAt: now,
  };
  const meetings = await load(root);
  meetings.push(meeting);
  await save(root, meetings);
  return meeting;
}

export async function runPersistentMeetingRound(input: {
  id: string;
  tenantId: string;
  universeId: string;
  root?: string;
}) {
  const root = input.root ?? process.cwd();
  const meetings = await load(root);
  const meeting = meetings.find((item) =>
    item.id === input.id && item.tenantId === input.tenantId && item.universeId === input.universeId,
  );
  if (!meeting) throw new Error('PERSISTENT_MEETING_NOT_FOUND');
  if (meeting.state === 'paused') return meeting;
  if (meeting.completedRounds >= meeting.maxRounds) {
    meeting.state = 'completed';
    meeting.updatedAt = new Date().toISOString();
    await save(root, meetings);
    return meeting;
  }

  const session: MeshMeeting = createMeeting(
    `${meeting.objective}\nEvidence first: ${meeting.evidenceRefs.join(', ') || 'none'}\nDo not impersonate the founder.`,
    meeting.roles,
    1,
  );
  const result = await runLocalMeeting(session);
  meeting.messages.push(...result.messages.map((message) => ({ from: message.from, content: message.content })));
  meeting.completedRounds += 1;
  const unavailable = result.messages.some((message) => /UNAVAILABLE/i.test(message.content));
  meeting.state = unavailable
    ? 'unavailable'
    : meeting.completedRounds >= meeting.maxRounds
      ? 'completed'
      : 'open';
  meeting.updatedAt = new Date().toISOString();

  await publishPersistentAgentMessage({
    fromRole: meeting.roles[0] ?? 'researcher',
    toRole: 'executive_synthesizer',
    tenantId: meeting.tenantId,
    universeId: meeting.universeId,
    kind: 'status',
    body: `Persistent meeting ${meeting.id} round ${meeting.completedRounds}/${meeting.maxRounds} state=${meeting.state}`,
    evidenceRefs: meeting.evidenceRefs,
    requiresHumanApproval: false,
  }, root);

  await save(root, meetings);
  return meeting;
}

export async function pausePersistentMeeting(id: string, tenantId: string, universeId: string, root?: string) {
  const resolved = root ?? process.cwd();
  const meetings = await load(resolved);
  const meeting = meetings.find((item) => item.id === id && item.tenantId === tenantId && item.universeId === universeId);
  if (!meeting) throw new Error('PERSISTENT_MEETING_NOT_FOUND');
  meeting.state = 'paused';
  meeting.updatedAt = new Date().toISOString();
  await save(resolved, meetings);
  return meeting;
}

export async function resumePersistentMeeting(id: string, tenantId: string, universeId: string, root?: string) {
  const resolved = root ?? process.cwd();
  const meetings = await load(resolved);
  const meeting = meetings.find((item) => item.id === id && item.tenantId === tenantId && item.universeId === universeId);
  if (!meeting) throw new Error('PERSISTENT_MEETING_NOT_FOUND');
  if (meeting.state === 'paused' || meeting.state === 'unavailable') meeting.state = 'open';
  meeting.updatedAt = new Date().toISOString();
  await save(resolved, meetings);
  return meeting;
}

export async function loadPersistentMeeting(id: string, tenantId: string, universeId: string, root?: string) {
  const meetings = await load(root ?? process.cwd());
  return meetings.find((item) => item.id === id && item.tenantId === tenantId && item.universeId === universeId) ?? null;
}

export async function meetingInbox(input: {
  role: string;
  tenantId: string;
  universeId: string;
  root?: string;
}) {
  return loadPersistentInbox(input);
}
