export type DeveloperCouncilRole = 'LEGAL' | 'SECURITY' | 'FINANCE' | 'PLATFORM' | 'DEVEX' | 'TECHNICAL_WRITER' | 'QA' | 'PRODUCT';

export interface CouncilContribution {
  role: DeveloperCouncilRole;
  recommendation: string;
  evidenceRefs: string[];
  confidence: number;
  dissent?: string;
}

export interface DeveloperCouncilMeeting {
  meetingId: string;
  tenantId: string;
  developerId: string;
  topic: string;
  participants: DeveloperCouncilRole[];
  contributions: CouncilContribution[];
  humanApprovalRequired: boolean;
  productionMutationAllowed: boolean;
  externalNetworkRequired: boolean;
}

export function validateDeveloperCouncilMeeting(meeting: DeveloperCouncilMeeting): string[] {
  const errors: string[] = [];
  const unique = new Set(meeting.participants);
  if (unique.size < 2 || unique.size > 8) errors.push('participants must contain 2-8 unique roles');
  if (!meeting.humanApprovalRequired) errors.push('human approval is required');
  if (meeting.productionMutationAllowed) errors.push('production mutation is not allowed');
  for (const c of meeting.contributions) {
    if (!unique.has(c.role)) errors.push(`unapproved contributor: ${c.role}`);
    if (!c.evidenceRefs.length) errors.push(`missing evidence: ${c.role}`);
    if (c.confidence < 0 || c.confidence > 1) errors.push(`invalid confidence: ${c.role}`);
  }
  return errors;
}

export const LOCAL_COUNCIL_POLICY = {
  localhostFirst: true,
  maxActiveAgents: 8,
  preserveDissent: true,
  humanGateConsequentialActions: true,
  autonomousMoneyMovement: false,
  autonomousContractSigning: false,
} as const;
