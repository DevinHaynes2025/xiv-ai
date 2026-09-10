import { createHash } from 'node:crypto';

export type BrainConfidentiality = 'PUBLIC' | 'INTERNAL' | 'CONFIDENTIAL' | 'TOP_SECRET';

export interface CompanyBrainRecord {
  id: string;
  tenantId: string;
  sourceType: 'MEETING' | 'LESSON' | 'DOCUMENT' | 'DECISION';
  sourceId: string;
  confidentiality: BrainConfidentiality;
  text: string;
  evidenceRefs: string[];
  createdAt: string;
  contentHash: string;
  searchable: boolean;
}

export class PersistentCompanyBrain {
  private readonly records = new Map<string, CompanyBrainRecord>();

  upsert(input: Omit<CompanyBrainRecord, 'id' | 'contentHash'>): { record: CompanyBrainRecord; duplicate: boolean } {
    const contentHash = createHash('sha256').update(`${input.tenantId}|${input.sourceType}|${input.sourceId}|${input.text}`).digest('hex');
    const id = `brain_${contentHash.slice(0, 24)}`;
    const existing = this.records.get(id);
    if (existing) return { record: existing, duplicate: true };
    const record: CompanyBrainRecord = { ...input, id, contentHash };
    this.records.set(id, record);
    return { record, duplicate: false };
  }

  list(tenantId: string): CompanyBrainRecord[] {
    return [...this.records.values()].filter(r => r.tenantId === tenantId);
  }

  exportSnapshot(tenantId: string): CompanyBrainRecord[] {
    return this.list(tenantId).map(r => ({ ...r }));
  }
}
