import { getMeshNode } from './mesh-node-registry';
import { MESH_HONESTY } from './distributed-mesh-types';
import { readJsonFile, writeJsonFileAtomic, xivLocalPath } from './cortex-store';

export type ResourceKind = 'cpu_slots' | 'workcells' | 'pack_bytes' | 'messages';

export type NodeBudget = {
  nodeId: string;
  tenantId: string;
  universeId: string;
  limits: Record<ResourceKind, number>;
  used: Record<ResourceKind, number>;
};

type Store = { budgets: NodeBudget[] };

const DEFAULT_LIMITS: Record<ResourceKind, number> = {
  cpu_slots: 4,
  workcells: 8,
  pack_bytes: 1_000_000,
  messages: 1_000,
};

function storePath(root: string) {
  return xivLocalPath(root, 'mesh-resource-governance.json');
}

async function load(root: string) {
  const parsed = await readJsonFile<Store>(storePath(root), { budgets: [] });
  return Array.isArray(parsed.budgets) ? parsed.budgets : [];
}

async function save(root: string, budgets: NodeBudget[]) {
  await writeJsonFileAtomic(storePath(root), { budgets: budgets.slice(-2_000) });
}

export async function ensureNodeBudget(input: {
  nodeId: string;
  tenantId: string;
  universeId: string;
  root?: string;
}) {
  const node = await getMeshNode(input.nodeId, input.tenantId, input.universeId, input.root);
  if (!node) throw new Error('MESH_NODE_NOT_FOUND');
  const root = input.root ?? process.cwd();
  const budgets = await load(root);
  let budget = budgets.find((item) => item.nodeId === input.nodeId);
  if (!budget) {
    budget = {
      nodeId: input.nodeId,
      tenantId: input.tenantId,
      universeId: input.universeId,
      limits: { ...DEFAULT_LIMITS },
      used: { cpu_slots: 0, workcells: 0, pack_bytes: 0, messages: 0 },
    };
    budgets.push(budget);
    await save(root, budgets);
  }
  return budget;
}

export async function consumeNodeResource(input: {
  nodeId: string;
  tenantId: string;
  universeId: string;
  kind: ResourceKind;
  units: number;
  root?: string;
}) {
  const root = input.root ?? process.cwd();
  await ensureNodeBudget(input);
  const budgets = await load(root);
  const budget = budgets.find((item) => item.nodeId === input.nodeId);
  if (!budget) throw new Error('MESH_BUDGET_NOT_FOUND');
  if (input.units < 0) throw new Error('RESOURCE_UNITS_MUST_BE_NON_NEGATIVE');
  if (budget.used[input.kind] + input.units > budget.limits[input.kind]) {
    return {
      allowed: false as const,
      state: 'DENIED' as const,
      reason: `Distributed resource ${input.kind} would exceed node budget.`,
      budget,
      honesty: MESH_HONESTY,
    };
  }
  budget.used[input.kind] += input.units;
  await save(root, budgets);
  return {
    allowed: true as const,
    state: 'PASS' as const,
    reason: 'Resource consumed within bounded node budget.',
    budget,
    honesty: MESH_HONESTY,
  };
}

export async function expandOwnBudget(_input: { nodeId: string }) {
  return {
    allowed: false as const,
    state: 'DENIED' as const,
    reason: 'Nodes cannot expand their own distributed resource limits.',
    honesty: MESH_HONESTY,
  };
}
