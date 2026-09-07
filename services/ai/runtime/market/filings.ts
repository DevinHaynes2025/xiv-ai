/**
 * International filings + jurisdiction registry.
 * SEC remains the only proven filing/financial source.
 * GLEIF remains identity-only. Unproven registries stay NOT_CONFIGURED.
 */
import { companiesHouseSourceState, gleifAdapterCapabilityStatus } from '../international/status';
import { secAdapterCapabilityStatus } from '../sources/sec-status';
import { worldBankAdapterCapabilityStatus } from '../sources/world-bank-status';
import type { FilingCapability, InternationalFilingProviderStatus } from './types';

export type JurisdictionSourceDescriptor = {
  sourceId: string;
  country: string;
  jurisdiction: string;
  regulator: string | null;
  registry: string | null;
  exchange: string | null;
  officialUrl: string;
  sourceType: 'regulator' | 'registry' | 'exchange' | 'lei' | 'macro';
  authenticationRequired: boolean;
  licenseClass: string;
  rateLimitPolicy: 'bounded';
  availability: InternationalFilingProviderStatus;
  supportedCapabilities: readonly FilingCapability[];
};

export const JURISDICTION_SOURCE_DESCRIPTORS: readonly JurisdictionSourceDescriptor[] = [
  {
    sourceId: 'us_sec_edgar',
    country: 'US',
    jurisdiction: 'US',
    regulator: 'SEC',
    registry: 'EDGAR',
    exchange: null,
    officialUrl: 'https://www.sec.gov/edgar',
    sourceType: 'regulator',
    authenticationRequired: false,
    licenseClass: 'us_government_public',
    rateLimitPolicy: 'bounded',
    availability: 'AUTHORIZED',
    supportedCapabilities: ['IDENTITY', 'FILINGS', 'FINANCIALS', 'EVENTS'],
  },
  {
    sourceId: 'gleif_lei',
    country: 'GLOBAL',
    jurisdiction: 'GLOBAL',
    regulator: 'GLEIF',
    registry: 'LEI',
    exchange: null,
    officialUrl: 'https://www.gleif.org',
    sourceType: 'lei',
    authenticationRequired: false,
    licenseClass: 'public_lei_reference',
    rateLimitPolicy: 'bounded',
    availability: 'AUTHORIZED',
    supportedCapabilities: ['IDENTITY'],
  },
  {
    sourceId: 'world_bank_open_data',
    country: 'GLOBAL',
    jurisdiction: 'GLOBAL',
    regulator: null,
    registry: null,
    exchange: null,
    officialUrl: 'https://data.worldbank.org',
    sourceType: 'macro',
    authenticationRequired: false,
    licenseClass: 'CC-BY-4.0',
    rateLimitPolicy: 'bounded',
    availability: 'AUTHORIZED',
    supportedCapabilities: ['MACRO'],
  },
  {
    sourceId: 'uk_companies_house',
    country: 'GB',
    jurisdiction: 'GB',
    regulator: 'Companies House',
    registry: 'Companies House',
    exchange: null,
    officialUrl: 'https://developer.company-information.service.gov.uk',
    sourceType: 'registry',
    authenticationRequired: true,
    licenseClass: 'unknown',
    rateLimitPolicy: 'bounded',
    availability: 'NOT_CONFIGURED',
    supportedCapabilities: ['IDENTITY', 'FILINGS', 'OFFICERS'],
  },
  {
    sourceId: 'eu_business_register',
    country: 'EU',
    jurisdiction: 'EU',
    regulator: null,
    registry: 'BRIS',
    exchange: null,
    officialUrl: 'https://e-justice.europa.eu',
    sourceType: 'registry',
    authenticationRequired: true,
    licenseClass: 'unknown',
    rateLimitPolicy: 'bounded',
    availability: 'NOT_CONFIGURED',
    supportedCapabilities: ['IDENTITY', 'FILINGS'],
  },
  {
    sourceId: 'ca_sedar',
    country: 'CA',
    jurisdiction: 'CA',
    regulator: 'CSA',
    registry: 'SEDI/SEDAR+',
    exchange: null,
    officialUrl: 'https://www.sedarplus.ca',
    sourceType: 'regulator',
    authenticationRequired: true,
    licenseClass: 'unknown',
    rateLimitPolicy: 'bounded',
    availability: 'NOT_CONFIGURED',
    supportedCapabilities: ['FILINGS', 'FINANCIALS'],
  },
  {
    sourceId: 'au_asic',
    country: 'AU',
    jurisdiction: 'AU',
    regulator: 'ASIC',
    registry: 'ASIC',
    exchange: 'ASX',
    officialUrl: 'https://asic.gov.au',
    sourceType: 'regulator',
    authenticationRequired: true,
    licenseClass: 'unknown',
    rateLimitPolicy: 'bounded',
    availability: 'NOT_CONFIGURED',
    supportedCapabilities: ['IDENTITY', 'FILINGS'],
  },
  {
    sourceId: 'jp_edinet',
    country: 'JP',
    jurisdiction: 'JP',
    regulator: 'FSA',
    registry: 'EDINET',
    exchange: null,
    officialUrl: 'https://disclosure.edinet-fsa.go.jp',
    sourceType: 'regulator',
    authenticationRequired: true,
    licenseClass: 'unknown',
    rateLimitPolicy: 'bounded',
    availability: 'NOT_CONFIGURED',
    supportedCapabilities: ['FILINGS', 'FINANCIALS'],
  },
  {
    sourceId: 'sg_acra',
    country: 'SG',
    jurisdiction: 'SG',
    regulator: 'ACRA',
    registry: 'ACRA',
    exchange: 'SGX',
    officialUrl: 'https://www.acra.gov.sg',
    sourceType: 'registry',
    authenticationRequired: true,
    licenseClass: 'unknown',
    rateLimitPolicy: 'bounded',
    availability: 'NOT_CONFIGURED',
    supportedCapabilities: ['IDENTITY'],
  },
  {
    sourceId: 'in_mca',
    country: 'IN',
    jurisdiction: 'IN',
    regulator: 'MCA',
    registry: 'MCA21',
    exchange: null,
    officialUrl: 'https://www.mca.gov.in',
    sourceType: 'registry',
    authenticationRequired: true,
    licenseClass: 'unknown',
    rateLimitPolicy: 'bounded',
    availability: 'NOT_CONFIGURED',
    supportedCapabilities: ['IDENTITY', 'FILINGS'],
  },
  {
    sourceId: 'za_cipc',
    country: 'ZA',
    jurisdiction: 'ZA',
    regulator: 'CIPC',
    registry: 'CIPC',
    exchange: 'JSE',
    officialUrl: 'https://www.cipc.co.za',
    sourceType: 'registry',
    authenticationRequired: true,
    licenseClass: 'unknown',
    rateLimitPolicy: 'bounded',
    availability: 'NOT_CONFIGURED',
    supportedCapabilities: ['IDENTITY'],
  },
  {
    sourceId: 'ng_cac',
    country: 'NG',
    jurisdiction: 'NG',
    regulator: 'CAC',
    registry: 'CAC',
    exchange: 'NGX',
    officialUrl: 'https://www.cac.gov.ng',
    sourceType: 'registry',
    authenticationRequired: true,
    licenseClass: 'unknown',
    rateLimitPolicy: 'bounded',
    availability: 'NOT_CONFIGURED',
    supportedCapabilities: ['IDENTITY'],
  },
  {
    sourceId: 'br_cvm',
    country: 'BR',
    jurisdiction: 'BR',
    regulator: 'CVM',
    registry: 'CVM',
    exchange: 'B3',
    officialUrl: 'https://www.gov.br/cvm',
    sourceType: 'regulator',
    authenticationRequired: true,
    licenseClass: 'unknown',
    rateLimitPolicy: 'bounded',
    availability: 'NOT_CONFIGURED',
    supportedCapabilities: ['FILINGS', 'FINANCIALS'],
  },
  {
    sourceId: 'mx_bmv',
    country: 'MX',
    jurisdiction: 'MX',
    regulator: 'CNBV',
    registry: null,
    exchange: 'BMV',
    officialUrl: 'https://www.bmv.com.mx',
    sourceType: 'exchange',
    authenticationRequired: true,
    licenseClass: 'unknown',
    rateLimitPolicy: 'bounded',
    availability: 'NOT_CONFIGURED',
    supportedCapabilities: ['MARKET_DATA', 'FILINGS'],
  },
];

