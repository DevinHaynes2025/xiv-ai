/**
 * 62L-EB Module E — Universal Local AI Node Runtime.
 * Local AI nodes; offline agents; WAITING_NODE / OFFLINE_STOPPED honesty.
 * RUNNING_VERIFIED needs evidence; local node self-promotion denied.
 */

import { readJsonFile, writeJsonFileAtomic, xivLocalPath } from './durable-json';
import {
  LOCAL_NODE_EVIDENCE_REQUIRED,
  LOCAL_NODE_SELF_PROMOTION_DENIED,
  MAX_NODE_PROBES,
  OFFLINE_WAITING_OR_STOPPED,
  type EbActor,
  type EbEvidenceState,
} from './multi-model-superbrain-federation-types';

export type LocalAiNodeProbe = {
  id: string;
  nodeId: string;
  authorized: boolean;
  heartbeatPresent: boolean;
  poweredNodePresent: boolean;
  claimRunningVerified: boolean;
  status: 'ok' | 'denied';
  state: EbEvidenceState;
  reason: string;
  at: string;
};

export type OfflineAgentProbe = {
  id: string;
  agentId: string;
  poweredNodePresent: boolean;
  status: 'honest_offline' | 'denied';
  state: EbEvidenceState;
  reason: string;
  at: string;
};

export type LocalNodeSelfPromotion = {
  id: string;
  nodeId: string;
  status: 'denied';
  reason: string;
  at: string;
};

type Store = {
  nodes: LocalAiNodeProbe[];
  agents: OfflineAgentProbe[];
  promotions: LocalNodeSelfPromotion[];
};

function storePath(root: string) {
  return xivLocalPath(root, 'universal-local-ai-node-runtime.json');
}

async function load(root: string): Promise<Store> {
  return readJsonFile<Store>(storePath(root), {
    nodes: [],
    agents: [],
    promotions: [],
  });
}

async function save(root: string, store: Store) {
  await writeJsonFileAtomic(storePath(root), store);
}

function id(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function universalLocalAiNodeRuntimeHonesty() {
  return {
    runningVerifiedNeedsEvidence: true,
    offlineAgentsHonestWaitingOrStopped: true,
    localNodeSelfPromotionForbidden: true,
    waitingNodeHonesty: true,
  };
}

export async function probeLocalAiNodeRunningVerified(input: {
  nodeId: string;
  authorized: boolean;
  heartbeatPresent: boolean;
  claimRunningVerified: boolean;
  root: string;
  actor: EbActor;
}): Promise<LocalAiNodeProbe> {
  const store = await load(input.root);
  void input.actor;
  if (store.nodes.length >= MAX_NODE_PROBES) {
    throw new Error('MAX_NODE_PROBES_REACHED');
  }
  if (!input.authorized) {
    const denied: LocalAiNodeProbe = {
      id: id('eblan'),
      nodeId: input.nodeId.trim(),
      authorized: false,
      heartbeatPresent: input.heartbeatPresent,
      poweredNodePresent: true,
      claimRunningVerified: input.claimRunningVerified,
      status: 'denied',
      state: 'DENIED',
      reason: LOCAL_NODE_EVIDENCE_REQUIRED,
      at: new Date().toISOString(),
    };
    store.nodes.push(denied);
    await save(input.root, store);
    return denied;
  }
  const verified =
    input.claimRunningVerified && input.heartbeatPresent && input.authorized;
  const probe: LocalAiNodeProbe = {
    id: id('eblan'),
    nodeId: input.nodeId.trim(),
    authorized: true,
    heartbeatPresent: input.heartbeatPresent,
    poweredNodePresent: true,
    claimRunningVerified: input.claimRunningVerified,
    status: verified ? 'ok' : 'denied',
    state: verified ? 'RUNNING_VERIFIED' : 'NOT_VERIFIED',
    reason: verified
      ? 'LOCAL_AI_NODE_RUNNING_VERIFIED'
      : LOCAL_NODE_EVIDENCE_REQUIRED,
    at: new Date().toISOString(),
  };
  store.nodes.push(probe);
  await save(input.root, store);
  return probe;
}

export async function probeOfflineAgent(input: {
  agentId: string;
  poweredNodePresent: boolean;
  root: string;
  actor: EbActor;
}): Promise<OfflineAgentProbe> {
  const store = await load(input.root);
  void input.actor;
  const agent: OfflineAgentProbe = {
    id: id('ebofa'),
    agentId: input.agentId.trim(),
    poweredNodePresent: input.poweredNodePresent,
    status: 'honest_offline',
    state: input.poweredNodePresent ? 'AVAILABLE' : 'WAITING_NODE',
    reason: input.poweredNodePresent
      ? 'OFFLINE_AGENT_NODE_AVAILABLE'
      : OFFLINE_WAITING_OR_STOPPED,
    at: new Date().toISOString(),
  };
  store.agents.push(agent);
  await save(input.root, store);
  return agent;
}

export async function probeOfflineNodeStopped(input: {
  nodeId: string;
  root: string;
  actor: EbActor;
}): Promise<LocalAiNodeProbe> {
  const store = await load(input.root);
  void input.actor;
  const probe: LocalAiNodeProbe = {
    id: id('ebofs'),
    nodeId: input.nodeId.trim(),
    authorized: true,
    heartbeatPresent: false,
    poweredNodePresent: false,
    claimRunningVerified: false,
    status: 'denied',
    state: 'OFFLINE_STOPPED',
    reason: OFFLINE_WAITING_OR_STOPPED,
    at: new Date().toISOString(),
  };
  store.nodes.push(probe);
  await save(input.root, store);
  return probe;
}

export async function attemptLocalNodeSelfPromotion(input: {
  nodeId: string;
  root: string;
  actor: EbActor;
}): Promise<LocalNodeSelfPromotion> {
  const store = await load(input.root);
  void input.actor;
  const attempt: LocalNodeSelfPromotion = {
    id: id('eblnsp'),
    nodeId: input.nodeId.trim(),
    status: 'denied',
    reason: LOCAL_NODE_SELF_PROMOTION_DENIED,
    at: new Date().toISOString(),
  };
  store.promotions.push(attempt);
  await save(input.root, store);
  return attempt;
}
