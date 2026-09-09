/**
 * 62L-EG Module H — Energy-Aware Edge/Cloud Runtime.
 * Energy-aware scheduling; offline/edge; GPU/chip quant analysis;
 * quantum-inspired with classical baselines; soft-wire EF/EE/ED;
 * stealth denied; twin ≠ founder; autonomy boundary.
 */

import { readJsonFile, writeJsonFileAtomic, xivLocalPath } from './durable-json';
import {
  AUTONOMY_BOUNDARY_DENIED,
  CLASSICAL_BASELINE_REQUIRED,
  ENERGY_NEQ_POWER_CONTROL,
  GPU_CHIP_NEQ_FAB,
  MAX_ENERGY_EVENTS,
  OFFLINE_WAITING_OR_STOPPED,
  STEALTH_INSTALL_DENIED,
  TWIN_NEQ_FOUNDER,
  predecessorMap,
  type EgActor,
  type EgEvidenceState,
} from './cognitive-operations-backbone-types';

export type EnergyScheduleAdvice = {
  id: string;
  scheduleId: string;
  claimUnauthorizedPowerControl: boolean;
  status: 'recommendation_only' | 'denied';
  state: EgEvidenceState;
  reason: string;
  powerControlEnabled: false;
  at: string;
};

export type GpuChipQuantAnalysis = {
  id: string;
  subject: string;
  claimFabControl: boolean;
  status: 'advisory_only' | 'denied';
  state: EgEvidenceState;
  reason: string;
  fabControlEnabled: false;
  at: string;
};

export type QuantumInspiredOpt = {
  id: string;
  name: string;
  quantumInspired: boolean;
  classicalBaselinePresent: boolean;
  status: 'ok' | 'denied';
  state: EgEvidenceState;
  reason: string;
  supremacyClaimed: false;
  at: string;
};

export type OfflineNodeProbe = {
  id: string;
  nodeId: string;
  mode: 'waiting' | 'stopped';
  status: 'ok';
  state: EgEvidenceState;
  reason: string;
  at: string;
};

export type StealthInstallDenial = {
  id: string;
  attemptKind: string;
  status: 'denied';
  state: EgEvidenceState;
  reason: string;
  at: string;
};

export type TwinAuthorityProbe = {
  id: string;
  actorKind: EgActor['kind'];
  claimFounderAuthority: boolean;
  status: 'ok' | 'denied';
  state: EgEvidenceState;
  reason: string;
  at: string;
};

export type AutonomyBoundaryProbe = {
  id: string;
  action:
    | 'book_freight'
    | 'issue_purchase_order'
    | 'spend_money'
    | 'sign_contract'
    | 'change_production_system';
  status: 'denied';
  state: EgEvidenceState;
  reason: string;
  at: string;
};

type Store = {
  energy: EnergyScheduleAdvice[];
  chips: GpuChipQuantAnalysis[];
  quantum: QuantumInspiredOpt[];
  offline: OfflineNodeProbe[];
  stealth: StealthInstallDenial[];
  twins: TwinAuthorityProbe[];
  autonomy: AutonomyBoundaryProbe[];
};

function storePath(root: string) {
  return xivLocalPath(root, 'energy-aware-edge-cloud-runtime.json');
}

async function load(root: string): Promise<Store> {
  return readJsonFile<Store>(storePath(root), {
    energy: [],
    chips: [],
    quantum: [],
    offline: [],
    stealth: [],
    twins: [],
    autonomy: [],
  });
}

async function save(root: string, store: Store) {
  await writeJsonFileAtomic(storePath(root), store);
}

