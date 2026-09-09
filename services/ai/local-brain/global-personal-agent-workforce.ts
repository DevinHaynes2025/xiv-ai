/**
 * 62L-DF Global Personal Agent Workforce —
 * Personal/business agent workforce surfaces with truthful status.
 * RUNNING_VERIFIED requires heartbeat evidence.
 */

import { readJsonFile, writeJsonFileAtomic, xivLocalPath } from './durable-json';
import {
  DF_LOCKS,
  HEARTBEAT_TTL_MS,
  HONESTY_BANNER,
  MAX_WORKFORCE_AGENTS,
  NO_HEARTBEAT_NOT_RUNNING_VERIFIED,
  type DfActor,
  type WorkforceAgentStatus,
} from './human-centered-superbrain-ux-types';

export type WorkforceAgent = {
  id: string;
  workforceId: string;
  name: string;
  universeKind: 'personal' | 'business';
  status: WorkforceAgentStatus;
  lastHeartbeatAt: string | null;
  runtimeEvidence: string | null;
  logical: true;
  createdAt: string;
  updatedAt: string;
};

export type AgentWorkforce = {
  id: string;
  orgId: string;
  tenantId: string;
  universeId: string;
  createdAt: string;
};

type Store = { workforces: AgentWorkforce[]; agents: WorkforceAgent[] };

function storePath(root: string) {
  return xivLocalPath(root, 'global-personal-agent-workforce.json');
}

async function load(root: string): Promise<Store> {
  return readJsonFile<Store>(storePath(root), { workforces: [], agents: [] });
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

export function globalPersonalAgentWorkforceHonesty() {
  return {
    banner: HONESTY_BANNER,
    runningVerifiedWithoutHeartbeat: DF_LOCKS.RUNNING_VERIFIED_WITHOUT_HEARTBEAT,
    logicalAutoRunningVerified: DF_LOCKS.LOGICAL_AUTO_RUNNING_VERIFIED,
    productionAuthorization: DF_LOCKS.PRODUCTION_AUTHORIZATION,
  };
}

export async function bootstrapAgentWorkforce(input: {
  orgId: string;
  tenantId: string;
  universeId: string;
  root: string;
  actor: DfActor;
}): Promise<AgentWorkforce> {
  void input.actor;
  const store = await load(input.root);
  const existing = store.workforces.find(
    (w) =>
      w.orgId === input.orgId &&
      w.tenantId === input.tenantId &&
      w.universeId === input.universeId,
  );
  if (existing) return existing;
  const workforce: AgentWorkforce = {
    id: id('dfwf'),
    orgId: input.orgId,
    tenantId: input.tenantId,
    universeId: input.universeId,
    createdAt: new Date().toISOString(),
  };
  store.workforces.push(workforce);
  await save(input.root, store);
  return workforce;
}

export async function registerWorkforceAgent(input: {
  workforceId: string;
  name: string;
  universeKind?: 'personal' | 'business';
  root: string;
  actor: DfActor;
}): Promise<{ accepted: boolean; reason: string; agent?: WorkforceAgent; at: string }> {
  void input.actor;
  const store = await load(input.root);
  const now = new Date().toISOString();
  const workforce = store.workforces.find((w) => w.id === input.workforceId);
  if (!workforce) return { accepted: false, reason: 'WORKFORCE_NOT_FOUND', at: now };
  if (store.agents.length >= MAX_WORKFORCE_AGENTS) {
    return { accepted: false, reason: 'MAX_WORKFORCE_AGENTS_BOUNDED', at: now };
  }
  const agent: WorkforceAgent = {
    id: id('dfag'),
    workforceId: workforce.id,
    name: input.name.trim() || 'unnamed-agent',
    universeKind: input.universeKind ?? 'personal',
    status: 'REGISTERED',
    lastHeartbeatAt: null,
    runtimeEvidence: null,
    logical: true,
    createdAt: now,
    updatedAt: now,
  };
  store.agents.push(agent);
  await save(input.root, store);
  return { accepted: true, reason: 'WORKFORCE_AGENT_REGISTERED_LOGICAL', agent, at: now };
}

export async function recordWorkforceAgentHeartbeat(input: {
  agentId: string;
  runtimeEvidence?: string | null;
  root: string;
  actor: DfActor;
}): Promise<{ accepted: boolean; reason: string; agent?: WorkforceAgent; at: string }> {
  void input.actor;
  const store = await load(input.root);
  const now = new Date().toISOString();
  const agent = store.agents.find((a) => a.id === input.agentId);
  if (!agent) return { accepted: false, reason: 'AGENT_NOT_FOUND', at: now };
  agent.lastHeartbeatAt = now;
  agent.runtimeEvidence = input.runtimeEvidence?.trim() || agent.runtimeEvidence;
  agent.status = 'LOGICAL';
  agent.updatedAt = now;
  await save(input.root, store);
  return { accepted: true, reason: 'WORKFORCE_AGENT_HEARTBEAT_RECORDED', agent, at: now };
}

export async function claimWorkforceAgentRunningVerified(input: {
  agentId: string;
  root: string;
  actor: DfActor;
}): Promise<{ accepted: boolean; reason: string; agent?: WorkforceAgent; at: string }> {
  void input.actor;
  const store = await load(input.root);
  const now = new Date().toISOString();
  const nowMs = Date.now();
  const agent = store.agents.find((a) => a.id === input.agentId);
  if (!agent) return { accepted: false, reason: 'AGENT_NOT_FOUND', at: now };

  if (!heartbeatFresh(agent.lastHeartbeatAt, nowMs) || !agent.runtimeEvidence) {
    agent.status = agent.lastHeartbeatAt ? 'HEARTBEAT_STALE' : 'LOGICAL';
    agent.updatedAt = now;
    await save(input.root, store);
    return {
      accepted: false,
      reason: NO_HEARTBEAT_NOT_RUNNING_VERIFIED,
      agent,
      at: now,
    };
  }

  agent.status = 'RUNNING_VERIFIED';
  agent.updatedAt = now;
  await save(input.root, store);
  return {
    accepted: true,
    reason: 'WORKFORCE_AGENT_RUNNING_VERIFIED_WITH_HEARTBEAT_EVIDENCE',
    agent,
    at: now,
  };
}

export function uxWorkforceSurfaceStatus(agent: WorkforceAgent): WorkforceAgentStatus {
  if (agent.status === 'RUNNING_VERIFIED') {
    if (!heartbeatFresh(agent.lastHeartbeatAt) || !agent.runtimeEvidence) {
      return 'HEARTBEAT_STALE';
    }
    return 'RUNNING_VERIFIED';
  }
  return agent.status;
}
