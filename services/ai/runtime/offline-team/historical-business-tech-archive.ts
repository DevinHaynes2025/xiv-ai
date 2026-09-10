export type ArchiveSourceKind = 'DOCUMENT' | 'WEB_ARCHIVE' | 'CASE_STUDY' | 'DATASET' | 'MEDIA' | 'CODE_REPOSITORY';
export type ArchiveReviewState = 'UNREVIEWED' | 'REVIEWED' | 'APPROVED' | 'REJECTED';

export interface HistoricalArchiveRecord {
  recordId: string;
  title: string;
  era?: string;
  domains: string[];
  sourceKind: ArchiveSourceKind;
  sourceRef: string;
  licenseRef?: string;
  evidenceRefs: string[];
  summary: string;
  reviewState: ArchiveReviewState;
  confidence: number;
  ingestedAt: string;
}

export function canPromoteHistoricalRecord(record: HistoricalArchiveRecord): boolean {
  return record.reviewState === 'APPROVED' && record.evidenceRefs.length > 0 && record.confidence >= 0.75;
}

export const HISTORICAL_ARCHIVE_GUARDRAILS = {
  sourceBackedOnly: true,
  licenseAndPermissionChecksRequired: true,
  historicalPersonaMeansKnowledgeProfileNotConsciousness: true,
  unreviewedRecordsTrustedByCompanyBrain: false,
};
