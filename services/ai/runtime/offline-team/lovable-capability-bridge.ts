export interface ExternalAICapabilityReceipt {
  provider: 'LOVABLE';
  connected: boolean;
  projectId?: string;
  visibility: 'PRIVATE' | 'UNKNOWN';
  approvedUses: string[];
  forbiddenUses: string[];
  evidenceRefs: string[];
}

export const LOVABLE_XIV_RECEIPT: ExternalAICapabilityReceipt = {
  provider: 'LOVABLE',
  connected: true,
  projectId: 'd1a31e31-3594-4cc2-8554-8809b1daa20c',
  visibility: 'PRIVATE',
  approvedUses: [
    'UX prototyping',
    'responsive web/mobile experience design',
    'full-stack TypeScript prototyping',
    'synthetic-data UI workflows',
  ],
  forbiddenUses: [
    'TOP_SECRET data ingestion',
    'production secret storage',
    'autonomous production deployment',
    'cross-tenant data access',
  ],
  evidenceRefs: ['LOVABLE:CONNECTED', 'LOVABLE:PROJECT:d1a31e31-3594-4cc2-8554-8809b1daa20c'],
};

export function canUseLovable(confidentiality: 'PUBLIC' | 'INTERNAL' | 'CONFIDENTIAL' | 'TOP_SECRET'): boolean {
  return LOVABLE_XIV_RECEIPT.connected && confidentiality !== 'TOP_SECRET';
}