function id(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function energyAwareEdgeCloudRuntimeHonesty(repoRoot?: string) {
  return {
    energyScheduleRecommendNeqPowerControl: true,
    gpuChipQuantAdvisoryNeqFabControl: true,
    quantumInspiredClassicalBaselineRequired: true,
    offlineHonestWaitingOrStopped: true,
    stealthInstallDenied: true,
    digitalTwinNeqFounder: true,
    autonomyBoundaryEnforced: true,
    predecessors: predecessorMap(repoRoot),
  };
}

export async function adviseEnergySchedule(input: {
  scheduleId: string;
  claimUnauthorizedPowerControl?: boolean;
  root: string;
  actor: EgActor;
}): Promise<EnergyScheduleAdvice> {
  const store = await load(input.root);
  void input.actor;
  if (store.energy.length >= MAX_ENERGY_EVENTS) {
    throw new Error('MAX_ENERGY_EVENTS_REACHED');
  }
  const claim = Boolean(input.claimUnauthorizedPowerControl);
  const advice: EnergyScheduleAdvice = {
    id: id('egenergy'),
    scheduleId: input.scheduleId.trim(),
    claimUnauthorizedPowerControl: claim,
    status: claim ? 'denied' : 'recommendation_only',
    state: claim ? 'DENIED' : 'RECOMMENDATION_ONLY',
    reason: ENERGY_NEQ_POWER_CONTROL,
    powerControlEnabled: false,
    at: new Date().toISOString(),
  };
  store.energy.push(advice);
  await save(input.root, store);
  return advice;
}

export async function analyzeGpuChipQuant(input: {
  subject: string;
  claimFabControl?: boolean;
  root: string;
  actor: EgActor;
}): Promise<GpuChipQuantAnalysis> {
  const store = await load(input.root);
  void input.actor;
  if (store.chips.length >= MAX_ENERGY_EVENTS) {
    throw new Error('MAX_ENERGY_EVENTS_REACHED');
  }
  const claim = Boolean(input.claimFabControl);
  const analysis: GpuChipQuantAnalysis = {
    id: id('egchip'),
    subject: input.subject.trim(),
    claimFabControl: claim,
    status: claim ? 'denied' : 'advisory_only',
    state: claim ? 'DENIED' : 'ADVISORY_ONLY',
    reason: GPU_CHIP_NEQ_FAB,
    fabControlEnabled: false,
    at: new Date().toISOString(),
  };
  store.chips.push(analysis);
  await save(input.root, store);
  return analysis;
}

export async function runQuantumInspiredOpt(input: {
  name: string;
  quantumInspired?: boolean;
  classicalBaselinePresent?: boolean;
  root: string;
  actor: EgActor;
}): Promise<QuantumInspiredOpt> {
  const store = await load(input.root);
  void input.actor;
  if (store.quantum.length >= MAX_ENERGY_EVENTS) {
    throw new Error('MAX_ENERGY_EVENTS_REACHED');
  }
  const qi = Boolean(input.quantumInspired);
  const baseline = Boolean(input.classicalBaselinePresent);
  const needsBaseline = qi && !baseline;
  const opt: QuantumInspiredOpt = {
    id: id('egqi'),
    name: input.name.trim(),
    quantumInspired: qi,
    classicalBaselinePresent: baseline,
    status: needsBaseline ? 'denied' : 'ok',
    state: needsBaseline ? 'CLASSICAL_BASELINE_REQUIRED' : 'PASS',
    reason: CLASSICAL_BASELINE_REQUIRED,
    supremacyClaimed: false,
    at: new Date().toISOString(),
  };
  store.quantum.push(opt);
  await save(input.root, store);
  return opt;
}

export async function probeOfflineEnergyNode(input: {
  nodeId: string;
  mode: 'waiting' | 'stopped';
  root: string;
  actor: EgActor;
}): Promise<OfflineNodeProbe> {
  const store = await load(input.root);
  void input.actor;
  const probe: OfflineNodeProbe = {
    id: id('egoff'),
    nodeId: input.nodeId.trim(),
    mode: input.mode,
    status: 'ok',
    state: input.mode === 'waiting' ? 'WAITING_NODE' : 'OFFLINE_STOPPED',
    reason: OFFLINE_WAITING_OR_STOPPED,
    at: new Date().toISOString(),
  };
  store.offline.push(probe);
  await save(input.root, store);
  return probe;
}

export async function denyStealthInstall(input: {
  attemptKind: string;
  root: string;
  actor: EgActor;
}): Promise<StealthInstallDenial> {
  const store = await load(input.root);
  void input.actor;
  const denial: StealthInstallDenial = {
    id: id('egstealth'),
    attemptKind: input.attemptKind.trim(),
    status: 'denied',
    state: 'DENIED',
    reason: STEALTH_INSTALL_DENIED,
    at: new Date().toISOString(),
  };
  store.stealth.push(denial);
  await save(input.root, store);
  return denial;
}

export async function probeDigitalTwinAuthority(input: {
  actor: EgActor;
  claimFounderAuthority: boolean;
  root: string;
}): Promise<TwinAuthorityProbe> {
  const store = await load(input.root);
  const claim =
    input.claimFounderAuthority || input.actor.kind === 'digital_twin';
  const probe: TwinAuthorityProbe = {
    id: id('egtwinauth'),
    actorKind: input.actor.kind,
    claimFounderAuthority: claim,
    status: claim ? 'denied' : 'ok',
    state: claim ? 'DENIED' : 'PASS',
    reason: TWIN_NEQ_FOUNDER,
    at: new Date().toISOString(),
  };
  store.twins.push(probe);
  await save(input.root, store);
  return probe;
}

export async function denyAutonomousAction(input: {
  action:
    | 'book_freight'
    | 'issue_purchase_order'
    | 'spend_money'
    | 'sign_contract'
    | 'change_production_system';
  root: string;
  actor: EgActor;
}): Promise<AutonomyBoundaryProbe> {
  const store = await load(input.root);
  void input.actor;
  const probe: AutonomyBoundaryProbe = {
    id: id('egauto'),
    action: input.action,
    status: 'denied',
    state: 'DENIED',
    reason: AUTONOMY_BOUNDARY_DENIED,
    at: new Date().toISOString(),
  };
  store.autonomy.push(probe);
  await save(input.root, store);
  return probe;
}
