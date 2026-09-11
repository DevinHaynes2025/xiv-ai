export interface MeetingParticipant {
  agentId: string;
  role: string;
  evidenceRefs: string[];
}

export interface MeetingCycle {
  meetingId: string;
  tenantId: string;
  participants: MeetingParticipant[];
  agenda: string[];
  dissentRequired: true;
  productionMutationAllowed: false;
}

export function validateMeetingCycle(input: MeetingCycle): void {
  if (input.participants.length < 2 || input.participants.length > 8) throw new Error('meeting-must-have-2-to-8-agents');
  if (!input.tenantId || !input.meetingId) throw new Error('tenant-and-meeting-id-required');
  if (input.productionMutationAllowed !== false) throw new Error('production-mutation-disabled');
}

export function summarizeMeeting(input: MeetingCycle) {
  validateMeetingCycle(input);
  return {
    meetingId: input.meetingId,
    participantCount: input.participants.length,
    evidenceCount: input.participants.reduce((n, p) => n + p.evidenceRefs.length, 0),
    humanApprovalRequired: true,
    preservesDissent: input.dissentRequired,
  };
}
