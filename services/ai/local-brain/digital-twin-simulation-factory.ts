/**
 * 62L-DW Module C — Digital Twin Simulation Factory.
 * Calibrated twins; proof before accuracy claims; sim ≠ fact / ≠ physical control.
 */

import { readJsonFile, writeJsonFileAtomic, xivLocalPath } from './durable-json';
import {
  ACCURACY_PROOF_REQUIRED,
  MAX_SIM_RUNS,
  SIM_NEQ_FACT,
  TWIN_NEQ_PHYSICAL,
  type DwActor,
  type DwEvidenceState,
} from './supply-chain-superbrain-types';

export type TwinSimulationRun = {
  id: string;
  scenario: string;
  labeledSimulation: true;
  verifiedFact: false;
  physicalControl: false;
  status: 'LABELED_SIMULATION' | 'denied';
  reason: string;
  createdAt: string;
};

export type TwinPhysicalControlProbe = {
  id: string;
  twinId: string;
  attemptedPhysicalControl: boolean;
  physicalControlGranted: false;
  status: 'denied';
  reason: string;
  at: string;
};

export type AccuracyClaimProbe = {
  id: string;
  claim: string;
  calibrationProofPresent: boolean;
  state: Extract<DwEvidenceState, 'NOT_VERIFIED' | 'VERIFIED' | 'DENIED'>;
  reason: string;
  at: string;
};

type Store = {
  simulations: TwinSimulationRun[];
  physicalProbes: TwinPhysicalControlProbe[];
  accuracyProbes: AccuracyClaimProbe[];
};

function storePath(root: string) {
  return xivLocalPath(root, 'digital-twin-simulation-factory.json');
}

async function load(root: string): Promise<Store> {
  return readJsonFile<Store>(storePath(root), {
    simulations: [],
    physicalProbes: [],
    accuracyProbes: [],
  });
}

async function save(root: string, store: Store) {
  await writeJsonFileAtomic(storePath(root), store);
}

function id(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function digitalTwinSimulationFactoryHonesty() {
  return {
    simEqVerifiedFact: false,
    twinEqPhysicalControl: false,
    accuracyWithoutProof: false,
    prototypeEqInvention: false,
  };
}

export async function runCalibratedTwinSimulation(input: {
  scenario: string;
  claimVerifiedFact?: boolean;
  root: string;
  actor: DwActor;
}): Promise<TwinSimulationRun> {
  const store = await load(input.root);
  void input.actor;
  if (store.simulations.length >= MAX_SIM_RUNS) throw new Error('MAX_SIM_RUNS_REACHED');
  const run: TwinSimulationRun = {
    id: id('dwsim'),
    scenario: input.scenario.trim(),
    labeledSimulation: true,
    verifiedFact: false,
    physicalControl: false,
    status: 'LABELED_SIMULATION',
    reason: SIM_NEQ_FACT,
    createdAt: new Date().toISOString(),
  };
  store.simulations.push(run);
  await save(input.root, store);
  return run;
}

export async function probeTwinPhysicalControl(input: {
  twinId: string;
  attemptPhysicalControl?: boolean;
  root: string;
  actor: DwActor;
}): Promise<TwinPhysicalControlProbe> {
  const store = await load(input.root);
  void input.actor;
  const probe: TwinPhysicalControlProbe = {
    id: id('dwphys'),
    twinId: input.twinId,
    attemptedPhysicalControl: Boolean(input.attemptPhysicalControl),
    physicalControlGranted: false,
    status: 'denied',
    reason: TWIN_NEQ_PHYSICAL,
    at: new Date().toISOString(),
  };
  store.physicalProbes.push(probe);
  await save(input.root, store);
  return probe;
}

export async function claimTwinAccuracy(input: {
  claim: string;
  calibrationProofPresent: boolean;
  root: string;
  actor: DwActor;
}): Promise<AccuracyClaimProbe> {
  const store = await load(input.root);
  void input.actor;
  const probe: AccuracyClaimProbe = {
    id: id('dwacc'),
    claim: input.claim.trim(),
    calibrationProofPresent: input.calibrationProofPresent,
    state: input.calibrationProofPresent ? 'NOT_VERIFIED' : 'DENIED',
    reason: ACCURACY_PROOF_REQUIRED,
    at: new Date().toISOString(),
  };
  // Even with calibration proof present, unit tests treat as NOT_VERIFIED until
  // production-authorized verification — never invent VERIFIED accuracy.
  if (!input.calibrationProofPresent) {
    probe.state = 'DENIED';
  } else {
    probe.state = 'NOT_VERIFIED';
  }
  store.accuracyProbes.push(probe);
  await save(input.root, store);
  return probe;
}
