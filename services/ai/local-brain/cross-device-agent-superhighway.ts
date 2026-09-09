/**
 * 62L-DV Module H — Cross-Device Agent Superhighway.
 * Secure authenticated handoffs; neural architecture expansion; soft-wire DU/DT/DS.
 * Evidence gates for RUNNING_VERIFIED; sealed deny if peer unenrolled.
 * Offline: WAITING_NODE / OFFLINE_STOPPED; Digital Twin ≠ founder.
 */

import { readJsonFile, writeJsonFileAtomic, xivLocalPath } from './durable-json';
import {
  HEARTBEAT_REQUIRED_FOR_RUNNING,
  MAX_HANDOFFS,
  MAX_SUPERHIGHWAY_NODES,
  NEURAL_SUPERHIGHWAY_SEALED_DENIED,
  OFFLINE_WAITING_OR_STOPPED,
  TWIN_NEQ_FOUNDER,
  UNENROLLED_HANDOFF_DENIED,
  detectPredecessorLayer,
  predecessorMap,
  type DvActor,
  type DvEvidenceState,
} from './universal-data-industry-cortex-types';

export type SuperhighwayNode = {
  id: string;
  deviceId: string;
  enrolled: boolean;
  sealed: boolean;
  grantsAuthority: false;
  softWiredPredecessors: string[];
  createdAt: string;
};

export type AgentHandoff = {
  id: string;
  fromDeviceId: string;
  toDeviceId: string;
  peerEnrolled: boolean;
  authenticated: boolean;
  status: 'handoff_candidate' | 'denied';
  reason: string;
  at: string;
};

export type SuperhighwayRuntimeProbe = {
  id: string;
  nodeId: string;
  heartbeatFresh: boolean;
  runtimeEvidencePresent: boolean;
  state: DvEvidenceState;
  reason: string;
  at: string;
};

export type OfflineNodeProbe = {
  id: string;
  poweredAuthorizedNode: boolean;
  state: Extract<DvEvidenceState, 'WAITING_NODE' | 'OFFLINE_STOPPED' | 'AVAILABLE'>;
  reason: string;
  at: string;
};

export type TwinAuthorityProbe = {
  id: string;
  actorKind: DvActor['kind'];
  claimFounderAuthority: boolean;
  status: 'denied' | 'ok';
  reason: string;
  at: string;
};

export type SealedNodeAccess = {
  id: string;
  nodeId: string;
  explicitGrant: boolean;
  status: 'allowed' | 'denied';
  reason: string;
  at: string;
};

type Store = {
  nodes: SuperhighwayNode[];
  handoffs: AgentHandoff[];
  runtimeProbes: SuperhighwayRuntimeProbe[];
  offlineProbes: OfflineNodeProbe[];
  twinProbes: TwinAuthorityProbe[];
  sealedAccess: SealedNodeAccess[];
};

function storePath(root: string) {
  return xivLocalPath(root, 'cross-device-agent-superhighway.json');
}

