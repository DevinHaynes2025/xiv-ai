export interface HistoricalTechnologyRecord {
  recordId: string;
  name: string;
  era: string;
  category: 'COMPUTE' | 'NETWORK' | 'DATABASE' | 'AI' | 'MOBILE' | 'CLOUD' | 'CHIP' | 'SECURITY' | 'LOGISTICS_TECH';
  summary: string;
  sourceRefs: string[];
  peopleOrOrgs: string[];
  predecessorIds: string[];
  successorIds: string[];
  confidence: number;
  reviewed: boolean;
}

export function trustedHistoricalRecords(records: HistoricalTechnologyRecord[]) {
  return records.filter(r => r.reviewed && r.sourceRefs.length > 0 && r.confidence >= 0.75);
}

export const HISTORICAL_ARCHIVE_GUARDRAILS = {
  sourceBackedOnly: true,
  historicalPersonaIsSourceBackedProfileNotConsciousness: true,
  provenanceRequired: true,
  externalWebIngestRequiresApproval: true,
  topSecretExternalIngestAllowed: false,
};
