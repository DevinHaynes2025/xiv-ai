import type { MeshAgentRole } from './agent-mesh';

export type AgentInstanceState = 'HIBERNATING' | 'READY' | 'RUNNING' | 'BLOCKED' | 'RETIRED';

export type AgentInstance = {
  id: string;
  role: MeshAgentRole;
  state: AgentInstanceState;
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
const instances = new Map<string, AgentInstance>();

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
  };
}

export function requestAgentInstance(input: { role: MeshAgentRole; taskId?: string; ttlMinutes?: number; lineage?: string[] }) {
  const all = listAgentInstances();
  if (all.filter(active).length >= MAX_ACTIVE_INSTANCES) {
    return { created: false as const, reason: 'Global local-agent active budget reached.' };
  }
  if (all.filter((agent) => agent.role === input.role && active(agent)).length >= MAX_INSTANCES_PER_ROLE) {
    return { created: false as const, reason: `Per-role active budget reached for ${input.role}.` };
  }

  const ttl = Math.max(5, Math.min(input.ttlMinutes ?? 30, 240));
  const now = Date.now();
  const instance: AgentInstance = {
    id: `agent_${input.role}_${now.toString(36)}_${Math.random().toString(36).slice(2, 7)}`,
    role: input.role,
    state: 'READY',
    taskId: input.taskId,
    createdAt: new Date(now).toISOString(),
    expiresAt: new Date(now + ttl * 60_000).toISOString(),
    lineage: (input.lineage ?? []).slice(-16),
    authorityLevel: 'L1',
    productionAuthorized: false,
    canCreateAgents: false,
    canExpandPermissions: false,
  };
  instances.set(instance.id, instance);
  return { created: true as const, instance };
}

export function setAgentState(id: string, state: AgentInstanceState) {
  const instance = instances.get(id);
  if (!instance) throw new Error('Agent instance not found.');
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
