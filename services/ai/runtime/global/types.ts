export type AfricanSubregion = 'north_africa' | 'west_africa' | 'central_africa' | 'east_africa' | 'southern_africa';

export type WorldRegion =
  | 'africa'
  | 'asia'
  | 'europe'
  | 'north_america'
  | 'south_america'
  | 'middle_east'
  | 'oceania';

export type DataAvailability = 'available' | 'limited' | 'not_configured' | 'unavailable';

export type CountryBusinessProfile = {
  countryCode: string;
  countryName: string;
  region: WorldRegion;
  africanSubregion?: AfricanSubregion;
  languages: readonly string[];
  currencies: readonly string[];
  timeZones: readonly string[];
  keyIndustries: readonly string[];
  tradeConnections: readonly string[];
  businessSignals: readonly string[];
  logisticsInfrastructure: readonly string[];
  regulatorySourceLinks: readonly string[];
  dataFreshness: 'unknown' | 'not_configured';
  dataAvailability: DataAvailability;
};

export type RegionalBusinessProfile = {
  regionId: string;
  region: WorldRegion;
  africanSubregion?: AfricanSubregion;
  countryCodes: readonly string[];
  discoveryOnly: true;
  sharedLegalRegime: false;
};

export type TradeCorridor = {
  corridorId: string;
  fromCountry: string;
  toCountry: string;
  status: 'not_configured';
  statistics: null;
};

export type BusinessOpportunity = {
  opportunityId: string;
  countryCode: string;
  status: 'not_configured';
  fabricated: false;
};

export type LocalIndustrySignal = {
  countryCode: string;
  industry: string;
  status: 'not_configured';
  value: null;
};

export type CountryRiskSignal = {
  countryCode: string;
  status: 'not_configured';
  score: 'not_measured';
};

export type MarketEntryCase = {
  caseId: string;
  countryCode: string;
  status: 'prototype' | 'hypothetical' | 'not_configured';
};

export type CapabilityStatus =
  | 'available'
  | 'limited'
  | 'not_configured'
  | 'requires_local_partner'
  | 'requires_legal_review';

export type DeploymentCapability = {
  regionId: string;
  regionAvailability: CapabilityStatus;
  dataResidencyRequirement: CapabilityStatus;
  providerAvailability: CapabilityStatus;
  modelAvailability: CapabilityStatus;
  storageAvailability: CapabilityStatus;
  integrationAvailability: CapabilityStatus;
  complianceReviewRequired: boolean;
  deployed: false;
};

export type TranslationSurface =
  | 'ui'
  | 'business_content'
  | 'live_transcript'
  | 'agent_output'
  | 'business_documentation';

export type TranslationStatus = 'implemented' | 'prototype' | 'not_configured';

export type TranslationRequest = {
  surface: TranslationSurface;
  sourceLocale: string;
  targetLocale: string;
  certifiedLegalTranslation: false;
  status: TranslationStatus;
};
