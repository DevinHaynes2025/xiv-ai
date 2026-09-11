export type ArchiveConfidence = 'LOW' | 'MEDIUM' | 'HIGH';
export type ClaimKind = 'FACT' | 'INTERPRETATION' | 'TRADITION' | 'HYPOTHESIS';

export interface HistoricalArchiveRecord {
  recordId: string;
  title: string;
  era?: string;
  geography?: string;
  claimKind: ClaimKind;
  sourceRefs: string[];
  licenseRef?: string;
  confidence: ArchiveConfidence;
  contentHash: string;
  approvedForSharedBrain: boolean;
}

export function archiveEligible(record: HistoricalArchiveRecord): boolean {
  return record.sourceRefs.length > 0 && !!record.contentHash && record.approvedForSharedBrain;
}

export const HISTORICAL_ARCHIVE_POLICY = {
  sourceBackedOnly: true,
  memoryIsNotTruth: true,
  interpretationsMustBeLabeled: true,
  traditionsAndBeliefsMustBeContextualized: true,
  noLiteralConsciousnessReconstruction: true,
  topSecretExternalIngestion: false,
} as const;
