import type { BusinessDataProviderDescriptor } from './types';

const BASE = {
  secretInClient: false as const,
  usesServiceRole: false as const,
  bulkScraping: false as const,
};

export const WORLD_BANK_DESCRIPTOR: BusinessDataProviderDescriptor = {
  ...BASE,
  providerId: 'world_bank_open_data',
  name: 'World Bank Open Data',
  status: 'authorized',
  capabilities: ['economic_data', 'employment', 'trade', 'industry_data'],
  authorization: {
    authorized: true,
    configured: true,
    provenanceEnabled: true,
    classificationKnown: true,
    usageRightsKnown: true,
  },
  license: {
    licenseType: 'CC-BY-4.0',
    usageRights: 'Public open data. Attribution required. Not XIV-originated statistics.',
    known: true,
  },
  regions: [{ region: 'global', residencyNote: null }],
  classification: 'public',
};

export const SEC_EDGAR_DESCRIPTOR: BusinessDataProviderDescriptor = {
  ...BASE,
  providerId: 'us_sec_edgar',
  name: 'U.S. SEC EDGAR',
  status: 'authorized',
  capabilities: ['public_filings', 'financial_statements', 'corporate_events', 'company_registry'],
  authorization: {
    authorized: true,
    configured: true,
    provenanceEnabled: true,
    classificationKnown: true,
    usageRightsKnown: true,
  },
  license: {
    licenseType: 'us_government_public',
    usageRights: 'Public EDGAR. User-Agent required. Bounded retrieval only. Not a bulk archive ingest.',
    known: true,
  },
  regions: [{ region: 'US', residencyNote: null }],
  classification: 'public',
};

export const BLS_DESCRIPTOR: BusinessDataProviderDescriptor = {
  ...BASE,
  providerId: 'us_bls',
  name: 'U.S. Bureau of Labor Statistics',
  status: 'not_configured',
  capabilities: ['employment', 'inflation', 'economic_data'],
  authorization: {
    authorized: false,
    configured: false,
    provenanceEnabled: true,
    classificationKnown: true,
    usageRightsKnown: false,
  },
  license: { licenseType: 'unknown', usageRights: 'API key required. Not configured.', known: false },
  regions: [{ region: 'US', residencyNote: null }],
  classification: 'unknown',
};

export const FRED_DESCRIPTOR: BusinessDataProviderDescriptor = {
  ...BASE,
  providerId: 'us_fred',
  name: 'Federal Reserve FRED-style macro data',
  status: 'not_configured',
  capabilities: ['interest_rates', 'inflation', 'economic_data', 'employment'],
  authorization: {
    authorized: false,
    configured: false,
    provenanceEnabled: true,
    classificationKnown: true,
    usageRightsKnown: false,
  },
  license: { licenseType: 'unknown', usageRights: 'API key required. Not configured.', known: false },
  regions: [{ region: 'US', residencyNote: null }],
  classification: 'unknown',
};

export const CENSUS_DESCRIPTOR: BusinessDataProviderDescriptor = {
  ...BASE,
  providerId: 'us_census',
  name: 'U.S. Census public business/economic data',
  status: 'not_configured',
  capabilities: ['economic_data', 'industry_data', 'trade'],
  authorization: {
    authorized: false,
    configured: false,
    provenanceEnabled: true,
    classificationKnown: true,
    usageRightsKnown: false,
  },
  license: { licenseType: 'unknown', usageRights: 'Key/terms required. Not configured.', known: false },
  regions: [{ region: 'US', residencyNote: null }],
  classification: 'unknown',
};

export const DECLARED_BUSINESS_DATA_PROVIDERS = [
  WORLD_BANK_DESCRIPTOR,
  SEC_EDGAR_DESCRIPTOR,
  BLS_DESCRIPTOR,
  FRED_DESCRIPTOR,
  CENSUS_DESCRIPTOR,
] as const;
