export type MeetingCadence = 'ON_DEMAND' | 'HOURLY' | 'DAILY';

export interface AgentMeetingSchedule {
  tenantId: string;
  meetingId: string;
  topic: string;
  participantAgentIds: string[];
  cadence: MeetingCadence;
  scheduledFor: string;
  preserveDissent: true;
  humanApprovalRequiredForConsequentialActions: true;
}

export function scheduleAgentMeeting(input: Omit<AgentMeetingSchedule, 'preserveDissent' | 'humanApprovalRequiredForConsequentialActions'>): AgentMeetingSchedule {
  if (input.participantAgentIds.length < 2 || input.participantAgentIds.length > 8) {
    throw new Error('agent councils must contain 2-8 participants');
  }
  if (!input.tenantId || !input.meetingId || !input.topic) throw new Error('meeting identity is required');
  return {
    ...input,
    preserveDissent: true,
    humanApprovalRequiredForConsequentialActions: true,
  };
}

export const MEETING_SCHEDULER_GUARDRAILS = {
  maxConcurrentMeetingsPerTenant: 2,
  autonomousProductionExecution: false,
  dissentMayBeDiscarded: false,
} as const;
