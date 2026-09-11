export type ProjectRoomRole = 'OWNER' | 'ENTREPRENEUR' | 'PRODUCT' | 'ENGINEERING' | 'DATA' | 'SECURITY' | 'UX' | 'FINANCE' | 'LEGAL' | 'TECHNICAL_WRITER' | 'CONSULTANT';

export interface ProjectRoomMember {
  actorId: string;
  role: ProjectRoomRole;
  isAgent: boolean;
  approved: boolean;
}

export interface EntrepreneurProjectRoom {
  roomId: string;
  tenantId: string;
  universeId: string;
  ventureId: string;
  title: string;
  members: ProjectRoomMember[];
  taskIds: string[];
  evidenceRefs: string[];
  classification: 'INTERNAL' | 'CONFIDENTIAL' | 'TOP_SECRET';
  consequentialActionRequiresHumanApproval: true;
}

export function validateProjectRoom(room: EntrepreneurProjectRoom): EntrepreneurProjectRoom {
  if (!room.evidenceRefs.length) throw new Error('project room requires evidence refs');
  if (!room.members.some((m) => m.role === 'OWNER' && m.approved)) throw new Error('approved owner required');
  const activeAgents = room.members.filter((m) => m.isAgent && m.approved).length;
  if (activeAgents > 8) throw new Error('maximum 8 approved agents per active room');
  if (room.members.some((m) => !m.approved)) throw new Error('unapproved member denied');
  return room;
}

export const entrepreneurRoomPolicy = {
  localFirst: true,
  agentMaySignContracts: false,
  agentMayMoveMoney: false,
  agentMayMutateProduction: false,
  humanApprovalForConsequentialActions: true,
};
