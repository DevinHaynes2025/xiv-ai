import { completeLocal } from './local-model';

export type MeshAgentRole =
  | 'architect'
  | 'coder'
  | 'tester'
  | 'security'
  | 'researcher'
  | 'business_analyst'
  | 'finance_analyst'
  | 'supply_chain_analyst'
  | 'operations_analyst'
  | 'culture_historian'
  | 'evidence_verifier'
  | 'skeptic'
  | 'executive_synthesizer'
  | 'executive_secretary'
  | 'decision_strategist'
  | 'knowledge_curator'
  | 'memory_librarian'
  | 'workflow_planner';

export const MESH_AGENT_ROLES: readonly MeshAgentRole[] = [
  'architect',
  'coder',
  'tester',
  'security',
  'researcher',
  'business_analyst',
  'finance_analyst',
  'supply_chain_analyst',
  'operations_analyst',
  'culture_historian',
  'evidence_verifier',
  'skeptic',
  'executive_synthesizer',
  'executive_secretary',
  'decision_strategist',
  'knowledge_curator',
  'memory_librarian',
  'workflow_planner',
] as const;

export type MeshMessage = {
  id: string;
  meetingId: string;
  from: MeshAgentRole;
  to: MeshAgentRole | 'all';
  content: string;
  createdAt: string;
  evidenceRefs: string[];
};

export type MeshMeeting = {
  id: string;
  objective: string;
  roles: MeshAgentRole[];
  maxRounds: number;
  messages: MeshMessage[];
  createdAt: string;
};

const HARD_MAX_ROUNDS = 6;
const HARD_MAX_ROLES = 12;

function id(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function createMeeting(objective: string, roles: MeshAgentRole[], maxRounds = 3): MeshMeeting {
  const uniqueRoles = [...new Set(roles)].slice(0, HARD_MAX_ROLES);
  return {
    id: id('meet'),
    objective,
    roles: uniqueRoles,
    maxRounds: Math.max(1, Math.min(maxRounds, HARD_MAX_ROUNDS)),
    messages: [],
    createdAt: new Date().toISOString(),
  };
}

export async function runLocalMeeting(meeting: MeshMeeting) {
  for (let round = 0; round < meeting.maxRounds; round += 1) {
    for (const role of meeting.roles) {
      const transcript = meeting.messages
        .slice(-24)
        .map((message) => `${message.from}: ${message.content}`)
        .join('\n');

      const prompt = [
        'You are a bounded XIV AI specialist operating in an offline/local sandbox.',
        `Role: ${role}`,
        `Objective: ${meeting.objective}`,
        'You may make low-consequence sandbox decisions only when policy explicitly allows them. Consequential decisions remain human-authorized.',
        'Do not claim access to information that is not in the prompt or local approved context.',
        'Separate observed facts, inference, prediction, historical account, cultural context, belief/tradition, and speculation.',
        'Do not authorize production deployment, financial commitments, permission changes, legal actions, external publication, or cross-tenant data sharing.',
        'Challenge weak reasoning and surface contradictory evidence rather than forcing consensus.',
        'Reply with a concise contribution and explicitly state uncertainty or missing evidence.',
        transcript ? `Prior meeting transcript:\n${transcript}` : 'No prior messages.',
      ].join('\n\n');

      const result = await completeLocal(prompt);
      meeting.messages.push({
        id: id('msg'),
        meetingId: meeting.id,
        from: role,
        to: 'all',
        content: result.text,
        createdAt: new Date().toISOString(),
        evidenceRefs: [],
      });
    }
  }

  return meeting;
}
