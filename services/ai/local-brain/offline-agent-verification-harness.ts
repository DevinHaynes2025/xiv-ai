/**
 * 62L-DK 24/7 Offline Agent Verification harness —
 * Logical catalog agents ≠ RUNNING_VERIFIED.
 * RUNNING_VERIFIED only on powered authorized nodes with heartbeat/runtime evidence.
 * No powered authorized node → WAITING_NODE or OFFLINE_STOPPED (not fake 24/7 running).
 */

import { readJsonFile, writeJsonFileAtomic, xivLocalPath } from './durable-json';
import {
  DK_LOCKS,
  HEARTBEAT_TTL_MS,
  HONESTY_BANNER,
  LOGICAL_NOT_RUNNING_VERIFIED,
  MAX_OFFLINE_AGENTS,
  NO_POWERED_NODE_WAITING_OR_STOPPED,
  type DkActor,
  type OfflineAgentStatus,
} from './unified-intelligence-experience-os-types';

export type OfflineAgentProofHarness = {
  id: string;
  orgId: string;
  tenantId: string;
  universeId: string;
  fake247RunningWithoutNode: false;
  createdAt: string;
};

export type PoweredAuthorizedNode = {
  id: string;
  harnessId: string;
  name: string;
  powered: boolean;
  authorized: boolean;
  lastHeartbeatAt: string | null;
  runtimeEvidence: string | null;
  createdAt: string;
  updatedAt: string;
};

export type OfflineLogicalAgent = {
  id: string;
  harnessId: string;
  name: string;
  catalogOnly: true;
  logical: true;
  nodeId: string | null;
  status: OfflineAgentStatus;
  lastHeartbeatAt: string | null;
  runtimeEvidence: string | null;
  createdAt: string;
  updatedAt: string;
};

type Store = {
  harnesses: OfflineAgentProofHarness[];
  nodes: PoweredAuthorizedNode[];
  agents: OfflineLogicalAgent[];
};

function storePath(root: string) {
  return xivLocalPath(root, 'offline-agent-verification-harness.json');
}

async function load(root: string): Promise<Store> {
  return readJsonFile<Store>(storePath(root), {
    harnesses: [],
    nodes: [],
    agents: [],
  });
}

async function save(root: string, store: Store) {
  await writeJsonFileAtomic(storePath(root), store);
}

