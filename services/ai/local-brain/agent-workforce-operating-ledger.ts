/**
 * 62L-CI Agent Workforce Operating Ledger —
 * Persistent workforce ledger with truthful statuses.
 * RUNNING_VERIFIED is gated on heartbeat / runtime evidence.
 */

import { readJsonFile, writeJsonFileAtomic, xivLocalPath } from './durable-json';
import {
  CI_LOCKS,
  HONESTY_BANNER,
  NO_HEARTBEAT_NOT_RUNNING_VERIFIED,
  RUNNING_VERIFIED_REQUIRES_HEARTBEAT,
  type CiActor,
  type WorkforceStatus,
} from './persistent-intelligence-economy-types';

export type WorkforceAgent = {
  id: string;
  name: string;
  orgId: string;
  tenantId: string;
  status: WorkforceStatus;
  lastHeartbeatAt: string | null;
  runtimeEvidence: string | null;
  permissionLevel: number;
  createdAt: string;
  updatedAt: string;
};

export type WorkforceActionResult = {
  accepted: boolean;
  reason: string;
  agent?: WorkforceAgent;
  at: string;
};

type Store = { agents: WorkforceAgent[] };

function storePath(root: string) {
  return xivLocalPath(root, 'agent-workforce-operating-ledger.json');
}

async function load(root: string): Promise<Store> {
  return readJsonFile<Store>(storePath(root), { agents: [] });
}

async function save(root: string, store: Store) {
  await writeJsonFileAtomic(storePath(root), store);
}

function id(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

const HEARTBEAT_TTL_MS = 60_000;

export function workforceHonesty() {
  return {
    banner: HONESTY_BANNER,
    l4AutonomyEnabled: CI_LOCKS.L4_AUTONOMY_ENABLED,
    runningVerifiedWithoutHeartbeat: CI_LOCKS.RUNNING_VERIFIED_WITHOUT_HEARTBEAT,
    runningVerifiedRequiresHeartbeat: true,
  };
}

export async function registerWorkforceAgent(input: {
  name: string;
  orgId: string;
  tenantId: string;
  root: string;
  actor: CiActor;
}): Promise<WorkforceActionResult> {
  const store = await load(input.root);
  const now = new Date().toISOString();
  const agent: WorkforceAgent = {
    id: id('wf'),
    name: input.name,
    orgId: input.orgId,
    tenantId: input.tenantId,
    status: 'REGISTERED',
    lastHeartbeatAt: null,
    runtimeEvidence: null,
    permissionLevel: Math.max(0, input.actor.permissionLevel),
    createdAt: now,
    updatedAt: now,
  };
  store.agents.push(agent);
  await save(input.root, store);
  return { accepted: true, reason: 'WORKFORCE_AGENT_REGISTERED', agent, at: now };
}

export async function recordAgentHeartbeat(input: {
  agentId: string;
  runtimeEvidence: string;
  root: string;
  actor: CiActor;
}): Promise<WorkforceActionResult> {
  const store = await load(input.root);
  const agent = store.agents.find((a) => a.id === input.agentId);
  if (!agent) {
    return { accepted: false, reason: 'AGENT_NOT_FOUND', at: new Date().toISOString() };
  }
  if (!input.runtimeEvidence || !input.runtimeEvidence.trim()) {
    return {
      accepted: false,
      reason: RUNNING_VERIFIED_REQUIRES_HEARTBEAT,
      agent,
      at: new Date().toISOString(),
    };
  }
  const now = new Date().toISOString();
  agent.lastHeartbeatAt = now;
  agent.runtimeEvidence = input.runtimeEvidence.trim();
  agent.status = 'RUNNING_VERIFIED';
  agent.updatedAt = now;
  await save(input.root, store);
  return { accepted: true, reason: 'HEARTBEAT_RECORDED_RUNNING_VERIFIED', agent, at: now };
}

/**
 * Claim RUNNING_VERIFIED without fresh heartbeat/runtime evidence → DENIED.
 */
export async function claimRunningVerified(input: {
  agentId: string;
  root: string;
  actor: CiActor;
  nowMs?: number;
}): Promise<WorkforceActionResult> {
  const store = await load(input.root);
  const agent = store.agents.find((a) => a.id === input.agentId);
  const now = new Date().toISOString();
  if (!agent) {
    return { accepted: false, reason: 'AGENT_NOT_FOUND', at: now };
  }

  const hasHeartbeat = Boolean(agent.lastHeartbeatAt && agent.runtimeEvidence);
  if (!hasHeartbeat) {
    agent.status = 'REGISTERED';
    agent.updatedAt = now;
    await save(input.root, store);
    return {
      accepted: false,
      reason: NO_HEARTBEAT_NOT_RUNNING_VERIFIED,
      agent,
      at: now,
    };
  }

  const hbMs = Date.parse(agent.lastHeartbeatAt!);
  const clock = input.nowMs ?? Date.now();
  if (!Number.isFinite(hbMs) || clock - hbMs > HEARTBEAT_TTL_MS) {
    agent.status = 'HEARTBEAT_STALE';
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
    reason: RUNNING_VERIFIED_REQUIRES_HEARTBEAT,
    agent,
    at: now,
  };
}

export function isRunningVerified(agent: WorkforceAgent, nowMs = Date.now()): boolean {
  if (agent.status !== 'RUNNING_VERIFIED') return false;
  if (!agent.lastHeartbeatAt || !agent.runtimeEvidence) return false;
  const hbMs = Date.parse(agent.lastHeartbeatAt);
  return Number.isFinite(hbMs) && nowMs - hbMs <= HEARTBEAT_TTL_MS;
}
