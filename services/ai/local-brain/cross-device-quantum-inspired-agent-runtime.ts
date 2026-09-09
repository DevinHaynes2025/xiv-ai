/**
 * 62L-DU Module H — Cross-Device Quantum-Inspired Agent Runtime.
 * Offline/online cross-device; historical reconstruction/counterfactual ("time travel");
 * isolated sim branches ("parallel Universe"); classical baselines required;
 * soft-wire DT/DS/DR; Digital Twin ≠ founder.
 */

import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { readJsonFile, writeJsonFileAtomic, xivLocalPath } from './durable-json';
import {
  detectPredecessorLayer,
  MAX_RUNTIME_SESSIONS,
  OFFLINE_WAITING_OR_STOPPED,
  PARALLEL_UNIVERSE_SIM,
  predecessorMap,
  QUANTUM_CLASSICAL_BASELINE,
  SIM_NEQ_FACT,
  TIME_TRAVEL_RECONSTRUCTION,
  TWIN_NEQ_FOUNDER,
  type DuActor,
  type DuEvidenceState,
} from './universal-industry-intelligence-os-types';

export type RuntimeSession = {
  id: string;
  mode: 'online' | 'offline' | 'cross_device';
  softWiredPredecessors: string[];
  grantsAuthority: false;
  createdAt: string;
};

export type SimulationLabel = {
  id: string;
  kind: 'simulation' | 'forecast' | 'backtest' | 'counterfactual';
  claimVerifiedFact: boolean;
  status: 'labeled_simulation' | 'denied';
  verifiedFact: false;
  reason: string;
  at: string;
};

export type QuantumInspiredRun = {
  id: string;
  classicalBaselinePresent: boolean;
  claimPhysicalQuantum?: boolean;
  claimSupremacy?: boolean;
  status: 'ok_classical_baseline' | 'denied';
  physicalQuantum: false;
  supremacyClaimed: false;
  reason: string;
  at: string;
};

export type ParallelUniverseBranch = {
  id: string;
  name: string;
  isolatedWorkspace: true;
  literalAlternateReality: false;
  reason: string;
  createdAt: string;
};

export type TimeTravelReconstruction = {
  id: string;
  subject: string;
  literalTimeTravel: false;
  kind: 'historical_reconstruction' | 'counterfactual_analysis';
  reason: string;
  at: string;
};

export type OfflineRuntimeProbe = {
  id: string;
  poweredAuthorizedNode: boolean;
  state: Extract<DuEvidenceState, 'WAITING_NODE' | 'OFFLINE_STOPPED' | 'AVAILABLE'>;
  reason: string;
  at: string;
};

export type TwinAuthorityProbe = {
  id: string;
  actorId: string;
  claimFounderAuthority: boolean;
  status: 'denied';
  isFounder: false;
  reason: string;
  at: string;
};

type Store = {
  sessions: RuntimeSession[];
  simulations: SimulationLabel[];
  quantumRuns: QuantumInspiredRun[];
  parallelBranches: ParallelUniverseBranch[];
  timeTravel: TimeTravelReconstruction[];
  offlineProbes: OfflineRuntimeProbe[];
  twinProbes: TwinAuthorityProbe[];
};

function storePath(root: string) {
  return xivLocalPath(root, 'cross-device-quantum-inspired-agent-runtime.json');
}

async function load(root: string): Promise<Store> {
  return readJsonFile<Store>(storePath(root), {
    sessions: [],
    simulations: [],
    quantumRuns: [],
    parallelBranches: [],
    timeTravel: [],
    offlineProbes: [],
    twinProbes: [],
  });
}

async function save(root: string, store: Store) {
  await writeJsonFileAtomic(storePath(root), store);
}

