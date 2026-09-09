import { createId } from '../actions';
import type { ForesightReport, ForesightSignal, Scenario } from './types';

export function projectScenario(input: {
  question: string;
  assumptions?: readonly string[];
  knownData?: readonly string[];
  missingData?: readonly string[];
  dependencies?: readonly string[];
}): Scenario {
  return {
    scenarioId: createId('scn'),
    question: input.question,
    assumptions: input.assumptions ?? ['Authorized evidence only. No invented ERP rows.'],
    knownData: input.knownData ?? [],
    missingData: input.missingData ?? ['Live operational measurements are not connected.'],
    estimatedDirection: 'unclear',
    confidence: 'low',
    dependencies: input.dependencies ?? [],
    unsupportedClaims: ['Financial impact is not estimated because no authorized cost source exists.'],
    financialImpactInvented: false,
    stance: 'projected',
  };
}

export function buildForesightReport(signals: readonly ForesightSignal[] = []): ForesightReport {
  return {
    signals,
    scenarios: [],
    indicators: [],
    risks: [],
    opportunities: [],
    prototype: true,
  };
}

export function stanceIsNotFact(stance: ForesightSignal['stance']) {
  return stance !== 'observed';
}

export function hypothesizedRemainsHypothesized(stance: ForesightSignal['stance']) {
  return stance === 'hypothesized';
}
