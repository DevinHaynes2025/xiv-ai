import { publishAgentMessage } from './agent-bus';
import { createMeeting, runLocalMeeting, type MeshAgentRole, type MeshMessage } from './agent-mesh';
import { readJsonFile, writeJsonFileAtomic, xivLocalPath } from './durable-json';
import { retrieveOfflineKnowledge } from './knowledge-retrieval';

export type MeetingRoomState = 'open' | 'paused' | 'completed' | 'unavailable' | 'blocked';

export type MeetingRoom = {
  id: string;
  tenantId: string;
  universeId: string;
  objective: string;
  roles: MeshAgentRole[];
  maxRounds: number;
  roundsCompleted: number;
  messages: MeshMessage[];
  knowledgeRefs: string[];
  state: MeetingRoomState;
  createdAt: string;
  updatedAt: string;
  productionAuthorized: false;
};

type RoomStore = { rooms: MeetingRoom[] };

function roomsPath(root: string) {
  return xivLocalPath(root, 'meeting-rooms.json');
}

async function loadRooms(root: string): Promise<MeetingRoom[]> {
  const parsed = await readJsonFile<RoomStore>(roomsPath(root), { rooms: [] });
  return Array.isArray(parsed.rooms) ? parsed.rooms : [];
}

async function saveRooms(root: string, rooms: MeetingRoom[]) {
  await writeJsonFileAtomic(roomsPath(root), { rooms: rooms.slice(-500) });
}

export async function openMeetingRoom(input: {
  tenantId: string;
  universeId: string;
  objective: string;
  roles: MeshAgentRole[];
  maxRounds?: number;
  root?: string;
}): Promise<MeetingRoom> {
  if (!input.tenantId || !input.universeId) throw new Error('TENANT_AND_UNIVERSE_REQUIRED');
  if (!input.objective.trim()) throw new Error('MEETING_OBJECTIVE_REQUIRED');
  const root = input.root ?? process.cwd();
  const draft = createMeeting(input.objective, input.roles, input.maxRounds ?? 2);
  const now = new Date().toISOString();
  const room: MeetingRoom = {
    id: draft.id,
    tenantId: input.tenantId,
    universeId: input.universeId,
    objective: input.objective.trim(),
    roles: draft.roles,
    maxRounds: draft.maxRounds,
    roundsCompleted: 0,
    messages: [],
    knowledgeRefs: [],
    state: 'open',
    createdAt: now,
    updatedAt: now,
    productionAuthorized: false,
  };
  const rooms = await loadRooms(root);
  rooms.push(room);
  await saveRooms(root, rooms);
  return room;
}

export async function loadMeetingRoom(id: string, tenantId: string, universeId: string, root = process.cwd()) {
  const rooms = await loadRooms(root);
  return rooms.find((room) => room.id === id && room.tenantId === tenantId && room.universeId === universeId) ?? null;
}

export async function listMeetingRooms(tenantId: string, universeId: string, root = process.cwd()) {
  return (await loadRooms(root)).filter((room) => room.tenantId === tenantId && room.universeId === universeId);
}

export async function listAllMeetingRooms(root = process.cwd()) {
  return loadRooms(root);
}

export async function pauseMeetingRoom(id: string, tenantId: string, universeId: string, root = process.cwd()) {
  const rooms = await loadRooms(root);
  const room = rooms.find((item) => item.id === id && item.tenantId === tenantId && item.universeId === universeId);
  if (!room) throw new Error('MEETING_ROOM_NOT_FOUND');
  if (room.state === 'completed' || room.state === 'blocked') return room;
  room.state = 'paused';
  room.updatedAt = new Date().toISOString();
  await saveRooms(root, rooms);
  return room;
}

export async function runMeetingRoomRound(input: {
  roomId: string;
  tenantId: string;
  universeId: string;
  root?: string;
  retrieveKnowledge?: boolean;
}) {
  const root = input.root ?? process.cwd();
  const rooms = await loadRooms(root);
  const room = rooms.find((item) => item.id === input.roomId && item.tenantId === input.tenantId && item.universeId === input.universeId);
  if (!room) throw new Error('MEETING_ROOM_NOT_FOUND');
  if (room.state === 'completed' || room.state === 'blocked') return room;
  if (room.roundsCompleted >= room.maxRounds) {
    room.state = 'completed';
    room.updatedAt = new Date().toISOString();
    await saveRooms(root, rooms);
    return room;
  }

  if (input.retrieveKnowledge !== false) {
    const knowledge = await retrieveOfflineKnowledge(room.objective, {
      root,
      tenantId: room.tenantId,
      universeId: room.universeId,
    });
    room.knowledgeRefs = [...new Set([...room.knowledgeRefs, ...knowledge.evidenceRefs])];
  }

  const priorCount = room.messages.length;
  const meeting = {
    id: room.id,
    objective: room.knowledgeRefs.length
      ? `${room.objective}\n\nLocal knowledge refs (do not invent beyond these): ${room.knowledgeRefs.join(', ')}`
      : room.objective,
    roles: room.roles,
    maxRounds: 1,
    messages: [...room.messages],
    createdAt: room.createdAt,
  };
  const result = await runLocalMeeting(meeting);
  room.messages = result.messages;
  room.roundsCompleted += 1;
  room.updatedAt = new Date().toISOString();
  if (result.runtimeState === 'UNAVAILABLE') room.state = 'unavailable';
  else if (room.roundsCompleted >= room.maxRounds) room.state = 'completed';
  else room.state = 'open';

  for (const message of result.messages.slice(priorCount)) {
    publishAgentMessage({
      fromRole: message.from,
      toRole: 'all',
      tenantId: room.tenantId,
      universeId: room.universeId,
      kind: 'task',
      body: message.content.slice(0, 16_000),
      evidenceRefs: [...room.knowledgeRefs],
      requiresHumanApproval: false,
    });
  }

  await saveRooms(root, rooms);
  return room;
}

export function meetingRoomStats(rooms: MeetingRoom[]) {
  return {
    total: rooms.length,
    open: rooms.filter((room) => room.state === 'open' || room.state === 'paused').length,
    completed: rooms.filter((room) => room.state === 'completed').length,
    unavailable: rooms.filter((room) => room.state === 'unavailable').length,
    productionAuthorized: false as const,
  };
}
