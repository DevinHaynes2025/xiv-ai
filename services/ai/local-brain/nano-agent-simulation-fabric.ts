/**
 * 62L-EG Module C — Nano-Agent Simulation Fabric.
 * Highly compressed logical micro-agents + synthetic populations.
 * Explicit NOT physical atom-scale agents or nonexistent hardware.
 * Scale targets ≠ current ownership claims.
 */

import { readJsonFile, writeJsonFileAtomic, xivLocalPath } from './durable-json';
import {
  ARCHITECTURE_TRANSLATIONS,
  COMPRESSED_LOGICAL_MICRO_AGENTS,
  MAX_NANO_FABRIC,
  NANO_SCALE_TARGET_NEQ_OWNERSHIP,
  SYNTHETIC_NEQ_PHYSICAL_ATOM,
  type EgActor,
  type EgEvidenceState,
} from './cognitive-operations-backbone-types';

export type MicroAgentRegistration = {
  id: string;
  agentClass: string;
  representation: 'compressed_logical' | 'physical_atom_claimed';
  status: 'ok' | 'denied';
  state: EgEvidenceState;
  reason: string;
  physicalAtomAgents: false;
  at: string;
};

export type SyntheticPopulation = {
  id: string;
  populationId: string;
  claimPhysicalAtomAgents: boolean;
  status: 'synthetic_only' | 'denied';
  state: EgEvidenceState;
  reason: string;
  physicalAtomAgents: false;
  translation: typeof ARCHITECTURE_TRANSLATIONS.atomSizedTrillionsOfAgentsMeans;
  at: string;
};

export type NanoScaleTarget = {
  id: string;
  targetLabel: string;
  claimCurrentOwnership: boolean;
  status: 'scale_target_only' | 'denied';
  state: EgEvidenceState;
  reason: string;
  owned: false;
  at: string;
};

type Store = {
  agents: MicroAgentRegistration[];
  populations: SyntheticPopulation[];
  scales: NanoScaleTarget[];
};

function storePath(root: string) {
  return xivLocalPath(root, 'nano-agent-simulation-fabric.json');
}

async function load(root: string): Promise<Store> {
  return readJsonFile<Store>(storePath(root), {
    agents: [],
    populations: [],
    scales: [],
  });
}

async function save(root: string, store: Store) {
  await writeJsonFileAtomic(storePath(root), store);
}

function id(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function nanoAgentSimulationFabricHonesty() {
  return {
    compressedLogicalMicroAgentsOnly: true,
    syntheticPopulationNeqPhysicalAtomAgents: true,
    physicalAtomAgents: false,
    scaleTargetNeqOwnership: true,
    translation: ARCHITECTURE_TRANSLATIONS.atomSizedTrillionsOfAgentsMeans,
    doesNotMean: ARCHITECTURE_TRANSLATIONS.atomSizedTrillionsOfAgentsDoesNotMean,
  };
}

export async function registerCompressedMicroAgent(input: {
  agentClass: string;
  representation?: 'compressed_logical' | 'physical_atom_claimed';
  root: string;
  actor: EgActor;
}): Promise<MicroAgentRegistration> {
  const store = await load(input.root);
  void input.actor;
  if (store.agents.length >= MAX_NANO_FABRIC) {
    throw new Error('MAX_NANO_FABRIC_REACHED');
  }
  const representation = input.representation ?? 'compressed_logical';
  const physicalClaim = representation === 'physical_atom_claimed';
  const rec: MicroAgentRegistration = {
    id: id('egmicro'),
    agentClass: input.agentClass.trim(),
    representation,
    status: physicalClaim ? 'denied' : 'ok',
    state: physicalClaim ? 'DENIED' : 'LOGICAL',
    reason: COMPRESSED_LOGICAL_MICRO_AGENTS,
    physicalAtomAgents: false,
    at: new Date().toISOString(),
  };
  store.agents.push(rec);
  await save(input.root, store);
  return rec;
}

export async function registerSyntheticPopulation(input: {
  populationId: string;
  claimPhysicalAtomAgents?: boolean;
  root: string;
  actor: EgActor;
}): Promise<SyntheticPopulation> {
  const store = await load(input.root);
  void input.actor;
  if (store.populations.length >= MAX_NANO_FABRIC) {
    throw new Error('MAX_NANO_FABRIC_REACHED');
  }
  const claim = Boolean(input.claimPhysicalAtomAgents);
  const pop: SyntheticPopulation = {
    id: id('egpop'),
    populationId: input.populationId.trim(),
    claimPhysicalAtomAgents: claim,
    status: claim ? 'denied' : 'synthetic_only',
    state: claim ? 'DENIED' : 'SYNTHETIC_POPULATION',
    reason: SYNTHETIC_NEQ_PHYSICAL_ATOM,
    physicalAtomAgents: false,
    translation: ARCHITECTURE_TRANSLATIONS.atomSizedTrillionsOfAgentsMeans,
    at: new Date().toISOString(),
  };
  store.populations.push(pop);
  await save(input.root, store);
  return pop;
}

export async function registerNanoScaleTarget(input: {
  targetLabel: string;
  claimCurrentOwnership?: boolean;
  root: string;
  actor: EgActor;
}): Promise<NanoScaleTarget> {
  const store = await load(input.root);
  void input.actor;
  if (store.scales.length >= MAX_NANO_FABRIC) {
    throw new Error('MAX_NANO_FABRIC_REACHED');
  }
  const claim = Boolean(input.claimCurrentOwnership);
  const scale: NanoScaleTarget = {
    id: id('egscale'),
    targetLabel: input.targetLabel.trim(),
    claimCurrentOwnership: claim,
    status: claim ? 'denied' : 'scale_target_only',
    state: claim ? 'DENIED' : 'SCALE_TARGET_ONLY',
    reason: NANO_SCALE_TARGET_NEQ_OWNERSHIP,
    owned: false,
    at: new Date().toISOString(),
  };
  store.scales.push(scale);
  await save(input.root, store);
  return scale;
}
