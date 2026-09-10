export type MeetingKind = 'STANDUP' | 'THINK_TANK' | 'RETROSPECTIVE' | 'INNOVATION_REVIEW' | 'STUDY_CIRCLE';

export interface AgentMeeting {
  meetingId: string;
  tenantId: string;
  kind: MeetingKind;
  participantAgentIds: readonly string[];
  agenda: readonly string[];
  evidenceRefs: readonly string[];
  simulationOnly: boolean;
  productionAuthority: false;
}

export const AGENT_MEETING_GUARDRAILS = {
  maxParticipants: 32,
  maxAgendaItems: 16,
  crossTenantMeetingsAllowed: false,
  productionAuthority: false,
  disagreementMustBePreserved: true,
} as const;

export function createAgentMeeting(input: Omit<AgentMeeting, 'simulationOnly' | 'productionAuthority'>): AgentMeeting {
  if (input.participantAgentIds.length > AGENT_MEETING_GUARDRAILS.maxParticipants) throw new Error('participant cap exceeded');
  if (input.agenda.length > AGENT_MEETING_GUARDRAILS.maxAgendaItems) throw new Error('agenda cap exceeded');
  return Object.freeze({ ...input, simulationOnly: true, productionAuthority: false });
}
