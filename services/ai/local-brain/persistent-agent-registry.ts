import { requestAgentInstance, resetAgentPopulation, setAgentState, listAgentInstances, type AgentInstanceState } from './agent-population';
import type { MeshAgentRole } from './agent-mesh';
import { planDemandAgents } from './demand-agent-planner';
import { cortexId, readJsonFile, writeJsonFileAtomic, xivLocalPath } from './cortex-store';

export const SOCIETY_REGISTRY_FILE = 'agent-society-registry.json';

export type SocietyDepartment =
  | 'coding'
  | 'testing'
  | 'security'
  | 'research'
  | 'business'
  | 'infrastructure'
  | 'historical_cultural'
  | 'quant_simulation';

export const DEPARTMENT_ROLES: Record<SocietyDepartment, MeshAgentRole[]> = {
  coding: ['architect', 'coder', 'skeptic'],
  testing: ['tester', 'evidence_verifier', 'skeptic'],
  security: ['security', 'skeptic', 'evidence_verifier'],
  research: ['researcher', 'skeptic', 'evidence_verifier'],
  business: ['business_analyst', 'finance_analyst', 'operations_analyst', 'skeptic'],
  infrastructure: ['operations_analyst', 'architect', 'security', 'skeptic'],
  historical_cultural: ['culture_historian', 'researcher', 'skeptic', 'evidence_verifier'],
  quant_simulation: ['finance_analyst', 'researcher', 'skeptic', 'decision_strategist'],
};

export type PersistentSocietyAgent = {
  id: string;
  role: MeshAgentRole;
  department: SocietyDepartment;
  state: AgentInstanceState;
  tenantId: string;
  universeId: string;
  skillScore: number;
  skillUpdates: number;
  productionAuthorized: false;
  l4AutonomyEnabled: false;
  founderImpersonation: false;
  canExpandPermissions: false;
  createdAt: string;
  updatedAt: string;
};

type Store = { agents: PersistentSocietyAgent[]; recoveredRestarts: number };

function pathFor(root: string) {
  return xivLocalPath(root, SOCIETY_REGISTRY_FILE);
}

async function load(root: string): Promise<Store> {
  const parsed = await readJsonFile<Store>(pathFor(root), { agents: [], recoveredRestarts: 0 });
  return {
    agents: Array.isArray(parsed.agents) ? parsed.agents : [],
    recoveredRestarts: typeof parsed.recoveredRestarts === 'number' ? parsed.recoveredRestarts : 0,
  };
}

async function save(root: string, store: Store) {
  await writeJsonFileAtomic(pathFor(root), {
    agents: store.agents.slice(-2_000),
    recoveredRestarts: store.recoveredRestarts,
  });
}

function clamp01(value: number) {
  return Math.max(0, Math.min(1, value));
}

export async function registerDepartmentAgents(input: {
  tenantId: string;
  universeId: string;
  department: SocietyDepartment;
  approved?: boolean;
  root?: string;
}) {
  if (!input.tenantId || !input.universeId) throw new Error('TENANT_AND_UNIVERSE_REQUIRED');
  const root = input.root ?? process.cwd();
  const demand = planDemandAgents({
    tenantId: input.tenantId,
    universeId: input.universeId,
    taskId: `society:${input.department}`,
    requestedRoles: DEPARTMENT_ROLES[input.department],
    consequence: 'LOW',
    approved: input.approved ?? true,
  });
  const store = await load(root);
  const registered: PersistentSocietyAgent[] = [];
  if (demand.status !== 'PLANNED') {
    return { status: demand.status, agents: registered, productionAuthorization: false as const };
  }
  const now = new Date().toISOString();
  for (const result of demand.agents) {
    const instance = 'instance' in result ? result.instance : undefined;
    if (!instance) continue;
    const existing = store.agents.find(
      (agent) => agent.id === instance.id && agent.tenantId === input.tenantId && agent.universeId === input.universeId,
    );
    if (existing) {
      existing.state = instance.state;
      existing.updatedAt = now;
      registered.push(existing);
      continue;
    }
    const record: PersistentSocietyAgent = {
      id: instance.id,
      role: instance.role,
      department: input.department,
      state: instance.state,
      tenantId: input.tenantId,
      universeId: input.universeId,
      skillScore: 0.5,
      skillUpdates: 0,
      productionAuthorized: false,
      l4AutonomyEnabled: false,
      founderImpersonation: false,
      canExpandPermissions: false,
      createdAt: now,
      updatedAt: now,
    };
    store.agents.push(record);
    registered.push(record);
  }
  await save(root, store);
  return { status: 'REGISTERED' as const, agents: registered, productionAuthorization: false as const };
}

