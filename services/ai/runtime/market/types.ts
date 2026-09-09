export type InternationalFilingProviderStatus = 'NOT_CONFIGURED' | 'AUTHORIZED' | 'DEGRADED' | 'UNAVAILABLE';

export type FilingCapability =
  | 'IDENTITY'
  | 'FILINGS'
  | 'FINANCIALS'
  | 'OFFICERS'
  | 'OWNERSHIP'
  | 'MARKET_DATA'
  | 'EVENTS'
  | 'PROCUREMENT'
  | 'PATENTS'
  | 'MACRO';

export type InternationalFilingQuery = {
  providerId: string;
  jurisdiction?: string;
  companyNumber?: string;
  cik?: string;
  lei?: string;
};

export type InternationalFilingProvenance = {
  provider: string;
  sourceId: string;
  sourceRecordId: string;
  retrievedAt: string;
  fabricated: false;
};

export type InternationalFilingRecord = {
  form: string;
  filingDate: string;
  jurisdiction: string;
  provenance: InternationalFilingProvenance;
  stance: 'FACT';
};

export type InternationalFilingDocument = {
  documentId: string;
  title: string;
  unavailable: true;
};

export type InternationalFilingFact = {
  metric: string;
  period: string;
  value: number;
  currency: string;
  provenance: InternationalFilingProvenance;
  stance: 'FACT';
};

export type GlobalEventType =
  | 'INCORPORATION'
  | 'FILING'
  | 'ANNUAL_REPORT'
  | 'FINANCIAL_UPDATE'
  | 'OFFICER_CHANGE'
  | 'OWNERSHIP_CHANGE'
  | 'CAPITAL_EVENT'
  | 'LISTING_EVENT'
  | 'PARTNERSHIP'
  | 'PRODUCT_EVENT'
  | 'PATENT_EVENT'
  | 'PROCUREMENT_EVENT'
  | 'REGULATORY_EVENT'
  | 'STATUS_CHANGE'
  | 'OTHER';

export type ResearchState =
  | 'WATCH'
  | 'EMERGING'
  | 'IMPROVING'
  | 'DETERIORATING'
  | 'HIGH_RISK'
  | 'REQUIRES_REVIEW'
  | 'CONFLICTING_EVIDENCE'
  | 'INSUFFICIENT_EVIDENCE';

export type OpportunityCategory =
  | 'STARTUP'
  | 'SMALL_CAP'
  | 'MICRO_CAP'
  | 'PRIVATE_COMPANY'
  | 'PUBLIC_COMPANY'
  | 'MANUFACTURER'
  | 'SUPPLY_CHAIN'
  | 'TECHNOLOGY'
  | 'HEALTHCARE'
  | 'FINTECH'
  | 'CLIMATE'
  | 'INDUSTRIAL'
  | 'OTHER';

export type StartupStage = 'IDEA' | 'PRE_SEED' | 'SEED' | 'EARLY' | 'GROWTH' | 'LATE' | 'UNKNOWN';

export type StoryClaimLabel = 'FACT' | 'FOUNDER_CLAIM' | 'INFERENCE' | 'FORECAST' | 'OPINION';

export type FreshnessState =
  | 'LIVE'
  | 'RECENT'
  | 'STALE'
  | 'HISTORICAL'
  | 'INFERENCE'
  | 'FORECAST'
  | 'NOT_CONFIGURED'
  | 'UNAVAILABLE';

export type InvitationStatus =
  | 'DISCOVERED'
  | 'VERIFIED'
  | 'RESEARCHED'
  | 'REVIEW_REQUIRED'
  | 'APPROVED_FOR_OUTREACH'
  | 'CONTACTED'
  | 'CLAIM_PENDING'
  | 'CLAIMED'
  | 'REJECTED';

export type ProfileContentClass = 'OFFICIAL_COMPANY_CONTENT' | 'PUBLIC_SOURCE_CONTENT' | 'XIV_RESEARCH' | 'COMMUNITY_CONTENT';

export type CompanyResearchAgentRole =
  | 'Discovery'
  | 'Identity'
  | 'Filings'
  | 'Financial'
  | 'Risk'
  | 'Macro'
  | 'Industry'
  | 'Startup'
  | 'News/Event'
  | 'Contradiction'
  | 'Verification'
  | 'Provenance'
  | 'Story'
  | 'Opportunity';
