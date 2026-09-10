import { PersistentCompanyBrain, BrainConfidentiality } from './persistent-company-brain';

export interface MeetingIngestionInput {
  tenantId: string;
  meetingId: string;
  text: string;
  confidentiality: BrainConfidentiality;
  evidenceRefs: string[];
  approvedForLearning: boolean;
  createdAt?: string;
}

export function ingestMeeting(brain: PersistentCompanyBrain, input: MeetingIngestionInput) {
  if (!input.tenantId || !input.meetingId) throw new Error('tenantId and meetingId required');
  if (input.approvedForLearning && input.evidenceRefs.length === 0) throw new Error('approved learning requires evidence');
  const searchable = input.confidentiality !== 'TOP_SECRET';
  return brain.upsert({
    tenantId: input.tenantId,
    sourceType: 'MEETING',
    sourceId: input.meetingId,
    confidentiality: input.confidentiality,
    text: input.text,
    evidenceRefs: [...input.evidenceRefs],
    createdAt: input.createdAt ?? new Date().toISOString(),
    searchable,
  });
}