export async function markSocietyAgentState(input: {
  agentId: string;
  tenantId: string;
  universeId: string;
  state: AgentInstanceState;
  root?: string;
}) {
  const root = input.root ?? process.cwd();
  const store = await load(root);
  const agent = store.agents.find(
    (item) => item.id === input.agentId && item.tenantId === input.tenantId && item.universeId === input.universeId,
  );
  if (!agent) return { updated: false as const };
  agent.state = input.state;
  agent.updatedAt = new Date().toISOString();
  await save(root, store);
  try {
    setAgentState(agent.id, input.state);
  } catch {
    /* registry remains source of truth after restart */
  }
  return { updated: true as const, agent };
}

export async function recoverSocietyRegistry(input: { tenantId?: string; universeId?: string; root?: string }) {
  const root = input.root ?? process.cwd();
  const store = await load(root);
  let recovered = 0;
  for (const agent of store.agents) {
    if (input.tenantId && agent.tenantId !== input.tenantId) continue;
    if (input.universeId && agent.universeId !== input.universeId) continue;
    if (agent.state === 'RUNNING' || agent.state === 'BLOCKED') {
      agent.state = 'READY';
      agent.updatedAt = new Date().toISOString();
      recovered += 1;
      try {
        const live = listAgentInstances().find((item) => item.id === agent.id);
        if (live && (live.state === 'RUNNING' || live.state === 'BLOCKED')) setAgentState(agent.id, 'READY');
      } catch {
        requestAgentInstance({
          role: agent.role,
          tenantId: agent.tenantId,
          universeId: agent.universeId,
          taskId: `recover:${agent.department}`,
        });
      }
    }
  }
  if (recovered) store.recoveredRestarts += recovered;
  await save(root, store);
  return { recovered, recoveredRestarts: store.recoveredRestarts, productionAuthorization: false as const };
}

export async function hydrateSocietyRegistry(root = process.cwd()) {
  const store = await load(root);
  resetAgentPopulation();
  for (const agent of store.agents) {
    if (agent.state === 'RETIRED') continue;
    requestAgentInstance({
      role: agent.role,
      tenantId: agent.tenantId,
      universeId: agent.universeId,
      taskId: `hydrate:${agent.department}`,
    });
  }
  return store;
}

export async function updateAgentSkill(input: {
  agentId: string;
  tenantId: string;
  universeId: string;
  delta: number;
  evidenceRefs: string[];
  agentCountDelta?: number;
  root?: string;
}) {
  const root = input.root ?? process.cwd();
  const store = await load(root);
  const agent = store.agents.find(
    (item) => item.id === input.agentId && item.tenantId === input.tenantId && item.universeId === input.universeId,
  );
  if (!agent) return { updated: false as const, reason: 'AGENT_NOT_FOUND' };
  if (!input.evidenceRefs.length) {
    return { updated: false as const, reason: 'SKILL_UPDATE_REQUIRES_EVIDENCE', agent };
  }
  const ignoredPopulation = input.agentCountDelta ?? 0;
  agent.skillScore = clamp01(agent.skillScore + input.delta);
  agent.skillUpdates += 1;
  agent.updatedAt = new Date().toISOString();
  await save(root, store);
  return {
    updated: true as const,
    agent,
    ignoredPopulationDelta: ignoredPopulation,
    skillUsesAgentCount: false as const,
  };
}

export async function listSocietyAgents(tenantId: string, universeId: string, root = process.cwd()) {
  const store = await load(root);
  return store.agents.filter((agent) => agent.tenantId === tenantId && agent.universeId === universeId);
}

export async function societyRegistryStats(tenantId: string, universeId: string, root = process.cwd()) {
  const agents = await listSocietyAgents(tenantId, universeId, root);
  const store = await load(root);
  const byDepartment = Object.fromEntries(
    (Object.keys(DEPARTMENT_ROLES) as SocietyDepartment[]).map((department) => [
      department,
      agents.filter((agent) => agent.department === department).length,
    ]),
  ) as Record<SocietyDepartment, number>;
  return {
    total: agents.length,
    byDepartment,
    recoveredRestarts: store.recoveredRestarts,
    meanSkill: agents.length ? agents.reduce((sum, agent) => sum + agent.skillScore, 0) / agents.length : 0,
    smarterBecauseMoreAgents: false as const,
    l4AutonomyEnabled: false as const,
    productionAuthorization: false as const,
    registryId: cortexId('regstat'),
  };
}
