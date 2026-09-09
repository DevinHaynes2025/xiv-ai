/**
 * 62L-DM Verified Offline/Online Agent Workforce —
 * RUNNING_VERIFIED only with powered authorized node + fresh heartbeat.
 * Bounded new-agent creation; no self-grant production authority.
 */

import { createHash } from 'node:crypto';
import { readJsonFile, writeJsonFileAtomic, xivLocalPath } from './durable-json';
import {
  DM_LOCKS,
  HEARTBEAT_TTL_MS,
  HONESTY_BANNER,
  MAX_NEW_AGENTS_PER_CYCLE,
  MAX_OFFLINE_PACKS,
  MAX_WORKFORCE_AGENTS,
  NEW_AGENT_BOUNDED_NO_SELF_GRANT,
  NO_POWERED_NODE_WAITING_OR_STOPPED,
  OFFLINE_PACK_TAMPER_REJECTED,
  STALE_HEARTBEAT_NOT_RUNNING_VERIFIED,
  type DmActor,
  type WorkforceAgentStatus,
} from './global-neural-transit-civilization-atlas-types';

export type VerifiedAgentWorkforce = {
  id: string;
  orgId: string;
  tenantId: string;
  universeId: string;
  offlineFirst: true;
  newAgentsThisCycle: number;
  createdAt: string;
};

export type WorkforceNode = {
  id: string;
  workforceId: string;
  name: string;
  powered: boolean;
  authorized: boolean;
  lastHeartbeatAt: string | null;
  runtimeEvidence: string | null;
  createdAt: string;
  updatedAt: string;
};

export type WorkforceAgent = {
  id: string;
  workforceId: string;
  name: string;
  offlineFirst: true;
  nodeId: string | null;
  status: WorkforceAgentStatus;
  lastHeartbeatAt: string | null;
  runtimeEvidence: string | null;
  selfGrantProductionAuthorityAttempt: boolean;
  createdAt: string;
  updatedAt: string;
};

export type EncryptedOfflinePack = {
  id: string;
  workforceId: string;
  agentId: string;
  ciphertext: string;
  checksumSha256: string;
  status: 'SEALED' | 'REJECTED' | 'OPENED';
  reason: string;
  createdAt: string;
};

type Store = {
  workforces: VerifiedAgentWorkforce[];
  nodes: WorkforceNode[];
  agents: WorkforceAgent[];
  packs: EncryptedOfflinePack[];
};

function storePath(root: string) {
  return xivLocalPath(root, 'verified-offline-online-agent-workforce.json');
}

async function load(root: string): Promise<Store> {
  return readJsonFile<Store>(storePath(root), {
    workforces: [],
    nodes: [],
    agents: [],
    packs: [],
  });
}

async function save(root: string, store: Store) {
  await writeJsonFileAtomic(storePath(root), store);
}

