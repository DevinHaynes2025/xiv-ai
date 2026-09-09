export type BusinessDataProviderStatus =
  | 'not_configured'
  | 'configured'
  | 'authorized'
  | 'degraded'
  | 'unavailable'
  | 'disabled';

export type BusinessDataProviderCapability =
  | 'company_registry'
  | 'public_filings'
  | 'financial_statements'
  | 'bankruptcy'
  | 'corporate_events'
  | 'economic_data'
  | 'interest_rates'
  | 'inflation'
  | 'employment'
  | 'trade'
  | 'supply_chain'
  | 'shipping'
  | 'commodity_prices'
  | 'market_data'
  | 'patents'
  | 'industry_data'
  | 'business_news_metadata'
  | 'real_estate'
  | 'public_procurement';

export type BusinessDataProviderRegion = {
  region: string;
  residencyNote: string | null;
};

export type BusinessDataProviderLicense = {
  licenseType: string;
  usageRights: string;
  known: boolean;
};

export type BusinessDataProviderAuthorization = {
  authorized: boolean;
  configured: boolean;
  provenanceEnabled: boolean;
  classificationKnown: boolean;
  usageRightsKnown: boolean;
};

export type BusinessDataProviderHealth = {
  status: BusinessDataProviderStatus;
  lastCheckedAt: string | null;
  reason: string;
};

export type BusinessDataProviderAuditEvent = {
  eventId: string;
  providerId: string;
  action: 'register' | 'deny_ingest' | 'allow_ingest' | 'fetch';
  reason: string;
  createdAt: string;
  secretsLogged: false;
};

export type BusinessDataProviderDescriptor = {
  providerId: string;
  name: string;
  status: BusinessDataProviderStatus;
  capabilities: readonly BusinessDataProviderCapability[];
  authorization: BusinessDataProviderAuthorization;
  license: BusinessDataProviderLicense;
  regions: readonly BusinessDataProviderRegion[];
  classification: 'public' | 'licensed' | 'unknown';
  secretInClient: false;
  usesServiceRole: false;
  bulkScraping: false;
};

export type BusinessDataProvider = BusinessDataProviderDescriptor;

export const GLOBAL_BRAIN_ALLOWED_CATEGORIES = [
  'public',
  'licensed',
  'anonymized_aggregate',
  'explicitly_shared',
  'authorized_public_partner',
] as const;

export type GlobalBrainAllowedCategory = (typeof GLOBAL_BRAIN_ALLOWED_CATEGORIES)[number];

export const GLOBAL_BRAIN_DENIED_CATEGORIES = [
  'private_company',
  'personal',
  'secret',
  'restricted',
  'unknown_license',
  'unknown_provenance',
] as const;