const UNPROVEN_FILING_IDS = JURISDICTION_SOURCE_DESCRIPTORS.filter((item) => item.availability === 'NOT_CONFIGURED').map(
  (item) => item.sourceId,
);

export function filingProviderStatus(sourceId: string): InternationalFilingProviderStatus {
  if (sourceId === 'us_sec_edgar') {
    return secAdapterCapabilityStatus() === 'LIVE' ? 'AUTHORIZED' : 'NOT_CONFIGURED';
  }
  if (sourceId === 'gleif_lei') {
    return gleifAdapterCapabilityStatus() === 'LIVE' ? 'AUTHORIZED' : 'NOT_CONFIGURED';
  }
  if (sourceId === 'world_bank_open_data') {
    return worldBankAdapterCapabilityStatus() === 'LIVE' ? 'AUTHORIZED' : 'NOT_CONFIGURED';
  }
  if (sourceId === 'uk_companies_house') return companiesHouseSourceState();
  const row = JURISDICTION_SOURCE_DESCRIPTORS.find((item) => item.sourceId === sourceId);
  return row?.availability ?? 'NOT_CONFIGURED';
}

export function provenLiveCapabilities(sourceId: string): readonly FilingCapability[] {
  if (sourceId === 'us_sec_edgar' && secAdapterCapabilityStatus() === 'LIVE') {
    return ['IDENTITY', 'FILINGS', 'FINANCIALS', 'EVENTS'];
  }
  if (sourceId === 'gleif_lei' && gleifAdapterCapabilityStatus() === 'LIVE') {
    return ['IDENTITY'];
  }
  if (sourceId === 'world_bank_open_data' && worldBankAdapterCapabilityStatus() === 'LIVE') {
    return ['MACRO'];
  }
  return [];
}

