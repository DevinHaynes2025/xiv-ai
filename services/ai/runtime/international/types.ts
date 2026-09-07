export type InternationalCompanySourceState = 'NOT_CONFIGURED' | 'AUTHORIZED' | 'DEGRADED' | 'UNAVAILABLE';

export type InternationalCompanyVerificationState =
  | 'SUPPORTED'
  | 'PARTIALLY_SUPPORTED'
  | 'CONTRADICTED'
  | 'INSUFFICIENT_EVIDENCE'
  | 'STALE'
  | 'UNVERIFIED';

export type InternationalCompanyStance = 'FACT' | 'INFERENCE' | 'FORECAST';

export type InternationalCompanyQuery = {
  legalName?: string;
  lei?: string;
  registryId?: string;
  jurisdiction?: string;
  limit?: number;
};

export type InternationalCompanyProvenance = {
  provider: string;
  sourceId: string;
  sourceRecordId: string;
  retrievedAt: string;
  publisher: string;
  licenseType: string;
  usageRights: string;
  fabricated: false;
};

export type InternationalCompanyIdentity = {
  country: string;
  region: string | null;
  registry: string | null;
  registryId: string | null;
  companyNumber: string | null;
  lei: string | null;
  exchange: string | null;
  ticker: string | null;
  currency: string | null;
  language: string | null;
  legalName: string;
  tradingName: string | null;
  status: string | null;
  incorporationDate: string | null;
  industry: string | null;
  registeredAddress: string | null;
  source: string;
  retrievedAt: string;
};

export type InternationalCompanyOfficer = {
  name: string;
  role: string | null;
  source: string;
  retrievedAt: string;
};

export type InternationalCompanyFiling = {
  form: string;
  filingDate: string;
  source: string;
  sourceRecordId: string;
  retrievedAt: string;
  stance: 'FACT';
};

export type InternationalCompanyEvent = {
  eventType:
    | 'incorporation'
    | 'registration'
    | 'filing'
    | 'annual_report'
    | 'officer_change'
    | 'capital_event'
    | 'name_change'
    | 'registered_address_change'
    | 'exchange_event'
    | 'material_announcement'
    | 'public_procurement_event'
    | 'public_patent_event'
    | 'verified_company_milestone'
    | 'status_change';
  source: string;
  sourceTimestamp: string | null;
  retrievedAt: string;
  jurisdiction: string;
  evidence: string;
  verificationState: InternationalCompanyVerificationState;
};

export type InternationalCompanyFinancialFact = {
  metric: 'revenue' | 'net_income' | 'assets' | 'liabilities' | 'cash' | 'growth';
  period: string;
  value: number;
  currency: string;
  provider: string;
  sourceRecordId: string;
  retrievedAt: string;
  verificationState: InternationalCompanyVerificationState;
  stance: 'FACT';
};

export type InternationalCompanyRecord = {
  identity: InternationalCompanyIdentity;
  officers: readonly InternationalCompanyOfficer[];
  filings: readonly InternationalCompanyFiling[];
  events: readonly InternationalCompanyEvent[];
  facts: readonly InternationalCompanyFinancialFact[];
  provenance: InternationalCompanyProvenance;
  fabricated: false;
};

export type InternationalCompanyAdapterResult =
  | { allowed: true; fabricated: false; records: readonly InternationalCompanyRecord[] }
  | { allowed: false; reason: string };

export type CompanyGraphRelation =
  | 'REGISTERED_IN'
  | 'FILED'
  | 'HAS_EVENT'
  | 'HAS_SIGNAL'
  | 'OPERATES_IN'
  | 'HAS_SOURCE';

export type CompanyGraphEdge = {
  from: string;
  relation: CompanyGraphRelation;
  to: string;
  persisted: false;
};

export type WatchLabel =
  | 'WATCH'
  | 'EMERGING'
  | 'IMPROVING'
  | 'DETERIORATING'
  | 'HIGH_RISK'
  | 'REQUIRES_REVIEW'
  | 'CONFLICTING_EVIDENCE'
  | 'INSUFFICIENT_EVIDENCE';

export type CompanyWatchItem = {
  watchId: string;
  legalName: string;
  jurisdiction: string;
  reason: string;
  signal: WatchLabel;
  risk: WatchLabel;
  evidence: string;
  freshness: string;
  recommendation: null;
  guaranteedReturn: false;
};

export type InvitationPipelineStage =
  | 'discover'
  | 'verify_identity'
  | 'research_packet'
  | 'assess_relevance'
  | 'human_business_development_review'
  | 'invitation_candidate'
  | 'company_claims_profile'
  | 'business_verification'
  | 'universe_onboarding';
