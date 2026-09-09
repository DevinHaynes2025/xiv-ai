export type LeadScoreEvidence = {
  source: string;
  summary: string;
  provenanceRequired: true;
};

export type LeadScore = {
  value: number | 'not_measured';
  evidence: readonly LeadScoreEvidence[];
};

export type LeadStatus = 'new' | 'working' | 'qualified' | 'unqualified' | 'converted' | 'suppressed';

export type Lead = {
  leadId: string;
  organizationId: string;
  universeId: string | null;
  status: LeadStatus;
  persisted: false;
};

export type LeadSource = {
  sourceId: string;
  name: string;
  authorized: boolean;
};

export type LeadActivity = {
  activityId: string;
  leadId: string;
  kind: string;
  persisted: false;
};

export type LeadAssignment = {
  assignmentId: string;
  leadId: string;
  assigneeUserId: string;
};

export type OpportunityConversion = {
  leadId: string;
  opportunityId: string;
  converted: boolean;
};

export type SuppressionRecord = {
  suppressionId: string;
  organizationId: string;
  reason: 'opt_out' | 'do_not_contact' | 'legal';
};

export type OutreachPermission = {
  leadId: string;
  allowed: boolean;
  spamAutomation: false;
};

export function scoreLead(evidence: readonly LeadScoreEvidence[]): LeadScore | { allowed: false; reason: string } {
  if (evidence.length === 0) {
    return { allowed: false, reason: 'Lead score requires evidence: DENY' };
  }
  return { value: 'not_measured', evidence };
}

export function automatedSpamOutreachEnabled() {
  return false;
}

export const LEAD_MODEL = [
  'Lead',
  'LeadSource',
  'LeadActivity',
  'LeadScoreEvidence',
  'LeadAssignment',
  'LeadStatus',
  'OpportunityConversion',
  'SuppressionRecord',
  'OutreachPermission',
] as const;
