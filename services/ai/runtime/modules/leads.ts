export type LeadScoreEvidence = {
  source: string;
  summary: string;
};

export type LeadScore = {
  value: number | 'not_measured';
  evidence: readonly LeadScoreEvidence[];
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
  'Opportunity',
  'PipelineStage',
] as const;
