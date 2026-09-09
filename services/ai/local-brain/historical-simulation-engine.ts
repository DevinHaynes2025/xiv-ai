/**
 * 62L-DV Module E — Historical Simulation Engine.
 * Simulation / backtesting / forecast calibration.
 * Sim ≠ verified fact; backtest ≠ verified prediction; forecasts labeled only.
 */

import { readJsonFile, writeJsonFileAtomic, xivLocalPath } from './durable-json';
import {
  BACKTEST_NEQ_PREDICTION,
  FORECAST_LABELED_ONLY,
  MAX_SIMULATIONS,
  SIM_NEQ_FACT,
  type DvActor,
  type DvEvidenceState,
} from './universal-data-industry-cortex-types';

export type SimulationRun = {
  id: string;
  scenario: string;
  labeledSimulation: true;
  verifiedFact: false;
  status: 'labeled_simulation' | 'denied';
  reason: string;
  createdAt: string;
};

export type BacktestRun = {
  id: string;
  datasetRef: string;
  labeledBacktest: true;
  verifiedPrediction: false;
  status: 'labeled_backtest' | 'denied';
  reason: string;
  createdAt: string;
};

export type ForecastCalibration = {
  id: string;
  modelRef: string;
  labeledForecast: true;
  verifiedFact: false;
  state: Extract<DvEvidenceState, 'LABELED_FORECAST' | 'DENIED'>;
  reason: string;
  at: string;
};

type Store = {
  simulations: SimulationRun[];
  backtests: BacktestRun[];
  forecasts: ForecastCalibration[];
};

function storePath(root: string) {
  return xivLocalPath(root, 'historical-simulation-engine.json');
}

async function load(root: string): Promise<Store> {
  return readJsonFile<Store>(storePath(root), {
    simulations: [],
    backtests: [],
    forecasts: [],
  });
}

async function save(root: string, store: Store) {
  await writeJsonFileAtomic(storePath(root), store);
}

function id(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function historicalSimulationHonesty() {
  return {
    simEqVerifiedFact: false,
    backtestEqVerifiedPrediction: false,
    forecastEqVerifiedFact: false,
    correlationEqCausation: false,
  };
}

export async function runHistoricalSimulation(input: {
  scenario: string;
  claimVerifiedFact?: boolean;
  root: string;
  actor: DvActor;
}): Promise<SimulationRun> {
  const store = await load(input.root);
  void input.actor;
  if (store.simulations.length >= MAX_SIMULATIONS) {
    throw new Error('MAX_SIMULATIONS_REACHED');
  }
  const claiming = input.claimVerifiedFact === true;
  const run: SimulationRun = {
    id: id('dvsim'),
    scenario: input.scenario.trim(),
    labeledSimulation: true,
    verifiedFact: false,
    status: claiming ? 'denied' : 'labeled_simulation',
    reason: SIM_NEQ_FACT,
    createdAt: new Date().toISOString(),
  };
  store.simulations.push(run);
  await save(input.root, store);
  return run;
}

export async function runBacktest(input: {
  datasetRef: string;
  claimVerifiedPrediction?: boolean;
  root: string;
  actor: DvActor;
}): Promise<BacktestRun> {
  const store = await load(input.root);
  void input.actor;
  const claiming = input.claimVerifiedPrediction === true;
  const run: BacktestRun = {
    id: id('dvbt'),
    datasetRef: input.datasetRef.trim(),
    labeledBacktest: true,
    verifiedPrediction: false,
    status: claiming ? 'denied' : 'labeled_backtest',
    reason: BACKTEST_NEQ_PREDICTION,
    createdAt: new Date().toISOString(),
  };
  store.backtests.push(run);
  await save(input.root, store);
  return run;
}

export async function calibrateForecast(input: {
  modelRef: string;
  claimVerifiedFact?: boolean;
  root: string;
  actor: DvActor;
}): Promise<ForecastCalibration> {
  const store = await load(input.root);
  void input.actor;
  const claiming = input.claimVerifiedFact === true;
  const cal: ForecastCalibration = {
    id: id('dvfc'),
    modelRef: input.modelRef.trim(),
    labeledForecast: true,
    verifiedFact: false,
    state: claiming ? 'DENIED' : 'LABELED_FORECAST',
    reason: FORECAST_LABELED_ONLY,
    at: new Date().toISOString(),
  };
  store.forecasts.push(cal);
  await save(input.root, store);
  return cal;
}
