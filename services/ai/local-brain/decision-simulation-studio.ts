/**
 * 62L-DH Decision Simulation Studio —
 * Decision simulations with labeled assumptions/probabilities.
 * Sim/forecast ≠ verified fact; predictions remain probabilistic.
 * Quantum-adjacent paths require classical baseline.
 */

import { readJsonFile, writeJsonFileAtomic, xivLocalPath } from './durable-json';
import {
  DECISION_SIM_NOT_VERIFIED_FACT,
  DH_LOCKS,
  HONESTY_BANNER,
  MAX_DECISION_SIMS,
  QUANTUM_ADJACENT_WITHOUT_BASELINE_REJECTED,
  type DhActor,
  type SimulationLabel,
} from './adaptive-life-business-intelligence-os-types';

export type DecisionSimulationStudio = {
  id: string;
  orgId: string;
  tenantId: string;
  universeId: string;
  createdAt: string;
};

export type DecisionSimulation = {
  id: string;
  studioId: string;
  scenarioId: string;
  label: SimulationLabel;
  assumptions: string[];
  probability: number | null;
  classicalBaselinePresent: boolean;
  quantumAdjacent: boolean;
  labeledVerifiedFact: false;
  labeledVerifiedOutcome: false;
  status: 'ACCEPTED' | 'DENIED' | 'REJECTED';
  reason: string;
  at: string;
};

type Store = { studios: DecisionSimulationStudio[]; simulations: DecisionSimulation[] };

function storePath(root: string) {
  return xivLocalPath(root, 'decision-simulation-studio.json');
}

async function load(root: string): Promise<Store> {
  return readJsonFile<Store>(storePath(root), { studios: [], simulations: [] });
}

async function save(root: string, store: Store) {
  await writeJsonFileAtomic(storePath(root), store);
}

