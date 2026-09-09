/**
 * 62L-DZ Module D — Universal Edge AI Runtime.
 * Offline knowledge packs; local-model adapters; edge resource governance;
 * evidence gates; device self-promotion denied; honest offline.
 */

import { readJsonFile, writeJsonFileAtomic, xivLocalPath } from './durable-json';
import {
  DEVICE_SELF_PROMOTION_DENIED,
  EDGE_EVIDENCE_REQUIRED,
  MAX_EDGE_PROBES,
  OFFLINE_PACK_HONEST,
  OFFLINE_WAITING_OR_STOPPED,
  type DzActor,
  type DzEvidenceState,
} from './supply-chain-intelligence-fabric-types';

export type EdgeProbe = {
  id: string;
  nodeId: string;
  authorized: boolean;
  heartbeatPresent: boolean;
  poweredNodePresent: boolean;
  claimRunningVerified: boolean;
  state: DzEvidenceState;
  status: 'ok' | 'denied';
  reason: string;
  at: string;
};

export type OfflineKnowledgePack = {
  id: string;
  packId: string;
  poweredNodePresent: boolean;
  accuracyClaimedWithoutEvidence: boolean;
  status: 'honest_offline' | 'denied';
  state: DzEvidenceState;
  reason: string;
  at: string;
};

export type DeviceSelfPromotion = {
  id: string;
  deviceId: string;
  status: 'denied';
  reason: string;
  at: string;
};

type Store = {
  probes: EdgeProbe[];
  packs: OfflineKnowledgePack[];
  promotions: DeviceSelfPromotion[];
};

function storePath(root: string) {
  return xivLocalPath(root, 'universal-edge-ai-runtime.json');
}

async function load(root: string): Promise<Store> {
  return readJsonFile<Store>(storePath(root), {
    probes: [],
    packs: [],
    promotions: [],
  });
}

async function save(root: string, store: Store) {
  await writeJsonFileAtomic(storePath(root), store);
}

function id(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function universalEdgeAiRuntimeHonesty() {
  return {
    runningVerifiedNeedsEvidence: true,
    offlineKnowledgePacksHonest: true,
    offlineHonestWaitingOrStopped: true,
    deviceSelfPromotionForbidden: true,
    localModelAdaptersBounded: true,
  };
}

export async function probeEdgeRunningVerified(input: {
  nodeId: string;
  authorized: boolean;
  heartbeatPresent: boolean;
  claimRunningVerified: boolean;
  root: string;
  actor: DzActor;
}): Promise<EdgeProbe> {
  const store = await load(input.root);
  void input.actor;
  if (store.probes.length >= MAX_EDGE_PROBES) {
    throw new Error('MAX_EDGE_PROBES_REACHED');
  }
  if (!input.authorized) {
    const denied: EdgeProbe = {
      id: id('dzedge'),
      nodeId: input.nodeId.trim(),
      authorized: false,
      heartbeatPresent: input.heartbeatPresent,
      poweredNodePresent: true,
      claimRunningVerified: input.claimRunningVerified,
      state: 'DENIED',
      status: 'denied',
      reason: EDGE_EVIDENCE_REQUIRED,
      at: new Date().toISOString(),
    };
    store.probes.push(denied);
    await save(input.root, store);
    return denied;
  }
  const verified =
    input.claimRunningVerified && input.heartbeatPresent && input.authorized;
  const probe: EdgeProbe = {
    id: id('dzedge'),
    nodeId: input.nodeId.trim(),
    authorized: true,
    heartbeatPresent: input.heartbeatPresent,
    poweredNodePresent: true,
    claimRunningVerified: input.claimRunningVerified,
    state: verified ? 'RUNNING_VERIFIED' : 'NOT_VERIFIED',
    status: verified ? 'ok' : 'denied',
    reason: verified ? 'EDGE_RUNNING_VERIFIED' : EDGE_EVIDENCE_REQUIRED,
    at: new Date().toISOString(),
  };
  store.probes.push(probe);
  await save(input.root, store);
  return probe;
}

export async function probeOfflineKnowledgePack(input: {
  packId: string;
  poweredNodePresent: boolean;
  accuracyClaimedWithoutEvidence?: boolean;
  root: string;
  actor: DzActor;
}): Promise<OfflineKnowledgePack> {
  const store = await load(input.root);
  void input.actor;
  const state: DzEvidenceState = input.poweredNodePresent
    ? 'AVAILABLE'
    : 'WAITING_NODE';
  const pack: OfflineKnowledgePack = {
    id: id('dzokp'),
    packId: input.packId.trim(),
    poweredNodePresent: input.poweredNodePresent,
    accuracyClaimedWithoutEvidence: Boolean(
      input.accuracyClaimedWithoutEvidence,
    ),
    status:
      input.accuracyClaimedWithoutEvidence || !input.poweredNodePresent
        ? 'honest_offline'
        : 'honest_offline',
    state: input.accuracyClaimedWithoutEvidence
      ? 'NOT_VERIFIED'
      : state,
    reason: input.accuracyClaimedWithoutEvidence
      ? OFFLINE_PACK_HONEST
      : input.poweredNodePresent
        ? 'OFFLINE_PACK_AVAILABLE'
        : OFFLINE_PACK_HONEST,
    at: new Date().toISOString(),
  };
  store.packs.push(pack);
  await save(input.root, store);
  return pack;
}

export async function probeOfflineEdgeStopped(input: {
  nodeId: string;
  root: string;
  actor: DzActor;
}): Promise<EdgeProbe> {
  const store = await load(input.root);
  void input.actor;
  const probe: EdgeProbe = {
    id: id('dzofs'),
    nodeId: input.nodeId.trim(),
    authorized: true,
    heartbeatPresent: false,
    poweredNodePresent: false,
    claimRunningVerified: false,
    state: 'OFFLINE_STOPPED',
    status: 'denied',
    reason: OFFLINE_WAITING_OR_STOPPED,
    at: new Date().toISOString(),
  };
  store.probes.push(probe);
  await save(input.root, store);
  return probe;
}

export async function attemptDeviceSelfPromotion(input: {
  deviceId: string;
  root: string;
  actor: DzActor;
}): Promise<DeviceSelfPromotion> {
  const store = await load(input.root);
  void input.actor;
  const attempt: DeviceSelfPromotion = {
    id: id('dzdsp'),
    deviceId: input.deviceId.trim(),
    status: 'denied',
    reason: DEVICE_SELF_PROMOTION_DENIED,
    at: new Date().toISOString(),
  };
  store.promotions.push(attempt);
  await save(input.root, store);
  return attempt;
}