function id(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

function checksum(payload: string): string {
  return createHash('sha256').update(payload).digest('hex');
}

function heartbeatFresh(at: string | null, nowMs = Date.now()): boolean {
  if (!at) return false;
  const ts = Date.parse(at);
  if (!Number.isFinite(ts)) return false;
  return nowMs - ts <= HEARTBEAT_TTL_MS;
}

export function verifiedAgentWorkforceHonesty() {
  return {
    banner: HONESTY_BANNER,
    offlineFirst: true,
    logicalAgentEqRunningVerified: DM_LOCKS.LOGICAL_AGENT_EQ_RUNNING_VERIFIED,
    runningVerifiedWithoutHeartbeat: DM_LOCKS.RUNNING_VERIFIED_WITHOUT_HEARTBEAT,
    staleHeartbeatNotRunningVerified: DM_LOCKS.STALE_HEARTBEAT_NOT_RUNNING_VERIFIED,
    noPoweredNodeYieldsWaitingOrStopped: DM_LOCKS.NO_POWERED_NODE_YIELDS_WAITING_OR_STOPPED,
    newAgentCreationBounded: DM_LOCKS.NEW_AGENT_CREATION_BOUNDED,
    learningEqPermission: DM_LOCKS.LEARNING_EQ_PERMISSION,
    selfGrantProductionAuthority: DM_LOCKS.SELF_GRANT_PRODUCTION_AUTHORITY,
    encryptedOfflinePackTamperReject: DM_LOCKS.ENCRYPTED_OFFLINE_PACK_TAMPER_REJECT,
    maxNewAgentsPerCycle: MAX_NEW_AGENTS_PER_CYCLE,
  };
}

export async function bootstrapVerifiedAgentWorkforce(input: {
  orgId: string;
  tenantId: string;
  universeId: string;
  root: string;
  actor: DmActor;
}): Promise<VerifiedAgentWorkforce> {
  void input.actor;
  const store = await load(input.root);
  const existing = store.workforces.find(
    (w) => w.orgId === input.orgId && w.tenantId === input.tenantId && w.universeId === input.universeId,
  );
  if (existing) return existing;
  const workforce: VerifiedAgentWorkforce = {
    id: id('dmwf'),
    orgId: input.orgId,
    tenantId: input.tenantId,
    universeId: input.universeId,
    offlineFirst: true,
    newAgentsThisCycle: 0,
    createdAt: new Date().toISOString(),
  };
  store.workforces.push(workforce);
  await save(input.root, store);
  return workforce;
}

export async function registerWorkforceNode(input: {
  workforceId: string;
  name: string;
  powered: boolean;
  authorized: boolean;
  root: string;
  actor: DmActor;
}): Promise<{ accepted: boolean; reason: string; node?: WorkforceNode; at: string }> {
  void input.actor;
  const store = await load(input.root);
  const now = new Date().toISOString();
  const workforce = store.workforces.find((w) => w.id === input.workforceId);
  if (!workforce) return { accepted: false, reason: 'WORKFORCE_NOT_FOUND', at: now };
  const node: WorkforceNode = {
    id: id('dmnode'),
    workforceId: input.workforceId,
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
  return { accepted: true, reason: 'WORKFORCE_NODE_REGISTERED', node, at: now };
}

export async function createWorkforceAgent(input: {
  workforceId: string;
  name: string;
  selfGrantProductionAuthority?: boolean;
  root: string;
  actor: DmActor;
}): Promise<{ accepted: boolean; reason: string; agent?: WorkforceAgent; at: string }> {
  void input.actor;
  const store = await load(input.root);
  const now = new Date().toISOString();
  const workforce = store.workforces.find((w) => w.id === input.workforceId);
  if (!workforce) return { accepted: false, reason: 'WORKFORCE_NOT_FOUND', at: now };

  if (input.selfGrantProductionAuthority === true) {
    const agent: WorkforceAgent = {
      id: id('dmagent'),
      workforceId: input.workforceId,
      name: input.name,
      offlineFirst: true,
      nodeId: null,
      status: 'DENIED',
      lastHeartbeatAt: null,
      runtimeEvidence: null,
      selfGrantProductionAuthorityAttempt: true,
      createdAt: now,
      updatedAt: now,
    };
    store.agents.push(agent);
    await save(input.root, store);
    return { accepted: false, reason: NEW_AGENT_BOUNDED_NO_SELF_GRANT, agent, at: now };
  }

  if (store.agents.filter((a) => a.workforceId === input.workforceId).length >= MAX_WORKFORCE_AGENTS) {
    return { accepted: false, reason: 'MAX_WORKFORCE_AGENTS_REACHED', at: now };
  }
  if (workforce.newAgentsThisCycle >= MAX_NEW_AGENTS_PER_CYCLE) {
    return { accepted: false, reason: NEW_AGENT_BOUNDED_NO_SELF_GRANT, at: now };
  }

  const agent: WorkforceAgent = {
    id: id('dmagent'),
    workforceId: input.workforceId,
    name: input.name.trim() || 'unnamed-agent',
    offlineFirst: true,
    nodeId: null,
    status: 'LOGICAL',
    lastHeartbeatAt: null,
    runtimeEvidence: null,
    selfGrantProductionAuthorityAttempt: false,
    createdAt: now,
    updatedAt: now,
  };
  workforce.newAgentsThisCycle += 1;
  store.agents.push(agent);
  await save(input.root, store);
  return { accepted: true, reason: 'BOUNDED_OFFLINE_FIRST_AGENT_CREATED', agent, at: now };
}

export async function scheduleWorkforceWithoutPoweredNode(input: {
  workforceId: string;
  root: string;
  actor: DmActor;
}): Promise<{ accepted: boolean; reason: string; status: WorkforceAgentStatus; at: string }> {
  void input.actor;
  const store = await load(input.root);
  const now = new Date().toISOString();
  const workforce = store.workforces.find((w) => w.id === input.workforceId);
  if (!workforce) {
    return { accepted: false, reason: 'WORKFORCE_NOT_FOUND', status: 'UNKNOWN', at: now };
  }
  const powered = store.nodes.some(
    (n) => n.workforceId === input.workforceId && n.powered && n.authorized,
  );
  if (!powered) {
    return {
      accepted: false,
      reason: NO_POWERED_NODE_WAITING_OR_STOPPED,
      status: 'WAITING_NODE',
      at: now,
    };
  }
  return {
    accepted: true,
    reason: 'POWERED_AUTHORIZED_NODE_AVAILABLE',
    status: 'REGISTERED',
    at: now,
  };
}

export async function recordWorkforceHeartbeat(input: {
  nodeId: string;
  runtimeEvidence: string;
  root: string;
  actor: DmActor;
  atIso?: string;
}): Promise<{ accepted: boolean; reason: string; node?: WorkforceNode; at: string }> {
  void input.actor;
  const store = await load(input.root);
  const now = input.atIso ?? new Date().toISOString();
  const node = store.nodes.find((n) => n.id === input.nodeId);
  if (!node) return { accepted: false, reason: 'NODE_NOT_FOUND', at: now };
  if (!node.powered || !node.authorized) {
    return { accepted: false, reason: 'NODE_NOT_POWERED_OR_UNAUTHORIZED', at: now };
  }
  if (!input.runtimeEvidence?.trim()) {
    return { accepted: false, reason: 'RUNTIME_EVIDENCE_REQUIRED', at: now };
  }
  node.lastHeartbeatAt = now;
  node.runtimeEvidence = input.runtimeEvidence.trim();
  node.updatedAt = now;
  await save(input.root, store);
  return { accepted: true, reason: 'HEARTBEAT_RECORDED', node, at: now };
}

export async function claimWorkforceRunningVerified(input: {
  agentId: string;
  nodeId?: string;
  allowStaleHeartbeat?: boolean;
  fabricateWithoutHeartbeat?: boolean;
  root: string;
  actor: DmActor;
  nowMs?: number;
}): Promise<{
  accepted: boolean;
  reason: string;
  status: WorkforceAgentStatus;
  agent?: WorkforceAgent;
  at: string;
}> {
  void input.actor;
  const store = await load(input.root);
  const now = new Date().toISOString();
  const nowMs = input.nowMs ?? Date.now();
  const agent = store.agents.find((a) => a.id === input.agentId);
  if (!agent) {
    return { accepted: false, reason: 'AGENT_NOT_FOUND', status: 'UNKNOWN', at: now };
  }

  if (input.fabricateWithoutHeartbeat === true) {
    agent.status = 'LOGICAL';
    agent.updatedAt = now;
    await save(input.root, store);
    return {
      accepted: false,
      reason: 'LOGICAL_OR_FABRICATED_NOT_RUNNING_VERIFIED',
      status: 'LOGICAL',
      agent,
      at: now,
    };
  }

  const nodeId = input.nodeId ?? agent.nodeId;
  if (!nodeId) {
    agent.status = 'WAITING_NODE';
    agent.updatedAt = now;
    await save(input.root, store);
    return {
      accepted: false,
      reason: NO_POWERED_NODE_WAITING_OR_STOPPED,
      status: 'WAITING_NODE',
      agent,
      at: now,
    };
  }

  const node = store.nodes.find((n) => n.id === nodeId);
  if (!node || !node.powered || !node.authorized) {
    agent.status = 'OFFLINE_STOPPED';
    agent.nodeId = nodeId;
    agent.updatedAt = now;
    await save(input.root, store);
    return {
      accepted: false,
      reason: NO_POWERED_NODE_WAITING_OR_STOPPED,
      status: 'OFFLINE_STOPPED',
      agent,
      at: now,
    };
  }

  const fresh = heartbeatFresh(node.lastHeartbeatAt, nowMs);
  if (!fresh || !node.runtimeEvidence || input.allowStaleHeartbeat === true) {
    agent.status = 'HEARTBEAT_STALE';
    agent.nodeId = nodeId;
    agent.lastHeartbeatAt = node.lastHeartbeatAt;
    agent.runtimeEvidence = node.runtimeEvidence;
    agent.updatedAt = now;
    await save(input.root, store);
    return {
      accepted: false,
      reason: STALE_HEARTBEAT_NOT_RUNNING_VERIFIED,
      status: 'HEARTBEAT_STALE',
      agent,
      at: now,
    };
  }

  agent.status = 'RUNNING_VERIFIED';
  agent.nodeId = nodeId;
  agent.lastHeartbeatAt = node.lastHeartbeatAt;
  agent.runtimeEvidence = node.runtimeEvidence;
  agent.updatedAt = now;
  await save(input.root, store);
  return {
    accepted: true,
    reason: 'RUNNING_VERIFIED_WITH_FRESH_HEARTBEAT_AND_RUNTIME_EVIDENCE',
    status: 'RUNNING_VERIFIED',
    agent,
    at: now,
  };
}

export async function sealEncryptedOfflinePack(input: {
  workforceId: string;
  agentId: string;
  plaintext: string;
  root: string;
  actor: DmActor;
}): Promise<{ accepted: boolean; reason: string; pack?: EncryptedOfflinePack; at: string }> {
  void input.actor;
  const store = await load(input.root);
  const now = new Date().toISOString();
  const workforce = store.workforces.find((w) => w.id === input.workforceId);
  if (!workforce) return { accepted: false, reason: 'WORKFORCE_NOT_FOUND', at: now };
  const agent = store.agents.find((a) => a.id === input.agentId);
  if (!agent) return { accepted: false, reason: 'AGENT_NOT_FOUND', at: now };
  if (store.packs.length >= MAX_OFFLINE_PACKS) {
    return { accepted: false, reason: 'MAX_OFFLINE_PACKS_REACHED', at: now };
  }
  const ciphertext = Buffer.from(input.plaintext, 'utf8').toString('base64');
  const pack: EncryptedOfflinePack = {
    id: id('dmpk'),
    workforceId: input.workforceId,
    agentId: input.agentId,
    ciphertext,
    checksumSha256: checksum(ciphertext),
    status: 'SEALED',
    reason: 'ENCRYPTED_OFFLINE_PACK_SEALED',
    createdAt: now,
  };
  store.packs.push(pack);
  await save(input.root, store);
  return { accepted: true, reason: pack.reason, pack, at: now };
}

export async function openEncryptedOfflinePack(input: {
  packId: string;
  expectedChecksum?: string;
  tamperedCiphertext?: string;
  root: string;
  actor: DmActor;
}): Promise<{ accepted: boolean; reason: string; pack?: EncryptedOfflinePack; at: string }> {
  void input.actor;
  const store = await load(input.root);
  const now = new Date().toISOString();
  const pack = store.packs.find((p) => p.id === input.packId);
  if (!pack) return { accepted: false, reason: 'PACK_NOT_FOUND', at: now };

  const material = input.tamperedCiphertext ?? pack.ciphertext;
  const digest = checksum(material);
  const expected = input.expectedChecksum ?? pack.checksumSha256;
  if (digest !== expected || Boolean(input.tamperedCiphertext)) {
    pack.status = 'REJECTED';
    pack.reason = OFFLINE_PACK_TAMPER_REJECTED;
    await save(input.root, store);
    return { accepted: false, reason: OFFLINE_PACK_TAMPER_REJECTED, pack, at: now };
  }

  pack.status = 'OPENED';
  pack.reason = 'ENCRYPTED_OFFLINE_PACK_CHECKSUM_OK';
  await save(input.root, store);
  return { accepted: true, reason: pack.reason, pack, at: now };
}