async function load(root: string): Promise<Store> {
  return readJsonFile<Store>(storePath(root), {
    nodes: [],
    handoffs: [],
    runtimeProbes: [],
    offlineProbes: [],
    twinProbes: [],
    sealedAccess: [],
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
  return (['DU', 'DT', 'DS'] as const).filter((k) => map[k].tipProbe === 'PRESENT');
}

export function crossDeviceAgentSuperhighwayHonesty(repoRoot?: string) {
  return {
    founderSealedDenyByDefault: true,
    labelAloneEqAccess: false,
    unenrolledPeerHandoffAllowed: false,
    runningVerifiedWithoutEvidence: false,
    digitalTwinEqFounder: false,
    predecessorLayer: detectPredecessorLayer(repoRoot),
    softWiredPredecessors: softWireList(repoRoot),
    predecessorMap: predecessorMap(repoRoot),
  };
}

export async function enrollSuperhighwayNode(input: {
  deviceId: string;
  enrolled?: boolean;
  sealed?: boolean;
  root: string;
  actor: DvActor;
  repoRoot?: string;
}): Promise<SuperhighwayNode> {
  const store = await load(input.root);
  void input.actor;
  if (store.nodes.length >= MAX_SUPERHIGHWAY_NODES) {
    throw new Error('MAX_SUPERHIGHWAY_NODES_REACHED');
  }
  const node: SuperhighwayNode = {
    id: id('dvsh'),
    deviceId: input.deviceId.trim(),
    enrolled: input.enrolled !== false,
    sealed: input.sealed !== false,
    grantsAuthority: false,
    softWiredPredecessors: softWireList(input.repoRoot),
    createdAt: new Date().toISOString(),
  };
  store.nodes.push(node);
  await save(input.root, store);
  return node;
}

export async function requestAgentHandoff(input: {
  fromDeviceId: string;
  toDeviceId: string;
  peerEnrolled: boolean;
  authenticated: boolean;
  root: string;
  actor: DvActor;
}): Promise<AgentHandoff> {
  const store = await load(input.root);
  void input.actor;
  if (store.handoffs.length >= MAX_HANDOFFS) {
    throw new Error('MAX_HANDOFFS_REACHED');
  }
  const ok = input.peerEnrolled && input.authenticated;
  const handoff: AgentHandoff = {
    id: id('dvhand'),
    fromDeviceId: input.fromDeviceId,
    toDeviceId: input.toDeviceId,
    peerEnrolled: input.peerEnrolled,
    authenticated: input.authenticated,
    status: ok ? 'handoff_candidate' : 'denied',
    reason: ok
      ? 'SECURE_AUTHENTICATED_HANDOFF_CANDIDATE'
      : UNENROLLED_HANDOFF_DENIED,
    at: new Date().toISOString(),
  };
  store.handoffs.push(handoff);
  await save(input.root, store);
  return handoff;
}

export async function probeSuperhighwayRunningVerified(input: {
  nodeId: string;
  heartbeatFresh: boolean;
  runtimeEvidencePresent: boolean;
  root: string;
  actor: DvActor;
}): Promise<SuperhighwayRuntimeProbe> {
  const store = await load(input.root);
  void input.actor;
  const ok = input.heartbeatFresh && input.runtimeEvidencePresent;
  const probe: SuperhighwayRuntimeProbe = {
    id: id('dvshrun'),
    nodeId: input.nodeId,
    heartbeatFresh: input.heartbeatFresh,
    runtimeEvidencePresent: input.runtimeEvidencePresent,
    state: ok ? 'RUNNING_VERIFIED' : 'DENIED',
    reason: ok
      ? 'RUNNING_VERIFIED_WITH_HEARTBEAT_EVIDENCE'
      : HEARTBEAT_REQUIRED_FOR_RUNNING,
    at: new Date().toISOString(),
  };
  store.runtimeProbes.push(probe);
  await save(input.root, store);
  return probe;
}

export async function probeOfflineSuperhighwayNode(input: {
  poweredAuthorizedNode: boolean;
  preferWaiting?: boolean;
  root: string;
  actor: DvActor;
}): Promise<OfflineNodeProbe> {
  const store = await load(input.root);
  void input.actor;
  let state: OfflineNodeProbe['state'];
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
  const probe: OfflineNodeProbe = {
    id: id('dvoff'),
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
  actor: DvActor;
  claimFounderAuthority: boolean;
  root: string;
}): Promise<TwinAuthorityProbe> {
  const store = await load(input.root);
  const isTwin = input.actor.kind === 'digital_twin';
  const denied = isTwin || input.claimFounderAuthority;
  const probe: TwinAuthorityProbe = {
    id: id('dvtwinauth'),
    actorKind: input.actor.kind,
    claimFounderAuthority: input.claimFounderAuthority,
    status: denied ? 'denied' : 'ok',
    reason: denied ? TWIN_NEQ_FOUNDER : 'NON_TWIN_ACTOR_NO_FOUNDER_CLAIM',
    at: new Date().toISOString(),
  };
  store.twinProbes.push(probe);
  await save(input.root, store);
  return probe;
}

export async function accessSealedSuperhighwayNode(input: {
  nodeId: string;
  explicitGrant: boolean;
  root: string;
  actor: DvActor;
}): Promise<SealedNodeAccess> {
  const store = await load(input.root);
  void input.actor;
  const access: SealedNodeAccess = {
    id: id('dvseal'),
    nodeId: input.nodeId,
    explicitGrant: input.explicitGrant,
    status: input.explicitGrant ? 'allowed' : 'denied',
    reason: input.explicitGrant
      ? 'SEALED_SUPERHIGHWAY_NODE_EXPLICIT_GRANT'
      : NEURAL_SUPERHIGHWAY_SEALED_DENIED,
    at: new Date().toISOString(),
  };
  store.sealedAccess.push(access);
  await save(input.root, store);
  return access;
}
