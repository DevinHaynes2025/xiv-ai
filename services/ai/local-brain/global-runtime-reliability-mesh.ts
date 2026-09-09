/**
 * 62L-EI Module G — Global Runtime Reliability Mesh.
 * Reliability mesh + neural nodes; soft-wire EG/EE; offline WAITING_NODE /
 * OFFLINE_STOPPED; stealth denied; twin ≠ founder; autonomy boundary.
 */

import { readJsonFile, writeJsonFileAtomic, xivLocalPath } from './durable-json';
import {
  AUTONOMY_BOUNDARY_DENIED,
  MAX_RELIABILITY_EVENTS,
  NEURAL_NODE_SOFT_WIRE,
  OFFLINE_WAITING_OR_STOPPED,
  RELIABILITY_MESH_REGISTERED,
  STEALTH_INSTALL_DENIED,
  TWIN_NEQ_FOUNDER,
  detectPredecessorLayer,
  predecessorMap,
  type EiActor,
  type EiEvidenceState,
} from './chip-to-cloud-cognitive-fabric-types';

export type ReliabilityMeshNode = {
  id: string;
  meshId: string;
  status: 'ok';
  state: EiEvidenceState;
  reason: string;
  at: string;
};

export type NeuralNodeSoftWire = {
  id: string;
  nodeId: string;
  predecessorLayer: ReturnType<typeof detectPredecessorLayer>;
  softWired: string[];
  status: 'ok';
  state: EiEvidenceState;
  reason: string;
  at: string;
};

export type OfflineReliabilityProbe = {
  id: string;
  nodeId: string;
  mode: 'waiting' | 'stopped';
  status: 'waiting' | 'stopped';
  state: EiEvidenceState;
  reason: string;
  at: string;
};

export type StealthDenial = {
  id: string;
  attemptKind: string;
  status: 'denied';
  state: EiEvidenceState;
  reason: string;
  at: string;
};

export type TwinAuthorityProbe = {
  id: string;
  actorId: string;
  claimFounderAuthority: boolean;
  status: 'denied';
  state: EiEvidenceState;
  reason: string;
  founderAuthority: false;
  at: string;
};

export type AutonomyDenial = {
  id: string;
  action: string;
  status: 'denied';
  state: EiEvidenceState;
  reason: string;
  at: string;
};

type Store = {
  meshes: ReliabilityMeshNode[];
  neural: NeuralNodeSoftWire[];
  offline: OfflineReliabilityProbe[];
  stealth: StealthDenial[];
  twins: TwinAuthorityProbe[];
  autonomy: AutonomyDenial[];
};

function storePath(root: string) {
  return xivLocalPath(root, 'global-runtime-reliability-mesh.json');
}

async function load(root: string): Promise<Store> {
  return readJsonFile<Store>(storePath(root), {
    meshes: [],
    neural: [],
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

export function globalRuntimeReliabilityMeshHonesty(repoRoot?: string) {
  return {
    reliabilityMesh: true,
    neuralNodeSoftWire: true,
    offlineHonestWaitingOrStopped: true,
    stealthDenied: true,
    digitalTwinNeqFounder: true,
    autonomyBoundary: true,
    predecessorLayer: detectPredecessorLayer(repoRoot),
    predecessors: predecessorMap(repoRoot),
    l4AutonomyEnabled: false,
  };
}

export async function registerReliabilityMesh(input: {
  meshId: string;
  root: string;
  actor: EiActor;
}): Promise<ReliabilityMeshNode> {
  const store = await load(input.root);
  void input.actor;
  if (store.meshes.length >= MAX_RELIABILITY_EVENTS) {
    throw new Error('MAX_RELIABILITY_EVENTS');
  }
  const node: ReliabilityMeshNode = {
    id: id('eimesh'),
    meshId: input.meshId.trim(),
    status: 'ok',
    state: 'REGISTERED',
    reason: RELIABILITY_MESH_REGISTERED,
    at: new Date().toISOString(),
  };
  store.meshes.push(node);
  await save(input.root, store);
  return node;
}

export async function softWireNeuralNode(input: {
  nodeId: string;
  root: string;
  actor: EiActor;
  repoRoot?: string;
}): Promise<NeuralNodeSoftWire> {
  const store = await load(input.root);
  void input.actor;
  const preds = predecessorMap(input.repoRoot);
  const softWired = Object.entries(preds)
    .filter(([, v]) => v.tipProbe === 'PRESENT')
    .map(([k]) => k);
  const rec: NeuralNodeSoftWire = {
    id: id('eineural'),
    nodeId: input.nodeId.trim(),
    predecessorLayer: detectPredecessorLayer(input.repoRoot),
    softWired,
    status: 'ok',
    state: 'BOUNDED',
    reason: NEURAL_NODE_SOFT_WIRE,
    at: new Date().toISOString(),
  };
  store.neural.push(rec);
  await save(input.root, store);
  return rec;
}

export async function probeOfflineReliabilityNode(input: {
  nodeId: string;
  mode: 'waiting' | 'stopped';
  root: string;
  actor: EiActor;
}): Promise<OfflineReliabilityProbe> {
  const store = await load(input.root);
  void input.actor;
  const probe: OfflineReliabilityProbe = {
    id: id('eioff'),
    nodeId: input.nodeId.trim(),
    mode: input.mode,
    status: input.mode === 'waiting' ? 'waiting' : 'stopped',
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
  actor: EiActor;
}): Promise<StealthDenial> {
  const store = await load(input.root);
  void input.actor;
  const denial: StealthDenial = {
    id: id('eistealth'),
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
  actor: EiActor;
  claimFounderAuthority: boolean;
  root: string;
}): Promise<TwinAuthorityProbe> {
  const store = await load(input.root);
  const probe: TwinAuthorityProbe = {
    id: id('eitwin'),
    actorId: input.actor.id,
    claimFounderAuthority: input.claimFounderAuthority,
    status: 'denied',
    state: 'DENIED',
    reason: TWIN_NEQ_FOUNDER,
    founderAuthority: false,
    at: new Date().toISOString(),
  };
  store.twins.push(probe);
  await save(input.root, store);
  return probe;
}

export async function denyAutonomousAction(input: {
  action: string;
  root: string;
  actor: EiActor;
}): Promise<AutonomyDenial> {
  const store = await load(input.root);
  void input.actor;
  const denial: AutonomyDenial = {
    id: id('eiauto'),
    action: input.action.trim(),
    status: 'denied',
    state: 'DENIED',
    reason: AUTONOMY_BOUNDARY_DENIED,
    at: new Date().toISOString(),
  };
  store.autonomy.push(denial);
  await save(input.root, store);
  return denial;
}
