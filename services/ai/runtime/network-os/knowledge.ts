/**
 * Historical knowledge library + classification engine + knowledge pipeline.
 * Sources require license/provenance. Classification cannot discard provenance.
 */
export const HISTORICAL_KNOWLEDGE_CATEGORIES = [
  'company_history',
  'financial_statements',
  'bankruptcies',
  'business_failures',
  'successful_companies',
  'economic_cycles',
  'industry_evolution',
  'product_launches',
  'ma',
  'ipos',
  'interest_rates',
  'inflation',
  'employment',
  'trade',
  'supply_chain',
  'technology_shifts',
  'retail',
  'real_estate',
  'manufacturing',
  'patents',
  'public_filings',
  'public_procurement',
  'licensed_business_journalism_metadata',
] as const;

export const BUSINESS_DATA_CATEGORIES = [
  'Finance',
  'Sales',
  'Marketing',
  'Operations',
  'Supply Chain',
  'Inventory',
  'Procurement',
  'Customer',
  'Workforce',
  'Technology',
  'Security',
  'Markets',
  'Economics',
  'Real Estate',
  'Insurance',
  'Manufacturing',
  'Logistics',
  'Innovation',
] as const;

export const KNOWLEDGE_PIPELINE = [
  'source',
  'authorization',
  'provenance',
  'validation',
  'classification',
  'normalization',
  'entity_resolution',
  'event_ledger',
  'knowledge_graph',
  'vector_search_index',
  'company_or_global_brain',
  'ai_agents',
  'story_engine',
  'foresight',
  'human_decision',
  'outcome',
  'learning',
] as const;

export type HistoricalKnowledgeCategory = (typeof HISTORICAL_KNOWLEDGE_CATEGORIES)[number];
export type BusinessDataCategory = (typeof BUSINESS_DATA_CATEGORIES)[number];
export type KnowledgePipelineStage = (typeof KNOWLEDGE_PIPELINE)[number];

export type BusinessDataSubcategory = { category: BusinessDataCategory; subcategory: string };
export type BusinessTopic = { topicId: string; label: string };
export type IndustryClassification = { code: string; label: string };
export type BusinessFunctionClassification = { function: BusinessDataCategory };
export type DataRelationship = { fromId: string; relation: string; toId: string; sourceRecordId: string };
export type DataEntity = { entityId: string; name: string; sourceRecordId: string };
export type DataFact = { factId: string; statement: string; sourceRecordId: string; stance: 'observed' };
export type DataEvidence = { evidenceId: string; sourceId: string; sourceRecordId: string };
export type DataTimeline = { entityId: string; events: readonly string[] };
export type DataStory = { storyId: string; title: string; evidenceIds: readonly string[] };

export type HistoricalKnowledgeRecord = {
  category: HistoricalKnowledgeCategory;
  source: string;
  publisher: string;
  licenseType: string;
  usageRights: string;
  originalDate: string;
  retrievedAt: string;
  classification: string;
  country: string | null;
  industry: string | null;
  entityId: string | null;
  sourceRecordId: string;
  reliability: 'unknown' | 'low' | 'medium' | 'high';
};

export function unknownHistoricalLicenseDenied(licenseType: string | null | undefined) {
  if (!licenseType || licenseType === 'unknown') {
    return { allowed: false as const, reason: 'Unknown historical license denied.' };
  }
  return { allowed: true as const };
}

export function classifyBusinessData(input: {
  category: BusinessDataCategory;
  sourceRecordId: string;
  provenancePresent: boolean;
}):
  | { category: BusinessDataCategory; sourceRecordId: string; provenanceDiscarded: false }
  | { allowed: false; reason: string } {
  if (!input.provenancePresent || !input.sourceRecordId) {
    return { allowed: false, reason: 'AI classification cannot discard source provenance.' };
  }
  return { category: input.category, sourceRecordId: input.sourceRecordId, provenanceDiscarded: false };
}

export function knowledgePipelineStages() {
  return KNOWLEDGE_PIPELINE;
}

export function indiscriminateHistoricalScrapingEnabled() {
  return false;
}
