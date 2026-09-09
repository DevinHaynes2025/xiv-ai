import type { TwinStance } from './command-types';

export type OperationalTwin = {
  twinId: string;
  kind:
    | 'CompanyOperationalTwin'
    | 'WarehouseOperationalTwin'
    | 'SupplyChainOperationalTwin'
    | 'SupplierOperationalTwin'
    | 'FacilityOperationalTwin'
    | 'LogisticsOperationalTwin'
    | 'ProcessOperationalTwin';
  stance: TwinStance;
};

export function createOperationalTwin(kind: OperationalTwin['kind'], stance: TwinStance): OperationalTwin {
  return { twinId: `twin:${kind}`, kind, stance };
}

export function simulatedTwinIsObservedFact(twin: OperationalTwin): boolean {
  return twin.stance === 'simulated' ? false : twin.stance === 'observed';
}

export type Scenario = { name: string };
export type ScenarioInput = { name: string; assumption: string };
export type ScenarioConstraint = { constraintId: string };
export type ScenarioAssumption = { text: string };
export type ScenarioModel = { modelId: string; certainty: false };
export type ScenarioOutcome = { summary: string; isFact: false };
export type ScenarioComparison = { a: string; b: string };
export type ScenarioConfidence = { level: 'low'; certainty: false };
export type ScenarioRisk = { riskId: string };

export type ScenarioRun = {
  scenarioId: string;
  assumption: string;
  predictionCertainty: false;
};

export function runScenario(input: { name: string; assumption: string }): ScenarioRun {
  return { scenarioId: `scenario:${input.name}`, assumption: input.assumption, predictionCertainty: false };
}

export function scenarioIsPredictionCertainty(_run: ScenarioRun): false {
  return false;
}