function id(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

function softWireList(repoRoot?: string): string[] {
  const map = predecessorMap(repoRoot);
  return (['DT', 'DS', 'DR'] as const).filter((k) => map[k].tipProbe === 'PRESENT');
}

export function crossDeviceQuantumInspiredRuntimeHonesty(repoRoot?: string) {
  return {
    quantumInspiredEqPhysicalQuantum: false,
    quantumSupremacyClaimed: false,
    classicalBaselineRequired: true,
    simEqVerifiedFact: false,
    parallelUniverseLiteral: false,
    timeTravelLiteral: false,
    digitalTwinEqFounder: false,
    predecessorLayer: detectPredecessorLayer(repoRoot),
    softWiredPredecessors: softWireList(repoRoot),
    predecessorMap: predecessorMap(repoRoot),
  };
}

export async function createRuntimeSession(input: {
  mode: RuntimeSession['mode'];
  root: string;
  actor: DuActor;
  repoRoot?: string;
}): Promise<RuntimeSession> {
  const store = await load(input.root);
  void input.actor;
  if (store.sessions.length >= MAX_RUNTIME_SESSIONS) {
    throw new Error('MAX_RUNTIME_SESSIONS_REACHED');
  }
  const session: RuntimeSession = {
    id: id('durun'),
    mode: input.mode,
    softWiredPredecessors: softWireList(input.repoRoot),
    grantsAuthority: false,
    createdAt: new Date().toISOString(),
  };
  store.sessions.push(session);
  await save(input.root, store);
  return session;
}

export async function labelSimulation(input: {
  kind: SimulationLabel['kind'];
  claimVerifiedFact?: boolean;
  root: string;
  actor: DuActor;
}): Promise<SimulationLabel> {
  const store = await load(input.root);
  void input.actor;
  const claiming = input.claimVerifiedFact === true;
  const label: SimulationLabel = {
    id: id('dusim'),
    kind: input.kind,
    claimVerifiedFact: claiming,
    status: claiming ? 'denied' : 'labeled_simulation',
    verifiedFact: false,
    reason: SIM_NEQ_FACT,
    at: new Date().toISOString(),
  };
  store.simulations.push(label);
  await save(input.root, store);
  return label;
}

export async function runQuantumInspired(input: {
  classicalBaselinePresent: boolean;
  claimPhysicalQuantum?: boolean;
  claimSupremacy?: boolean;
  root: string;
  actor: DuActor;
}): Promise<QuantumInspiredRun> {
  const store = await load(input.root);
  void input.actor;
  const denied =
    !input.classicalBaselinePresent ||
    input.claimPhysicalQuantum === true ||
    input.claimSupremacy === true;
  const run: QuantumInspiredRun = {
    id: id('duqi'),
    classicalBaselinePresent: input.classicalBaselinePresent,
    claimPhysicalQuantum: input.claimPhysicalQuantum,
    claimSupremacy: input.claimSupremacy,
    status: denied ? 'denied' : 'ok_classical_baseline',
    physicalQuantum: false,
    supremacyClaimed: false,
    reason: QUANTUM_CLASSICAL_BASELINE,
    at: new Date().toISOString(),
  };
  store.quantumRuns.push(run);
  await save(input.root, store);
  return run;
}

export async function createParallelUniverseBranch(input: {
  name: string;
  claimLiteralAlternateReality?: boolean;
  root: string;
  actor: DuActor;
}): Promise<ParallelUniverseBranch> {
  const store = await load(input.root);
  void input.actor;
  const branch: ParallelUniverseBranch = {
    id: id('dupar'),
    name: input.name.trim(),
    isolatedWorkspace: true,
    literalAlternateReality: false,
    reason: PARALLEL_UNIVERSE_SIM,
    createdAt: new Date().toISOString(),
  };
  store.parallelBranches.push(branch);
  await save(input.root, store);
  return branch;
}

export async function reconstructHistory(input: {
  subject: string;
  kind: TimeTravelReconstruction['kind'];
  claimLiteralTimeTravel?: boolean;
  root: string;
  actor: DuActor;
}): Promise<TimeTravelReconstruction> {
  const store = await load(input.root);
  void input.actor;
  const reconstruction: TimeTravelReconstruction = {
    id: id('dutime'),
    subject: input.subject.trim(),
    literalTimeTravel: false,
    kind: input.kind,
    reason: TIME_TRAVEL_RECONSTRUCTION,
    at: new Date().toISOString(),
  };
  store.timeTravel.push(reconstruction);
  await save(input.root, store);
  return reconstruction;
}

export async function probeOfflineRuntime(input: {
  poweredAuthorizedNode: boolean;
  preferWaiting?: boolean;
  root: string;
  actor: DuActor;
}): Promise<OfflineRuntimeProbe> {
  const store = await load(input.root);
  void input.actor;
  let state: OfflineRuntimeProbe['state'];
  let reason: string;
  if (input.poweredAuthorizedNode) {
    state = 'AVAILABLE';
    reason = 'POWERED_AUTHORIZED_NODE_PRESENT';
  } else if (input.preferWaiting !== false) {
    state = 'WAITING_NODE';
    reason = OFFLINE_WAITING_OR_STOPPED;
  } else {
    state = 'OFFLINE_STOPPED';
    reason = OFFLINE_WAITING_OR_STOPPED;
  }
  const probe: OfflineRuntimeProbe = {
    id: id('duoff'),
    poweredAuthorizedNode: input.poweredAuthorizedNode,
    state,
    reason,
    at: new Date().toISOString(),
  };
  store.offlineProbes.push(probe);
  await save(input.root, store);
  return probe;
}

export async function probeDigitalTwinAuthority(input: {
  actor: DuActor;
  claimFounderAuthority?: boolean;
  root: string;
}): Promise<TwinAuthorityProbe> {
  const store = await load(input.root);
  const probe: TwinAuthorityProbe = {
    id: id('dutwin'),
    actorId: input.actor.id,
    claimFounderAuthority: input.claimFounderAuthority === true,
    status: 'denied',
    isFounder: false,
    reason: TWIN_NEQ_FOUNDER,
    at: new Date().toISOString(),
  };
  store.twinProbes.push(probe);
  await save(input.root, store);
  return probe;
}

export function detectDtSoftWire(repoRoot?: string): boolean {
  const brain = repoRoot
    ? join(repoRoot, 'services/ai/local-brain')
    : join(process.cwd(), 'services/ai/local-brain');
  return (
    existsSync(join(brain, 'growth-operating-system-types.ts')) ||
    existsSync(join(brain, 'growth-operating-system.ts'))
  );
}
