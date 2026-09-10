export type WorldMode = 'BUSINESS' | 'COMMUNITY' | 'LEARNING' | 'INNOVATION' | 'SIMULATION';

export interface VirtualWorldRoom {
  roomId: string;
  tenantId?: string;
  mode: WorldMode;
  title: string;
  participants: string[];
  agentIds: string[];
  visibility: 'PUBLIC' | 'PERMISSIONED' | 'PRIVATE_UNIVERSE';
  simulationOnly: true;
}

export function createVirtualWorldRoom(room: VirtualWorldRoom): VirtualWorldRoom {
  if (!room.roomId || !room.title) throw new Error('room identity required');
  if (room.visibility === 'PRIVATE_UNIVERSE' && !room.tenantId) throw new Error('private universe requires tenant');
  return { ...room, participants: [...new Set(room.participants)], agentIds: [...new Set(room.agentIds)], simulationOnly: true };
}

export const VIRTUAL_WORLD_GUARDRAILS = {
  literalParallelUniverse: false,
  simulationOnly: true,
  privateUniverseIsolation: true,
  addictiveEntertainmentOptimization: false,
  businessAndLearningUtilityFirst: true,
};