function id(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

function heartbeatFresh(at: string | null, nowMs = Date.now()): boolean {
  if (!at) return false;
  const ts = Date.parse(at);
  if (!Number.isFinite(ts)) return false;
  return nowMs - ts <= HEARTBEAT_TTL_MS;
}

export function offlineAgentVerificationHonesty() {
  return {
    banner: HONESTY_BANNER,
    logicalAgentEqRunningVerified: DK_LOCKS.LOGICAL_AGENT_EQ_RUNNING_VERIFIED,
    runningVerifiedWithoutHeartbeat: DK_LOCKS.RUNNING_VERIFIED_WITHOUT_HEARTBEAT,
    fabricatedRuntimeState: DK_LOCKS.FABRICATED_RUNTIME_STATE,
    runningVerifiedRequiresPoweredAuthorizedNode:
      DK_LOCKS.RUNNING_VERIFIED_REQUIRES_POWERED_AUTHORIZED_NODE,
    runningVerifiedRequiresHeartbeatEvidence:
      DK_LOCKS.RUNNING_VERIFIED_REQUIRES_HEARTBEAT_EVIDENCE,
    fake247RunningWithoutNode: DK_LOCKS.FAKE_247_RUNNING_WITHOUT_NODE,
    noPoweredNodeYieldsWaitingOrStopped: DK_LOCKS.NO_POWERED_NODE_YIELDS_WAITING_OR_STOPPED,
  };
}

export async function bootstrapOfflineAgentVerificationHarness(input: {
  orgId: string;
  tenantId: string;
  universeId: string;
  root: string;
  actor: DkActor;
}): Promise<OfflineAgentProofHarness> {
  void input.actor;
  const store = await load(input.root);
  const existing = store.harnesses.find(
    (h) =>
      h.orgId === input.orgId &&
      h.tenantId === input.tenantId &&
      h.universeId === input.universeId,
  );
  if (existing) return existing;
  const harness: OfflineAgentProofHarness = {
    id: id('dkoff'),
    orgId: input.orgId,
    tenantId: input.tenantId,
    universeId: input.universeId,
    fake247RunningWithoutNode: false,
    createdAt: new Date().toISOString(),
  };
  store.harnesses.push(harness);
  await save(input.root, store);
  return harness;
}

export async function registerPoweredAuthorizedNode(input: {
  harnessId: string;
  name: string;
  powered: boolean;
  authorized: boolean;
  root: string;
  actor: DkActor;
}): Promise<{ accepted: boolean; reason: string; node?: PoweredAuthorizedNode; at: string }> {
  void input.actor;
  const store = await load(input.root);
  const now = new Date().toISOString();
  const harness = store.harnesses.find((h) => h.id === input.harnessId);
  if (!harness) return { accepted: false, reason: 'HARNESS_NOT_FOUND', at: now };

  const node: PoweredAuthorizedNode = {
    id: id('dknode'),
    harnessId: input.harnessId,
    name: input.name.trim() || 'unnamed-node',
    powered: input.powered === true,
    authorized: input.authorized === true,
    lastHeartbeatAt: null,
    runtimeEvidence: null,
    createdAt: now,
    updatedAt: now,
  };
  store.nodes.push(node);
  await save(input.root, store);
  return { accepted: true, reason: 'POWERED_AUTHORIZED_NODE_REGISTERED', node, at: now };
}

export async function catalogLogicalOfflineAgent(input: {
  harnessId: string;
  name: string;
  root: string;
  actor: DkActor;
}): Promise<{ accepted: boolean; reason: string; agent?: OfflineLogicalAgent; at: string }> {
  void input.actor;
  const store = await load(input.root);
  const now = new Date().toISOString();
  const harness = store.harnesses.find((h) => h.id === input.harnessId);
  if (!harness) return { accepted: false, reason: 'HARNESS_NOT_FOUND', at: now };

  if (store.agents.length >= MAX_OFFLINE_AGENTS) {
    return { accepted: false, reason: 'MAX_OFFLINE_AGENTS_REACHED', at: now };
  }

  const agent: OfflineLogicalAgent = {
    id: id('dkagent'),
    harnessId: input.harnessId,
    name: input.name.trim() || 'unnamed-agent',
    catalogOnly: true,
    logical: true,
    nodeId: null,
    status: 'LOGICAL',
    lastHeartbeatAt: null,
    runtimeEvidence: null,
    createdAt: now,
    updatedAt: now,
  };
  store.agents.push(agent);
  await save(input.root, store);
  return { accepted: true, reason: 'LOGICAL_AGENT_CATALOGED', agent, at: now };
}

export async function recordOfflineNodeHeartbeat(input: {
  nodeId: string;
  runtimeEvidence: string;
  root: string;
  actor: DkActor;
}): Promise<{ accepted: boolean; reason: string; node?: PoweredAuthorizedNode; at: string }> {
  void input.actor;
  const store = await load(input.root);
  const now = new Date().toISOString();
  const node = store.nodes.find((n) => n.id === input.nodeId);
  if (!node) return { accepted: false, reason: 'NODE_NOT_FOUND', at: now };
  node.lastHeartbeatAt = now;
  node.runtimeEvidence = input.runtimeEvidence.trim() || null;
  node.updatedAt = now;
  await save(input.root, store);
  return { accepted: true, reason: 'NODE_HEARTBEAT_RECORDED', node, at: now };
}

export async function claimOfflineAgentRunningVerified(input: {
  agentId: string;
  nodeId?: string | null;
  fabricateWithoutHeartbeat?: boolean;
  root: string;
  actor: DkActor;
}): Promise<{ accepted: boolean; reason: string; agent?: OfflineLogicalAgent; at: string }> {
  void input.actor;
  const store = await load(input.root);
  const now = new Date().toISOString();
  const agent = store.agents.find((a) => a.id === input.agentId);
  if (!agent) return { accepted: false, reason: 'AGENT_NOT_FOUND', at: now };

  if (input.fabricateWithoutHeartbeat === true || !input.nodeId) {
    agent.status = 'DENIED';
    agent.updatedAt = now;
    await save(input.root, store);
    return {
      accepted: false,
      reason: LOGICAL_NOT_RUNNING_VERIFIED,
      agent,
      at: now,
    };
  }

  const node = store.nodes.find((n) => n.id === input.nodeId);
  if (!node || !node.powered || !node.authorized) {
    agent.status = node?.powered === false ? 'OFFLINE_STOPPED' : 'WAITING_NODE';
    agent.nodeId = input.nodeId;
    agent.updatedAt = now;
    await save(input.root, store);
    return {
      accepted: false,
      reason: NO_POWERED_NODE_WAITING_OR_STOPPED,
      agent,
      at: now,
    };
  }

  const fresh = heartbeatFresh(node.lastHeartbeatAt);
  const hasEvidence = Boolean(node.runtimeEvidence && node.runtimeEvidence.length > 0);
  if (!fresh || !hasEvidence) {
    agent.status = 'DENIED';
    agent.nodeId = node.id;
    agent.updatedAt = now;
    await save(input.root, store);
    return {
      accepted: false,
      reason: LOGICAL_NOT_RUNNING_VERIFIED,
      agent,
      at: now,
    };
  }

  agent.status = 'RUNNING_VERIFIED';
  agent.nodeId = node.id;
  agent.lastHeartbeatAt = node.lastHeartbeatAt;
  agent.runtimeEvidence = node.runtimeEvidence;
  agent.updatedAt = now;
  await save(input.root, store);
  return {
    accepted: true,
    reason: 'RUNNING_VERIFIED_ON_POWERED_AUTHORIZED_NODE_WITH_HEARTBEAT',
    agent,
    at: now,
  };
}

export async function scheduleAlwaysOnWithoutPoweredNode(input: {
  agentId: string;
  preferStopped?: boolean;
  root: string;
  actor: DkActor;
}): Promise<{ accepted: boolean; reason: string; agent?: OfflineLogicalAgent; at: string }> {
  void input.actor;
  const store = await load(input.root);
  const now = new Date().toISOString();
  const agent = store.agents.find((a) => a.id === input.agentId);
  if (!agent) return { accepted: false, reason: 'AGENT_NOT_FOUND', at: now };

  const powered = store.nodes.find(
    (n) => n.harnessId === agent.harnessId && n.powered && n.authorized,
  );
  if (!powered) {
    agent.status = input.preferStopped ? 'OFFLINE_STOPPED' : 'WAITING_NODE';
    agent.updatedAt = now;
    await save(input.root, store);
    return {
      accepted: false,
      reason: NO_POWERED_NODE_WAITING_OR_STOPPED,
      agent,
      at: now,
    };
  }

  return {
    accepted: false,
    reason: 'USE_CLAIM_RUNNING_VERIFIED_WITH_HEARTBEAT_ON_POWERED_NODE',
    agent,
    at: now,
  };
}
