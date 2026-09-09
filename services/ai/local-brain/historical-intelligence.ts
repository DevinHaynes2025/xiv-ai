import { learnAcrossIndustries } from './historical-industry-learning';

export async function runCrossIndustryHistoricalIntelligence(input: {
  tenantId: string;
  universeId: string;
  question: string;
  needsExternalFreshness?: boolean;
  root?: string;
}) {
  const lesson = await learnAcrossIndustries(input);
  return {
    ...lesson,
    cell: 'cross_industry_historical_intelligence' as const,
    inventedFacts: false as const,
    productionAuthorization: false as const,
  };
}
