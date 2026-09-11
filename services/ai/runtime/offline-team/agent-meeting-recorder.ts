export interface AgentMeetingContribution {
  agentId: string;
  role: string;
  proposal: string;
  evidenceRefs: string[];
  confidence: number;
  dissent?: string;
}

export interface AgentMeetingRecord {
  meetingId: string;
  tenantId: string;
  topic: string;
  startedAt: string;
  endedAt?: string;
  contributions: AgentMeetingContribution[];
  decisionDraft?: string;
  requiresHumanApproval: true;
}

export function validateMeeting(record: AgentMeetingRecord): boolean {
  return record.contributions.length >= 2 && record.contributions.length <= 8 && record.contributions.every(c => c.evidenceRefs.length > 0 && c.confidence >= 0 && c.confidence <= 1);
}
