import { COUNTRY_PROFILES } from './countries';
import type { AfricanSubregion, RegionalBusinessProfile, WorldRegion } from './types';

export const WORLD_REGIONS: readonly WorldRegion[] = [
  'africa',
  'asia',
  'europe',
  'north_america',
  'south_america',
  'middle_east',
  'oceania',
];

export const AFRICAN_SUBREGIONS: readonly AfricanSubregion[] = [
  'north_africa',
  'west_africa',
  'central_africa',
  'east_africa',
  'southern_africa',
];

export const AFRICA_DISCOVERY_EXPERIENCES = [
  'africa_business_hub',
  'african_supply_chain_network',
  'african_startup_network',
  'africa_manufacturing',
  'africa_logistics',
  'africa_agriculture',
  'africa_energy',
  'africa_fintech',
  'africa_healthcare',
  'africa_trade',
] as const;

export function regionalProfile(region: WorldRegion, africanSubregion?: AfricanSubregion): RegionalBusinessProfile {
  const countryCodes = COUNTRY_PROFILES.filter((item) =>
    africanSubregion ? item.africanSubregion === africanSubregion : item.region === region,
  ).map((item) => item.countryCode);
  return {
    regionId: africanSubregion ?? region,
    region,
    africanSubregion,
    countryCodes,
    discoveryOnly: true,
    sharedLegalRegime: false,
  };
}

export function africaIsNotOneMarket() {
  return {
    oneMarket: false,
    countryLevelAuthoritative: true,
    regionalGrouping: 'discovery_and_intelligence_only' as const,
    sharedRulesForEveryCountry: false,
  };
}

export function africaDiscoveryModel() {
  return {
    experiences: AFRICA_DISCOVERY_EXPERIENCES,
    screensBuilt: ['africa_landing'] as const,
    status: 'prototype' as const,
  };
}
