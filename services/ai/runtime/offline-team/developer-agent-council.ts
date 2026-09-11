export type CouncilRole = 'LEGAL' | 'SECURITY' | 'FINANCE' | 'PLATFORM' | 'DEVELOPER_EXPERIENCE' | 'TECHNICAL_WRITER' | 'QA' | 'PRODUCT';

export interface CouncilVote {
  role: CouncilRole;
  recommendation: string;
  evidenceRefs: string[];
  confidence: number;
  dissent?: string;
}

export interface DeveloperCouncilMeeting {
  meetingId: string;
  tenantId: string;
  topic: string;
  participants: CouncilRole[];
  votes: CouncilVote[];
  humanApprovalRequired: boolean;
}

export function validateDeveloperCouncil(m: DeveloperCouncilMeeting): boolean {
  const unique = new Set(m.participants);
  return m.participants.length >= 2 && m.participants.length <= 8 && unique.size === m.participants.length && m.votes.every(v => v.evidenceRefs.length > 0 && v.confidence >= 0 && v.confidence <= 1);
}

export const developerCouncilPolicy = {
  preserveDissent: true,
  humanApprovalForConsequentialActions: true,
  maxActiveAgents: 8,
  councilDecisionIsNotTruth: true,
};
