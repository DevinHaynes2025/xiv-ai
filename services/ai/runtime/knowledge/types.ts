export type ResearchProviderStatus = 'NOT_CONFIGURED' | 'AUTHORIZED' | 'LIVE' | 'DEGRADED' | 'UNAVAILABLE';

export type ResearchProviderType =
  | 'SEARCH'
  | 'ENCYCLOPEDIA'
  | 'GOVERNMENT'
  | 'REGULATOR'
  | 'LIBRARY'
  | 'ARCHIVE'
  | 'NEWS'
  | 'ACADEMIC'
  | 'PATENT'
  | 'PROCUREMENT'
  | 'TRADE'
  | 'COMPANY'
  | 'LICENSED_DATA';

export type ArticlePublishState =
  | 'DISCOVERED'
  | 'INGESTED'
  | 'DEDUPLICATED'
  | 'VERIFIED'
  | 'CONTRADICTED'
  | 'AI_GENERATED_DRAFT'
  | 'EDITORIAL_REVIEW'
  | 'APPROVED'
  | 'PUBLISHED'
  | 'UPDATED'
  | 'RETRACTED';

export type PassportEvidenceClass =
  | 'VERIFIED'
  | 'SUPPLIER_REPORTED'
  | 'CARRIER_REPORTED'
  | 'SELLER_REPORTED'
  | 'PUBLIC_SOURCE'
  | 'INFERRED'
  | 'UNKNOWN';

export type ProductJourneyStage =
  | 'RAW_MATERIAL'
  | 'COMPONENT'
  | 'MANUFACTURING'
  | 'PACKAGING'
  | 'WAREHOUSE'
  | 'FREIGHT'
  | 'PORT'
  | 'CUSTOMS'
  | 'DISTRIBUTION'
  | 'STORE'
  | 'FULFILLMENT'
  | 'LAST_MILE'
  | 'DELIVERY'
  | 'RETURN'
  | 'RECYCLE';

export type AgentFoundryState =
  | 'PROPOSED'
  | 'DESIGNED'
  | 'SANDBOXED'
  | 'EVALUATING'
  | 'SECURITY_REVIEW'
  | 'HUMAN_APPROVAL'
  | 'APPROVED'
  | 'DEPLOYED'
  | 'SUSPENDED'
  | 'RETIRED';

export type KnowledgeLoopStep =
  | 'OBSERVE'
  | 'INGEST'
  | 'NORMALIZE'
  | 'VERIFY'
  | 'UNDERSTAND'
  | 'CONNECT'
  | 'PREDICT'
  | 'RECOMMEND'
  | 'DECIDE'
  | 'ACT'
  | 'MEASURE'
  | 'LEARN';

export type AiBoardId =
  | 'EXECUTIVE'
  | 'CYBERSECURITY'
  | 'SUPPLY_CHAIN'
  | 'FINANCIAL_INTELLIGENCE'
  | 'INNOVATION'
  | 'RISK'
  | 'GLOBAL_EXPANSION'
  | 'CUSTOMER';

export type LogisticsIntegratorId =
  | 'amazon_shipping'
  | 'uber_direct'
  | 'lyft'
  | 'ups'
  | 'fedex'
  | 'usps'
  | 'dhl'
  | 'maersk';

export type ResearchProvider = {
  providerId: string;
  type: ResearchProviderType;
  officialUrl: string;
  licenseClass: string;
  status: ResearchProviderStatus;
  scrapingAllowed: false;
};

export type ResearchEvidence = {
  source: string;
  retrievedAt: string;
  license: string;
  reference: string;
};

export type ArticleSummary = {
  whatHappened: string;
  whyItMatters: string;
  whoIsAffected: string;
  supplyChainImpact: string;
  marketImpact: string;
  localImpact: string;
  evidence: ResearchEvidence;
  confidence: 'low' | 'medium' | 'high' | 'unknown';
  whatToWatch: string;
  copyrightedExcerpt: false;
  publishState: ArticlePublishState;
};
