/**
 * 62L-DW Module H — Secure Multimodal Experience Layer + neural soft-wire.
 * Multilingual/accessibility soft-wire; biometric/camera defaults OFF;
 * no covert emotion / surveillance / profiling; adult 18+ only; no minors.
 * Soft-wire DV/DU/DT; sealed deny-by-default; offline WAITING_NODE/OFFLINE_STOPPED.
 */

import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { readJsonFile, writeJsonFileAtomic, xivLocalPath } from './durable-json';
import {
  BIOMETRIC_DEFAULTS_OFF,
  COVERT_DENIED,
  detectPredecessorLayer,
  HEARTBEAT_REQUIRED,
  MAX_MULTIMODAL_SESSIONS,
  MAX_NEURAL_NODES,
  MINORS_DENIED,
  NEURAL_SEALED_DENIED,
  OFFLINE_WAITING_OR_STOPPED,
  predecessorMap,
  TWIN_NEQ_FOUNDER,
  type DwActor,
  type DwEvidenceState,
} from './supply-chain-superbrain-types';

export type MultimodalSession = {
  id: string;
  biometricEnabled: false;
  cameraEnabled: false;
  optIn: boolean;
  localPreferred: true;
  revocable: true;
  covertEmotion: false;
  crossContextTracking: false;
  reason: string;
  createdAt: string;
};

export type CovertSurveillanceProbe = {
  id: string;
  attemptedCovertEmotion: boolean;
  attemptedProfiling: boolean;
  status: 'denied';
  reason: string;
  at: string;
};

export type AdultTrustCircleProbe = {
  id: string;
  ageYears: number;
  status: 'allowed' | 'denied';
  reason: string;
  at: string;
};

export type NeuralSuperbrainNode = {
  id: string;
  kind: 'supply_chain' | 'lakehouse' | 'twin' | 'edge' | 'vault' | 'memory' | 'industry' | 'multimodal';
  universeId: string;
  sealed: boolean;
  grantsAuthority: false;
  softWiredPredecessors: string[];
  createdAt: string;
};

export type SealedNodeAccess = {
  id: string;
  nodeId: string;
  explicitGrant: boolean;
  status: 'allowed' | 'denied';
  reason: string;
  at: string;
};

export type OfflineNodeProbe = {
  id: string;
  poweredAuthorizedNode: boolean;
  state: Extract<DwEvidenceState, 'WAITING_NODE' | 'OFFLINE_STOPPED' | 'AVAILABLE'>;
  reason: string;
  at: string;
};

export type TwinAuthorityProbe = {
  id: string;
  actorKind: DwActor['kind'];
  claimsFounderAuthority: boolean;
  status: 'denied' | 'ok';
  isFounder: false | true;
  reason: string;
  at: string;
};

export type RunningVerifiedProbe = {
  id: string;
  heartbeatFresh: boolean;
  runtimeEvidencePresent: boolean;
  state: Extract<DwEvidenceState, 'RUNNING_VERIFIED' | 'DENIED'>;
  reason: string;
  at: string;
};

type Store = {
  sessions: MultimodalSession[];
  covertProbes: CovertSurveillanceProbe[];
  trustProbes: AdultTrustCircleProbe[];
  nodes: NeuralSuperbrainNode[];
  sealedAccess: SealedNodeAccess[];
  offlineProbes: OfflineNodeProbe[];
  twinProbes: TwinAuthorityProbe[];
  runningProbes: RunningVerifiedProbe[];
};

function storePath(root: string) {
  return xivLocalPath(root, 'secure-multimodal-experience-layer.json');
}