function id(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function decisionSimulationStudioHonesty() {
  return {
    banner: HONESTY_BANNER,
    simLabeledAsVerifiedFact: DH_LOCKS.DECISION_SIM_LABELED_AS_VERIFIED_FACT,
    predictionsRemainProbabilistic: DH_LOCKS.PREDICTIONS_REMAIN_PROBABILISTIC,
    simForecastEqVerifiedFact: DH_LOCKS.SIM_FORECAST_EQ_VERIFIED_FACT,
    quantumAdjacentWithoutBaseline: DH_LOCKS.QUANTUM_ADJACENT_WITHOUT_CLASSICAL_BASELINE,
    classicalBaselineRequired: DH_LOCKS.CLASSICAL_BASELINE_REQUIRED_FOR_QUANTUM_ADJACENT,
  };
}

export async function bootstrapDecisionSimulationStudio(input: {
  orgId: string;
  tenantId: string;
  universeId: string;
  root: string;
  actor: DhActor;
}): Promise<DecisionSimulationStudio> {
  void input.actor;
  const store = await load(input.root);
  const existing = store.studios.find(
    (s) =>
      s.orgId === input.orgId &&
      s.tenantId === input.tenantId &&
      s.universeId === input.universeId,
  );
  if (existing) return existing;
  const studio: DecisionSimulationStudio = {
    id: id('dhds'),
    orgId: input.orgId,
    tenantId: input.tenantId,
    universeId: input.universeId,
    createdAt: new Date().toISOString(),
  };
  store.studios.push(studio);
  await save(input.root, store);
  return studio;
}

export async function runDecisionSimulation(input: {
  studioId: string;
  scenarioId: string;
  label?: SimulationLabel | 'VERIFIED_FACT' | 'VERIFIED_OUTCOME';
  assumptions?: string[];
  probability?: number | null;
  classicalBaselinePresent?: boolean;
  quantumAdjacent?: boolean;
  claimVerifiedFact?: boolean;
  claimVerifiedOutcome?: boolean;
  root: string;
  actor: DhActor;
}): Promise<{ accepted: boolean; reason: string; simulation?: DecisionSimulation; at: string }> {
  void input.actor;
  const store = await load(input.root);
  const now = new Date().toISOString();
  const studio = store.studios.find((s) => s.id === input.studioId);
  if (!studio) return { accepted: false, reason: 'DECISION_SIM_STUDIO_NOT_FOUND', at: now };
  if (store.simulations.length >= MAX_DECISION_SIMS) {
    return { accepted: false, reason: 'MAX_DECISION_SIMS_BOUNDED', at: now };
  }

  const classicalBaselinePresent = input.classicalBaselinePresent === true;
  const quantumAdjacent = input.quantumAdjacent === true;
  const claimVerifiedFact =
    input.claimVerifiedFact === true ||
    input.claimVerifiedOutcome === true ||
    input.label === 'VERIFIED_FACT' ||
    input.label === 'VERIFIED_OUTCOME';

  if (quantumAdjacent && !classicalBaselinePresent) {
    const simulation: DecisionSimulation = {
      id: id('dhsim'),
      studioId: studio.id,
      scenarioId: (input.scenarioId ?? '').trim() || 'unnamed-scenario',
      label: 'HYPOTHESIS',
      assumptions: input.assumptions ?? [],
      probability: null,
      classicalBaselinePresent,
      quantumAdjacent,
      labeledVerifiedFact: false,
      labeledVerifiedOutcome: false,
      status: 'REJECTED',
      reason: QUANTUM_ADJACENT_WITHOUT_BASELINE_REJECTED,
      at: now,
    };
    store.simulations.push(simulation);
    await save(input.root, store);
    return { accepted: false, reason: simulation.reason, simulation, at: now };
  }

  if (claimVerifiedFact || DH_LOCKS.DECISION_SIM_LABELED_AS_VERIFIED_FACT) {
    const simulation: DecisionSimulation = {
      id: id('dhsim'),
      studioId: studio.id,
      scenarioId: (input.scenarioId ?? '').trim() || 'unnamed-scenario',
      label: 'LABELED_SIMULATION',
      assumptions: input.assumptions ?? ['unlabeled-claim-rejected'],
      probability:
        typeof input.probability === 'number' && Number.isFinite(input.probability)
          ? input.probability
          : null,
      classicalBaselinePresent,
      quantumAdjacent,
      labeledVerifiedFact: false,
      labeledVerifiedOutcome: false,
      status: 'DENIED',
      reason: DECISION_SIM_NOT_VERIFIED_FACT,
      at: now,
    };
    store.simulations.push(simulation);
    await save(input.root, store);
    return { accepted: false, reason: simulation.reason, simulation, at: now };
  }

  const label: SimulationLabel =
    input.label === 'LABELED_FORECAST' ||
    input.label === 'LABELED_SCENARIO' ||
    input.label === 'PROBABILISTIC' ||
    input.label === 'HYPOTHESIS' ||
    input.label === 'CALIBRATION_PENDING'
      ? input.label
      : 'LABELED_SIMULATION';

  const simulation: DecisionSimulation = {
    id: id('dhsim'),
    studioId: studio.id,
    scenarioId: (input.scenarioId ?? '').trim() || 'unnamed-scenario',
    label,
    assumptions: (input.assumptions ?? []).length
      ? (input.assumptions as string[])
      : ['default-assumption-labeled'],
    probability:
      typeof input.probability === 'number' && Number.isFinite(input.probability)
        ? input.probability
        : null,
    classicalBaselinePresent,
    quantumAdjacent,
    labeledVerifiedFact: false,
    labeledVerifiedOutcome: false,
    status: 'ACCEPTED',
    reason: 'LABELED_PROBABILISTIC_DECISION_SIMULATION_NOT_VERIFIED_FACT',
    at: now,
  };
  store.simulations.push(simulation);
  await save(input.root, store);
  return { accepted: true, reason: simulation.reason, simulation, at: now };
}
