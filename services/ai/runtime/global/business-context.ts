import { unavailableCountryData } from './countries';
import type { BusinessOpportunity, CountryRiskSignal, LocalIndustrySignal, MarketEntryCase } from './types';

export function localIndustrySignal(countryCode: string, industry: string): LocalIndustrySignal {
  return { countryCode, industry, status: 'not_configured', value: null };
}

export function countryRiskSignal(countryCode: string): CountryRiskSignal {
  return { countryCode, status: 'not_configured', score: 'not_measured' };
}

export function businessOpportunity(countryCode: string): BusinessOpportunity {
  return {
    opportunityId: `opp_${countryCode.toLowerCase()}`,
    countryCode,
    status: 'not_configured',
    fabricated: false,
  };
}

export function marketEntryCase(countryCode: string): MarketEntryCase {
  return {
    caseId: `mec_${countryCode.toLowerCase()}`,
    countryCode,
    status: 'not_configured',
  };
}

export function countryContextPack(countryCode: string) {
  return {
    country: unavailableCountryData(countryCode),
    industrySignals: [] as const,
    risk: countryRiskSignal(countryCode),
    opportunity: businessOpportunity(countryCode),
    marketEntry: marketEntryCase(countryCode),
    inventedStatistics: false,
  };
}
