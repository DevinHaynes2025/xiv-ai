export type AgentMeetingPurpose = 'RESEARCH' | 'OPERATIONS' | 'SECURITY' | 'LEGACY' | 'FORECAST';

export type AgentParticipant = {
  agentId: string;
  permissionsGrantedByMeeting: false;
};

export type AgentAgenda = { items: readonly string[] };
export type AgentContext = { classification: string; tenantId: string };
export type AgentPosition = { agentId: string; stance: string };
export type AgentEvidence = { source: string; retrievedAt: string; reference: string };
export type AgentQuestion = { from: string; text: string };
export type AgentChallenge = { from: string; to: string; text: string };
export type AgentResponse = { agentId: string; text: string };
export type AgentDisagreement = { visible: true };
export type AgentConsensus = { forced: false };
export type AgentRecommendation = { text: string; isFact: false };
export type AgentMeetingReport = {
  agreement: readonly string[];
  disagreement: AgentDisagreement;
  recommendations: readonly AgentRecommendation[];
};

export type AgentMeeting = {
  meetingId: string;
  purpose: AgentMeetingPurpose;
  participants: readonly AgentParticipant[];
  grantsPermissions: false;
};

export function openAgentMeeting(purpose: AgentMeetingPurpose, agentIds: readonly string[]): AgentMeeting {
  return {
    meetingId: `assembly:${purpose}`,
    purpose,
    participants: agentIds.map((agentId) => ({ agentId, permissionsGrantedByMeeting: false })),
    grantsPermissions: false,
  };
}

export function agentMeetingGrantsPermissions(_meeting: AgentMeeting): false {
  return false;
}
