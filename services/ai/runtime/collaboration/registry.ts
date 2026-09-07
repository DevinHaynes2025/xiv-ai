import { getXivAgent, type XivAgentId } from '../agents';
import type { HandoffType } from './types';

export const MESH_PARTICIPANTS: readonly XivAgentId[] = [
  'executive',
  'operations',
  'supply_chain',
  'finance',
  'security',
  'technology',
  'risk',
  'compliance',
  'data_quality',
  'communications',
  'moderation',
];

export type AllowedHandoffEdge = {
  source: XivAgentId;
  target: XivAgentId;
  types: readonly HandoffType[];
};

export const ALLOWED_HANDOFF_EDGES: readonly AllowedHandoffEdge[] = [
  {
    source: 'executive',
    target: 'operations',
    types: ['consultation', 'delegation', 'verification'],
  },
  {
    source: 'executive',
    target: 'supply_chain',
    types: ['consultation', 'delegation'],
  },
  {
    source: 'executive',
    target: 'data_quality',
    types: ['consultation', 'verification'],
  },
  {
    source: 'executive',
    target: 'risk',
    types: ['consultation', 'review', 'risk_review'],
  },
  {
    source: 'executive',
    target: 'compliance',
    types: ['consultation', 'review'],
  },
  {
    source: 'executive',
    target: 'finance',
    types: ['consultation'],
  },
  {
    source: 'executive',
    target: 'security',
    types: ['consultation', 'verification'],
  },
  {
    source: 'executive',
    target: 'communications',
    types: ['delegation'],
  },
  {
    source: 'operations',
    target: 'supply_chain',
    types: ['consultation'],
  },
  {
    source: 'operations',
    target: 'risk',
    types: ['consultation', 'escalation', 'risk_review'],
  },
  {
    source: 'operations',
    target: 'data_quality',
    types: ['consultation'],
  },
  {
    source: 'operations',
    target: 'executive',
    types: ['escalation'],
  },
  {
    source: 'supply_chain',
    target: 'operations',
    types: ['consultation'],
  },
  {
    source: 'supply_chain',
    target: 'risk',
    types: ['consultation', 'escalation'],
  },
  {
    source: 'supply_chain',
    target: 'executive',
    types: ['escalation'],
  },
  {
    source: 'risk',
    target: 'executive',
    types: ['escalation', 'review'],
  },
  {
    source: 'risk',
    target: 'security',
    types: ['review', 'verification'],
  },
  {
    source: 'risk',
    target: 'compliance',
    types: ['review'],
  },
  {
    source: 'data_quality',
    target: 'executive',
    types: ['consultation'],
  },
  {
    source: 'compliance',
    target: 'executive',
    types: ['escalation', 'review'],
  },
  {
    source: 'moderation',
    target: 'communications',
    types: ['review'],
  },
  {
    source: 'moderation',
    target: 'executive',
    types: ['escalation'],
  },
];

export function isMeshParticipant(agentId: string): agentId is XivAgentId {
  return MESH_PARTICIPANTS.includes(agentId as XivAgentId);
}

export function guardianMayJoinMesh(agentId: string) {
  return agentId !== 'guardian';
}

export function findAllowedEdge(source: string, target: string, type: HandoffType) {
  return ALLOWED_HANDOFF_EDGES.find(
    (edge) => edge.source === source && edge.target === target && edge.types.includes(type),
  );
}

export function meshAgentStatus(agentId: string) {
  const agent = getXivAgent(agentId);
  if (!agent) return 'unknown' as const;
  if (agent.status === 'future') return 'unavailable' as const;
  return agent.status;
}
