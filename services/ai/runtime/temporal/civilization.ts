import type { AtlasLevel, TemporalPeriod } from './types';

export type CivilizationEntityKind =
  | 'Civilization'
  | 'Culture'
  | 'Kingdom'
  | 'Empire'
  | 'State'
  | 'City'
  | 'Port'
  | 'TradeRoute'
  | 'Market'
  | 'Merchant'
  | 'Guild'
  | 'Workshop'
  | 'Farm'
  | 'Mine'
  | 'Commodity'
  | 'Currency'
  | 'Contract'
  | 'TaxSystem'
  | 'FinancialInstitution'
  | 'Technology'
  | 'BusinessPractice';

export type HistoricalPersonRole =
  | 'Philosopher'
  | 'Merchant'
  | 'Inventor'
  | 'Engineer'
  | 'Scientist'
  | 'Economist'
  | 'Entrepreneur'
  | 'Organizer'
  | 'Writer'
  | 'Navigator'
  | 'Industrialist'
  | 'Thinker';

export const GLOBAL_THINKER_REGIONS = [
  'Africa',
  'Asia',
  'Europe',
  'Middle East',
  'Oceania',
  'North America',
  'South America',
  'Indigenous societies',
  'Diasporas',
] as const;

export type HistoricalPerson = {
  personId: string;
  name: string;
  role: HistoricalPersonRole;
  region: (typeof GLOBAL_THINKER_REGIONS)[number];
  period: TemporalPeriod;
  rankedByIdentity: false;
};

export function createThinker(input: {
  name: string;
  role: HistoricalPersonRole;
  region: HistoricalPerson['region'];
  period: TemporalPeriod;
}): HistoricalPerson {
  return {
    personId: `thinker:${input.region}:${input.name}`,
    name: input.name,
    role: input.role,
    region: input.region,
    period: input.period,
    rankedByIdentity: false,
  };
}

export type AtlasRecord = {
  level: AtlasLevel;
  place: string;
  year: number;
  industry: string | null;
  evidenceRequired: true;
};

export function atlasRecord(input: { level: AtlasLevel; place: string; year: number; industry?: string | null }): AtlasRecord {
  return {
    level: input.level,
    place: input.place,
    year: input.year,
    industry: input.industry ?? null,
    evidenceRequired: true,
  };
}

export type HistoricalSupplyChain = {
  commodity: string;
  hops: readonly string[];
  comparableToModern: true;
  guaranteedRepeat: false;
};

export function historicalSupplyChain(commodity: string, hops: readonly string[]): HistoricalSupplyChain {
  return { commodity, hops, comparableToModern: true, guaranteedRepeat: false };
}
