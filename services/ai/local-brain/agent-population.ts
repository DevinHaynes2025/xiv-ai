import { randomUUID } from 'node:crypto';
import type { MeshAgentRole } from './agent-mesh';

export type AgentInstanceState = 'HIBERNATING' | 'READY' | 'RUNNING' | 'BLOCKED' | 'RETIRED';

export type AgentInstance = {
  id: string;
  role: MeshAgentRole;
  state: AgentInstanceState;
  tenantId: string;
  universeId: string;
  taskId?: string;
  createdAt: string;
  expiresAt?: string;
  lineage: string[];
  authorityLevel: 'L0' | 'L1' | 'L2' | 'L3';
  productionAuthorized: false;
  canCreateAgents: false;
  canExpandPermissions: false;
};

const MAX_ACTIVE_INSTANCES = 32;
const MAX_INSTANCES_PER_ROLE = 4;
const MAX_REGISTERED_INSTANCES = 256;
const MAX_LINEAGE_DEPTH = 16;
const instances = new Map<string, AgentInstance>();

const transitions: Record<AgentInstanceState, AgentInstanceState[]> = {
  HIBERNATING: ['READY', 'RETIRED'],
  READY: ['RUNNING', 'HIBERNATING', 'BLOCKED', 'RETIRED'],
  RUNNING: ['READY', 'HIBERNATING', 'BLOCKED', 'RETIRED'],
  BLOCKED: ['READY', 'RETIRED'],
  RETIRED: [],
};

function active(instance: AgentInstance) {
  return instance.state === 'READY' || instance.state === 'RUNNING';
}

export function listAgentInstances() {
  return [...instances.values()];
}

export function populationStats() {
  const all = listAgentInstances();
  return {
    totalRegistered: all.length,
    active: all.filter(active).length,
    hibernating: all.filter((agent) => agent.state === 'HIBERNATING').length,
    blocked: all.filter((agent) => agent.state === 'BLOCKED').length,
    retired: all.filter((agent) => agent.state === 'RETIRED').length,
    hardActiveLimit: MAX_ACTIVE_INSTANCES,
    hardRegisteredLimit: MAX_REGISTERED_INSTANCES,
    productionAuthorization: false as const,
  };
}

export function resetAgentPopulation() {
  instances.clear();
}

export function requestAgentInstance(input: {
  role: MeshAgentRole;
  tenantId: string;
  universeId: string;
  taskId?: string;
  ttlMinutes?: number;
  lineage?: string[];
  now?: number;
}) {
  if (!input.tenantId || !input.universeId) return { created: false as const, reason: 'Tenant and Universe are required.' };
  const lineage = input.lineage ?? [];
  if (lineage.length > MAX_LINEAGE_DEPTH) return { created: false as const, reason: 'Agent lineage depth budget reached.' };
  if (new Set(lineage).size !== lineage.length) return { created: false as const, reason: 'Recursive agent lineage denied.' };

  reapExpiredAgents(input.now ?? Date.now());
  const all = listAgentInstances();
  const reusable = all.find((agent) => agent.role === input.role && agent.tenantId === input.tenantId && agent.universeId === input.universeId && agent.state === 'HIBERNATING');
  if (reusable) {
    if (all.filter(active).length >= MAX_ACTIVE_INSTANCES) return { created: false as const, reason: 'Global local-agent active budget reached.' };
    if (all.filter((agent) => agent.role === input.role && active(agent)).length >= MAX_INSTANCES_PER_ROLE) {
      return { created: false as const, reason: `Per-role active budget reached for ${input.role}.` };
    }
    reusable.state = 'READY';
    reusable.taskId = input.taskId;
    reusable.expiresAt = new Date((input.now ?? Date.now()) + Math.max(5, Math.min(input.ttlMinutes ?? 30, 240)) * 60_000).toISOString();
    return { created: false as const, reused: true as const, instance: reusable, reason: 'Reused hibernating specialist.' };
  }
  if (all.length >= MAX_REGISTERED_INSTANCES) return { created: false as const, reason: 'Global registered-agent budget reached.' };
  if (all.filter(active).length >= MAX_ACTIVE_INSTANCES) return { created: false as const, reason: 'Global local-agent active budget reached.' };
  if (all.filter((agent) => agent.role === input.role && active(agent)).length >= MAX_INSTANCES_PER_ROLE) return { created: false as const, reason: `Per-role active budget reached for ${input.role}.` };

  const ttl = Math.max(5, Math.min(input.ttlMinutes ?? 30, 240));
  const now = input.now ?? Date.now();
  const instance: AgentInstance = {
    id: `agent_${randomUUID()}`,
    role: input.role,
    state: 'READY',
    tenantId: input.tenantId,
    universeId: input.universeId,
    taskId: input.taskId,
    createdAt: new Date(now).toISOString(),
    expiresAt: new Date(now + ttl * 60_000).toISOString(),
    lineage: lineage.slice(-MAX_LINEAGE_DEPTH),
    authorityLevel: 'L1',
    productionAuthorized: false,
    canCreateAgents: false,
    canExpandPermissions: false,
  };
  instances.set(instance.id, instance);
  return { created: true as const, reused: false as const, instance };
}

export function setAgentState(id: string, state: AgentInstanceState) {
  const instance = instances.get(id);
  if (!instance) throw new Error('Agent instance not found.');
  if (!transitions[instance.state].includes(state)) throw new Error(`Invalid agent state transition ${instance.state} -> ${state}`);
  instance.state = state;
  instances.set(id, instance);
  return instance;
}

export function reapExpiredAgents(now = Date.now()) {
  let retired = 0;
  for (const instance of instances.values()) {
    if (instance.expiresAt && Date.parse(instance.expiresAt) <= now && instance.state !== 'RETIRED') {
      instance.state = 'RETIRED';
      retired += 1;
    }
  }
  return retired;
}