async function load(root: string): Promise<Store> {
  return readJsonFile<Store>(storePath(root), {
    sessions: [],
    covertProbes: [],
    trustProbes: [],
    nodes: [],
    sealedAccess: [],
    offlineProbes: [],
    twinProbes: [],
    runningProbes: [],
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
  return (['DV', 'DU', 'DT', 'DS'] as const).filter((k) => map[k].tipProbe === 'PRESENT');
}

export function detectDtSoftWire(repoRoot?: string): boolean {
  const here = repoRoot;
  if (!here) {
    return existsSync(
      join(
        // relative from types path resolution via predecessor map
        process.cwd(),
        'docs/operations/62L_DT_GROWTH_OPERATING_SYSTEM_REPORT.md',
      ),
    );
  }
  return (
    existsSync(join(here, 'docs/operations/62L_DT_GROWTH_OPERATING_SYSTEM_REPORT.md')) ||
    existsSync(join(here, 'services/ai/local-brain/growth-operating-system-types.ts'))
  );
}

export function secureMultimodalExperienceLayerHonesty(repoRoot?: string) {
  return {
    biometricCameraDefaultOn: false,
    covertEmotionSurveillance: false,
    crossContextTracking: false,
    minorsInTrustCircle: false,
    nonConsensualImagery: false,
    localPreferred: true,
    revocable: true,
    founderSealedDenyByDefault: true,
    labelAloneEqAccess: false,
    predecessorLayer: detectPredecessorLayer(repoRoot),
    softWiredPredecessors: softWireList(repoRoot),
    predecessorMap: predecessorMap(repoRoot),
    dtSoftWired: detectDtSoftWire(repoRoot),
  };
}

export async function openMultimodalSession(input: {
  optIn?: boolean;
  attemptEnableBiometric?: boolean;
  attemptEnableCamera?: boolean;
  root: string;
  actor: DwActor;
}): Promise<MultimodalSession> {
  const store = await load(input.root);
  void input.actor;
  if (store.sessions.length >= MAX_MULTIMODAL_SESSIONS) {
    throw new Error('MAX_MULTIMODAL_SESSIONS_REACHED');
  }
  const session: MultimodalSession = {
    id: id('dwmm'),
    biometricEnabled: false,
    cameraEnabled: false,
    optIn: Boolean(input.optIn),
    localPreferred: true,
    revocable: true,
    covertEmotion: false,
    crossContextTracking: false,
    reason: BIOMETRIC_DEFAULTS_OFF,
    createdAt: new Date().toISOString(),
  };
  store.sessions.push(session);
  await save(input.root, store);
  return session;
}

export async function probeCovertSurveillance(input: {
  attemptCovertEmotion?: boolean;
  attemptProfiling?: boolean;
  root: string;
  actor: DwActor;
}): Promise<CovertSurveillanceProbe> {
  const store = await load(input.root);
  void input.actor;
  const probe: CovertSurveillanceProbe = {
    id: id('dwcov'),
    attemptedCovertEmotion: Boolean(input.attemptCovertEmotion),
    attemptedProfiling: Boolean(input.attemptProfiling),
    status: 'denied',
    reason: COVERT_DENIED,
    at: new Date().toISOString(),
  };
  store.covertProbes.push(probe);
  await save(input.root, store);
  return probe;
}

export async function probeAdultTrustCircle(input: {
  ageYears: number;
  root: string;
  actor: DwActor;
}): Promise<AdultTrustCircleProbe> {
  const store = await load(input.root);
  void input.actor;
  const adult = input.ageYears >= 18;
  const probe: AdultTrustCircleProbe = {
    id: id('dwage'),
    ageYears: input.ageYears,
    status: adult ? 'allowed' : 'denied',
    reason: adult ? 'ADULT_TRUST_CIRCLE_AGE_OK' : MINORS_DENIED,
    at: new Date().toISOString(),
  };
  store.trustProbes.push(probe);
  await save(input.root, store);
  return probe;
}

export async function createNeuralSuperbrainNode(input: {
  kind: NeuralSuperbrainNode['kind'];
  universeId: string;
  sealed: boolean;
  root: string;
  actor: DwActor;
  repoRoot?: string;
}): Promise<NeuralSuperbrainNode> {
  const store = await load(input.root);
  void input.actor;
  if (store.nodes.length >= MAX_NEURAL_NODES) throw new Error('MAX_NEURAL_NODES_REACHED');
  const node: NeuralSuperbrainNode = {
    id: id('dwnode'),
    kind: input.kind,
    universeId: input.universeId,
    sealed: input.sealed,
    grantsAuthority: false,
    softWiredPredecessors: softWireList(input.repoRoot),
    createdAt: new Date().toISOString(),
  };
  store.nodes.push(node);
  await save(input.root, store);
  return node;
}

export async function accessSealedNeuralNode(input: {
  nodeId: string;
  explicitGrant: boolean;
  root: string;
  actor: DwActor;
}): Promise<SealedNodeAccess> {
  const store = await load(input.root);
  void input.actor;
  const access: SealedNodeAccess = {
    id: id('dwseal'),
    nodeId: input.nodeId,
    explicitGrant: input.explicitGrant,
    status: input.explicitGrant ? 'allowed' : 'denied',
    reason: input.explicitGrant ? 'EXPLICIT_GRANT_PRESENT' : NEURAL_SEALED_DENIED,
    at: new Date().toISOString(),
  };
  store.sealedAccess.push(access);
  await save(input.root, store);
  return access;
}

export async function probeOfflineNeuralNode(input: {
  poweredAuthorizedNode: boolean;
  preferWaiting?: boolean;
  root: string;
  actor: DwActor;
}): Promise<OfflineNodeProbe> {
  const store = await load(input.root);
  void input.actor;
  let state: OfflineNodeProbe['state'] = 'AVAILABLE';
  if (!input.poweredAuthorizedNode) {
    state = input.preferWaiting === false ? 'OFFLINE_STOPPED' : 'WAITING_NODE';
  }
  const probe: OfflineNodeProbe = {
    id: id('dwoff'),
    poweredAuthorizedNode: input.poweredAuthorizedNode,
    state,
    reason: input.poweredAuthorizedNode
      ? 'POWERED_AUTHORIZED_NODE_PRESENT'
      : OFFLINE_WAITING_OR_STOPPED,
    at: new Date().toISOString(),
  };
  store.offlineProbes.push(probe);
  await save(input.root, store);
  return probe;
}

export async function probeDigitalTwinAuthority(input: {
  actor: DwActor;
  claimFounderAuthority?: boolean;
  root: string;
}): Promise<TwinAuthorityProbe> {
  const store = await load(input.root);
  const isFounder = input.actor.kind === 'founder';
  const probe: TwinAuthorityProbe = {
    id: id('dwtwin'),
    actorKind: input.actor.kind,
    claimsFounderAuthority: Boolean(input.claimFounderAuthority),
    status: isFounder && !input.claimFounderAuthority ? 'ok' : 'denied',
    isFounder: isFounder,
    reason: TWIN_NEQ_FOUNDER,
    at: new Date().toISOString(),
  };
  if (input.actor.kind === 'digital_twin' || input.claimFounderAuthority) {
    probe.status = 'denied';
    probe.isFounder = false;
    probe.reason = TWIN_NEQ_FOUNDER;
  }
  store.twinProbes.push(probe);
  await save(input.root, store);
  return probe;
}

export async function probeRunningVerified(input: {
  heartbeatFresh: boolean;
  runtimeEvidencePresent: boolean;
  root: string;
  actor: DwActor;
}): Promise<RunningVerifiedProbe> {
  const store = await load(input.root);
  void input.actor;
  const ok = input.heartbeatFresh && input.runtimeEvidencePresent;
  const probe: RunningVerifiedProbe = {
    id: id('dwrun'),
    heartbeatFresh: input.heartbeatFresh,
    runtimeEvidencePresent: input.runtimeEvidencePresent,
    state: ok ? 'RUNNING_VERIFIED' : 'DENIED',
    reason: ok ? 'HEARTBEAT_AND_RUNTIME_EVIDENCE_PRESENT' : HEARTBEAT_REQUIRED,
    at: new Date().toISOString(),
  };
  store.runningProbes.push(probe);
  await save(input.root, store);
  return probe;
}
