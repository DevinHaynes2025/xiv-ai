/**
 * 62L-DG Predictive Decision Intelligence —
 * Predictive scenario composition; calibration dashboards; quant workbench;
 * probabilistic outputs. Quantum path requires classical baseline.
 */

import { readJsonFile, writeJsonFileAtomic, xivLocalPath } from './durable-json';
import {
  DG_LOCKS,
  HONESTY_BANNER,
  MAX_PREDICTIVE_SCENARIOS,
  PREDICTION_NOT_VERIFIED_FACT,
  QUANTUM_WITHOUT_BASELINE_REJECTED,
  type DgActor,
  type PredictionLabel,
} from './universal-personal-business-ai-os-types';

export type PredictiveDecisionEngine = {
  id: string;
  orgId: string;
  tenantId: string;
  universeId: string;
  createdAt: string;
};

export type PredictiveScenario = {
  id: string;
  engineId: string;
  scenarioId: string;
  label: PredictionLabel;
  classicalBaselinePresent: boolean;
  quantumPathUsed: boolean;
  labeledVerifiedFact: false;
  probabilistic: true;
  guaranteed: false;
  calibrationTracked: boolean;
  status: 'ACCEPTED' | 'REJECTED' | 'DENIED';
  reason: string;
  at: string;
};

type Store = {
  engines: PredictiveDecisionEngine[];
  scenarios: PredictiveScenario[];
};

function storePath(root: string) {
  return xivLocalPath(root, 'predictive-decision-intelligence.json');
}

async function load(root: string): Promise<Store> {
  return readJsonFile<Store>(storePath(root), { engines: [], scenarios: [] });
}

async function save(root: string, store: Store) {
  await writeJsonFileAtomic(storePath(root), store);
}

function id(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function predictiveDecisionIntelligenceHonesty() {
  return {
    banner: HONESTY_BANNER,
    predictionLabeledAsVerifiedFact: DG_LOCKS.PREDICTION_LABELED_AS_VERIFIED_FACT,
    predictionsRemainProbabilistic: DG_LOCKS.PREDICTIONS_REMAIN_PROBABILISTIC,
    quantumWithoutClassicalBaseline: DG_LOCKS.QUANTUM_WITHOUT_CLASSICAL_BASELINE,
    quantumPredictionGuaranteed: DG_LOCKS.QUANTUM_PREDICTION_GUARANTEED,
    classicalBaselineRequired: DG_LOCKS.CLASSICAL_BASELINE_REQUIRED_FOR_QUANTUM,
  };
}

export async function bootstrapPredictiveDecisionIntelligence(input: {
  orgId: string;
  tenantId: string;
  universeId: string;
  root: string;
  actor: DgActor;
}): Promise<PredictiveDecisionEngine> {
  void input.actor;
  const store = await load(input.root);
  const existing = store.engines.find(
    (e) =>
      e.orgId === input.orgId &&
      e.tenantId === input.tenantId &&
      e.universeId === input.universeId,
  );
  if (existing) return existing;
  const engine: PredictiveDecisionEngine = {
    id: id('dgpdi'),
    orgId: input.orgId,
    tenantId: input.tenantId,
    universeId: input.universeId,
    createdAt: new Date().toISOString(),
  };
  store.engines.push(engine);
  await save(input.root, store);
  return engine;
}

export async function composePredictiveScenario(input: {
  engineId: string;
  scenarioId: string;
  label?: PredictionLabel;
  classicalBaselinePresent?: boolean;
  quantumPathUsed?: boolean;
  claimVerifiedFact?: boolean;
  root: string;
  actor: DgActor;
}): Promise<{ accepted: boolean; reason: string; scenario?: PredictiveScenario }> {
  void input.actor;
  const store = await load(input.root);
  if (store.scenarios.filter((s) => s.engineId === input.engineId).length >= MAX_PREDICTIVE_SCENARIOS) {
    return { accepted: false, reason: 'MAX_PREDICTIVE_SCENARIOS' };
  }

  if (input.claimVerifiedFact === true) {
    const denied: PredictiveScenario = {
      id: id('dgpred'),
      engineId: input.engineId,
      scenarioId: input.scenarioId,
      label: input.label ?? 'PROBABILISTIC',
      classicalBaselinePresent: input.classicalBaselinePresent === true,
      quantumPathUsed: input.quantumPathUsed === true,
      labeledVerifiedFact: false,
      probabilistic: true,
      guaranteed: false,
      calibrationTracked: true,
      status: 'DENIED',
      reason: PREDICTION_NOT_VERIFIED_FACT,
      at: new Date().toISOString(),
    };
    store.scenarios.push(denied);
    await save(input.root, store);
    return { accepted: false, reason: denied.reason, scenario: denied };
  }

  if (input.quantumPathUsed === true && input.classicalBaselinePresent !== true) {
    const rejected: PredictiveScenario = {
      id: id('dgpred'),
      engineId: input.engineId,
      scenarioId: input.scenarioId,
      label: input.label ?? 'HYPOTHESIS',
      classicalBaselinePresent: false,
      quantumPathUsed: true,
      labeledVerifiedFact: false,
      probabilistic: true,
      guaranteed: false,
      calibrationTracked: true,
      status: 'REJECTED',
      reason: QUANTUM_WITHOUT_BASELINE_REJECTED,
      at: new Date().toISOString(),
    };
    store.scenarios.push(rejected);
    await save(input.root, store);
    return { accepted: false, reason: rejected.reason, scenario: rejected };
  }

  const scenario: PredictiveScenario = {
    id: id('dgpred'),
    engineId: input.engineId,
    scenarioId: input.scenarioId,
    label: input.label ?? 'PROBABILISTIC',
    classicalBaselinePresent: input.classicalBaselinePresent === true,
    quantumPathUsed: input.quantumPathUsed === true,
    labeledVerifiedFact: false,
    probabilistic: true,
    guaranteed: false,
    calibrationTracked: true,
    status: 'ACCEPTED',
    reason: 'PROBABILISTIC_PREDICTIVE_SCENARIO_ACCEPTED',
    at: new Date().toISOString(),
  };
  store.scenarios.push(scenario);
  await save(input.root, store);
  return { accepted: true, reason: scenario.reason, scenario };
}
