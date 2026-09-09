import { createOptimizationProvider, quantumProcessingActive } from '../compute';
import type { ForecastComputeProvider, TemporalStance } from './types';

export type ForecastScenario = {
  scenarioId: string;
  statement: string;
  stance: Extract<TemporalStance, 'SCENARIO' | 'FORECAST' | 'SPECULATION'>;
  probability?: number;
  modelId?: string;
  evidenceCount: number;
  certainty: false;
};

export type HistoricalAnalogue = {
  analogueId: string;
  similarities: readonly string[];
  differences: readonly string[];
  becomesForecastFact: false;
};

export function createHistoricalAnalogue(input: {
  similarities: readonly string[];
  differences: readonly string[];
}): HistoricalAnalogue {
  return {
    analogueId: 'analogue:trade-disruption',
    similarities: input.similarities,
    differences: input.differences,
    becomesForecastFact: false,
  };
}

export function historicalAnalogyBecomesForecastFact(analogue: HistoricalAnalogue): boolean {
  return analogue.becomesForecastFact;
}

export function createForecastScenario(input: {
  statement: string;
  stance: ForecastScenario['stance'];
  probability?: number;
  modelId?: string;
  evidenceCount?: number;
}): ForecastScenario | { allowed: false; reason: string } {
  if (input.probability !== undefined && (!input.modelId || (input.evidenceCount ?? 0) < 1)) {
    return { allowed: false, reason: 'probability_requires_model_and_evidence' };
  }
  return {
    scenarioId: `forecast:${input.stance}`,
    statement: input.statement,
    stance: input.stance,
    probability: input.probability,
    modelId: input.modelId,
    evidenceCount: input.evidenceCount ?? 0,
    certainty: false,
  };
}

export function forecastIsFact(scenario: ForecastScenario): boolean {
  void scenario;
  return false;
}

export function scenarioClaimsCertainty(scenario: ForecastScenario): boolean {
  return scenario.certainty;
}

export function quantumForecastProviderStatus(): 'NOT_CONFIGURED' {
  const provider = createOptimizationProvider('future_quantum');
  void provider;
  return quantumProcessingActive() ? 'NOT_CONFIGURED' : 'NOT_CONFIGURED';
}

export function forecastComputeProvider(kind: ForecastComputeProvider): {
  kind: ForecastComputeProvider;
  status: 'interface' | 'NOT_CONFIGURED';
  quantumLive: false;
} {
  if (kind === 'QUANTUM_FUTURE' || kind === 'NVIDIA') {
    return { kind, status: 'NOT_CONFIGURED', quantumLive: false };
  }
  return { kind, status: 'interface', quantumLive: false };
}

export type SimulationKind =
  | 'MonteCarloSimulation'
  | 'AgentBasedSimulation'
  | 'SupplyChainSimulation'
  | 'MarketScenarioSimulation'
  | 'EconomicScenarioSimulation'
  | 'NetworkDisruptionSimulation';

export function runSimulation(kind: SimulationKind): { kind: SimulationKind; output: 'SCENARIO'; fact: false } {
  return { kind, output: 'SCENARIO', fact: false };
}

export function trillionDocumentCapacityProven(): false {
  return false;
}

export const TEMPORAL_SCALE_LAYERS = [
  'document_registry',
  'object_storage',
  'search_index',
  'vector_index',
  'graph_relationships',
  'event_streaming',
  'distributed_processing',
  'deduplication',
  'content_fingerprints',
  'language_indexes',
  'temporal_partitions',
  'geospatial_partitions',
] as const;