export function gleifRemainsIdentityOnly() {
  const live = provenLiveCapabilities('gleif_lei');
  return !live.includes('FILINGS') && !live.includes('FINANCIALS') && !live.includes('MARKET_DATA');
}

export function secRemainsFilingFinancialSource() {
  const live = provenLiveCapabilities('us_sec_edgar');
  return live.includes('FILINGS') && live.includes('FINANCIALS');
}

export function worldBankRemainsMacroSource() {
  const live = provenLiveCapabilities('world_bank_open_data');
  return live.includes('MACRO') && !live.includes('FILINGS');
}

export function unprovenInternationalFilingProvidersRemainNotConfigured() {
  return UNPROVEN_FILING_IDS.every((id) => filingProviderStatus(id) === 'NOT_CONFIGURED');
}

export function marketPriceFeedAvailable(sourceId = 'mx_bmv') {
  return provenLiveCapabilities(sourceId).includes('MARKET_DATA') === true
    ? { available: true as const }
    : { available: false as const, reason: 'Unsupported market-price feeds remain unavailable. No fake prices.' };
}

export function internationalFilingRegistry() {
  return JURISDICTION_SOURCE_DESCRIPTORS.map((item) => ({
    ...item,
    availability: filingProviderStatus(item.sourceId),
    provenCapabilities: provenLiveCapabilities(item.sourceId),
  }));
}
