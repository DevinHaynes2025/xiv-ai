import type { ForesightReport, ForesightStance } from './types';

export type ForesightClaimKind = 'observed' | 'inferred' | 'hypothesized' | 'forecast' | 'recommended';

export type ForesightQuery = {
  question: string;
  organizationId: string | null;
  universeId: string | null;
};

export type HistoricalSimilarity = {
  queryId: string;
  comparableCount: number;
  stance: 'inferred';
};

export type ComparableCompanyPattern = {
  patternId: string;
  summary: string;
  stance: 'inferred';
};

export type RiskSignal = {
  signalId: string;
  label: string;
  stance: ForesightClaimKind;
  evidenceRefs: readonly string[];
  confidence: 'low' | 'medium' | 'high' | 'unknown';
};

export type OpportunitySignal = {
  signalId: string;
  label: string;
  stance: ForesightClaimKind;
  evidenceRefs: readonly string[];
  confidence: 'low' | 'medium' | 'high' | 'unknown';
};

export type ScenarioAssumption = {
  assumptionId: string;
  statement: string;
};

export type ScenarioEvidence = {
  evidenceId: string;
  summary: string;
};

export type ForecastRange = {
  low: number | null;
  high: number | null;
  unit: string | null;
  certainty: false;
};

export type ForecastConfidence = {
  level: 'low' | 'medium' | 'high' | 'unknown';
  evidenceRequired: true;
};

export type ForesightRecommendation = {
  recommendationId: string;
  statement: string;
  stance: 'recommended';
  evidenceRefs: readonly string[];
  confidence: ForecastConfidence;
};

export type ForesightProvider = {
  status: 'not_configured';
  kind: 'prototype';
  predict(query: ForesightQuery): never;
};

export function createForesightProvider(): ForesightProvider {
  return {
    status: 'not_configured',
    kind: 'prototype',
    predict(): never {
      throw new Error('ForesightProvider is not configured. No production predictions.');
    },
  };
}

export function forecastRequiresEvidence(input: {
  evidenceRefs: readonly string[];
  confidence?: ForecastConfidence['level'];
}) {
  if (input.evidenceRefs.length === 0 || !input.confidence) {
    return { allowed: false as const, reason: 'Forecasts require evidence and confidence metadata.' };
  }
  return {
    allowed: true as const,
    certainty: false as const,
    stance: 'forecast' as const,
  };
}

export function foresightIsCertain() {
  return false;
}

export function productionForesightEnabled() {
  return false;
}

export type { ForesightReport, ForesightStance };
